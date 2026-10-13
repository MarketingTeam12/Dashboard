import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Inbox, MoreHorizontal } from 'lucide-react';
import ColumnHeaderMenu from './ColumnHeaderMenu';

function defaultDetectType(col) {
  const name = String(col.header || col.key || '');
  if (name.includes('Date') || name.includes('Time') || name.includes('aging') || name.includes('Duration')) return 'Date';
  if (name.includes('Amount') || name.includes('Probability') || name.includes('Count') || name.includes('Revenue') || name.includes('Budget') || name.includes('balance') || name.includes('paidAmount')) return 'Number';
  if (['Stage', 'stage', 'status', 'Status', 'Deal Owner', 'owner', 'Account Name', 'account', 'Contact Name', 'contact', 'Lead Source', 'source', 'type', 'Invoice Type'].some(k => name.toLowerCase().includes(k.toLowerCase()))) return 'Dropdown';
  return 'Text';
}

/**
 * SpreadsheetGridView
 * Full-width, spreadsheet-style table matching Zoho CRM Grid View screenshot.
 * Features:
 * - Thin grid borders across every header and cell (border-r, border-b)
 * - Row checkboxes with select-all header
 * - Sticky table header on scroll
 * - Active cell highlight with red left border indicator (matching screenshot row 6)
 * - Inline cell editing (double-click to edit text, numbers, or remarks)
 * - Supports column pinning, sorting, wrap/clip view modes, and ViewSettingsMenu integration
 */
