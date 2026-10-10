const TONE = {
  blue: 'bg-[#E8F1FF] text-[#1262E0]',
  violet: 'bg-[#F1E9FF] text-[#7C3AED]',
  orange: 'bg-[#FFEDE0] text-[#EE6A1F]',
  amber: 'bg-[#FFF3D3] text-[#C98500]',
  green: 'bg-[#DFF6EA] text-[#0E9F5E]',
  red: 'bg-[#FFE4E6] text-[#E5293A]',
  pink: 'bg-[#FFE5EC] text-[#E0245E]',
  teal: 'bg-[#DCF5F1] text-[#0F8F80]',
  gray: 'bg-[#EEF2F7] text-[#4B5578]',
  indigo: 'bg-[#EAE8FF] text-[#4F46E5]',
};

const AUTO_TONE = {
  Active: 'green',
  Completed: 'green',
  Approved: 'green',
  Qualified: 'green',
  Converted: 'green',
  'Closed Won': 'green',
  Paid: 'green',
  Low: 'green',
  'In Progress': 'blue',
  Scheduled: 'blue',
  Proposal: 'blue',
  New: 'indigo',
  Assigned: 'teal',
  Customer: 'teal',
  Pending: 'amber',
  Medium: 'amber',
  Negotiation: 'amber',
  Contacted: 'orange',
  'Needs Analysis': 'orange',
  High: 'red',
  Overdue: 'red',
  Rejected: 'red',
  Lost: 'red',
  'Closed Lost': 'red',
  Missed: 'red',
  Inactive: 'gray',
  'Not Started': 'gray',
  'Not Contacted': 'gray',
};

const MAP = {
  accountStatus: { Active: 'green', Inactive: 'red', New: 'blue' },
  accountType: { Customer: 'blue', Prospect: 'violet', Partner: 'amber', Vendor: 'teal' },
  lifecycle: { New: 'indigo', Contacted: 'orange', Engaged: 'violet', Qualified: 'green', Customer: 'teal' },
  leadSource: { Website: 'blue', LinkedIn: 'pink', 'Cold Call': 'indigo', Conference: 'green', Referral: 'orange', 'Trade Show': 'violet', Internal: 'teal' },
  stage: { Qualification: 'violet', 'Needs Analysis': 'orange', Proposal: 'blue', Negotiation: 'amber', 'Closed Won': 'green', 'Closed Lost': 'red' },
  callStatus: { Completed: 'green', Missed: 'red', Busy: 'amber', Scheduled: 'blue' },
  invoiceStatus: { Paid: 'green', Pending: 'amber', Overdue: 'red', 'Partially Paid': 'blue' },
  invoiceType: { 'Sales Invoice': 'blue', 'Recurring Invoice': 'violet', 'Credit Note': 'amber', 'Debit Note': 'green' },
  workflow: { Active: 'green', Inactive: 'gray', Executed: 'green', 'Conditions not met': 'gray', Open: 'amber', Done: 'green' },
  winRate: {},
};

export const badgeTone = (kind, value) => TONE[MAP[kind]?.[value] || AUTO_TONE[value] || 'gray'];

export default function StatusBadge({ kind, value, status, className = '', size = 'md' }) {
  const val = value ?? status;
  if (!val) return <span className="text-ink-400">—</span>;
  const pad = size === 'sm' ? 'h-[22px] px-2 text-[12px]' : 'h-[28px] px-3 text-[13px]';
  return <span className={`inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium ${pad} ${badgeTone(kind, val)} ${className}`}>{val}</span>;
}

export { TONE };
