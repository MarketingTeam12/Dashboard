import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, Maximize2, PanelLeft, Clock3, Phone, MessageCircle, Filter } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useToast } from '../../components/common/Toast';
import Modal from '../../components/common/Modal';
import { leadCategory, leadSource } from './leadFilters';

const TAG_BG = { 'Invalid Number': '#B88AD6', 'Not contactable': '#A34A5C', Junk: '#E8322B', 'Job seeking': '#2A2BD1' };
const dash = (v) => (v === undefined || v === null || v === '' ? '—' : v);
const maskMobile = (m) => { const d = String(m || '').replace(/\D/g, ''); return d ? `**********${d.slice(-3)}` : ''; };
const daysAgo = (iso) => { const t = Date.parse(iso); return Number.isNaN(t) ? '' : `${Math.max(0, Math.floor((Date.now() - t) / 86400000))} days ago`; };

function Btn({ children, primary, onClick, className = '' }) {
  return (
    <button type="button" onClick={onClick}
      className={`h-7 px-3 rounded text-[12px] border ${primary ? 'bg-[#2F55D4] border-[#2F55D4] text-white hover:bg-[#2748B8] font-medium' : 'bg-white border-[#D5DBE8] text-[#1F2A44] hover:bg-[#F3F6FB]'} ${className}`}>
      {children}
    </button>
  );
}
function Split({ children, onClick, primary = true }) {
  return (
    <div className="flex">
      <button type="button" onClick={onClick} className={`h-7 px-3 rounded-l text-[12px] border font-medium ${primary ? 'bg-[#2F55D4] border-[#2F55D4] text-white' : 'bg-white border-[#D5DBE8]'}`}>{children}</button>
      <button type="button" className={`h-7 w-6 rounded-r border-l flex items-center justify-center ${primary ? 'bg-[#2F55D4] border-white/30 text-white' : 'bg-white border-[#D5DBE8]'}`}><ChevronDown size={12} /></button>
    </div>
  );
}
function Field({ label, children }) {
  return (
    <div className="flex items-start gap-4 py-[7px] text-[12.5px]">
      <div className="w-[190px] shrink-0 text-right text-[#6B7696]">{label}</div>
      <div className="flex-1 min-w-0 text-[#1F2A44] break-words">{children}</div>
    </div>
  );
}
function Card({ id, title, action, children }) {
  return (
    <section id={id} className="bg-white border border-[#E3E8F2] rounded mb-3 scroll-mt-2">
      <div className="flex items-center justify-between px-4 h-10 border-b border-[#EEF1F7]">
        <h3 className="text-[13px] font-semibold text-[#1F2A44]">{title}</h3>
        {action}
      </div>
      <div>{children}</div>
    </section>
  );
}
const Empty = ({ t = 'No records found' }) => <div className="px-4 py-3 text-[12.5px] text-[#8B95AE]">{t}</div>;
const Ghost = ({ children, onClick }) => (
  <button type="button" onClick={onClick} className="h-6 px-2.5 rounded border border-[#2F55D4] text-[#2F55D4] text-[11.5px] hover:bg-[#EEF2FF] inline-flex items-center gap-1">{children}</button>
);

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { leads = [], userName, convertLead, updateRecord } = useCRM();

  const idx = leads.findIndex((l) => l.id === id);
  const lead = leads[idx];

  const [tab, setTab] = useState('Overview');
  const [timelineTab, setTimelineTab] = useState('History');
  const [showDetails, setShowDetails] = useState(true);
  const [actTab, setActTab] = useState('Tasks');
  const [mailTab, setMailTab] = useState('Mails');
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({});

  const acts = lead?.activities || [];
  const calls = acts.filter((a) => /call/i.test(a.type));
  const tasks = acts.filter((a) => /task/i.test(a.type));
  const meetings = acts.filter((a) => /meeting|demo/i.test(a.type));
  const closed = acts.filter((a) => a.status === 'Completed');
  const open = acts.filter((a) => a.status !== 'Completed');
  const closedByTab = { Tasks: tasks.filter((a) => a.status === 'Completed'), Meetings: meetings.filter((a) => a.status === 'Completed'), Calls: calls.filter((a) => a.status === 'Completed') };

  const history = useMemo(() => [...acts].reverse(), [acts]);

  if (!lead) {
    return (
      <div className="p-8 text-center text-[#6B7696]">
        Lead not found. <button className="text-[#2F55D4] underline" onClick={() => navigate('/leads')}>Back to Leads</button>
      </div>
    );
  }

  const go = (secId) => { setTab('Overview'); setTimeout(() => document.getElementById(secId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30); };
  const prev = leads[idx - 1]; const next = leads[idx + 1];
  const openEdit = () => { setForm({ name: lead.name || '', mobile: lead.mobile || lead.phone || '', email: lead.email || '', city: lead.city || '', remarks: lead.remarks || '', status: lead.status || '', tag: lead.tag || '' }); setEditOpen(true); };
  const saveEdit = () => { updateRecord('leads', lead.id, { ...form, phone: form.mobile }); setEditOpen(false); toast.success('Lead updated'); };
  const doConvert = () => {
    convertLead(lead.id, { dealName: `${lead.company || lead.name} Deal`, amount: 450000, stage: 'Qualification' });
  };
  const owner = userName(lead.ownerId);
  const created = lead.createdTime || lead.createdOn;
  const aging = daysAgo(lead.createdOn);

  const RELATED = [
    ['Open Activities', 'sec-open', open.length], ['Closed Activities', 'sec-closed', closed.length],
    ['Emails', 'sec-emails'], ['Attachments', 'sec-attach'], ['Zoho Survey', 'sec-survey'], ['ZohoSign Documents', 'sec-sign'], ['Messages', 'sec-messages', 1],
  ];

  return (
    <div className="-mx-3 sm:-mx-[18px] -mt-2.5 bg-[#F6F8FC] min-h-[calc(100vh-56px)]">
      {/* ---- header ---- */}
      <div className="bg-white flex items-center gap-3 px-4 py-2.5 border-b border-[#E3E8F2]">
        <button type="button" onClick={() => navigate('/leads')} aria-label="Back"><ArrowLeft size={18} className="text-[#1F2A44]" /></button>
        <div>
          <div className="text-[17px] font-semibold text-[#1F2A44] leading-tight">{lead.name}</div>
          {lead.tag && lead.tag !== 'Lead' && (
            <span className="inline-flex items-center h-[17px] px-2 mt-0.5 text-[10.5px] font-semibold text-white" style={{ background: TAG_BG[lead.tag] || '#A34A5C', clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%)', paddingRight: 10 }}>{lead.tag}</span>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Split onClick={() => toast.info(`Compose email to ${lead.email || lead.name}`)}>Send Email</Split>
          <Btn primary onClick={() => toast.info(`Calling ${maskMobile(lead.mobile || lead.phone)}…`)}>Call</Btn>
          <Btn onClick={doConvert}>Convert</Btn>
          <Btn onClick={openEdit}>Edit</Btn>
          <Split primary={false} onClick={() => toast.info('Opening WhatsApp…')}>Send WhatsApp</Split>
          <Btn className="!px-2.5">•••</Btn>
          <button type="button" disabled={!prev} onClick={() => prev && navigate(`/leads/${prev.id}`)} className="disabled:opacity-30"><ChevronLeft size={18} /></button>
          <button type="button" disabled={!next} onClick={() => next && navigate(`/leads/${next.id}`)} className="disabled:opacity-30"><ChevronRight size={18} /></button>
        </div>
      </div>

      <div className="flex">
        {/* ---- left related list ---- */}
        <aside className="w-[190px] shrink-0 px-4 py-4 text-[12.5px] hidden md:block">
          <div className="font-semibold text-[#1F2A44] mb-2">Related List</div>
          <ul className="space-y-[7px]">
            {RELATED.map(([t, sec, n]) => (
              <li key={t}>
                <button type="button" onClick={() => go(sec)} className="text-[#1F2A44] hover:text-[#2F55D4] flex items-center gap-1.5">
                  {t} {n ? <span className="text-[10.5px] bg-[#E8ECF5] rounded-full px-1.5">{n}</span> : null}
                </button>
              </li>
            ))}
            <li><button type="button" className="text-[#2F55D4] hover:underline">Add Related List</button></li>
          </ul>
          <div className="font-semibold text-[#1F2A44] mt-6 mb-2">Links</div>
          <ul className="space-y-[7px]">
            {['WhatsApp to Phone', 'WhatsApp to Mobile'].map((t) => (
              <li key={t}><button type="button" onClick={() => toast.info(`${t}…`)} className="text-[#1F2A44] hover:text-[#2F55D4] flex items-center gap-1.5"><MessageCircle size={13} className="text-[#2F55D4]" />{t}</button></li>
            ))}
            <li><button type="button" className="text-[#2F55D4] hover:underline">Add Link</button></li>
          </ul>
        </aside>

        {/* ---- main ---- */}
        <div className="flex-1 min-w-0 px-3 py-3">
          <div className="flex items-center gap-3 mb-3">
            <button type="button" className="h-8 w-8 rounded-full border border-[#D5DBE8] bg-white flex items-center justify-center"><PanelLeft size={14} /></button>
            <div className="inline-flex rounded-full border border-[#D5DBE8] bg-white p-0.5 text-[12.5px]">
              {['Overview', 'Timeline'].map((t) => (
                <button key={t} type="button" onClick={() => setTab(t)} className={`px-4 h-7 rounded-full ${tab === t ? 'bg-[#EEF1F8] font-semibold shadow-sm' : 'text-[#4B5578]'}`}>{t}</button>
              ))}
            </div>
            <span className="ml-auto text-[11.5px] text-[#6B7696] inline-flex items-center gap-1"><Clock3 size={12} /> Last Update : {lead.updatedAt ? new Date(lead.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'a while ago'}</span>
          </div>

          {tab === 'Overview' && (
            <>
              <div className="bg-white border border-[#E3E8F2] rounded px-4 py-3 mb-3">
                <Field label="Mobile">{maskMobile(lead.mobile || lead.phone) || '—'}</Field>
                <Field label="Lead Status">{dash(lead.status)}</Field>
                <Field label="City">{dash(lead.city)}</Field>
                <Field label="Lead Aging">{dash(aging)}</Field>
                <Field label="Category">{dash(leadCategory(lead))}</Field>
              </div>

              <div className="bg-white border border-[#E3E8F2] rounded mb-3">
                <button type="button" onClick={() => setShowDetails((s) => !s)} className="w-full text-left px-4 h-10 text-[13px] font-semibold text-[#1F2A44] border-b border-[#EEF1F7]">{showDetails ? 'Hide Details' : 'Show Details'}</button>
                {showDetails && (
                  <div className="px-4 py-3">
                    <h4 className="text-[12.5px] font-semibold text-[#1F2A44] mb-1">Lead Information</h4>
                    <div className="grid md:grid-cols-2 gap-x-6">
                      <div>
                        <Field label="Lead No">{dash(lead.leadNo)}</Field>
                        <Field label="Lead Aging">{dash(aging)}</Field>
                        <Field label="Lead Assigned time">{dash(lead.assignedTime)}</Field>
                        <Field label="Lead CEO Approval">{dash(lead.ceoApproval)}</Field>
                        <Field label="Lead Owner">{dash(owner)}</Field>
                        <Field label="Allotted Lead Manager">{lead.allottedManagerId ? userName(lead.allottedManagerId) : '—'}</Field>
                        <Field label="Client Name">{dash(lead.clientName)}</Field>
                        <Field label="Justdial Id">{dash(lead.justdialId)}</Field>
                        <Field label="Workflow Checkbox">{dash(lead.workflowCheckbox)}</Field>
                        <Field label="Lead Activity Aging">{dash(aging)}</Field>
                        <Field label="Lead Manager 1">{lead.ownerId ? <span className="px-2 py-0.5 rounded-full bg-[#F7D44C] text-[11px] font-semibold">{owner.split(' ')[0]}</span> : '—'}</Field>
                        <Field label="Direct call Duration">{dash(lead.directCallDuration)}</Field>
                        <Field label="Whatsapp call duration">{dash(lead.whatsappCallDuration)}</Field>
                        <Field label="Lead Name">{dash(lead.name)}</Field>
                        <Field label="Mobile">{maskMobile(lead.mobile || lead.phone) || '—'}</Field>
                        <Field label="Reopen Lead">{dash(lead.reopenLead)}</Field>
                        <Field label="Company">{dash(lead.company)}</Field>
                        <Field label="Lead Source">{leadSource(lead) ? <span className="px-2 py-0.5 rounded-full bg-[#4AA8F0] text-white text-[11px] font-semibold">{leadSource(lead)}</span> : '—'}</Field>
                        <Field label="Product Name">{dash(lead.productName)}</Field>
                        <Field label="Created By"><div>Administration Team</div><div className="text-[11.5px] text-[#6B7696]">{dash(created)}</div></Field>
                        <Field label="Remarks">{dash(lead.remarks)}</Field>
                        <Field label="Call Attempt Count">{dash(lead.callAttemptCount)}</Field>
                        <Field label="Total call count">{dash(calls.length || lead.totalCallCount)}</Field>
                        <Field label="Total Call Durations">{dash(lead.totalCallDurations ?? 0)}</Field>
                      </div>
                      <div>
                        <Field label="Comments">{dash(lead.comments)}</Field>
                        <Field label="Status">{lead.readStatus ? <span className="px-2 py-0.5 rounded-full bg-[#1DB54A] text-white text-[11px] font-semibold">{lead.readStatus}</span> : '—'}</Field>
                        <Field label="Lead Push Time">{dash(lead.pushTime || lead.createdOn)}</Field>
                        <Field label="Date">{dash(lead.createdOn)}</Field>
                        <Field label="Dashboard Req">{lead.dashboardReq ? '✓' : '—'}</Field>
                        <Field label="Phone">{dash(lead.phoneAlt)}</Field>
                        <Field label="Email">{lead.email ? <a className="text-[#2F55D4]" href={`mailto:${lead.email}`}>{lead.email}</a> : '—'}</Field>
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

                    <div className="flex items-center justify-between mt-4 mb-1">
                      <h4 className="text-[12.5px] font-semibold text-[#1F2A44]">Address Information</h4>
                      <button type="button" className="h-7 px-3 rounded border border-[#D5DBE8] text-[12px] hover:bg-[#F3F6FB]">Locate Map</button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-x-6">
                      <div><Field label="Street">{dash(lead.street || lead.address)}</Field><Field label="State">{dash(lead.state)}</Field><Field label="Country">{lead.country || 'India'}</Field></div>
                      <div><Field label="City">{dash(lead.city)}</Field><Field label="Zip Code">{dash(lead.zip ?? 0)}</Field><Field label="Branch Area">{dash(lead.branchArea)}</Field></div>
                    </div>

                    <h4 className="text-[12.5px] font-semibold text-[#1F2A44] mt-4 mb-1">Description Information</h4>
                    <Field label="Description">{dash(lead.description)}</Field>

                    <h4 className="text-[12.5px] font-semibold text-[#1F2A44] mt-4 mb-1">Visit Summary</h4>
                    <div className="grid md:grid-cols-2 gap-x-6">
                      <div><Field label="Most Recent Visit">—</Field><Field label="Average Time Spent (Minutes)">—</Field><Field label="Referrer">—</Field><Field label="First Visit">—</Field></div>
                      <div><Field label="First Page Visited">—</Field><Field label="Number Of Chats">—</Field><Field label="Visitor Score">—</Field><Field label="Days Visited">—</Field></div>
                    </div>
                  </div>
                )}
              </div>

              <Card id="sec-open" title="Open Activities" action={<Ghost>Add New <ChevronDown size={11} /></Ghost>}>
                {open.length === 0 ? <Empty /> : open.map((a, i) => (
                  <div key={i} className="px-4 py-2 text-[12.5px] border-t border-[#EEF1F7] first:border-0"><b>{a.type}</b> — {a.desc} <span className="text-[#8B95AE]">({a.by}, {a.date})</span></div>
                ))}
              </Card>

              <Card id="sec-closed" title="Closed Activities" action={<span className="text-[11.5px] text-[#4B5578] inline-flex items-center gap-2">Tab View <ChevronDown size={11} /><Maximize2 size={12} /></span>}>
                <div className="flex gap-5 px-4 text-[12.5px] border-b border-[#EEF1F7]">
                  {['Tasks', 'Meetings', 'Calls'].map((t) => (
                    <button key={t} type="button" onClick={() => setActTab(t)} className={`h-9 ${actTab === t ? 'font-semibold border-b-2 border-[#2F55D4] text-[#1F2A44]' : 'text-[#4B5578]'}`}>
                      {t} <span className="text-[10.5px] bg-[#E8ECF5] rounded-full px-1.5">{closedByTab[t].length}</span>
                    </button>
                  ))}
                </div>
                {closedByTab[actTab].length === 0 ? <Empty /> : closedByTab[actTab].map((a, i) => (
                  <div key={i} className="px-4 py-2 text-[12.5px] border-b border-[#EEF1F7]">{a.desc} <span className="text-[#8B95AE]">— {a.by}, {a.date}</span></div>
                ))}
              </Card>

              <Card id="sec-emails" title="Emails" action={<Ghost>Compose Email</Ghost>}>
                <div className="flex gap-5 px-4 text-[12.5px] border-b border-[#EEF1F7]">
                  {['Mails', 'Drafts', 'Scheduled'].map((t) => (
                    <button key={t} type="button" onClick={() => setMailTab(t)} className={`h-9 ${mailTab === t ? 'font-semibold border-b-2 border-[#2F55D4]' : 'text-[#4B5578]'}`}>{t}</button>
                  ))}
                </div>
                <div className="text-center py-3 text-[12.5px] text-[#8B95AE]">No records found</div>
              </Card>

              <Card id="sec-attach" title="Attachments" action={<Ghost>Attach <ChevronDown size={11} /></Ghost>}><Empty t="No Attachment" /></Card>
              <Card id="sec-survey" title="Zoho Survey"><div className="px-4 py-3 text-[12.5px] text-[#8B95AE] flex items-center gap-2">No records found <Ghost>Create Survey</Ghost><Ghost>Send Survey</Ghost><Ghost>Take Survey</Ghost></div></Card>
              <Card id="sec-sign" title="ZohoSign Documents" action={<span className="flex gap-2"><Ghost>Assign</Ghost><Ghost>New</Ghost></span>}><Empty /></Card>

              <Card id="sec-messages" title="Messages">
                <table className="w-full text-[12.5px]">
                  <thead><tr className="text-left text-[#1F2A44] border-b border-[#EEF1F7]"><th className="px-4 h-8 w-10" /><th className="h-8 font-medium">Messages</th><th className="h-8 font-medium w-32">Date</th><th className="h-8 font-medium w-40">Messaged Via</th></tr></thead>
                  <tbody>
                    <tr>
                      <td className="px-4 py-2 text-[#6B7696]">↩</td>
                      <td className="py-2 pr-4 truncate max-w-[640px]">Hi {lead.firstName || lead.name}, Welcome! Our Sales Representative will contact you shortly…</td>
                      <td className="py-2">{lead.createdTime || ''}</td>
                      <td className="py-2"><span className="inline-flex items-center gap-1.5"><span className="h-5 w-5 rounded bg-[#1DB54A] inline-flex items-center justify-center"><Phone size={11} className="text-white" /></span>WhatsApp</span></td>
                    </tr>
                  </tbody>
                </table>
              </Card>

              <div className="flex items-center justify-between mt-2 mb-6">
                <Btn primary className="!h-8 !px-4">Add Related List</Btn>
                <div className="flex items-center gap-3 text-[12px] text-[#4B5578]">
                  Record detail page views :
                  <select className="h-8 border border-[#D5DBE8] rounded bg-white px-2 text-[12px]"><option>Standard View</option></select>
                  <Btn className="!h-8">Create a custom record page</Btn>
                </div>
              </div>
            </>
          )}

          {tab === 'Timeline' && (
            <div className="bg-white border border-[#E3E8F2] rounded">
              <div className="flex gap-6 px-4 text-[12.5px] border-b border-[#EEF1F7]">
                {['History', 'Interactions'].map((t) => (
                  <button key={t} type="button" onClick={() => setTimelineTab(t)} className={`h-10 ${timelineTab === t ? 'font-semibold border-b-2 border-[#1F2A44] text-[#1F2A44]' : 'text-[#4B5578]'}`}>{t}</button>
                ))}
              </div>
              {timelineTab === 'History' ? (
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between mb-3 text-[12.5px]">
                    <span className="font-semibold inline-flex items-center gap-2">Timeline History <Filter size={12} className="text-[#4B5578]" /></span>
                    <span className="text-[#2F55D4]">Show Upcoming Automated Actions</span>
                  </div>
                  {history.length === 0 && <Empty />}
                  {history.map((a, i) => (
                    <div key={i} className="flex gap-3 py-2 text-[12.5px]">
                      <div className="w-[88px] shrink-0 text-[#6B7696]">{a.date}</div>
                      <div className="h-2 w-2 rounded-full bg-[#2F55D4] mt-1.5" />
                      <div><b>{a.type}</b> — {a.desc}<div className="text-[11.5px] text-[#8B95AE]">by {a.by}</div></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-3">
                  <div className="font-semibold text-[12.5px] mb-3">Customer Interactions</div>
                  {calls.length === 0 && <Empty t="No interactions yet" />}
                  {calls.map((a, i) => (
                    <div key={i} className="mb-3 max-w-[420px] rounded border border-[#BFD0F5] bg-[#EEF3FF] px-3 py-2 text-[12.5px]">
                      <div className="flex items-center gap-2"><span className="h-5 w-5 rounded-full bg-[#2F55D4] inline-flex items-center justify-center"><Phone size={10} className="text-white" /></span>
                        <span>{a.desc}</span></div>
                      <div className="text-[11.5px] text-[#6B7696] mt-0.5">by {a.by} on {a.date}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Lead" size="md"
        footer={<><button className="btn-secondary" onClick={() => setEditOpen(false)}>Cancel</button><button className="btn-primary" onClick={saveEdit}>Save</button></>}>
        <div className="grid sm:grid-cols-2 gap-3">
          {[['name', 'Lead Name'], ['mobile', 'Mobile'], ['email', 'Email'], ['city', 'City'], ['status', 'Lead Status'], ['tag', 'Tag']].map(([k, label]) => (
            <label key={k} className="text-[12.5px] text-[#4B5578]">{label}
              <input className="input mt-1" value={form[k] || ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
            </label>
          ))}
          <label className="text-[12.5px] text-[#4B5578] sm:col-span-2">Remarks
            <textarea className="input mt-1 !h-20 py-2" value={form.remarks || ''} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
          </label>
        </div>
      </Modal>
    </div>
  );
}
