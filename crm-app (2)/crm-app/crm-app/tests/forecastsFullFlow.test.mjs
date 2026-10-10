import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  FORECAST_REVENUE_TYPES,
  FORECAST_PERIOD_TYPES,
  QUARTERS,
  FULL_MONTHS,
  ANNUAL_PERIODS,
  fmtINR2,
  getPeriodBounds,
  getNextPeriod,
  evaluateDealAnomalies,
  buildOrganizationHierarchy,
  resolveHierarchyTargets,
  resolveTargetForScope,
  calculateForecastMetrics,
  calculateAnnualSubPeriods,
} from '../src/utils/forecastCalculations.js';
import { USERS, buildSeed } from '../src/data/seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const seed = buildSeed();
const SEED_FORECASTS = seed.forecasts;
const SEED_DEALS = seed.deals;
const SEED_USERS = USERS;

console.log('--- STARTING FORECASTS CREATE-TO-SAVE-TO-VIEW FULL FLOW TEST SUITE ---');

// Test 1: Quarterly, Monthly, and Annual period support and rollover
console.log('Test 1: Quarterly, Monthly, and Annual period bounds and rollover');
assert.deepEqual(FORECAST_PERIOD_TYPES, ['Quarterly', 'Monthly', 'Annual']);
assert.equal(ANNUAL_PERIODS.length, 1);
assert.equal(ANNUAL_PERIODS[0].key, 'FY');

const annualBounds = getPeriodBounds('Annual', 2026, 'FY');
assert.equal(annualBounds.from, '2026-01-01');
assert.equal(annualBounds.to, '2026-12-31');
assert.equal(annualBounds.shortLabel, 'FY 2026');

const nextAnnual = getNextPeriod('Annual', 2026, 'FY');
assert.equal(nextAnnual.year, 2027);
assert.equal(nextAnnual.periodKey, 'FY');

const nextQ4 = getNextPeriod('Quarterly', 2026, 'Q4');
assert.equal(nextQ4.year, 2027);
assert.equal(nextQ4.periodKey, 'Q1');

const nextM12 = getNextPeriod('Monthly', 2026, 'M12');
assert.equal(nextM12.year, 2027);
assert.equal(nextM12.periodKey, 'M01');
console.log('✓ Quarterly, Monthly, and Annual period bounds and rollover verified');

// Test 2: Organization Hierarchy builder from real CRM users
console.log('Test 2: buildOrganizationHierarchy constructs Company -> Role/Team -> User hierarchy from real users');
const hierarchy = buildOrganizationHierarchy(SEED_USERS);
assert.equal(hierarchy.companyId, 'ORG');
assert.equal(hierarchy.totalMembers, SEED_USERS.length);
assert.ok(hierarchy.teams.length >= 2, 'Should group users into real role teams');
const totalUsersInRoles = hierarchy.teams.reduce((sum, t) => sum + t.members.length, 0);
assert.equal(totalUsersInRoles, SEED_USERS.length, 'Every real user must belong to a role branch');
console.log('✓ Organization hierarchy accurately reflects real CRM users and roles');

// Test 3: Hierarchy target calculation & double-counting prevention
console.log('Test 3: resolveHierarchyTargets calculates parent targets from children and prevents double counting');
// Case A: Only user targets entered -> Role and Company targets auto-calculate from children
const userOnlyInputs = {
  'USER:u1': '200000',
  'USER:u2': '100000',
  'USER:u3': '50000',
};
const resolvedA = resolveHierarchyTargets(userOnlyInputs, SEED_USERS);
assert.equal(resolvedA.isValid, true);
const smTeamA = resolvedA.teams.find((t) => t.id === 'ROLE:Sales Manager');
const aeTeamA = resolvedA.teams.find((t) => t.id === 'ROLE:Account Executive');
assert.equal(smTeamA.effectiveTarget, 200000);
assert.equal(smTeamA.mode, 'calculated');
assert.equal(aeTeamA.effectiveTarget, 150000);
assert.equal(aeTeamA.mode, 'calculated');
assert.equal(resolvedA.companyEffectiveTarget, 350000);
assert.equal(resolvedA.companyMode, 'calculated');
assert.equal(resolvedA.companyChildrenSum, 350000);

