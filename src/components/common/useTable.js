import { useEffect, useMemo, useState } from 'react';

const cmp = (a, b) => {
  if (a == null || a === '') return 1;
  if (b == null || b === '') return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
};

/**
 * Sorting, pagination, search and selection for a filtered list.
 * accessors: { key: (row) => sortValue }
 */
export default function useTable(rows = [], { accessors = {}, searchKeys = [], defaultSort = null, initialSort = null, pageSize: initialSize = 10 } = {}) {
  const [sort, setSort] = useState(defaultSort || initialSort);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialSize);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(() => new Set());

  const searchedRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q || !searchKeys.length) return rows;
    return rows.filter((r) => searchKeys.some((k) => String(r?.[k] ?? '').toLowerCase().includes(q)));
  }, [rows, search, searchKeys]);

  const sorted = useMemo(() => {
    if (!sort) return searchedRows;
    const get = accessors[sort.key] || ((r) => r?.[sort.key]);
    const out = [...searchedRows].sort((a, b) => cmp(get(a), get(b)));
    return sort.dir === 'desc' ? out.reverse() : out;
  }, [searchedRows, sort, accessors]);

  const total = sorted.length;
  const maxPage = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, maxPage);
  useEffect(() => {
    if (page > maxPage) setPage(maxPage);
  }, [page, maxPage]);

  // drop selections that no longer exist
  useEffect(() => {
    setSelected((s) => {
      if (!s.size) return s;
      const ids = new Set(searchedRows.map((r) => r.id));
      const next = new Set([...s].filter((id) => ids.has(id)));
      return next.size === s.size ? s : next;
    });
  }, [searchedRows]);

  const pageRows = useMemo(() => sorted.slice((current - 1) * pageSize, current * pageSize), [sorted, current, pageSize]);

  const toggleSort = (key) =>
    setSort((s) => (s?.key === key ? (s.dir === 'asc' ? { key, dir: 'desc' } : null) : { key, dir: 'asc' }));

  const toggleSelect = (id) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const toggleAll = () =>
    setSelected((s) => {
      const ids = pageRows.map((r) => r.id);
      const all = ids.every((id) => s.has(id));
      const n = new Set(s);
      ids.forEach((id) => (all ? n.delete(id) : n.add(id)));
      return n;
    });

  return {
    sort,
    setSort,
    onSort: toggleSort,
    toggleSort,
    search,
    setSearch: (val) => {
      setSearch(val);
      setPage(1);
    },
    page: current,
    setPage,
    pageSize,
    setPageSize: (n) => {
      setPageSize(n);
      setPage(1);
    },
    totalPages: maxPage,
    pageRows,
    rows: pageRows,
    sorted,
    filteredRows: sorted,
    total,
    startIndex: (current - 1) * pageSize,
    selected,
    toggle: toggleSelect,
    toggleSelect,
    toggleAll,
    selectAllFiltered: () => setSelected(new Set(sorted.map((r) => r.id))),
    clearSelection: () => setSelected(new Set()),
    resetPage: () => setPage(1),
  };
}
