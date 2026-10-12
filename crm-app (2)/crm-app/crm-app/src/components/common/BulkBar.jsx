import { X } from 'lucide-react';

export default function BulkBar({ count, onClear, children }) {
  if (!count) return null;
  const itemWord = count === 1 ? 'item' : 'items';
  return (
    <div
      data-testid="bulk-selection-bar"
      className="flex flex-wrap items-center gap-2 px-4 py-2 bg-primary-50 border-b border-primary-100 text-[13px]"
    >
      <span data-testid="bulk-selected-count" className="font-semibold text-primary tabular-nums">
        {`${count} ${itemWord} selected`}
      </span>
      <span className="w-px h-5 bg-primary-100 mx-1" />
      {children}
      <button
        type="button"
        data-testid="bulk-deselect-all-btn"
        onClick={onClear}
        className="ml-auto inline-flex items-center gap-1 font-medium text-ink-600 hover:text-ink cursor-pointer"
      >
        <X size={14} />
        <span>Deselect all</span>
      </button>
    </div>
  );
}

export function BulkButton({ children, onClick, danger, icon: Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 px-3 rounded-md border bg-white inline-flex items-center gap-1.5 ${
        danger ? 'border-danger/30 text-danger-700 hover:bg-danger-50' : 'border-line text-ink hover:bg-page'
      }`}
    >
      {Icon && <Icon size={14} />}
      {children}
    </button>
  );
}

