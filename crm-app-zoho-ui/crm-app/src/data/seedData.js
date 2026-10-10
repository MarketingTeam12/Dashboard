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

export const SEED_VERSION = 5;

export const USERS = [
  { id: 'u1', name: 'Sibi Chakaravarthi', role: 'Sales Manager', email: 'sibi.chakaravarthi@crm.in', color: '#1262E0', title: 'Sales Manager / CEO' },
  { id: 'u2', name: 'Arun Kumar', role: 'Sales Executive', email: 'arun.kumar@crm.in', color: '#1F6FEB' },
  { id: 'u3', name: 'Priya Sharma', role: 'Account Executive', email: 'priya.sharma@crm.in', color: '#D9468F' },
  { id: 'u4', name: 'Karthik S', role: 'Senior Sales Executive', email: 'karthik.s@crm.in', color: '#0E9F6E' },
  { id: 'u5', name: 'Divya R', role: 'Account Executive', email: 'divya.r@crm.in', color: '#8B3DF0' },
  { id: 'u6', name: 'Ravi Kumar', role: 'Sales Executive', email: 'ravi.kumar@crm.in', color: '#B45309' },
  { id: 'u7', name: 'Sneha R', role: 'Sales Executive', email: 'sneha.r@crm.in', color: '#7C3AED' },
  { id: 'u8', name: 'Mohan Raj', role: 'Inside Sales', email: 'mohan.raj@crm.in', color: '#0F766E' },
  { id: 'u9', name: 'Anitha M', role: 'Customer Success', email: 'anitha.m@crm.in', color: '#F04438' },
  { id: 'u10', name: 'Vikram P', role: 'Sales Specialist', email: 'vikram.p@crm.in', color: '#2563EB' },
  { id: 'u11', name: 'Keerthi K', role: 'Operations Lead', email: 'keerthi.k@crm.in', color: '#D97706' },
];

export const ACCOUNT_TYPES = ['Customer', 'Prospect', 'Partner', 'Vendor'];
export const ACCOUNT_STATUSES = ['Active', 'Inactive', 'New'];
export const INDUSTRIES = ['IT Services', 'Software', 'Technology', 'Consulting', 'Manufacturing', 'Construction', 'Finance', 'Healthcare', 'Retail', 'Logistics', 'Education', 'Textiles'];
export const LOCATIONS = ['Chennai', 'Bangalore', 'Hyderabad', 'Mumbai', 'Pune', 'Delhi', 'Kochi', 'Coimbatore', 'Ahmedabad', 'Kolkata'];
export const LIFECYCLES = ['New', 'Contacted', 'Engaged', 'Qualified', 'Customer'];
export const LEAD_SOURCES = ['Website', 'LinkedIn', 'Cold Call', 'Conference', 'Referral', 'Trade Show', 'Internal', 'Direct Contact', 'Social Media', 'Email Campaign'];
export const DEAL_SOURCES = ['Website', 'Referral', 'Cold Call', 'Email', 'Partner'];
export const DEPARTMENTS = ['Enterprise Sales', 'SMB Sales', 'Inside Sales', 'Partnerships'];
export const CALL_TYPES = ['Outbound', 'Inbound'];
export const CALL_STATUSES = ['Completed', 'Missed', 'Busy', 'Scheduled'];
export const INVOICE_TYPES = ['Sales Invoice', 'Recurring Invoice', 'Credit Note', 'Debit Note'];
export const INVOICE_STATUSES = ['Paid', 'Pending', 'Overdue', 'Partially Paid'];
export const AVATAR_COLORS = ['#1F6FEB', '#A238D6', '#FF7A2F', '#0B3D91', '#13B39A', '#F0453A', '#8B3DF0', '#18A957', '#2D7FF9', '#FF8A1F'];

