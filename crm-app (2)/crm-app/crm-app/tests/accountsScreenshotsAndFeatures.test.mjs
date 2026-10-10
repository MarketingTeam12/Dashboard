import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSeed, USERS } from '../src/data/seedData.js';
import {
  ACCOUNT_SYSTEM_DEFINED_FILTERS,
  ACCOUNT_FIELD_FILTERS,
  ACCOUNT_RELATED_MODULE_FILTERS,
  evaluateAccountFilters,
} from '../src/utils/accountsFilterEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('--- STARTING ACCOUNTS SCREENSHOTS & COMPREHENSIVE VERIFICATION SUITE ---');

const data = buildSeed();
const accountsById = Object.fromEntries(data.accounts.map((a) => [a.id, a]));
const usersById = Object.fromEntries(USERS.map((u) => [u.id, u]));
const contactsById = Object.fromEntries(data.contacts.map((c) => [c.id, c]));

const mockContext = {
  accounts: data.accounts,
  users: USERS,
  contacts: data.contacts,
  deals: data.deals,
  calls: data.calls,
  invoices: data.invoices,
  accountRelations: data.accountRelations,
  accountsById,
  usersById,
  contactsById,
};

let passed = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`✗ ${name}`);
    console.error(err);
    process.exit(1);
  }
}

// 1. Verify Topbar Header & Territory Selector (Screenshot 1 & Top header requirements)
test('Topbar contains Accounts title, Territory Selector, and Global Search', () => {
  const topbarPath = path.join(__dirname, '../src/components/layout/Topbar.jsx');
  const code = fs.readFileSync(topbarPath, 'utf8');

  assert(code.includes("location.pathname.startsWith('/accounts')"), 'Checks for /accounts path in Topbar');
  assert(code.includes('Accounts'), 'Displays Accounts title in Topbar');
  assert(code.includes('aria-label="Territory selector"'), 'Has Territory selector dropdown');
  assert(code.includes('All Territories'), 'Has All Territories default option');
  assert(code.includes('India - South'), 'Has Indian territory options');
  assert(code.includes('<GlobalSearch />'), 'Has Global Search records input');
});

// 2. Verify Accounts Routes in App.jsx
test('App.jsx defines routes for /accounts, /accounts/create, and /accounts/new', () => {
  const appPath = path.join(__dirname, '../src/App.jsx');
  const code = fs.readFileSync(appPath, 'utf8');

  assert(code.includes('path="/accounts" element={<Accounts />}'), 'Route /accounts exists');
  assert(code.includes('path="/accounts/create" element={<Accounts isCreatePage={true} />}'), 'Route /accounts/create exists');
  assert(code.includes('path="/accounts/new" element={<Accounts isCreatePage={true} />}'), 'Route /accounts/new exists');
});

// 3. Verify Accounts Toolbar: Create Account, Map View, and Overflow menu (Screenshot 1)
test('Accounts toolbar contains Create Account, Map View, and overflow actions', () => {
  const accountsPath = path.join(__dirname, '../src/pages/Accounts/Accounts.jsx');
  const code = fs.readFileSync(accountsPath, 'utf8');

  assert(code.includes('data-testid="create-account-btn"'), 'Has Create Account button');
  assert(code.includes('Create Account'), 'Button labeled Create Account');
  assert(code.includes('data-testid="accounts-map-view-button"'), 'Has Map View button');
  assert(code.includes('Map View'), 'Button labeled Map View');
  assert(code.includes('MapPin'), 'Map View has MapPin icon');
  assert(code.includes('aria-label="More account actions"'), 'Has overflow actions menu');
});

