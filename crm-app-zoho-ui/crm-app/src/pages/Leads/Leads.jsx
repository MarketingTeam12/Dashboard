import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown, ChevronLeft, ChevronRight, Filter, LayoutGrid, List, MoreHorizontal, Phone, Search, Table2,
  ArrowDownUp, X, Columns3, Clock3, Map as MapIcon,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { todayISO } from '../../utils/calculations';
import { useUrlActions } from '../../components/common/hooks';
import {
  CURRENT_USER_ID, FIELD_FILTERS, SYSTEM_FILTERS, VIEW_TABS, WEBSITE_ACTIVITY, leadCategory, leadSource,
} from './leadFilters';

const TAG_STYLE = {
  'Invalid Number': { bg: '#E5D2F2', fg: '#fff', fill: '#B88AD6' },
  'Not contactable': { bg: '#A34A5C', fg: '#fff' },
  Junk: { bg: '#E8322B', fg: '#fff' },
  'Job seeking': { bg: '#2A2BD1', fg: '#fff' },
  Duplicate: { bg: '#E8322B', fg: '#fff' },
};
const STATUS_STYLE = {
  Assigned: { bg: '#1DB54A', fg: '#fff' },
  New: { bg: '#2F7BF5', fg: '#fff' },
  Contacted: { bg: '#1DB54A', fg: '#fff' },
  Qualified: { bg: '#F59E0B', fg: '#fff' },
  Proposal: { bg: '#F43F5E', fg: '#fff' },
  Converted: { bg: '#8E3CF2', fg: '#fff' },
};
const SOURCE_STYLE = {
  Justdial: { bg: '#4AA8F0', fg: '#fff', label: 'JD' },
  Website: { bg: '#A9B8F5', fg: '#fff' },
  'Existing Client': { bg: '#7A2BD6', fg: '#fff' },
  'Database call': { bg: '#BFE04A', fg: '#2B3A00' },
};

