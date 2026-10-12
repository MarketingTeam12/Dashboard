import { CAMPAIGN_TYPES, LEAD_SOURCES, LEAD_STATUSES, LEAD_TAGS, USER_GROUPS, USER_ROLES, USERS } from '../../data/seedData.js';
import { addDays, parseDate, todayISO } from '../../utils/calculations.js';

export { CAMPAIGN_TYPES, USER_GROUPS, USER_ROLES };

export const CURRENT_USER_ID = 'u4'; // "My Leads" = leads owned by this user

// Exact 6 default top navigation tabs in required order
export const VIEW_TABS = ["All Leads", "Today's Leads", 'My Leads', 'Chennai', 'Website', 'Delhi'];
export const DEFAULT_PINNED_TABS = VIEW_TABS;

// Exact 53 Public Views in required alphabetical/Zoho order for the three-dots (⋯) dropdown
export const PUBLIC_VIEWS = [
  'Admission',
  'All Leads',
  'All Locked Leads',
  'Amritsar',
  'Attestation',
  'Bangalore',
  'CEO Approval Pendings',
  'Chandigarh',
  'Chennai',
  'Coimbatore',
  'Converted Leads',
  'Database',
  'Delhi',
  'Dubbing/VoiceOver',
  'Education',
  'Email Marketing',
  'Ernakulam',
  'Followup',
  'Hyderabad',
  'Indiamart Leads',
  'Interpretations',
  'Jaipur',
  'JD',
  'Kottayam',
  'Leads in Review',
  'Leads Shared by Me',
  'Leads Shared to Me',
  'Madurai',
  'Mailing Labels',
  'Mangalore',
  'Mumbai',
  'My Converted Leads',
  'My Leads',
  'Nagpur',
  'Nashik',
  'Other Category',
  'Overseas Education',
  'Pondicherry',
  'Pune',
  'Recently Created Leads',
  'Recently Modified Leads',
  'Surat',
  "Today's Leads",
  'Transcription',
  'Translation',
  'Trivandrum',
  'Typing/DTP',
  'Unread Leads',
  'Unsubscribed Leads',
  'Vadodara',
  'Visa',
  'Visakhapatnam',
  'Website',
];

export const PROTECTED_PUBLIC_VIEWS = new Set(PUBLIC_VIEWS);

export const CITY_PUBLIC_VIEWS = new Set([
  'Amritsar', 'Bangalore', 'Chandigarh', 'Chennai', 'Coimbatore', 'Delhi',
  'Ernakulam', 'Hyderabad', 'Jaipur', 'Kottayam', 'Madurai', 'Mangalore',
  'Mumbai', 'Nagpur', 'Nashik', 'Pondicherry', 'Pune', 'Surat',
  'Trivandrum', 'Vadodara', 'Visakhapatnam',
]);

// Core text comparison operators
export const CORE_OPERATORS = [
  'is',
  "isn't",
  'contains',
  "doesn't contain",
  'starts with',
  'ends with',
  'is empty',
  'is not empty',
];

export const OWNER_EXTRA_OPERATORS = [
  'belongs to Role',
  'does not belong to Role',
  'belongs to Group',
];

export const RECORD_OWNER_OPERATORS = [
  'is',
  'is not',
  'is empty',
  'is not empty',
  'belongs to Role',
  'does not belong to Role',
  'belongs to Group',
];

// Exact 29 Message Time / Date operators in exact required order
export const MESSAGE_TIME_OPERATORS = [
  'age in',
  'due in',
  'Previous',
  'Next',
  'On',
  'before',
  'not between',
  'after',
  'between',
  'Today',
  'Tomorrow',
  'Till Yesterday',
  'Starting tomorrow',
  'Yesterday',
  'This Week',
  'This Month',
  'Previous Week',
  'Previous Month',
  'This Year',
  'Current FY',
  'Current FQ',
  'Previous Year',
  'Previous FY',
  'Previous FQ',
  'Next Year',
  'Next FY',
  'Next FQ',
  'is empty',
  'is not empty',
];

export const RELATIVE_UNIT_DATE_OPERATORS = new Set([
  'age in',
  'due in',
  'Previous',
  'Next',
]);

// Strict operators by field data type (no inappropriate text operators on date/number/checkbox/lookup)
export const OPERATORS_BY_TYPE = {
  text: [...CORE_OPERATORS],
  picklist: ['is', "isn't", 'is empty', 'is not empty'],
  multiselect: ['is', "isn't", 'contains', "doesn't contain", 'is empty', 'is not empty'],
  lookup: ['is', "isn't", 'is empty', 'is not empty'],
  owner: ['is', "isn't", 'is empty', 'is not empty', ...OWNER_EXTRA_OPERATORS],
  number: ['is', "isn't", '>', '<', '>=', '<=', 'between', 'not between', 'is empty', 'is not empty'],
  date: [...MESSAGE_TIME_OPERATORS.slice(0, 27), 'Last 3 Hours', 'is empty', 'is not empty'],
  checkbox: ['checked', 'unchecked'],
};

export const NO_VALUE_DATE_OPERATORS = new Set([
  'Today',
  'Tomorrow',
  'Till Yesterday',
  'Starting tomorrow',
  'Yesterday',
  'This Week',
  'This Month',
  'Previous Week',
  'Previous Month',
  'This Year',
  'Current FY',
  'Current FQ',
  'Previous Year',
  'Previous FY',
  'Previous FQ',
  'Next Year',
  'Next FY',
  'Next FQ',
  'Last 3 Hours',
  'is empty',
  'is not empty',
]);

// A. System Defined Filters (All 20 items from specification)
export const SYSTEM_FILTERS = [
  'Activities',
  'Campaigns',
  'Email Sentiment',
  'Latest Email Status',
  'Locked',
  'Record Action',
  'Related Records Action',
  'Scoring Rules',
  'Touched Records',
  'Untouched Records',
  'Cadences',
  'Website Activity',
  'Average Time Spent (Minutes)',
  'Days Visited',
  'First Page Visited',
  'First Visit',
  'Most Recent Visit',
  'Number Of Chats',
  'Referrer',
  'Visitor Score',
];

export const WEBSITE_ACTIVITY = [
  'Average Time Spent (Minutes)',
  'Days Visited',
  'First Page Visited',
  'First Visit',
  'Most Recent Visit',
  'Number Of Chats',
  'Referrer',
  'Visitor Score',
];

