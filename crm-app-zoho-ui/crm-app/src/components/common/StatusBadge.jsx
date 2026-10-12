import { badgeTone } from './statusTone';

export default function StatusBadge({ kind, value, className = '', size = 'md' }) {
  if (!value) return <span className="text-ink-400">—</span>;
  const pad = size === 'sm' ? 'h-[22px] px-2 text-[12px]' : 'h-[28px] px-3 text-[13px]';
  return <span className={`inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium ${pad} ${badgeTone(kind, value)} ${className}`}>{value}</span>;
}
