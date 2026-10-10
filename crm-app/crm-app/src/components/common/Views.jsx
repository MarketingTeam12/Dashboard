import { useRef, useState } from 'react';
import { Bar, BarChart as RBarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from '../charts/ChartTooltip';

/**
 * Drag-and-drop board. groups: [{ key, label, color }]
 */
export function KanbanView({ groups, rows, groupOf, renderCard, onMove, summary, onCardClick }) {
  const [over, setOver] = useState(null);
  const [limit, setLimit] = useState(30);
  const dragId = useRef(null);
  return (
    <div className="overflow-x-auto thin-scroll pb-2">
      <div className="flex gap-3 min-w-max">
        {groups.map((g) => {
          const items = rows.filter((r) => groupOf(r) === g.key);
          return (
            <section key={g.key}
              onDragOver={(e) => { if (onMove) { e.preventDefault(); setOver(g.key); } }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOver(null); }}
              onDrop={(e) => {
                e.preventDefault(); setOver(null);
                const id = e.dataTransfer.getData('text/plain') || dragId.current;
                dragId.current = null;
                const row = rows.find((r) => r.id === id);
                if (row && groupOf(row) !== g.key) onMove(row, g.key);
              }}
              className={`w-[272px] shrink-0 rounded-xl border bg-[#F7F9FD] flex flex-col max-h-[calc(100vh-260px)] min-h-[300px] transition-colors ${over === g.key ? 'border-primary bg-primary-50/70' : 'border-line'}`}>
              <header className="px-3 pt-3 pb-2 border-b border-line-soft">
                <div className="h-1 rounded-full mb-2.5" style={{ background: g.color }} />
                <div className="flex items-center justify-between">
                  <h3 className="text-[13.5px] font-semibold text-ink">{g.label}</h3>
                  <span className="text-[12px] text-ink-500 bg-white border border-line rounded-full px-2 py-0.5">{items.length}</span>
                </div>
                {summary && <p className="text-[12px] text-ink-500 mt-0.5">{summary(items)}</p>}
              </header>
              <div className="p-2 space-y-2 overflow-y-auto thin-scroll flex-1">
                {items.slice(0, limit).map((r) => (
                  <article key={r.id} draggable={!!onMove} onDragStart={(e) => { dragId.current = r.id; e.dataTransfer.setData('text/plain', r.id); e.dataTransfer.effectAllowed = 'move'; }}
                    onClick={() => onCardClick?.(r)}
                    className={`bg-white border border-line rounded-lg p-3 shadow-card hover:border-primary/40 ${onMove ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}>
                    {renderCard(r)}
                  </article>
                ))}
                {items.length > limit && (
                  <button type="button" onClick={() => setLimit((l) => l + 30)} className="w-full text-[12.5px] text-primary py-2 hover:underline">Show {Math.min(30, items.length - limit)} more</button>
                )}
                {items.length === 0 && <p className="text-[12.5px] text-ink-400 text-center py-6">{onMove ? 'Drop cards here' : 'No records'}</p>}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

export function GridView({ rows, renderCard, onCardClick }) {
  if (!rows.length) return <p className="text-center text-ink-500 py-14 text-[14px]">No records match these filters.</p>;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3 p-1">
      {rows.map((r) => (
        <article key={r.id} onClick={() => onCardClick?.(r)} className="bg-white border border-line rounded-xl p-4 hover:border-primary/40 hover:shadow-card cursor-pointer">
          {renderCard(r)}
        </article>
      ))}
    </div>
  );
}

/** count-by-group bar chart for the "chart" layout */
export function ChartView({ title, data, valueLabel = 'Records' }) {
  return (
    <div className="p-4">
      <h3 className="text-[15px] font-semibold text-ink mb-3">{title}</h3>
      <div className="h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <RBarChart data={data} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#EDF2F9" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#4B5578' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#7A839F' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: '#F3F6FB' }} />
            <Bar dataKey="value" name={valueLabel} radius={[6, 6, 0, 0]} maxBarSize={64} label={{ position: 'top', fontSize: 12, fill: '#071344' }}>
              {data.map((d) => <Cell key={d.name} fill={d.color} />)}
            </Bar>
          </RBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
