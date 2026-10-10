import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckSquare, Clock, Calendar, PlayCircle, CheckCircle2,
  Filter, Plus, MoreHorizontal, RefreshCw, Eye, Pencil, Trash2,
  Users, Phone, Mail, FileCheck, Layers, ChevronDown, Check,
  AlertCircle, ArrowUpDown, ChevronLeft, ChevronRight, Settings
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { fmtDate, todayISO } from '../../utils/calculations';
import { Drawer, DetailGrid, SectionTitle } from '../../components/common/Modal';
import { useUrlActions } from '../../components/common/hooks';

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

const STATUS_BADGE = {
  'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
  'Not Started': 'bg-slate-100 text-slate-700 border-slate-200',
  'Pending': 'bg-amber-50 text-amber-700 border-amber-200',
  'Scheduled': 'bg-purple-50 text-purple-700 border-purple-200',
  'Completed': 'bg-emerald-50 text-emerald-700 border-emerald-200'
};

const PRIORITY_BADGE = {
  High: 'bg-rose-50 text-rose-700 border-rose-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  Low: 'bg-emerald-50 text-emerald-700 border-emerald-200'
};

export default function WorkQueue() {
  const crm = useCRM();
  const navigate = useNavigate();
  const { tasks = [], users = [], createTask, updateRecord, deleteRecords, notify } = crm;

  const [activeCategory, setActiveCategory] = useState('Tasks');
  const [department, setDepartment] = useState('Marketing Department (CEO)');
  const [activityTimeFilter, setActivityTimeFilter] = useState('Today & Overdue');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchFilter, setSearchFilter] = useState('');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals & Drawers
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [viewingTask, setViewingTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);

  // ?open=<id> deep link (used by the Home page)
  useUrlActions({
    onOpen: (id) => {
      const task = tasks.find((t) => t.id === id);
      if (task) setViewingTask(task);
    },
  });

  // New task form state
  const [newTaskForm, setNewTaskForm] = useState({
    subject: '',
    dueDate: todayISO(),
    status: 'In Progress',
    priority: 'Medium',
    relatedTo: 'Lead - Prospective Client',
    contactName: 'Arun Kumar',
    description: ''
  });

  // Calculate task counts
  const totalTasks = tasks.length || 12;
  const overdueCount = useMemo(() => {
    const today = todayISO();
    return tasks.filter((t) => t.dueDate && t.dueDate < today && t.status !== 'Completed').length || 3;
  }, [tasks]);

  const dueTodayCount = useMemo(() => {
    const today = todayISO();
    return tasks.filter((t) => t.dueDate === today && t.status !== 'Completed').length || 4;
  }, [tasks]);

  const inProgressCount = useMemo(() => {
    return tasks.filter((t) => t.status === 'In Progress').length || 3;
  }, [tasks]);

  const completedCount = useMemo(() => {
    return tasks.filter((t) => t.status === 'Completed').length || 2;
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter !== 'All' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'All' && t.priority !== priorityFilter) return false;
      if (searchFilter) {
        const q = searchFilter.toLowerCase();
        const sub = (t.subject || '').toLowerCase();
        const rel = (t.relatedTo || '').toLowerCase();
        const con = (t.contactName || '').toLowerCase();
        if (!sub.includes(q) && !rel.includes(q) && !con.includes(q)) return false;
      }
      return true;
    });
  }, [tasks, statusFilter, priorityFilter, searchFilter]);

  const paginatedTasks = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredTasks.slice(start, start + pageSize);
  }, [filteredTasks, page, pageSize]);

  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedTasks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedTasks.map((t) => t.id)));
    }
  };

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!newTaskForm.subject) return;
    createTask(newTaskForm);
    setIsNewTaskOpen(false);
    setNewTaskForm({
      subject: '',
      dueDate: todayISO(),
      status: 'In Progress',
      priority: 'Medium',
      relatedTo: 'Lead - Prospective Client',
      contactName: 'Arun Kumar',
      description: ''
    });
    notify('Task created and added to WorkQueue', 'success');
  };

  const handleStatusChange = (taskId, newStatus) => {
    updateRecord('tasks', taskId, { status: newStatus });
    notify(`Task status changed to ${newStatus}`, 'info');
  };

  const handleDeleteTask = (taskId) => {
    deleteRecords('tasks', [taskId]);
    if (viewingTask?.id === taskId) setViewingTask(null);
    notify('Task deleted', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Header Greeting Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-semibold shadow-inner">
            <CheckSquare size={26} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Workqueue</h1>
            <p className="text-sm text-slate-500">
              Manage and work on your assigned records.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition"
            onClick={() => {
              setDepartment(department.includes('Marketing') ? 'Sales Department' : 'Marketing Department (CEO)');
            }}
          >
            <Users size={16} className="text-[#2F7BF5]" />
            <span>{department}</span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>
          <button
            type="button"
            onClick={() => setIsNewTaskOpen(true)}
            className="p-2 text-white bg-[#2F7BF5] hover:bg-blue-600 rounded-xl shadow-sm transition"
            title="Add Quick Task"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* 5 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Tasks */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition">
          <div className="space-y-1">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2F7BF5] flex items-center justify-center">
              <CheckSquare size={20} />
            </div>
            <p className="text-xs font-medium text-slate-500 pt-1">Total Tasks</p>
            <div className="text-2xl font-bold text-slate-900">{totalTasks}</div>
            <div className="text-xs font-semibold text-emerald-600">↑ 20%</div>
          </div>
          <Sparkline color="#2F7BF5" heights={[25, 40, 50, 35, 70, 85, 95]} />
        </div>

        {/* Overdue */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition">
          <div className="space-y-1">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Clock size={20} />
            </div>
            <p className="text-xs font-medium text-slate-500 pt-1">Overdue</p>
            <div className="text-2xl font-bold text-slate-900">{overdueCount}</div>
            <div className="text-xs font-semibold text-rose-600">↑ 25%</div>
          </div>
          <Sparkline color="#F43F5E" heights={[30, 45, 40, 60, 50, 75, 90]} />
        </div>

        {/* Due Today */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition">
          <div className="space-y-1">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar size={20} />
            </div>
            <p className="text-xs font-medium text-slate-500 pt-1">Due Today</p>
            <div className="text-2xl font-bold text-slate-900">{dueTodayCount}</div>
            <div className="text-xs font-semibold text-emerald-600">↑ 12%</div>
          </div>
          <Sparkline color="#F59E0B" heights={[20, 30, 45, 60, 70, 85, 90]} />
        </div>

        {/* In Progress */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition">
          <div className="space-y-1">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <PlayCircle size={20} />
            </div>
            <p className="text-xs font-medium text-slate-500 pt-1">In Progress</p>
            <div className="text-2xl font-bold text-slate-900">{inProgressCount}</div>
            <div className="text-xs font-semibold text-emerald-600">↑ 15%</div>
          </div>
          <Sparkline color="#8B5CF6" heights={[40, 60, 55, 75, 65, 80, 95]} />
        </div>

        {/* Completed */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition">
          <div className="space-y-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
            <p className="text-xs font-medium text-slate-500 pt-1">Completed</p>
            <div className="text-2xl font-bold text-slate-900">{completedCount}</div>
            <div className="text-xs font-semibold text-emerald-600">↑ 10%</div>
          </div>
          <Sparkline color="#10B981" heights={[30, 40, 50, 60, 75, 85, 100]} />
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sub-Sidebar (3 cols) */}
        <div className="lg:col-span-3 space-y-5">
          {/* My Open Activity Section */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">My Open Activity</h2>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg"
                onClick={() => setActivityTimeFilter(activityTimeFilter.includes('Today') ? 'All Periods' : 'Today & Overdue')}
              >
                <span>{activityTimeFilter}</span>
                <ChevronDown size={10} />
              </button>
            </div>

            <div className="space-y-1">
              {[
                { name: 'Tasks', count: totalTasks, icon: CheckSquare, active: activeCategory === 'Tasks' },
                { name: 'Meetings', count: 3, icon: Calendar, active: activeCategory === 'Meetings' },
                { name: 'Calls', count: 5, icon: Phone, active: activeCategory === 'Calls' },
                { name: 'Emails', count: 8, icon: Mail, active: activeCategory === 'Emails' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setActiveCategory(item.name)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                      item.active
                        ? 'bg-blue-50 text-[#2F7BF5] font-semibold border border-blue-200/60'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={15} className={item.active ? 'text-[#2F7BF5]' : 'text-slate-400'} />
                      <span>{item.name}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] ${item.active ? 'bg-[#2F7BF5] text-white font-bold' : 'bg-slate-100 text-slate-600'}`}>
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* My Jobs Section */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">My Jobs</h2>
            <button
              type="button"
              onClick={() => navigate('/deal-approvals')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                activeCategory === 'Approvals'
                  ? 'bg-blue-50 text-[#2F7BF5] font-semibold border border-blue-200/60'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileCheck size={15} className={activeCategory === 'Approvals' ? 'text-[#2F7BF5]' : 'text-slate-400'} />
                <span>Approvals</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-600">24</span>
            </button>
          </div>

          {/* My Workqueue Section */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">My Workqueue</h2>
              <div className="flex items-center gap-1 text-slate-400">
                <Settings size={14} className="hover:text-slate-600 cursor-pointer" />
                <Plus size={14} className="hover:text-slate-600 cursor-pointer" />
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Leads</span>
                <div className="space-y-1">
                  <div className="flex justify-between py-1 px-2 text-slate-700 hover:bg-slate-50 rounded cursor-pointer">
                    <span>My Leads</span>
                    <span className="font-semibold text-slate-900">28</span>
                  </div>
                  <div className="flex justify-between py-1 px-2 text-slate-700 hover:bg-slate-50 rounded cursor-pointer">
                    <span>Leads Assigned to Me</span>
                    <span className="font-semibold text-slate-900">12</span>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Deals</span>
                <div className="space-y-1">
                  <div className="flex justify-between py-1 px-2 text-slate-700 hover:bg-slate-50 rounded cursor-pointer">
                    <span>My Deals</span>
                    <span className="font-semibold text-slate-900">18</span>
                  </div>
                  <div className="flex justify-between py-1 px-2 text-slate-700 hover:bg-slate-50 rounded cursor-pointer">
                    <span>Deals Closing This Month</span>
                    <span className="font-semibold text-slate-900">7</span>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Contacts</span>
                <div className="space-y-1">
                  <div className="flex justify-between py-1 px-2 text-slate-700 hover:bg-slate-50 rounded cursor-pointer">
                    <span>My Contacts</span>
                    <span className="font-semibold text-slate-900">23</span>
                  </div>
                  <div className="flex justify-between py-1 px-2 text-slate-700 hover:bg-slate-50 rounded cursor-pointer">
                    <span>Contacts to Follow Up</span>
                    <span className="font-semibold text-slate-900">9</span>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Accounts</span>
                <div className="space-y-1">
                  <div className="flex justify-between py-1 px-2 text-slate-700 hover:bg-slate-50 rounded cursor-pointer">
                    <span>My Accounts</span>
                    <span className="font-semibold text-slate-900">15</span>
                  </div>
                  <div className="flex justify-between py-1 px-2 text-slate-700 hover:bg-slate-50 rounded cursor-pointer">
                    <span>Accounts Renewal</span>
                    <span className="font-semibold text-slate-900">5</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Main Table Area (9 cols) */}
        <div className="lg:col-span-9 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          {/* Action Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">{activeCategory}</h2>
              <button
                type="button"
                onClick={() => notify('WorkQueue synchronized with workflow engine', 'info')}
                className="p-1 text-slate-400 hover:text-slate-600 rounded transition"
                title="Refresh tasks"
              >
                <RefreshCw size={14} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search workqueue..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#2F7BF5] w-48"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowFilterDrawer(!showFilterDrawer)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-xl transition ${
                  statusFilter !== 'All' || priorityFilter !== 'All'
                    ? 'bg-blue-50 text-[#2F7BF5] border-blue-200'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Filter size={14} />
                <span>Filter</span>
              </button>

              <button
                type="button"
                onClick={() => setIsNewTaskOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#2F7BF5] hover:bg-blue-600 rounded-xl shadow-sm transition"
              >
                <Plus size={14} />
                <span>New Task</span>
              </button>

              <button
                type="button"
                className="p-1.5 text-slate-400 hover:text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
              >
                <MoreHorizontal size={16} />
              </button>
            </div>
          </div>

          {/* Quick Filters Strip */}
          {showFilterDrawer && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                >
                  <option value="All">All Statuses</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Not Started">Not Started</option>
                  <option value="Pending">Pending</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Priority:</span>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                >
                  <option value="All">All Priorities</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              {(statusFilter !== 'All' || priorityFilter !== 'All') && (
                <button
                  type="button"
                  onClick={() => { setStatusFilter('All'); setPriorityFilter('All'); }}
                  className="text-xs text-[#2F7BF5] hover:underline font-semibold"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* Tasks Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-medium">
                  <th className="py-2.5 px-2 w-8">
                    <input
                      type="checkbox"
                      checked={selectedIds.size > 0 && selectedIds.size === paginatedTasks.length}
                      onChange={toggleSelectAll}
                      className="rounded text-[#2F7BF5] focus:ring-[#2F7BF5]"
                    />
                  </th>
                  <th className="py-2.5 px-2">Subject</th>
                  <th className="py-2.5 px-2">Due Date</th>
                  <th className="py-2.5 px-2">Status</th>
                  <th className="py-2.5 px-2">Priority</th>
                  <th className="py-2.5 px-2">Related To</th>
                  <th className="py-2.5 px-2">Contact Name</th>
                  <th className="py-2.5 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedTasks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No tasks found in WorkQueue matching criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedTasks.map((t) => {
                    const isSelected = selectedIds.has(t.id);
                    return (
                      <tr
                        key={t.id}
                        className={`hover:bg-slate-50/80 transition group ${
                          isSelected ? 'bg-blue-50/40' : ''
                        }`}
                      >
                        <td className="py-3 px-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(t.id)}
                            className="rounded text-[#2F7BF5] focus:ring-[#2F7BF5]"
                          />
                        </td>
                        <td className="py-3 px-2 font-medium text-slate-900">
                          <span
                            onClick={() => setViewingTask(t)}
                            className="text-[#2F7BF5] hover:underline cursor-pointer font-medium"
                          >
                            {t.subject}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-slate-500 whitespace-nowrap">
                          {t.dueDate ? fmtDate(t.dueDate) : '10/10/2026'}
                        </td>
                        <td className="py-3 px-2">
                          <select
                            value={t.status || 'In Progress'}
                            onChange={(e) => handleStatusChange(t.id, e.target.value)}
                            className={`px-2 py-0.5 rounded text-[11px] font-medium border cursor-pointer ${
                              STATUS_BADGE[t.status] || 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            <option value="Not Started">Not Started</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Pending">Pending</option>
                            <option value="Scheduled">Scheduled</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${PRIORITY_BADGE[t.priority] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                            {t.priority || 'Medium'}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-slate-600 truncate max-w-[140px]">
                          {t.relatedTo || 'Deal - ABC Technologies'}
                        </td>
                        <td className="py-3 px-2 text-slate-700 font-medium whitespace-nowrap">
                          {t.contactName || 'Ramesh Kumar'}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="inline-flex items-center gap-1 opacity-80 group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() => setViewingTask(t)}
                              className="p-1 text-slate-400 hover:text-[#2F7BF5] rounded"
                              title="View Details"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingTask(t)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded"
                              title="Edit Task"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTask(t.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
                              title="Delete Task"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
            <div>
              Showing {filteredTasks.length === 0 ? 0 : (page - 1) * pageSize + 1} to{' '}
              {Math.min(page * pageSize, filteredTasks.length)} of {filteredTasks.length} tasks
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
                  <option value={5}>5</option>
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
                  disabled={page * pageSize >= filteredTasks.length}
                  onClick={() => setPage(page + 1)}
                  className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded border border-slate-200"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Task Modal */}
      {isNewTaskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Create WorkQueue Task</h3>
            <p className="text-xs text-slate-500 mb-4">Add a new actionable follow-up task or workflow job.</p>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Follow up on product demo quotation"
                  value={newTaskForm.subject}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, subject: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#2F7BF5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newTaskForm.dueDate}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#2F7BF5]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={newTaskForm.priority}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, priority: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#2F7BF5]"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Related To</label>
                  <input
                    type="text"
                    placeholder="e.g. Lead - Arun Kumar"
                    value={newTaskForm.relatedTo}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, relatedTo: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#2F7BF5]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Contact Name</label>
                  <input
                    type="text"
                    placeholder="Contact person"
                    value={newTaskForm.contactName}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, contactName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#2F7BF5]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Task instructions..."
                  value={newTaskForm.description}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#2F7BF5]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewTaskOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-[#2F7BF5] text-white hover:bg-blue-600 rounded-xl shadow-sm"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Task Drawer */}
      {viewingTask && (
        <Drawer
          open={!!viewingTask}
          onClose={() => setViewingTask(null)}
          title={viewingTask.subject}
          subtitle={`WorkQueue ID: ${viewingTask.id}`}
        >
          <div className="space-y-6">
            <SectionTitle>Task Details</SectionTitle>
            <DetailGrid
              items={[
                { label: 'Subject', value: viewingTask.subject },
                { label: 'Due Date', value: viewingTask.dueDate ? fmtDate(viewingTask.dueDate) : '—' },
                { label: 'Status', value: viewingTask.status },
                { label: 'Priority', value: viewingTask.priority },
                { label: 'Related Entity', value: viewingTask.relatedTo || '—' },
                { label: 'Contact', value: viewingTask.contactName || '—' },
              ].map(({ label, value }) => [label, value])}
            />

            {viewingTask.description && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                <span className="font-semibold block mb-1">Notes:</span>
                {viewingTask.description}
              </div>
            )}

            <div className="pt-4 flex justify-between items-center border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  handleStatusChange(viewingTask.id, viewingTask.status === 'Completed' ? 'In Progress' : 'Completed');
                  setViewingTask(null);
                }}
                className="px-3.5 py-2 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition"
              >
                {viewingTask.status === 'Completed' ? 'Reopen Task' : 'Mark as Completed'}
              </button>

              <button
                type="button"
                onClick={() => handleDeleteTask(viewingTask.id)}
                className="px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition"
              >
                Delete
              </button>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
}
