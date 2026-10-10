import { useState } from 'react';
import { CalendarDays, ChevronDown, Filter } from 'lucide-react';
import Dropdown from './Dropdown';
import SearchInput from './SearchInput';
import { fmtDate, todayISO, addDays } from '../../utils/calculations';

const norm = (o) => (typeof o === 'string' ? { value: o, label: o } : o);

export function SelectField({ label, value, onChange, options, allLabel, className = '', size = 'md' }) {
  const h = size === 'sm' ? 'h-9' : 'h-10';
  return (
    <label className={`flex flex-col min-w-0 ${className}`}>
      {label && <span className="text-[12px] text-ink-600 mb-1">{label}</span>}
      <span className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`appearance-none w-full ${h} pl-3 pr-8 rounded-lg border border-line bg-white text-[13px] text-ink focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 cursor-pointer`}
        >
          {allLabel && <option value="">{allLabel}</option>}
          {options.map(norm).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown size={15} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-500 pointer-events-none" />
      </span>
    </label>
  );
}

export const rangeLabel = (r) => (r?.from || r?.to ? `${r.from ? fmtDate(r.from) : 'Start'} - ${r.to ? fmtDate(r.to) : 'Today'}` : 'All time');

export function DateRangePicker({ label, value, onChange, presets, className = '', size = 'md', placeholder }) {
  const [draft, setDraft] = useState(value || { from: '', to: '' });
  const h = size === 'sm' ? 'h-9' : 'h-10';
  const today = todayISO();
  const list = presets || [
    { label: 'This year (2026)', value: { from: '2026-01-01', to: '2026-12-31' } },
    { label: 'Q1 2026', value: { from: '2026-01-01', to: '2026-03-31' } },
    { label: 'Q2 2026', value: { from: '2026-04-01', to: '2026-06-30' } },
    { label: 'Q3 2026', value: { from: '2026-07-01', to: '2026-09-30' } },
    { label: 'Q4 2026', value: { from: '2026-10-01', to: '2026-12-31' } },
    { label: 'Last 30 days', value: { from: addDays(today, -30), to: today } },
    { label: 'All time', value: { from: '', to: '' } },
  ];
  return (
    <div className={`flex flex-col min-w-0 ${className}`}>
      {label && <span className="text-[12px] text-ink-600 mb-1">{label}</span>}
      <Dropdown
        width={300}
        trigger={
          <button type="button" onClick={() => setDraft(value || { from: '', to: '' })} className={`w-full ${h} px-3 rounded-lg border border-line bg-white text-[13px] text-ink flex items-center gap-2 hover:border-primary/50`}>
            <CalendarDays size={16} className="text-ink-500 shrink-0" />
            <span className="flex-1 text-left truncate">{placeholder && !value?.from && !value?.to ? placeholder : rangeLabel(value)}</span>
            <ChevronDown size={15} className="text-ink-500" />
          </button>
        }
      >
        {(close) => (
          <div className="px-3 py-2">
            <div className="grid grid-cols-2 gap-1.5">
              {list.map((p) => (
                <button key={p.label} type="button" onClick={() => { onChange(p.value); close(); }}
                  className={`text-[12.5px] text-left px-2.5 py-1.5 rounded-md border ${value?.from === p.value.from && value?.to === p.value.to ? 'border-primary bg-primary-50 text-primary' : 'border-line hover:bg-page text-ink'}`}>
                  {p.label}
                </button>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-line-soft grid grid-cols-2 gap-2">
              <label className="text-[11.5px] text-ink-500">From
                <input type="date" value={draft.from} onChange={(e) => setDraft({ ...draft, from: e.target.value })} className="input mt-1 h-9" />
              </label>
              <label className="text-[11.5px] text-ink-500">To
                <input type="date" value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} className="input mt-1 h-9" />
              </label>
            </div>
            <button type="button" className="btn-primary w-full mt-2.5 h-9" onClick={() => {
              const d = draft.from && draft.to && draft.from > draft.to ? { from: draft.to, to: draft.from } : draft;
              onChange(d); close();
            }}>Apply range</button>
          </div>
        )}
      </Dropdown>
    </div>
  );
}

/** "More Filters" popover: children render extra filter fields */
export function MoreFilters({ children, activeCount = 0, label = 'More Filters', size = 'md' }) {
  const h = size === 'sm' ? 'h-9' : 'h-10';
  return (
    <Dropdown width={300} align="right" trigger={
      <button type="button" className={`${h} px-4 rounded-lg border border-line bg-white text-[13.5px] text-ink flex items-center gap-2 hover:border-primary/50 whitespace-nowrap`}>
        <Filter size={16} />{label}
        {activeCount > 0 && <span className="h-5 min-w-5 px-1 rounded-full bg-primary text-white text-[11px] flex items-center justify-center">{activeCount}</span>}
      </button>
    }>
      <div className="px-3 py-2 space-y-3">{children}</div>
    </Dropdown>
  );
}

/**
 * Generic filter row: search + labelled selects + optional date range + more filters + reset.
 * filters: [{ key, label, value, onChange, options, allLabel }]
 */
export default function FilterBar({ search, onSearch, searchPlaceholder, filters = [], dateRange, more, onReset, className = '' }) {
  return (
    <div className={`card px-3 py-3 flex flex-wrap items-end gap-3 ${className}`}>
      {onSearch && <SearchInput value={search} onChange={onSearch} placeholder={searchPlaceholder} className="w-full md:w-auto md:flex-[1.4_1_200px] md:min-w-[180px]" />}
      {filters.map((f) => (
        <SelectField key={f.key} label={f.label} value={f.value} onChange={f.onChange} options={f.options} allLabel={f.allLabel} className="flex-[1_1_110px] min-w-[110px]" />
      ))}
      {dateRange && <DateRangePicker {...dateRange} className="flex-[1.4_1_200px] min-w-[200px]" />}
      {more}
      {onReset && <button type="button" onClick={onReset} className="h-10 px-6 rounded-lg bg-[#EEF3FA] border border-line text-[14px] text-ink hover:bg-[#E3EBF6]">Reset</button>}
    </div>
  );
}
