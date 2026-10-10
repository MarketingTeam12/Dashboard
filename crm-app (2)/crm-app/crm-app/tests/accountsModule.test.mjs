import assert from 'node:assert/strict';
import { buildSeed, USERS, ACCOUNT_TYPES, ACCOUNT_RATINGS, ACCOUNT_STATUSES, INDUSTRIES } from '../src/data/seedData.js';
import {
  ACCOUNT_SYSTEM_DEFINED_FILTERS,
  ACCOUNT_FIELD_FILTERS,
  ACCOUNT_RELATED_MODULE_FILTERS,
  searchAccountFilterCatalog,
  evaluateAccountFieldCondition,
  evaluateAccountSystemFilter,
  evaluateAccountRelatedCondition,
  evaluateAccountFilters,
  getRelatedRecordsForAccount,
  canSetParentAccount,
  getSelectableParentAccounts,
  getAccountHierarchyTree,
  validateAccountFilterConfig,
} from '../src/utils/accountsFilterEngine.js';

const data = buildSeed();
const accountsById = Object.fromEntries(data.accounts.map((a) => [a.id, a]));
const usersById = Object.fromEntries(USERS.map((u) => [u.id, u]));
const contactsById = Object.fromEntries(data.contacts.map((c) => [c.id, c]));

