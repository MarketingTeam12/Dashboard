import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Check, ChevronDown, ExternalLink, Info, Lock,
  Building2, UserCheck, Briefcase, Tag, AlertCircle, Sparkles, Phone, Mail, MapPin, Calendar
} from 'lucide-react';
import { useCRM } from '../../context/crmContextInstance';
import { useToast } from '../../components/common/toastContext';
import { addDays, todayISO, fmtINR } from '../../utils/calculations';
import { LEAD_SOURCES, LEAD_TAGS } from '../../data/seedData';
import { leadCategory, leadSource } from './leadFilters';
import { useZohoCustomization } from './zohoCustomizationConfig';

const DEAL_STAGES = [
  'Qualification',
  'Needs Analysis',
  'Deal Estimation sent to Client',
  'Proposal',
  'Negotiation',
  'Deal Invoice Ready',
  'Deal Job Seeking & Agency',
  'Closed Won',
  'Closed Lost',
  'Pre-Deal Lost',
];

const CITIES_LIST = [
  'Chennai',
  'Bengaluru',
  'Mumbai',
  'Delhi',
  'Hyderabad',
  'Pune',
  'Kochi',
  'Coimbatore',
  'Kolkata',
  'Ahmedabad',
  'Madurai',
  'Trichy',
];

const LANGUAGES_LIST = [
  'English',
  'Tamil',
  'Hindi',
  'Telugu',
  'Malayalam',
  'Kannada',
  'French',
  'German',
  'Spanish',
  'Arabic',
  'Japanese',
  'Chinese',
  'Russian',
  'Portuguese',
  'Italian',
];

const CATEGORIES_LIST = [
  'Translation Services',
  'Interpretation',
  'Transcription Services',
  'Attestation Services',
  'Dubbing / VoiceOver',
  'Visa & Immigration',
  'Overseas Education',
  'Desktop Publishing (DTP)',
  'Subtitling & Localization',
  'Content Writing',
  'Information Technology',
  'Enterprise Software',
];

const PURPOSE_OF_TRANSLATION_OPTIONS = [
  '-None-',
  'Official / Legal Submission',
  'Business & Corporate Communication',
  'Visa & Immigration Processing',
  'Academic / University Admission',
  'Medical & Clinical Documentation',
  'Technical Manual Localization',
  'Marketing & Website Localization',
  'Personal Certificate Verification',
];

const JOB_TYPE_OPTIONS = [
  '-None-',
  'Document Translation',
  'Certified Attestation',
  'Simultaneous Interpretation',
  'Consecutive Interpretation',
  'Audio/Video Transcription',
  'Multilingual DTP',
  'VoiceOver & Dubbing',
  'Software Localization',
];

const DELIVERY_TYPE_OPTIONS = [
  '-None-',
  'Standard Delivery (3-5 Days)',
  'Express / Urgent (24 Hours)',
  'Same Day Delivery',
  'Hard Copy Courier + Soft Copy',
  'Digital Soft Copy (PDF/Word)',
  'Notarized Physical Copy',
];

const CONTACT_ROLE_OPTIONS = [
  'None',
  'Decision Maker',
  'Evaluator',
  'Executive Sponsor',
  'Procurement / Purchasing',
  'Influencer',
  'Primary Contact',
  'End User',
  'Legal Reviewer',
];

