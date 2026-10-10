import { useMemo, useState } from 'react';
import {
  BarChart3, Star, Plus, MoreHorizontal, Search, ChevronDown,
  ChevronLeft, ChevronRight, Download, Filter, Eye, RefreshCw,
  Folder, Calendar, CheckCircle2, TrendingUp, Sparkles, X
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import { useCRM } from '../../context/CRMContext';
import { fmtINR, fmtDate } from '../../utils/calculations';
import { exportCSV } from '../../utils/exportCSV';
import { Drawer, DetailGrid, SectionTitle } from '../../components/common/Modal';

const TYPE_BADGE = {
  Standard: 'bg-blue-50 text-blue-700 border-blue-200',
  Custom: 'bg-purple-50 text-purple-700 border-purple-200'
};

const STATUS_BADGE = {
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
  Inactive: 'bg-rose-50 text-rose-700 border-rose-200'
};

// Demo analytical data for report viewer
const REPORT_PREVIEWS = {
  'Sales Pipeline Summary': {
    chartType: 'bar',
    data: [
      { name: 'Qualification', value: 1050000 },
      { name: 'Needs Analysis', value: 800000 },
      { name: 'Proposal', value: 1200000 },
      { name: 'Negotiation', value: 950000 },
      { name: 'Closed Won', value: 4850000 }
    ],
    kpis: [
      { label: 'Total Pipeline', value: '₹ 88.5 L' },
      { label: 'Deals Count', value: '120' },
      { label: 'Avg Deal Size', value: '₹ 7.37 L' }
    ]
  },
  'Lead Source Analysis': {
    chartType: 'pie',
    data: [
      { name: 'Website', value: 80, color: '#2F7BF5' },
      { name: 'Referral', value: 50, color: '#12C26B' },
      { name: 'Social Media', value: 40, color: '#F59E0B' },
      { name: 'Email Campaign', value: 30, color: '#F43F5E' },
      { name: 'Direct Contact', value: 20, color: '#8E3CF2' }
    ],
    kpis: [
      { label: 'Total Leads', value: '250' },
      { label: 'Top Source', value: 'Website (32%)' },
      { label: 'Lead Velocity', value: '+18% MoM' }
    ]
  },
  'Revenue by Month': {
    chartType: 'line',
    data: [
      { name: 'May', value: 1500000 },
      { name: 'Jun', value: 2400000 },
      { name: 'Jul', value: 2900000 },
      { name: 'Aug', value: 3600000 },
      { name: 'Sep', value: 4200000 },
      { name: 'Oct', value: 4850000 }
    ],
    kpis: [
      { label: 'YTD Revenue', value: '₹ 1.94 Cr' },
      { label: 'Oct Revenue', value: '₹ 48.5 L' },
      { label: 'Growth Rate', value: '+20%' }
    ]
  }
};

export default function Reports() {
  const crm = useCRM();
  const { reports = [], toggleFavoriteReport, createReport, notify } = crm;

  const [filterView, setFilterView] = useState('All Reports');
  const [moduleFilter, setModuleFilter] = useState('All Modules');
  const [creatorFilter, setCreatorFilter] = useState('Created By');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals & Viewers
  const [viewingReport, setViewingReport] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newReportData, setNewReportData] = useState({
    name: '',
    module: 'Deals',
    type: 'Custom',
    folder: 'Sales Reports',
    status: 'Active'
  });

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (filterView === 'Starred' && !r.starred) return false;
      if (moduleFilter !== 'All Modules' && r.module !== moduleFilter) return false;
      if (creatorFilter !== 'Created By' && r.createdBy !== creatorFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const nm = (r.name || '').toLowerCase();
        const md = (r.module || '').toLowerCase();
        const fd = (r.folder || '').toLowerCase();
        if (!nm.includes(q) && !md.includes(q) && !fd.includes(q)) return false;
      }
      return true;
    });
  }, [reports, filterView, moduleFilter, creatorFilter, search]);

  const paginatedReports = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredReports.slice(start, start + pageSize);
  }, [filteredReports, page, pageSize]);

  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedReports.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedReports.map((r) => r.id)));
    }
  };

  const handleCreateReport = (e) => {
    e.preventDefault();
    if (!newReportData.name) return;
    createReport({
      ...newReportData,
      createdBy: 'Sibi Chakaravarthi',
      lastAccessed: '10/10/2026'
    });
    setIsCreateModalOpen(false);
    setNewReportData({
      name: '',
      module: 'Deals',
      type: 'Custom',
      folder: 'Sales Reports',
      status: 'Active'
    });
    notify('Report created successfully', 'success');
  };

  const handleExportCSV = (rep) => {
    const preview = REPORT_PREVIEWS[rep.name] || REPORT_PREVIEWS['Sales Pipeline Summary'];
    const rows = preview.data.map((d) => ({
      Metric: d.name,
      Value: d.value
    }));
    exportCSV(`${rep.name.replace(/\s+/g, '_')}.csv`, rows);
    notify('Report data exported to CSV', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-semibold shadow-inner">
            <BarChart3 size={26} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Reports</h1>
            <p className="text-sm text-slate-500">
              View and manage all your reports.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2F7BF5] hover:bg-blue-600 text-white text-xs font-semibold rounded-xl shadow-sm transition"
          >
            <Plus size={15} />
            <span>Create Report</span>
          </button>
          <button
            type="button"
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 transition"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Filter */}
            <select
              value={filterView}
              onChange={(e) => setFilterView(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="All Reports">All Reports</option>
              <option value="Starred">Starred Reports</option>
            </select>

            {/* Module Filter */}
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="All Modules">All Modules</option>
              <option value="Deals">Deals</option>
              <option value="Leads">Leads</option>
              <option value="Activities">Activities</option>
              <option value="Contacts">Contacts</option>
              <option value="Accounts">Accounts</option>
              <option value="Users">Users</option>
            </select>

            {/* Created By Filter */}
            <select
              value={creatorFilter}
              onChange={(e) => setCreatorFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="Created By">All Creators</option>
              <option value="Arun Kumar">Arun Kumar</option>
              <option value="Priya Sharma">Priya Sharma</option>
              <option value="Ravi Kumar">Ravi Kumar</option>
              <option value="Sneha R">Sneha R</option>
              <option value="Karthik S">Karthik S</option>
              <option value="Keerthi K">Keerthi K</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search reports..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#2F7BF5] w-52"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-[#2F7BF5] hover:bg-blue-600 rounded-xl shadow-sm transition"
            >
              <Plus size={14} />
              <span>Create Report</span>
            </button>

            <button
              type="button"
              className="p-1.5 text-slate-400 hover:text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
            >
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-medium">
                <th className="py-2.5 px-2 w-8">
                  <input
                    type="checkbox"
                    checked={selectedIds.size > 0 && selectedIds.size === paginatedReports.length}
                    onChange={toggleSelectAll}
                    className="rounded text-[#2F7BF5] focus:ring-[#2F7BF5]"
                  />
                </th>
                <th className="py-2.5 px-2 w-8"></th>
                <th className="py-2.5 px-2">Report Name</th>
                <th className="py-2.5 px-2">Module</th>
                <th className="py-2.5 px-2">Type</th>
                <th className="py-2.5 px-2">Folder</th>
                <th className="py-2.5 px-2">Last Accessed Date</th>
                <th className="py-2.5 px-2">Created By</th>
                <th className="py-2.5 px-2">Status</th>
                <th className="py-2.5 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedReports.map((rep) => {
                const isSelected = selectedIds.has(rep.id);
                return (
                  <tr
                    key={rep.id}
                    className={`hover:bg-slate-50/80 transition group ${isSelected ? 'bg-blue-50/40' : ''}`}
                  >
                    <td className="py-3 px-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(rep.id)}
                        className="rounded text-[#2F7BF5] focus:ring-[#2F7BF5]"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <button
                        type="button"
                        onClick={() => toggleFavoriteReport(rep.id)}
                        className="text-slate-300 hover:text-amber-400 transition"
                      >
                        <Star
                          size={15}
                          className={rep.starred ? 'fill-amber-400 text-amber-400' : ''}
                        />
                      </button>
                    </td>
                    <td className="py-3 px-2 font-medium text-slate-900">
                      <span
                        onClick={() => setViewingReport(rep)}
                        className="text-[#2F7BF5] hover:underline cursor-pointer font-medium"
                      >
                        {rep.name}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-slate-700 font-medium">{rep.module}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${TYPE_BADGE[rep.type] || 'bg-slate-100 text-slate-700'}`}>
                        {rep.type}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-slate-600">{rep.folder}</td>
                    <td className="py-3 px-2 text-slate-500 whitespace-nowrap">{rep.lastAccessed}</td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                          {(rep.createdBy || 'User')[0]}
                        </div>
                        <span className="font-medium text-slate-800">{rep.createdBy}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${STATUS_BADGE[rep.status] || 'bg-slate-100 text-slate-700'}`}>
                        {rep.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <div className="inline-flex items-center gap-1 opacity-80 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => setViewingReport(rep)}
                          className="p-1 text-slate-400 hover:text-[#2F7BF5] rounded"
                          title="View Analytics"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExportCSV(rep)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded"
                          title="Export CSV"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          type="button"
                          className="p-1 text-slate-400 hover:text-slate-700 rounded"
                        >
                          <MoreHorizontal size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
          <div>
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredReports.length)} of {filteredReports.length} reports
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded border border-slate-200"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-2 font-medium text-slate-800">{page}</span>
              <button
                type="button"
                disabled={page * pageSize >= filteredReports.length}
                onClick={() => setPage(page + 1)}
                className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded border border-slate-200"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Report Analytics Drawer */}
      {viewingReport && (
        <Drawer
          open={!!viewingReport}
          onClose={() => setViewingReport(null)}
          title={viewingReport.name}
          subtitle={`Module: ${viewingReport.module} • Folder: ${viewingReport.folder}`}
        >
          {(() => {
            const preview = REPORT_PREVIEWS[viewingReport.name] || REPORT_PREVIEWS['Sales Pipeline Summary'];
            return (
              <div className="space-y-6">
                {/* KPIs */}
                <div className="grid grid-cols-3 gap-3">
                  {preview.kpis.map((kpi, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                      <span className="text-[11px] text-slate-500 font-medium block">{kpi.label}</span>
                      <span className="text-base font-bold text-slate-900 mt-0.5 block">{kpi.value}</span>
                    </div>
                  ))}
                </div>

                {/* Analytical Visual Chart */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                  <span className="text-xs font-bold text-slate-800 block">Analytical Breakdown</span>
                  <div className="h-56 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      {preview.chartType === 'bar' ? (
                        <BarChart data={preview.data}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                          <XAxis dataKey="name" fontSize={10} stroke="#94A3B8" />
                          <YAxis fontSize={10} stroke="#94A3B8" tickFormatter={(v) => `₹${v / 100000}L`} />
                          <Tooltip formatter={(v) => [fmtINR(v), 'Value']} />
                          <Bar dataKey="value" fill="#2F7BF5" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      ) : preview.chartType === 'line' ? (
                        <LineChart data={preview.data}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                          <XAxis dataKey="name" fontSize={10} stroke="#94A3B8" />
                          <YAxis fontSize={10} stroke="#94A3B8" tickFormatter={(v) => `₹${v / 100000}L`} />
                          <Tooltip formatter={(v) => [fmtINR(v), 'Revenue']} />
                          <Line type="monotone" dataKey="value" stroke="#8E3CF2" strokeWidth={3} dot={{ r: 4 }} />
                        </LineChart>
                      ) : (
                        <PieChart>
                          <Tooltip formatter={(v, n) => [`${v} Leads`, n]} />
                          <Pie
                            data={preview.data}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={75}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {preview.data.map((e, i) => (
                              <Cell key={i} fill={e.color || '#2F7BF5'} />
                            ))}
                          </Pie>
                        </PieChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Data Records Summary */}
                <div className="space-y-2">
                  <SectionTitle>Summary Metrics</SectionTitle>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                    {preview.data.map((row, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2.5 bg-white hover:bg-slate-50">
                        <span className="font-medium text-slate-700">{row.name}</span>
                        <span className="font-bold text-slate-900">
                          {typeof row.value === 'number' && row.value > 1000 ? fmtINR(row.value) : row.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 flex justify-between items-center border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => handleExportCSV(viewingReport)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#2F7BF5] text-white hover:bg-blue-600 rounded-xl shadow-sm transition"
                  >
                    <Download size={14} />
                    <span>Export to CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewingReport(null)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Close
                  </button>
                </div>
              </div>
            );
          })()}
        </Drawer>
      )}

      {/* Create Report Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Create Custom Report</h3>
            <p className="text-xs text-slate-500 mb-4">Define a new analytical report for your CRM data.</p>

            <form onSubmit={handleCreateReport} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Report Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 Deal Velocity Matrix"
                  value={newReportData.name}
                  onChange={(e) => setNewReportData({ ...newReportData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#2F7BF5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Module</label>
                  <select
                    value={newReportData.module}
                    onChange={(e) => setNewReportData({ ...newReportData, module: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#2F7BF5]"
                  >
                    <option value="Deals">Deals</option>
                    <option value="Leads">Leads</option>
                    <option value="Activities">Activities</option>
                    <option value="Contacts">Contacts</option>
                    <option value="Accounts">Accounts</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Folder</label>
                  <select
                    value={newReportData.folder}
                    onChange={(e) => setNewReportData({ ...newReportData, folder: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#2F7BF5]"
                  >
                    <option value="Sales Reports">Sales Reports</option>
                    <option value="Lead Reports">Lead Reports</option>
                    <option value="Activity Reports">Activity Reports</option>
                    <option value="Deal Reports">Deal Reports</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-[#2F7BF5] text-white hover:bg-blue-600 rounded-xl shadow-sm"
                >
                  Save Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