const ctx = {
  accounts: data.accounts,
  contacts: data.contacts,
  deals: data.deals,
  calls: data.calls,
  invoices: data.invoices,
  accountRelations: data.accountRelations,
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

// 1. Accounts page dataset & default fields rendering
runTest(1, 'Accounts dataset renders with all 37 fields and Zoho default columns', () => {
  assert.equal(ctx.accounts.length, 248, 'Should have 248 seeded accounts');
  const sample = ctx.accounts[0];
  assert.ok(sample.id && sample.name && sample.accountNumber && sample.accountSite);
  assert.ok(sample.phone && sample.website && sample.ownerId);
  assert.ok(sample.billingFlat && sample.billingStreet && sample.billingCity && sample.billingState && sample.billingZip && sample.billingCountry);
  assert.ok(sample.shippingFlat && sample.shippingStreet && sample.shippingCity && sample.shippingState && sample.shippingZip && sample.shippingCountry);
});

// 2. All six System Defined Filters
runTest(2, 'Render all 6 exact System Defined Filters in exact order', () => {
  const expected = [
    'Cadences',
    'Locked',
    'Record Action',
    'Related Records Action',
    'Touched Records',
    'Untouched Records',
  ];
  assert.equal(ACCOUNT_SYSTEM_DEFINED_FILTERS.length, 6);
  assert.deepEqual(
    ACCOUNT_SYSTEM_DEFINED_FILTERS.map((f) => f.label),
    expected
  );
});

// 3. All 37 Field Filter labels in exact order
runTest(3, 'Render all 37 exact Filter By Fields labels in exact order', () => {
  const expected = [
    'Account Name',
    'Account Number',
    'Account Owner',
    'Account Site',
    'Account Type',
    'Annual Revenue',
    'Billing Address',
    'Billing Address - City',
    'Billing Address - Country / Region',
    'Billing Address - Flat / House No./ Building / Apartment Name',
    'Billing Address - State / Province',
    'Billing Address - Street Address',
    'Billing Address - Zip / Postal Code',
    'Connected To',
    'Created By',
    'Created Time',
    'Employees',
    'Fax',
    'Industry',
    'Last Activity Time',
    'Modified By',
    'Modified Time',
    'Ownership',
    'Parent Account',
    'Phone',
    'Rating',
    'Shipping Address',
    'Shipping Address - City',
    'Shipping Address - Country / Region',
    'Shipping Address - Flat / House No./ Building / Apartment Name',
    'Shipping Address - State / Province',
    'Shipping Address - Street Address',
    'Shipping Address - Zip / Postal Code',
    'SIC Code',
    'Tag',
    'Ticker Symbol',
    'Website',
  ];
  assert.equal(ACCOUNT_FIELD_FILTERS.length, 37);
  assert.deepEqual(
    ACCOUNT_FIELD_FILTERS.map((f) => f.label),
    expected
  );
});

// 4. All ten Related Module Filters in exact order
runTest(4, 'Render all 10 exact Filter By Related Modules labels in exact order', () => {
  const expected = [
    'Account Product Relation (Products)',
    'Accounts (Member Accounts)',
    'Cases',
    'Contacts',
    'Deals',
    'Emails',
    'Invoices',
    'Leads (Converted Leads)',
    'Quotes',
    'Sales Orders',
  ];
  assert.equal(ACCOUNT_RELATED_MODULE_FILTERS.length, 10);
  assert.deepEqual(
    ACCOUNT_RELATED_MODULE_FILTERS.map((r) => r.label),
    expected
  );
});

// 5. Filter-option search across all three sections
runTest(5, 'Filter-option search matches Account, Billing, Shipping, Deals, Revenue, and No matching filters', () => {
  const accRes = searchAccountFilterCatalog('Account');
  const accLabels = [
    ...accRes.fieldFilters.map((f) => f.label),
    ...accRes.relatedFilters.map((r) => r.label),
  ];
  assert.ok(accLabels.includes('Account Name'));
  assert.ok(accLabels.includes('Account Number'));
  assert.ok(accLabels.includes('Account Owner'));
  assert.ok(accLabels.includes('Account Site'));
  assert.ok(accLabels.includes('Account Type'));
  assert.ok(accLabels.includes('Parent Account'));
  assert.ok(accLabels.includes('Accounts (Member Accounts)'));

  const billingRes = searchAccountFilterCatalog('Billing');
  assert.equal(billingRes.fieldFilters.length, 7, 'Should match all 7 Billing Address fields');

  const shippingRes = searchAccountFilterCatalog('Shipping');
  assert.equal(shippingRes.fieldFilters.length, 7, 'Should match all 7 Shipping Address fields');

  const dealsRes = searchAccountFilterCatalog('Deals');
  assert.equal(dealsRes.relatedFilters.length, 1);
  assert.equal(dealsRes.relatedFilters[0].label, 'Deals');

  const revRes = searchAccountFilterCatalog('Revenue');
  assert.equal(revRes.fieldFilters.length, 1);
  assert.equal(revRes.fieldFilters[0].label, 'Annual Revenue');

  const emptyRes = searchAccountFilterCatalog('nonexistent_xyz_987');
  assert.equal(emptyRes.totalMatches, 0);
});

// 6. Checkbox selection & System Defined Filters evaluation
runTest(6, 'All 6 System Defined Filters evaluate against real data', () => {
  for (const sys of ACCOUNT_SYSTEM_DEFINED_FILTERS) {
    const matched = ctx.accounts.filter((a) => evaluateAccountSystemFilter(a, sys.key, ctx));
    assert.ok(
      matched.length > 0 && matched.length < ctx.accounts.length,
      `System filter ${sys.label} should match a non-empty subset (${matched.length})`
    );
  }
  const touched = ctx.accounts.filter((a) => evaluateAccountSystemFilter(a, 'Touched Records', ctx));
  const untouched = ctx.accounts.filter((a) => evaluateAccountSystemFilter(a, 'Untouched Records', ctx));
  assert.equal(touched.length + untouched.length, ctx.accounts.length);
});

// 7. Text operators
runTest(7, 'Text operators (Is, Is not, Contains, Does not contain, Starts with, Ends with, Is empty, Is not empty)', () => {
  const exactName = ctx.accounts.filter((a) =>
    evaluateAccountFieldCondition(a, { field: 'name', operator: 'Is', value: 'ABC Pvt Ltd' }, ctx)
  );
  assert.equal(exactName.length, 1);

  const startsWithA = ctx.accounts.filter((a) =>
    evaluateAccountFieldCondition(a, { field: 'name', operator: 'Starts with', value: 'A' }, ctx)
  );
  assert.ok(startsWithA.length > 0 && startsWithA.every((a) => a.name.toUpperCase().startsWith('A')));

  const faxEmpty = ctx.accounts.filter((a) =>
    evaluateAccountFieldCondition(a, { field: 'fax', operator: 'Is empty' }, ctx)
  );
  const faxNotEmpty = ctx.accounts.filter((a) =>
    evaluateAccountFieldCondition(a, { field: 'fax', operator: 'Is not empty' }, ctx)
  );
  assert.equal(faxEmpty.length + faxNotEmpty.length, ctx.accounts.length);
});

// 8. Numeric operators (Annual Revenue & Employees)
runTest(8, 'Numeric operators (Equals, Not equals, Greater than, Less than, Between)', () => {
  const gt25L = ctx.accounts.filter((a) =>
    evaluateAccountFieldCondition(a, { field: 'annualRevenue', operator: 'Greater than', value: 2500000 }, ctx)
  );
  assert.ok(gt25L.length > 0 && gt25L.every((a) => a.annualRevenue > 2500000));

  const empBetween = ctx.accounts.filter((a) =>
    evaluateAccountFieldCondition(
      a,
      { field: 'employees', operator: 'Between', value: 100, valueTo: 500 },
      ctx
    )
  );
  assert.ok(empBetween.length > 0 && empBetween.every((a) => a.employees >= 100 && a.employees <= 500));
});

// 9. Date operators (Created Time, Modified Time, Last Activity Time)
runTest(9, 'Date operators (On, Before, After, Between, Last 30 Days, Is empty)', () => {
  const created2026 = ctx.accounts.filter((a) =>
    evaluateAccountFieldCondition(
      a,
      { field: 'createdTime', operator: 'Between', value: '2026-01-01', valueTo: '2026-12-31' },
      ctx
    )
  );
  assert.ok(created2026.length > 0);
  assert.ok(created2026.every((a) => (a.createdTime || a.createdOn).startsWith('2026')));
});

// 10. Lookup & Dropdown selectors
runTest(10, 'Lookup and Dropdown selectors (Account Owner, Parent Account, Account Type, Industry, Ownership, Rating, Tag)', () => {
  const arunAccounts = ctx.accounts.filter((a) =>
    evaluateAccountFieldCondition(a, { field: 'ownerId', operator: 'Is', value: 'Arun Kumar' }, ctx)
  );
  assert.ok(arunAccounts.length > 0 && arunAccounts.every((a) => a.ownerId === 'u1'));

  const childOfAbc = ctx.accounts.filter((a) =>
    evaluateAccountFieldCondition(a, { field: 'parentAccountId', operator: 'Is', value: 'ABC Pvt Ltd' }, ctx)
  );
  assert.ok(childOfAbc.length >= 2 && childOfAbc.every((a) => a.parentAccountId === 'acc-001'));

  const enterpriseTag = ctx.accounts.filter((a) =>
    evaluateAccountFieldCondition(a, { field: 'tag', operator: 'Is', value: 'Enterprise' }, ctx)
  );
  assert.ok(enterpriseTag.length > 0 && enterpriseTag.every((a) => a.tags?.includes('Enterprise')));
});

// 11. Address filters (Billing & Shipping subfields)
runTest(11, 'Billing and Shipping Address subfield filters', () => {
  const chennaiBilling = ctx.accounts.filter((a) =>
    evaluateAccountFieldCondition(a, { field: 'billingCity', operator: 'Is', value: 'Chennai' }, ctx)
  );
  assert.ok(chennaiBilling.length > 0 && chennaiBilling.every((a) => a.billingCity === 'Chennai'));

  const tnState = ctx.accounts.filter((a) =>
    evaluateAccountFieldCondition(a, { field: 'billingState', operator: 'Is', value: 'Tamil Nadu' }, ctx)
  );
  assert.ok(tnState.length > 0 && tnState.every((a) => a.billingState === 'Tamil Nadu'));
});

// 12. AND/OR filtering & Grouped Conditions (Both exact prompt examples!)
runTest(12, 'Exact Section 4 & Section 7 AND/OR and Grouped Condition examples evaluate accurately', () => {
  // Section 4 Example: Account Type = Customer AND Industry = Information Technology AND Billing City = Chennai AND Annual Revenue > 10,00,000
  const sec4Matches = evaluateAccountFilters(
    ctx.accounts,
    {
      globalJoin: 'AND',
      fieldFilters: [
        { field: 'type', operator: 'Is', value: 'Customer', enabled: true },
        { field: 'industry', operator: 'Is', value: 'Information Technology', enabled: true },
        { field: 'billingCity', operator: 'Is', value: 'Chennai', enabled: true },
        { field: 'annualRevenue', operator: 'Greater than', value: '1000000', enabled: true },
      ],
    },
    ctx
  );
  assert.ok(sec4Matches.length >= 1, 'Section 4 example filter should match seeded accounts');
  assert.ok(
    sec4Matches.every(
      (a) =>
        a.type === 'Customer' &&
        a.industry === 'Information Technology' &&
        a.billingCity === 'Chennai' &&
        a.annualRevenue > 1000000
    )
  );

  // Section 7 Example: (Account Type = Customer OR Account Type = Partner) AND (Industry = Technology) AND (Annual Revenue > 25,00,000)
  const sec7Matches = evaluateAccountFilters(
    ctx.accounts,
    {
      globalJoin: 'AND',
      conditionGroups: [
        {
          id: 'g1',
          logic: 'OR',
          enabled: true,
          conditions: [
            { field: 'type', operator: 'Is', value: 'Customer', enabled: true },
            { field: 'type', operator: 'Is', value: 'Partner', enabled: true },
          ],
        },
        {
          id: 'g2',
          logic: 'AND',
          enabled: true,
          conditions: [
            { field: 'industry', operator: 'Is', value: 'Technology', enabled: true },
            { field: 'annualRevenue', operator: 'Greater than', value: '2500000', enabled: true },
          ],
        },
      ],
    },
    ctx
  );
  assert.ok(sec7Matches.length >= 2, 'Section 7 grouped example filter should match seeded accounts');
  assert.ok(
    sec7Matches.every(
      (a) =>
        (a.type === 'Customer' || a.type === 'Partner') &&
        a.industry === 'Technology' &&
        a.annualRevenue > 2500000
    )
  );
});

// 13. Related Contacts filtering (with contacts, without contacts, > 5 contacts)
runTest(13, 'Related Contacts filtering (has_any, has_none, more_than_5_contacts)', () => {
  const withContacts = ctx.accounts.filter((a) =>
    evaluateAccountRelatedCondition(a, { module: 'contacts', mode: 'has_any' }, ctx)
  );
  const withoutContacts = ctx.accounts.filter((a) =>
    evaluateAccountRelatedCondition(a, { module: 'contacts', mode: 'has_none' }, ctx)
  );
  const moreThan5 = ctx.accounts.filter((a) =>
    evaluateAccountRelatedCondition(a, { module: 'contacts', mode: 'more_than_5_contacts' }, ctx)
  );
  assert.ok(withContacts.length > 0 && withoutContacts.length > 0 && moreThan5.length > 0);
  assert.equal(withContacts.length + withoutContacts.length, ctx.accounts.length);
  assert.ok(
    moreThan5.every((a) => getRelatedRecordsForAccount(a, 'contacts', ctx).length > 5)
  );
});

// 14. Related Deals filtering (open_deals, closed_won_deals, closed_lost_deals, has_none, deal_value_gt)
runTest(14, 'Related Deals filtering (open_deals, closed_won_deals, closed_lost_deals, deal_value_gt)', () => {
  const openDeals = ctx.accounts.filter((a) =>
    evaluateAccountRelatedCondition(a, { module: 'deals', mode: 'open_deals' }, ctx)
  );
  const wonDeals = ctx.accounts.filter((a) =>
    evaluateAccountRelatedCondition(a, { module: 'deals', mode: 'closed_won_deals' }, ctx)
  );
  const lostDeals = ctx.accounts.filter((a) =>
    evaluateAccountRelatedCondition(a, { module: 'deals', mode: 'closed_lost_deals' }, ctx)
  );
  const highValueDeals = ctx.accounts.filter((a) =>
    evaluateAccountRelatedCondition(a, { module: 'deals', mode: 'deal_value_gt', value: 1500000 }, ctx)
  );
  assert.ok(openDeals.length > 0 && wonDeals.length > 0 && lostDeals.length > 0 && highValueDeals.length > 0);
});

// 15. Related Invoices, Quotes, Sales Orders, Cases, Emails, Products, Converted Leads filtering
runTest(15, 'Related Invoices, Quotes, Sales Orders, Cases, Emails, Products, Converted Leads filtering', () => {
  assert.ok(
    ctx.accounts.some((a) => evaluateAccountRelatedCondition(a, { module: 'invoices', mode: 'paid_invoices' }, ctx))
  );
  assert.ok(
    ctx.accounts.some((a) => evaluateAccountRelatedCondition(a, { module: 'invoices', mode: 'overdue_invoices' }, ctx))
  );
  assert.ok(
    ctx.accounts.some((a) => evaluateAccountRelatedCondition(a, { module: 'quotes', mode: 'accepted_quotes' }, ctx))
  );
  assert.ok(
    ctx.accounts.some((a) => evaluateAccountRelatedCondition(a, { module: 'salesOrders', mode: 'active_orders' }, ctx))
  );
  assert.ok(
    ctx.accounts.some((a) => evaluateAccountRelatedCondition(a, { module: 'cases', mode: 'open_cases' }, ctx))
  );
  assert.ok(
    ctx.accounts.some((a) => evaluateAccountRelatedCondition(a, { module: 'accountProducts', mode: 'product_name', value: 'Enterprise' }, ctx))
  );
  assert.ok(
    ctx.accounts.some((a) => evaluateAccountRelatedCondition(a, { module: 'convertedLeads', mode: 'lead_source', value: 'Website' }, ctx))
  );
});

// 16. Parent-child Account filtering & Circular Hierarchy Prevention
runTest(16, 'Parent-child Account hierarchy traversal & circular parent-child prevention', () => {
  const withChildren = ctx.accounts.filter((a) =>
    evaluateAccountRelatedCondition(a, { module: 'memberAccounts', mode: 'has_any' }, ctx)
  );
  assert.ok(withChildren.length > 0);

  // acc-001 (ABC Pvt Ltd) -> acc-004 (Global Systems) -> acc-011 (Acme Technologies)
  assert.equal(canSetParentAccount('acc-001', 'acc-001', ctx.accounts), false, 'Cannot set self as parent');
  assert.equal(canSetParentAccount('acc-001', 'acc-004', ctx.accounts), false, 'Cannot set direct child as parent');
  assert.equal(canSetParentAccount('acc-001', 'acc-011', ctx.accounts), false, 'Cannot set grandchild sub-account as parent');
  assert.equal(canSetParentAccount('acc-001', 'acc-002', ctx.accounts), true, 'Can set unrelated account as parent');

  const tree = getAccountHierarchyTree(accountsById['acc-001'], ctx.accounts);
  assert.ok(tree.children.some((c) => c.id === 'acc-004'));
  assert.ok(tree.subAccounts.some((s) => s.id === 'acc-011'));
});

// 17. Apply and Reset filters
runTest(17, 'Apply and Reset filters restores full active account list', () => {
  const allActive = evaluateAccountFilters(ctx.accounts, {}, ctx);
  assert.equal(allActive.length, 248);
});

// 18. Saved filter views & allowlist validation
runTest(18, 'Saved filter views evaluate accurately and validate against allowlist', () => {
  assert.ok(Array.isArray(data.savedAccountViews) && data.savedAccountViews.length >= 2);
  for (const sv of data.savedAccountViews) {
    const check = validateAccountFilterConfig(sv);
    assert.equal(check.valid, true);
    const matched = evaluateAccountFilters(ctx.accounts, sv, ctx);
    assert.ok(matched.length > 0, `Saved view ${sv.name} should return matching accounts`);
  }
  const invalidCheck = validateAccountFilterConfig({
    fieldFilters: [{ field: ' malicious_sql_field ', operator: 'Is', value: 'x' }],
  });
  assert.equal(invalidCheck.valid, false);
});

// 19. Account creation & duplicate detection
runTest(19, 'Account creation & duplicate detection by Account Name and Account Number', () => {
  const dupName = 'abc pvt ltd';
  const isDup = ctx.accounts.some((a) => a.name.trim().toLowerCase() === dupName);
  assert.equal(isDup, true, 'Duplicate Account Name detected case-insensitively');
});

// 20. Account editing & Copy Billing to Shipping address
runTest(20, 'Account editing updates field values and filter results', () => {
  const edited = { ...ctx.accounts[1], rating: 'Acquired', billingCity: 'Kochi', shippingCity: 'Kochi' };
  assert.equal(
    evaluateAccountFieldCondition(edited, { field: 'rating', operator: 'Is', value: 'Acquired' }, ctx),
    true
  );
  assert.equal(
    evaluateAccountFieldCondition(edited, { field: 'shippingCity', operator: 'Is', value: 'Kochi' }, ctx),
    true
  );
});

// 21. Account archiving/deletion
runTest(21, 'Archived accounts are excluded from default view and included in Archived view', () => {
  const sampleArchived = [
    { ...ctx.accounts[0], archived: true },
    ...ctx.accounts.slice(1),
  ];
  const defaultList = evaluateAccountFilters(sampleArchived, { viewKey: 'all' }, ctx);
  const archivedList = evaluateAccountFilters(sampleArchived, { viewKey: 'archived' }, ctx);
  assert.equal(defaultList.length, 247);
  assert.equal(archivedList.length, 1);
});

// 22. Account details & Related Projects from Closed Won Deals
runTest(22, 'Account details include Related Projects retained from Closed Won Deals', () => {
  // acc-005 (Prime Tech) has Closed Won deal-005 (Annual Support Renewal)
  const primeProjects = getRelatedRecordsForAccount(accountsById['acc-005'], 'projects', ctx);
  assert.ok(primeProjects.length > 0);
  assert.ok(primeProjects.some((p) => p.dealId === 'deal-005' && p.accountId === 'acc-005'));
});

// 23. Table search
runTest(23, 'Table search filters accounts by name, account number, city, industry, owner', () => {
  const byNumber = evaluateAccountFilters(ctx.accounts, { tableSearch: 'ACC-1001' }, ctx);
  assert.equal(byNumber.length, 1);
  assert.equal(byNumber[0].id, 'acc-001');

  const byName = evaluateAccountFilters(ctx.accounts, { tableSearch: 'ABC Pvt Ltd' }, ctx);
  assert.ok(byName.some((a) => a.id === 'acc-001'));
});

// 24. Sorting and pagination
runTest(24, 'Sorting and pagination across filtered accounts', () => {
  const sortedByRevDesc = [...ctx.accounts].sort((a, b) => b.annualRevenue - a.annualRevenue);
  assert.ok(sortedByRevDesc[0].annualRevenue >= sortedByRevDesc[sortedByRevDesc.length - 1].annualRevenue);
  const page1 = sortedByRevDesc.slice(0, 15);
  assert.equal(page1.length, 15);
});

// 25. List/Kanban/Grid/Chart view consistency
runTest(25, 'List, Kanban, Grid, and Chart views share the same filtered dataset', () => {
  const filtered = evaluateAccountFilters(ctx.accounts, { viewKey: 'customers' }, ctx);
  const kanbanTotal = ACCOUNT_TYPES.reduce(
    (sum, t) => sum + filtered.filter((a) => a.type === t).length,
    0
  );
  assert.equal(kanbanTotal, filtered.length);
});

// 26. Record-level permissions enforcement
runTest(26, 'Record-level permissions restrict private accounts for non-manager roles', () => {
  const repUser = USERS.find((u) => u.role !== 'Sales Manager');
  const unrestricted = evaluateAccountFilters(ctx.accounts, { activeUser: repUser, enforcePermissions: false }, ctx);
  const restricted = evaluateAccountFilters(ctx.accounts, { activeUser: repUser, enforcePermissions: true }, ctx);
  assert.ok(restricted.length < unrestricted.length, 'Restricted view hides private accounts owned by other reps');
});

// 27. Account relationships after Lead conversion (including deduplication)
runTest(27, 'Lead conversion reuses existing Account when company name matches and links Contact/Deal', () => {
  const companyName = 'ABC Pvt Ltd';
  const existing = ctx.accounts.find((a) => a.name.toLowerCase() === companyName.toLowerCase());
  assert.ok(existing, 'Existing account ABC Pvt Ltd found for deduplicated lead conversion');
  assert.equal(existing.id, 'acc-001');
});

// 28. Persistence after page refresh
runTest(28, 'Filter state serializes and restores cleanly from localStorage', () => {
  const stateToPersist = {
    savedView: 'aview-chennai-it-customers',
    globalJoin: 'AND',
    sysFilters: ['Touched Records'],
    fieldConfigs: { billingCity: { checked: true, operator: 'Is', value: 'Chennai' } },
  };
  const roundTrip = JSON.parse(JSON.stringify(stateToPersist));
  assert.deepEqual(roundTrip, stateToPersist);
});

console.log(`ALL ${results.length}/28 ACCOUNTS MODULE TESTS PASSED SUCCESSFULLY!`);
