import { balanceOf, fmtDate, fmtINR } from './calculations';
import { exportCSV } from './exportCSV';

/**
 * Default Report Folders matching Zoho CRM Screenshot 1 + logical CRM categories.
 */
export const DEFAULT_REPORT_FOLDERS = [
  { id: 'fld-overall', name: 'Overall', description: 'General organization-wide CRM reports', system: true },
  { id: 'fld-deals', name: 'Deal Reports', description: 'Pipeline, stage conversion, and deal owner reports', system: true },
  { id: 'fld-estimation', name: 'Estimation team report', description: 'Deal estimation, translation, and invoice readiness reports', system: true },
  { id: 'fld-accounts-contacts', name: 'Account and Contact Reports', description: 'Customer accounts, key contacts, and territory reports', system: true },
  { id: 'fld-calls-activities', name: 'Call & Activity Reports', description: 'Call logs, follow-ups, tasks, and meeting activity reports', system: true },
  { id: 'fld-finance', name: 'Invoice & Finance Reports', description: 'Invoices, quotes, sales orders, and receivables reports', system: true },
];

/**
 * Available Primary Modules matching Screenshot 2 ("Create New Report -> Select Primary Module").
 */
export const REPORT_PRIMARY_MODULES = [
  {
    key: 'Leads',
    label: 'Leads',
    description: 'Prospective leads, lead sources, lifecycle stages, and conversion status',
    relatedModules: ['Accounts', 'Deals', 'Calls', 'Tasks', 'Meetings'],
  },
  {
    key: 'Accounts',
    label: 'Accounts',
    description: 'Customer & partner organizations, revenue, GST, and territory details',
    relatedModules: ['Contacts', 'Deals', 'Calls', 'Tasks', 'Invoices', 'Quotes', 'Sales Orders'],
  },
  {
    key: 'Contacts',
    label: 'Contacts',
    description: 'Individual contacts, decision makers, communication history, and lifecycle',
    relatedModules: ['Accounts', 'Deals', 'Calls', 'Tasks', 'Meetings', 'Invoices', 'Quotes'],
  },
  {
    key: 'Deals',
    label: 'Deals',
    description: 'Sales pipeline opportunities, stage probabilities, revenue, and closing dates',
    relatedModules: ['Accounts', 'Contacts', 'Calls', 'Tasks', 'Invoices', 'Quotes'],
  },
  {
    key: 'Tasks',
    label: 'Tasks',
    description: 'Open and completed follow-up tasks, priorities, due dates, and owners',
    relatedModules: ['Contacts', 'Accounts', 'Deals'],
  },
  {
    key: 'Meetings',
    label: 'Meetings',
    description: 'Scheduled and completed client meetings across contacts and accounts',
    relatedModules: ['Contacts', 'Accounts', 'Deals'],
  },
  {
    key: 'Calls',
    label: 'Calls',
    description: 'Inbound and outbound call logs, call durations, statuses, and outcomes',
    relatedModules: ['Contacts', 'Accounts', 'Deals'],
  },
  {
    key: 'Invoices',
    label: 'Invoices',
    description: 'Customer invoices, billed totals, paid amounts, balances, and due dates',
    relatedModules: ['Accounts', 'Contacts', 'Deals'],
  },
  {
    key: 'Quotes',
    label: 'Quotes',
    description: 'Price quotes and estimations shared with accounts and contacts',
    relatedModules: ['Accounts', 'Contacts', 'Deals'],
  },
  {
    key: 'Sales Orders',
    label: 'Sales Orders',
    description: 'Confirmed customer sales orders and fulfillment status',
    relatedModules: ['Accounts', 'Contacts', 'Deals'],
  },
  {
    key: 'Products',
    label: 'Products',
    description: 'Product catalog items linked to accounts, contacts, and deals',
    relatedModules: ['Accounts', 'Contacts', 'Deals'],
  },
];

/**
 * Field definitions for each Primary Module and Related Module augmentation.
 * type: 'text' | 'number' | 'currency' | 'date' | 'percent'
 */
