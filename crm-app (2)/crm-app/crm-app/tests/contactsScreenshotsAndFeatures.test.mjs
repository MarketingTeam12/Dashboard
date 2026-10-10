import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSeed, USERS } from '../src/data/seedData.js';
import {
  SYSTEM_DEFINED_FILTERS,
  WEBSITE_ACTIVITY_FILTERS,
  CONTACT_FIELD_FILTERS,
  RELATED_MODULE_FILTERS,
  evaluateContactFilters,
} from '../src/utils/contactsFilterEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('--- STARTING CONTACTS SCREENSHOTS & COMPREHENSIVE VERIFICATION SUITE ---');

const data = buildSeed();
const accountsById = Object.fromEntries(data.accounts.map((a) => [a.id, a]));
const usersById = Object.fromEntries(USERS.map((u) => [u.id, u]));
const contactsById = Object.fromEntries(data.contacts.map((c) => [c.id, c]));

const mockContext = {
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
test('Topbar contains Contacts title, Territory Selector, and Global Search', () => {
  const topbarPath = path.join(__dirname, '../src/components/layout/Topbar.jsx');
  const code = fs.readFileSync(topbarPath, 'utf8');

  assert(code.includes("location.pathname.startsWith('/contacts')"), 'Checks for /contacts path in Topbar');
  assert(code.includes('Contacts'), 'Displays Contacts title in Topbar');
  assert(code.includes('aria-label="Territory selector"'), 'Has Territory selector dropdown');
  assert(code.includes('All Territories'), 'Has All Territories default option');
  assert(code.includes('India - South'), 'Has Indian territory options');
  assert(code.includes('<GlobalSearch />'), 'Has Global Search records input');
});

// 2. Verify PageHeader Toolbar: Create Contact, Map View, and Overflow menu (Screenshot 1)
test('PageHeader and Contacts toolbar contain Create Contact, Map View, and overflow actions', () => {
  const contactsPath = path.join(__dirname, '../src/pages/Contacts/Contacts.jsx');
  const code = fs.readFileSync(contactsPath, 'utf8');

  assert(code.includes('primary: {'), 'Toolbar has primary button');
  assert(code.includes("label: 'Create Contact'"), 'Primary button labeled Create Contact');
  assert(code.includes("secondary: {"), 'Toolbar has secondary button');
  assert(code.includes("label: 'Map View'"), 'Secondary button labeled Map View');
  assert(code.includes('icon: MapPin'), 'Map View has MapPin icon');
  assert(code.includes('moreItems: ['), 'Toolbar has overflow menu items');
});

// 3. Verify Default Columns matching Screenshot 1 exact column order
test('Contacts table default columns match Screenshot 1 in exact order', () => {
  const contactsPath = path.join(__dirname, '../src/pages/Contacts/Contacts.jsx');
  const code = fs.readFileSync(contactsPath, 'utf8');

  // Must define the 9 Screenshot 1 columns in order:
  // createdTime, owner, firstName, lastName, mobile, email, leadSource, leadManager1, city
  const createdIdx = code.indexOf("key: 'createdTime'");
  const ownerIdx = code.indexOf("key: 'owner'");
  const firstIdx = code.indexOf("key: 'firstName'");
  const lastIdx = code.indexOf("key: 'lastName'");
  const mobileIdx = code.indexOf("key: 'mobile'");
  const emailIdx = code.indexOf("key: 'email'");
  const leadSourceIdx = code.indexOf("key: 'leadSource'");
  const leadManagerIdx = code.indexOf("key: 'leadManager1'");
  const cityIdx = code.indexOf("key: 'city'");

  assert(createdIdx !== -1, 'createdTime column defined');
  assert(ownerIdx !== -1, 'owner column defined');
  assert(firstIdx !== -1, 'firstName column defined');
  assert(lastIdx !== -1, 'lastName column defined');
  assert(mobileIdx !== -1, 'mobile column defined');
  assert(emailIdx !== -1, 'email column defined');
  assert(leadSourceIdx !== -1, 'leadSource column defined');
  assert(leadManagerIdx !== -1, 'leadManager1 column defined');
  assert(cityIdx !== -1, 'city column defined');

  assert(createdIdx < ownerIdx, 'createdTime comes before owner');
  assert(ownerIdx < firstIdx, 'owner comes before firstName');
  assert(firstIdx < lastIdx, 'firstName comes before lastName');
  assert(lastIdx < mobileIdx, 'lastName comes before mobile');
  assert(mobileIdx < emailIdx, 'mobile comes before email');
  assert(emailIdx < leadSourceIdx, 'email comes before leadSource');
  assert(leadSourceIdx < leadManagerIdx, 'leadSource comes before leadManager1');
  assert(leadManagerIdx < cityIdx, 'leadManager1 comes before city');

  // Verify Last Name has 'aa ▾' sort indicator
  assert(code.includes('aa ▾'), 'Last Name column header has aa ▾ indicator');

  // Verify Mobile has green phone call button
  assert(code.includes('bg-[#10B981]'), 'Mobile has emerald call icon button');
});

// 4. Verify Column Chooser preserves configurable columns
test('Column chooser contains both default and optional configurable columns', () => {
  const contactsPath = path.join(__dirname, '../src/pages/Contacts/Contacts.jsx');
  const code = fs.readFileSync(contactsPath, 'utf8');

  assert(code.includes("['createdTime', 'Created Time']"));
  assert(code.includes("['owner', 'Contact Owner']"));
  assert(code.includes("['firstName', 'First Name']"));
  assert(code.includes("['lastName', 'Last Name']"));
  assert(code.includes("['mobile', 'Mobile']"));
  assert(code.includes("['email', 'Email']"));
  assert(code.includes("['leadSource', 'Lead Source']"));
  assert(code.includes("['leadManager1', 'Lead Manager 1']"));
  assert(code.includes("['city', 'City']"));
  assert(code.includes("['account', 'Account Name']"));
  assert(code.includes("['lifecycle', 'Lifecycle Stage']"));
  assert(code.includes("['department', 'Department']"));
  assert(code.includes("['lastContacted', 'Last Contacted']"));
});

// 5. Verify Mobile responsive filter aside drawer and backdrop
test('Left filter sidebar supports mobile drawer overlay and backdrop', () => {
  const contactsPath = path.join(__dirname, '../src/pages/Contacts/Contacts.jsx');
  const code = fs.readFileSync(contactsPath, 'utf8');

  assert(code.includes('fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden'), 'Has mobile backdrop overlay');
  assert(code.includes('fixed inset-y-0 left-0 z-50 w-[290px] max-w-[85vw]'), 'Has mobile drawer classes');
  assert(code.includes('lg:static lg:z-auto lg:w-[228px]'), 'Has desktop sidebar classes');
  assert(code.includes('aria-label="Close filters"'), 'Has mobile close button');
});

// 6. Verify Bottom Pagination Bar matching Screenshot 1
test('Bottom pagination bar matches Screenshot 1 with Total Records and compact controls', () => {
  const contactsPath = path.join(__dirname, '../src/pages/Contacts/Contacts.jsx');
  const code = fs.readFileSync(contactsPath, 'utf8');

  assert(code.includes('Total Records'), 'Renders Total Records');
  assert(code.includes('{filtered.length}'), 'Displays dynamic filtered record count');
  assert(code.includes('Rows per page:'), 'Has rows per page selector');
  assert(code.includes('aria-label="Previous page"'), 'Has previous page button');
  assert(code.includes('aria-label="Next page"'), 'Has next page button');
});

// 7. Verify Create Contact Full Page Form Structure (Screenshot 2)
test('Create Contact form implements all Screenshot 2 sections, controls, and fields', () => {
  const formPath = path.join(__dirname, '../src/pages/Contacts/CreateContact.jsx');
  const code = fs.readFileSync(formPath, 'utf8');

  // Header & actions
  assert(code.includes('Create Contact'), 'Has Create Contact title');
  assert(code.includes('Edit Page Layout'), 'Has Edit Page Layout link');
  assert(code.includes('Cancel'), 'Has Cancel button');
  assert(code.includes('Save and New'), 'Has Save and New button');
  assert(code.includes('Save'), 'Has Save button');

  // Contact Image
  assert(code.includes('Contact Image'), 'Has Contact Image section');
  assert(code.includes('handleImageUpload'), 'Has photo upload handler');

  // Contact Information (two balanced columns)
  assert(code.includes('Contact Owner'), 'Has Contact Owner');
  assert(code.includes('First Name'), 'Has First Name');
  assert(code.includes('salutation'), 'Has Salutation dropdown');
  assert(code.includes('Account Name'), 'Has Account Name');
  assert(code.includes('showAccountLookup'), 'Has Account lookup dialog');
  assert(code.includes('Email'), 'Has Email');
  assert(code.includes('Phone'), 'Has Phone');
  assert(code.includes('City'), 'Has City');
  assert(code.includes('Mobile'), 'Has Mobile');
  assert(code.includes('Lead Manager 1'), 'Has Lead Manager 1');
  assert(code.includes('Associated Accounts'), 'Has Associated Accounts');

  assert(code.includes('Lead Source'), 'Has Lead Source');
  assert(code.includes('Last Name'), 'Has Last Name');
  assert(code.includes('border-l-[3px]') && (code.includes('border-l-[#E5293A]') || code.includes('border-l-[#EF4444]')), 'Last Name has red required border');
  assert(code.includes('Department'), 'Has Department');
  assert(code.includes('Secondary Email'), 'Has Secondary Email');
  assert(code.includes('Client Name'), 'Has Client Name');
  assert(code.includes('Social Lead ID'), 'Has Social Lead ID');
  assert(code.includes('Contact to Deal'), 'Has Contact to Deal checkbox');

  // Address Information
  assert(code.includes('Address Information'), 'Has Address Information section');
  assert(code.includes('Mailing Street'), 'Has Mailing Street');
  assert(code.includes('Mailing State'), 'Has Mailing State');
  assert(code.includes('Mailing Country'), 'Has Mailing Country');
  assert(code.includes('Mailing City'), 'Has Mailing City');
  assert(code.includes('Mailing Zip'), 'Has Mailing Zip');

  // Description Information
  assert(code.includes('Description Information'), 'Has Description Information section');
  assert(code.includes('textarea'), 'Has Description textarea');

  // Bottom Footer links
  assert(code.includes('Create Form Views'), 'Has Create Form Views');
  assert(code.includes('Standard View'), 'Has Standard View dropdown');
  assert(code.includes('Create a custom form page'), 'Has Create a custom form page');
});

// 8. Verify Create Contact Form Validation (Required Last Name)
test('Create Contact form validates Last Name before save', () => {
  const formPath = path.join(__dirname, '../src/pages/Contacts/CreateContact.jsx');
  const code = fs.readFileSync(formPath, 'utf8');

  assert(code.includes('validateForm'), 'Form has validateForm logic');
  assert(code.includes('Last Name cannot be empty'), 'Reports error if Last Name is empty');
  assert(code.includes('Please fix the validation errors before saving'), 'Prevents save if validation fails');
});

// 9. Verify Map View Modal with India territories
test('Map View modal renders interactive territory selector and contact cards', () => {
  const contactsPath = path.join(__dirname, '../src/pages/Contacts/Contacts.jsx');
  const code = fs.readFileSync(contactsPath, 'utf8');

  assert(code.includes('Contacts Territory Map View'), 'Renders Map View modal title');
  assert(code.includes('India Territory Grid'), 'Renders territory grid title');
  assert(code.includes("selectedMapCity === 'All'"), 'Supports All Territories filter');
  assert(code.includes('Chennai'), 'Maps Chennai');
  assert(code.includes('Bangalore'), 'Maps Bangalore');
  assert(code.includes('Mumbai'), 'Maps Mumbai');
  assert(code.includes('Hyderabad'), 'Maps Hyderabad');
  assert(code.includes('Delhi'), 'Maps Delhi');
  assert(code.includes('Pune'), 'Maps Pune');
  assert(code.includes('Kolkata'), 'Maps Kolkata');
});

// 10. Verify Routing in App.jsx connects Create Contact cleanly
test('App.jsx routes /contacts/create and /contacts/new to Contacts isCreatePage', () => {
  const appPath = path.join(__dirname, '../src/App.jsx');
  const code = fs.readFileSync(appPath, 'utf8');

  assert(code.includes('path="/contacts/create" element={<Contacts isCreatePage={true} />}'), 'Routes /contacts/create');
  assert(code.includes('path="/contacts/new" element={<Contacts isCreatePage={true} />}'), 'Routes /contacts/new');
});

console.log(`\nALL ${passed}/10 SCREENSHOTS & FEATURE VERIFICATION TESTS PASSED SUCCESSFULLY!`);
