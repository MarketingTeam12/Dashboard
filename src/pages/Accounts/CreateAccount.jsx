import { useState } from 'react';
import {
  Building2, Check, ChevronDown, Lock, MapPin, Search,
  Trash2, User, UserCheck, Users, X, Link as LinkIcon, Copy
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useToast } from '../../components/common/Toast';
import { USERS } from '../../data/seedData';
import { todayISO } from '../../utils/calculations';

export const GST_STATES = [
  '-None-',
  'Tamil Nadu',
  'Karnataka',
  'Maharashtra',
  'Kerala',
  'Telangana',
  'Andhra Pradesh',
  'Delhi',
  'Uttar Pradesh',
  'West Bengal',
  'Gujarat',
  'Haryana',
  'Punjab',
  'Rajasthan',
  'Madhya Pradesh',
  'Bihar',
  'Odisha',
];

export const GST_TREATMENTS = [
  '-None-',
  'Registered Business - Regular',
  'Registered Business - Composition',
  'Unregistered Business',
  'Consumer',
  'Overseas',
  'Special Economic Zone (SEZ)',
  'Deemed Export',
];

export default function CreateAccount({ onCancel, onSuccess, initialRecord, isEditMode = false }) {
  const { accounts, users, contacts, createRecord, updateRecord, activeUser } = useCRM();
  const toast = useToast();

  const defaultOwnerId = activeUser?.id || users[0]?.id || 'u1';

  const blankForm = {
    ownerId: defaultOwnerId,
    clientName: '',
    emailId: '',
    name: '',
    accountSite: '',
    parentAccountId: '',
    parentAccountName: '',
    accountNumber: '',
    gstState: '-None-',
    gstTreatment: '-None-',
    associatedContacts: '',
    mobile: '',
    website: '',
    leadManager1: '-None-',
    gstin: '',
    legalName: '',
    tradeName: '',
    accountsToDeal: false,
    billingStreet: '',
    billingCity: 'Chennai',
    billingState: 'Tamil Nadu',
    billingCode: '600002',
    billingCountry: 'India',
    shippingStreet: '',
    shippingCity: 'Chennai',
    shippingState: 'Tamil Nadu',
    shippingCode: '600002',
    shippingCountry: 'India',
    description: '',
  };

  const [formData, setFormData] = useState(() => {
    if (initialRecord) {
      const p = accounts.find((a) => a.id === initialRecord.parentAccountId);
      return {
        ...blankForm,
        ...initialRecord,
        name: initialRecord.name || '',
        parentAccountName: p ? p.name : initialRecord.parentAccountName || '',
        gstState: initialRecord.gstState || '-None-',
        gstTreatment: initialRecord.gstTreatment || '-None-',
        leadManager1: initialRecord.leadManager1 || '-None-',
        gstin: initialRecord.gstin || initialRecord.gstNumber || '',
        billingCode: initialRecord.billingCode || initialRecord.billingZip || '',
        shippingCode: initialRecord.shippingCode || initialRecord.shippingZip || '',
      };
    }
    return blankForm;
  });

  const [errors, setErrors] = useState({});
  const [showParentLookup, setShowParentLookup] = useState(false);
  const [parentSearch, setParentSearch] = useState('');
  const [showContactLookup, setShowContactLookup] = useState(false);
  const [contactSearch, setContactSearch] = useState('');

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleCopyAddress = () => {
    setFormData((prev) => ({
      ...prev,
      shippingStreet: prev.billingStreet,
      shippingCity: prev.billingCity,
      shippingState: prev.billingState,
      shippingCode: prev.billingCode,
      shippingCountry: prev.billingCountry,
    }));
    toast.success('Billing address copied to shipping address');
  };

  const validateForm = () => {
    const newErrors = {};
    const nameTrim = String(formData.name || '').trim();
    if (!nameTrim) {
      newErrors.name = 'Account Name cannot be empty';
    }

    if (formData.emailId && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(formData.emailId).trim())) {
      newErrors.emailId = 'Enter a valid email address';
    }

    if (formData.gstin) {
      const cleanGstin = String(formData.gstin).trim().toUpperCase();
      // Indian GSTIN format check: 15 chars: 2 digits state + 10 alphanumeric PAN + 1 digit entity + Z + 1 check digit
      const gstinRx = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstinRx.test(cleanGstin) && cleanGstin.length > 5) {
        // Warning if non-standard format
        newErrors.gstin = 'Invalid GSTIN format (15 characters e.g. 33AAFAT4818Q9ZY)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (saveAndNew = false) => {
    if (!validateForm()) {
      toast.error('Please fix the validation errors before saving');
      return;
    }

    const nameTrim = String(formData.name || '').trim();

    const payload = {
      ...formData,
      name: nameTrim,
      gstState: formData.gstState === '-None-' ? '' : formData.gstState,
      gstTreatment: formData.gstTreatment === '-None-' ? '' : formData.gstTreatment,
      leadManager1: formData.leadManager1 === '-None-' ? '' : formData.leadManager1,
      gstNumber: formData.gstin ? formData.gstin.trim().toUpperCase() : '',
      gstin: formData.gstin ? formData.gstin.trim().toUpperCase() : '',
      billingZip: formData.billingCode,
      shippingZip: formData.shippingCode,
      location: formData.billingCity || 'Chennai',
      modifiedTime: todayISO(),
    };

    if (isEditMode && initialRecord?.id) {
      updateRecord('accounts', initialRecord.id, payload);
      toast.success(`Account "${nameTrim}" updated successfully`);
      if (onSuccess) onSuccess(initialRecord.id);
    } else {
      const created = createRecord('accounts', {
        ...payload,
        createdTime: todayISO(),
        createdBy: activeUser?.id || 'u1',
        status: 'Active',
      });
      toast.success(`Account "${nameTrim}" created successfully`);

      if (saveAndNew) {
        // Reset form for next entry
        setFormData({
          ...blankForm,
          ownerId: formData.ownerId,
        });
        setErrors({});
      } else {
        if (onSuccess) onSuccess(created.id);
      }
    }
  };

  const filteredParents = accounts.filter(
    (a) =>
      a.id !== initialRecord?.id &&
      (a.name.toLowerCase().includes(parentSearch.toLowerCase()) ||
        (a.location && a.location.toLowerCase().includes(parentSearch.toLowerCase())))
  );

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(contactSearch.toLowerCase())
  );

  return (
    <div className="bg-[#F8FAFD] min-h-[calc(100vh-62px)] pb-12">
      {/* Top Header Row matching Screenshot 2 */}
      <div className="sticky top-[60px] z-20 bg-white border-b border-line px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <h2 className="text-[19px] sm:text-[21px] font-bold text-ink tracking-tight">
            {isEditMode ? 'Edit Account' : 'Create Account'}
          </h2>
          <button
            type="button"
            onClick={() => toast.info('Page layout editor is accessible in CRM Workspace Settings')}
            className="text-[12.5px] text-primary hover:underline font-medium ml-1"
          >
            Edit Page Layout
          </button>
        </div>

        {/* Action Buttons Top Right: Cancel, Save and New, Save */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-8 px-3.5 rounded border border-line bg-white hover:bg-page text-[12.5px] font-medium text-ink-600 transition-colors"
          >
            Cancel
          </button>
          {!isEditMode && (
            <button
              type="button"
              onClick={() => handleSave(true)}
              className="h-8 px-3.5 rounded border border-line bg-white hover:bg-page text-[12.5px] font-medium text-ink-600 transition-colors"
            >
              Save and New
            </button>
          )}
          <button
            type="button"
            onClick={() => handleSave(false)}
            className="h-8 px-5 rounded bg-primary hover:bg-primary-600 text-white text-[12.5px] font-semibold transition-colors shadow-xs"
          >
            Save
          </button>
        </div>
      </div>

      {/* Main Form Body */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-5">
        <div className="bg-white rounded-xl border border-line shadow-2xs p-5 sm:p-7 space-y-7">
          {/* ================= SECTION 1: ACCOUNT INFORMATION ================= */}
          <div>
            <h3 className="text-[14.5px] font-semibold text-ink mb-4 pb-1 border-b border-line-soft">
              Account Information
            </h3>

            {/* Two Balanced Columns Layout matching Screenshot 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-3.5">
              {/* LEFT COLUMN */}
              <div className="space-y-3.5">
                {/* Account Owner */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <label className="sm:w-[140px] shrink-0 text-[12.5px] text-ink-600 font-medium sm:text-right">
                    Account Owner
                  </label>
                  <div className="flex-1 flex gap-1.5 items-center">
                    <select
                      value={formData.ownerId}
                      onChange={(e) => handleChange('ownerId', e.target.value)}
                      aria-label="Account Owner"
                      className="input h-8 text-[12.5px] flex-1 bg-white"
                    >
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                      <option value="marketing-dept">Marketing Department</option>
                      <option value="sales-team">Sales Team</option>
                    </select>
                    <button
                      type="button"
                      title="Select user"
                      className="h-8 px-2.5 rounded border border-line bg-page hover:bg-page-hover text-ink-600 shrink-0"
                    >
                      <User size={14} />
                    </button>
                  </div>
                </div>

                {/* Client Name */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <label className="sm:w-[140px] shrink-0 text-[12.5px] text-ink-600 font-medium sm:text-right">
                    Client Name
                  </label>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={formData.clientName}
                      onChange={(e) => handleChange('clientName', e.target.value)}
                      placeholder="e.g. Acme Executive"
                      aria-label="Client Name"
                      className="input h-8 text-[12.5px] w-full bg-white"
                    />
                  </div>
                </div>

                {/* Email ID */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <label className="sm:w-[140px] shrink-0 text-[12.5px] text-ink-600 font-medium sm:text-right">
                    Email ID
                  </label>
                  <div className="flex-1">
                    <input
                      type="email"
                      value={formData.emailId}
                      onChange={(e) => handleChange('emailId', e.target.value)}
                      placeholder="e.g. billing@company.in"
                      aria-label="Email ID"
                      className={`input h-8 text-[12.5px] w-full bg-white ${
                        errors.emailId ? 'border-danger focus:border-danger' : ''
                      }`}
                    />
                    {errors.emailId && (
                      <span className="text-[11px] text-danger mt-0.5 block">{errors.emailId}</span>
                    )}
                  </div>
                </div>

                {/* Account Name (REQUIRED - signature Zoho red left border) */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <label className="sm:w-[140px] shrink-0 text-[12.5px] text-ink font-semibold sm:text-right">
                    Account Name <span className="text-danger">*</span>
                  </label>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="Account Name (Required)"
                      aria-label="Account Name"
                      aria-required="true"
                      className={`input h-8 text-[12.5px] w-full bg-white border-l-[3px] border-l-[#E5293A] ${
                        errors.name ? 'border-danger ring-1 ring-danger/30' : ''
                      }`}
                    />
                    {errors.name && (
                      <span className="text-[11px] text-danger mt-0.5 block font-medium">
                        {errors.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Account Site */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <label className="sm:w-[140px] shrink-0 text-[12.5px] text-ink-600 font-medium sm:text-right">
                    Account Site
                  </label>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={formData.accountSite}
                      onChange={(e) => handleChange('accountSite', e.target.value)}
                      placeholder="e.g. Chennai Global HQ"
                      aria-label="Account Site"
                      className="input h-8 text-[12.5px] w-full bg-white"
                    />
                  </div>
                </div>

                {/* Parent Account (Lookup) */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <label className="sm:w-[140px] shrink-0 text-[12.5px] text-ink-600 font-medium sm:text-right">
                    Parent Account
                  </label>
                  <div className="flex-1 relative">
                    <div className="flex gap-1.5 items-center">
                      <input
                        type="text"
                        value={formData.parentAccountName}
                        onChange={(e) => handleChange('parentAccountName', e.target.value)}
                        placeholder="Select or enter parent account..."
                        aria-label="Parent Account"
                        className="input h-8 text-[12.5px] flex-1 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowParentLookup((o) => !o)}
                        title="Lookup parent account"
                        aria-label="Lookup parent account"
                        className="h-8 px-2.5 rounded border border-line bg-page hover:bg-page-hover text-ink-600 shrink-0"
                      >
                        <Building2 size={14} />
                      </button>
                    </div>

                    {showParentLookup && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-line shadow-pop p-2 z-30 max-h-[220px] overflow-y-auto">
                        <div className="relative mb-2">
                          <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-400" />
                          <input
                            type="text"
                            value={parentSearch}
                            onChange={(e) => setParentSearch(e.target.value)}
                            placeholder="Search parent accounts..."
                            className="input h-7 pl-7 text-[12px] w-full"
                            autoFocus
                          />
                        </div>
                        {filteredParents.slice(0, 10).map((a) => (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => {
                              handleChange('parentAccountId', a.id);
                              handleChange('parentAccountName', a.name);
                              setShowParentLookup(false);
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded hover:bg-page text-[12px] flex items-center justify-between"
                          >
                            <span className="font-medium text-ink">{a.name}</span>
                            <span className="text-ink-400 text-[11px]">{a.location}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Account Number */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <label className="sm:w-[140px] shrink-0 text-[12.5px] text-ink-600 font-medium sm:text-right">
                    Account Number
                  </label>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={formData.accountNumber}
                      onChange={(e) => handleChange('accountNumber', e.target.value)}
                      placeholder="e.g. ACC-1094"
                      aria-label="Account Number"
                      className="input h-8 text-[12.5px] w-full bg-white font-mono"
                    />
                  </div>
                </div>

                {/* GST State */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <label className="sm:w-[140px] shrink-0 text-[12.5px] text-ink-600 font-medium sm:text-right">
                    GST State
                  </label>
                  <div className="flex-1">
                    <select
                      value={formData.gstState}
                      onChange={(e) => handleChange('gstState', e.target.value)}
                      aria-label="GST State"
                      className="input h-8 text-[12.5px] w-full bg-white"
                    >
                      {GST_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* GST Treatment */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <label className="sm:w-[140px] shrink-0 text-[12.5px] text-ink font-medium sm:text-right">
                    GST Treatment
                  </label>
                  <div className="flex-1">
                    <select
                      value={formData.gstTreatment}
                      onChange={(e) => handleChange('gstTreatment', e.target.value)}
                      aria-label="GST Treatment"
                      className="input h-8 text-[12.5px] w-full bg-white"
                    >
                      {GST_TREATMENTS.map((tr) => (
                        <option key={tr} value={tr}>
                          {tr}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Associated Contacts */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <label className="sm:w-[140px] shrink-0 text-[12.5px] text-ink-600 font-medium sm:text-right">
                    Associated contacts
                  </label>
                  <div className="flex-1 relative">
                    <div className="flex gap-1.5 items-center">
                      <input
                        type="text"
                        value={formData.associatedContacts}
                        onChange={(e) => handleChange('associatedContacts', e.target.value)}
                        placeholder="e.g. Priya Sharma, Ravi Kumar"
                        aria-label="Associated contacts"
                        className="input h-8 text-[12.5px] flex-1 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowContactLookup((o) => !o)}
                        title="Lookup contacts"
                        aria-label="Lookup contacts"
                        className="h-8 px-2.5 rounded border border-line bg-page hover:bg-page-hover text-ink-600 shrink-0"
                      >
                        <Users size={14} />
                      </button>
                    </div>

                    {showContactLookup && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-line shadow-pop p-2 z-30 max-h-[220px] overflow-y-auto">
                        <div className="relative mb-2">
                          <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-400" />
                          <input
                            type="text"
                            value={contactSearch}
                            onChange={(e) => setContactSearch(e.target.value)}
                            placeholder="Search contacts..."
                            className="input h-7 pl-7 text-[12px] w-full"
                            autoFocus
                          />
                        </div>
                        {filteredContacts.slice(0, 10).map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              const existing = formData.associatedContacts
                                ? formData.associatedContacts.split(',').map((s) => s.trim())
                                : [];
                              if (!existing.includes(c.name)) existing.push(c.name);
                              handleChange('associatedContacts', existing.join(', '));
                              setShowContactLookup(false);
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded hover:bg-page text-[12px] flex items-center justify-between"
                          >
                            <span className="font-medium text-ink">{c.name}</span>
                            <span className="text-ink-400 text-[11px]">{c.designation}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="space-y-3.5">
                {/* Mobile */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <label className="sm:w-[140px] shrink-0 text-[12.5px] text-ink-600 font-medium sm:text-right">
                    Mobile
                  </label>
                  <div className="flex-1">
                    <input
                      type="tel"
                      value={formData.mobile}
                      onChange={(e) => handleChange('mobile', e.target.value)}
                      placeholder="e.g. 917708080662"
                      aria-label="Mobile"
                      className="input h-8 text-[12.5px] w-full bg-white font-mono"
                    />
                  </div>
                </div>

                {/* Website */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <label className="sm:w-[140px] shrink-0 text-[12.5px] text-ink-600 font-medium sm:text-right">
                    Website
                  </label>
                  <div className="flex-1">
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleChange('website', e.target.value)}
                      placeholder="e.g. https://www.company.in"
                      aria-label="Website"
                      className="input h-8 text-[12.5px] w-full bg-white"
                    />
                  </div>
                </div>

                {/* Lead Manager 1 */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <label className="sm:w-[140px] shrink-0 text-[12.5px] text-ink-600 font-medium sm:text-right">
                    Lead Manager 1
                  </label>
                  <div className="flex-1 flex gap-1.5 items-center">
                    <select
                      value={formData.leadManager1}
                      onChange={(e) => handleChange('leadManager1', e.target.value)}
                      aria-label="Lead Manager 1"
                      className="input h-8 text-[12.5px] flex-1 bg-white"
                    >
                      <option value="-None-">-None-</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                    <span className="p-1.5 rounded border border-line-soft bg-page text-ink-400" title="System field">
                      <Lock size={13} />
                    </span>
                  </div>
                </div>

                {/* GST Number / GSTIN (with red indicator line matching Screenshot 2) */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <label className="sm:w-[140px] shrink-0 text-[12.5px] text-ink font-semibold sm:text-right">
                    GST Number/GSTIN
                  </label>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={formData.gstin}
                      onChange={(e) => handleChange('gstin', e.target.value.toUpperCase())}
                      placeholder="e.g. 33AAFAT4818Q9ZY"
                      aria-label="GST Number/GSTIN"
                      className={`input h-8 text-[12.5px] w-full bg-white font-mono uppercase border-l-[3px] border-l-[#E5293A] ${
                        errors.gstin ? 'border-danger ring-1 ring-danger/30' : ''
                      }`}
                    />
                    {errors.gstin && (
                      <span className="text-[11px] text-danger mt-0.5 block font-medium">
                        {errors.gstin}
                      </span>
                    )}
                  </div>
                </div>

                {/* Legal Name */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <label className="sm:w-[140px] shrink-0 text-[12.5px] text-ink-600 font-medium sm:text-right">
                    Legal Name
                  </label>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={formData.legalName}
                      onChange={(e) => handleChange('legalName', e.target.value)}
                      placeholder="e.g. Kintech Synergy Private Limited"
                      aria-label="Legal Name"
                      className="input h-8 text-[12.5px] w-full bg-white"
                    />
                  </div>
                </div>

                {/* Trade name */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <label className="sm:w-[140px] shrink-0 text-[12.5px] text-ink-600 font-medium sm:text-right">
                    Trade name
                  </label>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={formData.tradeName}
                      onChange={(e) => handleChange('tradeName', e.target.value)}
                      placeholder="e.g. Kintech Synergy"
                      aria-label="Trade name"
                      className="input h-8 text-[12.5px] w-full bg-white"
                    />
                  </div>
                </div>

                {/* Accounts to Deal */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 pt-1">
                  <label className="sm:w-[140px] shrink-0 text-[12.5px] text-ink-600 font-medium sm:text-right">
                    Accounts to Deal
                  </label>
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="accountsToDeal"
                      checked={Boolean(formData.accountsToDeal)}
                      onChange={(e) => handleChange('accountsToDeal', e.target.checked)}
                      aria-label="Accounts to Deal"
                      className="cb h-4 w-4 rounded border-line text-primary focus:ring-primary cursor-pointer"
                    />
                    <label htmlFor="accountsToDeal" className="text-[12px] text-ink-500 cursor-pointer select-none">
                      Enable direct contact &amp; deal association pipeline
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-line-soft" />

          {/* ================= SECTION 2: ADDRESS INFORMATION ================= */}
          <div>
            <div className="flex items-center justify-between mb-4 pb-1 border-b border-line-soft">
              <h3 className="text-[14.5px] font-semibold text-ink">
                Address Information
              </h3>
              <button
                type="button"
                onClick={handleCopyAddress}
                className="h-7 px-3 rounded border border-line bg-white hover:bg-page text-ink-700 text-[12px] font-medium inline-flex items-center gap-1.5 transition-colors shadow-2xs"
                title="Copy Billing Address to Shipping Address"
              >
                <Copy size={12.5} className="text-primary" />
                <span>Copy Address</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-3.5">
              {/* BILLING ADDRESS */}
              <div className="space-y-3.5">
                <div className="text-[13px] font-semibold text-ink-700 mb-1">Billing Address</div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <label className="sm:w-[140px] shrink-0 text-[12.5px] text-ink-600 font-medium sm:text-right">
                    Billing Street
                  </label>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={formData.billingStreet}
                      onChange={(e) => handleChange('billingStreet', e.target.value)}
                      placeholder="e.g. 102 Anna Salai"
                      aria-label="Billing Street"
                      className="input h-8 text-[12.5px] w-full bg-white"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <label className="sm:w-[140px] shrink-0 text-[12.5px] text-ink-600 font-medium sm:text-right">
                    Billing City
                  </label>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={formData.billingCity}
                      onChange={(e) => handleChange('billingCity', e.target.value)}
                      placeholder="e.g. Chennai"
                      aria-label="Billing City"
                      className="input h-8 text-[12.5px] w-full bg-white"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <label className="sm:w-[140px] shrink-0 text-[12.5px] text-ink-600 font-medium sm:text-right">
                    Billing State
                  </label>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={formData.billingState}
                      onChange={(e) => handleChange('billingState', e.target.value)}
                      placeholder="e.g. Tamil Nadu"
                      aria-label="Billing State"
                      className="input h-8 text-[12.5px] w-full bg-white"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <label className="sm:w-[140px] shrink-0 text-[12.5px] text-ink-600 font-medium sm:text-right">
                    Billing Code
                  </label>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={formData.billingCode}
                      onChange={(e) => handleChange('billingCode', e.target.value)}
                      placeholder="e.g. 600002"
                      aria-label="Billing Code"
                      className="input h-8 text-[12.5px] w-full bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <label className="sm:w-[140px] shrink-0 text-[12.5px] text-ink-600 font-medium sm:text-right">
                    Billing Country
                  </label>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={formData.billingCountry}
                      onChange={(e) => handleChange('billingCountry', e.target.value)}
                      placeholder="e.g. India"
                      aria-label="Billing Country"
                      className="input h-8 text-[12.5px] w-full bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* SHIPPING ADDRESS */}
              <div className="space-y-3.5">
                <div className="text-[13px] font-semibold text-ink-700 mb-1">Shipping Address</div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <label className="sm:w-[140px] shrink-0 text-[12.5px] text-ink-600 font-medium sm:text-right">
                    Shipping Street
                  </label>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={formData.shippingStreet}
                      onChange={(e) => handleChange('shippingStreet', e.target.value)}
                      placeholder="e.g. 102 Anna Salai"
                      aria-label="Shipping Street"
                      className="input h-8 text-[12.5px] w-full bg-white"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <label className="sm:w-[140px] shrink-0 text-[12.5px] text-ink-600 font-medium sm:text-right">
                    Shipping City
                  </label>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={formData.shippingCity}
                      onChange={(e) => handleChange('shippingCity', e.target.value)}
                      placeholder="e.g. Chennai"
                      aria-label="Shipping City"
                      className="input h-8 text-[12.5px] w-full bg-white"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <label className="sm:w-[140px] shrink-0 text-[12.5px] text-ink-600 font-medium sm:text-right">
                    Shipping State
                  </label>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={formData.shippingState}
                      onChange={(e) => handleChange('shippingState', e.target.value)}
                      placeholder="e.g. Tamil Nadu"
                      aria-label="Shipping State"
                      className="input h-8 text-[12.5px] w-full bg-white"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <label className="sm:w-[140px] shrink-0 text-[12.5px] text-ink-600 font-medium sm:text-right">
                    Shipping Code
                  </label>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={formData.shippingCode}
                      onChange={(e) => handleChange('shippingCode', e.target.value)}
                      placeholder="e.g. 600002"
                      aria-label="Shipping Code"
                      className="input h-8 text-[12.5px] w-full bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <label className="sm:w-[140px] shrink-0 text-[12.5px] text-ink-600 font-medium sm:text-right">
                    Shipping Country
                  </label>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={formData.shippingCountry}
                      onChange={(e) => handleChange('shippingCountry', e.target.value)}
                      placeholder="e.g. India"
                      aria-label="Shipping Country"
                      className="input h-8 text-[12.5px] w-full bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-line-soft" />

          {/* ================= SECTION 3: DESCRIPTION INFORMATION ================= */}
          <div>
            <h3 className="text-[14.5px] font-semibold text-ink mb-4 pb-1 border-b border-line-soft">
              Description Information
            </h3>

            <div className="flex flex-col sm:flex-row gap-1 sm:gap-3">
              <label className="sm:w-[140px] shrink-0 text-[12.5px] text-ink-600 font-medium sm:text-right pt-2">
                Description
              </label>
              <div className="flex-1">
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Add any additional account notes, business background, or operational context..."
                  aria-label="Description"
                  className="input p-2.5 text-[12.5px] w-full bg-white"
                />
              </div>
            </div>
          </div>

          {/* Bottom Bar matching Screenshot 2 */}
          <div className="pt-4 border-t border-line-soft flex flex-wrap items-center justify-between text-[12px] text-ink-500 gap-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => toast.info('Form view builder')}
                className="hover:text-primary transition-colors"
              >
                Create Form Views
              </button>
              <span className="text-line-soft">|</span>
              <div className="inline-flex items-center gap-1 font-medium text-ink-700 cursor-pointer">
                <span>Standard View</span>
                <ChevronDown size={13} />
              </div>
            </div>

            <button
              type="button"
              onClick={() => toast.info('Custom form layout builder')}
              className="text-primary hover:underline font-medium"
            >
              Create a custom form page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

