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

export const SEED_VERSION = 8;

export const USERS = [
  { id: 'u1', name: 'Sibi Chakaravarthi', role: 'Sales Manager', group: 'Marketing Department', email: 'sibi.chakaravarthi@crm.in', color: '#1262E0', title: 'Sales Manager / CEO', status: 'Active' },
  { id: 'u2', name: 'Arun Kumar', role: 'Sales Executive', group: 'Sales Department', email: 'arun.kumar@crm.in', color: '#1F6FEB', status: 'Active' },
  { id: 'u3', name: 'Priya Sharma', role: 'Account Executive', group: 'Enterprise Sales', email: 'priya.sharma@crm.in', color: '#D9468F', status: 'Active' },
  { id: 'u4', name: 'Karthik S', role: 'Senior Sales Executive', group: 'Sales Department', email: 'karthik.s@crm.in', color: '#0E9F6E', status: 'Active' },
  { id: 'u5', name: 'Divya R', role: 'Account Executive', group: 'Marketing Department', email: 'divya.r@crm.in', color: '#8B3DF0', status: 'Active' },
  { id: 'u6', name: 'Ravi Kumar', role: 'Sales Executive', group: 'Sales Department', email: 'ravi.kumar@crm.in', color: '#B45309', status: 'Active' },
  { id: 'u7', name: 'Sneha R', role: 'Sales Executive', group: 'Inside Sales', email: 'sneha.r@crm.in', color: '#7C3AED', status: 'Active' },
  { id: 'u8', name: 'Mohan Raj', role: 'Inside Sales', group: 'Inside Sales', email: 'mohan.raj@crm.in', color: '#0F766E', status: 'Active' },
  { id: 'u9', name: 'Anitha M', role: 'Customer Success', group: 'Operations Team', email: 'anitha.m@crm.in', color: '#F04438', status: 'Active' },
  { id: 'u10', name: 'Vikram P', role: 'Sales Specialist', group: 'Enterprise Sales', email: 'vikram.p@crm.in', color: '#2563EB', status: 'Active' },
  { id: 'u11', name: 'Keerthi K', role: 'Operations Lead', group: 'Administration Team', email: 'keerthi.k@crm.in', color: '#D97706', status: 'Inactive' },
];

export const USER_ROLES = [
  'Sales Manager',
  'Sales Executive',
  'Account Executive',
  'Senior Sales Executive',
  'Inside Sales',
  'Customer Success',
  'Sales Specialist',
  'Operations Lead',
];

export const USER_GROUPS = [
  'Marketing Department',
  'Sales Department',
  'Enterprise Sales',
  'Inside Sales',
  'Operations Team',
  'Administration Team',
];

export const CAMPAIGN_TYPES = [
  '-Select Campaign Type-',
  'Zoho Campaigns',
  'Advertisement',
  'Banner Ads',
  'Conference',
  'Direct mail',
  'Email',
  'Others',
  'Partners',
  'Public Relations',
  'Referral Program',
  'Telemarketing',
  'Trade Show',
  'Webinar',
  'Zoho Survey',
  'Zoho Webinar',
];

export const ACCOUNT_TYPES = ['Customer', 'Prospect', 'Partner', 'Vendor'];
export const ACCOUNT_STATUSES = ['Active', 'Inactive', 'New'];
export const INDUSTRIES = ['IT Services', 'Software', 'Technology', 'Consulting', 'Manufacturing', 'Construction', 'Finance', 'Healthcare', 'Retail', 'Logistics', 'Education', 'Textiles'];
export const LOCATIONS = ['Chennai', 'Bangalore', 'Hyderabad', 'Mumbai', 'Pune', 'Delhi', 'Kochi', 'Coimbatore', 'Ahmedabad', 'Kolkata'];
export const LIFECYCLES = ['New', 'Contacted', 'Engaged', 'Qualified', 'Customer'];
export const LEAD_SOURCES = ['Website', 'Justdial', 'Indiamart', 'Existing Client', 'Database call', 'Email Marketing', 'LinkedIn', 'Cold Call', 'Conference', 'Referral', 'Trade Show', 'Internal', 'Direct Contact', 'Social Media', 'Email Campaign'];
export const DEAL_SOURCES = ['Website', 'Referral', 'Cold Call', 'Email', 'Partner'];
export const DEPARTMENTS = ['Enterprise Sales', 'SMB Sales', 'Inside Sales', 'Partnerships'];
export const CALL_TYPES = ['Outbound', 'Inbound'];
export const CALL_STATUSES = ['Completed', 'Missed', 'Busy', 'Scheduled'];
export const INVOICE_TYPES = ['Sales Invoice', 'Recurring Invoice', 'Credit Note', 'Debit Note'];
export const INVOICE_STATUSES = ['Paid', 'Pending', 'Overdue', 'Partially Paid'];
export const AVATAR_COLORS = ['#1F6FEB', '#A238D6', '#FF7A2F', '#0B3D91', '#13B39A', '#F0453A', '#8B3DF0', '#18A957', '#2D7FF9', '#FF8A1F'];

export const LEAD_STATUSES = ['Assigned', 'New', 'Contacted', 'Qualified', 'Proposal', 'Converted', 'Lost', 'RNR', 'Pending', 'Followup'];
export const LEAD_TAGS = [
  'Already Job Completed',
  'Asking Very Low Rate',
  'Block List',
  'Complicated',
  'Deal Done',
  'Duplicate',
  'Foreign Number',
  'Future Requirements',
  'Insufficient Contact Det',
  'Invaild Number',
  'Job seeking',
  'Junk',
  'Not contactable',
  'Offline Service',
  'Service Not Provided',
  'followup',
  'swich off',
];
export const CRM_TAGS = LEAD_TAGS;
export const CITIES = [
  'Amritsar', 'Bangalore', 'Chandigarh', 'Chennai', 'Coimbatore', 'Delhi', 'Ernakulam',
  'Hyderabad', 'Jaipur', 'Kottayam', 'Madurai', 'Mangalore', 'Mumbai', 'Nagpur', 'Nashik',
  'Pondicherry', 'Pune', 'Surat', 'Trivandrum', 'Vadodara', 'Visakhapatnam', 'Erode',
  'Chengalpattu', 'Rajamamdry', 'Arignar Anna Nagar',
];
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
    campaigns: seedCampaigns(),
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