export const LEAD_STATUSES = ['New', 'Contacted', 'Qualified', 'Proposal', 'Converted', 'Lost', 'RNR', 'Pending'];
export const LEAD_TAGS = ['Lead', 'Hot Lead', 'Invalid Number', 'Not contactable', 'Junk', 'Product Demo', 'IT Industry'];
export const CITIES = ['Madurai', 'Erode', 'Chengalpattu', 'Rajamamdry', 'Arignar Anna Nagar', 'Chennai', 'Coimbatore', 'Bangalore', 'Hyderabad', 'Pune'];
export const AGENT_TYPES = ['Lead', 'Engagement', 'Analytics', 'Communication', 'Productivity', 'Reporting', 'Data', 'Support', 'Scheduling', 'Automation'];
export const AGENT_DEPARTMENTS = ['Sales', 'Marketing', 'Operations', 'Support'];
export const TASK_STATUSES = ['Not Started', 'In Progress', 'Pending', 'Scheduled', 'Completed', 'Overdue'];
export const TASK_PRIORITIES = ['High', 'Medium', 'Low'];
export const REPORT_MODULES = ['Deals', 'Leads', 'Finance', 'Activities', 'Contacts', 'Accounts', 'Users'];
export const REPORT_TYPES = ['Standard', 'Custom'];
export const MESSAGE_STATUSES = ['Not Read', 'Read', 'Starred', 'Archived'];
export const MESSAGE_TYPES = ['All Types', 'Lead Messages', 'Deal Messages', 'Customer Messages', 'Internal Messages'];

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
  ];
  const sourceW = [['Website', 32], ['Referral', 24], ['Cold Call', 18], ['Email', 15], ['Partner', 11]];
  const deals = namedDeals.map(([name, accName, conName, stage, amount, closingDate, probability, ownerId, createdOn], i) => ({
    id: `deal-${String(i + 1).padStart(3, '0')}`,
    name, accountId: accByName[accName].id, contactId: conByName[conName].id, stage, amount, closingDate, probability, ownerId,
    createdOn, source: weighted(sourceW), department: pick(DEPARTMENTS), lostAtStage: '', description: '',
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
    deals.push({
      id: `deal-${String(deals.length + 1).padStart(3, '0')}`,
      name: `${pick(DEAL_TEMPLATES)} – ${acc.name.split(' ')[0]}`,
      accountId: acc.id, contactId: contact.id, stage, amount: int(30, 130) * 5000,
      closingDate: addDays(createdOn, int(30, 110)),
      probability: closed ? base : Math.min(95, Math.max(5, base + pick([-5, 0, 0, 5]))),
      ownerId: pick(USERS).id, createdOn, source: weighted(sourceW), department: pick(DEPARTMENTS),
      lostAtStage: stage === 'Closed Lost' ? pick(['Qualification', 'Needs Analysis', 'Proposal', 'Negotiation']) : '',
      description: '',
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

  return {
    accounts, contacts, deals, calls, invoices, oldDeals, baselines,
    leads: seedLeads(),
    agents: seedAgents(),
    tasks: seedWorkqueueTasks(),
    reports: seedReports(),
    messages: seedMessages(),
    workflows: seedWorkflows(),
    notifications: seedNotifications(),
    activity: [],
    workflowHistory: [],
  };
}

export function seedLeads() {
  return [
    {
      id: 'lead-1', leadNo: 'LEAD-1001', name: 'Justdial User', firstName: 'Justdial', lastName: 'User',
      company: 'Honey Translation Services', designation: 'Business Owner', email: 'justdial.user@honeytrans.in',
      phone: '+91 91475 28410', mobile: '+91 91475 28410', city: 'Madurai', tag: 'Lead', status: 'New',
      source: 'Justdial', industry: 'Services', annualRevenue: '₹ 25 L - 50 L', noOfEmployees: '10 - 50',
      address: '24 South Veli Street, Madurai, Tamil Nadu 625001',
      remarks: 'busy Honey Translation Services, Madurai. Enquired about document translation CRM.',
      score: 65, ownerId: 'u4', createdTime: '06 Oct, 08:02 AM', createdOn: '2026-10-06', followUpDate: '2026-10-12',
      scoreInsights: [{ text: 'Enquired via Justdial', pts: 25 }, { text: 'Valid Phone Number', pts: 20 }, { text: 'Assigned to Agent', pts: 20 }],
      activities: [
        { type: 'Lead Created', desc: 'Lead captured from Justdial campaign', by: 'System', date: '06 Oct 2026 08:02 AM', status: 'Completed' },
        { type: 'Phone Call', desc: 'Called contact, phone was busy', by: 'Karthik S', date: '06 Oct 2026 09:30 AM', status: 'Completed' },
      ],
    },
    {
      id: 'lead-2', leadNo: 'LEAD-1002', name: 'Mr Justdial User', firstName: 'Justdial', lastName: 'User',
      company: 'Attestation Services', designation: 'Operations Manager', email: 'info@attestationservices.in',
      phone: '+91 63821 94021', mobile: '+91 63821 94021', city: 'Erode', tag: 'Lead', status: 'Contacted',
      source: 'Justdial', industry: 'Services', annualRevenue: '₹ 50 L - 1 Cr', noOfEmployees: '10 - 50',
      address: '56 Brough Road, Erode, Tamil Nadu 638001',
      remarks: 'busy Attestation Services, Erode +916382194021. Asked to call back in evening.',
      score: 60, ownerId: 'u4', createdTime: '03 Oct, 05:40 PM', createdOn: '2026-10-03', followUpDate: '2026-10-10',
      scoreInsights: [{ text: 'Enquired via Justdial', pts: 25 }, { text: 'Phone Contacted', pts: 20 }, { text: 'Callback Requested', pts: 15 }],
      activities: [
        { type: 'Lead Created', desc: 'Inbound enquiry from Justdial integration', by: 'System', date: '03 Oct 2026 05:40 PM', status: 'Completed' },
        { type: 'Phone Call', desc: 'Initial conversation completed. Asked for evening slot.', by: 'Karthik S', date: '04 Oct 2026 10:15 AM', status: 'Completed' },
      ],
    },
    {
      id: 'lead-3', leadNo: 'LEAD-1003', name: 'Pranitha', firstName: 'Pranitha', lastName: 'R',
      company: 'Designer Poster Dealers', designation: 'Creative Director', email: 'pranitha@designerposters.in',
      phone: '+91 98765 43210', mobile: '+91 98765 43210', city: 'Chengalpattu', tag: 'Lead', status: 'Qualified',
      source: 'Website', industry: 'Retail', annualRevenue: '₹ 1 Cr - 3 Cr', noOfEmployees: '50 - 200',
      address: '12 GST Road, Chengalpattu, Tamil Nadu 603001',
      remarks: 'wrong number. Designer Poster Dealers, verified alternate mobile. Interested in enterprise CRM.',
      score: 85, ownerId: 'u3', createdTime: '29 Sep, 09:17 AM', createdOn: '2026-09-29', followUpDate: '2026-10-11',
      scoreInsights: [{ text: 'Opened marketing emails', pts: 20 }, { text: 'Visited pricing page', pts: 15 }, { text: 'Attended product demo', pts: 25 }, { text: 'Requested proposal', pts: 25 }],
      activities: [
        { type: 'Phone Call', desc: 'Called and discussed the product demo requirements.', by: 'Priya Sharma', date: '10 Oct 2026 11:30 AM', status: 'Completed' },
        { type: 'Email Sent', desc: 'Sent product brochure and pricing details.', by: 'Anitha M', date: '09 Oct 2026 04:15 PM', status: 'Completed' },
        { type: 'Task Created', desc: 'Follow up with the client for the demo feedback.', by: 'Vikram P', date: '08 Oct 2026 02:20 PM', status: 'Open' },
      ],
    },
    {
      id: 'lead-4', leadNo: 'LEAD-1004', name: 'Mr Abujith', firstName: 'Abujith', lastName: 'Kumar',
      company: 'Education Consultants', designation: 'Managing Director', email: 'abujith@educonsult.org',
      phone: '+91 73581 29401', mobile: '+91 73581 29401', city: 'Erode', tag: 'Lead', status: 'Proposal',
      source: 'Referral', industry: 'Education', annualRevenue: '₹ 2 Cr - 5 Cr', noOfEmployees: '50 - 200',
      address: '89 Perundurai Road, Erode, Tamil Nadu 638011',
      remarks: 'busy Education Consultants, Erode +917358129401. Reviewing proposal quotation.',
      score: 80, ownerId: 'u2', createdTime: '28 Sep, 11:48 AM', createdOn: '2026-09-28', followUpDate: '2026-10-14',
      scoreInsights: [{ text: 'Referral recommendation', pts: 30 }, { text: 'Attended Demo', pts: 25 }, { text: 'Proposal Shared', pts: 25 }],
      activities: [
        { type: 'Meeting', desc: 'Product demo with management team.', by: 'Arun Kumar', date: '02 Oct 2026 03:00 PM', status: 'Completed' },
        { type: 'Email Sent', desc: 'Shared customized commercial proposal.', by: 'Arun Kumar', date: '05 Oct 2026 11:00 AM', status: 'Completed' },
      ],
    },
    {
      id: 'lead-5', leadNo: 'LEAD-1005', name: 'Ms Subha', firstName: 'Subha', lastName: 'Lakshmi',
      company: 'Education Consultants', designation: 'Operations Head', email: 'subha@educonsult.org',
      phone: '+91 73731 84920', mobile: '+91 73731 84920', city: 'Erode', tag: 'Lead', status: 'Converted',
      source: 'Website', industry: 'Education', annualRevenue: '₹ 2 Cr - 5 Cr', noOfEmployees: '50 - 200',
      address: '89 Perundurai Road, Erode, Tamil Nadu 638011',
      remarks: 'call back Education Consultants, Erode. Deal finalized, converting to active client.',
      score: 95, ownerId: 'u1', createdTime: '27 Sep, 05:07 PM', createdOn: '2026-09-27', followUpDate: '2026-10-09',
      scoreInsights: [{ text: 'Executive Sponsorship', pts: 35 }, { text: 'Trial Completed', pts: 30 }, { text: 'Commercials Agreed', pts: 30 }],
      activities: [
        { type: 'Phone Call', desc: 'Final contract terms confirmed.', by: 'Sibi Chakaravarthi', date: '06 Oct 2026 04:30 PM', status: 'Completed' },
        { type: 'Deal Converted', desc: 'Converted to Deal #DEAL-2026-088.', by: 'Sibi Chakaravarthi', date: '07 Oct 2026 10:00 AM', status: 'Completed' },
      ],
    },
    {
      id: 'lead-6', leadNo: 'LEAD-1006', name: 'Shiva', firstName: 'Shiva', lastName: 'Prasad',
      company: 'Rajam Agro Allied', designation: 'Proprietor', email: 'shiva@rajamagro.in',
      phone: '+91 91234 56780', mobile: '+91 91234 56780', city: 'Rajamamdry', tag: 'Lead', status: 'Contacted',
      source: 'Cold Call', industry: 'Logistics', annualRevenue: '₹ 50 L - 1 Cr', noOfEmployees: '10 - 50',
      address: 'Main Bazar, Rajahmundry, Andhra Pradesh 533101',
      remarks: 'call disconnected. No category, Rajamamdry. Reconnect scheduled.',
      score: 55, ownerId: 'u6', createdTime: '27 Sep, 12:03 PM', createdOn: '2026-09-27', followUpDate: '2026-10-12',
      scoreInsights: [{ text: 'Cold call responded', pts: 25 }, { text: 'Profile matched', pts: 30 }],
      activities: [
        { type: 'Phone Call', desc: 'Call dropped due to network issues', by: 'Ravi Kumar', date: '27 Sep 2026 12:03 PM', status: 'Completed' },
      ],
    },
    {
      id: 'lead-7', leadNo: 'LEAD-1007', name: 'Natarajan', firstName: 'Natarajan', lastName: 'S',
      company: 'Medical Transcription Hub', designation: 'Managing Director', email: 'natarajan@medtranscript.com',
      phone: '+91 96182 34501', mobile: '+91 96182 34501', city: 'Arignar Anna Nagar', tag: 'Lead', status: 'Contacted',
      source: 'Direct Contact', industry: 'Healthcare', annualRevenue: '₹ 1 Cr - 3 Cr', noOfEmployees: '50 - 200',
      address: '2nd Avenue, Arignar Anna Nagar, Chennai 600040',
      remarks: 'busy Medical Transcription, Arignar Anna Nagar. Requested product demo next week.',
      score: 58, ownerId: 'u7', createdTime: '17 Sep, 02:28 PM', createdOn: '2026-09-17', followUpDate: '2026-10-15',
      scoreInsights: [{ text: 'Healthcare Vertical Match', pts: 28 }, { text: 'Demo Requested', pts: 30 }],
      activities: [
        { type: 'Phone Call', desc: 'Spoke with receptionist, forwarded to MD.', by: 'Sneha R', date: '17 Sep 2026 02:28 PM', status: 'Completed' },
      ],
    },
    {
      id: 'lead-8', leadNo: 'LEAD-1008', name: 'ram', firstName: 'Ram', lastName: 'Kumar',
      company: 'Transcription Services Inc', designation: 'Technical Lead', email: 'ram@transcripts.co',
      phone: '+91 98450 12948', mobile: '+91 98450 12948', city: 'Chennai', tag: 'Invalid Number', status: 'New',
      source: 'Cold Call', industry: 'Technology', annualRevenue: '₹ 25 L - 50 L', noOfEmployees: '10 - 50',
      address: 'Mount Road, Chennai, Tamil Nadu 600002',
      remarks: 'NO INCOMING CALLS Transcription Services. Need verified phone number from database.',
      score: 40, ownerId: 'u8', createdTime: '15 Sep, 01:30 PM', createdOn: '2026-09-15', followUpDate: '2026-10-16',
      scoreInsights: [{ text: 'Invalid Contact Attempt', pts: -10 }],
      activities: [
        { type: 'Phone Call', desc: 'Automated dialer reported no incoming calls.', by: 'Mohan Raj', date: '15 Sep 2026 01:30 PM', status: 'Completed' },
      ],
    },
    {
      id: 'lead-9', leadNo: 'LEAD-1009', name: 'charles samuel', firstName: 'Charles', lastName: 'Samuel',
      company: 'Translators Alliance', designation: 'Founder', email: 'charles@translators.in',
      phone: '9750361999', mobile: '9750361999', city: 'Chennai', tag: 'Not contactable', status: 'New',
      source: 'Cold Call', industry: 'Services', annualRevenue: '₹ 15 L - 30 L', noOfEmployees: '1 - 10',
      address: 'T. Nagar, Chennai, Tamil Nadu 600017',
      remarks: 'RNR Translators, Chennai 9750361999. Ringing no response.',
      score: 45, ownerId: 'u8', createdTime: '15 Sep, 01:30 PM', createdOn: '2026-09-15', followUpDate: '2026-10-18',
      scoreInsights: [{ text: 'Unresponsive lead', pts: -5 }],
      activities: [
        { type: 'Phone Call', desc: 'RNR - Ringing no response on 3 attempts', by: 'Mohan Raj', date: '15 Sep 2026 01:30 PM', status: 'Completed' },
      ],
    },
    {
      id: 'lead-10', leadNo: 'LEAD-1010', name: 'fahad', firstName: 'Fahad', lastName: 'Ahmed',
      company: 'DTP Services', designation: 'Manager', email: 'fahad@dtpservices.in',
      phone: '9600120792', mobile: '9600120792', city: 'Chennai', tag: 'Junk', status: 'Lost',
      source: 'Cold Call', industry: 'Retail', annualRevenue: '₹ 10 L - 20 L', noOfEmployees: '1 - 10',
      address: 'Purasawalkam, Chennai, Tamil Nadu 600084',
      remarks: 'NOT ENQUIRED DTP Services, Chennai. Wrong business enquiry, flagged as junk lead.',
      score: 30, ownerId: 'u8', createdTime: '15 Sep, 01:30 PM', createdOn: '2026-09-15', followUpDate: '2026-10-20',
      scoreInsights: [{ text: 'Junk enquiry filter', pts: -20 }],
      activities: [
        { type: 'Phone Call', desc: 'Confirmed not interested in CRM software.', by: 'Mohan Raj', date: '15 Sep 2026 01:30 PM', status: 'Completed' },
      ],
    },
    {
      id: 'lead-11', leadNo: 'LEAD-1011', name: 'Arun Kumar', firstName: 'Arun', lastName: 'Kumar',
      company: 'ABC Solutions', designation: 'Director of Procurement', email: 'arunkumar@abcsolutions.com',
      phone: '+91 98765 43210', mobile: '+91 91234 56789', city: 'Chennai', tag: 'Lead', status: 'Qualified',
      source: 'Website', industry: 'Information Technology', annualRevenue: '₹ 5 Cr - 10 Cr', noOfEmployees: '50 - 200',
      address: 'No. 25, Tech Park, OMR Road, Chennai - 600097, Tamil Nadu, India',
      website: 'www.abcsolutions.com',
      remarks: 'High potential deal for Enterprise CRM and workflow automation suite.',
      score: 85, ownerId: 'u4', createdTime: '10 Oct, 11:30 AM', createdOn: '2026-10-10', followUpDate: '2026-10-15',
      scoreInsights: [
        { text: 'Opened marketing emails', pts: 20 },
        { text: 'Visited pricing page', pts: 15 },
        { text: 'Attended product demo', pts: 25 },
        { text: 'Requested proposal', pts: 25 },
      ],
      activities: [
        { type: 'Phone Call', desc: 'Called and discussed the product demo requirements.', by: 'Karthik S', date: '10 Oct 2026 11:30 AM', status: 'Completed' },
        { type: 'Email Sent', desc: 'Sent product brochure and pricing details.', by: 'Anitha M', date: '09 Oct 2026 04:15 PM', status: 'Completed' },
        { type: 'Task Created', desc: 'Follow up with the client for demo feedback.', by: 'Vikram P', date: '08 Oct 2026 02:20 PM', status: 'Open' },
      ],
    },
    {
      id: 'lead-12', leadNo: 'LEAD-1012', name: 'Priya Menon', firstName: 'Priya', lastName: 'Menon',
      company: 'XYZ Technologies', designation: 'VP Technology', email: 'priya.m@xyztechnologies.io',
      phone: '+91 98401 23456', mobile: '+91 98401 23456', city: 'Chennai', tag: 'Lead', status: 'Contacted',
      source: 'Referral', industry: 'Software', annualRevenue: '₹ 10 Cr - 20 Cr', noOfEmployees: '200 - 500',
      address: 'Ascendas IT Park, Taramani, Chennai 600113',
      remarks: 'Interested in migrating from legacy system to cloud CRM.',
      score: 75, ownerId: 'u9', createdTime: '09 Oct, 02:00 PM', createdOn: '2026-10-09', followUpDate: '2026-10-13',
      scoreInsights: [{ text: 'Referral bonus', pts: 30 }, { text: 'Enterprise match', pts: 25 }, { text: 'Email clicked', pts: 20 }],
      activities: [
        { type: 'Email Sent', desc: 'Introduction and case studies sent.', by: 'Anitha M', date: '09 Oct 2026 02:00 PM', status: 'Completed' },
      ],
    },
    {
      id: 'lead-13', leadNo: 'LEAD-1013', name: 'Ramesh S', firstName: 'Ramesh', lastName: 'Subramaniam',
      company: 'R S Enterprises', designation: 'Managing Director', email: 'ramesh@rsenterprises.in',
      phone: '+91 98220 34567', mobile: '+91 98220 34567', city: 'Madurai', tag: 'Hot Lead', status: 'Qualified',
      source: 'Social Media', industry: 'Manufacturing', annualRevenue: '₹ 3 Cr - 5 Cr', noOfEmployees: '50 - 200',
      address: 'Kappalur Industrial Estate, Madurai 625008',
      remarks: 'Requires sales pipeline and territory tracking modules.',
      score: 90, ownerId: 'u10', createdTime: '08 Oct, 04:00 PM', createdOn: '2026-10-08', followUpDate: '2026-10-14',
      scoreInsights: [{ text: 'High budget qualification', pts: 40 }, { text: 'Executive engaged', pts: 30 }, { text: 'Live meeting done', pts: 20 }],
      activities: [
        { type: 'Meeting', desc: 'Online architecture walk-through.', by: 'Vikram P', date: '08 Oct 2026 04:00 PM', status: 'Completed' },
      ],
    },
    {
      id: 'lead-14', leadNo: 'LEAD-1014', name: 'Divya K', firstName: 'Divya', lastName: 'Krishnan',
      company: 'D Tech Solutions', designation: 'Chief Operating Officer', email: 'divya@dtechsolutions.com',
      phone: '+91 98110 45678', mobile: '+91 98110 45678', city: 'Erode', tag: 'Product Demo', status: 'Proposal',
      source: 'Email Campaign', industry: 'Information Technology', annualRevenue: '₹ 4 Cr - 8 Cr', noOfEmployees: '100 - 300',
      address: 'Gandhiji Road, Erode 638002',
      remarks: 'Commercial negotiation ongoing for 50 CRM licenses.',
      score: 82, ownerId: 'u5', createdTime: '07 Oct, 10:45 AM', createdOn: '2026-10-07', followUpDate: '2026-10-15',
      scoreInsights: [{ text: 'Campaign conversion', pts: 25 }, { text: 'Quote requested', pts: 30 }, { text: 'Decision maker ready', pts: 27 }],
      activities: [
        { type: 'Proposal Sent', desc: 'Sent pricing plan for 50 licenses.', by: 'Divya R', date: '07 Oct 2026 10:45 AM', status: 'Completed' },
      ],
    },
    {
      id: 'lead-15', leadNo: 'LEAD-1015', name: 'Mohan Raj', firstName: 'Mohan', lastName: 'Raj',
      company: 'MNR Traders', designation: 'Senior Partner', email: 'mohan@mnrtraders.in',
      phone: '+91 98330 56789', mobile: '+91 98330 56789', city: 'Chennai', tag: 'IT Industry', status: 'Converted',
      source: 'Direct Contact', industry: 'Retail', annualRevenue: '₹ 6 Cr - 12 Cr', noOfEmployees: '150 - 400',
      address: 'George Town, Chennai 600001',
      remarks: 'Successfully converted to customer deal.',
      score: 95, ownerId: 'u8', createdTime: '06 Oct, 03:30 PM', createdOn: '2026-10-06', followUpDate: '2026-10-08',
      scoreInsights: [{ text: 'Contract signed', pts: 50 }, { text: 'Advance paid', pts: 45 }],
      activities: [
        { type: 'Deal Converted', desc: 'Converted to active enterprise deal.', by: 'Mohan Raj', date: '06 Oct 2026 03:30 PM', status: 'Completed' },
      ],
    },
    {
      id: 'lead-16', leadNo: 'LEAD-1016', name: 'Keerthi K', firstName: 'Keerthi', lastName: 'Kumar',
      company: 'Apex Fabrics', designation: 'Purchase Head', email: 'keerthi@apexfabrics.com',
      phone: '+91 98440 67890', mobile: '+91 98440 67890', city: 'Coimbatore', tag: 'Lead', status: 'New',
      source: 'Website', industry: 'Textiles', annualRevenue: '₹ 2 Cr - 4 Cr', noOfEmployees: '50 - 150',
      address: 'Avanashi Road, Coimbatore 641018',
      remarks: 'Enquired about export order CRM tracking.',
      score: 65, ownerId: 'u11', createdTime: '05 Oct, 11:15 AM', createdOn: '2026-10-05', followUpDate: '2026-10-14',
      scoreInsights: [{ text: 'Web form signup', pts: 25 }, { text: 'Verified mobile', pts: 20 }, { text: 'Textile focus', pts: 20 }],
      activities: [{ type: 'Lead Created', desc: 'Lead submitted via contact form.', by: 'System', date: '05 Oct 2026 11:15 AM', status: 'Completed' }],
    },
    {
      id: 'lead-17', leadNo: 'LEAD-1017', name: 'Suresh B', firstName: 'Suresh', lastName: 'Babu',
      company: 'CloudWave Labs', designation: 'Chief Technology Officer', email: 'suresh@cloudwavelabs.com',
      phone: '+91 98550 78901', mobile: '+91 98550 78901', city: 'Bangalore', tag: 'Hot Lead', status: 'Contacted',
      source: 'LinkedIn', industry: 'Technology', annualRevenue: '₹ 8 Cr - 15 Cr', noOfEmployees: '100 - 250',
      address: 'Koramangala 4th Block, Bangalore 560034',
      remarks: 'Looking for integrated webhook & API automations.',
      score: 78, ownerId: 'u2', createdTime: '04 Oct, 09:30 AM', createdOn: '2026-10-04', followUpDate: '2026-10-12',
      scoreInsights: [{ text: 'Technical review passed', pts: 35 }, { text: 'High enterprise score', pts: 25 }, { text: 'LinkedIn inbound', pts: 18 }],
      activities: [{ type: 'Phone Call', desc: 'Intro call with engineering team.', by: 'Arun Kumar', date: '04 Oct 2026 09:30 AM', status: 'Completed' }],
    },
    {
      id: 'lead-18', leadNo: 'LEAD-1018', name: 'Meena L', firstName: 'Meena', lastName: 'Lakshman',
      company: 'Bright Media', designation: 'Creative Director', email: 'meena@brightmedia.in',
      phone: '+91 98660 89012', mobile: '+91 98660 89012', city: 'Chennai', tag: 'Lead', status: 'Qualified',
      source: 'Referral', industry: 'Marketing', annualRevenue: '₹ 1 Cr - 2 Cr', noOfEmployees: '20 - 50',
      address: 'Adyar, Chennai 600020',
      remarks: 'Needs campaign analytics & client lead reporting.',
      score: 88, ownerId: 'u3', createdTime: '03 Oct, 02:45 PM', createdOn: '2026-10-03', followUpDate: '2026-10-11',
      scoreInsights: [{ text: 'Qualified budget', pts: 30 }, { text: 'Demo scheduled', pts: 30 }, { text: 'Referral trust', pts: 28 }],
      activities: [{ type: 'Demo Done', desc: 'Product demo completed with sales rep.', by: 'Priya Sharma', date: '03 Oct 2026 02:45 PM', status: 'Completed' }],
    },
    {
      id: 'lead-19', leadNo: 'LEAD-1019', name: 'Dinesh V', firstName: 'Dinesh', lastName: 'Varma',
      company: 'Stellar Logistics', designation: 'Fleet Operations Head', email: 'dinesh@stellarlogistics.in',
      phone: '+91 98770 90123', mobile: '+91 98770 90123', city: 'Hyderabad', tag: 'Lead', status: 'Proposal',
      source: 'Website', industry: 'Logistics', annualRevenue: '₹ 5 Cr - 10 Cr', noOfEmployees: '150 - 300',
      address: 'HITEC City, Hyderabad 500081',
      remarks: 'Proposal submitted for dispatch & client tracking automation.',
      score: 72, ownerId: 'u6', createdTime: '02 Oct, 04:10 PM', createdOn: '2026-10-02', followUpDate: '2026-10-15',
      scoreInsights: [{ text: 'Logistics RFP received', pts: 25 }, { text: 'Quotation sent', pts: 25 }, { text: 'Pricing under review', pts: 22 }],
      activities: [{ type: 'Proposal Sent', desc: 'Sent formal proposal and SLA document.', by: 'Ravi Kumar', date: '02 Oct 2026 04:10 PM', status: 'Completed' }],
    },
    {
      id: 'lead-20', leadNo: 'LEAD-1020', name: 'Shanthi R', firstName: 'Shanthi', lastName: 'Rao',
      company: 'Zenith Healthcare', designation: 'Procurement Head', email: 'shanthi@zenithhealth.org',
      phone: '+91 98880 01234', mobile: '+91 98880 01234', city: 'Chennai', tag: 'Lead', status: 'Contacted',
      source: 'Trade Show', industry: 'Healthcare', annualRevenue: '₹ 10 Cr - 25 Cr', noOfEmployees: '300 - 800',
      address: 'Kilpauk, Chennai 600010',
      remarks: 'Met at Healthcare Expo 2026. Reviewing vendor onboarding terms.',
      score: 70, ownerId: 'u7', createdTime: '01 Oct, 10:20 AM', createdOn: '2026-10-01', followUpDate: '2026-10-16',
      scoreInsights: [{ text: 'Met at Trade Show', pts: 30 }, { text: 'Contact Verified', pts: 20 }, { text: 'Follow-up Call Done', pts: 20 }],
      activities: [{ type: 'Phone Call', desc: 'Discussed compliance and security standards.', by: 'Sneha R', date: '01 Oct 2026 10:20 AM', status: 'Completed' }],
    },
  ];
}

export function seedAgents() {
  return [
    { id: 'ag-1', name: 'Lead Assistant', description: 'Qualify and assign new leads', type: 'Lead', department: 'Sales', status: 'Active', lastRun: '10/10/2026 10:30 AM', tasksExecuted: 245, createdBy: 'Arun Kumar', icon: 'UserRound' },
    { id: 'ag-2', name: 'Follow-up Agent', description: 'Automate follow-up reminders', type: 'Engagement', department: 'Sales', status: 'Active', lastRun: '10/10/2026 09:15 AM', tasksExecuted: 198, createdBy: 'Priya Sharma', icon: 'Clock' },
    { id: 'ag-3', name: 'Deal Insights Agent', description: 'Analyze deal progress and risks', type: 'Analytics', department: 'Sales', status: 'Active', lastRun: '09/10/2026 06:45 PM', tasksExecuted: 176, createdBy: 'Ravi Kumar', icon: 'TrendingUp' },
    { id: 'ag-4', name: 'Email Assistant', description: 'Draft and send emails using templates', type: 'Communication', department: 'Marketing', status: 'Inactive', lastRun: '08/10/2026 02:20 PM', tasksExecuted: 52, createdBy: 'Sneha R', icon: 'Mail' },
    { id: 'ag-5', name: 'Task Automation', description: 'Create and update tasks automatically', type: 'Productivity', department: 'Operations', status: 'Active', lastRun: '10/10/2026 11:10 AM', tasksExecuted: 312, createdBy: 'Karthik S', icon: 'CheckSquare' },
    { id: 'ag-6', name: 'Report Generator', description: 'Generate periodic reports', type: 'Reporting', department: 'Operations', status: 'Active', lastRun: '09/10/2026 08:00 PM', tasksExecuted: 89, createdBy: 'Anitha M', icon: 'BarChart2' },
    { id: 'ag-7', name: 'Data Enrichment', description: 'Enrich contact and company data', type: 'Data', department: 'Marketing', status: 'Active', lastRun: '10/10/2026 12:05 PM', tasksExecuted: 164, createdBy: 'Vikram P', icon: 'Database' },
    { id: 'ag-8', name: 'Customer Support Agent', description: 'Handle customer queries', type: 'Support', department: 'Support', status: 'Inactive', lastRun: '07/10/2026 04:30 PM', tasksExecuted: 46, createdBy: 'Divya R', icon: 'Headphones' },
    { id: 'ag-9', name: 'Meeting Scheduler', description: 'Schedule meetings and send invites', type: 'Scheduling', department: 'Sales', status: 'Active', lastRun: '10/10/2026 01:30 PM', tasksExecuted: 134, createdBy: 'Mohan Raj', icon: 'Calendar' },
    { id: 'ag-10', name: 'Workflow Agent', description: 'Automate business workflows', type: 'Automation', department: 'Operations', status: 'Active', lastRun: '09/10/2026 03:20 PM', tasksExecuted: 118, createdBy: 'Keerthi K', icon: 'Workflow' },
  ];
}

export function seedWorkqueueTasks() {
  return [
    { id: 'wq-1', subject: 'Follow up with ABC Technologies', dueDate: '10/10/2026', status: 'In Progress', priority: 'High', relatedTo: 'Deal - ABC Technologies', contactName: 'Ramesh Kumar', ownerId: 'u4' },
    { id: 'wq-2', subject: 'Prepare proposal for Global Solutions', dueDate: '11/10/2026', status: 'Not Started', priority: 'Medium', relatedTo: 'Account - Global Solutions', contactName: 'Priya Nair', ownerId: 'u3' },
    { id: 'wq-3', subject: 'Call back - Karthik Enterprises', dueDate: '11/10/2026', status: 'Pending', priority: 'High', relatedTo: 'Lead - Karthik Enterprises', contactName: 'Karthik S', ownerId: 'u4' },
    { id: 'wq-4', subject: 'Send updated quotation', dueDate: '12/10/2026', status: 'In Progress', priority: 'Medium', relatedTo: 'Deal - Sunrise Corp', contactName: 'Divya R', ownerId: 'u5' },
    { id: 'wq-5', subject: 'Product demo meeting', dueDate: '12/10/2026', status: 'Scheduled', priority: 'Low', relatedTo: 'Account - Bright Future', contactName: 'Anitha M', ownerId: 'u9' },
    { id: 'wq-6', subject: 'Collect documentation', dueDate: '13/10/2026', status: 'In Progress', priority: 'High', relatedTo: 'Lead - Technova Pvt Ltd', contactName: 'Vikram P', ownerId: 'u10' },
    { id: 'wq-7', subject: 'Follow up for renewal', dueDate: '13/10/2026', status: 'Not Started', priority: 'Medium', relatedTo: 'Account - Prime Systems', contactName: 'Sneha R', ownerId: 'u7' },
    { id: 'wq-8', subject: 'Email product brochure', dueDate: '14/10/2026', status: 'In Progress', priority: 'Low', relatedTo: 'Lead - Metro Solutions', contactName: 'Mohan Raj', ownerId: 'u8' },
    { id: 'wq-9', subject: 'Schedule on-site visit', dueDate: '14/10/2026', status: 'Pending', priority: 'High', relatedTo: 'Deal - Vertex Solutions', contactName: 'Keerthi K', ownerId: 'u11' },
    { id: 'wq-10', subject: 'Update notes in CRM', dueDate: '15/10/2026', status: 'Not Started', priority: 'Low', relatedTo: 'Account - Tech Partners', contactName: 'Ravi Kumar', ownerId: 'u6' },
    { id: 'wq-11', subject: 'Prepare brochure content', dueDate: '10/10/2026', status: 'In Progress', priority: 'High', relatedTo: 'Deal - ABC Technologies', contactName: 'Arun Kumar', ownerId: 'u2' },
    { id: 'wq-12', subject: 'Design landing page', dueDate: '11/10/2026', status: 'Not Started', priority: 'Medium', relatedTo: 'Account - Global Solutions', contactName: 'Priya Sharma', ownerId: 'u3' },
  ];
}

export function seedReports() {
  return [
    { id: 'rep-1', name: 'Sales Pipeline Summary', module: 'Deals', type: 'Standard', folder: 'Sales Reports', lastAccessed: '10/10/2026', createdBy: 'Arun Kumar', status: 'Active', favorite: true },
    { id: 'rep-2', name: 'Lead Source Analysis', module: 'Leads', type: 'Standard', folder: 'Lead Reports', lastAccessed: '08/10/2026', createdBy: 'Priya Sharma', status: 'Active', favorite: true },
    { id: 'rep-3', name: 'Revenue by Month', module: 'Deals', type: 'Custom', folder: 'Finance Reports', lastAccessed: '06/10/2026', createdBy: 'Ravi Kumar', status: 'Active', favorite: false },
    { id: 'rep-4', name: 'Activities Performance', module: 'Activities', type: 'Standard', folder: 'Activity Reports', lastAccessed: '05/10/2026', createdBy: 'Sneha R', status: 'Scheduled', favorite: false },
    { id: 'rep-5', name: 'Contact Engagement Report', module: 'Contacts', type: 'Custom', folder: 'Contact Reports', lastAccessed: '04/10/2026', createdBy: 'Karthik S', status: 'Active', favorite: false },
    { id: 'rep-6', name: 'Account Growth Report', module: 'Accounts', type: 'Standard', folder: 'Account Reports', lastAccessed: '02/10/2026', createdBy: 'Anitha M', status: 'Active', favorite: true },
    { id: 'rep-7', name: 'Follow-up Status Report', module: 'Leads', type: 'Custom', folder: 'Sales Reports', lastAccessed: '28/09/2026', createdBy: 'Vikram P', status: 'Inactive', favorite: false },
    { id: 'rep-8', name: 'Lost Deals Analysis', module: 'Deals', type: 'Standard', folder: 'Deal Reports', lastAccessed: '25/09/2026', createdBy: 'Divya R', status: 'Active', favorite: false },
    { id: 'rep-9', name: 'Won Deals Summary', module: 'Deals', type: 'Standard', folder: 'Deal Reports', lastAccessed: '22/09/2026', createdBy: 'Mohan Raj', status: 'Active', favorite: true },
    { id: 'rep-10', name: 'Team Performance Report', module: 'Users', type: 'Custom', folder: 'Team Reports', lastAccessed: '18/09/2026', createdBy: 'Keerthi K', status: 'Scheduled', favorite: false },
  ];
}

export function seedMessages() {
  return [
    { id: 'msg-1', sender: 'Arun Kumar', badge: 'Lead', subject: 'Product Enquiry', snippet: 'Hi Arun Kumar, Thanks for your interest in our CRM solution. Our team will contact you shortly.', time: '12:45 PM', date: '2026-10-10', status: 'Not Read', type: 'Lead Messages', hasAttachment: false, replies: [] },
    { id: 'msg-2', sender: 'Priya Sharma', badge: 'Contact', subject: 'Proposal ABC Technologies', snippet: 'Please share the updated proposal for ABC Technologies.', time: '11:30 AM', date: '2026-10-10', status: 'Read', type: 'Customer Messages', hasAttachment: false, replies: [] },
    { id: 'msg-3', sender: 'Ravi Kumar', badge: 'Deal', subject: 'Revised Quotation', snippet: 'Attached is the revised quotation as discussed.', time: '10:20 AM', date: '2026-10-10', status: 'Starred', type: 'Deal Messages', hasAttachment: true, replies: [] },
    { id: 'msg-4', sender: 'Sneha M', badge: 'Lead', subject: 'Demo Call Tomorrow', snippet: 'Can we schedule a demo call tomorrow at 11 AM?', time: '09:48 AM', date: '2026-10-10', status: 'Not Read', type: 'Lead Messages', hasAttachment: false, replies: [] },
    { id: 'msg-5', sender: 'Karthik T', badge: 'Account', subject: 'Contract Approval', snippet: 'Following up on the contract approval status.', time: '09:15 AM', date: '2026-10-10', status: 'Read', type: 'Customer Messages', hasAttachment: false, replies: [] },
    { id: 'msg-6', sender: 'Divya R', badge: 'Deal', subject: 'Payment Confirmation', snippet: 'Payment confirmation and invoice details.', time: '08:52 AM', date: '2026-10-10', status: 'Read', type: 'Deal Messages', hasAttachment: false, replies: [] },
    { id: 'msg-7', sender: 'Mohan S', badge: 'Lead', subject: 'Enterprise Plan', snippet: 'Interested in the enterprise plan. Please share details.', time: '08:34 AM', date: '2026-10-10', status: 'Not Read', type: 'Lead Messages', hasAttachment: false, replies: [] },
    { id: 'msg-8', sender: 'Ritu J', badge: 'Contact', subject: 'Meeting Notes', snippet: 'Sharing the meeting notes and next steps.', time: '07:26 AM', date: '2026-10-10', status: 'Read', type: 'Customer Messages', hasAttachment: true, replies: [] },
    { id: 'msg-9', sender: 'Vikram P', badge: 'Account', subject: 'Integration Setup Support', snippet: 'Need support with the integration setup.', time: '06:58 AM', date: '2026-10-10', status: 'Read', type: 'Internal Messages', hasAttachment: false, replies: [] },
    { id: 'msg-10', sender: 'Anitha N', badge: 'Lead', subject: 'Product Walkthrough Feedback', snippet: 'Thanks for the product walkthrough. It was very helpful.', time: '05:40 AM', date: '2026-10-10', status: 'Read', type: 'Lead Messages', hasAttachment: false, replies: [] },
  ];
}

function seedNotifications() {
  return [
    { id: 'n-1', message: 'New Lead "Arun Kumar" created and assigned to Karthik S.', module: 'Leads', workflowName: 'Zoho Standard Lead Workflow', createdAt: '2026-10-10T11:30:00', read: false },
    { id: 'n-2', message: 'Invoice INV-2026-003 for Tech Corp is overdue.', module: 'Zoho Finance', createdAt: '2026-10-08T09:10:00', read: false },
    { id: 'n-3', message: 'Deal "Annual Support Renewal" moved to Closed Won.', module: 'Deals', createdAt: '2026-10-07T17:40:00', read: false },
    { id: 'n-4', message: 'Divya R logged a call with Priya Singh.', module: 'Calls', createdAt: '2026-10-07T11:20:00', read: true },
    { id: 'n-5', message: 'WorkQueue task "Follow up with ABC Technologies" due today.', module: 'Workqueue', createdAt: '2026-10-10T08:00:00', read: false },
  ];
}

export function seedWorkflows() {
  return [
    {
      id: 'wf-0', name: 'Zoho Standard Lead Workflow', module: 'Leads', active: true,
      description: 'New Lead Created → Assign Agent → Create WorkQueue Task → Send Follow-up Message → Update Lead Status → Add Notification',
      createdAt: '2026-09-01T09:00:00', runs: 14, lastRun: '2026-10-10T11:30:00',
      nodes: [
        { id: 't1', type: 'trigger', position: { x: 260, y: 30 }, data: { triggerType: 'Record Created', field: '', toValue: '' } },
        { id: 'a1', type: 'action', position: { x: 60, y: 190 }, data: { actionType: 'Assign Record Owner', owner: 'u4' } },
        { id: 'a2', type: 'action', position: { x: 340, y: 190 }, data: { actionType: 'Create Follow-up Task', title: 'Follow up with new lead {{name}}', dueDays: 1, priority: 'High' } },
        { id: 'a3', type: 'action', position: { x: 620, y: 190 }, data: { actionType: 'Send Follow-up Message', message: 'Hi {{name}}, thanks for your interest in our CRM solution. An agent has been assigned to your request.' } },
        { id: 'a4', type: 'action', position: { x: 60, y: 360 }, data: { actionType: 'Update Record Status', status: 'Contacted' } },
        { id: 'a5', type: 'action', position: { x: 340, y: 360 }, data: { actionType: 'Add Notification', message: 'New Lead {{name}} assigned to Karthik S and follow-up scheduled.' } },
        { id: 'a6', type: 'action', position: { x: 620, y: 360 }, data: { actionType: 'Create Activity Log', message: 'Zoho automated lead onboarding executed for {{name}}.' } },
      ],
      edges: [
        { id: 'e1', source: 't1', target: 'a1' },
        { id: 'e2', source: 't1', target: 'a2' },
        { id: 'e3', source: 't1', target: 'a3' },
        { id: 'e4', source: 'a1', target: 'a4' },
        { id: 'e5', source: 'a2', target: 'a5' },
        { id: 'e6', source: 'a3', target: 'a6' },
      ],
    },
    {
      id: 'wf-1', name: 'High-value deal alert', module: 'Deals', active: true,
      description: 'Routes new deals above ₹10,00,000 to the sales manager.', createdAt: '2026-09-01T10:00:00', runs: 3, lastRun: '2026-10-08T15:20:00',
      nodes: [
        { id: 't1', type: 'trigger', position: { x: 260, y: 30 }, data: { triggerType: 'Record Created', field: '', toValue: '' } },
        { id: 'c1', type: 'condition', position: { x: 230, y: 190 }, data: { logic: 'AND', rules: [{ field: 'amount', operator: 'Greater Than', value: '1000000' }] } },
        { id: 'a1', type: 'action', position: { x: 40, y: 380 }, data: { actionType: 'Assign Record Owner', owner: 'u1' } },
        { id: 'a2', type: 'action', position: { x: 320, y: 380 }, data: { actionType: 'Add Notification', message: 'High-value deal "{{name}}" created for {{amount}}.' } },
        { id: 'a3', type: 'action', position: { x: 600, y: 380 }, data: { actionType: 'Create Activity Log', message: 'High-value deal routed to Sibi Chakaravarthi.' } },
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
      description: 'Notifies the team and creates a collection task when an invoice becomes overdue.', createdAt: '2026-09-05T10:00:00', runs: 5, lastRun: '2026-10-09T09:10:00',
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
