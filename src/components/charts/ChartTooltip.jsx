export function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-line rounded-lg shadow-pop px-3 py-2 text-[12.5px] min-w-[140px]">
      {label != null && <div className="font-semibold text-ink mb-1">{label}</div>}
      {payload.map((p) => (
        <div key={p.dataKey + p.name} className="flex items-center gap-2 py-0.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color || p.payload?.color || p.fill }} />
          <span className="text-ink-500 flex-1">{p.name}</span>
          <span className="font-semibold text-ink">{formatter ? formatter(p.value, p) : p.value}</span>
        </div>
      ))}
    </div>
  );
}