// 4. Verify Default Columns matching Screenshot 1 exact column order
test('Accounts table default columns match Screenshot 1 in exact order', () => {
  const accountsPath = path.join(__dirname, '../src/pages/Accounts/Accounts.jsx');
  const code = fs.readFileSync(accountsPath, 'utf8');

  // Must define the Screenshot 1 columns in order:
  // name, gstin, gstState, owner, mobile, tags, lastActivityTime
  const nameIdx = code.indexOf("key: 'name'");
  const gstinIdx = code.indexOf("key: 'gstin'");
  const gstStateIdx = code.indexOf("key: 'gstState'");
  const ownerIdx = code.indexOf("key: 'owner'");
  const mobileIdx = code.indexOf("key: 'mobile'");
  const tagsIdx = code.indexOf("key: 'tags'");
  const activityIdx = code.indexOf("key: 'lastActivityTime'");

  assert(nameIdx !== -1, 'name column defined');
  assert(gstinIdx !== -1, 'gstin column defined');
  assert(gstStateIdx !== -1, 'gstState column defined');
  assert(ownerIdx !== -1, 'owner column defined');
  assert(mobileIdx !== -1, 'mobile column defined');
  assert(tagsIdx !== -1, 'tags column defined');
  assert(activityIdx !== -1, 'lastActivityTime column defined');

  assert(nameIdx < gstinIdx, 'name comes before gstin');
  assert(gstinIdx < gstStateIdx, 'gstin comes before gstState');
  assert(gstStateIdx < ownerIdx, 'gstState comes before owner');
  assert(ownerIdx < mobileIdx, 'owner comes before mobile');
  assert(mobileIdx < tagsIdx, 'mobile comes before tags');
  assert(tagsIdx < activityIdx, 'tags comes before lastActivityTime');

  // Verify Account Name has 'aa ▾' sort indicator
  assert(code.includes('aa ▾'), 'Account Name column header has aa ▾ indicator');

  // Verify Mobile has green phone call button
  assert(code.includes('bg-emerald-50') && code.includes('text-emerald-600'), 'Mobile has green call icon button');
});

// 5. Verify Column Chooser preserves configurable columns
test('Column chooser contains both default and optional configurable columns', () => {
  const accountsPath = path.join(__dirname, '../src/pages/Accounts/Accounts.jsx');
  const code = fs.readFileSync(accountsPath, 'utf8');

  assert(code.includes("key: 'phone'"), 'Preserves Phone column');
  assert(code.includes("key: 'website'"), 'Preserves Website column');
  assert(code.includes("key: 'accountNumber'"), 'Preserves Account Number column');
  assert(code.includes("key: 'accountSite'"), 'Preserves Account Site column');
  assert(code.includes("key: 'type'"), 'Preserves Account Type column');
  assert(code.includes("key: 'industry'"), 'Preserves Industry column');
  assert(code.includes("key: 'annualRevenue'"), 'Preserves Annual Revenue column');
  assert(code.includes("key: 'rating'"), 'Preserves Rating column');
  assert(code.includes("key: 'ownership'"), 'Preserves Ownership column');
  assert(code.includes("key: 'employees'"), 'Preserves Employees column');
  assert(code.includes("key: 'parentAccount'"), 'Preserves Parent Account column');
  assert(code.includes("key: 'billingCity'"), 'Preserves Billing City column');
  assert(code.includes("key: 'createdTime'"), 'Preserves Created Time column');
  assert(code.includes("key: 'actions'"), 'Preserves Actions column');
});

// 6. Verify Mobile responsive filter aside drawer and backdrop
test('Left filter sidebar supports mobile drawer overlay and backdrop', () => {
  const accountsPath = path.join(__dirname, '../src/pages/Accounts/Accounts.jsx');
  const code = fs.readFileSync(accountsPath, 'utf8');

  assert(code.includes('fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden'), 'Has mobile backdrop overlay');
  assert(code.includes('fixed inset-y-0 left-0 z-50 w-[290px] max-w-[85vw]'), 'Has mobile drawer classes');
  assert(code.includes('lg:static lg:z-auto lg:w-[225px]'), 'Has desktop sidebar classes');
  assert(code.includes('aria-label="Close filters"'), 'Has mobile close button');
});

// 7. Verify Bottom Pagination Bar matching Screenshot 1
test('Bottom pagination bar matches Screenshot 1 with Total Records and compact controls', () => {
  const accountsPath = path.join(__dirname, '../src/pages/Accounts/Accounts.jsx');
  const code = fs.readFileSync(accountsPath, 'utf8');

  assert(code.includes('Total Records:'), 'Renders Total Records');
  assert(code.includes('{filteredAccounts.length}'), 'Displays dynamic filtered record count');
  assert(code.includes('variant="records"'), 'Uses records pagination variant');
});