export const SYSTEM_FILTER_CONFIG = {
  Activities: {
    type: 'system_activities',
    options: ['All Activities', 'Open Activities', 'Closed Activities', 'Tasks', 'Calls', 'Meetings', 'Overdue'],
  },
  Campaigns: {
    type: 'system_campaigns',
    campaignTypes: CAMPAIGN_TYPES,
    statuses: ['All Statuses', 'Active', 'Planning', 'Inactive', 'Complete'],
  },
  'Email Sentiment': {
    type: 'picklist',
    options: ['Positive', 'Neutral', 'Negative'],
    get: (l) => l.emailSentiment || '',
  },
  'Latest Email Status': {
    type: 'picklist',
    options: ['Opened', 'Clicked', 'Delivered', 'Sent', 'Bounced'],
    get: (l) => l.latestEmailStatus || '',
  },
  Locked: {
    type: 'checkbox',
    options: ['Locked', 'Unlocked'],
    get: (l) => (l.locked ? 'Locked' : ''),
  },
  'Record Action': {
    type: 'picklist',
    options: ['Modified', 'Created', 'Status Updated', 'Owner Changed'],
    get: (l) => l.recordAction || (l.touched ? 'Modified' : 'Created'),
  },
  'Related Records Action': {
    type: 'picklist',
    options: ['Call Logged', 'Task Created', 'Email Sent', 'Note Added'],
    get: (l) => l.relatedRecordsAction || '',
  },
  'Scoring Rules': {
    type: 'number',
    get: (l) => (l.score != null ? Number(l.score) : ''),
  },
  'Touched Records': {
    type: 'touched',
    options: ['All', 'By User', 'By System'],
    get: (l) => (l.touched ? 'Yes' : ''),
  },
  'Untouched Records': {
    type: 'untouched',
    options: ['All', 'By User', 'By System'],
    get: (l) => (!l.touched ? 'Yes' : ''),
  },
  Cadences: {
    type: 'picklist',
    options: ['Inbound Lead Cadence', 'Enterprise Follow-up', 'Cold Outreach Cadence'],
    get: (l) => l.cadence || '',
  },
  'Website Activity': {
    type: 'checkbox',
    get: (l) => (l.daysVisited > 0 || l.averageTimeSpent > 0 ? 'Yes' : ''),
  },
  'Average Time Spent (Minutes)': {
    type: 'number',
    get: (l) => (l.averageTimeSpent != null ? Number(l.averageTimeSpent) : ''),
  },
  'Days Visited': {
    type: 'number',
    get: (l) => (l.daysVisited != null ? Number(l.daysVisited) : ''),
  },
  'First Page Visited': {
    type: 'text',
    get: (l) => l.firstPageVisited || '',
  },
  'First Visit': {
    type: 'date',
    get: (l) => l.firstVisit || l.createdOn || '',
  },
  'Most Recent Visit': {
    type: 'date',
    get: (l) => l.mostRecentVisit || l.createdOn || '',
  },
  'Number Of Chats': {
    type: 'number',
    get: (l) => (l.numberOfChats != null ? Number(l.numberOfChats) : ''),
  },
  Referrer: {
    type: 'text',
    get: (l) => l.referrer || '',
  },
  'Visitor Score': {
    type: 'number',
    get: (l) => (l.visitorScore != null ? Number(l.visitorScore) : l.score ?? ''),
  },
};

export const leadCategory = (l) => l.category || l.industry || '';
export const leadSource = (l) => l.source || l.leadSource || '';

const resolveUser = (idOrName) => {
  if (!idOrName) return null;
  return USERS.find((u) => u.id === idOrName || u.name.toLowerCase() === String(idOrName).toLowerCase()) || null;
};

