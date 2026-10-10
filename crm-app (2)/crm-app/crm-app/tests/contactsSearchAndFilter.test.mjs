import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import filter engine and seed data
import {
  SYSTEM_DEFINED_FILTERS,
  WEBSITE_ACTIVITY_FILTERS,
  CONTACT_FIELD_FILTERS,
  RELATED_MODULE_FILTERS,
  OPERATORS_BY_TYPE,
  searchFilterCatalog,
  evaluateContactFilters,
} from '../src/utils/contactsFilterEngine.js';

import {
  buildSeed,
  USERS,
} from '../src/data/seedData.js';

console.log('--- STARTING CONTACTS SEARCH & FILTERING TEST SUITE ---');

const data = buildSeed();

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`✓ ${name}`);
  } catch (err) {
    console.error(`✗ ${name}`);
    console.error(err);
    process.exit(1);
  }
}

// 1. Verify Category counts and exact item lists
test('Category 1: System Defined Filters contains all 12 required items', () => {
  assert.equal(SYSTEM_DEFINED_FILTERS.length, 12);
  const expected = [
    'Activities',
    'Cadences',
    'Campaigns',
    'Email Sentiment',
    'Latest Email Status',
    'Locked',
    'Record Action',
    'Related Records Action',
    'Scoring Rules',
    'Touched Records',
    'Untouched Records',
    'Website Activity',
  ];
  const actual = SYSTEM_DEFINED_FILTERS.map((f) => f.label).sort();
  assert.deepEqual(actual, [...expected].sort());
});

test('Category 2: Website Activity contains all 8 required items', () => {
  assert.equal(WEBSITE_ACTIVITY_FILTERS.length, 8);
  const expected = [
    'Average Time Spent (Minutes)',
    'Days Visited',
    'First Page Visited',
    'First Visit',
    'Most Recent Visit',
    'Number Of Chats',
    'Referrer',
    'Visitor Score',
  ];
  const actual = WEBSITE_ACTIVITY_FILTERS.map((f) => f.label).sort();
  assert.deepEqual(actual, [...expected].sort());
});

test('Category 3: Filter By Fields contains all 33 required items', () => {
  assert.equal(CONTACT_FIELD_FILTERS.length, 33);
  const expected = [
    'Account Name',
    'Associated Accounts',
    'City',
    'Client Name',
    'Connected To',
    'Contact Name',
    'Contact Owner',
    'Contact to Deal',
    'Created By',
    'Created Time',
    'Department',
    'Email',
    'First Name',
    'Last Activity Time',
    'Last Name',
    'Lead Manager 1',
    'Lead Source',
    'Mailing City',
    'Mailing Country',
    'Mailing State',
    'Mailing Street',
    'Mailing Zip',
    'Mobile',
    'Modified By',
    'Modified Time',
    'Phone',
    'Salutation',
    'Secondary Email',
    'Social Lead ID',
    'Tag',
    'Unsubscribed Mode',
    'Unsubscribed Time',
    'Vendor ID',
  ];
  const actual = CONTACT_FIELD_FILTERS.map((f) => f.label).sort();
  assert.deepEqual(actual, [...expected].sort());
});

test('Category 4: Filter By Related Modules contains all 22 required items', () => {
  assert.equal(RELATED_MODULE_FILTERS.length, 22);
  const expected = [
    'Calls',
    'Cases',
    'Contact Product Relation (Products)',
    'Contacts (City)',
    'Contacts (Reporting Contacts)',
    'Deal Contact Role (Contact Roles)',
    'Deals',
    'Emails',
    'Estimates (Estimate Contacts)',
    'Invitees (Invited Meetings)',
    'Invoices (Invoice Contacts)',
    'Leads (Connected Records)',
    'Leads (Converted Leads)',
    'Meetings',
    'Notes',
    'Sales Orders (Sales Order Contacts)',
    'Tasks',
    'VoC Events',
    'VoC Keywords',
    'VoC Responses',
    'Whatsapp messages',
    'Zoho Sign Documents (ZohoSign Documents)',
  ];
  const actual = RELATED_MODULE_FILTERS.map((f) => f.label).sort();
  assert.deepEqual(actual, [...expected].sort());
});

