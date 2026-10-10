// Filter panel config for the Leads list (mirrors the Zoho CRM left panel)
export const CURRENT_USER_ID = 'u4'; // "My Leads" = leads owned by this user

export const VIEW_TABS = ["All Leads", "Today's Leads", 'My Leads', 'Chennai', 'Website', 'Delhi'];

// System Defined Filters. `fn` makes the filter real; the others are UI-only for now.
export const SYSTEM_FILTERS = [
  'Activities', 'Cadences', 'Campaigns', 'Email Sentiment', 'Latest Email Status', 'Locked',
  'Record Action', 'Related Records Action', 'Scoring Rules', 'Touched Records', 'Untouched Records',
];

export const WEBSITE_ACTIVITY = [
  'Average Time Spent (Minutes)', 'Days Visited', 'First Page Visited', 'First Visit',
  'Most Recent Visit', 'Number Of Chats', 'Referrer', 'Visitor Score',
];

// Filter By Fields: label -> function(lead, userName) giving the value used for the check-list
export const FIELD_FILTERS = [
  { label: 'Allotted Lead Manager', get: (l, un) => (l.allottedManagerId ? un(l.allottedManagerId) : '') },
  { label: 'Branch Area', get: (l) => l.branchArea || '' },
  { label: 'Call Attempt Count', get: (l) => (l.callAttemptCount != null ? String(l.callAttemptCount) : '') },
  { label: 'Call Delay', get: (l) => (l.callDelay != null ? String(l.callDelay) : '') },
  { label: 'Call Start Time', get: (l) => l.callStartTime || '' },
  { label: 'Category', get: (l) => l.category || l.industry || '' },
  { label: 'Checkbox 1', get: (l) => (l.checkbox1 ? 'Yes' : '') },
  { label: 'City', get: (l) => l.city || '' },
];

export const leadCategory = (l) => l.category || l.industry || '';
export const leadSource = (l) => l.source || l.leadSource || '';
