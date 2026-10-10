import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildSeed } from '../src/data/seedData.js';
import { getRelatedRecordsForAccount } from '../src/utils/accountsFilterEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const appSource = fs.readFileSync(path.join(rootDir, 'src/App.jsx'), 'utf8');
const accountsSource = fs.readFileSync(path.join(rootDir, 'src/pages/Accounts/Accounts.jsx'), 'utf8');
const accountDetailSource = fs.readFileSync(path.join(rootDir, 'src/pages/Accounts/AccountDetail.jsx'), 'utf8');

console.log('Running Account Name Click & Detail Page Verification Suite...\n');

// -----------------------------------------------------------------------------
// 1. Account Name Link & URL Route Persistence
// -----------------------------------------------------------------------------
console.log('1. Verifying keyboard-accessible Account Name link & URL route persistence...');

assert.ok(
  appSource.includes('<Route path="/accounts/:accountId" element={<Accounts />} />'),
  'App.jsx must register the /accounts/:accountId route for direct links, refresh, and browser back/forward'
);

assert.ok(
  accountsSource.includes('to={`/accounts/${a.id}`}') &&
    accountsSource.includes('onClick={() => openAccountDetail(a.id)}') &&
    accountsSource.includes('focus-visible:ring-2'),
  'Each Account Name in Accounts.jsx must be a keyboard-accessible <Link to={`/accounts/${a.id}`}> with focus ring'
);

assert.ok(
  accountsSource.includes("const { accountId: routeAccountId } = useParams();") &&
    accountsSource.includes("const activeAccountId = viewingId || routeAccountId || searchParams.get('open') || searchParams.get('id');") &&
    accountsSource.includes("if (!routeAccountId && !searchParams.get('open') && !searchParams.get('id')) {\n      setViewingId(null);\n    }"),
  'Accounts.jsx must sync viewingId with URL params (/accounts/:accountId, ?open=, ?id=) and never open the first account by default'
);

assert.ok(
  accountsSource.includes('<AccountDetail') &&
    accountsSource.includes('account={viewingAccount}') &&
    accountsSource.includes('accountsList={table.sorted}') &&
    accountsSource.includes('onBack={closeAccountDetail}') &&
    accountsSource.includes('onSelectAccount={openAccountDetail}'),
  'Accounts.jsx must render <AccountDetail /> with the selected viewingAccount and navigation handlers'
);
console.log('   ✓ Account Name links and URL route persistence verified.');

// -----------------------------------------------------------------------------
// 2. Dynamic Account Resolution & Related Lists across 5+ Real Accounts
// -----------------------------------------------------------------------------
console.log('2. Verifying dynamic account resolution and related lists across 5 real accounts...');

const seed = buildSeed();
assert.ok(seed.accounts.length >= 6, 'Seed dataset must contain multiple accounts');
const childAccount = seed.accounts.find((a) => Boolean(a.parentAccountId)) || seed.accounts[5];
const testAccounts = [...seed.accounts.slice(0, 5), childAccount];
const dataContext = {
  accounts: seed.accounts,
  contacts: seed.contacts,
  deals: seed.deals,
  invoices: seed.invoices,
  calls: seed.calls,
  accountRelations: seed.accountRelations,
};

for (const account of testAccounts) {
  assert.ok(account && account.id, 'Seed account must have a valid id');
  assert.ok(account.name && account.ownerId, `Account ${account.id} must have real name and ownerId`);

  const relatedDeals = getRelatedRecordsForAccount(account, 'deals', dataContext);
  const relatedContacts = getRelatedRecordsForAccount(account, 'contacts', dataContext);
  const relatedInvoices = getRelatedRecordsForAccount(account, 'invoices', dataContext);
  const relatedNotes = getRelatedRecordsForAccount(account, 'notes', dataContext);
  const relatedMemberAccounts = getRelatedRecordsForAccount(account, 'memberAccounts', dataContext);

  // Verify every returned deal & contact truly belongs to this account
  for (const d of relatedDeals) {
    assert.equal(d.accountId, account.id, `Deal ${d.id} must belong to account ${account.id}`);
  }
  for (const c of relatedContacts) {
    assert.equal(c.accountId, account.id, `Contact ${c.id} must belong to account ${account.id}`);
  }
  for (const inv of relatedInvoices) {
    assert.equal(inv.accountId, account.id, `Invoice ${inv.id} must belong to account ${account.id}`);
  }
  for (const child of relatedMemberAccounts) {
    assert.equal(child.parentAccountId, account.id, `Member account ${child.id} must have parentAccountId === ${account.id}`);
  }
  assert.ok(Array.isArray(relatedNotes), `Notes list for ${account.id} must be an array`);
}

// Verify different accounts have distinct IDs and names
const uniqueIds = new Set(seed.accounts.slice(0, 5).map((a) => a.id));
assert.equal(uniqueIds.size, 5, 'First 5 accounts must have distinct IDs');
console.log('   ✓ All 5 tested accounts resolve their exact record fields and isolated related lists.');

// -----------------------------------------------------------------------------
// 3. Zoho CRM Account Detail Header, Actions, Tabs & Related List Navigation
// -----------------------------------------------------------------------------
console.log('3. Verifying AccountDetail header, action buttons, Overview/Timeline tabs & Related List sidebar...');

