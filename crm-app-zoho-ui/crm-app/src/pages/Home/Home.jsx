import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, CalendarCheck2, Check, CheckCircle2, ChevronDown, ExternalLink, MoreHorizontal, Pencil, Plus, RotateCw, Settings2, Trash2 } from 'lucide-react';
import { useCRM } from '../../context/crmContextInstance';
import { useToast } from '../../components/common/toastContext';
import Dropdown, { MenuDivider } from '../../components/common/Dropdown';
import FormModal from '../../components/common/RecordForm';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { LEAD_SOURCES, LEAD_STATUSES, LEAD_TAGS, TASK_PRIORITIES, TASK_STATUSES } from '../../data/seedData';
import { STAGES, STAGE_PROBABILITY } from '../../utils/calculations';
import { MODULE_DEFS, customColumns, inOriginalFormat, splitRelated, toISODate } from './homeConfig';
import { useHomeLayout } from './useHomeLayout';
import HomeWidget from './components/HomeWidget';
import ComponentEditorModal from './components/ComponentEditorModal';
import ReorderModal from './components/ReorderModal';
import { ManageHomePagesModal, NewHomePageModal } from './components/HomePagesModal';
import AddActivityModal from './components/AddActivityModal';

const menuItem = 'w-full flex items-center gap-2.5 px-3 py-[7px] text-[14px] text-left text-ink hover:bg-[#F1F3FA]';
const withCurrent = (list, value) => (value && !list.includes(value) ? [value, ...list] : list);

