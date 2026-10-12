import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, CalendarPlus, ChevronDown, Clock3, Download, Eye, Pencil, Phone, PhoneCall, PhoneIncoming, PhoneMissed, PhoneOutgoing, Plus, Search, Trash2, UserCog, Settings2, Check, CheckCircle2 } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import useTable from '../../components/common/useTable';
import StatusBadge, { badgeTone } from '../../components/common/StatusBadge';
import { PersonAvatar, UserAvatar } from '../../components/common/Avatar';
import ActionMenu from '../../components/common/ActionMenu';
import FormModal from '../../components/common/RecordForm';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Drawer, DetailGrid, SectionTitle } from '../../components/common/Modal';
import Dropdown, { MenuItem, MenuLabel, MenuDivider } from '../../components/common/Dropdown';
import BulkBar, { BulkButton } from '../../components/common/BulkBar';
import { ChartView, GridView, KanbanView } from '../../components/common/Views';
import { useRefresh, useUrlActions } from '../../components/common/hooks';
import { CALL_STATUSES, CALL_TYPES } from '../../data/seedData';
import { fmtDate, fmtDuration, fmtTime, inRange, sumBy, trend } from '../../utils/calculations';
import { exportCSV } from '../../utils/exportCSV';
import CallDetail from './CallDetail';

const DEFAULT_RANGE = { from: '2026-01-01', to: '2026-12-31' };
const STATUS_COLORS = { Completed: '#12C26B', Missed: '#FF3344', Busy: '#FFBB28', Scheduled: '#2F7BF5' };
const nowLocal = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };

const ALL_COLUMNS = [
  'Note Badge', 'Subject', 'Call Manager', 'Description', 'Call Type', 'Call Start Time', 'Call Duration', 'Related To', 'Contact Name', 'Created Time', 'Call Owner', 'Call Purpose', 'Call Duration (in seconds)', 'Call Result', 'Created By', 'Modified By', 'Modified Time', 'Tag', 'Outgoing Call Status'
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
            const isMandatory = c === 'Subject';
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

const SYSTEM_FILTERS = ['Record Action', 'Related Records Action', 'Touched Records', 'Untouched Records'];
const FIELD_FILTERS = ['AI Analysis', 'Call Agenda', 'Call Connect Status', 'Call Duration', 'Call Duration (in seconds)', 'Call Manager', 'Call Owner', 'Call Purpose', 'Call Result', 'Call Start Time', 'Call Type', 'Caller ID', 'Contact Name'];

const FILTER_TYPES = {
  Text: ['Contains', 'Equals', 'Starts With', 'Is Empty'],
  Number: ['Equals', 'Greater Than', 'Less Than', 'Between'],
  Date: ['Before', 'After', 'Between'],
  Dropdown: ['Is', 'Is Not', 'In']
};

const getFieldType = (name) => {
  if (name.includes('Time') || name.includes('Date')) return 'Date';
  if (name.includes('Duration')) return 'Number';
  if (['Call Type', 'Call Manager', 'Call Owner', 'Call Connect Status', 'Contact Name', 'Call Result', 'Call Purpose'].includes(name)) return 'Dropdown';
  return 'Text';
};

function CallTypeIcon({ type }) {
  const Icon = type === 'Outbound' ? PhoneOutgoing : PhoneIncoming;
  return <span className="inline-flex items-center gap-2 whitespace-nowrap"><Icon size={16} className={type === 'Outbound' ? 'text-primary' : 'text-success'} />{type}</span>;
}

export default function Calls() {
  const { calls, contacts, users, baselines, accountName, contactName, userName, contactsById, createRecord, updateRecord, deleteRecords } = useCRM();
  const { refreshing, refresh } = useRefresh('Calls');
  const [savedView, setSavedView] = useState('all');
  const [layout, setLayout] = useState('list');
  const [dense, setDense] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [search, setSearch] = useState('');
  const [range, setRange] = useState(DEFAULT_RANGE);
  const [filterSearch, setFilterSearch] = useState('');
  const [selectedFields, setSelectedFields] = useState(new Set(['Call Type', 'Call Owner']));
  const [filterConfig, setFilterConfig] = useState({
    'Call Type': { op: 'Is', val: '' },
    'Call Owner': { op: 'Is', val: '' },
  });
  const [appliedFilters, setAppliedFilters] = useState({});
  const [viewSearch, setViewSearch] = useState('');
  
  const [pageSize, setPageSize] = useState(100);
  const [wrapText, setWrapText] = useState(true);
  const [manageColsOpen, setManageColsOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('calls_cols');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return ['Note Badge', 'Subject', 'Call Manager', 'Description', 'Call Type', 'Call Start Time', 'Call Duration', 'Related To', 'Contact Name', 'Created Time'];
  });

  const [form, setForm] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [bulk, setBulk] = useState(null);

  const allViews = [
    { category: 'Public Views', key: 'all', label: 'All Calls', test: () => true },
    { category: 'Public Views', key: 'attended', label: 'Attended Calls', test: (c) => c.status === 'Completed' },
    { category: 'Public Views', key: 'sharedByMe', label: 'Calls Shared by Me', test: (c) => false },
    { category: 'Public Views', key: 'sharedToMe', label: 'Calls Shared to Me', test: (c) => false },
    { category: 'Public Views', key: 'cancelled', label: 'Cancelled Calls', test: (c) => false },
    { category: 'Public Views', key: 'completed', label: 'Completed Calls', test: (c) => c.status === 'Completed' },
    { category: 'Public Views', key: 'incoming', label: 'Incoming Calls', test: (c) => c.type === 'Inbound' },
    { category: 'Public Views', key: 'missed', label: 'Missed Calls', test: (c) => c.status === 'Missed' },
    { category: 'My Calls', key: 'myAttended', label: 'My Attended Calls', test: (c) => c.ownerId === 'u1' && c.status === 'Completed' },
    { category: 'My Calls', key: 'mine', label: 'My Calls', test: (c) => c.ownerId === 'u1' },
    { category: 'My Calls', key: 'myCancelled', label: 'My Cancelled Calls', test: (c) => false },
    { category: 'My Calls', key: 'myIncoming', label: 'My Incoming Calls', test: (c) => c.ownerId === 'u1' && c.type === 'Inbound' },
    { category: 'My Calls', key: 'myMissed', label: 'My Missed Calls', test: (c) => c.ownerId === 'u1' && c.status === 'Missed' },
    { category: 'My Calls', key: 'myOutgoing', label: 'My Outgoing Calls', test: (c) => c.ownerId === 'u1' && c.type === 'Outbound' },
    { category: 'My Calls', key: 'myOverdue', label: 'My Overdue Calls', test: (c) => c.ownerId === 'u1' && c.status === 'Scheduled' && c.dateTime < todayISO() },
    { category: 'My Calls', key: 'myScheduled', label: 'My Scheduled Calls', test: (c) => c.ownerId === 'u1' && c.status === 'Scheduled' },
    { category: 'My Calls', key: 'myScheduledOverdue', label: 'My Scheduled + Overdue Calls', test: (c) => c.ownerId === 'u1' && c.status === 'Scheduled' },
    { category: 'My Calls', key: 'myTodayScheduled', label: 'My Today\'s Scheduled Calls', test: (c) => c.ownerId === 'u1' && c.status === 'Scheduled' && c.dateTime.startsWith(todayISO().slice(0, 10)) },
  ];

  const views = [
    { key: 'all', label: 'All Calls', test: () => true },
    { key: 'mine', label: 'My Calls', test: (c) => c.ownerId === 'u1' },
  ].map((v) => ({ ...v, count: calls.filter(v.test).length }));
  
  const viewTest = allViews.find((v) => v.key === savedView)?.test;
  const ownerOptions = useMemo(() => users.map((u) => ({ value: u.id, label: u.name })), [users]);
  const contactOptions = useMemo(() => [...contacts].sort((a, b) => a.name.localeCompare(b.name)).map((c) => ({ value: c.id, label: `${c.name} — ${accountName(c.accountId)}` })), [contacts, accountName]);

  const filterOptionsContext = useMemo(() => ({
    'Call Type': CALL_TYPES.map(s => ({ value: s, label: s })),
    'Call Owner': ownerOptions,
    'Call Manager': ownerOptions,
    'Contact Name': contactOptions,
    'Call Result': CALL_STATUSES.map(s => ({ value: s, label: s })),
  }), [ownerOptions, contactOptions]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return calls.filter((c) => {
      if (viewTest && !viewTest(c)) return false;
      if (!inRange(c.dateTime, range)) return false;
      if (q && ![c.subject, contactName(c.contactId), accountName(c.accountId), c.notes, userName(c.ownerId)].some((v) => String(v).toLowerCase().includes(q))) return false;
      
      for (const [key, conf] of Object.entries(appliedFilters)) {
        if (!conf || !conf.val) continue;
        let recordVal = '';
        if (key === 'Call Type') recordVal = c.type;
        else if (key === 'Call Owner' || key === 'Call Manager') recordVal = c.ownerId;
        else if (key === 'Call Start Time') recordVal = c.dateTime;
        else if (key === 'Contact Name') recordVal = c.contactId;
        else if (key === 'Call Duration') recordVal = c.duration;
        else if (key === 'Call Duration (in seconds)') recordVal = c.duration;
        else if (key === 'Call Result') recordVal = c.status;
        else continue;
        
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
  }, [calls, search, range, appliedFilters, savedView, accountName, contactName, userName]);

  const accessors = useMemo(() => ({ contact: (c) => contactName(c.contactId), account: (c) => accountName(c.accountId), owner: (c) => userName(c.ownerId) }), [accountName, contactName, userName]);
  const table = useTable(filtered, { accessors, pageSize });
  const reset = () => { setAppliedFilters({}); setFilterConfig({}); setSelectedFields(new Set()); setSearch(''); setRange(DEFAULT_RANGE); setSavedView('all'); };
  const moreCount = Object.keys(appliedFilters).length;

  const fields = [
    { name: 'subject', label: 'Call Subject', required: true, span: 2 },
    { name: 'contactId', label: 'Contact Name', type: 'select', options: contactOptions, required: true, help: 'The account is linked automatically from the contact.' },
    { name: 'type', label: 'Call Type', type: 'select', options: CALL_TYPES, required: true },
    { name: 'status', label: 'Call Status', type: 'select', options: CALL_STATUSES, required: true },
    {
      name: 'dateTime', label: 'Call Date & Time', type: 'datetime-local', required: true,
      validate: (v, vals) => (!vals.id && vals.status === 'Scheduled' && v < nowLocal() ? 'Scheduled calls need a future date and time.' : ''),
    },
    { name: 'durMin', label: 'Duration (minutes)', type: 'number', min: 0, max: 600, hidden: (v) => v.status === 'Scheduled' },
    { name: 'durSec', label: 'Duration (seconds)', type: 'number', min: 0, max: 59, hidden: (v) => v.status === 'Scheduled' },
    { name: 'ownerId', label: 'Call Owner', type: 'select', options: ownerOptions, required: true },
    { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
  ];
  const blank = (p = {}) => ({ subject: '', contactId: p.contact || '', type: 'Outbound', status: p.schedule ? 'Scheduled' : 'Completed', dateTime: nowLocal(), durMin: 0, durSec: 0, ownerId: 'u1', notes: '' });
  const toForm = (c) => ({ ...c, durMin: Math.floor(c.duration / 60), durSec: c.duration % 60 });

  useUrlActions({
    onCreate: (p) => setForm({ mode: 'create', record: blank(p) }),
    onOpen: (id) => calls.some((c) => c.id === id) && setViewing(id),
    onParams: (p) => { if (p.status) { /* handled */ } },
  });

  const submit = (v) => {
    const duration = v.status === 'Scheduled' ? 0 : (Number(v.durMin) || 0) * 60 + (Number(v.durSec) || 0);
    const { durMin, durSec, ...rest } = v;
    const rec = { ...rest, duration, accountId: contactsById[v.contactId]?.accountId || '' };
    if (form.mode === 'create') { createRecord('calls', rec); table.setSort({ key: 'dateTime', dir: 'desc' }); table.setPage(1); setRange({ from: '', to: '' }); }
    else updateRecord('calls', form.record.id, rec);
    setForm(null);
  };

  const setStatus = (c, status) => {
    if (status === 'Completed' && !c.duration) { setForm({ mode: 'edit', record: toForm({ ...c, status: 'Completed' }) }); return; }
    updateRecord('calls', c.id, { status, ...(status === 'Missed' || status === 'Busy' ? { duration: 0 } : {}) });
  };

  const exportRows = (rows) => exportCSV('calls', rows, [
    { label: 'Call Subject', value: (c) => c.subject }, { label: 'Contact Name', value: (c) => contactName(c.contactId) }, { label: 'Account Name', value: (c) => accountName(c.accountId) },
    { label: 'Call Type', value: (c) => c.type }, { label: 'Date & Time', value: (c) => c.dateTime.replace('T', ' ') }, { label: 'Duration', value: (c) => fmtDuration(c.duration) },
    { label: 'Status', value: (c) => c.status }, { label: 'Owner', value: (c) => userName(c.ownerId) }, { label: 'Notes', value: (c) => c.notes },
  ]);

  const allColumnsDef = useMemo(() => ({
    'Note Badge': { key: 'noteBadge', header: '', sortable: false, render: () => <span className="text-ink-300">—</span> },
    'Subject': { key: 'subject', header: 'Subject', sortable: true, render: (c) => <button type="button" onClick={() => setViewing(c.id)} className="text-primary hover:underline text-left">{c.subject}</button> },
    'Call Manager': { key: 'callManager', header: 'Call Manager', sortable: true, render: (c) => <UserAvatar userId={c.ownerId} size={30} withName /> },
    'Description': { key: 'notes', header: 'Description', sortable: true, render: (c) => <span className="line-clamp-2 max-w-[150px] leading-snug text-ink-600" title={c.notes}>{c.notes || '—'}</span> },
    'Call Type': { key: 'type', header: 'Call Type', sortable: true, render: (c) => <CallTypeIcon type={c.type} /> },
    'Call Start Time': { key: 'dateTime', header: 'Call Start Time', sortable: true, render: (c) => <span className="leading-snug block whitespace-nowrap">{fmtDate(c.dateTime)} {fmtTime(c.dateTime)}</span> },
    'Call Duration': { key: 'duration', header: 'Call Duration', sortable: true, className: 'whitespace-nowrap', render: (c) => (c.status === 'Scheduled' ? <span className="text-ink-400">—</span> : fmtDuration(c.duration)) },
    'Related To': { key: 'account', header: 'Related To', sortable: true, render: (c) => <Link to={`/accounts?open=${c.accountId}`} className="text-primary hover:underline whitespace-nowrap">{accountName(c.accountId)}</Link> },
    'Contact Name': { key: 'contact', header: 'Contact Name', sortable: true, render: (c) => (
      <Link to={`/contacts?open=${c.contactId}`} className="flex items-center gap-2.5 text-primary hover:underline whitespace-nowrap"><PersonAvatar name={contactName(c.contactId)} size={30} solid />{contactName(c.contactId)}</Link>
    ) },
    'Created Time': { key: 'createdTime', header: 'Created Time', sortable: false, render: (c) => fmtDate(c.dateTime) },
    'Call Owner': { key: 'owner', header: 'Call Owner', sortable: true, render: (c) => <UserAvatar userId={c.ownerId} size={30} withName /> },
    'Call Purpose': { key: 'purpose', header: 'Call Purpose', sortable: false, render: () => '—' },
    'Call Duration (in seconds)': { key: 'durationSec', header: 'Call Duration (in seconds)', sortable: true, render: (c) => c.duration || 0 },
    'Call Result': { key: 'status', header: 'Call Result', sortable: true, render: (c) => c.status },
    'Created By': { key: 'createdBy', header: 'Created By', sortable: false, render: (c) => userName(c.ownerId) },
    'Modified By': { key: 'modifiedBy', header: 'Modified By', sortable: false, render: (c) => userName(c.ownerId) },
    'Modified Time': { key: 'modifiedTime', header: 'Modified Time', sortable: false, render: (c) => fmtDate(c.dateTime) },
    'Tag': { key: 'tag', header: 'Tag', sortable: false, render: () => '—' },
    'Outgoing Call Status': { key: 'outgoingStatus', header: 'Outgoing Call Status', sortable: false, render: (c) => c.type === 'Outbound' ? c.status : '—' }
  }), [accountName, contactName, userName]);

  const columns = useMemo(() => {
    const cols = visibleColumns.map(c => ({ ...(allColumnsDef[c] || { key: c, header: c, sortable: false, render: () => <span className="text-ink-400">—</span> }) }));
    cols.forEach(c => {
      if (!wrapText && !c.className?.includes('whitespace-nowrap')) c.className = (c.className ? c.className + ' ' : '') + 'whitespace-nowrap';
    });
    cols.push({ key: 'actions', header: '', align: 'center', render: (c) => (
      <div className="flex items-center justify-center gap-1.5">
        <button className="icon-btn-primary" onClick={() => setViewing(c.id)} aria-label={`View ${c.subject}`}><Eye size={17} /></button>
        <button className="icon-btn-primary" onClick={() => setForm({ mode: 'edit', record: toForm(c) })} aria-label={`Edit ${c.subject}`}><Pencil size={16} /></button>
        <ActionMenu items={[
          ...CALL_STATUSES.filter((s) => s !== c.status).map((s) => ({ label: `Mark as ${s}`, onClick: () => setStatus(c, s) })),
          { label: 'Schedule follow-up call', icon: CalendarPlus, onClick: () => setForm({ mode: 'create', record: { ...blank({ contact: c.contactId, schedule: true }), subject: `Follow up: ${c.subject}` } }) },
          { divider: true },
          { label: 'Delete call', icon: Trash2, danger: true, onClick: () => setConfirm({ ids: [c.id], label: c.subject }) },
        ]} />
      </div>
    ) });
    return cols;
  }, [visibleColumns, allColumnsDef, wrapText]);

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
  const rec = calls.find((c) => c.id === viewing);
  const history = rec ? calls.filter((c) => c.contactId === rec.contactId).sort((a, b) => b.dateTime.localeCompare(a.dateTime)) : [];
  const selectedIds = [...table.selected];

  return (
    <div className="relative">
      <div className={viewing ? "hidden" : "block"}>
        <PageHeader
        views={views} view={savedView} onViewChange={(v) => { setSavedView(v); table.setPage(1); }}
        tabMenu={(close) => {
          const q = viewSearch.toLowerCase();
          const p = allViews.filter((v) => v.category === 'Public Views' && v.label.toLowerCase().includes(q));
          const m = allViews.filter((v) => v.category === 'My Calls' && v.label.toLowerCase().includes(q));
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
                    <MenuLabel>My Calls</MenuLabel>
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
        toolbar={{
          filterActive: filtersOpen, onFilter: () => setFiltersOpen((o) => !o),
          sortOptions: [{ key: 'dateTime', label: 'Call Date & Time' }, { key: 'duration', label: 'Duration' }, { key: 'subject', label: 'Call Subject' }, { key: 'contact', label: 'Contact Name' }, { key: 'status', label: 'Status' }],
          sort: table.sort, onSort: table.setSort, layouts: ['list', 'kanban', 'grid', 'chart'], layout, onLayout: setLayout,
          onRefresh: refresh, refreshing, dense, onDense: () => setDense((d) => !d), module: 'Calls',
          primary: { label: 'Create Call', onClick: () => setForm({ mode: 'create', record: blank() }), menu: [
            { label: 'Create Call', icon: Plus, onClick: () => setForm({ mode: 'create', record: blank() }) },
            { label: 'Schedule a Call', icon: CalendarPlus, onClick: () => setForm({ mode: 'create', record: { ...blank({ schedule: true }), dateTime: '' } }) },
            { label: 'Export calls (CSV)', icon: Download, onClick: () => exportRows(table.sorted) },
          ] },
          moreItems: [
            { label: 'Mass Transfer', onClick: () => {} },
            { label: 'Mass Delete', onClick: () => setConfirm({ ids: selectedIds.length ? selectedIds : calls.map(c => c.id), label: selectedIds.length ? `${selectedIds.length} calls` : 'all calls' }) },
            { label: 'Mass Update', onClick: () => setBulk('status') },
            { label: 'Export Calls', onClick: () => exportRows(table.sorted) },
            { label: 'Print View', onClick: () => window.print() },
          ],
        }}
      />

      <div className="flex gap-3 items-start mt-3">
        {filtersOpen && (
          <aside className="card hidden md:flex flex-col w-[250px] shrink-0 sticky top-[72px] h-[calc(100vh-86px)] overflow-hidden">
            <div className="px-3.5 pt-4 pb-2">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[15px] font-semibold text-ink whitespace-nowrap">Filter Calls by</h2>
                {(moreCount > 0 || search || filterSearch || range.from !== DEFAULT_RANGE.from || range.to !== DEFAULT_RANGE.to) && <button onClick={reset} className="text-[12.5px] text-primary hover:underline">Clear</button>}
              </div>
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-2.5 text-ink-400" size={14} />
                <input type="text" placeholder="Search" className="w-full h-9 pl-8 pr-3 text-[13px] border border-line rounded-md focus:border-primary outline-none" value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto thin-scroll px-3.5 pb-4">
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
              <BulkButton onClick={() => setBulk('status')}>Update status</BulkButton>
              <BulkButton icon={UserCog} onClick={() => setBulk('owner')}>Change owner</BulkButton>
              <BulkButton icon={Download} onClick={() => exportRows(calls.filter((c) => table.selected.has(c.id)))}>Export</BulkButton>
              <BulkButton icon={Trash2} danger onClick={() => setConfirm({ ids: selectedIds, label: `${selectedIds.length} calls` })}>Delete</BulkButton>
            </BulkBar>
            {layout === 'list' && <DataTable columns={columns} rows={table.pageRows} table={table} loading={refreshing} dense={dense} minWidth={1280}
              emptyAction={<button className="btn-primary mt-2 h-9" onClick={() => setForm({ mode: 'create', record: blank() })}><Plus size={16} />Log a Call</button>}
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
                        <MenuItem close={close} onClick={() => { localStorage.removeItem('calls_cols'); setVisibleColumns(['Note Badge', 'Subject', 'Call Manager', 'Description', 'Call Type', 'Call Start Time', 'Call Duration', 'Related To', 'Contact Name', 'Created Time']); }}>Reset Column Size</MenuItem>
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
            {layout === 'kanban' && <div className="p-3"><KanbanView groups={CALL_STATUSES.map((s) => ({ key: s, label: s, color: STATUS_COLORS[s] }))} rows={table.sorted} groupOf={(c) => c.status}
              onMove={setStatus} onCardClick={(c) => setViewing(c.id)}
              renderCard={(c) => (<div><div className="text-[13.5px] font-semibold text-ink">{c.subject}</div><div className="text-[12px] text-ink-500 mt-0.5">{contactName(c.contactId)} · {accountName(c.accountId)}</div><div className="flex items-center justify-between mt-2 text-[12px] text-ink-600"><CallTypeIcon type={c.type} /><span>{fmtDate(c.dateTime)}</span></div></div>)} /></div>}
            {layout === 'grid' && <div className="p-3"><GridView rows={table.pageRows} onCardClick={(c) => setViewing(c.id)} renderCard={(c) => (
              <>
                <div className="flex items-start justify-between gap-2"><div className="font-semibold text-ink">{c.subject}</div><StatusBadge kind="callStatus" value={c.status} size="sm" /></div>
                <div className="flex items-center gap-2 mt-2 text-[12.5px] text-ink-600"><PersonAvatar name={contactName(c.contactId)} size={24} solid />{contactName(c.contactId)} · {accountName(c.accountId)}</div>
                <div className="flex items-center justify-between mt-3 text-[12.5px] text-ink-600"><CallTypeIcon type={c.type} /><span>{fmtDate(c.dateTime)} {fmtTime(c.dateTime)}</span></div>
                <p className="text-[12.5px] text-ink-500 mt-2 line-clamp-2">{c.notes}</p>
              </>
            )} /></div>}
            {layout === 'chart' && <ChartView title="Calls by status (filtered)" data={CALL_STATUSES.map((s) => ({ name: s, value: filtered.filter((c) => c.status === s).length, color: STATUS_COLORS[s] }))} valueLabel="Calls" />}
            {(layout === 'list' || layout === 'grid') && <div className="px-4"><Pagination table={table} noun="calls" /></div>}
          </section>
        </div>
      </div>
      </div>

      <FormModal open={!!form} onClose={() => setForm(null)} title={form?.mode === 'edit' ? 'Edit call' : form?.record?.status === 'Scheduled' ? 'Schedule a call' : 'Log a call'} fields={fields} initial={form?.record} onSubmit={submit}
        submitLabel={form?.mode === 'edit' ? 'Save changes' : form?.record?.status === 'Scheduled' ? 'Schedule call' : 'Log call'} />
      <FormModal open={!!bulk} onClose={() => setBulk(null)} size="sm" title={bulk === 'owner' ? 'Change owner' : 'Update call status'} subtitle={`Applies to ${selectedIds.length} selected calls.`}
        fields={[bulk === 'owner' ? { name: 'value', label: 'New owner', type: 'select', options: ownerOptions, required: true, span: 2 } : { name: 'value', label: 'Status', type: 'select', options: CALL_STATUSES.filter((s) => s !== 'Completed'), required: true, span: 2, help: 'Completing a call needs a duration, so do that one call at a time.' }]}
        initial={bulk ? { value: '' } : null} submitLabel="Apply"
        onSubmit={({ value }) => { selectedIds.forEach((id) => updateRecord('calls', id, bulk === 'owner' ? { ownerId: value } : { status: value })); setBulk(null); table.clearSelection(); }} />
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} title="Delete calls?" message={confirm ? `Delete ${confirm.label}? This removes ${confirm.ids.length > 1 ? 'them' : 'it'} from call history.` : ''}
        onConfirm={() => { deleteRecords('calls', confirm.ids); table.clearSelection(); setViewing(null); }} />

      <ManageColsModal 
        open={manageColsOpen} 
        onClose={() => setManageColsOpen(false)} 
        visibleCols={visibleColumns} 
        onSave={(cols) => { setVisibleColumns(cols); localStorage.setItem('calls_cols', JSON.stringify(cols)); setManageColsOpen(false); }} 
      />

      {viewing && (
        <CallDetail 
          id={viewing} 
          onClose={() => setViewing(null)} 
          onEdit={(c) => setForm({ mode: "edit", record: toForm(c) })}
          onDelete={(id) => { setConfirm({ ids: [id], label: "this call" }); }}
          onPrev={() => {
            const idx = table.sorted.findIndex(c => c.id === viewing);
            if (idx > 0) setViewing(table.sorted[idx - 1].id);
          }}
          onNext={() => {
            const idx = table.sorted.findIndex(c => c.id === viewing);
            if (idx < table.sorted.length - 1) setViewing(table.sorted[idx + 1].id);
          }}
          hasPrev={table.sorted.findIndex(c => c.id === viewing) > 0}
          hasNext={table.sorted.findIndex(c => c.id === viewing) !== -1 && table.sorted.findIndex(c => c.id === viewing) < table.sorted.length - 1}
        />
      )}
    </div>
  );
}