const requiredTestIds = [
  'account-detail-page',
  'account-detail-back-btn',
  'account-detail-title',
  'account-detail-add-tags-btn',
  'account-detail-send-email-btn',
  'account-detail-edit-btn',
  'account-detail-whatsapp-btn',
  'account-detail-more-btn',
  'account-detail-prev-btn',
  'account-detail-next-btn',
  'account-detail-related-sidebar',
  'account-detail-tab-overview',
  'account-detail-tab-timeline',
  'account-detail-summary-card',
  'account-detail-highlights-card',
  'account-detail-toggle-details-btn',
  'account-detail-info-card',
];

for (const testId of requiredTestIds) {
  assert.ok(
    accountDetailSource.includes(`data-testid="${testId}"`),
    `AccountDetail.jsx must include data-testid="${testId}"`
  );
}

const expectedRelatedSections = [
  'Notes',
  'Connected Records',
  'Cadences',
  'Attachments',
  'Deals',
  'Contacts',
  'Open Activities',
  'Closed Activities',
  'Emails',
  'Products',
  'Cases',
  'Quotes',
  'Sales Orders',
  'Purchase Orders',
  'Invoices',
  'Campaigns',
  'Social',
  'Reporting Contacts',
  'Member Accounts',
  'Zoho Sign Documents',
  'Zoho Survey',
];

for (const label of expectedRelatedSections) {
  assert.ok(
    accountDetailSource.includes(`label: '${label}'`),
    `AccountDetail.jsx Related List navigation must include "${label}"`
  );
}
console.log('   ✓ Header actions, Overview/Timeline tabs, and all 21 Related List sections verified.');

// -----------------------------------------------------------------------------
// 4. Overview Sections: Account Info, Address Info, Description & Related Tables
// -----------------------------------------------------------------------------
console.log('4. Verifying Overview sections (Account Information, Address Information, Description, Deals & Contacts tables)...');

const requiredOverviewFields = [
  'Account Owner',
  'Account Name',
  'Client Name',
  'Account Site',
  'Parent Account',
  'Account Number',
  'Account Type',
  'Industry',
  'Annual Revenue',
  'Rating',
  'Phone',
  'Mobile',
  'Website',
  'Ticker Symbol',
  'Ownership',
  'Employees',
  'SIC Code',
  'GST Number/GSTIN',
  'GST State',
  'Legal Name',
  'Trade name',
  'Address Information',
  'Locate Map',
  'Billing Street',
  'Billing City',
  'Billing State',
  'Billing Code',
  'Billing Country',
  'Shipping Street',
  'Shipping City',
  'Shipping State',
  'Shipping Code',
  'Shipping Country',
  'Description Information',
];

for (const fieldLabel of requiredOverviewFields) {
  assert.ok(
    accountDetailSource.includes(fieldLabel),
    `AccountDetail.jsx Overview must display "${fieldLabel}"`
  );
}

// Deals table columns & link
const requiredDealColumns = [
  'Deal Name',
  'Amount',
  'Stage',
  'Probability (%)',
  'Closing Date',
  'Type',
  'Deal Owner',
  'New Deal',
];
for (const col of requiredDealColumns) {
  assert.ok(
    accountDetailSource.includes(col),
    `AccountDetail.jsx Deals section must include "${col}"`
  );
}
assert.ok(
  accountDetailSource.includes('to={`/deals?open=${d.id}`}'),
  'AccountDetail.jsx Deals table must link each deal name to `/deals?open=${d.id}`'
);

// Contacts table columns & link
const requiredContactColumns = [
  'Contact Name',
  'Email',
  'Phone',
  'Mobile',
  'Account Name',
  'New Contact',
  'Contact Roles',
];
for (const col of requiredContactColumns) {
  assert.ok(
    accountDetailSource.includes(col),
    `AccountDetail.jsx Contacts section must include "${col}"`
  );
}
assert.ok(
  accountDetailSource.includes('to={`/contacts/${c.id}`}'),
  'AccountDetail.jsx Contacts table must link each contact name to `/contacts/${c.id}`'
);

// Empty states
assert.ok(
  accountDetailSource.includes('No records found') && accountDetailSource.includes('No Attachment'),
  'AccountDetail.jsx must render clear empty states ("No records found", "No Attachment") when sections have no records'
);
console.log('   ✓ Overview field sections, Deals & Contacts tables, deep links, and empty states verified.');

// -----------------------------------------------------------------------------
// 5. Edit Prefill, Save Persistence & Lock / Permission Enforcement
// -----------------------------------------------------------------------------
console.log('5. Verifying Edit modal prefill, Save updateRecord persistence, and permission checks...');

assert.ok(
  accountDetailSource.includes('handleOpenEdit') &&
    accountDetailSource.includes('setEditForm({') &&
    accountDetailSource.includes("updateRecord('accounts', account.id,"),
  'AccountDetail.jsx Edit modal must prefill from the selected account and persist edits via updateRecord("accounts", account.id, ...)'
);

assert.ok(
  accountDetailSource.includes('account.locked') &&
    accountDetailSource.includes('enforcePermissions') &&
    accountDetailSource.includes('canModifyRecord'),
  'AccountDetail.jsx must respect account.locked and Strict Owner Access (enforcePermissions) when editing'
);
console.log('   ✓ Edit form prefill, save persistence, and permission checks verified.');

console.log('\nAll Account Name Click & Detail Page tests passed successfully!');

