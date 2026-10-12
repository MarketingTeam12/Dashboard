import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  GripVertical,
  Inbox,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import Dropdown, { MenuDivider, MenuLabel } from './Dropdown';

/**
 * Persistent hook for managing column order, hidden columns, and column widths
 * per module in localStorage.
 */
export function useColumnLayout(storageKey, defaultColumnKeys = [], defaultHiddenKeys = [], defaultWidths = {}) {
  const fullStorageKey = `zcrm.v1.colLayout.${storageKey}`;

  const loadInitial = () => {
    try {
      const raw = localStorage.getItem(fullStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        const savedOrder = Array.isArray(parsed.order) ? parsed.order : defaultColumnKeys;
        // Merge any new columns not yet in savedOrder
        const mergedOrder = [
          ...savedOrder.filter((k) => defaultColumnKeys.includes(k)),
          ...defaultColumnKeys.filter((k) => !savedOrder.includes(k)),
        ];
        return {
          order: mergedOrder,
          hidden: new Set(Array.isArray(parsed.hidden) ? parsed.hidden : defaultHiddenKeys),
          widths: parsed.widths && typeof parsed.widths === 'object' ? { ...defaultWidths, ...parsed.widths } : { ...defaultWidths },
        };
      }
    } catch {
      /* ignore */
    }
    return {
      order: [...defaultColumnKeys],
      hidden: new Set(defaultHiddenKeys),
      widths: { ...defaultWidths },
    };
  };

  const [state, setState] = useState(loadInitial);

  useEffect(() => {
    try {
      localStorage.setItem(
        fullStorageKey,
        JSON.stringify({
          order: state.order,
          hidden: [...state.hidden],
          widths: state.widths,
        })
      );
    } catch {
      /* ignore */
    }
  }, [fullStorageKey, state]);

  const reorderColumns = useCallback((fromKey, toKey) => {
    if (!fromKey || !toKey || fromKey === toKey) return;
    setState((prev) => {
      const nextOrder = [...prev.order];
      defaultColumnKeys.forEach((k) => {
        if (!nextOrder.includes(k)) nextOrder.push(k);
      });
      const fromIdx = nextOrder.indexOf(fromKey);
      const toIdx = nextOrder.indexOf(toKey);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const [moved] = nextOrder.splice(fromIdx, 1);
      nextOrder.splice(toIdx, 0, moved);
      return { ...prev, order: nextOrder };
    });
  }, [defaultColumnKeys]);

  const moveColumnByOffset = useCallback((colKey, delta) => {
    setState((prev) => {
      const nextOrder = [...prev.order];
      const idx = nextOrder.indexOf(colKey);
      if (idx === -1) return prev;
      const targetIdx = Math.max(0, Math.min(nextOrder.length - 1, idx + delta));
      if (targetIdx === idx) return prev;
      const [moved] = nextOrder.splice(idx, 1);
      nextOrder.splice(targetIdx, 0, moved);
      return { ...prev, order: nextOrder };
    });
  }, []);

  const toggleColumnVisibility = useCallback((colKey) => {
    setState((prev) => {
      const nextHidden = new Set(prev.hidden);
      if (nextHidden.has(colKey)) nextHidden.delete(colKey);
      else nextHidden.add(colKey);
      return { ...prev, hidden: nextHidden };
    });
  }, []);

  const setColumnWidth = useCallback((colKey, widthPx) => {
    const clamped = Math.max(85, Math.min(560, Math.round(Number(widthPx) || 140)));
    setState((prev) => ({
      ...prev,
      widths: {
        ...prev.widths,
        [colKey]: clamped,
      },
    }));
  }, []);

  const resetColumns = useCallback(() => {
    setState({
      order: [...defaultColumnKeys],
      hidden: new Set(defaultHiddenKeys),
      widths: { ...defaultWidths },
    });
  }, [defaultColumnKeys, defaultHiddenKeys, defaultWidths]);

  return {
    order: state.order,
    columnOrder: state.order,
    hidden: state.hidden,
    hiddenColumns: state.hidden,
    widths: state.widths,
    columnWidths: state.widths,
    reorderColumns,
    moveColumnByOffset,
    toggleColumn: toggleColumnVisibility,
    toggleColumnVisibility,
    setColumnWidth,
    resetColumns,
  };
}

/**
 * Interactive "Visible columns" dropdown chooser with checkboxes, drag-and-drop reordering,
 * and keyboard/touch ↑/↓ reorder buttons.
 */
