import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Clock, FileText, Info, Paperclip, Trash2, Upload, UserCheck, UserPlus, X,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useToast } from '../../components/common/Toast';
import { todayISO } from '../../utils/calculations';

const TIME_SLOTS = [
  '08:00 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
  '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM',
];

const SALUTATIONS = ['-None-', 'Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.'];
const CEO_APPROVALS = ['-None-', 'Approved', 'Pending', 'Rejected'];
const READ_STATUSES = [
  { value: 'Unread', label: 'Unread', dot: '#EF4444' },
  { value: 'Read', label: 'Read', dot: '#10B981' },
  { value: 'Working', label: 'Working', dot: '#F59E0B' },
  { value: 'Contacted', label: 'Contacted', dot: '#2F7BF5' },
];
const LEAD_STATUS_OPTIONS = ['-None-', 'New', 'Assigned', 'Contacted', 'Qualified', 'Proposal', 'Converted', 'Lost'];
const LEAD_SOURCE_OPTIONS = [
  'Existing Client', 'Website', 'Justdial', 'Database call', 'Referral',
  'Social Media', 'Email Campaign', 'Cold Call', 'LinkedIn', 'Trade Show', 'Direct Contact',
];
const CATEGORY_OPTIONS = [
  'DTP Services', 'Translation Services', 'Attestation Services', 'Transcription Services',
  'Interpretation', 'Information Technology', 'Software', 'Consulting', 'Education',
  'Healthcare', 'Manufacturing', 'Retail', 'Logistics',
];
const TAG_OPTIONS = ['-None-', 'Lead', 'Hot Lead', 'Invalid Number', 'Not contactable', 'Junk', 'Job seeking', 'Duplicate', 'Product Demo'];
const PERFORMANCE_OPTIONS = ['-None-', 'Excellent', 'Good', 'Average', 'Below Average'];
const LANGUAGES = ['', 'English', 'Tamil', 'Hindi', 'Malayalam', 'Telugu', 'Kannada', 'French', 'German', 'Spanish', 'Arabic', 'Japanese'];

const rowCls = 'grid grid-cols-1 sm:grid-cols-[185px_1fr] items-center gap-2 sm:gap-4';
const labelCls = 'text-[13.5px] font-medium text-[#4B5578] sm:text-right select-none flex items-center sm:justify-end gap-1';
const inputCls = 'w-full h-[36px] px-3 rounded-md border border-[#CBD5E1] bg-white text-[13.5px] text-ink placeholder:text-ink-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition';