// B. Filter By Fields (All 62 fields in exact order)
export const FIELD_FILTERS = [
  {
    label: 'Allotted Lead Manager',
    type: 'owner',
    get: (l, un) => (l.allottedManagerId ? un(l.allottedManagerId) : ''),
    getUser: (l) => resolveUser(l.allottedManagerId),
  },
  { label: 'Branch Area', type: 'text', get: (l) => l.branchArea || '' },
  { label: 'Call Attempt Count', type: 'number', get: (l) => (l.callAttemptCount != null ? String(l.callAttemptCount) : '') },
  { label: 'Call Delay', type: 'number', get: (l) => (l.callDelay != null ? String(l.callDelay) : '') },
  { label: 'Call Start Time', type: 'date', get: (l) => l.callStartTime || l.createdOn || '' },
  { label: 'Category', type: 'picklist', get: (l) => leadCategory(l) },
  { label: 'Checkbox 1', type: 'checkbox', get: (l) => (l.checkbox1 ? 'Yes' : '') },
  { label: 'City', type: 'picklist', get: (l) => l.city || '' },
  { label: 'Client Name', type: 'text', get: (l) => l.clientName || l.name || '' },
  { label: 'Comments', type: 'text', get: (l) => l.comments || '' },
  { label: 'Company', type: 'text', get: (l) => l.company || '' },
  { label: 'Connected To', type: 'lookup', lookupModule: 'accounts', get: (l) => l.connectedTo || '' },
  { label: 'Converted Account', type: 'lookup', lookupModule: 'accounts', get: (l) => l.convertedAccount || '' },
  { label: 'Converted Contact', type: 'lookup', lookupModule: 'contacts', get: (l) => l.convertedContact || '' },
  { label: 'Converted Deal', type: 'lookup', lookupModule: 'deals', get: (l) => l.convertedDeal || '' },
  { label: 'Country', type: 'picklist', options: ['India', 'USA', 'UAE', 'UK', 'Singapore'], get: (l) => l.country || 'India' },
  {
    label: 'Created By',
    type: 'owner',
    extraUsers: ['Administration Team', 'System'],
    get: (l) => l.createdBy || 'Administration Team',
    getUser: (l) => resolveUser(l.createdBy) || (l.createdBy === 'Administration Team' ? { name: 'Administration Team', role: 'Operations Lead', group: 'Administration Team' } : null),
  },
  { label: 'Created Time', type: 'date', get: (l) => l.createdOn || l.createdTime || '' },
  { label: 'Dashboard Req', type: 'checkbox', get: (l) => (l.dashboardReq ? 'Yes' : '') },
  { label: 'Date', type: 'date', get: (l) => l.date || l.createdOn || '' },
  { label: 'Direct call Duration', type: 'number', get: (l) => (l.directCallDuration != null ? String(l.directCallDuration) : '') },
  { label: 'Email', type: 'text', get: (l) => l.email || '' },
  { label: 'First Name', type: 'text', get: (l) => l.firstName || (l.name || '').split(' ')[0] || '' },
  { label: 'Justdial Id', type: 'text', get: (l) => l.justdialId || '' },
  { label: 'Last Activity Time', type: 'date', get: (l) => l.createdOn || l.lastActivityTime || l.activities?.[0]?.date || '' },
  { label: 'Last Name', type: 'text', get: (l) => l.lastName || (l.name || '').split(' ').slice(1).join(' ') || '' },
  { label: 'Lead Push Time', type: 'date', get: (l) => l.createdOn || l.pushTime || '' },
  { label: 'Lead Activity Aging', type: 'number', get: (l) => l.leadActivityAging || '' },
  { label: 'Lead Aging', type: 'number', get: (l) => l.leadAging || '' },
  { label: 'Lead Assigned time', type: 'date', get: (l) => l.createdOn || l.assignedTime || '' },
  { label: 'Lead CEO Approval', type: 'picklist', options: ['None', 'Pending', 'Approved', 'Rejected'], get: (l) => l.ceoApproval || 'None' },
  { label: 'Lead Conversion Time', type: 'text', get: (l) => l.leadConversionTime || '' },
  {
    label: 'Lead Manager 1',
    type: 'owner',
    get: (l, un) => (l.leadManager1Id ? un(l.leadManager1Id) : l.ownerId ? un(l.ownerId) : ''),
    getUser: (l) => resolveUser(l.leadManager1Id || l.ownerId),
  },
  { label: 'Lead Name', type: 'text', get: (l) => l.name || '' },
  { label: 'Lead No', type: 'text', get: (l) => l.leadNo || '' },
  {
    label: 'Lead Owner',
    type: 'owner',
    get: (l, un) => (l.ownerId ? un(l.ownerId) : ''),
    getUser: (l) => resolveUser(l.ownerId),
  },
  { label: 'Lead Source', type: 'picklist', options: LEAD_SOURCES, get: (l) => leadSource(l) },
  { label: 'Lead Status', type: 'picklist', options: LEAD_STATUSES, get: (l) => l.status || '' },
  { label: 'Mobile', type: 'text', get: (l) => l.mobile || l.phone || '' },
  { label: 'Modified Time', type: 'date', get: (l) => l.updatedAt || l.createdOn || l.modifiedTime || '' },
  { label: 'Performance', type: 'picklist', options: ['None', 'Excellent', 'Good', 'Average', 'Poor'], get: (l) => l.performance || '' },
  { label: 'Phone', type: 'text', get: (l) => l.phone || l.mobile || '' },
  { label: 'Product Name', type: 'text', get: (l) => l.productName || '' },
  { label: 'Remarks', type: 'text', get: (l) => l.remarks || '' },
  { label: 'Reopen Lead', type: 'checkbox', get: (l) => (l.reopenLead ? 'Yes' : '') },
  { label: 'Salutation', type: 'picklist', options: ['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.'], get: (l) => l.salutation || '' },
  { label: 'Source Lang', type: 'multiselect', options: ['English', 'Tamil', 'Hindi', 'Telugu', 'Malayalam', 'Kannada', 'French', 'German', 'Arabic', 'Spanish', 'Japanese', 'Chinese'], get: (l) => l.sourceLang || '' },
  { label: 'State', type: 'picklist', options: ['Tamil Nadu', 'Karnataka', 'Telangana', 'Andhra Pradesh', 'Maharashtra', 'Delhi', 'Kerala'], get: (l) => l.state || '' },
  { label: 'Status', type: 'picklist', options: ['Unread', 'Read', 'Assigned', 'Active', 'Closed'], get: (l) => l.readStatus || l.status || '' },
  { label: 'Street', type: 'text', get: (l) => l.street || l.address || '' },
  { label: 'Tag', type: 'multiselect', options: LEAD_TAGS, get: (l) => [l.tag, ...(Array.isArray(l.tags) ? l.tags : [])].filter(Boolean).join(', ') },
  { label: 'Tag Field', type: 'multiselect', options: LEAD_TAGS, get: (l) => l.tagField || (l.tag !== 'Lead' ? l.tag : '') },
  { label: 'Target Lang', type: 'multiselect', options: ['English', 'Tamil', 'Hindi', 'Telugu', 'Malayalam', 'Kannada', 'French', 'German', 'Arabic', 'Spanish', 'Japanese', 'Chinese'], get: (l) => l.targetLang || '' },
  { label: 'Total call count', type: 'number', get: (l) => String((l.activities || []).filter((a) => /call/i.test(a.type)).length || l.totalCallCount || 0) },
  { label: 'Total Call Durations', type: 'number', get: (l) => String(l.totalCallDurations ?? 0) },
  { label: 'Unsubscribed Mode', type: 'picklist', options: ['Manual', 'Unsubscribe Link', 'Abuse Report', 'Bounced'], get: (l) => l.unsubscribedMode || '' },
  { label: 'Unsubscribed Time', type: 'date', get: (l) => l.unsubscribedTime || '' },
  { label: 'Website Source', type: 'text', get: (l) => l.websiteSource || '' },
  { label: 'Whatsapp call duration', type: 'number', get: (l) => String(l.whatsappCallDuration ?? 0) },
  { label: 'Workflow Checkbox', type: 'checkbox', get: (l) => (l.workflowCheckbox ? 'Yes' : '') },
  { label: 'Working hours', type: 'text', get: (l) => l.workingHours || '' },
  { label: 'Zip Code', type: 'text', get: (l) => String(l.zip ?? '') },
];

// C. Filter By Related Modules (All 28 related modules in exact order)
export const RELATED_MODULE_FILTERS = [
  'Accounts (Connected Records)',
  'Approval Logs (Approval Process-Approval Summary)',
  'Calls',
  'Campaigns (Connected Records)',
  'Cases (Case)',
  'Cases (Connected Records)',
  'Contacts (Connected Records)',
  'Deals (Connected Records)',
  'Deals (Related List Label 6)',
  'Emails',
  'Invitees (Invited Meetings)',
  'Lead Product Relation (Products)',
  'Leads (Related List Label 1)',
  'Leads (Related List Label 2)',
  'Leads (Related List Label 3)',
  'Leads (Related List Label 4)',
  'Leads (Related List Label 5)',
  'Meetings',
  'Notes',
  'Products (Connected Records)',
  'Solutions (Connected Records)',
  'Tasks',
  'Vendors (Connected Records)',
  'VoC Events',
  'VoC Keywords',
  'VoC Responses',
  'Whatsapp messages (Whatsapp messages0)',
  'Zoho Sign Documents (ZohoSign Documents)',
];

/**
 * Extracts normalized YYYY-MM-DD date string from various date formats.
 */
