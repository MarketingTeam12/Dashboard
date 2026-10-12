import { ArrowDown, ArrowUp } from 'lucide-react';

const TONES = {
  violet: { bg: '#F0E8FF', fg: '#8B3DF0', bar: '#A970F5', tint: 'linear-gradient(135deg,#F7F2FF 0%,#FFFFFF 70%)' },
  green: { bg: '#DDF6EA', fg: '#12B76A', bar: '#22C483', tint: 'linear-gradient(135deg,#EEFBF4 0%,#FFFFFF 70%)' },
  amber: { bg: '#FFF1D6', fg: '#F5A524', bar: '#FFBE3D', tint: 'linear-gradient(135deg,#FFF8EA 0%,#FFFFFF 70%)' },
  red: { bg: '#FFE4E6', fg: '#F04438', bar: '#FF6B76', tint: 'linear-gradient(135deg,#FFF1F2 0%,#FFFFFF 70%)' },
  blue: { bg: '#E3EEFF', fg: '#1262E0', bar: '#5B9BFF', tint: 'linear-gradient(135deg,#EFF5FF 0%,#FFFFFF 70%)' },
};

function Spark({ values, color }) {
  const vals = values?.length ? values.slice(-5) : [3, 4, 5, 6, 8];
  const max = Math.max(...vals, 1);
  return (
    <div className="flex items-end gap-[4px] h-[40px]" aria-hidden="true">
      {vals.map((v, i) => (
        <span key={i} className="w-[7px] rounded-[3px]" style={{ height: `${Math.max(14, (v / max) * 100)}%`, background: color, opacity: 0.35 + (i / vals.length) * 0.65 }} />
      ))}
    </div>
  );
}

function Trend({ trend, small, invert }) {
  if (!trend) return null;
  const good = invert ? !trend.up : trend.up;
  const Icon = trend.up ? ArrowUp : ArrowDown;
  return (
    <span className={`inline-flex items-center gap-0.5 font-semibold ${small ? 'text-[12.5px]' : 'text-[14px]'} ${good ? 'text-success' : 'text-danger'}`}>
      <Icon size={small ? 13 : 15} strokeWidth={2.4} />
      {trend.value}%
    </span>
  );
}

/**
 * variant "spark": icon tile, label, value, trend, mini bars (Accounts/Deals/Calls/Finance)
 * variant "inline": icon tile, label/value left, trend right (Stage Summary pages)
 */
export default function StatCard({ icon: Icon, tone = 'blue', label, value, trend, trendLabel = 'vs previous period', spark, tinted, variant = 'spark', invertTrend, onClick }) {
  const t = TONES[tone];
  const Tag = onClick ? 'button' : 'div';
  if (variant === 'inline') {
    return (
      <Tag onClick={onClick} className="card text-left flex items-center gap-3 px-3.5 py-2.5 min-h-[80px]" style={{ background: t.tint }}>
        <span className="h-[48px] w-[48px] rounded-xl flex items-center justify-center shrink-0" style={{ background: t.bg, color: t.fg }}>
          <Icon size={25} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[12.5px] text-ink-600 truncate">{label}</div>
          <div className="text-[21px] xl:text-[22px] font-bold text-ink leading-tight whitespace-nowrap">{value}</div>
          {trend && (
            <div className="flex items-center gap-1.5 mt-0.5 whitespace-nowrap">
              <Trend trend={trend} small invert={invertTrend} />
              <span className="text-[11px] text-ink-400 truncate">{trendLabel}</span>
            </div>
          )}
        </div>
      </Tag>
    );
  }
  return (
    <Tag onClick={onClick} className="card relative text-left flex gap-3 px-3.5 py-3 min-h-[100px]" style={tinted ? { background: t.tint } : undefined}>
      <span className="h-[46px] w-[46px] rounded-xl flex items-center justify-center shrink-0" style={{ background: t.bg, color: t.fg }}>
        <Icon size={24} strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[12.5px] text-ink-600 whitespace-nowrap">{label}</div>
        <div className="text-[21px] xl:text-[22px] font-bold text-ink leading-tight mt-0.5 whitespace-nowrap">{value}</div>
        <div className="mt-1 leading-tight">
          <Trend trend={trend} invert={invertTrend} />
          <div className="text-[11.5px] text-ink-500 whitespace-nowrap">{trendLabel}</div>
        </div>
      </div>
      <div className="absolute right-3 bottom-3 hidden sm:block pointer-events-none"><Spark values={spark} color={t.bar} /></div>
    </Tag>
  );
}
