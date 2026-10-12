import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarClock, CalendarPlus, ChevronDown, ChevronLeft, ChevronRight, Clock3, Download, ExternalLink, Eye, Pencil, Phone, PhoneCall, PhoneIncoming, PhoneMissed, PhoneOutgoing, Plus, Search, Trash2, UserCog } from 'lucide-react';
import { useCRM } from '../../context/crmContextInstance';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import useTable from '../../components/common/useTable';
import StatusBadge from '../../components/common/StatusBadge';
import { badgeTone } from '../../components/common/statusTone';
import { PersonAvatar, UserAvatar } from '../../components/common/Avatar';
import ActionMenu from '../../components/common/ActionMenu';
import FormModal from '../../components/common/RecordForm';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Drawer, DetailGrid, SectionTitle } from '../../components/common/Modal';
import Dropdown, { MenuItem, MenuLabel } from '../../components/common/Dropdown';
import BulkBar, { BulkButton } from '../../components/common/BulkBar';
import { ChartView, GridView, KanbanView } from '../../components/common/Views';
import { useRefresh, useUrlActions } from '../../components/common/hooks';
import { CALL_STATUSES, CALL_TYPES } from '../../data/seedData';
import { fmtDate, fmtDuration, fmtINR, fmtTime, inRange, sumBy, trend } from '../../utils/calculations';
import { exportCSV } from '../../utils/exportCSV';

const DEFAULT_RANGE = { from: '2026-10-01', to: '2026-10-31' };
const STATUS_COLORS = { Completed: '#12C26B', Missed: '#FF3344', Busy: '#FFBB28', Scheduled: '#2F7BF5' };
const EMPTY = { type: '', status: '', owner: '', account: '', minDur: '' };
const nowLocal = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };

function CallType({ type }) {
  const Icon = type === 'Outbound' ? PhoneOutgoing : PhoneIncoming;
  return <span className="inline-flex items-center gap-2 whitespace-nowrap"><Icon size={16} className={type === 'Outbound' ? 'text-primary' : 'text-success'} />{type}</span>;
}

