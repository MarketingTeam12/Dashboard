import { todayISO } from './calculations.js';

/**
 * SECTION 1 — Exact 12 System Defined Filters
 */
export const SYSTEM_DEFINED_FILTERS = [
  { key: 'Activities', label: 'Activities' },
  { key: 'Cadences', label: 'Cadences' },
  { key: 'Campaigns', label: 'Campaigns' },
  { key: 'Email Sentiment', label: 'Email Sentiment', type: 'text', options: ['Positive', 'Neutral', 'Negative'] },
  { key: 'Latest Email Status', label: 'Latest Email Status', type: 'text', options: ['Opened', 'Clicked', 'Delivered', 'Bounced'] },
  { key: 'Locked', label: 'Locked', type: 'boolean' },
  { key: 'Record Action', label: 'Record Action' },
  { key: 'Related Records Action', label: 'Related Records Action' },
  { key: 'Scoring Rules', label: 'Scoring Rules', type: 'number' },
  { key: 'Touched Records', label: 'Touched Records' },
  { key: 'Untouched Records', label: 'Untouched Records' },
  { key: 'Website Activity', label: 'Website Activity', type: 'boolean' },
];

export const ZOHO_SYSTEM_DEFINED_FILTERS = SYSTEM_DEFINED_FILTERS;

/**
 * SECTION 2 — Exact 8 Website Activity Filters
 */
export const WEBSITE_ACTIVITY_FILTERS = [
  { key: 'averageTimeSpent', label: 'Average Time Spent (Minutes)', type: 'number' },
  { key: 'daysVisited', label: 'Days Visited', type: 'number' },
  { key: 'firstPageVisited', label: 'First Page Visited', type: 'text' },
  { key: 'firstVisit', label: 'First Visit', type: 'date' },
  { key: 'mostRecentVisit', label: 'Most Recent Visit', type: 'date' },
  { key: 'numberOfChats', label: 'Number Of Chats', type: 'number' },
  { key: 'referrer', label: 'Referrer', type: 'text' },
  { key: 'visitorScore', label: 'Visitor Score', type: 'number' },
];

/**
 * SECTION 3 — Exact 33 Filter By Fields (in required order and naming)
 */
export const CONTACT_FIELD_FILTERS = [
  { key: 'accountId', label: 'Account Name', type: 'lookup', lookupSource: 'accounts' },
  { key: 'associatedAccounts', label: 'Associated Accounts', type: 'text' },
  { key: 'city', label: 'City', type: 'text' },
  { key: 'clientName', label: 'Client Name', type: 'text' },
  { key: 'connectedTo', label: 'Connected To', type: 'lookup', lookupSource: 'users' },
  { key: 'name', label: 'Contact Name', type: 'text' },
  { key: 'ownerId', label: 'Contact Owner', type: 'lookup', lookupSource: 'users' },
  { key: 'contactToDeal', label: 'Contact to Deal', type: 'text' },
  { key: 'createdBy', label: 'Created By', type: 'lookup', lookupSource: 'users' },
  { key: 'createdTime', label: 'Created Time', type: 'date' },
  { key: 'department', label: 'Department', type: 'text' },
  { key: 'email', label: 'Email', type: 'text' },
  { key: 'firstName', label: 'First Name', type: 'text' },
  { key: 'lastActivityTime', label: 'Last Activity Time', type: 'date' },
  { key: 'lastName', label: 'Last Name', type: 'text' },
  { key: 'leadManager1', label: 'Lead Manager 1', type: 'lookup', lookupSource: 'users' },
  { key: 'leadSource', label: 'Lead Source', type: 'text' },
  { key: 'mailingCity', label: 'Mailing City', type: 'text' },
  { key: 'mailingCountry', label: 'Mailing Country', type: 'text' },
  { key: 'mailingState', label: 'Mailing State', type: 'text' },
  { key: 'mailingStreet', label: 'Mailing Street', type: 'text' },
  { key: 'mailingZip', label: 'Mailing Zip', type: 'text' },
  { key: 'mobile', label: 'Mobile', type: 'text' },
  { key: 'modifiedBy', label: 'Modified By', type: 'lookup', lookupSource: 'users' },
  { key: 'modifiedTime', label: 'Modified Time', type: 'date' },
  { key: 'phone', label: 'Phone', type: 'text' },
  { key: 'salutation', label: 'Salutation', type: 'text' },
  { key: 'secondaryEmail', label: 'Secondary Email', type: 'text' },
  { key: 'socialLeadId', label: 'Social Lead ID', type: 'text' },
  { key: 'tag', label: 'Tag', type: 'text' },
  { key: 'unsubscribedMode', label: 'Unsubscribed Mode', type: 'text' },
  { key: 'unsubscribedTime', label: 'Unsubscribed Time', type: 'date' },
  { key: 'vendorId', label: 'Vendor ID', type: 'lookup', lookupSource: 'vendors' },
];

export const ZOHO_CONTACT_FIELD_FILTERS = CONTACT_FIELD_FILTERS;

/**
 * SECTION 4 — Exact 22 Filter By Related Modules (in required order and naming)
 */
