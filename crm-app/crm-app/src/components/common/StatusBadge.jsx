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
  // Exact Stage Colors with Dark Readable Text
  stageYellow: 'bg-[#FDE68A] text-[#78350F]',
  stageGreen: 'bg-[#BBF7D0] text-[#14532D]',
  stageLightBlue: 'bg-[#BAE6FD] text-[#0C4A6E]',
  stageLightPink: 'bg-[#FBCFE8] text-[#831843]',
  stageRed: 'bg-[#FECACA] text-[#7F1D1D]',
};

const MAP = {
  accountStatus: { Active: 'green', Inactive: 'red', New: 'blue' },
  accountType: { Customer: 'blue', Prospect: 'violet', Partner: 'amber', Vendor: 'teal' },
  lifecycle: { New: 'indigo', Contacted: 'orange', Engaged: 'violet', Qualified: 'green', Customer: 'teal' },
  leadSource: { Website: 'blue', LinkedIn: 'pink', 'Cold Call': 'indigo', Conference: 'green', Referral: 'orange', 'Trade Show': 'violet', Internal: 'teal' },
  stage: {
    'Need Deal Estimation': 'stageYellow',
    'Deal Estimation Ready': 'stageGreen',
    'Deal Estimation sent to Client': 'stageLightBlue',
    'Deal Estimation accepted- Invoice Need': 'stageLightPink',
    'Deal Invoice Ready': 'stageLightBlue',
    'Deal Closed (Won)': 'stageGreen',
    'Closed Won': 'stageGreen',
    'Deal Job Seeking& Agency': 'stageYellow',
    'Deal Job Seeking & Agency': 'stageYellow',
    'Pre- Deal Lost': 'stageRed',
    'Pre-Deal Lost': 'stageRed',
    'Deal Closed (Lost)': 'stageRed',
    'Closed Lost': 'stageRed',
  },
  callStatus: { Completed: 'green', Missed: 'red', Busy: 'amber', Scheduled: 'blue' },
  invoiceStatus: { Paid: 'green', Pending: 'amber', Overdue: 'red', 'Partially Paid': 'blue' },
  invoiceType: { 'Sales Invoice': 'blue', 'Recurring Invoice': 'violet', 'Credit Note': 'amber', 'Debit Note': 'green' },
  workflow: { Active: 'green', Inactive: 'gray', Executed: 'green', 'Conditions not met': 'gray', Open: 'amber', Done: 'green' },
  winRate: {},
};

export const badgeTone = (kind, value) => {
  if (value === undefined) {
    if (MAP.stage[kind]) return TONE[MAP.stage[kind]];
    if (MAP.invoiceStatus[kind]) return TONE[MAP.invoiceStatus[kind]];
    if (TONE[kind]) return TONE[kind];
  }
  return TONE[MAP[kind]?.[value] || (MAP.stage[value] ? MAP.stage[value] : 'gray')];
};

export default function StatusBadge({ kind = 'stage', value, status, tone, className = '', size = 'md' }) {
  const displayVal = value !== undefined ? value : status;
  if (!displayVal) return <span className="text-ink-400">—</span>;
  const pad = size === 'sm' ? 'h-[22px] px-2 text-[12px]' : 'h-[28px] px-3 text-[13px]';
  const resolvedTone = tone || badgeTone(kind, displayVal);
  return <span className={`inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium ${pad} ${resolvedTone} ${className}`}>{displayVal}</span>;
}

export { TONE };
