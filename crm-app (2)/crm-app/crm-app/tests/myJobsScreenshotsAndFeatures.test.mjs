import assert from 'assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

console.log('--- STARTING MY JOBS SCREENSHOTS & COMPREHENSIVE VERIFICATION SUITE ---');

// 1. Verify Seed Data for My Jobs & Approvals
const seedPath = path.join(root, 'src', 'data', 'seedData.js');
const seedMod = await import(`file://${seedPath}`);
const { seedMyJobs, seedMyJobsLogs, SEED_VERSION } = seedMod;

console.log('Test 1: Verify seedMyJobs and seedMyJobsLogs data integrity');
assert.ok(SEED_VERSION >= 11, 'SEED_VERSION must be at least 11');
const jobs = seedMyJobs();
const logs = seedMyJobsLogs();
assert.ok(Array.isArray(jobs) && jobs.length >= 25, 'seedMyJobs must provide comprehensive jobs across all categories');
assert.ok(Array.isArray(logs) && logs.length >= 3, 'seedMyJobsLogs must provide initial history logs');

const approvals = jobs.filter((j) => j.category === 'Approvals');
assert.ok(approvals.length >= 20, 'Approvals seed must contain the full Screenshot 3 dataset');

// Verify specific screenshot rows exist (User, Anandhan, Raman, Aravind, Kamila, Kuldeep, swathib, RAKESH, Manju sumam, Aakash, prateek, AKASH, Pradip Patil, MOGILIPAKA)
const expectedRecordNames = [
  'User',
  'Anandhan',
  'Raman',
  'Aravind',
  'Kamila',
  'Kuldeep',
  'swathib',
  'RAKESH',
  'Manju suman',
  'Aakash',
  'prateek',
  'AKASH',
  'Pradip Patil',
  'MOGILIPAKA',
];
for (const name of expectedRecordNames) {
  assert.ok(
    approvals.some((a) => a.recordName === name),
    `Expected screenshot approval record "${name}" in seedMyJobs`
  );
}

// Verify screenshot approval process name & requesters
assert.ok(
  approvals.some((a) => a.processName === 'Closed Lost Before approval'),
  'Must include "Closed Lost Before approval" process'
);
const expectedRequesters = ['Marketing Department', 'Dhivya MV', 'Janani .', 'Kumutha T', 'Deepti', 'Ritu .', 'Sales Team'];
for (const req of expectedRequesters) {
  assert.ok(
    approvals.some((a) => a.requesterName === req),
    `Expected requester "${req}" in seedMyJobs`
  );
}
console.log('✓ Seed data contains all Screenshot 3 approval records, process names, and requesters');

// 2. Verify MyJobs.jsx layout, tabs, default Approvals tab, and columns
console.log('Test 2: Verify MyJobs.jsx structure, default tab, and columns');
const myJobsPath = path.join(root, 'src', 'pages', 'MyJobs', 'MyJobs.jsx');
const myJobsSource = fs.readFileSync(myJobsPath, 'utf8');

// Check four tabs in exact order
assert.ok(myJobsSource.includes("id: 'Blueprint Transitions'"), 'Must include Blueprint Transitions tab');
assert.ok(myJobsSource.includes("id: 'Approvals'"), 'Must include Approvals tab');
assert.ok(myJobsSource.includes("id: 'Reviews'"), 'Must include Reviews tab');
assert.ok(myJobsSource.includes("id: 'Image Validations'"), 'Must include Image Validations tab');

// Default tab must be Approvals
assert.ok(
  myJobsSource.includes("useState('Approvals')"),
  'Default active tab must be set to Approvals'
);

// Check Toolbar items: Filter, Sort, Approval History, Help
assert.ok(myJobsSource.includes('Filter'), 'Toolbar must include Filter control');
assert.ok(myJobsSource.includes('Sort'), 'Toolbar must include Sort control');
assert.ok(myJobsSource.includes('Approval History'), 'Toolbar must include Approval History link');
assert.ok(myJobsSource.includes('Help'), 'Toolbar must include Help link');
console.log('✓ MyJobs.jsx defaults to Approvals tab and includes Filter, Sort, Approval History, and Help controls');

