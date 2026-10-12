import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertCircle, Bookmark, BookmarkPlus, CalendarCheck2, Check, ChevronDown,
  Download, Edit3, ExternalLink, Eye, FileSpreadsheet, Filter, FolderKanban,
  Lock, Mail, MapPin, MessageSquarePlus, Paperclip, Pencil, Phone,
  Plus, RotateCcw, Search, Send, Shield, SlidersHorizontal, Tag, Trash2,
  Upload, UserCog, X,
} from 'lucide-react';
import CreateContact from './CreateContact';
import ContactDetail from './ContactDetail';
import RecordTimeline from '../../components/common/RecordTimeline';
import WhatsAppComposerModal, { WhatsAppIcon } from '../../components/common/WhatsAppComposerModal';
import CSVImportModal from '../../components/common/CSVImportModal';
import SpreadsheetView, { formatScreenshotDateTime } from '../../components/common/SpreadsheetView';
import SplitView from '../../components/common/SplitView';
import ModuleTimelineView from '../../components/common/ModuleTimelineView';
import { useCRM } from '../../context/CRMContext';
import PageHeader, { useHeaderBarMode } from '../../components/common/PageHeader';
import DataTable, { ColumnChooserMenu, useColumnLayout } from '../../components/common/DataTable';
import Pagination, { RecordSelectionSummary } from '../../components/common/Pagination';
import useTable from '../../components/common/useTable';
import StatusBadge from '../../components/common/StatusBadge';
import { PersonAvatar, UserAvatar } from '../../components/common/Avatar';
import ActionMenu from '../../components/common/ActionMenu';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Drawer, DetailGrid, SectionTitle } from '../../components/common/Modal';
import Modal from '../../components/common/Modal';
import Dropdown, { MenuDivider, MenuItem, MenuLabel } from '../../components/common/Dropdown';
import BulkBar, { BulkButton } from '../../components/common/BulkBar';
import { ChartView, GridStatusPill, GridView, KanbanView } from '../../components/common/Views';
import { useRefresh } from '../../components/common/hooks';
import { useToast } from '../../components/common/Toast';
import { LEAD_SOURCES, LIFECYCLES, SALUTATIONS, VENDORS } from '../../data/seedData';
import { addDays, fmtDate, fmtINR, fmtTime, todayISO } from '../../utils/calculations';
import { exportCSV } from '../../utils/exportCSV';
import {
  CONTACT_FIELD_FILTERS,
  OPERATORS_BY_TYPE,
  RELATED_CONDITION_MODES,
  RELATED_MODULE_FILTERS,
  SYSTEM_DEFINED_FILTERS,
  WEBSITE_ACTIVITY_FILTERS,
  evaluateContactFilters,
  getRelatedRecordsForContact,
  searchFilterCatalog,
} from '../../utils/contactsFilterEngine';

const LIFECYCLE_COLORS = {
  New: '#6366F1',
  Contacted: '#FF7B3A',
  Engaged: '#8E3CF2',
  Qualified: '#12C26B',
  Customer: '#14B8A6',
};

const FILTER_STORAGE_KEY = 'zcrm.v1.contactsFilterState';

