import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, CircleDollarSign, Download, Eye, Pencil, Plus, Trash2, UserCog, UserPlus, ChevronDown, Search } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import FilterBar, { MoreFilters, SelectField } from '../../components/common/FilterBar';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import useTable from '../../components/common/useTable';
import StatusBadge from '../../components/common/StatusBadge';
import { AccountLogo, UserAvatar } from '../../components/common/Avatar';
import ActionMenu from '../../components/common/ActionMenu';
import FormModal from '../../components/common/RecordForm';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Drawer, DetailGrid, SectionTitle } from '../../components/common/Modal';
import BulkBar, { BulkButton } from '../../components/common/BulkBar';
import { ChartView, GridView, KanbanView } from '../../components/common/Views';
import { useRefresh, useUrlActions } from '../../components/common/hooks';
import { ACCOUNT_STATUSES, ACCOUNT_TYPES, INDUSTRIES, LOCATIONS, AVATAR_COLORS } from '../../data/seedData';
import { balanceOf, fmtCompact, fmtDate, fmtINR, isOpen, sumBy, todayISO, trend } from '../../utils/calculations';
import { exportCSV } from '../../utils/exportCSV';

const STATUS_COLORS = { Active: '#12C26B', Inactive: '#FF3344', New: '#2F7BF5' };
const TYPE_COLORS = { Customer: '#2F7BF5', Prospect: '#8E3CF2', Partner: '#FFBB28', Vendor: '#14B8A6' };
const EMPTY = { industry: '', type: '', owner: '', status: '', location: '', minRev: '', maxRev: '', from: '', to: '' };

function monthlyCreated(rows) {
  const now = new Date();
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 4 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return rows.filter((r) => (r.createdOn || '') < `${key}-32`).length + 1;
  });
}