export const MODULE_FIELDS = {
  Deals: [
    { key: 'name', label: 'Deal Name', type: 'text', module: 'Deals', defaultSelected: true },
    { key: 'accountName', label: 'Account Name', type: 'text', module: 'Accounts', defaultSelected: true },
    { key: 'contactName', label: 'Contact Name', type: 'text', module: 'Contacts', defaultSelected: true },
    { key: 'stage', label: 'Stage', type: 'text', module: 'Deals', defaultSelected: true },
    { key: 'amount', label: 'Amount', type: 'currency', module: 'Deals', defaultSelected: true, summarizable: true },
    { key: 'probability', label: 'Probability (%)', type: 'percent', module: 'Deals', defaultSelected: true, summarizable: true },
    { key: 'expectedRevenue', label: 'Expected Revenue', type: 'currency', module: 'Deals', defaultSelected: false, summarizable: true },
    { key: 'closingDate', label: 'Closing Date', type: 'date', module: 'Deals', defaultSelected: true },
    { key: 'ownerName', label: 'Deal Owner', type: 'text', module: 'Deals', defaultSelected: true },
    { key: 'source', label: 'Lead Source', type: 'text', module: 'Deals', defaultSelected: false },
    { key: 'department', label: 'Department', type: 'text', module: 'Deals', defaultSelected: false },
    { key: 'forecastCategory', label: 'Forecast Category', type: 'text', module: 'Deals', defaultSelected: false },
    { key: 'createdOn', label: 'Created Date', type: 'date', module: 'Deals', defaultSelected: false },
    { key: 'accountIndustry', label: 'Account Industry', type: 'text', module: 'Accounts', relatedOnly: true },
    { key: 'accountLocation', label: 'Account City', type: 'text', module: 'Accounts', relatedOnly: true },
    { key: 'accountAnnualRevenue', label: 'Account Annual Revenue', type: 'currency', module: 'Accounts', relatedOnly: true, summarizable: true },
    { key: 'contactEmail', label: 'Contact Email', type: 'text', module: 'Contacts', relatedOnly: true },
    { key: 'contactPhone', label: 'Contact Phone', type: 'text', module: 'Contacts', relatedOnly: true },
    { key: 'relatedCallsCount', label: 'Related Calls Count', type: 'number', module: 'Calls', relatedOnly: true, summarizable: true },
    { key: 'relatedTasksCount', label: 'Related Tasks Count', type: 'number', module: 'Tasks', relatedOnly: true, summarizable: true },
    { key: 'relatedInvoicesTotal', label: 'Related Invoices Amount', type: 'currency', module: 'Invoices', relatedOnly: true, summarizable: true },
    { key: 'relatedQuotesTotal', label: 'Related Quotes Amount', type: 'currency', module: 'Quotes', relatedOnly: true, summarizable: true },
  ],
  Contacts: [
    { key: 'name', label: 'Contact Name', type: 'text', module: 'Contacts', defaultSelected: true },
    { key: 'accountName', label: 'Account Name', type: 'text', module: 'Accounts', defaultSelected: true },
    { key: 'email', label: 'Email', type: 'text', module: 'Contacts', defaultSelected: true },
    { key: 'phone', label: 'Phone', type: 'text', module: 'Contacts', defaultSelected: true },
    { key: 'mobile', label: 'Mobile', type: 'text', module: 'Contacts', defaultSelected: false },
    { key: 'designation', label: 'Title / Designation', type: 'text', module: 'Contacts', defaultSelected: true },
    { key: 'department', label: 'Department', type: 'text', module: 'Contacts', defaultSelected: false },
    { key: 'lifecycle', label: 'Lifecycle Stage', type: 'text', module: 'Contacts', defaultSelected: true },
    { key: 'leadSource', label: 'Lead Source', type: 'text', module: 'Contacts', defaultSelected: true },
    { key: 'ownerName', label: 'Contact Owner', type: 'text', module: 'Contacts', defaultSelected: true },
    { key: 'mailingCity', label: 'City', type: 'text', module: 'Contacts', defaultSelected: false },
    { key: 'followUp', label: 'Follow-Up Date', type: 'date', module: 'Contacts', defaultSelected: false },
    { key: 'lastContacted', label: 'Last Contacted', type: 'date', module: 'Contacts', defaultSelected: false },
    { key: 'createdOn', label: 'Created Date', type: 'date', module: 'Contacts', defaultSelected: false },
    { key: 'accountIndustry', label: 'Account Industry', type: 'text', module: 'Accounts', relatedOnly: true },
    { key: 'relatedDealsCount', label: 'Deals Count', type: 'number', module: 'Deals', relatedOnly: true, summarizable: true },
    { key: 'relatedDealsAmount', label: 'Total Deal Value', type: 'currency', module: 'Deals', relatedOnly: true, summarizable: true },
    { key: 'relatedCallsCount', label: 'Calls Count', type: 'number', module: 'Calls', relatedOnly: true, summarizable: true },
    { key: 'relatedTasksCount', label: 'Open Tasks Count', type: 'number', module: 'Tasks', relatedOnly: true, summarizable: true },
    { key: 'relatedMeetingsCount', label: 'Meetings Count', type: 'number', module: 'Meetings', relatedOnly: true, summarizable: true },
    { key: 'relatedInvoicesTotal', label: 'Invoices Amount', type: 'currency', module: 'Invoices', relatedOnly: true, summarizable: true },
  ],
  Leads: [
    { key: 'name', label: 'Lead Name', type: 'text', module: 'Leads', defaultSelected: true },
    { key: 'accountName', label: 'Company / Account', type: 'text', module: 'Accounts', defaultSelected: true },
    { key: 'lifecycle', label: 'Lead Stage', type: 'text', module: 'Leads', defaultSelected: true },
    { key: 'leadSource', label: 'Lead Source', type: 'text', module: 'Leads', defaultSelected: true },
    { key: 'email', label: 'Email', type: 'text', module: 'Leads', defaultSelected: true },
    { key: 'phone', label: 'Phone / Mobile', type: 'text', module: 'Leads', defaultSelected: true },
    { key: 'ownerName', label: 'Lead Owner', type: 'text', module: 'Leads', defaultSelected: true },
    { key: 'mailingCity', label: 'City', type: 'text', module: 'Leads', defaultSelected: false },
    { key: 'followUp', label: 'Follow-Up Date', type: 'date', module: 'Leads', defaultSelected: true },
    { key: 'createdOn', label: 'Created Date', type: 'date', module: 'Leads', defaultSelected: false },
    { key: 'relatedCallsCount', label: 'Call Count', type: 'number', module: 'Calls', relatedOnly: true, summarizable: true },
    { key: 'relatedDealsCount', label: 'Converted Deals', type: 'number', module: 'Deals', relatedOnly: true, summarizable: true },
    { key: 'relatedDealsAmount', label: 'Deal Pipeline Value', type: 'currency', module: 'Deals', relatedOnly: true, summarizable: true },
    { key: 'relatedTasksCount', label: 'Follow-up Tasks', type: 'number', module: 'Tasks', relatedOnly: true, summarizable: true },
  ],
  Accounts: [
    { key: 'name', label: 'Account Name', type: 'text', module: 'Accounts', defaultSelected: true },
    { key: 'type', label: 'Account Type', type: 'text', module: 'Accounts', defaultSelected: true },
    { key: 'industry', label: 'Industry', type: 'text', module: 'Accounts', defaultSelected: true },
    { key: 'status', label: 'Status', type: 'text', module: 'Accounts', defaultSelected: true },
    { key: 'rating', label: 'Rating', type: 'text', module: 'Accounts', defaultSelected: false },
    { key: 'annualRevenue', label: 'Annual Revenue', type: 'currency', module: 'Accounts', defaultSelected: true, summarizable: true },
    { key: 'employees', label: 'Employees', type: 'number', module: 'Accounts', defaultSelected: false, summarizable: true },
    { key: 'location', label: 'Billing City', type: 'text', module: 'Accounts', defaultSelected: true },
    { key: 'phone', label: 'Phone / Mobile', type: 'text', module: 'Accounts', defaultSelected: true },
    { key: 'gstin', label: 'GSTIN', type: 'text', module: 'Accounts', defaultSelected: false },
    { key: 'ownerName', label: 'Account Owner', type: 'text', module: 'Accounts', defaultSelected: true },
    { key: 'createdOn', label: 'Created Date', type: 'date', module: 'Accounts', defaultSelected: false },
    { key: 'relatedContactsCount', label: 'Contacts Count', type: 'number', module: 'Contacts', relatedOnly: true, summarizable: true },
    { key: 'relatedDealsCount', label: 'Deals Count', type: 'number', module: 'Deals', relatedOnly: true, summarizable: true },
    { key: 'relatedDealsAmount', label: 'Total Deal Value', type: 'currency', module: 'Deals', relatedOnly: true, summarizable: true },
    { key: 'relatedCallsCount', label: 'Calls Count', type: 'number', module: 'Calls', relatedOnly: true, summarizable: true },
    { key: 'relatedInvoicesTotal', label: 'Total Invoiced', type: 'currency', module: 'Invoices', relatedOnly: true, summarizable: true },
  ],
  Calls: [
    { key: 'subject', label: 'Call Subject', type: 'text', module: 'Calls', defaultSelected: true },
    { key: 'contactName', label: 'Contact Name', type: 'text', module: 'Contacts', defaultSelected: true },
    { key: 'accountName', label: 'Account Name', type: 'text', module: 'Accounts', defaultSelected: true },
    { key: 'type', label: 'Direction (Inbound/Outbound)', type: 'text', module: 'Calls', defaultSelected: true },
    { key: 'status', label: 'Call Status', type: 'text', module: 'Calls', defaultSelected: true },
    { key: 'duration', label: 'Duration (sec)', type: 'number', module: 'Calls', defaultSelected: true, summarizable: true },
    { key: 'dateTime', label: 'Call Date', type: 'date', module: 'Calls', defaultSelected: true },
    { key: 'ownerName', label: 'Call Owner', type: 'text', module: 'Calls', defaultSelected: true },
    { key: 'notes', label: 'Call Notes', type: 'text', module: 'Calls', defaultSelected: false },
    { key: 'relatedDealName', label: 'Primary Deal', type: 'text', module: 'Deals', relatedOnly: true },
    { key: 'relatedDealStage', label: 'Deal Stage', type: 'text', module: 'Deals', relatedOnly: true },
    { key: 'relatedDealAmount', label: 'Deal Amount', type: 'currency', module: 'Deals', relatedOnly: true, summarizable: true },
  ],
  Tasks: [
    { key: 'title', label: 'Task Subject', type: 'text', module: 'Tasks', defaultSelected: true },
    { key: 'status', label: 'Status', type: 'text', module: 'Tasks', defaultSelected: true },
    { key: 'priority', label: 'Priority', type: 'text', module: 'Tasks', defaultSelected: true },
    { key: 'dueDate', label: 'Due Date', type: 'date', module: 'Tasks', defaultSelected: true },
    { key: 'contactName', label: 'Contact Name', type: 'text', module: 'Contacts', defaultSelected: true },
    { key: 'accountName', label: 'Account Name', type: 'text', module: 'Accounts', defaultSelected: true },
    { key: 'ownerName', label: 'Task Owner', type: 'text', module: 'Tasks', defaultSelected: true },
    { key: 'module', label: 'Related Module', type: 'text', module: 'Tasks', defaultSelected: false },
  ],
  Meetings: [
    { key: 'title', label: 'Meeting Title', type: 'text', module: 'Meetings', defaultSelected: true },
    { key: 'status', label: 'Meeting Status', type: 'text', module: 'Meetings', defaultSelected: true },
    { key: 'location', label: 'Location / Mode', type: 'text', module: 'Meetings', defaultSelected: true },
    { key: 'date', label: 'Meeting Date', type: 'date', module: 'Meetings', defaultSelected: true },
    { key: 'contactName', label: 'Contact Name', type: 'text', module: 'Contacts', defaultSelected: true },
    { key: 'accountName', label: 'Account Name', type: 'text', module: 'Accounts', defaultSelected: true },
    { key: 'ownerName', label: 'Host / Owner', type: 'text', module: 'Meetings', defaultSelected: true },
  ],
  Invoices: [
    { key: 'number', label: 'Invoice Number', type: 'text', module: 'Invoices', defaultSelected: true },
    { key: 'accountName', label: 'Account Name', type: 'text', module: 'Accounts', defaultSelected: true },
    { key: 'contactName', label: 'Contact Name', type: 'text', module: 'Contacts', defaultSelected: true },
    { key: 'status', label: 'Status', type: 'text', module: 'Invoices', defaultSelected: true },
    { key: 'amount', label: 'Invoice Total', type: 'currency', module: 'Invoices', defaultSelected: true, summarizable: true },
    { key: 'paidAmount', label: 'Paid Amount', type: 'currency', module: 'Invoices', defaultSelected: true, summarizable: true },
    { key: 'balance', label: 'Balance Due', type: 'currency', module: 'Invoices', defaultSelected: true, summarizable: true },
    { key: 'issueDate', label: 'Invoice Date', type: 'date', module: 'Invoices', defaultSelected: true },
    { key: 'dueDate', label: 'Due Date', type: 'date', module: 'Invoices', defaultSelected: true },
    { key: 'ownerName', label: 'Owner', type: 'text', module: 'Invoices', defaultSelected: false },
  ],
  Quotes: [
    { key: 'subject', label: 'Quote Subject', type: 'text', module: 'Quotes', defaultSelected: true },
    { key: 'stage', label: 'Quote Stage', type: 'text', module: 'Quotes', defaultSelected: true },
    { key: 'amount', label: 'Quote Amount', type: 'currency', module: 'Quotes', defaultSelected: true, summarizable: true },
    { key: 'validUntil', label: 'Valid Until', type: 'date', module: 'Quotes', defaultSelected: true },
    { key: 'accountName', label: 'Account Name', type: 'text', module: 'Accounts', defaultSelected: true },
    { key: 'contactName', label: 'Contact Name', type: 'text', module: 'Contacts', defaultSelected: true },
    { key: 'ownerName', label: 'Quote Owner', type: 'text', module: 'Quotes', defaultSelected: true },
  ],
  'Sales Orders': [
    { key: 'subject', label: 'Sales Order Subject', type: 'text', module: 'Sales Orders', defaultSelected: true },
    { key: 'status', label: 'Order Status', type: 'text', module: 'Sales Orders', defaultSelected: true },
    { key: 'amount', label: 'Order Amount', type: 'currency', module: 'Sales Orders', defaultSelected: true, summarizable: true },
    { key: 'dueDate', label: 'Delivery / Due Date', type: 'date', module: 'Sales Orders', defaultSelected: true },
    { key: 'accountName', label: 'Account Name', type: 'text', module: 'Accounts', defaultSelected: true },
    { key: 'contactName', label: 'Contact Name', type: 'text', module: 'Contacts', defaultSelected: true },
    { key: 'ownerName', label: 'Owner', type: 'text', module: 'Sales Orders', defaultSelected: true },
  ],
  Products: [
    { key: 'name', label: 'Product Name', type: 'text', module: 'Products', defaultSelected: true },
    { key: 'code', label: 'Product Code', type: 'text', module: 'Products', defaultSelected: true },
    { key: 'category', label: 'Category', type: 'text', module: 'Products', defaultSelected: true },
    { key: 'unitPrice', label: 'Unit Price', type: 'currency', module: 'Products', defaultSelected: true, summarizable: true },
    { key: 'accountName', label: 'Linked Account', type: 'text', module: 'Accounts', defaultSelected: true },
    { key: 'contactName', label: 'Linked Contact', type: 'text', module: 'Contacts', defaultSelected: false },
  ],
};

