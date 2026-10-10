import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartTooltip } from './ChartTooltip';

const RAD = Math.PI / 180;

function sliceLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.05) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RAD);
  const y = cy + r * Math.sin(-midAngle * RAD);
  return <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>{`${Math.round(percent * 100)}%`}</text>;
}

/** data: [{ name, value, color }] */
export default function DonutChart({ data, centerValue, centerLabel, height = 200, inner = '50%', outer = '92%', valueFormatter, onSliceClick }) {
  const hasData = data.some((d) => d.value > 0);
  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={hasData ? data : [{ name: 'No data', value: 1, color: '#EDF2F9' }]}
            dataKey="value" nameKey="name" innerRadius={inner} outerRadius={outer} paddingAngle={0} startAngle={90} endAngle={-270}
            stroke="#fff" strokeWidth={2} labelLine={false} label={hasData ? sliceLabel : false} isAnimationActive={false}
            onClick={(d) => onSliceClick?.(d.name)}
          >
            {(hasData ? data : [{ color: '#EDF2F9' }]).map((d, i) => <Cell key={i} fill={d.color} className={onSliceClick ? 'cursor-pointer' : ''} />)}
          </Pie>
          {hasData && <Tooltip content={<ChartTooltip formatter={valueFormatter} />} />}
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="bg-white rounded-full flex flex-col items-center justify-center" style={{ width: '42%', aspectRatio: '1' }}>
          <span className="text-[19px] font-bold text-ink leading-none">{centerValue}</span>
          {centerLabel && <span className="text-[11.5px] text-ink-600 mt-1">{centerLabel}</span>}
        </div>
      </div>
    </div>
  );
}

export function DonutLegend({ items, className = '' }) {
  return (
    <ul className={`space-y-2.5 ${className}`}>
      {items.map((it) => (
        <li key={it.name} className="flex items-center gap-2.5 text-[13px]">
          <span className="h-3 w-3 rounded-full shrink-0" style={{ background: it.color }} />
          <span className="text-ink-600 flex-1 truncate">{it.name}</span>
          <span className="font-semibold text-ink whitespace-nowrap">{it.right}</span>
        </li>
      ))}
    </ul>
  );
}