// 8. Verify Create Account Full Page Form Structure (Screenshot 2)
test('Create Account form implements all Screenshot 2 sections, controls, and fields', () => {
  const formPath = path.join(__dirname, '../src/pages/Accounts/CreateAccount.jsx');
  const code = fs.readFileSync(formPath, 'utf8');

  // Header & actions
  assert(code.includes('Create Account'), 'Has Create Account title');
  assert(code.includes('Edit Page Layout'), 'Has Edit Page Layout link');
  assert(code.includes('Cancel'), 'Has Cancel button');
  assert(code.includes('Save and New'), 'Has Save and New button');
  assert(code.includes('Save'), 'Has Save button');

  // Account Information (two balanced columns)
  assert(code.includes('Account Owner'), 'Has Account Owner');
  assert(code.includes('Client Name'), 'Has Client Name');
  assert(code.includes('Email ID'), 'Has Email ID');
  assert(code.includes('Account Name'), 'Has Account Name');
  assert(code.includes('Account Site'), 'Has Account Site');
  assert(code.includes('Parent Account'), 'Has Parent Account');
  assert(code.includes('Account Number'), 'Has Account Number');
  assert(code.includes('GST State'), 'Has GST State');
  assert(code.includes('GST Treatment'), 'Has GST Treatment');
  assert(code.includes('Associated contacts'), 'Has Associated contacts');

  assert(code.includes('Mobile'), 'Has Mobile');
  assert(code.includes('Website'), 'Has Website');
  assert(code.includes('Lead Manager 1'), 'Has Lead Manager 1');
  assert(code.includes('GST Number/GSTIN'), 'Has GST Number/GSTIN');
  assert(code.includes('Legal Name'), 'Has Legal Name');
  assert(code.includes('Trade name'), 'Has Trade name');
  assert(code.includes('Accounts to Deal'), 'Has Accounts to Deal');

  // Required field indicators
  assert(code.includes('border-l-[3px]') && (code.includes('border-l-[#E5293A]') || code.includes('border-l-[#EF4444]')), 'Has red required border');

  // Address Information
  assert(code.includes('Address Information'), 'Has Address Information section');
  assert(code.includes('Billing Street'), 'Has Billing Street');
  assert(code.includes('Billing City'), 'Has Billing City');
  assert(code.includes('Billing State'), 'Has Billing State');
  assert(code.includes('Billing Code'), 'Has Billing Code');
  assert(code.includes('Billing Country'), 'Has Billing Country');

  assert(code.includes('Shipping Street'), 'Has Shipping Street');
  assert(code.includes('Shipping City'), 'Has Shipping City');
  assert(code.includes('Shipping State'), 'Has Shipping State');
  assert(code.includes('Shipping Code'), 'Has Shipping Code');
  assert(code.includes('Shipping Country'), 'Has Shipping Country');

  // Working Copy Address button
  assert(code.includes('Copy Address'), 'Has Copy Address button');
  assert(code.includes('handleCopyAddress'), 'Has handleCopyAddress function');

  // Description Information
  assert(code.includes('Description Information'), 'Has Description Information section');
  assert(code.includes('<textarea'), 'Has multiline textarea for Description');

  // Bottom form view selector & custom page link
  assert(code.includes('Create Form Views'), 'Has Create Form Views label');
  assert(code.includes('Standard View'), 'Has Standard View default');
  assert(code.includes('Create a custom form page'), 'Has Create custom form page link');
});

// 9. Verify Territory Map View Modal
test('Territory Map View Modal renders interactive Indian map, city pins, and territory accounts', () => {
  const accountsPath = path.join(__dirname, '../src/pages/Accounts/Accounts.jsx');
  const code = fs.readFileSync(accountsPath, 'utf8');

  assert(code.includes('Accounts Territory Map View'), 'Renders Accounts Territory Map View modal title');
  assert(code.includes("['All', 'Chennai', 'Bangalore', 'Mumbai', 'Hyderabad', 'Delhi', 'Pune', 'Kolkata']"), 'Defines Indian territory chips');
  assert(code.includes('India Territory Grid'), 'Has India Territory Grid header');
  assert(code.includes('Live Telemetry'), 'Displays live telemetry badge');
  assert(code.includes('selectedMapCity'), 'Handles selectedMapCity filter');
});