export const FILTER_OPERATORS = [
  { value: 'equals', label: 'is' },
  { value: 'not_equals', label: 'is not' },
  { value: 'contains', label: 'contains' },
  { value: 'not_contains', label: 'does not contain' },
  { value: 'gt', label: 'greater than' },
  { value: 'lt', label: 'less than' },
  { value: 'is_empty', label: 'is empty' },
  { value: 'is_not_empty', label: 'is not empty' },
];

export const SUMMARY_FUNCTIONS = [
  { value: 'SUM', label: 'Sum' },
  { value: 'AVG', label: 'Average' },
  { value: 'MIN', label: 'Largest / Min' },
  { value: 'MAX', label: 'Maximum' },
];

/**
 * Returns all available fields for a given primaryModule + selected relatedModules.
 */
export function getAvailableFieldsForReport(primaryModule, relatedModules = []) {
  const base = MODULE_FIELDS[primaryModule] || MODULE_FIELDS.Deals;
  const relSet = new Set(relatedModules || []);
  return base.filter((f) => !f.relatedOnly || relSet.has(f.module));
}

/**
 * Seeded Zoho CRM Reports matching Screenshot 1 (exact Report Names, Descriptions, Folders,
 * Last Accessed Dates, and Created By values, backed by live CRM query definitions).
 */
