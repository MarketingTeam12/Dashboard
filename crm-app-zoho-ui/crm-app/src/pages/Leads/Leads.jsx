import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronDown, ChevronLeft, ChevronRight, Filter, LayoutGrid, List, MoreHorizontal, Phone, Search, Table2,
  ArrowDownUp, X, Columns3, Clock3, Map as MapIcon, Plus, Trash2, Edit3, Download, Bookmark, Check, ArrowLeft,
  Pin, Copy, Lock, Settings2, Upload, Sliders,
} from 'lucide-react';
import { useCRM } from '../../context/crmContextInstance';
import { todayISO } from '../../utils/calculations';
import { useResizableDimension, useUrlActions } from '../../components/common/hooks';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { ResizeDivider } from '../../components/common/ResizablePanel';
import { LEAD_SOURCES, LEAD_STATUSES, LEAD_TAGS } from '../../data/seedData';
import ZohoCustomizationModal from './ZohoCustomizationModal';
import { ALL_LEADS_COLUMNS, getAllConfiguredColumns, useZohoCustomization } from './zohoCustomizationConfig';
import LeadsImportExportModal from './LeadsImportExportModal';
import {
  CAMPAIGN_TYPES,
  CURRENT_USER_ID,
  FIELD_FILTERS,
  NO_VALUE_DATE_OPERATORS,
  OPERATORS_BY_TYPE,
  PUBLIC_VIEWS,
  RELATED_MODULE_FILTERS,
  SYSTEM_FILTERS,
  SYSTEM_FILTER_CONFIG,
  USER_GROUPS,
  USER_ROLES,
  VIEW_TABS,
  countActiveFilters,
  evaluateLeadAgainstFilters,
  evaluateLeadInView,
  getRelatedRecordsForLead,
  getViewCriteriaSummary,
  leadCategory,
  leadSource,
} from './leadFilters';

const TAG_STYLE = {
  'Already Job Completed': { bg: '#0D9488', fg: '#fff' },
  'Asking Very Low Rate': { bg: '#D97706', fg: '#fff' },
  'Block List': { bg: '#991B1B', fg: '#fff' },
  'Complicated': { bg: '#7C3AED', fg: '#fff' },
  'Deal Done': { bg: '#16A34A', fg: '#fff' },
  'Duplicate': { bg: '#DC2626', fg: '#fff' },
  'Foreign Number': { bg: '#0284C7', fg: '#fff' },
  'Future Requirements': { bg: '#2563EB', fg: '#fff' },
  'Insufficient Contact Det': { bg: '#CA8A04', fg: '#fff' },
  'Invaild Number': { bg: '#9333EA', fg: '#fff' },
  'Job seeking': { bg: '#4F46E5', fg: '#fff' },
  'Junk': { bg: '#E11D48', fg: '#fff' },
  'Not contactable': { bg: '#BE185D', fg: '#fff' },
  'Offline Service': { bg: '#0891B2', fg: '#fff' },
  'Service Not Provided': { bg: '#64748B', fg: '#fff' },
  'followup': { bg: '#059669', fg: '#fff' },
  'swich off': { bg: '#EA580C', fg: '#fff' },
  // Historical record fallback styles (preserved safely for existing customer records)
  'swich offival': { bg: '#EA580C', fg: '#fff' },
  'tag': { bg: '#3B82F6', fg: '#fff' },
  'Invalid Number': { bg: '#9333EA', fg: '#fff' },
  'Hot Lead': { bg: '#64748B', fg: '#fff' },
  Hot: { bg: '#64748B', fg: '#fff' },
  Lead: { bg: '#64748B', fg: '#fff' },
};
const STATUS_STYLE = {
  Assigned: { bg: '#1DB54A', fg: '#fff' },
  New: { bg: '#2F7BF5', fg: '#fff' },
  Contacted: { bg: '#1DB54A', fg: '#fff' },
  Followup: { bg: '#0EA5E9', fg: '#fff' },
  Qualified: { bg: '#F59E0B', fg: '#fff' },
  Proposal: { bg: '#F43F5E', fg: '#fff' },
  Converted: { bg: '#8E3CF2', fg: '#fff' },
  'Lost Lead': { bg: '#64748B', fg: '#fff' },
  Lost: { bg: '#64748B', fg: '#fff' },
  'Not Contacted': { bg: '#94A3B8', fg: '#fff' },
};
const SOURCE_STYLE = {
  Justdial: { bg: '#4AA8F0', fg: '#fff', label: 'JD' },
  Website: { bg: '#A9B8F5', fg: '#1E293B' },
  Indiamart: { bg: '#0EA5E9', fg: '#fff' },
  'Email Marketing': { bg: '#EC4899', fg: '#fff' },
  'Existing Client': { bg: '#7A2BD6', fg: '#fff' },
  'Database call': { bg: '#BFE04A', fg: '#2B3A00' },
};

const PROTECTED_PUBLIC_VIEWS = new Set(PUBLIC_VIEWS);