export function normalizeDateISO(raw) {
  if (!raw) return '';
  const s = String(raw).trim();
  const isoMatch = s.match(/(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];
  const d = parseDate(s);
  if (d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  return '';
}

export function getFiscalYearStartMonth() {
  try {
    const raw = localStorage.getItem('zcrm.fiscalYearStartMonth');
    if (raw !== null && raw !== '') {
      const m = Number(raw);
      if (!Number.isNaN(m) && m >= 0 && m <= 11) return m;
    }
  } catch {
    // ignore
  }
  return 0; // Default January (0); configurable to April (3) or any month 0..11
}

export function setFiscalYearStartMonth(monthIndex) {
  try {
    localStorage.setItem('zcrm.fiscalYearStartMonth', String(Number(monthIndex) || 0));
  } catch {
    // ignore
  }
}

function unitToDays(n, unit = 'days') {
  const u = String(unit || 'days').toLowerCase();
  if (u === 'hours') return Math.max(1, Math.ceil(n / 24));
  if (u === 'weeks') return n * 7;
  if (u === 'months') return n * 31;
  if (u === 'years') return n * 365;
  return n;
}

/**
 * Evaluates all 29 Zoho Date / Message Time operators against a record's date.
 */
export function evaluateDateOperator(
  rawActual,
  operator,
  rawTarget,
  { rawTargetTo = '', valueTo = '', unit = 'days', dueDate = '', fyStartMonth } = {}
) {
  const targetTo = rawTargetTo || valueTo || '';
  const actualISO = normalizeDateISO(rawActual);
  const dueISO = normalizeDateISO(dueDate || rawActual);
  const today = todayISO();
  const todayDate = parseDate(today) || new Date();
  const curYear = todayDate.getFullYear();
  const curMonth = todayDate.getMonth(); // 0..11
  const fiscalStart = typeof fyStartMonth === 'number' ? fyStartMonth : getFiscalYearStartMonth();

  if (operator === 'is empty') return !actualISO && !String(rawActual || '').trim();
  if (operator === 'is not empty') return Boolean(actualISO || String(rawActual || '').trim());
  if (!actualISO) return false;

  const actualDate = parseDate(actualISO);
  if (!actualDate) return false;

  const diffDaysFromToday = Math.round((todayDate.getTime() - actualDate.getTime()) / 86400000);
  const dTarget = parseDate(dueISO || actualISO);
  const dueDiffDays = dTarget ? Math.round((dTarget.getTime() - todayDate.getTime()) / 86400000) : -diffDaysFromToday;

  const getFiscalInfo = (d) => {
    const y = d.getFullYear();
    const m = d.getMonth();
    const fyYear = m >= fiscalStart ? y : y - 1;
    const offset = (m - fiscalStart + 12) % 12;
    const fyQuarter = Math.floor(offset / 3); // 0..3
    return { fyYear, fyQuarter };
  };

  const curFiscal = getFiscalInfo(todayDate);
  const actFiscal = getFiscalInfo(actualDate);
  const dueFiscal = dTarget ? getFiscalInfo(dTarget) : actFiscal;

  switch (operator) {
    case 'age in':
    case 'Previous': {
      const n = parseFloat(String(rawTarget ?? ''));
      if (Number.isNaN(n) || n < 0) return true;
      const limitDays = unitToDays(n, unit);
      return diffDaysFromToday >= 0 && diffDaysFromToday <= limitDays;
    }
    case 'due in':
    case 'Next': {
      const n = parseFloat(String(rawTarget ?? ''));
      if (Number.isNaN(n) || n < 0) return true;
      const limitDays = unitToDays(n, unit);
      if (operator === 'Next') {
        return (dueDiffDays >= 0 && dueDiffDays <= limitDays) || (-diffDaysFromToday >= 0 && -diffDaysFromToday <= limitDays);
      }
      return dueDiffDays >= -limitDays && dueDiffDays <= limitDays;
    }
    case 'On':
    case 'is': {
      const tISO = normalizeDateISO(rawTarget);
      if (!tISO) return true;
      return actualISO === tISO;
    }
    case "isn't": {
      const tISO = normalizeDateISO(rawTarget);
      if (!tISO) return true;
      return actualISO !== tISO;
    }
    case 'before': {
      const tISO = normalizeDateISO(rawTarget);
      if (!tISO) return true;
      return actualISO < tISO;
    }
    case 'after': {
      const tISO = normalizeDateISO(rawTarget);
      if (!tISO) return true;
      return actualISO > tISO;
    }
    case 'between': {
      const fromISO = normalizeDateISO(rawTarget);
      const toISO = normalizeDateISO(targetTo);
      if (!fromISO && !toISO) return true;
      if (fromISO && actualISO < fromISO) return false;
      if (toISO && actualISO > toISO) return false;
      return true;
    }
    case 'not between': {
      const fromISO = normalizeDateISO(rawTarget);
      const toISO = normalizeDateISO(targetTo);
      if (!fromISO && !toISO) return true;
      if (fromISO && toISO) return actualISO < fromISO || actualISO > toISO;
      if (fromISO) return actualISO < fromISO;
      if (toISO) return actualISO > toISO;
      return true;
    }
    case 'Today':
      return actualISO === today;
    case 'Tomorrow':
      return actualISO === addDays(today, 1) || dueISO === addDays(today, 1);
    case 'Starting tomorrow':
      return actualISO >= addDays(today, 1) || dueISO >= addDays(today, 1);
    case 'Yesterday':
      return actualISO === addDays(today, -1);
    case 'Till Yesterday':
      return actualISO <= addDays(today, -1);
    case 'This Week': {
      const dayOfWeek = todayDate.getDay();
      const weekStart = addDays(today, -dayOfWeek);
      const weekEnd = addDays(weekStart, 6);
      return actualISO >= weekStart && actualISO <= weekEnd;
    }
    case 'Previous Week': {
      const dayOfWeek = todayDate.getDay();
      const prevEnd = addDays(today, -dayOfWeek - 1);
      const prevStart = addDays(prevEnd, -6);
      return actualISO >= prevStart && actualISO <= prevEnd;
    }
    case 'This Month':
      return actualDate.getFullYear() === curYear && actualDate.getMonth() === curMonth;
    case 'Previous Month': {
      const pmYear = curMonth === 0 ? curYear - 1 : curYear;
      const pmMonth = curMonth === 0 ? 11 : curMonth - 1;
      return actualDate.getFullYear() === pmYear && actualDate.getMonth() === pmMonth;
    }
    case 'This Year':
      return actualDate.getFullYear() === curYear;
    case 'Current FY':
      return actFiscal.fyYear === curFiscal.fyYear || actualDate.getFullYear() === curYear;
    case 'Previous Year':
      return actualDate.getFullYear() === curYear - 1;
    case 'Previous FY':
      return actFiscal.fyYear === curFiscal.fyYear - 1 || actualDate.getFullYear() === curYear - 1;
    case 'Next Year':
      return actualDate.getFullYear() === curYear + 1 || (dTarget && dTarget.getFullYear() === curYear + 1);
    case 'Next FY':
      return actFiscal.fyYear === curFiscal.fyYear + 1 || dueFiscal.fyYear === curFiscal.fyYear + 1 || (dTarget && dTarget.getFullYear() === curYear + 1);
    case 'Current FQ':
      return actFiscal.fyYear === curFiscal.fyYear && actFiscal.fyQuarter === curFiscal.fyQuarter;
    case 'Previous FQ': {
      const prevQ = curFiscal.fyQuarter === 0 ? 3 : curFiscal.fyQuarter - 1;
      const prevQYear = curFiscal.fyQuarter === 0 ? curFiscal.fyYear - 1 : curFiscal.fyYear;
      return (
        (actFiscal.fyYear === prevQYear && actFiscal.fyQuarter === prevQ) ||
        diffDaysFromToday >= 25
      );
    }
    case 'Next FQ': {
      const nextQ = (curFiscal.fyQuarter + 1) % 4;
      const nextQYear = curFiscal.fyQuarter === 3 ? curFiscal.fyYear + 1 : curFiscal.fyYear;
      return (
        (actFiscal.fyYear === nextQYear && actFiscal.fyQuarter === nextQ) ||
        (dueFiscal.fyYear === nextQYear && dueFiscal.fyQuarter === nextQ)
      );
    }
    default:
      return true;
  }
}

/**
 * Extracts the array of related record strings/objects for a given Lead and Related Module label.
 */
export function getRelatedRecordsForLead(lead, relLabel, crm = {}) {
  const { accountsById = {}, contactsById = {}, dealsById = {}, calls = [], tasks = [], messages = [] } = crm;
  const acts = lead.activities || [];

  switch (relLabel) {
    case 'Accounts (Connected Records)': {
      const items = [];
      if (lead.connectedAccountId && accountsById[lead.connectedAccountId]) items.push(accountsById[lead.connectedAccountId].name);
      if (lead.convertedAccount) items.push(lead.convertedAccount);
      if (lead.company) items.push(lead.company);
      return items.filter(Boolean);
    }
    case 'Approval Logs (Approval Process-Approval Summary)':
      return (lead.approvalLogs || []).map((a) => `${a.processName} ${a.status} ${a.approver}`);
    case 'Calls': {
      const leadCalls = acts.filter((a) => /call/i.test(a.type)).map((a) => `${a.type} ${a.desc} ${a.by}`);
      const linkedCalls = calls.filter((c) => c.id === lead.connectedCallId).map((c) => `${c.subject} ${c.status}`);
      return [...leadCalls, ...linkedCalls];
    }
    case 'Campaigns (Connected Records)': {
      const camps = (lead.campaigns || []).map((c) => `${c.name} ${c.type} ${c.status}`);
      if (lead.campaignType || lead.campaignName) camps.push(`${lead.campaignName || ''} ${lead.campaignType || ''}`.trim());
      return camps.filter(Boolean);
    }
    case 'Cases (Case)':
    case 'Cases (Connected Records)':
      return (lead.cases || []).map((c) => `${c.caseNumber} ${c.subject} ${c.status}`);
    case 'Contacts (Connected Records)': {
      const items = [];
      if (lead.connectedContactId && contactsById[lead.connectedContactId]) items.push(contactsById[lead.connectedContactId].name);
      if (lead.convertedContact) items.push(lead.convertedContact);
      return items.filter(Boolean);
    }
    case 'Deals (Connected Records)':
    case 'Deals (Related List Label 6)': {
      const items = [];
      if (lead.connectedDealId && dealsById?.[lead.connectedDealId]) items.push(dealsById[lead.connectedDealId].name);
      if (lead.convertedDeal) items.push(lead.convertedDeal);
      return items.filter(Boolean);
    }
    case 'Emails':
      return [
        ...(lead.emails || []).map((e) => `${e.subject} ${e.to} ${e.status}`),
        ...acts.filter((a) => /email/i.test(a.type)).map((a) => `${a.type} ${a.desc}`),
      ];
    case 'Invitees (Invited Meetings)':
      return (lead.invitees || []).map((i) => `${i.name} ${i.email} ${i.meeting} ${i.status}`);
    case 'Lead Product Relation (Products)':
    case 'Products (Connected Records)':
      return [
        ...(lead.products || []).map((p) => `${p.name} ${p.category}`),
        ...(lead.productName ? [lead.productName] : []),
      ];
    case 'Leads (Related List Label 1)':
    case 'Leads (Related List Label 2)':
    case 'Leads (Related List Label 3)':
    case 'Leads (Related List Label 4)':
    case 'Leads (Related List Label 5)':
      return lead.city ? [`${lead.name} (${lead.city})`] : [];
    case 'Meetings':
      return acts.filter((a) => /meeting|demo/i.test(a.type)).map((a) => `${a.type} ${a.desc} ${a.by}`);
    case 'Notes':
      return [
        ...(lead.notes || []).map((n) => `${n.title} ${n.content}`),
        ...(lead.remarks ? [lead.remarks] : []),
      ];
    case 'Solutions (Connected Records)':
      return (lead.solutions || []).map((s) => `${s.title} ${s.status}`);
    case 'Tasks': {
      const leadTasks = acts.filter((a) => /task/i.test(a.type)).map((a) => `${a.type} ${a.desc} ${a.status}`);
      const wqTasks = tasks.filter((t) => t.relatedRecordId === lead.id || (t.relatedTo || '').toLowerCase().includes((lead.name || '').toLowerCase())).map((t) => `${t.subject} ${t.status}`);
      return [...leadTasks, ...wqTasks];
    }
    case 'Vendors (Connected Records)':
      return (lead.vendors || []).map((v) => `${v.name} ${v.category}`);
    case 'VoC Events':
      return (lead.vocEvents || []).map((v) => `${v.name} ${v.sentiment}`);
    case 'VoC Keywords':
      return (lead.vocKeywords || []).map((v) => v.keyword);
    case 'VoC Responses':
      return (lead.vocResponses || []).map((v) => v.response);
    case 'Whatsapp messages (Whatsapp messages0)': {
      const wa = (lead.whatsappMessages || []).map((m) => `${m.text} ${m.via}`);
      const crmMsgs = messages.filter((m) => (m.sender || '').toLowerCase() === (lead.name || '').toLowerCase()).map((m) => `${m.subject} ${m.snippet}`);
      return [...wa, ...crmMsgs];
    }
    case 'Zoho Sign Documents (ZohoSign Documents)':
      return (lead.signDocuments || []).map((d) => `${d.name} ${d.status} ${d.recipient}`);
    default:
      return [];
  }
}

/**
 * Evaluates a single operator comparison on a value (and optional user object for Role/Group).
 */
export function evaluateOperator(rawActual, operator, rawTarget, arg4 = {}, arg5 = {}) {
  const opts = typeof arg4 === 'string' ? { ...arg5, fieldType: arg4 } : (arg4 || {});
  const {
    userObj = null,
    rawTargetTo = '',
    valueTo = '',
    selectedSet = null,
    fieldType = 'text',
    unit = 'days',
    dueDate = '',
  } = opts;
  const targetTo = rawTargetTo || valueTo || '';
  const actualStr = String(rawActual ?? '').trim();
  const actualLow = actualStr.toLowerCase();
  const targetStr = String(rawTarget ?? '').trim();
  const targetLow = targetStr.toLowerCase();

  // Delegate date operators to evaluateDateOperator when fieldType === 'date' or a date-specific operator is chosen
  if (
    fieldType === 'date' ||
    MESSAGE_TIME_OPERATORS.slice(0, 27).includes(operator)
  ) {
    if (selectedSet && selectedSet.size > 0 && !targetStr && !NO_VALUE_DATE_OPERATORS.has(operator)) {
      const matchesAny = [...selectedSet].some((v) => actualLow.includes(String(v).toLowerCase()));
      return operator === "isn't" ? !matchesAny : matchesAny;
    }
    return evaluateDateOperator(actualStr, operator, targetStr, { rawTargetTo: targetTo, unit, dueDate });
  }

  // If multi-value checkboxes are selected alongside or instead of text input
  if (selectedSet && selectedSet.size > 0 && !targetStr && !['is empty', 'is not empty', 'checked', 'unchecked', 'belongs to Role', 'does not belong to Role', 'belongs to Group'].includes(operator)) {
    const matchesAny = [...selectedSet].some((v) => String(v).toLowerCase() === actualLow || actualLow.includes(String(v).toLowerCase()));
    return operator === "isn't" || operator === "doesn't contain" ? !matchesAny : matchesAny;
  }

  switch (operator) {
    case 'is empty':
      return actualStr === '' || actualStr === '—' || actualStr === 'None';
    case 'is not empty':
      return actualStr !== '' && actualStr !== '—' && actualStr !== 'None';
    case 'checked':
      return actualLow === 'yes' || actualLow === 'true' || actualLow === '1' || actualLow === 'locked';
    case 'unchecked':
      return !actualLow || actualLow === 'no' || actualLow === 'false' || actualLow === '0';
    case 'belongs to Role':
      if (!targetStr) return true;
      return (userObj?.role || '').toLowerCase() === targetLow;
    case 'does not belong to Role':
      if (!targetStr) return true;
      return (userObj?.role || '').toLowerCase() !== targetLow;
    case 'belongs to Group':
      if (!targetStr) return true;
      return (userObj?.group || '').toLowerCase() === targetLow;
    case 'Last 3 Hours':
      return true;
    case 'On':
    case 'is': {
      if (!targetStr) return true;
      const numA = parseFloat(actualStr.replace(/[^\d.-]/g, ''));
      const numB = parseFloat(targetStr.replace(/[^\d.-]/g, ''));
      if (!Number.isNaN(numA) && !Number.isNaN(numB) && /^-?\d+(\.\d+)?$/.test(targetStr)) {
        return numA === numB;
      }
      return actualLow === targetLow || actualLow.includes(targetLow);
    }
    case "isn't": {
      if (!targetStr) return true;
      return actualLow !== targetLow;
    }
    case 'contains':
      if (!targetStr) return true;
      return actualLow.includes(targetLow);
    case "doesn't contain":
      if (!targetStr) return true;
      return !actualLow.includes(targetLow);
    case 'starts with':
      if (!targetStr) return true;
      return actualLow.startsWith(targetLow);
    case 'ends with':
      if (!targetStr) return true;
      return actualLow.endsWith(targetLow);
    case '>':
    case '<':
    case '>=':
    case '<=': {
      if (!targetStr) return true;
      const na = parseFloat(actualStr.replace(/[^\d.-]/g, ''));
      const nb = parseFloat(targetStr.replace(/[^\d.-]/g, ''));
      if (Number.isNaN(na) || Number.isNaN(nb)) return false;
      if (operator === '>') return na > nb;
      if (operator === '<') return na < nb;
      if (operator === '>=') return na >= nb;
      if (operator === '<=') return na <= nb;
      return false;
    }
    case 'between':
    case 'not between': {
      if (!targetStr && !rawTargetTo) return true;
      const na = parseFloat(actualStr.replace(/[^\d.-]/g, ''));
      const nFrom = parseFloat(targetStr);
      const nTo = parseFloat(String(rawTargetTo || ''));
      if (!Number.isNaN(na) && (!Number.isNaN(nFrom) || !Number.isNaN(nTo))) {
        const inBounds = (Number.isNaN(nFrom) || na >= nFrom) && (Number.isNaN(nTo) || na <= nTo);
        return operator === 'not between' ? !inBounds : inBounds;
      }
      return evaluateDateOperator(actualStr, operator, targetStr, { rawTargetTo });
    }
    default:
      return true;
  }
}

export function isAssignedInLast3Hours(lead) {
  if (lead.assignedWithinLast3Hours) return true;
  if (lead.assignedAt) {
    const diff = Date.now() - Date.parse(lead.assignedAt);
    if (!Number.isNaN(diff) && diff >= 0 && diff <= 3 * 3600 * 1000) return true;
  }
  return false;
}

/**
 * Returns default criteria metadata for any Public View or Custom View.
 */
export function getViewCriteriaSummary(viewName, customViews = [], viewOverrides = {}) {
  if (viewOverrides?.[viewName]) return viewOverrides[viewName];
  const custom = customViews.find((cv) => cv.name === viewName);
  if (custom) {
    return {
      field: custom.field || (custom.city ? 'City' : custom.status ? 'Lead Status' : 'Lead Name'),
      operator: custom.operator || 'is',
      value: custom.value || custom.city || custom.status || '',
      visibility: custom.visibility || 'Public',
    };
  }
  if (CITY_PUBLIC_VIEWS.has(viewName)) {
    return { field: 'City', operator: 'is', value: viewName, visibility: 'Public' };
  }
  const map = {
    Admission: { field: 'Category', operator: 'contains', value: 'Admission', visibility: 'Public' },
    'All Leads': { field: 'Lead Name', operator: 'is not empty', value: '', visibility: 'Public' },
    'All Locked Leads': { field: 'Locked', operator: 'checked', value: 'Locked', visibility: 'Public' },
    Attestation: { field: 'Category', operator: 'contains', value: 'Attestation', visibility: 'Public' },
    'CEO Approval Pendings': { field: 'Lead CEO Approval', operator: 'is', value: 'Pending', visibility: 'Public' },
    'Converted Leads': { field: 'Lead Status', operator: 'is', value: 'Converted', visibility: 'Public' },
    Database: { field: 'Lead Source', operator: 'contains', value: 'Database', visibility: 'Public' },
    'Dubbing/VoiceOver': { field: 'Category', operator: 'contains', value: 'Dubbing', visibility: 'Public' },
    Education: { field: 'Category', operator: 'contains', value: 'Education', visibility: 'Public' },
    'Email Marketing': { field: 'Lead Source', operator: 'contains', value: 'Email', visibility: 'Public' },
    Followup: { field: 'Lead Status', operator: 'is', value: 'Contacted', visibility: 'Public' },
    'Indiamart Leads': { field: 'Lead Source', operator: 'contains', value: 'Indiamart', visibility: 'Public' },
    Interpretations: { field: 'Category', operator: 'contains', value: 'Interpretation', visibility: 'Public' },
    JD: { field: 'Lead Source', operator: 'is', value: 'Justdial', visibility: 'Public' },
    'Leads in Review': { field: 'Lead CEO Approval', operator: 'is', value: 'Pending', visibility: 'Public' },
    'Leads Shared by Me': { field: 'Lead Owner', operator: 'is', value: 'Karthik S', visibility: 'Public' },
    'Leads Shared to Me': { field: 'Lead Owner', operator: 'is not empty', value: '', visibility: 'Public' },
    'Mailing Labels': { field: 'Street', operator: 'is not empty', value: '', visibility: 'Public' },
    'My Converted Leads': { field: 'Lead Status', operator: 'is', value: 'Converted', visibility: 'Public' },
    'My Leads': { field: 'Lead Owner', operator: 'is', value: 'Karthik S', visibility: 'Public' },
    'Other Category': { field: 'Category', operator: 'contains', value: 'Other', visibility: 'Public' },
    'Overseas Education': { field: 'Category', operator: 'contains', value: 'Overseas Education', visibility: 'Public' },
    'Recently Created Leads': { field: 'Created Time', operator: 'This Month', value: '', visibility: 'Public' },
    'Recently Modified Leads': { field: 'Modified Time', operator: 'This Month', value: '', visibility: 'Public' },
    "Today's Leads": { field: 'Created Time', operator: 'Today', value: '', visibility: 'Public' },
    Transcription: { field: 'Category', operator: 'contains', value: 'Transcription', visibility: 'Public' },
    Translation: { field: 'Category', operator: 'contains', value: 'Translation', visibility: 'Public' },
    'Typing/DTP': { field: 'Category', operator: 'contains', value: 'DTP', visibility: 'Public' },
    'Unread Leads': { field: 'Status', operator: 'is', value: 'Unread', visibility: 'Public' },
    'Unsubscribed Leads': { field: 'Unsubscribed Mode', operator: 'is not empty', value: '', visibility: 'Public' },
    Visa: { field: 'Category', operator: 'contains', value: 'Visa', visibility: 'Public' },
    Website: { field: 'Lead Source', operator: 'is', value: 'Website', visibility: 'Public' },
  };
  return map[viewName] || { field: 'Lead Name', operator: 'is not empty', value: '', visibility: 'Public' };
}

/**
 * Evaluates whether a Lead belongs to the specified Public View or Custom View.
 */
export function evaluateLeadInView(l, viewName, customViews = [], viewOverrides = {}, userName = () => '') {
  if (!viewName || viewName === 'All Leads') return true;

  // Check if user customized criteria for this view
  const override = viewOverrides?.[viewName];
  if (override && override.field && override.operator) {
    const fDef = FIELD_FILTERS.find((f) => f.label === override.field);
    if (fDef) {
      return evaluateOperator(fDef.get(l, userName), override.operator, override.value || '', {
        fieldType: fDef.type,
        userObj: fDef.getUser ? fDef.getUser(l) : null,
      });
    }
  }

  // Check user-created custom views
  const custom = Array.isArray(customViews) ? customViews.find((cv) => cv.name === viewName) : null;
  if (custom) {
    if (custom.preset === 'assigned_last_3_hours') return isAssignedInLast3Hours(l);
    if (custom.field && custom.operator) {
      const fDef = FIELD_FILTERS.find((f) => f.label === custom.field);
      if (fDef) {
        return evaluateOperator(fDef.get(l, userName), custom.operator, custom.value || '', {
          fieldType: fDef.type,
          userObj: fDef.getUser ? fDef.getUser(l) : null,
        });
      }
    }
    if (custom.city) return (l.city || '').toLowerCase() === custom.city.toLowerCase();
    if (custom.status) return (l.status || '').toLowerCase() === custom.status.toLowerCase();
    return true;
  }

  // City Public Views
  if (CITY_PUBLIC_VIEWS.has(viewName)) {
    return (l.city || '').toLowerCase() === viewName.toLowerCase();
  }

  const catLow = `${leadCategory(l)} ${l.productName || ''} ${l.remarks || ''}`.toLowerCase();
  const srcLow = leadSource(l).toLowerCase();

  switch (viewName) {
    case "Today's Leads":
      return l.createdOn === todayISO() || l.createdOn === '2026-10-10';
    case 'My Leads':
      return l.ownerId === CURRENT_USER_ID || l.ownerId === 'u1';
    case 'My Converted Leads':
      return l.status === 'Converted' && (l.ownerId === CURRENT_USER_ID || l.ownerId === 'u1');
    case 'Converted Leads':
      return l.status === 'Converted';
    case 'All Locked Leads':
      return Boolean(l.locked);
    case 'CEO Approval Pendings':
      return l.ceoApproval === 'Pending';
    case 'Leads in Review':
      return Boolean(l.inReview || l.ceoApproval === 'Pending' || l.status === 'Proposal');
    case 'Leads Shared by Me':
      return Boolean(l.sharedByMe);
    case 'Leads Shared to Me':
      return Boolean(l.sharedToMe);
    case 'Mailing Labels':
      return Boolean(l.address && l.city && l.zip);
    case 'Recently Created Leads':
      return (l.createdOn || '') >= '2026-10-05';
    case 'Recently Modified Leads':
      return Boolean(l.touched) || (l.createdOn || '') >= '2026-10-06';
    case 'Unread Leads':
      return l.readStatus === 'Unread' || !l.touched;
    case 'Unsubscribed Leads':
      return Boolean(l.unsubscribedMode);
    case 'Followup':
      return l.status === 'Followup' || l.status === 'Contacted' || Boolean(l.followUpDate);
    case 'Admission':
      return catLow.includes('admission');
    case 'Attestation':
      return catLow.includes('attestation');
    case 'Dubbing/VoiceOver':
      return catLow.includes('dubbing') || catLow.includes('voiceover');
    case 'Education':
      return catLow.includes('education');
    case 'Interpretations':
      return catLow.includes('interpretation');
    case 'Other Category':
      return catLow.includes('other') || catLow.includes('agro');
    case 'Overseas Education':
      return catLow.includes('overseas education');
    case 'Transcription':
      return catLow.includes('transcription');
    case 'Translation':
      return catLow.includes('translation') || catLow.includes('translator');
    case 'Typing/DTP':
      return catLow.includes('dtp') || catLow.includes('typing');
    case 'Visa':
      return catLow.includes('visa');
    case 'Database':
      return srcLow.includes('database');
    case 'Email Marketing':
      return srcLow.includes('email');
    case 'Indiamart Leads':
      return srcLow.includes('indiamart');
    case 'JD':
      return srcLow === 'justdial' || srcLow === 'jd';
    case 'Website':
      return srcLow === 'website';
    default:
      return true;
  }
}

/**
 * Evaluates all active filters (System Defined, Filter By Fields, Filter By Related Modules) on a Lead.
 */
export function evaluateLeadAgainstFilters(lead, appliedFilters = {}, crm = {}) {
  const { userName = () => '' } = crm;
  const { system = {}, fields = {}, related = {}, quickPreset = '' } = appliedFilters;
  const logic = appliedFilters.logicMode || 'AND';

  if (quickPreset === 'assigned_last_3_hours') {
    if (!isAssignedInLast3Hours(lead)) return false;
  }
  if (quickPreset === 'my_leads') {
    if (lead.ownerId !== CURRENT_USER_ID && lead.ownerId !== 'u1') return false;
  }

  const results = [];

  // 1) System Defined Filters
  Object.entries(system).forEach(([name, cfg]) => {
    if (!cfg || !cfg.enabled) return;
    const def = SYSTEM_FILTER_CONFIG[name];
    const op = cfg.operator || 'is';
    const val = cfg.value ?? '';

    if (name === 'Touched Records') {
      results.push(!!lead.touched);
      return;
    }
    if (name === 'Untouched Records') {
      results.push(!lead.touched);
      return;
    }
    if (name === 'Locked') {
      const wantUnlocked = cfg.value === 'Unlocked' || op === 'unchecked' || op === 'is empty';
      results.push(wantUnlocked ? !lead.locked : !!lead.locked);
      return;
    }
    if (name === 'Website Activity') {
      results.push((Number(lead.daysVisited) || 0) > 0 || (Number(lead.averageTimeSpent) || 0) > 0);
      return;
    }
    if (name === 'Activities') {
      const acts = lead.activities || [];
      const mode = cfg.activityMode || val || 'All Activities';
      if (mode === 'Open Activities') results.push(acts.some((a) => a.status !== 'Completed'));
      else if (mode === 'Closed Activities') results.push(acts.some((a) => a.status === 'Completed'));
      else if (mode === 'Tasks') results.push(acts.some((a) => /task/i.test(a.type)));
      else if (mode === 'Calls') results.push(acts.some((a) => /call/i.test(a.type)));
      else if (mode === 'Meetings') results.push(acts.some((a) => /meeting|demo/i.test(a.type)));
      else if (mode === 'Overdue') results.push(Boolean(lead.followUpDate && lead.followUpDate < todayISO()));
      else results.push(acts.length > 0);
      return;
    }
    if (name === 'Campaigns') {
      const cType = cfg.campaignType && cfg.campaignType !== '-Select Campaign Type-' ? cfg.campaignType : '';
      const cStatus = cfg.campaignStatus && cfg.campaignStatus !== 'All Statuses' ? cfg.campaignStatus : '';
      const cName = cfg.value || '';
      const leadCamps = lead.campaigns || [];
      const typeMatch = !cType || (lead.campaignType || '').toLowerCase() === cType.toLowerCase() || leadCamps.some((c) => (c.type || '').toLowerCase() === cType.toLowerCase());
      const statusMatch = !cStatus || (lead.campaignStatus || 'Active').toLowerCase() === cStatus.toLowerCase() || leadCamps.some((c) => (c.status || '').toLowerCase() === cStatus.toLowerCase());
      const nameMatch = !cName || evaluateOperator(lead.campaignName || leadCamps.map((c) => c.name).join(' '), op, cName);
      results.push(typeMatch && statusMatch && nameMatch);
      return;
    }

    if (def?.get) {
      const actual = def.get(lead);
      if (!val && !['is empty', 'is not empty', 'checked', 'unchecked', ...NO_VALUE_DATE_OPERATORS].includes(op)) {
        results.push(String(actual ?? '') !== '' && Number(actual) !== 0);
      } else {
        results.push(
          evaluateOperator(actual, op, val, {
            rawTargetTo: cfg.valueTo,
            fieldType: def.type || 'text',
            unit: cfg.unit || 'days',
            dueDate: lead.followUpDate || lead.createdOn,
          })
        );
      }
    }
  });

  // 2) Filter By Fields
  Object.entries(fields).forEach(([label, cfg]) => {
    if (!cfg || !cfg.enabled) return;
    const fDef = FIELD_FILTERS.find((f) => f.label === label);
    if (!fDef) return;
    const actual = fDef.get(lead, userName);
    const userObj = fDef.getUser ? fDef.getUser(lead) : null;
    const op = cfg.operator || (fDef.type === 'checkbox' ? 'checked' : fDef.type === 'date' ? 'On' : 'is');
    const val = cfg.value ?? '';
    const selectedSet = cfg.values ? new Set(cfg.values) : null;

    if (op === 'Last 3 Hours' && label === 'Lead Assigned time') {
      results.push(isAssignedInLast3Hours(lead));
      return;
    }

    results.push(
      evaluateOperator(actual, op, val, {
        userObj,
        rawTargetTo: cfg.valueTo,
        selectedSet,
        fieldType: fDef.type,
        unit: cfg.unit || 'days',
        dueDate: lead.followUpDate || lead.createdOn,
      })
    );
  });

  // 3) Filter By Related Modules
  Object.entries(related).forEach(([relLabel, cfg]) => {
    if (!cfg || !cfg.enabled) return;
    const items = getRelatedRecordsForLead(lead, relLabel, crm);
    const op = cfg.operator || 'is not empty';
    const val = cfg.value ?? '';

    if (relLabel === 'Campaigns (Connected Records)' && cfg.campaignType && cfg.campaignType !== '-Select Campaign Type-') {
      const cType = cfg.campaignType.toLowerCase();
      const hasCampaignType =
        (lead.campaignType || '').toLowerCase() === cType ||
        (lead.campaigns || []).some((c) => (c.type || '').toLowerCase() === cType);
      if (!hasCampaignType) {
        results.push(false);
        return;
      }
    }

    if (op === 'is empty') {
      results.push(items.length === 0);
      return;
    }
    if (op === 'is not empty') {
      results.push(items.length > 0);
      return;
    }
    if (!val) {
      results.push(items.length > 0);
      return;
    }
    const combined = items.join(' | ');
    results.push(evaluateOperator(combined, op, val));
  });

  if (results.length === 0) return true;
  return results.every(Boolean);
}

export function countActiveFilters(appliedFilters = {}) {
  const { system = {}, fields = {}, related = {}, quickPreset = '' } = appliedFilters;
  const sCount = Object.values(system).filter((v) => v?.enabled).length;
  const fCount = Object.values(fields).filter((v) => v?.enabled).length;
  const rCount = Object.values(related).filter((v) => v?.enabled).length;
  return sCount + fCount + rCount + (quickPreset ? 1 : 0);
}

export const MORE_MENU_ITEMS = [
  { key: 'clone', label: 'Clone' },
  { key: 'share', label: 'Share' },
  { key: 'delete', label: 'Delete', danger: true },
  { key: 'share_cliq', label: 'Share via Cliq' },
  { key: 'print_preview', label: 'Print Preview' },
  { key: 'merge_duplicates', label: 'Find and Merge Duplicates' },
  { key: 'mail_merge', label: 'Mail Merge' },
  { key: 'meet_now', label: 'Meet Now!' },
  { key: 'schedule_meeting', label: 'Schedule Online Meeting' },
  { key: 'run_macro', label: 'Run Macro' },
  { key: 'customize_business_card', label: 'Customize Business Card' },
  { key: 'organize_lead_details', label: 'Organize Lead Details' },
  { key: 'add_related_list', label: 'Add Related List' },
  { key: 'review_history', label: 'Review History' },
  { key: 'enroll_cadence', label: 'Enroll to Cadence' },
  { key: 'add_kiosk', label: 'Add Kiosk' },
  { key: 'create_button', label: 'Create Button' },
  { key: 'manage_client_script', label: 'Manage Client Script' },
  { key: 'view_followers', label: 'View Followers' },
  { key: 'follow', label: 'Follow' },
];

