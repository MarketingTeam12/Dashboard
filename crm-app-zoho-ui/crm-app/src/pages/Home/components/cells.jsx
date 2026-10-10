import { Building2, UserRound, Wallet, Contact } from 'lucide-react';
import { fmtDMY, parseAnyDate } from '../homeConfig';

// Stage pill colours follow the reference (yellow / blue / green / red pills).
const STAGE_STYLE = {
  Qualification: { bg: '#F8DD74', fg: '#2B2B2B', border: '#E9C84C' },
  'Needs Analysis': { bg: '#69B4F7', fg: '#FFFFFF', border: '#4C9FEA' },
  Proposal: { bg: '#E9A8F0', fg: '#3B1A40', border: '#D98BE2' },
  Negotiation: { bg: '#3D8BEB', fg: '#FFFFFF', border: '#2C78D6' },
  'Closed Won': { bg: '#2DBE5A', fg: '#FFFFFF', border: '#22A84D' },
  'Closed Lost': { bg: '#E5484D', fg: '#FFFFFF', border: '#D63B40' },
};

export function StagePill({ value }) {
  if (!value) return null;
  const s = STAGE_STYLE[value] || { bg: '#E7EAF3', fg: '#2B2B2B', border: '#D5DAE6' };
  return (
    <span className="inline-block max-w-full rounded-full border px-2 py-[1px] text-[11.5px] font-semibold leading-[16px] break-words"
      style={{ background: s.bg, color: s.fg, borderColor: s.border }}>
      {value}
    </span>
  );
}

// Lead source pills (JD = blue, Website = lavender in the reference).
const SOURCE_COLORS = ['#5FA8EF', '#A3A8F0', '#58C3B5', '#F2A65A', '#E58BB5', '#8FB85E', '#9C8CE0', '#5CB8D6'];
export function SourcePill({ value }) {
  if (!value) return null;
  const fixed = { Justdial: '#5FA8EF', JD: '#5FA8EF', Website: '#A3A8F0' };
  let color = fixed[value];
  if (!color) {
    let h = 0;
    for (const ch of value) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    color = SOURCE_COLORS[h % SOURCE_COLORS.length];
  }
  return (
    <span className="inline-block rounded-full px-2 py-[1px] text-[11.5px] font-semibold leading-[16px] text-white" style={{ background: color }}>
      {value === 'Justdial' ? 'JD' : value}
    </span>
  );
}

// Arrow-shaped tag (maroon "Not contactable" in the reference).
const TAG_COLORS = { 'Not contactable': '#8F4256', 'Invalid Number': '#7A4FB5', Junk: '#A0662B', 'Hot Lead': '#C2410C', 'Product Demo': '#0F766E', 'IT Industry': '#1D4ED8', Lead: '#5B6B8C' };
export function TagChip({ value }) {
  if (!value) return null;
  const color = TAG_COLORS[value] || '#5B6B8C';
  return (
    <span className="relative inline-flex items-center h-[19px] pl-2 pr-3 text-[11.5px] font-semibold text-white rounded-l-[3px] whitespace-nowrap"
      style={{ background: color, clipPath: 'polygon(0 0, calc(100% - 7px) 0, 100% 50%, calc(100% - 7px) 100%, 0 100%)' }}>
      {value}
    </span>
  );
}

const REL_ICON = { Deal: Wallet, Account: Building2, Lead: UserRound, Contact };
export function RelatedIcon({ module }) {
  const Icon = REL_ICON[module] || Wallet;
  return <Icon size={14} strokeWidth={1.8} className="shrink-0 text-[#3B3F4A]" />;
}

export const fmtMoney = (n) => `₹${(Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function fmtDateTime(v) {
  const d = parseAnyDate(v);
  if (!d) return '';
  let h = d.getHours();
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${fmtDMY(v)} ${String(h).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} ${ap}`;
}

/** Small animated bar-chart shown while a component loads (as in the reference). */
export function WidgetLoader() {
  return (
    <div className="h-full w-full flex items-center justify-center" role="status" aria-label="Loading">
      <svg width="22" height="20" viewBox="0 0 22 20" className="home-loader">
        <rect x="1" y="8" width="3" height="12" rx="1" fill="#5FA8EF" />
        <rect x="7" y="3" width="3" height="17" rx="1" fill="#8E7CF0" />
        <rect x="13" y="6" width="3" height="14" rx="1" fill="#E58BB5" />
        <rect x="19" y="10" width="3" height="10" rx="1" fill="#5FA8EF" />
      </svg>
    </div>
  );
}
