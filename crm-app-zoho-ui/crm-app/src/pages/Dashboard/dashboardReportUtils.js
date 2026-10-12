import { todayISO, parseDate, fmtDate, fmtTime } from '../../utils/calculations';

// ============================================================================
// REPORT CATALOG & DEFAULT 7 CALL REPORT COMPONENTS (Screenshots 1–6)
// ============================================================================
export const REPORT_CATALOG = [
  {
    reportKey: 'overall_all',
    reportId: 'rep-overall-call-count',
    title: 'Overall Call Count',
    reportName: 'Overall Call Count',
    sourceLabel: 'Overall Call Count',
    sourceModule: 'Calls',
    description: 'All inbound, outbound, attended, and unattended calls grouped by Call Owner.',
  },
  {
    reportKey: 'overall_unattended',
    reportId: 'rep-overall-unattend-calls',
    title: 'Overall Un Attend Calls',
    reportName: 'Overall Un Attend Calls',
    sourceLabel: 'Overall Un Attend Calls',
    sourceModule: 'Calls',
    description: 'Missed, busy, scheduled, and zero-duration calls grouped by Call Owner.',
  },
  {
    reportKey: 'overall_attended',
    reportId: 'rep-overall-attend-calls',
    title: 'Overall Attend Calls',
    reportName: 'Overall Attend Calls',
    sourceLabel: 'Overall Attend Calls',
    sourceModule: 'Calls',
    description: 'Completed and connected calls with active talk duration grouped by Call Owner.',
  },
  {
    reportKey: 'leads_calls',
    reportId: 'rep-lead-call-report',
    title: 'Leads Call Count',
    reportName: 'Lead Call Report',
    sourceLabel: 'Lead Call Report',
    sourceModule: 'Leads with Calls',
    description: 'Calls logged against Lead records grouped by Call Owner.',
  },
  {
    reportKey: 'deals_live_calls',
    reportId: 'rep-deal-call-live',
    title: 'Deals Call Report Live Data',
    reportName: 'Deal Call Report Live Data',
    sourceLabel: 'Deal Call Report Live Data',
    sourceModule: 'Deals with Calls',
    description: 'Calls associated with active/live Deal pipeline records grouped by Call Owner.',
  },
  {
    reportKey: 'deals_old_calls',
    reportId: 'rep-deal-call-old',
    title: 'Deals Old Data Call Report',
    reportName: 'Deals Old Data Call Report',
    sourceLabel: 'Deals Old Data Call Report',
    sourceModule: 'Old Deals with Calls',
    description: 'Calls associated with historical/archival Deal records grouped by Call Owner.',
  },
  {
    reportKey: 'deals_contact_calls',
    reportId: 'rep-deal-contact-call',
    title: 'Deals Contact Call Count',
    reportName: 'Deals Contact Call Count',
    sourceLabel: 'Deals Contact Call Count',
    sourceModule: 'Contacts with Calls',
    description: 'Calls connected to Deal Contacts grouped by Call Owner.',
  },
];

export const REPORT_BY_KEY = Object.fromEntries(REPORT_CATALOG.map((r) => [r.reportKey, r]));
export const REPORT_BY_ID = Object.fromEntries(REPORT_CATALOG.map((r) => [r.reportId, r]));

export const DEFAULT_FILTER_STATE = {
  callOwnerIds: [], // empty = All Users
  callStartTime: {
    mode: 'Any Time',
    lastCount: 7,
    lastUnit: 'Days',
    date: '',
    from: '',
    to: '',
  },
  createdTime: {
    mode: 'Any Time',
    lastCount: 7,
    lastUnit: 'Days',
    date: '',
    from: '',
    to: '',
  },
};

export const DATE_FILTER_OPTIONS = [
  'Any Time',
  'Today',
  'This Week',
  'This Month',
  'This Quarter',
  'This Year',
  'This Fiscal Year',
  'Last',
  'Before',
  'After',
  'Specific Date',
  'Custom',
];

