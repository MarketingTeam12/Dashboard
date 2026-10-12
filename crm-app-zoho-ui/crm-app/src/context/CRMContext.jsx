import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildSeed, SEED_VERSION, seedReports, USERS } from '../data/seedData';
import { clearAll, loadKey, saveKey } from '../utils/storage';
import { addDays, todayISO } from '../utils/calculations';
import { COLLECTION_MODULE, recordLabel, runWorkflows } from '../workflows/workflowEngine';
import { useToast } from '../components/common/toastContext';
import { loadCustomization } from '../pages/Leads/zohoCustomizationConfig';
import { CRMContext } from './crmContextInstance';

const KEYS = ['accounts', 'contacts', 'deals', 'calls', 'invoices', 'oldDeals', 'baselines', 'workflows', 'notifications', 'tasks', 'activity', 'workflowHistory', 'leads', 'campaigns', 'agents', 'reports', 'messages'];
const PREFIX = { accounts: 'acc', contacts: 'con', deals: 'deal', calls: 'call', invoices: 'inv', leads: 'lead', campaigns: 'camp', agents: 'ag', reports: 'rep', messages: 'msg' };
const CAP = 500;

function freshSeed() {
  const seed = buildSeed();
  const today = todayISO();
  seed.contacts = seed.contacts.map((c) => (c.followUp === '__today__' ? { ...c, followUp: today } : c));
  seed.leads = (seed.leads || []).map((l) =>
    l.createdOn === '__today__' ? { ...l, createdOn: today, date: today } : l
  );
  seed.messages = (seed.messages || []).map((m) => {
    const resolvedDate = typeof m.dayOffset === 'number' ? addDays(today, m.dayOffset) : (m.date === '__today__' ? today : m.date);
    const resolvedDue = typeof m.dueDayOffset === 'number' ? addDays(today, m.dueDayOffset) : (m.dueDate || resolvedDate);
    const resolvedRepliedDate = typeof m.repliedDayOffset === 'number' ? addDays(today, m.repliedDayOffset) : (m.repliedDate || (m.replied ? resolvedDate : ''));
    return {
      ...m,
      date: resolvedDate,
      dueDate: resolvedDue,
      repliedDate: resolvedRepliedDate,
    };
  });
  return seed;
}

function loadAll() {
  if (loadKey('version', 0) !== SEED_VERSION) {
    clearAll();
    const seed = freshSeed();
    saveKey('version', SEED_VERSION);
    return seed;
  }
  const seed = {};
  let missing = false;
  KEYS.forEach((k) => {
    seed[k] = loadKey(k, undefined);
    if (seed[k] === undefined) missing = true;
  });
  if (missing) {
    const fresh = freshSeed();
    KEYS.forEach((k) => { if (seed[k] === undefined) seed[k] = fresh[k]; });
  }
  // Ensure the 7 standard Dashboard Call Reports exist in seed.reports even if loaded from an older localStorage snapshot
  if (Array.isArray(seed.reports)) {
    const freshReports = seedReports();
    const existingIds = new Set(seed.reports.map((r) => r.id));
    const missingReports = freshReports.filter((r) => !existingIds.has(r.id));
    if (missingReports.length > 0) {
      seed.reports = [...missingReports, ...seed.reports];
    }
  }
  return seed;
}

