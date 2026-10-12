import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownUp, Check, ChevronLeft, ChevronRight, Columns3, Eye, Info, MoreVertical, Plus, RotateCw, Settings, SlidersHorizontal, X,
} from 'lucide-react';
import Dropdown, { MenuDivider } from '../../../components/common/Dropdown';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import { exportCSV } from '../../../utils/exportCSV';
import { fmtDateTime, fmtDMY, fmtMoney, parseAnyDate, splitRelated } from '../homeConfig';
import { RelatedIcon, SourcePill, StagePill, TagChip, WidgetLoader } from './cells';
import ManageColumnsModal from './ManageColumnsModal';

const DEFAULT_WIDTH = { link: 160, customLink: 170, date: 150, datetime: 170, currency: 120, stage: 160, tag: 300, source: 160, related: 150, account: 170, text: 150, bool: 100 };
const GUTTER = 72; // left column that holds the row hover actions
const SETTINGS_COL = 34;

function compare(a, b) {
  if (a === b) return 0;
  if (a === '' || a == null) return 1;
  if (b === '' || b == null) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  const da = parseAnyDate(a);
  const db = parseAnyDate(b);
  if (da && db && /\d/.test(String(a)) && /[-/]/.test(String(a))) return da - db;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

const menuItem = 'w-full flex items-center gap-2.5 px-3 py-[7px] text-[14px] text-left text-ink hover:bg-[#F1F3FA] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent';

/**
 * Generic Home page list component.
 * props:
 *  component  – stored config (title, columns, sort, pageSize, wrap, widths)
 *  allColumns – column definitions available for this component
 *  rows       – records after criteria filtering
 *  ctx        – CRM context (lookups for value())
 *  loading, onRefresh, onUpdate(patch), onRemove, onEditComponent?, onAddRecord?
 *  onOpen(row, colKey) – navigation for link-type cells
 *  rowActions(row) – JSX shown in the left gutter on hover
 */
export default function HomeWidget({
  component, allColumns, rows, ctx, loading, onRefresh, onUpdate, onRemove, onEditComponent, onAddRecord,
  onOpen, rowActions, emptyText = 'No records found',
}) {
  const [page, setPage] = useState(1);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(component.title);
  const [nameError, setNameError] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [manageCols, setManageCols] = useState(false);
  const [liveWidths, setLiveWidths] = useState(null);
  const bodyRef = useRef(null);

  const colByKey = useMemo(() => Object.fromEntries(allColumns.map((c) => [c.key, c])), [allColumns]);
  const columns = useMemo(() => component.columns.map((k) => colByKey[k]).filter(Boolean), [component.columns, colByKey]);
  const widths = liveWidths || component.widths || {};
  const widthOf = (c) => widths[c.key] || DEFAULT_WIDTH[c.type] || 150;
  const tableWidth = GUTTER + columns.reduce((s, c) => s + widthOf(c), 0) + SETTINGS_COL;

  const sorted = useMemo(() => {
    const s = component.sort;
    if (!s || !colByKey[s.key]) return rows;
    const col = colByKey[s.key];
    const dir = s.dir === 'desc' ? -1 : 1;
    return [...rows].sort((a, b) => dir * compare(col.value(a, ctx), col.value(b, ctx)));
  }, [rows, component.sort, colByKey, ctx]);

  const pageSize = component.pageSize || 10;
  const total = sorted.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  useEffect(() => { if (page > pages) setPage(pages); }, [page, pages]);
  const start = (page - 1) * pageSize;
  const pageRows = sorted.slice(start, start + pageSize);
  useEffect(() => { bodyRef.current?.scrollTo?.({ top: 0 }); }, [page]);

  // ----- display name -----
  const startRename = () => { setNameDraft(component.title); setNameError(''); setEditingName(true); };
  const saveName = () => {
    const v = nameDraft.trim();
    if (!v) return setNameError('Display name cannot be empty.');
    if (v.length > 50) return setNameError('Use 50 characters or fewer.');
    onUpdate({ title: v });
    setEditingName(false);
  };

  // ----- export -----
  const doExport = () => {
    exportCSV(component.title.replace(/[^\w\- ]+/g, '').trim() || 'export', sorted, columns.map((c) => ({
      label: c.label,
      value: (r) => {
        const v = c.value(r, ctx);
        if (c.type === 'date') return fmtDMY(v);
        if (c.type === 'datetime') return fmtDateTime(v);
        return v;
      },
    })));
  };

  // ----- column resize -----
  const startResize = (e, col) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startW = widthOf(col);
    let latest = { ...(component.widths || {}) };
    const move = (ev) => {
      const w = Math.max(70, Math.min(600, startW + ev.clientX - startX));
      latest = { ...latest, [col.key]: Math.round(w) };
      setLiveWidths(latest);
    };
    const up = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
      document.body.style.cursor = '';
      onUpdate({ widths: latest });
      setLiveWidths(null);
    };
    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  };
  const hasCustomWidths = Object.keys(component.widths || {}).length > 0;

  // ----- cells -----
  const wrapCls = component.wrap ? 'whitespace-normal break-words' : 'whitespace-nowrap overflow-hidden text-ellipsis';
  const renderCell = (c, r) => {
    const v = c.value(r, ctx);
    switch (c.type) {
      case 'link':
      case 'customLink':
        return (
          <button type="button" onClick={() => onOpen?.(r, c.key)} className={`text-left max-w-full ${wrapCls} group-hover/row:text-[#4F55C9] hover:underline`}>
            {v === '' ? '—' : String(v)}
          </button>
        );
      case 'date': return fmtDMY(v);
      case 'datetime': return fmtDateTime(v);
      case 'currency': return v === '' ? '' : fmtMoney(v);
      case 'stage': return <StagePill value={v} />;
      case 'tag': return <TagChip value={v} />;
      case 'source': return <SourcePill value={v} />;
      case 'related': {
        const rel = splitRelated(r.relatedTo);
        if (!rel.name) return '';
        return (
          <span className="flex items-start gap-1.5 min-w-0 max-w-full">
            <span className="mt-[2px] shrink-0"><RelatedIcon module={rel.module} /></span>
            <button type="button" onClick={() => onOpen?.(r, c.key)} className={`text-left min-w-0 ${wrapCls} group-hover/row:text-[#4F55C9] hover:underline`}>{rel.name}</button>
          </span>
        );
      }
      case 'account':
        return v ? <button type="button" onClick={() => onOpen?.(r, c.key)} className={`text-left ${wrapCls} hover:text-[#4F55C9] hover:underline`}>{v}</button> : '';
      default:
        return v === '' || v == null ? '' : String(v);
    }
  };

  const sort = component.sort;

  return (
    <section className="group/w bg-white rounded-[6px] shadow-[0_0_0_1px_rgba(16,24,64,0.04)] flex flex-col h-[380px] min-w-0" aria-label={component.title}>
      {/* title row */}
      <div className="flex items-center justify-between gap-2 px-4 pt-4 h-[44px]">
        {editingName ? (
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <input autoFocus value={nameDraft} maxLength={60} aria-label="Display name"
              onChange={(e) => { setNameDraft(e.target.value); setNameError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
              className={`h-8 px-2.5 text-[14px] font-semibold text-[#1F2329] border rounded min-w-0 w-[220px] focus:outline-none ${nameError ? 'border-danger' : 'border-[#4F55C9]'}`} />
            <button type="button" onClick={saveName} className="h-8 w-8 rounded bg-[#4F55C9] text-white flex items-center justify-center" aria-label="Save name"><Check size={14} /></button>
            <button type="button" onClick={() => setEditingName(false)} className="h-8 w-8 rounded border border-line text-ink-500 flex items-center justify-center" aria-label="Cancel"><X size={14} /></button>
            {nameError && <span className="text-[12.5px] text-danger-700 truncate">{nameError}</span>}
          </div>
        ) : (
          <div className="flex items-center gap-2.5 min-w-0">
            <h2 className="text-[16px] font-semibold text-[#1F2329] truncate">{component.title}</h2>
            <button type="button" onClick={onRefresh} title="Refresh"
              className="text-[#4B4F5C] hover:text-[#4F55C9] md:opacity-0 md:group-hover/w:opacity-100 focus:opacity-100 transition-opacity" aria-label={`Refresh ${component.title}`}>
              <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        )}
        {!editingName && (
          <Dropdown align="right" width={200}
            trigger={(open) => (
              <button type="button" aria-label={`${component.title} options`}
                className={`h-7 w-7 -mr-1.5 rounded-full flex items-center justify-center text-[#1F2329] hover:bg-[#EEF0F7] ${open ? 'bg-[#EEF0F7] opacity-100' : 'md:opacity-0 md:group-hover/w:opacity-100 focus:opacity-100'}`}>
                <MoreVertical size={16} />
              </button>
            )}>
            {(close) => (
              <>
                <button type="button" className={menuItem} onClick={() => { close(); startRename(); }}>
                  <span className="flex-1">Edit Display Name</span>
                  <span title="The name shown on this component in the Home page."><Info size={14} className="text-ink-400" /></span>
                </button>
                {onEditComponent && <button type="button" className={menuItem} onClick={() => { close(); onEditComponent(); }}>Edit Component</button>}
                <button type="button" className={menuItem} onClick={() => { close(); doExport(); }} disabled={!total}>Export</button>
                <button type="button" className={menuItem} onClick={() => { close(); setConfirmRemove(true); }}>Remove</button>
              </>
            )}
          </Dropdown>
        )}
      </div>

      {/* sort row */}
      <div className="flex items-center gap-3 px-4 h-[28px]">
        <Dropdown width={250} trigger={
          <button type="button" className={`inline-flex items-center gap-1 text-[14px] ${sort ? 'text-[#4F55C9] font-medium' : 'text-[#1F2329]'} hover:text-[#4F55C9]`}>
            <ArrowDownUp size={13} />
            {sort ? `Sort: ${colByKey[sort.key]?.label || ''} ${sort.dir === 'desc' ? '↓' : '↑'}` : 'Sort'}
          </button>
        }>
          {(close) => <SortPanel columns={columns} sort={sort} onApply={(s) => { onUpdate({ sort: s }); setPage(1); close(); }} onCancel={close} />}
        </Dropdown>
        {onAddRecord && (
          <button type="button" onClick={onAddRecord} className="inline-flex items-center gap-1 text-[14px] text-[#1F2329] hover:text-[#4F55C9]">
            <Plus size={14} /> New Record
          </button>
        )}
      </div>

      {/* table */}
      <div className="relative flex-1 min-h-0 mt-1.5">
        {loading ? <WidgetLoader /> : (
          <div ref={bodyRef} className="home-scroll h-full overflow-auto">
            <table className="border-collapse text-[14px] text-[#1F2329]" style={{ tableLayout: 'fixed', width: tableWidth, minWidth: '100%' }}>
              <colgroup>
                <col style={{ width: GUTTER }} />
                {columns.map((c) => <col key={c.key} style={{ width: widthOf(c) }} />)}
                <col style={{ width: SETTINGS_COL }} />
              </colgroup>
              <thead className="sticky top-0 z-[2] bg-white">
                <tr className="h-[34px] text-[13.5px]">
                  <th className="border-y border-[#E0E1E5]" />
                  {columns.map((c) => (
                    <th key={c.key} className={`relative border-y border-[#E0E1E5] px-2.5 font-semibold text-left ${c.align === 'right' ? 'text-right' : ''}`}>
                      <span className="inline-flex items-center gap-1 max-w-full truncate">
                        <span className="truncate">{c.label}</span>
                        {c.info && <span title={c.info}><Info size={12} className="text-[#7A7F8C] shrink-0" /></span>}
                      </span>
                      <span role="separator" aria-label={`Resize ${c.label}`} onMouseDown={(e) => startResize(e, c)}
                        className="absolute right-0 top-[6px] bottom-[6px] w-[5px] cursor-col-resize flex justify-end">
                        <span className="w-px h-full bg-[#E0E1E5]" />
                      </span>
                    </th>
                  ))}
                  <th className="sticky right-0 bg-white border-y border-l border-[#E0E1E5] p-0">
                    <Dropdown align="right" width={220}
                      trigger={(open) => (
                        <button type="button" title="Column settings" aria-label="Column settings"
                          className={`h-[26px] w-[26px] mx-auto rounded flex items-center justify-center text-[#1F2329] hover:border hover:border-[#1F2329] ${open ? 'border border-[#1F2329]' : ''}`}>
                          <SlidersHorizontal size={14} />
                        </button>
                      )}>
                      {(close) => (
                        <>
                          <button type="button" className={menuItem} onClick={() => { close(); setManageCols(true); }}>
                            <Settings size={14} className="text-ink-500" /> Manage Columns
                          </button>
                          <button type="button" className={menuItem} disabled={!hasCustomWidths} onClick={() => { close(); onUpdate({ widths: {} }); }}>
                            <Columns3 size={14} className="text-ink-500" /> Reset Column Size
                          </button>
                          <MenuDivider />
                          <ViewModeItem wrap={component.wrap} onChange={(wrap) => { onUpdate({ wrap }); close(); }} />
                        </>
                      )}
                    </Dropdown>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r) => (
                  <tr key={r.id} className="group/row border-b border-[#EEF0F4] hover:bg-[#F4F6FB] align-top">
                    <td className="px-2.5 py-2.5">
                      <div className="flex items-center justify-end gap-2 h-[20px] md:invisible md:group-hover/row:visible focus-within:visible">
                        {rowActions?.(r)}
                      </div>
                    </td>
                    {columns.map((c) => (
                      <td key={c.key} className={`px-2.5 py-2.5 leading-[20px] ${c.align === 'right' ? 'text-right' : ''} ${wrapCls}`}>
                        {renderCell(c, r)}
                      </td>
                    ))}
                    <td />
                  </tr>
                ))}
              </tbody>
            </table>
            {!total && <div className="absolute inset-x-0 top-[44px] bottom-0 flex items-center justify-center text-[14px] text-ink-400">{emptyText}</div>}
          </div>
        )}
      </div>

      {/* footer */}
      <div className="flex items-center justify-between px-4 h-[40px] border-t border-[#EEF0F4] text-[14px] text-[#1F2329] shrink-0">
        <span>Total Records <b className="font-semibold">{loading ? '…' : total}</b></span>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Previous page" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}
            className="h-6 w-6 rounded flex items-center justify-center text-[#1F2329] hover:bg-[#EEF0F7] disabled:text-[#B8BCC8] disabled:hover:bg-transparent"><ChevronLeft size={15} /></button>
          <span className="font-semibold tabular-nums">{total ? `${start + 1} to ${Math.min(start + pageSize, total)}` : '0 to 0'}</span>
          <button type="button" aria-label="Next page" disabled={page >= pages || loading} onClick={() => setPage((p) => p + 1)}
            className="h-6 w-6 rounded flex items-center justify-center text-[#1F2329] hover:bg-[#EEF0F7] disabled:text-[#B8BCC8] disabled:hover:bg-transparent"><ChevronRight size={15} /></button>
        </div>
      </div>

      <ConfirmDialog open={confirmRemove} onClose={() => setConfirmRemove(false)} title="Remove component?" confirmLabel="Remove"
        message={`"${component.title}" will be removed from this Home page. You can add it again from Add Component.`}
        onConfirm={onRemove} />
      <ManageColumnsModal open={manageCols} onClose={() => setManageCols(false)} allColumns={allColumns} selected={component.columns}
        onSave={(cols) => { onUpdate({ columns: cols, sort: cols.includes(component.sort?.key) ? component.sort : null }); setManageCols(false); }} />
    </section>
  );
}