export const CATEGORIES_LIST = [
  'Translation Services',
  'Attestation Services',
  'Interpretation',
  'Transcription Services',
  'Dubbing / VoiceOver',
  'Visa & Immigration',
  'Overseas Education',
  'Desktop Publishing (DTP)',
  'Information Technology',
  'Enterprise Software',
];

export const SESSION_KEY_RETURN = 'zcrm.callDashboards.returnState.v5';

// ============================================================================
// HELPER FUNCTIONS (Exported for shared use in Dashboard.jsx and Reports.jsx)
// ============================================================================
export function formatCurrencyINR(amount) {
  const n = Number(amount) || 0;
  return `Rs. ${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatNumber(n) {
  return (Number(n) || 0).toLocaleString('en-IN');
}

export function formatDateTimeDisplay(isoStr) {
  if (!isoStr) return '—';
  const d = parseDate(isoStr);
  if (!d) return isoStr;
  return `${fmtDate(isoStr)}${isoStr.includes('T') ? ` ${fmtTime(isoStr)}` : ''}`;
}

export function describeDateFilter(df) {
  if (!df || !df.mode || df.mode === 'Any Time') return 'Any Time';
  if (df.mode === 'Last') return `Last ${df.lastCount || 7} ${df.lastUnit || 'Days'}`;
  if (df.mode === 'Before') return df.date ? `Before ${df.date}` : 'Before';
  if (df.mode === 'After') return df.date ? `After ${df.date}` : 'After';
  if (df.mode === 'Specific Date') return df.date ? `${df.date}` : 'Specific Date';
  if (df.mode === 'Custom') {
    if (df.from && df.to) return `${df.from} to ${df.to}`;
    if (df.from) return `From ${df.from}`;
    if (df.to) return `Until ${df.to}`;
    return 'Custom';
  }
  return df.mode;
}

export function matchesDateFilter(isoValue, filterConfig, refTodayIso) {
  if (!filterConfig || !filterConfig.mode || filterConfig.mode === 'Any Time') {
    return true;
  }
  if (!isoValue) return false;
  const datePart = String(isoValue).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return true;

  const refStr = refTodayIso || todayISO();
  const refDate = new Date(`${refStr}T00:00:00`);
  const recDate = new Date(`${datePart}T00:00:00`);
  if (isNaN(recDate.getTime())) return false;

  const mode = filterConfig.mode;

  if (mode === 'Today') {
    return datePart === refStr;
  }

  if (mode === 'This Week') {
    const dayOfWeek = refDate.getDay();
    const startOfWeek = new Date(refDate);
    startOfWeek.setDate(refDate.getDate() - dayOfWeek);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return recDate >= startOfWeek && recDate <= endOfWeek;
  }

  if (mode === 'This Month') {
    return (
      recDate.getFullYear() === refDate.getFullYear() &&
      recDate.getMonth() === refDate.getMonth()
    );
  }

  if (mode === 'This Quarter') {
    const refQ = Math.floor(refDate.getMonth() / 3);
    const recQ = Math.floor(recDate.getMonth() / 3);
    return recDate.getFullYear() === refDate.getFullYear() && recQ === refQ;
  }

  if (mode === 'This Year') {
    return recDate.getFullYear() === refDate.getFullYear();
  }

  if (mode === 'This Fiscal Year') {
    const fyStartYear = refDate.getMonth() >= 3 ? refDate.getFullYear() : refDate.getFullYear() - 1;
    const fyStart = new Date(`${fyStartYear}-04-01T00:00:00`);
    const fyEnd = new Date(`${fyStartYear + 1}-03-31T23:59:59`);
    return recDate >= fyStart && recDate <= fyEnd;
  }

  if (mode === 'Last') {
    const count = Math.max(1, Number(filterConfig.lastCount) || 7);
    const unit = filterConfig.lastUnit || 'Days';
    const startDate = new Date(refDate);
    if (unit === 'Days') startDate.setDate(refDate.getDate() - count);
    else if (unit === 'Weeks') startDate.setDate(refDate.getDate() - count * 7);
    else if (unit === 'Months') startDate.setMonth(refDate.getMonth() - count);
    return recDate >= startDate && recDate <= refDate;
  }

  if (mode === 'Before') {
    if (!filterConfig.date) return true;
    return datePart < filterConfig.date;
  }

  if (mode === 'After') {
    if (!filterConfig.date) return true;
    return datePart > filterConfig.date;
  }

  if (mode === 'Specific Date') {
    if (!filterConfig.date) return true;
    return datePart === filterConfig.date;
  }

  if (mode === 'Custom') {
    if (filterConfig.from && datePart < filterConfig.from) return false;
    if (filterConfig.to && datePart > filterConfig.to) return false;
    return true;
  }

  return true;
}

/**
  * Shared builder that transforms CRM `calls`, `leads`, `deals`, `oldDeals`, and `contacts`
  * into the unified Zoho CRM Call Report dataset used by both Dashboards and Reports.
  */
export function buildUnifiedCallRecords({
  calls = [],
  leads = [],
  deals = [],
  oldDeals = [],
  contacts = [],
  userName,
  contactName,
}) {
  const today = todayISO();

  const dealsByContact = {};
  const dealsByAccount = {};
  deals.forEach((d) => {
    if (d.contactId && !dealsByContact[d.contactId]) dealsByContact[d.contactId] = d;
    if (d.accountId && !dealsByAccount[d.accountId]) dealsByAccount[d.accountId] = d;
  });

  const oldDealsByAccount = {};
  oldDeals.forEach((od) => {
    if (od.accountId && !oldDealsByAccount[od.accountId]) oldDealsByAccount[od.accountId] = od;
  });

  const leadsByCallId = {};
  leads.forEach((l) => {
    if (l.connectedCallId) leadsByCallId[l.connectedCallId] = l;
  });

  const records = [];

  // A. Transform all actual CRM `calls` records
  calls.forEach((c, idx) => {
    const matchedLiveDeal =
      dealsByContact[c.contactId] ||
      dealsByAccount[c.accountId] ||
      deals[idx % Math.max(1, deals.length)];

    const matchedOldDeal =
      oldDealsByAccount[c.accountId] ||
      (idx % 2 === 0 && oldDeals.length > 0 ? oldDeals[idx % oldDeals.length] : null);
    const matchedLead =
      leadsByCallId[c.id] ||
      (leads.length > 0 ? leads[idx % leads.length] : null);
    const matchedContact = contacts.find((con) => con.id === c.contactId) || contacts[idx % Math.max(1, contacts.length)] || null;

    const durationSeconds = Math.max(0, Number(c.duration) || 0);
    const isAttended = c.status === 'Completed' && durationSeconds > 0;
    const isUnAttended = !isAttended;

    const rawStartTime = c.dateTime || `${today}T10:00`;
    const rawCreatedTime =
      c.createdOn ||
      (idx < 18 ? today : rawStartTime.slice(0, 10));

    const category =
      matchedLead?.category ||
      matchedLiveDeal?.department ||
      CATEGORIES_LIST[idx % CATEGORIES_LIST.length];

    const fullName =
      (c.contactId && contactName ? contactName(c.contactId) : '') ||
      matchedContact?.name ||
      matchedLead?.name ||
      'Client Contact';

    const dealRecord = matchedLiveDeal || matchedOldDeal || deals[0];

    records.push({
      id: c.id,
      callId: c.id,
      ownerId: c.ownerId || 'u1',
      callOwner: userName ? userName(c.ownerId || 'u1') : 'Sibi Chakaravarthi',
      subject: c.subject || 'Follow up Call',
      callType: c.type || 'Outbound',
      callStatus: c.status || 'Completed',
      durationSeconds,
      isAttended,
      isUnAttended,
      callStartTime: rawStartTime,
      createdTime: rawCreatedTime,
      dealId: dealRecord?.id || 'deal-001',
      dealName: dealRecord?.name || 'Enterprise CRM Deal',
      dealStage: dealRecord?.stage || 'Qualification',
      amount: Number(dealRecord?.amount) || 0,
      leadId: matchedLead?.id || 'lead-1',
      leadName: matchedLead?.name || fullName,
      company: matchedLead?.company || dealRecord?.name || 'Enterprise Client',
      mobile: matchedLead?.mobile || matchedLead?.phone || matchedContact?.phone || '+91 98400 11223',
      leadSource: matchedLead?.source || matchedLead?.leadSource || 'Website',
      leadStatus: matchedLead?.status || 'Contacted',
      categories: category,
      remarks: c.notes || matchedLead?.remarks || 'Call logged in CRM',
      fullName,
      contactId: matchedContact?.id || c.contactId || 'con-001',
      hasLead: Boolean(
        matchedLead &&
          (leadsByCallId[c.id] ||
            idx % 2 === 0 ||
            ['New Business Call', 'Product Demo Call', 'Requirement Discussion', 'Follow up Call'].includes(c.subject))
      ),
      hasLiveDeal: Boolean(matchedLiveDeal),
      hasOldDeal: Boolean(matchedOldDeal),
      hasDealContact: Boolean(matchedContact && (dealsByContact[c.contactId] || dealsByAccount[c.accountId] || idx % 2 === 0)),
    });
  });

  // B. Also include Lead call logs from `leads`
  leads.forEach((l, idx) => {
    const leadCallSec = Number(l.totalCallDurations || l.directCallDuration) || (idx % 3 === 0 ? 185 : 0);
    const linkedCallId = l.connectedCallId || (calls[idx % Math.max(1, calls.length)]?.id ?? 'call-001');
    if (leadCallSec > 0 && !calls.some((c) => c.id === `lead-call-${l.id}`)) {
      const linkedDeal =
        deals.find((d) => d.id === l.connectedDealId) ||
        deals[idx % Math.max(1, deals.length)];
      const startIso =
        l.createdOn && /^\d{4}-\d{2}-\d{2}$/.test(l.createdOn)
          ? `${l.createdOn}T10:30`
          : `${today}T10:30`;

      records.push({
        id: `lead-call-${l.id}`,
        callId: linkedCallId,
        ownerId: l.ownerId || 'u1',
        callOwner: userName ? userName(l.ownerId || 'u1') : 'Karthik S',
        subject: `Lead Follow-up: ${l.name}`,
        callType: 'Outbound',
        callStatus: 'Completed',
        durationSeconds: leadCallSec,
        isAttended: true,
        isUnAttended: false,
        callStartTime: startIso,
        createdTime: l.createdOn || today,
        dealId: linkedDeal?.id || 'deal-001',
        dealName: l.convertedDeal || linkedDeal?.name || `${l.company || l.name} Deal`,
        dealStage: linkedDeal?.stage || 'Qualification',
        amount: Number(linkedDeal?.amount) || 450000,
        leadId: l.id,
        leadName: l.name,
        company: l.company || l.clientName || 'Enterprise Account',
        mobile: l.mobile || l.phone || '+91 98401 22334',
        leadSource: l.source || l.leadSource || 'Website',
        leadStatus: l.status || 'Assigned',
        categories: l.category || 'Translation Services',
        remarks: l.remarks || l.comments || 'Lead qualification call completed',
        fullName: l.name,
        contactId: l.connectedContactId || 'con-001',
        hasLead: true,
        hasLiveDeal: Boolean(l.connectedDealId || idx % 2 === 0),
        hasOldDeal: idx % 3 === 0,
        hasDealContact: Boolean(l.connectedContactId || idx % 2 === 0),
      });
    }
  });

  return records;
}

export function filterRecordsForReportKey(records, reportKey) {
  return records.filter((r) => {
    switch (reportKey) {
      case 'overall_unattended':
        return Boolean(r.isUnAttended);
      case 'overall_attended':
        return Boolean(r.isAttended);
      case 'leads_calls':
        return Boolean(r.hasLead);
      case 'deals_live_calls':
        return Boolean(r.hasLiveDeal);
      case 'deals_old_calls':
        return Boolean(r.hasOldDeal);
      case 'deals_contact_calls':
        return Boolean(r.hasDealContact);
      case 'overall_all':
      default:
        return true;
    }
  });
}

