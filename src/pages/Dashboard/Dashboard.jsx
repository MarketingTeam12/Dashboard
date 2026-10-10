import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone, PhoneCall, PhoneMissed, Clock3, Coins, Plus, RotateCw,
  Filter, ChevronDown, Search, Users, Award, Handshake, Download, Eye, Pencil
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import useTable from '../../components/common/useTable';
import StatusBadge from '../../components/common/StatusBadge';
import { UserAvatar } from '../../components/common/Avatar';
import Modal from '../../components/common/Modal';
import { useRefresh } from '../../components/common/hooks';
import { fmtCompact, fmtINR, STAGES } from '../../utils/calculations';
import { exportCSV } from '../../utils/exportCSV';

// Base Zoho CRM Call Dashboard rows from Image 4 reference
const BASE_CALL_OWNERS = [
  { id: 'co-1', callOwner: 'Sales Team', attendedCount: 29250, unattendedCount: 41679, durationSec: 1273915, ownerId: 'u1' },
  { id: 'co-2', callOwner: 'Monisha .', attendedCount: 10598, unattendedCount: 8884, durationSec: 526319, ownerId: 'u2' },
  { id: 'co-3', callOwner: 'Dirshya MV', attendedCount: 6908, unattendedCount: 11130, durationSec: 397174, ownerId: 'u3' },
  { id: 'co-4', callOwner: 'Janani .', attendedCount: 8015, unattendedCount: 8756, durationSec: 454492, ownerId: 'u4' },
  { id: 'co-5', callOwner: 'Kumutha T', attendedCount: 5637, unattendedCount: 10364, durationSec: 322082, ownerId: 'u5' },
  { id: 'co-6', callOwner: 'Victoria', attendedCount: 6420, unattendedCount: 5647, durationSec: 384085, ownerId: 'u1' },
  { id: 'co-7', callOwner: 'Somya Ajeeth', attendedCount: 6120, unattendedCount: 5528, durationSec: 356683, ownerId: 'u2' },
  { id: 'co-8', callOwner: 'Ritu .', attendedCount: 4110, unattendedCount: 3630, durationSec: 195136, ownerId: 'u3' },
];

