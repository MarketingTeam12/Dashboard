import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Camera, Check, ChevronDown, Info, LayoutTemplate, Plus, Sliders, Sparkles, UserRound,
} from 'lucide-react';
import { useCRM } from '../../context/crmContextInstance';
import { useToast } from '../../components/common/toastContext';
import Modal from '../../components/common/Modal';
import { LEAD_SOURCES, LEAD_STATUSES, LEAD_TAGS } from '../../data/seedData';
import { todayISO } from '../../utils/calculations';
import ZohoCustomizationModal from './ZohoCustomizationModal';
import { useZohoCustomization } from './zohoCustomizationConfig';

const SALUTATIONS = ['-None-', 'Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.'];
const LANGUAGES = [
  '-None-', 'English', 'Hindi', 'Tamil', 'Telugu', 'Malayalam', 'Kannada',
  'German', 'French', 'Spanish', 'Arabic', 'Japanese', 'Chinese', 'Russian', 'Italian', 'Portuguese',
];
const PERFORMANCE_OPTIONS = ['-None-', 'Excellent', 'Good', 'Average', 'Needs Followup', 'High Priority'];
const WORKING_HOURS_OPTIONS = ['-None-', '9:00 AM - 6:00 PM', '10:00 AM - 7:00 PM', '24/7 Support', 'Flexible / Shift'];
const REOPEN_OPTIONS = ['-None-', 'Yes', 'No', 'Reopened - Followup'];
const DASHBOARD_REQ_OPTIONS = ['-None-', 'Yes', 'No', 'Live Dashboard', 'Weekly Summary'];

function getDefaultFormState(users = []) {
  const nowStr = `${todayISO()} 10:30 AM`;
  return {
    leadAssignedTime: nowStr,
    leadCeoApproval: 'Pending',
    ownerId: users[3]?.id || users[0]?.id || 'u4',
    allottedLeadManager: 'Gautam S.',
    clientName: '',
    justdialId: '',
    workflowCheckbox: false,
    leadManager1: 'Gautam S.',
    directCallDuration: '00:00',
    whatsappCallDuration: '00:00',
    salutation: 'Mr.',
    firstName: '',
    lastName: '',
    mobile: '',
    reopenLead: 'No',
    company: '',
    leadSource: 'Website',
    productName: 'Language Translation Services',
    remarks: '',
    callAttemptCount: 0,
    comments: '',
    recordStatus: 'Active',
    leadPushTime: nowStr,
    date: todayISO(),
    dashboardReq: 'Yes',
    phone: '',
    email: '',
    status: 'New',
    category: 'Language Translation Services',
    callStartTime: '',
    websiteSource: 'https://www.honeytranslations.com',
    checkbox1: false,
    tagField: '',
    sourceLang: 'English',
    targetLang: 'German',
    performance: 'Good',
    workingHours: '9:00 AM - 6:00 PM',
    // Address Information
    street: '',
    city: 'Chennai',
    state: 'Tamil Nadu',
    zip: '600024',
    country: 'India',
    branchArea: 'Saidapet, Chennai',
    // Description Information
    description: '',
    // Custom dynamic fields bucket
    customFieldValues: {},
  };
}

/**
 * Zoho CRM Create Lead (/leads/new) & Edit Lead (/leads/:id/edit) Page
 * Matches Section 10 of Master Prompt and Zoho CRM reference screenshots.
 */