export function buildSeedReports() {
  return [
    {
      id: 'rep-1',
      name: 'Pre Deal Lost',
      description: '-',
      folder: 'Overall',
      lastAccessedDate: '10/10/2026',
      createdBy: 'Marketing Department',
      primaryModule: 'Deals',
      relatedModules: ['Accounts', 'Contacts'],
      reportType: 'summary',
      columns: ['name', 'accountName', 'contactName', 'stage', 'amount', 'probability', 'closingDate', 'ownerName'],
      groupBy: 'stage',
      secondaryGroupBy: '',
      groupSort: 'asc',
      summaries: [{ field: 'amount', fn: 'SUM' }, { field: 'amount', fn: 'AVG' }],
      filterJoin: 'OR',
      filters: [
        { id: 'f1', field: 'stage', operator: 'equals', value: 'Closed Lost' },
        { id: 'f2', field: 'stage', operator: 'equals', value: 'Qualification' },
        { id: 'f3', field: 'stage', operator: 'equals', value: 'Needs Analysis' },
      ],
      visibility: 'Everyone',
      sharedUserIds: [],
      favorite: false,
      createdAt: '2026-09-12T09:00:00Z',
    },
    {
      id: 'rep-2',
      name: 'Overall Previous_Month_Won_Report',
      description: '-',
      folder: 'Overall',
      lastAccessedDate: '01/10/2026',
      createdBy: 'Administration Team',
      primaryModule: 'Deals',
      relatedModules: ['Accounts', 'Contacts'],
      reportType: 'summary',
      columns: ['name', 'accountName', 'contactName', 'stage', 'amount', 'closingDate', 'ownerName'],
      groupBy: 'ownerName',
      secondaryGroupBy: '',
      groupSort: 'desc',
      summaries: [{ field: 'amount', fn: 'SUM' }, { field: 'amount', fn: 'MAX' }],
      filterJoin: 'AND',
      filters: [{ id: 'f1', field: 'stage', operator: 'equals', value: 'Closed Won' }],
      visibility: 'Everyone',
      sharedUserIds: [],
      favorite: false,
      createdAt: '2026-09-01T10:30:00Z',
    },
    {
      id: 'rep-3',
      name: 'Victoria__2. Pending Deals By Deal owner Overall',
      description: '-',
      folder: 'Deal Reports',
      lastAccessedDate: '17/09/2026',
      createdBy: 'Victoria',
      primaryModule: 'Deals',
      relatedModules: ['Accounts', 'Contacts'],
      reportType: 'summary',
      columns: ['name', 'accountName', 'stage', 'amount', 'probability', 'closingDate', 'ownerName'],
      groupBy: 'ownerName',
      secondaryGroupBy: 'stage',
      groupSort: 'asc',
      summaries: [{ field: 'amount', fn: 'SUM' }, { field: 'expectedRevenue', fn: 'SUM' }],
      filterJoin: 'AND',
      filters: [
        { id: 'f1', field: 'stage', operator: 'not_equals', value: 'Closed Won' },
        { id: 'f2', field: 'stage', operator: 'not_equals', value: 'Closed Lost' },
      ],
      visibility: 'Everyone',
      sharedUserIds: [],
      favorite: false,
      createdAt: '2026-08-20T14:15:00Z',
    },
    {
      id: 'rep-4',
      name: 'Deal Invoice Ready',
      description: '-',
      folder: 'Estimation team report',
      lastAccessedDate: '09/10/2026',
      createdBy: 'Administration Team',
      primaryModule: 'Deals',
      relatedModules: ['Accounts', 'Invoices', 'Contacts'],
      reportType: 'tabular',
      columns: ['name', 'accountName', 'contactName', 'stage', 'amount', 'relatedInvoicesTotal', 'closingDate', 'ownerName'],
      groupBy: '',
      secondaryGroupBy: '',
      groupSort: 'asc',
      summaries: [{ field: 'amount', fn: 'SUM' }, { field: 'relatedInvoicesTotal', fn: 'SUM' }],
      filterJoin: 'OR',
      filters: [
        { id: 'f1', field: 'stage', operator: 'equals', value: 'Closed Won' },
        { id: 'f2', field: 'stage', operator: 'equals', value: 'Negotiation' },
      ],
      visibility: 'Everyone',
      sharedUserIds: [],
      favorite: false,
      createdAt: '2026-09-18T11:00:00Z',
    },
    {
      id: 'rep-5',
      name: 'Deal Overall Call count',
      description: '-',
      folder: 'Overall',
      lastAccessedDate: '07/09/2026',
      createdBy: 'Administration Team',
      primaryModule: 'Deals',
      relatedModules: ['Accounts', 'Calls', 'Contacts'],
      reportType: 'summary',
      columns: ['name', 'accountName', 'contactName', 'stage', 'relatedCallsCount', 'amount', 'ownerName'],
      groupBy: 'stage',
      secondaryGroupBy: '',
      groupSort: 'asc',
      summaries: [{ field: 'relatedCallsCount', fn: 'SUM' }, { field: 'amount', fn: 'SUM' }],
      filterJoin: 'AND',
      filters: [],
      visibility: 'Everyone',
      sharedUserIds: [],
      favorite: false,
      createdAt: '2026-08-12T08:45:00Z',
    },
    {
      id: 'rep-6',
      name: 'Stage wise Lead Conversion',
      description: '-',
      folder: 'Overall',
      lastAccessedDate: '14/08/2026',
      createdBy: 'Administration Team',
      primaryModule: 'Leads',
      relatedModules: ['Accounts', 'Deals'],
      reportType: 'summary',
      columns: ['name', 'accountName', 'lifecycle', 'leadSource', 'email', 'phone', 'relatedDealsCount', 'relatedDealsAmount', 'ownerName'],
      groupBy: 'lifecycle',
      secondaryGroupBy: '',
      groupSort: 'asc',
      summaries: [{ field: 'relatedDealsCount', fn: 'SUM' }, { field: 'relatedDealsAmount', fn: 'SUM' }],
      filterJoin: 'AND',
      filters: [],
      visibility: 'Everyone',
      sharedUserIds: [],
      favorite: false,
      createdAt: '2026-07-25T16:20:00Z',
    },
    {
      id: 'rep-7',
      name: 'Deal Call Report_old data',
      description: '-',
      folder: 'Overall',
      lastAccessedDate: '14/08/2026',
      createdBy: 'Administration Team',
      primaryModule: 'Calls',
      relatedModules: ['Deals', 'Contacts', 'Accounts'],
      reportType: 'summary',
      columns: ['subject', 'contactName', 'accountName', 'type', 'status', 'duration', 'relatedDealName', 'relatedDealAmount', 'dateTime', 'ownerName'],
      groupBy: 'status',
      secondaryGroupBy: '',
      groupSort: 'asc',
      summaries: [{ field: 'duration', fn: 'SUM' }, { field: 'relatedDealAmount', fn: 'SUM' }],
      filterJoin: 'AND',
      filters: [],
      visibility: 'Everyone',
      sharedUserIds: [],
      favorite: false,
      createdAt: '2026-07-10T12:00:00Z',
    },
    {
      id: 'rep-8',
      name: 'Deal Call Report Live data',
      description: '-',
      folder: 'Overall',
      lastAccessedDate: '14/08/2026',
      createdBy: 'Administration Team',
      primaryModule: 'Calls',
      relatedModules: ['Contacts', 'Accounts', 'Deals'],
      reportType: 'summary',
      columns: ['subject', 'contactName', 'accountName', 'type', 'status', 'duration', 'dateTime', 'ownerName'],
      groupBy: 'ownerName',
      secondaryGroupBy: '',
      groupSort: 'asc',
      summaries: [{ field: 'duration', fn: 'SUM' }, { field: 'duration', fn: 'AVG' }],
      filterJoin: 'AND',
      filters: [],
      visibility: 'Everyone',
      sharedUserIds: [],
      favorite: false,
      createdAt: '2026-08-01T15:30:00Z',
    },
    {
      id: 'rep-9',
      name: 'Lead Call Report',
      description: '-',
      folder: 'Overall',
      lastAccessedDate: '2 hrs ago',
      createdBy: 'Administration Team',
      primaryModule: 'Leads',
      relatedModules: ['Calls', 'Accounts'],
      reportType: 'summary',
      columns: ['name', 'accountName', 'leadSource', 'lifecycle', 'phone', 'relatedCallsCount', 'followUp', 'ownerName'],
      groupBy: 'leadSource',
      secondaryGroupBy: '',
      groupSort: 'asc',
      summaries: [{ field: 'relatedCallsCount', fn: 'SUM' }],
      filterJoin: 'AND',
      filters: [],
      visibility: 'Everyone',
      sharedUserIds: [],
      favorite: false,
      createdAt: '2026-10-12T08:00:00Z',
    },
    {
      id: 'rep-10',
      name: 'Deal Estimation Sent to client_Translation, interpretation',
      description: '-',
      folder: 'Estimation team report',
      lastAccessedDate: '30/09/2026',
      createdBy: 'Administration Team',
      primaryModule: 'Deals',
      relatedModules: ['Accounts', 'Quotes', 'Contacts'],
      reportType: 'summary',
      columns: ['name', 'accountName', 'contactName', 'stage', 'amount', 'relatedQuotesTotal', 'closingDate', 'ownerName'],
      groupBy: 'stage',
      secondaryGroupBy: '',
      groupSort: 'asc',
      summaries: [{ field: 'amount', fn: 'SUM' }, { field: 'relatedQuotesTotal', fn: 'SUM' }],
      filterJoin: 'AND',
      filters: [],
      visibility: 'Everyone',
      sharedUserIds: [],
      favorite: false,
      createdAt: '2026-09-10T10:15:00Z',
    },
    {
      id: 'rep-11',
      name: 'Deal Estimation Sent to client_Translation',
      description: '-',
      folder: 'Estimation team report',
      lastAccessedDate: '09/10/2026',
      createdBy: 'Administration Team',
      primaryModule: 'Deals',
      relatedModules: ['Accounts', 'Contacts'],
      reportType: 'summary',
      columns: ['name', 'accountName', 'accountIndustry', 'stage', 'amount', 'probability', 'closingDate', 'ownerName'],
      groupBy: 'accountIndustry',
      secondaryGroupBy: '',
      groupSort: 'asc',
      summaries: [{ field: 'amount', fn: 'SUM' }, { field: 'amount', fn: 'AVG' }],
      filterJoin: 'AND',
      filters: [],
      visibility: 'Everyone',
      sharedUserIds: [],
      favorite: false,
      createdAt: '2026-09-22T13:00:00Z',
    },
    {
      id: 'rep-12',
      name: 'Overall Converted Deals with stage',
      description: '-',
      folder: 'Overall',
      lastAccessedDate: '12/09/2026',
      createdBy: 'Administration Team',
      primaryModule: 'Deals',
      relatedModules: ['Accounts', 'Contacts'],
      reportType: 'summary',
      columns: ['name', 'accountName', 'contactName', 'stage', 'amount', 'expectedRevenue', 'closingDate', 'ownerName'],
      groupBy: 'stage',
      secondaryGroupBy: '',
      groupSort: 'asc',
      summaries: [{ field: 'amount', fn: 'SUM' }, { field: 'expectedRevenue', fn: 'SUM' }],
      filterJoin: 'AND',
      filters: [],
      visibility: 'Everyone',
      sharedUserIds: [],
      favorite: false,
      createdAt: '2026-08-29T11:20:00Z',
    },
    {
      id: 'rep-13',
      name: 'Lead Activity Report > 3 days(Followup, Switch off)',
      description: '-',
      folder: 'Overall',
      lastAccessedDate: '26/06/2026',
      createdBy: 'Administration Team',
      primaryModule: 'Contacts',
      relatedModules: ['Accounts', 'Tasks', 'Calls'],
      reportType: 'summary',
      columns: ['name', 'accountName', 'phone', 'lifecycle', 'followUp', 'relatedCallsCount', 'relatedTasksCount', 'ownerName'],
      groupBy: 'ownerName',
      secondaryGroupBy: '',
      groupSort: 'asc',
      summaries: [{ field: 'relatedCallsCount', fn: 'SUM' }, { field: 'relatedTasksCount', fn: 'SUM' }],
      filterJoin: 'AND',
      filters: [],
      visibility: 'Everyone',
      sharedUserIds: [],
      favorite: false,
      createdAt: '2026-06-20T09:00:00Z',
    },
    {
      id: 'rep-14',
      name: 'Need Deal Estimation_Pending Info',
      description: '-',
      folder: 'Estimation team report',
      lastAccessedDate: '18/09/2026',
      createdBy: 'Administration Team',
      primaryModule: 'Deals',
      relatedModules: ['Accounts', 'Tasks'],
      reportType: 'tabular',
      columns: ['name', 'accountName', 'stage', 'amount', 'probability', 'relatedTasksCount', 'closingDate', 'ownerName'],
      groupBy: '',
      secondaryGroupBy: '',
      groupSort: 'asc',
      summaries: [{ field: 'amount', fn: 'SUM' }],
      filterJoin: 'OR',
      filters: [
        { id: 'f1', field: 'stage', operator: 'equals', value: 'Proposal/Price Quote' },
        { id: 'f2', field: 'stage', operator: 'equals', value: 'Needs Analysis' },
        { id: 'f3', field: 'stage', operator: 'equals', value: 'Value Proposition' },
      ],
      visibility: 'Everyone',
      sharedUserIds: [],
      favorite: false,
      createdAt: '2026-09-05T10:00:00Z',
    },
  ];
}

