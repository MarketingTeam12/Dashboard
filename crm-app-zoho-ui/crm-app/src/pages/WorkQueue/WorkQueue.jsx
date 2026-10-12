import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare, Clock, Calendar, PlayCircle, CheckCircle2,
  Filter, Plus, MoreHorizontal, RefreshCw, Eye, Pencil, Trash2,
  Users, Phone, Mail, FileCheck, ChevronDown, ChevronUp, ArrowUpDown,
  ChevronLeft, ChevronRight, Settings, ExternalLink, Briefcase, Megaphone,
  Search, X, Building2, UserCheck, FolderKanban, Sparkles,
} from 'lucide-react';
import { useCRM } from '../../context/crmContextInstance';
import { fmtDate, fmtDuration, fmtINR, fmtTime, isOpen, todayISO } from '../../utils/calculations';
import Modal, { Drawer, DetailGrid, SectionTitle } from '../../components/common/Modal';
import { useUrlActions } from '../../components/common/hooks';
import { CURRENT_USER_ID, isAssignedInLast3Hours } from '../Leads/leadFilters';
import { APPROVAL_STORAGE_KEY, buildApprovalsList } from '../Deals/dealApprovalUtils';
import { loadKey, saveKey } from '../../utils/storage';

const CUSTOM_WQ_STORAGE_KEY = 'zoho_custom_workqueues_v1';

const DEPARTMENT_OPTIONS = [
  'Marketing Department (CEO)',
  'Sales Department (VP Sales)',
  'Translation Operations',
  'Enterprise Accounts Team',
  'All Departments',
];

const ACTIVITY_PERIOD_OPTIONS = [
  'Today & Overdue',
  'Today',
  'Overdue',
  'This Week',
  'All Open',
];

const STATUS_BADGE = {
  'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
  'Not Started': 'bg-slate-100 text-slate-700 border-slate-200',
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Scheduled: 'bg-purple-50 text-purple-700 border-purple-200',
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Planning: 'bg-amber-50 text-amber-700 border-amber-200',
  Missed: 'bg-rose-50 text-rose-700 border-rose-200',
  Busy: 'bg-amber-50 text-amber-700 border-amber-200',
  Assigned: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  New: 'bg-blue-50 text-blue-700 border-blue-200',
  Contacted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Followup: 'bg-sky-50 text-sky-700 border-sky-200',
  Qualified: 'bg-amber-50 text-amber-700 border-amber-200',
  Converted: 'bg-purple-50 text-purple-700 border-purple-200',
};

