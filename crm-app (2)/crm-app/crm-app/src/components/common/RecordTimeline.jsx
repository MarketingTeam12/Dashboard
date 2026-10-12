import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, AlertCircle, ArrowRight, Briefcase, Building2, Calendar,
  CheckCircle2, CheckSquare, Clock, ExternalLink, FileSpreadsheet,
  FileText, Filter, FolderKanban, GitBranch, History, Layers,
  Loader2, Mail, MessageCircle, Paperclip, Pencil, Phone,
  Play, PlusCircle, Receipt, RefreshCw, RotateCcw, Search,
  ShieldAlert, Sparkles, StickyNote, UserCheck, Users, Workflow,
  X, XCircle, Zap,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { fmtDuration, fmtINR, todayISO } from '../../utils/calculations';
import { getRelatedRecordsForAccount } from '../../utils/accountsFilterEngine';
import { getRelatedRecordsForContact } from '../../utils/contactsFilterEngine';

/**
 * Parse any date or ISO string into a comparable timestamp (ms) and display strings.
 */
function parseEventDate(rawDate, fallbackTime = '09:00:00') {
  if (!rawDate) {
    return {
      iso: '2026-09-01T09:00:00',
      dateOnly: '2026-09-01',
      sortTime: new Date('2026-09-01T09:00:00').getTime(),
      displayDate: 'Sep 1, 2026',
      displayTime: '09:00 AM',
      displayFull: 'Sep 1, 2026 · 09:00 AM',
    };
  }
  const str = String(rawDate).trim();
  const dateOnly = str.slice(0, 10);
  const hasTime = str.length > 10 && (str.includes('T') || str.includes(' '));
  const normalizedIso = hasTime ? str.replace(' ', 'T') : `${dateOnly}T${fallbackTime}`;
  const d = new Date(normalizedIso);
  const valid = !isNaN(d.getTime());
  const safeDate = valid ? d : new Date(`${dateOnly}T09:00:00`);
  const sortTime = isNaN(safeDate.getTime()) ? 0 : safeDate.getTime();

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const y = safeDate.getFullYear();
  const m = months[safeDate.getMonth()] || 'Oct';
  const day = safeDate.getDate();
  const displayDate = isNaN(day) ? dateOnly : `${m} ${day}, ${y}`;

  let displayTime = '';
  if (hasTime && valid) {
    const hrs = safeDate.getHours();
    const mins = String(safeDate.getMinutes()).padStart(2, '0');
    const ampm = hrs >= 12 ? 'PM' : 'AM';
    const h12 = hrs % 12 || 12;
    displayTime = `${h12}:${mins} ${ampm}`;
  } else {
    displayTime = '09:00 AM';
  }

  return {
    iso: normalizedIso,
    dateOnly,
    sortTime,
    displayDate,
    displayTime,
    displayFull: `${displayDate} · ${displayTime}`,
  };
}

const CATEGORY_META = {
  workflow: {
    label: 'Workflow Rule',
    icon: Workflow,
    bg: 'bg-[#F5F3FF]',
    text: 'text-[#7C3AED]',
    border: 'border-[#DDD6FE]',
    dot: 'bg-[#7C3AED]',
  },
  record: {
    label: 'Record Activity',
    icon: Pencil,
    bg: 'bg-[#EFF6FF]',
    text: 'text-[#1262E0]',
    border: 'border-[#BFDBFE]',
    dot: 'bg-[#1262E0]',
  },
  created: {
    label: 'Record Created',
    icon: PlusCircle,
    bg: 'bg-[#ECFDF5]',
    text: 'text-[#059669]',
    border: 'border-[#A7F3D0]',
    dot: 'bg-[#059669]',
  },
  call: {
    label: 'Call',
    icon: Phone,
    bg: 'bg-[#EEF2FF]',
    text: 'text-[#4F46E5]',
    border: 'border-[#C7D2FE]',
    dot: 'bg-[#4F46E5]',
  },
  task: {
    label: 'Task',
    icon: CheckSquare,
    bg: 'bg-[#FFFBEB]',
    text: 'text-[#D97706]',
    border: 'border-[#FDE68A]',
    dot: 'bg-[#D97706]',
  },
  meeting: {
    label: 'Meeting',
    icon: Calendar,
    bg: 'bg-[#F0FDFA]',
    text: 'text-[#0D9488]',
    border: 'border-[#99F6E4]',
    dot: 'bg-[#0D9488]',
  },
  note: {
    label: 'Note',
    icon: StickyNote,
    bg: 'bg-[#FEFCE8]',
    text: 'text-[#CA8A04]',
    border: 'border-[#FEF08A]',
    dot: 'bg-[#CA8A04]',
  },
  email: {
    label: 'Email / Message',
    icon: Mail,
    bg: 'bg-[#F0F9FF]',
    text: 'text-[#0284C7]',
    border: 'border-[#BAE6FD]',
    dot: 'bg-[#0284C7]',
  },
  whatsapp: {
    label: 'WhatsApp',
    icon: MessageCircle,
    bg: 'bg-[#ECFDF5]',
    text: 'text-[#16A34A]',
    border: 'border-[#BBF7D0]',
    dot: 'bg-[#16A34A]',
  },
  deal: {
    label: 'Deal',
    icon: Briefcase,
    bg: 'bg-[#EFF6FF]',
    text: 'text-[#1D4ED8]',
    border: 'border-[#BFDBFE]',
    dot: 'bg-[#1D4ED8]',
  },
  finance: {
    label: 'Finance & Orders',
    icon: Receipt,
    bg: 'bg-[#ECFDF5]',
    text: 'text-[#047857]',
    border: 'border-[#A7F3D0]',
    dot: 'bg-[#047857]',
  },
  case: {
    label: 'Support Case',
    icon: ShieldAlert,
    bg: 'bg-[#FEF2F2]',
    text: 'text-[#DC2626]',
    border: 'border-[#FECACA]',
    dot: 'bg-[#DC2626]',
  },
  related: {
    label: 'Related Record',
    icon: Layers,
    bg: 'bg-[#F8FAFC]',
    text: 'text-[#475569]',
    border: 'border-[#CBD5E1]',
    dot: 'bg-[#64748B]',
  },
};

const SOURCE_TABS = [
  { key: 'all', label: 'All Activity' },
  { key: 'workflow', label: 'Workflow Activity' },
  { key: 'user', label: 'User Activity' },
];

const CATEGORY_FILTERS = [
  { key: 'all', label: 'All Types' },
  { key: 'workflow', label: 'Workflows' },
  { key: 'record', label: 'Record Edits & Creation' },
  { key: 'call', label: 'Calls' },
  { key: 'task', label: 'Tasks' },
  { key: 'meeting', label: 'Meetings' },
  { key: 'note', label: 'Notes' },
  { key: 'email', label: 'Emails & WhatsApp' },
  { key: 'related', label: 'Deals & Related Records' },
];

const DATE_PRESETS = [
  { key: 'all', label: 'All Time' },
  { key: 'today', label: 'Today' },
  { key: '7d', label: 'Last 7 Days' },
  { key: '30d', label: 'Last 30 Days' },
  { key: 'oct2026', label: 'Oct 2026' },
  { key: 'sep2026', label: 'Sep 2026' },
  { key: 'custom', label: 'Custom Range' },
];