const ENRICH_META = [
  { salutation: 'Mr.', branchArea: 'South Veli', category: 'Translation Services', productName: 'Document Translation Suite', sourceLang: 'English', targetLang: 'Tamil', ceoApproval: 'Approved', performance: 'Good', campaignType: 'Zoho Campaigns', campaignName: 'Q4 Justdial Inbound', allottedManagerId: 'u1', createdBy: 'Administration Team', workingHours: '09:00 AM - 06:00 PM', websiteSource: 'justdial.com', emailSentiment: 'Positive', latestEmailStatus: 'Opened', cadence: 'Inbound Lead Cadence', avgTime: 14, daysVisited: 4, firstPage: '/translation-services', chats: 2, referrer: 'justdial.com', visitorScore: 76, assignedRecent: true, connectedAccId: 'acc-001', connectedConId: 'con-001', connectedDealId: 'deal-001', callId: 'call-001', checkbox1: true, dashboardReq: true, workflowCheckbox: true, touched: true, locked: false },
  { salutation: 'Mr.', branchArea: 'Brough Road', category: 'Attestation Services', productName: 'Apostille & Attestation', sourceLang: 'Tamil', targetLang: 'English', ceoApproval: 'Pending', performance: 'Average', campaignType: 'Telemarketing', campaignName: 'Erode SMB Outreach', allottedManagerId: 'u1', createdBy: 'Karthik S', workingHours: '09:00 AM - 06:00 PM', websiteSource: 'justdial.com', emailSentiment: 'Neutral', latestEmailStatus: 'Delivered', cadence: 'Inbound Lead Cadence', avgTime: 8, daysVisited: 2, firstPage: '/attestation', chats: 1, referrer: 'justdial.com', visitorScore: 62, assignedRecent: true, connectedAccId: 'acc-002', connectedConId: 'con-002', connectedDealId: '', callId: 'call-002', checkbox1: false, dashboardReq: true, workflowCheckbox: true, touched: true, locked: false },
  { salutation: 'Ms.', branchArea: 'GST Road', category: 'Designer Poster Dealers', productName: 'Enterprise CRM', sourceLang: 'English', targetLang: 'Hindi', ceoApproval: 'Approved', performance: 'Excellent', campaignType: 'Webinar', campaignName: 'Enterprise Automation Webinar', allottedManagerId: 'u1', createdBy: 'Priya Sharma', workingHours: '10:00 AM - 07:00 PM', websiteSource: 'honeytranslations.com', emailSentiment: 'Positive', latestEmailStatus: 'Clicked', cadence: 'Enterprise Follow-up', avgTime: 22, daysVisited: 6, firstPage: '/pricing', chats: 3, referrer: 'google.com', visitorScore: 88, assignedRecent: false, connectedAccId: 'acc-003', connectedConId: 'con-003', connectedDealId: 'deal-003', callId: 'call-003', checkbox1: true, dashboardReq: true, workflowCheckbox: true, touched: true, locked: false },
  { salutation: 'Mr.', branchArea: 'Perundurai Road', category: 'Education Consultants', productName: 'Campus CRM & Localization', sourceLang: 'English', targetLang: 'French', ceoApproval: 'Approved', performance: 'Good', campaignType: 'Referral Program', campaignName: 'Partner Referral Q3', allottedManagerId: 'u3', createdBy: 'Arun Kumar', workingHours: '09:30 AM - 06:30 PM', websiteSource: 'educonsult.org', emailSentiment: 'Positive', latestEmailStatus: 'Opened', cadence: 'Enterprise Follow-up', avgTime: 18, daysVisited: 5, firstPage: '/education-crm', chats: 2, referrer: 'partner-portal.in', visitorScore: 82, assignedRecent: false, connectedAccId: 'acc-004', connectedConId: 'con-004', connectedDealId: 'deal-004', callId: 'call-004', checkbox1: true, dashboardReq: false, workflowCheckbox: true, touched: true, locked: false },
  { salutation: 'Ms.', branchArea: 'Perundurai Road', category: 'Education Consultants', productName: 'Enterprise Suite', sourceLang: 'English', targetLang: 'German', ceoApproval: 'Approved', performance: 'Excellent', campaignType: 'Zoho Webinar', campaignName: 'EdTech Leaders Summit', allottedManagerId: 'u1', createdBy: 'Sibi Chakaravarthi', workingHours: '09:00 AM - 06:00 PM', websiteSource: 'honeytranslations.com', emailSentiment: 'Positive', latestEmailStatus: 'Clicked', cadence: 'Enterprise Follow-up', avgTime: 30, daysVisited: 9, firstPage: '/enterprise-suite', chats: 4, referrer: 'google.com', visitorScore: 95, assignedRecent: false, connectedAccId: 'acc-005', connectedConId: 'con-005', connectedDealId: 'deal-005', callId: 'call-005', checkbox1: true, dashboardReq: true, workflowCheckbox: true, touched: true, locked: true, convertedAccount: 'Prime Tech', convertedContact: 'Mohit Kapoor', convertedDeal: 'Annual Support Renewal', leadConversionTime: '10 days' },
  { salutation: 'Mr.', branchArea: 'Main Bazar', category: 'Agro Allied', productName: 'Regional Translation Desk', sourceLang: 'Telugu', targetLang: 'English', ceoApproval: 'None', performance: 'Average', campaignType: 'Direct mail', campaignName: 'AP Agro Outreach', allottedManagerId: 'u4', createdBy: 'Ravi Kumar', workingHours: '09:00 AM - 06:00 PM', websiteSource: 'rajamagro.in', emailSentiment: 'Neutral', latestEmailStatus: 'Sent', cadence: 'Cold Outreach Cadence', avgTime: 5, daysVisited: 1, firstPage: '/home', chats: 0, referrer: 'direct', visitorScore: 54, assignedRecent: false, connectedAccId: 'acc-006', connectedConId: 'con-006', connectedDealId: '', callId: 'call-006', checkbox1: false, dashboardReq: false, workflowCheckbox: false, touched: false, locked: false },
  { salutation: 'Dr.', branchArea: 'Anna Nagar', category: 'Medical Transcription', productName: 'Medical Transcription Suite', sourceLang: 'English', targetLang: 'Tamil', ceoApproval: 'Pending', performance: 'Good', campaignType: 'Conference', campaignName: 'MedTech Chennai 2026', allottedManagerId: 'u1', createdBy: 'Sneha R', workingHours: '24/7 Shift', websiteSource: 'medtranscript.com', emailSentiment: 'Positive', latestEmailStatus: 'Opened', cadence: 'Inbound Lead Cadence', avgTime: 16, daysVisited: 4, firstPage: '/healthcare', chats: 2, referrer: 'medtechconf.in', visitorScore: 70, assignedRecent: false, connectedAccId: 'acc-007', connectedConId: 'con-007', connectedDealId: 'deal-007', callId: 'call-007', checkbox1: true, dashboardReq: true, workflowCheckbox: true, touched: true, locked: false },
  { salutation: 'Mr.', branchArea: 'Mount Road', category: 'Transcription Services', productName: 'Audio Transcription Pro', sourceLang: 'Hindi', targetLang: 'English', ceoApproval: 'None', performance: 'Poor', campaignType: 'Banner Ads', campaignName: 'Display Network Q3', allottedManagerId: 'u4', createdBy: 'Mohan Raj', workingHours: '09:00 AM - 06:00 PM', websiteSource: 'transcripts.co', emailSentiment: 'Negative', latestEmailStatus: 'Bounced', cadence: '', avgTime: 2, daysVisited: 1, firstPage: '/landing', chats: 0, referrer: 'ads.google.com', visitorScore: 35, assignedRecent: false, connectedAccId: '', connectedConId: '', connectedDealId: '', callId: 'call-008', checkbox1: false, dashboardReq: false, workflowCheckbox: false, touched: false, locked: false, unsubscribedMode: 'Bounced', unsubscribedTime: '2026-09-16 10:00 AM' },
  { salutation: 'Mr.', branchArea: 'T. Nagar', category: 'Translators', productName: 'Multilingual Localization', sourceLang: 'French', targetLang: 'English', ceoApproval: 'None', performance: 'Average', campaignType: 'Advertisement', campaignName: 'Print & Digital Ad', allottedManagerId: 'u4', createdBy: 'Mohan Raj', workingHours: '09:00 AM - 06:00 PM', websiteSource: 'translators.in', emailSentiment: 'Neutral', latestEmailStatus: 'Sent', cadence: 'Cold Outreach Cadence', avgTime: 4, daysVisited: 1, firstPage: '/services', chats: 0, referrer: 'bing.com', visitorScore: 42, assignedRecent: false, connectedAccId: '', connectedConId: '', connectedDealId: '', callId: 'call-009', checkbox1: false, dashboardReq: false, workflowCheckbox: true, touched: false, locked: false },
  { salutation: 'Mr.', branchArea: 'Purasawalkam', category: 'DTP Services', productName: 'Desktop Publishing', sourceLang: 'Arabic', targetLang: 'English', ceoApproval: 'Rejected', performance: 'Poor', campaignType: 'Others', campaignName: 'General Directory Listing', allottedManagerId: 'u4', createdBy: 'Administration Team', workingHours: '09:00 AM - 06:00 PM', websiteSource: 'dtpservices.in', emailSentiment: 'Negative', latestEmailStatus: 'Bounced', cadence: '', avgTime: 1, daysVisited: 1, firstPage: '/contact', chats: 0, referrer: 'direct', visitorScore: 20, assignedRecent: false, connectedAccId: '', connectedConId: '', connectedDealId: '', callId: 'call-010', checkbox1: false, dashboardReq: false, workflowCheckbox: false, touched: false, locked: true, reopenLead: false, unsubscribedMode: 'Manual', unsubscribedTime: '2026-09-18 02:30 PM' },
  { salutation: 'Mr.', branchArea: 'OMR Road', category: 'Information Technology', productName: 'Cloud CRM Automation & AI Workflows', sourceLang: 'English', targetLang: 'Japanese', ceoApproval: 'Approved', performance: 'Excellent', campaignType: 'Zoho Campaigns', campaignName: 'Enterprise AI CRM Launch', allottedManagerId: 'u1', createdBy: 'Sibi Chakaravarthi', workingHours: '09:00 AM - 06:00 PM', websiteSource: 'abcsolutions.com', emailSentiment: 'Positive', latestEmailStatus: 'Clicked', cadence: 'Enterprise Follow-up', avgTime: 26, daysVisited: 7, firstPage: '/ai-workflows', chats: 3, referrer: 'google.com', visitorScore: 91, assignedRecent: true, connectedAccId: 'acc-001', connectedConId: 'con-011', connectedDealId: 'deal-001', callId: 'call-001', checkbox1: true, dashboardReq: true, workflowCheckbox: true, touched: true, locked: false },
  { salutation: 'Ms.', branchArea: 'Taramani', category: 'Software', productName: 'Cloud Migration Suite', sourceLang: 'English', targetLang: 'Spanish', ceoApproval: 'Approved', performance: 'Good', campaignType: 'Partners', campaignName: 'SI Partner Co-Marketing', allottedManagerId: 'u3', createdBy: 'Anitha M', workingHours: '10:00 AM - 07:00 PM', websiteSource: 'xyztechnologies.io', emailSentiment: 'Positive', latestEmailStatus: 'Opened', cadence: 'Enterprise Follow-up', avgTime: 19, daysVisited: 5, firstPage: '/cloud-crm', chats: 2, referrer: 'linkedin.com', visitorScore: 79, assignedRecent: true, connectedAccId: 'acc-002', connectedConId: 'con-012', connectedDealId: 'deal-002', callId: 'call-002', checkbox1: true, dashboardReq: true, workflowCheckbox: true, touched: true, locked: false },
  { salutation: 'Mr.', branchArea: 'Kappalur', category: 'Manufacturing', productName: 'Territory & Pipeline Pro', sourceLang: 'Tamil', targetLang: 'English', ceoApproval: 'Approved', performance: 'Excellent', campaignType: 'Public Relations', campaignName: 'Manufacturing Press Release', allottedManagerId: 'u1', createdBy: 'Vikram P', workingHours: '09:00 AM - 06:00 PM', websiteSource: 'rsenterprises.in', emailSentiment: 'Positive', latestEmailStatus: 'Clicked', cadence: 'Enterprise Follow-up', avgTime: 24, daysVisited: 6, firstPage: '/manufacturing-crm', chats: 3, referrer: 'linkedin.com', visitorScore: 90, assignedRecent: false, connectedAccId: 'acc-008', connectedConId: 'con-013', connectedDealId: 'deal-008', callId: 'call-003', checkbox1: true, dashboardReq: true, workflowCheckbox: true, touched: true, locked: false },
  { salutation: 'Ms.', branchArea: 'Gandhiji Road', category: 'Information Technology', productName: 'Enterprise 50-Seat License', sourceLang: 'English', targetLang: 'German', ceoApproval: 'Approved', performance: 'Good', campaignType: 'Email', campaignName: 'IT Leaders Drip Campaign', allottedManagerId: 'u5', createdBy: 'Divya R', workingHours: '09:30 AM - 06:30 PM', websiteSource: 'dtechsolutions.com', emailSentiment: 'Positive', latestEmailStatus: 'Opened', cadence: 'Enterprise Follow-up', avgTime: 20, daysVisited: 5, firstPage: '/enterprise-pricing', chats: 2, referrer: 'newsletter', visitorScore: 84, assignedRecent: false, connectedAccId: 'acc-007', connectedConId: 'con-004', connectedDealId: 'deal-007', callId: 'call-005', checkbox1: true, dashboardReq: true, workflowCheckbox: true, touched: true, locked: false },
  { salutation: 'Mr.', branchArea: 'George Town', category: 'Retail', productName: 'Omnichannel Retail CRM', sourceLang: 'English', targetLang: 'Tamil', ceoApproval: 'Approved', performance: 'Excellent', campaignType: 'Zoho Survey', campaignName: 'Retail Readiness Survey', allottedManagerId: 'u1', createdBy: 'Mohan Raj', workingHours: '09:00 AM - 06:00 PM', websiteSource: 'mnrtraders.in', emailSentiment: 'Positive', latestEmailStatus: 'Clicked', cadence: 'Enterprise Follow-up', avgTime: 28, daysVisited: 8, firstPage: '/retail-pos-crm', chats: 4, referrer: 'google.com', visitorScore: 96, assignedRecent: false, connectedAccId: 'acc-011', connectedConId: 'con-015', connectedDealId: 'deal-010', callId: 'call-010', checkbox1: true, dashboardReq: true, workflowCheckbox: true, touched: true, locked: true, convertedAccount: 'Acme Technologies', convertedContact: 'Priya Sharma', convertedDeal: 'Custom Development', leadConversionTime: '7 days' },
  { salutation: 'Ms.', branchArea: 'Avanashi Road', category: 'Textiles', productName: 'Export Order Tracker', sourceLang: 'English', targetLang: 'French', ceoApproval: 'Pending', performance: 'Good', campaignType: 'Trade Show', campaignName: 'Coimbatore TexFair 2026', allottedManagerId: 'u11', createdBy: 'Keerthi K', workingHours: '09:00 AM - 06:00 PM', websiteSource: 'apexfabrics.com', emailSentiment: 'Neutral', latestEmailStatus: 'Delivered', cadence: 'Inbound Lead Cadence', avgTime: 11, daysVisited: 3, firstPage: '/textile-export', chats: 1, referrer: 'texfair.in', visitorScore: 68, assignedRecent: false, connectedAccId: 'acc-012', connectedConId: 'con-002', connectedDealId: '', callId: 'call-006', checkbox1: false, dashboardReq: true, workflowCheckbox: true, touched: false, locked: false },
  { salutation: 'Mr.', branchArea: 'Koramangala', category: 'Technology', productName: 'API & Webhook Studio', sourceLang: 'English', targetLang: 'Chinese', ceoApproval: 'Approved', performance: 'Good', campaignType: 'Zoho Campaigns', campaignName: 'Developer Cloud Series', allottedManagerId: 'u2', createdBy: 'Arun Kumar', workingHours: '10:00 AM - 07:00 PM', websiteSource: 'cloudwavelabs.com', emailSentiment: 'Positive', latestEmailStatus: 'Opened', cadence: 'Inbound Lead Cadence', avgTime: 17, daysVisited: 5, firstPage: '/developers/webhooks', chats: 2, referrer: 'linkedin.com', visitorScore: 80, assignedRecent: false, connectedAccId: 'acc-013', connectedConId: 'con-008', connectedDealId: 'deal-002', callId: 'call-002', checkbox1: true, dashboardReq: true, workflowCheckbox: true, touched: true, locked: false },
  { salutation: 'Ms.', branchArea: 'Adyar', category: 'Marketing', productName: 'Campaign Analytics Pro', sourceLang: 'English', targetLang: 'Tamil', ceoApproval: 'Approved', performance: 'Excellent', campaignType: 'Referral Program', campaignName: 'Agency Partner Program', allottedManagerId: 'u3', createdBy: 'Priya Sharma', workingHours: '09:30 AM - 06:30 PM', websiteSource: 'brightmedia.in', emailSentiment: 'Positive', latestEmailStatus: 'Clicked', cadence: 'Enterprise Follow-up', avgTime: 21, daysVisited: 6, firstPage: '/agency-analytics', chats: 3, referrer: 'partner-portal.in', visitorScore: 89, assignedRecent: false, connectedAccId: 'acc-015', connectedConId: 'con-001', connectedDealId: 'deal-006', callId: 'call-003', checkbox1: true, dashboardReq: true, workflowCheckbox: true, touched: true, locked: false },
  { salutation: 'Mr.', branchArea: 'HITEC City', category: 'Logistics', productName: 'Fleet & Dispatch CRM', sourceLang: 'Telugu', targetLang: 'English', ceoApproval: 'Pending', performance: 'Good', campaignType: 'Webinar', campaignName: 'Supply Chain Digitalization', allottedManagerId: 'u6', createdBy: 'Ravi Kumar', workingHours: '24/7 Shift', websiteSource: 'stellarlogistics.in', emailSentiment: 'Positive', latestEmailStatus: 'Opened', cadence: 'Enterprise Follow-up', avgTime: 15, daysVisited: 4, firstPage: '/logistics-crm', chats: 1, referrer: 'google.com', visitorScore: 74, assignedRecent: false, connectedAccId: 'acc-016', connectedConId: 'con-008', connectedDealId: 'deal-008', callId: 'call-008', checkbox1: false, dashboardReq: true, workflowCheckbox: true, touched: true, locked: false },
  { salutation: 'Ms.', branchArea: 'Kilpauk', category: 'Healthcare', productName: 'HIPAA Compliant Patient CRM', sourceLang: 'English', targetLang: 'Malayalam', ceoApproval: 'Approved', performance: 'Good', campaignType: 'Trade Show', campaignName: 'Healthcare Expo 2026', allottedManagerId: 'u7', createdBy: 'Sneha R', workingHours: '09:00 AM - 06:00 PM', websiteSource: 'zenithhealth.org', emailSentiment: 'Positive', latestEmailStatus: 'Delivered', cadence: 'Inbound Lead Cadence', avgTime: 13, daysVisited: 3, firstPage: '/healthcare-compliance', chats: 2, referrer: 'healthcareexpo.in', visitorScore: 72, assignedRecent: false, connectedAccId: 'acc-018', connectedConId: 'con-010', connectedDealId: 'deal-009', callId: 'call-007', checkbox1: true, dashboardReq: true, workflowCheckbox: true, touched: true, locked: false, reopenLead: true },
];

