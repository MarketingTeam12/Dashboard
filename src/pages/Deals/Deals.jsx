import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarRange, ChevronDown, Clock3, Coins, Download, Eye, Pencil, Plus, Trash2, Trophy, UserCog, XCircle, Search } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import FilterBar, { MoreFilters, SelectField } from '../../components/common/FilterBar';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import useTable from '../../components/common/useTable';
import StatusBadge, { badgeTone } from '../../components/common/StatusBadge';
import { UserAvatar } from '../../components/common/Avatar';
import ActionMenu from '../../components/common/ActionMenu';
import FormModal from '../../components/common/RecordForm';
import ConfirmDialog from '../../components/common/ConfirmDialog';

import Dropdown, { MenuItem, MenuLabel } from '../../components/common/Dropdown';
import BulkBar, { BulkButton } from '../../components/common/BulkBar';
import { ChartView, GridView, KanbanView } from '../../components/common/Views';
import DealDetail from './DealDetail';
import { useRefresh, useUrlActions } from '../../components/common/hooks';
import { DEAL_SOURCES, DEPARTMENTS } from '../../data/seedData';
import {
  OPEN_STAGES, STAGES, STAGE_COLORS, STAGE_PROBABILITY, dealKpis, fmtCompact, fmtDate, fmtINR, inRange, isOpen, sumBy, todayISO, trend,
} from '../../utils/calculations';
import { exportCSV } from '../../utils/exportCSV';

const DEFAULT_RANGE = { from: '2026-01-01', to: '2026-12-31' };
const EMPTY = { stage: '', owner: '', account: '', source: '', department: '', minAmt: '', maxAmt: '', closeFrom: '', closeTo: '' };
const BAR = { Qualification: '#A970F5', 'Needs Analysis': '#FF7B3A', Proposal: '#2F7BF5', Negotiation: '#FFBB28', 'Closed Won': '#12C26B', 'Closed Lost': '#FF3344' };

export function stagePatch(deal, stage) {
  const patch = { stage, probability: STAGE_PROBABILITY[stage] };
  if (stage === 'Closed Lost') patch.lostAtStage = isOpen(deal) ? deal.stage : deal.lostAtStage || 'Qualification';
  else patch.lostAtStage = '';
  return patch;
}

function Probability({ deal }) {
  const c = BAR[deal.stage];
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-[54px] h-[14px] rounded-[3px] bg-[#EEF2F8] overflow-hidden"><div className="h-full rounded-[3px]" style={{ width: `${deal.probability}%`, background: c }} /></div>
      <span className="text-[12.5px] font-medium w-9" style={{ color: deal.probability === 100 ? '#0E9F5E' : c }}>{deal.probability}%</span>
    </div>
  );
}

function monthly(rows) {
  return [6, 7, 8, 9, 10].map((m) => rows.filter((d) => Number(d.createdOn.slice(5, 7)) <= m).length + 1);
}

