import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarRange, ChevronDown, Clock3, Columns2, Columns3, Coins, Download, LayoutDashboard, LayoutGrid, List,
  PieChart, Plus, SlidersHorizontal, Table2, Trash2, Trophy, UserCog, XCircle, Search, Check, Settings2,
  Upload, FileSpreadsheet, Package, FileText, Printer, Bookmark, Edit2, GripVertical, X, Phone, Info
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useToast } from '../../components/common/Toast';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import FilterBar, { MoreFilters, SelectField } from '../../components/common/FilterBar';
import DataTable from '../../components/common/DataTable';
import SpreadsheetGridView from '../../components/common/SpreadsheetGridView';
import Pagination from '../../components/common/Pagination';
import useTable from '../../components/common/useTable';
import StatusBadge, { badgeTone } from '../../components/common/StatusBadge';
import { UserAvatar } from '../../components/common/Avatar';
import FormModal from '../../components/common/RecordForm';
import ConfirmDialog from '../../components/common/ConfirmDialog';

import Dropdown, { MenuItem, MenuLabel, MenuDivider } from '../../components/common/Dropdown';
import ViewSettingsMenu from '../../components/common/ViewSettingsMenu';
import BulkBar, { BulkButton } from '../../components/common/BulkBar';
import { ChartView, GridView, KanbanView } from '../../components/common/Views';
import DealDetail from './DealDetail';
import CreateDeal from './CreateDeal';
import TileView from './TileView';
import TimelineView from './TimelineView';
import SplitView from './SplitView';
import CustomViewsModal from './CustomViewsModal';
import SheetViewModal from './SheetViewModal';
import PrintViewModal from './PrintViewModal';
import ImportModal from './ImportModal';
import SystemFilterControls, { getDefaultSystemFilterConfig, evaluateSystemFilter } from './SystemFilterControls';
import { useRefresh, useUrlActions } from '../../components/common/hooks';
import { DEAL_SOURCES, DEPARTMENTS } from '../../data/seedData';
import {
  OPEN_STAGES, STAGES, STAGE_COLORS, STAGE_TEXT_COLORS, STAGE_PROBABILITY, dealKpis, fmtCompact, fmtDate, fmtDateTime, fmtINR, inRange, isOpen, sumBy, todayISO, trend,
} from '../../utils/calculations';
import { exportCSV } from '../../utils/exportCSV';

const DEFAULT_RANGE = { from: '2026-01-01', to: '2026-12-31' };
const BAR = STAGE_COLORS;

const ALL_COLUMNS = [
  'Activity Badge', 'Note Badge', 'Created Time', 'Categories', 'Deal Name', 'Mobile', 'Remarks', 'Lead Manager 1', 'Stage', 'Amount', 'City', 'Tag', 'Reason for Closed lost', 'Last Activity Time', 'Sales_ No', 'Deal Owner', 'Previous Pending Estimations', 'Closed Won date', 'Closing Date', 'Lead Source', 'Purpose Of translation', 'Job type', 'Contact Name', 'Account Name', 'Type', 'Probability (%)', 'Campaign Source', 'Created By', 'Modified By', 'Modified Time', 'Description', 'Expected Revenue', 'Lead Conversion Time', 'Sales Cycle Duration', 'Overall Sales Duration', 'Forecast Category', 'Territory', 'Client Name', 'Estimation created by', 'Category', 'Connected To', 'Delivery Date and time', 'Tracking Number', 'Draft copy', 'Service Provider', 'Soft copy', 'Source Language List', 'Target Language List', 'Invoice_No', 'Est_NO', 'Without GST', 'GST Amount', 'Project Requirements', 'Mobile No', 'Deal Approval Status', 'Revenue projections Prediction', 'Approval sent time', 'Linxon Vendor/ Supplier Name', 'Comments', 'Closed Won Approval', 'EST Ready', 'Closed Lost Approval', 'Previous Stage', 'Deal Aging', 'Others(Specify)', 'Linxon Approval', 'Client Budget', 'Incentive Amount', 'Wizard', 'Delivery type', 'Submission Status', 'Deal suggestions', 'Language Class Info', 'Overseas Educations Info', 'Deal Activity aging', 'Hanioo Onboarded Date & Time', 'Hanioo Not Interested Reason', 'Hanioo Discussion Notes', 'Hanioo Re-Approval Status', 'Total Call Duration', 'Total Call Count'
];

