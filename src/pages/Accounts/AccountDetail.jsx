import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Building2, Calendar, CheckCircle2, ChevronDown, ChevronLeft,
  ChevronRight, Clock, Copy, ExternalLink, FileText, GitBranch, Globe,
  History, Link as LinkIcon, Lock, Mail, MapPin, MessageCircle, MessageSquare,
  MoreHorizontal, Paperclip, Pencil, Phone, Plus, Printer, Send, ShieldCheck,
  Sparkles, Tag, Trash2, Users, X,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useToast } from '../../components/common/Toast';
import { AccountLogo, PersonAvatar, UserAvatar } from '../../components/common/Avatar';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import {
  ACCOUNT_OWNERSHIPS,
  ACCOUNT_RATINGS,
  ACCOUNT_TYPES,
  INDUSTRIES,
} from '../../data/seedData';
import { fmtINR, fmtDate, todayISO, addDays, balanceOf, sumBy } from '../../utils/calculations';
import {
  canSetParentAccount,
  getRelatedRecordsForAccount,
  getSelectableParentAccounts,
} from '../../utils/accountsFilterEngine';

export const ACCOUNT_RELATED_LIST_ITEMS = [
  { key: 'notes', label: 'Notes' },
  { key: 'connectedRecords', label: 'Connected Records' },
  { key: 'cadences', label: 'Cadences' },
  { key: 'attachments', label: 'Attachments' },
  { key: 'deals', label: 'Deals' },
  { key: 'contacts', label: 'Contacts' },
  { key: 'openActivities', label: 'Open Activities' },
  { key: 'closedActivities', label: 'Closed Activities' },
  { key: 'emails', label: 'Emails' },
  { key: 'products', label: 'Products' },
  { key: 'cases', label: 'Cases' },
  { key: 'quotes', label: 'Quotes' },
  { key: 'salesOrders', label: 'Sales Orders' },
  { key: 'purchaseOrders', label: 'Purchase Orders' },
  { key: 'invoices', label: 'Invoices' },
  { key: 'campaigns', label: 'Campaigns' },
  { key: 'social', label: 'Social' },
  { key: 'reportingContacts', label: 'Reporting Contacts' },
  { key: 'memberAccounts', label: 'Member Accounts' },
  { key: 'zohoSignDocuments', label: 'Zoho Sign Documents' },
  { key: 'zohoSurvey', label: 'Zoho Survey' },
];

const INDIAN_GST_STATES = [
  'Tamil Nadu',
  'Karnataka',
  'Maharashtra',
  'Telangana',
  'Delhi',
  'Gujarat',
  'West Bengal',
  'Uttar Pradesh',
  'Kerala',
  'Rajasthan',
];

const GST_TREATMENTS = [
  'Registered Business - Regular',
  'Registered Business - Composition',
  'Unregistered Business',
  'Consumer',
  'Overseas',
  'Special Economic Zone (SEZ)',
];

function FieldRow({ label, value }) {
  return (
    <div className="grid grid-cols-12 gap-2 py-2 border-b border-[#F1F5F9] text-[12.5px] items-start">
      <div className="col-span-5 text-[#64748B] font-normal sm:text-right pr-3 select-none">
        {label}
      </div>
      <div className="col-span-7 text-[#0F172A] font-medium break-words min-w-0">
        {value ?? '—'}
      </div>
    </div>
  );
}

