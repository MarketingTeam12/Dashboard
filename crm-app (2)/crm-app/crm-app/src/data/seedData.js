import { STAGE_PROBABILITY, addDays } from '../utils/calculations.js';

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

export const SEED_VERSION = 11;

export const SALUTATIONS = ['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.'];
export const VENDORS = [
  'CloudNet Distributors',
  'TechSource India',
  'Apex Hardware Partners',
  'Global Systems Supply',
  'NextGen Cloud Resellers',
];

export const USERS = [
  { id: 'u1', name: 'Arun Kumar', role: 'Sales Manager', email: 'arun.kumar@crm.in', color: '#1262E0' },
  { id: 'u2', name: 'Divya R', role: 'Account Executive', email: 'divya.r@crm.in', color: '#D9468F' },
  { id: 'u3', name: 'Karthik S', role: 'Account Executive', email: 'karthik.s@crm.in', color: '#0E9F6E' },
  { id: 'u4', name: 'Ravi Kumar', role: 'Sales Executive', email: 'ravi.kumar@crm.in', color: '#B45309' },
  { id: 'u5', name: 'Sneha R', role: 'Sales Executive', email: 'sneha.r@crm.in', color: '#7C3AED' },
  { id: 'u6', name: 'Mohan Raj', role: 'Inside Sales', email: 'mohan.raj@crm.in', color: '#0F766E' },
];

