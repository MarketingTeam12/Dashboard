import assert from 'assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

console.log('--- STARTING FORECASTS SCREENSHOTS & COMPREHENSIVE VERIFICATION SUITE ---');

// 1. Verify utility and calculations
const calcPath = path.join(root, 'src', 'utils', 'forecastCalculations.js');
const calc = await import(`file://${calcPath}`);
const {
  fmtINR2,
  getPeriodBounds,
  getNextPeriod,
  getDealForecastCategory,
  evaluateDealAnomalies,
  calculateForecastMetrics,
  aggregateForecastMetrics,
  QUARTERS,
  MONTH_PERIODS,
} = calc;

// Test 1: Indian Rupee formatting with digit grouping and space
console.log('Test 1: Indian Rupee formatting with digit grouping and space');
assert.strictEqual(fmtINR2(12000000), '₹ 1,20,00,000.00');
assert.strictEqual(fmtINR2(9318928.62), '₹ 93,18,928.62');
assert.strictEqual(fmtINR2(4000000), '₹ 40,00,000.00');
assert.strictEqual(fmtINR2(0), '₹ 0.00');
assert.strictEqual(fmtINR2(null), '₹ 0.00');
console.log('✓ fmtINR2 formats currency with Indian number grouping and space');

// Test 2: Period bounds and next-period calculation with December and Q4 rollover
console.log('Test 2: Period bounds and rollover logic (Q4 -> Q1 next year, Dec -> Jan next year)');
const q1_2026 = getPeriodBounds('Quarterly', 2026, 'Q1');
assert.strictEqual(q1_2026.shortLabel, 'Q1 2026');
assert.strictEqual(q1_2026.from, '2026-01-01');
assert.strictEqual(q1_2026.to, '2026-03-31');

const jan_2026 = getPeriodBounds('Monthly', 2026, 'M01');
assert.strictEqual(jan_2026.shortLabel, 'January 2026');
assert.strictEqual(jan_2026.from, '2026-01-01');
assert.strictEqual(jan_2026.to, '2026-01-31');

// Q1 -> Q2, Q2 -> Q3, Q3 -> Q4, Q4 -> Q1 next year
assert.deepStrictEqual(getNextPeriod('Quarterly', 2026, 'Q1'), { periodType: 'Quarterly', year: 2026, periodKey: 'Q2' });
assert.deepStrictEqual(getNextPeriod('Quarterly', 2026, 'Q3'), { periodType: 'Quarterly', year: 2026, periodKey: 'Q4' });
assert.deepStrictEqual(getNextPeriod('Quarterly', 2026, 'Q4'), { periodType: 'Quarterly', year: 2027, periodKey: 'Q1' });

// Month rollover: M01 -> M02, M12 -> M01 next year
assert.deepStrictEqual(getNextPeriod('Monthly', 2026, 'M01'), { periodType: 'Monthly', year: 2026, periodKey: 'M02' });
assert.deepStrictEqual(getNextPeriod('Monthly', 2026, 'M12'), { periodType: 'Monthly', year: 2027, periodKey: 'M01' });
console.log('✓ getPeriodBounds and getNextPeriod handle December and Q4 rollover correctly');

// Test 3: Forecast calculations: Achievement, Achievement %, Gap, Pipeline, Committed, Best Case, Predicted
console.log('Test 3: Calculation rules: Won revenue, open pipeline, predicted, zero target handling');
const mockDeals = [
  // Closed Won deals (Achievement)
  { id: 'd-1', name: 'Won Deal A', stage: 'Closed Won', amount: 5000000, probability: 100, closingDate: '2026-01-15', forecastCategory: 'Closed Won' },
  { id: 'd-2', name: 'Won Deal B', stage: 'Closed Won', amount: 3000000, probability: 100, closingDate: '2026-01-20', forecastCategory: 'Closed Won' },
  // Open Pipeline deals
  { id: 'd-3', name: 'Commit Deal', stage: 'Negotiation', amount: 2000000, probability: 80, closingDate: '2026-01-25', forecastCategory: 'Commit' },
  { id: 'd-4', name: 'Best Case Deal', stage: 'Proposal', amount: 1500000, probability: 60, closingDate: '2026-01-28', forecastCategory: 'Best Case' },
  { id: 'd-5', name: 'Pipeline Deal', stage: 'Qualification', amount: 1000000, probability: 20, closingDate: '2026-01-29', forecastCategory: 'Pipeline' },
  // Closed Lost deals (must be excluded!)
  { id: 'd-6', name: 'Lost Deal', stage: 'Closed Lost', amount: 4000000, probability: 0, closingDate: '2026-01-10', forecastCategory: 'Omitted' },
];

const fc1 = {
  id: 'fc-test-1',
  name: 'Jan 2026',
  periodType: 'Monthly',
  year: 2026,
  periodKey: 'M01',
  scope: 'ORG',
  target: 10000000, // 1 Crore target
};

