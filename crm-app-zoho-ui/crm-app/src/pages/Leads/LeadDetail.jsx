import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, Maximize2, Minimize2, PanelLeft, Clock3, Phone, MessageCircle,
  Filter, Paperclip, FileText, Trash2, CheckCircle2, ExternalLink, Lock, Unlock, Copy, Plus, ArrowDownUp, Search,
  Download, Eye, Upload, Link2, Cloud, Check,
} from 'lucide-react';
import { useCRM } from '../../context/crmContextInstance';
import { useToast } from '../../components/common/toastContext';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { todayISO } from '../../utils/calculations';
import { CAMPAIGN_TYPES, LEAD_SOURCES, LEAD_STATUSES, LEAD_TAGS } from '../../data/seedData';
import { MORE_MENU_ITEMS, leadCategory, leadSource } from './leadFilters';
import { useZohoCustomization } from './zohoCustomizationConfig';
import {
  AddRelatedListModal,
  LeadMoreActionModal,
  ZohoEmailComposerModal,
  ZohoSurveyModal,
} from './LeadDetailModals';
import ConvertLeadPage from './ConvertLeadPage';

const TAG_BG = {
  'Already Job Completed': '#0D9488',
  'Asking Very Low Rate': '#D97706',
  'Block List': '#991B1B',
  Complicated: '#7C3AED',
  'Deal Done': '#16A34A',
  Duplicate: '#DC2626',
  'Foreign Number': '#0284C7',
  'Future Requirements': '#2563EB',
  'Insufficient Contact Det': '#CA8A04',
  'Invaild Number': '#9333EA',
  'Invalid Number': '#9333EA',
  'Job seeking': '#4F46E5',
  Junk: '#E11D48',
  'Not contactable': '#BE185D',
  'Offline Service': '#0891B2',
  'Service Not Provided': '#64748B',
  followup: '#059669',
  'swich off': '#EA580C',
  'swich offival': '#EA580C',
  tag: '#3B82F6',
};
const dash = (v) => (v === undefined || v === null || v === '' ? '—' : v);
const maskMobile = (m) => { const d = String(m || '').replace(/\D/g, ''); return d ? `**********${d.slice(-3)}` : ''; };
const daysAgo = (iso) => { const t = Date.parse(iso); return Number.isNaN(t) ? '' : `${Math.max(0, Math.floor((Date.now() - t) / 86400000))} days ago`; };

