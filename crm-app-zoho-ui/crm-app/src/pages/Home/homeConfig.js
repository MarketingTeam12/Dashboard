// Home page configuration: module/field definitions, criteria, default layout and persistence.
// Customisation is stored in its own LocalStorage namespace so it never touches CRM records
// and survives "Reset demo data".

import { todayISO } from '../../utils/calculations';

export const HOME_STORAGE_KEY = 'zcrm.home.v1';
export const PAGE_SIZES = [5, 10, 20, 50];

// ---------- dates ----------
/** Accepts ISO (YYYY-MM-DD / full ISO) and DD/MM/YYYY. Returns Date or null. */
export function parseAnyDate(v) {
  if (!v) return null;
  const s = String(v).trim();
  let m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  const d = new Date(s);
  return isNaN(d) ? null : d;
}
const ymd = (d) => (d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : '');
export const toISODate = (v) => ymd(parseAnyDate(v));
/** DD/MM/YYYY, the format shown in the reference. */
export function fmtDMY(v) {
  const d = parseAnyDate(v);
  if (!d) return '';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}
/** Write a date back in the same shape the record originally used. */
export function inOriginalFormat(original, iso) {
  if (!iso) return '';
  if (original && /^\d{2}\/\d{2}\/\d{4}$/.test(String(original))) return fmtDMY(iso);
  return iso;
}

export const fmtMoney = (n) => `₹${(Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function fmtDateTime(v) {
  const d = parseAnyDate(v);
  if (!d) return '';
  let h = d.getHours();
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${fmtDMY(v)} ${String(h).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} ${ap}`;
}

function range(kind) {
  const now = new Date();
  const today = parseAnyDate(todayISO());
  if (kind === 'today') return [today, today];
  if (kind === 'week') {
    const start = new Date(today); start.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const end = new Date(start); end.setDate(start.getDate() + 6);
    return [start, end];
  }
  if (kind === 'month') return [new Date(now.getFullYear(), now.getMonth(), 1), new Date(now.getFullYear(), now.getMonth() + 1, 0)];
  if (kind === 'nextMonth') return [new Date(now.getFullYear(), now.getMonth() + 1, 1), new Date(now.getFullYear(), now.getMonth() + 2, 0)];
  return [null, null];
}
const inRangeOf = (v, kind) => {
  const d = parseAnyDate(v);
  if (!d) return false;
  const [a, b] = range(kind);
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return day >= a && day <= b;
};
const beforeToday = (v) => {
  const d = parseAnyDate(v);
  return !!d && new Date(d.getFullYear(), d.getMonth(), d.getDate()) < parseAnyDate(todayISO());
};

// ---------- related-to parsing ("Deal - ABC Technologies") ----------
export function splitRelated(rel) {
  const s = String(rel || '');
  const m = s.match(/^(Deal|Account|Lead|Contact)\s*-\s*(.+)$/i);
  if (!m) return { module: '', name: s };
  return { module: m[1][0].toUpperCase() + m[1].slice(1).toLowerCase(), name: m[2].trim() };
}

// ---------- module definitions ----------
// column.type drives rendering: text | link | date | datetime | currency | stage | tag | source | related | owner | badge
// ctx = crm context (lookups) passed at runtime.
const ownerCol = (label) => ({ key: 'ownerId', label, type: 'text', value: (r, c) => c.userName(r.ownerId) });

