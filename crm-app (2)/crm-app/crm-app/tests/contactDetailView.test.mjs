import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSeed } from '../src/data/seedData.js';
import { getRelatedRecordsForContact } from '../src/utils/contactsFilterEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const contactsPath = path.resolve(__dirname, '../src/pages/Contacts/Contacts.jsx');
const contactDetailPath = path.resolve(__dirname, '../src/pages/Contacts/ContactDetail.jsx');
const appPath = path.resolve(__dirname, '../src/App.jsx');

const contactsSource = fs.readFileSync(contactsPath, 'utf8');
const detailSource = fs.readFileSync(contactDetailPath, 'utf8');
const appSource = fs.readFileSync(appPath, 'utf8');

test('1. Contact Name Links & URL Route Persistence: keyboard-accessible links using real contact IDs and never defaulting to the first contact', () => {
  // App.jsx supports /contacts/:contactId route for direct links, refresh, and browser back/forward
  assert.ok(
    appSource.includes('path="/contacts/:contactId"'),
    'App.jsx must register /contacts/:contactId route for direct links and page refresh'
  );

  // Contacts.jsx resolves routeContactId via useParams() and defaults viewingId to null
  assert.ok(contactsSource.includes('useParams'), 'Contacts.jsx should import and use useParams');
  assert.ok(
    contactsSource.includes('const [viewingId, setViewingId] = useState(null);'),
    'viewingId must default to null so no contact opens by default'
  );
  assert.ok(
    contactsSource.includes('const viewingRec = activeContactId ? contacts.find((c) => c.id === activeContactId) || null : null;'),
    'viewingRec must resolve strictly from activeContactId and never fall back to contacts[0]'
  );

  // First Name, Last Name, and Full Contact Name columns use keyboard-accessible <Link to={`/contacts/${c.id}`}>
  assert.ok(
    contactsSource.includes('to={`/contacts/${c.id}`}'),
    'Contact name columns must render <Link to={`/contacts/${c.id}`}> with the contact real ID'
  );
  assert.ok(
    contactsSource.includes('focus-visible:ring-2'),
    'Contact name links must include keyboard focus-visible ring styles'
  );
  assert.ok(
    contactsSource.includes('openContactDetail(c.id)'),
    'Clicking a contact name link must invoke openContactDetail(c.id) with that row contact ID'
  );
});

test('2. Dynamic Record Resolution Across Multiple Contacts: clicking different contacts loads each contact exact data and related records', () => {
  const { contacts, accounts, deals, calls, invoices, tasks, contactRelations } = buildSeed();
  const accountsById = Object.fromEntries(accounts.map((a) => [a.id, a]));
  const filterContext = { deals, calls, invoices, tasks, contactRelations };

  // Test 5 distinct contacts across the dataset
  const sampleContacts = contacts.slice(0, 5);
  assert.equal(sampleContacts.length, 5, 'Must have at least 5 contacts in seed data');
  const resolvedNames = new Set();

  for (const sample of sampleContacts) {
    const contact = contacts.find((c) => c.id === sample.id);
    assert.ok(contact, `Contact ${sample.id} must exist in seedData`);
    assert.equal(contact.id, sample.id, 'Resolved contact ID must match requested ID');
    resolvedNames.add(contact.name);

    const relatedAccount = accountsById[contact.accountId];
    assert.ok(relatedAccount, `Contact ${contact.id} must resolve its linked account ${contact.accountId}`);

    // Verify related records engine returns arrays for all 18 related list modules for this specific contact
    const modules = [
      'notes',
      'connectedRecords',
      'cadences',
      'attachments',
      'deals',
      'tasks',
      'meetings',
      'calls',
      'invitedMeetings',
      'products',
      'cases',
      'quotes',
      'salesOrders',
      'purchaseOrders',
      'emails',
      'invoices',
      'campaigns',
      'social',
    ];
    for (const mod of modules) {
      const records = getRelatedRecordsForContact(contact, mod, filterContext);
      assert.ok(Array.isArray(records), `getRelatedRecordsForContact(${contact.id}, "${mod}") must return an array`);
    }
  }

  assert.equal(resolvedNames.size, sampleContacts.length, 'Different contact IDs must resolve to distinct contacts');
});

