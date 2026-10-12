import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, CalendarCheck2, ChevronDown, ChevronLeft, ChevronRight, Clock3, Download, ExternalLink, Eye, Mail, Pencil, Phone, Plus, SlidersHorizontal, Trash2, UserCog,
} from 'lucide-react';
import { useCRM } from '../../context/crmContextInstance';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import useTable from '../../components/common/useTable';
import StatusBadge from '../../components/common/StatusBadge';
import { PersonAvatar, UserAvatar } from '../../components/common/Avatar';
import ActionMenu from '../../components/common/ActionMenu';
import FormModal from '../../components/common/RecordForm';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Drawer, DetailGrid, SectionTitle } from '../../components/common/Modal';
import Dropdown, { MenuItem, MenuLabel } from '../../components/common/Dropdown';
import SearchInput from '../../components/common/SearchInput';
import BulkBar, { BulkButton } from '../../components/common/BulkBar';
import { ChartView, GridView, KanbanView } from '../../components/common/Views';
import { useRefresh, useUrlActions } from '../../components/common/hooks';
import { LEAD_SOURCES, LEAD_TAGS, LIFECYCLES } from '../../data/seedData';
import { addDays, fmtDate, fmtDuration, fmtINR, fmtTime, todayISO } from '../../utils/calculations';
import { exportCSV } from '../../utils/exportCSV';

const LIFECYCLE_COLORS = { New: '#6366F1', Contacted: '#FF7B3A', Engaged: '#8E3CF2', Qualified: '#12C26B', Customer: '#14B8A6' };

const FIELD_FILTERS = [
  { key: 'accountName', label: 'Account Name', type: 'text' },
  { key: 'assistant', label: 'Assistant', type: 'text' },
  { key: 'asstPhone', label: 'Asst Phone', type: 'text' },
  { key: 'name', label: 'Contact Name', type: 'text' },
  { key: 'department', label: 'Department', type: 'text' },
  { key: 'email', label: 'Email', type: 'text' },
  { key: 'emailOptOut', label: 'Email Opt Out', type: 'bool' },
  { key: 'fax', label: 'Fax', type: 'text' },
  { key: 'designation', label: 'Title', type: 'text' },
  { key: 'lifecycle', label: 'Lifecycle Stage', type: 'select', options: LIFECYCLES },
  { key: 'leadSource', label: 'Lead Source', type: 'select', options: LEAD_SOURCES },
  { key: 'tag', label: 'Tag', type: 'select', options: LEAD_TAGS },
  { key: 'ownerId', label: 'Contact Owner', type: 'owner' },
  { key: 'phone', label: 'Phone', type: 'text' },
  { key: 'lastContacted', label: 'Last Contacted (on or after)', type: 'date' },
];

function FollowUpTag({ date }) {
  if (!date) return null;
  const today = todayISO();
  const label = date === today ? 'Today' : fmtDate(date).slice(3, 6) + ' ' + Number(fmtDate(date).slice(0, 2));
  const tone = date === today ? 'bg-[#FFF3D3] text-[#C98500] border-[#F7D27B]' : date < today ? 'bg-[#FFE9EA] text-[#E5293A] border-[#FBC2C7]' : 'bg-[#E3F8EE] text-[#0E9F5E] border-[#A8E5C7]';
  return (
    <span title={`Follow-up ${date < today ? 'was due' : 'due'} ${fmtDate(date)}`} className={`inline-flex items-center gap-1 h-[26px] pl-1.5 pr-3 text-[12px] font-medium border rounded-l-md ${tone}`} style={{ clipPath: 'polygon(0 0, 88% 0, 100% 50%, 88% 100%, 0 100%)' }}>
      <CalendarCheck2 size={13} />{label}
    </span>
  );
}

function splitAt(email) {
  const i = email.indexOf('@');
  return i < 0 ? [email, ''] : [email.slice(0, i + 1), email.slice(i + 1)];
}

