import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlarmClock, BadgeCheck, ChevronDown, Clock3, Columns2, Columns3, Download, FileText, IndianRupee, Layers, LayoutDashboard, LayoutGrid, List, Pencil, PieChart, Plus, Receipt, SlidersHorizontal, Table2, Trash2, Upload, Wallet, Search, Settings2, Check, Edit2
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';

import DataTable from '../../components/common/DataTable';
import SpreadsheetGridView from '../../components/common/SpreadsheetGridView';
import Pagination from '../../components/common/Pagination';
import useTable from '../../components/common/useTable';
import StatusBadge, { badgeTone } from '../../components/common/StatusBadge';
import ActionMenu from '../../components/common/ActionMenu';
import FormModal from '../../components/common/RecordForm';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Drawer, SectionTitle } from '../../components/common/Modal';
import Dropdown, { MenuItem, MenuLabel, MenuDivider } from '../../components/common/Dropdown';
import BulkBar, { BulkButton } from '../../components/common/BulkBar';
import { ChartView, GridView, KanbanView } from '../../components/common/Views';
import DonutChart, { DonutLegend } from '../../components/charts/DonutChart';
import BarChart from '../../components/charts/BarChart';
import { ChartCard } from '../StageSummaryPercentage/StageSummaryPercentage';
import { useRefresh, useUrlActions } from '../../components/common/hooks';
import { useToast } from '../../components/common/Toast';
import ViewSettingsMenu from '../../components/common/ViewSettingsMenu';
import ManageColsModal from '../../components/common/ManageColsModal';
import { SaveFilterModal, RenameFilterModal } from '../../components/common/FilterModals';
import { INVOICE_STATUSES, INVOICE_TYPES } from '../../data/seedData';
import {
  MONTHS, addDays, axisCompact, balanceOf, deriveInvoiceStatus, fmtCompact, fmtDate, fmtINR, fmtNum, inRange, invoiceKpis, monthIndex, pct, todayISO, trend,
} from '../../utils/calculations';
import { exportCSV } from '../../utils/exportCSV';
import FinanceTileView from './FinanceTileView';
import FinanceTimelineView from './FinanceTimelineView';
import FinanceSplitView from './FinanceSplitView';

export const ALL_9_VIEWS = [
  { key: 'list', label: 'List View', icon: List },
  { key: 'kanban', label: 'Kanban View', icon: Columns3 },
  { key: 'grid', label: 'Grid View', icon: LayoutGrid },
  { key: 'chart', label: 'Chart View', icon: PieChart },
  { key: 'timeline', label: 'Timeline View', icon: Clock3 },
  { key: 'split', label: 'Split View', icon: Columns2 },
  { key: 'custom_list', label: 'Custom List View', icon: SlidersHorizontal },
  { key: 'tile', label: 'Tile View', icon: LayoutDashboard },
  { key: 'table', label: 'Table View', icon: Table2 },
];

const DEFAULT_VISIBLE_VIEWS = ['list', 'kanban', 'grid', 'chart', 'timeline', 'split'];

const DEFAULT_RANGE = { from: '2026-01-01', to: '2026-12-31' };
const EMPTY = { status: '', type: '', account: '', minAmt: '', maxAmt: '', dueFrom: '', dueTo: '', withBalance: false };
const STATUS_COLORS = { Paid: '#12C26B', Pending: '#FFA51F', Overdue: '#F04438', 'Partially Paid': '#2F7BF5' };
const TYPE_COLORS = { 'Sales Invoice': '#2F7BF5', 'Recurring Invoice': '#8E3CF2', 'Credit Note': '#FFA51F', 'Debit Note': '#12C26B' };
const p0 = (v) => `${Math.round(v)}%`;

const ALL_COLUMNS = [
  'Invoice Number', 'Invoice / Estimate Number', 'Account Name', 'Customer', 'Invoice Type', 'Invoice Date', 'Created Date', 'Due Date', 'Amount', 'Paid Amount', 'Balance', 'Status', 'Payment Status', 'Notes'
];

const MAX_SAVED_FILTERS = 10;

const DEFAULT_SAVED_FILTERS = [
  {
    id: 'sf-fin-1',
    name: 'Unpaid Invoices',
    config: { 'Status': { op: 'Is Not', val: 'Paid' } },
    fields: ['Status'],
  },
  {
    id: 'sf-fin-2',
    name: 'Overdue Invoices',
    config: { 'Status': { op: 'Is', val: 'Overdue' } },
    fields: ['Status'],
  },
];

const SYSTEM_FILTERS = ['Record Action', 'Touched Records', 'Untouched Records'];
const FIELD_FILTERS = [
  'Account Name', 'Amount', 'Balance', 'Due Date', 'Invoice Date', 'Invoice Number', 'Invoice Type', 'Notes', 'Paid Amount', 'Status'
];

const FILTER_TYPES = {
  Text: ['Contains', 'Equals', 'Starts With', 'Is Empty'],
  Number: ['Equals', 'Greater Than', 'Less Than', 'Between'],
  Date: ['Before', 'After', 'Between'],
  Dropdown: ['Is', 'Is Not']
};

const getFieldType = (name) => {
  if (name.includes('Date')) return 'Date';
  if (['Amount', 'Paid Amount', 'Balance'].includes(name)) return 'Number';
  if (['Invoice Type', 'Status', 'Account Name'].includes(name)) return 'Dropdown';
  return 'Text';
};

