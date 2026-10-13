import { STAGE_PROBABILITY, addDays } from '../utils/calculations';

// Deterministic PRNG so the demo data is identical on every machine.
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const SEED_VERSION = 4;

export const USERS = [
  { id: 'u1', name: 'Arun Kumar', role: 'Sales Manager', email: 'arun.kumar@crm.in', mobile: '+91 98401 23456', phone: '044-24567891', color: '#1262E0' },
  { id: 'u2', name: 'Divya R', role: 'Account Executive', email: 'divya.r@crm.in', mobile: '+91 98402 34567', phone: '044-24567892', color: '#D9468F' },
  { id: 'u3', name: 'Karthik S', role: 'Account Executive', email: 'karthik.s@crm.in', mobile: '+91 98403 45678', phone: '044-24567893', color: '#0E9F6E' },
  { id: 'u4', name: 'Ravi Kumar', role: 'Sales Executive', email: 'ravi.kumar@crm.in', mobile: '+91 98404 56789', phone: '044-24567894', color: '#B45309' },
  { id: 'u5', name: 'Sneha R', role: 'Sales Executive', email: 'sneha.r@crm.in', mobile: '+91 98405 67890', phone: '044-24567895', color: '#7C3AED' },
  { id: 'u6', name: 'Mohan Raj', role: 'Inside Sales', email: 'mohan.raj@crm.in', mobile: '+91 98406 78901', phone: '044-24567896', color: '#0F766E' },
  { id: 'u7', name: 'Prasanna', role: 'Lead Manager', email: 'prasanna@crm.in', mobile: '+91 98407 89012', phone: '044-24567897', color: '#0284C7' },
  { id: 'u-mkt', name: 'Marketing Department', role: 'Lead Generation & Inbound', email: 'marketing@crm.in', mobile: '+91 98400 11223', phone: '044-24567800', color: '#0284C7' },
];

export const ACCOUNT_TYPES = ['Customer', 'Prospect', 'Partner', 'Vendor'];
export const ACCOUNT_STATUSES = ['Active', 'Inactive', 'New'];
export const INDUSTRIES = ['IT Services', 'Software', 'Technology', 'Consulting', 'Manufacturing', 'Construction', 'Finance', 'Healthcare', 'Retail', 'Logistics', 'Education', 'Textiles'];
export const LOCATIONS = ['Chennai', 'Bangalore', 'Hyderabad', 'Mumbai', 'Pune', 'Delhi', 'Kochi', 'Coimbatore', 'Ahmedabad', 'Kolkata'];
export const LIFECYCLES = ['New', 'Contacted', 'Engaged', 'Qualified', 'Customer'];
export const LEAD_SOURCES = ['Website', 'LinkedIn', 'Cold Call', 'Conference', 'Referral', 'Trade Show', 'Internal'];
export const DEAL_SOURCES = ['Website', 'Referral', 'Cold Call', 'Email', 'Partner'];
export const DEPARTMENTS = ['Enterprise Sales', 'SMB Sales', 'Inside Sales', 'Partnerships'];
export const CALL_TYPES = ['Outbound', 'Inbound'];
export const CALL_STATUSES = ['Completed', 'Missed', 'Busy', 'Scheduled'];
export const INVOICE_TYPES = ['Sales Invoice', 'Recurring Invoice', 'Credit Note', 'Debit Note'];
export const INVOICE_STATUSES = ['Paid', 'Pending', 'Overdue', 'Partially Paid'];
export const AVATAR_COLORS = ['#1F6FEB', '#A238D6', '#FF7A2F', '#0B3D91', '#13B39A', '#F0453A', '#8B3DF0', '#18A957', '#2D7FF9', '#FF8A1F'];

