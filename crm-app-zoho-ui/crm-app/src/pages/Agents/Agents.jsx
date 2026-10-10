import { useMemo, useState } from 'react';
import {
  Bot, Play, Pause, Clock, Plus, Upload, Download, MoreHorizontal,
  Search, ChevronDown, ChevronLeft, ChevronRight, Eye, Pencil, Trash2,
  Sparkles, Zap, Activity, CheckCircle2, AlertCircle, RefreshCw, X, PlayCircle
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { Drawer, DetailGrid, SectionTitle } from '../../components/common/Modal';

function Sparkline({ color = '#2F7BF5', heights = [20, 35, 45, 30, 60, 80, 95] }) {
  return (
    <div className="flex items-end gap-1 h-8">
      {heights.map((h, i) => (
        <span
          key={i}
          className="w-1.5 rounded-t"
          style={{
            height: `${h}%`,
            backgroundColor: color,
            opacity: 0.25 + (i / heights.length) * 0.75
          }}
        />
      ))}
    </div>
  );
}

export default function Agents() {
  const crm = useCRM();
  const { agents = [], toggleAgent, runAgent, updateRecord, deleteRecords, notify } = crm;

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [deptFilter, setDeptFilter] = useState('All Departments');
  const [userFilter, setUserFilter] = useState('All Users');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals & Drawers
  const [viewingAgent, setViewingAgent] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newAgentData, setNewAgentData] = useState({
    name: '',
    description: '',
    type: 'Lead',
    department: 'Sales',
    status: 'Active',
    createdBy: 'Sibi Chakaravarthi'
  });

  // Calculate statistics
  const totalAgents = agents.length || 12;
  const activeCount = useMemo(() => agents.filter((a) => a.status === 'Active').length || 8, [agents]);
  const inactiveCount = useMemo(() => agents.filter((a) => a.status === 'Inactive').length || 3, [agents]);
  const totalTasksExecuted = useMemo(() => {
    return agents.reduce((acc, curr) => acc + (Number(curr.tasksExecuted) || 0), 0) || 1248;
  }, [agents]);

  // Filtered agents
  const filteredAgents = useMemo(() => {
    return agents.filter((a) => {
      if (typeFilter !== 'All Types' && a.type !== typeFilter) return false;
      if (statusFilter !== 'All Status' && a.status !== statusFilter) return false;
      if (deptFilter !== 'All Departments' && a.department !== deptFilter) return false;
      if (userFilter !== 'All Users' && a.createdBy !== userFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const nm = (a.name || '').toLowerCase();
        const desc = (a.description || '').toLowerCase();
        const tp = (a.type || '').toLowerCase();
        if (!nm.includes(q) && !desc.includes(q) && !tp.includes(q)) return false;
      }
      return true;
    });
  }, [agents, typeFilter, statusFilter, deptFilter, userFilter, search]);

  const paginatedAgents = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredAgents.slice(start, start + pageSize);
  }, [filteredAgents, page, pageSize]);

  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedAgents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedAgents.map((a) => a.id)));
    }
  };

  const handleCreateAgent = (e) => {
    e.preventDefault();
    if (!newAgentData.name) return;
    const newId = `ag-${Date.now()}`;
    const agentRecord = {
      id: newId,
      ...newAgentData,
      tasksExecuted: 0,
      lastRun: 'Just now',
      color: '#2F7BF5',
      icon: 'Bot'
    };
    crm.createRecord?.('agents', agentRecord);
    setIsCreateModalOpen(false);
    setNewAgentData({
      name: '',
      description: '',
      type: 'Lead',
      department: 'Sales',
      status: 'Active',
      createdBy: 'Sibi Chakaravarthi'
    });
    notify(`Agent "${agentRecord.name}" deployed successfully`, 'success');
  };

  const handleRunAgent = (agent) => {
    runAgent(agent.id);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2F7BF5] flex items-center justify-center font-semibold shadow-inner">
            <Bot size={26} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">AI Agents</h1>
            <p className="text-sm text-slate-500">
              Create, manage and monitor your AI agents.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => notify('Import templates loaded', 'info')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition"
          >
            <Upload size={14} />
            <span>Import</span>
          </button>
          <button
            type="button"
            onClick={() => notify('Agents exported successfully', 'info')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition"
          >
            <Download size={14} />
            <span>Export</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2F7BF5] hover:bg-blue-600 text-white text-xs font-semibold rounded-xl shadow-sm transition"
          >
            <Plus size={15} />
            <span>Create Agent</span>
          </button>
          <button
            type="button"
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 transition"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Agents */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition">
          <div className="space-y-1">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2F7BF5] flex items-center justify-center">
              <Bot size={20} />
            </div>
            <p className="text-xs font-medium text-slate-500 pt-1">Total Agents</p>
            <div className="text-2xl font-bold text-slate-900">{totalAgents}</div>
            <div className="text-xs font-semibold text-emerald-600">↑ 20%</div>
          </div>
          <Sparkline color="#2F7BF5" heights={[25, 40, 50, 35, 70, 85, 95]} />
        </div>

        {/* Active Agents */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition">
          <div className="space-y-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Play size={20} className="fill-emerald-600" />
            </div>
            <p className="text-xs font-medium text-slate-500 pt-1">Active Agents</p>
            <div className="text-2xl font-bold text-slate-900">{activeCount}</div>
            <div className="text-xs font-semibold text-emerald-600">↑ 14%</div>
          </div>
          <Sparkline color="#10B981" heights={[30, 45, 40, 60, 50, 75, 90]} />
        </div>

        {/* Inactive Agents */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition">
          <div className="space-y-1">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Pause size={20} className="fill-rose-600" />
            </div>
            <p className="text-xs font-medium text-slate-500 pt-1">Inactive Agents</p>
            <div className="text-2xl font-bold text-slate-900">{inactiveCount}</div>
            <div className="text-xs font-semibold text-rose-600">↓ 25%</div>
          </div>
          <Sparkline color="#F43F5E" heights={[40, 60, 55, 75, 65, 80, 95]} />
        </div>

        {/* Tasks Executed */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition">
          <div className="space-y-1">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={20} />
            </div>
            <p className="text-xs font-medium text-slate-500 pt-1">Tasks Executed</p>
            <div className="text-2xl font-bold text-slate-900">{totalTasksExecuted.toLocaleString()}</div>
            <div className="text-xs font-semibold text-emerald-600">↑ 32%</div>
          </div>
          <Sparkline color="#F59E0B" heights={[30, 40, 50, 60, 75, 85, 100]} />
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        {/* Filter Controls Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by agent name, description, type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#2F7BF5]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Agent Type */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="All Types">All Types</option>
              <option value="Lead">Lead</option>
              <option value="Engagement">Engagement</option>
              <option value="Analytics">Analytics</option>
              <option value="Communication">Communication</option>
              <option value="Productivity">Productivity</option>
              <option value="Reporting">Reporting</option>
              <option value="Data">Data</option>
              <option value="Support">Support</option>
              <option value="Scheduling">Scheduling</option>
              <option value="Automation">Automation</option>
            </select>

            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="All Status">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            {/* Department */}
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="All Departments">All Departments</option>
              <option value="Sales">Sales</option>
              <option value="Marketing">Marketing</option>
              <option value="Operations">Operations</option>
              <option value="Support">Support</option>
            </select>

            {/* Created By */}
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="All Users">All Users</option>
              <option value="Arun Kumar">Arun Kumar</option>
              <option value="Priya Sharma">Priya Sharma</option>
              <option value="Ravi Kumar">Ravi Kumar</option>
              <option value="Sneha R">Sneha R</option>
              <option value="Karthik S">Karthik S</option>
            </select>
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
                    checked={selectedIds.size > 0 && selectedIds.size === paginatedAgents.length}
                    onChange={toggleSelectAll}
                    className="rounded text-[#2F7BF5] focus:ring-[#2F7BF5]"
                  />
                </th>
                <th className="py-2.5 px-2">#</th>
                <th className="py-2.5 px-2">Agent Name</th>
                <th className="py-2.5 px-2">Description</th>
                <th className="py-2.5 px-2">Type</th>
                <th className="py-2.5 px-2">Department</th>
                <th className="py-2.5 px-2">Status</th>
                <th className="py-2.5 px-2">Last Run</th>
                <th className="py-2.5 px-2">Tasks Executed</th>
                <th className="py-2.5 px-2">Created By</th>
                <th className="py-2.5 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedAgents.map((ag, idx) => {
                const isSelected = selectedIds.has(ag.id);
                const isActive = ag.status === 'Active';
                return (
                  <tr
                    key={ag.id}
                    className={`hover:bg-slate-50/80 transition group ${isSelected ? 'bg-blue-50/40' : ''}`}
                  >
                    <td className="py-3 px-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(ag.id)}
                        className="rounded text-[#2F7BF5] focus:ring-[#2F7BF5]"
                      />
                    </td>
                    <td className="py-3 px-2 text-slate-400 font-medium">{idx + 1}</td>
                    <td className="py-3 px-2 font-medium text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm"
                          style={{ backgroundColor: ag.color || '#2F7BF5' }}
                        >
                          <Zap size={13} />
                        </div>
                        <span
                          onClick={() => setViewingAgent(ag)}
                          className="text-[#2F7BF5] hover:underline cursor-pointer font-semibold"
                        >
                          {ag.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-slate-600 max-w-xs truncate">{ag.description}</td>
                    <td className="py-3 px-2 text-slate-700 font-medium">{ag.type}</td>
                    <td className="py-3 px-2 text-slate-600">{ag.department}</td>
                    <td className="py-3 px-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {ag.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-slate-500 whitespace-nowrap">{ag.lastRun}</td>
                    <td className="py-3 px-2 font-bold text-slate-800">{ag.tasksExecuted}</td>
                    <td className="py-3 px-2 text-slate-700 whitespace-nowrap">{ag.createdBy}</td>
                    <td className="py-3 px-2 text-right">
                      <div className="inline-flex items-center gap-2 opacity-90 group-hover:opacity-100">
                        {/* Eye */}
                        <button
                          type="button"
                          onClick={() => setViewingAgent(ag)}
                          className="p-1 text-slate-400 hover:text-[#2F7BF5] rounded"
                          title="View Agent"
                        >
                          <Eye size={14} />
                        </button>

                        {/* Run Now Button */}
                        <button
                          type="button"
                          onClick={() => handleRunAgent(ag)}
                          className="p-1 text-slate-400 hover:text-emerald-600 rounded"
                          title="Run Agent Now"
                        >
                          <PlayCircle size={14} />
                        </button>

                        {/* Active Toggle Switch */}
                        <button
                          type="button"
                          onClick={() => toggleAgent(ag.id)}
                          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            isActive ? 'bg-[#2F7BF5]' : 'bg-slate-300'
                          }`}
                          title={`Toggle ${isActive ? 'Inactive' : 'Active'}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                              isActive ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
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
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredAgents.length)} of {filteredAgents.length} agents
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
                disabled={page * pageSize >= filteredAgents.length}
                onClick={() => setPage(page + 1)}
                className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded border border-slate-200"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Detail Drawer */}
      {viewingAgent && (
        <Drawer
          open={!!viewingAgent}
          onClose={() => setViewingAgent(null)}
          title={viewingAgent.name}
          subtitle={`Department: ${viewingAgent.department} • Type: ${viewingAgent.type}`}
        >
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm"
                style={{ backgroundColor: viewingAgent.color || '#2F7BF5' }}
              >
                <Zap size={22} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{viewingAgent.name}</h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      viewingAgent.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {viewingAgent.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">{viewingAgent.description}</p>
              </div>
            </div>

            <SectionTitle>Agent Metrics</SectionTitle>
            <DetailGrid
              items={[
                { label: 'Agent Type', value: viewingAgent.type },
                { label: 'Department', value: viewingAgent.department },
                { label: 'Tasks Executed', value: viewingAgent.tasksExecuted },
                { label: 'Last Run', value: viewingAgent.lastRun },
                { label: 'Author / Created By', value: viewingAgent.createdBy },
                { label: 'Workflow Trigger', value: 'Auto-Trigger on Lead Events' }
              ]}
            />

            <SectionTitle>Recent Activity Execution Logs</SectionTitle>
            <div className="space-y-2 text-xs">
              {[
                { time: '10 min ago', text: 'Qualified lead Justdial User with score 85' },
                { time: '45 min ago', text: 'Scheduled automated follow-up in WorkQueue' },
                { time: '2 hours ago', text: 'Enriched company profile for ABC Technologies' }
              ].map((log, i) => (
                <div key={i} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    <span className="text-slate-700 font-medium">{log.text}</span>
                  </div>
                  <span className="text-slate-400 text-[11px] whitespace-nowrap">{log.time}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 flex justify-between items-center border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  handleRunAgent(viewingAgent);
                  setViewingAgent(null);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#2F7BF5] text-white hover:bg-blue-600 rounded-xl shadow-sm transition"
              >
                <PlayCircle size={15} />
                <span>Trigger Run Now</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  toggleAgent(viewingAgent.id);
                  setViewingAgent(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition"
              >
                {viewingAgent.status === 'Active' ? 'Deactivate Agent' : 'Activate Agent'}
              </button>
            </div>
          </div>
        </Drawer>
      )}

      {/* Create Agent Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Create AI Agent</h3>
            <p className="text-xs text-slate-500 mb-4">Deploy an automated agent to assist with CRM workflows.</p>

            <form onSubmit={handleCreateAgent} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Agent Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sales Outreach Bot"
                  value={newAgentData.name}
                  onChange={(e) => setNewAgentData({ ...newAgentData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#2F7BF5]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Monitors incoming leads and prepares follow-ups"
                  value={newAgentData.description}
                  onChange={(e) => setNewAgentData({ ...newAgentData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#2F7BF5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Type</label>
                  <select
                    value={newAgentData.type}
                    onChange={(e) => setNewAgentData({ ...newAgentData, type: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#2F7BF5]"
                  >
                    <option value="Lead">Lead</option>
                    <option value="Engagement">Engagement</option>
                    <option value="Analytics">Analytics</option>
                    <option value="Communication">Communication</option>
                    <option value="Productivity">Productivity</option>
                    <option value="Automation">Automation</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Department</label>
                  <select
                    value={newAgentData.department}
                    onChange={(e) => setNewAgentData({ ...newAgentData, department: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#2F7BF5]"
                  >
                    <option value="Sales">Sales</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Operations">Operations</option>
                    <option value="Support">Support</option>
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
                  Deploy Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
