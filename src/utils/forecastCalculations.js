import { MONTHS, fmtDate, isLost, isOpen, isWon, sumBy, todayISO } from './calculations.js';

export const FORECAST_TIMEZONE = 'Asia/Kolkata (IST, UTC+05:30)';
export const FORECAST_DATE_FIELD = 'closingDate';
export const FORECAST_CATEGORIES = ['Pipeline', 'Best Case', 'Commit', 'Omitted'];
export const FORECAST_PERIOD_TYPES = ['Quarterly', 'Monthly', 'Annual'];
export const FORECAST_REVENUE_TYPES = [
  'Deal Revenue',
  'Pipeline',
  'Gross Revenue',
  'Expected Revenue',
  'Quota Revenue',
  'Deal Quantity',
];

export const QUARTERS = [
  { key: 'Q1', label: 'Q1 (Jan – Mar)', short: 'Q1', startMonth: 1, endMonth: 3 },
  { key: 'Q2', label: 'Q2 (Apr – Jun)', short: 'Q2', startMonth: 4, endMonth: 6 },
  { key: 'Q3', label: 'Q3 (Jul – Sep)', short: 'Q3', startMonth: 7, endMonth: 9 },
  { key: 'Q4', label: 'Q4 (Oct – Dec)', short: 'Q4', startMonth: 10, endMonth: 12 },
];

export const FULL_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const MONTH_PERIODS = FULL_MONTHS.map((m, idx) => {
  const num = idx + 1;
  const key = `M${String(num).padStart(2, '0')}`;
  return { key, label: m, short: MONTHS[idx] || m.slice(0, 3), fullLabel: m, month: num };
});

export const ANNUAL_PERIODS = [
  { key: 'FY', label: 'Full Year (Jan – Dec)', short: 'FY', startMonth: 1, endMonth: 12 },
];

/**
 * Format INR currency using Indian digit grouping and 2 decimal places, e.g. ₹ 1,20,00,000.00
 */
export function fmtINR2(n) {
  const val = Number(n);
  if (!Number.isFinite(val)) return '₹ 0.00';
  const sign = val < 0 ? '-' : '';
  const abs = Math.abs(val);
  const formatted = abs.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}₹ ${formatted}`;
}

/**
 * Format money in the selected currency consistently without mixing currencies.
 */
export function fmtForecastCurrency(n, currency = 'INR') {
  if (currency === 'USD') {
    const val = Number(n);
    if (!Number.isFinite(val)) return '$ 0.00';
    const sign = val < 0 ? '-' : '';
    const abs = Math.abs(val);
    const formatted = abs.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${sign}$ ${formatted}`;
  }
  return fmtINR2(n);
}

export function getCurrencySymbol(currency = 'INR') {
  return currency === 'USD' ? '$' : '₹';
}

/**
 * Returns { from: 'YYYY-MM-DD', to: 'YYYY-MM-DD', label: string, shortLabel: string, sortKey: string }
 * Supports Quarterly, Monthly, and Annual forecast periods.
 */
export function getPeriodBounds(periodType, year, periodKey) {
  const y = Number(year) || 2026;
  if (periodType === 'Annual') {
    return {
      from: `${y}-01-01`,
      to: `${y}-12-31`,
      label: `FY ${y} (Jan – Dec)`,
      shortLabel: `FY ${y}`,
      sortKey: `${y}-00`,
    };
  }
  if (periodType === 'Quarterly') {
    const q = QUARTERS.find((x) => x.key === periodKey) || QUARTERS[0];
    const startM = String(q.startMonth).padStart(2, '0');
    const endM = String(q.endMonth).padStart(2, '0');
    const lastDay = new Date(y, q.endMonth, 0).getDate();
    return {
      from: `${y}-${startM}-01`,
      to: `${y}-${endM}-${String(lastDay).padStart(2, '0')}`,
      label: `${q.key} ${y} (${MONTHS[q.startMonth - 1]} – ${MONTHS[q.endMonth - 1]})`,
      shortLabel: `${q.key} ${y}`,
      sortKey: `${y}-${startM}`,
    };
  }
  const mObj = MONTH_PERIODS.find((x) => x.key === periodKey) || MONTH_PERIODS[0];
  const mStr = String(mObj.month).padStart(2, '0');
  const lastDay = new Date(y, mObj.month, 0).getDate();
  return {
    from: `${y}-${mStr}-01`,
    to: `${y}-${mStr}-${String(lastDay).padStart(2, '0')}`,
    label: `${mObj.label} ${y}`,
    shortLabel: `${mObj.label} ${y}`,
    sortKey: `${y}-${mStr}`,
  };
}