function enrichSeedLeads(rawLeads) {
  const nowMs = Date.now();
  return rawLeads.map((l, idx) => {
    const m = ENRICH_META[idx] || ENRICH_META[0];
    const zipMatch = (l.address || '').match(/\b(\d{6})\b/);
    const zip = zipMatch ? zipMatch[1] : String(600001 + idx * 10);
    const state = (l.address || '').includes('Andhra') ? 'Andhra Pradesh'
      : (l.city === 'Bangalore') ? 'Karnataka'
      : (l.city === 'Hyderabad') ? 'Telangana'
      : (l.city === 'Delhi') ? 'Delhi'
      : 'Tamil Nadu';
    const street = (l.address || '').split(',')[0] || 'Main Road';
    const callActs = (l.activities || []).filter((a) => /call/i.test(a.type));
    const assignedIso = m.assignedRecent
      ? new Date(nowMs - (idx + 1) * 28 * 60 * 1000).toISOString()
      : `${l.createdOn}T09:15:00.000Z`;
    const agingDays = Math.max(1, Math.floor((Date.parse('2026-10-12') - Date.parse(l.createdOn || '2026-10-01')) / 86400000));

    const cat = l.category || m.category;
    const prod = l.productName || m.productName;
    const branch = l.branchArea || l.city || m.branchArea;
    return {
      ...l,
      salutation: l.salutation || m.salutation,
      leadSource: l.source,
      category: cat,
      branchArea: branch,
      productName: prod,
      clientName: l.name,
      comments: `${cat} inquiry — ${l.status} stage`,
      description: l.remarks,
      street,
      state: l.state || state,
      country: 'India',
      zip,
      allottedManagerId: l.allottedManagerId || m.allottedManagerId,
      leadManager1Id: l.ownerId,
      createdBy: l.createdBy || m.createdBy,
      date: l.createdOn,
      pushTime: `${l.createdOn} 08:30 AM`,
      assignedTime: m.assignedRecent ? 'Today, 09:45 AM' : `${l.createdTime}`,
      assignedAt: assignedIso,
      assignedWithinLast3Hours: l.assignedWithinLast3Hours !== undefined ? !!l.assignedWithinLast3Hours : !!m.assignedRecent,
      modifiedTime: `${l.createdOn} 05:15 PM`,
      lastActivityTime: l.activities?.[0]?.date || `${l.createdOn} 11:30 AM`,
      leadAging: `${agingDays} days`,
      leadActivityAging: `${Math.max(1, agingDays - 1)} days`,
      ceoApproval: l.ceoApproval || m.ceoApproval,
      leadConversionTime: l.leadConversionTime || m.leadConversionTime || '',
      performance: l.performance || m.performance,
      sourceLang: l.sourceLang || m.sourceLang,
      targetLang: l.targetLang || m.targetLang,
      workingHours: l.workingHours || m.workingHours,
      websiteSource: l.websiteSource || m.websiteSource,
      justdialId: l.source === 'Justdial' ? `JD-2026-${1001 + idx}` : '',
      phoneAlt: l.phone,
      readStatus: l.readStatus || (idx % 3 === 0 ? 'Unread' : 'Read'),
      tag: l.tag && l.tag !== 'Lead' && l.tag !== 'Hot Lead' ? l.tag : '',
      tagField: l.tag && l.tag !== 'Lead' && l.tag !== 'Hot Lead' ? l.tag : '',
      callAttemptCount: callActs.length + (idx % 3),
      callDelay: (idx % 4) * 5,
      callStartTime: callActs[0]?.date || `${l.createdOn} 10:00 AM`,
      directCallDuration: callActs.length ? 120 + idx * 25 : 0,
      whatsappCallDuration: idx % 2 === 0 ? 65 + idx * 10 : 0,
      totalCallCount: callActs.length || (idx % 2),
      totalCallDurations: callActs.length ? 185 + idx * 35 : 0,
      checkbox1: l.checkbox1 !== undefined ? l.checkbox1 : m.checkbox1,
      dashboardReq: l.dashboardReq !== undefined ? l.dashboardReq : m.dashboardReq,
      reopenLead: l.reopenLead !== undefined ? !!l.reopenLead : !!m.reopenLead,
      workflowCheckbox: l.workflowCheckbox !== undefined ? l.workflowCheckbox : m.workflowCheckbox,
      unsubscribedMode: l.unsubscribedMode || m.unsubscribedMode || '',
      unsubscribedTime: l.unsubscribedTime || m.unsubscribedTime || '',
      locked: l.locked !== undefined ? !!l.locked : !!m.locked,
      touched: l.touched !== undefined ? !!l.touched : !!m.touched,
      sharedByMe: l.sharedByMe !== undefined ? !!l.sharedByMe : (idx === 0 || idx === 3 || idx === 10),
      sharedToMe: l.sharedToMe !== undefined ? !!l.sharedToMe : (idx === 1 || idx === 4 || idx === 11),
      inReview: l.inReview !== undefined ? !!l.inReview : (l.ceoApproval === 'Pending' || m.ceoApproval === 'Pending' || l.status === 'Proposal'),
      recordAction: m.touched ? 'Modified' : 'Created',
      relatedRecordsAction: callActs.length ? 'Call Logged' : 'Task Created',
      cadence: m.cadence,
      emailSentiment: m.emailSentiment,
      latestEmailStatus: m.latestEmailStatus,
      campaignType: m.campaignType,
      campaignName: m.campaignName,
      campaignStatus: 'Active',
      averageTimeSpent: m.avgTime,
      daysVisited: m.daysVisited,
      firstPageVisited: m.firstPage,
      firstVisit: l.createdOn,
      mostRecentVisit: '2026-10-11',
      numberOfChats: m.chats,
      referrer: m.referrer,
      visitorScore: m.visitorScore,
      connectedTo: m.connectedAccId ? `Account (${m.connectedAccId})` : '',
      connectedAccountId: m.connectedAccId,
      connectedContactId: m.connectedConId,
      connectedDealId: m.connectedDealId,
      connectedCallId: m.callId,
      convertedAccount: m.convertedAccount || '',
      convertedContact: m.convertedContact || '',
      convertedDeal: m.convertedDeal || '',
      emails: [
        {
          id: `em-${l.id}-1`,
          subject: `Welcome to ${l.company} — ${m.productName} Overview`,
          to: l.email,
          from: 'sibi.chakaravarthi@crm.in',
          date: `${l.createdOn} 10:15 AM`,
          status: m.latestEmailStatus,
          folder: 'Mails',
          sentiment: m.emailSentiment,
          body: `Hi ${l.firstName},\n\nThank you for your interest in ${m.productName}. Please find attached our commercial brochure and implementation timeline.\n\nBest regards,\n${m.createdBy}`,
        },
      ],
      attachments: idx % 2 === 0 ? [
        {
          id: `att-${l.id}-1`,
          fileName: `${l.company.replace(/\s+/g, '_')}_Requirement_Spec.pdf`,
          size: '420 KB',
          uploadedBy: m.createdBy,
          date: l.createdOn,
        },
      ] : [],
      surveys: idx % 3 === 0 ? [
        {
          id: `srv-${l.id}-1`,
          title: 'Lead Discovery & Localization Survey',
          status: 'Completed',
          score: '9/10',
          date: l.createdOn,
        },
      ] : [],
      signDocuments: idx % 4 === 0 ? [
        {
          id: `sign-${l.id}-1`,
          name: `Mutual_NDA_${l.company.replace(/\s+/g, '_')}.pdf`,
          recipient: l.email,
          status: l.status === 'Converted' ? 'Signed' : 'Sent for Signature',
          date: l.createdOn,
        },
      ] : [],
      whatsappMessages: [
        {
          id: `wa-${l.id}-1`,
          text: `Hi ${l.firstName || l.name}, Welcome! Our Sales Representative will contact you shortly regarding ${m.productName}.`,
          date: l.createdTime || l.createdOn,
          via: 'WhatsApp',
          sender: m.createdBy,
          direction: 'Outbound',
        },
      ],
      notes: [
        {
          id: `note-${l.id}-1`,
          title: 'Initial Discovery Note',
          content: l.remarks,
          by: m.createdBy,
          date: l.createdTime || l.createdOn,
        },
      ],
      products: [
        {
          id: `prod-${l.id}-1`,
          name: m.productName,
          category: m.category,
          unitPrice: 45000 + idx * 5000,
        },
      ],
      campaigns: [
        {
          id: `camp-${l.id}-1`,
          name: m.campaignName,
          type: m.campaignType,
          status: 'Active',
          memberStatus: m.latestEmailStatus,
        },
      ],
      approvalLogs: m.ceoApproval !== 'None' ? [
        {
          id: `aplog-${l.id}-1`,
          processName: 'Lead CEO Approval Process',
          status: m.ceoApproval,
          approver: 'Sibi Chakaravarthi',
          date: l.createdOn,
        },
      ] : [],
      cases: idx % 5 === 0 ? [
        {
          id: `case-${l.id}-1`,
          caseNumber: `CASE-2026-0${idx + 1}`,
          subject: `Pre-sales technical query for ${m.productName}`,
          status: 'Open',
        },
      ] : [],
      solutions: idx % 4 === 0 ? [
        {
          id: `sol-${l.id}-1`,
          title: `${m.productName} Integration Guide`,
          status: 'Published',
        },
      ] : [],
      vendors: idx % 3 === 0 ? [
        {
          id: `ven-${l.id}-1`,
          name: 'CloudTel Telephony Partner',
          category: 'Telecom Vendor',
        },
      ] : [],
      invitees: (l.activities || []).some((a) => /meeting|demo/i.test(a.type)) ? [
        {
          id: `inv-${l.id}-1`,
          name: l.name,
          email: l.email,
          meeting: 'Product Walkthrough & Demo',
          status: 'Accepted',
        },
      ] : [],
      vocEvents: idx % 2 === 0 ? [{ id: `voce-${l.id}`, name: 'Customer Feedback Call', sentiment: m.emailSentiment }] : [],
      vocKeywords: [{ id: `vock-${l.id}`, keyword: m.category, frequency: 3 }],
      vocResponses: idx % 2 === 0 ? [{ id: `vocr-${l.id}`, response: `Interested in ${m.productName}`, rating: 5 }] : [],
    };
  });
}

