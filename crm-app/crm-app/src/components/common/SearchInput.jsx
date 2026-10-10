import { Search, X } from 'lucide-react';

export default function SearchInput({ value, onChange, placeholder = 'Search', className = '', size = 'md' }) {
  const h = size === 'sm' ? 'h-9 text-[13px]' : 'h-10 text-[13px]';
  return (
    <label className={`relative flex items-center ${className}`}>
      <Search size={16} className="absolute left-3 text-ink-400 pointer-events-none" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full ${h} pl-9 pr-8 rounded-lg border border-line bg-white text-ink placeholder:text-ink-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15`}
      />
      {value && (
        <button type="button" onClick={() => onChange('')} className="absolute right-2 p-1 text-ink-400 hover:text-ink" aria-label="Clear search">
          <X size={14} />
        </button>
      )}
    </label>
  );
}