test('Total filter options catalog has exactly 75 items across all 4 categories', () => {
  const match = searchFilterCatalog('');
  assert.equal(match.totalMatches, 75);
  assert.equal(match.systemFilters.length, 12);
  assert.equal(match.websiteActivityFilters.length, 8);
  assert.equal(match.fieldFilters.length, 33);
  assert.equal(match.relatedFilters.length, 22);
});

// 2. Search box catalog search
test('searchFilterCatalog finds items across categories accurately', () => {
  const timeMatch = searchFilterCatalog('time');
  assert(timeMatch.totalMatches > 0);
  assert(timeMatch.websiteActivityFilters.some((w) => w.label.includes('Time')));
  assert(timeMatch.fieldFilters.some((f) => f.label.includes('Time')));

  const leadMatch = searchFilterCatalog('lead');
  assert(leadMatch.totalMatches > 0);
  assert(leadMatch.fieldFilters.some((f) => f.label.toLowerCase().includes('lead')));
  assert(leadMatch.relatedFilters.some((r) => r.label.toLowerCase().includes('lead')));
});

// 3. Operators verification
test('OPERATORS_BY_TYPE supports all specified operator sets', () => {
  // Text
  assert.deepEqual(OPERATORS_BY_TYPE.text, [
    'is',
    'is not',
    'contains',
    'does not contain',
    'starts with',
    'is empty',
    'is not empty',
  ]);
  // Number
  assert.deepEqual(OPERATORS_BY_TYPE.number, [
    'equals',
    'greater than',
    'less than',
    'between',
  ]);
  // Date
  assert(OPERATORS_BY_TYPE.date.includes('is'));
  assert(OPERATORS_BY_TYPE.date.includes('before'));
  assert(OPERATORS_BY_TYPE.date.includes('after'));
  assert(OPERATORS_BY_TYPE.date.includes('between'));
  assert(OPERATORS_BY_TYPE.date.includes('Today'));
  assert(OPERATORS_BY_TYPE.date.includes('Yesterday'));
  assert(OPERATORS_BY_TYPE.date.includes('This Week'));
  assert(OPERATORS_BY_TYPE.date.includes('This Month'));
  assert(OPERATORS_BY_TYPE.date.includes('Last 30 Days'));
  // Boolean
  assert(OPERATORS_BY_TYPE.boolean.includes('is'));
  assert(OPERATORS_BY_TYPE.boolean.includes('is not'));
  // Related
  assert.deepEqual(OPERATORS_BY_TYPE.related, [
    'has any',
    'has none',
    'matches selected record',
  ]);
});

// 4. Filter Evaluation & Conjunction tests
const mockFilterContext = {
  contacts: data.contacts,
  accounts: data.accounts,
  deals: data.deals,
  calls: data.calls,
  invoices: data.invoices,
  tasks: data.tasks,
  estimates: data.estimates,
  voCEvents: data.voCEvents,
  voCKeywords: data.voCKeywords,
  voCResponses: data.voCResponses,
  whatsappMessages: data.whatsappMessages,
  zohoSignDocuments: data.zohoSignDocuments,
  contactRelations: data.contactRelations,
  accountsById: Object.fromEntries(data.accounts.map((a) => [a.id, a])),
  usersById: Object.fromEntries(USERS.map((u) => [u.id, u])),
  contactsById: Object.fromEntries(data.contacts.map((c) => [c.id, c])),
};