export const RELATED_MODULE_FILTERS = [
  {
    key: 'calls',
    label: 'Calls',
    statuses: ['Completed', 'Scheduled', 'Missed', 'Busy'],
    presets: [
      { value: 'has any', label: 'Has at least one related record' },
      { value: 'has none', label: 'Has no related records' },
    ],
  },
  {
    key: 'cases',
    label: 'Cases',
    statuses: ['Open', 'Escalated', 'Closed'],
    presets: [
      { value: 'has any', label: 'Has at least one related record' },
      { value: 'has none', label: 'Has no related records' },
    ],
  },
  {
    key: 'contactProducts',
    label: 'Contact Product Relation (Products)',
    statuses: ['Active', 'Trial', 'Expired'],
    presets: [
      { value: 'has any', label: 'Has at least one related record' },
      { value: 'has none', label: 'Has no related records' },
    ],
  },
  {
    key: 'contactsCity',
    label: 'Contacts (City)',
    presets: [
      { value: 'has any', label: 'Has contacts in same city' },
      { value: 'has none', label: 'No other contacts in same city' },
    ],
  },
  {
    key: 'reportingContacts',
    label: 'Contacts (Reporting Contacts)',
    statuses: ['New', 'Contacted', 'Engaged', 'Qualified', 'Customer'],
    presets: [
      { value: 'has any', label: 'Has at least one related record' },
      { value: 'has none', label: 'Has no related records' },
    ],
  },
  {
    key: 'dealContactRoles',
    label: 'Deal Contact Role (Contact Roles)',
    statuses: ['Decision Maker', 'Executive Sponsor', 'Evaluator', 'Procurement'],
    presets: [
      { value: 'has any', label: 'Has at least one related record' },
      { value: 'has none', label: 'Has no related records' },
    ],
  },
  {
    key: 'deals',
    label: 'Deals',
    statuses: ['Qualification', 'Needs Analysis', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'],
    presets: [
      { value: 'has any', label: 'Has at least one related record' },
      { value: 'has none', label: 'Contacts with no deals' },
      { value: 'open_deal', label: 'Contacts with at least one open deal' },
      { value: 'closed_won_deal', label: 'Contacts with a Closed Won deal' },
    ],
  },
  {
    key: 'emails',
    label: 'Emails',
    statuses: ['Received', 'Sent', 'Opened', 'Clicked', 'Bounced'],
    presets: [
      { value: 'has any', label: 'Has at least one related record' },
      { value: 'has none', label: 'Contacts with no email activity' },
      { value: 'received_emails', label: 'Contacts with received emails' },
      { value: 'sent_emails', label: 'Contacts with sent emails' },
    ],
  },
  {
    key: 'estimates',
    label: 'Estimates (Estimate Contacts)',
    statuses: ['Sent', 'Accepted', 'Draft'],
    presets: [
      { value: 'has any', label: 'Has at least one related record' },
      { value: 'has none', label: 'Has no related records' },
    ],
  },
  {
    key: 'invitees',
    label: 'Invitees (Invited Meetings)',
    statuses: ['Accepted', 'Tentative', 'Invited'],
    presets: [
      { value: 'has any', label: 'Has at least one related record' },
      { value: 'has none', label: 'Has no related records' },
    ],
  },
  {
    key: 'invoices',
    label: 'Invoices (Invoice Contacts)',
    statuses: ['Paid', 'Pending', 'Overdue', 'Partially Paid'],
    presets: [
      { value: 'has any', label: 'Has at least one related record' },
      { value: 'has none', label: 'Has no related records' },
      { value: 'unpaid_invoices', label: 'Contacts with unpaid invoices' },
      { value: 'paid_invoices', label: 'Contacts with paid invoices' },
    ],
  },
  {
    key: 'connectedLeads',
    label: 'Leads (Connected Records)',
    statuses: ['Pre-Qualified', 'Warm', 'Hot'],
    presets: [
      { value: 'has any', label: 'Has at least one related record' },
      { value: 'has none', label: 'Has no related records' },
    ],
  },
  {
    key: 'convertedLeads',
    label: 'Leads (Converted Leads)',
    statuses: ['Converted'],
    presets: [
      { value: 'has any', label: 'Has at least one related record' },
      { value: 'has none', label: 'Has no related records' },
    ],
  },
  {
    key: 'meetings',
    label: 'Meetings',
    statuses: ['Upcoming', 'Completed', 'Cancelled'],
    presets: [
      { value: 'has any', label: 'Has at least one related record' },
      { value: 'has none', label: 'Has no related records' },
      { value: 'upcoming_meetings', label: 'Contacts with upcoming meetings' },
      { value: 'meetings_this_month', label: 'Contacts with meetings this month' },
    ],
  },
  {
    key: 'notes',
    label: 'Notes',
    statuses: ['Active', 'Pinned'],
    presets: [
      { value: 'has any', label: 'Has at least one related record' },
      { value: 'has none', label: 'Has no related records' },
    ],
  },
  {
    key: 'salesOrders',
    label: 'Sales Orders (Sales Order Contacts)',
    statuses: ['Pending', 'Approved', 'Fulfilled'],
    presets: [
      { value: 'has any', label: 'Has at least one related record' },
      { value: 'has none', label: 'Has no related records' },
    ],
  },
  {
    key: 'tasks',
    label: 'Tasks',
    statuses: ['Open', 'Overdue', 'Completed'],
    presets: [
      { value: 'has any', label: 'Has at least one related record' },
      { value: 'has none', label: 'Contacts with no tasks' },
      { value: 'overdue_tasks', label: 'Contacts with overdue tasks' },
      { value: 'completed_tasks', label: 'Contacts with completed tasks' },
    ],
  },
  {
    key: 'voCEvents',
    label: 'VoC Events',
    statuses: ['Completed', 'Scheduled'],
    presets: [
      { value: 'has any', label: 'Has at least one related record' },
      { value: 'has none', label: 'Has no related records' },
    ],
  },
  {
    key: 'voCKeywords',
    label: 'VoC Keywords',
    statuses: ['Positive', 'Neutral', 'Negative'],
    presets: [
      { value: 'has any', label: 'Has at least one related record' },
      { value: 'has none', label: 'Has no related records' },
    ],
  },
  {
    key: 'voCResponses',
    label: 'VoC Responses',
    statuses: ['Reviewed', 'Pending'],
    presets: [
      { value: 'has any', label: 'Has at least one related record' },
      { value: 'has none', label: 'Has no related records' },
    ],
  },
  {
    key: 'whatsappMessages',
    label: 'Whatsapp messages',
    statuses: ['Delivered', 'Read', 'Received'],
    presets: [
      { value: 'has any', label: 'Has at least one related record' },
      { value: 'has none', label: 'Has no related records' },
    ],
  },
  {
    key: 'zohoSignDocuments',
    label: 'Zoho Sign Documents (ZohoSign Documents)',
    statuses: ['Completed', 'In Progress', 'Draft'],
    presets: [
      { value: 'has any', label: 'Has at least one related record' },
      { value: 'has none', label: 'Has no related records' },
    ],
  },
];

export const ZOHO_RELATED_MODULE_FILTERS = RELATED_MODULE_FILTERS;

/**
 * Filter Operators grouped by field type
 */
export const OPERATORS_BY_TYPE = {
  text: [
    'is',
    'is not',
    'contains',
    'does not contain',
    'starts with',
    'is empty',
    'is not empty',
  ],
  number: [
    'equals',
    'greater than',
    'less than',
    'between',
  ],
  date: [
    'is',
    'before',
    'after',
    'between',
    'Today',
    'Yesterday',
    'This Week',
    'This Month',
    'Last 30 Days',
    'is empty',
    'is not empty',
  ],
  boolean: [
    'is',
    'is not',
    'Yes',
    'No',
  ],
  lookup: [
    'is',
    'is not',
    'contains',
    'does not contain',
    'is empty',
    'is not empty',
  ],
  related: [
    'has any',
    'has none',
    'matches selected record',
  ],
};

export const RELATED_CONDITION_MODES = [
  { value: 'has any', label: 'Has at least one related record' },
  { value: 'has none', label: 'Has no related records' },
  { value: 'matches selected record', label: 'Matches selected record' },
  { value: 'count', label: 'Related record count' },
  { value: 'status', label: 'Related record status' },
  { value: 'owner', label: 'Related record owner' },
  { value: 'created_date', label: 'Related record created date' },
];

/**
 * Filter search across all 4 categories:
 * 1. System Defined Filters (12)
 * 2. Website Activity (8)
 * 3. Filter By Fields (33)
 * 4. Filter By Related Modules (22)
 */
export function searchFilterCatalog(query = '') {
  const q = String(query || '').trim().toLowerCase();
  if (!q) {
    return {
      query: '',
      systemFilters: SYSTEM_DEFINED_FILTERS,
      websiteActivityFilters: WEBSITE_ACTIVITY_FILTERS,
      fieldFilters: CONTACT_FIELD_FILTERS,
      relatedFilters: RELATED_MODULE_FILTERS,
      totalMatches:
        SYSTEM_DEFINED_FILTERS.length +
        WEBSITE_ACTIVITY_FILTERS.length +
        CONTACT_FIELD_FILTERS.length +
        RELATED_MODULE_FILTERS.length,
    };
  }

  const systemFilters = SYSTEM_DEFINED_FILTERS.filter((f) =>
    f.label.toLowerCase().includes(q)
  );
  const websiteActivityFilters = WEBSITE_ACTIVITY_FILTERS.filter((f) =>
    f.label.toLowerCase().includes(q)
  );
  const fieldFilters = CONTACT_FIELD_FILTERS.filter((f) =>
    f.label.toLowerCase().includes(q)
  );
  const relatedFilters = RELATED_MODULE_FILTERS.filter((f) =>
    f.label.toLowerCase().includes(q)
  );

  return {
    query: q,
    systemFilters,
    websiteActivityFilters,
    fieldFilters,
    relatedFilters,
    totalMatches:
      systemFilters.length +
      websiteActivityFilters.length +
      fieldFilters.length +
      relatedFilters.length,
  };
}

/**
 * Resolve any field value from Contact object + lookup maps
 */
export function getContactFieldValue(contact, fieldKey, ctx = {}) {
  if (!contact) return '';
  const { accountsById = {}, usersById = {}, contactsById = {} } = ctx;

  switch (fieldKey) {
    case 'accountId':
    case 'accountName':
      return accountsById[contact.accountId]?.name || contact.accountName || '';
    case 'associatedAccounts':
      return contact.associatedAccounts || '';
    case 'city':
      return contact.city || contact.mailingCity || '';
    case 'clientName':
      return contact.clientName || contact.name || '';
    case 'name':
    case 'contactName':
      return contact.name || '';
    case 'ownerId':
    case 'contactOwner':
      return usersById[contact.ownerId]?.name || contact.ownerId || '';
    case 'contactToDeal':
      return contact.contactToDeal || '';
    case 'createdBy':
      return usersById[contact.createdBy]?.name || contact.createdBy || '';
    case 'createdTime':
      return contact.createdTime || contact.createdOn || '';
    case 'department':
      return contact.department || '';
    case 'email':
      return contact.email || '';
    case 'firstName': {
      if (contact.firstName) return contact.firstName;
      const parts = String(contact.name || '').trim().split(/\s+/);
      return parts[0] || '';
    }
    case 'lastActivityTime':
      return contact.lastActivityTime || contact.lastContacted || contact.createdOn || '';
    case 'lastName': {
      if (contact.lastName) return contact.lastName;
      const parts = String(contact.name || '').trim().split(/\s+/);
      return parts.slice(1).join(' ') || '';
    }
    case 'leadManager1':
      return usersById[contact.leadManager1]?.name || contact.leadManager1 || '';
    case 'leadSource':
      return contact.leadSource || '';
    case 'mailingCity':
      return contact.mailingCity || '';
    case 'mailingCountry':
      return contact.mailingCountry || '';
    case 'mailingState':
      return contact.mailingState || '';
    case 'mailingStreet':
      return contact.mailingStreet || '';
    case 'mailingZip':
      return contact.mailingZip || '';
    case 'mobile':
      return contact.mobile || '';
    case 'modifiedBy':
      return usersById[contact.modifiedBy]?.name || contact.modifiedBy || '';
    case 'modifiedTime':
      return contact.modifiedTime || contact.updatedAt || contact.createdOn || '';
    case 'phone':
      return contact.phone || '';
    case 'salutation':
      return contact.salutation || '';
    case 'secondaryEmail':
      return contact.secondaryEmail || '';
    case 'socialLeadId':
      return contact.socialLeadId || '';
    case 'tag':
      return Array.isArray(contact.tags) ? contact.tags.join(', ') : contact.tag || '';
    case 'unsubscribedMode':
      return contact.unsubscribedMode || '';
    case 'unsubscribedTime':
      return contact.unsubscribedTime || '';
    case 'vendorId':
    case 'vendorName':
      return contact.vendorId || contact.vendorName || '';
    case 'connectedTo':
      return usersById[contact.connectedTo]?.name || contact.connectedTo || '';
    case 'reportingToId':
    case 'reportingTo':
      return contactsById[contact.reportingToId]?.name || contact.reportingToName || '';

    // Website Activity fields
    case 'averageTimeSpent':
      return contact.averageTimeSpent ?? 0;
    case 'daysVisited':
      return contact.daysVisited ?? 0;
    case 'firstPageVisited':
      return contact.firstPageVisited || '';
    case 'firstVisit':
      return contact.firstVisit || '';
    case 'mostRecentVisit':
      return contact.mostRecentVisit || '';
    case 'numberOfChats':
      return contact.numberOfChats ?? 0;
    case 'referrer':
      return contact.referrer || '';
    case 'visitorScore':
      return contact.visitorScore ?? 0;

    // System Defined fields
    case 'Email Sentiment':
    case 'emailSentiment':
      return contact.emailSentiment || 'Neutral';
    case 'Scoring Rules':
    case 'scoringRules':
      return contact.scoringRules ?? 50;
    case 'Website Activity':
    case 'websiteActivity':
      return Boolean(contact.websiteActivity);

    // Legacy address fields fallback
    case 'mailingAddress': {
      if (contact.mailingAddress) return contact.mailingAddress;
      return [
        contact.mailingFlat,
        contact.mailingStreet,
        contact.mailingCity,
        contact.mailingState,
        contact.mailingZip,
        contact.mailingCountry,
      ].filter(Boolean).join(', ');
    }
    case 'otherAddress': {
      if (contact.otherAddress) return contact.otherAddress;
      return [
        contact.otherFlat,
        contact.otherStreet,
        contact.otherCity,
        contact.otherState,
        contact.otherZip,
        contact.otherCountry,
      ].filter(Boolean).join(', ');
    }
    default:
      return contact[fieldKey] ?? '';
  }
}

/**
 * Evaluate a single date condition
 */
export function evaluateDateOperator(rawDateStr, operator, value, valueTo, todayStr = todayISO()) {
  const dateOnly = rawDateStr ? String(rawDateStr).slice(0, 10) : '';
  const op = String(operator || '').toLowerCase();

  if (op === 'is empty') return !dateOnly;
  if (op === 'is not empty') return Boolean(dateOnly);
  if (!dateOnly) return false;

  const refDate = new Date(`${todayStr}T00:00:00`);
  const targetDate = new Date(`${dateOnly}T00:00:00`);
  if (isNaN(targetDate.getTime())) return false;

  const valDate = value ? String(value).slice(0, 10) : '';
  const valToDate = valueTo ? String(valueTo).slice(0, 10) : '';

  switch (op) {
    case 'is':
    case 'on':
      return valDate ? dateOnly === valDate : true;
    case 'before':
      return valDate ? dateOnly < valDate : true;
    case 'after':
      return valDate ? dateOnly > valDate : true;
    case 'between': {
      if (!valDate && !valToDate) return true;
      if (valDate && dateOnly < valDate) return false;
      if (valToDate && dateOnly > valToDate) return false;
      return true;
    }
    case 'today':
      return dateOnly === todayStr;
    case 'yesterday': {
      const y = new Date(refDate);
      y.setDate(y.getDate() - 1);
      return dateOnly === y.toISOString().slice(0, 10);
    }
    case 'this week': {
      const day = refDate.getDay();
      const start = new Date(refDate);
      start.setDate(refDate.getDate() - day);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return targetDate >= start && targetDate <= end;
    }
    case 'this month':
      return dateOnly.slice(0, 7) === todayStr.slice(0, 7);
    case 'last 30 days': {
      const start = new Date(refDate);
      start.setDate(refDate.getDate() - 30);
      return targetDate >= start && targetDate <= refDate;
    }
    default:
      return true;
  }
}

/**
 * Evaluate a single field condition (Text, Number, Date, Boolean, Lookup)
 */
export function evaluateFieldCondition(contact, cond, ctx = {}, todayStr = todayISO()) {
  const allFieldMetas = [
    ...CONTACT_FIELD_FILTERS,
    ...WEBSITE_ACTIVITY_FILTERS,
    ...SYSTEM_DEFINED_FILTERS,
  ];
  const fieldMeta = allFieldMetas.find((f) => f.key === cond.field || f.label === cond.field);
  const type = cond.type || fieldMeta?.type || 'text';
  const op = String(cond.operator || (type === 'boolean' ? 'is' : type === 'date' ? 'is' : type === 'number' ? 'equals' : 'contains')).toLowerCase();
  const rawVal = getContactFieldValue(contact, cond.field, ctx);

  const isBoolField =
    type === 'boolean' ||
    typeof contact[cond.field] === 'boolean' ||
    ['emailOptOut', 'locked', 'websiteActivity', 'touched'].includes(cond.field) ||
    ['yes', 'no'].includes(op) ||
    (typeof cond.value === 'string' && ['yes', 'no', 'true', 'false'].includes(cond.value.toLowerCase()));

  if (isBoolField) {
    const boolVal = Boolean(contact[cond.field] ?? rawVal);
    const wantLower = String(cond.value ?? op).trim().toLowerCase();
    if (op === 'yes') return boolVal === true;
    if (op === 'no') return boolVal === false;
    if (op === 'is') {
      const targetBool = wantLower === 'yes' || wantLower === 'true' || wantLower === '1';
      return boolVal === targetBool;
    }
    if (op === 'is not') {
      const targetBool = wantLower === 'yes' || wantLower === 'true' || wantLower === '1';
      return boolVal !== targetBool;
    }
    return true;
  }

  if (type === 'date') {
    return evaluateDateOperator(rawVal, cond.operator, cond.value, cond.valueTo, todayStr);
  }

  if (type === 'number') {
    const num = Number(rawVal);
    const target = Number(cond.value);
    if (isNaN(num)) return false;

    switch (op) {
      case 'equals':
        return !isNaN(target) ? num === target : true;
      case 'not equals':
        return !isNaN(target) ? num !== target : true;
      case 'greater than':
        return !isNaN(target) ? num > target : true;
      case 'less than':
        return !isNaN(target) ? num < target : true;
      case 'between': {
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

  if (op === 'is empty') return strVal === '';
  if (op === 'is not empty') return strVal !== '';

  const wantRaw = cond.value ?? '';
  if (Array.isArray(wantRaw)) {
    const list = wantRaw.map((x) => String(x).trim().toLowerCase()).filter(Boolean);
    if (!list.length) return true;
    const rawId = String(contact[cond.field] ?? '').toLowerCase();
    return list.some((w) => strLower === w || rawId === w || strLower.includes(w));
  }

  const want = String(wantRaw).trim().toLowerCase();
  if (!want) return true;

  if (type === 'lookup') {
    const rawId = String(contact[cond.field] ?? '').toLowerCase();
    switch (op) {
      case 'is':
        return strLower === want || rawId === want;
      case 'is not':
        return strLower !== want && rawId !== want;
      case 'contains':
        return strLower.includes(want) || rawId.includes(want);
      case 'does not contain':
        return !strLower.includes(want) && !rawId.includes(want);
      case 'is any of': {
        const parts = want.split(',').map((s) => s.trim()).filter(Boolean);
        return parts.some((p) => strLower === p || rawId === p || strLower.includes(p));
      }
      default:
        return strLower.includes(want) || rawId === want;
    }
  }

  // Text operators
  switch (op) {
    case 'is':
      return strLower === want;
    case 'is not':
      return strLower !== want;
    case 'contains':
      return strLower.includes(want);
    case 'does not contain':
      return !strLower.includes(want);
    case 'starts with':
      return strLower.startsWith(want);
    case 'ends with':
      return strLower.endsWith(want);
    default:
      return strLower.includes(want);
  }
}

/**
 * Retrieve related records for a Contact for any of the 22 Related Modules
 */
export function getRelatedRecordsForContact(contact, moduleKey, ctx = {}) {
  if (!contact) return [];
  const cid = contact.id;
  const aid = contact.accountId;
  const rel = ctx.contactRelations || {};

  switch (moduleKey) {
    case 'calls':
      return (ctx.calls || []).filter((r) => r.contactId === cid);
    case 'cases':
      return (rel.cases || []).filter((r) => r.contactId === cid);
    case 'contactProducts':
      return (rel.contactProducts || []).filter((r) => r.contactId === cid);
    case 'contactsCity': {
      const city = contact.mailingCity || contact.city;
      if (!city) return [];
      return (ctx.contacts || []).filter((c) => c.id !== cid && (c.mailingCity === city || c.city === city));
    }
    case 'reportingContacts':
      return (ctx.contacts || []).filter((r) => r.reportingToId === cid);
    case 'dealContactRoles':
      return (rel.dealContactRoles || []).filter((r) => r.contactId === cid);
    case 'deals':
      return (ctx.deals || []).filter((r) => r.contactId === cid);
    case 'emails':
      return (rel.emails || []).filter((r) => r.contactId === cid);
    case 'estimates':
      return (rel.estimates || []).filter((r) => r.contactId === cid);
    case 'invitees':
      return (rel.invitees || []).filter((r) => r.contactId === cid);
    case 'invoices':
      return (ctx.invoices || []).filter((r) => r.contactId === cid || (aid && r.accountId === aid));
    case 'connectedLeads':
      return (rel.connectedLeads || []).filter((r) => r.contactId === cid);
    case 'convertedLeads':
      return (rel.convertedLeads || []).filter((r) => r.contactId === cid);
    case 'meetings':
      return (rel.meetings || []).filter((r) => r.contactId === cid);
    case 'notes':
      return (rel.notes || []).filter((r) => r.contactId === cid);
    case 'salesOrders':
      return (rel.salesOrders || []).filter((r) => r.contactId === cid);
    case 'tasks': {
      const crmTasks = (ctx.tasks || []).filter((r) => r.contactId === cid);
      const seededTasks = (rel.tasks || []).filter((r) => r.contactId === cid);
      return [...crmTasks, ...seededTasks];
    }
    case 'voCEvents':
      return (rel.voCEvents || []).filter((r) => r.contactId === cid);
    case 'voCKeywords':
      return (rel.voCKeywords || []).filter((r) => r.contactId === cid);
    case 'voCResponses':
      return (rel.voCResponses || []).filter((r) => r.contactId === cid);
    case 'whatsappMessages':
      return (rel.whatsappMessages || []).filter((r) => r.contactId === cid);
    case 'zohoSignDocuments':
      return (rel.zohoSignDocuments || []).filter((r) => r.contactId === cid);
    case 'purchaseOrders':
      return (rel.purchaseOrders || []).filter((r) => r.contactId === cid);
    case 'quotes':
      return (rel.quotes || []).filter((r) => r.contactId === cid);
    case 'campaigns':
      return (rel.campaigns || []).filter((r) => r.contactId === cid);
    case 'cadences':
      return (rel.cadences || []).filter((r) => r.contactId === cid);
    case 'attachments':
      return (rel.attachments || []).filter((r) => r.contactId === cid);
    case 'connectedRecords':
      return (rel.connectedRecords || rel.connectedLeads || []).filter((r) => r.contactId === cid);
    case 'invitedMeetings':
      return (rel.invitees || []).filter((r) => r.contactId === cid);
    case 'products':
      return (rel.contactProducts || []).filter((r) => r.contactId === cid);
    default:
      return [];
  }
}

/**
 * Evaluate a single Related Module filter condition
 */
export function evaluateRelatedCondition(contact, cond, ctx = {}, todayStr = todayISO()) {
  const records = getRelatedRecordsForContact(contact, cond.module, ctx);
  const rawMode = cond.mode || cond.operator || 'has any';
  const mode = String(rawMode).toLowerCase().replace(/_/g, ' ');

  if (mode === 'has any') {
    return records.length > 0;
  }
  if (mode === 'has none') {
    return records.length === 0;
  }
  if (mode === 'matches selected record') {
    if (!cond.value) return records.length > 0;
    const want = String(cond.value).toLowerCase().trim();
    return records.some((r) => {
      const hay = [
        r.id,
        r.name,
        r.subject,
        r.title,
        r.dealName,
        r.productName,
        r.caseNumber,
        r.estimateNumber,
        r.soNumber,
        r.eventName,
        r.keyword,
        r.message,
        r.documentName,
        r.status,
        r.stage,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(want);
    });
  }

  // Backwards compatibility presets
  if (mode === 'open deal') {
    return records.some((d) => !['Closed Won', 'Closed Lost'].includes(d.stage));
  }
  if (mode === 'closed won deal') {
    return records.some((d) => d.stage === 'Closed Won');
  }
  if (mode === 'overdue tasks') {
    return records.some((t) => t.status === 'Overdue' || (t.status !== 'Completed' && t.dueDate && t.dueDate < todayStr));
  }
  if (mode === 'completed tasks') {
    return records.some((t) => t.status === 'Completed');
  }
  if (mode === 'upcoming meetings') {
    return records.some((m) => m.status === 'Upcoming' || (m.meetingDate && m.meetingDate >= todayStr));
  }
  if (mode === 'meetings this month') {
    return records.some((m) => String(m.meetingDate || m.createdDate || '').slice(0, 7) === todayStr.slice(0, 7));
  }
  if (mode === 'received emails') {
    return records.some((e) => e.direction === 'Received');
  }
  if (mode === 'sent emails') {
    return records.some((e) => e.direction === 'Sent');
  }
  if (mode === 'unpaid invoices') {
    return records.some((i) => ['Pending', 'Overdue', 'Partially Paid'].includes(i.status));
  }
  if (mode === 'paid invoices') {
    return records.some((i) => i.status === 'Paid');
  }

  // Structured count
  if (mode === 'count') {
    const op = String(cond.operator || 'greater than').toLowerCase();
    const target = Number(cond.value ?? 0);
    const count = records.length;
    if (op === 'equals') return count === target;
    if (op === 'not equals') return count !== target;
    if (op === 'greater than') return count > target;
    if (op === 'less than') return count < target;
    if (op === 'between') {
      const min = Number(cond.value ?? 0);
      const max = Number(cond.valueTo ?? Infinity);
      return count >= min && count <= max;
    }
    return count > 0;
  }

  // Status check
  if (mode === 'status') {
    if (!cond.value) return records.length > 0;
    const want = String(cond.value).toLowerCase();
    return records.some((r) => String(r.status || r.stage || r.direction || '').toLowerCase() === want);
  }

  // Owner check
  if (mode === 'owner') {
    if (!cond.value) return records.length > 0;
    const want = String(cond.value).toLowerCase();
    return records.some((r) => {
      const ownerName = (ctx.usersById?.[r.ownerId]?.name || '').toLowerCase();
      return String(r.ownerId || '').toLowerCase() === want || ownerName === want || ownerName.includes(want);
    });
  }

  return records.length > 0;
}

/**
 * Evaluate System Defined Filters (all 12)
 */
export function evaluateSystemFilter(contact, sysItem, ctx = {}, todayStr = todayISO()) {
  const isObj = typeof sysItem === 'object' && sysItem !== null;
  const sysKey = isObj ? sysItem.field || sysItem.key : sysItem;

  const calls = getRelatedRecordsForContact(contact, 'calls', ctx);
  const tasks = getRelatedRecordsForContact(contact, 'tasks', ctx);
  const meetings = getRelatedRecordsForContact(contact, 'meetings', ctx);
  const deals = getRelatedRecordsForContact(contact, 'deals', ctx);
  const emails = getRelatedRecordsForContact(contact, 'emails', ctx);
  const notes = getRelatedRecordsForContact(contact, 'notes', ctx);

  switch (sysKey) {
    case 'Activities':
      return Boolean(contact.followUp) || calls.length > 0 || tasks.length > 0 || meetings.length > 0;
    case 'Cadences':
      return Boolean(contact.cadenceName) || ((ctx.contactRelations?.cadences || []).some((c) => c.contactId === contact.id && c.status === 'Active'));
    case 'Campaigns':
      return (Array.isArray(contact.campaigns) && contact.campaigns.length > 0) ||
        ((ctx.contactRelations?.campaigns || []).some((c) => c.contactId === contact.id));
    case 'Email Sentiment': {
      if (isObj && sysItem.value) {
        return evaluateFieldCondition(contact, { field: 'emailSentiment', type: 'text', operator: sysItem.operator || 'is', value: sysItem.value }, ctx, todayStr);
      }
      return contact.emailSentiment === 'Positive' || contact.emailSentiment === 'Neutral';
    }
    case 'Latest Email Status': {
      if (isObj && sysItem.value) {
        return evaluateFieldCondition(contact, { field: 'emailStatus', type: 'text', operator: sysItem.operator || 'is', value: sysItem.value }, ctx, todayStr);
      }
      return ['Opened', 'Clicked'].includes(contact.emailStatus) ||
        emails.some((e) => ['Opened', 'Clicked'].includes(e.status));
    }
    case 'Locked':
      if (isObj && sysItem.operator) {
        return evaluateFieldCondition(contact, { field: 'locked', type: 'boolean', operator: sysItem.operator, value: sysItem.value }, ctx, todayStr);
      }
      return Boolean(contact.locked);
    case 'Record Action':
      return Boolean(contact.hasRecordAction) || notes.length > 0 || Boolean(contact.touched);
    case 'Related Records Action':
      return deals.length > 0 || calls.length > 0 || tasks.length > 0 || meetings.length > 0;
    case 'Scoring Rules': {
      if (isObj && (sysItem.value !== '' && sysItem.value != null)) {
        return evaluateFieldCondition(contact, { field: 'scoringRules', type: 'number', operator: sysItem.operator || 'greater than', value: sysItem.value, valueTo: sysItem.valueTo }, ctx, todayStr);
      }
      return (contact.scoringRules ?? 0) >= 30;
    }
    case 'Touched Records':
      return Boolean(contact.touched);
    case 'Untouched Records':
      return !contact.touched;
    case 'Website Activity': {
      if (isObj && sysItem.operator) {
        return evaluateFieldCondition(contact, { field: 'websiteActivity', type: 'boolean', operator: sysItem.operator, value: sysItem.value }, ctx, todayStr);
      }
      return Boolean(contact.websiteActivity) || ((contact.daysVisited ?? 0) > 0);
    }
    default:
      return true;
  }
}

/**
 * Master Contacts Filter Engine
 * Supports:
 * - Table text search (narrows results across name, email, phone, title, company, owner, city, tags)
 * - Saved views preset
 * - System Defined Filters (12)
 * - Website Activity Filters (8)
 * - Field Filters (33)
 * - Related Module Filters (22)
 * - Conjunction logic: 'AND' (all conditions) or 'OR' (any condition)
 * - Role-based permissions
 */
export function evaluateContactFilters(contacts, filterState = {}, ctx = {}, todayStr = todayISO()) {
  const {
    viewKey = 'all',
    systemFilters = [],
    websiteActivityFilters = [],
    fieldFilters = [],
    relatedFilters = [],
    builderRules = [],
    globalJoin = 'AND',
    tableSearch = '',
    activeUser = null,
    enforcePermissions = false,
  } = filterState;

  const sysList = Array.isArray(systemFilters) ? systemFilters : [...systemFilters];
  const activeFields = fieldFilters.filter((f) => f && f.enabled !== false);
  const activeWebsite = websiteActivityFilters.filter((w) => w && w.enabled !== false);
  const activeRelated = relatedFilters.filter((r) => r && r.enabled !== false);
  const activeBuilder = builderRules.filter((b) => b && b.enabled !== false);
  const q = String(tableSearch || '').trim().toLowerCase();

  return (contacts || []).filter((contact) => {
    // 1. Role & Record-level Access Control
    if (enforcePermissions && activeUser && activeUser.role !== 'Sales Manager') {
      const canRead =
        contact.ownerId === activeUser.id ||
        contact.createdBy === activeUser.id ||
        contact.connectedTo === activeUser.id ||
        !contact.privateRecord;
      if (!canRead) return false;
    }

    // 2. Saved View check
    if (viewKey === 'mine' && contact.ownerId !== (activeUser?.id || 'u1')) return false;
    if (viewKey === 'followup' && !(contact.followUp && contact.followUp <= todayStr)) return false;
    if (viewKey === 'customers' && contact.lifecycle !== 'Customer') return false;
    if (viewKey === 'optout' && !contact.emailOptOut) return false;
    if (viewKey === 'touched' && !contact.touched) return false;

    // 3. Table Search (independent of filter catalog search)
    if (q) {
      const accName = ctx.accountsById?.[contact.accountId]?.name || contact.accountName || '';
      const ownerName = ctx.usersById?.[contact.ownerId]?.name || '';
      const hay = [
        contact.name,
        contact.firstName,
        contact.lastName,
        contact.email,
        contact.secondaryEmail,
        contact.phone,
        contact.mobile,
        contact.designation,
        contact.department,
        accName,
        ownerName,
        contact.mailingCity,
        contact.city,
        ...(contact.tags || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }

    // 4. Collect all condition evaluations
    const conditionResults = [];

    // System Defined Filters (if selected via sidebar/checkboxes)
    for (const sysKey of sysList) {
      conditionResults.push(evaluateSystemFilter(contact, sysKey, ctx, todayStr));
    }

    // Website Activity filters
    for (const wf of activeWebsite) {
      conditionResults.push(evaluateFieldCondition(contact, wf, ctx, todayStr));
    }

    // Field Filters
    for (const ff of activeFields) {
      const op = String(ff.operator || '').toLowerCase();
      const unary = [
        'is empty',
        'is not empty',
        'today',
        'yesterday',
        'this week',
        'this month',
        'last 30 days',
        'yes',
        'no',
      ].includes(op);
      const hasVal = unary || (Array.isArray(ff.value) ? ff.value.length > 0 : String(ff.value ?? '').trim() !== '');
      if (!hasVal) continue;
      conditionResults.push(evaluateFieldCondition(contact, ff, ctx, todayStr));
    }

    // Related Module Filters
    for (const rf of activeRelated) {
      conditionResults.push(evaluateRelatedCondition(contact, rf, ctx, todayStr));
    }

    // Advanced Builder Rules
    for (const br of activeBuilder) {
      const cat = br.category || 'field';
      if (cat === 'system') {
        conditionResults.push(evaluateSystemFilter(contact, br, ctx, todayStr));
      } else if (cat === 'related') {
        conditionResults.push(evaluateRelatedCondition(contact, br, ctx, todayStr));
      } else {
        conditionResults.push(evaluateFieldCondition(contact, br, ctx, todayStr));
      }
    }

    // If any conditions were evaluated, combine with globalJoin ('AND' or 'OR')
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
