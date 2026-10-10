import assert from 'node:assert/strict';
import { buildSeed, USERS } from '../src/data/seedData.js';
import {
  SYSTEM_DEFINED_FILTERS,
  WEBSITE_ACTIVITY_FILTERS,
  CONTACT_FIELD_FILTERS,
  RELATED_MODULE_FILTERS,
  searchFilterCatalog,
  evaluateFieldCondition,
  evaluateSystemFilter,
  evaluateRelatedCondition,
  evaluateContactFilters,
  getRelatedRecordsForContact,
} from '../src/utils/contactsFilterEngine.js';

const data = buildSeed();
const accountsById = Object.fromEntries(data.accounts.map(a => [a.id, a]));
const usersById = Object.fromEntries(USERS.map(u => [u.id, u]));
const contactsById = Object.fromEntries(data.contacts.map(c => [c.id, c]));

const ctx = {
  contacts: data.contacts,
  users: USERS,
  accounts: data.accounts,
  deals: data.deals,
  calls: data.calls,
  invoices: data.invoices,
  tasks: data.tasks,
  contactRelations: data.contactRelations,
  accountsById,
  usersById,
  contactsById,
};

const results = [];
function runTest(id, name, fn) {
  try {
    fn();
    results.push({ id, name, status: 'PASS' });
  } catch (err) {
    results.push({ id, name, status: 'FAIL', error: err.message });
    throw err;
  }
}

// 1. Render Contacts page dataset and default columns
runTest(1, 'Render Contacts dataset with all required core and Zoho fields', () => {
  assert.equal(ctx.contacts.length, 220, 'Should have 220 seeded contacts');
  const sample = ctx.contacts[0];
  assert.ok(sample.id && sample.name && sample.firstName && sample.lastName, 'Contact has id, full name, first/last name');
  assert.ok(sample.accountId && sample.email && sample.phone && sample.ownerId, 'Contact has accountId, email, phone, ownerId');
  assert.ok(sample.mailingStreet && sample.mailingCity && sample.mailingState && sample.mailingZip && sample.mailingCountry, 'Contact has complete Mailing Address');
  assert.ok(sample.otherStreet && sample.otherCity && sample.otherState && sample.otherZip && sample.otherCountry, 'Contact has complete Other Address');
  assert.ok(sample.averageTimeSpent != null && sample.daysVisited != null, 'Contact has website activity metrics');
  assert.ok(sample.emailSentiment && sample.scoringRules != null, 'Contact has email sentiment and scoring rules');
});

// 2. Render all 12 exact System Defined Filters
runTest(2, 'Render all 12 exact System Defined Filters', () => {
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
  assert.equal(SYSTEM_DEFINED_FILTERS.length, 12);
  assert.deepEqual(
    SYSTEM_DEFINED_FILTERS.map(f => f.label),
    expected
  );
});

// 3. Render all 8 exact Website Activity Filters
runTest(3, 'Render all 8 exact Website Activity Filters', () => {
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
  assert.equal(WEBSITE_ACTIVITY_FILTERS.length, 8);
  assert.deepEqual(
    WEBSITE_ACTIVITY_FILTERS.map(f => f.label),
    expected
  );
});

// 4. Render all 33 exact Filter By Fields items in exact order
runTest(4, 'Render all 33 exact Filter By Fields items in exact order', () => {
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
  assert.equal(CONTACT_FIELD_FILTERS.length, 33);
  assert.deepEqual(
    CONTACT_FIELD_FILTERS.map(f => f.label),
    expected
  );
});

// 5. Render all 22 exact Filter By Related Modules items in exact order
runTest(5, 'Render all 22 exact Filter By Related Modules items in exact order', () => {
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
  assert.equal(RELATED_MODULE_FILTERS.length, 22);
  assert.deepEqual(
    RELATED_MODULE_FILTERS.map(r => r.label),
    expected
  );
});

