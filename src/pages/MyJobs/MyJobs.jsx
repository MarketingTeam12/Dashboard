import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle, ArrowDown, ArrowUp, ArrowUpDown, Check, CheckCircle2, ChevronDown,
  ChevronLeft, ChevronRight, Clock, ExternalLink, Eye, FileCheck2, Filter,
  GitBranch, HelpCircle, History, Image as ImageIcon, Info, Loader2, Lock, RotateCcw,
  Search, ShieldCheck, SlidersHorizontal, UserCheck, X, XCircle, ZoomIn, ZoomOut,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useToast } from '../../components/common/Toast';
import { exportCSV } from '../../utils/exportCSV';

export const MY_JOBS_TABS = [
  { id: 'Blueprint Transitions', label: 'Blueprint Transitions' },
  { id: 'Approvals', label: 'Approvals' },
  { id: 'Reviews', label: 'Reviews' },
  { id: 'Image Validations', label: 'Image Validations' },
];

export const APPROVAL_FILTER_FIELDS = [
  { id: 'processName', label: 'Approval Process Name' },
  { id: 'module', label: 'Module' },
  { id: 'recordName', label: 'Record Name' },
  { id: 'recordOwner', label: 'Record Owner' },
  { id: 'requesterName', label: 'Requester Name' },
  { id: 'submittedAt', label: 'Submitted On' },
];

const ALL_MODULES_OPTIONS = ['All Modules', 'Deals', 'Contacts', 'Accounts', 'Leads', 'Invoices'];

const STATUS_OPTIONS_BY_TAB = {
  Reviews: ['All Status', 'Waiting for Review', 'Accepted', 'Rejected'],
  Approvals: ['All Status', 'Waiting for Approval', 'Approved', 'Rejected'],
  'Blueprint Transitions': ['All Status', 'Waiting for Transition', 'Transitioned', 'Rejected'],
  'Image Validations': ['All Status', 'Waiting for Validation', 'Accepted', 'Rejected'],
};

const EMPTY_MESSAGE_BY_TAB = {
  Reviews: 'No Records Waiting For Review',
  Approvals: 'No Records Waiting For Approval',
  'Blueprint Transitions': 'No Records Waiting For Blueprint Transition',
  'Image Validations': 'No Records Waiting For Image Validation',
};

/**
 * Formats ISO timestamps into exact Zoho CRM screenshot format: DD/MM/YYYY hh:mm A
 * Example: "10/10/2026 11:15 AM", "09/10/2026 05:40 PM"
 */
export function formatSubmittedOn(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = String(hours).padStart(2, '0');
  return `${day}/${month}/${year} ${formattedHours}:${minutes} ${ampm}`;
}

export function formatDateTime(iso) {
  return formatSubmittedOn(iso);
}

function StatusBadge({ status, decision }) {
  if (decision === 'Accepted' || decision === 'Approved' || decision === 'Completed') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11.5px] font-medium bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
        <CheckCircle2 size={12} className="shrink-0" />
        {status}
      </span>
    );
  }
  if (decision === 'Rejected') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11.5px] font-medium bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA]">
        <XCircle size={12} className="shrink-0" />
        {status}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11.5px] font-medium bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
      <Clock size={12} className="shrink-0" />
      {status}
    </span>
  );
}

/**
 * Crisp inline SVG document/certificate preview for Image Validations
 */
function SubmittedImagePreview({ meta, large = false, zoomed = false }) {
  const m = meta || {
    fileName: 'Document_Verification.svg',
    docType: 'Verification Image',
    badgeText: 'VERIFICATION SCAN',
    issuer: 'Enterprise CRM Compliance',
    entityName: 'Submitted Record',
    stampColor: '#1262E0',
  };
  const accent = m.stampColor || '#1262E0';

  return (
    <div
      className={`relative overflow-hidden rounded-md border border-[#DCE3EE] bg-[#F8FAFC] select-none ${
        large ? 'w-full' : 'w-[96px] h-[54px]'
      }`}
    >
      <svg
        viewBox="0 0 600 360"
        className={`w-full h-full block transition-transform duration-200 ${
          zoomed ? 'scale-125 origin-top-left' : ''
        }`}
        role="img"
        aria-label={m.fileName}
      >
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F1F5F9" />
          </linearGradient>
          <pattern id="gridPat" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#E2E8F0" strokeWidth="0.8" />
          </pattern>
        </defs>

        <rect width="600" height="360" fill="url(#bgGrad)" />
        <rect width="600" height="360" fill="url(#gridPat)" />
        <rect x="18" y="18" width="564" height="324" fill="none" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="6 4" rx="8" />

        <rect x="40" y="38" width="130" height="26" rx="4" fill={accent} opacity="0.12" />
        <text x="50" y="55" fill={accent} fontSize="11" fontWeight="700" letterSpacing="1">
          {m.badgeText || 'VERIFIED DOC'}
        </text>

        <text x="40" y="105" fill="#0F172A" fontSize="22" fontWeight="800" fontFamily="sans-serif">
          {m.docType || 'Compliance Record'}
        </text>

        <text x="40" y="130" fill="#64748B" fontSize="13" fontWeight="500">
          Entity:{' '}
          <tspan fill="#1E293B" fontWeight="700">
            {m.entityName}
          </tspan>{' '}
          • Issuer: {m.issuer}
        </text>

        <g transform="translate(40, 160)">
          <rect width="520" height="1" fill="#E2E8F0" />
          <rect y="16" width="380" height="8" rx="4" fill="#E2E8F0" />
          <rect y="34" width="460" height="8" rx="4" fill="#E2E8F0" />
          <rect y="52" width="290" height="8" rx="4" fill="#E2E8F0" />
          <rect y="70" width="340" height="8" rx="4" fill="#E2E8F0" />
        </g>

        <g transform="translate(430, 235)">
          <circle cx="50" cy="50" r="44" fill="none" stroke={accent} strokeWidth="3" opacity="0.85" />
          <circle cx="50" cy="50" r="38" fill="none" stroke={accent} strokeWidth="1" strokeDasharray="4 2" opacity="0.6" />
          <path d="M 32 50 L 44 62 L 68 38" fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <text x="50" y="82" fill={accent} fontSize="8.5" fontWeight="700" textAnchor="middle" letterSpacing="0.5">
            HONEY ONE CRM
          </text>
        </g>

        <text x="40" y="318" fill="#94A3B8" fontSize="10.5">
          Scan ID: {m.fileName} • 2400x1600 px • 300 DPI Cryptographic Hash Verification
        </text>
      </svg>
    </div>
  );
}

function SortableHeader({ label, sortKey, sortConfig, onSort, className = '' }) {
  const isSorted = sortConfig.key === sortKey;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={`group inline-flex items-center gap-1.5 text-left font-semibold text-[#334155] hover:text-[#0F172A] focus:outline-none ${className}`}
    >
      <span>{label}</span>
      <span className="text-[#94A3B8] group-hover:text-[#475569]">
        {isSorted ? (
          sortConfig.dir === 'asc' ? (
            <ArrowUp size={13} className="text-[#1262E0]" />
          ) : (
            <ArrowDown size={13} className="text-[#1262E0]" />
          )
        ) : (
          <ArrowUpDown size={12} className="opacity-40 group-hover:opacity-100" />
        )}
      </span>
    </button>
  );
}