export default function Deals() {
  const { deals, oldDeals, accounts, contacts, users, accountName, contactName, userName, createRecord, updateRecord, deleteRecords, accountsById } = useCRM();
  const navigate = useNavigate();
  const { refreshing, refresh } = useRefresh('Deals');
  const [savedView, setSavedView] = useState('all');
  const [layout, setLayout] = useState('list');
  const [dense, setDense] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [search, setSearch] = useState('');
  const [range, setRange] = useState(DEFAULT_RANGE);
  const [f, setF] = useState(EMPTY);
  const [form, setForm] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [bulk, setBulk] = useState(null);
  const [quick, setQuick] = useState(null);

  const views = [
    { key: 'all', label: 'All Deals', test: () => true },
    { key: 'mine', label: 'My Deals', test: (d) => d.ownerId === 'u1' },
    { key: 'open', label: 'Open Deals', test: isOpen },
    { key: 'closing', label: 'Closing This Month', test: (d) => isOpen(d) && d.closingDate.slice(0, 7) === todayISO().slice(0, 7) },
    { key: 'won', label: 'Won Deals', test: (d) => d.stage === 'Closed Won' },
  ].map((v) => ({ ...v, count: deals.filter(v.test).length }));
  const viewTest = views.find((v) => v.key === savedView)?.test;

  const dealAccounts = useMemo(() => {
    const ids = new Set(deals.map((d) => d.accountId));
    return accounts.filter((a) => ids.has(a.id)).sort((a, b) => a.name.localeCompare(b.name)).map((a) => ({ value: a.id, label: a.name }));
  }, [deals, accounts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return deals.filter((d) => {
      if (viewTest && !viewTest(d)) return false;
      if (!inRange(d.createdOn, range)) return false;
      if (q && ![d.name, accountName(d.accountId), contactName(d.contactId), userName(d.ownerId)].some((v) => String(v).toLowerCase().includes(q))) return false;
      if (f.stage && d.stage !== f.stage) return false;
      if (f.owner && d.ownerId !== f.owner) return false;
      if (f.account && d.accountId !== f.account) return false;
      if (f.source && d.source !== f.source) return false;
      if (f.department && d.department !== f.department) return false;
      if (f.minAmt && d.amount < Number(f.minAmt)) return false;
      if (f.maxAmt && d.amount > Number(f.maxAmt)) return false;
      if (f.closeFrom && d.closingDate < f.closeFrom) return false;
      if (f.closeTo && d.closingDate > f.closeTo) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deals, search, range, f, savedView, accountName, contactName, userName]);

  const accessors = useMemo(() => ({ account: (d) => accountName(d.accountId), contact: (d) => contactName(d.contactId), owner: (d) => userName(d.ownerId), stage: (d) => STAGES.indexOf(d.stage) }), [accountName, contactName, userName]);
  const table = useTable(filtered, { accessors, pageSize: 10 });
  const set = (k) => (v) => { setF((s) => ({ ...s, [k]: v })); table.setPage(1); };
  const reset = () => { setF(EMPTY); setSearch(''); setRange(DEFAULT_RANGE); setSavedView('all'); };
  const moreCount = ['department', 'minAmt', 'maxAmt', 'closeFrom', 'closeTo'].filter((k) => f[k]).length;

  const k = dealKpis(filtered);
  const prev = dealKpis(oldDeals);
  const changeStage = (d, stage) => updateRecord('deals', d.id, stagePatch(d, stage));

  const ownerOptions = users.map((u) => ({ value: u.id, label: u.name }));
  const accountOptions = useMemo(() => [...accounts].sort((a, b) => a.name.localeCompare(b.name)).map((a) => ({ value: a.id, label: a.name })), [accounts]);
  const fields = [
    { name: 'name', label: 'Deal Name', required: true, span: 2 },
    { name: 'accountId', label: 'Account Name', type: 'select', options: accountOptions, required: true, onChangeEffect: (v, vals) => (contacts.find((c) => c.id === vals.contactId)?.accountId === v ? {} : { contactId: '' }) },
    { name: 'contactId', label: 'Contact Name', type: 'select', placeholder: 'No contact', options: (vals) => contacts.filter((c) => !vals.accountId || c.accountId === vals.accountId).map((c) => ({ value: c.id, label: c.name })), help: 'Contacts from the selected account' },
    { name: 'stage', label: 'Stage', type: 'select', options: STAGES, required: true, onChangeEffect: (v) => ({ probability: STAGE_PROBABILITY[v] }) },
    { name: 'probability', label: 'Probability (%)', type: 'number', min: 0, max: 100, required: true },
    { name: 'amount', label: 'Amount (₹)', type: 'number', min: 1, required: true },
    { name: 'closingDate', label: 'Closing Date', type: 'date', required: true, validate: (v, vals) => (vals.createdOn && v < vals.createdOn ? 'Closing date can’t be before the created date.' : '') },
    { name: 'ownerId', label: 'Deal Owner', type: 'select', options: ownerOptions, required: true },
    { name: 'source', label: 'Deal Source', type: 'select', options: DEAL_SOURCES, required: true },
    { name: 'department', label: 'Department', type: 'select', options: DEPARTMENTS, required: true },
    { name: 'createdOn', label: 'Created On', type: 'date', required: true },
    { name: 'description', label: 'Description', type: 'textarea', span: 2 },
  ];
  const blank = (p = {}) => ({ name: '', accountId: p.account || '', contactId: '', stage: 'Qualification', probability: 20, amount: '', closingDate: '', ownerId: 'u1', source: 'Website', department: 'Enterprise Sales', createdOn: todayISO(), description: '', lostAtStage: '' });

  useUrlActions({
    onCreate: (p) => setForm({ mode: 'create', record: blank(p) }),
    onOpen: (id) => deals.some((d) => d.id === id) && setViewing(id),
    onParams: (p) => { if (p.stage) set('stage')(p.stage); if (p.view === 'kanban') setLayout('kanban'); },
  });

  const submit = (v) => {
    const patch = { ...v, lostAtStage: v.stage === 'Closed Lost' ? v.lostAtStage || form.record.stage || 'Qualification' : '' };
    if (form.mode === 'create') { createRecord('deals', patch); table.setSort(null); table.setPage(1); setRange({ from: '', to: '' }); }
    else updateRecord('deals', form.record.id, patch);
    setForm(null);
  };

  const exportRows = (rows) => exportCSV('deals', rows, [
    { label: 'Deal Name', value: (d) => d.name }, { label: 'Account Name', value: (d) => accountName(d.accountId) }, { label: 'Contact Name', value: (d) => contactName(d.contactId) },
    { label: 'Stage', value: (d) => d.stage }, { label: 'Amount (INR)', value: (d) => d.amount }, { label: 'Closing Date', value: (d) => d.closingDate },
    { label: 'Probability (%)', value: (d) => d.probability }, { label: 'Owner', value: (d) => userName(d.ownerId) }, { label: 'Source', value: (d) => d.source },
    { label: 'Created On', value: (d) => d.createdOn },
  ]);

  const stageMenu = (d, trigger) => (
    <Dropdown width={190} trigger={trigger}>
      {(close) => (<><MenuLabel>Change stage</MenuLabel>{STAGES.map((s) => <MenuItem key={s} close={close} active={s === d.stage} onClick={() => s !== d.stage && changeStage(d, s)}><span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: STAGE_COLORS[s] }} />{s}</span></MenuItem>)}</>)}
    </Dropdown>
  );

  const columns = [
    { key: 'name', header: 'Deal Name', sortable: true, render: (d) => <button type="button" onClick={() => setViewing(d.id)} className="text-primary hover:underline text-left whitespace-nowrap">{d.name}</button> },
    { key: 'account', header: 'Account Name', sortable: true, render: (d) => <Link to={`/accounts?open=${d.accountId}`} className="text-primary hover:underline whitespace-nowrap">{accountName(d.accountId)}</Link> },
    { key: 'contact', header: 'Contact Name', sortable: true, render: (d) => (d.contactId ? <Link to={`/contacts?open=${d.contactId}`} className="text-primary hover:underline whitespace-nowrap">{contactName(d.contactId)}</Link> : <span className="text-ink-400">—</span>) },
    { key: 'stage', header: 'Stage', sortable: true, render: (d) => (
      stageMenu(d, <button type="button" title="Change stage" className={`inline-flex items-center justify-center gap-1 h-[28px] min-w-[94px] px-2.5 rounded-md text-[12.5px] font-medium whitespace-nowrap ${badgeTone('stage', d.stage)}`}>{d.stage}</button>)
    ) },
    { key: 'amount', header: 'Amount (₹)', sortable: true, className: 'whitespace-nowrap text-ink', render: (d) => fmtINR(d.amount) },
    { key: 'closingDate', header: 'Closing Date', sortable: true, className: 'whitespace-nowrap', render: (d) => fmtDate(d.closingDate) },
    { key: 'probability', header: 'Probability', sortable: true, render: (d) => <Probability deal={d} /> },
    { key: 'owner', header: 'Owner', sortable: true, render: (d) => <UserAvatar userId={d.ownerId} size={30} withName className="whitespace-nowrap" /> },
    { key: 'createdOn', header: 'Created On', sortable: true, className: 'whitespace-nowrap', render: (d) => fmtDate(d.createdOn) },
    { key: 'actions', header: 'Actions', align: 'center', render: (d) => (
      <div className="flex items-center justify-center gap-1.5">
        <button className="icon-btn-primary" onClick={() => setViewing(d.id)} aria-label={`View ${d.name}`}><Eye size={17} /></button>
        <button className="icon-btn-primary" onClick={() => setForm({ mode: 'edit', record: d })} aria-label={`Edit ${d.name}`}><Pencil size={16} /></button>
        <ActionMenu items={[
          { label: 'Update amount, probability & date', icon: Pencil, onClick: () => { setViewing(d.id); setQuick({ amount: d.amount, probability: d.probability, closingDate: d.closingDate }); } },
          { label: 'Mark as Closed Won', icon: Trophy, onClick: () => changeStage(d, 'Closed Won') },
          { label: 'Mark as Closed Lost', icon: XCircle, onClick: () => changeStage(d, 'Closed Lost') },
          { divider: true },
          { label: 'Delete deal', icon: Trash2, danger: true, onClick: () => setConfirm({ ids: [d.id], label: d.name }) },
        ]} />
      </div>
    ) },
  ];

  const rec = deals.find((d) => d.id === viewing);
  const selectedIds = [...table.selected];

  return (
    <div>
      {viewing ? (
        <DealDetail id={viewing} onClose={() => { setViewing(null); setQuick(null); }} />
      ) : (
        <div className="flex flex-col gap-3">
      <PageHeader
        views={views} view={savedView} onViewChange={(v) => { setSavedView(v); table.setPage(1); }}
        tabMenu={[{ label: 'Export filtered deals (CSV)', icon: Download, onClick: () => exportRows(table.sorted) }, { label: `Select all ${filtered.length} filtered`, onClick: table.selectAllFiltered }, { label: 'Open stage summary', onClick: () => navigate('/stage-summary-percentage') }]}
        toolbar={{
          filterActive: filtersOpen, onFilter: () => setFiltersOpen((o) => !o),
          sortOptions: [{ key: 'name', label: 'Deal Name' }, { key: 'amount', label: 'Amount' }, { key: 'closingDate', label: 'Closing Date' }, { key: 'probability', label: 'Probability' }, { key: 'stage', label: 'Stage' }, { key: 'createdOn', label: 'Created On' }],
          sort: table.sort, onSort: table.setSort, layouts: ['list', 'kanban', 'grid', 'chart'], layout, onLayout: setLayout,
          onRefresh: refresh, refreshing, dense, onDense: () => setDense((d) => !d), module: 'Deals',
          primary: { label: 'Create Deal', onClick: () => setForm({ mode: 'create', record: blank() }), menu: [
            { label: 'Create Deal', icon: Plus, onClick: () => setForm({ mode: 'create', record: blank() }) },
            { label: 'Open Kanban board', onClick: () => setLayout('kanban') },
            { label: 'Export deals (CSV)', icon: Download, onClick: () => exportRows(table.sorted) },
          ] },
          moreItems: [
            { label: 'Export selected (CSV)', icon: Download, disabled: !selectedIds.length, onClick: () => exportRows(deals.filter((d) => table.selected.has(d.id))) },
            { label: 'Change stage of selected', disabled: !selectedIds.length, onClick: () => setBulk('stage') },
            { label: 'Change owner of selected', icon: UserCog, disabled: !selectedIds.length, onClick: () => setBulk('owner') },
            { label: 'Delete selected', icon: Trash2, danger: true, disabled: !selectedIds.length, onClick: () => setConfirm({ ids: selectedIds, label: `${selectedIds.length} deals` }) },
          ],
        }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-3 mb-3">
        <StatCard icon={CalendarRange} tone="violet" label="Total Deals" value={k.total} trend={trend(k.total, prev.total)} spark={monthly(filtered)} />
        <StatCard icon={Coins} tone="green" label="Total Pipeline Value" value={fmtCompact(k.pipeline)} trend={trend(k.pipeline, prev.pipeline)} spark={monthly(filtered).map((x, i) => x + i)} />
        <StatCard icon={Trophy} tone="amber" tinted label="Won Deals" value={`${k.won} (${k.total ? Math.round((k.won / k.total) * 100) : 0}%)`} trend={trend(k.won, prev.won)} spark={monthly(filtered.filter((d) => d.stage === 'Closed Won'))} onClick={() => set('stage')('Closed Won')} />
        <StatCard icon={XCircle} tone="red" tinted label="Lost Deals" value={`${k.lost} (${k.total ? Math.round((k.lost / k.total) * 100) : 0}%)`} trend={trend(k.lost, prev.lost)} invertTrend spark={monthly(filtered.filter((d) => d.stage === 'Closed Lost'))} onClick={() => set('stage')('Closed Lost')} />
        <StatCard icon={Clock3} tone="blue" tinted label="Open Deals" value={`${k.open} (${k.total ? Math.round((k.open / k.total) * 100) : 0}%)`} trend={trend(k.open, prev.open)} spark={monthly(filtered.filter(isOpen))} onClick={() => setSavedView('open')} />
      </div>

      <div className="flex gap-3 items-start">
        {filtersOpen && (
          <aside className="card hidden md:block w-[220px] shrink-0 px-3.5 py-4 sticky top-[72px] max-h-[calc(100vh-86px)] overflow-y-auto thin-scroll">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-semibold text-ink whitespace-nowrap">Filter Deals by</h2>
              {(moreCount > 0 || search || range.from !== DEFAULT_RANGE.from || range.to !== DEFAULT_RANGE.to) && <button onClick={reset} className="text-[12.5px] text-primary hover:underline">Clear</button>}
            </div>
            <div className="relative mb-5">
              <Search className="absolute left-2.5 top-2.5 text-ink-400" size={14} />
              <input type="text" placeholder="Search..." className="w-full h-9 pl-8 pr-3 text-[13px] border border-line rounded-md focus:border-primary outline-none" value={search} onChange={(e) => { setSearch(e.target.value); table.setPage(1); }} />
            </div>

            <details className="group" open>
              <summary className="py-2.5 text-[14px] font-semibold text-ink cursor-pointer select-none flex items-center gap-1 -ml-1">
                <ChevronDown size={16} className="group-open:rotate-180 transition-transform -rotate-90" />
                System Defined Filters
              </summary>
              <div className="pl-5 pb-4 space-y-3">
                {['Locked', 'Record Action', 'Related Records Action', 'Touched Records', 'Untouched Records', 'Cadences'].map(lbl => (
                  <label key={lbl} className="flex items-start gap-2.5 text-[13.5px] text-ink-600 cursor-pointer leading-snug">
                    <input type="checkbox" className="cb mt-0.5" />
                    {lbl}
                  </label>
                ))}
              </div>
            </details>
            
            <details className="group" open>
              <summary className="py-2.5 text-[14px] font-semibold text-ink cursor-pointer select-none flex items-center gap-1 -ml-1">
                <ChevronDown size={16} className="group-open:rotate-180 transition-transform -rotate-90" />
                Filter By Fields
              </summary>
              <div className="pl-5 pb-4 space-y-3">
                <div className="space-y-1.5">
                  <label className="flex items-start gap-2.5 text-[13.5px] text-ink-600 cursor-pointer leading-snug">
                    <input type="checkbox" className="cb mt-0.5" checked={range.from !== DEFAULT_RANGE.from || range.to !== DEFAULT_RANGE.to} onChange={(e) => setRange(e.target.checked ? { from: todayISO().slice(0, 8) + '01', to: todayISO() } : DEFAULT_RANGE)} />
                    Date Range
                  </label>
                  {(range.from !== DEFAULT_RANGE.from || range.to !== DEFAULT_RANGE.to) && (
                    <div className="grid grid-cols-2 gap-1 mt-1">
                      <input type="date" className="h-8 px-1 text-[11px] border border-line rounded-md" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} />
                      <input type="date" className="h-8 px-1 text-[11px] border border-line rounded-md" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} />
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-start gap-2.5 text-[13.5px] text-ink-600 cursor-pointer leading-snug">
                    <input type="checkbox" className="cb mt-0.5" checked={f.stage !== ''} onChange={() => set('stage')(f.stage ? '' : STAGES[0])} />
                    Stage
                  </label>
                  {f.stage !== '' && (
                    <select className="w-full h-8 px-2 text-[13px] border border-line rounded-md bg-white" value={f.stage} onChange={(e) => set('stage')(e.target.value)}>
                      <option value="">All Stages</option>
                      {STAGES.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-start gap-2.5 text-[13.5px] text-ink-600 cursor-pointer leading-snug">
                    <input type="checkbox" className="cb mt-0.5" checked={f.owner !== ''} onChange={() => set('owner')(f.owner ? '' : ownerOptions[0].value)} />
                    Owner
                  </label>
                  {f.owner !== '' && (
                    <select className="w-full h-8 px-2 text-[13px] border border-line rounded-md bg-white" value={f.owner} onChange={(e) => set('owner')(e.target.value)}>
                      <option value="">All Owners</option>
                      {ownerOptions.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
                    </select>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-start gap-2.5 text-[13.5px] text-ink-600 cursor-pointer leading-snug">
                    <input type="checkbox" className="cb mt-0.5" checked={f.account !== ''} onChange={() => set('account')(f.account ? '' : dealAccounts[0]?.value)} />
                    Account
                  </label>
                  {f.account !== '' && (
                    <select className="w-full h-8 px-2 text-[13px] border border-line rounded-md bg-white" value={f.account} onChange={(e) => set('account')(e.target.value)}>
                      <option value="">All Accounts</option>
                      {dealAccounts.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
                    </select>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-start gap-2.5 text-[13.5px] text-ink-600 cursor-pointer leading-snug">
                    <input type="checkbox" className="cb mt-0.5" checked={f.source !== ''} onChange={() => set('source')(f.source ? '' : DEAL_SOURCES[0])} />
                    Deal Source
                  </label>
                  {f.source !== '' && (
                    <select className="w-full h-8 px-2 text-[13px] border border-line rounded-md bg-white" value={f.source} onChange={(e) => set('source')(e.target.value)}>
                      <option value="">All Sources</option>
                      {DEAL_SOURCES.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  )}
                </div>
              </div>
            </details>
            
            <details className="group">
              <summary className="py-2.5 text-[14px] font-semibold text-ink cursor-pointer select-none flex items-center gap-1 -ml-1">
                <ChevronDown size={16} className="group-open:rotate-180 transition-transform -rotate-90" />
                Filter By Subforms
              </summary>
              <div className="pl-5 pb-4 space-y-3">
                {['Contact Roles', 'Products', 'Attachments', 'Notes'].map(lbl => (
                  <label key={lbl} className="flex items-start gap-2.5 text-[13.5px] text-ink-600 cursor-pointer leading-snug">
                    <input type="checkbox" className="cb mt-0.5" />
                    {lbl}
                  </label>
                ))}
              </div>
            </details>

            <details className="group">
              <summary className="py-2.5 text-[14px] font-semibold text-ink cursor-pointer select-none flex items-center gap-1 -ml-1">
                <ChevronDown size={16} className="group-open:rotate-180 transition-transform -rotate-90" />
                Filter By Related Modules
              </summary>
              <div className="pl-5 pb-4 space-y-3">
                {['Accounts', 'Campaigns', 'Contacts', 'Invoices', 'Leads', 'Quotes', 'Vendors'].map(lbl => (
                  <label key={lbl} className="flex items-start gap-2.5 text-[13.5px] text-ink-600 cursor-pointer leading-snug">
                    <input type="checkbox" className="cb mt-0.5" />
                    {lbl}
                  </label>
                ))}
              </div>
            </details>
          </aside>
        )}

        <div className="flex-1 min-w-0">
          <section className="card overflow-hidden">
            <BulkBar count={selectedIds.length} onClear={table.clearSelection}>
              <BulkButton onClick={() => setBulk('stage')}>Change stage</BulkButton>
              <BulkButton icon={UserCog} onClick={() => setBulk('owner')}>Change owner</BulkButton>
              <BulkButton icon={Download} onClick={() => exportRows(deals.filter((d) => table.selected.has(d.id)))}>Export</BulkButton>
              <BulkButton icon={Trash2} danger onClick={() => setConfirm({ ids: selectedIds, label: `${selectedIds.length} deals` })}>Delete</BulkButton>
            </BulkBar>
            {layout === 'list' && <DataTable columns={columns} rows={table.pageRows} table={table} loading={refreshing} dense={dense} minWidth={1290}
              emptyAction={<button className="btn-primary mt-2 h-9" onClick={() => setForm({ mode: 'create', record: blank() })}><Plus size={16} />Create Deal</button>} />}
            {layout === 'kanban' && (
              <div className="p-3">
                <p className="text-[12.5px] text-ink-500 mb-2.5">Drag a card to another column to change its stage. Probability updates to the stage default.</p>
                <KanbanView groups={STAGES.map((s) => ({ key: s, label: s, color: STAGE_COLORS[s] }))} rows={table.sorted} groupOf={(d) => d.stage}
                  onMove={changeStage} onCardClick={(d) => setViewing(d.id)} summary={(items) => `${fmtCompact(sumBy(items, (d) => d.amount))} · ${items.length} deals`}
                  renderCard={(d) => (
                    <div>
                      <div className="text-[13.5px] font-semibold text-ink leading-snug">{d.name}</div>
                      <div className="text-[12px] text-ink-500 mt-0.5 truncate">{accountName(d.accountId)}{d.contactId ? ` · ${contactName(d.contactId)}` : ''}</div>
                      <div className="flex items-center justify-between mt-2.5"><span className="text-[13px] font-semibold text-ink">{fmtINR(d.amount)}</span><UserAvatar userId={d.ownerId} size={24} /></div>
                      <div className="flex items-center justify-between mt-1.5 text-[11.5px] text-ink-500"><span>Closes {fmtDate(d.closingDate)}</span><span style={{ color: BAR[d.stage] }} className="font-semibold">{d.probability}%</span></div>
                    </div>
                  )} />
              </div>
            )}
            {layout === 'grid' && <div className="p-3"><GridView rows={table.pageRows} onCardClick={(d) => setViewing(d.id)} renderCard={(d) => (
              <>
                <div className="flex items-start justify-between gap-2"><div className="font-semibold text-ink leading-snug">{d.name}</div><StatusBadge kind="stage" value={d.stage} size="sm" /></div>
                <div className="text-[12.5px] text-ink-500 mt-1">{accountName(d.accountId)}</div>
                <div className="text-[19px] font-bold text-ink mt-3">{fmtINR(d.amount)}</div>
                <div className="mt-2"><Probability deal={d} /></div>
                <div className="mt-3 flex items-center justify-between text-[12px] text-ink-500"><span>Closes {fmtDate(d.closingDate)}</span><UserAvatar userId={d.ownerId} size={24} /></div>
              </>
            )} /></div>}
            {layout === 'chart' && <ChartView title="Deals by stage (filtered)" data={STAGES.map((s) => ({ name: s, value: filtered.filter((d) => d.stage === s).length, color: STAGE_COLORS[s] }))} valueLabel="Deals" />}
            {(layout === 'list' || layout === 'grid') && <div className="px-4"><Pagination table={table} noun="deals" /></div>}
          </section>
        </div>
      </div>
      </div>
      )}

      <FormModal open={!!form} onClose={() => setForm(null)} title={form?.mode === 'edit' ? 'Edit deal' : 'Create deal'} fields={fields} initial={form?.record} onSubmit={submit} submitLabel={form?.mode === 'edit' ? 'Save changes' : 'Create deal'} />
      <FormModal open={!!bulk} onClose={() => setBulk(null)} size="sm" title={bulk === 'owner' ? 'Change owner' : 'Change stage'} subtitle={`Applies to ${selectedIds.length} selected deals.`}
        fields={[bulk === 'owner' ? { name: 'value', label: 'New owner', type: 'select', options: ownerOptions, required: true, span: 2 } : { name: 'value', label: 'Stage', type: 'select', options: STAGES, required: true, span: 2 }]}
        initial={bulk ? { value: '' } : null} submitLabel="Apply"
        onSubmit={({ value }) => { selectedIds.forEach((id) => { const d = deals.find((x) => x.id === id); updateRecord('deals', id, bulk === 'owner' ? { ownerId: value } : stagePatch(d, value)); }); setBulk(null); table.clearSelection(); }} />
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} title="Delete deals?" message={confirm ? `Delete ${confirm.label}? Pipeline totals and stage reports update immediately.` : ''}
        onConfirm={() => { deleteRecords('deals', confirm.ids); table.clearSelection(); setViewing(null); }} />
    </div>
  );
}