const newId = (col) => `${PREFIX[col] || 'rec'}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function CRMProvider({ children }) {
  const toast = useToast();
  const [db, setDb] = useState(loadAll);
  const dbRef = useRef(db);
  dbRef.current = db;

  useEffect(() => {
    KEYS.forEach((k) => saveKey(k, db[k]));
    saveKey('version', SEED_VERSION);
  }, [db]);

  const lookups = useMemo(() => ({
    accountsById: Object.fromEntries(db.accounts.map((a) => [a.id, a])),
    contactsById: Object.fromEntries(db.contacts.map((c) => [c.id, c])),
    dealsById: Object.fromEntries((db.deals || []).map((d) => [d.id, d])),
    callsById: Object.fromEntries((db.calls || []).map((c) => [c.id, c])),
    leadsById: Object.fromEntries((db.leads || []).map((l) => [l.id, l])),
    campaignsById: Object.fromEntries((db.campaigns || []).map((cp) => [cp.id, cp])),
    agentsById: Object.fromEntries((db.agents || []).map((ag) => [ag.id, ag])),
    usersById: Object.fromEntries(USERS.map((u) => [u.id, u])),
  }), [db.accounts, db.contacts, db.deals, db.calls, db.leads, db.campaigns, db.agents]);

  /** Run workflows + merge side effects into state */
  const applyEvent = useCallback((col, type, record, prev) => {
    const module = COLLECTION_MODULE[col];
    if (!module) return { patch: {}, notifications: [], tasks: [], activity: [], history: [], fired: [], messages: [] };
    const res = runWorkflows(dbRef.current.workflows, { module, type, record, prev }, { users: USERS });
    if (res.fired.length) {
      const executed = res.fired.filter((f) => f.executed);
      if (executed.length) toast.info(`Workflow ran: ${executed.map((f) => f.name).join(', ')}`);
    }
    return res;
  }, [toast]);

  const mergeEffects = (d, res, extraActivity = []) => {
    const now = new Date().toISOString();
    const firedIds = new Set(res.fired.map((f) => f.id));
    return {
      notifications: [...(res.notifications || []), ...d.notifications].slice(0, CAP),
      tasks: [...(res.tasks || []), ...d.tasks].slice(0, CAP),
      messages: res.messages?.length ? [...res.messages, ...(d.messages || [])].slice(0, CAP) : (d.messages || []),
      activity: [...(res.activity || []), ...extraActivity, ...d.activity].slice(0, CAP),
      workflowHistory: [...(res.history || []), ...d.workflowHistory].slice(0, CAP),
      workflows: firedIds.size ? d.workflows.map((w) => (firedIds.has(w.id) ? { ...w, runs: (w.runs || 0) + 1, lastRun: now } : w)) : d.workflows,
    };
  };

  const userLog = (col, verb, record) => ({
    id: `log-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, module: COLLECTION_MODULE[col],
    recordId: record.id, recordLabel: recordLabel(record), message: `${COLLECTION_MODULE[col]} record "${recordLabel(record)}" ${verb}.`,
    createdAt: new Date().toISOString(), source: 'user',
  });

  const notify = useCallback((msg, type = 'success') => {
    if (type === 'error') toast.error(msg);
    else if (type === 'info') toast.info(msg);
    else toast.success(msg);
  }, [toast]);

  const DEFAULT_LEADS_UI = {
    tab: 'My Leads',
    pinnedTabs: ["All Leads", "Today's Leads", 'My Leads', 'Chennai', 'Website', 'Delhi'],
    viewsDisplayMode: 'tabs',
    search: '',
    panelSearch: '',
    sortField: 'createdOn',
    sortDir: 'desc',
    page: 1,
    pageSize: 30,
    viewMode: 'list',
    logicMode: 'AND',
    appliedFilters: {
      system: {},
      fields: {},
      related: {},
      quickPreset: '',
    },
    customViews: [],
    viewOverrides: {},
    savedFilters: [
      { id: 'sf-1', name: 'Untouched this week', system: { 'Untouched Records': { enabled: true, mode: 'All' } }, fields: {}, related: {} },
    ],
  };

  const [leadsUiState, setLeadsUiState] = useState(() => {
    const saved = loadKey('leadsUiState', DEFAULT_LEADS_UI) || DEFAULT_LEADS_UI;
    return {
      ...DEFAULT_LEADS_UI,
      ...saved,
      pinnedTabs: Array.isArray(saved.pinnedTabs) && saved.pinnedTabs.length > 0
        ? saved.pinnedTabs
        : DEFAULT_LEADS_UI.pinnedTabs,
    };
  });

  useEffect(() => {
    saveKey('leadsUiState', leadsUiState);
  }, [leadsUiState]);

  const updateLeadsUiState = useCallback((patch) => {
    setLeadsUiState((prev) => {
      const next = typeof patch === 'function' ? patch(prev) : { ...prev, ...patch };
      return next;
    });
  }, []);

  const formatShortNow = () => {
    const d = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const t = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]}, ${t}`;
  };

  const checkPermission = useCallback((permKey, actionLabel) => {
    try {
      const custom = loadCustomization();
      const activeRole = custom?.activeRole || 'Administrator';
      const perms = custom?.rolePermissions?.[activeRole] || {};
      if (perms[permKey] === false) {
        toast.error(`Permission Denied: Role "${activeRole}" is not authorized to ${actionLabel}.`);
        return false;
      }
    } catch {
      // default allow on read error
    }
    return true;
  }, [toast]);

  const createRecord = useCallback((col, data) => {
    if (!checkPermission('canCreate', `create ${col} records`)) return null;
    const nowIso = new Date().toISOString();
    const today = todayISO();
    let baseData = { ...data };
    let autoTask = null;

    if (col === 'leads') {
      const existingLeads = dbRef.current.leads || [];
      const maxNo = existingLeads.reduce((max, l) => {
        const m = String(l.leadNo || '').match(/(\d+)/);
        return m ? Math.max(max, Number(m[1])) : max;
      }, 1020);
      const shortTime = formatShortNow();
      const custom = loadCustomization();
      const activeRules = (custom?.workflowRules || []).filter((r) => r.active);

      const cityVal = baseData.city || 'Chennai';
      const chennaiRule = activeRules.find((r) => r.id === 'wf-1' || String(r.trigger || '').toLowerCase().includes('chennai'));
      let ownerId = baseData.ownerId || USERS.find((u) => u.name === baseData.assignedTo)?.id || 'u4';
      if (chennaiRule && String(cityVal).toLowerCase() === 'chennai' && !baseData.ownerId) {
        ownerId = 'u2'; // Karthik S
      }

      const visitorScore = Number(baseData.visitorScore || baseData.score) || 80;
      const requestedTag = baseData.tag ?? baseData.tagField ?? '';
      const resolvedTag = String(requestedTag).trim().toLowerCase() === 'hot lead' ? '' : requestedTag;

      const creatorName = baseData.createdBy || 'Sibi Chakaravarthi';
      baseData = {
        salutation: baseData.salutation || 'Mr.',
        leadNo: baseData.leadNo || `LEAD-${maxNo + 1}`,
        firstName: baseData.firstName || (baseData.name || '').split(' ')[0] || 'Lead',
        lastName: baseData.lastName || (baseData.name || '').split(' ').slice(1).join(' ') || '',
        name: baseData.name || `${baseData.firstName || ''} ${baseData.lastName || ''}`.trim() || 'New Lead',
        company: baseData.company || 'Prospective Enterprise',
        clientName: baseData.clientName || baseData.name || 'New Client',
        email: baseData.email || '',
        phone: baseData.phone || baseData.mobile || '',
        mobile: baseData.mobile || baseData.phone || '',
        phoneAlt: baseData.phoneAlt || baseData.phone || '',
        city: cityVal,
        state: baseData.state || 'Tamil Nadu',
        country: baseData.country || 'India',
        street: baseData.street || baseData.address || '',
        zip: baseData.zip || '600001',
        branchArea: baseData.branchArea || cityVal,
        status: baseData.status || 'Assigned',
        readStatus: baseData.readStatus || 'Unread',
        source: baseData.source || baseData.leadSource || 'Website',
        leadSource: baseData.leadSource || baseData.source || 'Website',
        category: baseData.category || baseData.industry || 'Information Technology',
        industry: baseData.industry || baseData.category || 'Information Technology',
        productName: baseData.productName || baseData.productInterest || 'Cloud CRM Suite',
        tagField: baseData.tagField || resolvedTag,
        allottedManagerId: baseData.allottedManagerId || 'u1',
        leadManager1Id: baseData.leadManager1Id || ownerId,
        createdBy: creatorName,
        createdTime: baseData.createdTime && !baseData.createdTime.includes('T') ? baseData.createdTime : shortTime,
        createdOn: baseData.createdOn || today,
        date: baseData.date || today,
        pushTime: baseData.pushTime || shortTime,
        assignedTime: baseData.assignedTime || shortTime,
        assignedAt: nowIso,
        assignedWithinLast3Hours: true,
        modifiedTime: shortTime,
        lastActivityTime: shortTime,
        leadAging: '0 days',
        leadActivityAging: '0 days',
        ceoApproval: baseData.ceoApproval || 'Pending',
        performance: baseData.performance || 'Good',
        sourceLang: baseData.sourceLang || 'English',
        targetLang: baseData.targetLang || 'Tamil',
        workingHours: baseData.workingHours || '09:00 AM - 06:00 PM',
        websiteSource: baseData.websiteSource || baseData.website || 'crm.in',
        callAttemptCount: Number(baseData.callAttemptCount) || 0,
        callDelay: Number(baseData.callDelay) || 0,
        callStartTime: baseData.callStartTime || '',
        directCallDuration: Number(baseData.directCallDuration) || 0,
        whatsappCallDuration: Number(baseData.whatsappCallDuration) || 0,
        totalCallCount: Number(baseData.totalCallCount) || 0,
        totalCallDurations: Number(baseData.totalCallDurations) || 0,
        checkbox1: !!baseData.checkbox1,
        dashboardReq: baseData.dashboardReq !== undefined ? !!baseData.dashboardReq : true,
        reopenLead: !!baseData.reopenLead,
        workflowCheckbox: baseData.workflowCheckbox !== undefined ? !!baseData.workflowCheckbox : true,
        locked: !!baseData.locked,
        touched: false,
        recordAction: 'Created',
        relatedRecordsAction: 'Task Created',
        cadence: baseData.cadence || 'Inbound Lead Cadence',
        emailSentiment: baseData.emailSentiment || 'Positive',
        latestEmailStatus: baseData.latestEmailStatus || 'Delivered',
        campaignType: baseData.campaignType || 'Zoho Campaigns',
        campaignName: baseData.campaignName || 'General Inbound Campaign',
        averageTimeSpent: Number(baseData.averageTimeSpent) || 10,
        daysVisited: Number(baseData.daysVisited) || 2,
        firstPageVisited: baseData.firstPageVisited || '/home',
        firstVisit: today,
        mostRecentVisit: today,
        numberOfChats: Number(baseData.numberOfChats) || 1,
        referrer: baseData.referrer || 'google.com',
        visitorScore,
        activities: baseData.activities || [
          { id: `act-${Date.now()}`, type: 'Lead Created', desc: `Lead record created (${baseData.leadSource || baseData.source || 'Website'}) & assigned for follow-up`, by: creatorName, date: `${today} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, status: 'Completed' },
        ],
        emails: baseData.emails || [],
        attachments: baseData.attachments || [],
        surveys: baseData.surveys || [],
        signDocuments: baseData.signDocuments || [],
        whatsappMessages: baseData.whatsappMessages || [
          { id: `wa-${Date.now()}`, text: `Hi ${baseData.firstName || baseData.name || 'there'}, Welcome! Our Sales Representative will contact you shortly…`, date: shortTime, via: 'WhatsApp', sender: creatorName, direction: 'Outbound' },
        ],
        notes: baseData.notes || [],
        products: baseData.products || [],
        campaigns: baseData.campaigns || [
          { id: `camp-${Date.now()}`, name: baseData.campaignName || 'General Inbound Campaign', type: baseData.campaignType || 'Zoho Campaigns', status: 'Active', memberStatus: 'Responded' },
        ],
        ...baseData,
        tag: resolvedTag,
        ownerId: baseData.ownerId || ownerId,
      };
    }

    let record = { ...baseData, id: newId(col), createdOn: baseData.createdOn || today };
    if (col === 'leads') {
      autoTask = {
        id: `wq-${Date.now().toString(36)}`,
        subject: `Initial Call & Qualification Follow-up — ${record.name}`,
        title: `Initial Call & Qualification Follow-up — ${record.name}`,
        dueDate: today,
        status: 'Not Started',
        priority: 'High',
        relatedTo: record.company || record.name,
        contactName: record.name,
        leadId: record.id,
        ownerId: record.ownerId || 'u1',
      };
    }

    const res = applyEvent(col, 'created', record, null);
    record = { ...record, ...res.patch };
    setDb((d) => {
      const merged = mergeEffects(d, res, [userLog(col, 'created', record)]);
      if (autoTask) {
        merged.tasks = [autoTask, ...(merged.tasks || [])].slice(0, CAP);
      }
      return { ...d, [col]: [record, ...d[col]], ...merged };
    });
    return record;
  }, [applyEvent, checkPermission]);

  const updateRecord = useCallback((col, id, patch) => {
    if (!checkPermission('canEdit', `edit ${col} records`)) return null;
    const prev = dbRef.current[col].find((r) => r.id === id);
    if (!prev) return null;
    const nowIso = new Date().toISOString();
    const shortTime = formatShortNow();
    let extraPatch = {};

    if (col === 'leads') {
      const changes = [];
      if (patch.status && patch.status !== prev.status) changes.push(`Lead Status changed from "${prev.status || '—'}" to "${patch.status}"`);
      if (patch.ownerId && patch.ownerId !== prev.ownerId) {
        const oldOwner = USERS.find((u) => u.id === prev.ownerId)?.name || prev.ownerId;
        const newOwner = USERS.find((u) => u.id === patch.ownerId)?.name || patch.ownerId;
        changes.push(`Lead Owner changed from ${oldOwner} to ${newOwner}`);
        extraPatch.assignedAt = nowIso;
        extraPatch.assignedTime = shortTime;
        extraPatch.assignedWithinLast3Hours = true;
      }
      if (patch.tag && patch.tag !== prev.tag) changes.push(`Tag updated to "${patch.tag}"`);
      if (patch.source && patch.source !== prev.source) changes.push(`Lead Source updated to "${patch.source}"`);
      if (patch.name && patch.name !== prev.name) changes.push(`Lead Name updated to "${patch.name}"`);
      if (!changes.length && !patch._silentActivity) {
        const editedKeys = Object.keys(patch).filter((k) => !['activities', 'emails', 'attachments', 'surveys', 'signDocuments', 'whatsappMessages', 'notes', 'products', 'campaigns', '_silentActivity'].includes(k) && patch[k] !== prev[k]);
        if (editedKeys.length) changes.push(`Updated fields: ${editedKeys.slice(0, 4).join(', ')}`);
      }
      const prevActs = Array.isArray(patch.activities) ? patch.activities : (prev.activities || []);
      const newActs = changes.length
        ? [...prevActs, { id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, type: patch.status && patch.status !== prev.status ? 'Status Updated' : 'Lead Updated', desc: changes.join('; '), by: 'Sibi Chakaravarthi', date: `${todayISO()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, status: 'Completed' }]
        : prevActs;
      extraPatch = {
        ...extraPatch,
        activities: newActs,
        modifiedTime: shortTime,
        lastActivityTime: shortTime,
        recordAction: 'Modified',
      };
    }

    const cleanPatch = { ...patch };
    delete cleanPatch._silentActivity;

    let next = { ...prev, ...cleanPatch, ...extraPatch, touched: true, updatedAt: nowIso };
    const res = applyEvent(col, 'updated', next, prev);
    next = { ...next, ...res.patch };
    setDb((d) => ({ ...d, [col]: d[col].map((r) => (r.id === id ? next : r)), ...mergeEffects(d, res, [userLog(col, 'updated', next)]) }));
    return next;
  }, [applyEvent, checkPermission]);

  const deleteRecords = useCallback((col, ids) => {
    if (!checkPermission('canDelete', `delete ${col} records`)) return 0;
    const set = new Set(ids);
    const removed = dbRef.current[col].filter((r) => set.has(r.id));
    const combined = { patch: {}, notifications: [], tasks: [], activity: [], history: [], fired: [] };
    removed.forEach((r) => {
      const res = applyEvent(col, 'deleted', r, r);
      ['notifications', 'tasks', 'activity', 'history', 'fired'].forEach((k) => combined[k].push(...res[k]));
    });
    setDb((d) => {
      const next = { ...d, [col]: d[col].filter((r) => !set.has(r.id)) };
      if (col === 'accounts') {
        ['contacts', 'deals', 'calls', 'invoices'].forEach((c) => {
          next[c] = d[c].map((r) => (set.has(r.accountId) ? { ...r, accountId: '' } : r));
        });
      }
      if (col === 'contacts') {
        ['deals', 'calls'].forEach((c) => {
          next[c] = d[c].map((r) => (set.has(r.contactId) ? { ...r, contactId: '' } : r));
        });
      }
      return { ...next, ...mergeEffects(d, combined, removed.map((r) => userLog(col, 'deleted', r))) };
    });
    return removed.length;
  }, [applyEvent, checkPermission]);

  const deleteRecord = useCallback((col, id) => deleteRecords(col, [id]), [deleteRecords]);

  // ---- workflows ----
  const saveWorkflow = useCallback((wf) => {
    const exists = dbRef.current.workflows.some((w) => w.id === wf.id);
    const record = exists ? wf : { ...wf, id: wf.id || `wf-${Date.now().toString(36)}`, createdAt: new Date().toISOString(), runs: 0, lastRun: null };
    setDb((d) => ({ ...d, workflows: exists ? d.workflows.map((w) => (w.id === wf.id ? { ...w, ...record } : w)) : [record, ...d.workflows] }));
    return record;
  }, []);
  const deleteWorkflow = useCallback((id) => setDb((d) => ({ ...d, workflows: d.workflows.filter((w) => w.id !== id) })), []);
  const toggleWorkflow = useCallback((id, active) => setDb((d) => ({ ...d, workflows: d.workflows.map((w) => (w.id === id ? { ...w, active } : w)) })), []);

  // ---- notifications / tasks ----
  const markNotification = useCallback((id) => setDb((d) => ({ ...d, notifications: d.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })), []);
  const markAllRead = useCallback(() => setDb((d) => ({ ...d, notifications: d.notifications.map((n) => ({ ...n, read: true })) })), []);
  const clearNotifications = useCallback(() => setDb((d) => ({ ...d, notifications: [] })), []);
  const updateTask = useCallback((id, patch) => {
    const shortTime = formatShortNow();
    const today = todayISO();
    setDb((d) => {
      const targetTask = (d.tasks || []).find((t) => t.id === id);
      const nextTasks = (d.tasks || []).map((t) => (t.id === id ? { ...t, ...patch } : t));
      let nextLeads = d.leads || [];

      if (targetTask && patch.status === 'Completed' && targetTask.status !== 'Completed') {
        const contactLower = String(targetTask.contactName || '').toLowerCase();
        const relatedLower = String(targetTask.relatedTo || '').toLowerCase();
        nextLeads = nextLeads.map((l) => {
          const matchesLead =
            (targetTask.leadId && l.id === targetTask.leadId) ||
            (contactLower && String(l.name || '').toLowerCase() === contactLower) ||
            (relatedLower && String(l.company || '').toLowerCase() === relatedLower);
          if (!matchesLead) return l;
          const act = {
            id: `act-${Date.now()}`,
            type: 'Follow-up Completed',
            desc: `Workqueue task completed: "${targetTask.subject || targetTask.title}"`,
            by: 'Sibi Chakaravarthi',
            date: `${today} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            status: 'Completed',
          };
          return {
            ...l,
            status: l.status === 'New' || l.status === 'Assigned' ? 'Contacted' : l.status,
            lastActivityTime: shortTime,
            modifiedTime: shortTime,
            callAttemptCount: (Number(l.callAttemptCount) || 0) + 1,
            touched: true,
            activities: [...(l.activities || []), act],
          };
        });
      }

      return { ...d, tasks: nextTasks, leads: nextLeads };
    });
  }, []);
  const deleteTask = useCallback((id) => setDb((d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== id) })), []);

  // ---- leads specialized ----
  const convertLead = useCallback((leadId, options = {}) => {
    if (!checkPermission('canConvert', 'convert leads')) return null;
    const lead = (dbRef.current.leads || []).find((l) => l.id === leadId);
    if (!lead) return null;

    // Prevent duplicate conversion
    if (lead.status === 'Converted' && (lead.convertedContactId || lead.convertedDealId)) {
      toast.error(`Lead "${lead.name}" has already been converted.`);
      return { alreadyConverted: true, lead };
    }

    const {
      createDeal = false,
      ownerId = lead.ownerId || 'u1',
      notifyOwner = true,
      carryTagsToContact = true,
      carryTagsToDeal = true,
      contactTags = [],
      dealTags = [],
      contactName: customContactName,
      contactEmail: customContactEmail,
      contactPhone: customContactPhone,
      // 16 Deal fields when createDeal is checked
      leadManager1 = 'Sibi Chakaravarthi',
      dealName = '',
      closingDate = '',
      leadSource = lead.leadSource || lead.source || 'Website',
      stage = 'Qualification',
      city = lead.city || 'Chennai',
      sourceLanguageList = lead.sourceLang || 'English',
      targetLanguageList = lead.targetLang || 'Tamil',
      categories = lead.category || lead.industry || 'Translation Services',
      remarks = lead.remarks || '',
      clientBudget = 450000,
      amount,
      purposeOfTranslation = 'Official / Legal Submission',
      jobType = 'Document Translation',
      deliveryType = 'Standard Delivery (3-5 Days)',
      campaignSource = lead.campaignName || 'General Inbound Campaign',
      contactRole = 'Decision Maker',
    } = options;

    const now = todayISO();
    const resolvedContactTags = carryTagsToContact
      ? (contactTags.length > 0 ? contactTags : lead.tag && lead.tag !== 'Lead' ? [lead.tag] : [])
      : [];
    const resolvedDealTags = carryTagsToDeal
      ? (dealTags.length > 0 ? dealTags : lead.tag && lead.tag !== 'Lead' ? [lead.tag] : [])
      : [];

    let account = dbRef.current.accounts.find(
      (a) => (a.name || '').toLowerCase() === (lead.company || '').toLowerCase()
    );
    if (!account && lead.company) {
      account = {
        id: newId('accounts'),
        name: lead.company,
        type: 'Customer',
        industry: categories || lead.industry || 'Services',
        city: city || lead.city || 'Chennai',
        location: city || lead.city || 'Chennai',
        phone: customContactPhone || lead.phone || lead.mobile || '',
        annualRevenue: 5000000,
        status: 'Active',
        ownerId,
        createdOn: now,
      };
    }

    // Create or link Contact
    let existingContact = dbRef.current.contacts.find(
      (c) =>
        (customContactEmail || lead.email) &&
        c.email &&
        c.email.toLowerCase() === String(customContactEmail || lead.email).toLowerCase()
    );

    const contact = existingContact
      ? {
          ...existingContact,
          ownerId,
          tags: Array.from(new Set([...(existingContact.tags || []), ...resolvedContactTags])),
          tag: resolvedContactTags[0] || existingContact.tag || '',
        }
      : {
          id: newId('contacts'),
          name: customContactName || lead.name,
          accountId: account?.id || '',
          designation: contactRole || lead.designation || 'Decision Maker',
          email: customContactEmail || lead.email || '',
          phone: customContactPhone || lead.phone || lead.mobile || '',
          city: city || lead.city || 'Chennai',
          lifecycle: 'Customer',
          leadSource: leadSource || lead.source || 'Website',
          ownerId,
          tags: resolvedContactTags,
          tag: resolvedContactTags[0] || '',
          createdOn: now,
        };

    let deal = null;
    if (createDeal) {
      const numericAmount = Number(clientBudget ?? amount) || 450000;
      const custom = loadCustomization();
      const approvalRuleActive = (custom?.workflowRules || []).some(
        (r) => r.active && (r.id === 'wf-3' || String(r.action || '').toLowerCase().includes('approval'))
      );
      const requiresApproval = approvalRuleActive || numericAmount >= 300000;

      deal = {
        id: newId('deals'),
        name: (dealName || `${lead.company || lead.name} - Deal`).trim(),
        accountId: account?.id || '',
        contactId: contact.id,
        amount: numericAmount,
        clientBudget: numericAmount,
        stage: stage || 'Qualification',
        probability: stage === 'Closed Won' ? 100 : stage === 'Closed Lost' ? 0 : 60,
        source: leadSource || lead.source || 'Website',
        leadSource: leadSource || lead.source || 'Website',
        department: categories || 'Translation Services',
        categories,
        leadManager1,
        city: city || lead.city || 'Chennai',
        sourceLanguageList: Array.isArray(sourceLanguageList) ? sourceLanguageList : [sourceLanguageList],
        targetLanguageList: Array.isArray(targetLanguageList) ? targetLanguageList : [targetLanguageList],
        remarks,
        description: remarks,
        purposeOfTranslation,
        jobType,
        deliveryType,
        campaignSource,
        contactRole,
        tags: resolvedDealTags,
        tag: resolvedDealTags[0] || '',
        ownerId,
        closingDate: closingDate || now,
        createdOn: now,
        approvalStatus: requiresApproval ? 'Pending' : 'Approved',
        approvalDiscount: requiresApproval ? 8 : 5,
      };
    }

    const ownerUserName = USERS.find((u) => u.id === ownerId)?.name || 'Sibi Chakaravarthi';
    const convAct = {
      id: `act-${Date.now()}`,
      type: 'Lead Converted',
      desc: deal
        ? `Converted to Contact "${contact.name}" and Deal "${deal.name}" (Owner: ${ownerUserName})`
        : `Converted to Contact "${contact.name}" (Owner: ${ownerUserName})`,
      by: ownerUserName,
      date: `${now} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      status: 'Completed',
    };

    const updatedLead = {
      ...lead,
      status: 'Converted',
      convertedAt: now,
      leadConversionTime: '1 day',
      convertedAccount: account?.name || lead.company || '',
      convertedAccountId: account?.id || '',
      convertedContact: contact.name,
      convertedContactId: contact.id,
      convertedDeal: deal ? deal.name : '',
      convertedDealId: deal ? deal.id : '',
      connectedAccountId: account?.id || lead.connectedAccountId || '',
      connectedContactId: contact.id,
      connectedDealId: deal ? deal.id : lead.connectedDealId || '',
      ownerId,
      touched: true,
      updatedAt: new Date().toISOString(),
      activities: [...(lead.activities || []), convAct],
    };

    const newNotifications = [];
    if (notifyOwner) {
      newNotifications.push({
        id: `n-${Date.now().toString(36)}`,
        message: deal
          ? `Lead "${lead.name}" converted to Contact "${contact.name}" & Deal "${deal.name}" assigned to ${ownerUserName}.`
          : `Lead "${lead.name}" converted to Contact "${contact.name}" assigned to ${ownerUserName}.`,
        module: 'Leads',
        createdAt: new Date().toISOString(),
        read: false,
      });
    }

    // Single atomic transaction updating Lead, Account, Contact, and optional Deal
    setDb((d) => ({
      ...d,
      leads: (d.leads || []).map((l) => (l.id === leadId ? updatedLead : l)),
      accounts: account && !d.accounts.some((a) => a.id === account.id) ? [account, ...d.accounts] : d.accounts,
      contacts: existingContact
        ? d.contacts.map((c) => (c.id === contact.id ? contact : c))
        : [contact, ...d.contacts],
      deals: deal ? [deal, ...d.deals] : d.deals,
      notifications: [...newNotifications, ...d.notifications].slice(0, CAP),
      activity: [
        {
          id: `log-${Date.now().toString(36)}`,
          module: 'Leads',
          recordId: lead.id,
          recordLabel: lead.name,
          message: deal
            ? `Lead converted to Contact (${contact.name}) & Deal (${deal.name})`
            : `Lead converted to Contact (${contact.name})`,
          createdAt: new Date().toISOString(),
        },
        ...d.activity,
      ].slice(0, CAP),
    }));

    toast.success(
      deal
        ? `Lead "${lead.name}" converted to Contact & Deal "${deal.name}"!`
        : `Lead "${lead.name}" converted to Contact "${contact.name}"!`
    );
    return { lead: updatedLead, contact, deal, account };
  }, [toast, checkPermission]);

  // ---- agents ----
  const toggleAgent = useCallback((id, active) => {
    setDb((d) => ({
      ...d,
      agents: (d.agents || []).map((ag) => (ag.id === id ? { ...ag, status: active ? 'Active' : 'Inactive' } : ag)),
    }));
  }, []);

  const runAgent = useCallback((id) => {
    const ag = (dbRef.current.agents || []).find((a) => a.id === id);
    if (!ag) return;
    const now = new Date();
    const formatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    setDb((d) => ({
      ...d,
      agents: (d.agents || []).map((a) => (a.id === id ? { ...a, tasksExecuted: (a.tasksExecuted || 0) + 1, lastRun: formatted } : a)),
      notifications: [{ id: `n-${Date.now().toString(36)}`, message: `Agent "${ag.name}" executed scheduled tasks.`, module: 'Agents', createdAt: now.toISOString(), read: false }, ...d.notifications].slice(0, CAP),
      activity: [{ id: `log-${Date.now().toString(36)}`, module: 'Agents', recordId: ag.id, recordLabel: ag.name, message: `AI Agent "${ag.name}" executed tasks.`, createdAt: now.toISOString() }, ...d.activity].slice(0, CAP),
    }));
    toast.success(`Agent "${ag.name}" executed successfully (+1 task).`);
  }, [toast]);

  // ---- workqueue tasks ----
  const createTask = useCallback((taskData) => {
    const task = {
      id: `wq-${Date.now().toString(36)}`,
      subject: taskData.subject || taskData.title || 'New Task',
      title: taskData.subject || taskData.title || 'New Task',
      dueDate: taskData.dueDate || todayISO(),
      status: taskData.status || 'Not Started',
      priority: taskData.priority || 'Medium',
      relatedTo: taskData.relatedTo || 'General',
      contactName: taskData.contactName || 'Contact',
      ownerId: taskData.ownerId || 'u1',
      ...taskData,
    };
    setDb((d) => ({ ...d, tasks: [task, ...d.tasks] }));
    toast.success(`Task "${task.subject}" created`);
    return task;
  }, [toast]);

  // ---- messages ----
  const sendMessage = useCallback((msgData) => {
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const today = todayISO();
    const initialBubble = {
      id: `th-${Date.now()}`,
      direction: 'outbound',
      sender: msgData.senderName || 'Sibi Chakaravarthi',
      time: `Today, ${nowTime}`,
      text: msgData.body || msgData.snippet || '',
      ...(msgData.attachment ? { attachment: msgData.attachment } : {}),
    };
    const msg = {
      id: `msg-${Date.now().toString(36)}`,
      sender: msgData.sender || 'Sibi Chakaravarthi',
      badge: msgData.badge || 'Lead',
      subject: msgData.subject || 'Follow-up message',
      snippet: msgData.body || msgData.snippet || '',
      body: msgData.body || msgData.snippet || '',
      time: nowTime,
      date: today,
      repliedDate: today,
      status: 'Read',
      type: msgData.type || 'Lead Messages',
      channel: msgData.channel || 'WhatsApp',
      ownerId: msgData.ownerId || 'u1',
      replied: true,
      repliedById: msgData.repliedById || 'u1',
      repliedBy: msgData.repliedBy || 'Sibi Chakaravarthi',
      notificationsSelected: msgData.notificationsSelected !== undefined ? !!msgData.notificationsSelected : true,
      hasAttachment: !!(msgData.hasAttachment || msgData.attachment),
      attachmentFileName: msgData.attachmentFileName || msgData.attachment?.name || '',
      deliveryStatus: msgData.deliveryStatus || 'Saved to CRM Thread',
      thread: msgData.thread || [initialBubble],
      replies: [],
      ...msgData,
    };
    setDb((d) => ({ ...d, messages: [msg, ...(d.messages || [])] }));
    return msg;
  }, []);

  const replyMessage = useCallback((msgId, text, meta = {}) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const shortTime = formatShortNow();
    const today = todayISO();
    const replierId = meta.repliedById || 'u1';
    const replierName = meta.repliedBy || USERS.find((u) => u.id === replierId)?.name || 'Sibi Chakaravarthi';
    setDb((d) => {
      const targetMsg = (d.messages || []).find((m) => m.id === msgId);
      const nextMessages = (d.messages || []).map((m) => {
        if (m.id !== msgId) return m;
        const newReply = {
          id: `rep-${Date.now()}`,
          sender: replierName,
          text,
          time: now,
          deliveryStatus: meta.deliveryStatus || 'Saved to CRM Thread',
          channel: meta.channel || m.channel || 'WhatsApp',
          ...(meta.attachment ? { attachment: meta.attachment } : {}),
        };
        const newThreadBubble = {
          id: `th-${Date.now()}`,
          direction: 'outbound',
          sender: replierName,
          time: `Today, ${now}`,
          text,
          ...(meta.attachment ? { attachment: meta.attachment } : {}),
        };
        const existingThread = Array.isArray(m.thread) && m.thread.length > 0
          ? m.thread
          : [
              {
                id: `${m.id}-init`,
                direction: 'inbound',
                sender: m.sender,
                time: `${m.date || today}, ${m.time || '10:00 AM'}`,
                text: m.body || m.snippet || '',
              },
            ];
        return {
          ...m,
          snippet: text || (meta.attachment ? `Sent attachment: ${meta.attachment.name}` : m.snippet),
          time: now,
          date: today,
          repliedDate: today,
          replied: true,
          repliedById: replierId,
          repliedBy: replierName,
          hasAttachment: !!(m.hasAttachment || meta.attachment),
          attachmentFileName: meta.attachment?.name || m.attachmentFileName || '',
          thread: [...existingThread, newThreadBubble],
          replies: [...(m.replies || []), newReply],
          status: 'Read',
          read: true,
        };
      });

      let nextLeads = d.leads || [];
      if (targetMsg) {
        const senderLower = String(targetMsg.sender || '').toLowerCase();
        nextLeads = nextLeads.map((l) => {
          const isMatch =
            (targetMsg.relatedModule === 'Leads' && targetMsg.relatedRecordId === l.id) ||
            (targetMsg.leadId && l.id === targetMsg.leadId) ||
            (senderLower && String(l.name || '').toLowerCase() === senderLower) ||
            (senderLower && String(l.company || '').toLowerCase() === senderLower);
          if (!isMatch) return l;
          const act = {
            id: `act-${Date.now()}`,
            type: `${targetMsg.channel || 'Message'} Reply`,
            desc: `Replied via ${targetMsg.channel || 'WhatsApp'}: "${text.slice(0, 80)}"`,
            by: replierName,
            date: `${today} ${now}`,
            status: 'Completed',
          };
          return {
            ...l,
            lastActivityTime: shortTime,
            modifiedTime: shortTime,
            touched: true,
            activities: [...(l.activities || []), act],
          };
        });
      }

      return { ...d, messages: nextMessages, leads: nextLeads };
    });
  }, []);

  const toggleStarMessage = useCallback((msgId) => {
    setDb((d) => ({
      ...d,
      messages: (d.messages || []).map((m) => (m.id === msgId ? { ...m, status: m.status === 'Starred' ? 'Read' : 'Starred' } : m)),
    }));
  }, []);

  const archiveMessage = useCallback((msgId) => {
    setDb((d) => ({
      ...d,
      messages: (d.messages || []).map((m) => (m.id === msgId ? { ...m, status: 'Archived' } : m)),
    }));
    toast.info('Message archived');
  }, [toast]);

  const markMessageRead = useCallback((msgId) => {
    setDb((d) => ({
      ...d,
      messages: (d.messages || []).map((m) => (m.id === msgId ? { ...m, status: 'Read' } : m)),
    }));
  }, []);

  // ---- reports ----
  const toggleFavoriteReport = useCallback((repId) => {
    setDb((d) => ({
      ...d,
      reports: (d.reports || []).map((r) => (r.id === repId ? { ...r, favorite: !r.favorite } : r)),
    }));
  }, []);

  const createReport = useCallback((repData) => {
    const rep = {
      id: `rep-${Date.now().toString(36)}`,
      name: repData.name || 'Custom Report',
      module: repData.module || 'Leads',
      type: 'Custom',
      folder: repData.folder || 'Custom Reports',
      lastAccessed: 'Just now',
      createdBy: 'Sibi Chakaravarthi',
      status: 'Active',
      favorite: false,
      ...repData,
    };
    setDb((d) => ({ ...d, reports: [rep, ...(d.reports || [])] }));
    toast.success(`Report "${rep.name}" created`);
    return rep;
  }, [toast]);

  const resetDemo = useCallback(() => {
    clearAll();
    setDb(freshSeed());
    setLeadsUiState(DEFAULT_LEADS_UI);
    toast.success('Demo data restored');
  }, [toast]);

  const reload = useCallback(() => setDb(loadAll()), []);

  const value = useMemo(() => ({
    ...db, db, users: USERS, ...lookups,
    userName: (id) => lookups.usersById[id]?.name || '—',
    accountName: (id) => lookups.accountsById[id]?.name || '—',
    contactName: (id) => lookups.contactsById[id]?.name || '—',
    leadName: (id) => lookups.leadsById[id]?.name || '—',
    agentName: (id) => lookups.agentsById[id]?.name || '—',
    notify,
    leadsUiState, updateLeadsUiState, DEFAULT_LEADS_UI,
    createRecord, updateRecord, deleteRecord, deleteRecords,
    saveWorkflow, deleteWorkflow, toggleWorkflow,
    markNotification, markAllRead, clearNotifications, updateTask, deleteTask, createTask,
    convertLead, toggleAgent, runAgent, sendMessage, replyMessage, toggleStarMessage, archiveMessage, markMessageRead,
    toggleFavoriteReport, createReport, resetDemo, reload,
  }), [db, lookups, notify, leadsUiState, updateLeadsUiState, createRecord, updateRecord, deleteRecord, deleteRecords, saveWorkflow, deleteWorkflow, toggleWorkflow, markNotification, markAllRead, clearNotifications, updateTask, deleteTask, createTask, convertLead, toggleAgent, runAgent, sendMessage, replyMessage, toggleStarMessage, archiveMessage, markMessageRead, toggleFavoriteReport, createReport, resetDemo, reload]);

  return <CRMContext.Provider value={value}>{children}</CRMContext.Provider>;
}