export function seedLeads() {
  const raw = [
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
      phone: '+91 98450 12948', mobile: '+91 98450 12948', city: 'Chennai', tag: 'Invaild Number', status: 'New',
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
      phone: '+91 98765 43210', mobile: '+91 91234 56789', city: 'Chennai', tag: 'followup', status: 'Qualified',
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
      phone: '+91 98401 23456', mobile: '+91 98401 23456', city: 'Chennai', tag: 'Future Requirements', status: 'Contacted',
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
      phone: '+91 98220 34567', mobile: '+91 98220 34567', city: 'Madurai', tag: 'followup', status: 'Qualified',
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
      phone: '+91 98110 45678', mobile: '+91 98110 45678', city: 'Erode', tag: 'Future Requirements', status: 'Proposal',
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
      phone: '+91 98330 56789', mobile: '+91 98330 56789', city: 'Chennai', tag: 'Deal Done', status: 'Converted',
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
      phone: '+91 98550 78901', mobile: '+91 98550 78901', city: 'Bangalore', tag: 'followup', status: 'Contacted',
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
    {
      id: 'lead-21', leadNo: 'LEAD-1021', name: 'Rajesh Khanna', firstName: 'Rajesh', lastName: 'Khanna',
      company: 'Capital Global Services', designation: 'Director', email: 'rajesh@capitalglobal.in',
      phone: '+91 98111 22334', mobile: '+91 98111 22334', city: 'Delhi', state: 'Delhi', tag: 'followup', status: 'Qualified',
      source: 'Website', category: 'Visa', productName: 'Corporate Visa & Attestation Desk',
      address: 'Connaught Place, New Delhi 110001',
      remarks: 'Requires corporate Visa processing and attestation tracking for 40 executives.',
      score: 86, ownerId: 'u4', createdTime: 'Today, 10:15 AM', createdOn: '__today__', followUpDate: '2026-10-14',
      assignedWithinLast3Hours: true, sharedByMe: true,
      activities: [{ type: 'Phone Call', desc: 'Discussed Delhi branch Visa desk onboarding.', by: 'Karthik S', date: '10 Oct 2026 10:15 AM', status: 'Completed' }],
    },
    {
      id: 'lead-22', leadNo: 'LEAD-1022', name: 'Neha Verma', firstName: 'Neha', lastName: 'Verma',
      company: 'Northern Media Studio', designation: 'Production Head', email: 'neha@northernmedia.in',
      phone: '+91 98112 33445', mobile: '+91 98112 33445', city: 'Delhi', state: 'Delhi', tag: 'Lead', status: 'New',
      source: 'Indiamart', category: 'Dubbing/VoiceOver', productName: 'Multilingual Dubbing & VoiceOver Suite',
      address: 'Nehru Place, New Delhi 110019',
      remarks: 'Indiamart enquiry for Dubbing/VoiceOver localization in 8 regional languages.',
      score: 74, ownerId: 'u1', createdTime: 'Today, 09:20 AM', createdOn: '__today__', followUpDate: '2026-10-15',
      assignedWithinLast3Hours: true, readStatus: 'Unread',
      activities: [{ type: 'Lead Created', desc: 'Captured from Indiamart Leads integration.', by: 'System', date: '10 Oct 2026 09:20 AM', status: 'Completed' }],
    },
    {
      id: 'lead-23', leadNo: 'LEAD-1023', name: 'Harpreet Singh', firstName: 'Harpreet', lastName: 'Singh',
      company: 'Punjab Overseas Academy', designation: 'Admissions Head', email: 'harpreet@punjaboverseas.edu',
      phone: '+91 98140 55667', mobile: '+91 98140 55667', city: 'Amritsar', tag: 'Lead', status: 'Contacted',
      source: 'Database call', category: 'Admission', productName: 'University Admission Portal',
      address: 'Ranjit Avenue, Amritsar 143001',
      remarks: 'Enquired about university Admission & student counselling workflow.',
      score: 68, ownerId: 'u2', createdTime: '09 Oct, 03:15 PM', createdOn: '2026-10-09', followUpDate: '2026-10-14',
      activities: [{ type: 'Phone Call', desc: 'Connected via Database call campaign.', by: 'Arun Kumar', date: '09 Oct 2026 03:15 PM', status: 'Completed' }],
    },
    {
      id: 'lead-24', leadNo: 'LEAD-1024', name: 'Manpreet Kaur', firstName: 'Manpreet', lastName: 'Kaur',
      company: 'Tricity Global Ed', designation: 'Counselor', email: 'manpreet@tricityglobal.in',
      phone: '+91 98150 66778', mobile: '+91 98150 66778', city: 'Chandigarh', tag: 'Lead', status: 'Followup',
      source: 'Email Marketing', category: 'Overseas Education', productName: 'Overseas Education CRM',
      address: 'Sector 17, Chandigarh 160017',
      remarks: 'Followup scheduled for Overseas Education partner portal.',
      score: 76, ownerId: 'u3', createdTime: '08 Oct, 01:40 PM', createdOn: '2026-10-08', followUpDate: '2026-10-13',
      activities: [{ type: 'Email Sent', desc: 'Sent Overseas Education brochure via Email Marketing.', by: 'Priya Sharma', date: '08 Oct 2026 01:40 PM', status: 'Completed' }],
    },
    {
      id: 'lead-25', leadNo: 'LEAD-1025', name: 'Varghese Thomas', firstName: 'Varghese', lastName: 'Thomas',
      company: 'Kochi Diplomatic Services', designation: 'Coordinator', email: 'varghese@kochidiplomatic.in',
      phone: '+91 98470 77889', mobile: '+91 98470 77889', city: 'Ernakulam', state: 'Kerala', tag: 'Lead', status: 'Qualified',
      source: 'Website', category: 'Interpretations', productName: 'Live Conference Interpretations',
      address: 'MG Road, Ernakulam, Kerala 682016',
      remarks: 'Simultaneous Interpretations required for international maritime summit.',
      score: 84, ownerId: 'u4', createdTime: '08 Oct, 11:10 AM', createdOn: '2026-10-08', followUpDate: '2026-10-14',
      ceoApproval: 'Pending', inReview: true,
      activities: [{ type: 'Meeting', desc: 'Reviewed interpretation booth requirements.', by: 'Karthik S', date: '08 Oct 2026 11:10 AM', status: 'Completed' }],
    },
    {
      id: 'lead-26', leadNo: 'LEAD-1026', name: 'Devendra Rathore', firstName: 'Devendra', lastName: 'Rathore',
      company: 'PinkCity Heritage Exports', designation: 'Export Manager', email: 'devendra@pinkcityexports.in',
      phone: '+91 98290 88990', mobile: '+91 98290 88990', city: 'Jaipur', tag: 'Lead', status: 'Contacted',
      source: 'Indiamart', category: 'Translation', productName: 'European Catalog Translation',
      address: 'MI Road, Jaipur 302001',
      remarks: 'French and German product catalog translation enquiry.',
      score: 71, ownerId: 'u5', createdTime: '07 Oct, 04:25 PM', createdOn: '2026-10-07', followUpDate: '2026-10-15',
      activities: [{ type: 'Phone Call', desc: 'Shared per-word translation tariff.', by: 'Divya R', date: '07 Oct 2026 04:25 PM', status: 'Completed' }],
    },
    {
      id: 'lead-27', leadNo: 'LEAD-1027', name: 'Mathew Philip', firstName: 'Mathew', lastName: 'Philip',
      company: 'Malabar Publications', designation: 'Chief Editor', email: 'mathew@malabarpub.in',
      phone: '+91 98460 99001', mobile: '+91 98460 99001', city: 'Kottayam', state: 'Kerala', tag: 'Lead', status: 'New',
      source: 'Justdial', category: 'Typing/DTP', productName: 'Multilingual Typing & DTP',
      address: 'KK Road, Kottayam, Kerala 686001',
      remarks: 'Book layout and multilingual Typing/DTP project.',
      score: 64, ownerId: 'u6', createdTime: '07 Oct, 10:05 AM', createdOn: '2026-10-07', followUpDate: '2026-10-16',
      readStatus: 'Unread',
      activities: [{ type: 'Lead Created', desc: 'Inbound JD lead for Kottayam branch.', by: 'System', date: '07 Oct 2026 10:05 AM', status: 'Completed' }],
    },
    {
      id: 'lead-28', leadNo: 'LEAD-1028', name: 'Shetty Ganesh', firstName: 'Ganesh', lastName: 'Shetty',
      company: 'Coastal Marine Logistics', designation: 'Operations Head', email: 'ganesh@coastalmarine.in',
      phone: '+91 98455 11220', mobile: '+91 98455 11220', city: 'Mangalore', state: 'Karnataka', tag: 'Lead', status: 'Contacted',
      source: 'Database call', category: 'Attestation', productName: 'Export Document Attestation',
      address: 'Hampankatta, Mangalore 575001',
      remarks: 'Chamber of Commerce attestation for shipping manifests.',
      score: 69, ownerId: 'u7', createdTime: '06 Oct, 02:50 PM', createdOn: '2026-10-06', followUpDate: '2026-10-14',
      activities: [{ type: 'Phone Call', desc: 'Explained attestation turnaround times.', by: 'Sneha R', date: '06 Oct 2026 02:50 PM', status: 'Completed' }],
    },
    {
      id: 'lead-29', leadNo: 'LEAD-1029', name: 'Siddharth Mehta', firstName: 'Siddharth', lastName: 'Mehta',
      company: 'FinCorp Advisory Mumbai', designation: 'VP Legal', email: 'siddharth@fincorpadvisory.in',
      phone: '+91 98201 22331', mobile: '+91 98201 22331', city: 'Mumbai', state: 'Maharashtra', tag: 'Deal Done', status: 'Converted',
      source: 'Website', category: 'Transcription', productName: 'Board Meeting Legal Transcription',
      address: 'Bandra Kurla Complex, Mumbai 400051',
      remarks: 'Converted enterprise account for financial & legal transcription.',
      score: 94, ownerId: 'u4', createdTime: '05 Oct, 05:10 PM', createdOn: '2026-10-05', followUpDate: '2026-10-12',
      locked: true, sharedToMe: true,
      activities: [{ type: 'Deal Converted', desc: 'Converted to Mumbai Enterprise Contract.', by: 'Karthik S', date: '05 Oct 2026 05:10 PM', status: 'Completed' }],
    },
    {
      id: 'lead-30', leadNo: 'LEAD-1030', name: 'Nitin Deshmukh', firstName: 'Nitin', lastName: 'Deshmukh',
      company: 'Vidarbha Agro Tech', designation: 'Director', email: 'nitin@vidarbhaagro.in',
      phone: '+91 98230 33442', mobile: '+91 98230 33442', city: 'Nagpur', state: 'Maharashtra', tag: 'Lead', status: 'New',
      source: 'Email Marketing', category: 'Other Category', productName: 'Regional Field Service CRM',
      address: 'Sitabuldi, Nagpur 440012',
      remarks: 'Custom regional language localization under Other Category.',
      score: 63, ownerId: 'u8', createdTime: '05 Oct, 11:45 AM', createdOn: '2026-10-05', followUpDate: '2026-10-15',
      activities: [{ type: 'Email Sent', desc: 'Sent regional CRM overview.', by: 'Mohan Raj', date: '05 Oct 2026 11:45 AM', status: 'Completed' }],
    },
    {
      id: 'lead-31', leadNo: 'LEAD-1031', name: 'kulkarni Prajakta', firstName: 'Prajakta', lastName: 'Kulkarni',
      company: 'Nashik Wine Exporters', designation: 'Export Coordinator', email: 'prajakta@nashikexports.in',
      phone: '+91 98225 44553', mobile: '+91 98225 44553', city: 'Nashik', state: 'Maharashtra', tag: 'Lead', status: 'Qualified',
      source: 'Website', category: 'Translation', productName: 'Export Label Localization',
      address: 'College Road, Nashik 422005',
      remarks: 'Spanish and Italian wine label translation & compliance.',
      score: 79, ownerId: 'u9', createdTime: '04 Oct, 04:00 PM', createdOn: '2026-10-04', followUpDate: '2026-10-14',
      activities: [{ type: 'Phone Call', desc: 'Confirmed language pairs and certification needs.', by: 'Anitha M', date: '04 Oct 2026 04:00 PM', status: 'Completed' }],
    },
    {
      id: 'lead-32', leadNo: 'LEAD-1032', name: 'Jean Luc', firstName: 'Jean', lastName: 'Luc',
      company: 'Alliance Culturelle Pondy', designation: 'Program Director', email: 'jeanluc@alliancepondy.org',
      phone: '+91 98430 55664', mobile: '+91 98430 55664', city: 'Pondicherry', tag: 'Lead', status: 'Proposal',
      source: 'Referral', category: 'Interpretations', productName: 'French-English Interpretation Desk',
      address: 'White Town, Pondicherry 605001',
      remarks: 'Bilingual French-English conference interpretation retainer.',
      score: 83, ownerId: 'u10', createdTime: '04 Oct, 12:20 PM', createdOn: '2026-10-04', followUpDate: '2026-10-13',
      inReview: true, ceoApproval: 'Pending',
      activities: [{ type: 'Proposal Sent', desc: 'Shared annual retainer proposal.', by: 'Vikram P', date: '04 Oct 2026 12:20 PM', status: 'Completed' }],
    },
    {
      id: 'lead-33', leadNo: 'LEAD-1033', name: 'Abhijit Joshi', firstName: 'Abhijit', lastName: 'Joshi',
      company: 'Deccan AutoTech Pune', designation: 'Engineering Head', email: 'abhijit@deccanautotech.in',
      phone: '+91 98220 66775', mobile: '+91 98220 66775', city: 'Pune', state: 'Maharashtra', tag: 'Offline Service', status: 'Qualified',
      source: 'Website', category: 'Translation', productName: 'Japanese Technical Manual Translation',
      address: 'Hinjewadi Phase 2, Pune 411057',
      remarks: 'Japanese to English CAD and automotive manual translation.',
      score: 87, ownerId: 'u4', createdTime: '03 Oct, 03:40 PM', createdOn: '2026-10-03', followUpDate: '2026-10-14',
      sharedByMe: true,
      activities: [{ type: 'Meeting', desc: 'Technical glossary review with Pune engineering team.', by: 'Karthik S', date: '03 Oct 2026 03:40 PM', status: 'Completed' }],
    },
    {
      id: 'lead-34', leadNo: 'LEAD-1034', name: 'Chirag Patel', firstName: 'Chirag', lastName: 'Patel',
      company: 'Surat Diamond Bourse Gems', designation: 'Partner', email: 'chirag@suratgems.in',
      phone: '+91 98250 77886', mobile: '+91 98250 77886', city: 'Surat', tag: 'Lead', status: 'Contacted',
      source: 'Indiamart', category: 'Visa', productName: 'Business Visa & Apostille',
      address: 'Athwalines, Surat 395001',
      remarks: 'Antwerp & Dubai business Visa documentation support.',
      score: 73, ownerId: 'u2', createdTime: '02 Oct, 01:15 PM', createdOn: '2026-10-02', followUpDate: '2026-10-15',
      activities: [{ type: 'Phone Call', desc: 'Checklist shared for Belgium business visa.', by: 'Arun Kumar', date: '02 Oct 2026 01:15 PM', status: 'Completed' }],
    },
    {
      id: 'lead-35', leadNo: 'LEAD-1035', name: 'Sreekumar Nair', firstName: 'Sreekumar', lastName: 'Nair',
      company: 'Technopark Digital Media', designation: 'Producer', email: 'sreekumar@technoparkmedia.in',
      phone: '+91 98471 88997', mobile: '+91 98471 88997', city: 'Trivandrum', state: 'Kerala', tag: 'Lead', status: 'Contacted',
      source: 'Website', category: 'Dubbing/VoiceOver', productName: 'E-Learning VoiceOver Studio',
      address: 'Kazhakkoottam, Trivandrum 695581',
      remarks: 'Malayalam and Tamil e-learning voiceover modules.',
      score: 77, ownerId: 'u3', createdTime: '02 Oct, 10:30 AM', createdOn: '2026-10-02', followUpDate: '2026-10-14',
      activities: [{ type: 'Phone Call', desc: 'Shared voice artist sample reel.', by: 'Priya Sharma', date: '02 Oct 2026 10:30 AM', status: 'Completed' }],
    },
    {
      id: 'lead-36', leadNo: 'LEAD-1036', name: 'Bhavesh Shah', firstName: 'Bhavesh', lastName: 'Shah',
      company: 'Baroda Pharma Formulations', designation: 'Regulatory Affairs Head', email: 'bhavesh@barodapharma.in',
      phone: '+91 98240 99008', mobile: '+91 98240 99008', city: 'Vadodara', tag: 'Lead', status: 'Proposal',
      source: 'Database call', category: 'Attestation', productName: 'Drug Regulatory Dossier Attestation',
      address: 'Alkapuri, Vadodara 390007',
      remarks: 'Embassy attestation and translation for pharma export dossiers.',
      score: 81, ownerId: 'u5', createdTime: '01 Oct, 04:45 PM', createdOn: '2026-10-01', followUpDate: '2026-10-15',
      activities: [{ type: 'Proposal Sent', desc: 'Sent regulatory dossier pricing.', by: 'Divya R', date: '01 Oct 2026 04:45 PM', status: 'Completed' }],
    },
    {
      id: 'lead-37', leadNo: 'LEAD-1037', name: 'Venkat Rao', firstName: 'Venkat', lastName: 'Rao',
      company: 'Vizag Maritime Academy', designation: 'Dean of Admissions', email: 'venkat@vizagmaritime.edu',
      phone: '+91 98480 10112', mobile: '+91 98480 10112', city: 'Visakhapatnam', state: 'Andhra Pradesh', tag: 'Lead', status: 'Qualified',
      source: 'Email Marketing', category: 'Admission', productName: 'Student Admission & Overseas Placement',
      address: 'Dwaraka Nagar, Visakhapatnam 530016',
      remarks: 'Admission campaign and Overseas Education certificate verification.',
      score: 80, ownerId: 'u6', createdTime: '01 Oct, 11:05 AM', createdOn: '2026-10-01', followUpDate: '2026-10-16',
      sharedToMe: true,
      activities: [{ type: 'Email Sent', desc: 'Shared admission automation workflow.', by: 'Ravi Kumar', date: '01 Oct 2026 11:05 AM', status: 'Completed' }],
    },
  ];
  return enrichSeedLeads(raw);
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
    { id: 'wq-1', subject: 'Follow up with ABC Technologies', dueDate: '2026-10-10', status: 'In Progress', priority: 'High', relatedTo: 'Deal - Enterprise CRM Setup', relatedModule: 'Deals', relatedRecordId: 'deal-001', contactId: 'con-011', contactName: 'Ravi Sharma', ownerId: 'u4' },
    { id: 'wq-2', subject: 'Prepare proposal for Global Systems', dueDate: '2026-10-11', status: 'Not Started', priority: 'Medium', relatedTo: 'Account - Global Systems', relatedModule: 'Accounts', relatedRecordId: 'acc-004', contactId: 'con-005', contactName: 'Suresh Babu', ownerId: 'u3' },
    { id: 'wq-3', subject: 'Call back - Honey Translation Services', dueDate: '2026-10-11', status: 'Pending', priority: 'High', relatedTo: 'Lead - Justdial User', relatedModule: 'Leads', relatedRecordId: 'lead-1', contactId: 'con-001', contactName: 'Karthik S', ownerId: 'u4' },
    { id: 'wq-4', subject: 'Send updated quotation', dueDate: '2026-10-12', status: 'In Progress', priority: 'Medium', relatedTo: 'Deal - Cloud Migration Project', relatedModule: 'Deals', relatedRecordId: 'deal-002', contactId: 'con-012', contactName: 'Priya Singh', ownerId: 'u5' },
    { id: 'wq-5', subject: 'Product demo meeting', dueDate: '2026-10-12', status: 'Scheduled', priority: 'Low', relatedTo: 'Account - Bright Future', relatedModule: 'Accounts', relatedRecordId: 'acc-006', contactId: 'con-016', contactName: 'Anitha N', ownerId: 'u9' },
    { id: 'wq-6', subject: 'Collect documentation', dueDate: '2026-10-13', status: 'In Progress', priority: 'High', relatedTo: 'Lead - Arun Kumar (ABC Solutions)', relatedModule: 'Leads', relatedRecordId: 'lead-11', contactId: 'con-003', contactName: 'Arun Kumar', ownerId: 'u10' },
    { id: 'wq-7', subject: 'Follow up for renewal', dueDate: '2026-10-13', status: 'Not Started', priority: 'Medium', relatedTo: 'Account - Prime Tech', relatedModule: 'Accounts', relatedRecordId: 'acc-005', contactId: 'con-015', contactName: 'Mohit Kapoor', ownerId: 'u7' },
    { id: 'wq-8', subject: 'Email product brochure', dueDate: '2026-10-14', status: 'In Progress', priority: 'Low', relatedTo: 'Lead - Divya K (D Tech Solutions)', relatedModule: 'Leads', relatedRecordId: 'lead-14', contactId: 'con-004', contactName: 'Divya Nair', ownerId: 'u8' },
    { id: 'wq-9', subject: 'Schedule on-site visit', dueDate: '2026-10-14', status: 'Pending', priority: 'High', relatedTo: 'Deal - Data Migration', relatedModule: 'Deals', relatedRecordId: 'deal-008', contactId: 'con-018', contactName: 'Lakshmi R', ownerId: 'u11' },
    { id: 'wq-10', subject: 'Update notes in CRM', dueDate: '2026-10-15', status: 'Not Started', priority: 'Low', relatedTo: 'Account - Tech Corp', relatedModule: 'Accounts', relatedRecordId: 'acc-003', contactId: 'con-013', contactName: 'Amit Kumar', ownerId: 'u6' },
    { id: 'wq-11', subject: 'Prepare brochure content', dueDate: '2026-10-10', status: 'In Progress', priority: 'High', relatedTo: 'Lead - Priya Menon (XYZ Technologies)', relatedModule: 'Leads', relatedRecordId: 'lead-12', contactId: 'con-001', contactName: 'Priya Menon', ownerId: 'u2' },
    { id: 'wq-12', subject: 'Design landing page', dueDate: '2026-10-11', status: 'Not Started', priority: 'Medium', relatedTo: 'Lead - Ramesh S (R S Enterprises)', relatedModule: 'Leads', relatedRecordId: 'lead-13', contactId: 'con-011', contactName: 'Ramesh S', ownerId: 'u3' },
  ];
}

