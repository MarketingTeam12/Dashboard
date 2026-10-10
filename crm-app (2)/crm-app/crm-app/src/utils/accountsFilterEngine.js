import { todayISO } from './calculations.js';
import { evaluateDateOperator, OPERATORS_BY_TYPE } from './contactsFilterEngine.js';

export { OPERATORS_BY_TYPE, evaluateDateOperator };

/**
 * SECTION A — Exact 6 System Defined Filters for Accounts
 */
export const ACCOUNT_SYSTEM_DEFINED_FILTERS = [
  { key: 'Cadences', label: 'Cadences' },
  { key: 'Locked', label: 'Locked' },
  { key: 'Record Action', label: 'Record Action' },
  { key: 'Related Records Action', label: 'Related Records Action' },
  { key: 'Touched Records', label: 'Touched Records' },
  { key: 'Untouched Records', label: 'Untouched Records' },
];

export const ACCOUNT_DROPDOWN_OPTIONS = {
  type: ['Customer', 'Prospect', 'Partner', 'Vendor', 'Competitor', 'Integrator', 'Reseller'],
  industry: [
    'Information Technology',
    'Technology',
    'IT Services',
    'Software',
    'Consulting',
    'Manufacturing',
    'Construction',
    'Finance',
    'Healthcare',
    'Retail',
    'Logistics',
    'Education',
    'Textiles',
  ],
  ownership: ['Private', 'Public', 'Subsidiary', 'Partnership', 'Government'],
  rating: ['Hot', 'Warm', 'Cold', 'Active', 'Acquired'],
  tag: [
    'Enterprise',
    'Strategic',
    'Key Account',
    'Fortune 500',
    'Fast Growth',
    'Q4 Expansion',
    'High Value',
    'Partner Network',
    'Cloud First',
  ],
};

/**
 * SECTION B — Exact 37 Filter By Fields for Accounts (in exact required order and naming)
 */
export const ACCOUNT_FIELD_FILTERS = [
  { key: 'name', label: 'Account Name', type: 'text' },
  { key: 'accountNumber', label: 'Account Number', type: 'text' },
  { key: 'ownerId', label: 'Account Owner', type: 'lookup', lookupSource: 'users' },
  { key: 'accountSite', label: 'Account Site', type: 'text' },
  { key: 'type', label: 'Account Type', type: 'dropdown', optionsKey: 'type' },
  { key: 'annualRevenue', label: 'Annual Revenue', type: 'number' },
  { key: 'billingAddress', label: 'Billing Address', type: 'text' },
  { key: 'billingCity', label: 'Billing Address - City', type: 'text' },
  { key: 'billingCountry', label: 'Billing Address - Country / Region', type: 'text' },
  { key: 'billingFlat', label: 'Billing Address - Flat / House No./ Building / Apartment Name', type: 'text' },
  { key: 'billingState', label: 'Billing Address - State / Province', type: 'text' },
  { key: 'billingStreet', label: 'Billing Address - Street Address', type: 'text' },
  { key: 'billingZip', label: 'Billing Address - Zip / Postal Code', type: 'text' },
  { key: 'connectedTo', label: 'Connected To', type: 'lookup', lookupSource: 'users' },
  { key: 'createdBy', label: 'Created By', type: 'lookup', lookupSource: 'users' },
  { key: 'createdTime', label: 'Created Time', type: 'date' },
  { key: 'employees', label: 'Employees', type: 'number' },
  { key: 'fax', label: 'Fax', type: 'text' },
  { key: 'industry', label: 'Industry', type: 'dropdown', optionsKey: 'industry' },
  { key: 'lastActivityTime', label: 'Last Activity Time', type: 'date' },
  { key: 'modifiedBy', label: 'Modified By', type: 'lookup', lookupSource: 'users' },
  { key: 'modifiedTime', label: 'Modified Time', type: 'date' },
  { key: 'ownership', label: 'Ownership', type: 'dropdown', optionsKey: 'ownership' },
  { key: 'parentAccountId', label: 'Parent Account', type: 'lookup', lookupSource: 'accounts' },
  { key: 'phone', label: 'Phone', type: 'text' },
  { key: 'rating', label: 'Rating', type: 'dropdown', optionsKey: 'rating' },
  { key: 'shippingAddress', label: 'Shipping Address', type: 'text' },
  { key: 'shippingCity', label: 'Shipping Address - City', type: 'text' },
  { key: 'shippingCountry', label: 'Shipping Address - Country / Region', type: 'text' },
  { key: 'shippingFlat', label: 'Shipping Address - Flat / House No./ Building / Apartment Name', type: 'text' },
  { key: 'shippingState', label: 'Shipping Address - State / Province', type: 'text' },
  { key: 'shippingStreet', label: 'Shipping Address - Street Address', type: 'text' },
  { key: 'shippingZip', label: 'Shipping Address - Zip / Postal Code', type: 'text' },
  { key: 'sicCode', label: 'SIC Code', type: 'text' },
  { key: 'tag', label: 'Tag', type: 'dropdown', optionsKey: 'tag' },
  { key: 'tickerSymbol', label: 'Ticker Symbol', type: 'text' },
  { key: 'website', label: 'Website', type: 'text' },
];

/**
 * SECTION C — Exact 10 Filter By Related Modules for Accounts (in exact required order and naming)
 */