const m1 = calculateForecastMetrics(fc1, mockDeals, [], '2026-01-01');
// Won revenue = 50L + 30L = 80L
assert.strictEqual(m1.achievement, 8000000);
// Won % = 80L / 100L * 100 = 80%
assert.strictEqual(m1.achievementPct, 80);
// Gap = 100L - 80L = 20L (Shortfall)
assert.strictEqual(m1.gap, 2000000);
assert.strictEqual(m1.shortfallPct, 20);
// Pipeline = 20L (Commit) + 15L (Best Case) + 10L (Pipeline) = 45L
assert.strictEqual(m1.pipeline, 4500000);
// Committed = 20L
assert.strictEqual(m1.committed, 2000000);
// Best Case = 15L
assert.strictEqual(m1.bestCase, 1500000);
// Predicted = Achievement (80L) + 20L*0.80 (16L) + 15L*0.60 (9L) + 10L*0.20 (2L) = 80L + 27L = 107L
assert.strictEqual(m1.predictedAchievement, 10700000);
console.log('✓ Forecast calculations enforce formulas and exclude Closed Lost deals');

// Test 4: Zero or missing target handling
console.log('Test 4: Zero or missing target handling (returns null for percentages, no NaN/Infinity)');
const fcZero = {
  id: 'fc-test-zero',
  name: 'February 2026',
  periodType: 'Monthly',
  year: 2026,
  periodKey: 'M02',
  scope: 'ORG',
  target: 0,
};
const mZero = calculateForecastMetrics(fcZero, mockDeals, [], '2026-01-01');
assert.strictEqual(mZero.target, 0);
assert.strictEqual(mZero.hasValidTarget, false);
assert.strictEqual(mZero.achievementPct, null);
assert.strictEqual(mZero.shortfallPct, null);
assert.strictEqual(Number.isFinite(mZero.gap), true);
console.log('✓ Zero and missing targets calculate safely without division errors');

// Test 5: Selected Deals filtering
console.log('Test 5: Selected Deals mode restricts calculations only to chosen deal IDs');
const fcSelected = {
  id: 'fc-test-sel',
  name: 'Custom Selected Deals Forecast',
  periodType: 'Monthly',
  year: 2026,
  periodKey: 'M01',
  scope: 'ORG',
  target: 5000000,
  forecastOn: 'Selected Deals',
  selectedDealIds: ['d-1', 'd-3'], // Only Deal 1 (Won 50L) and Deal 3 (Commit 20L)
};
const mSel = calculateForecastMetrics(fcSelected, mockDeals, [], '2026-01-01');
assert.strictEqual(mSel.achievement, 5000000);
assert.strictEqual(mSel.pipeline, 2000000);
assert.strictEqual(mSel.contributingDeals.length, 2);
console.log('✓ Selected Deals mode accurately restricts metrics to chosen deals');

// Test 6: Rule-based anomaly evaluation (not AI)
console.log('Test 6: Rule-based anomaly checks without AI labeling');
const anomalousDeal = {
  id: 'd-anom',
  name: 'Overdue Deal',
  stage: 'Proposal',
  amount: 0, // Missing amount anomaly
  probability: 110, // Invalid probability anomaly
  closingDate: '2025-12-01', // Overdue anomaly
  ownerId: '', // Unassigned owner anomaly
};
const reasons = evaluateDealAnomalies(anomalousDeal, '2026-01-01');
assert.strictEqual(reasons.length >= 3, true);
assert.strictEqual(reasons.some((r) => r.code === 'MISSING_AMOUNT'), true);
assert.strictEqual(reasons.some((r) => r.code === 'OVERDUE_OPEN_DEAL'), true);
assert.strictEqual(reasons.some((r) => r.code === 'MISSING_OWNER'), true);
console.log('✓ evaluateDealAnomalies identifies overdue, zero amount, and missing owner anomalies');

// Test 7: Inspect Forecasts.jsx for Screenshot 1 dashboard elements
console.log('Test 7: Inspect Forecasts.jsx layout matching Screenshot 1');
const forecastsJsx = fs.readFileSync(path.join(root, 'src', 'pages', 'Forecasts', 'Forecasts.jsx'), 'utf-8');

// Dashboard Header elements
assert.strictEqual(forecastsJsx.includes('Forecast for'), true, 'Must include "Forecast for"');
assert.strictEqual(forecastsJsx.includes('currentScopeDisplay'), true, 'Must dynamically display selected scope/user');
assert.strictEqual(forecastsJsx.includes('All Types'), true, 'Must include All Types dropdown filter');
assert.strictEqual(forecastsJsx.includes('availableYears'), true, 'Must include Year dropdown filter');
assert.strictEqual(forecastsJsx.includes('Create Forecast'), true, 'Must include prominent Create Forecast button');
assert.strictEqual(forecastsJsx.includes('Create for Next period'), true, 'Must include "Create for Next period" action on cards');