export default function Home() {
  const crm = useCRM();
  const toast = useToast();
  const navigate = useNavigate();
  const layout = useHomeLayout(toast.error);
  const { view, views } = layout;

  const [loadingIds, setLoadingIds] = useState(() => new Set());
  const [editor, setEditor] = useState(null); // { component|null }
  const [reorderOpen, setReorderOpen] = useState(false);
  const [newPageOpen, setNewPageOpen] = useState(false);
  const [managePagesOpen, setManagePagesOpen] = useState(false);
  const [edit, setEdit] = useState(null); // { type: 'tasks'|'leads'|'deals'|'custom', record, component? }
  const [activityLead, setActivityLead] = useState(null);
  const [confirm, setConfirm] = useState(null); // { message, onConfirm }
  const [fullscreen, setFullscreen] = useState(false);
  const rootRef = useRef(null);
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // ---------- refresh ----------
  const refresh = useCallback((ids) => {
    setLoadingIds((s) => new Set([...s, ...ids]));
    crm.reload();
    timers.current.push(setTimeout(() => setLoadingIds((s) => {
      const n = new Set(s);
      ids.forEach((id) => n.delete(id));
      return n;
    }), 500));
  }, [crm]);

  // ---------- full screen ----------
  // The Home area expands over the sidebar/top bar; the browser is asked to go full screen for the
  // whole document so menus and dialogs (rendered in portals) stay visible.
  const viaApi = useRef(false);
  useEffect(() => {
    const onChange = () => { if (!document.fullscreenElement && viaApi.current) { viaApi.current = false; setFullscreen(false); } };
    const onKey = (e) => { if (e.key === 'Escape' && !document.fullscreenElement && !document.querySelector('[role="dialog"]')) setFullscreen(false); };
    document.addEventListener('fullscreenchange', onChange);
    if (fullscreen) document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('fullscreenchange', onChange); document.removeEventListener('keydown', onKey); };
  }, [fullscreen]);
  useEffect(() => () => { if (viaApi.current && document.fullscreenElement) document.exitFullscreen().catch(() => {}); }, []);
  const toggleFullscreen = async () => {
    if (fullscreen) {
      setFullscreen(false);
      if (document.fullscreenElement) { viaApi.current = false; await document.exitFullscreen().catch(() => {}); }
      return;
    }
    setFullscreen(true);
    try {
      if (document.documentElement.requestFullscreen) { await document.documentElement.requestFullscreen(); viaApi.current = true; }
    } catch { /* browser refused: the in-page expanded view is still shown */ }
  };

  // ---------- navigation from cells ----------
  const findByName = (col, name) => (crm[col] || []).find((r) => (r.name || '').trim().toLowerCase() === name.trim().toLowerCase());
  const openRecord = (component, row, colKey) => {
    if (component.kind === 'custom') return setEdit({ type: 'custom', record: row, component });
    const def = MODULE_DEFS[component.module];
    if (colKey === 'relatedTo') {
      const { module, name } = splitRelated(row.relatedTo);
      const map = { Deal: ['deals', '/deals'], Account: ['accounts', '/accounts'], Lead: ['leads', '/leads'], Contact: ['contacts', '/contacts'] };
      const target = map[module];
      const rec = target && findByName(target[0], name);
      if (rec) return navigate(`${target[1]}?open=${rec.id}`);
      return toast.info(`"${name}" is not linked to a ${module ? module.toLowerCase() : 'CRM'} record.`);
    }
    if (colKey === 'accountId' && row.accountId) return navigate(`/accounts?open=${row.accountId}`);
    return navigate(def.openPath(row));
  };

  // ---------- record edits ----------
  const userOptions = crm.users.map((u) => ({ value: u.id, label: u.name }));
  const accountOptions = useMemo(() => crm.accounts.map((a) => ({ value: a.id, label: a.name })).sort((a, b) => a.label.localeCompare(b.label)), [crm.accounts]);

  const editConfig = useMemo(() => {
    if (!edit) return null;
    const r = edit.record;
    if (edit.type === 'tasks') {
      return {
        title: 'Edit Task',
        fields: [
          { name: 'subject', label: 'Subject', required: true, span: 2 },
          { name: 'dueDate', label: 'Due Date', type: 'date', required: true },
          { name: 'status', label: 'Status', type: 'select', options: withCurrent(TASK_STATUSES, r.status), required: true },
          { name: 'priority', label: 'Priority', type: 'select', options: withCurrent(TASK_PRIORITIES, r.priority), required: true },
          { name: 'ownerId', label: 'Task Owner', type: 'select', options: userOptions, required: true },
          { name: 'relatedTo', label: 'Related To', placeholder: 'e.g. Deal - ABC Technologies' },
          { name: 'contactName', label: 'Contact Name' },
          { name: 'description', label: 'Description', type: 'textarea', span: 2 },
        ],
        initial: { subject: r.subject || r.title || '', dueDate: toISODate(r.dueDate), status: r.status || 'Not Started', priority: r.priority || 'Medium', ownerId: r.ownerId || 'u1', relatedTo: r.relatedTo || '', contactName: r.contactName || '', description: r.description || '' },
        submit: (v) => {
          crm.updateTask(r.id, { ...v, subject: v.subject.trim(), title: v.subject.trim(), dueDate: inOriginalFormat(r.dueDate, v.dueDate), updatedAt: new Date().toISOString() });
          toast.success('Task updated');
        },
      };
    }
    if (edit.type === 'leads') {
      return {
        title: 'Edit Lead',
        fields: [
          { name: 'name', label: 'Lead Name', required: true },
          { name: 'company', label: 'Company' },
          { name: 'email', label: 'Email', type: 'email' },
          { name: 'phone', label: 'Phone', type: 'tel' },
          { name: 'tag', label: 'Tags', type: 'select', options: withCurrent(LEAD_TAGS, r.tag) },
          { name: 'source', label: 'Lead Source', type: 'select', options: withCurrent(LEAD_SOURCES, r.source) },
          { name: 'status', label: 'Lead Status', type: 'select', options: withCurrent(LEAD_STATUSES, r.status), required: true },
          { name: 'ownerId', label: 'Lead Owner', type: 'select', options: userOptions, required: true },
          { name: 'city', label: 'City' },
        ],
        initial: { name: r.name || '', company: r.company || '', email: r.email || '', phone: r.phone || '', tag: r.tag || '', source: r.source || '', status: r.status || 'New', ownerId: r.ownerId || 'u1', city: r.city || '' },
        submit: (v) => {
          crm.updateRecord('leads', r.id, { ...v, name: v.name.trim() });
          toast.success('Lead updated');
        },
      };
    }
    if (edit.type === 'deals') {
      return {
        title: 'Edit Deal',
        fields: [
          { name: 'name', label: 'Deal Name', required: true, span: 2 },
          { name: 'amount', label: 'Amount (₹)', type: 'number', min: 0, step: '0.01', required: true },
          { name: 'stage', label: 'Stage', type: 'select', options: withCurrent(STAGES, r.stage), required: true },
          { name: 'closingDate', label: 'Closing Date', type: 'date', required: true },
          { name: 'accountId', label: 'Account Name', type: 'select', options: accountOptions },
          { name: 'ownerId', label: 'Deal Owner', type: 'select', options: userOptions, required: true },
        ],
        initial: { name: r.name || '', amount: r.amount ?? '', stage: r.stage || 'Qualification', closingDate: toISODate(r.closingDate), accountId: r.accountId || '', ownerId: r.ownerId || 'u1' },
        submit: (v) => {
          const patch = { ...v, name: v.name.trim() };
          if (v.stage !== r.stage) {
            if (STAGE_PROBABILITY[v.stage] != null) patch.probability = STAGE_PROBABILITY[v.stage];
            patch.lostAtStage = v.stage === 'Closed Lost' ? r.lostAtStage || r.stage : '';
          }
          crm.updateRecord('deals', r.id, patch);
          toast.success('Deal updated');
        },
      };
    }
    if (edit.type === 'custom') {
      const cmp = edit.component;
      const isNew = !r.id;
      return {
        title: `${isNew ? 'New' : 'Edit'} ${cmp.title} Record`,
        fields: cmp.fields.map((f) => ({
          name: f.id, label: f.label, required: f.type !== 'checkbox' && f.required,
          type: f.type === 'currency' ? 'number' : f.type,
          ...(f.type === 'currency' || f.type === 'number' ? { step: 'any' } : {}),
          ...(f.type === 'currency' ? { min: 0 } : {}),
          ...(f.type === 'select' ? { options: withCurrent(f.options, r[f.id]) } : {}),
          ...(f.type === 'textarea' ? { span: 2 } : {}),
          ...(f.type === 'text' ? { validate: (val) => (String(val ?? '').length > 255 ? 'Use 255 characters or fewer.' : '') } : {}),
        })),
        initial: Object.fromEntries(cmp.fields.map((f) => [f.id, r[f.id] ?? (f.type === 'checkbox' ? false : '')])),
        submit: (v) => {
          layout.saveCustomRecord(cmp.id, { ...(isNew ? {} : { id: r.id }), ...v });
          toast.success(isNew ? 'Record added' : 'Record updated');
        },
      };
    }
    return null;
    // Recompute only when a different record is opened, so the form keeps what the user typed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edit]);

  // ---------- row actions per module ----------
  const iconBtn = 'h-[18px] w-[18px] flex items-center justify-center text-[#1F2329] hover:text-[#4F55C9]';
  const rowActions = (component) => (row) => {
    if (component.kind === 'custom') {
      return (
        <>
          <button type="button" title="Edit" aria-label="Edit record" className={iconBtn} onClick={() => setEdit({ type: 'custom', record: row, component })}><Pencil size={13} /></button>
          <button type="button" title="Delete" aria-label="Delete record" className={`${iconBtn} hover:text-danger`}
            onClick={() => setConfirm({ title: 'Delete record?', message: 'This record will be permanently deleted.', onConfirm: () => { layout.deleteCustomRecord(component.id, row.id); toast.success('Record deleted'); } })}><Trash2 size={13} /></button>
        </>
      );
    }
    if (component.module === 'tasks') {
      return (
        <>
          <button type="button" title="Edit" aria-label={`Edit ${row.subject}`} className={iconBtn} onClick={() => setEdit({ type: 'tasks', record: row })}><Pencil size={13} /></button>
          {row.status !== 'Completed' && (
            <button type="button" title="Mark as Completed" aria-label={`Mark ${row.subject} as completed`} className="h-[18px] w-[18px] flex items-center justify-center text-[#1BA94C] hover:text-[#12893B]"
              onClick={() => { crm.updateTask(row.id, { status: 'Completed', closedTime: new Date().toISOString(), updatedAt: new Date().toISOString() }); toast.success(`"${row.subject}" marked as completed`); }}>
              <CheckCircle2 size={15} fill="currentColor" stroke="white" />
            </button>
          )}
        </>
      );
    }
    if (component.module === 'leads') {
      return (
        <>
          <Dropdown width={170} trigger={<button type="button" title="More" aria-label={`More actions for ${row.name}`} className={iconBtn}><MoreHorizontal size={15} /></button>}>
            {(close) => (
              <>
                <button type="button" className={menuItem} onClick={() => { close(); setEdit({ type: 'leads', record: row }); }}><Pencil size={14} className="text-ink-500" /> Edit</button>
                <button type="button" className={menuItem} onClick={() => { close(); navigate(`/leads?open=${row.id}`); }}><ExternalLink size={14} className="text-ink-500" /> View Details</button>
                <button type="button" className={`${menuItem} text-danger-700`} onClick={() => { close(); setConfirm({ title: 'Delete lead?', message: `"${row.name}" will be permanently deleted.`, onConfirm: () => { crm.deleteRecord('leads', row.id); toast.success('Lead deleted'); } }); }}><Trash2 size={14} /> Delete</button>
              </>
            )}
          </Dropdown>
          <button type="button" title="Add Activity" aria-label={`Add activity for ${row.name}`} className={iconBtn} onClick={() => setActivityLead(row)}><CalendarCheck2 size={14} /></button>
        </>
      );
    }
    if (component.module === 'deals') {
      return <button type="button" title="Edit" aria-label={`Edit ${row.name}`} className={iconBtn} onClick={() => setEdit({ type: 'deals', record: row })}><Pencil size={13} /></button>;
    }
    const def = MODULE_DEFS[component.module];
    return <button type="button" title="View" aria-label={`View ${def.title(row)}`} className={iconBtn} onClick={() => navigate(def.openPath(row))}><ExternalLink size={13} /></button>;
  };

  // ---------- data for each component ----------
  const visible = view.components.filter((c) => !c.hidden);
  const dataFor = (c) => {
    if (c.kind === 'custom') return { rows: layout.customRecords[c.id] || [], columns: customColumns(c.fields) };
    const def = MODULE_DEFS[c.module];
    const crit = def.criteria.find((x) => x.id === c.criteria) || def.criteria[0];
    return { rows: (crm[def.collection] || []).filter(crit.test), columns: def.columns };
  };

  const saveEditor = (partial) => {
    if (editor.component) {
      layout.updateComponent(editor.component.id, partial);
      toast.success('Component updated');
    } else {
      layout.addComponent({ ...partial, sort: null, wrap: true, widths: {} });
      toast.success(`"${partial.title}" added to the Home page`);
    }
    setEditor(null);
  };

  return (
    <div ref={rootRef} className={`home-root -mx-3 sm:-mx-[18px] -mt-2.5 px-3 sm:px-[14px] pt-0 pb-4 bg-[#EEF1FA] min-h-[calc(100vh-60px)] ${fullscreen ? 'fixed inset-0 z-[70] m-0 overflow-auto !min-h-screen pt-2' : ''}`}>
      {/* welcome bar */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-[12px]">
        <div className="flex items-center gap-3 min-w-0">
          <span className="h-[44px] w-[44px] shrink-0 rounded-[6px] border border-[#D9DCE4] bg-white flex items-center justify-center text-[#6B6F7B]">
            <Building2 size={24} strokeWidth={1.4} />
          </span>
          <div>
            <h1 className="text-[22px] font-bold text-[#1F2329] truncate leading-tight">Welcome {view.welcome}</h1>
            <p className="text-[13.5px] text-[#64748B]">
              Live CRM command center — Leads, Workqueue follow-ups, Messages, Deal Approvals & Analytics
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={() => navigate('/leads?create=1')}
            className="h-[34px] px-3 rounded-[4px] bg-[#2F55D4] hover:bg-[#2444B5] text-white text-[14px] font-semibold flex items-center gap-1.5"
          >
            <Plus size={14} /> New Lead
          </button>
          <button
            type="button"
            onClick={() => navigate('/workqueue')}
            className="h-[34px] px-3 rounded-[4px] border border-[#D9DCE4] bg-white hover:bg-[#F8FAFC] text-[#1F2329] text-[14px] font-medium"
          >
            Workqueue ({(crm.tasks || []).filter((t) => t.status !== 'Completed').length})
          </button>
          <button
            type="button"
            onClick={() => navigate('/messages')}
            className="h-[34px] px-3 rounded-[4px] border border-[#D9DCE4] bg-white hover:bg-[#F8FAFC] text-[#1F2329] text-[14px] font-medium"
          >
            Messages ({(crm.messages || []).filter((m) => m.status === 'Unread' || m.read === false).length})
          </button>
          <button
            type="button"
            onClick={() => navigate('/deal-approvals')}
            className="h-[34px] px-3 rounded-[4px] border border-[#D9DCE4] bg-white hover:bg-[#F8FAFC] text-[#1F2329] text-[14px] font-medium"
          >
            Deal Approvals
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="h-[34px] px-3 rounded-[4px] border border-[#D9DCE4] bg-white hover:bg-[#F8FAFC] text-[#2F55D4] text-[14px] font-semibold"
          >
            Analytics Dashboard
          </button>
          <button type="button" title="Refresh" aria-label="Refresh Home page" onClick={() => refresh(visible.map((c) => c.id))}
            className="h-[34px] w-[34px] rounded flex items-center justify-center text-[#4B4F5C] hover:bg-white hover:text-[#4F55C9]">
            <RotateCw size={15} className={loadingIds.size ? 'animate-spin' : ''} />
          </button>
          <Dropdown align="right" width={240} trigger={(open) => (
            <button type="button" aria-label="Select Home page" title={view.name}
              className={`h-[34px] w-[180px] pl-3 pr-2 rounded-[4px] border bg-white flex items-center gap-1 text-[14px] text-[#1F2329] ${open ? 'border-[#4F55C9]' : 'border-[#D9DCE4] hover:border-[#B8BCC8]'}`}>
              <span className="flex-1 text-left truncate">{view.name}</span>
              <ChevronDown size={14} className="text-[#6B6F7B] shrink-0" />
            </button>
          )}>
            {(close) => (
              <>
                <div className="max-h-[260px] overflow-y-auto">
                  {views.map((v) => (
                    <button key={v.id} type="button" className={menuItem} onClick={() => { close(); layout.switchView(v.id); }}>
                      <span className={`flex-1 truncate ${v.id === view.id ? 'font-semibold text-[#4F55C9]' : ''}`}>{v.name}</span>
                      {v.id === view.id && <Check size={14} className="text-[#4F55C9]" />}
                    </button>
                  ))}
                </div>
                <MenuDivider />
                <button type="button" className={menuItem} onClick={() => { close(); setNewPageOpen(true); }}><Plus size={14} className="text-ink-500" /> New Home Page</button>
                <button type="button" className={menuItem} onClick={() => { close(); setManagePagesOpen(true); }}><Settings2 size={14} className="text-ink-500" /> Manage Home Pages</button>
              </>
            )}
          </Dropdown>
          <Dropdown align="right" width={190} trigger={(open) => (
            <button type="button" aria-label="Home page options" title="More"
              className={`h-[34px] w-[36px] rounded-[4px] border bg-white flex items-center justify-center text-[#1F2329] ${open ? 'border-[#4F55C9]' : 'border-[#D9DCE4] hover:border-[#B8BCC8]'}`}>
              <MoreHorizontal size={16} />
            </button>
          )}>
            {(close) => (
              <>
                <button type="button" className={menuItem} onClick={() => { close(); setEditor({ component: null }); }}>Add Component</button>
                <button type="button" className={menuItem} onClick={() => { close(); setReorderOpen(true); }}>Reorder</button>
                <button type="button" className={menuItem} onClick={() => { close(); toggleFullscreen(); }}>{fullscreen ? 'Exit Full Screen' : 'View in Full Screen'}</button>
              </>
            )}
          </Dropdown>
        </div>
      </div>

      {/* Zoho CRM End-to-End Business Workflow Pipeline */}
      <div className="mb-[12px] bg-white rounded-[6px] border border-[#D9DCE4] px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-[16px] font-bold text-[#1F2329]">
            Zoho CRM Live Business Workflow Pipeline
          </h2>
          <span className="text-[13px] text-[#64748B]">
            Click any stage to open its live records
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
          {[
            {
              step: '1. Lead Source',
              count: new Set((crm.leads || []).map((l) => l.source || l.leadSource).filter(Boolean)).size,
              unit: 'Sources',
              color: '#0EA5E9',
              onClick: () => navigate('/leads?view=Website'),
            },
            {
              step: '2. Lead Creation',
              count: (crm.leads || []).length,
              unit: 'Total Leads',
              color: '#2F55D4',
              onClick: () => navigate('/leads?view=All+Leads'),
            },
            {
              step: '3. Assignment',
              count: (crm.leads || []).filter((l) => l.status === 'Assigned' || l.ownerId).length,
              unit: 'Assigned',
              color: '#10B981',
              onClick: () => navigate('/leads?view=My+Leads'),
            },
            {
              step: '4. Call/Follow-up',
              count: (crm.tasks || []).filter((t) => t.status !== 'Completed').length,
              unit: 'Open Tasks',
              color: '#F59E0B',
              onClick: () => navigate('/workqueue'),
            },
            {
              step: '5. Qualification',
              count: (crm.leads || []).filter((l) => l.status === 'Qualified' || l.status === 'Contacted' || l.status === 'Followup').length,
              unit: 'Qualified',
              color: '#8B5CF6',
              onClick: () => navigate('/leads'),
            },
            {
              step: '6. Conversion',
              count: (crm.leads || []).filter((l) => l.status === 'Converted').length,
              unit: 'Converted',
              color: '#7C3AED',
              onClick: () => navigate('/leads'),
            },
            {
              step: '7. Deal Creation',
              count: (crm.deals || []).length,
              unit: 'Deals',
              color: '#2563EB',
              onClick: () => navigate('/deals'),
            },
            {
              step: '8. Approval',
              count: (crm.deals || []).filter((d) => d.approvalStatus === 'Pending' || d.stage === 'Negotiation' || d.stage === 'Proposal').length,
              unit: 'In Review',
              color: '#EC4899',
              onClick: () => navigate('/deal-approvals'),
            },
            {
              step: '9. Deal Status',
              count: (crm.deals || []).filter((d) => String(d.stage || '').includes('Won')).length,
              unit: 'Closed Won',
              color: '#059669',
              onClick: () => navigate('/deals'),
            },
            {
              step: '10. Reporting',
              count: 10,
              unit: 'Dashboards',
              color: '#1E293B',
              onClick: () => navigate('/dashboard'),
            },
          ].map((item) => (
            <button
              key={item.step}
              type="button"
              onClick={item.onClick}
              className="flex flex-col justify-between p-2.5 rounded border border-[#E2E8F0] hover:border-[#2F55D4] hover:bg-[#F8FAFF] text-left transition group"
            >
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-[12.5px] font-semibold text-[#334155] group-hover:text-[#2F55D4] truncate">
                  {item.step}
                </span>
              </div>
              <div className="mt-1 flex items-baseline justify-between gap-1">
                <span className="text-[15px] font-bold text-[#0F172A]">{item.count}</span>
                <span className="text-[12px] text-[#64748B] truncate">{item.unit}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* components */}
      {visible.length ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[14px]">
          {visible.map((c) => {
            const { rows, columns } = dataFor(c);
            return (
              <div key={c.id} className={`min-w-0 ${c.size === 'full' ? 'lg:col-span-2' : ''}`}>
                <HomeWidget
                  component={c}
                  allColumns={columns}
                  rows={rows}
                  ctx={crm}
                  loading={loadingIds.has(c.id)}
                  onRefresh={() => refresh([c.id])}
                  onUpdate={(patch) => layout.updateComponent(c.id, patch)}
                  onRemove={() => { layout.removeComponent(c.id); toast.success(`"${c.title}" removed`); }}
                  onEditComponent={c.builtIn ? undefined : () => setEditor({ component: c })}
                  onAddRecord={c.kind === 'custom' ? () => setEdit({ type: 'custom', record: {}, component: c }) : undefined}
                  onOpen={(row, colKey) => openRecord(c, row, colKey)}
                  rowActions={rowActions(c)}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-[6px] py-16 px-4 text-center">
          <p className="text-[16px] font-medium text-[#1F2329]">This Home page has no components to show.</p>
          <p className="text-[14px] text-ink-500 mt-1">Add a component, or show hidden ones from Reorder.</p>
          <div className="flex justify-center gap-2 mt-4">
            <button className="btn-primary h-9 text-[14px]" onClick={() => setEditor({ component: null })}><Plus size={15} /> Add Component</button>
            {view.components.length > 0 && <button className="btn-secondary h-9 text-[14px]" onClick={() => setReorderOpen(true)}>Reorder</button>}
          </div>
        </div>
      )}

      {/* dialogs */}
      <ComponentEditorModal open={!!editor} component={editor?.component || null} onClose={() => setEditor(null)} onSave={saveEditor} />
      <ReorderModal open={reorderOpen} onClose={() => setReorderOpen(false)} components={view.components}
        onSave={(list) => { layout.setComponents(list); setReorderOpen(false); toast.success('Home page layout saved'); }}
        onRestoreDefault={() => { layout.restoreDefaultComponents(); toast.success('Default layout restored'); }} />
      <NewHomePageModal open={newPageOpen} onClose={() => setNewPageOpen(false)} views={views}
        onCreate={(data) => { layout.createView(data); setNewPageOpen(false); toast.success(`Home page "${data.name}" created`); }} />
      <ManageHomePagesModal open={managePagesOpen} onClose={() => setManagePagesOpen(false)} views={views} activeId={view.id}
        onUpdate={(id, patch) => { layout.updateView(id, patch); toast.success('Home page updated'); }}
        onDelete={(id) => { layout.deleteView(id); toast.success('Home page deleted'); }}
        onSwitch={(id) => { layout.switchView(id); setManagePagesOpen(false); }} />
      {editConfig && (
        <FormModal open onClose={() => setEdit(null)} title={editConfig.title} fields={editConfig.fields} initial={editConfig.initial} size="lg"
          onSubmit={(v) => { editConfig.submit(v); setEdit(null); }} />
      )}
      <AddActivityModal lead={activityLead} users={crm.users} onClose={() => setActivityLead(null)}
        onCreateTask={(t) => { crm.createTask(t); setActivityLead(null); }}
        onCreateCall={(c) => { crm.createRecord('calls', c); toast.success('Call added'); setActivityLead(null); }} />
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} title={confirm?.title} message={confirm?.message}
        confirmLabel="Delete" onConfirm={() => confirm?.onConfirm()} />
    </div>
  );
}
