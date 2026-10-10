import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertCircle, Archive, Bookmark, BookmarkPlus, Building2, Check, ChevronDown,
  ChevronRight, CircleDollarSign, Copy, Download, ExternalLink, Eye, FileSpreadsheet,
  Filter, FolderKanban, GitBranch, Globe, Layers, Lock, Mail, MapPin, MoreHorizontal,
  Paperclip, Pencil, Phone, Plus, RotateCcw, Search, Send, Shield, SlidersHorizontal,
  Sparkles, Tag, Trash2, Upload, UserCheck, UserCog, UserPlus, X,
} from 'lucide-react';
import CreateAccount from './CreateAccount';
import AccountDetail from './AccountDetail';
import { useCRM } from '../../context/CRMContext';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import useTable from '../../components/common/useTable';
import StatusBadge from '../../components/common/StatusBadge';
import { AccountLogo, UserAvatar } from '../../components/common/Avatar';
import ActionMenu from '../../components/common/ActionMenu';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Modal, { Drawer, DetailGrid, SectionTitle } from '../../components/common/Modal';
import Dropdown, { MenuDivider, MenuItem, MenuLabel } from '../../components/common/Dropdown';
import BulkBar, { BulkButton } from '../../components/common/BulkBar';
import { ChartView, GridView, KanbanView } from '../../components/common/Views';
import { useRefresh } from '../../components/common/hooks';
import { useToast } from '../../components/common/Toast';
import {
  ACCOUNT_OWNERSHIPS,
  ACCOUNT_RATINGS,
  ACCOUNT_STATUSES,
  ACCOUNT_TYPES,
  AVATAR_COLORS,
  INDUSTRIES,
  LEAD_SOURCES,
  LOCATIONS,
} from '../../data/seedData';
import { balanceOf, fmtCompact, fmtDate, fmtINR, isOpen, sumBy, todayISO } from '../../utils/calculations';
import { exportCSV } from '../../utils/exportCSV';
import {
  ACCOUNT_DROPDOWN_OPTIONS,
  ACCOUNT_FIELD_FILTERS,
  ACCOUNT_OPERATORS_BY_TYPE,
  ACCOUNT_RELATED_CONDITION_MODES,
  ACCOUNT_RELATED_MODULE_FILTERS,
  ACCOUNT_SYSTEM_DEFINED_FILTERS,
  canSetParentAccount,
  evaluateAccountFilters,
  getAccountHierarchyTree,
  getRelatedRecordsForAccount,
  getSelectableParentAccounts,
  searchAccountFilterCatalog,
  validateAccountFilterConfig,
} from '../../utils/accountsFilterEngine';

const STATUS_COLORS = { Active: '#12C26B', Inactive: '#FF3344', New: '#2F7BF5' };
const TYPE_COLORS = {
  Customer: '#2F7BF5',
  Prospect: '#8E3CF2',
  Partner: '#FFBB28',
  Vendor: '#14B8A6',
  Competitor: '#F97316',
  Integrator: '#06B6D4',
  Reseller: '#EC4899',
};
const RATING_COLORS = {
  Hot: '#EF4444',
  Warm: '#F59E0B',
  Cold: '#3B82F6',
  Active: '#10B981',
  Acquired: '#8B5CF6',
};

const FILTER_STORAGE_KEY = 'zcrm.v1.accountsFilterState';