export function seedReports() {
  return [
    { id: 'rep-lead-call-report', name: 'Lead Call Report', reportKey: 'leads_calls', module: 'Leads', sourceModule: 'Leads with Calls', type: 'Standard', folder: 'Call Reports', lastAccessed: '12/10/2026', createdBy: 'Sibi Chakaravarthi', status: 'Active', starred: true, favorite: true, description: 'Calls logged against Lead records grouped by Call Owner with duration and remarks.' },
    { id: 'rep-deal-call-live', name: 'Deal Call Report Live Data', reportKey: 'deals_live_calls', module: 'Deals', sourceModule: 'Deals with Calls', type: 'Standard', folder: 'Call Reports', lastAccessed: '12/10/2026', createdBy: 'Sibi Chakaravarthi', status: 'Active', starred: true, favorite: true, description: 'Calls associated with active/live Deal pipeline records grouped by Call Owner.' },
    { id: 'rep-overall-call-count', name: 'Overall Call Count', reportKey: 'overall_all', module: 'Activities', sourceModule: 'Calls', type: 'Standard', folder: 'Call Reports', lastAccessed: '12/10/2026', createdBy: 'Sibi Chakaravarthi', status: 'Active', starred: true, favorite: true, description: 'All inbound, outbound, attended, and unattended calls grouped by Call Owner.' },
    { id: 'rep-overall-unattend-calls', name: 'Overall Un Attend Calls', reportKey: 'overall_unattended', module: 'Activities', sourceModule: 'Calls', type: 'Standard', folder: 'Call Reports', lastAccessed: '12/10/2026', createdBy: 'Sibi Chakaravarthi', status: 'Active', starred: false, favorite: false, description: 'Missed, busy, scheduled, and zero-duration calls grouped by Call Owner.' },
    { id: 'rep-overall-attend-calls', name: 'Overall Attend Calls', reportKey: 'overall_attended', module: 'Activities', sourceModule: 'Calls', type: 'Standard', folder: 'Call Reports', lastAccessed: '12/10/2026', createdBy: 'Sibi Chakaravarthi', status: 'Active', starred: false, favorite: false, description: 'Completed and connected calls with active talk duration grouped by Call Owner.' },
    { id: 'rep-deal-call-old', name: 'Deals Old Data Call Report', reportKey: 'deals_old_calls', module: 'Deals', sourceModule: 'Old Deals with Calls', type: 'Standard', folder: 'Call Reports', lastAccessed: '12/10/2026', createdBy: 'Sibi Chakaravarthi', status: 'Active', starred: false, favorite: false, description: 'Calls associated with historical/archival Deal records grouped by Call Owner.' },
    { id: 'rep-deal-contact-call', name: 'Deals Contact Call Count', reportKey: 'deals_contact_calls', module: 'Contacts', sourceModule: 'Contacts with Calls', type: 'Standard', folder: 'Call Reports', lastAccessed: '12/10/2026', createdBy: 'Sibi Chakaravarthi', status: 'Active', starred: false, favorite: false, description: 'Calls connected to Deal Contacts grouped by Call Owner.' },
    { id: 'rep-1', name: 'Sales Pipeline Summary', module: 'Deals', type: 'Standard', folder: 'Sales Reports', lastAccessed: '10/10/2026', createdBy: 'Arun Kumar', status: 'Active', starred: true, favorite: true },
    { id: 'rep-2', name: 'Lead Source Analysis', module: 'Leads', type: 'Standard', folder: 'Lead Reports', lastAccessed: '08/10/2026', createdBy: 'Priya Sharma', status: 'Active', starred: true, favorite: true },
    { id: 'rep-3', name: 'Revenue by Month', module: 'Deals', type: 'Custom', folder: 'Finance Reports', lastAccessed: '06/10/2026', createdBy: 'Ravi Kumar', status: 'Active', starred: false, favorite: false },
    { id: 'rep-4', name: 'Activities Performance', module: 'Activities', type: 'Standard', folder: 'Activity Reports', lastAccessed: '05/10/2026', createdBy: 'Sneha R', status: 'Scheduled', starred: false, favorite: false },
    { id: 'rep-5', name: 'Contact Engagement Report', module: 'Contacts', type: 'Custom', folder: 'Contact Reports', lastAccessed: '04/10/2026', createdBy: 'Karthik S', status: 'Active', starred: false, favorite: false },
    { id: 'rep-6', name: 'Account Growth Report', module: 'Accounts', type: 'Standard', folder: 'Account Reports', lastAccessed: '02/10/2026', createdBy: 'Anitha M', status: 'Active', starred: true, favorite: true },
    { id: 'rep-7', name: 'Follow-up Status Report', module: 'Leads', type: 'Custom', folder: 'Sales Reports', lastAccessed: '28/09/2026', createdBy: 'Vikram P', status: 'Inactive', starred: false, favorite: false },
    { id: 'rep-8', name: 'Lost Deals Analysis', module: 'Deals', type: 'Standard', folder: 'Deal Reports', lastAccessed: '25/09/2026', createdBy: 'Divya R', status: 'Active', starred: false, favorite: false },
    { id: 'rep-9', name: 'Won Deals Summary', module: 'Deals', type: 'Standard', folder: 'Deal Reports', lastAccessed: '22/09/2026', createdBy: 'Mohan Raj', status: 'Active', starred: true, favorite: true },
    { id: 'rep-10', name: 'Team Performance Report', module: 'Users', type: 'Custom', folder: 'Team Reports', lastAccessed: '18/09/2026', createdBy: 'Keerthi K', status: 'Scheduled', starred: false, favorite: false },
  ];
}