export const MODULE_DEFS = {
  tasks: {
    label: 'Tasks',
    singular: 'Task',
    collection: 'tasks',
    title: (r) => r.subject || r.title || 'Task',
    openPath: (r) => `/workqueue?open=${r.id}`,
    columns: [
      { key: 'subject', label: 'Subject', type: 'link', value: (r) => r.subject || r.title || '' },
      { key: 'dueDate', label: 'Due Date', type: 'date', value: (r) => r.dueDate },
      { key: 'status', label: 'Status', type: 'text', value: (r) => r.status || '' },
      { key: 'priority', label: 'Priority', type: 'text', value: (r) => r.priority || '' },
      { key: 'relatedTo', label: 'Related To', type: 'related', value: (r) => splitRelated(r.relatedTo).name },
      { key: 'contactName', label: 'Contact Name', type: 'text', value: (r) => r.contactName || '' },
      ownerCol('Task Owner'),
    ],
    criteria: [
      { id: 'open', label: 'Open Tasks', test: (r) => r.status !== 'Completed' },
      { id: 'dueToday', label: "Today's Tasks", test: (r) => r.status !== 'Completed' && inRangeOf(r.dueDate, 'today') },
      { id: 'overdue', label: 'Overdue Tasks', test: (r) => r.status !== 'Completed' && beforeToday(r.dueDate) },
      { id: 'completed', label: 'Completed Tasks', test: (r) => r.status === 'Completed' },
      { id: 'all', label: 'All Tasks', test: () => true },
    ],
    defaultSort: { key: 'dueDate', dir: 'asc' },
  },
  leads: {
    label: 'Leads',
    singular: 'Lead',
    collection: 'leads',
    title: (r) => r.name || 'Lead',
    openPath: (r) => `/leads?open=${r.id}`,
    columns: [
      { key: 'name', label: 'Lead Name', type: 'link', value: (r) => r.name || '' },
      { key: 'tag', label: 'Tags', type: 'tag', value: (r) => r.tag || '' },
      { key: 'source', label: 'Lead Source', type: 'source', info: 'Source from which the lead was captured', value: (r) => r.source || r.leadSource || '' },
      ownerCol('Lead Owner'),
      { key: 'company', label: 'Company', type: 'text', value: (r) => r.company || '' },
      { key: 'email', label: 'Email', type: 'text', value: (r) => r.email || '' },
      { key: 'phone', label: 'Phone', type: 'text', value: (r) => r.phone || r.mobile || '' },
      { key: 'city', label: 'City', type: 'text', value: (r) => r.city || '' },
      { key: 'status', label: 'Lead Status', type: 'text', value: (r) => r.status || '' },
      { key: 'createdOn', label: 'Created Time', type: 'date', value: (r) => r.createdOn },
    ],
    criteria: [
      { id: 'today', label: "Today's Leads", test: (r) => inRangeOf(r.createdOn, 'today') },
      { id: 'week', label: "This Week's Leads", test: (r) => inRangeOf(r.createdOn, 'week') },
      { id: 'month', label: "This Month's Leads", test: (r) => inRangeOf(r.createdOn, 'month') },
      { id: 'notConverted', label: 'Open Leads', test: (r) => r.status !== 'Converted' && r.status !== 'Lost' },
      { id: 'all', label: 'All Leads', test: () => true },
    ],
    defaultSort: null,
  },
  deals: {
    label: 'Deals',
    singular: 'Deal',
    collection: 'deals',
    title: (r) => r.name || 'Deal',
    openPath: (r) => `/deals?open=${r.id}`,
    columns: [
      { key: 'name', label: 'Deal Name', type: 'link', value: (r) => r.name || '' },
      { key: 'amount', label: 'Amount', type: 'currency', align: 'right', value: (r) => Number(r.amount) || 0 },
      { key: 'stage', label: 'Stage', type: 'stage', value: (r) => r.stage || '' },
      { key: 'closingDate', label: 'Closing Date', type: 'date', value: (r) => r.closingDate },
      { key: 'accountId', label: 'Account Name', type: 'account', value: (r, c) => (r.accountId ? c.accountName(r.accountId) : '') },
      { key: 'contactId', label: 'Contact Name', type: 'text', value: (r, c) => (r.contactId ? c.contactName(r.contactId) : '') },
      ownerCol('Deal Owner'),
      { key: 'probability', label: 'Probability (%)', type: 'text', value: (r) => (r.probability ?? '') },
      { key: 'source', label: 'Lead Source', type: 'text', value: (r) => r.source || '' },
    ],
    criteria: [
      { id: 'closingMonth', label: 'Closing This Month', test: (r) => inRangeOf(r.closingDate, 'month') },
      { id: 'closingNext', label: 'Closing Next Month', test: (r) => inRangeOf(r.closingDate, 'nextMonth') },
      { id: 'open', label: 'Open Deals', test: (r) => r.stage !== 'Closed Won' && r.stage !== 'Closed Lost' },
      { id: 'won', label: 'Closed Won Deals', test: (r) => r.stage === 'Closed Won' },
      { id: 'all', label: 'All Deals', test: () => true },
    ],
    defaultSort: { key: 'closingDate', dir: 'asc' },
  },
  calls: {
    label: 'Calls',
    singular: 'Call',
    collection: 'calls',
    title: (r) => r.subject || 'Call',
    openPath: (r) => `/calls?open=${r.id}`,
    columns: [
      { key: 'subject', label: 'Subject', type: 'link', value: (r) => r.subject || '' },
      { key: 'type', label: 'Call Type', type: 'text', value: (r) => r.type || '' },
      { key: 'dateTime', label: 'Call Start Time', type: 'datetime', value: (r) => r.dateTime },
      { key: 'status', label: 'Status', type: 'text', value: (r) => r.status || '' },
      { key: 'contactId', label: 'Contact Name', type: 'text', value: (r, c) => (r.contactId ? c.contactName(r.contactId) : '') },
      ownerCol('Call Owner'),
    ],
    criteria: [
      { id: 'today', label: "Today's Calls", test: (r) => inRangeOf(r.dateTime, 'today') },
      { id: 'scheduled', label: 'Scheduled Calls', test: (r) => r.status === 'Scheduled' },
      { id: 'missed', label: 'Missed Calls', test: (r) => r.status === 'Missed' },
      { id: 'all', label: 'All Calls', test: () => true },
    ],
    defaultSort: { key: 'dateTime', dir: 'desc' },
  },
  contacts: {
    label: 'Contacts',
    singular: 'Contact',
    collection: 'contacts',
    title: (r) => r.name || 'Contact',
    openPath: (r) => `/contacts?open=${r.id}`,
    columns: [
      { key: 'name', label: 'Contact Name', type: 'link', value: (r) => r.name || '' },
      { key: 'accountId', label: 'Account Name', type: 'account', value: (r, c) => (r.accountId ? c.accountName(r.accountId) : '') },
      { key: 'email', label: 'Email', type: 'text', value: (r) => r.email || '' },
      { key: 'phone', label: 'Phone', type: 'text', value: (r) => r.phone || '' },
      ownerCol('Contact Owner'),
      { key: 'followUp', label: 'Follow-up Date', type: 'date', value: (r) => r.followUp },
      { key: 'lifecycle', label: 'Lifecycle Stage', type: 'text', value: (r) => r.lifecycle || '' },
    ],
    criteria: [
      { id: 'followToday', label: "Today's Follow-ups", test: (r) => inRangeOf(r.followUp, 'today') },
      { id: 'month', label: 'Created This Month', test: (r) => inRangeOf(r.createdOn, 'month') },
      { id: 'all', label: 'All Contacts', test: () => true },
    ],
    defaultSort: null,
  },
  accounts: {
    label: 'Accounts',
    singular: 'Account',
    collection: 'accounts',
    title: (r) => r.name || 'Account',
    openPath: (r) => `/accounts?open=${r.id}`,
    columns: [
      { key: 'name', label: 'Account Name', type: 'link', value: (r) => r.name || '' },
      { key: 'type', label: 'Account Type', type: 'text', value: (r) => r.type || '' },
      { key: 'industry', label: 'Industry', type: 'text', value: (r) => r.industry || '' },
      { key: 'location', label: 'Location', type: 'text', value: (r) => r.location || '' },
      ownerCol('Account Owner'),
      { key: 'createdOn', label: 'Created Time', type: 'date', value: (r) => r.createdOn },
    ],
    criteria: [
      { id: 'month', label: 'Created This Month', test: (r) => inRangeOf(r.createdOn, 'month') },
      { id: 'active', label: 'Active Accounts', test: (r) => r.status === 'Active' },
      { id: 'all', label: 'All Accounts', test: () => true },
    ],
    defaultSort: null,
  },
};

