import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarRange, ChevronDown, Clock3, Coins, Download, Eye, Pencil, Plus, Trash2, Trophy, UserCog, XCircle, Search, Check, Settings2 } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import FilterBar, { MoreFilters, SelectField } from '../../components/common/FilterBar';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import useTable from '../../components/common/useTable';
import StatusBadge, { badgeTone } from '../../components/common/StatusBadge';
import { UserAvatar } from '../../components/common/Avatar';
import ActionMenu from '../../components/common/ActionMenu';
import FormModal from '../../components/common/RecordForm';
import ConfirmDialog from '../../components/common/ConfirmDialog';

import Dropdown, { MenuItem, MenuLabel, MenuDivider } from '../../components/common/Dropdown';
import BulkBar, { BulkButton } from '../../components/common/BulkBar';
import { ChartView, GridView, KanbanView } from '../../components/common/Views';
import DealDetail from './DealDetail';
import CreateDeal from './CreateDeal';
import { useRefresh, useUrlActions } from '../../components/common/hooks';
import { DEAL_SOURCES, DEPARTMENTS } from '../../data/seedData';
import {
  OPEN_STAGES, STAGES, STAGE_COLORS, STAGE_PROBABILITY, dealKpis, fmtCompact, fmtDate, fmtINR, inRange, isOpen, sumBy, todayISO, trend,
} from '../../utils/calculations';
import { exportCSV } from '../../utils/exportCSV';

const DEFAULT_RANGE = { from: '2026-01-01', to: '2026-12-31' };
const BAR = { 'Need Deal Estimation': '#A970F5', 'Deal Estimation Ready': '#FF7B3A', 'Deal Estimation sent to Client': '#2F7BF5', 'Deal Estimation accepted- Invoice Need': '#8E3CF2', 'Deal Invoice Ready': '#FFBB28', 'Deal Closed (Won)': '#10B981', 'Deal Job Seeking & Agency': '#F59E0B', 'Pre-Deal Lost': '#7F1D1D', 'Deal Closed (Lost)': '#EF4444' };

const ALL_COLUMNS = [
  'Activity Badge', 'Note Badge', 'Created Time', 'Categories', 'Deal Name', 'Mobile', 'Remarks', 'Lead Manager 1', 'Stage', 'Amount', 'City', 'Tag', 'Reason for Closed lost', 'Last Activity Time', 'Sales_ No', 'Deal Owner', 'Previous Pending Estimations', 'Closed Won date', 'Closing Date', 'Lead Source', 'Purpose Of translation', 'Job type', 'Contact Name', 'Account Name', 'Type', 'Probability (%)', 'Campaign Source', 'Created By', 'Modified By', 'Modified Time', 'Description', 'Expected Revenue', 'Lead Conversion Time', 'Sales Cycle Duration', 'Overall Sales Duration', 'Forecast Category', 'Territory', 'Client Name', 'Estimation created by', 'Category', 'Connected To', 'Delivery Date and time', 'Tracking Number', 'Draft copy', 'Service Provider', 'Soft copy', 'Source Language List', 'Target Language List', 'Invoice_No', 'Est_NO', 'Without GST', 'GST Amount', 'Project Requirements', 'Mobile No', 'Deal Approval Status', 'Revenue projections Prediction', 'Approval sent time', 'Linxon Vendor/ Supplier Name', 'Comments', 'Closed Won Approval', 'EST Ready', 'Closed Lost Approval', 'Previous Stage', 'Deal Aging', 'Others(Specify)', 'Linxon Approval', 'Client Budget', 'Incentive Amount', 'Wizard', 'Delivery type', 'Submission Status', 'Deal suggestions', 'Language Class Info', 'Overseas Educations Info', 'Deal Activity aging', 'Hanioo Onboarded Date & Time', 'Hanioo Not Interested Reason', 'Hanioo Discussion Notes', 'Hanioo Re-Approval Status', 'Total Call Duration', 'Total Call Count'
];