export function ColumnChooserMenu({
  columnsCatalog,
  allColumns,
  columnOrder = [],
  hiddenColumns,
  hiddenSet,
  onToggleColumn,
  onReorderColumns,
  onMoveColumn,
  onResetColumns,
}) {
  const catalog = useMemo(() => columnsCatalog || allColumns || [], [columnsCatalog, allColumns]);
  const effectiveHidden = hiddenColumns || hiddenSet || new Set();
  const [dragKey, setDragKey] = useState(null);
  const [overKey, setOverKey] = useState(null);

  const orderedCatalog = useMemo(() => {
    const map = new Map(catalog.map((c) => [c.key, c]));
    const ordered = [];
    columnOrder.forEach((k) => {
      if (map.has(k)) {
        ordered.push(map.get(k));
        map.delete(k);
      }
    });
    map.forEach((c) => ordered.push(c));
    return ordered;
  }, [catalog, columnOrder]);

  return (
    <Dropdown
      width={275}
      align="right"
      trigger={
        <button
          type="button"
          data-testid="visible-columns-chooser-btn"
          aria-label="Choose and reorder columns"
          title="Visible columns (Drag to reorder)"
          className="p-1.5 rounded-md text-ink-600 hover:bg-white hover:text-primary"
        >
          <SlidersHorizontal size={16} />
        </button>
      }
    >
      <div className="px-3 py-1.5 flex items-center justify-between border-b border-line-soft">
        <span className="text-[11.5px] font-semibold uppercase tracking-wider text-ink-400">
          Visible columns (Drag to reorder)
        </span>
      </div>
      <div className="max-h-[340px] overflow-y-auto thin-scroll py-1" data-testid="visible-columns-menu-list">
        {orderedCatalog.map((col, idx) => {
          const isChecked = col.required || !effectiveHidden.has(col.key);
          const isDragging = dragKey === col.key;
          const isOver = overKey === col.key && dragKey !== col.key;

          return (
            <div
              key={col.key}
              draggable
              data-testid={`column-chooser-item-${col.key}`}
              onDragStart={(e) => {
                setDragKey(col.key);
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', col.key);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (overKey !== col.key) setOverKey(col.key);
              }}
              onDrop={(e) => {
                e.preventDefault();
                const from = e.dataTransfer.getData('text/plain') || dragKey;
                if (from && from !== col.key && onReorderColumns) {
                  onReorderColumns(from, col.key);
                }
                setDragKey(null);
                setOverKey(null);
              }}
              onDragEnd={() => {
                setDragKey(null);
                setOverKey(null);
              }}
              className={`group flex items-center justify-between gap-2 px-2.5 py-1.5 text-[12.5px] text-ink select-none transition-colors ${
                isDragging
                  ? 'opacity-50 bg-primary-50'
                  : isOver
                  ? 'bg-[#EFF6FF] border-t-2 border-[#2563EB]'
                  : 'hover:bg-page'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span
                  className="cursor-grab active:cursor-grabbing text-ink-400 hover:text-ink p-0.5 rounded"
                  title="Drag to reorder column"
                >
                  <GripVertical size={13.5} />
                </span>
                <label className="flex items-center gap-2 cursor-pointer truncate flex-1">
                  <input
                    type="checkbox"
                    className="cb"
                    checked={isChecked}
                    disabled={col.required}
                    onChange={() => !col.required && onToggleColumn && onToggleColumn(col.key)}
                  />
                  <span className="truncate">{col.label}</span>
                </label>
              </div>

              {/* Keyboard & Touch Move Up / Down Buttons */}
              <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 focus-within:opacity-100 shrink-0">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveColumn && onMoveColumn(col.key, -1);
                  }}
                  aria-label={`Move ${col.label} earlier`}
                  title="Move column left/up"
                  className="w-5 h-5 rounded hover:bg-[#E2E8F0] flex items-center justify-center text-ink-500 disabled:opacity-25 cursor-pointer"
                >
                  <ArrowUp size={11} />
                </button>
                <button
                  type="button"
                  disabled={idx === orderedCatalog.length - 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveColumn && onMoveColumn(col.key, 1);
                  }}
                  aria-label={`Move ${col.label} later`}
                  title="Move column right/down"
                  className="w-5 h-5 rounded hover:bg-[#E2E8F0] flex items-center justify-center text-ink-500 disabled:opacity-25 cursor-pointer"
                >
                  <ArrowDown size={11} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {onResetColumns && (
        <>
          <MenuDivider />
          <div className="px-2.5 py-1.5">
            <button
              type="button"
              onClick={onResetColumns}
              data-testid="reset-columns-layout-btn"
              className="w-full py-1.5 px-2.5 rounded-md text-[12px] font-medium text-ink-600 hover:text-primary hover:bg-page flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw size={12.5} />
              <span>Reset column order &amp; widths</span>
            </button>
          </div>
        </>
      )}
    </Dropdown>
  );
}

/**
 * Zoho CRM DataTable with:
 * - Sticky top header & sticky primary record-name column
 * - Drag-and-drop column header reordering (mouse, touch, and keyboard)
 * - Interactive column width resizing
 */
export default function DataTable({
  columns,
  rows,
  table,
  selectable = true,
  showIndex = true,
  loading,
  dense,
  onRowClick,
  emptyTitle = 'No records match these filters',
  emptyHint = 'Clear the filters or create a new record.',
  emptyAction,
  minWidth = 1100,
  headerExtra,
  columnWidths = {},
  onReorderColumns,
  onMoveColumn,
  onResizeColumn,
  stickyColumnKey,
}) {
  const [dragColKey, setDragColKey] = useState(null);
  const [overColKey, setOverColKey] = useState(null);
  const [resizingKey, setResizingKey] = useState(null);
  const resizeStateRef = useRef(null);
  const touchDragRef = useRef(null);

  const allChecked = rows.length > 0 && rows.every((r) => table.selected.has(r.id));
  const someChecked = rows.some((r) => table.selected.has(r.id));
  const rowH = dense ? 'h-[40px]' : 'h-[47px]';
  const alignCls = (a) => (a === 'center' ? 'text-center' : a === 'right' ? 'text-right' : 'text-left');

  // Column Resize Mouse & Touch Handlers
  const startColumnResize = (e, colKey, currentWidth) => {
    e.stopPropagation();
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    resizeStateRef.current = {
      colKey,
      startX: clientX,
      startWidth: currentWidth || 150,
    };
    setResizingKey(colKey);

    const onMove = (moveEvent) => {
      if (!resizeStateRef.current) return;
      const moveX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const delta = moveX - resizeStateRef.current.startX;
      const nextW = Math.max(85, Math.min(540, resizeStateRef.current.startWidth + delta));
      if (onResizeColumn) {
        onResizeColumn(resizeStateRef.current.colKey, nextW);
      }
    };

    const onEnd = () => {
      resizeStateRef.current = null;
      setResizingKey(null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
  };

  // Touch drag-to-reorder on mobile headers
  const handleTouchStartDrag = (e, colKey) => {
    if (!onReorderColumns || colKey === 'actions') return;
    const touch = e.touches[0];
    if (!touch) return;
    touchDragRef.current = { colKey, startX: touch.clientX };
    setDragColKey(colKey);
  };

  const handleTouchMoveDrag = (e) => {
    if (!touchDragRef.current) return;
    const touch = e.touches[0];
    if (!touch) return;
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const th = el?.closest?.('th[data-col-key]');
    const targetKey = th?.getAttribute('data-col-key');
    if (targetKey && targetKey !== 'actions') {
      setOverColKey(targetKey);
    }
  };

  const handleTouchEndDrag = () => {
    if (touchDragRef.current && overColKey && touchDragRef.current.colKey !== overColKey && onReorderColumns) {
      onReorderColumns(touchDragRef.current.colKey, overColKey);
    }
    touchDragRef.current = null;
    setDragColKey(null);
    setOverColKey(null);
  };

  return (
    <div className="overflow-x-auto thin-scroll relative">
      <table className="w-full border-separate border-spacing-0 text-[13px]" style={{ minWidth }}>
        <thead className="sticky top-0 z-20">
          <tr className="bg-[#F5F8FD]">
            {selectable && (
              <th className="th w-[44px] min-w-[44px] pl-4 sticky left-0 z-30 bg-[#F5F8FD]">
                <input
                  type="checkbox"
                  data-testid="select-all-page-checkbox"
                  className="cb"
                  checked={allChecked}
                  ref={(el) => el && (el.indeterminate = !allChecked && someChecked)}
                  onChange={() => table.toggleAll()}
                  aria-label="Select all on page"
                />
              </th>
            )}
            {showIndex && <th className="th w-[40px] text-center bg-[#F5F8FD]">#</th>}
            {columns.map((c, colIdx) => {
              const isActions = c.key === 'actions';
              const active = table.sort?.key === c.key;
              const Icon = active ? (table.sort.dir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
              const effectiveWidth = columnWidths[c.key] || c.width;
              const canDrag = Boolean(onReorderColumns) && !isActions;
              const canResize = Boolean(onResizeColumn) && !isActions;
              const isDragging = dragColKey === c.key;
              const isDropTarget = overColKey === c.key && dragColKey && dragColKey !== c.key;
              const isStickyName = stickyColumnKey ? c.key === stickyColumnKey : false;

              return (
                <th
                  key={c.key}
                  data-col-key={c.key}
                  data-testid={`table-header-${c.key}`}
                  draggable={canDrag && !resizingKey}
                  onDragStart={(e) => {
                    if (!canDrag || resizingKey) {
                      e.preventDefault();
                      return;
                    }
                    setDragColKey(c.key);
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', c.key);
                  }}
                  onDragOver={(e) => {
                    if (!canDrag || !dragColKey) return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (overColKey !== c.key) setOverColKey(c.key);
                  }}
                  onDrop={(e) => {
                    if (!canDrag) return;
                    e.preventDefault();
                    const fromKey = e.dataTransfer.getData('text/plain') || dragColKey;
                    if (fromKey && fromKey !== c.key && onReorderColumns) {
                      onReorderColumns(fromKey, c.key);
                    }
                    setDragColKey(null);
                    setOverColKey(null);
                  }}
                  onDragEnd={() => {
                    setDragColKey(null);
                    setOverColKey(null);
                  }}
                  onKeyDown={(e) => {
                    if (!canDrag) return;
                    if (e.altKey || e.shiftKey) {
                      if (e.key === 'ArrowLeft') {
                        e.preventDefault();
                        onMoveColumn && onMoveColumn(c.key, -1);
                      } else if (e.key === 'ArrowRight') {
                        e.preventDefault();
                        onMoveColumn && onMoveColumn(c.key, 1);
                      }
                    }
                  }}
                  tabIndex={canDrag ? 0 : undefined}
                  style={
                    effectiveWidth
                      ? { width: effectiveWidth, minWidth: effectiveWidth, maxWidth: effectiveWidth }
                      : undefined
                  }
                  className={`th relative group/th select-none transition-colors ${alignCls(c.align)} ${
                    c.headerClassName || ''
                  } ${
                    isStickyName
                      ? 'sticky left-[44px] z-30 bg-[#F5F8FD] shadow-[1px_0_0_#E2E8F0]'
                      : 'bg-[#F5F8FD]'
                  } ${
                    isDragging
                      ? 'opacity-55 !bg-[#EFF6FF] ring-2 ring-inset ring-[#2563EB]'
                      : isDropTarget
                      ? '!bg-[#DBEAFE]/70 border-l-2 border-l-[#2563EB]'
                      : ''
                  }`}
                >
                  <div
                    className={`flex items-center gap-1 ${
                      c.align === 'center' ? 'justify-center' : c.align === 'right' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {/* Grab Handle for Dragging Column Header (Mouse & Touch) */}
                    {canDrag && (
                      <span
                        data-testid={`drag-handle-${c.key}`}
                        onTouchStart={(e) => handleTouchStartDrag(e, c.key)}
                        onTouchMove={handleTouchMoveDrag}
                        onTouchEnd={handleTouchEndDrag}
                        title="Drag header to reorder column (or press Alt+Left/Right)"
                        className="cursor-grab active:cursor-grabbing text-[#94A3B8] hover:text-[#1E293B] opacity-70 group-hover/th:opacity-100 shrink-0 -ml-1 p-0.5 rounded"
                      >
                        <GripVertical size={13} />
                      </span>
                    )}

                    {c.sortable ? (
                      <button
                        type="button"
                        onClick={() => table.onSort(c.key)}
                        className={`group inline-flex items-center gap-1 truncate ${
                          c.align === 'center' ? 'justify-center' : ''
                        } hover:text-primary`}
                      >
                        <span className="truncate">{c.header}</span>
                        <Icon
                          size={12}
                          className={`shrink-0 ${active ? 'text-primary' : 'opacity-0 group-hover:opacity-60'}`}
                        />
                      </button>
                    ) : (
                      <span className="truncate">{c.header}</span>
                    )}

                    {/* Keyboard / Touch Quick Move Left/Right buttons on hover/focus */}
                    {canDrag && onMoveColumn && (
                      <span className="hidden group-hover/th:inline-flex group-focus-within/th:inline-flex items-center gap-0.5 ml-auto mr-1 shrink-0">
                        <button
                          type="button"
                          disabled={colIdx === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveColumn(c.key, -1);
                          }}
                          title="Move column left"
                          aria-label={`Move ${typeof c.header === 'string' ? c.header : c.key} left`}
                          className="w-4 h-4 rounded hover:bg-[#DBEAFE] text-[#64748B] hover:text-[#1D4ED8] disabled:opacity-20 flex items-center justify-center"
                        >
                          <ArrowLeft size={10} />
                        </button>
                        <button
                          type="button"
                          disabled={colIdx >= columns.length - 2}
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveColumn(c.key, 1);
                          }}
                          title="Move column right"
                          aria-label={`Move ${typeof c.header === 'string' ? c.header : c.key} right`}
                          className="w-4 h-4 rounded hover:bg-[#DBEAFE] text-[#64748B] hover:text-[#1D4ED8] disabled:opacity-20 flex items-center justify-center"
                        >
                          <ArrowRight size={10} />
                        </button>
                      </span>
                    )}
                  </div>

                  {/* Interactive Column Width Resize Handle */}
                  {canResize && (
                    <div
                      role="separator"
                      aria-orientation="vertical"
                      aria-label={`Resize ${typeof c.header === 'string' ? c.header : c.key} column`}
                      data-testid={`resize-handle-${c.key}`}
                      onMouseDown={(e) => startColumnResize(e, c.key, effectiveWidth || 150)}
                      onTouchStart={(e) => startColumnResize(e, c.key, effectiveWidth || 150)}
                      onClick={(e) => e.stopPropagation()}
                      title="Drag to resize column width"
                      className={`absolute right-0 top-0 bottom-0 w-[6px] cursor-col-resize z-20 transition-colors ${
                        resizingKey === c.key
                          ? 'bg-[#2563EB]'
                          : 'hover:bg-[#3B82F6]/60 group-hover/th:bg-[#CBD5E1]/60'
                      }`}
                    />
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
                  <div
                    className="h-3.5 rounded bg-[#EDF2F9] animate-pulse"
                    style={{ width: `${60 + ((i * 13) % 35)}%` }}
                  />
                </td>
              </tr>
            ))}
          {!loading &&
            rows.map((row, i) => {
              const isSelected = table.selected.has(row.id);
              return (
                <tr
                  key={row.id}
                  className={`${rowH} group ${
                    isSelected ? 'bg-primary-50/60' : 'bg-white hover:bg-[#F8FAFE]'
                  } ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={(e) =>
                    onRowClick && !e.target.closest('button,a,input,select,label') && onRowClick(row)
                  }
                >
                  {selectable && (
                    <td
                      className={`td pl-4 sticky left-0 z-10 ${
                        isSelected ? 'bg-[#EFF6FF]' : 'bg-white group-hover:bg-[#F8FAFE]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        data-testid={`select-row-${row.id}`}
                        className="cb"
                        checked={isSelected}
                        onChange={() => table.toggle(row.id)}
                        aria-label="Select row"
                      />
                    </td>
                  )}
                  {showIndex && <td className="td text-center text-ink-600">{table.startIndex + i + 1}</td>}
                  {columns.map((c) => {
                    const effectiveWidth = columnWidths[c.key] || c.width;
                    const isStickyName = stickyColumnKey ? c.key === stickyColumnKey : false;
                    return (
                      <td
                        key={c.key}
                        style={
                          effectiveWidth
                            ? { width: effectiveWidth, minWidth: effectiveWidth, maxWidth: effectiveWidth }
                            : undefined
                        }
                        className={`td truncate ${alignCls(c.align)} ${c.className || ''} ${
                          isStickyName
                            ? `sticky left-[44px] z-10 shadow-[1px_0_0_#EEF2F7] ${
                                isSelected ? 'bg-[#EFF6FF]' : 'bg-white group-hover:bg-[#F8FAFE]'
                              }`
                            : ''
                        }`}
                      >
                        {c.render ? c.render(row, i) : row[c.key]}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          {!loading && rows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0) + (showIndex ? 1 : 0)}
                className="py-14 text-center"
              >
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