const FIRST = ['Aarav', 'Aditi', 'Ajay', 'Akhil', 'Ananya', 'Arjun', 'Bhavna', 'Deepa', 'Ganesh', 'Harini', 'Ishaan', 'Janani', 'Kavya', 'Kiran', 'Lokesh', 'Madhu', 'Naveen', 'Nisha', 'Pooja', 'Pranav', 'Rahul', 'Ramesh', 'Rohit', 'Sanjay', 'Shruti', 'Swathi', 'Tarun', 'Uma', 'Varun', 'Yamini', 'Gokul', 'Hema', 'Nikhil', 'Revathi', 'Sameer', 'Keerthi'];
const LAST = ['Iyer', 'Menon', 'Nair', 'Reddy', 'Sharma', 'Rao', 'Pillai', 'Patel', 'Gupta', 'Krishnan', 'Joshi', 'Verma', 'Bhat', 'Das', 'Mehta', 'Subramanian', 'Kapoor', 'Chandran'];
const DESIGNATIONS = ['Marketing Manager', 'Sales Executive', 'Project Manager', 'Business Analyst', 'IT Manager', 'Finance Manager', 'Product Manager', 'CTO', 'Operations Head', 'Founder', 'Procurement Lead', 'HR Manager', 'CEO', 'Engineering Lead'];
const DEPTS = ['Marketing', 'Sales', 'IT', 'Finance', 'Operations', 'Management', 'Procurement', 'HR'];
const PREFIX = ['Apex', 'Blue', 'Crest', 'Delta', 'Elite', 'Fusion', 'Horizon', 'Infinity', 'Kite', 'Lotus', 'Matrix', 'Nova', 'Orbit', 'Pinnacle', 'Quantum', 'Radiant', 'Sapphire', 'Titan', 'Unity', 'Wave', 'Aurora', 'Cedar', 'Everest', 'Falcon', 'Indigo', 'Jade', 'Maple', 'Silverline', 'Sunrise', 'Trident'];
const SUFFIX = ['Technologies', 'Systems', 'Industries', 'Labs', 'Enterprises', 'Networks', 'Digital', 'Infotech', 'Logistics', 'Pharma', 'Retail', 'Foods', 'Motors', 'Energy', 'Consulting', 'Analytics', 'Softworks', 'Ventures'];
const DEAL_TEMPLATES = ['ERP Integration', 'Website Revamp', 'Mobile App Build', 'Analytics Dashboard', 'Network Upgrade', 'License Expansion', 'Managed Services', 'Payroll Automation', 'Helpdesk Rollout', 'Compliance Review', 'Cloud Backup', 'CRM Customisation', 'Data Warehouse', 'Cybersecurity Suite', 'Annual Maintenance'];
const CALL_SUBJECTS = [
  ['Product Demo Call', 'Walked through the product demo and key features.'],
  ['Follow up Call', 'Checked on open questions from the last meeting.'],
  ['Deal Estimation accepted- Invoice Need Call', 'Discussed pricing and contract terms.'],
  ['Support Call', 'Resolved a configuration issue.'],
  ['New Business Call', 'Explored a new partnership opportunity.'],
  ['Requirement Discussion', 'Captured requirements and next steps.'],
  ['Quote Discussion', 'Customer asked for a revised quote.'],
  ['Onboarding Call', 'Walked through the onboarding plan.'],
  ['Feedback Call', 'Collected feedback on the pilot.'],
  ['Contract Review Call', 'Reviewed contract details and clauses.'],
  ['Renewal Discussion', 'Discussed renewal timelines.'],
  ['Pricing Clarification', 'Clarified tiered pricing.'],
];

const iso = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const domainOf = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 14) + '.in';