export default function Accounts() {
  const { accounts, contacts, deals, invoices, calls, users, baselines, createRecord, updateRecord, deleteRecords, userName } = useCRM();
  const navigate = useNavigate();
  const { refreshing, refresh } = useRefresh('Accounts');

  const [savedView, setSavedView] = useState('all');
  const [layout, setLayout] = useState('list');
  const [dense, setDense] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [search, setSearch] = useState('');
  const [f, setF] = useState(EMPTY);
  const [form, setForm] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [bulk, setBulk] = useState(null);

  const counts = useMemo(() => {
    const c = {};
    const d = {};
    contacts.forEach((x) => { c[x.accountId] = (c[x.accountId] || 0) + 1; });
    deals.forEach((x) => { d[x.accountId] = (d[x.accountId] || 0) + 1; });
    return { c, d };
  }, [contacts, deals]);

  const views = [
    { key: 'all', label: 'All Accounts', test: () => true },
    { key: 'mine', label: 'My Accounts', test: (a) => a.ownerId === 'u1' },
    { key: 'customers', label: 'Customers', test: (a) => a.type === 'Customer' },
    { key: 'partners', label: 'Partners', test: (a) => a.type === 'Partner' },
    { key: 'inactive', label: 'Inactive Accounts', test: (a) => a.status === 'Inactive' },
  ].map((v) => ({ ...v, count: accounts.filter(v.test).length }));
  const viewTest = views.find((v) => v.key === savedView)?.test;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return accounts.filter((a) => {
      if (viewTest && !viewTest(a)) return false;
      if (q && ![a.name, a.industry, a.location, userName(a.ownerId), a.type].some((v) => String(v).toLowerCase().includes(q))) return false;
      if (f.industry && a.industry !== f.industry) return false;
      if (f.type && a.type !== f.type) return false;
      if (f.owner && a.ownerId !== f.owner) return false;
      if (f.status && a.status !== f.status) return false;
      if (f.location && a.location !== f.location) return false;
      if (f.minRev && a.annualRevenue < Number(f.minRev) * 100000) return false;
      if (f.maxRev && a.annualRevenue > Number(f.maxRev) * 100000) return false;
      if (f.from && a.createdOn < f.from) return false;
      if (f.to && a.createdOn > f.to) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts, search, f, savedView, userName]);

  const accessors = useMemo(() => ({ contacts: (a) => counts.c[a.id] || 0, deals: (a) => counts.d[a.id] || 0, owner: (a) => userName(a.ownerId) }), [counts, userName]);
  const table = useTable(filtered, { accessors, pageSize: 10 });
  const set = (k) => (v) => { setF((s) => ({ ...s, [k]: v })); table.setPage(1); };
  const reset = () => { setF(EMPTY); setSearch(''); setSavedView('all'); };
  const moreCount = ['location', 'minRev', 'maxRev', 'from', 'to'].filter((k) => f[k]).length;

  const k = {
    total: accounts.length, active: accounts.filter((a) => a.status === 'Active').length,
    new: accounts.filter((a) => a.status === 'New').length, inactive: accounts.filter((a) => a.status === 'Inactive').length,
  };
  const ownerOptions = users.map((u) => ({ value: u.id, label: u.name }));
  const fields = [
    { name: 'name', label: 'Account Name', required: true, validate: (v, vals) => (accounts.some((a) => a.name.toLowerCase() === String(v).trim().toLowerCase() && a.id !== vals.id) ? 'An account with this name already exists.' : '') },
    { name: 'type', label: 'Account Type', type: 'select', options: ACCOUNT_TYPES, required: true },
    { name: 'industry', label: 'Industry', type: 'select', options: INDUSTRIES, required: true },
    { name: 'location', label: 'Location', required: true },
    { name: 'annualRevenue', label: 'Annual Revenue (₹)', type: 'number', min: 0, required: true },
    { name: 'status', label: 'Account Status', type: 'select', options: ACCOUNT_STATUSES, required: true },
    { name: 'ownerId', label: 'Account Owner', type: 'select', options: ownerOptions, required: true },
    { name: 'createdOn', label: 'Created On', type: 'date', required: true },
    { name: 'website', label: 'Website' },
    { name: 'phone', label: 'Phone', type: 'tel' },
    { name: 'description', label: 'Description', type: 'textarea', span: 2 },
  ];
  const blank = () => ({ name: '', type: 'Prospect', industry: 'IT Services', location: 'Chennai', annualRevenue: '', status: 'New', ownerId: 'u1', createdOn: todayISO(), website: '', phone: '', description: '' });

  useUrlActions({
    onCreate: () => setForm({ mode: 'create', record: blank() }),
    onOpen: (id) => accounts.some((a) => a.id === id) && setViewing(id),
  });

  const submit = (v) => {
    if (form.mode === 'create') {
      createRecord('accounts', { ...v, color: AVATAR_COLORS[accounts.length % AVATAR_COLORS.length] });
      table.setSort(null);
      table.setPage(1);
    } else updateRecord('accounts', form.record.id, v);
    setForm(null);
  };

  const exportRows = (rows) => exportCSV('accounts', rows, [
    { label: 'Account Name', value: (a) => a.name }, { label: 'Account Type', value: (a) => a.type }, { label: 'Industry', value: (a) => a.industry },
    { label: 'Location', value: (a) => a.location }, { label: 'No. of Contacts', value: (a) => counts.c[a.id] || 0 }, { label: 'No. of Deals', value: (a) => counts.d[a.id] || 0 },
    { label: 'Annual Revenue (INR)', value: (a) => a.annualRevenue }, { label: 'Account Status', value: (a) => a.status }, { label: 'Owner', value: (a) => userName(a.ownerId) },
    { label: 'Created On', value: (a) => a.createdOn },
  ]);

  const rowMenu = (a) => [
    { label: 'Add contact', icon: UserPlus, onClick: () => navigate(`/contacts?create=1&account=${a.id}`) },
    { label: 'Create deal', icon: CircleDollarSign, onClick: () => navigate(`/deals?create=1&account=${a.id}`) },
    { divider: true },
    ...ACCOUNT_STATUSES.filter((s) => s !== a.status).map((s) => ({ label: `Mark as ${s}`, onClick: () => updateRecord('accounts', a.id, { status: s }) })),
    { divider: true },
    { label: 'Delete account', icon: Trash2, danger: true, onClick: () => setConfirm({ ids: [a.id], label: a.name }) },
  ];

  const columns = [
    { key: 'name', header: 'Account Name', sortable: true, render: (a) => (
      <button type="button" onClick={() => setViewing(a.id)} className="flex items-center gap-2.5 text-left">
        <AccountLogo account={a} size={30} /><span className="text-primary hover:underline whitespace-nowrap">{a.name}</span>
      </button>
    ) },
    { key: 'type', header: 'Account Type', sortable: true, render: (a) => <StatusBadge kind="accountType" value={a.type} className="min-w-[76px]" /> },
    { key: 'industry', header: 'Industry', sortable: true, className: 'whitespace-nowrap' },
    { key: 'location', header: 'Location', sortable: true },
    { key: 'contacts', header: 'No. of Contacts', sortable: true, align: 'center', render: (a) => counts.c[a.id] || 0 },
    { key: 'deals', header: 'No. of Deals', sortable: true, align: 'center', render: (a) => counts.d[a.id] || 0 },
    { key: 'annualRevenue', header: 'Annual Revenue (₹)', sortable: true, className: 'whitespace-nowrap', render: (a) => fmtINR(a.annualRevenue) },
    { key: 'status', header: 'Account Status', sortable: true, render: (a) => <StatusBadge kind="accountStatus" value={a.status} className="min-w-[64px]" /> },
    { key: 'owner', header: 'Owner', sortable: true, render: (a) => <UserAvatar userId={a.ownerId} size={30} withName className="whitespace-nowrap" /> },
    { key: 'createdOn', header: 'Created On', sortable: true, className: 'whitespace-nowrap', render: (a) => fmtDate(a.createdOn) },
    { key: 'actions', header: 'Actions', align: 'center', render: (a) => (
      <div className="flex items-center justify-center gap-1.5">
        <button className="icon-btn-primary" onClick={() => setViewing(a.id)} aria-label={`View ${a.name}`}><Eye size={17} /></button>
        <button className="icon-btn-primary" onClick={() => setForm({ mode: 'edit', record: a })} aria-label={`Edit ${a.name}`}><Pencil size={16} /></button>
        <ActionMenu items={rowMenu(a)} />
      </div>
    ) },
  ];

  const rec = accounts.find((a) => a.id === viewing);
  const recContacts = rec ? contacts.filter((c) => c.accountId === rec.id) : [];
  const recDeals = rec ? deals.filter((d) => d.accountId === rec.id) : [];
  const recInvoices = rec ? invoices.filter((i) => i.accountId === rec.id) : [];
  const recCalls = rec ? calls.filter((c) => c.accountId === rec.id) : [];
  const selectedIds = [...table.selected];

  return (
    <div>
      <PageHeader
        views={views} view={savedView} onViewChange={(v) => { setSavedView(v); table.setPage(1); }}
        tabMenu={[{ label: 'Export filtered accounts (CSV)', icon: Download, onClick: () => exportRows(table.sorted) }, { label: `Select all ${filtered.length} filtered`, onClick: table.selectAllFiltered }, { label: 'Reset filters', onClick: reset }]}
        toolbar={{
          sidebarToggle: { isOpen: filtersOpen, onToggle: () => setFiltersOpen((o) => !o) },
          filterActive: filtersOpen, onFilter: () => setFiltersOpen((o) => !o),
          sortOptions: [{ key: 'name', label: 'Account Name' }, { key: 'annualRevenue', label: 'Annual Revenue' }, { key: 'createdOn', label: 'Created On' }, { key: 'contacts', label: 'No. of Contacts' }, { key: 'deals', label: 'No. of Deals' }],
          sort: table.sort, onSort: table.setSort, layouts: ['list', 'kanban', 'grid', 'chart'], layout, onLayout: setLayout,
          onRefresh: refresh, refreshing, dense, onDense: () => setDense((d) => !d), module: 'Accounts',
          primary: { label: 'Create Account', onClick: () => setForm({ mode: 'create', record: blank() }), menu: [
            { label: 'Create Account', icon: Plus, onClick: () => setForm({ mode: 'create', record: blank() }) },
            { label: 'Export accounts (CSV)', icon: Download, onClick: () => exportRows(table.sorted) },
          ] },
          moreItems: [
            { label: 'Export selected (CSV)', icon: Download, disabled: !selectedIds.length, onClick: () => exportRows(accounts.filter((a) => table.selected.has(a.id))) },
            { label: 'Change owner of selected', icon: UserCog, disabled: !selectedIds.length, onClick: () => setBulk('owner') },
            { label: 'Delete selected', icon: Trash2, danger: true, disabled: !selectedIds.length, onClick: () => setConfirm({ ids: selectedIds, label: `${selectedIds.length} accounts` }) },
          ],
        }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-3">
        <StatCard icon={Building2} tone="violet" label="Total Accounts" value={k.total} trend={trend(k.total, baselines.accounts.total)} spark={monthlyCreated(accounts)} onClick={reset} />
        <StatCard icon={Building2} tone="green" label="Active Accounts" value={k.active} trend={trend(k.active, baselines.accounts.active)} spark={monthlyCreated(accounts.filter((a) => a.status === 'Active'))} onClick={() => set('status')('Active')} />
        <StatCard icon={UserPlus} tone="amber" label="New Accounts" value={k.new} trend={trend(k.new, baselines.accounts.new)} spark={monthlyCreated(accounts.filter((a) => a.status === 'New'))} onClick={() => set('status')('New')} />
        <StatCard icon={Building2} tone="red" label="Inactive Accounts" value={k.inactive} trend={trend(k.inactive, baselines.accounts.inactive)} invertTrend spark={monthlyCreated(accounts.filter((a) => a.status === 'Inactive'))} onClick={() => set('status')('Inactive')} />
      </div>

      <div className="flex gap-3 items-start">
        <aside
          className={`card hidden md:block shrink-0 px-3.5 py-4 sticky top-[72px] max-h-[calc(100vh-86px)] overflow-y-auto thin-scroll transition-all duration-300 ease-in-out ${
            filtersOpen ? 'w-[220px] opacity-100' : 'w-0 opacity-0 border-0 p-0 overflow-hidden -mr-3 pointer-events-none'
          }`}
        >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-semibold text-ink whitespace-nowrap">Filter Accounts by</h2>
              {(moreCount > 0 || search) && <button onClick={reset} className="text-[12.5px] text-primary hover:underline">Clear</button>}
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
                    <input type="checkbox" className="cb mt-0.5" checked={f.industry !== ''} onChange={() => set('industry')(f.industry ? '' : INDUSTRIES[0])} />
                    Industry
                  </label>
                  {f.industry !== '' && (
                    <select className="w-full h-8 px-2 text-[13px] border border-line rounded-md bg-white" value={f.industry} onChange={(e) => set('industry')(e.target.value)}>
                      <option value="">All Industries</option>
                      {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-start gap-2.5 text-[13.5px] text-ink-600 cursor-pointer leading-snug">
                    <input type="checkbox" className="cb mt-0.5" checked={f.type !== ''} onChange={() => set('type')(f.type ? '' : ACCOUNT_TYPES[0])} />
                    Account Type
                  </label>
                  {f.type !== '' && (
                    <select className="w-full h-8 px-2 text-[13px] border border-line rounded-md bg-white" value={f.type} onChange={(e) => set('type')(e.target.value)}>
                      <option value="">All Types</option>
                      {ACCOUNT_TYPES.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-start gap-2.5 text-[13.5px] text-ink-600 cursor-pointer leading-snug">
                    <input type="checkbox" className="cb mt-0.5" checked={f.owner !== ''} onChange={() => set('owner')(f.owner ? '' : ownerOptions[0].value)} />
                    Account Owner
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
                    <input type="checkbox" className="cb mt-0.5" checked={f.status !== ''} onChange={() => set('status')(f.status ? '' : ACCOUNT_STATUSES[0])} />
                    Account Status
                  </label>
                  {f.status !== '' && (
                    <select className="w-full h-8 px-2 text-[13px] border border-line rounded-md bg-white" value={f.status} onChange={(e) => set('status')(e.target.value)}>
                      <option value="">All Statuses</option>
                      {ACCOUNT_STATUSES.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-start gap-2.5 text-[13.5px] text-ink-600 cursor-pointer leading-snug">
                    <input type="checkbox" className="cb mt-0.5" checked={f.location !== ''} onChange={() => set('location')(f.location ? '' : LOCATIONS[0])} />
                    Location
                  </label>
                  {f.location !== '' && (
                    <select className="w-full h-8 px-2 text-[13px] border border-line rounded-md bg-white" value={f.location} onChange={(e) => set('location')(e.target.value)}>
                      <option value="">All Locations</option>
                      {LOCATIONS.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  )}
                </div>
              </div>
            </details>
          </aside>

        <div className="flex-1 min-w-0">
          <section className="card overflow-hidden">
            <BulkBar count={selectedIds.length} onClear={table.clearSelection}>
              <BulkButton icon={UserCog} onClick={() => setBulk('owner')}>Change owner</BulkButton>
              <BulkButton onClick={() => setBulk('status')}>Update status</BulkButton>
              <BulkButton icon={Download} onClick={() => exportRows(accounts.filter((a) => table.selected.has(a.id)))}>Export</BulkButton>
              <BulkButton icon={Trash2} danger onClick={() => setConfirm({ ids: selectedIds, label: `${selectedIds.length} accounts` })}>Delete</BulkButton>
            </BulkBar>
            {layout === 'list' && <DataTable columns={columns} rows={table.pageRows} table={table} loading={refreshing} dense={dense} minWidth={1260}
              emptyAction={<button className="btn-primary mt-2 h-9" onClick={() => setForm({ mode: 'create', record: blank() })}><Plus size={16} />Create Account</button>} />}
            {layout === 'kanban' && <div className="p-3"><KanbanView groups={ACCOUNT_STATUSES.map((s) => ({ key: s, label: s, color: STATUS_COLORS[s] }))} rows={table.sorted} groupOf={(a) => a.status}
              onMove={(a, to) => updateRecord('accounts', a.id, { status: to })} onCardClick={(a) => setViewing(a.id)} summary={(items) => `${fmtCompact(sumBy(items, (a) => a.annualRevenue))} annual revenue`}
              renderCard={(a) => (<div className="flex items-start gap-2.5"><AccountLogo account={a} size={30} /><div className="min-w-0 flex-1"><div className="text-[13.5px] font-semibold text-ink truncate">{a.name}</div><div className="text-[12px] text-ink-500">{a.industry} · {a.location}</div><div className="flex items-center justify-between mt-2"><StatusBadge kind="accountType" value={a.type} size="sm" /><span className="text-[12px] text-ink">{fmtCompact(a.annualRevenue)}</span></div></div></div>)} /></div>}
            {layout === 'grid' && <div className="p-3"><GridView rows={table.pageRows} onCardClick={(a) => setViewing(a.id)} renderCard={(a) => (
              <>
                <div className="flex items-center gap-3"><AccountLogo account={a} size={40} /><div className="min-w-0"><div className="font-semibold text-ink truncate">{a.name}</div><div className="text-[12.5px] text-ink-500">{a.industry} · {a.location}</div></div></div>
                <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                  <div className="bg-page rounded-lg py-2"><div className="text-[15px] font-semibold text-ink">{counts.c[a.id] || 0}</div><div className="text-[11px] text-ink-500">Contacts</div></div>
                  <div className="bg-page rounded-lg py-2"><div className="text-[15px] font-semibold text-ink">{counts.d[a.id] || 0}</div><div className="text-[11px] text-ink-500">Deals</div></div>
                  <div className="bg-page rounded-lg py-2"><div className="text-[15px] font-semibold text-ink">{fmtCompact(a.annualRevenue, { space: false })}</div><div className="text-[11px] text-ink-500">Revenue</div></div>
                </div>
                <div className="mt-3 flex items-center gap-2"><StatusBadge kind="accountType" value={a.type} size="sm" /><StatusBadge kind="accountStatus" value={a.status} size="sm" /><span className="ml-auto"><UserAvatar userId={a.ownerId} size={24} /></span></div>
              </>
            )} /></div>}
            {layout === 'chart' && <ChartView title="Accounts by type" data={ACCOUNT_TYPES.map((t) => ({ name: t, value: filtered.filter((a) => a.type === t).length, color: TYPE_COLORS[t] }))} valueLabel="Accounts" />}
            {(layout === 'list' || layout === 'grid') && <div className="px-4"><Pagination table={table} noun="accounts" /></div>}
          </section>
        </div>
      </div>

      <FormModal open={!!form} onClose={() => setForm(null)} title={form?.mode === 'edit' ? 'Edit account' : 'Create account'} fields={fields} initial={form?.record} onSubmit={submit} submitLabel={form?.mode === 'edit' ? 'Save changes' : 'Create account'} />
      <FormModal open={!!bulk} onClose={() => setBulk(null)} size="sm" title={bulk === 'owner' ? 'Change owner' : 'Update account status'} subtitle={`Applies to ${selectedIds.length} selected accounts.`}
        fields={[bulk === 'owner' ? { name: 'value', label: 'New owner', type: 'select', options: ownerOptions, required: true, span: 2 } : { name: 'value', label: 'Account status', type: 'select', options: ACCOUNT_STATUSES, required: true, span: 2 }]}
        initial={bulk ? { value: '' } : null} submitLabel="Apply"
        onSubmit={({ value }) => { selectedIds.forEach((id) => updateRecord('accounts', id, bulk === 'owner' ? { ownerId: value } : { status: value })); setBulk(null); table.clearSelection(); }} />
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} title="Delete accounts?"
        message={confirm ? `Delete ${confirm.label}? Linked contacts, deals, calls and invoices are kept but unlinked from ${confirm.ids.length > 1 ? 'these accounts' : 'this account'}.` : ''}
        onConfirm={() => { deleteRecords('accounts', confirm.ids); table.clearSelection(); setViewing(null); }} />

      <Drawer open={!!rec} onClose={() => setViewing(null)} width={580}
        title={rec && (<div className="flex items-center gap-3"><AccountLogo account={rec} size={44} /><div className="min-w-0"><h2 className="text-[17px] font-semibold text-ink truncate">{rec.name}</h2><p className="text-[13px] text-ink-500">{rec.industry} · {rec.location}</p></div></div>)}
        footer={rec && (<>
          <button className="btn-secondary text-danger-700" onClick={() => setConfirm({ ids: [rec.id], label: rec.name })}><Trash2 size={15} />Delete</button>
          <button className="btn-secondary" onClick={() => navigate(`/deals?create=1&account=${rec.id}`)}><Plus size={15} />Deal</button>
          <button className="btn-primary" onClick={() => setForm({ mode: 'edit', record: rec })}><Pencil size={15} />Edit</button>
        </>)}>
        {rec && (
          <>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <StatusBadge kind="accountType" value={rec.type} />
              <select aria-label="Account status" value={rec.status} onChange={(e) => updateRecord('accounts', rec.id, { status: e.target.value })} className="h-7 rounded-md border border-line text-[13px] px-2 bg-white">
                {ACCOUNT_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
              {[['Contacts', recContacts.length], ['Deals', recDeals.length], ['Open pipeline', fmtCompact(sumBy(recDeals.filter(isOpen), (d) => d.amount))], ['Outstanding', fmtCompact(sumBy(recInvoices, balanceOf))]].map(([l, v]) => (
                <div key={l} className="bg-page rounded-lg px-2.5 py-2"><div className="text-[15px] font-semibold text-ink">{v}</div><div className="text-[11.5px] text-ink-500">{l}</div></div>
              ))}
            </div>
            <DetailGrid items={[['Annual revenue', fmtINR(rec.annualRevenue)], ['Owner', <UserAvatar key="o" userId={rec.ownerId} size={24} withName />], ['Website', rec.website], ['Phone', rec.phone], ['Created on', fmtDate(rec.createdOn)], ['Calls logged', recCalls.length], rec.description && ['Description', rec.description]]} />
            <SectionTitle extra={<Link to={`/contacts?create=1&account=${rec.id}`} className="text-[12.5px] link inline-flex items-center gap-1"><UserPlus size={14} />Add contact</Link>}>Contacts ({recContacts.length})</SectionTitle>
            {recContacts.length === 0 ? <p className="text-[13px] text-ink-500">No contacts linked yet.</p> : (
              <ul className="divide-y divide-line-soft border border-line rounded-lg max-h-[220px] overflow-y-auto">
                {recContacts.map((c) => <li key={c.id} className="flex items-center justify-between px-3 py-2 text-[13px]"><Link className="link" to={`/contacts?open=${c.id}`}>{c.name}</Link><span className="text-ink-500 truncate ml-3">{c.designation}</span></li>)}
              </ul>
            )}
            <SectionTitle>Deals ({recDeals.length})</SectionTitle>
            {recDeals.length === 0 ? <p className="text-[13px] text-ink-500">No deals linked yet.</p> : (
              <ul className="divide-y divide-line-soft border border-line rounded-lg max-h-[240px] overflow-y-auto">
                {recDeals.map((d) => <li key={d.id} className="flex items-center justify-between gap-3 px-3 py-2 text-[13px]"><Link className="link truncate" to={`/deals?open=${d.id}`}>{d.name}</Link><span className="flex items-center gap-2 shrink-0">{fmtINR(d.amount)}<StatusBadge kind="stage" value={d.stage} size="sm" /></span></li>)}
              </ul>
            )}
            <SectionTitle>Invoices ({recInvoices.length})</SectionTitle>
            {recInvoices.length === 0 ? <p className="text-[13px] text-ink-500">No invoices for this account.</p> : (
              <ul className="divide-y divide-line-soft border border-line rounded-lg">
                {recInvoices.slice(0, 6).map((i) => <li key={i.id} className="flex items-center justify-between px-3 py-2 text-[13px]"><Link className="link" to={`/zoho-finance?open=${i.id}`}>{i.number}</Link><span className="flex items-center gap-2">{fmtINR(i.amount)}<StatusBadge kind="invoiceStatus" value={i.status} size="sm" /></span></li>)}
              </ul>
            )}
          </>
        )}
      </Drawer>
    </div>
  );
}