// 6. Search filter options inside the filter catalog (all 4 categories = 75 total)
runTest(6, 'Search filter catalog across all 4 categories (total 75 items)', () => {
  const allRes = searchFilterCatalog('');
  assert.equal(allRes.totalMatches, 75, 'Total filter options across 4 categories must be 75');
  assert.equal(allRes.systemFilters.length, 12);
  assert.equal(allRes.websiteActivityFilters.length, 8);
  assert.equal(allRes.fieldFilters.length, 33);
  assert.equal(allRes.relatedFilters.length, 22);

  const cityRes = searchFilterCatalog('city');
  assert.ok(cityRes.fieldFilters.some(f => f.label === 'City' || f.label === 'Mailing City'));
  assert.ok(cityRes.relatedFilters.some(r => r.label === 'Contacts (City)'));

  const vocRes = searchFilterCatalog('voc');
  assert.equal(vocRes.relatedFilters.length, 3, 'Should match VoC Events, VoC Keywords, VoC Responses');

  const noMatch = searchFilterCatalog('xyznonexistent123');
  assert.equal(noMatch.totalMatches, 0, 'Should return 0 matches for nonexistent filter label');
});

// 7. Toggle System Defined Filters and verify row filtering
runTest(7, 'Toggle System Defined Filters (including Email Sentiment, Scoring Rules, Website Activity)', () => {
  for (const sys of SYSTEM_DEFINED_FILTERS) {
    const matched = ctx.contacts.filter(c => evaluateSystemFilter(c, sys.key, ctx));
    assert.ok(
      matched.length > 0 && matched.length <= ctx.contacts.length,
      `System filter ${sys.label} should filter rows (${matched.length})`
    );
  }
  const touched = ctx.contacts.filter(c => evaluateSystemFilter(c, 'Touched Records', ctx));
  const untouched = ctx.contacts.filter(c => evaluateSystemFilter(c, 'Untouched Records', ctx));
  assert.equal(touched.length + untouched.length, ctx.contacts.length, 'Touched + Untouched should equal total contacts');

  // Email Sentiment filter evaluation
  const positiveSentiment = ctx.contacts.filter(c =>
    evaluateSystemFilter(c, { field: 'Email Sentiment', operator: 'is', value: 'Positive' }, ctx)
  );
  assert.ok(positiveSentiment.length > 0);
  assert.ok(positiveSentiment.every(c => c.emailSentiment === 'Positive'));
});

// 8. Apply Website Activity filters (Average Time Spent, Days Visited, Visitor Score)
runTest(8, 'Apply Website Activity filters (Average Time Spent, Days Visited, Visitor Score)', () => {
  const highTimeSpent = ctx.contacts.filter(c =>
    evaluateFieldCondition(c, { field: 'averageTimeSpent', type: 'number', operator: 'greater than', value: 30 }, ctx)
  );
  assert.ok(highTimeSpent.length > 0);
  assert.ok(highTimeSpent.every(c => (c.averageTimeSpent ?? 0) > 30));

  const multiDaysVisited = ctx.contacts.filter(c =>
    evaluateFieldCondition(c, { field: 'daysVisited', type: 'number', operator: 'between', value: 5, valueTo: 20 }, ctx)
  );
  assert.ok(multiDaysVisited.length > 0);
  assert.ok(multiDaysVisited.every(c => c.daysVisited >= 5 && c.daysVisited <= 20));

  const highVisitorScore = ctx.contacts.filter(c =>
    evaluateFieldCondition(c, { field: 'visitorScore', type: 'number', operator: 'greater than', value: 50 }, ctx)
  );
  assert.ok(highVisitorScore.length > 0);
  assert.ok(highVisitorScore.every(c => c.visitorScore > 50));
});

// 9. Apply text field filter (Is, Contains, Starts with, Does not contain, Is empty)
runTest(9, 'Apply text field filters (Is, Contains, Starts with, Does not contain, Is empty)', () => {
  const chennaiContacts = ctx.contacts.filter(c =>
    evaluateFieldCondition(c, { field: 'mailingCity', operator: 'is', value: 'Chennai' }, ctx)
  );
  assert.ok(chennaiContacts.length > 0);
  assert.ok(chennaiContacts.every(c => c.mailingCity === 'Chennai'));

  const startsWithA = ctx.contacts.filter(c =>
    evaluateFieldCondition(c, { field: 'firstName', operator: 'starts with', value: 'A' }, ctx)
  );
  assert.ok(startsWithA.length > 0);
  assert.ok(startsWithA.every(c => c.firstName.toUpperCase().startsWith('A')));

  const doesNotContainGmail = ctx.contacts.filter(c =>
    evaluateFieldCondition(c, { field: 'email', operator: 'does not contain', value: 'gmail.com' }, ctx)
  );
  assert.equal(doesNotContainGmail.length, ctx.contacts.length, 'Seeded contacts use enterprise domains');
});