function FieldRow({ label, info, children, alignTop = false }) {
  return (
    <div className={`${rowCls} ${alignTop ? 'sm:items-start' : ''}`}>
      <label className={`${labelCls} ${alignTop ? 'sm:pt-2' : ''}`}>
        <span>{label}</span>
        {info && <Info size={13} className="text-ink-400 shrink-0" />}
      </label>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function fmtSize(bytes) {
  if (!bytes) return '12 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function LeadForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { leads = [], users = [], createRecord, updateRecord } = useCRM();
  const toast = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const existingLead = isEdit ? leads.find((l) => l.id === id) : null;

  const blankForm = () => ({
    assignedDate: todayISO(),
    assignedTimeSlot: '08:00 PM',
    ceoApproval: '-None-',
    ownerId: 'u4',
    departmentOwner: 'Marketing Department',
    allottedManagerId: '',
    clientName: '',
    justdialId: '',
    workflowCheckbox: false,
    leadManager1: '-None-',
    directCallDuration: '',
    whatsappCallDuration: '',
    salutation: '-None-',
    firstName: '',
    lastName: '',
    mobile: '',
    reopenLead: false,
    company: '',
    leadSource: 'Existing Client',
    productName: '',
    remarks: '',
    callAttemptCount: '',
    comments: '',
    readStatus: 'Unread',
    pushTime: '',
    date: todayISO(),
    dashboardReq: false,
    phone: '',
    email: '',
    status: 'New',
    category: '',
    callStartDate: todayISO(),
    callStartTimeSlot: '08:00 PM',
    websiteSource: '',
    checkbox1: false,
    tag: '-None-',
    sourceLang: '',
    targetLang: '',
    performance: '-None-',
    street: '',
    state: 'Tamil Nadu',
    country: 'India',
    city: 'Chennai',
    zip: '',
    branchArea: '',
    description: '',
    attachments: [],
  });

  const [form, setForm] = useState(blankForm);

  useEffect(() => {
    if (existingLead) {
      const parts = (existingLead.name || '').split(' ');
      setForm({
        ...blankForm(),
        ...existingLead,
        firstName: existingLead.firstName ?? parts[0] ?? '',
        lastName: existingLead.lastName ?? (parts.slice(1).join(' ') || parts[0] || ''),
        leadSource: existingLead.source || existingLead.leadSource || 'Existing Client',
        status: existingLead.status || 'New',
        category: existingLead.category || existingLead.industry || '',
        tag: existingLead.tag || '-None-',
        street: existingLead.street || existingLead.address || '',
        attachments: existingLead.attachments || [],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingLead?.id]);

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleAttachFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const added = files.map((file) => ({
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: file.name,
      size: fmtSize(file.size),
      type: file.type || 'application/octet-stream',
      addedBy: 'Sibi Chakaravarthi',
      addedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      url: URL.createObjectURL(file),
    }));
    setForm((prev) => ({ ...prev, attachments: [...(prev.attachments || []), ...added] }));
    toast.success(`${added.length} file(s) attached to lead`);
    e.target.value = '';
  };

  const removeAttachment = (attId) => {
    setForm((prev) => ({
      ...prev,
      attachments: (prev.attachments || []).filter((a) => a.id !== attId),
    }));
  };

  const saveLeadRecord = (andNew = false) => {
    const last = form.lastName.trim();
    const first = form.firstName.trim();
    if (!last && !first && !form.clientName.trim()) {
      toast.error('Please enter Last Name (or First Name / Client Name)');
      return;
    }

    const prefix = form.salutation && form.salutation !== '-None-' ? `${form.salutation} ` : '';
    const fullName = `${prefix}${first} ${last}`.trim() || form.clientName.trim() || 'New Lead';
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const todayFormatted = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

    const payload = {
      ...form,
      name: fullName,
      firstName: first,
      lastName: last || first,
      company: form.company || form.clientName || 'Enterprise Client',
      phone: form.phone || form.mobile || '+91 98765 43210',
      mobile: form.mobile || form.phone || '+91 98765 43210',
      source: form.leadSource === '-None-' ? 'Website' : form.leadSource,
      leadSource: form.leadSource === '-None-' ? 'Website' : form.leadSource,
      status: form.status === '-None-' ? 'New' : form.status,
      category: form.category || 'DTP Services',
      industry: form.category || 'Information Technology',
      tag: form.tag === '-None-' ? 'Lead' : form.tag,
      assignedTime: `${form.assignedDate || todayISO()} ${form.assignedTimeSlot || '08:00 PM'}`,
      callStartTime: `${form.callStartDate || todayISO()} ${form.callStartTimeSlot || '08:00 PM'}`,
      address: [form.street, form.branchArea, form.city, form.state, form.zip, form.country].filter(Boolean).join(', '),
      createdTime: existingLead?.createdTime || `${todayFormatted}, ${nowTime}`,
      createdOn: existingLead?.createdOn || todayISO(),
      ownerId: form.ownerId || 'u4',
      attachments: form.attachments || [],
    };

    if (isEdit && existingLead) {
      updateRecord('leads', existingLead.id, payload);
      toast.success(`Lead "${fullName}" updated successfully`);
      navigate(`/leads/${existingLead.id}`);
      return;
    }

    const created = createRecord('leads', {
      ...payload,
      leadNo: `LEAD-${1000 + leads.length + 1}`,
      score: 82,
      activities: [
        {
          type: 'Lead Created',
          desc: `Lead created in Zoho CRM (${payload.source})`,
          by: 'Sibi Chakaravarthi',
          date: `${todayFormatted} 2026 ${nowTime}`,
          status: 'Completed',
        },
      ],
    });

    toast.success(`Lead "${fullName}" created and workflow triggered!`);
    if (andNew) {
      setForm(blankForm());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate(`/leads/${created.id}`);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveLeadRecord(false);
  };

  const currentReadDot = READ_STATUSES.find((r) => r.value === form.readStatus)?.dot || '#EF4444';

  return (
    <form onSubmit={handleSubmit} className="-mx-3 sm:-mx-[18px] -mt-2.5 bg-white min-h-[calc(100vh-60px)] flex flex-col">
      {/* Zoho CRM Sticky Header Bar */}
      <div className="sticky top-[60px] z-20 bg-white border-b border-line px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(isEdit ? `/leads/${id}` : '/leads')}
            className="h-9 w-9 rounded-lg border border-line flex items-center justify-center text-ink-600 hover:bg-page"
            title="Back to Leads"
          >
            <ArrowLeft size={17} />
          </button>
          <div className="flex items-baseline gap-3">
            <h1 className="text-[18px] sm:text-[19px] font-bold text-ink tracking-tight">
              {isEdit ? `Edit Lead — ${existingLead?.name || ''}` : 'Create Lead'}
            </h1>
            <button
              type="button"
              onClick={() => toast.info('Standard Zoho CRM Lead Layout active')}
              className="text-[13px] font-medium text-primary hover:underline"
            >
              Edit Page Layout
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate(isEdit ? `/leads/${id}` : '/leads')}
            className="h-9 px-4 rounded-md border border-[#CBD5E1] bg-white hover:bg-page text-[13.5px] font-medium text-ink transition"
          >
            Cancel
          </button>
          {!isEdit && (
            <button
              type="button"
              onClick={() => saveLeadRecord(true)}
              className="h-9 px-4 rounded-md border border-[#CBD5E1] bg-white hover:bg-page text-[13.5px] font-medium text-ink transition"
            >
              Save and New
            </button>
          )}
          <button
            type="submit"
            className="h-9 px-5 rounded-md bg-primary hover:bg-primary-600 text-white text-[13.5px] font-semibold shadow-sm transition"
          >
            Save
          </button>
        </div>
      </div>

      {/* Main Zoho CRM Form Content */}
      <div className="flex-1 px-4 sm:px-8 py-6 max-w-[1440px] w-full mx-auto space-y-8">
        {/* SECTION 1: Lead Information */}
        <section>
          <h2 className="text-[15.5px] font-bold text-ink pb-2.5 mb-5 border-b border-line">
            Lead Information
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-3.5">
            {/* Left Column */}
            <div className="space-y-3.5">
              <FieldRow label="Lead Assigned time">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={form.assignedDate}
                    onChange={(e) => set('assignedDate', e.target.value)}
                    className={inputCls}
                  />
                  <select
                    value={form.assignedTimeSlot}
                    onChange={(e) => set('assignedTimeSlot', e.target.value)}
                    className={inputCls}
                  >
                    {TIME_SLOTS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </FieldRow>

              <FieldRow label="Lead CEO Approval">
                <select
                  value={form.ceoApproval}
                  onChange={(e) => set('ceoApproval', e.target.value)}
                  className={inputCls}
                >
                  {CEO_APPROVALS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </FieldRow>

              <FieldRow label="Lead Owner">
                <div className="flex gap-1.5">
                  <select
                    value={form.ownerId}
                    onChange={(e) => set('ownerId', e.target.value)}
                    className={`${inputCls} flex-1`}
                  >
                    <option value="u4">Marketing Department (Karthik S)</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => toast.info('Lead Owner lookup selected')}
                    className="h-[36px] w-[36px] shrink-0 rounded-md border border-[#CBD5E1] bg-[#F8FAFC] flex items-center justify-center text-ink-600 hover:bg-page"
                    title="Select User"
                  >
                    <UserPlus size={15} />
                  </button>
                </div>
              </FieldRow>

              <FieldRow label="Allotted Lead Manager">
                <div className="flex gap-1.5">
                  <select
                    value={form.allottedManagerId}
                    onChange={(e) => set('allottedManagerId', e.target.value)}
                    className={`${inputCls} flex-1`}
                  >
                    <option value="">-None-</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="h-[36px] w-[36px] shrink-0 rounded-md border border-[#CBD5E1] bg-[#F8FAFC] flex items-center justify-center text-ink-600 hover:bg-page"
                    title="Lookup Manager"
                  >
                    <UserCheck size={15} />
                  </button>
                </div>
              </FieldRow>

              <FieldRow label="Client Name">
                <input
                  type="text"
                  value={form.clientName}
                  onChange={(e) => set('clientName', e.target.value)}
                  placeholder="Enter client name"
                  className={inputCls}
                />
              </FieldRow>

              <FieldRow label="Justdial Id">
                <input
                  type="text"
                  value={form.justdialId}
                  onChange={(e) => set('justdialId', e.target.value)}
                  placeholder="e.g. JD-2026-9841"
                  className={inputCls}
                />
              </FieldRow>

              <FieldRow label="Workflow Checkbox">
                <div className="h-[36px] flex items-center">
                  <input
                    type="checkbox"
                    checked={!!form.workflowCheckbox}
                    onChange={(e) => set('workflowCheckbox', e.target.checked)}
                    className="cb"
                  />
                </div>
              </FieldRow>

              <FieldRow label="Lead Manager 1">
                <select
                  value={form.leadManager1}
                  onChange={(e) => set('leadManager1', e.target.value)}
                  className={inputCls}
                >
                  <option value="-None-">-None-</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.name}>{u.name}</option>
                  ))}
                </select>
              </FieldRow>

              <FieldRow label="Direct call Duration">
                <input
                  type="text"
                  value={form.directCallDuration}
                  onChange={(e) => set('directCallDuration', e.target.value)}
                  placeholder="00:00:00"
                  className={inputCls}
                />
              </FieldRow>

              <FieldRow label="Whatsapp call duration">
                <input
                  type="text"
                  value={form.whatsappCallDuration}
                  onChange={(e) => set('whatsappCallDuration', e.target.value)}
                  placeholder="00:00:00"
                  className={inputCls}
                />
              </FieldRow>

              <FieldRow label="First Name">
                <div className="flex gap-2">
                  <select
                    value={form.salutation}
                    onChange={(e) => set('salutation', e.target.value)}
                    className="h-[36px] w-[96px] shrink-0 px-2 rounded-md border border-[#CBD5E1] bg-white text-[13.5px] text-ink focus:outline-none focus:border-primary"
                  >
                    {SALUTATIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => set('firstName', e.target.value)}
                    placeholder="First name"
                    className={`${inputCls} flex-1`}
                  />
                </div>
              </FieldRow>

              <FieldRow label="Last Name">
                <input
                  type="text"
                  required
                  value={form.lastName}
                  onChange={(e) => set('lastName', e.target.value)}
                  placeholder="Last name (Required)"
                  className={`${inputCls} border-l-[3px] border-l-[#EF4444]`}
                />
              </FieldRow>

              <FieldRow label="Mobile">
                <input
                  type="tel"
                  value={form.mobile}
                  onChange={(e) => set('mobile', e.target.value)}
                  placeholder="+91 98765 43210"
                  className={inputCls}
                />
              </FieldRow>

              <FieldRow label="Reopen Lead">
                <div className="h-[36px] flex items-center">
                  <input
                    type="checkbox"
                    checked={!!form.reopenLead}
                    onChange={(e) => set('reopenLead', e.target.checked)}
                    className="cb"
                  />
                </div>
              </FieldRow>

              <FieldRow label="Company" info>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => set('company', e.target.value)}
                  placeholder="Company / Organization name"
                  className={inputCls}
                />
              </FieldRow>

              <FieldRow label="Lead Source" info>
                <div className="relative">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#7C3AED] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={form.leadSource}
                    onChange={(e) => set('leadSource', e.target.value)}
                    className={`${inputCls} pl-8`}
                  >
                    {LEAD_SOURCE_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </FieldRow>

              <FieldRow label="Product Name">
                <input
                  type="text"
                  value={form.productName}
                  onChange={(e) => set('productName', e.target.value)}
                  placeholder="Interested product or service"
                  className={inputCls}
                />
              </FieldRow>

              <FieldRow label="Remarks">
                <input
                  type="text"
                  value={form.remarks}
                  onChange={(e) => set('remarks', e.target.value)}
                  placeholder="Enter lead remarks"
                  className={inputCls}
                />
              </FieldRow>

              <FieldRow label="Call Attempt Count">
                <input
                  type="number"
                  min="0"
                  value={form.callAttemptCount}
                  onChange={(e) => set('callAttemptCount', e.target.value)}
                  placeholder="0"
                  className={inputCls}
                />
              </FieldRow>
            </div>

            {/* Right Column */}
            <div className="space-y-3.5">
              <FieldRow label="Comments" alignTop>
                <textarea
                  rows={2}
                  value={form.comments}
                  onChange={(e) => set('comments', e.target.value)}
                  placeholder="Add initial comments..."
                  className="w-full px-3 py-2 rounded-md border border-[#CBD5E1] bg-white text-[13.5px] text-ink placeholder:text-ink-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
              </FieldRow>

              <FieldRow label="Status">
                <div className="relative">
                  <span
                    className="h-2.5 w-2.5 rounded-full absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ backgroundColor: currentReadDot }}
                  />
                  <select
                    value={form.readStatus}
                    onChange={(e) => set('readStatus', e.target.value)}
                    className={`${inputCls} pl-8`}
                  >
                    {READ_STATUSES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
              </FieldRow>

              <FieldRow label="Lead Push Time">
                <input
                  type="text"
                  value={form.pushTime}
                  onChange={(e) => set('pushTime', e.target.value)}
                  placeholder="DD/MM/YYYY HH:MM"
                  className={inputCls}
                />
              </FieldRow>

              <FieldRow label="Date">
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => set('date', e.target.value)}
                  className={inputCls}
                />
              </FieldRow>

              <FieldRow label="Dashboard Req">
                <div className="h-[36px] flex items-center">
                  <input
                    type="checkbox"
                    checked={!!form.dashboardReq}
                    onChange={(e) => set('dashboardReq', e.target.checked)}
                    className="cb"
                  />
                </div>
              </FieldRow>

              <FieldRow label="Phone">
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  placeholder="Landline / Alternate phone"
                  className={inputCls}
                />
              </FieldRow>

              <FieldRow label="Email">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="client@company.com"
                  className={inputCls}
                />
              </FieldRow>

              <FieldRow label="Lead Status">
                <select
                  value={form.status}
                  onChange={(e) => set('status', e.target.value)}
                  className={inputCls}
                >
                  {LEAD_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </FieldRow>

              <FieldRow label="Category">
                <input
                  type="text"
                  list="zoho-lead-categories"
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                  placeholder="Select or type category (e.g. DTP Services)"
                  className={inputCls}
                />
                <datalist id="zoho-lead-categories">
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </FieldRow>

              <FieldRow label="Call Start Time">
                <div className="grid grid-cols-[1fr_1fr_36px] gap-1.5">
                  <input
                    type="date"
                    value={form.callStartDate}
                    onChange={(e) => set('callStartDate', e.target.value)}
                    className={inputCls}
                  />
                  <select
                    value={form.callStartTimeSlot}
                    onChange={(e) => set('callStartTimeSlot', e.target.value)}
                    className={inputCls}
                  >
                    {TIME_SLOTS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <span className="h-[36px] w-[36px] rounded-md border border-[#CBD5E1] bg-[#F8FAFC] flex items-center justify-center text-ink-500">
                    <Clock size={15} />
                  </span>
                </div>
              </FieldRow>

              <FieldRow label="Website Source">
                <input
                  type="text"
                  value={form.websiteSource}
                  onChange={(e) => set('websiteSource', e.target.value)}
                  placeholder="https://..."
                  className={inputCls}
                />
              </FieldRow>

              <FieldRow label="Checkbox 1">
                <div className="h-[36px] flex items-center">
                  <input
                    type="checkbox"
                    checked={!!form.checkbox1}
                    onChange={(e) => set('checkbox1', e.target.checked)}
                    className="cb"
                  />
                </div>
              </FieldRow>

              <FieldRow label="Tag Field">
                <select
                  value={form.tag}
                  onChange={(e) => set('tag', e.target.value)}
                  className={inputCls}
                >
                  {TAG_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </FieldRow>

              <FieldRow label="Source Lang">
                <div className="flex gap-1.5">
                  <select
                    value={form.sourceLang}
                    onChange={(e) => set('sourceLang', e.target.value)}
                    className={`${inputCls} flex-1`}
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l || 'none'} value={l}>{l || '-Select Language-'}</option>
                    ))}
                  </select>
                  <span className="h-[36px] w-[36px] shrink-0 rounded-md border border-[#CBD5E1] bg-[#F8FAFC] flex items-center justify-center text-ink-500">
                    <FileText size={15} />
                  </span>
                </div>
              </FieldRow>

              <FieldRow label="Target Lang">
                <div className="flex gap-1.5">
                  <select
                    value={form.targetLang}
                    onChange={(e) => set('targetLang', e.target.value)}
                    className={`${inputCls} flex-1`}
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l || 'none'} value={l}>{l || '-Select Language-'}</option>
                    ))}
                  </select>
                  <span className="h-[36px] w-[36px] shrink-0 rounded-md border border-[#CBD5E1] bg-[#F8FAFC] flex items-center justify-center text-ink-500">
                    <FileText size={15} />
                  </span>
                </div>
              </FieldRow>

              <FieldRow label="Performance">
                <select
                  value={form.performance}
                  onChange={(e) => set('performance', e.target.value)}
                  className={inputCls}
                >
                  {PERFORMANCE_OPTIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </FieldRow>
            </div>
          </div>
        </section>

        {/* SECTION 2: Address Information */}
        <section>
          <h2 className="text-[15.5px] font-bold text-ink pb-2.5 mb-5 border-b border-line">
            Address Information
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-3.5">
            <div className="space-y-3.5">
              <FieldRow label="Street">
                <input
                  type="text"
                  value={form.street}
                  onChange={(e) => set('street', e.target.value)}
                  placeholder="Street address"
                  className={inputCls}
                />
              </FieldRow>
              <FieldRow label="State">
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => set('state', e.target.value)}
                  placeholder="State"
                  className={inputCls}
                />
              </FieldRow>
              <FieldRow label="Country">
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => set('country', e.target.value)}
                  placeholder="Country"
                  className={inputCls}
                />
              </FieldRow>
            </div>

            <div className="space-y-3.5">
              <FieldRow label="City">
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => set('city', e.target.value)}
                  placeholder="City"
                  className={inputCls}
                />
              </FieldRow>
              <FieldRow label="Zip Code">
                <input
                  type="text"
                  value={form.zip}
                  onChange={(e) => set('zip', e.target.value)}
                  placeholder="600001"
                  className={inputCls}
                />
              </FieldRow>
              <FieldRow label="Branch Area">
                <input
                  type="text"
                  value={form.branchArea}
                  onChange={(e) => set('branchArea', e.target.value)}
                  placeholder="Branch / Locality"
                  className={inputCls}
                />
              </FieldRow>
            </div>
          </div>
        </section>

        {/* SECTION 3: Description Information */}
        <section>
          <h2 className="text-[15.5px] font-bold text-ink pb-2.5 mb-5 border-b border-line">
            Description Information
          </h2>

          <div className="max-w-4xl">
            <FieldRow label="Description" alignTop>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Enter detailed lead description or requirements..."
                className="w-full px-3 py-2 rounded-md border border-[#CBD5E1] bg-white text-[13.5px] text-ink placeholder:text-ink-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </FieldRow>
          </div>
        </section>

        {/* SECTION 4: Attachments */}
        <section>
          <div className="flex items-center justify-between pb-2.5 mb-4 border-b border-line">
            <h2 className="text-[15.5px] font-bold text-ink">Attachments</h2>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleAttachFiles}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-9 px-3.5 rounded-md border border-primary text-primary hover:bg-primary-50 text-[13px] font-medium inline-flex items-center gap-1.5 transition"
              >
                <Paperclip size={15} />
                <span>Attach File</span>
              </button>
            </div>
          </div>

          {form.attachments?.length > 0 ? (
            <div className="border border-line rounded-lg overflow-hidden">
              <table className="w-full text-[13px]">
                <thead className="bg-[#F5F8FD] border-b border-line text-left">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold text-ink">File Name</th>
                    <th className="py-2.5 px-4 font-semibold text-ink">Attached By</th>
                    <th className="py-2.5 px-4 font-semibold text-ink">Date Added</th>
                    <th className="py-2.5 px-4 font-semibold text-ink">Size</th>
                    <th className="py-2.5 px-4 font-semibold text-ink text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {form.attachments.map((att) => (
                    <tr key={att.id} className="hover:bg-[#F8FAFE]">
                      <td className="py-2.5 px-4 font-medium text-primary flex items-center gap-2">
                        <Paperclip size={14} className="shrink-0" />
                        <a href={att.url || '#'} target="_blank" rel="noreferrer" className="hover:underline truncate">
                          {att.name}
                        </a>
                      </td>
                      <td className="py-2.5 px-4 text-ink-600">{att.addedBy}</td>
                      <td className="py-2.5 px-4 text-ink-600">{att.addedAt}</td>
                      <td className="py-2.5 px-4 text-ink-600">{att.size}</td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => removeAttachment(att.id)}
                          className="p-1 text-ink-400 hover:text-danger rounded"
                          title="Remove attachment"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#CBD5E1] hover:border-primary rounded-lg py-6 px-4 text-center cursor-pointer bg-[#F8FAFD] transition"
            >
              <Upload size={22} className="mx-auto text-ink-400 mb-1.5" />
              <p className="text-[13.5px] font-medium text-ink">Click to attach files or documents to this Lead</p>
              <p className="text-[12px] text-ink-500 mt-0.5">Supports PDF, DOCX, XLSX, Images (up to 20 MB)</p>
            </div>
          )}
        </section>
      </div>

      {/* Bottom Sticky Footer matching Zoho CRM */}
      <div className="sticky bottom-0 z-10 bg-[#F8FAFC] border-t border-line px-4 sm:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 text-[13px] text-ink-600">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>Zoho CRM Real-Time Workflow Automation Enabled</span>
        </div>
        <div className="flex items-center gap-2.5 ml-auto">
          <span>Create Form Views</span>
          <select className="h-8 px-2.5 rounded border border-[#CBD5E1] bg-white text-[13px] text-ink">
            <option>Standard View</option>
            <option>Quick Create View</option>
          </select>
          <button
            type="button"
            onClick={() => toast.info('Custom form page builder opened')}
            className="h-8 px-3 rounded border border-[#CBD5E1] bg-white hover:bg-page text-[13px] font-medium text-ink"
          >
            Create a custom form page
          </button>
        </div>
      </div>
    </form>
  );
}