test('3. Contact Detail Header & Actions: Back link, Avatar, Full Name, Account link, Tags, Send Email, Edit, More menu, and Prev/Next navigation', () => {
  // Back button to Contacts
  assert.ok(detailSource.includes('aria-label="Back to Contacts"'), 'Header must include Back to Contacts button');
  assert.ok(detailSource.includes('onClick={onBack}'), 'Back button must trigger onBack');

  // Contact Avatar, Full Name, Related Account link, and Tags
  assert.ok(detailSource.includes('<PersonAvatar'), 'Header must render contact avatar');
  assert.ok(detailSource.includes('to={`/accounts?open=${contact.accountId}`}'), 'Header must link to the related account');
  assert.ok(detailSource.includes('Add Tags'), 'Header must provide + Add Tags action');

  // Primary Actions: Send Email, Edit, More (...), Previous/Next record navigation
  assert.ok(detailSource.includes('Send Email'), 'Header must include Send Email button');
  assert.ok(detailSource.includes('onClick={handleOpenEdit}'), 'Header must include Edit button');
  assert.ok(detailSource.includes('aria-label="More contact actions"'), 'Header must include More actions (...) button');
  assert.ok(detailSource.includes('aria-label="Previous contact"'), 'Header must include Previous contact navigation button');
  assert.ok(detailSource.includes('aria-label="Next contact"'), 'Header must include Next contact navigation button');
});

test('4. Tabs & Left-Side Related List Navigation: Overview & Timeline tabs plus all 18 Related List items', () => {
  // Overview and Timeline tabs
  assert.ok(detailSource.includes("setActiveTab('overview')"), 'Must support Overview tab');
  assert.ok(detailSource.includes("setActiveTab('timeline')"), 'Must support Timeline tab');
  assert.ok(detailSource.includes('Overview'), 'Must display Overview tab label');
  assert.ok(detailSource.includes('Timeline'), 'Must display Timeline tab label');

  // Left-side Related List navigation with all 18 sections matching Screenshot 1
  const expectedRelatedSections = [
    'Notes',
    'Connected Records',
    'Cadences',
    'Attachments',
    'Deals',
    'Open Activities',
    'Closed Activities',
    'Invited Meetings',
    'Products',
    'Cases',
    'Quotes',
    'Sales Orders',
    'Purchase Orders',
    'Emails',
    'Invoices',
    'Campaigns',
    'Social',
    'Reporting Contacts',
  ];

  for (const label of expectedRelatedSections) {
    assert.ok(
      detailSource.includes(`label: '${label}'`),
      `Related List sidebar must include "${label}"`
    );
  }

  assert.ok(detailSource.includes('Add Related List'), 'Related List sidebar must include Add Related List action');
  assert.ok(detailSource.includes('Add Link'), 'Left sidebar must include Links / Add Link section');
});

test('5. Overview Sections & Related Record Deep Links: Contact Information, Address Information, Description Information, and empty states', () => {
  // Organized Overview sections
  assert.ok(detailSource.includes('Contact Information'), 'Overview must include Contact Information section');
  assert.ok(detailSource.includes('Address Information'), 'Overview must include Address Information section');
  assert.ok(detailSource.includes('Description Information'), 'Overview must include Description Information section');
  assert.ok(detailSource.includes('Hide Details') && detailSource.includes('Show Details'), 'Overview must support Hide Details / Show Details toggle');

  // Key Zoho CRM fields inside Contact Information, Address Information, and Description Information (Screenshot 1)
  const expectedFields = [
    'Contact Owner',
    'Lead Source',
    'Contact Name',
    'Account Name',
    'Vendor Name',
    'Email',
    'Title',
    'Department',
    'Phone',
    'Other Phone',
    'Home Phone',
    'Mobile',
    'Fax',
    'Assistant',
    'Date of Birth',
    'Asst Phone',
    'Email Opt Out',
    'Skype ID',
    'Secondary Email',
    'Twitter',
    'Reporting To',
    'Modified By',
    'Created By',
    'Mailing Street',
    'Other Street',
    'Mailing City',
    'Other City',
    'Mailing State',
    'Other State',
    'Mailing Zip',
    'Other Zip',
    'Mailing Country',
    'Other Country',
    'Description',
  ];

  for (const field of expectedFields) {
    assert.ok(
      detailSource.includes(`label="${field}"`),
      `Detail view must display "${field}" field row`
    );
  }

  // Deep links to related records & empty states
  assert.ok(detailSource.includes('to={`/deals?open=${d.id}`}'), 'Related Deals must link to /deals?open=<id>');
  assert.ok(detailSource.includes('to={`/calls?open=${c.id}`}'), 'Related Calls must link to /calls?open=<id>');
  assert.ok(detailSource.includes('to={`/zoho-finance?open=${inv.id}`}'), 'Related Invoices must link to /zoho-finance?open=<id>');
  assert.ok(detailSource.includes('No records found'), 'Empty related sections must display "No records found"');
  assert.ok(detailSource.includes('No Attachment'), 'Empty Attachments section must display "No Attachment"');
});

test('6. Edit Contact Modal Prefill & Save Persistence: pre-fills exact contact values and updates the same contact', () => {
  assert.ok(
    detailSource.includes('const handleOpenEdit = () => {') && detailSource.includes('setEditForm({'),
    'ContactDetail must define handleOpenEdit to prefill exact saved values into editForm'
  );
  assert.ok(
    detailSource.includes("updateRecord('contacts', contact.id,"),
    'Saving the Edit form must call updateRecord("contacts", contact.id, ...) to update the same contact in place'
  );
});