// Table Columns matching Screenshot 1
const requiredColumns = [
  'Period',
  'Target',
  'Achievement',
  'Gap',
  'Predicted Achievement',
  'Pipeline',
  'Anomalies',
  'Committed',
  'Best Case',
];
requiredColumns.forEach((col) => {
  assert.strictEqual(
    forecastsJsx.includes(`<th className="py-2.5 px-3`) && forecastsJsx.includes(col),
    true,
    `Table must contain column "${col}"`
  );
});
console.log('✓ Forecasts.jsx contains all Screenshot 1 header controls, table columns, and actions');

// Test 8: Inspect Create Forecast Dialog matching Screenshot 2
console.log('Test 8: Inspect Create Forecast Dialog matching Screenshot 2');
// 1. Create options (radio: Create new forecast / Continue from existing forecast)
assert.strictEqual(forecastsJsx.includes('Create options'), true);
assert.strictEqual(forecastsJsx.includes('Create new forecast'), true);
assert.strictEqual(forecastsJsx.includes('Continue from existing forecast'), true);

// 2. Forecast Type
assert.strictEqual(forecastsJsx.includes('Forecast Type'), true);
assert.strictEqual(forecastsJsx.includes('Deal Revenue'), true);

// 3. Forecast Period (Quarterly / Monthly, Quarter/Month selector, Year selector, duplicate check)
assert.strictEqual(forecastsJsx.includes('Forecast Period'), true);
assert.strictEqual(forecastsJsx.includes('Quarterly'), true);
assert.strictEqual(forecastsJsx.includes('Monthly'), true);
assert.strictEqual(forecastsJsx.includes('create-period-key-select'), true);
assert.strictEqual(forecastsJsx.includes('create-year-select'), true);

// 4. Forecast Name (prefilled & editable)
assert.strictEqual(forecastsJsx.includes('Forecast Name'), true);
assert.strictEqual(forecastsJsx.includes('create-fc-name'), true);

// 5. Forecast on (All Deals / Selected Deals with search and checklist)
assert.strictEqual(forecastsJsx.includes('Forecast on'), true);
assert.strictEqual(forecastsJsx.includes('All Deals'), true);
assert.strictEqual(forecastsJsx.includes('Selected Deals'), true);
assert.strictEqual(forecastsJsx.includes('Select Deals for Forecast Period'), true);

// Multi-step flow: Step 1 -> Next -> Step 2 -> Configure Target & Save
assert.strictEqual(forecastsJsx.includes('createModal.step === 1'), true);
assert.strictEqual(forecastsJsx.includes('createModal.step === 2'), true);
assert.strictEqual(forecastsJsx.includes('handleStep1Next'), true);
assert.strictEqual(forecastsJsx.includes('handleSaveForecast'), true);
assert.strictEqual(forecastsJsx.includes('Target Amount (INR ₹)'), true);
console.log('✓ Create Forecast Dialog implements Screenshot 2 controls and multi-step target configuration');

// Test 9: Seed data initializes Screenshot 1 cards
console.log('Test 9: Seed data defines cards matching Screenshot 1 (Quarter Target 2026, Jan 2026, February 2026, Monthly Target 2026)');
const seedDataModule = await import(`file://${path.join(root, 'src', 'data', 'seedData.js')}`);
const seed = seedDataModule.buildSeed();
const seedForecastNames = seed.forecasts.map((f) => f.name);
assert.strictEqual(seedForecastNames.includes('Quarter Target 2026'), true);
assert.strictEqual(seedForecastNames.includes('Jan 2026'), true);
assert.strictEqual(seedForecastNames.includes('February 2026'), true);
assert.strictEqual(seedForecastNames.includes('Monthly Target 2026'), true);

// Check February 2026 has zero target
const febFc = seed.forecasts.find((f) => f.name === 'February 2026');
assert.strictEqual(febFc.target, 0);
console.log('✓ Seed data correctly provides all 4 Screenshot 1 cards with zero-target Card 3');

// Test 10: App.jsx routing and Topbar integration
console.log('Test 10: App.jsx routing and Topbar integration');
const appJsx = fs.readFileSync(path.join(root, 'src', 'App.jsx'), 'utf-8');
assert.strictEqual(appJsx.includes('path="/forecasts"'), true);
assert.strictEqual(appJsx.includes('element={<Forecasts />}'), true);
console.log('✓ /forecasts route registered under MainLayout in App.jsx');

console.log('\n========================================');
console.log('ALL 10/10 FORECASTS SCREENSHOTS & FEATURE TESTS PASSED!');
console.log('========================================\n');