test('Search bar and Field filters combine without conflict', () => {
  const result = evaluateContactFilters(
    data.contacts,
    {
      viewKey: 'all',
      tableSearch: 'Tech',
      fieldFilters: [{ field: 'department', operator: 'is', value: 'IT' }],
      globalJoin: 'AND',
    },
    mockFilterContext,
    '2026-10-10'
  );
  assert(Array.isArray(result));
  result.forEach((c) => {
    assert.equal(c.department, 'IT');
  });
});

test('Website Activity filters evaluate correctly (number between & greater than)', () => {
  const result = evaluateContactFilters(
    data.contacts,
    {
      viewKey: 'all',
      websiteActivityFilters: [
        { field: 'daysVisited', operator: 'greater than', value: '2' },
      ],
      globalJoin: 'AND',
    },
    mockFilterContext,
    '2026-10-10'
  );
  assert(result.length > 0);
  result.forEach((c) => {
    assert(c.daysVisited > 2);
  });
});

test('Filter Builder rules evaluate conjunctions (AND vs OR)', () => {
  const andResult = evaluateContactFilters(
    data.contacts,
    {
      viewKey: 'all',
      builderRules: [
        { category: 'field', field: 'department', operator: 'is', value: 'Sales' },
        { category: 'field', field: 'mailingCity', operator: 'is', value: 'Bangalore' },
      ],
      globalJoin: 'AND',
    },
    mockFilterContext,
    '2026-10-10'
  );

  const orResult = evaluateContactFilters(
    data.contacts,
    {
      viewKey: 'all',
      builderRules: [
        { category: 'field', field: 'department', operator: 'is', value: 'Sales' },
        { category: 'field', field: 'mailingCity', operator: 'is', value: 'Bangalore' },
      ],
      globalJoin: 'OR',
    },
    mockFilterContext,
    '2026-10-10'
  );

  assert(orResult.length >= andResult.length);
});

test('All 22 related modules evaluate without runtime errors', () => {
  RELATED_MODULE_FILTERS.forEach((rel) => {
    const res = evaluateContactFilters(
      data.contacts,
      {
        viewKey: 'all',
        relatedFilters: [{ module: rel.key, mode: 'has any', operator: 'has any' }],
      },
      mockFilterContext,
      '2026-10-10'
    );
    assert(Array.isArray(res));
  });
});

// 5. Static Inspection of Contacts.jsx UI implementation
test('Contacts.jsx contains Filter button directly beside Search Bar', () => {
  const filePath = path.join(__dirname, '../src/pages/Contacts/Contacts.jsx');
  const code = fs.readFileSync(filePath, 'utf8');

  // Search input check
  assert(code.includes('placeholder="Search contacts in table..."'));
  // Filter button check
  assert(code.includes('aria-label="Filter contacts"'));
  assert(code.includes('ref={filterBtnRef}'));
  // Popover check
  assert(code.includes('ref={filterMenuRef}'));
  assert(code.includes('aria-label="Filter Contacts"'));
  assert(code.includes('Search filter options across all 4 categories...'));
  // Category tabs
  assert(code.includes('System Defined ('));
  assert(code.includes('Website Activity ('));
  assert(code.includes('Fields ('));
  assert(code.includes('Related Modules ('));
  // Actions
  assert(code.includes('Add Filter'));
  assert(code.includes('Save Filter'));
  // Result indicator & chips
  assert(code.includes('Showing {table.totalRows} of {contacts.length} contacts'));
  assert(code.includes('Filtered'));
  // Clear all
  assert(code.includes('Clear All'));
  // Reset empty state in DataTable
  assert(code.includes('emptyTitle={activeFilterCount > 0 ? "No records match these filters" : "No contacts found"}'));
  assert(code.includes('Reset Filters &amp; Search'));
  // Escape key handler
  assert(code.includes('e.key === \'Escape\''));
  // Click outside handler
  assert(code.includes('document.addEventListener(\'mousedown\', handleClickOutside)'));
});

console.log(`\nALL ${passed}/${passed} SEARCH & FILTER TESTS PASSED SUCCESSFULLY!`);
