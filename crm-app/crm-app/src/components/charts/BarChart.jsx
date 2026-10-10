import { Bar, BarChart as RBarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from './ChartTooltip';
import WrapTick from './WrapTick';

/**
 * bars: [{ key, name, color, stackId, labelKey, cellColors }]
 */
export default function BarChart({
  data, xKey = 'name', bars, height = 220, yFormatter, valueFormatter, legend, barSize = 34, yLabel, horizontal, yWidth = 40, renderLabel, margin,
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RBarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'} margin={margin || { top: 22, right: 8, left: yLabel ? 8 : -6, bottom: 0 }} barGap={4}>
          <CartesianGrid vertical={!!horizontal} horizontal={!horizontal} stroke="#EDF2F9" />
          {horizontal ? (
            <>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey={xKey} hide />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} tick={<WrapTick />} height={34} axisLine={{ stroke: '#DFE8F5' }} tickLine={false} interval={0} />
              <YAxis width={yWidth} tick={{ fontSize: 11, fill: '#7A839F' }} axisLine={false} tickLine={false} tickFormatter={yFormatter} allowDecimals={false}
                label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft', fontSize: 11, fill: '#4B5578', dy: 30 } : undefined} />
            </>
          )}
          <Tooltip content={<ChartTooltip formatter={valueFormatter} />} cursor={{ fill: '#F3F6FB' }} />
          {legend && <Legend verticalAlign="top" align="center" iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12, top: -4 }} />}
          {bars.map((b) => (
            <Bar key={b.key} dataKey={b.key} name={b.name} fill={b.color} stackId={b.stackId} barSize={barSize}
              radius={b.stackId ? (b.top ? [3, 3, 0, 0] : 0) : horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
              label={renderLabel ? renderLabel(b) : undefined} isAnimationActive={false}>
              {b.cellColors && data.map((d, i) => <Cell key={i} fill={b.cellColors(d)} />)}
            </Bar>
          ))}
        </RBarChart>
      </ResponsiveContainer>
    </div>
  );
}