/**
 * Build the complete, strictly isolated chronological event list for an Account or Contact.
 */
export function buildRecordTimelineEvents({
  recordType,
  record,
  accounts = [],
  contacts = [],
  deals = [],
  calls = [],
  invoices = [],
  tasks = [],
  activity = [],
  workflowHistory = [],
  workflows = [],
  contactRelations = {},
  accountRelations = {},
  usersById = {},
  accountsById = {},
  contactsById = {},
}) {
  if (!record || !record.id) return [];

  const isAccount = recordType === 'account';
  const recordId = record.id;
  const userName = (uid) => usersById?.[uid]?.name || 'Arun Kumar';
  const userRole = (uid) => usersById?.[uid]?.role || '';
  const workflowsById = Object.fromEntries((workflows || []).map((w) => [w.id, w]));

  const filterCtx = {
    accounts,
    contacts,
    deals,
    calls,
    invoices,
    tasks,
    contactRelations,
    accountRelations,
    usersById,
    accountsById,
  };

  const events = [];
  const seenIds = new Set();
  const pushEvent = (ev) => {
    if (!ev || !ev.id || seenIds.has(ev.id)) return;
    seenIds.add(ev.id);
    const parsed = parseEventDate(ev.rawTimestamp, ev.fallbackTime || '09:00:00');
    const uid = ev.userId || record.ownerId || 'u1';
    events.push({
      ...ev,
      userId: uid,
      userName: userName(uid),
      userRole: userRole(uid),
      iso: parsed.iso,
      dateOnly: parsed.dateOnly,
      sortTime: parsed.sortTime,
      displayDate: parsed.displayDate,
      displayTime: parsed.displayTime,
      displayFull: parsed.displayFull,
    });
  };

  // Resolve related record sets strictly for this Account or Contact
  const relDeals = isAccount
    ? getRelatedRecordsForAccount(record, 'deals', filterCtx)
    : getRelatedRecordsForContact(record, 'deals', filterCtx);
  const relCalls = isAccount
    ? getRelatedRecordsForAccount(record, 'calls', filterCtx)
    : getRelatedRecordsForContact(record, 'calls', filterCtx);
  const relTasks = isAccount
    ? getRelatedRecordsForAccount(record, 'tasks', filterCtx)
    : getRelatedRecordsForContact(record, 'tasks', filterCtx);
  const relMeetings = isAccount
    ? getRelatedRecordsForAccount(record, 'meetings', filterCtx)
    : getRelatedRecordsForContact(record, 'meetings', filterCtx);
  const relNotes = isAccount
    ? getRelatedRecordsForAccount(record, 'notes', filterCtx)
    : getRelatedRecordsForContact(record, 'notes', filterCtx);
  const relEmails = isAccount
    ? getRelatedRecordsForAccount(record, 'emails', filterCtx)
    : getRelatedRecordsForContact(record, 'emails', filterCtx);
  const relQuotes = isAccount
    ? getRelatedRecordsForAccount(record, 'quotes', filterCtx)
    : getRelatedRecordsForContact(record, 'quotes', filterCtx);
  const relSalesOrders = isAccount
    ? getRelatedRecordsForAccount(record, 'salesOrders', filterCtx)
    : getRelatedRecordsForContact(record, 'salesOrders', filterCtx);
  const relCases = isAccount
    ? getRelatedRecordsForAccount(record, 'cases', filterCtx)
    : getRelatedRecordsForContact(record, 'cases', filterCtx);
  const relConvertedLeads = isAccount
    ? getRelatedRecordsForAccount(record, 'convertedLeads', filterCtx)
    : getRelatedRecordsForContact(record, 'convertedLeads', filterCtx);
  const relAttachments = isAccount
    ? getRelatedRecordsForAccount(record, 'attachments', filterCtx)
    : getRelatedRecordsForContact(record, 'attachments', filterCtx);
  const relInvoices = isAccount
    ? getRelatedRecordsForAccount(record, 'invoices', filterCtx)
    : (invoices || []).filter((inv) => inv.contactId === recordId);

  const dealIdSet = new Set(relDeals.map((d) => d.id));
  const callIdSet = new Set(relCalls.map((c) => c.id));
  const invoiceIdSet = new Set(relInvoices.map((i) => i.id));
  const taskIdSet = new Set(relTasks.map((t) => t.id));

  // Helper to check if an activity/workflow log belongs strictly to THIS record
  const matchesCurrentRecord = (item) => {
    if (!item) return false;
    if (isAccount) {
      if (item.accountId === recordId) return true;
      if (item.module === 'Accounts' && item.recordId === recordId) return true;
      if (item.module === 'Deals' && dealIdSet.has(item.recordId)) return true;
      if (item.module === 'Calls' && callIdSet.has(item.recordId)) return true;
      if (item.module === 'Zoho Finance' && invoiceIdSet.has(item.recordId)) return true;
      if (item.module === 'Tasks' && taskIdSet.has(item.recordId)) return true;
      return false;
    } else {
      if (item.contactId === recordId) return true;
      if (item.module === 'Contacts' && item.recordId === recordId) return true;
      if (item.module === 'Deals' && dealIdSet.has(item.recordId)) return true;
      if (item.module === 'Calls' && callIdSet.has(item.recordId)) return true;
      if (item.module === 'Zoho Finance' && invoiceIdSet.has(item.recordId)) return true;
      if (item.module === 'Tasks' && taskIdSet.has(item.recordId)) return true;
      return false;
    }
  };

  // 1. Record Creation Event
  const createdTs = record.createdAt || record.createdTime || record.createdOn || '2026-06-15';
  pushEvent({
    id: `tl-created-${record.id}`,
    source: 'user',
    category: 'created',
    filterGroup: 'record',
    title: `${isAccount ? 'Account' : 'Contact'} Record Created — ${record.name}`,
    description: isAccount
      ? `Created ${record.type || 'Account'} record in ${record.industry || 'Enterprise'} sector (${record.location || record.billingCity || 'India'}) with annual revenue ${fmtINR(record.annualRevenue || 0)}.`
      : `Created contact profile for ${record.name} (${record.designation || 'Contact'}) under ${accountsById?.[record.accountId]?.name || record.accountName || 'Account'} · Lead Source: ${record.leadSource || 'Direct'}.`,
    rawTimestamp: createdTs,
    fallbackTime: '09:15:00',
    userId: record.createdBy || record.ownerId || 'u1',
    moduleBadge: isAccount ? 'Accounts' : 'Contacts',
    statusBadge: record.status || record.lifecycle || 'Active',
  });

  // 2. User Activity Logs & Record Field Edits from db.activity
  const matchingActivities = (activity || []).filter(matchesCurrentRecord);
  const hasExplicitUpdateLog = matchingActivities.some(
    (a) => a.recordId === recordId && (a.eventType === 'updated' || String(a.message || '').includes('updated'))
  );

  matchingActivities.forEach((act) => {
    const isWfLog = act.source === 'workflow' || Boolean(act.workflowId);
    if (isWfLog) {
      // Check if already covered by a workflowHistory item for same workflowId & timestamp minute
      const coveredByHistory = (workflowHistory || []).some(
        (h) =>
          matchesCurrentRecord(h) &&
          h.workflowId === act.workflowId &&
          String(h.at || '').slice(0, 16) === String(act.createdAt || '').slice(0, 16)
      );
      if (coveredByHistory) return;

      const wfObj = workflowsById[act.workflowId];
      pushEvent({
        id: `tl-wfact-${act.id}`,
        source: 'workflow',
        category: 'workflow',
        filterGroup: 'workflow',
        title: `Workflow Action: ${act.workflowName || wfObj?.name || 'Automation Rule'}`,
        description: act.message || 'Automated workflow activity log entry generated.',
        rawTimestamp: act.createdAt,
        fallbackTime: '11:30:00',
        userId: act.userId || record.ownerId || 'u1',
        moduleBadge: act.module || (isAccount ? 'Accounts' : 'Contacts'),
        workflowMeta: {
          workflowId: act.workflowId,
          workflowName: act.workflowName || wfObj?.name || 'Workflow Rule',
          trigger: act.trigger || 'Record Event',
          triggerDetail: act.triggerDetail || act.trigger || 'Automated Trigger',
          status: 'Success',
          outcome: 'Executed',
          actions: ['Create Activity Log'],
          actionDetails: [act.message],
        },
      });
      return;
    }

    pushEvent({
      id: `tl-act-${act.id}`,
      source: 'user',
      category: act.eventType === 'created' ? 'created' : 'record',
      filterGroup: 'record',
      title: act.title || `${act.module || 'Record'} Activity — ${act.recordLabel || record.name}`,
      description: act.message || 'Record updated by user.',
      changes: Array.isArray(act.changes) ? act.changes : [],
      rawTimestamp: act.createdAt,
      fallbackTime: '14:20:00',
      userId: act.userId || record.modifiedBy || record.ownerId || 'u1',
      moduleBadge: act.module || (isAccount ? 'Accounts' : 'Contacts'),
    });
  });

  // Fallback Record Edit entry if the record was modified (`touched` or `modifiedTime !== createdOn`) and no explicit log exists yet
  const modDate = record.updatedAt || record.modifiedTime;
  if (!hasExplicitUpdateLog && modDate && String(modDate).slice(0, 10) !== String(createdTs).slice(0, 10)) {
    pushEvent({
      id: `tl-mod-${record.id}-${String(modDate).slice(0, 19)}`,
      source: 'user',
      category: 'record',
      filterGroup: 'record',
      title: `${isAccount ? 'Account' : 'Contact'} Record Updated — ${record.name}`,
      description: isAccount
        ? `Verified account details, billing address (${record.billingCity || record.location || 'India'}), and status (${record.status || 'Active'}).`
        : `Updated contact profile (${record.lifecycle || 'Qualified'}) and communication preferences.`,
      rawTimestamp: modDate,
      fallbackTime: '15:10:00',
      userId: record.modifiedBy || record.ownerId || 'u1',
      moduleBadge: isAccount ? 'Accounts' : 'Contacts',
    });
  }

  // 3. Workflow Execution History (`db.workflowHistory`)
  (workflowHistory || [])
    .filter(matchesCurrentRecord)
    .forEach((h) => {
      const wfObj = workflowsById[h.workflowId];
      const trigNode = wfObj?.nodes?.find((n) => n.type === 'trigger');
      const triggerName = h.trigger || trigNode?.data?.triggerType || (h.event === 'created' ? 'Record Created' : h.event === 'updated' ? 'Record Updated' : h.event || 'Record Event');
      const triggerDetail = h.triggerDetail || triggerName;
      const isSuccess = h.status === 'Success' || h.outcome === 'Executed';
      const statusLabel = h.status || (isSuccess ? 'Success' : 'Conditions Not Met');
      const actionList = Array.isArray(h.actions) ? h.actions : [];
      const actionDetails = Array.isArray(h.actionDetails) && h.actionDetails.length > 0
        ? h.actionDetails
        : actionList.length > 0
          ? actionList.map((a) => `Executed action: ${a}`)
          : [isSuccess ? 'Workflow completed all actions' : 'Workflow triggered, but rule conditions were not met'];

      pushEvent({
        id: `tl-wf-${h.id}`,
        source: 'workflow',
        category: 'workflow',
        filterGroup: 'workflow',
        title: `Workflow Rule: ${h.workflowName || wfObj?.name || 'Automation Rule'}`,
        description: isSuccess
          ? `Triggered on ${h.module} "${h.recordLabel || record.name}" via ${triggerDetail}. Executed ${actionList.length || 1} action${actionList.length === 1 ? '' : 's'}.`
          : `Evaluated on ${h.module} "${h.recordLabel || record.name}" via ${triggerDetail} — Conditions not met.`,
        rawTimestamp: h.at,
        fallbackTime: '12:00:00',
        userId: h.userId || record.ownerId || 'u1',
        moduleBadge: h.module || (isAccount ? 'Accounts' : 'Contacts'),
        statusBadge: statusLabel,
        workflowMeta: {
          workflowId: h.workflowId,
          workflowName: h.workflowName || wfObj?.name || 'Workflow Rule',
          module: h.module,
          recordLabel: h.recordLabel || record.name,
          trigger: triggerName,
          triggerDetail,
          status: statusLabel,
          outcome: h.outcome || (isSuccess ? 'Executed' : 'Conditions not met'),
          actions: actionList,
          actionDetails,
          conditionSummary: h.conditionSummary || '',
        },
      });
    });

  // 4. Calls
  relCalls.forEach((call) => {
    const contactPerson = contactsById?.[call.contactId]?.name;
    const durText = call.duration ? fmtDuration(call.duration) : '0m 00s';
    pushEvent({
      id: `tl-call-${call.id}`,
      source: 'user',
      category: 'call',
      filterGroup: 'call',
      title: `${call.type || 'Outbound'} Call (${call.status || 'Completed'}): ${call.subject || 'Customer Call'}`,
      description: `${call.notes || 'Call logged in CRM.'}${contactPerson && isAccount ? ` · Contact: ${contactPerson}` : ''} · Duration: ${durText}`,
      rawTimestamp: call.createdAt || call.dateTime,
      fallbackTime: '10:30:00',
      userId: call.ownerId || record.ownerId || 'u1',
      moduleBadge: 'Calls',
      statusBadge: call.status || 'Completed',
    });
  });

  // 5. Tasks (both user tasks and workflow-generated follow-up tasks)
  relTasks.forEach((task) => {
    const isWfTask = task.source === 'workflow' || Boolean(task.workflowId);
    const statusText = task.completed || task.status === 'Completed' ? 'Completed' : (task.status || 'Open');
    pushEvent({
      id: `tl-task-${task.id}`,
      source: isWfTask ? 'workflow' : 'user',
      category: 'task',
      filterGroup: 'task',
      title: `${isWfTask ? 'Workflow Task Created' : 'Task'}: ${task.title || task.subject || 'Follow-up Task'}`,
      description: `Status: ${statusText}${task.dueDate ? ` · Due Date: ${task.dueDate}` : ''}${task.workflowName ? ` · Created by rule "${task.workflowName}"` : ''}`,
      rawTimestamp: task.createdAt || task.updatedDate || task.createdDate || task.dueDate,
      fallbackTime: '11:00:00',
      userId: task.ownerId || record.ownerId || 'u1',
      moduleBadge: 'Tasks',
      statusBadge: statusText,
      workflowMeta: isWfTask
        ? {
            workflowId: task.workflowId,
            workflowName: task.workflowName || 'Workflow Rule',
            trigger: task.trigger || 'Automated Rule',
            triggerDetail: task.triggerDetail || task.trigger || 'Workflow Action',
            status: 'Success',
            outcome: 'Executed',
            actions: ['Create Follow-up Task'],
            actionDetails: [`Created follow-up task "${task.title}" (Due ${task.dueDate || '—'})`],
          }
        : null,
    });
  });

  // 6. Meetings (and Invited Meetings for Contacts)
  const seenMeetingTitles = new Set();
  relMeetings.forEach((mtg) => {
    seenMeetingTitles.add(mtg.id);
    pushEvent({
      id: `tl-mtg-${mtg.id}`,
      source: 'user',
      category: 'meeting',
      filterGroup: 'meeting',
      title: `Meeting (${mtg.status || 'Scheduled'}): ${mtg.title || mtg.subject || 'Client Sync'}`,
      description: `Scheduled for ${mtg.meetingDate || mtg.createdDate || 'upcoming date'}${mtg.location ? ` · Location: ${mtg.location}` : ''}.`,
      rawTimestamp: mtg.createdAt || mtg.meetingDate || mtg.updatedDate || mtg.createdDate,
      fallbackTime: '15:00:00',
      userId: mtg.ownerId || record.ownerId || 'u1',
      moduleBadge: 'Meetings',
      statusBadge: mtg.status || 'Upcoming',
    });
  });

  if (!isAccount) {
    const invitees = getRelatedRecordsForContact(record, 'invitees', filterCtx);
    invitees.forEach((inv) => {
      if (inv.meetingId && seenMeetingTitles.has(inv.meetingId)) return;
      pushEvent({
        id: `tl-inv-${inv.id}`,
        source: 'user',
        category: 'meeting',
        filterGroup: 'meeting',
        title: `Meeting Invitation (${inv.status || 'Invited'}): ${inv.title || 'Executive Sync'}`,
        description: `${record.name} invited to meeting · RSVP Status: ${inv.status || 'Invited'}.`,
        rawTimestamp: inv.createdAt || inv.updatedDate || inv.createdDate,
        fallbackTime: '14:00:00',
        userId: inv.ownerId || record.ownerId || 'u1',
        moduleBadge: 'Invitees',
        statusBadge: inv.status || 'Invited',
      });
    });
  }

  // 7. Notes
  relNotes.forEach((note) => {
    pushEvent({
      id: `tl-note-${note.id}`,
      source: 'user',
      category: 'note',
      filterGroup: 'note',
      title: `Note Added: ${note.title || 'Record Note'}`,
      description: note.content || note.note || 'Note saved to record.',
      rawTimestamp: note.createdAt || note.updatedDate || note.createdDate,
      fallbackTime: '13:15:00',
      userId: note.ownerId || record.ownerId || 'u1',
      moduleBadge: 'Notes',
      statusBadge: note.status || 'Saved',
    });
  });

  // 8. Emails & WhatsApp Messages
  relEmails.forEach((eml) => {
    pushEvent({
      id: `tl-eml-${eml.id}`,
      source: 'user',
      category: 'email',
      filterGroup: 'email',
      title: `Email ${eml.direction || 'Sent'}: ${eml.subject || 'Correspondence'}`,
      description: `Delivery status: ${eml.status || 'Sent'}${eml.to ? ` · To: ${eml.to}` : ''}.`,
      rawTimestamp: eml.createdAt || eml.updatedDate || eml.createdDate,
      fallbackTime: '11:45:00',
      userId: eml.ownerId || record.ownerId || 'u1',
      moduleBadge: 'Emails',
      statusBadge: eml.status || eml.direction || 'Sent',
    });
  });

  if (!isAccount) {
    const whatsappList = getRelatedRecordsForContact(record, 'whatsappMessages', filterCtx);
    whatsappList.forEach((wa) => {
      pushEvent({
        id: `tl-wa-${wa.id}`,
        source: 'user',
        category: 'whatsapp',
        filterGroup: 'email',
        title: `WhatsApp ${wa.direction || 'Outbound'} Message`,
        description: `"${wa.message}" · Status: ${wa.status || 'Delivered'}`,
        rawTimestamp: wa.createdAt || wa.updatedDate || wa.createdDate,
        fallbackTime: '16:10:00',
        userId: wa.ownerId || record.ownerId || 'u1',
        moduleBadge: 'WhatsApp',
        statusBadge: wa.status || 'Delivered',
      });
    });
  }

  // 9. Related Records: Deals, Invoices, Quotes, Sales Orders, Cases, Projects, Converted Leads, Attachments
  relDeals.forEach((deal) => {
    pushEvent({
      id: `tl-deal-${deal.id}`,
      source: 'user',
      category: 'deal',
      filterGroup: 'related',
      title: `Deal (${deal.stage || 'Qualification'}): ${deal.name}`,
      description: `Deal Value: ${fmtINR(deal.amount || 0)} · Probability: ${deal.probability ?? 0}% · Closing Date: ${deal.closingDate || '—'}`,
      rawTimestamp: deal.createdAt || deal.updatedAt || deal.createdOn,
      fallbackTime: '10:00:00',
      userId: deal.ownerId || record.ownerId || 'u1',
      moduleBadge: 'Deals',
      statusBadge: deal.stage,
    });
  });

  relInvoices.forEach((inv) => {
    pushEvent({
      id: `tl-invdoc-${inv.id}`,
      source: 'user',
      category: 'finance',
      filterGroup: 'related',
      title: `${inv.type || 'Sales Invoice'} ${inv.number}: ${inv.status}`,
      description: `Invoice Amount: ${fmtINR(inv.amount || 0)} · Paid: ${fmtINR(inv.paidAmount || 0)} · Due: ${inv.dueDate || '—'}`,
      rawTimestamp: inv.createdAt || inv.invoiceDate,
      fallbackTime: '12:30:00',
      userId: inv.ownerId || record.ownerId || 'u1',
      moduleBadge: 'Zoho Finance',
      statusBadge: inv.status,
    });
  });

  relQuotes.forEach((quo) => {
    pushEvent({
      id: `tl-quo-${quo.id}`,
      source: 'user',
      category: 'finance',
      filterGroup: 'related',
      title: `Quote ${quo.quoteNumber || ''}: ${quo.subject || 'Commercial Quote'}`,
      description: `Quote Amount: ${fmtINR(quo.amount || 0)} · Status: ${quo.status || 'Sent'}`,
      rawTimestamp: quo.createdAt || quo.updatedDate || quo.createdDate,
      fallbackTime: '14:15:00',
      userId: quo.ownerId || record.ownerId || 'u1',
      moduleBadge: 'Quotes',
      statusBadge: quo.status || 'Sent',
    });
  });

  relSalesOrders.forEach((so) => {
    pushEvent({
      id: `tl-so-${so.id}`,
      source: 'user',
      category: 'finance',
      filterGroup: 'related',
      title: `Sales Order ${so.soNumber || ''}: ${so.subject || 'Order'}`,
      description: `Order Value: ${fmtINR(so.amount || 0)} · Status: ${so.status || 'Approved'}`,
      rawTimestamp: so.createdAt || so.updatedDate || so.createdDate,
      fallbackTime: '15:40:00',
      userId: so.ownerId || record.ownerId || 'u1',
      moduleBadge: 'Sales Orders',
      statusBadge: so.status || 'Approved',
    });
  });

  relCases.forEach((cs) => {
    pushEvent({
      id: `tl-case-${cs.id}`,
      source: 'user',
      category: 'case',
      filterGroup: 'related',
      title: `Support Case ${cs.caseNumber || ''}: ${cs.subject || 'Customer Issue'}`,
      description: `Case Status: ${cs.status || 'Open'}${cs.priority ? ` · Priority: ${cs.priority}` : ''}`,
      rawTimestamp: cs.createdAt || cs.updatedDate || cs.createdDate,
      fallbackTime: '11:20:00',
      userId: cs.ownerId || record.ownerId || 'u1',
      moduleBadge: 'Cases',
      statusBadge: cs.status || 'Open',
    });
  });

  relConvertedLeads.forEach((cl) => {
    pushEvent({
      id: `tl-convlead-${cl.id}`,
      source: 'user',
      category: 'related',
      filterGroup: 'related',
      title: `Lead Converted: ${cl.leadName || record.name}`,
      description: `Converted from ${cl.leadSource || 'Inbound'} lead into ${isAccount ? 'Account' : 'Contact'} record.`,
      rawTimestamp: cl.createdAt || cl.convertedDate || cl.updatedDate || cl.createdDate,
      fallbackTime: '09:45:00',
      userId: cl.ownerId || record.ownerId || 'u1',
      moduleBadge: 'Converted Leads',
      statusBadge: cl.status || 'Converted',
    });
  });

  relAttachments.forEach((att) => {
    pushEvent({
      id: `tl-att-${att.id}`,
      source: 'user',
      category: 'related',
      filterGroup: 'related',
      title: `Attachment Uploaded: ${att.fileName || att.name || 'Document'}`,
      description: `File size: ${att.fileSize || '250 KB'} · Uploaded to ${record.name}`,
      rawTimestamp: att.createdAt || att.createdDate,
      fallbackTime: '16:00:00',
      userId: att.uploadedBy || att.ownerId || record.ownerId || 'u1',
      moduleBadge: 'Attachments',
      statusBadge: 'Attached',
    });
  });

  if (isAccount) {
    const relProjects = getRelatedRecordsForAccount(record, 'projects', filterCtx);
    relProjects.forEach((proj) => {
      pushEvent({
        id: `tl-proj-${proj.id}`,
        source: 'user',
        category: 'related',
        filterGroup: 'related',
        title: `Delivery Project Linked: ${proj.name}`,
        description: `Project Status: ${proj.status || 'Active'} · Allocated Budget: ${fmtINR(proj.budget || 0)}`,
        rawTimestamp: proj.createdAt || proj.updatedDate || proj.createdDate,
        fallbackTime: '17:00:00',
        userId: proj.ownerId || record.ownerId || 'u1',
        moduleBadge: 'Projects',
        statusBadge: proj.status || 'Active',
      });
    });
  } else {
    const zohoSignDocs = getRelatedRecordsForContact(record, 'zohoSignDocuments', filterCtx);
    zohoSignDocs.forEach((doc) => {
      pushEvent({
        id: `tl-zsign-${doc.id}`,
        source: 'user',
        category: 'related',
        filterGroup: 'related',
        title: `Zoho Sign Document: ${doc.documentName}`,
        description: `Signature Status: ${doc.signStatus || doc.status || 'Signed'}`,
        rawTimestamp: doc.createdAt || doc.updatedDate || doc.createdDate,
        fallbackTime: '15:30:00',
        userId: doc.ownerId || record.ownerId || 'u1',
        moduleBadge: 'Zoho Sign',
        statusBadge: doc.signStatus || doc.status || 'Signed',
      });
    });
  }

  // Sort strictly newest-first
  return events.sort((a, b) => b.sortTime - a.sortTime);
}