/**
 * Builds normalized rows for a report's Primary Module, joining Related Module metrics from live CRM state.
 */
export function buildModuleRows(primaryModule, crm) {
  const {
    accounts = [],
    contacts = [],
    deals = [],
    calls = [],
    invoices = [],
    tasks = [],
    accountRelations = {},
    contactRelations = {},
    accountsById = {},
    contactsById = {},
    usersById = {},
  } = crm || {};

  const uName = (id) => usersById[id]?.name || 'Arun Kumar';
  const aName = (id) => accountsById[id]?.name || '—';
  const cName = (id) => contactsById[id]?.name || '—';

  if (primaryModule === 'Deals') {
    return deals.map((d) => {
      const acc = accountsById[d.accountId] || {};
      const con = contactsById[d.contactId] || {};
      const relCalls = calls.filter((c) => c.accountId === d.accountId || c.contactId === d.contactId);
      const relTasks = tasks.filter((t) => t.recordId === d.id || t.accountId === d.accountId || t.contactId === d.contactId);
      const relInvs = invoices.filter((i) => i.accountId === d.accountId);
      const relQuotes = (accountRelations.quotes || []).filter((q) => q.accountId === d.accountId);
      const amt = Number(d.amount || d.value || 0);
      const prob = Number(d.probability ?? 50);
      return {
        id: d.id,
        _raw: d,
        _linkPath: `/deals?open=${d.id}`,
        name: d.name || 'Untitled Deal',
        accountName: acc.name || '—',
        contactName: con.name || '—',
        stage: d.stage || 'Qualification',
        amount: amt,
        probability: prob,
        expectedRevenue: Math.round((amt * prob) / 100),
        closingDate: d.closingDate || d.closeDate || '',
        ownerName: uName(d.ownerId),
        source: d.source || con.leadSource || 'Website',
        department: d.department || 'Enterprise Sales',
        forecastCategory: d.forecastCategory || (d.stage === 'Closed Won' ? 'Closed' : 'Pipeline'),
        createdOn: d.createdOn || d.createdTime || '',
        accountIndustry: acc.industry || '—',
        accountLocation: acc.billingCity || acc.location || '—',
        accountAnnualRevenue: Number(acc.annualRevenue || 0),
        contactEmail: con.email || '—',
        contactPhone: con.mobile || con.phone || '—',
        relatedCallsCount: relCalls.length,
        relatedTasksCount: relTasks.length,
        relatedInvoicesTotal: relInvs.reduce((s, i) => s + Number(i.amount || i.total || 0), 0),
        relatedQuotesTotal: relQuotes.reduce((s, q) => s + Number(q.amount || q.total || amt * 0.9), 0) || amt,
      };
    });
  }

  if (primaryModule === 'Contacts' || primaryModule === 'Leads') {
    return contacts.map((c) => {
      const acc = accountsById[c.accountId] || {};
      const relDeals = deals.filter((d) => d.contactId === c.id || (c.accountId && d.accountId === c.accountId));
      const relCalls = calls.filter((cl) => cl.contactId === c.id);
      const relTasks = tasks.filter((t) => t.contactId === c.id || t.recordId === c.id);
      const relMeetings = (contactRelations.meetings || []).filter((m) => m.contactId === c.id);
      const relInvs = invoices.filter((i) => i.accountId === c.accountId);
      return {
        id: c.id,
        _raw: c,
        _linkPath: `/contacts/${c.id}`,
        name: c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Unnamed Contact',
        accountName: acc.name || '—',
        email: c.email || '—',
        phone: c.phone || c.mobile || '—',
        mobile: c.mobile || c.phone || '—',
        designation: c.designation || c.title || '—',
        department: c.department || '—',
        lifecycle: c.lifecycle || 'New',
        leadSource: c.leadSource || 'Website',
        ownerName: uName(c.ownerId),
        mailingCity: c.mailingCity || acc.billingCity || acc.location || '—',
        followUp: c.followUp || '',
        lastContacted: c.lastContacted || '',
        createdOn: c.createdOn || c.createdTime || '',
        accountIndustry: acc.industry || '—',
        relatedDealsCount: relDeals.length,
        relatedDealsAmount: relDeals.reduce((s, d) => s + Number(d.amount || 0), 0),
        relatedCallsCount: relCalls.length,
        relatedTasksCount: relTasks.length,
        relatedMeetingsCount: relMeetings.length,
        relatedInvoicesTotal: relInvs.reduce((s, i) => s + Number(i.amount || i.total || 0), 0),
      };
    });
  }

  if (primaryModule === 'Accounts') {
    return accounts.map((a) => {
      const relCons = contacts.filter((c) => c.accountId === a.id);
      const relDeals = deals.filter((d) => d.accountId === a.id);
      const relCalls = calls.filter((c) => c.accountId === a.id);
      const relInvs = invoices.filter((i) => i.accountId === a.id);
      return {
        id: a.id,
        _raw: a,
        _linkPath: `/accounts/${a.id}`,
        name: a.name || 'Unnamed Account',
        type: a.type || 'Customer',
        industry: a.industry || 'Information Technology',
        status: a.status || 'Active',
        rating: a.rating || 'Hot',
        annualRevenue: Number(a.annualRevenue || 0),
        employees: Number(a.employees || 0),
        location: a.billingCity || a.location || '—',
        phone: a.mobile || a.phone || '—',
        gstin: a.gstin || a.gstNumber || '—',
        ownerName: uName(a.ownerId),
        createdOn: a.createdOn || a.createdTime || '',
        relatedContactsCount: relCons.length,
        relatedDealsCount: relDeals.length,
        relatedDealsAmount: relDeals.reduce((s, d) => s + Number(d.amount || 0), 0),
        relatedCallsCount: relCalls.length,
        relatedInvoicesTotal: relInvs.reduce((s, i) => s + Number(i.amount || i.total || 0), 0),
      };
    });
  }

  if (primaryModule === 'Calls') {
    return calls.map((c) => {
      const relDeal = deals.find((d) => d.contactId === c.contactId || d.accountId === c.accountId);
      return {
        id: c.id,
        _raw: c,
        _linkPath: `/calls?open=${c.id}`,
        subject: c.subject || 'Outbound Call',
        contactName: cName(c.contactId),
        accountName: aName(c.accountId),
        type: c.type || 'Outbound',
        status: c.status || 'Completed',
        duration: Number(c.duration || 0),
        dateTime: (c.dateTime || '').slice(0, 10),
        ownerName: uName(c.ownerId),
        notes: c.notes || '—',
        relatedDealName: relDeal?.name || '—',
        relatedDealStage: relDeal?.stage || '—',
        relatedDealAmount: Number(relDeal?.amount || 0),
      };
    });
  }

  if (primaryModule === 'Tasks') {
    const combinedTasks = [
      ...tasks,
      ...(contactRelations.tasks || []),
      ...(accountRelations.tasks || []),
    ];
    if (combinedTasks.length > 0) {
      return combinedTasks.map((t, idx) => ({
        id: t.id || `tsk-${idx}`,
        _raw: t,
        _linkPath: t.contactId ? `/contacts/${t.contactId}` : `/workflows?tab=tasks`,
        title: t.title || t.subject || 'Follow-up Task',
        status: t.status || (t.completed ? 'Completed' : 'Open'),
        priority: t.priority || 'High',
        dueDate: t.dueDate || t.due || '',
        contactName: cName(t.contactId),
        accountName: aName(t.accountId),
        ownerName: uName(t.ownerId),
        module: t.module || 'Contacts',
      }));
    }
    return contacts
      .filter((c) => c.followUp)
      .slice(0, 40)
      .map((c, idx) => ({
        id: `task-followup-${c.id}`,
        _raw: c,
        _linkPath: `/contacts/${c.id}`,
        title: `Follow up with ${c.name} (${c.lifecycle || 'Lead'})`,
        status: idx % 4 === 0 ? 'Completed' : idx % 3 === 0 ? 'In Progress' : 'Open',
        priority: idx % 2 === 0 ? 'High' : 'Normal',
        dueDate: c.followUp,
        contactName: c.name,
        accountName: aName(c.accountId),
        ownerName: uName(c.ownerId),
        module: 'Contacts',
      }));
  }

  if (primaryModule === 'Meetings') {
    const allMeetings = [
      ...(contactRelations.meetings || []),
      ...(accountRelations.meetings || []),
    ];
    if (allMeetings.length > 0) {
      return allMeetings.map((m, idx) => ({
        id: m.id || `mtg-${idx}`,
        _raw: m,
        _linkPath: m.contactId ? `/contacts/${m.contactId}` : '/contacts',
        title: m.title || m.subject || 'Client Strategy Meeting',
        status: m.status || 'Scheduled',
        location: m.location || 'Google Meet / Chennai Office',
        date: m.date || m.from || m.createdDate || '',
        contactName: cName(m.contactId),
        accountName: aName(m.accountId),
        ownerName: uName(m.ownerId),
      }));
    }
    // Derive from scheduled calls & contacts if no explicit meetings array items exist yet
    return contacts.slice(0, 12).map((c, idx) => ({
      id: `mtg-derived-${c.id}`,
      _raw: c,
      _linkPath: `/contacts/${c.id}`,
      title: `Quarterly Review Meeting — ${c.name}`,
      status: idx % 3 === 0 ? 'Completed' : 'Scheduled',
      location: idx % 2 === 0 ? 'Online (Zoom)' : `${c.mailingCity || 'Chennai'} Office`,
      date: c.followUp || c.lastContacted || c.createdOn || '2026-10-15',
      contactName: c.name,
      accountName: aName(c.accountId),
      ownerName: uName(c.ownerId),
    }));
  }

  if (primaryModule === 'Invoices') {
    return invoices.map((i) => {
      const primaryCon = contacts.find((c) => c.accountId === i.accountId);
      return {
        id: i.id,
        _raw: i,
        _linkPath: `/zoho-finance?open=${i.id}`,
        number: i.number || i.id,
        accountName: aName(i.accountId),
        contactName: primaryCon?.name || '—',
        status: i.status || 'Sent',
        amount: Number(i.amount || i.total || 0),
        paidAmount: Number(i.paidAmount || i.paid || 0),
        balance: balanceOf(i),
        issueDate: i.issueDate || i.date || '',
        dueDate: i.dueDate || '',
        ownerName: uName(i.ownerId),
      };
    });
  }

  if (primaryModule === 'Quotes') {
    return deals.slice(0, 15).map((d, idx) => ({
      id: `qt-${d.id}`,
      _raw: d,
      _linkPath: `/deals?open=${d.id}`,
      subject: `Quote #QT-${2040 + idx} — ${d.name}`,
      stage: d.stage === 'Closed Won' ? 'Accepted' : d.stage === 'Closed Lost' ? 'Declined' : 'Delivered',
      amount: Number(d.amount || 0),
      validUntil: d.closingDate || '2026-11-30',
      accountName: aName(d.accountId),
      contactName: cName(d.contactId),
      ownerName: uName(d.ownerId),
    }));
  }

  if (primaryModule === 'Sales Orders') {
    return deals
      .filter((d) => d.stage === 'Closed Won' || d.stage === 'Negotiation' || d.stage === 'Proposal/Price Quote')
      .map((d, idx) => ({
        id: `so-${d.id}`,
        _raw: d,
        _linkPath: `/deals?open=${d.id}`,
        subject: `SO-${3100 + idx} — ${d.name}`,
        status: d.stage === 'Closed Won' ? 'Approved & Fulfilled' : 'Pending Approval',
        amount: Number(d.amount || 0),
        dueDate: d.closingDate || '2026-11-15',
        accountName: aName(d.accountId),
        contactName: cName(d.contactId),
        ownerName: uName(d.ownerId),
      }));
  }

  if (primaryModule === 'Products') {
    return accounts.slice(0, 12).map((a, idx) => {
      const con = contacts.find((c) => c.accountId === a.id);
      return {
        id: `prd-${a.id}`,
        _raw: a,
        _linkPath: `/accounts/${a.id}`,
        name: `${a.industry || 'Enterprise'} Suite License`,
        code: `PRD-${101 + idx}`,
        category: a.industry || 'Software',
        unitPrice: Math.max(45000, Math.round(Number(a.annualRevenue || 500000) * 0.08)),
        accountName: a.name,
        contactName: con?.name || '—',
      };
    });
  }

  return [];
}