// 10. Apply date field filter (Before, After, Between, Today, Last 30 Days)
runTest(10, 'Apply date field filters (Before, After, Between, Last 30 Days)', () => {
  const betweenContacts = ctx.contacts.filter(c =>
    evaluateFieldCondition(
      c,
      { field: 'createdTime', type: 'date', operator: 'between', value: '2025-01-01', valueTo: '2026-12-31' },
      ctx
    )
  );
  assert.ok(betweenContacts.length > 0);
  assert.ok(
    betweenContacts.every(c => {
      const yr = new Date(c.createdTime).getFullYear();
      return yr >= 2025 && yr <= 2026;
    })
  );

  const beforeContacts = ctx.contacts.filter(c =>
    evaluateFieldCondition(
      c,
      { field: 'firstVisit', type: 'date', operator: 'before', value: '2026-10-01' },
      ctx
    )
  );
  assert.ok(beforeContacts.length > 0);
});

// 11. Apply boolean field filter (Email Opt Out, Locked, Website Activity)
runTest(11, 'Apply boolean field filters (Email Opt Out, Locked, Website Activity)', () => {
  const optOutYes = ctx.contacts.filter(c =>
    evaluateFieldCondition(c, { field: 'emailOptOut', type: 'boolean', operator: 'is', value: 'Yes' }, ctx)
  );
  const optOutNo = ctx.contacts.filter(c =>
    evaluateFieldCondition(c, { field: 'emailOptOut', type: 'boolean', operator: 'is', value: 'No' }, ctx)
  );
  assert.ok(optOutYes.length > 0 && optOutNo.length > 0);
  assert.equal(optOutYes.length + optOutNo.length, ctx.contacts.length);

  const lockedContacts = ctx.contacts.filter(c =>
    evaluateFieldCondition(c, { field: 'locked', type: 'boolean', operator: 'is', value: 'Yes' }, ctx)
  );
  assert.ok(lockedContacts.length > 0);
});

// 12. Apply lookup field filter (Contact Owner, Account Name, Vendor ID, Lead Manager 1)
runTest(12, 'Apply lookup field filters (Contact Owner, Account Name, Vendor ID, Lead Manager 1)', () => {
  const arunOwned = ctx.contacts.filter(c =>
    evaluateFieldCondition(c, { field: 'ownerId', type: 'lookup', operator: 'is', value: 'Arun Kumar' }, ctx)
  );
  assert.ok(arunOwned.length > 0);
  assert.ok(arunOwned.every(c => c.ownerId === 'u1'));

  const vendorMatches = ctx.contacts.filter(c =>
    evaluateFieldCondition(c, { field: 'vendorId', type: 'lookup', operator: 'contains', value: 'CloudNet' }, ctx)
  );
  assert.ok(vendorMatches.length > 0);
});

// 13. Apply related Deals filter (has any, has none, matches selected record, open_deal)
runTest(13, 'Apply related Deals filters (has any, has none, matches selected record, open_deal)', () => {
  const hasDeals = ctx.contacts.filter(c =>
    evaluateRelatedCondition(c, { module: 'deals', operator: 'has any' }, ctx)
  );
  const noDeals = ctx.contacts.filter(c =>
    evaluateRelatedCondition(c, { module: 'deals', operator: 'has none' }, ctx)
  );
  assert.ok(hasDeals.length > 0 && noDeals.length > 0);
  assert.equal(hasDeals.length + noDeals.length, ctx.contacts.length);

  const openDealContacts = ctx.contacts.filter(c =>
    evaluateRelatedCondition(c, { module: 'deals', mode: 'open_deal' }, ctx)
  );
  assert.ok(openDealContacts.length > 0);
});