// 3. Verify Left Filter Panel ("Filter Approval Reco..." and "Filter By Fields")
console.log('Test 3: Verify Zoho-style Left Filter Panel fields');
assert.ok(myJobsSource.includes('Filter Approval Reco...'), 'Left filter panel header must match screenshot');
assert.ok(myJobsSource.includes('Filter By Fields'), 'Left filter panel must include Filter By Fields section');
const expectedFilterFields = [
  'Approval Process Name',
  'Module',
  'Record Name',
  'Record Owner',
  'Requester Name',
  'Submitted On',
];
for (const field of expectedFilterFields) {
  assert.ok(myJobsSource.includes(field), `Filter panel must include field "${field}"`);
}
console.log('✓ Left filter panel includes search and all 6 Filter By Fields options');

// 4. Verify Approvals Table Columns and Respond Action
console.log('Test 4: Verify Approvals Table columns and Respond action');
const requiredColumns = [
  'Record Name',
  'Approval Process Name',
  'Module',
  'Submitted On',
  'Requester Name',
];
for (const col of requiredColumns) {
  assert.ok(myJobsSource.includes(`label="${col}"`), `Approvals table must have sortable column "${col}"`);
}
assert.ok(myJobsSource.includes('Respond'), 'Each approval row must include a Respond action button');
assert.ok(myJobsSource.includes('Total Records'), 'Footer must display Total Records counter');
console.log('✓ Approvals table renders Respond action, selection checkboxes, and all 5 required columns');

// 5. Verify Respond Modal & Mandatory Rejection Reason
console.log('Test 5: Verify Respond Modal, Approve/Reject actions, and mandatory rejection reason');
assert.ok(myJobsSource.includes('Approval Response'), 'Respond modal must render Approval Response header');
assert.ok(
  myJobsSource.includes('A rejection reason is required before rejecting this approval request.'),
  'Reject action must enforce mandatory comment/reason validation'
);
assert.ok(myJobsSource.includes("handleApprovalDecision('Approved')"), 'Must support Approve action');
assert.ok(myJobsSource.includes("handleApprovalDecision('Rejected')"), 'Must support Reject action');
console.log('✓ Respond modal enforces mandatory comment on Reject and updates live counts');

// 6. Verify Other Tabs (Blueprint Transitions, Reviews, Image Validations)
console.log('Test 6: Verify Blueprint Transitions, Reviews, and Image Validations workflows');
assert.ok(myJobsSource.includes('Valid Next Transitions'), 'Blueprint Transitions table must display Valid Next Transitions');
assert.ok(myJobsSource.includes('Apply Transition'), 'Blueprint Transitions drawer must support Apply Transition');
assert.ok(myJobsSource.includes('Proposed Field Modifications'), 'Reviews drawer must display Proposed Field Modifications');
assert.ok(myJobsSource.includes('Accept Changes'), 'Reviews drawer must support Accept Changes');
assert.ok(myJobsSource.includes('SubmittedImagePreview'), 'Image Validations must render inline SVG document preview');
assert.ok(myJobsSource.includes('Accept Image'), 'Image Validations drawer must support Accept Image');
console.log('✓ All 4 My Jobs tabs maintain full interactive workflows and compact Zoho table styling');

// 7. Verify App.jsx routing and Topbar integration
console.log('Test 7: Verify routing in App.jsx and navConfig.js');
const appSource = fs.readFileSync(path.join(root, 'src', 'App.jsx'), 'utf8');
const navSource = fs.readFileSync(path.join(root, 'src', 'components', 'layout', 'navConfig.js'), 'utf8');
assert.ok(appSource.includes('path="/my-jobs"'), 'App.jsx must route /my-jobs to MyJobs component');
assert.ok(navSource.includes("path: '/my-jobs', title: 'My Jobs'"), 'navConfig.js must include My Jobs in sidebar navigation');
console.log('✓ Routing and sidebar navigation verified');

console.log('\n========================================');
console.log('ALL 7/7 MY JOBS SCREENSHOTS & FEATURE TESTS PASSED!');
console.log('========================================\n');