export default function LeadForm() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const { leads = [], users = [], createRecord, updateRecord, userName } = useCRM();
  const toast = useToast();
  const notify = (msg, type = 'success') => (type === 'error' ? toast.error(msg) : toast.success(msg));
  const navigate = useNavigate();
  const location = useLocation();

  const { config: zohoCustomConfig, updateConfig: updateZohoCustomConfig } = useZohoCustomization();
  const [customizeModalOpen, setCustomizeModalOpen] = useState(false);
  const [customFormModalOpen, setCustomFormModalOpen] = useState(false);
  const [newLayoutName, setNewLayoutName] = useState('');
  const [layoutMenuOpen, setLayoutMenuOpen] = useState(false);
  const [customLayouts, setCustomLayouts] = useState(['Standard View', 'Quick Capture View', 'Enterprise Translation View']);
  const [selectedLayout, setSelectedLayout] = useState(zohoCustomConfig.formLayout || 'Standard View');
  const [avatarPreview, setAvatarPreview] = useState('');

  const existingLead = useMemo(
    () => (isEditMode ? leads.find((l) => String(l.id) === String(id)) : null),
    [isEditMode, leads, id]
  );

  const backTarget = useMemo(() => {
    if (location.state?.from) return location.state.from;
    if (isEditMode && id) return `/leads/${id}`;
    return '/leads';
  }, [location.state, isEditMode, id]);

  const [form, setForm] = useState(() => getDefaultFormState(users));
  const [errors, setErrors] = useState({});

  // Pre-populate form when editing an existing lead
  useEffect(() => {
    if (isEditMode && existingLead) {
      const nameParts = String(existingLead.name || '').trim().split(' ');
      const derivedFirst = existingLead.firstName ?? (nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : '');
      const derivedLast = existingLead.lastName ?? (nameParts.length > 1 ? nameParts[nameParts.length - 1] : existingLead.name || '');

      setForm({
        leadAssignedTime: existingLead.leadAssignedTime || existingLead.createdTime || `${todayISO()} 10:30 AM`,
        leadCeoApproval: existingLead.leadCeoApproval || 'Approved',
        ownerId: existingLead.ownerId || 'u4',
        allottedLeadManager: existingLead.allottedLeadManager || 'Gautam S.',
        clientName: existingLead.clientName || existingLead.name || '',
        justdialId: existingLead.justdialId || '',
        workflowCheckbox: Boolean(existingLead.workflowCheckbox),
        leadManager1: existingLead.leadManager1 || existingLead.allottedLeadManager || 'Gautam S.',
        directCallDuration: existingLead.directCallDuration || '00:04:15',
        whatsappCallDuration: existingLead.whatsappCallDuration || '00:00',
        salutation: existingLead.salutation || 'Mr.',
        firstName: derivedFirst,
        lastName: derivedLast,
        mobile: existingLead.mobile || existingLead.phone || '',
        reopenLead: existingLead.reopenLead || 'No',
        company: existingLead.company || '',
        leadSource: existingLead.leadSource || existingLead.source || 'Website',
        productName: existingLead.productName || existingLead.productInterest || 'Language Translation Services',
        remarks: existingLead.remarks || '',
        callAttemptCount: existingLead.callAttemptCount ?? 1,
        comments: existingLead.comments || '',
        recordStatus: existingLead.recordStatus || 'Active',
        leadPushTime: existingLead.leadPushTime || existingLead.createdTime || '',
        date: existingLead.date || existingLead.createdOn || todayISO(),
        dashboardReq: existingLead.dashboardReq || 'Yes',
        phone: existingLead.phone || existingLead.mobile || '',
        email: existingLead.email || '',
        status: existingLead.status || 'New',
        category: existingLead.category || existingLead.industry || 'Language Translation Services',
        callStartTime: existingLead.callStartTime || existingLead.createdTime || '',
        websiteSource: existingLead.websiteSource || existingLead.website || 'https://www.honeytranslations.com',
        checkbox1: Boolean(existingLead.checkbox1),
        tagField:
          existingLead.tagField && existingLead.tagField !== 'Lead' && existingLead.tagField !== '-None-'
            ? existingLead.tagField
            : existingLead.tag && existingLead.tag !== 'Lead' && existingLead.tag !== '-None-'
            ? existingLead.tag
            : '',
        sourceLang: existingLead.sourceLang || 'English',
        targetLang: existingLead.targetLang || 'German',
        performance: existingLead.performance || 'Good',
        workingHours: existingLead.workingHours || '9:00 AM - 6:00 PM',
        street: existingLead.street || existingLead.address || '',
        city: existingLead.city || 'Chennai',
        state: existingLead.state || 'Tamil Nadu',
        zip: existingLead.zip || '600024',
        country: existingLead.country || 'India',
        branchArea: existingLead.branchArea || `${existingLead.city || 'Chennai'} Central`,
        description: existingLead.description || existingLead.remarks || '',
        customFieldValues: existingLead.customFieldValues || {},
      });
    }
  }, [isEditMode, existingLead]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validateForm = () => {
    const nextErrors = {};
    const reqList = zohoCustomConfig.requiredFields || ['lastName', 'company', 'mobile'];

    const fullName = `${form.firstName || ''} ${form.lastName || ''}`.trim() || form.clientName.trim();
    if (!fullName) {
      nextErrors.lastName = 'Last Name or Full Name is required';
    }
    if (reqList.includes('company') && !String(form.company || '').trim()) {
      nextErrors.company = 'Company cannot be empty';
    }
    if (reqList.includes('mobile') && !String(form.mobile || form.phone || '').trim()) {
      nextErrors.mobile = 'Mobile number is required';
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = 'Please enter a valid email address';
    }

    // Validate custom required fields
    (zohoCustomConfig.customFields || []).forEach((cf) => {
      if (cf.required && !String(form.customFieldValues?.[cf.key] ?? '').trim()) {
        nextErrors[`cf_${cf.key}`] = `${cf.label} is required`;
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPayload = () => {
    const fullName = `${form.firstName || ''} ${form.lastName || ''}`.trim() || form.clientName.trim() || 'Unnamed Lead';
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const nowFormatted = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const cleanedTag =
      form.tagField && form.tagField !== '-None-' && form.tagField !== 'Lead' && form.tagField !== 'Hot Lead'
        ? form.tagField
        : '';

    return {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim() || fullName,
      salutation: form.salutation,
      name: fullName,
      clientName: form.clientName.trim() || fullName,
      company: form.company.trim() || 'Individual Client',
      mobile: form.mobile.trim() || form.phone.trim(),
      phone: form.phone.trim() || form.mobile.trim(),
      email: form.email.trim(),
      source: form.leadSource,
      leadSource: form.leadSource,
      status: form.status,
      recordStatus: form.recordStatus,
      category: form.category,
      industry: form.category,
      productName: form.productName,
      productInterest: form.productName,
      remarks: form.remarks,
      comments: form.comments,
      description: form.description || form.remarks,
      ownerId: form.ownerId || 'u4',
      assignedTo: userName(form.ownerId || 'u4'),
      allottedLeadManager: form.allottedLeadManager,
      leadManager1: form.leadManager1,
      leadAssignedTime: form.leadAssignedTime || `${nowFormatted} ${nowTime}`,
      leadPushTime: form.leadPushTime || `${nowFormatted} ${nowTime}`,
      callStartTime: form.callStartTime || `${nowFormatted} ${nowTime}`,
      leadCeoApproval: form.leadCeoApproval,
      justdialId: form.justdialId,
      workflowCheckbox: Boolean(form.workflowCheckbox),
      checkbox1: Boolean(form.checkbox1),
      directCallDuration: form.directCallDuration,
      whatsappCallDuration: form.whatsappCallDuration,
      reopenLead: form.reopenLead,
      callAttemptCount: Number(form.callAttemptCount) || 0,
      date: form.date || todayISO(),
      dashboardReq: form.dashboardReq,
      websiteSource: form.websiteSource,
      website: form.websiteSource,
      tag: cleanedTag,
      tagField: cleanedTag,
      tags: cleanedTag ? [cleanedTag] : [],
      sourceLang: form.sourceLang,
      targetLang: form.targetLang,
      performance: form.performance,
      workingHours: form.workingHours,
      street: form.street,
      address: `${form.street ? `${form.street}, ` : ''}${form.city}, ${form.state} ${form.zip}, ${form.country}`,
      city: form.city || 'Chennai',
      state: form.state || 'Tamil Nadu',
      zip: form.zip || '600024',
      country: form.country || 'India',
      branchArea: form.branchArea || form.city || 'Chennai',
      customFieldValues: form.customFieldValues || {},
      ...(form.customFieldValues || {}),
    };
  };

  const handleSave = (andNew = false) => {
    if (!validateForm()) {
      notify('Please fix highlighted required fields before saving', 'error');
      return;
    }

    const payload = buildPayload();

    if (isEditMode && existingLead) {
      updateRecord('leads', existingLead.id, payload);
      notify(`Updated lead "${payload.name}"`, 'success');
      if (andNew) {
        setForm(getDefaultFormState(users));
        navigate('/leads/new', { state: { from: '/leads' } });
      } else {
        navigate(backTarget);
      }
    } else {
      const created = createRecord('leads', {
        ...payload,
        leadNo: `LEA${Math.floor(114840 + Math.random() * 900)}`,
        createdTime: new Date().toLocaleString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
        leadAging: 0,
        leadActivityAging: 0,
      });
      notify(`Created lead "${payload.name}"`, 'success');
      if (andNew) {
        setForm(getDefaultFormState(users));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (created?.id) {
        navigate(`/leads/${created.id}`, { state: { from: '/leads' } });
      } else {
        navigate('/leads');
      }
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(String(ev.target?.result || ''));
    reader.readAsDataURL(file);
  };

  const statusOptions = zohoCustomConfig.customStatuses?.length ? zohoCustomConfig.customStatuses : LEAD_STATUSES;
  const sourceOptions = zohoCustomConfig.customSources?.length ? zohoCustomConfig.customSources : LEAD_SOURCES;
  const tagOptions = (zohoCustomConfig.customTags?.length ? zohoCustomConfig.customTags : LEAD_TAGS).filter(
    (t) => t && t !== 'Hot Lead' && t !== 'Lead'
  );
  const categoryOptions = zohoCustomConfig.customCategories?.length
    ? zohoCustomConfig.customCategories
    : [
        'Language Translation Services',
        'Language Conversion',
        'Attestation',
        'Transcription',
        'Interpretation',
        'Dubbing / VoiceOver',
        'Typing / DTP',
        'Admission',
        'Overseas Education',
        'Visa',
        'Education',
        'Other Category',
      ];

  // Zoho-style horizontal label + field row inside a 2-column grid
  const renderRow = (label, inputNode, required = false, errorMsg = '', infoTip = '') => (
    <div className="grid grid-cols-12 items-start gap-3 py-1.5">
      <label className="col-span-4 text-right text-[14px] text-[#4B5578] pt-1.5 font-normal select-none flex items-center justify-end gap-1">
        <span className={required ? 'border-b border-dotted border-rose-500 text-[#1F2A44] font-medium' : ''}>
          {label}
        </span>
        {required && <span className="text-rose-600 font-bold">*</span>}
        {infoTip && <Info size={13} className="text-[#8B95AE] shrink-0" title={infoTip} />}
      </label>
      <div className="col-span-8">
        {inputNode}
        {errorMsg && <div className="text-[12.5px] text-rose-600 mt-0.5 font-medium">{errorMsg}</div>}
      </div>
    </div>
  );

  const inputCls = (err) =>
    `w-full h-[34px] px-3 rounded-[4px] border ${
      err ? 'border-rose-500 bg-rose-50/20' : 'border-[#CBD5E1] hover:border-[#94A3B8]'
    } bg-white text-[14px] text-[#1F2A44] focus:outline-none focus:border-[#2F55D4] transition`;

  return (
    <div className="-mx-3 sm:-mx-[18px] -mt-2.5 bg-white min-h-[calc(100vh-56px)] flex flex-col">
      {/* ---- Sticky Top Action Bar (Exact Zoho Screenshot Design) ---- */}
      <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 px-5 h-[56px] border-b border-[#E3E8F2] bg-white shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(backTarget)}
            title="Back"
            className="h-8 w-8 rounded-full flex items-center justify-center text-[#4B5578] hover:bg-[#F3F6FB] hover:text-[#1F2A44]"
          >
            <ArrowLeft size={19} />
          </button>
          <h1 className="text-[22px] font-bold text-[#1F2A44]">
            {isEditMode ? `Edit Lead — ${existingLead?.name || ''}` : 'Create Lead'}
          </h1>

          {/* Layout Selector: Standard View / Create Custom Form Page */}
          <div className="relative ml-2">
            <button
              type="button"
              onClick={() => setLayoutMenuOpen((o) => !o)}
              className="h-8 px-3.5 rounded border border-[#CBD5E1] bg-[#F8FAFC] text-[14px] font-medium text-[#1F2A44] inline-flex items-center gap-2 hover:border-[#2F55D4]"
            >
              <span>{selectedLayout}</span>
              <ChevronDown size={14} className="text-[#5B6684]" />
            </button>
            {layoutMenuOpen && (
              <div className="absolute left-0 top-9 z-40 w-64 bg-white border border-[#D5DBE8] rounded-md shadow-xl py-1 text-[14px]">
                <div className="px-3 py-1 text-[11.5px] font-semibold text-[#6B7696] uppercase">Select Form Layout</div>
                {customLayouts.map((ly) => (
                  <button
                    key={ly}
                    type="button"
                    onClick={() => {
                      setSelectedLayout(ly);
                      updateZohoCustomConfig({ formLayout: ly });
                      setLayoutMenuOpen(false);
                      notify(`Switched form layout to "${ly}"`, 'info');
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#F3F6FB] flex items-center justify-between"
                  >
                    <span>{ly}</span>
                    {selectedLayout === ly && <Check size={14} className="text-[#2F55D4]" />}
                  </button>
                ))}
                <div className="border-t border-[#EEF1F7] my-1" />
                <button
                  type="button"
                  onClick={() => {
                    setLayoutMenuOpen(false);
                    setCustomFormModalOpen(true);
                  }}
                  className="w-full px-3 py-1.5 text-left text-[#2F55D4] font-medium hover:bg-[#F3F6FB] flex items-center gap-1.5"
                >
                  <Plus size={14} /> Create Custom Form Page
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setCustomizeModalOpen(true)}
            className="text-[14px] text-[#2F55D4] hover:underline font-medium ml-2 inline-flex items-center gap-1"
          >
            <LayoutTemplate size={14} /> Edit Page Layout
          </button>
        </div>

        {/* Right Action Buttons: Cancel | Save and New | Save */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(backTarget)}
            className="h-8 px-4 rounded border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[14px] font-medium text-[#1F2A44]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            className="h-8 px-4 rounded border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[14px] font-medium text-[#1F2A44]"
          >
            Save and New
          </button>
          <button
            type="button"
            onClick={() => handleSave(false)}
            className="h-8 px-5 rounded bg-[#2F55D4] hover:bg-[#2546B8] text-white text-[14px] font-semibold shadow-2xs"
          >
            Save
          </button>
        </div>
      </div>

      {/* ---- Main Form Content ---- */}
      <div className="flex-1 max-w-[1320px] w-full mx-auto px-6 py-5 space-y-7">
        {/* Lead Image Section */}
        <div>
          <div className="text-[16px] font-bold text-[#1F2A44] mb-2.5">Lead Image</div>
          <label className="relative inline-flex items-center justify-center w-14 h-14 rounded-full border border-[#CBD5E1] bg-[#F8FAFD] hover:border-[#2F55D4] cursor-pointer overflow-hidden group">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Lead Avatar" className="w-full h-full object-cover" />
            ) : (
              <UserRound size={26} className="text-[#8B95AE] group-hover:text-[#2F55D4]" />
            )}
            <span className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
              <Camera size={15} className="text-white" />
            </span>
            <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          </label>
        </div>

        {/* ---- Section 1: Lead Information (Exact Zoho Two-Column Layout) ---- */}
        <div>
          <div className="text-[16px] font-bold text-[#1F2A44] pb-2 mb-3 border-b border-[#EEF1F7]">
            Lead Information
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-0.5">
            {/* LEFT COLUMN */}
            <div className="space-y-1">
              {renderRow(
                'Lead Assigned time',
                <input
                  type="text"
                  placeholder="DD/MM/YYYY hh:mm AM"
                  value={form.leadAssignedTime}
                  onChange={(e) => setField('leadAssignedTime', e.target.value)}
                  className={inputCls()}
                />
              )}

              {renderRow(
                'Lead Owner',
                <select
                  value={form.ownerId}
                  onChange={(e) => setField('ownerId', e.target.value)}
                  className={inputCls()}
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              )}

              {renderRow(
                'Client Name',
                <input
                  type="text"
                  value={form.clientName}
                  onChange={(e) => setField('clientName', e.target.value)}
                  className={inputCls()}
                />
              )}

              {renderRow(
                'Workflow Checkbox',
                <div className="pt-1.5">
                  <input
                    type="checkbox"
                    checked={form.workflowCheckbox}
                    onChange={(e) => setField('workflowCheckbox', e.target.checked)}
                    className="h-4 w-4 accent-[#2F55D4] rounded cursor-pointer"
                  />
                </div>
              )}

              {renderRow(
                'Direct call Duration',
                <input
                  type="text"
                  value={form.directCallDuration}
                  onChange={(e) => setField('directCallDuration', e.target.value)}
                  className={inputCls()}
                />,
                false,
                '',
                'Total direct call duration (mm:ss)'
              )}

              {renderRow(
                'First Name',
                <div className="flex gap-1.5">
                  <select
                    value={form.salutation}
                    onChange={(e) => setField('salutation', e.target.value)}
                    className="h-[32px] w-[84px] px-2 rounded-[4px] border border-[#CBD5E1] bg-white text-[13px] text-[#1F2A44]"
                  >
                    {SALUTATIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => setField('firstName', e.target.value)}
                    className={inputCls()}
                  />
                </div>
              )}

              {renderRow(
                'Mobile',
                <input
                  type="text"
                  value={form.mobile}
                  onChange={(e) => setField('mobile', e.target.value)}
                  className={inputCls(errors.mobile)}
                />,
                (zohoCustomConfig.requiredFields || []).includes('mobile'),
                errors.mobile
              )}

              {renderRow(
                'Company',
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => setField('company', e.target.value)}
                  className={inputCls(errors.company)}
                />,
                (zohoCustomConfig.requiredFields || []).includes('company'),
                errors.company
              )}

              {renderRow(
                'Product Name',
                <input
                  type="text"
                  value={form.productName}
                  onChange={(e) => setField('productName', e.target.value)}
                  className={inputCls()}
                />
              )}

              {renderRow(
                'Call Attempt Count',
                <input
                  type="number"
                  min={0}
                  value={form.callAttemptCount}
                  onChange={(e) => setField('callAttemptCount', e.target.value)}
                  className={inputCls()}
                />
              )}

              {renderRow(
                'Status',
                <input
                  type="text"
                  value={form.recordStatus}
                  onChange={(e) => setField('recordStatus', e.target.value)}
                  className={inputCls()}
                />
              )}

              {renderRow(
                'Date',
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setField('date', e.target.value)}
                  className={inputCls()}
                />
              )}

              {renderRow(
                'Phone',
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setField('phone', e.target.value)}
                  className={inputCls()}
                />
              )}

              {renderRow(
                'Lead Status',
                <select
                  value={form.status}
                  onChange={(e) => setField('status', e.target.value)}
                  className={inputCls()}
                >
                  <option value="-None-">-None-</option>
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              )}

              {renderRow(
                'Call Start Time',
                <input
                  type="text"
                  placeholder="DD/MM/YYYY hh:mm AM"
                  value={form.callStartTime}
                  onChange={(e) => setField('callStartTime', e.target.value)}
                  className={inputCls()}
                />
              )}

              {renderRow(
                'Checkbox 1',
                <div className="pt-1.5">
                  <input
                    type="checkbox"
                    checked={form.checkbox1}
                    onChange={(e) => setField('checkbox1', e.target.checked)}
                    className="h-4 w-4 accent-[#2F55D4] rounded cursor-pointer"
                  />
                </div>
              )}

              {renderRow(
                'Source Lang',
                <select
                  value={form.sourceLang}
                  onChange={(e) => setField('sourceLang', e.target.value)}
                  className={inputCls()}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              )}

              {renderRow(
                'Performance',
                <select
                  value={form.performance}
                  onChange={(e) => setField('performance', e.target.value)}
                  className={inputCls()}
                >
                  {PERFORMANCE_OPTIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              )}
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-1">
              {renderRow(
                'Lead CEO Approval',
                <select
                  value={form.leadCeoApproval}
                  onChange={(e) => setField('leadCeoApproval', e.target.value)}
                  className={inputCls()}
                >
                  <option value="-None-">-None-</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              )}

              {renderRow(
                'Allotted Lead Manager',
                <input
                  type="text"
                  value={form.allottedLeadManager}
                  onChange={(e) => setField('allottedLeadManager', e.target.value)}
                  className={inputCls()}
                />
              )}

              {renderRow(
                'Justdial Id',
                <input
                  type="text"
                  value={form.justdialId}
                  onChange={(e) => setField('justdialId', e.target.value)}
                  className={inputCls()}
                />
              )}

              {renderRow(
                'Lead Manager 1',
                <select
                  value={form.leadManager1}
                  onChange={(e) => setField('leadManager1', e.target.value)}
                  className={inputCls()}
                >
                  <option value="-None-">-None-</option>
                  <option value="Gautam S.">Gautam S.</option>
                  <option value="Karthik S">Karthik S</option>
                  <option value="Priya Nair">Priya Nair</option>
                  <option value="Arjun Mehta">Arjun Mehta</option>
                </select>
              )}

              {renderRow(
                'Whatsapp call duration',
                <input
                  type="text"
                  value={form.whatsappCallDuration}
                  onChange={(e) => setField('whatsappCallDuration', e.target.value)}
                  className={inputCls()}
                />,
                false,
                '',
                'Total WhatsApp call duration'
              )}

              {renderRow(
                'Last Name',
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setField('lastName', e.target.value)}
                  className={inputCls(errors.lastName)}
                />,
                true,
                errors.lastName
              )}

              {renderRow(
                'Reopen Lead',
                <select
                  value={form.reopenLead}
                  onChange={(e) => setField('reopenLead', e.target.value)}
                  className={inputCls()}
                >
                  {REOPEN_OPTIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              )}

              {renderRow(
                'Lead Source',
                <select
                  value={form.leadSource}
                  onChange={(e) => setField('leadSource', e.target.value)}
                  className={inputCls()}
                >
                  <option value="-None-">-None-</option>
                  {sourceOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              )}

              {renderRow(
                'Remarks',
                <input
                  type="text"
                  value={form.remarks}
                  onChange={(e) => setField('remarks', e.target.value)}
                  className={inputCls()}
                />
              )}

              {renderRow(
                'Comments',
                <input
                  type="text"
                  value={form.comments}
                  onChange={(e) => setField('comments', e.target.value)}
                  className={inputCls()}
                />
              )}

              {renderRow(
                'Lead Push Time',
                <input
                  type="text"
                  placeholder="DD/MM/YYYY hh:mm AM"
                  value={form.leadPushTime}
                  onChange={(e) => setField('leadPushTime', e.target.value)}
                  className={inputCls()}
                />
              )}

              {renderRow(
                'Dashboard Req',
                <select
                  value={form.dashboardReq}
                  onChange={(e) => setField('dashboardReq', e.target.value)}
                  className={inputCls()}
                >
                  {DASHBOARD_REQ_OPTIONS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              )}

              {renderRow(
                'Email',
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  className={inputCls(errors.email)}
                />,
                false,
                errors.email
              )}

              {renderRow(
                'Category',
                <select
                  value={form.category}
                  onChange={(e) => setField('category', e.target.value)}
                  className={inputCls()}
                >
                  <option value="-None-">-None-</option>
                  {categoryOptions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}

              {renderRow(
                'Website Source',
                <input
                  type="text"
                  value={form.websiteSource}
                  onChange={(e) => setField('websiteSource', e.target.value)}
                  className={inputCls()}
                />
              )}

              {renderRow(
                'Tag Field',
                <select
                  value={form.tagField}
                  onChange={(e) => setField('tagField', e.target.value)}
                  className={inputCls()}
                >
                  <option value="">-None-</option>
                  {tagOptions.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              )}

              {renderRow(
                'Target Lang',
                <select
                  value={form.targetLang}
                  onChange={(e) => setField('targetLang', e.target.value)}
                  className={inputCls()}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              )}

              {renderRow(
                'Working hours',
                <select
                  value={form.workingHours}
                  onChange={(e) => setField('workingHours', e.target.value)}
                  className={inputCls()}
                >
                  {WORKING_HOURS_OPTIONS.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Dynamic Custom Fields from ZohoCustomizationModal */}
          {(zohoCustomConfig.customFields || []).length > 0 && (
            <div className="mt-4 pt-3 border-t border-dashed border-[#E3E8F2]">
              <div className="text-[14px] font-semibold text-[#5B6684] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles size={14} className="text-[#2F55D4]" /> Custom Organization Fields
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-0.5">
                {(zohoCustomConfig.customFields || []).map((cf) => {
                  const val = form.customFieldValues?.[cf.key] ?? '';
                  const setCfVal = (v) =>
                    setForm((prev) => ({
                      ...prev,
                      customFieldValues: { ...(prev.customFieldValues || {}), [cf.key]: v },
                    }));
                  return (
                    <div key={cf.id}>
                      {renderRow(
                        cf.label,
                        cf.type === 'picklist' ? (
                          <select value={val} onChange={(e) => setCfVal(e.target.value)} className={inputCls(errors[`cf_${cf.key}`])}>
                            <option value="">-None-</option>
                            {(cf.options || []).map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : cf.type === 'checkbox' ? (
                          <div className="pt-1.5">
                            <input
                              type="checkbox"
                              checked={Boolean(val)}
                              onChange={(e) => setCfVal(e.target.checked)}
                              className="h-4 w-4 accent-[#2F55D4]"
                            />
                          </div>
                        ) : (
                          <input
                            type={cf.type === 'number' ? 'number' : cf.type === 'date' ? 'date' : 'text'}
                            value={val}
                            onChange={(e) => setCfVal(e.target.value)}
                            className={inputCls(errors[`cf_${cf.key}`])}
                          />
                        ),
                        cf.required,
                        errors[`cf_${cf.key}`]
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ---- Section 2: Address Information ---- */}
        <div>
          <div className="text-[16px] font-bold text-[#1F2A44] pb-2 mb-3 border-b border-[#EEF1F7]">
            Address Information
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-0.5">
            <div className="space-y-1">
              {renderRow(
                'Street',
                <input
                  type="text"
                  value={form.street}
                  onChange={(e) => setField('street', e.target.value)}
                  className={inputCls()}
                />
              )}
              {renderRow(
                'State',
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => setField('state', e.target.value)}
                  className={inputCls()}
                />
              )}
              {renderRow(
                'Country',
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => setField('country', e.target.value)}
                  className={inputCls()}
                />
              )}
            </div>
            <div className="space-y-1">
              {renderRow(
                'City',
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setField('city', e.target.value)}
                  className={inputCls()}
                />
              )}
              {renderRow(
                'Zip Code',
                <input
                  type="text"
                  value={form.zip}
                  onChange={(e) => setField('zip', e.target.value)}
                  className={inputCls()}
                />
              )}
              {renderRow(
                'Branch Area',
                <input
                  type="text"
                  value={form.branchArea}
                  onChange={(e) => setField('branchArea', e.target.value)}
                  className={inputCls()}
                />
              )}
            </div>
          </div>
        </div>

        {/* ---- Section 3: Description Information ---- */}
        <div>
          <div className="text-[16px] font-bold text-[#1F2A44] pb-2 mb-3 border-b border-[#EEF1F7]">
            Description Information
          </div>
          <div className="max-w-[780px]">
            <div className="grid grid-cols-12 items-start gap-3 py-1.5">
              <label className="col-span-3 text-right text-[14px] text-[#4B5578] pt-1.5">
                Description
              </label>
              <div className="col-span-9">
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  placeholder="Enter detailed requirement notes, document language pairs, or special instructions..."
                  className="w-full p-3 rounded-[4px] border border-[#CBD5E1] hover:border-[#94A3B8] bg-white text-[14px] text-[#1F2A44] focus:outline-none focus:border-[#2F55D4]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Custom Form Page Modal */}
      <Modal
        open={customFormModalOpen}
        onClose={() => setCustomFormModalOpen(false)}
        title="Create Custom Form Page Layout"
        size="sm"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setCustomFormModalOpen(false)}>Cancel</button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                if (!newLayoutName.trim()) return;
                const trimmed = newLayoutName.trim();
                if (!customLayouts.includes(trimmed)) setCustomLayouts([...customLayouts, trimmed]);
                setSelectedLayout(trimmed);
                updateZohoCustomConfig({ formLayout: trimmed });
                setNewLayoutName('');
                setCustomFormModalOpen(false);
                notify(`Created and activated layout "${trimmed}"`, 'success');
              }}
            >
              Create Layout
            </button>
          </>
        }
      >
        <div className="space-y-3 text-[13px]">
          <label className="block text-[#4B5578] font-medium">
            Custom Layout Name
            <input
              className="input mt-1"
              placeholder="e.g. Fast Track Translation Intake"
              value={newLayoutName}
              onChange={(e) => setNewLayoutName(e.target.value)}
            />
          </label>
          <p className="text-[12px] text-[#6B7696]">
            You can further configure custom fields and required rules in <b>Edit Page Layout</b>.
          </p>
        </div>
      </Modal>

      {/* Edit Page Layout / Customization Modal */}
      <ZohoCustomizationModal
        open={customizeModalOpen}
        initialTab="fields"
        onClose={() => setCustomizeModalOpen(false)}
        onNotify={notify}
      />
    </div>
  );
}