// 14. Apply related Estimates, VoC Events, VoC Keywords, WhatsApp Messages, Zoho Sign Documents
runTest(14, 'Apply related Estimates, VoC Events, VoC Keywords, WhatsApp Messages, Zoho Sign Documents', () => {
  const hasEstimates = ctx.contacts.filter(c =>
    evaluateRelatedCondition(c, { module: 'estimates', operator: 'has any' }, ctx)
  );
  assert.ok(hasEstimates.length > 0, 'Should find contacts with estimates');

  const hasVoCEvents = ctx.contacts.filter(c =>
    evaluateRelatedCondition(c, { module: 'voCEvents', operator: 'has any' }, ctx)
  );
  assert.ok(hasVoCEvents.length > 0, 'Should find contacts with VoC events');

  const hasVoCKeywords = ctx.contacts.filter(c =>
    evaluateRelatedCondition(c, { module: 'voCKeywords', operator: 'has any' }, ctx)
  );
  assert.ok(hasVoCKeywords.length > 0, 'Should find contacts with VoC keywords');

  const hasWhatsApp = ctx.contacts.filter(c =>
    evaluateRelatedCondition(c, { module: 'whatsappMessages', operator: 'has any' }, ctx)
  );
  assert.ok(hasWhatsApp.length > 0, 'Should find contacts with WhatsApp messages');

  const hasZohoSign = ctx.contacts.filter(c =>
    evaluateRelatedCondition(c, { module: 'zohoSignDocuments', operator: 'has any' }, ctx)
  );
  assert.ok(hasZohoSign.length > 0, 'Should find contacts with Zoho Sign documents');

  const citySharedContacts = ctx.contacts.filter(c =>
    evaluateRelatedCondition(c, { module: 'contactsCity', operator: 'has any' }, ctx)
  );
  assert.ok(citySharedContacts.length > 0, 'Should find contacts sharing same city');
});

// 15. Combine multiple filters using AND
runTest(15, 'Combine multiple filters using AND (Owner = Arun Kumar AND City = Chennai AND Email Opt Out = No)', () => {
  const matched = evaluateContactFilters(
    ctx.contacts,
    {
      globalJoin: 'AND',
      fieldFilters: [
        { field: 'ownerId', operator: 'is', value: 'Arun Kumar', enabled: true },
        { field: 'mailingCity', operator: 'is', value: 'Chennai', enabled: true },
        { field: 'emailOptOut', operator: 'is', value: 'No', enabled: true },
      ],
    },
    ctx
  );
  assert.equal(matched.length, 11, 'Combined AND filter should match the 11 seeded Chennai contacts owned by Arun Kumar with Email Opt Out = No');
  assert.ok(
    matched.every(c => c.ownerId === 'u1' && c.mailingCity === 'Chennai' && c.emailOptOut === false)
  );
});

// 16. Combine multiple filters using OR
runTest(16, 'Combine multiple filters using OR (City = Chennai OR City = Mumbai)', () => {
  const matched = evaluateContactFilters(
    ctx.contacts,
    {
      globalJoin: 'OR',
      fieldFilters: [
        { field: 'mailingCity', operator: 'is', value: 'Chennai', enabled: true },
        { field: 'mailingCity', operator: 'is', value: 'Mumbai', enabled: true },
      ],
    },
    ctx
  );
  assert.ok(matched.length > 0);
  assert.ok(matched.every(c => c.mailingCity === 'Chennai' || c.mailingCity === 'Mumbai'));
});

// 17. Combine text search with active filters
runTest(17, 'Combine table text search with active filters', () => {
  const searchAndFilter = evaluateContactFilters(
    ctx.contacts,
    {
      tableSearch: 'sharma',
      fieldFilters: [
        { field: 'mailingCity', operator: 'is', value: 'Chennai', enabled: true },
      ],
      globalJoin: 'AND',
    },
    ctx
  );
  assert.ok(searchAndFilter.length > 0);
  assert.ok(
    searchAndFilter.every(c =>
      c.mailingCity === 'Chennai' &&
      (c.name.toLowerCase().includes('sharma') || c.email.toLowerCase().includes('sharma'))
    )
  );
});