function SortPanel({ columns, sort, onApply, onCancel }) {
  const [key, setKey] = useState(sort?.key || columns[0]?.key || '');
  const [dir, setDir] = useState(sort?.dir || 'asc');
  return (
    <div className="px-3 py-2 space-y-2.5">
      <label className="block">
        <span className="block text-[14px] font-medium text-ink-500 mb-1">Sort by</span>
        <select className="input h-8 text-[14px]" value={key} onChange={(e) => setKey(e.target.value)}>
          {columns.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
      </label>
      <div className="flex gap-4 text-[14px] text-ink">
        {[['asc', 'Ascending'], ['desc', 'Descending']].map(([v, l]) => (
          <label key={v} className="inline-flex items-center gap-1.5 cursor-pointer">
            <input type="radio" name="sortdir" checked={dir === v} onChange={() => setDir(v)} className="accent-[#4F55C9]" />{l}
          </label>
        ))}
      </div>
      <div className="flex items-center justify-between pt-1">
        <button type="button" className="text-[14px] text-ink-500 hover:text-danger-700 disabled:opacity-40" disabled={!sort} onClick={() => onApply(null)}>Clear sort</button>
        <div className="flex gap-1.5">
          <button type="button" className="h-8 px-3 rounded border border-line text-[14px] hover:bg-page" onClick={onCancel}>Cancel</button>
          <button type="button" className="h-8 px-3 rounded bg-[#4F55C9] text-white text-[14px] hover:bg-[#4247B5] disabled:opacity-50" disabled={!key} onClick={() => onApply({ key, dir })}>Apply</button>
        </div>
      </div>
    </div>
  );
}

function ViewModeItem({ wrap, onChange }) {
  const [open, setOpen] = useState(false);
  const [side, setSide] = useState('left');
  const ref = useRef(null);
  const show = () => {
    const r = ref.current?.getBoundingClientRect();
    setSide(r && r.right + 170 > window.innerWidth ? 'left' : 'right');
    setOpen(true);
  };
  return (
    <div ref={ref} className="relative" onMouseEnter={show} onMouseLeave={() => setOpen(false)}>
      <button type="button" className={menuItem} onClick={() => (open ? setOpen(false) : show())} aria-haspopup="menu" aria-expanded={open}>
        <Eye size={14} className="text-ink-500" />
        <span className="flex-1">View Mode</span>
        <span className="font-semibold text-[12.5px]">{wrap ? 'Wrap Text' : 'Clip Text'}</span>
        <ChevronRight size={13} className="text-ink-500" />
      </button>
      {open && (
        <div role="menu" className={`absolute top-0 ${side === 'left' ? 'right-full mr-1' : 'left-full ml-1'} w-[150px] bg-white border border-line rounded-lg shadow-pop py-1.5`}>
          {[[true, 'Wrap Text'], [false, 'Clip Text']].map(([v, l]) => (
            <button key={l} type="button" role="menuitemradio" aria-checked={wrap === v} className={menuItem} onClick={() => onChange(v)}>
              <span className="flex-1">{l}</span>{wrap === v && <Check size={14} className="text-[#4F55C9]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