function loadPersistedFilterState() {
  try {
    const raw = localStorage.getItem(FILTER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function savePersistedFilterState(state) {
  try {
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function FollowUpTag({ date }) {
  if (!date) return null;
  const today = todayISO();
  const label = date === today ? 'Today' : fmtDate(date).slice(3, 6) + ' ' + Number(fmtDate(date).slice(0, 2));
  const tone =
    date === today
      ? 'bg-[#FFF3D3] text-[#C98500] border-[#F7D27B]'
      : date < today
      ? 'bg-[#FFE9EA] text-[#E5293A] border-[#FBC2C7]'
      : 'bg-[#E3F8EE] text-[#0E9F5E] border-[#A8E5C7]';
  return (
    <span
      title={`Follow-up ${date < today ? 'was due' : 'due'} ${fmtDate(date)}`}
      className={`inline-flex items-center gap-1 h-[24px] pl-1.5 pr-2.5 text-[11.5px] font-medium border rounded-l-md ${tone}`}
      style={{ clipPath: 'polygon(0 0, 88% 0, 100% 50%, 88% 100%, 0 100%)' }}
    >
      <CalendarCheck2 size={12} />
      {label}
    </span>
  );
}

function HighlightMatch({ text, query }) {
  const q = String(query || '').trim();
  if (!q) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return <>{text}</>;
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + q.length);
  const after = text.slice(idx + q.length);
  return (
    <>
      {before}
      <mark className="bg-[#FEF08A] text-[#0F172A] rounded px-0.5 font-semibold">{match}</mark>
      {after}
    </>
  );
}

function splitAt(email = '') {
  const i = email.indexOf('@');
  return i < 0 ? [email, ''] : [email.slice(0, i + 1), email.slice(i + 1)];
}

export default function Contacts({ isCreatePage = false }) {
  const crm = useCRM();
  const {
    contacts,
    accounts,
    deals,
    calls,
    invoices,
    tasks,
    users,
    contactRelations = {},
    savedContactViews = [],
    savedContactSplitViews = [],
    accountsById,
    usersById,
    contactsById,
    accountName,
    userName,
    createRecord,
    updateRecord,
    deleteRecords,
    saveContactView,
    renameContactView,
    deleteContactView,
    saveContactSplitView,
    deleteContactSplitView,
    addContactRelatedRecord,
  } = crm;

  const navigate = useNavigate();
  const location = useLocation();
  const { contactId: routeContactId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const { refreshing, refresh } = useRefresh('Contacts');

  // Load initial filter state from URL or localStorage
  const persisted = useMemo(() => loadPersistedFilterState(), []);

  const [createViewOpen, setCreateViewOpen] = useState(false);
  const isCreate =
    isCreatePage ||
    createViewOpen ||
    location.pathname.endsWith('/create') ||
    location.pathname.endsWith('/new') ||
    searchParams.get('create') === '1' ||
    searchParams.get('mode') === 'create';

  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [selectedMapCity, setSelectedMapCity] = useState('All');

  const [savedView, setSavedView] = useState(() => searchParams.get('view') || persisted?.savedView || 'all');
  const [layout, setLayout] = useState(() => persisted?.layout || 'list');
  const [dense, setDense] = useState(true);
  const [panelOpen, setPanelOpen] = useState(true);
  const [headerMode, setHeaderMode] = useHeaderBarMode('contacts', 'fixed');

  // Search & popover controls:
  // 1. filterSearch searches filter headings in left sidebar
  // 2. filterMenuSearch searches filter names in the Popover/Drawer
  // 3. tableSearch searches Contact records in table
  const [filterSearch, setFilterSearch] = useState('');
  const [filterMenuSearch, setFilterMenuSearch] = useState('');
  const [activeCategoryTab, setActiveCategoryTab] = useState('all');
  const [tableSearch, setTableSearch] = useState(() => searchParams.get('q') || persisted?.tableSearch || '');

  // Popover / Drawer state & refs
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const filterBtnRef = useRef(null);
  const filterMenuRef = useRef(null);

  // Expandable filter sections (sidebar)
  const [sysOpen, setSysOpen] = useState(true);
  const [websiteOpen, setWebsiteOpen] = useState(true);
  const [fieldsOpen, setFieldsOpen] = useState(true);
  const [relatedOpen, setRelatedOpen] = useState(true);

  // Active Filter Criteria
  const [sysFilters, setSysFilters] = useState(() => new Set(persisted?.sysFilters || []));
  const [websiteConfigs, setWebsiteConfigs] = useState(() => persisted?.websiteConfigs || {});
  const [fieldConfigs, setFieldConfigs] = useState(() => persisted?.fieldConfigs || {});
  const [relatedConfigs, setRelatedConfigs] = useState(() => persisted?.relatedConfigs || {});
  const [builderRules, setBuilderRules] = useState(() => persisted?.builderRules || []);
  const [globalJoin, setGlobalJoin] = useState(() => persisted?.globalJoin || 'AND');
  const [lifecycleQuick, setLifecycleQuick] = useState('');

  // Role & Record-Level Access Control state
  const [activeUserId, setActiveUserId] = useState('u1');
  const [enforcePermissions, setEnforcePermissions] = useState(false);

  // Modals & Drawers - default hidden columns leaves the 9 Screenshot 1 columns visible
  const CONTACT_COLUMN_CATALOG = useMemo(
    () => [
      { key: 'createdTime', label: 'Created Time', width: 175 },
      { key: 'owner', label: 'Contact Owner', width: 150 },
      { key: 'firstName', label: 'First Name', width: 130 },
      { key: 'lastName', label: 'Last Name', width: 130 },
      { key: 'mobile', label: 'Mobile', width: 140 },
      { key: 'email', label: 'Email', width: 200 },
      { key: 'leadSource', label: 'Lead Source', width: 130 },
      { key: 'leadManager1', label: 'Lead Manager 1', width: 155 },
      { key: 'city', label: 'City', width: 130 },
      { key: 'account', label: 'Account Name', width: 170 },
      { key: 'name', label: 'Full Contact Name', width: 200 },
      { key: 'phone', label: 'Phone', width: 140 },
      { key: 'lifecycle', label: 'Lifecycle Stage', width: 130 },
      { key: 'department', label: 'Department', width: 130 },
      { key: 'lastContacted', label: 'Last Contacted', width: 140 },
      { key: 'followUp', label: 'Follow-up Indicator', width: 90 },
      { key: 'vendorName', label: 'Vendor Name', width: 140 },
    ],
    []
  );
  const {
    order: columnOrder,
    hidden,
    widths: columnWidths,
    toggleColumn,
    reorderColumns,
    moveColumnByOffset,
    setColumnWidth,
    resetColumns,
  } = useColumnLayout(
    'list-contacts',
    CONTACT_COLUMN_CATALOG.map((c) => c.key),
    ['account', 'name', 'phone', 'lifecycle', 'department', 'lastContacted', 'followUp', 'vendorName'],
    Object.fromEntries(CONTACT_COLUMN_CATALOG.map((c) => [c.key, c.width]))
  );
  const [contactModal, setContactModal] = useState(null); // { mode: 'create'|'edit', record }
  const [viewingId, setViewingId] = useState(null);
  const [detailTab, setDetailTab] = useState('overview');
  const [timelineContactId, setTimelineContactId] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [bulkMode, setBulkMode] = useState(null); // 'owner' | 'lifecycle' | 'department'
  const [bulkValue, setBulkValue] = useState('');
  const [builderOpen, setBuilderOpen] = useState(false);
  const [saveViewModal, setSaveViewModal] = useState(null); // { mode: 'create'|'rename', id?, name: '' }
  const [composeEmail, setComposeEmail] = useState(null); // { contact, subject: '', body: '' }
  const [whatsappContact, setWhatsappContact] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [csvImportOpen, setCsvImportOpen] = useState(false);

  // Open a specific contact's detail page using its real ID and sync URL
  const openContactDetail = (id, tab = 'overview') => {
    if (!id) return;
    setViewingId(id);
    setTimelineContactId(id);
    setDetailTab(tab);
    navigate(`/contacts/${id}`);
  };

  // Close the contact detail page and return to the Contacts list
  const closeContactDetail = () => {
    setViewingId(null);
    navigate('/contacts');
  };

  const activeUser = useMemo(
    () => users.find((u) => u.id === activeUserId) || users[0],
    [users, activeUserId]
  );

  // Close filter popover on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && filterMenuOpen) {
        setFilterMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filterMenuOpen]);

  // Close filter popover on outside click
  useEffect(() => {
    if (!filterMenuOpen) return;
    const handleClickOutside = (e) => {
      if (
        filterMenuRef.current &&
        !filterMenuRef.current.contains(e.target) &&
        filterBtnRef.current &&
        !filterBtnRef.current.contains(e.target)
      ) {
        setFilterMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [filterMenuOpen]);

  // Sync URL route/query parameter (?open=<id>, ?id=<id>, /contacts/:contactId) with viewingId
  useEffect(() => {
    const create = searchParams.get('create');
    const openParam = searchParams.get('open') || searchParams.get('id');
    const paramId =
      routeContactId && routeContactId !== 'create' && routeContactId !== 'new'
        ? routeContactId
        : openParam;

    if (create) {
      setViewingId(null);
      setCreateViewOpen(true);
    } else if (paramId) {
      const c = contacts.find((x) => x.id === paramId);
      if (c) setViewingId(c.id);
    } else {
      setViewingId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeContactId, searchParams, contacts]);

  // Persist filter state to localStorage so refresh & navigation preserve filters
  useEffect(() => {
    savePersistedFilterState({
      savedView,
      layout,
      tableSearch,
      sysFilters: [...sysFilters],
      websiteConfigs,
      fieldConfigs,
      relatedConfigs,
      builderRules,
      globalJoin,
    });
  }, [savedView, layout, tableSearch, sysFilters, websiteConfigs, fieldConfigs, relatedConfigs, builderRules, globalJoin]);

  // Filter catalog search results (Left Sidebar & Popover)
  const catalogMatch = useMemo(() => searchFilterCatalog(filterSearch), [filterSearch]);
  const catalogMatchMenu = useMemo(() => searchFilterCatalog(filterMenuSearch), [filterMenuSearch]);

  // Lookup options for Lookup Field Filters
  const lookupOptionsBySource = useMemo(
    () => ({
      accounts: accounts.map((a) => ({ id: a.id, label: a.name })),
      users: users.map((u) => ({ id: u.id, label: u.name })),
      contacts: contacts.slice(0, 60).map((c) => ({ id: c.id, label: c.name })),
      vendors: VENDORS.map((v) => ({ id: v, label: v })),
    }),
    [accounts, users, contacts]
  );

  // Convert active website, field, and related configs into arrays for the filter engine
  const activeWebsiteFiltersList = useMemo(() => {
    return Object.entries(websiteConfigs)
      .filter(([, cfg]) => cfg && cfg.enabled)
      .map(([key, cfg]) => ({
        field: key,
        type: cfg.type || 'number',
        operator: cfg.operator || 'greater than',
        value: cfg.value,
        valueTo: cfg.valueTo,
        enabled: true,
      }));
  }, [websiteConfigs]);

  const activeFieldFiltersList = useMemo(() => {
    return Object.entries(fieldConfigs)
      .filter(([, cfg]) => cfg && cfg.enabled)
      .map(([fieldKey, cfg]) => ({
        field: fieldKey,
        type: cfg.type,
        operator: cfg.operator,
        value: cfg.value,
        valueTo: cfg.valueTo,
        enabled: true,
      }));
  }, [fieldConfigs]);

  const activeRelatedFiltersList = useMemo(() => {
    return Object.entries(relatedConfigs)
      .filter(([, cfg]) => cfg && cfg.enabled)
      .map(([moduleKey, cfg]) => ({
        module: moduleKey,
        mode: cfg.mode || cfg.operator || 'has any',
        operator: cfg.operator || 'has any',
        value: cfg.value,
        valueTo: cfg.valueTo,
        enabled: true,
      }));
  }, [relatedConfigs]);

  const filterContext = useMemo(
    () => ({
      contacts,
      accounts,
      deals,
      calls,
      invoices,
      tasks,
      contactRelations,
      accountsById,
      usersById,
      contactsById,
    }),
    [contacts, accounts, deals, calls, invoices, tasks, contactRelations, accountsById, usersById, contactsById]
  );

  // Evaluate all filters
  const filtered = useMemo(() => {
    const base = evaluateContactFilters(
      contacts,
      {
        viewKey: savedView,
        systemFilters: [...sysFilters],
        websiteActivityFilters: activeWebsiteFiltersList,
        fieldFilters: activeFieldFiltersList,
        relatedFilters: activeRelatedFiltersList,
        builderRules,
        globalJoin,
        tableSearch,
        activeUser,
        enforcePermissions,
      },
      filterContext,
      todayISO()
    );
    if (!lifecycleQuick) return base;
    return base.filter((c) => c.lifecycle === lifecycleQuick);
  }, [
    contacts,
    savedView,
    sysFilters,
    activeWebsiteFiltersList,
    activeFieldFiltersList,
    activeRelatedFiltersList,
    builderRules,
    globalJoin,
    tableSearch,
    activeUser,
    enforcePermissions,
    filterContext,
    lifecycleQuick,
  ]);

  const accessors = useMemo(
    () => ({
      createdTime: (c) => c.createdTime || c.createdOn || '',
      owner: (c) => userName(c.ownerId),
      firstName: (c) => c.firstName || '',
      lastName: (c) => c.lastName || c.name || '',
      mobile: (c) => c.mobile || c.phone || '',
      email: (c) => c.email || '',
      leadSource: (c) => c.leadSource || '',
      leadManager1: (c) => (c.leadManager1 ? userName(c.leadManager1) || c.leadManager1 : ''),
      city: (c) => c.city || c.mailingCity || '',
      name: (c) => c.name,
      account: (c) => accountName(c.accountId),
      phone: (c) => c.phone || '',
      lifecycle: (c) => c.lifecycle || '',
      lastContacted: (c) => c.lastContacted || '',
      createdOn: (c) => c.createdTime || c.createdOn || '',
      mailingCity: (c) => c.city || c.mailingCity || '',
      department: (c) => c.department || '',
      designation: (c) => c.designation || '',
    }),
    [accountName, userName]
  );

  const table = useTable(filtered, { accessors, pageSize: 10 });

  const activeFilterCount =
    sysFilters.size +
    activeWebsiteFiltersList.length +
    activeFieldFiltersList.length +
    activeRelatedFiltersList.length +
    builderRules.length +
    (lifecycleQuick ? 1 : 0) +
    (tableSearch.trim() ? 1 : 0);

  const clearAllFilters = () => {
    setSysFilters(new Set());
    setWebsiteConfigs({});
    setFieldConfigs({});
    setRelatedConfigs({});
    setBuilderRules([]);
    setLifecycleQuick('');
    setTableSearch('');
    setGlobalJoin('AND');
    table.setPage(1);
    toast.info('All filters and search reset');
  };

  const resetToDefaultView = () => {
    clearAllFilters();
    setFilterSearch('');
    setFilterMenuSearch('');
    setSavedView('all');
    table.setSort(null);
    table.setPage(1);
    toast.info('Contacts view and filters reset to default');
  };

  // Rule management helpers for Filter Popover / Builder
  const addFilterRuleFromOption = (category, item) => {
    const ruleId = `br-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
    let initialOp = 'is';
    let initialVal = '';

    if (category === 'system') {
      if (item.type === 'number') {
        initialOp = 'greater than';
        initialVal = '40';
      } else if (item.type === 'boolean') {
        initialOp = 'is';
        initialVal = 'Yes';
      } else if (item.key === 'Email Sentiment') {
        initialOp = 'is';
        initialVal = 'Positive';
      } else if (item.key === 'Latest Email Status') {
        initialOp = 'is';
        initialVal = 'Opened';
      } else {
        initialOp = 'is';
        initialVal = 'Yes';
      }
    } else if (category === 'website') {
      if (item.type === 'number') {
        initialOp = 'greater than';
        initialVal = item.key === 'averageTimeSpent' ? '20' : item.key === 'daysVisited' ? '3' : '50';
      } else if (item.type === 'date') {
        initialOp = 'before';
        initialVal = '2026-10-01';
      } else {
        initialOp = 'contains';
        initialVal = '';
      }
    } else if (category === 'related') {
      initialOp = 'has any';
      initialVal = '';
    } else {
      // field
      if (item.type === 'number') {
        initialOp = 'equals';
      } else if (item.type === 'date') {
        initialOp = 'is';
        initialVal = '2026-10-01';
      } else if (item.type === 'boolean') {
        initialOp = 'is';
        initialVal = 'Yes';
      } else if (item.type === 'lookup') {
        initialOp = 'is';
        initialVal = '';
      } else {
        initialOp = 'is';
        initialVal = '';
      }
    }

    setBuilderRules((prev) => [
      ...prev,
      {
        id: ruleId,
        category,
        field: item.key,
        label: item.label,
        type: item.type || (category === 'related' ? 'related' : 'text'),
        operator: initialOp,
        value: initialVal,
        valueTo: '',
        enabled: true,
      },
    ]);
  };

  const removeBuilderRule = (ruleIdOrIdx) => {
    setBuilderRules((prev) =>
      typeof ruleIdOrIdx === 'string'
        ? prev.filter((r) => r.id !== ruleIdOrIdx)
        : prev.filter((_, idx) => idx !== ruleIdOrIdx)
    );
  };

  const updateBuilderRule = (ruleId, patch) => {
    setBuilderRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, ...patch } : r))
    );
  };

  // Toggle a System Defined Filter checkbox
  const toggleSystemFilter = (key) => {
    setSysFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    table.setPage(1);
  };

  // Toggle a Website Activity Filter checkbox
  const toggleWebsiteFilter = (meta) => {
    setWebsiteConfigs((prev) => {
      const existing = prev[meta.key];
      if (existing?.enabled) {
        const next = { ...prev };
        delete next[meta.key];
        return next;
      }
      return {
        ...prev,
        [meta.key]: {
          enabled: true,
          type: meta.type || 'number',
          operator: meta.type === 'number' ? 'greater than' : meta.type === 'date' ? 'before' : 'is',
          value: meta.type === 'number' ? '10' : '',
          valueTo: '',
        },
      };
    });
    table.setPage(1);
  };

  const updateWebsiteConfig = (key, patch) => {
    setWebsiteConfigs((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        ...patch,
      },
    }));
    table.setPage(1);
  };

  // Toggle a Field Filter checkbox
  const toggleFieldFilter = (fieldMeta) => {
    setFieldConfigs((prev) => {
      const existing = prev[fieldMeta.key];
      if (existing?.enabled) {
        const next = { ...prev };
        delete next[fieldMeta.key];
        return next;
      }
      const defaultOp =
        fieldMeta.type === 'boolean'
          ? 'Yes'
          : fieldMeta.type === 'date'
          ? 'On'
          : fieldMeta.type === 'lookup'
          ? 'Is'
          : 'Contains';
      return {
        ...prev,
        [fieldMeta.key]: {
          enabled: true,
          type: fieldMeta.type,
          operator: defaultOp,
          value: fieldMeta.type === 'boolean' ? 'Yes' : '',
          valueTo: '',
        },
      };
    });
    table.setPage(1);
  };

  const updateFieldConfig = (fieldKey, patch) => {
    setFieldConfigs((prev) => ({
      ...prev,
      [fieldKey]: {
        ...(prev[fieldKey] || {}),
        ...patch,
      },
    }));
    table.setPage(1);
  };

  // Toggle a Related Module Filter checkbox
  const toggleRelatedFilter = (relMeta) => {
    setRelatedConfigs((prev) => {
      const existing = prev[relMeta.key];
      if (existing?.enabled) {
        const next = { ...prev };
        delete next[relMeta.key];
        return next;
      }
      return {
        ...prev,
        [relMeta.key]: {
          enabled: true,
          mode: 'has_any',
          operator: 'Greater than',
          value: '',
          valueTo: '',
        },
      };
    });
    table.setPage(1);
  };

  const updateRelatedConfig = (moduleKey, patch) => {
    setRelatedConfigs((prev) => ({
      ...prev,
      [moduleKey]: {
        ...(prev[moduleKey] || {}),
        ...patch,
      },
    }));
    table.setPage(1);
  };

  // Saved Views (System Views + Custom Saved Filter Views)
  const systemViews = useMemo(
    () =>
      [
        { key: 'all', label: 'All Contacts', test: () => true },
        { key: 'mine', label: 'My Contacts', test: (c) => c.ownerId === activeUser.id },
        { key: 'followup', label: 'Follow-ups Due', test: (c) => c.followUp && c.followUp <= todayISO() },
        { key: 'customers', label: 'Customers', test: (c) => c.lifecycle === 'Customer' },
        { key: 'optout', label: 'Email Opt Out', test: (c) => c.emailOptOut },
        { key: 'touched', label: 'Touched Records', test: (c) => c.touched },
      ].map((v) => ({ ...v, count: contacts.filter(v.test).length, isSystem: true })),
    [contacts, activeUser.id]
  );

  const allViews = useMemo(() => {
    const custom = (savedContactViews || []).map((sv) => ({
      key: sv.id,
      label: sv.name,
      isCustom: true,
      raw: sv,
    }));
    return [...systemViews, ...custom];
  }, [systemViews, savedContactViews]);

  const handleSelectView = (viewKey) => {
    setSavedView(viewKey);
    const custom = (savedContactViews || []).find((v) => v.id === viewKey);
    if (custom) {
      setSysFilters(new Set(custom.systemFilters || []));
      const wc = {};
      (custom.websiteActivityFilters || []).forEach((w) => {
        wc[w.field] = {
          enabled: true,
          type: w.type || 'number',
          operator: w.operator || 'greater than',
          value: w.value ?? '',
          valueTo: w.valueTo ?? '',
        };
      });
      setWebsiteConfigs(wc);
      const fc = {};
      (custom.fieldFilters || []).forEach((f) => {
        fc[f.field] = {
          enabled: true,
          type: f.type || 'text',
          operator: f.operator || 'is',
          value: f.value ?? '',
          valueTo: f.valueTo ?? '',
        };
      });
      setFieldConfigs(fc);
      const rc = {};
      (custom.relatedFilters || []).forEach((r) => {
        rc[r.module] = {
          enabled: true,
          mode: r.mode || 'has any',
          operator: r.operator || 'has any',
          value: r.value ?? '',
          valueTo: r.valueTo ?? '',
        };
      });
      setRelatedConfigs(rc);
      setBuilderRules(custom.builderRules || []);
      setGlobalJoin(custom.globalJoin || 'AND');
    }
    table.setPage(1);
  };

  const handleSaveCustomView = (e) => {
    e.preventDefault();
    if (!saveViewModal?.name?.trim()) return;
    const name = saveViewModal.name.trim();
    if (saveViewModal.mode === 'rename' && saveViewModal.id) {
      renameContactView(saveViewModal.id, name);
      toast.success(`Renamed view to "${name}"`);
    } else {
      const saved = saveContactView({
        name,
        shared: true,
        createdBy: activeUser.id,
        systemFilters: [...sysFilters],
        websiteActivityFilters: activeWebsiteFiltersList,
        fieldFilters: activeFieldFiltersList,
        relatedFilters: activeRelatedFiltersList,
        builderRules,
        globalJoin,
      });
      setSavedView(saved.id);
      toast.success(`Saved custom filter view "${name}"`);
    }
    setSaveViewModal(null);
  };

  const activeCustomView = useMemo(
    () => (savedContactViews || []).find((v) => v.id === savedView) || null,
    [savedContactViews, savedView]
  );

  // ---------------- Create / Edit Contact Modal ----------------
  const blankContact = {
    salutation: 'Mr.',
    firstName: '',
    lastName: '',
    name: '',
    designation: '',
    accountId: accounts[0]?.id || '',
    department: 'IT',
    email: '',
    secondaryEmail: '',
    phone: '',
    mobile: '',
    homePhone: '',
    otherPhone: '',
    lifecycle: 'New',
    leadSource: 'Website',
    ownerId: activeUser.id || 'u1',
    reportingToId: '',
    vendorName: '',
    dateOfBirth: '',
    lastContacted: todayISO(),
    followUp: '',
    assistant: '',
    asstPhone: '',
    fax: '',
    skypeId: '',
    twitter: '',
    mailingFlat: '',
    mailingStreet: '',
    mailingCity: 'Chennai',
    mailingState: 'Tamil Nadu',
    mailingZip: '600002',
    mailingCountry: 'India',
    otherFlat: '',
    otherStreet: '',
    otherCity: '',
    otherState: '',
    otherZip: '',
    otherCountry: 'India',
    tagInput: 'Enterprise',
    description: '',
    emailOptOut: false,
    emailStatus: 'Delivered',
    locked: false,
  };

  function openCreateModal(defaultAccountId = '') {
    setContactModal({
      mode: 'create',
      record: { ...blankContact, accountId: defaultAccountId || accounts[0]?.id || '' },
      errors: {},
    });
  }

  function openEditModal(contact) {
    if (enforcePermissions && activeUser.role !== 'Sales Manager' && contact.ownerId !== activeUser.id) {
      toast.error(`Permission denied: Only ${userName(contact.ownerId)} or a Sales Manager can edit this contact.`);
      return;
    }
    const parts = String(contact.name || '').trim().split(/\s+/);
    setContactModal({
      mode: 'edit',
      record: {
        ...blankContact,
        ...contact,
        firstName: contact.firstName || parts[0] || '',
        lastName: contact.lastName || parts.slice(1).join(' ') || '',
        tagInput: Array.isArray(contact.tags) ? contact.tags.join(', ') : contact.tag || '',
      },
      errors: {},
    });
  }

  const handleSaveContact = (e) => {
    e.preventDefault();
    if (!contactModal) return;
    const r = contactModal.record;
    const errors = {};
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const phoneRx = /^[+\d][\d\s-]{6,18}$/;

    const fullName = `${String(r.firstName || '').trim()} ${String(r.lastName || '').trim()}`.trim() || String(r.name || '').trim();
    if (fullName.length < 2) errors.lastName = 'Enter First Name and Last Name (at least 2 characters).';
    if (!r.accountId) errors.accountId = 'Account Name is required.';
    if (!r.email || !emailRx.test(String(r.email).trim())) {
      errors.email = 'Enter a valid primary email address.';
    } else {
      const dup = contacts.some(
        (c) => c.email.toLowerCase() === String(r.email).trim().toLowerCase() && c.id !== r.id
      );
      if (dup) errors.email = 'Duplicate rule triggered: Another contact already uses this email address.';
    }
    if (!r.phone || !phoneRx.test(String(r.phone).trim())) {
      errors.phone = 'Enter a valid phone number (e.g. +91 98765 43210).';
    }

    if (Object.keys(errors).length > 0) {
      setContactModal((prev) => ({ ...prev, errors }));
      return;
    }

    const tags = String(r.tagInput || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const mailingAddress = [r.mailingFlat, r.mailingStreet, r.mailingCity, r.mailingState, r.mailingZip, r.mailingCountry]
      .filter(Boolean)
      .join(', ');
    const otherAddress = [r.otherFlat, r.otherStreet, r.otherCity, r.otherState, r.otherZip, r.otherCountry]
      .filter(Boolean)
      .join(', ');

    const payload = {
      ...r,
      name: fullName,
      firstName: String(r.firstName || '').trim() || fullName.split(' ')[0],
      lastName: String(r.lastName || '').trim() || fullName.split(' ').slice(1).join(' '),
      tags,
      tag: tags.join(', '),
      mailingAddress,
      otherAddress,
      modifiedBy: activeUser.id,
      modifiedTime: todayISO(),
      unsubscribedMode: r.emailOptOut ? r.unsubscribedMode || 'Manual Opt-Out' : '',
      unsubscribedTime: r.emailOptOut ? r.unsubscribedTime || todayISO() : '',
    };

    if (contactModal.mode === 'create') {
      createRecord('contacts', {
        ...payload,
        createdBy: activeUser.id,
        createdTime: todayISO(),
      });
      toast.success(`Contact "${fullName}" created`);
      table.setPage(1);
    } else {
      updateRecord('contacts', r.id, payload);
      toast.success(`Contact "${fullName}" updated`);
    }
    setContactModal(null);
  };

  // Export CSV
  const exportRows = (rows) => {
    exportCSV('contacts', rows, [
      { label: 'Salutation', value: (c) => c.salutation },
      { label: 'Contact Name', value: (c) => c.name },
      { label: 'Title', value: (c) => c.designation },
      { label: 'Account Name', value: (c) => accountName(c.accountId) },
      { label: 'Department', value: (c) => c.department },
      { label: 'Email', value: (c) => c.email },
      { label: 'Secondary Email', value: (c) => c.secondaryEmail },
      { label: 'Phone', value: (c) => c.phone },
      { label: 'Mobile', value: (c) => c.mobile },
      { label: 'Mailing City', value: (c) => c.mailingCity },
      { label: 'Mailing State', value: (c) => c.mailingState },
      { label: 'Lifecycle Stage', value: (c) => c.lifecycle },
      { label: 'Lead Source', value: (c) => c.leadSource },
      { label: 'Contact Owner', value: (c) => userName(c.ownerId) },
      { label: 'Email Opt Out', value: (c) => (c.emailOptOut ? 'Yes' : 'No') },
      { label: 'Tags', value: (c) => (c.tags || []).join('; ') },
    ]);
    toast.success(`Exported ${rows.length} contacts to CSV`);
  };

  const handleDeleteRequest = (ids, label) => {
    if (enforcePermissions && activeUser.role !== 'Sales Manager') {
      const unauthorized = ids.some((id) => {
        const c = contacts.find((x) => x.id === id);
        return c && c.ownerId !== activeUser.id;
      });
      if (unauthorized) {
        toast.error('Permission denied: Only the Contact Owner or a Sales Manager can delete selected contacts.');
        return;
      }
    }
    setConfirm({ ids, label });
  };

  const rowMenu = (c) => [
    { label: 'View details', icon: Eye, onClick: () => openContactDetail(c.id) },
    { label: 'Edit contact', icon: Pencil, onClick: () => openEditModal(c) },
    { label: 'Send email', icon: Mail, onClick: () => setComposeEmail({ contact: c, subject: `Following up with ${accountName(c.accountId)}`, body: `Hi ${c.firstName || c.name},\n\nFollowing up regarding our recent conversation.\n\nBest regards,\n${activeUser.name}` }) },
    { label: 'Send WhatsApp', icon: WhatsAppIcon, onClick: () => setWhatsappContact(c) },
    { label: 'Log a call', icon: Phone, onClick: () => navigate(`/calls?create=1&contact=${c.id}`) },
    {
      label: c.followUp ? 'Clear follow-up' : 'Follow up tomorrow',
      icon: CalendarCheck2,
      onClick: () => updateRecord('contacts', c.id, { followUp: c.followUp ? '' : addDays(todayISO(), 1) }),
    },
    { divider: true },
    { label: 'Delete contact', icon: Trash2, danger: true, onClick: () => handleDeleteRequest([c.id], c.name) },
  ];

  const COLUMNS = [
    {
      key: 'createdTime',
      header: 'Created Time',
      sortable: true,
      width: 175,
      render: (c) => {
        const timeStr = c.createdTime || c.createdOn || '2026-10-10 09:44 AM';
        let display = timeStr;
        if (/^\d{4}-\d{2}-\d{2}$/.test(timeStr)) {
          const [y, m, d] = timeStr.split('-');
          display = `${d}/${m}/${y} 09:44 AM`;
        }
        return <span className="text-[12.5px] text-ink whitespace-nowrap">{display}</span>;
      },
    },
    {
      key: 'owner',
      header: 'Contact Owner',
      sortable: true,
      width: 150,
      render: (c) => (
        <span className="text-[12.5px] text-ink whitespace-nowrap">
          {userName(c.ownerId) || 'Sales Team'}
        </span>
      ),
    },
    {
      key: 'firstName',
      header: 'First Name',
      sortable: true,
      width: 130,
      render: (c) => (
        <Link
          to={`/contacts/${c.id}`}
          onClick={() => openContactDetail(c.id)}
          className="text-left font-medium text-ink hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded text-[12.5px] whitespace-nowrap block truncate max-w-[120px]"
          title={`Open details for ${c.name}`}
        >
          {c.firstName || '—'}
        </Link>
      ),
    },
    {
      key: 'lastName',
      header: (
        <span className="inline-flex items-center gap-1.5">
          <span>Last Name</span>
          <span className="text-[10px] font-normal text-ink-400 bg-page px-1 py-0.2 rounded border border-line-soft">
            aa ▾
          </span>
        </span>
      ),
      sortable: true,
      width: 165,
      render: (c) => (
        <Link
          to={`/contacts/${c.id}`}
          onClick={() => openContactDetail(c.id)}
          className="text-left font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded text-[13px] whitespace-nowrap block truncate max-w-[155px]"
          title={`Open details for ${c.name}`}
        >
          {c.lastName || c.name}
        </Link>
      ),
    },
    {
      key: 'mobile',
      header: 'Mobile',
      sortable: true,
      width: 170,
      render: (c) => {
        const phoneVal = c.mobile || c.phone || '';
        return (
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-[12.5px] text-ink font-mono">{phoneVal || '—'}</span>
            {phoneVal && (
              <a
                href={`tel:${phoneVal.replace(/\s/g, '')}`}
                title={`Call ${phoneVal}`}
                className="w-4 h-4 rounded-full bg-[#10B981] hover:bg-[#059669] text-white flex items-center justify-center shrink-0 shadow-2xs transition-colors"
              >
                <Phone size={9} className="fill-current text-white" />
              </a>
            )}
          </div>
        );
      },
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      width: 220,
      render: (c) => (
        <button
          type="button"
          onClick={() =>
            setComposeEmail({
              contact: c,
              subject: `Following up with ${accountName(c.accountId)}`,
              body: `Hi ${c.firstName || c.name},\n\nHope you are doing well.\n\nBest regards,\n${activeUser.name}`,
            })
          }
          className="text-left text-ink hover:text-primary text-[12.5px] truncate max-w-[210px] block"
          title={`Compose email to ${c.email}`}
        >
          {c.email || '—'}
        </button>
      ),
    },
    {
      key: 'leadSource',
      header: 'Lead Source',
      sortable: true,
      width: 145,
      render: (c) => {
        const src = c.leadSource || 'Website';
        const isClientRef = src.toLowerCase().includes('referral') || src.toLowerCase().includes('client');
        const badgeStyle = isClientRef
          ? 'bg-[#E0F2FE] text-[#0284C7] border-[#BAE6FD]'
          : 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]';
        return (
          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium border whitespace-nowrap ${badgeStyle}`}>
            {src === 'Website' ? 'Database calls' : src}
          </span>
        );
      },
    },
    {
      key: 'leadManager1',
      header: 'Lead Manager 1',
      sortable: true,
      width: 150,
      render: (c) => (
        <span className="text-[12.5px] text-ink-600 whitespace-nowrap">
          {c.leadManager1 ? (userName(c.leadManager1) || c.leadManager1) : '—'}
        </span>
      ),
    },
    {
      key: 'city',
      header: 'City',
      sortable: true,
      width: 130,
      render: (c) => (
        <span className="text-[12.5px] text-ink-700 whitespace-nowrap">
          {c.city || c.mailingCity || '—'}
        </span>
      ),
    },
    {
      key: 'account',
      header: 'Account Name',
      sortable: true,
      width: 150,
      render: (c) => (
        <Link to={`/accounts?open=${c.accountId}`} className="text-ink-600 hover:text-primary font-medium leading-snug block max-w-[140px] truncate text-[12.5px]">
          {accountName(c.accountId)}
        </Link>
      ),
    },
    {
      key: 'name',
      header: 'Full Contact Name',
      sortable: true,
      width: 180,
      render: (c) => (
        <Link
          to={`/contacts/${c.id}`}
          onClick={() => openContactDetail(c.id)}
          className="flex items-center gap-2 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded"
          title={`Open details for ${c.name}`}
        >
          <PersonAvatar name={c.name} size={28} />
          <span className="text-[13px] font-semibold text-ink group-hover:text-primary group-hover:underline truncate">
            {c.name}
          </span>
        </Link>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      sortable: true,
      width: 150,
      render: (c) => (
        <a href={`tel:${String(c.phone || '').replace(/\s/g, '')}`} className="inline-flex items-center gap-1.5 hover:text-primary text-[12.5px]">
          <Phone size={13} className="text-ink-400 shrink-0" />
          <span>{c.phone || '—'}</span>
        </a>
      ),
    },
    {
      key: 'lifecycle',
      header: 'Lifecycle Stage',
      sortable: true,
      width: 130,
      render: (c) => <StatusBadge kind="lifecycle" value={c.lifecycle} className="min-w-[80px]" />,
    },
    {
      key: 'department',
      header: 'Department',
      sortable: true,
      width: 140,
      render: (c) => <span className="text-[12.5px]">{c.department || '—'}</span>,
    },
    {
      key: 'lastContacted',
      header: 'Last Contacted',
      sortable: true,
      width: 140,
      render: (c) => <span className="text-[12.5px] whitespace-nowrap">{fmtDate(c.lastContacted)}</span>,
    },
    {
      key: 'followUp',
      header: 'Follow-up',
      sortable: false,
      width: 90,
      render: (c) => <FollowUpTag date={c.followUp} />,
    },
    {
      key: 'vendorName',
      header: 'Vendor Name',
      sortable: false,
      width: 140,
      render: (c) => <span className="text-[12.5px]">{c.vendorName || '—'}</span>,
    },
  ]
    .sort((a, b) => {
      const idxA = columnOrder.indexOf(a.key);
      const idxB = columnOrder.indexOf(b.key);
      return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
    })
    .filter((c) => !hidden.has(c.key));

  // ==================== EXCEL-STYLE SPREADSHEET COLUMNS & HANDLERS ====================
  const spreadsheetColumns = useMemo(
    () => [
      {
        key: 'createdTime',
        header: 'Created Time',
        headerLabel: 'Created Time',
        type: 'date',
        sortable: true,
        width: 175,
        getValue: (c) => c.createdTime || c.createdOn || '2026-10-10',
        renderCell: (c) => (
          <span className="text-[12.5px] text-ink whitespace-nowrap">
            {formatScreenshotDateTime(c.createdTime || c.createdOn || '2026-10-10')}
          </span>
        ),
      },
      {
        key: 'owner',
        header: 'Contact Owner',
        headerLabel: 'Contact Owner',
        type: 'select',
        sortable: true,
        width: 155,
        options: users.map((u) => ({ value: u.id, label: u.name })),
        getValue: (c) => c.ownerId || 'u1',
        renderCell: (c) => (
          <span className="text-[12.5px] text-ink whitespace-nowrap">
            {userName(c.ownerId) || 'Sales Team'}
          </span>
        ),
      },
      {
        key: 'firstName',
        header: 'First Name',
        headerLabel: 'First Name',
        type: 'text',
        sortable: true,
        width: 135,
        getValue: (c) => c.firstName || '',
        renderCell: (c) => (
          <span className="font-medium text-ink text-[12.5px] whitespace-nowrap">
            {c.firstName || '—'}
          </span>
        ),
        renderAccessory: (c) => (
          <Link
            to={`/contacts/${c.id}`}
            onClick={() => openContactDetail(c.id)}
            title={`Open details for ${c.name}`}
            className="text-ink-400 hover:text-primary p-0.5 rounded"
          >
            <ExternalLink size={11.5} />
          </Link>
        ),
      },
      {
        key: 'lastName',
        header: 'Last Name',
        headerLabel: 'Last Name',
        badge: 'aa ▾',
        type: 'text',
        sortable: true,
        width: 165,
        getValue: (c) => c.lastName || c.name || '',
        renderCell: (c) => (
          <span className="font-medium text-primary text-[13px] whitespace-nowrap">
            {c.lastName || c.name || '—'}
          </span>
        ),
        renderAccessory: (c) => (
          <Link
            to={`/contacts/${c.id}`}
            onClick={() => openContactDetail(c.id)}
            title={`Open details for ${c.name}`}
            className="text-primary/70 hover:text-primary p-0.5 rounded"
          >
            <ExternalLink size={11.5} />
          </Link>
        ),
      },
      {
        key: 'mobile',
        header: 'Mobile',
        headerLabel: 'Mobile',
        type: 'phone',
        sortable: true,
        width: 175,
        getValue: (c) => c.mobile || c.phone || '',
        renderCell: (c, val) => (
          <span className="text-[12.5px] text-ink font-mono whitespace-nowrap">{val || '—'}</span>
        ),
        renderAccessory: (c, val) =>
          val ? (
            <a
              href={`tel:${String(val).replace(/\s/g, '')}`}
              title={`Call ${val}`}
              className="w-4 h-4 rounded-full bg-[#10B981] hover:bg-[#059669] text-white flex items-center justify-center shrink-0 shadow-2xs transition-colors"
            >
              <Phone size={9} className="fill-current text-white" />
            </a>
          ) : null,
      },
      {
        key: 'email',
        header: 'Email',
        headerLabel: 'Email',
        type: 'email',
        sortable: true,
        width: 220,
        getValue: (c) => c.email || '',
        renderCell: (c, val) => (
          <span className="text-[12.5px] text-ink truncate block">{val || '—'}</span>
        ),
      },
      {
        key: 'leadSource',
        header: 'Lead Source',
        headerLabel: 'Lead Source',
        type: 'select',
        sortable: true,
        width: 150,
        options: LEAD_SOURCES.map((s) => ({
          value: s,
          label: s === 'Website' ? 'Database calls (Website)' : s,
        })),
        getValue: (c) => c.leadSource || 'Website',
        renderCell: (c) => {
          const src = c.leadSource || 'Website';
          const isClientRef =
            src.toLowerCase().includes('referral') || src.toLowerCase().includes('client');
          const badgeStyle = isClientRef
            ? 'bg-[#E0F2FE] text-[#0284C7] border-[#BAE6FD]'
            : 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]';
          return (
            <span
              className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium border whitespace-nowrap ${badgeStyle}`}
            >
              {src === 'Website' ? 'Database calls' : src}
            </span>
          );
        },
      },
      {
        key: 'leadManager1',
        header: 'Lead Manager 1',
        headerLabel: 'Lead Manager 1',
        type: 'select',
        sortable: true,
        width: 150,
        options: users.map((u) => ({ value: u.id, label: u.name })),
        getValue: (c) => c.leadManager1 || 'u2',
        renderCell: (c) => (
          <span className="text-[12.5px] text-ink-600 whitespace-nowrap">
            {c.leadManager1 ? userName(c.leadManager1) || c.leadManager1 : '—'}
          </span>
        ),
      },
      {
        key: 'account',
        header: 'Account Name',
        headerLabel: 'Account Name',
        type: 'select',
        sortable: true,
        width: 185,
        options: accounts.map((a) => ({ value: a.id, label: a.name })),
        getValue: (c) => c.accountId || '',
        renderCell: (c) => (
          <span className="text-[12.5px] font-medium text-ink-700 truncate block">
            {accountName(c.accountId) || '—'}
          </span>
        ),
        renderAccessory: (c) =>
          c.accountId ? (
            <Link
              to={`/accounts?open=${c.accountId}`}
              title={`Open Account: ${accountName(c.accountId)}`}
              className="text-[#1262E0] hover:text-[#0E4FB5] p-0.5 rounded"
            >
              <ExternalLink size={11.5} />
            </Link>
          ) : null,
      },
      {
        key: 'lifecycle',
        header: 'Lifecycle Stage',
        headerLabel: 'Lifecycle Stage',
        type: 'select',
        sortable: true,
        width: 140,
        options: LIFECYCLES.map((l) => ({ value: l, label: l })),
        getValue: (c) => c.lifecycle || 'New',
        renderCell: (c) => <StatusBadge kind="lifecycle" value={c.lifecycle} className="min-w-[80px]" />,
      },
      {
        key: 'designation',
        header: 'Title',
        headerLabel: 'Title',
        type: 'text',
        sortable: true,
        width: 155,
        getValue: (c) => c.designation || '',
        renderCell: (c, val) => <span className="text-[12.5px] text-ink-600">{val || '—'}</span>,
      },
      {
        key: 'city',
        header: 'City',
        headerLabel: 'City',
        type: 'text',
        sortable: true,
        width: 130,
        getValue: (c) => c.city || c.mailingCity || '',
        renderCell: (c, val) => <span className="text-[12.5px] text-ink-700">{val || '—'}</span>,
      },
      {
        key: 'lastContacted',
        header: 'Last Contacted',
        headerLabel: 'Last Contacted',
        type: 'date',
        sortable: true,
        width: 140,
        getValue: (c) => c.lastContacted || '',
        renderCell: (c) => (
          <span className="text-[12.5px] whitespace-nowrap">{fmtDate(c.lastContacted)}</span>
        ),
      },
    ],
    [users, accounts, userName, accountName]
  );

  const handleSpreadsheetSaveContactCell = (contact, col, newValue) => {
    const now = todayISO();
    const patch = { modifiedTime: now, touched: true };

    if (col.key === 'createdTime') {
      patch.createdTime = newValue;
      patch.createdOn = newValue;
    } else if (col.key === 'owner') {
      patch.ownerId = newValue;
      patch.contactOwner = newValue;
    } else if (col.key === 'firstName') {
      const fullName = [newValue, contact.lastName].filter(Boolean).join(' ').trim() || newValue;
      patch.firstName = newValue;
      patch.name = fullName;
      patch.contactName = fullName;
    } else if (col.key === 'lastName') {
      const fullName = [contact.firstName, newValue].filter(Boolean).join(' ').trim() || newValue;
      patch.lastName = newValue;
      patch.name = fullName;
      patch.contactName = fullName;
    } else if (col.key === 'mobile') {
      patch.mobile = newValue;
      if (!contact.phone) patch.phone = newValue;
    } else if (col.key === 'email') {
      patch.email = newValue;
    } else if (col.key === 'leadSource') {
      patch.leadSource = newValue;
    } else if (col.key === 'leadManager1') {
      patch.leadManager1 = newValue;
    } else if (col.key === 'account') {
      const matchedAcc =
        accountsById[newValue] ||
        accounts.find(
          (a) =>
            a.id === newValue ||
            String(a.name || '').trim().toLowerCase() === String(newValue || '').trim().toLowerCase()
        );
      if (matchedAcc) {
        patch.accountId = matchedAcc.id;
        patch.accountName = matchedAcc.name;
      }
    } else if (col.key === 'lifecycle') {
      patch.lifecycle = newValue;
    } else if (col.key === 'designation') {
      patch.designation = newValue;
    } else if (col.key === 'city') {
      patch.city = newValue;
      patch.mailingCity = newValue;
    } else if (col.key === 'lastContacted') {
      patch.lastContacted = newValue;
    } else {
      patch[col.key] = newValue;
    }

    updateRecord('contacts', contact.id, patch);
    toast.success(`Updated ${col.headerLabel || col.header} for ${patch.name || contact.name}`);
  };

  const handleSpreadsheetAddContact = (draft) => {
    const fName = String(draft.firstName || '').trim();
    const lName = String(draft.lastName || '').trim();
    if (!fName && !lName) {
      return { error: 'Please enter at least a First Name or Last Name.' };
    }
    const emailVal = String(draft.email || '').trim();
    if (emailVal && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailVal)) {
      return { error: 'Please enter a valid Email address.' };
    }
    const fullName = [fName, lName].filter(Boolean).join(' ').trim();
    const acc = accounts[0];
    const now = draft.createdTime || todayISO();
    const created = createRecord('contacts', {
      salutation: 'Mr.',
      firstName: fName || fullName,
      lastName: lName || fullName,
      name: fullName,
      contactName: fullName,
      accountId: acc?.id || '',
      accountName: acc?.name || '',
      ownerId: draft.owner || activeUser?.id || 'u1',
      contactOwner: draft.owner || activeUser?.id || 'u1',
      mobile: draft.mobile || '+91 98400 11111',
      phone: draft.mobile || '+91 98400 11111',
      email: emailVal || `${(fName || 'contact').toLowerCase()}@company.in`,
      leadSource: draft.leadSource || 'Website',
      leadManager1: draft.leadManager1 || 'u2',
      lifecycle: 'New',
      designation: 'Executive',
      department: 'Sales',
      city: 'Chennai',
      mailingCity: 'Chennai',
      createdOn: now,
      createdTime: now,
      lastContacted: now,
    });
    toast.success(`Contact "${created.name}" added to spreadsheet`);
    table.setPage(1);
    return { created };
  };

  const columnChooser = (
    <ColumnChooserMenu
      allColumns={CONTACT_COLUMN_CATALOG}
      columnOrder={columnOrder}
      hiddenSet={hidden}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onMoveColumn={moveColumnByOffset}
      onResetColumns={resetColumns}
    />
  );

  const columns = [
    ...COLUMNS,
    {
      key: 'actions',
      header: columnChooser,
      align: 'center',
      width: 48,
      render: (c) => <ActionMenu vertical boxed={false} items={rowMenu(c)} />,
    },
  ];

  const activeContactId =
    (routeContactId && routeContactId !== 'create' && routeContactId !== 'new' ? routeContactId : null) ||
    searchParams.get('id') ||
    searchParams.get('open') ||
    viewingId;
  const viewingRec = activeContactId ? contacts.find((c) => c.id === activeContactId) || null : null;
  const selectedIds = [...table.selected];

  const timelineContactsPool = filtered.length > 0 ? filtered : contacts;
  const selectedTimelineContact = useMemo(() => {
    if (timelineContactId) {
      const found = contacts.find((c) => c.id === timelineContactId);
      if (found) return found;
    }
    if (selectedIds.length > 0) {
      const found = contacts.find((c) => c.id === selectedIds[0]);
      if (found) return found;
    }
    return timelineContactsPool[0] || null;
  }, [timelineContactId, selectedIds, timelineContactsPool, contacts]);

  // Sections visibility in left filter panel (auto-expand when filterSearch has matches)
  const isSearchingCatalog = filterSearch.trim().length > 0;
  const showSysSection = isSearchingCatalog ? catalogMatch.systemFilters.length > 0 : sysOpen;
  const showWebsiteSection = isSearchingCatalog ? catalogMatch.websiteActivityFilters.length > 0 : websiteOpen;
  const showFieldsSection = isSearchingCatalog ? catalogMatch.fieldFilters.length > 0 : fieldsOpen;
  const showRelatedSection = isSearchingCatalog ? catalogMatch.relatedFilters.length > 0 : relatedOpen;

  if (isCreate) {
    const prefillAccountId = searchParams.get('account');
    return (
      <CreateContact
        initialRecord={prefillAccountId ? { accountId: prefillAccountId } : undefined}
        onCancel={() => {
          setCreateViewOpen(false);
          navigate('/contacts');
        }}
        onSuccess={(createdOrId) => {
          setCreateViewOpen(false);
          const newId = typeof createdOrId === 'string' ? createdOrId : createdOrId?.id;
          if (newId) {
            openContactDetail(newId);
          } else {
            navigate('/contacts');
          }
        }}
      />
    );
  }

  if (viewingRec) {
    return (
      <ContactDetail
        contact={viewingRec}
        contactsList={table.sorted}
        onBack={closeContactDetail}
        onSelectContact={openContactDetail}
        initialTab={detailTab}
      />
    );
  }

  return (
    <div>
      <PageHeader
        views={allViews}
        view={savedView}
        onViewChange={handleSelectView}
        headerMode={headerMode}
        onHeaderModeChange={setHeaderMode}
        tabMenu={[
          {
            label: 'Save current filters as view',
            icon: BookmarkPlus,
            onClick: () => setSaveViewModal({ mode: 'create', name: '' }),
          },
          activeCustomView && {
            label: `Rename "${activeCustomView.name}"`,
            icon: Edit3,
            onClick: () => setSaveViewModal({ mode: 'rename', id: activeCustomView.id, name: activeCustomView.name }),
          },
          activeCustomView && {
            label: `Delete "${activeCustomView.name}"`,
            icon: Trash2,
            danger: true,
            onClick: () => {
              deleteContactView(activeCustomView.id);
              setSavedView('all');
              toast.info(`Deleted saved view "${activeCustomView.name}"`);
            },
          },
          { divider: true },
          { label: 'Advanced Filter Builder (AND/OR)', icon: SlidersHorizontal, onClick: () => setBuilderOpen(true) },
          { label: 'Export filtered contacts (CSV)', icon: Download, onClick: () => exportRows(table.sorted) },
          { label: `Select all ${filtered.length} filtered`, onClick: table.selectAllFiltered },
          { label: 'Reset to default view', icon: RotateCcw, onClick: resetToDefaultView },
        ]}
        toolbar={{
          labeled: true,
          filterActive: panelOpen,
          onFilter: () => setPanelOpen((o) => !o),
          sortOptions: [
            { key: 'name', label: 'Contact Name' },
            { key: 'account', label: 'Account Name' },
            { key: 'email', label: 'Email' },
            { key: 'owner', label: 'Contact Owner' },
            { key: 'lifecycle', label: 'Lifecycle Stage' },
            { key: 'lastContacted', label: 'Last Contacted' },
            { key: 'createdOn', label: 'Created Time' },
            { key: 'mailingCity', label: 'Mailing Address - City' },
          ],
          sort: table.sort,
          onSort: table.setSort,
          layouts: ['list', 'spreadsheet', 'kanban', 'grid', 'split', 'timeline', 'chart'],
          layout,
          onLayout: setLayout,
          onRefresh: refresh,
          refreshing,
          dense,
          onDense: () => setDense((d) => !d),
          module: 'Contacts',
          primary: {
            label: 'Create Contact',
            testId: 'create-contact-btn',
            onClick: () => navigate('/contacts/create'),
            menu: [
              { label: 'Create Contact', icon: Plus, onClick: () => navigate('/contacts/create') },
              { label: 'Import Contacts (CSV)', icon: Upload, testId: 'import-contacts-csv-menu-item', onClick: () => setCsvImportOpen(true) },
              { label: 'Save Custom Filter View', icon: BookmarkPlus, onClick: () => setSaveViewModal({ mode: 'create', name: '' }) },
              { label: 'Export filtered contacts (CSV)', icon: Download, onClick: () => exportRows(table.sorted) },
            ],
          },
          secondary: {
            label: 'Map View',
            icon: MapPin,
            onClick: () => setMapModalOpen(true),
          },
          moreItems: [
            { label: 'Advanced Filter Builder', icon: Filter, onClick: () => setBuilderOpen(true) },
            {
              label: 'Export selected (CSV)',
              icon: Download,
              disabled: !selectedIds.length,
              onClick: () => exportRows(contacts.filter((c) => table.selected.has(c.id))),
            },
            {
              label: 'Change owner of selected',
              icon: UserCog,
              disabled: !selectedIds.length,
              onClick: () => {
                setBulkMode('owner');
                setBulkValue(users[0]?.id || 'u1');
              },
            },
            {
              label: 'Update lifecycle of selected',
              icon: FolderKanban,
              disabled: !selectedIds.length,
              onClick: () => {
                setBulkMode('lifecycle');
                setBulkValue('Qualified');
              },
            },
            {
              label: 'Delete selected',
              icon: Trash2,
              danger: true,
              disabled: !selectedIds.length,
              onClick: () => handleDeleteRequest(selectedIds, `${selectedIds.length} contacts`),
            },
          ],
        }}
      />

      {/* Secondary Enterprise Sub-bar: Table Search, Active Filter Summary, Join Logic, Role Access Control */}
      <div className="card px-3 py-2 mb-3 flex flex-wrap items-center justify-between gap-2.5 text-[12.5px]">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[200px]">
          <div className="relative w-full sm:w-[280px]">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
            <input
              type="search"
              value={tableSearch}
              onChange={(e) => {
                setTableSearch(e.target.value);
                table.setPage(1);
              }}
              placeholder="Search contacts in table..."
              aria-label="Search contacts in table"
              className="input h-8 pl-8 pr-7 text-[12.5px]"
            />
            {tableSearch && (
              <button
                type="button"
                onClick={() => setTableSearch('')}
                aria-label="Clear table search"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Role & Record-Level Permission Controls */}
        <div className="flex flex-wrap items-center gap-2.5 sm:ml-auto">
          <div className="flex items-center gap-1.5 text-[12px] text-ink-600">
            <Shield size={13.5} className="text-primary" />
            <select
              aria-label="Active CRM User Role"
              value={activeUserId}
              onChange={(e) => setActiveUserId(e.target.value)}
              className="h-7 px-2 rounded border border-line bg-white text-[12px] text-ink"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>
          <label className="inline-flex items-center gap-1.5 text-[12px] text-ink-600 cursor-pointer select-none">
            <input
              type="checkbox"
              className="cb"
              checked={enforcePermissions}
              onChange={(e) => setEnforcePermissions(e.target.checked)}
            />
            <span>Strict Owner Access</span>
          </label>
        </div>
      </div>

      {/* Active Filter Chips & Result Indicator Bar */}
      <div className="card px-3 py-2 mb-3 bg-[#F8FAFD] border-line flex flex-wrap items-center justify-between gap-2 text-[12px]">
        <div className="flex flex-wrap items-center gap-2">
          {/* Result Count Indicator */}
          <div className="text-ink-600 font-medium flex items-center gap-1.5">
            {activeFilterCount > 0 ? (
              <>
                <span className="text-ink font-semibold">
                  Showing {table.totalRows} of {contacts.length} contacts
                </span>
                <span className="px-1.5 py-0.2 rounded text-[11px] font-semibold bg-primary-100 text-primary border border-primary-200">
                  Filtered
                </span>
              </>
            ) : (
              <span className="text-ink font-semibold">Showing {contacts.length} contacts</span>
            )}
          </div>

          {/* Conjunction Indicator / Switcher if multiple filters */}
          {activeFilterCount > 1 && (
            <div className="inline-flex items-center gap-1 ml-1 text-[11px] bg-white border border-line rounded px-1.5 py-0.5 text-ink-600">
              <span className="text-ink-400">Match:</span>
              <button
                type="button"
                onClick={() => setGlobalJoin(globalJoin === 'AND' ? 'OR' : 'AND')}
                className="font-bold text-primary hover:underline"
                title="Toggle between AND / OR logic"
              >
                {globalJoin}
              </button>
            </div>
          )}

          {/* Active Search Chip */}
          {tableSearch && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-line text-ink-700 shadow-2xs">
              <Search size={11} className="text-ink-400" />
              <span>&ldquo;{tableSearch}&rdquo;</span>
              <button
                type="button"
                onClick={() => setTableSearch('')}
                aria-label="Remove search filter"
                className="text-ink-400 hover:text-danger ml-0.5"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {/* Quick Lifecycle Chip */}
          {lifecycleQuick && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-line text-ink-700 shadow-2xs">
              <span className="text-ink-400 font-medium">Stage:</span>
              <span className="font-medium">{lifecycleQuick}</span>
              <button
                type="button"
                onClick={() => setLifecycleQuick('')}
                aria-label="Remove lifecycle filter"
                className="text-ink-400 hover:text-danger ml-0.5"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {/* System Defined Filter Chips */}
          {[...sysFilters].map((key) => {
            const item = SYSTEM_DEFINED_FILTERS.find((s) => s.key === key);
            return (
              <span
                key={key}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-line text-ink-700 shadow-2xs"
              >
                <span className="text-primary font-medium">System:</span>
                <span>{item?.label || key}</span>
                <button
                  type="button"
                  onClick={() => toggleSystemFilter(key)}
                  aria-label={`Remove ${key} filter`}
                  className="text-ink-400 hover:text-danger ml-0.5"
                >
                  <X size={12} />
                </button>
              </span>
            );
          })}

          {/* Website Activity Filter Chips */}
          {Object.entries(websiteConfigs)
            .filter(([, cfg]) => cfg?.enabled)
            .map(([key, cfg]) => {
              const item = WEBSITE_ACTIVITY_FILTERS.find((w) => w.key === key);
              return (
                <span
                  key={key}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-line text-ink-700 shadow-2xs"
                >
                  <span className="text-emerald-700 font-medium">Website:</span>
                  <span>{item?.label || key}</span>
                  <span className="text-ink-400 text-[11px]">{cfg.operator} {cfg.value || ''}</span>
                  <button
                    type="button"
                    onClick={() => toggleWebsiteFilter({ key })}
                    aria-label={`Remove ${item?.label || key} filter`}
                    className="text-ink-400 hover:text-danger ml-0.5"
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}

          {/* Field Filter Chips */}
          {Object.entries(fieldConfigs)
            .filter(([, cfg]) => cfg?.enabled)
            .map(([key, cfg]) => {
              const item = CONTACT_FIELD_FILTERS.find((f) => f.key === key);
              return (
                <span
                  key={key}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-line text-ink-700 shadow-2xs"
                >
                  <span className="font-medium text-ink-800">{item?.label || key}:</span>
                  <span className="text-ink-500 text-[11px]">{cfg.operator} {cfg.value || ''}</span>
                  <button
                    type="button"
                    onClick={() => toggleFieldFilter({ key, type: cfg.type })}
                    aria-label={`Remove ${item?.label || key} filter`}
                    className="text-ink-400 hover:text-danger ml-0.5"
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}

          {/* Related Module Filter Chips */}
          {Object.entries(relatedConfigs)
            .filter(([, cfg]) => cfg?.enabled)
            .map(([key, cfg]) => {
              const item = RELATED_MODULE_FILTERS.find((r) => r.key === key);
              return (
                <span
                  key={key}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-line text-ink-700 shadow-2xs"
                >
                  <span className="text-purple-700 font-medium">Related:</span>
                  <span>{item?.label || key}</span>
                  <span className="text-ink-400 text-[11px]">({cfg.mode || cfg.operator})</span>
                  <button
                    type="button"
                    onClick={() => toggleRelatedFilter({ key })}
                    aria-label={`Remove ${item?.label || key} filter`}
                    className="text-ink-400 hover:text-danger ml-0.5"
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}

          {/* Builder Rule Chips */}
          {builderRules.map((rule) => (
            <span
              key={rule.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary-50 border border-primary-200 text-primary-900 shadow-2xs"
            >
              <span className="font-semibold text-primary">{rule.label || rule.field}:</span>
              <span className="text-[11px]">{rule.operator} {rule.value || ''}</span>
              <button
                type="button"
                onClick={() => removeBuilderRule(rule.id)}
                aria-label={`Remove ${rule.label || rule.field} rule`}
                className="text-primary-400 hover:text-danger ml-0.5"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>

        {/* Clear All button on right */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-[11.5px] font-semibold text-primary hover:text-danger hover:underline transition-colors"
            >
              Clear All ({activeFilterCount})
            </button>
            <button
              type="button"
              onClick={resetToDefaultView}
              className="text-[11.5px] text-ink-400 hover:text-ink hover:underline"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {/* Main Two-Column Content Area: Left Advanced Filter Sidebar + Right Contacts Table */}
      <div className="flex gap-3 items-start">
        {panelOpen && (
          <>
            {/* Mobile backdrop for drawer overlay */}
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
              onClick={() => setPanelOpen(false)}
            />
            <aside
              aria-label="Filter Contacts by"
              className={`fixed inset-y-0 left-0 z-50 w-[290px] max-w-[85vw] bg-white shadow-2xl p-4 overflow-y-auto thin-scroll lg:static lg:z-auto lg:w-[228px] lg:shadow-none lg:card lg:shrink-0 lg:px-3 lg:py-3.5 lg:sticky ${
                headerMode === 'fixed'
                  ? 'lg:top-[184px] lg:max-h-[calc(100vh-196px)]'
                  : 'lg:top-[72px] lg:max-h-[calc(100vh-92px)]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-[14.5px] font-semibold text-ink">Filter Contacts by</h2>
                <div className="flex items-center gap-1.5">
                  {activeFilterCount > 0 && (
                    <span
                      title="Active filters count"
                      className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-white text-[11px] font-semibold"
                    >
                      {activeFilterCount}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setPanelOpen(false)}
                    aria-label="Close filters"
                    className="lg:hidden p-1 rounded-md text-ink-400 hover:text-ink hover:bg-page"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

            {/* Filter Option Search Input (searches filter labels across all 3 sections) */}
            <div className="relative mt-2.5">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
              <input
                type="text"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                placeholder="Search"
                aria-label="Search filter options"
                className="input h-8 pl-8 pr-7 text-[12.5px]"
              />
              {filterSearch && (
                <button
                  type="button"
                  onClick={() => setFilterSearch('')}
                  aria-label="Clear filter search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {activeFilterCount > 0 && (
              <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-line-soft text-[12px]">
                <button type="button" onClick={clearAllFilters} className="text-primary font-medium hover:underline">
                  Clear All ({activeFilterCount})
                </button>
                <button
                  type="button"
                  onClick={() => setSaveViewModal({ mode: 'create', name: '' })}
                  className="text-ink-600 hover:text-primary font-medium inline-flex items-center gap-1"
                >
                  <BookmarkPlus size={12.5} /> Save View
                </button>
              </div>
            )}

            {catalogMatch.totalMatches === 0 && (
              <div className="py-8 text-center text-[12.5px] text-ink-500">
                No matching filters
              </div>
            )}

            {/* ==================== SECTION A: SYSTEM DEFINED FILTERS ==================== */}
            {catalogMatch.systemFilters.length > 0 && (
              <div className="mt-3.5">
                <button
                  type="button"
                  onClick={() => setSysOpen((o) => !o)}
                  className="w-full flex items-center gap-1 text-[13px] font-semibold text-ink text-left py-1"
                >
                  <ChevronDown size={15} className={`shrink-0 transition-transform ${showSysSection ? '' : '-rotate-90'}`} />
                  <span>System Defined Filters</span>
                </button>
                {showSysSection && (
                  <div className="mt-1.5 space-y-2 pl-1">
                    {catalogMatch.systemFilters.map((f) => (
                      <label
                        key={f.key}
                        title={f.label}
                        className="flex items-start gap-2 text-[12.5px] text-ink-600 hover:text-ink cursor-pointer leading-snug"
                      >
                        <input
                          type="checkbox"
                          className="cb mt-0.5 shrink-0"
                          checked={sysFilters.has(f.key)}
                          onChange={() => toggleSystemFilter(f.key)}
                        />
                        <span className="break-words">
                          <HighlightMatch text={f.label} query={filterSearch} />
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ==================== SECTION B: WEBSITE ACTIVITY ==================== */}
            {catalogMatch.websiteActivityFilters.length > 0 && (
              <div className="mt-4 pt-3 border-t border-line-soft">
                <button
                  type="button"
                  onClick={() => setWebsiteOpen((o) => !o)}
                  className="w-full flex items-center gap-1 text-[13px] font-semibold text-ink text-left py-1"
                >
                  <ChevronDown size={15} className={`shrink-0 transition-transform ${showWebsiteSection ? '' : '-rotate-90'}`} />
                  <span>Website Activity</span>
                </button>
                {showWebsiteSection && (
                  <div className="mt-1.5 space-y-2 pl-1">
                    {catalogMatch.websiteActivityFilters.map((w) => {
                      const cfg = websiteConfigs[w.key];
                      const isChecked = Boolean(cfg?.enabled);
                      const operators = OPERATORS_BY_TYPE[w.type || 'number'] || OPERATORS_BY_TYPE.number;
                      return (
                        <div key={w.key} className="space-y-1.5">
                          <label
                            title={w.label}
                            className="flex items-start gap-2 text-[12.5px] text-ink-600 hover:text-ink cursor-pointer leading-snug"
                          >
                            <input
                              type="checkbox"
                              className="cb mt-0.5 shrink-0"
                              checked={isChecked}
                              onChange={() => toggleWebsiteFilter(w)}
                            />
                            <span className="break-words">
                              <HighlightMatch text={w.label} query={filterSearch} />
                            </span>
                          </label>

                          {isChecked && (
                            <div className="pl-5 pr-0.5 py-1.5 space-y-1.5 rounded bg-[#F8FAFD] border border-line-soft">
                              <select
                                aria-label={`Operator for ${w.label}`}
                                value={cfg?.operator || operators[0]}
                                onChange={(e) => updateWebsiteConfig(w.key, { operator: e.target.value })}
                                className="input h-7 text-[11.5px] py-0 px-2 bg-white"
                              >
                                {operators.map((op) => (
                                  <option key={op} value={op}>
                                    {op}
                                  </option>
                                ))}
                              </select>
                              {cfg?.operator === 'between' ? (
                                <div className="grid grid-cols-2 gap-1">
                                  <input
                                    type={w.type === 'date' ? 'date' : 'number'}
                                    value={cfg?.value || ''}
                                    onChange={(e) => updateWebsiteConfig(w.key, { value: e.target.value })}
                                    placeholder="From"
                                    className="input h-7 text-[11.5px] px-2 bg-white"
                                  />
                                  <input
                                    type={w.type === 'date' ? 'date' : 'number'}
                                    value={cfg?.valueTo || ''}
                                    onChange={(e) => updateWebsiteConfig(w.key, { valueTo: e.target.value })}
                                    placeholder="To"
                                    className="input h-7 text-[11.5px] px-2 bg-white"
                                  />
                                </div>
                              ) : (
                                !['Today', 'Yesterday', 'This Week', 'This Month', 'Last 30 Days', 'is empty', 'is not empty'].includes(cfg?.operator) && (
                                  <input
                                    type={w.type === 'date' ? 'date' : w.type === 'number' ? 'number' : 'text'}
                                    value={cfg?.value || ''}
                                    onChange={(e) => updateWebsiteConfig(w.key, { value: e.target.value })}
                                    placeholder="Value"
                                    className="input h-7 text-[11.5px] px-2 bg-white"
                                  />
                                )
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ==================== SECTION C: FILTER BY FIELDS (33 FIELDS) ==================== */}
            {catalogMatch.fieldFilters.length > 0 && (
              <div className="mt-4 pt-3 border-t border-line-soft">
                <button
                  type="button"
                  onClick={() => setFieldsOpen((o) => !o)}
                  className="w-full flex items-center gap-1 text-[13px] font-semibold text-ink text-left py-1"
                >
                  <ChevronDown size={15} className={`shrink-0 transition-transform ${showFieldsSection ? '' : '-rotate-90'}`} />
                  <span>Filter By Fields</span>
                </button>
                {showFieldsSection && (
                  <div className="mt-1.5 space-y-2 pl-1">
                    {catalogMatch.fieldFilters.map((f) => {
                      const cfg = fieldConfigs[f.key];
                      const isChecked = Boolean(cfg?.enabled);
                      const operators = OPERATORS_BY_TYPE[f.type] || OPERATORS_BY_TYPE.text;
                      const isUnary = [
                        'Is empty',
                        'Is not empty',
                        'Today',
                        'Yesterday',
                        'This Week',
                        'This Month',
                        'Last 30 Days',
                        'Yes',
                        'No',
                      ].includes(cfg?.operator);

                      return (
                        <div key={f.key} className="space-y-1.5">
                          <label
                            title={f.label}
                            className="flex items-start gap-2 text-[12.5px] text-ink-600 hover:text-ink cursor-pointer leading-snug"
                          >
                            <input
                              type="checkbox"
                              className="cb mt-0.5 shrink-0"
                              checked={isChecked}
                              onChange={() => toggleFieldFilter(f)}
                            />
                            <span className="break-words">
                              <HighlightMatch text={f.label} query={filterSearch} />
                            </span>
                          </label>

                          {isChecked && (
                            <div className="pl-5 pr-0.5 py-1.5 space-y-1.5 rounded bg-[#F8FAFD] border border-line-soft">
                              {/* Operator Selector */}
                              <select
                                aria-label={`Operator for ${f.label}`}
                                value={cfg.operator}
                                onChange={(e) =>
                                  updateFieldConfig(f.key, {
                                    operator: e.target.value,
                                    value: f.type === 'boolean' ? e.target.value : cfg.value,
                                  })
                                }
                                className="input h-7 text-[11.5px] py-0 px-2 bg-white"
                              >
                                {operators.map((op) => (
                                  <option key={op} value={op}>
                                    {op}
                                  </option>
                                ))}
                              </select>

                              {/* Value Input(s) by Data Type */}
                              {!isUnary && f.type === 'lookup' && (
                                <>
                                  <input
                                    type="text"
                                    list={`lookup-${f.key}`}
                                    value={cfg.value || ''}
                                    onChange={(e) => updateFieldConfig(f.key, { value: e.target.value })}
                                    placeholder={
                                      cfg.operator === 'Is any of'
                                        ? 'Comma-separated names...'
                                        : `Select or type ${f.label}...`
                                    }
                                    aria-label={`Value for ${f.label}`}
                                    className="input h-7 text-[11.5px] px-2 bg-white"
                                  />
                                  <datalist id={`lookup-${f.key}`}>
                                    {(lookupOptionsBySource[f.lookupSource] || []).map((opt) => (
                                      <option key={opt.id} value={opt.label} />
                                    ))}
                                  </datalist>
                                </>
                              )}

                              {!isUnary && f.type === 'text' && (
                                <input
                                  type="text"
                                  value={cfg.value || ''}
                                  onChange={(e) => updateFieldConfig(f.key, { value: e.target.value })}
                                  placeholder={`Enter ${f.label}...`}
                                  aria-label={`Value for ${f.label}`}
                                  className="input h-7 text-[11.5px] px-2 bg-white"
                                />
                              )}

                              {!isUnary && f.type === 'date' && (
                                <div className="space-y-1">
                                  <input
                                    type="date"
                                    value={cfg.value || ''}
                                    onChange={(e) => updateFieldConfig(f.key, { value: e.target.value })}
                                    aria-label={`Date value for ${f.label}`}
                                    className="input h-7 text-[11.5px] px-2 bg-white"
                                  />
                                  {cfg.operator === 'Between' && (
                                    <input
                                      type="date"
                                      value={cfg.valueTo || ''}
                                      onChange={(e) => updateFieldConfig(f.key, { valueTo: e.target.value })}
                                      aria-label={`End date for ${f.label}`}
                                      className="input h-7 text-[11.5px] px-2 bg-white"
                                    />
                                  )}
                                </div>
                              )}

                              {!isUnary && f.type === 'number' && (
                                <div className="space-y-1">
                                  <input
                                    type="number"
                                    value={cfg.value || ''}
                                    onChange={(e) => updateFieldConfig(f.key, { value: e.target.value })}
                                    placeholder="Value"
                                    aria-label={`Number value for ${f.label}`}
                                    className="input h-7 text-[11.5px] px-2 bg-white"
                                  />
                                  {cfg.operator === 'Between' && (
                                    <input
                                      type="number"
                                      value={cfg.valueTo || ''}
                                      onChange={(e) => updateFieldConfig(f.key, { valueTo: e.target.value })}
                                      placeholder="Max value"
                                      aria-label={`Max number value for ${f.label}`}
                                      className="input h-7 text-[11.5px] px-2 bg-white"
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ==================== SECTION C: FILTER BY RELATED MODULES (ALL 17 MODULES) ==================== */}
            {catalogMatch.relatedFilters.length > 0 && (
              <div className="mt-4 pt-3 border-t border-line-soft">
                <button
                  type="button"
                  onClick={() => setRelatedOpen((o) => !o)}
                  className="w-full flex items-center gap-1 text-[13px] font-semibold text-ink text-left py-1"
                >
                  <ChevronDown size={15} className={`shrink-0 transition-transform ${showRelatedSection ? '' : '-rotate-90'}`} />
                  <span>Filter By Related Modules</span>
                </button>
                {showRelatedSection && (
                  <div className="mt-1.5 space-y-2 pl-1">
                    {catalogMatch.relatedFilters.map((rel) => {
                      const cfg = relatedConfigs[rel.key];
                      const isChecked = Boolean(cfg?.enabled);
                      const modeOptions = [
                        ...(rel.presets || []),
                        ...RELATED_CONDITION_MODES.filter(
                          (m) => !(rel.presets || []).some((p) => p.value === m.value)
                        ),
                      ];

                      return (
                        <div key={rel.key} className="space-y-1.5">
                          <label
                            title={rel.label}
                            className="flex items-start gap-2 text-[12.5px] text-ink-600 hover:text-ink cursor-pointer leading-snug"
                          >
                            <input
                              type="checkbox"
                              className="cb mt-0.5 shrink-0"
                              checked={isChecked}
                              onChange={() => toggleRelatedFilter(rel)}
                            />
                            <span className="break-words">
                              <HighlightMatch text={rel.label} query={filterSearch} />
                            </span>
                          </label>

                          {isChecked && (
                            <div className="pl-5 pr-0.5 py-1.5 space-y-1.5 rounded bg-[#F8FAFD] border border-line-soft">
                              <select
                                aria-label={`Condition for related ${rel.label}`}
                                value={cfg.mode || 'has_any'}
                                onChange={(e) =>
                                  updateRelatedConfig(rel.key, {
                                    mode: e.target.value,
                                    value: '',
                                    valueTo: '',
                                  })
                                }
                                className="input h-7 text-[11.5px] py-0 px-2 bg-white"
                              >
                                {modeOptions.map((m) => (
                                  <option key={m.value} value={m.value}>
                                    {m.label}
                                  </option>
                                ))}
                              </select>

                              {cfg.mode === 'count' && (
                                <div className="space-y-1">
                                  <select
                                    value={cfg.operator || 'Greater than'}
                                    onChange={(e) => updateRelatedConfig(rel.key, { operator: e.target.value })}
                                    className="input h-7 text-[11.5px] py-0 px-2 bg-white"
                                  >
                                    {OPERATORS_BY_TYPE.number.map((op) => (
                                      <option key={op} value={op}>
                                        {op}
                                      </option>
                                    ))}
                                  </select>
                                  <input
                                    type="number"
                                    min={0}
                                    value={cfg.value ?? '0'}
                                    onChange={(e) => updateRelatedConfig(rel.key, { value: e.target.value })}
                                    placeholder="Count"
                                    className="input h-7 text-[11.5px] px-2 bg-white"
                                  />
                                </div>
                              )}

                              {cfg.mode === 'status' && (
                                <select
                                  value={cfg.value || ''}
                                  onChange={(e) => updateRelatedConfig(rel.key, { value: e.target.value })}
                                  className="input h-7 text-[11.5px] py-0 px-2 bg-white"
                                >
                                  <option value="">Any status</option>
                                  {(rel.statuses || []).map((st) => (
                                    <option key={st} value={st}>
                                      {st}
                                    </option>
                                  ))}
                                </select>
                              )}

                              {cfg.mode === 'owner' && (
                                <select
                                  value={cfg.value || ''}
                                  onChange={(e) => updateRelatedConfig(rel.key, { value: e.target.value })}
                                  className="input h-7 text-[11.5px] py-0 px-2 bg-white"
                                >
                                  <option value="">Any owner</option>
                                  {users.map((u) => (
                                    <option key={u.id} value={u.name}>
                                      {u.name}
                                    </option>
                                  ))}
                                </select>
                              )}

                              {(cfg.mode === 'created_date' || cfg.mode === 'updated_date') && (
                                <div className="space-y-1">
                                  <select
                                    value={cfg.operator || 'On'}
                                    onChange={(e) => updateRelatedConfig(rel.key, { operator: e.target.value })}
                                    className="input h-7 text-[11.5px] py-0 px-2 bg-white"
                                  >
                                    {OPERATORS_BY_TYPE.date.map((op) => (
                                      <option key={op} value={op}>
                                        {op}
                                      </option>
                                    ))}
                                  </select>
                                  {!['Today', 'Yesterday', 'This Week', 'This Month', 'Last 30 Days', 'Is empty'].includes(cfg.operator) && (
                                    <input
                                      type="date"
                                      value={cfg.value || ''}
                                      onChange={(e) => updateRelatedConfig(rel.key, { value: e.target.value })}
                                      className="input h-7 text-[11.5px] px-2 bg-white"
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </aside>
        </>
        )}

        {/* Right Main Contacts Table */}
        <section className="card flex-1 min-w-0 overflow-hidden">
          <BulkBar count={selectedIds.length} onClear={table.clearSelection}>
            <BulkButton
              icon={UserCog}
              onClick={() => {
                setBulkMode('owner');
                setBulkValue(users[0]?.id || 'u1');
              }}
            >
              Change owner
            </BulkButton>
            <BulkButton
              onClick={() => {
                setBulkMode('lifecycle');
                setBulkValue('Qualified');
              }}
            >
              Update lifecycle
            </BulkButton>
            <BulkButton
              icon={Download}
              onClick={() => exportRows(contacts.filter((c) => table.selected.has(c.id)))}
            >
              Export
            </BulkButton>
            <BulkButton
              icon={Trash2}
              danger
              onClick={() => handleDeleteRequest(selectedIds, `${selectedIds.length} contacts`)}
            >
              Delete
            </BulkButton>
          </BulkBar>

          {layout === 'list' && (
            <>
              <DataTable
                columns={columns}
                rows={table.pageRows}
                table={table}
                showIndex={false}
                loading={refreshing}
                dense={dense}
                minWidth={1020}
                columnWidths={columnWidths}
                onReorderColumns={reorderColumns}
                onMoveColumn={moveColumnByOffset}
                onResizeColumn={setColumnWidth}
                stickyColumnKey="firstName"
                emptyTitle={activeFilterCount > 0 ? "No records match these filters" : "No contacts found"}
                emptyHint={activeFilterCount > 0 ? "Try adjusting your filter criteria, switching conjunction logic (AND / OR), or clearing the search query." : "Get started by adding your first contact to Honey One CRM."}
                emptyAction={
                  <div className="flex items-center gap-2 mt-2">
                    {activeFilterCount > 0 && (
                      <button type="button" className="btn-secondary h-9" onClick={clearAllFilters}>
                        Reset Filters &amp; Search
                      </button>
                    )}
                    <button type="button" className="btn-primary h-9" onClick={() => navigate('/contacts/create')}>
                      <Plus size={16} />
                      Create Contact
                    </button>
                  </div>
                }
              />
              <div
                data-testid="contacts-footer-bar"
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-line bg-white text-[12.5px] text-ink-600"
              >
                <RecordSelectionSummary
                  total={filtered.length}
                  selectedCount={table.selected.size}
                  onClearSelection={table.clearSelection}
                  totalTestId="contacts-total-count"
                  selectionTestId="contacts-selected-count"
                  deselectTestId="contacts-deselect-all-btn"
                />
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 text-[12px] mr-1">
                    <span className="text-ink-400">Rows per page:</span>
                    <select
                      value={table.pageSize}
                      onChange={(e) => table.setPageSize(Number(e.target.value))}
                      className="h-7 px-2 rounded border border-line bg-[#F8FAFD] text-[12px] text-ink cursor-pointer focus:outline-none focus:border-primary"
                      aria-label="Records per page"
                    >
                      {[10, 25, 30, 50, 100].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-1 font-medium">
                    <button
                      type="button"
                      data-testid="contacts-prev-page"
                      disabled={table.page <= 1}
                      onClick={() => table.setPage(table.page - 1)}
                      className="w-7 h-7 rounded border border-line flex items-center justify-center text-ink hover:bg-page disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-[13px]"
                      aria-label="Previous page"
                    >
                      ‹
                    </button>
                    {(() => {
                      const maxP = Math.max(1, Math.ceil(filtered.length / table.pageSize));
                      const cnt = Math.min(5, maxP);
                      let startP = Math.max(1, table.page - 2);
                      startP = Math.min(startP, maxP - cnt + 1);
                      return Array.from({ length: cnt }, (_, idx) => startP + idx).map((p) => (
                        <button
                          key={p}
                          type="button"
                          data-testid={`contacts-page-${p}`}
                          onClick={() => table.setPage(p)}
                          aria-current={p === table.page ? 'page' : undefined}
                          className={`min-w-7 h-7 px-1.5 rounded border text-[12px] flex items-center justify-center transition-colors ${
                            p === table.page
                              ? 'bg-primary border-primary text-white font-semibold'
                              : 'border-line bg-white text-ink hover:bg-page'
                          }`}
                        >
                          {p}
                        </button>
                      ));
                    })()}
                    <span
                      data-testid="contacts-page-range"
                      className="px-2 py-0.5 text-[12px] font-medium text-ink-700 tabular-nums"
                    >
                      {filtered.length === 0
                        ? '0 to 0'
                        : `${(table.page - 1) * table.pageSize + 1} to ${Math.min(filtered.length, table.page * table.pageSize)}`}
                    </span>
                    <button
                      type="button"
                      data-testid="contacts-next-page"
                      disabled={table.page >= Math.max(1, Math.ceil(filtered.length / table.pageSize))}
                      onClick={() => table.setPage(table.page + 1)}
                      className="w-7 h-7 rounded border border-line flex items-center justify-center text-ink hover:bg-page disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-[13px]"
                      aria-label="Next page"
                    >
                      ›
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {layout === 'spreadsheet' && (
            <SpreadsheetView
              moduleType="contacts"
              columns={spreadsheetColumns}
              rows={table.pageRows}
              table={table}
              totalFilteredCount={filtered.length}
              dense={dense}
              onSaveCell={handleSpreadsheetSaveContactCell}
              onAddRow={handleSpreadsheetAddContact}
              onDeleteRows={(ids, label) =>
                handleDeleteRequest(ids, label || `${ids.length} contact(s)`)
              }
              onOpenDetail={(id) => openContactDetail(id)}
              onOpenImportCSV={() => setCsvImportOpen(true)}
              onExportCSV={() => exportRows(table.sorted)}
            />
          )}

          {layout === 'kanban' && (
            <div className="p-3">
              <KanbanView
                groups={LIFECYCLES.map((l) => ({ key: l, label: l, color: LIFECYCLE_COLORS[l] }))}
                rows={table.sorted}
                groupOf={(c) => c.lifecycle}
                onMove={(c, to) => updateRecord('contacts', c.id, { lifecycle: to })}
                onCardClick={(c) => openContactDetail(c.id)}
                renderCard={(c) => (
                  <div className="flex items-start gap-2.5">
                    <PersonAvatar name={c.name} size={32} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] font-semibold text-ink truncate">{c.name}</div>
                      <div className="text-[12px] text-ink-500 truncate">
                        {c.designation} · {accountName(c.accountId)}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <StatusBadge kind="leadSource" value={c.leadSource} size="sm" />
                        <UserAvatar userId={c.ownerId} size={22} />
                      </div>
                    </div>
                  </div>
                )}
              />
            </div>
          )}

          {layout === 'grid' && (
            <GridView
              testId="contacts-grid-view"
              rows={table.pageRows}
              table={table}
              totalCount={filtered.length}
              dense={dense}
              quickFilterValue={lifecycleQuick}
              quickFilterOptions={LIFECYCLES}
              onQuickFilterChange={(v) => {
                setLifecycleQuick(v);
                table.setPage(1);
              }}
              quickActionLabel="Contact"
              onQuickAction={() => navigate('/contacts/create')}
              emptyTitle={activeFilterCount > 0 ? 'No records match these filters' : 'No contacts found'}
              emptyHint={
                activeFilterCount > 0
                  ? 'Try adjusting your filter criteria or clearing the search query.'
                  : 'Get started by adding your first contact to Honey One CRM.'
              }
              emptyAction={
                <div className="flex items-center gap-2 mt-2">
                  {activeFilterCount > 0 && (
                    <button type="button" className="btn-secondary h-9" onClick={clearAllFilters}>
                      Reset Filters &amp; Search
                    </button>
                  )}
                  <button type="button" className="btn-primary h-9" onClick={() => navigate('/contacts/create')}>
                    <Plus size={16} />
                    Create Contact
                  </button>
                </div>
              }
              columns={[
                {
                  key: 'name',
                  header: 'Contact Name',
                  minWidth: 195,
                  sortable: true,
                  render: (c) => (
                    <button
                      type="button"
                      onClick={() => openContactDetail(c.id)}
                      data-testid={`grid-contact-name-${c.id}`}
                      className="font-medium text-[#1E293B] hover:text-[#1262E0] hover:underline text-left truncate block max-w-full cursor-pointer"
                    >
                      {c.name}
                    </button>
                  ),
                },
                {
                  key: 'lifecycle',
                  header: 'Contact Status',
                  minWidth: 155,
                  sortable: true,
                  render: (c) => <GridStatusPill value={c.lifecycle || 'New'} />,
                },
                {
                  key: 'account',
                  header: 'Account Name',
                  minWidth: 185,
                  sortable: true,
                  render: (c) => (
                    <span className="text-[#1E293B] truncate block">
                      {accountName(c.accountId)}
                    </span>
                  ),
                },
                {
                  key: 'department',
                  header: 'Department / Role',
                  minWidth: 175,
                  sortable: true,
                  render: (c) => (
                    <span className="text-[#334155] truncate block">
                      {c.department
                        ? `${c.department}${c.designation ? ` · ${c.designation}` : ''}`
                        : c.designation || '—'}
                    </span>
                  ),
                },
                {
                  key: 'leadSource',
                  header: 'Lead Source',
                  minWidth: 145,
                  sortable: true,
                  render: (c) =>
                    c.leadSource ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0] text-[11.5px] font-medium">
                        {c.leadSource}
                      </span>
                    ) : (
                      <span className="text-[#94A3B8]">—</span>
                    ),
                },
                {
                  key: 'email',
                  header: 'Email',
                  minWidth: 210,
                  sortable: true,
                  render: (c) =>
                    c.email ? (
                      <a
                        href={`mailto:${c.email}`}
                        className="text-[#334155] hover:text-[#1262E0] hover:underline truncate block"
                      >
                        {c.email}
                      </a>
                    ) : (
                      <span className="text-[#94A3B8]">—</span>
                    ),
                },
                {
                  key: 'phone',
                  header: 'Phone',
                  minWidth: 150,
                  sortable: true,
                  render: (c) => (
                    <span className="text-[#334155] font-mono text-[12px]">
                      {c.phone || c.mobile || '—'}
                    </span>
                  ),
                },
                {
                  key: 'mailingCity',
                  header: 'City',
                  minWidth: 130,
                  sortable: true,
                  render: (c) => (
                    <span className="text-[#334155]">
                      {c.mailingCity || c.city || '—'}
                    </span>
                  ),
                },
                {
                  key: 'owner',
                  header: 'Contact Owner',
                  minWidth: 165,
                  sortable: true,
                  render: (c) => (
                    <div className="inline-flex items-center gap-1.5">
                      <UserAvatar userId={c.ownerId} size={20} />
                      <span className="text-[#334155] text-[12px]">{userName(c.ownerId)}</span>
                    </div>
                  ),
                },
                {
                  key: 'lastContacted',
                  header: 'Last Contacted',
                  minWidth: 130,
                  sortable: true,
                  render: (c) => (
                    <span className="text-[#475569] text-[12px]">
                      {c.lastContacted ? fmtDate(c.lastContacted) : '—'}
                    </span>
                  ),
                },
              ]}
            />
          )}

          {layout === 'split' && (
            <SplitView
              moduleType="contacts"
              rows={table.sorted}
              table={table}
              savedSplitViews={savedContactSplitViews}
              onSaveSplitView={saveContactSplitView}
              onDeleteSplitView={deleteContactSplitView}
              users={users}
              activeUser={activeUser}
              onOpenDetail={(id) => openContactDetail(id)}
              fieldCatalog={[
                {
                  key: 'leadSource',
                  label: 'Lead Source',
                  type: 'picklist',
                  options: LEAD_SOURCES,
                  getValue: (c) => c.leadSource || '',
                },
                {
                  key: 'lifecycle',
                  label: 'Lifecycle Stage',
                  type: 'picklist',
                  options: LIFECYCLES,
                  getValue: (c) => c.lifecycle || '',
                },
                {
                  key: 'owner',
                  label: 'Contact Owner',
                  type: 'user',
                  options: users.map((u) => u.name),
                  getValue: (c) => userName(c.ownerId),
                },
                {
                  key: 'department',
                  label: 'Department',
                  type: 'picklist',
                  options: ['Sales', 'IT', 'Finance', 'Marketing', 'Operations', 'Executive', 'Procurement', 'Engineering'],
                  getValue: (c) => c.department || '',
                },
                {
                  key: 'mailingCity',
                  label: 'Mailing City',
                  type: 'picklist',
                  options: ['Chennai', 'Bengaluru', 'Mumbai', 'Hyderabad', 'New Delhi', 'Pune', 'Coimbatore'],
                  getValue: (c) => c.mailingCity || c.city || '',
                },
                {
                  key: 'vendorName',
                  label: 'Vendor Name',
                  type: 'picklist',
                  options: VENDORS,
                  getValue: (c) => c.vendorName || '',
                },
                {
                  key: 'firstName',
                  label: 'First Name',
                  type: 'text',
                  options: [],
                  getValue: (c) => c.firstName || (c.name || '').split(' ')[0] || '',
                },
                {
                  key: 'lastName',
                  label: 'Last Name',
                  type: 'text',
                  options: [],
                  getValue: (c) => c.lastName || (c.name || '').split(' ').slice(1).join(' ') || '',
                },
                {
                  key: 'email',
                  label: 'Email',
                  type: 'text',
                  options: [],
                  getValue: (c) => c.email || '',
                },
                {
                  key: 'phone',
                  label: 'Phone',
                  type: 'text',
                  options: [],
                  getValue: (c) => c.phone || c.mobile || '',
                },
              ]}
              columnCatalog={[
                {
                  key: 'firstName',
                  label: 'First Name',
                  minWidth: 155,
                  render: (c) => (
                    <button
                      type="button"
                      onClick={() => openContactDetail(c.id)}
                      data-testid={`split-contact-firstname-${c.id}`}
                      className="font-medium text-[#1E293B] hover:text-[#1262E0] hover:underline text-left truncate block max-w-full cursor-pointer"
                    >
                      {c.firstName || (c.name || '').split(' ')[0] || c.name}
                    </button>
                  ),
                },
                {
                  key: 'lastName',
                  label: 'Last Name',
                  minWidth: 155,
                  render: (c) => (
                    <button
                      type="button"
                      onClick={() => openContactDetail(c.id)}
                      className="text-[#1E293B] hover:text-[#1262E0] hover:underline text-left truncate block max-w-full cursor-pointer"
                    >
                      {c.lastName || (c.name || '').split(' ').slice(1).join(' ') || '—'}
                    </button>
                  ),
                },
                {
                  key: 'name',
                  label: 'Contact Name',
                  minWidth: 185,
                  render: (c) => (
                    <button
                      type="button"
                      onClick={() => openContactDetail(c.id)}
                      data-testid={`split-contact-name-${c.id}`}
                      className="font-medium text-[#1E293B] hover:text-[#1262E0] hover:underline text-left truncate block max-w-full cursor-pointer"
                    >
                      {c.name}
                    </button>
                  ),
                },
                {
                  key: 'account',
                  label: 'Account Name',
                  minWidth: 185,
                  render: (c) => <span className="text-[#1E293B] truncate block">{accountName(c.accountId)}</span>,
                },
                {
                  key: 'leadSource',
                  label: 'Lead Source',
                  minWidth: 145,
                  render: (c) => <span className="text-[#334155]">{c.leadSource || '—'}</span>,
                },
                {
                  key: 'lifecycle',
                  label: 'Lifecycle Stage',
                  minWidth: 145,
                  render: (c) => <GridStatusPill value={c.lifecycle || 'New'} />,
                },
                {
                  key: 'department',
                  label: 'Department',
                  minWidth: 155,
                  render: (c) => <span className="text-[#334155]">{c.department || c.designation || '—'}</span>,
                },
                {
                  key: 'phone',
                  label: 'Phone',
                  minWidth: 145,
                  render: (c) => <span className="text-[#334155] font-mono text-[12px]">{c.phone || c.mobile || '—'}</span>,
                },
                {
                  key: 'email',
                  label: 'Email',
                  minWidth: 195,
                  render: (c) =>
                    c.email ? (
                      <a href={`mailto:${c.email}`} className="text-[#334155] hover:text-[#1262E0] hover:underline truncate block">
                        {c.email}
                      </a>
                    ) : (
                      <span className="text-[#94A3B8]">—</span>
                    ),
                },
                {
                  key: 'mailingCity',
                  label: 'Mailing City',
                  minWidth: 135,
                  render: (c) => <span className="text-[#334155]">{c.mailingCity || c.city || '—'}</span>,
                },
                {
                  key: 'owner',
                  label: 'Contact Owner',
                  minWidth: 165,
                  render: (c) => (
                    <div className="inline-flex items-center gap-1.5">
                      <UserAvatar userId={c.ownerId} size={20} />
                      <span className="text-[#334155] text-[12px]">{userName(c.ownerId)}</span>
                    </div>
                  ),
                },
                {
                  key: 'lastContacted',
                  label: 'Last Contacted',
                  minWidth: 135,
                  render: (c) => <span className="text-[#475569] text-[12px]">{c.lastContacted ? fmtDate(c.lastContacted) : '—'}</span>,
                },
              ]}
            />
          )}

          {layout === 'chart' && (
            <ChartView
              title="Contacts by lifecycle stage"
              data={LIFECYCLES.map((l) => ({
                name: l,
                value: filtered.filter((c) => c.lifecycle === l).length,
                color: LIFECYCLE_COLORS[l],
              }))}
              valueLabel="Contacts"
            />
          )}

          {layout === 'timeline' && (
            <ModuleTimelineView
              moduleType="contacts"
              rows={table.sorted}
              totalCount={filtered.length}
              users={users}
              userName={userName}
              accountName={accountName}
              deals={deals}
              calls={calls}
              tasks={tasks}
              sort={table.sort}
              onSortChange={table.setSort}
              onOpenDetail={(id) => openContactDetail(id)}
              emptyResetAction={activeFilterCount > 0 ? clearAllFilters : undefined}
            />
          )}
        </section>
      </div>

      {/* ==================== CREATE / EDIT CONTACT MODAL ==================== */}
      <Modal
        open={Boolean(contactModal)}
        onClose={() => setContactModal(null)}
        title={contactModal?.mode === 'edit' ? `Edit Contact — ${contactModal.record.name}` : 'Create Contact'}
        subtitle="Complete contact profile with account relation, structured addresses, and communication preferences."
        size="lg"
      >
        {contactModal && (
          <form onSubmit={handleSaveContact} className="space-y-5 max-h-[74vh] overflow-y-auto pr-1">
            {/* 1. Basic & Account Information */}
            <div>
              <h3 className="text-[13px] font-semibold text-ink uppercase tracking-wider mb-2.5 border-b border-line-soft pb-1">
                Contact Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-ink-600 mb-1">Salutation</label>
                  <select
                    value={contactModal.record.salutation}
                    onChange={(e) =>
                      setContactModal((p) => ({ ...p, record: { ...p.record, salutation: e.target.value } }))
                    }
                    className="input h-9 text-[13px]"
                  >
                    {SALUTATIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-ink-600 mb-1">
                    First Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={contactModal.record.firstName}
                    onChange={(e) =>
                      setContactModal((p) => ({ ...p, record: { ...p.record, firstName: e.target.value } }))
                    }
                    placeholder="e.g. Priya"
                    className="input h-9 text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-ink-600 mb-1">
                    Last Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={contactModal.record.lastName}
                    onChange={(e) =>
                      setContactModal((p) => ({ ...p, record: { ...p.record, lastName: e.target.value } }))
                    }
                    placeholder="e.g. Sharma"
                    className="input h-9 text-[13px]"
                  />
                  {contactModal.errors?.lastName && (
                    <p className="text-[11.5px] text-danger mt-0.5">{contactModal.errors.lastName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-ink-600 mb-1">
                    Account Name <span className="text-danger">*</span>
                  </label>
                  <select
                    required
                    value={contactModal.record.accountId}
                    onChange={(e) =>
                      setContactModal((p) => ({ ...p, record: { ...p.record, accountId: e.target.value } }))
                    }
                    className="input h-9 text-[13px]"
                  >
                    <option value="">Select Account</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                  {contactModal.errors?.accountId && (
                    <p className="text-[11.5px] text-danger mt-0.5">{contactModal.errors.accountId}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-ink-600 mb-1">Title</label>
                  <input
                    type="text"
                    value={contactModal.record.designation}
                    onChange={(e) =>
                      setContactModal((p) => ({ ...p, record: { ...p.record, designation: e.target.value } }))
                    }
                    placeholder="e.g. VP of Procurement"
                    className="input h-9 text-[13px]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-ink-600 mb-1">Department</label>
                  <input
                    type="text"
                    value={contactModal.record.department}
                    onChange={(e) =>
                      setContactModal((p) => ({ ...p, record: { ...p.record, department: e.target.value } }))
                    }
                    placeholder="e.g. Procurement"
                    className="input h-9 text-[13px]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-ink-600 mb-1">
                    Email <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={contactModal.record.email}
                    onChange={(e) =>
                      setContactModal((p) => ({
                        ...p,
                        record: { ...p.record, email: e.target.value },
                        errors: { ...p.errors, email: '' },
                      }))
                    }
                    placeholder="name@company.in"
                    className="input h-9 text-[13px]"
                  />
                  {contactModal.errors?.email && (
                    <p className="text-[11.5px] text-danger mt-0.5">{contactModal.errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-ink-600 mb-1">Secondary Email</label>
                  <input
                    type="email"
                    value={contactModal.record.secondaryEmail}
                    onChange={(e) =>
                      setContactModal((p) => ({ ...p, record: { ...p.record, secondaryEmail: e.target.value } }))
                    }
                    placeholder="alt@company.in"
                    className="input h-9 text-[13px]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-ink-600 mb-1">
                    Phone <span className="text-danger">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={contactModal.record.phone}
                    onChange={(e) =>
                      setContactModal((p) => ({
                        ...p,
                        record: { ...p.record, phone: e.target.value },
                        errors: { ...p.errors, phone: '' },
                      }))
                    }
                    placeholder="+91 98765 43210"
                    className="input h-9 text-[13px]"
                  />
                  {contactModal.errors?.phone && (
                    <p className="text-[11.5px] text-danger mt-0.5">{contactModal.errors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-ink-600 mb-1">Mobile</label>
                  <input
                    type="tel"
                    value={contactModal.record.mobile}
                    onChange={(e) =>
                      setContactModal((p) => ({ ...p, record: { ...p.record, mobile: e.target.value } }))
                    }
                    placeholder="+91 98400 11223"
                    className="input h-9 text-[13px]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-ink-600 mb-1">Contact Owner</label>
                  <select
                    value={contactModal.record.ownerId}
                    onChange={(e) =>
                      setContactModal((p) => ({ ...p, record: { ...p.record, ownerId: e.target.value } }))
                    }
                    className="input h-9 text-[13px]"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-ink-600 mb-1">Lead Source</label>
                  <select
                    value={contactModal.record.leadSource}
                    onChange={(e) =>
                      setContactModal((p) => ({ ...p, record: { ...p.record, leadSource: e.target.value } }))
                    }
                    className="input h-9 text-[13px]"
                  >
                    {LEAD_SOURCES.map((ls) => (
                      <option key={ls} value={ls}>
                        {ls}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-ink-600 mb-1">Lifecycle Stage</label>
                  <select
                    value={contactModal.record.lifecycle}
                    onChange={(e) =>
                      setContactModal((p) => ({ ...p, record: { ...p.record, lifecycle: e.target.value } }))
                    }
                    className="input h-9 text-[13px]"
                  >
                    {LIFECYCLES.map((lc) => (
                      <option key={lc} value={lc}>
                        {lc}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-ink-600 mb-1">Reporting To</label>
                  <select
                    value={contactModal.record.reportingToId || ''}
                    onChange={(e) =>
                      setContactModal((p) => ({ ...p, record: { ...p.record, reportingToId: e.target.value } }))
                    }
                    className="input h-9 text-[13px]"
                  >
                    <option value="">None</option>
                    {contacts.slice(0, 30).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-ink-600 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={contactModal.record.dateOfBirth || ''}
                    onChange={(e) =>
                      setContactModal((p) => ({ ...p, record: { ...p.record, dateOfBirth: e.target.value } }))
                    }
                    className="input h-9 text-[13px]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-ink-600 mb-1">Vendor Name</label>
                  <select
                    value={contactModal.record.vendorName || ''}
                    onChange={(e) =>
                      setContactModal((p) => ({ ...p, record: { ...p.record, vendorName: e.target.value } }))
                    }
                    className="input h-9 text-[13px]"
                  >
                    <option value="">None</option>
                    {VENDORS.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-ink-600 mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={contactModal.record.tagInput || ''}
                    onChange={(e) =>
                      setContactModal((p) => ({ ...p, record: { ...p.record, tagInput: e.target.value } }))
                    }
                    placeholder="Enterprise, Decision Maker"
                    className="input h-9 text-[13px]"
                  />
                </div>

                <div className="flex items-end pb-1">
                  <label className="inline-flex items-center gap-2 text-[13px] text-ink cursor-pointer">
                    <input
                      type="checkbox"
                      className="cb"
                      checked={Boolean(contactModal.record.emailOptOut)}
                      onChange={(e) =>
                        setContactModal((p) => ({ ...p, record: { ...p.record, emailOptOut: e.target.checked } }))
                      }
                    />
                    <span>Email Opt Out</span>
                  </label>
                </div>
              </div>
            </div>

            {/* 2. Mailing & Other Address */}
            <div>
              <h3 className="text-[13px] font-semibold text-ink uppercase tracking-wider mb-2.5 border-b border-line-soft pb-1">
                Mailing & Other Address
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-ink-600 mb-1">Mailing - Flat / Building</label>
                  <input
                    type="text"
                    value={contactModal.record.mailingFlat || ''}
                    onChange={(e) =>
                      setContactModal((p) => ({ ...p, record: { ...p.record, mailingFlat: e.target.value } }))
                    }
                    className="input h-9 text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-ink-600 mb-1">Mailing - Street Address</label>
                  <input
                    type="text"
                    value={contactModal.record.mailingStreet || ''}
                    onChange={(e) =>
                      setContactModal((p) => ({ ...p, record: { ...p.record, mailingStreet: e.target.value } }))
                    }
                    className="input h-9 text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-ink-600 mb-1">Mailing - City</label>
                  <input
                    type="text"
                    value={contactModal.record.mailingCity || ''}
                    onChange={(e) =>
                      setContactModal((p) => ({ ...p, record: { ...p.record, mailingCity: e.target.value } }))
                    }
                    className="input h-9 text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-ink-600 mb-1">Mailing - State / Province</label>
                  <input
                    type="text"
                    value={contactModal.record.mailingState || ''}
                    onChange={(e) =>
                      setContactModal((p) => ({ ...p, record: { ...p.record, mailingState: e.target.value } }))
                    }
                    className="input h-9 text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-ink-600 mb-1">Mailing - Zip / Postal Code</label>
                  <input
                    type="text"
                    value={contactModal.record.mailingZip || ''}
                    onChange={(e) =>
                      setContactModal((p) => ({ ...p, record: { ...p.record, mailingZip: e.target.value } }))
                    }
                    className="input h-9 text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-ink-600 mb-1">Mailing - Country / Region</label>
                  <input
                    type="text"
                    value={contactModal.record.mailingCountry || ''}
                    onChange={(e) =>
                      setContactModal((p) => ({ ...p, record: { ...p.record, mailingCountry: e.target.value } }))
                    }
                    className="input h-9 text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-ink-600 mb-1">Other - City</label>
                  <input
                    type="text"
                    value={contactModal.record.otherCity || ''}
                    onChange={(e) =>
                      setContactModal((p) => ({ ...p, record: { ...p.record, otherCity: e.target.value } }))
                    }
                    className="input h-9 text-[13px]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[12px] font-medium text-ink-600 mb-1">Description</label>
                  <input
                    type="text"
                    value={contactModal.record.description || ''}
                    onChange={(e) =>
                      setContactModal((p) => ({ ...p, record: { ...p.record, description: e.target.value } }))
                    }
                    placeholder="Key stakeholder notes..."
                    className="input h-9 text-[13px]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-line">
              <button type="button" onClick={() => setContactModal(null)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {contactModal.mode === 'edit' ? 'Save Changes' : 'Create Contact'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ==================== ADVANCED FILTER BUILDER MODAL ==================== */}
      <Modal
        open={builderOpen}
        onClose={() => setBuilderOpen(false)}
        title="Advanced Filter Builder"
        subtitle="Construct multi-condition queries across System Filters, 47 Contact Fields, and 17 Related Modules."
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#F8FAFD] p-3 rounded-lg border border-line">
            <span className="text-[13px] font-medium text-ink">Combine conditions using:</span>
            <div className="inline-flex rounded-lg border border-line overflow-hidden">
              <button
                type="button"
                onClick={() => setGlobalJoin('AND')}
                className={`px-3 py-1 text-[12.5px] font-semibold ${
                  globalJoin === 'AND' ? 'bg-primary text-white' : 'bg-white text-ink-600'
                }`}
              >
                AND (All must match)
              </button>
              <button
                type="button"
                onClick={() => setGlobalJoin('OR')}
                className={`px-3 py-1 text-[12.5px] font-semibold ${
                  globalJoin === 'OR' ? 'bg-primary text-white' : 'bg-white text-ink-600'
                }`}
              >
                OR (Any can match)
              </button>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[48vh] overflow-y-auto pr-1">
            {builderRules.length === 0 && (
              <p className="text-center py-6 text-[13px] text-ink-500">
                No extra builder rules added yet. Click &ldquo;Add Rule&rdquo; below to add a criterion.
              </p>
            )}
            {builderRules.map((rule, idx) => (
              <div key={rule.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center p-2.5 rounded-lg border border-line bg-white">
                <div className="sm:col-span-3">
                  <select
                    value={rule.category}
                    onChange={(e) => {
                      const cat = e.target.value;
                      setBuilderRules((prev) =>
                        prev.map((r, i) =>
                          i === idx
                            ? {
                                ...r,
                                category: cat,
                                field: cat === 'system' ? 'Activities' : 'mailingCity',
                                module: 'deals',
                                operator: 'Is',
                                mode: 'has_any',
                                value: '',
                              }
                            : r
                        )
                      );
                    }}
                    className="input h-8 text-[12px]"
                  >
                    <option value="field">Field Filter</option>
                    <option value="related">Related Module</option>
                    <option value="system">System Filter</option>
                  </select>
                </div>

                <div className="sm:col-span-4">
                  {rule.category === 'field' && (
                    <select
                      value={rule.field}
                      onChange={(e) => {
                        const fm = CONTACT_FIELD_FILTERS.find((x) => x.key === e.target.value);
                        setBuilderRules((prev) =>
                          prev.map((r, i) =>
                            i === idx
                              ? { ...r, field: e.target.value, type: fm?.type || 'text', operator: fm?.type === 'boolean' ? 'Yes' : 'Is', value: '' }
                              : r
                          )
                        );
                      }}
                      className="input h-8 text-[12px]"
                    >
                      {CONTACT_FIELD_FILTERS.map((f) => (
                        <option key={f.key} value={f.key}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  )}
                  {rule.category === 'related' && (
                    <select
                      value={rule.module}
                      onChange={(e) =>
                        setBuilderRules((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, module: e.target.value, mode: 'has_any' } : r))
                        )
                      }
                      className="input h-8 text-[12px]"
                    >
                      {RELATED_MODULE_FILTERS.map((m) => (
                        <option key={m.key} value={m.key}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  )}
                  {rule.category === 'system' && (
                    <select
                      value={rule.field}
                      onChange={(e) =>
                        setBuilderRules((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, field: e.target.value } : r))
                        )
                      }
                      className="input h-8 text-[12px]"
                    >
                      {SYSTEM_DEFINED_FILTERS.map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="sm:col-span-4">
                  {rule.category === 'field' && (
                    <div className="flex gap-1.5">
                      <select
                        value={rule.operator}
                        onChange={(e) =>
                          setBuilderRules((prev) =>
                            prev.map((r, i) => (i === idx ? { ...r, operator: e.target.value } : r))
                          )
                        }
                        className="input h-8 text-[12px] w-1/2"
                      >
                        {(OPERATORS_BY_TYPE[rule.type || 'text'] || OPERATORS_BY_TYPE.text).map((op) => (
                          <option key={op} value={op}>
                            {op}
                          </option>
                        ))}
                      </select>
                      {!['Is empty', 'Is not empty', 'Yes', 'No', 'Today', 'Yesterday', 'This Week', 'This Month', 'Last 30 Days'].includes(rule.operator) && (
                        <input
                          type={rule.type === 'date' ? 'date' : 'text'}
                          value={rule.value || ''}
                          onChange={(e) =>
                            setBuilderRules((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, value: e.target.value } : r))
                            )
                          }
                          placeholder="Value..."
                          className="input h-8 text-[12px] w-1/2"
                        />
                      )}
                    </div>
                  )}
                  {rule.category === 'related' && (
                    <select
                      value={rule.mode || 'has_any'}
                      onChange={(e) =>
                        setBuilderRules((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, mode: e.target.value } : r))
                        )
                      }
                      className="input h-8 text-[12px]"
                    >
                      {(RELATED_MODULE_FILTERS.find((m) => m.key === rule.module)?.presets || RELATED_CONDITION_MODES).map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  )}
                  {rule.category === 'system' && (
                    <span className="text-[12px] text-ink-500 pl-2">System Criterion Active</span>
                  )}
                </div>

                <div className="sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setBuilderRules((prev) => prev.filter((_, i) => i !== idx))}
                    aria-label="Remove builder rule"
                    className="p-1.5 rounded text-ink-400 hover:text-danger"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-line">
            <button
              type="button"
              onClick={() =>
                setBuilderRules((prev) => [
                  ...prev,
                  {
                    id: `br-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 4)}`,
                    category: 'field',
                    field: 'mailingCity',
                    type: 'text',
                    operator: 'Is',
                    value: 'Chennai',
                    enabled: true,
                  },
                ])
              }
              className="btn-secondary h-9"
            >
              <Plus size={15} /> Add Rule
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setBuilderRules([])}
                className="btn-secondary h-9"
              >
                Clear Builder
              </button>
              <button
                type="button"
                onClick={() => setBuilderOpen(false)}
                className="btn-primary h-9"
              >
                Apply ({filtered.length} matching)
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* ==================== SAVE / RENAME CUSTOM VIEW MODAL ==================== */}
      <Modal
        open={Boolean(saveViewModal)}
        onClose={() => setSaveViewModal(null)}
        title={saveViewModal?.mode === 'rename' ? 'Rename Saved Filter View' : 'Save Custom Filter View'}
        size="sm"
      >
        {saveViewModal && (
          <form onSubmit={handleSaveCustomView} className="space-y-4">
            <div>
              <label className="block text-[12.5px] font-medium text-ink mb-1">View Name</label>
              <input
                type="text"
                required
                autoFocus
                value={saveViewModal.name}
                onChange={(e) => setSaveViewModal((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Q4 Chennai Decision Makers"
                className="input h-9 text-[13px]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setSaveViewModal(null)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Save View
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ==================== COMPOSE EMAIL MODAL ==================== */}
      <Modal
        open={Boolean(composeEmail)}
        onClose={() => setComposeEmail(null)}
        title={composeEmail ? `Send Email to ${composeEmail.contact.name} (${composeEmail.contact.email})` : 'Send Email'}
        size="md"
      >
        {composeEmail && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addContactRelatedRecord('emails', {
                contactId: composeEmail.contact.id,
                subject: composeEmail.subject,
                direction: 'Sent',
                status: 'Delivered',
                ownerId: activeUser.id,
              });
              updateRecord('contacts', composeEmail.contact.id, {
                lastContacted: todayISO(),
                lastActivityTime: todayISO(),
              });
              toast.success(`Email sent to ${composeEmail.contact.email}`);
              setComposeEmail(null);
            }}
            className="space-y-3"
          >
            <div>
              <label className="block text-[12px] font-medium text-ink-600 mb-1">To</label>
              <input type="text" disabled value={composeEmail.contact.email} className="input h-8 text-[12.5px] bg-page" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-ink-600 mb-1">Subject</label>
              <input
                type="text"
                required
                value={composeEmail.subject}
                onChange={(e) => setComposeEmail((p) => ({ ...p, subject: e.target.value }))}
                className="input h-8 text-[12.5px]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-ink-600 mb-1">Message</label>
              <textarea
                rows={4}
                required
                value={composeEmail.body}
                onChange={(e) => setComposeEmail((p) => ({ ...p, body: e.target.value }))}
                className="input py-2 text-[12.5px]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setComposeEmail(null)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                <Send size={14} /> Send Email
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ==================== SEND WHATSAPP MODAL ==================== */}
      <WhatsAppComposerModal
        open={Boolean(whatsappContact)}
        onClose={() => setWhatsappContact(null)}
        recordType="Contact"
        recordName={whatsappContact?.name || ''}
        recordSubtitle={
          whatsappContact && accountName(whatsappContact.accountId) !== '—'
            ? `${whatsappContact.designation ? `${whatsappContact.designation} · ` : ''}${accountName(whatsappContact.accountId)}`
            : whatsappContact?.designation || ''
        }
        mobile={whatsappContact?.mobile}
        phone={whatsappContact?.phone}
        otherPhone={whatsappContact?.otherPhone}
        homePhone={whatsappContact?.homePhone}
        ownerName={whatsappContact ? userName(whatsappContact.ownerId) : activeUser.name}
        defaultMessage={
          whatsappContact
            ? `Hi ${whatsappContact.firstName || whatsappContact.name},\n\nHope you are doing well. Following up on our recent conversation${
                accountName(whatsappContact.accountId) && accountName(whatsappContact.accountId) !== '—'
                  ? ` with ${accountName(whatsappContact.accountId)}`
                  : ''
              }.\n\nBest regards,\n${userName(whatsappContact.ownerId) || activeUser.name}`
            : ''
        }
        onSavePhone={(updates) => {
          if (!whatsappContact) return;
          updateRecord('contacts', whatsappContact.id, {
            ...updates,
            modifiedTime: todayISO(),
          });
          setWhatsappContact((prev) => (prev ? { ...prev, ...updates } : prev));
          toast.success(`Updated WhatsApp number on ${whatsappContact.name}`);
        }}
        onOpenedWhatsApp={({ number, mode }) => {
          toast.info(
            `Opened ${mode === 'web' ? 'WhatsApp Web' : 'WhatsApp'} for ${number}. Please confirm and press Send in WhatsApp.`
          );
        }}
      />

      {/* ==================== BULK EDIT MODAL ==================== */}
      <Modal
        open={Boolean(bulkMode)}
        onClose={() => setBulkMode(null)}
        title={bulkMode === 'owner' ? 'Change Contact Owner' : 'Update Lifecycle Stage'}
        subtitle={`Applies to ${selectedIds.length} selected contacts.`}
        size="sm"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            selectedIds.forEach((id) =>
              updateRecord('contacts', id, bulkMode === 'owner' ? { ownerId: bulkValue } : { lifecycle: bulkValue })
            );
            toast.success(`Updated ${selectedIds.length} contacts`);
            setBulkMode(null);
            table.clearSelection();
          }}
          className="space-y-4"
        >
          <select
            value={bulkValue}
            onChange={(e) => setBulkValue(e.target.value)}
            className="input h-9 text-[13px]"
          >
            {bulkMode === 'owner'
              ? users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))
              : LIFECYCLES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
          </select>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setBulkMode(null)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Apply
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title="Delete contacts?"
        message={
          confirm
            ? `Delete ${confirm.label}? Linked deals and calls stay, but they will no longer reference ${
                confirm.ids.length > 1 ? 'these contacts' : 'this contact'
              }.`
            : ''
        }
        onConfirm={() => {
          deleteRecords('contacts', confirm.ids);
          table.clearSelection();
          setViewingId(null);
        }}
      />

      {/* ==================== COMPREHENSIVE CONTACT DETAILS DRAWER ==================== */}
      <Drawer
        open={Boolean(viewingRec)}
        onClose={() => setViewingId(null)}
        width={680}
        title={
          viewingRec && (
            <div className="flex items-center gap-3">
              <PersonAvatar name={viewingRec.name} size={46} />
              <div className="min-w-0">
                <h2 className="text-[17px] font-semibold text-ink truncate">
                  {viewingRec.salutation} {viewingRec.name}
                </h2>
                <p className="text-[13px] text-ink-500">
                  {viewingRec.designation} ·{' '}
                  <Link to={`/accounts?open=${viewingRec.accountId}`} className="link">
                    {accountName(viewingRec.accountId)}
                  </Link>
                </p>
              </div>
            </div>
          )
        }
        footer={
          viewingRec && (
            <>
              <button
                type="button"
                className="btn-secondary text-danger-700"
                onClick={() => handleDeleteRequest([viewingRec.id], viewingRec.name)}
              >
                <Trash2 size={15} /> Delete
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() =>
                  setComposeEmail({
                    contact: viewingRec,
                    subject: `Follow-up: ${accountName(viewingRec.accountId)}`,
                    body: `Hi ${viewingRec.firstName || viewingRec.name},\n\nFollowing up with you.\n\nBest regards,\n${activeUser.name}`,
                  })
                }
              >
                <Mail size={15} /> Send Email
              </button>
              <button
                type="button"
                className="btn-secondary text-[#15803D] border-[#16A34A]/30 bg-[#F0FDF4] hover:bg-[#DCFCE7]"
                onClick={() => setWhatsappContact(viewingRec)}
              >
                <WhatsAppIcon size={15} className="text-[#16A34A]" /> Send WhatsApp
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate(`/calls?create=1&contact=${viewingRec.id}`)}
              >
                <Phone size={15} /> Log a Call
              </button>
              <button type="button" className="btn-primary" onClick={() => openEditModal(viewingRec)}>
                <Pencil size={15} /> Edit
              </button>
            </>
          )
        }
      >
        {viewingRec && (() => {
          const relDeals = getRelatedRecordsForContact(viewingRec, 'deals', filterContext);
          const relTasks = getRelatedRecordsForContact(viewingRec, 'tasks', filterContext);
          const relMeetings = getRelatedRecordsForContact(viewingRec, 'meetings', filterContext);
          const relEmails = getRelatedRecordsForContact(viewingRec, 'emails', filterContext);
          const relQuotes = getRelatedRecordsForContact(viewingRec, 'quotes', filterContext);
          const relInvoices = getRelatedRecordsForContact(viewingRec, 'invoices', filterContext);
          const relNotes = getRelatedRecordsForContact(viewingRec, 'notes', filterContext);
          const relCalls = getRelatedRecordsForContact(viewingRec, 'calls', filterContext);

          return (
            <div className="space-y-5">
              {/* Status & Tags Bar */}
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge kind="lifecycle" value={viewingRec.lifecycle} />
                <StatusBadge kind="leadSource" value={viewingRec.leadSource} />
                {viewingRec.locked && <StatusBadge kind="x" value="Locked" />}
                {viewingRec.followUp && <FollowUpTag date={viewingRec.followUp} />}
                {(viewingRec.tags || []).map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11.5px] bg-[#EFF6FF] text-[#1262E0] border border-[#BFDBFE]"
                  >
                    <Tag size={11} /> {t}
                  </span>
                ))}
              </div>

              {/* Detail Sub-tabs */}
              <div className="flex gap-4 border-b border-line text-[13px] font-medium overflow-x-auto">
                {[
                  { id: 'overview', label: 'Overview & Addresses' },
                  { id: 'related', label: `Related Records (${relDeals.length + relTasks.length + relMeetings.length + relQuotes.length + relInvoices.length})` },
                  { id: 'emails', label: `Emails & Notes (${relEmails.length + relNotes.length})` },
                  { id: 'timeline', label: 'Activity Timeline' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setDetailTab(t.id)}
                    className={`pb-2 border-b-2 whitespace-nowrap ${
                      detailTab === t.id ? 'border-primary text-primary font-semibold' : 'border-transparent text-ink-500 hover:text-ink'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {detailTab === 'overview' && (
                <>
                  <SectionTitle>Contact Overview & Personal Information</SectionTitle>
                  <DetailGrid
                    items={[
                      ['Full Name', `${viewingRec.salutation || ''} ${viewingRec.name}`.trim()],
                      ['Title', viewingRec.designation || '—'],
                      ['Account Name', <Link className="link" to={`/accounts?open=${viewingRec.accountId}`}>{accountName(viewingRec.accountId)}</Link>],
                      ['Department', viewingRec.department || '—'],
                      ['Contact Owner', <UserAvatar userId={viewingRec.ownerId} size={22} withName />],
                      ['Reporting To', contactsById[viewingRec.reportingToId]?.name || '—'],
                      ['Date of Birth', viewingRec.dateOfBirth || '—'],
                      ['Vendor Name', viewingRec.vendorName || '—'],
                    ]}
                  />

                  <SectionTitle>Communication Details</SectionTitle>
                  <DetailGrid
                    items={[
                      ['Primary Email', <a className="link" href={`mailto:${viewingRec.email}`}>{viewingRec.email}</a>],
                      ['Secondary Email', viewingRec.secondaryEmail || '—'],
                      ['Phone', <a className="link" href={`tel:${viewingRec.phone}`}>{viewingRec.phone}</a>],
                      ['Mobile', viewingRec.mobile || '—'],
                      ['Home Phone', viewingRec.homePhone || '—'],
                      ['Other Phone', viewingRec.otherPhone || '—'],
                      ['Assistant', viewingRec.assistant ? `${viewingRec.assistant} (${viewingRec.asstPhone || ''})` : '—'],
                      ['Fax', viewingRec.fax || '—'],
                      ['Skype ID', viewingRec.skypeId || '—'],
                      ['Twitter', viewingRec.twitter || '—'],
                      ['Latest Email Status', viewingRec.emailStatus || '—'],
                      ['Email Opt Out', viewingRec.emailOptOut ? `Yes (${viewingRec.unsubscribedMode || 'Opt-Out'})` : 'No'],
                    ]}
                  />

                  <SectionTitle>Address Information</SectionTitle>
                  <DetailGrid
                    items={[
                      ['Mailing Address', viewingRec.mailingAddress || '—'],
                      ['Mailing City / State', `${viewingRec.mailingCity || '—'}, ${viewingRec.mailingState || '—'} ${viewingRec.mailingZip || ''}`],
                      ['Other Address', viewingRec.otherAddress || '—'],
                      ['Other City / State', `${viewingRec.otherCity || '—'}, ${viewingRec.otherState || '—'} ${viewingRec.otherZip || ''}`],
                    ]}
                  />
                </>
              )}

              {detailTab === 'related' && (
                <div className="space-y-4">
                  {/* Related Deals */}
                  <div>
                    <SectionTitle extra={<span className="text-[12px] text-ink-500">{relDeals.length}</span>}>
                      Related Deals
                    </SectionTitle>
                    {relDeals.length === 0 ? (
                      <p className="text-[12.5px] text-ink-500">No deals linked to this contact.</p>
                    ) : (
                      <ul className="divide-y divide-line-soft border border-line rounded-lg">
                        {relDeals.map((d) => (
                          <li key={d.id} className="flex items-center justify-between px-3 py-2 text-[13px]">
                            <Link to={`/deals?open=${d.id}`} className="link font-medium truncate">
                              {d.name}
                            </Link>
                            <span className="flex items-center gap-3 shrink-0">
                              <span className="text-ink font-medium">{fmtINR(d.amount)}</span>
                              <StatusBadge kind="stage" value={d.stage} size="sm" />
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Related Tasks */}
                  <div>
                    <SectionTitle extra={<span className="text-[12px] text-ink-500">{relTasks.length}</span>}>
                      Related Tasks
                    </SectionTitle>
                    {relTasks.length === 0 ? (
                      <p className="text-[12.5px] text-ink-500">No tasks linked to this contact.</p>
                    ) : (
                      <ul className="divide-y divide-line-soft border border-line rounded-lg">
                        {relTasks.map((t) => (
                          <li key={t.id} className="flex items-center justify-between px-3 py-2 text-[12.5px]">
                            <span>{t.title}</span>
                            <span className="text-ink-500">
                              Due {t.dueDate} · <strong>{t.status}</strong>
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Related Meetings */}
                  <div>
                    <SectionTitle extra={<span className="text-[12px] text-ink-500">{relMeetings.length}</span>}>
                      Related Meetings
                    </SectionTitle>
                    {relMeetings.length === 0 ? (
                      <p className="text-[12.5px] text-ink-500">No meetings scheduled.</p>
                    ) : (
                      <ul className="divide-y divide-line-soft border border-line rounded-lg">
                        {relMeetings.map((m) => (
                          <li key={m.id} className="flex items-center justify-between px-3 py-2 text-[12.5px]">
                            <span>{m.title}</span>
                            <span className="text-ink-500">
                              {m.meetingDate} · <strong>{m.status}</strong>
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Related Quotes & Invoices */}
                  <div>
                    <SectionTitle extra={<span className="text-[12px] text-ink-500">{relQuotes.length + relInvoices.length}</span>}>
                      Related Quotes & Invoices
                    </SectionTitle>
                    {relQuotes.length === 0 && relInvoices.length === 0 ? (
                      <p className="text-[12.5px] text-ink-500">No quotes or invoices found.</p>
                    ) : (
                      <ul className="divide-y divide-line-soft border border-line rounded-lg">
                        {relQuotes.map((q) => (
                          <li key={q.id} className="flex items-center justify-between px-3 py-2 text-[12.5px]">
                            <span>Quote {q.quoteNumber} — {q.subject}</span>
                            <span>{fmtINR(q.amount)} · <strong>{q.status}</strong></span>
                          </li>
                        ))}
                        {relInvoices.map((inv) => (
                          <li key={inv.id} className="flex items-center justify-between px-3 py-2 text-[12.5px]">
                            <Link to="/zoho-finance" className="link">Invoice {inv.number}</Link>
                            <span>{fmtINR(inv.amount)} · <strong>{inv.status}</strong></span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {detailTab === 'emails' && (
                <div className="space-y-4">
                  <div>
                    <SectionTitle extra={<span className="text-[12px] text-ink-500">{relEmails.length}</span>}>
                      Related Emails
                    </SectionTitle>
                    {relEmails.length === 0 ? (
                      <p className="text-[12.5px] text-ink-500">No email activity recorded.</p>
                    ) : (
                      <ul className="divide-y divide-line-soft border border-line rounded-lg">
                        {relEmails.map((em) => (
                          <li key={em.id} className="flex items-center justify-between px-3 py-2 text-[12.5px]">
                            <span>
                              <strong>[{em.direction}]</strong> {em.subject}
                            </span>
                            <span className="text-ink-500">
                              {em.status} · {em.createdDate}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <SectionTitle extra={<span className="text-[12px] text-ink-500">{relNotes.length}</span>}>
                      Notes & Attachments
                    </SectionTitle>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!noteText.trim()) return;
                        addContactRelatedRecord('notes', {
                          contactId: viewingRec.id,
                          title: 'Contact Note',
                          content: noteText.trim(),
                          status: 'Active',
                          ownerId: activeUser.id,
                        });
                        setNoteText('');
                        toast.success('Note added');
                      }}
                      className="flex gap-2 mb-3"
                    >
                      <input
                        type="text"
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Add a note for this contact..."
                        className="input h-8 text-[12.5px] flex-1"
                      />
                      <button type="submit" className="btn-primary h-8 text-[12px]">
                        Add Note
                      </button>
                    </form>
                    <ul className="space-y-2">
                      {relNotes.map((n) => (
                        <li key={n.id} className="p-2.5 rounded-lg border border-line bg-[#F8FAFD] text-[12.5px]">
                          <div className="font-semibold text-ink">{n.title}</div>
                          <div className="text-ink-600 mt-0.5">{n.content}</div>
                          <div className="text-[11px] text-ink-400 mt-1">{n.createdDate}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {detailTab === 'timeline' && (
                <div>
                  <RecordTimeline recordType="contact" record={viewingRec} compact />
                </div>
              )}
            </div>
          );
        })()}
      </Drawer>

      {/* Territory Map View Modal */}
      {mapModalOpen && (
        <Modal
          title="Contacts Territory Map View"
          onClose={() => setMapModalOpen(false)}
          width={1000}
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-line-soft">
              <div>
                <p className="text-[13px] text-ink-600">
                  Visual geographical distribution of contacts across Indian territories.
                </p>
                <p className="text-[11.5px] text-ink-400">
                  Click on any city chip or map pin to inspect local territory contacts.
                </p>
              </div>
              <div className="text-[12.5px] font-semibold text-ink bg-page-soft px-3 py-1 rounded-full border border-line">
                Total Mapped: <span className="text-primary">{contacts.length}</span> Contacts
              </div>
            </div>

            {/* City territory selector chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto thin-scroll pb-1 text-[12px]">
              {['All', 'Chennai', 'Bangalore', 'Mumbai', 'Hyderabad', 'Delhi', 'Pune', 'Kolkata'].map((city) => {
                const count =
                  city === 'All'
                    ? contacts.length
                    : contacts.filter(
                        (c) =>
                          (c.city || c.mailingCity || '').toLowerCase() === city.toLowerCase()
                      ).length;
                const active = selectedMapCity === city;
                return (
                  <button
                    key={city}
                    type="button"
                    onClick={() => setSelectedMapCity(city)}
                    className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      active
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-white hover:bg-page border border-line text-ink-600'
                    }`}
                  >
                    <span>{city}</span>
                    <span
                      className={`text-[10.5px] px-1.5 py-0.2 rounded-full font-bold ${
                        active ? 'bg-white/20 text-white' : 'bg-page-soft text-ink-500'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Map Canvas + Contact List split */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Left Column: Stylized India Map Canvas (5 cols) */}
              <div className="md:col-span-5 bg-gradient-to-br from-[#0F172A] to-[#1E293B] rounded-xl p-4 text-white relative min-h-[340px] flex flex-col justify-between overflow-hidden shadow-inner">
                <div className="flex items-center justify-between text-[11px] text-slate-300">
                  <span className="font-semibold tracking-wider uppercase text-sky-400">
                    India Territory Grid
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Live Telemetry
                  </span>
                </div>

                {/* Stylized Interactive Map with City Pins */}
                <div className="relative w-full h-[260px] my-auto">
                  <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" viewBox="0 0 300 260">
                    <pattern id="mapgrid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <circle cx="2" cy="2" r="1" fill="#38BDF8" />
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#mapgrid)" />
                    <path
                      d="M 120 20 Q 150 10 180 20 Q 220 50 200 90 Q 230 110 240 140 Q 200 170 170 210 Q 140 245 130 250 Q 120 245 100 200 Q 70 160 80 120 Q 70 80 100 40 Z"
                      fill="none"
                      stroke="#38BDF8"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                    />
                  </svg>

                  {/* City Pins */}
                  {[
                    { city: 'Delhi', top: '24%', left: '42%' },
                    { city: 'Kolkata', top: '44%', left: '68%' },
                    { city: 'Mumbai', top: '56%', left: '32%' },
                    { city: 'Pune', top: '60%', left: '36%' },
                    { city: 'Hyderabad', top: '64%', left: '46%' },
                    { city: 'Bangalore', top: '76%', left: '44%' },
                    { city: 'Chennai', top: '78%', left: '52%' },
                  ].map((pin) => {
                    const count = contacts.filter(
                      (c) =>
                        (c.city || c.mailingCity || '').toLowerCase() === pin.city.toLowerCase()
                    ).length;
                    const isSelected = selectedMapCity === pin.city;
                    return (
                      <button
                        key={pin.city}
                        type="button"
                        onClick={() => setSelectedMapCity(pin.city)}
                        style={{ top: pin.top, left: pin.left }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 group transition-transform ${
                          isSelected ? 'scale-125 z-20' : 'hover:scale-110 z-10'
                        }`}
                        title={`${pin.city}: ${count} contacts`}
                      >
                        <div className="relative flex items-center justify-center">
                          <span
                            className={`absolute h-6 w-6 rounded-full animate-ping opacity-75 ${
                              isSelected ? 'bg-primary-400' : 'bg-emerald-400'
                            }`}
                          />
                          <div
                            className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-md border ${
                              isSelected
                                ? 'bg-primary border-white ring-2 ring-primary-300'
                                : 'bg-emerald-500 border-white'
                            }`}
                          >
                            <MapPin size={10} className="fill-current" />
                          </div>
                        </div>
                        <div
                          className={`mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold whitespace-nowrap transition-colors ${
                            isSelected
                              ? 'bg-primary text-white shadow-xs'
                              : 'bg-slate-900/80 text-slate-200 group-hover:bg-slate-800'
                          }`}
                        >
                          {pin.city} ({count})
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Selected: <strong className="text-white">{selectedMapCity}</strong></span>
                  <button
                    type="button"
                    onClick={() => setSelectedMapCity('All')}
                    className="text-sky-400 hover:underline"
                  >
                    Reset to All
                  </button>
                </div>
              </div>

              {/* Right Column: Filtered Contacts List for this city (7 cols) */}
              <div className="md:col-span-7 flex flex-col h-[340px] border border-line rounded-xl overflow-hidden bg-white">
                <div className="px-3.5 py-2.5 bg-page-soft/60 border-b border-line flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-primary" />
                    <span className="text-[13px] font-semibold text-ink">
                      {selectedMapCity === 'All' ? 'All Territories' : `${selectedMapCity} Territory`}
                    </span>
                  </div>
                  <span className="text-[11.5px] text-ink-500">
                    {
                      contacts.filter((c) =>
                        selectedMapCity === 'All'
                          ? true
                          : (c.city || c.mailingCity || '').toLowerCase() === selectedMapCity.toLowerCase()
                      ).length
                    }{' '}
                    records
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto thin-scroll p-3 space-y-2.5">
                  {contacts
                    .filter((c) =>
                      selectedMapCity === 'All'
                        ? true
                        : (c.city || c.mailingCity || '').toLowerCase() === selectedMapCity.toLowerCase()
                    )
                    .slice(0, 40)
                    .map((c) => (
                      <div
                        key={c.id}
                        className="p-3 rounded-lg border border-line-soft hover:border-primary/50 hover:bg-[#F8FAFD] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setMapModalOpen(false);
                                openContactDetail(c.id);
                              }}
                              className="text-[13.5px] font-semibold text-ink hover:text-primary transition-colors truncate"
                            >
                              {c.name}
                            </button>
                            <span className="text-[11px] px-1.5 py-0.2 rounded bg-primary-50 text-primary border border-primary-200">
                              {c.city || c.mailingCity || 'Chennai'}
                            </span>
                          </div>
                          <div className="text-[12px] text-ink-500 truncate mt-0.5">
                            {c.designation} · {accountName(c.accountId)}
                          </div>
                          <div className="text-[11px] text-ink-400 truncate mt-0.5">
                            {c.mailingStreet || c.mailingAddress || 'Address on file'} · Owner: {userName(c.ownerId)}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {c.phone && (
                            <a
                              href={`tel:${String(c.phone).replace(/\s/g, '')}`}
                              title={`Call ${c.phone}`}
                              className="h-7 w-7 rounded-md border border-line bg-white hover:bg-page text-ink-600 hover:text-primary flex items-center justify-center transition-colors"
                            >
                              <Phone size={13} />
                            </a>
                          )}
                          {c.email && (
                            <button
                              type="button"
                              onClick={() => {
                                setMapModalOpen(false);
                                setComposeEmail({
                                  contact: c,
                                  subject: `Territory Follow-up — ${c.city || 'Chennai'}`,
                                  body: `Hi ${c.firstName || c.name},\n\nFollowing up regarding our regional operations in ${c.city || 'Chennai'}.\n\nBest regards,\n${activeUser.name}`,
                                });
                              }}
                              title={`Email ${c.email}`}
                              className="h-7 w-7 rounded-md border border-line bg-white hover:bg-page text-ink-600 hover:text-primary flex items-center justify-center transition-colors"
                            >
                              <Mail size={13} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setMapModalOpen(false);
                              openContactDetail(c.id);
                            }}
                            className="h-7 px-2 rounded-md border border-line bg-white hover:bg-page text-ink-700 text-[11.5px] font-medium transition-colors"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-line-soft">
              <button
                type="button"
                onClick={() => setMapModalOpen(false)}
                className="btn-primary h-8 px-4 text-[12.5px]"
              >
                Close Map View
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ==================== CSV IMPORT MODAL (CONTACTS) ==================== */}
      <CSVImportModal
        open={csvImportOpen}
        onClose={() => setCsvImportOpen(false)}
        moduleType="contacts"
        activeUser={activeUser}
        onImportComplete={() => table.setPage(1)}
      />
    </div>
  );
}