/**
 * Evaluates a single filter rule against a row.
 */
export function evaluateFilterRule(row, rule) {
  if (!rule || !rule.field) return true;
  const rawVal = row[rule.field];
  const op = rule.operator || 'contains';
  const target = String(rule.value ?? '').trim().toLowerCase();

  if (op === 'is_empty') {
    return rawVal === undefined || rawVal === null || String(rawVal).trim() === '' || rawVal === '—';
  }
  if (op === 'is_not_empty') {
    return rawVal !== undefined && rawVal !== null && String(rawVal).trim() !== '' && rawVal !== '—';
  }
  if (!target) return true;

  const strVal = String(rawVal ?? '').trim().toLowerCase();
  const numVal = Number(rawVal);
  const numTarget = Number(rule.value);

  switch (op) {
    case 'equals':
      return strVal === target;
    case 'not_equals':
      return strVal !== target;
    case 'contains':
      return strVal.includes(target);
    case 'not_contains':
      return !strVal.includes(target);
    case 'gt':
      if (!Number.isNaN(numVal) && !Number.isNaN(numTarget)) return numVal > numTarget;
      return strVal > target;
    case 'lt':
      if (!Number.isNaN(numVal) && !Number.isNaN(numTarget)) return numVal < numTarget;
      return strVal < target;
    default:
      return true;
  }
}