export function seedMessages() {
  return [
    {
      id: 'msg-1',
      sender: 'Arun Kumar',
      badge: 'Lead',
      subject: 'Product Enquiry — Enterprise CRM & Translation Suite',
      snippet: 'Hi team, thanks for reaching out. Can you share the enterprise workflow pricing for 50 seats along with the German & Japanese translation SLA?',
      body: 'Hi team, thanks for reaching out. Can you share the enterprise workflow pricing for 50 seats along with the German & Japanese translation SLA? Our procurement committee is meeting tomorrow morning to finalize the vendor shortlist, so an itemized commercial sheet and implementation roadmap would be very helpful.',
      time: '12:45 PM',
      date: '__today__',
      dueDate: '__tomorrow__',
      dayOffset: 0,
      dueDayOffset: 1,
      status: 'Not Read',
      type: 'Lead Messages',
      channel: 'WhatsApp',
      ownerId: 'u4',
      recipient: 'Karthik S',
      repliedById: '',
      repliedBy: '',
      relatedRecordId: 'lead-11',
      city: 'Chennai',
      hasAttachment: true,
      attachmentFileName: 'ABC_Solutions_RFP_Requirements.pdf',
      attachments: [
        {
          id: 'att-m1-1',
          fileName: 'ABC_Solutions_RFP_Requirements.pdf',
          fileType: 'application/pdf',
          size: '485 KB',
          uploadedAt: 'Today, 12:44 PM',
          uploadedBy: 'Arun Kumar',
          isImage: false,
          contentSummary: 'Enterprise CRM & Localization RFP — 50 Seats, Webhook API & Multi-branch SLA Requirements.',
        },
        {
          id: 'att-m1-2',
          fileName: 'Workflow_Architecture_Diagram.png',
          fileType: 'image/png',
          size: '312 KB',
          uploadedAt: 'Today, 12:45 PM',
          uploadedBy: 'Arun Kumar',
          isImage: true,
          previewTitle: 'ABC Solutions — Enterprise CRM Workflow Diagram',
          previewSubtitle: '50-Seat Multi-Branch Lead Routing & Translation SLA Pipeline',
        },
      ],
      notificationsSelected: true,
      notificationLogs: [
        { id: 'nl-1', title: 'WhatsApp Inbound Alert', text: 'New WhatsApp message received from Arun Kumar (+91 91234 56789) with 2 attachments.', time: 'Today, 12:45 PM', status: 'Unread' },
        { id: 'nl-2', title: 'SLA Response Timer', text: 'Awaiting first reply from Record Owner (Karthik S). WhatsApp 24-hour session window active.', time: 'Today, 12:46 PM', status: 'Active' },
      ],
      whatsappInfo: {
        businessAccount: 'Honey Translation Business WhatsApp',
        senderNumber: '+91 91234 56789',
        receiverNumber: '+91 44 4856 7890',
        sessionWindowOpen: true,
        windowExpiresText: '22 hours 15 mins remaining in 24h customer care window',
      },
      replied: false,
      replies: [],
      thread: [
        {
          id: 'th-m1-1',
          direction: 'outbound',
          sender: 'Karthik S',
          text: 'Hello Arun, welcome to Honey Translation & CRM Enterprise Desk! Thank you for submitting your inquiry on our website.',
          timestamp: '11:35 AM',
          dateLabel: 'Today',
          channel: 'WhatsApp',
        },
        {
          id: 'th-m1-2',
          direction: 'inbound',
          sender: 'Arun Kumar',
          text: 'Hi team, thanks for reaching out. Can you share the enterprise workflow pricing for 50 seats along with the German & Japanese translation SLA? Our procurement committee is meeting tomorrow morning to finalize the vendor shortlist, so an itemized commercial sheet and implementation roadmap would be very helpful. I have also attached our RFP requirements document and workflow diagram for your technical team to review.',
          timestamp: '12:45 PM',
          dateLabel: 'Today',
          channel: 'WhatsApp',
          attachments: [
            {
              id: 'att-m1-1',
              fileName: 'ABC_Solutions_RFP_Requirements.pdf',
              fileType: 'application/pdf',
              size: '485 KB',
              isImage: false,
            },
            {
              id: 'att-m1-2',
              fileName: 'Workflow_Architecture_Diagram.png',
              fileType: 'image/png',
              size: '312 KB',
              isImage: true,
              previewTitle: 'ABC Solutions — Enterprise CRM Workflow Diagram',
              previewSubtitle: '50-Seat Multi-Branch Lead Routing & Translation SLA Pipeline',
            },
          ],
        },
      ],
    },
    {
      id: 'msg-2',
      sender: 'Priya Sharma',
      badge: 'Contact',
      subject: 'Proposal ABC Technologies — Annual Billing',
      snippet: 'Please share the updated proposal for Acme Technologies with annual billing and dedicated account manager support.',
      body: 'Please share the updated proposal for Acme Technologies with annual billing and dedicated account manager support. Once we receive the revised PDF, our finance team will release the purchase order.',
      time: '11:30 AM',
      date: '__today__',
      dueDate: '__today__',
      dayOffset: 0,
      dueDayOffset: 0,
      repliedDayOffset: 0,
      status: 'Read',
      type: 'Customer Messages',
      channel: 'WhatsApp',
      ownerId: 'u1',
      recipient: 'Sibi Chakaravarthi',
      repliedById: 'u1',
      repliedBy: 'Sibi Chakaravarthi',
      relatedRecordId: 'con-001',
      city: 'Chennai',
      hasAttachment: true,
      attachmentFileName: 'Acme_Technologies_Annual_Proposal_v2.pdf',
      attachments: [
        {
          id: 'att-m2-1',
          fileName: 'Acme_Technologies_Annual_Proposal_v2.pdf',
          fileType: 'application/pdf',
          size: '620 KB',
          uploadedAt: 'Today, 11:55 AM',
          uploadedBy: 'Sibi Chakaravarthi',
          isImage: false,
          contentSummary: 'Revised Annual Billing Proposal for Acme Technologies with 15% Corporate Volume Discount.',
        },
      ],
      notificationsSelected: true,
      notificationLogs: [
        { id: 'nl-m2-1', title: 'Customer Message Replied', text: 'Sibi Chakaravarthi replied to Priya Sharma with attachment Acme_Technologies_Annual_Proposal_v2.pdf.', time: 'Today, 11:55 AM', status: 'Read' },
      ],
      whatsappInfo: {
        businessAccount: 'Honey Translation Business WhatsApp',
        senderNumber: '+91 98765 43210',
        receiverNumber: '+91 44 4856 7890',
        sessionWindowOpen: true,
        windowExpiresText: '23 hours remaining in 24h customer care window',
      },
      replied: true,
      replies: [
        {
          id: 'rep-m2-1',
          sender: 'Sibi Chakaravarthi',
          by: 'Sibi Chakaravarthi',
          text: 'Hi Priya, we have attached the updated annual billing proposal with dedicated account manager SLA.',
          time: '11:55 AM',
          channel: 'WhatsApp',
        },
      ],
      thread: [
        {
          id: 'th-m2-1',
          direction: 'inbound',
          sender: 'Priya Sharma',
          text: 'Please share the updated proposal for Acme Technologies with annual billing and dedicated account manager support. Once we receive the revised PDF, our finance team will release the purchase order.',
          timestamp: '11:30 AM',
          dateLabel: 'Today',
          channel: 'WhatsApp',
        },
        {
          id: 'th-m2-2',
          direction: 'outbound',
          sender: 'Sibi Chakaravarthi',
          text: 'Hi Priya, we have attached the updated annual billing proposal with dedicated account manager SLA.',
          timestamp: '11:55 AM',
          dateLabel: 'Today',
          channel: 'WhatsApp',
          attachments: [
            {
              id: 'att-m2-1',
              fileName: 'Acme_Technologies_Annual_Proposal_v2.pdf',
              fileType: 'application/pdf',
              size: '620 KB',
              isImage: false,
            },
          ],
        },
      ],
    },
    {
      id: 'msg-3',
      sender: 'Karthik Raja',
      badge: 'Contact',
      subject: 'Revised Quotation — Cloud Migration & Localization',
      snippet: 'Attached is the revised quotation and SLA schedule as discussed on our call. Please confirm if the milestone dates work.',
      body: 'Attached is the revised quotation and SLA schedule as discussed on our call. Please confirm if the milestone dates work for your engineering and localization teams.',
      time: '10:20 AM',
      date: '__yesterday__',
      dueDate: '__in_2_days__',
      dayOffset: -1,
      dueDayOffset: 2,
      repliedDayOffset: -1,
      status: 'Starred',
      type: 'Customer Messages',
      channel: 'Email',
      ownerId: 'u2',
      recipient: 'Arun Kumar',
      repliedById: 'u2',
      repliedBy: 'Arun Kumar',
      relatedRecordId: 'con-003',
      city: 'Bangalore',
      hasAttachment: true,
      attachmentFileName: 'InnovateLabs_SLA_Schedule_2026.pdf',
      attachments: [
        {
          id: 'att-m3-1',
          fileName: 'InnovateLabs_SLA_Schedule_2026.pdf',
          fileType: 'application/pdf',
          size: '740 KB',
          uploadedAt: 'Yesterday, 10:20 AM',
          uploadedBy: 'Karthik Raja',
          isImage: false,
          contentSummary: 'Cloud Migration & Localization Milestone SLA Schedule.',
        },
      ],
      notificationsSelected: false,
      notificationLogs: [],
      whatsappInfo: {
        businessAccount: 'Honey Translation Business WhatsApp',
        senderNumber: '+91 98765 22334',
        receiverNumber: '+91 44 4856 7890',
        sessionWindowOpen: true,
        windowExpiresText: 'Active Email & WhatsApp Business Bridge',
      },
      replied: true,
      replies: [
        {
          id: 'rep-m3-1',
          sender: 'Arun Kumar',
          by: 'Arun Kumar',
          text: 'Received the revised SLA schedule, forwarding to procurement for final sign-off.',
          time: '10:50 AM',
          channel: 'Email',
        },
      ],
      thread: [
        {
          id: 'th-m3-1',
          direction: 'inbound',
          sender: 'Karthik Raja',
          text: 'Attached is the revised quotation and SLA schedule as discussed on our call. Please confirm if the milestone dates work for your engineering and localization teams.',
          timestamp: '10:20 AM',
          dateLabel: 'Yesterday',
          channel: 'Email',
          attachments: [
            {
              id: 'att-m3-1',
              fileName: 'InnovateLabs_SLA_Schedule_2026.pdf',
              fileType: 'application/pdf',
              size: '740 KB',
              isImage: false,
            },
          ],
        },
        {
          id: 'th-m3-2',
          direction: 'outbound',
          sender: 'Arun Kumar',
          text: 'Received the revised SLA schedule, forwarding to procurement for final sign-off.',
          timestamp: '10:50 AM',
          dateLabel: 'Yesterday',
          channel: 'Email',
        },
      ],
    },
    {
      id: 'msg-4',
      sender: 'Justdial User',
      badge: 'Lead',
      subject: 'Demo Call Tomorrow at 11 AM — Honey Translation Services',
      snippet: 'Can we schedule a product demo call tomorrow at 11 AM for our Madurai translation and attestation team?',
      body: 'Can we schedule a product demo call tomorrow at 11 AM for our Madurai translation and attestation team? We have 15 certificate documents ready for immediate processing and want to see how the tracking dashboard works.',
      time: '09:48 AM',
      date: '__yesterday__',
      dueDate: '__tomorrow__',
      dayOffset: -1,
      dueDayOffset: 1,
      status: 'Not Read',
      type: 'Lead Messages',
      channel: 'WhatsApp',
      ownerId: 'u4',
      recipient: 'Karthik S',
      repliedById: '',
      repliedBy: '',
      relatedRecordId: 'lead-1',
      city: 'Madurai',
      hasAttachment: true,
      attachmentFileName: 'Degree_Certificate_Sample_Scan.jpg',
      attachments: [
        {
          id: 'att-m4-1',
          fileName: 'Degree_Certificate_Sample_Scan.jpg',
          fileType: 'image/jpeg',
          size: '410 KB',
          uploadedAt: 'Yesterday, 09:48 AM',
          uploadedBy: 'Justdial User',
          isImage: true,
          previewTitle: 'Sample Certificate Scan for Attestation',
          previewSubtitle: 'Madurai Branch — Apostille & German Translation Request',
        },
      ],
      notificationsSelected: true,
      notificationLogs: [
        { id: 'nl-m4-1', title: 'Unread Lead Message', text: 'Justdial User sent a WhatsApp message requesting a demo call at 11 AM.', time: 'Yesterday, 09:48 AM', status: 'Unread' },
      ],
      whatsappInfo: {
        businessAccount: 'Honey Translation Business WhatsApp',
        senderNumber: '+91 91475 28410',
        receiverNumber: '+91 44 4856 7890',
        sessionWindowOpen: true,
        windowExpiresText: '14 hours remaining in 24h customer care window',
      },
      replied: false,
      replies: [],
      thread: [
        {
          id: 'th-m4-1',
          direction: 'inbound',
          sender: 'Justdial User',
          text: 'Can we schedule a product demo call tomorrow at 11 AM for our Madurai translation and attestation team? We have 15 certificate documents ready for immediate processing and want to see how the tracking dashboard works.',
          timestamp: '09:48 AM',
          dateLabel: 'Yesterday',
          channel: 'WhatsApp',
          attachments: [
            {
              id: 'att-m4-1',
              fileName: 'Degree_Certificate_Sample_Scan.jpg',
              fileType: 'image/jpeg',
              size: '410 KB',
              isImage: true,
              previewTitle: 'Sample Certificate Scan for Attestation',
              previewSubtitle: 'Madurai Branch — Apostille & German Translation Request',
            },
          ],
        },
      ],
    },
    {
      id: 'msg-5',
      sender: 'Suresh Babu',
      badge: 'Contact',
      subject: 'Contract Approval Follow-up — Global Systems',
      snippet: 'Following up on the legal contract approval status for Global Systems enterprise deployment.',
      body: 'Following up on the legal contract approval status for Global Systems enterprise deployment. Please let us know once the Zoho Sign document is dispatched.',
      time: '09:15 AM',
      date: '__days_ago_3__',
      dueDate: '__in_3_days__',
      dayOffset: -3,
      dueDayOffset: 3,
      repliedDayOffset: -3,
      status: 'Read',
      type: 'Customer Messages',
      channel: 'Email',
      ownerId: 'u3',
      recipient: 'Priya Sharma',
      repliedById: 'u3',
      repliedBy: 'Priya Sharma',
      relatedRecordId: 'con-005',
      city: 'Chennai',
      hasAttachment: false,
      attachmentFileName: '',
      attachments: [],
      notificationsSelected: false,
      notificationLogs: [],
      whatsappInfo: {
        businessAccount: 'Honey Translation Business WhatsApp',
        senderNumber: '+91 98450 11223',
        receiverNumber: '+91 44 4856 7890',
        sessionWindowOpen: true,
        windowExpiresText: 'Active Customer Thread',
      },
      replied: true,
      replies: [
        {
          id: 'rep-m5-1',
          sender: 'Priya Sharma',
          by: 'Priya Sharma',
          text: 'Legal review is complete. Sending Zoho Sign link shortly.',
          time: '09:45 AM',
          channel: 'Email',
        },
      ],
      thread: [
        {
          id: 'th-m5-1',
          direction: 'inbound',
          sender: 'Suresh Babu',
          text: 'Following up on the legal contract approval status for Global Systems enterprise deployment. Please let us know once the Zoho Sign document is dispatched.',
          timestamp: '09:15 AM',
          dateLabel: '3 days ago',
          channel: 'Email',
        },
        {
          id: 'th-m5-2',
          direction: 'outbound',
          sender: 'Priya Sharma',
          text: 'Legal review is complete. Sending Zoho Sign link shortly.',
          timestamp: '09:45 AM',
          dateLabel: '3 days ago',
          channel: 'Email',
        },
      ],
    },
    {
      id: 'msg-6',
      sender: 'Divya K',
      badge: 'Lead',
      subject: 'Payment Confirmation & GST Invoice Details',
      snippet: 'Sharing NEFT payment confirmation and GST details for 50 CRM licenses.',
      body: 'Sharing NEFT payment confirmation and GST details for 50 CRM licenses. Please verify with your finance desk and share the tax invoice.',
      time: '08:52 AM',
      date: '__days_ago_5__',
      dueDate: '__today__',
      dayOffset: -5,
      dueDayOffset: 0,
      repliedDayOffset: -5,
      status: 'Read',
      type: 'Lead Messages',
      channel: 'WhatsApp',
      ownerId: 'u5',
      recipient: 'Divya R',
      repliedById: 'u5',
      repliedBy: 'Divya R',
      relatedRecordId: 'lead-14',
      city: 'Erode',
      hasAttachment: true,
      attachmentFileName: 'NEFT_UTR_Receipt_DTech.png',
      attachments: [
        {
          id: 'att-m6-1',
          fileName: 'NEFT_UTR_Receipt_DTech.png',
          fileType: 'image/png',
          size: '275 KB',
          uploadedAt: '5 days ago, 08:52 AM',
          uploadedBy: 'Divya K',
          isImage: true,
          previewTitle: 'NEFT Payment Receipt — ₹ 4,50,000',
          previewSubtitle: 'UTR #HDFCN52026100788412 • D Tech Solutions, Erode',
        },
      ],
      notificationsSelected: true,
      notificationLogs: [
        { id: 'nl-m6-1', title: 'Payment Receipt Uploaded', text: 'Divya K shared NEFT_UTR_Receipt_DTech.png via WhatsApp.', time: '5 days ago', status: 'Read' },
      ],
      whatsappInfo: {
        businessAccount: 'Honey Translation Business WhatsApp',
        senderNumber: '+91 98110 45678',
        receiverNumber: '+91 44 4856 7890',
        sessionWindowOpen: true,
        windowExpiresText: 'Active WhatsApp Business Thread',
      },
      replied: true,
      replies: [
        {
          id: 'rep-m6-1',
          sender: 'Divya R',
          by: 'Divya R',
          text: 'Payment verified with finance. Provisioning your 50 licenses now.',
          time: '09:15 AM',
          channel: 'WhatsApp',
        },
      ],
      thread: [
        {
          id: 'th-m6-1',
          direction: 'inbound',
          sender: 'Divya K',
          text: 'Sharing NEFT payment confirmation and GST details for 50 CRM licenses. Please verify with your finance desk and share the tax invoice.',
          timestamp: '08:52 AM',
          dateLabel: '5 days ago',
          channel: 'WhatsApp',
          attachments: [
            {
              id: 'att-m6-1',
              fileName: 'NEFT_UTR_Receipt_DTech.png',
              fileType: 'image/png',
              size: '275 KB',
              isImage: true,
              previewTitle: 'NEFT Payment Receipt — ₹ 4,50,000',
              previewSubtitle: 'UTR #HDFCN52026100788412 • D Tech Solutions, Erode',
            },
          ],
        },
        {
          id: 'th-m6-2',
          direction: 'outbound',
          sender: 'Divya R',
          text: 'Payment verified with finance. Provisioning your 50 licenses now.',
          timestamp: '09:15 AM',
          dateLabel: '5 days ago',
          channel: 'WhatsApp',
        },
      ],
    },
    {
      id: 'msg-7',
      sender: 'Suresh B',
      badge: 'Lead',
      subject: 'Enterprise Plan Customizations & Webhook API',
      snippet: 'Interested in the enterprise plan with custom webhook integrations. Please share API documentation.',
      body: 'Interested in the enterprise plan with custom webhook integrations. Please share API documentation, rate limits, and sandbox credentials so our CloudWave Labs engineering team can test lead push events and automated WhatsApp triggers before we sign the annual contract.',
      time: '08:34 AM',
      date: '__days_ago_8__',
      dueDate: '__tomorrow__',
      dayOffset: -8,
      dueDayOffset: 1,
      status: 'Not Read',
      type: 'Lead Messages',
      channel: 'WhatsApp',
      ownerId: 'u4',
      recipient: 'Karthik S',
      repliedById: '',
      repliedBy: '',
      relatedRecordId: 'lead-17',
      city: 'Bangalore',
      hasAttachment: false,
      attachmentFileName: '',
      attachments: [],
      notificationsSelected: true,
      notificationLogs: [
        { id: 'nl-m7-1', title: 'Technical API Inquiry', text: 'Suresh B (CloudWave Labs) requested webhook API documentation.', time: '8 days ago', status: 'Unread' },
      ],
      whatsappInfo: {
        businessAccount: 'Honey Translation Business WhatsApp',
        senderNumber: '+91 98550 78901',
        receiverNumber: '+91 44 4856 7890',
        sessionWindowOpen: true,
        windowExpiresText: '18 hours remaining in 24h customer care window',
      },
      replied: false,
      replies: [],
      thread: [
        {
          id: 'th-m7-1',
          direction: 'inbound',
          sender: 'Suresh B',
          text: 'Interested in the enterprise plan with custom webhook integrations. Please share API documentation, rate limits, and sandbox credentials so our CloudWave Labs engineering team can test lead push events and automated WhatsApp triggers before we sign the annual contract.',
          timestamp: '08:34 AM',
          dateLabel: '8 days ago',
          channel: 'WhatsApp',
        },
      ],
    },
    {
      id: 'msg-8',
      sender: 'Divya Nair',
      badge: 'Contact',
      subject: 'Discovery Meeting Notes — NextGen Solutions',
      snippet: 'Sharing the discovery meeting notes and action items for Q4 rollout across Pune and Chennai.',
      body: 'Sharing the discovery meeting notes and action items for Q4 rollout across Pune and Chennai.',
      time: '07:26 AM',
      date: '__days_ago_14__',
      dueDate: '__in_5_days__',
      dayOffset: -14,
      dueDayOffset: 5,
      repliedDayOffset: -14,
      status: 'Read',
      type: 'Customer Messages',
      channel: 'Email',
      ownerId: 'u2',
      recipient: 'Arun Kumar',
      repliedById: 'u2',
      repliedBy: 'Arun Kumar',
      relatedRecordId: 'con-004',
      city: 'Pune',
      hasAttachment: true,
      attachmentFileName: 'NextGen_Q4_Discovery_Notes.docx',
      attachments: [
        {
          id: 'att-m8-1',
          fileName: 'NextGen_Q4_Discovery_Notes.docx',
          fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: '340 KB',
          uploadedAt: '14 days ago, 07:26 AM',
          uploadedBy: 'Divya Nair',
          isImage: false,
          contentSummary: 'Discovery Meeting Notes & Action Items for Q4 Rollout.',
        },
      ],
      notificationsSelected: false,
      notificationLogs: [],
      whatsappInfo: {
        businessAccount: 'Honey Translation Business WhatsApp',
        senderNumber: '+91 98765 77665',
        receiverNumber: '+91 44 4856 7890',
        sessionWindowOpen: true,
        windowExpiresText: 'Active Customer Thread',
      },
      replied: true,
      replies: [
        {
          id: 'rep-m8-1',
          sender: 'Arun Kumar',
          by: 'Arun Kumar',
          text: 'Thanks Divya, action items have been logged in Workqueue.',
          time: '08:10 AM',
          channel: 'Email',
        },
      ],
      thread: [
        {
          id: 'th-m8-1',
          direction: 'inbound',
          sender: 'Divya Nair',
          text: 'Sharing the discovery meeting notes and action items for Q4 rollout across Pune and Chennai.',
          timestamp: '07:26 AM',
          dateLabel: '14 days ago',
          channel: 'Email',
          attachments: [
            {
              id: 'att-m8-1',
              fileName: 'NextGen_Q4_Discovery_Notes.docx',
              fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              size: '340 KB',
              isImage: false,
            },
          ],
        },
        {
          id: 'th-m8-2',
          direction: 'outbound',
          sender: 'Arun Kumar',
          text: 'Thanks Divya, action items have been logged in Workqueue.',
          timestamp: '08:10 AM',
          dateLabel: '14 days ago',
          channel: 'Email',
        },
      ],
    },
    {
      id: 'msg-9',
      sender: 'Vikram P',
      badge: 'Internal',
      subject: 'Internal Team Sync: Integration Setup',
      snippet: 'Internal team note: Need DevOps support with the staging integration setup.',
      time: '06:58 AM',
      date: '2026-10-10',
      dayOffset: -2,
      dueDayOffset: 0,
      status: 'Read',
      type: 'Internal Messages',
      channel: 'Internal Chat',
      isInternal: true,
      ownerId: 'u10',
      recipient: 'Karthik S',
      hasAttachment: false,
      replied: false,
      replies: [],
    },
    {
      id: 'msg-10',
      sender: 'Priya Menon',
      badge: 'Lead',
      subject: 'Product Walkthrough Feedback — XYZ Technologies',
      snippet: 'Thanks for the product walkthrough yesterday. Our management team found the localization workflow very helpful.',
      body: 'Thanks for the product walkthrough yesterday. Our management team found the localization workflow very helpful.',
      time: '05:40 AM',
      date: '__last_month__',
      dueDate: '__in_7_days__',
      dayOffset: -32,
      dueDayOffset: 7,
      repliedDayOffset: -32,
      status: 'Read',
      type: 'Lead Messages',
      channel: 'WhatsApp',
      ownerId: 'u9',
      recipient: 'Anitha M',
      repliedById: 'u9',
      repliedBy: 'Anitha M',
      relatedRecordId: 'lead-12',
      city: 'Chennai',
      hasAttachment: false,
      attachmentFileName: '',
      attachments: [],
      notificationsSelected: true,
      notificationLogs: [
        { id: 'nl-m10-1', title: 'Positive Demo Feedback', text: 'Priya Menon rated the walkthrough positively.', time: 'Last Month', status: 'Read' },
      ],
      whatsappInfo: {
        businessAccount: 'Honey Translation Business WhatsApp',
        senderNumber: '+91 98401 23456',
        receiverNumber: '+91 44 4856 7890',
        sessionWindowOpen: true,
        windowExpiresText: 'Active WhatsApp Business Thread',
      },
      replied: true,
      replies: [
        {
          id: 'rep-m10-1',
          sender: 'Anitha M',
          by: 'Anitha M',
          text: 'Glad to hear Priya! Let us know when we can schedule the commercial review.',
          time: '06:15 AM',
          channel: 'WhatsApp',
        },
      ],
      thread: [
        {
          id: 'th-m10-1',
          direction: 'inbound',
          sender: 'Priya Menon',
          text: 'Thanks for the product walkthrough yesterday. Our management team found the localization workflow very helpful.',
          timestamp: '05:40 AM',
          dateLabel: 'Last Month',
          channel: 'WhatsApp',
        },
        {
          id: 'th-m10-2',
          direction: 'outbound',
          sender: 'Anitha M',
          text: 'Glad to hear Priya! Let us know when we can schedule the commercial review.',
          timestamp: '06:15 AM',
          dateLabel: 'Last Month',
          channel: 'WhatsApp',
        },
      ],
    },
    {
      id: 'msg-11',
      sender: 'Rajesh Khanna',
      badge: 'Lead',
      subject: 'Corporate Visa Desk Enquiry — New Delhi',
      snippet: 'We need immediate onboarding for our Delhi corporate visa and attestation desk for 40 executives.',
      body: 'We need immediate onboarding for our Delhi corporate visa and attestation desk for 40 executives traveling to Germany and UAE next month. Please confirm document pickup schedule in Connaught Place and share the attestation checklist.',
      time: '02:15 PM',
      date: '__today__',
      dueDate: '__tomorrow__',
      dayOffset: 0,
      dueDayOffset: 1,
      status: 'Not Read',
      type: 'Lead Messages',
      channel: 'WhatsApp',
      ownerId: 'u4',
      recipient: 'Karthik S',
      repliedById: '',
      repliedBy: '',
      relatedRecordId: 'lead-21',
      city: 'Delhi',
      hasAttachment: true,
      attachmentFileName: 'Executive_Visa_Batch_List.xlsx',
      attachments: [
        {
          id: 'att-m11-1',
          fileName: 'Executive_Visa_Batch_List.xlsx',
          fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          size: '198 KB',
          uploadedAt: 'Today, 02:15 PM',
          uploadedBy: 'Rajesh Khanna',
          isImage: false,
          contentSummary: '40 Executive Passport & Apostille Verification Batch Sheet — Capital Global Services.',
        },
      ],
      notificationsSelected: true,
      notificationLogs: [
        { id: 'nl-m11-1', title: 'Urgent Corporate Visa Batch', text: 'Rajesh Khanna uploaded Executive_Visa_Batch_List.xlsx via WhatsApp.', time: 'Today, 02:15 PM', status: 'Unread' },
      ],
      whatsappInfo: {
        businessAccount: 'Honey Translation Business WhatsApp',
        senderNumber: '+91 98111 22334',
        receiverNumber: '+91 44 4856 7890',
        sessionWindowOpen: true,
        windowExpiresText: '23 hours 40 mins remaining in 24h customer care window',
      },
      replied: false,
      replies: [],
      thread: [
        {
          id: 'th-m11-1',
          direction: 'inbound',
          sender: 'Rajesh Khanna',
          text: 'We need immediate onboarding for our Delhi corporate visa and attestation desk for 40 executives traveling to Germany and UAE next month. Please confirm document pickup schedule in Connaught Place and share the attestation checklist.',
          timestamp: '02:15 PM',
          dateLabel: 'Today',
          channel: 'WhatsApp',
          attachments: [
            {
              id: 'att-m11-1',
              fileName: 'Executive_Visa_Batch_List.xlsx',
              fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              size: '198 KB',
              isImage: false,
            },
          ],
        },
      ],
    },
    {
      id: 'msg-12',
      sender: 'Mohit Kapoor',
      badge: 'Contact',
      subject: 'Mumbai Board Transcription SLA & NDA',
      snippet: 'Please confirm 24-hour turnaround SLA for our upcoming Q3 board meeting recordings.',
      body: 'Please confirm 24-hour turnaround SLA for our upcoming Q3 board meeting recordings. I have attached the signed confidentiality addendum from Prime Tech.',
      time: '04:30 PM',
      date: '__last_month__',
      dueDate: '__tomorrow__',
      dayOffset: -35,
      dueDayOffset: 1,
      status: 'Starred',
      type: 'Customer Messages',
      channel: 'WhatsApp',
      ownerId: 'u1',
      recipient: 'Sibi Chakaravarthi',
      repliedById: '',
      repliedBy: '',
      relatedRecordId: 'con-015',
      city: 'Mumbai',
      hasAttachment: true,
      attachmentFileName: 'PrimeTech_Board_NDA_Signed.pdf',
      attachments: [
        {
          id: 'att-m12-1',
          fileName: 'PrimeTech_Board_NDA_Signed.pdf',
          fileType: 'application/pdf',
          size: '512 KB',
          uploadedAt: 'Last Month, 04:30 PM',
          uploadedBy: 'Mohit Kapoor',
          isImage: false,
          contentSummary: 'Signed Mutual Confidentiality & 24h Transcription SLA Addendum.',
        },
      ],
      notificationsSelected: true,
      notificationLogs: [
        { id: 'nl-m12-1', title: 'Signed NDA Uploaded', text: 'Mohit Kapoor shared PrimeTech_Board_NDA_Signed.pdf.', time: 'Last Month', status: 'Unread' },
      ],
      whatsappInfo: {
        businessAccount: 'Honey Translation Business WhatsApp',
        senderNumber: '+91 98404 56789',
        receiverNumber: '+91 44 4856 7890',
        sessionWindowOpen: false,
        windowExpiresText: '24-hour WhatsApp session expired — Use approved template or Email to re-engage',
      },
      replied: false,
      replies: [],
      thread: [
        {
          id: 'th-m12-1',
          direction: 'inbound',
          sender: 'Mohit Kapoor',
          text: 'Please confirm 24-hour turnaround SLA for our upcoming Q3 board meeting recordings. I have attached the signed confidentiality addendum from Prime Tech.',
          timestamp: '04:30 PM',
          dateLabel: 'Last Month',
          channel: 'WhatsApp',
          attachments: [
            {
              id: 'att-m12-1',
              fileName: 'PrimeTech_Board_NDA_Signed.pdf',
              fileType: 'application/pdf',
              size: '512 KB',
              isImage: false,
            },
          ],
        },
      ],
    },
    {
      id: 'msg-13',
      sender: 'Varghese Thomas',
      badge: 'Lead',
      subject: 'Ernakulam Maritime Summit Interpretation',
      snippet: 'Sharing conference schedule for 4-language simultaneous interpretation booths.',
      body: 'Sharing conference schedule for 4-language simultaneous interpretation booths in Kochi.',
      time: '11:05 AM',
      date: '__last_year__',
      dueDate: '__in_5_days__',
      dayOffset: -370,
      dueDayOffset: 5,
      repliedDayOffset: -369,
      status: 'Read',
      type: 'Lead Messages',
      channel: 'Email',
      ownerId: 'u4',
      recipient: 'Karthik S',
      repliedById: 'u4',
      repliedBy: 'Karthik S',
      relatedRecordId: 'lead-25',
      city: 'Ernakulam',
      hasAttachment: true,
      attachmentFileName: 'Maritime_Summit_Booth_Schedule.pdf',
      attachments: [
        {
          id: 'att-m13-1',
          fileName: 'Maritime_Summit_Booth_Schedule.pdf',
          fileType: 'application/pdf',
          size: '430 KB',
          uploadedAt: 'Last Year, 11:05 AM',
          uploadedBy: 'Varghese Thomas',
          isImage: false,
          contentSummary: '4-Language Simultaneous Interpretation Schedule — Kochi Maritime Summit.',
        },
      ],
      notificationsSelected: false,
      notificationLogs: [],
      whatsappInfo: {
        businessAccount: 'Honey Translation Business WhatsApp',
        senderNumber: '+91 98470 77889',
        receiverNumber: '+91 44 4856 7890',
        sessionWindowOpen: true,
        windowExpiresText: 'Active Email & WhatsApp Thread',
      },
      replied: true,
      replies: [
        {
          id: 'rep-m13-1',
          sender: 'Karthik S',
          by: 'Karthik S',
          text: 'Booth equipment and interpreters confirmed for all 4 language channels.',
          time: '11:45 AM',
          channel: 'Email',
        },
      ],
      thread: [
        {
          id: 'th-m13-1',
          direction: 'inbound',
          sender: 'Varghese Thomas',
          text: 'Sharing conference schedule for 4-language simultaneous interpretation booths in Kochi.',
          timestamp: '11:05 AM',
          dateLabel: 'Last Year',
          channel: 'Email',
          attachments: [
            {
              id: 'att-m13-1',
              fileName: 'Maritime_Summit_Booth_Schedule.pdf',
              fileType: 'application/pdf',
              size: '430 KB',
              isImage: false,
            },
          ],
        },
        {
          id: 'th-m13-2',
          direction: 'outbound',
          sender: 'Karthik S',
          text: 'Booth equipment and interpreters confirmed for all 4 language channels.',
          timestamp: '11:45 AM',
          dateLabel: 'Last Year',
          channel: 'Email',
        },
      ],
    },
    {
      id: 'msg-14',
      sender: 'Ravi Sharma',
      badge: 'Contact',
      subject: 'ABC Pvt Ltd — Q4 Localization Retainer Renewal',
      snippet: 'Hi Sibi, please share the Q4 localization retainer renewal contract and updated rate card for French & Spanish.',
      body: 'Hi Sibi, please share the Q4 localization retainer renewal contract and updated rate card for French & Spanish technical documentation. Our IT procurement board wants to finalize the renewal before Friday.',
      time: '03:20 PM',
      date: '__today__',
      dueDate: '__tomorrow__',
      dayOffset: 0,
      dueDayOffset: 1,
      status: 'Not Read',
      type: 'Customer Messages',
      channel: 'WhatsApp',
      ownerId: 'u1',
      recipient: 'Sibi Chakaravarthi',
      repliedById: '',
      repliedBy: '',
      relatedRecordId: 'con-011',
      city: 'Chennai',
      hasAttachment: true,
      attachmentFileName: 'ABC_Pvt_Ltd_RateCard_Request.pdf',
      attachments: [
        {
          id: 'att-m14-1',
          fileName: 'ABC_Pvt_Ltd_RateCard_Request.pdf',
          fileType: 'application/pdf',
          size: '290 KB',
          uploadedAt: 'Today, 03:20 PM',
          uploadedBy: 'Ravi Sharma',
          isImage: false,
          contentSummary: 'Q4 Retainer Renewal Volume Estimate & Language Pair Rate Card Request.',
        },
      ],
      notificationsSelected: true,
      notificationLogs: [
        { id: 'nl-m14-1', title: 'Renewal Inquiry', text: 'Ravi Sharma (ABC Pvt Ltd) requested Q4 retainer contract.', time: 'Today, 03:20 PM', status: 'Unread' },
      ],
      whatsappInfo: {
        businessAccount: 'Honey Translation Business WhatsApp',
        senderNumber: '+91 98400 12345',
        receiverNumber: '+91 44 4856 7890',
        sessionWindowOpen: true,
        windowExpiresText: '21 hours 30 mins remaining in 24h customer care window',
      },
      replied: false,
      replies: [],
      thread: [
        {
          id: 'th-m14-1',
          direction: 'inbound',
          sender: 'Ravi Sharma',
          text: 'Hi Sibi, please share the Q4 localization retainer renewal contract and updated rate card for French & Spanish technical documentation. Our IT procurement board wants to finalize the renewal before Friday.',
          timestamp: '03:20 PM',
          dateLabel: 'Today',
          channel: 'WhatsApp',
          attachments: [
            {
              id: 'att-m14-1',
              fileName: 'ABC_Pvt_Ltd_RateCard_Request.pdf',
              fileType: 'application/pdf',
              size: '290 KB',
              isImage: false,
            },
          ],
        },
      ],
    },
    {
      id: 'msg-15',
      sender: 'Pranitha',
      badge: 'Lead',
      subject: 'Multilingual Poster Localization Samples',
      snippet: 'Sharing the high-resolution poster artwork for Tamil, Telugu, and Hindi localization.',
      body: 'Sharing the high-resolution poster artwork for Tamil, Telugu, and Hindi localization. Please check the font layout and let us know the DTP turnaround time.',
      time: '01:10 PM',
      date: '__days_ago_2__',
      dueDate: '__tomorrow__',
      dayOffset: -2,
      dueDayOffset: 1,
      status: 'Not Read',
      type: 'Lead Messages',
      channel: 'WhatsApp',
      ownerId: 'u1',
      recipient: 'Sibi Chakaravarthi',
      repliedById: '',
      repliedBy: '',
      relatedRecordId: 'lead-3',
      city: 'Chengalpattu',
      hasAttachment: true,
      attachmentFileName: 'Poster_Artwork_Proof_v1.jpg',
      attachments: [
        {
          id: 'att-m15-1',
          fileName: 'Poster_Artwork_Proof_v1.jpg',
          fileType: 'image/jpeg',
          size: '845 KB',
          uploadedAt: '2 days ago, 01:10 PM',
          uploadedBy: 'Pranitha',
          isImage: true,
          previewTitle: 'Multilingual Poster Artwork Proof v1',
          previewSubtitle: 'Designer Poster Dealers • Tamil, Telugu & Hindi DTP Layout',
        },
      ],
      notificationsSelected: true,
      notificationLogs: [
        { id: 'nl-m15-1', title: 'Artwork Proof Received', text: 'Pranitha uploaded Poster_Artwork_Proof_v1.jpg for DTP review.', time: '2 days ago', status: 'Unread' },
      ],
      whatsappInfo: {
        businessAccount: 'Honey Translation Business WhatsApp',
        senderNumber: '+91 98765 43210',
        receiverNumber: '+91 44 4856 7890',
        sessionWindowOpen: true,
        windowExpiresText: '19 hours remaining in 24h customer care window',
      },
      replied: false,
      replies: [],
      thread: [
        {
          id: 'th-m15-1',
          direction: 'inbound',
          sender: 'Pranitha',
          text: 'Sharing the high-resolution poster artwork for Tamil, Telugu, and Hindi localization. Please check the font layout and let us know the DTP turnaround time.',
          timestamp: '01:10 PM',
          dateLabel: '2 days ago',
          channel: 'WhatsApp',
          attachments: [
            {
              id: 'att-m15-1',
              fileName: 'Poster_Artwork_Proof_v1.jpg',
              fileType: 'image/jpeg',
              size: '845 KB',
              isImage: true,
              previewTitle: 'Multilingual Poster Artwork Proof v1',
              previewSubtitle: 'Designer Poster Dealers • Tamil, Telugu & Hindi DTP Layout',
            },
          ],
        },
      ],
    },
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

export function seedCampaigns() {
  return [
    {
      id: 'camp-001',
      name: 'Q4 Justdial Inbound',
      type: 'Zoho Campaigns',
      status: 'Active',
      ownerId: 'u1',
      startDate: '2026-10-01',
      endDate: '2026-12-31',
      expectedRevenue: 3500000,
      budgetedCost: 180000,
      actualCost: 142000,
      expectedResponse: 38,
      numSent: 2400,
      createdBy: 'Sibi Chakaravarthi',
      modifiedBy: 'Sibi Chakaravarthi',
      createdOn: '2026-10-01',
      description: 'Targeted Q4 Justdial inbound lead generation campaign for Translation & Localization Services across South India.',
      notes: [
        { id: 'cn-1', title: 'Q4 Media Budget Approved', content: 'Approved Rs. 1,80,000 for high-intent translation and attestation keywords.', by: 'Sibi Chakaravarthi', date: '01 Oct 2026' },
      ],
      attachments: [
        { id: 'catt-1', fileName: 'Q4_Justdial_Inbound_Brief.pdf', size: '512 KB', uploadedBy: 'Sibi Chakaravarthi', date: '2026-10-01' },
      ],
    },
    {
      id: 'camp-002',
      name: 'Erode SMB Outreach',
      type: 'Telemarketing',
      status: 'Active',
      ownerId: 'u4',
      startDate: '2026-09-15',
      endDate: '2026-11-30',
      expectedRevenue: 1800000,
      budgetedCost: 95000,
      actualCost: 78000,
      expectedResponse: 28,
      numSent: 1250,
      createdBy: 'Karthik S',
      modifiedBy: 'Karthik S',
      createdOn: '2026-09-15',
      description: 'Direct telemarketing and WhatsApp follow-up campaign for Erode and Coimbatore SMB clients requiring attestation and apostille services.',
      notes: [
        { id: 'cn-2', title: 'Telemarketing Script v2', content: 'Updated script for faster qualification of Apostille & Embassy Attestation leads.', by: 'Karthik S', date: '18 Sep 2026' },
      ],
      attachments: [
        { id: 'catt-2', fileName: 'Erode_SMB_Call_Script.docx', size: '245 KB', uploadedBy: 'Karthik S', date: '2026-09-15' },
      ],
    },
    {
      id: 'camp-003',
      name: 'Enterprise Automation Webinar',
      type: 'Webinar',
      status: 'Active',
      ownerId: 'u3',
      startDate: '2026-10-05',
      endDate: '2026-11-15',
      expectedRevenue: 5200000,
      budgetedCost: 250000,
      actualCost: 210000,
      expectedResponse: 45,
      numSent: 3200,
      createdBy: 'Priya Sharma',
      modifiedBy: 'Priya Sharma',
      createdOn: '2026-10-05',
      description: 'Executive webinar showcasing Enterprise CRM & AI Localization workflows for mid-market and enterprise IT buyers.',
      notes: [
        { id: 'cn-3', title: 'Speaker Deck Finalized', content: 'Live product demo and Q&A session scheduled with 340+ registered enterprise attendees.', by: 'Priya Sharma', date: '05 Oct 2026' },
      ],
      attachments: [
        { id: 'catt-3', fileName: 'Enterprise_Webinar_Deck_2026.pdf', size: '1.8 MB', uploadedBy: 'Priya Sharma', date: '2026-10-05' },
      ],
    },
    {
      id: 'camp-004',
      name: 'Partner Referral Q3',
      type: 'Referral Program',
      status: 'Active',
      ownerId: 'u1',
      startDate: '2026-08-01',
      endDate: '2026-10-31',
      expectedRevenue: 4100000,
      budgetedCost: 120000,
      actualCost: 110000,
      expectedResponse: 52,
      numSent: 850,
      createdBy: 'Arun Kumar',
      modifiedBy: 'Sibi Chakaravarthi',
      createdOn: '2026-08-01',
      description: 'Channel partner and consultant referral program driving high-conversion campus & enterprise deals.',
      notes: [],
      attachments: [
        { id: 'catt-4', fileName: 'Partner_Commission_Structure_Q3.pdf', size: '390 KB', uploadedBy: 'Arun Kumar', date: '2026-08-01' },
      ],
    },
    {
      id: 'camp-005',
      name: 'EdTech Leaders Summit',
      type: 'Zoho Webinar',
      status: 'Active',
      ownerId: 'u1',
      startDate: '2026-09-20',
      endDate: '2026-11-20',
      expectedRevenue: 4800000,
      budgetedCost: 300000,
      actualCost: 265000,
      expectedResponse: 42,
      numSent: 1900,
      createdBy: 'Sibi Chakaravarthi',
      modifiedBy: 'Sibi Chakaravarthi',
      createdOn: '2026-09-20',
      description: 'Zoho Webinar campaign targeting universities, overseas education consultants, and EdTech platforms.',
      notes: [],
      attachments: [
        { id: 'catt-5', fileName: 'EdTech_Summit_Attendee_List.xlsx', size: '640 KB', uploadedBy: 'Sibi Chakaravarthi', date: '2026-09-20' },
      ],
    },
    {
      id: 'camp-006',
      name: 'MedTech Chennai 2026',
      type: 'Conference',
      status: 'Active',
      ownerId: 'u7',
      startDate: '2026-10-02',
      endDate: '2026-10-28',
      expectedRevenue: 2900000,
      budgetedCost: 220000,
      actualCost: 195000,
      expectedResponse: 35,
      numSent: 1500,
      createdBy: 'Sneha R',
      modifiedBy: 'Sneha R',
      createdOn: '2026-10-02',
      description: 'Healthcare and medical transcription conference booth & follow-up outreach in Chennai.',
      notes: [],
      attachments: [],
    },
    {
      id: 'camp-007',
      name: 'Enterprise AI CRM Launch',
      type: 'Zoho Campaigns',
      status: 'Active',
      ownerId: 'u1',
      startDate: '2026-10-01',
      endDate: '2026-12-15',
      expectedRevenue: 6500000,
      budgetedCost: 400000,
      actualCost: 315000,
      expectedResponse: 48,
      numSent: 5000,
      createdBy: 'Sibi Chakaravarthi',
      modifiedBy: 'Sibi Chakaravarthi',
      createdOn: '2026-10-01',
      description: 'Product launch email and multi-channel drip campaign for Cloud CRM Automation & AI Workflows.',
      notes: [],
      attachments: [
        { id: 'catt-7', fileName: 'Enterprise_AI_CRM_Datasheet.pdf', size: '1.1 MB', uploadedBy: 'Sibi Chakaravarthi', date: '2026-10-01' },
      ],
    },
    {
      id: 'camp-008',
      name: 'SI Partner Co-Marketing',
      type: 'Partners',
      status: 'Active',
      ownerId: 'u3',
      startDate: '2026-09-10',
      endDate: '2026-11-30',
      expectedRevenue: 3200000,
      budgetedCost: 150000,
      actualCost: 125000,
      expectedResponse: 40,
      numSent: 1100,
      createdBy: 'Anitha M',
      modifiedBy: 'Priya Sharma',
      createdOn: '2026-09-10',
      description: 'Co-branded campaign with System Integrator partners for Cloud Migration Suite deployments.',
      notes: [],
      attachments: [],
    },
    {
      id: 'camp-009',
      name: 'IT Leaders Drip Campaign',
      type: 'Email',
      status: 'Active',
      ownerId: 'u5',
      startDate: '2026-09-25',
      endDate: '2026-11-25',
      expectedRevenue: 2750000,
      budgetedCost: 85000,
      actualCost: 64000,
      expectedResponse: 33,
      numSent: 4200,
      createdBy: 'Divya R',
      modifiedBy: 'Divya R',
      createdOn: '2026-09-25',
      description: '5-stage automated email sequence for CTOs and IT Directors evaluating 50-seat enterprise licenses.',
      notes: [],
      attachments: [],
    },
    {
      id: 'camp-010',
      name: 'Retail Readiness Survey',
      type: 'Zoho Survey',
      status: 'Active',
      ownerId: 'u1',
      startDate: '2026-10-03',
      endDate: '2026-11-10',
      expectedRevenue: 2400000,
      budgetedCost: 70000,
      actualCost: 52000,
      expectedResponse: 44,
      numSent: 2800,
      createdBy: 'Mohan Raj',
      modifiedBy: 'Sibi Chakaravarthi',
      createdOn: '2026-10-03',
      description: 'Interactive Zoho Survey campaign assessing omnichannel retail POS & CRM readiness.',
      notes: [],
      attachments: [],
    },
  ];
}