export function buildSeed() {
  const rnd = mulberry32(20261009);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const weighted = (pairs) => {
    const total = pairs.reduce((s, p) => s + p[1], 0);
    let r = rnd() * total;
    for (const [v, w] of pairs) {
      if ((r -= w) <= 0) return v;
    }
    return pairs[0][0];
  };
  const dateBetween = (from, to) => {
    const a = new Date(from + 'T00:00:00').getTime();
    const b = new Date(to + 'T00:00:00').getTime();
    const d = new Date(a + rnd() * (b - a));
    return iso(d.getFullYear(), d.getMonth() + 1, d.getDate());
  };

  // ---------------- Accounts ----------------
  const namedAccounts = [
    ['ABC Pvt Ltd', 'Customer', 'IT Services', 'Chennai', 52000000, 'Active', 'u1', '2026-09-01'],
    ['XYZ Solutions', 'Prospect', 'Software', 'Bangalore', 38000000, 'Active', 'u2', '2026-09-04'],
    ['Tech Corp', 'Customer', 'Technology', 'Hyderabad', 41000000, 'Active', 'u3', '2026-09-08'],
    ['Global Systems', 'Partner', 'IT Services', 'Chennai', 29000000, 'Active', 'u1', '2026-09-10'],
    ['Prime Tech', 'Customer', 'Consulting', 'Mumbai', 65000000, 'Active', 'u2', '2026-09-12'],
    ['Bright Future', 'Prospect', 'IT Services', 'Bangalore', 18000000, 'Inactive', 'u4', '2026-09-15'],
    ['NextGen Solutions', 'Customer', 'Software', 'Pune', 47500000, 'Active', 'u5', '2026-09-18'],
    ['Vision Corp', 'Prospect', 'Manufacturing', 'Chennai', 12000000, 'Inactive', 'u6', '2026-09-20'],
    ['Innovate Tech', 'Customer', 'Technology', 'Hyderabad', 34000000, 'Active', 'u1', '2026-09-25'],
    ['Skyline Solutions', 'Partner', 'Construction', 'Mumbai', 21000000, 'Active', 'u2', '2026-09-28'],
    ['Acme Technologies', 'Customer', 'Technology', 'Chennai', 26000000, 'Active', 'u1', '2026-03-14'],
    ['Zenith Textiles', 'Customer', 'Textiles', 'Coimbatore', 15000000, 'Active', 'u3', '2026-02-21'],
    ['Innovate Labs', 'Prospect', 'Software', 'Bangalore', 9000000, 'Active', 'u1', '2026-04-02'],
    ['Vertex Global', 'Customer', 'Finance', 'Mumbai', 72000000, 'Active', 'u2', '2026-01-18'],
    ['PeoplePlus', 'Partner', 'Consulting', 'Pune', 11000000, 'Active', 'u5', '2026-05-09'],
    ['DataSense Inc', 'Prospect', 'Software', 'Hyderabad', 14000000, 'Active', 'u4', '2026-06-11'],
    ['CloudNet Solutions', 'Customer', 'IT Services', 'Bangalore', 33000000, 'Active', 'u6', '2026-07-23'],
    ['GreenLeaf Tech', 'Customer', 'Technology', 'Kochi', 8000000, 'Active', 'u2', '2026-08-05'],
  ];
  const accounts = namedAccounts.map(([name, type, industry, location, annualRevenue, status, ownerId, createdOn], i) => ({
    id: `acc-${String(i + 1).padStart(3, '0')}`,
    name, type, industry, location, annualRevenue, status, ownerId, createdOn,
    website: `www.${domainOf(name)}`, phone: `+91 44 ${int(2000, 9999)} ${int(1000, 9999)}`,
    description: '', color: AVATAR_COLORS[i % AVATAR_COLORS.length],
  }));
  const used = new Set(accounts.map((a) => a.name));
  const genNames = [];
  for (const p of shuffle(PREFIX)) for (const s of shuffle(SUFFIX)) {
    const n = `${p} ${s}`;
    if (!used.has(n)) genNames.push(n);
  }
  // Status pool so totals match the dashboard: 198 Active, 28 Inactive, 22 New of 248
  const remaining = 248 - accounts.length;
  const statusPool = shuffle([
    ...Array(198 - 16).fill('Active'),
    ...Array(28 - 2).fill('Inactive'),
    ...Array(22).fill('New'),
  ]).slice(0, remaining);
  for (let i = 0; i < remaining; i++) {
    const status = statusPool[i];
    const createdOn = status === 'New' ? dateBetween('2026-09-10', '2026-10-08') : dateBetween('2025-04-01', '2026-08-30');
    accounts.push({
      id: `acc-${String(accounts.length + 1).padStart(3, '0')}`,
      name: genNames[i], type: weighted([['Customer', 5], ['Prospect', 3], ['Partner', 1.5], ['Vendor', 1]]),
      industry: pick(INDUSTRIES), location: pick(LOCATIONS), annualRevenue: int(5, 80) * 1000000, status,
      ownerId: pick(USERS).id, createdOn, website: `www.${domainOf(genNames[i])}`,
      phone: `+91 80 ${int(2000, 9999)} ${int(1000, 9999)}`, description: '', color: AVATAR_COLORS[(accounts.length) % AVATAR_COLORS.length],
    });
  }
  const accByName = Object.fromEntries(accounts.map((a) => [a.name, a]));

  // ---------------- Contacts ----------------
  const namedContacts = [
    ['Priya Sharma', 'Marketing Manager', 'Acme Technologies', 'priya.sharma@acmetech.in', '+91 98765 43210', 'New', 'Website', 'u1', '2026-10-10', '2026-10-07'],
    ['Rahul Menon', 'Sales Executive', 'Zenith Textiles', 'rahul.menon@zenith.in', '+91 98765 67890', 'Contacted', 'LinkedIn', 'u2', '2026-10-08', '2026-10-09'],
    ['Karthik Raja', 'Project Manager', 'Innovate Labs', 'karthik.raja@innovatelabs.in', '+91 98765 22334', 'Engaged', 'Cold Call', 'u1', '2026-10-10', 'today'],
    ['Divya Nair', 'Business Analyst', 'NextGen Solutions', 'divya.nair@nextgen.in', '+91 98765 77665', 'Qualified', 'Website', 'u2', '2026-10-12', '2026-10-09'],
    ['Suresh Babu', 'IT Manager', 'Global Systems', 'suresh.babu@globalsys.in', '+91 98450 11223', 'Customer', 'Conference', 'u1', '2026-10-09', '2026-10-06'],
    ['Meera Iyer', 'Finance Manager', 'Vertex Global', 'meera.iyer@vertexglobal.in', '+91 98987 66543', 'Qualified', 'Referral', 'u2', '2026-10-11', '2026-10-09'],
    ['Arjun Nair', 'Product Manager', 'PeoplePlus', 'arjun.nair@peopleplus.in', '+91 98760 99876', 'Engaged', 'Trade Show', 'u1', '2026-10-08', '2026-10-05'],
    ['Vikram Patel', 'CTO', 'DataSense Inc', 'vikram.patel@datasense.in', '+91 97654 33221', 'Contacted', 'Internal', 'u1', '2026-10-05', ''],
    ['Anitha M', 'Operations Head', 'CloudNet Solutions', 'anitha.m@cloudnet.in', '+91 98760 33445', 'New', 'Referral', 'u2', '2026-10-06', ''],
    ['Lakshmi Menon', 'Founder', 'GreenLeaf Tech', 'lakshmi.m@greenleaf.in', '+91 98451 66789', 'Customer', 'Conference', 'u1', '2026-10-14', ''],
    ['Ravi Sharma', 'IT Director', 'ABC Pvt Ltd', 'ravi.sharma@abcpvt.in', '+91 98400 12345', 'Customer', 'Referral', 'u1', '2026-10-10', ''],
    ['Priya Singh', 'Procurement Lead', 'XYZ Solutions', 'priya.singh@xyzsol.in', '+91 98401 23456', 'Qualified', 'Website', 'u2', '2026-10-10', ''],
    ['Amit Kumar', 'CEO', 'Tech Corp', 'amit.kumar@techcorp.in', '+91 98402 34567', 'Engaged', 'LinkedIn', 'u3', '2026-10-09', ''],
    ['Sneha R', 'Operations Manager', 'Global Systems', 'sneha.r@globalsys.in', '+91 98403 45678', 'Contacted', 'Cold Call', 'u3', '2026-10-09', ''],
    ['Mohit Kapoor', 'Finance Head', 'Prime Tech', 'mohit.kapoor@primetech.in', '+91 98404 56789', 'Customer', 'Conference', 'u2', '2026-10-08', ''],
    ['Anitha N', 'Admin Manager', 'Bright Future', 'anitha.n@brightfuture.in', '+91 98405 67890', 'Engaged', 'Website', 'u4', '2026-10-08', ''],
    ['Vikram K', 'Security Lead', 'NextGen Solutions', 'vikram.k@nextgen.in', '+91 98406 78901', 'Qualified', 'Referral', 'u1', '2026-10-07', ''],
    ['Lakshmi R', 'Data Manager', 'Vision Corp', 'lakshmi.r@visioncorp.in', '+91 98407 89012', 'Engaged', 'Trade Show', 'u5', '2026-10-07', ''],
    ['Deepak G', 'HR Manager', 'Innovate Tech', 'deepak.g@innovatetech.in', '+91 98408 90123', 'Contacted', 'LinkedIn', 'u6', '2026-10-06', ''],
    ['Suresh P', 'Engineering Lead', 'Skyline Solutions', 'suresh.p@skyline.in', '+91 98409 01234', 'Customer', 'Website', 'u2', '2026-10-06', ''],
  ];
  const contacts = namedContacts.map(([name, designation, accName, email, phone, lifecycle, leadSource, ownerId, lastContacted, followUp], i) => ({
    id: `con-${String(i + 1).padStart(3, '0')}`,
    name, designation, accountId: accByName[accName].id, email, phone, lifecycle, leadSource, ownerId, lastContacted,
    followUp: followUp === 'today' ? '__today__' : followUp, department: pick(DEPTS), assistant: '', asstPhone: '',
    fax: '', emailOptOut: false, emailStatus: pick(['Opened', 'Delivered', 'Clicked', 'Bounced']),
    locked: i === 4, touched: false, createdOn: dateBetween('2026-01-05', '2026-09-30'),
  }));
  const contactNames = new Set(contacts.map((c) => c.name));
  while (contacts.length < 220) {
    const name = `${pick(FIRST)} ${pick(LAST)}`;
    if (contactNames.has(name)) continue;
    contactNames.add(name);
    const acc = rnd() < 0.42 ? accounts[int(0, 9)] : accounts[int(10, 90)];
    const [f, l] = name.toLowerCase().split(' ');
    contacts.push({
      id: `con-${String(contacts.length + 1).padStart(3, '0')}`,
      name, designation: pick(DESIGNATIONS), accountId: acc.id, email: `${f}.${l}@${domainOf(acc.name)}`,
      phone: `+91 9${int(7000, 8999)} ${int(10000, 99999)}`, lifecycle: pick(LIFECYCLES), leadSource: pick(LEAD_SOURCES),
      ownerId: pick(USERS).id, lastContacted: dateBetween('2026-08-15', '2026-10-08'),
      followUp: rnd() < 0.25 ? dateBetween('2026-10-01', '2026-10-20') : '', department: pick(DEPTS),
      assistant: rnd() < 0.2 ? `${pick(FIRST)} ${pick(LAST)}` : '', asstPhone: '', fax: '', emailOptOut: rnd() < 0.08,
      emailStatus: pick(['Opened', 'Delivered', 'Clicked', 'Bounced']), locked: rnd() < 0.04, touched: false,
      createdOn: dateBetween('2025-06-01', '2026-10-01'),
    });
  }
  const conByName = Object.fromEntries(contacts.map((c) => [c.name, c]));

  // ---------------- Deals ----------------
  const namedDeals = [
    ['Enterprise CRM Setup', 'ABC Pvt Ltd', 'Ravi Sharma', 'Need Deal Estimation', 1250000, '2026-10-10', 20, 'u1', '2026-09-01'],
    ['Cloud Migration Project', 'XYZ Solutions', 'Priya Singh', 'Deal Estimation Ready', 875000, '2026-10-15', 40, 'u2', '2026-09-05'],
    ['IT Infrastructure Upgrade', 'Tech Corp', 'Amit Kumar', 'Deal Estimation sent to Client', 2500000, '2026-10-20', 60, 'u3', '2026-09-08'],
    ['Consulting Services', 'Global Systems', 'Sneha R', 'Deal Estimation accepted- Invoice Need', 1840000, '2026-10-25', 80, 'u1', '2026-09-10'],
    ['Annual Support Renewal', 'Prime Tech', 'Mohit Kapoor', 'Deal Closed (Won)', 3000000, '2026-10-30', 100, 'u2', '2026-09-12'],
    ['New Branch Setup', 'Bright Future', 'Anitha N', 'Deal Estimation Ready', 980000, '2026-11-05', 40, 'u4', '2026-09-15'],
    ['Security Audit Project', 'NextGen Solutions', 'Vikram K', 'Deal Estimation sent to Client', 1460000, '2026-11-10', 60, 'u5', '2026-09-18'],
    ['Data Migration', 'Vision Corp', 'Lakshmi R', 'Deal Estimation accepted- Invoice Need', 2850000, '2026-11-18', 75, 'u6', '2026-09-20'],
    ['Training & Onboarding', 'Innovate Tech', 'Deepak G', 'Need Deal Estimation', 675000, '2026-11-22', 25, 'u1', '2026-09-25'],
    ['Custom Development', 'Skyline Solutions', 'Suresh P', 'Deal Closed (Won)', 1620000, '2026-11-30', 100, 'u2', '2026-09-28'],
  ];
  const sourceW = [['Website', 32], ['Referral', 24], ['Cold Call', 18], ['Email', 15], ['Partner', 11]];
  const deals = namedDeals.map(([name, accName, conName, stage, amount, closingDate, probability, ownerId, createdOn], i) => ({
    id: `deal-${String(i + 1).padStart(3, '0')}`,
    name, accountId: accByName[accName].id, contactId: conByName[conName].id, stage, amount, closingDate, probability, ownerId,
    createdOn, source: weighted(sourceW), department: pick(DEPARTMENTS), lostAtStage: '', description: '',
  }));
  const stagePool = shuffle([
    ...Array(38).fill('Need Deal Estimation'), ...Array(43).fill('Deal Estimation Ready'), ...Array(48).fill('Deal Estimation sent to Client'),
    ...Array(31).fill('Deal Estimation accepted- Invoice Need'), ...Array(96).fill('Deal Closed (Won)'), ...Array(76).fill('Closed Lost'),
  ]);
  stagePool.forEach((stage) => {
    const contact = contacts[int(0, contacts.length - 1)];
    const acc = accounts.find((a) => a.id === contact.accountId);
    const closed = stage === 'Deal Closed (Won)' || stage === 'Closed Lost';
    const createdOn = closed ? dateBetween('2026-01-02', '2026-08-20') : dateBetween('2026-03-01', '2026-10-05');
    const base = STAGE_PROBABILITY[stage];
    deals.push({
      id: `deal-${String(deals.length + 1).padStart(3, '0')}`,
      name: `${pick(DEAL_TEMPLATES)} – ${acc.name.split(' ')[0]}`,
      accountId: acc.id, contactId: contact.id, stage, amount: int(30, 130) * 5000,
      closingDate: addDays(createdOn, int(30, 110)),
      probability: closed ? base : Math.min(95, Math.max(5, base + pick([-5, 0, 0, 5]))),
      ownerId: pick(USERS).id, createdOn, source: weighted(sourceW), department: pick(DEPARTMENTS),
      lostAtStage: stage === 'Closed Lost' ? pick(['Need Deal Estimation', 'Deal Estimation Ready', 'Deal Estimation sent to Client', 'Deal Estimation accepted- Invoice Need']) : '',
      description: '',
    });
  });

  // ---------------- Calls ----------------
  const namedCalls = [
    ['Product Demo Call', 'Ravi Sharma', 'Outbound', '2026-10-10T10:30', 1104, 'Completed', 'u1', 'Discussed product demo and features.'],
    ['Follow up Call', 'Priya Singh', 'Inbound', '2026-10-10T11:15', 730, 'Completed', 'u2', 'Customer interested in premium plan.'],
    ['Deal Estimation accepted- Invoice Need Call', 'Amit Kumar', 'Outbound', '2026-10-09T15:20', 1505, 'Completed', 'u1', 'Discussed pricing and contract terms.'],
    ['Support Call', 'Sneha R', 'Inbound', '2026-10-09T14:10', 525, 'Missed', 'u3', 'Customer was not available.'],
    ['New Business Call', 'Mohit Kapoor', 'Outbound', '2026-10-08T11:40', 1212, 'Completed', 'u2', 'Discussed partnership opportunity.'],
    ['Requirement Discussion', 'Anitha N', 'Inbound', '2026-10-08T10:00', 930, 'Completed', 'u4', 'Explained requirements and next steps.'],
    ['Quote Discussion', 'Vikram K', 'Outbound', '2026-10-07T16:15', 605, 'Busy', 'u1', 'Customer requested revised quote.'],
    ['Onboarding Call', 'Lakshmi R', 'Inbound', '2026-10-07T12:30', 1338, 'Completed', 'u5', 'Onboarding process discussed.'],
    ['Feedback Call', 'Deepak G', 'Outbound', '2026-10-06T15:50', 322, 'Missed', 'u6', 'Left voicemail.'],
    ['Contract Review Call', 'Suresh P', 'Outbound', '2026-10-06T11:20', 1060, 'Completed', 'u2', 'Reviewed contract details and clauses.'],
  ];
  const calls = namedCalls.map(([subject, conName, type, dateTime, duration, status, ownerId, notes], i) => {
    const c = conByName[conName];
    return { id: `call-${String(i + 1).padStart(3, '0')}`, subject, contactId: c.id, accountId: c.accountId, type, dateTime, duration, status, ownerId, notes };
  });
  const callPool = shuffle([...Array(173).fill('Completed'), ...Array(38).fill('Missed'), ...Array(9).fill('Busy'), ...Array(26).fill('Scheduled')]);
  callPool.forEach((status) => {
    const c = contacts[int(0, contacts.length - 1)];
    const [subject, notes] = pick(CALL_SUBJECTS);
    const day = status === 'Scheduled' ? int(12, 31) : int(1, 9);
    const dateTime = `2026-10-${String(day).padStart(2, '0')}T${String(int(9, 18)).padStart(2, '0')}:${pick(['00', '15', '30', '45'])}`;
    calls.push({
      id: `call-${String(calls.length + 1).padStart(3, '0')}`, subject, contactId: c.id, accountId: c.accountId,
      type: pick(CALL_TYPES), dateTime, duration: status === 'Completed' ? int(180, 1700) : status === 'Scheduled' ? 0 : int(0, 40),
      status, ownerId: pick(USERS).id,
      notes: status === 'Missed' ? 'No answer. Will retry.' : status === 'Scheduled' ? 'Agenda shared over email.' : status === 'Busy' ? 'Line busy, rescheduling.' : notes,
    });
  });

  // ---------------- Invoices ----------------
  const namedInv = [
    ['ABC Pvt Ltd', 'Sales Invoice', '2026-10-10', '2026-10-25', 500000, 500000, 'Paid'],
    ['XYZ Solutions', 'Sales Invoice', '2026-10-08', '2026-10-23', 350000, 150000, 'Pending'],
    ['Tech Corp', 'Recurring Invoice', '2026-10-05', '2026-10-20', 200000, 0, 'Overdue'],
    ['Global Systems', 'Sales Invoice', '2026-10-02', '2026-10-17', 450000, 450000, 'Paid'],
    ['Prime Tech', 'Credit Note', '2026-09-28', '2026-09-28', 50000, 50000, 'Paid'],
    ['Bright Future', 'Sales Invoice', '2026-09-25', '2026-10-10', 300000, 100000, 'Pending'],
    ['NextGen Solutions', 'Debit Note', '2026-09-20', '2026-09-20', 75000, 75000, 'Paid'],
    ['Vision Corp', 'Recurring Invoice', '2026-09-18', '2026-10-03', 125000, 0, 'Overdue'],
    ['Innovate Tech', 'Sales Invoice', '2026-09-15', '2026-09-30', 250000, 250000, 'Paid'],
    ['Skyline Solutions', 'Sales Invoice', '2026-09-12', '2026-09-27', 600000, 300000, 'Pending'],
  ];
  const mkPayments = (paid, date) => (paid > 0 ? [{ id: `pay-${Math.floor(rnd() * 1e9)}`, date, amount: paid, note: 'Bank transfer' }] : []);
  const invoices = namedInv.map(([accName, type, invoiceDate, dueDate, amount, paidAmount, status], i) => ({
    id: `inv-${String(i + 1).padStart(3, '0')}`, number: `INV-2026-${String(i + 1).padStart(3, '0')}`,
    accountId: accByName[accName].id, type, invoiceDate, dueDate, amount, paidAmount, status,
    payments: mkPayments(paidAmount, invoiceDate), notes: '',
  }));
  const typePool = shuffle([...Array(64).fill('Sales Invoice'), ...Array(38).fill('Recurring Invoice'), ...Array(21).fill('Credit Note'), ...Array(9).fill('Debit Note')]);
  typePool.forEach((type) => {
    const month = weighted([[1, 6], [2, 6], [3, 6], [4, 7], [5, 9], [6, 9], [7, 11], [8, 12], [9, 11], [10, 9], [11, 6], [12, 6]]);
    const invoiceDate = iso(2026, month, int(1, 28));
    const dueDate = addDays(invoiceDate, 15);
    const amount = (type === 'Credit Note' || type === 'Debit Note' ? int(1, 4) : int(2, 5)) * 5000;
    let status;
    if (month >= 11) status = 'Pending';
    else if (month <= 8) status = weighted([['Paid', 78], ['Overdue', 12], ['Partially Paid', 10]]);
    else status = weighted([['Paid', 45], ['Pending', 25], ['Partially Paid', 15], ['Overdue', 15]]);
    if (status === 'Pending' && dueDate < '2026-10-09') status = 'Overdue';
    if (status === 'Overdue' && dueDate >= '2026-10-09') status = 'Pending';
    const paidAmount = status === 'Paid' ? amount : status === 'Partially Paid' ? Math.round((amount * int(3, 7)) / 10 / 1000) * 1000 : status === 'Overdue' && rnd() < 0.3 ? Math.round(amount * 0.3 / 1000) * 1000 : 0;
    const n = invoices.length + 1;
    invoices.push({
      id: `inv-${String(n).padStart(3, '0')}`, number: `INV-2026-${String(n).padStart(3, '0')}`,
      accountId: accounts[int(0, 120)].id, type, invoiceDate, dueDate, amount, paidAmount, status,
      payments: mkPayments(paidAmount, addDays(invoiceDate, int(2, 14))), notes: '',
    });
  });

  // ---------------- Historical (2024) stage data — independent dataset ----------------
  const oldDeals = [];
  const top = [['ABC Pvt Ltd', 28], ['XYZ Solutions', 24], ['Tech Corp', 22], ['Global Systems', 18], ['Prime Tech', 16]];
  const accSlots = [];
  top.forEach(([n, c]) => { for (let i = 0; i < c; i++) accSlots.push(accByName[n].id); });
  while (accSlots.length < 305) accSlots.push(accounts[int(5, 60)].id);
  // 2024 snapshot: 305 deals (89 won, 80 lost, 136 open) so current-year KPIs show real change.
  const oldStages = shuffle([
    ...Array(36).fill('Need Deal Estimation'), ...Array(38).fill('Deal Estimation Ready'), ...Array(36).fill('Deal Estimation sent to Client'),
    ...Array(26).fill('Deal Estimation accepted- Invoice Need'), ...Array(89).fill('Deal Closed (Won)'), ...Array(80).fill('Closed Lost'),
  ]);
  shuffle(accSlots).forEach((accountId, i) => {
    const stage = oldStages[i];
    const month = weighted([[1, 7], [2, 8], [3, 9], [4, 8], [5, 8], [6, 8], [7, 8], [8, 8], [9, 9], [10, 10], [11, 11], [12, 10]]);
    oldDeals.push({
      id: `old-${String(i + 1).padStart(3, '0')}`,
      name: `${pick(DEAL_TEMPLATES)} (2024)`, accountId, stage, amount: int(30, 120) * 5000,
      createdOn: iso(2024, month, int(1, 28)), ownerId: pick(USERS).id, source: weighted(sourceW),
      department: pick(DEPARTMENTS),
      lostAtStage: stage === 'Closed Lost' ? pick(['Need Deal Estimation', 'Deal Estimation Ready', 'Deal Estimation sent to Client', 'Deal Estimation accepted- Invoice Need']) : '',
    });
  });

  // Snapshot of the previous reporting period, used for the "vs previous period" indicators.
  // Values are derived from the seeded data so the starting indicators match the reference
  // dashboards (e.g. +12% total calls); they then move as records change.
  const sum = (arr, fn) => arr.reduce((s, x) => s + fn(x), 0);
  const bal = (i) => Math.max(0, i.amount - i.paidAmount);
  const answered = calls.filter((c) => c.status === 'Completed');
  const baselines = {
    accounts: { total: 221, active: 183, new: 19, inactive: 30 },
    calls: {
      total: Math.round(calls.length / 1.12), answered: Math.round(answered.length / 1.15),
      missed: Math.round(calls.filter((c) => c.status === 'Missed').length / 0.92),
      avgDuration: Math.round(sum(answered, (c) => c.duration) / answered.length / 1.1),
      scheduled: Math.round(calls.filter((c) => c.status === 'Scheduled').length / 1.2),
    },
    invoices: {
      count: Math.round(invoices.length / 1.12), total: Math.round(sum(invoices, (i) => i.amount) / 1.18),
      paid: Math.round(sum(invoices, (i) => i.paidAmount) / 1.2),
      pending: Math.round(sum(invoices.filter((i) => i.status !== 'Overdue'), bal) / 0.92),
      overdue: Math.round(sum(invoices.filter((i) => i.status === 'Overdue'), bal) / 1.15),
    },
    contacts: { total: 201 },
  };

  return { accounts, contacts, deals, calls, invoices, oldDeals, baselines, workflows: seedWorkflows(), notifications: seedNotifications(), tasks: [], activity: [], workflowHistory: [] };
}