export const ACCOUNT_TYPES = ['Customer', 'Prospect', 'Partner', 'Vendor'];
export const ACCOUNT_STATUSES = ['Active', 'Inactive', 'New'];
export const ACCOUNT_OWNERSHIPS = ['Private', 'Public', 'Subsidiary', 'Partnership', 'Government'];
export const ACCOUNT_RATINGS = ['Hot', 'Warm', 'Cold', 'Active', 'Acquired'];
export const INDUSTRIES = ['Information Technology', 'IT Services', 'Software', 'Technology', 'Consulting', 'Manufacturing', 'Construction', 'Finance', 'Healthcare', 'Retail', 'Logistics', 'Education', 'Textiles'];
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
  ['Negotiation Call', 'Discussed pricing and contract terms.'],
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
    ['Virat Kohli', 'Marketing Manager', 'Acme Technologies', 'virat18@cricket.in', '+91 98765 43210', 'New', 'Website', 'u1', '2026-10-10', '2026-10-07'],
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
    ['Enterprise CRM Setup', 'ABC Pvt Ltd', 'Ravi Sharma', 'Qualification', 1250000, '2026-10-10', 20, 'u1', '2026-09-01'],
    ['Cloud Migration Project', 'XYZ Solutions', 'Priya Singh', 'Needs Analysis', 875000, '2026-10-15', 40, 'u2', '2026-09-05'],
    ['IT Infrastructure Upgrade', 'Tech Corp', 'Amit Kumar', 'Proposal', 2500000, '2026-10-20', 60, 'u3', '2026-09-08'],
    ['Consulting Services', 'Global Systems', 'Sneha R', 'Negotiation', 1840000, '2026-10-25', 80, 'u1', '2026-09-10'],
    ['Annual Support Renewal', 'Prime Tech', 'Mohit Kapoor', 'Closed Won', 3000000, '2026-10-30', 100, 'u2', '2026-09-12'],
    ['New Branch Setup', 'Bright Future', 'Anitha N', 'Needs Analysis', 980000, '2026-11-05', 40, 'u4', '2026-09-15'],
    ['Security Audit Project', 'NextGen Solutions', 'Vikram K', 'Proposal', 1460000, '2026-11-10', 60, 'u5', '2026-09-18'],
    ['Data Migration', 'Vision Corp', 'Lakshmi R', 'Negotiation', 2850000, '2026-11-18', 75, 'u6', '2026-09-20'],
    ['Training & Onboarding', 'Innovate Tech', 'Deepak G', 'Qualification', 675000, '2026-11-22', 25, 'u1', '2026-09-25'],
    ['Custom Development', 'Skyline Solutions', 'Suresh P', 'Closed Won', 1620000, '2026-11-30', 100, 'u2', '2026-09-28'],
    ['Enterprise Platform Rollout', 'ABC Pvt Ltd', 'Ravi Sharma', 'Closed Won', 2504336.55, '2026-01-18', 100, 'u1', '2025-11-10'],
    ['Cloud Infrastructure Modernization', 'XYZ Solutions', 'Priya Singh', 'Proposal', 4256696.59, '2026-01-22', 50, 'u2', '2025-11-15'],
    ['Core Banking Integration', 'Tech Corp', 'Amit Kumar', 'Negotiation', 93882.00, '2026-01-28', 80, 'u3', '2025-11-20'],
    ['Omnichannel Contact Center', 'Global Systems', 'Sneha R', 'Qualification', 2170287.98, '2026-01-29', 20, 'u1', '2025-11-25'],
    ['Smart Retail Analytics', 'Prime Tech', 'Mohit Kapoor', 'Closed Won', 2135366.54, '2026-02-14', 100, 'u2', '2025-12-05'],
    ['AI Support Agent Trial', 'Bright Future', 'Anitha N', 'Negotiation', 45760.00, '2026-02-20', 75, 'u4', '2025-12-10'],
    ['Workflow Engine Expansion', 'NextGen Solutions', 'Vikram K', 'Proposal', 821178.46, '2026-02-25', 60, 'u5', '2025-12-15'],
  ];
  const defaultCat = (stage, prob) => {
    if (stage === 'Closed Won') return 'Closed Won';
    if (stage === 'Closed Lost') return 'Omitted';
    if (stage === 'Negotiation' || prob >= 75) return 'Commit';
    if (stage === 'Proposal' || prob >= 50) return 'Best Case';
    return 'Pipeline';
  };
  const sourceW = [['Website', 32], ['Referral', 24], ['Cold Call', 18], ['Email', 15], ['Partner', 11]];
  const deals = namedDeals.map(([name, accName, conName, stage, amount, closingDate, probability, ownerId, createdOn], i) => ({
    id: `deal-${String(i + 1).padStart(3, '0')}`,
    name, accountId: accByName[accName].id, contactId: conByName[conName].id, stage, amount, closingDate, probability, ownerId,
    createdOn, source: weighted(sourceW), department: pick(DEPARTMENTS), lostAtStage: '', description: '',
    forecastCategory: defaultCat(stage, probability),
  }));
  const stagePool = shuffle([
    ...Array(38).fill('Qualification'), ...Array(43).fill('Needs Analysis'), ...Array(48).fill('Proposal'),
    ...Array(31).fill('Negotiation'), ...Array(96).fill('Closed Won'), ...Array(76).fill('Closed Lost'),
  ]);
  stagePool.forEach((stage) => {
    const contact = contacts[int(0, contacts.length - 1)];
    const acc = accounts.find((a) => a.id === contact.accountId);
    const closed = stage === 'Closed Won' || stage === 'Closed Lost';
    const createdOn = closed ? dateBetween('2026-01-02', '2026-08-20') : dateBetween('2026-03-01', '2026-10-05');
    const base = STAGE_PROBABILITY[stage];
    const prob = closed ? base : Math.min(95, Math.max(5, base + pick([-5, 0, 0, 5])));
    deals.push({
      id: `deal-${String(deals.length + 1).padStart(3, '0')}`,
      name: `${pick(DEAL_TEMPLATES)} – ${acc.name.split(' ')[0]}`,
      accountId: acc.id, contactId: contact.id, stage, amount: int(30, 130) * 5000,
      closingDate: addDays(createdOn, int(30, 110)),
      probability: prob,
      ownerId: pick(USERS).id, createdOn, source: weighted(sourceW), department: pick(DEPARTMENTS),
      lostAtStage: stage === 'Closed Lost' ? pick(['Qualification', 'Needs Analysis', 'Proposal', 'Negotiation']) : '',
      description: '',
      forecastCategory: defaultCat(stage, prob),
    });
  });

  // ---------------- Calls ----------------
  const namedCalls = [
    ['Product Demo Call', 'Ravi Sharma', 'Outbound', '2026-10-10T10:30', 1104, 'Completed', 'u1', 'Discussed product demo and features.'],
    ['Follow up Call', 'Priya Singh', 'Inbound', '2026-10-10T11:15', 730, 'Completed', 'u2', 'Customer interested in premium plan.'],
    ['Negotiation Call', 'Amit Kumar', 'Outbound', '2026-10-09T15:20', 1505, 'Completed', 'u1', 'Discussed pricing and contract terms.'],
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
    ...Array(36).fill('Qualification'), ...Array(38).fill('Needs Analysis'), ...Array(36).fill('Proposal'),
    ...Array(26).fill('Negotiation'), ...Array(89).fill('Closed Won'), ...Array(80).fill('Closed Lost'),
  ]);
  shuffle(accSlots).forEach((accountId, i) => {
    const stage = oldStages[i];
    const month = weighted([[1, 7], [2, 8], [3, 9], [4, 8], [5, 8], [6, 8], [7, 8], [8, 8], [9, 9], [10, 10], [11, 11], [12, 10]]);
    oldDeals.push({
      id: `old-${String(i + 1).padStart(3, '0')}`,
      name: `${pick(DEAL_TEMPLATES)} (2024)`, accountId, stage, amount: int(30, 120) * 5000,
      createdOn: iso(2024, month, int(1, 28)), ownerId: pick(USERS).id, source: weighted(sourceW),
      department: pick(DEPARTMENTS),
      lostAtStage: stage === 'Closed Lost' ? pick(['Qualification', 'Needs Analysis', 'Proposal', 'Negotiation']) : '',
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

  const contactRelations = enrichContactsAndRelations(contacts, accounts, deals, calls, invoices);
  const accountRelations = enrichAccountsAndRelations(accounts, contacts, deals, calls, invoices, contactRelations);

  return {
    accounts,
    contacts,
    deals,
    calls,
    invoices,
    oldDeals,
    baselines,
    forecasts: seedForecasts(),
    myJobs: seedMyJobs(),
    myJobsLogs: seedMyJobsLogs(),
    contactRelations,
    savedContactViews: seedSavedContactViews(),
    accountRelations,
    savedAccountViews: seedSavedAccountViews(),
    workflows: seedWorkflows(),
    notifications: seedNotifications(),
    tasks: [],
    activity: seedActivity(),
    workflowHistory: seedWorkflowHistory(),
  };
}

export function seedForecasts() {
  return [
    // Card 1: Quarter Target 2026
    {
      id: 'fc-001',
      name: 'Quarter Target 2026',
      periodType: 'Quarterly',
      year: 2026,
      periodKey: 'Q1',
      scope: 'ORG',
      target: 12000000,
      currency: 'INR',
      revenueType: 'Deal Revenue',
      createdOn: '2026-01-05',
      hierarchyTargets: {
        ORG: 12000000,
        'ROLE:Sales Manager': 3500000,
        'USER:u1': 3500000,
        'ROLE:Account Executive': 4500000,
        'USER:u2': 2500000,
        'USER:u3': 2000000,
        'ROLE:Sales Executive': 2500000,
        'USER:u4': 1300000,
        'USER:u5': 1200000,
        'ROLE:Inside Sales': 1500000,
        'USER:u6': 1500000,
      },
    },
    {
      id: 'fc-002',
      name: 'Quarter Target 2026',
      periodType: 'Quarterly',
      year: 2026,
      periodKey: 'Q2',
      scope: 'ORG',
      target: 13000000,
      currency: 'INR',
      revenueType: 'Deal Revenue',
      createdOn: '2026-04-05',
      hierarchyTargets: {
        ORG: 13000000,
        'ROLE:Sales Manager': 3800000,
        'USER:u1': 3800000,
        'ROLE:Account Executive': 4800000,
        'USER:u2': 2600000,
        'USER:u3': 2200000,
        'ROLE:Sales Executive': 2800000,
        'USER:u4': 1500000,
        'USER:u5': 1300000,
        'ROLE:Inside Sales': 1600000,
        'USER:u6': 1600000,
      },
    },
    {
      id: 'fc-003',
      name: 'Quarter Target 2026',
      periodType: 'Quarterly',
      year: 2026,
      periodKey: 'Q3',
      scope: 'ORG',
      target: 15000000,
      currency: 'INR',
      revenueType: 'Deal Revenue',
      createdOn: '2026-07-05',
      hierarchyTargets: {
        ORG: 15000000,
        'ROLE:Sales Manager': 4200000,
        'USER:u1': 4200000,
        'ROLE:Account Executive': 5600000,
        'USER:u2': 3000000,
        'USER:u3': 2600000,
        'ROLE:Sales Executive': 3200000,
        'USER:u4': 1700000,
        'USER:u5': 1500000,
        'ROLE:Inside Sales': 2000000,
        'USER:u6': 2000000,
      },
    },

    // Card 2: Jan 2026
    {
      id: 'fc-004',
      name: 'Jan 2026',
      periodType: 'Monthly',
      year: 2026,
      periodKey: 'M01',
      scope: 'ORG',
      target: 4000000,
      currency: 'INR',
      revenueType: 'Deal Revenue',
      createdOn: '2026-01-01',
      hierarchyTargets: {
        ORG: 4000000,
        'ROLE:Sales Manager': 1200000,
        'USER:u1': 1200000,
        'ROLE:Account Executive': 1500000,
        'USER:u2': 800000,
        'USER:u3': 700000,
        'ROLE:Sales Executive': 800000,
        'USER:u4': 450000,
        'USER:u5': 350000,
        'ROLE:Inside Sales': 500000,
        'USER:u6': 500000,
      },
    },

    // Card 3: February 2026 (Zero/empty target)
    {
      id: 'fc-005',
      name: 'February 2026',
      periodType: 'Monthly',
      year: 2026,
      periodKey: 'M02',
      scope: 'ORG',
      target: 0,
      currency: 'INR',
      revenueType: 'Deal Revenue',
      createdOn: '2026-02-01',
    },

    // Card 4: Monthly Target 2026
    {
      id: 'fc-006',
      name: 'Monthly Target 2026',
      periodType: 'Monthly',
      year: 2026,
      periodKey: 'M06',
      scope: 'ORG',
      target: 5000000,
      currency: 'INR',
      revenueType: 'Deal Revenue',
      createdOn: '2026-06-01',
    },
    {
      id: 'fc-007',
      name: 'Monthly Target 2026',
      periodType: 'Monthly',
      year: 2026,
      periodKey: 'M07',
      scope: 'ORG',
      target: 5000000,
      currency: 'INR',
      revenueType: 'Deal Revenue',
      createdOn: '2026-07-01',
    },
    {
      id: 'fc-008',
      name: 'Monthly Target 2026',
      periodType: 'Monthly',
      year: 2026,
      periodKey: 'M08',
      scope: 'ORG',
      target: 4500000,
      currency: 'INR',
      revenueType: 'Deal Revenue',
      createdOn: '2026-08-01',
    },
    {
      id: 'fc-009',
      name: 'Monthly Target 2026',
      periodType: 'Monthly',
      year: 2026,
      periodKey: 'M09',
      scope: 'ORG',
      target: 5000000,
      currency: 'INR',
      revenueType: 'Deal Revenue',
      createdOn: '2026-09-01',
    },
    {
      id: 'fc-010',
      name: 'Enterprise Sales Team Quota',
      periodType: 'Quarterly',
      year: 2026,
      periodKey: 'Q4',
      scope: 'DEPT:Enterprise Sales',
      target: 4500000,
      currency: 'INR',
      revenueType: 'Deal Revenue',
      createdOn: '2026-09-29',
    },
    {
      id: 'fc-011',
      name: 'Enterprise Sales Team Quota',
      periodType: 'Quarterly',
      year: 2026,
      periodKey: 'Q3',
      scope: 'DEPT:Enterprise Sales',
      target: 3800000,
      currency: 'INR',
      revenueType: 'Deal Revenue',
      createdOn: '2026-06-29',
    },
    {
      id: 'fc-012',
      name: 'Arun Kumar — Sales Target',
      periodType: 'Quarterly',
      year: 2026,
      periodKey: 'Q4',
      scope: 'USER:u1',
      target: 3200000,
      currency: 'INR',
      revenueType: 'Deal Revenue',
      createdOn: '2026-09-30',
    },
    {
      id: 'fc-013',
      name: 'Arun Kumar — Monthly Sales Target',
      periodType: 'Monthly',
      year: 2026,
      periodKey: 'M10',
      scope: 'USER:u1',
      target: 1400000,
      currency: 'INR',
      revenueType: 'Deal Revenue',
      createdOn: '2026-09-30',
    },
    {
      id: 'fc-014',
      name: 'Divya R — Sales Target',
      periodType: 'Quarterly',
      year: 2026,
      periodKey: 'Q4',
      scope: 'USER:u2',
      target: 4200000,
      currency: 'INR',
      revenueType: 'Deal Revenue',
      createdOn: '2026-09-30',
    },
    {
      id: 'fc-015',
      name: 'Divya R — Monthly Sales Target',
      periodType: 'Monthly',
      year: 2026,
      periodKey: 'M10',
      scope: 'USER:u2',
      target: 2500000,
      currency: 'INR',
      revenueType: 'Deal Revenue',
      createdOn: '2026-09-30',
    },
  ];
}

function seedNotifications() {
  return [
    { id: 'n-1', message: 'Invoice INV-2026-003 for Tech Corp is overdue.', module: 'Zoho Finance', createdAt: '2026-10-08T09:10:00', read: false },
    { id: 'n-2', message: 'Deal "Annual Support Renewal" moved to Closed Won.', module: 'Deals', createdAt: '2026-10-07T17:40:00', read: false },
    { id: 'n-3', message: 'Divya R logged a call with Priya Singh.', module: 'Calls', createdAt: '2026-10-07T11:20:00', read: true },
  ];
}

export function seedWorkflows() {
  return [
    {
      id: 'wf-1', name: 'High-value deal alert', module: 'Deals', active: true,
      description: 'Routes new deals above ₹10,00,000 to the sales manager.', createdAt: '2026-09-01T10:00:00', runs: 6, lastRun: '2026-10-10T11:20:00',
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
      description: 'Notifies the team and creates a collection task when an invoice becomes overdue.', createdAt: '2026-09-05T10:00:00', runs: 3, lastRun: '2026-10-08T09:10:00',
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
      id: 'wf-3', name: 'Missed call follow-up', module: 'Calls', active: true,
      description: 'Creates a callback task when a call is marked missed.', createdAt: '2026-09-12T10:00:00', runs: 4, lastRun: '2026-10-09T14:12:00',
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
    {
      id: 'wf-4', name: 'Enterprise Account Revenue & Audit Rule', module: 'Accounts', active: true,
      description: 'Logs audit activity and schedules an executive review task when an Account with revenue above ₹10,00,000 is updated.',
      createdAt: '2026-09-02T09:30:00', runs: 5, lastRun: '2026-10-09T16:40:00',
      nodes: [
        { id: 't1', type: 'trigger', position: { x: 260, y: 30 }, data: { triggerType: 'Record Updated', field: '', toValue: '' } },
        { id: 'c1', type: 'condition', position: { x: 230, y: 190 }, data: { logic: 'AND', rules: [{ field: 'annualRevenue', operator: 'Greater Than', value: '1000000' }] } },
        { id: 'a1', type: 'action', position: { x: 80, y: 380 }, data: { actionType: 'Create Activity Log', message: 'Enterprise Account "{{name}}" verified with annual revenue {{annualRevenue}}.' } },
        { id: 'a2', type: 'action', position: { x: 380, y: 380 }, data: { actionType: 'Create Follow-up Task', title: 'Executive QBR check-in for {{name}}', dueDays: 5 } },
      ],
      edges: [
        { id: 'e1', source: 't1', target: 'c1' },
        { id: 'e2', source: 'c1', sourceHandle: 'yes', target: 'a1', label: 'Yes' },
        { id: 'e3', source: 'c1', sourceHandle: 'yes', target: 'a2', label: 'Yes' },
      ],
    },
    {
      id: 'wf-5', name: 'New Account Onboarding Workflow', module: 'Accounts', active: true,
      description: 'Creates an onboarding task and activity log whenever a new Account is created.',
      createdAt: '2026-09-03T11:00:00', runs: 4, lastRun: '2026-10-08T10:15:00',
      nodes: [
        { id: 't1', type: 'trigger', position: { x: 260, y: 30 }, data: { triggerType: 'Record Created', field: '', toValue: '' } },
        { id: 'a1', type: 'action', position: { x: 100, y: 220 }, data: { actionType: 'Create Follow-up Task', title: 'Complete KYC & Onboarding for {{name}}', dueDays: 3 } },
        { id: 'a2', type: 'action', position: { x: 420, y: 220 }, data: { actionType: 'Create Activity Log', message: 'Onboarding workflow initialized for {{name}}.' } },
      ],
      edges: [
        { id: 'e1', source: 't1', target: 'a1' },
        { id: 'e2', source: 't1', target: 'a2' },
      ],
    },
    {
      id: 'wf-6', name: 'Contact Lifecycle & Engagement Rule', module: 'Contacts', active: true,
      description: 'Logs lifecycle synchronization and creates a follow-up touchpoint when a Contact record is updated.',
      createdAt: '2026-09-04T14:00:00', runs: 6, lastRun: '2026-10-10T10:45:00',
      nodes: [
        { id: 't1', type: 'trigger', position: { x: 260, y: 30 }, data: { triggerType: 'Record Updated', field: '', toValue: '' } },
        { id: 'c1', type: 'condition', position: { x: 230, y: 190 }, data: { logic: 'AND', rules: [{ field: 'lifecycle', operator: 'Not Equals', value: 'Churned' }] } },
        { id: 'a1', type: 'action', position: { x: 80, y: 380 }, data: { actionType: 'Create Activity Log', message: 'Contact "{{name}}" ({{lifecycle}}) profile and engagement synced.' } },
        { id: 'a2', type: 'action', position: { x: 380, y: 380 }, data: { actionType: 'Create Follow-up Task', title: 'Follow-up touchpoint with {{name}}', dueDays: 3 } },
      ],
      edges: [
        { id: 'e1', source: 't1', target: 'c1' },
        { id: 'e2', source: 'c1', sourceHandle: 'yes', target: 'a1', label: 'Yes' },
        { id: 'e3', source: 'c1', sourceHandle: 'yes', target: 'a2', label: 'Yes' },
      ],
    },
    {
      id: 'wf-7', name: 'New Contact Welcome Sequence', module: 'Contacts', active: true,
      description: 'Schedules a welcome call task and logs activity when a new Contact is added.',
      createdAt: '2026-09-06T09:00:00', runs: 4, lastRun: '2026-10-09T11:30:00',
      nodes: [
        { id: 't1', type: 'trigger', position: { x: 260, y: 30 }, data: { triggerType: 'Record Created', field: '', toValue: '' } },
        { id: 'a1', type: 'action', position: { x: 100, y: 220 }, data: { actionType: 'Create Follow-up Task', title: 'Send welcome kit & intro deck to {{name}}', dueDays: 2 } },
        { id: 'a2', type: 'action', position: { x: 420, y: 220 }, data: { actionType: 'Create Activity Log', message: 'Welcome sequence triggered for new contact {{name}}.' } },
      ],
      edges: [
        { id: 'e1', source: 't1', target: 'a1' },
        { id: 'e2', source: 't1', target: 'a2' },
      ],
    },
  ];
}

export function seedWorkflowHistory() {
  return [
    {
      id: 'run-seed-001',
      workflowId: 'wf-4',
      workflowName: 'Enterprise Account Revenue & Audit Rule',
      module: 'Accounts',
      event: 'updated',
      trigger: 'Record Updated',
      triggerDetail: 'Record Updated (Annual Revenue > ₹10,00,000)',
      recordId: 'acc-001',
      recordLabel: 'ABC Pvt Ltd',
      accountId: 'acc-001',
      contactId: '',
      userId: 'u1',
      at: '2026-10-09T16:40:00',
      outcome: 'Executed',
      status: 'Success',
      actions: ['Create Activity Log', 'Create Follow-up Task'],
      actionDetails: [
        'Logged activity: "Enterprise Account ABC Pvt Ltd verified with annual revenue ₹5,20,00,000."',
        'Created follow-up task "Executive QBR check-in for ABC Pvt Ltd" (Due 2026-10-14)',
      ],
      conditionSummary: 'annualRevenue Greater Than 1000000 (passed)',
    },
    {
      id: 'run-seed-002',
      workflowId: 'wf-1',
      workflowName: 'High-value deal alert',
      module: 'Deals',
      event: 'created',
      trigger: 'Record Created',
      triggerDetail: 'Record Created (Deal Amount > ₹10,00,000)',
      recordId: 'deal-001',
      recordLabel: 'Enterprise CRM Setup',
      accountId: 'acc-001',
      contactId: 'con-011',
      userId: 'u1',
      at: '2026-10-07T14:20:00',
      outcome: 'Executed',
      status: 'Success',
      actions: ['Assign Record Owner', 'Add Notification', 'Create Activity Log'],
      actionDetails: [
        'Assigned record owner to Arun Kumar',
        'Sent notification: "High-value deal Enterprise CRM Setup created for ₹12,50,000."',
        'Logged activity: "High-value deal routed to Arun Kumar."',
      ],
      conditionSummary: 'amount Greater Than 1000000 (passed)',
    },
    {
      id: 'run-seed-003',
      workflowId: 'wf-6',
      workflowName: 'Contact Lifecycle & Engagement Rule',
      module: 'Contacts',
      event: 'updated',
      trigger: 'Record Updated',
      triggerDetail: 'Record Updated (Lifecycle Stage = Customer)',
      recordId: 'con-011',
      recordLabel: 'Ravi Sharma',
      accountId: 'acc-001',
      contactId: 'con-011',
      userId: 'u1',
      at: '2026-10-09T11:15:00',
      outcome: 'Executed',
      status: 'Success',
      actions: ['Create Activity Log', 'Create Follow-up Task'],
      actionDetails: [
        'Logged activity: "Contact Ravi Sharma (Customer) profile and engagement synced."',
        'Created follow-up task "Follow-up touchpoint with Ravi Sharma" (Due 2026-10-12)',
      ],
      conditionSummary: 'lifecycle Not Equals Churned (passed)',
    },
    {
      id: 'run-seed-004',
      workflowId: 'wf-6',
      workflowName: 'Contact Lifecycle & Engagement Rule',
      module: 'Contacts',
      event: 'updated',
      trigger: 'Record Updated',
      triggerDetail: 'Record Updated (Lifecycle Stage = New)',
      recordId: 'con-001',
      recordLabel: 'Priya Sharma',
      accountId: 'acc-011',
      contactId: 'con-001',
      userId: 'u1',
      at: '2026-10-10T10:45:00',
      outcome: 'Executed',
      status: 'Success',
      actions: ['Create Activity Log', 'Create Follow-up Task'],
      actionDetails: [
        'Logged activity: "Contact Priya Sharma (New) profile and engagement synced."',
        'Created follow-up task "Follow-up touchpoint with Priya Sharma" (Due 2026-10-13)',
      ],
      conditionSummary: 'lifecycle Not Equals Churned (passed)',
    },
    {
      id: 'run-seed-005',
      workflowId: 'wf-7',
      workflowName: 'New Contact Welcome Sequence',
      module: 'Contacts',
      event: 'created',
      trigger: 'Record Created',
      triggerDetail: 'Record Created',
      recordId: 'con-001',
      recordLabel: 'Priya Sharma',
      accountId: 'acc-011',
      contactId: 'con-001',
      userId: 'u1',
      at: '2026-10-03T09:30:00',
      outcome: 'Executed',
      status: 'Success',
      actions: ['Create Follow-up Task', 'Create Activity Log'],
      actionDetails: [
        'Created follow-up task "Send welcome kit & intro deck to Priya Sharma" (Due 2026-10-05)',
        'Logged activity: "Welcome sequence triggered for new contact Priya Sharma."',
      ],
      conditionSummary: '',
    },
    {
      id: 'run-seed-006',
      workflowId: 'wf-4',
      workflowName: 'Enterprise Account Revenue & Audit Rule',
      module: 'Accounts',
      event: 'updated',
      trigger: 'Record Updated',
      triggerDetail: 'Record Updated (Annual Revenue > ₹10,00,000)',
      recordId: 'acc-011',
      recordLabel: 'Acme Technologies',
      accountId: 'acc-011',
      contactId: '',
      userId: 'u1',
      at: '2026-10-08T15:10:00',
      outcome: 'Executed',
      status: 'Success',
      actions: ['Create Activity Log', 'Create Follow-up Task'],
      actionDetails: [
        'Logged activity: "Enterprise Account Acme Technologies verified with annual revenue ₹2,60,00,000."',
        'Created follow-up task "Executive QBR check-in for Acme Technologies" (Due 2026-10-13)',
      ],
      conditionSummary: 'annualRevenue Greater Than 1000000 (passed)',
    },
    {
      id: 'run-seed-007',
      workflowId: 'wf-4',
      workflowName: 'Enterprise Account Revenue & Audit Rule',
      module: 'Accounts',
      event: 'updated',
      trigger: 'Record Updated',
      triggerDetail: 'Record Updated (Annual Revenue > ₹10,00,000)',
      recordId: 'acc-002',
      recordLabel: 'XYZ Solutions',
      accountId: 'acc-002',
      contactId: '',
      userId: 'u2',
      at: '2026-10-08T13:25:00',
      outcome: 'Executed',
      status: 'Success',
      actions: ['Create Activity Log', 'Create Follow-up Task'],
      actionDetails: [
        'Logged activity: "Enterprise Account XYZ Solutions verified with annual revenue ₹3,80,00,000."',
        'Created follow-up task "Executive QBR check-in for XYZ Solutions" (Due 2026-10-13)',
      ],
      conditionSummary: 'annualRevenue Greater Than 1000000 (passed)',
    },
    {
      id: 'run-seed-008',
      workflowId: 'wf-1',
      workflowName: 'High-value deal alert',
      module: 'Deals',
      event: 'created',
      trigger: 'Record Created',
      triggerDetail: 'Record Created (Deal Amount > ₹10,00,000)',
      recordId: 'deal-002',
      recordLabel: 'Cloud Migration Project',
      accountId: 'acc-002',
      contactId: 'con-012',
      userId: 'u2',
      at: '2026-10-06T11:00:00',
      outcome: 'Conditions not met',
      status: 'Conditions Not Met',
      actions: [],
      actionDetails: ['Condition not met: Deal amount ₹8,75,000 is below ₹10,00,000 threshold'],
      conditionSummary: 'amount Greater Than 1000000 (failed)',
    },
    {
      id: 'run-seed-009',
      workflowId: 'wf-6',
      workflowName: 'Contact Lifecycle & Engagement Rule',
      module: 'Contacts',
      event: 'updated',
      trigger: 'Record Updated',
      triggerDetail: 'Record Updated (Lifecycle Stage = Qualified)',
      recordId: 'con-012',
      recordLabel: 'Priya Singh',
      accountId: 'acc-002',
      contactId: 'con-012',
      userId: 'u2',
      at: '2026-10-09T14:50:00',
      outcome: 'Executed',
      status: 'Success',
      actions: ['Create Activity Log', 'Create Follow-up Task'],
      actionDetails: [
        'Logged activity: "Contact Priya Singh (Qualified) profile and engagement synced."',
        'Created follow-up task "Follow-up touchpoint with Priya Singh" (Due 2026-10-12)',
      ],
      conditionSummary: 'lifecycle Not Equals Churned (passed)',
    },
    {
      id: 'run-seed-010',
      workflowId: 'wf-2',
      workflowName: 'Overdue invoice follow-up',
      module: 'Zoho Finance',
      event: 'updated',
      trigger: 'Invoice Status Changed',
      triggerDetail: 'Invoice Status Changed → Overdue',
      recordId: 'inv-003',
      recordLabel: 'INV-2026-003',
      accountId: 'acc-003',
      contactId: 'con-013',
      userId: 'u3',
      at: '2026-10-08T09:10:00',
      outcome: 'Executed',
      status: 'Success',
      actions: ['Add Notification', 'Create Follow-up Task', 'Create Activity Log'],
      actionDetails: [
        'Sent notification: "Invoice INV-2026-003 is overdue. Balance ₹2,00,000."',
        'Created follow-up task "Collect payment for INV-2026-003" (Due 2026-10-10)',
        'Logged activity: "Overdue follow-up started for INV-2026-003."',
      ],
      conditionSummary: '',
    },
    {
      id: 'run-seed-011',
      workflowId: 'wf-1',
      workflowName: 'High-value deal alert',
      module: 'Deals',
      event: 'created',
      trigger: 'Record Created',
      triggerDetail: 'Record Created (Deal Amount > ₹10,00,000)',
      recordId: 'deal-003',
      recordLabel: 'IT Infrastructure Upgrade',
      accountId: 'acc-003',
      contactId: 'con-013',
      userId: 'u3',
      at: '2026-10-05T15:30:00',
      outcome: 'Executed',
      status: 'Success',
      actions: ['Assign Record Owner', 'Add Notification', 'Create Activity Log'],
      actionDetails: [
        'Assigned record owner to Arun Kumar',
        'Sent notification: "High-value deal IT Infrastructure Upgrade created for ₹25,00,000."',
        'Logged activity: "High-value deal routed to Arun Kumar."',
      ],
      conditionSummary: 'amount Greater Than 1000000 (passed)',
    },
    {
      id: 'run-seed-012',
      workflowId: 'wf-3',
      workflowName: 'Missed call follow-up',
      module: 'Calls',
      event: 'updated',
      trigger: 'Call Status Changed',
      triggerDetail: 'Call Status Changed → Missed',
      recordId: 'call-004',
      recordLabel: 'Support Call',
      accountId: 'acc-004',
      contactId: 'con-014',
      userId: 'u3',
      at: '2026-10-09T14:12:00',
      outcome: 'Executed',
      status: 'Success',
      actions: ['Create Follow-up Task'],
      actionDetails: [
        'Created follow-up task "Call back: Support Call" (Due 2026-10-10)',
      ],
      conditionSummary: 'status Equals Missed (passed)',
    },
    {
      id: 'run-seed-013',
      workflowId: 'wf-6',
      workflowName: 'Contact Lifecycle & Engagement Rule',
      module: 'Contacts',
      event: 'updated',
      trigger: 'Record Updated',
      triggerDetail: 'Record Updated (Lifecycle Stage = Contacted)',
      recordId: 'con-002',
      recordLabel: 'Rahul Menon',
      accountId: 'acc-012',
      contactId: 'con-002',
      userId: 'u2',
      at: '2026-10-08T16:10:00',
      outcome: 'Executed',
      status: 'Success',
      actions: ['Create Activity Log', 'Create Follow-up Task'],
      actionDetails: [
        'Logged activity: "Contact Rahul Menon (Contacted) profile and engagement synced."',
        'Created follow-up task "Follow-up touchpoint with Rahul Menon" (Due 2026-10-11)',
      ],
      conditionSummary: 'lifecycle Not Equals Churned (passed)',
    },
    {
      id: 'run-seed-014',
      workflowId: 'wf-6',
      workflowName: 'Contact Lifecycle & Engagement Rule',
      module: 'Contacts',
      event: 'updated',
      trigger: 'Record Updated',
      triggerDetail: 'Record Updated (Lifecycle Stage = Engaged)',
      recordId: 'con-003',
      recordLabel: 'Karthik Raja',
      accountId: 'acc-013',
      contactId: 'con-003',
      userId: 'u1',
      at: '2026-10-09T12:05:00',
      outcome: 'Executed',
      status: 'Success',
      actions: ['Create Activity Log', 'Create Follow-up Task'],
      actionDetails: [
        'Logged activity: "Contact Karthik Raja (Engaged) profile and engagement synced."',
        'Created follow-up task "Follow-up touchpoint with Karthik Raja" (Due 2026-10-12)',
      ],
      conditionSummary: 'lifecycle Not Equals Churned (passed)',
    },
    {
      id: 'run-seed-015',
      workflowId: 'wf-6',
      workflowName: 'Contact Lifecycle & Engagement Rule',
      module: 'Contacts',
      event: 'updated',
      trigger: 'Record Updated',
      triggerDetail: 'Record Updated (Lifecycle Stage = Qualified)',
      recordId: 'con-004',
      recordLabel: 'Divya Nair',
      accountId: 'acc-007',
      contactId: 'con-004',
      userId: 'u2',
      at: '2026-10-09T17:20:00',
      outcome: 'Executed',
      status: 'Success',
      actions: ['Create Activity Log', 'Create Follow-up Task'],
      actionDetails: [
        'Logged activity: "Contact Divya Nair (Qualified) profile and engagement synced."',
        'Created follow-up task "Follow-up touchpoint with Divya Nair" (Due 2026-10-12)',
      ],
      conditionSummary: 'lifecycle Not Equals Churned (passed)',
    },
    {
      id: 'run-seed-016',
      workflowId: 'wf-1',
      workflowName: 'High-value deal alert',
      module: 'Deals',
      event: 'created',
      trigger: 'Record Created',
      triggerDetail: 'Record Created (Deal Amount > ₹10,00,000)',
      recordId: 'deal-005',
      recordLabel: 'Annual Support Renewal',
      accountId: 'acc-005',
      contactId: 'con-015',
      userId: 'u2',
      at: '2026-10-06T16:35:00',
      outcome: 'Executed',
      status: 'Success',
      actions: ['Assign Record Owner', 'Add Notification', 'Create Activity Log'],
      actionDetails: [
        'Assigned record owner to Arun Kumar',
        'Sent notification: "High-value deal Annual Support Renewal created for ₹30,00,000."',
        'Logged activity: "High-value deal routed to Arun Kumar."',
      ],
      conditionSummary: 'amount Greater Than 1000000 (passed)',
    },
  ];
}

export function seedActivity() {
  return [
    {
      id: 'log-seed-001',
      module: 'Accounts',
      eventType: 'updated',
      recordId: 'acc-001',
      recordLabel: 'ABC Pvt Ltd',
      accountId: 'acc-001',
      contactId: '',
      userId: 'u1',
      title: 'Account Fields Updated — ABC Pvt Ltd',
      message: 'Updated Rating from "Warm" to "Hot" and Annual Revenue to ₹5,20,00,000.',
      changes: [
        { field: 'rating', label: 'Rating', from: 'Warm', to: 'Hot' },
        { field: 'annualRevenue', label: 'Annual Revenue', from: '₹4,50,00,000', to: '₹5,20,00,000' },
      ],
      createdAt: '2026-10-09T16:39:00',
      source: 'user',
    },
    {
      id: 'log-seed-002',
      module: 'Contacts',
      eventType: 'updated',
      recordId: 'con-011',
      recordLabel: 'Ravi Sharma',
      accountId: 'acc-001',
      contactId: 'con-011',
      userId: 'u1',
      title: 'Contact Fields Updated — Ravi Sharma',
      message: 'Updated Lifecycle Stage from "Qualified" to "Customer" and verified GST contact details.',
      changes: [
        { field: 'lifecycle', label: 'Lifecycle Stage', from: 'Qualified', to: 'Customer' },
        { field: 'designation', label: 'Designation', from: 'IT Manager', to: 'IT Director' },
      ],
      createdAt: '2026-10-09T11:14:00',
      source: 'user',
    },
    {
      id: 'log-seed-003',
      module: 'Contacts',
      eventType: 'updated',
      recordId: 'con-001',
      recordLabel: 'Priya Sharma',
      accountId: 'acc-011',
      contactId: 'con-001',
      userId: 'u1',
      title: 'Contact Profile Edited — Priya Sharma',
      message: 'Updated Follow-Up Date and Department for Q4 Enterprise Outreach.',
      changes: [
        { field: 'followUp', label: 'Follow-Up Date', from: '2026-10-04', to: '2026-10-07' },
        { field: 'emailSentiment', label: 'Email Sentiment', from: 'Neutral', to: 'Positive' },
      ],
      createdAt: '2026-10-10T10:44:00',
      source: 'user',
    },
    {
      id: 'log-seed-004',
      module: 'Accounts',
      eventType: 'updated',
      recordId: 'acc-002',
      recordLabel: 'XYZ Solutions',
      accountId: 'acc-002',
      contactId: '',
      userId: 'u2',
      title: 'Account Details Updated — XYZ Solutions',
      message: 'Updated Account Site and Annual Revenue after Q3 technical review.',
      changes: [
        { field: 'annualRevenue', label: 'Annual Revenue', from: '₹3,20,00,000', to: '₹3,80,00,000' },
        { field: 'rating', label: 'Rating', from: 'Warm', to: 'Hot' },
      ],
      createdAt: '2026-10-08T13:24:00',
      source: 'user',
    },
    {
      id: 'log-seed-005',
      module: 'Contacts',
      eventType: 'updated',
      recordId: 'con-012',
      recordLabel: 'Priya Singh',
      accountId: 'acc-002',
      contactId: 'con-012',
      userId: 'u2',
      title: 'Contact Lifecycle Updated — Priya Singh',
      message: 'Promoted Lifecycle Stage to "Qualified" following Cloud Migration discovery call.',
      changes: [
        { field: 'lifecycle', label: 'Lifecycle Stage', from: 'Engaged', to: 'Qualified' },
      ],
      createdAt: '2026-10-09T14:49:00',
      source: 'user',
    },
    {
      id: 'log-seed-006',
      module: 'Accounts',
      eventType: 'updated',
      recordId: 'acc-003',
      recordLabel: 'Tech Corp',
      accountId: 'acc-003',
      contactId: '',
      userId: 'u3',
      title: 'Account Security & Billing Updated — Tech Corp',
      message: 'Verified Hyderabad HQ billing address and updated employee count.',
      changes: [
        { field: 'employees', label: 'Employees', from: '420', to: '500' },
        { field: 'rating', label: 'Rating', from: 'Warm', to: 'Hot' },
      ],
      createdAt: '2026-10-07T16:15:00',
      source: 'user',
    },
    {
      id: 'log-seed-007',
      module: 'Contacts',
      eventType: 'updated',
      recordId: 'con-002',
      recordLabel: 'Rahul Menon',
      accountId: 'acc-012',
      contactId: 'con-002',
      userId: 'u2',
      title: 'Contact Follow-up Updated — Rahul Menon',
      message: 'Updated Lifecycle Stage from "New" to "Contacted" after LinkedIn outreach.',
      changes: [
        { field: 'lifecycle', label: 'Lifecycle Stage', from: 'New', to: 'Contacted' },
      ],
      createdAt: '2026-10-08T16:08:00',
      source: 'user',
    },
    {
      id: 'log-seed-008',
      module: 'Contacts',
      eventType: 'updated',
      recordId: 'con-003',
      recordLabel: 'Karthik Raja',
      accountId: 'acc-013',
      contactId: 'con-003',
      userId: 'u1',
      title: 'Contact Stage Updated — Karthik Raja',
      message: 'Updated Lifecycle Stage from "Contacted" to "Engaged" and scheduled technical deep dive.',
      changes: [
        { field: 'lifecycle', label: 'Lifecycle Stage', from: 'Contacted', to: 'Engaged' },
      ],
      createdAt: '2026-10-09T12:04:00',
      source: 'user',
    },
    {
      id: 'log-seed-009',
      module: 'Contacts',
      eventType: 'updated',
      recordId: 'con-004',
      recordLabel: 'Divya Nair',
      accountId: 'acc-007',
      contactId: 'con-004',
      userId: 'u2',
      title: 'Contact Qualification Updated — Divya Nair',
      message: 'Updated Lifecycle Stage from "Engaged" to "Qualified" after security questionnaire review.',
      changes: [
        { field: 'lifecycle', label: 'Lifecycle Stage', from: 'Engaged', to: 'Qualified' },
      ],
      createdAt: '2026-10-09T17:19:00',
      source: 'user',
    },
    {
      id: 'log-seed-010',
      module: 'Accounts',
      eventType: 'updated',
      recordId: 'acc-005',
      recordLabel: 'Prime Tech',
      accountId: 'acc-005',
      contactId: '',
      userId: 'u2',
      title: 'Account Renewal Confirmed — Prime Tech',
      message: 'Updated Annual Revenue and confirmed 24x7 SLA support tier.',
      changes: [
        { field: 'annualRevenue', label: 'Annual Revenue', from: '₹5,80,00,000', to: '₹6,50,00,000' },
        { field: 'status', label: 'Account Status', from: 'Active', to: 'Active (Renewed)' },
      ],
      createdAt: '2026-10-06T16:30:00',
      source: 'user',
    },
  ];
}

export function seedMyJobs() {
  return [
    // ---------------- Reviews ----------------
    {
      id: 'job-rev-001',
      category: 'Reviews',
      recordName: 'Consulting Services',
      recordId: 'deal-004',
      collection: 'deals',
      module: 'Deals',
      layout: 'Enterprise B2B Layout',
      processName: 'High-Value Deal Field Review',
      status: 'Waiting for Review',
      decision: 'Pending',
      createdBy: 'u1',
      assignedTo: 'u1',
      submittedAt: '2026-10-09T09:45:00',
      legacySection: 'Assigned Jobs',
      fieldsToReview: [
        {
          field: 'amount',
          label: 'Deal Amount (INR)',
          currentValue: '₹ 18,40,000',
          proposedValue: '₹ 21,50,000',
          rawProposed: 2150000,
          reason: 'Added multi-region SLA support addendum requested by Global Systems.',
        },
        {
          field: 'probability',
          label: 'Probability (%)',
          currentValue: '80%',
          proposedValue: '90%',
          rawProposed: 90,
          reason: 'Commercial sign-off received from procurement.',
        },
        {
          field: 'closingDate',
          label: 'Closing Date',
          currentValue: '2026-10-25',
          proposedValue: '2026-10-20',
          rawProposed: '2026-10-20',
          reason: 'Accelerated Q4 deployment schedule.',
        },
      ],
    },
    {
      id: 'job-rev-002',
      category: 'Reviews',
      recordName: 'Priya Singh',
      recordId: 'con-012',
      collection: 'contacts',
      module: 'Contacts',
      layout: 'Standard Contact Layout',
      processName: 'Executive Contact Data Verification',
      status: 'Waiting for Review',
      decision: 'Pending',
      createdBy: 'u2',
      assignedTo: 'u1',
      submittedAt: '2026-10-08T16:20:00',
      legacySection: 'Pending Tasks',
      fieldsToReview: [
        {
          field: 'designation',
          label: 'Designation',
          currentValue: 'Procurement Lead',
          proposedValue: 'VP of Global Procurement',
          rawProposed: 'VP of Global Procurement',
          reason: 'Promoted per XYZ Solutions Q4 leadership update.',
        },
        {
          field: 'lifecycle',
          label: 'Lifecycle Stage',
          currentValue: 'Qualified',
          proposedValue: 'Customer',
          rawProposed: 'Customer',
          reason: 'Master Services Agreement executed.',
        },
      ],
    },
    {
      id: 'job-rev-003',
      category: 'Reviews',
      recordName: 'Vertex Global',
      recordId: 'acc-014',
      collection: 'accounts',
      module: 'Accounts',
      layout: 'Key Account Layout',
      processName: 'Annual Revenue & Tier Review',
      status: 'Waiting for Review',
      decision: 'Pending',
      createdBy: 'u2',
      assignedTo: 'u2',
      submittedAt: '2026-10-08T11:10:00',
      legacySection: 'Assigned Jobs',
      fieldsToReview: [
        {
          field: 'annualRevenue',
          label: 'Annual Revenue (INR)',
          currentValue: '₹ 7,20,00,000',
          proposedValue: '₹ 8,50,00,000',
          rawProposed: 85000000,
          reason: 'Audited FY26 financial filing update.',
        },
        {
          field: 'type',
          label: 'Account Type',
          currentValue: 'Customer',
          proposedValue: 'Partner',
          rawProposed: 'Partner',
          reason: 'Enrolled in Strategic Co-Sell Partner Program.',
        },
      ],
    },
    {
      id: 'job-rev-004',
      category: 'Reviews',
      recordName: 'Annual Support Renewal',
      recordId: 'deal-005',
      collection: 'deals',
      module: 'Deals',
      layout: 'Renewal Layout',
      processName: 'High-Value Deal Field Review',
      status: 'Accepted',
      decision: 'Accepted',
      createdBy: 'u2',
      assignedTo: 'u1',
      submittedAt: '2026-10-06T14:05:00',
      reviewedBy: 'u1',
      reviewedAt: '2026-10-06T16:30:00',
      reviewComment: 'Verified signed renewal order with Prime Tech finance team.',
      legacySection: 'Completed Jobs',
      fieldsToReview: [
        {
          field: 'amount',
          label: 'Deal Amount (INR)',
          currentValue: '₹ 28,00,000',
          proposedValue: '₹ 30,00,000',
          rawProposed: 3000000,
          reason: 'Included 24x7 premium SLA support tier.',
        },
      ],
    },

    // ---------------- Approvals ----------------
    // ---------------- Approvals (Matching Zoho CRM Screenshot) ----------------
    {
      id: 'job-app-001',
      category: 'Approvals',
      recordName: 'User',
      recordId: 'deal-001',
      collection: 'deals',
      module: 'Deals',
      layout: 'Standard Deal Layout',
      processName: 'Closed Lost Before approval',
      status: 'Waiting for Approval',
      decision: 'Pending',
      requesterName: 'Marketing Department',
      recordOwner: 'Arun Kumar',
      createdBy: 'u1',
      assignedTo: 'u1',
      submittedAt: '2026-10-10T11:15:00',
      summary: 'Request to approve Closed Lost stage before formal procurement evaluation completes.',
    },
    {
      id: 'job-app-002',
      category: 'Approvals',
      recordName: 'Anandhan',
      recordId: 'deal-002',
      collection: 'deals',
      module: 'Deals',
      layout: 'Standard Deal Layout',
      processName: 'Closed Lost Before approval',
      status: 'Waiting for Approval',
      decision: 'Pending',
      requesterName: 'Marketing Department',
      recordOwner: 'Divya R',
      createdBy: 'u2',
      assignedTo: 'u1',
      submittedAt: '2026-10-10T11:05:00',
      summary: 'Approval requested to mark Anandhan deal as Closed Lost before review deadline.',
    },
    {
      id: 'job-app-003',
      category: 'Approvals',
      recordName: 'User',
      recordId: 'deal-003',
      collection: 'deals',
      module: 'Deals',
      layout: 'Standard Deal Layout',
      processName: 'Closed Lost Before approval',
      status: 'Waiting for Approval',
      decision: 'Pending',
      requesterName: 'Marketing Department',
      recordOwner: 'Karthik S',
      createdBy: 'u3',
      assignedTo: 'u1',
      submittedAt: '2026-10-10T10:50:00',
      summary: 'Closed Lost approval requested by Marketing Department.',
    },
    {
      id: 'job-app-004',
      category: 'Approvals',
      recordName: 'Raman',
      recordId: 'deal-004',
      collection: 'deals',
      module: 'Deals',
      layout: 'Standard Deal Layout',
      processName: 'Closed Lost Before approval',
      status: 'Waiting for Approval',
      decision: 'Pending',
      requesterName: 'Marketing Department',
      recordOwner: 'Arun Kumar',
      createdBy: 'u1',
      assignedTo: 'u1',
      submittedAt: '2026-10-10T10:48:00',
      summary: 'Deal closed lost prior to SLA agreement completion.',
    },
    {
      id: 'job-app-005',
      category: 'Approvals',
      recordName: 'User',
      recordId: 'deal-005',
      collection: 'deals',
      module: 'Deals',
      layout: 'Standard Deal Layout',
      processName: 'Closed Lost Before approval',
      status: 'Waiting for Approval',
      decision: 'Pending',
      requesterName: 'Marketing Department',
      recordOwner: 'Divya R',
      createdBy: 'u2',
      assignedTo: 'u1',
      submittedAt: '2026-10-10T10:36:00',
      summary: 'Customer cancelled RFP process.',
    },
    {
      id: 'job-app-006',
      category: 'Approvals',
      recordName: 'Aravind',
      recordId: 'deal-006',
      collection: 'deals',
      module: 'Deals',
      layout: 'Standard Deal Layout',
      processName: 'Closed Lost Before approval',
      status: 'Waiting for Approval',
      decision: 'Pending',
      requesterName: 'Marketing Department',
      recordOwner: 'Arun Kumar',
      createdBy: 'u1',
      assignedTo: 'u1',
      submittedAt: '2026-10-10T10:34:00',
      summary: 'Closed Lost approval requested by marketing outreach.',
    },
    {
      id: 'job-app-007',
      category: 'Approvals',
      recordName: 'User',
      recordId: 'deal-007',
      collection: 'deals',
      module: 'Deals',
      layout: 'Standard Deal Layout',
      processName: 'Closed Lost Before approval',
      status: 'Waiting for Approval',
      decision: 'Pending',
      requesterName: 'Marketing Department',
      recordOwner: 'Sneha R',
      createdBy: 'u5',
      assignedTo: 'u1',
      submittedAt: '2026-10-10T10:32:00',
      summary: 'Unresponsive lead closed lost request.',
    },
    {
      id: 'job-app-008',
      category: 'Approvals',
      recordName: 'Kamila',
      recordId: 'deal-008',
      collection: 'deals',
      module: 'Deals',
      layout: 'Standard Deal Layout',
      processName: 'Closed Lost Before approval',
      status: 'Waiting for Approval',
      decision: 'Pending',
      requesterName: 'Dhivya MV',
      recordOwner: 'Divya R',
      createdBy: 'u2',
      assignedTo: 'u1',
      submittedAt: '2026-10-10T11:08:00',
      summary: 'Customer selected alternate vendor before evaluation phase.',
    },
    {
      id: 'job-app-009',
      category: 'Approvals',
      recordName: 'Kuldeep',
      recordId: 'deal-009',
      collection: 'deals',
      module: 'Deals',
      layout: 'Standard Deal Layout',
      processName: 'Closed Lost Before approval',
      status: 'Waiting for Approval',
      decision: 'Pending',
      requesterName: 'Dhivya MV',
      recordOwner: 'Karthik S',
      createdBy: 'u3',
      assignedTo: 'u1',
      submittedAt: '2026-10-10T10:14:00',
      summary: 'Budget frozen by customer finance department.',
    },
    {
      id: 'job-app-010',
      category: 'Approvals',
      recordName: 'swathib',
      recordId: 'deal-010',
      collection: 'deals',
      module: 'Deals',
      layout: 'Standard Deal Layout',
      processName: 'Closed Lost Before approval',
      status: 'Waiting for Approval',
      decision: 'Pending',
      requesterName: 'Janani .',
      recordOwner: 'Ravi Kumar',
      createdBy: 'u4',
      assignedTo: 'u1',
      submittedAt: '2026-10-09T17:55:00',
      summary: 'Project deferred to next fiscal year.',
    },
    {
      id: 'job-app-011',
      category: 'Approvals',
      recordName: '#Lead name',
      recordId: 'deal-011',
      collection: 'deals',
      module: 'Deals',
      layout: 'Standard Deal Layout',
      processName: 'Closed Lost Before approval',
      status: 'Waiting for Approval',
      decision: 'Pending',
      requesterName: 'Janani .',
      recordOwner: 'Sneha R',
      createdBy: 'u5',
      assignedTo: 'u1',
      submittedAt: '2026-10-09T17:54:00',
      summary: 'Early lead termination requested.',
    },
    {
      id: 'job-app-012',
      category: 'Approvals',
      recordName: 'RAKESH',
      recordId: 'deal-012',
      collection: 'deals',
      module: 'Deals',
      layout: 'Standard Deal Layout',
      processName: 'Closed Lost Before approval',
      status: 'Waiting for Approval',
      decision: 'Pending',
      requesterName: 'Kumutha T',
      recordOwner: 'Arun Kumar',
      createdBy: 'u1',
      assignedTo: 'u1',
      submittedAt: '2026-10-09T17:41:00',
      summary: 'Technical requirements could not be satisfied within timeline.',
    },
    {
      id: 'job-app-013',
      category: 'Approvals',
      recordName: 'Manju suman',
      recordId: 'deal-013',
      collection: 'deals',
      module: 'Deals',
      layout: 'Standard Deal Layout',
      processName: 'Closed Lost Before approval',
      status: 'Waiting for Approval',
      decision: 'Pending',
      requesterName: 'Kumutha T',
      recordOwner: 'Divya R',
      createdBy: 'u2',
      assignedTo: 'u1',
      submittedAt: '2026-10-09T17:40:00',
      summary: 'Closed Lost approval requested before contract negotiation.',
    },
    {
      id: 'job-app-014',
      category: 'Approvals',
      recordName: 'Aakash',
      recordId: 'deal-014',
      collection: 'deals',
      module: 'Deals',
      layout: 'Standard Deal Layout',
      processName: 'Closed Lost Before approval',
      status: 'Waiting for Approval',
      decision: 'Pending',
      requesterName: 'Deepti',
      recordOwner: 'Karthik S',
      createdBy: 'u3',
      assignedTo: 'u1',
      submittedAt: '2026-10-09T17:40:00',
      summary: 'Customer chose open-source in-house implementation.',
    },
    {
      id: 'job-app-015',
      category: 'Approvals',
      recordName: 'prateek',
      recordId: 'deal-015',
      collection: 'deals',
      module: 'Deals',
      layout: 'Standard Deal Layout',
      processName: 'Closed Lost Before approval',
      status: 'Waiting for Approval',
      decision: 'Pending',
      requesterName: 'Deepti',
      recordOwner: 'Arun Kumar',
      createdBy: 'u1',
      assignedTo: 'u1',
      submittedAt: '2026-10-09T17:38:00',
      summary: 'Stakeholder relocated; project cancelled.',
    },
    {
      id: 'job-app-016',
      category: 'Approvals',
      recordName: 'User',
      recordId: 'deal-016',
      collection: 'deals',
      module: 'Deals',
      layout: 'Standard Deal Layout',
      processName: 'Closed Lost Before approval',
      status: 'Waiting for Approval',
      decision: 'Pending',
      requesterName: 'Deepti',
      recordOwner: 'Sneha R',
      createdBy: 'u5',
      assignedTo: 'u1',
      submittedAt: '2026-10-09T17:33:00',
      summary: 'No budget allocated for commercial renewal.',
    },
    {
      id: 'job-app-017',
      category: 'Approvals',
      recordName: 'AKASH',
      recordId: 'deal-017',
      collection: 'deals',
      module: 'Deals',
      layout: 'Standard Deal Layout',
      processName: 'Closed Lost Before approval',
      status: 'Waiting for Approval',
      decision: 'Pending',
      requesterName: 'Deepti',
      recordOwner: 'Ravi Kumar',
      createdBy: 'u4',
      assignedTo: 'u1',
      submittedAt: '2026-10-09T17:31:00',
      summary: 'Procurement requested termination of quote.',
    },
    {
      id: 'job-app-018',
      category: 'Approvals',
      recordName: 'Pradip Patil',
      recordId: 'deal-018',
      collection: 'deals',
      module: 'Deals',
      layout: 'Standard Deal Layout',
      processName: 'Closed Lost Before approval',
      status: 'Waiting for Approval',
      decision: 'Pending',
      requesterName: 'Ritu .',
      recordOwner: 'Ravi Kumar',
      createdBy: 'u4',
      assignedTo: 'u1',
      submittedAt: '2026-10-09T16:41:00',
      summary: 'Scope reduction led to disqualification.',
    },
    {
      id: 'job-app-019',
      category: 'Approvals',
      recordName: 'MOGILIPAKA',
      recordId: 'deal-019',
      collection: 'deals',
      module: 'Deals',
      layout: 'Standard Deal Layout',
      processName: 'Closed Lost Before approval',
      status: 'Waiting for Approval',
      decision: 'Pending',
      requesterName: 'Sales Team',
      recordOwner: 'Arun Kumar',
      createdBy: 'u1',
      assignedTo: 'u1',
      submittedAt: '2026-10-09T17:18:00',
      summary: 'Strategic co-sell partnership fell through.',
    },
    {
      id: 'job-app-020',
      category: 'Approvals',
      recordName: 'IT Infrastructure Upgrade',
      recordId: 'deal-003',
      collection: 'deals',
      module: 'Deals',
      layout: 'Enterprise B2B Layout',
      processName: 'Large Deal Discount & Pricing Approval',
      approvalRule: 'Deal Amount > ₹20,00,000 or Discount > 15%',
      requestedValue: '18% Volume Discount (Net ₹25,00,000)',
      status: 'Waiting for Approval',
      decision: 'Pending',
      requesterName: 'Enterprise Sales',
      recordOwner: 'Karthik S',
      createdBy: 'u3',
      assignedTo: 'u1',
      submittedAt: '2026-10-09T10:15:00',
      summary: 'Tech Corp requested an 18% multi-year volume discount on the ₹25,00,000 IT Infrastructure Upgrade proposal.',
      proposedPatch: {
        description: 'Approved 18% multi-year volume discount (Net ₹25,00,000) under Enterprise Pricing Rule.',
      },
    },
    {
      id: 'job-app-021',
      category: 'Approvals',
      recordName: 'Data Migration',
      recordId: 'deal-008',
      collection: 'deals',
      module: 'Deals',
      layout: 'Standard Deal Layout',
      processName: 'Extended Payment Terms Approval',
      approvalRule: 'Net-60 Credit Terms Request',
      requestedValue: 'Net-60 Days (₹28,50,000)',
      status: 'Waiting for Approval',
      decision: 'Pending',
      requesterName: 'Vision Corp Ops',
      recordOwner: 'Ravi Kumar',
      createdBy: 'u6',
      assignedTo: 'u1',
      submittedAt: '2026-10-08T15:40:00',
      summary: 'Vision Corp procurement requested Net-60 payment schedule split across two deployment milestones.',
      proposedPatch: {
        description: 'Approved Net-60 payment schedule split across two deployment milestones.',
      },
    },
    {
      id: 'job-app-022',
      category: 'Approvals',
      recordName: 'Global Systems',
      recordId: 'acc-004',
      collection: 'accounts',
      module: 'Accounts',
      layout: 'Partner Account Layout',
      processName: 'Partner Rebate Tier Upgrade',
      approvalRule: 'Gold Partner Tier (12% Margin)',
      requestedValue: 'Gold Partner Tier',
      status: 'Waiting for Approval',
      decision: 'Pending',
      requesterName: 'Channel Partners',
      recordOwner: 'Arun Kumar',
      createdBy: 'u1',
      assignedTo: 'u2',
      submittedAt: '2026-10-07T13:25:00',
      summary: 'Upgrade Global Systems to Gold Partner rebate tier based on Q3 referral volume.',
      proposedPatch: {
        description: 'Approved Gold Partner Tier (12% rebate margin).',
      },
    },
    {
      id: 'job-app-023',
      category: 'Approvals',
      recordName: 'Custom Development',
      recordId: 'deal-010',
      collection: 'deals',
      module: 'Deals',
      layout: 'Standard Deal Layout',
      processName: 'Fast-Track SOW Approval',
      approvalRule: 'Custom SOW Legal Sign-Off',
      requestedValue: '₹16,20,000 Fixed-Bid SOW',
      status: 'Approved',
      decision: 'Approved',
      requesterName: 'Professional Services',
      recordOwner: 'Divya R',
      createdBy: 'u2',
      assignedTo: 'u1',
      submittedAt: '2026-10-05T09:50:00',
      reviewedBy: 'u1',
      reviewedAt: '2026-10-05T14:15:00',
      reviewComment: 'Approved fixed-bid SOW after technical architecture sign-off.',
      summary: 'Fixed-bid SOW approval for Skyline Solutions custom development module.',
      proposedPatch: {},
    },

    // ---------------- Blueprint Transitions ----------------
    {
      id: 'job-bp-001',
      category: 'Blueprint Transitions',
      recordName: 'Enterprise CRM Setup',
      recordId: 'deal-001',
      collection: 'deals',
      module: 'Deals',
      layout: 'Enterprise B2B Layout',
      processName: 'Enterprise Deal Lifecycle Blueprint',
      currentState: 'Qualification',
      status: 'Waiting for Transition',
      decision: 'Pending',
      createdBy: 'u1',
      assignedTo: 'u1',
      submittedAt: '2026-10-09T08:30:00',
      legacySection: 'Assigned Jobs',
      transitions: [
        {
          id: 'tr-needs',
          name: 'Complete Discovery',
          nextState: 'Needs Analysis',
          nextProbability: 40,
          nextCategory: 'Pipeline',
          requiredFields: [
            {
              name: 'discoverySummary',
              label: 'Discovery Call Summary',
              type: 'textarea',
              placeholder: 'Summarize key business pain points and stakeholders...',
            },
            {
              name: 'confirmedBudget',
              label: 'Confirmed Budget (INR)',
              type: 'number',
              min: 100000,
              defaultValue: '1250000',
            },
          ],
        },
        {
          id: 'tr-prop',
          name: 'Fast-Track to Proposal',
          nextState: 'Proposal',
          nextProbability: 60,
          nextCategory: 'Best Case',
          requiredFields: [
            {
              name: 'solutionArchitect',
              label: 'Assigned Solution Architect',
              type: 'text',
              placeholder: 'e.g. Karthik S',
            },
            {
              name: 'proposalDueDate',
              label: 'Proposal Target Date',
              type: 'date',
              defaultValue: '2026-10-14',
            },
          ],
        },
      ],
    },
    {
      id: 'job-bp-002',
      category: 'Blueprint Transitions',
      recordName: 'Cloud Migration Project',
      recordId: 'deal-002',
      collection: 'deals',
      module: 'Deals',
      layout: 'Standard Deal Layout',
      processName: 'Enterprise Deal Lifecycle Blueprint',
      currentState: 'Needs Analysis',
      status: 'Waiting for Transition',
      decision: 'Pending',
      createdBy: 'u2',
      assignedTo: 'u2',
      submittedAt: '2026-10-08T17:10:00',
      legacySection: 'Pending Tasks',
      transitions: [
        {
          id: 'tr-submit-prop',
          name: 'Submit Technical Proposal',
          nextState: 'Proposal',
          nextProbability: 60,
          nextCategory: 'Best Case',
          requiredFields: [
            {
              name: 'proposalDocRef',
              label: 'Proposal Reference ID',
              type: 'text',
              placeholder: 'e.g. PROP-2026-108',
            },
            {
              name: 'estimatedAmount',
              label: 'Revised Deal Amount (INR)',
              type: 'number',
              min: 50000,
              defaultValue: '875000',
            },
          ],
        },
        {
          id: 'tr-neg-esc',
          name: 'Escalate to Negotiation',
          nextState: 'Negotiation',
          nextProbability: 80,
          nextCategory: 'Commit',
          requiredFields: [
            {
              name: 'executiveSponsor',
              label: 'Customer Executive Sponsor',
              type: 'text',
              placeholder: 'e.g. Priya Singh',
            },
            {
              name: 'closingDate',
              label: 'Confirmed Closing Date',
              type: 'date',
              defaultValue: '2026-10-15',
            },
          ],
        },
      ],
    },
    {
      id: 'job-bp-003',
      category: 'Blueprint Transitions',
      recordName: 'Security Audit Project',
      recordId: 'deal-007',
      collection: 'deals',
      module: 'Deals',
      layout: 'Enterprise B2B Layout',
      processName: 'Security Compliance Deal Blueprint',
      currentState: 'Proposal',
      status: 'Waiting for Transition',
      decision: 'Pending',
      createdBy: 'u5',
      assignedTo: 'u1',
      submittedAt: '2026-10-08T12:00:00',
      legacySection: 'Assigned Jobs',
      transitions: [
        {
          id: 'tr-neg',
          name: 'Enter Contract Negotiation',
          nextState: 'Negotiation',
          nextProbability: 80,
          nextCategory: 'Commit',
          requiredFields: [
            {
              name: 'securityScopeSignoff',
              label: 'Security Scope Sign-off Reference',
              type: 'text',
              placeholder: 'e.g. SEC-AUDIT-2026-09',
            },
            {
              name: 'legalReviewer',
              label: 'Legal Reviewer Name',
              type: 'text',
              placeholder: 'e.g. Meera Iyer',
            },
          ],
        },
        {
          id: 'tr-won',
          name: 'Close Won Directly',
          nextState: 'Closed Won',
          nextProbability: 100,
          nextCategory: 'Closed Won',
          requiredFields: [
            {
              name: 'poNumber',
              label: 'Customer PO Number',
              type: 'text',
              placeholder: 'e.g. PO-NXG-8841',
            },
            {
              name: 'signedDate',
              label: 'PO Signed Date',
              type: 'date',
              defaultValue: '2026-10-09',
            },
          ],
        },
      ],
    },
    {
      id: 'job-bp-004',
      category: 'Blueprint Transitions',
      recordName: 'Bright Future',
      recordId: 'acc-006',
      collection: 'accounts',
      module: 'Accounts',
      layout: 'Standard Account Layout',
      processName: 'Account Reactivation Blueprint',
      currentState: 'Active',
      status: 'Transitioned',
      decision: 'Completed',
      createdBy: 'u4',
      assignedTo: 'u1',
      submittedAt: '2026-10-04T11:00:00',
      reviewedBy: 'u1',
      reviewedAt: '2026-10-04T15:20:00',
      reviewComment: 'Completed transition "Reactivate Prospect" after Q4 branch expansion call.',
      legacySection: 'Completed Jobs',
      transitions: [],
    },

    // ---------------- Image Validations ----------------
    {
      id: 'job-img-001',
      category: 'Image Validations',
      recordName: 'ABC Pvt Ltd',
      recordId: 'acc-001',
      collection: 'accounts',
      module: 'Accounts',
      layout: 'Key Account Layout',
      processName: 'Customer KYC & GST Certificate Validation',
      fieldName: 'GST Registration & Company Seal',
      status: 'Waiting for Validation',
      decision: 'Pending',
      createdBy: 'u1',
      assignedTo: 'u1',
      submittedAt: '2026-10-09T10:05:00',
      legacySection: 'Pending Tasks',
      imageMeta: {
        fileName: 'ABC_Pvt_Ltd_GST_Certificate_2026.svg',
        dimensions: '1200 × 800 px',
        fileSize: '184 KB',
        docType: 'GSTIN Certificate (33AABCA1234F1Z5)',
        badgeText: 'GSTIN: 33AABCA1234F1Z5',
        issuer: 'Government of India — Commercial Taxes Department',
        entityName: 'ABC Pvt Ltd, Chennai',
        stampColor: '#1262E0',
      },
    },
    {
      id: 'job-img-002',
      category: 'Image Validations',
      recordName: 'New Branch Setup',
      recordId: 'deal-006',
      collection: 'deals',
      module: 'Deals',
      layout: 'Standard Deal Layout',
      processName: 'Site Inspection & Signed PO Image Check',
      fieldName: 'Signed Purchase Order Scan',
      status: 'Waiting for Validation',
      decision: 'Pending',
      createdBy: 'u4',
      assignedTo: 'u1',
      submittedAt: '2026-10-08T14:50:00',
      legacySection: 'Assigned Jobs',
      imageMeta: {
        fileName: 'BrightFuture_Signed_PO_Scan.svg',
        dimensions: '1400 × 960 px',
        fileSize: '242 KB',
        docType: 'Signed Purchase Order #BF-2026-441',
        badgeText: 'PO VALUE: ₹9,80,000.00',
        issuer: 'Bright Future Pvt Ltd — Bangalore HQ',
        entityName: 'Authorized Signatory: Anitha N',
        stampColor: '#0E9F6E',
      },
    },
    {
      id: 'job-img-003',
      category: 'Image Validations',
      recordName: 'Skyline Solutions',
      recordId: 'acc-010',
      collection: 'accounts',
      module: 'Accounts',
      layout: 'Partner Account Layout',
      processName: 'Partner Trade License Image Verification',
      fieldName: 'Certificate of Incorporation',
      status: 'Accepted',
      decision: 'Accepted',
      createdBy: 'u2',
      assignedTo: 'u1',
      submittedAt: '2026-10-03T10:15:00',
      reviewedBy: 'u1',
      reviewedAt: '2026-10-03T12:40:00',
      reviewComment: 'Clear scan; CIN and registered Mumbai address match account record.',
      legacySection: 'Completed Jobs',
      imageMeta: {
        fileName: 'Skyline_COI_Verified.svg',
        dimensions: '1200 × 800 px',
        fileSize: '196 KB',
        docType: 'Certificate of Incorporation (U45200MH2018PTC)',
        badgeText: 'VERIFIED BY COMPLIANCE',
        issuer: 'Ministry of Corporate Affairs — ROC Mumbai',
        entityName: 'Skyline Solutions Pvt Ltd',
        stampColor: '#7C3AED',
      },
    },
  ];
}

export function seedMyJobsLogs() {
  return [
    {
      id: 'jlog-001',
      jobId: 'job-rev-004',
      category: 'Reviews',
      recordName: 'Annual Support Renewal',
      recordId: 'deal-005',
      module: 'Deals',
      processName: 'High-Value Deal Field Review',
      action: 'Accepted Review',
      userId: 'u1',
      timestamp: '2026-10-06T16:30:00',
      comment: 'Verified signed renewal order with Prime Tech finance team.',
    },
    {
      id: 'jlog-002',
      jobId: 'job-app-004',
      category: 'Approvals',
      recordName: 'Custom Development',
      recordId: 'deal-010',
      module: 'Deals',
      processName: 'Fast-Track SOW Approval',
      action: 'Approved Request',
      userId: 'u1',
      timestamp: '2026-10-05T14:15:00',
      comment: 'Approved fixed-bid SOW after technical architecture sign-off.',
    },
    {
      id: 'jlog-003',
      jobId: 'job-bp-004',
      category: 'Blueprint Transitions',
      recordName: 'Bright Future',
      recordId: 'acc-006',
      module: 'Accounts',
      processName: 'Account Reactivation Blueprint',
      action: 'Applied Transition (Active)',
      userId: 'u1',
      timestamp: '2026-10-04T15:20:00',
      comment: 'Completed transition "Reactivate Prospect" after Q4 branch expansion call.',
    },
    {
      id: 'jlog-004',
      jobId: 'job-img-003',
      category: 'Image Validations',
      recordName: 'Skyline Solutions',
      recordId: 'acc-010',
      module: 'Accounts',
      processName: 'Partner Trade License Image Verification',
      action: 'Accepted Image',
      userId: 'u1',
      timestamp: '2026-10-03T12:40:00',
      comment: 'Clear scan; CIN and registered Mumbai address match account record.',
    },
  ];
}

const CITY_STATE_ZIP = {
  Chennai: { state: 'Tamil Nadu', zip: '600002', street: 'Anna Salai, Teynampet' },
  Bangalore: { state: 'Karnataka', zip: '560001', street: 'MG Road, Indiranagar' },
  Hyderabad: { state: 'Telangana', zip: '500081', street: 'HITEC City Main Road' },
  Mumbai: { state: 'Maharashtra', zip: '400051', street: 'Bandra Kurla Complex' },
  Pune: { state: 'Maharashtra', zip: '411001', street: 'Senapati Bapat Road' },
  Delhi: { state: 'Delhi NCR', zip: '110001', street: 'Connaught Place' },
  Coimbatore: { state: 'Tamil Nadu', zip: '641018', street: 'Avinashi Road' },
  Kochi: { state: 'Kerala', zip: '682030', street: 'Infopark Expressway' },
  Ahmedabad: { state: 'Gujarat', zip: '380015', street: 'SG Highway' },
  Kolkata: { state: 'West Bengal', zip: '700091', street: 'Salt Lake Sector V' },
};

const TAG_POOL = [
  ['Enterprise', 'Decision Maker'],
  ['Q4 Priority', 'VIP'],
  ['Champion'],
  ['Technical Buyer', 'Cloud'],
  ['Renewal'],
  ['Executive Sponsor'],
];

export function enrichContactsAndRelations(contacts, accounts, deals, calls, invoices) {
  const accById = Object.fromEntries(accounts.map((a) => [a.id, a]));
  const femaleFirst = new Set(['Priya', 'Divya', 'Meera', 'Anitha', 'Lakshmi', 'Sneha', 'Kavya', 'Pooja', 'Neha', 'Swathi', 'Nandini']);

  contacts.forEach((c, idx) => {
    const parts = String(c.name || '').trim().split(/\s+/);
    const firstName = parts[0] || 'Contact';
    const lastName = parts.slice(1).join(' ') || 'User';
    const salutation = femaleFirst.has(firstName) ? (idx % 2 === 0 ? 'Ms.' : 'Mrs.') : (idx % 11 === 0 ? 'Dr.' : 'Mr.');
    const acc = accById[c.accountId];
    const city = acc?.location || 'Chennai';
    const geo = CITY_STATE_ZIP[city] || CITY_STATE_ZIP.Chennai;
    const flat = `Suite ${101 + (idx % 40) * 10}, ${acc?.name?.split(' ')[0] || 'Cyber'} Tower`;

    const otherCities = ['Bangalore', 'Mumbai', 'Hyderabad', 'Chennai', 'Pune'];
    const otherCity = otherCities[(idx + 2) % otherCities.length];
    const otherGeo = CITY_STATE_ZIP[otherCity] || CITY_STATE_ZIP.Bangalore;
    const otherFlat = `Unit ${20 + (idx % 15)}, Regional Annex`;

    c.salutation = c.salutation || salutation;
    c.firstName = c.firstName || firstName;
    c.lastName = c.lastName || lastName;
    c.createdBy = c.createdBy || c.ownerId || 'u1';
    c.createdTime = c.createdTime || c.createdOn || '2026-06-15';
    c.modifiedBy = c.modifiedBy || c.ownerId || 'u1';
    c.modifiedTime = c.modifiedTime || c.lastContacted || c.createdOn || '2026-10-08';
    c.lastActivityTime = c.lastActivityTime || c.lastContacted || c.createdOn || '2026-10-09';
    c.dateOfBirth = c.dateOfBirth || `19${82 + (idx % 16)}-${String((idx % 12) + 1).padStart(2, '0')}-${String((idx % 27) + 1).padStart(2, '0')}`;
    c.connectedTo = c.connectedTo || USERS[(idx + 1) % USERS.length].id;
    c.reportingToId = c.reportingToId !== undefined ? c.reportingToId : (idx > 0 && idx % 3 !== 0 ? contacts[0].id : idx === 0 ? 'con-011' : '');

    // Phones & Emails
    c.mobile = c.mobile || `+91 9840${idx % 10} ${String(10000 + idx * 37).slice(0, 5)}`;
    c.homePhone = c.homePhone || `+91 44 281${idx % 10} ${String(2000 + idx * 19).slice(0, 4)}`;
    c.otherPhone = c.otherPhone || (idx % 2 === 0 ? `+91 80 412${idx % 10} ${String(3000 + idx * 23).slice(0, 4)}` : '');
    c.secondaryEmail = c.secondaryEmail || (idx % 3 !== 2 ? `${firstName.toLowerCase()}.${lastName.toLowerCase() || 'work'}.alt@enterprise.in` : '');
    c.assistant = c.assistant || (idx < 16 || idx % 4 === 0 ? ['Deepa K', 'Sathish M', 'Nandini V', 'Ramesh B'][idx % 4] : '');
    c.asstPhone = c.asstPhone || (c.assistant ? `+91 9841${idx % 10} ${String(40000 + idx * 41).slice(0, 5)}` : '');
    c.fax = c.fax || (idx % 3 === 0 ? `+91 44 2811 ${String(8000 + idx).slice(0, 4)}` : '');

    // Mailing Address (structured + compound)
    c.mailingFlat = c.mailingFlat || flat;
    c.mailingStreet = c.mailingStreet || geo.street;
    c.mailingCity = c.mailingCity || city;
    c.mailingState = c.mailingState || geo.state;
    c.mailingZip = c.mailingZip || geo.zip;
    c.mailingCountry = c.mailingCountry || 'India';
    c.mailingAddress = c.mailingAddress || `${c.mailingFlat}, ${c.mailingStreet}, ${c.mailingCity}, ${c.mailingState} ${c.mailingZip}, ${c.mailingCountry}`;

    // Other Address (structured + compound)
    c.otherFlat = c.otherFlat || otherFlat;
    c.otherStreet = c.otherStreet || otherGeo.street;
    c.otherCity = c.otherCity || otherCity;
    c.otherState = c.otherState || otherGeo.state;
    c.otherZip = c.otherZip || otherGeo.zip;
    c.otherCountry = c.otherCountry || 'India';
    c.otherAddress = c.otherAddress || `${c.otherFlat}, ${c.otherStreet}, ${c.otherCity}, ${c.otherState} ${c.otherZip}, ${c.otherCountry}`;

    // Social, Tags, Vendor, Unsubscribe, Cadence, Campaign
    c.skypeId = c.skypeId || `live:${firstName.toLowerCase()}_${lastName.toLowerCase() || idx}`;
    c.twitter = c.twitter || `@${firstName.toLowerCase()}_${lastName.toLowerCase() || idx}`;
    c.tags = c.tags || TAG_POOL[idx % TAG_POOL.length];
    c.tag = c.tags.join(', ');
    c.vendorName = c.vendorName !== undefined ? c.vendorName : (idx % 3 === 0 ? VENDORS[idx % VENDORS.length] : '');
    if (idx === 5 || idx === 14) c.emailOptOut = true;
    c.unsubscribedMode = c.emailOptOut ? 'Opt-Out Link' : '';
    c.unsubscribedTime = c.emailOptOut ? '2026-09-22' : '';
    c.cadenceName = ['Contacted', 'Engaged'].includes(c.lifecycle) ? 'Enterprise Q4 Follow-up Cadence' : '';
    c.campaigns = ['Website', 'Conference', 'Trade Show'].includes(c.leadSource) ? ['Zoho CRM Enterprise Summit 2026'] : [];
    c.description = c.description || `${c.designation} at ${acc?.name || 'Enterprise Account'} (${c.mailingCity}).`;
    if (idx < 6 || idx % 5 === 0) c.touched = true;

    // Website Activity (Category 2)
    c.averageTimeSpent = c.averageTimeSpent ?? Math.round(((idx * 13 + 17) % 150) + 5);
    c.daysVisited = c.daysVisited ?? (((idx * 3 + 2) % 28) + 1);
    c.firstPageVisited = c.firstPageVisited || ['/pricing', '/solutions/enterprise', '/home', '/demo-request', '/features/crm', '/resources/whitepaper'][idx % 6];
    c.firstVisit = c.firstVisit || `2026-0${(idx % 4) + 4}-${String((idx % 25) + 1).padStart(2, '0')}`;
    c.mostRecentVisit = c.mostRecentVisit || `2026-09-${String((idx % 28) + 1).padStart(2, '0')}`;
    c.numberOfChats = c.numberOfChats ?? (idx % 4 === 0 ? 0 : ((idx % 6) + 1));
    c.referrer = c.referrer || ['Google Organic', 'LinkedIn Ads', 'Direct Traffic', 'Partner Referral', 'Product Hunt', 'Email Campaign'][idx % 6];
    c.visitorScore = c.visitorScore ?? (10 + ((idx * 17) % 85));

    // System Defined Filters enhancements (Category 1)
    c.emailSentiment = c.emailSentiment || ['Positive', 'Neutral', 'Positive', 'Negative', 'Positive'][idx % 5];
    c.scoringRules = c.scoringRules ?? (15 + ((idx * 19) % 85));
    c.websiteActivity = c.websiteActivity !== undefined ? c.websiteActivity : (idx % 5 !== 0);

    // Filter By Fields aliases & properties (Category 3)
    c.accountName = acc?.name || '';
    c.associatedAccounts = c.associatedAccounts || [acc?.name, accounts[(idx + 4) % accounts.length]?.name].filter(Boolean).join(', ');
    c.city = c.city || c.mailingCity || city;
    c.clientName = c.clientName || c.name;
    c.contactName = c.name;
    c.contactOwner = c.ownerId;
    c.leadManager1 = c.leadManager1 || USERS[(idx + 1) % USERS.length].id;
    c.socialLeadId = c.socialLeadId || `SL-${10000 + idx}`;
    c.vendorId = c.vendorId || (c.vendorName || VENDORS[idx % VENDORS.length]);
    c.contactToDeal = c.contactToDeal || (deals.find((d) => d.contactId === c.id)?.name || deals[idx % deals.length]?.name || 'Enterprise Deployment');
  });

  // Ensure Invoices also link directly to the primary contact of their account so Related Module: Invoices works seamlessly
  const firstContactByAcc = {};
  contacts.forEach((c) => {
    if (c.accountId && !firstContactByAcc[c.accountId]) firstContactByAcc[c.accountId] = c.id;
  });
  invoices.forEach((inv) => {
    if (!inv.contactId && inv.accountId && firstContactByAcc[inv.accountId]) {
      inv.contactId = firstContactByAcc[inv.accountId];
    }
  });

  // Build normalized related records for all 17 Related Modules
  const dealContactRoles = deals.slice(0, 60).map((d, i) => ({
    id: `dcr-${String(i + 1).padStart(3, '0')}`,
    contactId: d.contactId,
    dealId: d.id,
    dealName: d.name,
    role: ['Decision Maker', 'Executive Sponsor', 'Evaluator', 'Procurement'][i % 4],
    status: ['Decision Maker', 'Executive Sponsor', 'Evaluator', 'Procurement'][i % 4],
    ownerId: d.ownerId,
    createdDate: d.createdOn,
    updatedDate: '2026-10-08',
  }));

  const tasks = [
    { id: 'ctask-001', contactId: 'con-001', title: 'Send Enterprise SLA Deck to Priya Sharma', status: 'Overdue', dueDate: '2026-10-04', ownerId: 'u1', createdDate: '2026-10-01', updatedDate: '2026-10-04' },
    { id: 'ctask-002', contactId: 'con-002', title: 'Follow up with Rahul Menon on textile ERP scope', status: 'Open', dueDate: '2026-10-14', ownerId: 'u2', createdDate: '2026-10-05', updatedDate: '2026-10-08' },
    { id: 'ctask-003', contactId: 'con-003', title: 'Prepare architecture review for Karthik Raja', status: 'Completed', dueDate: '2026-10-06', ownerId: 'u1', createdDate: '2026-10-02', updatedDate: '2026-10-06' },
    { id: 'ctask-004', contactId: 'con-004', title: 'Share security compliance checklist with Divya Nair', status: 'Overdue', dueDate: '2026-10-03', ownerId: 'u2', createdDate: '2026-09-29', updatedDate: '2026-10-03' },
    { id: 'ctask-005', contactId: 'con-005', title: 'Quarterly account review prep with Suresh Babu', status: 'Completed', dueDate: '2026-10-05', ownerId: 'u1', createdDate: '2026-10-01', updatedDate: '2026-10-05' },
    { id: 'ctask-006', contactId: 'con-011', title: 'Verify ABC Pvt Ltd PO details with Ravi Sharma', status: 'Completed', dueDate: '2026-10-07', ownerId: 'u1', createdDate: '2026-10-03', updatedDate: '2026-10-07' },
    { id: 'ctask-007', contactId: 'con-012', title: 'Cloud migration pricing sign-off with Priya Singh', status: 'Open', dueDate: '2026-10-16', ownerId: 'u2', createdDate: '2026-10-08', updatedDate: '2026-10-09' },
  ];

  const meetings = [
    { id: 'cmtg-001', contactId: 'con-001', title: 'Q4 Executive Alignment — Acme Technologies', status: 'Upcoming', meetingDate: '2026-10-15', ownerId: 'u1', createdDate: '2026-10-05', updatedDate: '2026-10-08' },
    { id: 'cmtg-002', contactId: 'con-003', title: 'Technical Deep Dive — Innovate Labs', status: 'Upcoming', meetingDate: '2026-10-18', ownerId: 'u1', createdDate: '2026-10-06', updatedDate: '2026-10-09' },
    { id: 'cmtg-003', contactId: 'con-004', title: 'NextGen Solutions Roadmap Review', status: 'Completed', meetingDate: '2026-10-04', ownerId: 'u2', createdDate: '2026-09-28', updatedDate: '2026-10-04' },
    { id: 'cmtg-004', contactId: 'con-011', title: 'ABC Pvt Ltd Kickoff Workshop', status: 'Upcoming', meetingDate: '2026-10-12', ownerId: 'u1', createdDate: '2026-10-02', updatedDate: '2026-10-08' },
    { id: 'cmtg-005', contactId: 'con-012', title: 'XYZ Solutions Procurement Sync', status: 'Upcoming', meetingDate: '2026-10-20', ownerId: 'u2', createdDate: '2026-10-07', updatedDate: '2026-10-09' },
    { id: 'cmtg-006', contactId: 'con-015', title: 'Prime Tech Annual Renewal Briefing', status: 'Completed', meetingDate: '2026-09-25', ownerId: 'u2', createdDate: '2026-09-18', updatedDate: '2026-09-25' },
  ];

  const invitees = meetings.map((m, i) => ({
    id: `cinv-${String(i + 1).padStart(3, '0')}`,
    contactId: m.contactId,
    meetingId: m.id,
    title: m.title,
    status: i % 2 === 0 ? 'Accepted' : 'Invited',
    ownerId: m.ownerId,
    createdDate: m.createdDate,
    updatedDate: m.updatedDate,
  }));

  const emails = [
    { id: 'ceml-001', contactId: 'con-001', subject: 'Re: Enterprise CRM Deployment Proposal', direction: 'Received', status: 'Opened', ownerId: 'u1', createdDate: '2026-10-09', updatedDate: '2026-10-09' },
    { id: 'ceml-002', contactId: 'con-001', subject: 'Acme Technologies Commercial Proposal v2', direction: 'Sent', status: 'Clicked', ownerId: 'u1', createdDate: '2026-10-08', updatedDate: '2026-10-08' },
    { id: 'ceml-003', contactId: 'con-002', subject: 'Introductory Deck — Zenith Textiles', direction: 'Sent', status: 'Delivered', ownerId: 'u2', createdDate: '2026-10-07', updatedDate: '2026-10-07' },
    { id: 'ceml-004', contactId: 'con-004', subject: 'Re: Security Questionnaire Responses', direction: 'Received', status: 'Opened', ownerId: 'u2', createdDate: '2026-10-09', updatedDate: '2026-10-09' },
    { id: 'ceml-005', contactId: 'con-011', subject: 'Signed Master Services Agreement — ABC Pvt Ltd', direction: 'Received', status: 'Clicked', ownerId: 'u1', createdDate: '2026-10-08', updatedDate: '2026-10-09' },
    { id: 'ceml-006', contactId: 'con-012', subject: 'Cloud Migration Estimate Breakdown', direction: 'Sent', status: 'Opened', ownerId: 'u2', createdDate: '2026-10-06', updatedDate: '2026-10-07' },
    { id: 'ceml-007', contactId: 'con-013', subject: 'Re: IT Infrastructure Upgrade Timeline', direction: 'Received', status: 'Opened', ownerId: 'u3', createdDate: '2026-10-08', updatedDate: '2026-10-08' },
    { id: 'ceml-008', contactId: 'con-006', subject: 'Quarterly Product Update Newsletter', direction: 'Sent', status: 'Bounced', ownerId: 'u2', createdDate: '2026-10-05', updatedDate: '2026-10-05' },
  ];

  const cases = [
    { id: 'ccase-001', contactId: 'con-001', caseNumber: 'CASE-2026-101', subject: 'SSO SAML Configuration Assistance', status: 'Open', ownerId: 'u1', createdDate: '2026-10-07', updatedDate: '2026-10-09' },
    { id: 'ccase-002', contactId: 'con-005', caseNumber: 'CASE-2026-102', subject: 'API Rate Limit Upgrade Request', status: 'Escalated', ownerId: 'u1', createdDate: '2026-10-05', updatedDate: '2026-10-08' },
    { id: 'ccase-003', contactId: 'con-011', caseNumber: 'CASE-2026-103', subject: 'Custom Role Permission Mapping', status: 'Closed', ownerId: 'u1', createdDate: '2026-09-22', updatedDate: '2026-09-29' },
    { id: 'ccase-004', contactId: 'con-012', caseNumber: 'CASE-2026-104', subject: 'Sandbox Data Migration Validation', status: 'Open', ownerId: 'u2', createdDate: '2026-10-08', updatedDate: '2026-10-09' },
  ];

  const contactProducts = [
    { id: 'cprod-001', contactId: 'con-001', productName: 'Honey One CRM Enterprise Edition (250 Seats)', status: 'Active', amount: 1850000, ownerId: 'u1', createdDate: '2026-06-10', updatedDate: '2026-10-01' },
    { id: 'cprod-002', contactId: 'con-003', productName: 'Workflow Automation Add-On Pack', status: 'Trial', amount: 420000, ownerId: 'u1', createdDate: '2026-09-15', updatedDate: '2026-10-05' },
    { id: 'cprod-003', contactId: 'con-011', productName: 'Honey One CRM Ultimate Suite', status: 'Active', amount: 1250000, ownerId: 'u1', createdDate: '2026-09-01', updatedDate: '2026-10-08' },
    { id: 'cprod-004', contactId: 'con-015', productName: 'Priority 24x7 Dedicated Support SLA', status: 'Active', amount: 3000000, ownerId: 'u2', createdDate: '2026-09-12', updatedDate: '2026-10-06' },
  ];

  const quotes = [
    { id: 'cquo-001', contactId: 'con-001', quoteNumber: 'QT-2026-081', subject: 'Acme Enterprise License Expansion', amount: 1850000, status: 'Delivered', ownerId: 'u1', createdDate: '2026-10-02', updatedDate: '2026-10-08' },
    { id: 'cquo-002', contactId: 'con-011', quoteNumber: 'QT-2026-082', subject: 'ABC Pvt Ltd CRM Setup Quote', amount: 1250000, status: 'Accepted', ownerId: 'u1', createdDate: '2026-09-14', updatedDate: '2026-10-01' },
    { id: 'cquo-003', contactId: 'con-012', quoteNumber: 'QT-2026-083', subject: 'XYZ Cloud Migration Quote', amount: 875000, status: 'Draft', ownerId: 'u2', createdDate: '2026-10-05', updatedDate: '2026-10-09' },
    { id: 'cquo-004', contactId: 'con-013', quoteNumber: 'QT-2026-084', subject: 'Tech Corp Infrastructure Quote', amount: 2500000, status: 'Delivered', ownerId: 'u3', createdDate: '2026-09-28', updatedDate: '2026-10-07' },
  ];

  const salesOrders = [
    { id: 'cso-001', contactId: 'con-001', soNumber: 'SO-2026-301', subject: 'Acme Annual Subscription Order', amount: 1850000, status: 'Approved', ownerId: 'u1', createdDate: '2026-10-04', updatedDate: '2026-10-08' },
    { id: 'cso-002', contactId: 'con-011', soNumber: 'SO-2026-302', subject: 'ABC Pvt Ltd Implementation Order', amount: 1250000, status: 'Fulfilled', ownerId: 'u1', createdDate: '2026-09-20', updatedDate: '2026-10-05' },
    { id: 'cso-003', contactId: 'con-015', soNumber: 'SO-2026-303', subject: 'Prime Tech Support Renewal Order', amount: 3000000, status: 'Fulfilled', ownerId: 'u2', createdDate: '2026-09-25', updatedDate: '2026-10-06' },
  ];

  const purchaseOrders = [
    { id: 'cpo-001', contactId: 'con-001', poNumber: 'PO-ACME-9012', subject: 'Cloud Hosting Procurement Order', amount: 640000, status: 'Issued', ownerId: 'u1', createdDate: '2026-10-03', updatedDate: '2026-10-08' },
    { id: 'cpo-002', contactId: 'con-005', poNumber: 'PO-GLB-4410', subject: 'Global Systems Hardware Appliance PO', amount: 920000, status: 'Approved', ownerId: 'u1', createdDate: '2026-09-29', updatedDate: '2026-10-07' },
    { id: 'cpo-003', contactId: 'con-011', poNumber: 'PO-ABC-7781', subject: 'ABC Pvt Ltd License PO', amount: 1250000, status: 'Delivered', ownerId: 'u1', createdDate: '2026-09-18', updatedDate: '2026-10-02' },
  ];

  const notes = [
    { id: 'cnote-001', contactId: 'con-001', title: 'Executive Sponsor Note', content: 'Priya prefers Tuesday morning check-ins and consolidated billing.', status: 'Pinned', ownerId: 'u1', createdDate: '2026-10-04', updatedDate: '2026-10-08' },
    { id: 'cnote-002', contactId: 'con-004', title: 'Security Review Requirement', content: 'Requires ISO 27001 certificate attachment with final proposal.', status: 'Active', ownerId: 'u2', createdDate: '2026-10-05', updatedDate: '2026-10-08' },
    { id: 'cnote-003', contactId: 'con-011', title: 'Chennai HQ Visit Summary', content: 'Met Ravi Sharma at Chennai office; approved Phase 1 rollout.', status: 'Active', ownerId: 'u1', createdDate: '2026-10-06', updatedDate: '2026-10-09' },
  ];

  const connectedLeads = [
    { id: 'clead-001', contactId: 'con-002', leadName: 'Rohit Verma — Zenith Spinning Unit', status: 'Warm', ownerId: 'u2', createdDate: '2026-09-25', updatedDate: '2026-10-06' },
    { id: 'clead-002', contactId: 'con-004', leadName: 'Kiran Rao — NextGen Analytics Division', status: 'Hot', ownerId: 'u2', createdDate: '2026-10-01', updatedDate: '2026-10-08' },
    { id: 'clead-003', contactId: 'con-013', leadName: 'Sanjay Mehta — Tech Corp Subsidiary', status: 'Pre-Qualified', ownerId: 'u3', createdDate: '2026-10-03', updatedDate: '2026-10-09' },
  ];

  const convertedLeads = [
    { id: 'cconv-001', contactId: 'con-001', leadName: 'Priya Sharma (Inbound Website Inquiry)', status: 'Converted', ownerId: 'u1', createdDate: '2026-03-10', updatedDate: '2026-03-14' },
    { id: 'cconv-002', contactId: 'con-005', leadName: 'Suresh Babu (Chennai Tech Summit Lead)', status: 'Converted', ownerId: 'u1', createdDate: '2026-05-12', updatedDate: '2026-05-19' },
    { id: 'cconv-003', contactId: 'con-011', leadName: 'Ravi Sharma (Partner Referral)', status: 'Converted', ownerId: 'u1', createdDate: '2026-08-25', updatedDate: '2026-09-01' },
    { id: 'cconv-004', contactId: 'con-012', leadName: 'Priya Singh (Enterprise Trial Signup)', status: 'Converted', ownerId: 'u2', createdDate: '2026-09-01', updatedDate: '2026-09-05' },
  ];

  const campaigns = contacts
    .filter((c) => c.campaigns?.length)
    .slice(0, 40)
    .map((c, i) => ({
      id: `ccamp-${String(i + 1).padStart(3, '0')}`,
      contactId: c.id,
      campaignName: 'Zoho CRM Enterprise Summit 2026',
      status: 'Active',
      ownerId: c.ownerId,
      createdDate: '2026-09-15',
    }));

  const cadences = contacts
    .filter((c) => c.cadenceName)
    .slice(0, 40)
    .map((c, i) => ({
      id: `ccad-${String(i + 1).padStart(3, '0')}`,
      contactId: c.id,
      cadenceName: c.cadenceName,
      status: 'Active',
      ownerId: c.ownerId,
      createdDate: '2026-09-20',
    }));

  const estimates = [
    { id: 'cest-001', contactId: 'con-001', estimateNumber: 'EST-2026-001', subject: 'Acme Enterprise Migration Estimate', amount: 2400000, status: 'Sent', ownerId: 'u1', createdDate: '2026-10-01', updatedDate: '2026-10-08' },
    { id: 'cest-002', contactId: 'con-002', estimateNumber: 'EST-2026-002', subject: 'Zenith Production ERP Pilot Estimate', amount: 1600000, status: 'Accepted', ownerId: 'u2', createdDate: '2026-10-03', updatedDate: '2026-10-08' },
    { id: 'cest-003', contactId: 'con-004', estimateNumber: 'EST-2026-003', subject: 'NextGen Analytics Infrastructure Estimate', amount: 3100000, status: 'Draft', ownerId: 'u2', createdDate: '2026-10-05', updatedDate: '2026-10-09' },
    { id: 'cest-004', contactId: 'con-011', estimateNumber: 'EST-2026-004', subject: 'ABC Pvt Ltd Licensing Expansion Estimate', amount: 1950000, status: 'Sent', ownerId: 'u1', createdDate: '2026-10-06', updatedDate: '2026-10-08' },
  ];

  const voCEvents = [
    { id: 'cvoce-001', contactId: 'con-001', eventName: 'Annual Executive Satisfaction Survey', eventType: 'Survey', status: 'Completed', ownerId: 'u1', createdDate: '2026-09-28', updatedDate: '2026-10-02' },
    { id: 'cvoce-002', contactId: 'con-003', eventName: 'Beta Product Feedback Session', eventType: 'Interview', status: 'Scheduled', ownerId: 'u1', createdDate: '2026-10-04', updatedDate: '2026-10-07' },
    { id: 'cvoce-003', contactId: 'con-011', eventName: 'Onboarding Checkpoint NPS Survey', eventType: 'Survey', status: 'Completed', ownerId: 'u1', createdDate: '2026-09-30', updatedDate: '2026-10-05' },
  ];

  const voCKeywords = [
    { id: 'cvock-001', contactId: 'con-001', keyword: 'high performance', sentiment: 'Positive', mentions: 4, ownerId: 'u1', createdDate: '2026-10-02', updatedDate: '2026-10-08' },
    { id: 'cvock-002', contactId: 'con-002', keyword: 'pricing flexibility', sentiment: 'Neutral', mentions: 2, ownerId: 'u2', createdDate: '2026-10-04', updatedDate: '2026-10-06' },
    { id: 'cvock-003', contactId: 'con-004', keyword: 'fast support response', sentiment: 'Positive', mentions: 5, ownerId: 'u2', createdDate: '2026-10-07', updatedDate: '2026-10-09' },
    { id: 'cvock-004', contactId: 'con-011', keyword: 'seamless migration', sentiment: 'Positive', mentions: 3, ownerId: 'u1', createdDate: '2026-10-05', updatedDate: '2026-10-08' },
  ];

  const voCResponses = [
    { id: 'cvocr-001', contactId: 'con-001', responseType: 'NPS Rating: 10/10 Promoter', score: 10, sentiment: 'Positive', status: 'Reviewed', ownerId: 'u1', createdDate: '2026-09-29', updatedDate: '2026-10-01' },
    { id: 'cvocr-002', contactId: 'con-004', responseType: 'CSAT: Very Satisfied', score: 9, sentiment: 'Positive', status: 'Reviewed', ownerId: 'u2', createdDate: '2026-10-05', updatedDate: '2026-10-06' },
    { id: 'cvocr-003', contactId: 'con-011', responseType: 'NPS Rating: 9/10 Promoter', score: 9, sentiment: 'Positive', status: 'Reviewed', ownerId: 'u1', createdDate: '2026-10-01', updatedDate: '2026-10-04' },
  ];

  const whatsappMessages = [
    { id: 'cwa-001', contactId: 'con-001', message: 'Hello Priya, SLA documentation has been shared via email.', direction: 'Outbound', status: 'Delivered', ownerId: 'u1', createdDate: '2026-10-08', updatedDate: '2026-10-08' },
    { id: 'cwa-002', contactId: 'con-002', message: 'Hi Rahul, confirming our follow-up demo meeting tomorrow at 3 PM.', direction: 'Outbound', status: 'Read', ownerId: 'u2', createdDate: '2026-10-09', updatedDate: '2026-10-09' },
    { id: 'cwa-003', contactId: 'con-011', message: 'Thanks Arun, contract has been digitally countersigned.', direction: 'Inbound', status: 'Received', ownerId: 'u1', createdDate: '2026-10-09', updatedDate: '2026-10-09' },
  ];

  const zohoSignDocuments = [
    { id: 'czsd-001', contactId: 'con-001', documentName: 'Acme Enterprise Master Services Agreement', status: 'Completed', signStatus: 'Signed', ownerId: 'u1', createdDate: '2026-10-02', updatedDate: '2026-10-05' },
    { id: 'czsd-002', contactId: 'con-003', documentName: 'Innovate Labs Non-Disclosure Agreement (NDA)', status: 'In Progress', signStatus: 'Sent', ownerId: 'u1', createdDate: '2026-10-07', updatedDate: '2026-10-08' },
    { id: 'czsd-003', contactId: 'con-011', documentName: 'ABC Pvt Ltd Annual Subscription Agreement', status: 'Completed', signStatus: 'Signed', ownerId: 'u1', createdDate: '2026-10-08', updatedDate: '2026-10-09' },
  ];

  return {
    dealContactRoles,
    tasks,
    meetings,
    invitees,
    emails,
    cases,
    contactProducts,
    quotes,
    salesOrders,
    purchaseOrders,
    notes,
    connectedLeads,
    convertedLeads,
    campaigns,
    cadences,
    estimates,
    voCEvents,
    voCKeywords,
    voCResponses,
    whatsappMessages,
    zohoSignDocuments,
  };
}

export function seedSavedContactViews() {
  return [
    {
      id: 'view-chennai-arun',
      name: 'Arun — Chennai Active Contacts',
      shared: true,
      createdBy: 'u1',
      systemFilters: [],
      fieldFilters: [
        { field: 'ownerId', operator: 'Is', value: 'Arun Kumar', type: 'lookup' },
        { field: 'mailingCity', operator: 'Is', value: 'Chennai', type: 'text' },
        { field: 'emailOptOut', operator: 'No', value: 'No', type: 'boolean' },
      ],
      relatedFilters: [],
      globalJoin: 'AND',
    },
    {
      id: 'view-open-deals',
      name: 'Contacts with Open Deals',
      shared: true,
      createdBy: 'u1',
      systemFilters: [],
      fieldFilters: [],
      relatedFilters: [{ module: 'deals', mode: 'open_deal', enabled: true }],
      globalJoin: 'AND',
    },
  ];
}

const ACCOUNT_TAG_POOL = [
  ['Enterprise', 'Strategic'],
  ['Key Account', 'High Value'],
  ['Fast Growth'],
  ['Cloud First', 'Q4 Expansion'],
  ['Partner Network'],
  ['Fortune 500', 'Enterprise'],
];

const SIC_CODES = ['7371', '7372', '7373', '8742', '3571', '3661', '6021', '2834', '5045', '4813'];

export function enrichAccountsAndRelations(accounts, contacts, deals, calls, invoices, contactRelations = {}) {
  // Parent-Child-SubAccount hierarchy map (no circular links)
  const parentMap = {
    'acc-004': 'acc-001', // Global Systems -> child of ABC Pvt Ltd
    'acc-008': 'acc-001', // Vision Corp -> child of ABC Pvt Ltd
    'acc-011': 'acc-004', // Acme Technologies -> sub-account of ABC Pvt Ltd via Global Systems
    'acc-018': 'acc-004', // GreenLeaf Tech -> sub-account of ABC Pvt Ltd via Global Systems
    'acc-009': 'acc-003', // Innovate Tech -> child of Tech Corp
    'acc-016': 'acc-003', // DataSense Inc -> child of Tech Corp
    'acc-010': 'acc-005', // Skyline Solutions -> child of Prime Tech
    'acc-014': 'acc-005', // Vertex Global -> child of Prime Tech
  };

  // Ensure ABC Pvt Ltd and several Chennai accounts use "Information Technology" so the Section 4 example filter works out of the box
  if (accounts[0]) accounts[0].industry = 'Information Technology';

  accounts.forEach((a, idx) => {
    const city = a.location || 'Chennai';
    const geo = CITY_STATE_ZIP[city] || CITY_STATE_ZIP.Chennai;
    const shipCities = Object.keys(CITY_STATE_ZIP);
    const shipCity = idx % 4 === 0 ? city : shipCities[(idx + 2) % shipCities.length];
    const shipGeo = CITY_STATE_ZIP[shipCity] || geo;

    a.accountNumber = a.accountNumber || `ACC-${String(1001 + idx)}`;
    a.accountSite = a.accountSite || `${city} ${idx % 3 === 0 ? 'Global HQ' : idx % 3 === 1 ? 'Regional Office' : 'Tech Campus'}`;
    a.parentAccountId = parentMap[a.id] || (idx >= 20 && idx < 35 ? `acc-${String((idx % 5) + 1).padStart(3, '0')}` : '');

    if (idx >= 18 && idx % 9 === 0 && a.location === 'Chennai' && a.type === 'Customer') {
      a.industry = 'Information Technology';
    }

    a.employees = a.employees || (50 + ((idx * 37) % 2450));
    a.ownership = a.ownership || ACCOUNT_OWNERSHIPS[idx % ACCOUNT_OWNERSHIPS.length];
    a.rating = a.rating || (a.status === 'Active' ? ACCOUNT_RATINGS[idx % 4] : 'Cold');
    a.sicCode = a.sicCode || SIC_CODES[idx % SIC_CODES.length];
    const cleanAlpha = a.name.replace(/[^A-Za-z]/g, '').toUpperCase();
    a.tickerSymbol = a.tickerSymbol || (a.ownership === 'Public' || idx < 15 ? cleanAlpha.slice(0, 4).padEnd(4, 'X') : '');
    a.fax = a.fax || (idx % 3 === 0 ? `+91 44 24${String(10 + (idx % 89))}${String(100 + (idx % 899))}` : '');

    // Billing Address (6 subfields + combined)
    a.billingFlat = a.billingFlat || `Tower ${String.fromCharCode(65 + (idx % 6))}, Floor ${(idx % 12) + 1}`;
    a.billingStreet = a.billingStreet || geo.street;
    a.billingCity = a.billingCity || city;
    a.billingState = a.billingState || geo.state;
    a.billingZip = a.billingZip || String(Number(geo.zip) + (idx % 45));
    a.billingCountry = a.billingCountry || 'India';
    a.billingAddress = `${a.billingFlat}, ${a.billingStreet}, ${a.billingCity}, ${a.billingState} ${a.billingZip}, ${a.billingCountry}`;

    // Shipping Address (6 subfields + combined)
    a.shippingFlat = a.shippingFlat || `Unit ${(idx % 20) + 101}, Logistics Park`;
    a.shippingStreet = a.shippingStreet || shipGeo.street;
    a.shippingCity = a.shippingCity || shipCity;
    a.shippingState = a.shippingState || shipGeo.state;
    a.shippingZip = a.shippingZip || String(Number(shipGeo.zip) + (idx % 30));
    a.shippingCountry = a.shippingCountry || 'India';
    a.shippingAddress = `${a.shippingFlat}, ${a.shippingStreet}, ${a.shippingCity}, ${a.shippingState} ${a.shippingZip}, ${a.shippingCountry}`;

    // Audit & Lookup fields
    a.createdBy = a.createdBy || USERS[idx % USERS.length].id;
    a.modifiedBy = a.modifiedBy || USERS[(idx + 1) % USERS.length].id;
    a.connectedTo = a.connectedTo || USERS[(idx + 2) % USERS.length].id;
    a.createdTime = a.createdTime || a.createdOn || '2026-06-15';
    a.modifiedTime = a.modifiedTime || (idx % 2 === 0 ? '2026-10-08' : a.createdOn);
    a.lastActivityTime = a.lastActivityTime || (idx < 25 || idx % 3 === 0 ? `2026-10-0${(idx % 9) + 1}` : '2026-09-18');

    // Tags & System Filter flags
    a.tags = a.tags || (idx % 5 === 4 ? [] : ACCOUNT_TAG_POOL[idx % ACCOUNT_TAG_POOL.length]);
    a.locked = idx === 2 || idx === 7 || idx % 19 === 0;
    a.touched = idx < 12 || idx % 3 === 0;
    a.hasRecordAction = idx < 15 || idx % 4 === 0;
    a.cadenceName = idx % 3 === 0 ? 'Enterprise Account ABM Cadence' : idx % 7 === 0 ? 'Strategic Renewal Touchpoint' : '';
    a.cadenceStatus = a.cadenceName ? (idx % 6 === 0 ? 'Completed' : 'Active') : '';
    a.archived = false;
    a.privateRecord = idx % 13 === 0;

    // GST, Mobile & Indian Compliance Fields (Screenshot 1 & Screenshot 2)
    const stateCodeMap = {
      'Tamil Nadu': '33',
      Karnataka: '29',
      Maharashtra: '27',
      Kerala: '32',
      'Uttar Pradesh': '09',
      'West Bengal': '19',
      Delhi: '07',
      Gujarat: '24',
    };
    a.gstState = a.gstState || geo.state || 'Tamil Nadu';
    a.gstin =
      a.gstin ||
      a.gstNumber ||
      (idx % 11 === 0
        ? ''
        : `${stateCodeMap[a.gstState] || '33'}AA${cleanAlpha.slice(0, 3).padEnd(3, 'C')}0${String(100 + ((idx * 7) % 899))}${String.fromCharCode(65 + (idx % 26))}1Z${(idx % 9) + 1}`);
    a.gstNumber = a.gstin;
    a.gstTreatment =
      a.gstTreatment || (idx % 10 === 0 ? 'Unregistered Business' : 'Registered Business - Regular');
    a.mobile = a.mobile || (idx % 2 === 0 ? `91770${String(100000 + idx * 137).slice(0, 6)}` : '');
    a.clientName = a.clientName || `${a.name.split(' ')[0]} Direct`;
    a.emailId = a.emailId || a.email || `accounts@${domainOf(a.name)}`;
    a.email = a.emailId;
    a.leadManager1 = a.leadManager1 || (idx % 3 === 0 ? '' : USERS[(idx + 1) % USERS.length].id);
    a.legalName = a.legalName || `${a.name} Private Limited`;
    a.tradeName = a.tradeName || a.name;
    a.accountsToDeal = a.accountsToDeal || (deals.find((d) => d.accountId === a.id)?.name || '');
    a.associatedContacts = a.associatedContacts || (contacts.filter((c) => c.accountId === a.id).map((c) => c.name).slice(0, 3).join(', ') || 'Ravi Sharma');

    if (!a.description) {
      a.description = `${a.name} is a ${a.type.toLowerCase()} organization in the ${a.industry} sector headquartered in ${city}.`;
    }
  });

  const accountProducts = [
    { id: 'aprod-001', accountId: 'acc-001', productName: 'Honey One CRM Enterprise Suite', sku: 'HO-CRM-ENT', quantity: 250, amount: 1850000, status: 'Active', ownerId: 'u1', createdDate: '2026-09-02', updatedDate: '2026-10-05' },
    { id: 'aprod-002', accountId: 'acc-001', productName: 'AI Revenue Intelligence Add-on', sku: 'HO-AI-REV', quantity: 250, amount: 650000, status: 'Active', ownerId: 'u1', createdDate: '2026-09-15', updatedDate: '2026-10-07' },
    { id: 'aprod-003', accountId: 'acc-002', productName: 'Cloud Migration Sandbox', sku: 'HO-CLD-SBX', quantity: 50, amount: 420000, status: 'Trial', ownerId: 'u2', createdDate: '2026-09-10', updatedDate: '2026-10-04' },
    { id: 'aprod-004', accountId: 'acc-003', productName: 'Enterprise Security & SSO Pack', sku: 'HO-SEC-SSO', quantity: 500, amount: 2400000, status: 'Active', ownerId: 'u3', createdDate: '2026-09-12', updatedDate: '2026-10-08' },
    { id: 'aprod-005', accountId: 'acc-004', productName: 'Partner Co-Sell Portal License', sku: 'HO-PRT-CSL', quantity: 100, amount: 950000, status: 'Active', ownerId: 'u1', createdDate: '2026-09-14', updatedDate: '2026-10-06' },
    { id: 'aprod-006', accountId: 'acc-005', productName: '24x7 Dedicated SLA Support', sku: 'HO-SLA-247', quantity: 1, amount: 3000000, status: 'Renewed', ownerId: 'u2', createdDate: '2026-09-18', updatedDate: '2026-10-09' },
    { id: 'aprod-007', accountId: 'acc-007', productName: 'Workflow Automation Studio', sku: 'HO-WFL-PRO', quantity: 120, amount: 1120000, status: 'Active', ownerId: 'u5', createdDate: '2026-09-20', updatedDate: '2026-10-08' },
    { id: 'aprod-008', accountId: 'acc-011', productName: 'Omnichannel Sales Inbox', sku: 'HO-OMN-INB', quantity: 85, amount: 780000, status: 'Active', ownerId: 'u1', createdDate: '2026-08-19', updatedDate: '2026-10-02' },
  ];

  const cases = [
    { id: 'acase-001', accountId: 'acc-001', caseNumber: 'CASE-2026-201', subject: 'Enterprise SAML 2.0 Identity Provider Sync', priority: 'High', status: 'Open', ownerId: 'u1', createdDate: '2026-10-06', updatedDate: '2026-10-09' },
    { id: 'acase-002', accountId: 'acc-003', caseNumber: 'CASE-2026-202', subject: 'Custom Webhook Payload Rate Limit', priority: 'Medium', status: 'Open', ownerId: 'u3', createdDate: '2026-10-04', updatedDate: '2026-10-08' },
    { id: 'acase-003', accountId: 'acc-005', caseNumber: 'CASE-2026-203', subject: 'Annual SLA Compliance Audit Certificate', priority: 'Low', status: 'Closed', ownerId: 'u2', createdDate: '2026-09-20', updatedDate: '2026-09-28' },
    { id: 'acase-004', accountId: 'acc-007', caseNumber: 'CASE-2026-204', subject: 'Sandbox Data Seeding Request', priority: 'Medium', status: 'Closed', ownerId: 'u5', createdDate: '2026-09-15', updatedDate: '2026-09-24' },
    { id: 'acase-005', accountId: 'acc-011', caseNumber: 'CASE-2026-205', subject: 'Multi-Currency Forecast Export Formatting', priority: 'High', status: 'Escalated', ownerId: 'u1', createdDate: '2026-10-07', updatedDate: '2026-10-09' },
  ];

  const emails = [
    { id: 'aeml-001', accountId: 'acc-001', subject: 'Q4 Executive Steering Committee Deck — ABC Pvt Ltd', direction: 'Sent', status: 'Opened', to: 'ravi.sharma@abcpvt.in', ownerId: 'u1', createdDate: '2026-10-08', updatedDate: '2026-10-09' },
    { id: 'aeml-002', accountId: 'acc-002', subject: 'Re: Cloud Migration Technical Prerequisites', direction: 'Received', status: 'Opened', to: 'priya.singh@xyzsol.in', ownerId: 'u2', createdDate: '2026-10-07', updatedDate: '2026-10-07' },
    { id: 'aeml-003', accountId: 'acc-003', subject: 'Commercial Proposal — IT Infrastructure Upgrade', direction: 'Sent', status: 'Clicked', to: 'amit.kumar@techcorp.in', ownerId: 'u3', createdDate: '2026-10-06', updatedDate: '2026-10-08' },
    { id: 'aeml-004', accountId: 'acc-004', subject: 'Global Systems Co-Sell Agreement Renewal', direction: 'Sent', status: 'Opened', to: 'suresh.babu@globalsys.in', ownerId: 'u1', createdDate: '2026-10-05', updatedDate: '2026-10-06' },
    { id: 'aeml-005', accountId: 'acc-005', subject: 'Signed Renewal Order Confirmation — Prime Tech', direction: 'Received', status: 'Clicked', to: 'mohit.kapoor@primetech.in', ownerId: 'u2', createdDate: '2026-10-09', updatedDate: '2026-10-09' },
  ];

  const convertedLeads = [
    { id: 'alead-001', accountId: 'acc-001', leadName: 'Ravi Sharma (Enterprise Inquiry)', leadSource: 'Referral', status: 'Converted', convertedDate: '2026-09-01', ownerId: 'u1', createdDate: '2026-08-18', updatedDate: '2026-09-01' },
    { id: 'alead-002', accountId: 'acc-002', leadName: 'Priya Singh (Cloud Assessment)', leadSource: 'Website', status: 'Converted', convertedDate: '2026-09-04', ownerId: 'u2', createdDate: '2026-08-22', updatedDate: '2026-09-04' },
    { id: 'alead-003', accountId: 'acc-003', leadName: 'Amit Kumar (CXO Summit)', leadSource: 'LinkedIn', status: 'Converted', convertedDate: '2026-09-08', ownerId: 'u3', createdDate: '2026-08-25', updatedDate: '2026-09-08' },
    { id: 'alead-004', accountId: 'acc-005', leadName: 'Mohit Kapoor (SaaS Forum)', leadSource: 'Conference', status: 'Converted', convertedDate: '2026-09-12', ownerId: 'u2', createdDate: '2026-08-30', updatedDate: '2026-09-12' },
    { id: 'alead-005', accountId: 'acc-011', leadName: 'Priya Sharma (Inbound Demo)', leadSource: 'Website', status: 'Converted', convertedDate: '2026-03-14', ownerId: 'u1', createdDate: '2026-03-02', updatedDate: '2026-03-14' },
  ];

  const quotes = [
    { id: 'aquo-001', accountId: 'acc-001', quoteNumber: 'QT-2026-301', subject: 'ABC Pvt Ltd — 250 Seat Enterprise License', amount: 1850000, status: 'Accepted', validUntil: '2026-10-30', ownerId: 'u1', createdDate: '2026-09-18', updatedDate: '2026-10-02' },
    { id: 'aquo-002', accountId: 'acc-002', quoteNumber: 'QT-2026-302', subject: 'XYZ Solutions — Cloud Migration Phase 1', amount: 875000, status: 'Sent', validUntil: '2026-10-25', ownerId: 'u2', createdDate: '2026-09-25', updatedDate: '2026-10-05' },
    { id: 'aquo-003', accountId: 'acc-003', quoteNumber: 'QT-2026-303', subject: 'Tech Corp — Infrastructure Upgrade Proposal', amount: 2500000, status: 'Draft', validUntil: '2026-11-05', ownerId: 'u3', createdDate: '2026-10-03', updatedDate: '2026-10-08' },
    { id: 'aquo-004', accountId: 'acc-005', quoteNumber: 'QT-2026-304', subject: 'Prime Tech — Annual Platinum Renewal', amount: 3000000, status: 'Accepted', validUntil: '2026-10-31', ownerId: 'u2', createdDate: '2026-09-14', updatedDate: '2026-09-29' },
    { id: 'aquo-005', accountId: 'acc-007', quoteNumber: 'QT-2026-305', subject: 'NextGen Solutions — Security Audit Suite', amount: 1460000, status: 'Sent', validUntil: '2026-11-10', ownerId: 'u5', createdDate: '2026-09-28', updatedDate: '2026-10-07' },
  ];

  const salesOrders = [
    { id: 'aso-001', accountId: 'acc-001', soNumber: 'SO-2026-401', subject: 'Enterprise CRM Rollout Order — ABC Pvt Ltd', amount: 1850000, status: 'Active', ownerId: 'u1', createdDate: '2026-09-25', updatedDate: '2026-10-06' },
    { id: 'aso-002', accountId: 'acc-003', soNumber: 'SO-2026-402', subject: 'Tech Corp Core Platform Order', amount: 2500000, status: 'Pending', ownerId: 'u3', createdDate: '2026-10-02', updatedDate: '2026-10-08' },
    { id: 'aso-003', accountId: 'acc-005', soNumber: 'SO-2026-403', subject: 'Prime Tech Annual Support Order', amount: 3000000, status: 'Completed', ownerId: 'u2', createdDate: '2026-09-16', updatedDate: '2026-10-01' },
    { id: 'aso-004', accountId: 'acc-010', soNumber: 'SO-2026-404', subject: 'Skyline Solutions Custom Dev Order', amount: 1620000, status: 'Completed', ownerId: 'u2', createdDate: '2026-09-29', updatedDate: '2026-10-08' },
    { id: 'aso-005', accountId: 'acc-011', soNumber: 'SO-2026-405', subject: 'Acme Technologies Omnichannel Expansion', amount: 780000, status: 'Active', ownerId: 'u1', createdDate: '2026-09-20', updatedDate: '2026-10-05' },
  ];

  const projects = deals
    .filter((d) => d.stage === 'Closed Won')
    .slice(0, 25)
    .map((d, i) => ({
      id: `aproj-${String(i + 1).padStart(3, '0')}`,
      accountId: d.accountId,
      dealId: d.id,
      name: `${d.name} — Implementation Project`,
      status: i % 3 === 0 ? 'Completed' : 'Active',
      budget: d.amount,
      ownerId: d.ownerId,
      createdDate: d.createdOn,
      updatedDate: '2026-10-08',
    }));

  const notes = [
    { id: 'anote-001', accountId: 'acc-001', title: 'Executive Sponsor Note', content: 'CIO confirmed multi-year expansion across Chennai and Bangalore offices.', ownerId: 'u1', createdDate: '2026-10-07', updatedDate: '2026-10-07' },
    { id: 'anote-002', accountId: 'acc-003', title: 'Architecture Sign-Off', content: 'Security team approved hybrid cloud deployment topology.', ownerId: 'u3', createdDate: '2026-10-06', updatedDate: '2026-10-06' },
    { id: 'anote-003', accountId: 'acc-005', title: 'Renewal Complete', content: 'Signed 12-month renewal with 24x7 SLA tier.', ownerId: 'u2', createdDate: '2026-10-05', updatedDate: '2026-10-05' },
  ];

  const attachments = [
    { id: 'aatt-001', accountId: 'acc-001', fileName: 'ABC_Pvt_Ltd_MSA_2026.pdf', fileSize: '420 KB', uploadedBy: 'u1', createdDate: '2026-09-20' },
    { id: 'aatt-002', accountId: 'acc-003', fileName: 'TechCorp_Security_Architecture.pdf', fileSize: '1.1 MB', uploadedBy: 'u3', createdDate: '2026-10-01' },
    { id: 'aatt-003', accountId: 'acc-005', fileName: 'PrimeTech_Renewal_Order_FY26.pdf', fileSize: '310 KB', uploadedBy: 'u2', createdDate: '2026-09-28' },
  ];

  const cadences = accounts
    .filter((a) => a.cadenceName)
    .slice(0, 50)
    .map((a, i) => ({
      id: `acad-${String(i + 1).padStart(3, '0')}`,
      accountId: a.id,
      cadenceName: a.cadenceName,
      status: a.cadenceStatus || 'Active',
      ownerId: a.ownerId,
      createdDate: '2026-09-18',
    }));

  return {
    accountProducts,
    cases,
    emails,
    convertedLeads,
    quotes,
    salesOrders,
    projects,
    notes,
    attachments,
    cadences,
  };
}

export function seedSavedAccountViews() {
  return [
    {
      id: 'aview-chennai-it-customers',
      name: 'Chennai IT Customers (> ₹10L)',
      shared: true,
      createdBy: 'u1',
      systemFilters: [],
      fieldFilters: [
        { field: 'type', operator: 'Is', value: 'Customer', type: 'dropdown', enabled: true },
        { field: 'industry', operator: 'Is', value: 'Information Technology', type: 'dropdown', enabled: true },
        { field: 'billingCity', operator: 'Is', value: 'Chennai', type: 'text', enabled: true },
        { field: 'annualRevenue', operator: 'Greater than', value: '1000000', type: 'number', enabled: true },
      ],
      relatedFilters: [],
      conditionGroups: [],
      globalJoin: 'AND',
    },
    {
      id: 'aview-tech-customer-partner',
      name: 'Tech Customers & Partners (> ₹25L)',
      shared: true,
      createdBy: 'u1',
      systemFilters: [],
      fieldFilters: [],
      relatedFilters: [],
      conditionGroups: [
        {
          id: 'grp-1',
          logic: 'OR',
          enabled: true,
          conditions: [
            { field: 'type', operator: 'Is', value: 'Customer', type: 'dropdown', enabled: true },
            { field: 'type', operator: 'Is', value: 'Partner', type: 'dropdown', enabled: true },
          ],
        },
        {
          id: 'grp-2',
          logic: 'AND',
          enabled: true,
          conditions: [
            { field: 'industry', operator: 'Is', value: 'Technology', type: 'dropdown', enabled: true },
            { field: 'annualRevenue', operator: 'Greater than', value: '2500000', type: 'number', enabled: true },
          ],
        },
      ],
      globalJoin: 'AND',
    },
  ];
}