/**
 * Reusable Timeline Component for Account Detail and Contact Detail views (and quick-view drawers).
 */
export default function RecordTimeline({ recordType = 'account', record, compact = false }) {
  const {
    accounts,
    contacts,
    deals,
    calls,
    invoices,
    tasks,
    activity,
    workflowHistory,
    workflows,
    contactRelations,
    accountRelations,
    usersById,
    accountsById,
    contactsById,
    runRecordWorkflowsNow,
  } = useCRM();

  const [sourceFilter, setSourceFilter] = useState('all'); // 'all' | 'user' | 'workflow'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [datePreset, setDatePreset] = useState('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorState, setErrorState] = useState(null);

  // Brief loading transition when switching between records so loading state is responsive and clear
  useEffect(() => {
    setIsLoading(true);
    setErrorState(null);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 140);
    return () => clearTimeout(timer);
  }, [record?.id, recordType]);

  // Build all events for this specific record
  const { allEvents, buildError } = useMemo(() => {
    try {
      if (!record || !record.id) {
        return { allEvents: [], buildError: 'Record data is unavailable.' };
      }
      const list = buildRecordTimelineEvents({
        recordType,
        record,
        accounts,
        contacts,
        deals,
        calls,
        invoices,
        tasks,
        activity,
        workflowHistory,
        workflows,
        contactRelations,
        accountRelations,
        usersById,
        accountsById,
        contactsById,
      });
      return { allEvents: list, buildError: null };
    } catch (err) {
      return { allEvents: [], buildError: err?.message || 'Failed to load timeline events.' };
    }
  }, [
    recordType,
    record,
    accounts,
    contacts,
    deals,
    calls,
    invoices,
    tasks,
    activity,
    workflowHistory,
    workflows,
    contactRelations,
    accountRelations,
    usersById,
    accountsById,
    contactsById,
  ]);

  // Source counts (before category/date/search narrowing, or respecting date/search)
  const sourceCounts = useMemo(() => {
    const userCount = allEvents.filter((e) => e.source === 'user').length;
    const wfCount = allEvents.filter((e) => e.source === 'workflow').length;
    return {
      all: allEvents.length,
      user: userCount,
      workflow: wfCount,
    };
  }, [allEvents]);

  // Reference anchor date (handles both live browser date and CRM seed date 2026-10-10)
  const todayStr = todayISO();
  const latestEventDate = allEvents[0]?.dateOnly || '2026-10-10';

  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return allEvents.filter((ev) => {
      // 1. Source filter ('all' | 'user' | 'workflow')
      if (sourceFilter !== 'all' && ev.source !== sourceFilter) return false;

      // 2. Category filter
      if (categoryFilter !== 'all' && ev.filterGroup !== categoryFilter) return false;

      // 3. Date filter
      if (datePreset !== 'all') {
        const dStr = ev.dateOnly;
        if (datePreset === 'today') {
          if (dStr !== todayStr && dStr !== '2026-10-10' && dStr !== latestEventDate) return false;
        } else if (datePreset === '7d') {
          const refMs = new Date(`${latestEventDate}T23:59:59`).getTime();
          const liveMs = new Date(`${todayStr}T23:59:59`).getTime();
          const evMs = new Date(`${dStr}T12:00:00`).getTime();
          const withinRef = evMs >= refMs - 7 * 86400000 && evMs <= refMs;
          const withinLive = evMs >= liveMs - 7 * 86400000 && evMs <= liveMs;
          if (!withinRef && !withinLive) return false;
        } else if (datePreset === '30d') {
          const refMs = new Date(`${latestEventDate}T23:59:59`).getTime();
          const liveMs = new Date(`${todayStr}T23:59:59`).getTime();
          const evMs = new Date(`${dStr}T12:00:00`).getTime();
          const withinRef = evMs >= refMs - 30 * 86400000 && evMs <= refMs;
          const withinLive = evMs >= liveMs - 30 * 86400000 && evMs <= liveMs;
          if (!withinRef && !withinLive) return false;
        } else if (datePreset === 'oct2026') {
          if (!dStr.startsWith('2026-10')) return false;
        } else if (datePreset === 'sep2026') {
          if (!dStr.startsWith('2026-09')) return false;
        } else if (datePreset === 'custom') {
          if (customFrom && dStr < customFrom) return false;
          if (customTo && dStr > customTo) return false;
        }
      }

      // 4. Search query
      if (q) {
        const wf = ev.workflowMeta || {};
        const changeText = (ev.changes || []).map((c) => `${c.label} ${c.from} ${c.to}`).join(' ');
        const hay = [
          ev.title,
          ev.description,
          ev.userName,
          ev.moduleBadge,
          ev.statusBadge,
          wf.workflowName,
          wf.trigger,
          wf.triggerDetail,
          wf.status,
          ...(wf.actionDetails || []),
          changeText,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [allEvents, sourceFilter, categoryFilter, datePreset, customFrom, customTo, searchQuery, todayStr, latestEventDate]);

  // Group filtered events by date header while preserving newest-first order
  const groupedByDate = useMemo(() => {
    const groups = [];
    const map = new Map();
    filteredEvents.forEach((ev) => {
      const key = ev.dateOnly;
      if (!map.has(key)) {
        const group = {
          dateOnly: key,
          displayDate:
            key === todayStr
              ? `Today (${ev.displayDate})`
              : ev.displayDate,
          items: [],
        };
        map.set(key, group);
        groups.push(group);
      }
      map.get(key).items.push(ev);
    });
    return groups;
  }, [filteredEvents, todayStr]);

  const hasActiveFilters =
    sourceFilter !== 'all' ||
    categoryFilter !== 'all' ||
    datePreset !== 'all' ||
    Boolean(searchQuery.trim()) ||
    Boolean(customFrom) ||
    Boolean(customTo);

  const handleResetFilters = () => {
    setSourceFilter('all');
    setCategoryFilter('all');
    setDatePreset('all');
    setCustomFrom('');
    setCustomTo('');
    setSearchQuery('');
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setErrorState(null);
    setTimeout(() => {
      setIsLoading(false);
    }, 180);
  };

  const handleTriggerWorkflowNow = () => {
    if (!record?.id) return;
    const col = recordType === 'account' ? 'accounts' : 'contacts';
    runRecordWorkflowsNow(col, record.id, 'updated');
  };

  const activeError = errorState || buildError;

  // Error State
  if (activeError) {
    return (
      <div
        data-testid="timeline-error-state"
        className="bg-white rounded-md border border-[#FECACA] p-6 text-center shadow-2xs my-2"
      >
        <div className="w-11 h-11 rounded-full bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center mx-auto mb-3">
          <AlertCircle size={22} />
        </div>
        <h3 className="text-[14px] font-semibold text-[#0F172A]">Unable to Load Record Timeline</h3>
        <p className="text-[12.5px] text-[#64748B] mt-1 max-w-md mx-auto">{activeError}</p>
        <button
          type="button"
          onClick={handleRefresh}
          className="mt-4 h-8 px-3.5 rounded bg-[#1262E0] hover:bg-[#0E4FB5] text-white text-[12px] font-semibold inline-flex items-center gap-1.5"
        >
          <RefreshCw size={13} /> Retry Loading Timeline
        </button>
      </div>
    );
  }

  return (
    <div data-testid={`record-timeline-${recordType}`} className="space-y-3.5">
      {/* ================================================================= */}
      {/* HEADER & FILTER BAR                                               */}
      {/* ================================================================= */}
      <div className="bg-white rounded-md border border-[#DCE3EE] p-3.5 sm:p-4 shadow-2xs space-y-3">
        {/* Top Row: Title, Summary Badges & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-[#EEF2F7]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[#1262E0] flex items-center justify-center shrink-0">
              <History size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-[14px] font-semibold text-[#0F172A] truncate">
                  Activity &amp; Workflow History
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0]">
                  {filteredEvents.length} of {allEvents.length} {allEvents.length === 1 ? 'Event' : 'Events'}
                </span>
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                  <Clock size={11} /> Newest First
                </span>
              </div>
              <p className="text-[11.5px] text-[#64748B] truncate mt-0.5">
                Showing chronological history exclusively for{' '}
                <span className="font-semibold text-[#1E293B]">{record?.name}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              data-testid="timeline-run-workflow-btn"
              onClick={handleTriggerWorkflowNow}
              title={`Evaluate active ${recordType === 'account' ? 'Account' : 'Contact'} workflow rules on ${record?.name}`}
              className="h-8 px-3 rounded border border-[#DDD6FE] bg-[#F5F3FF] hover:bg-[#EDE9FE] text-[#6D28D9] text-[12px] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Zap size={13} className="text-[#7C3AED]" />
              <span>Run Workflow Rule</span>
            </button>

            <Link
              to={`/workflows?module=${recordType === 'account' ? 'Accounts' : 'Contacts'}`}
              data-testid="timeline-open-workflow-builder-link"
              title="Open Global Workflow Builder to create or edit rules"
              className="h-8 px-2.5 rounded border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#334155] text-[12px] font-medium inline-flex items-center gap-1.5 transition-colors"
            >
              <Workflow size={12.5} className="text-[#6D28D9]" />
              <span className="hidden sm:inline">Workflow Builder</span>
            </Link>

            <button
              type="button"
              data-testid="timeline-refresh-btn"
              onClick={handleRefresh}
              title="Refresh timeline"
              className="h-8 px-2.5 rounded border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#475569] text-[12px] font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RefreshCw size={12.5} className={isLoading ? 'animate-spin text-[#1262E0]' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Row 2: Source Filter Tabs (All Activity / User Activity / Workflow Activity) + Search + Date Filter */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          {/* Source Tabs */}
          <div
            role="tablist"
            aria-label="Activity source filter"
            className="inline-flex items-center bg-[#F1F5F9] p-1 rounded-lg border border-[#E2E8F0] self-start overflow-x-auto max-w-full"
          >
            {SOURCE_TABS.map((tab) => {
              const active = sourceFilter === tab.key;
              const count = sourceCounts[tab.key] ?? 0;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  data-testid={`timeline-source-${tab.key}`}
                  onClick={() => setSourceFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-md text-[12px] font-semibold inline-flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? 'bg-white text-[#1262E0] shadow-2xs border border-[#DCE3EE]'
                      : 'text-[#475569] hover:text-[#0F172A]'
                  }`}
                >
                  {tab.key === 'workflow' && <Workflow size={12.5} className={active ? 'text-[#7C3AED]' : 'text-[#64748B]'} />}
                  {tab.key === 'user' && <UserCheck size={12.5} className={active ? 'text-[#1262E0]' : 'text-[#64748B]'} />}
                  {tab.key === 'all' && <Activity size={12.5} className={active ? 'text-[#1262E0]' : 'text-[#64748B]'} />}
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10.5px] font-bold ${
                      active
                        ? 'bg-[#EFF6FF] text-[#1262E0]'
                        : 'bg-[#E2E8F0]/70 text-[#475569]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Date Preset Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search input */}
            <div className="relative flex-1 sm:flex-initial sm:w-56">
              <Search size={13.5} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search timeline events..."
                data-testid="timeline-search-input"
                className="w-full h-8 pl-8 pr-7 rounded border border-[#CBD5E1] bg-white text-[12px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-hidden focus:border-[#1262E0]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear timeline search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569]"
                >
                  <X size={12.5} />
                </button>
              )}
            </div>

            {/* Date Filter Select */}
            <div className="inline-flex items-center gap-1.5">
              <div className="relative">
                <Calendar size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" />
                <select
                  value={datePreset}
                  onChange={(e) => setDatePreset(e.target.value)}
                  aria-label="Filter timeline by date"
                  data-testid="timeline-date-filter"
                  className="h-8 pl-7 pr-6 rounded border border-[#CBD5E1] bg-white text-[12px] font-medium text-[#334155] focus:outline-hidden focus:border-[#1262E0] cursor-pointer"
                >
                  {DATE_PRESETS.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  data-testid="timeline-clear-filters-btn"
                  onClick={handleResetFilters}
                  className="h-8 px-2.5 rounded border border-[#CBD5E1] bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#475569] text-[11.5px] font-medium inline-flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw size={11.5} />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Custom Date Range Picker Row when datePreset === 'custom' */}
        {datePreset === 'custom' && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#F1F5F9] text-[12px]">
            <span className="font-medium text-[#475569]">Date Range:</span>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              data-testid="timeline-custom-from"
              className="h-7 px-2 rounded border border-[#CBD5E1] text-[12px] text-[#0F172A]"
            />
            <span className="text-[#64748B]">to</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              data-testid="timeline-custom-to"
              className="h-7 px-2 rounded border border-[#CBD5E1] text-[12px] text-[#0F172A]"
            />
          </div>
        )}

        {/* Row 3: Event Type Category Pills */}
        {!compact && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mr-1 inline-flex items-center gap-1 shrink-0">
              <Filter size={11} /> Type:
            </span>
            {CATEGORY_FILTERS.map((cat) => {
              const active = categoryFilter === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  data-testid={`timeline-category-${cat.key}`}
                  onClick={() => setCategoryFilter(cat.key)}
                  className={`px-2.5 py-1 rounded-full text-[11.5px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#1262E0] text-white font-semibold'
                      : 'bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0] hover:bg-[#F1F5F9]'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* LOADING, EMPTY, OR CHRONOLOGICAL TIMELINE STREAM                  */}
      {/* ================================================================= */}
      {isLoading ? (
        <div
          data-testid="timeline-loading-state"
          className="bg-white rounded-md border border-[#DCE3EE] p-6 shadow-2xs space-y-4"
        >
          <div className="flex items-center gap-2 text-[12.5px] text-[#64748B] font-medium">
            <Loader2 size={15} className="animate-spin text-[#1262E0]" />
            <span>Loading chronological timeline for {record?.name}...</span>
          </div>
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-start gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-[#E2E8F0] shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-3.5 bg-[#E2E8F0] rounded w-1/3" />
                <div className="h-3 bg-[#F1F5F9] rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div
          data-testid="timeline-empty-state"
          className="bg-white rounded-md border border-[#DCE3EE] p-8 text-center shadow-2xs"
        >
          <div className="w-11 h-11 rounded-full bg-[#F1F5F9] text-[#64748B] flex items-center justify-center mx-auto mb-3">
            <History size={20} />
          </div>
          <h4 className="text-[14px] font-semibold text-[#0F172A]">
            No Matching Timeline Activity Found
          </h4>
          <p className="text-[12.5px] text-[#64748B] mt-1 max-w-md mx-auto">
            {hasActiveFilters
              ? `No events for "${record?.name}" match your active filter criteria.`
              : `No activity or workflow executions have been recorded for "${record?.name}" yet.`}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="h-8 px-3.5 rounded bg-[#1262E0] hover:bg-[#0E4FB5] text-white text-[12px] font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw size={13} /> Reset Filters
              </button>
            )}
            <button
              type="button"
              onClick={handleTriggerWorkflowNow}
              className="h-8 px-3.5 rounded border border-[#DDD6FE] bg-[#F5F3FF] hover:bg-[#EDE9FE] text-[#6D28D9] text-[12px] font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Zap size={13} /> Run Workflow Now
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-md border border-[#DCE3EE] p-4 sm:p-5 shadow-2xs space-y-6">
          {groupedByDate.map((group) => (
            <div key={group.dateOnly} className="space-y-3">
              {/* Date Group Header */}
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-md bg-[#F1F5F9] border border-[#E2E8F0] text-[11.5px] font-semibold text-[#334155]">
                  {group.displayDate}
                </span>
                <div className="h-px flex-1 bg-[#EEF2F7]" />
                <span className="text-[11px] text-[#94A3B8] font-medium">
                  {group.items.length} {group.items.length === 1 ? 'event' : 'events'}
                </span>
              </div>

              {/* Chronological Items within this Date */}
              <div className="relative pl-5 sm:pl-6 border-l-2 border-[#E2E8F0] ml-3 space-y-3.5">
                {group.items.map((ev) => {
                  const meta = CATEGORY_META[ev.category] || CATEGORY_META.related;
                  const IconComp = meta.icon || Activity;
                  const wf = ev.workflowMeta;
                  const isWorkflow = ev.source === 'workflow' || Boolean(wf);

                  return (
                    <div
                      key={ev.id}
                      data-testid="timeline-event-card"
                      data-event-source={ev.source}
                      data-event-category={ev.category}
                      className={`relative rounded-lg border p-3.5 transition-all ${
                        isWorkflow
                          ? 'border-[#DDD6FE] bg-[#FAF8FF] hover:border-[#C4B5FD]'
                          : 'border-[#E2E8F0] bg-[#FCFDFE] hover:border-[#CBD5E1]'
                      }`}
                    >
                      {/* Timeline Node Icon on the vertical line */}
                      <span
                        className={`absolute -left-[31px] sm:-left-[35px] top-3.5 w-7 h-7 rounded-full border-2 border-white shadow-2xs flex items-center justify-center ${meta.bg} ${meta.text}`}
                      >
                        <IconComp size={13.5} />
                      </span>

                      {/* Card Top Row: Badges + Title + Timestamp + Responsible User */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            {/* Source Badge */}
                            {isWorkflow ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-semibold bg-[#EDE9FE] text-[#6D28D9] border border-[#DDD6FE]">
                                <Sparkles size={10.5} /> Workflow Automation
                              </span>
                            ) : (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-semibold border ${meta.bg} ${meta.text} ${meta.border}`}>
                                {meta.label}
                              </span>
                            )}

                            {/* Module Badge */}
                            {ev.moduleBadge && (
                              <span className="px-2 py-0.5 rounded text-[10.5px] font-medium bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
                                {ev.moduleBadge}
                              </span>
                            )}

                            {/* Workflow Status or Record Status Badge */}
                            {wf ? (
                              wf.status === 'Success' ? (
                                <span
                                  data-testid="workflow-status-badge"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]"
                                >
                                  <CheckCircle2 size={11} /> Success
                                </span>
                              ) : wf.status === 'Failed' ? (
                                <span
                                  data-testid="workflow-status-badge"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]"
                                >
                                  <XCircle size={11} /> Failed
                                </span>
                              ) : (
                                <span
                                  data-testid="workflow-status-badge"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]"
                                >
                                  <AlertCircle size={11} /> {wf.status}
                                </span>
                              )
                            ) : (
                              ev.statusBadge && (
                                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-white text-[#334155] border border-[#CBD5E1]">
                                  {ev.statusBadge}
                                </span>
                              )
                            )}
                          </div>

                          {/* Event Title */}
                          <h4 className="text-[13px] font-semibold text-[#0F172A] leading-snug">
                            {ev.title}
                          </h4>
                        </div>

                        {/* Right Meta: Date/Time + Responsible User */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 text-[11.5px] text-[#64748B]">
                          <span className="inline-flex items-center gap-1 font-medium text-[#475569]">
                            <Clock size={11.5} className="text-[#94A3B8]" />
                            {ev.displayFull}
                          </span>
                          <span
                            title={ev.userRole ? `${ev.userName} (${ev.userRole})` : ev.userName}
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white border border-[#E2E8F0] text-[11px] font-medium text-[#334155]"
                          >
                            <span className="w-4 h-4 rounded-full bg-[#1262E0] text-white text-[9px] font-bold flex items-center justify-center">
                              {String(ev.userName || 'U').charAt(0)}
                            </span>
                            <span>{ev.userName}</span>
                          </span>
                        </div>
                      </div>

                      {/* Short Description */}
                      {ev.description && (
                        <p className="text-[12.5px] text-[#334155] mt-1.5 leading-relaxed">
                          {ev.description}
                        </p>
                      )}

                      {/* Field-level Change Diffs (when a record was edited) */}
                      {Array.isArray(ev.changes) && ev.changes.length > 0 && (
                        <div className="mt-2.5 pt-2.5 border-t border-[#EEF2F7] flex flex-wrap gap-2">
                          {ev.changes.map((chg, idx) => (
                            <div
                              key={`${chg.field}-${idx}`}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] text-[11.5px]"
                            >
                              <span className="font-semibold text-[#334155]">{chg.label}:</span>
                              <span className="text-[#94A3B8] line-through">{chg.from}</span>
                              <ArrowRight size={11} className="text-[#64748B]" />
                              <span className="font-semibold text-[#1262E0]">{chg.to}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Structured Workflow Rule Details Box (Rule Name, Trigger, Action/Result, Date & Time, Status, Responsible User) */}
                      {wf && (
                        <div className="mt-2.5 pt-2.5 border-t border-[#E9D5FF]/70 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-[11.5px] bg-white/80 rounded-md p-2.5 border border-[#EDE9FE]">
                          <div>
                            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-[#64748B]">
                              Workflow Rule Name
                            </div>
                            <div className="font-semibold text-[#0F172A] mt-0.5 flex items-center gap-1">
                              {wf.workflowId ? (
                                <Link
                                  to={`/workflows/${wf.workflowId}`}
                                  className="text-[#6D28D9] hover:underline inline-flex items-center gap-1"
                                >
                                  <span>{wf.workflowName}</span>
                                  <ExternalLink size={11} />
                                </Link>
                              ) : (
                                <span>{wf.workflowName}</span>
                              )}
                            </div>
                          </div>

                          <div>
                            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-[#64748B]">
                              Trigger
                            </div>
                            <div className="font-medium text-[#334155] mt-0.5 flex items-center gap-1">
                              <Zap size={11.5} className="text-[#D97706] shrink-0" />
                              <span>{wf.triggerDetail || wf.trigger}</span>
                            </div>
                          </div>

                          <div>
                            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-[#64748B]">
                              Status
                            </div>
                            <div className="font-semibold mt-0.5 text-[#0F172A]">
                              {wf.status} ({wf.outcome || wf.status})
                              {wf.conditionSummary && (
                                <span className="block text-[10.5px] font-normal text-[#64748B] truncate">
                                  Condition: {wf.conditionSummary}
                                </span>
                              )}
                            </div>
                          </div>

                          <div>
                            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-[#64748B]">
                              Date &amp; Time
                            </div>
                            <div className="font-medium text-[#334155] mt-0.5 flex items-center gap-1">
                              <Clock size={11.5} className="text-[#64748B] shrink-0" />
                              <span>{ev.displayFull}</span>
                            </div>
                          </div>

                          <div>
                            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-[#64748B]">
                              Responsible User
                            </div>
                            <div className="font-medium text-[#334155] mt-0.5 flex items-center gap-1.5">
                              <UserCheck size={11.5} className="text-[#1262E0] shrink-0" />
                              <span>{ev.userName}{ev.userRole ? ` · ${ev.userRole}` : ''}</span>
                            </div>
                          </div>

                          <div>
                            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-[#64748B]">
                              Target Record
                            </div>
                            <div className="font-medium text-[#334155] mt-0.5 truncate">
                              {wf.module || ev.moduleBadge}: <span className="font-semibold text-[#0F172A]">{wf.recordLabel || record?.name}</span>
                            </div>
                          </div>

                          {Array.isArray(wf.actionDetails) && wf.actionDetails.length > 0 && (
                            <div className="sm:col-span-2 lg:col-span-3 pt-1.5 border-t border-[#F1F5F9]">
                              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-[#64748B] mb-1">
                                Action / Result
                              </div>
                              <ul className="space-y-1">
                                {wf.actionDetails.map((actDesc, i) => (
                                  <li
                                    key={i}
                                    className="text-[12px] text-[#334155] flex items-start gap-1.5"
                                  >
                                    <CheckCircle2
                                      size={13}
                                      className={`mt-0.5 shrink-0 ${
                                        wf.status === 'Success' ? 'text-[#059669]' : 'text-[#D97706]'
                                      }`}
                                    />
                                    <span>{actDesc}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
