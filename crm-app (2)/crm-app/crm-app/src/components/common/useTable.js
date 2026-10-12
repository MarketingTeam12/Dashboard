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

  // Synchronously filter selections against current rows so count is always in sync immediately
  const validIds = useMemo(() => new Set(rows.map((r) => r.id)), [rows]);

  const validSelected = useMemo(() => {
    if (!selected.size) return selected;
    const next = [...selected].filter((id) => validIds.has(id));
    return next.length === selected.size ? selected : new Set(next);
  }, [selected, validIds]);

  // Also prune state when rows change so stale IDs don't resurrect
  useEffect(() => {
    setSelected((s) => {
      if (!s.size) return s;
      const next = new Set([...s].filter((id) => validIds.has(id)));
      return next.size === s.size ? s : next;
    });
  }, [validIds]);

  const pageRows = useMemo(
    () => sorted.slice((current - 1) * pageSize, current * pageSize),
    [sorted, current, pageSize]
  );

  const pageSelectedCount = useMemo(
    () => pageRows.reduce((acc, r) => acc + (validSelected.has(r.id) ? 1 : 0), 0),
    [pageRows, validSelected]
  );

  const allChecked = pageRows.length > 0 && pageSelectedCount === pageRows.length;
  const someChecked = pageSelectedCount > 0 && !allChecked;

  const clearSelection = () => setSelected(new Set());

  return {
    sort,
    setSort,
    onSort: (key) =>
      setSort((s) =>
        s?.key === key ? (s.dir === 'asc' ? { key, dir: 'desc' } : null) : { key, dir: 'asc' }
      ),
    page: current,
    setPage,
    pageSize,
    setPageSize: (n) => {
      setPageSize(n);
      setPage(1);
    },
    pageRows,
    sorted,
    total,
    totalRows: total,
    startIndex: (current - 1) * pageSize,
    selected: validSelected,
    selectedCount: validSelected.size,
    pageSelectedCount,
    allChecked,
    someChecked,
    toggle: (id) =>
      setSelected((s) => {
        const n = new Set([...s].filter((item) => validIds.has(item)));
        if (n.has(id)) n.delete(id);
        else if (validIds.has(id)) n.add(id);
        return n;
      }),
    toggleAll: (targetRows) =>
      setSelected((s) => {
        const list = Array.isArray(targetRows) ? targetRows : pageRows;
        const ids = list.map((r) => r.id).filter((id) => validIds.has(id));
        const n = new Set([...s].filter((item) => validIds.has(item)));
        const all = ids.length > 0 && ids.every((id) => n.has(id));
        ids.forEach((id) => (all ? n.delete(id) : n.add(id)));
        return n;
      }),
    selectAllFiltered: () => setSelected(new Set(sorted.map((r) => r.id))),
    clearSelection,
    deselectAll: clearSelection,
    resetPage: () => setPage(1),
  };
}