export default function ZohoFinance() {
  const { invoices, accounts, baselines, accountName, accountsById, createRecord, updateRecord, deleteRecords } = useCRM();
  const toast = useToast();
  const { refreshing, refresh } = useRefresh('Invoices');
  // Exactly 6 visible icons in toolbar
  const [visibleViews, setVisibleViews] = useState(() => {
    try {
      const saved = localStorage.getItem('zoho_finance_visible_views');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          Array.isArray(parsed) &&
          parsed.length === 6 &&
          parsed.every((k) => ALL_9_VIEWS.some((v) => v.key === k))
        ) {
          return parsed;
        }
      }
    } catch (e) {}
    return DEFAULT_VISIBLE_VIEWS;
  });

  const [layout, setLayoutState] = useState(() => {
    const saved = localStorage.getItem('zoho_finance_layout');
    if (saved && ALL_9_VIEWS.some((v) => v.key === saved)) {
      return saved;
    }
    return 'list';
  });

  const setLayout = (l) => {
    setLayoutState(l);
    try {
      localStorage.setItem('zoho_finance_layout', l);
    } catch (e) {}
  };

  // The remaining 3 views kept in the dropdown
  const dropdownViews = useMemo(() => {
    return ALL_9_VIEWS.filter((v) => !visibleViews.includes(v.key));
  }, [visibleViews]);

  // Clicking a visible icon displays that view immediately
  const handleSelectVisibleView = (key) => {
    setLayout(key);
  };

  // Selecting a hidden view from the dropdown replaces the currently active visible icon.
  // Moves the replaced view into the dropdown.
  // Always maintains exactly 6 visible icons and 3 dropdown options.
  const handleSelectDropdownView = (dropdownKey) => {
    setVisibleViews((prevVisible) => {
      const activeIndex = prevVisible.indexOf(layout);
      const replaceIndex = activeIndex >= 0 ? activeIndex : 0;
      const nextVisible = [...prevVisible];
      nextVisible[replaceIndex] = dropdownKey;
      try {
        localStorage.setItem('zoho_finance_visible_views', JSON.stringify(nextVisible));
      } catch (e) {}
      return nextVisible;
    });

    setLayout(dropdownKey);
  };

  const dense = false;
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [savedView, setSavedView] = useState('all');
  const [search, setSearch] = useState('');
  const [range, setRange] = useState(DEFAULT_RANGE);
  const [f, setF] = useState(EMPTY);
  const [form, setForm] = useState(null);
  const [payFor, setPayFor] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const [manageColsOpen, setManageColsOpen] = useState(false);
  const [pageSize, setPageSize] = useState(() => {
    try {
      const saved = localStorage.getItem('zoho_finance_page_size');
      if (saved) return Number(saved);
    } catch (e) {}
    return 100;
  });
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('zoho_finance_view_mode') || 'wrap';
    } catch (e) {
      return 'wrap';
    }
  });
  const wrapText = viewMode === 'wrap';
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('zoho_finance_cols');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return ['Invoice Number', 'Account Name', 'Invoice Type', 'Invoice Date', 'Due Date', 'Amount', 'Paid Amount', 'Balance', 'Status'];
  });

  const [pinnedColumns, setPinnedColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('zoho_finance_pinned_cols');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [filterSearch, setFilterSearch] = useState('');
  const [selectedFields, setSelectedFields] = useState(new Set(['Status', 'Invoice Type']));
  const [filterConfig, setFilterConfig] = useState({
    'Status': { op: 'Is', val: '' },
    'Invoice Type': { op: 'Is', val: '' },
  });
  const [colFilters, setColFilters] = useState({});
  const [savedFilters, setSavedFilters] = useState(() => {
    try {
      const saved = localStorage.getItem('zoho_finance_saved_filters');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_SAVED_FILTERS;
  });
  const [activeSavedFilterId, setActiveSavedFilterId] = useState(null);
  const [saveFilterModalOpen, setSaveFilterModalOpen] = useState(false);
  const [renameFilterModalOpen, setRenameFilterModalOpen] = useState(false);
  const [filterToRename, setFilterToRename] = useState(null);
  const [filterToDelete, setFilterToDelete] = useState(null);

  const handleTogglePin = (colKey, col) => {
    const targetName = col?.colName || col?.header || colKey;
    setPinnedColumns((prev) => {
      const isAlreadyPinned = prev.includes(targetName) || prev.includes(colKey) || (col?.header && prev.includes(col.header));
      let next;
      if (isAlreadyPinned) {
        next = prev.filter((k) => k !== targetName && k !== colKey && k !== col?.header);
      } else {
        next = [...prev, targetName];
      }
      try {
        localStorage.setItem('zoho_finance_pinned_cols', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const handleHideColumn = (colKey, col) => {
    const targetName = col?.colName || col?.header || colKey;
    const colToHide = visibleColumns.find((c) => c === targetName || c === colKey || c === col?.header) || targetName;
    if (colToHide === 'Invoice Number') return;
    const nextCols = visibleColumns.filter((c) => c !== colToHide);
    setVisibleColumns(nextCols);
    try {
      localStorage.setItem('zoho_finance_cols', JSON.stringify(nextCols));
    } catch (e) {}
  };

  const handleFilterColumn = (colKey, filterState, col) => {
    const targetName = col?.colName || col?.header || colKey;
    const fieldName = visibleColumns.find((c) => c === targetName || c === colKey || c === col?.header) || targetName;
    if (!filterState || (!filterState.val && filterState.op !== 'Is Empty')) {
      setColFilters((prev) => {
        const next = { ...prev };
        delete next[fieldName];
        delete next[colKey];
        if (col?.header) delete next[col.header];
        return next;
      });
    } else {
      setColFilters((prev) => ({
        ...prev,
        [fieldName]: filterState,
      }));
    }
    table?.setPage?.(1);
  };

  const views = [
    { key: 'all', label: 'All Transactions', test: () => true },
    { key: 'unpaid', label: 'Unpaid Invoices', test: (i) => balanceOf(i) > 0 },
    { key: 'overdue', label: 'Overdue Invoices', test: (i) => i.status === 'Overdue' },
    { key: 'notes', label: 'Credit & Debit Notes', test: (i) => i.type === 'Credit Note' || i.type === 'Debit Note' },
  ].map((v) => ({ ...v, count: invoices.filter(v.test).length }));
  const viewTest = views.find((v) => v.key === savedView)?.test;

  const invAccounts = useMemo(() => {
    const ids = new Set(invoices.map((i) => i.accountId));
    return accounts.filter((a) => ids.has(a.id)).sort((a, b) => a.name.localeCompare(b.name)).map((a) => ({ value: a.id, label: a.name }));
  }, [invoices, accounts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices.filter((i) => {
      if (viewTest && !viewTest(i)) return false;
      if (!inRange(i.invoiceDate, range)) return false;
      if (q && ![i.number, accountName(i.accountId), i.type, i.status, i.notes].some((v) => String(v).toLowerCase().includes(q))) return false;
      if (f.status && i.status !== f.status) return false;
      if (f.type && i.type !== f.type) return false;
      if (f.account && i.accountId !== f.account) return false;
      if (f.minAmt && i.amount < Number(f.minAmt)) return false;
      if (f.maxAmt && i.amount > Number(f.maxAmt)) return false;
      if (f.dueFrom && i.dueDate < f.dueFrom) return false;
      if (f.dueTo && i.dueDate > f.dueTo) return false;
      if (f.withBalance && balanceOf(i) <= 0) return false;

      // Apply Column Dropdown Menu Filters
      for (const [key, conf] of Object.entries(colFilters)) {
        if (!conf || (!conf.val && conf.op !== 'Is Empty')) continue;
        let recordVal = '';
        if (key === 'Invoice Number' || key === 'number') recordVal = i.number;
        else if (key === 'Account Name' || key === 'account') recordVal = accountName(i.accountId);
        else if (key === 'Invoice Type' || key === 'type') recordVal = i.type;
        else if (key === 'Invoice Date' || key === 'invoiceDate') recordVal = i.invoiceDate;
        else if (key === 'Due Date' || key === 'dueDate') recordVal = i.dueDate;
        else if (key === 'Amount' || key === 'amount') recordVal = Number(i.amount) || 0;
        else if (key === 'Paid Amount' || key === 'paidAmount') recordVal = Number(i.paidAmount) || 0;
        else if (key === 'Balance' || key === 'balance') recordVal = Number(balanceOf(i)) || 0;
        else if (key === 'Status' || key === 'status') recordVal = i.status;
        else if (key === 'Notes' || key === 'notes') recordVal = i.notes || '';
        else continue;

        const isDate = key.includes('Date');
        const isNum = ['amount', 'paidAmount', 'balance', 'Amount', 'Paid Amount', 'Balance'].includes(key);
        const isDropdown = ['type', 'status', 'Invoice Type', 'Status'].includes(key);

        if (isDropdown) {
          if (conf.op === 'Is' && String(recordVal).toLowerCase() !== String(conf.val).toLowerCase()) return false;
          if (conf.op === 'Is Not' && String(recordVal).toLowerCase() === String(conf.val).toLowerCase()) return false;
        } else if (isNum) {
          const rNum = Number(recordVal) || 0;
          const valNum = Number(conf.val);
          if (conf.op === 'Equals' && rNum !== valNum) return false;
          if (conf.op === 'Greater Than' && rNum <= valNum) return false;
          if (conf.op === 'Less Than' && rNum >= valNum) return false;
          if (conf.op === 'Between' && conf.val2) {
            if (rNum < valNum || rNum > Number(conf.val2)) return false;
          }
        } else if (isDate) {
          if (conf.op === 'Before' && recordVal >= conf.val) return false;
          if (conf.op === 'After' && recordVal <= conf.val) return false;
          if (conf.op === 'Between' && conf.val2) {
            if (recordVal < conf.val || recordVal > conf.val2) return false;
          }
        } else {
          const rStr = String(recordVal).toLowerCase();
          const vStr = String(conf.val || '').toLowerCase();
          if (conf.op === 'Contains' && !rStr.includes(vStr)) return false;
          if (conf.op === 'Equals' && rStr !== vStr) return false;
          if (conf.op === 'Starts With' && !rStr.startsWith(vStr)) return false;
          if (conf.op === 'Is Empty' && rStr.length > 0) return false;
        }
      }

      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices, search, range, f, savedView, accountName, colFilters]);

  const accessors = useMemo(() => ({ account: (i) => accountName(i.accountId), balance: balanceOf }), [accountName]);
  const table = useTable(filtered, { accessors, defaultSort: { key: 'number', dir: 'asc' }, pageSize });
  const set = (k) => (v) => { setF((s) => ({ ...s, [k]: v })); table.setPage(1); };
  const reset = () => { setF(EMPTY); setColFilters({}); setFilterConfig({}); setSelectedFields(new Set()); setSearch(''); setRange(DEFAULT_RANGE); setSavedView('all'); setActiveSavedFilterId(null); };
  const moreCount = ['minAmt', 'maxAmt', 'dueFrom', 'dueTo', 'withBalance'].filter((k) => f[k]).length + Object.keys(colFilters).length;

  const hasActiveFilter = useMemo(() => {
    return Object.values(colFilters).some(
      (conf) => conf && (conf.val !== '' || conf.op === 'Is Empty')
    ) || Object.values(filterConfig).some(
      (conf) => conf && (conf.val !== '' || conf.op === 'Is Empty')
    ) || Boolean(f.minAmt || f.maxAmt || f.dueFrom || f.dueTo || f.withBalance || f.status || f.type || f.account);
  }, [colFilters, filterConfig, f]);

  const resolveFieldName = (colKey, column) => {
    if (column?.colName) return column.colName;
    if (column?.header) return column.header;
    return colKey;
  };

  const handleOpenFilterSidebar = (colKey, column) => {
    const targetField = resolveFieldName(colKey, column);
    setFiltersOpen(true);
    setFilterSearch('');

    setSelectedFields((prev) => {
      const next = new Set(prev);
      next.add(targetField);
      return next;
    });

    setFilterConfig((prev) => {
      if (!prev[targetField]) {
        const fType = getFieldType(targetField);
        return {
          ...prev,
          [targetField]: { op: (FILTER_TYPES[fType] || ['Contains'])[0], val: '' },
        };
      }
      return prev;
    });

    setTimeout(() => {
      const slug = targetField.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      const el = document.getElementById(`filter-field-${slug}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const input = el.querySelector('input:not([type="checkbox"]), select');
        if (input) input.focus();
      }
    }, 150);
  };

  const toggleField = (field) => {
    const next = new Set(selectedFields);
    if (next.has(field)) {
      next.delete(field);
      setFilterConfig(prev => { const p = { ...prev }; delete p[field]; return p; });
      setColFilters(prev => { const p = { ...prev }; delete p[field]; return p; });
    } else {
      next.add(field);
      setFilterConfig(prev => ({ ...prev, [field]: { op: (FILTER_TYPES[getFieldType(field)] || ['Contains'])[0], val: '' } }));
    }
    setSelectedFields(next);
  };

  const setConfig = (field, k, v) => setFilterConfig(prev => ({ ...prev, [field]: { ...prev[field], [k]: v } }));
  const applyFilters = () => {
    setColFilters(prev => ({ ...prev, ...filterConfig }));
    table.setPage(1);
  };

  const handleApplySavedFilter = (sf) => {
    setActiveSavedFilterId(sf.id);
    setSelectedFields(new Set(sf.fields || Object.keys(sf.config)));
    setFilterConfig({ ...sf.config });
    setColFilters({ ...sf.config });
    table.setPage(1);
  };

  const handleUpdateSavedFilter = (sfId) => {
    setSavedFilters((prev) => {
      const next = prev.map((item) => {
        if (item.id === sfId) {
          return {
            ...item,
            config: { ...colFilters, ...filterConfig },
            fields: Array.from(selectedFields),
          };
        }
        return item;
      });
      localStorage.setItem('zoho_finance_saved_filters', JSON.stringify(next));
      return next;
    });
  };

  const handleRenameSavedFilter = (sfId, newName) => {
    setSavedFilters((prev) => {
      const next = prev.map((item) => (item.id === sfId ? { ...item, name: newName } : item));
      localStorage.setItem('zoho_finance_saved_filters', JSON.stringify(next));
      return next;
    });
  };

  const handleDeleteSavedFilter = (sfId) => {
    setSavedFilters((prev) => {
      const next = prev.filter((item) => item.id !== sfId);
      localStorage.setItem('zoho_finance_saved_filters', JSON.stringify(next));
      return next;
    });
    if (activeSavedFilterId === sfId) {
      setActiveSavedFilterId(null);
    }
    setFilterToDelete(null);
  };

  const handleSaveNewFilter = (name) => {
    if (savedFilters.length >= MAX_SAVED_FILTERS) return;
    const newFilter = {
      id: `sf-${Date.now()}`,
      name,
      config: { ...colFilters, ...filterConfig },
      fields: Array.from(selectedFields),
    };
    const next = [...savedFilters, newFilter];
    setSavedFilters(next);
    localStorage.setItem('zoho_finance_saved_filters', JSON.stringify(next));
    setActiveSavedFilterId(newFilter.id);
    setSaveFilterModalOpen(false);
  };

  const renderFieldList = (list) => {
    const q = filterSearch.trim().toLowerCase();
    const matches = q ? list.filter(item => item.toLowerCase().includes(q)) : list;
    if (matches.length === 0) return null;
    return (
      <div className="pl-5 pb-4 space-y-3 max-h-[400px] overflow-y-auto thin-scroll">
        {matches.map(field => {
          const checked = selectedFields.has(field);
          const conf = filterConfig[field];
          const type = getFieldType(field);
          const ops = FILTER_TYPES[type] || ['Contains', 'Equals'];
          return (
            <div key={field} id={`filter-field-${field.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`} className="space-y-1.5">
              <label className="flex items-start gap-2.5 text-[13.5px] text-ink-600 cursor-pointer leading-snug">
                <input type="checkbox" className="cb mt-0.5" checked={checked} onChange={() => toggleField(field)} />
                {field}
              </label>
              {checked && conf && (
                <div className="pl-[26px] space-y-1.5 mt-1 text-[13px]">
                  <select className="w-full h-8 px-2 border border-line rounded-md bg-white" value={conf.op} onChange={(e) => setConfig(field, 'op', e.target.value)}>
                    {ops.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  {type === 'Dropdown' ? (
                    <select className="w-full h-8 px-2 border border-line rounded-md bg-white" value={conf.val} onChange={(e) => setConfig(field, 'val', e.target.value)}>
                      <option value="">Select...</option>
                      {(filterOptionsContext[field] || []).map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
                    </select>
                  ) : type === 'Date' ? (
                    <>
                      <input type="date" className="w-full h-8 px-2 border border-line rounded-md" value={conf.val} onChange={(e) => setConfig(field, 'val', e.target.value)} />
                      {conf.op === 'Between' && <input type="date" className="w-full h-8 px-2 border border-line rounded-md mt-1" value={conf.val2 || ''} onChange={(e) => setConfig(field, 'val2', e.target.value)} />}
                    </>
                  ) : (
                    <>
                      {conf.op !== 'Is Empty' && <input type={type === 'Number' ? 'number' : 'text'} className="w-full h-8 px-2 border border-line rounded-md" value={conf.val} onChange={(e) => setConfig(field, 'val', e.target.value)} />}
                      {conf.op === 'Between' && type === 'Number' && <input type="number" className="w-full h-8 px-2 border border-line rounded-md mt-1" value={conf.val2 || ''} onChange={(e) => setConfig(field, 'val2', e.target.value)} />}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const filterOptionsContext = useMemo(() => ({
    'Invoice Type': INVOICE_TYPES.map(s => ({ value: s, label: s })),
    'type': INVOICE_TYPES.map(s => ({ value: s, label: s })),
    'Status': INVOICE_STATUSES.map(s => ({ value: s, label: s })),
    'status': INVOICE_STATUSES.map(s => ({ value: s, label: s })),
    'Account Name': invAccounts,
    'account': invAccounts,
  }), [invAccounts]);

  const columnMenuConfig = useMemo(() => ({
    module: 'zoho_finance',
    pinnedColumns,
    onTogglePin: handleTogglePin,
    onHideColumn: handleHideColumn,
    onFilterColumn: handleFilterColumn,
    onOpenFilterSidebar: handleOpenFilterSidebar,
    appliedFilters: colFilters,
    filterOptions: filterOptionsContext,
  }), [pinnedColumns, colFilters, filterOptionsContext, visibleColumns]);

  const k = invoiceKpis(filtered);
  const base = baselines.invoices;
  const monthSpark = (fn) => [5, 6, 7, 8, 9].map((m) => filtered.filter((i) => monthIndex(i.invoiceDate) <= m).reduce((s, i) => s + fn(i), 0) + 1);

  const statusDonut = [
    { name: 'Paid', value: k.paid, color: STATUS_COLORS.Paid },
    { name: 'Pending', value: k.pending, color: STATUS_COLORS.Pending },
    { name: 'Overdue', value: k.overdue, color: STATUS_COLORS.Overdue },
  ];
  const monthly = MONTHS.map((m, idx) => {
    const list = filtered.filter((i) => monthIndex(i.invoiceDate) === idx);
    return {
      name: m,
      paid: list.reduce((s, i) => s + Math.min(i.paidAmount, i.amount), 0),
      pending: list.filter((i) => i.status !== 'Overdue').reduce((s, i) => s + balanceOf(i), 0),
      overdue: list.filter((i) => i.status === 'Overdue').reduce((s, i) => s + balanceOf(i), 0),
    };
  });
  const typeDonut = INVOICE_TYPES.map((t) => ({ name: t, value: filtered.filter((i) => i.type === t).length, color: TYPE_COLORS[t] }));

  const nextNumber = () => {
    const max = invoices.reduce((m, i) => Math.max(m, Number(i.number.split('-').pop()) || 0), 0);
    return `INV-2026-${String(max + 1).padStart(3, '0')}`;
  };
  const accountOptions = useMemo(() => [...accounts].sort((a, b) => a.name.localeCompare(b.name)).map((a) => ({ value: a.id, label: a.name })), [accounts]);
  const fields = [
    { name: 'number', label: 'Invoice Number', required: true, validate: (v, vals) => (invoices.some((i) => i.number === String(v).trim() && i.id !== vals.id) ? 'This invoice number is already used.' : '') },
    { name: 'accountId', label: 'Account Name', type: 'select', options: accountOptions, required: true },
    { name: 'type', label: 'Invoice Type', type: 'select', options: INVOICE_TYPES, required: true },
    { name: 'status', label: 'Status', type: 'select', required: true, options: [{ value: 'auto', label: 'Set automatically from payments & due date' }, ...INVOICE_STATUSES] },
    { name: 'invoiceDate', label: 'Invoice Date', type: 'date', required: true, onChangeEffect: (v, vals) => (!vals.dueDate || vals.dueDate < v ? { dueDate: addDays(v, 15) } : {}) },
    { name: 'dueDate', label: 'Due Date', type: 'date', required: true, validate: (v, vals) => (v < vals.invoiceDate ? 'Due date can’t be before the invoice date.' : '') },
    { name: 'amount', label: 'Amount (₹)', type: 'number', min: 1, required: true },
    { name: 'paidAmount', label: 'Paid Amount (₹)', type: 'number', min: 0, validate: (v, vals) => (Number(v) > Number(vals.amount) ? 'Paid amount can’t exceed the invoice amount.' : ''), help: 'Balance is calculated automatically.' },
    { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
  ];
  const blank = () => ({ number: nextNumber(), accountId: '', type: 'Sales Invoice', status: 'auto', invoiceDate: todayISO(), dueDate: addDays(todayISO(), 15), amount: '', paidAmount: 0, notes: '' });

  useUrlActions({
    onCreate: () => setForm({ mode: 'create', record: blank() }),
    onOpen: (id) => invoices.some((i) => i.id === id) && setViewing(id),
    onParams: (p) => { if (p.status) { set('status')(p.status); setRange({ from: '', to: '' }); } },
  });

  const submit = (v) => {
    const paidAmount = Number(v.paidAmount) || 0;
    const draft = { ...v, number: v.number.trim(), paidAmount };
    draft.status = v.status === 'auto' ? deriveInvoiceStatus(draft) : v.status;
    if (form.mode === 'create') {
      createRecord('invoices', { ...draft, payments: paidAmount ? [{ id: `pay-${Date.now()}`, date: v.invoiceDate, amount: paidAmount, note: 'Recorded at creation' }] : [] });
      table.setSort({ key: 'number', dir: 'desc' });
      table.setPage(1);
      if (!inRange(v.invoiceDate, range)) setRange({ from: '', to: '' });
    } else {
      const prev = invoices.find((i) => i.id === form.record.id);
      const diff = paidAmount - (prev.paidAmount || 0);
      const payments = diff ? [...(prev.payments || []), { id: `pay-${Date.now()}`, date: todayISO(), amount: diff, note: diff > 0 ? 'Adjusted in invoice edit' : 'Payment correction' }] : prev.payments;
      updateRecord('invoices', form.record.id, { ...draft, payments });
    }
    setForm(null);
  };

  const recordPayment = ({ amount, date, note }) => {
    const inv = invoices.find((i) => i.id === payFor);
    const paidAmount = Math.min(inv.amount, inv.paidAmount + Number(amount));
    const next = { ...inv, paidAmount };
    updateRecord('invoices', inv.id, { paidAmount, status: deriveInvoiceStatus(next), payments: [...(inv.payments || []), { id: `pay-${Date.now()}`, date, amount: Number(amount), note }] });
    toast.success(`Payment of ${fmtINR(amount)} recorded for ${inv.number}`);
    setPayFor(null);
  };

  const setStatus = (inv, status) => {
    if (status === 'Paid' && balanceOf(inv) > 0) {
      updateRecord('invoices', inv.id, { status, paidAmount: inv.amount, payments: [...(inv.payments || []), { id: `pay-${Date.now()}`, date: todayISO(), amount: balanceOf(inv), note: 'Marked as paid' }] });
    } else if (status === 'Partially Paid' && inv.paidAmount <= 0) {
      setPayFor(inv.id);
    } else updateRecord('invoices', inv.id, { status });
  };

  const runOverdueCheck = () => {
    const today = todayISO();
    const due = invoices.filter((i) => balanceOf(i) > 0 && i.dueDate < today && i.status !== 'Overdue');
    due.forEach((i) => updateRecord('invoices', i.id, { status: 'Overdue' }));
    toast[due.length ? 'success' : 'info'](due.length ? `${due.length} invoice${due.length > 1 ? 's' : ''} marked overdue` : 'No unpaid invoices are past their due date.');
  };

  const exportRows = (rows) => exportCSV('invoices', rows, [
    { label: 'Invoice Number', value: (i) => i.number }, { label: 'Account Name', value: (i) => accountName(i.accountId) }, { label: 'Invoice Type', value: (i) => i.type },
    { label: 'Invoice Date', value: (i) => i.invoiceDate }, { label: 'Due Date', value: (i) => i.dueDate }, { label: 'Amount (INR)', value: (i) => i.amount },
    { label: 'Paid Amount (INR)', value: (i) => i.paidAmount }, { label: 'Balance (INR)', value: balanceOf }, { label: 'Status', value: (i) => i.status },
  ]);

  const statusMenu = (inv, trigger) => (
    <Dropdown width={190} trigger={trigger}>
      {(close) => (<><MenuLabel>Update payment status</MenuLabel>{INVOICE_STATUSES.map((s) => <MenuItem key={s} close={close} active={s === inv.status} onClick={() => s !== inv.status && setStatus(inv, s)}>{s}</MenuItem>)}</>)}
    </Dropdown>
  );

  const allColumnsDef = useMemo(() => {
    const invCol = { key: 'number', header: 'Invoice Number', sortable: true, render: (i) => <button onClick={() => setViewing(i.id)} className="text-primary hover:underline whitespace-nowrap">{i.number}</button> };
    const accCol = { key: 'account', header: 'Account Name', sortable: true, render: (i) => <Link to={`/accounts?open=${i.accountId}`} className="text-ink-600 hover:text-primary whitespace-nowrap">{accountName(i.accountId)}</Link> };
    const dateCol = { key: 'invoiceDate', header: 'Invoice Date', sortable: true, className: 'whitespace-nowrap', render: (i) => fmtDate(i.invoiceDate) };
    const statusCol = { key: 'status', header: 'Status', sortable: true, render: (i) => statusMenu(i, <button type="button" title="Update payment status" className={`inline-flex items-center justify-center h-[22px] min-w-[66px] px-2 rounded-md text-[12px] font-medium whitespace-nowrap ${badgeTone('invoiceStatus', i.status)}`}>{i.status}</button>) };

    return {
      'Invoice Number': invCol,
      'Invoice / Estimate Number': { ...invCol, header: 'Invoice / Estimate Number' },
      'Account Name': accCol,
      'Customer': { ...accCol, header: 'Customer' },
      'Invoice Type': { key: 'type', header: 'Invoice Type', sortable: true, render: (i) => <StatusBadge kind="invoiceType" value={i.type} size="sm" className="min-w-[96px]" /> },
      'Invoice Date': dateCol,
      'Created Date': { ...dateCol, header: 'Created Date' },
      'Due Date': { key: 'dueDate', header: 'Due Date', sortable: true, className: 'whitespace-nowrap', render: (i) => <span className={balanceOf(i) > 0 && i.dueDate < todayISO() ? 'text-danger-700' : ''}>{fmtDate(i.dueDate)}</span> },
      'Amount': { key: 'amount', header: 'Amount (₹)', sortable: true, render: (i) => fmtNum(i.amount) },
      'Paid Amount': { key: 'paidAmount', header: 'Paid Amount (₹)', sortable: true, render: (i) => fmtNum(i.paidAmount) },
      'Balance': { key: 'balance', header: 'Balance (₹)', sortable: true, render: (i) => <span className={balanceOf(i) ? 'text-ink' : ''}>{fmtNum(balanceOf(i))}</span> },
      'Status': statusCol,
      'Payment Status': { ...statusCol, header: 'Payment Status' },
      'Notes': { key: 'notes', header: 'Notes', sortable: false, render: (i) => <span className="truncate max-w-[150px]">{i.notes || '—'}</span> },
    };
  }, [accountName]);

  const handleInlineCellEdit = (invId, colKey, newValue) => {
    const keyMap = {
      'Invoice Number': 'number',
      'Invoice / Estimate Number': 'number',
      'Notes': 'notes',
      'Amount': 'amount',
      'Amount (₹)': 'amount',
      'Paid Amount': 'paidAmount',
      'Status': 'status',
      'Payment Status': 'status',
    };
    const propKey = keyMap[colKey] || colKey;
    let finalVal = newValue;
    if (propKey === 'amount' || propKey === 'paidAmount') {
      const parsed = Number(String(newValue).replace(/[^0-9.]/g, ''));
      finalVal = isNaN(parsed) ? 0 : parsed;
    }
    updateRecord('invoices', invId, { [propKey]: finalVal });
    toast.success('Updated successfully');
  };

  const columns = useMemo(() => {
    const cols = visibleColumns.map(c => ({
      ...(allColumnsDef[c] || { key: c, header: c, sortable: false, render: () => <span className="text-ink-400">—</span> }),
      colName: c
    }));
    cols.forEach(c => {
      if (!wrapText && !c.className?.includes('whitespace-nowrap')) c.className = (c.className ? c.className + ' ' : '') + 'whitespace-nowrap';
    });
    return cols;
  }, [visibleColumns, allColumnsDef, wrapText]);

  const rec = invoices.find((i) => i.id === viewing);
  const payInv = invoices.find((i) => i.id === payFor);
  const selectedIds = [...table.selected];


  return (
    <div>
      <PageHeader
        views={views} view={savedView} onViewChange={(v) => { setSavedView(v); table.setPage(1); }}
        tabMenu={[{ label: 'Export filtered invoices (CSV)', icon: Download, onClick: () => exportRows(table.sorted) }, { label: 'Check for overdue invoices', icon: AlarmClock, onClick: runOverdueCheck }, { label: 'Reset filters', onClick: reset }]}
        toolbar={{
          sidebarToggle: { isOpen: filtersOpen, onToggle: () => setFiltersOpen((o) => !o) },
          filterActive: filtersOpen,
          onFilter: () => setFiltersOpen((o) => !o),
          hasActiveFilter,
          onSaveFilter: () => setSaveFilterModalOpen(true),
          sortOptions: [{ key: 'number', label: 'Invoice Number' }, { key: 'invoiceDate', label: 'Invoice Date' }, { key: 'dueDate', label: 'Due Date' }, { key: 'amount', label: 'Amount' }, { key: 'balance', label: 'Balance' }],
          sort: table.sort,
          onSort: table.setSort,
          layouts: visibleViews,
          layout,
          onLayout: handleSelectVisibleView,
          customViewsDropdown: (close) => (
            <>
              <MenuLabel>More Views ({dropdownViews.length})</MenuLabel>
              {dropdownViews.map((v) => {
                const Icon = v.icon;
                return (
                  <MenuItem
                    key={v.key}
                    close={close}
                    icon={Icon}
                    onClick={() => handleSelectDropdownView(v.key)}
                  >
                    {v.label}
                  </MenuItem>
                );
              })}
            </>
          ),
          onRefresh: refresh,
          refreshing,
          hideWorkflow: true,
          hideDense: true,
          module: 'Zoho Finance',
          primary: { label: 'Create Invoice', onClick: () => setForm({ mode: 'create', record: blank() }), menu: [
            { label: 'Create Invoice', icon: Plus, onClick: () => setForm({ mode: 'create', record: blank() }) },
            { label: 'Create Credit Note', icon: Receipt, onClick: () => setForm({ mode: 'create', record: { ...blank(), type: 'Credit Note' } }) },
            { label: 'Export invoices (CSV)', icon: Download, onClick: () => exportRows(table.sorted) },
          ] },
          moreItems: [
            { label: 'Check for overdue invoices', icon: AlarmClock, onClick: runOverdueCheck },
            { label: 'Export selected (CSV)', icon: Download, disabled: !selectedIds.length, onClick: () => exportRows(invoices.filter((i) => table.selected.has(i.id))) },
            { label: 'Delete selected', icon: Trash2, danger: true, disabled: !selectedIds.length, onClick: () => setConfirm({ ids: selectedIds, label: `${selectedIds.length} invoices` }) },
          ],
        }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-3 mb-3">
        <StatCard icon={FileText} tone="violet" label="Total Invoices" value={k.count} trend={trend(k.count, base.count)} spark={monthSpark(() => 1)} onClick={reset} />
        <StatCard icon={IndianRupee} tone="green" tinted label="Total Invoice Amount" value={fmtINR(k.total)} trend={trend(k.total, base.total)} spark={monthSpark((i) => i.amount)} />
        <StatCard icon={BadgeCheck} tone="amber" label="Paid Amount" value={fmtINR(k.paid)} trend={trend(k.paid, base.paid)} spark={monthSpark((i) => i.paidAmount)} onClick={() => set('status')('Paid')} />
        <StatCard icon={AlarmClock} tone="red" tinted label="Pending Amount" value={fmtINR(k.pending)} trend={trend(k.pending, base.pending)} invertTrend spark={monthSpark((i) => (i.status !== 'Overdue' ? balanceOf(i) : 0))} onClick={() => setSavedView('unpaid')} />
        <StatCard icon={FileText} tone="blue" tinted label="Overdue Amount" value={fmtINR(k.overdue)} trend={trend(k.overdue, base.overdue)} invertTrend spark={monthSpark((i) => (i.status === 'Overdue' ? balanceOf(i) : 0))} onClick={() => set('status')('Overdue')} />
      </div>

      <div className="flex gap-3 items-start">
        <aside
          className={`card hidden md:flex flex-col shrink-0 sticky top-[72px] h-[calc(100vh-86px)] overflow-hidden transition-all duration-300 ease-in-out ${
            filtersOpen ? 'w-[250px] opacity-100' : 'w-0 opacity-0 border-0 p-0 overflow-hidden -mr-3 pointer-events-none'
          }`}
        >
          <div className="px-3.5 pt-4 pb-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-semibold text-ink whitespace-nowrap">Filter Invoices by</h2>
              {(moreCount > 0 || search || filterSearch || range.from !== DEFAULT_RANGE.from || range.to !== DEFAULT_RANGE.to) && <button onClick={reset} className="text-[12.5px] text-primary hover:underline">Clear</button>}
            </div>
            
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-2.5 text-ink-400" size={14} />
              <input type="text" placeholder="Search" className="w-full h-9 pl-8 pr-3 text-[13px] border border-line rounded-md focus:border-primary outline-none" value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto thin-scroll px-3.5 pb-4">
            <details className="group mb-2" open={!filterSearch}>
              <summary className="py-2.5 text-[14px] font-semibold text-ink cursor-pointer select-none flex items-center justify-between -ml-1">
                <div className="flex items-center gap-1">
                  <ChevronDown size={16} className="group-open:rotate-180 transition-transform -rotate-90" />
                  Saved Filters
                </div>
                <span className="text-[11px] font-medium bg-line text-ink-600 px-2 py-0.5 rounded-full" title="Saved presets count">
                  {savedFilters.length} / {MAX_SAVED_FILTERS} Saved Filters
                </span>
              </summary>
              <div className="pl-4 pb-3 space-y-1.5 text-[13px] text-ink-600">
                {savedFilters.length === 0 ? (
                  <div className="text-[12.5px] text-ink-400 py-1 pl-1">No saved filters yet</div>
                ) : (
                  savedFilters.map((sf) => {
                    const isActive = activeSavedFilterId === sf.id;
                    return (
                      <div
                        key={sf.id}
                        className={`group/sf flex items-center justify-between py-1 px-2 rounded-md transition-colors ${
                          isActive ? 'bg-primary-50 text-primary font-semibold' : 'hover:bg-page'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleApplySavedFilter(sf)}
                          className="truncate text-left flex-1 hover:text-primary"
                          title={`Apply preset "${sf.name}"`}
                        >
                          {sf.name}
                        </button>
                        <div className="flex items-center gap-1 opacity-70 group-hover/sf:opacity-100 ml-1">
                          {isActive && hasActiveFilter && (
                            <button
                              type="button"
                              onClick={() => handleUpdateSavedFilter(sf.id)}
                              className="p-1 hover:text-primary text-ink-400"
                              title="Update this preset with current conditions"
                            >
                              <Check size={13} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setFilterToRename(sf);
                              setRenameFilterModalOpen(true);
                            }}
                            className="p-1 hover:text-primary text-ink-400"
                            title="Rename filter"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setFilterToDelete(sf)}
                            className="p-1 hover:text-red-500 text-ink-400"
                            title="Delete filter"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}

                {hasActiveFilter && (
                  <div className="pt-1.5 pl-1">
                    {savedFilters.length < MAX_SAVED_FILTERS ? (
                      <button
                        type="button"
                        onClick={() => setSaveFilterModalOpen(true)}
                        className="text-primary hover:underline text-[12.5px] font-medium flex items-center gap-1"
                      >
                        <Plus size={13} /> Save Current Filter
                      </button>
                    ) : (
                      <span className="text-[11.5px] text-red-500 block font-medium">
                        Maximum 10 saved filters allowed.
                      </span>
                    )}
                  </div>
                )}
              </div>
            </details>

            <details className="group" open>
              <summary className="py-2.5 text-[14px] font-semibold text-ink cursor-pointer select-none flex items-center gap-1 -ml-1">
                <ChevronDown size={16} className="group-open:rotate-180 transition-transform -rotate-90" />
                System Defined Filters
              </summary>
              {renderFieldList(SYSTEM_FILTERS)}
            </details>

            <details className="group" open>
              <summary className="py-2.5 text-[14px] font-semibold text-ink cursor-pointer select-none flex items-center gap-1 -ml-1">
                <ChevronDown size={16} className="group-open:rotate-180 transition-transform -rotate-90" />
                Filter By Fields
              </summary>
              {renderFieldList(FIELD_FILTERS)}
            </details>
          </div>

          {(Object.keys(filterConfig).length > 0 || Object.keys(colFilters).length > 0) && (
            <div className="px-3.5 py-3 border-t border-line bg-page flex gap-2">
              <button onClick={applyFilters} className="btn-primary flex-1 h-8 text-[13px]">Apply Filter</button>
              <button onClick={() => { setFilterConfig({}); setSelectedFields(new Set()); setColFilters({}); }} className="btn-secondary flex-1 h-8 text-[13px]">Clear Filter</button>
            </div>
          )}
        </aside>

        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.1fr_1fr] gap-3 mb-3">
            <ChartCard title="Invoice Status (Amount)" icon={Layers} extra={<ActionMenu boxed={false} items={[{ label: 'Show unpaid only', onClick: () => setSavedView('unpaid') }, { label: 'Show overdue only', onClick: () => set('status')('Overdue') }, { label: 'Export invoices (CSV)', icon: Download, onClick: () => exportRows(table.sorted) }]} />}>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-[190px] shrink-0"><DonutChart data={statusDonut} centerValue={fmtCompact(k.total)} centerLabel="Total Amount" height={190} inner="58%" valueFormatter={(v) => fmtINR(v)} onSliceClick={(s) => (s === 'Pending' ? setSavedView('unpaid') : set('status')(s))} /></div>
                <ul className="flex-1 space-y-3 w-full">
                  {statusDonut.map((s) => (
                    <li key={s.name} className="text-[13px]">
                      <div className="flex items-center gap-2 text-ink-600"><span className="h-3 w-3 rounded-full" style={{ background: s.color }} />{s.name}</div>
                      <div className="pl-5 font-semibold text-ink">{fmtINR(s.value)} ({p0(pct(s.value, k.total))})</div>
                    </li>
                  ))}
                </ul>
              </div>
            </ChartCard>
            <ChartCard title="Monthly Revenue (₹)" icon={Layers} extra={<ActionMenu boxed={false} items={[{ label: 'Export monthly revenue (CSV)', icon: Download, onClick: () => exportCSV('monthly-revenue', monthly, [{ label: 'Month', value: (r) => r.name }, { label: 'Paid', value: (r) => r.paid }, { label: 'Pending', value: (r) => r.pending }, { label: 'Overdue', value: (r) => r.overdue }]) }]} />}>
              <BarChart data={monthly} height={200} legend barSize={16} yFormatter={axisCompact} valueFormatter={(v) => fmtINR(v)} yWidth={42}
                bars={[{ key: 'paid', name: 'Paid', color: STATUS_COLORS.Paid, stackId: 'a' }, { key: 'pending', name: 'Pending', color: STATUS_COLORS.Pending, stackId: 'a' }, { key: 'overdue', name: 'Overdue', color: STATUS_COLORS.Overdue, stackId: 'a', top: true }]} />
            </ChartCard>
            <ChartCard title="Invoices by Type" icon={LayoutGrid} extra={<ActionMenu boxed={false} items={INVOICE_TYPES.map((t) => ({ label: `Show ${t}s`, onClick: () => set('type')(t) }))} />}>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-[180px] shrink-0"><DonutChart data={typeDonut} centerValue={k.count} centerLabel="Total Invoices" height={180} valueFormatter={(v) => `${v} invoices`} onSliceClick={(t) => set('type')(t)} /></div>
                <DonutLegend className="flex-1 w-full" items={typeDonut.map((t) => ({ name: t.name, color: t.color, right: `${t.value} (${p0(pct(t.value, k.count))})` }))} />
              </div>
            </ChartCard>
          </div>

          <section className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <h2 className="text-[17px] font-semibold text-ink">Invoice List</h2>
              <Dropdown width={210} align="right" trigger={<button className="h-9 px-3 rounded-lg border border-line text-primary text-[13.5px] font-medium inline-flex items-center gap-1.5 hover:bg-primary-50"><Upload size={15} />Export<ChevronDown size={14} /></button>}>
                {(close) => (<>
                  <MenuItem icon={Download} close={close} onClick={() => exportRows(table.sorted)}>Filtered invoices (CSV)</MenuItem>
                  <MenuItem icon={Download} close={close} onClick={() => exportRows(invoices)}>All invoices (CSV)</MenuItem>
                  <MenuItem icon={Download} close={close} disabled={!selectedIds.length} onClick={() => exportRows(invoices.filter((i) => table.selected.has(i.id)))}>Selected invoices (CSV)</MenuItem>
                </>)}
              </Dropdown>
            </div>
        <BulkBar count={selectedIds.length} onClear={table.clearSelection}>
          <BulkButton icon={BadgeCheck} onClick={() => { selectedIds.forEach((id) => { const i = invoices.find((x) => x.id === id); if (i.status !== 'Paid') setStatus(i, 'Paid'); }); table.clearSelection(); }}>Mark as paid</BulkButton>
          <BulkButton icon={Download} onClick={() => exportRows(invoices.filter((i) => table.selected.has(i.id)))}>Export</BulkButton>
          <BulkButton icon={Trash2} danger onClick={() => setConfirm({ ids: selectedIds, label: `${selectedIds.length} invoices` })}>Delete</BulkButton>
        </BulkBar>
        {layout === 'list' && (
          <DataTable
            columns={columns}
            rows={table.pageRows}
            table={table}
            showIndex={false}
            loading={refreshing}
            dense={dense}
            minWidth={1180}
            columnMenu={columnMenuConfig}
            viewMode={viewMode}
            emptyAction={<button className="btn-primary mt-2 h-9" onClick={() => setForm({ mode: 'create', record: blank() })}><Plus size={16} />Create Invoice</button>}
            headerExtra={
              <th className="th w-[44px] text-center p-0">
                <ViewSettingsMenu
                  onManageColumns={() => setManageColsOpen(true)}
                  onResetColumnSize={() => {
                    localStorage.removeItem('zoho_finance_pinned_cols');
                    setPinnedColumns([]);
                  }}
                  hasCustomColumnSize={pinnedColumns.length > 0}
                  pageSize={pageSize}
                  onPageSizeChange={(sz) => {
                    setPageSize(sz);
                    localStorage.setItem('zoho_finance_page_size', sz);
                    table.setPage(1);
                  }}
                  viewMode={viewMode}
                  onViewModeChange={(mode) => {
                    setViewMode(mode);
                    localStorage.setItem('zoho_finance_view_mode', mode);
                  }}
                />
              </th>
            }
          />
        )}
        {layout === 'kanban' && <div className="p-3"><KanbanView groups={INVOICE_STATUSES.map((s) => ({ key: s, label: s, color: STATUS_COLORS[s] }))} rows={table.sorted} groupOf={(i) => i.status}
          onMove={setStatus} onCardClick={(i) => setViewing(i.id)} summary={(items) => `${fmtCompact(items.reduce((s, i) => s + balanceOf(i), 0))} outstanding`}
          renderCard={(i) => (<div><div className="flex items-center justify-between"><span className="text-[13.5px] font-semibold text-primary">{i.number}</span><StatusBadge kind="invoiceType" value={i.type} size="sm" /></div><div className="text-[12px] text-ink-500 mt-1">{accountName(i.accountId)} · due {fmtDate(i.dueDate)}</div><div className="flex justify-between mt-2 text-[12.5px]"><span className="text-ink">{fmtINR(i.amount)}</span><span className="text-ink-500">Bal {fmtINR(balanceOf(i))}</span></div></div>)} /></div>}

        {layout === 'grid' && (
          <div>
            <SpreadsheetGridView
              columns={columns}
              rows={table.pageRows}
              table={table}
              loading={refreshing}
              minWidth={1200}
              columnMenu={columnMenuConfig}
              viewMode={viewMode}
              onCellEdit={handleInlineCellEdit}
              emptyAction={<button className="btn-primary mt-2 h-9" onClick={() => setForm({ mode: 'create', record: blank() })}><Plus size={16} />Create Invoice</button>}
              headerExtra={
                <th className="w-[44px] min-w-[44px] max-w-[44px] text-center p-0 border-b border-[#CBD5E1] bg-[#F4F6F9]">
                  <ViewSettingsMenu
                    onManageColumns={() => setManageColsOpen(true)}
                    onResetColumnSize={() => {
                      localStorage.removeItem('zoho_finance_cols');
                      localStorage.removeItem('zoho_finance_pinned_cols');
                      setPinnedColumns([]);
                      setVisibleColumns(['Invoice Number', 'Account Name', 'Invoice Type', 'Invoice Date', 'Due Date', 'Amount', 'Paid Amount', 'Balance', 'Status']);
                    }}
                    pageSize={pageSize}
                    onPageSizeChange={(newSize) => {
                      setPageSize(newSize);
                      table.setPageSize(newSize);
                      try { localStorage.setItem('zoho_finance_page_size', String(newSize)); } catch (e) {}
                    }}
                    viewMode={viewMode}
                    onViewModeChange={(newMode) => {
                      setViewMode(newMode);
                      setWrapText(newMode === 'wrap');
                      try { localStorage.setItem('zoho_finance_view_mode', newMode); } catch (e) {}
                    }}
                  />
                </th>
              }
            />
          </div>
        )}

        {layout === 'chart' && <ChartView title="Invoice count by status (filtered)" data={INVOICE_STATUSES.map((s) => ({ name: s, value: filtered.filter((i) => i.status === s).length, color: STATUS_COLORS[s] }))} valueLabel="Invoices" />}

        {/* 5. Timeline View */}
        {layout === 'timeline' && (
          <FinanceTimelineView
            rows={table.sorted}
            accountName={accountName}
            onView={(id) => setViewing(id)}
            onEdit={(i) => setForm({ mode: 'edit', record: i })}
            onDelete={(i) => setConfirm({ ids: [i.id], label: i.number })}
            onRecordPayment={(id) => setPayFor(id)}
          />
        )}

        {/* 6. Split View */}
        {layout === 'split' && (
          <FinanceSplitView
            invoices={table.sorted}
            accountName={accountName}
            onView={(id) => setViewing(id)}
            onEdit={(i) => setForm({ mode: 'edit', record: i })}
            onDelete={(i) => setConfirm({ ids: [i.id], label: i.number })}
            onRecordPayment={(id) => setPayFor(id)}
            INVOICE_STATUSES={INVOICE_STATUSES}
            STATUS_COLORS={STATUS_COLORS}
          />
        )}

        {/* 7. Custom List View */}
        {layout === 'custom_list' && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 mx-3.5 my-3 bg-slate-50 border border-line rounded-xl text-[13px]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-primary" />
                <span className="font-semibold text-ink">Custom List View:</span>
                <span className="text-ink-500">Configure or manage custom list views with tailored column sets and filter criteria.</span>
              </div>
              <button
                type="button"
                onClick={() => setManageColsOpen(true)}
                className="btn-primary h-8 px-3 rounded-md text-[12.5px] font-semibold flex items-center gap-1.5"
              >
                <Settings2 size={13} />
                <span>Manage Columns</span>
              </button>
            </div>
            <DataTable
              columns={columns}
              rows={table.pageRows}
              table={table}
              showIndex={false}
              loading={refreshing}
              dense={dense}
              minWidth={1180}
              columnMenu={columnMenuConfig}
              viewMode={viewMode}
              emptyAction={<button className="btn-primary mt-2 h-9" onClick={() => setForm({ mode: 'create', record: blank() })}><Plus size={16} />Create Invoice</button>}
              headerExtra={
                <th className="th w-[44px] text-center p-0">
                  <ViewSettingsMenu
                    onManageColumns={() => setManageColsOpen(true)}
                    onResetColumnSize={() => {
                      localStorage.removeItem('zoho_finance_pinned_cols');
                      setPinnedColumns([]);
                    }}
                    hasCustomColumnSize={pinnedColumns.length > 0}
                    pageSize={pageSize}
                    onPageSizeChange={(sz) => {
                      setPageSize(sz);
                      localStorage.setItem('zoho_finance_page_size', sz);
                      table.setPage(1);
                    }}
                    viewMode={viewMode}
                    onViewModeChange={(mode) => {
                      setViewMode(mode);
                      localStorage.setItem('zoho_finance_view_mode', mode);
                    }}
                  />
                </th>
              }
            />
          </div>
        )}

        {/* 8. Tile View */}
        {layout === 'tile' && (
          <FinanceTileView
            rows={table.pageRows}
            accountName={accountName}
            onView={(id) => setViewing(id)}
            onEdit={(i) => setForm({ mode: 'edit', record: i })}
            onDelete={(i) => setConfirm({ ids: [i.id], label: i.number })}
            onRecordPayment={(id) => setPayFor(id)}
            onStatusChange={setStatus}
            INVOICE_STATUSES={INVOICE_STATUSES}
            STATUS_COLORS={STATUS_COLORS}
          />
        )}

        {/* 9. Table View */}
        {layout === 'table' && (
          <DataTable
            columns={columns}
            rows={table.pageRows}
            table={table}
            showIndex={false}
            loading={refreshing}
            dense={true}
            minWidth={1180}
            columnMenu={columnMenuConfig}
            viewMode={viewMode}
            emptyAction={<button className="btn-primary mt-2 h-9" onClick={() => setForm({ mode: 'create', record: blank() })}><Plus size={16} />Create Invoice</button>}
            headerExtra={
              <th className="th w-[44px] text-center p-0">
                <ViewSettingsMenu
                  onManageColumns={() => setManageColsOpen(true)}
                  onResetColumnSize={() => {
                    localStorage.removeItem('zoho_finance_pinned_cols');
                    setPinnedColumns([]);
                  }}
                  hasCustomColumnSize={pinnedColumns.length > 0}
                  pageSize={pageSize}
                  onPageSizeChange={(sz) => {
                    setPageSize(sz);
                    localStorage.setItem('zoho_finance_page_size', sz);
                    table.setPage(1);
                  }}
                  viewMode={viewMode}
                  onViewModeChange={(mode) => {
                    setViewMode(mode);
                    localStorage.setItem('zoho_finance_view_mode', mode);
                  }}
                />
              </th>
            }
          />
        )}

        {(['list', 'grid', 'tile', 'table', 'custom_list'].includes(layout)) && <div className="px-4"><Pagination table={table} noun="invoices" options={[10, 20, 30, 40, 50, 100]} /></div>}
      </section>
        </div>
      </div>

      <FormModal open={!!form} onClose={() => setForm(null)} title={form?.mode === 'edit' ? `Edit ${form.record.number}` : 'Create invoice'} subtitle="Balance and status are recalculated from the amount, payments and due date." fields={fields}
        initial={form?.record} onSubmit={submit} submitLabel={form?.mode === 'edit' ? 'Save changes' : 'Create invoice'} />
      <FormModal open={!!payInv} onClose={() => setPayFor(null)} size="sm" title="Record payment" subtitle={payInv && `${payInv.number} · balance ${fmtINR(balanceOf(payInv))}`}
        initial={payInv ? { amount: balanceOf(payInv), date: todayISO(), note: 'Bank transfer' } : null} submitLabel="Record payment"
        fields={[
          { name: 'amount', label: 'Amount received (₹)', type: 'number', min: 1, required: true, span: 2, validate: (v) => (payInv && Number(v) > balanceOf(payInv) ? `Can’t exceed the balance of ${fmtINR(balanceOf(payInv))}.` : '') },
          { name: 'date', label: 'Payment date', type: 'date', required: true },
          { name: 'note', label: 'Reference / mode' },
        ]}
        onSubmit={recordPayment} />
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} title="Delete invoices?" message={confirm ? `Delete ${confirm.label}? Finance totals and charts update immediately.` : ''}
        onConfirm={() => { deleteRecords('invoices', confirm.ids); table.clearSelection(); setViewing(null); }} />

      <Drawer open={!!rec} onClose={() => setViewing(null)} width={540}
        title={rec && <div><h2 className="text-[17px] font-semibold text-ink">{rec.number}</h2><p className="text-[13px] text-ink-500">{rec.type} · {accountName(rec.accountId)}</p></div>}
        footer={rec && (<>
          <button className="btn-secondary text-danger-700" onClick={() => setConfirm({ ids: [rec.id], label: rec.number })}><Trash2 size={15} />Delete</button>
          <button className="btn-secondary" disabled={balanceOf(rec) <= 0} onClick={() => setPayFor(rec.id)}><Wallet size={15} />Record payment</button>
          <button className="btn-primary" onClick={() => setForm({ mode: 'edit', record: rec })}><Pencil size={15} />Edit</button>
        </>)}>
        {rec && (
          <>
            <div className="rounded-xl border border-line p-4 bg-[#FAFCFF]">
              <div className="flex items-start justify-between">
                <div><div className="text-[12px] text-ink-500">Billed to</div><div className="text-[15px] font-semibold text-ink">{accountName(rec.accountId)}</div><div className="text-[12.5px] text-ink-500">{accountsById[rec.accountId]?.location}</div></div>
                <div className="text-right">
                  {statusMenu(rec, <button className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-[12.5px] font-medium ${badgeTone('invoiceStatus', rec.status)}`}>{rec.status}<ChevronDown size={13} /></button>)}
                  <div className="text-[12px] text-ink-500 mt-1.5">Issued {fmtDate(rec.invoiceDate)}</div><div className="text-[12px] text-ink-500">Due {fmtDate(rec.dueDate)}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                {[['Amount', rec.amount, 'text-ink'], ['Paid', rec.paidAmount, 'text-success-700'], ['Balance', balanceOf(rec), balanceOf(rec) ? 'text-danger-700' : 'text-ink']].map(([l, v, c]) => (
                  <div key={l} className="bg-white border border-line rounded-lg px-3 py-2"><div className="text-[11.5px] text-ink-500">{l}</div><div className={`text-[15px] font-semibold ${c}`}>{fmtINR(v)}</div></div>
                ))}
              </div>
              <div className="h-2 rounded-full bg-[#EEF2F8] mt-3 overflow-hidden"><div className="h-full bg-success" style={{ width: `${pct(rec.paidAmount, rec.amount)}%` }} /></div>
              <div className="text-[12px] text-ink-500 mt-1">{p0(pct(rec.paidAmount, rec.amount))} collected</div>
            </div>
            {rec.notes && <><SectionTitle>Notes</SectionTitle><p className="text-[13px] text-ink-600">{rec.notes}</p></>}
            <SectionTitle extra={<span className="text-[12px] text-ink-500">{(rec.payments || []).length}</span>}>Payment history</SectionTitle>
            {(rec.payments || []).length === 0 ? <p className="text-[13px] text-ink-500">No payments recorded yet.</p> : (
              <ul className="divide-y divide-line-soft border border-line rounded-lg">
                {[...rec.payments].reverse().map((p) => (
                  <li key={p.id} className="flex items-center justify-between px-3 py-2.5 text-[13px]"><span><span className="text-ink">{fmtDate(p.date)}</span><span className="text-ink-500"> · {p.note}</span></span><span className={`font-semibold ${p.amount < 0 ? 'text-danger-700' : 'text-success-700'}`}>{fmtINR(p.amount)}</span></li>
                ))}
              </ul>
            )}
            <p className="text-[12px] text-ink-400 mt-5">This is a standalone finance simulation inside the CRM. It is not connected to Zoho Finance.</p>
          </>
        )}
      </Drawer>
      <ManageColsModal
        open={manageColsOpen}
        visibleCols={visibleColumns}
        allColumns={ALL_COLUMNS}
        mandatoryCols={['Invoice Number']}
        onClose={() => setManageColsOpen(false)}
        onSave={(cols) => {
          setVisibleColumns(cols);
          localStorage.setItem('zoho_finance_cols', JSON.stringify(cols));
          setManageColsOpen(false);
        }}
      />

      <SaveFilterModal
        open={saveFilterModalOpen}
        onClose={() => setSaveFilterModalOpen(false)}
        onSave={handleSaveNewFilter}
        currentConfig={filterConfig}
        count={savedFilters.length}
        maxCount={MAX_SAVED_FILTERS}
      />

      <RenameFilterModal
        open={renameFilterModalOpen}
        onClose={() => {
          setRenameFilterModalOpen(false);
          setFilterToRename(null);
        }}
        filter={filterToRename}
        onRename={handleRenameSavedFilter}
      />

      <ConfirmDialog
        open={!!filterToDelete}
        onClose={() => setFilterToDelete(null)}
        title="Delete saved filter?"
        message={filterToDelete ? `Are you sure you want to delete "${filterToDelete.name}"? This action cannot be undone.` : ''}
        onConfirm={() => handleDeleteSavedFilter(filterToDelete?.id)}
      />
    </div>
  );
}