export default function Contacts() {
  const { id: routeParamId } = useParams();
  const crm = useCRM();
  const { contacts, accounts, deals, calls, tasks = [], users, accountName, userName, createRecord, updateRecord, deleteRecords } = crm;
  const navigate = useNavigate();
  const { refreshing, refresh } = useRefresh('Contacts');

  const [savedView, setSavedView] = useState('all');
  const [layout, setLayout] = useState('list');
  const [dense, setDense] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [panelSearch, setPanelSearch] = useState('');
  const [sysFilters, setSysFilters] = useState(() => new Set());
  const [fieldOn, setFieldOn] = useState({});
  const [fieldVal, setFieldVal] = useState({});
  const [showMoreFields, setShowMoreFields] = useState(false);
  const [sysOpen, setSysOpen] = useState(true);
  const [fieldsOpen, setFieldsOpen] = useState(true);
  const [lifecycleQuick, setLifecycleQuick] = useState('');
  const [hidden, setHidden] = useState(() => new Set());
  const [form, setForm] = useState(null); // { mode, record }
  const [viewing, setViewing] = useState(routeParamId || null);
  const [detailTab, setDetailTab] = useState('Overview');
  const [noteDraft, setNoteDraft] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [bulk, setBulk] = useState(null);

  useEffect(() => {
    if (routeParamId) setViewing(routeParamId);
  }, [routeParamId]);

  const dealCount = useMemo(() => deals.reduce((m, d) => ((m[d.contactId] = (m[d.contactId] || 0) + 1), m), {}), [deals]);
  const callCount = useMemo(() => calls.reduce((m, c) => ((m[c.contactId] = (m[c.contactId] || 0) + 1), m), {}), [calls]);

  const SYSTEM_FILTERS = [
    { key: 'Activities', hint: 'Has a follow-up date', test: (c) => !!c.followUp },
    { key: 'Cadences', hint: 'Lifecycle is Contacted or Engaged', test: (c) => ['Contacted', 'Engaged'].includes(c.lifecycle) },
    { key: 'Campaigns', hint: 'Sourced from Website, Conference or Trade Show', test: (c) => ['Website', 'Conference', 'Trade Show'].includes(c.leadSource) },
    { key: 'Latest Email Status', hint: 'Last email was opened or clicked', test: (c) => ['Opened', 'Clicked'].includes(c.emailStatus) },
    { key: 'Locked', hint: 'Record is locked', test: (c) => !!c.locked },
    { key: 'Record Action', hint: 'Linked to at least one deal', test: (c) => dealCount[c.id] > 0 },
    { key: 'Related Records Action', hint: 'Has at least one logged call', test: (c) => callCount[c.id] > 0 },
    { key: 'Touched Records', hint: 'Edited in this CRM', test: (c) => !!c.touched },
    { key: 'Untouched Records', hint: 'Never edited in this CRM', test: (c) => !c.touched },
  ];

  const views = [
    { key: 'all', label: 'All Contacts', test: () => true },
    { key: 'mine', label: 'My Contacts', test: (c) => c.ownerId === 'u1' },
    { key: 'followup', label: 'Follow-ups Due', test: (c) => c.followUp && c.followUp <= todayISO() },
    { key: 'customers', label: 'Customers', test: (c) => c.lifecycle === 'Customer' },
    { key: 'optout', label: 'Email Opt Out', test: (c) => c.emailOptOut },
  ].map((v) => ({ ...v, count: contacts.filter(v.test).length }));

  const filtered = useMemo(() => {
    const q = panelSearch.trim().toLowerCase();
    const viewTest = views.find((v) => v.key === savedView)?.test || (() => true);
    const sys = SYSTEM_FILTERS.filter((f) => sysFilters.has(f.key));
    const fields = FIELD_FILTERS.filter((f) => fieldOn[f.key] && String(fieldVal[f.key] ?? '').trim() !== '');
    return contacts.filter((c) => {
      if (!viewTest(c)) return false;
      if (lifecycleQuick && c.lifecycle !== lifecycleQuick) return false;
      if (q && ![c.name, accountName(c.accountId), c.email, c.phone, c.designation].some((v) => String(v).toLowerCase().includes(q))) return false;
      if (!sys.every((f) => f.test(c))) return false;
      return fields.every((f) => {
        const want = String(fieldVal[f.key]).toLowerCase();
        const have = f.key === 'accountName' ? accountName(c.accountId) : c[f.key];
        if (f.type === 'bool') return (want === 'yes') === !!have;
        if (f.type === 'select' || f.type === 'owner') return String(have).toLowerCase() === want;
        if (f.type === 'date') return (have || '') >= fieldVal[f.key];
        return String(have || '').toLowerCase().includes(want);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contacts, panelSearch, sysFilters, fieldOn, fieldVal, lifecycleQuick, savedView, accountName, dealCount, callCount]);

  const accessors = useMemo(() => ({ account: (c) => accountName(c.accountId), owner: (c) => crm.userName(c.ownerId) }), [accountName, crm]);
  const table = useTable(filtered, { accessors, pageSize: 10 });
  const activeFilterCount = sysFilters.size + FIELD_FILTERS.filter((f) => fieldOn[f.key] && String(fieldVal[f.key] ?? '') !== '').length + (lifecycleQuick ? 1 : 0) + (panelSearch ? 1 : 0);

  const clearFilters = () => { setSysFilters(new Set()); setFieldOn({}); setFieldVal({}); setLifecycleQuick(''); setPanelSearch(''); };

  const accountOptions = useMemo(() => [...accounts].sort((a, b) => a.name.localeCompare(b.name)).map((a) => ({ value: a.id, label: a.name })), [accounts]);
  const ownerOptions = users.map((u) => ({ value: u.id, label: u.name }));
  const formFields = [
    { name: 'name', label: 'Contact Name', required: true, validate: (v) => (String(v).trim().length < 2 ? 'Enter at least 2 characters.' : '') },
    { name: 'designation', label: 'Title / Designation' },
    { name: 'accountId', label: 'Account Name', type: 'select', options: accountOptions, required: true },
    { name: 'department', label: 'Department' },
    {
      name: 'email', label: 'Email', type: 'email', required: true,
      validate: (v, vals) => (contacts.some((c) => c.email.toLowerCase() === String(v).toLowerCase() && c.id !== vals.id) ? 'Another contact already uses this email.' : ''),
    },
    { name: 'phone', label: 'Phone', type: 'tel', required: true, placeholder: '+91 98765 43210' },
    { name: 'lifecycle', label: 'Lifecycle Stage', type: 'select', options: LIFECYCLES, required: true },
    { name: 'leadSource', label: 'Lead Source', type: 'select', options: LEAD_SOURCES, required: true },
    { name: 'tag', label: 'Tag', type: 'select', options: LEAD_TAGS },
    { name: 'ownerId', label: 'Contact Owner', type: 'select', options: ownerOptions, required: true },
    { name: 'lastContacted', label: 'Last Contacted', type: 'date' },
    { name: 'followUp', label: 'Follow-up Date', type: 'date' },
    { name: 'assistant', label: 'Assistant' },
    { name: 'asstPhone', label: 'Asst Phone', type: 'tel' },
    { name: 'fax', label: 'Fax' },
    { name: 'emailOptOut', label: 'Email Opt Out', type: 'checkbox', checkLabel: 'Contact opted out of email' },
  ];
  const blank = { name: '', designation: '', accountId: '', department: '', email: '', phone: '', lifecycle: 'New', leadSource: 'Website', tag: '', ownerId: 'u1', lastContacted: todayISO(), followUp: '', assistant: '', asstPhone: '', fax: '', emailOptOut: false, emailStatus: 'Delivered', locked: false };

  useUrlActions({
    onCreate: (p) => setForm({ mode: 'create', record: { ...blank, accountId: p.account || '' } }),
    onOpen: (id) => { const c = contacts.find((x) => x.id === id); if (c) setViewing(c.id); },
    onParams: (p) => { if (p.view) setSavedView(p.view); },
  });

  const submit = (values) => {
    if (form.mode === 'create') {
      createRecord('contacts', values);
      table.setSort(null);
      table.setPage(1);
    } else {
      updateRecord('contacts', form.record.id, values);
    }
    setForm(null);
  };

  const exportRows = (rows) => exportCSV('contacts', rows, [
    { label: 'Contact Name', value: (c) => c.name }, { label: 'Title', value: (c) => c.designation },
    { label: 'Account Name', value: (c) => accountName(c.accountId) }, { label: 'Email', value: (c) => c.email },
    { label: 'Phone', value: (c) => c.phone }, { label: 'Lifecycle Stage', value: (c) => c.lifecycle },
    { label: 'Lead Source', value: (c) => c.leadSource }, { label: 'Owner', value: (c) => crm.userName(c.ownerId) },
    { label: 'Last Contacted', value: (c) => c.lastContacted }, { label: 'Follow-up', value: (c) => c.followUp },
  ]);

  const rowMenu = (c) => [
    { label: 'View details', icon: Eye, onClick: () => setViewing(c.id) },
    { label: 'Edit contact', icon: Pencil, onClick: () => setForm({ mode: 'edit', record: c }) },
    { label: 'Log a call', icon: Phone, onClick: () => navigate(`/calls?create=1&contact=${c.id}`) },
    { label: c.followUp ? 'Clear follow-up' : 'Follow up tomorrow', icon: CalendarCheck2, onClick: () => updateRecord('contacts', c.id, { followUp: c.followUp ? '' : addDays(todayISO(), 1) }) },
    { divider: true },
    { label: 'Delete contact', icon: Trash2, danger: true, onClick: () => setConfirm({ ids: [c.id], label: c.name }) },
  ];

  const COLUMNS = [
    { key: 'followUp', header: '', sortable: false, width: 84, className: '!px-1', render: (c) => <FollowUpTag date={c.followUp} /> },
    {
      key: 'name', sortable: true, width: 190,
      header: (
        <span className="inline-flex items-center gap-2">
          <button type="button" className="hover:text-primary" onClick={() => table.onSort('name')}>Contact Name</button>
          <Dropdown width={190} trigger={<button type="button" className="inline-flex items-center gap-0.5 text-[12.5px] font-semibold text-ink hover:text-primary">{lifecycleQuick || 'All'}<ChevronDown size={14} /></button>}>
            {(close) => (<><MenuLabel>Lifecycle stage</MenuLabel><MenuItem close={close} active={!lifecycleQuick} onClick={() => setLifecycleQuick('')}>All</MenuItem>{LIFECYCLES.map((l) => <MenuItem key={l} close={close} active={lifecycleQuick === l} onClick={() => setLifecycleQuick(l)}>{l}</MenuItem>)}</>)}
          </Dropdown>
        </span>
      ),
      render: (c) => (
        <button type="button" onClick={() => setViewing(c.id)} className="flex items-center gap-3 text-left">
          <PersonAvatar name={c.name} size={40} />
          <span className="min-w-0">
            <span className="block text-[14px] font-semibold text-ink hover:text-primary whitespace-nowrap">{c.name}</span>
            <span className="block text-[12.5px] text-ink-500 whitespace-nowrap">{c.designation}</span>
          </span>
        </button>
      ),
    },
    { key: 'account', header: 'Account Name', sortable: true, width: 120, render: (c) => <Link to={`/accounts?open=${c.accountId}`} className="text-ink-600 hover:text-primary leading-snug block max-w-[110px]">{accountName(c.accountId)}</Link> },
    { key: 'email', header: 'Email', sortable: true, render: (c) => { const [a, b] = splitAt(c.email); return <a href={`mailto:${c.email}`} className="leading-snug block hover:text-primary">{a}<br />{b}</a>; } },
    { key: 'phone', header: 'Phone', sortable: false, render: (c) => <a href={`tel:${c.phone.replace(/\s/g, '')}`} className="flex items-center gap-3 hover:text-primary"><Phone size={18} className="text-ink-500 shrink-0" /><span className="leading-snug whitespace-nowrap">{c.phone.replace(/\s(\S+)$/, '')}<br />{c.phone.match(/(\S+)$/)?.[1]}</span></a> },
    { key: 'lifecycle', header: 'Lifecycle Stage', sortable: true, align: 'center', render: (c) => <StatusBadge kind="lifecycle" value={c.lifecycle} className="min-w-[82px]" /> },
    { key: 'leadSource', header: 'Lead Source', sortable: true, align: 'center', render: (c) => <StatusBadge kind="leadSource" value={c.leadSource} className="min-w-[78px]" /> },
    { key: 'owner', header: 'Owner', sortable: true, align: 'center', render: (c) => <UserAvatar userId={c.ownerId} size={38} /> },
    { key: 'lastContacted', header: 'Last Contacted', sortable: true, align: 'center', render: (c) => fmtDate(c.lastContacted) },
  ].filter((c) => !hidden.has(c.key));

  const columnChooser = (
    <Dropdown width={220} align="right" trigger={<button type="button" aria-label="Choose columns" className="p-1.5 rounded-md text-ink-600 hover:bg-white hover:text-primary"><SlidersHorizontal size={18} /></button>}>
      <MenuLabel>Show columns</MenuLabel>
      {[['account', 'Account Name'], ['email', 'Email'], ['phone', 'Phone'], ['lifecycle', 'Lifecycle Stage'], ['leadSource', 'Lead Source'], ['owner', 'Owner'], ['lastContacted', 'Last Contacted'], ['followUp', 'Follow-up']].map(([k, l]) => (
        <label key={k} className="flex items-center gap-2.5 px-3 py-1.5 text-[13px] text-ink hover:bg-page cursor-pointer">
          <input type="checkbox" className="cb" checked={!hidden.has(k)} onChange={() => setHidden((h) => { const n = new Set(h); n.has(k) ? n.delete(k) : n.add(k); return n; })} />{l}
        </label>
      ))}
    </Dropdown>
  );
  const columns = [...COLUMNS, { key: 'actions', header: columnChooser, align: 'center', width: 52, render: (c) => <ActionMenu vertical boxed={false} items={rowMenu(c)} /> }];

  const viewingIdx = contacts.findIndex((c) => c.id === viewing);
  const viewingRec = contacts[viewingIdx];
  const prevContact = viewingIdx > 0 ? contacts[viewingIdx - 1] : null;
  const nextContact = viewingIdx >= 0 && viewingIdx < contacts.length - 1 ? contacts[viewingIdx + 1] : null;
  const contactDeals = viewingRec ? deals.filter((d) => d.contactId === viewingRec.id || d.accountId === viewingRec.accountId) : [];
  const contactCalls = viewingRec ? calls.filter((c) => c.contactId === viewingRec.id).sort((a, b) => b.dateTime.localeCompare(a.dateTime)) : [];
  const contactTasks = viewingRec ? tasks.filter((t) => t.contactId === viewingRec.id || String(t.contactName || '').toLowerCase() === viewingRec.name.toLowerCase()) : [];
  const selectedIds = [...table.selected];

  const location = useLocation();
  const fieldsShown = showMoreFields ? FIELD_FILTERS : FIELD_FILTERS.slice(0, 8);

  const handleCloseDetail = () => {
    if (location.state?.from) {
      navigate(location.state.from);
      return;
    }
    setViewing(null);
    if (routeParamId) navigate('/contacts');
  };

  const scrollToContactSec = (secId) => {
    setDetailTab('Overview');
    setTimeout(() => {
      document.getElementById(secId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 30);
  };

  return (
    <div>
      {viewingRec ? (
        <div className="-mx-3 sm:-mx-[18px] -mt-2.5 bg-[#F5F7FA] min-h-[calc(100vh-56px)] flex flex-col">
          {/* Zoho Contact Details Top Header */}
          <div className="bg-white px-4 py-3 border-b border-line flex items-center justify-between flex-wrap gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCloseDetail}
                className="p-1.5 hover:bg-page rounded-full text-ink-600 transition-colors"
                title={location.state?.from === '/workqueue' ? 'Back to Workqueue' : 'Back to Contacts'}
              >
                <ArrowLeft size={18} />
              </button>
              <PersonAvatar name={viewingRec.name} size={42} />
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-[17px] font-semibold text-ink leading-tight">{viewingRec.name}</h1>
                  <StatusBadge kind="lifecycle" value={viewingRec.lifecycle} size="sm" />
                  <StatusBadge kind="leadSource" value={viewingRec.leadSource} size="sm" />
                  {viewingRec.followUp && <FollowUpTag date={viewingRec.followUp} />}
                </div>
                <div className="text-[12px] text-ink-500 mt-0.5 flex items-center gap-2">
                  <span>{viewingRec.designation || 'Executive'}</span>
                  <span>•</span>
                  <Link to={`/accounts?open=${viewingRec.accountId}`} className="text-primary hover:underline">
                    {accountName(viewingRec.accountId)}
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <a
                href={`mailto:${viewingRec.email}`}
                className="btn-primary h-8 px-3.5 text-[12.5px] inline-flex items-center gap-1.5"
              >
                <Mail size={14} /> Send Email
              </a>
              <button
                type="button"
                onClick={() => navigate(`/calls?create=1&contact=${viewingRec.id}`)}
                className="btn-secondary h-8 px-3 text-[12.5px]"
              >
                <Phone size={14} /> Log a Call
              </button>
              <button
                type="button"
                onClick={() => setForm({ mode: 'edit', record: viewingRec })}
                className="btn-secondary h-8 px-3 text-[12.5px]"
              >
                <Pencil size={14} /> Edit
              </button>
              <button
                type="button"
                onClick={() => setConfirm({ ids: [viewingRec.id], label: viewingRec.name })}
                className="btn-secondary h-8 px-3 text-[12.5px] text-danger-700"
              >
                <Trash2 size={14} /> Delete
              </button>
              <div className="flex items-center gap-1 ml-1">
                <button
                  type="button"
                  disabled={!prevContact}
                  onClick={() => prevContact && setViewing(prevContact.id)}
                  className="btn-secondary h-8 px-2 disabled:opacity-40"
                  title="Previous Contact"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  disabled={!nextContact}
                  onClick={() => nextContact && setViewing(nextContact.id)}
                  className="btn-secondary h-8 px-2 disabled:opacity-40"
                  title="Next Contact"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Sub Header: Overview / Timeline */}
          <div className="bg-[#F5F7FA] px-4 py-2 flex items-center justify-between border-b border-line">
            <div className="inline-flex rounded-full border border-[#D5DBE8] bg-white p-0.5 text-[12.5px]">
              {['Overview', 'Timeline'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setDetailTab(t)}
                  className={`px-4 h-7 rounded-full transition ${
                    detailTab === t ? 'bg-[#EEF1F8] font-semibold text-ink shadow-xs' : 'text-ink-500 hover:text-ink'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="text-[11.5px] text-ink-500 flex items-center gap-1.5">
              <Clock3 size={12} /> Last Contacted : {fmtDate(viewingRec.lastContacted)}
            </div>
          </div>

          {/* Body: Left Related List + Right Main Content */}
          <div className="flex flex-1 min-h-0">
            <aside className="w-[210px] bg-white border-r border-line shrink-0 p-4 hidden md:block">
              <div className="text-[13.5px] font-bold text-ink mb-2.5">Related List</div>
              <ul className="space-y-1 text-[13px] text-ink-700">
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToContactSec('con-sec-info')}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#F3F4F6] hover:text-primary"
                  >
                    Contact Information
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToContactSec('con-sec-notes')}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#F3F4F6] hover:text-primary"
                  >
                    Notes
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToContactSec('con-sec-deals')}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#F3F4F6] hover:text-primary flex items-center justify-between"
                  >
                    <span>Deals</span>
                    <span className="bg-[#EEF2F8] text-[#374151] rounded-full px-1.5 py-0.5 text-[11px] font-semibold">
                      {contactDeals.length}
                    </span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToContactSec('con-sec-activities')}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#F3F4F6] hover:text-primary flex items-center justify-between"
                  >
                    <span>Activities</span>
                    <span className="bg-[#EEF2F8] text-[#374151] rounded-full px-1.5 py-0.5 text-[11px] font-semibold">
                      {contactCalls.length + contactTasks.length}
                    </span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToContactSec('con-sec-attachments')}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#F3F4F6] hover:text-primary"
                  >
                    Attachments
                  </button>
                </li>
              </ul>
            </aside>

            <div className="flex-1 min-w-0 p-4 space-y-4 overflow-y-auto">
              {detailTab === 'Overview' ? (
                <>
                  {/* Business Card Summary */}
                  <div className="bg-white border border-line rounded-lg p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-10 text-[13px]">
                      <div className="grid grid-cols-[150px_1fr] gap-3">
                        <span className="text-ink-500 text-right">Contact Owner</span>
                        <span className="text-ink font-semibold">
                          <UserAvatar userId={viewingRec.ownerId} size={22} withName />
                        </span>
                      </div>
                      <div className="grid grid-cols-[150px_1fr] gap-3">
                        <span className="text-ink-500 text-right">Email</span>
                        <a href={`mailto:${viewingRec.email}`} className="text-primary hover:underline font-medium">
                          {viewingRec.email}
                        </a>
                      </div>
                      <div className="grid grid-cols-[150px_1fr] gap-3">
                        <span className="text-ink-500 text-right">Phone</span>
                        <span className="text-ink font-semibold">{viewingRec.phone}</span>
                      </div>
                      <div className="grid grid-cols-[150px_1fr] gap-3">
                        <span className="text-ink-500 text-right">Account Name</span>
                        <Link to={`/accounts?open=${viewingRec.accountId}`} className="text-primary hover:underline font-semibold">
                          {accountName(viewingRec.accountId)}
                        </Link>
                      </div>
                      <div className="grid grid-cols-[150px_1fr] gap-3">
                        <span className="text-ink-500 text-right">Department</span>
                        <span className="text-ink font-medium">{viewingRec.department || 'Operations'}</span>
                      </div>
                      <div className="grid grid-cols-[150px_1fr] gap-3">
                        <span className="text-ink-500 text-right">Lifecycle Stage</span>
                        <div>
                          <StatusBadge kind="lifecycle" value={viewingRec.lifecycle} size="sm" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information Section */}
                  <section id="con-sec-info" className="bg-white border border-line rounded-lg p-5">
                    <h3 className="text-[14px] font-bold text-ink mb-4 pb-2 border-b border-line-soft">
                      Contact Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3.5 gap-x-10 text-[13px]">
                      <div className="grid grid-cols-[160px_1fr] gap-3">
                        <span className="text-ink-500 text-right">Contact Name</span>
                        <span className="text-ink font-semibold">{viewingRec.name}</span>
                      </div>
                      <div className="grid grid-cols-[160px_1fr] gap-3">
                        <span className="text-ink-500 text-right">Account Name</span>
                        <Link to={`/accounts?open=${viewingRec.accountId}`} className="text-primary hover:underline font-medium">
                          {accountName(viewingRec.accountId)}
                        </Link>
                      </div>
                      <div className="grid grid-cols-[160px_1fr] gap-3">
                        <span className="text-ink-500 text-right">Title / Designation</span>
                        <span className="text-ink font-medium">{viewingRec.designation || '—'}</span>
                      </div>
                      <div className="grid grid-cols-[160px_1fr] gap-3">
                        <span className="text-ink-500 text-right">Department</span>
                        <span className="text-ink font-medium">{viewingRec.department || '—'}</span>
                      </div>
                      <div className="grid grid-cols-[160px_1fr] gap-3">
                        <span className="text-ink-500 text-right">Email</span>
                        <a href={`mailto:${viewingRec.email}`} className="text-primary hover:underline">
                          {viewingRec.email}
                        </a>
                      </div>
                      <div className="grid grid-cols-[160px_1fr] gap-3">
                        <span className="text-ink-500 text-right">Phone</span>
                        <span className="text-ink font-medium">{viewingRec.phone}</span>
                      </div>
                      <div className="grid grid-cols-[160px_1fr] gap-3">
                        <span className="text-ink-500 text-right">Lead Source</span>
                        <span className="text-ink font-medium">{viewingRec.leadSource}</span>
                      </div>
                      <div className="grid grid-cols-[160px_1fr] gap-3">
                        <span className="text-ink-500 text-right">Contact Owner</span>
                        <span className="text-ink font-medium">{userName(viewingRec.ownerId)}</span>
                      </div>
                      <div className="grid grid-cols-[160px_1fr] gap-3">
                        <span className="text-ink-500 text-right">Last Contacted</span>
                        <span className="text-ink font-medium">{fmtDate(viewingRec.lastContacted)}</span>
                      </div>
                      <div className="grid grid-cols-[160px_1fr] gap-3">
                        <span className="text-ink-500 text-right">Follow-up Date</span>
                        <span className="text-ink font-medium">{viewingRec.followUp ? fmtDate(viewingRec.followUp) : 'None'}</span>
                      </div>
                      <div className="grid grid-cols-[160px_1fr] gap-3">
                        <span className="text-ink-500 text-right">Assistant</span>
                        <span className="text-ink font-medium">{viewingRec.assistant || '—'}</span>
                      </div>
                      <div className="grid grid-cols-[160px_1fr] gap-3">
                        <span className="text-ink-500 text-right">Asst Phone</span>
                        <span className="text-ink font-medium">{viewingRec.asstPhone || '—'}</span>
                      </div>
                      <div className="grid grid-cols-[160px_1fr] gap-3">
                        <span className="text-ink-500 text-right">Email Status</span>
                        <span className="text-ink font-medium">{viewingRec.emailStatus || 'Delivered'}</span>
                      </div>
                      <div className="grid grid-cols-[160px_1fr] gap-3">
                        <span className="text-ink-500 text-right">Email Opt Out</span>
                        <span className="text-ink font-medium">{viewingRec.emailOptOut ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </section>

                  {/* Notes Section */}
                  <section id="con-sec-notes" className="bg-white border border-line rounded-lg p-5">
                    <h3 className="text-[14px] font-bold text-ink mb-3 pb-2 border-b border-line-soft">Notes</h3>
                    {viewingRec.notes && (
                      <div className="p-3 rounded-lg bg-[#F8FAFC] border border-line text-[13px] text-ink mb-3">
                        {viewingRec.notes}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        placeholder="Add a note for this contact..."
                        className="flex-1 h-9 px-3 text-[13px] border border-line rounded-md focus:border-primary outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!noteDraft.trim()) return;
                          const nextNotes = viewingRec.notes ? `${viewingRec.notes} | ${noteDraft.trim()}` : noteDraft.trim();
                          updateRecord('contacts', viewingRec.id, { notes: nextNotes });
                          setNoteDraft('');
                        }}
                        className="btn-primary h-9 px-4 text-[12.5px]"
                      >
                        Save Note
                      </button>
                    </div>
                  </section>

                  {/* Deals Section */}
                  <section id="con-sec-deals" className="bg-white border border-line rounded-lg p-5">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-line-soft">
                      <h3 className="text-[14px] font-bold text-ink">Deals ({contactDeals.length})</h3>
                      <button
                        type="button"
                        onClick={() => navigate(`/deals?create=1&account=${viewingRec.accountId}`)}
                        className="h-7 px-3 rounded border border-primary text-primary text-[12px] font-semibold hover:bg-blue-50"
                      >
                        + New Deal
                      </button>
                    </div>
                    {contactDeals.length === 0 ? (
                      <p className="text-[13px] text-ink-500">No deals linked to this contact.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-[12.5px]">
                          <thead>
                            <tr className="border-b border-line text-ink-500">
                              <th className="py-2 px-3">Deal Name</th>
                              <th className="py-2 px-3">Stage</th>
                              <th className="py-2 px-3">Amount</th>
                              <th className="py-2 px-3">Closing Date</th>
                              <th className="py-2 px-3">Deal Owner</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-line-soft">
                            {contactDeals.map((d) => (
                              <tr key={d.id} className="hover:bg-page">
                                <td className="py-2.5 px-3">
                                  <button
                                    type="button"
                                    onClick={() => navigate(`/deals/${d.id}`, { state: { from: `/contacts/${viewingRec.id}` } })}
                                    className="text-primary hover:underline font-semibold text-left"
                                  >
                                    {d.name}
                                  </button>
                                </td>
                                <td className="py-2.5 px-3">
                                  <StatusBadge kind="stage" value={d.stage} size="sm" />
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-ink">{fmtINR(d.amount)}</td>
                                <td className="py-2.5 px-3 text-ink-600">{fmtDate(d.closingDate)}</td>
                                <td className="py-2.5 px-3 text-ink-600">{userName(d.ownerId)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  {/* Activities Section */}
                  <section id="con-sec-activities" className="bg-white border border-line rounded-lg p-5">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-line-soft">
                      <h3 className="text-[14px] font-bold text-ink">
                        Activities ({contactCalls.length + contactTasks.length})
                      </h3>
                      <button
                        type="button"
                        onClick={() => navigate(`/calls?create=1&contact=${viewingRec.id}`)}
                        className="h-7 px-3 rounded border border-primary text-primary text-[12px] font-semibold hover:bg-blue-50"
                      >
                        + Log a Call
                      </button>
                    </div>
                    {contactCalls.length === 0 && contactTasks.length === 0 ? (
                      <p className="text-[13px] text-ink-500">No activities logged yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-[12.5px]">
                          <thead>
                            <tr className="border-b border-line text-ink-500">
                              <th className="py-2 px-3">Subject</th>
                              <th className="py-2 px-3">Type</th>
                              <th className="py-2 px-3">Date & Time</th>
                              <th className="py-2 px-3">Duration</th>
                              <th className="py-2 px-3">Status</th>
                              <th className="py-2 px-3">Owner</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-line-soft">
                            {contactCalls.map((c) => (
                              <tr key={c.id} className="hover:bg-page">
                                <td className="py-2.5 px-3">
                                  <button
                                    type="button"
                                    onClick={() => navigate(`/calls/${c.id}`, { state: { from: `/contacts/${viewingRec.id}` } })}
                                    className="text-primary hover:underline font-semibold text-left"
                                  >
                                    {c.subject}
                                  </button>
                                </td>
                                <td className="py-2.5 px-3 text-ink-600">{c.type} Call</td>
                                <td className="py-2.5 px-3 text-ink-600">
                                  {fmtDate(c.dateTime)} {fmtTime(c.dateTime)}
                                </td>
                                <td className="py-2.5 px-3 text-ink-600">{fmtDuration(c.duration)}</td>
                                <td className="py-2.5 px-3">
                                  <StatusBadge kind="callStatus" value={c.status} size="sm" />
                                </td>
                                <td className="py-2.5 px-3 text-ink-600">{userName(c.ownerId)}</td>
                              </tr>
                            ))}
                            {contactTasks.map((t) => (
                              <tr key={t.id} className="hover:bg-page">
                                <td className="py-2.5 px-3 font-semibold text-ink">{t.subject}</td>
                                <td className="py-2.5 px-3 text-ink-600">Task ({t.priority})</td>
                                <td className="py-2.5 px-3 text-ink-600">{fmtDate(t.dueDate)}</td>
                                <td className="py-2.5 px-3 text-ink-400">—</td>
                                <td className="py-2.5 px-3">
                                  <span className="px-2 py-0.5 rounded bg-blue-50 text-primary text-[11px] font-semibold">
                                    {t.status}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-ink-600">{userName(t.ownerId || viewingRec.ownerId)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  {/* Attachments Section */}
                  <section id="con-sec-attachments" className="bg-white border border-line rounded-lg p-5">
                    <h3 className="text-[14px] font-bold text-ink mb-2 pb-2 border-b border-line-soft">Attachments</h3>
                    <p className="text-[13px] text-ink-500">No attachments uploaded for this contact.</p>
                  </section>
                </>
              ) : (
                /* Timeline Tab */
                <div className="bg-white border border-line rounded-lg p-5">
                  <h3 className="text-[14px] font-bold text-ink mb-4">Contact History Timeline</h3>
                  <ol className="relative border-l-2 border-line ml-3 space-y-4">
                    {contactCalls.map((c) => (
                      <li key={c.id} className="pl-5 relative">
                        <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-primary ring-2 ring-white" />
                        <div className="text-[13px] font-semibold text-ink">
                          {c.type} Call: "{c.subject}" ({c.status})
                        </div>
                        <div className="text-[12px] text-ink-500 mt-0.5">
                          By {userName(c.ownerId)} • {fmtDate(c.dateTime)} {fmtTime(c.dateTime)}
                        </div>
                      </li>
                    ))}
                    {contactDeals.map((d) => (
                      <li key={d.id} className="pl-5 relative">
                        <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                        <div className="text-[13px] font-semibold text-ink">
                          Deal linked: "{d.name}" ({d.stage} — {fmtINR(d.amount)})
                        </div>
                        <div className="text-[12px] text-ink-500 mt-0.5">
                          Closing Date: {fmtDate(d.closingDate)} • Owner: {userName(d.ownerId)}
                        </div>
                      </li>
                    ))}
                    <li className="pl-5 relative">
                      <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-slate-400 ring-2 ring-white" />
                      <div className="text-[13px] font-semibold text-ink">
                        Contact "{viewingRec.name}" created from {viewingRec.leadSource}
                      </div>
                      <div className="text-[12px] text-ink-500 mt-0.5">
                        Assigned to {userName(viewingRec.ownerId)} • Last contacted {fmtDate(viewingRec.lastContacted)}
                      </div>
                    </li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {location.state?.from && (
            <div className="mb-2">
              <button
                type="button"
                onClick={() => navigate(location.state.from)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 text-[#2F7BF5] font-semibold text-xs hover:bg-blue-100 transition"
              >
                <ArrowLeft size={14} /> Back
              </button>
            </div>
          )}
          <PageHeader
            views={views} view={savedView} onViewChange={(v) => { setSavedView(v); table.setPage(1); }}
            tabMenu={[
              { label: 'Export filtered contacts (CSV)', icon: Download, onClick: () => exportRows(table.sorted) },
              { label: `Select all ${filtered.length} filtered`, onClick: table.selectAllFiltered },
              { label: 'Clear all filters', onClick: clearFilters },
            ]}
            toolbar={{
              labeled: true, filterActive: panelOpen, onFilter: () => setPanelOpen((o) => !o),
              sortOptions: [{ key: 'name', label: 'Contact Name' }, { key: 'account', label: 'Account Name' }, { key: 'lifecycle', label: 'Lifecycle Stage' }, { key: 'lastContacted', label: 'Last Contacted' }, { key: 'createdOn', label: 'Created On' }],
              sort: table.sort, onSort: table.setSort, layouts: ['list', 'kanban', 'grid', 'chart'], layout, onLayout: setLayout,
              onRefresh: refresh, refreshing, dense, onDense: () => setDense((d) => !d), module: 'Contacts',
              primary: { label: 'Create Contact', onClick: () => setForm({ mode: 'create', record: blank }), menu: [
                { label: 'Create Contact', icon: Plus, onClick: () => setForm({ mode: 'create', record: blank }) },
                { label: 'Export contacts (CSV)', icon: Download, onClick: () => exportRows(table.sorted) },
              ] },
              moreItems: [
                { label: 'Export selected (CSV)', icon: Download, disabled: !selectedIds.length, onClick: () => exportRows(contacts.filter((c) => table.selected.has(c.id))) },
                { label: 'Change owner of selected', icon: UserCog, disabled: !selectedIds.length, onClick: () => setBulk('owner') },
                { label: 'Delete selected', icon: Trash2, danger: true, disabled: !selectedIds.length, onClick: () => setConfirm({ ids: selectedIds, label: `${selectedIds.length} contacts` }) },
              ],
            }}
          />

          <div className="flex gap-3 items-start">
            {panelOpen && (
              <aside className="card hidden md:block w-[204px] shrink-0 px-3.5 py-4 sticky top-[72px] max-h-[calc(100vh-86px)] overflow-y-auto thin-scroll">
                <div className="flex items-center justify-between">
                  <h2 className="text-[15px] font-semibold text-ink whitespace-nowrap">Filter Contacts by</h2>
                </div>
                <SearchInput value={panelSearch} onChange={setPanelSearch} placeholder="Search" className="mt-3" />
                {activeFilterCount > 0 && <button onClick={clearFilters} className="text-[12.5px] text-primary mt-2 hover:underline">Clear {activeFilterCount} active filter{activeFilterCount > 1 ? 's' : ''}</button>}

                <button type="button" onClick={() => setSysOpen((o) => !o)} className="flex items-center gap-1 mt-4 text-[14px] font-semibold text-ink whitespace-nowrap -ml-1">
                  <ChevronDown size={16} className={sysOpen ? '' : '-rotate-90'} />System Defined Filters
                </button>
                {sysOpen && (
                  <div className="mt-2 space-y-2.5 pl-0.5">
                    {SYSTEM_FILTERS.map((f) => (
                      <label key={f.key} title={f.hint} className="flex items-start gap-2.5 text-[13.5px] text-ink-600 cursor-pointer leading-snug">
                        <input type="checkbox" className="cb mt-0.5" checked={sysFilters.has(f.key)} onChange={() => setSysFilters((s) => { const n = new Set(s); n.has(f.key) ? n.delete(f.key) : n.add(f.key); return n; })} />
                        {f.key}
                      </label>
                    ))}
                  </div>
                )}

                <button type="button" onClick={() => setFieldsOpen((o) => !o)} className="flex items-center gap-1 mt-5 text-[14px] font-semibold text-ink whitespace-nowrap -ml-1">
                  <ChevronDown size={16} className={fieldsOpen ? '' : '-rotate-90'} />Filter By Fields
                </button>
                {fieldsOpen && (
                  <div className="mt-2 space-y-2.5 pl-0.5">
                    {fieldsShown.map((f) => (
                      <div key={f.key}>
                        <label className="flex items-center gap-2.5 text-[13.5px] text-ink-600 cursor-pointer">
                          <input type="checkbox" className="cb" checked={!!fieldOn[f.key]} onChange={(e) => setFieldOn((s) => ({ ...s, [f.key]: e.target.checked }))} />{f.label}
                        </label>
                        {fieldOn[f.key] && (
                          <div className="mt-1.5 pl-6">
                            {f.type === 'text' && <input className="input h-8 text-[12.5px]" placeholder="contains…" value={fieldVal[f.key] || ''} onChange={(e) => setFieldVal((s) => ({ ...s, [f.key]: e.target.value }))} autoFocus />}
                            {f.type === 'date' && <input type="date" className="input h-8 text-[12.5px]" value={fieldVal[f.key] || ''} onChange={(e) => setFieldVal((s) => ({ ...s, [f.key]: e.target.value }))} />}
                            {(f.type === 'select' || f.type === 'owner' || f.type === 'bool') && (
                              <select className="input h-8 text-[12.5px]" value={fieldVal[f.key] || ''} onChange={(e) => setFieldVal((s) => ({ ...s, [f.key]: e.target.value }))}>
                                <option value="">Any</option>
                                {f.type === 'bool' && <><option value="yes">Yes</option><option value="no">No</option></>}
                                {f.type === 'select' && f.options.map((o) => <option key={o} value={o.toLowerCase()}>{o}</option>)}
                                {f.type === 'owner' && users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                              </select>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => setShowMoreFields((s) => !s)} className="flex items-center gap-1 text-[14px] text-primary pt-1">
                      {showMoreFields ? 'Show Less' : 'Show More'}<ChevronDown size={15} className={showMoreFields ? 'rotate-180' : ''} />
                    </button>
                  </div>
                )}
              </aside>
            )}

            <section className="card flex-1 min-w-0 overflow-hidden">
              <BulkBar count={selectedIds.length} onClear={table.clearSelection}>
                <BulkButton icon={UserCog} onClick={() => setBulk('owner')}>Change owner</BulkButton>
                <BulkButton onClick={() => setBulk('lifecycle')}>Update lifecycle</BulkButton>
                <BulkButton icon={Download} onClick={() => exportRows(contacts.filter((c) => table.selected.has(c.id)))}>Export</BulkButton>
                <BulkButton icon={Trash2} danger onClick={() => setConfirm({ ids: selectedIds, label: `${selectedIds.length} contacts` })}>Delete</BulkButton>
              </BulkBar>
              {panelOpen && (
                <div className="md:hidden p-3 border-b border-line-soft"><SearchInput value={panelSearch} onChange={setPanelSearch} placeholder="Search contacts" /></div>
              )}
              {layout === 'list' && (
                <>
                  <DataTable columns={columns} rows={table.pageRows} table={table} showIndex={false} loading={refreshing} dense={dense} minWidth={1060}
                    emptyAction={<button className="btn-primary mt-2 h-9" onClick={() => setForm({ mode: 'create', record: blank })}><Plus size={16} />Create Contact</button>} />
                  <div className="px-4"><Pagination table={table} variant="records" options={[10, 25, 50, 100]} /></div>
                </>
              )}
              {layout === 'kanban' && (
                <div className="p-3">
                  <KanbanView groups={LIFECYCLES.map((l) => ({ key: l, label: l, color: LIFECYCLE_COLORS[l] }))} rows={table.sorted} groupOf={(c) => c.lifecycle}
                    onMove={(c, to) => updateRecord('contacts', c.id, { lifecycle: to })} onCardClick={(c) => setViewing(c.id)}
                    renderCard={(c) => (
                      <div className="flex items-start gap-2.5">
                        <PersonAvatar name={c.name} size={32} />
                        <div className="min-w-0 flex-1">
                          <div className="text-[13.5px] font-semibold text-ink truncate">{c.name}</div>
                          <div className="text-[12px] text-ink-500 truncate">{c.designation} · {accountName(c.accountId)}</div>
                          <div className="flex items-center justify-between mt-2"><StatusBadge kind="leadSource" value={c.leadSource} size="sm" /><UserAvatar userId={c.ownerId} size={22} /></div>
                        </div>
                      </div>
                    )} />
                </div>
              )}
              {layout === 'grid' && (
                <div className="p-3">
                  <GridView rows={table.pageRows} onCardClick={(c) => setViewing(c.id)} renderCard={(c) => (
                    <>
                      <div className="flex items-center gap-3"><PersonAvatar name={c.name} size={44} /><div className="min-w-0"><div className="font-semibold text-ink truncate">{c.name}</div><div className="text-[12.5px] text-ink-500 truncate">{c.designation}</div></div></div>
                      <div className="mt-3 space-y-1 text-[12.5px] text-ink-600"><div className="truncate">{accountName(c.accountId)}</div><div className="truncate flex items-center gap-1.5"><Mail size={13} />{c.email}</div><div className="flex items-center gap-1.5"><Phone size={13} />{c.phone}</div></div>
                      <div className="mt-3 flex items-center gap-2"><StatusBadge kind="lifecycle" value={c.lifecycle} size="sm" /><StatusBadge kind="leadSource" value={c.leadSource} size="sm" /><span className="ml-auto"><UserAvatar userId={c.ownerId} size={24} /></span></div>
                    </>
                  )} />
                  <Pagination table={table} variant="records" />
                </div>
              )}
              {layout === 'chart' && <ChartView title="Contacts by lifecycle stage" data={LIFECYCLES.map((l) => ({ name: l, value: filtered.filter((c) => c.lifecycle === l).length, color: LIFECYCLE_COLORS[l] }))} valueLabel="Contacts" />}
            </section>
          </div>
        </>
      )}

      <FormModal open={!!form} onClose={() => setForm(null)} title={form?.mode === 'edit' ? 'Edit contact' : 'Create contact'} subtitle={form?.mode === 'edit' ? form.record.name : 'Add a person and link them to an account.'}
        fields={formFields} initial={form?.record} onSubmit={submit} submitLabel={form?.mode === 'edit' ? 'Save changes' : 'Create contact'} />

      <FormModal open={!!bulk} onClose={() => setBulk(null)} size="sm" title={bulk === 'owner' ? 'Change owner' : 'Update lifecycle stage'} subtitle={`Applies to ${selectedIds.length} selected contacts.`}
        fields={[bulk === 'owner' ? { name: 'value', label: 'New owner', type: 'select', options: ownerOptions, required: true, span: 2 } : { name: 'value', label: 'Lifecycle stage', type: 'select', options: LIFECYCLES, required: true, span: 2 }]}
        initial={bulk ? { value: '' } : null} submitLabel="Apply"
        onSubmit={({ value }) => { selectedIds.forEach((id) => updateRecord('contacts', id, bulk === 'owner' ? { ownerId: value } : { lifecycle: value })); setBulk(null); table.clearSelection(); }} />

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} title="Delete contacts?"
        message={confirm ? `Delete ${confirm.label}? Linked deals and calls stay, but they will no longer reference ${confirm.ids.length > 1 ? 'these contacts' : 'this contact'}.` : ''}
        onConfirm={() => { deleteRecords('contacts', confirm.ids); table.clearSelection(); handleCloseDetail(); }} />
    </div>
  );
}