function Pill({ s, children }) {
  return (
    <span className="inline-flex items-center h-[18px] px-2 rounded-full text-[10.5px] font-semibold whitespace-nowrap" style={{ background: s.bg, color: s.fg }}>
      {children}
    </span>
  );
}
function TagPill({ tag }) {
  const s = TAG_STYLE[tag];
  if (!s) return null;
  return (
    <span className="inline-flex items-center h-[17px] px-2 text-[10.5px] font-semibold whitespace-nowrap" style={{ background: s.bg, color: s.fg, clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%)', paddingRight: 10 }}>
      {tag}
    </span>
  );
}

function Section({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-1 px-2 py-1.5 text-[12.5px] font-semibold text-[#1F2A44] text-left">
        <ChevronRight size={12} className={`transition-transform ${open ? 'rotate-90' : ''}`} />
        {title}
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

const cbRow = 'flex items-center gap-2 pl-6 pr-2 py-[3px] text-[12px] text-[#2A3350] hover:bg-[#F1F4FA] cursor-pointer leading-tight';

export default function Leads() {
  const { leads = [], userName } = useCRM();
  const navigate = useNavigate();

  const [tab, setTab] = useState('All Leads');
  const [search, setSearch] = useState('');          // table-level search
  const [panelSearch, setPanelSearch] = useState(''); // "Filter Leads by" search box
  const [sysSel, setSysSel] = useState(new Set());
  const [webSel, setWebSel] = useState(new Set());
  const [fieldSel, setFieldSel] = useState({});       // { 'City': Set(['Chennai']) }
  const [openField, setOpenField] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [sortNewest, setSortNewest] = useState(true);
  const [showFilterPanel, setShowFilterPanel] = useState(true);

  useUrlActions({ onOpen: (id) => navigate(`/leads/${id}`) });

  // 1) view tab
  const byTab = useMemo(() => leads.filter((l) => {
    if (tab === "Today's Leads") return l.createdOn === todayISO();
    if (tab === 'My Leads') return l.ownerId === CURRENT_USER_ID;
    if (tab === 'Chennai') return (l.city || '').toLowerCase() === 'chennai';
    if (tab === 'Delhi') return (l.city || '').toLowerCase() === 'delhi';
    if (tab === 'Website') return leadSource(l) === 'Website';
    return true;
  }), [leads, tab]);

  // 2) panel filters + search
  const filtered = useMemo(() => {
    let rows = byTab.filter((l) => {
      if (sysSel.has('Touched Records') && !l.touched) return false;
      if (sysSel.has('Untouched Records') && l.touched) return false;
      for (const f of FIELD_FILTERS) {
        const sel = fieldSel[f.label];
        if (sel && sel.size && !sel.has(f.get(l, userName))) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        if (![l.name, l.mobile, l.phone, l.city, l.remarks, l.company].some((v) => String(v || '').toLowerCase().includes(q))) return false;
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      const x = String(a.createdOn || ''); const y = String(b.createdOn || '');
      return sortNewest ? y.localeCompare(x) : x.localeCompare(y);
    });
    return rows;
  }, [byTab, sysSel, fieldSel, search, sortNewest, userName]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const cur = Math.min(page, pageCount);
  const rows = filtered.slice((cur - 1) * pageSize, cur * pageSize);
  const from = filtered.length ? (cur - 1) * pageSize + 1 : 0;
  const to = Math.min(cur * pageSize, filtered.length);

  const toggle = (setter) => (name) => setter((p) => { const n = new Set(p); n.has(name) ? n.delete(name) : n.add(name); return n; });
  const toggleField = (label, val) => setFieldSel((p) => {
    const n = new Set(p[label] || []); n.has(val) ? n.delete(val) : n.add(val);
    return { ...p, [label]: n };
  });
  const activeCount = sysSel.size + webSel.size + Object.values(fieldSel).reduce((a, s) => a + s.size, 0);
  const clearAll = () => { setSysSel(new Set()); setWebSel(new Set()); setFieldSel({}); };

  const q = panelSearch.trim().toLowerCase();
  const match = (t) => !q || t.toLowerCase().includes(q);

  const allChecked = rows.length > 0 && rows.every((r) => selected.has(r.id));

  return (
    <div className="-mx-3 sm:-mx-[18px] -mt-2.5 bg-white min-h-[calc(100vh-56px)]">
      {/* ---- view tabs ---- */}
      <div className="flex items-center gap-5 px-4 h-[34px] border-b border-line text-[12px]">
        {VIEW_TABS.map((t) => (
          <button key={t} type="button" onClick={() => { setTab(t); setPage(1); }}
            className={`h-full ${tab === t ? 'font-semibold text-[#1F2A44] border-b-2 border-[#1F2A44]' : 'text-[#5B6684] hover:text-[#1F2A44]'}`}>
            {t}
          </button>
        ))}
        <MoreHorizontal size={14} className="text-[#5B6684]" />
      </div>

      {/* ---- toolbar ---- */}
      <div className="flex items-center gap-2 px-4 h-[44px]">
        <button type="button" onClick={() => setShowFilterPanel((s) => !s)} className="h-7 px-2.5 rounded border border-[#D5DBE8] bg-white text-[12px] inline-flex items-center gap-1.5 hover:bg-[#F3F6FB]">
          <Filter size={13} /> Filter {activeCount > 0 && <span className="text-[10px] bg-[#2F55D4] text-white rounded-full px-1.5">{activeCount}</span>}
        </button>
        <button type="button" onClick={() => setSortNewest((s) => !s)} className="h-7 px-2.5 rounded border border-[#D5DBE8] bg-white text-[12px] inline-flex items-center gap-1.5 hover:bg-[#F3F6FB]">
          <ArrowDownUp size={13} /> Sort
          <X size={11} className="ml-1 text-[#5B6684]" />
        </button>
        <div className="flex items-center gap-1.5 text-[#5B6684] ml-1">
          <List size={16} className="text-[#2F55D4]" /><Columns3 size={16} /><Table2 size={16} /><Clock3 size={15} /><LayoutGrid size={15} /><ChevronDown size={13} />
        </div>
        <div className="relative ml-3 hidden md:block">
          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#8B95AE]" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search leads"
            className="h-7 w-[200px] pl-7 pr-2 rounded border border-[#D5DBE8] text-[12px] focus:outline-none focus:border-[#2F55D4]" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex">
            <button type="button" onClick={() => navigate('/leads/new')} className="h-7 px-3 rounded-l bg-[#2F55D4] hover:bg-[#2748B8] text-white text-[12px] font-semibold">Create Lead</button>
            <button type="button" className="h-7 w-6 rounded-r bg-[#2F55D4] hover:bg-[#2748B8] border-l border-white/30 text-white flex items-center justify-center"><ChevronDown size={12} /></button>
          </div>
          <button type="button" className="h-7 px-3 rounded border border-[#D5DBE8] bg-white text-[12px] inline-flex items-center gap-1.5 hover:bg-[#F3F6FB]"><MapIcon size={12} /> Map View <ChevronDown size={11} /></button>
          <button type="button" className="h-7 w-8 rounded border border-[#D5DBE8] bg-white flex items-center justify-center hover:bg-[#F3F6FB]"><MoreHorizontal size={14} /></button>
        </div>
      </div>

      <div className="flex gap-2 px-2 pb-2">
        {/* ---- left filter panel ---- */}
        {showFilterPanel && (
          <aside className="w-[200px] shrink-0 border border-[#1F2A44] rounded-[3px] bg-white h-[calc(100vh-150px)] overflow-y-auto thin-scroll">
            <Section title={<span>Saved Filters <span className="ml-1 text-[10px] border border-[#C9D1E3] rounded px-1">1</span></span>} defaultOpen={false}>
              <div className={cbRow}><span className="text-[#5B6684]">Untouched this week</span></div>
            </Section>
            <div className="px-2 pt-2 pb-1 text-[12.5px] font-semibold text-[#1F2A44] flex items-center justify-between">
              Filter Leads by
              {activeCount > 0 && <button type="button" onClick={clearAll} className="text-[11px] font-normal text-[#2F55D4] hover:underline">Clear</button>}
            </div>
            <div className="px-2 pb-2">
              <div className="relative">
                <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#8B95AE]" />
                <input value={panelSearch} onChange={(e) => setPanelSearch(e.target.value)} placeholder="Search"
                  className="w-full h-7 pl-7 pr-2 rounded border border-[#D5DBE8] text-[12px] focus:outline-none focus:border-[#2F55D4]" />
              </div>
            </div>

            <Section title="System Defined Filters">
              {SYSTEM_FILTERS.filter(match).map((f) => (
                <label key={f} className={cbRow}>
                  <input type="checkbox" className="accent-[#2F55D4]" checked={sysSel.has(f)} onChange={() => { toggle(setSysSel)(f); setPage(1); }} />
                  {f}
                </label>
              ))}
            </Section>
            <Section title="Website Activity">
              {WEBSITE_ACTIVITY.filter(match).map((f) => (
                <label key={f} className={cbRow}>
                  <input type="checkbox" className="accent-[#2F55D4]" checked={webSel.has(f)} onChange={() => toggle(setWebSel)(f)} />
                  {f}
                </label>
              ))}
            </Section>
            <Section title="Filter By Fields">
              {FIELD_FILTERS.filter((f) => match(f.label)).map((f) => {
                const counts = {};
                byTab.forEach((l) => { const v = f.get(l, userName); if (v) counts[v] = (counts[v] || 0) + 1; });
                const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
                const isOpen = openField === f.label;
                const sel = fieldSel[f.label];
                return (
                  <div key={f.label}>
                    <button type="button" onClick={() => setOpenField(isOpen ? null : f.label)}
                      className="w-full flex items-center justify-between pl-6 pr-2 py-[3px] text-[12px] text-[#2A3350] hover:bg-[#F1F4FA] text-left leading-tight">
                      <span>{f.label}{sel?.size ? <b className="ml-1 text-[#2F55D4]">({sel.size})</b> : null}</span>
                      <ChevronDown size={11} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className="pl-8 pr-2 pb-1">
                        {entries.length === 0 && <div className="text-[11px] text-[#8B95AE] py-1">No values</div>}
                        {entries.map(([v, c]) => (
                          <label key={v} className="flex items-center gap-2 py-[2px] text-[12px] text-[#2A3350] cursor-pointer">
                            <input type="checkbox" className="accent-[#2F55D4]" checked={!!sel?.has(v)} onChange={() => { toggleField(f.label, v); setPage(1); }} />
                            <span className="flex-1 truncate">{v}</span><span className="text-[#8B95AE] text-[11px]">{c}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </Section>
          </aside>
        )}

        {/* ---- table ---- */}
        <div className="flex-1 min-w-0 flex flex-col border-t border-[#E3E8F2]">
          <div className="overflow-auto thin-scroll h-[calc(100vh-176px)]">
            <table className="w-full text-[12px] border-collapse min-w-[1100px]">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="text-left text-[#1F2A44]">
                  <th className="w-8 px-2 h-9 border-b border-[#E3E8F2]"><input type="checkbox" className="accent-[#2F55D4]" checked={allChecked}
                    onChange={() => setSelected(allChecked ? new Set() : new Set(rows.map((r) => r.id)))} /></th>
                  {['Lead Name', 'Created Time', 'Category', 'Mobile', 'City', 'Remarks', 'Tags', 'Lead Status', 'Lead Source', 'Lead Owner'].map((h) => (
                    <th key={h} className="px-2 h-9 font-medium whitespace-nowrap border-b border-[#E3E8F2]">
                      {h}{h === 'Created Time' && <span className="ml-1 text-[10px]">*</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((l) => {
                  const src = leadSource(l);
                  const ss = SOURCE_STYLE[src];
                  const st = STATUS_STYLE[l.status];
                  return (
                    <tr key={l.id} className="hover:bg-[#F6F8FD] border-b border-[#EEF1F7] cursor-pointer" onClick={() => navigate(`/leads/${l.id}`)}>
                      <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" className="accent-[#2F55D4]" checked={selected.has(l.id)} onChange={() => toggle(setSelected)(l.id)} />
                      </td>
                      <td className="px-2 py-2 text-[#1F2A44] font-medium whitespace-nowrap">{l.name}</td>
                      <td className="px-2 py-2 whitespace-nowrap text-[#2A3350]">{l.createdTime}</td>
                      <td className="px-2 py-2 text-[#2A3350] max-w-[170px]">{leadCategory(l)}</td>
                      <td className="px-2 py-2 whitespace-nowrap text-[#2A3350]">
                        {l.mobile || l.phone}
                        <span className="inline-flex ml-1.5 align-middle h-4 w-4 rounded-full bg-[#1DB54A] items-center justify-center"><Phone size={9} className="text-white" /></span>
                      </td>
                      <td className="px-2 py-2 text-[#2A3350]">{l.city}</td>
                      <td className="px-2 py-2 text-[#2A3350] max-w-[220px] truncate">{l.remarks}</td>
                      <td className="px-2 py-2"><TagPill tag={l.tag} /></td>
                      <td className="px-2 py-2">{st && <Pill s={st}>{l.status}</Pill>}</td>
                      <td className="px-2 py-2">{ss ? <Pill s={ss}>{ss.label || src}</Pill> : <span className="text-[#2A3350]">{src}</span>}</td>
                      <td className="px-2 py-2 text-[#2A3350] whitespace-nowrap">{userName(l.ownerId)}</td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr><td colSpan={11} className="text-center py-16 text-[#8B95AE]">No records found</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ---- footer ---- */}
          <div className="flex items-center justify-between h-9 px-3 border-t border-[#E3E8F2] text-[12px] text-[#2A3350]">
            <span>Total Records <b>{filtered.length}</b></span>
            <div className="flex items-center gap-3">
              <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="h-6 border border-[#D5DBE8] rounded text-[12px] bg-white">
                {[10, 20, 30, 50, 100].map((n) => <option key={n} value={n}>{n} Records Per Page</option>)}
              </select>
              <button type="button" disabled={cur <= 1} onClick={() => setPage(cur - 1)} className="disabled:opacity-30"><ChevronLeft size={15} /></button>
              <b>{from} to {to}</b>
              <button type="button" disabled={cur >= pageCount} onClick={() => setPage(cur + 1)} className="disabled:opacity-30"><ChevronRight size={15} /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
