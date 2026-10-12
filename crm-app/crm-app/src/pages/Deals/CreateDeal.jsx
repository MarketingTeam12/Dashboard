import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ArrowLeft, Camera, Check, ChevronDown, Coins, FileText, Info, Lock,
  Plus, Search, Settings, Trash2, Upload, User, X, Building2, Calendar
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useToast } from '../../components/common/Toast';
import { DEAL_SOURCES, DEPARTMENTS } from '../../data/seedData';
import { todayISO, fmtINR } from '../../utils/calculations';
import { UserAvatar } from '../../components/common/Avatar';
import {
  STAGES,
  STAGE_PROBABILITY,
  LEAD_SOURCE_OPTIONS,
  LEAD_SOURCE_COLORS,
  LANGUAGES,
  JOB_TYPE_OPTIONS,
  PURPOSE_TRANSLATION_OPTIONS,
  DELIVERY_TYPE_OPTIONS,
  SUBMISSION_STATUS_OPTIONS,
  SUBMISSION_STATUS_COLORS,
  PREVIOUS_PENDING_ESTIMATIONS_OPTIONS,
  TYPE_OPTIONS,
  FORECAST_CATEGORY_OPTIONS,
  CATEGORIES_OPTIONS,
  CATEGORY_OPTIONS,
  APPROVAL_STATUS_OPTIONS,
  EST_READY_OPTIONS
} from './dealsConfig';

export {
  STAGES,
  STAGE_PROBABILITY,
  LEAD_SOURCE_OPTIONS,
  LANGUAGES,
  JOB_TYPE_OPTIONS,
  PURPOSE_TRANSLATION_OPTIONS,
  DELIVERY_TYPE_OPTIONS,
  SUBMISSION_STATUS_OPTIONS,
  PREVIOUS_PENDING_ESTIMATIONS_OPTIONS,
  TYPE_OPTIONS,
  FORECAST_CATEGORY_OPTIONS,
  CATEGORIES_OPTIONS,
  CATEGORY_OPTIONS,
  APPROVAL_STATUS_OPTIONS,
  EST_READY_OPTIONS
};

/**
 * Standard Zoho CRM-style Form Field Row
 */
function FormRow({ label, required, error, children, readOnly, help }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-4 mb-3.5">
      <label className="sm:w-[170px] shrink-0 text-[13px] text-ink-600 font-medium sm:text-right sm:pt-1.5 flex items-center sm:justify-end gap-1">
        {required && <span className="text-red-500 font-bold">*</span>}
        <span>{label}</span>
        {readOnly && <Lock size={12} className="text-ink-400 ml-0.5" />}
      </label>
      <div className="flex-1 max-w-full sm:max-w-[340px] relative">
        {children}
        {help && !error && <p className="text-[11px] text-ink-400 mt-0.5">{help}</p>}
        {error && <p className="text-[11.5px] text-red-500 font-medium mt-1">{error}</p>}
      </div>
    </div>
  );
}

/**
 * Complete Zoho CRM-style Custom Dropdown Component
 * Features:
 * - Exact height (34px), borders, and padding matching existing theme
 * - ChevronDown indicator with smooth rotation
 * - Instant searchable filtering for large lists (> 6 items or explicitly searchable)
 * - Clear button (x) on hover when value is selected
 * - Rich option rendering (User avatars, Building & User icons, roles, subtitles)
 * - Click-outside and Escape key dismissal
 * - Dynamic upward / downward popover positioning to prevent clipping
 * - Z-index management to ensure open dropdowns overlay subsequent rows
 */