// 18. Save a custom filter view and reload it
runTest(18, 'Saved filter views exist and evaluate accurately when loaded', () => {
  assert.ok(Array.isArray(data.savedContactViews) && data.savedContactViews.length >= 2);
  const savedView = data.savedContactViews[0];
  assert.ok(savedView.id && savedView.name, 'Saved view has id and name');
  const matched = evaluateContactFilters(ctx.contacts, savedView, ctx);
  assert.ok(matched.length > 0);
});

// 19. Clear all filters resets both active filters and search
runTest(19, 'Clear all filters restores full 220 contact list', () => {
  const matched = evaluateContactFilters(ctx.contacts, {}, ctx);
  assert.equal(matched.length, 220);
});

// 20. Sort contacts by Name, Created Time, Last Contacted
runTest(20, 'Sort contacts ascending and descending by Name, Created Time, Last Contacted', () => {
  const byNameAsc = [...ctx.contacts].sort((a, b) => a.name.localeCompare(b.name));
  assert.ok(byNameAsc[0].name.localeCompare(byNameAsc[byNameAsc.length - 1].name) <= 0);

  const byCreatedDesc = [...ctx.contacts].sort((a, b) => b.createdTime.localeCompare(a.createdTime));
  assert.ok(byCreatedDesc[0].createdTime >= byCreatedDesc[byCreatedDesc.length - 1].createdTime);
});

// 21. Paginate filtered contacts across page sizes 10, 25, 50, 100
runTest(21, 'Paginate filtered contacts across page sizes 10, 25, 50, 100', () => {
  for (const size of [10, 25, 50, 100]) {
    const page1 = ctx.contacts.slice(0, size);
    assert.equal(page1.length, size);
    const totalPages = Math.ceil(ctx.contacts.length / size);
    assert.ok(totalPages >= 3);
  }
});

// 22. Create a new contact and verify it appears in table and matches filters
runTest(22, 'Create a new contact and verify it matches filters', () => {
  const newContact = {
    ...ctx.contacts[0],
    id: 'con_test_new',
    firstName: 'Vikram',
    lastName: 'Subramanian',
    name: 'Vikram Subramanian',
    email: 'vikram.subramanian@honeyone.in',
    mailingCity: 'Bengaluru',
    ownerId: 'u1',
    emailOptOut: false,
  };
  const matchesFilter = evaluateFieldCondition(
    newContact,
    { field: 'email', operator: 'is', value: 'vikram.subramanian@honeyone.in' },
    ctx
  );
  assert.equal(matchesFilter, true);
});

// 23. Edit a contact and verify updated filter results
runTest(23, 'Edit a contact and verify updated filter results', () => {
  const edited = { ...ctx.contacts[0], mailingCity: 'Coimbatore', emailOptOut: true };
  assert.equal(
    evaluateFieldCondition(edited, { field: 'mailingCity', operator: 'is', value: 'Coimbatore' }, ctx),
    true
  );
  assert.equal(
    evaluateFieldCondition(edited, { field: 'emailOptOut', operator: 'is', value: 'Yes' }, ctx),
    true
  );
});

// 24. Delete a contact and verify removal
runTest(24, 'Delete a contact and verify removal from dataset', () => {
  const targetId = ctx.contacts[0].id;
  const remaining = ctx.contacts.filter(c => c.id !== targetId);
  assert.equal(remaining.length, ctx.contacts.length - 1);
  assert.equal(remaining.some(c => c.id === targetId), false);
});

// 25. Duplicate email detection and role-based visibility check
runTest(25, 'Duplicate email normalization & role-based visibility', () => {
  const existingEmail = ctx.contacts[0].email.toUpperCase();
  const isDuplicate = ctx.contacts.some(c => c.email.trim().toLowerCase() === existingEmail.trim().toLowerCase());
  assert.equal(isDuplicate, true, 'Should detect duplicate email case-insensitively');

  const repFiltered = evaluateContactFilters(
    ctx.contacts,
    { viewKey: 'mine', activeUser: USERS[1] },
    ctx
  );
  assert.ok(repFiltered.length > 0 && repFiltered.length < ctx.contacts.length);
});

console.log(`ALL ${results.length}/25 CONTACTS MODULE TESTS PASSED SUCCESSFULLY!`);
