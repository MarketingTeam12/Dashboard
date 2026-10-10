import { X } from 'lucide-react';

export default function BulkBar({ count, onClear, children }) {
  if (!count) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2 bg-primary-50 border-b border-primary-100 text-[13px]">
      <span className="font-semibold text-primary">{count} selected</span>
      <span className="w-px h-5 bg-primary-100 mx-1" />
      {children}
      <button onClick={onClear} className="ml-auto inline-flex items-center gap-1 text-ink-500 hover:text-ink"><X size={14} />Clear selection</button>
    </div>
  );
}

export function BulkButton({ children, onClick, danger, icon: Icon }) {
  return (
    <button type="button" onClick={onClick} className={`h-8 px-3 rounded-md border bg-white inline-flex items-center gap-1.5 ${danger ? 'border-danger/30 text-danger-700 hover:bg-danger-50' : 'border-line text-ink hover:bg-page'}`}>
      {Icon && <Icon size={14} />}{children}
    </button>
  );
}
