import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

function pages(page, max) {
  const count = Math.min(5, max);
  let start = Math.max(1, page - 2);
  start = Math.min(start, max - count + 1);
  return Array.from({ length: count }, (_, i) => start + i);
}

export default function Pagination({ table, noun = 'records', options = [10, 25, 50, 100], variant = 'showing' }) {
  const { page, pageSize, total, setPage, setPageSize } = table;
  const max = Math.max(1, Math.ceil(total / pageSize));
  const from = total ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(total, page * pageSize);
  const btn = 'h-10 min-w-10 px-2 rounded-lg border text-[14px] flex items-center justify-center';
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-4">
      <div className="text-[14px] text-ink-600">
        {variant === 'records' ? <>Total Records <b className="text-ink">{total}</b></> : <>Showing {from} - {to} of {total} {noun}</>}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="relative">
          <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="appearance-none h-10 pl-3 pr-9 rounded-lg border border-line bg-white text-[13.5px] text-ink cursor-pointer" aria-label="Rows per page">
            {options.map((o) => <option key={o} value={o}>{variant === 'records' ? `${o} records per page` : `${o} per page`}</option>)}
          </select>
          <ChevronDown size={15} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-ink-500" />
        </span>
        <button className={`${btn} border-line bg-white text-ink-500 disabled:opacity-40`} disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="Previous page"><ChevronLeft size={17} /></button>
        {pages(page, max).map((p) => (
          <button key={p} onClick={() => setPage(p)} className={`${btn} ${p === page ? 'bg-primary border-primary text-white' : 'border-line bg-white text-ink hover:bg-page'}`} aria-current={p === page ? 'page' : undefined}>{p}</button>
        ))}
        {variant === 'records' && <span className="text-[13.5px] text-ink-600 px-1">{from} to {to}</span>}
        <button className={`${btn} border-line bg-white text-ink disabled:opacity-40`} disabled={page >= max} onClick={() => setPage(page + 1)} aria-label="Next page"><ChevronRight size={17} /></button>
      </div>
    </div>
  );
}