export default function ConvertLeadPage({ leadProp = null, onCancel = null }) {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const {
    leads = [],
    users = [],
    campaigns = [],
    userName,
    convertLead,
  } = useCRM();
  const { config: zohoCustomConfig } = useZohoCustomization();

  const lead = useMemo(() => {
    if (leadProp) return leadProp;
    return leads.find((l) => l.id === routeId);
  }, [leadProp, leads, routeId]);

  const initialTags = useMemo(() => {
    if (!lead) return [];
    const forbidden = new Set(['Lead', 'Hot Lead', 'Hot', 'Product Demo', 'IT Industry', 'swich offival', 'tag']);
    const list = [];
    if (lead.tag && !forbidden.has(lead.tag)) list.push(lead.tag);
    if (Array.isArray(lead.tags)) {
      lead.tags.forEach((t) => {
        if (t && !forbidden.has(t) && !list.includes(t)) list.push(t);
      });
    }
    return list;
  }, [lead]);

  const allAvailableTags = useMemo(() => {
    const customTags = zohoCustomConfig?.customTags || zohoCustomConfig?.tagOptions || [];
    const base = customTags.length > 0 ? customTags : LEAD_TAGS;
    const forbidden = new Set(['Lead', 'Hot Lead', 'Hot', 'Product Demo', 'IT Industry', 'swich offival', 'tag']);
    return Array.from(new Set(base)).filter(
      (t) => t && !forbidden.has(t)
    );
  }, [zohoCustomConfig]);

  const allSources = useMemo(() => {
    const customSources = zohoCustomConfig?.customSources || zohoCustomConfig?.sourceOptions || [];
    return Array.from(new Set([...LEAD_SOURCES, ...customSources]));
  }, [zohoCustomConfig]);

  const allCategories = useMemo(() => {
    const customCats = zohoCustomConfig?.customCategories || zohoCustomConfig?.categoryOptions || [];
    return Array.from(new Set([...CATEGORIES_LIST, ...customCats]));
  }, [zohoCustomConfig]);

  const campaignOptions = useMemo(() => {
    const names = campaigns.map((c) => c.name).filter(Boolean);
    return Array.from(
      new Set([
        ...(lead?.campaignName ? [lead.campaignName] : []),
        ...names,
        'General Inbound Campaign',
        'Google Ads Search Campaign',
        'Justdial B2B Lead Gen',
        'IndiaMART Enterprise',
        'Website Organic Inquiry',
      ])
    );
  }, [campaigns, lead]);

  // Conversion State — Create Deal checkbox starts false (or toggled by user) per Screenshots 2–5
  const [createDeal, setCreateDeal] = useState(false);
  const [ownerId, setOwnerId] = useState(lead?.ownerId || 'u1');
  const [notifyOwner, setNotifyOwner] = useState(true);
  const [carryTagsToContact, setCarryTagsToContact] = useState(true);
  const [carryTagsToDeal, setCarryTagsToDeal] = useState(true);
  const [selectedContactTags, setSelectedContactTags] = useState(initialTags);
  const [selectedDealTags, setSelectedDealTags] = useState(initialTags);
  const [tagSearch, setTagSearch] = useState('');
  const [errors, setErrors] = useState({});

  // Contact preview/edit state
  const [contactForm, setContactForm] = useState({
    name: lead?.name || '',
    email: lead?.email || '',
    phone: lead?.mobile || lead?.phone || '',
  });

  // 16 Deal fields matching Zoho CRM Screenshots 2–5
  const [dealForm, setDealForm] = useState(() => ({
    leadManager1: userName(lead?.leadManager1Id || lead?.ownerId) !== '—'
      ? userName(lead?.leadManager1Id || lead?.ownerId)
      : 'Sibi Chakaravarthi',
    dealName: lead?.company || lead?.name || '',
    closingDate: addDays(todayISO(), 14),
    leadSource: lead ? leadSource(lead) : 'Website',
    stage: 'Qualification',
    city: lead?.city || 'Chennai',
    sourceLanguageList: lead?.sourceLang ? [lead.sourceLang] : ['English'],
    targetLanguageList: lead?.targetLang ? [lead.targetLang] : ['Tamil'],
    categories: lead ? leadCategory(lead) : 'Translation Services',
    remarks: lead?.remarks || lead?.description || '',
    clientBudget: lead?.clientBudget || lead?.amount || 45000,
    purposeOfTranslation: 'Official / Legal Submission',
    jobType: 'Document Translation',
    deliveryType: 'Standard Delivery (3-5 Days)',
    campaignSource: lead?.campaignName || campaignOptions[0] || 'General Inbound Campaign',
    contactRole: 'Decision Maker',
  }));

  const [sourceLangDropdownOpen, setSourceLangDropdownOpen] = useState(false);
  const [targetLangDropdownOpen, setTargetLangDropdownOpen] = useState(false);

  if (!lead) {
    return (
      <div className="p-8 text-center text-[#64748B]">
        Lead record not found.{' '}
        <button
          type="button"
          onClick={() => navigate('/leads')}
          className="text-[#2563EB] hover:underline font-medium"
        >
          Back to Leads
        </button>
      </div>
    );
  }

  const isAlreadyConverted =
    lead.status === 'Converted' && (lead.convertedContactId || lead.convertedDealId);

  const handleBackOrCancel = () => {
    if (onCancel) {
      onCancel();
      return;
    }
    const target = location.state?.from || `/leads/${lead.id}`;
    navigate(target);
  };

  const toggleLanguage = (fieldKey, lang) => {
    setDealForm((prev) => {
      const current = Array.isArray(prev[fieldKey]) ? prev[fieldKey] : [];
      const exists = current.includes(lang);
      const next = exists ? current.filter((x) => x !== lang) : [...current, lang];
      return { ...prev, [fieldKey]: next.length > 0 ? next : [lang] };
    });
  };

  const toggleContactTag = (t) => {
    setSelectedContactTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const toggleDealTag = (t) => {
    setSelectedDealTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const validateAndConvert = (e) => {
    e.preventDefault();
    if (isAlreadyConverted) {
      toast.error(`Lead "${lead.name}" is already converted.`);
      return;
    }

    const nextErrors = {};
    if (!contactForm.name.trim()) {
      nextErrors.contactName = 'Contact Name is required.';
    }

    if (createDeal) {
      if (!dealForm.dealName.trim()) {
        nextErrors.dealName = 'Deal Name cannot be empty.';
      }
      if (!dealForm.closingDate) {
        nextErrors.closingDate = 'Closing Date is required.';
      }
      if (!dealForm.stage) {
        nextErrors.stage = 'Stage is required.';
      }
      if (!dealForm.categories) {
        nextErrors.categories = 'Categories is required.';
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.error('Please fill in all required fields before converting.');
      return;
    }

    setErrors({});
    const result = convertLead(lead.id, {
      createDeal,
      ownerId,
      notifyOwner,
      carryTagsToContact,
      carryTagsToDeal: createDeal ? carryTagsToDeal : false,
      contactTags: selectedContactTags,
      dealTags: selectedDealTags,
      contactName: contactForm.name.trim(),
      contactEmail: contactForm.email.trim(),
      contactPhone: contactForm.phone.trim(),
      ...dealForm,
      amount: Number(dealForm.clientBudget) || 0,
    });

    if (!result || result.alreadyConverted) return;

    if (createDeal && result.deal?.id) {
      navigate(`/deals/${result.deal.id}`, {
        state: { from: `/leads/${lead.id}`, fromLabel: 'Back to Lead' },
      });
    } else if (result.contact?.id) {
      navigate(`/contacts/${result.contact.id}`, {
        state: { from: `/leads/${lead.id}`, fromLabel: 'Back to Lead' },
      });
    } else {
      navigate(`/leads/${lead.id}`);
    }
  };

  return (
    <div className="-mx-3 sm:-mx-[18px] -mt-2.5 bg-[#F5F7FA] min-h-[calc(100vh-56px)] flex flex-col">
      {/* =================================================================== */}
      {/* TOP HEADER — CONVERT LEAD (Screenshots 2–5)                         */}
      {/* =================================================================== */}
      <div className="bg-white border-b border-[#E2E8F0] px-6 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBackOrCancel}
            className="w-8 h-8 rounded-full border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] flex items-center justify-center text-[#334155] transition"
            title="Back to Lead Details"
          >
            <ArrowLeft size={17} />
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-[22px] font-bold text-[#0F172A]">
                Convert Lead
              </h1>
              <span className="text-[15px] font-medium text-[#475569]">
                ({lead.name}
                {lead.company ? ` - ${lead.company}` : ''})
              </span>
              {lead.tag && lead.tag !== 'Lead' && (
                <span
                  className="inline-flex items-center px-2.5 py-0.5 rounded text-[12px] font-semibold text-white"
                  style={{ backgroundColor: zohoCustomConfig?.tagColors?.[lead.tag] || '#2563EB' }}
                >
                  {lead.tag}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={validateAndConvert}
            disabled={isAlreadyConverted}
            className="h-9 px-4 rounded-[5px] bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white text-[14px] font-semibold shadow-xs transition"
          >
            Convert
          </button>
          <button
            type="button"
            onClick={handleBackOrCancel}
            className="h-9 px-4 rounded-[5px] border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#334155] text-[14px] font-medium transition"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* MAIN TWO-COLUMN BODY (Conversion Form + Quick Links Sidebar)        */}
      {/* =================================================================== */}
      <div className="max-w-[1360px] w-full mx-auto px-6 py-5 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* LEFT MAIN CONVERSION FORM (9 Columns) */}
        <form onSubmit={validateAndConvert} className="lg:col-span-9 space-y-5">
          {isAlreadyConverted && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center justify-between text-[14px] text-emerald-900">
              <div className="flex items-center gap-2.5">
                <AlertCircle size={18} className="text-emerald-600 shrink-0" />
                <span>
                  This Lead has already been converted on <b>{lead.convertedAt || todayISO()}</b>.
                </span>
              </div>
              <div className="flex items-center gap-3">
                {lead.convertedContactId && (
                  <button
                    type="button"
                    onClick={() => navigate(`/contacts/${lead.convertedContactId}`)}
                    className="text-[#2563EB] hover:underline font-semibold"
                  >
                    View Contact
                  </button>
                )}
                {lead.convertedDealId && (
                  <button
                    type="button"
                    onClick={() => navigate(`/deals/${lead.convertedDealId}`)}
                    className="text-[#2563EB] hover:underline font-semibold"
                  >
                    View Deal
                  </button>
                )}
              </div>
            </div>
          )}

          {/* CARD 1: CREATE NEW ACCOUNT / CONTACT & DEAL TOGGLE */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
            <div className="divide-y divide-[#EEF2F6]">
              {/* Create New Account Row (if company exists) */}
              {lead.company && (
                <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-[220px] shrink-0 text-[14px] font-medium text-[#1E293B]">
                    Create New Account
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#F1F5F9] border border-[#CBD5E1] text-[14px] font-semibold text-[#334155]">
                      <Building2 size={14} className="text-[#475569]" />
                      {lead.company}
                    </span>
                  </div>
                </div>
              )}

              {/* Create New Contact Row */}
              <div className="px-6 py-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-[220px] shrink-0 text-[14px] font-medium text-[#1E293B]">
                    Create New Contact
                  </div>
                  <div className="flex flex-wrap items-center gap-3 flex-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#EFF6FF] border border-[#BFDBFE] text-[14px] font-semibold text-[#1D4ED8]">
                      <UserCheck size={14} />
                      {contactForm.name || lead.name}
                    </span>
                    <span className="text-[13.5px] text-[#64748B]">
                      {contactForm.email || lead.email || 'No email'} • {contactForm.phone || lead.mobile || lead.phone || 'No mobile'}
                    </span>
                  </div>
                </div>

                {/* Editable Contact Details Row */}
                <div className="sm:pl-[236px] grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[13.5px] font-medium text-[#64748B] mb-1">
                      Contact Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className={`w-full h-9 px-3 rounded border text-[14px] text-[#0F172A] focus:outline-none focus:border-[#2563EB] ${
                        errors.contactName ? 'border-rose-500 bg-rose-50/30' : 'border-[#CBD5E1]'
                      }`}
                    />
                    {errors.contactName && (
                      <p className="text-[12px] text-rose-600 mt-0.5">{errors.contactName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[13.5px] font-medium text-[#64748B] mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full h-9 px-3 rounded border border-[#CBD5E1] text-[14px] text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>
                  <div>
                    <label className="block text-[13.5px] font-medium text-[#64748B] mb-1">
                      Mobile / Phone
                    </label>
                    <input
                      type="text"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      className="w-full h-9 px-3 rounded border border-[#CBD5E1] text-[14px] text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>
                </div>

                {/* Checkbox: Create a new Deal for this Contact */}
                <div className="sm:pl-[236px] pt-2">
                  <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      id="create-new-deal-checkbox"
                      type="checkbox"
                      checked={createDeal}
                      onChange={(e) => setCreateDeal(e.target.checked)}
                      className="w-4 h-4 rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB]"
                    />
                    <span className="text-[14px] font-medium text-[#0F172A]">
                      Create a new Deal for this Contact.
                    </span>
                  </label>
                </div>
              </div>

              {/* =============================================================== */}
              {/* DYNAMIC DEAL FIELDS (Shown ONLY when Create Deal is checked)     */}
              {/* =============================================================== */}
              {createDeal && (
                <div className="px-6 py-5 bg-[#F8FAFC] border-t border-[#E2E8F0] space-y-5">
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
                    <div className="flex items-center gap-2">
                      <Briefcase size={16} className="text-[#2563EB]" />
                      <h2 className="text-[16px] font-semibold text-[#0F172A]">
                        Create New Deal — Deal Information
                      </h2>
                    </div>
                    <span className="text-[13px] text-[#64748B]">
                      Fields marked with <span className="text-rose-500 font-bold">*</span> are mandatory
                    </span>
                  </div>

                  {/* 2-Column Zoho CRM Deal Form Grid with all 16 required fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    {/* 1. Lead Manager 1 */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <label className="sm:w-[175px] shrink-0 text-[14px] font-medium text-[#475569] sm:text-right">
                        Lead Manager 1
                      </label>
                      <select
                        value={dealForm.leadManager1}
                        onChange={(e) => setDealForm({ ...dealForm, leadManager1: e.target.value })}
                        className="flex-1 h-9 px-3 rounded border border-[#CBD5E1] bg-white text-[14px] text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                      >
                        {['Sibi Chakaravarthi', ...users.map((u) => u.name)]
                          .filter((v, i, a) => a.indexOf(v) === i)
                          .map((uName) => (
                            <option key={uName} value={uName}>
                              {uName}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* 2. Deal Name */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <label className="sm:w-[175px] shrink-0 text-[14px] font-medium text-[#475569] sm:text-right">
                        Deal Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={dealForm.dealName}
                          onChange={(e) => setDealForm({ ...dealForm, dealName: e.target.value })}
                          placeholder="Enter Deal Name"
                          className={`w-full h-9 px-3 rounded border bg-white text-[14px] text-[#0F172A] focus:outline-none focus:border-[#2563EB] ${
                            errors.dealName ? 'border-rose-500' : 'border-[#CBD5E1]'
                          }`}
                        />
                        {errors.dealName && (
                          <p className="text-[12px] text-rose-600 mt-0.5">{errors.dealName}</p>
                        )}
                      </div>
                    </div>

                    {/* 3. Closing Date */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <label className="sm:w-[175px] shrink-0 text-[14px] font-medium text-[#475569] sm:text-right">
                        Closing Date <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex-1">
                        <input
                          type="date"
                          value={dealForm.closingDate}
                          onChange={(e) => setDealForm({ ...dealForm, closingDate: e.target.value })}
                          className={`w-full h-9 px-3 rounded border bg-white text-[14px] text-[#0F172A] focus:outline-none focus:border-[#2563EB] ${
                            errors.closingDate ? 'border-rose-500' : 'border-[#CBD5E1]'
                          }`}
                        />
                        {errors.closingDate && (
                          <p className="text-[12px] text-rose-600 mt-0.5">{errors.closingDate}</p>
                        )}
                      </div>
                    </div>

                    {/* 4. Lead Source */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <label className="sm:w-[175px] shrink-0 text-[14px] font-medium text-[#475569] sm:text-right">
                        Lead Source
                      </label>
                      <select
                        value={dealForm.leadSource}
                        onChange={(e) => setDealForm({ ...dealForm, leadSource: e.target.value })}
                        className="flex-1 h-9 px-3 rounded border border-[#CBD5E1] bg-white text-[14px] text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                      >
                        {allSources.map((src) => (
                          <option key={src} value={src}>
                            {src}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 5. Stage */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <label className="sm:w-[175px] shrink-0 text-[14px] font-medium text-[#475569] sm:text-right">
                        Stage <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex-1">
                        <select
                          value={dealForm.stage}
                          onChange={(e) => setDealForm({ ...dealForm, stage: e.target.value })}
                          className={`w-full h-9 px-3 rounded border bg-white text-[14px] text-[#0F172A] focus:outline-none focus:border-[#2563EB] ${
                            errors.stage ? 'border-rose-500' : 'border-[#CBD5E1]'
                          }`}
                        >
                          {DEAL_STAGES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* 6. City */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <label className="sm:w-[175px] shrink-0 text-[14px] font-medium text-[#475569] sm:text-right">
                        City
                      </label>
                      <select
                        value={dealForm.city}
                        onChange={(e) => setDealForm({ ...dealForm, city: e.target.value })}
                        className="flex-1 h-9 px-3 rounded border border-[#CBD5E1] bg-white text-[14px] text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                      >
                        {Array.from(new Set([dealForm.city, ...CITIES_LIST].filter(Boolean))).map((ct) => (
                          <option key={ct} value={ct}>
                            {ct}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 7. Source Language List */}
                    <div className="flex flex-col sm:flex-row sm:items-start gap-2 relative">
                      <label className="sm:w-[175px] shrink-0 text-[14px] font-medium text-[#475569] sm:text-right pt-1.5">
                        Source Language List
                      </label>
                      <div className="flex-1 relative">
                        <button
                          type="button"
                          onClick={() => {
                            setSourceLangDropdownOpen((o) => !o);
                            setTargetLangDropdownOpen(false);
                          }}
                          className="w-full min-h-[36px] px-3 py-1 rounded border border-[#CBD5E1] bg-white text-left text-[14px] text-[#0F172A] flex items-center justify-between gap-2"
                        >
                          <div className="flex flex-wrap gap-1">
                            {(dealForm.sourceLanguageList || []).map((lang) => (
                              <span
                                key={lang}
                                className="inline-flex items-center px-2 py-0.5 bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] rounded text-[12px] font-medium"
                              >
                                {lang}
                              </span>
                            ))}
                          </div>
                          <ChevronDown size={14} className="text-[#64748B] shrink-0" />
                        </button>
                        {sourceLangDropdownOpen && (
                          <div className="absolute left-0 right-0 top-[40px] z-30 bg-white border border-[#CBD5E1] rounded shadow-lg max-h-48 overflow-y-auto p-1.5 space-y-0.5">
                            {LANGUAGES_LIST.map((lang) => {
                              const checked = (dealForm.sourceLanguageList || []).includes(lang);
                              return (
                                <label
                                  key={lang}
                                  className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[#F8FAFC] text-[13.5px] cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleLanguage('sourceLanguageList', lang)}
                                    className="rounded border-[#CBD5E1] text-[#2563EB]"
                                  />
                                  <span>{lang}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 8. Target Language List */}
                    <div className="flex flex-col sm:flex-row sm:items-start gap-2 relative">
                      <label className="sm:w-[175px] shrink-0 text-[14px] font-medium text-[#475569] sm:text-right pt-1.5">
                        Target Language List
                      </label>
                      <div className="flex-1 relative">
                        <button
                          type="button"
                          onClick={() => {
                            setTargetLangDropdownOpen((o) => !o);
                            setSourceLangDropdownOpen(false);
                          }}
                          className="w-full min-h-[36px] px-3 py-1 rounded border border-[#CBD5E1] bg-white text-left text-[14px] text-[#0F172A] flex items-center justify-between gap-2"
                        >
                          <div className="flex flex-wrap gap-1">
                            {(dealForm.targetLanguageList || []).map((lang) => (
                              <span
                                key={lang}
                                className="inline-flex items-center px-2 py-0.5 bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] rounded text-[12px] font-medium"
                              >
                                {lang}
                              </span>
                            ))}
                          </div>
                          <ChevronDown size={14} className="text-[#64748B] shrink-0" />
                        </button>
                        {targetLangDropdownOpen && (
                          <div className="absolute left-0 right-0 top-[40px] z-30 bg-white border border-[#CBD5E1] rounded shadow-lg max-h-48 overflow-y-auto p-1.5 space-y-0.5">
                            {LANGUAGES_LIST.map((lang) => {
                              const checked = (dealForm.targetLanguageList || []).includes(lang);
                              return (
                                <label
                                  key={lang}
                                  className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[#F8FAFC] text-[13.5px] cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleLanguage('targetLanguageList', lang)}
                                    className="rounded border-[#CBD5E1] text-[#2563EB]"
                                  />
                                  <span>{lang}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 9. Categories */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <label className="sm:w-[175px] shrink-0 text-[14px] font-medium text-[#475569] sm:text-right">
                        Categories <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={dealForm.categories}
                        onChange={(e) => setDealForm({ ...dealForm, categories: e.target.value })}
                        className="flex-1 h-9 px-3 rounded border border-[#CBD5E1] bg-white text-[14px] text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                      >
                        {allCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 11. Client Budget */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <label className="sm:w-[175px] shrink-0 text-[14px] font-medium text-[#475569] sm:text-right">
                        Client Budget (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={dealForm.clientBudget}
                        onChange={(e) => setDealForm({ ...dealForm, clientBudget: e.target.value })}
                        placeholder="e.g. 45000"
                        className="flex-1 h-9 px-3 rounded border border-[#CBD5E1] bg-white text-[14px] text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                      />
                    </div>

                    {/* 10. Remarks (Full width or 2-col) */}
                    <div className="flex flex-col sm:flex-row sm:items-start gap-2 md:col-span-2">
                      <label className="sm:w-[175px] shrink-0 text-[14px] font-medium text-[#475569] sm:text-right pt-1.5">
                        Remarks
                      </label>
                      <textarea
                        rows={2}
                        value={dealForm.remarks}
                        onChange={(e) => setDealForm({ ...dealForm, remarks: e.target.value })}
                        placeholder="Enter deal remarks, translation volume, or special instructions..."
                        className="flex-1 px-3 py-1.5 rounded border border-[#CBD5E1] bg-white text-[14px] text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                      />
                    </div>

                    {/* 12. Purpose of Translation */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <label className="sm:w-[175px] shrink-0 text-[14px] font-medium text-[#475569] sm:text-right">
                        Purpose of Translation
                      </label>
                      <select
                        value={dealForm.purposeOfTranslation}
                        onChange={(e) =>
                          setDealForm({ ...dealForm, purposeOfTranslation: e.target.value })
                        }
                        className="flex-1 h-9 px-3 rounded border border-[#CBD5E1] bg-white text-[14px] text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                      >
                        {PURPOSE_OF_TRANSLATION_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 13. Job Type */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <label className="sm:w-[175px] shrink-0 text-[14px] font-medium text-[#475569] sm:text-right">
                        Job Type
                      </label>
                      <select
                        value={dealForm.jobType}
                        onChange={(e) => setDealForm({ ...dealForm, jobType: e.target.value })}
                        className="flex-1 h-9 px-3 rounded border border-[#CBD5E1] bg-white text-[14px] text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                      >
                        {JOB_TYPE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 14. Delivery Type */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <label className="sm:w-[175px] shrink-0 text-[14px] font-medium text-[#475569] sm:text-right">
                        Delivery Type
                      </label>
                      <select
                        value={dealForm.deliveryType}
                        onChange={(e) => setDealForm({ ...dealForm, deliveryType: e.target.value })}
                        className="flex-1 h-9 px-3 rounded border border-[#CBD5E1] bg-white text-[14px] text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                      >
                        {DELIVERY_TYPE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 15. Campaign Source */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <label className="sm:w-[175px] shrink-0 text-[14px] font-medium text-[#475569] sm:text-right">
                        Campaign Source
                      </label>
                      <select
                        value={dealForm.campaignSource}
                        onChange={(e) => setDealForm({ ...dealForm, campaignSource: e.target.value })}
                        className="flex-1 h-9 px-3 rounded border border-[#CBD5E1] bg-white text-[14px] text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                      >
                        {campaignOptions.map((camp) => (
                          <option key={camp} value={camp}>
                            {camp}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 16. Contact Role */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <label className="sm:w-[175px] shrink-0 text-[14px] font-medium text-[#475569] sm:text-right">
                        Contact Role
                      </label>
                      <select
                        value={dealForm.contactRole}
                        onChange={(e) => setDealForm({ ...dealForm, contactRole: e.target.value })}
                        className="flex-1 h-9 px-3 rounded border border-[#CBD5E1] bg-white text-[14px] text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                      >
                        {CONTACT_ROLE_OPTIONS.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* =============================================================== */}
              {/* OWNER OF NEW RECORDS, NOTIFY OWNER & CARRY OVER TAGS            */}
              {/* =============================================================== */}
              <div className="px-6 py-5 space-y-5">
                {/* Owner of the New Records */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-[220px] shrink-0 text-[14px] font-medium text-[#475569]">
                    Owner of the New Records
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <select
                      value={ownerId}
                      onChange={(e) => setOwnerId(e.target.value)}
                      className="h-9 px-3 w-[260px] rounded border border-[#CBD5E1] bg-white text-[14px] text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                    >
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                    </select>

                    <label className="inline-flex items-center gap-2 text-[14px] text-[#334155] cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={notifyOwner}
                        onChange={(e) => setNotifyOwner(e.target.checked)}
                        className="w-4 h-4 rounded border-[#CBD5E1] text-[#2563EB]"
                      />
                      <span>Notify record owner</span>
                    </label>
                  </div>
                </div>

                {/* Carry over Tags to */}
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 pt-2 border-t border-[#F1F5F9]">
                  <div className="w-[220px] shrink-0 text-[14px] font-medium text-[#475569] pt-1">
                    Carry over Tags to
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="max-w-xs">
                      <input
                        type="text"
                        value={tagSearch}
                        onChange={(e) => setTagSearch(e.target.value)}
                        placeholder="Search tags..."
                        className="w-full h-8 px-3 rounded border border-[#CBD5E1] bg-white text-[13.5px] text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                      />
                    </div>
                    {/* Carry over Tags to Contact */}
                    <div className="space-y-1.5">
                      <label className="inline-flex items-center gap-2 text-[14px] font-medium text-[#1E293B] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={carryTagsToContact}
                          onChange={(e) => setCarryTagsToContact(e.target.checked)}
                          className="w-4 h-4 rounded border-[#CBD5E1] text-[#2563EB]"
                        />
                        <span>Contact</span>
                      </label>
                      {carryTagsToContact && (
                        <div className="pl-6 flex flex-wrap items-center gap-1.5">
                          {allAvailableTags
                            .filter((t) => !tagSearch.trim() || t.toLowerCase().includes(tagSearch.trim().toLowerCase()))
                            .map((t) => {
                              const active = selectedContactTags.includes(t);
                              const badgeColor = zohoCustomConfig?.tagColors?.[t] || '#2563EB';
                              return (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => toggleContactTag(t)}
                                  style={active ? { backgroundColor: badgeColor, borderColor: badgeColor, color: '#FFFFFF' } : {}}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12.5px] font-medium border transition ${
                                    active
                                      ? 'shadow-2xs'
                                      : 'bg-white text-[#475569] border-[#CBD5E1] hover:border-[#94A3B8]'
                                  }`}
                                >
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: active ? '#FFFFFF' : badgeColor }}
                                  />
                                  <span>{t}</span>
                                  {active && <Check size={12} />}
                                </button>
                              );
                            })}
                        </div>
                      )}
                    </div>

                    {/* Carry over Tags to Deal */}
                    {createDeal && (
                      <div className="space-y-1.5">
                        <label className="inline-flex items-center gap-2 text-[14px] font-medium text-[#1E293B] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={carryTagsToDeal}
                            onChange={(e) => setCarryTagsToDeal(e.target.checked)}
                            className="w-4 h-4 rounded border-[#CBD5E1] text-[#2563EB]"
                          />
                          <span>Deal</span>
                        </label>
                        {carryTagsToDeal && (
                          <div className="pl-6 flex flex-wrap items-center gap-1.5">
                            {allAvailableTags
                              .filter((t) => !tagSearch.trim() || t.toLowerCase().includes(tagSearch.trim().toLowerCase()))
                              .map((t) => {
                                const active = selectedDealTags.includes(t);
                                const badgeColor = zohoCustomConfig?.tagColors?.[t] || '#2563EB';
                                return (
                                  <button
                                    key={t}
                                    type="button"
                                    onClick={() => toggleDealTag(t)}
                                    style={active ? { backgroundColor: badgeColor, borderColor: badgeColor, color: '#FFFFFF' } : {}}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12.5px] font-medium border transition ${
                                      active
                                        ? 'shadow-2xs'
                                        : 'bg-white text-[#475569] border-[#CBD5E1] hover:border-[#94A3B8]'
                                    }`}
                                  >
                                    <span
                                      className="w-2 h-2 rounded-full shrink-0"
                                      style={{ backgroundColor: active ? '#FFFFFF' : badgeColor }}
                                    />
                                    <span>{t}</span>
                                    {active && <Check size={12} />}
                                  </button>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="px-6 py-3.5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center gap-3">
              <button
                type="submit"
                disabled={isAlreadyConverted}
                className="h-9 px-5 rounded-[5px] bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white text-[14px] font-semibold shadow-xs transition"
              >
                Convert
              </button>
              <button
                type="button"
                onClick={handleBackOrCancel}
                className="h-9 px-5 rounded-[5px] border border-[#CBD5E1] bg-white hover:bg-[#F1F5F9] text-[#334155] text-[14px] font-medium transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>

        {/* RIGHT SIDEBAR — QUICK LINKS SECTION (Screenshots 2–5) */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-3">
            <h3 className="text-[16px] font-semibold text-[#0F172A] border-b border-[#F1F5F9] pb-2">
              Quick Links
            </h3>
            <ul className="space-y-2.5 text-[14px]">
              <li>
                <button
                  type="button"
                  onClick={handleBackOrCancel}
                  className="text-[#2563EB] hover:underline font-medium flex items-center gap-1.5"
                >
                  <ExternalLink size={13} />
                  <span>Lead Overview ({lead.name})</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/leads')}
                  className="text-[#2563EB] hover:underline flex items-center gap-1.5"
                >
                  <ExternalLink size={13} />
                  <span>All Leads View</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/contacts')}
                  className="text-[#2563EB] hover:underline flex items-center gap-1.5"
                >
                  <ExternalLink size={13} />
                  <span>Contacts Module</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/deals')}
                  className="text-[#2563EB] hover:underline flex items-center gap-1.5"
                >
                  <ExternalLink size={13} />
                  <span>Deals Pipeline</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Lead Snapshot Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-3">
            <h3 className="text-[13px] font-semibold text-[#0F172A] border-b border-[#F1F5F9] pb-2">
              Lead Summary
            </h3>
            <div className="space-y-2 text-[12px]">
              <div className="flex justify-between gap-2">
                <span className="text-[#64748B]">Lead Name</span>
                <span className="font-semibold text-[#0F172A] text-right">{lead.name}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#64748B]">Company</span>
                <span className="font-medium text-[#334155] text-right">{lead.company || '—'}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#64748B]">Mobile</span>
                <span className="font-medium text-[#334155] text-right">{lead.mobile || lead.phone || '—'}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#64748B]">Lead Source</span>
                <span className="font-medium text-[#334155] text-right">{leadSource(lead)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#64748B]">Category</span>
                <span className="font-medium text-[#334155] text-right">{leadCategory(lead)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#64748B]">City</span>
                <span className="font-medium text-[#334155] text-right">{lead.city || '—'}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#64748B]">Lead Status</span>
                <span className="px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8] font-semibold text-[11px]">
                  {lead.status || 'Assigned'}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

