import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckSquare, Clock3, CalendarRange, PlayCircle, CheckCircle2,
  Plus, Eye, Pencil, Trash2, Users, Phone, Calendar, FileCheck,
  Megaphone, Award, CircleDollarSign, ChevronDown, Search, Download, UserCog
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import useTable from '../../components/common/useTable';
import StatusBadge from '../../components/common/StatusBadge';
import { UserAvatar } from '../../components/common/Avatar';
import ActionMenu from '../../components/common/ActionMenu';
import BulkBar, { BulkButton } from '../../components/common/BulkBar';
import Modal, { Drawer, DetailGrid, SectionTitle } from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { KanbanView, GridView, ChartView } from '../../components/common/Views';
import { useRefresh, useUrlActions } from '../../components/common/hooks';
import { fmtDate, fmtINR, todayISO } from '../../utils/calculations';
import { exportCSV } from '../../utils/exportCSV';

const TASK_STAGES = ['Not Started', 'In Progress', 'Pending', 'Scheduled', 'Completed'];
const STAGE_COLORS = {
  'Not Started': '#64748B',
  'In Progress': '#2F55D4',
  Pending: '#F59E0B',
  Scheduled: '#8B5CF6',
  Completed: '#10B981',
};

export default function WorkQueue() {
  const crm = useCRM();
  const navigate = useNavigate();
  const {
    tasks = [],
    leads = [],
    deals = [],
    contacts = [],
    calls = [],
    users = [],
    userName,
    createTask,
    updateRecord,
    deleteRecords,
    notify,
  } = crm;

  const { refreshing, refresh } = useRefresh('Workqueue');
  const [savedView, setSavedView] = useState('tasks');
  const [layout, setLayout] = useState('list');
  const [dense, setDense] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [search, setSearch] = useState('');
  const [activityPeriod, setActivityPeriod] = useState('Today & Overdue');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');

  // Modals & Drawers
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [viewingTask, setViewingTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [confirm, setConfirm] = useState(null);

  useUrlActions({
    onNew: () => setIsNewTaskOpen(true),
    onCreate: () => setIsNewTaskOpen(true),
    onOpen: (id) => {
      const task = tasks.find((t) => t.id === id);
      if (task) setViewingTask(task);
    },
  });

  const [newTaskForm, setNewTaskForm] = useState({
    subject: '',
    dueDate: todayISO(),
    status: 'In Progress',
    priority: 'High',
    relatedTo: 'Lead - Honey Universal Digital',
    contactName: 'Arun Kumar',
    ownerId: 'u1',
    description: '',
  });

  // Saved Views (top dropdown like Image 2 + Zoho Workqueue Image 3)
  const views = [
    { key: 'tasks', label: 'Marketing Department (CEO) — Tasks', count: tasks.length },
    { key: 'meetings', label: 'My Open Meetings', count: 4 },
    { key: 'calls', label: 'My Open Calls', count: calls.length },
    { key: 'approvals', label: 'My Jobs — Approvals', count: 7 },
    { key: 'campaigns', label: 'My Active Campaigns', count: 12 },
    { key: 'my_contacts', label: 'My Contacts Queue', count: contacts.length },
    { key: 'my_leads', label: 'My Leads Queue', count: leads.length },
    { key: 'deals_closing', label: 'Deals Closing This Month', count: deals.filter((d) => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost').length },
    { key: 'my_deals', label: 'My Deals Queue', count: deals.length },
  ];

  // Unified records based on active Workqueue section (Image 3 left navigation)
  const activeRecords = useMemo(() => {
    if (savedView === 'calls') {
      return calls.map((c) => ({
        id: c.id,
        queueType: 'Call',
        subject: c.subject || `Outbound Call`,
        dueDate: (c.dateTime || todayISO()).slice(0, 10),
        status: c.status || 'Scheduled',
        priority: 'High',
        relatedTo: 'Call Follow-up',
        contactName: c.notes || 'Client',
        ownerId: c.ownerId || 'u1',
      }));
    }
    if (savedView === 'my_leads') {
      return leads.map((l) => ({
        id: l.id,
        queueType: 'Lead',
        subject: `Follow up Lead: ${l.name}`,
        dueDate: l.createdOn || todayISO(),
        status: l.status === 'Converted' ? 'Completed' : l.status === 'Contacted' ? 'In Progress' : 'Not Started',
        priority: 'High',
        relatedTo: `Lead - ${l.company || l.name}`,
        contactName: l.name,
        ownerId: l.ownerId || 'u1',
        linkPath: `/leads/${l.id}`,
      }));
    }
    if (savedView === 'my_deals' || savedView === 'deals_closing') {
      const list = savedView === 'deals_closing' ? deals.filter((d) => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost') : deals;
      return list.map((d) => ({
        id: d.id,
        queueType: 'Deal',
        subject: `${d.name} (${fmtINR(d.amount)})`,
        dueDate: d.closingDate || todayISO(),
        status: d.stage === 'Closed Won' ? 'Completed' : 'In Progress',
        priority: 'High',
        relatedTo: `Deal • ${d.stage}`,
        contactName: d.department || 'Enterprise',
        ownerId: d.ownerId || 'u1',
        linkPath: `/deals?open=${d.id}`,
      }));
    }
    if (savedView === 'my_contacts') {
      return contacts.map((c) => ({
        id: c.id,
        queueType: 'Contact',
        subject: `Follow up Contact: ${c.name}`,
        dueDate: c.followUp || todayISO(),
        status: c.lifecycle === 'Customer' ? 'Completed' : 'In Progress',
        priority: 'Medium',
        relatedTo: `Contact • ${c.lifecycle || 'Engaged'}`,
        contactName: c.name,
        ownerId: c.ownerId || 'u1',
        linkPath: `/contacts?open=${c.id}`,
      }));
    }
    return tasks.map((t) => ({
      ...t,
      queueType: 'Task',
      subject: t.subject || 'Follow-up Task',
      dueDate: t.dueDate || todayISO(),
      status: t.status || 'In Progress',
      priority: t.priority || 'Medium',
      relatedTo: t.relatedTo || 'Lead - Prospective Client',
      contactName: t.contactName || 'Arun Kumar',
      ownerId: t.ownerId || 'u1',
    }));
  }, [savedView, tasks, leads, deals, contacts, calls]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activeRecords.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (priorityFilter && r.priority !== priorityFilter) return false;
      if (ownerFilter && r.ownerId !== ownerFilter) return false;
      if (q && ![r.subject, r.relatedTo, r.contactName, r.status, r.priority, userName(r.ownerId)].some((v) => String(v || '').toLowerCase().includes(q))) {
        return false;
      }
      return true;
    });
  }, [activeRecords, statusFilter, priorityFilter, ownerFilter, search, userName]);

  const accessors = useMemo(
    () => ({
      subject: (r) => r.subject || '',
      dueDate: (r) => r.dueDate || '',
      status: (r) => r.status || '',
      priority: (r) => r.priority || '',
      relatedTo: (r) => r.relatedTo || '',
      contactName: (r) => r.contactName || '',
      owner: (r) => userName(r.ownerId),
    }),
    [userName]
  );

  const table = useTable(filtered, { accessors, pageSize: 10 });
  const selectedIds = [...table.selected];

  // KPI metrics for the 5 StatCards (Image 2 model)
  const kpis = useMemo(() => {
    const today = todayISO();
    const total = filtered.length;
    const overdue = filtered.filter((t) => t.dueDate && t.dueDate < today && t.status !== 'Completed').length;
    const dueToday = filtered.filter((t) => t.dueDate === today && t.status !== 'Completed').length;
    const inProgress = filtered.filter((t) => t.status === 'In Progress').length;
    const completed = filtered.filter((t) => t.status === 'Completed').length;
    return { total, overdue, dueToday, inProgress, completed };
  }, [filtered]);

  const handleStatusChange = (row, newStatus) => {
    if (row.queueType === 'Task') {
      updateRecord('tasks', row.id, { status: newStatus });
      notify(`Task status changed to "${newStatus}"`, 'success');
    } else {
      notify(`Updated ${row.subject} status to "${newStatus}"`, 'success');
    }
  };

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!newTaskForm.subject.trim()) return;
    createTask({
      ...newTaskForm,
      subject: newTaskForm.subject.trim(),
    });
    setIsNewTaskOpen(false);
    setNewTaskForm({
      subject: '',
      dueDate: todayISO(),
      status: 'In Progress',
      priority: 'High',
      relatedTo: 'Lead - Honey Universal Digital',
      contactName: 'Arun Kumar',
      ownerId: 'u1',
      description: '',
    });
    notify('Task created and added to Workqueue', 'success');
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingTask) return;
    updateRecord('tasks', editingTask.id, editingTask);
    setEditingTask(null);
    notify('Workqueue task updated', 'success');
  };

  const exportRows = (rows) =>
    exportCSV('workqueue', rows, [
      { label: 'Subject', value: (r) => r.subject },
      { label: 'Due Date', value: (r) => r.dueDate },
      { label: 'Status', value: (r) => r.status },
      { label: 'Priority', value: (r) => r.priority },
      { label: 'Related To', value: (r) => r.relatedTo },
      { label: 'Contact Name', value: (r) => r.contactName },
      { label: 'Owner', value: (r) => userName(r.ownerId) },
    ]);

  // Columns matching Image 3 (Subject | Due Date | Status | Priority | Related To | Contact Name | Owner | Actions)
  const columns = [
    {
      key: 'subject',
      header: 'Subject',
      sortable: true,
      render: (r) => (
        <button
          type="button"
          onClick={() => (r.linkPath ? navigate(r.linkPath) : setViewingTask(r))}
          className="text-primary hover:underline font-medium text-left whitespace-nowrap"
        >
          {r.subject}
        </button>
      ),
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (r) => fmtDate(r.dueDate),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (r) => (
        <div onClick={(e) => e.stopPropagation()}>
          <StatusBadge value={r.status} />
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      render: (r) => <StatusBadge value={r.priority} />,
    },
    {
      key: 'relatedTo',
      header: 'Related To',
      sortable: true,
      render: (r) => <span className="text-ink-600 whitespace-nowrap">{r.relatedTo}</span>,
    },
    {
      key: 'contactName',
      header: 'Contact Name',
      sortable: true,
      render: (r) => <span className="text-ink font-medium whitespace-nowrap">{r.contactName}</span>,
    },
    {
      key: 'owner',
      header: 'Owner',
      sortable: true,
      render: (r) => <UserAvatar userId={r.ownerId} size={30} withName className="whitespace-nowrap" />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      sortable: false,
      render: (r) => (
        <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button className="icon-btn-primary" onClick={() => setViewingTask(r)} aria-label="View">
            <Eye size={17} />
          </button>
          <button className="icon-btn-primary" onClick={() => setEditingTask({ ...r })} aria-label="Edit">
            <Pencil size={16} />
          </button>
          <ActionMenu
            items={[
              { label: 'Mark as Completed', icon: CheckCircle2, onClick: () => handleStatusChange(r, 'Completed') },
              { label: 'Mark as In Progress', icon: PlayCircle, onClick: () => handleStatusChange(r, 'In Progress') },
              { divider: true },
              { label: 'Delete task', icon: Trash2, danger: true, onClick: () => setConfirm({ ids: [r.id], label: r.subject }) },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* PageHeader matching Image 2 (Deals.jsx) */}
      <PageHeader
        views={views}
        view={savedView}
        onViewChange={(v) => {
          if (v === 'approvals') return navigate('/deal-approvals');
          setSavedView(v);
          table.setPage(1);
        }}
        tabMenu={[
          { label: 'Export Workqueue (CSV)', icon: Download, onClick: () => exportRows(table.sorted) },
          { label: `Select all ${filtered.length} filtered`, onClick: table.selectAllFiltered },
        ]}
        toolbar={{
          filterActive: filtersOpen,
          onFilter: () => setFiltersOpen((o) => !o),
          sortOptions: [
            { key: 'subject', label: 'Subject' },
            { key: 'dueDate', label: 'Due Date' },
            { key: 'status', label: 'Status' },
            { key: 'priority', label: 'Priority' },
            { key: 'contactName', label: 'Contact Name' },
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
          module: 'Tasks',
          primary: {
            label: 'Create Task',
            icon: Plus,
            onClick: () => setIsNewTaskOpen(true),
            menu: [
              { label: 'Create Task', icon: Plus, onClick: () => setIsNewTaskOpen(true) },
              { label: 'Open Kanban board', onClick: () => setLayout('kanban') },
              { label: 'Export tasks (CSV)', icon: Download, onClick: () => exportRows(table.sorted) },
            ],
          },
          moreItems: [
            { label: 'Export selected (CSV)', icon: Download, disabled: !selectedIds.length, onClick: () => exportRows(filtered.filter((r) => table.selected.has(r.id))) },
            { label: 'Delete selected', icon: Trash2, danger: true, disabled: !selectedIds.length, onClick: () => setConfirm({ ids: selectedIds, label: `${selectedIds.length} items` }) },
          ],
        }}
      />

      {/* 5 StatCards matching Image 2 (Deals.jsx) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-3 mb-3">
        <StatCard icon={CheckSquare} tone="violet" label="Total Queue Items" value={kpis.total} trend={{ up: true, value: 14 }} spark={[6, 8, 9, 11, kpis.total || 12]} />
        <StatCard icon={Clock3} tone="red" tinted label="Overdue Items" value={kpis.overdue} trend={{ up: false, value: 8 }} invertTrend spark={[5, 4, 4, 3, kpis.overdue || 2]} />
        <StatCard icon={CalendarRange} tone="amber" tinted label="Due Today" value={kpis.dueToday} trend={{ up: true, value: 12 }} spark={[2, 3, 4, 4, kpis.dueToday || 4]} />
        <StatCard icon={PlayCircle} tone="blue" tinted label="In Progress" value={kpis.inProgress} trend={{ up: true, value: 18 }} spark={[3, 4, 5, 6, kpis.inProgress || 5]} />
        <StatCard icon={CheckCircle2} tone="green" tinted label="Completed" value={kpis.completed} trend={{ up: true, value: 22 }} spark={[2, 4, 5, 7, kpis.completed || 6]} />
      </div>

      {/* Main Split View: Left Zoho Workqueue Sidebar (Image 3 + Image 2 style) + Right DataTable Card */}
      <div className="flex gap-3 items-start">
        {filtersOpen && (
          <aside className="card hidden md:block w-[245px] shrink-0 px-3.5 py-4 sticky top-[72px] max-h-[calc(100vh-86px)] overflow-y-auto thin-scroll">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-semibold text-ink whitespace-nowrap">Filter Workqueue by</h2>
              {(statusFilter || priorityFilter || ownerFilter || search) && (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('');
                    setPriorityFilter('');
                    setOwnerFilter('');
                    setSearch('');
                  }}
                  className="text-[12.5px] text-primary hover:underline"
                >
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

            {/* Zoho CRM Workqueue Left Sections from Image 3 */}
            <details className="group" open>
              <summary className="py-2 text-[14px] font-semibold text-ink cursor-pointer select-none flex items-center justify-between">
                <span className="flex items-center gap-1 -ml-1">
                  <ChevronDown size={16} className="group-open:rotate-180 transition-transform -rotate-90" />
                  My Open Activity
                </span>
              </summary>
              <div className="pl-2 pb-3 space-y-1.5">
                <select
                  value={activityPeriod}
                  onChange={(e) => setActivityPeriod(e.target.value)}
                  className="w-full h-8 px-2 mb-1.5 text-[12.5px] border border-line rounded-md bg-white text-ink"
                >
                  <option>Today & Overdue</option>
                  <option>All Open Activities</option>
                  <option>This Week</option>
                </select>
                {[
                  { key: 'tasks', label: 'Tasks', count: tasks.length, icon: CheckSquare },
                  { key: 'meetings', label: 'Meetings', count: 4, icon: Calendar },
                  { key: 'calls', label: 'Calls', count: calls.length, icon: Phone },
                ].map((it) => (
                  <button
                    key={it.key}
                    type="button"
                    onClick={() => {
                      setSavedView(it.key);
                      table.setPage(1);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[13.5px] transition ${
                      savedView === it.key ? 'bg-primary-50 text-primary font-semibold' : 'text-ink-600 hover:bg-page'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <it.icon size={15} />
                      {it.label}
                    </span>
                    <span className="text-[12px] bg-[#EEF2F8] text-ink-600 px-2 py-0.5 rounded-full font-semibold">
                      {it.count}
                    </span>
                  </button>
                ))}
              </div>
            </details>

            <details className="group" open>
              <summary className="py-2 text-[14px] font-semibold text-ink cursor-pointer select-none flex items-center gap-1 -ml-1 border-t border-line">
                <ChevronDown size={16} className="group-open:rotate-180 transition-transform -rotate-90" />
                My Jobs
              </summary>
              <div className="pl-2 pb-3">
                <button
                  type="button"
                  onClick={() => navigate('/deal-approvals')}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[13.5px] text-ink-600 hover:bg-page"
                >
                  <span className="flex items-center gap-2">
                    <FileCheck size={15} className="text-primary" />
                    Approvals
                  </span>
                  <span className="text-[12px] bg-[#EEF2F8] text-ink-600 px-2 py-0.5 rounded-full font-semibold">7</span>
                </button>
              </div>
            </details>

            <details className="group" open>
              <summary className="py-2 text-[14px] font-semibold text-ink cursor-pointer select-none flex items-center gap-1 -ml-1 border-t border-line">
                <ChevronDown size={16} className="group-open:rotate-180 transition-transform -rotate-90" />
                My Workqueue
              </summary>
              <div className="pl-2 pb-3 space-y-3 text-[13px]">
                <div>
                  <div className="text-[11.5px] font-bold text-ink-400 uppercase px-2 mb-1">Campaigns</div>
                  <button
                    type="button"
                    onClick={() => setSavedView('tasks')}
                    className="w-full flex items-center justify-between px-2 py-1 rounded hover:bg-page text-ink-600"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Megaphone size={14} className="text-ink-400 shrink-0" />
                      My Active Campaigns
                    </span>
                    <span className="text-[11.5px] bg-[#EEF2F8] px-1.5 rounded-full">12</span>
                  </button>
                </div>

                <div>
                  <div className="text-[11.5px] font-bold text-ink-400 uppercase px-2 mb-1">Contacts</div>
                  <button
                    type="button"
                    onClick={() => setSavedView('my_contacts')}
                    className={`w-full flex items-center justify-between px-2 py-1 rounded hover:bg-page ${
                      savedView === 'my_contacts' ? 'text-primary font-semibold bg-primary-50' : 'text-ink-600'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Users size={14} className="text-emerald-600 shrink-0" />
                      My Contacts
                    </span>
                    <span className="text-[11.5px] bg-[#EEF2F8] px-1.5 rounded-full">{contacts.length}</span>
                  </button>
                </div>

                <div>
                  <div className="text-[11.5px] font-bold text-ink-400 uppercase px-2 mb-1">Leads</div>
                  <button
                    type="button"
                    onClick={() => setSavedView('my_leads')}
                    className={`w-full flex items-center justify-between px-2 py-1 rounded hover:bg-page ${
                      savedView === 'my_leads' ? 'text-primary font-semibold bg-primary-50' : 'text-ink-600'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Award size={14} className="text-amber-600 shrink-0" />
                      My Leads
                    </span>
                    <span className="text-[11.5px] bg-[#EEF2F8] px-1.5 rounded-full">{leads.length}</span>
                  </button>
                </div>

                <div>
                  <div className="text-[11.5px] font-bold text-ink-400 uppercase px-2 mb-1">Deals</div>
                  <button
                    type="button"
                    onClick={() => setSavedView('deals_closing')}
                    className={`w-full flex items-center justify-between px-2 py-1 rounded hover:bg-page ${
                      savedView === 'deals_closing' ? 'text-primary font-semibold bg-primary-50' : 'text-ink-600'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <CircleDollarSign size={14} className="text-rose-500 shrink-0" />
                      Deals Closing This Month
                    </span>
                    <span className="text-[11.5px] bg-[#EEF2F8] px-1.5 rounded-full">
                      {deals.filter((d) => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost').length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSavedView('my_deals')}
                    className={`w-full flex items-center justify-between px-2 py-1 rounded hover:bg-page ${
                      savedView === 'my_deals' ? 'text-primary font-semibold bg-primary-50' : 'text-ink-600'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <CircleDollarSign size={14} className="text-primary shrink-0" />
                      My Deals
                    </span>
                    <span className="text-[11.5px] bg-[#EEF2F8] px-1.5 rounded-full">{deals.length}</span>
                  </button>
                </div>
              </div>
            </details>

            <details className="group" open>
              <summary className="py-2 text-[14px] font-semibold text-ink cursor-pointer select-none flex items-center gap-1 -ml-1 border-t border-line">
                <ChevronDown size={16} className="group-open:rotate-180 transition-transform -rotate-90" />
                Filter By Fields
              </summary>
              <div className="pl-4 pb-3 space-y-2.5">
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-[13.5px] text-ink-600 cursor-pointer">
                    <input
                      type="checkbox"
                      className="cb"
                      checked={statusFilter !== ''}
                      onChange={() => setStatusFilter(statusFilter ? '' : 'In Progress')}
                    />
                    Status
                  </label>
                  {statusFilter !== '' && (
                    <select
                      className="w-full h-8 px-2 text-[13px] border border-line rounded-md bg-white"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="">All Statuses</option>
                      {TASK_STAGES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-[13.5px] text-ink-600 cursor-pointer">
                    <input
                      type="checkbox"
                      className="cb"
                      checked={priorityFilter !== ''}
                      onChange={() => setPriorityFilter(priorityFilter ? '' : 'High')}
                    />
                    Priority
                  </label>
                  {priorityFilter !== '' && (
                    <select
                      className="w-full h-8 px-2 text-[13px] border border-line rounded-md bg-white"
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                    >
                      <option value="">All Priorities</option>
                      {['High', 'Medium', 'Low'].map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </details>
          </aside>
        )}

        {/* Right Table / Kanban / Grid / Chart Card matching Image 2 (Deals.jsx) */}
        <div className="flex-1 min-w-0">
          <section className="card overflow-hidden">
            <BulkBar count={selectedIds.length} onClear={table.clearSelection}>
              <BulkButton icon={Download} onClick={() => exportRows(filtered.filter((r) => table.selected.has(r.id)))}>
                Export
              </BulkButton>
              <BulkButton icon={Trash2} danger onClick={() => setConfirm({ ids: selectedIds, label: `${selectedIds.length} items` })}>
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
                minWidth={1050}
                onRowClick={(r) => setViewingTask(r)}
                emptyTitle="No Tasks found."
                emptyHint="Create a new task or switch workqueue views from the left panel."
                emptyAction={
                  <button className="btn-primary mt-2 h-9" onClick={() => setIsNewTaskOpen(true)}>
                    <Plus size={16} /> Create Task
                  </button>
                }
              />
            )}

            {layout === 'kanban' && (
              <div className="p-3">
                <KanbanView
                  groups={TASK_STAGES.map((s) => ({ key: s, label: s, color: STAGE_COLORS[s] }))}
                  rows={table.sorted}
                  groupOf={(r) => r.status}
                  onMove={(row, st) => handleStatusChange(row, st)}
                  onCardClick={(r) => setViewingTask(r)}
                  renderCard={(r) => (
                    <div>
                      <div className="text-[13.5px] font-semibold text-ink leading-snug">{r.subject}</div>
                      <div className="text-[12px] text-ink-500 mt-0.5 truncate">{r.relatedTo}</div>
                      <div className="flex items-center justify-between mt-2.5">
                        <StatusBadge value={r.priority} size="sm" />
                        <UserAvatar userId={r.ownerId} size={24} />
                      </div>
                      <div className="text-[11.5px] text-ink-500 mt-1.5">Due {fmtDate(r.dueDate)}</div>
                    </div>
                  )}
                />
              </div>
            )}

            {layout === 'grid' && (
              <div className="p-3">
                <GridView
                  rows={table.pageRows}
                  onCardClick={(r) => setViewingTask(r)}
                  renderCard={(r) => (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-semibold text-ink leading-snug">{r.subject}</div>
                        <StatusBadge value={r.status} size="sm" />
                      </div>
                      <div className="text-[12.5px] text-ink-500 mt-1">{r.relatedTo}</div>
                      <div className="mt-3 flex items-center justify-between text-[12px] text-ink-500">
                        <span>Due {fmtDate(r.dueDate)}</span>
                        <UserAvatar userId={r.ownerId} size={24} />
                      </div>
                    </>
                  )}
                />
              </div>
            )}

            {layout === 'chart' && (
              <ChartView
                title="Workqueue Items by Status"
                data={TASK_STAGES.map((s) => ({
                  name: s,
                  value: filtered.filter((r) => r.status === s).length,
                  color: STAGE_COLORS[s],
                }))}
                valueLabel="Tasks"
              />
            )}

            {(layout === 'list' || layout === 'grid') && (
              <div className="px-4">
                <Pagination table={table} noun="tasks" />
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Create Task Modal */}
      <Modal
        open={isNewTaskOpen}
        onClose={() => setIsNewTaskOpen(false)}
        title="Create Workqueue Task"
        subtitle="Add a new task or follow-up item to your Workqueue"
        size="md"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setIsNewTaskOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="wq-new-form" className="btn-primary">
              Create Task
            </button>
          </>
        }
      >
        <form id="wq-new-form" onSubmit={handleCreateTask} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Subject *</label>
            <input
              required
              placeholder="e.g. Follow up on quotation & schedule demo"
              value={newTaskForm.subject}
              onChange={(e) => setNewTaskForm({ ...newTaskForm, subject: e.target.value })}
              className="input text-[13.5px]"
            />
          </div>
          <div>
            <label className="label">Due Date</label>
            <input
              type="date"
              value={newTaskForm.dueDate}
              onChange={(e) => setNewTaskForm({ ...newTaskForm, dueDate: e.target.value })}
              className="input text-[13.5px]"
            />
          </div>
          <div>
            <label className="label">Priority</label>
            <select
              value={newTaskForm.priority}
              onChange={(e) => setNewTaskForm({ ...newTaskForm, priority: e.target.value })}
              className="input text-[13.5px]"
            >
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>
          <div>
            <label className="label">Related To</label>
            <input
              value={newTaskForm.relatedTo}
              onChange={(e) => setNewTaskForm({ ...newTaskForm, relatedTo: e.target.value })}
              className="input text-[13.5px]"
            />
          </div>
          <div>
            <label className="label">Contact Name</label>
            <input
              value={newTaskForm.contactName}
              onChange={(e) => setNewTaskForm({ ...newTaskForm, contactName: e.target.value })}
              className="input text-[13.5px]"
            />
          </div>
        </form>
      </Modal>

      {/* Edit Task Modal */}
      <Modal
        open={!!editingTask}
        onClose={() => setEditingTask(null)}
        title="Edit Workqueue Task"
        size="md"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setEditingTask(null)}>
              Cancel
            </button>
            <button type="submit" form="wq-edit-task" className="btn-primary">
              Save Changes
            </button>
          </>
        }
      >
        {editingTask && (
          <form id="wq-edit-task" onSubmit={handleSaveEdit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Subject *</label>
              <input
                required
                value={editingTask.subject || ''}
                onChange={(e) => setEditingTask({ ...editingTask, subject: e.target.value })}
                className="input text-[13.5px]"
              />
            </div>
            <div>
              <label className="label">Due Date</label>
              <input
                type="date"
                value={editingTask.dueDate || ''}
                onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                className="input text-[13.5px]"
              />
            </div>
            <div>
              <label className="label">Status</label>
              <select
                value={editingTask.status || 'In Progress'}
                onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value })}
                className="input text-[13.5px]"
              >
                {TASK_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </form>
        )}
      </Modal>

      {/* View Drawer */}
      <Drawer
        open={!!viewingTask}
        onClose={() => setViewingTask(null)}
        title={viewingTask?.subject}
        subtitle={`${viewingTask?.queueType || 'Task'} • Assigned to ${userName(viewingTask?.ownerId)}`}
      >
        {viewingTask && (
          <div className="space-y-5">
            <DetailGrid
              items={[
                ['Subject', viewingTask.subject],
                ['Due Date', fmtDate(viewingTask.dueDate)],
                ['Status', <StatusBadge value={viewingTask.status} />],
                ['Priority', <StatusBadge value={viewingTask.priority} />],
                ['Related To', viewingTask.relatedTo],
                ['Contact Name', viewingTask.contactName],
                ['Owner', <UserAvatar userId={viewingTask.ownerId} size={28} withName />],
              ]}
            />
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="Delete tasks?"
        message={confirm ? `Delete ${confirm.label}?` : ''}
        onConfirm={() => {
          deleteRecords('tasks', confirm.ids);
          table.clearSelection();
          setViewingTask(null);
        }}
      />
    </div>
  );
}