// Case B: Parent role manually overridden -> Does NOT add manual parent on top of children (no double counting!)
const manualRoleOverrideInputs = {
  ...userOnlyInputs,
  'ROLE:Account Executive': '220000', // Manual override for Account Executive team (children u2+u3 sum to 150000)
};
const resolvedB = resolveHierarchyTargets(manualRoleOverrideInputs, SEED_USERS);
const aeTeamB = resolvedB.teams.find((t) => t.id === 'ROLE:Account Executive');
assert.equal(aeTeamB.effectiveTarget, 220000);
assert.equal(aeTeamB.childrenSum, 150000);
assert.equal(aeTeamB.mode, 'manual_override');
// Company target should be 200,000 + 220,000 = 420,000 (NOT 420,000 + 150,000 = 570,000!)
assert.equal(resolvedB.companyEffectiveTarget, 420000);

// Case C: Invalid or negative input rejected
const negativeInputs = {
  'USER:u1': '-5000',
};
const resolvedNegative = resolveHierarchyTargets(negativeInputs, SEED_USERS);
assert.equal(resolvedNegative.isValid, false);
assert.ok(resolvedNegative.errors['USER:u1'].includes('non-negative'));
console.log('✓ Hierarchy target resolution auto-sums children, prevents double counting, and rejects negative numbers');

// Test 4: Scope-aware target & metrics calculation
console.log('Test 4: calculateForecastMetrics resolves targets & deals for Company, Role/Team, and User scopes');
const q1Forecast = SEED_FORECASTS.find((f) => f.id === 'fc-001');
assert.ok(q1Forecast, 'fc-001 should exist in SEED_FORECASTS');

const orgMetrics = calculateForecastMetrics(q1Forecast, SEED_DEALS, SEED_USERS, '2026-04-10', 'ORG');
assert.equal(orgMetrics.target, 12000000);
assert.ok(orgMetrics.achievement > 0, 'Q1 should have Closed Won achievement');
assert.equal(orgMetrics.gap, orgMetrics.target - orgMetrics.achievement);
assert.ok(orgMetrics.contributingTeams.length > 0, 'Should provide contributingTeams breakdown');
assert.ok(orgMetrics.contributingUsers.length > 0, 'Should provide contributingUsers breakdown');

const aeRoleMetrics = calculateForecastMetrics(q1Forecast, SEED_DEALS, SEED_USERS, '2026-04-10', 'ROLE:Account Executive');
assert.equal(aeRoleMetrics.target, 4500000);
assert.equal(aeRoleMetrics.gap, aeRoleMetrics.target - aeRoleMetrics.achievement);

const user2Metrics = calculateForecastMetrics(q1Forecast, SEED_DEALS, SEED_USERS, '2026-04-10', 'USER:u2');
assert.equal(user2Metrics.target, 2500000);
console.log('✓ Scope-aware forecast metrics work across ORG, ROLE, and USER scopes');

// Test 5: Annual Forecast sub-period breakdown (Quarterly Q1-Q4 and Monthly Jan-Dec)
console.log('Test 5: calculateAnnualSubPeriods computes Quarterly and Monthly sub-periods for Annual forecasts');
const annualForecast = {
  id: 'fc-annual-2026',
  name: 'Annual Target 2026',
  forecastType: 'Deal Revenue',
  periodType: 'Annual',
  year: 2026,
  periodKey: 'FY',
  target: 12000000,
  hierarchyTargets: {
    ORG: 12000000,
  },
  scope: 'ORG',
  dealScope: 'ALL',
  selectedDealIds: [],
};

