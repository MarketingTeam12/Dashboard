import { useMemo, useState } from 'react';
import {
  Bot, Play, Pause, Plus, Search, ChevronDown, Eye,
  Trash2, Zap, CheckCircle2, Folder, PlayCircle
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import useTable from '../../components/common/useTable';
import StatusBadge from '../../components/common/StatusBadge';
import Modal, { Drawer, DetailGrid, SectionTitle } from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { GridView } from '../../components/common/Views';

export default function Agents() {
  const crm = useCRM();
  const { agents = [], toggleAgent, runAgent, deleteRecords, notify } = crm;

  const [view, setView] = useState('list');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [deptFilter, setDeptFilter] = useState('All Departments');
  const [filterSearch, setFilterSearch] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [openSections, setOpenSections] = useState({ status: true, type: true, dept: true });

  const [viewingAgent, setViewingAgent] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newAgentData, setNewAgentData] = useState({
    name: '',
    description: '',
    type: 'Lead',
    department: 'Sales',
    status: 'Active',
    createdBy: 'Sibi Chakaravarthi',
  });

  // Live statistics
  const metrics = useMemo(() => {
    const total = agents.length;
    const active = agents.filter((a) => a.status === 'Active').length;
    const paused = agents.filter((a) => a.status !== 'Active').length;
    const tasksExecuted = agents.reduce((acc, curr) => acc + (Number(curr.tasksExecuted) || 0), 0);
    return { total, active, paused, tasksExecuted };
  }, [agents]);

  // Filtered agents
  const filteredAgents = useMemo(() => {
    return agents.filter((a) => {
      if (typeFilter !== 'All Types' && a.type !== typeFilter) return false;
      if (statusFilter !== 'All Status' && a.status !== statusFilter) return false;
      if (deptFilter !== 'All Departments' && a.department !== deptFilter) return false;
      return true;
    });
  }, [agents, typeFilter, statusFilter, deptFilter]);

  const table = useTable(filteredAgents, {
    searchKeys: ['name', 'description', 'type', 'department', 'createdBy'],
    initialSort: { key: 'name', dir: 'asc' },
    pageSize: 10,
  });

  const handleCreateAgent = (e) => {
    e.preventDefault();
    if (!newAgentData.name.trim()) return;
    const agentRecord = {
      id: `ag-${Date.now()}`,
      ...newAgentData,
      tasksExecuted: 0,
      lastRun: 'Just now',
      color: '#2F55D4',
    };
    crm.createRecord?.('agents', agentRecord);
    setIsCreateModalOpen(false);
    setNewAgentData({
      name: '',
      description: '',
      type: 'Lead',
      department: 'Sales',
      status: 'Active',
      createdBy: 'Sibi Chakaravarthi',
    });
    notify(`AI Agent "${agentRecord.name}" deployed`, 'success');
  };

  const columns = [
    {
      key: 'name',
      label: 'Agent Name',
      render: (a) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-primary flex items-center justify-center shrink-0">
            <Bot size={18} />
          </div>
          <div>
            <div className="font-semibold text-primary hover:underline text-[14px]">{a.name}</div>
            <div className="text-[12px] text-ink-400 truncate max-w-[300px]">{a.description}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Module',
      render: (a) => <span className="text-[13.5px] font-medium text-ink">{a.type}</span>,
    },
    {
      key: 'department',
      label: 'Department',
      render: (a) => <span className="text-[13.5px] text-ink-600">{a.department}</span>,
    },
    {
      key: 'tasksExecuted',
      label: 'Tasks Executed',
      align: 'right',
      render: (a) => <span className="text-[13.5px] font-semibold text-ink tabular-nums">{a.tasksExecuted || 0}</span>,
    },
    {
      key: 'lastRun',
      label: 'Last Run',
      render: (a) => <span className="text-[13.5px] text-ink-500">{a.lastRun || 'Recently'}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (a) => <StatusBadge status={a.status || 'Active'} />,
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      align: 'right',
      render: (a) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => runAgent(a.id)}
            className="px-2.5 py-1 rounded-md bg-blue-50 text-primary hover:bg-blue-100 text-[12px] font-semibold inline-flex items-center gap-1"
            title="Run Agent Now"
          >
            <Play size={12} /> Run
          </button>
          <button
            type="button"
            onClick={() => toggleAgent(a.id)}
            className="p-1.5 rounded hover:bg-page text-ink-400 hover:text-ink"
            title={a.status === 'Active' ? 'Pause Agent' : 'Activate Agent'}
          >
            {a.status === 'Active' ? <Pause size={15} /> : <Play size={15} />}
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(a)}
            className="p-1.5 rounded hover:bg-rose-50 text-ink-400 hover:text-rose-600"
            title="Delete Agent"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        icon={Bot}
        title="AI Agents"
        subtitle="Automated Zia CRM workflow agents for Lead scoring, Deal routing, and Follow-ups"
        views={['list', 'grid']}
        view={view}
        onViewChange={setView}
        search={table.search}
        onSearch={table.setSearch}
        searchPlaceholder="Search AI agents by name, module, or department…"
        onFilterToggle={() => setShowFilters((s) => !s)}
        filterActive={showFilters || typeFilter !== 'All Types' || statusFilter !== 'All Status' || deptFilter !== 'All Departments'}
        primaryAction={{
          label: 'Create Agent',
          icon: Plus,
          onClick: () => setIsCreateModalOpen(true),
        }}
      />

      {/* 5 StatCards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          label="Total AI Agents"
          value={metrics.total}
          delta={14.2}
          icon={Bot}
          tone="blue"
          spark={[5, 6, 8, 9, 10, 11, metrics.total]}
        />
        <StatCard
          label="Active Agents"
          value={metrics.active}
          delta={11.0}
          icon={PlayCircle}
          tone="green"
          spark={[3, 4, 5, 6, 7, 8, metrics.active]}
        />
        <StatCard
          label="Paused / Draft"
          value={metrics.paused}
          delta={-2.5}
          icon={Pause}
          tone="orange"
          spark={[4, 3, 3, 2, 2, 2, metrics.paused]}
        />
        <StatCard
          label="Tasks Executed"
          value={metrics.tasksExecuted}
          delta={24.8}
          icon={Zap}
          tone="purple"
          spark={[120, 240, 410, 680, 890, 1100, metrics.tasksExecuted || 1250]}
        />
        <StatCard
          label="Automation Rate"
          value="98.4%"
          delta={3.1}
          icon={CheckCircle2}
          tone="teal"
          spark={[92, 94, 95, 96, 97, 98, 99]}
        />
      </div>

      {/* Main Split View */}
      <div className="flex gap-4 items-start">
        {showFilters && (
          <aside className="w-[260px] shrink-0 bg-white border border-line rounded-xl p-4 shadow-card select-none">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-bold text-ink">Filter Agents by</h3>
              {(typeFilter !== 'All Types' || statusFilter !== 'All Status' || deptFilter !== 'All Departments') && (
                <button
                  type="button"
                  onClick={() => {
                    setTypeFilter('All Types');
                    setStatusFilter('All Status');
                    setDeptFilter('All Departments');
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
                <button
                  type="button"
                  onClick={() => setOpenSections((s) => ({ ...s, status: !s.status }))}
                  className="flex items-center gap-1 text-[13px] font-bold text-ink w-full text-left mb-2"
                >
                  <ChevronDown size={14} className={`transition-transform ${openSections.status ? '' : '-rotate-90'}`} />
                  <span>Agent Status</span>
                </button>
                {openSections.status && (
                  <div className="space-y-1.5 pl-1">
                    {['All Status', 'Active', 'Inactive'].map((st) => (
                      <label
                        key={st}
                        className="flex items-center gap-2.5 py-1 px-1.5 rounded-md hover:bg-page cursor-pointer text-[13.5px] text-ink-600"
                      >
                        <input
                          type="checkbox"
                          checked={statusFilter === st}
                          onChange={() => setStatusFilter(st)}
                          className="rounded border-ink-300 text-primary focus:ring-primary"
                        />
                        <span className={statusFilter === st ? 'font-semibold text-primary' : ''}>{st}</span>
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
                  <ChevronDown size={14} className={`transition-transform ${openSections.type ? '' : '-rotate-90'}`} />
                  <span>Target Module</span>
                </button>
                {openSections.type && (
                  <div className="space-y-1.5 pl-1">
                    {['All Types', 'Lead', 'Deal', 'Contact', 'Support'].map((tp) => (
                      <label
                        key={tp}
                        className="flex items-center gap-2.5 py-1 px-1.5 rounded-md hover:bg-page cursor-pointer text-[13.5px] text-ink-600"
                      >
                        <input
                          type="checkbox"
                          checked={typeFilter === tp}
                          onChange={() => setTypeFilter(tp)}
                          className="rounded border-ink-300 text-primary focus:ring-primary"
                        />
                        <span className={typeFilter === tp ? 'font-semibold text-primary' : ''}>{tp}</span>
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
                rows={table.rows}
                sort={table.sort}
                onSort={table.toggleSort}
                selected={table.selected}
                onSelectAll={table.toggleAll}
                onSelectRow={table.toggleSelect}
                onRowClick={(a) => setViewingAgent(a)}
              />
              <Pagination
                page={table.page}
                totalPages={table.totalPages}
                total={table.total}
                pageSize={table.pageSize}
                onPageChange={table.setPage}
              />
            </div>
          )}

          {view === 'grid' && (
            <GridView
              items={table.rows}
              onCardClick={(a) => setViewingAgent(a)}
              renderCard={(a) => (
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-ink text-[14px]">{a.name}</div>
                    <StatusBadge status={a.status} />
                  </div>
                  <p className="text-[12.5px] text-ink-500 mt-1 line-clamp-2">{a.description}</p>
                  <div className="mt-3 pt-2.5 border-t border-line flex items-center justify-between text-[12.5px]">
                    <span className="text-ink-500">{a.tasksExecuted || 0} runs</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        runAgent(a.id);
                      }}
                      className="text-primary font-semibold hover:underline"
                    >
                      Run Now
                    </button>
                  </div>
                </div>
              )}
            />
          )}
        </div>
      </div>

      {/* Agent Detail Drawer */}
      <Drawer
        open={!!viewingAgent}
        onClose={() => setViewingAgent(null)}
        title={viewingAgent?.name}
        subtitle={`${viewingAgent?.type} Automation • ${viewingAgent?.department}`}
      >
        {viewingAgent && (
          <div className="space-y-5">
            <DetailGrid
              items={[
                { label: 'Agent Name', value: viewingAgent.name },
                { label: 'Status', value: <StatusBadge status={viewingAgent.status} /> },
                { label: 'Target Module', value: viewingAgent.type },
                { label: 'Department', value: viewingAgent.department },
                { label: 'Tasks Executed', value: viewingAgent.tasksExecuted || 0 },
                { label: 'Last Run', value: viewingAgent.lastRun || 'Recently' },
              ]}
            />
            <div>
              <SectionTitle>Description</SectionTitle>
              <p className="text-[13.5px] text-ink-600 bg-page p-3.5 rounded-lg border border-line">
                {viewingAgent.description}
              </p>
            </div>
            <div className="flex items-center gap-2 pt-3 border-t border-line">
              <button
                type="button"
                onClick={() => runAgent(viewingAgent.id)}
                className="btn-primary"
              >
                <Play size={14} /> Run Agent Now
              </button>
              <button
                type="button"
                onClick={() => toggleAgent(viewingAgent.id)}
                className="btn-secondary"
              >
                {viewingAgent.status === 'Active' ? 'Pause Agent' : 'Activate Agent'}
              </button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Create Agent Modal */}
      <Modal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create AI Agent"
        subtitle="Deploy an automated CRM assistant for Leads, Deals, or Follow-ups"
        size="md"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="create-agent-form" className="btn-primary">
              Deploy Agent
            </button>
          </>
        }
      >
        <form id="create-agent-form" onSubmit={handleCreateAgent} className="space-y-4">
          <div>
            <label className="label">Agent Name *</label>
            <input
              required
              placeholder="e.g. Auto-Qualify High Intent Leads"
              value={newAgentData.name}
              onChange={(e) => setNewAgentData({ ...newAgentData, name: e.target.value })}
              className="input text-[13.5px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="label">Target Module</label>
              <select
                value={newAgentData.type}
                onChange={(e) => setNewAgentData({ ...newAgentData, type: e.target.value })}
                className="input text-[13.5px]"
              >
                <option value="Lead">Lead</option>
                <option value="Deal">Deal</option>
                <option value="Contact">Contact</option>
                <option value="Support">Support</option>
              </select>
            </div>
            <div>
              <label className="label">Department</label>
              <select
                value={newAgentData.department}
                onChange={(e) => setNewAgentData({ ...newAgentData, department: e.target.value })}
                className="input text-[13.5px]"
              >
                <option value="Sales">Sales</option>
                <option value="Marketing">Marketing</option>
                <option value="Customer Success">Customer Success</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Description / Rules</label>
            <textarea
              rows={3}
              placeholder="Describe what this agent automates..."
              value={newAgentData.description}
              onChange={(e) => setNewAgentData({ ...newAgentData, description: e.target.value })}
              className="input !h-auto py-2 text-[13.5px]"
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          deleteRecords('agents', [deleteTarget.id]);
          notify('Agent removed', 'info');
        }}
        title="Delete AI Agent?"
        message={`Are you sure you want to delete "${deleteTarget?.name}"?`}
      />
    </div>
  );
}