/**
 * Computes the next period and handles December -> January, Q4 -> Q1, and Annual year rollover.
 */
export function getNextPeriod(periodType, year, periodKey) {
  const y = Number(year) || 2026;
  if (periodType === 'Annual') {
    return { periodType: 'Annual', year: y + 1, periodKey: 'FY' };
  }
  if (periodType === 'Quarterly') {
    const qNum = Number(String(periodKey).replace('Q', '')) || 1;
    if (qNum >= 4) {
      return { periodType: 'Quarterly', year: y + 1, periodKey: 'Q1' };
    }
    return { periodType: 'Quarterly', year: y, periodKey: `Q${qNum + 1}` };
  }
  const mNum = Number(String(periodKey).replace('M', '')) || 1;
  if (mNum >= 12) {
    return { periodType: 'Monthly', year: y + 1, periodKey: 'M01' };
  }
  return {
    periodType: 'Monthly',
    year: y,
    periodKey: `M${String(mNum + 1).padStart(2, '0')}`,
  };
}

/**
 * Build the Organization & Reporting Hierarchy tree from the project's actual users and roles.
 * Does not invent fake departments; groups real CRM users by their actual role/team.
 */
export function buildOrganizationHierarchy(users = []) {
  const roleGroupsMap = new Map();
  users.forEach((u) => {
    const roleName = u.role || 'Sales Representative';
    const teamId = `ROLE:${roleName}`;
    if (!roleGroupsMap.has(teamId)) {
      roleGroupsMap.set(teamId, {
        id: teamId,
        role: roleName,
        label: roleName,
        members: [],
      });
    }
    roleGroupsMap.get(teamId).members.push({
      id: `USER:${u.id}`,
      userId: u.id,
      name: u.name,
      role: u.role,
      email: u.email,
      color: u.color,
    });
  });

  const teams = Array.from(roleGroupsMap.values());
  return {
    companyId: 'ORG',
    companyName: 'CRM Organization',
    executiveRole: 'CEO',
    totalMembers: users.length,
    teams,
  };
}

/**
 * Resolves effective targets across Company -> Role/Manager Teams -> Individual Users
 * while preventing accidental double-counting and clearly indicating whether each parent target
 * is manually entered or calculated from its children.
 *
 * @param {Object} rawInputs - Map of nodeId -> string/number value entered by user, plus optional manualModes
 * @param {Array} users - Real CRM users
 */
