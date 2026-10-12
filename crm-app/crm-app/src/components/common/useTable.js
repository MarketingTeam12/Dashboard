import { useEffect, useMemo, useState } from 'react';

const cmp = (a, b) => {
  if (a == null || a === '') return 1;
  if (b == null || b === '') return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
};

/**
 * Sorting, pagination and selection for a filtered list.
 * accessors: { key: (row) => sortValue }
 */
export default function useTable(rows, { accessors = {}, defaultSort = null, pageSize: initialSize = 10 } = {}) {
  const [sort, setSort] = useState(defaultSort);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialSize);
  const [selected, setSelected] = useState(() => new Set());

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const get = accessors[sort.key] || ((r) => r[sort.key]);
    const out = [...rows].sort((a, b) => cmp(get(a), get(b)));
    return sort.dir === 'desc' ? out.reverse() : out;
  }, [rows, sort, accessors]);

  const total = sorted.length;
  const maxPage = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, maxPage);
  useEffect(() => { if (page > maxPage) setPage(maxPage); }, [page, maxPage]);

  // drop selections that no longer exist
  useEffect(() => {
    setSelected((s) => {
      if (!s.size) return s;
      const ids = new Set(rows.map((r) => r.id));
      const next = new Set([...s].filter((id) => ids.has(id)));
      return next.size === s.size ? s : next;
    });
  }, [rows]);

  const pageRows = useMemo(() => sorted.slice((current - 1) * pageSize, current * pageSize), [sorted, current, pageSize]);

  return {
    sort, setSort,
    onSort: (key) => setSort((s) => (s?.key === key ? (s.dir === 'asc' ? { key, dir: 'desc' } : null) : { key, dir: 'asc' })),
    page: current, setPage, pageSize,
    setPageSize: (n) => { setPageSize(n); setPage(1); },
    pageRows, sorted, total, startIndex: (current - 1) * pageSize,
    selected,
    toggle: (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }),
    toggleAll: () => setSelected((s) => {
      const ids = pageRows.map((r) => r.id);
      const all = ids.every((id) => s.has(id));
      const n = new Set(s);
      ids.forEach((id) => (all ? n.delete(id) : n.add(id)));
      return n;
    }),
    selectAllFiltered: () => setSelected(new Set(sorted.map((r) => r.id))),
    clearSelection: () => setSelected(new Set()),
    resetPage: () => setPage(1),
  };
}