function HeaderDropdownFilter({ label, value, options, onChange, ariaLabel }) {
  return (
    <div className="inline-flex items-center gap-1">
      <span className="text-[#334155] font-semibold">{label}</span>
      <select
        aria-label={ariaLabel || `Filter by ${label}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-6 text-[12px] bg-transparent border-0 text-[#1262E0] font-medium pr-4 focus:ring-0 focus:outline-none cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt} value={opt} className="text-[#1E293B] bg-white">
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function getRecordDeepLink(job) {
  if (!job) return null;
  if (job.module === 'Deals' && job.recordId) return `/deals?open=${job.recordId}`;
  if (job.module === 'Accounts' && job.recordId) return `/accounts?open=${job.recordId}`;
  if (job.module === 'Contacts' && job.recordId) return `/contacts?open=${job.recordId}`;
  if (job.module === 'Deals') return '/deals';
  if (job.module === 'Contacts') return '/contacts';
  if (job.module === 'Accounts') return '/accounts';
  return null;
}

export default function MyJobs() {
  const { myJobs = [], myJobsLogs = [], users = [], userName, processMyJobAction, resetDemo } = useCRM();
  const toast = useToast();

  // Active Tab defaults to "Approvals" per Zoho CRM screenshot and user prompt
  const [activeTab, setActiveTab] = useState('Approvals');

  // Active user context (u1 = Arun Kumar, Sales Manager by default)
  const [activeUserId, setActiveUserId] = useState('u1');

  // Left Filter Panel visibility & search
  const [showFilterPanel, setShowFilterPanel] = useState(true);
  const [filterPanelSearch, setFilterPanelSearch] = useState('');
  const [activeFieldFilters, setActiveFieldFilters] = useState({
    processName: [],
    module: [],
    recordName: '',
    recordOwner: [],
    requesterName: [],
    submittedAt: 'All',
  });
  const [expandedFields, setExpandedFields] = useState({
    processName: true,
    module: true,
    recordName: false,
    recordOwner: false,
    requesterName: false,
    submittedAt: false,
  });

  // Table filters & search
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [moduleFilter, setModuleFilter] = useState('All Modules');
  const [tableSearchQuery, setTableSearchQuery] = useState('');
  const [showPendingOnly, setShowPendingOnly] = useState(false);

  // Sorting
  const [sortConfig, setSortConfig] = useState({ key: 'submittedAt', dir: 'desc' });
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Multi-row selection
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());

  // Dialogs & Drawers
  const [respondJobId, setRespondJobId] = useState(null); // Approvals Respond Modal
  const [inspectJobId, setInspectJobId] = useState(null); // General Details Drawer
  const [historyOpen, setHistoryOpen] = useState(false);   // Approval History Modal
  const [helpOpen, setHelpOpen] = useState(false);         // Help Modal
  const [historySearch, setHistorySearch] = useState('');
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState('Approvals');

  // Action form state
  const [comment, setComment] = useState('');
  const [actionError, setActionError] = useState('');
  const [savingJobId, setSavingJobId] = useState(null);
  const [batchActionType, setBatchActionType] = useState(null);

  // Blueprint state
  const [selectedTransitionId, setSelectedTransitionId] = useState('');
  const [transitionInputs, setTransitionInputs] = useState({});
  const [transitionErrors, setTransitionErrors] = useState({});
  const [imageZoomed, setImageZoomed] = useState(false);

  const sortMenuRef = useRef(null);

  const activeUser = useMemo(
    () => users.find((u) => u.id === activeUserId) || users[0] || { id: 'u1', name: 'Arun Kumar', role: 'Sales Manager' },
    [users, activeUserId]
  );

  const isJobAvailableToUser = (job, uid = activeUserId) => {
    const u = users.find((x) => x.id === uid);
    if (!u || u.role === 'Sales Manager') return true;
    return job.assignedTo === uid || job.createdBy === uid;
  };

  const canUserActOnJob = (job) => {
    if (!job) return false;
    if (activeUser.role === 'Sales Manager') return true;
    return job.assignedTo === activeUserId;
  };

  // Live pending counts for each tab
  const pendingCountsByTab = useMemo(() => {
    const counts = {
      'Blueprint Transitions': 0,
      Approvals: 0,
      Reviews: 0,
      'Image Validations': 0,
    };
    myJobs.forEach((job) => {
      if (job.decision === 'Pending' && isJobAvailableToUser(job, activeUserId)) {
        if (counts[job.category] !== undefined) {
          counts[job.category] += 1;
        }
      }
    });
    return counts;
  }, [myJobs, activeUserId, users]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setStatusFilter('All Status');
    setModuleFilter('All Modules');
    setSelectedRowIds(new Set());
    setPage(1);
  };

  // Distinct filter options extracted from current dataset for Approvals
  const distinctProcesses = useMemo(() => {
    const set = new Set();
    myJobs.filter((j) => j.category === activeTab).forEach((j) => {
      if (j.processName) set.add(j.processName);
    });
    return Array.from(set).sort();
  }, [myJobs, activeTab]);

  const distinctModules = useMemo(() => {
    const set = new Set();
    myJobs.filter((j) => j.category === activeTab).forEach((j) => {
      if (j.module) set.add(j.module);
    });
    return Array.from(set).sort();
  }, [myJobs, activeTab]);

  const distinctRequesters = useMemo(() => {
    const set = new Set();
    myJobs.filter((j) => j.category === activeTab).forEach((j) => {
      if (j.requesterName) set.add(j.requesterName);
    });
    return Array.from(set).sort();
  }, [myJobs, activeTab]);

  const distinctOwners = useMemo(() => {
    const set = new Set();
    myJobs.filter((j) => j.category === activeTab).forEach((j) => {
      if (j.recordOwner) set.add(j.recordOwner);
    });
    return Array.from(set).sort();
  }, [myJobs, activeTab]);

  // Close menus on outside click or Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (respondJobId && !savingJobId) setRespondJobId(null);
        else if (inspectJobId && !savingJobId) setInspectJobId(null);
        else if (historyOpen) setHistoryOpen(false);
        else if (helpOpen) setHelpOpen(false);
        else if (sortDropdownOpen) setSortDropdownOpen(false);
      }
    };
    const onDocClick = (e) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target)) {
        setSortDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDocClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDocClick);
    };
  }, [respondJobId, inspectJobId, savingJobId, historyOpen, helpOpen, sortDropdownOpen]);

  // Filter and sort records
  const filteredRows = useMemo(() => {
    const tableQ = tableSearchQuery.trim().toLowerCase();
    const panelQ = filterPanelSearch.trim().toLowerCase();

    const rows = myJobs.filter((job) => {
      if (job.category !== activeTab) return false;
      if (!isJobAvailableToUser(job, activeUserId)) return false;

      // Status & Module filters
      if (showPendingOnly && statusFilter === 'All Status' && job.decision !== 'Pending') return false;
      if (statusFilter !== 'All Status' && job.status !== statusFilter) return false;
      if (moduleFilter !== 'All Modules' && job.module !== moduleFilter) return false;

      // Left panel field filters
      if (activeFieldFilters.processName.length > 0 && !activeFieldFilters.processName.includes(job.processName)) {
        return false;
      }
      if (activeFieldFilters.module.length > 0 && !activeFieldFilters.module.includes(job.module)) {
        return false;
      }
      if (activeFieldFilters.requesterName.length > 0 && !activeFieldFilters.requesterName.includes(job.requesterName)) {
        return false;
      }
      if (activeFieldFilters.recordOwner.length > 0 && !activeFieldFilters.recordOwner.includes(job.recordOwner)) {
        return false;
      }
      if (activeFieldFilters.recordName.trim()) {
        const sub = activeFieldFilters.recordName.trim().toLowerCase();
        if (!job.recordName?.toLowerCase().includes(sub)) return false;
      }
      if (activeFieldFilters.submittedAt !== 'All') {
        const d = new Date(job.submittedAt);
        const now = new Date('2026-10-10T12:00:00'); // deterministic reference
        if (activeFieldFilters.submittedAt === 'Today') {
          if (d.toDateString() !== now.toDateString()) return false;
        } else if (activeFieldFilters.submittedAt === 'Last 7 Days') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (d < sevenDaysAgo) return false;
        }
      }

      // Filter panel search query
      if (panelQ) {
        const hay = `${job.recordName} ${job.processName} ${job.module} ${job.requesterName || ''} ${job.recordOwner || ''}`.toLowerCase();
        if (!hay.includes(panelQ)) return false;
      }

      // Top search query
      if (tableQ) {
        const hay = `${job.recordName} ${job.processName} ${job.module} ${job.requesterName || ''} ${job.recordOwner || ''} ${job.summary || ''}`.toLowerCase();
        if (!hay.includes(tableQ)) return false;
      }

      return true;
    });

    const sorted = [...rows].sort((a, b) => {
      const { key, dir } = sortConfig;
      let va = a[key];
      let vb = b[key];

      if (key === 'submittedAt') {
        va = new Date(a.submittedAt || 0).getTime();
        vb = new Date(b.submittedAt || 0).getTime();
      } else if (key === 'fieldsCount') {
        va = a.fieldsToReview?.length || 0;
        vb = b.fieldsToReview?.length || 0;
      } else if (key === 'createdBy') {
        va = userName(a.createdBy);
        vb = userName(b.createdBy);
      }

      if (va == null) va = '';
      if (vb == null) vb = '';

      if (typeof va === 'number' && typeof vb === 'number') {
        return dir === 'asc' ? va - vb : vb - va;
      }
      return dir === 'asc'
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va));
    });

    return sorted;
  }, [
    myJobs,
    activeTab,
    activeUserId,
    showPendingOnly,
    statusFilter,
    moduleFilter,
    activeFieldFilters,
    filterPanelSearch,
    tableSearchQuery,
    sortConfig,
    userName,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedRows = useMemo(
    () => filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filteredRows, currentPage, pageSize]
  );

  const handleSort = (key) => {
    setSortConfig((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
    );
  };

  // Selection Checkbox handling
  const allCurrentPageSelected =
    paginatedRows.length > 0 && paginatedRows.every((r) => selectedRowIds.has(r.id));

  const toggleSelectAllCurrentPage = () => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (allCurrentPageSelected) {
        paginatedRows.forEach((r) => next.delete(r.id));
      } else {
        paginatedRows.forEach((r) => next.add(r.id));
      }
      return next;
    });
  };

  const toggleRowSelect = (id, e) => {
    e.stopPropagation();
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Open Respond modal for Approvals
  const openApprovalRespondModal = (job) => {
    setRespondJobId(job.id);
    setComment(job.reviewComment || '');
    setActionError('');
  };

  const closeApprovalRespondModal = () => {
    if (savingJobId) return;
    setRespondJobId(null);
    setActionError('');
    setComment('');
  };

  // Open generic inspect drawer for Reviews / Blueprint / Image
  const openInspectDrawer = (job) => {
    setInspectJobId(job.id);
    setComment(job.reviewComment || '');
    setActionError('');
    setTransitionErrors({});
    setImageZoomed(false);
    if (job.category === 'Blueprint Transitions' && job.transitions?.length > 0) {
      const firstTr = job.transitions[0];
      setSelectedTransitionId(firstTr.id);
      const defaults = {};
      (firstTr.requiredFields || []).forEach((f) => {
        defaults[f.name] = f.defaultValue ?? '';
      });
      setTransitionInputs(defaults);
    } else {
      setSelectedTransitionId('');
      setTransitionInputs({});
    }
  };

  const closeInspectDrawer = () => {
    if (savingJobId) return;
    setInspectJobId(null);
    setActionError('');
    setTransitionErrors({});
  };

  const selectedRespondJob = useMemo(
    () => myJobs.find((j) => j.id === respondJobId) || null,
    [myJobs, respondJobId]
  );

  const selectedInspectJob = useMemo(
    () => myJobs.find((j) => j.id === inspectJobId) || null,
    [myJobs, inspectJobId]
  );

  // ---------------- Action Handlers ----------------
  const executeJobAction = (job, payload, successToast, onComplete) => {
    if (savingJobId) return;
    setSavingJobId(job.id);
    setActionError('');
    setTimeout(() => {
      try {
        processMyJobAction(job.id, {
          ...payload,
          userId: activeUserId,
        });
        toast.success(successToast);
        setSavingJobId(null);
        onComplete?.();
      } catch (err) {
        setSavingJobId(null);
        setActionError(err?.message || 'Failed to save action. Please try again.');
      }
    }, 200);
  };

  // Approvals: Approve or Reject
  const handleApprovalDecision = (decisionType) => {
    if (!selectedRespondJob || savingJobId) return;
    if (!canUserActOnJob(selectedRespondJob)) {
      setActionError(`Permission denied: Only ${userName(selectedRespondJob.assignedTo)} or a Sales Manager can act on this approval.`);
      return;
    }
    const cleanComment = comment.trim();
    if (decisionType === 'Rejected' && !cleanComment) {
      setActionError('A rejection reason is required before rejecting this approval request.');
      return;
    }

    executeJobAction(
      selectedRespondJob,
      {
        status: decisionType === 'Approved' ? 'Approved' : 'Rejected',
        decision: decisionType,
        actionLabel: decisionType === 'Approved' ? 'Approved Request' : 'Rejected Request',
        comment: cleanComment || (decisionType === 'Approved' ? 'Approved request.' : ''),
        recordPatch: decisionType === 'Approved' ? selectedRespondJob.proposedPatch || {} : {},
      },
      decisionType === 'Approved'
        ? `Approved "${selectedRespondJob.recordName}".`
        : `Rejected approval request for "${selectedRespondJob.recordName}".`,
      () => {
        setRespondJobId(null);
        setComment('');
      }
    );
  };

  // Batch Approve / Reject
  const handleBatchApprovalAction = (decisionType) => {
    if (selectedRowIds.size === 0 || savingJobId) return;
    const cleanComment = comment.trim();
    if (decisionType === 'Rejected' && !cleanComment) {
      toast.error('A rejection reason is required before batch rejecting requests.');
      return;
    }

    setSavingJobId('batch');
    const selectedList = myJobs.filter((j) => selectedRowIds.has(j.id) && j.decision === 'Pending');

    setTimeout(() => {
      try {
        selectedList.forEach((j) => {
          processMyJobAction(j.id, {
            status: decisionType === 'Approved' ? 'Approved' : 'Rejected',
            decision: decisionType,
            actionLabel: decisionType === 'Approved' ? 'Batch Approved' : 'Batch Rejected',
            comment: cleanComment || (decisionType === 'Approved' ? 'Batch approved by reviewer.' : 'Batch rejected.'),
            userId: activeUserId,
            recordPatch: decisionType === 'Approved' ? j.proposedPatch || {} : {},
          });
        });
        toast.success(`${decisionType === 'Approved' ? 'Approved' : 'Rejected'} ${selectedList.length} records.`);
        setSelectedRowIds(new Set());
        setSavingJobId(null);
        setBatchActionType(null);
      } catch (err) {
        setSavingJobId(null);
        toast.error('Failed to complete batch approval.');
      }
    }, 300);
  };

  // Reviews: Accept or Reject
  const handleReviewDecision = (decisionType) => {
    if (!selectedInspectJob || savingJobId) return;
    if (!canUserActOnJob(selectedInspectJob)) {
      setActionError(`Permission denied: Only ${userName(selectedInspectJob.assignedTo)} or a Sales Manager can review this record.`);
      return;
    }
    const cleanComment = comment.trim();
    if (decisionType === 'Rejected' && !cleanComment) {
      setActionError('Please enter a review comment explaining why the proposed field changes are rejected.');
      return;
    }

    const recordPatch = {};
    if (decisionType === 'Accepted' && Array.isArray(selectedInspectJob.fieldsToReview)) {
      selectedInspectJob.fieldsToReview.forEach((f) => {
        if (f.field && f.rawProposed !== undefined) {
          recordPatch[f.field] = f.rawProposed;
        }
      });
    }

    executeJobAction(
      selectedInspectJob,
      {
        status: decisionType === 'Accepted' ? 'Accepted' : 'Rejected',
        decision: decisionType,
        actionLabel: decisionType === 'Accepted' ? 'Accepted Review' : 'Rejected Review',
        comment: cleanComment || (decisionType === 'Accepted' ? 'Accepted all proposed field changes.' : ''),
        recordPatch,
      },
      decisionType === 'Accepted'
        ? `Accepted field review for "${selectedInspectJob.recordName}" and updated record.`
        : `Rejected field review for "${selectedInspectJob.recordName}".`,
      () => setInspectJobId(null)
    );
  };

  // Blueprint Transitions: Execute
  const handleApplyBlueprintTransition = () => {
    if (!selectedInspectJob || savingJobId) return;
    if (!canUserActOnJob(selectedInspectJob)) {
      setActionError(`Permission denied: Only ${userName(selectedInspectJob.assignedTo)} or a Sales Manager can execute this transition.`);
      return;
    }
    const tr = (selectedInspectJob.transitions || []).find((t) => t.id === selectedTransitionId);
    if (!tr) {
      setActionError('Select a valid blueprint transition to continue.');
      return;
    }

    const errors = {};
    (tr.requiredFields || []).forEach((f) => {
      const val = transitionInputs[f.name];
      if (val === undefined || val === null || String(val).trim() === '') {
        errors[f.name] = `${f.label} is required for "${tr.name}".`;
      }
    });

    if (Object.keys(errors).length > 0) {
      setTransitionErrors(errors);
      setActionError('Please complete all mandatory transition fields before applying.');
      return;
    }

    const recordPatch = {};
    if (selectedInspectJob.collection === 'deals') {
      recordPatch.stage = tr.nextState;
      if (tr.nextProbability != null) recordPatch.probability = tr.nextProbability;
      if (tr.nextCategory) recordPatch.forecastCategory = tr.nextCategory;
    }

    executeJobAction(
      selectedInspectJob,
      {
        status: 'Transitioned',
        decision: 'Completed',
        actionLabel: `Transitioned (${selectedInspectJob.currentState} → ${tr.nextState})`,
        comment: comment.trim() || `Transition "${tr.name}" applied.`,
        nextState: tr.nextState,
        transitionValues: transitionInputs,
        recordPatch,
      },
      `Applied blueprint transition "${tr.name}" (${selectedInspectJob.currentState} → ${tr.nextState}).`,
      () => setInspectJobId(null)
    );
  };

  // Image Validations: Accept or Reject
  const handleImageValidationDecision = (decisionType) => {
    if (!selectedInspectJob || savingJobId) return;
    if (!canUserActOnJob(selectedInspectJob)) {
      setActionError(`Permission denied: Only ${userName(selectedInspectJob.assignedTo)} or a Sales Manager can validate this image.`);
      return;
    }
    const cleanComment = comment.trim();
    if (decisionType === 'Rejected' && !cleanComment) {
      setActionError('Please provide a rejection reason explaining why the submitted image failed validation.');
      return;
    }

    executeJobAction(
      selectedInspectJob,
      {
        status: decisionType === 'Accepted' ? 'Accepted' : 'Rejected',
        decision: decisionType,
        actionLabel: decisionType === 'Accepted' ? 'Accepted Image' : 'Rejected Image',
        comment: cleanComment || (decisionType === 'Accepted' ? 'Image verified and accepted.' : ''),
        recordPatch: {},
      },
      decisionType === 'Accepted'
        ? `Accepted image validation for "${selectedInspectJob.recordName}".`
        : `Rejected image for "${selectedInspectJob.recordName}".`,
      () => setInspectJobId(null)
    );
  };

  // Filter Approval History Logs
  const filteredHistoryLogs = useMemo(() => {
    const q = historySearch.trim().toLowerCase();
    return myJobsLogs.filter((log) => {
      if (historyCategoryFilter !== 'All' && log.category !== historyCategoryFilter) return false;
      if (q) {
        const hay = `${log.recordName} ${log.action} ${userName(log.userId)} ${log.comment} ${log.processName} ${log.module}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [myJobsLogs, historySearch, historyCategoryFilter, userName]);

  const handleExportHistoryCSV = () => {
    exportCSV('approval-history.csv', filteredHistoryLogs, [
      { label: 'Timestamp', value: (r) => formatSubmittedOn(r.timestamp) },
      { label: 'Category', value: (r) => r.category },
      { label: 'Record Name', value: (r) => r.recordName },
      { label: 'Module', value: (r) => r.module },
      { label: 'Approval Process Name', value: (r) => r.processName },
      { label: 'Action Taken', value: (r) => r.action },
      { label: 'Reviewer / Approver', value: (r) => userName(r.userId) },
      { label: 'Reason / Comment', value: (r) => r.comment },
    ]);
    toast.success('Exported Approval History to CSV');
  };

  // Toggle filter checkbox in left panel
  const toggleArrayFilter = (fieldKey, value) => {
    setActiveFieldFilters((prev) => {
      const arr = prev[fieldKey] || [];
      const nextArr = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      return { ...prev, [fieldKey]: nextArr };
    });
    setPage(1);
  };

  const hasActiveFilters =
    activeFieldFilters.processName.length > 0 ||
    activeFieldFilters.module.length > 0 ||
    activeFieldFilters.recordOwner.length > 0 ||
    activeFieldFilters.requesterName.length > 0 ||
    Boolean(activeFieldFilters.recordName.trim()) ||
    activeFieldFilters.submittedAt !== 'All' ||
    statusFilter !== 'All Status' ||
    moduleFilter !== 'All Modules' ||
    Boolean(tableSearchQuery.trim()) ||
    Boolean(filterPanelSearch.trim());

  const handleClearAllFilters = () => {
    setActiveFieldFilters({
      processName: [],
      module: [],
      recordName: '',
      recordOwner: [],
      requesterName: [],
      submittedAt: 'All',
    });
    setStatusFilter('All Status');
    setModuleFilter('All Modules');
    setTableSearchQuery('');
    setFilterPanelSearch('');
    setPage(1);
  };

  const visibleFilterFields = useMemo(() => {
    const q = filterPanelSearch.trim().toLowerCase();
    if (!q) return APPROVAL_FILTER_FIELDS;
    return APPROVAL_FILTER_FIELDS.filter((f) => f.label.toLowerCase().includes(q));
  }, [filterPanelSearch]);

  const statusOptions = STATUS_OPTIONS_BY_TAB[activeTab] || ['All Status'];

  return (
    <div className="min-h-[calc(100vh-60px)] bg-white text-[#1E293B] flex flex-col font-sans">
      {/* ------------------------------------------------------------- */}
      {/* 1. COMPACT TABS BAR DIRECTLY BELOW HEADER (Matching Screenshot) */}
      {/* ------------------------------------------------------------- */}
      <div className="border-b border-[#E2E8F0] bg-white px-4 sm:px-6 pt-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="My Jobs Categories"
            className="flex items-center gap-3 sm:gap-4 overflow-x-auto no-scrollbar py-2"
          >
            {MY_JOBS_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const count = pendingCountsByTab[tab.id] ?? 0;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`panel-${tab.id}`}
                  onClick={() => handleTabChange(tab.id)}
                  className={`group relative inline-flex items-center gap-2 px-3 py-1.5 text-[13px] rounded transition-all focus:outline-none ${
                    isActive
                      ? 'border border-[#1262E0] bg-white text-[#1262E0] font-semibold shadow-xs'
                      : 'border border-transparent text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC] font-medium'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    aria-label={`${count} pending`}
                    className={`inline-flex items-center justify-center min-w-[20px] h-[18px] px-1.5 rounded-full text-[11px] font-semibold border transition-colors ${
                      isActive
                        ? 'border-[#BFDBFE] text-[#1262E0] bg-[#EFF6FF]'
                        : 'border-[#CBD5E1] text-[#64748B] bg-white group-hover:border-[#94A3B8]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Reviewer Persona Switcher for testing permissions */}
          <div className="hidden sm:flex items-center gap-1.5 text-[12px] text-[#475569] py-1">
            <UserCheck size={13.5} className="text-[#64748B]" />
            <span className="text-[#64748B]">Reviewer:</span>
            <select
              aria-label="Active Reviewer Context"
              value={activeUserId}
              onChange={(e) => {
                setActiveUserId(e.target.value);
                setPage(1);
              }}
              className="h-7 px-2 rounded border border-[#DCE3EE] bg-[#F8FAFC] text-[12px] text-[#1E293B] focus:border-[#1262E0] focus:outline-none"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. SUB-TAB TOOLBAR (Filter, Sort, Approval History, Help)      */}
      {/* ------------------------------------------------------------- */}
      <div className="px-4 sm:px-6 py-2 border-b border-[#E2E8F0] bg-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Filter button toggles left filter panel */}
          <button
            type="button"
            aria-label="Toggle Filter Panel"
            onClick={() => setShowFilterPanel((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[12.5px] font-medium border transition-colors ${
              showFilterPanel
                ? 'border-[#1262E0] bg-[#EFF6FF] text-[#1262E0]'
                : 'border-[#DCE3EE] bg-white text-[#334155] hover:bg-[#F8FAFC]'
            }`}
          >
            <Filter size={13} className={showFilterPanel ? 'text-[#1262E0]' : 'text-[#64748B]'} />
            <span>Filter</span>
          </button>

          {/* Sort button with dropdown popover */}
          <div className="relative" ref={sortMenuRef}>
            <button
              type="button"
              aria-label="Sort Records"
              aria-expanded={sortDropdownOpen}
              onClick={() => setSortDropdownOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[12.5px] font-medium border border-[#DCE3EE] bg-white text-[#334155] hover:bg-[#F8FAFC] transition-colors"
            >
              <ArrowUpDown size={13} className="text-[#64748B]" />
              <span>Sort</span>
            </button>

            {sortDropdownOpen && (
              <div className="absolute left-0 top-full mt-1 w-56 rounded-lg border border-[#DCE3EE] bg-white shadow-lg py-1 z-40 text-[12.5px]">
                <div className="px-3 py-1.5 font-semibold text-[11px] text-[#64748B] uppercase tracking-wider border-b border-[#F1F5F9]">
                  Sort By
                </div>
                {[
                  { label: 'Submitted On (Newest)', key: 'submittedAt', dir: 'desc' },
                  { label: 'Submitted On (Oldest)', key: 'submittedAt', dir: 'asc' },
                  { label: 'Record Name (A to Z)', key: 'recordName', dir: 'asc' },
                  { label: 'Record Name (Z to A)', key: 'recordName', dir: 'desc' },
                  { label: 'Requester Name (A to Z)', key: 'requesterName', dir: 'asc' },
                  { label: 'Requester Name (Z to A)', key: 'requesterName', dir: 'desc' },
                  { label: 'Approval Process (A to Z)', key: 'processName', dir: 'asc' },
                ].map((opt) => {
                  const active = sortConfig.key === opt.key && sortConfig.dir === opt.dir;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => {
                        setSortConfig({ key: opt.key, dir: opt.dir });
                        setSortDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-[#F8FAFC] ${
                        active ? 'text-[#1262E0] font-semibold bg-[#EFF6FF]/60' : 'text-[#334155]'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {active && <Check size={13} className="text-[#1262E0]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick search input */}
          <div className="relative hidden md:block ml-2">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="search"
              value={tableSearchQuery}
              onChange={(e) => {
                setTableSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search table records..."
              aria-label="Search records in table"
              className="h-[30px] pl-8 pr-2.5 w-52 rounded border border-[#DCE3EE] bg-[#F8FAFC] text-[12px] text-[#1E293B] placeholder-[#94A3B8] focus:bg-white focus:border-[#1262E0] focus:outline-none"
            />
          </div>
        </div>

        {/* Right side links matching screenshot */}
        <div className="flex items-center gap-4 text-[13px]">
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="text-[#1262E0] hover:text-[#0B4BB8] hover:underline font-medium focus:outline-none"
          >
            Approval History
          </button>
          <span className="text-[#CBD5E1]">|</span>
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            className="text-[#475569] hover:text-[#0F172A] hover:underline font-medium inline-flex items-center gap-1 focus:outline-none"
          >
            <HelpCircle size={13.5} className="text-[#64748B]" />
            <span>Help</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. BATCH ACTIONS BAR (when rows selected)                     */}
      {/* ------------------------------------------------------------- */}
      {selectedRowIds.size > 0 && (
        <div className="px-4 sm:px-6 py-2 bg-[#EFF6FF] border-b border-[#BFDBFE] flex flex-wrap items-center justify-between gap-3 text-[12.5px]">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#1262E0]">{selectedRowIds.size}</span>
            <span className="text-[#1E293B]">record{selectedRowIds.size > 1 ? 's' : ''} selected</span>
            <button
              type="button"
              onClick={() => setSelectedRowIds(new Set())}
              className="text-[#64748B] hover:text-[#0F172A] underline ml-2"
            >
              Clear selection
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={Boolean(savingJobId)}
              onClick={() => handleBatchApprovalAction('Approved')}
              className="inline-flex items-center gap-1 px-3 py-1 rounded bg-[#1262E0] text-white font-medium hover:bg-[#0B4BB8] disabled:opacity-50"
            >
              {savingJobId === 'batch' ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
              <span>Batch Approve</span>
            </button>
            <button
              type="button"
              disabled={Boolean(savingJobId)}
              onClick={() => handleBatchApprovalAction('Rejected')}
              className="inline-flex items-center gap-1 px-3 py-1 rounded bg-white border border-[#FECACA] text-[#B91C1C] font-medium hover:bg-[#FEF2F2] disabled:opacity-50"
            >
              <XCircle size={13} />
              <span>Batch Reject</span>
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. MAIN SPLIT: LEFT FILTER PANEL + DENSE TABLE                 */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-white">
        {/* LEFT-SIDE FILTER PANEL */}
        {showFilterPanel && (
          <aside
            aria-label="Filter records sidebar"
            className="w-full md:w-[195px] lg:w-[205px] shrink-0 border-r border-[#E2E8F0] bg-[#FAFCFF] flex flex-col h-auto md:h-full overflow-y-auto"
          >
            {/* Filter Panel Header */}
            <div className="px-3.5 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
              <span className="text-[12.5px] font-semibold text-[#0F172A] truncate">
                Filter Approval Reco...
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="text-[11px] font-medium text-[#1262E0] hover:underline"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Filter Search Input */}
            <div className="p-2.5 border-b border-[#E2E8F0]">
              <div className="relative">
                <Search size={12.5} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type="search"
                  value={filterPanelSearch}
                  onChange={(e) => setFilterPanelSearch(e.target.value)}
                  placeholder="Search"
                  aria-label="Filter search fields"
                  className="w-full h-7 pl-7 pr-2 text-[12px] bg-white rounded border border-[#CBD5E1] text-[#1E293B] placeholder-[#94A3B8] focus:border-[#1262E0] focus:outline-none"
                />
              </div>
            </div>

            {/* Filter by Fields Accordion Section matching Screenshot 3 */}
            <div className="p-3 space-y-3">
              <div className="flex items-center justify-between text-[12px] font-semibold text-[#334155]">
                <span className="flex items-center gap-1">
                  <span>▾</span> Filter By Fields
                </span>
              </div>

              {/* Fields Checkboxes List */}
              <div className="space-y-2 text-[12px]">
                {visibleFilterFields.map((field) => {
                  const isExpanded = Boolean(expandedFields[field.id]);
                  return (
                    <div key={field.id} className="space-y-1.5">
                      <label className="flex items-start gap-2 text-[#334155] hover:text-[#0F172A] cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isExpanded}
                          onChange={(e) => {
                            setExpandedFields((p) => ({ ...p, [field.id]: e.target.checked }));
                          }}
                          className="mt-0.5 rounded border-[#CBD5E1] text-[#1262E0] focus:ring-[#1262E0] w-3.5 h-3.5"
                        />
                        <span className="leading-tight">{field.label}</span>
                      </label>

                      {/* Expandable sub-options for field when checked */}
                      {isExpanded && (
                        <div className="pl-5 pt-1 space-y-1">
                          {field.id === 'processName' && (
                            <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                              {distinctProcesses.map((proc) => {
                                const checked = activeFieldFilters.processName.includes(proc);
                                return (
                                  <label
                                    key={proc}
                                    className="flex items-center gap-1.5 text-[11.5px] text-[#475569] hover:text-[#0F172A] cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => toggleArrayFilter('processName', proc)}
                                      className="rounded border-[#CBD5E1] text-[#1262E0] focus:ring-[#1262E0] w-3 h-3"
                                    />
                                    <span className="truncate" title={proc}>
                                      {proc}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          )}

                          {field.id === 'module' && (
                            <div className="space-y-1">
                              {distinctModules.map((mod) => {
                                const checked = activeFieldFilters.module.includes(mod);
                                return (
                                  <label
                                    key={mod}
                                    className="flex items-center gap-1.5 text-[11.5px] text-[#475569] hover:text-[#0F172A] cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => toggleArrayFilter('module', mod)}
                                      className="rounded border-[#CBD5E1] text-[#1262E0] focus:ring-[#1262E0] w-3 h-3"
                                    />
                                    <span>{mod}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}

                          {field.id === 'requesterName' && (
                            <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                              {distinctRequesters.map((req) => {
                                const checked = activeFieldFilters.requesterName.includes(req);
                                return (
                                  <label
                                    key={req}
                                    className="flex items-center gap-1.5 text-[11.5px] text-[#475569] hover:text-[#0F172A] cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => toggleArrayFilter('requesterName', req)}
                                      className="rounded border-[#CBD5E1] text-[#1262E0] focus:ring-[#1262E0] w-3 h-3"
                                    />
                                    <span className="truncate">{req}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}

                          {field.id === 'recordOwner' && (
                            <div className="space-y-1">
                              {distinctOwners.map((own) => {
                                const checked = activeFieldFilters.recordOwner.includes(own);
                                return (
                                  <label
                                    key={own}
                                    className="flex items-center gap-1.5 text-[11.5px] text-[#475569] hover:text-[#0F172A] cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => toggleArrayFilter('recordOwner', own)}
                                      className="rounded border-[#CBD5E1] text-[#1262E0] focus:ring-[#1262E0] w-3 h-3"
                                    />
                                    <span className="truncate">{own}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}

                          {field.id === 'submittedAt' && (
                            <select
                              value={activeFieldFilters.submittedAt}
                              onChange={(e) => {
                                setActiveFieldFilters((p) => ({ ...p, submittedAt: e.target.value }));
                                setPage(1);
                              }}
                              className="w-full h-6 px-1.5 text-[11.5px] bg-white rounded border border-[#CBD5E1]"
                            >
                              <option value="All">All Dates</option>
                              <option value="Today">Today</option>
                              <option value="Last 7 Days">Last 7 Days</option>
                            </select>
                          )}

                          {field.id === 'recordName' && (
                            <input
                              type="text"
                              value={activeFieldFilters.recordName}
                              onChange={(e) => {
                                setActiveFieldFilters((p) => ({ ...p, recordName: e.target.value }));
                                setPage(1);
                              }}
                              placeholder="Record contains..."
                              className="w-full h-6 px-2 text-[11.5px] bg-white rounded border border-[#CBD5E1]"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        )}

        {/* MAIN TABLE CONTAINER */}
        <div className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden">
          {/* Active filter tags */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-1.5 px-4 py-2 border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11.5px]">
              <span className="text-[#64748B]">Filtered by:</span>
              {activeFieldFilters.processName.map((p) => (
                <span
                  key={p}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white text-[#1262E0] border border-[#BFDBFE]"
                >
                  Process: {p}
                  <button type="button" onClick={() => toggleArrayFilter('processName', p)}>
                    <X size={11} />
                  </button>
                </span>
              ))}
              {activeFieldFilters.module.map((m) => (
                <span
                  key={m}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white text-[#1262E0] border border-[#BFDBFE]"
                >
                  Module: {m}
                  <button type="button" onClick={() => toggleArrayFilter('module', m)}>
                    <X size={11} />
                  </button>
                </span>
              ))}
              {activeFieldFilters.requesterName.map((r) => (
                <span
                  key={r}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white text-[#1262E0] border border-[#BFDBFE]"
                >
                  Requester: {r}
                  <button type="button" onClick={() => toggleArrayFilter('requesterName', r)}>
                    <X size={11} />
                  </button>
                </span>
              ))}
              {Boolean(tableSearchQuery.trim()) && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white text-[#1262E0] border border-[#BFDBFE]">
                  Search: &ldquo;{tableSearchQuery}&rdquo;
                  <button type="button" onClick={() => setTableSearchQuery('')}>
                    <X size={11} />
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="text-[#1262E0] hover:underline ml-1 font-medium"
              >
                Reset all
              </button>
            </div>
          )}

          {/* Table Body */}
          <div className="flex-1 overflow-x-auto overflow-y-auto">
            {/* ========================================================= */}
            {/* 1. APPROVALS TABLE (Matches Screenshot 3 in exact detail) */}
            {/* ========================================================= */}
            {activeTab === 'Approvals' && (
              <table className="w-full min-w-[880px] border-collapse text-left text-[12.5px]">
                <thead className="sticky top-0 z-10 bg-[#F8FAFC] border-b border-[#DCE3EE]">
                  <tr className="text-[#334155] font-semibold">
                    {/* Action column (above Respond button) */}
                    <th className="py-2.5 px-3 w-[100px] text-center">Action</th>
                    {/* Checkbox column */}
                    <th className="py-2.5 px-3 w-8">
                      <input
                        type="checkbox"
                        checked={allCurrentPageSelected}
                        onChange={toggleSelectAllCurrentPage}
                        aria-label="Select all records on current page"
                        className="rounded border-[#CBD5E1] text-[#1262E0] focus:ring-[#1262E0] w-3.5 h-3.5 cursor-pointer"
                      />
                    </th>
                    <th className="py-2.5 px-3 whitespace-nowrap min-w-[140px]">
                      <SortableHeader label="Record Name" sortKey="recordName" sortConfig={sortConfig} onSort={handleSort} />
                    </th>
                    <th className="py-2.5 px-3 whitespace-nowrap min-w-[200px]">
                      <SortableHeader label="Approval Process Name" sortKey="processName" sortConfig={sortConfig} onSort={handleSort} />
                    </th>
                    <th className="py-2.5 px-3 whitespace-nowrap min-w-[100px]">
                      <SortableHeader label="Module" sortKey="module" sortConfig={sortConfig} onSort={handleSort} />
                    </th>
                    <th className="py-2.5 px-3 whitespace-nowrap min-w-[150px]">
                      <SortableHeader label="Submitted On" sortKey="submittedAt" sortConfig={sortConfig} onSort={handleSort} />
                    </th>
                    <th className="py-2.5 px-3 whitespace-nowrap min-w-[160px]">
                      <SortableHeader label="Requester Name" sortKey="requesterName" sortConfig={sortConfig} onSort={handleSort} />
                    </th>
                    <th className="py-2.5 px-3 w-10 text-right">
                      <SlidersHorizontal size={14} className="text-[#94A3B8] inline-block" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="h-64 text-center text-[#64748B] align-middle">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <CheckCircle2 size={32} className="text-[#10B981] opacity-70" />
                          <p className="font-medium text-[13.5px] text-[#334155]">{EMPTY_MESSAGE_BY_TAB.Approvals}</p>
                          <p className="text-[12px] text-[#64748B]">All approval requests are up to date.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((job) => {
                      const isSelected = selectedRowIds.has(job.id);
                      return (
                        <tr
                          key={job.id}
                          onClick={() => openApprovalRespondModal(job)}
                          className={`hover:bg-[#F8FAFC] transition-colors cursor-pointer group ${
                            isSelected ? 'bg-[#EFF6FF]/40' : ''
                          }`}
                        >
                          {/* Respond Button */}
                          <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => openApprovalRespondModal(job)}
                              aria-label={`Respond to approval for ${job.recordName}`}
                              className="h-[26px] px-2.5 rounded border border-[#DCE3EE] bg-white hover:bg-[#F8FAFC] text-[12px] font-medium text-[#1E293B] inline-flex items-center gap-1 shadow-2xs focus:outline-none focus:ring-1 focus:ring-[#1262E0]"
                            >
                              <span>Respond</span>
                              <ChevronDown size={11} className="text-[#64748B]" />
                            </button>
                          </td>

                          {/* Checkbox */}
                          <td className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => toggleRowSelect(job.id, e)}
                              aria-label={`Select ${job.recordName}`}
                              className="rounded border-[#CBD5E1] text-[#1262E0] focus:ring-[#1262E0] w-3.5 h-3.5 cursor-pointer"
                            />
                          </td>

                          {/* Record Name (linkable) */}
                          <td className="py-2 px-3 font-semibold text-[#1262E0] whitespace-nowrap">
                            <span className="inline-flex items-center gap-1">
                              <span className="hover:underline">{job.recordName}</span>
                              {getRecordDeepLink(job) && (
                                <Link
                                  to={getRecordDeepLink(job)}
                                  onClick={(e) => e.stopPropagation()}
                                  title={`Open ${job.recordName} in ${job.module}`}
                                  className="text-[#94A3B8] hover:text-[#1262E0]"
                                >
                                  <ExternalLink size={11.5} />
                                </Link>
                              )}
                            </span>
                          </td>

                          {/* Approval Process Name */}
                          <td className="py-2 px-3 text-[#334155] whitespace-nowrap">
                            {job.processName}
                          </td>

                          {/* Module */}
                          <td className="py-2 px-3 text-[#334155] whitespace-nowrap">
                            {job.module}
                          </td>

                          {/* Submitted On (Zoho format: DD/MM/YYYY hh:mm A) */}
                          <td className="py-2 px-3 text-[#475569] whitespace-nowrap">
                            {formatSubmittedOn(job.submittedAt)}
                          </td>

                          {/* Requester Name */}
                          <td className="py-2 px-3 text-[#334155] whitespace-nowrap font-medium">
                            {job.requesterName || userName(job.createdBy)}
                          </td>

                          {/* Empty right cell */}
                          <td className="py-2 px-3 text-right">
                            {job.decision !== 'Pending' && (
                              <StatusBadge status={job.status} decision={job.decision} />
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}

            {/* ========================================================= */}
            {/* 2. BLUEPRINT TRANSITIONS TABLE                             */}
            {/* ========================================================= */}
            {activeTab === 'Blueprint Transitions' && (
              <table className="w-full min-w-[900px] border-collapse text-left text-[12.5px]">
                <thead className="sticky top-0 z-10 bg-[#F8FAFC] border-b border-[#DCE3EE]">
                  <tr className="text-[#334155] font-semibold">
                    <th className="py-2.5 px-3 w-[100px] text-center">Action</th>
                    <th className="py-2.5 px-3">
                      <SortableHeader label="Record Name" sortKey="recordName" sortConfig={sortConfig} onSort={handleSort} />
                    </th>
                    <th className="py-2.5 px-3">Current State</th>
                    <th className="py-2.5 px-3">Valid Next Transitions</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Submitted On</th>
                    <th className="py-2.5 px-3">Blueprint Name</th>
                    <th className="py-2.5 px-3">Module</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="h-64 text-center text-[#64748B] align-middle">
                        {EMPTY_MESSAGE_BY_TAB['Blueprint Transitions']}
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((job) => (
                      <tr
                        key={job.id}
                        onClick={() => openInspectDrawer(job)}
                        className="hover:bg-[#F8FAFC] cursor-pointer"
                      >
                        <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => openInspectDrawer(job)}
                            className="h-[26px] px-2.5 rounded border border-[#DCE3EE] bg-white hover:bg-[#F8FAFC] text-[12px] font-medium text-[#1E293B] inline-flex items-center gap-1 shadow-2xs"
                          >
                            <span>Execute</span>
                            <ChevronDown size={11} className="text-[#64748B]" />
                          </button>
                        </td>
                        <td className="py-2 px-3 font-semibold text-[#1262E0] whitespace-nowrap">
                          {job.recordName}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-[#F1F5F9] text-[#334155] font-medium border border-[#E2E8F0]">
                            {job.currentState}
                          </span>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {(job.transitions || []).map((t) => (
                              <span
                                key={t.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#EFF6FF] text-[#1262E0] border border-[#BFDBFE]"
                              >
                                <GitBranch size={11} /> {t.name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <StatusBadge status={job.status} decision={job.decision} />
                        </td>
                        <td className="py-2 px-3 text-[#475569] whitespace-nowrap">
                          {formatSubmittedOn(job.submittedAt)}
                        </td>
                        <td className="py-2 px-3 text-[#334155] whitespace-nowrap">{job.processName}</td>
                        <td className="py-2 px-3 text-[#334155] whitespace-nowrap">{job.module}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* ========================================================= */}
            {/* 3. REVIEWS TABLE                                          */}
            {/* ========================================================= */}
            {activeTab === 'Reviews' && (
              <table className="w-full min-w-[900px] border-collapse text-left text-[12.5px]">
                <thead className="sticky top-0 z-10 bg-[#F8FAFC] border-b border-[#DCE3EE]">
                  <tr className="text-[#334155] font-semibold">
                    <th className="py-2.5 px-3 w-[100px] text-center">Action</th>
                    <th className="py-2.5 px-3">
                      <SortableHeader label="Record Name" sortKey="recordName" sortConfig={sortConfig} onSort={handleSort} />
                    </th>
                    <th className="py-2.5 px-3">Fields To Review</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Created By</th>
                    <th className="py-2.5 px-3">Submitted On</th>
                    <th className="py-2.5 px-3">Process Name</th>
                    <th className="py-2.5 px-3">Module</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="h-64 text-center text-[#64748B] align-middle">
                        {EMPTY_MESSAGE_BY_TAB.Reviews}
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((job) => (
                      <tr
                        key={job.id}
                        onClick={() => openInspectDrawer(job)}
                        className="hover:bg-[#F8FAFC] cursor-pointer"
                      >
                        <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => openInspectDrawer(job)}
                            className="h-[26px] px-2.5 rounded border border-[#DCE3EE] bg-white hover:bg-[#F8FAFC] text-[12px] font-medium text-[#1E293B] inline-flex items-center gap-1 shadow-2xs"
                          >
                            <span>Review</span>
                            <ChevronDown size={11} className="text-[#64748B]" />
                          </button>
                        </td>
                        <td className="py-2 px-3 font-semibold text-[#1262E0] whitespace-nowrap">
                          {job.recordName}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-[#F1F5F9] text-[#334155] font-medium">
                            {job.fieldsToReview?.length || 0} Fields
                          </span>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <StatusBadge status={job.status} decision={job.decision} />
                        </td>
                        <td className="py-2 px-3 text-[#334155] whitespace-nowrap">{userName(job.createdBy)}</td>
                        <td className="py-2 px-3 text-[#475569] whitespace-nowrap">
                          {formatSubmittedOn(job.submittedAt)}
                        </td>
                        <td className="py-2 px-3 text-[#334155] whitespace-nowrap">{job.processName}</td>
                        <td className="py-2 px-3 text-[#334155] whitespace-nowrap">{job.module}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* ========================================================= */}
            {/* 4. IMAGE VALIDATIONS TABLE                                */}
            {/* ========================================================= */}
            {activeTab === 'Image Validations' && (
              <table className="w-full min-w-[900px] border-collapse text-left text-[12.5px]">
                <thead className="sticky top-0 z-10 bg-[#F8FAFC] border-b border-[#DCE3EE]">
                  <tr className="text-[#334155] font-semibold">
                    <th className="py-2.5 px-3 w-[100px] text-center">Action</th>
                    <th className="py-2.5 px-3">
                      <SortableHeader label="Record Name" sortKey="recordName" sortConfig={sortConfig} onSort={handleSort} />
                    </th>
                    <th className="py-2.5 px-3">Field Name</th>
                    <th className="py-2.5 px-3">Image Preview</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Submitted On</th>
                    <th className="py-2.5 px-3">Process Name</th>
                    <th className="py-2.5 px-3">Module</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="h-64 text-center text-[#64748B] align-middle">
                        {EMPTY_MESSAGE_BY_TAB['Image Validations']}
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((job) => (
                      <tr
                        key={job.id}
                        onClick={() => openInspectDrawer(job)}
                        className="hover:bg-[#F8FAFC] cursor-pointer"
                      >
                        <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => openInspectDrawer(job)}
                            className="h-[26px] px-2.5 rounded border border-[#DCE3EE] bg-white hover:bg-[#F8FAFC] text-[12px] font-medium text-[#1E293B] inline-flex items-center gap-1 shadow-2xs"
                          >
                            <span>Validate</span>
                            <ChevronDown size={11} className="text-[#64748B]" />
                          </button>
                        </td>
                        <td className="py-2 px-3 font-semibold text-[#1262E0] whitespace-nowrap">
                          {job.recordName}
                        </td>
                        <td className="py-2 px-3 text-[#334155] whitespace-nowrap">{job.fieldName}</td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <SubmittedImagePreview meta={job.imageMeta} />
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <StatusBadge status={job.status} decision={job.decision} />
                        </td>
                        <td className="py-2 px-3 text-[#475569] whitespace-nowrap">
                          {formatSubmittedOn(job.submittedAt)}
                        </td>
                        <td className="py-2 px-3 text-[#334155] whitespace-nowrap">{job.processName}</td>
                        <td className="py-2 px-3 text-[#334155] whitespace-nowrap">{job.module}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* --------------------------------------------------------- */}
          {/* 5. TABLE FOOTER: Total Records {count} & Pagination       */}
          {/* --------------------------------------------------------- */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 border-t border-[#E2E8F0] bg-[#F8FAFC] text-[12px] text-[#64748B]">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-[#0F172A]">
                Total Records {filteredRows.length}
              </span>
              <span className="text-[#CBD5E1]">•</span>
              <button
                type="button"
                onClick={resetDemo}
                className="inline-flex items-center gap-1 text-[#1262E0] hover:underline"
                title="Reset all demo jobs to initial seed state"
              >
                <RotateCcw size={11} /> Reset Demo
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <label htmlFor="myjobs-page-size">Records per page:</label>
                <select
                  id="myjobs-page-size"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="h-6 px-1.5 rounded border border-[#CBD5E1] bg-white text-[12px] text-[#334155]"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label="Previous page"
                  className="p-1 rounded border border-[#CBD5E1] bg-white text-[#334155] disabled:opacity-40 hover:bg-[#F1F5F9]"
                >
                  <ChevronLeft size={13} />
                </button>
                <span className="px-2 font-medium text-[#334155]">
                  {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="Next page"
                  className="p-1 rounded border border-[#CBD5E1] bg-white text-[#334155] disabled:opacity-40 hover:bg-[#F1F5F9]"
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 6. APPROVALS RESPOND MODAL (Mandatory rejection reason)       */}
      {/* ------------------------------------------------------------- */}
      {selectedRespondJob && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/50 backdrop-blur-[1px]"
          onClick={closeApprovalRespondModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="respond-dialog-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[620px] rounded-xl border border-[#DCE3EE] bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1262E0] border border-[#BFDBFE]">
                    Approval Response
                  </span>
                  <StatusBadge status={selectedRespondJob.status} decision={selectedRespondJob.decision} />
                </div>
                <h2 id="respond-dialog-title" className="text-[17px] font-bold text-[#0F172A] flex items-center gap-2">
                  <span>{selectedRespondJob.recordName}</span>
                  {getRecordDeepLink(selectedRespondJob) && (
                    <Link
                      to={getRecordDeepLink(selectedRespondJob)}
                      className="inline-flex items-center gap-1 text-[12px] font-medium text-[#1262E0] hover:underline"
                    >
                      <span>Open in {selectedRespondJob.module}</span>
                      <ExternalLink size={12} />
                    </Link>
                  )}
                </h2>
                <p className="text-[12px] text-[#64748B]">
                  {selectedRespondJob.processName} • {selectedRespondJob.module}
                </p>
              </div>
              <button
                type="button"
                onClick={closeApprovalRespondModal}
                disabled={Boolean(savingJobId)}
                aria-label="Close dialog"
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0]/60"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Context Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[12px]">
                <div>
                  <div className="text-[#64748B]">Requester</div>
                  <div className="font-semibold text-[#0F172A] mt-0.5">
                    {selectedRespondJob.requesterName || userName(selectedRespondJob.createdBy)}
                  </div>
                </div>
                <div>
                  <div className="text-[#64748B]">Record Owner</div>
                  <div className="font-semibold text-[#0F172A] mt-0.5">
                    {selectedRespondJob.recordOwner || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-[#64748B]">Submitted On</div>
                  <div className="font-semibold text-[#0F172A] mt-0.5">
                    {formatSubmittedOn(selectedRespondJob.submittedAt)}
                  </div>
                </div>
              </div>

              {/* Approval Rule Details */}
              <div className="p-3.5 rounded-lg border border-[#DCE3EE] bg-white space-y-2 text-[12.5px]">
                {selectedRespondJob.approvalRule && (
                  <div className="flex justify-between gap-4 border-b border-[#F1F5F9] pb-1.5">
                    <span className="text-[#64748B]">Triggered Rule:</span>
                    <span className="font-semibold text-[#0F172A] text-right">{selectedRespondJob.approvalRule}</span>
                  </div>
                )}
                {selectedRespondJob.requestedValue && (
                  <div className="flex justify-between gap-4 border-b border-[#F1F5F9] pb-1.5">
                    <span className="text-[#64748B]">Requested Exception:</span>
                    <span className="font-semibold text-[#1262E0] text-right">{selectedRespondJob.requestedValue}</span>
                  </div>
                )}
                {selectedRespondJob.summary && (
                  <div>
                    <div className="text-[#64748B] text-[11.5px] mb-1">Business Justification:</div>
                    <div className="p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[#334155] text-[12px]">
                      {selectedRespondJob.summary}
                    </div>
                  </div>
                )}
              </div>

              {/* Inline Action Error Alert */}
              {actionError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] text-[12.5px]">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* Reviewer Comment / Mandatory Rejection Reason */}
              <div>
                <label
                  htmlFor="approval-comment-input"
                  className="block text-[12.5px] font-semibold text-[#0F172A] mb-1"
                >
                  Reviewer Comment / Rejection Reason{' '}
                  <span className="text-[#DC2626] font-normal">*(Required for Rejection)</span>
                </label>
                <textarea
                  id="approval-comment-input"
                  rows={3}
                  value={comment}
                  onChange={(e) => {
                    setComment(e.target.value);
                    if (actionError) setActionError('');
                  }}
                  placeholder="Enter approval notes or mandatory reason for rejection..."
                  className="w-full rounded-lg border border-[#CBD5E1] p-2.5 text-[12.5px] text-[#0F172A] placeholder-[#94A3B8] focus:border-[#1262E0] focus:outline-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={closeApprovalRespondModal}
                disabled={Boolean(savingJobId)}
                className="px-3.5 py-1.5 rounded border border-[#CBD5E1] bg-white text-[12.5px] font-medium text-[#334155] hover:bg-[#F1F5F9] disabled:opacity-50"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={Boolean(savingJobId)}
                  onClick={() => handleApprovalDecision('Rejected')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded border border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C] text-[12.5px] font-semibold hover:bg-[#FEE2E2] disabled:opacity-50"
                >
                  {savingJobId === selectedRespondJob.id ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <XCircle size={13} />
                  )}
                  <span>Reject</span>
                </button>
                <button
                  type="button"
                  disabled={Boolean(savingJobId)}
                  onClick={() => handleApprovalDecision('Approved')}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded bg-[#1262E0] text-white text-[12.5px] font-semibold hover:bg-[#0B4BB8] disabled:opacity-50 shadow-xs"
                >
                  {savingJobId === selectedRespondJob.id ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={13} />
                  )}
                  <span>Approve</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 7. INSPECT DRAWER (for Reviews, Blueprint, Image Validations) */}
      {/* ------------------------------------------------------------- */}
      {selectedInspectJob && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-[#0F172A]/40 backdrop-blur-[1px]"
          onClick={closeInspectDrawer}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="inspect-drawer-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[600px] bg-white h-full shadow-2xl border-l border-[#DCE3EE] flex flex-col overflow-hidden"
          >
            <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1262E0] border border-[#BFDBFE]">
                    {selectedInspectJob.category}
                  </span>
                  <StatusBadge status={selectedInspectJob.status} decision={selectedInspectJob.decision} />
                </div>
                <h2 id="inspect-drawer-title" className="text-[17px] font-bold text-[#0F172A]">
                  {selectedInspectJob.recordName}
                </h2>
                <p className="text-[12px] text-[#64748B]">
                  {selectedInspectJob.processName} • {selectedInspectJob.module}
                </p>
              </div>
              <button
                type="button"
                onClick={closeInspectDrawer}
                disabled={Boolean(savingJobId)}
                aria-label="Close drawer"
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0]/60"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {/* Reviews Diff */}
              {selectedInspectJob.category === 'Reviews' && (
                <div className="space-y-3">
                  <div className="text-[13px] font-semibold text-[#0F172A]">Proposed Field Modifications</div>
                  <div className="rounded-lg border border-[#DCE3EE] overflow-hidden">
                    <table className="w-full text-left text-[12px]">
                      <thead className="bg-[#F8FAFC] border-b border-[#DCE3EE] text-[#475569] font-semibold">
                        <tr>
                          <th className="py-2 px-3">Field</th>
                          <th className="py-2 px-3">Current</th>
                          <th className="py-2 px-3">Proposed</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0]">
                        {(selectedInspectJob.fieldsToReview || []).map((f) => (
                          <tr key={f.field}>
                            <td className="py-2 px-3 font-medium text-[#1E293B]">{f.fieldLabel}</td>
                            <td className="py-2 px-3 text-[#64748B]">{f.currentValue}</td>
                            <td className="py-2 px-3 font-semibold text-[#1262E0] bg-[#EFF6FF]/40">
                              {f.proposedValue}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Blueprint Transitions */}
              {selectedInspectJob.category === 'Blueprint Transitions' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg border border-[#DCE3EE] bg-[#F8FAFC] flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-[#64748B]">Current State</div>
                      <div className="text-[13.5px] font-bold text-[#0F172A]">{selectedInspectJob.currentState}</div>
                    </div>
                    <GitBranch size={18} className="text-[#1262E0]" />
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-[#0F172A] mb-1.5">
                      Select Valid Next Transition
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(selectedInspectJob.transitions || []).map((tr) => (
                        <button
                          key={tr.id}
                          type="button"
                          onClick={() => setSelectedTransitionId(tr.id)}
                          className={`p-2.5 rounded border text-left text-[12px] ${
                            selectedTransitionId === tr.id
                              ? 'border-[#1262E0] bg-[#EFF6FF] text-[#1262E0] font-semibold'
                              : 'border-[#DCE3EE] bg-white hover:border-[#94A3B8]'
                          }`}
                        >
                          <div>{tr.name}</div>
                          <div className="text-[11px] text-[#64748B] mt-0.5">→ {tr.nextState}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Image Validations */}
              {selectedInspectJob.category === 'Image Validations' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[12.5px] font-semibold text-[#0F172A]">
                      Field: {selectedInspectJob.fieldName}
                    </span>
                    <button
                      type="button"
                      onClick={() => setImageZoomed((z) => !z)}
                      className="px-2 py-0.5 rounded border border-[#CBD5E1] text-[11.5px] font-medium"
                    >
                      {imageZoomed ? 'Reset Zoom' : 'Zoom 125%'}
                    </button>
                  </div>
                  <SubmittedImagePreview meta={selectedInspectJob.imageMeta} large zoomed={imageZoomed} />
                </div>
              )}

              {/* Reviewer Comments */}
              <div>
                <label className="block text-[12px] font-semibold text-[#0F172A] mb-1">
                  Comments / Notes
                </label>
                <textarea
                  rows={2}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add notes..."
                  className="w-full rounded border border-[#CBD5E1] p-2 text-[12px] focus:border-[#1262E0] focus:outline-none"
                />
              </div>

              {actionError && (
                <div className="text-[12px] text-[#B91C1C] bg-[#FEF2F2] p-2 rounded border border-[#FECACA]">
                  {actionError}
                </div>
              )}
            </div>

            {/* Inspect Drawer Footer */}
            <div className="px-6 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
              <button
                type="button"
                onClick={closeInspectDrawer}
                className="px-3 py-1.5 rounded border border-[#CBD5E1] bg-white text-[12.5px]"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {selectedInspectJob.category === 'Reviews' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleReviewDecision('Rejected')}
                      className="px-3 py-1.5 rounded border border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C] text-[12.5px] font-semibold"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReviewDecision('Accepted')}
                      className="px-3.5 py-1.5 rounded bg-[#1262E0] text-white text-[12.5px] font-semibold"
                    >
                      Accept Changes
                    </button>
                  </>
                )}

                {selectedInspectJob.category === 'Blueprint Transitions' && (
                  <button
                    type="button"
                    onClick={handleApplyBlueprintTransition}
                    className="px-3.5 py-1.5 rounded bg-[#1262E0] text-white text-[12.5px] font-semibold"
                  >
                    Apply Transition
                  </button>
                )}

                {selectedInspectJob.category === 'Image Validations' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleImageValidationDecision('Rejected')}
                      className="px-3 py-1.5 rounded border border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C] text-[12.5px] font-semibold"
                    >
                      Reject Image
                    </button>
                    <button
                      type="button"
                      onClick={() => handleImageValidationDecision('Accepted')}
                      className="px-3.5 py-1.5 rounded bg-[#1262E0] text-white text-[12.5px] font-semibold"
                    >
                      Accept Image
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 8. APPROVAL HISTORY MODAL                                     */}
      {/* ------------------------------------------------------------- */}
      {historyOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/40 backdrop-blur-[1px]"
          onClick={() => setHistoryOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="approval-history-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl rounded-xl border border-[#DCE3EE] bg-white shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <div className="flex items-center gap-2">
                <History size={18} className="text-[#1262E0]" />
                <div>
                  <h2 id="approval-history-title" className="text-[16px] font-bold text-[#0F172A]">
                    Approval History
                  </h2>
                  <p className="text-[12px] text-[#64748B]">
                    Audit trail of all processed approval requests, decisions, reviewers, and timestamps.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportHistoryCSV}
                  className="px-3 py-1.5 rounded border border-[#CBD5E1] bg-white text-[12px] font-medium text-[#334155] hover:bg-[#F1F5F9]"
                >
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryOpen(false)}
                  aria-label="Close Approval History"
                  className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0]/60"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Filter bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 border-b border-[#E2E8F0] bg-white text-[12px]">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type="search"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search by record, process, user or comment..."
                  className="w-full h-7 pl-7 pr-2.5 rounded border border-[#CBD5E1] text-[12px] focus:border-[#1262E0] focus:outline-none"
                />
              </div>

              <select
                value={historyCategoryFilter}
                onChange={(e) => setHistoryCategoryFilter(e.target.value)}
                className="h-7 px-2 rounded border border-[#CBD5E1] bg-white text-[12px] text-[#334155]"
              >
                <option value="All">All Categories</option>
                {MY_JOBS_TABS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* History Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full min-w-[700px] border-collapse text-left text-[12px]">
                <thead className="bg-[#F8FAFC] border-b border-[#DCE3EE] text-[#475569] font-semibold sticky top-0">
                  <tr>
                    <th className="py-2.5 px-4">Record Name</th>
                    <th className="py-2.5 px-4">Process Name</th>
                    <th className="py-2.5 px-4">Module</th>
                    <th className="py-2.5 px-4">Action</th>
                    <th className="py-2.5 px-4">Reviewer</th>
                    <th className="py-2.5 px-4">Timestamp</th>
                    <th className="py-2.5 px-4">Comments</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {filteredHistoryLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#64748B]">
                        No matching approval history entries found.
                      </td>
                    </tr>
                  ) : (
                    filteredHistoryLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#F8FAFC]">
                        <td className="py-2 px-4 font-semibold text-[#0F172A] whitespace-nowrap">
                          {log.recordName}
                        </td>
                        <td className="py-2 px-4 text-[#334155] whitespace-nowrap">{log.processName}</td>
                        <td className="py-2 px-4 text-[#334155] whitespace-nowrap">{log.module}</td>
                        <td className="py-2 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                              log.action.includes('Reject')
                                ? 'bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA]'
                                : 'bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]'
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="py-2 px-4 text-[#334155] whitespace-nowrap">{userName(log.userId)}</td>
                        <td className="py-2 px-4 text-[#475569] whitespace-nowrap">
                          {formatSubmittedOn(log.timestamp)}
                        </td>
                        <td className="py-2 px-4 text-[#334155] max-w-[200px] truncate" title={log.comment}>
                          {log.comment || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 9. HELP MODAL                                                 */}
      {/* ------------------------------------------------------------- */}
      {helpOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/40 backdrop-blur-[1px]"
          onClick={() => setHelpOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl rounded-xl border border-[#DCE3EE] bg-white shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <div className="flex items-center gap-2">
                <HelpCircle size={18} className="text-[#1262E0]" />
                <h2 id="help-modal-title" className="text-[16px] font-bold text-[#0F172A]">
                  My Jobs & Approvals Guide
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                aria-label="Close Help"
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0]/60"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-[13px] text-[#334155] overflow-y-auto">
              <div>
                <h3 className="font-bold text-[#0F172A] mb-1">What is My Jobs?</h3>
                <p>
                  My Jobs centralizes all pending CRM governance tasks into four distinct queues:
                  <strong> Approvals</strong>, <strong>Blueprint Transitions</strong>,{' '}
                  <strong>Reviews</strong>, and <strong>Image Validations</strong>.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-[#0F172A] mb-1">Approvals Workflow</h3>
                <p>
                  Approval rules trigger when critical record events occur—such as marking a deal as
                  Closed Lost before review, requesting volume discounts exceeding 15%, or extending
                  credit terms beyond standard Net-30 days.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-[#0F172A] mb-1">Mandatory Rejection Comment Policy</h3>
                <p>
                  To maintain enterprise compliance and auditability, reviewing managers must provide
                  a non-empty reason when rejecting an approval request.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-[#0F172A] mb-1">Filter By Fields</h3>
                <p>
                  Use the left filter panel to filter pending records by Approval Process Name,
                  Module, Record Owner, Requester, or Submission Date in real-time.
                </p>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-end">
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                className="px-4 py-1.5 rounded bg-[#1262E0] text-white text-[12.5px] font-semibold"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