export function resolveHierarchyTargets(rawInputs = {}, users = []) {
  const hierarchy = buildOrganizationHierarchy(users);
  const errors = {};

  const parseVal = (key) => {
    const raw = rawInputs[key];
    if (raw === undefined || raw === null || String(raw).trim() === '') {
      return { hasManual: false, value: 0, raw: '' };
    }
    const num = Number(raw);
    if (!Number.isFinite(num) || num < 0) {
      errors[key] = 'Target must be a valid non-negative amount.';
      return { hasManual: true, value: 0, raw: String(raw), invalid: true };
    }
    return { hasManual: true, value: num, raw: String(raw) };
  };

  const resolvedTeams = hierarchy.teams.map((team) => {
    const resolvedMembers = team.members.map((m) => {
      const parsed = parseVal(m.id);
      return {
        ...m,
        manualValue: parsed.hasManual ? parsed.value : null,
        effectiveTarget: parsed.value,
        rawInput: parsed.raw,
        mode: parsed.hasManual ? 'manual' : 'unset',
      };
    });

    const childrenSum = sumBy(resolvedMembers, (m) => m.effectiveTarget);
    const hasAnyChildTarget = resolvedMembers.some((m) => m.manualValue !== null && m.manualValue > 0);
    const teamParsed = parseVal(team.id);

    // Prevent double counting:
    // If team input is left blank and children have targets -> auto-calculate from children.
    // If team input is manually entered -> use manual team target (do NOT add childrenSum on top),
    // and clearly expose both manualValue and childrenSum.
    let effectiveTarget = 0;
    let mode = 'unset'; // 'calculated' | 'manual' | 'manual_override' | 'unset'

    if (!teamParsed.hasManual) {
      if (hasAnyChildTarget || childrenSum > 0) {
        effectiveTarget = childrenSum;
        mode = 'calculated';
      } else {
        effectiveTarget = 0;
        mode = 'unset';
      }
    } else {
      effectiveTarget = teamParsed.value;
      if (childrenSum > 0 && Math.abs(teamParsed.value - childrenSum) < 0.01) {
        mode = 'calculated';
      } else if (childrenSum > 0) {
        mode = 'manual_override';
      } else {
        mode = 'manual';
      }
    }

    return {
      ...team,
      members: resolvedMembers,
      memberCount: resolvedMembers.length,
      childrenSum,
      manualValue: teamParsed.hasManual ? teamParsed.value : null,
      rawInput: teamParsed.raw,
      effectiveTarget,
      mode,
    };
  });

  const teamsChildrenSum = sumBy(resolvedTeams, (t) => t.effectiveTarget);
  const hasAnyTeamTarget = resolvedTeams.some((t) => t.effectiveTarget > 0);
  const companyParsed = parseVal('ORG');

  let companyEffectiveTarget = 0;
  let companyMode = 'unset'; // 'calculated' | 'manual' | 'manual_override' | 'unset'

  if (!companyParsed.hasManual) {
    if (hasAnyTeamTarget || teamsChildrenSum > 0) {
      companyEffectiveTarget = teamsChildrenSum;
      companyMode = 'calculated';
    } else {
      companyEffectiveTarget = 0;
      companyMode = 'unset';
    }
  } else {
    companyEffectiveTarget = companyParsed.value;
    if (teamsChildrenSum > 0 && Math.abs(companyParsed.value - teamsChildrenSum) < 0.01) {
      companyMode = 'calculated';
    } else if (teamsChildrenSum > 0) {
      companyMode = 'manual_override';
    } else {
      companyMode = 'manual';
    }
  }

  // Build flat map of effective targets for persistence on the forecast record
  const effectiveMap = {
    ORG: companyEffectiveTarget,
  };
  resolvedTeams.forEach((t) => {
    effectiveMap[t.id] = t.effectiveTarget;
    t.members.forEach((m) => {
      effectiveMap[m.id] = m.effectiveTarget;
    });
  });

  return {
    companyId: hierarchy.companyId,
    companyName: hierarchy.companyName,
    executiveRole: hierarchy.executiveRole,
    companyManualValue: companyParsed.hasManual ? companyParsed.value : null,
    companyRawInput: companyParsed.raw,
    companyChildrenSum: teamsChildrenSum,
    companyEffectiveTarget,
    companyMode,
    teams: resolvedTeams,
    effectiveMap,
    rawInputs: { ...rawInputs },
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

/**
 * Classify a deal into its forecast category:
 * - Closed Won -> 'Closed Won'
 * - Closed Lost -> 'Omitted'
 * - Explicit deal.forecastCategory if set ('Commit' | 'Best Case' | 'Pipeline' | 'Omitted')
 * - Otherwise derived from stage / probability:
 *   Negotiation or probability >= 75 -> 'Commit'
 *   Proposal or probability >= 50 -> 'Best Case'
 *   Qualification / Needs Analysis -> 'Pipeline'
 */
export function getDealForecastCategory(deal) {
  if (!deal) return 'Pipeline';
  if (isWon(deal)) return 'Closed Won';
  if (isLost(deal)) return 'Omitted';
  if (deal.forecastCategory && FORECAST_CATEGORIES.includes(deal.forecastCategory)) {
    return deal.forecastCategory;
  }
  const prob = Number(deal.probability) || 0;
  if (deal.stage === 'Negotiation' || prob >= 75) return 'Commit';
  if (deal.stage === 'Proposal' || prob >= 50) return 'Best Case';
  return 'Pipeline';
}

/**
 * Rule-based anomaly inspection for a deal.
 * Explicitly checks:
 * 1. Overdue open deal (closingDate < today while deal is still open)
 * 2. Missing or non-positive deal amount
 * 3. Missing closingDate
 * 4. Missing deal owner
 * 5. Invalid probability (missing or outside 0..100)
 * 6. Commit category with low probability (<60%)
 */
export function evaluateDealAnomalies(deal, today = todayISO()) {
  const reasons = [];
  if (!deal || isLost(deal)) return reasons;

  const amt = Number(deal.amount);
  if (!Number.isFinite(amt) || amt <= 0) {
    reasons.push({
      code: 'MISSING_AMOUNT',
      severity: 'high',
      label: 'Missing / Zero Amount',
      detail: 'Deal amount is missing or ₹0.00; required for accurate revenue forecasting.',
    });
  }

  if (!deal.closingDate || String(deal.closingDate).trim().length < 10) {
    reasons.push({
      code: 'MISSING_CLOSE_DATE',
      severity: 'high',
      label: 'Missing Closing Date',
      detail: 'Deal has no valid closingDate assigned.',
    });
  } else if (isOpen(deal) && deal.closingDate < today) {
    reasons.push({
      code: 'OVERDUE_OPEN_DEAL',
      severity: 'high',
      label: 'Overdue Open Deal',
      detail: `Closing date (${fmtDate(deal.closingDate)}) has passed while stage is still "${deal.stage}".`,
    });
  }

  if (!deal.ownerId) {
    reasons.push({
      code: 'MISSING_OWNER',
      severity: 'medium',
      label: 'Unassigned Owner',
      detail: 'Deal has no owner assigned.',
    });
  }

  const prob = Number(deal.probability);
  if (deal.probability === '' || deal.probability == null || !Number.isFinite(prob) || prob < 0 || prob > 100) {
    reasons.push({
      code: 'INVALID_PROBABILITY',
      severity: 'high',
      label: 'Invalid Probability',
      detail: 'Probability must be a valid number between 0% and 100%.',
    });
  } else if (isOpen(deal) && getDealForecastCategory(deal) === 'Commit' && prob < 60) {
    reasons.push({
      code: 'COMMIT_LOW_PROB',
      severity: 'medium',
      label: 'Commit Category Mismatch',
      detail: `Deal is in Commit category but probability is ${prob}% (<60%).`,
    });
  }

  return reasons;
}

/**
 * Checks if a deal belongs to a forecast scope ('ORG', 'ROLE:<role>', 'DEPT:<name>', 'USER:<id>')
 */
export function dealMatchesScope(deal, scope, users = []) {
  if (!scope || scope === 'ORG' || scope === 'ALL') return true;
  if (scope.startsWith('DEPT:')) {
    const dept = scope.slice(5);
    return deal.department === dept;
  }
  if (scope.startsWith('ROLE:')) {
    const roleName = scope.slice(5);
    const owner = users.find((u) => u.id === deal.ownerId);
    return owner ? owner.role === roleName : false;
  }
  if (scope.startsWith('USER:')) {
    const uid = scope.slice(5);
    return deal.ownerId === uid;
  }
  return true;
}

/**
 * Checks if a forecast record matches the active topbar owner/team filter
 */
export function forecastMatchesScopeFilter(forecast, filterScope, users = []) {
  if (!filterScope || filterScope === 'ALL') return true;
  if (forecast.scope === filterScope) return true;
  // If forecast has hierarchyTargets saved (e.g. an ORG forecast with team/user targets), allow viewing it under any scope!
  if (forecast.scope === 'ORG' && forecast.hierarchyTargets && forecast.hierarchyTargets[filterScope] !== undefined) {
    return true;
  }
  if (filterScope === 'ORG') return forecast.scope === 'ORG';
  return false;
}

/**
 * Resolve the target for a given scope ('ORG', 'ROLE:...', 'DEPT:...', 'USER:...') on a forecast record.
 */
export function resolveTargetForScope(forecast, activeScope, users = []) {
  if (!forecast) return 0;
  const scopeToUse = activeScope && activeScope !== 'ALL' ? activeScope : forecast.scope || 'ORG';

  if (scopeToUse === forecast.scope || (scopeToUse === 'ORG' && (!forecast.scope || forecast.scope === 'ORG'))) {
    return Math.max(0, Number(forecast.target) || 0);
  }

  const ht = forecast.hierarchyTargets || {};
  if (ht[scopeToUse] !== undefined && ht[scopeToUse] !== null && ht[scopeToUse] !== '') {
    return Math.max(0, Number(ht[scopeToUse]) || 0);
  }

  // If filtering by ROLE:<role> and user targets exist in hierarchyTargets, sum the user targets in that role
  if (scopeToUse.startsWith('ROLE:')) {
    const roleName = scopeToUse.slice(5);
    const roleUsers = users.filter((u) => u.role === roleName);
    const sumUsers = sumBy(roleUsers, (u) => Math.max(0, Number(ht[`USER:${u.id}`]) || 0));
    if (sumUsers > 0) return sumUsers;
  }

  return Math.max(0, Number(forecast.target) || 0);
}

/**
 * Compute all forecast metrics for a single forecast period record from actual CRM deals.
 *
 * Rules enforced:
 * - Achievement = Closed Won revenue in the selected period.
 * - Achievement % = achievement / target * 100 (or null if target <= 0).
 * - Gap amount = target - achievement.
 * - Shortfall % = gap / target * 100 (or null if target <= 0).
 * - Pipeline = total eligible open-deal revenue.
 * - Committed = open deals classified as Commit (subset of Pipeline, NOT added again).
 * - Best Case = open deals classified as Best Case (subset of Pipeline, NOT added again).
 * - Predicted Achievement = achievement + probability-weighted eligible open-deal revenue.
 * - Exclude Closed Lost deals from all revenue totals.
 */
export function calculateForecastMetrics(forecast, deals, users = [], today = todayISO(), scopeOverride = null) {
  const bounds = getPeriodBounds(forecast.periodType, forecast.year, forecast.periodKey);
  const effectiveScope = scopeOverride && scopeOverride !== 'ALL' ? scopeOverride : forecast.scope || 'ORG';
  const target = resolveTargetForScope(forecast, effectiveScope, users);
  const hasValidTarget = target > 0;

  // Deals in this period & scope (by closingDate in YYYY-MM-DD)
  const periodDeals = deals.filter((d) => {
    if (forecast.forecastOn === 'Selected Deals' && Array.isArray(forecast.selectedDealIds)) {
      if (!forecast.selectedDealIds.includes(d.id)) return false;
      if (scopeOverride && scopeOverride !== 'ALL' && scopeOverride !== 'ORG') {
        if (!dealMatchesScope(d, scopeOverride, users)) return false;
      }
    } else if (!dealMatchesScope(d, effectiveScope, users)) {
      return false;
    }
    const cDate = (d.closingDate || '').slice(0, 10);
    if (!cDate) {
      // Include deals missing closingDate if createdOn falls in the period so missing data anomaly is surfaced
      const crDate = (d.createdOn || '').slice(0, 10);
      return crDate >= bounds.from && crDate <= bounds.to;
    }
    return cDate >= bounds.from && cDate <= bounds.to;
  });

  // Active contributing deals exclude Closed Lost
  const nonLostDeals = periodDeals.filter((d) => !isLost(d));
  const wonDeals = nonLostDeals.filter(isWon);
  const eligibleOpenDeals = nonLostDeals.filter(
    (d) => isOpen(d) && getDealForecastCategory(d) !== 'Omitted' && (Number(d.amount) || 0) > 0
  );

  const isQuantityType = forecast.revenueType === 'Deal Quantity';
  const metricOf = (d) => (isQuantityType ? 1 : Math.max(0, Number(d.amount) || 0));

  const achievement = sumBy(wonDeals, metricOf);
  const achievementPct = hasValidTarget ? (achievement / target) * 100 : null;

  const gap = target - achievement; // positive = shortfall, negative = exceeded
  const shortfallPct = hasValidTarget ? (gap / target) * 100 : null;

  const pipeline = sumBy(eligibleOpenDeals, metricOf);

  const commitDeals = eligibleOpenDeals.filter((d) => getDealForecastCategory(d) === 'Commit');
  const bestCaseDeals = eligibleOpenDeals.filter((d) => getDealForecastCategory(d) === 'Best Case');

  const committed = sumBy(commitDeals, metricOf);
  const bestCase = sumBy(bestCaseDeals, metricOf);

  const weightedOpenRevenue = sumBy(eligibleOpenDeals, (d) => {
    const amt = metricOf(d);
    const prob = Math.min(100, Math.max(0, Number(d.probability) || 0));
    return amt * (prob / 100);
  });

  const predictedAchievement = achievement + weightedOpenRevenue;
  const predictedPct = hasValidTarget ? (predictedAchievement / target) * 100 : null;

  // Rule-based anomalies across non-lost deals in the period
  const anomalies = [];
  nonLostDeals.forEach((d) => {
    const reasons = evaluateDealAnomalies(d, today);
    if (reasons.length > 0) {
      anomalies.push({ deal: d, reasons });
    }
  });

  const ht = forecast.hierarchyTargets || {};

  // Contributing users (owners) breakdown
  const userMap = new Map();
  users.forEach((u) => {
    const userTarget = Math.max(0, Number(ht[`USER:${u.id}`]) || 0);
    if (userTarget > 0) {
      userMap.set(u.id, {
        userId: u.id,
        userName: u.name,
        userRole: u.role || '—',
        target: userTarget,
        dealsCount: 0,
        wonAmount: 0,
        pipelineAmount: 0,
        committedAmount: 0,
        bestCaseAmount: 0,
        weightedOpen: 0,
      });
    }
  });

  nonLostDeals.forEach((d) => {
    const uid = d.ownerId || 'unassigned';
    if (!userMap.has(uid)) {
      const uObj = users.find((u) => u.id === uid);
      userMap.set(uid, {
        userId: uid,
        userName: uObj ? uObj.name : 'Unassigned',
        userRole: uObj ? uObj.role : '—',
        target: Math.max(0, Number(ht[`USER:${uid}`]) || 0),
        dealsCount: 0,
        wonAmount: 0,
        pipelineAmount: 0,
        committedAmount: 0,
        bestCaseAmount: 0,
        weightedOpen: 0,
      });
    }
    const entry = userMap.get(uid);
    const amt = metricOf(d);
    const cat = getDealForecastCategory(d);
    entry.dealsCount += 1;
    if (isWon(d)) {
      entry.wonAmount += amt;
    } else if (isOpen(d) && cat !== 'Omitted' && amt > 0) {
      entry.pipelineAmount += amt;
      if (cat === 'Commit') entry.committedAmount += amt;
      if (cat === 'Best Case') entry.bestCaseAmount += amt;
      const prob = Math.min(100, Math.max(0, Number(d.probability) || 0));
      entry.weightedOpen += amt * (prob / 100);
    }
  });

  const contributingUsers = Array.from(userMap.values())
    .filter((u) => u.dealsCount > 0 || u.target > 0)
    .sort((a, b) => b.wonAmount + b.pipelineAmount - (a.wonAmount + a.pipelineAmount));

  // Contributing teams / roles breakdown
  const teamMap = new Map();
  const hierarchy = buildOrganizationHierarchy(users);
  hierarchy.teams.forEach((t) => {
    const teamTarget = Math.max(0, Number(ht[t.id]) || 0);
    teamMap.set(t.role, {
      teamId: t.id,
      teamName: t.label,
      memberCount: t.members.length,
      target: teamTarget,
      dealsCount: 0,
      wonAmount: 0,
      pipelineAmount: 0,
      committedAmount: 0,
      bestCaseAmount: 0,
      weightedOpen: 0,
    });
  });

  nonLostDeals.forEach((d) => {
    const uObj = users.find((u) => u.id === d.ownerId);
    const roleKey = uObj ? uObj.role : 'Unassigned';
    if (!teamMap.has(roleKey)) {
      teamMap.set(roleKey, {
        teamId: `ROLE:${roleKey}`,
        teamName: roleKey,
        memberCount: 1,
        target: 0,
        dealsCount: 0,
        wonAmount: 0,
        pipelineAmount: 0,
        committedAmount: 0,
        bestCaseAmount: 0,
        weightedOpen: 0,
      });
    }
    const tEntry = teamMap.get(roleKey);
    const amt = metricOf(d);
    const cat = getDealForecastCategory(d);
    tEntry.dealsCount += 1;
    if (isWon(d)) {
      tEntry.wonAmount += amt;
    } else if (isOpen(d) && cat !== 'Omitted' && amt > 0) {
      tEntry.pipelineAmount += amt;
      if (cat === 'Commit') tEntry.committedAmount += amt;
      if (cat === 'Best Case') tEntry.bestCaseAmount += amt;
      const prob = Math.min(100, Math.max(0, Number(d.probability) || 0));
      tEntry.weightedOpen += amt * (prob / 100);
    }
  });

  const contributingTeams = Array.from(teamMap.values()).filter(
    (t) => t.dealsCount > 0 || t.target > 0
  );

  return {
    forecast,
    bounds,
    effectiveScope,
    target,
    hasValidTarget,
    achievement,
    achievementPct,
    gap,
    shortfallPct,
    predictedAchievement,
    predictedPct,
    pipeline,
    committed,
    bestCase,
    anomalies,
    contributingDeals: nonLostDeals.sort((a, b) => (a.closingDate || '').localeCompare(b.closingDate || '')),
    contributingUsers,
    contributingTeams,
  };
}

/**
 * Compute quarterly and monthly breakdown rows for an Annual forecast so the Annual saved view
 * displays a clear annual summary and expandable breakdown by quarter or month.
 */
export function calculateAnnualSubPeriods(
  annualForecast,
  breakdownMode = 'Quarterly',
  deals = [],
  users = [],
  today = todayISO(),
  scopeOverride = null
) {
  const effectiveScope = scopeOverride && scopeOverride !== 'ALL' ? scopeOverride : annualForecast.scope || 'ORG';
  const annualTarget = resolveTargetForScope(annualForecast, effectiveScope, users);

  if (breakdownMode === 'Monthly') {
    const perMonthTarget = annualTarget > 0 ? Math.round((annualTarget / 12) * 100) / 100 : 0;
    return MONTH_PERIODS.map((m) => {
      const synthetic = {
        ...annualForecast,
        id: `${annualForecast.id}__${m.key}`,
        periodType: 'Monthly',
        periodKey: m.key,
        target: perMonthTarget,
        hierarchyTargets: annualForecast.hierarchyTargets
          ? Object.fromEntries(
              Object.entries(annualForecast.hierarchyTargets).map(([k, v]) => [
                k,
                Math.round(((Number(v) || 0) / 12) * 100) / 100,
              ])
            )
          : undefined,
      };
      return calculateForecastMetrics(synthetic, deals, users, today, scopeOverride);
    });
  }

  // Default: Quarterly breakdown (Q1 - Q4)
  const perQuarterTarget = annualTarget > 0 ? Math.round((annualTarget / 4) * 100) / 100 : 0;
  return QUARTERS.map((q) => {
    const synthetic = {
      ...annualForecast,
      id: `${annualForecast.id}__${q.key}`,
      periodType: 'Quarterly',
      periodKey: q.key,
      target: perQuarterTarget,
      hierarchyTargets: annualForecast.hierarchyTargets
        ? Object.fromEntries(
            Object.entries(annualForecast.hierarchyTargets).map(([k, v]) => [
              k,
              Math.round(((Number(v) || 0) / 4) * 100) / 100,
            ])
          )
        : undefined,
    };
    return calculateForecastMetrics(synthetic, deals, users, today, scopeOverride);
  });
}

/**
 * Aggregate multiple computed forecast rows into a summary total object.
 */
export function aggregateForecastMetrics(computedRows) {
  const target = sumBy(computedRows, (r) => r.target);
  const achievement = sumBy(computedRows, (r) => r.achievement);
  const pipeline = sumBy(computedRows, (r) => r.pipeline);
  const committed = sumBy(computedRows, (r) => r.committed);
  const bestCase = sumBy(computedRows, (r) => r.bestCase);
  const predictedAchievement = sumBy(computedRows, (r) => r.predictedAchievement);
  const gap = target - achievement;
  const hasValidTarget = target > 0;
  const achievementPct = hasValidTarget ? (achievement / target) * 100 : null;
  const shortfallPct = hasValidTarget ? (gap / target) * 100 : null;
  const predictedPct = hasValidTarget ? (predictedAchievement / target) * 100 : null;

  // Unique anomalies by deal.id across the rows
  const seenDealIds = new Set();
  const uniqueAnomalies = [];
  computedRows.forEach((r) => {
    r.anomalies.forEach((a) => {
      if (!seenDealIds.has(a.deal.id)) {
        seenDealIds.add(a.deal.id);
        uniqueAnomalies.push(a);
      }
    });
  });

  return {
    target,
    hasValidTarget,
    achievement,
    achievementPct,
    gap,
    shortfallPct,
    predictedAchievement,
    predictedPct,
    pipeline,
    committed,
    bestCase,
    anomalyCount: uniqueAnomalies.length,
    anomalies: uniqueAnomalies,
  };
}