/**
 * Computes summary aggregations (SUM, AVG, MIN, MAX) for a list of rows.
 */
export function computeSummaries(rows, summaries = [], fieldMetaMap = {}) {
  return (summaries || [])
    .filter((s) => s && s.field && s.fn)
    .map((s) => {
      const meta = fieldMetaMap[s.field] || { label: s.field, type: 'number' };
      const nums = rows
        .map((r) => Number(r[s.field]))
        .filter((n) => !Number.isNaN(n));

      let value = 0;
      if (nums.length > 0) {
        if (s.fn === 'SUM') value = nums.reduce((a, b) => a + b, 0);
        else if (s.fn === 'AVG') value = nums.reduce((a, b) => a + b, 0) / nums.length;
        else if (s.fn === 'MIN') value = Math.min(...nums);
        else if (s.fn === 'MAX') value = Math.max(...nums);
      }

      return {
        key: `${s.fn}_${s.field}`,
        field: s.field,
        fieldLabel: meta.label,
        type: meta.type,
        fn: s.fn,
        fnLabel:
          s.fn === 'SUM'
            ? 'Sum'
            : s.fn === 'AVG'
              ? 'Average'
              : s.fn === 'MIN'
                ? 'Minimum'
                : 'Maximum',
        value,
        formatted: formatReportCell(value, meta.type),
      };
    });
}

