import { useState, useRef } from 'react';
import {
  Building2, Camera, Check, ChevronDown, Lock, MapPin, Search,
  Trash2, User, UserCheck, Users, X, Link as LinkIcon
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useToast } from '../../components/common/Toast';
import { LEAD_SOURCES, SALUTATIONS, USERS } from '../../data/seedData';
import { todayISO } from '../../utils/calculations';

export default function CreateContact({ onCancel, onSuccess, initialRecord, isEditMode = false }) {
  const { accounts, users, createRecord, updateRecord, activeUser } = useCRM();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const defaultOwnerId = activeUser?.id || users[0]?.id || 'u1';
  const defaultAccountId = accounts[0]?.id || '';

  const blankForm = {
    ownerId: defaultOwnerId,
    leadSource: '-None-',
    salutation: '-None-',
    firstName: '',
    lastName: '',
    accountId: defaultAccountId,
    accountNameText: accounts[0]?.name || '',
    department: '',
    email: '',
    secondaryEmail: '',
    phone: '',
    clientName: '',
    city: 'Chennai',
    socialLeadId: 'SL-2026-90412',
    mobile: '',
    contactToDeal: false,
    leadManager1: '-None-',
    associatedAccounts: '',
    mailingStreet: '',
    mailingCity: 'Chennai',
    mailingState: 'Tamil Nadu',
    mailingZip: '600002',
    mailingCountry: 'India',
    description: '',
    avatar: null,
  };

  const [formData, setFormData] = useState(() => {
    if (initialRecord) {
      return {
        ...blankForm,
        ...initialRecord,
        salutation: initialRecord.salutation || '-None-',
        leadSource: initialRecord.leadSource || '-None-',
        leadManager1: initialRecord.leadManager1 || '-None-',
        accountNameText: accounts.find(a => a.id === initialRecord.accountId)?.name || initialRecord.accountName || '',
      };
    }
    return blankForm;
  });

  const [errors, setErrors] = useState({});
  const [showAccountLookup, setShowAccountLookup] = useState(false);
  const [accountSearch, setAccountSearch] = useState('');

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

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      handleChange('avatar', ev.target.result);
      toast.success('Contact photo selected');
    };
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    const newErrors = {};
    const lastNameTrim = String(formData.lastName || '').trim();
    if (!lastNameTrim) {
      newErrors.lastName = 'Last Name cannot be empty';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(formData.email).trim())) {
      newErrors.email = 'Enter a valid email address';
    }

    if (formData.secondaryEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(formData.secondaryEmail).trim())) {
      newErrors.secondaryEmail = 'Enter a valid secondary email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (saveAndNew = false) => {
    if (!validateForm()) {
      toast.error('Please fix the validation errors before saving');
      return;
    }

    const fName = String(formData.firstName || '').trim();
    const lName = String(formData.lastName || '').trim();
    const fullName = fName ? `${fName} ${lName}` : lName;

    // Resolve Account ID
    let accId = formData.accountId;
    if (!accId && formData.accountNameText) {
      const match = accounts.find(
        (a) => a.name.toLowerCase() === formData.accountNameText.trim().toLowerCase()
      );
      if (match) accId = match.id;
    }

    const payload = {
      ...formData,
      name: fullName,
      firstName: fName,
      lastName: lName,
      salutation: formData.salutation === '-None-' ? '' : formData.salutation,
      leadSource: formData.leadSource === '-None-' ? 'Website' : formData.leadSource,
      leadManager1: formData.leadManager1 === '-None-' ? '' : formData.leadManager1,
      accountId: accId || accounts[0]?.id || 'acc-001',
      accountName: formData.accountNameText || accounts.find(a => a.id === accId)?.name || 'Acme Technologies',
      city: formData.city || formData.mailingCity,
      modifiedTime: todayISO(),
    };

    if (isEditMode && initialRecord?.id) {
      updateRecord('contacts', initialRecord.id, payload);
      toast.success(`Contact "${fullName}" updated successfully`);
      if (onSuccess) onSuccess(initialRecord.id);
    } else {
      const created = createRecord('contacts', {
        ...payload,
        createdOn: todayISO(),
        createdTime: todayISO(),
        lastContacted: todayISO(),
        createdBy: activeUser?.id || 'u1',
        designation: payload.designation || 'Executive',
        lifecycle: payload.lifecycle || 'New',
        vendorName: payload.vendorName || 'None',
      });
      toast.success(`Contact "${fullName}" created successfully`);

      if (saveAndNew) {
        // Reset form for new entry
        setFormData({
          ...blankForm,
          ownerId: formData.ownerId,
        });
        setErrors({});
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        if (onSuccess) onSuccess(created.id);
      }
    }
  };

  const filteredAccounts = accounts.filter((a) =>
    a.name.toLowerCase().includes(accountSearch.toLowerCase()) ||
    (a.location && a.location.toLowerCase().includes(accountSearch.toLowerCase()))
  );

  return (
    <div data-testid="create-contact-form" className="bg-[#F8FAFD] min-h-[calc(100vh-62px)] pb-12">
      {/* Top Header Row matching Screenshot 2 */}
      <div className="sticky top-[60px] z-20 bg-white border-b border-line px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <h2 className="text-[19px] sm:text-[21px] font-bold text-ink tracking-tight">
            {isEditMode ? 'Edit Contact' : 'Create Contact'}
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
            data-testid="create-contact-cancel-btn"
            onClick={onCancel}
            className="h-8 px-3.5 rounded border border-line bg-white hover:bg-page text-[12.5px] font-medium text-ink-600 transition-colors"
          >
            Cancel
          </button>
          {!isEditMode && (
            <button
              type="button"
              data-testid="create-contact-save-and-new-btn"
              onClick={() => handleSave(true)}
              className="h-8 px-3.5 rounded border border-line bg-white hover:bg-page text-[12.5px] font-medium text-ink-600 transition-colors"
            >
              Save and New
            </button>
          )}
          <button
            type="button"
            data-testid="create-contact-save-btn"
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
          
          {/* ================= SECTION 1: CONTACT IMAGE ================= */}
          <div>
            <h3 className="text-[14px] font-semibold text-ink mb-3">Contact Image</h3>
            <div className="flex items-center gap-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-[68px] h-[68px] rounded-lg border-2 border-dashed border-line hover:border-primary bg-page-soft/60 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group"
                title="Click to upload contact photo"
              >
                {formData.avatar ? (
                  <img src={formData.avatar} alt="Contact avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-ink-400 group-hover:text-primary flex flex-col items-center">
                    <User size={28} strokeWidth={1.5} />
                  </div>
                )}
                <div className="absolute inset-0 bg-ink/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Camera size={16} className="text-white" />
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                aria-label="Upload Contact Image"
              />
              {formData.avatar && (
                <button
                  type="button"
                  onClick={() => handleChange('avatar', null)}
                  className="text-[12px] text-danger hover:underline inline-flex items-center gap-1"
                >
                  <Trash2 size={13} /> Remove Photo
                </button>
              )}
            </div>
          </div>

          <hr className="border-line-soft" />

          {/* ================= SECTION 2: CONTACT INFORMATION ================= */}
          <div>
            <h3 className="text-[14.5px] font-semibold text-ink mb-4 pb-1 border-b border-line-soft">
              Contact Information
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-4">
              {/* LEFT COLUMN */}
              <div className="space-y-3.5">
                {/* Contact Owner */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <label className="sm:w-[140px] shrink-0 text-[12.5px] text-ink-600 font-medium sm:text-right">
                    Contact Owner
                  </label>
                  <div className="flex-1 flex gap-1.5 items-center">
                    <select
                      value={formData.ownerId}
                      onChange={(e) => handleChange('ownerId', e.target.value)}
                      aria-label="Contact Owner"
                      className="input h-8 text-[12.5px] flex-1 bg-white"
                    >
                      <option value="dept-marketing">Marketing Department</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      title="Current active user"
                      onClick={() => handleChange('ownerId', activeUser?.id || 'u1')}
                      className="h-8 px-2 rounded border border-line bg-page hover:bg-page-hover text-ink-600 shrink-0"
                    >
                      <UserCheck size={14} />
                    </button>
                  </div>
                </div>

                {/* First Name (Salutation + First Name compound input) */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <label className="sm:w-[140px] shrink-0 text-[12.5px] text-ink-600 font-medium sm:text-right">
                    First Name
                  </label>
                  <div className="flex-1 flex gap-1.5 items-center">
                    <select
                      value={formData.salutation}
                      onChange={(e) => handleChange('salutation', e.target.value)}
                      aria-label="Salutation"
                      className="input h-8 text-[12.5px] w-[86px] shrink-0 bg-white"
                    >
                      <option value="-None-">-None-</option>
                      {SALUTATIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      placeholder="First Name"
                      aria-label="First Name"
                      className="input h-8 text-[12.5px] flex-1 bg-white"
                    />
                  </div>
                </div>

                {/* Account Name (with lookup icon) */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <label className="sm:w-[140px] shrink-0 text-[12.5px] text-ink-600 font-medium sm:text-right">
                    Account Name
                  </label>
                  <div className="flex-1 relative flex gap-1.5 items-center">
                    <input
                      type="text"
                      value={formData.accountNameText}
                      onChange={(e) => handleChange('accountNameText', e.target.value)}
                      placeholder="Select or enter Account Name"
                      aria-label="Account Name"
                      className="input h-8 text-[12.5px] flex-1 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAccountLookup((v) => !v)}
                      title="Lookup Accounts"
                      aria-label="Account Lookup"
                      className="h-8 px-2.5 rounded border border-line bg-page hover:bg-page-hover text-ink-600 shrink-0"
                    >
                      <Building2 size={14} />
                    </button>

                    {/* Account Lookup Popup */}
                    {showAccountLookup && (
                      <div className="absolute top-9 left-0 right-0 z-30 bg-white border border-line rounded-lg shadow-xl p-2 max-h-[220px] overflow-y-auto">
                        <div className="p-1 mb-1 border-b border-line-soft">
                          <input
                            type="search"
                            value={accountSearch}
                            onChange={(e) => setAccountSearch(e.target.value)}
                            placeholder="Search accounts..."
                            className="input h-7 text-[12px] w-full"
                            autoFocus
                          />
                        </div>
                        {filteredAccounts.slice(0, 8).map((a) => (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => {
                              handleChange('accountId', a.id);
                              handleChange('accountNameText', a.name);
                              setShowAccountLookup(false);
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

                {/* Email */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <label className="sm:w-[140px] shrink-0 text-[12.5px] text-ink-600 font-medium sm:text-right">
                    Email
                  </label>
                  <div className="flex-1">
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="e.g. name@company.com"
                      aria-label="Email"
                      className={`input h-8 text-[12.5px] w-full bg-white ${
                        errors.email ? 'border-danger focus:border-danger' : ''
                      }`}
                    />
                    {errors.email && (
                      <span className="text-[11px] text-danger mt-0.5 block">{errors.email}</span>
                    )}
                  </div>
                </div>

                {/* Phone */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <label className="sm:w-[140px] shrink-0 text-[12.5px] text-ink-600 font-medium sm:text-right">
                    Phone
                  </label>
                  <div className="flex-1">
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="e.g. +91 44 2850 1100"
                      aria-label="Phone"
                      className="input h-8 text-[12.5px] w-full bg-white"
                    />
                  </div>
                </div>

                {/* City */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <label className="sm:w-[140px] shrink-0 text-[12.5px] text-ink-600 font-medium sm:text-right">
                    City
                  </label>
                  <div className="flex-1 flex gap-1.5 items-center">
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      placeholder="e.g. Chennai"
                      aria-label="City"
                      className="input h-8 text-[12.5px] flex-1 bg-white"
                    />
                    <button
                      type="button"
                      title="Geocode location"
                      className="h-8 px-2.5 rounded border border-line bg-page hover:bg-page-hover text-ink-600 shrink-0"
                    >
                      <MapPin size={14} />
                    </button>
                  </div>
                </div>

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
                      placeholder="e.g. +91 98450 12345"
                      aria-label="Mobile"
                      className="input h-8 text-[12.5px] w-full bg-white"
                    />
                  </div>
                </div>

                {/* Lead Manager 1 */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <label className="sm:w-[140px] shrink-0 text-[12.5px] text-ink-600 font-medium sm:text-right">
                    Lead Manager 1
                  </label>
                  <div className="flex-1">
                    <select
                      value={formData.leadManager1}
                      onChange={(e) => handleChange('leadManager1', e.target.value)}
                      aria-label="Lead Manager 1"
                      className="input h-8 text-[12.5px] w-full bg-white"
                    >
                      <option value="-None-">-None-</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.name}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Associated Accounts */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <label className="sm:w-[140px] shrink-0 text-[12.5px] text-ink-600 font-medium sm:text-right">
                    Associated Accounts
                  </label>
                  <div className="flex-1 flex gap-1.5 items-center">
                    <input
                      type="text"
                      value={formData.associatedAccounts}
                      onChange={(e) => handleChange('associatedAccounts', e.target.value)}
                      placeholder="Select related accounts"
                      aria-label="Associated Accounts"
                      className="input h-8 text-[12.5px] flex-1 bg-white"
                    />
                    <button
                      type="button"
                      title="Link associated accounts"
                      className="h-8 px-2.5 rounded border border-line bg-page hover:bg-page-hover text-ink-600 shrink-0"
                    >
                      <LinkIcon size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="space-y-3.5">
                {/* Lead Source */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <label className="sm:w-[140px] shrink-0 text-[12.5px] text-ink-600 font-medium sm:text-right">
                    Lead Source
                  </label>
                  <div className="flex-1">
                    <select
                      value={formData.leadSource}
                      onChange={(e) => handleChange('leadSource', e.target.value)}
                      aria-label="Lead Source"
                      className="input h-8 text-[12.5px] w-full bg-white"
                    >
                      <option value="-None-">-None-</option>
                      {LEAD_SOURCES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Last Name (REQUIRED - signature Zoho red left border) */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <label className="sm:w-[140px] shrink-0 text-[12.5px] text-ink font-semibold sm:text-right">
                    Last Name <span className="text-danger">*</span>
                  </label>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      placeholder="Last Name (Required)"
                      aria-label="Last Name"
                      aria-required="true"
                      className={`input h-8 text-[12.5px] w-full bg-white border-l-[3px] border-l-[#E5293A] ${
                        errors.lastName ? 'border-danger ring-1 ring-danger/30' : ''
                      }`}
                    />
                    {errors.lastName && (
                      <span className="text-[11px] text-danger mt-0.5 block font-medium">
                        {errors.lastName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Department */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <label className="sm:w-[140px] shrink-0 text-[12.5px] text-ink-600 font-medium sm:text-right">
                    Department
                  </label>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => handleChange('department', e.target.value)}
                      placeholder="e.g. Sales, Engineering"
                      aria-label="Department"
                      className="input h-8 text-[12.5px] w-full bg-white"
                    />
                  </div>
                </div>

                {/* Secondary Email */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <label className="sm:w-[140px] shrink-0 text-[12.5px] text-ink-600 font-medium sm:text-right">
                    Secondary Email
                  </label>
                  <div className="flex-1">
                    <input
                      type="email"
                      value={formData.secondaryEmail}
                      onChange={(e) => handleChange('secondaryEmail', e.target.value)}
                      placeholder="e.g. alternate@gmail.com"
                      aria-label="Secondary Email"
                      className="input h-8 text-[12.5px] w-full bg-white"
                    />
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
                      placeholder="Client Name"
                      aria-label="Client Name"
                      className="input h-8 text-[12.5px] w-full bg-white"
                    />
                  </div>
                </div>

                {/* Social Lead ID (Read-only with Lock icon) */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <label className="sm:w-[140px] shrink-0 text-[12.5px] text-ink-600 font-medium sm:text-right">
                    Social Lead ID
                  </label>
                  <div className="flex-1 flex gap-1.5 items-center">
                    <input
                      type="text"
                      value={formData.socialLeadId}
                      readOnly
                      aria-label="Social Lead ID"
                      className="input h-8 text-[12.5px] flex-1 bg-page-soft text-ink-500 cursor-not-allowed select-all"
                    />
                    <div
                      title="Read-only system field"
                      className="h-8 px-2.5 rounded border border-line bg-page flex items-center justify-center text-ink-400 shrink-0"
                    >
                      <Lock size={13} />
                    </div>
                  </div>
                </div>

                {/* Contact to Deal (Checkbox) */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 pt-1">
                  <label className="sm:w-[140px] shrink-0 text-[12.5px] text-ink-600 font-medium sm:text-right">
                    Contact to Deal
                  </label>
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="contactToDeal"
                      checked={Boolean(formData.contactToDeal)}
                      onChange={(e) => handleChange('contactToDeal', e.target.checked)}
                      className="cb"
                    />
                    <label htmlFor="contactToDeal" className="text-[12px] text-ink-500 cursor-pointer select-none">
                      Enable automatic association to related deals
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-line-soft" />

          {/* ================= SECTION 3: ADDRESS INFORMATION ================= */}
          <div>
            <h3 className="text-[14.5px] font-semibold text-ink mb-4 pb-1 border-b border-line-soft">
              Address Information
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-4">
              {/* LEFT COLUMN */}
              <div className="space-y-3.5">
                {/* Mailing Street */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <label className="sm:w-[140px] shrink-0 text-[12.5px] text-ink-600 font-medium sm:text-right">
                    Mailing Street
                  </label>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={formData.mailingStreet}
                      onChange={(e) => handleChange('mailingStreet', e.target.value)}
                      placeholder="e.g. 104 Mount Road, Guindy"
                      aria-label="Mailing Street"
                      className="input h-8 text-[12.5px] w-full bg-white"
                    />
                  </div>
                </div>

                {/* Mailing State */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <label className="sm:w-[140px] shrink-0 text-[12.5px] text-ink-600 font-medium sm:text-right">
                    Mailing State
                  </label>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={formData.mailingState}
                      onChange={(e) => handleChange('mailingState', e.target.value)}
                      placeholder="e.g. Tamil Nadu"
                      aria-label="Mailing State"
                      className="input h-8 text-[12.5px] w-full bg-white"
                    />
                  </div>
                </div>

                {/* Mailing Country */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <label className="sm:w-[140px] shrink-0 text-[12.5px] text-ink-600 font-medium sm:text-right">
                    Mailing Country
                  </label>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={formData.mailingCountry}
                      onChange={(e) => handleChange('mailingCountry', e.target.value)}
                      placeholder="e.g. India"
                      aria-label="Mailing Country"
                      className="input h-8 text-[12.5px] w-full bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="space-y-3.5">
                {/* Mailing City */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <label className="sm:w-[140px] shrink-0 text-[12.5px] text-ink-600 font-medium sm:text-right">
                    Mailing City
                  </label>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={formData.mailingCity}
                      onChange={(e) => handleChange('mailingCity', e.target.value)}
                      placeholder="e.g. Chennai"
                      aria-label="Mailing City"
                      className="input h-8 text-[12.5px] w-full bg-white"
                    />
                  </div>
                </div>

                {/* Mailing Zip */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <label className="sm:w-[140px] shrink-0 text-[12.5px] text-ink-600 font-medium sm:text-right">
                    Mailing Zip
                  </label>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={formData.mailingZip}
                      onChange={(e) => handleChange('mailingZip', e.target.value)}
                      placeholder="e.g. 600002"
                      aria-label="Mailing Zip"
                      className="input h-8 text-[12.5px] w-full bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-line-soft" />

          {/* ================= SECTION 4: DESCRIPTION INFORMATION ================= */}
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
                  placeholder="Add any additional notes, background, or customer context..."
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