function ManageColsModal({ open, onClose, visibleCols, onSave }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(new Set(visibleCols));

  useMemo(() => {
    if (open) {
      setSelected(new Set(visibleCols));
      setSearch('');
    }
  }, [open, visibleCols]);

  if (!open) return null;

  const filteredCols = ALL_COLUMNS.filter(c => c.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-[400px] max-w-full flex flex-col max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-line flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-primary">Manage Columns</h2>
        </div>
        <div className="p-4 border-b border-line">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-ink-400" size={16} />
            <input type="text" placeholder="Search" className="w-full h-9 pl-9 pr-3 text-[14px] border border-line rounded focus:border-primary outline-none" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 thin-scroll">
          {filteredCols.map(c => {
            const isMandatory = c === 'Deal Name';
            const isChecked = selected.has(c);
            return (
              <label key={c} className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" className="cb mt-1" disabled={isMandatory} checked={isChecked || isMandatory} onChange={(e) => {
                  if (isMandatory) return;
                  const next = new Set(selected);
                  if (e.target.checked) next.add(c);
                  else next.delete(c);
                  setSelected(next);
                }} />
                <span className="text-[14px] font-medium text-ink flex-1">
                  {c}{isMandatory && <span className="text-red-500 ml-0.5">*</span>}
                </span>
              </label>
            );
          })}
        </div>
        <div className="p-4 border-t border-line flex items-center justify-center gap-3">
          <button onClick={onClose} className="btn-secondary h-8 px-4 rounded text-[13px]">Cancel</button>
          <button onClick={() => onSave(Array.from(selected))} className="btn-primary h-8 px-4 rounded text-[13px]">Save</button>
        </div>
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

