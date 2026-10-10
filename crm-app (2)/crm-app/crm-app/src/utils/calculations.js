// ---------- constants ----------
export const STAGES = ['Qualification', 'Needs Analysis', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
export const OPEN_STAGES = STAGES.slice(0, 4);
export const STAGE_PROBABILITY = {
  Qualification: 20, 'Needs Analysis': 40, Proposal: 60, Negotiation: 80, 'Closed Won': 100, 'Closed Lost': 0,
};
export const STAGE_COLORS = {
  Qualification: '#2F7BF5', 'Needs Analysis': '#FF7B3A', Proposal: '#8E3CF2',
  Negotiation: '#FFBB28', 'Closed Won': '#12C26B', 'Closed Lost': '#FF3344',
};
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ---------- formatting ----------
export const fmtNum = (n) => Math.round(Number(n) || 0).toLocaleString('en-IN');
export const fmtINR = (n) => `₹ ${fmtNum(n)}`;

export function fmtCompact(n, { space = true } = {}) {
  const v = Number(n) || 0;
  const s = space ? ' ' : '';
  if (Math.abs(v) >= 1e7) return `₹${s}${(v / 1e7).toFixed(1).replace(/\.0$/, '')} Cr`;
  if (Math.abs(v) >= 1e5) return `₹${s}${(v / 1e5).toFixed(1).replace(/\.0$/, '')}L`;
  if (Math.abs(v) >= 1e3) return `₹${s}${(v / 1e3).toFixed(1).replace(/\.0$/, '')}K`;
  return `₹${s}${fmtNum(v)}`;
}

export function axisCompact(v) {
  if (v >= 1e7) return `${(v / 1e7).toFixed(v % 1e7 ? 1 : 0)}Cr`;
  if (v >= 1e5) return `${(v / 1e5).toFixed(v % 1e5 ? 1 : 0)}L`;
  if (v >= 1e3) return `${Math.round(v / 1e3)}K`;
  return String(v);
}

export function parseDate(iso) {
  if (!iso) return null;
  const d = new Date(iso.length === 10 ? iso + 'T00:00:00' : iso);
  return isNaN(d) ? null : d;
}

export function fmtDate(iso) {
  const d = parseDate(iso);
  if (!d) return '—';
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function fmtTime(iso) {
  const d = parseDate(iso);
  if (!d) return '';
  let h = d.getHours();
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} ${ap}`;
}

export function fmtDuration(sec) {
  const s = Math.max(0, Math.round(Number(sec) || 0));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}m ${String(s % 60).padStart(2, '0')}s`;
}

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function addDays(iso, days) {
  const d = parseDate(iso) || new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const pct = (part, whole) => (whole ? (part / whole) * 100 : 0);
export const pctLabel = (part, whole) => `${Math.round(pct(part, whole))}%`;

export function trend(current, previous) {
  if (!previous) return { value: 0, up: true };
  const v = ((current - previous) / previous) * 100;
  return { value: Math.abs(Math.round(v)), up: v >= 0 };
}

export const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('') || '?';

export function inRange(iso, range) {
  if (!range || (!range.from && !range.to)) return true;
  const d = (iso || '').slice(0, 10);
  if (!d) return false;
  if (range.from && d < range.from) return false;
  if (range.to && d > range.to) return false;
  return true;
}

export const monthIndex = (iso) => {
  const d = parseDate(iso);
  return d ? d.getMonth() : -1;
};

export function countBy(rows, keyFn) {
  const out = {};
  rows.forEach((r) => {
    const k = keyFn(r);
    out[k] = (out[k] || 0) + 1;
  });
  return out;
}

export function sumBy(rows, fn) {
  return rows.reduce((s, r) => s + (Number(fn(r)) || 0), 0);
}

// ---------- deals ----------
export const isWon = (d) => d.stage === 'Closed Won';
export const isLost = (d) => d.stage === 'Closed Lost';
export const isOpen = (d) => !isWon(d) && !isLost(d);

/** furthest pipeline step a deal reached (0..4, 4 = closed won) */
export function funnelIndex(d) {
  if (isWon(d)) return 4;
  if (isLost(d)) return Math.max(0, OPEN_STAGES.indexOf(d.lostAtStage || 'Qualification'));
  return Math.max(0, OPEN_STAGES.indexOf(d.stage));
}

export function dealKpis(deals) {
  const total = deals.length;
  const won = deals.filter(isWon).length;
  const lost = deals.filter(isLost).length;
  const open = total - won - lost;
  return { total, won, lost, open, pipeline: sumBy(deals, (d) => d.amount), wonValue: sumBy(deals.filter(isWon), (d) => d.amount) };
}

/** per-stage summary rows used by both stage summary modules */
export function stageSummaryRows(deals) {
  const total = deals.length;
  const revenue = sumBy(deals, (d) => d.amount);
  const won = deals.filter(isWon).length;
  return STAGES.map((stage, i) => {
    const rows = deals.filter((d) => d.stage === stage);
    const rev = sumBy(rows, (d) => d.amount);
    const reached = i < 4 ? deals.filter((d) => funnelIndex(d) >= i).length : rows.length;
    let winRate = 0;
    if (stage === 'Closed Won') winRate = rows.length ? 100 : 0;
    else if (stage === 'Closed Lost') winRate = 0;
    else winRate = pct(won, reached);
    return {
      key: stage,
      stage,
      totalDeals: rows.length,
      percentage: pct(rows.length, total),
      revenue: rev,
      revenuePct: pct(rev, revenue),
      won: rows.filter(isWon).length,
      lost: rows.filter(isLost).length,
      open: rows.filter(isOpen).length,
      avg: rows.length ? rev / rows.length : 0,
      reached,
      winRate,
    };
  });
}

export function groupSummaryRows(deals, keyFn, keys) {
  const total = deals.length;
  const revenue = sumBy(deals, (d) => d.amount);
  return keys.map((key) => {
    const rows = deals.filter((d) => keyFn(d) === key);
    const rev = sumBy(rows, (d) => d.amount);
    return {
      key, stage: key, totalDeals: rows.length, percentage: pct(rows.length, total), revenue: rev,
      revenuePct: pct(rev, revenue), won: rows.filter(isWon).length, lost: rows.filter(isLost).length,
      open: rows.filter(isOpen).length, avg: rows.length ? rev / rows.length : 0,
    };
  });
}

export function totalsRow(rows) {
  const totalDeals = sumBy(rows, (r) => r.totalDeals);
  const revenue = sumBy(rows, (r) => r.revenue);
  return {
    totalDeals, revenue, percentage: totalDeals ? 100 : 0, revenuePct: revenue ? 100 : 0,
    won: sumBy(rows, (r) => r.won), lost: sumBy(rows, (r) => r.lost), open: sumBy(rows, (r) => r.open),
    avg: totalDeals ? revenue / totalDeals : 0,
  };
}

/** % of all deals that reached each pipeline step */
export function funnelConversion(deals) {
  const total = deals.length;
  const steps = [...OPEN_STAGES, 'Closed Won'];
  return steps.map((s, i) => ({ stage: s, value: Math.round(pct(deals.filter((d) => funnelIndex(d) >= i && !(i === 4 && !isWon(d))).length, total)) }));
}

// ---------- invoices ----------
export const balanceOf = (inv) => Math.max(0, (Number(inv.amount) || 0) - (Number(inv.paidAmount) || 0));

export function deriveInvoiceStatus(inv, today = todayISO()) {
  const bal = balanceOf(inv);
  if (bal <= 0) return 'Paid';
  if (inv.dueDate && inv.dueDate < today) return 'Overdue';
  if ((Number(inv.paidAmount) || 0) > 0) return 'Partially Paid';
  return 'Pending';
}

export function invoiceKpis(invoices) {
  const total = sumBy(invoices, (i) => i.amount);
  const paid = sumBy(invoices, (i) => Math.min(i.paidAmount, i.amount));
  const overdue = sumBy(invoices.filter((i) => i.status === 'Overdue'), balanceOf);
  const pending = sumBy(invoices.filter((i) => i.status !== 'Overdue'), balanceOf);
  return { count: invoices.length, total, paid, pending, overdue };
}
