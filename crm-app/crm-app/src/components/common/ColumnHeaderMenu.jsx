import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowUpAZ, ArrowDownZA, Pin, PinOff, Filter, EyeOff,
  ChevronDown, Check, X, ArrowLeft
} from 'lucide-react';

const FILTER_OPERATORS = {
  Text: ['Contains', 'Equals', 'Starts With', 'Is Empty'],
  Number: ['Equals', 'Greater Than', 'Less Than', 'Between'],
  Date: ['Before', 'After', 'Between'],
  Dropdown: ['Is', 'Is Not']
};

/**
 * Zoho CRM-style Column Header Dropdown Menu Component
 * Provides:
 * 1. Asc (sort ascending)
 * 2. Desc (sort descending)
 * 3. Pin Column / Unpin Column (sticky left freeze)
 * 4. Filter by (field-specific filter popup)
 * 5. Hide Column (removes column, restorable via Manage Columns)
 */
export default function ColumnHeaderMenu({
  column,
  table,
  isPinned = false,
  onTogglePin,
  onHideColumn,
  onFilterColumn,
  onOpenFilterSidebar,
  activeFilter = null,
  filterOptions = null,
  fieldType = 'Text'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState('menu'); // 'menu' | 'filter'
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const operators = FILTER_OPERATORS[fieldType] || FILTER_OPERATORS.Text;

  const [filterState, setFilterState] = useState({
    op: activeFilter?.op || operators[0],
    val: activeFilter?.val || '',
    val2: activeFilter?.val2 || ''
  });

  // Keep filterState in sync when activeFilter changes
  useEffect(() => {
    if (activeFilter) {
      setFilterState({
        op: activeFilter.op || operators[0],
        val: activeFilter.val || '',
        val2: activeFilter.val2 || ''
      });
    } else {
      setFilterState({
        op: operators[0],
        val: '',
        val2: ''
      });
    }
  }, [activeFilter, operators]);

  // Compute position on open
  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const width = view === 'filter' ? 260 : 190;
    const height = view === 'filter' ? 260 : 200;

    let left = rect.left;
    if (left + width > window.innerWidth - 12) {
      left = Math.max(8, window.innerWidth - width - 12);
    }
    if (left < 8) left = 8;

    let top = rect.bottom + 4;
    if (top + height > window.innerHeight - 12) {
      top = Math.max(8, rect.top - height - 4);
    }

    setCoords({ top, left });
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen, view]);

  // Close on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleMouseDown = (e) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)
      ) {
        setIsOpen(false);
        setView('menu');
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setView('menu');
      }
    };

    const handleScroll = (e) => {
      // Don't close if scrolling inside the menu itself
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      setIsOpen(false);
      setView('menu');
    };

    document.addEventListener('mousedown', handleMouseDown, true);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown, true);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  const handleTriggerClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isOpen) {
      setView('menu');
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const isCurrentSortAsc = table?.sort?.key === column.key && table?.sort?.dir === 'asc';
  const isCurrentSortDesc = table?.sort?.key === column.key && table?.sort?.dir === 'desc';
  const hasActiveFilter = Boolean(activeFilter && (activeFilter.val || activeFilter.op === 'Is Empty'));

  const handleSortAsc = (e) => {
    e.stopPropagation();
    table?.setSort?.({ key: column.key, dir: 'asc' });
    setIsOpen(false);
  };

  const handleSortDesc = (e) => {
    e.stopPropagation();
    table?.setSort?.({ key: column.key, dir: 'desc' });
    setIsOpen(false);
  };

  const handleTogglePin = (e) => {
    e.stopPropagation();
    onTogglePin?.(column.key || column.header, column);
    setIsOpen(false);
  };

  const handleHideColumn = (e) => {
    e.stopPropagation();
    onHideColumn?.(column.key || column.header, column);
    setIsOpen(false);
  };

  const handleOpenFilterView = (e) => {
    e.stopPropagation();
    if (onOpenFilterSidebar) {
      onOpenFilterSidebar(column.key || column.header, column);
      setIsOpen(false);
    } else {
      setView('filter');
    }
  };

  const handleApplyFilter = (e) => {
    e.stopPropagation();
    onFilterColumn?.(column.key || column.header, { ...filterState }, column);
    setIsOpen(false);
  };

  const handleClearFilter = (e) => {
    e.stopPropagation();
    setFilterState({ op: operators[0], val: '', val2: '' });
    onFilterColumn?.(column.key || column.header, null, column);
    setIsOpen(false);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleTriggerClick}
        aria-label={`Column options for ${column.header || column.key}`}
        aria-expanded={isOpen}
        title="Column options"
        className={`inline-flex items-center justify-center h-5 w-5 rounded hover:bg-slate-200/80 text-ink-400 hover:text-ink transition-all cursor-pointer shrink-0 ml-1 ${
          isOpen || hasActiveFilter || isPinned || isCurrentSortAsc || isCurrentSortDesc
            ? 'opacity-100 text-primary'
            : 'opacity-0 group-hover:opacity-100 group-hover/th:opacity-100 focus:opacity-100'
        }`}
      >
        <ChevronDown size={12} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              zIndex: 99999
            }}
            className="bg-white rounded-lg shadow-xl border border-line text-[13px] text-ink font-normal animate-in fade-in zoom-in-95 duration-100 overflow-hidden"
          >
            {view === 'menu' ? (
              <div className="w-[185px] py-1 select-none">
                {/* 1. Asc */}
                <button
                  type="button"
                  onClick={handleSortAsc}
                  className={`w-full px-3 py-2 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer ${
                    isCurrentSortAsc ? 'bg-primary-50 text-primary font-medium' : 'text-ink-700'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <ArrowUpAZ size={14} className={isCurrentSortAsc ? 'text-primary' : 'text-ink-500'} />
                    <span>Asc</span>
                  </span>
                  {isCurrentSortAsc && <Check size={13} className="text-primary font-bold" />}
                </button>

                {/* 2. Desc */}
                <button
                  type="button"
                  onClick={handleSortDesc}
                  className={`w-full px-3 py-2 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer ${
                    isCurrentSortDesc ? 'bg-primary-50 text-primary font-medium' : 'text-ink-700'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <ArrowDownZA size={14} className={isCurrentSortDesc ? 'text-primary' : 'text-ink-500'} />
                    <span>Desc</span>
                  </span>
                  {isCurrentSortDesc && <Check size={13} className="text-primary font-bold" />}
                </button>

                <div className="h-px bg-line-soft my-1" />

                {/* 3. Pin / Unpin Column */}
                <button
                  type="button"
                  onClick={handleTogglePin}
                  className={`w-full px-3 py-2 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer ${
                    isPinned ? 'bg-primary-50 text-primary font-medium' : 'text-ink-700'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    {isPinned ? (
                      <PinOff size={14} className="text-primary" />
                    ) : (
                      <Pin size={14} className="text-ink-500" />
                    )}
                    <span>{isPinned ? 'Unpin Column' : 'Pin Column'}</span>
                  </span>
                  {isPinned && <span className="h-2 w-2 rounded-full bg-primary" />}
                </button>

                {/* 4. Filter by */}
                <button
                  type="button"
                  onClick={handleOpenFilterView}
                  className={`w-full px-3 py-2 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer ${
                    hasActiveFilter ? 'bg-primary-50 text-primary font-medium' : 'text-ink-700'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Filter size={14} className={hasActiveFilter ? 'text-primary' : 'text-ink-500'} />
                    <span>Filter by</span>
                  </span>
                  {hasActiveFilter && (
                    <span className="h-2 w-2 rounded-full bg-primary" title="Filter active" />
                  )}
                </button>

                <div className="h-px bg-line-soft my-1" />

                {/* 5. Hide Column */}
                <button
                  type="button"
                  onClick={handleHideColumn}
                  className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-rose-50 hover:text-rose-600 text-ink-700 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <EyeOff size={14} className="text-ink-500 group-hover:text-rose-600" />
                    <span>Hide Column</span>
                  </span>
                </button>
              </div>
            ) : (
              /* Filter Sub-View */
              <div className="w-[260px] p-3 text-ink select-none">
                <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-line-soft">
                  <div className="flex items-center gap-1.5 font-semibold text-[13px] text-ink truncate">
                    <button
                      type="button"
                      onClick={() => setView('menu')}
                      className="p-1 -ml-1 text-ink-500 hover:text-ink hover:bg-slate-100 rounded cursor-pointer"
                      title="Back to options"
                    >
                      <ArrowLeft size={13} />
                    </button>
                    <span className="truncate">Filter: {column.header || column.key}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setView('menu');
                    }}
                    className="p-1 text-ink-400 hover:text-ink hover:bg-slate-100 rounded cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                </div>

                <div className="space-y-2.5 mb-3 text-[12.5px]">
                  {/* Operator Select */}
                  <div>
                    <label className="block text-[11px] font-semibold text-ink-500 uppercase tracking-wide mb-1">
                      Condition
                    </label>
                    <select
                      value={filterState.op}
                      onChange={(e) => setFilterState((prev) => ({ ...prev, op: e.target.value }))}
                      className="w-full h-8 px-2 border border-line rounded-md bg-white text-[12.5px] text-ink focus:border-primary outline-none"
                    >
                      {operators.map((op) => (
                        <option key={op} value={op}>
                          {op}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Value Inputs */}
                  {filterState.op !== 'Is Empty' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-ink-500 uppercase tracking-wide mb-1">
                        Value
                      </label>
                      {fieldType === 'Dropdown' && filterOptions?.length ? (
                        <select
                          value={filterState.val}
                          onChange={(e) => setFilterState((prev) => ({ ...prev, val: e.target.value }))}
                          className="w-full h-8 px-2 border border-line rounded-md bg-white text-[12.5px] text-ink focus:border-primary outline-none"
                        >
                          <option value="">Select option...</option>
                          {filterOptions.map((opt) => {
                            const val = typeof opt === 'string' ? opt : opt.value;
                            const lbl = typeof opt === 'string' ? opt : opt.label;
                            return (
                              <option key={val} value={val}>
                                {lbl}
                              </option>
                            );
                          })}
                        </select>
                      ) : fieldType === 'Date' ? (
                        <div className="space-y-1.5">
                          <input
                            type="date"
                            value={filterState.val}
                            onChange={(e) => setFilterState((prev) => ({ ...prev, val: e.target.value }))}
                            className="w-full h-8 px-2.5 border border-line rounded-md text-[12.5px] bg-white focus:border-primary outline-none"
                          />
                          {filterState.op === 'Between' && (
                            <input
                              type="date"
                              placeholder="To date"
                              value={filterState.val2}
                              onChange={(e) => setFilterState((prev) => ({ ...prev, val2: e.target.value }))}
                              className="w-full h-8 px-2.5 border border-line rounded-md text-[12.5px] bg-white focus:border-primary outline-none"
                            />
                          )}
                        </div>
                      ) : fieldType === 'Number' ? (
                        <div className="space-y-1.5">
                          <input
                            type="number"
                            placeholder="Enter number..."
                            value={filterState.val}
                            onChange={(e) => setFilterState((prev) => ({ ...prev, val: e.target.value }))}
                            className="w-full h-8 px-2.5 border border-line rounded-md text-[12.5px] bg-white focus:border-primary outline-none"
                          />
                          {filterState.op === 'Between' && (
                            <input
                              type="number"
                              placeholder="To number..."
                              value={filterState.val2}
                              onChange={(e) => setFilterState((prev) => ({ ...prev, val2: e.target.value }))}
                              className="w-full h-8 px-2.5 border border-line rounded-md text-[12.5px] bg-white focus:border-primary outline-none"
                            />
                          )}
                        </div>
                      ) : (
                        <input
                          type="text"
                          placeholder="Search text..."
                          value={filterState.val}
                          onChange={(e) => setFilterState((prev) => ({ ...prev, val: e.target.value }))}
                          className="w-full h-8 px-2.5 border border-line rounded-md text-[12.5px] bg-white focus:border-primary outline-none"
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-line-soft">
                  <button
                    type="button"
                    onClick={handleApplyFilter}
                    className="btn-primary h-7.5 px-3 flex-1 text-[12px] font-semibold"
                  >
                    Apply Filter
                  </button>
                  <button
                    type="button"
                    onClick={handleClearFilter}
                    className="btn-secondary h-7.5 px-2.5 text-[12px] font-medium"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
