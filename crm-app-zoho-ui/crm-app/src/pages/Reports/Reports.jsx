import { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  BarChart3, Star, Plus, MoreHorizontal, Search, ChevronDown,
  ChevronLeft, ChevronRight, Download, Filter, Eye, RefreshCw,
  Folder, Calendar, CheckCircle2, TrendingUp, Sparkles, X,
  ArrowLeft, ArrowUp, ArrowDown, Layers, Table2, SlidersHorizontal,
  ExternalLink, PhoneCall, Users, FileSpreadsheet
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import { useCRM } from '../../context/crmContextInstance';
import { fmtINR, fmtDate, todayISO } from '../../utils/calculations';
import { exportCSV } from '../../utils/exportCSV';
import { Drawer, SectionTitle } from '../../components/common/Modal';
import { DateFilterDropdown, CallOwnerFilterDropdown } from '../Dashboard/Dashboard';
import {
  REPORT_CATALOG,
  REPORT_BY_ID,
  REPORT_BY_KEY,
  DEFAULT_FILTER_STATE,
  buildUnifiedCallRecords,
  filterRecordsForReportKey,
  matchesDateFilter,
  formatCurrencyINR,
  formatNumber,
  formatDateTimeDisplay,
  SESSION_KEY_RETURN,
} from '../Dashboard/dashboardReportUtils';

const TYPE_BADGE = {
  Standard: 'bg-blue-50 text-blue-700 border-blue-200',
  Custom: 'bg-purple-50 text-purple-700 border-purple-200'
};

const STATUS_BADGE = {
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
  Inactive: 'bg-rose-50 text-rose-700 border-rose-200'
};

// Demo analytical data for non-call report viewer
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

// Columns configuration for Zoho CRM Report Detail View (Screenshot 5)
const LEAD_REPORT_COLUMNS = [
  { key: 'callOwner', label: 'Call Owner (Calls)', width: 'min-w-[165px]', align: 'left', required: true },
  { key: 'leadName', label: 'Lead Name', width: 'min-w-[165px]', align: 'left', required: true },
  { key: 'company', label: 'Company', width: 'min-w-[155px]', align: 'left' },
  { key: 'mobile', label: 'Mobile', width: 'min-w-[130px]', align: 'left' },
  { key: 'leadSource', label: 'Lead Source', width: 'min-w-[125px]', align: 'left' },
  { key: 'leadStatus', label: 'Lead Status', width: 'min-w-[125px]', align: 'left' },
  { key: 'categories', label: 'Category', width: 'min-w-[160px]', align: 'left' },
  { key: 'subject', label: 'Subject (Calls)', width: 'min-w-[185px]', align: 'left' },
  { key: 'callType', label: 'Call Type', width: 'min-w-[105px]', align: 'left' },
  { key: 'callStatus', label: 'Outgoing Call Status', width: 'min-w-[140px]', align: 'left' },
  { key: 'callStartTime', label: 'Call Start Time', width: 'min-w-[150px]', align: 'left' },
  { key: 'createdTime', label: 'Created Time', width: 'min-w-[120px]', align: 'left' },
  { key: 'remarks', label: 'Remarks', width: 'min-w-[180px]', align: 'left' },
  { key: 'recordCount', label: 'Record Count', width: 'min-w-[115px]', align: 'right', isMetric: true },
  { key: 'durationSeconds', label: 'Sum of Call Duration (In Seconds)', width: 'min-w-[215px]', align: 'right', isMetric: true },
];

const DEAL_AND_CALL_REPORT_COLUMNS = [
  { key: 'callOwner', label: 'Call Owner (Calls)', width: 'min-w-[165px]', align: 'left', required: true },
  { key: 'subject', label: 'Subject (Calls)', width: 'min-w-[185px]', align: 'left', required: true },
  { key: 'dealName', label: 'Deal Name', width: 'min-w-[180px]', align: 'left' },
  { key: 'dealStage', label: 'Stage', width: 'min-w-[135px]', align: 'left' },
  { key: 'amount', label: 'Amount', width: 'min-w-[135px]', align: 'right' },
  { key: 'fullName', label: 'Contact Name', width: 'min-w-[155px]', align: 'left' },
  { key: 'leadName', label: 'Lead Name', width: 'min-w-[155px]', align: 'left' },
  { key: 'categories', label: 'Categories', width: 'min-w-[165px]', align: 'left' },
  { key: 'callType', label: 'Call Type', width: 'min-w-[105px]', align: 'left' },
  { key: 'callStatus', label: 'Call Status', width: 'min-w-[120px]', align: 'left' },
  { key: 'callStartTime', label: 'Call Start Time', width: 'min-w-[150px]', align: 'left' },
  { key: 'createdTime', label: 'Created Time', width: 'min-w-[120px]', align: 'left' },
  { key: 'recordCount', label: 'Record Count', width: 'min-w-[115px]', align: 'right', isMetric: true },
  { key: 'durationSeconds', label: 'Sum of Call Duration (In Seconds)', width: 'min-w-[215px]', align: 'right', isMetric: true },
];

function resolveReportDefinition(reportId, reportsList = [], locationState = null) {
  if (!reportId) return null;

  // 1. Check REPORT_BY_ID or REPORT_BY_KEY from Dashboard catalog
  const catalogMatch =
    REPORT_BY_ID[reportId] ||
    REPORT_BY_KEY[reportId] ||
    (locationState?.reportKey ? REPORT_BY_KEY[locationState.reportKey] : null);

  // 2. Check CRMContext reports list
  const dbReport = reportsList.find(
    (r) =>
      r.id === reportId ||
      (r.reportKey && r.reportKey === reportId) ||
      (catalogMatch && (r.id === catalogMatch.reportId || r.name === catalogMatch.reportName))
  );

  if (catalogMatch) {
    return {
      id: catalogMatch.reportId,
      name: locationState?.reportName || dbReport?.name || catalogMatch.reportName,
      title: catalogMatch.title,
      reportKey: catalogMatch.reportKey,
      module: dbReport?.module || catalogMatch.sourceModule || 'Calls',
      folder: dbReport?.folder || (catalogMatch.reportKey === 'leads_calls' ? 'Lead Reports' : 'Call & Deal Reports'),
      type: dbReport?.type || 'Standard',
      status: dbReport?.status || 'Active',
      starred: Boolean(dbReport?.starred ?? true),
      createdBy: dbReport?.createdBy || 'Sibi Chakaravarthi',
      lastAccessed: dbReport?.lastAccessed || fmtDate(todayISO()),
      description: dbReport?.description || catalogMatch.description,
      isCallReport: true,
    };
  }

  if (dbReport) {
    // Check if name matches one of the 7 call reports
    const byName = REPORT_CATALOG.find(
      (c) =>
        c.reportName.toLowerCase() === (dbReport.name || '').toLowerCase() ||
        c.title.toLowerCase() === (dbReport.name || '').toLowerCase()
    );
    if (byName || dbReport.reportKey) {
      const cat = byName || REPORT_BY_KEY[dbReport.reportKey] || REPORT_CATALOG[0];
      return {
        ...dbReport,
        reportKey: dbReport.reportKey || cat.reportKey,
        isCallReport: true,
      };
    }
    return {
      ...dbReport,
      reportKey: 'overall_all',
      isCallReport: ['Calls', 'Leads', 'Activities', 'Deals', 'Contacts'].includes(dbReport.module),
    };
  }

  // Fallback to Lead Call Report if unknown id
  const fallback = REPORT_BY_ID['rep-lead-call-report'] || REPORT_CATALOG[3];
  return {
    id: reportId,
    name: locationState?.reportName || fallback.reportName,
    title: fallback.title,
    reportKey: locationState?.reportKey || fallback.reportKey,
    module: fallback.sourceModule,
    folder: 'Lead Reports',
    type: 'Standard',
    status: 'Active',
    starred: true,
    createdBy: 'Sibi Chakaravarthi',
    lastAccessed: fmtDate(todayISO()),
    description: fallback.description,
    isCallReport: true,
  };
}

// ============================================================================
// ZOHO CRM REPORT DETAIL VIEW (Screenshot 5 & 6)
// ============================================================================
function ZohoReportDetailView({ reportId }) {
  const navigate = useNavigate();
  const location = useLocation();
  const crm = useCRM();
  const {
    reports = [],
    calls = [],
    leads = [],
    deals = [],
    oldDeals = [],
    contacts = [],
    users = [],
    userName,
    contactName,
    toggleFavoriteReport,
    notify,
  } = crm;

  const activeReport = useMemo(
    () => resolveReportDefinition(reportId, reports, location.state),
    [reportId, reports, location.state]
  );

  // Initialize filters from Dashboard navigation state if provided
  const [filters, setFilters] = useState(() => {
    if (location.state?.appliedFilters) {
      return JSON.parse(JSON.stringify(location.state.appliedFilters));
    }
    return JSON.parse(JSON.stringify(DEFAULT_FILTER_STATE));
  });

  const [callStatusFilter, setCallStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' | 'summary' | 'tabular'
  const [collapsedOwners, setCollapsedOwners] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: 'recordCount', direction: 'desc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [reportPickerOpen, setReportPickerOpen] = useState(false);
  const [reportSearch, setReportSearch] = useState('');
  const [colPickerOpen, setColPickerOpen] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  const isLeadReport =
    activeReport?.reportKey === 'leads_calls' ||
    (activeReport?.name || '').toLowerCase().includes('lead');

  const availableColumns = isLeadReport ? LEAD_REPORT_COLUMNS : DEAL_AND_CALL_REPORT_COLUMNS;

  const [visibleColKeys, setVisibleColKeys] = useState(() =>
    availableColumns.map((c) => c.key)
  );

  useEffect(() => {
    setVisibleColKeys(( isLeadReport ? LEAD_REPORT_COLUMNS : DEAL_AND_CALL_REPORT_COLUMNS ).map((c) => c.key));
    setPage(1);
  }, [activeReport?.id, isLeadReport]);

  const visibleColumns = useMemo(
    () => availableColumns.filter((c) => visibleColKeys.includes(c.key)),
    [availableColumns, visibleColKeys]
  );

  // Build unified records from real CRM data
  const allUnifiedRecords = useMemo(() => {
    void refreshTick;
    return buildUnifiedCallRecords({
      calls,
      leads,
      deals,
      oldDeals,
      contacts,
      userName,
      contactName,
    });
  }, [calls, leads, deals, oldDeals, contacts, userName, contactName, refreshTick]);

  // Filter records for this report + active filters
  const filteredRecords = useMemo(() => {
    const today = todayISO();
    const base = filterRecordsForReportKey(allUnifiedRecords, activeReport?.reportKey || 'overall_all');

    return base.filter((rec) => {
      if (filters.callOwnerIds?.length > 0 && !filters.callOwnerIds.includes(rec.ownerId)) {
        return false;
      }
      if (!matchesDateFilter(rec.callStartTime, filters.callStartTime, today)) {
        return false;
      }
      if (!matchesDateFilter(rec.createdTime, filters.createdTime, today)) {
        return false;
      }
      if (callStatusFilter !== 'All' && rec.callStatus !== callStatusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const hay = [
          rec.callOwner,
          rec.leadName,
          rec.company,
          rec.mobile,
          rec.leadSource,
          rec.leadStatus,
          rec.dealName,
          rec.dealStage,
          rec.fullName,
          rec.categories,
          rec.subject,
          rec.callType,
          rec.callStatus,
          rec.remarks,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allUnifiedRecords, activeReport?.reportKey, filters, callStatusFilter, searchQuery]);

  // Group by Call Owner (Screenshot 5 structure)
  const ownerGroups = useMemo(() => {
    const map = new Map();
    filteredRecords.forEach((rec) => {
      const key = rec.ownerId || rec.callOwner;
      if (!map.has(key)) {
        map.set(key, {
          ownerId: rec.ownerId,
          callOwner: rec.callOwner,
          recordCount: 0,
          durationSeconds: 0,
          totalAmount: 0,
          records: [],
        });
      }
      const g = map.get(key);
      g.recordCount += 1;
      g.durationSeconds += Number(rec.durationSeconds) || 0;
      g.totalAmount += Number(rec.amount) || 0;
      g.records.push(rec);
    });

    const list = Array.from(map.values());
    const dir = sortConfig.direction === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      if (sortConfig.key === 'callOwner') {
        return a.callOwner.localeCompare(b.callOwner) * dir;
      }
      if (sortConfig.key === 'durationSeconds') {
        return (a.durationSeconds - b.durationSeconds) * dir;
      }
      if (sortConfig.key === 'amount') {
        return (a.totalAmount - b.totalAmount) * dir;
      }
      return (a.recordCount - b.recordCount) * dir;
    });

    return list;
  }, [filteredRecords, sortConfig]);

  const grandTotals = useMemo(() => {
    return ownerGroups.reduce(
      (acc, g) => {
        acc.recordCount += g.recordCount;
        acc.durationSeconds += g.durationSeconds;
        acc.totalAmount += g.totalAmount;
        return acc;
      },
      { recordCount: 0, durationSeconds: 0, totalAmount: 0 }
    );
  }, [ownerGroups]);

  // Pagination for flat records
  const totalRecords = filteredRecords.length;
  const startIdx = totalRecords === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIdx = Math.min(page * pageSize, totalRecords);
  const paginatedRecords = useMemo(
    () => filteredRecords.slice((page - 1) * pageSize, page * pageSize),
    [filteredRecords, page, pageSize]
  );

  // Back handler returning to Dashboard if came from Dashboard
  const handleBack = () => {
    if (location.state?.from === '/dashboard') {
      navigate('/dashboard', {
        state: {
          restoreDashboardId: location.state.dashboardId,
        },
      });
      return;
    }
    try {
      const saved = sessionStorage.getItem(SESSION_KEY_RETURN);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.activeDashboardId) {
          navigate('/dashboard', {
            state: { restoreDashboardId: parsed.activeDashboardId },
          });
          return;
        }
      }
    } catch {
      // ignore
    }
    navigate('/reports');
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const toggleOwnerCollapse = (ownerId) => {
    setCollapsedOwners((prev) => ({
      ...prev,
      [ownerId]: !prev[ownerId],
    }));
  };

  const expandAllGroups = () => setCollapsedOwners({});
  const collapseAllGroups = () => {
    const next = {};
    ownerGroups.forEach((g) => {
      next[g.ownerId] = true;
    });
    setCollapsedOwners(next);
  };

  const handleExportReportCSV = () => {
    const rows = filteredRecords.map((r) =>
      isLeadReport
        ? {
            'Call Owner (Calls)': r.callOwner,
            'Lead Name': r.leadName,
            Company: r.company,
            Mobile: r.mobile,
            'Lead Source': r.leadSource,
            'Lead Status': r.leadStatus,
            Category: r.categories,
            'Subject (Calls)': r.subject,
            'Call Type': r.callType,
            'Outgoing Call Status': r.callStatus,
            'Call Start Time': formatDateTimeDisplay(r.callStartTime),
            'Created Time': formatDateTimeDisplay(r.createdTime),
            Remarks: r.remarks,
            'Record Count': 1,
            'Sum of Call Duration (In Seconds)': r.durationSeconds,
          }
        : {
            'Call Owner (Calls)': r.callOwner,
            'Subject (Calls)': r.subject,
            'Deal Name': r.dealName,
            Stage: r.dealStage,
            Amount: r.amount,
            'Contact Name': r.fullName,
            'Lead Name': r.leadName,
            Categories: r.categories,
            'Call Type': r.callType,
            'Call Status': r.callStatus,
            'Call Start Time': formatDateTimeDisplay(r.callStartTime),
            'Created Time': formatDateTimeDisplay(r.createdTime),
            'Record Count': 1,
            'Sum of Call Duration (In Seconds)': r.durationSeconds,
          }
    );
    rows.push(
      isLeadReport
        ? {
            'Call Owner (Calls)': 'Grand Total',
            'Lead Name': '',
            Company: '',
            Mobile: '',
            'Lead Source': '',
            'Lead Status': '',
            Category: '',
            'Subject (Calls)': '',
            'Call Type': '',
            'Outgoing Call Status': '',
            'Call Start Time': '',
            'Created Time': '',
            Remarks: '',
            'Record Count': grandTotals.recordCount,
            'Sum of Call Duration (In Seconds)': grandTotals.durationSeconds,
          }
        : {
            'Call Owner (Calls)': 'Grand Total',
            'Subject (Calls)': '',
            'Deal Name': '',
            Stage: '',
            Amount: grandTotals.totalAmount,
            'Contact Name': '',
            'Lead Name': '',
            Categories: '',
            'Call Type': '',
            'Call Status': '',
            'Call Start Time': '',
            'Created Time': '',
            'Record Count': grandTotals.recordCount,
            'Sum of Call Duration (In Seconds)': grandTotals.durationSeconds,
          }
    );
    exportCSV(`${(activeReport?.name || 'Report').replace(/\s+/g, '_')}.csv`, rows);
    if (notify) notify(`Exported "${activeReport?.name}" to CSV`, 'success');
  };

  const toggleColumnKey = (key) => {
    const col = availableColumns.find((c) => c.key === key);
    if (col?.required) return;
    setVisibleColKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Combine catalog + custom reports for switcher dropdown
  const allSwitchableReports = useMemo(() => {
    const map = new Map();
    REPORT_CATALOG.forEach((c) => {
      map.set(c.reportId, {
        id: c.reportId,
        name: c.reportName,
        folder: c.reportKey === 'leads_calls' ? 'Lead Reports' : 'Call & Deal Reports',
        module: c.sourceModule,
        reportKey: c.reportKey,
      });
    });
    reports.forEach((r) => {
      if (!map.has(r.id)) {
        map.set(r.id, {
          id: r.id,
          name: r.name,
          folder: r.folder || 'Reports',
          module: r.module || 'Calls',
          reportKey: r.reportKey || 'overall_all',
        });
      }
    });
    const list = Array.from(map.values());
    if (!reportSearch.trim()) return list;
    const q = reportSearch.trim().toLowerCase();
    return list.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.folder.toLowerCase().includes(q) ||
        r.module.toLowerCase().includes(q)
    );
  }, [reports, reportSearch]);

  const renderRecordCell = (rec, colKey) => {
    switch (colKey) {
      case 'callOwner':
        return <span className="font-medium text-[#1E293B]">{rec.callOwner}</span>;
      case 'leadName':
        return (
          <button
            type="button"
            onClick={() => navigate(`/leads/${rec.leadId}`)}
            className="text-[#2563EB] hover:underline font-medium text-left"
          >
            {rec.leadName}
          </button>
        );
      case 'company':
        return <span className="text-[#334155]">{rec.company}</span>;
      case 'mobile':
        return <span className="text-[#334155] font-mono text-[11.5px]">{rec.mobile}</span>;
      case 'leadSource':
        return <span className="text-[#334155]">{rec.leadSource}</span>;
      case 'leadStatus':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
            {rec.leadStatus}
          </span>
        );
      case 'categories':
        return <span className="text-[#334155]">{rec.categories}</span>;
      case 'subject':
        return (
          <button
            type="button"
            onClick={() => navigate(`/calls/${rec.callId}`)}
            className="text-[#2563EB] hover:underline font-medium text-left"
          >
            {rec.subject}
          </button>
        );
      case 'dealName':
        return (
          <button
            type="button"
            onClick={() => navigate(`/deals/${rec.dealId}`)}
            className="text-[#2563EB] hover:underline font-medium text-left"
          >
            {rec.dealName}
          </button>
        );
      case 'dealStage':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0]">
            {rec.dealStage}
          </span>
        );
      case 'amount':
        return <span className="tabular-nums font-medium text-[#0F172A]">{formatCurrencyINR(rec.amount)}</span>;
      case 'fullName':
        return (
          <button
            type="button"
            onClick={() => navigate(`/contacts/${rec.contactId}`)}
            className="text-[#2563EB] hover:underline text-left"
          >
            {rec.fullName}
          </button>
        );
      case 'callType':
        return <span className="text-[#475569]">{rec.callType}</span>;
      case 'callStatus':
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
              rec.callStatus === 'Completed'
                ? 'bg-[#ECFDF5] text-[#047857]'
                : rec.callStatus === 'Scheduled'
                ? 'bg-[#EFF6FF] text-[#1D4ED8]'
                : 'bg-[#FEF2F2] text-[#B91C1C]'
            }`}
          >
            {rec.callStatus}
          </span>
        );
      case 'callStartTime':
        return <span className="text-[#475569] whitespace-nowrap">{formatDateTimeDisplay(rec.callStartTime)}</span>;
      case 'createdTime':
        return <span className="text-[#475569] whitespace-nowrap">{formatDateTimeDisplay(rec.createdTime)}</span>;
      case 'remarks':
        return <span className="text-[#475569] truncate max-w-[220px] block" title={rec.remarks}>{rec.remarks}</span>;
      case 'recordCount':
        return <span className="tabular-nums font-semibold text-[#1E293B]">1</span>;
      case 'durationSeconds':
        return <span className="tabular-nums font-semibold text-[#1E293B]">{formatNumber(rec.durationSeconds)}</span>;
      default:
        return <span className="text-[#475569]">{rec[colKey] ?? '—'}</span>;
    }
  };

  return (
    <div
      className="-m-4 lg:-m-6 min-h-[calc(100vh-56px)] bg-[#F3F5F9] text-[#1E293B] flex flex-col"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif' }}
    >
      {/* =================================================================== */}
      {/* TOP BAR — ZOHO CRM REPORT HEADER (Screenshot 5)                     */}
      {/* =================================================================== */}
      <div className="bg-white border-b border-[#E2E8F0] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 h-[32px] px-2.5 rounded-[4px] border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[12.5px] font-medium text-[#334155] transition"
            title={
              location.state?.from === '/dashboard'
                ? `Back to ${location.state?.dashboardName || 'Dashboard'}`
                : 'Back to Reports'
            }
          >
            <ArrowLeft size={14} className="text-[#475569]" />
            <span>
              {location.state?.from === '/dashboard' ? 'Back to Dashboard' : 'Back'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => toggleFavoriteReport && toggleFavoriteReport(activeReport.id)}
            className="w-[30px] h-[30px] inline-flex items-center justify-center rounded-[4px] hover:bg-[#F1F5F9] transition"
            title="Toggle Favorite Report"
          >
            <Star
              size={16}
              className={
                activeReport.starred
                  ? 'fill-[#F59E0B] text-[#F59E0B]'
                  : 'text-[#94A3B8] hover:text-[#64748B]'
              }
            />
          </button>

          {/* Report Switcher Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setReportPickerOpen((o) => !o)}
              className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[4px] hover:bg-[#F8FAFC] border border-transparent hover:border-[#E2E8F0] transition"
            >
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-semibold text-[#0F172A] leading-tight">
                    {activeReport.name}
                  </span>
                  <ChevronDown size={14} className="text-[#64748B]" />
                </div>
                <div className="text-[11px] text-[#64748B] flex items-center gap-1.5">
                  <span>{activeReport.folder}</span>
                  <span>•</span>
                  <span>Module: {activeReport.module}</span>
                  {location.state?.dashboardName && (
                    <>
                      <span>•</span>
                      <span className="text-[#2563EB] font-medium">
                        Linked to {location.state.dashboardName}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </button>

            {reportPickerOpen && (
              <div className="absolute left-0 top-[46px] z-50 w-[340px] bg-white border border-[#CBD5E1] rounded-[6px] shadow-[0_10px_28px_rgba(15,23,42,0.16)] overflow-hidden">
                <div className="p-2 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  <div className="relative">
                    <Search size={13.5} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
                    <input
                      type="text"
                      value={reportSearch}
                      onChange={(e) => setReportSearch(e.target.value)}
                      placeholder="Search reports..."
                      autoFocus
                      className="w-full h-[30px] pl-8 pr-3 bg-white border border-[#CBD5E1] rounded-[4px] text-[12.5px] focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>
                </div>
                <div className="max-h-[280px] overflow-y-auto py-1 divide-y divide-[#F1F5F9]">
                  {allSwitchableReports.map((rep) => {
                    const isCurrent = rep.id === activeReport.id || rep.name === activeReport.name;
                    return (
                      <button
                        key={rep.id}
                        type="button"
                        onClick={() => {
                          setReportPickerOpen(false);
                          navigate(`/reports/${rep.id}`, {
                            state: {
                              ...location.state,
                              reportKey: rep.reportKey,
                              reportName: rep.name,
                            },
                          });
                        }}
                        className={`w-full px-3 py-2 text-left flex items-center justify-between text-[12.5px] transition ${
                          isCurrent
                            ? 'bg-[#EFF6FF] text-[#1D4ED8] font-semibold'
                            : 'text-[#1E293B] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        <div>
                          <div className="truncate">{rep.name}</div>
                          <div className="text-[11px] text-[#64748B] font-normal">
                            {rep.folder} • {rep.module}
                          </div>
                        </div>
                        {isCurrent && <CheckCircle2 size={14} className="text-[#2563EB] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                <div className="px-3 py-2 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setReportPickerOpen(false);
                      navigate('/reports');
                    }}
                    className="text-[12px] font-medium text-[#2563EB] hover:underline"
                  >
                    View All Reports
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReportPickerOpen(false);
                      navigate('/dashboard');
                    }}
                    className="text-[12px] font-medium text-[#475569] hover:text-[#0F172A]"
                  >
                    Go to Dashboards
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Toolbar Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Switcher */}
          <div className="inline-flex items-center bg-[#F1F5F9] p-0.5 rounded-[5px] border border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => setViewMode('grouped')}
              className={`px-2.5 py-1 rounded-[4px] text-[11.5px] font-medium transition ${
                viewMode === 'grouped'
                  ? 'bg-white text-[#1D4ED8] shadow-xs'
                  : 'text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              Grouped View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('summary')}
              className={`px-2.5 py-1 rounded-[4px] text-[11.5px] font-medium transition ${
                viewMode === 'summary'
                  ? 'bg-white text-[#1D4ED8] shadow-xs'
                  : 'text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              Summary Table
            </button>
            <button
              type="button"
              onClick={() => setViewMode('tabular')}
              className={`px-2.5 py-1 rounded-[4px] text-[11.5px] font-medium transition ${
                viewMode === 'tabular'
                  ? 'bg-white text-[#1D4ED8] shadow-xs'
                  : 'text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              Tabular Rows
            </button>
          </div>

          {/* Column Customizer */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setColPickerOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 h-[30px] px-2.5 rounded-[4px] border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[12px] font-medium text-[#334155]"
            >
              <SlidersHorizontal size={13} />
              <span>Columns ({visibleColumns.length})</span>
            </button>
            {colPickerOpen && (
              <div className="absolute right-0 top-[34px] z-50 w-[250px] bg-white border border-[#CBD5E1] rounded-[6px] shadow-xl py-2">
                <div className="px-3 pb-1.5 mb-1 border-b border-[#F1F5F9] flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#64748B] uppercase">
                    Report Columns
                  </span>
                  <button
                    type="button"
                    onClick={() => setVisibleColKeys(availableColumns.map((c) => c.key))}
                    className="text-[11px] text-[#2563EB] hover:underline"
                  >
                    Show All
                  </button>
                </div>
                <div className="max-h-[260px] overflow-y-auto px-2 space-y-0.5">
                  {availableColumns.map((col) => (
                    <label
                      key={col.key}
                      className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[#F8FAFC] text-[12px] text-[#1E293B] cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={visibleColKeys.includes(col.key)}
                        disabled={col.required}
                        onChange={() => toggleColumnKey(col.key)}
                        className="rounded border-[#CBD5E1] text-[#2563EB]"
                      />
                      <span className="truncate">{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setRefreshTick((t) => t + 1);
              if (notify) notify(`Refreshed "${activeReport.name}"`, 'info');
            }}
            className="w-[30px] h-[30px] inline-flex items-center justify-center rounded-[4px] border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#475569]"
            title="Refresh Report"
          >
            <RefreshCw size={13.5} />
          </button>

          <button
            type="button"
            onClick={handleExportReportCSV}
            className="inline-flex items-center gap-1.5 h-[30px] px-3 rounded-[4px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[12px] font-medium shadow-xs transition"
          >
            <Download size={13} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* SECOND ROW — ZOHO CRM REPORT FILTERS & SUMMARY STRIP                */}
      {/* =================================================================== */}
      <div className="bg-white border-b border-[#E2E8F0] px-4 py-2 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1 text-[12px] font-medium text-[#64748B] mr-1">
            <Filter size={13} className="text-[#64748B]" />
            <span>Filters:</span>
          </div>

          <CallOwnerFilterDropdown
            users={users}
            selectedIds={filters.callOwnerIds || []}
            onChange={(ownerIds) => {
              setFilters((prev) => ({ ...prev, callOwnerIds: ownerIds }));
              setPage(1);
            }}
          />

          <DateFilterDropdown
            label="Call Start Time (Calls)"
            value={filters.callStartTime}
            onChange={(nextDateCfg) => {
              setFilters((prev) => ({ ...prev, callStartTime: nextDateCfg }));
              setPage(1);
            }}
          />

          <DateFilterDropdown
            label="Created Time (Calls)"
            value={filters.createdTime}
            onChange={(nextDateCfg) => {
              setFilters((prev) => ({ ...prev, createdTime: nextDateCfg }));
              setPage(1);
            }}
          />

          <select
            value={callStatusFilter}
            onChange={(e) => {
              setCallStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-[30px] px-2.5 rounded-[4px] border border-[#CBD5E1] bg-white text-[12.5px] text-[#334155] focus:outline-none focus:border-[#2563EB]"
          >
            <option value="All">Call Status : All</option>
            <option value="Completed">Completed</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Missed">Missed</option>
            <option value="No Answer">No Answer</option>
            <option value="Busy">Busy</option>
          </select>

          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search owner, lead, deal, mobile..."
              className="h-[30px] pl-8 pr-7 w-[220px] rounded-[4px] border border-[#CBD5E1] bg-white text-[12.5px] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569]"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {(filters.callOwnerIds?.length > 0 ||
            filters.callStartTime?.mode !== 'Any Time' ||
            filters.createdTime?.mode !== 'Any Time' ||
            callStatusFilter !== 'All' ||
            searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setFilters(JSON.parse(JSON.stringify(DEFAULT_FILTER_STATE)));
                setCallStatusFilter('All');
                setSearchQuery('');
                setPage(1);
              }}
              className="h-[30px] px-2.5 text-[12px] font-medium text-[#DC2626] hover:bg-[#FEF2F2] rounded-[4px] transition"
            >
              Clear Filter
            </button>
          )}
        </div>

        {/* Right side group controls & Total Count */}
        <div className="flex items-center gap-3 text-[12px] text-[#475569]">
          {viewMode === 'grouped' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={expandAllGroups}
                className="text-[#2563EB] hover:underline font-medium"
              >
                Expand All
              </button>
              <span className="text-[#CBD5E1]">|</span>
              <button
                type="button"
                onClick={collapseAllGroups}
                className="text-[#2563EB] hover:underline font-medium"
              >
                Collapse All
              </button>
            </div>
          )}
          <span className="font-semibold text-[#0F172A] bg-[#F1F5F9] px-2.5 py-1 rounded border border-[#E2E8F0]">
            Total Records: {formatNumber(grandTotals.recordCount)}
          </span>
        </div>
      </div>

      {/* =================================================================== */}
      {/* SUMMARY KPI BAR                                                     */}
      {/* =================================================================== */}
      <div className="px-4 pt-3 pb-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-[#E2E8F0] rounded-[6px] px-3.5 py-2.5 flex items-center justify-between shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div>
            <div className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider">
              Record Count
            </div>
            <div className="text-[18px] font-bold text-[#0F172A] tabular-nums mt-0.5">
              {formatNumber(grandTotals.recordCount)}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
            <PhoneCall size={16} />
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-[6px] px-3.5 py-2.5 flex items-center justify-between shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div>
            <div className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider">
              Sum of Call Duration (In Seconds)
            </div>
            <div className="text-[18px] font-bold text-[#0F172A] tabular-nums mt-0.5">
              {formatNumber(grandTotals.durationSeconds)}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] text-[#059669] flex items-center justify-center">
            <TrendingUp size={16} />
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-[6px] px-3.5 py-2.5 flex items-center justify-between shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div>
            <div className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider">
              Call Owners (Users)
            </div>
            <div className="text-[18px] font-bold text-[#0F172A] tabular-nums mt-0.5">
              {formatNumber(ownerGroups.length)}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center">
            <Users size={16} />
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-[6px] px-3.5 py-2.5 flex items-center justify-between shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div>
            <div className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider">
              {isLeadReport ? 'Avg Call Duration (Sec)' : 'Total Pipeline Amount'}
            </div>
            <div className="text-[18px] font-bold text-[#0F172A] tabular-nums mt-0.5">
              {isLeadReport
                ? formatNumber(
                    grandTotals.recordCount > 0
                      ? Math.round(grandTotals.durationSeconds / grandTotals.recordCount)
                      : 0
                  )
                : formatCurrencyINR(grandTotals.totalAmount)}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-[#FFFBEB] text-[#D97706] flex items-center justify-center">
            <FileSpreadsheet size={16} />
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* REPORT TABLE WITH FIXED STICKY HEADER & FIXED STICKY TOTAL ROW      */}
      {/* =================================================================== */}
      <div className="p-4 flex-1 flex flex-col min-h-0">
        <div className="bg-white border border-[#E2E8F0] rounded-[6px] shadow-[0_1px_3px_rgba(15,23,42,0.04)] flex-1 flex flex-col overflow-hidden">
          {viewMode === 'summary' ? (
            /* SUMMARY TABLE (Exact 3-column Zoho CRM Call Owner summary) */
            <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-285px)] relative">
              <table className="w-full border-separate border-spacing-0 text-left text-[12.5px]">
                <thead className="sticky top-0 z-20 bg-[#F8FAFC]">
                  <tr className="text-[#475569] font-semibold">
                    <th
                      onClick={() => handleSort('callOwner')}
                      className="h-[38px] px-4 border-b border-r border-[#E2E8F0] bg-[#F8FAFC] cursor-pointer hover:bg-[#F1F5F9] select-none"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span>Call Owner (Calls)</span>
                        {sortConfig.key === 'callOwner' &&
                          (sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('recordCount')}
                      className="h-[38px] px-4 border-b border-r border-[#E2E8F0] bg-[#F8FAFC] text-right cursor-pointer hover:bg-[#F1F5F9] select-none"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Record Count</span>
                        {sortConfig.key === 'recordCount' &&
                          (sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('durationSeconds')}
                      className="h-[38px] px-4 border-b border-[#E2E8F0] bg-[#F8FAFC] text-right cursor-pointer hover:bg-[#F1F5F9] select-none"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Sum of Call Duration (In Seconds)</span>
                        {sortConfig.key === 'durationSeconds' &&
                          (sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ownerGroups.map((g) => (
                    <tr
                      key={g.ownerId}
                      onClick={() => {
                        setFilters((prev) => ({ ...prev, callOwnerIds: [g.ownerId] }));
                        setViewMode('grouped');
                      }}
                      className="hover:bg-[#F1F5F9]/75 cursor-pointer transition"
                    >
                      <td className="h-[36px] px-4 border-b border-r border-[#EEF2F6] font-medium text-[#2563EB] hover:underline">
                        {g.callOwner}
                      </td>
                      <td className="h-[36px] px-4 border-b border-r border-[#EEF2F6] text-right font-semibold text-[#2563EB] tabular-nums">
                        {formatNumber(g.recordCount)}
                      </td>
                      <td className="h-[36px] px-4 border-b border-[#EEF2F6] text-right font-medium text-[#1E293B] tabular-nums">
                        {formatNumber(g.durationSeconds)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="sticky bottom-0 z-20 bg-[#F8FAFC]">
                  <tr className="font-bold text-[#0F172A] shadow-[0_-1px_3px_rgba(15,23,42,0.06)]">
                    <td className="h-[38px] px-4 bg-[#F8FAFC] border-t-2 border-r border-[#CBD5E1]">
                      Total
                    </td>
                    <td className="h-[38px] px-4 bg-[#F8FAFC] border-t-2 border-r border-[#CBD5E1] text-right tabular-nums">
                      {formatNumber(grandTotals.recordCount)}
                    </td>
                    <td className="h-[38px] px-4 bg-[#F8FAFC] border-t-2 border-[#CBD5E1] text-right tabular-nums">
                      {formatNumber(grandTotals.durationSeconds)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : viewMode === 'grouped' ? (
            /* GROUPED REPORT TABLE BY CALL OWNER (Screenshot 5 Default) */
            <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-285px)] relative">
              <table className="w-full border-separate border-spacing-0 text-left text-[12px]">
                <thead className="sticky top-0 z-20 bg-[#F8FAFC]">
                  <tr className="text-[#475569] font-semibold">
                    {visibleColumns.map((col, idx) => (
                      <th
                        key={col.key}
                        onClick={() =>
                          ['callOwner', 'recordCount', 'durationSeconds', 'amount'].includes(col.key) &&
                          handleSort(col.key)
                        }
                        className={`h-[38px] px-3.5 border-b border-[#CBD5E1] bg-[#F8FAFC] whitespace-nowrap ${
                          idx < visibleColumns.length - 1 ? 'border-r border-[#E2E8F0]' : ''
                        } ${col.width || ''} ${
                          col.align === 'right' ? 'text-right' : 'text-left'
                        } ${
                          ['callOwner', 'recordCount', 'durationSeconds', 'amount'].includes(col.key)
                            ? 'cursor-pointer hover:bg-[#F1F5F9]'
                            : ''
                        }`}
                      >
                        <div
                          className={`flex items-center gap-1 ${
                            col.align === 'right' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <span>{col.label}</span>
                          {sortConfig.key === col.key &&
                            (sortConfig.direction === 'asc' ? (
                              <ArrowUp size={11.5} className="text-[#2563EB]" />
                            ) : (
                              <ArrowDown size={11.5} className="text-[#2563EB]" />
                            ))}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {ownerGroups.length === 0 ? (
                    <tr>
                      <td
                        colSpan={visibleColumns.length}
                        className="py-12 text-center text-[13px] text-[#64748B]"
                      >
                        No matching records found for the selected filters.
                      </td>
                    </tr>
                  ) : (
                    ownerGroups.map((group) => {
                      const isCollapsed = Boolean(collapsedOwners[group.ownerId]);
                      return (
                        <FragmentGroup
                          key={group.ownerId}
                          group={group}
                          isCollapsed={isCollapsed}
                          onToggle={() => toggleOwnerCollapse(group.ownerId)}
                          visibleColumns={visibleColumns}
                          renderRecordCell={renderRecordCell}
                        />
                      );
                    })
                  )}
                </tbody>

                {/* FIXED STICKY GRAND TOTAL FOOTER */}
                <tfoot className="sticky bottom-0 z-20 bg-[#F8FAFC]">
                  <tr className="font-bold text-[#0F172A] shadow-[0_-1px_3px_rgba(15,23,42,0.06)]">
                    {visibleColumns.map((col, idx) => {
                      const borderR = idx < visibleColumns.length - 1 ? 'border-r border-[#CBD5E1]' : '';
                      if (idx === 0) {
                        return (
                          <td
                            key={col.key}
                            className={`h-[38px] px-3.5 bg-[#F8FAFC] border-t-2 border-[#CBD5E1] ${borderR} whitespace-nowrap`}
                          >
                            Grand Total ({formatNumber(grandTotals.recordCount)} Records)
                          </td>
                        );
                      }
                      if (col.key === 'recordCount') {
                        return (
                          <td
                            key={col.key}
                            className={`h-[38px] px-3.5 bg-[#F8FAFC] border-t-2 border-[#CBD5E1] ${borderR} text-right tabular-nums text-[#1D4ED8]`}
                          >
                            {formatNumber(grandTotals.recordCount)}
                          </td>
                        );
                      }
                      if (col.key === 'durationSeconds') {
                        return (
                          <td
                            key={col.key}
                            className={`h-[38px] px-3.5 bg-[#F8FAFC] border-t-2 border-[#CBD5E1] ${borderR} text-right tabular-nums text-[#0F172A]`}
                          >
                            {formatNumber(grandTotals.durationSeconds)}
                          </td>
                        );
                      }
                      if (col.key === 'amount') {
                        return (
                          <td
                            key={col.key}
                            className={`h-[38px] px-3.5 bg-[#F8FAFC] border-t-2 border-[#CBD5E1] ${borderR} text-right tabular-nums text-[#0F172A]`}
                          >
                            {formatCurrencyINR(grandTotals.totalAmount)}
                          </td>
                        );
                      }
                      return (
                        <td
                          key={col.key}
                          className={`h-[38px] px-3.5 bg-[#F8FAFC] border-t-2 border-[#CBD5E1] ${borderR}`}
                        />
                      );
                    })}
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            /* TABULAR FLAT ROWS VIEW */
            <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)] relative">
              <table className="w-full border-separate border-spacing-0 text-left text-[12px]">
                <thead className="sticky top-0 z-20 bg-[#F8FAFC]">
                  <tr className="text-[#475569] font-semibold">
                    {visibleColumns.map((col, idx) => (
                      <th
                        key={col.key}
                        className={`h-[38px] px-3.5 border-b border-[#CBD5E1] bg-[#F8FAFC] whitespace-nowrap ${
                          idx < visibleColumns.length - 1 ? 'border-r border-[#E2E8F0]' : ''
                        } ${col.width || ''} ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-[#F8FAFC] transition">
                      {visibleColumns.map((col, idx) => (
                        <td
                          key={col.key}
                          className={`h-[34px] px-3.5 border-b border-[#EEF2F6] ${
                            idx < visibleColumns.length - 1 ? 'border-r border-[#F1F5F9]' : ''
                          } ${col.align === 'right' ? 'text-right' : 'text-left'} whitespace-nowrap`}
                        >
                          {renderRecordCell(rec, col.key)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                <tfoot className="sticky bottom-0 z-20 bg-[#F8FAFC]">
                  <tr className="font-bold text-[#0F172A] shadow-[0_-1px_3px_rgba(15,23,42,0.06)]">
                    {visibleColumns.map((col, idx) => {
                      const borderR = idx < visibleColumns.length - 1 ? 'border-r border-[#CBD5E1]' : '';
                      if (idx === 0) {
                        return (
                          <td
                            key={col.key}
                            className={`h-[38px] px-3.5 bg-[#F8FAFC] border-t-2 border-[#CBD5E1] ${borderR}`}
                          >
                            Grand Total
                          </td>
                        );
                      }
                      if (col.key === 'recordCount') {
                        return (
                          <td
                            key={col.key}
                            className={`h-[38px] px-3.5 bg-[#F8FAFC] border-t-2 border-[#CBD5E1] ${borderR} text-right tabular-nums`}
                          >
                            {formatNumber(grandTotals.recordCount)}
                          </td>
                        );
                      }
                      if (col.key === 'durationSeconds') {
                        return (
                          <td
                            key={col.key}
                            className={`h-[38px] px-3.5 bg-[#F8FAFC] border-t-2 border-[#CBD5E1] ${borderR} text-right tabular-nums`}
                          >
                            {formatNumber(grandTotals.durationSeconds)}
                          </td>
                        );
                      }
                      if (col.key === 'amount') {
                        return (
                          <td
                            key={col.key}
                            className={`h-[38px] px-3.5 bg-[#F8FAFC] border-t-2 border-[#CBD5E1] ${borderR} text-right tabular-nums`}
                          >
                            {formatCurrencyINR(grandTotals.totalAmount)}
                          </td>
                        );
                      }
                      return (
                        <td
                          key={col.key}
                          className={`h-[38px] px-3.5 bg-[#F8FAFC] border-t-2 border-[#CBD5E1] ${borderR}`}
                        />
                      );
                    })}
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Pagination Footer for Tabular Mode */}
          {viewMode === 'tabular' && (
            <div className="px-4 py-2 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between text-[12px] text-[#475569]">
              <div>
                Showing <span className="font-semibold text-[#0F172A]">{startIdx}</span> –{' '}
                <span className="font-semibold text-[#0F172A]">{endIdx}</span> of{' '}
                <span className="font-semibold text-[#0F172A]">{formatNumber(totalRecords)}</span> records
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="h-[28px] px-2 border border-[#CBD5E1] rounded bg-white text-[12px]"
                >
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                  <option value={100}>100 / page</option>
                </select>
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1 rounded border border-[#CBD5E1] bg-white disabled:opacity-40"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="px-2 font-medium text-[#0F172A]">Page {page}</span>
                <button
                  type="button"
                  disabled={endIdx >= totalRecords}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-1 rounded border border-[#CBD5E1] bg-white disabled:opacity-40"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FragmentGroup({ group, isCollapsed, onToggle, visibleColumns, renderRecordCell }) {
  return (
    <>
      {/* Call Owner Group Header Row */}
      <tr
        onClick={onToggle}
        className="bg-[#F1F5F9]/90 hover:bg-[#E2E8F0]/70 cursor-pointer transition select-none"
      >
        {visibleColumns.map((col, idx) => {
          const borderR = idx < visibleColumns.length - 1 ? 'border-r border-[#E2E8F0]' : '';
          if (idx === 0) {
            return (
              <td
                key={col.key}
                className={`h-[34px] px-3.5 border-b border-[#CBD5E1] ${borderR} font-semibold text-[#0F172A] whitespace-nowrap`}
              >
                <div className="flex items-center gap-2">
                  {isCollapsed ? (
                    <ChevronRight size={14} className="text-[#475569] shrink-0" />
                  ) : (
                    <ChevronDown size={14} className="text-[#475569] shrink-0" />
                  )}
                  <span className="text-[#1D4ED8]">{group.callOwner}</span>
                  <span className="px-1.5 py-0.5 text-[11px] font-semibold rounded bg-white text-[#334155] border border-[#CBD5E1]">
                    {group.recordCount}
                  </span>
                </div>
              </td>
            );
          }
          if (col.key === 'recordCount') {
            return (
              <td
                key={col.key}
                className={`h-[34px] px-3.5 border-b border-[#CBD5E1] ${borderR} text-right font-bold text-[#1D4ED8] tabular-nums`}
              >
                {formatNumber(group.recordCount)}
              </td>
            );
          }
          if (col.key === 'durationSeconds') {
            return (
              <td
                key={col.key}
                className={`h-[34px] px-3.5 border-b border-[#CBD5E1] ${borderR} text-right font-bold text-[#0F172A] tabular-nums`}
              >
                {formatNumber(group.durationSeconds)}
              </td>
            );
          }
          if (col.key === 'amount') {
            return (
              <td
                key={col.key}
                className={`h-[34px] px-3.5 border-b border-[#CBD5E1] ${borderR} text-right font-semibold text-[#0F172A] tabular-nums`}
              >
                {formatCurrencyINR(group.totalAmount)}
              </td>
            );
          }
          return (
            <td
              key={col.key}
              className={`h-[34px] px-3.5 border-b border-[#CBD5E1] ${borderR} text-[11px] text-[#64748B]`}
            />
          );
        })}
      </tr>

      {/* Individual Records under Call Owner */}
      {!isCollapsed &&
        group.records.map((rec) => (
          <tr key={rec.id} className="hover:bg-[#F8FAFC] transition">
            {visibleColumns.map((col, idx) => (
              <td
                key={col.key}
                className={`h-[33px] px-3.5 border-b border-[#EEF2F6] ${
                  idx < visibleColumns.length - 1 ? 'border-r border-[#F1F5F9]' : ''
                } ${col.align === 'right' ? 'text-right' : 'text-left'} ${
                  idx === 0 ? 'pl-8' : ''
                } whitespace-nowrap`}
              >
                {renderRecordCell(rec, col.key)}
              </td>
            ))}
          </tr>
        ))}
    </>
  );
}

// ============================================================================
// MAIN REPORTS COMPONENT (List View + Detail View Router)
// ============================================================================
export default function Reports() {
  const { id: routeReportId } = useParams();
  const navigate = useNavigate();
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

  // If navigated to /reports/:id, render the Zoho CRM Report Detail View (Screenshot 5)
  if (routeReportId) {
    return <ZohoReportDetailView reportId={routeReportId} />;
  }

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
              <option value="Calls">Calls</option>
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
              <option value="Sibi Chakaravarthi">Sibi Chakaravarthi</option>
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
                        onClick={() =>
                          navigate(`/reports/${rep.id}`, {
                            state: { from: '/reports', reportKey: rep.reportKey, reportName: rep.name },
                          })
                        }
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
                          onClick={() =>
                            navigate(`/reports/${rep.id}`, {
                              state: { from: '/reports', reportKey: rep.reportKey, reportName: rep.name },
                            })
                          }
                          className="p-1 text-slate-400 hover:text-[#2F7BF5] rounded"
                          title="Open Report"
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
                          onClick={() => setViewingReport(rep)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded"
                          title="Quick Chart Preview"
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
                    <option value="Calls">Calls</option>
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
                    <option value="Call & Deal Reports">Call & Deal Reports</option>
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