function ManageColsModal({ open, onClose, visibleCols, onSave }) {
  const [search, setSearch] = useState('');
  const [selectedList, setSelectedList] = useState([]);
  const [unselectedList, setUnselectedList] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);

  useEffect(() => {
    if (open) {
      const currentSelected = [...visibleCols];
      if (!currentSelected.includes('Deal Name')) {
        currentSelected.unshift('Deal Name');
      }
      const currentUnselected = ALL_COLUMNS.filter(c => !currentSelected.includes(c));
      setSelectedList(currentSelected);
      setUnselectedList(currentUnselected);
      setSearch('');
      setDraggedIndex(null);
    }
  }, [open, visibleCols]);

  if (!open) return null;

  const handleToggleColumn = (col, isCurrentlySelected) => {
    if (col === 'Deal Name') return;

    if (isCurrentlySelected) {
      // Move from selected group to unselected group
      setSelectedList(prev => prev.filter(c => c !== col));
      setUnselectedList(prev => (prev.includes(col) ? prev : [...prev, col]));
    } else {
      // Move from unselected group to end of selected group
      setUnselectedList(prev => prev.filter(c => c !== col));
      setSelectedList(prev => (prev.includes(col) ? prev : [...prev, col]));
    }
  };

  const handleDragStart = (e, idx) => {
    setDraggedIndex(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetIdx) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIdx) return;
    setSelectedList(prev => {
      const next = [...prev];
      const [moved] = next.splice(draggedIndex, 1);
      next.splice(targetIdx, 0, moved);
      return next;
    });
    setDraggedIndex(null);
  };

  const sQuery = search.trim().toLowerCase();
  const filteredSelected = sQuery ? selectedList.filter(c => c.toLowerCase().includes(sQuery)) : selectedList;
  const filteredUnselected = sQuery ? unselectedList.filter(c => c.toLowerCase().includes(sQuery)) : unselectedList;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-[440px] max-w-full flex flex-col max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-[16px] font-semibold text-primary">Manage Columns</h2>
            <span className="text-[12px] text-ink-500 bg-page px-2 py-0.5 rounded border border-line">
              {selectedList.length} Selected
            </span>
          </div>
          <button type="button" onClick={onClose} className="text-ink-400 hover:text-ink-700">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 border-b border-line bg-page/40">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-ink-400" size={16} />
            <input
              type="text"
              placeholder="Search columns..."
              className="w-full h-9 pl-9 pr-3 text-[14px] border border-line rounded-md bg-white focus:border-primary outline-none"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 thin-scroll">
          {/* Selected Columns group at the TOP */}
          {filteredSelected.length > 0 && (
            <div>
              <div className="text-[12px] font-bold text-ink-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Selected Columns ({filteredSelected.length})</span>
                <span className="text-[11px] font-normal lowercase text-ink-400">drag handle to reorder</span>
              </div>
              <div className="space-y-1.5">
                {filteredSelected.map((c) => {
                  const isMandatory = c === 'Deal Name';
                  const origIdx = selectedList.indexOf(c);
                  return (
                    <div
                      key={c}
                      draggable={!sQuery}
                      onDragStart={(e) => handleDragStart(e, origIdx)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, origIdx)}
                      className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md border border-line bg-white hover:bg-page transition-colors select-none ${draggedIndex === origIdx ? 'opacity-50 border-dashed border-primary' : ''}`}
                    >
                      <div className="text-ink-400 cursor-grab active:cursor-grabbing hover:text-ink-700" title="Drag to reorder">
                        <GripVertical size={14} />
                      </div>
                      <label className="flex items-center gap-2.5 flex-1 cursor-pointer">
                        <input
                          type="checkbox"
                          className="cb"
                          disabled={isMandatory}
                          checked={true}
                          onChange={() => handleToggleColumn(c, true)}
                        />
                        <span className="text-[13.5px] font-medium text-ink flex-1">
                          {c}{isMandatory && <span className="text-red-500 ml-0.5">*</span>}
                        </span>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Divider between selected and unselected */}
          {filteredSelected.length > 0 && filteredUnselected.length > 0 && (
            <div className="border-t border-line my-3" />
          )}

          {/* Unselected Columns group BELOW selected columns */}
          {filteredUnselected.length > 0 && (
            <div>
              <div className="text-[12px] font-bold text-ink-500 uppercase tracking-wider mb-2">
                Available Columns ({filteredUnselected.length})
              </div>
              <div className="space-y-1.5">
                {filteredUnselected.map((c) => (
                  <div
                    key={c}
                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md border border-line/60 bg-page/30 hover:bg-page transition-colors select-none"
                  >
                    <div className="w-[14px]" />
                    <label className="flex items-center gap-2.5 flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        className="cb"
                        checked={false}
                        onChange={() => handleToggleColumn(c, false)}
                      />
                      <span className="text-[13.5px] text-ink-700 flex-1">
                        {c}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredSelected.length === 0 && filteredUnselected.length === 0 && (
            <div className="text-center py-8 text-ink-400 text-[13px]">
              No columns match &quot;{search}&quot;
            </div>
          )}
        </div>

        <div className="p-4 border-t border-line flex items-center justify-end gap-3 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary h-8 px-4 rounded text-[13px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(selectedList)}
            className="btn-primary h-8 px-5 rounded text-[13px]"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

const MAX_SAVED_FILTERS = 10;

const DEFAULT_SAVED_FILTERS = [
  {
    id: 'sf-1',
    name: 'Open Deals',
    config: { 'Stage': { op: 'Is Not', val: 'Closed Won' } },
    fields: ['Stage'],
  },
  {
    id: 'sf-2',
    name: 'Closing Soon',
    config: { 'Closing Date': { op: 'Before', val: '2026-12-31' } },
    fields: ['Closing Date'],
  },
];

function SaveFilterModal({ open, onClose, onSave, currentConfig, count, maxCount }) {
  const [filterName, setFilterName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setFilterName('');
      setError('');
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = filterName.trim();
    if (!trimmed) {
      setError('Filter name is required');
      return;
    }
    if (count >= maxCount) {
      setError(`Maximum ${maxCount} saved filters allowed.`);
      return;
    }
    onSave(trimmed);
  };

  const activeEntries = Object.entries(currentConfig || {}).filter(
    ([, conf]) => conf && (conf.val || conf.op === 'Is Empty')
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-[400px] max-w-full flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-line flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-primary">Save Filter</h2>
          <button type="button" onClick={onClose} className="text-ink-400 hover:text-ink-700">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-ink-700 mb-1">
              Filter Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              placeholder="e.g. High Value Active Deals"
              className="w-full h-9 px-3 text-[14px] border border-line rounded-md focus:border-primary outline-none"
              value={filterName}
              onChange={(e) => {
                setFilterName(e.target.value);
                if (error) setError('');
              }}
            />
            {error && <span className="text-[12px] text-red-500 mt-1 block">{error}</span>}
          </div>

          <div>
            <span className="text-[12px] font-semibold text-ink-500 uppercase tracking-wider block mb-1.5">
              Filter Conditions ({activeEntries.length})
            </span>
            <div className="bg-page/70 rounded-md p-2.5 max-h-[140px] overflow-y-auto space-y-1 thin-scroll border border-line text-[12.5px] text-ink-700">
              {activeEntries.length === 0 ? (
                <div className="text-ink-400">All current filter fields will be saved.</div>
              ) : (
                activeEntries.map(([field, conf]) => (
                  <div key={field} className="flex items-center justify-between">
                    <span className="font-medium text-ink">{field}:</span>
                    <span className="text-ink-500">{conf.op} {conf.val ? `"${conf.val}"` : ''}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="text-[12px] text-ink-400 flex justify-between items-center">
            <span>Saved Filters:</span>
            <span className="font-semibold text-ink-600">{count} / {maxCount}</span>
          </div>

          <div className="pt-2 border-t border-line flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary h-8 px-4 rounded text-[13px]">
              Cancel
            </button>
            <button
              type="submit"
              disabled={count >= maxCount}
              className="btn-primary h-8 px-5 rounded text-[13px] disabled:opacity-50"
            >
              Save Filter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RenameFilterModal({ open, onClose, filter, onRename }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && filter) {
      setName(filter.name || '');
      setError('');
    }
  }, [open, filter]);

  if (!open || !filter) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Filter name is required');
      return;
    }
    onRename(filter.id, trimmed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-[380px] max-w-full flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-line flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-primary">Rename Filter</h2>
          <button type="button" onClick={onClose} className="text-ink-400 hover:text-ink-700">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-ink-700 mb-1">
              Filter Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              className="w-full h-9 px-3 text-[14px] border border-line rounded-md focus:border-primary outline-none"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
            />
            {error && <span className="text-[12px] text-red-500 mt-1 block">{error}</span>}
          </div>
          <div className="pt-2 border-t border-line flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary h-8 px-4 rounded text-[13px]">
              Cancel
            </button>
            <button type="submit" className="btn-primary h-8 px-5 rounded text-[13px]">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const SYSTEM_FILTERS = ['Activities', 'Email Sentiment', 'Latest Email Status', 'Locked', 'Record Action', 'Related Records Action', 'Scoring Rules', 'Touched Records', 'Untouched Records', 'Cadences'];
const FIELD_FILTERS = ['Account Name', 'Amount', 'Approval sent time', 'Campaign Source', 'Categories', 'Category', 'City', 'Client Budget', 'Client Name', 'Closed Lost Approval', 'Closed Won Approval', 'Closed Won date', 'Closing Date', 'Comments', 'Connected To', 'Contact Name', 'Created By', 'Created Time', 'Deal Activity aging', 'Deal Aging', 'Deal Approval Status', 'Deal Name', 'Deal Owner', 'Delivery Date and time', 'Delivery type', 'Draft copy', 'EST Ready', 'Estimation created by', 'Est_NO', 'Expected Revenue', 'Forecast Category', 'GST Amount', 'Hanioo Discussion Notes', 'Hanioo Not Interested Reason', 'Hanioo Onboarded Date & Time', 'Hanioo Re-Approval Status', 'Incentive Amount', 'Invoice_No', 'Job type', 'Language Class Info', 'Last Activity Time', 'Lead Conversion Time', 'Lead Manager 1', 'Lead Source', 'Linxon Approval', 'Linxon Vendor/Supplier Name', 'Mobile', 'Mobile No', 'Modified By', 'Modified Time', 'Others(Specify)', 'Overall Sales Duration', 'Overseas Educations Info', 'Previous Pending Estimations', 'Previous Stage', 'Probability (%)', 'Project Requirements', 'Purpose Of translation', 'Reason for Closed lost', 'Remarks', 'Revenue projections Prediction', 'Sales Cycle Duration', 'Sales_No', 'Service Provider', 'Soft copy', 'Source Language List', 'Stage', 'Submission Status', 'Tag', 'Target Language List', 'Total Call Count', 'Total Call Duration', 'Tracking Number', 'Type', 'Without GST', 'Wizard'];
const SUBFORM_FILTERS = ['Estimation creations'];
const RELATED_MODULE_FILTERS = ['Accounts (Connected Records)', 'Anomaly (Anomaly Deals)', 'Approval Logs (Approval Process-Approval Summary)', 'Calls', 'Cases', 'Deal Contact Role (Contact Roles)', 'Deal Product Relation (Products)', 'Emails', 'Estimates (Estimate Potentials)', 'Invoices (Invoice Potentials)', 'Leads (Converted Leads)', 'Meetings', 'Notes', 'Sales Orders (Sales Order Potentials)', 'Tasks', 'Whatsapp messages', 'Zoho Sign Documents (ZohoSign Documents)'];

const FILTER_TYPES = {
  Text: ['Contains', 'Equals', 'Starts With', 'Is Empty'],
  Number: ['Equals', 'Greater Than', 'Less Than', 'Between'],
  Date: ['Before', 'After', 'Between'],
  Dropdown: ['Is', 'Is Not', 'In']
};

const getFieldType = (name) => {
  if (name.includes('Date') || name.includes('Time') || name.includes('aging') || name.includes('Duration')) return 'Date';
  if (name.includes('Amount') || name.includes('Probability') || name.includes('Count') || name.includes('Revenue') || name.includes('Budget')) return 'Number';
  if (['Stage', 'Deal Owner', 'Account Name', 'Contact Name', 'Deal Source', 'Department', 'Type'].includes(name)) return 'Dropdown';
  return 'Text';
};

const resolveFieldName = (colKey, column) => {
  const colName = column?.colName || column?.header || colKey;
  if (FIELD_FILTERS.includes(colName)) return colName;
  if (SYSTEM_FILTERS.includes(colName)) return colName;
  if (SUBFORM_FILTERS.includes(colName)) return colName;
  if (RELATED_MODULE_FILTERS.includes(colName)) return colName;

  const aliasMap = {
    'name': 'Deal Name',
    'Deal Name': 'Deal Name',
    'account': 'Account Name',
    'accountId': 'Account Name',
    'Account Name': 'Account Name',
    'contact': 'Contact Name',
    'contactId': 'Contact Name',
    'Contact Name': 'Contact Name',
    'stage': 'Stage',
    'Stage': 'Stage',
    'amount': 'Amount',
    'Amount': 'Amount',
    'Amount (₹)': 'Amount',
    'closingDate': 'Closing Date',
    'Closing Date': 'Closing Date',
    'probability': 'Probability (%)',
    'Probability (%)': 'Probability (%)',
    'owner': 'Deal Owner',
    'ownerId': 'Deal Owner',
    'Deal Owner': 'Deal Owner',
    'createdOn': 'Created Time',
    'Created Time': 'Created Time',
    'source': 'Lead Source',
    'Lead Source': 'Lead Source',
    'description': 'Description',
    'Description': 'Description',
    'Department': 'Department',
  };

  if (aliasMap[colKey]) return aliasMap[colKey];
  if (aliasMap[colName]) return aliasMap[colName];

  const allKnown = [...FIELD_FILTERS, ...SYSTEM_FILTERS, ...SUBFORM_FILTERS, ...RELATED_MODULE_FILTERS];
  const found = allKnown.find(f => f.toLowerCase() === String(colName).toLowerCase() || f.toLowerCase() === String(colKey).toLowerCase());
  if (found) return found;

  return colName;
};

export function stagePatch(deal, stage) {
  const patch = { stage, probability: STAGE_PROBABILITY[stage] };
  if (stage === 'Closed Lost') patch.lostAtStage = isOpen(deal) ? deal.stage : deal.lostAtStage || 'Need Deal Estimation';
  else patch.lostAtStage = '';
  return patch;
}

function Probability({ deal }) {
  const c = BAR[deal.stage];
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-[54px] h-[14px] rounded-[3px] bg-[#EEF2F8] overflow-hidden"><div className="h-full rounded-[3px]" style={{ width: `${deal.probability}%`, background: c }} /></div>
      <span className="text-[12.5px] font-medium w-9" style={{ color: deal.probability === 100 ? '#0E9F5E' : c }}>{deal.probability}%</span>
    </div>
  );
}

function monthly(rows) {
  return [6, 7, 8, 9, 10].map((m) => rows.filter((d) => Number(d.createdOn.slice(5, 7)) <= m).length + 1);
}

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

export default function Deals() {
  const { deals, oldDeals, accounts, contacts, users, tasks, calls, activity, accountName, contactName, userName, createRecord, updateRecord, deleteRecords, accountsById } = useCRM();
  const toast = useToast();
  const contactsById = useMemo(() => Object.fromEntries(contacts.map((c) => [c.id, c])), [contacts]);
  const navigate = useNavigate();
  const { refreshing, refresh } = useRefresh('Deals');
  const [savedView, setSavedView] = useState('all');

  // Exactly 6 visible icons in toolbar
  const [visibleViews, setVisibleViews] = useState(() => {
    try {
      const saved = localStorage.getItem('deals_visible_views');
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
    const saved = localStorage.getItem('deals_layout');
    if (saved && ALL_9_VIEWS.some((v) => v.key === saved)) {
      return saved;
    }
    return 'list';
  });

  const setLayout = (l) => {
    setLayoutState(l);
    try {
      localStorage.setItem('deals_layout', l);
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
        localStorage.setItem('deals_visible_views', JSON.stringify(nextVisible));
      } catch (e) {}
      return nextVisible;
    });

    setLayout(dropdownKey);
  };

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importType, setImportType] = useState('deals');
  const [sheetViewOpen, setSheetViewOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printMode, setPrintMode] = useState('default');

  const handleImportDeals = (newDeals) => {
    newDeals.forEach((d) => createRecord('deals', d));
    table.setPage(1);
  };

  const handleImportDealsProducts = (newDealsWithProducts) => {
    newDealsWithProducts.forEach((d) => createRecord('deals', d));
    table.setPage(1);
  };

  const handleImportNotes = (notesList) => {
    notesList.forEach((n) => {
      if (n.dealId) {
        const deal = deals.find((d) => d.id === n.dealId);
        if (deal) {
          const prevNotes = deal.notes || [];
          updateRecord('deals', deal.id, {
            notes: [...prevNotes, { id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, title: n.title, content: n.content, date: n.date }],
          });
        }
      }
    });
  };

  const handleSaveSheetUpdates = (updatedRows) => {
    updatedRows.forEach((r) => {
      if (r.isNew) {
        const { isNew, ...rest } = r;
        createRecord('deals', rest);
      } else {
        updateRecord('deals', r.id, r);
      }
    });
  };
  const [dense, setDense] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [search, setSearch] = useState('');
  const [range, setRange] = useState(DEFAULT_RANGE);
  const [filterSearch, setFilterSearch] = useState('');
  const [selectedFields, setSelectedFields] = useState(new Set(['Stage', 'Deal Owner', 'Account Name', 'Deal Source']));
  const [filterConfig, setFilterConfig] = useState({
    'Stage': { op: 'Is', val: '' },
    'Deal Owner': { op: 'Is', val: '' },
    'Account Name': { op: 'Is', val: '' },
    'Deal Source': { op: 'Is', val: '' },
  });
  const [appliedFilters, setAppliedFilters] = useState({});
  const [savedFilters, setSavedFilters] = useState(() => {
    try {
      const saved = localStorage.getItem('deals_saved_filters');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_SAVED_FILTERS;
  });
  const [activeSavedFilterId, setActiveSavedFilterId] = useState(null);
  const [saveFilterModalOpen, setSaveFilterModalOpen] = useState(false);
  const [renameFilterModalOpen, setRenameFilterModalOpen] = useState(false);
  const [filterToRename, setFilterToRename] = useState(null);
  const [filterToDelete, setFilterToDelete] = useState(null);
  const [viewSearch, setViewSearch] = useState('');
  
  const [pageSize, setPageSize] = useState(() => {
    try {
      const saved = localStorage.getItem('deals_page_size');
      if (saved) return Number(saved);
    } catch (e) {}
    return 100;
  });
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('deals_view_mode') || 'wrap';
    } catch (e) {
      return 'wrap';
    }
  });
  const [wrapText, setWrapText] = useState(viewMode === 'wrap');
  const [manageColsOpen, setManageColsOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('deals_cols');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return ['Created Time', 'Categories', 'Deal Name', 'Mobile', 'Remarks', 'Lead Manager 1', 'Stage', 'Deal Owner', 'Amount', 'Closing Date'];
  });

  const [pinnedColumns, setPinnedColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('deals_pinned_cols');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

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
        localStorage.setItem('deals_pinned_cols', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const handleHideColumn = (colKey, col) => {
    const targetName = col?.colName || col?.header || colKey;
    const colToHide = visibleColumns.find((c) => c === targetName || c === colKey || c === col?.header) || targetName;
    if (colToHide === 'Deal Name') return;
    const nextCols = visibleColumns.filter((c) => c !== colToHide);
    setVisibleColumns(nextCols);
    try {
      localStorage.setItem('deals_cols', JSON.stringify(nextCols));
    } catch (e) {}
  };

  const [customViewsModalOpen, setCustomViewModalOpen] = useState(false);
  const [customViews, setCustomViews] = useState(() => {
    try {
      const saved = localStorage.getItem('deals_custom_views');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'cv_high_value',
        name: 'High Value Deals',
        description: 'Deals worth ₹10,00,000 or more',
        columns: ['Deal Name', 'Account Name', 'Amount', 'Stage', 'Closing Date', 'Probability (%)', 'Deal Owner'],
        rules: [{ field: 'Amount', op: 'Greater Than', val: '1000000' }],
      },
      {
        id: 'cv_closing_soon',
        name: 'Closing This Quarter',
        description: 'Deals closing before end of year',
        columns: ['Deal Name', 'Account Name', 'Closing Date', 'Stage', 'Amount', 'Deal Owner'],
        rules: [{ field: 'Closing Date', op: 'Before', val: '2026-12-31' }],
      },
    ];
  });
  const [activeCustomView, setActiveCustomView] = useState(null);
  const [splitSelectedId, setSplitSelectedId] = useState(() => {
    return localStorage.getItem('split_view_deal_id') || null;
  });
  const handleSplitSelect = (id) => {
    setSplitSelectedId(id);
    try {
      localStorage.setItem('split_view_deal_id', id);
    } catch (e) {}
  };

  const handleSaveCustomView = (newOrUpdatedView) => {
    setCustomViews(prev => {
      const idx = prev.findIndex(v => v.id === newOrUpdatedView.id);
      let next;
      if (idx >= 0) {
        next = [...prev];
        next[idx] = newOrUpdatedView;
      } else {
        next = [...prev, newOrUpdatedView];
      }
      localStorage.setItem('deals_custom_views', JSON.stringify(next));
      return next;
    });
    if (activeCustomView?.id === newOrUpdatedView.id) {
      setActiveCustomView(newOrUpdatedView);
      if (newOrUpdatedView.columns?.length) {
        setVisibleColumns(newOrUpdatedView.columns);
      }
    }
  };

  const handleDeleteCustomView = (id) => {
    setCustomViews(prev => {
      const next = prev.filter(v => v.id !== id);
      localStorage.setItem('deals_custom_views', JSON.stringify(next));
      return next;
    });
    if (activeCustomView?.id === id) {
      setActiveCustomView(null);
    }
  };

  const handleSelectCustomView = (cv) => {
    setActiveCustomView(cv);
    if (cv.columns?.length) {
      setVisibleColumns(cv.columns);
    }
    setLayout('list');
    table.setPage(1);
  };

  const [form, setForm] = useState(null);
  const [viewing, setViewing] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('open') || null;
  });

  const openDeal = (id) => {
    setViewing(id);
    const sp = new URLSearchParams(window.location.search);
    sp.set('open', id);
    window.history.replaceState(null, '', `${window.location.pathname}?${sp.toString()}`);
  };

  const closeDeal = () => {
    setViewing(null);
    setQuick(null);
    const sp = new URLSearchParams(window.location.search);
    sp.delete('open');
    const q = sp.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${q ? `?${q}` : ''}`);
  };

  useEffect(() => {
    const onPop = () => {
      const sp = new URLSearchParams(window.location.search);
      setViewing(sp.get('open') || null);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const [confirm, setConfirm] = useState(null);
  const [bulk, setBulk] = useState(null);
  const [quick, setQuick] = useState(null);

  const allViews = [
    { category: 'Public Views', key: 'all', label: 'All Deals', test: () => true },
    { category: 'Public Views', key: 'locked', label: 'All Locked Deals', test: (d) => false },
    { category: 'Public Views', key: 'approval', label: 'Approval Pendings', test: (d) => false },
    { category: 'Public Views', key: 'closingNext', label: 'Closing Next Month', test: (d) => false },
    { category: 'Public Views', key: 'closing', label: 'Closing This Month', test: (d) => isOpen(d) && d.closingDate.slice(0, 7) === todayISO().slice(0, 7) },
    { category: 'Public Views', key: 'coOwner', label: 'Co-Owner Deals', test: (d) => false },
    { category: 'Public Views', key: 'amountEmpty', label: 'Deal Amount Empty', test: (d) => !d.amount },
    { category: 'Public Views', key: 'sharedByMe', label: 'Deals Shared by Me', test: (d) => false },
    { category: 'Public Views', key: 'sharedToMe', label: 'Deals Shared to Me', test: (d) => false },
    { category: 'My Deals', key: 'mine', label: 'My Deals', test: (d) => d.ownerId === 'u1' },
    { category: 'My Deals', key: 'newLastWeek', label: 'New Last Week', test: (d) => false },
    { category: 'My Deals', key: 'newThisWeek', label: 'New This Week', test: (d) => false },
    { category: 'My Deals', key: 'recentCreated', label: 'Recently Created Deals', test: (d) => false },
    { category: 'My Deals', key: 'recentModified', label: 'Recently Modified Deals', test: (d) => false },
    { category: 'My Deals', key: 'unread', label: 'Unread Deals', test: (d) => false },
  ];

  const views = [
    { key: 'all', label: 'All Deals', test: () => true },
    { key: 'mine', label: 'My Deals', test: (d) => d.ownerId === 'u1' },
  ].map((v) => ({ ...v, count: deals.filter(v.test).length }));
  
  const viewTest = allViews.find((v) => v.key === savedView)?.test;

  const dealAccounts = useMemo(() => {
    const ids = new Set(deals.map((d) => d.accountId));
    return accounts.filter((a) => ids.has(a.id)).sort((a, b) => a.name.localeCompare(b.name)).map((a) => ({ value: a.id, label: a.name }));
  }, [deals, accounts]);
  
  const ownerOptions = useMemo(() => users.map((u) => ({ value: u.id, label: u.name })), [users]);
  
  const filterOptionsContext = useMemo(() => ({
    'Stage': STAGES.map(s => ({ value: s, label: s })),
    'Deal Owner': ownerOptions,
    'Account Name': dealAccounts,
    'Deal Source': DEAL_SOURCES.map(s => ({ value: s, label: s })),
    'Department': DEPARTMENTS.map(s => ({ value: s, label: s })),
  }), [ownerOptions, dealAccounts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return deals.filter((d) => {
      if (viewTest && !viewTest(d)) return false;
      if (!inRange(d.createdOn, range)) return false;
      if (q && ![d.name, accountName(d.accountId), contactName(d.contactId), userName(d.ownerId)].some((v) => String(v).toLowerCase().includes(q))) return false;
      
      // Apply dynamic filters
      for (const [key, conf] of Object.entries(appliedFilters)) {
        if (!conf) continue;

        if (SYSTEM_FILTERS.includes(key)) {
          const passed = evaluateSystemFilter(d, key, conf, {
            calls: calls || [],
            tasks: tasks || [],
            activity: activity || [],
            contacts: contacts || [],
            users: users || []
          });
          if (!passed) return false;
          continue;
        }

        if (!conf.val && conf.op !== 'Is Empty') continue; // Skip if no value selected
        
        let recordVal = '';
        if (key === 'Stage' || key === 'stage') recordVal = d.stage;
        else if (key === 'Deal Owner' || key === 'owner') recordVal = d.ownerId;
        else if (key === 'Account Name' || key === 'account') recordVal = d.accountId;
        else if (key === 'Contact Name' || key === 'contact') recordVal = contactName(d.contactId);
        else if (key === 'Deal Name' || key === 'name') recordVal = d.name;
        else if (key === 'Deal Source' || key === 'source') recordVal = d.source;
        else if (key === 'Department') recordVal = d.department;
        else if (key === 'Amount' || key === 'amount') recordVal = Number(d.amount) || 0;
        else if (key === 'Closing Date' || key === 'closingDate') recordVal = d.closingDate;
        else if (key === 'Probability (%)' || key === 'probability') recordVal = Number(d.probability) || 0;
        else if (key === 'Created Time' || key === 'createdOn') recordVal = d.createdOn;
        else if (key === 'Description' || key === 'description') recordVal = d.description || '';
        else continue;
        
        const type = getFieldType(key);
        if (type === 'Dropdown') {
          const matchVal = (val) => String(recordVal).toLowerCase() === String(val).toLowerCase() ||
            (key.includes('Account') && accountName(d.accountId).toLowerCase() === String(val).toLowerCase()) ||
            (key.includes('Owner') && userName(d.ownerId).toLowerCase() === String(val).toLowerCase());
          if (conf.op === 'Is' && !matchVal(conf.val)) return false;
          if (conf.op === 'Is Not' && matchVal(conf.val)) return false;
        } else if (type === 'Number') {
          const rNum = Number(recordVal) || 0;
          const valNum = Number(conf.val);
          if (conf.op === 'Equals' && rNum !== valNum) return false;
          if (conf.op === 'Greater Than' && rNum <= valNum) return false;
          if (conf.op === 'Less Than' && rNum >= valNum) return false;
          if (conf.op === 'Between' && conf.val2) {
            if (rNum < valNum || rNum > Number(conf.val2)) return false;
          }
        } else if (type === 'Text') {
          const rStr = String(recordVal).toLowerCase();
          const vStr = String(conf.val || '').toLowerCase();
          if (conf.op === 'Contains' && !rStr.includes(vStr)) return false;
          if (conf.op === 'Equals' && rStr !== vStr) return false;
          if (conf.op === 'Starts With' && !rStr.startsWith(vStr)) return false;
          if (conf.op === 'Is Empty' && rStr.length > 0) return false;
        } else if (type === 'Date') {
          if (conf.op === 'Before' && recordVal >= conf.val) return false;
          if (conf.op === 'After' && recordVal <= conf.val) return false;
          if (conf.op === 'Between' && conf.val2) {
            if (recordVal < conf.val || recordVal > conf.val2) return false;
          }
        }
      }

      // Apply active custom view rules
      if (activeCustomView?.rules?.length) {
        for (const rule of activeCustomView.rules) {
          if (!rule.field || rule.val === '') continue;
          let rVal = '';
          if (rule.field === 'Stage') rVal = d.stage;
          else if (rule.field === 'Deal Owner') rVal = d.ownerId;
          else if (rule.field === 'Account Name') rVal = d.accountId;
          else if (rule.field === 'Deal Source') rVal = d.source;
          else if (rule.field === 'Department') rVal = d.department;
          else if (rule.field === 'Amount') rVal = Number(d.amount) || 0;
          else if (rule.field === 'Probability (%)') rVal = Number(d.probability) || 0;
          else if (rule.field === 'Closing Date') rVal = d.closingDate;
          else if (rule.field === 'Deal Name') rVal = d.name;

          if (rule.op === 'Is' || rule.op === 'Equals') {
            if (typeof rVal === 'number') {
              if (rVal !== Number(rule.val)) return false;
            } else {
              if (String(rVal).toLowerCase() !== String(rule.val).toLowerCase()) return false;
            }
          } else if (rule.op === 'Is Not') {
            if (String(rVal).toLowerCase() === String(rule.val).toLowerCase()) return false;
          } else if (rule.op === 'Greater Than') {
            if (Number(rVal) <= Number(rule.val)) return false;
          } else if (rule.op === 'Less Than') {
            if (Number(rVal) >= Number(rule.val)) return false;
          } else if (rule.op === 'Contains') {
            if (!String(rVal).toLowerCase().includes(String(rule.val).toLowerCase())) return false;
          } else if (rule.op === 'Starts With') {
            if (!String(rVal).toLowerCase().startsWith(String(rule.val).toLowerCase())) return false;
          } else if (rule.op === 'Before') {
            if (rVal >= rule.val) return false;
          } else if (rule.op === 'After') {
            if (rVal <= rule.val) return false;
          }
        }
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deals, search, range, appliedFilters, savedView, activeCustomView, accountName, contactName, userName, calls, tasks, activity, contacts, users]);

  const accessors = useMemo(() => ({ account: (d) => accountName(d.accountId), contact: (d) => contactName(d.contactId), owner: (d) => userName(d.ownerId), stage: (d) => STAGES.indexOf(d.stage) }), [accountName, contactName, userName]);
  const table = useTable(filtered, { accessors, pageSize });
  const reset = () => { setAppliedFilters({}); setFilterConfig({}); setSelectedFields(new Set()); setSearch(''); setRange(DEFAULT_RANGE); setSavedView('all'); setActiveCustomView(null); setActiveSavedFilterId(null); };
  const moreCount = Object.keys(appliedFilters).length;

  const handleFilterColumn = (colKey, filterState, col) => {
    const targetName = col?.colName || col?.header || colKey;
    const fieldName = visibleColumns.find((c) => c === targetName || c === colKey || c === col?.header) || targetName;
    if (!filterState || (!filterState.val && filterState.op !== 'Is Empty')) {
      setAppliedFilters((prev) => {
        const next = { ...prev };
        delete next[fieldName];
        delete next[colKey];
        if (col?.header) delete next[col.header];
        return next;
      });
      setFilterConfig((prev) => {
        const next = { ...prev };
        delete next[fieldName];
        delete next[colKey];
        if (col?.header) delete next[col.header];
        return next;
      });
    } else {
      setAppliedFilters((prev) => ({
        ...prev,
        [fieldName]: filterState,
      }));
      setFilterConfig((prev) => ({
        ...prev,
        [fieldName]: filterState,
      }));
    }
    table.setPage(1);
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
        return {
          ...prev,
          [targetField]: SYSTEM_FILTERS.includes(targetField)
            ? getDefaultSystemFilterConfig(targetField)
            : { op: FILTER_TYPES[getFieldType(targetField)][0], val: '' },
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

  const handleApplySavedFilter = (sf) => {
    setActiveSavedFilterId(sf.id);
    setSelectedFields(new Set(sf.fields || Object.keys(sf.config)));
    setFilterConfig({ ...sf.config });
    setAppliedFilters({ ...sf.config });
    table.setPage(1);
  };

  const handleUpdateSavedFilter = (sfId) => {
    setSavedFilters((prev) => {
      const next = prev.map((f) => {
        if (f.id === sfId) {
          return {
            ...f,
            config: { ...filterConfig },
            fields: Array.from(selectedFields),
          };
        }
        return f;
      });
      localStorage.setItem('deals_saved_filters', JSON.stringify(next));
      return next;
    });
  };

  const handleRenameSavedFilter = (sfId, newName) => {
    setSavedFilters((prev) => {
      const next = prev.map((f) => (f.id === sfId ? { ...f, name: newName } : f));
      localStorage.setItem('deals_saved_filters', JSON.stringify(next));
      return next;
    });
  };

  const handleDeleteSavedFilter = (sfId) => {
    setSavedFilters((prev) => {
      const next = prev.filter((f) => f.id !== sfId);
      localStorage.setItem('deals_saved_filters', JSON.stringify(next));
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
      config: { ...filterConfig },
      fields: Array.from(selectedFields),
    };
    const next = [...savedFilters, newFilter];
    setSavedFilters(next);
    localStorage.setItem('deals_saved_filters', JSON.stringify(next));
    setActiveSavedFilterId(newFilter.id);
    setSaveFilterModalOpen(false);
  };

  const columnMenuConfig = useMemo(() => ({
    module: 'deals',
    pinnedColumns,
    onTogglePin: handleTogglePin,
    onHideColumn: handleHideColumn,
    onFilterColumn: handleFilterColumn,
    onOpenFilterSidebar: handleOpenFilterSidebar,
    appliedFilters,
    filterOptions: filterOptionsContext,
    getFieldType: (k) => getFieldType(k),
  }), [pinnedColumns, appliedFilters, filterOptionsContext, visibleColumns]);

  const k = dealKpis(filtered);
  const prev = dealKpis(oldDeals);
  const changeStage = (d, stage) => updateRecord('deals', d.id, stagePatch(d, stage));

  const accountOptions = useMemo(() => [...accounts].sort((a, b) => a.name.localeCompare(b.name)).map((a) => ({ value: a.id, label: a.name })), [accounts]);
  const fields = [
    { name: 'name', label: 'Deal Name', required: true, span: 2 },
    { name: 'accountId', label: 'Account Name', type: 'select', options: accountOptions, required: true, onChangeEffect: (v, vals) => (contacts.find((c) => c.id === vals.contactId)?.accountId === v ? {} : { contactId: '' }) },
    { name: 'contactId', label: 'Contact Name', type: 'select', placeholder: 'No contact', options: (vals) => contacts.filter((c) => !vals.accountId || c.accountId === vals.accountId).map((c) => ({ value: c.id, label: c.name })), help: 'Contacts from the selected account' },
    { name: 'stage', label: 'Stage', type: 'select', options: STAGES, required: true, onChangeEffect: (v) => ({ probability: STAGE_PROBABILITY[v] }) },
    { name: 'probability', label: 'Probability (%)', type: 'number', min: 0, max: 100, required: true },
    { name: 'amount', label: 'Amount (₹)', type: 'number', min: 1, required: true },
    { name: 'closingDate', label: 'Closing Date', type: 'date', required: true, validate: (v, vals) => (vals.createdOn && v < vals.createdOn ? 'Closing date can’t be before the created date.' : '') },
    { name: 'ownerId', label: 'Deal Owner', type: 'select', options: ownerOptions, required: true },
    { name: 'source', label: 'Deal Source', type: 'select', options: DEAL_SOURCES, required: true },
    { name: 'department', label: 'Department', type: 'select', options: DEPARTMENTS, required: true },
    { name: 'createdOn', label: 'Created On', type: 'date', required: true },
    { name: 'description', label: 'Description', type: 'textarea', span: 2 },
  ];
  const blank = (p = {}) => ({
    name: '',
    accountId: p.account || '',
    contactId: '',
    stage: 'Need Deal Estimation',
    probability: 10,
    amount: '',
    closingDate: '',
    ownerId: 'u1',
    source: 'Website',
    department: 'Enterprise Sales',
    createdOn: todayISO(),
    createdTime: new Date().toISOString(),
    categories: 'Translation',
    leadManager1: 'u7',
    remarks: '',
    mobile: '',
    mobileNo: '',
    description: '',
    lostAtStage: ''
  });

  useUrlActions({
    onCreate: (p) => setForm({ mode: 'create', record: blank(p) }),
    onOpen: (id) => deals.some((d) => d.id === id) && openDeal(id),
    onParams: (p) => { if (p.stage) set('stage')(p.stage); if (p.view === 'kanban') setLayout('kanban'); },
  });

  const submit = (v) => {
    const patch = {
      ...v,
      createdTime: v.createdTime || form?.record?.createdTime || new Date().toISOString(),
      createdOn: v.createdOn || form?.record?.createdOn || todayISO(),
      lostAtStage: v.stage === 'Closed Lost' ? v.lostAtStage || form?.record?.stage || 'Need Deal Estimation' : ''
    };
    let saved = null;
    if (form?.mode === 'create') {
      saved = createRecord('deals', patch);
      table.setSort(null);
      table.setPage(1);
      setRange({ from: '', to: '' });
    } else {
      saved = updateRecord('deals', form?.record?.id, patch);
    }
    return saved;
  };

  const handleInlineCellEdit = (dealId, colKey, newValue) => {
    const keyMap = {
      'Deal Name': 'name',
      'Remarks': 'remarks',
      'Mobile': 'mobile',
      'Mobile No': 'mobileNo',
      'Categories': 'categories',
      'Description': 'description',
      'Sales_ No': 'salesNo',
      'Client Name': 'clientName',
      'City': 'city',
      'Amount': 'amount',
      'Amount (₹)': 'amount',
      'Lead Source': 'source',
    };
    const propKey = keyMap[colKey] || colKey;
    let finalVal = newValue;
    if (propKey === 'amount') {
      const parsed = Number(String(newValue).replace(/[^0-9.]/g, ''));
      finalVal = isNaN(parsed) ? 0 : parsed;
    }
    updateRecord('deals', dealId, { [propKey]: finalVal });
    toast.success('Updated successfully');
  };

  const exportRows = (rows) => exportCSV('deals', rows, [
    { label: 'Deal Name', value: (d) => d.name }, { label: 'Account Name', value: (d) => accountName(d.accountId) }, { label: 'Contact Name', value: (d) => contactName(d.contactId) },
    { label: 'Stage', value: (d) => d.stage }, { label: 'Amount (INR)', value: (d) => d.amount }, { label: 'Closing Date', value: (d) => d.closingDate },
    { label: 'Probability (%)', value: (d) => d.probability }, { label: 'Owner', value: (d) => userName(d.ownerId) }, { label: 'Source', value: (d) => d.source },
    { label: 'Created On', value: (d) => d.createdOn },
  ]);

  const stageMenu = (d, trigger) => (
    <Dropdown width={190} trigger={trigger}>
      {(close) => (<><MenuLabel>Change stage</MenuLabel>{STAGES.map((s) => <MenuItem key={s} close={close} active={s === d.stage} onClick={() => s !== d.stage && changeStage(d, s)}><span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: STAGE_COLORS[s] }} />{s}</span></MenuItem>)}</>)}
    </Dropdown>
  );

  const allColumnsDef = useMemo(() => ({
    'Created Time': {
      key: 'createdTime',
      header: 'Created Time *',
      sortable: true,
      render: (d) => fmtDateTime(d.createdTime || d.createdOn),
    },
    'Categories': {
      key: 'categories',
      header: (
        <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
          <span>Categories</span>
          <span title="Deal Categories" className="text-slate-400 hover:text-slate-600 cursor-help">
            <Info size={13} className="stroke-[2.2]" />
          </span>
        </span>
      ),
      sortable: true,
      render: (d) => <span className="text-slate-800">{d.categories || 'Translation'}</span>,
    },
    'Deal Name': {
      key: 'name',
      header: (
        <div className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
          <span>Deal Name</span>
          <span className="text-[11px] font-normal text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded flex items-center gap-0.5">
            All <ChevronDown size={11} />
          </span>
        </div>
      ),
      sortable: true,
      render: (d) => (
        <button
          type="button"
          onClick={() => openDeal(d.id)}
          className="text-slate-900 font-medium hover:text-primary hover:underline text-left truncate max-w-full"
        >
          {d.name}
        </button>
      ),
    },
    'Mobile': {
      key: 'mobile',
      header: 'Mobile',
      sortable: true,
      render: (d) => {
        const phone = d.mobile || d.mobileNo || (d.contactId ? contactsById[d.contactId]?.phone : '') || '';
        if (!phone) return <span className="text-slate-400">—</span>;
        return (
          <div className="inline-flex items-center gap-2">
            <span className="text-slate-800 font-normal">{phone}</span>
            <a
              href={`tel:${phone}`}
              title={`Call ${phone}`}
              onClick={(e) => e.stopPropagation()}
              className="w-5 h-5 rounded-full bg-[#10B981] hover:bg-[#059669] text-white flex items-center justify-center shadow-xs transition-colors shrink-0"
            >
              <Phone size={10} className="fill-white" />
            </a>
          </div>
        );
      },
    },
    'Remarks': {
      key: 'remarks',
      header: 'Remarks',
      sortable: true,
      render: (d) => <span className="text-slate-700">{d.remarks || '—'}</span>,
    },
    'Lead Manager 1': {
      key: 'leadManager1',
      header: 'Lead Manager 1',
      sortable: true,
      render: (d) => {
        const manager = d.leadManager1 ? userName(d.leadManager1) : (d.ownerId ? userName(d.ownerId) : '');
        if (!manager || manager === '-') return <span className="text-slate-400">—</span>;
        return (
          <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[12px] font-medium bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]/40">
            {manager}
          </span>
        );
      },
    },
    'Stage': {
      key: 'stage',
      header: 'Stage',
      sortable: true,
      render: (d) => (
        stageMenu(d, (
          <button
            type="button"
            title="Change stage"
            className="inline-flex items-center justify-center px-3 py-1 rounded-full text-[12px] font-medium transition-transform hover:scale-102"
            style={{
              backgroundColor: STAGE_COLORS[d.stage] || '#F1F5F9',
              color: STAGE_TEXT_COLORS[d.stage] || '#1E293B',
            }}
          >
            {d.stage}
          </button>
        ))
      ),
    },
    'Amount': {
      key: 'amount',
      header: 'Amount (₹)',
      sortable: true,
      className: 'text-slate-800 font-medium',
      render: (d) => fmtINR(d.amount),
    },
    'Closing Date': {
      key: 'closingDate',
      header: 'Closing Date',
      sortable: true,
      render: (d) => fmtDate(d.closingDate),
    },
    'Probability (%)': {
      key: 'probability',
      header: 'Probability (%)',
      sortable: true,
      render: (d) => <Probability deal={d} />,
    },
    'Deal Owner': {
      key: 'owner',
      header: 'Deal Owner',
      sortable: true,
      render: (d) => <UserAvatar userId={d.ownerId} size={28} withName />,
    },
    'Account Name': {
      key: 'account',
      header: 'Account Name',
      sortable: true,
      render: (d) => <Link to={`/accounts?open=${d.accountId}`} className="text-primary hover:underline">{accountName(d.accountId)}</Link>,
    },
    'Contact Name': {
      key: 'contact',
      header: 'Contact Name',
      sortable: true,
      render: (d) => (d.contactId ? <Link to={`/contacts?open=${d.contactId}`} className="text-primary hover:underline">{contactName(d.contactId)}</Link> : <span className="text-slate-400">—</span>),
    },
    'Description': {
      key: 'description',
      header: 'Description',
      sortable: true,
      render: (d) => d.description || '—',
    },
    'Lead Source': {
      key: 'source',
      header: 'Lead Source',
      sortable: true,
      render: (d) => d.source || '—',
    },
    'Sales_ No': {
      key: 'salesNo',
      header: 'Sales_ No',
      sortable: true,
      render: (d) => d.salesNo || '—',
    },
    'Client Name': {
      key: 'clientName',
      header: 'Client Name',
      sortable: true,
      render: (d) => d.clientName || accountName(d.accountId) || '—',
    },
    'City': {
      key: 'city',
      header: 'City',
      sortable: true,
      render: (d) => d.city || '—',
    },
    'Forecast Category': {
      key: 'forecastCategory',
      header: 'Forecast Category',
      sortable: true,
      render: (d) => d.forecastCategory || '—',
    },
    'Expected Revenue': {
      key: 'expectedRevenue',
      header: 'Expected Revenue',
      sortable: true,
      render: (d) => d.expectedRevenue ? fmtINR(d.expectedRevenue) : '—',
    },
    'Job type': {
      key: 'jobType',
      header: 'Job type',
      sortable: true,
      render: (d) => d.jobType || '—',
    },
    'Purpose Of translation': {
      key: 'purposeOfTranslation',
      header: 'Purpose Of translation',
      sortable: true,
      render: (d) => d.purposeOfTranslation || '—',
    },
    'Delivery type': {
      key: 'deliveryType',
      header: 'Delivery type',
      sortable: true,
      render: (d) => d.deliveryType || '—',
    },
    'Submission Status': {
      key: 'submissionStatus',
      header: 'Submission Status',
      sortable: true,
      render: (d) => d.submissionStatus || '—',
    },
    'Est_NO': {
      key: 'estNo',
      header: 'Est_NO',
      sortable: true,
      render: (d) => d.estNo || '—',
    },
    'EST Ready': {
      key: 'estReady',
      header: 'EST Ready',
      sortable: true,
      render: (d) => d.estReady || '—',
    },
    'Mobile No': {
      key: 'mobileNo',
      header: 'Mobile No',
      sortable: true,
      render: (d) => d.mobileNo || d.mobile || '—',
    },
  }), [accountName, contactName, userName, contactsById]);

  const columns = useMemo(() => {
    const cols = visibleColumns.map(c => {
      if (allColumnsDef[c]) {
        return { ...allColumnsDef[c], colName: c };
      }
      const fieldKey = c.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
      return {
        key: c,
        colName: c,
        header: c,
        sortable: false,
        render: (d) => {
          const val = d[c] ?? d[fieldKey];
          return val !== undefined && val !== null && val !== '' ? String(val) : '—';
        }
      };
    });
    cols.forEach(c => {
      if (!wrapText && !c.className?.includes('whitespace-nowrap')) c.className = (c.className ? c.className + ' ' : '') + 'whitespace-nowrap';
    });
    return cols;
  }, [visibleColumns, allColumnsDef, wrapText]);

  const rec = deals.find((d) => d.id === viewing);
  const selectedIds = [...table.selected];

  const toggleField = (field) => {
    const next = new Set(selectedFields);
    if (next.has(field)) {
      next.delete(field);
      setFilterConfig(prev => { const p = { ...prev }; delete p[field]; return p; });
    } else {
      next.add(field);
      setFilterConfig(prev => ({
        ...prev,
        [field]: SYSTEM_FILTERS.includes(field)
          ? getDefaultSystemFilterConfig(field)
          : { op: FILTER_TYPES[getFieldType(field)][0], val: '' }
      }));
    }
    setSelectedFields(next);
  };

  const setConfig = (field, k, v) => setFilterConfig(prev => ({ ...prev, [field]: { ...prev[field], [k]: v } }));
  const applyFilters = () => setAppliedFilters({ ...filterConfig });

  const renderFieldList = (list) => {
    const q = filterSearch.trim().toLowerCase();
    const matches = q ? list.filter(f => f.toLowerCase().includes(q)) : list;
    if (matches.length === 0) return null;
    return (
      <div className="pl-5 pb-4 space-y-3 max-h-[400px] overflow-y-auto thin-scroll">
        {matches.map(field => {
          const checked = selectedFields.has(field);
          const conf = filterConfig[field];
          const isSystem = SYSTEM_FILTERS.includes(field);
          const type = getFieldType(field);
          const ops = FILTER_TYPES[type];
          const slug = field.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
          return (
            <div key={field} id={`filter-field-${slug}`} className="space-y-1.5 p-1 rounded-md transition-colors">
              <label className="flex items-start gap-2.5 text-[13.5px] text-ink-600 cursor-pointer leading-snug">
                <input type="checkbox" className="cb mt-0.5" checked={checked} onChange={() => toggleField(field)} />
                {field}
              </label>
              {checked && conf && (
                isSystem ? (
                  <div className="pl-[26px] mt-1.5">
                    <SystemFilterControls
                      field={field}
                      conf={conf}
                      onChange={(newConf) => setFilterConfig(prev => ({ ...prev, [field]: newConf }))}
                    />
                  </div>
                ) : (
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
                )
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const hasConfig = Object.keys(filterConfig).length > 0;
  const hasActiveFilter = useMemo(() => {
    const hasAny = (cfg) => Object.entries(cfg).some(([k, v]) => {
      if (!v) return false;
      if (SYSTEM_FILTERS.includes(k)) return true;
      return v.val !== '' || v.op === 'Is Empty';
    });
    return Boolean(hasAny(appliedFilters) || hasAny(filterConfig));
  }, [appliedFilters, filterConfig]);

  return (
    <div>
      {form ? (
        <CreateDeal
          key={form.mode === 'create' ? (form.record?._t || 'new') : form.record?.id}
          record={form.record}
          mode={form.mode}
          onSave={(data, isNew) => {
            const saved = submit(data);
            if (isNew) {
              setForm({ mode: 'create', record: { ...blank(), _t: Date.now() } });
            } else {
              setForm(null);
              if (saved?.id) {
                openDeal(saved.id);
              }
            }
          }}
          onCancel={() => setForm(null)}
        />
      ) : viewing ? (
        <DealDetail
          id={viewing}
          onClose={closeDeal}
          onEdit={(d) => { closeDeal(); setForm({ mode: 'edit', record: d }); }}
        />
      ) : (
        <div className="flex flex-col gap-3">
      <PageHeader
        views={views} view={savedView} onViewChange={(v) => { setSavedView(v); table.setPage(1); }}
        tabMenu={(close) => {
          const q = viewSearch.toLowerCase();
          const p = allViews.filter((v) => v.category === 'Public Views' && v.label.toLowerCase().includes(q));
          const m = allViews.filter((v) => v.category === 'My Deals' && v.label.toLowerCase().includes(q));
          return (
            <div className="flex flex-col w-[260px] max-h-[400px]">
              <div className="p-2 border-b border-line sticky top-0 bg-white z-10">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 text-ink-400" size={14} />
                  <input type="text" placeholder="Search Views" className="w-full h-8 pl-8 pr-3 text-[13px] bg-[#f2f4f8] border-transparent focus:bg-white focus:border-primary rounded-md outline-none" value={viewSearch} onChange={(e) => setViewSearch(e.target.value)} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto thin-scroll py-1">
                {p.length > 0 && (
                  <>
                    <MenuLabel>Public Views</MenuLabel>
                    {p.map((v) => (
                      <MenuItem key={v.key} close={close} active={v.key === savedView} icon={v.key === savedView ? Check : undefined} onClick={() => { setSavedView(v.key); table.setPage(1); setViewSearch(''); }}>
                        {v.label} {v.key === savedView && <span className="ml-1 text-ink-400 font-normal">({filtered.length})</span>}
                      </MenuItem>
                    ))}
                  </>
                )}
                {m.length > 0 && (
                  <>
                    {p.length > 0 && <div className="h-px bg-line my-1 mx-2" />}
                    <MenuLabel>My Deals</MenuLabel>
                    {m.map((v) => (
                      <MenuItem key={v.key} close={close} active={v.key === savedView} icon={v.key === savedView ? Check : undefined} onClick={() => { setSavedView(v.key); table.setPage(1); setViewSearch(''); }}>
                        {v.label} {v.key === savedView && <span className="ml-1 text-ink-400 font-normal">({filtered.length})</span>}
                      </MenuItem>
                    ))}
                  </>
                )}
                {p.length === 0 && m.length === 0 && <div className="px-3 py-2 text-ink-500 text-[13px] text-center">No views found</div>}
              </div>
              <div className="border-t border-line p-1 sticky bottom-0 bg-white">
                <MenuItem close={close} onClick={() => setCustomViewModalOpen(true)}><span className="text-primary font-medium">New Custom View</span></MenuItem>
                <MenuItem close={close} onClick={() => setCustomViewModalOpen(true)}><span className="text-primary font-medium">Manage Custom Views</span></MenuItem>
              </div>
            </div>
          );
        }}
        customRight={
          <div className="ml-2 hidden sm:flex h-10 border border-line rounded-lg bg-white overflow-hidden shadow-sm">
            <button className="px-3 hover:bg-page text-[14px] font-medium text-ink-600 border-r border-line">Map View</button>
            <Dropdown width={180} align="right" trigger={
              <button className="px-2 hover:bg-page text-ink-600 flex items-center justify-center h-full">
                <ChevronDown size={16} />
              </button>
            }>
              {(close) => (
                <div className="py-1">
                  <MenuItem close={close} active={true}>Map View</MenuItem>
                  <MenuItem close={close}><span className="text-primary">Create Button</span></MenuItem>
                  <MenuItem close={close}><span className="text-primary">Manage Buttons</span></MenuItem>
                </div>
              )}
            </Dropdown>
          </div>
        }
        toolbar={{
          sidebarToggle: { isOpen: filtersOpen, onToggle: () => setFiltersOpen((o) => !o) },
          filterActive: filtersOpen,
          onFilter: () => setFiltersOpen((o) => !o),
          hasActiveFilter,
          onSaveFilter: () => setSaveFilterModalOpen(true),
          labeled: true,
          sortOptions: [
            { key: 'name', label: 'Deal Name' },
            { key: 'amount', label: 'Amount' },
            { key: 'closingDate', label: 'Closing Date' },
            { key: 'probability', label: 'Probability' },
            { key: 'stage', label: 'Stage' },
            { key: 'createdOn', label: 'Created On' },
          ],
          sort: table.sort,
          onSort: table.setSort,
          layouts: visibleViews,
          layout,
          onLayout: handleSelectVisibleView,
          onRefresh: refresh,
          refreshing,
          dense,
          onDense: () => setDense((d) => !d),
          module: 'Deals',
          hideWorkflow: true,
          hideDense: true,
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
          primary: {
            label: 'Create Deal',
            onClick: () => setForm({ mode: 'create', record: blank() }),
            menu: [
              { label: 'Create Deal', icon: Plus, onClick: () => setForm({ mode: 'create', record: blank() }) },
              { label: 'Import Deals', icon: Upload, onClick: () => { setImportType('deals'); setImportModalOpen(true); } },
              { label: 'Import Deals X Products', icon: Package, onClick: () => { setImportType('deals_products'); setImportModalOpen(true); } },
              { label: 'Import Notes', icon: FileText, onClick: () => { setImportType('notes'); setImportModalOpen(true); } },
            ],
          },
          moreItems: [
            { label: 'Mass Transfer', onClick: () => {} },
            { label: 'Mass Delete', onClick: () => setConfirm({ ids: selectedIds.length ? selectedIds : deals.map(d => d.id), label: selectedIds.length ? `${selectedIds.length} deals` : 'all deals' }) },
            { label: 'Mass Update', onClick: () => setBulk('stage') },
            { label: 'Manage Tags', onClick: () => {} },
            { label: 'Assignment Rules', onClick: () => {} },
            { label: 'Drafts', onClick: () => {} },
            { label: 'Mass Email', onClick: () => {} },
            { label: 'Deduplicate Deals', onClick: () => {} },
            { divider: true },
            { label: 'Sheet View', icon: FileSpreadsheet, onClick: () => setSheetViewOpen(true) },
            {
              render: (close) => (
                <div className="py-0.5">
                  <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-ink-400 flex items-center justify-between">
                    <span>Print View</span>
                    <Printer size={12} />
                  </div>
                  <MenuItem
                    close={close}
                    icon={Printer}
                    onClick={() => { setPrintMode('default'); setPrintModalOpen(true); }}
                  >
                    1. Print Default View
                  </MenuItem>
                  <MenuItem
                    close={close}
                    icon={FileText}
                    onClick={() => { setPrintMode('canvas'); setPrintModalOpen(true); }}
                  >
                    2. Print Using Canvas
                  </MenuItem>
                </div>
              ),
            },
            { divider: true },
            { label: 'Export Deals', onClick: () => exportRows(table.sorted) },
          ],
        }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-3 mb-3">
        <StatCard icon={CalendarRange} tone="violet" label="Total Deals" value={k.total} trend={trend(k.total, prev.total)} spark={monthly(filtered)} />
        <StatCard icon={Coins} tone="green" label="Total Pipeline Value" value={fmtCompact(k.pipeline)} trend={trend(k.pipeline, prev.pipeline)} spark={monthly(filtered).map((x, i) => x + i)} />
        <StatCard icon={Trophy} tone="amber" tinted label="Won Deals" value={`${k.won} (${k.total ? Math.round((k.won / k.total) * 100) : 0}%)`} trend={trend(k.won, prev.won)} spark={monthly(filtered.filter((d) => d.stage === 'Deal Closed (Won)'))} onClick={() => set('stage')('Deal Closed (Won)')} />
        <StatCard icon={XCircle} tone="red" tinted label="Lost Deals" value={`${k.lost} (${k.total ? Math.round((k.lost / k.total) * 100) : 0}%)`} trend={trend(k.lost, prev.lost)} invertTrend spark={monthly(filtered.filter((d) => d.stage === 'Closed Lost'))} onClick={() => set('stage')('Closed Lost')} />
        <StatCard icon={Clock3} tone="blue" tinted label="Open Deals" value={`${k.open} (${k.total ? Math.round((k.open / k.total) * 100) : 0}%)`} trend={trend(k.open, prev.open)} spark={monthly(filtered.filter(isOpen))} onClick={() => setSavedView('open')} />
      </div>

      <div className="flex gap-3 items-start">
        <aside
          className={`card hidden md:flex flex-col shrink-0 sticky top-[72px] h-[calc(100vh-86px)] overflow-hidden transition-all duration-300 ease-in-out ${
            filtersOpen ? 'w-[250px] opacity-100' : 'w-0 opacity-0 border-0 p-0 overflow-hidden -mr-3 pointer-events-none'
          }`}
        >
            <div className="px-3.5 pt-4 pb-2">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[15px] font-semibold text-ink whitespace-nowrap">Filter Deals by</h2>
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
              
              <details className="group" open={!!filterSearch}>
                <summary className="py-2.5 text-[14px] font-semibold text-ink cursor-pointer select-none flex items-center gap-1 -ml-1">
                  <ChevronDown size={16} className="group-open:rotate-180 transition-transform -rotate-90" />
                  Filter By Subforms
                </summary>
                {renderFieldList(SUBFORM_FILTERS)}
              </details>

              <details className="group" open={!!filterSearch}>
                <summary className="py-2.5 text-[14px] font-semibold text-ink cursor-pointer select-none flex items-center gap-1 -ml-1">
                  <ChevronDown size={16} className="group-open:rotate-180 transition-transform -rotate-90" />
                  Filter By Related Modules
                </summary>
                {renderFieldList(RELATED_MODULE_FILTERS)}
              </details>
            </div>

            {hasConfig && (
              <div className="px-3.5 py-3 border-t border-line bg-page flex flex-col gap-2">
                <div className="flex gap-2">
                  <button onClick={applyFilters} className="btn-primary flex-1 h-8 text-[13px]">Apply Filter</button>
                  <button onClick={() => { setFilterConfig({}); setSelectedFields(new Set()); setAppliedFilters({}); setActiveSavedFilterId(null); }} className="btn-secondary flex-1 h-8 text-[13px]">Clear Filter</button>
                </div>
                {hasActiveFilter && (
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (savedFilters.length >= MAX_SAVED_FILTERS) return;
                        setSaveFilterModalOpen(true);
                      }}
                      disabled={savedFilters.length >= MAX_SAVED_FILTERS}
                      className="w-full h-8 text-[13px] font-medium border border-primary text-primary hover:bg-primary-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      <Bookmark size={14} /> Save Filter
                    </button>
                    {savedFilters.length >= MAX_SAVED_FILTERS && (
                      <p className="text-[11.5px] text-red-500 text-center font-medium">
                        Maximum 10 saved filters allowed.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </aside>

        <div className="flex-1 min-w-0">
          {activeCustomView && (
            <div className="flex items-center justify-between px-4 py-2.5 bg-primary-50 border border-primary-200 rounded-xl mb-3 text-[13px] shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="h-6 w-6 rounded-md bg-primary text-white flex items-center justify-center">
                  <SlidersHorizontal size={13} />
                </div>
                <div>
                  <span className="font-semibold text-primary">Custom View: </span>
                  <span className="font-bold text-ink">{activeCustomView.name}</span>
                  <span className="text-ink-500 ml-2">
                    ({filtered.length} Deals · {activeCustomView.columns?.length || 0} Columns)
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCustomViewModalOpen(true)}
                  className="text-primary hover:underline font-semibold text-[12.5px]"
                >
                  Edit View
                </button>
                <span className="text-ink-300">•</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveCustomView(null);
                    localStorage.removeItem('deals_cols');
                    setVisibleColumns(['Deal Name', 'Account Name', 'Contact Name', 'Stage', 'Amount', 'Closing Date', 'Probability (%)', 'Deal Owner', 'Created Time']);
                  }}
                  className="text-ink-500 hover:text-red-500 text-[12.5px] font-medium"
                >
                  Reset to All Deals
                </button>
              </div>
            </div>
          )}

          <section className="card overflow-hidden">
            <BulkBar count={selectedIds.length} onClear={table.clearSelection}>
              <BulkButton onClick={() => setBulk('stage')}>Change stage</BulkButton>
              <BulkButton icon={UserCog} onClick={() => setBulk('owner')}>Change owner</BulkButton>
              <BulkButton icon={Download} onClick={() => exportRows(deals.filter((d) => table.selected.has(d.id)))}>Export</BulkButton>
              <BulkButton icon={Trash2} danger onClick={() => setConfirm({ ids: selectedIds, label: `${selectedIds.length} deals` })}>Delete</BulkButton>
            </BulkBar>
            {/* 1. List View */}
            {layout === 'list' && <DataTable columns={columns} rows={table.pageRows} table={table} loading={refreshing} dense={dense} minWidth={1290} columnMenu={columnMenuConfig} viewMode={viewMode}
              emptyAction={<button className="btn-primary mt-2 h-9" onClick={() => setForm({ mode: 'create', record: blank() })}><Plus size={16} />Create Deal</button>}
              headerExtra={
                <th className="th w-[44px] text-center p-0">
                  <ViewSettingsMenu
                    onManageColumns={() => setManageColsOpen(true)}
                    onResetColumnSize={() => {
                      localStorage.removeItem('deals_pinned_cols');
                      setPinnedColumns([]);
                    }}
                    hasCustomColumnSize={pinnedColumns.length > 0}
                    pageSize={pageSize}
                    onPageSizeChange={(sz) => {
                      setPageSize(sz);
                      localStorage.setItem('deals_page_size', sz);
                      table.setPage(1);
                    }}
                    viewMode={viewMode}
                    onViewModeChange={(mode) => {
                      setViewMode(mode);
                      setWrapText(mode === 'wrap');
                      localStorage.setItem('deals_view_mode', mode);
                    }}
                  />
                </th>
              }
            />}

            {/* 2. Kanban View */}
            {layout === 'kanban' && (
              <div className="p-3">
                <p className="text-[12.5px] text-ink-500 mb-2.5">Drag a card to another column to change its stage. Probability updates to the stage default.</p>
                <KanbanView groups={STAGES.map((s) => ({ key: s, label: s, color: STAGE_COLORS[s] }))} rows={table.sorted} groupOf={(d) => d.stage}
                  onMove={changeStage} onCardClick={(d) => openDeal(d.id)} summary={(items) => `${fmtCompact(sumBy(items, (d) => d.amount))} · ${items.length} deals`}
                  renderCard={(d) => (
                    <div>
                      <div className="text-[13.5px] font-semibold text-ink leading-snug">{d.name}</div>
                      <div className="text-[12px] text-ink-500 mt-0.5 truncate">{accountName(d.accountId)}{d.contactId ? ` · ${contactName(d.contactId)}` : ''}</div>
                      <div className="flex items-center justify-between mt-2.5"><span className="text-[13px] font-semibold text-ink">{fmtINR(d.amount)}</span><UserAvatar userId={d.ownerId} size={24} /></div>
                      <div className="flex items-center justify-between mt-1.5 text-[11.5px] text-ink-500"><span>Closes {fmtDate(d.closingDate)}</span><span style={{ color: BAR[d.stage] }} className="font-semibold">{d.probability}%</span></div>
                    </div>
                  )} />
              </div>
            )}

            {/* 3. Grid View */}
            {layout === 'grid' && (
              <div>
                <SpreadsheetGridView
                  columns={columns}
                  rows={table.pageRows}
                  table={table}
                  loading={refreshing}
                  minWidth={1300}
                  columnMenu={columnMenuConfig}
                  viewMode={viewMode}
                  onCellEdit={handleInlineCellEdit}
                  emptyAction={<button className="btn-primary mt-2 h-9" onClick={() => setForm({ mode: 'create', record: blank() })}><Plus size={16} />Create Deal</button>}
                  headerExtra={
                    <th className="w-[44px] min-w-[44px] max-w-[44px] text-center p-0 border-b border-[#CBD5E1] bg-[#F4F6F9]">
                      <ViewSettingsMenu
                        onManageColumns={() => setManageColsOpen(true)}
                        onResetColumnSize={() => {
                          localStorage.removeItem('deals_cols');
                          localStorage.removeItem('deals_pinned_cols');
                          setPinnedColumns([]);
                          setVisibleColumns(['Created Time', 'Categories', 'Deal Name', 'Mobile', 'Remarks', 'Lead Manager 1', 'Stage', 'Deal Owner', 'Amount', 'Closing Date']);
                        }}
                        pageSize={pageSize}
                        onPageSizeChange={(newSize) => {
                          setPageSize(newSize);
                          table.setPageSize(newSize);
                          try { localStorage.setItem('deals_page_size', String(newSize)); } catch (e) {}
                        }}
                        viewMode={viewMode}
                        onViewModeChange={(newMode) => {
                          setViewMode(newMode);
                          setWrapText(newMode === 'wrap');
                          try { localStorage.setItem('deals_view_mode', newMode); } catch (e) {}
                        }}
                      />
                    </th>
                  }
                />
              </div>
            )}

            {/* 4. Chart View */}
            {layout === 'chart' && <ChartView title="Deals by stage (filtered)" data={STAGES.map((s) => ({ name: s, value: filtered.filter((d) => d.stage === s).length, color: STAGE_COLORS[s] }))} valueLabel="Deals" />}

            {/* 5. Timeline View */}
            {layout === 'timeline' && (
              <TimelineView
                rows={table.sorted}
                accountName={accountName}
                contactName={contactName}
                userName={userName}
                onView={(id) => openDeal(id)}
                onEdit={(d) => setForm({ mode: 'edit', record: d })}
                onChangeStage={changeStage}
              />
            )}

            {/* 6. Split View */}
            {layout === 'split' && (
              <SplitView
                deals={table.sorted}
                accountName={accountName}
                contactName={contactName}
                userName={userName}
                onOpenDeal={(id) => openDeal(id)}
                onEdit={(d) => setForm({ mode: 'edit', record: d })}
              />
            )}

            {/* 7. Custom List View */}
            {layout === 'custom_list' && (
              <div>
                {!activeCustomView && (
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 mx-3.5 my-3 bg-slate-50 border border-line rounded-xl text-[13px]">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal size={16} className="text-primary" />
                      <span className="font-semibold text-ink">Custom List View:</span>
                      <span className="text-ink-500">Configure or create custom list views with tailored column sets and filter criteria.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCustomViewModalOpen(true)}
                      className="btn-primary h-8 px-3 rounded-md text-[12.5px] font-semibold flex items-center gap-1.5"
                    >
                      <Settings2 size={13} />
                      <span>Manage Custom Views</span>
                    </button>
                  </div>
                )}
                <DataTable columns={columns} rows={table.pageRows} table={table} loading={refreshing} dense={dense} minWidth={1290} columnMenu={columnMenuConfig}
                  emptyAction={<button className="btn-primary mt-2 h-9" onClick={() => setForm({ mode: 'create', record: blank() })}><Plus size={16} />Create Deal</button>}
                  headerExtra={
                    <th className="th w-[44px] text-center p-0">
                      <Dropdown width={180} align="right" trigger={
                        <button type="button" className="h-7 w-7 inline-flex items-center justify-center rounded border border-line bg-white hover:bg-page mt-1">
                          <Settings2 size={15} className="text-ink-600" />
                        </button>
                      }>
                        {(close) => (
                          <div className="py-1">
                            <MenuItem close={close} onClick={() => setManageColsOpen(true)}>Manage Columns</MenuItem>
                            <MenuItem close={close} onClick={() => { localStorage.removeItem('deals_cols'); localStorage.removeItem('deals_pinned_cols'); setPinnedColumns([]); setVisibleColumns(['Deal Name', 'Account Name', 'Contact Name', 'Stage', 'Amount', 'Closing Date', 'Probability (%)', 'Deal Owner', 'Created Time']); }}>Reset Column Size</MenuItem>
                            <MenuDivider />
                            <div className="px-3 py-1.5 text-[13px] font-medium text-ink-500 flex justify-between">Records Per Page <span className="text-ink-600 font-semibold">{pageSize} ▸</span></div>
                            <div className="pl-4 pr-2 pb-1 space-y-0.5">
                               {[10, 25, 50, 100, 200].map(sz => <MenuItem key={sz} close={close} active={pageSize === sz} onClick={() => { setPageSize(sz); table.setPage(1); }}>{sz}</MenuItem>)}
                            </div>
                            <MenuDivider />
                            <div className="px-3 py-1.5 text-[13px] font-medium text-ink-500 flex justify-between">View Mode <span className="text-ink-600 font-semibold">{wrapText ? 'Wrap Text' : 'No Wrap'} ▸</span></div>
                            <div className="pl-4 pr-2 pb-1 space-y-0.5">
                               <MenuItem close={close} active={wrapText} onClick={() => setWrapText(true)}>Wrap Text</MenuItem>
                               <MenuItem close={close} active={!wrapText} onClick={() => setWrapText(false)}>No Wrap</MenuItem>
                            </div>
                          </div>
                        )}
                      </Dropdown>
                    </th>
                  }
                />
              </div>
            )}

            {/* 8. Tile View */}
            {layout === 'tile' && (
              <TileView
                rows={table.pageRows}
                accountName={accountName}
                contactName={contactName}
                userName={userName}
                onView={(id) => openDeal(id)}
                onEdit={(d) => setForm({ mode: 'edit', record: d })}
                onChangeStage={changeStage}
                onDelete={(d) => setConfirm({ ids: [d.id], label: d.name })}
              />
            )}

            {/* 9. Table View */}
            {layout === 'table' && (
              <DataTable columns={columns} rows={table.pageRows} table={table} loading={refreshing} dense={true} minWidth={1290} columnMenu={columnMenuConfig} viewMode={viewMode}
                emptyAction={<button className="btn-primary mt-2 h-9" onClick={() => setForm({ mode: 'create', record: blank() })}><Plus size={16} />Create Deal</button>}
                headerExtra={
                  <th className="th w-[44px] text-center p-0">
                    <ViewSettingsMenu
                      onManageColumns={() => setManageColsOpen(true)}
                      onResetColumnSize={() => {
                        localStorage.removeItem('deals_pinned_cols');
                        setPinnedColumns([]);
                      }}
                      hasCustomColumnSize={pinnedColumns.length > 0}
                      pageSize={pageSize}
                      onPageSizeChange={(sz) => {
                        setPageSize(sz);
                        localStorage.setItem('deals_page_size', sz);
                        table.setPage(1);
                      }}
                      viewMode={viewMode}
                      onViewModeChange={(mode) => {
                        setViewMode(mode);
                        setWrapText(mode === 'wrap');
                        localStorage.setItem('deals_view_mode', mode);
                      }}
                    />
                  </th>
                }
              />
            )}

            {(['list', 'grid', 'tile', 'table', 'custom_list'].includes(layout)) && <div className="px-4"><Pagination table={table} noun="deals" /></div>}
          </section>
        </div>
      </div>
      </div>
      )}
      <ManageColsModal open={manageColsOpen} visibleCols={visibleColumns} onClose={() => setManageColsOpen(false)} onSave={(cols) => {
        setVisibleColumns(cols);
        localStorage.setItem('deals_cols', JSON.stringify(cols));
        setManageColsOpen(false);
      }} />
      <CustomViewsModal
        open={customViewsModalOpen}
        onClose={() => setCustomViewModalOpen(false)}
        allColumns={ALL_COLUMNS}
        customViews={customViews}
        activeViewId={activeCustomView?.id}
        onSaveView={handleSaveCustomView}
        onDeleteView={handleDeleteCustomView}
        onSelectView={handleSelectCustomView}
        ownerOptions={ownerOptions}
        dealAccounts={dealAccounts}
      />
      <ImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        initialType={importType}
        deals={deals}
        accounts={accounts}
        contacts={contacts}
        users={users}
        onImportDeals={handleImportDeals}
        onImportDealsProducts={handleImportDealsProducts}
        onImportNotes={handleImportNotes}
      />
      <SheetViewModal
        open={sheetViewOpen}
        onClose={() => setSheetViewOpen(false)}
        deals={table.sorted}
        accounts={accounts}
        users={users}
        accountName={accountName}
        userName={userName}
        onSaveUpdates={handleSaveSheetUpdates}
      />
      <PrintViewModal
        open={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        initialMode={printMode}
        deals={table.sorted}
        accountName={accountName}
        contactName={contactName}
        userName={userName}
      />
      <FormModal open={!!bulk} onClose={() => setBulk(null)} size="sm" title={bulk === 'owner' ? 'Change owner' : 'Change stage'} subtitle={`Applies to ${selectedIds.length} selected deals.`}
        fields={[bulk === 'owner' ? { name: 'value', label: 'New owner', type: 'select', options: ownerOptions, required: true, span: 2 } : { name: 'value', label: 'Stage', type: 'select', options: STAGES, required: true, span: 2 }]}
        initial={bulk ? { value: '' } : null} submitLabel="Apply"
        onSubmit={({ value }) => { selectedIds.forEach((id) => { const d = deals.find((x) => x.id === id); updateRecord('deals', id, bulk === 'owner' ? { ownerId: value } : stagePatch(d, value)); }); setBulk(null); table.clearSelection(); }} />
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} title="Delete deals?" message={confirm ? `Delete ${confirm.label}? Pipeline totals and stage reports update immediately.` : ''}
        onConfirm={() => { deleteRecords('deals', confirm.ids); table.clearSelection(); setViewing(null); }} />
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
        onClose={() => { setRenameFilterModalOpen(false); setFilterToRename(null); }}
        filter={filterToRename}
        onRename={handleRenameSavedFilter}
      />
      <ConfirmDialog
        open={!!filterToDelete}
        onClose={() => setFilterToDelete(null)}
        title="Delete Saved Filter?"
        message={filterToDelete ? `Are you sure you want to delete "${filterToDelete.name}"? This action cannot be undone.` : ''}
        onConfirm={() => handleDeleteSavedFilter(filterToDelete.id)}
      />
    </div>
  );
}