// ---------- custom component field types ----------
export const FIELD_TYPES = [
  { value: 'text', label: 'Single Line' },
  { value: 'textarea', label: 'Multi Line' },
  { value: 'number', label: 'Number' },
  { value: 'currency', label: 'Currency' },
  { value: 'date', label: 'Date' },
  { value: 'email', label: 'Email' },
  { value: 'tel', label: 'Phone' },
  { value: 'select', label: 'Pick List' },
  { value: 'checkbox', label: 'Checkbox' },
];

/** Columns for a custom component, built from its field definitions. */
export function customColumns(fields = []) {
  return fields.map((f, i) => ({
    key: f.id,
    label: f.label,
    type: i === 0 ? 'customLink' : f.type === 'currency' ? 'currency' : f.type === 'date' ? 'date' : f.type === 'checkbox' ? 'bool' : 'text',
    align: f.type === 'currency' || f.type === 'number' ? 'right' : undefined,
    value: (r) => {
      const v = r[f.id];
      if (f.type === 'number' || f.type === 'currency') return v === '' || v == null ? '' : Number(v);
      if (f.type === 'checkbox') return v ? 'Yes' : 'No';
      return v ?? '';
    },
  }));
}

// ---------- ids ----------
export const uid = (p) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// ---------- defaults (the reference layout) ----------
export function defaultComponents() {
  return [
    { id: 'cmp-open-tasks', kind: 'list', module: 'tasks', criteria: 'open', title: 'Open Tasks', size: 'half', hidden: false,
      columns: ['subject', 'dueDate', 'status', 'priority', 'relatedTo'], sort: null, pageSize: 10, wrap: true, widths: {}, builtIn: true },
    { id: 'cmp-todays-leads', kind: 'list', module: 'leads', criteria: 'today', title: "Today's Leads", size: 'half', hidden: false,
      columns: ['name', 'tag', 'source', 'ownerId'], sort: null, pageSize: 10, wrap: true, widths: {}, builtIn: true },
    { id: 'cmp-closing-month', kind: 'list', module: 'deals', criteria: 'closingMonth', title: 'Closing This Month', size: 'half', hidden: false,
      columns: ['name', 'amount', 'stage', 'closingDate', 'accountId'], sort: null, pageSize: 10, wrap: true, widths: {}, builtIn: true },
  ];
}