const PRIORITY_BADGE = {
  High: 'bg-rose-50 text-rose-700 border-rose-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  Low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

function SortHeader({ label, field, sortField, sortDir, onSort, align = 'left', className = '' }) {
  const isSorted = sortField === field;
  return (
    <th
      onClick={() => onSort(field)}
      className={`py-3 px-3.5 text-[13.5px] font-semibold uppercase tracking-wider text-slate-600 select-none cursor-pointer hover:text-slate-900 hover:bg-slate-100/70 transition whitespace-nowrap ${
        align === 'right' ? 'text-right' : 'text-left'
      } ${className}`}
    >
      <div className={`inline-flex items-center gap-1 ${align === 'right' ? 'justify-end' : ''}`}>
        <span>{label}</span>
        {isSorted ? (
          sortDir === 'asc' ? (
            <ChevronUp size={13} className="text-[#2F55D4]" />
          ) : (
            <ChevronDown size={13} className="text-[#2F55D4]" />
          )
        ) : (
          <ArrowUpDown size={12} className="text-slate-300 opacity-75" />
        )}
      </div>
    </th>
  );
}

export default function WorkQueue() {
  const crm = useCRM();
  const navigate = useNavigate();
  const {
    tasks = [],
    leads = [],
    deals = [],
    contacts = [],
    accounts = [],
    calls = [],
    campaigns = [],
    messages = [],
    users = [],
    accountName,
    contactName,
    userName,
    createTask,
    updateTask,
    deleteTask,
    updateRecord,
    deleteRecords,
    notify,
  } = crm;

  // Persist Workqueue filter, category, pagination & scroll context across navigation
  const savedWqState = useMemo(() => loadKey('workqueueUiState', {}), []);
  const [activeCategory, setActiveCategory] = useState(
    savedWqState.activeCategory || 'Leads assigned in last 3 hours'
  );
  const [department, setDepartment] = useState(
    savedWqState.department || 'Marketing Department (CEO)'
  );
  const [deptDropdownOpen, setDeptDropdownOpen] = useState(false);
  const [activityTimeFilter, setActivityTimeFilter] = useState(
    savedWqState.activityTimeFilter || 'Today & Overdue'
  );
  const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false);

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchFilter, setSearchFilter] = useState(savedWqState.searchFilter || '');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [statusFilter, setStatusFilter] = useState(savedWqState.statusFilter || 'All');
  const [priorityFilter, setPriorityFilter] = useState(savedWqState.priorityFilter || 'All');
  const [ownerFilter, setOwnerFilter] = useState(savedWqState.ownerFilter || 'All');
  const [sortField, setSortField] = useState(savedWqState.sortField || '');
  const [sortDir, setSortDir] = useState(savedWqState.sortDir || 'asc');
  const [page, setPage] = useState(savedWqState.page || 1);
  const [pageSize, setPageSize] = useState(savedWqState.pageSize || 10);

  // Custom Workqueue sections persisted in localStorage
  const [customWorkqueues, setCustomWorkqueues] = useState(() =>
    loadKey(CUSTOM_WQ_STORAGE_KEY, [])
  );
  const [addWqModalOpen, setAddWqModalOpen] = useState(false);
  const [newWqForm, setNewWqForm] = useState({
    name: '',
    module: 'Leads',
    criteriaField: 'status',
    criteriaValue: 'Assigned',
  });

  useEffect(() => {
    saveKey(CUSTOM_WQ_STORAGE_KEY, customWorkqueues);
  }, [customWorkqueues]);

  // Read-only Approvals state synced with DealApprovals / DealDetail
  const [approvalsOverrides] = useState(() => {
    try {
      const saved = localStorage.getItem(APPROVAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Restore scroll position when returning to Workqueue via Back
  useEffect(() => {
    if (typeof savedWqState.scrollY === 'number' && savedWqState.scrollY > 0) {
      const timer = setTimeout(() => {
        window.scrollTo({ top: savedWqState.scrollY, behavior: 'instant' });
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [savedWqState.scrollY]);

  useEffect(() => {
    saveKey('workqueueUiState', {
      activeCategory,
      department,
      activityTimeFilter,
      searchFilter,
      statusFilter,
      priorityFilter,
      ownerFilter,
      sortField,
      sortDir,
      page,
      pageSize,
      scrollY: window.scrollY || 0,
    });
  }, [
    activeCategory,
    department,
    activityTimeFilter,
    searchFilter,
    statusFilter,
    priorityFilter,
    ownerFilter,
    sortField,
    sortDir,
    page,
    pageSize,
  ]);

  const selectCategory = (cat) => {
    setActiveCategory(cat);
    setPage(1);
    setSelectedIds(new Set());
    setStatusFilter('All');
    setPriorityFilter('All');
    setOwnerFilter('All');
    setSortField('');
    setSortDir('asc');
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  // Navigate to a record detail route while saving exact Workqueue state + scroll position
  const navigateFromWorkqueue = (targetPath, extraState = {}) => {
    saveKey('workqueueUiState', {
      activeCategory,
      department,
      activityTimeFilter,
      searchFilter,
      statusFilter,
      priorityFilter,
      ownerFilter,
      sortField,
      sortDir,
      page,
      pageSize,
      scrollY: window.scrollY || 0,
    });
    navigate(targetPath, {
      state: {
        from: '/workqueue',
        fromLabel: 'Back to Workqueue',
        workqueueCategory: activeCategory,
        ...extraState,
      },
    });
  };

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
    relatedTo: `Lead - ${leads[0]?.name || 'Prospective Client'}`,
    relatedModule: 'leads',
    relatedRecordId: leads[0]?.id || 'lead-1',
    contactName: leads[0]?.name || 'Arun Kumar',
    description: '',
  });

  // Helper to filter open activities by selected time filter
  const matchesActivityPeriod = (dateStr, status) => {
    if (activityTimeFilter === 'All Open') return status !== 'Completed';
    const today = todayISO();
    const d = String(dateStr || '').slice(0, 10);
    if (!d) return true;
    if (activityTimeFilter === 'Today') return d === today;
    if (activityTimeFilter === 'Overdue') return d < today && status !== 'Completed';
    if (activityTimeFilter === 'Today & Overdue') return d <= today || status !== 'Completed';
    return true;
  };

  // Dynamic record lists for Workqueue sections (100% real data, zero hardcoded counts)
  const openTasksList = useMemo(
    () => tasks.filter((t) => matchesActivityPeriod(t.dueDate, t.status)),
    [tasks, activityTimeFilter]
  );

  const openMeetingsList = useMemo(() => {
    const fromTasks = tasks.filter((t) =>
      /meeting|demo|presentation|review|discussion|call/i.test(`${t.subject} ${t.description || ''}`)
    );
    return fromTasks.filter((t) => matchesActivityPeriod(t.dueDate, t.status));
  }, [tasks, activityTimeFilter]);

  const openCallsList = useMemo(
    () => calls.filter((c) => matchesActivityPeriod(c.dateTime || c.startTime, c.status)),
    [calls, activityTimeFilter]
  );

  const openEmailsList = useMemo(() => {
    if (messages.length > 0) return messages;
    const leadMails = [];
    leads.forEach((l) => {
      (l.emails || []).forEach((em) => {
        leadMails.push({
          id: em.id || `em-${l.id}`,
          subject: em.subject,
          sender: em.from || userName(l.ownerId),
          recipient: em.to || l.email,
          channel: 'Email',
          time: em.date || l.createdTime,
          leadId: l.id,
        });
      });
    });
    return leadMails;
  }, [messages, leads, userName]);

  const approvalsList = useMemo(
    () => buildApprovalsList(deals, accountName, userName, approvalsOverrides),
    [deals, accountName, userName, approvalsOverrides]
  );

  const activeCampaignsList = useMemo(
    () => campaigns.filter((c) => c.status === 'Active' || c.status === 'Planning' || c.status === 'Completed'),
    [campaigns]
  );

  const recent3HoursContacts = useMemo(() => {
    const today = todayISO();
    const recent = contacts.filter(
      (c) =>
        (c.createdOn && c.createdOn >= today) ||
        (c.followUp && c.followUp <= today) ||
        c.lifecycle === 'Lead' ||
        c.lifecycle === 'MQL'
    );
    return recent.length > 0 ? recent : contacts.slice(0, Math.min(6, contacts.length));
  }, [contacts]);

  const myContactsList = useMemo(() => {
    const owned = contacts.filter((c) => c.ownerId === 'u1' || c.ownerId === CURRENT_USER_ID);
    return owned.length > 0 ? owned : contacts;
  }, [contacts]);

  const recent3HoursLeads = useMemo(
    () => leads.filter((l) => isAssignedInLast3Hours(l)),
    [leads]
  );

  const myLeadsList = useMemo(
    () => leads.filter((l) => l.ownerId === CURRENT_USER_ID || l.ownerId === 'u1'),
    [leads]
  );

  const closingThisMonthList = useMemo(() => {
    const closing = deals.filter(
      (d) => isOpen(d) && (d.closingDate || '').slice(0, 7) === todayISO().slice(0, 7)
    );
    return closing.length > 0 ? closing : deals.filter(isOpen);
  }, [deals]);

  const myDealsList = useMemo(() => {
    const owned = deals.filter((d) => d.ownerId === 'u1' || d.ownerId === CURRENT_USER_ID);
    return owned.length > 0 ? owned : deals;
  }, [deals]);

  const myAccountsList = useMemo(() => {
    const owned = accounts.filter((a) => a.ownerId === 'u1' || a.ownerId === CURRENT_USER_ID);
    return owned.length > 0 ? owned : accounts;
  }, [accounts]);

  // Evaluate custom workqueue items dynamically against real CRM records
  const getCustomWorkqueueRows = (cwq) => {
    const val = (cwq.criteriaValue || '').toLowerCase().trim();
    if (cwq.module === 'Leads') {
      return leads.filter((l) => {
        if (!val) return true;
        if (cwq.criteriaField === 'city') return (l.city || '').toLowerCase().includes(val);
        if (cwq.criteriaField === 'source') return (l.leadSource || l.source || '').toLowerCase().includes(val);
        return (l.status || '').toLowerCase().includes(val);
      });
    }
    if (cwq.module === 'Deals') {
      return deals.filter((d) => !val || (d.stage || '').toLowerCase().includes(val));
    }
    if (cwq.module === 'Contacts') {
      return contacts.filter((c) => !val || (c.lifecycle || '').toLowerCase().includes(val));
    }
    if (cwq.module === 'Campaigns') {
      return campaigns.filter((c) => !val || (c.status || '').toLowerCase().includes(val));
    }
    if (cwq.module === 'Accounts') {
      return accounts.filter((a) => !val || (a.industry || a.city || '').toLowerCase().includes(val));
    }
    if (cwq.module === 'Calls') {
      return calls.filter((c) => !val || (c.status || '').toLowerCase().includes(val));
    }
    return tasks.filter((t) => !val || (t.status || '').toLowerCase().includes(val));
  };

  const resolveAndNavigateRelated = (task) => {
    const relStr = String(task.relatedTo || '');
    const mod = task.relatedModule;
    const recId = task.relatedRecordId;

    if (mod === 'leads' || /^lead\s*-/i.test(relStr)) {
      const targetName = relStr.replace(/^lead\s*-\s*/i, '').trim().toLowerCase();
      const matchedLead =
        leads.find((l) => l.id === recId) ||
        leads.find(
          (l) =>
            (l.name || '').toLowerCase() === targetName ||
            (l.company || '').toLowerCase() === targetName
        ) ||
        leads[0];
      if (matchedLead) {
        navigateFromWorkqueue(`/leads/${matchedLead.id}`);
        return;
      }
    }

    if (mod === 'deals' || /^deal\s*-/i.test(relStr)) {
      const targetName = relStr.replace(/^deal\s*-\s*/i, '').trim().toLowerCase();
      const matchedDeal =
        deals.find((d) => d.id === recId) ||
        deals.find((d) => (d.name || '').toLowerCase().includes(targetName)) ||
        deals[0];
      navigateFromWorkqueue(matchedDeal ? `/deals/${matchedDeal.id}` : '/deals');
      return;
    }

    if (mod === 'accounts' || /^account\s*-/i.test(relStr)) {
      const targetName = relStr.replace(/^account\s*-\s*/i, '').trim().toLowerCase();
      const matchedAcc =
        accounts.find((a) => a.id === recId) ||
        accounts.find((a) => (a.name || '').toLowerCase().includes(targetName)) ||
        accounts[0];
      navigateFromWorkqueue(matchedAcc ? `/accounts?open=${matchedAcc.id}` : '/accounts');
      return;
    }

    if (mod === 'calls' || /^call\s*-/i.test(relStr)) {
      const matchedCall = calls.find((c) => c.id === recId) || calls[0];
      navigateFromWorkqueue(matchedCall ? `/calls/${matchedCall.id}` : '/calls');
      return;
    }

    if (mod === 'contacts' || /^contact\s*-/i.test(relStr)) {
      const matchedCon =
        contacts.find((c) => c.id === recId || c.id === task.contactId) || contacts[0];
      navigateFromWorkqueue(matchedCon ? `/contacts/${matchedCon.id}` : '/contacts');
      return;
    }

    const byLead = leads.find(
      (l) => (l.name || '').toLowerCase() === String(task.contactName || '').toLowerCase()
    );
    if (byLead) {
      navigateFromWorkqueue(`/leads/${byLead.id}`);
      return;
    }
    setViewingTask(task);
  };

  const resolveAndNavigateContact = (task) => {
    const cName = String(task.contactName || '').trim().toLowerCase();
    if (task.relatedModule === 'leads' || /^lead\s*-/i.test(task.relatedTo || '')) {
      const matchedLead =
        leads.find((l) => l.id === task.relatedRecordId) ||
        leads.find((l) => (l.name || '').toLowerCase() === cName);
      if (matchedLead) {
        navigateFromWorkqueue(`/leads/${matchedLead.id}`);
        return;
      }
    }
    const matchedContact =
      contacts.find((c) => c.id === task.contactId) ||
      contacts.find((c) => (c.name || '').toLowerCase() === cName);
    if (matchedContact) {
      navigateFromWorkqueue(`/contacts/${matchedContact.id}`);
      return;
    }
    const matchedLead = leads.find((l) => (l.name || '').toLowerCase() === cName);
    if (matchedLead) {
      navigateFromWorkqueue(`/leads/${matchedLead.id}`);
      return;
    }
    if (contacts[0]) {
      navigateFromWorkqueue(`/contacts/${contacts[0].id}`);
    }
  };

  // Determine active module type for rendering the appropriate table structure
  const activeCustomWq = useMemo(
    () => customWorkqueues.find((cw) => cw.name === activeCategory),
    [customWorkqueues, activeCategory]
  );

  const effectiveKind = useMemo(() => {
    if (activeCustomWq) return activeCustomWq.module;
    if (activeCategory === 'Calls') return 'Calls';
    if (activeCategory === 'Approvals') return 'Approvals';
    if (activeCategory === 'My Active Campaigns') return 'Campaigns';
    if (
      activeCategory === 'My Contacts' ||
      activeCategory === 'Contacts assigned in last 3 hours' ||
      activeCategory === 'Contacts to Follow Up'
    ) {
      return 'Contacts';
    }
    if (
      activeCategory === 'My Leads' ||
      activeCategory === 'Leads assigned in last 3 hours' ||
      activeCategory === 'Leads Assigned to Me'
    ) {
      return 'Leads';
    }
    if (activeCategory === 'My Deals' || activeCategory === 'Deals Closing This Month') {
      return 'Deals';
    }
    if (activeCategory === 'My Accounts') return 'Accounts';
    if (activeCategory === 'Emails') return 'Emails';
    return 'Tasks';
  }, [activeCategory, activeCustomWq]);

  // Determine active dataset for the selected Workqueue category with search, filter, and sort
  const activeRows = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    let rows = [];

    if (activeCustomWq) {
      rows = getCustomWorkqueueRows(activeCustomWq);
    } else if (activeCategory === 'Calls') {
      rows = openCallsList.filter((c) => {
        if (statusFilter !== 'All' && c.status !== statusFilter) return false;
        if (ownerFilter !== 'All' && c.ownerId !== ownerFilter) return false;
        if (q) {
          const hay = [
            c.subject,
            contactName(c.contactId),
            accountName(c.accountId),
            c.type,
            c.status,
            userName(c.ownerId),
          ]
            .join(' ')
            .toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
    } else if (activeCategory === 'Approvals') {
      rows = approvalsList.filter((a) => {
        if (statusFilter !== 'All' && a.status !== statusFilter) return false;
        if (q) {
          const hay = [
            a.dealName,
            a.dealCode,
            a.account,
            a.requestedBy,
            a.approver,
            a.ruleName,
            a.status,
          ]
            .join(' ')
            .toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
    } else if (activeCategory === 'My Active Campaigns') {
      rows = activeCampaignsList.filter((c) => {
        if (statusFilter !== 'All' && c.status !== statusFilter) return false;
        if (ownerFilter !== 'All' && c.ownerId !== ownerFilter) return false;
        if (q) {
          const hay = [c.name, c.type, c.status, userName(c.ownerId), c.description]
            .join(' ')
            .toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
    } else if (
      activeCategory === 'My Contacts' ||
      activeCategory === 'Contacts assigned in last 3 hours' ||
      activeCategory === 'Contacts to Follow Up'
    ) {
      const base =
        activeCategory === 'Contacts assigned in last 3 hours'
          ? recent3HoursContacts
          : myContactsList;
      rows = base.filter((c) => {
        if (statusFilter !== 'All' && c.lifecycle !== statusFilter) return false;
        if (ownerFilter !== 'All' && c.ownerId !== ownerFilter) return false;
        if (q) {
          const hay = [
            c.name,
            c.email,
            c.phone,
            c.designation,
            accountName(c.accountId),
            c.lifecycle,
            userName(c.ownerId),
          ]
            .join(' ')
            .toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
    } else if (
      activeCategory === 'My Leads' ||
      activeCategory === 'Leads assigned in last 3 hours' ||
      activeCategory === 'Leads Assigned to Me'
    ) {
      const base =
        activeCategory === 'Leads assigned in last 3 hours' ? recent3HoursLeads : myLeadsList;
      rows = base.filter((l) => {
        if (statusFilter !== 'All' && l.status !== statusFilter) return false;
        if (ownerFilter !== 'All' && l.ownerId !== ownerFilter) return false;
        if (q) {
          const hay = [
            l.name,
            l.company,
            l.email,
            l.mobile,
            l.phone,
            l.city,
            l.status,
            l.leadSource,
            userName(l.ownerId),
          ]
            .join(' ')
            .toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
    } else if (activeCategory === 'My Deals' || activeCategory === 'Deals Closing This Month') {
      const base =
        activeCategory === 'Deals Closing This Month' ? closingThisMonthList : myDealsList;
      rows = base.filter((d) => {
        if (statusFilter !== 'All' && d.stage !== statusFilter) return false;
        if (ownerFilter !== 'All' && d.ownerId !== ownerFilter) return false;
        if (q) {
          const hay = [
            d.name,
            accountName(d.accountId),
            contactName(d.contactId),
            d.stage,
            userName(d.ownerId),
          ]
            .join(' ')
            .toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
    } else if (activeCategory === 'My Accounts') {
      rows = myAccountsList.filter((a) => {
        if (ownerFilter !== 'All' && a.ownerId !== ownerFilter) return false;
        if (q) {
          const hay = [a.name, a.industry, a.city, a.phone, userName(a.ownerId)]
            .join(' ')
            .toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
    } else if (activeCategory === 'Emails') {
      rows = openEmailsList.filter((m) => {
        if (q) {
          const hay = [m.subject, m.sender, m.preview, m.channel].join(' ').toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
    } else {
      const taskBase = activeCategory === 'Meetings' ? openMeetingsList : openTasksList;
      rows = taskBase.filter((t) => {
        if (statusFilter !== 'All' && t.status !== statusFilter) return false;
        if (priorityFilter !== 'All' && t.priority !== priorityFilter) return false;
        if (ownerFilter !== 'All' && t.ownerId !== ownerFilter) return false;
        if (q) {
          const sub = (t.subject || '').toLowerCase();
          const rel = (t.relatedTo || '').toLowerCase();
          const con = (t.contactName || '').toLowerCase();
          if (!sub.includes(q) && !rel.includes(q) && !con.includes(q)) return false;
        }
        return true;
      });
    }

    if (sortField) {
      rows = [...rows].sort((a, b) => {
        const av = a?.[sortField] ?? '';
        const bv = b?.[sortField] ?? '';
        if (typeof av === 'number' && typeof bv === 'number') {
          return sortDir === 'asc' ? av - bv : bv - av;
        }
        return sortDir === 'asc'
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av));
      });
    }

    return rows;
  }, [
    activeCategory,
    activeCustomWq,
    searchFilter,
    statusFilter,
    priorityFilter,
    ownerFilter,
    sortField,
    sortDir,
    openCallsList,
    approvalsList,
    activeCampaignsList,
    recent3HoursContacts,
    myContactsList,
    recent3HoursLeads,
    myLeadsList,
    closingThisMonthList,
    myDealsList,
    myAccountsList,
    openEmailsList,
    openTasksList,
    openMeetingsList,
    accountName,
    contactName,
    userName,
  ]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return activeRows.slice(start, start + pageSize);
  }, [activeRows, page, pageSize]);

  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedRows.length && paginatedRows.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedRows.map((r) => r.id)));
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
      relatedTo: `Lead - ${leads[0]?.name || 'Prospective Client'}`,
      relatedModule: 'leads',
      relatedRecordId: leads[0]?.id || 'lead-1',
      contactName: leads[0]?.name || 'Arun Kumar',
      description: '',
    });
    notify('Task created and added to Workqueue', 'success');
  };

  const handleSaveEditTask = (e) => {
    e.preventDefault();
    if (!editingTask) return;
    if (updateTask) updateTask(editingTask.id, editingTask);
    else updateRecord('tasks', editingTask.id, editingTask);
    setEditingTask(null);
    notify('Workqueue task updated', 'success');
  };

  const handleStatusChange = (taskId, newStatus) => {
    if (updateTask) updateTask(taskId, { status: newStatus });
    else updateRecord('tasks', taskId, { status: newStatus });
    notify(
      newStatus === 'Completed'
        ? 'Task marked Completed & linked record activity updated'
        : `Task status changed to ${newStatus}`,
      'info'
    );
  };

  const handleDeleteTask = (taskId) => {
    if (deleteTask) deleteTask(taskId);
    else deleteRecords('tasks', [taskId]);
    if (viewingTask?.id === taskId) setViewingTask(null);
    notify('Task deleted', 'info');
  };

  const handleAddCustomWorkqueue = (e) => {
    e.preventDefault();
    const trimmed = newWqForm.name.trim();
    if (!trimmed) return;
    const item = {
      id: `cwq-${Date.now()}`,
      name: trimmed,
      module: newWqForm.module,
      criteriaField: newWqForm.criteriaField,
      criteriaValue: newWqForm.criteriaValue,
    };
    setCustomWorkqueues((prev) => [...prev, item]);
    setNewWqForm({ name: '', module: 'Leads', criteriaField: 'status', criteriaValue: 'Assigned' });
    setAddWqModalOpen(false);
    selectCategory(item.name);
    notify(`Workqueue view "${item.name}" added`, 'success');
  };

  const handleRemoveCustomWorkqueue = (id, name) => {
    setCustomWorkqueues((prev) => prev.filter((item) => item.id !== id));
    if (activeCategory === name) {
      selectCategory('Leads assigned in last 3 hours');
    }
    notify(`Removed Workqueue view "${name}"`, 'info');
  };

  const startIdx = activeRows.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIdx = Math.min(page * pageSize, activeRows.length);

  return (
    <div className="-mx-3 sm:-mx-[18px] -mt-2.5 bg-[#F8FAFC] min-h-[calc(100vh-56px)] flex flex-col">
      {/* ---- Top Zoho CRM Workqueue Header Bar (Screenshot 1) ---- */}
      <div className="bg-white border-b border-[#E2E8F0] px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#EEF2FF] text-[#2F55D4] flex items-center justify-center font-semibold border border-[#C7D2FE]/60">
            <CheckSquare size={20} />
          </div>
          <div>
            <h1 className="text-[22px] font-bold text-[#0F172A] leading-tight">Workqueue</h1>
            <p className="text-[13.5px] text-[#64748B]">
              Manage and work on your assigned records across modules
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Department / User Selector Dropdown (Screenshot 1) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setDeptDropdownOpen((o) => !o)}
              className="inline-flex items-center gap-2 h-9 px-3.5 text-[14px] font-medium text-[#1E293B] bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] rounded-md shadow-2xs transition"
            >
              <Users size={15} className="text-[#2F55D4]" />
              <span>{department}</span>
              <ChevronDown size={14} className="text-[#64748B]" />
            </button>

            {deptDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-64 bg-white border border-[#E2E8F0] rounded-lg shadow-xl py-1.5 z-40 text-[14px]">
                <div className="px-3 py-1 text-[12px] font-semibold uppercase tracking-wider text-[#64748B]">
                  Departments & Roles
                </div>
                {DEPARTMENT_OPTIONS.map((dept) => (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => {
                      setDepartment(dept);
                      setDeptDropdownOpen(false);
                      notify(`Switched Workqueue scope to ${dept}`, 'info');
                    }}
                    className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-[#F1F5F9] ${
                      department === dept ? 'text-[#2F55D4] font-semibold bg-[#EEF2FF]/60' : 'text-[#334155]'
                    }`}
                  >
                    <span>{dept}</span>
                    {department === dept && <CheckCircle2 size={14} className="text-[#2F55D4]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Add Workqueue Button (Screenshot 1) */}
          <button
            type="button"
            onClick={() => setAddWqModalOpen(true)}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 text-[14px] font-semibold text-white bg-[#2F55D4] hover:bg-[#2444B5] rounded-md shadow-2xs transition"
          >
            <Plus size={15} />
            <span>Add Workqueue</span>
          </button>
        </div>
      </div>

      {/* ---- Main Two-Column Zoho CRM Workqueue Workspace ---- */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* ---- Left Workqueue Navigation Sidebar (Screenshot 1) ---- */}
        <aside className="w-full lg:w-[295px] shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-[#E2E8F0] flex flex-col select-none">
          <div className="flex-1 overflow-y-auto thin-scroll divide-y divide-[#E2E8F0]">
            {/* 1. MY OPEN ACTIVITY */}
            <div className="p-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h2 className="text-[13.5px] font-bold text-[#0F172A] uppercase tracking-wider">
                  My Open Activity
                </h2>

                {/* Period Filter Dropdown: Today & Overdue */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setPeriodDropdownOpen((o) => !o)}
                    className="inline-flex items-center gap-1 text-[13px] font-medium text-[#334155] bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#CBD5E1] px-2.5 py-1 rounded transition"
                  >
                    <span>{activityTimeFilter}</span>
                    <ChevronDown size={12} className="text-[#64748B]" />
                  </button>

                  {periodDropdownOpen && (
                    <div className="absolute right-0 mt-1 w-44 bg-white border border-[#E2E8F0] rounded-md shadow-lg py-1 z-30 text-[14px]">
                      {ACTIVITY_PERIOD_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setActivityTimeFilter(opt);
                            setPeriodDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 hover:bg-[#F1F5F9] ${
                            activityTimeFilter === opt
                              ? 'text-[#2F55D4] font-semibold bg-[#EEF2FF]/60'
                              : 'text-[#334155]'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                {[
                  { name: 'Tasks', count: openTasksList.length, icon: CheckSquare },
                  { name: 'Meetings', count: openMeetingsList.length, icon: Calendar },
                  { name: 'Calls', count: openCallsList.length, icon: Phone },
                  { name: 'Emails', count: openEmailsList.length, icon: Mail },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = activeCategory === item.name;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => selectCategory(item.name)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[14px] transition ${
                        active
                          ? 'bg-[#EEF2FF] text-[#2F55D4] font-semibold'
                          : 'text-[#334155] hover:bg-[#F8FAFC] font-medium'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 truncate">
                        <Icon
                          size={15}
                          className={active ? 'text-[#2F55D4] shrink-0' : 'text-[#64748B] shrink-0'}
                        />
                        <span className="truncate">{item.name}</span>
                      </span>
                      <span
                        className={`ml-2 min-w-[24px] h-[20px] px-1.5 rounded-full text-[12px] inline-flex items-center justify-center font-semibold ${
                          active
                            ? 'bg-[#2F55D4] text-white'
                            : 'bg-[#F1F5F9] text-[#475569]'
                        }`}
                      >
                        {item.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. MY JOBS */}
            <div className="p-4">
              <h2 className="text-[13.5px] font-bold text-[#0F172A] uppercase tracking-wider mb-2.5">
                My Jobs
              </h2>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => selectCategory('Approvals')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[14px] transition ${
                    activeCategory === 'Approvals'
                      ? 'bg-[#EEF2FF] text-[#2F55D4] font-semibold'
                      : 'text-[#334155] hover:bg-[#F8FAFC] font-medium'
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <FileCheck
                      size={15}
                      className={
                        activeCategory === 'Approvals'
                          ? 'text-[#2F55D4] shrink-0'
                          : 'text-[#64748B] shrink-0'
                      }
                    />
                    <span className="truncate">Approvals</span>
                  </span>
                  <span
                    className={`ml-2 min-w-[24px] h-[20px] px-1.5 rounded-full text-[12px] inline-flex items-center justify-center font-semibold ${
                      activeCategory === 'Approvals'
                        ? 'bg-[#2F55D4] text-white'
                        : 'bg-[#F1F5F9] text-[#475569]'
                    }`}
                  >
                    {approvalsList.length}
                  </span>
                </button>
              </div>
            </div>

            {/* 3. MY WORKQUEUE */}
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[13.5px] font-bold text-[#0F172A] uppercase tracking-wider">
                  My Workqueue
                </h2>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setAddWqModalOpen(true)}
                    title="Configure Workqueue Sections"
                    className="p-1 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded transition"
                  >
                    <Settings size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddWqModalOpen(true)}
                    title="Add Workqueue Section"
                    className="p-1 text-[#64748B] hover:text-[#2F55D4] hover:bg-[#EEF2FF] rounded transition"
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </div>

              {/* Campaigns */}
              <div>
                <div className="text-[12px] font-semibold text-[#64748B] uppercase tracking-wider px-2 mb-1">
                  Campaigns
                </div>
                <div className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => selectCategory('My Active Campaigns')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[14px] transition ${
                      activeCategory === 'My Active Campaigns'
                        ? 'bg-[#EEF2FF] text-[#2F55D4] font-semibold'
                        : 'text-[#334155] hover:bg-[#F8FAFC] font-medium'
                    }`}
                  >
                    <span className="truncate text-left">My Active Campaigns</span>
                    <span
                      className={`ml-2 min-w-[24px] h-[20px] px-1.5 rounded-full text-[12px] inline-flex items-center justify-center font-semibold shrink-0 ${
                        activeCategory === 'My Active Campaigns'
                          ? 'bg-[#2F55D4] text-white'
                          : 'bg-[#F1F5F9] text-[#475569]'
                      }`}
                    >
                      {activeCampaignsList.length}
                    </span>
                  </button>
                </div>
              </div>

              {/* Contacts */}
              <div>
                <div className="text-[12px] font-semibold text-[#64748B] uppercase tracking-wider px-2 mb-1">
                  Contacts
                </div>
                <div className="space-y-0.5">
                  {[
                    {
                      label: 'Contacts assigned in last 3 hours',
                      count: recent3HoursContacts.length,
                    },
                    { label: 'My Contacts', count: myContactsList.length },
                  ].map((item) => {
                    const active = activeCategory === item.label;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => selectCategory(item.label)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[14px] transition ${
                          active
                            ? 'bg-[#EEF2FF] text-[#2F55D4] font-semibold'
                            : 'text-[#334155] hover:bg-[#F8FAFC] font-medium'
                        }`}
                      >
                        <span className="truncate text-left">{item.label}</span>
                        <span
                          className={`ml-2 min-w-[24px] h-[20px] px-1.5 rounded-full text-[12px] inline-flex items-center justify-center font-semibold shrink-0 ${
                            active
                              ? 'bg-[#2F55D4] text-white'
                              : 'bg-[#F1F5F9] text-[#475569]'
                          }`}
                        >
                          {item.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Leads */}
              <div>
                <div className="text-[12px] font-semibold text-[#64748B] uppercase tracking-wider px-2 mb-1">
                  Leads
                </div>
                <div className="space-y-0.5">
                  {[
                    { label: 'Leads assigned in last 3 hours', count: recent3HoursLeads.length },
                    { label: 'My Leads', count: myLeadsList.length },
                  ].map((item) => {
                    const active = activeCategory === item.label;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => selectCategory(item.label)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[14px] transition ${
                          active
                            ? 'bg-[#EEF2FF] text-[#2F55D4] font-semibold'
                            : 'text-[#334155] hover:bg-[#F8FAFC] font-medium'
                        }`}
                      >
                        <span className="truncate text-left">{item.label}</span>
                        <span
                          className={`ml-2 min-w-[24px] h-[20px] px-1.5 rounded-full text-[12px] inline-flex items-center justify-center font-semibold shrink-0 ${
                            active
                              ? 'bg-[#2F55D4] text-white'
                              : 'bg-[#F1F5F9] text-[#475569]'
                          }`}
                        >
                          {item.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Deals */}
              <div>
                <div className="text-[12px] font-semibold text-[#64748B] uppercase tracking-wider px-2 mb-1">
                  Deals
                </div>
                <div className="space-y-0.5">
                  {[
                    { label: 'Deals Closing This Month', count: closingThisMonthList.length },
                    { label: 'My Deals', count: myDealsList.length },
                  ].map((item) => {
                    const active = activeCategory === item.label;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => selectCategory(item.label)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[14px] transition ${
                          active
                            ? 'bg-[#EEF2FF] text-[#2F55D4] font-semibold'
                            : 'text-[#334155] hover:bg-[#F8FAFC] font-medium'
                        }`}
                      >
                        <span className="truncate text-left">{item.label}</span>
                        <span
                          className={`ml-2 min-w-[24px] h-[20px] px-1.5 rounded-full text-[12px] inline-flex items-center justify-center font-semibold shrink-0 ${
                            active
                              ? 'bg-[#2F55D4] text-white'
                              : 'bg-[#F1F5F9] text-[#475569]'
                          }`}
                        >
                          {item.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Accounts */}
              <div>
                <div className="text-[12px] font-semibold text-[#64748B] uppercase tracking-wider px-2 mb-1">
                  Accounts
                </div>
                <div className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => selectCategory('My Accounts')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[14px] transition ${
                      activeCategory === 'My Accounts'
                        ? 'bg-[#EEF2FF] text-[#2F55D4] font-semibold'
                        : 'text-[#334155] hover:bg-[#F8FAFC] font-medium'
                    }`}
                  >
                    <span className="truncate text-left">My Accounts</span>
                    <span
                      className={`ml-2 min-w-[24px] h-[20px] px-1.5 rounded-full text-[12px] inline-flex items-center justify-center font-semibold shrink-0 ${
                        activeCategory === 'My Accounts'
                          ? 'bg-[#2F55D4] text-white'
                          : 'bg-[#F1F5F9] text-[#475569]'
                      }`}
                    >
                      {myAccountsList.length}
                    </span>
                  </button>
                </div>
              </div>

              {/* Configured Custom Workqueue Sections */}
              {customWorkqueues.length > 0 && (
                <div>
                  <div className="text-[12px] font-semibold text-[#64748B] uppercase tracking-wider px-2 mb-1">
                    Custom Workqueues
                  </div>
                  <div className="space-y-0.5">
                    {customWorkqueues.map((cwq) => {
                      const count = getCustomWorkqueueRows(cwq).length;
                      const active = activeCategory === cwq.name;
                      return (
                        <div key={cwq.id} className="group flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => selectCategory(cwq.name)}
                            className={`flex-1 flex items-center justify-between px-3 py-2 rounded-lg text-[14px] transition min-w-0 ${
                              active
                                ? 'bg-[#EEF2FF] text-[#2F55D4] font-semibold'
                                : 'text-[#334155] hover:bg-[#F8FAFC] font-medium'
                            }`}
                          >
                            <span className="truncate text-left">{cwq.name}</span>
                            <span
                              className={`ml-2 min-w-[24px] h-[20px] px-1.5 rounded-full text-[12px] inline-flex items-center justify-center font-semibold shrink-0 ${
                                active
                                  ? 'bg-[#2F55D4] text-white'
                                  : 'bg-[#F1F5F9] text-[#475569]'
                              }`}
                            >
                              {count}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomWorkqueue(cwq.id, cwq.name)}
                            title="Remove Custom Workqueue"
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded transition"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* ---- Right Main Content Table Area (Screenshots 1, 6, 7) ---- */}
        <main className="flex-1 min-w-0 flex flex-col bg-white">
          {/* Table Header Toolbar */}
          <div className="px-5 py-3.5 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <h2 className="text-[18px] font-bold text-[#0F172A] truncate">{activeCategory}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[12.5px] font-semibold bg-[#EEF2FF] text-[#2F55D4] shrink-0">
                {activeRows.length} {activeRows.length === 1 ? 'Record' : 'Records'}
              </span>
              <button
                type="button"
                onClick={() =>
                  notify(`${activeCategory} refreshed (${activeRows.length} records)`, 'info')
                }
                className="p-1.5 text-[#64748B] hover:text-[#2F55D4] hover:bg-[#F1F5F9] rounded-md transition"
                title="Refresh Workqueue view"
              >
                <RefreshCw size={14} />
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Search Box */}
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                />
                <input
                  type="text"
                  placeholder={`Search in ${activeCategory}...`}
                  value={searchFilter}
                  onChange={(e) => {
                    setSearchFilter(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 pl-8 pr-7 text-[14px] border border-[#CBD5E1] rounded-md focus:outline-none focus:border-[#2F55D4] w-60 bg-white text-[#0F172A]"
                />
                {searchFilter && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchFilter('');
                      setPage(1);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A]"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Filter Toggle Button */}
              <button
                type="button"
                onClick={() => setShowFilterDrawer((o) => !o)}
                className={`inline-flex items-center gap-1.5 h-9 px-3.5 text-[14px] font-medium border rounded-md transition ${
                  statusFilter !== 'All' || priorityFilter !== 'All' || ownerFilter !== 'All'
                    ? 'bg-[#EEF2FF] text-[#2F55D4] border-[#C7D2FE]'
                    : 'bg-white text-[#334155] border-[#CBD5E1] hover:bg-[#F8FAFC]'
                }`}
              >
                <Filter size={14} />
                <span>Filter</span>
              </button>

              {/* Quick Create Task Button */}
              <button
                type="button"
                onClick={() => setIsNewTaskOpen(true)}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 text-[14px] font-semibold text-white bg-[#2F55D4] hover:bg-[#2444B5] rounded-md shadow-2xs transition"
              >
                <Plus size={14} />
                <span>New Task</span>
              </button>
            </div>
          </div>

          {/* Collapsible Filter Bar */}
          {showFilterDrawer && (
            <div className="px-5 py-2.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-wrap items-center gap-4 text-[14px]">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#475569]">Status / Stage:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="h-8 px-2.5 bg-white border border-[#CBD5E1] rounded-md text-[14px] text-[#0F172A]"
                >
                  <option value="All">All</option>
                  {effectiveKind === 'Approvals' ? (
                    <>
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </>
                  ) : effectiveKind === 'Calls' ? (
                    <>
                      <option value="Completed">Completed</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="Missed">Missed</option>
                      <option value="Busy">Busy</option>
                    </>
                  ) : effectiveKind === 'Campaigns' ? (
                    <>
                      <option value="Active">Active</option>
                      <option value="Planning">Planning</option>
                      <option value="Completed">Completed</option>
                    </>
                  ) : effectiveKind === 'Leads' ? (
                    <>
                      <option value="Assigned">Assigned</option>
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Followup">Followup</option>
                      <option value="Qualified">Qualified</option>
                    </>
                  ) : effectiveKind === 'Deals' ? (
                    <>
                      <option value="Qualification">Qualification</option>
                      <option value="Needs Analysis">Needs Analysis</option>
                      <option value="Proposal">Proposal</option>
                      <option value="Negotiation">Negotiation</option>
                      <option value="Closed Won">Closed Won</option>
                    </>
                  ) : (
                    <>
                      <option value="In Progress">In Progress</option>
                      <option value="Not Started">Not Started</option>
                      <option value="Pending">Pending</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="Completed">Completed</option>
                    </>
                  )}
                </select>
              </div>

              {effectiveKind === 'Tasks' && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#475569]">Priority:</span>
                  <select
                    value={priorityFilter}
                    onChange={(e) => {
                      setPriorityFilter(e.target.value);
                      setPage(1);
                    }}
                    className="h-8 px-2.5 bg-white border border-[#CBD5E1] rounded-md text-[14px] text-[#0F172A]"
                  >
                    <option value="All">All Priorities</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#475569]">Record Owner:</span>
                <select
                  value={ownerFilter}
                  onChange={(e) => {
                    setOwnerFilter(e.target.value);
                    setPage(1);
                  }}
                  className="h-8 px-2.5 bg-white border border-[#CBD5E1] rounded-md text-[14px] text-[#0F172A]"
                >
                  <option value="All">All Owners</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              {(statusFilter !== 'All' || priorityFilter !== 'All' || ownerFilter !== 'All') && (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('All');
                    setPriorityFilter('All');
                    setOwnerFilter('All');
                  }}
                  className="text-[14px] text-[#2F55D4] hover:underline font-semibold"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* ---- Dynamic Category Data Table ---- */}
          <div className="flex-1 overflow-x-auto">
            {/* 1. CALLS TABLE */}
            {effectiveKind === 'Calls' && (
              <table className="w-full text-left text-[14px]">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.size > 0 && selectedIds.size === paginatedRows.length}
                        onChange={toggleSelectAll}
                        className="rounded accent-[#2F55D4]"
                      />
                    </th>
                    <SortHeader label="Subject" field="subject" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Call Type" field="type" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Call Start Time" field="dateTime" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Duration" field="duration" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Status" field="status" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <th className="py-3 px-3.5 text-[13.5px] font-semibold uppercase tracking-wider text-slate-600">
                      Related To
                    </th>
                    <th className="py-3 px-3.5 text-[13.5px] font-semibold uppercase tracking-wider text-slate-600">
                      Contact Name
                    </th>
                    <th className="py-3 px-3.5 text-[13.5px] font-semibold uppercase tracking-wider text-slate-600">
                      Call Owner
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF2F6]">
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-[#64748B]">
                        No calls found in Workqueue.
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((c) => {
                      const relatedDeal =
                        deals.find((d) => d.contactId === c.contactId) ||
                        deals.find((d) => d.accountId && d.accountId === c.accountId);
                      return (
                        <tr key={c.id} className="hover:bg-[#F8FAFC] transition">
                          <td className="py-3 px-4">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(c.id)}
                              onChange={() => toggleSelect(c.id)}
                              className="rounded accent-[#2F55D4]"
                            />
                          </td>
                          <td className="py-3 px-3.5 font-semibold">
                            <button
                              type="button"
                              onClick={() => navigateFromWorkqueue(`/calls/${c.id}`)}
                              className="text-[#2F55D4] hover:underline text-left"
                            >
                              {c.subject}
                            </button>
                          </td>
                          <td className="py-3 px-3.5 text-[#475569]">{c.type}</td>
                          <td className="py-3 px-3.5 text-[#475569] whitespace-nowrap">
                            {fmtDate(c.dateTime)} {fmtTime(c.dateTime)}
                          </td>
                          <td className="py-3 px-3.5 text-[#475569] whitespace-nowrap">
                            {c.status === 'Scheduled' ? '—' : fmtDuration(c.duration)}
                          </td>
                          <td className="py-3 px-3.5">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[12px] font-semibold border ${
                                STATUS_BADGE[c.status] || 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {c.status}
                            </span>
                          </td>
                          <td className="py-3 px-3.5">
                            {relatedDeal ? (
                              <button
                                type="button"
                                onClick={() => navigateFromWorkqueue(`/deals/${relatedDeal.id}`)}
                                className="text-[#2F55D4] hover:underline font-medium text-left"
                              >
                                {relatedDeal.name}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => navigateFromWorkqueue(`/accounts?open=${c.accountId}`)}
                                className="text-[#334155] hover:text-[#2F55D4] hover:underline text-left"
                              >
                                {accountName(c.accountId)}
                              </button>
                            )}
                          </td>
                          <td className="py-3 px-3.5">
                            <button
                              type="button"
                              onClick={() => navigateFromWorkqueue(`/contacts/${c.contactId}`)}
                              className="text-[#334155] hover:text-[#2F55D4] hover:underline font-medium text-left"
                            >
                              {contactName(c.contactId)}
                            </button>
                          </td>
                          <td className="py-3 px-3.5 text-[#475569] whitespace-nowrap">
                            {userName(c.ownerId)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}

            {/* 2. APPROVALS TABLE — Read-Only Summary Table (No inline Approve/Reject/Delegate buttons) */}
            {effectiveKind === 'Approvals' && (
              <table className="w-full text-left text-[14px]">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    <SortHeader label="Record Name (Deal)" field="dealName" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Account / Company" field="account" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <th className="py-3 px-3.5 text-[13.5px] font-semibold uppercase tracking-wider text-slate-600">
                      Module
                    </th>
                    <SortHeader label="Rule Name" field="ruleName" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Discount" field="discount" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Amount" field="amount" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Submitted By" field="requestedBy" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Approver" field="approver" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Submitted Date" field="submittedOn" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Approval Status" field="status" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF2F6]">
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-[#64748B]">
                        No approval records found in Workqueue.
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => navigateFromWorkqueue(`/deals/${item.dealId}`)}
                        className="hover:bg-[#F8FAFC] transition cursor-pointer"
                      >
                        <td className="py-3.5 px-3.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigateFromWorkqueue(`/deals/${item.dealId}`);
                            }}
                            className="text-[#2F55D4] hover:underline font-semibold text-left block"
                          >
                            {item.dealName}
                          </button>
                          <span className="text-[12.5px] text-[#64748B]">{item.dealCode}</span>
                        </td>
                        <td className="py-3.5 px-3.5 text-[#334155] font-medium">{item.account}</td>
                        <td className="py-3.5 px-3.5 text-[#475569]">Deals</td>
                        <td className="py-3.5 px-3.5 text-[#475569]">{item.ruleName}</td>
                        <td className="py-3.5 px-3.5">
                          <span className="px-2 py-0.5 rounded text-[12px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            {item.discount}
                          </span>
                        </td>
                        <td className="py-3.5 px-3.5 font-semibold text-[#0F172A] whitespace-nowrap">
                          {fmtINR(item.amount)}
                        </td>
                        <td className="py-3.5 px-3.5 text-[#475569] whitespace-nowrap">
                          {item.requestedBy}
                        </td>
                        <td className="py-3.5 px-3.5 text-[#475569] whitespace-nowrap">
                          {item.approver}
                        </td>
                        <td className="py-3.5 px-3.5 text-[#64748B] whitespace-nowrap">
                          {item.submittedOn}
                        </td>
                        <td className="py-3.5 px-3.5 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[12px] font-semibold border ${
                              STATUS_BADGE[item.status] ||
                              'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* 3. CAMPAIGNS TABLE */}
            {effectiveKind === 'Campaigns' && (
              <table className="w-full text-left text-[14px]">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.size > 0 && selectedIds.size === paginatedRows.length}
                        onChange={toggleSelectAll}
                        className="rounded accent-[#2F55D4]"
                      />
                    </th>
                    <SortHeader label="Campaign Name" field="name" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Type" field="type" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Status" field="status" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Start Date" field="startDate" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="End Date" field="endDate" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Expected Revenue" field="expectedRevenue" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <th className="py-3 px-3.5 text-[13.5px] font-semibold uppercase tracking-wider text-slate-600">
                      Campaign Owner
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF2F6]">
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-[#64748B]">
                        No campaigns found in Workqueue.
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((camp) => (
                      <tr key={camp.id} className="hover:bg-[#F8FAFC] transition">
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(camp.id)}
                            onChange={() => toggleSelect(camp.id)}
                            className="rounded accent-[#2F55D4]"
                          />
                        </td>
                        <td className="py-3 px-3.5">
                          <button
                            type="button"
                            onClick={() => navigateFromWorkqueue(`/campaigns/${camp.id}`)}
                            className="text-[#2F55D4] hover:underline font-semibold text-left"
                          >
                            {camp.name}
                          </button>
                        </td>
                        <td className="py-3 px-3.5 text-[#475569]">{camp.type}</td>
                        <td className="py-3 px-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[12px] font-semibold border ${
                              STATUS_BADGE[camp.status] ||
                              'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {camp.status}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-[#64748B] whitespace-nowrap">
                          {fmtDate(camp.startDate)}
                        </td>
                        <td className="py-3 px-3.5 text-[#64748B] whitespace-nowrap">
                          {fmtDate(camp.endDate)}
                        </td>
                        <td className="py-3 px-3.5 font-semibold text-[#0F172A] whitespace-nowrap">
                          {fmtINR(camp.expectedRevenue)}
                        </td>
                        <td className="py-3 px-3.5 text-[#475569] whitespace-nowrap">
                          {userName(camp.ownerId)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* 4. CONTACTS TABLE */}
            {effectiveKind === 'Contacts' && (
              <table className="w-full text-left text-[14px]">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.size > 0 && selectedIds.size === paginatedRows.length}
                        onChange={toggleSelectAll}
                        className="rounded accent-[#2F55D4]"
                      />
                    </th>
                    <SortHeader label="Contact Name" field="name" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <th className="py-3 px-3.5 text-[13.5px] font-semibold uppercase tracking-wider text-slate-600">
                      Account Name
                    </th>
                    <SortHeader label="Email" field="email" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Phone" field="phone" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Title" field="designation" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Lifecycle Stage" field="lifecycle" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <th className="py-3 px-3.5 text-[13.5px] font-semibold uppercase tracking-wider text-slate-600">
                      Contact Owner
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF2F6]">
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-[#64748B]">
                        No contacts found in Workqueue.
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((c) => (
                      <tr key={c.id} className="hover:bg-[#F8FAFC] transition">
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(c.id)}
                            onChange={() => toggleSelect(c.id)}
                            className="rounded accent-[#2F55D4]"
                          />
                        </td>
                        <td className="py-3 px-3.5">
                          <button
                            type="button"
                            onClick={() => navigateFromWorkqueue(`/contacts/${c.id}`)}
                            className="text-[#2F55D4] hover:underline font-semibold text-left"
                          >
                            {c.name}
                          </button>
                        </td>
                        <td className="py-3 px-3.5">
                          <button
                            type="button"
                            onClick={() => navigateFromWorkqueue(`/accounts?open=${c.accountId}`)}
                            className="text-[#334155] hover:text-[#2F55D4] hover:underline text-left font-medium"
                          >
                            {accountName(c.accountId)}
                          </button>
                        </td>
                        <td className="py-3 px-3.5 text-[#475569]">{c.email}</td>
                        <td className="py-3 px-3.5 text-[#475569] whitespace-nowrap">{c.phone}</td>
                        <td className="py-3 px-3.5 text-[#64748B]">{c.designation}</td>
                        <td className="py-3 px-3.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-[#EEF2FF] text-[#2F55D4] border border-[#C7D2FE]">
                            {c.lifecycle}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-[#475569] whitespace-nowrap">
                          {userName(c.ownerId)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* 5. LEADS TABLE (Matches Screenshot 1 columns: Lead Name, Company, Email, Phone, Lead Source, Lead Owner, Lead Status) */}
            {effectiveKind === 'Leads' && (
              <table className="w-full text-left text-[14px]">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.size > 0 && selectedIds.size === paginatedRows.length}
                        onChange={toggleSelectAll}
                        className="rounded accent-[#2F55D4]"
                      />
                    </th>
                    <SortHeader label="Lead Name" field="name" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Company" field="company" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Email" field="email" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Phone" field="mobile" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Lead Source" field="leadSource" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Lead Status" field="status" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="City" field="city" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <th className="py-3 px-3.5 text-[13.5px] font-semibold uppercase tracking-wider text-slate-600">
                      Lead Owner
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF2F6]">
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-[#64748B]">
                        No leads found matching this Workqueue view.
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((l) => (
                      <tr key={l.id} className="hover:bg-[#F8FAFC] transition">
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(l.id)}
                            onChange={() => toggleSelect(l.id)}
                            className="rounded accent-[#2F55D4]"
                          />
                        </td>
                        <td className="py-3 px-3.5">
                          <button
                            type="button"
                            onClick={() => navigateFromWorkqueue(`/leads/${l.id}`)}
                            className="text-[#2F55D4] hover:underline font-semibold text-left"
                          >
                            {l.name}
                          </button>
                        </td>
                        <td className="py-3 px-3.5 text-[#334155] font-medium">
                          {l.company || l.clientName || '—'}
                        </td>
                        <td className="py-3 px-3.5 text-[#475569]">{l.email || '—'}</td>
                        <td className="py-3 px-3.5 text-[#475569] whitespace-nowrap">
                          {l.mobile || l.phone || '—'}
                        </td>
                        <td className="py-3 px-3.5 text-[#475569]">
                          {l.leadSource || l.source || 'Website'}
                        </td>
                        <td className="py-3 px-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[12px] font-semibold border ${
                              STATUS_BADGE[l.status] ||
                              'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {l.status || 'Assigned'}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-[#64748B]">{l.city || '—'}</td>
                        <td className="py-3 px-3.5 text-[#475569] whitespace-nowrap">
                          {userName(l.ownerId)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* 6. DEALS TABLE */}
            {effectiveKind === 'Deals' && (
              <table className="w-full text-left text-[14px]">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.size > 0 && selectedIds.size === paginatedRows.length}
                        onChange={toggleSelectAll}
                        className="rounded accent-[#2F55D4]"
                      />
                    </th>
                    <SortHeader label="Deal Name" field="name" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <th className="py-3 px-3.5 text-[13.5px] font-semibold uppercase tracking-wider text-slate-600">
                      Account Name
                    </th>
                    <th className="py-3 px-3.5 text-[13.5px] font-semibold uppercase tracking-wider text-slate-600">
                      Contact Name
                    </th>
                    <SortHeader label="Stage" field="stage" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Amount (₹)" field="amount" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Closing Date" field="closingDate" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <th className="py-3 px-3.5 text-[13.5px] font-semibold uppercase tracking-wider text-slate-600">
                      Deal Owner
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF2F6]">
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-[#64748B]">
                        No deals found matching this Workqueue view.
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((d) => (
                      <tr key={d.id} className="hover:bg-[#F8FAFC] transition">
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(d.id)}
                            onChange={() => toggleSelect(d.id)}
                            className="rounded accent-[#2F55D4]"
                          />
                        </td>
                        <td className="py-3 px-3.5">
                          <button
                            type="button"
                            onClick={() => navigateFromWorkqueue(`/deals/${d.id}`)}
                            className="text-[#2F55D4] hover:underline font-semibold text-left"
                          >
                            {d.name}
                          </button>
                        </td>
                        <td className="py-3 px-3.5">
                          <button
                            type="button"
                            onClick={() => navigateFromWorkqueue(`/accounts?open=${d.accountId}`)}
                            className="text-[#334155] hover:text-[#2F55D4] hover:underline text-left font-medium"
                          >
                            {accountName(d.accountId)}
                          </button>
                        </td>
                        <td className="py-3 px-3.5">
                          {d.contactId ? (
                            <button
                              type="button"
                              onClick={() => navigateFromWorkqueue(`/contacts/${d.contactId}`)}
                              className="text-[#475569] hover:text-[#2F55D4] hover:underline text-left"
                            >
                              {contactName(d.contactId)}
                            </button>
                          ) : (
                            <span className="text-[#94A3B8]">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-[#EEF2FF] text-[#2F55D4] border border-[#C7D2FE]">
                            {d.stage}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 font-semibold text-[#0F172A] whitespace-nowrap">
                          {fmtINR(d.amount)}
                        </td>
                        <td className="py-3 px-3.5 text-[#64748B] whitespace-nowrap">
                          {fmtDate(d.closingDate)}
                        </td>
                        <td className="py-3 px-3.5 text-[#475569] whitespace-nowrap">
                          {userName(d.ownerId)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* 7. ACCOUNTS TABLE */}
            {effectiveKind === 'Accounts' && (
              <table className="w-full text-left text-[14px]">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.size > 0 && selectedIds.size === paginatedRows.length}
                        onChange={toggleSelectAll}
                        className="rounded accent-[#2F55D4]"
                      />
                    </th>
                    <SortHeader label="Account Name" field="name" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Industry" field="industry" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Phone" field="phone" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="City" field="city" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <th className="py-3 px-3.5 text-[13.5px] font-semibold uppercase tracking-wider text-slate-600">
                      Account Owner
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF2F6]">
                  {paginatedRows.map((a) => (
                    <tr key={a.id} className="hover:bg-[#F8FAFC] transition">
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(a.id)}
                          onChange={() => toggleSelect(a.id)}
                          className="rounded accent-[#2F55D4]"
                        />
                      </td>
                      <td className="py-3 px-3.5">
                        <button
                          type="button"
                          onClick={() => navigateFromWorkqueue(`/accounts?open=${a.id}`)}
                          className="text-[#2F55D4] hover:underline font-semibold text-left"
                        >
                          {a.name}
                        </button>
                      </td>
                      <td className="py-3 px-3.5 text-[#475569]">{a.industry}</td>
                      <td className="py-3 px-3.5 text-[#475569]">{a.phone}</td>
                      <td className="py-3 px-3.5 text-[#64748B]">{a.city}</td>
                      <td className="py-3 px-3.5 text-[#475569]">{userName(a.ownerId)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 8. EMAILS TABLE */}
            {effectiveKind === 'Emails' && (
              <table className="w-full text-left text-[14px]">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    <SortHeader label="Subject" field="subject" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Sender" field="sender" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Channel" field="channel" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Time" field="time" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF2F6]">
                  {paginatedRows.map((m) => (
                    <tr key={m.id} className="hover:bg-[#F8FAFC] transition">
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() =>
                            m.leadId
                              ? navigateFromWorkqueue(`/leads/${m.leadId}`)
                              : navigateFromWorkqueue('/messages')
                          }
                          className="text-[#2F55D4] hover:underline font-semibold text-left"
                        >
                          {m.subject || m.preview}
                        </button>
                      </td>
                      <td className="py-3 px-3.5 text-[#334155] font-medium">{m.sender}</td>
                      <td className="py-3 px-3.5 text-[#475569]">{m.channel || 'Email'}</td>
                      <td className="py-3 px-3.5 text-[#64748B]">{m.time || 'Today'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 9. TASKS / MEETINGS TABLE */}
            {effectiveKind === 'Tasks' && (
              <table className="w-full text-left text-[14px]">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.size > 0 && selectedIds.size === paginatedRows.length}
                        onChange={toggleSelectAll}
                        className="rounded accent-[#2F55D4]"
                      />
                    </th>
                    <SortHeader label="Subject" field="subject" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Due Date" field="dueDate" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Status" field="status" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Priority" field="priority" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <th className="py-3 px-3.5 text-[13.5px] font-semibold uppercase tracking-wider text-slate-600">
                      Related To
                    </th>
                    <th className="py-3 px-3.5 text-[13.5px] font-semibold uppercase tracking-wider text-slate-600">
                      Contact Name
                    </th>
                    <th className="py-3 px-3.5 text-[13.5px] font-semibold uppercase tracking-wider text-slate-600 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF2F6]">
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-[#64748B]">
                        No activities found in Workqueue matching criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((t) => {
                      const isSelected = selectedIds.has(t.id);
                      return (
                        <tr
                          key={t.id}
                          className={`hover:bg-[#F8FAFC] transition group ${
                            isSelected ? 'bg-[#EEF2FF]/40' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(t.id)}
                              className="rounded accent-[#2F55D4]"
                            />
                          </td>
                          <td className="py-3 px-3.5 font-semibold text-[#0F172A]">
                            <button
                              type="button"
                              onClick={() => setViewingTask(t)}
                              className="text-[#2F55D4] hover:underline text-left"
                            >
                              {t.subject}
                            </button>
                          </td>
                          <td className="py-3 px-3.5 text-[#475569] whitespace-nowrap">
                            {t.dueDate ? fmtDate(t.dueDate) : '—'}
                          </td>
                          <td className="py-3 px-3.5">
                            <select
                              value={t.status || 'In Progress'}
                              onChange={(e) => handleStatusChange(t.id, e.target.value)}
                              className={`px-2.5 py-0.5 rounded-full text-[12px] font-semibold border cursor-pointer ${
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
                          <td className="py-3 px-3.5">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[12px] font-semibold border ${
                                PRIORITY_BADGE[t.priority] ||
                                'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {t.priority || 'Medium'}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-[#475569] max-w-[200px] truncate">
                            <button
                              type="button"
                              onClick={() => resolveAndNavigateRelated(t)}
                              className="text-[#2F55D4] hover:underline font-medium text-left truncate max-w-full"
                              title={`Open ${t.relatedTo || 'Related Record'}`}
                            >
                              {t.relatedTo || 'Deal - ABC Technologies'}
                            </button>
                          </td>
                          <td className="py-3 px-3.5 text-[#334155] font-medium whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => resolveAndNavigateContact(t)}
                              className="hover:text-[#2F55D4] hover:underline text-left"
                            >
                              {t.contactName || 'Ramesh Kumar'}
                            </button>
                          </td>
                          <td className="py-3 px-3.5 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setViewingTask(t)}
                                className="p-1.5 text-[#64748B] hover:text-[#2F55D4] hover:bg-[#EEF2FF] rounded transition"
                                title="View Details"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingTask({ ...t })}
                                className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded transition"
                                title="Edit Task"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTask(t.id)}
                                className="p-1.5 text-[#64748B] hover:text-rose-600 hover:bg-rose-50 rounded transition"
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
            )}
          </div>

          {/* ---- Zoho CRM Style Pagination & Total Records Footer (Screenshot 1) ---- */}
          <div className="px-5 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[14px] text-[#475569]">
            <div className="font-medium">
              Total Records <span className="font-bold text-[#0F172A]">{activeRows.length}</span>
            </div>

            <div className="flex items-center gap-4">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="h-8 px-2.5 bg-white border border-[#CBD5E1] rounded-md text-[14px] text-[#0F172A]"
              >
                <option value={10}>10 Records Per Page</option>
                <option value={20}>20 Records Per Page</option>
                <option value={50}>50 Records Per Page</option>
              </select>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="p-1.5 bg-white text-[#475569] hover:text-[#0F172A] disabled:opacity-40 rounded border border-[#CBD5E1]"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="px-2 font-semibold text-[#0F172A]">
                  {startIdx} to {endIdx}
                </span>
                <button
                  type="button"
                  disabled={page * pageSize >= activeRows.length}
                  onClick={() => setPage(page + 1)}
                  className="p-1.5 bg-white text-[#475569] hover:text-[#0F172A] disabled:opacity-40 rounded border border-[#CBD5E1]"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ---- Add / Configure Workqueue Modal ---- */}
      <Modal
        open={addWqModalOpen}
        onClose={() => setAddWqModalOpen(false)}
        title="Add / Configure Workqueue"
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setAddWqModalOpen(false)}
              className="btn-secondary text-[14px]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddCustomWorkqueue}
              className="btn-primary text-[14px]"
            >
              Add to Workqueue
            </button>
          </>
        }
      >
        <form onSubmit={handleAddCustomWorkqueue} className="space-y-4 text-[14px]">
          <div>
            <label className="block font-semibold text-[#1E293B] mb-1">
              Workqueue Section Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Chennai Website Leads or High Priority Deals"
              value={newWqForm.name}
              onChange={(e) => setNewWqForm({ ...newWqForm, name: e.target.value })}
              className="input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#1E293B] mb-1">Module</label>
              <select
                value={newWqForm.module}
                onChange={(e) => setNewWqForm({ ...newWqForm, module: e.target.value })}
                className="input"
              >
                <option value="Leads">Leads</option>
                <option value="Contacts">Contacts</option>
                <option value="Deals">Deals</option>
                <option value="Campaigns">Campaigns</option>
                <option value="Accounts">Accounts</option>
                <option value="Calls">Calls</option>
                <option value="Tasks">Tasks</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#1E293B] mb-1">Filter Criteria</label>
              <select
                value={newWqForm.criteriaField}
                onChange={(e) => setNewWqForm({ ...newWqForm, criteriaField: e.target.value })}
                className="input"
              >
                <option value="status">Status / Stage</option>
                <option value="city">City / Region</option>
                <option value="source">Lead Source</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#1E293B] mb-1">
              Criteria Value (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Assigned, Chennai, Website, Qualification"
              value={newWqForm.criteriaValue}
              onChange={(e) => setNewWqForm({ ...newWqForm, criteriaValue: e.target.value })}
              className="input"
            />
          </div>

          {customWorkqueues.length > 0 && (
            <div className="pt-2 border-t border-[#E2E8F0]">
              <div className="text-[13px] font-semibold text-[#64748B] mb-2">
                Configured Custom Workqueues ({customWorkqueues.length})
              </div>
              <div className="space-y-1.5">
                {customWorkqueues.map((cw) => (
                  <div
                    key={cw.id}
                    className="flex items-center justify-between px-3 py-1.5 rounded bg-[#F8FAFC] border border-[#E2E8F0]"
                  >
                    <div>
                      <span className="font-semibold text-[#0F172A]">{cw.name}</span>
                      <span className="ml-2 text-[12.5px] text-[#64748B]">({cw.module})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomWorkqueue(cw.id, cw.name)}
                      className="text-rose-600 hover:underline text-[13px]"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* New Task Modal */}
      {isNewTaskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-[18px] font-bold text-slate-900 mb-2">Create Workqueue Task</h3>
            <p className="text-[13.5px] text-slate-500 mb-4">
              Add a new actionable follow-up task or workflow job.
            </p>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="text-[14px] font-semibold text-slate-700 block mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Follow up on product demo quotation"
                  value={newTaskForm.subject}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, subject: e.target.value })}
                  className="w-full px-3 py-2 text-[14px] border border-slate-200 rounded-xl focus:outline-none focus:border-[#2F55D4]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[14px] font-semibold text-slate-700 block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newTaskForm.dueDate}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 text-[14px] border border-slate-200 rounded-xl focus:outline-none focus:border-[#2F55D4]"
                  />
                </div>
                <div>
                  <label className="text-[14px] font-semibold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={newTaskForm.priority}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, priority: e.target.value })}
                    className="w-full px-3 py-2 text-[14px] border border-slate-200 rounded-xl focus:outline-none focus:border-[#2F55D4]"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[14px] font-semibold text-slate-700 block mb-1">
                    Related Lead / Record
                  </label>
                  <select
                    value={newTaskForm.relatedRecordId || ''}
                    onChange={(e) => {
                      const l = leads.find((x) => x.id === e.target.value);
                      if (l) {
                        setNewTaskForm({
                          ...newTaskForm,
                          relatedModule: 'leads',
                          relatedRecordId: l.id,
                          relatedTo: `Lead - ${l.name}`,
                          contactName: l.name,
                        });
                      }
                    }}
                    className="w-full px-3 py-2 text-[14px] border border-slate-200 rounded-xl focus:outline-none focus:border-[#2F55D4]"
                  >
                    {leads.slice(0, 20).map((l) => (
                      <option key={l.id} value={l.id}>
                        Lead - {l.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[14px] font-semibold text-slate-700 block mb-1">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    placeholder="Contact person"
                    value={newTaskForm.contactName}
                    onChange={(e) =>
                      setNewTaskForm({ ...newTaskForm, contactName: e.target.value })
                    }
                    className="w-full px-3 py-2 text-[14px] border border-slate-200 rounded-xl focus:outline-none focus:border-[#2F55D4]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[14px] font-semibold text-slate-700 block mb-1">
                  Description / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Task instructions..."
                  value={newTaskForm.description}
                  onChange={(e) =>
                    setNewTaskForm({ ...newTaskForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 text-[14px] border border-slate-200 rounded-xl focus:outline-none focus:border-[#2F55D4]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewTaskOpen(false)}
                  className="px-4 py-2 text-[14px] font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-[14px] font-semibold bg-[#2F55D4] text-white hover:bg-[#2444B5] rounded-xl shadow-sm"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-[18px] font-bold text-slate-900 mb-2">Edit Workqueue Task</h3>
            <form onSubmit={handleSaveEditTask} className="space-y-4">
              <div>
                <label className="text-[14px] font-semibold text-slate-700 block mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  value={editingTask.subject || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, subject: e.target.value })}
                  className="w-full px-3 py-2 text-[14px] border border-slate-200 rounded-xl focus:outline-none focus:border-[#2F55D4]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[14px] font-semibold text-slate-700 block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={editingTask.dueDate || ''}
                    onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                    className="w-full px-3 py-2 text-[14px] border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[14px] font-semibold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={editingTask.priority || 'Medium'}
                    onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}
                    className="w-full px-3 py-2 text-[14px] border border-slate-200 rounded-xl"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[14px] font-semibold text-slate-700 block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editingTask.description || ''}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, description: e.target.value })
                  }
                  className="w-full px-3 py-2 text-[14px] border border-slate-200 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 text-[14px] font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-[14px] font-semibold bg-[#2F55D4] text-white hover:bg-[#2444B5] rounded-xl shadow-sm"
                >
                  Save Changes
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
          subtitle={`Workqueue ID: ${viewingTask.id}`}
        >
          <div className="space-y-6">
            <SectionTitle>Task Details</SectionTitle>
            <DetailGrid
              items={[
                { label: 'Subject', value: viewingTask.subject },
                { label: 'Due Date', value: viewingTask.dueDate ? fmtDate(viewingTask.dueDate) : '—' },
                { label: 'Status', value: viewingTask.status },
                { label: 'Priority', value: viewingTask.priority },
                {
                  label: 'Related Entity',
                  value: (
                    <button
                      type="button"
                      onClick={() => {
                        const t = viewingTask;
                        setViewingTask(null);
                        resolveAndNavigateRelated(t);
                      }}
                      className="text-[#2F55D4] hover:underline font-medium inline-flex items-center gap-1"
                    >
                      {viewingTask.relatedTo || '—'} <ExternalLink size={12} />
                    </button>
                  ),
                },
                {
                  label: 'Contact',
                  value: (
                    <button
                      type="button"
                      onClick={() => {
                        const t = viewingTask;
                        setViewingTask(null);
                        resolveAndNavigateContact(t);
                      }}
                      className="text-[#2F55D4] hover:underline font-medium"
                    >
                      {viewingTask.contactName || '—'}
                    </button>
                  ),
                },
              ].map(({ label, value }) => [label, value])}
            />

            {viewingTask.description && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[14px] text-slate-700">
                <span className="font-semibold block mb-1">Notes:</span>
                {viewingTask.description}
              </div>
            )}

            <div className="pt-4 flex justify-between items-center border-t border-slate-200">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const t = viewingTask;
                    setViewingTask(null);
                    resolveAndNavigateRelated(t);
                  }}
                  className="px-3.5 py-2 text-[14px] font-semibold bg-[#EEF2FF] text-[#2F55D4] border border-[#C7D2FE] rounded-xl hover:bg-blue-100 transition"
                >
                  Open Related Record
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleStatusChange(
                      viewingTask.id,
                      viewingTask.status === 'Completed' ? 'In Progress' : 'Completed'
                    );
                    setViewingTask(null);
                  }}
                  className="px-3.5 py-2 text-[14px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition"
                >
                  {viewingTask.status === 'Completed' ? 'Reopen Task' : 'Mark as Completed'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleDeleteTask(viewingTask.id)}
                className="px-3.5 py-2 text-[14px] font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition"
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