function seedNotifications() {
  return [
    { id: 'n-1', message: 'Invoice INV-2026-003 for Tech Corp is overdue.', module: 'Zoho Finance', createdAt: '2026-10-08T09:10:00', read: false },
    { id: 'n-2', message: 'Deal "Annual Support Renewal" moved to Deal Closed (Won).', module: 'Deals', createdAt: '2026-10-07T17:40:00', read: false },
    { id: 'n-3', message: 'Divya R logged a call with Priya Singh.', module: 'Calls', createdAt: '2026-10-07T11:20:00', read: true },
  ];
}

export function seedWorkflows() {
  return [
    {
      id: 'wf-1', name: 'High-value deal alert', module: 'Deals', active: true,
      description: 'Routes new deals above ₹10,00,000 to the sales manager.', createdAt: '2026-09-01T10:00:00', runs: 0, lastRun: null,
      nodes: [
        { id: 't1', type: 'trigger', position: { x: 260, y: 30 }, data: { triggerType: 'Record Created', field: '', toValue: '' } },
        { id: 'c1', type: 'condition', position: { x: 230, y: 190 }, data: { logic: 'AND', rules: [{ field: 'amount', operator: 'Greater Than', value: '1000000' }] } },
        { id: 'a1', type: 'action', position: { x: 40, y: 380 }, data: { actionType: 'Assign Record Owner', owner: 'u1' } },
        { id: 'a2', type: 'action', position: { x: 320, y: 380 }, data: { actionType: 'Add Notification', message: 'High-value deal "{{name}}" created for {{amount}}.' } },
        { id: 'a3', type: 'action', position: { x: 600, y: 380 }, data: { actionType: 'Create Activity Log', message: 'High-value deal routed to Arun Kumar.' } },
      ],
      edges: [
        { id: 'e1', source: 't1', target: 'c1' },
        { id: 'e2', source: 'c1', sourceHandle: 'yes', target: 'a1', label: 'Yes' },
        { id: 'e3', source: 'c1', sourceHandle: 'yes', target: 'a2', label: 'Yes' },
        { id: 'e4', source: 'c1', sourceHandle: 'yes', target: 'a3', label: 'Yes' },
      ],
    },
    {
      id: 'wf-2', name: 'Overdue invoice follow-up', module: 'Zoho Finance', active: true,
      description: 'Notifies the team and creates a collection task when an invoice becomes overdue.', createdAt: '2026-09-05T10:00:00', runs: 0, lastRun: null,
      nodes: [
        { id: 't1', type: 'trigger', position: { x: 260, y: 30 }, data: { triggerType: 'Invoice Status Changed', field: 'status', toValue: 'Overdue' } },
        { id: 'a1', type: 'action', position: { x: 60, y: 220 }, data: { actionType: 'Add Notification', message: 'Invoice {{number}} is overdue. Balance {{balance}}.' } },
        { id: 'a2', type: 'action', position: { x: 340, y: 220 }, data: { actionType: 'Create Follow-up Task', title: 'Collect payment for {{number}}', dueDays: 2 } },
        { id: 'a3', type: 'action', position: { x: 620, y: 220 }, data: { actionType: 'Create Activity Log', message: 'Overdue follow-up started for {{number}}.' } },
      ],
      edges: [
        { id: 'e1', source: 't1', target: 'a1' },
        { id: 'e2', source: 't1', target: 'a2' },
        { id: 'e3', source: 't1', target: 'a3' },
      ],
    },
    {
      id: 'wf-3', name: 'Missed call follow-up', module: 'Calls', active: false,
      description: 'Creates a callback task when a call is marked missed.', createdAt: '2026-09-12T10:00:00', runs: 0, lastRun: null,
      nodes: [
        { id: 't1', type: 'trigger', position: { x: 240, y: 30 }, data: { triggerType: 'Call Status Changed', field: 'status', toValue: '' } },
        { id: 'c1', type: 'condition', position: { x: 210, y: 190 }, data: { logic: 'AND', rules: [{ field: 'status', operator: 'Equals', value: 'Missed' }] } },
        { id: 'a1', type: 'action', position: { x: 200, y: 380 }, data: { actionType: 'Create Follow-up Task', title: 'Call back: {{subject}}', dueDays: 1 } },
      ],
      edges: [
        { id: 'e1', source: 't1', target: 'c1' },
        { id: 'e2', source: 'c1', sourceHandle: 'yes', target: 'a1', label: 'Yes' },
      ],
    },
  ];
}