function Btn({ children, primary, onClick, className = '' }) {
  return (
    <button type="button" onClick={onClick}
      className={`h-8 px-3.5 rounded text-[14px] border ${primary ? 'bg-[#2F55D4] border-[#2F55D4] text-white hover:bg-[#2748B8] font-medium' : 'bg-white border-[#D5DBE8] text-[#1F2A44] hover:bg-[#F3F6FB]'} ${className}`}>
      {children}
    </button>
  );
}
function Split({ children, onClick, onArrowClick, primary = true }) {
  return (
    <div className="flex">
      <button type="button" onClick={onClick} className={`h-8 px-3.5 rounded-l text-[14px] border font-medium ${primary ? 'bg-[#2F55D4] border-[#2F55D4] text-white hover:bg-[#2748B8]' : 'bg-white border-[#D5DBE8] hover:bg-[#F3F6FB]'}`}>{children}</button>
      <button type="button" onClick={onArrowClick || onClick} className={`h-8 w-7 rounded-r border-l flex items-center justify-center ${primary ? 'bg-[#2F55D4] border-white/30 text-white hover:bg-[#2748B8]' : 'bg-white border-[#D5DBE8] hover:bg-[#F3F6FB]'}`}><ChevronDown size={13} /></button>
    </div>
  );
}
function Field({ label, children }) {
  return (
    <div className="flex items-start gap-4 py-[7px] text-[14px]">
      <div className="w-[200px] shrink-0 text-right text-[#6B7696]">{label}</div>
      <div className="flex-1 min-w-0 text-[#1F2A44] break-words">{children}</div>
    </div>
  );
}
function Card({ id, title, action, children }) {
  return (
    <section id={id} className="bg-white border border-[#E3E8F2] rounded mb-3.5 scroll-mt-2">
      <div className="flex items-center justify-between px-4 h-11 border-b border-[#EEF1F7]">
        <h3 className="text-[16px] font-semibold text-[#1F2A44]">{title}</h3>
        {action}
      </div>
      <div>{children}</div>
    </section>
  );
}
const Empty = ({ t = 'No records found' }) => <div className="px-4 py-3 text-[14px] text-[#8B95AE]">{t}</div>;
const Ghost = ({ children, onClick }) => (
  <button type="button" onClick={onClick} className="h-7 px-3 rounded border border-[#2F55D4] text-[#2F55D4] text-[13px] font-medium hover:bg-[#EEF2FF] inline-flex items-center gap-1">{children}</button>
);

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const notify = (msg, type = 'success') => (type === 'error' ? toast.error(msg) : type === 'info' ? toast.info(msg) : toast.success(msg));
  const {
    leads = [],
    calls: crmCalls = [],
    users = [],
    userName,
    convertLead,
    createRecord,
    updateRecord,
    deleteRecord,
    sendMessage,
  } = useCRM();
  const { config: zohoCustomConfig, updateConfig: updateZohoCustomConfig } = useZohoCustomization();

  const idx = leads.findIndex((l) => l.id === id);
  const lead = leads[idx];

  const [tab, setTab] = useState('Overview');
  const [timelineTab, setTimelineTab] = useState('History');
  const [timelineFilter, setTimelineFilter] = useState('All');
  const [showUpcomingActions, setShowUpcomingActions] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [actTab, setActTab] = useState('Calls');
  const [mailTab, setMailTab] = useState('Mails');
  const [emailFilter, setEmailFilter] = useState('All Emails');
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [moreActionKey, setMoreActionKey] = useState(null);
  const [isFollowing, setIsFollowing] = useState(true);
  const [customHeaderButtons, setCustomHeaderButtons] = useState([]);
  const [revealMobile, setRevealMobile] = useState(false);

  // Closed Activities Enhanced State (Section 5)
  const [closedViewMode, setClosedViewMode] = useState('Tab View'); // 'Tab View' | 'Column View' | 'Chronological View'
  const [closedViewDropdownOpen, setClosedViewDropdownOpen] = useState(false);
  const [closedSearch, setClosedSearch] = useState('');
  const [closedSortDir, setClosedSortDir] = useState('desc');
  const [closedExpanded, setClosedExpanded] = useState(false);
  const [closedPage, setClosedPage] = useState(1);
  const [selectedCallDetail, setSelectedCallDetail] = useState(null);

  // Configurable extra related lists & custom sections (Section 12)
  const [extraRelatedLists, setExtraRelatedLists] = useState(['Notes', 'Campaigns', 'Products']);
  const [customRelatedSections, setCustomRelatedSections] = useState([]);
  const [addRelatedModalOpen, setAddRelatedModalOpen] = useState(false);

  // Custom sidebar links
  const [customLinks, setCustomLinks] = useState([]);
  const [addLinkModalOpen, setAddLinkModalOpen] = useState(false);
  const [newLinkForm, setNewLinkForm] = useState({ label: '', url: '' });

  // Functional Modals
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({});
  const [convertOpen, setConvertOpen] = useState(false);
  const [convertForm, setConvertForm] = useState({ dealName: '', amount: 450000, stage: 'Qualification' });
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailForm, setEmailForm] = useState({ to: '', subject: '', body: '', mode: 'Mails' });
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [callForm, setCallForm] = useState({ type: 'Outbound', durationMin: 8, status: 'Completed', subject: '', desc: '', callResult: 'Interested — Quotation Requested' });
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityForm, setActivityForm] = useState({ type: 'Task', desc: '', date: todayISO(), status: 'Open' });
  const [selectedActivity, setSelectedActivity] = useState(null);

  // Attachments State (Section 7)
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [attachModalOpen, setAttachModalOpen] = useState(false);
  const [attachSource, setAttachSource] = useState('Upload File');
  const [attachForm, setAttachForm] = useState({ fileName: '', size: '240 KB', notes: '', url: '' });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewAttachment, setPreviewAttachment] = useState(null);

  // Zoho Survey State (Section 8)
  const [surveyModalOpen, setSurveyModalOpen] = useState(false);
  const [surveyModalMode, setSurveyModalMode] = useState('Send Survey');
  const [customSurveysCatalog, setCustomSurveysCatalog] = useState([]);

  const [signModalOpen, setSignModalOpen] = useState(false);
  const [signForm, setSignForm] = useState({ name: 'Non-Disclosure Agreement (NDA).pdf', recipient: '', status: 'Sent for Signature' });
  const [waModalOpen, setWaModalOpen] = useState(false);
  const [waForm, setWaForm] = useState({ channel: 'WhatsApp to Mobile', text: '' });
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteForm, setNoteForm] = useState({ title: '', content: '' });
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [campaignForm, setCampaignForm] = useState({ name: '', type: 'Zoho Campaigns', status: 'Active' });
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const acts = lead?.activities || [];
  const calls = acts.filter((a) => /call/i.test(a.type));
  const tasks = acts.filter((a) => /task/i.test(a.type));
  const meetings = acts.filter((a) => /meeting|demo/i.test(a.type));
  const closed = acts.filter((a) => a.status === 'Completed');
  const open = acts.filter((a) => a.status !== 'Completed');

  // Enrich Closed Calls with full Zoho Call columns (Subject, Call Start Time, Call Owner, Call Result, Description, To Number, Created Time)
  const closedCallsRows = useMemo(() => {
    const baseCalls = calls.filter((a) => a.status === 'Completed');
    const mapped = baseCalls.map((a, index) => ({
      id: a.id || `call-act-${index}`,
      subject: a.subject || (a.desc ? a.desc.split('—')[0].trim() : `Outbound Call with ${lead?.name}`),
      callStartTime: a.callStartTime || a.date || lead?.callStartTime || lead?.createdTime || '11 Apr 2026 11:15 AM',
      callOwner: a.by || userName(lead?.ownerId) || 'Karthik S',
      callResult: a.callResult || 'Interested — Follow-up Scheduled',
      description: a.desc || `Discussed ${lead?.productName || leadCategory(lead)} requirements`,
      toNumber: a.toNumber || lead?.mobile || lead?.phone || '+91 98400 11223',
      createdTime: a.createdTime || a.date || lead?.createdTime || '11 Apr 2026 11:20 AM',
      rawActivity: a,
    }));
    if (mapped.length === 0 && lead) {
      mapped.push({
        id: `call-seed-${lead.id}`,
        subject: `Outbound Call — ${lead.name}`,
        callStartTime: lead.callStartTime || lead.createdTime || '11 Apr 2026 10:45 AM',
        callOwner: userName(lead.ownerId) || 'Karthik S',
        callResult: 'Contacted — Requirement Qualified',
        description: lead.remarks || `Initial discovery call for ${leadCategory(lead)}`,
        toNumber: lead.mobile || lead.phone || '+91 98401 22334',
        createdTime: lead.createdTime || '11 Apr 2026 10:52 AM',
      });
    }
    return mapped;
  }, [calls, lead, userName]);

  const closedByTab = {
    Tasks: tasks.filter((a) => a.status === 'Completed'),
    Meetings: meetings.filter((a) => a.status === 'Completed'),
    Calls: closedCallsRows,
  };

  const history = useMemo(() => {
    const rev = [...acts].reverse();
    if (timelineFilter === 'Calls') return rev.filter((a) => /call/i.test(a.type));
    if (timelineFilter === 'Emails') return rev.filter((a) => /email/i.test(a.type));
    if (timelineFilter === 'Tasks') return rev.filter((a) => /task|meeting/i.test(a.type));
    if (timelineFilter === 'Updates') return rev.filter((a) => /update|status|created|convert/i.test(a.type));
    return rev;
  }, [acts, timelineFilter]);

  if (!lead) {
    return (
      <div className="p-8 text-center text-[#6B7696]">
        Lead not found. <button className="text-[#2F55D4] underline" onClick={() => navigate('/leads')}>Back to Leads</button>
      </div>
    );
  }

  const backTarget = location.state?.from || '/leads';
  const handleBack = () => navigate(backTarget);

  const go = (secId) => {
    setTab('Overview');
    setTimeout(() => document.getElementById(secId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
  };
  const prev = leads[idx - 1];
  const next = leads[idx + 1];

  const nowTimeStr = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const owner = userName(lead.ownerId);
  const created = lead.createdTime || lead.createdOn;
  const aging = lead.leadAging || daysAgo(lead.createdOn);

  // Edit Lead Handlers
  const openEdit = () => {
    setForm({
      name: lead.name || '',
      company: lead.company || '',
      clientName: lead.clientName || lead.name || '',
      mobile: lead.mobile || lead.phone || '',
      phoneAlt: lead.phoneAlt || '',
      email: lead.email || '',
      city: lead.city || '',
      state: lead.state || 'Tamil Nadu',
      country: lead.country || 'India',
      street: lead.street || lead.address || '',
      zip: lead.zip ?? '',
      branchArea: lead.branchArea || '',
      category: leadCategory(lead),
      source: leadSource(lead),
      status: lead.status || 'New',
      readStatus: lead.readStatus || 'Unread',
      tag: lead.tag || 'Lead',
      ownerId: lead.ownerId || 'u4',
      productName: lead.productName || '',
      ceoApproval: lead.ceoApproval || 'Pending',
      performance: lead.performance || 'Good',
      sourceLang: lead.sourceLang || 'English',
      targetLang: lead.targetLang || 'Tamil',
      workingHours: lead.workingHours || '09:00 AM - 06:00 PM',
      websiteSource: lead.websiteSource || '',
      remarks: lead.remarks || '',
      comments: lead.comments || '',
      description: lead.description || '',
    });
    setEditOpen(true);
  };

  const saveEdit = () => {
    updateRecord('leads', lead.id, {
      ...form,
      phone: form.mobile,
      leadSource: form.source,
      industry: form.category,
      tagField: form.tag,
    });
    setEditOpen(false);
    toast.success('Lead updated');
  };

  // Convert Lead Handlers
  const openConvert = () => {
    setConvertForm({
      dealName: `${lead.company || lead.name} - Enterprise Deal`,
      amount: 450000,
      stage: 'Qualification',
    });
    setConvertOpen(true);
  };

  const handleConfirmConvert = () => {
    convertLead(lead.id, convertForm);
    setConvertOpen(false);
  };

  // Compose Email Handlers
  const openComposeEmail = (mode = 'Mails') => {
    setEmailForm({
      to: lead.email || `${(lead.firstName || 'contact').toLowerCase()}@example.com`,
      subject: `Follow-up regarding ${lead.productName || leadCategory(lead) || 'your inquiry'}`,
      body: `Hi ${lead.firstName || lead.name},\n\nThank you for connecting with us regarding ${lead.productName || 'our services'}. Please let us know a convenient time for a quick discussion.\n\nBest regards,\n${owner}`,
      mode,
    });
    setEmailModalOpen(true);
  };

  const handleSendEmailPayload = (payload) => {
    const targetMode = payload?.mode || emailForm.mode || 'Mails';
    const newEmail = {
      id: `em-${Date.now()}`,
      subject: payload?.subject || emailForm.subject || 'Follow-up Email',
      to: payload?.to || emailForm.to || lead.email,
      cc: payload?.cc || '',
      bcc: payload?.bcc || '',
      from: payload?.from || 'sibi@crm.in',
      body: payload?.body ?? emailForm.body,
      attachments: payload?.attachments || [],
      date: payload?.scheduledFor || `${todayISO()} ${nowTimeStr()}`,
      status: targetMode === 'Drafts' ? 'Draft' : targetMode === 'Scheduled' ? 'Scheduled' : 'Sent',
      source: 'Sent from CRM',
      tab: targetMode,
    };
    const newAct = {
      id: `act-${Date.now()}`,
      type: 'Email Sent',
      desc: `${newEmail.status}: "${newEmail.subject}" to ${newEmail.to}`,
      by: owner,
      date: `${todayISO()} ${nowTimeStr()}`,
      status: 'Completed',
    };
    updateRecord('leads', lead.id, {
      emails: [newEmail, ...(lead.emails || [])],
      activities: [...acts, newAct],
      latestEmailStatus: newEmail.status,
      relatedRecordsAction: 'Email Sent',
      _silentActivity: true,
    });
    setMailTab(targetMode);
    setEmailModalOpen(false);
    toast.success(targetMode === 'Drafts' ? 'Email saved to Drafts' : targetMode === 'Scheduled' ? 'Email scheduled' : 'Email sent successfully');
  };

  // Call Handlers
  const openCallModal = () => {
    setCallForm({
      type: 'Outbound',
      durationMin: 8,
      status: 'Completed',
      subject: `Outbound Call with ${lead.name}`,
      desc: `Discussed ${lead.productName || leadCategory(lead)} requirements and pricing`,
      callResult: 'Interested — Quotation Requested',
    });
    setCallModalOpen(true);
  };

  const handleSaveCall = () => {
    const startTs = `${todayISO()} ${nowTimeStr()}`;
    const callRec = createRecord('calls', {
      subject: callForm.subject || `Call with ${lead.name}`,
      callType: callForm.type,
      startTime: startTs,
      durationMin: Number(callForm.durationMin) || 5,
      status: callForm.status,
      ownerId: lead.ownerId || 'u4',
      accountId: lead.connectedAccountId || '',
      contactId: lead.connectedContactId || '',
    });
    const newAct = {
      id: `act-${Date.now()}`,
      type: 'Call Logged',
      subject: callForm.subject || `Outbound Call with ${lead.name}`,
      callStartTime: startTs,
      callResult: callForm.callResult || 'Interested — Quotation Requested',
      toNumber: lead.mobile || lead.phone || '+91 98400 11223',
      createdTime: startTs,
      desc: `${callForm.subject} (${callForm.durationMin}m) — ${callForm.desc}`,
      by: owner,
      date: startTs,
      status: callForm.status === 'Completed' ? 'Completed' : 'Scheduled',
      callId: callRec.id,
    };
    const dur = Number(callForm.durationMin) || 0;
    updateRecord('leads', lead.id, {
      activities: [...acts, newAct],
      callAttemptCount: (Number(lead.callAttemptCount) || 0) + 1,
      totalCallCount: (Number(lead.totalCallCount) || calls.length) + 1,
      totalCallDurations: (Number(lead.totalCallDurations) || 0) + dur,
      directCallDuration: (Number(lead.directCallDuration) || 0) + dur,
      callStartTime: startTs,
      connectedCallId: callRec.id,
      relatedRecordsAction: 'Call Logged',
      _silentActivity: true,
    });
    setCallModalOpen(false);
    toast.success('Call logged and linked to Lead');
  };

  // Add Open Activity Handler
  const handleAddActivity = () => {
    if (!activityForm.desc.trim()) return;
    const newAct = {
      id: `act-${Date.now()}`,
      type: activityForm.type,
      desc: activityForm.desc.trim(),
      by: owner,
      date: activityForm.date || todayISO(),
      status: activityForm.status,
    };
    updateRecord('leads', lead.id, {
      activities: [...acts, newAct],
      relatedRecordsAction: 'Task Created',
      _silentActivity: true,
    });
    if (activityForm.type === 'Task') {
      createRecord('tasks', {
        subject: activityForm.desc.trim(),
        dueDate: activityForm.date || todayISO(),
        status: activityForm.status === 'Completed' ? 'Completed' : 'In Progress',
        priority: 'High',
        relatedTo: `Lead - ${lead.name}`,
        relatedModule: 'leads',
        relatedRecordId: lead.id,
        contactName: lead.name,
        ownerId: lead.ownerId || 'u4',
      });
    }
    setActivityModalOpen(false);
    setActivityForm({ type: 'Task', desc: '', date: todayISO(), status: 'Open' });
    toast.success(`${activityForm.type} added to Lead`);
  };

  const handleToggleActivityStatus = (actItem) => {
    const nextStatus = actItem.status === 'Completed' ? 'Open' : 'Completed';
    const nextActs = acts.map((a) => (a === actItem || (a.id && a.id === actItem.id) ? { ...a, status: nextStatus } : a));
    updateRecord('leads', lead.id, { activities: nextActs, _silentActivity: true });
    setSelectedActivity(null);
    toast.success(`Activity marked as ${nextStatus}`);
  };

  // Attachment Handler (Upload File, Zoho WorkDrive, Other Cloud Drives, Link URL)
  const handleAddAttachment = () => {
    const finalName = attachForm.fileName.trim() || attachForm.url.trim();
    if (!finalName) return;
    const newAtt = {
      id: `att-${Date.now()}`,
      fileName: finalName,
      size: attachSource === 'Link (URL)' ? 'External URL' : (attachForm.size || '240 KB'),
      source: attachSource,
      url: attachForm.url || '',
      notes: attachForm.notes,
      attachedBy: owner,
      date: `${todayISO()} ${nowTimeStr()}`,
    };
    updateRecord('leads', lead.id, {
      attachments: [newAtt, ...(lead.attachments || [])],
      _silentActivity: true,
    });
    setAttachModalOpen(false);
    setUploadProgress(0);
    setAttachForm({ fileName: '', size: '240 KB', notes: '', url: '' });
    toast.success(`Attachment added via ${attachSource}`);
  };

  const handleSaveLeadSurveyRecord = (newSurvey) => {
    updateRecord('leads', lead.id, {
      surveys: [newSurvey, ...(lead.surveys || [])],
      _silentActivity: true,
    });
  };

  // ZohoSign Handler
  const handleSaveSignDoc = () => {
    if (!signForm.name.trim()) return;
    const newDoc = {
      id: `zs-${Date.now()}`,
      name: signForm.name.trim(),
      recipient: signForm.recipient || lead.email || lead.name,
      status: signForm.status,
      sentOn: todayISO(),
    };
    updateRecord('leads', lead.id, {
      signDocuments: [newDoc, ...(lead.signDocuments || [])],
      _silentActivity: true,
    });
    setSignModalOpen(false);
    toast.success(`ZohoSign Document "${newDoc.name}" assigned`);
  };

  // WhatsApp Message Handler
  const openWhatsAppModal = (channel = 'WhatsApp to Mobile') => {
    setWaForm({
      channel,
      text: `Hi ${lead.firstName || lead.name}, following up on your inquiry regarding ${lead.productName || leadCategory(lead)}. Let us know how we can assist!`,
    });
    setWaModalOpen(true);
  };

  const handleSendWhatsApp = () => {
    if (!waForm.text.trim()) return;
    const newWa = {
      id: `wa-${Date.now()}`,
      text: waForm.text.trim(),
      date: `${todayISO()}, ${nowTimeStr()}`,
      via: 'WhatsApp',
      channel: waForm.channel,
      sender: owner,
      direction: 'Outbound',
    };
    const newAct = {
      id: `act-${Date.now()}`,
      type: 'WhatsApp Sent',
      desc: `WhatsApp message sent: "${waForm.text.trim().slice(0, 60)}"`,
      by: owner,
      date: `${todayISO()} ${nowTimeStr()}`,
      status: 'Completed',
    };
    updateRecord('leads', lead.id, {
      whatsappMessages: [newWa, ...(lead.whatsappMessages || [])],
      activities: [...acts, newAct],
      _silentActivity: true,
    });
    sendMessage({
      sender: lead.name,
      badge: 'Lead',
      subject: `WhatsApp: ${lead.name}`,
      body: waForm.text.trim(),
      type: 'Lead Messages',
    });
    setWaModalOpen(false);
    toast.success('WhatsApp message sent & logged');
  };

  // Note Handler
  const handleSaveNote = () => {
    if (!noteForm.content.trim()) return;
    const newNote = {
      id: `note-${Date.now()}`,
      title: noteForm.title.trim() || 'Lead Note',
      content: noteForm.content.trim(),
      by: owner,
      date: `${todayISO()} ${nowTimeStr()}`,
    };
    const newAct = {
      id: `act-${Date.now()}`,
      type: 'Note Added',
      desc: `${newNote.title}: ${newNote.content}`,
      by: owner,
      date: `${todayISO()} ${nowTimeStr()}`,
      status: 'Completed',
    };
    updateRecord('leads', lead.id, {
      notes: [newNote, ...(lead.notes || [])],
      activities: [...acts, newAct],
      relatedRecordsAction: 'Note Added',
      _silentActivity: true,
    });
    setNoteModalOpen(false);
    setNoteForm({ title: '', content: '' });
    toast.success('Note saved to Lead');
  };

  // Campaign Handler
  const handleSaveCampaign = () => {
    if (!campaignForm.name.trim()) return;
    const newCamp = {
      id: `camp-${Date.now()}`,
      name: campaignForm.name.trim(),
      type: campaignForm.type,
      status: campaignForm.status,
      memberStatus: 'Responded',
    };
    updateRecord('leads', lead.id, {
      campaigns: [newCamp, ...(lead.campaigns || [])],
      campaignName: newCamp.name,
      campaignType: newCamp.type,
      campaignStatus: newCamp.status,
    });
    setCampaignModalOpen(false);
    setCampaignForm({ name: '', type: 'Zoho Campaigns', status: 'Active' });
    toast.success('Campaign associated with Lead');
  };

  const leadEmails = (lead.emails || []).filter((e) => {
    if ((e.tab || 'Mails') !== mailTab) return false;
    if (emailFilter === 'Sent from CRM') return (e.source || 'Sent from CRM') === 'Sent from CRM';
    if (emailFilter === 'Received') return e.source === 'Received';
    if (emailFilter === 'Opened') return e.status === 'Opened' || e.status === 'Sent';
    return true;
  });
  const leadAttachments = lead.attachments || [];
  const leadSurveys = lead.surveys || [];
  const leadSignDocs = lead.signDocuments || [];
  const leadMessages = lead.whatsappMessages?.length
    ? lead.whatsappMessages
    : [
        {
          id: 'wa-default',
          text: `Hi ${lead.firstName || lead.name}, Welcome! Our Sales Representative will contact you shortly…`,
          date: lead.createdTime || lead.createdOn || '',
          via: 'WhatsApp',
          sender: owner,
        },
      ];

  const RELATED = [
    ['Open Activities', 'sec-open', open.length],
    ['Closed Activities', 'sec-closed', closed.length + closedCallsRows.length],
    ['Emails', 'sec-emails', (lead.emails || []).length],
    ['Attachments', 'sec-attach', leadAttachments.length],
    ['Zoho Survey', 'sec-survey', leadSurveys.length],
    ['ZohoSign Documents', 'sec-sign', leadSignDocs.length],
    ['Messages', 'sec-messages', leadMessages.length],
    ...extraRelatedLists.map((name) => [name, `sec-rel-${name.replace(/[^a-z0-9]/gi, '')}`, 0]),
    ...customRelatedSections.map((cs) => [cs.name, `sec-custom-${cs.name.replace(/[^a-z0-9]/gi, '')}`, 1]),
  ];

  const allInteractions = [
    ...calls.map((c) => ({ kind: 'Call', title: c.desc, by: c.by, date: c.date })),
    ...(lead.emails || []).map((e) => ({ kind: 'Email', title: `${e.subject} (${e.status})`, by: e.from || owner, date: e.date })),
    ...leadMessages.map((m) => ({ kind: 'WhatsApp', title: m.text, by: m.sender || owner, date: m.date })),
  ];

  const handleSelectMoreMenuItem = (itemKey) => {
    setMoreMenuOpen(false);
    if (itemKey === 'clone') {
      const cloned = createRecord('leads', {
        ...lead,
        name: `${lead.name} (Copy)`,
        leadNo: `LEA${Math.floor(114840 + Math.random() * 900)}`,
      });
      toast.success('Lead cloned');
      if (cloned?.id) navigate(`/leads/${cloned.id}`);
      return;
    }
    if (itemKey === 'delete') {
      setDeleteConfirmOpen(true);
      return;
    }
    if (itemKey === 'add_related_list') {
      setAddRelatedModalOpen(true);
      return;
    }
    if (itemKey === 'follow') {
      setIsFollowing((f) => !f);
      toast.success(isFollowing ? `Unfollowed ${lead.name}` : `Now following ${lead.name}`);
      return;
    }
    setMoreActionKey(itemKey);
  };

  if (convertOpen) {
    return (
      <ConvertLeadPage
        leadProp={lead}
        onCancel={() => setConvertOpen(false)}
      />
    );
  }

  return (
    <div className="-mx-3 sm:-mx-[18px] -mt-2.5 bg-[#F6F8FC] min-h-[calc(100vh-56px)]">
      {/* ---- header ---- */}
      <div className="bg-white flex items-center gap-3 px-5 py-3 border-b border-[#E3E8F2] flex-wrap">
        <button type="button" onClick={handleBack} aria-label="Back" title={location.state?.from === '/workqueue' ? 'Back to Workqueue' : 'Back to Leads'}>
          <ArrowLeft size={19} className="text-[#1F2A44]" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[22px] font-bold text-[#1F2A44] leading-tight">{lead.name}</span>
            {lead.locked && <Lock size={14} className="text-amber-600" title="Locked Record" />}
            {isFollowing && (
              <span className="text-[12px] px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#2F55D4] font-semibold">Following</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            {Array.from(
              new Set(
                [lead.tag, lead.tagField, ...(Array.isArray(lead.tags) ? lead.tags : [])].filter(
                  (tg) => tg && tg !== 'Lead' && tg !== '-None-'
                )
              )
            ).map((tg) => (
              <span
                key={tg}
                className="inline-flex items-center h-[20px] px-2.5 text-[11.5px] font-semibold text-white rounded-xs"
                style={{
                  background: zohoCustomConfig.tagColors?.[tg] || TAG_BG[tg] || '#3B82F6',
                  clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%)',
                  paddingRight: 11,
                }}
              >
                {tg}
              </span>
            ))}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          {customHeaderButtons.map((cb, idxBtn) => (
            <Btn
              key={idxBtn}
              onClick={() => toast.info(`Executed custom button "${cb.label}" (${cb.url})`)}
            >
              {cb.label}
            </Btn>
          ))}
          <Split onClick={() => openComposeEmail('Mails')} onArrowClick={() => openComposeEmail('Scheduled')}>Send Email</Split>
          <Btn primary onClick={openCallModal}>Call</Btn>
          <Btn onClick={openConvert}>Convert</Btn>
          <Btn onClick={() => navigate(`/leads/${lead.id}/edit`, { state: { from: `/leads/${lead.id}` } })}>Edit</Btn>
          <Split primary={false} onClick={() => openWhatsAppModal('WhatsApp to Mobile')}>Send WhatsApp</Split>

          {/* Section 9: Complete 20-Item Zoho More (•••) Lead Actions Dropdown */}
          <div className="relative">
            <Btn className="!px-2.5" onClick={() => setMoreMenuOpen((o) => !o)}>•••</Btn>
            {moreMenuOpen && (
              <div className="absolute right-0 top-9 z-40 w-60 max-h-[420px] overflow-y-auto thin-scroll bg-white border border-[#D5DBE8] rounded-md shadow-xl py-1 text-[14px]">
                {MORE_MENU_ITEMS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleSelectMoreMenuItem(item.key)}
                    className={`w-full px-3.5 py-2 text-left hover:bg-[#F3F6FB] flex items-center justify-between ${
                      item.danger ? 'text-rose-600 hover:bg-rose-50 font-medium' : 'text-[#1F2A44]'
                    }`}
                  >
                    <span>{item.key === 'follow' ? (isFollowing ? 'Unfollow' : 'Follow') : item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button type="button" disabled={!prev} onClick={() => prev && navigate(`/leads/${prev.id}`, { state: location.state })} className="disabled:opacity-30"><ChevronLeft size={18} /></button>
          <button type="button" disabled={!next} onClick={() => next && navigate(`/leads/${next.id}`, { state: location.state })} className="disabled:opacity-30"><ChevronRight size={18} /></button>
        </div>
      </div>

      <div className="flex">
        {/* ---- left related list ---- */}
        {showLeftPanel && (
          <aside className="w-[210px] shrink-0 px-4 py-4 text-[14px] hidden md:block">
            <div className="text-[16px] font-semibold text-[#1F2A44] mb-2.5">Related List</div>
            <ul className="space-y-2">
              {RELATED.map(([t, sec, n]) => (
                <li key={t}>
                  <button type="button" onClick={() => go(sec)} className="text-[#1F2A44] hover:text-[#2F55D4] flex items-center gap-1.5 text-left">
                    <span className="truncate max-w-[155px]">{t}</span>
                    {n ? <span className="text-[12px] bg-[#E8ECF5] rounded-full px-1.5">{n}</span> : null}
                  </button>
                </li>
              ))}
              <li>
                <button type="button" onClick={() => setAddRelatedModalOpen(true)} className="text-[#2F55D4] hover:underline font-medium">
                  Add Related List
                </button>
              </li>
            </ul>
            <div className="text-[16px] font-semibold text-[#1F2A44] mt-6 mb-2.5">Links</div>
            <ul className="space-y-2">
              {['WhatsApp to Phone', 'WhatsApp to Mobile'].map((t) => (
                <li key={t}>
                  <button type="button" onClick={() => openWhatsAppModal(t)} className="text-[#1F2A44] hover:text-[#2F55D4] flex items-center gap-1.5">
                    <MessageCircle size={14} className="text-[#2F55D4]" />{t}
                  </button>
                </li>
              ))}
              {customLinks.map((cl, i) => (
                <li key={i}>
                  <a href={cl.url} target="_blank" rel="noreferrer" className="text-[#2F55D4] hover:underline flex items-center gap-1.5">
                    <ExternalLink size={13} /> {cl.label}
                  </a>
                </li>
              ))}
              <li>
                <button type="button" onClick={() => setAddLinkModalOpen(true)} className="text-[#2F55D4] hover:underline">
                  Add Link
                </button>
              </li>
            </ul>
          </aside>
        )}

        {/* ---- main ---- */}
        <div className="flex-1 min-w-0 px-3 py-3">
          <div className="flex items-center gap-3 mb-3">
            <button
              type="button"
              onClick={() => setShowLeftPanel((p) => !p)}
              title="Toggle Related List Sidebar"
              className="h-8 w-8 rounded-full border border-[#D5DBE8] bg-white flex items-center justify-center hover:bg-[#F3F6FB]"
            >
              <PanelLeft size={14} />
            </button>
            <div className="inline-flex rounded-full border border-[#D5DBE8] bg-white p-0.5 text-[14px]">
              {['Overview', 'Timeline'].map((t) => (
                <button key={t} type="button" onClick={() => setTab(t)} className={`px-4 h-8 rounded-full ${tab === t ? 'bg-[#EEF1F8] font-semibold shadow-sm' : 'text-[#4B5578]'}`}>{t}</button>
              ))}
            </div>
            <span className="ml-auto text-[13px] text-[#6B7696] inline-flex items-center gap-1">
              <Clock3 size={13} /> Last Update : {lead.updatedAt ? new Date(lead.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (lead.modifiedTime || 'a while ago')}
            </span>
          </div>

          {tab === 'Overview' && (
            <>
              {/* Business Card Summary (Customizable via Customize Business Card) */}
              <div className="bg-white border border-[#E3E8F2] rounded px-4 py-3 mb-3">
                {(zohoCustomConfig.businessCardFields || ['Mobile', 'Lead Status', 'City', 'Lead Aging', 'Category']).map((bf) => {
                  if (bf === 'Mobile') {
                    return (
                      <Field key={bf} label="Mobile">
                        <span
                          onClick={() => setRevealMobile((r) => !r)}
                          title="Click to toggle full number"
                          className="cursor-pointer hover:text-[#2F55D4]"
                        >
                          {revealMobile ? (lead.mobile || lead.phone || '—') : (maskMobile(lead.mobile || lead.phone) || '—')}
                        </span>
                      </Field>
                    );
                  }
                  if (bf === 'Lead Status') return <Field key={bf} label="Lead Status">{dash(lead.status)}</Field>;
                  if (bf === 'City') return <Field key={bf} label="City">{dash(lead.city)}</Field>;
                  if (bf === 'Lead Aging') return <Field key={bf} label="Lead Aging">{dash(aging)}</Field>;
                  if (bf === 'Category') return <Field key={bf} label="Category">{dash(leadCategory(lead))}</Field>;
                  if (bf === 'Lead Source') return <Field key={bf} label="Lead Source">{dash(leadSource(lead))}</Field>;
                  if (bf === 'Lead Owner') return <Field key={bf} label="Lead Owner">{dash(owner)}</Field>;
                  if (bf === 'Email') return <Field key={bf} label="Email">{dash(lead.email)}</Field>;
                  if (bf === 'Company') return <Field key={bf} label="Company">{dash(lead.company)}</Field>;
                  if (bf === 'Product Name') return <Field key={bf} label="Product Name">{dash(lead.productName)}</Field>;
                  if (bf === 'Source Lang') return <Field key={bf} label="Source Lang">{dash(lead.sourceLang)}</Field>;
                  if (bf === 'Target Lang') return <Field key={bf} label="Target Lang">{dash(lead.targetLang)}</Field>;
                  return null;
                })}
              </div>

              <div className="bg-white border border-[#E3E8F2] rounded mb-3.5">
                <button type="button" onClick={() => setShowDetails((s) => !s)} className="w-full text-left px-4 h-11 text-[16px] font-semibold text-[#1F2A44] border-b border-[#EEF1F7]">{showDetails ? 'Hide Details' : 'Show Details'}</button>
                {showDetails && (
                  <div className="px-4 py-3.5">
                    <h4 className="text-[16px] font-semibold text-[#1F2A44] mb-2">Lead Information</h4>
                    <div className="grid md:grid-cols-2 gap-x-6">
                      <div>
                        <Field label="Lead No">{dash(lead.leadNo)}</Field>
                        <Field label="Lead Aging">{dash(aging)}</Field>
                        <Field label="Lead Assigned time">{dash(lead.leadAssignedTime || lead.assignedTime)}</Field>
                        <Field label="Lead CEO Approval">{dash(lead.leadCeoApproval || lead.ceoApproval)}</Field>
                        <Field label="Lead Owner">{dash(owner)}</Field>
                        <Field label="Allotted Lead Manager">{dash(lead.allottedLeadManager || (lead.allottedManagerId ? userName(lead.allottedManagerId) : 'Gautam S.'))}</Field>
                        <Field label="Client Name">{dash(lead.clientName || lead.name)}</Field>
                        <Field label="Justdial Id">{dash(lead.justdialId)}</Field>
                        <Field label="Workflow Checkbox">{lead.workflowCheckbox ? '✓' : dash(lead.workflowCheckbox)}</Field>
                        <Field label="Lead Activity Aging">{dash(lead.leadActivityAging || aging)}</Field>
                        <Field label="Lead Manager 1">{lead.ownerId ? <span className="px-2.5 py-0.5 rounded-full bg-[#F7D44C] text-[12.5px] font-semibold">{(lead.leadManager1 || owner).split(' ')[0]}</span> : '—'}</Field>
                        <Field label="Direct call Duration">{dash(lead.directCallDuration)}</Field>
                        <Field label="Whatsapp call duration">{dash(lead.whatsappCallDuration)}</Field>
                        <Field label="Lead Name">{dash(lead.name)}</Field>
                        <Field label="Mobile">{revealMobile ? (lead.mobile || lead.phone || '—') : (maskMobile(lead.mobile || lead.phone) || '—')}</Field>
                        <Field label="Reopen Lead">{lead.reopenLead ? String(lead.reopenLead) : dash(lead.reopenLead)}</Field>
                        <Field label="Company">{dash(lead.company)}</Field>
                        <Field label="Lead Source">{leadSource(lead) ? <span className="px-2.5 py-0.5 rounded-full bg-[#4AA8F0] text-white text-[12.5px] font-semibold">{leadSource(lead)}</span> : '—'}</Field>
                        <Field label="Product Name">{dash(lead.productName)}</Field>
                        <Field label="Created By"><div>{lead.createdBy || 'Administration Team'}</div><div className="text-[12.5px] text-[#6B7696]">{dash(created)}</div></Field>
                        <Field label="Remarks">{dash(lead.remarks)}</Field>
                        <Field label="Call Attempt Count">{dash(lead.callAttemptCount)}</Field>
                        <Field label="Total call count">{dash(calls.length || lead.totalCallCount)}</Field>
                        <Field label="Total Call Durations">{dash(lead.totalCallDurations ?? 0)}</Field>
                      </div>
                      <div>
                        <Field label="Comments">{dash(lead.comments)}</Field>
                        <Field label="Status">{lead.readStatus ? <span className="px-2.5 py-0.5 rounded-full bg-[#1DB54A] text-white text-[12.5px] font-semibold">{lead.readStatus}</span> : '—'}</Field>
                        <Field label="Lead Push Time">{dash(lead.leadPushTime || lead.pushTime || lead.createdOn)}</Field>
                        <Field label="Date">{dash(lead.date || lead.createdOn)}</Field>
                        <Field label="Dashboard Req">{lead.dashboardReq ? String(lead.dashboardReq) : '—'}</Field>
                        <Field label="Phone">{dash(lead.phoneAlt || lead.phone)}</Field>
                        <Field label="Email">{lead.email ? <a className="text-[#2F55D4]" href={`mailto:${lead.email}`}>{lead.email}</a> : '—'}</Field>
                        <Field label="Lead Status">{dash(lead.status)}</Field>
                        <Field label="Category">{dash(leadCategory(lead))}</Field>
                        <Field label="Working hours">{dash(lead.workingHours)}</Field>
                        <Field label="Call Start Time">{dash(lead.callStartTime)}</Field>
                        <Field label="Website Source">{dash(lead.websiteSource)}</Field>
                        <Field label="Call Delay">{dash(lead.callDelay)}</Field>
                        <Field label="Checkbox 1">{lead.checkbox1 ? '✓' : dash(lead.checkbox1)}</Field>
                        <Field label="Tag Field">{dash(lead.tag !== 'Lead' ? lead.tag : lead.tagField)}</Field>
                        <Field label="Source Lang">{dash(lead.sourceLang)}</Field>
                        <Field label="Target Lang">{dash(lead.targetLang)}</Field>
                        <Field label="Performance">{dash(lead.performance)}</Field>
                        {lead.convertedDeal && (
                          <Field label="Converted Deal">
                            <button
                              type="button"
                              onClick={() => navigate(`/deals?open=${lead.convertedDealId || lead.connectedDealId || ''}`, { state: { from: `/leads/${lead.id}` } })}
                              className="text-[#2F55D4] hover:underline font-medium"
                            >
                              {lead.convertedDeal}
                            </button>
                          </Field>
                        )}
                        {lead.convertedContact && (
                          <Field label="Converted Contact">
                            <button
                              type="button"
                              onClick={() => navigate(`/contacts?open=${lead.convertedContactId || lead.connectedContactId || ''}`, { state: { from: `/leads/${lead.id}` } })}
                              className="text-[#2F55D4] hover:underline font-medium"
                            >
                              {lead.convertedContact}
                            </button>
                          </Field>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-5 mb-1.5">
                      <h4 className="text-[16px] font-semibold text-[#1F2A44]">Address Information</h4>
                      <button type="button" onClick={() => setMapModalOpen(true)} className="h-8 px-3.5 rounded border border-[#D5DBE8] text-[14px] hover:bg-[#F3F6FB]">Locate Map</button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-x-6">
                      <div><Field label="Street">{dash(lead.street || lead.address)}</Field><Field label="State">{dash(lead.state)}</Field><Field label="Country">{lead.country || 'India'}</Field></div>
                      <div><Field label="City">{dash(lead.city)}</Field><Field label="Zip Code">{dash(lead.zip ?? 0)}</Field><Field label="Branch Area">{dash(lead.branchArea)}</Field></div>
                    </div>

                    <h4 className="text-[16px] font-semibold text-[#1F2A44] mt-5 mb-1.5">Description Information</h4>
                    <Field label="Description">{dash(lead.description)}</Field>

                    <h4 className="text-[16px] font-semibold text-[#1F2A44] mt-5 mb-1.5">Visit Summary</h4>
                    <div className="grid md:grid-cols-2 gap-x-6">
                      <div>
                        <Field label="Most Recent Visit">{dash(lead.mostRecentVisit)}</Field>
                        <Field label="Average Time Spent (Minutes)">{dash(lead.averageTimeSpent)}</Field>
                        <Field label="Referrer">{dash(lead.referrer)}</Field>
                        <Field label="First Visit">{dash(lead.firstVisit)}</Field>
                      </div>
                      <div>
                        <Field label="First Page Visited">{dash(lead.firstPageVisited)}</Field>
                        <Field label="Number Of Chats">{dash(lead.numberOfChats)}</Field>
                        <Field label="Visitor Score">{dash(lead.visitorScore ?? lead.score)}</Field>
                        <Field label="Days Visited">{dash(lead.daysVisited)}</Field>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Open Activities */}
              <Card
                id="sec-open"
                title="Open Activities"
                action={
                  <Ghost onClick={() => setActivityModalOpen(true)}>
                    Add New <ChevronDown size={11} />
                  </Ghost>
                }
              >
                {open.length === 0 ? <Empty /> : open.map((a, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedActivity(a)}
                    className="px-4 py-2.5 text-[14px] border-t border-[#EEF1F7] first:border-0 hover:bg-[#F6F8FD] cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <b>{a.type}</b> — {a.desc} <span className="text-[#8B95AE]">({a.by}, {a.date})</span>
                    </div>
                    <span className="text-[13px] text-[#2F55D4] hover:underline">View / Complete</span>
                  </div>
                ))}
              </Card>

              {/* Section 5: Closed Activities (Tab View / Column View / Chronological View, Filter, Sort, Full-Screen Expand, Calls Table) */}
              <div className={closedExpanded ? 'fixed inset-4 z-50 bg-white border border-[#CBD5E1] rounded-xl shadow-2xl flex flex-col overflow-hidden' : ''}>
                <Card
                  id="sec-closed"
                  title="Closed Activities"
                  action={
                    <div className="flex items-center gap-2 text-[14px] text-[#4B5578]">
                      {/* Filter Input */}
                      <div className="relative hidden sm:block">
                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8B95AE]" />
                        <input
                          value={closedSearch}
                          onChange={(e) => setClosedSearch(e.target.value)}
                          placeholder="Filter activities..."
                          className="h-7 pl-7 pr-2.5 w-40 rounded border border-[#D5DBE8] bg-white text-[13px] focus:outline-none focus:border-[#2F55D4]"
                        />
                      </div>

                      {/* Sort Button */}
                      <button
                        type="button"
                        onClick={() => setClosedSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
                        title="Sort Activities"
                        className="h-7 px-2.5 rounded border border-[#D5DBE8] bg-white hover:bg-[#F3F6FB] inline-flex items-center gap-1 text-[13px]"
                      >
                        <ArrowDownUp size={12} /> {closedSortDir === 'desc' ? 'Newest' : 'Oldest'}
                      </button>

                      {/* View Switcher: Tab View | Column View | Chronological View */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setClosedViewDropdownOpen((o) => !o)}
                          className="h-7 px-3 rounded border border-[#D5DBE8] bg-white hover:bg-[#F3F6FB] inline-flex items-center gap-1 text-[13px] font-medium text-[#1F2A44]"
                        >
                          <span>{closedViewMode}</span>
                          <ChevronDown size={12} />
                        </button>
                        {closedViewDropdownOpen && (
                          <div className="absolute right-0 top-8 z-30 w-48 bg-white border border-[#D5DBE8] rounded shadow-lg py-1 text-[14px]">
                            {['Tab View', 'Column View', 'Chronological View'].map((vm) => (
                              <button
                                key={vm}
                                type="button"
                                onClick={() => {
                                  setClosedViewMode(vm);
                                  setClosedViewDropdownOpen(false);
                                }}
                                className={`w-full px-3 py-1.5 text-left hover:bg-[#F3F6FB] flex items-center justify-between ${
                                  closedViewMode === vm ? 'text-[#2F55D4] font-semibold bg-[#EEF2FF]' : 'text-[#1F2A44]'
                                }`}
                              >
                                <span>{vm}</span>
                                {closedViewMode === vm && <Check size={13} />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Expand to Full-Screen Panel */}
                      <button
                        type="button"
                        title={closedExpanded ? 'Exit Full-Screen' : 'Expand to Full-Screen Panel'}
                        onClick={() => setClosedExpanded((e) => !e)}
                        className="p-1 rounded hover:bg-[#EEF2FF] text-[#1F2A44]"
                      >
                        {closedExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                      </button>
                    </div>
                  }
                >
                  {/* Tabs: Tasks | Meetings | Calls */}
                  <div className="flex items-center justify-between px-4 text-[14px] border-b border-[#EEF1F7]">
                    <div className="flex gap-5">
                      {['Tasks', 'Meetings', 'Calls'].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setActTab(t)}
                          className={`h-10 flex items-center gap-1.5 ${
                            actTab === t ? 'font-semibold border-b-2 border-[#2F55D4] text-[#1F2A44]' : 'text-[#4B5578]'
                          }`}
                        >
                          <span>{t}</span>
                          <span className="text-[12px] bg-[#E8ECF5] rounded-full px-1.5">{closedByTab[t].length}</span>
                        </button>
                      ))}
                    </div>
                    <span className="text-[12.5px] text-[#6B7696]">View: {closedViewMode}</span>
                  </div>

                  {/* Calls Tab Table with exact screenshot columns */}
                  {actTab === 'Calls' ? (
                    <div className="overflow-x-auto thin-scroll">
                      <table className="w-full text-[14px] border-collapse min-w-[920px]">
                        <thead>
                          <tr className="bg-[#F8FAFD] text-left text-[#4B5578] text-[13.5px] border-b border-[#EEF1F7]">
                            <th className="px-4 py-2.5 font-semibold">Subject</th>
                            <th className="px-3 py-2.5 font-semibold">Call Start Time</th>
                            <th className="px-3 py-2.5 font-semibold">Call Owner</th>
                            <th className="px-3 py-2.5 font-semibold">Call Result</th>
                            <th className="px-3 py-2.5 font-semibold">Description</th>
                            <th className="px-3 py-2.5 font-semibold">To Number</th>
                            <th className="px-4 py-2.5 font-semibold">Created Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EEF1F7]">
                          {closedCallsRows
                            .filter((c) => !closedSearch || [c.subject, c.callOwner, c.callResult, c.description, c.toNumber].some((v) => String(v || '').toLowerCase().includes(closedSearch.toLowerCase())))
                            .map((c) => (
                              <tr
                                key={c.id}
                                onClick={() => setSelectedCallDetail(c)}
                                className="hover:bg-[#F6F8FD] cursor-pointer"
                              >
                                <td className="px-4 py-2.5 font-medium text-[#2F55D4] hover:underline">{c.subject}</td>
                                <td className="px-3 py-2.5 whitespace-nowrap text-[#2A3350]">{c.callStartTime}</td>
                                <td className="px-3 py-2.5 whitespace-nowrap text-[#2A3350]">{c.callOwner}</td>
                                <td className="px-3 py-2.5 text-[#2A3350]">{c.callResult}</td>
                                <td className="px-3 py-2.5 text-[#2A3350] max-w-[240px] truncate">{c.description}</td>
                                <td className="px-3 py-2.5 whitespace-nowrap text-[#2A3350]">{c.toNumber}</td>
                                <td className="px-4 py-2.5 whitespace-nowrap text-[#6B7696]">{c.createdTime}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  ) : closedByTab[actTab].length === 0 ? (
                    <Empty />
                  ) : (
                    closedByTab[actTab]
                      .filter((a) => !closedSearch || String(a.desc || '').toLowerCase().includes(closedSearch.toLowerCase()))
                      .map((a, i) => (
                        <div
                          key={i}
                          onClick={() => setSelectedActivity(a)}
                          className="px-4 py-2.5 text-[14px] border-b border-[#EEF1F7] hover:bg-[#F6F8FD] cursor-pointer flex items-center justify-between"
                        >
                          <div>{a.desc} <span className="text-[#8B95AE]">— {a.by}, {a.date}</span></div>
                          <span className="text-[13px] text-[#2F55D4]">Details</span>
                        </div>
                      ))
                  )}
                </Card>
              </div>

              {/* Section 6: Emails with Mails, Drafts, Scheduled tabs + Email Filter Dropdown */}
              <Card
                id="sec-emails"
                title="Emails"
                action={
                  <div className="flex items-center gap-2">
                    <select
                      value={emailFilter}
                      onChange={(e) => setEmailFilter(e.target.value)}
                      className="h-7 px-2.5 rounded border border-[#D5DBE8] bg-white text-[13px] text-[#1F2A44]"
                    >
                      <option value="All Emails">All Emails</option>
                      <option value="Sent from CRM">Sent from CRM</option>
                      <option value="Received">Received</option>
                      <option value="Opened">Opened</option>
                    </select>
                    <Ghost onClick={() => openComposeEmail(mailTab)}>Compose Email</Ghost>
                  </div>
                }
              >
                <div className="flex gap-5 px-4 text-[14px] border-b border-[#EEF1F7]">
                  {['Mails', 'Drafts', 'Scheduled'].map((t) => (
                    <button key={t} type="button" onClick={() => setMailTab(t)} className={`h-10 ${mailTab === t ? 'font-semibold border-b-2 border-[#2F55D4]' : 'text-[#4B5578]'}`}>
                      {t} <span className="text-[12px] bg-[#E8ECF5] rounded-full px-1.5">{(lead.emails || []).filter((e) => (e.tab || 'Mails') === t).length}</span>
                    </button>
                  ))}
                </div>
                {leadEmails.length === 0 ? (
                  <div className="text-center py-3 text-[14px] text-[#8B95AE]">No records found</div>
                ) : (
                  leadEmails.map((em) => (
                    <div key={em.id} className="px-4 py-2.5 text-[14px] border-b border-[#EEF1F7] flex items-center justify-between hover:bg-[#F6F8FD]">
                      <div>
                        <div className="font-medium text-[#1F2A44]">{em.subject}</div>
                        <div className="text-[12.5px] text-[#6B7696]">From: {em.from || 'sibi@crm.in'} • To: {em.to} • {em.date}</div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#2F55D4] text-[12px] font-medium">{em.status}</span>
                    </div>
                  ))
                )}
              </Card>

              {/* Section 7: Attachments with Attach ▼ dropdown (Upload File, Zoho WorkDrive, Other Cloud Drives, Link URL) */}
              <Card
                id="sec-attach"
                title="Attachments"
                action={
                  <div className="relative">
                    <Ghost onClick={() => setAttachMenuOpen((o) => !o)}>
                      Attach <ChevronDown size={11} />
                    </Ghost>
                    {attachMenuOpen && (
                      <div className="absolute right-0 top-8 z-30 w-48 bg-white border border-[#D5DBE8] rounded-md shadow-lg py-1 text-[14px]">
                        {[
                          { label: 'Upload File', icon: Upload },
                          { label: 'Zoho WorkDrive', icon: Cloud },
                          { label: 'Other Cloud Drives', icon: Cloud },
                          { label: 'Link (URL)', icon: Link2 },
                        ].map((opt) => {
                          const Icon = opt.icon;
                          return (
                            <button
                              key={opt.label}
                              type="button"
                              onClick={() => {
                                setAttachMenuOpen(false);
                                setAttachSource(opt.label);
                                setAttachModalOpen(true);
                              }}
                              className="w-full px-3 py-1.5 text-left hover:bg-[#F3F6FB] text-[#1F2A44] flex items-center gap-2"
                            >
                              <Icon size={13} className="text-[#2F55D4]" /> {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                }
              >
                {leadAttachments.length === 0 ? (
                  <Empty t="No Attachment" />
                ) : (
                  leadAttachments.map((att) => (
                    <div key={att.id} className="px-4 py-2.5 text-[14px] border-t border-[#EEF1F7] first:border-0 flex items-center justify-between hover:bg-[#F6F8FD]">
                      <div className="flex items-center gap-2">
                        <Paperclip size={13} className="text-[#2F55D4]" />
                        <span className="font-medium text-[#1F2A44]">{att.fileName}</span>
                        <span className="text-[12px] text-[#8B95AE]">
                          ({att.size}{att.source ? ` • ${att.source}` : ''}) — {att.attachedBy}, {att.date}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[13px]">
                        <button
                          type="button"
                          onClick={() => setPreviewAttachment(att)}
                          className="text-[#2F55D4] hover:underline inline-flex items-center gap-1"
                        >
                          <Eye size={13} /> Preview
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const blob = new Blob([`Attachment: ${att.fileName}\nLead: ${lead.name}\nNotes: ${att.notes || 'N/A'}`], { type: 'text/plain;charset=utf-8' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = att.fileName || 'attachment.txt';
                            a.click();
                            URL.revokeObjectURL(url);
                            toast.success(`Downloaded ${att.fileName}`);
                          }}
                          className="text-emerald-700 hover:underline inline-flex items-center gap-1"
                        >
                          <Download size={13} /> Download
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            updateRecord('leads', lead.id, { attachments: leadAttachments.filter((x) => x.id !== att.id), _silentActivity: true });
                            toast.info('Attachment removed');
                          }}
                          className="text-rose-600 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </Card>

              {/* Section 8: Zoho Survey (Create Survey, Send Survey, Take Survey) */}
              <Card id="sec-survey" title="Zoho Survey">
                <div className="px-4 py-3 text-[14px] text-[#8B95AE] flex flex-wrap items-center gap-2">
                  {leadSurveys.length === 0 && <span>No records found</span>}
                  <Ghost onClick={() => { setSurveyModalMode('Create Survey'); setSurveyModalOpen(true); }}>Create Survey</Ghost>
                  <Ghost onClick={() => { setSurveyModalMode('Send Survey'); setSurveyModalOpen(true); }}>Send Survey</Ghost>
                  <Ghost onClick={() => { setSurveyModalMode('Take Survey'); setSurveyModalOpen(true); }}>Take Survey</Ghost>
                </div>
                {leadSurveys.map((s) => (
                  <div key={s.id} className="px-4 py-2.5 text-[14px] border-t border-[#EEF1F7] flex items-center justify-between">
                    <div>
                      <b>{s.title}</b> <span className="text-[#8B95AE]">— {s.mode} by {s.sentBy} on {s.date}</span>
                      {s.surveyLink && (
                        <div className="text-[12.5px] text-[#2F55D4] truncate max-w-md">{s.displayText ? `${s.displayText}: ` : ''}{s.surveyLink}</div>
                      )}
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[12px] font-medium">{s.status}</span>
                  </div>
                ))}
              </Card>

              {/* ZohoSign Documents */}
              <Card
                id="sec-sign"
                title="ZohoSign Documents"
                action={
                  <span className="flex gap-2">
                    <Ghost onClick={() => { setSignForm({ name: 'Master Service Agreement.pdf', recipient: lead.email || lead.name, status: 'Assigned' }); setSignModalOpen(true); }}>Assign</Ghost>
                    <Ghost onClick={() => { setSignForm({ name: 'Non-Disclosure Agreement (NDA).pdf', recipient: lead.email || lead.name, status: 'Sent for Signature' }); setSignModalOpen(true); }}>New</Ghost>
                  </span>
                }
              >
                {leadSignDocs.length === 0 ? (
                  <Empty />
                ) : (
                  leadSignDocs.map((d) => (
                    <div key={d.id} className="px-4 py-2.5 text-[14px] border-t border-[#EEF1F7] first:border-0 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-[#2F55D4]" />
                        <span className="font-medium text-[#1F2A44]">{d.name}</span>
                        <span className="text-[#8B95AE] text-[12.5px]">Recipient: {d.recipient} ({d.sentOn})</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2F55D4] text-[12px] font-medium">{d.status}</span>
                    </div>
                  ))
                )}
              </Card>

              {/* Messages */}
              <Card id="sec-messages" title="Messages" action={<Ghost onClick={() => openWhatsAppModal('WhatsApp to Mobile')}>Send Message</Ghost>}>
                <table className="w-full text-[14px]">
                  <thead>
                    <tr className="text-left text-[#1F2A44] text-[13.5px] border-b border-[#EEF1F7]">
                      <th className="px-4 h-9 w-10" />
                      <th className="h-9 font-semibold">Messages</th>
                      <th className="h-9 font-semibold w-40">Date</th>
                      <th className="h-9 font-semibold w-44">Messaged Via</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leadMessages.map((msg, i) => (
                      <tr
                        key={msg.id || i}
                        onClick={() => setSelectedMessage(msg)}
                        className="border-b border-[#EEF1F7] last:border-0 hover:bg-[#F6F8FD] cursor-pointer"
                      >
                        <td className="px-4 py-2.5 text-[#6B7696]">↩</td>
                        <td className="py-2.5 pr-4 truncate max-w-[640px]">{msg.text}</td>
                        <td className="py-2.5">{msg.date || lead.createdTime || ''}</td>
                        <td className="py-2.5">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="h-5 w-5 rounded bg-[#1DB54A] inline-flex items-center justify-center">
                              <Phone size={11} className="text-white" />
                            </span>
                            {msg.via || 'WhatsApp'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>

              {/* Configurable Related Lists: Notes, Campaigns, Products, and any newly selected or custom lists */}
              {extraRelatedLists.includes('Notes') && (
                <Card id="sec-rel-Notes" title="Notes" action={<Ghost onClick={() => setNoteModalOpen(true)}>Add Note</Ghost>}>
                  {(lead.notes || []).length === 0 ? (
                    <Empty />
                  ) : (
                    (lead.notes || []).map((n) => (
                      <div key={n.id} className="px-4 py-2 text-[12.5px] border-t border-[#EEF1F7] first:border-0">
                        <div className="font-semibold text-[#1F2A44]">{n.title}</div>
                        <div className="text-[#2A3350]">{n.content}</div>
                        <div className="text-[11px] text-[#8B95AE] mt-0.5">{n.by} • {n.date}</div>
                      </div>
                    ))
                  )}
                </Card>
              )}

              {extraRelatedLists.includes('Campaigns') && (
                <Card id="sec-rel-Campaigns" title="Campaigns" action={<Ghost onClick={() => setCampaignModalOpen(true)}>Add Campaign</Ghost>}>
                  {(lead.campaigns || []).length === 0 ? (
                    <Empty />
                  ) : (
                    (lead.campaigns || []).map((c) => (
                      <div key={c.id} className="px-4 py-2 text-[12.5px] border-t border-[#EEF1F7] first:border-0 flex items-center justify-between">
                        <div>
                          <b>{c.name}</b> <span className="text-[#6B7696]">({c.type})</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium">{c.status}</span>
                      </div>
                    ))
                  )}
                </Card>
              )}

              {extraRelatedLists.includes('Products') && (
                <Card id="sec-rel-Products" title="Products">
                  {(lead.products || []).length === 0 ? (
                    <Empty />
                  ) : (
                    (lead.products || []).map((p) => (
                      <div key={p.id} className="px-4 py-2 text-[12.5px] border-t border-[#EEF1F7] first:border-0 flex items-center justify-between">
                        <div><b>{p.name}</b> <span className="text-[#6B7696]">— {p.category}</span></div>
                        <span className="font-medium text-[#1F2A44]">₹ {(p.unitPrice || 45000).toLocaleString('en-IN')}</span>
                      </div>
                    ))
                  )}
                </Card>
              )}

              {extraRelatedLists
                .filter((name) => !['Notes', 'Campaigns', 'Products'].includes(name))
                .map((name) => (
                  <Card key={name} id={`sec-rel-${name.replace(/[^a-z0-9]/gi, '')}`} title={name}>
                    <Empty t={`No records associated in ${name}`} />
                  </Card>
                ))}

              {customRelatedSections.map((cs, i) => (
                <Card
                  key={i}
                  id={`sec-custom-${cs.name.replace(/[^a-z0-9]/gi, '')}`}
                  title={`${cs.name} (${cs.category})`}
                >
                  <div className="px-4 py-3 text-[12.5px] text-[#2A3350]">
                    Active {cs.category} block connected to <b>{cs.source}</b> for {lead.name}.
                  </div>
                </Card>
              ))}

              <div className="flex items-center justify-between mt-2 mb-6 flex-wrap gap-2">
                <Btn primary className="!h-8 !px-4" onClick={() => setAddRelatedModalOpen(true)}>Add Related List</Btn>
                <div className="flex items-center gap-3 text-[12px] text-[#4B5578]">
                  Record detail page views :
                  <select className="h-8 border border-[#D5DBE8] rounded bg-white px-2 text-[12px]">
                    <option>Standard View</option>
                    <option>Comprehensive View</option>
                  </select>
                  <Btn className="!h-8" onClick={() => navigate(`/leads/${lead.id}/edit`)}>Create a custom record page</Btn>
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
                  <div className="flex items-center justify-between mb-3 text-[12.5px] flex-wrap gap-2">
                    <div className="inline-flex items-center gap-2">
                      <span className="font-semibold inline-flex items-center gap-1.5">Timeline History <Filter size={12} className="text-[#4B5578]" /></span>
                      <select
                        value={timelineFilter}
                        onChange={(e) => setTimelineFilter(e.target.value)}
                        className="h-6 px-2 rounded border border-[#D5DBE8] bg-white text-[11.5px]"
                      >
                        <option value="All">All Activity ({acts.length})</option>
                        <option value="Calls">Calls</option>
                        <option value="Emails">Emails</option>
                        <option value="Tasks">Tasks & Meetings</option>
                        <option value="Updates">Status & Field Updates</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowUpcomingActions((s) => !s)}
                      className="text-[#2F55D4] hover:underline"
                    >
                      {showUpcomingActions ? 'Hide Upcoming Automated Actions' : 'Show Upcoming Automated Actions'}
                    </button>
                  </div>

                  {showUpcomingActions && (
                    <div className="mb-3 p-3 rounded border border-blue-200 bg-blue-50/60 text-[12px] space-y-1">
                      <div className="font-semibold text-[#1F2A44]">Scheduled Workflow & Cadence Actions</div>
                      <div className="text-[#4B5578]">• Cadence ({lead.cadence || 'Inbound Lead Cadence'}): Follow-up reminder scheduled for {lead.followUpDate || todayISO()}</div>
                      <div className="text-[#4B5578]">• Automated Lead Scoring Evaluation: Active (Score {lead.visitorScore ?? lead.score ?? 75})</div>
                    </div>
                  )}

                  {history.length === 0 && <Empty />}
                  {history.map((a, i) => (
                    <div key={i} className="flex gap-3 py-2 text-[12.5px] border-b border-[#F3F5FA] last:border-0">
                      <div className="w-[110px] shrink-0 text-[#6B7696] text-[11.5px]">{a.date}</div>
                      <div className="h-2 w-2 rounded-full bg-[#2F55D4] mt-1.5 shrink-0" />
                      <div>
                        <b>{a.type}</b> — {a.desc}
                        <div className="text-[11.5px] text-[#8B95AE]">by {a.by}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-3">
                  <div className="font-semibold text-[12.5px] mb-3">Customer Interactions ({allInteractions.length})</div>
                  {allInteractions.length === 0 && <Empty t="No interactions yet" />}
                  {allInteractions.map((a, i) => (
                    <div key={i} className="mb-3 max-w-[520px] rounded border border-[#BFD0F5] bg-[#EEF3FF] px-3 py-2 text-[12.5px]">
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded-full bg-[#2F55D4] inline-flex items-center justify-center shrink-0">
                          <Phone size={10} className="text-white" />
                        </span>
                        <span className="font-semibold text-[#1F2A44]">[{a.kind}]</span>
                        <span>{a.title}</span>
                      </div>
                      <div className="text-[11.5px] text-[#6B7696] mt-0.5">by {a.by} on {a.date}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Lead Modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Lead"
        size="lg"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setEditOpen(false)}>Cancel</button>
            <button type="button" className="btn-primary" onClick={saveEdit}>Save</button>
          </>
        }
      >
        <div className="grid sm:grid-cols-2 gap-3 text-[12.5px] max-h-[65vh] overflow-y-auto thin-scroll pr-1">
          {[
            ['name', 'Lead Name'],
            ['company', 'Company'],
            ['clientName', 'Client Name'],
            ['mobile', 'Mobile'],
            ['phoneAlt', 'Phone'],
            ['email', 'Email'],
            ['productName', 'Product Name'],
            ['category', 'Category'],
            ['city', 'City'],
            ['state', 'State'],
            ['country', 'Country'],
            ['zip', 'Zip Code'],
            ['branchArea', 'Branch Area'],
            ['street', 'Street'],
            ['sourceLang', 'Source Lang'],
            ['targetLang', 'Target Lang'],
            ['workingHours', 'Working hours'],
            ['websiteSource', 'Website Source'],
          ].map(([k, label]) => (
            <label key={k} className="text-[#4B5578]">
              {label}
              <input className="input mt-1" value={form[k] ?? ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
            </label>
          ))}
          <label className="text-[#4B5578]">
            Lead Status
            <select className="input mt-1" value={form.status || 'New'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="text-[#4B5578]">
            Lead Source
            <select className="input mt-1" value={form.source || 'Website'} onChange={(e) => setForm({ ...form, source: e.target.value })}>
              {LEAD_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="text-[#4B5578]">
            Lead Owner
            <select className="input mt-1" value={form.ownerId || 'u4'} onChange={(e) => setForm({ ...form, ownerId: e.target.value })}>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </label>
          <label className="text-[#4B5578]">
            Tag
            <select className="input mt-1" value={form.tag || 'Lead'} onChange={(e) => setForm({ ...form, tag: e.target.value })}>
              {LEAD_TAGS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="text-[#4B5578]">
            Lead CEO Approval
            <select className="input mt-1" value={form.ceoApproval || 'Pending'} onChange={(e) => setForm({ ...form, ceoApproval: e.target.value })}>
              {['None', 'Pending', 'Approved', 'Rejected'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="text-[#4B5578]">
            Performance
            <select className="input mt-1" value={form.performance || 'Good'} onChange={(e) => setForm({ ...form, performance: e.target.value })}>
              {['None', 'Excellent', 'Good', 'Average', 'Poor'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="text-[#4B5578] sm:col-span-2">
            Remarks
            <textarea className="input mt-1 !h-16 py-2" value={form.remarks || ''} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
          </label>
          <label className="text-[#4B5578] sm:col-span-2">
            Comments
            <textarea className="input mt-1 !h-16 py-2" value={form.comments || ''} onChange={(e) => setForm({ ...form, comments: e.target.value })} />
          </label>
          <label className="text-[#4B5578] sm:col-span-2">
            Description
            <textarea className="input mt-1 !h-16 py-2" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>
        </div>
      </Modal>

      {/* Section 6: Rich Zoho Email Composer Window */}
      <ZohoEmailComposerModal
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        lead={lead}
        ownerName={owner}
        initialMode={emailForm.mode}
        onSendEmail={handleSendEmailPayload}
        onNotify={notify}
      />

      {/* Log / Schedule Call Modal */}
      <Modal
        open={callModalOpen}
        onClose={() => setCallModalOpen(false)}
        title={`Call ${lead.name}`}
        size="md"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setCallModalOpen(false)}>Cancel</button>
            <button type="button" className="btn-primary" onClick={handleSaveCall}>Save Call</button>
          </>
        }
      >
        <div className="space-y-3 text-[12.5px]">
          <div className="grid grid-cols-3 gap-3">
            <label className="block text-[#4B5578]">
              Call Type
              <select className="input mt-1" value={callForm.type} onChange={(e) => setCallForm({ ...callForm, type: e.target.value })}>
                <option value="Outbound">Outbound</option>
                <option value="Inbound">Inbound</option>
              </select>
            </label>
            <label className="block text-[#4B5578]">
              Status
              <select className="input mt-1" value={callForm.status} onChange={(e) => setCallForm({ ...callForm, status: e.target.value })}>
                <option value="Completed">Completed</option>
                <option value="Scheduled">Scheduled</option>
              </select>
            </label>
            <label className="block text-[#4B5578]">
              Duration (Mins)
              <input type="number" className="input mt-1" value={callForm.durationMin} onChange={(e) => setCallForm({ ...callForm, durationMin: e.target.value })} />
            </label>
          </div>
          <label className="block text-[#4B5578]">
            Subject
            <input className="input mt-1" value={callForm.subject} onChange={(e) => setCallForm({ ...callForm, subject: e.target.value })} />
          </label>
          <label className="block text-[#4B5578]">
            Call Result
            <select className="input mt-1" value={callForm.callResult} onChange={(e) => setCallForm({ ...callForm, callResult: e.target.value })}>
              <option>Interested — Quotation Requested</option>
              <option>Contacted — Requirement Qualified</option>
              <option>Requested Callback Later</option>
              <option>No Answer / Busy</option>
              <option>Not Interested</option>
            </select>
          </label>
          <label className="block text-[#4B5578]">
            Call Notes / Description
            <textarea className="input mt-1 !h-20 py-2" value={callForm.desc} onChange={(e) => setCallForm({ ...callForm, desc: e.target.value })} />
          </label>
        </div>
      </Modal>

      {/* Call Record Detail Modal (when clicking a row in Closed Activities -> Calls) */}
      <Modal
        open={!!selectedCallDetail}
        onClose={() => setSelectedCallDetail(null)}
        title={selectedCallDetail?.subject || 'Call Record Details'}
        size="md"
        footer={<button type="button" className="btn-primary" onClick={() => setSelectedCallDetail(null)}>Close</button>}
      >
        {selectedCallDetail && (
          <div className="space-y-2.5 text-[13px]">
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-lg bg-[#F8FAFD] border border-[#E3E8F2]">
              <div><span className="text-[#6B7696] block text-[11.5px]">Subject</span><b>{selectedCallDetail.subject}</b></div>
              <div><span className="text-[#6B7696] block text-[11.5px]">Call Start Time</span><b>{selectedCallDetail.callStartTime}</b></div>
              <div><span className="text-[#6B7696] block text-[11.5px]">Call Owner</span><b>{selectedCallDetail.callOwner}</b></div>
              <div><span className="text-[#6B7696] block text-[11.5px]">Call Result</span><b className="text-emerald-700">{selectedCallDetail.callResult}</b></div>
              <div><span className="text-[#6B7696] block text-[11.5px]">To Number</span><b>{selectedCallDetail.toNumber}</b></div>
              <div><span className="text-[#6B7696] block text-[11.5px]">Created Time</span><b>{selectedCallDetail.createdTime}</b></div>
            </div>
            <div className="p-3 rounded border border-[#E3E8F2] bg-white">
              <div className="text-[11.5px] text-[#6B7696] mb-1">Description / Call Summary</div>
              <div className="text-[#1F2A44]">{selectedCallDetail.description}</div>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Open Activity Modal */}
      <Modal
        open={activityModalOpen}
        onClose={() => setActivityModalOpen(false)}
        title="Add New Activity"
        size="sm"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setActivityModalOpen(false)}>Cancel</button>
            <button type="button" className="btn-primary" onClick={handleAddActivity}>Save Activity</button>
          </>
        }
      >
        <div className="space-y-3 text-[12.5px]">
          <label className="block text-[#4B5578]">
            Activity Type
            <select className="input mt-1" value={activityForm.type} onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value })}>
              <option value="Task">Task</option>
              <option value="Meeting">Meeting</option>
              <option value="Call Scheduled">Call Scheduled</option>
            </select>
          </label>
          <label className="block text-[#4B5578]">
            Subject / Description
            <input className="input mt-1" placeholder="e.g. Send quotation & SLA terms" value={activityForm.desc} onChange={(e) => setActivityForm({ ...activityForm, desc: e.target.value })} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-[#4B5578]">
              Due Date
              <input type="date" className="input mt-1" value={activityForm.date} onChange={(e) => setActivityForm({ ...activityForm, date: e.target.value })} />
            </label>
            <label className="block text-[#4B5578]">
              Status
              <select className="input mt-1" value={activityForm.status} onChange={(e) => setActivityForm({ ...activityForm, status: e.target.value })}>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </label>
          </div>
        </div>
      </Modal>

      {/* Activity Detail / Complete Modal */}
      <Modal
        open={!!selectedActivity}
        onClose={() => setSelectedActivity(null)}
        title={selectedActivity?.type || 'Activity Detail'}
        size="sm"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setSelectedActivity(null)}>Close</button>
            {selectedActivity && (
              <button type="button" className="btn-primary" onClick={() => handleToggleActivityStatus(selectedActivity)}>
                <CheckCircle2 size={14} /> {selectedActivity.status === 'Completed' ? 'Reopen Activity' : 'Mark Completed'}
              </button>
            )}
          </>
        }
      >
        {selectedActivity && (
          <div className="space-y-2 text-[12.5px]">
            <div><b>Type:</b> {selectedActivity.type}</div>
            <div><b>Description:</b> {selectedActivity.desc}</div>
            <div><b>Owner:</b> {selectedActivity.by}</div>
            <div><b>Date:</b> {selectedActivity.date}</div>
            <div><b>Status:</b> {selectedActivity.status || 'Open'}</div>
            {selectedActivity.callId && (
              <button
                type="button"
                onClick={() => navigate(`/calls?open=${selectedActivity.callId}`, { state: { from: `/leads/${lead.id}` } })}
                className="text-[#2F55D4] hover:underline font-medium inline-flex items-center gap-1 pt-1"
              >
                <ExternalLink size={12} /> Open in Calls Module
              </button>
            )}
          </div>
        )}
      </Modal>

      {/* Section 7: Attach Document / Cloud Drive / Link URL Modal */}
      <Modal
        open={attachModalOpen}
        onClose={() => setAttachModalOpen(false)}
        title={`Attach — ${attachSource}`}
        size="sm"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setAttachModalOpen(false)}>Cancel</button>
            <button type="button" className="btn-primary" onClick={handleAddAttachment}>Attach</button>
          </>
        }
      >
        <div className="space-y-3 text-[12.5px]">
          {attachSource === 'Upload File' && (
            <label className="block text-[#4B5578]">
              Select Local File (Max 15 MB)
              <input
                type="file"
                className="block w-full text-[11.5px] text-slate-500 mt-1 mb-2"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setUploadProgress(100);
                    setAttachForm({ ...attachForm, fileName: f.name, size: `${Math.max(1, Math.round(f.size / 1024))} KB` });
                  }
                }}
              />
              {uploadProgress > 0 && (
                <div className="w-full h-1.5 bg-[#E3E8F2] rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-emerald-600 transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              )}
              <input
                className="input"
                placeholder="e.g. Source_Certificate_Scan.pdf"
                value={attachForm.fileName}
                onChange={(e) => setAttachForm({ ...attachForm, fileName: e.target.value })}
              />
            </label>
          )}

          {(attachSource === 'Zoho WorkDrive' || attachSource === 'Other Cloud Drives') && (
            <label className="block text-[#4B5578]">
              Select File from {attachSource}
              <select
                className="input mt-1"
                value={attachForm.fileName}
                onChange={(e) => setAttachForm({ ...attachForm, fileName: e.target.value, size: '410 KB' })}
              >
                <option value="">-- Select Cloud Document --</option>
                <option value="HTS_ISO_Certificate_2026.pdf">HTS_ISO_Certificate_2026.pdf (410 KB)</option>
                <option value="Enterprise_Rate_Card_2026.xlsx">Enterprise_Rate_Card_2026.xlsx (185 KB)</option>
                <option value="Client_Glossary_German_EN.docx">Client_Glossary_German_EN.docx (320 KB)</option>
              </select>
            </label>
          )}

          {attachSource === 'Link (URL)' && (
            <label className="block text-[#4B5578]">
              External Document URL
              <input
                className="input mt-1"
                placeholder="https://workdrive.zoho.in/file/..."
                value={attachForm.url}
                onChange={(e) => setAttachForm({ ...attachForm, url: e.target.value, fileName: e.target.value })}
              />
            </label>
          )}

          <label className="block text-[#4B5578]">
            Notes
            <input className="input mt-1" value={attachForm.notes} onChange={(e) => setAttachForm({ ...attachForm, notes: e.target.value })} />
          </label>
        </div>
      </Modal>

      {/* Preview Attachment Modal */}
      <Modal
        open={!!previewAttachment}
        onClose={() => setPreviewAttachment(null)}
        title={`Attachment Preview — ${previewAttachment?.fileName || ''}`}
        size="sm"
        footer={<button type="button" className="btn-primary" onClick={() => setPreviewAttachment(null)}>Close Preview</button>}
      >
        {previewAttachment && (
          <div className="space-y-2 text-[12.5px]">
            <div className="p-3 rounded bg-[#F8FAFD] border border-[#E3E8F2] space-y-1">
              <div><b>File Name:</b> {previewAttachment.fileName}</div>
              <div><b>Size / Source:</b> {previewAttachment.size} ({previewAttachment.source || 'Upload File'})</div>
              <div><b>Attached By:</b> {previewAttachment.attachedBy} on {previewAttachment.date}</div>
              {previewAttachment.notes && <div><b>Notes:</b> {previewAttachment.notes}</div>}
            </div>
          </div>
        )}
      </Modal>

      {/* Section 8: Zoho Survey Modal (Send Survey / Take Survey / Create Survey) */}
      <ZohoSurveyModal
        open={surveyModalOpen}
        mode={surveyModalMode}
        onClose={() => setSurveyModalOpen(false)}
        lead={lead}
        ownerName={owner}
        customSurveys={customSurveysCatalog}
        onCreateSurveyCatalogItem={(item) => setCustomSurveysCatalog((prev) => [...prev, item])}
        onSaveLeadSurveyRecord={handleSaveLeadSurveyRecord}
        onNotify={notify}
      />

      {/* ZohoSign Document Modal */}
      <Modal
        open={signModalOpen}
        onClose={() => setSignModalOpen(false)}
        title="ZohoSign Document"
        size="sm"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setSignModalOpen(false)}>Cancel</button>
            <button type="button" className="btn-primary" onClick={handleSaveSignDoc}>Send via ZohoSign</button>
          </>
        }
      >
        <div className="space-y-3 text-[12.5px]">
          <label className="block text-[#4B5578]">
            Document Name
            <input className="input mt-1" value={signForm.name} onChange={(e) => setSignForm({ ...signForm, name: e.target.value })} />
          </label>
          <label className="block text-[#4B5578]">
            Recipient Email / Name
            <input className="input mt-1" value={signForm.recipient} onChange={(e) => setSignForm({ ...signForm, recipient: e.target.value })} />
          </label>
          <label className="block text-[#4B5578]">
            Status
            <select className="input mt-1" value={signForm.status} onChange={(e) => setSignForm({ ...signForm, status: e.target.value })}>
              <option value="Sent for Signature">Sent for Signature</option>
              <option value="Assigned">Assigned</option>
              <option value="Signed & Completed">Signed & Completed</option>
            </select>
          </label>
        </div>
      </Modal>

      {/* Send WhatsApp Modal */}
      <Modal
        open={waModalOpen}
        onClose={() => setWaModalOpen(false)}
        title={`${waForm.channel} — ${lead.name}`}
        size="sm"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setWaModalOpen(false)}>Cancel</button>
            <button type="button" className="btn-primary" onClick={handleSendWhatsApp}>Send WhatsApp</button>
          </>
        }
      >
        <div className="space-y-3 text-[12.5px]">
          <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-900">
            Recipient: <b>{lead.mobile || lead.phone}</b>
          </div>
          <label className="block text-[#4B5578]">
            Message
            <textarea className="input mt-1 !h-24 py-2" value={waForm.text} onChange={(e) => setWaForm({ ...waForm, text: e.target.value })} />
          </label>
        </div>
      </Modal>

      {/* Message Detail Modal */}
      <Modal
        open={!!selectedMessage}
        onClose={() => setSelectedMessage(null)}
        title="WhatsApp Message Detail"
        size="sm"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setSelectedMessage(null)}>Close</button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setSelectedMessage(null);
                openWhatsAppModal('WhatsApp Reply');
              }}
            >
              Reply via WhatsApp
            </button>
          </>
        }
      >
        {selectedMessage && (
          <div className="space-y-2 text-[12.5px]">
            <div><b>Channel:</b> {selectedMessage.via || 'WhatsApp'}</div>
            <div><b>Date:</b> {selectedMessage.date || lead.createdTime}</div>
            <div className="p-3 rounded bg-[#F6F8FC] border border-[#E3E8F2] text-[#1F2A44]">{selectedMessage.text}</div>
          </div>
        )}
      </Modal>

      {/* Add Note Modal */}
      <Modal
        open={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
        title="Add Note"
        size="sm"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setNoteModalOpen(false)}>Cancel</button>
            <button type="button" className="btn-primary" onClick={handleSaveNote}>Save Note</button>
          </>
        }
      >
        <div className="space-y-3 text-[12.5px]">
          <label className="block text-[#4B5578]">
            Title
            <input className="input mt-1" placeholder="Note title..." value={noteForm.title} onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })} />
          </label>
          <label className="block text-[#4B5578]">
            Note Content
            <textarea className="input mt-1 !h-24 py-2" placeholder="Enter details..." value={noteForm.content} onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })} />
          </label>
        </div>
      </Modal>

      {/* Add Campaign Modal */}
      <Modal
        open={campaignModalOpen}
        onClose={() => setCampaignModalOpen(false)}
        title="Associate Campaign"
        size="sm"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setCampaignModalOpen(false)}>Cancel</button>
            <button type="button" className="btn-primary" onClick={handleSaveCampaign}>Save Campaign</button>
          </>
        }
      >
        <div className="space-y-3 text-[12.5px]">
          <label className="block text-[#4B5578]">
            Campaign Name
            <input className="input mt-1" placeholder="e.g. Q4 Enterprise Webinar" value={campaignForm.name} onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })} />
          </label>
          <label className="block text-[#4B5578]">
            Campaign Type
            <select className="input mt-1" value={campaignForm.type} onChange={(e) => setCampaignForm({ ...campaignForm, type: e.target.value })}>
              {CAMPAIGN_TYPES.filter((c) => c !== '-Select Campaign Type-').map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="block text-[#4B5578]">
            Status
            <select className="input mt-1" value={campaignForm.status} onChange={(e) => setCampaignForm({ ...campaignForm, status: e.target.value })}>
              {['Active', 'Planning', 'Complete', 'Inactive'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </div>
      </Modal>

      {/* Section 12: 7-Tab Add Related List Modal */}
      <AddRelatedListModal
        open={addRelatedModalOpen}
        onClose={() => setAddRelatedModalOpen(false)}
        extraRelatedLists={extraRelatedLists}
        onToggleRelatedList={(name) =>
          setExtraRelatedLists((prev) =>
            prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
          )
        }
        onAddCustomRelatedSection={(sec) => setCustomRelatedSections((prev) => [...prev, sec])}
        onNotify={notify}
      />

      {/* Section 9: 20-Item More (•••) Action Modal */}
      <LeadMoreActionModal
        actionKey={moreActionKey}
        onClose={() => setMoreActionKey(null)}
        lead={lead}
        leads={leads}
        users={users}
        ownerName={owner}
        updateRecord={updateRecord}
        createRecord={createRecord}
        onAddCustomHeaderButton={(btn) => setCustomHeaderButtons((prev) => [...prev, btn])}
        businessCardFields={zohoCustomConfig.businessCardFields}
        onUpdateBusinessCardFields={(fields) => updateZohoCustomConfig({ businessCardFields: fields })}
        onNotify={notify}
      />

      {/* Add Custom Link Modal */}
      <Modal
        open={addLinkModalOpen}
        onClose={() => setAddLinkModalOpen(false)}
        title="Add Custom Link"
        size="sm"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setAddLinkModalOpen(false)}>Cancel</button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                if (!newLinkForm.label.trim()) return;
                setCustomLinks((prev) => [...prev, { label: newLinkForm.label.trim(), url: newLinkForm.url.trim() || 'https://crm.zoho.com' }]);
                setNewLinkForm({ label: '', url: '' });
                setAddLinkModalOpen(false);
                toast.success('Custom link added');
              }}
            >
              Add Link
            </button>
          </>
        }
      >
        <div className="space-y-3 text-[12.5px]">
          <label className="block text-[#4B5578]">
            Link Label
            <input className="input mt-1" placeholder="e.g. Company LinkedIn" value={newLinkForm.label} onChange={(e) => setNewLinkForm({ ...newLinkForm, label: e.target.value })} />
          </label>
          <label className="block text-[#4B5578]">
            URL
            <input className="input mt-1" placeholder="https://..." value={newLinkForm.url} onChange={(e) => setNewLinkForm({ ...newLinkForm, url: e.target.value })} />
          </label>
        </div>
      </Modal>

      {/* Locate Map Modal */}
      <Modal
        open={mapModalOpen}
        onClose={() => setMapModalOpen(false)}
        title={`Address Location — ${lead.name}`}
        size="sm"
        footer={<button type="button" className="btn-primary" onClick={() => setMapModalOpen(false)}>Close</button>}
      >
        <div className="space-y-2 text-[12.5px]">
          <div className="p-3 rounded bg-[#F3F6FB] border border-[#D5DBE8]">
            <div className="font-semibold text-[#1F2A44]">{lead.street || lead.address || 'Main Branch'}</div>
            <div className="text-[#4B5578]">{lead.branchArea ? `${lead.branchArea}, ` : ''}{lead.city || 'Chennai'}, {lead.state || 'Tamil Nadu'} {lead.zip || ''}</div>
            <div className="text-[#6B7696]">{lead.country || 'India'}</div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => {
          deleteRecord('leads', lead.id);
          toast.info('Lead deleted');
          navigate(backTarget);
        }}
        title="Delete Lead"
        message={`Are you sure you want to permanently delete "${lead.name}"?`}
      />
    </div>
  );
}