function Pill({ s, children }) {
  const style = s || { bg: '#E2E8F0', fg: '#1E293B' };
  return (
    <span className="inline-flex items-center h-[23px] px-2.5 rounded-full text-[12.5px] font-semibold whitespace-nowrap" style={{ background: style.bg, color: style.fg }}>
      {children}
    </span>
  );
}
function TagPill({ tag }) {
  if (!tag || tag === 'Lead') return null;
  const s = TAG_STYLE[tag] || { bg: '#3B82F6', fg: '#fff' };
  return (
    <span className="inline-flex items-center h-[22px] px-2.5 text-[12.5px] font-semibold whitespace-nowrap" style={{ background: s.bg, color: s.fg, clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%)', paddingRight: 12 }}>
      {tag}
    </span>
  );
}

function Section({ title, defaultOpen = true, badge = null, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#EEF1F7] last:border-b-0 pb-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-1.5 px-3.5 py-2.5 text-[15px] font-semibold text-ink text-left hover:bg-[#F8FAFC] transition-colors"
      >
        <span className="flex items-center gap-1.5 truncate -ml-0.5">
          <ChevronDown size={15} className={`shrink-0 text-ink-500 transition-transform ${open ? 'rotate-0' : '-rotate-90'}`} />
          <span className="truncate">{title}</span>
        </span>
        {badge !== null && badge > 0 && (
          <span className="text-[12px] bg-[#2F55D4] text-white rounded-full px-2 py-0.5 font-semibold">{badge}</span>
        )}
      </button>
      {open && <div className="pb-1">{children}</div>}
    </div>
  );
}

const cbRow = 'flex items-center gap-2.5 pl-6 pr-3.5 py-1.5 text-[14px] text-ink-600 hover:bg-[#F8FAFC] cursor-pointer leading-snug';

const EMPTY_FILTERS = {
  system: {},
  fields: {},
  related: {},
  quickPreset: '',
  logicMode: 'AND',
};

export default function Leads() {
  const crm = useCRM();
  const {
    leads = [],
    users = [],
    accounts = [],
    contacts = [],
    deals = [],
    userName,
    leadsUiState,
    updateLeadsUiState,
    createRecord,
    updateRecord,
    deleteRecords,
    notify,
  } = crm;

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Resizable Filter Sidebar persisted in localStorage
  const {
    size: sidebarWidth,
    isDragging: isResizingSidebar,
    startResize: startResizeSidebar,
    resetSize: resetSidebarWidth,
  } = useResizableDimension('layout.leadsSidebarWidth', 248, 195, 440);

  // Persisted UI state from CRMContext
  const tab = leadsUiState?.tab || 'My Leads';
  const pinnedTabs = leadsUiState?.pinnedTabs?.length ? leadsUiState.pinnedTabs : VIEW_TABS;
  const viewsDisplayMode = leadsUiState?.viewsDisplayMode || 'tabs';
  const search = leadsUiState?.search || '';
  const sortField = leadsUiState?.sortField || 'createdOn';
  const sortDir = leadsUiState?.sortDir || 'desc';
  const page = leadsUiState?.page || 1;
  const pageSize = leadsUiState?.pageSize || 30;
  const viewMode = leadsUiState?.viewMode || 'list';
  const appliedFilters = leadsUiState?.appliedFilters || EMPTY_FILTERS;
  const customViews = leadsUiState?.customViews || [];
  const viewOverrides = leadsUiState?.viewOverrides || {};
  const savedFilters = leadsUiState?.savedFilters || [];

  // Local filter draft state
  const [draftFilters, setDraftFilters] = useState(() => structuredClone(appliedFilters));
  const [panelSearch, setPanelSearch] = useState(leadsUiState?.panelSearch || '');
  const [expandedSys, setExpandedSys] = useState(null);
  const [expandedField, setExpandedField] = useState(null);
  const [expandedRel, setExpandedRel] = useState(null);
  const [showFilterPanel, setShowFilterPanel] = useState(true);
  const [selected, setSelected] = useState(new Set());

  // Top Navigation & Custom Views Popover States
  const [activeTabMenuFor, setActiveTabMenuFor] = useState(null); // viewName when clicking ▼ beside tab
  const [publicViewsDropdownOpen, setPublicViewsDropdownOpen] = useState(false); // ⋯ after Delhi
  const [publicViewSearch, setPublicViewSearch] = useState('');
  const [itemSubmenuFor, setItemSubmenuFor] = useState(null); // viewName inside ⋯ dropdown
  const navBarRef = useRef(null);

  // Custom View Create / Edit / Clone / Manage Modals
  const [viewEditorModal, setViewEditorModal] = useState(null); // { mode: 'create'|'edit'|'clone', originalName, name, field, operator, value, visibility, pin }
  const [manageViewsModalOpen, setManageViewsModalOpen] = useState(false);
  const [manageViewsSearch, setManageViewsSearch] = useState('');
  const [deletingViewName, setDeletingViewName] = useState(null);

  // Other Popovers & Modals
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [inlineCell, setInlineCell] = useState(null); // { leadId, field }
  const [editingLead, setEditingLead] = useState(null);
  const [deletingIds, setDeletingIds] = useState(null);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [saveFilterModalOpen, setSaveFilterModalOpen] = useState(false);
  const [newSavedFilterName, setNewSavedFilterName] = useState('');
  const [callLeadModal, setCallLeadModal] = useState(null);
  const [callNote, setCallNote] = useState('');
  const [importExportModal, setImportExportModal] = useState({ open: false, mode: 'import' });
  const [customizeModal, setCustomizeModal] = useState({ open: false, tab: 'columns' });

  // Dynamic Zoho Customization (Columns, Order, Widths, Custom Statuses/Sources/Tags/Fields)
  const { config: zohoCustomConfig, updateConfig: updateZohoCustomConfig } = useZohoCustomization();

  const visibleColumns = useMemo(() => {
    const allCols = getAllConfiguredColumns(zohoCustomConfig);
    const order = zohoCustomConfig.columnOrder || allCols.map((c) => c.key);
    const visSet = new Set(zohoCustomConfig.visibleColumnKeys || allCols.filter((c) => c.defaultVisible).map((c) => c.key));
    const ordered = order.map((k) => allCols.find((c) => c.key === k)).filter(Boolean);
    allCols.forEach((c) => {
      if (!ordered.some((o) => o.key === c.key)) ordered.push(c);
    });
    const active = ordered.filter((c) => visSet.has(c.key));
    return active.length ? active : allCols.filter((c) => c.defaultVisible);
  }, [zohoCustomConfig]);

  const handleStartColumnResize = (e, colKey, fallbackWidth = 150) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startW = zohoCustomConfig.columnWidths?.[colKey] || fallbackWidth;

    const onMove = (moveEv) => {
      const nextW = Math.max(90, Math.min(480, startW + (moveEv.clientX - startX)));
      updateZohoCustomConfig((prev) => ({
        ...prev,
        columnWidths: { ...(prev.columnWidths || {}), [colKey]: nextW },
      }));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Close top-bar popovers when clicking outside
  useEffect(() => {
    const handleDocClick = (e) => {
      if (navBarRef.current && !navBarRef.current.contains(e.target)) {
        setActiveTabMenuFor(null);
        setPublicViewsDropdownOpen(false);
        setItemSubmenuFor(null);
      }
    };
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, []);

  // Sync draftFilters when appliedFilters is updated via URL / WorkQueue
  useEffect(() => {
    setDraftFilters(structuredClone(appliedFilters));
  }, [appliedFilters]);

  // Handle URL parameters and location.state from WorkQueue or global links
  useEffect(() => {
    const urlView = searchParams.get('view');
    const urlFilter = searchParams.get('filter');
    const urlOpen = searchParams.get('open');
    const stateFilter = location.state?.workqueueFilter;
    const stateView = location.state?.workqueueView;

    if (urlOpen) {
      navigate(`/leads/${urlOpen}`, { replace: true, state: location.state });
      return;
    }

    if (urlFilter === 'assigned_last_3_hours' || stateFilter === 'assigned_last_3_hours') {
      const nextApplied = {
        system: {},
        fields: {
          'Lead Assigned time': { enabled: true, operator: 'Last 3 Hours', value: 'Last 3 Hours' },
        },
        related: {},
        quickPreset: 'assigned_last_3_hours',
        logicMode: 'AND',
      };
      updateLeadsUiState({
        tab: 'All Leads',
        page: 1,
        appliedFilters: nextApplied,
      });
      setDraftFilters(structuredClone(nextApplied));
      setExpandedField('Lead Assigned time');
      if (urlFilter) setSearchParams({}, { replace: true });
      return;
    }

    if (urlView === 'My Leads' || stateView === 'My Leads' || urlFilter === 'my_leads') {
      const nextApplied = {
        system: {},
        fields: {},
        related: {},
        quickPreset: '',
        logicMode: 'AND',
      };
      updateLeadsUiState({
        tab: 'My Leads',
        page: 1,
        appliedFilters: nextApplied,
      });
      setDraftFilters(structuredClone(nextApplied));
      if (urlView || urlFilter) setSearchParams({}, { replace: true });
    }
  }, [searchParams, location.state, navigate, setSearchParams, updateLeadsUiState]);

  useUrlActions({ onOpen: (id) => navigate(`/leads/${id}`) });

  const setTab = (nextTab) => {
    setActiveTabMenuFor(null);
    setPublicViewsDropdownOpen(false);
    setItemSubmenuFor(null);
    const custom = customViews.find((cv) => cv.name === nextTab);
    if (custom?.preset === 'assigned_last_3_hours') {
      const nextApplied = {
        ...EMPTY_FILTERS,
        quickPreset: 'assigned_last_3_hours',
        fields: { 'Lead Assigned time': { enabled: true, operator: 'Last 3 Hours', value: 'Last 3 Hours' } },
      };
      updateLeadsUiState({ tab: nextTab, page: 1, appliedFilters: nextApplied });
      setDraftFilters(structuredClone(nextApplied));
    } else if (appliedFilters.quickPreset === 'assigned_last_3_hours') {
      updateLeadsUiState({ tab: nextTab, page: 1, appliedFilters: EMPTY_FILTERS });
      setDraftFilters(structuredClone(EMPTY_FILTERS));
    } else {
      updateLeadsUiState({ tab: nextTab, page: 1 });
    }
  };

  // Top bar tabs: always show pinnedTabs in order; if current active `tab` is selected from Public Views and not in pinnedTabs, show it right before `⋯`
  const visibleTopTabs = useMemo(() => {
    const base = [...pinnedTabs];
    if (tab && !base.includes(tab)) {
      base.push(tab);
    }
    return base;
  }, [pinnedTabs, tab]);

  // All views for the ⋯ Public Views dropdown
  const allPublicAndCustomViews = useMemo(() => {
    const list = [...PUBLIC_VIEWS];
    customViews.forEach((cv) => {
      if (!list.includes(cv.name)) list.push(cv.name);
    });
    return list;
  }, [customViews]);

  const filteredPublicViews = useMemo(() => {
    const sq = publicViewSearch.trim().toLowerCase();
    if (!sq) return PUBLIC_VIEWS;
    return PUBLIC_VIEWS.filter((v) => v.toLowerCase().includes(sq));
  }, [publicViewSearch]);

  const filteredCustomViews = useMemo(() => {
    const sq = publicViewSearch.trim().toLowerCase();
    return customViews.filter((cv) => !PUBLIC_VIEWS.includes(cv.name) && (!sq || cv.name.toLowerCase().includes(sq)));
  }, [customViews, publicViewSearch]);

  // View Actions: Edit, Pin/Unpin, Clone, Close View, Delete View
  const handleOpenViewEditor = (mode, targetViewName = tab) => {
    setActiveTabMenuFor(null);
    setPublicViewsDropdownOpen(false);
    setItemSubmenuFor(null);
    if (mode === 'create') {
      setViewEditorModal({
        mode: 'create',
        originalName: '',
        name: '',
        field: 'City',
        operator: 'is',
        value: 'Chennai',
        visibility: 'Public',
        pin: true,
      });
      return;
    }
    const summary = getViewCriteriaSummary(targetViewName, customViews, viewOverrides);
    setViewEditorModal({
      mode,
      originalName: targetViewName,
      name: mode === 'clone' ? `${targetViewName} (Copy)` : targetViewName,
      field: summary.field || 'City',
      operator: summary.operator || 'is',
      value: summary.value ?? '',
      visibility: summary.visibility || 'Public',
      pin: pinnedTabs.includes(targetViewName),
    });
  };

  const handleSaveViewEditor = () => {
    if (!viewEditorModal || !viewEditorModal.name.trim()) return;
    const trimmedName = viewEditorModal.name.trim();
    const { mode, originalName, field, operator, value, visibility, pin } = viewEditorModal;

    if (mode === 'create' || mode === 'clone') {
      const newCv = {
        id: `cv-${Date.now()}`,
        name: trimmedName,
        field,
        operator,
        value,
        visibility,
        createdBy: 'Karthik S',
      };
      const nextCustomViews = [...customViews.filter((c) => c.name !== trimmedName), newCv];
      const nextPinned = pin && !pinnedTabs.includes(trimmedName) ? [...pinnedTabs, trimmedName] : pinnedTabs;
      updateLeadsUiState({
        customViews: nextCustomViews,
        pinnedTabs: nextPinned,
        tab: trimmedName,
        page: 1,
      });
      notify(`${mode === 'clone' ? 'Cloned' : 'Created'} view "${trimmedName}"`, 'success');
    } else if (mode === 'edit') {
      const isBuiltIn = PROTECTED_PUBLIC_VIEWS.has(originalName);
      if (isBuiltIn) {
        const nextOverrides = {
          ...viewOverrides,
          [originalName]: { field, operator, value, visibility },
        };
        const nextPinned = pin
          ? (pinnedTabs.includes(originalName) ? pinnedTabs : [...pinnedTabs, originalName])
          : pinnedTabs.filter((t) => t !== originalName);
        updateLeadsUiState({
          viewOverrides: nextOverrides,
          pinnedTabs: nextPinned.length ? nextPinned : VIEW_TABS,
          tab: originalName,
          page: 1,
        });
        notify(`Updated filter criteria for "${originalName}"`, 'success');
      } else {
        const nextCustomViews = customViews.map((cv) =>
          cv.name === originalName ? { ...cv, name: trimmedName, field, operator, value, visibility } : cv
        );
        let nextPinned = pinnedTabs.map((t) => (t === originalName ? trimmedName : t));
        if (pin && !nextPinned.includes(trimmedName)) nextPinned.push(trimmedName);
        if (!pin) nextPinned = nextPinned.filter((t) => t !== trimmedName);
        updateLeadsUiState({
          customViews: nextCustomViews,
          pinnedTabs: nextPinned.length ? nextPinned : VIEW_TABS,
          tab: trimmedName,
          page: 1,
        });
        notify(`Updated custom view "${trimmedName}"`, 'success');
      }
    }
    setViewEditorModal(null);
  };

  const handleTogglePinView = (targetViewName) => {
    setActiveTabMenuFor(null);
    setItemSubmenuFor(null);
    const isPinned = pinnedTabs.includes(targetViewName);
    let nextPinned;
    if (isPinned) {
      if (pinnedTabs.length <= 1) {
        notify('At least one view must remain pinned in the top bar', 'info');
        return;
      }
      nextPinned = pinnedTabs.filter((t) => t !== targetViewName);
      notify(`Unpinned "${targetViewName}" from top navigation`, 'info');
    } else {
      nextPinned = [...pinnedTabs, targetViewName];
      notify(`Pinned "${targetViewName}" to top navigation`, 'success');
    }
    updateLeadsUiState({ pinnedTabs: nextPinned });
  };

  const handleCloseViewTab = (targetViewName) => {
    setActiveTabMenuFor(null);
    const nextPinned = pinnedTabs.filter((t) => t !== targetViewName);
    const fallbackTab = nextPinned[0] || 'All Leads';
    updateLeadsUiState({
      pinnedTabs: nextPinned.length ? nextPinned : ['All Leads'],
      tab: tab === targetViewName ? fallbackTab : tab,
      page: 1,
    });
    notify(`Closed view "${targetViewName}"`, 'info');
  };

  const handleRequestDeleteView = (targetViewName) => {
    setActiveTabMenuFor(null);
    setItemSubmenuFor(null);
    if (PROTECTED_PUBLIC_VIEWS.has(targetViewName)) {
      notify(`"${targetViewName}" is a protected Public View and cannot be deleted.`, 'error');
      return;
    }
    setDeletingViewName(targetViewName);
  };

  const handleConfirmDeleteView = () => {
    if (!deletingViewName) return;
    const nextCustomViews = customViews.filter((cv) => cv.name !== deletingViewName);
    const nextPinned = pinnedTabs.filter((t) => t !== deletingViewName);
    const nextTab = tab === deletingViewName ? (nextPinned[0] || 'All Leads') : tab;
    updateLeadsUiState({
      customViews: nextCustomViews,
      pinnedTabs: nextPinned.length ? nextPinned : VIEW_TABS,
      tab: nextTab,
      page: 1,
    });
    notify(`Deleted custom view "${deletingViewName}"`, 'info');
    setDeletingViewName(null);
  };

  const setSearch = (val) => updateLeadsUiState({ search: val, page: 1 });
  const setPage = (p) => updateLeadsUiState({ page: p });
  const setPageSize = (ps) => updateLeadsUiState({ pageSize: ps, page: 1 });
  const setViewMode = (vm) => updateLeadsUiState({ viewMode: vm });

  // 1) Filter by active View Tab (all 53 Public Views + Custom Views)
  const byTab = useMemo(
    () => leads.filter((l) => evaluateLeadInView(l, tab, customViews, viewOverrides, userName)),
    [leads, tab, customViews, viewOverrides, userName]
  );

  // 2) Evaluate Applied Filters + Search + Sort
  const filtered = useMemo(() => {
    let rows = byTab.filter((l) => {
      if (!evaluateLeadAgainstFilters(l, appliedFilters, crm)) return false;
      if (search) {
        const q = search.toLowerCase();
        if (![l.name, l.leadNo, l.mobile, l.phone, l.email, l.city, l.remarks, l.company, l.status, l.tag, leadCategory(l), leadSource(l), userName(l.ownerId)].some((v) => String(v || '').toLowerCase().includes(q))) {
          return false;
        }
      }
      return true;
    });

    rows = [...rows].sort((a, b) => {
      let va = '';
      let vb = '';
      if (sortField === 'name') { va = a.name || ''; vb = b.name || ''; }
      else if (sortField === 'city') { va = a.city || ''; vb = b.city || ''; }
      else if (sortField === 'status') { va = a.status || ''; vb = b.status || ''; }
      else if (sortField === 'owner') { va = userName(a.ownerId) || ''; vb = userName(b.ownerId) || ''; }
      else if (sortField === 'modifiedTime') { va = a.updatedAt || a.createdOn || ''; vb = b.updatedAt || b.createdOn || ''; }
      else { va = `${a.createdOn || ''} ${a.createdTime || ''}`; vb = `${b.createdOn || ''} ${b.createdTime || ''}`; }
      return sortDir === 'desc' ? String(vb).localeCompare(String(va)) : String(va).localeCompare(String(vb));
    });

    return rows;
  }, [byTab, appliedFilters, search, sortField, sortDir, crm, userName]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const cur = Math.min(page, pageCount);
  const rows = filtered.slice((cur - 1) * pageSize, cur * pageSize);
  const from = filtered.length ? (cur - 1) * pageSize + 1 : 0;
  const to = Math.min(cur * pageSize, filtered.length);

  // Filter Draft Helpers
  const updateSysDraft = (name, patch) => {
    setDraftFilters((prev) => {
      const def = SYSTEM_FILTER_CONFIG[name] || {};
      const defaultOp = def.type === 'checkbox' ? 'checked' : def.type === 'date' ? 'On' : 'is';
      const existing = prev.system?.[name] || { enabled: true, operator: defaultOp, value: '', unit: 'days' };
      return {
        ...prev,
        system: { ...prev.system, [name]: { ...existing, ...patch } },
      };
    });
  };

  const toggleSysDraft = (name) => {
    setDraftFilters((prev) => {
      const curCfg = prev.system?.[name];
      const nextEnabled = !curCfg?.enabled;
      const def = SYSTEM_FILTER_CONFIG[name] || {};
      const defaultOp = def.type === 'checkbox' ? 'checked' : def.type === 'date' ? 'On' : 'is';
      return {
        ...prev,
        system: {
          ...prev.system,
          [name]: {
            enabled: nextEnabled,
            operator: curCfg?.operator || defaultOp,
            value: curCfg?.value ?? '',
            valueTo: curCfg?.valueTo ?? '',
            unit: curCfg?.unit || 'days',
            campaignType: curCfg?.campaignType || '-Select Campaign Type-',
            campaignStatus: curCfg?.campaignStatus || 'All Statuses',
            activityMode: curCfg?.activityMode || 'All Activities',
          },
        },
      };
    });
    setExpandedSys((prev) => (prev === name ? prev : name));
  };

  const updateFieldDraft = (label, patch) => {
    setDraftFilters((prev) => {
      const fDef = FIELD_FILTERS.find((f) => f.label === label);
      const defaultOp = fDef?.type === 'checkbox' ? 'checked' : fDef?.type === 'date' ? 'On' : 'is';
      const existing = prev.fields?.[label] || { enabled: true, operator: defaultOp, value: '', values: [], unit: 'days' };
      return {
        ...prev,
        fields: { ...prev.fields, [label]: { ...existing, ...patch } },
      };
    });
  };

  const toggleFieldDraft = (label) => {
    const fDef = FIELD_FILTERS.find((f) => f.label === label);
    const defaultOp = fDef?.type === 'checkbox' ? 'checked' : fDef?.type === 'date' ? 'On' : 'is';
    setDraftFilters((prev) => {
      const curCfg = prev.fields?.[label];
      const nextEnabled = !curCfg?.enabled;
      return {
        ...prev,
        fields: {
          ...prev.fields,
          [label]: {
            enabled: nextEnabled,
            operator: curCfg?.operator || defaultOp,
            value: curCfg?.value ?? '',
            valueTo: curCfg?.valueTo ?? '',
            unit: curCfg?.unit || 'days',
            values: curCfg?.values || [],
          },
        },
      };
    });
    setExpandedField((prev) => (prev === label ? prev : label));
  };

  const toggleFieldValueCheckbox = (label, val) => {
    setDraftFilters((prev) => {
      const fDef = FIELD_FILTERS.find((f) => f.label === label);
      const defaultOp = fDef?.type === 'checkbox' ? 'checked' : 'is';
      const curCfg = prev.fields?.[label] || { enabled: true, operator: defaultOp, value: '', values: [] };
      const set = new Set(curCfg.values || []);
      if (set.has(val)) set.delete(val);
      else set.add(val);
      const nextValues = [...set];
      return {
        ...prev,
        fields: {
          ...prev.fields,
          [label]: {
            ...curCfg,
            enabled: nextValues.length > 0 || Boolean(curCfg.value),
            values: nextValues,
          },
        },
      };
    });
  };

  const updateRelDraft = (relLabel, patch) => {
    setDraftFilters((prev) => {
      const existing = prev.related?.[relLabel] || { enabled: true, operator: 'contains', value: '', campaignType: '-Select Campaign Type-' };
      return {
        ...prev,
        related: { ...prev.related, [relLabel]: { ...existing, ...patch } },
      };
    });
  };

  const toggleRelDraft = (relLabel) => {
    setDraftFilters((prev) => {
      const curCfg = prev.related?.[relLabel];
      const nextEnabled = !curCfg?.enabled;
      return {
        ...prev,
        related: {
          ...prev.related,
          [relLabel]: {
            enabled: nextEnabled,
            operator: curCfg?.operator || 'is not empty',
            value: curCfg?.value ?? '',
            campaignType: curCfg?.campaignType || '-Select Campaign Type-',
          },
        },
      };
    });
    setExpandedRel((prev) => (prev === relLabel ? prev : relLabel));
  };

  const handleApplyFilters = () => {
    const nextApplied = { ...structuredClone(draftFilters), logicMode: 'AND' };
    updateLeadsUiState({ appliedFilters: nextApplied, page: 1 });
  };

  const handleClearFilters = () => {
    const clean = structuredClone(EMPTY_FILTERS);
    setDraftFilters(clean);
    updateLeadsUiState({ appliedFilters: clean, page: 1 });
  };

  const activeAppliedCount = countActiveFilters(appliedFilters);
  const activeDraftCount = countActiveFilters(draftFilters);
  const sysActiveCount = Object.values(draftFilters.system || {}).filter((v) => v?.enabled).length;
  const fieldActiveCount = Object.values(draftFilters.fields || {}).filter((v) => v?.enabled).length;
  const relActiveCount = Object.values(draftFilters.related || {}).filter((v) => v?.enabled).length;

  const q = panelSearch.trim().toLowerCase();
  const match = (t) => !q || t.toLowerCase().includes(q);

  const allChecked = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const toggleRowSelect = (id) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  // Bulk Actions
  const handleBulkUpdate = (patch, label) => {
    const ids = [...selected];
    ids.forEach((id) => updateRecord('leads', id, patch));
    setSelected(new Set());
    notify(`Updated ${label} for ${ids.length} lead(s)`, 'success');
  };

  const handleConfirmDelete = () => {
    if (!deletingIds?.length) return;
    deleteRecords('leads', deletingIds);
    setSelected((prev) => {
      const n = new Set(prev);
      deletingIds.forEach((id) => n.delete(id));
      return n;
    });
    notify(`Deleted ${deletingIds.length} lead(s)`, 'info');
    setDeletingIds(null);
  };

  const handleSaveEditLead = () => {
    if (!editingLead) return;
    updateRecord('leads', editingLead.id, {
      ...editingLead,
      phone: editingLead.mobile || editingLead.phone,
      leadSource: editingLead.source,
    });
    setEditingLead(null);
    notify('Lead updated successfully', 'success');
  };

  const handleExportCsv = () => {
    const headers = ['Lead No', 'Lead Name', 'Company', 'Created Time', 'Category', 'Mobile', 'Email', 'City', 'Remarks', 'Tag', 'Lead Status', 'Lead Source', 'Lead Owner'];
    const csvRows = [
      headers.join(','),
      ...filtered.map((l) => [
        l.leadNo || l.id,
        `"${(l.name || '').replace(/"/g, '""')}"`,
        `"${(l.company || '').replace(/"/g, '""')}"`,
        `"${l.createdTime || l.createdOn || ''}"`,
        `"${leadCategory(l)}"`,
        `"${l.mobile || l.phone || ''}"`,
        `"${l.email || ''}"`,
        `"${l.city || ''}"`,
        `"${(l.remarks || '').replace(/"/g, '""')}"`,
        `"${l.tag || ''}"`,
        `"${l.status || ''}"`,
        `"${leadSource(l)}"`,
        `"${userName(l.ownerId)}"`,
      ].join(',')),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_export_${todayISO()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify(`Exported ${filtered.length} leads to CSV`, 'success');
  };

  const handleLogQuickCall = () => {
    if (!callLeadModal) return;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const callRecord = createRecord('calls', {
      subject: callNote || `Outbound Call with ${callLeadModal.name}`,
      callType: 'Outbound',
      startTime: `${todayISO()} ${nowTime}`,
      durationMin: 6,
      status: 'Completed',
      ownerId: callLeadModal.ownerId || CURRENT_USER_ID,
      accountId: callLeadModal.connectedAccountId || '',
      contactId: callLeadModal.connectedContactId || '',
    });
    const newAct = {
      id: `act-${Date.now()}`,
      type: 'Call Logged',
      desc: callNote || `Outbound call completed (6 mins)`,
      by: userName(callLeadModal.ownerId || CURRENT_USER_ID),
      date: `${todayISO()} ${nowTime}`,
      status: 'Completed',
    };
    updateRecord('leads', callLeadModal.id, {
      activities: [...(callLeadModal.activities || []), newAct],
      callAttemptCount: (Number(callLeadModal.callAttemptCount) || 0) + 1,
      totalCallCount: (Number(callLeadModal.totalCallCount) || 0) + 1,
      totalCallDurations: (Number(callLeadModal.totalCallDurations) || 0) + 6,
      connectedCallId: callRecord.id,
      relatedRecordsAction: 'Call Logged',
      _silentActivity: true,
    });
    setCallLeadModal(null);
    setCallNote('');
    notify(`Call logged for ${callLeadModal.name}`, 'success');
  };

  const renderOperatorAndValueControls = (fDef, cfg, onChange, onValueCheckbox) => {
    const ops = OPERATORS_BY_TYPE[fDef.type] || OPERATORS_BY_TYPE.text;
    const defaultOp = fDef.type === 'checkbox' ? 'checked' : fDef.type === 'date' ? 'On' : 'is';
    const op = cfg?.operator || defaultOp;
    const noValueNeeded = ['is empty', 'is not empty', 'checked', 'unchecked', ...NO_VALUE_DATE_OPERATORS].includes(op);
    const isTagFilter = fDef.label === 'Tag' || fDef.label === 'Tag Field';
    const configuredTags = (zohoCustomConfig.customTags?.length ? zohoCustomConfig.customTags : LEAD_TAGS).filter(
      (t) => t && String(t).trim().toLowerCase() !== 'hot lead'
    );
    const resolvedOptions = isTagFilter ? configuredTags : fDef.options;

    // Compute distinct values in current tab for picklists/text suggestions
    const counts = {};
    byTab.forEach((l) => {
      if (isTagFilter) {
        const recordTags = [...new Set([l.tag, l.tagField, ...(Array.isArray(l.tags) ? l.tags : [])].filter(Boolean))];
        recordTags.forEach((tg) => {
          if (configuredTags.includes(tg)) counts[tg] = (counts[tg] || 0) + 1;
        });
      } else {
        const v = fDef.get(l, userName);
        if (v !== undefined && v !== null && String(v).trim() !== '') {
          counts[String(v)] = (counts[String(v)] || 0) + 1;
        }
      }
    });
    const entries = isTagFilter
      ? configuredTags.map((tg) => [tg, counts[tg] || 0])
      : Object.entries(counts).sort((a, b) => b[1] - a[1]);

    return (
      <div className="pl-5 pr-2.5 pb-2.5 pt-1.5 space-y-1.5 bg-[#F8FAFD] border-y border-[#EEF1F7]">
        {/* Operator Selector */}
        <select
          value={op}
          onChange={(e) => onChange({ enabled: true, operator: e.target.value, value: '' })}
          className="w-full h-8 px-2 rounded border border-[#D5DBE8] bg-white text-[13.5px] text-[#1F2A44] focus:outline-none focus:border-[#2F55D4]"
        >
          {ops.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>

        {/* Value Input based on Operator & Field Type */}
        {!noValueNeeded && (
          <>
            {(op === 'belongs to Role' || op === 'does not belong to Role') ? (
              <select
                value={cfg?.value || ''}
                onChange={(e) => onChange({ enabled: true, value: e.target.value })}
                className="w-full h-8 px-2 rounded border border-[#D5DBE8] bg-white text-[13.5px] text-[#1F2A44] focus:outline-none focus:border-[#2F55D4]"
              >
                <option value="">-Select Role-</option>
                {USER_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            ) : op === 'belongs to Group' ? (
              <select
                value={cfg?.value || ''}
                onChange={(e) => onChange({ enabled: true, value: e.target.value })}
                className="w-full h-8 px-2 rounded border border-[#D5DBE8] bg-white text-[13.5px] text-[#1F2A44] focus:outline-none focus:border-[#2F55D4]"
              >
                <option value="">-Select Group-</option>
                {USER_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            ) : fDef.type === 'owner' ? (
              <div className="space-y-1">
                <select
                  value={cfg?.value || ''}
                  onChange={(e) => onChange({ enabled: true, value: e.target.value })}
                  className="w-full h-8 px-2 rounded border border-[#D5DBE8] bg-white text-[13.5px] text-[#1F2A44] focus:outline-none focus:border-[#2F55D4]"
                >
                  <option value="">-Select User-</option>
                  {users.map((u) => <option key={u.id} value={u.name}>{u.name} ({u.role})</option>)}
                  {(fDef.extraUsers || []).map((eu) => <option key={eu} value={eu}>{eu}</option>)}
                </select>
              </div>
            ) : fDef.type === 'date' ? (
              <div className="space-y-1.5">
                {(op === 'age in' || op === 'due in') ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      placeholder="Enter count..."
                      value={cfg?.value || ''}
                      onChange={(e) => onChange({ enabled: true, value: e.target.value })}
                      className="flex-1 min-w-0 h-8 px-2 rounded border border-[#D5DBE8] bg-white text-[13.5px] text-[#1F2A44] focus:outline-none focus:border-[#2F55D4]"
                    />
                    <select
                      value={cfg?.unit || 'days'}
                      onChange={(e) => onChange({ enabled: true, unit: e.target.value })}
                      className="h-8 px-1.5 rounded border border-[#D5DBE8] bg-white text-[13px] text-[#1F2A44]"
                    >
                      <option value="days">Days</option>
                      <option value="hours">Hours</option>
                      <option value="months">Months</option>
                    </select>
                  </div>
                ) : (
                  <>
                    <input
                      type="date"
                      value={cfg?.value || ''}
                      onChange={(e) => onChange({ enabled: true, value: e.target.value })}
                      className="w-full h-8 px-2 rounded border border-[#D5DBE8] bg-white text-[13.5px] text-[#1F2A44] focus:outline-none focus:border-[#2F55D4]"
                    />
                    {(op === 'between' || op === 'not between') && (
                      <input
                        type="date"
                        value={cfg?.valueTo || ''}
                        onChange={(e) => onChange({ enabled: true, valueTo: e.target.value })}
                        className="w-full h-8 px-2 rounded border border-[#D5DBE8] bg-white text-[13.5px] text-[#1F2A44] focus:outline-none focus:border-[#2F55D4]"
                      />
                    )}
                  </>
                )}
              </div>
            ) : fDef.type === 'number' ? (
              <div className="space-y-1.5">
                <input
                  type="number"
                  placeholder="Enter value..."
                  value={cfg?.value || ''}
                  onChange={(e) => onChange({ enabled: true, value: e.target.value })}
                  className="w-full h-8 px-2 rounded border border-[#D5DBE8] bg-white text-[13.5px] text-[#1F2A44] focus:outline-none focus:border-[#2F55D4]"
                />
                {(op === 'between' || op === 'not between') && (
                  <input
                    type="number"
                    placeholder="To value..."
                    value={cfg?.valueTo || ''}
                    onChange={(e) => onChange({ enabled: true, valueTo: e.target.value })}
                    className="w-full h-8 px-2 rounded border border-[#D5DBE8] bg-white text-[13.5px] text-[#1F2A44] focus:outline-none focus:border-[#2F55D4]"
                  />
                )}
              </div>
            ) : fDef.type === 'lookup' ? (
              <div className="space-y-1.5">
                <input
                  type="text"
                  placeholder={`Search ${fDef.lookupModule || 'records'}...`}
                  value={cfg?.value || ''}
                  onChange={(e) => onChange({ enabled: true, value: e.target.value })}
                  className="w-full h-8 px-2 rounded border border-[#D5DBE8] bg-white text-[13.5px] text-[#1F2A44] focus:outline-none focus:border-[#2F55D4]"
                />
                <select
                  value={cfg?.value || ''}
                  onChange={(e) => onChange({ enabled: true, value: e.target.value })}
                  className="w-full h-8 px-2 rounded border border-[#D5DBE8] bg-white text-[13.5px] text-[#1F2A44]"
                >
                  <option value="">-Select Related Record-</option>
                  {(fDef.lookupModule === 'accounts' ? accounts : fDef.lookupModule === 'contacts' ? contacts : deals).slice(0, 20).map((rec) => (
                    <option key={rec.id} value={rec.name}>{rec.name}</option>
                  ))}
                </select>
              </div>
            ) : (fDef.type === 'picklist' || fDef.type === 'multiselect') && resolvedOptions ? (
              <div className="space-y-1.5">
                <select
                  value={cfg?.value || ''}
                  onChange={(e) => onChange({ enabled: true, value: e.target.value })}
                  className="w-full h-8 px-2 rounded border border-[#D5DBE8] bg-white text-[13.5px] text-[#1F2A44] focus:outline-none focus:border-[#2F55D4]"
                >
                  <option value="">-Select {fDef.label}-</option>
                  {resolvedOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {onValueCheckbox && entries.length > 0 && (
                  <div className="max-h-36 overflow-y-auto thin-scroll pt-0.5 space-y-1">
                    {entries.map(([v, c]) => (
                      <label key={v} className="flex items-center gap-2 py-[1px] text-[13px] text-[#2A3350] cursor-pointer">
                        <input
                          type="checkbox"
                          className="accent-[#2F55D4]"
                          checked={(cfg?.values || []).includes(v) || cfg?.value === v}
                          onChange={() => onValueCheckbox(v)}
                        />
                        <span className="flex-1 truncate">{v}</span>
                        {c > 0 && <span className="text-[#8B95AE] text-[11.5px]">{c}</span>}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <input
                  type="text"
                  placeholder="Enter value..."
                  value={cfg?.value || ''}
                  onChange={(e) => onChange({ enabled: true, value: e.target.value })}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleApplyFilters(); }}
                  className="w-full h-8 px-2 rounded border border-[#D5DBE8] bg-white text-[13.5px] text-[#1F2A44] focus:outline-none focus:border-[#2F55D4]"
                />
                {onValueCheckbox && entries.length > 0 && (
                  <div className="max-h-32 overflow-y-auto thin-scroll pt-0.5 space-y-1">
                    {entries.slice(0, 15).map(([v, c]) => (
                      <label key={v} className="flex items-center gap-2 py-[1px] text-[13px] text-[#2A3350] cursor-pointer">
                        <input
                          type="checkbox"
                          className="accent-[#2F55D4]"
                          checked={(cfg?.values || []).includes(v)}
                          onChange={() => onValueCheckbox(v)}
                        />
                        <span className="flex-1 truncate">{v}</span>
                        <span className="text-[#8B95AE] text-[11.5px]">{c}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="-mx-3 sm:-mx-[18px] -mt-2.5 bg-white min-h-[calc(100vh-56px)]">
      {/* ---- Leads Top Navigation Bar (Exact Screenshot 1, 2 & 3 Design) ---- */}
      <div
        ref={navBarRef}
        className="relative flex items-center gap-6 px-4 h-[42px] border-b border-line text-[14px] bg-white select-none"
      >
        {location.state?.from === '/workqueue' && (
          <button
            type="button"
            onClick={() => navigate('/workqueue')}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#EEF2FF] text-[#2F55D4] font-semibold text-[12px] hover:bg-[#E0E7FF] shrink-0"
          >
            <ArrowLeft size={13} /> Back to Workqueue
          </button>
        )}

        {viewsDisplayMode === 'dropdown' ? (
          /* Compact View Dropdown Mode when "Show custom views as Dropdown" is toggled */
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setPublicViewsDropdownOpen((o) => !o);
                  setActiveTabMenuFor(null);
                }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded border border-[#D5DBE8] bg-[#F8FAFD] font-semibold text-[#1F2A44] hover:border-[#2F55D4]"
              >
                <span>{tab}</span>
                <ChevronDown size={14} className="text-[#5B6684]" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => updateLeadsUiState({ viewsDisplayMode: 'tabs' })}
              className="text-[12.5px] text-[#2F55D4] hover:underline font-medium"
            >
              Show views as Tabs
            </button>
          </div>
        ) : (
          /* Standard Zoho Horizontal View Tabs: All Leads | Today's Leads | My Leads ▼ | Chennai | Website | Delhi | ⋯ */
          <div className="flex items-center gap-6 h-full overflow-x-auto thin-scroll">
            {visibleTopTabs.map((t) => {
              const isSelected = tab === t;
              const showArrow = isSelected || t === 'My Leads';
              return (
                <div
                  key={t}
                  className={`relative h-full flex items-center gap-1 shrink-0 ${
                    isSelected
                      ? 'font-semibold text-[#1F2A44] border-b-[2.5px] border-[#1F2A44]'
                      : 'text-[#5B6684] hover:text-[#1F2A44]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setTab(t)}
                    className="h-full flex items-center"
                  >
                    {t}
                  </button>
                  {showArrow && (
                    <button
                      type="button"
                      title={`View actions for ${t}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isSelected) setTab(t);
                        setPublicViewsDropdownOpen(false);
                        setActiveTabMenuFor((curMenu) => (curMenu === t ? null : t));
                      }}
                      className="p-0.5 rounded hover:bg-[#EEF2FF] text-[#1F2A44] inline-flex items-center"
                    >
                      <ChevronDown size={13} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Three-Dots (⋯) Custom Views Dropdown Trigger immediately after Delhi */}
        <div className="relative flex items-center h-full">
          <button
            type="button"
            title="Public & Custom Views"
            onClick={() => {
              setActiveTabMenuFor(null);
              setItemSubmenuFor(null);
              setPublicViewsDropdownOpen((o) => !o);
            }}
            className={`h-7 w-7 rounded flex items-center justify-center transition ${
              publicViewsDropdownOpen
                ? 'bg-[#EAF2FF] text-[#2F55D4]'
                : 'text-[#5B6684] hover:text-[#1F2A44] hover:bg-[#F3F6FB]'
            }`}
          >
            <MoreHorizontal size={16} />
          </button>

          {/* Three-Dots (⋯) Searchable Public Views Dropdown (Exact Screenshot 3 Design) */}
          {publicViewsDropdownOpen && (
            <div className="absolute left-0 top-[38px] z-50 w-[290px] bg-white border border-[#D5DBE8] rounded-md shadow-xl flex flex-col text-[13px] pop-in">
              {/* Instant Search Input */}
              <div className="p-2 border-b border-[#EEF1F7]">
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8B95AE]" />
                  <input
                    autoFocus
                    type="text"
                    value={publicViewSearch}
                    onChange={(e) => setPublicViewSearch(e.target.value)}
                    placeholder="Search"
                    className="w-full h-8 pl-8 pr-7 rounded border border-[#2F55D4] bg-white text-[13px] text-[#1F2A44] focus:outline-none"
                  />
                  {publicViewSearch && (
                    <button
                      type="button"
                      onClick={() => setPublicViewSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8B95AE] hover:text-[#1F2A44]"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable Views List */}
              <div className="max-h-[320px] overflow-y-auto thin-scroll py-1">
                {filteredCustomViews.length > 0 && (
                  <div className="mb-1">
                    <div className="px-3 py-1 text-[11.5px] font-bold text-[#6B7696] uppercase tracking-wide">
                      Created by Me
                    </div>
                    {filteredCustomViews.map((cv) => {
                      const active = tab === cv.name;
                      const isPinned = pinnedTabs.includes(cv.name);
                      return (
                        <div
                          key={cv.id}
                          className={`group relative flex items-center justify-between px-3 py-1.5 cursor-pointer ${
                            active ? 'bg-[#EAF2FF] text-[#2F55D4] font-semibold' : 'text-[#1F2A44] hover:bg-[#F3F6FB]'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setTab(cv.name)}
                            className="flex-1 text-left truncate flex items-center gap-2"
                          >
                            <span className="truncate">{cv.name}</span>
                            {isPinned && <Pin size={11} className="text-[#2F55D4] shrink-0" />}
                          </button>
                          <button
                            type="button"
                            title="View Actions"
                            onClick={(e) => {
                              e.stopPropagation();
                              setItemSubmenuFor((curId) => (curId === cv.name ? null : cv.name));
                            }}
                            className="opacity-70 group-hover:opacity-100 p-1 rounded hover:bg-white text-[#5B6684] hover:text-[#1F2A44]"
                          >
                            <MoreHorizontal size={14} />
                          </button>
                          {itemSubmenuFor === cv.name && (
                            <div className="absolute right-8 top-1 z-50 w-40 bg-white border border-[#D5DBE8] rounded shadow-lg py-1 text-[12.5px] font-normal text-[#1F2A44]">
                              <button type="button" onClick={() => handleOpenViewEditor('edit', cv.name)} className="w-full px-3 py-1.5 text-left hover:bg-[#F3F6FB] flex items-center gap-2">
                                <Edit3 size={13} /> Edit
                              </button>
                              <button type="button" onClick={() => handleTogglePinView(cv.name)} className="w-full px-3 py-1.5 text-left hover:bg-[#F3F6FB] flex items-center gap-2">
                                <Pin size={13} /> {isPinned ? 'Unpin' : 'Pin'}
                              </button>
                              <button type="button" onClick={() => handleOpenViewEditor('clone', cv.name)} className="w-full px-3 py-1.5 text-left hover:bg-[#F3F6FB] flex items-center gap-2">
                                <Copy size={13} /> Clone
                              </button>
                              <button type="button" onClick={() => handleRequestDeleteView(cv.name)} className="w-full px-3 py-1.5 text-left hover:bg-rose-50 text-rose-600 flex items-center gap-2">
                                <Trash2 size={13} /> Delete View
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Public Views Heading & Exact 53 Views */}
                <div className="px-3 py-1.5 text-[12px] font-bold text-[#1F2A44]">
                  Public Views
                </div>
                {filteredPublicViews.map((vName) => {
                  const active = tab === vName;
                  const isPinned = pinnedTabs.includes(vName);
                  return (
                    <div
                      key={vName}
                      className={`group relative flex items-center justify-between px-3 py-1.5 cursor-pointer ${
                        active ? 'bg-[#EAF2FF] text-[#2F55D4] font-semibold' : 'text-[#1F2A44] hover:bg-[#F3F6FB]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setTab(vName)}
                        className="flex-1 text-left truncate flex items-center gap-2"
                      >
                        <span className="truncate">{vName}</span>
                        {isPinned && <Pin size={11} className="text-[#2F55D4] shrink-0" />}
                      </button>
                      <button
                        type="button"
                        title={`Actions for ${vName}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setItemSubmenuFor((curId) => (curId === vName ? null : vName));
                        }}
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded hover:bg-white text-[#5B6684] hover:text-[#1F2A44]"
                      >
                        <MoreHorizontal size={14} />
                      </button>

                      {/* Individual View Submenu: Edit, Pin, Clone, Delete View */}
                      {itemSubmenuFor === vName && (
                        <div className="absolute right-8 top-1 z-50 w-44 bg-white border border-[#D5DBE8] rounded shadow-lg py-1 text-[12.5px] font-normal text-[#1F2A44]">
                          <button
                            type="button"
                            onClick={() => handleOpenViewEditor('edit', vName)}
                            className="w-full px-3 py-1.5 text-left hover:bg-[#F3F6FB] flex items-center gap-2"
                          >
                            <Edit3 size={13} /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTogglePinView(vName)}
                            className="w-full px-3 py-1.5 text-left hover:bg-[#F3F6FB] flex items-center gap-2"
                          >
                            <Pin size={13} /> {isPinned ? 'Unpin' : 'Pin'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenViewEditor('clone', vName)}
                            className="w-full px-3 py-1.5 text-left hover:bg-[#F3F6FB] flex items-center gap-2"
                          >
                            <Copy size={13} /> Clone
                          </button>
                          <button
                            type="button"
                            disabled
                            title="Protected Public Views cannot be deleted"
                            className="w-full px-3 py-1.5 text-left text-[#94A3B8] cursor-not-allowed flex items-center justify-between"
                          >
                            <span className="flex items-center gap-2"><Trash2 size={13} /> Delete View</span>
                            <Lock size={11} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {filteredPublicViews.length === 0 && filteredCustomViews.length === 0 && (
                  <div className="px-3 py-6 text-center text-[#8B95AE] text-[12.5px]">
                    No views found matching "{publicViewSearch}"
                  </div>
                )}
              </div>

              {/* Bottom Sticky Actions of Three-Dots Dropdown */}
              <div className="border-t border-[#E3E8F2] bg-[#F8FAFD] py-1.5 px-3 space-y-1 text-[12.5px]">
                <button
                  type="button"
                  onClick={() => {
                    const nextMode = viewsDisplayMode === 'dropdown' ? 'tabs' : 'dropdown';
                    updateLeadsUiState({ viewsDisplayMode: nextMode });
                    setPublicViewsDropdownOpen(false);
                    notify(nextMode === 'dropdown' ? 'Switched custom views to Dropdown mode' : 'Switched custom views to Tabs mode', 'info');
                  }}
                  className="w-full py-1 text-left text-[#1F2A44] hover:text-[#2F55D4] flex items-center gap-2"
                >
                  <Settings2 size={13} className="text-[#5B6684]" />
                  <span>Show custom views as Dropdown</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenViewEditor('create')}
                  className="w-full py-1 text-left text-[#2F55D4] font-medium hover:underline flex items-center gap-2"
                >
                  <Plus size={13} />
                  <span>New Custom View</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPublicViewsDropdownOpen(false);
                    setManageViewsModalOpen(true);
                  }}
                  className="w-full py-1 text-left text-[#2F55D4] font-medium hover:underline flex items-center gap-2"
                >
                  <List size={13} />
                  <span>Manage Custom View</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Active View Dropdown Arrow Menu (Edit, Pin, Clone, Close View, Delete View) */}
        {activeTabMenuFor && (
          <div className="absolute left-44 top-[38px] z-50 w-44 bg-white border border-[#D5DBE8] rounded-md shadow-xl py-1 text-[13px] text-[#1F2A44] pop-in">
            <div className="px-3 py-1 text-[11px] font-semibold text-[#6B7696] border-b border-[#EEF1F7] truncate">
              {activeTabMenuFor}
            </div>
            <button
              type="button"
              onClick={() => handleOpenViewEditor('edit', activeTabMenuFor)}
              className="w-full px-3 py-1.5 text-left hover:bg-[#F3F6FB] flex items-center gap-2"
            >
              <Edit3 size={13} className="text-[#5B6684]" /> Edit
            </button>
            <button
              type="button"
              onClick={() => handleTogglePinView(activeTabMenuFor)}
              className="w-full px-3 py-1.5 text-left hover:bg-[#F3F6FB] flex items-center gap-2"
            >
              <Pin size={13} className="text-[#5B6684]" /> {pinnedTabs.includes(activeTabMenuFor) ? 'Unpin' : 'Pin'}
            </button>
            <button
              type="button"
              onClick={() => handleOpenViewEditor('clone', activeTabMenuFor)}
              className="w-full px-3 py-1.5 text-left hover:bg-[#F3F6FB] flex items-center gap-2"
            >
              <Copy size={13} className="text-[#5B6684]" /> Clone
            </button>
            <button
              type="button"
              disabled={pinnedTabs.length <= 1 && pinnedTabs.includes(activeTabMenuFor)}
              onClick={() => handleCloseViewTab(activeTabMenuFor)}
              className="w-full px-3 py-1.5 text-left hover:bg-[#F3F6FB] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <X size={13} className="text-[#5B6684]" /> Close View
            </button>
            <div className="my-0.5 border-t border-[#EEF1F7]" />
            {PROTECTED_PUBLIC_VIEWS.has(activeTabMenuFor) ? (
              <button
                type="button"
                disabled
                title="Protected Public Views cannot be deleted"
                className="w-full px-3 py-1.5 text-left text-[#94A3B8] cursor-not-allowed flex items-center justify-between"
              >
                <span className="flex items-center gap-2"><Trash2 size={13} /> Delete View</span>
                <Lock size={12} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleRequestDeleteView(activeTabMenuFor)}
                className="w-full px-3 py-1.5 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2"
              >
                <Trash2 size={13} /> Delete View
              </button>
            )}
          </div>
        )}

        {appliedFilters.quickPreset === 'assigned_last_3_hours' && (
          <span className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[12px] font-medium shrink-0">
            Assigned in Last 3 Hours
            <button type="button" onClick={handleClearFilters} className="hover:text-amber-950"><X size={12} /></button>
          </span>
        )}
      </div>

      {/* ---- Toolbar ---- */}
      <div className="flex items-center gap-2.5 px-4 h-[50px] flex-wrap">
        <button
          type="button"
          onClick={() => setShowFilterPanel((s) => !s)}
          className="h-9 px-3.5 rounded-lg border border-[#D5DBE8] bg-white text-[14px] font-medium inline-flex items-center gap-1.5 hover:bg-[#F3F6FB]"
        >
          <Filter size={15} /> Filter
          {activeAppliedCount > 0 && (
            <span className="text-[12px] bg-[#2F55D4] text-white rounded-full px-1.5">{activeAppliedCount}</span>
          )}
        </button>

        {/* Sort Button & Dropdown */}
        <div className="relative">
          <div className="h-9 px-3.5 rounded-lg border border-[#D5DBE8] bg-white text-[14px] font-medium inline-flex items-center gap-1.5 hover:bg-[#F3F6FB]">
            <button
              type="button"
              onClick={() => setSortMenuOpen((o) => !o)}
              className="inline-flex items-center gap-1.5"
            >
              <ArrowDownUp size={15} /> Sort
            </button>
            <button
              type="button"
              title="Reset Sort"
              onClick={() => updateLeadsUiState({ sortField: 'createdOn', sortDir: 'desc' })}
              className="ml-1 text-[#5B6684] hover:text-[#1F2A44]"
            >
              <X size={13} />
            </button>
          </div>
          {sortMenuOpen && (
            <div className="absolute left-0 top-10 z-30 w-56 bg-white border border-[#D5DBE8] rounded-lg shadow-lg py-1 text-[14px]">
              <div className="px-3 py-1.5 text-[12px] font-semibold text-[#6B7696] uppercase">Sort By Field</div>
              {[
                ['createdOn', 'Created Time'],
                ['name', 'Lead Name'],
                ['modifiedTime', 'Modified Time'],
                ['city', 'City'],
                ['status', 'Lead Status'],
                ['owner', 'Lead Owner'],
              ].map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    const nextDir = sortField === k && sortDir === 'desc' ? 'asc' : 'desc';
                    updateLeadsUiState({ sortField: k, sortDir: nextDir });
                    setSortMenuOpen(false);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-[#F3F6FB] flex items-center justify-between"
                >
                  <span>{label}</span>
                  {sortField === k && <span className="text-[12px] text-[#2F55D4] font-semibold">{sortDir.toUpperCase()}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2 text-[#5B6684] ml-1">
          <button type="button" title="List View" onClick={() => setViewMode('list')}>
            <List size={18} className={viewMode === 'list' ? 'text-[#2F55D4]' : 'hover:text-[#1F2A44]'} />
          </button>
          <button type="button" title="Kanban View" onClick={() => setViewMode('kanban')}>
            <Columns3 size={18} className={viewMode === 'kanban' ? 'text-[#2F55D4]' : 'hover:text-[#1F2A44]'} />
          </button>
          <button type="button" title="Sheet View" onClick={() => setViewMode('sheet')}>
            <Table2 size={18} className={viewMode === 'sheet' ? 'text-[#2F55D4]' : 'hover:text-[#1F2A44]'} />
          </button>
          <button type="button" title="Timeline View" onClick={() => setViewMode('timeline')}>
            <Clock3 size={17} className={viewMode === 'timeline' ? 'text-[#2F55D4]' : 'hover:text-[#1F2A44]'} />
          </button>
          <button type="button" title="Grid View" onClick={() => setViewMode('grid')}>
            <LayoutGrid size={17} className={viewMode === 'grid' ? 'text-[#2F55D4]' : 'hover:text-[#1F2A44]'} />
          </button>
          <ChevronDown size={14} />
        </div>

        {/* Search Leads */}
        <div className="relative ml-3 hidden md:block">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B95AE]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads"
            className="h-9 w-[240px] pl-9 pr-7 rounded-lg border border-[#D5DBE8] text-[14px] focus:outline-none focus:border-[#2F55D4]"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8B95AE] hover:text-[#1F2A44]"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Bulk Actions Bar when rows are selected */}
        {selected.size > 0 && (
          <div className="flex items-center gap-2 bg-[#EEF2FF] border border-[#C7D2FE] px-3 h-9 rounded-lg text-[13.5px] text-[#1F2A44]">
            <span className="font-semibold text-[#2F55D4]">{selected.size} selected</span>
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) handleBulkUpdate({ status: e.target.value }, `Status → ${e.target.value}`);
                e.target.value = '';
              }}
              className="h-7 px-2 rounded border border-[#D5DBE8] bg-white text-[13px]"
            >
              <option value="">Change Status...</option>
              {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) handleBulkUpdate({ ownerId: e.target.value }, 'Owner');
                e.target.value = '';
              }}
              className="h-7 px-2 rounded border border-[#D5DBE8] bg-white text-[13px]"
            >
              <option value="">Change Owner...</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) handleBulkUpdate({ tag: e.target.value, tagField: e.target.value }, `Tag → ${e.target.value}`);
                e.target.value = '';
              }}
              className="h-7 px-2 rounded border border-[#D5DBE8] bg-white text-[13px]"
            >
              <option value="">Update Tag...</option>
              {(zohoCustomConfig.customTags?.length ? zohoCustomConfig.customTags : LEAD_TAGS)
                .filter((t) => t && String(t).trim().toLowerCase() !== 'hot lead')
                .map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) handleBulkUpdate({ source: e.target.value, leadSource: e.target.value }, `Source → ${e.target.value}`);
                e.target.value = '';
              }}
              className="h-7 px-2 rounded border border-[#D5DBE8] bg-white text-[13px]"
            >
              <option value="">Lead Source...</option>
              {LEAD_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button
              type="button"
              onClick={() => setDeletingIds([...selected])}
              className="px-2.5 h-7 rounded bg-rose-600 text-white hover:bg-rose-700 inline-flex items-center gap-1 text-[13px]"
            >
              <Trash2 size={13} /> Delete
            </button>
            <button type="button" onClick={() => setSelected(new Set())} className="text-[#5B6684] hover:text-[#1F2A44]">
              <X size={14} />
            </button>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <div className="relative flex">
            <button
              type="button"
              onClick={() => navigate('/leads/new')}
              className="h-9 px-4 rounded-l-lg bg-[#2F55D4] hover:bg-[#2748B8] text-white text-[14px] font-semibold"
            >
              Create Lead
            </button>
            <button
              type="button"
              title="Lead Creation & Import Options"
              onClick={() => setCreateMenuOpen((o) => !o)}
              className="h-9 w-8 rounded-r-lg bg-[#2F55D4] hover:bg-[#2748B8] border-l border-white/30 text-white flex items-center justify-center"
            >
              <ChevronDown size={14} />
            </button>
            {createMenuOpen && (
              <div className="absolute right-0 top-10 z-30 w-60 bg-white border border-[#D5DBE8] rounded-lg shadow-lg py-1 text-[14px]">
                <button
                  type="button"
                  onClick={() => { setCreateMenuOpen(false); navigate('/leads/new'); }}
                  className="w-full px-3 py-2 text-left hover:bg-[#F3F6FB] flex items-center gap-2"
                >
                  <Plus size={15} className="text-[#2F55D4]" /> Create Lead
                </button>
                <button
                  type="button"
                  onClick={() => { setCreateMenuOpen(false); setImportExportModal({ open: true, mode: 'import' }); }}
                  className="w-full px-3 py-2 text-left hover:bg-[#F3F6FB] flex items-center gap-2"
                >
                  <Upload size={15} className="text-[#2F55D4]" /> Import Leads
                </button>
                <button
                  type="button"
                  onClick={() => { setCreateMenuOpen(false); setImportExportModal({ open: true, mode: 'bulk_import' }); }}
                  className="w-full px-3 py-2 text-left hover:bg-[#F3F6FB] flex items-center gap-2"
                >
                  <Upload size={15} className="text-emerald-600" /> Bulk Import Leads
                </button>
                <button
                  type="button"
                  onClick={() => { setCreateMenuOpen(false); setImportExportModal({ open: true, mode: 'export' }); }}
                  className="w-full px-3 py-2 text-left hover:bg-[#F3F6FB] flex items-center gap-2"
                >
                  <Download size={15} className="text-[#5B6684]" /> Export Leads
                </button>
                <div className="border-t border-[#EEF1F7] my-1" />
                <button
                  type="button"
                  onClick={() => { setCreateMenuOpen(false); setCustomizeModal({ open: true, tab: 'columns' }); }}
                  className="w-full px-3 py-2 text-left hover:bg-[#F3F6FB] flex items-center gap-2"
                >
                  <Sliders size={15} className="text-[#5B6684]" /> Customize Columns & Fields
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            title="Customize Visible Columns & Ordering"
            onClick={() => setCustomizeModal({ open: true, tab: 'columns' })}
            className="h-9 px-3 rounded-lg border border-[#D5DBE8] bg-white text-[14px] font-medium inline-flex items-center gap-1.5 hover:bg-[#F3F6FB]"
          >
            <Columns3 size={14} className="text-[#2F55D4]" /> Columns ({visibleColumns.length})
          </button>
          <button
            type="button"
            onClick={() => setMapModalOpen(true)}
            className="h-9 px-3 rounded-lg border border-[#D5DBE8] bg-white text-[14px] font-medium inline-flex items-center gap-1.5 hover:bg-[#F3F6FB]"
          >
            <MapIcon size={14} /> Map View <ChevronDown size={13} />
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMoreMenuOpen((o) => !o)}
              className="h-9 w-9 rounded-lg border border-[#D5DBE8] bg-white flex items-center justify-center hover:bg-[#F3F6FB]"
            >
              <MoreHorizontal size={16} />
            </button>
            {moreMenuOpen && (
              <div className="absolute right-0 top-10 z-30 w-60 bg-white border border-[#D5DBE8] rounded-lg shadow-lg py-1 text-[14px]">
                <button
                  type="button"
                  onClick={() => { setMoreMenuOpen(false); setImportExportModal({ open: true, mode: 'import' }); }}
                  className="w-full px-3 py-2 text-left hover:bg-[#F3F6FB] flex items-center gap-2"
                >
                  <Upload size={15} /> Import Leads (CSV / Excel)
                </button>
                <button
                  type="button"
                  onClick={() => { setMoreMenuOpen(false); setImportExportModal({ open: true, mode: 'bulk_import' }); }}
                  className="w-full px-3 py-2 text-left hover:bg-[#F3F6FB] flex items-center gap-2"
                >
                  <Upload size={15} /> Bulk Import Leads
                </button>
                <button
                  type="button"
                  onClick={() => { setMoreMenuOpen(false); setImportExportModal({ open: true, mode: 'export' }); }}
                  className="w-full px-3 py-2 text-left hover:bg-[#F3F6FB] flex items-center gap-2"
                >
                  <Download size={15} /> Export Leads ({filtered.length})
                </button>
                <button
                  type="button"
                  onClick={() => { setMoreMenuOpen(false); setCustomizeModal({ open: true, tab: 'columns' }); }}
                  className="w-full px-3 py-2 text-left hover:bg-[#F3F6FB] flex items-center gap-2"
                >
                  <Sliders size={15} /> Customize Module & Columns
                </button>
                <div className="border-t border-[#EEF1F7] my-1" />
                <button
                  type="button"
                  onClick={() => { setMoreMenuOpen(false); handleOpenViewEditor('create'); }}
                  className="w-full px-3 py-2 text-left hover:bg-[#F3F6FB] flex items-center gap-2"
                >
                  <Plus size={15} /> New Custom View
                </button>
                <button
                  type="button"
                  onClick={() => { setMoreMenuOpen(false); setSaveFilterModalOpen(true); }}
                  className="w-full px-3 py-2 text-left hover:bg-[#F3F6FB] flex items-center gap-2"
                >
                  <Bookmark size={15} /> Save Current Filter
                </button>
                <button
                  type="button"
                  onClick={() => { setMoreMenuOpen(false); handleClearFilters(); }}
                  className="w-full px-3 py-2 text-left hover:bg-[#F3F6FB] text-rose-600 flex items-center gap-2"
                >
                  <X size={15} /> Reset All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ---- Main Split Area: Resizable Filter Sidebar + Adjustable Table Area ---- */}
      <div className="flex px-2 pb-2 items-stretch">
        {showFilterPanel && (
          <>
            <aside
              style={{ width: `${sidebarWidth}px` }}
              className="card shrink-0 border border-line rounded-xl bg-white shadow-xs h-[calc(100vh-152px)] flex flex-col overflow-hidden"
            >
              {/* Top Heading & Search — Matches Deals, Contacts, and Accounts Filter Panels */}
              <div className="px-3.5 pt-4 pb-3 border-b border-[#EEF1F7] shrink-0 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[16px] font-semibold text-ink whitespace-nowrap">Filter Leads by</h2>
                  {(activeAppliedCount > 0 || activeDraftCount > 0 || panelSearch) && (
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="text-[13.5px] text-primary hover:underline font-medium"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="relative">
                  <Search size={15} className="absolute left-2.5 top-2.5 text-ink-400" />
                  <input
                    type="text"
                    value={panelSearch}
                    onChange={(e) => setPanelSearch(e.target.value)}
                    placeholder="Search..."
                    className="w-full h-9 pl-8 pr-7 text-[14px] border border-line rounded-md focus:border-primary outline-none bg-white text-ink"
                  />
                  {panelSearch && (
                    <button
                      type="button"
                      onClick={() => setPanelSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable Filter Sections */}
              <div className="flex-1 overflow-y-auto thin-scroll">
                {/* Saved Filters */}
                <Section
                  title={
                    <span>
                      Saved Filters{' '}
                      <span className="ml-1 text-[11px] border border-[#C9D1E3] rounded px-1.5 py-0.2 text-ink-600">
                        {savedFilters.length}
                      </span>
                    </span>
                  }
                  defaultOpen={false}
                >
                  {savedFilters.map((sf) => (
                    <div
                      key={sf.id}
                      onClick={() => {
                        const next = {
                          system: sf.system || {},
                          fields: sf.fields || {},
                          related: sf.related || {},
                          quickPreset: '',
                          logicMode: 'AND',
                        };
                        setDraftFilters(structuredClone(next));
                        updateLeadsUiState({ appliedFilters: next, page: 1 });
                      }}
                      className={cbRow}
                    >
                      <span className="text-[#2F55D4] hover:underline truncate flex-1">{sf.name}</span>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSaveFilterModalOpen(true)}
                    className="pl-6 pr-3.5 py-1.5 text-[12.5px] text-[#2F55D4] hover:underline font-medium"
                  >
                    + Save current filter
                  </button>
                </Section>

                {/* A. System Defined Filters */}
                <Section title="System Defined Filters" defaultOpen={true} badge={sysActiveCount}>
                  {SYSTEM_FILTERS.filter(match).map((f) => {
                    const cfg = draftFilters.system?.[f];
                    const isChecked = !!cfg?.enabled;
                    const isExpanded = expandedSys === f || isChecked;
                    const def = SYSTEM_FILTER_CONFIG[f] || { type: 'text' };

                    return (
                      <div key={f}>
                        <div className={cbRow}>
                          <input
                            type="checkbox"
                            className="accent-[#2F55D4] shrink-0"
                            checked={isChecked}
                            onChange={() => toggleSysDraft(f)}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!isChecked) toggleSysDraft(f);
                              else setExpandedSys(expandedSys === f ? null : f);
                            }}
                            className="flex-1 flex items-center justify-between text-left truncate"
                          >
                            <span className="truncate">{f}</span>
                            <ChevronDown size={12} className={`shrink-0 transition-transform ${isExpanded ? 'rotate-180 text-[#2F55D4]' : 'text-[#8B95AE]'}`} />
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="pl-5 pr-2.5 pb-2.5 pt-1.5 space-y-1.5 bg-[#F8FAFD] border-y border-[#EEF1F7]">
                            {f === 'Campaigns' ? (
                              <>
                                <div className="text-[11.5px] font-medium text-[#5B6684]">Campaign Type</div>
                                <select
                                  value={cfg?.campaignType || '-Select Campaign Type-'}
                                  onChange={(e) => updateSysDraft(f, { enabled: true, campaignType: e.target.value })}
                                  className="w-full h-7 px-2 rounded border border-[#D5DBE8] bg-white text-[12.5px] text-[#1F2A44] focus:outline-none focus:border-[#2F55D4]"
                                >
                                  {CAMPAIGN_TYPES.map((ct) => (
                                    <option key={ct} value={ct}>{ct}</option>
                                  ))}
                                </select>
                                <div className="text-[11.5px] font-medium text-[#5B6684]">Campaign Status</div>
                                <select
                                  value={cfg?.campaignStatus || 'All Statuses'}
                                  onChange={(e) => updateSysDraft(f, { enabled: true, campaignStatus: e.target.value })}
                                  className="w-full h-7 px-2 rounded border border-[#D5DBE8] bg-white text-[12.5px] text-[#1F2A44]"
                                >
                                  {def.statuses.map((st) => (
                                    <option key={st} value={st}>{st}</option>
                                  ))}
                                </select>
                                <div className="text-[11.5px] font-medium text-[#5B6684]">Campaign Name</div>
                                <select
                                  value={cfg?.operator || 'contains'}
                                  onChange={(e) => updateSysDraft(f, { enabled: true, operator: e.target.value })}
                                  className="w-full h-7 px-2 rounded border border-[#D5DBE8] bg-white text-[12.5px] text-[#1F2A44]"
                                >
                                  {OPERATORS_BY_TYPE.text.map((op) => <option key={op} value={op}>{op}</option>)}
                                </select>
                                {!['is empty', 'is not empty'].includes(cfg?.operator) && (
                                  <input
                                    type="text"
                                    placeholder="Campaign name..."
                                    value={cfg?.value || ''}
                                    onChange={(e) => updateSysDraft(f, { enabled: true, value: e.target.value })}
                                    className="w-full h-7 px-2 rounded border border-[#D5DBE8] bg-white text-[12.5px]"
                                  />
                                )}
                              </>
                            ) : f === 'Activities' ? (
                              <select
                                value={cfg?.activityMode || 'All Activities'}
                                onChange={(e) => updateSysDraft(f, { enabled: true, activityMode: e.target.value })}
                                className="w-full h-7 px-2 rounded border border-[#D5DBE8] bg-white text-[12.5px] text-[#1F2A44]"
                              >
                                {def.options.map((opt) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : f === 'Touched Records' || f === 'Untouched Records' ? (
                              <select
                                value={cfg?.value || 'All'}
                                onChange={(e) => updateSysDraft(f, { enabled: true, value: e.target.value })}
                                className="w-full h-7 px-2 rounded border border-[#D5DBE8] bg-white text-[12.5px] text-[#1F2A44]"
                              >
                                <option value="All">By User & System</option>
                                <option value="By User">By User</option>
                                <option value="By System">By System</option>
                              </select>
                            ) : f === 'Locked' ? (
                              <select
                                value={cfg?.value || 'Locked'}
                                onChange={(e) => updateSysDraft(f, { enabled: true, value: e.target.value })}
                                className="w-full h-7 px-2 rounded border border-[#D5DBE8] bg-white text-[12.5px] text-[#1F2A44]"
                              >
                                <option value="Locked">Locked</option>
                                <option value="Unlocked">Unlocked</option>
                              </select>
                            ) : f === 'Website Activity' ? (
                              <div className="text-[12px] text-[#5B6684]">Matches leads with recorded website visits</div>
                            ) : (
                              renderOperatorAndValueControls(
                                { label: f, type: def.type || 'text', options: def.options, get: def.get || (() => '') },
                                cfg,
                                (patch) => updateSysDraft(f, patch),
                                null
                              )
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </Section>

                {/* B. Filter By Fields */}
                <Section title="Filter By Fields" defaultOpen={true} badge={fieldActiveCount}>
                  {FIELD_FILTERS.filter((f) => match(f.label)).map((f) => {
                    const cfg = draftFilters.fields?.[f.label];
                    const isChecked = !!cfg?.enabled;
                    const isExpanded = expandedField === f.label || isChecked;

                    return (
                      <div key={f.label}>
                        <div className={cbRow}>
                          <input
                            type="checkbox"
                            className="accent-[#2F55D4] shrink-0"
                            checked={isChecked}
                            onChange={() => toggleFieldDraft(f.label)}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!isChecked) toggleFieldDraft(f.label);
                              else setExpandedField(expandedField === f.label ? null : f.label);
                            }}
                            className="flex-1 flex items-center justify-between text-left truncate"
                          >
                            <span className="truncate">
                              {f.label}
                              {cfg?.values?.length ? <b className="ml-1 text-[#2F55D4]">({cfg.values.length})</b> : null}
                            </span>
                            <ChevronDown size={12} className={`shrink-0 transition-transform ${isExpanded ? 'rotate-180 text-[#2F55D4]' : 'text-[#8B95AE]'}`} />
                          </button>
                        </div>

                        {isExpanded &&
                          renderOperatorAndValueControls(
                            f,
                            cfg,
                            (patch) => updateFieldDraft(f.label, patch),
                            (val) => toggleFieldValueCheckbox(f.label, val)
                          )}
                      </div>
                    );
                  })}
                </Section>

                {/* C. Filter By Related Modules */}
                <Section title="Filter By Related Modules" defaultOpen={true} badge={relActiveCount}>
                  {RELATED_MODULE_FILTERS.filter(match).map((relLabel) => {
                    const cfg = draftFilters.related?.[relLabel];
                    const isChecked = !!cfg?.enabled;
                    const isExpanded = expandedRel === relLabel || isChecked;
                    const op = cfg?.operator || 'is not empty';

                    return (
                      <div key={relLabel}>
                        <div className={cbRow}>
                          <input
                            type="checkbox"
                            className="accent-[#2F55D4] shrink-0"
                            checked={isChecked}
                            onChange={() => toggleRelDraft(relLabel)}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!isChecked) toggleRelDraft(relLabel);
                              else setExpandedRel(expandedRel === relLabel ? null : relLabel);
                            }}
                            className="flex-1 flex items-center justify-between text-left truncate"
                            title={relLabel}
                          >
                            <span className="truncate">{relLabel}</span>
                            <ChevronDown size={12} className={`shrink-0 transition-transform ${isExpanded ? 'rotate-180 text-[#2F55D4]' : 'text-[#8B95AE]'}`} />
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="pl-5 pr-2.5 pb-2.5 pt-1.5 space-y-1.5 bg-[#F8FAFD] border-y border-[#EEF1F7]">
                            {relLabel === 'Campaigns (Connected Records)' && (
                              <select
                                value={cfg?.campaignType || '-Select Campaign Type-'}
                                onChange={(e) => updateRelDraft(relLabel, { enabled: true, campaignType: e.target.value })}
                                className="w-full h-7 px-2 rounded border border-[#D5DBE8] bg-white text-[12.5px] text-[#1F2A44]"
                              >
                                {CAMPAIGN_TYPES.map((ct) => (
                                  <option key={ct} value={ct}>{ct}</option>
                                ))}
                              </select>
                            )}
                            <select
                              value={op}
                              onChange={(e) => updateRelDraft(relLabel, { enabled: true, operator: e.target.value })}
                              className="w-full h-7 px-2 rounded border border-[#D5DBE8] bg-white text-[12.5px] text-[#1F2A44]"
                            >
                              {OPERATORS_BY_TYPE.text.map((o) => (
                                <option key={o} value={o}>{o}</option>
                              ))}
                            </select>
                            {!['is empty', 'is not empty'].includes(op) && (
                              <input
                                type="text"
                                placeholder="Filter related records..."
                                value={cfg?.value || ''}
                                onChange={(e) => updateRelDraft(relLabel, { enabled: true, value: e.target.value })}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleApplyFilters(); }}
                                className="w-full h-7 px-2 rounded border border-[#D5DBE8] bg-white text-[12.5px] text-[#1F2A44]"
                              />
                            )}
                            <div className="text-[11.5px] text-[#6B7696]">
                              Matching leads in tab: {byTab.filter((l) => getRelatedRecordsForLead(l, relLabel, crm).length > 0).length}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </Section>
              </div>

              {/* Sticky Apply Filter / Clear Footer */}
              <div className="p-3 border-t border-[#E3E8F2] bg-[#F8FAFD] flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleApplyFilters}
                  className="flex-1 h-9 rounded-lg bg-[#2F55D4] hover:bg-[#2748B8] text-white text-[14px] font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                >
                  <Check size={15} /> Apply Filter
                </button>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="h-9 px-3.5 rounded-lg border border-[#D5DBE8] bg-white hover:bg-[#F1F4FA] text-[#1F2A44] text-[14px] font-medium shrink-0 transition-colors"
                >
                  Clear
                </button>
              </div>
            </aside>

            {/* Drag-to-Resize Handle */}
            <ResizeDivider
              isDragging={isResizingSidebar}
              onMouseDown={startResizeSidebar}
              onDoubleClick={resetSidebarWidth}
            />
          </>
        )}

        {/* ---- Main Content Area (Table / Kanban / Grid / Timeline) ---- */}
        <div className="flex-1 min-w-0 flex flex-col border-t border-[#E3E8F2]">
          {viewMode === 'kanban' ? (
            <div className="overflow-x-auto thin-scroll h-[calc(100vh-176px)] p-3 flex gap-3 bg-[#F8FAFC]">
              {['New', 'Assigned', 'Contacted', 'Qualified', 'Proposal', 'Converted'].map((stKey) => {
                const colLeads = filtered.filter((l) => (l.status || 'New') === stKey);
                const stStyle = STATUS_STYLE[stKey] || { bg: '#2F55D4', fg: '#fff' };
                return (
                  <div key={stKey} className="w-[270px] shrink-0 bg-white border border-[#E3E8F2] rounded flex flex-col max-h-full">
                    <div className="p-3 border-b border-[#EEF1F7] flex items-center justify-between">
                      <Pill s={stStyle}>{stKey}</Pill>
                      <span className="text-[13px] font-semibold text-[#6B7696]">{colLeads.length}</span>
                    </div>
                    <div className="p-2.5 space-y-2.5 overflow-y-auto thin-scroll flex-1">
                      {colLeads.map((l) => (
                        <div
                          key={l.id}
                          onClick={() => navigate(`/leads/${l.id}`)}
                          className="p-3 rounded border border-[#EEF1F7] hover:border-[#2F55D4] bg-white shadow-xs cursor-pointer space-y-1.5 text-[14px]"
                        >
                          <div className="font-semibold text-[#1F2A44]">{l.name}</div>
                          <div className="text-[13px] text-[#5B6684]">{l.company} • {l.city}</div>
                          <div className="text-[13px] text-[#2A3350] flex items-center justify-between pt-1">
                            <span>{l.mobile || l.phone}</span>
                            <span className="text-[12.5px] text-[#6B7696]">{userName(l.ownerId)}</span>
                          </div>
                        </div>
                      ))}
                      {colLeads.length === 0 && (
                        <div className="text-center py-8 text-[13.5px] text-[#8B95AE]">No leads in {stKey}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="overflow-auto thin-scroll h-[calc(100vh-176px)] p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-[#F8FAFC]">
              {rows.map((l) => {
                const st = STATUS_STYLE[l.status];
                return (
                  <div
                    key={l.id}
                    onClick={() => navigate(`/leads/${l.id}`)}
                    className="p-3.5 bg-white rounded border border-[#E3E8F2] hover:border-[#2F55D4] cursor-pointer space-y-1.5 text-[14px]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#1F2A44]">{l.name}</span>
                      {st && <Pill s={st}>{l.status}</Pill>}
                    </div>
                    <div className="text-[#5B6684] text-[13.5px]">{l.company} — {leadCategory(l)}</div>
                    <div className="text-[#2A3350] text-[13.5px]">{l.mobile || l.phone} • {l.city}</div>
                    <div className="flex items-center justify-between pt-1.5 border-t border-[#EEF1F7] text-[13px] text-[#6B7696]">
                      <span>Owner: {userName(l.ownerId)}</span>
                      <span>{l.createdTime}</span>
                    </div>
                  </div>
                );
              })}
              {rows.length === 0 && (
                <div className="col-span-full text-center py-16 text-[#8B95AE] text-[14px]">No records found</div>
              )}
            </div>
          ) : (
            <div className="overflow-auto thin-scroll h-[calc(100vh-176px)]">
              <table className="w-full text-[14px] border-collapse min-w-[1180px]">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="text-left text-[#1F2A44]">
                    <th className="w-9 px-2.5 h-11 border-b border-[#E3E8F2]">
                      <input
                        type="checkbox"
                        className="accent-[#2F55D4] h-4 w-4"
                        checked={allChecked}
                        onChange={() => setSelected(allChecked ? new Set() : new Set(rows.map((r) => r.id)))}
                      />
                    </th>
                    {visibleColumns.map((col) => {
                      const colW = zohoCustomConfig.columnWidths?.[col.key] || col.width || 145;
                      const displayLabel = zohoCustomConfig.fieldLabels?.[col.key] || col.label;
                      const sortMap = {
                        leadName: 'name',
                        createdTime: 'createdOn',
                        city: 'city',
                        leadStatus: 'status',
                        leadOwner: 'owner',
                      };
                      const sf = sortMap[col.key];
                      return (
                        <th
                          key={col.key}
                          style={{ width: `${colW}px`, minWidth: `${colW}px` }}
                          onClick={() => {
                            if (sf) {
                              updateLeadsUiState({ sortField: sf, sortDir: sortField === sf && sortDir === 'desc' ? 'asc' : 'desc' });
                            }
                          }}
                          className="relative group/th px-3 h-11 font-semibold text-[13.5px] whitespace-nowrap border-b border-[#E3E8F2] cursor-pointer select-none hover:bg-[#F8FAFC]"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span>
                              {displayLabel}
                              {col.key === 'createdTime' && <span className="ml-1 text-[11px]">*</span>}
                            </span>
                            {sf && sortField === sf && (
                              <span className="text-[11px] text-[#2F55D4] font-bold">{sortDir === 'asc' ? '▲' : '▼'}</span>
                            )}
                          </div>
                          {/* Column Resize Drag Handle */}
                          <span
                            title="Drag to resize column"
                            onMouseDown={(e) => handleStartColumnResize(e, col.key, col.width)}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-1.5 bottom-1.5 w-[5px] cursor-col-resize rounded hover:bg-[#2F55D4]/60 group-hover/th:bg-[#CBD5E1]"
                          />
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((l) => {
                    const src = leadSource(l);
                    const ss = SOURCE_STYLE[src];
                    const customStBg = zohoCustomConfig.statusColors?.[l.status];
                    const st = customStBg ? { bg: customStBg, fg: '#fff' } : STATUS_STYLE[l.status];
                    const customTagBg = zohoCustomConfig.tagColors?.[l.tag];
                    const leadAgingDays = l.leadAging != null
                      ? `${l.leadAging} Days`
                      : l.createdOn
                      ? `${Math.max(1, Math.round((new Date('2026-04-20') - new Date(l.createdOn)) / 86400000))} Days`
                      : '2 Days';
                    const activityAgingText = l.leadActivityAging != null
                      ? `${l.leadActivityAging} Days`
                      : '1 Day';

                    return (
                      <tr
                        key={l.id}
                        className="hover:bg-[#F6F8FD] border-b border-[#EEF1F7] cursor-pointer group"
                        onClick={() => navigate(`/leads/${l.id}`, { state: { from: '/leads' } })}
                      >
                        <td className="px-2.5 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="accent-[#2F55D4] h-4 w-4"
                            checked={selected.has(l.id)}
                            onChange={() => toggleRowSelect(l.id)}
                          />
                        </td>

                        {visibleColumns.map((col) => {
                          const colW = zohoCustomConfig.columnWidths?.[col.key] || col.width || 145;
                          if (col.key === 'leadName') {
                            return (
                              <td key={col.key} style={{ maxWidth: `${colW}px` }} className="px-3 py-3 text-[#1F2A44] font-medium whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <span className="truncate hover:text-[#2F55D4] hover:underline">{l.name}</span>
                                  <button
                                    type="button"
                                    title="Edit Lead"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/leads/${l.id}/edit`, { state: { from: '/leads' } });
                                    }}
                                    className="opacity-0 group-hover:opacity-100 text-[#6B7696] hover:text-[#2F55D4]"
                                  >
                                    <Edit3 size={13} />
                                  </button>
                                </div>
                              </td>
                            );
                          }
                          if (col.key === 'createdTime') {
                            return (
                              <td key={col.key} className="px-3 py-3 whitespace-nowrap text-[#2A3350]">
                                {l.createdTime || l.createdOn}
                              </td>
                            );
                          }
                          if (col.key === 'category') {
                            return (
                              <td key={col.key} style={{ maxWidth: `${colW}px` }} className="px-3 py-3 text-[#2A3350] truncate">
                                {leadCategory(l)}
                              </td>
                            );
                          }
                          if (col.key === 'mobile') {
                            return (
                              <td key={col.key} className="px-3 py-3 whitespace-nowrap text-[#2A3350]">
                                {l.mobile || l.phone}
                                <button
                                  type="button"
                                  title="Call / Log Call"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCallLeadModal(l);
                                  }}
                                  className="inline-flex ml-1.5 align-middle h-5 w-5 p-1 rounded-full bg-[#1DB54A] hover:bg-[#169B3D] items-center justify-center"
                                >
                                  <Phone size={11} className="text-white" />
                                </button>
                              </td>
                            );
                          }
                          if (col.key === 'city') {
                            return <td key={col.key} className="px-3 py-3 text-[#2A3350] whitespace-nowrap">{l.city || '—'}</td>;
                          }
                          if (col.key === 'remarks') {
                            return (
                              <td key={col.key} style={{ maxWidth: `${colW}px` }} className="px-3 py-3 text-[#2A3350] truncate">
                                {l.remarks || '—'}
                              </td>
                            );
                          }
                          if (col.key === 'tags') {
                            const tagOptions = (zohoCustomConfig.customTags?.length ? zohoCustomConfig.customTags : LEAD_TAGS).filter(
                              (t) => t && String(t).trim().toLowerCase() !== 'hot lead'
                            );
                            return (
                              <td key={col.key} className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                                {inlineCell?.leadId === l.id && inlineCell?.field === 'tag' ? (
                                  <select
                                    autoFocus
                                    value={l.tag && l.tag !== 'Lead' ? l.tag : ''}
                                    onBlur={() => setInlineCell(null)}
                                    onChange={(e) => {
                                      updateRecord('leads', l.id, { tag: e.target.value, tagField: e.target.value });
                                      setInlineCell(null);
                                    }}
                                    className="h-8 px-2 rounded border border-[#2F55D4] bg-white text-[13.5px]"
                                  >
                                    <option value="">-None-</option>
                                    {tagOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                                  </select>
                                ) : (
                                  <div
                                    onClick={() => setInlineCell({ leadId: l.id, field: 'tag' })}
                                    title="Click to update Tag"
                                    className="min-h-[22px] inline-flex items-center"
                                  >
                                    {l.tag && l.tag !== 'Lead' ? (
                                      customTagBg ? (
                                        <span
                                          className="inline-flex items-center h-[22px] px-2.5 text-[12.5px] font-semibold whitespace-nowrap text-white"
                                          style={{ background: customTagBg, clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%)', paddingRight: 12 }}
                                        >
                                          {l.tag}
                                        </span>
                                      ) : (
                                        <TagPill tag={l.tag} />
                                      )
                                    ) : (
                                      <span className="opacity-0 group-hover:opacity-100 text-[13px] text-[#8B95AE] hover:text-[#2F55D4]">+ Tag</span>
                                    )}
                                  </div>
                                )}
                              </td>
                            );
                          }
                          if (col.key === 'leadStatus') {
                            const statusOptions = zohoCustomConfig.customStatuses?.length ? zohoCustomConfig.customStatuses : LEAD_STATUSES;
                            return (
                              <td key={col.key} className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                                {inlineCell?.leadId === l.id && inlineCell?.field === 'status' ? (
                                  <select
                                    autoFocus
                                    value={l.status || 'New'}
                                    onBlur={() => setInlineCell(null)}
                                    onChange={(e) => {
                                      updateRecord('leads', l.id, { status: e.target.value });
                                      setInlineCell(null);
                                    }}
                                    className="h-8 px-2 rounded border border-[#2F55D4] bg-white text-[13.5px]"
                                  >
                                    {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                                  </select>
                                ) : (
                                  <div onClick={() => setInlineCell({ leadId: l.id, field: 'status' })} title="Click to change Lead Status">
                                    {st ? <Pill s={st}>{l.status}</Pill> : <span className="text-[#2A3350]">{l.status || 'New'}</span>}
                                  </div>
                                )}
                              </td>
                            );
                          }
                          if (col.key === 'leadSource') {
                            const sourceOptions = zohoCustomConfig.customSources?.length ? zohoCustomConfig.customSources : LEAD_SOURCES;
                            return (
                              <td key={col.key} className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                                {inlineCell?.leadId === l.id && inlineCell?.field === 'source' ? (
                                  <select
                                    autoFocus
                                    value={src}
                                    onBlur={() => setInlineCell(null)}
                                    onChange={(e) => {
                                      updateRecord('leads', l.id, { source: e.target.value, leadSource: e.target.value });
                                      setInlineCell(null);
                                    }}
                                    className="h-8 px-2 rounded border border-[#2F55D4] bg-white text-[13.5px]"
                                  >
                                    {sourceOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                                  </select>
                                ) : (
                                  <div onClick={() => setInlineCell({ leadId: l.id, field: 'source' })} title="Click to change Lead Source">
                                    {ss ? <Pill s={ss}>{ss.label || src}</Pill> : <span className="text-[#2A3350]">{src}</span>}
                                  </div>
                                )}
                              </td>
                            );
                          }
                          if (col.key === 'leadOwner') {
                            return (
                              <td key={col.key} className="px-3 py-3 text-[#2A3350] whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                {inlineCell?.leadId === l.id && inlineCell?.field === 'owner' ? (
                                  <select
                                    autoFocus
                                    value={l.ownerId || 'u4'}
                                    onBlur={() => setInlineCell(null)}
                                    onChange={(e) => {
                                      updateRecord('leads', l.id, { ownerId: e.target.value });
                                      setInlineCell(null);
                                    }}
                                    className="h-8 px-2 rounded border border-[#2F55D4] bg-white text-[13.5px]"
                                  >
                                    {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                                  </select>
                                ) : (
                                  <span
                                    onClick={() => setInlineCell({ leadId: l.id, field: 'owner' })}
                                    title="Click to reassign Lead Owner"
                                    className="hover:text-[#2F55D4]"
                                  >
                                    {userName(l.ownerId)}
                                  </span>
                                )}
                              </td>
                            );
                          }
                          if (col.key === 'leadManager1') {
                            return (
                              <td key={col.key} className="px-3 py-3 text-[#2A3350] whitespace-nowrap">
                                {l.leadManager1 || l.allottedLeadManager || 'Gautam S.'}
                              </td>
                            );
                          }
                          if (col.key === 'leadAging') {
                            return (
                              <td key={col.key} className="px-3 py-3 text-[#2A3350] whitespace-nowrap font-medium">
                                {leadAgingDays}
                              </td>
                            );
                          }
                          if (col.key === 'callStartTime') {
                            return (
                              <td key={col.key} className="px-3 py-3 text-[#2A3350] whitespace-nowrap">
                                {l.callStartTime || l.lastActivityTime || l.createdTime || '—'}
                              </td>
                            );
                          }
                          if (col.key === 'leadActivityAging') {
                            return (
                              <td key={col.key} className="px-3 py-3 text-[#2A3350] whitespace-nowrap">
                                {activityAgingText}
                              </td>
                            );
                          }
                          if (col.key === 'company') {
                            return <td key={col.key} className="px-3 py-3 text-[#2A3350] whitespace-nowrap">{l.company || '—'}</td>;
                          }
                          if (col.key === 'email') {
                            return <td key={col.key} className="px-3 py-3 text-[#2A3350] whitespace-nowrap">{l.email || '—'}</td>;
                          }
                          if (col.key === 'leadNo') {
                            return <td key={col.key} className="px-3 py-3 text-[#2A3350] whitespace-nowrap">{l.leadNo || l.id}</td>;
                          }
                          if (col.key === 'phone') {
                            return <td key={col.key} className="px-3 py-3 text-[#2A3350] whitespace-nowrap">{l.phone || l.mobile || '—'}</td>;
                          }
                          if (col.key === 'directCallDuration') {
                            return <td key={col.key} className="px-3 py-3 text-[#2A3350] whitespace-nowrap">{l.directCallDuration ?? '00:04:15'}</td>;
                          }
                          if (col.key === 'performance') {
                            return <td key={col.key} className="px-3 py-3 text-[#2A3350] whitespace-nowrap">{l.performance || 'Good'}</td>;
                          }
                          return (
                            <td key={col.key} className="px-3 py-3 text-[#2A3350] whitespace-nowrap">
                              {l[col.key] || '—'}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                  {rows.length === 0 && (
                    <tr><td colSpan={visibleColumns.length + 1} className="text-center py-16 text-[#8B95AE] text-[14px]">No records found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ---- Footer ---- */}
          <div className="flex items-center justify-between h-11 px-4 border-t border-[#E3E8F2] text-[14px] text-[#2A3350]">
            <span>Total Records <b>{filtered.length}</b></span>
            <div className="flex items-center gap-3">
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="h-8 px-2.5 border border-[#D5DBE8] rounded-md text-[13.5px] bg-white"
              >
                {[10, 20, 30, 50, 100].map((n) => <option key={n} value={n}>{n} Records Per Page</option>)}
              </select>
              <button type="button" disabled={cur <= 1} onClick={() => setPage(cur - 1)} className="disabled:opacity-30"><ChevronLeft size={16} /></button>
              <b>{from} to {to}</b>
              <button type="button" disabled={cur >= pageCount} onClick={() => setPage(cur + 1)} className="disabled:opacity-30"><ChevronRight size={16} /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Create / Edit / Clone Custom View Modal */}
      <Modal
        open={!!viewEditorModal}
        onClose={() => setViewEditorModal(null)}
        title={
          viewEditorModal?.mode === 'edit'
            ? `Edit View — ${viewEditorModal.originalName}`
            : viewEditorModal?.mode === 'clone'
            ? `Clone View — ${viewEditorModal.originalName}`
            : 'New Custom View'
        }
        size="md"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setViewEditorModal(null)}>Cancel</button>
            <button type="button" className="btn-primary" onClick={handleSaveViewEditor}>Save View</button>
          </>
        }
      >
        {viewEditorModal && (
          <div className="space-y-4 text-[13.5px]">
            <label className="block text-[#4B5578] font-medium">
              View Name
              <input
                className="input mt-1"
                disabled={viewEditorModal.mode === 'edit' && PROTECTED_PUBLIC_VIEWS.has(viewEditorModal.originalName)}
                placeholder="e.g. High Value Enterprise Leads"
                value={viewEditorModal.name}
                onChange={(e) => setViewEditorModal({ ...viewEditorModal, name: e.target.value })}
              />
            </label>

            <div className="p-3.5 rounded-lg bg-[#F8FAFD] border border-[#E3E8F2] space-y-2.5">
              <div className="text-[13px] font-semibold text-[#1F2A44]">Specify Criteria</div>
              <div className="grid sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[12px] text-[#5B6684] mb-1">Field</label>
                  <select
                    className="input !h-9 text-[13px]"
                    value={viewEditorModal.field}
                    onChange={(e) => setViewEditorModal({ ...viewEditorModal, field: e.target.value })}
                  >
                    {FIELD_FILTERS.map((f) => (
                      <option key={f.label} value={f.label}>{f.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] text-[#5B6684] mb-1">Operator</label>
                  <select
                    className="input !h-9 text-[13px]"
                    value={viewEditorModal.operator}
                    onChange={(e) => setViewEditorModal({ ...viewEditorModal, operator: e.target.value })}
                  >
                    {(OPERATORS_BY_TYPE[FIELD_FILTERS.find((f) => f.label === viewEditorModal.field)?.type || 'text'] || OPERATORS_BY_TYPE.text).map((op) => (
                      <option key={op} value={op}>{op}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] text-[#5B6684] mb-1">Value</label>
                  <input
                    className="input !h-9 text-[13px]"
                    placeholder="Criteria value..."
                    value={viewEditorModal.value}
                    onChange={(e) => setViewEditorModal({ ...viewEditorModal, value: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block text-[#4B5578] font-medium">
                Share This View With
                <select
                  className="input mt-1"
                  value={viewEditorModal.visibility}
                  onChange={(e) => setViewEditorModal({ ...viewEditorModal, visibility: e.target.value })}
                >
                  <option value="Public">Everyone (Public View)</option>
                  <option value="Only Me">Only Me (Private)</option>
                </select>
              </label>
              <label className="flex items-center gap-2.5 pt-6 text-[#1F2A44] font-medium cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-[#2F55D4] h-4 w-4"
                  checked={!!viewEditorModal.pin}
                  onChange={(e) => setViewEditorModal({ ...viewEditorModal, pin: e.target.checked })}
                />
                <span>Pin this view to top navigation bar</span>
              </label>
            </div>
          </div>
        )}
      </Modal>

      {/* Manage Custom Views Modal */}
      <Modal
        open={manageViewsModalOpen}
        onClose={() => setManageViewsModalOpen(false)}
        title="Manage Custom Views"
        size="lg"
        footer={<button type="button" className="btn-primary" onClick={() => setManageViewsModalOpen(false)}>Done</button>}
      >
        <div className="space-y-3 text-[13px]">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B95AE]" />
              <input
                className="input !h-9 pl-9"
                placeholder="Search public and custom views..."
                value={manageViewsSearch}
                onChange={(e) => setManageViewsSearch(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setManageViewsModalOpen(false);
                handleOpenViewEditor('create');
              }}
              className="btn-primary !h-9"
            >
              <Plus size={14} /> New Custom View
            </button>
          </div>

          <div className="max-h-[380px] overflow-y-auto thin-scroll border border-[#E3E8F2] rounded-lg divide-y divide-[#EEF1F7]">
            {allPublicAndCustomViews
              .filter((v) => !manageViewsSearch || v.toLowerCase().includes(manageViewsSearch.toLowerCase()))
              .map((vName) => {
                const isPinned = pinnedTabs.includes(vName);
                const isProtected = PROTECTED_PUBLIC_VIEWS.has(vName);
                return (
                  <div key={vName} className="flex items-center justify-between px-3.5 py-2.5 hover:bg-[#F8FAFC]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        title={isPinned ? 'Unpin from top bar' : 'Pin to top bar'}
                        onClick={() => handleTogglePinView(vName)}
                        className={`p-1 rounded ${isPinned ? 'text-[#2F55D4] bg-[#EAF2FF]' : 'text-[#94A3B8] hover:text-[#1F2A44]'}`}
                      >
                        <Pin size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTab(vName);
                          setManageViewsModalOpen(false);
                        }}
                        className="font-medium text-[#1F2A44] hover:text-[#2F55D4] truncate"
                      >
                        {vName}
                      </button>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#64748B]">
                        {isProtected ? 'Public View' : 'Custom View'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setManageViewsModalOpen(false);
                          handleOpenViewEditor('edit', vName);
                        }}
                        className="px-2 py-1 rounded border border-[#D5DBE8] text-[12px] hover:bg-white inline-flex items-center gap-1"
                      >
                        <Edit3 size={12} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setManageViewsModalOpen(false);
                          handleOpenViewEditor('clone', vName);
                        }}
                        className="px-2 py-1 rounded border border-[#D5DBE8] text-[12px] hover:bg-white inline-flex items-center gap-1"
                      >
                        <Copy size={12} /> Clone
                      </button>
                      <button
                        type="button"
                        disabled={isProtected}
                        title={isProtected ? 'Protected Public View cannot be deleted' : 'Delete Custom View'}
                        onClick={() => handleRequestDeleteView(vName)}
                        className="px-2 py-1 rounded border border-[#D5DBE8] text-[12px] text-rose-600 hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </Modal>

      {/* Delete Custom View Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingViewName}
        onClose={() => setDeletingViewName(null)}
        onConfirm={handleConfirmDeleteView}
        title="Delete Custom View"
        message={`Are you sure you want to delete the custom view "${deletingViewName}"?`}
      />

      {/* Quick Edit Lead Modal */}
      <Modal
        open={!!editingLead}
        onClose={() => setEditingLead(null)}
        title="Edit Lead"
        size="md"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setEditingLead(null)}>Cancel</button>
            <button type="button" className="btn-primary" onClick={handleSaveEditLead}>Save Changes</button>
          </>
        }
      >
        {editingLead && (
          <div className="grid sm:grid-cols-2 gap-3 text-[13px]">
            <label className="text-[#4B5578]">
              Lead Name
              <input className="input mt-1" value={editingLead.name || ''} onChange={(e) => setEditingLead({ ...editingLead, name: e.target.value })} />
            </label>
            <label className="text-[#4B5578]">
              Company
              <input className="input mt-1" value={editingLead.company || ''} onChange={(e) => setEditingLead({ ...editingLead, company: e.target.value })} />
            </label>
            <label className="text-[#4B5578]">
              Mobile
              <input className="input mt-1" value={editingLead.mobile || editingLead.phone || ''} onChange={(e) => setEditingLead({ ...editingLead, mobile: e.target.value })} />
            </label>
            <label className="text-[#4B5578]">
              Email
              <input className="input mt-1" value={editingLead.email || ''} onChange={(e) => setEditingLead({ ...editingLead, email: e.target.value })} />
            </label>
            <label className="text-[#4B5578]">
              City
              <input className="input mt-1" value={editingLead.city || ''} onChange={(e) => setEditingLead({ ...editingLead, city: e.target.value })} />
            </label>
            <label className="text-[#4B5578]">
              Category
              <input className="input mt-1" value={editingLead.category || editingLead.industry || ''} onChange={(e) => setEditingLead({ ...editingLead, category: e.target.value, industry: e.target.value })} />
            </label>
            <label className="text-[#4B5578]">
              Lead Status
              <select className="input mt-1" value={editingLead.status || 'New'} onChange={(e) => setEditingLead({ ...editingLead, status: e.target.value })}>
                {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="text-[#4B5578]">
              Lead Source
              <select className="input mt-1" value={editingLead.source || 'Website'} onChange={(e) => setEditingLead({ ...editingLead, source: e.target.value })}>
                {LEAD_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="text-[#4B5578]">
              Lead Owner
              <select className="input mt-1" value={editingLead.ownerId || 'u4'} onChange={(e) => setEditingLead({ ...editingLead, ownerId: e.target.value })}>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </label>
            <label className="text-[#4B5578]">
              Tag
              <select className="input mt-1" value={editingLead.tag || 'Lead'} onChange={(e) => setEditingLead({ ...editingLead, tag: e.target.value, tagField: e.target.value })}>
                {LEAD_TAGS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="text-[#4B5578] sm:col-span-2">
              Remarks
              <textarea className="input mt-1 !h-20 py-2" value={editingLead.remarks || ''} onChange={(e) => setEditingLead({ ...editingLead, remarks: e.target.value })} />
            </label>
          </div>
        )}
      </Modal>

      {/* Call / Log Call Modal */}
      <Modal
        open={!!callLeadModal}
        onClose={() => setCallLeadModal(null)}
        title={callLeadModal ? `Call ${callLeadModal.name}` : 'Call Lead'}
        size="sm"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setCallLeadModal(null)}>Cancel</button>
            <button type="button" className="btn-primary" onClick={handleLogQuickCall}>Log Completed Call</button>
          </>
        }
      >
        {callLeadModal && (
          <div className="space-y-3 text-[13px]">
            <div className="p-3 rounded bg-[#F3F6FB] border border-[#D5DBE8]">
              <div className="font-semibold text-[#1F2A44]">{callLeadModal.name} ({callLeadModal.company})</div>
              <div className="text-[#2F55D4] font-medium mt-0.5">{callLeadModal.mobile || callLeadModal.phone}</div>
            </div>
            <label className="block text-[#4B5578]">
              Call Summary / Notes
              <textarea
                className="input mt-1 !h-20 py-2"
                placeholder="Discuss requirements, pricing, or next steps..."
                value={callNote}
                onChange={(e) => setCallNote(e.target.value)}
              />
            </label>
          </div>
        )}
      </Modal>

      {/* Map View Modal */}
      <Modal
        open={mapModalOpen}
        onClose={() => setMapModalOpen(false)}
        title={`Leads Map View (${filtered.length} records)`}
        size="lg"
        footer={<button type="button" className="btn-primary" onClick={() => setMapModalOpen(false)}>Close</button>}
      >
        <div className="space-y-3 text-[13px]">
          <div className="grid sm:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto thin-scroll">
            {Object.entries(
              filtered.reduce((acc, l) => {
                const c = l.city || 'Other';
                acc[c] = acc[c] || [];
                acc[c].push(l);
                return acc;
              }, {})
            ).map(([city, list]) => (
              <div key={city} className="p-3 rounded border border-[#E3E8F2] bg-[#F8FAFC]">
                <div className="flex items-center justify-between font-semibold text-[#1F2A44] mb-1.5">
                  <span className="inline-flex items-center gap-1"><MapIcon size={13} className="text-[#2F55D4]" /> {city}</span>
                  <span className="text-[11.5px] bg-[#2F55D4] text-white rounded-full px-2">{list.length}</span>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto thin-scroll">
                  {list.map((l) => (
                    <div
                      key={l.id}
                      onClick={() => { setMapModalOpen(false); navigate(`/leads/${l.id}`); }}
                      className="text-[12.5px] text-[#2F55D4] hover:underline cursor-pointer truncate"
                    >
                      {l.name} — {l.branchArea || l.street || l.city}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Save Current Filter Modal */}
      <Modal
        open={saveFilterModalOpen}
        onClose={() => setSaveFilterModalOpen(false)}
        title="Save Current Filter"
        size="sm"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setSaveFilterModalOpen(false)}>Cancel</button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                if (!newSavedFilterName.trim()) return;
                const nextSaved = [
                  ...savedFilters,
                  {
                    id: `sf-${Date.now()}`,
                    name: newSavedFilterName.trim(),
                    system: structuredClone(draftFilters.system || {}),
                    fields: structuredClone(draftFilters.fields || {}),
                    related: structuredClone(draftFilters.related || {}),
                  },
                ];
                updateLeadsUiState({ savedFilters: nextSaved });
                setNewSavedFilterName('');
                setSaveFilterModalOpen(false);
                notify(`Saved filter "${newSavedFilterName.trim()}"`, 'success');
              }}
            >
              Save Filter
            </button>
          </>
        }
      >
        <label className="block text-[13px] text-[#4B5578]">
          Filter Name
          <input
            className="input mt-1"
            placeholder="e.g. Active Zoho Campaigns Leads"
            value={newSavedFilterName}
            onChange={(e) => setNewSavedFilterName(e.target.value)}
          />
        </label>
      </Modal>

      {/* Delete Leads Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingIds}
        onClose={() => setDeletingIds(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Leads"
        message={`Are you sure you want to permanently delete ${deletingIds?.length || 0} selected lead record(s)?`}
      />

      {/* Import / Bulk Import / Export Leads Modal */}
      <LeadsImportExportModal
        open={importExportModal.open}
        mode={importExportModal.mode}
        onClose={() => setImportExportModal({ open: false, mode: 'import' })}
        leads={leads}
        filteredLeads={filtered}
        selectedLeadIds={selected}
        userName={userName}
        createRecord={createRecord}
        updateRecord={updateRecord}
        rolePermissions={
          zohoCustomConfig.rolePermissions?.[zohoCustomConfig.activeRole] || {
            canImport: true,
            canBulkImport: true,
            canExport: true,
          }
        }
        activeRole={zohoCustomConfig.activeRole || 'Administrator'}
        onNotify={notify}
      />

      {/* Zoho-Style Module, Column & Field Customization Modal */}
      <ZohoCustomizationModal
        open={customizeModal.open}
        initialTab={customizeModal.tab}
        onClose={() => setCustomizeModal({ open: false, tab: 'columns' })}
        onNotify={notify}
      />
    </div>
  );
}