export default function Calls() {
  const { id: routeParamId } = useParams();
  const { calls, contacts, deals = [], users, baselines, accountName, contactName, userName, contactsById, createRecord, updateRecord, deleteRecords } = useCRM();
  const { refreshing, refresh } = useRefresh('Calls');
  const [savedView, setSavedView] = useState('all');
  const [layout, setLayout] = useState('list');
  const [dense, setDense] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [search, setSearch] = useState('');
  const [range, setRange] = useState(DEFAULT_RANGE);
  const [f, setF] = useState(EMPTY);
  const [form, setForm] = useState(null);
  const [viewing, setViewing] = useState(routeParamId || null);
  const [detailTab, setDetailTab] = useState('Overview');
  const [noteDraft, setNoteDraft] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [bulk, setBulk] = useState(null);

  useEffect(() => {
    if (routeParamId) setViewing(routeParamId);
  }, [routeParamId]);

  const views = [
    { key: 'all', label: 'All Calls', test: () => true },
    { key: 'mine', label: 'My Calls', test: (c) => c.ownerId === 'u1' },
    { key: 'scheduled', label: 'Scheduled Calls', test: (c) => c.status === 'Scheduled' },
    { key: 'missed', label: 'Missed Calls', test: (c) => c.status === 'Missed' },
  ].map((v) => ({ ...v, count: calls.filter(v.test).length }));
  const viewTest = views.find((v) => v.key === savedView)?.test;

  const callAccounts = useMemo(() => {
    const ids = [...new Set(calls.map((c) => c.accountId))];
    return ids.map((id) => ({ value: id, label: accountName(id) })).sort((a, b) => a.label.localeCompare(b.label));
  }, [calls, accountName]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return calls.filter((c) => {
      if (viewTest && !viewTest(c)) return false;
      if (!inRange(c.dateTime, range)) return false;
      if (q && ![c.subject, contactName(c.contactId), accountName(c.accountId), c.notes, userName(c.ownerId)].some((v) => String(v).toLowerCase().includes(q))) return false;
      if (f.type && c.type !== f.type) return false;
      if (f.status && c.status !== f.status) return false;
      if (f.owner && c.ownerId !== f.owner) return false;
      if (f.account && c.accountId !== f.account) return false;
      if (f.minDur && c.duration < Number(f.minDur) * 60) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calls, search, range, f, savedView, accountName, contactName, userName]);

  const accessors = useMemo(() => ({ contact: (c) => contactName(c.contactId), account: (c) => accountName(c.accountId), owner: (c) => userName(c.ownerId) }), [accountName, contactName, userName]);
  const table = useTable(filtered, { accessors, pageSize: 10 });
  const set = (k) => (v) => { setF((s) => ({ ...s, [k]: v })); table.setPage(1); };
  const reset = () => { setF(EMPTY); setSearch(''); setRange(DEFAULT_RANGE); setSavedView('all'); };

  const answered = filtered.filter((c) => c.status === 'Completed');
  const k = {
    total: filtered.length, answered: answered.length, missed: filtered.filter((c) => c.status === 'Missed').length,
    avg: answered.length ? sumBy(answered, (c) => c.duration) / answered.length : 0, scheduled: filtered.filter((c) => c.status === 'Scheduled').length,
  };
  const byDay = (rows) => [7, 14, 21, 28, 31].map((d) => rows.filter((c) => Number(c.dateTime.slice(8, 10)) <= d).length + 1);

  const ownerOptions = users.map((u) => ({ value: u.id, label: u.name }));
  const contactOptions = useMemo(() => [...contacts].sort((a, b) => a.name.localeCompare(b.name)).map((c) => ({ value: c.id, label: `${c.name} — ${accountName(c.accountId)}` })), [contacts, accountName]);
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
    onParams: (p) => { if (p.status) { set('status')(p.status); setRange({ from: '', to: '' }); } },
  });

  const submit = (v) => {
    const duration = v.status === 'Scheduled' ? 0 : (Number(v.durMin) || 0) * 60 + (Number(v.durSec) || 0);
    const { durMin, durSec, ...rest } = v;
    const rec = { ...rest, duration, accountId: contactsById[v.contactId]?.accountId || '' };
    if (form.mode === 'create') { createRecord('calls', rec); table.setSort({ key: 'dateTime', dir: 'desc' }); table.setPage(1); if (!inRange(v.dateTime, range)) setRange({ from: '', to: '' }); }
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

  const statusMenu = (c, trigger) => (
    <Dropdown width={180} trigger={trigger}>
      {(close) => (<><MenuLabel>Update status</MenuLabel>{CALL_STATUSES.map((s) => <MenuItem key={s} close={close} active={s === c.status} onClick={() => s !== c.status && setStatus(c, s)}>{s}</MenuItem>)}</>)}
    </Dropdown>
  );

  const columns = [
    { key: 'subject', header: 'Call Subject', sortable: true, render: (c) => <button type="button" onClick={() => setViewing(c.id)} className="text-primary hover:underline text-left whitespace-nowrap">{c.subject}</button> },
    { key: 'contact', header: 'Contact Name', sortable: true, render: (c) => (
      <Link to={`/contacts?open=${c.contactId}`} className="flex items-center gap-2.5 text-primary hover:underline whitespace-nowrap"><PersonAvatar name={contactName(c.contactId)} size={30} solid />{contactName(c.contactId)}</Link>
    ) },
    { key: 'account', header: 'Account Name', sortable: true, render: (c) => <Link to={`/accounts?open=${c.accountId}`} className="text-primary hover:underline whitespace-nowrap">{accountName(c.accountId)}</Link> },
    { key: 'type', header: 'Call Type', sortable: true, render: (c) => <CallType type={c.type} /> },
    { key: 'dateTime', header: 'Call Date & Time', sortable: true, render: (c) => <span className="leading-snug block whitespace-nowrap">{fmtDate(c.dateTime)}<br />{fmtTime(c.dateTime)}</span> },
    { key: 'duration', header: 'Duration', sortable: true, className: 'whitespace-nowrap', render: (c) => (c.status === 'Scheduled' ? <span className="text-ink-400">—</span> : fmtDuration(c.duration)) },
    { key: 'status', header: 'Status', sortable: true, render: (c) => statusMenu(c, <button type="button" title="Update status" className={`inline-flex items-center justify-center h-[28px] min-w-[78px] px-2.5 rounded-md text-[12.5px] font-medium ${badgeTone('callStatus', c.status)}`}>{c.status}</button>) },
    { key: 'owner', header: 'Owner', sortable: true, render: (c) => <UserAvatar userId={c.ownerId} size={30} withName className="whitespace-nowrap" /> },
    { key: 'notes', header: 'Notes', render: (c) => <span className="line-clamp-2 max-w-[150px] leading-snug text-ink-600" title={c.notes}>{c.notes}</span> },
    { key: 'actions', header: 'Actions', align: 'center', render: (c) => (
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
    ) },
  ];

  const recIndex = calls.findIndex((c) => c.id === viewing);
  const rec = calls[recIndex];
  const prevCall = recIndex > 0 ? calls[recIndex - 1] : null;
  const nextCall = recIndex >= 0 && recIndex < calls.length - 1 ? calls[recIndex + 1] : null;
  const history = rec ? calls.filter((c) => c.contactId === rec.contactId).sort((a, b) => b.dateTime.localeCompare(a.dateTime)) : [];
  const relatedContact = rec ? contactsById[rec.contactId] : null;
  const relatedDeals = useMemo(() => {
    if (!rec) return [];
    const byContact = deals.filter((d) => d.contactId === rec.contactId);
    if (byContact.length > 0) return byContact;
    const byAcc = deals.filter((d) => d.accountId && d.accountId === rec.accountId);
    return byAcc.length > 0 ? byAcc : deals.slice(0, 1);
  }, [rec, deals]);
  const primaryDeal = relatedDeals[0] || null;

  const selectedIds = [...table.selected];
  const navigate = useNavigate();
  const location = useLocation();

  const handleCloseDetail = () => {
    if (location.state?.from) {
      navigate(location.state.from);
      return;
    }
    setViewing(null);
    if (routeParamId) navigate('/calls');
  };

  const scrollToCallSec = (secId) => {
    setDetailTab('Overview');
    setTimeout(() => {
      document.getElementById(secId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 30);
  };

  return (
    <div>
      {rec ? (
        <div className="-mx-3 sm:-mx-[18px] -mt-2.5 bg-[#F5F7FA] min-h-[calc(100vh-56px)] flex flex-col">
          {/* Zoho Call Details Top Header */}
          <div className="bg-white px-4 py-3 border-b border-line flex items-center justify-between flex-wrap gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCloseDetail}
                className="p-1.5 hover:bg-page rounded-full text-ink-600 transition-colors"
                title={location.state?.from === '/workqueue' ? 'Back to Workqueue' : 'Back to Calls'}
              >
                <ArrowLeft size={18} />
              </button>
              <div className="h-9 w-9 rounded bg-blue-50 text-primary flex items-center justify-center shrink-0">
                <PhoneCall size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-[17px] font-semibold text-ink leading-tight">{rec.subject}</h1>
                  <StatusBadge kind="callStatus" value={rec.status} size="sm" />
                </div>
                <div className="text-[12px] text-ink-500 mt-0.5 flex items-center gap-2">
                  <span>{rec.type} Call</span>
                  <span>•</span>
                  <span>{fmtDate(rec.dateTime)} at {fmtTime(rec.dateTime)}</span>
                  <span>•</span>
                  <span>Contact: {contactName(rec.contactId)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setForm({ mode: 'edit', record: toForm(rec) })}
                className="btn-secondary h-8 px-3 text-[12.5px]"
              >
                <Pencil size={14} /> Edit
              </button>
              <button
                type="button"
                onClick={() =>
                  setForm({
                    mode: 'create',
                    record: { ...blank({ contact: rec.contactId, schedule: true }), subject: `Follow up: ${rec.subject}`, dateTime: '' },
                  })
                }
                className="btn-secondary h-8 px-3 text-[12.5px]"
              >
                <CalendarPlus size={14} /> Schedule Follow-up
              </button>
              <button
                type="button"
                onClick={() => setConfirm({ ids: [rec.id], label: rec.subject })}
                className="btn-secondary h-8 px-3 text-[12.5px] text-danger-700"
              >
                <Trash2 size={14} /> Delete
              </button>
              <div className="flex items-center gap-1 ml-1">
                <button
                  type="button"
                  disabled={!prevCall}
                  onClick={() => prevCall && setViewing(prevCall.id)}
                  className="btn-secondary h-8 px-2 disabled:opacity-40"
                  title="Previous Call"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  disabled={!nextCall}
                  onClick={() => nextCall && setViewing(nextCall.id)}
                  className="btn-secondary h-8 px-2 disabled:opacity-40"
                  title="Next Call"
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
              <Clock3 size={12} /> Last Update : {fmtDate(rec.dateTime)} {fmtTime(rec.dateTime)}
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
                    onClick={() => scrollToCallSec('call-sec-info')}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#F3F4F6] hover:text-primary"
                  >
                    Call Information
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToCallSec('call-sec-contact')}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#F3F4F6] hover:text-primary flex items-center justify-between"
                  >
                    <span>Related Contact</span>
                    <span className="bg-[#EEF2F8] text-[#374151] rounded-full px-1.5 py-0.5 text-[11px] font-semibold">1</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToCallSec('call-sec-deal')}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#F3F4F6] hover:text-primary flex items-center justify-between"
                  >
                    <span>Related Deal</span>
                    <span className="bg-[#EEF2F8] text-[#374151] rounded-full px-1.5 py-0.5 text-[11px] font-semibold">
                      {relatedDeals.length}
                    </span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToCallSec('call-sec-notes')}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#F3F4F6] hover:text-primary"
                  >
                    Notes
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToCallSec('call-sec-history')}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#F3F4F6] hover:text-primary flex items-center justify-between"
                  >
                    <span>Activity Details</span>
                    <span className="bg-[#EEF2F8] text-[#374151] rounded-full px-1.5 py-0.5 text-[11px] font-semibold">
                      {history.length}
                    </span>
                  </button>
                </li>
              </ul>
            </aside>

            <div className="flex-1 min-w-0 p-4 space-y-4 overflow-y-auto">
              {detailTab === 'Overview' ? (
                <>
                  {/* Business Card Summary */}
                  <div className="bg-white border border-line rounded-lg p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-line-soft">
                      <div className="text-[13px] font-semibold text-ink">Quick Call Status</div>
                      <div className="flex flex-wrap gap-1.5">
                        {CALL_STATUSES.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => s !== rec.status && setStatus(rec, s)}
                            className={`h-7 px-3 rounded-md text-[12px] font-medium border transition ${
                              s === rec.status
                                ? `${badgeTone('callStatus', s)} border-transparent`
                                : 'border-line text-ink-600 hover:bg-page'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-10 text-[13px]">
                      <div className="grid grid-cols-[150px_1fr] gap-3">
                        <span className="text-ink-500 text-right">Call Owner</span>
                        <span className="text-ink font-semibold">
                          <UserAvatar userId={rec.ownerId} size={22} withName />
                        </span>
                      </div>
                      <div className="grid grid-cols-[150px_1fr] gap-3">
                        <span className="text-ink-500 text-right">Contact Name</span>
                        <button
                          type="button"
                          onClick={() => navigate(`/contacts/${rec.contactId}`, { state: { from: `/calls/${rec.id}` } })}
                          className="text-primary hover:underline font-semibold text-left inline-flex items-center gap-1"
                        >
                          {contactName(rec.contactId)} <ExternalLink size={12} />
                        </button>
                      </div>
                      <div className="grid grid-cols-[150px_1fr] gap-3">
                        <span className="text-ink-500 text-right">Call Type</span>
                        <CallType type={rec.type} />
                      </div>
                      <div className="grid grid-cols-[150px_1fr] gap-3">
                        <span className="text-ink-500 text-right">Related Deal</span>
                        {primaryDeal ? (
                          <button
                            type="button"
                            onClick={() => navigate(`/deals/${primaryDeal.id}`, { state: { from: `/calls/${rec.id}` } })}
                            className="text-primary hover:underline font-semibold text-left inline-flex items-center gap-1"
                          >
                            {primaryDeal.name} <ExternalLink size={12} />
                          </button>
                        ) : (
                          <span className="text-ink-400">—</span>
                        )}
                      </div>
                      <div className="grid grid-cols-[150px_1fr] gap-3">
                        <span className="text-ink-500 text-right">Call Start Time</span>
                        <span className="text-ink font-medium">{fmtDate(rec.dateTime)} {fmtTime(rec.dateTime)}</span>
                      </div>
                      <div className="grid grid-cols-[150px_1fr] gap-3">
                        <span className="text-ink-500 text-right">Call Duration</span>
                        <span className="text-ink font-medium">
                          {rec.status === 'Scheduled' ? 'Scheduled (Not started)' : `${fmtDuration(rec.duration)} (${rec.duration} secs)`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Call Information Section */}
                  <section id="call-sec-info" className="bg-white border border-line rounded-lg p-5">
                    <h3 className="text-[14px] font-bold text-ink mb-4 pb-2 border-b border-line-soft">Call Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3.5 gap-x-10 text-[13px]">
                      <div className="grid grid-cols-[160px_1fr] gap-3">
                        <span className="text-ink-500 text-right">Subject</span>
                        <span className="text-ink font-semibold">{rec.subject}</span>
                      </div>
                      <div className="grid grid-cols-[160px_1fr] gap-3">
                        <span className="text-ink-500 text-right">Call Type</span>
                        <span className="text-ink font-medium">{rec.type}</span>
                      </div>
                      <div className="grid grid-cols-[160px_1fr] gap-3">
                        <span className="text-ink-500 text-right">Outgoing Call Status</span>
                        <span className="text-ink font-medium">{rec.status}</span>
                      </div>
                      <div className="grid grid-cols-[160px_1fr] gap-3">
                        <span className="text-ink-500 text-right">Call Start Time</span>
                        <span className="text-ink font-medium">{fmtDate(rec.dateTime)} {fmtTime(rec.dateTime)}</span>
                      </div>
                      <div className="grid grid-cols-[160px_1fr] gap-3">
                        <span className="text-ink-500 text-right">Call Owner</span>
                        <span className="text-ink font-medium">{userName(rec.ownerId)}</span>
                      </div>
                      <div className="grid grid-cols-[160px_1fr] gap-3">
                        <span className="text-ink-500 text-right">Call Duration (in seconds)</span>
                        <span className="text-ink font-medium">{rec.duration || 0}</span>
                      </div>
                      <div className="grid grid-cols-[160px_1fr] gap-3">
                        <span className="text-ink-500 text-right">Call Purpose</span>
                        <span className="text-ink font-medium">Prospecting / Requirement Follow-up</span>
                      </div>
                      <div className="grid grid-cols-[160px_1fr] gap-3">
                        <span className="text-ink-500 text-right">Call Result</span>
                        <span className="text-ink font-medium">
                          {rec.status === 'Completed' ? 'Interested — Proceed to Proposal' : rec.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-[160px_1fr] gap-3">
                        <span className="text-ink-500 text-right">Account Name</span>
                        <Link to={`/accounts?open=${rec.accountId}`} className="text-primary hover:underline font-medium">
                          {accountName(rec.accountId)}
                        </Link>
                      </div>
                      <div className="grid grid-cols-[160px_1fr] gap-3">
                        <span className="text-ink-500 text-right">Caller Number</span>
                        <span className="text-ink font-medium">{relatedContact?.phone || '+91 98400 11223'}</span>
                      </div>
                      <div className="grid grid-cols-[160px_1fr] gap-3 md:col-span-2">
                        <span className="text-ink-500 text-right">Description / Call Notes</span>
                        <span className="text-ink">{rec.notes || '—'}</span>
                      </div>
                    </div>
                  </section>

                  {/* Related Contact Section */}
                  <section id="call-sec-contact" className="bg-white border border-line rounded-lg p-5">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-line-soft">
                      <h3 className="text-[14px] font-bold text-ink">Related Contact</h3>
                      {relatedContact && (
                        <button
                          type="button"
                          onClick={() => navigate(`/contacts/${relatedContact.id}`, { state: { from: `/calls/${rec.id}` } })}
                          className="text-[12px] text-primary hover:underline font-semibold inline-flex items-center gap-1"
                        >
                          Open Contact Details <ExternalLink size={12} />
                        </button>
                      )}
                    </div>
                    {relatedContact ? (
                      <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-lg bg-[#F8FAFC] border border-line">
                        <div className="flex items-center gap-3">
                          <PersonAvatar name={relatedContact.name} size={42} />
                          <div>
                            <button
                              type="button"
                              onClick={() => navigate(`/contacts/${relatedContact.id}`, { state: { from: `/calls/${rec.id}` } })}
                              className="text-[14px] font-semibold text-primary hover:underline text-left"
                            >
                              {relatedContact.name}
                            </button>
                            <div className="text-[12px] text-ink-500">
                              {relatedContact.designation} • {accountName(relatedContact.accountId)}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-6 text-[12.5px] text-ink-600">
                          <div>
                            <span className="text-ink-400 block text-[11px]">Email</span>
                            <a href={`mailto:${relatedContact.email}`} className="text-primary hover:underline">
                              {relatedContact.email}
                            </a>
                          </div>
                          <div>
                            <span className="text-ink-400 block text-[11px]">Phone</span>
                            <span className="font-medium text-ink">{relatedContact.phone}</span>
                          </div>
                          <div>
                            <span className="text-ink-400 block text-[11px]">Lifecycle</span>
                            <StatusBadge kind="lifecycle" value={relatedContact.lifecycle} size="sm" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[13px] text-ink-500">No contact linked to this call.</p>
                    )}
                  </section>

                  {/* Related Deal Section */}
                  <section id="call-sec-deal" className="bg-white border border-line rounded-lg p-5">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-line-soft">
                      <h3 className="text-[14px] font-bold text-ink">Related Deal ({relatedDeals.length})</h3>
                    </div>
                    {relatedDeals.length === 0 ? (
                      <p className="text-[13px] text-ink-500">No deals associated with this call.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-[12.5px]">
                          <thead>
                            <tr className="border-b border-line text-ink-500">
                              <th className="py-2 px-3">Deal Name</th>
                              <th className="py-2 px-3">Account</th>
                              <th className="py-2 px-3">Stage</th>
                              <th className="py-2 px-3">Amount</th>
                              <th className="py-2 px-3">Closing Date</th>
                              <th className="py-2 px-3">Deal Owner</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-line-soft">
                            {relatedDeals.map((d) => (
                              <tr key={d.id} className="hover:bg-page">
                                <td className="py-2.5 px-3">
                                  <button
                                    type="button"
                                    onClick={() => navigate(`/deals/${d.id}`, { state: { from: `/calls/${rec.id}` } })}
                                    className="text-primary hover:underline font-semibold text-left"
                                  >
                                    {d.name}
                                  </button>
                                </td>
                                <td className="py-2.5 px-3 text-ink-600">{accountName(d.accountId)}</td>
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

                  {/* Notes Section */}
                  <section id="call-sec-notes" className="bg-white border border-line rounded-lg p-5">
                    <h3 className="text-[14px] font-bold text-ink mb-3 pb-2 border-b border-line-soft">Notes</h3>
                    {rec.notes && (
                      <div className="p-3 rounded-lg bg-[#F8FAFC] border border-line text-[13px] text-ink mb-3">
                        <div className="text-[11px] text-ink-400 mb-1">
                          Logged by {userName(rec.ownerId)} • {fmtDate(rec.dateTime)} {fmtTime(rec.dateTime)}
                        </div>
                        {rec.notes}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        placeholder="Add a note to this call..."
                        className="flex-1 h-9 px-3 text-[13px] border border-line rounded-md focus:border-primary outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!noteDraft.trim()) return;
                          const nextNotes = rec.notes ? `${rec.notes} | ${noteDraft.trim()}` : noteDraft.trim();
                          updateRecord('calls', rec.id, { notes: nextNotes });
                          setNoteDraft('');
                        }}
                        className="btn-primary h-9 px-4 text-[12.5px]"
                      >
                        Save Note
                      </button>
                    </div>
                  </section>

                  {/* Activity Details / Call History with Contact */}
                  <section id="call-sec-history" className="bg-white border border-line rounded-lg p-5">
                    <h3 className="text-[14px] font-bold text-ink mb-3 pb-2 border-b border-line-soft">
                      Activity Details — Call History with {contactName(rec.contactId)} ({history.length})
                    </h3>
                    <ol className="relative border-l-2 border-line ml-2 space-y-3">
                      {history.map((c) => (
                        <li key={c.id} className="pl-4 relative">
                          <span
                            className="absolute -left-[7px] top-2 h-3 w-3 rounded-full ring-2 ring-white"
                            style={{ background: STATUS_COLORS[c.status] }}
                          />
                          <button
                            type="button"
                            onClick={() => setViewing(c.id)}
                            className={`text-left w-full rounded-lg px-3.5 py-2.5 border transition ${
                              c.id === rec.id ? 'border-primary bg-primary-50/40' : 'border-line hover:bg-page'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[13px] font-semibold text-ink">{c.subject}</span>
                              <StatusBadge kind="callStatus" value={c.status} size="sm" />
                            </div>
                            <div className="text-[12px] text-ink-500 mt-0.5 flex items-center gap-1.5">
                              <Phone size={12} />
                              {fmtDate(c.dateTime)} {fmtTime(c.dateTime)} · {c.type}
                              {c.status !== 'Scheduled' ? ` · ${fmtDuration(c.duration)}` : ''} · Owner: {userName(c.ownerId)}
                            </div>
                            {c.notes && <div className="text-[12px] text-ink-600 mt-1">{c.notes}</div>}
                          </button>
                        </li>
                      ))}
                    </ol>
                  </section>
                </>
              ) : (
                /* Timeline Tab */
                <div className="bg-white border border-line rounded-lg p-5">
                  <h3 className="text-[14px] font-bold text-ink mb-4">Call Activity Timeline</h3>
                  <ol className="relative border-l-2 border-line ml-3 space-y-4">
                    <li className="pl-5 relative">
                      <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-primary ring-2 ring-white" />
                      <div className="text-[13px] font-semibold text-ink">
                        Call status marked as <span className="text-primary">{rec.status}</span>
                      </div>
                      <div className="text-[12px] text-ink-500 mt-0.5">
                        By {userName(rec.ownerId)} • {fmtDate(rec.dateTime)} {fmtTime(rec.dateTime)}
                      </div>
                    </li>
                    {rec.duration > 0 && (
                      <li className="pl-5 relative">
                        <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                        <div className="text-[13px] font-semibold text-ink">
                          Call duration recorded: {fmtDuration(rec.duration)} ({rec.duration} seconds)
                        </div>
                        <div className="text-[12px] text-ink-500 mt-0.5">
                          Connected with {contactName(rec.contactId)} ({accountName(rec.accountId)})
                        </div>
                      </li>
                    )}
                    <li className="pl-5 relative">
                      <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-slate-400 ring-2 ring-white" />
                      <div className="text-[13px] font-semibold text-ink">
                        {rec.type} call activity "{rec.subject}" created
                      </div>
                      <div className="text-[12px] text-ink-500 mt-0.5">
                        Assigned to {userName(rec.ownerId)} • {fmtDate(rec.dateTime)}
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
            tabMenu={[{ label: 'Export filtered calls (CSV)', icon: Download, onClick: () => exportRows(table.sorted) }, { label: `Select all ${filtered.length} filtered`, onClick: table.selectAllFiltered }, { label: 'Show all dates', onClick: () => setRange({ from: '', to: '' }) }]}
            toolbar={{
              filterActive: filtersOpen, onFilter: () => setFiltersOpen((o) => !o),
              sortOptions: [{ key: 'dateTime', label: 'Call Date & Time' }, { key: 'duration', label: 'Duration' }, { key: 'subject', label: 'Call Subject' }, { key: 'contact', label: 'Contact Name' }, { key: 'status', label: 'Status' }],
              sort: table.sort, onSort: table.setSort, layouts: ['list', 'kanban', 'grid', 'chart'], layout, onLayout: setLayout,
              onRefresh: refresh, refreshing, dense, onDense: () => setDense((d) => !d), module: 'Calls',
              primary: { label: 'Log a Call', onClick: () => setForm({ mode: 'create', record: blank() }), menu: [
                { label: 'Log a Call', icon: Plus, onClick: () => setForm({ mode: 'create', record: blank() }) },
                { label: 'Schedule a Call', icon: CalendarPlus, onClick: () => setForm({ mode: 'create', record: { ...blank({ schedule: true }), dateTime: '' } }) },
                { label: 'Export calls (CSV)', icon: Download, onClick: () => exportRows(table.sorted) },
              ] },
              moreItems: [
                { label: 'Export selected (CSV)', icon: Download, disabled: !selectedIds.length, onClick: () => exportRows(calls.filter((c) => table.selected.has(c.id))) },
                { label: 'Change owner of selected', icon: UserCog, disabled: !selectedIds.length, onClick: () => setBulk('owner') },
                { label: 'Delete selected', icon: Trash2, danger: true, disabled: !selectedIds.length, onClick: () => setConfirm({ ids: selectedIds, label: `${selectedIds.length} calls` }) },
              ],
            }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-3 mb-3">
            <StatCard icon={PhoneCall} tone="blue" label="Total Calls" value={k.total} trend={trend(k.total, baselines.calls.total)} spark={byDay(filtered)} />
            <StatCard icon={PhoneIncoming} tone="green" label="Answered Calls" value={k.answered} trend={trend(k.answered, baselines.calls.answered)} spark={byDay(answered)} onClick={() => set('status')('Completed')} />
            <StatCard icon={PhoneMissed} tone="red" label="Missed Calls" value={k.missed} trend={trend(k.missed, baselines.calls.missed)} invertTrend spark={byDay(filtered.filter((c) => c.status === 'Missed'))} onClick={() => set('status')('Missed')} />
            <StatCard icon={Clock3} tone="amber" label="Avg. Call Duration" value={fmtDuration(k.avg).replace(/^0/, '')} trend={trend(k.avg, baselines.calls.avgDuration)} spark={[6, 7, 8, 9, 10]} />
            <StatCard icon={CalendarClock} tone="violet" label="Scheduled Calls" value={k.scheduled} trend={trend(k.scheduled, baselines.calls.scheduled)} spark={byDay(filtered.filter((c) => c.status === 'Scheduled'))} onClick={() => set('status')('Scheduled')} />
          </div>

          <div className="flex gap-3 items-start">
            {filtersOpen && (
              <aside className="card hidden md:block w-[220px] shrink-0 px-3.5 py-4 sticky top-[72px] max-h-[calc(100vh-86px)] overflow-y-auto thin-scroll">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[15px] font-semibold text-ink whitespace-nowrap">Filter Calls by</h2>
                  {(search || Object.values(f).some(Boolean) || range.from !== DEFAULT_RANGE.from || range.to !== DEFAULT_RANGE.to) && (
                    <button onClick={reset} className="text-[12.5px] text-primary hover:underline">Clear</button>
                  )}
                </div>
                
                <div className="relative mb-5">
                  <Search className="absolute left-2.5 top-2.5 text-ink-400" size={14} />
                  <input type="text" placeholder="Search..." className="w-full h-9 pl-8 pr-3 text-[13px] border border-line rounded-md focus:border-primary outline-none" value={search} onChange={(e) => { setSearch(e.target.value); table.setPage(1); }} />
                </div>

                <details className="group" open>
                  <summary className="py-2.5 text-[14px] font-semibold text-ink cursor-pointer select-none flex items-center gap-1 -ml-1">
                    <ChevronDown size={16} className="group-open:rotate-180 transition-transform -rotate-90" />
                    System Defined Filters
                  </summary>
                  <div className="pl-5 pb-4 space-y-3">
                    {['Record Action', 'Related Records Action', 'Touched Records', 'Untouched Records'].map(lbl => (
                      <label key={lbl} className="flex items-start gap-2.5 text-[13.5px] text-ink-600 cursor-pointer leading-snug">
                        <input type="checkbox" className="cb mt-0.5" />
                        {lbl}
                      </label>
                    ))}
                  </div>
                </details>
                
                <details className="group" open>
                  <summary className="py-2.5 text-[14px] font-semibold text-ink cursor-pointer select-none flex items-center gap-1 -ml-1">
                    <ChevronDown size={16} className="group-open:rotate-180 transition-transform -rotate-90" />
                    Filter By Fields
                  </summary>
                  <div className="pl-5 pb-4 space-y-3">
                    <div className="space-y-1.5">
                      <label className="flex items-start gap-2.5 text-[13.5px] text-ink-600 cursor-pointer leading-snug">
                        <input type="checkbox" className="cb mt-0.5" checked={range.from !== DEFAULT_RANGE.from || range.to !== DEFAULT_RANGE.to} onChange={(e) => setRange(e.target.checked ? { from: '2026-01-01', to: '2026-12-31' } : DEFAULT_RANGE)} />
                        Date Range
                      </label>
                      {(range.from !== DEFAULT_RANGE.from || range.to !== DEFAULT_RANGE.to) && (
                        <div className="grid grid-cols-2 gap-1 mt-1">
                          <input type="date" className="h-8 px-1 text-[11px] border border-line rounded-md" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} />
                          <input type="date" className="h-8 px-1 text-[11px] border border-line rounded-md" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="flex items-start gap-2.5 text-[13.5px] text-ink-600 cursor-pointer leading-snug">
                        <input type="checkbox" className="cb mt-0.5" checked={f.type !== ''} onChange={() => set('type')(f.type ? '' : CALL_TYPES[0])} />
                        Call Type
                      </label>
                      {f.type !== '' && (
                        <select className="w-full h-8 px-2 text-[13px] border border-line rounded-md bg-white" value={f.type} onChange={(e) => set('type')(e.target.value)}>
                          <option value="">All Types</option>
                          {CALL_TYPES.map(i => <option key={i} value={i}>{i}</option>)}
                        </select>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="flex items-start gap-2.5 text-[13.5px] text-ink-600 cursor-pointer leading-snug">
                        <input type="checkbox" className="cb mt-0.5" checked={f.status !== ''} onChange={() => set('status')(f.status ? '' : CALL_STATUSES[0])} />
                        Call Status
                      </label>
                      {f.status !== '' && (
                        <select className="w-full h-8 px-2 text-[13px] border border-line rounded-md bg-white" value={f.status} onChange={(e) => set('status')(e.target.value)}>
                          <option value="">All Status</option>
                          {CALL_STATUSES.map(i => <option key={i} value={i}>{i}</option>)}
                        </select>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="flex items-start gap-2.5 text-[13.5px] text-ink-600 cursor-pointer leading-snug">
                        <input type="checkbox" className="cb mt-0.5" checked={f.owner !== ''} onChange={() => set('owner')(f.owner ? '' : ownerOptions[0]?.value)} />
                        Call Owner
                      </label>
                      {f.owner !== '' && (
                        <select className="w-full h-8 px-2 text-[13px] border border-line rounded-md bg-white" value={f.owner} onChange={(e) => set('owner')(e.target.value)}>
                          <option value="">All Owners</option>
                          {ownerOptions.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
                        </select>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="flex items-start gap-2.5 text-[13.5px] text-ink-600 cursor-pointer leading-snug">
                        <input type="checkbox" className="cb mt-0.5" checked={f.account !== ''} onChange={() => set('account')(f.account ? '' : callAccounts[0]?.value)} />
                        Account
                      </label>
                      {f.account !== '' && (
                        <select className="w-full h-8 px-2 text-[13px] border border-line rounded-md bg-white" value={f.account} onChange={(e) => set('account')(e.target.value)}>
                          <option value="">All Accounts</option>
                          {callAccounts.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
                        </select>
                      )}
                    </div>

                    {['AI Analysis', 'Call Agenda', 'Call Connect Status', 'Call Duration', 'Call Duration (in seconds)', 'Call Manager', 'Call Purpose', 'Call Result', 'Call Start Time', 'Caller ID'].map(lbl => (
                      <label key={lbl} className="flex items-start gap-2.5 text-[13.5px] text-ink-600 cursor-pointer leading-snug">
                        <input type="checkbox" className="cb mt-0.5" />
                        {lbl}
                      </label>
                    ))}
                  </div>
                </details>
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
                  emptyAction={<button className="btn-primary mt-2 h-9" onClick={() => setForm({ mode: 'create', record: blank() })}><Plus size={16} />Log a Call</button>} />}
                {layout === 'kanban' && <div className="p-3"><KanbanView groups={CALL_STATUSES.map((s) => ({ key: s, label: s, color: STATUS_COLORS[s] }))} rows={table.sorted} groupOf={(c) => c.status}
                  onMove={setStatus} onCardClick={(c) => setViewing(c.id)}
                  renderCard={(c) => (<div><div className="text-[13.5px] font-semibold text-ink">{c.subject}</div><div className="text-[12px] text-ink-500 mt-0.5">{contactName(c.contactId)} · {accountName(c.accountId)}</div><div className="flex items-center justify-between mt-2 text-[12px] text-ink-600"><CallType type={c.type} /><span>{fmtDate(c.dateTime)}</span></div></div>)} /></div>}
                {layout === 'grid' && <div className="p-3"><GridView rows={table.pageRows} onCardClick={(c) => setViewing(c.id)} renderCard={(c) => (
                  <>
                    <div className="flex items-start justify-between gap-2"><div className="font-semibold text-ink">{c.subject}</div><StatusBadge kind="callStatus" value={c.status} size="sm" /></div>
                    <div className="flex items-center gap-2 mt-2 text-[12.5px] text-ink-600"><PersonAvatar name={contactName(c.contactId)} size={24} solid />{contactName(c.contactId)} · {accountName(c.accountId)}</div>
                    <div className="flex items-center justify-between mt-3 text-[12.5px] text-ink-600"><CallType type={c.type} /><span>{fmtDate(c.dateTime)} {fmtTime(c.dateTime)}</span></div>
                    <p className="text-[12.5px] text-ink-500 mt-2 line-clamp-2">{c.notes}</p>
                  </>
                )} /></div>}
                {layout === 'chart' && <ChartView title="Calls by status (filtered)" data={CALL_STATUSES.map((s) => ({ name: s, value: filtered.filter((c) => c.status === s).length, color: STATUS_COLORS[s] }))} valueLabel="Calls" />}
                {(layout === 'list' || layout === 'grid') && <div className="px-4"><Pagination table={table} noun="calls" /></div>}
              </section>
            </div>
          </div>
        </>
      )}

      <FormModal open={!!form} onClose={() => setForm(null)} title={form?.mode === 'edit' ? 'Edit call' : form?.record?.status === 'Scheduled' ? 'Schedule a call' : 'Log a call'} fields={fields} initial={form?.record} onSubmit={submit}
        submitLabel={form?.mode === 'edit' ? 'Save changes' : form?.record?.status === 'Scheduled' ? 'Schedule call' : 'Log call'} />
      <FormModal open={!!bulk} onClose={() => setBulk(null)} size="sm" title={bulk === 'owner' ? 'Change owner' : 'Update call status'} subtitle={`Applies to ${selectedIds.length} selected calls.`}
        fields={[bulk === 'owner' ? { name: 'value', label: 'New owner', type: 'select', options: ownerOptions, required: true, span: 2 } : { name: 'value', label: 'Status', type: 'select', options: CALL_STATUSES.filter((s) => s !== 'Completed'), required: true, span: 2, help: 'Completing a call needs a duration, so do that one call at a time.' }]}
        initial={bulk ? { value: '' } : null} submitLabel="Apply"
        onSubmit={({ value }) => { selectedIds.forEach((id) => updateRecord('calls', id, bulk === 'owner' ? { ownerId: value } : { status: value })); setBulk(null); table.clearSelection(); }} />
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} title="Delete calls?" message={confirm ? `Delete ${confirm.label}? This removes ${confirm.ids.length > 1 ? 'them' : 'it'} from call history.` : ''}
        onConfirm={() => { deleteRecords('calls', confirm.ids); table.clearSelection(); handleCloseDetail(); }} />
    </div>
  );
}