/**
 * Formats a cell value based on its field type.
 */
export function formatReportCell(val, type = 'text') {
  if (val === undefined || val === null || val === '') return '—';
  if (type === 'currency') {
    const n = Number(val);
    return Number.isNaN(n) ? String(val) : fmtINR(Math.round(n));
  }
  if (type === 'percent') {
    const n = Number(val);
    return Number.isNaN(n) ? String(val) : `${Math.round(n)}%`;
  }
  if (type === 'number') {
    const n = Number(val);
    return Number.isNaN(n) ? String(val) : n.toLocaleString('en-IN');
  }
  if (type === 'date') {
    const s = String(val);
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return fmtDate(s.slice(0, 10));
    return s;
  }
  return String(val);
}

/**
 * Executes a Report definition against live CRM data.
 * Returns { columnsMeta, rows, groups, grandSummaries, totalCount }.
 */
export function executeReport(reportConfig, crm, options = {}) {
  const { searchQuery = '', sortField = '', sortDir = 'asc' } = options;
  const primaryModule = reportConfig?.primaryModule || 'Deals';
  const relatedModules = reportConfig?.relatedModules || [];
  const availableFields = getAvailableFieldsForReport(primaryModule, relatedModules);
  const fieldMetaMap = Object.fromEntries(availableFields.map((f) => [f.key, f]));

  // Resolve selected columns
  const selectedColKeys =
    Array.isArray(reportConfig?.columns) && reportConfig.columns.length > 0
      ? reportConfig.columns.filter((k) => fieldMetaMap[k])
      : availableFields.filter((f) => f.defaultSelected).map((f) => f.key);

  const columnsMeta = selectedColKeys.map((k) => fieldMetaMap[k]).filter(Boolean);

  // Build base rows from real CRM data
  let rows = buildModuleRows(primaryModule, crm);

  // Apply report filter rules
  const validFilters = (reportConfig?.filters || []).filter(
    (r) => r && r.field && (r.operator === 'is_empty' || r.operator === 'is_not_empty' || String(r.value ?? '').trim() !== '')
  );

  if (validFilters.length > 0) {
    const join = reportConfig?.filterJoin === 'OR' ? 'OR' : 'AND';
    rows = rows.filter((row) =>
      join === 'OR'
        ? validFilters.some((rule) => evaluateFilterRule(row, rule))
        : validFilters.every((rule) => evaluateFilterRule(row, rule))
    );
  }

  // Apply live search inside report viewer if provided
  const q = String(searchQuery || '').trim().toLowerCase();
  if (q) {
    rows = rows.filter((row) =>
      columnsMeta.some((col) => String(row[col.key] ?? '').toLowerCase().includes(q))
    );
  }

  // Sort rows if sortField is specified
  if (sortField && fieldMetaMap[sortField]) {
    const meta = fieldMetaMap[sortField];
    const dir = sortDir === 'desc' ? -1 : 1;
    rows = [...rows].sort((a, b) => {
      const va = a[sortField];
      const vb = b[sortField];
      if (meta.type === 'currency' || meta.type === 'number' || meta.type === 'percent') {
        return (Number(va || 0) - Number(vb || 0)) * dir;
      }
      return String(va ?? '').localeCompare(String(vb ?? '')) * dir;
    });
  }

  // Compute grand summaries
  const summariesConfig = reportConfig?.summaries || [];
  const grandSummaries = computeSummaries(rows, summariesConfig, fieldMetaMap);

  // Build groups if reportType === 'summary' or groupBy is set
  const groupByField = reportConfig?.reportType === 'summary' ? reportConfig?.groupBy || '' : '';
  let groups = [];

  if (groupByField && fieldMetaMap[groupByField]) {
    const groupMeta = fieldMetaMap[groupByField];
    const bucketMap = new Map();
    rows.forEach((row) => {
      const rawKey = row[groupByField];
      const groupKey = rawKey === undefined || rawKey === null || rawKey === '' ? 'Unassigned' : String(rawKey);
      if (!bucketMap.has(groupKey)) {
        bucketMap.set(groupKey, []);
      }
      bucketMap.get(groupKey).push(row);
    });

    groups = Array.from(bucketMap.entries()).map(([groupValue, groupRows]) => ({
      groupField: groupByField,
      groupFieldLabel: groupMeta.label,
      groupValue,
      count: groupRows.length,
      rows: groupRows,
      summaries: computeSummaries(groupRows, summariesConfig, fieldMetaMap),
    }));

    const gSort = reportConfig?.groupSort || 'asc';
    groups.sort((a, b) => {
      if (gSort === 'count_desc') return b.count - a.count;
      if (gSort === 'desc') return b.groupValue.localeCompare(a.groupValue);
      return a.groupValue.localeCompare(b.groupValue);
    });
  }

  return {
    primaryModule,
    relatedModules,
    availableFields,
    fieldMetaMap,
    columnsMeta,
    rows,
    groups,
    grandSummaries,
    totalCount: rows.length,
  };
}

/**
 * Exports a report execution result to CSV.
 */
export function exportReportResultsCSV(reportName, executionResult) {
  const { columnsMeta, rows } = executionResult;
  const cols = columnsMeta.map((col) => ({
    label: col.label,
    value: (row) => formatReportCell(row[col.key], col.type),
  }));
  const cleanName = String(reportName || 'crm-report')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-');
  exportCSV(`${cleanName}.csv`, rows, cols);
}

/**
 * Exports a report execution result to Excel-compatible HTML table (.xls).
 */
export function exportReportResultsExcel(reportName, executionResult) {
  if (typeof document === 'undefined') return;
  const { columnsMeta, rows, grandSummaries } = executionResult;
  const esc = (s) =>
    String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const ths = columnsMeta.map((c) => `<th style="background:#EFF6FF;font-weight:bold;border:1px solid #CBD5E1;padding:6px;">${esc(c.label)}</th>`).join('');
  const trs = rows
    .map(
      (r) =>
        `<tr>${columnsMeta
          .map((c) => `<td style="border:1px solid #E2E8F0;padding:5px;">${esc(formatReportCell(r[c.key], c.type))}</td>`)
          .join('')}</tr>`
    )
    .join('');

  const summaryRow =
    grandSummaries.length > 0
      ? `<tr><td colspan="${columnsMeta.length}" style="background:#F8FAFC;font-weight:bold;border:1px solid #CBD5E1;padding:6px;">${grandSummaries
          .map((s) => `${esc(s.fnLabel)} of ${esc(s.fieldLabel)}: ${esc(s.formatted)}`)
          .join(' | ')}</td></tr>`
      : '';

  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body><table><thead><tr>${ths}</tr></thead><tbody>${trs}${summaryRow}</tbody></table></body></html>`;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const cleanName = String(reportName || 'crm-report')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-');
  a.href = url;
  a.download = `${cleanName}.xls`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

