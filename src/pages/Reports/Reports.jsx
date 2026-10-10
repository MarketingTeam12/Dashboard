import { useMemo, useState } from 'react';
import {
  BarChart3, Star, Plus, Search, ChevronDown, Download,
  Eye, Folder, CheckCircle2, TrendingUp, FileSpreadsheet
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import { useCRM } from '../../context/CRMContext';
import { fmtINR, STAGES } from '../../utils/calculations';
import { exportCSV } from '../../utils/exportCSV';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import useTable from '../../components/common/useTable';
import StatusBadge from '../../components/common/StatusBadge';
import Modal, { Drawer, SectionTitle } from '../../components/common/Modal';
import { GridView } from '../../components/common/Views';

const TYPE_BADGE = {
  Standard: 'bg-blue-50 text-blue-700 border-blue-200',
  Custom: 'bg-purple-50 text-purple-700 border-purple-200',
};

const CHART_COLORS = ['#2F55D4', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

export default function Reports() {
  const crm = useCRM();
  const {
    reports = [],
    leads = [],
    deals = [],
    accounts = [],
    toggleFavoriteReport,
    createReport,
    notify,
  } = crm;

  const [view, setView] = useState('list');
  const [filterView, setFilterView] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('All Modules');
  const [typeFilter, setTypeFilter] = useState('All');
  const [filterSearch, setFilterSearch] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [openSections, setOpenSections] = useState({ module: true, type: true });

  const [viewingReport, setViewingReport] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newReportData, setNewReportData] = useState({
    name: '',
    module: 'Deals',
    type: 'Custom',
    folder: 'Sales Reports',
    status: 'Active',
  });

  // Live report preview analytics generated from real CRM data
  const buildLivePreview = (rep) => {
    const mod = rep?.module || 'Deals';
    if (mod === 'Leads' || /lead/i.test(rep?.name || '')) {
      const map = {};
      leads.forEach((l) => {
        const src = l.source || 'Direct';
        map[src] = (map[src] || 0) + 1;
      });
      const data = Object.entries(map)
        .slice(0, 6)
        .map(([name, value], i) => ({ name, value, color: CHART_COLORS[i % CHART_COLORS.length] }));
      return {
        chartType: 'pie',
        data,
        kpis: [
          { label: 'Total Leads', value: leads.length },
          { label: 'Qualified Leads', value: leads.filter((l) => l.status === 'Qualified').length },
          { label: 'Top Channel', value: data[0]?.name || 'Direct' },
        ],
      };
    }

    const data = STAGES.slice(0, 5).map((st) => ({
      name: st,
      value: deals.filter((d) => d.stage === st).reduce((s, d) => s + (Number(d.amount) || 0), 0),
    }));
    const totalVal = deals.reduce((s, d) => s + (Number(d.amount) || 0), 0);
    return {
      chartType: 'bar',
      data,
      kpis: [
        { label: 'Total Pipeline', value: fmtINR(totalVal) },
        { label: 'Deals Count', value: deals.length },
        { label: 'Accounts Tracked', value: accounts.length },
      ],
    };
  };

  // Counts
  const counts = useMemo(() => {
    return {
      total: reports.length,
      starred: reports.filter((r) => r.starred).length,
      standard: reports.filter((r) => r.type === 'Standard').length,
      custom: reports.filter((r) => r.type === 'Custom').length,
      scheduled: reports.filter((r) => r.status === 'Scheduled' || r.status === 'Active').length,
    };
  }, [reports]);

  const views = useMemo(
    () => [
      { key: 'all', label: 'All Reports', count: counts.total },
      { key: 'starred', label: 'Starred Reports', count: counts.starred },
      { key: 'standard', label: 'Standard Reports', count: counts.standard },
      { key: 'custom', label: 'Custom Reports', count: counts.custom },
    ],
    [counts]
  );

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (filterView === 'starred' && !r.starred) return false;
      if (filterView === 'standard' && r.type !== 'Standard') return false;
      if (filterView === 'custom' && r.type !== 'Custom') return false;
      if (moduleFilter !== 'All Modules' && r.module !== moduleFilter) return false;
      if (typeFilter !== 'All' && r.type !== typeFilter) return false;
      return true;
    });
  }, [reports, filterView, moduleFilter, typeFilter]);

  const table = useTable(filteredReports, {
    searchKeys: ['name', 'module', 'folder', 'createdBy'],
    initialSort: { key: 'name', dir: 'asc' },
    pageSize: 10,
  });

  const handleCreateReport = (e) => {
    e.preventDefault();
    if (!newReportData.name.trim()) return;
    createReport?.({
      ...newReportData,
      createdBy: 'Sibi Chakaravarthi',
      lastAccessed: new Date().toLocaleDateString('en-GB'),
    });
    setIsCreateModalOpen(false);
    setNewReportData({ name: '', module: 'Deals', type: 'Custom', folder: 'Sales Reports', status: 'Active' });
    notify?.('Custom report created and linked to live CRM data', 'success');
  };

  const handleExportCSV = (rep) => {
    const preview = buildLivePreview(rep);
    exportCSV(
      `${rep.name.replace(/\s+/g, '_')}.csv`,
      preview.data,
      [
        { label: 'Category / Stage', value: (r) => r.name },
        { label: 'Value', value: (r) => r.value },
      ]
    );
    notify?.(`Exported "${rep.name}" to CSV`, 'success');
  };

  const columns = [
    {
      key: 'name',
      header: 'Report Name',
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavoriteReport?.(r.id);
            }}
            className="text-ink-400 hover:text-amber-500"
          >
            <Star size={15} className={r.starred ? 'fill-amber-400 text-amber-400' : ''} />
          </button>
          <div>
            <div className="font-semibold text-primary hover:underline text-[14px]">{r.name}</div>
            <div className="text-[12px] text-ink-400">Folder: {r.folder || 'Sales Reports'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'module',
      header: 'Module',
      render: (r) => <span className="text-[13.5px] font-medium text-ink">{r.module}</span>,
    },
    {
      key: 'type',
      header: 'Report Type',
      render: (r) => (
        <span
          className={`px-2.5 py-1 rounded-md text-[12px] font-semibold border ${
            TYPE_BADGE[r.type] || TYPE_BADGE.Standard
          }`}
        >
          {r.type}
        </span>
      ),
    },
    {
      key: 'createdBy',
      header: 'Created By',
      render: (r) => (
        <span className="text-[13.5px] text-ink-600">{r.createdBy || 'Sibi Chakaravarthi'}</span>
      ),
    },
    {
      key: 'lastAccessed',
      header: 'Last Accessed',
      render: (r) => <span className="text-[13.5px] text-ink-500">{r.lastAccessed || 'Today'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status || 'Active'} />,
    },
    {
      key: 'actions',
      header: '',
      sortable: false,
      align: 'right',
      render: (r) => (
        <div
          className="flex items-center justify-end gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => setViewingReport(r)}
            className="p-1.5 rounded hover:bg-page text-ink-400 hover:text-primary"
            title="Open Live Report"
          >
            <Eye size={15} />
          </button>
          <button
            type="button"
            onClick={() => handleExportCSV(r)}
            className="p-1.5 rounded hover:bg-page text-ink-400 hover:text-ink"
            title="Download CSV"
          >
            <Download size={15} />
          </button>
        </div>
      ),
    },
  ];

  const activePreview = viewingReport ? buildLivePreview(viewingReport) : null;

  return (
    <div className="space-y-4">
      <PageHeader
        views={views}
        activeView={filterView}
        onViewChange={setFilterView}
        primary={{
          label: 'Create Report',
          icon: Plus,
          onClick: () => setIsCreateModalOpen(true),
        }}
        toolbar={{
          search: table.search,
          onSearch: table.setSearch,
          view,
          onView: setView,
          enabledViews: ['list', 'grid'],
          onFilter: () => setShowFilters((s) => !s),
          filterCount: (moduleFilter !== 'All Modules' ? 1 : 0) + (typeFilter !== 'All' ? 1 : 0),
          onSort: () => table.toggleSort('name'),
          onRefresh: () => {},
        }}
      />

      {/* 5 Live StatCards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          label="Total Reports"
          value={counts.total}
          trend={{ up: true, value: '+10.2%' }}
          icon={BarChart3}
          tone="blue"
          spark={[6, 8, 9, 10, 11, 12, counts.total]}
        />
        <StatCard
          label="Starred Reports"
          value={counts.starred}
          trend={{ up: true, value: '+6.4%' }}
          icon={Star}
          tone="amber"
          spark={[2, 2, 3, 4, 4, 5, counts.starred]}
        />
        <StatCard
          label="Standard Reports"
          value={counts.standard}
          trend={{ up: true, value: '+4.1%' }}
          icon={FileSpreadsheet}
          tone="green"
          spark={[4, 5, 6, 6, 7, 8, counts.standard]}
        />
        <StatCard
          label="Custom Reports"
          value={counts.custom}
          trend={{ up: true, value: '+15.8%' }}
          icon={TrendingUp}
          tone="violet"
          spark={[1, 2, 2, 3, 4, 5, counts.custom]}
        />
        <StatCard
          label="Active & Scheduled"
          value={counts.scheduled}
          trend={{ up: true, value: '+9.5%' }}
          icon={CheckCircle2}
          tone="blue"
          spark={[5, 6, 7, 8, 9, 10, counts.scheduled]}
        />
      </div>

      {/* Main Split View */}
      <div className="flex gap-4 items-start">
        {showFilters && (
          <aside className="w-[260px] shrink-0 bg-white border border-line rounded-xl p-4 shadow-card select-none">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-bold text-ink">Filter Reports by</h3>
              {(filterView !== 'all' || moduleFilter !== 'All Modules' || typeFilter !== 'All') && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterView('all');
                    setModuleFilter('All Modules');
                    setTypeFilter('All');
                  }}
                  className="text-[12px] text-primary font-semibold hover:underline"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="relative mb-4">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type="text"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                placeholder="Search filters"
                className="w-full h-9 pl-8 pr-3 bg-white border border-line rounded-lg text-[13px] placeholder:text-ink-400 focus:outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-1.5 text-[13px] font-bold text-ink mb-2">
                  <Folder size={14} className="text-ink-400" />
                  <span>Saved Views</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pl-1">
                  {views.map((v) => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => setFilterView(v.key)}
                      className={`px-2.5 py-1 rounded-md text-[12px] font-medium border transition-colors ${
                        filterView === v.key
                          ? 'bg-primary text-white border-primary'
                          : 'border-line bg-page/60 text-ink-600 hover:border-primary hover:text-primary'
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              <hr className="border-line" />

              <div>
                <button
                  type="button"
                  onClick={() => setOpenSections((s) => ({ ...s, module: !s.module }))}
                  className="flex items-center gap-1 text-[13px] font-bold text-ink w-full text-left mb-2"
                >
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${openSections.module ? '' : '-rotate-90'}`}
                  />
                  <span>Filter By Module</span>
                </button>
                {openSections.module && (
                  <div className="space-y-1.5 pl-1">
                    {['All Modules', 'Deals', 'Leads', 'Contacts', 'Accounts', 'Calls']
                      .filter(
                        (m) =>
                          !filterSearch || m.toLowerCase().includes(filterSearch.toLowerCase())
                      )
                      .map((mod) => (
                        <label
                          key={mod}
                          className="flex items-center gap-2.5 py-1 px-1.5 rounded-md hover:bg-page cursor-pointer text-[13.5px] text-ink-600"
                        >
                          <input
                            type="checkbox"
                            checked={moduleFilter === mod}
                            onChange={() =>
                              setModuleFilter(moduleFilter === mod ? 'All Modules' : mod)
                            }
                            className="rounded border-ink-300 text-primary focus:ring-primary"
                          />
                          <span className={moduleFilter === mod ? 'font-semibold text-primary' : ''}>
                            {mod}
                          </span>
                        </label>
                      ))}
                  </div>
                )}
              </div>

              <hr className="border-line" />

              <div>
                <button
                  type="button"
                  onClick={() => setOpenSections((s) => ({ ...s, type: !s.type }))}
                  className="flex items-center gap-1 text-[13px] font-bold text-ink w-full text-left mb-2"
                >
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${openSections.type ? '' : '-rotate-90'}`}
                  />
                  <span>Report Type</span>
                </button>
                {openSections.type && (
                  <div className="space-y-1.5 pl-1">
                    {['All', 'Standard', 'Custom'].map((tp) => (
                      <label
                        key={tp}
                        className="flex items-center gap-2.5 py-1 px-1.5 rounded-md hover:bg-page cursor-pointer text-[13.5px] text-ink-600"
                      >
                        <input
                          type="checkbox"
                          checked={typeFilter === tp}
                          onChange={() => setTypeFilter(typeFilter === tp ? 'All' : tp)}
                          className="rounded border-ink-300 text-primary focus:ring-primary"
                        />
                        <span className={typeFilter === tp ? 'font-semibold text-primary' : ''}>
                          {tp}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </aside>
        )}

        <div className="flex-1 min-w-0">
          {view === 'list' && (
            <div className="card overflow-hidden">
              <DataTable
                columns={columns}
                rows={table.pageRows}
                table={table}
                onRowClick={(r) => setViewingReport(r)}
              />
              <Pagination table={table} />
            </div>
          )}

          {view === 'grid' && (
            <GridView
              rows={table.pageRows}
              onRowClick={(r) => setViewingReport(r)}
              renderCard={(r) => (
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-ink text-[14px]">{r.name}</div>
                    <StatusBadge status={r.status || 'Active'} />
                  </div>
                  <div className="text-[12.5px] text-ink-500 mt-1">
                    {r.module} • {r.folder}
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-line flex items-center justify-between text-[12.5px] text-ink-500">
                    <span>{r.type}</span>
                    <span>{r.lastAccessed || 'Today'}</span>
                  </div>
                </div>
              )}
            />
          )}
        </div>
      </div>

      {/* Live Report Drawer */}
      <Drawer
        open={!!viewingReport}
        onClose={() => setViewingReport(null)}
        title={viewingReport?.name}
        subtitle={`${viewingReport?.module} Module • ${viewingReport?.folder}`}
      >
        {viewingReport && activePreview && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              {activePreview.kpis.map((k, idx) => (
                <div key={idx} className="p-3.5 bg-page rounded-xl border border-line text-center">
                  <span className="text-[12px] text-ink-500 block">{k.label}</span>
                  <span className="text-[16px] font-bold text-ink mt-1 block">{k.value}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <SectionTitle>Live Visual Breakdown</SectionTitle>
              <div className="h-64 p-4 bg-white border border-line rounded-xl">
                <ResponsiveContainer width="100%" height="100%">
                  {activePreview.chartType === 'bar' ? (
                    <BarChart data={activePreview.data}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis fontSize={12} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                      <Tooltip formatter={(v) => fmtINR(v)} />
                      <Bar dataKey="value" fill="#2F55D4" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  ) : (
                    <PieChart>
                      <Tooltip />
                      <Pie
                        data={activePreview.data}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        dataKey="value"
                      >
                        {activePreview.data.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color || '#2F55D4'} />
                        ))}
                      </Pie>
                    </PieChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-line">
              <button
                type="button"
                onClick={() => handleExportCSV(viewingReport)}
                className="btn-primary"
              >
                <Download size={14} /> Export CSV
              </button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Create Report Modal */}
      <Modal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Custom Report"
        subtitle="Configure a live analytical report for your CRM module"
        size="md"
        footer={
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" form="create-rep-form" className="btn-primary">
              Create Report
            </button>
          </>
        }
      >
        <form id="create-rep-form" onSubmit={handleCreateReport} className="space-y-4">
          <div>
            <label className="label">Report Name *</label>
            <input
              required
              placeholder="e.g. Q4 Enterprise Pipeline Velocity"
              value={newReportData.name}
              onChange={(e) => setNewReportData({ ...newReportData, name: e.target.value })}
              className="input text-[13.5px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="label">Primary Module</label>
              <select
                value={newReportData.module}
                onChange={(e) => setNewReportData({ ...newReportData, module: e.target.value })}
                className="input text-[13.5px]"
              >
                <option value="Deals">Deals</option>
                <option value="Leads">Leads</option>
                <option value="Contacts">Contacts</option>
                <option value="Accounts">Accounts</option>
              </select>
            </div>
            <div>
              <label className="label">Report Folder</label>
              <select
                value={newReportData.folder}
                onChange={(e) => setNewReportData({ ...newReportData, folder: e.target.value })}
                className="input text-[13.5px]"
              >
                <option value="Sales Reports">Sales Reports</option>
                <option value="Lead Reports">Lead Reports</option>
                <option value="Executive Reports">Executive Reports</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
