import { Area, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from './ChartTooltip';
import WrapTick from './WrapTick';

/**
 * lines: [{ key, name, color, area, labels }]
 */
export default function LineChart({ data, xKey = 'name', lines, height = 220, yFormatter, valueFormatter, legend, yDomain, yLabel, yWidth = 40, margin }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={margin || { top: 20, right: 16, left: yLabel ? 8 : -6, bottom: 0 }}>
          <defs>
            {lines.filter((l) => l.area).map((l) => (
              <linearGradient key={l.key} id={`grad-${l.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={l.color} stopOpacity={0.28} />
                <stop offset="100%" stopColor={l.color} stopOpacity={0.04} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} stroke="#EDF2F9" />
          <XAxis dataKey={xKey} tick={<WrapTick />} height={34} axisLine={{ stroke: '#DFE8F5' }} tickLine={false} interval={0} padding={{ left: 10, right: 10 }} />
          <YAxis width={yWidth} tick={{ fontSize: 11, fill: '#7A839F' }} axisLine={false} tickLine={false} tickFormatter={yFormatter} domain={yDomain}
            label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft', fontSize: 11, fill: '#4B5578', dy: 30 } : undefined} />
          <Tooltip content={<ChartTooltip formatter={valueFormatter} />} />
          {legend && <Legend verticalAlign="top" align="right" iconType="plainline" iconSize={16} wrapperStyle={{ fontSize: 11.5, top: -6 }} />}
          {lines.map((l) => (l.area ? (
            <Area key={l.key} type="linear" dataKey={l.key} name={l.name} stroke={l.color} strokeWidth={2.2} fill={`url(#grad-${l.key})`}
              dot={{ r: 4, fill: l.color, stroke: '#fff', strokeWidth: 1.5 }} activeDot={{ r: 6 }} isAnimationActive={false}
              label={l.labels ? { position: 'top', fontSize: 11.5, fill: '#071344', fontWeight: 600, formatter: l.labels, offset: 10 } : undefined} />
          ) : (
            <Line key={l.key} type="linear" dataKey={l.key} name={l.name} stroke={l.color} strokeWidth={2} dot={{ r: 3.5, fill: l.color, stroke: '#fff', strokeWidth: 1 }} activeDot={{ r: 5.5 }} isAnimationActive={false} />
          )))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