const quarterlyBreakdown = calculateAnnualSubPeriods(annualForecast, 'Quarterly', SEED_DEALS, SEED_USERS, '2026-04-10', 'ORG');
assert.equal(quarterlyBreakdown.length, 4);
assert.equal(quarterlyBreakdown[0].forecast.periodKey, 'Q1');
assert.equal(quarterlyBreakdown[0].target, 3000000); // 12,000,000 / 4
assert.equal(quarterlyBreakdown[0].achievement, orgMetrics.achievement);

const monthlyBreakdown = calculateAnnualSubPeriods(annualForecast, 'Monthly', SEED_DEALS, SEED_USERS, '2026-04-10', 'ORG');
assert.equal(monthlyBreakdown.length, 12);
assert.equal(monthlyBreakdown[0].forecast.periodKey, 'M01');
assert.equal(monthlyBreakdown[0].target, 1000000); // 12,000,000 / 12
console.log('✓ Annual sub-period breakdowns (Quarterly Q1-Q4 & Monthly Jan-Dec) verified');

// Test 6: Inspect Forecasts.jsx for all 3 screenshots' UI elements and flows
console.log('Test 6: Inspect Forecasts.jsx for Screenshot 1 (Detail View), Screenshot 2 (Create Modal), and Screenshot 3 (Set Target Page)');
const forecastsJSX = fs.readFileSync(path.join(projectRoot, 'src/pages/Forecasts/Forecasts.jsx'), 'utf8');

// Screenshot 2 checks
assert.ok(forecastsJSX.includes('data-testid="create-forecast-modal"'), 'Should render Create Forecast Modal');
assert.ok(forecastsJSX.includes('Create new forecast'), 'Should include Create new forecast option');
assert.ok(forecastsJSX.includes('Continue from existing forecast'), 'Should include Continue from existing forecast option');
assert.ok(forecastsJSX.includes('Selected Deals'), 'Should include Selected Deals option');
assert.ok(forecastsJSX.includes('data-testid="selected-deals-search-input"'), 'Should include searchable deal picker');

// Screenshot 3 checks
assert.ok(forecastsJSX.includes('data-testid="set-target-page"'), 'Should render dedicated Set Target page');
assert.ok(forecastsJSX.includes('data-testid="target-input-ORG"'), 'Should render Company Target input');
assert.ok(forecastsJSX.includes('Calculated from child targets'), 'Should explicitly label Calculated from child targets');
assert.ok(forecastsJSX.includes('Manually entered'), 'Should explicitly label Manually entered');
assert.ok(forecastsJSX.includes('data-testid="set-target-save-btn"'), 'Should render Save button on Set Target page');

// Screenshot 1 checks
assert.ok(forecastsJSX.includes('data-testid="saved-forecast-detail-view"'), 'Should render Saved Forecast Detail View');
assert.ok(forecastsJSX.includes('data-testid="saved-period-from"'), 'Should render From period selector');
assert.ok(forecastsJSX.includes('data-testid="saved-period-to"'), 'Should render To period selector');
assert.ok(forecastsJSX.includes('data-testid="saved-forecast-edit-targets-btn"'), 'Should render Set Target button in Detail View');
assert.ok(forecastsJSX.includes('data-testid="saved-forecast-next-period-btn"'), 'Should render Create for Next period button in Detail View');
assert.ok(forecastsJSX.includes('data-testid="kpi-total-target"'), 'Should render Total Target KPI card');
assert.ok(forecastsJSX.includes('data-testid="kpi-total-achievement"'), 'Should render Total Achievement KPI card');
assert.ok(forecastsJSX.includes('data-testid="kpi-overall-gap"'), 'Should render Overall Gap KPI card');
assert.ok(forecastsJSX.includes('View full hierarchy'), 'Should include View full hierarchy action');
console.log('✓ Forecasts.jsx verified for Screenshot 1, Screenshot 2, and Screenshot 3 UI elements');

console.log('\n========================================');
console.log('ALL 6/6 FORECASTS FULL FLOW TESTS PASSED!');
console.log('========================================\n');