export const ACCOUNT_RELATED_MODULE_FILTERS = [
  {
    key: 'accountProducts',
    label: 'Account Product Relation (Products)',
    statuses: ['Active', 'Trial', 'Renewed', 'Expired'],
    presets: [
      { value: 'has_any', label: 'Has related records' },
      { value: 'has_none', label: 'Accounts without product associations' },
      { value: 'product_name', label: 'Accounts associated with specified product' },
    ],
  },
  {
    key: 'memberAccounts',
    label: 'Accounts (Member Accounts)',
    statuses: ['Active', 'New', 'Inactive'],
    presets: [
      { value: 'has_any', label: 'Accounts with child accounts' },
      { value: 'has_none', label: 'Accounts without child accounts' },
      { value: 'subsidiary_count', label: 'Accounts with specified number of subsidiaries' },
    ],
  },
  {
    key: 'cases',
    label: 'Cases',
    statuses: ['Open', 'Escalated', 'Closed'],
    presets: [
      { value: 'has_any', label: 'Has related records' },
      { value: 'has_none', label: 'Has no related records' },
      { value: 'open_cases', label: 'Accounts with open support cases' },
      { value: 'closed_cases', label: 'Accounts with closed support cases' },
    ],
  },
  {
    key: 'contacts',
    label: 'Contacts',
    statuses: ['New', 'Contacted', 'Engaged', 'Qualified', 'Customer'],
    presets: [
      { value: 'has_any', label: 'Accounts with contacts' },
      { value: 'has_none', label: 'Accounts without contacts' },
      { value: 'more_than_5_contacts', label: 'Accounts with more than five contacts' },
    ],
  },
  {
    key: 'deals',
    label: 'Deals',
    statuses: ['Qualification', 'Needs Analysis', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'],
    presets: [
      { value: 'has_any', label: 'Has related records' },
      { value: 'has_none', label: 'Accounts without deals' },
      { value: 'open_deals', label: 'Accounts with open deals' },
      { value: 'closed_won_deals', label: 'Accounts with Closed Won deals' },
      { value: 'closed_lost_deals', label: 'Accounts with Closed Lost deals' },
      { value: 'deal_value_gt', label: 'Accounts with deal value greater than amount' },
    ],
  },
  {
    key: 'emails',
    label: 'Emails',
    statuses: ['Received', 'Sent', 'Opened', 'Clicked', 'Bounced'],
    presets: [
      { value: 'has_any', label: 'Accounts with email activity' },
      { value: 'has_none', label: 'Accounts with no email activity' },
      { value: 'email_date_range', label: 'Accounts with emails during date range' },
    ],
  },
  {
    key: 'invoices',
    label: 'Invoices',
    statuses: ['Paid', 'Pending', 'Overdue', 'Partially Paid'],
    presets: [
      { value: 'has_any', label: 'Has related records' },
      { value: 'has_none', label: 'Has no related records' },
      { value: 'paid_invoices', label: 'Accounts with paid invoices' },
      { value: 'unpaid_invoices', label: 'Accounts with unpaid invoices' },
      { value: 'overdue_invoices', label: 'Accounts with overdue invoices' },
    ],
  },
  {
    key: 'convertedLeads',
    label: 'Leads (Converted Leads)',
    statuses: ['Converted'],
    presets: [
      { value: 'has_any', label: 'Accounts created/linked through converted leads' },
      { value: 'has_none', label: 'Has no converted leads' },
      { value: 'lead_source', label: 'Accounts with specified converted-lead source' },
    ],
  },
  {
    key: 'quotes',
    label: 'Quotes',
    statuses: ['Draft', 'Sent', 'Accepted', 'Declined'],
    presets: [
      { value: 'has_any', label: 'Has related records' },
      { value: 'has_none', label: 'Has no related records' },
      { value: 'draft_quotes', label: 'Accounts with draft quotes' },
      { value: 'sent_quotes', label: 'Accounts with sent quotes' },
      { value: 'accepted_quotes', label: 'Accounts with accepted quotes' },
    ],
  },
  {
    key: 'salesOrders',
    label: 'Sales Orders',
    statuses: ['Active', 'Pending', 'Approved', 'Completed'],
    presets: [
      { value: 'has_any', label: 'Has related records' },
      { value: 'has_none', label: 'Accounts without sales orders' },
      { value: 'active_orders', label: 'Accounts with active orders' },
      { value: 'completed_orders', label: 'Accounts with completed orders' },
    ],
  },
];

export const ACCOUNT_OPERATORS_BY_TYPE = {
  ...OPERATORS_BY_TYPE,
  dropdown: [
    'Is',
    'Is not',
    'Is any of',
    'Contains',
    'Is empty',
    'Is not empty',
  ],
};

export const ACCOUNT_RELATED_CONDITION_MODES = [
  { value: 'has_any', label: 'Has related records' },
  { value: 'has_none', label: 'Has no related records' },
  { value: 'count', label: 'Related record count' },
  { value: 'owner', label: 'Related record owner' },
  { value: 'status', label: 'Related record status' },
  { value: 'created_date', label: 'Related record creation date' },
  { value: 'updated_date', label: 'Related record last modified date' },
];

const ALLOWED_FIELD_KEYS = new Set(ACCOUNT_FIELD_FILTERS.map((f) => f.key));
const ALLOWED_SYSTEM_KEYS = new Set(ACCOUNT_SYSTEM_DEFINED_FILTERS.map((s) => s.key));
const ALLOWED_RELATED_KEYS = new Set(ACCOUNT_RELATED_MODULE_FILTERS.map((r) => r.key));

/**
 * Validate a filter configuration object against allowlisted fields, modules, and operators
 */
export function validateAccountFilterConfig(config = {}) {
  const errors = [];
  if (Array.isArray(config.systemFilters)) {
    for (const s of config.systemFilters) {
      const key = typeof s === 'string' ? s : s?.key;
      if (key && !ALLOWED_SYSTEM_KEYS.has(key)) {
        errors.push(`Unsupported system filter: ${key}`);
      }
    }
  }
  if (Array.isArray(config.fieldFilters)) {
    for (const f of config.fieldFilters) {
      if (f?.field && !ALLOWED_FIELD_KEYS.has(f.field)) {
        errors.push(`Unsupported field filter: ${f.field}`);
      }
    }
  }
  if (Array.isArray(config.relatedFilters)) {
    for (const r of config.relatedFilters) {
      if (r?.module && !ALLOWED_RELATED_KEYS.has(r.module)) {
        errors.push(`Unsupported related module filter: ${r.module}`);
      }
    }
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Search across all 3 filter sections in the "Filter Accounts by" sidebar
 */
export function searchAccountFilterCatalog(query = '') {
  const q = String(query || '').trim().toLowerCase();
  if (!q) {
    return {
      query: '',
      systemFilters: ACCOUNT_SYSTEM_DEFINED_FILTERS,
      fieldFilters: ACCOUNT_FIELD_FILTERS,
      relatedFilters: ACCOUNT_RELATED_MODULE_FILTERS,
      totalMatches:
        ACCOUNT_SYSTEM_DEFINED_FILTERS.length +
        ACCOUNT_FIELD_FILTERS.length +
        ACCOUNT_RELATED_MODULE_FILTERS.length,
    };
  }

  const systemFilters = ACCOUNT_SYSTEM_DEFINED_FILTERS.filter((f) =>
    f.label.toLowerCase().includes(q)
  );
  const fieldFilters = ACCOUNT_FIELD_FILTERS.filter((f) =>
    f.label.toLowerCase().includes(q)
  );
  const relatedFilters = ACCOUNT_RELATED_MODULE_FILTERS.filter((f) =>
    f.label.toLowerCase().includes(q)
  );

  return {
    query: q,
    systemFilters,
    fieldFilters,
    relatedFilters,
    totalMatches: systemFilters.length + fieldFilters.length + relatedFilters.length,
  };
}

/**
 * Account Hierarchy Helpers — prevent circular parent-child relationships
 */
export function getDescendantAccountIds(accountId, accounts = []) {
  const descendants = new Set();
  if (!accountId) return descendants;

  const queue = [accountId];
  while (queue.length > 0) {
    const currentId = queue.shift();
    for (const acc of accounts) {
      if (acc.parentAccountId === currentId && !descendants.has(acc.id)) {
        descendants.add(acc.id);
        queue.push(acc.id);
      }
    }
  }
  return descendants;
}

export function canSetParentAccount(accountId, candidateParentId, accounts = []) {
  if (!candidateParentId) return true;
  if (!accountId) return true;
  if (accountId === candidateParentId) return false;
  const descendants = getDescendantAccountIds(accountId, accounts);
  return !descendants.has(candidateParentId);
}

export function getSelectableParentAccounts(accountId, accounts = []) {
  if (!accountId) return accounts;
  const descendants = getDescendantAccountIds(accountId, accounts);
  return accounts.filter((a) => a.id !== accountId && !descendants.has(a.id));
}

export function getAccountHierarchyTree(account, accounts = []) {
  if (!account) return { ancestors: [], children: [], subAccounts: [] };
  const byId = Object.fromEntries(accounts.map((a) => [a.id, a]));
  const ancestors = [];
  const seen = new Set([account.id]);
  let curr = account.parentAccountId ? byId[account.parentAccountId] : null;
  while (curr && !seen.has(curr.id)) {
    ancestors.unshift(curr);
    seen.add(curr.id);
    curr = curr.parentAccountId ? byId[curr.parentAccountId] : null;
  }

  const children = accounts.filter((a) => a.parentAccountId === account.id);
  const childIds = new Set(children.map((c) => c.id));
  const subAccounts = accounts.filter((a) => childIds.has(a.parentAccountId));

  return { ancestors, children, subAccounts };
}

/**
 * Resolve any of the 37 fields from an Account object + lookup maps
 */
export function getAccountFieldValue(account, fieldKey, ctx = {}) {
  if (!account) return '';
  const { accountsById = {}, usersById = {} } = ctx;

  switch (fieldKey) {
    case 'ownerId':
      return usersById[account.ownerId]?.name || account.ownerId || '';
    case 'createdBy':
      return usersById[account.createdBy]?.name || account.createdBy || '';
    case 'modifiedBy':
      return usersById[account.modifiedBy]?.name || account.modifiedBy || '';
    case 'connectedTo':
      return usersById[account.connectedTo]?.name || account.connectedTo || '';
    case 'parentAccountId':
      return accountsById[account.parentAccountId]?.name || account.parentAccountName || '';
    case 'billingAddress': {
      if (account.billingAddress) return account.billingAddress;
      return [
        account.billingFlat,
        account.billingStreet,
        account.billingCity,
        account.billingState,
        account.billingZip,
        account.billingCountry,
      ]
        .filter(Boolean)
        .join(', ');
    }
    case 'shippingAddress': {
      if (account.shippingAddress) return account.shippingAddress;
      return [
        account.shippingFlat,
        account.shippingStreet,
        account.shippingCity,
        account.shippingState,
        account.shippingZip,
        account.shippingCountry,
      ]
        .filter(Boolean)
        .join(', ');
    }
    case 'tag':
      return Array.isArray(account.tags) ? account.tags.join(', ') : account.tag || '';
    case 'createdTime':
      return account.createdTime || account.createdOn || '';
    case 'modifiedTime':
      return account.modifiedTime || account.updatedAt || account.createdOn || '';
    case 'lastActivityTime':
      return account.lastActivityTime || account.updatedAt || account.createdOn || '';
    default:
      return account[fieldKey] ?? '';
  }
}

/**
 * Evaluate a single Account field condition across all 37 fields
 */
export function evaluateAccountFieldCondition(account, cond, ctx = {}, todayStr = todayISO()) {
  const fieldMeta = ACCOUNT_FIELD_FILTERS.find((f) => f.key === cond.field);
  const type = cond.type || fieldMeta?.type || 'text';
  const operator =
    cond.operator ||
    (type === 'number' ? 'Greater than' : type === 'date' ? 'On' : type === 'dropdown' || type === 'lookup' ? 'Is' : 'Contains');

  const rawVal = getAccountFieldValue(account, cond.field, ctx);

  if (type === 'date') {
    return evaluateDateOperator(rawVal, operator, cond.value, cond.valueTo, todayStr);
  }

  if (type === 'number') {
    const num = Number(rawVal);
    const target = Number(cond.value);
    if (isNaN(num)) return false;
    switch (operator) {
      case 'Equals':
        return !isNaN(target) ? num === target : true;
      case 'Not equals':
        return !isNaN(target) ? num !== target : true;
      case 'Greater than':
        return !isNaN(target) ? num > target : true;
      case 'Less than':
        return !isNaN(target) ? num < target : true;
      case 'Between': {
        const min = cond.value !== '' && cond.value != null ? Number(cond.value) : -Infinity;
        const max = cond.valueTo !== '' && cond.valueTo != null ? Number(cond.valueTo) : Infinity;
        return num >= min && num <= max;
      }
      default:
        return true;
    }
  }

  const strVal = String(rawVal ?? '').trim();
  const strLower = strVal.toLowerCase();

  if (operator === 'Is empty') {
    if (cond.field === 'tag') return !Array.isArray(account.tags) || account.tags.length === 0;
    return strVal === '';
  }
  if (operator === 'Is not empty') {
    if (cond.field === 'tag') return Array.isArray(account.tags) && account.tags.length > 0;
    return strVal !== '';
  }

  const wantRaw = cond.value ?? '';
  if (Array.isArray(wantRaw)) {
    const list = wantRaw.map((x) => String(x).trim().toLowerCase()).filter(Boolean);
    if (!list.length) return true;
    const rawId = String(account[cond.field] ?? '').toLowerCase();
    const tagsLower = Array.isArray(account.tags) ? account.tags.map((t) => t.toLowerCase()) : [];
    if (operator === 'Is not') {
      return !list.some((w) => strLower === w || rawId === w || tagsLower.includes(w));
    }
    return list.some((w) => strLower === w || rawId === w || tagsLower.includes(w) || strLower.includes(w));
  }

  const want = String(wantRaw).trim().toLowerCase();
  if (!want) return true;

  if (type === 'lookup' || type === 'dropdown') {
    const rawId = String(account[cond.field] ?? '').toLowerCase();
    const tagsLower = Array.isArray(account.tags) ? account.tags.map((t) => t.toLowerCase()) : [];
    switch (operator) {
      case 'Is':
        if (cond.field === 'tag') return tagsLower.includes(want) || strLower.includes(want);
        return strLower === want || rawId === want;
      case 'Is not':
        if (cond.field === 'tag') return !tagsLower.includes(want) && !strLower.includes(want);
        return strLower !== want && rawId !== want;
      case 'Is any of': {
        const parts = want.split(',').map((s) => s.trim()).filter(Boolean);
        return parts.some((p) => strLower === p || rawId === p || tagsLower.includes(p) || strLower.includes(p));
      }
      case 'Contains':
        return strLower.includes(want) || tagsLower.some((t) => t.includes(want));
      default:
        return strLower === want || rawId === want || strLower.includes(want);
    }
  }

  // Text operators
  switch (operator) {
    case 'Is':
      return strLower === want;
    case 'Is not':
      return strLower !== want;
    case 'Contains':
      return strLower.includes(want);
    case 'Does not contain':
      return !strLower.includes(want);
    case 'Starts with':
      return strLower.startsWith(want);
    case 'Ends with':
      return strLower.endsWith(want);
    default:
      return strLower.includes(want);
  }
}

/**
 * Retrieve related records for an Account for any of the 10 Related Modules
 */
export function getRelatedRecordsForAccount(account, moduleKey, ctx = {}) {
  if (!account) return [];
  const aid = account.id;
  const rel = ctx.accountRelations || {};
  const contactRel = ctx.contactRelations || {};
  const accContacts = (ctx.contacts || []).filter((c) => c.accountId === aid);
  const accContactIds = new Set(accContacts.map((c) => c.id));

  switch (moduleKey) {
    case 'contacts':
      return accContacts;
    case 'deals':
      return (ctx.deals || []).filter((d) => d.accountId === aid);
    case 'invoices':
      return (ctx.invoices || []).filter((i) => i.accountId === aid);
    case 'memberAccounts':
      return (ctx.accounts || []).filter((a) => a.parentAccountId === aid);
    case 'notes': {
      const direct = (rel.notes || []).filter((r) => r.accountId === aid);
      const viaContact = (contactRel.notes || []).filter(
        (r) => r.accountId === aid || accContactIds.has(r.contactId)
      );
      return [...direct, ...viaContact];
    }
    case 'connectedRecords':
    case 'convertedLeads': {
      const direct = (rel.convertedLeads || []).filter((r) => r.accountId === aid);
      const directConn = (rel.connectedRecords || []).filter((r) => r.accountId === aid);
      const viaContact = (contactRel.convertedLeads || []).filter(
        (r) => r.accountId === aid || accContactIds.has(r.contactId)
      );
      const viaConnLeads = (contactRel.connectedLeads || []).filter(
        (r) => r.accountId === aid || accContactIds.has(r.contactId)
      );
      return [...directConn, ...direct, ...viaContact, ...viaConnLeads];
    }
    case 'cadences': {
      const direct = (rel.cadences || []).filter((r) => r.accountId === aid);
      const viaContact = (contactRel.cadences || []).filter(
        (r) => r.accountId === aid || accContactIds.has(r.contactId)
      );
      return [...direct, ...viaContact];
    }
    case 'attachments': {
      const direct = (rel.attachments || []).filter((r) => r.accountId === aid);
      const viaContact = (contactRel.attachments || []).filter(
        (r) => r.accountId === aid || accContactIds.has(r.contactId)
      );
      return [...direct, ...viaContact];
    }
    case 'tasks': {
      const sysTasks = (ctx.tasks || []).filter(
        (t) =>
          t.accountId === aid ||
          (t.module === 'Accounts' && t.recordId === aid) ||
          accContactIds.has(t.contactId) ||
          (t.module === 'Contacts' && accContactIds.has(t.recordId))
      );
      const direct = (rel.tasks || []).filter((r) => r.accountId === aid);
      const viaContact = (contactRel.tasks || []).filter(
        (r) => r.accountId === aid || accContactIds.has(r.contactId)
      );
      return [...sysTasks, ...direct, ...viaContact];
    }
    case 'calls':
      return (ctx.calls || []).filter(
        (c) => c.accountId === aid || accContactIds.has(c.contactId)
      );
    case 'meetings': {
      const direct = (rel.meetings || []).filter((r) => r.accountId === aid);
      const viaContact = (contactRel.meetings || []).filter(
        (r) => r.accountId === aid || accContactIds.has(r.contactId)
      );
      return [...direct, ...viaContact];
    }
    case 'products':
    case 'accountProducts': {
      const direct = (rel.accountProducts || []).filter((r) => r.accountId === aid);
      const viaContact = (contactRel.contactProducts || []).filter(
        (r) => r.accountId === aid || accContactIds.has(r.contactId)
      );
      return [...direct, ...viaContact];
    }
    case 'cases': {
      const direct = (rel.cases || []).filter((r) => r.accountId === aid);
      const viaContact = (contactRel.cases || []).filter(
        (r) => r.accountId === aid || accContactIds.has(r.contactId)
      );
      return [...direct, ...viaContact];
    }
    case 'emails': {
      const direct = (rel.emails || []).filter((r) => r.accountId === aid);
      const viaContact = (contactRel.emails || []).filter(
        (r) => r.accountId === aid || accContactIds.has(r.contactId)
      );
      return [...direct, ...viaContact];
    }
    case 'quotes': {
      const direct = (rel.quotes || []).filter((r) => r.accountId === aid);
      const viaContact = (contactRel.quotes || []).filter(
        (r) => r.accountId === aid || accContactIds.has(r.contactId)
      );
      return [...direct, ...viaContact];
    }
    case 'salesOrders': {
      const direct = (rel.salesOrders || []).filter((r) => r.accountId === aid);
      const viaContact = (contactRel.salesOrders || []).filter(
        (r) => r.accountId === aid || accContactIds.has(r.contactId)
      );
      return [...direct, ...viaContact];
    }
    case 'purchaseOrders': {
      const direct = (rel.purchaseOrders || []).filter((r) => r.accountId === aid);
      const viaContact = (contactRel.purchaseOrders || []).filter(
        (r) => r.accountId === aid || accContactIds.has(r.contactId)
      );
      return [...direct, ...viaContact];
    }
    case 'campaigns': {
      const direct = (rel.campaigns || []).filter((r) => r.accountId === aid);
      const viaContact = (contactRel.campaigns || []).filter(
        (r) => r.accountId === aid || accContactIds.has(r.contactId)
      );
      return [...direct, ...viaContact];
    }
    case 'social':
      return account.website || account.tickerSymbol
        ? [{ id: `soc-${aid}`, handle: account.website || account.name, platform: 'Corporate Profile' }]
        : [];
    case 'reportingContacts':
      return accContacts.filter((c) => Boolean(c.reportingToId) || accContacts.some((sub) => sub.reportingToId === c.id));
    case 'zohoSignDocuments': {
      const direct = (rel.zohoSignDocuments || []).filter((r) => r.accountId === aid);
      const viaContact = (contactRel.zohoSignDocuments || []).filter(
        (r) => r.accountId === aid || accContactIds.has(r.contactId)
      );
      return [...direct, ...viaContact];
    }
    case 'zohoSurvey': {
      const direct = (rel.zohoSurvey || []).filter((r) => r.accountId === aid);
      const viaContact = (contactRel.voCEvents || []).filter(
        (r) => r.accountId === aid || accContactIds.has(r.contactId)
      );
      return [...direct, ...viaContact];
    }
    case 'projects': {
      const direct = (rel.projects || []).filter((r) => r.accountId === aid);
      const wonDealProjects = (ctx.deals || [])
        .filter((d) => d.accountId === aid && d.stage === 'Closed Won')
        .map((d) => ({
          id: `proj-${d.id}`,
          accountId: aid,
          dealId: d.id,
          name: `${d.name} — Delivery Project`,
          status: 'Active',
          budget: d.amount,
          ownerId: d.ownerId,
          createdDate: d.createdOn,
        }));
      const existingDealIds = new Set(direct.map((p) => p.dealId).filter(Boolean));
      return [...direct, ...wonDealProjects.filter((p) => !existingDealIds.has(p.dealId))];
    }
    default:
      return [];
  }
}

/**
 * Evaluate a single Related Module condition for an Account across all 10 Related Modules
 */
export function evaluateAccountRelatedCondition(account, cond, ctx = {}, todayStr = todayISO()) {
  const records = getRelatedRecordsForAccount(account, cond.module, ctx);
  const mode = cond.mode || 'has_any';

  switch (mode) {
    case 'has_any':
      return records.length > 0;
    case 'has_none':
      return records.length === 0;

    // Contacts presets
    case 'more_than_5_contacts':
      return records.length > 5;

    // Deals presets
    case 'open_deals':
      return records.some((d) => !['Closed Won', 'Closed Lost'].includes(d.stage));
    case 'closed_won_deals':
      return records.some((d) => d.stage === 'Closed Won');
    case 'closed_lost_deals':
      return records.some((d) => d.stage === 'Closed Lost');
    case 'deal_value_gt': {
      const minAmt = Number(cond.value ?? 0);
      return records.some((d) => Number(d.amount || 0) > minAmt);
    }

    // Invoices presets
    case 'paid_invoices':
      return records.some((i) => i.status === 'Paid');
    case 'unpaid_invoices':
      return records.some((i) => ['Pending', 'Overdue', 'Partially Paid'].includes(i.status));
    case 'overdue_invoices':
      return records.some((i) => i.status === 'Overdue');

    // Quotes presets
    case 'draft_quotes':
      return records.some((q) => q.status === 'Draft');
    case 'sent_quotes':
      return records.some((q) => ['Sent', 'Delivered'].includes(q.status));
    case 'accepted_quotes':
      return records.some((q) => q.status === 'Accepted');

    // Sales Orders presets
    case 'active_orders':
      return records.some((so) => ['Active', 'Pending', 'Approved'].includes(so.status));
    case 'completed_orders':
      return records.some((so) => ['Completed', 'Fulfilled'].includes(so.status));

    // Member Accounts presets
    case 'subsidiary_count': {
      const wantCount = Number(cond.value ?? 1);
      const op = cond.operator || 'Greater than';
      if (op === 'Equals') return records.length === wantCount;
      if (op === 'Less than') return records.length < wantCount;
      return records.length >= wantCount;
    }

    // Emails presets
    case 'email_date_range':
      return records.some((e) =>
        evaluateDateOperator(e.createdDate || e.updatedDate, 'Between', cond.value, cond.valueTo, todayStr)
      );

    // Cases presets
    case 'open_cases':
      return records.some((c) => ['Open', 'Escalated'].includes(c.status));
    case 'closed_cases':
      return records.some((c) => c.status === 'Closed');

    // Account Product Relation presets
    case 'product_name': {
      const wantProd = String(cond.value || '').trim().toLowerCase();
      if (!wantProd) return records.length > 0;
      return records.some((p) => String(p.productName || p.name || '').toLowerCase().includes(wantProd));
    }

    // Leads (Converted Leads) presets
    case 'lead_source': {
      const wantSrc = String(cond.value || '').trim().toLowerCase();
      if (!wantSrc) return records.length > 0;
      return records.some((l) => String(l.leadSource || l.source || '').toLowerCase().includes(wantSrc));
    }

    // Generic structured related modes
    case 'count': {
      const op = cond.operator || 'Greater than';
      const target = Number(cond.value ?? 0);
      const count = records.length;
      if (op === 'Equals') return count === target;
      if (op === 'Not equals') return count !== target;
      if (op === 'Greater than') return count > target;
      if (op === 'Less than') return count < target;
      if (op === 'Between') {
        const min = Number(cond.value ?? 0);
        const max = Number(cond.valueTo ?? Infinity);
        return count >= min && count <= max;
      }
      return count > 0;
    }
    case 'status': {
      if (!cond.value) return records.length > 0;
      const want = String(cond.value).toLowerCase();
      return records.some(
        (r) => String(r.status || r.stage || r.direction || '').toLowerCase() === want
      );
    }
    case 'owner': {
      if (!cond.value) return records.length > 0;
      const want = String(cond.value).toLowerCase();
      return records.some((r) => {
        const ownerName = (ctx.usersById?.[r.ownerId]?.name || '').toLowerCase();
        return (
          String(r.ownerId || '').toLowerCase() === want ||
          ownerName === want ||
          ownerName.includes(want)
        );
      });
    }
    case 'created_date':
      return records.some((r) =>
        evaluateDateOperator(
          r.createdDate || r.createdOn || r.invoiceDate || r.dateTime,
          cond.operator || 'On',
          cond.value,
          cond.valueTo,
          todayStr
        )
      );
    case 'updated_date':
      return records.some((r) =>
        evaluateDateOperator(
          r.updatedDate || r.updatedAt || r.createdDate || r.createdOn,
          cond.operator || 'On',
          cond.value,
          cond.valueTo,
          todayStr
        )
      );
    default:
      return records.length > 0;
  }
}

/**
 * Evaluate System Defined Filters (all 6) for an Account using real data relationships
 */
export function evaluateAccountSystemFilter(account, sysItem, ctx = {}, todayStr = todayISO()) {
  const sysKey = typeof sysItem === 'string' ? sysItem : sysItem?.key;
  const cfg = typeof sysItem === 'object' && sysItem !== null ? sysItem : {};

  const contacts = getRelatedRecordsForAccount(account, 'contacts', ctx);
  const deals = getRelatedRecordsForAccount(account, 'deals', ctx);
  const invoices = getRelatedRecordsForAccount(account, 'invoices', ctx);
  const emails = getRelatedRecordsForAccount(account, 'emails', ctx);
  const calls = (ctx.calls || []).filter((c) => c.accountId === account.id);
  const cadences = (ctx.accountRelations?.cadences || []).filter((c) => c.accountId === account.id);

  switch (sysKey) {
    case 'Cadences': {
      const enrolled = Boolean(account.cadenceName) || cadences.length > 0;
      if (cfg.mode === 'not_enrolled') return !enrolled;
      if (!enrolled) return false;
      if (cfg.status) {
        const st = String(cfg.status).toLowerCase();
        const acctSt = String(account.cadenceStatus || 'Active').toLowerCase();
        if (acctSt !== st && !cadences.some((c) => String(c.status).toLowerCase() === st)) return false;
      }
      if (cfg.ownerId) {
        const own = String(cfg.ownerId).toLowerCase();
        const ownerName = (ctx.usersById?.[account.ownerId]?.name || '').toLowerCase();
        if (String(account.ownerId).toLowerCase() !== own && !ownerName.includes(own)) return false;
      }
      return true;
    }
    case 'Locked': {
      if (cfg.mode === 'unlocked') return !account.locked;
      return Boolean(account.locked);
    }
    case 'Record Action': {
      const actionType = cfg.actionType || 'any';
      if (actionType === 'created') return Boolean(account.createdTime || account.createdOn);
      if (actionType === 'modified') return Boolean(account.touched || account.modifiedTime || account.updatedAt);
      if (actionType === 'archived') return Boolean(account.archived || account.status === 'Inactive');
      return Boolean(account.hasRecordAction || account.touched || account.archived);
    }
    case 'Related Records Action': {
      const hasRelated =
        deals.length > 0 || calls.length > 0 || emails.length > 0 || invoices.length > 0 || contacts.length > 0;
      if (cfg.mode === 'without_activity') return !hasRelated;
      if (cfg.fromDate || cfg.toDate) {
        const allDates = [
          ...deals.map((d) => d.createdOn),
          ...calls.map((c) => String(c.dateTime || '').slice(0, 10)),
          ...emails.map((e) => e.createdDate),
          ...invoices.map((i) => i.invoiceDate),
        ].filter(Boolean);
        return allDates.some((dt) => evaluateDateOperator(dt, 'Between', cfg.fromDate, cfg.toDate, todayStr));
      }
      return hasRelated;
    }
    case 'Touched Records': {
      if (!account.touched) return false;
      if (cfg.fromDate || cfg.toDate) {
        const dt = account.lastActivityTime || account.modifiedTime || account.createdOn;
        return evaluateDateOperator(dt, 'Between', cfg.fromDate, cfg.toDate, todayStr);
      }
      return true;
    }
    case 'Untouched Records': {
      if (cfg.fromDate || cfg.toDate) {
        const dt = account.lastActivityTime || account.modifiedTime || account.createdOn;
        return !evaluateDateOperator(dt, 'Between', cfg.fromDate, cfg.toDate, todayStr);
      }
      return !account.touched;
    }
    default:
      return true;
  }
}

/**
 * Evaluate a single builder rule or nested condition group `{ logic: 'AND'|'OR', conditions: [...] }`
 */
export function evaluateAccountRuleOrGroup(account, item, ctx = {}, todayStr = todayISO()) {
  if (!item || item.enabled === false) return true;

  // Nested group support: { logic: 'AND' | 'OR', conditions: [...] }
  if (Array.isArray(item.conditions)) {
    const active = item.conditions.filter((c) => c && c.enabled !== false);
    if (active.length === 0) return true;
    const logic = (item.logic || item.join || 'AND').toUpperCase();
    if (logic === 'OR') {
      return active.some((c) => evaluateAccountRuleOrGroup(account, c, ctx, todayStr));
    }
    return active.every((c) => evaluateAccountRuleOrGroup(account, c, ctx, todayStr));
  }

  if (item.category === 'system') {
    return evaluateAccountSystemFilter(account, item.field || item.key || item, ctx, todayStr);
  }
  if (item.category === 'related' || item.module) {
    return evaluateAccountRelatedCondition(account, item, ctx, todayStr);
  }
  return evaluateAccountFieldCondition(account, item, ctx, todayStr);
}

/**
 * Master Accounts Filter Engine
 */
export function evaluateAccountFilters(accounts, filterState = {}, ctx = {}, todayStr = todayISO()) {
  const {
    viewKey = 'all',
    systemFilters = [],
    systemFilterConfigs = {},
    fieldFilters = [],
    relatedFilters = [],
    builderRules = [],
    conditionGroups = [],
    globalJoin = 'AND',
    tableSearch = '',
    activeUser = null,
    enforcePermissions = false,
    includeArchived = false,
  } = filterState;

  const sysList = Array.isArray(systemFilters) ? systemFilters : [...systemFilters];
  const activeFields = fieldFilters.filter((f) => f && f.enabled !== false);
  const activeRelated = relatedFilters.filter((r) => r && r.enabled !== false);
  const activeBuilder = builderRules.filter((b) => b && b.enabled !== false);
  const activeGroups = conditionGroups.filter((g) => g && g.enabled !== false);
  const q = String(tableSearch || '').trim().toLowerCase();

  // Check if Record Action archived filter is active
  const wantsArchived =
    includeArchived ||
    viewKey === 'archived' ||
    (sysList.includes('Record Action') && systemFilterConfigs?.['Record Action']?.actionType === 'archived');

  return (accounts || []).filter((account) => {
    if (!wantsArchived && account.archived) return false;

    // 1. Record-level permission check when enforced for non-manager roles
    if (enforcePermissions && activeUser && activeUser.role !== 'Sales Manager') {
      const canRead =
        account.ownerId === activeUser.id ||
        account.createdBy === activeUser.id ||
        account.connectedTo === activeUser.id ||
        !account.privateRecord;
      if (!canRead) return false;
    }

    // 2. Preset View check
    if (viewKey === 'mine' && account.ownerId !== (activeUser?.id || 'u1')) return false;
    if (viewKey === 'customers' && account.type !== 'Customer') return false;
    if (viewKey === 'partners' && account.type !== 'Partner') return false;
    if (viewKey === 'inactive' && account.status !== 'Inactive') return false;
    if (viewKey === 'archived' && !account.archived) return false;

    // 3. Table Search (independent of left filter panel search)
    if (q) {
      const ownerName = ctx.usersById?.[account.ownerId]?.name || '';
      const parentName = ctx.accountsById?.[account.parentAccountId]?.name || '';
      const hay = [
        account.name,
        account.accountNumber,
        account.accountSite,
        account.type,
        account.industry,
        account.ownership,
        account.rating,
        account.phone,
        account.website,
        account.billingCity,
        account.shippingCity,
        account.sicCode,
        account.tickerSymbol,
        ownerName,
        parentName,
        ...(account.tags || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }

    // 4. System Defined Filters
    for (const sysItem of sysList) {
      const key = typeof sysItem === 'string' ? sysItem : sysItem?.key;
      const cfg = typeof sysItem === 'object' ? sysItem : { key, ...(systemFilterConfigs[key] || {}) };
      if (!evaluateAccountSystemFilter(account, cfg, ctx, todayStr)) return false;
    }

    // 5. Field Filters + Related Filters + Builder Rules + Grouped Conditions
    const conditionResults = [];

    for (const ff of activeFields) {
      const unary = [
        'Is empty',
        'Is not empty',
        'Today',
        'Yesterday',
        'This Week',
        'This Month',
        'Last 30 Days',
      ].includes(ff.operator);
      const hasVal =
        unary ||
        (Array.isArray(ff.value) ? ff.value.length > 0 : String(ff.value ?? '').trim() !== '');
      if (!hasVal) continue;
      conditionResults.push(evaluateAccountFieldCondition(account, ff, ctx, todayStr));
    }

    for (const rf of activeRelated) {
      conditionResults.push(evaluateAccountRelatedCondition(account, rf, ctx, todayStr));
    }

    for (const br of activeBuilder) {
      conditionResults.push(evaluateAccountRuleOrGroup(account, br, ctx, todayStr));
    }

    for (const grp of activeGroups) {
      conditionResults.push(evaluateAccountRuleOrGroup(account, grp, ctx, todayStr));
    }

    if (conditionResults.length > 0) {
      if (globalJoin === 'OR') {
        if (!conditionResults.some(Boolean)) return false;
      } else {
        if (!conditionResults.every(Boolean)) return false;
      }
    }

    return true;
  });
}