export default function Deals() {
  const { deals, oldDeals, accounts, contacts, users, accountName, contactName, userName, createRecord, updateRecord, deleteRecords, accountsById } = useCRM();
  const navigate = useNavigate();
  const { refreshing, refresh } = useRefresh('Deals');
  const [savedView, setSavedView] = useState('all');
  const [layout, setLayout] = useState('list');
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
  const [viewSearch, setViewSearch] = useState('');
  
  const [pageSize, setPageSize] = useState(100);
  const [wrapText, setWrapText] = useState(true);
  const [manageColsOpen, setManageColsOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('deals_cols');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return ['Deal Name', 'Account Name', 'Contact Name', 'Stage', 'Amount', 'Closing Date', 'Probability (%)', 'Deal Owner', 'Created Time'];
  });

  const [form, setForm] = useState(null);
  const [viewing, setViewing] = useState(null);
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
        if (!conf || !conf.val) continue; // Skip if no value selected
        
        let recordVal = '';
        if (key === 'Stage') recordVal = d.stage;
        else if (key === 'Deal Owner') recordVal = d.ownerId;
        else if (key === 'Account Name') recordVal = d.accountId;
        else if (key === 'Deal Source') recordVal = d.source;
        else if (key === 'Department') recordVal = d.department;
        else if (key === 'Amount') recordVal = d.amount;
        else if (key === 'Closing Date') recordVal = d.closingDate;
        else continue; // For mock fields, assume true if we can't map it to real data
        
        const type = getFieldType(key);
        if (type === 'Dropdown') {
          if (conf.op === 'Is' && recordVal !== conf.val) return false;
          if (conf.op === 'Is Not' && recordVal === conf.val) return false;
        } else if (type === 'Number') {
          const valNum = Number(conf.val);
          if (conf.op === 'Equals' && recordVal !== valNum) return false;
          if (conf.op === 'Greater Than' && recordVal <= valNum) return false;
          if (conf.op === 'Less Than' && recordVal >= valNum) return false;
          if (conf.op === 'Between' && conf.val2) {
            if (recordVal < valNum || recordVal > Number(conf.val2)) return false;
          }
        } else if (type === 'Text') {
          const rStr = String(recordVal).toLowerCase();
          const vStr = String(conf.val).toLowerCase();
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
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deals, search, range, appliedFilters, savedView, accountName, contactName, userName]);

  const accessors = useMemo(() => ({ account: (d) => accountName(d.accountId), contact: (d) => contactName(d.contactId), owner: (d) => userName(d.ownerId), stage: (d) => STAGES.indexOf(d.stage) }), [accountName, contactName, userName]);
  const table = useTable(filtered, { accessors, pageSize });
  const reset = () => { setAppliedFilters({}); setFilterConfig({}); setSelectedFields(new Set()); setSearch(''); setRange(DEFAULT_RANGE); setSavedView('all'); };
  const moreCount = Object.keys(appliedFilters).length;

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
  const blank = (p = {}) => ({ name: '', accountId: p.account || '', contactId: '', stage: 'Need Deal Estimation', probability: 10, amount: '', closingDate: '', ownerId: 'u1', source: 'Website', department: 'Enterprise Sales', createdOn: todayISO(), description: '', lostAtStage: '' });

  useUrlActions({
    onCreate: (p) => setForm({ mode: 'create', record: blank(p) }),
    onOpen: (id) => deals.some((d) => d.id === id) && setViewing(id),
    onParams: (p) => { if (p.stage) set('stage')(p.stage); if (p.view === 'kanban') setLayout('kanban'); },
  });

  const submit = (v) => {
    const patch = { ...v, lostAtStage: v.stage === 'Closed Lost' ? v.lostAtStage || form.record.stage || 'Need Deal Estimation' : '' };
    if (form.mode === 'create') { createRecord('deals', patch); table.setSort(null); table.setPage(1); setRange({ from: '', to: '' }); }
    else updateRecord('deals', form.record.id, patch);
    setForm(null);
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
    'Deal Name': { key: 'name', header: 'Deal Name', sortable: true, render: (d) => <button type="button" onClick={() => setViewing(d.id)} className="text-primary hover:underline text-left">{d.name}</button> },
    'Account Name': { key: 'account', header: 'Account Name', sortable: true, render: (d) => <Link to={`/accounts?open=${d.accountId}`} className="text-primary hover:underline">{accountName(d.accountId)}</Link> },
    'Contact Name': { key: 'contact', header: 'Contact Name', sortable: true, render: (d) => (d.contactId ? <Link to={`/contacts?open=${d.contactId}`} className="text-primary hover:underline">{contactName(d.contactId)}</Link> : <span className="text-ink-400">—</span>) },
    'Stage': { key: 'stage', header: 'Stage', sortable: true, render: (d) => (
      stageMenu(d, <button type="button" title="Change stage" className={`inline-flex items-center justify-center gap-1 h-[28px] min-w-[94px] px-2.5 rounded-md text-[12.5px] font-medium ${badgeTone('stage', d.stage)}`}>{d.stage}</button>)
    ) },
    'Amount': { key: 'amount', header: 'Amount (₹)', sortable: true, className: 'text-ink', render: (d) => fmtINR(d.amount) },
    'Closing Date': { key: 'closingDate', header: 'Closing Date', sortable: true, render: (d) => fmtDate(d.closingDate) },
    'Probability (%)': { key: 'probability', header: 'Probability (%)', sortable: true, render: (d) => <Probability deal={d} /> },
    'Deal Owner': { key: 'owner', header: 'Deal Owner', sortable: true, render: (d) => <UserAvatar userId={d.ownerId} size={30} withName /> },
    'Created Time': { key: 'createdOn', header: 'Created Time', sortable: true, render: (d) => fmtDate(d.createdOn) },
    'Description': { key: 'description', header: 'Description', sortable: true, render: (d) => d.description || '—' },
    'Lead Source': { key: 'source', header: 'Lead Source', sortable: true, render: (d) => d.source || '—' },
  }), [accountName, contactName, userName]);

  const columns = useMemo(() => {
    const cols = visibleColumns.map(c => ({ ...(allColumnsDef[c] || { key: c, header: c, sortable: false, render: () => <span className="text-ink-400">—</span> }) }));
    cols.forEach(c => {
      if (!wrapText && !c.className?.includes('whitespace-nowrap')) c.className = (c.className ? c.className + ' ' : '') + 'whitespace-nowrap';
    });
    cols.push({ key: 'actions', header: '', align: 'center', render: (d) => (
      <div className="flex items-center justify-center gap-1.5">
        <button className="icon-btn-primary" onClick={() => setViewing(d.id)} aria-label={`View ${d.name}`}><Eye size={17} /></button>
        <button className="icon-btn-primary" onClick={() => setForm({ mode: 'edit', record: d })} aria-label={`Edit ${d.name}`}><Pencil size={16} /></button>
        <ActionMenu items={[
          { label: 'Update amount, probability & date', icon: Pencil, onClick: () => { setViewing(d.id); setQuick({ amount: d.amount, probability: d.probability, closingDate: d.closingDate }); } },
          { label: 'Mark as Deal Closed (Won)', icon: Trophy, onClick: () => changeStage(d, 'Deal Closed (Won)') },
          { label: 'Mark as Closed Lost', icon: XCircle, onClick: () => changeStage(d, 'Closed Lost') },
          { divider: true },
          { label: 'Delete deal', icon: Trash2, danger: true, onClick: () => setConfirm({ ids: [d.id], label: d.name }) },
        ]} />
      </div>
    ) });
    return cols;
  }, [visibleColumns, allColumnsDef, wrapText, changeStage]);

  const rec = deals.find((d) => d.id === viewing);
  const selectedIds = [...table.selected];

  const toggleField = (field) => {
    const next = new Set(selectedFields);
    if (next.has(field)) {
      next.delete(field);
      setFilterConfig(prev => { const p = { ...prev }; delete p[field]; return p; });
    } else {
      next.add(field);
      setFilterConfig(prev => ({ ...prev, [field]: { op: FILTER_TYPES[getFieldType(field)][0], val: '' } }));
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
          const type = getFieldType(field);
          const ops = FILTER_TYPES[type];
          return (
            <div key={field} className="space-y-1.5">
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

  const hasConfig = Object.keys(filterConfig).length > 0;

  return (
    <div>
      {form ? (
        <CreateDeal record={form.record} mode={form.mode} onSave={(data, isNew) => { submit(data); if (isNew) setForm({ mode: 'create', record: blank() }); }} onCancel={() => setForm(null)} />
      ) : viewing ? (
        <DealDetail id={viewing} onClose={() => { setViewing(null); setQuick(null); }} />
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
                <MenuItem close={close}><span className="text-primary font-medium">Show custom views as Dropdown</span></MenuItem>
                <MenuItem close={close}><span className="text-primary font-medium">New Custom View</span></MenuItem>
                <MenuItem close={close}><span className="text-primary font-medium">Manage Custom View</span></MenuItem>
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
          filterActive: filtersOpen, onFilter: () => setFiltersOpen((o) => !o),
          sortOptions: [{ key: 'name', label: 'Deal Name' }, { key: 'amount', label: 'Amount' }, { key: 'closingDate', label: 'Closing Date' }, { key: 'probability', label: 'Probability' }, { key: 'stage', label: 'Stage' }, { key: 'createdOn', label: 'Created On' }],
          sort: table.sort, onSort: table.setSort, layouts: ['list', 'kanban', 'grid', 'chart'], layout, onLayout: setLayout,
          onRefresh: refresh, refreshing, dense, onDense: () => setDense((d) => !d), module: 'Deals',
          primary: { label: 'Create Deal', onClick: () => setForm({ mode: 'create', record: blank() }), menu: [
            { label: 'Create Deal', icon: Plus, onClick: () => setForm({ mode: 'create', record: blank() }) },
            { label: 'Open Kanban board', onClick: () => setLayout('kanban') },
            { label: 'Export deals (CSV)', icon: Download, onClick: () => exportRows(table.sorted) },
          ] },
          moreItems: [
            { label: 'Mass Transfer', onClick: () => {} },
            { label: 'Mass Delete', onClick: () => setConfirm({ ids: selectedIds.length ? selectedIds : deals.map(d => d.id), label: selectedIds.length ? `${selectedIds.length} deals` : 'all deals' }) },
            { label: 'Mass Update', onClick: () => setBulk('stage') },
            { label: 'Manage Tags', onClick: () => {} },
            { label: 'Assignment Rules', onClick: () => {} },
            { label: 'Drafts', onClick: () => {} },
            { label: 'Mass Email', onClick: () => {} },
            { label: 'Deduplicate Deals', onClick: () => {} },
            { label: 'Create Client Script', onClick: () => {} },
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

        {filtersOpen && (
          <aside className="card hidden md:flex flex-col w-[250px] shrink-0 sticky top-[72px] h-[calc(100vh-86px)] overflow-hidden">
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
                <summary className="py-2.5 text-[14px] font-semibold text-ink cursor-pointer select-none flex items-center gap-1 -ml-1">
                  <ChevronDown size={16} className="group-open:rotate-180 transition-transform -rotate-90" />
                  Saved Filters <span className="ml-1 text-[11px] bg-line text-ink-600 px-1.5 py-0.5 rounded-sm">5</span>
                </summary>
                <div className="pl-5 pb-4 space-y-3 text-[13.5px] text-ink-600">
                  <div className="cursor-pointer hover:text-primary truncate">My Open Deals</div>
                  <div className="cursor-pointer hover:text-primary truncate">Closing This Month</div>
                  <button className="text-primary hover:underline mt-1 text-[12.5px]">+ Save Current Filter</button>
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
              <div className="px-3.5 py-3 border-t border-line bg-page flex gap-2">
                <button onClick={applyFilters} className="btn-primary flex-1 h-8 text-[13px]">Apply Filter</button>
                <button onClick={() => { setFilterConfig({}); setSelectedFields(new Set()); setAppliedFilters({}); }} className="btn-secondary flex-1 h-8 text-[13px]">Clear Filter</button>
              </div>
            )}
          </aside>
        )}

        <div className="flex-1 min-w-0">
          <section className="card overflow-hidden">
            <BulkBar count={selectedIds.length} onClear={table.clearSelection}>
              <BulkButton onClick={() => setBulk('stage')}>Change stage</BulkButton>
              <BulkButton icon={UserCog} onClick={() => setBulk('owner')}>Change owner</BulkButton>
              <BulkButton icon={Download} onClick={() => exportRows(deals.filter((d) => table.selected.has(d.id)))}>Export</BulkButton>
              <BulkButton icon={Trash2} danger onClick={() => setConfirm({ ids: selectedIds, label: `${selectedIds.length} deals` })}>Delete</BulkButton>
            </BulkBar>
            {layout === 'list' && <DataTable columns={columns} rows={table.pageRows} table={table} loading={refreshing} dense={dense} minWidth={1290}
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
                        <MenuItem close={close} onClick={() => { localStorage.removeItem('deals_cols'); setVisibleColumns(['Deal Name', 'Account Name', 'Contact Name', 'Stage', 'Amount', 'Closing Date', 'Probability (%)', 'Deal Owner', 'Created Time']); }}>Reset Column Size</MenuItem>
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
            />}
            {layout === 'kanban' && (
              <div className="p-3">
                <p className="text-[12.5px] text-ink-500 mb-2.5">Drag a card to another column to change its stage. Probability updates to the stage default.</p>
                <KanbanView groups={STAGES.map((s) => ({ key: s, label: s, color: STAGE_COLORS[s] }))} rows={table.sorted} groupOf={(d) => d.stage}
                  onMove={changeStage} onCardClick={(d) => setViewing(d.id)} summary={(items) => `${fmtCompact(sumBy(items, (d) => d.amount))} · ${items.length} deals`}
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
            {layout === 'grid' && <div className="p-3"><GridView rows={table.pageRows} onCardClick={(d) => setViewing(d.id)} renderCard={(d) => (
              <>
                <div className="flex items-start justify-between gap-2"><div className="font-semibold text-ink leading-snug">{d.name}</div><StatusBadge kind="stage" value={d.stage} size="sm" /></div>
                <div className="text-[12.5px] text-ink-500 mt-1">{accountName(d.accountId)}</div>
                <div className="text-[19px] font-bold text-ink mt-3">{fmtINR(d.amount)}</div>
                <div className="mt-2"><Probability deal={d} /></div>
                <div className="mt-3 flex items-center justify-between text-[12px] text-ink-500"><span>Closes {fmtDate(d.closingDate)}</span><UserAvatar userId={d.ownerId} size={24} /></div>
              </>
            )} /></div>}
            {layout === 'chart' && <ChartView title="Deals by stage (filtered)" data={STAGES.map((s) => ({ name: s, value: filtered.filter((d) => d.stage === s).length, color: STAGE_COLORS[s] }))} valueLabel="Deals" />}
            {(layout === 'list' || layout === 'grid') && <div className="px-4"><Pagination table={table} noun="deals" /></div>}
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
      <FormModal open={!!bulk} onClose={() => setBulk(null)} size="sm" title={bulk === 'owner' ? 'Change owner' : 'Change stage'} subtitle={`Applies to ${selectedIds.length} selected deals.`}
        fields={[bulk === 'owner' ? { name: 'value', label: 'New owner', type: 'select', options: ownerOptions, required: true, span: 2 } : { name: 'value', label: 'Stage', type: 'select', options: STAGES, required: true, span: 2 }]}
        initial={bulk ? { value: '' } : null} submitLabel="Apply"
        onSubmit={({ value }) => { selectedIds.forEach((id) => { const d = deals.find((x) => x.id === id); updateRecord('deals', id, bulk === 'owner' ? { ownerId: value } : stagePatch(d, value)); }); setBulk(null); table.clearSelection(); }} />
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} title="Delete deals?" message={confirm ? `Delete ${confirm.label}? Pipeline totals and stage reports update immediately.` : ''}
        onConfirm={() => { deleteRecords('deals', confirm.ids); table.clearSelection(); setViewing(null); }} />
    </div>
  );
}