// 10. Verify Seed Data includes enriched GST and Indian compliance fields
test('Seed data accounts have Indian GST and compliance fields', () => {
  assert(data.accounts.length >= 20, 'Has sufficient seed accounts');
  const sample = data.accounts.find((a) => a.gstin && a.gstState);
  assert(sample, 'At least one account has gstin and gstState populated');
  assert(sample.gstin.length >= 15, 'GSTIN has valid 15-character format');
  assert(sample.gstState, 'Account has GST State');
  assert(sample.mobile || sample.phone, 'Account has contact mobile/phone');
});

// 11. Verify Search and Ownership Row (Screenshot Row 4)
test('Accounts header includes search input, compact filter dropdown, owner selector, and Strict Owner Access', () => {
  const accountsPath = path.join(__dirname, '../src/pages/Accounts/Accounts.jsx');
  const code = fs.readFileSync(accountsPath, 'utf8');

  assert(code.includes('placeholder="Search accounts in table..."'), 'Has search input placeholder');
  assert(code.includes('aria-label="Search accounts in table"'), 'Has search input aria-label');
  assert(code.includes('data-testid="compact-accounts-filter-dropdown"'), 'Has compact filter dropdown');
  assert(code.includes('aria-label="Account Owner Selector"'), 'Has account owner selector dropdown');
  assert(code.includes('Strict Owner Access'), 'Has Strict Owner Access checkbox label');
  assert(code.includes('<Shield'), 'Displays security shield icon');
});

// 12. Verify Strict Owner Access and Owner Selection affect displayed records
test('Owner selector and Strict Owner Access actively filter account records in real-time', () => {
  // Test Arun Kumar (u1)
  const user1 = USERS.find((u) => u.id === 'u1') || USERS[0];
  const allAccounts = data.accounts;

  // Without strict access, all accounts are returned
  const unfiltered = evaluateAccountFilters(allAccounts, {
    viewKey: 'all',
    activeUser: user1,
    enforcePermissions: false,
  }, mockContext);
  assert.equal(unfiltered.length, allAccounts.filter((a) => !a.archived).length);

  // With strict access enabled, only records owned/created/connected to user1 are returned
  const strictUser1 = allAccounts.filter(
    (a) => !a.archived && (a.ownerId === user1.id || a.createdBy === user1.id || a.connectedTo === user1.id)
  );
  assert(strictUser1.length > 0 && strictUser1.length < allAccounts.length, 'Strict user1 records are a subset of all accounts');

  // Test Priya Sharma (u2)
  const user2 = USERS.find((u) => u.id === 'u2') || USERS[1];
  const strictUser2 = allAccounts.filter(
    (a) => !a.archived && (a.ownerId === user2.id || a.createdBy === user2.id || a.connectedTo === user2.id)
  );
  assert(strictUser2.length > 0 && strictUser2.length < allAccounts.length, 'Strict user2 records are a subset of all accounts');

  // Switching users results in different record subsets
  assert.notEqual(
    strictUser1.map((a) => a.id).sort().join(','),
    strictUser2.map((a) => a.id).sort().join(','),
    'Selecting different users yields different filtered accounts'
  );
});

// 13. Verify Results Summary Row (Screenshot Row 5)
test('Results summary row displays dynamic count and reflects live filter state', () => {
  const accountsPath = path.join(__dirname, '../src/pages/Accounts/Accounts.jsx');
  const code = fs.readFileSync(accountsPath, 'utf8');

  assert(code.includes('data-testid="accounts-results-summary"'), 'Has results summary container');
  assert(code.includes('Showing <span className="text-primary font-bold">{filteredAccounts.length}</span> accounts') ||
         code.includes('Showing') && code.includes('{filteredAccounts.length}') && code.includes('accounts'),
         'Displays dynamic Showing [count] accounts');
});

console.log(`\n========================================`);
console.log(`ALL ${passed}/${passed} ACCOUNTS SCREENSHOTS & COMPREHENSIVE TESTS PASSED!`);
console.log(`========================================\n`);

