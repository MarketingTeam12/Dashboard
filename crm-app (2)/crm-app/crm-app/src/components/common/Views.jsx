import { useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Inbox,
  Plus,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import { Bar, BarChart as RBarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from '../charts/ChartTooltip';
import { useColumnLayout } from './DataTable';
import { RecordSelectionSummary } from './Pagination';

/**
 * Zoho CRM-style rounded status/stage pill badge for Grid View.
 */
export function GridStatusPill({ value, tone }) {
  if (!value) return <span className="text-[#94A3B8]">—</span>;
  const valStr = String(value);
  const norm = valStr.toLowerCase();

  let pillClass = 'bg-[#5C6470] text-white';
  if (tone === 'danger' || ['lost lead', 'hot', 'inactive', 'churned', 'overdue'].includes(norm)) {
    pillClass = 'bg-[#EF4444] text-white';
  } else if (
    tone === 'warning' ||
    ['contact in future', 'warm', 'contacted', 'pending', 'follow-up', 'vendor', 'reseller'].includes(norm)
  ) {
    if (norm === 'contacted') {
      pillClass = 'bg-[#BBF7D0] text-[#14532D]';
    } else {
      pillClass = 'bg-[#FDE68A] text-[#78350F]';
    }
  } else if (
    tone === 'info' ||
    ['attempted to contact', 'engaged', 'prospect', 'partner', 'integrator'].includes(norm)
  ) {
    pillClass = 'bg-[#BAE6FD] text-[#0C4A6E]';
  } else if (
    tone === 'success' ||
    ['qualified', 'customer', 'active', 'won', 'completed', 'delivered'].includes(norm)
  ) {
    pillClass = 'bg-[#BBF7D0] text-[#14532D]';
  } else if (tone === 'purple' || ['acquired', 'competitor'].includes(norm)) {
    pillClass = 'bg-[#E9D5FF] text-[#581C87]';
  } else if (['new', 'not contacted', 'cold'].includes(norm)) {
    pillClass = 'bg-[#5C6470] text-white';
  }

  return (
    <span
      className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11.5px] font-medium leading-[1.35] whitespace-nowrap shadow-2xs ${pillClass}`}
    >
      {valStr}
    </span>
  );
}

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

/**
 * Zoho CRM-style compact spreadsheet Grid View (with fallback card mode for legacy callers that only pass renderCard).
 */
export function GridView({
  rows = [],
  columns,
  table,
  totalCount,
  dense = true,
  quickFilterValue = '',
  quickFilterOptions = [],
  onQuickFilterChange,
  quickActionLabel,
  onQuickAction,
  emptyTitle = 'No records match these filters.',
  emptyHint = 'Try adjusting your filter criteria or clearing the search query.',
  emptyAction,
  renderCard,
  onCardClick,
  testId = 'zoho-grid-view',
}) {
  const defaultKeys = useMemo(() => (columns || []).map((c) => c.key), [columns]);
  const defaultWidths = useMemo(
    () => Object.fromEntries((columns || []).map((c) => [c.key, c.width || c.minWidth || 145])),
    [columns]
  );
  const {
    order: colOrder,
    hidden: hiddenCols,
    widths: colWidths,
    toggleColumn,
    reorderColumns,
    moveColumnByOffset,
    setColumnWidth,
    resetColumns,
  } = useColumnLayout(testId, defaultKeys, [], defaultWidths);

  const [colMenuOpen, setColMenuOpen] = useState(false);
  const [quickFilterOpen, setQuickFilterOpen] = useState(false);
  const [dragColKey, setDragColKey] = useState(null);
  const [dropColKey, setDropColKey] = useState(null);
  const [resizingColKey, setResizingColKey] = useState(null);

  // Legacy card mode fallback if no columns are provided
  if (!columns && renderCard) {
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

  const orderedAllColumns = [...(columns || [])].sort((a, b) => {
    const idxA = colOrder.indexOf(a.key);
    const idxB = colOrder.indexOf(b.key);
    return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
  });

  const visibleColumns = orderedAllColumns.filter((c) => !hiddenCols.has(c.key));
  const allChecked = rows.length > 0 && table && rows.every((r) => table.selected.has(r.id));
  const someChecked = rows.length > 0 && table && rows.some((r) => table.selected.has(r.id));
  const effectiveTotal = totalCount != null ? totalCount : table?.total ?? rows.length;
  const page = table?.page || 1;
  const pageSize = table?.pageSize || rows.length || 10;
  const maxPage = Math.max(1, Math.ceil(effectiveTotal / pageSize));
  const startIdx = effectiveTotal === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIdx = Math.min(effectiveTotal, page * pageSize);
  const rowHeightClass = dense ? 'h-[36px]' : 'h-[42px]';

  const startResize = (colKey, startClientX, currentWidth) => {
    setResizingColKey(colKey);
    const initialW = Number(currentWidth) || 145;
    const onMove = (ev) => {
      const clientX = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const delta = clientX - startClientX;
      setColumnWidth(colKey, Math.max(95, Math.min(480, initialW + delta)));
    };
    const onUp = () => {
      setResizingColKey(null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onUp);
  };

  return (
    <div className="relative flex flex-col bg-white" data-testid={testId}>
      {/* Scrollable Grid Container with Sticky Header & Horizontal Scrolling */}
      <div className="relative overflow-x-auto overflow-y-auto thin-scroll max-h-[calc(100vh-240px)] min-h-[340px]">
        <table
          className="w-full border-separate border-spacing-0 text-[12.5px] text-[#1E293B]"
          style={{ minWidth: Math.max(960, visibleColumns.length * 145) }}
        >
          <thead className="sticky top-0 z-20 bg-[#F7F9FC]">
            <tr className="h-[38px]">
              {/* Select All Checkbox Cell */}
              {table && (
                <th className="w-[42px] min-w-[42px] px-2.5 text-center bg-[#F7F9FC] border-b border-r border-[#DCE3EE] sticky left-0 z-30">
                  <input
                    type="checkbox"
                    className="cb"
                    data-testid="grid-select-all-checkbox"
                    checked={allChecked}
                    ref={(el) => {
                      if (el) el.indeterminate = !allChecked && someChecked;
                    }}
                    onChange={table.toggleAll}
                    aria-label="Select all records on page"
                  />
                </th>
              )}

              {/* Column Headers */}
              {visibleColumns.map((col, idx) => {
                const isSorted = table?.sort?.key === col.key;
                const SortIcon = isSorted
                  ? table.sort.dir === 'asc'
                    ? ArrowUp
                    : ArrowDown
                  : ArrowUpDown;
                const alignClass =
                  col.align === 'right'
                    ? 'text-right justify-end'
                    : col.align === 'center'
                    ? 'text-center justify-center'
                    : 'text-left justify-start';
                const effWidth = colWidths[col.key] || col.width || col.minWidth || 145;
                const isDragging = dragColKey === col.key;
                const isDropTarget = dropColKey === col.key && dragColKey && dragColKey !== col.key;
                const isStickyFirst = idx === 0;

                return (
                  <th
                    key={col.key}
                    data-testid={`grid-header-col-${col.key}`}
                    draggable={!resizingColKey}
                    onDragStart={(e) => {
                      if (resizingColKey) {
                        e.preventDefault();
                        return;
                      }
                      setDragColKey(col.key);
                      try {
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', col.key);
                      } catch {
                        // ignore
                      }
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (dragColKey && dragColKey !== col.key) {
                        setDropColKey(col.key);
                      }
                    }}
                    onDragLeave={() => {
                      if (dropColKey === col.key) setDropColKey(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const fromKey = dragColKey || e.dataTransfer.getData('text/plain');
                      if (fromKey && fromKey !== col.key) {
                        reorderColumns(fromKey, col.key);
                      }
                      setDragColKey(null);
                      setDropColKey(null);
                    }}
                    onDragEnd={() => {
                      setDragColKey(null);
                      setDropColKey(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.altKey || e.shiftKey) {
                        if (e.key === 'ArrowLeft') {
                          e.preventDefault();
                          moveColumnByOffset(col.key, -1);
                        } else if (e.key === 'ArrowRight') {
                          e.preventDefault();
                          moveColumnByOffset(col.key, 1);
                        }
                      }
                    }}
                    tabIndex={0}
                    style={{ width: effWidth, minWidth: effWidth, ...(isStickyFirst ? { left: table ? 42 : 0 } : {}) }}
                    className={`group/th relative px-2.5 py-1.5 font-semibold text-[12.5px] text-[#1E293B] bg-[#F7F9FC] border-b border-r border-[#DCE3EE] whitespace-nowrap select-none transition-colors ${
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    } ${isStickyFirst ? 'sticky z-30 shadow-[2px_0_4px_-2px_rgba(15,23,42,0.08)]' : ''} ${
                      isDragging ? 'opacity-55 bg-[#EFF6FF] ring-2 ring-[#2563EB]' : ''
                    } ${isDropTarget ? 'bg-[#EFF6FF] border-l-2 border-l-[#2563EB]' : ''}`}
                  >
                    <div className={`flex items-center gap-1 pr-2 ${alignClass}`}>
                      <span
                        className="inline-flex items-center justify-center w-4 h-5 rounded text-[#94A3B8] hover:text-[#2563EB] cursor-grab active:cursor-grabbing shrink-0"
                        title="Drag column header to reorder (or Alt+Left/Right)"
                      >
                        <GripVertical size={12} />
                      </span>
                      {col.sortable !== false && table ? (
                        <button
                          type="button"
                          onClick={() => table.onSort(col.key)}
                          data-testid={`grid-sort-${col.key}`}
                          className="group inline-flex items-center gap-1 font-semibold text-[#1E293B] hover:text-[#1262E0] focus:outline-none truncate"
                        >
                          <span className="truncate">{col.header}</span>
                          <SortIcon
                            size={12}
                            className={
                              isSorted
                                ? 'text-[#1262E0] shrink-0'
                                : 'text-[#94A3B8] opacity-0 group-hover:opacity-100 shrink-0 transition-opacity'
                            }
                          />
                        </button>
                      ) : (
                        <span className="truncate">{col.header}</span>
                      )}

                      {/* First column inline "All ▾" quick filter matching Zoho CRM screenshot */}
                      {idx === 0 && quickFilterOptions.length > 0 && onQuickFilterChange && (
                        <div className="relative ml-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setQuickFilterOpen((o) => !o);
                            }}
                            data-testid="grid-primary-quick-filter-btn"
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-medium text-[#475569] hover:text-[#0F172A] hover:bg-[#E2E8F0]/60 transition-colors"
                            title="Quick status filter"
                          >
                            <span>{quickFilterValue || 'All'}</span>
                            <ChevronDown size={11} />
                          </button>
                          {quickFilterOpen && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute left-0 top-full mt-1 w-40 bg-white border border-[#DCE3EE] rounded-lg shadow-lg py-1 z-40 font-normal"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  onQuickFilterChange('');
                                  setQuickFilterOpen(false);
                                }}
                                className={`w-full text-left px-3 py-1.5 text-[12px] hover:bg-[#F1F5F9] ${
                                  !quickFilterValue ? 'font-semibold text-[#1262E0] bg-[#EFF6FF]/60' : 'text-[#1E293B]'
                                }`}
                              >
                                All
                              </button>
                              {quickFilterOptions.map((opt) => (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => {
                                    onQuickFilterChange(opt);
                                    setQuickFilterOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-1.5 text-[12px] hover:bg-[#F1F5F9] ${
                                    quickFilterValue === opt
                                      ? 'font-semibold text-[#1262E0] bg-[#EFF6FF]/60'
                                      : 'text-[#1E293B]'
                                  }`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Column Width Resize Handle */}
                    <div
                      role="separator"
                      aria-orientation="vertical"
                      aria-label={`Resize ${col.header} column`}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        startResize(col.key, e.clientX, effWidth);
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        if (e.touches[0]) {
                          startResize(col.key, e.touches[0].clientX, effWidth);
                        }
                      }}
                      className={`absolute top-0 right-0 bottom-0 w-2 cursor-col-resize z-20 flex items-center justify-center group/resize ${
                        resizingColKey === col.key ? 'bg-[#2563EB]/25' : 'hover:bg-[#2563EB]/15'
                      }`}
                      title="Drag edge to resize column width"
                    >
                      <span
                        className={`w-[2px] h-4 rounded-full transition-colors ${
                          resizingColKey === col.key ? 'bg-[#2563EB]' : 'bg-transparent group-hover/resize:bg-[#2563EB]'
                        }`}
                      />
                    </div>
                  </th>
                );
              })}

              {/* Top-Right Column Settings Icon Cell matching Zoho CRM screenshot */}
              <th className="w-[38px] min-w-[38px] px-1 text-center bg-[#F7F9FC] border-b border-[#DCE3EE] sticky right-0 z-30">
                <div className="relative inline-flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => setColMenuOpen((o) => !o)}
                    data-testid="grid-columns-toggle-btn"
                    title="Customize grid columns"
                    aria-label="Customize grid columns"
                    className="w-7 h-7 rounded hover:bg-[#E2E8F0]/70 flex items-center justify-center text-[#475569] hover:text-[#0F172A] transition-colors"
                  >
                    <SlidersHorizontal size={13.5} />
                  </button>
                  {colMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-60 bg-white border border-[#DCE3EE] rounded-lg shadow-xl py-1.5 z-50 text-left font-normal">
                      <div className="px-3 py-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#64748B] border-b border-[#EEF2F7]">
                        <span>Grid Columns</span>
                        <span className="text-[10px] font-normal text-[#94A3B8] normal-case">Drag or ↑↓</span>
                      </div>
                      <div className="max-h-60 overflow-y-auto thin-scroll py-1">
                        {orderedAllColumns.map((c, i) => {
                          const checked = !hiddenCols.has(c.key);
                          return (
                            <div
                              key={c.key}
                              draggable
                              onDragStart={(e) => {
                                setDragColKey(c.key);
                                try {
                                  e.dataTransfer.effectAllowed = 'move';
                                  e.dataTransfer.setData('text/plain', c.key);
                                } catch {
                                  // ignore
                                }
                              }}
                              onDragOver={(e) => {
                                e.preventDefault();
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                const fromKey = dragColKey || e.dataTransfer.getData('text/plain');
                                if (fromKey && fromKey !== c.key) {
                                  reorderColumns(fromKey, c.key);
                                }
                                setDragColKey(null);
                              }}
                              className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 text-[12px] text-[#1E293B] hover:bg-[#F8FAFC] cursor-grab active:cursor-grabbing"
                            >
                              <label className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer">
                                <GripVertical size={12} className="text-[#94A3B8] shrink-0" />
                                <input
                                  type="checkbox"
                                  className="cb"
                                  checked={checked}
                                  disabled={checked && visibleColumns.length <= 2}
                                  onChange={() => {
                                    if (checked && visibleColumns.length <= 2) return;
                                    toggleColumn(c.key);
                                  }}
                                />
                                <span className="truncate">{c.header}</span>
                              </label>
                              <div className="flex items-center gap-0.5 shrink-0">
                                <button
                                  type="button"
                                  disabled={i === 0}
                                  onClick={() => moveColumnByOffset(c.key, -1)}
                                  className="w-5 h-5 rounded text-[10px] text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0] disabled:opacity-30"
                                  title="Move up"
                                >
                                  ↑
                                </button>
                                <button
                                  type="button"
                                  disabled={i === orderedAllColumns.length - 1}
                                  onClick={() => moveColumnByOffset(c.key, 1)}
                                  className="w-5 h-5 rounded text-[10px] text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0] disabled:opacity-30"
                                  title="Move down"
                                >
                                  ↓
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="px-2.5 pt-1.5 mt-1 border-t border-[#EEF2F7]">
                        <button
                          type="button"
                          onClick={resetColumns}
                          className="w-full flex items-center justify-center gap-1.5 py-1 rounded text-[11.5px] font-medium text-[#475569] hover:text-[#1262E0] hover:bg-[#F1F5F9] transition-colors"
                        >
                          <RotateCcw size={11.5} />
                          <span>Reset column order &amp; widths</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, rowIdx) => {
              const isSelected = table ? table.selected.has(row.id) : false;
              return (
                <tr
                  key={row.id}
                  data-testid={`grid-row-${row.id}`}
                  className={`${rowHeightClass} transition-colors ${
                    isSelected ? 'bg-[#EFF6FF]' : 'bg-white hover:bg-[#F5F8FF]'
                  }`}
                >
                  {/* Row Checkbox Cell */}
                  {table && (
                    <td
                      className={`w-[42px] px-2.5 text-center border-b border-r border-[#E6ECF5] sticky left-0 z-10 ${
                        isSelected ? 'bg-[#EFF6FF]' : 'bg-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="cb"
                        data-testid={`grid-row-checkbox-${row.id}`}
                        checked={isSelected}
                        onChange={() => table.toggle(row.id)}
                        aria-label={`Select ${row.name || 'record'}`}
                      />
                    </td>
                  )}

                  {/* Data Cells */}
                  {visibleColumns.map((col, colIdx) => {
                    const alignCls =
                      col.align === 'right'
                        ? 'text-right font-mono tabular-nums'
                        : col.align === 'center'
                        ? 'text-center'
                        : 'text-left';
                    const effWidth = colWidths[col.key] || col.width || col.minWidth || 145;
                    const isStickyFirst = colIdx === 0;
                    return (
                      <td
                        key={col.key}
                        style={{ width: effWidth, minWidth: effWidth, maxWidth: effWidth, ...(isStickyFirst ? { left: table ? 42 : 0 } : {}) }}
                        className={`px-3 py-1 border-b border-r border-[#E6ECF5] whitespace-nowrap truncate ${alignCls} ${
                          isStickyFirst
                            ? `sticky z-10 shadow-[2px_0_4px_-2px_rgba(15,23,42,0.06)] ${
                                isSelected ? 'bg-[#EFF6FF]' : 'bg-white'
                              }`
                            : ''
                        } ${col.className || ''}`}
                      >
                        {col.render ? col.render(row, rowIdx) : row[col.key] ?? '—'}
                      </td>
                    );
                  })}

                  {/* Right trailing spacer cell under column settings icon */}
                  <td className="w-[38px] px-1 text-center border-b border-[#E6ECF5] text-[#94A3B8]" />
                </tr>
              );
            })}

            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={visibleColumns.length + (table ? 2 : 1)}
                  className="py-14 text-center border-b border-[#E6ECF5]"
                >
                  <div className="inline-flex flex-col items-center gap-2 text-[#64748B]">
                    <span className="h-11 w-11 rounded-full bg-[#F1F5F9] flex items-center justify-center">
                      <Inbox size={20} className="text-[#94A3B8]" />
                    </span>
                    <span className="text-[13.5px] font-semibold text-[#0F172A]">{emptyTitle}</span>
                    <span className="text-[12.5px]">{emptyHint}</span>
                    {emptyAction}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Floating bottom-right "+ Contact" / "+ Account" pill button matching the Zoho CRM reference screenshot */}
        {quickActionLabel && onQuickAction && (
          <button
            type="button"
            onClick={onQuickAction}
            data-testid="grid-floating-create-btn"
            className="sticky bottom-3 float-right mr-4 mb-2 z-20 inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[12.5px] font-semibold shadow-[0_4px_12px_rgba(37,99,235,0.35)] transition-all cursor-pointer"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>{quickActionLabel}</span>
          </button>
        )}
      </div>

      {/* Bottom Status & Pagination Bar matching Zoho CRM screenshot ("Total Records 120" on left, "< 1 to 50 >" on right) */}
      <div
        data-testid="grid-footer-bar"
        className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-t border-[#DCE3EE] bg-white text-[12.5px] text-[#475569]"
      >
        <RecordSelectionSummary
          total={effectiveTotal}
          selectedCount={table?.selected ? table.selected.size : 0}
          onClearSelection={table?.clearSelection}
          totalTestId="grid-total-records"
          selectionTestId="grid-selected-count"
          deselectTestId="grid-deselect-all-btn"
        />

        {table && (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-[12px]">
              <span className="text-[#64748B]">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                aria-label="Grid rows per page"
                className="h-7 px-2 rounded border border-[#CBD5E1] bg-[#F8FAFC] text-[12px] text-[#0F172A] font-medium focus:outline-none focus:border-[#2563EB] cursor-pointer"
              >
                {[10, 15, 25, 30, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5" data-testid="grid-pagination">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => table.setPage(page - 1)}
                aria-label="Previous page"
                data-testid="grid-prev-page"
                className="w-7 h-7 rounded flex items-center justify-center text-[#334155] hover:bg-[#F1F5F9] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="text-[12.5px] text-[#0F172A] tabular-nums px-1">
                <strong className="font-semibold">{startIdx}</strong> to{' '}
                <strong className="font-semibold">{endIdx}</strong>
              </span>
              <button
                type="button"
                disabled={page >= maxPage}
                onClick={() => table.setPage(page + 1)}
                aria-label="Next page"
                data-testid="grid-next-page"
                className="w-7 h-7 rounded flex items-center justify-center text-[#334155] hover:bg-[#F1F5F9] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
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