export default function Dashboard() {
  const crm = useCRM();
  const navigate = useNavigate();
  const { leads = [], deals = [], calls = [], tasks = [], notify } = crm;
  const { refreshing, refresh } = useRefresh('Dashboards');

  const [savedView, setSavedView] = useState('call_dashboard');
  const [layout, setLayout] = useState('list');
  const [dense, setDense] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [search, setSearch] = useState('');

  // Top Zoho CRM Dashboard Filter Bar (from Image 4)
  const [callOwnerFilter, setCallOwnerFilter] = useState('');
  const [callStartTimeFilter, setCallStartTimeFilter] = useState('Any Time');
  const [createdTimeFilter, setCreatedTimeFilter] = useState('Any Time');
  const [isCreateDashboardOpen, setIsCreateDashboardOpen] = useState(false);
  const [isAddComponentOpen, setIsAddComponentOpen] = useState(false);
  const [newDashName, setNewDashName] = useState('');
  const [customDashboards, setCustomDashboards] = useState([]);

  const views = [
    { key: 'call_dashboard', label: '★ Call Dashboard For All Users', count: BASE_CALL_OWNERS.length },
    { key: 'sales_pipeline', label: 'Executive Sales & Deals Dashboard', count: deals.length },
    { key: 'lead_velocity', label: 'Lead Acquisition & Velocity Dashboard', count: leads.length },
    ...customDashboards,
  ];

  // Combine base Zoho Call rows with live calls logged in CRMContext
  const callOwnerRows = useMemo(() => {
    const extraCalls = calls.length;
    const extraDur = calls.reduce((s, c) => s + (Number(c.duration) || 0), 0);
    return BASE_CALL_OWNERS.map((r, idx) => {
      const bonusCount = idx === 0 ? extraCalls : 0;
      const bonusDur = idx === 0 ? extraDur : 0;
      const recordCount = r.attendedCount + r.unattendedCount + bonusCount;
      const sumDuration = r.durationSec + bonusDur;
      return {
        ...r,
        recordCount,
        sumDuration,
      };
    }).filter((r) => {
      if (callOwnerFilter && r.callOwner !== callOwnerFilter) return false;
      if (search && !r.callOwner.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [calls, callOwnerFilter, search]);

  const totals = useMemo(() => {
    return callOwnerRows.reduce(
      (acc, r) => ({
        recordCount: acc.recordCount + r.recordCount,
        attendedCount: acc.attendedCount + r.attendedCount,
        unattendedCount: acc.unattendedCount + r.unattendedCount,
        sumDuration: acc.sumDuration + r.sumDuration,
      }),
      { recordCount: 0, attendedCount: 0, unattendedCount: 0, sumDuration: 0 }
    );
  }, [callOwnerRows]);

  const totalPipelineValue = useMemo(
    () => deals.reduce((s, d) => s + (Number(d.amount) || 0), 0),
    [deals]
  );

  const table = useTable(callOwnerRows, { pageSize: 10 });

  const exportRows = () =>
    exportCSV('call_dashboard', callOwnerRows, [
      { label: 'Call Owner', value: (r) => r.callOwner },
      { label: 'Record Count', value: (r) => r.recordCount },
      { label: 'Attended Calls', value: (r) => r.attendedCount },
      { label: 'Unattended Calls', value: (r) => r.unattendedCount },
      { label: 'Sum Of Call Duration (In Seconds)', value: (r) => r.sumDuration },
    ]);

  // Columns for 1. Overall call count (Image 4 + Image 2 UI style)
  const columns = [
    {
      key: 'callOwner',
      header: 'Call Owner',
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <UserAvatar userId={r.ownerId} size={30} />
          <span className="font-semibold text-primary hover:underline cursor-pointer" onClick={() => navigate('/calls')}>
            {r.callOwner}
          </span>
        </div>
      ),
    },
    {
      key: 'recordCount',
      header: 'Record Count',
      sortable: true,
      align: 'right',
      render: (r) => <span className="font-bold text-ink tabular-nums">{r.recordCount.toLocaleString('en-IN')}</span>,
    },
    {
      key: 'attendedCount',
      header: 'Attended Calls',
      sortable: true,
      align: 'right',
      render: (r) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-[#DFF6EA] text-[#0E9F5E] font-semibold text-[12.5px] tabular-nums">
          {r.attendedCount.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'unattendedCount',
      header: 'Un-Attended Calls',
      sortable: true,
      align: 'right',
      render: (r) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-[#FFE4E6] text-[#E5293A] font-semibold text-[12.5px] tabular-nums">
          {r.unattendedCount.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'sumDuration',
      header: 'Sum Of Call Duration (In Seconds)',
      sortable: true,
      align: 'right',
      render: (r) => <span className="font-semibold text-ink tabular-nums">{r.sumDuration.toLocaleString('en-IN')}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      sortable: false,
      render: (r) => (
        <div className="flex items-center justify-center gap-1.5">
          <button className="icon-btn-primary" onClick={() => navigate('/calls')} title="Inspect Calls">
            <Eye size={17} />
          </button>
        </div>
      ),
    },
  ];

  const handleCreateDashboard = (e) => {
    e.preventDefault();
    if (!newDashName.trim()) return;
    const key = `dash-${Date.now()}`;
    setCustomDashboards((prev) => [...prev, { key, label: `★ ${newDashName.trim()}`, count: leads.length }]);
    setSavedView(key);
    setNewDashName('');
    setIsCreateDashboardOpen(false);
    notify('Custom dashboard created', 'success');
  };

  return (
    <div className="flex flex-col gap-3">
      {/* PageHeader matching Image 2 (Deals.jsx) + Image 4 actions */}
      <PageHeader
        views={views}
        view={savedView}
        onViewChange={setSavedView}
        tabMenu={[
          { label: 'Export Dashboard (CSV)', icon: Download, onClick: exportRows },
          { label: 'Add Component', icon: Plus, onClick: () => setIsAddComponentOpen(true) },
        ]}
        toolbar={{
          filterActive: filtersOpen,
          onFilter: () => setFiltersOpen((o) => !o),
          sortOptions: [
            { key: 'callOwner', label: 'Call Owner' },
            { key: 'recordCount', label: 'Record Count' },
            { key: 'sumDuration', label: 'Call Duration (Seconds)' },
          ],
          sort: table.sort,
          onSort: table.setSort,
          layouts: ['list', 'grid', 'chart'],
          layout,
          onLayout: setLayout,
          onRefresh: refresh,
          refreshing,
          dense,
          onDense: () => setDense((d) => !d),
          module: 'Calls',
          primary: {
            label: 'Create Dashboard',
            icon: Plus,
            onClick: () => setIsCreateDashboardOpen(true),
            menu: [
              { label: 'Create Dashboard', icon: Plus, onClick: () => setIsCreateDashboardOpen(true) },
              { label: 'Add Component', icon: Plus, onClick: () => setIsAddComponentOpen(true) },
              { label: 'Export Dashboard (CSV)', icon: Download, onClick: exportRows },
            ],
          },
        }}
      />

      {/* Top Zoho CRM "Filter By" Bar from Image 4 */}
      <div className="card px-4 py-3 flex flex-wrap items-end gap-3">
        <div className="text-[13.5px] font-semibold text-ink pb-2 mr-1">Filter By :</div>
        <div className="min-w-[200px]">
          <div className="text-[11.5px] font-medium text-ink-500 mb-1">Call Owner (Calls)</div>
          <select
            value={callOwnerFilter}
            onChange={(e) => setCallOwnerFilter(e.target.value)}
            className="w-full h-9 px-3 rounded-lg border border-line bg-white text-[13.5px] text-ink"
          >
            <option value="">Click to Select Users (All Users)</option>
            {BASE_CALL_OWNERS.map((o) => (
              <option key={o.id} value={o.callOwner}>
                {o.callOwner}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[180px]">
          <div className="text-[11.5px] font-medium text-ink-500 mb-1">Call Start Time (Calls)</div>
          <select
            value={callStartTimeFilter}
            onChange={(e) => setCallStartTimeFilter(e.target.value)}
            className="w-full h-9 px-3 rounded-lg border border-line bg-white text-[13.5px] text-ink"
          >
            <option>Any Time</option>
            <option>Today</option>
            <option>This Week</option>
            <option>This Month</option>
          </select>
        </div>

        <div className="min-w-[180px]">
          <div className="text-[11.5px] font-medium text-ink-500 mb-1">Created Time (Calls)</div>
          <select
            value={createdTimeFilter}
            onChange={(e) => setCreatedTimeFilter(e.target.value)}
            className="w-full h-9 px-3 rounded-lg border border-line bg-white text-[13.5px] text-ink"
          >
            <option>Any Time</option>
            <option>Today</option>
            <option>This Month</option>
            <option>This Quarter</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => notify('Dashboard filters applied', 'success')}
            className="h-9 px-4 rounded-lg bg-primary text-white text-[13.5px] font-semibold hover:bg-primary-600 transition"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={() => {
              setCallOwnerFilter('');
              setCallStartTimeFilter('Any Time');
              setCreatedTimeFilter('Any Time');
            }}
            className="h-9 px-3.5 rounded-lg border border-line bg-white text-ink-600 text-[13.5px] font-medium hover:bg-page"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => setIsAddComponentOpen(true)}
            className="h-9 px-3.5 rounded-lg border border-line bg-white text-ink text-[13.5px] font-medium hover:bg-page"
          >
            Add Component
          </button>
        </div>
      </div>

      {/* 5 StatCards matching Image 2 (Deals.jsx) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-3 mb-3">
        <StatCard
          icon={Phone}
          tone="violet"
          label="1. Overall Call Count"
          value={totals.recordCount.toLocaleString('en-IN')}
          trend={{ up: true, value: 18 }}
          spark={[120, 140, 155, 168, 181]}
        />
        <StatCard
          icon={PhoneCall}
          tone="green"
          tinted
          label="3. Overall Attend Calls"
          value={totals.attendedCount.toLocaleString('en-IN')}
          trend={{ up: true, value: 24 }}
          spark={[45, 52, 60, 68, 77]}
        />
        <StatCard
          icon={PhoneMissed}
          tone="red"
          tinted
          label="2. Overall Un Attend Calls"
          value={totals.unattendedCount.toLocaleString('en-IN')}
          trend={{ up: false, value: 9 }}
          invertTrend
          spark={[110, 105, 98, 92, 85]}
        />
        <StatCard
          icon={Clock3}
          tone="amber"
          tinted
          label="Sum Of Call Duration (Sec)"
          value={totals.sumDuration.toLocaleString('en-IN')}
          trend={{ up: true, value: 21 }}
          spark={[210, 260, 310, 355, 406]}
        />
        <StatCard
          icon={Coins}
          tone="blue"
          tinted
          label={`Pipeline (${deals.length} Deals)`}
          value={fmtCompact(totalPipelineValue)}
          trend={{ up: true, value: 29 }}
          spark={[10, 12, 13, 14, 15]}
          onClick={() => navigate('/deals')}
        />
      </div>

      {/* Main Split View: Left Filter Sidebar + Right Zoho CRM Dashboard Components (Image 4 + Image 2 UI) */}
      <div className="flex gap-3 items-start">
        {filtersOpen && (
          <aside className="card hidden md:block w-[220px] shrink-0 px-3.5 py-4 sticky top-[72px] max-h-[calc(100vh-86px)] overflow-y-auto thin-scroll">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-semibold text-ink whitespace-nowrap">Filter Dashboards</h2>
              {(callOwnerFilter || search) && (
                <button
                  type="button"
                  onClick={() => {
                    setCallOwnerFilter('');
                    setSearch('');
                  }}
                  className="text-[12.5px] text-primary hover:underline"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="relative mb-5">
              <Search className="absolute left-2.5 top-2.5 text-ink-400" size={14} />
              <input
                type="text"
                placeholder="Search Call Owner..."
                className="w-full h-9 pl-8 pr-3 text-[13px] border border-line rounded-md focus:border-primary outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <details className="group" open>
              <summary className="py-2.5 text-[14px] font-semibold text-ink cursor-pointer select-none flex items-center gap-1 -ml-1">
                <ChevronDown size={16} className="group-open:rotate-180 transition-transform -rotate-90" />
                Dashboard Views
              </summary>
              <div className="pl-2 pb-4 space-y-1.5">
                {views.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => setSavedView(v.key)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md text-[13px] transition ${
                      savedView === v.key ? 'bg-primary-50 text-primary font-semibold' : 'text-ink-600 hover:bg-page'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </details>

            <details className="group" open>
              <summary className="py-2.5 text-[14px] font-semibold text-ink cursor-pointer select-none flex items-center gap-1 -ml-1 border-t border-line">
                <ChevronDown size={16} className="group-open:rotate-180 transition-transform -rotate-90" />
                Call Owners
              </summary>
              <div className="pl-4 pb-4 space-y-2.5">
                {BASE_CALL_OWNERS.map((o) => (
                  <label key={o.id} className="flex items-start gap-2.5 text-[13.5px] text-ink-600 cursor-pointer leading-snug">
                    <input
                      type="checkbox"
                      className="cb mt-0.5"
                      checked={callOwnerFilter === o.callOwner}
                      onChange={() => setCallOwnerFilter(callOwnerFilter === o.callOwner ? '' : o.callOwner)}
                    />
                    {o.callOwner}
                  </label>
                ))}
              </div>
            </details>
          </aside>
        )}

        {/* Right Content Area */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Component 1: 1.Overall call count (Exact match to Image 4 in Image 2 card style) */}
          <section className="card overflow-hidden">
            <div className="px-4 py-3.5 border-b border-line flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <h3 className="text-[15.5px] font-bold text-ink">1. Overall Call Count</h3>
                <button
                  type="button"
                  onClick={refresh}
                  className="p-1 text-ink-400 hover:text-primary rounded"
                  title="Refresh component"
                >
                  <RotateCw size={14} className={refreshing ? 'animate-spin' : ''} />
                </button>
              </div>
              <span className="text-[13px] text-ink-500">
                Total Record Count: <strong className="text-ink">{totals.recordCount.toLocaleString('en-IN')}</strong> • Duration:{' '}
                <strong className="text-ink">{totals.sumDuration.toLocaleString('en-IN')}s</strong>
              </span>
            </div>

            <DataTable
              columns={columns}
              rows={table.pageRows}
              table={table}
              loading={refreshing}
              dense={dense}
              minWidth={900}
            />

            {/* Total Summary Footer Row matching Image 4 */}
            <div className="px-5 py-3 bg-[#F5F8FD] border-t border-line flex items-center justify-between text-[13.5px] font-bold text-ink">
              <span>Total ({callOwnerRows.length} Call Owners)</span>
              <div className="flex items-center gap-8">
                <span>Record Count: {totals.recordCount.toLocaleString('en-IN')}</span>
                <span>Sum Of Call Duration: {totals.sumDuration.toLocaleString('en-IN')} sec</span>
              </div>
            </div>
          </section>

          {/* Components 2 & 3 Side-by-Side: 2.Overall Un Attend Calls & 3.Overall Attend Calls (Image 4) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 2. Overall Un Attend Calls */}
            <section className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-line flex items-center justify-between">
                <h3 className="text-[15px] font-bold text-ink">2. Overall Un Attend Calls</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-[#FFE4E6] text-[#E5293A]">
                  Total: {totals.unattendedCount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[13.5px]">
                  <thead>
                    <tr className="bg-[#F5F8FD] text-left text-ink-600 border-b border-line">
                      <th className="py-2.5 px-4 font-semibold">Call Owner</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Record Count</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Sum Of Call Duration (Sec)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {callOwnerRows.map((r) => (
                      <tr key={r.id} className="hover:bg-[#F8FAFE]">
                        <td className="py-2.5 px-4 font-medium text-ink">{r.callOwner}</td>
                        <td className="py-2.5 px-4 text-right font-semibold text-[#E5293A] tabular-nums">
                          {r.unattendedCount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-4 text-right text-ink-500 tabular-nums">0</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 3. Overall Attend Calls */}
            <section className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-line flex items-center justify-between">
                <h3 className="text-[15px] font-bold text-ink">3. Overall Attend Calls</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-[#DFF6EA] text-[#0E9F5E]">
                  Total: {totals.attendedCount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[13.5px]">
                  <thead>
                    <tr className="bg-[#F5F8FD] text-left text-ink-600 border-b border-line">
                      <th className="py-2.5 px-4 font-semibold">Call Owner</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Record Count</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Sum Of Call Duration (Sec)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {callOwnerRows.map((r) => (
                      <tr key={r.id} className="hover:bg-[#F8FAFE]">
                        <td className="py-2.5 px-4 font-medium text-ink">{r.callOwner}</td>
                        <td className="py-2.5 px-4 text-right font-semibold text-[#0E9F5E] tabular-nums">
                          {r.attendedCount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-4 text-right font-semibold text-ink tabular-nums">
                          {r.sumDuration.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Component 4: Live Recent Leads & Deals Pipeline Summary */}
          <section className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-line flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-ink">4. Live Recent Leads ({leads.length} Total)</h3>
              <button
                type="button"
                onClick={() => navigate('/leads/new')}
                className="px-3 py-1.5 rounded-lg bg-primary text-white text-[13px] font-semibold hover:bg-primary-600"
              >
                + Create Lead
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13.5px]">
                <thead>
                  <tr className="bg-[#F5F8FD] text-left text-ink-600 border-b border-line">
                    <th className="py-2.5 px-4 font-semibold">Lead Name</th>
                    <th className="py-2.5 px-4 font-semibold">Company</th>
                    <th className="py-2.5 px-4 font-semibold">Lead Source</th>
                    <th className="py-2.5 px-4 font-semibold">Status</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {leads.slice(0, 5).map((l) => (
                    <tr key={l.id} className="hover:bg-[#F8FAFE] cursor-pointer" onClick={() => navigate(`/leads/${l.id}`)}>
                      <td className="py-2.5 px-4 font-semibold text-primary hover:underline">{l.name}</td>
                      <td className="py-2.5 px-4 text-ink-600">{l.company || '—'}</td>
                      <td className="py-2.5 px-4 text-ink-600">{l.source || 'Direct'}</td>
                      <td className="py-2.5 px-4">
                        <StatusBadge value={l.status || 'New'} size="sm" />
                      </td>
                      <td className="py-2.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button className="icon-btn-primary" onClick={() => navigate(`/leads/${l.id}`)}>
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      {/* Create Dashboard Modal */}
      <Modal
        open={isCreateDashboardOpen}
        onClose={() => setIsCreateDashboardOpen(false)}
        title="Create New Dashboard"
        size="sm"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setIsCreateDashboardOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="create-dash-form" className="btn-primary">
              Create Dashboard
            </button>
          </>
        }
      >
        <form id="create-dash-form" onSubmit={handleCreateDashboard} className="space-y-3">
          <label className="label">Dashboard Name *</label>
          <input
            required
            placeholder="e.g. Regional Call & Deal Dashboard"
            value={newDashName}
            onChange={(e) => setNewDashName(e.target.value)}
            className="input text-[13.5px]"
          />
        </form>
      </Modal>

      {/* Add Component Modal */}
      <Modal
        open={isAddComponentOpen}
        onClose={() => setIsAddComponentOpen(false)}
        title="Add Dashboard Component"
        size="sm"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setIsAddComponentOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setIsAddComponentOpen(false);
                notify('Component added to dashboard', 'success');
              }}
            >
              Add Component
            </button>
          </>
        }
      >
        <div className="space-y-2.5 text-[13.5px]">
          {['Overall Call Count Table', 'Un-Attended Calls Summary', 'Attended Calls Duration', 'Deals Stage Funnel'].map((c, i) => (
            <label key={c} className="flex items-center gap-2.5 p-2.5 rounded-lg border border-line hover:bg-page cursor-pointer">
              <input type="checkbox" defaultChecked={i < 3} className="cb" />
              <span className="font-medium text-ink">{c}</span>
            </label>
          ))}
        </div>
      </Modal>
    </div>
  );
}
