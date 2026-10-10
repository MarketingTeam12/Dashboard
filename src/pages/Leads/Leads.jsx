import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Award, CalendarRange, CheckCircle2, ChevronDown, Clock3, Download, Eye,
  Pencil, Phone, Plus, Search, Sparkles, Trash2, Trophy, UserCog, Users, XCircle,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import useTable from '../../components/common/useTable';
import StatusBadge from '../../components/common/StatusBadge';
import { PersonAvatar, UserAvatar } from '../../components/common/Avatar';
import ActionMenu from '../../components/common/ActionMenu';
import FormModal from '../../components/common/RecordForm';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Dropdown, { MenuItem, MenuLabel } from '../../components/common/Dropdown';
import BulkBar, { BulkButton } from '../../components/common/BulkBar';
import { ChartView, GridView, KanbanView } from '../../components/common/Views';
import { useRefresh, useUrlActions } from '../../components/common/hooks';
import { CITIES, LEAD_SOURCES, LEAD_STATUSES, LEAD_TAGS } from '../../data/seedData';
import { fmtDate, todayISO, trend } from '../../utils/calculations';
import { exportCSV } from '../../utils/exportCSV';
import { CURRENT_USER_ID, leadCategory, leadSource } from './leadFilters';

const STATUS_BADGE_TONE = {
  New: 'bg-[#E8F1FF] text-[#1262E0]',
  Assigned: 'bg-[#DFF6EA] text-[#0E9F5E]',
  Contacted: 'bg-[#FFEDE0] text-[#EE6A1F]',
  Qualified: 'bg-[#FFF3D3] text-[#C98500]',
  Proposal: 'bg-[#F1E9FF] text-[#7C3AED]',
  Converted: 'bg-[#DFF6EA] text-[#0E9F5E]',
  Lost: 'bg-[#FFE4E6] text-[#E5293A]',
  Pending: 'bg-[#EEF2F7] text-[#4B5578]',
};

const KANBAN_COLORS = {
  New: '#2F7BF5',
  Contacted: '#FF7B3A',
  Qualified: '#F59E0B',
  Proposal: '#8E3CF2',
  Converted: '#12C26B',
  Lost: '#FF3344',
};

const EMPTY_FILTERS = {
  status: '',
  source: '',
  owner: '',
  city: '',
  tag: '',
  category: '',
};

function monthlyCount(rows) {
  return [6, 7, 8, 9, 10].map((m) => rows.filter((l) => Number((l.createdOn || '2026-10-01').slice(5, 7)) <= m).length + 2);
}

