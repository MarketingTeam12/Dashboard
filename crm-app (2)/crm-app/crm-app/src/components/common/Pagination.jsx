import { ChevronDown, ChevronLeft, ChevronRight, CheckSquare, X } from 'lucide-react';

function pages(page, max) {
  const count = Math.min(5, max);
  let start = Math.max(1, page - 2);
  start = Math.min(start, max - count + 1);
  return Array.from({ length: count }, (_, i) => start + i);
}

/**
 * Zoho CRM-style Total Records + Selected Items counter & Deselect All control.
 * Keeps selection count visible beside Total Records across all pages.
 */
export function RecordSelectionSummary({
  total = 0,
  selectedCount = 0,
  onClearSelection,
  totalTestId,
  selectionTestId = 'selected-items-count',
  deselectTestId = 'deselect-all-records-btn',
  showTotal = true,
  colonAfterTotal = false,
}) {
  const itemWord = selectedCount === 1 ? 'item' : 'items';

  return (
    <div className="flex flex-wrap items-center gap-2.5 text-[12.5px] text-[#475569]">
      {showTotal && (
        <div className="flex items-center gap-1.5" data-testid={totalTestId}>
          <span className="font-medium text-[#334155]">
            Total Records{colonAfterTotal ? ':' : ''}
          </span>
          <span className="font-bold text-[#0F172A] font-mono tabular-nums text-[13px]">
            {total}
          </span>
        </div>
      )}

      <span className="text-[#CBD5E1] select-none" aria-hidden="true">
        •
      </span>

      <div className="flex items-center gap-2">
        <span
          data-testid={selectionTestId}
          aria-live="polite"
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-semibold transition-colors tabular-nums ${
            selectedCount > 0
              ? 'bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]'
              : 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]'
          }`}
        >
          {selectedCount > 0 && <CheckSquare size={12.5} className="text-[#2563EB] shrink-0" />}
          <span>{`${selectedCount} ${itemWord} selected`}</span>
        </span>

        {selectedCount > 0 && onClearSelection && (
          <button
            type="button"
            data-testid={deselectTestId}
            onClick={onClearSelection}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[12px] font-medium text-[#2563EB] hover:text-[#1D4ED8] hover:bg-[#EFF6FF] transition-colors cursor-pointer"
            title="Clear all selected records across all pages"
          >
            <X size={12.5} />
            <span>Deselect all</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default function Pagination({
  table,
  noun = 'records',
  options = [10, 25, 50, 100],
  variant = 'showing',
  hideTotal = false,
}) {
  const { page, pageSize, total, setPage, setPageSize, selected, clearSelection } = table;
  const selectedCount = selected ? selected.size : 0;
  const max = Math.max(1, Math.ceil(total / pageSize));
  const from = total ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(total, page * pageSize);
  const btn = 'h-9 min-w-9 px-2 rounded-lg border text-[13.5px] flex items-center justify-center';
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-2.5">
      <div className="flex flex-wrap items-center gap-2.5 text-[13.5px] text-ink-600">
        {variant === 'records' ? (
          <RecordSelectionSummary
            total={total}
            selectedCount={selectedCount}
            onClearSelection={clearSelection}
            showTotal={!hideTotal}
          />
        ) : (
          <>
            <span>
              Showing {from} - {to} of {total} {noun}
            </span>
            <RecordSelectionSummary
              total={total}
              selectedCount={selectedCount}
              onClearSelection={clearSelection}
              showTotal={false}
            />
          </>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="relative">
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="appearance-none h-9 pl-3 pr-8 rounded-lg border border-line bg-white text-[13px] text-ink cursor-pointer"
            aria-label="Rows per page"
          >
            {options.map((o) => (
              <option key={o} value={o}>
                {variant === 'records' ? `${o} records per page` : `${o} per page`}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-ink-500"
          />
        </span>
        <button
          type="button"
          className={`${btn} border-line bg-white text-ink-500 disabled:opacity-40`}
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        {pages(page, max).map((p) => (
          <button
            type="button"
            key={p}
            onClick={() => setPage(p)}
            className={`${btn} ${
              p === page
                ? 'bg-primary border-primary text-white'
                : 'border-line bg-white text-ink hover:bg-page'
            }`}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        ))}
        {variant === 'records' && (
          <span className="text-[13px] text-ink-600 px-1 tabular-nums">
            {from} to {to}
          </span>
        )}
        <button
          type="button"
          className={`${btn} border-line bg-white text-ink disabled:opacity-40`}
          disabled={page >= max}
          onClick={() => setPage(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