function normalizeWebsiteUrl(url = '') {
  const clean = String(url || '').trim();
  if (!clean) return '';
  if (/^https?:\/\//i.test(clean)) return clean;
  return `https://${clean}`;
}

export default function AccountDetail({
  account,
  accountsList = [],
  onBack,
  onSelectAccount,
  activeUser,
  enforcePermissions = false,
}) {
  const navigate = useNavigate();
  const toast = useToast();
  const {
    accounts,
    contacts,
    deals,
    calls,
    invoices,
    tasks,
    users,
    accountRelations,
    contactRelations,
    accountsById,
    usersById,
    contactsById,
    userName,
    updateRecord,
    deleteRecords,
    createRecord,
    addAccountRelatedRecord,
    updateTask,
  } = useCRM();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'timeline'
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [detailsExpanded, setDetailsExpanded] = useState(true);
  const [activeRelatedKey, setActiveRelatedKey] = useState('notes');

  // Notes state
  const [noteInput, setNoteInput] = useState('');
  const [noteSortOrder, setNoteSortOrder] = useState('recent_last'); // 'recent_last' | 'recent_first'

  // Sub-tabs
  const [emailSubTab, setEmailSubTab] = useState('Mails'); // 'Mails' | 'Drafts' | 'Scheduled'
  const [contactsSubTab, setContactsSubTab] = useState('Contacts'); // 'Contacts' | 'Contact Roles'

  // Tags inline editor
  const [addingTag, setAddingTag] = useState(false);
  const [newTagText, setNewTagText] = useState('');

  // Modals & Menus
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [editErrors, setEditErrors] = useState({});
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeData, setComposeData] = useState({ to: '', subject: '', body: '' });
  const [whatsappMenuOpen, setWhatsappMenuOpen] = useState(false);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [locateMapOpen, setLocateMapOpen] = useState(false);
  const [newTaskModalOpen, setNewTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDue, setNewTaskDue] = useState(addDays(todayISO(), 3));
  const [newTaskPriority, setNewTaskPriority] = useState('High');
  const [quickAddModal, setQuickAddModal] = useState(null); // { moduleKey, title, label, value: '', amount: '' }

  const filterContext = useMemo(
    () => ({
      accounts,
      contacts,
      deals,
      calls,
      invoices,
      tasks,
      accountRelations,
      contactRelations,
      accountsById,
      usersById,
      contactsById,
    }),
    [accounts, contacts, deals, calls, invoices, tasks, accountRelations, contactRelations, accountsById, usersById, contactsById]
  );

  // Related records for this exact account
  const relNotes = useMemo(() => {
    const list = getRelatedRecordsForAccount(account, 'notes', filterContext);
    return [...list].sort((a, b) => {
      const da = String(a.createdDate || '');
      const db = String(b.createdDate || '');
      return noteSortOrder === 'recent_last' ? da.localeCompare(db) : db.localeCompare(da);
    });
  }, [account, filterContext, noteSortOrder]);

  const relConnected = useMemo(() => getRelatedRecordsForAccount(account, 'connectedRecords', filterContext), [account, filterContext]);
  const relCadences = useMemo(() => getRelatedRecordsForAccount(account, 'cadences', filterContext), [account, filterContext]);
  const relAttachments = useMemo(() => getRelatedRecordsForAccount(account, 'attachments', filterContext), [account, filterContext]);
  const relDeals = useMemo(() => getRelatedRecordsForAccount(account, 'deals', filterContext), [account, filterContext]);
  const relContacts = useMemo(() => getRelatedRecordsForAccount(account, 'contacts', filterContext), [account, filterContext]);
  const relTasks = useMemo(() => getRelatedRecordsForAccount(account, 'tasks', filterContext), [account, filterContext]);
  const relMeetings = useMemo(() => getRelatedRecordsForAccount(account, 'meetings', filterContext), [account, filterContext]);
  const relCalls = useMemo(() => getRelatedRecordsForAccount(account, 'calls', filterContext), [account, filterContext]);
  const relEmails = useMemo(() => getRelatedRecordsForAccount(account, 'emails', filterContext), [account, filterContext]);
  const relProducts = useMemo(() => getRelatedRecordsForAccount(account, 'products', filterContext), [account, filterContext]);
  const relCases = useMemo(() => getRelatedRecordsForAccount(account, 'cases', filterContext), [account, filterContext]);
  const relQuotes = useMemo(() => getRelatedRecordsForAccount(account, 'quotes', filterContext), [account, filterContext]);
  const relSalesOrders = useMemo(() => getRelatedRecordsForAccount(account, 'salesOrders', filterContext), [account, filterContext]);
  const relPurchaseOrders = useMemo(() => getRelatedRecordsForAccount(account, 'purchaseOrders', filterContext), [account, filterContext]);
  const relInvoices = useMemo(() => getRelatedRecordsForAccount(account, 'invoices', filterContext), [account, filterContext]);
  const relCampaigns = useMemo(() => getRelatedRecordsForAccount(account, 'campaigns', filterContext), [account, filterContext]);
  const relReportingContacts = useMemo(() => getRelatedRecordsForAccount(account, 'reportingContacts', filterContext), [account, filterContext]);
  const relMemberAccounts = useMemo(() => getRelatedRecordsForAccount(account, 'memberAccounts', filterContext), [account, filterContext]);
  const relZohoSign = useMemo(() => getRelatedRecordsForAccount(account, 'zohoSignDocuments', filterContext), [account, filterContext]);
  const relZohoSurvey = useMemo(() => getRelatedRecordsForAccount(account, 'zohoSurvey', filterContext), [account, filterContext]);

  // Open vs Closed Activities split
  const openTasks = useMemo(
    () => relTasks.filter((t) => !t.completed && t.status !== 'Completed' && t.status !== 'Closed'),
    [relTasks]
  );
  const closedTasks = useMemo(
    () => relTasks.filter((t) => t.completed || t.status === 'Completed' || t.status === 'Closed'),
    [relTasks]
  );

  const openMeetings = useMemo(
    () => relMeetings.filter((m) => m.status !== 'Completed' && m.status !== 'Held'),
    [relMeetings]
  );
  const closedMeetings = useMemo(
    () => relMeetings.filter((m) => m.status === 'Completed' || m.status === 'Held'),
    [relMeetings]
  );

  const openCalls = useMemo(
    () => relCalls.filter((c) => c.status === 'Scheduled'),
    [relCalls]
  );
  const closedCalls = useMemo(
    () => relCalls.filter((c) => c.status !== 'Scheduled'),
    [relCalls]
  );

  const openActivitiesCount = openTasks.length + openMeetings.length + openCalls.length;
  const closedActivitiesCount = closedTasks.length + closedMeetings.length + closedCalls.length;

  const relatedCounts = {
    notes: relNotes.length,
    connectedRecords: relConnected.length,
    cadences: relCadences.length,
    attachments: relAttachments.length,
    deals: relDeals.length,
    contacts: relContacts.length,
    openActivities: openActivitiesCount,
    closedActivities: closedActivitiesCount,
    emails: relEmails.length,
    products: relProducts.length,
    cases: relCases.length,
    quotes: relQuotes.length,
    salesOrders: relSalesOrders.length,
    purchaseOrders: relPurchaseOrders.length,
    invoices: relInvoices.length,
    campaigns: relCampaigns.length,
    social: account?.website || account?.tickerSymbol ? 1 : 0,
    reportingContacts: relReportingContacts.length,
    memberAccounts: relMemberAccounts.length,
    zohoSignDocuments: relZohoSign.length,
    zohoSurvey: relZohoSurvey.length,
  };

  // Previous / Next record navigation in current list
  const navList = accountsList.length > 0 ? accountsList : accounts;
  const currentIndex = navList.findIndex((a) => a.id === account?.id);
  const prevAccount = currentIndex > 0 ? navList[currentIndex - 1] : null;
  const nextAccount = currentIndex >= 0 && currentIndex < navList.length - 1 ? navList[currentIndex + 1] : null;

  if (!account) return null;

  const canModifyRecord = () => {
    if (account.locked) {
      toast.error(`"${account.name}" is locked and cannot be modified.`);
      return false;
    }
    if (enforcePermissions && activeUser && activeUser.role !== 'Sales Manager' && account.ownerId !== activeUser.id) {
      toast.error('Permission denied: Strict Owner Access is enabled and you are not the Account Owner.');
      return false;
    }
    return true;
  };

  // Open Edit Modal prefilled with this exact account's saved values
  const handleOpenEdit = () => {
    if (!canModifyRecord()) return;
    setEditForm({
      name: account.name || '',
      clientName: account.clientName || '',
      emailId: account.emailId || account.email || '',
      accountNumber: account.accountNumber || '',
      accountSite: account.accountSite || '',
      parentAccountId: account.parentAccountId || '',
      ownerId: account.ownerId || users[0]?.id || 'u1',
      leadManager1: account.leadManager1 || '',
      type: account.type || 'Customer',
      industry: account.industry || 'Information Technology',
      annualRevenue: account.annualRevenue ?? 0,
      employees: account.employees ?? 50,
      ownership: account.ownership || 'Private',
      rating: account.rating || 'Hot',
      phone: account.phone || '',
      mobile: account.mobile || '',
      fax: account.fax || '',
      website: account.website || '',
      tickerSymbol: account.tickerSymbol || '',
      sicCode: account.sicCode || '',
      gstin: account.gstin || account.gstNumber || '',
      gstState: account.gstState || account.billingState || 'Tamil Nadu',
      gstTreatment: account.gstTreatment || 'Registered Business - Regular',
      legalName: account.legalName || '',
      tradeName: account.tradeName || '',
      associatedContacts: account.associatedContacts || '',
      accountsToDeal: account.accountsToDeal || '',
      billingStreet: account.billingStreet || account.billingFlat || '',
      billingCity: account.billingCity || account.location || '',
      billingState: account.billingState || '',
      billingZip: account.billingZip || '',
      billingCountry: account.billingCountry || 'India',
      shippingStreet: account.shippingStreet || account.shippingFlat || '',
      shippingCity: account.shippingCity || '',
      shippingState: account.shippingState || '',
      shippingZip: account.shippingZip || '',
      shippingCountry: account.shippingCountry || 'India',
      description: account.description || '',
      tagInput: Array.isArray(account.tags) ? account.tags.join(', ') : account.tag || '',
    });
    setEditErrors({});
    setEditModalOpen(true);
  };

  const handleCopyBillingToShipping = () => {
    if (!editForm) return;
    setEditForm((prev) => ({
      ...prev,
      shippingStreet: prev.billingStreet,
      shippingCity: prev.billingCity,
      shippingState: prev.billingState,
      shippingZip: prev.billingZip,
      shippingCountry: prev.billingCountry,
    }));
    toast.info('Copied Billing Address to Shipping Address');
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editForm) return;
    const errs = {};
    const cleanName = String(editForm.name || '').trim();
    if (!cleanName) {
      errs.name = 'Account Name is required.';
    }
    if (editForm.parentAccountId && !canSetParentAccount(account.id, editForm.parentAccountId, accounts)) {
      errs.parentAccountId = 'Circular hierarchy detected: cannot select this parent account.';
    }
    if (Object.keys(errs).length > 0) {
      setEditErrors(errs);
      return;
    }

    const tags = String(editForm.tagInput || '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const billingAddress = [
      editForm.billingStreet,
      editForm.billingCity,
      editForm.billingState,
      editForm.billingZip,
      editForm.billingCountry,
    ]
      .filter(Boolean)
      .join(', ');

    const shippingAddress = [
      editForm.shippingStreet,
      editForm.shippingCity,
      editForm.shippingState,
      editForm.shippingZip,
      editForm.shippingCountry,
    ]
      .filter(Boolean)
      .join(', ');

    updateRecord('accounts', account.id, {
      ...editForm,
      name: cleanName,
      email: editForm.emailId,
      gstNumber: editForm.gstin,
      location: editForm.billingCity || account.location || 'Chennai',
      annualRevenue: Number(editForm.annualRevenue) || 0,
      employees: Number(editForm.employees) || 0,
      tags,
      tag: tags.join(', '),
      billingAddress,
      shippingAddress,
      modifiedTime: todayISO(),
      modifiedBy: activeUser?.id || account.ownerId || 'u1',
      lastActivityTime: todayISO(),
    });

    toast.success(`Updated account "${cleanName}"`);
    setEditModalOpen(false);
  };

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!noteInput.trim()) return;
    addAccountRelatedRecord('notes', {
      accountId: account.id,
      title: 'Account Note',
      content: noteInput.trim(),
      ownerId: account.ownerId || 'u1',
      status: 'Active',
    });
    setNoteInput('');
    toast.success('Note saved to account');
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    const clean = newTagText.trim();
    if (!clean) {
      setAddingTag(false);
      return;
    }
    const existing = Array.isArray(account.tags) ? account.tags : [];
    if (!existing.includes(clean)) {
      const updated = [...existing, clean];
      updateRecord('accounts', account.id, { tags: updated, tag: updated.join(', ') });
      toast.success(`Added tag "${clean}"`);
    }
    setNewTagText('');
    setAddingTag(false);
  };

  const handleRemoveTag = (tagToRemove) => {
    const existing = Array.isArray(account.tags) ? account.tags : [];
    const updated = existing.filter((t) => t !== tagToRemove);
    updateRecord('accounts', account.id, { tags: updated, tag: updated.join(', ') });
  };

  const scrollToRelatedSection = (key) => {
    setActiveRelatedKey(key);
    if (activeTab !== 'overview') {
      setActiveTab('overview');
      setTimeout(() => {
        const el = document.getElementById(`account-related-section-${key}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    } else {
      const el = document.getElementById(`account-related-section-${key}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const primaryDeal = relDeals[0] || null;
  const primaryContact = relContacts[0] || null;
  const parentAccount = account.parentAccountId ? accountsById[account.parentAccountId] : null;
  const totalInvoiced = sumBy(relInvoices, (i) => Number(i.total || i.amount || 0));
  const totalPaid = sumBy(relInvoices, (i) => Number(i.paid || 0));
  const totalBalance = sumBy(relInvoices, (i) => balanceOf(i));
  const phoneOrMobile = account.mobile || account.phone || '';
  const cleanDigits = String(phoneOrMobile).replace(/\D/g, '');

  return (
    <div
      data-testid="account-detail-page"
      className="mx-0 sm:-mx-[18px] -mt-2.5 -mb-6 bg-[#F3F6FA] min-h-[calc(100vh-60px)] flex flex-col overflow-x-hidden"
    >
      {/* ================================================================= */}
      {/* 1. TOP RECORD HEADER BAR (Matches Screenshot 1 & 2)               */}
      {/* ================================================================= */}
      <div className="sticky top-[60px] z-20 bg-white border-b border-[#DCE3EE] px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        {/* Left: Back arrow, Account Logo, Account Name, Tags */}
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            data-testid="account-detail-back-btn"
            aria-label="Back to Accounts"
            title="Back to Accounts list"
            className="h-8 w-8 rounded-lg border border-transparent hover:border-[#DCE3EE] hover:bg-[#F8FAFC] flex items-center justify-center text-[#334155] shrink-0 transition-colors"
          >
            <ArrowLeft size={17} />
          </button>

          <AccountLogo account={account} size={40} />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1
                data-testid="account-detail-title"
                className="text-[16px] sm:text-[18px] font-bold text-[#0F172A] tracking-tight truncate"
              >
                {account.name}
              </h1>
              {account.locked && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                  <Lock size={11} /> Locked
                </span>
              )}
            </div>

            {/* Tags Row */}
            <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[11.5px]">
              <Tag size={12} className="text-[#64748B]" />
              {(account.tags || []).map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2 py-0.2 rounded bg-[#EFF6FF] text-[#1262E0] border border-[#BFDBFE] font-medium"
                >
                  <span>{t}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    aria-label={`Remove tag ${t}`}
                    className="hover:text-[#0B4BB8]"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}

              {addingTag ? (
                <form onSubmit={handleAddTag} className="inline-flex items-center gap-1">
                  <input
                    type="text"
                    autoFocus
                    value={newTagText}
                    onChange={(e) => setNewTagText(e.target.value)}
                    onBlur={handleAddTag}
                    placeholder="Tag name..."
                    className="h-5 px-1.5 text-[11px] border border-[#1262E0] rounded focus:outline-none w-24"
                  />
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingTag(true)}
                  data-testid="account-detail-add-tags-btn"
                  className="text-[#64748B] hover:text-[#1262E0] font-medium hover:underline"
                >
                  Add Tags
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Send Email, Edit, WhatsApp Chat, More (...), Prev/Next Record Navigation */}
        <div className="flex flex-wrap items-center gap-2 ml-auto">
          <button
            type="button"
            data-testid="account-detail-send-email-btn"
            onClick={() => {
              setComposeData({
                to: account.emailId || account.email || primaryContact?.email || `accounts@${account.website || 'company.in'}`,
                subject: `Follow-up with ${account.name}`,
                body: `Hi ${primaryContact?.firstName || account.clientName || account.name} team,\n\nHope you are doing well. Following up regarding our ongoing engagement with ${account.name}.\n\nBest regards,\n${userName(account.ownerId)}`,
              });
              setComposeOpen(true);
            }}
            className="h-8 px-3.5 rounded bg-[#1262E0] hover:bg-[#0B4BB8] text-white text-[12.5px] font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <span>Send Email</span>
          </button>

          <button
            type="button"
            data-testid="account-detail-edit-btn"
            onClick={handleOpenEdit}
            className="h-8 px-3.5 rounded border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#1E293B] text-[12.5px] font-medium inline-flex items-center gap-1.5 transition-colors"
          >
            <span>Edit</span>
          </button>

          {/* WhatsApp Chat Button + Dropdown (Matches Screenshot 1) */}
          <div className="relative inline-flex">
            <button
              type="button"
              data-testid="account-detail-whatsapp-btn"
              onClick={() => {
                setWhatsappMessage(`Hello ${account.clientName || account.name}, reaching out from ${userName(account.ownerId)} regarding your account.`);
                setWhatsappModalOpen(true);
              }}
              className="h-8 px-3 rounded-l border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#1E293B] text-[12.5px] font-medium inline-flex items-center gap-1.5 transition-colors"
            >
              <MessageCircle size={13.5} className="text-[#16A34A]" />
              <span>WhatsApp Chat</span>
            </button>
            <button
              type="button"
              onClick={() => setWhatsappMenuOpen((p) => !p)}
              aria-label="WhatsApp options"
              className="h-8 px-1.5 rounded-r border-y border-r border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#475569] flex items-center"
            >
              <ChevronDown size={13} />
            </button>

            {whatsappMenuOpen && (
              <div
                onMouseLeave={() => setWhatsappMenuOpen(false)}
                className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-[#DCE3EE] bg-white shadow-lg py-1 z-40 text-[12.5px]"
              >
                <button
                  type="button"
                  onClick={() => {
                    setWhatsappMenuOpen(false);
                    setWhatsappMessage(`Hello ${account.clientName || account.name}, following up on your account.`);
                    setWhatsappModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-[#334155] hover:bg-[#F8FAFC]"
                >
                  <MessageCircle size={13.5} className="text-[#16A34A]" /> Send WhatsApp Message
                </button>
                {cleanDigits && (
                  <a
                    href={`https://wa.me/${cleanDigits}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setWhatsappMenuOpen(false)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-[#334155] hover:bg-[#F8FAFC]"
                  >
                    <ExternalLink size={13.5} className="text-[#64748B]" /> Open in WhatsApp Web
                  </a>
                )}
              </div>
            )}
          </div>

          {/* More Actions Menu (...) */}
          <div className="relative">
            <button
              type="button"
              data-testid="account-detail-more-btn"
              onClick={() => setMoreMenuOpen((p) => !p)}
              aria-label="More account actions"
              className="h-8 w-8 rounded border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#334155] flex items-center justify-center"
            >
              <MoreHorizontal size={15} />
            </button>

            {moreMenuOpen && (
              <div
                onMouseLeave={() => setMoreMenuOpen(false)}
                className="absolute right-0 top-full mt-1 w-52 rounded-lg border border-[#DCE3EE] bg-white shadow-lg py-1 z-40 text-[12.5px]"
              >
                <button
                  type="button"
                  onClick={() => {
                    setMoreMenuOpen(false);
                    navigate(`/deals?create=1&account=${account.id}`);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-[#334155] hover:bg-[#F8FAFC]"
                >
                  <Plus size={13.5} className="text-[#64748B]" /> New Deal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMoreMenuOpen(false);
                    navigate(`/contacts?create=1&account=${account.id}`);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-[#334155] hover:bg-[#F8FAFC]"
                >
                  <Users size={13.5} className="text-[#64748B]" /> New Contact
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMoreMenuOpen(false);
                    navigate(`/calls?create=1&account=${account.id}`);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-[#334155] hover:bg-[#F8FAFC]"
                >
                  <Phone size={13.5} className="text-[#64748B]" /> Log a Call
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMoreMenuOpen(false);
                    setNewTaskModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-[#334155] hover:bg-[#F8FAFC]"
                >
                  <Calendar size={13.5} className="text-[#64748B]" /> Create Task
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMoreMenuOpen(false);
                    const cloned = createRecord('accounts', {
                      ...account,
                      id: undefined,
                      name: `${account.name} (Copy)`,
                      accountNumber: `ACC-${1001 + accounts.length}`,
                      createdTime: todayISO(),
                    });
                    toast.success(`Cloned account "${cloned.name}"`);
                    onSelectAccount?.(cloned.id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-[#334155] hover:bg-[#F8FAFC]"
                >
                  <Copy size={13.5} className="text-[#64748B]" /> Clone Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMoreMenuOpen(false);
                    window.print();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-[#334155] hover:bg-[#F8FAFC]"
                >
                  <Printer size={13.5} className="text-[#64748B]" /> Print Preview
                </button>
                <div className="my-1 border-t border-[#E2E8F0]" />
                <button
                  type="button"
                  onClick={() => {
                    setMoreMenuOpen(false);
                    if (!canModifyRecord()) return;
                    setConfirmDeleteOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-[#DC2626] hover:bg-[#FEF2F2]"
                >
                  <Trash2 size={13.5} /> Delete Account
                </button>
              </div>
            )}
          </div>

          {/* Previous / Next Account Record Navigation */}
          <div className="inline-flex items-center rounded border border-[#CBD5E1] bg-white overflow-hidden ml-1">
            <button
              type="button"
              data-testid="account-detail-prev-btn"
              disabled={!prevAccount}
              onClick={() => prevAccount && onSelectAccount?.(prevAccount.id)}
              aria-label="Previous account"
              title={prevAccount ? `Previous: ${prevAccount.name}` : 'No previous account'}
              className="h-8 w-7 flex items-center justify-center text-[#334155] hover:bg-[#F8FAFC] disabled:opacity-35 border-r border-[#E2E8F0]"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              type="button"
              data-testid="account-detail-next-btn"
              disabled={!nextAccount}
              onClick={() => nextAccount && onSelectAccount?.(nextAccount.id)}
              aria-label="Next account"
              title={nextAccount ? `Next: ${nextAccount.name}` : 'No next account'}
              className="h-8 w-7 flex items-center justify-center text-[#334155] hover:bg-[#F8FAFC] disabled:opacity-35"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 2. MOBILE SCROLLABLE RELATED LIST BAR (< lg screens)              */}
      {/* ================================================================= */}
      <div className="lg:hidden bg-white border-b border-[#DCE3EE] px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider shrink-0 mr-1">
          Related:
        </span>
        {ACCOUNT_RELATED_LIST_ITEMS.map((item) => {
          const count = relatedCounts[item.key] || 0;
          const isActive = activeRelatedKey === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => scrollToRelatedSection(item.key)}
              className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11.5px] font-medium transition-colors ${
                isActive
                  ? 'bg-[#EFF6FF] text-[#1262E0] border border-[#BFDBFE]'
                  : 'bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0]'
              }`}
            >
              <span>{item.label}</span>
              {count > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#1262E0] text-white text-[10px] font-semibold">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ================================================================= */}
      {/* 3. BODY: LEFT RELATED LIST SIDEBAR + MAIN DETAIL AREA             */}
      {/* ================================================================= */}
      <div className="flex-1 flex min-h-0">
        {/* Desktop Left Related List Navigation matching Screenshots 1 & 2 */}
        {sidebarOpen && (
          <aside
            data-testid="account-detail-related-sidebar"
            aria-label="Related List navigation"
            className="hidden lg:flex flex-col w-[192px] shrink-0 bg-white border-r border-[#DCE3EE] py-3 px-2.5 select-none"
          >
            <div className="px-2 pb-2 text-[12px] font-bold text-[#0F172A] tracking-tight">
              Related List
            </div>

            <nav className="space-y-0.5 flex-1">
              {ACCOUNT_RELATED_LIST_ITEMS.map((item) => {
                const count = relatedCounts[item.key] || 0;
                const isActive = activeRelatedKey === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => scrollToRelatedSection(item.key)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-left text-[12px] transition-colors ${
                      isActive
                        ? 'bg-[#EFF6FF] text-[#1262E0] font-semibold'
                        : 'text-[#334155] hover:bg-[#F8FAFC] hover:text-[#0F172A] font-normal'
                    }`}
                  >
                    <span className="truncate">{item.label}</span>
                    {count > 0 && (
                      <span
                        className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10.5px] font-semibold ${
                          isActive
                            ? 'bg-[#1262E0] text-white'
                            : 'bg-[#F1F5F9] text-[#475569]'
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}

              <div className="pt-2 px-2.5">
                <button
                  type="button"
                  onClick={() => toast.info('All supported CRM account related modules are displayed.')}
                  className="text-[12px] font-semibold text-[#1262E0] hover:underline"
                >
                  Add Related List
                </button>
              </div>
            </nav>

            {/* Links Section at bottom of left sidebar matching Screenshot 1 */}
            <div className="mt-4 pt-3 border-t border-[#E2E8F0] px-2">
              <div className="text-[12px] font-bold text-[#0F172A] mb-1.5">Links</div>
              <button
                type="button"
                onClick={() => {
                  const targetUrl = normalizeWebsiteUrl(account.website) || `https://www.google.com/search?q=${encodeURIComponent(account.name)}`;
                  window.open(targetUrl, '_blank', 'noopener,noreferrer');
                }}
                className="text-[12px] font-medium text-[#1262E0] hover:underline inline-flex items-center gap-1"
              >
                <LinkIcon size={11} /> Add Link
              </button>
            </div>
          </aside>
        )}

        {/* Main Content Column */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Overview / Timeline Subheader Bar */}
          <div className="bg-white border-b border-[#DCE3EE] px-4 py-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSidebarOpen((p) => !p)}
                aria-label="Toggle Related List sidebar"
                title={sidebarOpen ? 'Collapse Related List' : 'Expand Related List'}
                className="hidden lg:inline-flex h-7 w-7 rounded border border-[#CBD5E1] items-center justify-center text-[#475569] hover:bg-[#F8FAFC]"
              >
                <FileText size={13} />
              </button>

              {/* Overview / Timeline Pill Tabs */}
              <div className="inline-flex items-center rounded-full bg-[#F1F5F9] p-0.5 border border-[#CBD5E1]">
                <button
                  type="button"
                  data-testid="account-detail-tab-overview"
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-1 rounded-full text-[12px] font-semibold transition-all ${
                    activeTab === 'overview'
                      ? 'bg-white text-[#1262E0] shadow-2xs border border-[#1262E0]'
                      : 'text-[#475569] hover:text-[#0F172A]'
                  }`}
                >
                  Overview
                </button>
                <button
                  type="button"
                  data-testid="account-detail-tab-timeline"
                  onClick={() => setActiveTab('timeline')}
                  className={`px-4 py-1 rounded-full text-[12px] font-semibold transition-all ${
                    activeTab === 'timeline'
                      ? 'bg-white text-[#1262E0] shadow-2xs border border-[#1262E0]'
                      : 'text-[#475569] hover:text-[#0F172A]'
                  }`}
                >
                  Timeline
                </button>
              </div>
            </div>

            <div className="text-[11.5px] text-[#64748B] flex items-center gap-1.5">
              <Clock size={12.5} />
              <span>
                Last Update : {fmtDate(account.lastActivityTime || account.modifiedTime || account.createdTime || account.createdOn) || '11:37 AM'}
              </span>
            </div>
          </div>

          {/* =============================================================== */}
          {/* TAB 1: OVERVIEW                                                 */}
          {/* =============================================================== */}
          {activeTab === 'overview' ? (
            <div className="p-3 sm:p-4 space-y-3 max-w-[1440px]">
              {/* 1. Top Executive Summary Card (5 Key Fields matching Screenshot 1) */}
              <div
                data-testid="account-detail-summary-card"
                className="bg-white rounded-md border border-[#DCE3EE] p-4 shadow-2xs"
              >
                <div className="max-w-xl space-y-2 text-[12.5px]">
                  <div className="grid grid-cols-12 items-center">
                    <span className="col-span-5 sm:col-span-4 text-[#64748B] sm:text-right pr-6">Mobile</span>
                    <span className="col-span-7 sm:col-span-8 inline-flex items-center gap-2 font-medium text-[#0F172A]">
                      <span>{phoneOrMobile || '—'}</span>
                      {phoneOrMobile && (
                        <>
                          <a
                            href={`tel:${String(phoneOrMobile).replace(/\s/g, '')}`}
                            title={`Call ${phoneOrMobile}`}
                            className="w-4 h-4 rounded-full bg-[#10B981] text-white inline-flex items-center justify-center"
                          >
                            <Phone size={9} className="fill-current" />
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              setWhatsappMessage(`Hello ${account.clientName || account.name}, reaching out regarding your account.`);
                              setWhatsappModalOpen(true);
                            }}
                            title="WhatsApp Chat"
                            className="w-4 h-4 rounded-full bg-[#16A34A] text-white inline-flex items-center justify-center"
                          >
                            <MessageCircle size={9} />
                          </button>
                        </>
                      )}
                    </span>
                  </div>
                  <div className="grid grid-cols-12 items-center">
                    <span className="col-span-5 sm:col-span-4 text-[#64748B] sm:text-right pr-6">GST Number/GSTIN</span>
                    <span className="col-span-7 sm:col-span-8 font-mono font-medium text-[#0F172A]">
                      {account.gstin || account.gstNumber || '—'}
                    </span>
                  </div>
                  <div className="grid grid-cols-12 items-center">
                    <span className="col-span-5 sm:col-span-4 text-[#64748B] sm:text-right pr-6">Account Owner</span>
                    <span className="col-span-7 sm:col-span-8 font-medium text-[#0F172A]">
                      {userName(account.ownerId) || 'Sales Team'}
                    </span>
                  </div>
                  <div className="grid grid-cols-12 items-center">
                    <span className="col-span-5 sm:col-span-4 text-[#64748B] sm:text-right pr-6">Account Site</span>
                    <span className="col-span-7 sm:col-span-8 font-medium text-[#0F172A]">
                      {account.accountSite || '—'}
                    </span>
                  </div>
                  <div className="grid grid-cols-12 items-center">
                    <span className="col-span-5 sm:col-span-4 text-[#64748B] sm:text-right pr-6">Parent Account</span>
                    <span className="col-span-7 sm:col-span-8 font-medium text-[#0F172A]">
                      {parentAccount ? (
                        <Link
                          to={`/accounts/${parentAccount.id}`}
                          onClick={() => onSelectAccount?.(parentAccount.id)}
                          className="text-[#1262E0] hover:underline"
                        >
                          {parentAccount.name}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Deals, Contacts & Finance Details 3-Column Strip (Matching Screenshot 1) */}
              <div
                data-testid="account-detail-highlights-card"
                className="bg-white rounded-md border border-[#DCE3EE] px-5 py-3.5 shadow-2xs grid grid-cols-1 md:grid-cols-3 gap-4 divide-y md:divide-y-0 md:divide-x divide-[#E2E8F0]"
              >
                {/* Column 1: Deals */}
                <div>
                  <div className="text-[11.5px] font-bold text-[#0F172A] mb-1.5">Deals</div>
                  {primaryDeal ? (
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/deals?open=${primaryDeal.id}`}
                          className="text-[12.5px] font-semibold text-[#0F172A] hover:text-[#1262E0] hover:underline"
                        >
                          {primaryDeal.name}
                        </Link>
                        <span className="px-1.5 py-0.2 rounded border border-[#EF4444] bg-[#FEF2F2] text-[#DC2626] text-[11px] font-semibold">
                          {fmtINR(primaryDeal.amount)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11.5px]">
                        <span className="px-2 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] font-semibold">
                          {primaryDeal.stage}
                        </span>
                        <span className="text-[#475569] font-medium">
                          {fmtDate(primaryDeal.closingDate)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[12px] text-[#64748B]">
                      <span>No active deals linked</span>
                      <button
                        type="button"
                        onClick={() => navigate(`/deals?create=1&account=${account.id}`)}
                        className="text-[#1262E0] hover:underline font-medium"
                      >
                        + New Deal
                      </button>
                    </div>
                  )}
                </div>

                {/* Column 2: Contacts */}
                <div className="pt-3 md:pt-0 md:pl-5">
                  <div className="text-[11.5px] font-bold text-[#0F172A] mb-1.5">Contacts</div>
                  {primaryContact ? (
                    <div className="flex items-start gap-2.5">
                      <PersonAvatar name={primaryContact.name} size={30} />
                      <div className="min-w-0 text-[12px] space-y-0.5">
                        <Link
                          to={`/contacts/${primaryContact.id}`}
                          className="font-semibold text-[#0F172A] hover:text-[#1262E0] hover:underline block truncate"
                        >
                          {primaryContact.name}
                        </Link>
                        {primaryContact.email && (
                          <div className="text-[#64748B] truncate">{primaryContact.email}</div>
                        )}
                        <div className="inline-flex items-center gap-1.5 text-[#334155]">
                          <Phone size={11} className="text-[#10B981]" />
                          <span>{primaryContact.mobile || primaryContact.phone || '—'}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[12px] text-[#64748B]">
                      <span>No primary contact linked</span>
                      <button
                        type="button"
                        onClick={() => navigate(`/contacts?create=1&account=${account.id}`)}
                        className="text-[#1262E0] hover:underline font-medium"
                      >
                        + New Contact
                      </button>
                    </div>
                  )}
                </div>

                {/* Column 3: Finance Details */}
                <div className="pt-3 md:pt-0 md:pl-5">
                  <div className="text-[11.5px] font-bold text-[#0F172A] mb-1.5">Finance Details</div>
                  <div className="space-y-1 text-[12px]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B]">Total Invoice Amount</span>
                      <span className="font-semibold text-[#0F172A]">
                        {totalInvoiced > 0 ? fmtINR(totalInvoiced) : '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B]">Paid</span>
                      <span className="font-medium text-[#16A34A]">
                        {totalPaid > 0 ? fmtINR(totalPaid) : '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B]">Balance</span>
                      <span className="font-medium text-[#DC2626]">
                        {totalBalance > 0 ? fmtINR(totalBalance) : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Collapsible Full Details Card (Account Info, Address Info, Description Info) */}
              <div
                data-testid="account-detail-info-card"
                className="bg-white rounded-md border border-[#DCE3EE] shadow-2xs overflow-hidden"
              >
                <div className="px-5 py-2.5 border-b border-[#E2E8F0] flex items-center justify-between">
                  <button
                    type="button"
                    data-testid="account-detail-toggle-details-btn"
                    onClick={() => setDetailsExpanded((p) => !p)}
                    className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-[#0F172A] hover:text-[#1262E0]"
                  >
                    <span>{detailsExpanded ? 'Hide Details' : 'Show Details'}</span>
                    <ChevronDown
                      size={14}
                      className={`transition-transform ${detailsExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>

                {detailsExpanded && (
                  <div className="p-5 space-y-6">
                    {/* SECTION A: Account Information (Matches Screenshot 1) */}
                    <div>
                      <h2 className="text-[13.5px] font-bold text-[#0F172A] mb-3">
                        Account Information
                      </h2>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10">
                        {/* Left Column */}
                        <div>
                          <FieldRow label="Account Owner" value={userName(account.ownerId) || 'Sales Team'} />
                          <FieldRow label="Client Name" value={account.clientName || '—'} />
                          <FieldRow
                            label="Email ID"
                            value={
                              account.emailId || account.email ? (
                                <a
                                  href={`mailto:${account.emailId || account.email}`}
                                  className="text-[#1262E0] hover:underline"
                                >
                                  {account.emailId || account.email}
                                </a>
                              ) : (
                                '—'
                              )
                            }
                          />
                          <FieldRow label="Account Name" value={account.name} />
                          <FieldRow label="Account Site" value={account.accountSite || '—'} />
                          <FieldRow
                            label="Parent Account"
                            value={
                              parentAccount ? (
                                <Link
                                  to={`/accounts/${parentAccount.id}`}
                                  onClick={() => onSelectAccount?.(parentAccount.id)}
                                  className="text-[#1262E0] hover:underline font-semibold"
                                >
                                  {parentAccount.name}
                                </Link>
                              ) : (
                                '—'
                              )
                            }
                          />
                          <FieldRow label="Account Number" value={account.accountNumber || '0'} />
                          <FieldRow label="GST State" value={account.gstState || account.billingState || '—'} />
                          <FieldRow label="GST Treatment" value={account.gstTreatment || '—'} />
                          <FieldRow label="Associated contacts" value={account.associatedContacts || '—'} />
                          <FieldRow label="Account Type" value={account.type || '—'} />
                          <FieldRow label="Industry" value={account.industry || '—'} />
                          <FieldRow label="Ownership" value={account.ownership || '—'} />
                          <FieldRow label="Rating" value={account.rating || '—'} />
                        </div>

                        {/* Right Column */}
                        <div>
                          <FieldRow
                            label="Mobile"
                            value={
                              phoneOrMobile ? (
                                <span className="inline-flex items-center gap-2">
                                  <span>{phoneOrMobile}</span>
                                  <a
                                    href={`tel:${String(phoneOrMobile).replace(/\s/g, '')}`}
                                    title={`Call ${phoneOrMobile}`}
                                    className="w-4 h-4 rounded-full bg-[#10B981] text-white inline-flex items-center justify-center"
                                  >
                                    <Phone size={9} className="fill-current" />
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setWhatsappMessage(`Hello ${account.clientName || account.name}, following up on your account.`);
                                      setWhatsappModalOpen(true);
                                    }}
                                    title="WhatsApp Chat"
                                    className="w-4 h-4 rounded-full bg-[#16A34A] text-white inline-flex items-center justify-center"
                                  >
                                    <MessageCircle size={9} />
                                  </button>
                                </span>
                              ) : (
                                '—'
                              )
                            }
                          />
                          <FieldRow label="Phone" value={account.phone || '—'} />
                          <FieldRow
                            label="Website"
                            value={
                              account.website ? (
                                <a
                                  href={normalizeWebsiteUrl(account.website)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#1262E0] hover:underline inline-flex items-center gap-1"
                                >
                                  <span>{account.website}</span>
                                  <ExternalLink size={11} />
                                </a>
                              ) : (
                                '—'
                              )
                            }
                          />
                          <FieldRow
                            label="Modified By"
                            value={
                              <div>
                                <div>{userName(account.modifiedBy || account.ownerId) || 'Sales Team'}</div>
                                <div className="text-[11px] text-[#64748B] font-normal">
                                  {account.modifiedTime || account.lastActivityTime || account.createdOn || '—'}
                                </div>
                              </div>
                            }
                          />
                          <FieldRow
                            label="Created By"
                            value={
                              <div>
                                <div>{userName(account.createdBy || account.ownerId) || 'Sales Team'}</div>
                                <div className="text-[11px] text-[#64748B] font-normal">
                                  {account.createdTime || account.createdOn || '—'}
                                </div>
                              </div>
                            }
                          />
                          <FieldRow
                            label="Lead Manager 1"
                            value={account.leadManager1 ? userName(account.leadManager1) || account.leadManager1 : '—'}
                          />
                          <FieldRow label="GST Number/GSTIN" value={account.gstin || account.gstNumber || '—'} />
                          <FieldRow label="Legal Name" value={account.legalName || '—'} />
                          <FieldRow label="Trade name" value={account.tradeName || '—'} />
                          <FieldRow label="Accounts to Deal" value={account.accountsToDeal || '—'} />
                          <FieldRow label="Annual Revenue" value={account.annualRevenue ? fmtINR(account.annualRevenue) : '—'} />
                          <FieldRow label="Employees" value={account.employees ? Number(account.employees).toLocaleString('en-IN') : '—'} />
                          <FieldRow label="SIC Code" value={account.sicCode || '—'} />
                          <FieldRow label="Ticker Symbol" value={account.tickerSymbol || '—'} />
                        </div>
                      </div>
                    </div>

                    {/* SECTION B: Address Information (with Locate Map button matching Screenshot 1) */}
                    <div>
                      <div className="flex items-center justify-between max-w-md mb-3">
                        <h2 className="text-[13.5px] font-bold text-[#0F172A]">
                          Address Information
                        </h2>
                        <button
                          type="button"
                          onClick={() => setLocateMapOpen(true)}
                          className="h-6 px-2.5 rounded border border-[#CBD5E1] bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#334155] text-[11px] font-medium"
                        >
                          Locate Map
                        </button>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10">
                        <div>
                          <FieldRow label="Billing Street" value={account.billingStreet || account.billingFlat || '—'} />
                          <FieldRow label="Billing City" value={account.billingCity || account.location || '—'} />
                          <FieldRow label="Billing State" value={account.billingState || '—'} />
                          <FieldRow label="Billing Code" value={account.billingZip || '—'} />
                          <FieldRow label="Billing Country" value={account.billingCountry || 'India'} />
                        </div>
                        <div>
                          <FieldRow label="Shipping Street" value={account.shippingStreet || account.shippingFlat || '—'} />
                          <FieldRow label="Shipping City" value={account.shippingCity || '—'} />
                          <FieldRow label="Shipping State" value={account.shippingState || '—'} />
                          <FieldRow label="Shipping Code" value={account.shippingZip || '—'} />
                          <FieldRow label="Shipping Country" value={account.shippingCountry || '—'} />
                        </div>
                      </div>
                    </div>

                    {/* SECTION C: Description Information */}
                    <div>
                      <h2 className="text-[13.5px] font-bold text-[#0F172A] mb-3">
                        Description Information
                      </h2>
                      <div className="max-w-3xl">
                        <FieldRow label="Description" value={account.description || '—'} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ============================================================= */}
              {/* RELATED LIST CARDS (Matching Screenshots 1 & 2)               */}
              {/* ============================================================= */}

              {/* 1. NOTES */}
              <div
                id="account-related-section-notes"
                className="bg-white rounded-md border border-[#DCE3EE] shadow-2xs overflow-hidden scroll-mt-28"
              >
                <div className="px-5 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
                  <h3 className="text-[13.5px] font-bold text-[#0F172A]">Notes</h3>
                  <select
                    value={noteSortOrder}
                    onChange={(e) => setNoteSortOrder(e.target.value)}
                    aria-label="Sort notes"
                    className="h-7 px-2 rounded border border-[#CBD5E1] bg-white text-[11.5px] text-[#334155]"
                  >
                    <option value="recent_last">Recent Last</option>
                    <option value="recent_first">Recent First</option>
                  </select>
                </div>
                <div className="p-4 space-y-3">
                  {relNotes.length > 0 && (
                    <div className="space-y-2">
                      {relNotes.map((n) => (
                        <div
                          key={n.id}
                          className="p-3 rounded border border-[#E2E8F0] bg-[#F8FAFC] text-[12.5px]"
                        >
                          <div className="flex items-center justify-between text-[11px] text-[#64748B] mb-1">
                            <span className="font-semibold text-[#334155]">
                              {n.title || 'Note'} · {userName(n.ownerId || account.ownerId)}
                            </span>
                            <span>{fmtDate(n.createdDate)}</span>
                          </div>
                          <p className="text-[#0F172A] whitespace-pre-line">{n.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <form onSubmit={handleAddNote} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      placeholder="Add a note..."
                      className="flex-1 h-9 px-3 rounded border border-[#CBD5E1] text-[12.5px] focus:outline-none focus:border-[#1262E0]"
                    />
                    {noteInput.trim() && (
                      <button
                        type="submit"
                        className="h-9 px-4 rounded bg-[#1262E0] hover:bg-[#0B4BB8] text-white text-[12px] font-semibold"
                      >
                        Save Note
                      </button>
                    )}
                  </form>
                </div>
              </div>

              {/* 2. CONNECTED RECORDS */}
              <div
                id="account-related-section-connectedRecords"
                className="bg-white rounded-md border border-[#DCE3EE] shadow-2xs overflow-hidden scroll-mt-28"
              >
                <div className="px-5 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
                  <h3 className="text-[13.5px] font-bold text-[#0F172A]">Connected Records</h3>
                  <button
                    type="button"
                    onClick={() =>
                      setQuickAddModal({
                        moduleKey: 'convertedLeads',
                        title: 'Link Connected Record',
                        label: 'Connected Lead / Record Name',
                        value: '',
                      })
                    }
                    className="h-7 px-3 rounded border border-[#93C5FD] bg-white hover:bg-[#EFF6FF] text-[#1262E0] text-[12px] font-medium"
                  >
                    + Link Record
                  </button>
                </div>
                <div className="p-4">
                  {relConnected.length === 0 ? (
                    <div className="text-center py-4 text-[12.5px] text-[#64748B]">No records found</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[12.5px]">
                        <thead>
                          <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                            <th className="py-2 px-3 font-medium">Record Name</th>
                            <th className="py-2 px-3 font-medium">Source</th>
                            <th className="py-2 px-3 font-medium">Status</th>
                            <th className="py-2 px-3 font-medium">Owner</th>
                            <th className="py-2 px-3 font-medium">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F1F5F9]">
                          {relConnected.map((rec) => (
                            <tr key={rec.id} className="hover:bg-[#F8FAFC]">
                              <td className="py-2 px-3 font-medium text-[#0F172A]">
                                {rec.leadName || rec.title || rec.name}
                              </td>
                              <td className="py-2 px-3 text-[#475569]">{rec.leadSource || 'Website'}</td>
                              <td className="py-2 px-3">
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#EFF6FF] text-[#1262E0]">
                                  {rec.status || 'Connected'}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-[#475569]">{userName(rec.ownerId || account.ownerId)}</td>
                              <td className="py-2 px-3 text-[#64748B]">{fmtDate(rec.convertedDate || rec.createdDate)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. CADENCES */}
              <div
                id="account-related-section-cadences"
                className="bg-white rounded-md border border-[#DCE3EE] shadow-2xs overflow-hidden scroll-mt-28"
              >
                <div className="px-5 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
                  <h3 className="text-[13.5px] font-bold text-[#0F172A]">Cadences</h3>
                  <button
                    type="button"
                    onClick={() =>
                      setQuickAddModal({
                        moduleKey: 'cadences',
                        title: 'Enrol in Cadence',
                        label: 'Cadence Name',
                        value: 'Enterprise Account ABM Cadence',
                      })
                    }
                    className="h-7 px-3 rounded border border-[#93C5FD] bg-white hover:bg-[#EFF6FF] text-[#1262E0] text-[12px] font-medium"
                  >
                    Enrol
                  </button>
                </div>
                <div className="p-4">
                  {relCadences.length === 0 ? (
                    <div className="text-center py-4 text-[12.5px] text-[#64748B]">No records found</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[12.5px]">
                        <thead>
                          <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                            <th className="py-2 px-3 font-medium">Cadence Name</th>
                            <th className="py-2 px-3 font-medium">Status</th>
                            <th className="py-2 px-3 font-medium">Enrolled On</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F1F5F9]">
                          {relCadences.map((cad) => (
                            <tr key={cad.id} className="hover:bg-[#F8FAFC]">
                              <td className="py-2 px-3 font-medium text-[#0F172A]">
                                {cad.cadenceName || cad.title}
                              </td>
                              <td className="py-2 px-3">
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF5] text-[#059669]">
                                  {cad.status || 'Active'}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-[#64748B]">{fmtDate(cad.createdDate)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. ATTACHMENTS */}
              <div
                id="account-related-section-attachments"
                className="bg-white rounded-md border border-[#DCE3EE] shadow-2xs overflow-hidden scroll-mt-28"
              >
                <div className="px-5 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
                  <h3 className="text-[13.5px] font-bold text-[#0F172A]">Attachments</h3>
                  <button
                    type="button"
                    onClick={() =>
                      setQuickAddModal({
                        moduleKey: 'attachments',
                        title: 'Attach File to Account',
                        label: 'File Name',
                        value: `${account.name.replace(/\s+/g, '_')}_MSA_2026.pdf`,
                      })
                    }
                    className="h-7 px-3 rounded border border-[#93C5FD] bg-white hover:bg-[#EFF6FF] text-[#1262E0] text-[12px] font-medium inline-flex items-center gap-1"
                  >
                    <span>Attach</span>
                    <ChevronDown size={12} />
                  </button>
                </div>
                <div className="p-4">
                  {relAttachments.length === 0 ? (
                    <div className="text-center py-4 text-[12.5px] text-[#64748B]">No Attachment</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[12.5px]">
                        <thead>
                          <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                            <th className="py-2 px-3 font-medium">File Name</th>
                            <th className="py-2 px-3 font-medium">Size</th>
                            <th className="py-2 px-3 font-medium">Attached By</th>
                            <th className="py-2 px-3 font-medium">Date Added</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F1F5F9]">
                          {relAttachments.map((att) => (
                            <tr key={att.id} className="hover:bg-[#F8FAFC]">
                              <td className="py-2 px-3 font-medium text-[#1262E0] flex items-center gap-1.5">
                                <Paperclip size={13} />
                                <span>{att.fileName || att.title || att.name}</span>
                              </td>
                              <td className="py-2 px-3 text-[#475569]">{att.fileSize || '320 KB'}</td>
                              <td className="py-2 px-3 text-[#475569]">{userName(att.uploadedBy || att.ownerId || account.ownerId)}</td>
                              <td className="py-2 px-3 text-[#64748B]">{fmtDate(att.createdDate)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* 5. DEALS (Matches Screenshot 1 exact columns: Deal Name | Amount | Stage | Probability (%) | Closing Date | Type | Deal Owner) */}
              <div
                id="account-related-section-deals"
                className="bg-white rounded-md border border-[#DCE3EE] shadow-2xs overflow-hidden scroll-mt-28"
              >
                <div className="px-5 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
                  <h3 className="text-[13.5px] font-bold text-[#0F172A]">Deals</h3>
                  <button
                    type="button"
                    onClick={() => navigate(`/deals?create=1&account=${account.id}`)}
                    className="h-7 px-3 rounded border border-[#93C5FD] bg-white hover:bg-[#EFF6FF] text-[#1262E0] text-[12px] font-medium"
                  >
                    New Deal
                  </button>
                </div>
                <div className="p-4">
                  {relDeals.length === 0 ? (
                    <div className="text-center py-4 text-[12.5px] text-[#64748B]">No records found</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[12.5px]">
                        <thead>
                          <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                            <th className="py-2 px-3 font-medium">Deal Name</th>
                            <th className="py-2 px-3 font-medium">Amount</th>
                            <th className="py-2 px-3 font-medium">Stage</th>
                            <th className="py-2 px-3 font-medium">Probability (%)</th>
                            <th className="py-2 px-3 font-medium">Closing Date</th>
                            <th className="py-2 px-3 font-medium">Type</th>
                            <th className="py-2 px-3 font-medium">Deal Owner</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F1F5F9]">
                          {relDeals.map((d) => (
                            <tr key={d.id} className="hover:bg-[#F8FAFC]">
                              <td className="py-2.5 px-3 font-semibold">
                                <Link
                                  to={`/deals?open=${d.id}`}
                                  className="text-[#1262E0] hover:underline"
                                >
                                  {d.name}
                                </Link>
                              </td>
                              <td className="py-2.5 px-3 font-medium text-[#0F172A]">
                                {fmtINR(d.amount)}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="px-2 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] text-[11px] font-semibold">
                                  {d.stage}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-[#475569]">{d.probability ?? 50}</td>
                              <td className="py-2.5 px-3 text-[#475569]">{fmtDate(d.closingDate)}</td>
                              <td className="py-2.5 px-3 text-[#475569]">{d.type || 'New Business'}</td>
                              <td className="py-2.5 px-3 text-[#475569]">{userName(d.ownerId)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* 6. CONTACTS (Matches Screenshot 1: Contacts / Contact Roles sub-tabs + Contact Name | Email | Phone | Mobile | Account Name) */}
              <div
                id="account-related-section-contacts"
                className="bg-white rounded-md border border-[#DCE3EE] shadow-2xs overflow-hidden scroll-mt-28"
              >
                <div className="px-5 py-3 border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-4">
                    {['Contacts', 'Contact Roles'].map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setContactsSubTab(tab)}
                        className={`text-[13px] font-bold pb-1 border-b-2 transition-colors ${
                          contactsSubTab === tab
                            ? 'border-[#1262E0] text-[#0F172A]'
                            : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/contacts?create=1&account=${account.id}`)}
                      className="h-7 px-3 rounded border border-[#93C5FD] bg-white hover:bg-[#EFF6FF] text-[#1262E0] text-[12px] font-medium"
                    >
                      New Contact
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  {relContacts.length === 0 ? (
                    <div className="text-center py-4 text-[12.5px] text-[#64748B]">No records found</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[12.5px]">
                        <thead>
                          <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                            <th className="py-2 px-3 font-medium">Contact Name</th>
                            <th className="py-2 px-3 font-medium">Email</th>
                            <th className="py-2 px-3 font-medium">Phone</th>
                            <th className="py-2 px-3 font-medium">Mobile</th>
                            <th className="py-2 px-3 font-medium">Account Name</th>
                            {contactsSubTab === 'Contact Roles' && (
                              <th className="py-2 px-3 font-medium">Role</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F1F5F9]">
                          {relContacts.map((c) => (
                            <tr key={c.id} className="hover:bg-[#F8FAFC]">
                              <td className="py-2.5 px-3 font-semibold">
                                <Link
                                  to={`/contacts/${c.id}`}
                                  className="text-[#1262E0] hover:underline"
                                >
                                  {c.name}
                                </Link>
                              </td>
                              <td className="py-2.5 px-3 text-[#475569]">{c.email || '—'}</td>
                              <td className="py-2.5 px-3 text-[#475569]">
                                {c.phone ? (
                                  <span className="inline-flex items-center gap-1.5">
                                    <span>{c.phone}</span>
                                    <a
                                      href={`tel:${String(c.phone).replace(/\s/g, '')}`}
                                      className="w-4 h-4 rounded-full bg-[#10B981] text-white inline-flex items-center justify-center"
                                    >
                                      <Phone size={9} className="fill-current" />
                                    </a>
                                  </span>
                                ) : (
                                  '—'
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-[#475569]">
                                {c.mobile || c.phone ? (
                                  <span className="inline-flex items-center gap-1.5">
                                    <span>{c.mobile || c.phone}</span>
                                    <a
                                      href={`tel:${String(c.mobile || c.phone).replace(/\s/g, '')}`}
                                      className="w-4 h-4 rounded-full bg-[#10B981] text-white inline-flex items-center justify-center"
                                    >
                                      <Phone size={9} className="fill-current" />
                                    </a>
                                  </span>
                                ) : (
                                  '—'
                                )}
                              </td>
                              <td className="py-2.5 px-3">
                                <Link
                                  to={`/accounts/${account.id}`}
                                  className="text-[#1262E0] hover:underline font-medium"
                                >
                                  {account.name}
                                </Link>
                              </td>
                              {contactsSubTab === 'Contact Roles' && (
                                <td className="py-2.5 px-3 text-[#475569]">{c.designation || 'Decision Maker'}</td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* 7. OPEN ACTIVITIES */}
              <div
                id="account-related-section-openActivities"
                className="bg-white rounded-md border border-[#DCE3EE] shadow-2xs overflow-hidden scroll-mt-28"
              >
                <div className="px-5 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
                  <h3 className="text-[13.5px] font-bold text-[#0F172A]">Open Activities</h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setNewTaskModalOpen(true)}
                      className="h-7 px-3 rounded border border-[#93C5FD] bg-white hover:bg-[#EFF6FF] text-[#1262E0] text-[12px] font-medium inline-flex items-center gap-1"
                    >
                      <span>+ Add New</span>
                      <ChevronDown size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/calls?create=1&account=${account.id}`)}
                      className="h-7 px-3 rounded border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#334155] text-[12px] font-medium"
                    >
                      Log a Call
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  {openActivitiesCount === 0 ? (
                    <div className="text-center py-4 text-[12.5px] text-[#64748B]">No records found</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[12.5px]">
                        <thead>
                          <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                            <th className="py-2 px-3 font-medium">Activity Subject</th>
                            <th className="py-2 px-3 font-medium">Type</th>
                            <th className="py-2 px-3 font-medium">Due / Scheduled Date</th>
                            <th className="py-2 px-3 font-medium">Status</th>
                            <th className="py-2 px-3 font-medium">Owner</th>
                            <th className="py-2 px-3 font-medium text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F1F5F9]">
                          {openTasks.map((t) => (
                            <tr key={t.id} className="hover:bg-[#F8FAFC]">
                              <td className="py-2 px-3 font-medium text-[#0F172A]">{t.title || t.subject}</td>
                              <td className="py-2 px-3 text-[#475569]">Task</td>
                              <td className="py-2 px-3 text-[#475569]">{fmtDate(t.due || t.dueDate)}</td>
                              <td className="py-2 px-3">
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FEF3C7] text-[#B45309]">
                                  {t.status || 'In Progress'}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-[#475569]">{userName(t.ownerId || account.ownerId)}</td>
                              <td className="py-2 px-3 text-right">
                                {t.id?.startsWith('t') && updateTask && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      updateTask(t.id, { completed: true, status: 'Completed' });
                                      toast.success('Task marked Completed');
                                    }}
                                    className="text-[11.5px] text-[#1262E0] hover:underline font-medium"
                                  >
                                    Complete
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                          {openCalls.map((c) => (
                            <tr key={c.id} className="hover:bg-[#F8FAFC]">
                              <td className="py-2 px-3 font-medium">
                                <Link to={`/calls?open=${c.id}`} className="text-[#1262E0] hover:underline">
                                  {c.subject}
                                </Link>
                              </td>
                              <td className="py-2 px-3 text-[#475569]">Call ({c.type})</td>
                              <td className="py-2 px-3 text-[#475569]">{fmtDate(String(c.dateTime || '').slice(0, 10))}</td>
                              <td className="py-2 px-3">
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#EFF6FF] text-[#1262E0]">
                                  {c.status}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-[#475569]">{userName(c.ownerId)}</td>
                              <td className="py-2 px-3 text-right">
                                <Link to={`/calls?open=${c.id}`} className="text-[11.5px] text-[#1262E0] hover:underline">
                                  Open
                                </Link>
                              </td>
                            </tr>
                          ))}
                          {openMeetings.map((m) => (
                            <tr key={m.id} className="hover:bg-[#F8FAFC]">
                              <td className="py-2 px-3 font-medium text-[#0F172A]">{m.title}</td>
                              <td className="py-2 px-3 text-[#475569]">Meeting</td>
                              <td className="py-2 px-3 text-[#475569]">{fmtDate(m.meetingDate || m.createdDate)}</td>
                              <td className="py-2 px-3">
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#EFF6FF] text-[#1262E0]">
                                  {m.status || 'Scheduled'}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-[#475569]">{userName(m.ownerId || account.ownerId)}</td>
                              <td className="py-2 px-3 text-right text-[#64748B]">—</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* 8. CLOSED ACTIVITIES */}
              <div
                id="account-related-section-closedActivities"
                className="bg-white rounded-md border border-[#DCE3EE] shadow-2xs overflow-hidden scroll-mt-28"
              >
                <div className="px-5 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
                  <h3 className="text-[13.5px] font-bold text-[#0F172A]">Closed Activities</h3>
                </div>
                <div className="p-4">
                  {closedActivitiesCount === 0 ? (
                    <div className="text-center py-4 text-[12.5px] text-[#64748B]">No records found</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[12.5px]">
                        <thead>
                          <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                            <th className="py-2 px-3 font-medium">Activity Subject</th>
                            <th className="py-2 px-3 font-medium">Type</th>
                            <th className="py-2 px-3 font-medium">Date</th>
                            <th className="py-2 px-3 font-medium">Status</th>
                            <th className="py-2 px-3 font-medium">Owner</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F1F5F9]">
                          {closedCalls.map((c) => (
                            <tr key={c.id} className="hover:bg-[#F8FAFC]">
                              <td className="py-2 px-3 font-medium">
                                <Link to={`/calls?open=${c.id}`} className="text-[#1262E0] hover:underline">
                                  {c.subject}
                                </Link>
                              </td>
                              <td className="py-2 px-3 text-[#475569]">Call ({c.type})</td>
                              <td className="py-2 px-3 text-[#475569]">{fmtDate(String(c.dateTime || '').slice(0, 10))}</td>
                              <td className="py-2 px-3">
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF5] text-[#059669]">
                                  {c.status}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-[#475569]">{userName(c.ownerId)}</td>
                            </tr>
                          ))}
                          {closedTasks.map((t) => (
                            <tr key={t.id} className="hover:bg-[#F8FAFC]">
                              <td className="py-2 px-3 font-medium text-[#0F172A]">{t.title || t.subject}</td>
                              <td className="py-2 px-3 text-[#475569]">Task</td>
                              <td className="py-2 px-3 text-[#475569]">{fmtDate(t.due || t.dueDate || t.createdDate)}</td>
                              <td className="py-2 px-3">
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF5] text-[#059669]">
                                  Completed
                                </span>
                              </td>
                              <td className="py-2 px-3 text-[#475569]">{userName(t.ownerId || account.ownerId)}</td>
                            </tr>
                          ))}
                          {closedMeetings.map((m) => (
                            <tr key={m.id} className="hover:bg-[#F8FAFC]">
                              <td className="py-2 px-3 font-medium text-[#0F172A]">{m.title}</td>
                              <td className="py-2 px-3 text-[#475569]">Meeting</td>
                              <td className="py-2 px-3 text-[#475569]">{fmtDate(m.meetingDate || m.createdDate)}</td>
                              <td className="py-2 px-3">
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF5] text-[#059669]">
                                  {m.status}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-[#475569]">{userName(m.ownerId || account.ownerId)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* 9. EMAILS (Matches Screenshot 1: Mails / Drafts / Scheduled tabs + Compose Email) */}
              <div
                id="account-related-section-emails"
                className="bg-white rounded-md border border-[#DCE3EE] shadow-2xs overflow-hidden scroll-mt-28"
              >
                <div className="px-5 py-3 border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-[13.5px] font-bold text-[#0F172A]">Emails</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setComposeData({
                        to: account.emailId || account.email || primaryContact?.email || '',
                        subject: `Follow-up with ${account.name}`,
                        body: `Hi ${primaryContact?.firstName || account.clientName || account.name} team,\n\nFollowing up regarding our recent discussion.\n\nBest regards,\n${userName(account.ownerId)}`,
                      });
                      setComposeOpen(true);
                    }}
                    className="h-7 px-3 rounded border border-[#93C5FD] bg-white hover:bg-[#EFF6FF] text-[#1262E0] text-[12px] font-medium"
                  >
                    Compose Email
                  </button>
                </div>

                <div className="px-5 pt-2 border-b border-[#E2E8F0] flex items-center justify-between gap-2 text-[12px]">
                  <div className="flex items-center gap-5">
                    {['Mails', 'Drafts', 'Scheduled'].map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setEmailSubTab(tab)}
                        className={`pb-2 border-b-2 font-medium transition-colors ${
                          emailSubTab === tab
                            ? 'border-[#1262E0] text-[#1262E0] font-semibold'
                            : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4">
                  {emailSubTab !== 'Mails' || relEmails.length === 0 ? (
                    <div className="text-center py-4 text-[12.5px] text-[#64748B]">No records found</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[12.5px]">
                        <thead>
                          <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                            <th className="py-2 px-3 font-medium">Subject</th>
                            <th className="py-2 px-3 font-medium">To</th>
                            <th className="py-2 px-3 font-medium">Direction</th>
                            <th className="py-2 px-3 font-medium">Status</th>
                            <th className="py-2 px-3 font-medium">Sent By</th>
                            <th className="py-2 px-3 font-medium">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F1F5F9]">
                          {relEmails.map((em) => (
                            <tr key={em.id} className="hover:bg-[#F8FAFC]">
                              <td className="py-2 px-3 font-medium text-[#0F172A]">{em.subject}</td>
                              <td className="py-2 px-3 text-[#475569]">{em.to || account.emailId || '—'}</td>
                              <td className="py-2 px-3 text-[#475569]">{em.direction || 'Sent'}</td>
                              <td className="py-2 px-3">
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#EFF6FF] text-[#1262E0]">
                                  {em.status || 'Sent'}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-[#475569]">{userName(em.ownerId || account.ownerId)}</td>
                              <td className="py-2 px-3 text-[#64748B]">{fmtDate(em.createdDate)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* 10. PRODUCTS */}
              <div
                id="account-related-section-products"
                className="bg-white rounded-md border border-[#DCE3EE] shadow-2xs overflow-hidden scroll-mt-28"
              >
                <div className="px-5 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
                  <h3 className="text-[13.5px] font-bold text-[#0F172A]">Products</h3>
                  <button
                    type="button"
                    onClick={() =>
                      setQuickAddModal({
                        moduleKey: 'accountProducts',
                        title: 'Add Product to Account',
                        label: 'Product Name',
                        value: 'Honey One CRM Enterprise Suite',
                        amount: '1250000',
                      })
                    }
                    className="h-7 px-3 rounded border border-[#93C5FD] bg-white hover:bg-[#EFF6FF] text-[#1262E0] text-[12px] font-medium"
                  >
                    Add Products
                  </button>
                </div>
                <div className="p-4">
                  {relProducts.length === 0 ? (
                    <div className="text-center py-4 text-[12.5px] text-[#64748B]">No records found</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[12.5px]">
                        <thead>
                          <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                            <th className="py-2 px-3 font-medium">Product Name</th>
                            <th className="py-2 px-3 font-medium">SKU</th>
                            <th className="py-2 px-3 font-medium">Quantity</th>
                            <th className="py-2 px-3 font-medium">Amount</th>
                            <th className="py-2 px-3 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F1F5F9]">
                          {relProducts.map((p) => (
                            <tr key={p.id} className="hover:bg-[#F8FAFC]">
                              <td className="py-2 px-3 font-medium text-[#0F172A]">{p.productName || p.name}</td>
                              <td className="py-2 px-3 font-mono text-[#475569]">{p.sku || 'HO-CRM'}</td>
                              <td className="py-2 px-3 text-[#475569]">{p.quantity || 1}</td>
                              <td className="py-2 px-3 text-[#0F172A] font-medium">{p.amount ? fmtINR(p.amount) : '—'}</td>
                              <td className="py-2 px-3">
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF5] text-[#059669]">
                                  {p.status || 'Active'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* 11. CASES */}
              <div
                id="account-related-section-cases"
                className="bg-white rounded-md border border-[#DCE3EE] shadow-2xs overflow-hidden scroll-mt-28"
              >
                <div className="px-5 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
                  <h3 className="text-[13.5px] font-bold text-[#0F172A]">Cases</h3>
                  <button
                    type="button"
                    onClick={() =>
                      setQuickAddModal({
                        moduleKey: 'cases',
                        title: 'Log Support Case',
                        label: 'Case Subject',
                        value: '',
                      })
                    }
                    className="h-7 px-3 rounded border border-[#93C5FD] bg-white hover:bg-[#EFF6FF] text-[#1262E0] text-[12px] font-medium"
                  >
                    + Add Case
                  </button>
                </div>
                <div className="p-4">
                  {relCases.length === 0 ? (
                    <div className="text-center py-4 text-[12.5px] text-[#64748B]">No records found</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[12.5px]">
                        <thead>
                          <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                            <th className="py-2 px-3 font-medium">Case Number</th>
                            <th className="py-2 px-3 font-medium">Subject</th>
                            <th className="py-2 px-3 font-medium">Priority</th>
                            <th className="py-2 px-3 font-medium">Status</th>
                            <th className="py-2 px-3 font-medium">Owner</th>
                            <th className="py-2 px-3 font-medium">Created Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F1F5F9]">
                          {relCases.map((cs) => (
                            <tr key={cs.id} className="hover:bg-[#F8FAFC]">
                              <td className="py-2 px-3 font-mono text-[#1262E0] font-medium">{cs.caseNumber || cs.id}</td>
                              <td className="py-2 px-3 font-medium text-[#0F172A]">{cs.subject || cs.title}</td>
                              <td className="py-2 px-3 text-[#475569]">{cs.priority || 'Medium'}</td>
                              <td className="py-2 px-3">
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FEF3C7] text-[#B45309]">
                                  {cs.status || 'Open'}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-[#475569]">{userName(cs.ownerId || account.ownerId)}</td>
                              <td className="py-2 px-3 text-[#64748B]">{fmtDate(cs.createdDate)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* 12. QUOTES */}
              <div
                id="account-related-section-quotes"
                className="bg-white rounded-md border border-[#DCE3EE] shadow-2xs overflow-hidden scroll-mt-28"
              >
                <div className="px-5 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
                  <h3 className="text-[13.5px] font-bold text-[#0F172A]">Quotes</h3>
                  <button
                    type="button"
                    onClick={() =>
                      setQuickAddModal({
                        moduleKey: 'quotes',
                        title: 'Create Quote for Account',
                        label: 'Quote Subject',
                        value: `${account.name} — Commercial Proposal`,
                        amount: '1500000',
                      })
                    }
                    className="h-7 px-3 rounded border border-[#93C5FD] bg-white hover:bg-[#EFF6FF] text-[#1262E0] text-[12px] font-medium"
                  >
                    New Quote
                  </button>
                </div>
                <div className="p-4">
                  {relQuotes.length === 0 ? (
                    <div className="space-y-2 py-2">
                      <div className="text-[12.5px] text-[#64748B]">No records found</div>
                      <button
                        type="button"
                        onClick={() =>
                          setQuickAddModal({
                            moduleKey: 'quotes',
                            title: 'Create Quote for Account',
                            label: 'Quote Subject',
                            value: `${account.name} — Commercial Proposal`,
                            amount: '1500000',
                          })
                        }
                        className="h-7 px-3 rounded border border-[#93C5FD] bg-white hover:bg-[#EFF6FF] text-[#1262E0] text-[12px] font-medium"
                      >
                        New Quote
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[12.5px]">
                        <thead>
                          <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                            <th className="py-2 px-3 font-medium">Quote Number</th>
                            <th className="py-2 px-3 font-medium">Subject</th>
                            <th className="py-2 px-3 font-medium">Amount</th>
                            <th className="py-2 px-3 font-medium">Status</th>
                            <th className="py-2 px-3 font-medium">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F1F5F9]">
                          {relQuotes.map((q) => (
                            <tr key={q.id} className="hover:bg-[#F8FAFC]">
                              <td className="py-2 px-3 font-mono font-medium">
                                <Link to={`/zoho-finance?open=${q.id}`} className="text-[#1262E0] hover:underline">
                                  {q.quoteNumber || q.id}
                                </Link>
                              </td>
                              <td className="py-2 px-3 font-medium text-[#0F172A]">{q.subject || q.title}</td>
                              <td className="py-2 px-3 font-medium text-[#0F172A]">{fmtINR(q.amount || 0)}</td>
                              <td className="py-2 px-3">
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#EFF6FF] text-[#1262E0]">
                                  {q.status || 'Delivered'}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-[#64748B]">{fmtDate(q.createdDate)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* 13. SALES ORDERS */}
              <div
                id="account-related-section-salesOrders"
                className="bg-white rounded-md border border-[#DCE3EE] shadow-2xs overflow-hidden scroll-mt-28"
              >
                <div className="px-5 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
                  <h3 className="text-[13.5px] font-bold text-[#0F172A]">Sales Orders</h3>
                  <button
                    type="button"
                    onClick={() =>
                      setQuickAddModal({
                        moduleKey: 'salesOrders',
                        title: 'Create Sales Order',
                        label: 'Sales Order Subject',
                        value: `${account.name} — Subscription Order`,
                        amount: '1500000',
                      })
                    }
                    className="h-7 px-3 rounded border border-[#93C5FD] bg-white hover:bg-[#EFF6FF] text-[#1262E0] text-[12px] font-medium"
                  >
                    New Sales Order
                  </button>
                </div>
                <div className="p-4">
                  {relSalesOrders.length === 0 ? (
                    <div className="space-y-2 py-2">
                      <div className="text-[12.5px] text-[#64748B]">No records found</div>
                      <button
                        type="button"
                        onClick={() =>
                          setQuickAddModal({
                            moduleKey: 'salesOrders',
                            title: 'Create Sales Order',
                            label: 'Sales Order Subject',
                            value: `${account.name} — Subscription Order`,
                            amount: '1500000',
                          })
                        }
                        className="h-7 px-3 rounded border border-[#93C5FD] bg-white hover:bg-[#EFF6FF] text-[#1262E0] text-[12px] font-medium"
                      >
                        New Sales Order
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[12.5px]">
                        <thead>
                          <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                            <th className="py-2 px-3 font-medium">SO Number</th>
                            <th className="py-2 px-3 font-medium">Subject</th>
                            <th className="py-2 px-3 font-medium">Amount</th>
                            <th className="py-2 px-3 font-medium">Status</th>
                            <th className="py-2 px-3 font-medium">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F1F5F9]">
                          {relSalesOrders.map((so) => (
                            <tr key={so.id} className="hover:bg-[#F8FAFC]">
                              <td className="py-2 px-3 font-mono font-medium">
                                <Link to={`/zoho-finance?open=${so.id}`} className="text-[#1262E0] hover:underline">
                                  {so.soNumber || so.id}
                                </Link>
                              </td>
                              <td className="py-2 px-3 font-medium text-[#0F172A]">{so.subject || so.title}</td>
                              <td className="py-2 px-3 font-medium text-[#0F172A]">{fmtINR(so.amount || 0)}</td>
                              <td className="py-2 px-3">
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF5] text-[#059669]">
                                  {so.status || 'Approved'}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-[#64748B]">{fmtDate(so.createdDate)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* 14. PURCHASE ORDERS */}
              <div
                id="account-related-section-purchaseOrders"
                className="bg-white rounded-md border border-[#DCE3EE] shadow-2xs overflow-hidden scroll-mt-28"
              >
                <div className="px-5 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
                  <h3 className="text-[13.5px] font-bold text-[#0F172A]">Purchase Orders</h3>
                  <button
                    type="button"
                    onClick={() =>
                      setQuickAddModal({
                        moduleKey: 'purchaseOrders',
                        title: 'Create Purchase Order',
                        label: 'Purchase Order Subject',
                        value: `${account.name} — Procurement PO`,
                        amount: '750000',
                      })
                    }
                    className="h-7 px-3 rounded border border-[#93C5FD] bg-white hover:bg-[#EFF6FF] text-[#1262E0] text-[12px] font-medium"
                  >
                    New Purchase Order
                  </button>
                </div>
                <div className="p-4">
                  {relPurchaseOrders.length === 0 ? (
                    <div className="text-center py-4 text-[12.5px] text-[#64748B]">No records found</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[12.5px]">
                        <thead>
                          <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                            <th className="py-2 px-3 font-medium">PO Number</th>
                            <th className="py-2 px-3 font-medium">Subject</th>
                            <th className="py-2 px-3 font-medium">Amount</th>
                            <th className="py-2 px-3 font-medium">Status</th>
                            <th className="py-2 px-3 font-medium">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F1F5F9]">
                          {relPurchaseOrders.map((po) => (
                            <tr key={po.id} className="hover:bg-[#F8FAFC]">
                              <td className="py-2 px-3 font-mono font-medium">
                                <Link to={`/zoho-finance?open=${po.id}`} className="text-[#1262E0] hover:underline">
                                  {po.poNumber || po.id}
                                </Link>
                              </td>
                              <td className="py-2 px-3 font-medium text-[#0F172A]">{po.subject || po.title}</td>
                              <td className="py-2 px-3 font-medium text-[#0F172A]">{fmtINR(po.amount || 0)}</td>
                              <td className="py-2 px-3">
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#EFF6FF] text-[#1262E0]">
                                  {po.status || 'Issued'}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-[#64748B]">{fmtDate(po.createdDate)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* 15. INVOICES */}
              <div
                id="account-related-section-invoices"
                className="bg-white rounded-md border border-[#DCE3EE] shadow-2xs overflow-hidden scroll-mt-28"
              >
                <div className="px-5 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
                  <h3 className="text-[13.5px] font-bold text-[#0F172A]">Invoices</h3>
                  <button
                    type="button"
                    onClick={() => navigate(`/zoho-finance?create=1&account=${account.id}`)}
                    className="h-7 px-3 rounded border border-[#93C5FD] bg-white hover:bg-[#EFF6FF] text-[#1262E0] text-[12px] font-medium"
                  >
                    New Invoice
                  </button>
                </div>
                <div className="p-4">
                  {relInvoices.length === 0 ? (
                    <div className="space-y-2 py-2">
                      <div className="text-[12.5px] text-[#64748B]">No records found</div>
                      <button
                        type="button"
                        onClick={() => navigate(`/zoho-finance?create=1&account=${account.id}`)}
                        className="h-7 px-3 rounded border border-[#93C5FD] bg-white hover:bg-[#EFF6FF] text-[#1262E0] text-[12px] font-medium"
                      >
                        New Invoice
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[12.5px]">
                        <thead>
                          <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                            <th className="py-2 px-3 font-medium">Invoice #</th>
                            <th className="py-2 px-3 font-medium">Title</th>
                            <th className="py-2 px-3 font-medium">Total</th>
                            <th className="py-2 px-3 font-medium">Paid</th>
                            <th className="py-2 px-3 font-medium">Balance</th>
                            <th className="py-2 px-3 font-medium">Status</th>
                            <th className="py-2 px-3 font-medium">Due Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F1F5F9]">
                          {relInvoices.map((inv) => (
                            <tr key={inv.id} className="hover:bg-[#F8FAFC]">
                              <td className="py-2 px-3 font-mono font-medium">
                                <Link to={`/zoho-finance?open=${inv.id}`} className="text-[#1262E0] hover:underline">
                                  {inv.number || inv.id}
                                </Link>
                              </td>
                              <td className="py-2 px-3 font-medium text-[#0F172A]">{inv.title}</td>
                              <td className="py-2 px-3 font-medium text-[#0F172A]">{fmtINR(inv.total || inv.amount || 0)}</td>
                              <td className="py-2 px-3 text-[#16A34A]">{fmtINR(inv.paid || 0)}</td>
                              <td className="py-2 px-3 text-[#DC2626]">{fmtINR(balanceOf(inv))}</td>
                              <td className="py-2 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                    inv.status === 'Paid'
                                      ? 'bg-[#ECFDF5] text-[#059669]'
                                      : inv.status === 'Overdue'
                                      ? 'bg-[#FEF2F2] text-[#DC2626]'
                                      : 'bg-[#FEF3C7] text-[#B45309]'
                                  }`}
                                >
                                  {inv.status}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-[#64748B]">{fmtDate(inv.dueDate)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* 16. CAMPAIGNS */}
              <div
                id="account-related-section-campaigns"
                className="bg-white rounded-md border border-[#DCE3EE] shadow-2xs overflow-hidden scroll-mt-28"
              >
                <div className="px-5 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
                  <h3 className="text-[13.5px] font-bold text-[#0F172A]">Campaigns</h3>
                  <button
                    type="button"
                    onClick={() =>
                      setQuickAddModal({
                        moduleKey: 'campaigns',
                        title: 'Associate Campaign',
                        label: 'Campaign Name',
                        value: 'Zoho CRM Enterprise Summit 2026',
                      })
                    }
                    className="h-7 px-3 rounded border border-[#93C5FD] bg-white hover:bg-[#EFF6FF] text-[#1262E0] text-[12px] font-medium"
                  >
                    + Add Campaign
                  </button>
                </div>
                <div className="p-4">
                  {relCampaigns.length === 0 ? (
                    <div className="text-center py-4 text-[12.5px] text-[#64748B]">No records found</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[12.5px]">
                        <thead>
                          <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                            <th className="py-2 px-3 font-medium">Campaign Name</th>
                            <th className="py-2 px-3 font-medium">Status</th>
                            <th className="py-2 px-3 font-medium">Created Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F1F5F9]">
                          {relCampaigns.map((camp) => (
                            <tr key={camp.id} className="hover:bg-[#F8FAFC]">
                              <td className="py-2 px-3 font-medium text-[#0F172A]">{camp.campaignName || camp.title}</td>
                              <td className="py-2 px-3">
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF5] text-[#059669]">
                                  {camp.status || 'Active'}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-[#64748B]">{fmtDate(camp.createdDate)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* 17. SOCIAL */}
              <div
                id="account-related-section-social"
                className="bg-white rounded-md border border-[#DCE3EE] shadow-2xs overflow-hidden scroll-mt-28"
              >
                <div className="px-5 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
                  <h3 className="text-[13.5px] font-bold text-[#0F172A]">Social</h3>
                </div>
                <div className="p-4 text-[12.5px] text-[#64748B]">
                  {account.website ? (
                    <div className="flex items-center justify-between p-3 rounded border border-[#E2E8F0] bg-[#F8FAFC]">
                      <div className="flex items-center gap-2.5 text-[#0F172A]">
                        <Globe size={15} className="text-[#1262E0]" />
                        <div>
                          <div className="font-semibold">{account.name}</div>
                          <div className="text-[11.5px] text-[#64748B]">
                            Website: {account.website} {account.tickerSymbol ? `· Ticker: ${account.tickerSymbol}` : ''}
                          </div>
                        </div>
                      </div>
                      <a
                        href={normalizeWebsiteUrl(account.website)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[12px] text-[#1262E0] hover:underline font-medium"
                      >
                        Visit Website
                      </a>
                    </div>
                  ) : (
                    <div className="py-2">No social profiles associated with this account.</div>
                  )}
                </div>
              </div>

              {/* 18. REPORTING CONTACTS */}
              <div
                id="account-related-section-reportingContacts"
                className="bg-white rounded-md border border-[#DCE3EE] shadow-2xs overflow-hidden scroll-mt-28"
              >
                <div className="px-5 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
                  <h3 className="text-[13.5px] font-bold text-[#0F172A]">Reporting Contacts</h3>
                </div>
                <div className="p-4">
                  {relReportingContacts.length === 0 ? (
                    <div className="text-center py-4 text-[12.5px] text-[#64748B]">No records found</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[12.5px]">
                        <thead>
                          <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                            <th className="py-2 px-3 font-medium">Contact Name</th>
                            <th className="py-2 px-3 font-medium">Title</th>
                            <th className="py-2 px-3 font-medium">Department</th>
                            <th className="py-2 px-3 font-medium">Email</th>
                            <th className="py-2 px-3 font-medium">Phone</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F1F5F9]">
                          {relReportingContacts.map((rc) => (
                            <tr key={rc.id} className="hover:bg-[#F8FAFC]">
                              <td className="py-2 px-3 font-semibold">
                                <Link
                                  to={`/contacts/${rc.id}`}
                                  className="text-[#1262E0] hover:underline"
                                >
                                  {rc.name}
                                </Link>
                              </td>
                              <td className="py-2 px-3 text-[#475569]">{rc.designation || '—'}</td>
                              <td className="py-2 px-3 text-[#475569]">{rc.department || '—'}</td>
                              <td className="py-2 px-3 text-[#475569]">{rc.email}</td>
                              <td className="py-2 px-3 text-[#475569]">{rc.phone}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* 19. MEMBER ACCOUNTS */}
              <div
                id="account-related-section-memberAccounts"
                className="bg-white rounded-md border border-[#DCE3EE] shadow-2xs overflow-hidden scroll-mt-28"
              >
                <div className="px-5 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
                  <h3 className="text-[13.5px] font-bold text-[#0F172A]">Member Accounts</h3>
                  <button
                    type="button"
                    onClick={() => navigate(`/accounts/create?parent=${account.id}`)}
                    className="h-7 px-3 rounded border border-[#93C5FD] bg-white hover:bg-[#EFF6FF] text-[#1262E0] text-[12px] font-medium"
                  >
                    + Add Member Account
                  </button>
                </div>
                <div className="p-4">
                  {relMemberAccounts.length === 0 ? (
                    <div className="text-center py-4 text-[12.5px] text-[#64748B]">No records found</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[12.5px]">
                        <thead>
                          <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                            <th className="py-2 px-3 font-medium">Account Name</th>
                            <th className="py-2 px-3 font-medium">Account Site</th>
                            <th className="py-2 px-3 font-medium">Billing City</th>
                            <th className="py-2 px-3 font-medium">Annual Revenue</th>
                            <th className="py-2 px-3 font-medium">Owner</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F1F5F9]">
                          {relMemberAccounts.map((ma) => (
                            <tr key={ma.id} className="hover:bg-[#F8FAFC]">
                              <td className="py-2 px-3 font-semibold">
                                <Link
                                  to={`/accounts/${ma.id}`}
                                  onClick={() => onSelectAccount?.(ma.id)}
                                  className="text-[#1262E0] hover:underline"
                                >
                                  {ma.name}
                                </Link>
                              </td>
                              <td className="py-2 px-3 text-[#475569]">{ma.accountSite || '—'}</td>
                              <td className="py-2 px-3 text-[#475569]">{ma.billingCity || ma.location || '—'}</td>
                              <td className="py-2 px-3 font-medium text-[#0F172A]">{fmtINR(ma.annualRevenue || 0)}</td>
                              <td className="py-2 px-3 text-[#475569]">{userName(ma.ownerId)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* 20. ZOHO SIGN DOCUMENTS (Matches Screenshot 1 & 2) */}
              <div
                id="account-related-section-zohoSignDocuments"
                className="bg-white rounded-md border border-[#DCE3EE] shadow-2xs overflow-hidden scroll-mt-28"
              >
                <div className="px-5 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
                  <h3 className="text-[13.5px] font-bold text-[#0F172A]">Zoho Sign Documents</h3>
                  <button
                    type="button"
                    onClick={() =>
                      setQuickAddModal({
                        moduleKey: 'zohoSignDocuments',
                        title: 'Send Document for Zoho Sign',
                        label: 'Document Name',
                        value: `${account.name} — Master Services Agreement`,
                      })
                    }
                    className="h-7 px-3 rounded border border-[#93C5FD] bg-white hover:bg-[#EFF6FF] text-[#1262E0] text-[12px] font-medium"
                  >
                    New
                  </button>
                </div>
                <div className="p-4">
                  {relZohoSign.length === 0 ? (
                    <div className="text-center py-4 text-[12.5px] text-[#64748B]">No records found</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[12.5px]">
                        <thead>
                          <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                            <th className="py-2 px-3 font-medium">Document Name</th>
                            <th className="py-2 px-3 font-medium">Status</th>
                            <th className="py-2 px-3 font-medium">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F1F5F9]">
                          {relZohoSign.map((doc) => (
                            <tr key={doc.id} className="hover:bg-[#F8FAFC]">
                              <td className="py-2 px-3 font-medium text-[#0F172A]">{doc.documentName || doc.title}</td>
                              <td className="py-2 px-3">
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF5] text-[#059669]">
                                  {doc.signStatus || doc.status || 'Signed'}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-[#64748B]">{fmtDate(doc.createdDate)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* 21. ZOHO SURVEY (Matches Screenshot 1 & 2) */}
              <div
                id="account-related-section-zohoSurvey"
                className="bg-white rounded-md border border-[#DCE3EE] shadow-2xs overflow-hidden scroll-mt-28"
              >
                <div className="px-5 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
                  <h3 className="text-[13.5px] font-bold text-[#0F172A]">Zoho Survey</h3>
                  <button
                    type="button"
                    onClick={() =>
                      setQuickAddModal({
                        moduleKey: 'zohoSurvey',
                        title: 'Assign Customer Survey',
                        label: 'Survey Name',
                        value: 'Annual Executive CSAT & NPS Survey',
                      })
                    }
                    className="h-7 px-3 rounded border border-[#93C5FD] bg-white hover:bg-[#EFF6FF] text-[#1262E0] text-[12px] font-medium"
                  >
                    Assign
                  </button>
                </div>
                <div className="p-4">
                  {relZohoSurvey.length === 0 ? (
                    <div className="text-center py-4 text-[12.5px] text-[#64748B]">No records found</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[12.5px]">
                        <thead>
                          <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                            <th className="py-2 px-3 font-medium">Survey Name</th>
                            <th className="py-2 px-3 font-medium">Status</th>
                            <th className="py-2 px-3 font-medium">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F1F5F9]">
                          {relZohoSurvey.map((sv) => (
                            <tr key={sv.id} className="hover:bg-[#F8FAFC]">
                              <td className="py-2 px-3 font-medium text-[#0F172A]">{sv.eventName || sv.title}</td>
                              <td className="py-2 px-3">
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#EFF6FF] text-[#1262E0]">
                                  {sv.status || 'Sent'}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-[#64748B]">{fmtDate(sv.createdDate)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* =============================================================== */
            /* TAB 2: TIMELINE                                                 */
            /* =============================================================== */
            <div className="p-4 max-w-[1100px] space-y-4">
              <div className="bg-white rounded-md border border-[#DCE3EE] p-5 shadow-2xs">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <History size={16} className="text-[#1262E0]" />
                    <h2 className="text-[14px] font-bold text-[#0F172A]">
                      Account Activity & Audit Timeline — {account.name}
                    </h2>
                  </div>
                  <span className="text-[12px] text-[#64748B]">
                    Showing chronological history for ID <code className="font-mono text-[#0F172A]">{account.id}</code>
                  </span>
                </div>

                <ol className="relative border-l-2 border-[#E2E8F0] ml-3 space-y-5 py-1">
                  {/* Account Created Event */}
                  <li className="ml-5">
                    <span className="absolute -left-[7px] w-3 h-3 rounded-full bg-[#1262E0] ring-4 ring-white" />
                    <div className="text-[12.5px] font-semibold text-[#0F172A]">
                      Account Record Created
                    </div>
                    <div className="text-[11.5px] text-[#64748B]">
                      By {userName(account.createdBy || account.ownerId)} · {fmtDate(account.createdTime || account.createdOn)}
                    </div>
                  </li>

                  {/* Deals Events */}
                  {relDeals.map((d) => (
                    <li key={d.id} className="ml-5">
                      <span className="absolute -left-[7px] w-3 h-3 rounded-full bg-[#10B981] ring-4 ring-white" />
                      <div className="text-[12.5px] font-semibold text-[#0F172A]">
                        Deal Associated:{' '}
                        <Link to={`/deals?open=${d.id}`} className="text-[#1262E0] hover:underline">
                          {d.name}
                        </Link>{' '}
                        ({fmtINR(d.amount)})
                      </div>
                      <div className="text-[11.5px] text-[#64748B]">
                        Stage: {d.stage} · Closing {fmtDate(d.closingDate)}
                      </div>
                    </li>
                  ))}

                  {/* Contacts Events */}
                  {relContacts.map((c) => (
                    <li key={c.id} className="ml-5">
                      <span className="absolute -left-[7px] w-3 h-3 rounded-full bg-[#3B82F6] ring-4 ring-white" />
                      <div className="text-[12.5px] font-semibold text-[#0F172A]">
                        Contact Linked:{' '}
                        <Link to={`/contacts/${c.id}`} className="text-[#1262E0] hover:underline">
                          {c.name}
                        </Link>
                      </div>
                      <div className="text-[11.5px] text-[#64748B]">
                        {c.designation || 'Contact'} · {c.email}
                      </div>
                    </li>
                  ))}

                  {/* Calls Events */}
                  {relCalls.map((c) => (
                    <li key={c.id} className="ml-5">
                      <span className="absolute -left-[7px] w-3 h-3 rounded-full bg-[#6366F1] ring-4 ring-white" />
                      <div className="text-[12.5px] font-semibold text-[#0F172A]">
                        {c.type} Call:{' '}
                        <Link to={`/calls?open=${c.id}`} className="text-[#1262E0] hover:underline">
                          {c.subject}
                        </Link>
                      </div>
                      <div className="text-[11.5px] text-[#64748B]">
                        Status: {c.status} · {fmtDate(String(c.dateTime || '').slice(0, 10))}
                      </div>
                    </li>
                  ))}

                  {/* Emails Events */}
                  {relEmails.map((em) => (
                    <li key={em.id} className="ml-5">
                      <span className="absolute -left-[7px] w-3 h-3 rounded-full bg-[#F59E0B] ring-4 ring-white" />
                      <div className="text-[12.5px] font-semibold text-[#0F172A]">
                        Email ({em.direction || 'Sent'}): {em.subject}
                      </div>
                      <div className="text-[11.5px] text-[#64748B]">
                        Status: {em.status} · {fmtDate(em.createdDate)}
                      </div>
                    </li>
                  ))}

                  {/* Notes Events */}
                  {relNotes.map((n) => (
                    <li key={n.id} className="ml-5">
                      <span className="absolute -left-[7px] w-3 h-3 rounded-full bg-[#8B5CF6] ring-4 ring-white" />
                      <div className="text-[12.5px] font-semibold text-[#0F172A]">
                        Note Added: {n.title || 'Note'}
                      </div>
                      <div className="text-[12px] text-[#334155] mt-0.5">{n.content}</div>
                      <div className="text-[11px] text-[#64748B] mt-0.5">{fmtDate(n.createdDate)}</div>
                    </li>
                  ))}

                  {/* Latest Modification Event */}
                  <li className="ml-5">
                    <span className="absolute -left-[7px] w-3 h-3 rounded-full bg-[#0EA5E9] ring-4 ring-white" />
                    <div className="text-[12.5px] font-semibold text-[#0F172A]">
                      Last Modified
                    </div>
                    <div className="text-[11.5px] text-[#64748B]">
                      By {userName(account.modifiedBy || account.ownerId)} · {fmtDate(account.modifiedTime || account.lastActivityTime)}
                    </div>
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================================================================= */}
      {/* 4. EDIT ACCOUNT MODAL (Prefilled with this exact account's data)  */}
      {/* ================================================================= */}
      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Edit Account — ${account.name}`}
        subtitle="Update account details. Saving immediately updates this account and refreshes the detail page."
        size="lg"
      >
        {editForm && (
          <form onSubmit={handleSaveEdit} className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
            {/* Account Information */}
            <div>
              <h3 className="text-[13px] font-bold text-[#0F172A] uppercase tracking-wider mb-3 border-b border-[#E2E8F0] pb-1">
                Account Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-[#475569] mb-1">
                    Account Name <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => {
                      setEditForm((p) => ({ ...p, name: e.target.value }));
                      setEditErrors((p) => ({ ...p, name: '' }));
                    }}
                    className="input h-9 text-[13px]"
                  />
                  {editErrors.name && (
                    <p className="text-[11.5px] text-[#DC2626] mt-0.5">{editErrors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#475569] mb-1">Client Name</label>
                  <input
                    type="text"
                    value={editForm.clientName}
                    onChange={(e) => setEditForm((p) => ({ ...p, clientName: e.target.value }))}
                    className="input h-9 text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#475569] mb-1">Account Owner</label>
                  <select
                    value={editForm.ownerId}
                    onChange={(e) => setEditForm((p) => ({ ...p, ownerId: e.target.value }))}
                    className="input h-9 text-[13px]"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#475569] mb-1">Email ID</label>
                  <input
                    type="email"
                    value={editForm.emailId}
                    onChange={(e) => setEditForm((p) => ({ ...p, emailId: e.target.value }))}
                    className="input h-9 text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#475569] mb-1">Mobile</label>
                  <input
                    type="tel"
                    value={editForm.mobile}
                    onChange={(e) => setEditForm((p) => ({ ...p, mobile: e.target.value }))}
                    className="input h-9 text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#475569] mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                    className="input h-9 text-[13px]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#475569] mb-1">Account Site</label>
                  <input
                    type="text"
                    value={editForm.accountSite}
                    onChange={(e) => setEditForm((p) => ({ ...p, accountSite: e.target.value }))}
                    className="input h-9 text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#475569] mb-1">Account Number</label>
                  <input
                    type="text"
                    value={editForm.accountNumber}
                    onChange={(e) => setEditForm((p) => ({ ...p, accountNumber: e.target.value }))}
                    className="input h-9 text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#475569] mb-1">Parent Account</label>
                  <select
                    value={editForm.parentAccountId}
                    onChange={(e) => {
                      setEditForm((p) => ({ ...p, parentAccountId: e.target.value }));
                      setEditErrors((p) => ({ ...p, parentAccountId: '' }));
                    }}
                    className="input h-9 text-[13px]"
                  >
                    <option value="">None</option>
                    {getSelectableParentAccounts(account.id, accounts).map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                  {editErrors.parentAccountId && (
                    <p className="text-[11.5px] text-[#DC2626] mt-0.5">{editErrors.parentAccountId}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#475569] mb-1">GST Number/GSTIN</label>
                  <input
                    type="text"
                    value={editForm.gstin}
                    onChange={(e) => setEditForm((p) => ({ ...p, gstin: e.target.value.toUpperCase() }))}
                    className="input h-9 text-[13px] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#475569] mb-1">GST State</label>
                  <select
                    value={editForm.gstState}
                    onChange={(e) => setEditForm((p) => ({ ...p, gstState: e.target.value }))}
                    className="input h-9 text-[13px]"
                  >
                    {INDIAN_GST_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#475569] mb-1">GST Treatment</label>
                  <select
                    value={editForm.gstTreatment}
                    onChange={(e) => setEditForm((p) => ({ ...p, gstTreatment: e.target.value }))}
                    className="input h-9 text-[13px]"
                  >
                    {GST_TREATMENTS.map((tr) => (
                      <option key={tr} value={tr}>
                        {tr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#475569] mb-1">Legal Name</label>
                  <input
                    type="text"
                    value={editForm.legalName}
                    onChange={(e) => setEditForm((p) => ({ ...p, legalName: e.target.value }))}
                    className="input h-9 text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#475569] mb-1">Trade name</label>
                  <input
                    type="text"
                    value={editForm.tradeName}
                    onChange={(e) => setEditForm((p) => ({ ...p, tradeName: e.target.value }))}
                    className="input h-9 text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#475569] mb-1">Website</label>
                  <input
                    type="text"
                    value={editForm.website}
                    onChange={(e) => setEditForm((p) => ({ ...p, website: e.target.value }))}
                    className="input h-9 text-[13px]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#475569] mb-1">Account Type</label>
                  <select
                    value={editForm.type}
                    onChange={(e) => setEditForm((p) => ({ ...p, type: e.target.value }))}
                    className="input h-9 text-[13px]"
                  >
                    {ACCOUNT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#475569] mb-1">Industry</label>
                  <select
                    value={editForm.industry}
                    onChange={(e) => setEditForm((p) => ({ ...p, industry: e.target.value }))}
                    className="input h-9 text-[13px]"
                  >
                    {INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind}>
                        {ind}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#475569] mb-1">Annual Revenue (₹)</label>
                  <input
                    type="number"
                    value={editForm.annualRevenue}
                    onChange={(e) => setEditForm((p) => ({ ...p, annualRevenue: e.target.value }))}
                    className="input h-9 text-[13px]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#475569] mb-1">Ownership</label>
                  <select
                    value={editForm.ownership}
                    onChange={(e) => setEditForm((p) => ({ ...p, ownership: e.target.value }))}
                    className="input h-9 text-[13px]"
                  >
                    {ACCOUNT_OWNERSHIPS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#475569] mb-1">Rating</label>
                  <select
                    value={editForm.rating}
                    onChange={(e) => setEditForm((p) => ({ ...p, rating: e.target.value }))}
                    className="input h-9 text-[13px]"
                  >
                    {ACCOUNT_RATINGS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#475569] mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={editForm.tagInput}
                    onChange={(e) => setEditForm((p) => ({ ...p, tagInput: e.target.value }))}
                    className="input h-9 text-[13px]"
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div>
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-1 mb-3">
                <h3 className="text-[13px] font-bold text-[#0F172A] uppercase tracking-wider">
                  Address Information
                </h3>
                <button
                  type="button"
                  onClick={handleCopyBillingToShipping}
                  className="text-[11.5px] font-medium text-[#1262E0] hover:underline"
                >
                  Copy Billing to Shipping
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2.5">
                  <div className="text-[12px] font-semibold text-[#334155]">Billing Address</div>
                  <input
                    type="text"
                    placeholder="Billing Street"
                    value={editForm.billingStreet}
                    onChange={(e) => setEditForm((p) => ({ ...p, billingStreet: e.target.value }))}
                    className="input h-8 text-[12.5px]"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Billing City"
                      value={editForm.billingCity}
                      onChange={(e) => setEditForm((p) => ({ ...p, billingCity: e.target.value }))}
                      className="input h-8 text-[12.5px]"
                    />
                    <input
                      type="text"
                      placeholder="Billing State"
                      value={editForm.billingState}
                      onChange={(e) => setEditForm((p) => ({ ...p, billingState: e.target.value }))}
                      className="input h-8 text-[12.5px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Billing Code"
                      value={editForm.billingZip}
                      onChange={(e) => setEditForm((p) => ({ ...p, billingZip: e.target.value }))}
                      className="input h-8 text-[12.5px]"
                    />
                    <input
                      type="text"
                      placeholder="Billing Country"
                      value={editForm.billingCountry}
                      onChange={(e) => setEditForm((p) => ({ ...p, billingCountry: e.target.value }))}
                      className="input h-8 text-[12.5px]"
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="text-[12px] font-semibold text-[#334155]">Shipping Address</div>
                  <input
                    type="text"
                    placeholder="Shipping Street"
                    value={editForm.shippingStreet}
                    onChange={(e) => setEditForm((p) => ({ ...p, shippingStreet: e.target.value }))}
                    className="input h-8 text-[12.5px]"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Shipping City"
                      value={editForm.shippingCity}
                      onChange={(e) => setEditForm((p) => ({ ...p, shippingCity: e.target.value }))}
                      className="input h-8 text-[12.5px]"
                    />
                    <input
                      type="text"
                      placeholder="Shipping State"
                      value={editForm.shippingState}
                      onChange={(e) => setEditForm((p) => ({ ...p, shippingState: e.target.value }))}
                      className="input h-8 text-[12.5px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Shipping Code"
                      value={editForm.shippingZip}
                      onChange={(e) => setEditForm((p) => ({ ...p, shippingZip: e.target.value }))}
                      className="input h-8 text-[12.5px]"
                    />
                    <input
                      type="text"
                      placeholder="Shipping Country"
                      value={editForm.shippingCountry}
                      onChange={(e) => setEditForm((p) => ({ ...p, shippingCountry: e.target.value }))}
                      className="input h-8 text-[12.5px]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Description Information */}
            <div>
              <h3 className="text-[13px] font-bold text-[#0F172A] uppercase tracking-wider mb-2 border-b border-[#E2E8F0] pb-1">
                Description Information
              </h3>
              <textarea
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Account notes or summary..."
                className="input text-[12.5px] py-2 w-full"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Save Changes
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ================================================================= */}
      {/* 5. SEND EMAIL MODAL                                               */}
      {/* ================================================================= */}
      <Modal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        title={`Send Email to ${account.name}`}
        subtitle={composeData.to || account.emailId || account.email || 'Account communication'}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addAccountRelatedRecord('emails', {
              accountId: account.id,
              to: composeData.to,
              subject: composeData.subject || `Follow-up with ${account.name}`,
              direction: 'Sent',
              status: 'Sent',
              ownerId: account.ownerId || 'u1',
            });
            updateRecord('accounts', account.id, { lastActivityTime: todayISO() });
            toast.success(`Email sent to ${account.name}`);
            setComposeOpen(false);
          }}
          className="space-y-3"
        >
          <div>
            <label className="block text-[12px] font-medium text-[#475569] mb-1">To</label>
            <input
              type="text"
              value={composeData.to}
              onChange={(e) => setComposeData((p) => ({ ...p, to: e.target.value }))}
              className="input h-9 text-[13px]"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-[#475569] mb-1">Subject</label>
            <input
              type="text"
              required
              value={composeData.subject}
              onChange={(e) => setComposeData((p) => ({ ...p, subject: e.target.value }))}
              className="input h-9 text-[13px]"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-[#475569] mb-1">Message Body</label>
            <textarea
              rows={5}
              required
              value={composeData.body}
              onChange={(e) => setComposeData((p) => ({ ...p, body: e.target.value }))}
              className="input text-[13px] py-2 w-full"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setComposeOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary inline-flex items-center gap-1.5">
              <Send size={13.5} /> Send Email
            </button>
          </div>
        </form>
      </Modal>

      {/* ================================================================= */}
      {/* 6. WHATSAPP CHAT MODAL                                            */}
      {/* ================================================================= */}
      <Modal
        open={whatsappModalOpen}
        onClose={() => setWhatsappModalOpen(false)}
        title={`WhatsApp Chat — ${account.name}`}
        subtitle={phoneOrMobile ? `Recipient: ${phoneOrMobile}` : 'Log or launch WhatsApp message for this account'}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!whatsappMessage.trim()) return;
            addAccountRelatedRecord('notes', {
              accountId: account.id,
              title: 'WhatsApp Outbound Message',
              content: whatsappMessage.trim(),
              ownerId: account.ownerId || 'u1',
              status: 'Sent',
            });
            updateRecord('accounts', account.id, { lastActivityTime: todayISO() });
            toast.success(`WhatsApp message logged for ${account.name}`);
            setWhatsappModalOpen(false);
          }}
          className="space-y-3"
        >
          <div>
            <label className="block text-[12px] font-medium text-[#475569] mb-1">WhatsApp Message</label>
            <textarea
              rows={4}
              required
              value={whatsappMessage}
              onChange={(e) => setWhatsappMessage(e.target.value)}
              className="input text-[13px] py-2 w-full"
            />
          </div>
          <div className="flex items-center justify-between pt-2">
            {cleanDigits ? (
              <a
                href={`https://wa.me/${cleanDigits}?text=${encodeURIComponent(whatsappMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] text-[#16A34A] hover:underline font-semibold inline-flex items-center gap-1"
              >
                <ExternalLink size={12.5} /> Launch WhatsApp Web
              </a>
            ) : (
              <span className="text-[11.5px] text-[#64748B]">No mobile number on file</span>
            )}
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setWhatsappModalOpen(false)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Send & Log Message
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* ================================================================= */}
      {/* 7. LOCATE MAP MODAL                                               */}
      {/* ================================================================= */}
      <Modal
        open={locateMapOpen}
        onClose={() => setLocateMapOpen(false)}
        title={`Address Location — ${account.name}`}
        subtitle={`${account.billingCity || account.location || 'Chennai'}, ${account.billingState || 'Tamil Nadu'}`}
      >
        <div className="space-y-3 text-[13px]">
          <div className="p-4 rounded-lg bg-[#0F172A] text-white space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-sky-400">
                <MapPin size={14} /> Billing Address Coordinates
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                Verified Territory: {account.billingCity || account.location || 'Chennai'}
              </span>
            </div>
            <div className="text-[13.5px] font-medium">
              {[
                account.billingStreet || account.billingFlat,
                account.billingCity || account.location,
                account.billingState,
                account.billingZip,
                account.billingCountry || 'India',
              ]
                .filter(Boolean)
                .join(', ')}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setLocateMapOpen(false)} className="btn-primary">
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* ================================================================= */}
      {/* 8. CREATE TASK MODAL                                              */}
      {/* ================================================================= */}
      <Modal
        open={newTaskModalOpen}
        onClose={() => setNewTaskModalOpen(false)}
        title={`New Task for ${account.name}`}
        subtitle="Schedule an open follow-up task linked to this account."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newTaskTitle.trim()) return;
            addAccountRelatedRecord('tasks', {
              accountId: account.id,
              title: newTaskTitle.trim(),
              dueDate: newTaskDue,
              priority: newTaskPriority,
              status: 'In Progress',
              ownerId: account.ownerId || 'u1',
            });
            setNewTaskTitle('');
            setNewTaskModalOpen(false);
            toast.success('Task added to Open Activities');
          }}
          className="space-y-3"
        >
          <div>
            <label className="block text-[12px] font-medium text-[#475569] mb-1">Task Subject</label>
            <input
              type="text"
              required
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="e.g. Executive QBR preparation"
              className="input h-9 text-[13px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-[#475569] mb-1">Due Date</label>
              <input
                type="date"
                value={newTaskDue}
                onChange={(e) => setNewTaskDue(e.target.value)}
                className="input h-9 text-[13px]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#475569] mb-1">Priority</label>
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value)}
                className="input h-9 text-[13px]"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setNewTaskModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create Task
            </button>
          </div>
        </form>
      </Modal>

      {/* ================================================================= */}
      {/* 9. QUICK ADD RELATED RECORD MODAL                                 */}
      {/* ================================================================= */}
      <Modal
        open={Boolean(quickAddModal)}
        onClose={() => setQuickAddModal(null)}
        title={quickAddModal?.title || 'Add Related Record'}
        subtitle={`Linked to ${account.name}`}
      >
        {quickAddModal && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const val = String(quickAddModal.value || '').trim();
              if (!val) return;
              const amt = Number(quickAddModal.amount) || 850000;
              addAccountRelatedRecord(quickAddModal.moduleKey, {
                accountId: account.id,
                title: val,
                subject: val,
                name: val,
                leadName: val,
                cadenceName: val,
                fileName: val,
                productName: val,
                campaignName: val,
                documentName: val,
                eventName: val,
                caseNumber: `CASE-${Date.now().toString().slice(-4)}`,
                quoteNumber: `QT-${Date.now().toString().slice(-4)}`,
                soNumber: `SO-${Date.now().toString().slice(-4)}`,
                poNumber: `PO-${Date.now().toString().slice(-4)}`,
                amount: amt,
                status: 'Active',
                ownerId: account.ownerId || 'u1',
              });
              toast.success(`Added to ${quickAddModal.title}`);
              setQuickAddModal(null);
            }}
            className="space-y-3"
          >
            <div>
              <label className="block text-[12px] font-medium text-[#475569] mb-1">
                {quickAddModal.label}
              </label>
              <input
                type="text"
                required
                autoFocus
                value={quickAddModal.value}
                onChange={(e) => setQuickAddModal((p) => ({ ...p, value: e.target.value }))}
                className="input h-9 text-[13px]"
              />
            </div>
            {quickAddModal.amount !== undefined && (
              <div>
                <label className="block text-[12px] font-medium text-[#475569] mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={quickAddModal.amount}
                  onChange={(e) => setQuickAddModal((p) => ({ ...p, amount: e.target.value }))}
                  className="input h-9 text-[13px]"
                />
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setQuickAddModal(null)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Save
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ================================================================= */}
      {/* 10. CONFIRM DELETE DIALOG                                         */}
      {/* ================================================================= */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        title={`Delete ${account.name}?`}
        message={`Are you sure you want to delete ${account.name}? Linked deals and contacts will remain but will no longer reference this account.`}
        onConfirm={() => {
          deleteRecords('accounts', [account.id]);
          toast.info(`Deleted account "${account.name}"`);
          onBack?.();
        }}
      />
    </div>
  );
}