function loadPersistedAccountFilterState() {
  try {
    const raw = localStorage.getItem(FILTER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function savePersistedAccountFilterState(state) {
  try {
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function normalizeWebsiteUrl(url = '') {
  const clean = String(url || '').trim();
  if (!clean) return '';
  if (/^https?:\/\//i.test(clean)) return clean;
  return `https://${clean}`;
}

function isValidWebsite(url = '') {
  const clean = String(url || '').trim();
  if (!clean) return true;
  return /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/.*)?$/i.test(clean);
}

function isValidPhone(phone = '') {
  const clean = String(phone || '').trim();
  if (!clean) return true;
  return /^[+\d][\d\s\-()]{6,20}$/.test(clean);
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

export default function Accounts({ isCreatePage = false }) {
  const crm = useCRM();
  const {
    accounts,
    contacts,
    deals,
    invoices,
    calls,
    users,
    activity = [],
    contactRelations = {},
    accountRelations = {},
    savedAccountViews = [],
    accountsById,
    usersById,
    contactsById,
    createRecord,
    updateRecord,
    deleteRecords,
    userName,
    saveAccountView,
    renameAccountView,
    deleteAccountView,
    addAccountRelatedRecord,
    convertLeadToAccount,
  } = crm;

  const navigate = useNavigate();
  const location = useLocation();
  const { accountId: routeAccountId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const { refreshing, refresh } = useRefresh('Accounts');

  const [createViewOpen, setCreateViewOpen] = useState(false);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [selectedMapCity, setSelectedMapCity] = useState('All');

  const persisted = useMemo(() => loadPersistedAccountFilterState(), []);

  // View & Layout State
  const [savedView, setSavedView] = useState(() => searchParams.get('view') || persisted?.savedView || 'all');
  const [layout, setLayout] = useState(() => persisted?.layout || 'list');
  const [kanbanGroupBy, setKanbanGroupBy] = useState('type'); // 'type' | 'rating' | 'status'
  const [chartDimension, setChartDimension] = useState('type'); // 'type' | 'industry' | 'rating' | 'revenue'
  const [dense, setDense] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(true);

  // Separate search states:
  // 1. filterSearch searches ONLY filter labels in the left "Filter Accounts by" sidebar
  // 2. tableSearch searches Account records in the right table
  const [filterSearch, setFilterSearch] = useState('');
  const [tableSearch, setTableSearch] = useState(() => searchParams.get('q') || persisted?.tableSearch || '');

  // Collapsible filter sections
  const [sysOpen, setSysOpen] = useState(true);
  const [fieldsOpen, setFieldsOpen] = useState(true);
  const [relatedOpen, setRelatedOpen] = useState(true);

  // Active Filter State
  const [sysFilters, setSysFilters] = useState(() => new Set(persisted?.sysFilters || []));
  const [sysConfigs, setSysConfigs] = useState(() => persisted?.sysConfigs || {});
  const [fieldConfigs, setFieldConfigs] = useState(() => persisted?.fieldConfigs || {});
  const [relatedConfigs, setRelatedConfigs] = useState(() => persisted?.relatedConfigs || {});
  const [builderRules, setBuilderRules] = useState(() => persisted?.builderRules || []);
  const [conditionGroups, setConditionGroups] = useState(() => persisted?.conditionGroups || []);
  const [globalJoin, setGlobalJoin] = useState(() => persisted?.globalJoin || 'AND');

  // Role & Record-Level Permission state
  const [activeUserId, setActiveUserId] = useState('u1');
  const [enforcePermissions, setEnforcePermissions] = useState(false);

  // Default columns match the Zoho CRM Accounts List screenshot:
  // Select Checkbox | Account Name | GST Number/GSTIN | GST State | Account Owner | Mobile | Tags | Last Activity Time | Actions
  // Optional columns can be toggled via Manage Columns
  const [hiddenCols, setHiddenCols] = useState(
    () =>
      new Set([
        'phone',
        'website',
        'accountNumber',
        'accountSite',
        'type',
        'industry',
        'annualRevenue',
        'rating',
        'ownership',
        'employees',
        'parentAccount',
        'billingCity',
        'createdTime',
      ])
  );

  // Modals & Drawers
  const [accountModal, setAccountModal] = useState(null); // { mode: 'create'|'edit', record }
  const [viewingId, setViewingId] = useState(() => routeAccountId || searchParams.get('open') || searchParams.get('id') || null);
  const [detailTab, setDetailTab] = useState('overview'); // 'overview' | 'hierarchy' | 'related' | 'communications' | 'timeline'
  const [ownerDetailUser, setOwnerDetailUser] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [bulkMode, setBulkMode] = useState(null); // 'owner' | 'type' | 'status' | 'rating'
  const [bulkValue, setBulkValue] = useState('');
  const [builderOpen, setBuilderOpen] = useState(false);
  const [saveViewModal, setSaveViewModal] = useState(null); // { mode: 'create'|'rename', id?, name: '', shared: true }
  const [leadConvertModal, setLeadConvertModal] = useState(false);
  const [composeEmailModal, setComposeEmailModal] = useState(null);
  const [noteInput, setNoteInput] = useState({ title: '', content: '' });
  const [attachmentInput, setAttachmentInput] = useState({ fileName: '', fileSize: '250 KB' });

  const openAccountDetail = (id) => {
    if (!id) return;
    setViewingId(id);
    setDetailTab('overview');
    navigate(`/accounts/${id}`);
  };

  const closeAccountDetail = () => {
    setViewingId(null);
    navigate('/accounts');
  };

  const activeUser = useMemo(
    () => users.find((u) => u.id === activeUserId) || users[0],
    [users, activeUserId]
  );

  // Handle /accounts/:accountId, ?open=<id>, ?id=<id>, and ?create=1 URL deep links
  useEffect(() => {
    const create = searchParams.get('create');
    const open = routeAccountId || searchParams.get('open') || searchParams.get('id');
    if (create) {
      openCreateAccountModal();
      const next = new URLSearchParams(searchParams);
      next.delete('create');
      setSearchParams(next, { replace: true });
    } else if (open) {
      const found = accounts.find((a) => a.id === open);
      if (found) setViewingId(found.id);
    } else if (!routeAccountId && !searchParams.get('open') && !searchParams.get('id')) {
      setViewingId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeAccountId, searchParams, accounts]);

  // Persist filter state across page refresh and view switching
  useEffect(() => {
    savePersistedAccountFilterState({
      savedView,
      layout,
      tableSearch,
      sysFilters: [...sysFilters],
      sysConfigs,
      fieldConfigs,
      relatedConfigs,
      builderRules,
      conditionGroups,
      globalJoin,
    });
  }, [savedView, layout, tableSearch, sysFilters, sysConfigs, fieldConfigs, relatedConfigs, builderRules, conditionGroups, globalJoin]);

  // Auto-expand matching sections when searching in "Filter Accounts by"
  const catalogSearch = useMemo(() => searchAccountFilterCatalog(filterSearch), [filterSearch]);
  useEffect(() => {
    if (filterSearch.trim()) {
      if (catalogSearch.systemFilters.length > 0) setSysOpen(true);
      if (catalogSearch.fieldFilters.length > 0) setFieldsOpen(true);
      if (catalogSearch.relatedFilters.length > 0) setRelatedOpen(true);
    }
  }, [filterSearch, catalogSearch]);

  const filterContext = useMemo(
    () => ({
      accounts,
      contacts,
      deals,
      calls,
      invoices,
      accountRelations,
      contactRelations,
      accountsById,
      usersById,
      contactsById,
    }),
    [accounts, contacts, deals, calls, invoices, accountRelations, contactRelations, accountsById, usersById, contactsById]
  );

  // Convert UI state to structured filter arrays
  const activeFieldFilterList = useMemo(() => {
    return Object.entries(fieldConfigs)
      .filter(([, cfg]) => cfg && cfg.checked)
      .map(([fieldKey, cfg]) => {
        const meta = ACCOUNT_FIELD_FILTERS.find((f) => f.key === fieldKey);
        return {
          field: fieldKey,
          type: meta?.type || 'text',
          operator: cfg.operator || (meta?.type === 'number' ? 'Greater than' : meta?.type === 'date' ? 'On' : 'Is'),
          value: cfg.value ?? '',
          valueTo: cfg.valueTo ?? '',
          enabled: true,
        };
      });
  }, [fieldConfigs]);

  const activeRelatedFilterList = useMemo(() => {
    return Object.entries(relatedConfigs)
      .filter(([, cfg]) => cfg && cfg.checked)
      .map(([moduleKey, cfg]) => ({
        module: moduleKey,
        mode: cfg.mode || 'has_any',
        operator: cfg.operator || 'Greater than',
        value: cfg.value ?? '',
        valueTo: cfg.valueTo ?? '',
        enabled: true,
      }));
  }, [relatedConfigs]);

  const activeFilterCount =
    sysFilters.size +
    activeFieldFilterList.length +
    activeRelatedFilterList.length +
    builderRules.filter((r) => r.enabled !== false).length +
    conditionGroups.filter((g) => g.enabled !== false && g.conditions?.length).length;

  // Evaluate filtered Accounts
  const filteredAccounts = useMemo(() => {
    let result = evaluateAccountFilters(
      accounts,
      {
        viewKey: savedView,
        systemFilters: [...sysFilters],
        systemFilterConfigs: sysConfigs,
        fieldFilters: activeFieldFilterList,
        relatedFilters: activeRelatedFilterList,
        builderRules,
        conditionGroups,
        globalJoin,
        tableSearch,
        activeUser,
        enforcePermissions,
      },
      filterContext
    );

    // Make owner selection and strict access affect the displayed account records
    if (enforcePermissions && activeUser) {
      result = result.filter(
        (a) =>
          a.ownerId === activeUser.id ||
          a.createdBy === activeUser.id ||
          a.connectedTo === activeUser.id
      );
    }

    return result;
  }, [
    accounts,
    savedView,
    sysFilters,
    sysConfigs,
    activeFieldFilterList,
    activeRelatedFilterList,
    builderRules,
    conditionGroups,
    globalJoin,
    tableSearch,
    activeUser,
    enforcePermissions,
    filterContext,
  ]);

  const counts = useMemo(() => {
    const c = {};
    const d = {};
    const m = {};
    contacts.forEach((x) => {
      if (x.accountId) c[x.accountId] = (c[x.accountId] || 0) + 1;
    });
    deals.forEach((x) => {
      if (x.accountId) d[x.accountId] = (d[x.accountId] || 0) + 1;
    });
    accounts.forEach((x) => {
      if (x.parentAccountId) m[x.parentAccountId] = (m[x.parentAccountId] || 0) + 1;
    });
    return { c, d, m };
  }, [contacts, deals, accounts]);

  const accessors = useMemo(
    () => ({
      name: (a) => a.name || '',
      gstin: (a) => a.gstin || a.gstNumber || '',
      gstState: (a) => a.gstState || a.billingState || '',
      owner: (a) => userName(a.ownerId),
      mobile: (a) => a.mobile || a.phone || '',
      tags: (a) => (Array.isArray(a.tags) ? a.tags.join(', ') : a.tags || ''),
      lastActivityTime: (a) => a.lastActivityTime || a.updatedTime || a.createdTime || a.createdOn || '',
      phone: (a) => a.phone || '',
      website: (a) => a.website || '',
      accountNumber: (a) => a.accountNumber || '',
      accountSite: (a) => a.accountSite || '',
      type: (a) => a.type || '',
      industry: (a) => a.industry || '',
      annualRevenue: (a) => Number(a.annualRevenue || 0),
      rating: (a) => a.rating || '',
      ownership: (a) => a.ownership || '',
      employees: (a) => Number(a.employees || 0),
      parentAccount: (a) => accountsById[a.parentAccountId]?.name || '',
      billingCity: (a) => a.billingCity || a.location || '',
      createdTime: (a) => a.createdTime || a.createdOn || '',
    }),
    [userName, accountsById]
  );

  const table = useTable(filteredAccounts, { accessors, pageSize: 15 });

  // Built-in & Saved Views
  const systemViews = useMemo(
    () => [
      { key: 'all', label: 'All Accounts', count: accounts.filter((a) => !a.archived).length },
      { key: 'mine', label: 'My Accounts', count: accounts.filter((a) => !a.archived && a.ownerId === activeUser.id).length },
      { key: 'customers', label: 'Customer Accounts', count: accounts.filter((a) => !a.archived && a.type === 'Customer').length },
      { key: 'partners', label: 'Partner Accounts', count: accounts.filter((a) => !a.archived && a.type === 'Partner').length },
      { key: 'inactive', label: 'Inactive Accounts', count: accounts.filter((a) => !a.archived && a.status === 'Inactive').length },
      { key: 'archived', label: 'Archived Accounts', count: accounts.filter((a) => a.archived).length },
    ],
    [accounts, activeUser.id]
  );

  const currentViewLabel = useMemo(() => {
    const sys = systemViews.find((v) => v.key === savedView);
    if (sys) return sys.label;
    const custom = savedAccountViews.find((v) => v.id === savedView);
    return custom ? custom.name : 'All Accounts';
  }, [systemViews, savedAccountViews, savedView]);

  const allViews = useMemo(() => {
    const list = [...systemViews];
    if (savedAccountViews.length > 0) {
      savedAccountViews.forEach((sv) => {
        list.push({ key: sv.id, label: sv.name, count: null, isCustom: true });
      });
    }
    return list;
  }, [systemViews, savedAccountViews]);

  const activeCustomView = useMemo(
    () => savedAccountViews.find((v) => v.id === savedView),
    [savedAccountViews, savedView]
  );

  const handleSelectView = (vKey) => {
    const custom = savedAccountViews.find((v) => v.id === vKey);
    if (custom) {
      loadSavedView(custom);
    } else {
      setSavedView(vKey);
      table.setPage(1);
    }
  };

  const loadSavedView = (viewObj) => {
    setSavedView(viewObj.id);
    setSysFilters(new Set(viewObj.systemFilters || []));
    const nextFields = {};
    (viewObj.fieldFilters || []).forEach((f) => {
      nextFields[f.field] = {
        checked: true,
        operator: f.operator || 'Is',
        value: f.value ?? '',
        valueTo: f.valueTo ?? '',
      };
    });
    setFieldConfigs(nextFields);
    const nextRel = {};
    (viewObj.relatedFilters || []).forEach((r) => {
      nextRel[r.module] = {
        checked: true,
        mode: r.mode || 'has_any',
        operator: r.operator || 'Greater than',
        value: r.value ?? '',
        valueTo: r.valueTo ?? '',
      };
    });
    setRelatedConfigs(nextRel);
    setBuilderRules(viewObj.builderRules || []);
    setConditionGroups(viewObj.conditionGroups || []);
    setGlobalJoin(viewObj.globalJoin || 'AND');
    table.setPage(1);
  };

  const clearAllFilters = () => {
    setSysFilters(new Set());
    setSysConfigs({});
    setFieldConfigs({});
    setRelatedConfigs({});
    setBuilderRules([]);
    setConditionGroups([]);
    setGlobalJoin('AND');
    setTableSearch('');
    setSavedView('all');
    table.setPage(1);
  };

  const toggleSystemFilter = (key) => {
    setSysFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
        if (key === 'Touched Records') next.delete('Untouched Records');
        if (key === 'Untouched Records') next.delete('Touched Records');
      }
      return next;
    });
    table.setPage(1);
  };

  const updateSystemConfig = (key, patch) => {
    setSysConfigs((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || {}), ...patch },
    }));
    table.setPage(1);
  };

  const toggleFieldFilter = (fieldMeta) => {
    setFieldConfigs((prev) => {
      const curr = prev[fieldMeta.key];
      const nextChecked = !curr?.checked;
      if (!nextChecked) {
        const clone = { ...prev };
        delete clone[fieldMeta.key];
        return clone;
      }
      const ops = ACCOUNT_OPERATORS_BY_TYPE[fieldMeta.type] || ACCOUNT_OPERATORS_BY_TYPE.text;
      let defaultVal = '';
      if (fieldMeta.type === 'dropdown') {
        const opts = ACCOUNT_DROPDOWN_OPTIONS[fieldMeta.optionsKey] || [];
        defaultVal = opts[0] || '';
      } else if (fieldMeta.type === 'lookup') {
        if (fieldMeta.lookupSource === 'users') defaultVal = users[0]?.name || '';
        if (fieldMeta.lookupSource === 'accounts') defaultVal = accounts[0]?.name || '';
      } else if (fieldMeta.type === 'number') {
        defaultVal = fieldMeta.key === 'annualRevenue' ? '1000000' : '50';
      } else if (fieldMeta.type === 'date') {
        defaultVal = todayISO();
      }
      return {
        ...prev,
        [fieldMeta.key]: {
          checked: true,
          operator: fieldMeta.type === 'number' ? 'Greater than' : fieldMeta.type === 'date' ? 'After' : 'Is',
          value: defaultVal || (ops.includes('Is not empty') ? '' : ''),
          valueTo: '',
        },
      };
    });
    table.setPage(1);
  };

  const updateFieldConfig = (fieldKey, patch) => {
    setFieldConfigs((prev) => ({
      ...prev,
      [fieldKey]: { ...(prev[fieldKey] || { checked: true }), ...patch },
    }));
    table.setPage(1);
  };

  const toggleRelatedFilter = (relMeta) => {
    setRelatedConfigs((prev) => {
      const curr = prev[relMeta.key];
      const nextChecked = !curr?.checked;
      if (!nextChecked) {
        const clone = { ...prev };
        delete clone[relMeta.key];
        return clone;
      }
      return {
        ...prev,
        [relMeta.key]: {
          checked: true,
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
      [moduleKey]: { ...(prev[moduleKey] || { checked: true }), ...patch },
    }));
    table.setPage(1);
  };

  // Blank Account template for Create Account Modal
  const makeBlankAccount = () => ({
    name: '',
    accountNumber: `ACC-${1001 + accounts.length}`,
    accountSite: 'Chennai HQ',
    parentAccountId: '',
    type: 'Customer',
    industry: 'Information Technology',
    ownership: 'Private',
    rating: 'Hot',
    annualRevenue: '2500000',
    employees: '150',
    phone: '+91 44 4200 1100',
    fax: '',
    website: '',
    sicCode: '7372',
    tickerSymbol: '',
    ownerId: activeUser.id,
    status: 'Active',
    billingFlat: '',
    billingStreet: '',
    billingCity: 'Chennai',
    billingState: 'Tamil Nadu',
    billingZip: '600002',
    billingCountry: 'India',
    shippingFlat: '',
    shippingStreet: '',
    shippingCity: 'Chennai',
    shippingState: 'Tamil Nadu',
    shippingZip: '600002',
    shippingCountry: 'India',
    copyBillingToShipping: false,
    description: '',
    tagsInput: 'Enterprise, Strategic',
  });

  const openCreateAccountModal = () => {
    setAccountModal({ mode: 'create', record: makeBlankAccount(), errors: {} });
  };

  const openEditAccountModal = (acc) => {
    setAccountModal({
      mode: 'edit',
      record: {
        ...acc,
        tagsInput: Array.isArray(acc.tags) ? acc.tags.join(', ') : acc.tag || '',
        copyBillingToShipping: false,
      },
      errors: {},
    });
  };

  const handleDuplicateAccount = (acc) => {
    setAccountModal({
      mode: 'create',
      record: {
        ...acc,
        id: undefined,
        name: `${acc.name} (Copy)`,
        accountNumber: `ACC-${1001 + accounts.length}`,
        tagsInput: Array.isArray(acc.tags) ? acc.tags.join(', ') : '',
        copyBillingToShipping: false,
      },
      errors: {},
    });
  };

  const exportRows = (rows) =>
    exportCSV('accounts', rows, [
      { label: 'Account Name', value: (a) => a.name },
      { label: 'GST Number/GSTIN', value: (a) => a.gstin || a.gstNumber || '' },
      { label: 'GST State', value: (a) => a.gstState || a.billingState || '' },
      { label: 'Account Owner', value: (a) => userName(a.ownerId) },
      { label: 'Mobile', value: (a) => a.mobile || a.phone || '' },
      { label: 'Tags', value: (a) => (Array.isArray(a.tags) ? a.tags.join(', ') : a.tags || '') },
      { label: 'Last Activity Time', value: (a) => a.lastActivityTime || a.updatedTime || a.createdTime || '' },
      { label: 'Account Number', value: (a) => a.accountNumber },
      { label: 'Account Site', value: (a) => a.accountSite },
      { label: 'Account Type', value: (a) => a.type },
      { label: 'Industry', value: (a) => a.industry },
      { label: 'Ownership', value: (a) => a.ownership },
      { label: 'Rating', value: (a) => a.rating },
      { label: 'Annual Revenue (INR)', value: (a) => a.annualRevenue },
      { label: 'Employees', value: (a) => a.employees },
      { label: 'Phone', value: (a) => a.phone },
      { label: 'Website', value: (a) => a.website },
      { label: 'Billing City', value: (a) => a.billingCity || a.location },
      { label: 'Shipping City', value: (a) => a.shippingCity },
      { label: 'Created Time', value: (a) => a.createdTime || a.createdOn },
    ]);

  const toggleCol = (key) => {
    setHiddenCols((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const rowMenu = (a) => [
    { label: 'Edit Account', icon: Pencil, onClick: () => openEditAccountModal(a) },
    { label: 'Duplicate Account', icon: Copy, onClick: () => handleDuplicateAccount(a) },
    {
      label: 'Assign Owner',
      icon: UserCog,
      onClick: () => {
        table.clearSelection();
        table.toggleRow(a.id);
        setBulkMode('owner');
        setBulkValue(a.ownerId);
      },
    },
    {
      label: a.archived ? 'Restore Account' : 'Archive Account',
      icon: Archive,
      onClick: () => {
        updateRecord('accounts', a.id, {
          archived: !a.archived,
          status: !a.archived ? 'Inactive' : 'Active',
        });
        toast.success(a.archived ? `Restored ${a.name}` : `Archived ${a.name}`);
      },
    },
    {
      label: a.locked ? 'Unlock Record' : 'Lock Record',
      icon: Lock,
      onClick: () => {
        updateRecord('accounts', a.id, { locked: !a.locked });
        toast.info(a.locked ? `Unlocked ${a.name}` : `Locked ${a.name}`);
      },
    },
    { divider: true },
    { label: 'Add Contact', icon: UserPlus, onClick: () => navigate(`/contacts?create=1&account=${a.id}`) },
    { label: 'Create Deal', icon: CircleDollarSign, onClick: () => navigate(`/deals?create=1&account=${a.id}`) },
    { divider: true },
    { label: 'Delete Account', icon: Trash2, danger: true, onClick: () => setConfirm({ ids: [a.id], label: a.name }) },
  ];

  // Table Columns — Default visible data columns match Screenshot 1:
  // Account Name | GST Number/GSTIN | GST State | Account Owner | Mobile | Tags | Last Activity Time | Actions (+ optional configurable columns)
  const allColumns = [
    {
      key: 'name',
      header: (
        <div className="flex items-center gap-1.5">
          <span>Account Name</span>
          <span className="text-[10px] px-1 py-0.2 rounded bg-slate-100 text-slate-500 font-mono">aa ▾</span>
        </div>
      ),
      sortable: true,
      required: true,
      render: (a) => {
        const childCount = counts.m[a.id] || 0;
        const parentAcc = a.parentAccountId ? accountsById[a.parentAccountId] : null;
        return (
          <div className="flex items-center gap-2.5 min-w-[210px]">
            <AccountLogo account={a} size={26} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Link
                  to={`/accounts/${a.id}`}
                  onClick={() => openAccountDetail(a.id)}
                  data-testid={`account-name-link-${a.id}`}
                  className="text-[13px] font-medium text-[#1F6FEB] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F6FEB] rounded px-0.5 truncate text-left"
                >
                  {a.name}
                </Link>
                {a.locked && <Lock size={11} className="text-amber-600 shrink-0" title="Locked Account" />}
                {childCount > 0 && (
                  <span
                    title={`${childCount} member account(s)`}
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10.5px] font-medium rounded bg-blue-50 text-blue-700 border border-blue-200"
                  >
                    <GitBranch size={10} />
                    {childCount}
                  </span>
                )}
              </div>
              {parentAcc && (
                <div className="text-[11px] text-ink-400 truncate">
                  Parent: <span className="text-ink-500">{parentAcc.name}</span>
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'gstin',
      header: 'GST Number/GSTIN',
      sortable: true,
      render: (a) => {
        const val = a.gstin || a.gstNumber;
        return val ? (
          <span className="text-[12.5px] font-mono text-ink-700">{val}</span>
        ) : (
          <span className="text-ink-400">—</span>
        );
      },
    },
    {
      key: 'gstState',
      header: 'GST State',
      sortable: true,
      render: (a) => <span className="text-[12.5px] text-ink-700 whitespace-nowrap">{a.gstState || a.billingState || '—'}</span>,
    },
    {
      key: 'owner',
      header: 'Account Owner',
      sortable: true,
      render: (a) => {
        const u = usersById[a.ownerId];
        return (
          <button
            type="button"
            onClick={() => u && setOwnerDetailUser(u)}
            className="inline-flex items-center gap-2 text-left hover:text-[#1F6FEB] whitespace-nowrap group"
            title="View Account Owner details"
          >
            <UserAvatar userId={a.ownerId} size={22} withName className="whitespace-nowrap group-hover:underline text-[12.5px]" />
          </button>
        );
      },
    },
    {
      key: 'mobile',
      header: 'Mobile',
      sortable: true,
      render: (a) => {
        const num = a.mobile || a.phone;
        return num ? (
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <a
              href={`tel:${num.replace(/\s+/g, '')}`}
              title={`Call ${num}`}
              className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 flex items-center justify-center shrink-0 transition"
            >
              <Phone size={10} className="fill-current" />
            </a>
            <span className="text-[12.5px] text-ink-700">{num}</span>
          </div>
        ) : (
          <span className="text-ink-400">—</span>
        );
      },
    },
    {
      key: 'tags',
      header: 'Tags',
      sortable: true,
      render: (a) => {
        const tagList = Array.isArray(a.tags) ? a.tags : a.tags ? [a.tags] : [];
        return tagList.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1">
            {tagList.map((t, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]"
              >
                {t}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-ink-400">—</span>
        );
      },
    },
    {
      key: 'lastActivityTime',
      header: 'Last Activity Time',
      sortable: true,
      render: (a) => {
        const t = a.lastActivityTime || a.updatedTime || a.createdTime || a.createdOn;
        return (
          <span className="text-[12px] text-ink-600 whitespace-nowrap">
            {t ? fmtDate(t) : '—'}
          </span>
        );
      },
    },
    // Optional Configurable Columns
    {
      key: 'phone',
      header: 'Phone',
      sortable: true,
      render: (a) =>
        a.phone ? (
          <a
            href={`tel:${a.phone.replace(/\s+/g, '')}`}
            className="inline-flex items-center gap-1.5 text-[13px] text-ink hover:text-[#1F6FEB] whitespace-nowrap"
          >
            <Phone size={12.5} className="text-emerald-600 shrink-0" />
            <span>{a.phone}</span>
          </a>
        ) : (
          <span className="text-ink-400">—</span>
        ),
    },
    {
      key: 'website',
      header: 'Website',
      sortable: true,
      render: (a) =>
        a.website ? (
          <a
            href={normalizeWebsiteUrl(a.website)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[13px] text-[#1F6FEB] hover:underline whitespace-nowrap"
          >
            <span>{a.website}</span>
            <ExternalLink size={11.5} className="opacity-70 shrink-0" />
          </a>
        ) : (
          <span className="text-ink-400">—</span>
        ),
    },
    {
      key: 'accountNumber',
      header: 'Account Number',
      sortable: true,
      render: (a) => <span className="text-[12.5px] font-mono text-ink-600">{a.accountNumber || '—'}</span>,
    },
    {
      key: 'accountSite',
      header: 'Account Site',
      sortable: true,
      render: (a) => <span className="text-[12.5px] text-ink-600 whitespace-nowrap">{a.accountSite || '—'}</span>,
    },
    {
      key: 'type',
      header: 'Account Type',
      sortable: true,
      render: (a) => <StatusBadge kind="accountType" value={a.type} className="min-w-[76px]" />,
    },
    {
      key: 'industry',
      header: 'Industry',
      sortable: true,
      className: 'whitespace-nowrap',
    },
    {
      key: 'annualRevenue',
      header: 'Annual Revenue',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (a) => fmtINR(a.annualRevenue),
    },
    {
      key: 'rating',
      header: 'Rating',
      sortable: true,
      render: (a) => (
        <span
          className="inline-flex items-center px-2 py-0.5 rounded text-[11.5px] font-medium border"
          style={{
            color: RATING_COLORS[a.rating] || '#475569',
            borderColor: `${RATING_COLORS[a.rating] || '#94A3B8'}40`,
            backgroundColor: `${RATING_COLORS[a.rating] || '#94A3B8'}12`,
          }}
        >
          {a.rating || 'Active'}
        </span>
      ),
    },
    {
      key: 'ownership',
      header: 'Ownership',
      sortable: true,
      render: (a) => <span className="text-[12.5px] text-ink-600">{a.ownership || 'Private'}</span>,
    },
    {
      key: 'employees',
      header: 'Employees',
      sortable: true,
      align: 'right',
      render: (a) => (a.employees ? Number(a.employees).toLocaleString('en-IN') : '—'),
    },
    {
      key: 'parentAccount',
      header: 'Parent Account',
      sortable: true,
      render: (a) => {
        const p = accountsById[a.parentAccountId];
        return p ? (
          <Link
            to={`/accounts/${p.id}`}
            onClick={() => openAccountDetail(p.id)}
            className="text-[12.5px] text-[#1F6FEB] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F6FEB] rounded px-0.5 whitespace-nowrap"
          >
            {p.name}
          </Link>
        ) : (
          <span className="text-ink-400">—</span>
        );
      },
    },
    {
      key: 'billingCity',
      header: 'Billing City',
      sortable: true,
      render: (a) => a.billingCity || a.location || '—',
    },
    {
      key: 'createdTime',
      header: 'Created Time',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (a) => fmtDate(a.createdTime || a.createdOn),
    },
    {
      key: 'actions',
      header: 'Actions',
      required: true,
      align: 'center',
      render: (a) => (
        <div className="flex items-center justify-center gap-1">
          <button
            className="icon-btn-primary"
            onClick={() => openAccountDetail(a.id)}
            aria-label={`View ${a.name}`}
            title="View Account Details"
          >
            <Eye size={15} />
          </button>
          <button
            className="icon-btn-primary"
            onClick={() => openEditAccountModal(a)}
            aria-label={`Edit ${a.name}`}
            title="Edit Account"
          >
            <Pencil size={14} />
          </button>
          <ActionMenu items={rowMenu(a)} />
        </div>
      ),
    },
  ];

  const visibleColumns = useMemo(
    () => allColumns.filter((c) => c.required || !hiddenCols.has(c.key)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hiddenCols, counts, usersById, accountsById]
  );

  const selectedIds = [...table.selected];
  const activeAccountId = viewingId || routeAccountId || searchParams.get('open') || searchParams.get('id');
  const viewingAccount = activeAccountId ? accounts.find((a) => a.id === activeAccountId) || null : null;

  const isCreate = Boolean(
    isCreatePage ||
    createViewOpen ||
    searchParams.get('create') === '1' ||
    searchParams.get('mode') === 'create' ||
    location.pathname.endsWith('/create') ||
    location.pathname.endsWith('/new')
  );

  if (isCreate) {
    return (
      <CreateAccount
        onCancel={() => {
          setCreateViewOpen(false);
          if (searchParams.get('create') || searchParams.get('mode')) {
            const next = new URLSearchParams(searchParams);
            next.delete('create');
            next.delete('mode');
            setSearchParams(next);
          } else if (location.pathname.endsWith('/create') || location.pathname.endsWith('/new')) {
            navigate('/accounts');
          }
        }}
        onSuccess={(created) => {
          setCreateViewOpen(false);
          if (searchParams.get('create') || searchParams.get('mode')) {
            const next = new URLSearchParams(searchParams);
            next.delete('create');
            next.delete('mode');
            setSearchParams(next);
          } else if (location.pathname.endsWith('/create') || location.pathname.endsWith('/new')) {
            navigate('/accounts');
          }
          if (created?.id) {
            openAccountDetail(created.id);
          }
        }}
      />
    );
  }

  if (viewingAccount) {
    return (
      <AccountDetail
        account={viewingAccount}
        accountsList={table.sorted}
        onBack={closeAccountDetail}
        onSelectAccount={openAccountDetail}
        activeUser={activeUser}
        enforcePermissions={enforcePermissions}
      />
    );
  }

  return (
    <div className="space-y-2.5">
      {/* 2 & 3. PageHeader: Saved-view row ("All Accounts ▾ ⋯") + Main Toolbar */}
      <PageHeader
        views={allViews}
        view={savedView}
        onViewChange={handleSelectView}
        tabMenu={[
          {
            label: 'Save current filters as view',
            icon: BookmarkPlus,
            onClick: () => setSaveViewModal({ mode: 'create', name: '', shared: true }),
          },
          activeCustomView && {
            label: `Rename "${activeCustomView.name}"`,
            icon: Pencil,
            onClick: () =>
              setSaveViewModal({
                mode: 'rename',
                id: activeCustomView.id,
                name: activeCustomView.name,
                shared: activeCustomView.shared,
              }),
          },
          activeCustomView && {
            label: `Delete "${activeCustomView.name}"`,
            icon: Trash2,
            danger: true,
            onClick: () => {
              deleteAccountView(activeCustomView.id);
              setSavedView('all');
              toast.info(`Deleted view "${activeCustomView.name}"`);
            },
          },
          { divider: true },
          { label: 'Advanced Condition Builder (AND/OR)', icon: SlidersHorizontal, onClick: () => setBuilderOpen(true) },
          { label: 'Export filtered accounts (CSV)', icon: Download, onClick: () => exportRows(table.sorted) },
          { label: `Select all ${filteredAccounts.length} filtered`, onClick: table.selectAllFiltered },
          {
            label: 'Reset to default view',
            icon: RotateCcw,
            onClick: () => {
              setSavedView('all');
              clearAllFilters();
              setTableSearch('');
              table.setSort(null);
              table.setPage(1);
            },
          },
        ]}
        toolbar={{
          labeled: true,
          filterActive: filtersOpen,
          onFilter: () => setFiltersOpen((o) => !o),
          sortOptions: [
            { key: 'name', label: 'Account Name' },
            { key: 'annualRevenue', label: 'Annual Revenue' },
            { key: 'createdTime', label: 'Created Time' },
            { key: 'employees', label: 'Employees' },
            { key: 'owner', label: 'Account Owner' },
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
          module: 'Accounts',
          primary: {
            label: 'Create Account',
            testId: 'create-account-btn',
            /* data-testid="create-account-btn" */
            onClick: () => navigate('/accounts/create'),
            menu: [
              { label: 'Create Account', icon: Plus, onClick: () => navigate('/accounts/create') },
              { label: 'Convert Lead to Account', icon: Sparkles, onClick: () => setLeadConvertModal(true) },
              { divider: true },
              { label: 'Export filtered accounts (CSV)', icon: Download, onClick: () => exportRows(table.sorted) },
            ],
          },
          secondary: {
            label: 'Map View',
            icon: MapPin,
            testId: 'accounts-map-view-button',
            /* data-testid="accounts-map-view-button" */
            onClick: () => setMapModalOpen(true),
          },
          /* aria-label="More account actions" */
          moreItems: [
            { label: 'Advanced Condition Builder', icon: SlidersHorizontal, onClick: () => setBuilderOpen(true) },
            {
              label: 'Export selected (CSV)',
              icon: Download,
              disabled: !selectedIds.length,
              onClick: () => exportRows(accounts.filter((a) => table.selected.has(a.id))),
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
              label: 'Delete selected',
              icon: Trash2,
              danger: true,
              disabled: !selectedIds.length,
              onClick: () => setConfirm({ ids: selectedIds, label: `${selectedIds.length} accounts` }),
            },
          ],
        }}
      />

      {/* 4. Search and ownership row */}
      <div className="card px-3 py-2 mb-2.5 flex flex-wrap items-center justify-between gap-2.5 text-[12.5px] bg-white border border-[#E2E8F0] rounded-lg shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full sm:w-[260px]">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
            <input
              type="search"
              value={tableSearch}
              onChange={(e) => {
                setTableSearch(e.target.value);
                table.setPage(1);
              }}
              placeholder="Search accounts in table..."
              aria-label="Search accounts in table"
              className="input h-8 pl-8 pr-7 text-[12.5px]"
            />
            {tableSearch && (
              <button
                type="button"
                onClick={() => {
                  setTableSearch('');
                  table.setPage(1);
                }}
                aria-label="Clear table search"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Compact Filter Dropdown Beside Search Input */}
          <Dropdown
            align="left"
            width={240}
            trigger={
              <button
                type="button"
                data-testid="compact-accounts-filter-dropdown"
                className={`h-8 px-2.5 rounded-lg border text-[12.5px] font-medium inline-flex items-center gap-1.5 transition-colors ${
                  activeFilterCount > 0
                    ? 'border-[#1F6FEB] bg-[#EFF6FF] text-[#1F6FEB]'
                    : 'border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#475569]'
                }`}
              >
                <SlidersHorizontal size={13} className="text-[#1F6FEB]" />
                <span>Filter</span>
                {activeFilterCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#1F6FEB] text-white text-[10.5px] font-semibold">
                    {activeFilterCount}
                  </span>
                )}
                <ChevronDown size={13} className="text-[#64748B]" />
              </button>
            }
          >
            {(close) => (
              <>
                <MenuLabel>Quick Filter Options</MenuLabel>
                <MenuItem
                  icon={Filter}
                  onClick={() => {
                    setFiltersOpen((o) => !o);
                    close();
                  }}
                >
                  {filtersOpen ? 'Hide Filter Panel' : 'Show Filter Panel'}
                </MenuItem>
                <MenuItem
                  icon={SlidersHorizontal}
                  onClick={() => {
                    setBuilderOpen(true);
                    close();
                  }}
                >
                  Advanced Condition Builder
                </MenuItem>
                <MenuDivider />
                <MenuLabel>Filter Categories</MenuLabel>
                <MenuItem
                  onClick={() => {
                    setFiltersOpen(true);
                    setSysOpen(true);
                    close();
                  }}
                >
                  System Defined Filters ({ACCOUNT_SYSTEM_DEFINED_FILTERS.length})
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setFiltersOpen(true);
                    setFieldsOpen(true);
                    close();
                  }}
                >
                  Filter By Fields ({ACCOUNT_FIELD_FILTERS.length})
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setFiltersOpen(true);
                    setRelatedOpen(true);
                    close();
                  }}
                >
                  Related Modules ({ACCOUNT_RELATED_MODULE_FILTERS.length})
                </MenuItem>
                {activeFilterCount > 0 && (
                  <>
                    <MenuDivider />
                    <MenuItem
                      icon={RotateCcw}
                      danger
                      onClick={() => {
                        clearAllFilters();
                        close();
                      }}
                    >
                      Clear All Active Filters ({activeFilterCount})
                    </MenuItem>
                  </>
                )}
              </>
            )}
          </Dropdown>
        </div>

        {/* Right side: Security Shield, Account Owner Selector, Strict Owner Access Checkbox */}
        <div className="flex items-center gap-2.5 ml-auto">
          <div className="flex items-center gap-1.5 text-[12px] text-ink-600">
            <Shield size={13.5} className="text-[#1F6FEB]" />
            <select
              aria-label="Account Owner Selector"
              value={activeUserId}
              onChange={(e) => {
                setActiveUserId(e.target.value);
                table.setPage(1);
              }}
              className="h-7 px-2 rounded border border-[#CBD5E1] bg-white text-[12px] text-ink cursor-pointer outline-none focus:border-[#1F6FEB]"
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
              onChange={(e) => {
                setEnforcePermissions(e.target.checked);
                table.setPage(1);
              }}
            />
            <span className="text-[#334155]">Strict Owner Access</span>
          </label>
        </div>
      </div>

      {/* 5. Results summary row */}
      <div className="card px-3.5 py-2 mb-2.5 text-[13px] font-semibold text-ink border border-line bg-white rounded-lg shadow-xs flex items-center justify-between">
        <div data-testid="accounts-results-summary">
          Showing <span className="text-primary font-bold">{filteredAccounts.length}</span> accounts
        </div>
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[11.5px] px-2 py-0.5 rounded-full bg-primary-50 text-primary border border-primary-200 font-medium">
              {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} applied
            </span>
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-[11.5px] text-danger hover:underline font-medium"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Active Filter Chips Bar (when filters applied) */}
      {activeFilterCount > 0 && (
        <div className="card px-3 py-1.5 mb-2.5 bg-[#F8FAFD] border-line flex flex-wrap items-center gap-1.5 text-[11.5px]">
          <span className="font-medium text-[#64748B] mr-1">
            Active Filters ({globalJoin}):
          </span>
          {[...sysFilters].map((sysKey) => (
            <span
              key={sysKey}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]"
            >
              <span>System: {sysKey}</span>
              <button type="button" onClick={() => toggleSystemFilter(sysKey)} aria-label={`Remove ${sysKey}`}>
                <X size={11} />
              </button>
            </span>
          ))}
          {activeFieldFilterList.map((ff) => {
            const label = ACCOUNT_FIELD_FILTERS.find((x) => x.key === ff.field)?.label || ff.field;
            return (
              <span
                key={ff.field}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]"
              >
                <span>
                  {label} {ff.operator} {Array.isArray(ff.value) ? ff.value.join(', ') : ff.value}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setFieldConfigs((prev) => {
                      const c = { ...prev };
                      delete c[ff.field];
                      return c;
                    })
                  }
                >
                  <X size={11} />
                </button>
              </span>
            );
          })}
          {activeRelatedFilterList.map((rf) => {
            const label = ACCOUNT_RELATED_MODULE_FILTERS.find((x) => x.key === rf.module)?.label || rf.module;
            return (
              <span
                key={rf.module}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FAF5FF] text-[#7E22CE] border border-[#E9D5FF]"
              >
                <span>
                  Related: {label} ({rf.mode})
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setRelatedConfigs((prev) => {
                      const c = { ...prev };
                      delete c[rf.module];
                      return c;
                    })
                  }
                >
                  <X size={11} />
                </button>
              </span>
            );
          })}
          {conditionGroups.map((g, idx) => (
            <span
              key={g.id || idx}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200"
            >
              <span>
                Group #{idx + 1} ({g.logic}: {g.conditions?.length || 0} rules)
              </span>
            </span>
          ))}
          <button
            type="button"
            onClick={clearAllFilters}
            data-testid="clear-all-account-filters"
            className="text-[11.5px] font-medium text-[#DC2626] hover:underline ml-1"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Mobile Backdrop Overlay */}
      {filtersOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setFiltersOpen(false)}
        />
      )}

      {/* Main Content Split: Left "Filter Accounts by" Panel + Right Accounts Data Table */}
      <div className="flex gap-2.5 items-start">
        {filtersOpen && (
          <aside
            aria-label="Filter Accounts by"
            data-testid="accounts-filter-sidebar"
            className="fixed inset-y-0 left-0 z-50 w-[290px] max-w-[85vw] bg-white border-r border-[#E2E8F0] shadow-xl overflow-y-auto thin-scroll p-3 lg:static lg:z-auto lg:w-[225px] lg:border lg:rounded-lg lg:shrink-0 lg:shadow-[0_1px_2px_rgba(15,23,42,0.03)] lg:sticky lg:top-[64px] lg:max-h-[calc(100vh-78px)]"
          >
            {/* Mobile Header with close button */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E2E8F0] lg:hidden">
              <span className="text-[13.5px] font-semibold text-[#0F172A]">Filter Accounts by</span>
              <button
                type="button"
                aria-label="Close filters"
                onClick={() => setFiltersOpen(false)}
                className="p-1 rounded text-[#64748B] hover:bg-[#F1F5F9]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Desktop Heading: Filter Accounts by */}
            <div className="hidden lg:flex items-center justify-between mb-2">
              <h2 className="text-[13.5px] font-semibold text-[#0F172A]">Filter Accounts by</h2>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-[11.5px] font-medium text-[#1F6FEB] hover:underline"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Global AND / OR Logic Switcher */}
            <div className="flex items-center justify-between mb-2 px-2 py-1 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[11px]">
              <span className="text-[#475569] font-medium">Match Logic:</span>
              <div className="inline-flex rounded border border-[#CBD5E1] overflow-hidden">
                {['AND', 'OR'].map((op) => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => setGlobalJoin(op)}
                    className={`px-2 py-0.5 font-semibold ${
                      globalJoin === op ? 'bg-[#1F6FEB] text-white' : 'bg-white text-[#475569]'
                    }`}
                  >
                    {op}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Sidebar Search Input (Placeholder: Search) */}
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-2 text-[#94A3B8]" size={13.5} />
              <input
                type="text"
                placeholder="Search"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                data-testid="account-filter-search-input"
                className="w-full h-7 pl-7 pr-6 text-[12.5px] border border-[#CBD5E1] rounded bg-white focus:border-[#1F6FEB] outline-none"
              />
              {filterSearch && (
                <button
                  type="button"
                  onClick={() => setFilterSearch('')}
                  aria-label="Clear filter search"
                  className="absolute right-2 top-2 text-[#94A3B8] hover:text-[#334155]"
                >
                  <X size={12.5} />
                </button>
              )}
            </div>

            {catalogSearch.totalMatches === 0 ? (
              <div
                data-testid="no-matching-account-filters"
                className="py-8 px-2 text-center text-[12.5px] text-[#64748B]"
              >
                No matching filters
              </div>
            ) : (
              <div className="space-y-2.5 divide-y divide-[#F1F5F9]">
                {/* SECTION A — System Defined Filters (Exact 6 options) */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setSysOpen((o) => !o)}
                    className="w-full flex items-center justify-between py-1.5 text-[12.5px] font-semibold text-[#0F172A] text-left"
                  >
                    <span className="flex items-center gap-1">
                      {sysOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      <span>System Defined Filters</span>
                    </span>
                    <span className="text-[11px] text-[#64748B] font-normal">
                      {catalogSearch.systemFilters.length}
                    </span>
                  </button>

                  {sysOpen && (
                    <div className="pl-2 pt-1 pb-2 space-y-2">
                      {catalogSearch.systemFilters.map((sf) => {
                        const checked = sysFilters.has(sf.key);
                        const cfg = sysConfigs[sf.key] || {};
                        return (
                          <div key={sf.key} className="space-y-1">
                            <label className="flex items-start gap-2 text-[12.5px] text-[#334155] cursor-pointer leading-snug hover:text-[#0F172A]">
                              <input
                                type="checkbox"
                                className="cb mt-0.5"
                                checked={checked}
                                onChange={() => toggleSystemFilter(sf.key)}
                                data-testid={`sys-filter-${sf.key}`}
                              />
                              <span>
                                <HighlightMatch text={sf.label} query={filterSearch} />
                              </span>
                            </label>

                            {/* Sub-controls for System Defined Filters */}
                            {checked && sf.key === 'Cadences' && (
                              <div className="ml-5 p-1.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                                <select
                                  value={cfg.mode || 'enrolled'}
                                  onChange={(e) => updateSystemConfig('Cadences', { mode: e.target.value })}
                                  className="w-full h-6 px-1.5 text-[11.5px] border border-[#CBD5E1] rounded bg-white"
                                >
                                  <option value="enrolled">Enrolled in Cadence</option>
                                  <option value="not_enrolled">Not Enrolled in Cadence</option>
                                </select>
                                {cfg.mode !== 'not_enrolled' && (
                                  <select
                                    value={cfg.status || ''}
                                    onChange={(e) => updateSystemConfig('Cadences', { status: e.target.value })}
                                    className="w-full h-6 px-1.5 text-[11.5px] border border-[#CBD5E1] rounded bg-white"
                                  >
                                    <option value="">Any Cadence Status</option>
                                    <option value="Active">Active</option>
                                    <option value="Completed">Completed</option>
                                  </select>
                                )}
                              </div>
                            )}

                            {checked && sf.key === 'Locked' && (
                              <div className="ml-5 p-1.5 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
                                <select
                                  value={cfg.mode || 'locked'}
                                  onChange={(e) => updateSystemConfig('Locked', { mode: e.target.value })}
                                  className="w-full h-6 px-1.5 text-[11.5px] border border-[#CBD5E1] rounded bg-white"
                                >
                                  <option value="locked">Locked Accounts</option>
                                  <option value="unlocked">Unlocked Accounts</option>
                                </select>
                              </div>
                            )}

                            {checked && sf.key === 'Record Action' && (
                              <div className="ml-5 p-1.5 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
                                <select
                                  value={cfg.actionType || 'any'}
                                  onChange={(e) => updateSystemConfig('Record Action', { actionType: e.target.value })}
                                  className="w-full h-6 px-1.5 text-[11.5px] border border-[#CBD5E1] rounded bg-white"
                                >
                                  <option value="any">Created or Modified</option>
                                  <option value="created">Created</option>
                                  <option value="modified">Modified</option>
                                  <option value="archived">Archived</option>
                                </select>
                              </div>
                            )}

                            {checked && sf.key === 'Related Records Action' && (
                              <div className="ml-5 p-1.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                                <select
                                  value={cfg.mode || 'with_activity'}
                                  onChange={(e) => updateSystemConfig('Related Records Action', { mode: e.target.value })}
                                  className="w-full h-6 px-1.5 text-[11.5px] border border-[#CBD5E1] rounded bg-white"
                                >
                                  <option value="with_activity">With related-record activity</option>
                                  <option value="without_activity">Without related-record activity</option>
                                </select>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* SECTION B — Filter By Fields (All 37 exact fields) */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setFieldsOpen((o) => !o)}
                    className="w-full flex items-center justify-between py-1.5 text-[12.5px] font-semibold text-[#0F172A] text-left"
                  >
                    <span className="flex items-center gap-1">
                      {fieldsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      <span>Filter By Fields</span>
                    </span>
                    <span className="text-[11px] text-[#64748B] font-normal">
                      {catalogSearch.fieldFilters.length}
                    </span>
                  </button>

                  {fieldsOpen && (
                    <div className="pl-2 pt-1 pb-2 space-y-2">
                      {catalogSearch.fieldFilters.map((ff) => {
                        const cfg = fieldConfigs[ff.key];
                        const checked = Boolean(cfg?.checked);
                        const operators = ACCOUNT_OPERATORS_BY_TYPE[ff.type] || ACCOUNT_OPERATORS_BY_TYPE.text;
                        const unary = [
                          'Is empty',
                          'Is not empty',
                          'Today',
                          'Yesterday',
                          'This Week',
                          'This Month',
                          'Last 30 Days',
                        ].includes(cfg?.operator);

                        return (
                          <div key={ff.key} className="space-y-1.5">
                            <label className="flex items-start gap-2 text-[12.5px] text-[#334155] cursor-pointer leading-snug hover:text-[#0F172A]">
                              <input
                                type="checkbox"
                                className="cb mt-0.5"
                                checked={checked}
                                onChange={() => toggleFieldFilter(ff)}
                                data-testid={`field-filter-${ff.key}`}
                              />
                              <span className="break-words">
                                <HighlightMatch text={ff.label} query={filterSearch} />
                              </span>
                            </label>

                            {checked && (
                              <div className="ml-5 p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
                                <select
                                  aria-label={`${ff.label} operator`}
                                  value={cfg.operator}
                                  onChange={(e) => updateFieldConfig(ff.key, { operator: e.target.value })}
                                  className="w-full h-6 px-1.5 text-[11.5px] border border-[#CBD5E1] rounded bg-white"
                                >
                                  {operators.map((op) => (
                                    <option key={op} value={op}>
                                      {op}
                                    </option>
                                  ))}
                                </select>

                                {!unary && ff.type === 'dropdown' && (
                                  <select
                                    aria-label={`${ff.label} value`}
                                    value={cfg.value}
                                    onChange={(e) => updateFieldConfig(ff.key, { value: e.target.value })}
                                    className="w-full h-6 px-1.5 text-[11.5px] border border-[#CBD5E1] rounded bg-white"
                                  >
                                    <option value="">Select {ff.label}...</option>
                                    {(ACCOUNT_DROPDOWN_OPTIONS[ff.optionsKey] || []).map((opt) => (
                                      <option key={opt} value={opt}>
                                        {opt}
                                      </option>
                                    ))}
                                  </select>
                                )}

                                {!unary && ff.type === 'lookup' && (
                                  <select
                                    aria-label={`${ff.label} lookup`}
                                    value={cfg.value}
                                    onChange={(e) => updateFieldConfig(ff.key, { value: e.target.value })}
                                    className="w-full h-6 px-1.5 text-[11.5px] border border-[#CBD5E1] rounded bg-white"
                                  >
                                    <option value="">Select {ff.label}...</option>
                                    {ff.lookupSource === 'users' &&
                                      users.map((u) => (
                                        <option key={u.id} value={u.name}>
                                          {u.name}
                                        </option>
                                      ))}
                                    {ff.lookupSource === 'accounts' &&
                                      accounts.slice(0, 60).map((acc) => (
                                        <option key={acc.id} value={acc.name}>
                                          {acc.name}
                                        </option>
                                      ))}
                                  </select>
                                )}

                                {!unary && ff.type === 'number' && (
                                  <div className="space-y-1">
                                    <input
                                      type="number"
                                      placeholder={cfg.operator === 'Between' ? 'Min value' : 'Enter amount/number'}
                                      value={cfg.value}
                                      onChange={(e) => updateFieldConfig(ff.key, { value: e.target.value })}
                                      className="w-full h-6 px-2 text-[11.5px] border border-[#CBD5E1] rounded bg-white"
                                    />
                                    {cfg.operator === 'Between' && (
                                      <input
                                        type="number"
                                        placeholder="Max value"
                                        value={cfg.valueTo || ''}
                                        onChange={(e) => updateFieldConfig(ff.key, { valueTo: e.target.value })}
                                        className="w-full h-6 px-2 text-[11.5px] border border-[#CBD5E1] rounded bg-white"
                                      />
                                    )}
                                  </div>
                                )}

                                {!unary && ff.type === 'date' && (
                                  <div className="space-y-1">
                                    <input
                                      type="date"
                                      value={cfg.value}
                                      onChange={(e) => updateFieldConfig(ff.key, { value: e.target.value })}
                                      className="w-full h-6 px-1.5 text-[11.5px] border border-[#CBD5E1] rounded bg-white"
                                    />
                                    {cfg.operator === 'Between' && (
                                      <input
                                        type="date"
                                        value={cfg.valueTo || ''}
                                        onChange={(e) => updateFieldConfig(ff.key, { valueTo: e.target.value })}
                                        className="w-full h-6 px-1.5 text-[11.5px] border border-[#CBD5E1] rounded bg-white"
                                      />
                                    )}
                                  </div>
                                )}

                                {!unary && ff.type === 'text' && (
                                  <input
                                    type="text"
                                    placeholder={`Enter ${ff.label}...`}
                                    value={cfg.value}
                                    onChange={(e) => updateFieldConfig(ff.key, { value: e.target.value })}
                                    className="w-full h-6 px-2 text-[11.5px] border border-[#CBD5E1] rounded bg-white"
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* SECTION C — Filter By Related Modules (All 10 exact related modules) */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setRelatedOpen((o) => !o)}
                    className="w-full flex items-center justify-between py-1.5 text-[12.5px] font-semibold text-[#0F172A] text-left"
                  >
                    <span className="flex items-center gap-1">
                      {relatedOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      <span>Filter By Related Modules</span>
                    </span>
                    <span className="text-[11px] text-[#64748B] font-normal">
                      {catalogSearch.relatedFilters.length}
                    </span>
                  </button>

                  {relatedOpen && (
                    <div className="pl-2 pt-1 pb-2 space-y-2">
                      {catalogSearch.relatedFilters.map((rm) => {
                        const cfg = relatedConfigs[rm.key];
                        const checked = Boolean(cfg?.checked);
                        const modeOptions = [
                          ...rm.presets,
                          ...ACCOUNT_RELATED_CONDITION_MODES.filter(
                            (m) => !rm.presets.some((p) => p.value === m.value)
                          ),
                        ];

                        return (
                          <div key={rm.key} className="space-y-1.5">
                            <label className="flex items-start gap-2 text-[12.5px] text-[#334155] cursor-pointer leading-snug hover:text-[#0F172A]">
                              <input
                                type="checkbox"
                                className="cb mt-0.5"
                                checked={checked}
                                onChange={() => toggleRelatedFilter(rm)}
                                data-testid={`related-filter-${rm.key}`}
                              />
                              <span className="break-words">
                                <HighlightMatch text={rm.label} query={filterSearch} />
                              </span>
                            </label>

                            {checked && (
                              <div className="ml-5 p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
                                <select
                                  aria-label={`${rm.label} filter mode`}
                                  value={cfg.mode}
                                  onChange={(e) => updateRelatedConfig(rm.key, { mode: e.target.value, value: '' })}
                                  className="w-full h-6 px-1.5 text-[11.5px] border border-[#CBD5E1] rounded bg-white"
                                >
                                  {modeOptions.map((mo) => (
                                    <option key={mo.value} value={mo.value}>
                                      {mo.label}
                                    </option>
                                  ))}
                                </select>

                                {cfg.mode === 'deal_value_gt' && (
                                  <input
                                    type="number"
                                    placeholder="Min deal amount (₹)"
                                    value={cfg.value}
                                    onChange={(e) => updateRelatedConfig(rm.key, { value: e.target.value })}
                                    className="w-full h-6 px-2 text-[11.5px] border border-[#CBD5E1] rounded bg-white"
                                  />
                                )}

                                {(cfg.mode === 'count' || cfg.mode === 'subsidiary_count') && (
                                  <div className="space-y-1">
                                    <select
                                      value={cfg.operator || 'Greater than'}
                                      onChange={(e) => updateRelatedConfig(rm.key, { operator: e.target.value })}
                                      className="w-full h-6 px-1.5 text-[11.5px] border border-[#CBD5E1] rounded bg-white"
                                    >
                                      {['Greater than', 'Equals', 'Less than', 'Between'].map((op) => (
                                        <option key={op} value={op}>
                                          {op}
                                        </option>
                                      ))}
                                    </select>
                                    <input
                                      type="number"
                                      placeholder="Record count"
                                      value={cfg.value}
                                      onChange={(e) => updateRelatedConfig(rm.key, { value: e.target.value })}
                                      className="w-full h-6 px-2 text-[11.5px] border border-[#CBD5E1] rounded bg-white"
                                    />
                                  </div>
                                )}

                                {cfg.mode === 'status' && (
                                  <select
                                    value={cfg.value}
                                    onChange={(e) => updateRelatedConfig(rm.key, { value: e.target.value })}
                                    className="w-full h-6 px-1.5 text-[11.5px] border border-[#CBD5E1] rounded bg-white"
                                  >
                                    <option value="">Any Status</option>
                                    {rm.statuses.map((st) => (
                                      <option key={st} value={st}>
                                        {st}
                                      </option>
                                    ))}
                                  </select>
                                )}

                                {cfg.mode === 'owner' && (
                                  <select
                                    value={cfg.value}
                                    onChange={(e) => updateRelatedConfig(rm.key, { value: e.target.value })}
                                    className="w-full h-6 px-1.5 text-[11.5px] border border-[#CBD5E1] rounded bg-white"
                                  >
                                    <option value="">Select Owner</option>
                                    {users.map((u) => (
                                      <option key={u.id} value={u.name}>
                                        {u.name}
                                      </option>
                                    ))}
                                  </select>
                                )}

                                {(cfg.mode === 'product_name' || cfg.mode === 'lead_source') && (
                                  <input
                                    type="text"
                                    placeholder={cfg.mode === 'product_name' ? 'Product name...' : 'Lead source...'}
                                    value={cfg.value}
                                    onChange={(e) => updateRelatedConfig(rm.key, { value: e.target.value })}
                                    className="w-full h-6 px-2 text-[11.5px] border border-[#CBD5E1] rounded bg-white"
                                  />
                                )}

                                {(cfg.mode === 'created_date' ||
                                  cfg.mode === 'updated_date' ||
                                  cfg.mode === 'email_date_range') && (
                                  <div className="space-y-1">
                                    <input
                                      type="date"
                                      value={cfg.value}
                                      onChange={(e) => updateRelatedConfig(rm.key, { value: e.target.value })}
                                      className="w-full h-6 px-1.5 text-[11.5px] border border-[#CBD5E1] rounded bg-white"
                                    />
                                    <input
                                      type="date"
                                      value={cfg.valueTo || ''}
                                      onChange={(e) => updateRelatedConfig(rm.key, { valueTo: e.target.value })}
                                      className="w-full h-6 px-1.5 text-[11.5px] border border-[#CBD5E1] rounded bg-white"
                                    />
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
              </div>
            )}
          </aside>
        )}

        {/* Right Main Content: Accounts List / Kanban / Grid / Chart */}
        <div className="flex-1 min-w-0">
          <section className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <BulkBar count={selectedIds.length} onClear={table.clearSelection}>
              <BulkButton
                icon={UserCog}
                onClick={() => {
                  setBulkMode('owner');
                  setBulkValue(users[0]?.id || 'u1');
                }}
              >
                Assign Owner
              </BulkButton>
              <BulkButton
                onClick={() => {
                  setBulkMode('type');
                  setBulkValue('Customer');
                }}
              >
                Update Type
              </BulkButton>
              <BulkButton
                onClick={() => {
                  setBulkMode('rating');
                  setBulkValue('Hot');
                }}
              >
                Update Rating
              </BulkButton>
              <BulkButton
                icon={Download}
                onClick={() => exportRows(accounts.filter((a) => table.selected.has(a.id)))}
              >
                Export Selected
              </BulkButton>
              <BulkButton
                icon={Trash2}
                danger
                onClick={() => setConfirm({ ids: selectedIds, label: `${selectedIds.length} accounts` })}
              >
                Delete
              </BulkButton>
            </BulkBar>

            {/* View 1: List View (Zoho CRM Table) */}
            {layout === 'list' && (
              <DataTable
                columns={visibleColumns}
                rows={table.pageRows}
                table={table}
                loading={refreshing}
                dense={dense}
                minWidth={900}
                emptyAction={
                  <div className="flex items-center gap-2 mt-2">
                    {activeFilterCount > 0 && (
                      <button className="btn-secondary h-8 text-[12.5px]" onClick={clearAllFilters}>
                        Reset Filters
                      </button>
                    )}
                    <button className="btn-primary h-8 text-[12.5px]" onClick={openCreateAccountModal}>
                      <Plus size={14} />
                      Create Account
                    </button>
                  </div>
                }
              />
            )}

            {/* View 2: Kanban View (Group by Account Type, Rating, or Status) */}
            {layout === 'kanban' && (
              <div className="p-3 space-y-3">
                <div className="flex items-center justify-between border-b border-line pb-2">
                  <span className="text-[12.5px] font-medium text-ink-600">
                    Kanban Board ({filteredAccounts.length} filtered accounts)
                  </span>
                  <div className="flex items-center gap-2 text-[12px]">
                    <span className="text-ink-500">Group by:</span>
                    {[
                      { key: 'type', label: 'Account Type' },
                      { key: 'rating', label: 'Rating' },
                      { key: 'status', label: 'Status' },
                    ].map((g) => (
                      <button
                        key={g.key}
                        type="button"
                        onClick={() => setKanbanGroupBy(g.key)}
                        className={`px-2 py-0.5 rounded border ${
                          kanbanGroupBy === g.key
                            ? 'border-[#1F6FEB] bg-[#EFF6FF] text-[#1F6FEB] font-semibold'
                            : 'border-line bg-white text-ink-600'
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>
                <KanbanView
                  groups={
                    kanbanGroupBy === 'rating'
                      ? ACCOUNT_RATINGS.map((r) => ({ key: r, label: r, color: RATING_COLORS[r] || '#3B82F6' }))
                      : kanbanGroupBy === 'status'
                      ? ACCOUNT_STATUSES.map((s) => ({ key: s, label: s, color: STATUS_COLORS[s] }))
                      : ACCOUNT_TYPES.map((t) => ({ key: t, label: t, color: TYPE_COLORS[t] || '#2F7BF5' }))
                  }
                  rows={table.sorted}
                  groupOf={(a) => a[kanbanGroupBy] || 'Customer'}
                  onMove={(a, to) => updateRecord('accounts', a.id, { [kanbanGroupBy]: to })}
                  onCardClick={(a) => openAccountDetail(a.id)}
                  summary={(items) => `${fmtCompact(sumBy(items, (a) => a.annualRevenue))} total revenue`}
                  renderCard={(a) => (
                    <div className="flex items-start gap-2.5">
                      <AccountLogo account={a} size={28} />
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-semibold text-ink truncate">{a.name}</div>
                        <div className="text-[11.5px] text-ink-500 truncate">
                          {a.industry} · {a.billingCity || a.location}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <StatusBadge kind="accountType" value={a.type} size="sm" />
                          <span className="text-[11.5px] font-medium text-ink">{fmtCompact(a.annualRevenue)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                />
              </div>
            )}

            {/* View 3: Grid View */}
            {layout === 'grid' && (
              <div className="p-3">
                <GridView
                  rows={table.pageRows}
                  onCardClick={(a) => openAccountDetail(a.id)}
                  renderCard={(a) => (
                    <>
                      <div className="flex items-center gap-3">
                        <AccountLogo account={a} size={36} />
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-ink truncate">{a.name}</div>
                          <div className="text-[12px] text-ink-500 truncate">
                            {a.industry} · {a.billingCity || a.location}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                        <div className="bg-page rounded-lg py-1.5">
                          <div className="text-[14px] font-semibold text-ink">{counts.c[a.id] || 0}</div>
                          <div className="text-[11px] text-ink-500">Contacts</div>
                        </div>
                        <div className="bg-page rounded-lg py-1.5">
                          <div className="text-[14px] font-semibold text-ink">{counts.d[a.id] || 0}</div>
                          <div className="text-[11px] text-ink-500">Deals</div>
                        </div>
                        <div className="bg-page rounded-lg py-1.5">
                          <div className="text-[14px] font-semibold text-ink">
                            {fmtCompact(a.annualRevenue, { space: false })}
                          </div>
                          <div className="text-[11px] text-ink-500">Revenue</div>
                        </div>
                      </div>
                      <div className="mt-2.5 flex items-center gap-2">
                        <StatusBadge kind="accountType" value={a.type} size="sm" />
                        <span className="text-[11.5px] text-ink-500 truncate">{a.phone}</span>
                        <span className="ml-auto">
                          <UserAvatar userId={a.ownerId} size={22} />
                        </span>
                      </div>
                    </>
                  )}
                />
              </div>
            )}

            {/* View 4: Chart View (Distribution by Type, Industry, Rating, Revenue) */}
            {layout === 'chart' && (
              <div className="p-3 space-y-3">
                <div className="flex items-center justify-between border-b border-line pb-2">
                  <span className="text-[12.5px] font-medium text-ink-600">
                    Account Analytics ({filteredAccounts.length} filtered accounts)
                  </span>
                  <div className="flex items-center gap-1.5 text-[12px]">
                    {[
                      { key: 'type', label: 'By Account Type' },
                      { key: 'industry', label: 'By Industry' },
                      { key: 'rating', label: 'By Rating' },
                      { key: 'revenue', label: 'Revenue by Type (₹ Cr)' },
                    ].map((d) => (
                      <button
                        key={d.key}
                        type="button"
                        onClick={() => setChartDimension(d.key)}
                        className={`px-2 py-0.5 rounded border ${
                          chartDimension === d.key
                            ? 'border-[#1F6FEB] bg-[#EFF6FF] text-[#1F6FEB] font-semibold'
                            : 'border-line bg-white text-ink-600'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
                <ChartView
                  title={
                    chartDimension === 'industry'
                      ? 'Accounts by Industry'
                      : chartDimension === 'rating'
                      ? 'Accounts by Rating'
                      : chartDimension === 'revenue'
                      ? 'Total Annual Revenue by Account Type (₹ Cr)'
                      : 'Accounts by Type'
                  }
                  data={
                    chartDimension === 'industry'
                      ? INDUSTRIES.slice(0, 8).map((ind, idx) => ({
                          name: ind,
                          value: filteredAccounts.filter((a) => a.industry === ind).length,
                          color: AVATAR_COLORS[idx % AVATAR_COLORS.length],
                        }))
                      : chartDimension === 'rating'
                      ? ACCOUNT_RATINGS.map((rt) => ({
                          name: rt,
                          value: filteredAccounts.filter((a) => a.rating === rt).length,
                          color: RATING_COLORS[rt] || '#2F7BF5',
                        }))
                      : chartDimension === 'revenue'
                      ? ACCOUNT_TYPES.map((t) => ({
                          name: t,
                          value: Math.round(
                            sumBy(
                              filteredAccounts.filter((a) => a.type === t),
                              (a) => Number(a.annualRevenue || 0)
                            ) / 10000000
                          ),
                          color: TYPE_COLORS[t] || '#2F7BF5',
                        }))
                      : ACCOUNT_TYPES.map((t) => ({
                          name: t,
                          value: filteredAccounts.filter((a) => a.type === t).length,
                          color: TYPE_COLORS[t] || '#2F7BF5',
                        }))
                  }
                  valueLabel={chartDimension === 'revenue' ? '₹ Cr' : 'Accounts'}
                />
              </div>
            )}

            {/* Footer: Total Records and Pagination */}
            {(layout === 'list' || layout === 'grid') && (
              <div className="px-4 border-t border-[#E2E8F0] bg-[#FAFBFD] flex flex-wrap items-center justify-between">
                <div className="text-[12.5px] font-medium text-[#475569] py-2" data-testid="accounts-total-count">
                  Total Records: <span className="font-semibold text-[#0F172A]">{filteredAccounts.length}</span>
                </div>
                <div className="flex-1">
                  <Pagination table={table} noun="accounts" variant="records" />
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Create / Edit Account Modal */}
      {accountModal && (
        <AccountFormModal
          modal={accountModal}
          accounts={accounts}
          users={users}
          onClose={() => setAccountModal(null)}
          onSave={(payload, saveAndNew) => {
            if (accountModal.mode === 'create') {
              const created = createRecord('accounts', {
                ...payload,
                color: AVATAR_COLORS[accounts.length % AVATAR_COLORS.length],
              });
              toast.success(`Account "${created.name}" created successfully`);
              table.setPage(1);
              if (saveAndNew) {
                setAccountModal({ mode: 'create', record: makeBlankAccount(), errors: {} });
              } else {
                setAccountModal(null);
              }
            } else {
              updateRecord('accounts', accountModal.record.id, payload);
              toast.success(`Account "${payload.name}" updated`);
              setAccountModal(null);
            }
          }}
        />
      )}

      {/* Territory Map View Modal */}
      {mapModalOpen && (
        <Modal
          title="Accounts Territory Map View"
          onClose={() => setMapModalOpen(false)}
          width={1000}
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-line-soft">
              <div>
                <p className="text-[13px] text-ink-600">
                  Visual geographical distribution of enterprise accounts across Indian territories.
                </p>
                <p className="text-[11.5px] text-ink-400">
                  Click on any city chip or map pin to inspect local territory accounts.
                </p>
              </div>
              <div className="text-[12.5px] font-semibold text-ink bg-page-soft px-3 py-1 rounded-full border border-line">
                Total Mapped: <span className="text-[#1F6FEB] font-bold">{accounts.length}</span> Accounts
              </div>
            </div>

            {/* City territory selector chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto thin-scroll pb-1 text-[12px]">
              {['All', 'Chennai', 'Bangalore', 'Mumbai', 'Hyderabad', 'Delhi', 'Pune', 'Kolkata'].map((city) => {
                const count =
                  city === 'All'
                    ? accounts.length
                    : accounts.filter(
                        (a) =>
                          (a.billingCity || a.city || a.location || a.gstState || '').toLowerCase().includes(city.toLowerCase())
                      ).length;
                const active = selectedMapCity === city;
                return (
                  <button
                    key={city}
                    type="button"
                    onClick={() => setSelectedMapCity(city)}
                    className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      active
                        ? 'bg-[#1F6FEB] text-white shadow-xs'
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

            {/* Map Canvas + Account List split */}
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
                    <pattern id="accountmapgrid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <circle cx="2" cy="2" r="1" fill="#38BDF8" />
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#accountmapgrid)" />
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
                    const count = accounts.filter(
                      (a) =>
                        (a.billingCity || a.city || a.location || a.gstState || '').toLowerCase().includes(pin.city.toLowerCase())
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
                        title={`${pin.city}: ${count} accounts`}
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
                                ? 'bg-[#1F6FEB] border-white ring-2 ring-primary-300'
                                : 'bg-emerald-500 border-white'
                            }`}
                          >
                            <MapPin size={10} className="fill-current" />
                          </div>
                        </div>
                        <div
                          className={`mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold whitespace-nowrap transition-colors ${
                            isSelected
                              ? 'bg-[#1F6FEB] text-white shadow-xs'
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

              {/* Right Column: Filtered Accounts List for this city (7 cols) */}
              <div className="md:col-span-7 flex flex-col h-[340px] border border-line rounded-xl overflow-hidden bg-white">
                <div className="px-3.5 py-2.5 bg-page-soft/60 border-b border-line flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-[#1F6FEB]" />
                    <span className="text-[13px] font-semibold text-ink">
                      {selectedMapCity === 'All' ? 'All Territories' : `${selectedMapCity} Territory`}
                    </span>
                  </div>
                  <span className="text-[11.5px] text-ink-500">
                    {
                      accounts.filter((a) =>
                        selectedMapCity === 'All'
                          ? true
                          : (a.billingCity || a.city || a.location || a.gstState || '').toLowerCase().includes(selectedMapCity.toLowerCase())
                      ).length
                    }{' '}
                    accounts
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto thin-scroll p-3 space-y-2.5">
                  {accounts
                    .filter((a) =>
                      selectedMapCity === 'All'
                        ? true
                        : (a.billingCity || a.city || a.location || a.gstState || '').toLowerCase().includes(selectedMapCity.toLowerCase())
                    )
                    .map((a) => (
                      <div
                        key={a.id}
                        className="p-3 rounded-lg border border-line hover:border-[#1F6FEB]/40 bg-white hover:bg-[#F8FAFC] transition-colors flex items-start justify-between gap-3 shadow-xs"
                      >
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => {
                              setMapModalOpen(false);
                              openAccountDetail(a.id);
                            }}
                            className="text-[13.5px] font-semibold text-[#1F6FEB] hover:underline transition-colors truncate text-left block"
                          >
                            {a.name}
                          </button>
                          <div className="text-[11.5px] text-ink-500 mt-1 flex flex-wrap items-center gap-2">
                            <span>GSTIN: <strong className="font-mono text-ink-700">{a.gstin || a.gstNumber || '—'}</strong></span>
                            <span>•</span>
                            <span>State: <strong className="text-ink-700">{a.gstState || a.billingState || '—'}</strong></span>
                            <span>•</span>
                            <span>Owner: <strong className="text-ink-700">{userName(a.ownerId)}</strong></span>
                          </div>
                          {(a.mobile || a.phone) && (
                            <div className="text-[11px] text-ink-600 mt-1 flex items-center gap-1.5">
                              <span className="h-4 w-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <Phone size={9} />
                              </span>
                              <span>{a.mobile || a.phone}</span>
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setMapModalOpen(false);
                            openAccountDetail(a.id);
                          }}
                          className="h-7 px-2.5 rounded-md border border-line bg-white hover:bg-page text-ink-700 text-[11.5px] font-medium transition-colors whitespace-nowrap"
                        >
                          View Details
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-line-soft">
              <button
                type="button"
                onClick={() => setMapModalOpen(false)}
                className="h-8 px-4 rounded-md bg-[#1F6FEB] text-white text-[12.5px] font-medium hover:bg-[#195BCA] transition"
              >
                Close Map View
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Advanced Filter Condition & Group Builder Modal */}
      {builderOpen && (
        <AccountFilterBuilderModal
          open={builderOpen}
          onClose={() => setBuilderOpen(false)}
          builderRules={builderRules}
          setBuilderRules={setBuilderRules}
          conditionGroups={conditionGroups}
          setConditionGroups={setConditionGroups}
          globalJoin={globalJoin}
          setGlobalJoin={setGlobalJoin}
          users={users}
          accounts={accounts}
          onSaveAsView={() => {
            setBuilderOpen(false);
            setSaveViewModal({ mode: 'create', name: '', shared: true });
          }}
          onReset={clearAllFilters}
        />
      )}

      {/* Save / Rename Custom Filter View Modal */}
      {saveViewModal && (
        <Modal
          open={!!saveViewModal}
          onClose={() => setSaveViewModal(null)}
          size="sm"
          title={saveViewModal.mode === 'rename' ? 'Rename Saved Filter View' : 'Save Custom Account Filter View'}
          footer={
            <>
              <button className="btn-secondary" onClick={() => setSaveViewModal(null)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  const cleanName = String(saveViewModal.name || '').trim();
                  if (!cleanName) {
                    toast.error('Please enter a view name');
                    return;
                  }
                  if (saveViewModal.mode === 'rename') {
                    renameAccountView(saveViewModal.id, cleanName);
                    toast.success(`Renamed view to "${cleanName}"`);
                  } else {
                    const validation = validateAccountFilterConfig({
                      systemFilters: [...sysFilters],
                      fieldFilters: activeFieldFilterList,
                      relatedFilters: activeRelatedFilterList,
                    });
                    if (!validation.valid) {
                      toast.error(validation.errors[0]);
                      return;
                    }
                    const created = saveAccountView({
                      name: cleanName,
                      shared: Boolean(saveViewModal.shared),
                      createdBy: activeUser.id,
                      systemFilters: [...sysFilters],
                      fieldFilters: activeFieldFilterList,
                      relatedFilters: activeRelatedFilterList,
                      builderRules,
                      conditionGroups,
                      globalJoin,
                    });
                    setSavedView(created.id);
                    toast.success(`Saved filter view "${cleanName}"`);
                  }
                  setSaveViewModal(null);
                }}
              >
                Save View
              </button>
            </>
          }
        >
          <div className="space-y-3">
            <div>
              <label className="label">View Name *</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Enterprise Chennai IT Accounts"
                value={saveViewModal.name}
                onChange={(e) => setSaveViewModal((s) => ({ ...s, name: e.target.value }))}
              />
            </div>
            <label className="flex items-center gap-2 text-[13px] text-ink cursor-pointer">
              <input
                type="checkbox"
                className="cb"
                checked={Boolean(saveViewModal.shared)}
                onChange={(e) => setSaveViewModal((s) => ({ ...s, shared: e.target.checked }))}
              />
              <span>Share this filter view with team members</span>
            </label>
          </div>
        </Modal>
      )}

      {/* Convert Lead to Account Modal (with Duplicate Account Prevention) */}
      {leadConvertModal && (
        <ConvertLeadModal
          open={leadConvertModal}
          onClose={() => setLeadConvertModal(false)}
          accounts={accounts}
          users={users}
          onConvert={(payload) => {
            const res = convertLeadToAccount(payload);
            setLeadConvertModal(false);
            setViewingId(res.account.id);
            if (res.reusedExistingAccount) {
              toast.info(
                `Linked converted lead "${res.contact.name}" to existing Account "${res.account.name}" (no duplicate created)`
              );
            } else {
              toast.success(`Converted lead to new Account "${res.account.name}" and Contact "${res.contact.name}"`);
            }
          }}
        />
      )}

      {/* Bulk Update Modal */}
      {bulkMode && (
        <Modal
          open={!!bulkMode}
          onClose={() => setBulkMode(null)}
          size="sm"
          title={`Bulk Update ${selectedIds.length} Account(s)`}
          footer={
            <>
              <button className="btn-secondary" onClick={() => setBulkMode(null)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  const patch =
                    bulkMode === 'owner'
                      ? { ownerId: bulkValue }
                      : bulkMode === 'type'
                      ? { type: bulkValue }
                      : { rating: bulkValue };
                  selectedIds.forEach((id) => updateRecord('accounts', id, patch));
                  toast.success(`Updated ${selectedIds.length} accounts`);
                  setBulkMode(null);
                  table.clearSelection();
                }}
              >
                Apply
              </button>
            </>
          }
        >
          <div>
            <label className="label">
              {bulkMode === 'owner' ? 'New Account Owner' : bulkMode === 'type' ? 'New Account Type' : 'New Rating'}
            </label>
            <select className="input" value={bulkValue} onChange={(e) => setBulkValue(e.target.value)}>
              {bulkMode === 'owner' &&
                users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              {bulkMode === 'type' &&
                ACCOUNT_DROPDOWN_OPTIONS.type.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              {bulkMode === 'rating' &&
                ACCOUNT_RATINGS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
            </select>
          </div>
        </Modal>
      )}

      {/* Permitted Account Owner Details Modal */}
      {ownerDetailUser && (
        <Modal
          open={!!ownerDetailUser}
          onClose={() => setOwnerDetailUser(null)}
          size="sm"
          title="Account Owner Profile"
          footer={
            <>
              <button
                className="btn-secondary"
                onClick={() => {
                  updateFieldConfig('ownerId', { checked: true, operator: 'Is', value: ownerDetailUser.name });
                  setOwnerDetailUser(null);
                }}
              >
                Filter Accounts by {ownerDetailUser.name}
              </button>
              <button className="btn-primary" onClick={() => setOwnerDetailUser(null)}>
                Close
              </button>
            </>
          }
        >
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <UserAvatar userId={ownerDetailUser.id} size={44} />
              <div>
                <div className="text-[15px] font-semibold text-ink">{ownerDetailUser.name}</div>
                <div className="text-[12.5px] text-ink-500">{ownerDetailUser.role}</div>
                <div className="text-[12px] text-[#1F6FEB]">{ownerDetailUser.email}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-line text-center">
              <div className="bg-page rounded p-2">
                <div className="text-[15px] font-semibold text-ink">
                  {accounts.filter((a) => a.ownerId === ownerDetailUser.id).length}
                </div>
                <div className="text-[11px] text-ink-500">Owned Accounts</div>
              </div>
              <div className="bg-page rounded p-2">
                <div className="text-[15px] font-semibold text-ink">
                  {deals.filter((d) => d.ownerId === ownerDetailUser.id).length}
                </div>
                <div className="text-[11px] text-ink-500">Active Deals</div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="Delete Account(s)?"
        message={
          confirm
            ? `Delete ${confirm.label}? Linked contacts, deals, calls, invoices, and child accounts are preserved and safely unlinked.`
            : ''
        }
        onConfirm={() => {
          deleteRecords('accounts', confirm.ids);
          table.clearSelection();
          setViewingId(null);
          toast.success(`Deleted ${confirm.label}`);
        }}
      />

      {/* Compose Email Modal for Account */}
      {composeEmailModal && (
        <Modal
          open={!!composeEmailModal}
          onClose={() => setComposeEmailModal(null)}
          size="md"
          title={`Send Email — ${composeEmailModal.account.name}`}
          footer={
            <>
              <button className="btn-secondary" onClick={() => setComposeEmailModal(null)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  if (!composeEmailModal.subject.trim()) {
                    toast.error('Please enter an email subject');
                    return;
                  }
                  addAccountRelatedRecord('emails', {
                    accountId: composeEmailModal.account.id,
                    subject: composeEmailModal.subject.trim(),
                    to: composeEmailModal.to,
                    direction: 'Sent',
                    status: 'Opened',
                    ownerId: activeUser.id,
                  });
                  updateRecord('accounts', composeEmailModal.account.id, {
                    lastActivityTime: todayISO(),
                    touched: true,
                  });
                  toast.success(`Email sent for ${composeEmailModal.account.name}`);
                  setComposeEmailModal(null);
                }}
              >
                <Send size={14} />
                Send Email
              </button>
            </>
          }
        >
          <div className="space-y-3">
            <div>
              <label className="label">To</label>
              <input
                type="email"
                className="input"
                value={composeEmailModal.to}
                onChange={(e) => setComposeEmailModal((s) => ({ ...s, to: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Subject *</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Q4 Strategic Account Review"
                value={composeEmailModal.subject}
                onChange={(e) => setComposeEmailModal((s) => ({ ...s, subject: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Message</label>
              <textarea
                rows={4}
                className="input py-2 h-auto"
                placeholder="Write your message..."
                value={composeEmailModal.body}
                onChange={(e) => setComposeEmailModal((s) => ({ ...s, body: e.target.value }))}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Complete Account Details Drawer */}
      <Drawer
        open={!!viewingAccount}
        onClose={() => setViewingId(null)}
        width={680}
        title={
          viewingAccount && (
            <div className="flex items-center gap-3">
              <AccountLogo account={viewingAccount} size={42} />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-[16.5px] font-semibold text-ink truncate">{viewingAccount.name}</h2>
                  <span className="text-[11.5px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                    {viewingAccount.accountNumber}
                  </span>
                </div>
                <p className="text-[12.5px] text-ink-500">
                  {viewingAccount.industry} · {viewingAccount.billingCity || viewingAccount.location} ·{' '}
                  {viewingAccount.accountSite}
                </p>
              </div>
            </div>
          )
        }
        footer={
          viewingAccount && (
            <>
              <button
                className="btn-secondary text-danger-700"
                onClick={() => setConfirm({ ids: [viewingAccount.id], label: viewingAccount.name })}
              >
                <Trash2 size={14} />
                Delete
              </button>
              <button
                className="btn-secondary"
                onClick={() =>
                  setComposeEmailModal({
                    account: viewingAccount,
                    to:
                      contacts.find((c) => c.accountId === viewingAccount.id)?.email ||
                      `info@${viewingAccount.website?.replace(/^www\./, '') || 'company.in'}`,
                    subject: `Follow-up with ${viewingAccount.name}`,
                    body: '',
                  })
                }
              >
                <Mail size={14} />
                Send Email
              </button>
              <button
                className="btn-secondary"
                onClick={() => navigate(`/deals?create=1&account=${viewingAccount.id}`)}
              >
                <Plus size={14} />
                New Deal
              </button>
              <button className="btn-primary" onClick={() => openEditAccountModal(viewingAccount)}>
                <Pencil size={14} />
                Edit Account
              </button>
            </>
          )
        }
      >
        {viewingAccount && (
          <AccountDetailsContent
            account={viewingAccount}
            accounts={accounts}
            accountsById={accountsById}
            usersById={usersById}
            filterContext={filterContext}
            calls={calls}
            activity={activity}
            detailTab={detailTab}
            setDetailTab={setDetailTab}
            onSelectAccount={(id) => setViewingId(id)}
            onUpdateAccount={(patch) => updateRecord('accounts', viewingAccount.id, patch)}
            onAddRelatedRecord={(mod, item) => addAccountRelatedRecord(mod, { ...item, accountId: viewingAccount.id })}
            noteInput={noteInput}
            setNoteInput={setNoteInput}
            attachmentInput={attachmentInput}
            setAttachmentInput={setAttachmentInput}
            activeUser={activeUser}
            toast={toast}
          />
        )}
      </Drawer>
    </div>
  );
}

/**
 * Complete Create / Edit Account Modal with all 37 fields, Billing/Shipping Address Copy,
 * Circular Hierarchy Prevention, and Duplicate Detection
 */
function AccountFormModal({ modal, accounts, users, onClose, onSave }) {
  const [form, setForm] = useState(modal.record);
  const [errors, setErrors] = useState({});

  const selectableParents = useMemo(
    () => getSelectableParentAccounts(form.id, accounts),
    [form.id, accounts]
  );

  const setField = (key, val) => {
    setForm((prev) => {
      const next = { ...prev, [key]: val };
      if (key === 'copyBillingToShipping' && val) {
        next.shippingFlat = prev.billingFlat;
        next.shippingStreet = prev.billingStreet;
        next.shippingCity = prev.billingCity;
        next.shippingState = prev.billingState;
        next.shippingZip = prev.billingZip;
        next.shippingCountry = prev.billingCountry;
      } else if (prev.copyBillingToShipping && key.startsWith('billing')) {
        const suffix = key.replace('billing', 'shipping');
        next[suffix] = val;
      }
      return next;
    });
  };

  const validateAndSubmit = (saveAndNew = false) => {
    const errs = {};
    const cleanName = String(form.name || '').trim();
    const cleanNumber = String(form.accountNumber || '').trim();

    if (!cleanName) errs.name = 'Account Name is required.';
    if (
      cleanName &&
      accounts.some((a) => a.id !== form.id && a.name.trim().toLowerCase() === cleanName.toLowerCase())
    ) {
      errs.name = 'Duplicate detected: An account with this Account Name already exists.';
    }
    if (
      cleanNumber &&
      accounts.some(
        (a) =>
          a.id !== form.id &&
          String(a.accountNumber || '').trim().toLowerCase() === cleanNumber.toLowerCase()
      )
    ) {
      errs.accountNumber = 'Duplicate detected: An account with this Account Number already exists.';
    }
    if (form.parentAccountId && !canSetParentAccount(form.id, form.parentAccountId, accounts)) {
      errs.parentAccountId = 'Circular hierarchy detected: Cannot select self or a descendant account as parent.';
    }
    if (form.annualRevenue !== '' && (isNaN(Number(form.annualRevenue)) || Number(form.annualRevenue) < 0)) {
      errs.annualRevenue = 'Annual Revenue must be a valid non-negative number.';
    }
    if (form.employees !== '' && (isNaN(Number(form.employees)) || Number(form.employees) < 0)) {
      errs.employees = 'Employees must be a valid non-negative number.';
    }
    if (!isValidPhone(form.phone)) {
      errs.phone = 'Enter a valid phone number.';
    }
    if (!isValidWebsite(form.website)) {
      errs.website = 'Enter a valid website URL (e.g. www.company.in).';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const tags = String(form.tagsInput || '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const billingAddress = [
      form.billingFlat,
      form.billingStreet,
      form.billingCity,
      form.billingState,
      form.billingZip,
      form.billingCountry,
    ]
      .filter(Boolean)
      .join(', ');

    const shippingAddress = [
      form.shippingFlat,
      form.shippingStreet,
      form.shippingCity,
      form.shippingState,
      form.shippingZip,
      form.shippingCountry,
    ]
      .filter(Boolean)
      .join(', ');

    const now = todayISO();
    onSave(
      {
        ...form,
        name: cleanName,
        accountNumber: cleanNumber || `ACC-${1001 + accounts.length}`,
        location: form.billingCity || form.location || 'Chennai',
        annualRevenue: Number(form.annualRevenue || 0),
        employees: Number(form.employees || 0),
        tags,
        billingAddress,
        shippingAddress,
        createdTime: form.createdTime || form.createdOn || now,
        modifiedTime: now,
        lastActivityTime: now,
        touched: true,
        hasRecordAction: true,
      },
      saveAndNew
    );
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={modal.mode === 'edit' ? `Edit Account — ${modal.record.name}` : 'Create Account'}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          {modal.mode === 'create' && (
            <button
              type="button"
              data-testid="save-and-new-account-btn"
              className="btn-secondary"
              onClick={() => validateAndSubmit(true)}
            >
              Save & New
            </button>
          )}
          <button
            type="button"
            data-testid="save-account-btn"
            className="btn-primary"
            onClick={() => validateAndSubmit(false)}
          >
            Save
          </button>
        </>
      }
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 thin-scroll">
        {/* Account Information */}
        <div>
          <h3 className="text-[13px] font-semibold text-ink mb-2 pb-1 border-b border-line">
            Account Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Account Name *</label>
              <input
                type="text"
                data-testid="account-name-input"
                className="input"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                placeholder="e.g. Pinnacle Enterprise Systems"
              />
              {errors.name && <p className="text-[11.5px] text-danger-600 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="label">Account Number</label>
              <input
                type="text"
                className="input"
                value={form.accountNumber || ''}
                onChange={(e) => setField('accountNumber', e.target.value)}
              />
              {errors.accountNumber && <p className="text-[11.5px] text-danger-600 mt-1">{errors.accountNumber}</p>}
            </div>

            <div>
              <label className="label">Account Site</label>
              <input
                type="text"
                className="input"
                value={form.accountSite || ''}
                onChange={(e) => setField('accountSite', e.target.value)}
                placeholder="e.g. Chennai Global HQ"
              />
            </div>

            <div>
              <label className="label">Parent Account</label>
              <select
                className="input"
                value={form.parentAccountId || ''}
                onChange={(e) => setField('parentAccountId', e.target.value)}
              >
                <option value="">— None (Top-Level Account) —</option>
                {selectableParents.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.billingCity || p.location})
                  </option>
                ))}
              </select>
              {errors.parentAccountId && (
                <p className="text-[11.5px] text-danger-600 mt-1">{errors.parentAccountId}</p>
              )}
            </div>

            <div>
              <label className="label">Account Type</label>
              <select className="input" value={form.type} onChange={(e) => setField('type', e.target.value)}>
                {ACCOUNT_DROPDOWN_OPTIONS.type.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Industry</label>
              <select className="input" value={form.industry} onChange={(e) => setField('industry', e.target.value)}>
                {ACCOUNT_DROPDOWN_OPTIONS.industry.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Ownership</label>
              <select
                className="input"
                value={form.ownership || 'Private'}
                onChange={(e) => setField('ownership', e.target.value)}
              >
                {ACCOUNT_OWNERSHIPS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Rating</label>
              <select
                className="input"
                value={form.rating || 'Hot'}
                onChange={(e) => setField('rating', e.target.value)}
              >
                {ACCOUNT_RATINGS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Annual Revenue (₹)</label>
              <input
                type="number"
                className="input"
                value={form.annualRevenue}
                onChange={(e) => setField('annualRevenue', e.target.value)}
              />
              {errors.annualRevenue && <p className="text-[11.5px] text-danger-600 mt-1">{errors.annualRevenue}</p>}
            </div>

            <div>
              <label className="label">Employees</label>
              <input
                type="number"
                className="input"
                value={form.employees || ''}
                onChange={(e) => setField('employees', e.target.value)}
              />
              {errors.employees && <p className="text-[11.5px] text-danger-600 mt-1">{errors.employees}</p>}
            </div>

            <div>
              <label className="label">Phone</label>
              <input
                type="tel"
                className="input"
                value={form.phone || ''}
                onChange={(e) => setField('phone', e.target.value)}
              />
              {errors.phone && <p className="text-[11.5px] text-danger-600 mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="label">Fax</label>
              <input
                type="text"
                className="input"
                value={form.fax || ''}
                onChange={(e) => setField('fax', e.target.value)}
              />
            </div>

            <div>
              <label className="label">Website</label>
              <input
                type="text"
                className="input"
                placeholder="www.example.in"
                value={form.website || ''}
                onChange={(e) => setField('website', e.target.value)}
              />
              {errors.website && <p className="text-[11.5px] text-danger-600 mt-1">{errors.website}</p>}
            </div>

            <div>
              <label className="label">Account Owner</label>
              <select className="input" value={form.ownerId} onChange={(e) => setField('ownerId', e.target.value)}>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">SIC Code</label>
              <input
                type="text"
                className="input"
                value={form.sicCode || ''}
                onChange={(e) => setField('sicCode', e.target.value)}
              />
            </div>

            <div>
              <label className="label">Ticker Symbol</label>
              <input
                type="text"
                className="input"
                value={form.tickerSymbol || ''}
                onChange={(e) => setField('tickerSymbol', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Address Information: Billing & Shipping */}
        <div>
          <div className="flex items-center justify-between mb-2 pb-1 border-b border-line">
            <h3 className="text-[13px] font-semibold text-ink">Billing & Shipping Address</h3>
            <label className="flex items-center gap-2 text-[12px] font-medium text-[#1F6FEB] cursor-pointer">
              <input
                type="checkbox"
                className="cb"
                checked={Boolean(form.copyBillingToShipping)}
                onChange={(e) => setField('copyBillingToShipping', e.target.checked)}
                data-testid="copy-billing-to-shipping"
              />
              <span>Copy Billing Address to Shipping Address</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Billing Address */}
            <div className="space-y-2 p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="text-[12px] font-semibold text-ink">Billing Address</div>
              <input
                type="text"
                className="input h-8 text-[12.5px]"
                placeholder="Flat / House No. / Building / Apartment"
                value={form.billingFlat || ''}
                onChange={(e) => setField('billingFlat', e.target.value)}
              />
              <input
                type="text"
                className="input h-8 text-[12.5px]"
                placeholder="Street Address"
                value={form.billingStreet || ''}
                onChange={(e) => setField('billingStreet', e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  className="input h-8 text-[12.5px]"
                  placeholder="City"
                  value={form.billingCity || ''}
                  onChange={(e) => setField('billingCity', e.target.value)}
                />
                <input
                  type="text"
                  className="input h-8 text-[12.5px]"
                  placeholder="State / Province"
                  value={form.billingState || ''}
                  onChange={(e) => setField('billingState', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  className="input h-8 text-[12.5px]"
                  placeholder="Zip / Postal Code"
                  value={form.billingZip || ''}
                  onChange={(e) => setField('billingZip', e.target.value)}
                />
                <input
                  type="text"
                  className="input h-8 text-[12.5px]"
                  placeholder="Country / Region"
                  value={form.billingCountry || ''}
                  onChange={(e) => setField('billingCountry', e.target.value)}
                />
              </div>
            </div>

            {/* Shipping Address */}
            <div className="space-y-2 p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="text-[12px] font-semibold text-ink">Shipping Address</div>
              <input
                type="text"
                className="input h-8 text-[12.5px]"
                placeholder="Flat / House No. / Building / Apartment"
                value={form.shippingFlat || ''}
                onChange={(e) => setField('shippingFlat', e.target.value)}
              />
              <input
                type="text"
                className="input h-8 text-[12.5px]"
                placeholder="Street Address"
                value={form.shippingStreet || ''}
                onChange={(e) => setField('shippingStreet', e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  className="input h-8 text-[12.5px]"
                  placeholder="City"
                  value={form.shippingCity || ''}
                  onChange={(e) => setField('shippingCity', e.target.value)}
                />
                <input
                  type="text"
                  className="input h-8 text-[12.5px]"
                  placeholder="State / Province"
                  value={form.shippingState || ''}
                  onChange={(e) => setField('shippingState', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  className="input h-8 text-[12.5px]"
                  placeholder="Zip / Postal Code"
                  value={form.shippingZip || ''}
                  onChange={(e) => setField('shippingZip', e.target.value)}
                />
                <input
                  type="text"
                  className="input h-8 text-[12.5px]"
                  placeholder="Country / Region"
                  value={form.shippingCountry || ''}
                  onChange={(e) => setField('shippingCountry', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tags & Description */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Tags (comma-separated)</label>
            <input
              type="text"
              className="input"
              value={form.tagsInput || ''}
              onChange={(e) => setField('tagsInput', e.target.value)}
              placeholder="Enterprise, Strategic, Cloud First"
            />
          </div>
          <div>
            <label className="label">Account Status</label>
            <select
              className="input"
              value={form.status || 'Active'}
              onChange={(e) => setField('status', e.target.value)}
            >
              {ACCOUNT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Description</label>
            <textarea
              rows={2}
              className="input py-2 h-auto"
              value={form.description || ''}
              onChange={(e) => setField('description', e.target.value)}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Advanced Condition & Group Filter Builder Modal
 */
function AccountFilterBuilderModal({
  open,
  onClose,
  builderRules,
  setBuilderRules,
  conditionGroups,
  setConditionGroups,
  globalJoin,
  setGlobalJoin,
  onSaveAsView,
  onReset,
}) {
  const addRule = () => {
    setBuilderRules((prev) => [
      ...prev,
      {
        id: `brule-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 4)}`,
        category: 'field',
        field: 'type',
        operator: 'Is',
        value: 'Customer',
        enabled: true,
      },
    ]);
  };

  const addGroup = () => {
    setConditionGroups((prev) => [
      ...prev,
      {
        id: `grp-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 4)}`,
        logic: 'OR',
        enabled: true,
        conditions: [
          { field: 'type', operator: 'Is', value: 'Customer', type: 'dropdown', enabled: true },
          { field: 'type', operator: 'Is', value: 'Partner', type: 'dropdown', enabled: true },
        ],
      },
    ]);
  };

  const applyExampleGroupPreset = () => {
    setGlobalJoin('AND');
    setConditionGroups([
      {
        id: 'grp-preset-1',
        logic: 'OR',
        enabled: true,
        conditions: [
          { field: 'type', operator: 'Is', value: 'Customer', type: 'dropdown', enabled: true },
          { field: 'type', operator: 'Is', value: 'Partner', type: 'dropdown', enabled: true },
        ],
      },
      {
        id: 'grp-preset-2',
        logic: 'AND',
        enabled: true,
        conditions: [
          { field: 'industry', operator: 'Is', value: 'Technology', type: 'dropdown', enabled: true },
          { field: 'annualRevenue', operator: 'Greater than', value: '2500000', type: 'number', enabled: true },
        ],
      },
    ]);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Advanced Account Filter Builder (AND / OR Groups)"
      footer={
        <>
          <button
            type="button"
            className="btn-secondary text-danger-600"
            onClick={() => {
              onReset();
              onClose();
            }}
          >
            Clear All
          </button>
          <button type="button" className="btn-secondary" onClick={onSaveAsView}>
            <BookmarkPlus size={14} />
            Save as View
          </button>
          <button type="button" className="btn-primary" onClick={onClose}>
            Apply Filters
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
          <div className="flex items-center gap-2 text-[12.5px]">
            <span className="font-semibold text-ink">Top-Level Combine Logic:</span>
            {['AND', 'OR'].map((op) => (
              <button
                key={op}
                type="button"
                onClick={() => setGlobalJoin(op)}
                className={`px-2.5 py-1 rounded text-[12px] font-semibold ${
                  globalJoin === op ? 'bg-[#1F6FEB] text-white' : 'bg-white border border-line text-ink'
                }`}
              >
                {op}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="btn-secondary h-8 text-[12px]" onClick={addRule}>
              <Plus size={13} /> Add Condition
            </button>
            <button type="button" className="btn-secondary h-8 text-[12px]" onClick={addGroup}>
              <Plus size={13} /> Add (AND/OR) Group
            </button>
            <button
              type="button"
              className="btn-secondary h-8 text-[12px] text-[#1F6FEB]"
              onClick={applyExampleGroupPreset}
            >
              Load Tech Customer/Partner &gt; ₹25L Preset
            </button>
          </div>
        </div>

        {/* Individual Conditions */}
        {builderRules.length > 0 && (
          <div className="space-y-2">
            <div className="text-[12px] font-semibold text-ink-600">Conditions</div>
            {builderRules.map((rule, idx) => {
              const meta = ACCOUNT_FIELD_FILTERS.find((f) => f.key === rule.field) || ACCOUNT_FIELD_FILTERS[0];
              const ops = ACCOUNT_OPERATORS_BY_TYPE[meta.type] || ACCOUNT_OPERATORS_BY_TYPE.text;
              return (
                <div key={rule.id || idx} className="grid grid-cols-12 gap-2 items-center bg-page p-2 rounded border border-line">
                  <select
                    className="col-span-4 h-8 px-2 text-[12.5px] border border-line rounded bg-white"
                    value={rule.field}
                    onChange={(e) => {
                      const nextMeta = ACCOUNT_FIELD_FILTERS.find((f) => f.key === e.target.value);
                      const nextOps = ACCOUNT_OPERATORS_BY_TYPE[nextMeta?.type] || ACCOUNT_OPERATORS_BY_TYPE.text;
                      setBuilderRules((prev) =>
                        prev.map((r, i) =>
                          i === idx ? { ...r, field: e.target.value, type: nextMeta?.type, operator: nextOps[0], value: '' } : r
                        )
                      );
                    }}
                  >
                    {ACCOUNT_FIELD_FILTERS.map((f) => (
                      <option key={f.key} value={f.key}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                  <select
                    className="col-span-3 h-8 px-2 text-[12.5px] border border-line rounded bg-white"
                    value={rule.operator}
                    onChange={(e) =>
                      setBuilderRules((prev) => prev.map((r, i) => (i === idx ? { ...r, operator: e.target.value } : r)))
                    }
                  >
                    {ops.map((op) => (
                      <option key={op} value={op}>
                        {op}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    className="col-span-4 h-8 px-2 text-[12.5px] border border-line rounded bg-white"
                    placeholder="Value..."
                    value={rule.value || ''}
                    onChange={(e) =>
                      setBuilderRules((prev) => prev.map((r, i) => (i === idx ? { ...r, value: e.target.value } : r)))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setBuilderRules((prev) => prev.filter((_, i) => i !== idx))}
                    className="col-span-1 flex justify-center text-ink-400 hover:text-danger-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Condition Groups */}
        {conditionGroups.length > 0 && (
          <div className="space-y-3">
            <div className="text-[12px] font-semibold text-ink-600">Grouped Conditions</div>
            {conditionGroups.map((grp, gIdx) => (
              <div key={grp.id || gIdx} className="p-3 rounded-lg border border-indigo-200 bg-indigo-50/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[12px] font-semibold text-indigo-950">
                    <span>Group #{gIdx + 1} Internal Logic:</span>
                    {['AND', 'OR'].map((op) => (
                      <button
                        key={op}
                        type="button"
                        onClick={() =>
                          setConditionGroups((prev) =>
                            prev.map((g, i) => (i === gIdx ? { ...g, logic: op } : g))
                          )
                        }
                        className={`px-2 py-0.5 rounded text-[11.5px] ${
                          grp.logic === op ? 'bg-indigo-600 text-white' : 'bg-white border border-indigo-200 text-indigo-900'
                        }`}
                      >
                        {op}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="text-[11.5px] text-indigo-700 hover:underline"
                      onClick={() =>
                        setConditionGroups((prev) =>
                          prev.map((g, i) =>
                            i === gIdx
                              ? {
                                  ...g,
                                  conditions: [
                                    ...(g.conditions || []),
                                    { field: 'industry', operator: 'Is', value: 'Technology', type: 'dropdown', enabled: true },
                                  ],
                                }
                              : g
                          )
                        )
                      }
                    >
                      + Add Rule to Group
                    </button>
                    <button
                      type="button"
                      className="text-ink-400 hover:text-danger-600"
                      onClick={() => setConditionGroups((prev) => prev.filter((_, i) => i !== gIdx))}
                    >
                      <Trash2 size={13.5} />
                    </button>
                  </div>
                </div>

                {(grp.conditions || []).map((cond, cIdx) => {
                  const meta = ACCOUNT_FIELD_FILTERS.find((f) => f.key === cond.field) || ACCOUNT_FIELD_FILTERS[0];
                  const ops = ACCOUNT_OPERATORS_BY_TYPE[meta.type] || ACCOUNT_OPERATORS_BY_TYPE.text;
                  return (
                    <div key={cIdx} className="grid grid-cols-12 gap-2 items-center">
                      <select
                        className="col-span-4 h-7 px-2 text-[12px] border border-line rounded bg-white"
                        value={cond.field}
                        onChange={(e) => {
                          const nextMeta = ACCOUNT_FIELD_FILTERS.find((f) => f.key === e.target.value);
                          setConditionGroups((prev) =>
                            prev.map((g, i) =>
                              i === gIdx
                                ? {
                                    ...g,
                                    conditions: g.conditions.map((c, j) =>
                                      j === cIdx ? { ...c, field: e.target.value, type: nextMeta?.type } : c
                                    ),
                                  }
                                : g
                            )
                          );
                        }}
                      >
                        {ACCOUNT_FIELD_FILTERS.map((f) => (
                          <option key={f.key} value={f.key}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                      <select
                        className="col-span-3 h-7 px-2 text-[12px] border border-line rounded bg-white"
                        value={cond.operator}
                        onChange={(e) =>
                          setConditionGroups((prev) =>
                            prev.map((g, i) =>
                              i === gIdx
                                ? {
                                    ...g,
                                    conditions: g.conditions.map((c, j) =>
                                      j === cIdx ? { ...c, operator: e.target.value } : c
                                    ),
                                  }
                                : g
                            )
                          )
                        }
                      >
                        {ops.map((op) => (
                          <option key={op} value={op}>
                            {op}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        className="col-span-4 h-7 px-2 text-[12px] border border-line rounded bg-white"
                        value={cond.value || ''}
                        onChange={(e) =>
                          setConditionGroups((prev) =>
                            prev.map((g, i) =>
                              i === gIdx
                                ? {
                                    ...g,
                                    conditions: g.conditions.map((c, j) =>
                                      j === cIdx ? { ...c, value: e.target.value } : c
                                    ),
                                  }
                                : g
                            )
                          )
                        }
                      />
                      <button
                        type="button"
                        className="col-span-1 flex justify-center text-ink-400 hover:text-danger-600"
                        onClick={() =>
                          setConditionGroups((prev) =>
                            prev.map((g, i) =>
                              i === gIdx ? { ...g, conditions: g.conditions.filter((_, j) => j !== cIdx) } : g
                            )
                          )
                        }
                      >
                        <X size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

/**
 * Convert Lead to Account Modal (Reuses existing Account ID if company name matches)
 */
function ConvertLeadModal({ open, onClose, accounts, users, onConvert }) {
  const [companyName, setCompanyName] = useState('ABC Pvt Ltd');
  const [contactName, setContactName] = useState('Nandini Krishnan');
  const [email, setEmail] = useState('nandini.k@abcpvt.in');
  const [phone, setPhone] = useState('+91 98400 77889');
  const [leadSource, setLeadSource] = useState('Website');
  const [industry, setIndustry] = useState('Information Technology');
  const [city, setCity] = useState('Chennai');
  const [dealName, setDealName] = useState('AI Analytics Expansion');
  const [dealAmount, setDealAmount] = useState('1500000');
  const [ownerId, setOwnerId] = useState('u1');

  const matchingAccount = useMemo(
    () => accounts.find((a) => a.name.trim().toLowerCase() === companyName.trim().toLowerCase()),
    [accounts, companyName]
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title="Convert Lead to Account, Contact & Deal"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={() =>
              onConvert({
                companyName,
                contactName,
                email,
                phone,
                leadSource,
                industry,
                city,
                dealName,
                dealAmount,
                ownerId,
              })
            }
          >
            Convert Lead
          </button>
        </>
      }
    >
      <div className="space-y-3">
        {matchingAccount ? (
          <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-[12px] text-blue-900">
            <strong>Duplicate Prevention Active:</strong> Company &ldquo;{matchingAccount.name}&rdquo; already exists (
            {matchingAccount.accountNumber}). Conversion will associate the new Contact and Deal with this existing
            Account instead of creating a duplicate Account.
          </div>
        ) : (
          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[12px] text-emerald-900">
            New Account &ldquo;{companyName}&rdquo; will be created and linked to the converted Contact and Deal.
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Company / Account Name *</label>
            <input
              type="text"
              className="input"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Lead Contact Name *</label>
            <input
              type="text"
              className="input"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input type="text" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <label className="label">Lead Source</label>
            <select className="input" value={leadSource} onChange={(e) => setLeadSource(e.target.value)}>
              {LEAD_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Owner</label>
            <select className="input" value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Optional Deal Name</label>
            <input type="text" className="input" value={dealName} onChange={(e) => setDealName(e.target.value)} />
          </div>
          <div>
            <label className="label">Deal Amount (₹)</label>
            <input
              type="number"
              className="input"
              value={dealAmount}
              onChange={(e) => setDealAmount(e.target.value)}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Complete Account Details Content inside the Drawer
 */
function AccountDetailsContent({
  account,
  accounts,
  accountsById,
  usersById,
  filterContext,
  calls,
  activity,
  detailTab,
  setDetailTab,
  onSelectAccount,
  onUpdateAccount,
  onAddRelatedRecord,
  noteInput,
  setNoteInput,
  attachmentInput,
  setAttachmentInput,
  activeUser,
  toast,
}) {
  const relContacts = useMemo(() => getRelatedRecordsForAccount(account, 'contacts', filterContext), [account, filterContext]);
  const relDeals = useMemo(() => getRelatedRecordsForAccount(account, 'deals', filterContext), [account, filterContext]);
  const relProjects = useMemo(() => getRelatedRecordsForAccount(account, 'projects', filterContext), [account, filterContext]);
  const relQuotes = useMemo(() => getRelatedRecordsForAccount(account, 'quotes', filterContext), [account, filterContext]);
  const relSalesOrders = useMemo(() => getRelatedRecordsForAccount(account, 'salesOrders', filterContext), [account, filterContext]);
  const relInvoices = useMemo(() => getRelatedRecordsForAccount(account, 'invoices', filterContext), [account, filterContext]);
  const relProducts = useMemo(() => getRelatedRecordsForAccount(account, 'accountProducts', filterContext), [account, filterContext]);
  const relCases = useMemo(() => getRelatedRecordsForAccount(account, 'cases', filterContext), [account, filterContext]);
  const relEmails = useMemo(() => getRelatedRecordsForAccount(account, 'emails', filterContext), [account, filterContext]);
  const relConvertedLeads = useMemo(() => getRelatedRecordsForAccount(account, 'convertedLeads', filterContext), [account, filterContext]);
  const relNotes = useMemo(
    () => (filterContext.accountRelations?.notes || []).filter((n) => n.accountId === account.id),
    [account.id, filterContext.accountRelations]
  );
  const relAttachments = useMemo(
    () => (filterContext.accountRelations?.attachments || []).filter((at) => at.accountId === account.id),
    [account.id, filterContext.accountRelations]
  );
  const relCalls = useMemo(() => calls.filter((c) => c.accountId === account.id), [calls, account.id]);

  const hierarchy = useMemo(() => getAccountHierarchyTree(account, accounts), [account, accounts]);
  const selectableParents = useMemo(() => getSelectableParentAccounts(account.id, accounts), [account.id, accounts]);

  return (
    <div className="space-y-4">
      {/* Status & Quick KPI Strip */}
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge kind="accountType" value={account.type} />
        <StatusBadge kind="accountStatus" value={account.status} />
        <span className="px-2 py-0.5 rounded text-[11.5px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
          Rating: {account.rating || 'Hot'}
        </span>
        <span className="px-2 py-0.5 rounded text-[11.5px] font-medium bg-slate-100 text-slate-700">
          Ownership: {account.ownership || 'Private'}
        </span>
        {(account.tags || []).map((tg) => (
          <span
            key={tg}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-blue-50 text-blue-700 border border-blue-200"
          >
            <Tag size={10} />
            {tg}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          ['Annual Revenue', fmtCompact(account.annualRevenue)],
          ['Contacts', relContacts.length],
          ['Open Pipeline', fmtCompact(sumBy(relDeals.filter(isOpen), (d) => d.amount))],
          ['Invoices Balance', fmtCompact(sumBy(relInvoices, balanceOf))],
        ].map(([label, val]) => (
          <div key={label} className="bg-page rounded-lg px-3 py-2 border border-line-soft">
            <div className="text-[15px] font-semibold text-ink">{val}</div>
            <div className="text-[11px] text-ink-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Section Navigation Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-line pb-1">
        {[
          { key: 'overview', label: 'Overview & Addresses' },
          { key: 'hierarchy', label: `Hierarchy (${hierarchy.ancestors.length + hierarchy.children.length + hierarchy.subAccounts.length})` },
          { key: 'related', label: `Related Modules (${relContacts.length + relDeals.length + relInvoices.length})` },
          { key: 'communications', label: `Emails, Notes & Files (${relEmails.length + relNotes.length + relAttachments.length})` },
          { key: 'timeline', label: 'Activity Timeline' },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setDetailTab(t.key)}
            className={`px-2.5 py-1.5 rounded-t text-[12px] font-medium transition ${
              detailTab === t.key
                ? 'bg-[#EFF6FF] text-[#1F6FEB] border-b-2 border-[#1F6FEB]'
                : 'text-ink-600 hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Account Overview, Business Info, Contact Info, Billing & Shipping Address */}
      {detailTab === 'overview' && (
        <div className="space-y-4">
          <SectionTitle>Account Overview & Business Information</SectionTitle>
          <DetailGrid
            items={[
              ['Account Name', account.name],
              ['Account Number', account.accountNumber],
              ['Account Site', account.accountSite || '—'],
              ['Account Owner', <UserAvatar key="o" userId={account.ownerId} size={22} withName />],
              ['Parent Account', accountsById[account.parentAccountId]?.name || 'None (Top-Level)'],
              ['Account Type', account.type],
              ['Industry', account.industry],
              ['Ownership', account.ownership || 'Private'],
              ['Rating', account.rating || 'Hot'],
              ['Annual Revenue', fmtINR(account.annualRevenue)],
              ['Employees', account.employees ? Number(account.employees).toLocaleString('en-IN') : '—'],
              ['SIC Code', account.sicCode || '—'],
              ['Ticker Symbol', account.tickerSymbol || '—'],
              ['Cadence', account.cadenceName || 'Not Enrolled'],
            ]}
          />

          <SectionTitle>Contact Information</SectionTitle>
          <DetailGrid
            items={[
              [
                'Phone',
                account.phone ? (
                  <a href={`tel:${account.phone}`} className="link">
                    {account.phone}
                  </a>
                ) : (
                  '—'
                ),
              ],
              ['Fax', account.fax || '—'],
              [
                'Website',
                account.website ? (
                  <a
                    href={normalizeWebsiteUrl(account.website)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link inline-flex items-center gap-1"
                  >
                    {account.website} <ExternalLink size={12} />
                  </a>
                ) : (
                  '—'
                ),
              ],
              ['Created By', usersById[account.createdBy]?.name || 'Arun Kumar'],
              ['Created Time', fmtDate(account.createdTime || account.createdOn)],
              ['Modified Time', fmtDate(account.modifiedTime || account.createdOn)],
              ['Last Activity Time', fmtDate(account.lastActivityTime || account.createdOn)],
            ]}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border border-line bg-[#F8FAFC]">
              <div className="text-[12.5px] font-semibold text-ink mb-1">Billing Address</div>
              <div className="text-[12.5px] text-ink-600 space-y-0.5">
                {account.billingFlat && <div>{account.billingFlat}</div>}
                {account.billingStreet && <div>{account.billingStreet}</div>}
                <div>
                  {[account.billingCity || account.location, account.billingState, account.billingZip]
                    .filter(Boolean)
                    .join(', ')}
                </div>
                <div>{account.billingCountry || 'India'}</div>
              </div>
            </div>
            <div className="p-3 rounded-lg border border-line bg-[#F8FAFC]">
              <div className="text-[12.5px] font-semibold text-ink mb-1">Shipping Address</div>
              <div className="text-[12.5px] text-ink-600 space-y-0.5">
                {account.shippingFlat && <div>{account.shippingFlat}</div>}
                {account.shippingStreet && <div>{account.shippingStreet}</div>}
                <div>
                  {[account.shippingCity || account.location, account.shippingState, account.shippingZip]
                    .filter(Boolean)
                    .join(', ')}
                </div>
                <div>{account.shippingCountry || 'India'}</div>
              </div>
            </div>
          </div>

          {account.description && (
            <div className="p-3 rounded-lg border border-line bg-white">
              <div className="text-[12px] font-semibold text-ink mb-1">Description</div>
              <p className="text-[12.5px] text-ink-600">{account.description}</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Account Hierarchy (Parent -> Current -> Child Accounts -> Sub Accounts) */}
      {detailTab === 'hierarchy' && (
        <div className="space-y-4">
          <div className="p-3 rounded-lg border border-line bg-[#F8FAFC] space-y-2">
            <label className="text-[12px] font-semibold text-ink block">
              Assign / Update Parent Account (Circular Hierarchy Protected)
            </label>
            <select
              className="input h-8 text-[12.5px]"
              value={account.parentAccountId || ''}
              onChange={(e) => {
                const candidateId = e.target.value;
                if (!canSetParentAccount(account.id, candidateId, accounts)) {
                  toast.error('Cannot assign a descendant account as Parent Account.');
                  return;
                }
                onUpdateAccount({ parentAccountId: candidateId });
                toast.success('Updated account hierarchy');
              }}
            >
              <option value="">— None (Top-Level Parent Account) —</option>
              {selectableParents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.accountNumber})
                </option>
              ))}
            </select>
          </div>

          <SectionTitle>Hierarchy Tree (Parent → Member Accounts → Sub Accounts)</SectionTitle>
          <div className="space-y-2 border border-line rounded-lg p-3 bg-white">
            {/* Ancestors */}
            {hierarchy.ancestors.map((anc, idx) => (
              <div
                key={anc.id}
                style={{ marginLeft: `${idx * 16}px` }}
                className="flex items-center justify-between p-2 rounded border border-slate-200 bg-slate-50 text-[12.5px]"
              >
                <div className="flex items-center gap-2">
                  <GitBranch size={13} className="text-slate-500" />
                  <span className="text-[11px] uppercase font-semibold text-slate-500">Parent:</span>
                  <button
                    type="button"
                    onClick={() => onSelectAccount(anc.id)}
                    className="font-medium text-[#1F6FEB] hover:underline"
                  >
                    {anc.name}
                  </button>
                </div>
                <span className="text-[11.5px] text-ink-500">{fmtCompact(anc.annualRevenue)}</span>
              </div>
            ))}

            {/* Current Account */}
            <div
              style={{ marginLeft: `${hierarchy.ancestors.length * 16}px` }}
              className="flex items-center justify-between p-2.5 rounded border-2 border-[#1F6FEB] bg-[#EFF6FF] text-[13px]"
            >
              <div className="flex items-center gap-2">
                <Building2 size={15} className="text-[#1F6FEB]" />
                <span className="font-semibold text-ink">{account.name} (Current)</span>
              </div>
              <span className="text-[12px] font-medium text-[#1F6FEB]">{fmtINR(account.annualRevenue)}</span>
            </div>

            {/* Child / Member Accounts */}
            {hierarchy.children.length === 0 ? (
              <div className="text-[12px] text-ink-400 pl-6 pt-1">No child / member accounts linked.</div>
            ) : (
              hierarchy.children.map((child) => {
                const grandChildren = hierarchy.subAccounts.filter((sa) => sa.parentAccountId === child.id);
                return (
                  <div
                    key={child.id}
                    style={{ marginLeft: `${(hierarchy.ancestors.length + 1) * 16}px` }}
                    className="space-y-1.5"
                  >
                    <div className="flex items-center justify-between p-2 rounded border border-emerald-200 bg-emerald-50/40 text-[12.5px]">
                      <div className="flex items-center gap-2">
                        <GitBranch size={13} className="text-emerald-600" />
                        <span className="text-[11px] uppercase font-semibold text-emerald-700">Child:</span>
                        <button
                          type="button"
                          onClick={() => onSelectAccount(child.id)}
                          className="font-medium text-[#1F6FEB] hover:underline"
                        >
                          {child.name}
                        </button>
                      </div>
                      <span className="text-[11.5px] text-ink-500">{fmtCompact(child.annualRevenue)}</span>
                    </div>

                    {grandChildren.map((sub) => (
                      <div
                        key={sub.id}
                        className="ml-6 flex items-center justify-between p-2 rounded border border-purple-200 bg-purple-50/40 text-[12px]"
                      >
                        <div className="flex items-center gap-2">
                          <GitBranch size={12} className="text-purple-600" />
                          <span className="text-[10.5px] uppercase font-semibold text-purple-700">Sub-Account:</span>
                          <button
                            type="button"
                            onClick={() => onSelectAccount(sub.id)}
                            className="font-medium text-[#1F6FEB] hover:underline"
                          >
                            {sub.name}
                          </button>
                        </div>
                        <span className="text-[11px] text-ink-500">{fmtCompact(sub.annualRevenue)}</span>
                      </div>
                    ))}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 3: All Related Modules (Contacts, Deals, Projects, Quotes, Sales Orders, Invoices, Products, Cases, Converted Leads) */}
      {detailTab === 'related' && (
        <div className="space-y-4">
          {/* Related Contacts */}
          <SectionTitle
            extra={
              <Link
                to={`/contacts?create=1&account=${account.id}`}
                className="text-[12px] link inline-flex items-center gap-1"
              >
                <UserPlus size={13} /> Add Contact
              </Link>
            }
          >
            Related Contacts ({relContacts.length})
          </SectionTitle>
          {relContacts.length === 0 ? (
            <p className="text-[12.5px] text-ink-500">No contacts linked yet.</p>
          ) : (
            <ul className="divide-y divide-line-soft border border-line rounded-lg max-h-[180px] overflow-y-auto">
              {relContacts.map((c) => (
                <li key={c.id} className="flex items-center justify-between px-3 py-2 text-[12.5px]">
                  <Link className="link font-medium" to={`/contacts?open=${c.id}`}>
                    {c.name}
                  </Link>
                  <span className="text-ink-500 truncate ml-3">
                    {c.designation} · {c.email}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {/* Related Deals */}
          <SectionTitle
            extra={
              <Link
                to={`/deals?create=1&account=${account.id}`}
                className="text-[12px] link inline-flex items-center gap-1"
              >
                <Plus size={13} /> New Deal
              </Link>
            }
          >
            Related Deals ({relDeals.length})
          </SectionTitle>
          {relDeals.length === 0 ? (
            <p className="text-[12.5px] text-ink-500">No deals linked yet.</p>
          ) : (
            <ul className="divide-y divide-line-soft border border-line rounded-lg max-h-[180px] overflow-y-auto">
              {relDeals.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 px-3 py-2 text-[12.5px]">
                  <Link className="link truncate font-medium" to={`/deals?open=${d.id}`}>
                    {d.name}
                  </Link>
                  <span className="flex items-center gap-2 shrink-0">
                    {fmtINR(d.amount)}
                    <StatusBadge kind="stage" value={d.stage} size="sm" />
                  </span>
                </li>
              ))}
            </ul>
          )}

          {/* Related Projects (Retains Account Relationship from Closed Won Deals) */}
          <SectionTitle
            extra={
              <button
                type="button"
                onClick={() => {
                  onAddRelatedRecord('projects', {
                    name: `${account.name} — Expansion Rollout`,
                    status: 'Active',
                    budget: 1200000,
                    ownerId: account.ownerId,
                  });
                  toast.success('Added related project');
                }}
                className="text-[12px] link"
              >
                + Add Project
              </button>
            }
          >
            Related Projects ({relProjects.length})
          </SectionTitle>
          {relProjects.length === 0 ? (
            <p className="text-[12.5px] text-ink-500">No delivery projects linked yet.</p>
          ) : (
            <ul className="divide-y divide-line-soft border border-line rounded-lg">
              {relProjects.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-3 py-2 text-[12.5px]">
                  <span className="font-medium text-ink">{p.name}</span>
                  <span className="text-ink-500">
                    {fmtINR(p.budget || 0)} · {p.status}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {/* Quotes & Sales Orders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <SectionTitle
                extra={
                  <button
                    type="button"
                    onClick={() => {
                      onAddRelatedRecord('quotes', {
                        quoteNumber: `QT-2026-${Math.floor(400 + Math.random() * 500)}`,
                        subject: `${account.name} Commercial Quote`,
                        amount: 950000,
                        status: 'Sent',
                        ownerId: account.ownerId,
                      });
                      toast.success('Created quote');
                    }}
                    className="text-[11.5px] link"
                  >
                    + Quote
                  </button>
                }
              >
                Quotes ({relQuotes.length})
              </SectionTitle>
              {relQuotes.length === 0 ? (
                <p className="text-[12px] text-ink-400">No quotes.</p>
              ) : (
                <ul className="divide-y divide-line-soft border border-line rounded-lg text-[12px]">
                  {relQuotes.map((q) => (
                    <li key={q.id} className="px-2.5 py-1.5 flex justify-between">
                      <span className="truncate font-medium">{q.quoteNumber || q.subject}</span>
                      <span className="text-ink-500">{q.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <SectionTitle
                extra={
                  <button
                    type="button"
                    onClick={() => {
                      onAddRelatedRecord('salesOrders', {
                        soNumber: `SO-2026-${Math.floor(500 + Math.random() * 400)}`,
                        subject: `${account.name} Order`,
                        amount: 1250000,
                        status: 'Active',
                        ownerId: account.ownerId,
                      });
                      toast.success('Created sales order');
                    }}
                    className="text-[11.5px] link"
                  >
                    + Order
                  </button>
                }
              >
                Sales Orders ({relSalesOrders.length})
              </SectionTitle>
              {relSalesOrders.length === 0 ? (
                <p className="text-[12px] text-ink-400">No sales orders.</p>
              ) : (
                <ul className="divide-y divide-line-soft border border-line rounded-lg text-[12px]">
                  {relSalesOrders.map((so) => (
                    <li key={so.id} className="px-2.5 py-1.5 flex justify-between">
                      <span className="truncate font-medium">{so.soNumber || so.subject}</span>
                      <span className="text-ink-500">{so.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Invoices */}
          <SectionTitle>Invoices ({relInvoices.length})</SectionTitle>
          {relInvoices.length === 0 ? (
            <p className="text-[12.5px] text-ink-500">No invoices for this account.</p>
          ) : (
            <ul className="divide-y divide-line-soft border border-line rounded-lg max-h-[160px] overflow-y-auto">
              {relInvoices.map((i) => (
                <li key={i.id} className="flex items-center justify-between px-3 py-2 text-[12.5px]">
                  <Link className="link font-medium" to={`/zoho-finance?open=${i.id}`}>
                    {i.number}
                  </Link>
                  <span className="flex items-center gap-2">
                    {fmtINR(i.amount)}
                    <StatusBadge kind="invoiceStatus" value={i.status} size="sm" />
                  </span>
                </li>
              ))}
            </ul>
          )}

          {/* Related Products & Support Cases & Converted Leads */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="border border-line rounded-lg p-2.5">
              <div className="text-[12px] font-semibold text-ink mb-1">Products ({relProducts.length})</div>
              {relProducts.length === 0 ? (
                <p className="text-[11.5px] text-ink-400">None</p>
              ) : (
                <ul className="space-y-1 text-[11.5px]">
                  {relProducts.map((p) => (
                    <li key={p.id} className="truncate text-ink-600">
                      • {p.productName || p.name} ({p.status})
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border border-line rounded-lg p-2.5">
              <div className="text-[12px] font-semibold text-ink mb-1">Support Cases ({relCases.length})</div>
              {relCases.length === 0 ? (
                <p className="text-[11.5px] text-ink-400">None</p>
              ) : (
                <ul className="space-y-1 text-[11.5px]">
                  {relCases.map((c) => (
                    <li key={c.id} className="truncate text-ink-600">
                      • {c.caseNumber}: {c.subject} ({c.status})
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border border-line rounded-lg p-2.5">
              <div className="text-[12px] font-semibold text-ink mb-1">
                Converted Leads ({relConvertedLeads.length})
              </div>
              {relConvertedLeads.length === 0 ? (
                <p className="text-[11.5px] text-ink-400">None</p>
              ) : (
                <ul className="space-y-1 text-[11.5px]">
                  {relConvertedLeads.map((l) => (
                    <li key={l.id} className="truncate text-ink-600">
                      • {l.leadName} ({l.leadSource})
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Emails, Notes & Attachments */}
      {detailTab === 'communications' && (
        <div className="space-y-4">
          <SectionTitle>Emails ({relEmails.length})</SectionTitle>
          {relEmails.length === 0 ? (
            <p className="text-[12.5px] text-ink-500">No email activity recorded.</p>
          ) : (
            <ul className="divide-y divide-line-soft border border-line rounded-lg">
              {relEmails.map((e) => (
                <li key={e.id} className="px-3 py-2 text-[12.5px] flex items-center justify-between">
                  <div>
                    <div className="font-medium text-ink">{e.subject}</div>
                    <div className="text-[11px] text-ink-400">
                      {e.direction} · {fmtDate(e.createdDate)}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[11px] font-medium">
                    {e.status}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <SectionTitle>Notes ({relNotes.length})</SectionTitle>
          <div className="flex gap-2">
            <input
              type="text"
              className="input h-8 text-[12.5px] flex-1"
              placeholder="Add a note for this account..."
              value={noteInput.content}
              onChange={(e) => setNoteInput({ title: 'Account Note', content: e.target.value })}
            />
            <button
              type="button"
              className="btn-primary h-8 text-[12px]"
              onClick={() => {
                if (!noteInput.content.trim()) return;
                onAddRelatedRecord('notes', {
                  title: noteInput.title || 'Account Note',
                  content: noteInput.content.trim(),
                  ownerId: activeUser.id,
                });
                setNoteInput({ title: '', content: '' });
                toast.success('Note added');
              }}
            >
              Add Note
            </button>
          </div>
          {relNotes.length > 0 && (
            <ul className="divide-y divide-line-soft border border-line rounded-lg">
              {relNotes.map((n) => (
                <li key={n.id} className="px-3 py-2 text-[12.5px]">
                  <div className="font-medium text-ink">{n.content}</div>
                  <div className="text-[11px] text-ink-400">{fmtDate(n.createdDate)}</div>
                </li>
              ))}
            </ul>
          )}

          <SectionTitle>Attachments ({relAttachments.length})</SectionTitle>
          <div className="flex gap-2">
            <input
              type="text"
              className="input h-8 text-[12.5px] flex-1"
              placeholder="Attachment file name (e.g. MSA_Signed_2026.pdf)"
              value={attachmentInput.fileName}
              onChange={(e) => setAttachmentInput((s) => ({ ...s, fileName: e.target.value }))}
            />
            <button
              type="button"
              className="btn-secondary h-8 text-[12px]"
              onClick={() => {
                if (!attachmentInput.fileName.trim()) return;
                onAddRelatedRecord('attachments', {
                  fileName: attachmentInput.fileName.trim(),
                  fileSize: attachmentInput.fileSize || '340 KB',
                  uploadedBy: activeUser.id,
                });
                setAttachmentInput({ fileName: '', fileSize: '250 KB' });
                toast.success('Attachment linked');
              }}
            >
              <Paperclip size={13} /> Attach
            </button>
          </div>
          {relAttachments.length > 0 && (
            <ul className="divide-y divide-line-soft border border-line rounded-lg">
              {relAttachments.map((att) => (
                <li key={att.id} className="px-3 py-2 text-[12.5px] flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 font-medium text-ink">
                    <Paperclip size={13} className="text-ink-400" />
                    {att.fileName}
                  </span>
                  <span className="text-[11.5px] text-ink-400">
                    {att.fileSize} · {fmtDate(att.createdDate)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* TAB 5: Activity Timeline */}
      {detailTab === 'timeline' && (
        <div className="space-y-3">
          <SectionTitle>Activity Timeline & Audit Trail</SectionTitle>
          <ul className="space-y-2 border-l-2 border-[#CBD5E1] pl-4 ml-2">
            <li className="text-[12.5px]">
              <div className="font-medium text-ink">Last Activity Recorded</div>
              <div className="text-[11.5px] text-ink-500">{fmtDate(account.lastActivityTime || account.createdOn)}</div>
            </li>
            {relCalls.map((c) => (
              <li key={c.id} className="text-[12.5px]">
                <div className="font-medium text-ink">
                  Call ({c.status}): {c.subject}
                </div>
                <div className="text-[11.5px] text-ink-500">{c.notes}</div>
              </li>
            ))}
            {relDeals.map((d) => (
              <li key={d.id} className="text-[12.5px]">
                <div className="font-medium text-ink">
                  Deal {d.stage}: {d.name} ({fmtINR(d.amount)})
                </div>
                <div className="text-[11.5px] text-ink-500">Created {fmtDate(d.createdOn)}</div>
              </li>
            ))}
            {activity
              .filter((act) => act.recordId === account.id)
              .map((act) => (
                <li key={act.id} className="text-[12.5px]">
                  <div className="font-medium text-ink">{act.message}</div>
                  <div className="text-[11.5px] text-ink-500">{fmtDate(act.createdAt)}</div>
                </li>
              ))}
            <li className="text-[12.5px]">
              <div className="font-medium text-ink">Account Created</div>
              <div className="text-[11.5px] text-ink-500">
                {fmtDate(account.createdTime || account.createdOn)} by {usersById[account.createdBy]?.name || 'Arun Kumar'}
              </div>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