function ZohoDropdown({
  id,
  value,
  options = [],
  onChange,
  placeholder = '-Select-',
  searchable = false,
  error = false,
  disabled = false,
  readOnly = false,
  allowClear = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [direction, setDirection] = useState('down');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Normalize options into { value, label, sublabel, icon, user }
  const normalizedOptions = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'string') {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [options]);

  // Find selected option
  const selectedOption = useMemo(() => {
    return normalizedOptions.find((o) => String(o.value) === String(value));
  }, [normalizedOptions, value]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions;
    const q = searchQuery.toLowerCase().trim();
    return normalizedOptions.filter((o) => {
      const matchLabel = String(o.label || '').toLowerCase().includes(q);
      const matchVal = String(o.value || '').toLowerCase().includes(q);
      const matchSub = o.sublabel ? String(o.sublabel).toLowerCase().includes(q) : false;
      return matchLabel || matchVal || matchSub;
    });
  }, [normalizedOptions, searchQuery]);

  // Handle outside click & ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Dynamic direction calculation (up or down)
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 250 && rect.top > 250) {
        setDirection('up');
      } else {
        setDirection('down');
      }
    }
  }, [isOpen]);

  // Focus search input when popover opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      const t = setTimeout(() => searchInputRef.current?.focus(), 40);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
    setSearchQuery('');
  };

  const showSearch = searchable || normalizedOptions.length > 6;

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${isOpen ? 'z-30' : 'z-0'} ${className}`}
    >
      {/* Trigger Control */}
      <div
        id={id}
        tabIndex={disabled || readOnly ? -1 : 0}
        onClick={() => {
          if (!disabled && !readOnly) {
            setIsOpen((prev) => !prev);
          }
        }}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') && !disabled && !readOnly && !isOpen) {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        className={`group w-full h-[34px] px-2.5 text-[13px] bg-white border rounded-[4px] flex items-center justify-between cursor-pointer select-none transition-all ${
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-200 bg-red-50/20'
            : isOpen
            ? 'border-primary ring-1 ring-primary/20 shadow-xs'
            : 'border-line hover:border-slate-400'
        } ${disabled || readOnly ? 'opacity-60 cursor-not-allowed bg-slate-50' : ''}`}
      >
        {/* Selected Label Display */}
        <div className="flex items-center gap-2 truncate flex-1 mr-1">
          {selectedOption && selectedOption.value !== '' && selectedOption.label !== '-None-' ? (
            <>
              {selectedOption.user && (
                <UserAvatar name={selectedOption.user.name} color={selectedOption.user.color} size="xs" />
              )}
              {selectedOption.icon && !selectedOption.user && (
                <span className="shrink-0">{selectedOption.icon}</span>
              )}
              <span className="truncate text-ink font-normal">{selectedOption.label}</span>
            </>
          ) : selectedOption && selectedOption.label === '-None-' ? (
            <span className="text-ink-500 truncate">-None-</span>
          ) : (
            <span className="text-ink-400 truncate">{placeholder}</span>
          )}
        </div>

        {/* Action icons: Clear button + Chevron */}
        <div className="flex items-center gap-1 shrink-0">
          {allowClear && value && !disabled && !readOnly && (
            <button
              type="button"
              onClick={handleClear}
              className="text-ink-400 hover:text-ink-600 hover:bg-slate-100 p-0.5 rounded transition-colors"
              title="Clear selection"
            >
              <X size={12} />
            </button>
          )}
          <ChevronDown
            size={14}
            className={`text-ink-400 group-hover:text-ink-600 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-primary' : ''
            }`}
          />
        </div>
      </div>

      {/* Hidden input for standard accessibility */}
      <input type="hidden" name={id} value={value || ''} />

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 ${
            direction === 'up' ? 'bottom-[calc(100%+4px)]' : 'top-[calc(100%+4px)]'
          } z-50 bg-white border border-line rounded-[6px] shadow-lg max-h-60 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100`}
        >
          {/* Search Header */}
          {showSearch && (
            <div className="p-2 border-b border-line/70 bg-slate-50/80 sticky top-0 z-10">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-2 text-ink-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search options..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setIsOpen(false);
                    }
                  }}
                  className="w-full h-7 pl-7 pr-7 text-[12px] bg-white border border-line rounded outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-ink placeholder:text-ink-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-2 top-1.5 text-ink-400 hover:text-ink-600 p-0.5"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Option Items List */}
          <div className="flex-1 overflow-y-auto thin-scroll py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-3 text-center text-[12px] text-ink-400">
                No matching options
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <div
                    key={String(opt.value)}
                    onClick={() => handleSelect(opt.value)}
                    className={`px-3 py-1.5 text-[13px] flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#E8F0FE] text-primary font-medium'
                        : 'text-ink hover:bg-[#F2F6FC] hover:text-primary'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {opt.user && (
                        <UserAvatar name={opt.user.name} color={opt.user.color} size="xs" />
                      )}
                      {opt.icon && !opt.user && (
                        <span className="shrink-0">{opt.icon}</span>
                      )}
                      <span className="truncate">{opt.label}</span>
                      {opt.sublabel && (
                        <span className="text-[11px] text-ink-400 ml-1 truncate">({opt.sublabel})</span>
                      )}
                    </div>
                    {isSelected && <Check size={14} className="text-primary shrink-0 ml-2" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreateDeal({ record = {}, mode = 'create', onSave, onCancel }) {
  const { users, accounts, contacts } = useCRM();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [data, setData] = useState(() => ({
    ownerId: record.ownerId || 'u1',
    name: record.name || '',
    city: record.city || '',
    contactId: record.contactId || '',
    stage: record.stage || 'Need Deal Estimation',
    closingDate: record.closingDate || '',
    leadManager1: record.leadManager1 || 'u2',
    salesNo: record.salesNo || '',
    categories: record.categories || 'Translation',
    approvalStatus: record.approvalStatus || 'Draft',
    remarks: record.remarks || '',
    submissionStatus: record.submissionStatus || '-None-',
    languageClassInfo: record.languageClassInfo || '',
    source: record.source || 'Website',
    dealSuggestions: record.dealSuggestions || '',
    sourceLanguage: record.sourceLanguage || 'English',
    targetLanguage: record.targetLanguage || 'Hindi',
    jobType: record.jobType || 'ONE TIME',
    purposeOfTranslation: record.purposeOfTranslation || 'Business',
    othersSpecify: record.othersSpecify || '',
    clientBudget: record.clientBudget || '',
    deliveryType: record.deliveryType || 'Normal',
    accountId: record.accountId || '',
    amount: record.amount || '',
    overseasEducationInfo: record.overseasEducationInfo || '',
    previousPendingEstimations: record.previousPendingEstimations || '',
    previousStage: record.previousStage || '',
    clientName: record.clientName || '',
    approvalSentTime: record.approvalSentTime || '',
    mobile: record.mobile || '',
    mobileNo: record.mobileNo || '',
    estNo: record.estNo || '',
    closedWonDate: record.closedWonDate || '',
    probability: record.probability !== undefined ? record.probability : 10,
    expectedRevenue: record.expectedRevenue || '',
    forecastCategory: record.forecastCategory || 'Pipeline',
    estimationCreatedBy: record.estimationCreatedBy || 'u1',
    campaignSource: record.campaignSource || '',
    category: record.category || 'Commercial',
    comments: record.comments || '',
    invoiceNo: record.invoiceNo || '',
    type: record.type || 'New Business',
    description: record.description || '',
    estReady: record.estReady || '-None-',
    closedLostApproval: record.closedLostApproval || '-None-',
    closedWonApproval: record.closedWonApproval || '-None-',
    dealImage: record.dealImage || null,
    createdOn: record.createdOn || todayISO(),
    ...record,
  }));

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFormView, setSelectedFormView] = useState('Standard View');

  // Dropdown options configurations
  const ownerOptions = useMemo(
    () => users.map((u) => ({ value: u.id, label: u.name, user: u, sublabel: u.role })),
    [users]
  );

  const leadManager1Options = useMemo(
    () => [
      { value: '', label: '-None-' },
      ...users.map((u) => ({ value: u.id, label: u.name, user: u, sublabel: u.role }))
    ],
    [users]
  );

  const estimationCreatedByOptions = useMemo(
    () => [
      { value: '', label: '-None-' },
      ...users.map((u) => ({ value: u.id, label: u.name, user: u, sublabel: u.role }))
    ],
    [users]
  );

  const accountOptions = useMemo(
    () =>
      [...accounts]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((a) => ({
          value: a.id,
          label: a.name,
          icon: <Building2 size={13} className="text-ink-400" />,
          sublabel: a.industry || a.location || ''
        })),
    [accounts]
  );

  const contactOptions = useMemo(() => {
    const list = data.accountId ? contacts.filter((c) => c.accountId === data.accountId) : contacts;
    return [
      { value: '', label: '-None-' },
      ...list.map((c) => ({
        value: c.id,
        label: c.name,
        icon: <User size={13} className="text-ink-400" />,
        sublabel: c.designation || c.email || '',
        accountId: c.accountId
      }))
    ];
  }, [contacts, data.accountId]);

  const stageOptions = useMemo(
    () => STAGES.map((s) => ({ value: s, label: s })),
    []
  );

  const previousStageOptions = useMemo(
    () => [{ value: '', label: '-None-' }, ...STAGES.map((s) => ({ value: s, label: s }))],
    []
  );

  const languageOptions = useMemo(
    () => LANGUAGES.map((lang) => ({ value: lang, label: lang })),
    []
  );

  const leadSourceOptions = useMemo(
    () => LEAD_SOURCE_OPTIONS.map((opt) => ({
      value: opt,
      label: opt,
      icon: opt !== '-None-' && LEAD_SOURCE_COLORS[opt] ? (
        <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: LEAD_SOURCE_COLORS[opt] }} />
      ) : null
    })),
    []
  );

  const submissionStatusOptions = useMemo(
    () => SUBMISSION_STATUS_OPTIONS.map((opt) => ({
      value: opt,
      label: opt,
      icon: opt !== '-None-' && SUBMISSION_STATUS_COLORS[opt] ? (
        <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: SUBMISSION_STATUS_COLORS[opt] }} />
      ) : null
    })),
    []
  );

  const handleChange = (field, value) => {
    setData((prev) => {
      const next = { ...prev, [field]: value };

      // Field Dependency: Auto-update probability & expected revenue when stage changes
      if (field === 'stage' && STAGE_PROBABILITY[value] !== undefined) {
        next.probability = STAGE_PROBABILITY[value];
        if (next.amount) {
          next.expectedRevenue = Math.round((Number(next.amount) * next.probability) / 100);
        }
      }

      // Field Dependency: Auto-calculate expected revenue when amount or probability changes
      if (field === 'amount' || field === 'probability') {
        const amt = field === 'amount' ? Number(value) || 0 : Number(prev.amount) || 0;
        const prob = field === 'probability' ? Number(value) || 0 : Number(prev.probability) || 0;
        next.expectedRevenue = amt && prob ? Math.round((amt * prob) / 100) : '';
      }

      // Field Dependency: Account Name selection auto-syncs Client Name and filters contacts
      if (field === 'accountId') {
        const acc = accounts.find((a) => a.id === value);
        if (acc) {
          next.clientName = acc.name;
        }
        // If currently selected contact does not belong to the selected account, clear contact
        if (next.contactId) {
          const contactObj = contacts.find((c) => c.id === next.contactId);
          if (contactObj && contactObj.accountId !== value) {
            next.contactId = '';
          }
        }
      }

      // Field Dependency: Contact selection can auto-populate Account if empty
      if (field === 'contactId' && value) {
        const contactObj = contacts.find((c) => c.id === value);
        if (contactObj && contactObj.accountId && !next.accountId) {
          next.accountId = contactObj.accountId;
          const acc = accounts.find((a) => a.id === contactObj.accountId);
          if (acc) {
            next.clientName = acc.name;
          }
        }
      }

      return next;
    });

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // Image Upload Handler
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size must be under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setData((prev) => ({ ...prev, dealImage: reader.result }));
        toast.success('Deal image uploaded.');
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setData((prev) => ({ ...prev, dealImage: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Validation
  const validateForm = () => {
    const errs = {};
    if (!data.name?.trim()) errs.name = 'Deal Name is required';
    if (!data.stage) errs.stage = 'Stage is required';
    if (!data.closingDate) errs.closingDate = 'Closing Date is required';
    if (!data.accountId) errs.accountId = 'Account Name is required';
    if (!data.amount || Number(data.amount) <= 0) errs.amount = 'Valid Deal Amount is required';

    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error('Please fill in all required fields indicated with *.');
      return false;
    }
    return true;
  };

  const handleSave = (e) => {
    e?.preventDefault();
    if (isSubmitting) return;
    if (!validateForm()) return;

    setIsSubmitting(true);
    toast.success(mode === 'create' ? 'Deal created successfully!' : 'Deal updated successfully!');
    onSave(data, false);
  };

  const handleSaveAndNew = (e) => {
    e?.preventDefault();
    if (isSubmitting) return;
    if (!validateForm()) return;

    setIsSubmitting(true);
    toast.success('Deal created successfully!');
    onSave(data, true);
    // Reset form for next deal
    setData({
      ownerId: 'u1',
      name: '',
      city: '',
      contactId: '',
      stage: 'Need Deal Estimation',
      closingDate: '',
      leadManager1: 'u2',
      salesNo: '',
      categories: 'Translation',
      approvalStatus: 'Draft',
      remarks: '',
      submissionStatus: '-None-',
      languageClassInfo: '',
      source: 'Website',
      dealSuggestions: '',
      sourceLanguage: 'English',
      targetLanguage: 'Hindi',
      jobType: 'ONE TIME',
      purposeOfTranslation: 'Business',
      othersSpecify: '',
      clientBudget: '',
      deliveryType: 'Normal',
      accountId: '',
      amount: '',
      overseasEducationInfo: '',
      previousPendingEstimations: '',
      previousStage: '',
      clientName: '',
      approvalSentTime: '',
      mobile: '',
      mobileNo: '',
      estNo: '',
      closedWonDate: '',
      probability: 10,
      expectedRevenue: '',
      forecastCategory: 'Pipeline',
      estimationCreatedBy: 'u1',
      campaignSource: '',
      category: 'Commercial',
      comments: '',
      invoiceNo: '',
      type: 'New Business',
      description: '',
      estReady: '-None-',
      closedLostApproval: '-None-',
      closedWonApproval: '-None-',
      dealImage: null,
      createdOn: todayISO(),
    });
    setErrors({});
    setIsSubmitting(false);
  };

  const inputClass = (field) =>
    `w-full h-[34px] px-2.5 text-[13px] bg-white border rounded-[4px] outline-none transition-all ${
      errors[field]
        ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-200 bg-red-50/20'
        : 'border-line hover:border-slate-400 focus:border-primary focus:ring-1 focus:ring-primary/20'
    }`;

  const textareaClass = (field, rows = 3) =>
    `w-full px-2.5 py-1.5 text-[13px] bg-white border rounded-[4px] outline-none transition-all resize-y ${
      errors[field]
        ? 'border-red-400 focus:border-red-500'
        : 'border-line hover:border-slate-400 focus:border-primary focus:ring-1 focus:ring-primary/20'
    }`;

  return (
    <div className="bg-white min-h-[calc(100vh-64px)] -mx-3 sm:-mx-[18px] -mt-2.5 -mb-6 flex flex-col">
      {/* 1. Top Action Bar */}
      <div className="sticky top-0 z-40 bg-white border-b border-line px-5 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            title="Cancel and return to Deals"
            className="h-8 w-8 rounded-full flex items-center justify-center text-ink-600 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-[18px] font-bold text-ink leading-tight">
            {mode === 'edit' ? 'Edit Deal' : 'Create Deal'}
          </h1>
          <button
            type="button"
            onClick={() => toast.info('Layout editor: Standard Deal Layout is active.')}
            className="text-primary hover:underline text-[12.5px] font-medium hidden sm:flex items-center gap-1 ml-3"
          >
            <Settings size={13} />
            <span>Edit Page Layout</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary h-8 px-4 text-[13px] font-medium rounded-md"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveAndNew}
            disabled={isSubmitting}
            className="btn-secondary h-8 px-4 text-[13px] font-medium rounded-md"
          >
            Save and New
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            className="btn-primary h-8 px-5 text-[13px] font-medium rounded-md shadow-xs bg-primary hover:bg-primary-600"
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Main Scrollable Form Body */}
      <div className="flex-1 bg-[#F4F6F9] p-4 sm:p-6 overflow-y-auto">
        <div className="max-w-[1100px] mx-auto bg-white border border-line rounded-xl shadow-xs overflow-visible mb-8">

          {/* Section A: Deal Image */}
          <div className="border-b border-line rounded-t-xl overflow-hidden">
            <div className="px-6 py-2.5 bg-[#F8FAFC] border-b border-line/80 flex items-center justify-between">
              <h2 className="text-[13.5px] font-bold text-ink uppercase tracking-wide">
                Deal Image
              </h2>
            </div>
            <div className="p-6 flex items-center gap-6">
              <div className="relative">
                {data.dealImage ? (
                  <div className="relative h-20 w-20 rounded-xl overflow-hidden border-2 border-primary/30 shadow-xs">
                    <img src={data.dealImage} alt="Deal" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-1 right-1 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-xs"
                      title="Remove image"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="h-20 w-20 rounded-xl border-2 border-dashed border-line-hover bg-slate-50 flex flex-col items-center justify-center text-ink-400 hover:border-primary hover:text-primary transition-all cursor-pointer group"
                  >
                    <Camera size={22} className="group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] font-medium mt-1">Upload</span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              <div className="text-[12px] text-ink-500 space-y-0.5">
                <p className="font-semibold text-ink text-[13px]">Add a Logo or Image for this Deal</p>
                <p className="text-ink-400">Supported formats: JPG, PNG, GIF (Max 2MB)</p>
                {data.dealImage && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-primary hover:underline text-[12px] font-medium block pt-1"
                  >
                    Change Image
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Section B: Deal Information */}
          <div className="border-b border-line">
            <div className="px-6 py-2.5 bg-[#F8FAFC] border-b border-line/80 flex items-center justify-between">
              <h2 className="text-[13.5px] font-bold text-ink uppercase tracking-wide">
                Deal Information
              </h2>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-x-12">
              {/* LEFT COLUMN */}
              <div>
                {/* 1. Deal Owner */}
                <FormRow label="Deal Owner" required error={errors.ownerId}>
                  <ZohoDropdown
                    id="ownerId"
                    value={data.ownerId}
                    options={ownerOptions}
                    onChange={(val) => handleChange('ownerId', val)}
                    searchable={true}
                    placeholder="-Select Owner-"
                    error={!!errors.ownerId}
                  />
                </FormRow>

                {/* 2. Deal Name */}
                <FormRow label="Deal Name" required error={errors.name}>
                  <input
                    type="text"
                    placeholder="e.g. Cloud Migration Project"
                    className={inputClass('name')}
                    value={data.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                  />
                </FormRow>

                {/* 3. City */}
                <FormRow label="City" error={errors.city}>
                  <input
                    type="text"
                    placeholder="e.g. Bangalore, Mumbai"
                    className={inputClass('city')}
                    value={data.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                  />
                </FormRow>

                {/* 4. Contact Name */}
                <FormRow
                  label="Contact Name"
                  error={errors.contactId}
                  help={data.accountId ? 'Contacts filtered by selected Account' : 'Selecting a contact auto-links the account'}
                >
                  <ZohoDropdown
                    id="contactId"
                    value={data.contactId}
                    options={contactOptions}
                    onChange={(val) => handleChange('contactId', val)}
                    searchable={true}
                    allowClear={true}
                    placeholder="-None-"
                    error={!!errors.contactId}
                  />
                </FormRow>

                {/* 5. Stage */}
                <FormRow label="Stage" required error={errors.stage}>
                  <ZohoDropdown
                    id="stage"
                    value={data.stage}
                    options={stageOptions}
                    onChange={(val) => handleChange('stage', val)}
                    placeholder="-Select Stage-"
                    error={!!errors.stage}
                  />
                </FormRow>

                {/* 6. Closing Date */}
                <FormRow label="Closing Date" required error={errors.closingDate}>
                  <input
                    type="date"
                    className={inputClass('closingDate')}
                    value={data.closingDate}
                    onChange={(e) => handleChange('closingDate', e.target.value)}
                  />
                </FormRow>

                {/* 7. Lead Manager 1 */}
                <FormRow label="Lead Manager 1" error={errors.leadManager1}>
                  <ZohoDropdown
                    id="leadManager1"
                    value={data.leadManager1}
                    options={leadManager1Options}
                    onChange={(val) => handleChange('leadManager1', val)}
                    searchable={true}
                    allowClear={true}
                    placeholder="-None-"
                    error={!!errors.leadManager1}
                  />
                </FormRow>

                {/* 8. Sales_No */}
                <FormRow label="Sales_No" error={errors.salesNo}>
                  <input
                    type="text"
                    placeholder="e.g. SL-2026-081"
                    className={inputClass('salesNo')}
                    value={data.salesNo}
                    onChange={(e) => handleChange('salesNo', e.target.value)}
                  />
                </FormRow>

                {/* 9. Categories */}
                <FormRow label="Categories" error={errors.categories}>
                  <ZohoDropdown
                    id="categories"
                    value={data.categories}
                    options={CATEGORIES_OPTIONS}
                    onChange={(val) => handleChange('categories', val)}
                    placeholder="-Select Category-"
                    error={!!errors.categories}
                  />
                </FormRow>

                {/* 10. Deal Approval Status */}
                <FormRow label="Deal Approval Status" readOnly error={errors.approvalStatus}>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value={data.approvalStatus}
                      className="w-full h-[34px] px-2.5 text-[13px] bg-slate-100 text-ink-600 border border-line rounded-[4px] cursor-not-allowed select-none font-medium"
                    />
                    <Lock size={13} className="absolute right-3 top-2.5 text-ink-400" />
                  </div>
                </FormRow>

                {/* 11. Remarks */}
                <FormRow label="Remarks" error={errors.remarks}>
                  <input
                    type="text"
                    placeholder="Brief notes or remarks"
                    className={inputClass('remarks')}
                    value={data.remarks}
                    onChange={(e) => handleChange('remarks', e.target.value)}
                  />
                </FormRow>

                {/* 12. Submission Status */}
                <FormRow label="Submission Status" error={errors.submissionStatus}>
                  <ZohoDropdown
                    id="submissionStatus"
                    value={data.submissionStatus}
                    options={submissionStatusOptions}
                    onChange={(val) => handleChange('submissionStatus', val)}
                    placeholder="-None-"
                    error={!!errors.submissionStatus}
                  />
                </FormRow>

                {/* 13. Language Class Info */}
                <FormRow label="Language Class Info" error={errors.languageClassInfo}>
                  <textarea
                    rows={3}
                    placeholder="Specify language batch, timing, or trainer info..."
                    className={textareaClass('languageClassInfo', 3)}
                    value={data.languageClassInfo}
                    onChange={(e) => handleChange('languageClassInfo', e.target.value)}
                  />
                </FormRow>
              </div>

              {/* RIGHT COLUMN */}
              <div>
                {/* 1. Lead Source */}
                <FormRow label="Lead Source" error={errors.source}>
                  <ZohoDropdown
                    id="source"
                    value={data.source}
                    options={leadSourceOptions}
                    onChange={(val) => handleChange('source', val)}
                    searchable={true}
                    placeholder="-Select Source-"
                    error={!!errors.source}
                  />
                </FormRow>

                {/* 2. Deal Suggestions */}
                <FormRow label="Deal Suggestions" error={errors.dealSuggestions}>
                  <textarea
                    rows={2}
                    placeholder="Suggested discount, upsell strategy, etc."
                    className={textareaClass('dealSuggestions', 2)}
                    value={data.dealSuggestions}
                    onChange={(e) => handleChange('dealSuggestions', e.target.value)}
                  />
                </FormRow>

                {/* 3. Source Language List */}
                <FormRow label="Source Language List" error={errors.sourceLanguage}>
                  <ZohoDropdown
                    id="sourceLanguage"
                    value={data.sourceLanguage}
                    options={languageOptions}
                    onChange={(val) => handleChange('sourceLanguage', val)}
                    searchable={true}
                    placeholder="-Select Source Language-"
                    error={!!errors.sourceLanguage}
                  />
                </FormRow>

                {/* 4. Target Language List */}
                <FormRow label="Target Language List" error={errors.targetLanguage}>
                  <ZohoDropdown
                    id="targetLanguage"
                    value={data.targetLanguage}
                    options={languageOptions}
                    onChange={(val) => handleChange('targetLanguage', val)}
                    searchable={true}
                    placeholder="-Select Target Language-"
                    error={!!errors.targetLanguage}
                  />
                </FormRow>

                {/* 5. Job Type */}
                <FormRow label="Job Type" error={errors.jobType}>
                  <ZohoDropdown
                    id="jobType"
                    value={data.jobType}
                    options={JOB_TYPE_OPTIONS}
                    onChange={(val) => handleChange('jobType', val)}
                    placeholder="-Select Job Type-"
                    error={!!errors.jobType}
                  />
                </FormRow>

                {/* 6. Purpose Of Translation */}
                <FormRow label="Purpose Of Translation" error={errors.purposeOfTranslation}>
                  <ZohoDropdown
                    id="purposeOfTranslation"
                    value={data.purposeOfTranslation}
                    options={PURPOSE_TRANSLATION_OPTIONS}
                    onChange={(val) => handleChange('purposeOfTranslation', val)}
                    searchable={true}
                    placeholder="-Select Purpose-"
                    error={!!errors.purposeOfTranslation}
                  />
                </FormRow>

                {/* 7. Others (Specify) */}
                <FormRow label="Others (Specify)" error={errors.othersSpecify}>
                  <input
                    type="text"
                    placeholder="Additional custom specifications"
                    className={inputClass('othersSpecify')}
                    value={data.othersSpecify}
                    onChange={(e) => handleChange('othersSpecify', e.target.value)}
                  />
                </FormRow>

                {/* 8. Client Budget */}
                <FormRow label="Client Budget" error={errors.clientBudget}>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-ink-400 font-semibold text-[13px]">₹</span>
                    <input
                      type="number"
                      placeholder="0"
                      className={`${inputClass('clientBudget')} pl-7`}
                      value={data.clientBudget}
                      onChange={(e) => handleChange('clientBudget', e.target.value)}
                    />
                  </div>
                </FormRow>

                {/* 9. Delivery Type */}
                <FormRow label="Delivery Type" error={errors.deliveryType}>
                  <ZohoDropdown
                    id="deliveryType"
                    value={data.deliveryType}
                    options={DELIVERY_TYPE_OPTIONS}
                    onChange={(val) => handleChange('deliveryType', val)}
                    placeholder="-Select Delivery Type-"
                    error={!!errors.deliveryType}
                  />
                </FormRow>

                {/* 10. Account Name */}
                <FormRow label="Account Name" required error={errors.accountId}>
                  <ZohoDropdown
                    id="accountId"
                    value={data.accountId}
                    options={accountOptions}
                    onChange={(val) => handleChange('accountId', val)}
                    searchable={true}
                    placeholder="-Select Account-"
                    error={!!errors.accountId}
                  />
                </FormRow>

                {/* 11. Amount */}
                <FormRow label="Amount (INR)" required error={errors.amount}>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-ink-400 font-semibold text-[13px]">₹</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      className={`${inputClass('amount')} pl-7 font-semibold`}
                      value={data.amount}
                      onChange={(e) => handleChange('amount', e.target.value)}
                    />
                  </div>
                </FormRow>

                {/* 12. Overseas Educations Info */}
                <FormRow label="Overseas Educations Info" error={errors.overseasEducationInfo}>
                  <textarea
                    rows={3}
                    placeholder="University requirements, credential evaluations, etc."
                    className={textareaClass('overseasEducationInfo', 3)}
                    value={data.overseasEducationInfo}
                    onChange={(e) => handleChange('overseasEducationInfo', e.target.value)}
                  />
                </FormRow>
              </div>
            </div>
          </div>

          {/* Section C: Deal Other Details */}
          <div className="border-b border-line">
            <div className="px-6 py-2.5 bg-[#F8FAFC] border-b border-line/80 flex items-center justify-between">
              <h2 className="text-[13.5px] font-bold text-ink uppercase tracking-wide">
                Deal Other Details
              </h2>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-x-12">
              {/* LEFT COLUMN */}
              <div>
                {/* 1. Previous Pending Estimations */}
                <FormRow label="Previous Pending Estimations" error={errors.previousPendingEstimations}>
                  <ZohoDropdown
                    id="previousPendingEstimations"
                    value={data.previousPendingEstimations}
                    options={PREVIOUS_PENDING_ESTIMATIONS_OPTIONS}
                    onChange={(val) => handleChange('previousPendingEstimations', val)}
                    placeholder="-None-"
                    allowClear={true}
                    searchable={false}
                    error={!!errors.previousPendingEstimations}
                  />
                </FormRow>

                {/* 2. Previous Stage */}
                <FormRow label="Previous Stage" error={errors.previousStage}>
                  <ZohoDropdown
                    id="previousStage"
                    value={data.previousStage}
                    options={previousStageOptions}
                    onChange={(val) => handleChange('previousStage', val)}
                    searchable={true}
                    allowClear={true}
                    placeholder="-None-"
                    error={!!errors.previousStage}
                  />
                </FormRow>

                {/* 3. Client Name */}
                <FormRow label="Client Name" error={errors.clientName}>
                  <input
                    type="text"
                    placeholder="e.g. Acme Global Industries"
                    className={inputClass('clientName')}
                    value={data.clientName}
                    onChange={(e) => handleChange('clientName', e.target.value)}
                  />
                </FormRow>

                {/* 4. Approval Sent Time */}
                <FormRow label="Approval Sent Time" error={errors.approvalSentTime}>
                  <input
                    type="datetime-local"
                    className={inputClass('approvalSentTime')}
                    value={data.approvalSentTime}
                    onChange={(e) => handleChange('approvalSentTime', e.target.value)}
                  />
                </FormRow>

                {/* 5. Mobile */}
                <FormRow label="Mobile" error={errors.mobile}>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    className={inputClass('mobile')}
                    value={data.mobile}
                    onChange={(e) => handleChange('mobile', e.target.value)}
                  />
                </FormRow>

                {/* 6. Mobile No */}
                <FormRow label="Mobile No" error={errors.mobileNo}>
                  <input
                    type="tel"
                    placeholder="Secondary mobile"
                    className={inputClass('mobileNo')}
                    value={data.mobileNo}
                    onChange={(e) => handleChange('mobileNo', e.target.value)}
                  />
                </FormRow>

                {/* 7. Est_NO */}
                <FormRow label="Est_NO" error={errors.estNo}>
                  <input
                    type="text"
                    placeholder="e.g. EST-88392"
                    className={inputClass('estNo')}
                    value={data.estNo}
                    onChange={(e) => handleChange('estNo', e.target.value)}
                  />
                </FormRow>

                {/* 8. Closed Won Date */}
                <FormRow label="Closed Won Date" error={errors.closedWonDate}>
                  <input
                    type="datetime-local"
                    className={inputClass('closedWonDate')}
                    value={data.closedWonDate}
                    onChange={(e) => handleChange('closedWonDate', e.target.value)}
                  />
                </FormRow>

                {/* 9. Probability (%) */}
                <FormRow label="Probability (%)" error={errors.probability}>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className={inputClass('probability')}
                      value={data.probability}
                      onChange={(e) => handleChange('probability', Number(e.target.value))}
                    />
                    <span className="text-[13px] font-bold text-ink-600">%</span>
                  </div>
                </FormRow>
              </div>

              {/* RIGHT COLUMN */}
              <div>
                {/* 1. Expected Revenue */}
                <FormRow label="Expected Revenue" error={errors.expectedRevenue}>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-ink-400 font-semibold text-[13px]">₹</span>
                    <input
                      type="number"
                      placeholder="0"
                      className={`${inputClass('expectedRevenue')} pl-7 font-semibold text-emerald-800`}
                      value={data.expectedRevenue}
                      onChange={(e) => handleChange('expectedRevenue', e.target.value)}
                    />
                  </div>
                </FormRow>

                {/* 2. Forecast Category */}
                <FormRow label="Forecast Category" error={errors.forecastCategory}>
                  <ZohoDropdown
                    id="forecastCategory"
                    value={data.forecastCategory}
                    options={FORECAST_CATEGORY_OPTIONS}
                    onChange={(val) => handleChange('forecastCategory', val)}
                    placeholder="-Select Forecast Category-"
                    error={!!errors.forecastCategory}
                  />
                </FormRow>

                {/* 3. Estimation Created By */}
                <FormRow label="Estimation Created By" error={errors.estimationCreatedBy}>
                  <ZohoDropdown
                    id="estimationCreatedBy"
                    value={data.estimationCreatedBy}
                    options={estimationCreatedByOptions}
                    onChange={(val) => handleChange('estimationCreatedBy', val)}
                    searchable={true}
                    allowClear={true}
                    placeholder="-None-"
                    error={!!errors.estimationCreatedBy}
                  />
                </FormRow>

                {/* 4. Campaign Source */}
                <FormRow label="Campaign Source" error={errors.campaignSource}>
                  <input
                    type="text"
                    placeholder="e.g. Q4 Google Ads, Webinar Oct"
                    className={inputClass('campaignSource')}
                    value={data.campaignSource}
                    onChange={(e) => handleChange('campaignSource', e.target.value)}
                  />
                </FormRow>

                {/* 5. Category */}
                <FormRow label="Category" error={errors.category}>
                  <ZohoDropdown
                    id="category"
                    value={data.category}
                    options={CATEGORY_OPTIONS}
                    onChange={(val) => handleChange('category', val)}
                    placeholder="-Select Category-"
                    error={!!errors.category}
                  />
                </FormRow>

                {/* 6. Comments */}
                <FormRow label="Comments" error={errors.comments}>
                  <input
                    type="text"
                    placeholder="Special instructions or notes"
                    className={inputClass('comments')}
                    value={data.comments}
                    onChange={(e) => handleChange('comments', e.target.value)}
                  />
                </FormRow>

                {/* 7. Invoice_No */}
                <FormRow label="Invoice_No" error={errors.invoiceNo}>
                  <input
                    type="text"
                    placeholder="e.g. INV-2026-902"
                    className={inputClass('invoiceNo')}
                    value={data.invoiceNo}
                    onChange={(e) => handleChange('invoiceNo', e.target.value)}
                  />
                </FormRow>

                {/* 8. Type */}
                <FormRow label="Type" error={errors.type}>
                  <ZohoDropdown
                    id="type"
                    value={data.type}
                    options={TYPE_OPTIONS}
                    onChange={(val) => handleChange('type', val)}
                    placeholder="-Select Type-"
                    error={!!errors.type}
                  />
                </FormRow>
              </div>
            </div>
          </div>

          {/* Section D: Description Information */}
          <div className="border-b border-line">
            <div className="px-6 py-2.5 bg-[#F8FAFC] border-b border-line/80 flex items-center justify-between">
              <h2 className="text-[13.5px] font-bold text-ink uppercase tracking-wide">
                Description Information
              </h2>
            </div>
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-4 mb-1">
                <label className="sm:w-[170px] shrink-0 text-[13px] text-ink-600 font-medium sm:text-right sm:pt-1.5">
                  Description
                </label>
                <div className="flex-1 max-w-full lg:max-w-[820px]">
                  <textarea
                    rows={4}
                    placeholder="Enter detailed scope, delivery milestones, client background, or special requirements..."
                    className={textareaClass('description', 4)}
                    value={data.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section E: Approval Process */}
          <div className="rounded-b-xl overflow-hidden">
            <div className="px-6 py-2.5 bg-[#F8FAFC] border-b border-line/80 flex items-center justify-between">
              <h2 className="text-[13.5px] font-bold text-ink uppercase tracking-wide">
                Approval Process
              </h2>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-x-12">
              <div>
                {/* 1. EST Ready */}
                <FormRow label="EST Ready" error={errors.estReady}>
                  <ZohoDropdown
                    id="estReady"
                    value={data.estReady}
                    options={EST_READY_OPTIONS}
                    onChange={(val) => handleChange('estReady', val)}
                    placeholder="-None-"
                    error={!!errors.estReady}
                  />
                </FormRow>

                {/* 2. Closed Lost Approval */}
                <FormRow label="Closed Lost Approval" error={errors.closedLostApproval}>
                  <ZohoDropdown
                    id="closedLostApproval"
                    value={data.closedLostApproval}
                    options={APPROVAL_STATUS_OPTIONS}
                    onChange={(val) => handleChange('closedLostApproval', val)}
                    placeholder="-None-"
                    error={!!errors.closedLostApproval}
                  />
                </FormRow>
              </div>

              <div>
                {/* 3. Closed Won Approval */}
                <FormRow label="Closed Won Approval" error={errors.closedWonApproval}>
                  <ZohoDropdown
                    id="closedWonApproval"
                    value={data.closedWonApproval}
                    options={APPROVAL_STATUS_OPTIONS}
                    onChange={(val) => handleChange('closedWonApproval', val)}
                    placeholder="-None-"
                    error={!!errors.closedWonApproval}
                  />
                </FormRow>
              </div>
            </div>
          </div>

        </div>

        {/* 8. Bottom Form Controls Bar */}
        <div className="max-w-[1100px] mx-auto bg-white border border-line rounded-xl px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
          <div className="flex flex-wrap items-center gap-3 text-[13px]">
            <button
              type="button"
              onClick={() => toast.info('Form Views: Custom views allow layout switching for different teams.')}
              className="text-primary hover:underline font-semibold flex items-center gap-1"
            >
              <span>Create Form Views</span>
            </button>
            <span className="text-ink-300">•</span>
            <div className="flex items-center gap-2">
              <span className="text-ink-500 font-medium">Layout View:</span>
              <div className="w-[190px]">
                <ZohoDropdown
                  id="selectedFormView"
                  value={selectedFormView}
                  options={['Standard View', 'High Value Deal View', 'Translation Services View']}
                  onChange={(v) => {
                    setSelectedFormView(v);
                    toast.success(`Form layout switched to "${v}"`);
                  }}
                />
              </div>
            </div>
            <span className="text-ink-300">•</span>
            <button
              type="button"
              onClick={() => toast.info('Custom Form Page: Customize fields and sections in Settings.')}
              className="text-ink-600 hover:text-primary font-medium"
            >
              Create a Custom Form Page
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary h-8 px-4 text-[13px] font-medium rounded-md"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAndNew}
              disabled={isSubmitting}
              className="btn-secondary h-8 px-4 text-[13px] font-medium rounded-md"
            >
              Save and New
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSubmitting}
              className="btn-primary h-8 px-5 text-[13px] font-medium rounded-md shadow-xs bg-primary hover:bg-primary-600"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
