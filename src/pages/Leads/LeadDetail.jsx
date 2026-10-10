import { useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, Maximize2,
  PanelLeft, Clock3, Phone, MessageCircle, Filter, Paperclip,
  Upload, FileText, Download, Trash2, Plus, Check
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useToast } from '../../components/common/Toast';
import Modal from '../../components/common/Modal';
import { leadCategory, leadSource } from './leadFilters';

const TAG_BG = { 'Invalid Number': '#B88AD6', 'Not contactable': '#A34A5C', Junk: '#E8322B', 'Job seeking': '#2A2BD1' };
const LEAD_STAGES = ['Not Contacted', 'Attempted to Contact', 'Contacted', 'Contact in Future', 'Qualified', 'Converted'];
const dash = (v) => (v === undefined || v === null || v === '' ? '—' : v);
const maskMobile = (m) => { const d = String(m || '').replace(/\D/g, ''); return d ? `**********${d.slice(-3)}` : ''; };
const daysAgo = (iso) => { const t = Date.parse(iso); return Number.isNaN(t) ? '' : `${Math.max(0, Math.floor((Date.now() - t) / 86400000))} days ago`; };

const formatBytes = (bytes) => {
  if (!bytes || isNaN(bytes)) return '24 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

function Btn({ children, primary, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 px-3.5 rounded-md text-[13px] border transition ${
        primary
          ? 'bg-[#2F55D4] border-[#2F55D4] text-white hover:bg-[#2748B8] font-semibold'
          : 'bg-white border-[#D5DBE8] text-[#1F2A44] hover:bg-[#F3F6FB] font-medium'
      } ${className}`}
    >
      {children}
    </button>
  );
}

function Split({ children, onClick, primary = true }) {
  return (
    <div className="flex">
      <button
        type="button"
        onClick={onClick}
        className={`h-8 px-3.5 rounded-l-md text-[13px] border font-semibold ${
          primary ? 'bg-[#2F55D4] border-[#2F55D4] text-white' : 'bg-white border-[#D5DBE8] text-[#1F2A44]'
        }`}
      >
        {children}
      </button>
      <button
        type="button"
        className={`h-8 w-7 rounded-r-md border-l flex items-center justify-center ${
          primary ? 'bg-[#2F55D4] border-white/30 text-white' : 'bg-white border-[#D5DBE8] text-[#1F2A44]'
        }`}
      >
        <ChevronDown size={13} />
      </button>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="flex items-start gap-4 py-2 text-[13.5px]">
      <div className="w-[200px] shrink-0 text-right text-[#64748B] font-medium">{label}</div>
      <div className="flex-1 min-w-0 text-[#0F172A] font-medium break-words">{children}</div>
    </div>
  );
}

function Card({ id, title, action, children }) {
  return (
    <section id={id} className="bg-white border border-[#E3E8F2] rounded-lg mb-3.5 scroll-mt-2 shadow-sm">
      <div className="flex items-center justify-between px-4 h-11 border-b border-[#EEF1F7]">
        <h3 className="text-[14.5px] font-bold text-[#1F2A44]">{title}</h3>
        {action}
      </div>
      <div>{children}</div>
    </section>
  );
}

const Empty = ({ t = 'No records found' }) => (
  <div className="px-4 py-4 text-[13.5px] text-[#8B95AE]">{t}</div>
);

const Ghost = ({ children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="h-7 px-3 rounded-md border border-[#2F55D4] text-[#2F55D4] text-[12.5px] font-semibold hover:bg-[#EEF2FF] inline-flex items-center gap-1.5 transition"
  >
    {children}
  </button>
);

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { leads = [], userName, currentUser, convertLead, updateRecord, addRecord } = useCRM();

  const idx = leads.findIndex((l) => l.id === id);
  const lead = leads[idx];

  const [tab, setTab] = useState('Overview');
  const [timelineTab, setTimelineTab] = useState('History');
  const [showDetails, setShowDetails] = useState(true);
  const [actTab, setActTab] = useState('Tasks');
  const [mailTab, setMailTab] = useState('Mails');
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({ subject: '', dueDate: new Date().toISOString().slice(0, 10), priority: 'High' });

  const fileInputRef = useRef(null);

  const acts = lead?.activities || [];
  const calls = acts.filter((a) => /call/i.test(a.type));
  const tasks = acts.filter((a) => /task/i.test(a.type));
  const meetings = acts.filter((a) => /meeting|demo/i.test(a.type));
  const closed = acts.filter((a) => a.status === 'Completed');
  const open = acts.filter((a) => a.status !== 'Completed');
  const closedByTab = {
    Tasks: tasks.filter((a) => a.status === 'Completed'),
    Meetings: meetings.filter((a) => a.status === 'Completed'),
    Calls: calls.filter((a) => a.status === 'Completed'),
  };

  const history = useMemo(() => [...acts].reverse(), [acts]);

  if (!lead) {
    return (
      <div className="p-8 text-center text-[#6B7696] text-[14px]">
        Lead not found.{' '}
        <button className="text-[#2F55D4] underline font-semibold" onClick={() => navigate('/leads')}>
          Back to Leads
        </button>
      </div>
    );
  }

  const attachments = Array.isArray(lead.attachments) ? lead.attachments : [];

  const handleAttachFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newAtts = files.map((file) => ({
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: file.name,
      size: formatBytes(file.size),
      type: file.type || 'application/octet-stream',
      uploadedBy: currentUser?.name || userName(lead.ownerId),
      uploadedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      url: URL.createObjectURL(file),
    }));
    updateRecord('leads', lead.id, { attachments: [...attachments, ...newAtts] });
    toast.success(`${newAtts.length} attachment(s) added to ${lead.name}`);
    e.target.value = '';
  };

  const handleRemoveAttachment = (attId) => {
    updateRecord('leads', lead.id, { attachments: attachments.filter((a) => a.id !== attId) });
    toast.info('Attachment removed');
  };

  const handleAddActivity = (e) => {
    e.preventDefault();
    if (!taskForm.subject.trim()) return;
    const newAct = {
      type: 'Task',
      desc: taskForm.subject.trim(),
      by: currentUser?.name || userName(lead.ownerId),
      date: taskForm.dueDate,
      status: 'Open',
    };
    updateRecord('leads', lead.id, { activities: [...acts, newAct] });
    addRecord('tasks', {
      subject: taskForm.subject.trim(),
      dueDate: taskForm.dueDate,
      status: 'In Progress',
      priority: taskForm.priority,
      relatedTo: `${lead.name} (Lead)`,
      ownerId: lead.ownerId || 'u1',
    });
    setTaskModalOpen(false);
    setTaskForm({ subject: '', dueDate: new Date().toISOString().slice(0, 10), priority: 'High' });
    toast.success('Activity added and synced to Workqueue');
  };

  const go = (secId) => {
    setTab('Overview');
    setTimeout(() => document.getElementById(secId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
  };
  const prev = leads[idx - 1];
  const next = leads[idx + 1];

  const doConvert = () => {
    const res = convertLead(lead.id, {
      dealName: `${lead.company || lead.name} Deal`,
      amount: lead.value || 450000,
      stage: 'Qualification',
    });
    toast.success(`Converted ${lead.name} to Deal!`);
    if (res?.deal?.id) navigate('/deals');
  };

  const owner = userName(lead.ownerId);
  const created = lead.createdTime || lead.createdOn;
  const aging = daysAgo(lead.createdOn);

  const RELATED = [
    ['Open Activities', 'sec-open', open.length],
    ['Closed Activities', 'sec-closed', closed.length],
    ['Attachments', 'sec-attach', attachments.length],
    ['Emails', 'sec-emails', 0],
    ['Messages', 'sec-messages', 1],
    ['Zoho Survey', 'sec-survey', 0],
    ['ZohoSign Documents', 'sec-sign', 0],
  ];

  const currentStageIdx = LEAD_STAGES.indexOf(lead.status);

  return (
    <div className="-mx-3 sm:-mx-[18px] -mt-2.5 bg-[#F6F8FC] min-h-[calc(100vh-56px)]">
      {/* Hidden File Input for Attachments */}
      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleAttachFiles} />

      {/* Top Header */}
      <div className="bg-white flex items-center gap-3 px-5 py-3 border-b border-[#E3E8F2]">
        <button type="button" onClick={() => navigate('/leads')} aria-label="Back" className="p-1.5 rounded-full hover:bg-[#F3F6FB]">
          <ArrowLeft size={19} className="text-[#1F2A44]" />
        </button>
        <div>
          <div className="text-[18px] font-bold text-[#1F2A44] leading-tight flex items-center gap-2.5">
            <span>{lead.name}</span>
            {lead.company && <span className="text-[14px] font-medium text-[#64748B]">— {lead.company}</span>}
          </div>
          {lead.tag && lead.tag !== 'Lead' && (
            <span
              className="inline-flex items-center h-[19px] px-2.5 mt-1 text-[11.5px] font-semibold text-white"
              style={{
                background: TAG_BG[lead.tag] || '#A34A5C',
                clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%)',
                paddingRight: 10,
              }}
            >
              {lead.tag}
            </span>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Split onClick={() => toast.info(`Compose email to ${lead.email || lead.name}`)}>Send Email</Split>
          <Btn primary onClick={() => toast.info(`Calling ${maskMobile(lead.mobile || lead.phone)}…`)}>
            Call
          </Btn>
          <Btn onClick={doConvert}>Convert</Btn>
          <Btn onClick={() => navigate(`/leads/${lead.id}/edit`)}>Edit</Btn>
          <Split primary={false} onClick={() => toast.info('Opening WhatsApp…')}>
            Send WhatsApp
          </Split>
          <button
            type="button"
            disabled={!prev}
            onClick={() => prev && navigate(`/leads/${prev.id}`)}
            className="p-1.5 rounded hover:bg-[#F3F6FB] disabled:opacity-30"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            disabled={!next}
            onClick={() => next && navigate(`/leads/${next.id}`)}
            className="p-1.5 rounded hover:bg-[#F3F6FB] disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Stage / Status Blueprint Bar */}
      <div className="bg-white px-5 py-2.5 border-b border-[#E3E8F2] flex items-center gap-1.5 overflow-x-auto">
        {LEAD_STAGES.map((st, i) => {
          const isCurrent = lead.status === st;
          const isPassed = currentStageIdx > i;
          return (
            <button
              key={st}
              type="button"
              onClick={() => {
                updateRecord('leads', lead.id, { status: st });
                toast.success(`Lead status updated to "${st}"`);
              }}
              className={`px-3.5 py-1.5 rounded-md text-[12.5px] font-semibold transition flex items-center gap-1.5 shrink-0 ${
                isCurrent
                  ? 'bg-[#2F55D4] text-white shadow-sm'
                  : isPassed
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-[#F3F6FB] text-[#4B5578] hover:bg-[#E5EBF5]'
              }`}
            >
              {isPassed && <Check size={13} />}
              <span>{st}</span>
            </button>
          );
        })}
      </div>

      <div className="flex">
        {/* Left Related List */}
        <aside className="w-[215px] shrink-0 px-4 py-4 text-[13.5px] hidden md:block bg-white border-r border-[#E3E8F2] min-h-[calc(100vh-140px)]">
          <div className="font-bold text-[#1F2A44] mb-2.5 text-[14px]">Related List</div>
          <ul className="space-y-1.5">
            {RELATED.map(([t, sec, n]) => (
              <li key={t}>
                <button
                  type="button"
                  onClick={() => go(sec)}
                  className="w-full text-left py-1 px-2 rounded-md text-[#1F2A44] hover:bg-[#F3F6FB] hover:text-[#2F55D4] flex items-center justify-between font-medium"
                >
                  <span>{t}</span>
                  {n > 0 && (
                    <span className="text-[11.5px] bg-[#E8ECF5] text-[#1F2A44] font-semibold rounded-full px-2 py-0.5">
                      {n}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
          <div className="font-bold text-[#1F2A44] mt-6 mb-2.5 text-[14px]">Quick Actions</div>
          <ul className="space-y-1.5">
            {['WhatsApp to Phone', 'WhatsApp to Mobile'].map((t) => (
              <li key={t}>
                <button
                  type="button"
                  onClick={() => toast.info(`${t}…`)}
                  className="py-1 px-2 text-[#1F2A44] hover:text-[#2F55D4] flex items-center gap-2 font-medium"
                >
                  <MessageCircle size={14} className="text-[#2F55D4]" />
                  {t}
                </button>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-1 px-2 text-[#2F55D4] hover:underline flex items-center gap-2 font-semibold"
              >
                <Paperclip size={14} /> Attach Document
              </button>
            </li>
          </ul>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0 px-4 py-4">
          <div className="flex items-center gap-3 mb-3.5">
            <button
              type="button"
              className="h-8 w-8 rounded-full border border-[#D5DBE8] bg-white flex items-center justify-center"
            >
              <PanelLeft size={14} />
            </button>
            <div className="inline-flex rounded-full border border-[#D5DBE8] bg-white p-0.5 text-[13px]">
              {['Overview', 'Timeline'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`px-4 h-7 rounded-full ${
                    tab === t ? 'bg-[#EEF1F8] font-bold text-[#1F2A44] shadow-sm' : 'text-[#4B5578] font-medium'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <span className="ml-auto text-[12.5px] text-[#6B7696] inline-flex items-center gap-1.5">
              <Clock3 size={13} /> Last Update :{' '}
              {lead.updatedAt
                ? new Date(lead.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Just now'}
            </span>
          </div>

          {tab === 'Overview' && (
            <>
              {/* Summary Card */}
              <div className="bg-white border border-[#E3E8F2] rounded-lg px-5 py-3.5 mb-3.5 shadow-sm">
                <Field label="Mobile">{maskMobile(lead.mobile || lead.phone) || '—'}</Field>
                <Field label="Lead Status">{dash(lead.status)}</Field>
                <Field label="City">{dash(lead.city)}</Field>
                <Field label="Lead Aging">{dash(aging)}</Field>
                <Field label="Category">{dash(leadCategory(lead))}</Field>
              </div>

              {/* Full Details Card */}
              <div className="bg-white border border-[#E3E8F2] rounded-lg mb-3.5 shadow-sm">
                <button
                  type="button"
                  onClick={() => setShowDetails((s) => !s)}
                  className="w-full text-left px-5 h-11 text-[14px] font-bold text-[#1F2A44] border-b border-[#EEF1F7] flex items-center justify-between"
                >
                  <span>{showDetails ? 'Hide Details' : 'Show Details'}</span>
                  <ChevronDown size={16} className={`transition-transform ${showDetails ? '' : '-rotate-90'}`} />
                </button>
                {showDetails && (
                  <div className="px-5 py-4">
                    <h4 className="text-[14.5px] font-bold text-[#1F2A44] mb-2">Lead Information</h4>
                    <div className="grid md:grid-cols-2 gap-x-8">
                      <div>
                        <Field label="Lead No">{dash(lead.leadNo)}</Field>
                        <Field label="Lead Aging">{dash(aging)}</Field>
                        <Field label="Lead Assigned time">{dash(lead.assignedTime)}</Field>
                        <Field label="Lead CEO Approval">{dash(lead.ceoApproval)}</Field>
                        <Field label="Lead Owner">{dash(owner)}</Field>
                        <Field label="Allotted Lead Manager">
                          {lead.allottedManagerId ? userName(lead.allottedManagerId) : '—'}
                        </Field>
                        <Field label="Client Name">{dash(lead.clientName)}</Field>
                        <Field label="Justdial Id">{dash(lead.justdialId)}</Field>
                        <Field label="Workflow Checkbox">{dash(lead.workflowCheckbox)}</Field>
                        <Field label="Lead Activity Aging">{dash(aging)}</Field>
                        <Field label="Lead Manager 1">
                          {lead.ownerId ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-[#F7D44C] text-[12px] font-semibold">
                              {owner.split(' ')[0]}
                            </span>
                          ) : (
                            '—'
                          )}
                        </Field>
                        <Field label="Direct call Duration">{dash(lead.directCallDuration)}</Field>
                        <Field label="Whatsapp call duration">{dash(lead.whatsappCallDuration)}</Field>
                        <Field label="Lead Name">{dash(lead.name)}</Field>
                        <Field label="Mobile">{maskMobile(lead.mobile || lead.phone) || '—'}</Field>
                        <Field label="Reopen Lead">{dash(lead.reopenLead)}</Field>
                        <Field label="Company">{dash(lead.company)}</Field>
                        <Field label="Lead Source">
                          {leadSource(lead) ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-[#4AA8F0] text-white text-[12px] font-semibold">
                              {leadSource(lead)}
                            </span>
                          ) : (
                            '—'
                          )}
                        </Field>
                        <Field label="Product Name">{dash(lead.productName)}</Field>
                        <Field label="Created By">
                          <div>Administration Team</div>
                          <div className="text-[12px] text-[#6B7696]">{dash(created)}</div>
                        </Field>
                        <Field label="Remarks">{dash(lead.remarks)}</Field>
                        <Field label="Call Attempt Count">{dash(lead.callAttemptCount)}</Field>
                        <Field label="Total call count">{dash(calls.length || lead.totalCallCount)}</Field>
                        <Field label="Total Call Durations">{dash(lead.totalCallDurations ?? 0)}</Field>
                      </div>
                      <div>
                        <Field label="Comments">{dash(lead.comments)}</Field>
                        <Field label="Status">
                          {lead.readStatus ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-[#1DB54A] text-white text-[12px] font-semibold">
                              {lead.readStatus}
                            </span>
                          ) : (
                            '—'
                          )}
                        </Field>
                        <Field label="Lead Push Time">{dash(lead.pushTime || lead.createdOn)}</Field>
                        <Field label="Date">{dash(lead.createdOn)}</Field>
                        <Field label="Dashboard Req">{lead.dashboardReq ? '✓' : '—'}</Field>
                        <Field label="Phone">{dash(lead.phoneAlt)}</Field>
                        <Field label="Email">
                          {lead.email ? (
                            <a className="text-[#2F55D4] hover:underline" href={`mailto:${lead.email}`}>
                              {lead.email}
                            </a>
                          ) : (
                            '—'
                          )}
                        </Field>
                        <Field label="Lead Status">{dash(lead.status)}</Field>
                        <Field label="Category">{dash(leadCategory(lead))}</Field>
                        <Field label="Working hours">{dash(lead.workingHours)}</Field>
                        <Field label="Call Start Time">{dash(lead.callStartTime)}</Field>
                        <Field label="Website Source">{dash(lead.websiteSource)}</Field>
                        <Field label="Call Delay">{dash(lead.callDelay)}</Field>
                        <Field label="Checkbox 1">{dash(lead.checkbox1)}</Field>
                        <Field label="Tag Field">{dash(lead.tag !== 'Lead' ? lead.tag : '')}</Field>
                        <Field label="Source Lang">{dash(lead.sourceLang)}</Field>
                        <Field label="Target Lang">{dash(lead.targetLang)}</Field>
                        <Field label="Performance">{dash(lead.performance)}</Field>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-5 mb-2 pt-4 border-t border-[#EEF1F7]">
                      <h4 className="text-[14.5px] font-bold text-[#1F2A44]">Address Information</h4>
                      <button
                        type="button"
                        className="h-7 px-3 rounded border border-[#D5DBE8] text-[12.5px] font-medium hover:bg-[#F3F6FB]"
                      >
                        Locate Map
                      </button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-x-8">
                      <div>
                        <Field label="Street">{dash(lead.street || lead.address)}</Field>
                        <Field label="State">{dash(lead.state)}</Field>
                        <Field label="Country">{lead.country || 'India'}</Field>
                      </div>
                      <div>
                        <Field label="City">{dash(lead.city)}</Field>
                        <Field label="Zip Code">{dash(lead.zip ?? 0)}</Field>
                        <Field label="Branch Area">{dash(lead.branchArea)}</Field>
                      </div>
                    </div>

                    <h4 className="text-[14.5px] font-bold text-[#1F2A44] mt-5 pt-4 border-t border-[#EEF1F7] mb-2">
                      Description Information
                    </h4>
                    <Field label="Description">{dash(lead.description)}</Field>
                  </div>
                )}
              </div>

              {/* Open Activities */}
              <Card
                id="sec-open"
                title={`Open Activities (${open.length})`}
                action={
                  <Ghost onClick={() => setTaskModalOpen(true)}>
                    <Plus size={13} /> Add New
                  </Ghost>
                }
              >
                {open.length === 0 ? (
                  <Empty />
                ) : (
                  open.map((a, i) => (
                    <div
                      key={i}
                      className="px-4 py-2.5 text-[13.5px] border-t border-[#EEF1F7] first:border-0 flex items-center justify-between"
                    >
                      <div>
                        <b>{a.type}</b> — {a.desc}{' '}
                        <span className="text-[#8B95AE]">
                          ({a.by}, {a.date})
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </Card>

              {/* Closed Activities */}
              <Card
                id="sec-closed"
                title="Closed Activities"
                action={
                  <span className="text-[12.5px] text-[#4B5578] inline-flex items-center gap-2">
                    Tab View <ChevronDown size={12} />
                    <Maximize2 size={13} />
                  </span>
                }
              >
                <div className="flex gap-6 px-4 text-[13.5px] border-b border-[#EEF1F7]">
                  {['Tasks', 'Meetings', 'Calls'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setActTab(t)}
                      className={`h-10 ${
                        actTab === t
                          ? 'font-bold border-b-2 border-[#2F55D4] text-[#1F2A44]'
                          : 'text-[#4B5578] font-medium'
                      }`}
                    >
                      {t}{' '}
                      <span className="text-[11.5px] bg-[#E8ECF5] rounded-full px-2 py-0.5 ml-1">
                        {closedByTab[t].length}
                      </span>
                    </button>
                  ))}
                </div>
                {closedByTab[actTab].length === 0 ? (
                  <Empty />
                ) : (
                  closedByTab[actTab].map((a, i) => (
                    <div key={i} className="px-4 py-2.5 text-[13.5px] border-b border-[#EEF1F7]">
                      {a.desc}{' '}
                      <span className="text-[#8B95AE]">
                        — {a.by}, {a.date}
                      </span>
                    </div>
                  ))
                )}
              </Card>

              {/* Real Interactive Attachments Section */}
              <Card
                id="sec-attach"
                title={`Attachments (${attachments.length})`}
                action={
                  <Ghost onClick={() => fileInputRef.current?.click()}>
                    <Paperclip size={13} /> Attach
                  </Ghost>
                }
              >
                {attachments.length === 0 ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="m-4 border-2 border-dashed border-[#D5DBE8] hover:border-[#2F55D4] rounded-lg p-5 text-center cursor-pointer bg-[#F9FAFD] hover:bg-[#EEF2FF]/40 transition"
                  >
                    <Upload size={20} className="mx-auto text-[#2F55D4] mb-1" />
                    <div className="text-[13.5px] font-semibold text-[#1F2A44]">
                      Click to attach files to this Lead
                    </div>
                    <div className="text-[12px] text-[#6B7696]">
                      Upload quotations, KYC documents, or requirement sheets
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-[13.5px]">
                      <thead>
                        <tr className="text-left text-[#64748B] border-b border-[#EEF1F7] bg-[#F8FAFC]">
                          <th className="px-4 py-2.5 font-semibold">File Name</th>
                          <th className="px-4 py-2.5 font-semibold">Attached By</th>
                          <th className="px-4 py-2.5 font-semibold">Date Added</th>
                          <th className="px-4 py-2.5 font-semibold">Size</th>
                          <th className="px-4 py-2.5 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EEF1F7]">
                        {attachments.map((att) => (
                          <tr key={att.id} className="hover:bg-[#F8FAFC]">
                            <td className="px-4 py-2.5 font-semibold text-[#2F55D4]">
                              <a
                                href={att.url || '#'}
                                download={att.name}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 hover:underline"
                              >
                                <FileText size={15} />
                                <span>{att.name}</span>
                              </a>
                            </td>
                            <td className="px-4 py-2.5 text-[#1F2A44]">{att.uploadedBy || owner}</td>
                            <td className="px-4 py-2.5 text-[#64748B]">{att.uploadedAt || 'Today'}</td>
                            <td className="px-4 py-2.5 text-[#64748B]">{att.size}</td>
                            <td className="px-4 py-2.5 text-right">
                              <div className="inline-flex items-center gap-2">
                                {att.url && (
                                  <a
                                    href={att.url}
                                    download={att.name}
                                    className="p-1 text-[#64748B] hover:text-[#2F55D4]"
                                    title="Download"
                                  >
                                    <Download size={15} />
                                  </a>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAttachment(att.id)}
                                  className="p-1 text-[#64748B] hover:text-rose-600"
                                  title="Delete"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              {/* Emails */}
              <Card id="sec-emails" title="Emails" action={<Ghost>Compose Email</Ghost>}>
                <div className="flex gap-6 px-4 text-[13.5px] border-b border-[#EEF1F7]">
                  {['Mails', 'Drafts', 'Scheduled'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setMailTab(t)}
                      className={`h-10 ${
                        mailTab === t ? 'font-bold border-b-2 border-[#2F55D4]' : 'text-[#4B5578] font-medium'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <Empty />
              </Card>

              {/* Messages */}
              <Card id="sec-messages" title="Messages">
                <table className="w-full text-[13.5px]">
                  <thead>
                    <tr className="text-left text-[#1F2A44] border-b border-[#EEF1F7]">
                      <th className="px-4 h-9 w-10" />
                      <th className="h-9 font-semibold">Messages</th>
                      <th className="h-9 font-semibold w-40">Date</th>
                      <th className="h-9 font-semibold w-44">Messaged Via</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-4 py-2.5 text-[#6B7696]">↩</td>
                      <td className="py-2.5 pr-4 truncate max-w-[640px]">
                        Hi {lead.firstName || lead.name}, Welcome! Our Sales Representative will contact you shortly…
                      </td>
                      <td className="py-2.5">{lead.createdTime || lead.createdOn || ''}</td>
                      <td className="py-2.5">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-5 w-5 rounded bg-[#1DB54A] inline-flex items-center justify-center">
                            <Phone size={11} className="text-white" />
                          </span>
                          WhatsApp
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Card>

              <Card id="sec-survey" title="Zoho Survey">
                <div className="px-4 py-3 text-[13.5px] text-[#8B95AE] flex items-center gap-2">
                  No records found <Ghost>Create Survey</Ghost>
                  <Ghost>Send Survey</Ghost>
                </div>
              </Card>
              <Card
                id="sec-sign"
                title="ZohoSign Documents"
                action={
                  <span className="flex gap-2">
                    <Ghost>Assign</Ghost>
                    <Ghost>New</Ghost>
                  </span>
                }
              >
                <Empty />
              </Card>
            </>
          )}

          {tab === 'Timeline' && (
            <div className="bg-white border border-[#E3E8F2] rounded-lg shadow-sm">
              <div className="flex gap-6 px-4 text-[13.5px] border-b border-[#EEF1F7]">
                {['History', 'Interactions'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTimelineTab(t)}
                    className={`h-10 ${
                      timelineTab === t
                        ? 'font-bold border-b-2 border-[#1F2A44] text-[#1F2A44]'
                        : 'text-[#4B5578] font-medium'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {timelineTab === 'History' ? (
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between mb-3 text-[13.5px]">
                    <span className="font-bold inline-flex items-center gap-2">
                      Timeline History <Filter size={13} className="text-[#4B5578]" />
                    </span>
                    <span className="text-[#2F55D4] font-medium">Show Upcoming Automated Actions</span>
                  </div>
                  {history.length === 0 && <Empty />}
                  {history.map((a, i) => (
                    <div key={i} className="flex gap-3 py-2.5 text-[13.5px]">
                      <div className="w-[100px] shrink-0 text-[#6B7696]">{a.date}</div>
                      <div className="h-2.5 w-2.5 rounded-full bg-[#2F55D4] mt-1.5" />
                      <div>
                        <b>{a.type}</b> — {a.desc}
                        <div className="text-[12px] text-[#8B95AE]">by {a.by}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-5 py-4">
                  <div className="font-bold text-[13.5px] mb-3">Customer Interactions</div>
                  {calls.length === 0 && <Empty t="No interactions yet" />}
                  {calls.map((a, i) => (
                    <div
                      key={i}
                      className="mb-3 max-w-[440px] rounded-lg border border-[#BFD0F5] bg-[#EEF3FF] px-3.5 py-2.5 text-[13.5px]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded-full bg-[#2F55D4] inline-flex items-center justify-center">
                          <Phone size={11} className="text-white" />
                        </span>
                        <span>{a.desc}</span>
                      </div>
                      <div className="text-[12px] text-[#6B7696] mt-1">
                        by {a.by} on {a.date}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Open Activity Modal */}
      <Modal
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        title="Add Follow-up Activity"
        subtitle={`Create an open activity for ${lead.name}`}
        size="sm"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setTaskModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="add-lead-task-form" className="btn-primary">
              Save Activity
            </button>
          </>
        }
      >
        <form id="add-lead-task-form" onSubmit={handleAddActivity} className="space-y-3.5">
          <div>
            <label className="label">Subject *</label>
            <input
              required
              className="input text-[13.5px]"
              placeholder="e.g. Follow-up call regarding quotation"
              value={taskForm.subject}
              onChange={(e) => setTaskForm({ ...taskForm, subject: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Due Date</label>
            <input
              type="date"
              className="input text-[13.5px]"
              value={taskForm.dueDate}
              onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Priority</label>
            <select
              className="input text-[13.5px]"
              value={taskForm.priority}
              onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
            >
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}