export default function SpreadsheetGridView({
  columns,
  rows,
  table,
  selectable = true,
  loading = false,
  onRowClick,
  emptyTitle = 'No records match these filters',
  emptyHint = 'Clear the filters or create a new record.',
  emptyAction,
  minWidth = 1200,
  headerExtra,
  columnMenu = null,
  viewMode = 'wrap',
  onCellEdit = null,
}) {
  const [activeCell, setActiveCell] = useState(null); // { rowId, colKey }
  const [editingCell, setEditingCell] = useState(null); // { rowId, colKey }
  const [editVal, setEditVal] = useState('');
  const [hoveredRowId, setHoveredRowId] = useState(null);
  const inputRef = useRef(null);

  const allChecked = rows.length > 0 && rows.every((r) => table.selected.has(r.id));
  const someChecked = rows.some((r) => table.selected.has(r.id));
  const alignCls = (a) => (a === 'center' ? 'text-center' : a === 'right' ? 'text-right' : 'text-left');

  const pinnedList = columnMenu?.pinnedColumns || [];
  const pinnedSet = useMemo(() => new Set(pinnedList), [pinnedList]);

  // Partition pinned columns to front if any
  const displayColumns = useMemo(() => {
    if (!columnMenu || pinnedList.length === 0) return columns;
    const pinned = [];
    const unpinned = [];
    columns.forEach((c) => {
      if (pinnedSet.has(c.key) || pinnedSet.has(c.header) || (c.colName && pinnedSet.has(c.colName))) {
        pinned.push(c);
      } else {
        unpinned.push(c);
      }
    });
    return [...pinned, ...unpinned];
  }, [columns, columnMenu, pinnedList, pinnedSet]);

  // Compute sticky offsets for pinned columns
  const stickyOffsets = useMemo(() => {
    const offsets = {};
    if (!columnMenu || pinnedList.length === 0) return offsets;

    let left = selectable ? 44 : 0;
    displayColumns.forEach((c) => {
      const isPinned = pinnedSet.has(c.key) || pinnedSet.has(c.header) || (c.colName && pinnedSet.has(c.colName));
      if (isPinned) {
        const colWidth = c.width || 180;
        offsets[c.key] = {
          left,
          isPinned: true,
          isLastPinned: false,
          width: colWidth,
        };
        left += colWidth;
      }
    });

    let lastPinnedKey = null;
    displayColumns.forEach((c) => {
      if (pinnedSet.has(c.key) || pinnedSet.has(c.header) || (c.colName && pinnedSet.has(c.colName))) {
        lastPinnedKey = c.key;
      }
    });
    if (lastPinnedKey && offsets[lastPinnedKey]) {
      offsets[lastPinnedKey].isLastPinned = true;
    }

    return offsets;
  }, [displayColumns, columnMenu, pinnedList, pinnedSet, selectable]);

  const totalCols = displayColumns.length + (selectable ? 1 : 0) + (headerExtra ? 1 : 0);

  // Auto-focus input when inline editing starts
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const handleCellClick = (e, row, col) => {
    const colKey = col.key || col.colName;
    setActiveCell({ rowId: row.id, colKey });
  };

  const handleCellDoubleClick = (e, row, col) => {
    if (!onCellEdit) return;
    const colKey = col.key || col.colName;
    // Disallow editing for complex rendered components unless simple key
    const rawVal = row[colKey] !== undefined ? row[colKey] : (row[col.key] !== undefined ? row[col.key] : '');
    setEditingCell({ rowId: row.id, colKey });
    setEditVal(rawVal !== null && rawVal !== undefined ? String(rawVal) : '');
  };

  const commitEdit = () => {
    if (!editingCell || !onCellEdit) return;
    const { rowId, colKey } = editingCell;
    onCellEdit(rowId, colKey, editVal);
    setEditingCell(null);
  };

  const cancelEdit = () => {
    setEditingCell(null);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  };

  return (
    <div className="w-full bg-white border border-[#CBD5E1] shadow-xs overflow-hidden">
      <div className="overflow-x-auto thin-scroll max-h-[calc(100vh-210px)] relative">
        <table className="w-full border-collapse text-[13px] text-slate-800" style={{ minWidth }}>
          {/* Spreadsheet Table Header */}
          <thead className="sticky top-0 z-20 bg-[#F4F6F9] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
            <tr className="border-b border-[#CBD5E1]">
              {selectable && (
                <th
                  className="w-[44px] min-w-[44px] max-w-[44px] text-center px-2 py-2.5 border-r border-[#CBD5E1] bg-[#F4F6F9] select-none sticky left-0 z-30"
                >
                  <input
                    type="checkbox"
                    className="cb cursor-pointer"
                    checked={allChecked}
                    ref={(el) => el && (el.indeterminate = !allChecked && someChecked)}
                    onChange={table.toggleAll}
                    aria-label="Select all on page"
                  />
                </th>
              )}

              {displayColumns.map((c) => {
                const colKey = c.key || c.colName;
                const active = table.sort?.key === colKey;
                const Icon = active ? (table.sort.dir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
                const isCustomHeader = typeof c.header !== 'string';
                const stickyInfo = stickyOffsets[c.key];
                const isPinned = Boolean(stickyInfo?.isPinned);

                const thStyle = {
                  ...(c.width ? { width: c.width } : undefined),
                  ...(isPinned ? {
                    position: 'sticky',
                    left: `${stickyInfo.left}px`,
                    zIndex: 25,
                    backgroundColor: '#F4F6F9',
                    width: `${stickyInfo.width}px`,
                    minWidth: `${stickyInfo.width}px`,
                  } : {}),
                };

                const pinnedBorder = isPinned && stickyInfo?.isLastPinned
                  ? 'shadow-[3px_0_6px_-2px_rgba(0,0,0,0.12)] border-r-2 border-slate-300'
                  : 'border-r border-[#CBD5E1]';

                return (
                  <th
                    key={colKey}
                    className={`px-3 py-2 text-[13px] font-semibold text-slate-700 select-none bg-[#F4F6F9] ${alignCls(c.align)} ${c.headerClassName || ''} ${pinnedBorder}`}
                    style={thStyle}
                  >
                    <div className={`group/th inline-flex items-center gap-1.5 w-full ${c.align === 'center' ? 'justify-center' : c.align === 'right' ? 'justify-end' : 'justify-between'}`}>
                      <div className="inline-flex items-center gap-1.5 min-w-0">
                        {c.sortable ? (
                          isCustomHeader ? (
                            <div className="inline-flex items-center gap-1">
                              {c.header}
                              <button
                                type="button"
                                onClick={() => table.onSort(colKey)}
                                className="text-slate-400 hover:text-primary shrink-0"
                                title="Sort column"
                              >
                                <Icon size={12} className={active ? 'text-primary' : 'opacity-0 group-hover/th:opacity-60'} />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => table.onSort(colKey)}
                              className="group inline-flex items-center gap-1 hover:text-primary text-slate-700 truncate font-semibold"
                            >
                              <span className="truncate">{c.header}</span>
                              <Icon size={12} className={active ? 'text-primary shrink-0' : 'opacity-0 group-hover/th:opacity-60 shrink-0'} />
                            </button>
                          )
                        ) : (
                          <div className="font-semibold text-slate-700 truncate">{c.header}</div>
                        )}
                      </div>

                      {columnMenu && c.key !== 'actions' && c.key !== 'action' && !c.isAction && (
                        <ColumnHeaderMenu
                          column={c}
                          table={table}
                          isPinned={isPinned}
                          onTogglePin={columnMenu.onTogglePin}
                          onHideColumn={columnMenu.onHideColumn}
                          onFilterColumn={columnMenu.onFilterColumn}
                          onOpenFilterSidebar={columnMenu.onOpenFilterSidebar}
                          activeFilter={columnMenu.appliedFilters?.[c.key] || columnMenu.appliedFilters?.[c.header] || (c.colName && columnMenu.appliedFilters?.[c.colName])}
                          filterOptions={columnMenu.filterOptions?.[c.key] || columnMenu.filterOptions?.[c.header] || (c.colName && columnMenu.filterOptions?.[c.colName])}
                          fieldType={columnMenu.getFieldType ? columnMenu.getFieldType(c.key || c.header) : defaultDetectType(c)}
                        />
                      )}
                    </div>
                  </th>
                );
              })}

              {headerExtra}
            </tr>
          </thead>

          {/* Spreadsheet Table Body */}
          <tbody className="divide-y divide-[#E2E8F0]">
            {loading && Array.from({ length: 8 }).map((_, i) => (
              <tr key={`sk-${i}`} className="h-[40px]">
                <td colSpan={totalCols} className="px-4 py-2 border-b border-[#E2E8F0]">
                  <div className="h-4 rounded bg-[#EDF2F9] animate-pulse" style={{ width: `${60 + ((i * 13) % 35)}%` }} />
                </td>
              </tr>
            ))}

            {!loading && rows.map((row, rowIndex) => {
              const isRowSelected = table.selected.has(row.id);
              const isHovered = hoveredRowId === row.id;

              return (
                <tr
                  key={row.id}
                  onMouseEnter={() => setHoveredRowId(row.id)}
                  onMouseLeave={() => setHoveredRowId(null)}
                  className={`h-[40px] group transition-colors ${
                    isRowSelected ? 'bg-[#EFF6FF]' : 'hover:bg-[#F8FAFC]'
                  } ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={(e) => onRowClick && !e.target.closest('button,a,input,select,label') && onRowClick(row)}
                >
                  {/* Row Checkbox Cell */}
                  {selectable && (
                    <td
                      className={`w-[44px] min-w-[44px] max-w-[44px] text-center px-2 py-2 border-r border-b border-[#E2E8F0] select-none relative ${
                        isRowSelected ? 'bg-[#EFF6FF]' : 'bg-white group-hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <div className="flex items-center justify-center relative">
                        <input
                          type="checkbox"
                          className="cb cursor-pointer"
                          checked={isRowSelected}
                          onChange={() => table.toggle(row.id)}
                          aria-label={`Select row ${rowIndex + 1}`}
                        />
                        {isHovered && (
                          <span
                            className="absolute -right-1 text-slate-400 hover:text-slate-700 cursor-pointer hidden"
                            title="Row actions"
                          >
                            <MoreHorizontal size={12} />
                          </span>
                        )}
                      </div>
                    </td>
                  )}

                  {/* Data Cells */}
                  {displayColumns.map((c) => {
                    const colKey = c.key || c.colName;
                    const stickyInfo = stickyOffsets[c.key];
                    const isPinned = Boolean(stickyInfo?.isPinned);

                    const isCellActive = activeCell?.rowId === row.id && activeCell?.colKey === colKey;
                    const isCellEditing = editingCell?.rowId === row.id && editingCell?.colKey === colKey;

                    const tdStyle = isPinned ? {
                      position: 'sticky',
                      left: `${stickyInfo.left}px`,
                      zIndex: 10,
                      width: `${stickyInfo.width}px`,
                      minWidth: `${stickyInfo.width}px`,
                      backgroundColor: isRowSelected ? '#EFF6FF' : '#FFFFFF',
                    } : undefined;

                    const pinnedBorder = isPinned && stickyInfo?.isLastPinned
                      ? 'shadow-[3px_0_6px_-2px_rgba(0,0,0,0.12)] border-r-2 border-slate-300'
                      : 'border-r border-[#E2E8F0]';

                    // Mode formatting (wrap vs clip)
                    const modeCls = viewMode === 'clip'
                      ? 'whitespace-nowrap overflow-hidden text-ellipsis max-w-[280px]'
                      : 'whitespace-normal break-words';

                    // Active cell indicator (matching row 6 red left bar in reference screenshot)
                    const activeHighlightCls = isCellActive
                      ? 'border-l-[3.5px] border-l-[#EF4444] bg-[#F8FAFC]/90 shadow-[inset_0_0_0_1px_#CBD5E1]'
                      : '';

                    const cellContent = c.render ? c.render(row, rowIndex) : (row[colKey] !== undefined ? row[colKey] : '—');
                    const rawVal = typeof row[colKey] === 'string' ? row[colKey] : undefined;

                    return (
                      <td
                        key={colKey}
                        title={viewMode === 'clip' && rawVal ? rawVal : undefined}
                        onClick={(e) => handleCellClick(e, row, c)}
                        onDoubleClick={(e) => handleCellDoubleClick(e, row, c)}
                        className={`px-3 py-1.5 border-b border-[#E2E8F0] text-[13px] ${alignCls(c.align)} ${c.className || ''} ${modeCls} ${pinnedBorder} ${activeHighlightCls} transition-all duration-75`}
                        style={tdStyle}
                      >
                        {isCellEditing ? (
                          <div className="w-full" onClick={(e) => e.stopPropagation()}>
                            <input
                              ref={inputRef}
                              type="text"
                              value={editVal}
                              onChange={(e) => setEditVal(e.target.value)}
                              onKeyDown={handleInputKeyDown}
                              onBlur={commitEdit}
                              className="w-full h-[28px] px-2 text-[13px] border border-primary rounded bg-white shadow-xs outline-none"
                            />
                          </div>
                        ) : (
                          cellContent
                        )}
                      </td>
                    );
                  })}

                  {headerExtra && (
                    <td className="w-[44px] min-w-[44px] p-0 border-b border-[#E2E8F0] bg-white group-hover:bg-[#F8FAFC]" />
                  )}
                </tr>
              );
            })}

            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={totalCols} className="py-14 text-center bg-white border-b border-[#E2E8F0]">
                  <div className="inline-flex flex-col items-center gap-2 text-slate-500">
                    <span className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center">
                      <Inbox size={22} className="text-slate-400" />
                    </span>
                    <span className="text-[14px] font-medium text-slate-800">{emptyTitle}</span>
                    <span className="text-[13px]">{emptyHint}</span>
                    {emptyAction}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

