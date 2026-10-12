import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Building2, Calendar, Check, CheckCircle2, ChevronDown, ChevronLeft,
  ChevronRight, Clock, Copy, Edit3, ExternalLink, FileText, FolderPlus, Globe,
  History, Link as LinkIcon, Mail, MessageSquare, MoreHorizontal, Paperclip,
  Pencil, Phone, Plus, Printer, Send, Share2, ShieldCheck, Sparkles, Tag,
  Trash2, User, UserCheck, Users, Workflow, X,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useToast } from '../../components/common/Toast';
import { PersonAvatar, UserAvatar } from '../../components/common/Avatar';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { LEAD_SOURCES, SALUTATIONS, VENDORS, DEPARTMENTS } from '../../data/seedData';
import { fmtINR, fmtDate, todayISO, addDays } from '../../utils/calculations';
import { getRelatedRecordsForContact } from '../../utils/contactsFilterEngine';
import RecordTimeline from '../../components/common/RecordTimeline';
import WhatsAppComposerModal, { WhatsAppIcon } from '../../components/common/WhatsAppComposerModal';

export const CONTACT_RELATED_LIST_ITEMS = [
  { key: 'notes', label: 'Notes' },
  { key: 'connectedRecords', label: 'Connected Records' },
  { key: 'cadences', label: 'Cadences' },
  { key: 'attachments', label: 'Attachments' },
  { key: 'deals', label: 'Deals' },
  { key: 'openActivities', label: 'Open Activities' },
  { key: 'closedActivities', label: 'Closed Activities' },
  { key: 'invitedMeetings', label: 'Invited Meetings' },
  { key: 'products', label: 'Products' },
  { key: 'cases', label: 'Cases' },
  { key: 'quotes', label: 'Quotes' },
  { key: 'salesOrders', label: 'Sales Orders' },
  { key: 'purchaseOrders', label: 'Purchase Orders' },
  { key: 'emails', label: 'Emails' },
  { key: 'invoices', label: 'Invoices' },
  { key: 'campaigns', label: 'Campaigns' },
  { key: 'social', label: 'Social' },
  { key: 'reportingContacts', label: 'Reporting Contacts' },
  { key: 'workflowRules', label: 'Workflow Rules' },
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

export default function ContactDetail({
  contact,
  contactsList = [],
  onBack,
  onSelectContact,
  initialTab = 'overview',
}) {
  const navigate = useNavigate();
  const toast = useToast();
  const {
    contacts,
    accounts,
    deals,
    calls,
    invoices,
    tasks,
    users,
    contactRelations,
    accountsById,
    usersById,
    contactsById,
    accountName,
    userName,
    updateRecord,
    deleteRecords,
    createRecord,
    addContactRelatedRecord,
    updateTask,
  } = useCRM();

  const [activeTab, setActiveTab] = useState(initialTab === 'timeline' ? 'timeline' : 'overview'); // 'overview' | 'timeline'
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [detailsExpanded, setDetailsExpanded] = useState(true);
  const [activeRelatedKey, setActiveRelatedKey] = useState('notes');

  useEffect(() => {
    if (initialTab === 'timeline' || initialTab === 'overview') {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Notes state
  const [noteInput, setNoteInput] = useState('');
  const [noteSortOrder, setNoteSortOrder] = useState('recent_last'); // 'recent_last' | 'recent_first'

  // Emails sub-tab
  const [emailSubTab, setEmailSubTab] = useState('Mails'); // 'Mails' | 'Drafts' | 'Scheduled'

  // Tags inline editor
  const [addingTag, setAddingTag] = useState(false);
  const [newTagText, setNewTagText] = useState('');

  // Modals
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [editErrors, setEditErrors] = useState({});
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeData, setComposeData] = useState({ subject: '', body: '' });
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [whatsappPreferredField, setWhatsappPreferredField] = useState('');
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [newTaskModalOpen, setNewTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDue, setNewTaskDue] = useState(addDays(todayISO(), 3));
  const [newTaskPriority, setNewTaskPriority] = useState('High');
  const [quickAddModal, setQuickAddModal] = useState(null); // { moduleKey, title, label, value: '' }

  const filterContext = useMemo(
    () => ({
      contacts,
      accounts,
      deals,
      calls,
      invoices,
      tasks,
      contactRelations,
      accountsById,
      usersById,
      contactsById,
    }),
    [contacts, accounts, deals, calls, invoices, tasks, contactRelations, accountsById, usersById, contactsById]
  );

  // Related records for this exact contact
  const relNotes = useMemo(() => {
    const list = getRelatedRecordsForContact(contact, 'notes', filterContext);
    return [...list].sort((a, b) => {
      const da = String(a.createdDate || '');
      const db = String(b.createdDate || '');
      return noteSortOrder === 'recent_last' ? da.localeCompare(db) : db.localeCompare(da);
    });
  }, [contact, filterContext, noteSortOrder]);

  const relConnected = useMemo(() => getRelatedRecordsForContact(contact, 'connectedRecords', filterContext), [contact, filterContext]);
  const relCadences = useMemo(() => getRelatedRecordsForContact(contact, 'cadences', filterContext), [contact, filterContext]);
  const relAttachments = useMemo(() => getRelatedRecordsForContact(contact, 'attachments', filterContext), [contact, filterContext]);
  const relDeals = useMemo(() => getRelatedRecordsForContact(contact, 'deals', filterContext), [contact, filterContext]);
  const relTasks = useMemo(() => getRelatedRecordsForContact(contact, 'tasks', filterContext), [contact, filterContext]);
  const relMeetings = useMemo(() => getRelatedRecordsForContact(contact, 'meetings', filterContext), [contact, filterContext]);
  const relCalls = useMemo(() => getRelatedRecordsForContact(contact, 'calls', filterContext), [contact, filterContext]);
  const relInvitedMeetings = useMemo(() => getRelatedRecordsForContact(contact, 'invitedMeetings', filterContext), [contact, filterContext]);
  const relProducts = useMemo(() => getRelatedRecordsForContact(contact, 'products', filterContext), [contact, filterContext]);
  const relCases = useMemo(() => getRelatedRecordsForContact(contact, 'cases', filterContext), [contact, filterContext]);
  const relQuotes = useMemo(() => getRelatedRecordsForContact(contact, 'quotes', filterContext), [contact, filterContext]);
  const relSalesOrders = useMemo(() => getRelatedRecordsForContact(contact, 'salesOrders', filterContext), [contact, filterContext]);
  const relPurchaseOrders = useMemo(() => getRelatedRecordsForContact(contact, 'purchaseOrders', filterContext), [contact, filterContext]);
  const relEmails = useMemo(() => getRelatedRecordsForContact(contact, 'emails', filterContext), [contact, filterContext]);
  const relInvoices = useMemo(() => getRelatedRecordsForContact(contact, 'invoices', filterContext), [contact, filterContext]);
  const relCampaigns = useMemo(() => getRelatedRecordsForContact(contact, 'campaigns', filterContext), [contact, filterContext]);
  const relReportingContacts = useMemo(() => getRelatedRecordsForContact(contact, 'reportingContacts', filterContext), [contact, filterContext]);

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
    openActivities: openActivitiesCount,
    closedActivities: closedActivitiesCount,
    invitedMeetings: relInvitedMeetings.length,
    products: relProducts.length,
    cases: relCases.length,
    quotes: relQuotes.length,
    salesOrders: relSalesOrders.length,
    purchaseOrders: relPurchaseOrders.length,
    emails: relEmails.length,
    invoices: relInvoices.length,
    campaigns: relCampaigns.length,
    social: contact?.twitter || contact?.skypeId ? 1 : 0,
    reportingContacts: relReportingContacts.length,
  };

  // Previous / Next record navigation in current list
  const navList = contactsList.length > 0 ? contactsList : contacts;
  const currentIndex = navList.findIndex((c) => c.id === contact?.id);
  const prevContact = currentIndex > 0 ? navList[currentIndex - 1] : null;
  const nextContact = currentIndex >= 0 && currentIndex < navList.length - 1 ? navList[currentIndex + 1] : null;

  if (!contact) return null;

  // Open Edit Modal prefilled with this exact contact's saved values
  const handleOpenEdit = () => {
    const parts = String(contact.name || '').trim().split(/\s+/);
    setEditForm({
      salutation: contact.salutation || 'Mr.',
      firstName: contact.firstName || parts[0] || '',
      lastName: contact.lastName || parts.slice(1).join(' ') || contact.name || '',
      accountId: contact.accountId || accounts[0]?.id || '',
      ownerId: contact.ownerId || users[0]?.id || 'u1',
      leadSource: contact.leadSource || 'Website',
      designation: contact.designation || '',
      department: contact.department || '',
      email: contact.email || '',
      secondaryEmail: contact.secondaryEmail || '',
      phone: contact.phone || '',
      mobile: contact.mobile || '',
      otherPhone: contact.otherPhone || '',
      homePhone: contact.homePhone || '',
      assistant: contact.assistant || '',
      asstPhone: contact.asstPhone || '',
      fax: contact.fax || '',
      dateOfBirth: contact.dateOfBirth || '',
      skypeId: contact.skypeId || '',
      twitter: contact.twitter || '',
      vendorName: contact.vendorName || '',
      reportingToId: contact.reportingToId || '',
      emailOptOut: Boolean(contact.emailOptOut),
      mailingStreet: contact.mailingStreet || contact.mailingFlat || '',
      mailingCity: contact.mailingCity || contact.city || '',
      mailingState: contact.mailingState || '',
      mailingZip: contact.mailingZip || '',
      mailingCountry: contact.mailingCountry || 'India',
      otherStreet: contact.otherStreet || contact.otherFlat || '',
      otherCity: contact.otherCity || '',
      otherState: contact.otherState || '',
      otherZip: contact.otherZip || '',
      otherCountry: contact.otherCountry || '',
      description: contact.description || '',
      tagInput: Array.isArray(contact.tags) ? contact.tags.join(', ') : contact.tag || '',
    });
    setEditErrors({});
    setEditModalOpen(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editForm) return;
    const errs = {};
    const fName = String(editForm.firstName || '').trim();
    const lName = String(editForm.lastName || '').trim();
    if (!lName) {
      errs.lastName = 'Last Name is required.';
    }
    if (editForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(editForm.email).trim())) {
      errs.email = 'Please enter a valid email address.';
    }
    if (Object.keys(errs).length > 0) {
      setEditErrors(errs);
      return;
    }

    const fullName = fName ? `${fName} ${lName}` : lName;
    const tags = String(editForm.tagInput || '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const mailingAddress = [
      editForm.mailingStreet,
      editForm.mailingCity,
      editForm.mailingState,
      editForm.mailingZip,
      editForm.mailingCountry,
    ]
      .filter(Boolean)
      .join(', ');

    const otherAddress = [
      editForm.otherStreet,
      editForm.otherCity,
      editForm.otherState,
      editForm.otherZip,
      editForm.otherCountry,
    ]
      .filter(Boolean)
      .join(', ');

    updateRecord('contacts', contact.id, {
      ...editForm,
      name: fullName,
      firstName: fName,
      lastName: lName,
      city: editForm.mailingCity || contact.city,
      tags,
      tag: tags.join(', '),
      mailingAddress,
      otherAddress,
      modifiedTime: todayISO(),
      modifiedBy: contact.ownerId || 'u1',
    });

    toast.success(`Updated "${fullName}"`);
    setEditModalOpen(false);
  };

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!noteInput.trim()) return;
    addContactRelatedRecord('notes', {
      contactId: contact.id,
      title: 'Contact Note',
      content: noteInput.trim(),
      ownerId: contact.ownerId || 'u1',
      status: 'Active',
    });
    setNoteInput('');
    toast.success('Note saved to contact');
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    const clean = newTagText.trim();
    if (!clean) {
      setAddingTag(false);
      return;
    }
    const existing = Array.isArray(contact.tags) ? contact.tags : [];
    if (!existing.includes(clean)) {
      const updated = [...existing, clean];
      updateRecord('contacts', contact.id, { tags: updated, tag: updated.join(', ') });
      toast.success(`Added tag "${clean}"`);
    }
    setNewTagText('');
    setAddingTag(false);
  };

  const handleRemoveTag = (tagToRemove) => {
    const existing = Array.isArray(contact.tags) ? contact.tags : [];
    const updated = existing.filter((t) => t !== tagToRemove);
    updateRecord('contacts', contact.id, { tags: updated, tag: updated.join(', ') });
  };

  const scrollToRelatedSection = (key) => {
    setActiveRelatedKey(key);
    if (activeTab !== 'overview') {
      setActiveTab('overview');
      setTimeout(() => {
        const el = document.getElementById(`related-section-${key}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    } else {
      const el = document.getElementById(`related-section-${key}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const primaryDeal = relDeals[0] || null;
  const nextTask = openTasks[0] || null;
  const formattedMailingAddress = [
    contact.mailingStreet || contact.mailingFlat,
    contact.mailingCity || contact.city,
    contact.mailingState,
    contact.mailingZip,
    contact.mailingCountry || 'India',
  ]
    .filter(Boolean)
    .join(', ');

  const formattedOtherAddress = [
    contact.otherStreet || contact.otherFlat,
    contact.otherCity,
    contact.otherState,
    contact.otherZip,
    contact.otherCountry,
  ]
    .filter(Boolean)
    .join(', ');

  const reportingToContact = contact.reportingToId ? contactsById[contact.reportingToId] : null;

  return (
    <div className="mx-3 sm:-mx-[18px] -mt-2.5 -mb-6 bg-[#F3F6FA] min-h-[calc(100vh-60px)] flex flex-col">
      {/* ================================================================= */}
      {/* 1. TOP RECORD HEADER BAR (Matches Screenshot 1 & 2)               */}
      {/* ================================================================= */}
      <div className="sticky top-[60px] z-20 bg-white border-b border-[#DCE3EE] px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        {/* Left: Back arrow, Avatar, Contact Name - Account Name, Tags */}
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to Contacts"
            title="Back to Contacts list"
            className="h-8 w-8 rounded-lg border border-transparent hover:border-[#DCE3EE] hover:bg-[#F8FAFC] flex items-center justify-center text-[#334155] shrink-0 transition-colors"
          >
            <ArrowLeft size={17} />
          </button>

          {contact.avatar ? (
            <img
              src={contact.avatar}
              alt={contact.name}
              className="h-11 w-11 rounded-full object-cover border border-[#DCE3EE] shrink-0"
            />
          ) : (
            <PersonAvatar name={contact.name} size={42} />
          )}

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h1 className="text-[16px] sm:text-[18px] font-bold text-[#0F172A] tracking-tight truncate">
                {contact.salutation ? `${contact.salutation} ` : ''}
                {contact.name}
              </h1>
              {contact.accountId && (
                <>
                  <span className="text-[#94A3B8] font-normal">-</span>
                  <Link
                    to={`/accounts?open=${contact.accountId}`}
                    className="text-[14px] sm:text-[15px] font-medium text-[#1262E0] hover:underline truncate"
                  >
                    {accountName(contact.accountId)}
                  </Link>
                </>
              )}
            </div>

            {/* Tags Row */}
            <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[11.5px]">
              <Tag size={12} className="text-[#64748B]" />
              {(contact.tags || []).map((t) => (
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
                  className="text-[#64748B] hover:text-[#1262E0] font-medium hover:underline"
                >
                  Add Tags
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Send Email, Send WhatsApp, Edit, More (...), Prev/Next Record Navigation */}
        <div className="flex flex-wrap items-center gap-2 ml-auto">
          <button
            type="button"
            data-testid="contact-detail-send-email-btn"
            onClick={() => {
              setComposeData({
                subject: `Follow-up with ${contact.name} (${accountName(contact.accountId)})`,
                body: `Hi ${contact.firstName || contact.name},\n\nHope you are doing well. Following up on our recent conversation.\n\nBest regards,\n${userName(contact.ownerId)}`,
              });
              setComposeOpen(true);
            }}
            className="h-8 px-3 sm:px-3.5 rounded bg-[#1262E0] hover:bg-[#0B4BB8] text-white text-[12px] sm:text-[12.5px] font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Mail size={13.5} />
            <span>Send Email</span>
          </button>

          <button
            type="button"
            data-testid="contact-detail-send-whatsapp-btn"
            onClick={() => {
              setWhatsappPreferredField('');
              setWhatsappModalOpen(true);
            }}
            className="h-8 px-3 sm:px-3.5 rounded border border-[#16A34A]/30 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#15803D] text-[12px] sm:text-[12.5px] font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <WhatsAppIcon size={14} className="text-[#16A34A]" />
            <span>Send WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handleOpenEdit}
            className="h-8 px-3 sm:px-3.5 rounded border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#1E293B] text-[12px] sm:text-[12.5px] font-medium inline-flex items-center gap-1.5 transition-colors"
          >
            <span>Edit</span>
          </button>

          <button
            type="button"
            data-testid="contact-detail-workflow-timeline-btn"
            title="View chronological Workflow & Activity Timeline"
            onClick={() => setActiveTab((prev) => (prev === 'timeline' ? 'overview' : 'timeline'))}
            className={`h-8 px-3 rounded border text-[12.5px] font-medium inline-flex items-center gap-1.5 transition-colors ${
              activeTab === 'timeline'
                ? 'border-[#1262E0] bg-[#EFF6FF] text-[#1262E0] font-semibold'
                : 'border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#1E293B]'
            }`}
          >
            <Workflow size={14} className={activeTab === 'timeline' ? 'text-[#1262E0]' : 'text-[#6D28D9]'} />
            <span>Timeline</span>
          </button>

          {/* More Actions Menu (...) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMoreMenuOpen((p) => !p)}
              aria-label="More contact actions"
              className="h-8 w-8 rounded border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#334155] flex items-center justify-center"
            >
              <MoreHorizontal size={15} />
            </button>

            {moreMenuOpen && (
              <div
                onMouseLeave={() => setMoreMenuOpen(false)}
                className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-[#DCE3EE] bg-white shadow-lg py-1 z-40 text-[12.5px]"
              >
                <button
                  type="button"
                  onClick={() => {
                    setMoreMenuOpen(false);
                    setWhatsappPreferredField('');
                    setWhatsappModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-[#334155] hover:bg-[#F8FAFC]"
                >
                  <WhatsAppIcon size={13.5} className="text-[#16A34A]" /> Send WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMoreMenuOpen(false);
                    navigate(`/calls?create=1&contact=${contact.id}`);
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
                    const cloned = createRecord('contacts', {
                      ...contact,
                      id: undefined,
                      name: `${contact.name} (Copy)`,
                      lastName: `${contact.lastName || contact.name} (Copy)`,
                      createdTime: todayISO(),
                    });
                    toast.success(`Cloned contact "${cloned.name}"`);
                    onSelectContact?.(cloned.id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-[#334155] hover:bg-[#F8FAFC]"
                >
                  <Copy size={13.5} className="text-[#64748B]" /> Clone Contact
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
                    setConfirmDeleteOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-[#DC2626] hover:bg-[#FEF2F2]"
                >
                  <Trash2 size={13.5} /> Delete Contact
                </button>
              </div>
            )}
          </div>

          {/* Previous / Next Contact Record Navigation */}
          <div className="inline-flex items-center rounded border border-[#CBD5E1] bg-white overflow-hidden ml-1">
            <button
              type="button"
              disabled={!prevContact}
              onClick={() => prevContact && onSelectContact?.(prevContact.id)}
              aria-label="Previous contact"
              title={prevContact ? `Previous: ${prevContact.name}` : 'No previous contact'}
              className="h-8 w-7 flex items-center justify-center text-[#334155] hover:bg-[#F8FAFC] disabled:opacity-35 border-r border-[#E2E8F0]"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              type="button"
              disabled={!nextContact}
              onClick={() => nextContact && onSelectContact?.(nextContact.id)}
              aria-label="Next contact"
              title={nextContact ? `Next: ${nextContact.name}` : 'No next contact'}
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
        {CONTACT_RELATED_LIST_ITEMS.map((item) => {
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
            aria-label="Related List navigation"
            className="hidden lg:flex flex-col w-[188px] shrink-0 bg-white border-r border-[#DCE3EE] py-3 px-2.5 select-none"
          >
            <div className="px-2 pb-2 text-[12px] font-bold text-[#0F172A] tracking-tight">
              Related List
            </div>

            <nav className="space-y-0.5 flex-1">
              {CONTACT_RELATED_LIST_ITEMS.map((item) => {
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
                  onClick={() => toast.info('All 18 standard CRM related modules are enabled in this layout.')}
                  className="text-[12px] font-semibold text-[#1262E0] hover:underline"
                >
                  Add Related List
                </button>
              </div>

              <div className="pt-5 px-2.5 space-y-1">
                <div className="text-[12px] font-bold text-[#0F172A]">Links</div>
                <button
                  type="button"
                  onClick={() => toast.info('Custom URL link association available in Workspace Settings')}
                  className="text-[12px] font-medium text-[#1262E0] hover:underline block"
                >
                  Add Link
                </button>
              </div>
            </nav>
          </aside>
        )}

        {/* Right Main Content Column */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Sub-Header Bar: Overview / Timeline Tabs + Last Update */}
          <div className="bg-white border-b border-[#DCE3EE] px-4 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setSidebarOpen((p) => !p)}
                aria-label="Toggle Related List sidebar"
                title={sidebarOpen ? 'Collapse Related List' : 'Expand Related List'}
                className="hidden lg:flex h-7 w-7 rounded-full border border-[#CBD5E1] items-center justify-center text-[#475569] hover:bg-[#F8FAFC]"
              >
                {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
              </button>

              {/* Overview & Timeline Pill Switcher */}
              <div
                role="tablist"
                aria-label="Contact view tabs"
                className="inline-flex items-center rounded-full bg-[#F1F5F9] p-0.5 border border-[#CBD5E1]"
              >
                <button
                  type="button"
                  role="tab"
                  data-testid="contact-detail-tab-overview"
                  aria-selected={activeTab === 'overview'}
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-1 rounded-full text-[12px] transition-all cursor-pointer ${
                    activeTab === 'overview'
                      ? 'bg-white text-[#1262E0] font-semibold border border-[#1262E0] shadow-2xs'
                      : 'text-[#475569] hover:text-[#0F172A] font-medium'
                  }`}
                >
                  Overview
                </button>
                <button
                  type="button"
                  role="tab"
                  data-testid="contact-detail-tab-timeline"
                  aria-selected={activeTab === 'timeline'}
                  onClick={() => setActiveTab('timeline')}
                  className={`px-4 py-1 rounded-full text-[12px] transition-all cursor-pointer ${
                    activeTab === 'timeline'
                      ? 'bg-white text-[#1262E0] font-semibold border border-[#1262E0] shadow-2xs'
                      : 'text-[#475569] hover:text-[#0F172A] font-medium'
                  }`}
                >
                  Timeline
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11.5px] text-[#64748B]">
              <Clock size={12.5} />
              <span>
                Last Update: {contact.modifiedTime || contact.lastContacted || contact.createdTime || 'Today'}
              </span>
            </div>
          </div>

          {/* =============================================================== */}
          {/* TAB 1: OVERVIEW                                                 */}
          {/* =============================================================== */}
          {activeTab === 'overview' && (
            <div className="p-3 sm:p-4 space-y-3">
              {/* 1. Top Summary Card (Contact Owner, Email, Phone, Mobile, Department) */}
              <div className="bg-white rounded-md border border-[#DCE3EE] px-5 py-4 shadow-2xs">
                <div className="max-w-xl space-y-2 text-[12.5px]">
                  <div className="grid grid-cols-12 items-center">
                    <span className="col-span-4 text-[#64748B] sm:text-right pr-6">Contact Owner</span>
                    <span className="col-span-8 font-medium text-[#0F172A]">{userName(contact.ownerId)}</span>
                  </div>
                  <div className="grid grid-cols-12 items-center">
                    <span className="col-span-4 text-[#64748B] sm:text-right pr-6">Email</span>
                    <span className="col-span-8">
                      {contact.email ? (
                        <a href={`mailto:${contact.email}`} className="text-[#1262E0] hover:underline font-medium">
                          {contact.email}
                        </a>
                      ) : (
                        '—'
                      )}
                    </span>
                  </div>
                  <div className="grid grid-cols-12 items-center">
                    <span className="col-span-4 text-[#64748B] sm:text-right pr-6">Phone</span>
                    <span className="col-span-8 inline-flex items-center gap-2 font-medium text-[#0F172A]">
                      <span>{contact.phone || '—'}</span>
                      {contact.phone && (
                        <>
                          <a
                            href={`tel:${String(contact.phone).replace(/\s/g, '')}`}
                            title={`Call ${contact.phone}`}
                            className="w-4 h-4 rounded-full bg-[#10B981] text-white inline-flex items-center justify-center"
                          >
                            <Phone size={9} className="fill-current" />
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              setWhatsappPreferredField('phone');
                              setWhatsappModalOpen(true);
                            }}
                            title={`Send WhatsApp to ${contact.phone}`}
                            className="w-4 h-4 rounded-full bg-[#16A34A] text-white inline-flex items-center justify-center"
                          >
                            <WhatsAppIcon size={9.5} />
                          </button>
                        </>
                      )}
                    </span>
                  </div>
                  <div className="grid grid-cols-12 items-center">
                    <span className="col-span-4 text-[#64748B] sm:text-right pr-6">Mobile</span>
                    <span className="col-span-8 inline-flex items-center gap-2 font-medium text-[#0F172A]">
                      <span>{contact.mobile || contact.phone || '—'}</span>
                      {(contact.mobile || contact.phone) && (
                        <>
                          <a
                            href={`tel:${String(contact.mobile || contact.phone).replace(/\s/g, '')}`}
                            title={`Call ${contact.mobile || contact.phone}`}
                            className="w-4 h-4 rounded-full bg-[#10B981] text-white inline-flex items-center justify-center"
                          >
                            <Phone size={9} className="fill-current" />
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              setWhatsappPreferredField(contact.mobile ? 'mobile' : 'phone');
                              setWhatsappModalOpen(true);
                            }}
                            title={`Send WhatsApp to ${contact.mobile || contact.phone}`}
                            className="w-4 h-4 rounded-full bg-[#16A34A] text-white inline-flex items-center justify-center"
                          >
                            <WhatsAppIcon size={9.5} />
                          </button>
                        </>
                      )}
                    </span>
                  </div>
                  <div className="grid grid-cols-12 items-center">
                    <span className="col-span-4 text-[#64748B] sm:text-right pr-6">Department</span>
                    <span className="col-span-8 font-medium text-[#0F172A]">{contact.department || '—'}</span>
                  </div>
                </div>
              </div>

              {/* 2. Deals & Next Action Highlight Card (Matching Screenshot 1) */}
              <div className="bg-white rounded-md border border-[#DCE3EE] px-5 py-3.5 shadow-2xs grid grid-cols-1 md:grid-cols-2 gap-4 divide-y md:divide-y-0 md:divide-x divide-[#E2E8F0]">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
                    Deals
                  </div>
                  {primaryDeal ? (
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/deals?open=${primaryDeal.id}`}
                          className="text-[13px] font-bold text-[#0F172A] hover:text-[#1262E0] hover:underline"
                        >
                          {primaryDeal.name}
                        </Link>
                        <span className="px-2 py-0.2 rounded border border-[#EF4444] bg-[#FEF2F2] text-[#DC2626] text-[11px] font-semibold">
                          {fmtINR(primaryDeal.amount)}
                        </span>
                      </div>
                      <div className="text-[12px] text-[#475569]">
                        {primaryDeal.stage} · <span className="font-medium">{fmtDate(primaryDeal.closingDate)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[12px] text-[#64748B]">
                      <span>No active deals linked</span>
                      <button
                        type="button"
                        onClick={() => navigate(`/deals?create=1&contact=${contact.id}&account=${contact.accountId}`)}
                        className="text-[#1262E0] hover:underline font-medium"
                      >
                        + New Deal
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-3 md:pt-0 md:pl-6">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
                    Next Action
                  </div>
                  {nextTask ? (
                    <div className="flex items-center gap-2.5">
                      <span className="px-2 py-0.5 rounded bg-[#EF4444] text-white text-[10.5px] font-bold uppercase">
                        {fmtDate(nextTask.due || nextTask.dueDate).slice(0, 6)}
                      </span>
                      <span className="text-[12.5px] font-semibold text-[#0F172A] truncate">
                        {nextTask.title || nextTask.subject}
                      </span>
                    </div>
                  ) : contact.followUp ? (
                    <div className="flex items-center gap-2.5">
                      <span className="px-2 py-0.5 rounded bg-[#EF4444] text-white text-[10.5px] font-bold uppercase">
                        {fmtDate(contact.followUp).slice(0, 6)}
                      </span>
                      <span className="text-[12.5px] font-semibold text-[#0F172A]">
                        Scheduled Follow-up Call
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[12px] text-[#64748B]">
                      <span>No upcoming action scheduled</span>
                      <button
                        type="button"
                        onClick={() => setNewTaskModalOpen(true)}
                        className="text-[#1262E0] hover:underline font-medium"
                      >
                        + Add Task
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Collapsible Full Details Card (Contact Info, Address Info, Description Info) */}
              <div className="bg-white rounded-md border border-[#DCE3EE] shadow-2xs overflow-hidden">
                <div className="px-5 py-2.5 border-b border-[#E2E8F0] flex items-center justify-between">
                  <button
                    type="button"
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
                    {/* SECTION A: Contact Information */}
                    <div>
                      <h2 className="text-[13.5px] font-bold text-[#0F172A] mb-3">
                        Contact Information
                      </h2>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10">
                        {/* Left Column */}
                        <div>
                          <FieldRow label="Contact Owner" value={userName(contact.ownerId)} />
                          <FieldRow
                            label="Account Name"
                            value={
                              contact.accountId ? (
                                <Link
                                  to={`/accounts?open=${contact.accountId}`}
                                  className="text-[#1262E0] hover:underline font-semibold"
                                >
                                  {accountName(contact.accountId)}
                                </Link>
                              ) : (
                                '—'
                              )
                            }
                          />
                          <FieldRow
                            label="Email"
                            value={
                              contact.email ? (
                                <a href={`mailto:${contact.email}`} className="text-[#1262E0] hover:underline">
                                  {contact.email}
                                </a>
                              ) : (
                                '—'
                              )
                            }
                          />
                          <FieldRow
                            label="Phone"
                            value={
                              contact.phone ? (
                                <span className="inline-flex items-center gap-2">
                                  <span>{contact.phone}</span>
                                  <a
                                    href={`tel:${String(contact.phone).replace(/\s/g, '')}`}
                                    title={`Call ${contact.phone}`}
                                    className="w-4 h-4 rounded-full bg-[#10B981] text-white inline-flex items-center justify-center"
                                  >
                                    <Phone size={9} className="fill-current" />
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setWhatsappPreferredField('phone');
                                      setWhatsappModalOpen(true);
                                    }}
                                    title={`Send WhatsApp to ${contact.phone}`}
                                    className="w-4 h-4 rounded-full bg-[#16A34A] text-white inline-flex items-center justify-center"
                                  >
                                    <WhatsAppIcon size={9.5} />
                                  </button>
                                </span>
                              ) : (
                                '—'
                              )
                            }
                          />
                          <FieldRow
                            label="Other Phone"
                            value={
                              contact.otherPhone ? (
                                <span className="inline-flex items-center gap-2">
                                  <span>{contact.otherPhone}</span>
                                  <a
                                    href={`tel:${String(contact.otherPhone).replace(/\s/g, '')}`}
                                    title={`Call ${contact.otherPhone}`}
                                    className="w-4 h-4 rounded-full bg-[#10B981] text-white inline-flex items-center justify-center"
                                  >
                                    <Phone size={9} className="fill-current" />
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setWhatsappPreferredField('otherPhone');
                                      setWhatsappModalOpen(true);
                                    }}
                                    title={`Send WhatsApp to ${contact.otherPhone}`}
                                    className="w-4 h-4 rounded-full bg-[#16A34A] text-white inline-flex items-center justify-center"
                                  >
                                    <WhatsAppIcon size={9.5} />
                                  </button>
                                </span>
                              ) : (
                                '—'
                              )
                            }
                          />
                          <FieldRow
                            label="Mobile"
                            value={
                              contact.mobile ? (
                                <span className="inline-flex items-center gap-2">
                                  <span>{contact.mobile}</span>
                                  <a
                                    href={`tel:${String(contact.mobile).replace(/\s/g, '')}`}
                                    title={`Call ${contact.mobile}`}
                                    className="w-4 h-4 rounded-full bg-[#10B981] text-white inline-flex items-center justify-center"
                                  >
                                    <Phone size={9} className="fill-current" />
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setWhatsappPreferredField('mobile');
                                      setWhatsappModalOpen(true);
                                    }}
                                    title={`Send WhatsApp to ${contact.mobile}`}
                                    className="w-4 h-4 rounded-full bg-[#16A34A] text-white inline-flex items-center justify-center"
                                  >
                                    <WhatsAppIcon size={9.5} />
                                  </button>
                                </span>
                              ) : (
                                '—'
                              )
                            }
                          />
                          <FieldRow label="Assistant" value={contact.assistant || '—'} />
                          <FieldRow
                            label="Created By"
                            value={
                              <div>
                                <div>{userName(contact.createdBy || contact.ownerId)}</div>
                                <div className="text-[11px] text-[#64748B] font-normal">
                                  {contact.createdTime || contact.createdOn || '—'}
                                </div>
                              </div>
                            }
                          />
                          <FieldRow
                            label="Modified By"
                            value={
                              <div>
                                <div>{userName(contact.modifiedBy || contact.ownerId)}</div>
                                <div className="text-[11px] text-[#64748B] font-normal">
                                  {contact.modifiedTime || contact.lastContacted || '—'}
                                </div>
                              </div>
                            }
                          />
                        </div>

                        {/* Right Column */}
                        <div>
                          <FieldRow label="Lead Source" value={contact.leadSource || '—'} />
                          <FieldRow
                            label="Contact Name"
                            value={`${contact.salutation ? `${contact.salutation} ` : ''}${contact.name}`}
                          />
                          <FieldRow label="Vendor Name" value={contact.vendorName || '—'} />
                          <FieldRow label="Title" value={contact.designation || '—'} />
                          <FieldRow label="Department" value={contact.department || '—'} />
                          <FieldRow
                            label="Home Phone"
                            value={
                              contact.homePhone ? (
                                <span className="inline-flex items-center gap-2">
                                  <span>{contact.homePhone}</span>
                                  <a
                                    href={`tel:${String(contact.homePhone).replace(/\s/g, '')}`}
                                    title={`Call ${contact.homePhone}`}
                                    className="w-4 h-4 rounded-full bg-[#10B981] text-white inline-flex items-center justify-center"
                                  >
                                    <Phone size={9} className="fill-current" />
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setWhatsappPreferredField('homePhone');
                                      setWhatsappModalOpen(true);
                                    }}
                                    title={`Send WhatsApp to ${contact.homePhone}`}
                                    className="w-4 h-4 rounded-full bg-[#16A34A] text-white inline-flex items-center justify-center"
                                  >
                                    <WhatsAppIcon size={9.5} />
                                  </button>
                                </span>
                              ) : (
                                '—'
                              )
                            }
                          />
                          <FieldRow label="Fax" value={contact.fax || '—'} />
                          <FieldRow label="Date of Birth" value={contact.dateOfBirth || '—'} />
                          <FieldRow label="Asst Phone" value={contact.asstPhone || '—'} />
                          <FieldRow label="Email Opt Out" value={contact.emailOptOut ? 'Yes' : '—'} />
                          <FieldRow
                            label="Skype ID"
                            value={
                              contact.skypeId ? (
                                <span className="text-[#1262E0]">{contact.skypeId}</span>
                              ) : (
                                '—'
                              )
                            }
                          />
                          <FieldRow label="Secondary Email" value={contact.secondaryEmail || '—'} />
                          <FieldRow
                            label="Twitter"
                            value={
                              contact.twitter ? (
                                <span className="text-[#1262E0]">@{String(contact.twitter).replace(/^@/, '')}</span>
                              ) : (
                                '—'
                              )
                            }
                          />
                          <FieldRow
                            label="Reporting To"
                            value={
                              reportingToContact ? (
                                <button
                                  type="button"
                                  onClick={() => onSelectContact?.(reportingToContact.id)}
                                  className="text-[#1262E0] hover:underline font-medium"
                                >
                                  {reportingToContact.name}
                                </button>
                              ) : (
                                '—'
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* SECTION B: Address Information */}
                    <div>
                      <h2 className="text-[13.5px] font-bold text-[#0F172A] mb-3">
                        Address Information
                      </h2>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10">
                        <div>
                          <FieldRow label="Mailing Street" value={contact.mailingStreet || contact.mailingFlat || '—'} />
                          <FieldRow label="Mailing City" value={contact.mailingCity || contact.city || '—'} />
                          <FieldRow label="Mailing State" value={contact.mailingState || '—'} />
                          <FieldRow label="Mailing Zip" value={contact.mailingZip || '—'} />
                          <FieldRow label="Mailing Country" value={contact.mailingCountry || 'India'} />
                          <FieldRow label="Mailing Address" value={formattedMailingAddress || '—'} />
                        </div>
                        <div>
                          <FieldRow label="Other Street" value={contact.otherStreet || contact.otherFlat || '—'} />
                          <FieldRow label="Other City" value={contact.otherCity || '—'} />
                          <FieldRow label="Other State" value={contact.otherState || '—'} />
                          <FieldRow label="Other Zip" value={contact.otherZip || '—'} />
                          <FieldRow label="Other Country" value={contact.otherCountry || '—'} />
                          <FieldRow label="Other Address" value={formattedOtherAddress || '—'} />
                        </div>
                      </div>
                    </div>

                    {/* SECTION C: Description Information */}
                    <div>
                      <h2 className="text-[13.5px] font-bold text-[#0F172A] mb-3">
                        Description Information
                      </h2>
                      <div className="max-w-3xl">
                        <FieldRow label="Description" value={contact.description || '—'} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* =========================================================== */}
              {/* 4. STACKED RELATED LIST SECTIONS (All 18 Zoho Sections)     */}
              {/* =========================================================== */}

              {/* 4.1 NOTES */}
              <div id="related-section-notes" className="bg-white rounded-md border border-[#DCE3EE] shadow-2xs overflow-hidden">
                <div className="px-5 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-[13.5px] font-bold text-[#0F172A]">Notes</h3>
                    <select
                      aria-label="Sort notes"
                      value={noteSortOrder}
                      onChange={(e) => setNoteSortOrder(e.target.value)}
                      className="h-6 px-2 rounded border border-[#CBD5E1] bg-white text-[11.5px] text-[#334155]"
                    >
                      <option value="recent_last">Recent Last</option>
                      <option value="recent_first">Recent First</option>
                    </select>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <form onSubmit={handleAddNote} className="flex gap-2 max-w-2xl">
                    <input
                      type="text"
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      placeholder="Add a note..."
                      aria-label="Add a note"
                      className="flex-1 h-8 px-3 rounded border border-[#CBD5E1] text-[12.5px] focus:border-[#1262E0] focus:outline-none"
                    />
                    {noteInput.trim() && (
                      <button
                        type="submit"
                        className="h-8 px-3 rounded bg-[#1262E0] text-white text-[12px] font-semibold hover:bg-[#0B4BB8]"
                      >
                        Save
                      </button>
                    )}
                  </form>

                  {relNotes.length > 0 && (
                    <div className="space-y-2 pt-1">
                      {relNotes.map((n) => (
                        <div key={n.id} className="p-2.5 rounded border border-[#E2E8F0] bg-[#F8FAFC] text-[12.5px]">
                          <div className="font-semibold text-[#0F172A]">{n.title || 'Note'}</div>
                          <p className="text-[#334155] mt-0.5">{n.content}</p>
                          <div className="text-[11px] text-[#64748B] mt-1">
                            Added by {userName(n.ownerId || contact.ownerId)} · {n.createdDate || 'Today'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 4.2 CONNECTED RECORDS */}
              <div id="related-section-connectedRecords" className="bg-white rounded-md border border-[#DCE3EE] shadow-2xs overflow-hidden">
                <div className="px-5 py-2.5 border-b border-[#E2E8F0] flex items-center justify-between">
                  <h3 className="text-[13.5px] font-bold text-[#0F172A]">Connected Records</h3>
                  <button
                    type="button"
                    onClick={() =>
                      setQuickAddModal({
                        moduleKey: 'connectedRecords',
                        title: 'Connect Record',
                        label: 'Connected Record Name',
                        value: '',
                      })
                    }
                    className="h-7 px-2.5 rounded border border-[#93C5FD] bg-white text-[#1262E0] hover:bg-[#EFF6FF] text-[12px] font-medium inline-flex items-center gap-1"
                  >
                    <span>Add Record</span>
                    <ChevronDown size={12} />
                  </button>
                </div>
                <div className="p-4 text-[12.5px]">
                  {relConnected.length === 0 ? (
                    <p className="text-[#64748B]">No records found</p>
                  ) : (
                    <div className="space-y-1.5">
                      {relConnected.map((r) => (
                        <div key={r.id} className="flex items-center justify-between py-1.5 border-b border-[#F1F5F9]">
                          <span className="font-medium text-[#0F172A]">{r.name || r.leadName || r.title}</span>
                          <span className="text-[11.5px] text-[#64748B]">{r.status || 'Connected'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 4.3 CADENCES */}
              <div id="related-section-cadences" className="bg-white rounded-md border border-[#DCE3EE] shadow-2xs overflow-hidden">
                <div className="px-5 py-2.5 border-b border-[#E2E8F0] flex items-center justify-between">
                  <h3 className="text-[13.5px] font-bold text-[#0F172A]">Cadences</h3>
                  <button
                    type="button"
                    onClick={() => {
                      addContactRelatedRecord('cadences', {
                        contactId: contact.id,
                        cadenceName: 'Enterprise Q4 Follow-Up Sequence',
                        status: 'Active',
                      });
                      toast.success('Enrolled contact in Enterprise Q4 Follow-Up Sequence');
                    }}
                    className="h-7 px-3 rounded border border-[#93C5FD] bg-white text-[#1262E0] hover:bg-[#EFF6FF] text-[12px] font-medium"
                  >
                    Enroll
                  </button>
                </div>
                <div className="p-4 text-[12.5px]">
                  {relCadences.length === 0 ? (
                    <p className="text-[#64748B]">No records found</p>
                  ) : (
                    <div className="space-y-1.5">
                      {relCadences.map((c) => (
                        <div key={c.id} className="flex items-center justify-between py-1.5 border-b border-[#F1F5F9]">
                          <span className="font-medium text-[#0F172A]">{c.cadenceName || c.name}</span>
                          <span className="px-2 py-0.5 rounded bg-[#ECFDF5] text-[#047857] text-[11px] font-semibold">
                            {c.status || 'Active'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 4.4 ATTACHMENTS */}
              <div id="related-section-attachments" className="bg-white rounded-md border border-[#DCE3EE] shadow-2xs overflow-hidden">
                <div className="px-5 py-2.5 border-b border-[#E2E8F0] flex items-center justify-between">
                  <h3 className="text-[13.5px] font-bold text-[#0F172A]">Attachments</h3>
                  <button
                    type="button"
                    onClick={() =>
                      setQuickAddModal({
                        moduleKey: 'attachments',
                        title: 'Attach Document',
                        label: 'File Name (e.g. NDA_Signed_2026.pdf)',
                        value: '',
                      })
                    }
                    className="h-7 px-2.5 rounded border border-[#93C5FD] bg-white text-[#1262E0] hover:bg-[#EFF6FF] text-[12px] font-medium inline-flex items-center gap-1"
                  >
                    <span>Attach</span>
                    <ChevronDown size={12} />
                  </button>
                </div>
                <div className="p-4 text-[12.5px]">
                  {relAttachments.length === 0 ? (
                    <p className="text-[#64748B]">No Attachment</p>
                  ) : (
                    <div className="space-y-1.5">
                      {relAttachments.map((att) => (
                        <div key={att.id} className="flex items-center justify-between py-1.5 border-b border-[#F1F5F9]">
                          <span className="inline-flex items-center gap-1.5 font-medium text-[#1262E0]">
                            <Paperclip size={13} /> {att.fileName || att.name || att.title}
                          </span>
                          <span className="text-[11.5px] text-[#64748B]">{att.createdDate || 'Today'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 4.5 DEALS (Full Zoho Table with clickable links) */}
              <div id="related-section-deals" className="bg-white rounded-md border border-[#DCE3EE] shadow-2xs overflow-hidden">
                <div className="px-5 py-2.5 border-b border-[#E2E8F0] flex items-center justify-between">
                  <h3 className="text-[13.5px] font-bold text-[#0F172A]">Deals</h3>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => navigate(`/deals?create=1&contact=${contact.id}&account=${contact.accountId}`)}
                      className="h-7 px-3 rounded border border-[#93C5FD] bg-white text-[#1262E0] hover:bg-[#EFF6FF] text-[12px] font-medium"
                    >
                      New Deal
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  {relDeals.length === 0 ? (
                    <div className="p-4 text-[12.5px] text-[#64748B]">No records found</div>
                  ) : (
                    <table className="w-full text-left border-collapse text-[12.5px]">
                      <thead>
                        <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#475569] font-semibold">
                          <th className="py-2 px-4">Deal Name</th>
                          <th className="py-2 px-4">Amount</th>
                          <th className="py-2 px-4">Stage</th>
                          <th className="py-2 px-4">Probability (%)</th>
                          <th className="py-2 px-4">Closing Date</th>
                          <th className="py-2 px-4">Type</th>
                          <th className="py-2 px-4">Deal Owner</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0]">
                        {relDeals.map((d) => (
                          <tr key={d.id} className="hover:bg-[#F8FAFC]">
                            <td className="py-2 px-4 font-semibold">
                              <Link
                                to={`/deals?open=${d.id}`}
                                className="text-[#1262E0] hover:underline"
                              >
                                {d.name}
                              </Link>
                            </td>
                            <td className="py-2 px-4 font-medium text-[#0F172A]">{fmtINR(d.amount)}</td>
                            <td className="py-2 px-4 text-[#334155]">{d.stage}</td>
                            <td className="py-2 px-4 text-[#334155]">{d.probability ?? 50}</td>
                            <td className="py-2 px-4 text-[#475569]">{fmtDate(d.closingDate)}</td>
                            <td className="py-2 px-4 text-[#475569]">{d.type || 'New Business'}</td>
                            <td className="py-2 px-4 text-[#334155]">{userName(d.ownerId)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* 4.6 OPEN ACTIVITIES (3-Column Grid matching Screenshot 2) */}
              <div id="related-section-openActivities" className="bg-white rounded-md border border-[#DCE3EE] shadow-2xs overflow-hidden">
                <div className="px-5 py-2.5 border-b border-[#E2E8F0] flex items-center justify-between">
                  <h3 className="text-[13.5px] font-bold text-[#0F172A]">Open Activities</h3>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setNewTaskModalOpen(true)}
                      className="h-7 px-3 rounded border border-[#93C5FD] bg-white text-[#1262E0] hover:bg-[#EFF6FF] text-[12px] font-medium"
                    >
                      + Add New
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#E2E8F0] text-[12.5px]">
                  {/* Open Tasks */}
                  <div className="p-4 space-y-2">
                    <div className="font-semibold text-[#0F172A] border-b border-[#F1F5F9] pb-1.5">
                      Open Tasks <span className="text-[#64748B] font-normal">{openTasks.length}</span>
                    </div>
                    {openTasks.length === 0 ? (
                      <p className="text-[#64748B] text-[12px] py-2">No records found</p>
                    ) : (
                      openTasks.map((t) => (
                        <div key={t.id} className="p-2 rounded border border-[#E2E8F0] bg-[#F8FAFC] space-y-1">
                          <div className="font-semibold text-[#1262E0]">{t.title || t.subject}</div>
                          <div className="text-[11.5px] text-[#475569]">{t.due || t.dueDate || 'Upcoming'}</div>
                          <div className="text-[11.5px] text-[#64748B]">
                            Status: {t.status || 'In Progress'} · Priority: {t.priority || 'High'}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Open Meetings */}
                  <div className="p-4 space-y-2">
                    <div className="font-semibold text-[#0F172A] border-b border-[#F1F5F9] pb-1.5">
                      Open Meetings <span className="text-[#64748B] font-normal">{openMeetings.length}</span>
                    </div>
                    {openMeetings.length === 0 ? (
                      <p className="text-[#64748B] text-[12px] py-2">No records found</p>
                    ) : (
                      openMeetings.map((m) => (
                        <div key={m.id} className="p-2 rounded border border-[#E2E8F0] bg-[#F8FAFC] space-y-1">
                          <div className="font-semibold text-[#0F172A]">{m.title || m.subject}</div>
                          <div className="text-[11.5px] text-[#64748B]">{m.fromDate || m.createdDate}</div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Open Calls */}
                  <div className="p-4 space-y-2">
                    <div className="font-semibold text-[#0F172A] border-b border-[#F1F5F9] pb-1.5">
                      Open Calls <span className="text-[#64748B] font-normal">{openCalls.length}</span>
                    </div>
                    {openCalls.length === 0 ? (
                      <p className="text-[#64748B] text-[12px] py-2">No records found</p>
                    ) : (
                      openCalls.map((c) => (
                        <div key={c.id} className="p-2 rounded border border-[#E2E8F0] bg-[#F8FAFC] space-y-1">
                          <Link
                            to={`/calls?open=${c.id}`}
                            className="font-semibold text-[#1262E0] hover:underline block"
                          >
                            {c.subject}
                          </Link>
                          <div className="text-[11.5px] text-[#64748B]">{fmtDate(c.dateTime)}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* 4.7 CLOSED ACTIVITIES (3-Column Grid matching Screenshot 2) */}
              <div id="related-section-closedActivities" className="bg-white rounded-md border border-[#DCE3EE] shadow-2xs overflow-hidden">
                <div className="px-5 py-2.5 border-b border-[#E2E8F0] flex items-center justify-between">
                  <h3 className="text-[13.5px] font-bold text-[#0F172A]">Closed Activities</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#E2E8F0] text-[12.5px]">
                  {/* Closed Tasks */}
                  <div className="p-4 space-y-2">
                    <div className="font-semibold text-[#0F172A] border-b border-[#F1F5F9] pb-1.5">
                      Closed Tasks <span className="text-[#64748B] font-normal">{closedTasks.length}</span>
                    </div>
                    {closedTasks.length === 0 ? (
                      <p className="text-[#64748B] text-[12px] py-2">No records found</p>
                    ) : (
                      closedTasks.map((t) => (
                        <div key={t.id} className="p-2 rounded border border-[#E2E8F0] bg-[#F8FAFC]">
                          <div className="font-medium text-[#334155] line-through">{t.title || t.subject}</div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Closed Meetings */}
                  <div className="p-4 space-y-2">
                    <div className="font-semibold text-[#0F172A] border-b border-[#F1F5F9] pb-1.5">
                      Closed Meetings <span className="text-[#64748B] font-normal">{closedMeetings.length}</span>
                    </div>
                    {closedMeetings.length === 0 ? (
                      <p className="text-[#64748B] text-[12px] py-2">No records found</p>
                    ) : (
                      closedMeetings.map((m) => (
                        <div key={m.id} className="p-2 rounded border border-[#E2E8F0] bg-[#F8FAFC]">
                          <div className="font-medium text-[#334155]">{m.title || m.subject}</div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Closed Calls */}
                  <div className="p-4 space-y-2">
                    <div className="font-semibold text-[#0F172A] border-b border-[#F1F5F9] pb-1.5">
                      Closed Calls <span className="text-[#64748B] font-normal">{closedCalls.length}</span>
                    </div>
                    {closedCalls.length === 0 ? (
                      <p className="text-[#64748B] text-[12px] py-2">No records found</p>
                    ) : (
                      closedCalls.map((c) => (
                        <div key={c.id} className="p-2 rounded border border-[#E2E8F0] bg-[#F8FAFC] space-y-1">
                          <Link
                            to={`/calls?open=${c.id}`}
                            className="font-semibold text-[#1262E0] hover:underline block"
                          >
                            {c.subject}
                          </Link>
                          <div className="text-[11.5px] text-[#64748B]">
                            {fmtDate(c.dateTime)} · {userName(c.ownerId)} · {c.type || 'Outbound'}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* 4.8 INVITED MEETINGS */}
              <div id="related-section-invitedMeetings" className="bg-white rounded-md border border-[#DCE3EE] shadow-2xs overflow-hidden">
                <div className="px-5 py-2.5 border-b border-[#E2E8F0]">
                  <h3 className="text-[13.5px] font-bold text-[#0F172A]">Invited Meetings</h3>
                </div>
                <div className="p-4 text-[12.5px] text-[#64748B]">
                  {relInvitedMeetings.length === 0 ? (
                    'No records found'
                  ) : (
                    <div className="space-y-1.5">
                      {relInvitedMeetings.map((m) => (
                        <div key={m.id} className="font-medium text-[#0F172A]">{m.title || m.eventName}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 4.9 PRODUCTS */}
              <div id="related-section-products" className="bg-white rounded-md border border-[#DCE3EE] shadow-2xs overflow-hidden">
                <div className="px-5 py-2.5 border-b border-[#E2E8F0] flex items-center justify-between">
                  <h3 className="text-[13.5px] font-bold text-[#0F172A]">Products</h3>
                  <button
                    type="button"
                    onClick={() =>
                      setQuickAddModal({
                        moduleKey: 'contactProducts',
                        title: 'Add Product to Contact',
                        label: 'Product Name',
                        value: '',
                      })
                    }
                    className="h-7 px-3 rounded border border-[#93C5FD] bg-white text-[#1262E0] hover:bg-[#EFF6FF] text-[12px] font-medium"
                  >
                    Add Products
                  </button>
                </div>
                <div className="p-4 text-[12.5px]">
                  {relProducts.length === 0 ? (
                    <p className="text-[#64748B]">No records found</p>
                  ) : (
                    <div className="space-y-1.5">
                      {relProducts.map((p) => (
                        <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-[#F1F5F9]">
                          <span className="font-medium text-[#0F172A]">{p.productName || p.name || p.title}</span>
                          <span className="text-[#64748B]">{p.status || 'Active'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 4.10 CASES */}
              <div id="related-section-cases" className="bg-white rounded-md border border-[#DCE3EE] shadow-2xs overflow-hidden">
                <div className="px-5 py-2.5 border-b border-[#E2E8F0] flex items-center justify-between">
                  <h3 className="text-[13.5px] font-bold text-[#0F172A]">Cases</h3>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setQuickAddModal({
                          moduleKey: 'cases',
                          title: 'Create Support Case',
                          label: 'Case Subject',
                          value: '',
                        })
                      }
                      className="h-7 px-3 rounded border border-[#93C5FD] bg-white text-[#1262E0] hover:bg-[#EFF6FF] text-[12px] font-medium"
                    >
                      New
                    </button>
                  </div>
                </div>
                <div className="p-4 text-[12.5px]">
                  {relCases.length === 0 ? (
                    <p className="text-[#64748B]">No records found</p>
                  ) : (
                    <div className="space-y-1.5">
                      {relCases.map((c) => (
                        <div key={c.id} className="flex items-center justify-between py-1.5 border-b border-[#F1F5F9]">
                          <span className="font-medium text-[#0F172A]">{c.caseNumber ? `${c.caseNumber} — ` : ''}{c.subject || c.title}</span>
                          <span className="text-[#64748B]">{c.status || 'Open'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 4.11 QUOTES */}
              <div id="related-section-quotes" className="bg-white rounded-md border border-[#DCE3EE] shadow-2xs overflow-hidden">
                <div className="px-5 py-2.5 border-b border-[#E2E8F0] flex items-center justify-between">
                  <h3 className="text-[13.5px] font-bold text-[#0F172A]">Quotes</h3>
                  <button
                    type="button"
                    onClick={() =>
                      setQuickAddModal({
                        moduleKey: 'quotes',
                        title: 'Create Quote',
                        label: 'Quote Subject',
                        value: '',
                      })
                    }
                    className="h-7 px-3 rounded border border-[#93C5FD] bg-white text-[#1262E0] hover:bg-[#EFF6FF] text-[12px] font-medium"
                  >
                    New
                  </button>
                </div>
                <div className="p-4 text-[12.5px]">
                  {relQuotes.length === 0 ? (
                    <p className="text-[#64748B]">No records found</p>
                  ) : (
                    <div className="space-y-1.5">
                      {relQuotes.map((q) => (
                        <div key={q.id} className="flex items-center justify-between py-1.5 border-b border-[#F1F5F9]">
                          <span className="font-medium text-[#0F172A]">{q.subject || q.title || q.quoteNumber}</span>
                          <span className="text-[#64748B]">{q.stage || 'Draft'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 4.12 SALES ORDERS */}
              <div id="related-section-salesOrders" className="bg-white rounded-md border border-[#DCE3EE] shadow-2xs overflow-hidden">
                <div className="px-5 py-2.5 border-b border-[#E2E8F0] flex items-center justify-between">
                  <h3 className="text-[13.5px] font-bold text-[#0F172A]">Sales Orders</h3>
                  <button
                    type="button"
                    onClick={() =>
                      setQuickAddModal({
                        moduleKey: 'salesOrders',
                        title: 'Create Sales Order',
                        label: 'Sales Order Subject',
                        value: '',
                      })
                    }
                    className="h-7 px-3 rounded border border-[#93C5FD] bg-white text-[#1262E0] hover:bg-[#EFF6FF] text-[12px] font-medium"
                  >
                    New
                  </button>
                </div>
                <div className="p-4 text-[12.5px]">
                  {relSalesOrders.length === 0 ? (
                    <p className="text-[#64748B]">No records found</p>
                  ) : (
                    <div className="space-y-1.5">
                      {relSalesOrders.map((s) => (
                        <div key={s.id} className="flex items-center justify-between py-1.5 border-b border-[#F1F5F9]">
                          <span className="font-medium text-[#0F172A]">{s.soNumber || s.subject || s.title}</span>
                          <span className="text-[#64748B]">{s.status || 'Approved'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 4.13 PURCHASE ORDERS */}
              <div id="related-section-purchaseOrders" className="bg-white rounded-md border border-[#DCE3EE] shadow-2xs overflow-hidden">
                <div className="px-5 py-2.5 border-b border-[#E2E8F0] flex items-center justify-between">
                  <h3 className="text-[13.5px] font-bold text-[#0F172A]">Purchase Orders</h3>
                  <button
                    type="button"
                    onClick={() =>
                      setQuickAddModal({
                        moduleKey: 'purchaseOrders',
                        title: 'Create Purchase Order',
                        label: 'Purchase Order Subject',
                        value: '',
                      })
                    }
                    className="h-7 px-3 rounded border border-[#93C5FD] bg-white text-[#1262E0] hover:bg-[#EFF6FF] text-[12px] font-medium"
                  >
                    New
                  </button>
                </div>
                <div className="p-4 text-[12.5px]">
                  {relPurchaseOrders.length === 0 ? (
                    <p className="text-[#64748B]">No records found</p>
                  ) : (
                    <div className="space-y-1.5">
                      {relPurchaseOrders.map((po) => (
                        <div key={po.id} className="flex items-center justify-between py-1.5 border-b border-[#F1F5F9]">
                          <span className="font-medium text-[#0F172A]">{po.poNumber || po.subject || po.title}</span>
                          <span className="text-[#64748B]">{po.status || 'Created'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 4.14 EMAILS (with Mails / Drafts / Scheduled sub-tabs matching Screenshot 2) */}
              <div id="related-section-emails" className="bg-white rounded-md border border-[#DCE3EE] shadow-2xs overflow-hidden">
                <div className="px-5 py-2.5 border-b border-[#E2E8F0] flex items-center justify-between">
                  <h3 className="text-[13.5px] font-bold text-[#0F172A]">Emails</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setComposeData({
                        subject: `Follow-up with ${contact.name}`,
                        body: `Hi ${contact.firstName || contact.name},\n\nFollowing up regarding our recent discussion.\n\nBest regards,\n${userName(contact.ownerId)}`,
                      });
                      setComposeOpen(true);
                    }}
                    className="h-7 px-3 rounded border border-[#93C5FD] bg-white text-[#1262E0] hover:bg-[#EFF6FF] text-[12px] font-medium"
                  >
                    Compose Email
                  </button>
                </div>
                <div className="px-5 border-b border-[#E2E8F0] flex items-center gap-5 text-[12px]">
                  {['Mails', 'Drafts', 'Scheduled'].map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setEmailSubTab(tab)}
                      className={`py-2 border-b-2 transition-colors ${
                        emailSubTab === tab
                          ? 'border-[#1262E0] text-[#1262E0] font-semibold'
                          : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="p-4 text-[12.5px]">
                  {emailSubTab !== 'Mails' || relEmails.length === 0 ? (
                    <p className="text-center text-[#64748B] py-2">No records found</p>
                  ) : (
                    <div className="space-y-2">
                      {relEmails.map((em) => (
                        <div key={em.id} className="flex items-center justify-between py-1.5 border-b border-[#F1F5F9]">
                          <div>
                            <div className="font-medium text-[#0F172A]">{em.subject}</div>
                            <div className="text-[11px] text-[#64748B]">To: {contact.email} · {em.createdDate || 'Today'}</div>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1262E0] text-[11px] font-medium">
                            {em.status || 'Delivered'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 4.15 INVOICES (Links to Zoho Finance records) */}
              <div id="related-section-invoices" className="bg-white rounded-md border border-[#DCE3EE] shadow-2xs overflow-hidden">
                <div className="px-5 py-2.5 border-b border-[#E2E8F0] flex items-center justify-between">
                  <h3 className="text-[13.5px] font-bold text-[#0F172A]">Invoices</h3>
                  <button
                    type="button"
                    onClick={() => navigate(`/zoho-finance?create=1&account=${contact.accountId}`)}
                    className="h-7 px-3 rounded border border-[#93C5FD] bg-white text-[#1262E0] hover:bg-[#EFF6FF] text-[12px] font-medium"
                  >
                    New
                  </button>
                </div>
                <div className="p-4 text-[12.5px]">
                  {relInvoices.length === 0 ? (
                    <p className="text-[#64748B]">No records found</p>
                  ) : (
                    <div className="space-y-1.5">
                      {relInvoices.map((inv) => (
                        <div key={inv.id} className="flex items-center justify-between py-1.5 border-b border-[#F1F5F9]">
                          <Link
                            to={`/zoho-finance?open=${inv.id}`}
                            className="font-semibold text-[#1262E0] hover:underline"
                          >
                            {inv.number} ({inv.type || 'Sales Invoice'})
                          </Link>
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-[#0F172A]">{fmtINR(inv.amount)}</span>
                            <span className="text-[11.5px] text-[#64748B]">{inv.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 4.16 CAMPAIGNS */}
              <div id="related-section-campaigns" className="bg-white rounded-md border border-[#DCE3EE] shadow-2xs overflow-hidden">
                <div className="px-5 py-2.5 border-b border-[#E2E8F0] flex items-center justify-between">
                  <h3 className="text-[13.5px] font-bold text-[#0F172A]">Campaigns</h3>
                  <button
                    type="button"
                    onClick={() =>
                      setQuickAddModal({
                        moduleKey: 'campaigns',
                        title: 'Add Campaign to Contact',
                        label: 'Campaign Name',
                        value: '',
                      })
                    }
                    className="h-7 px-3 rounded border border-[#93C5FD] bg-white text-[#1262E0] hover:bg-[#EFF6FF] text-[12px] font-medium"
                  >
                    Add Campaigns
                  </button>
                </div>
                <div className="p-4 text-[12.5px]">
                  {relCampaigns.length === 0 ? (
                    <p className="text-[#64748B]">No records found</p>
                  ) : (
                    <div className="space-y-1.5">
                      {relCampaigns.map((camp) => (
                        <div key={camp.id} className="flex items-center justify-between py-1.5 border-b border-[#F1F5F9]">
                          <span className="font-medium text-[#0F172A]">{camp.campaignName || camp.name || camp.title}</span>
                          <span className="text-[#64748B]">{camp.status || 'Active'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 4.17 SOCIAL (Matches Screenshot 2 layout) */}
              <div id="related-section-social" className="bg-white rounded-md border border-[#DCE3EE] shadow-2xs overflow-hidden">
                <div className="px-5 py-2.5 border-b border-[#E2E8F0]">
                  <h3 className="text-[13.5px] font-bold text-[#0F172A]">Social</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-[#E2E8F0]">
                  <div className="md:col-span-4 p-4 space-y-2.5 text-[12.5px]">
                    <button
                      type="button"
                      onClick={handleOpenEdit}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#334155] font-medium"
                    >
                      <Globe size={14} className="text-[#0284C7]" />
                      <span>
                        {contact.twitter ? `Twitter: @${String(contact.twitter).replace(/^@/, '')}` : 'Associate Twitter'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenEdit}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#334155] font-medium"
                    >
                      <Share2 size={14} className="text-[#1262E0]" />
                      <span>Associate Facebook</span>
                    </button>
                  </div>
                  <div className="md:col-span-8 p-8 flex flex-col items-center justify-center text-center text-[#64748B] text-[12.5px]">
                    <Users size={32} className="text-[#CBD5E1] mb-2" />
                    <p>You can now view the social interactions of this contact here.</p>
                  </div>
                </div>
              </div>

              {/* 4.18 REPORTING CONTACTS */}
              <div id="related-section-reportingContacts" className="bg-white rounded-md border border-[#DCE3EE] shadow-2xs overflow-hidden">
                <div className="px-5 py-2.5 border-b border-[#E2E8F0] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[13.5px] font-bold text-[#0F172A]">Reporting Contacts</h3>
                    <span className="text-[11.5px] text-[#64748B]">Hierarchy View</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/contacts/create')}
                    className="h-7 px-3 rounded border border-[#93C5FD] bg-white text-[#1262E0] hover:bg-[#EFF6FF] text-[12px] font-medium"
                  >
                    New
                  </button>
                </div>
                <div className="p-4 text-[12.5px]">
                  {relReportingContacts.length === 0 ? (
                    <p className="text-[#64748B]">No records found</p>
                  ) : (
                    <div className="space-y-1.5">
                      {relReportingContacts.map((rc) => (
                        <div key={rc.id} className="flex items-center justify-between py-1.5 border-b border-[#F1F5F9]">
                          <button
                            type="button"
                            onClick={() => onSelectContact?.(rc.id)}
                            className="font-semibold text-[#1262E0] hover:underline"
                          >
                            {rc.name}
                          </button>
                          <span className="text-[#64748B]">{rc.designation || rc.department || 'Contact'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 4.19 WORKFLOW RULES — CHRONOLOGICAL TIMELINE VIEW */}
              <div
                id="related-section-workflowRules"
                className="scroll-mt-28"
              >
                <RecordTimeline recordType="contact" record={contact} />
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 2: TIMELINE                                                 */}
          {/* =============================================================== */}
          {activeTab === 'timeline' && (
            <div className="p-3 sm:p-4">
              <RecordTimeline recordType="contact" record={contact} />
            </div>
          )}
        </div>
      </div>

      {/* ================================================================= */}
      {/* 5. EDIT CONTACT MODAL (Prefilled with exact contact's saved data) */}
      {/* ================================================================= */}
      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Edit Contact — ${contact.name}`}
        subtitle="Update contact information, address details, and description."
        size="xl"
      >
        {editForm && (
          <form onSubmit={handleSaveEdit} className="space-y-5 text-[12.5px]">
            {/* Contact Information */}
            <div>
              <h3 className="text-[13px] font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-1.5 mb-3">
                Contact Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11.5px] font-medium text-[#475569] mb-1">Salutation</label>
                  <select
                    value={editForm.salutation}
                    onChange={(e) => setEditForm((p) => ({ ...p, salutation: e.target.value }))}
                    className="input h-8 text-[12.5px]"
                  >
                    {SALUTATIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-[#475569] mb-1">First Name</label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm((p) => ({ ...p, firstName: e.target.value }))}
                    className="input h-8 text-[12.5px]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-[#475569] mb-1">
                    Last Name <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.lastName}
                    onChange={(e) => setEditForm((p) => ({ ...p, lastName: e.target.value }))}
                    className="input h-8 text-[12.5px]"
                  />
                  {editErrors.lastName && (
                    <span className="text-[11px] text-[#DC2626]">{editErrors.lastName}</span>
                  )}
                </div>

                <div>
                  <label className="block text-[11.5px] font-medium text-[#475569] mb-1">Account Name</label>
                  <select
                    value={editForm.accountId}
                    onChange={(e) => setEditForm((p) => ({ ...p, accountId: e.target.value }))}
                    className="input h-8 text-[12.5px]"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11.5px] font-medium text-[#475569] mb-1">Contact Owner</label>
                  <select
                    value={editForm.ownerId}
                    onChange={(e) => setEditForm((p) => ({ ...p, ownerId: e.target.value }))}
                    className="input h-8 text-[12.5px]"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11.5px] font-medium text-[#475569] mb-1">Lead Source</label>
                  <select
                    value={editForm.leadSource}
                    onChange={(e) => setEditForm((p) => ({ ...p, leadSource: e.target.value }))}
                    className="input h-8 text-[12.5px]"
                  >
                    {LEAD_SOURCES.map((ls) => (
                      <option key={ls} value={ls}>{ls}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11.5px] font-medium text-[#475569] mb-1">Title</label>
                  <input
                    type="text"
                    value={editForm.designation}
                    onChange={(e) => setEditForm((p) => ({ ...p, designation: e.target.value }))}
                    className="input h-8 text-[12.5px]"
                  />
                </div>

                <div>
                  <label className="block text-[11.5px] font-medium text-[#475569] mb-1">Department</label>
                  <input
                    type="text"
                    value={editForm.department}
                    onChange={(e) => setEditForm((p) => ({ ...p, department: e.target.value }))}
                    className="input h-8 text-[12.5px]"
                  />
                </div>

                <div>
                  <label className="block text-[11.5px] font-medium text-[#475569] mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                    className="input h-8 text-[12.5px]"
                  />
                  {editErrors.email && (
                    <span className="text-[11px] text-[#DC2626]">{editErrors.email}</span>
                  )}
                </div>

                <div>
                  <label className="block text-[11.5px] font-medium text-[#475569] mb-1">Phone</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                    className="input h-8 text-[12.5px]"
                  />
                </div>

                <div>
                  <label className="block text-[11.5px] font-medium text-[#475569] mb-1">Mobile</label>
                  <input
                    type="text"
                    value={editForm.mobile}
                    onChange={(e) => setEditForm((p) => ({ ...p, mobile: e.target.value }))}
                    className="input h-8 text-[12.5px]"
                  />
                </div>

                <div>
                  <label className="block text-[11.5px] font-medium text-[#475569] mb-1">Secondary Email</label>
                  <input
                    type="email"
                    value={editForm.secondaryEmail}
                    onChange={(e) => setEditForm((p) => ({ ...p, secondaryEmail: e.target.value }))}
                    className="input h-8 text-[12.5px]"
                  />
                </div>

                <div>
                  <label className="block text-[11.5px] font-medium text-[#475569] mb-1">Vendor Name</label>
                  <input
                    type="text"
                    value={editForm.vendorName}
                    onChange={(e) => setEditForm((p) => ({ ...p, vendorName: e.target.value }))}
                    className="input h-8 text-[12.5px]"
                  />
                </div>

                <div>
                  <label className="block text-[11.5px] font-medium text-[#475569] mb-1">Skype ID</label>
                  <input
                    type="text"
                    value={editForm.skypeId}
                    onChange={(e) => setEditForm((p) => ({ ...p, skypeId: e.target.value }))}
                    className="input h-8 text-[12.5px]"
                  />
                </div>

                <div>
                  <label className="block text-[11.5px] font-medium text-[#475569] mb-1">Twitter</label>
                  <input
                    type="text"
                    value={editForm.twitter}
                    onChange={(e) => setEditForm((p) => ({ ...p, twitter: e.target.value }))}
                    className="input h-8 text-[12.5px]"
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h3 className="text-[13px] font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-1.5 mb-3">
                Address Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11.5px] font-medium text-[#475569] mb-1">Mailing Street</label>
                  <input
                    type="text"
                    value={editForm.mailingStreet}
                    onChange={(e) => setEditForm((p) => ({ ...p, mailingStreet: e.target.value }))}
                    className="input h-8 text-[12.5px]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-[#475569] mb-1">Mailing City</label>
                  <input
                    type="text"
                    value={editForm.mailingCity}
                    onChange={(e) => setEditForm((p) => ({ ...p, mailingCity: e.target.value }))}
                    className="input h-8 text-[12.5px]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-[#475569] mb-1">Mailing State</label>
                  <input
                    type="text"
                    value={editForm.mailingState}
                    onChange={(e) => setEditForm((p) => ({ ...p, mailingState: e.target.value }))}
                    className="input h-8 text-[12.5px]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-[#475569] mb-1">Mailing Zip</label>
                  <input
                    type="text"
                    value={editForm.mailingZip}
                    onChange={(e) => setEditForm((p) => ({ ...p, mailingZip: e.target.value }))}
                    className="input h-8 text-[12.5px]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-[#475569] mb-1">Mailing Country</label>
                  <input
                    type="text"
                    value={editForm.mailingCountry}
                    onChange={(e) => setEditForm((p) => ({ ...p, mailingCountry: e.target.value }))}
                    className="input h-8 text-[12.5px]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-[#475569] mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={editForm.tagInput}
                    onChange={(e) => setEditForm((p) => ({ ...p, tagInput: e.target.value }))}
                    className="input h-8 text-[12.5px]"
                  />
                </div>
              </div>
            </div>

            {/* Description Information */}
            <div>
              <h3 className="text-[13px] font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-1.5 mb-3">
                Description Information
              </h3>
              <textarea
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                className="input p-2.5 text-[12.5px] w-full"
                placeholder="Contact notes and description..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
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
      {/* 6. SEND EMAIL MODAL                                               */}
      {/* ================================================================= */}
      <Modal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        title={`Send Email to ${contact.name} (${contact.email})`}
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addContactRelatedRecord('emails', {
              contactId: contact.id,
              subject: composeData.subject,
              direction: 'Sent',
              status: 'Delivered',
              ownerId: contact.ownerId,
            });
            updateRecord('contacts', contact.id, {
              lastContacted: todayISO(),
              modifiedTime: todayISO(),
            });
            toast.success(`Email sent to ${contact.email}`);
            setComposeOpen(false);
          }}
          className="space-y-3 text-[12.5px]"
        >
          <div>
            <label className="block font-medium text-[#475569] mb-1">To</label>
            <input type="text" disabled value={contact.email} className="input h-8 bg-[#F8FAFC]" />
          </div>
          <div>
            <label className="block font-medium text-[#475569] mb-1">Subject</label>
            <input
              type="text"
              required
              value={composeData.subject}
              onChange={(e) => setComposeData((p) => ({ ...p, subject: e.target.value }))}
              className="input h-8"
            />
          </div>
          <div>
            <label className="block font-medium text-[#475569] mb-1">Message</label>
            <textarea
              rows={4}
              required
              value={composeData.body}
              onChange={(e) => setComposeData((p) => ({ ...p, body: e.target.value }))}
              className="input p-2"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setComposeOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <Send size={13.5} /> Send Email
            </button>
          </div>
        </form>
      </Modal>

      {/* ================================================================= */}
      {/* 6B. SEND WHATSAPP MODAL                                           */}
      {/* ================================================================= */}
      <WhatsAppComposerModal
        open={whatsappModalOpen}
        onClose={() => setWhatsappModalOpen(false)}
        recordType="Contact"
        recordName={contact.name}
        recordSubtitle={
          accountName(contact.accountId) && accountName(contact.accountId) !== '—'
            ? `${contact.title ? `${contact.title} · ` : ''}${accountName(contact.accountId)}`
            : contact.title || ''
        }
        mobile={contact.mobile}
        phone={contact.phone}
        otherPhone={contact.otherPhone}
        homePhone={contact.homePhone}
        preferredField={whatsappPreferredField}
        ownerName={userName(contact.ownerId)}
        defaultMessage={`Hi ${contact.firstName || contact.name},\n\nHope you are doing well. Following up on our recent conversation${
          accountName(contact.accountId) && accountName(contact.accountId) !== '—'
            ? ` with ${accountName(contact.accountId)}`
            : ''
        }.\n\nBest regards,\n${userName(contact.ownerId) || 'Sales Team'}`}
        onSavePhone={(updates) => {
          updateRecord('contacts', contact.id, {
            ...updates,
            modifiedTime: todayISO(),
          });
          toast.success(`Updated WhatsApp number on ${contact.name}`);
        }}
        onOpenedWhatsApp={({ number, mode }) => {
          toast.info(
            `Opened ${mode === 'web' ? 'WhatsApp Web' : 'WhatsApp'} for ${number}. Please confirm and press Send in WhatsApp.`
          );
        }}
      />

      {/* ================================================================= */}
      {/* 7. CREATE TASK MODAL                                              */}
      {/* ================================================================= */}
      <Modal
        open={newTaskModalOpen}
        onClose={() => setNewTaskModalOpen(false)}
        title={`Create Open Task for ${contact.name}`}
        size="sm"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newTaskTitle.trim()) return;
            addContactRelatedRecord('tasks', {
              contactId: contact.id,
              subject: newTaskTitle.trim(),
              title: newTaskTitle.trim(),
              due: newTaskDue,
              dueDate: newTaskDue,
              status: 'In Progress',
              priority: newTaskPriority,
              completed: false,
            });
            setNewTaskTitle('');
            setNewTaskModalOpen(false);
            toast.success('Created open task');
          }}
          className="space-y-3 text-[12.5px]"
        >
          <div>
            <label className="block font-medium text-[#475569] mb-1">Task Subject</label>
            <input
              type="text"
              required
              autoFocus
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="e.g. Register for upcoming CRM Webinar"
              className="input h-8"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-medium text-[#475569] mb-1">Due Date</label>
              <input
                type="date"
                value={newTaskDue}
                onChange={(e) => setNewTaskDue(e.target.value)}
                className="input h-8"
              />
            </div>
            <div>
              <label className="block font-medium text-[#475569] mb-1">Priority</label>
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value)}
                className="input h-8"
              >
                <option value="High">High</option>
                <option value="Normal">Normal</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setNewTaskModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Task
            </button>
          </div>
        </form>
      </Modal>

      {/* ================================================================= */}
      {/* 8. QUICK ADD RELATED RECORD MODAL                                 */}
      {/* ================================================================= */}
      <Modal
        open={Boolean(quickAddModal)}
        onClose={() => setQuickAddModal(null)}
        title={quickAddModal?.title || 'Add Related Record'}
        size="sm"
      >
        {quickAddModal && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!quickAddModal.value.trim()) return;
              const val = quickAddModal.value.trim();
              addContactRelatedRecord(quickAddModal.moduleKey, {
                contactId: contact.id,
                name: val,
                title: val,
                subject: val,
                fileName: val,
                productName: val,
                campaignName: val,
                status: 'Active',
              });
              toast.success(`Added to ${quickAddModal.title}`);
              setQuickAddModal(null);
            }}
            className="space-y-3 text-[12.5px]"
          >
            <div>
              <label className="block font-medium text-[#475569] mb-1">{quickAddModal.label}</label>
              <input
                type="text"
                required
                autoFocus
                value={quickAddModal.value}
                onChange={(e) => setQuickAddModal((p) => ({ ...p, value: e.target.value }))}
                className="input h-8"
              />
            </div>
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
      {/* 9. DELETE CONFIRMATION DIALOG                                     */}
      {/* ================================================================= */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        title="Delete Contact?"
        message={`Delete ${contact.name}? Linked deals and calls stay, but they will no longer reference this contact.`}
        onConfirm={() => {
          deleteRecords('contacts', [contact.id]);
          toast.success(`Deleted contact "${contact.name}"`);
          onBack?.();
        }}
      />
    </div>
  );
}

