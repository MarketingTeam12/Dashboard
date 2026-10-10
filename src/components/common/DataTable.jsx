import { ArrowDown, ArrowUp, ArrowUpDown, Inbox } from 'lucide-react';

/**
 * columns: [{ key, header, render(row, i), sortable, align, className, headerClassName, width }]
 */
export default function DataTable({
  columns = [],
  rows = [],
  table,
  sort,
  onSort,
  selected,
  onSelectAll,
  onSelectRow,
  selectable = true,
  showIndex = true,
  loading,
  dense,
  onRowClick,
  emptyTitle = 'No records match these filters',
  emptyHint = 'Clear the filters or create a new record.',
  emptyAction,
  minWidth = 1050,
  headerExtra,
}) {
  const selectedSet = table?.selected || selected || new Set();
  const handleToggleAll = table?.toggleAll || onSelectAll || (() => {});
  const handleToggleRow = table?.toggle || onSelectRow || (() => {});
  const currentSort = table?.sort !== undefined ? table.sort : sort;
  const handleSort = table?.onSort || onSort || (() => {});
  const startIdx = table?.startIndex || 0;

  const allChecked = rows.length > 0 && rows.every((r) => selectedSet.has(r.id));
  const someChecked = rows.some((r) => selectedSet.has(r.id));
  const rowH = dense ? 'h-[40px]' : 'h-[47px]';
  const alignCls = (a) => (a === 'center' ? 'text-center' : a === 'right' ? 'text-right' : 'text-left');

  return (
    <div className="overflow-x-auto thin-scroll">
      <table className="w-full border-separate border-spacing-0 text-[13.5px]" style={{ minWidth }}>
        <thead>
          <tr className="bg-[#F5F8FD]">
            {selectable && (
              <th className="th w-[44px] pl-4">
                <input
                  type="checkbox"
                  className="cb"
                  checked={allChecked}
                  ref={(el) => el && (el.indeterminate = !allChecked && someChecked)}
                  onChange={handleToggleAll}
                  aria-label="Select all on page"
                />
              </th>
            )}
            {showIndex && <th className="th w-[40px] text-center">#</th>}
            {columns.map((c) => {
              const colLabel = c.header ?? c.label ?? c.key;
              const isSortable = c.sortable !== false;
              const active = currentSort?.key === c.key;
              const Icon = active ? (currentSort.dir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
              return (
                <th
                  key={c.key}
                  className={`th ${alignCls(c.align)} ${c.headerClassName || ''}`}
                  style={c.width ? { width: c.width } : undefined}
                >
                  {isSortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(c.key)}
                      className={`group inline-flex items-center gap-1 ${c.align === 'center' ? 'justify-center' : ''} hover:text-primary`}
                    >
                      {colLabel}
                      <Icon size={12} className={active ? 'text-primary' : 'opacity-0 group-hover:opacity-60'} />
                    </button>
                  ) : (
                    colLabel
                  )}
                </th>
              );
            })}
            {headerExtra}
          </tr>
        </thead>
        <tbody>
          {loading &&
            Array.from({ length: 8 }).map((_, i) => (
              <tr key={`sk-${i}`} className={rowH}>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (showIndex ? 1 : 0)} className="td">
                  <div className="h-3.5 rounded bg-[#EDF2F9] animate-pulse" style={{ width: `${60 + ((i * 13) % 35)}%` }} />
                </td>
              </tr>
            ))}
          {!loading &&
            rows.map((row, i) => (
              <tr
                key={row.id || i}
                className={`${rowH} group ${selectedSet.has(row.id) ? 'bg-primary-50/60' : 'hover:bg-[#F8FAFE]'} ${
                  onRowClick ? 'cursor-pointer' : ''
                }`}
                onClick={(e) => onRowClick && !e.target.closest('button,a,input,select,label') && onRowClick(row)}
              >
                {selectable && (
                  <td className="td pl-4">
                    <input
                      type="checkbox"
                      className="cb"
                      checked={selectedSet.has(row.id)}
                      onChange={() => handleToggleRow(row.id)}
                      aria-label="Select row"
                    />
                  </td>
                )}
                {showIndex && <td className="td text-center text-ink-600">{startIdx + i + 1}</td>}
                {columns.map((c) => (
                  <td key={c.key} className={`td ${alignCls(c.align)} ${c.className || ''}`}>
                    {c.render ? c.render(row, i) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0) + (showIndex ? 1 : 0)} className="py-14 text-center">
                <div className="inline-flex flex-col items-center gap-2 text-ink-500">
                  <span className="h-12 w-12 rounded-full bg-page flex items-center justify-center">
                    <Inbox size={22} className="text-ink-400" />
                  </span>
                  <span className="text-[14px] font-medium text-ink">{emptyTitle}</span>
                  <span className="text-[13px]">{emptyHint}</span>
                  {emptyAction}
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