export default function Leads() {
  const { leads = [], users = [], userName, updateRecord, deleteRecords, convertLead, createTask } = useCRM();
  const navigate = useNavigate();
  const { refreshing, refresh } = useRefresh('Leads');

  const [savedView, setSavedView] = useState('all');
  const [layout, setLayout] = useState('list');
  const [dense, setDense] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [search, setSearch] = useState('');
  const [sysFilters, setSysFilters] = useState(() => new Set());
  const [f, setF] = useState(EMPTY_FILTERS);
  const [confirm, setConfirm] = useState(null);
  const [bulk, setBulk] = useState(null);
  const [convertingLead, setConvertingLead] = useState(null);

  useUrlActions({
    onCreate: () => navigate('/leads/new'),
    onOpen: (id) => navigate(`/leads/${id}`),
  });

  const views = [
    { key: 'all', label: 'All Leads', test: () => true },
    { key: 'mine', label: 'My Leads', test: (l) => l.ownerId === CURRENT_USER_ID || l.ownerId === 'u1' },
    { key: 'today', label: "Today's Leads", test: (l) => l.createdOn === todayISO() },
    { key: 'qualified', label: 'Qualified Leads', test: (l) => ['Qualified', 'Proposal'].includes(l.status) },
    { key: 'converted', label: 'Converted Leads', test: (l) => l.status === 'Converted' },
    { key: 'open', label: 'Open Leads', test: (l) => !['Converted', 'Lost'].includes(l.status) },
  ].map((v) => ({ ...v, count: leads.filter(v.test).length }));

  const viewTest = views.find((v) => v.key === savedView)?.test;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (viewTest && !viewTest(l)) return false;
      if (sysFilters.has('Touched Records') && !l.touched) return false;
      if (sysFilters.has('Untouched Records') && l.touched) return false;
      if (sysFilters.has('Activities') && !(l.activities && l.activities.length)) return false;
      if (q && ![l.name, l.company, l.mobile, l.phone, l.email, l.city, l.remarks, leadCategory(l), userName(l.ownerId)].some((v) => String(v || '').toLowerCase().includes(q))) return false;
      if (f.status && l.status !== f.status) return false;
      if (f.source && leadSource(l) !== f.source) return false;
      if (f.owner && l.ownerId !== f.owner) return false;
      if (f.city && (l.city || '').toLowerCase() !== f.city.toLowerCase()) return false;
      if (f.tag && l.tag !== f.tag) return false;
      if (f.category && leadCategory(l) !== f.category) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads, search, f, savedView, sysFilters, userName]);

  const accessors = useMemo(() => ({
    name: (l) => l.name || '',
    company: (l) => l.company || '',
    category: (l) => leadCategory(l),
    source: (l) => leadSource(l),
    owner: (l) => userName(l.ownerId),
    createdOn: (l) => l.createdOn || '',
  }), [userName]);

  const table = useTable(filtered, { accessors, pageSize: 10 });
  const setFilter = (k) => (v) => { setF((s) => ({ ...s, [k]: v })); table.setPage(1); };
  const resetFilters = () => {
    setF(EMPTY_FILTERS);
    setSysFilters(new Set());
    setSearch('');
    setSavedView('all');
  };

  const activeFilterCount = Object.values(f).filter(Boolean).length + sysFilters.size + (search ? 1 : 0);

  // KPI metrics
  const totalCount = filtered.length;
  const openCount = filtered.filter((l) => !['Converted', 'Lost'].includes(l.status)).length;
  const qualifiedCount = filtered.filter((l) => ['Qualified', 'Proposal'].includes(l.status)).length;
  const convertedCount = filtered.filter((l) => l.status === 'Converted').length;
  const lostCount = filtered.filter((l) => l.status === 'Lost' || l.tag === 'Junk').length;

  const ownerOptions = users.map((u) => ({ value: u.id, label: u.name }));
  const sourceList = useMemo(() => Array.from(new Set([...LEAD_SOURCES, ...leads.map(leadSource).filter(Boolean)])), [leads]);
  const cityList = useMemo(() => Array.from(new Set([...CITIES, ...leads.map((l) => l.city).filter(Boolean)])), [leads]);

  const exportRows = (rows) => exportCSV('leads', rows, [
    { label: 'Lead Name', value: (l) => l.name },
    { label: 'Company', value: (l) => l.company },
    { label: 'Category', value: (l) => leadCategory(l) },
    { label: 'Mobile', value: (l) => l.mobile || l.phone },
    { label: 'Email', value: (l) => l.email },
    { label: 'City', value: (l) => l.city },
    { label: 'Lead Status', value: (l) => l.status },
    { label: 'Lead Source', value: (l) => leadSource(l) },
    { label: 'Lead Owner', value: (l) => userName(l.ownerId) },
    { label: 'Created On', value: (l) => l.createdOn },
  ]);

  const statusDropdown = (l) => (
    <Dropdown
      width={180}
      trigger={
        <button
          type="button"
          title="Change lead status"
          className={`inline-flex items-center justify-center gap-1 h-[28px] min-w-[94px] px-2.5 rounded-md text-[12.5px] font-medium whitespace-nowrap ${
            STATUS_BADGE_TONE[l.status] || 'bg-[#EEF2F7] text-[#4B5578]'
          }`}
        >
          {l.status || 'New'}
        </button>
      }
    >
      {(close) => (
        <>
          <MenuLabel>Change Lead Status</MenuLabel>
          {['New', 'Assigned', 'Contacted', 'Qualified', 'Proposal', 'Converted', 'Lost'].map((s) => (
            <MenuItem
              key={s}
              close={close}
              active={s === l.status}
              onClick={() => s !== l.status && updateRecord('leads', l.id, { status: s })}
            >
              {s}
            </MenuItem>
          ))}
        </>
      )}
    </Dropdown>
  );

  const columns = [
    {
      key: 'name',
      header: 'Lead Name',
      sortable: true,
      render: (l) => (
        <button
          type="button"
          onClick={() => navigate(`/leads/${l.id}`)}
          className="text-primary hover:underline font-medium text-left whitespace-nowrap flex items-center gap-2"
        >
          <span>{l.name}</span>
          {l.attachments?.length > 0 && (
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-primary-50 text-primary font-semibold">
              {l.attachments.length} file{l.attachments.length > 1 ? 's' : ''}
            </span>
          )}
        </button>
      ),
    },
    {
      key: 'company',
      header: 'Company / Client',
      sortable: true,
      render: (l) => <span className="text-ink whitespace-nowrap">{l.company || l.clientName || '—'}</span>,
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (l) => <span className="text-ink-600 whitespace-nowrap">{leadCategory(l) || '—'}</span>,
    },
    {
      key: 'mobile',
      header: 'Mobile / Phone',
      sortable: false,
      render: (l) => (
        <a
          href={`tel:${(l.mobile || l.phone || '').replace(/\s/g, '')}`}
          className="inline-flex items-center gap-1.5 text-ink hover:text-primary whitespace-nowrap"
        >
          <span>{l.mobile || l.phone || '—'}</span>
          <span className="inline-flex h-5 w-5 rounded-full bg-[#DFF6EA] text-[#0E9F5E] items-center justify-center">
            <Phone size={11} />
          </span>
        </a>
      ),
    },
    {
      key: 'city',
      header: 'City',
      sortable: true,
      render: (l) => <span className="text-ink-600 whitespace-nowrap">{l.city || '—'}</span>,
    },
    {
      key: 'source',
      header: 'Lead Source',
      sortable: true,
      render: (l) => <StatusBadge kind="leadSource" value={leadSource(l) || 'Website'} />,
    },
    {
      key: 'status',
      header: 'Lead Status',
      sortable: true,
      render: (l) => statusDropdown(l),
    },
    {
      key: 'owner',
      header: 'Lead Owner',
      sortable: true,
      render: (l) => <UserAvatar userId={l.ownerId || 'u4'} size={30} withName className="whitespace-nowrap" />,
    },
    {
      key: 'createdOn',
      header: 'Created Time',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (l) => fmtDate(l.createdOn) || l.createdTime || '—',
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      render: (l) => (
        <div className="flex items-center justify-center gap-1.5">
          <button
            className="icon-btn-primary"
            onClick={() => navigate(`/leads/${l.id}`)}
            aria-label={`View ${l.name}`}
            title="View Lead"
          >
            <Eye size={17} />
          </button>
          <button
            className="icon-btn-primary"
            onClick={() => navigate(`/leads/${l.id}/edit`)}
            aria-label={`Edit ${l.name}`}
            title="Edit Lead"
          >
            <Pencil size={16} />
          </button>
          <ActionMenu
            items={[
              { label: 'View Lead Details', icon: Eye, onClick: () => navigate(`/leads/${l.id}`) },
              { label: 'Edit Lead (Zoho Form)', icon: Pencil, onClick: () => navigate(`/leads/${l.id}/edit`) },
              {
                label: 'Convert Lead to Deal',
                icon: Trophy,
                onClick: () => setConvertingLead(l),
              },
              {
                label: 'Add Follow-up Task to Workqueue',
                icon: CheckCircle2,
                onClick: () =>
                  createTask({
                    subject: `Follow up with ${l.name} (${l.company || 'Lead'})`,
                    dueDate: todayISO(),
                    status: 'In Progress',
                    priority: 'High',
                    relatedTo: `Lead - ${l.name}`,
                    contactName: l.name,
                    ownerId: l.ownerId || 'u4',
                  }),
              },
              { divider: true },
              {
                label: 'Delete Lead',
                icon: Trash2,
                danger: true,
                onClick: () => setConfirm({ ids: [l.id], label: l.name }),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  const selectedIds = [...table.selected];
  const kanbanStages = ['New', 'Contacted', 'Qualified', 'Proposal', 'Converted', 'Lost'];

  return (
    <div className="flex flex-col gap-3">
      <PageHeader
        views={views}
        view={savedView}
        onViewChange={(v) => {
          setSavedView(v);
          table.setPage(1);
        }}
        tabMenu={[
          { label: 'Export filtered leads (CSV)', icon: Download, onClick: () => exportRows(table.sorted) },
          { label: `Select all ${filtered.length} filtered`, onClick: table.selectAllFiltered },
          { label: 'Create Lead (Zoho Layout)', icon: Plus, onClick: () => navigate('/leads/new') },
        ]}
        toolbar={{
          filterActive: filtersOpen,
          onFilter: () => setFiltersOpen((o) => !o),
          sortOptions: [
            { key: 'name', label: 'Lead Name' },
            { key: 'company', label: 'Company' },
            { key: 'category', label: 'Category' },
            { key: 'source', label: 'Lead Source' },
            { key: 'createdOn', label: 'Created Time' },
          ],
          sort: table.sort,
          onSort: table.setSort,
          layouts: ['list', 'kanban', 'grid', 'chart'],
          layout,
          onLayout: setLayout,
          onRefresh: refresh,
          refreshing,
          dense,
          onDense: () => setDense((d) => !d),
          module: 'Leads',
          primary: {
            label: 'Create Lead',
            onClick: () => navigate('/leads/new'),
            menu: [
              { label: 'Create Lead', icon: Plus, onClick: () => navigate('/leads/new') },
              { label: 'Open Kanban board', onClick: () => setLayout('kanban') },
              { label: 'Export leads (CSV)', icon: Download, onClick: () => exportRows(table.sorted) },
            ],
          },
          moreItems: [
            {
              label: 'Export selected (CSV)',
              icon: Download,
              disabled: !selectedIds.length,
              onClick: () => exportRows(leads.filter((l) => table.selected.has(l.id))),
            },
            {
              label: 'Change status of selected',
              disabled: !selectedIds.length,
              onClick: () => setBulk('status'),
            },
            {
              label: 'Change owner of selected',
              icon: UserCog,
              disabled: !selectedIds.length,
              onClick: () => setBulk('owner'),
            },
            {
              label: 'Delete selected',
              icon: Trash2,
              danger: true,
              disabled: !selectedIds.length,
              onClick: () => setConfirm({ ids: selectedIds, label: `${selectedIds.length} leads` }),
            },
          ],
        }}
      />

      {/* 5 KPI StatCards matching Image 5 (Deals model) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-3 mb-1">
        <StatCard
          icon={CalendarRange}
          tone="violet"
          label="Total Leads"
          value={totalCount}
          trend={trend(totalCount, Math.max(1, totalCount - 3))}
          spark={monthlyCount(filtered)}
          onClick={resetFilters}
        />
        <StatCard
          icon={Clock3}
          tone="blue"
          tinted
          label="Open Leads"
          value={`${openCount} (${totalCount ? Math.round((openCount / totalCount) * 100) : 0}%)`}
          trend={{ up: true, value: 14 }}
          spark={monthlyCount(filtered.filter((l) => !['Converted', 'Lost'].includes(l.status)))}
          onClick={() => setSavedView('open')}
        />
        <StatCard
          icon={Sparkles}
          tone="amber"
          tinted
          label="Qualified Leads"
          value={`${qualifiedCount} (${totalCount ? Math.round((qualifiedCount / totalCount) * 100) : 0}%)`}
          trend={{ up: true, value: 18 }}
          spark={monthlyCount(filtered.filter((l) => ['Qualified', 'Proposal'].includes(l.status)))}
          onClick={() => setSavedView('qualified')}
        />
        <StatCard
          icon={Trophy}
          tone="green"
          tinted
          label="Converted Leads"
          value={`${convertedCount} (${totalCount ? Math.round((convertedCount / totalCount) * 100) : 0}%)`}
          trend={{ up: true, value: 12 }}
          spark={monthlyCount(filtered.filter((l) => l.status === 'Converted'))}
          onClick={() => setSavedView('converted')}
        />
        <StatCard
          icon={XCircle}
          tone="red"
          tinted
          label="Lost / Junk Leads"
          value={`${lostCount} (${totalCount ? Math.round((lostCount / totalCount) * 100) : 0}%)`}
          trend={{ up: false, value: 4 }}
          invertTrend
          spark={monthlyCount(filtered.filter((l) => l.status === 'Lost'))}
          onClick={() => setFilter('status')('Lost')}
        />
      </div>

      {/* Main Content: Filter Sidebar + DataTable Card matching Image 5 */}
      <div className="flex gap-3 items-start">
        {filtersOpen && (
          <aside className="card hidden md:block w-[220px] shrink-0 px-3.5 py-4 sticky top-[72px] max-h-[calc(100vh-86px)] overflow-y-auto thin-scroll">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-semibold text-ink whitespace-nowrap">Filter Leads by</h2>
              {activeFilterCount > 0 && (
                <button onClick={resetFilters} className="text-[12.5px] text-primary hover:underline">
                  Clear
                </button>
              )}
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-2.5 top-2.5 text-ink-400" size={14} />
              <input
                type="text"
                placeholder="Search..."
                className="w-full h-9 pl-8 pr-3 text-[13px] border border-line rounded-md focus:border-primary outline-none"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  table.setPage(1);
                }}
              />
            </div>

            {/* Saved Filters like Image 5 */}
            <details className="group" open>
              <summary className="py-2 text-[14px] font-semibold text-ink cursor-pointer select-none flex items-center gap-1 -ml-1">
                <ChevronDown size={16} className="group-open:rotate-180 transition-transform -rotate-90" />
                <span>Saved Filters</span>
                <span className="ml-1 px-1.5 py-0.5 text-[11px] rounded bg-page text-ink-600 font-semibold">4</span>
              </summary>
              <div className="pl-4 pb-3 space-y-2 text-[13.5px]">
                <button
                  type="button"
                  onClick={() => setSavedView('open')}
                  className={`block text-left hover:text-primary ${savedView === 'open' ? 'text-primary font-semibold' : 'text-ink-600'}`}
                >
                  My Open Leads
                </button>
                <button
                  type="button"
                  onClick={() => setSavedView('qualified')}
                  className={`block text-left hover:text-primary ${savedView === 'qualified' ? 'text-primary font-semibold' : 'text-ink-600'}`}
                >
                  Qualified This Month
                </button>
                <button
                  type="button"
                  onClick={() => setSavedView('today')}
                  className={`block text-left hover:text-primary ${savedView === 'today' ? 'text-primary font-semibold' : 'text-ink-600'}`}
                >
                  Today&apos;s Leads
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/leads/new')}
                  className="block text-left text-primary font-medium hover:underline pt-0.5 text-[13px]"
                >
                  + Create New Lead
                </button>
              </div>
            </details>

            {/* System Defined Filters */}
            <details className="group" open>
              <summary className="py-2.5 text-[14px] font-semibold text-ink cursor-pointer select-none flex items-center gap-1 -ml-1">
                <ChevronDown size={16} className="group-open:rotate-180 transition-transform -rotate-90" />
                System Defined Filters
              </summary>
              <div className="pl-5 pb-4 space-y-3">
                {['Activities', 'Email Sentiment', 'Latest Email Status', 'Touched Records', 'Untouched Records', 'Cadences'].map((lbl) => (
                  <label key={lbl} className="flex items-start gap-2.5 text-[13.5px] text-ink-600 cursor-pointer leading-snug">
                    <input
                      type="checkbox"
                      className="cb mt-0.5"
                      checked={sysFilters.has(lbl)}
                      onChange={() => {
                        setSysFilters((prev) => {
                          const next = new Set(prev);
                          if (next.has(lbl)) next.delete(lbl);
                          else next.add(lbl);
                          return next;
                        });
                        table.setPage(1);
                      }}
                    />
                    {lbl}
                  </label>
                ))}
              </div>
            </details>

            {/* Filter By Fields */}
            <details className="group" open>
              <summary className="py-2.5 text-[14px] font-semibold text-ink cursor-pointer select-none flex items-center gap-1 -ml-1">
                <ChevronDown size={16} className="group-open:rotate-180 transition-transform -rotate-90" />
                Filter By Fields
              </summary>
              <div className="pl-5 pb-4 space-y-3">
                {/* Lead Status */}
                <div className="space-y-1.5">
                  <label className="flex items-start gap-2.5 text-[13.5px] text-ink-600 cursor-pointer leading-snug">
                    <input
                      type="checkbox"
                      className="cb mt-0.5"
                      checked={f.status !== ''}
                      onChange={() => setFilter('status')(f.status ? '' : 'New')}
                    />
                    Lead Status
                  </label>
                  {f.status !== '' && (
                    <select
                      className="w-full h-8 px-2 text-[13px] border border-line rounded-md bg-white"
                      value={f.status}
                      onChange={(e) => setFilter('status')(e.target.value)}
                    >
                      <option value="">All Statuses</option>
                      {LEAD_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Lead Source */}
                <div className="space-y-1.5">
                  <label className="flex items-start gap-2.5 text-[13.5px] text-ink-600 cursor-pointer leading-snug">
                    <input
                      type="checkbox"
                      className="cb mt-0.5"
                      checked={f.source !== ''}
                      onChange={() => setFilter('source')(f.source ? '' : sourceList[0])}
                    />
                    Lead Source
                  </label>
                  {f.source !== '' && (
                    <select
                      className="w-full h-8 px-2 text-[13px] border border-line rounded-md bg-white"
                      value={f.source}
                      onChange={(e) => setFilter('source')(e.target.value)}
                    >
                      <option value="">All Sources</option>
                      {sourceList.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Lead Owner */}
                <div className="space-y-1.5">
                  <label className="flex items-start gap-2.5 text-[13.5px] text-ink-600 cursor-pointer leading-snug">
                    <input
                      type="checkbox"
                      className="cb mt-0.5"
                      checked={f.owner !== ''}
                      onChange={() => setFilter('owner')(f.owner ? '' : ownerOptions[0]?.value)}
                    />
                    Lead Owner
                  </label>
                  {f.owner !== '' && (
                    <select
                      className="w-full h-8 px-2 text-[13px] border border-line rounded-md bg-white"
                      value={f.owner}
                      onChange={(e) => setFilter('owner')(e.target.value)}
                    >
                      <option value="">All Owners</option>
                      {ownerOptions.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* City */}
                <div className="space-y-1.5">
                  <label className="flex items-start gap-2.5 text-[13.5px] text-ink-600 cursor-pointer leading-snug">
                    <input
                      type="checkbox"
                      className="cb mt-0.5"
                      checked={f.city !== ''}
                      onChange={() => setFilter('city')(f.city ? '' : 'Chennai')}
                    />
                    City
                  </label>
                  {f.city !== '' && (
                    <select
                      className="w-full h-8 px-2 text-[13px] border border-line rounded-md bg-white"
                      value={f.city}
                      onChange={(e) => setFilter('city')(e.target.value)}
                    >
                      <option value="">All Cities</option>
                      {cityList.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Tag */}
                <div className="space-y-1.5">
                  <label className="flex items-start gap-2.5 text-[13.5px] text-ink-600 cursor-pointer leading-snug">
                    <input
                      type="checkbox"
                      className="cb mt-0.5"
                      checked={f.tag !== ''}
                      onChange={() => setFilter('tag')(f.tag ? '' : LEAD_TAGS[0])}
                    />
                    Tags
                  </label>
                  {f.tag !== '' && (
                    <select
                      className="w-full h-8 px-2 text-[13px] border border-line rounded-md bg-white"
                      value={f.tag}
                      onChange={(e) => setFilter('tag')(e.target.value)}
                    >
                      <option value="">All Tags</option>
                      {LEAD_TAGS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </details>
          </aside>
        )}

        {/* Right Table Area */}
        <div className="flex-1 min-w-0">
          <section className="card overflow-hidden">
            <BulkBar count={selectedIds.length} onClear={table.clearSelection}>
              <BulkButton onClick={() => setBulk('status')}>Change status</BulkButton>
              <BulkButton icon={UserCog} onClick={() => setBulk('owner')}>Change owner</BulkButton>
              <BulkButton icon={Download} onClick={() => exportRows(leads.filter((l) => table.selected.has(l.id)))}>
                Export
              </BulkButton>
              <BulkButton
                icon={Trash2}
                danger
                onClick={() => setConfirm({ ids: selectedIds, label: `${selectedIds.length} leads` })}
              >
                Delete
              </BulkButton>
            </BulkBar>

            {layout === 'list' && (
              <DataTable
                columns={columns}
                rows={table.pageRows}
                table={table}
                loading={refreshing}
                dense={dense}
                minWidth={1220}
                onRowClick={(l) => navigate(`/leads/${l.id}`)}
                emptyAction={
                  <button className="btn-primary mt-2 h-9" onClick={() => navigate('/leads/new')}>
                    <Plus size={16} />
                    Create Lead
                  </button>
                }
              />
            )}

            {layout === 'kanban' && (
              <div className="p-3">
                <p className="text-[12.5px] text-ink-500 mb-2.5">
                  Drag a lead card to another column to update its Lead Status in real time.
                </p>
                <KanbanView
                  groups={kanbanStages.map((s) => ({ key: s, label: s, color: KANBAN_COLORS[s] || '#2F7BF5' }))}
                  rows={table.sorted}
                  groupOf={(l) => (kanbanStages.includes(l.status) ? l.status : 'New')}
                  onMove={(l, status) => updateRecord('leads', l.id, { status })}
                  onCardClick={(l) => navigate(`/leads/${l.id}`)}
                  summary={(items) => `${items.length} lead${items.length === 1 ? '' : 's'}`}
                  renderCard={(l) => (
                    <div>
                      <div className="text-[13.5px] font-semibold text-ink leading-snug">{l.name}</div>
                      <div className="text-[12px] text-ink-500 mt-0.5 truncate">
                        {l.company || 'Enterprise'} · {l.city || 'Chennai'}
                      </div>
                      <div className="flex items-center justify-between mt-2.5">
                        <StatusBadge kind="leadSource" value={leadSource(l) || 'Website'} size="sm" />
                        <UserAvatar userId={l.ownerId || 'u4'} size={24} />
                      </div>
                    </div>
                  )}
                />
              </div>
            )}

            {layout === 'grid' && (
              <div className="p-3">
                <GridView
                  rows={table.pageRows}
                  onCardClick={(l) => navigate(`/leads/${l.id}`)}
                  renderCard={(l) => (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <PersonAvatar name={l.name} size={38} />
                          <div className="min-w-0">
                            <div className="font-semibold text-ink truncate">{l.name}</div>
                            <div className="text-[12.5px] text-ink-500 truncate">{l.company || 'Client'}</div>
                          </div>
                        </div>
                        {statusDropdown(l)}
                      </div>
                      <div className="mt-3 text-[12.5px] text-ink-600 space-y-1">
                        <div>{l.mobile || l.phone}</div>
                        <div className="truncate">{l.email || '—'}</div>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-[12px] text-ink-500">
                        <span>{l.city || 'Chennai'}</span>
                        <UserAvatar userId={l.ownerId || 'u4'} size={24} withName />
                      </div>
                    </>
                  )}
                />
              </div>
            )}

            {layout === 'chart' && (
              <ChartView
                title="Leads by Status (Real-Time)"
                data={kanbanStages.map((s) => ({
                  name: s,
                  value: filtered.filter((l) => l.status === s).length,
                  color: KANBAN_COLORS[s] || '#2F7BF5',
                }))}
                valueLabel="Leads"
              />
            )}

            {(layout === 'list' || layout === 'grid') && (
              <div className="px-4">
                <Pagination table={table} noun="leads" />
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Bulk Update Modal */}
      <FormModal
        open={!!bulk}
        onClose={() => setBulk(null)}
        size="sm"
        title={bulk === 'owner' ? 'Change Lead Owner' : 'Change Lead Status'}
        subtitle={`Applies to ${selectedIds.length} selected leads.`}
        fields={[
          bulk === 'owner'
            ? { name: 'value', label: 'New Owner', type: 'select', options: ownerOptions, required: true, span: 2 }
            : { name: 'value', label: 'Lead Status', type: 'select', options: LEAD_STATUSES, required: true, span: 2 },
        ]}
        initial={bulk ? { value: '' } : null}
        submitLabel="Apply"
        onSubmit={({ value }) => {
          selectedIds.forEach((id) => {
            updateRecord('leads', id, bulk === 'owner' ? { ownerId: value } : { status: value });
          });
          setBulk(null);
          table.clearSelection();
        }}
      />

      {/* Convert Lead Modal */}
      <FormModal
        open={!!convertingLead}
        onClose={() => setConvertingLead(null)}
        size="md"
        title={convertingLead ? `Convert Lead — ${convertingLead.name}` : 'Convert Lead'}
        subtitle="Creates a new Account, Contact, and Deal in Zoho CRM."
        fields={[
          { name: 'dealName', label: 'Deal Name', required: true, span: 2 },
          { name: 'amount', label: 'Expected Deal Amount (₹)', type: 'number', min: 1000, required: true },
          {
            name: 'stage',
            label: 'Initial Deal Stage',
            type: 'select',
            options: ['Qualification', 'Needs Analysis', 'Proposal', 'Negotiation', 'Closed Won'],
            required: true,
          },
        ]}
        initial={
          convertingLead
            ? {
                dealName: `${convertingLead.company || convertingLead.name} - Enterprise Deal`,
                amount: 450000,
                stage: 'Proposal',
              }
            : null
        }
        submitLabel="Convert Lead"
        onSubmit={(vals) => {
          if (convertingLead) {
            convertLead(convertingLead.id, vals);
            setConvertingLead(null);
          }
        }}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="Delete leads?"
        message={confirm ? `Delete ${confirm.label}? Dashboard and Lead analytics will update immediately.` : ''}
        onConfirm={() => {
          deleteRecords('leads', confirm.ids);
          table.clearSelection();
        }}
      />
    </div>
  );
}