export function defaultView() {
  return { id: 'home-default', name: 'Marketing Department (CEO)', welcome: 'Marketing Department', components: defaultComponents() };
}

export function defaultState() {
  return { version: 1, activeViewId: 'home-default', views: [defaultView()], customRecords: {} };
}

// ---------- validation / normalisation of stored data ----------
function normComponent(c) {
  if (!c || typeof c !== 'object' || !c.id) return null;
  if (c.kind === 'list') {
    const def = MODULE_DEFS[c.module];
    if (!def) return null;
    const keys = new Set(def.columns.map((col) => col.key));
    const columns = (Array.isArray(c.columns) ? c.columns : []).filter((k) => keys.has(k));
    return {
      ...c,
      title: String(c.title || def.label),
      criteria: def.criteria.some((cr) => cr.id === c.criteria) ? c.criteria : def.criteria[0].id,
      columns: columns.length ? columns : def.columns.slice(0, 4).map((col) => col.key),
      size: c.size === 'full' ? 'full' : 'half',
      hidden: !!c.hidden,
      pageSize: PAGE_SIZES.includes(c.pageSize) ? c.pageSize : 10,
      wrap: c.wrap !== false,
      widths: c.widths && typeof c.widths === 'object' ? c.widths : {},
      sort: c.sort && c.sort.key ? c.sort : null,
    };
  }
  if (c.kind === 'custom') {
    const fields = (Array.isArray(c.fields) ? c.fields : []).filter((f) => f && f.id && f.label);
    if (!fields.length) return null;
    const ids = new Set(fields.map((f) => f.id));
    const columns = (Array.isArray(c.columns) ? c.columns : []).filter((k) => ids.has(k));
    return {
      ...c,
      title: String(c.title || 'Custom Component'),
      fields,
      columns: columns.length ? columns : fields.map((f) => f.id),
      size: c.size === 'full' ? 'full' : 'half',
      hidden: !!c.hidden,
      pageSize: PAGE_SIZES.includes(c.pageSize) ? c.pageSize : 10,
      wrap: c.wrap !== false,
      widths: c.widths && typeof c.widths === 'object' ? c.widths : {},
      sort: c.sort && c.sort.key ? c.sort : null,
    };
  }
  return null;
}

export function normalizeState(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.views) || !raw.views.length) return defaultState();
  const views = raw.views
    .filter((v) => v && v.id)
    .map((v) => ({
      id: v.id,
      name: String(v.name || 'Home'),
      welcome: String(v.welcome ?? ''),
      components: (Array.isArray(v.components) ? v.components : []).map(normComponent).filter(Boolean),
    }));
  if (!views.length) return defaultState();
  const activeViewId = views.some((v) => v.id === raw.activeViewId) ? raw.activeViewId : views[0].id;
  const customRecords = raw.customRecords && typeof raw.customRecords === 'object' ? raw.customRecords : {};
  return { version: 1, activeViewId, views, customRecords };
}

export function loadHomeState() {
  try {
    const s = localStorage.getItem(HOME_STORAGE_KEY);
    return normalizeState(s ? JSON.parse(s) : null);
  } catch {
    return defaultState();
  }
}

export function saveHomeState(state) {
  try {
    localStorage.setItem(HOME_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
