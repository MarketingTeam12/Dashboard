import React, { useMemo } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Inbox } from 'lucide-react';
import ColumnHeaderMenu from './ColumnHeaderMenu';

function defaultDetectType(col) {
  const name = String(col.header || col.key || '');
  if (name.includes('Date') || name.includes('Time') || name.includes('aging') || name.includes('Duration')) return 'Date';
  if (name.includes('Amount') || name.includes('Probability') || name.includes('Count') || name.includes('Revenue') || name.includes('Budget') || name.includes('balance') || name.includes('paidAmount')) return 'Number';
  if (['Stage', 'stage', 'status', 'Status', 'Deal Owner', 'owner', 'Account Name', 'account', 'Contact Name', 'contact', 'Lead Source', 'source', 'type', 'Invoice Type'].some(k => name.toLowerCase().includes(k.toLowerCase()))) return 'Dropdown';
  return 'Text';
}

/**
 * columns: [{ key, header, render(row, i), sortable, align, className, headerClassName, width }]
 * columnMenu: { module, pinnedColumns, onTogglePin, onHideColumn, onFilterColumn, appliedFilters, filterOptions, getFieldType }
 */
export default function DataTable({
  columns, rows, table, selectable = true, showIndex = true, loading, dense, onRowClick,
  emptyTitle = 'No records match these filters', emptyHint = 'Clear the filters or create a new record.', emptyAction, minWidth = 1100, headerExtra,
  columnMenu = null,
}) {
  const allChecked = rows.length > 0 && rows.every((r) => table.selected.has(r.id));
  const someChecked = rows.some((r) => table.selected.has(r.id));
  const rowH = dense ? 'h-[40px]' : 'h-[47px]';
  const alignCls = (a) => (a === 'center' ? 'text-center' : a === 'right' ? 'text-right' : 'text-left');

  const pinnedList = columnMenu?.pinnedColumns || [];
  const pinnedSet = useMemo(() => new Set(pinnedList), [pinnedList]);

  // If columnMenu has pinned columns, partition them to the front
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

    let left = 0;
    if (selectable) left += 44;
    if (showIndex) left += 40;

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
  }, [displayColumns, columnMenu, pinnedList, pinnedSet, selectable, showIndex]);

  const hasPinned = pinnedList.length > 0;
  const totalCols = displayColumns.length + (selectable ? 1 : 0) + (showIndex ? 1 : 0) + (headerExtra ? 1 : 0);

  return (
    <div className="overflow-x-auto thin-scroll">
      <table className="w-full border-separate border-spacing-0 text-[13px]" style={{ minWidth }}>
        <thead>
          <tr className="bg-[#F5F8FD]">
            {selectable && (
              <th
                className={`th w-[44px] pl-4 ${hasPinned ? 'sticky left-0 z-30 bg-[#F5F8FD]' : ''}`}
                style={hasPinned ? { position: 'sticky', left: 0, zIndex: 30, backgroundColor: '#F5F8FD' } : undefined}
              >
                <input type="checkbox" className="cb" checked={allChecked} ref={(el) => el && (el.indeterminate = !allChecked && someChecked)} onChange={table.toggleAll} aria-label="Select all on page" />
              </th>
            )}
            {showIndex && (
              <th
                className={`th w-[40px] text-center ${hasPinned ? 'sticky z-30 bg-[#F5F8FD]' : ''}`}
                style={hasPinned ? { position: 'sticky', left: selectable ? '44px' : '0px', zIndex: 30, backgroundColor: '#F5F8FD' } : undefined}
              >
                #
              </th>
            )}
            {displayColumns.map((c) => {
              const active = table.sort?.key === c.key;
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
                  backgroundColor: '#F5F8FD',
                  width: `${stickyInfo.width}px`,
                  minWidth: `${stickyInfo.width}px`,
                } : {}),
              };

              const pinnedBorder = isPinned && stickyInfo?.isLastPinned
                ? 'shadow-[3px_0_6px_-2px_rgba(0,0,0,0.12)] border-r border-slate-300'
                : '';

              return (
                <th
                  key={c.key}
                  className={`th ${alignCls(c.align)} ${c.headerClassName || ''} ${pinnedBorder}`}
                  style={thStyle}
                >
                  <div className={`group/th inline-flex items-center gap-1 w-full ${c.align === 'center' ? 'justify-center' : ''}`}>
                    {c.sortable ? (
                      isCustomHeader ? (
                        <div className={`group inline-flex items-center gap-1 ${c.align === 'center' ? 'justify-center' : ''}`}>
                          {c.header}
                          <Icon size={12} className={active ? 'text-primary' : 'opacity-0 group-hover:opacity-60'} />
                        </div>
                      ) : (
                        <button type="button" onClick={() => table.onSort(c.key)} className={`group inline-flex items-center gap-1 ${c.align === 'center' ? 'justify-center' : ''} hover:text-primary truncate`}>
                          <span className="truncate">{c.header}</span>
                          <Icon size={12} className={active ? 'text-primary shrink-0' : 'opacity-0 group-hover:opacity-60 shrink-0'} />
                        </button>
                      )
                    ) : (
                      <span className="truncate">{c.header}</span>
                    )}

                    {columnMenu && c.key !== 'actions' && c.key !== 'action' && !c.isAction && (
                      <ColumnHeaderMenu
                        column={c}
                        table={table}
                        isPinned={isPinned}
                        onTogglePin={columnMenu.onTogglePin}
                        onHideColumn={columnMenu.onHideColumn}
                        onFilterColumn={columnMenu.onFilterColumn}
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
        <tbody>
          {loading && Array.from({ length: 8 }).map((_, i) => (
            <tr key={`sk-${i}`} className={rowH}>
              <td colSpan={totalCols} className="td">
                <div className="h-3.5 rounded bg-[#EDF2F9] animate-pulse" style={{ width: `${60 + ((i * 13) % 35)}%` }} />
              </td>
            </tr>
          ))}
          {!loading && rows.map((row, i) => (
            <tr key={row.id} className={`${rowH} group ${table.selected.has(row.id) ? 'bg-primary-50/60' : 'hover:bg-[#F8FAFE]'} ${onRowClick ? 'cursor-pointer' : ''}`} onClick={(e) => onRowClick && !e.target.closest('button,a,input,select,label') && onRowClick(row)}>
              {selectable && (
                <td
                  className={`td pl-4 ${hasPinned ? 'sticky left-0 z-20 bg-white group-hover:bg-[#F8FAFE]' : ''}`}
                  style={hasPinned ? { position: 'sticky', left: 0, zIndex: 15, backgroundColor: table.selected.has(row.id) ? '#EEF4FF' : '#FFFFFF' } : undefined}
                >
                  <input type="checkbox" className="cb" checked={table.selected.has(row.id)} onChange={() => table.toggle(row.id)} aria-label="Select row" />
                </td>
              )}
              {showIndex && (
                <td
                  className={`td text-center text-ink-600 ${hasPinned ? 'sticky z-20 bg-white group-hover:bg-[#F8FAFE]' : ''}`}
                  style={hasPinned ? { position: 'sticky', left: selectable ? '44px' : '0px', zIndex: 15, backgroundColor: table.selected.has(row.id) ? '#EEF4FF' : '#FFFFFF' } : undefined}
                >
                  {table.startIndex + i + 1}
                </td>
              )}
              {displayColumns.map((c) => {
                const stickyInfo = stickyOffsets[c.key];
                const isPinned = Boolean(stickyInfo?.isPinned);
                const tdStyle = isPinned ? {
                  position: 'sticky',
                  left: `${stickyInfo.left}px`,
                  zIndex: 10,
                  width: `${stickyInfo.width}px`,
                  minWidth: `${stickyInfo.width}px`,
                  backgroundColor: table.selected.has(row.id) ? '#EEF4FF' : '#FFFFFF',
                } : undefined;

                const pinnedBorder = isPinned && stickyInfo?.isLastPinned
                  ? 'shadow-[3px_0_6px_-2px_rgba(0,0,0,0.12)] border-r border-slate-300'
                  : '';

                return (
                  <td
                    key={c.key}
                    className={`td ${alignCls(c.align)} ${c.className || ''} ${pinnedBorder}`}
                    style={tdStyle}
                  >
                    {c.render ? c.render(row, i) : row[c.key]}
                  </td>
                );
              })}
              {headerExtra && <td className="td p-0 w-[44px]" />}
            </tr>
          ))}
          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={totalCols} className="py-14 text-center">
                <div className="inline-flex flex-col items-center gap-2 text-ink-500">
                  <span className="h-12 w-12 rounded-full bg-page flex items-center justify-center"><Inbox size={22} className="text-ink-400" /></span>
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
