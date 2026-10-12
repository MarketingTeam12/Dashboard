import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { buildSeed, SEED_VERSION, seedActivity, seedWorkflowHistory, seedWorkflows, USERS } from '../data/seedData';
import { clearAll, loadKey, saveKey } from '../utils/storage';
import { fmtINR, todayISO } from '../utils/calculations';
import { COLLECTION_MODULE, recordLabel, runWorkflows } from '../workflows/workflowEngine';
import { useToast } from '../components/common/Toast';
import { DEFAULT_ACCOUNT_SPLIT_VIEWS, DEFAULT_CONTACT_SPLIT_VIEWS } from '../components/common/SplitView';
import { buildSeedReports, DEFAULT_REPORT_FOLDERS } from '../utils/reportsEngine';

const KEYS = ['accounts', 'contacts', 'deals', 'calls', 'invoices', 'forecasts', 'myJobs', 'myJobsLogs', 'contactRelations', 'savedContactViews', 'savedContactSplitViews', 'accountRelations', 'savedAccountViews', 'savedAccountSplitViews', 'oldDeals', 'baselines', 'workflows', 'notifications', 'tasks', 'activity', 'workflowHistory', 'reports', 'reportFolders'];
const PREFIX = { accounts: 'acc', contacts: 'con', deals: 'deal', calls: 'call', invoices: 'inv', forecasts: 'fc', myJobs: 'job', reports: 'rep' };
const CAP = 500;

const FIELD_LABELS = {
  name: 'Name',
  clientName: 'Client Name',
  designation: 'Designation',
  department: 'Department',
  email: 'Email',
  secondaryEmail: 'Secondary Email',
  phone: 'Phone',
  mobile: 'Mobile',
  lifecycle: 'Lifecycle Stage',
  leadSource: 'Lead Source',
  ownerId: 'Owner',
  accountId: 'Account',
  contactId: 'Contact',
  type: 'Type',
  industry: 'Industry',
  location: 'Location',
  billingCity: 'Billing City',
  shippingCity: 'Shipping City',
  mailingCity: 'Mailing City',
  annualRevenue: 'Annual Revenue',
  employees: 'Employees',
  ownership: 'Ownership',
  rating: 'Rating',
  status: 'Status',
  stage: 'Stage',
  amount: 'Amount',
  probability: 'Probability (%)',
  closingDate: 'Closing Date',
  followUp: 'Follow-Up Date',
  emailSentiment: 'Email Sentiment',
  website: 'Website',
  gstin: 'GSTIN',
  description: 'Description',
  tag: 'Tags',
  subject: 'Subject',
  duration: 'Duration (sec)',
  paidAmount: 'Paid Amount',
  dueDate: 'Due Date',
};

const IGNORED_DIFF_KEYS = new Set([
  'id', 'touched', 'modifiedTime', 'updatedAt', 'modifiedBy', 'createdBy',
  'createdOn', 'createdTime', 'lastActivityTime', 'hasRecordAction', 'tagInput',
  'color', 'billingAddress', 'shippingAddress', 'mailingAddress', 'otherAddress',
  'tags', 'contactName', 'accountName', 'contactOwner', 'emailId', 'gstNumber',
  'payments',
]);

function formatDiffVal(key, val) {
  if (val === undefined || val === null || val === '') return '—';
  if (['annualRevenue', 'amount', 'paidAmount'].includes(key) && !isNaN(Number(val))) {
    return fmtINR(Number(val));
  }
  if (key === 'ownerId') {
    return USERS.find((u) => u.id === val)?.name || String(val);
  }
  if (Array.isArray(val)) return val.join(', ') || '—';
  return String(val);
}

function computeFieldChanges(prev, next) {
  if (!prev || !next) return [];
  const changes = [];
  const allKeys = new Set([...Object.keys(prev), ...Object.keys(next)]);
  allKeys.forEach((key) => {
    if (IGNORED_DIFF_KEYS.has(key)) return;
    const oldVal = prev[key];
    const newVal = next[key];
    if (typeof oldVal === 'object' || typeof newVal === 'object') return;
    const sOld = oldVal == null ? '' : String(oldVal).trim();
    const sNew = newVal == null ? '' : String(newVal).trim();
    if (sOld !== sNew) {
      changes.push({
        field: key,
        label: FIELD_LABELS[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()),
        from: formatDiffVal(key, oldVal),
        to: formatDiffVal(key, newVal),
      });
    }
  });
  return changes;
}

function freshSeed() {
  const seed = buildSeed();
  const today = todayISO();
  seed.contacts = seed.contacts.map((c) => (c.followUp === '__today__' ? { ...c, followUp: today } : c));
  seed.savedContactSplitViews = DEFAULT_CONTACT_SPLIT_VIEWS;
  seed.savedAccountSplitViews = DEFAULT_ACCOUNT_SPLIT_VIEWS;
  seed.reports = buildSeedReports();
  seed.reportFolders = DEFAULT_REPORT_FOLDERS;
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
  if (!Array.isArray(seed.savedContactSplitViews) || seed.savedContactSplitViews.length === 0) {
    seed.savedContactSplitViews = DEFAULT_CONTACT_SPLIT_VIEWS;
  }
  if (!Array.isArray(seed.savedAccountSplitViews) || seed.savedAccountSplitViews.length === 0) {
    seed.savedAccountSplitViews = DEFAULT_ACCOUNT_SPLIT_VIEWS;
  }
  if (!Array.isArray(seed.reports) || seed.reports.length === 0) {
    seed.reports = buildSeedReports();
  }
  if (!Array.isArray(seed.reportFolders) || seed.reportFolders.length === 0) {
    seed.reportFolders = DEFAULT_REPORT_FOLDERS;
  }
  // Ensure default Account & Contact workflows and seeded timeline entries exist even if localStorage was initialized earlier
  const defaultWfs = seedWorkflows();
  const existingWfIds = new Set((seed.workflows || []).map((w) => w.id));
  const missingWfs = defaultWfs.filter((w) => !existingWfIds.has(w.id));
  if (missingWfs.length > 0) {
    seed.workflows = [...(seed.workflows || []), ...missingWfs];
  }
  const defaultHist = seedWorkflowHistory();
  const existingHistIds = new Set((seed.workflowHistory || []).map((h) => h.id));
  const missingHist = defaultHist.filter((h) => !existingHistIds.has(h.id));
  if (missingHist.length > 0) {
    seed.workflowHistory = [...(seed.workflowHistory || []), ...missingHist];
  }
  const defaultAct = seedActivity();
  const existingActIds = new Set((seed.activity || []).map((a) => a.id));
  const missingAct = defaultAct.filter((a) => !existingActIds.has(a.id));
  if (missingAct.length > 0) {
    seed.activity = [...(seed.activity || []), ...missingAct];
  }
  return seed;
}

const CRMContext = createContext(null);
const newId = (col) => `${PREFIX[col]}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

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
    usersById: Object.fromEntries(USERS.map((u) => [u.id, u])),
  }), [db.accounts, db.contacts]);

  /** Run workflows + merge side effects into state */
  const applyEvent = useCallback((col, type, record, prev) => {
    const module = COLLECTION_MODULE[col];
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
      notifications: [...res.notifications, ...d.notifications].slice(0, CAP),
      tasks: [...res.tasks, ...d.tasks].slice(0, CAP),
      activity: [...res.activity, ...extraActivity, ...d.activity].slice(0, CAP),
      workflowHistory: [...res.history, ...d.workflowHistory].slice(0, CAP),
      workflows: firedIds.size ? d.workflows.map((w) => (firedIds.has(w.id) ? { ...w, runs: (w.runs || 0) + 1, lastRun: now } : w)) : d.workflows,
    };
  };

  const userLog = (col, verb, record, prev = null) => {
    const module = COLLECTION_MODULE[col];
    const label = recordLabel(record);
    const accountId = col === 'accounts' ? record.id : (record.accountId || '');
    const contactId = col === 'contacts' ? record.id : (record.contactId || '');
    const userId = record.modifiedBy || record.createdBy || record.ownerId || 'u1';
    const changes = verb === 'updated' ? computeFieldChanges(prev, record) : [];
    const changeSummary = changes.length > 0
      ? `Updated ${changes.slice(0, 3).map((c) => `${c.label}: ${c.from} → ${c.to}`).join('; ')}${changes.length > 3 ? ` (+${changes.length - 3} more)` : ''}.`
      : `${module} record "${label}" ${verb}.`;
    return {
      id: `log-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
      module,
      eventType: verb,
      recordId: record.id,
      recordLabel: label,
      accountId,
      contactId,
      userId,
      title: verb === 'created'
        ? `${module} Record Created — ${label}`
        : verb === 'updated'
          ? `${module} Record Updated — ${label}`
          : `${module} Record Deleted — ${label}`,
      message: changeSummary,
      changes,
      createdAt: new Date().toISOString(),
      source: 'user',
    };
  };

  const createRecord = useCallback((col, data) => {
    const nowIso = new Date().toISOString();
    let record = { ...data, id: newId(col), createdOn: data.createdOn || todayISO(), createdAt: data.createdAt || nowIso };
    const res = applyEvent(col, 'created', record, null);
    record = { ...record, ...res.patch };
    setDb((d) => {
      const nextState = { ...d, [col]: [record, ...d[col]], ...mergeEffects(d, res, [userLog(col, 'created', record)]) };
      dbRef.current = nextState;
      return nextState;
    });
    return record;
  }, [applyEvent]);

  const updateRecord = useCallback((col, id, patch) => {
    const prev = dbRef.current[col].find((r) => r.id === id);
    if (!prev) return null;
    let next = { ...prev, ...patch, touched: true, modifiedTime: todayISO(), updatedAt: new Date().toISOString() };
    const res = applyEvent(col, 'updated', next, prev);
    next = { ...next, ...res.patch };
    setDb((d) => {
      const nextState = { ...d, [col]: d[col].map((r) => (r.id === id ? next : r)), ...mergeEffects(d, res, [userLog(col, 'updated', next, prev)]) };
      // When a Deal becomes Closed Won, ensure the resulting Project retains the Account relationship
      if (col === 'deals' && next.stage === 'Closed Won' && next.accountId) {
        const rel = d.accountRelations || {};
        const projects = rel.projects || [];
        if (!projects.some((p) => p.dealId === next.id)) {
          const newProj = {
            id: `aproj-${Date.now().toString(36)}`,
            accountId: next.accountId,
            dealId: next.id,
            name: `${next.name} — Implementation Project`,
            status: 'Active',
            budget: next.amount,
            ownerId: next.ownerId,
            createdDate: todayISO(),
            updatedDate: todayISO(),
            createdAt: new Date().toISOString(),
          };
          nextState.accountRelations = { ...rel, projects: [newProj, ...projects] };
        }
      }
      dbRef.current = nextState;
      return nextState;
    });
    return next;
  }, [applyEvent]);

  const deleteRecords = useCallback((col, ids) => {
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
        next.accounts = next.accounts.map((a) => (set.has(a.parentAccountId) ? { ...a, parentAccountId: '' } : a));
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
  }, [applyEvent]);

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
    setDb((d) => {
      const target = (d.tasks || []).find((t) => t.id === id);
      const nextTasks = (d.tasks || []).map((t) => (t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t));
      if (!target) return { ...d, tasks: nextTasks };
      const updated = { ...target, ...patch };
      const statusText = updated.completed || updated.status === 'Completed' ? 'Completed' : (updated.status || 'Updated');
      const logEntry = {
        id: `log-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
        module: 'Tasks',
        eventType: 'task_updated',
        recordId: updated.id,
        recordLabel: updated.title || 'Task',
        accountId: updated.accountId || (updated.module === 'Accounts' ? updated.recordId : ''),
        contactId: updated.contactId || (updated.module === 'Contacts' ? updated.recordId : ''),
        userId: updated.ownerId || 'u1',
        title: `Task ${statusText} — ${updated.title || 'Task'}`,
        message: `Task "${updated.title || 'Task'}" marked as ${statusText}.`,
        createdAt: new Date().toISOString(),
        source: 'user',
      };
      return { ...d, tasks: nextTasks, activity: [logEntry, ...(d.activity || [])].slice(0, CAP) };
    });
  }, []);
  const deleteTask = useCallback((id) => setDb((d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== id) })), []);

  // ---- My Jobs atomic action ----
  const processMyJobAction = useCallback((jobId, { status, decision, actionLabel, comment, userId, recordPatch, nextState, transitionValues }) => {
    const prevJob = dbRef.current.myJobs?.find((j) => j.id === jobId);
    if (!prevJob) return null;
    const now = new Date().toISOString();
    const updatedJob = {
      ...prevJob,
      status,
      decision,
      reviewedBy: userId || 'u1',
      reviewedAt: now,
      reviewComment: comment || '',
      ...(nextState ? { currentState: nextState } : {}),
      ...(transitionValues ? { appliedTransitionValues: transitionValues } : {}),
    };
    const logEntry = {
      id: `jlog-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
      jobId: prevJob.id,
      category: prevJob.category,
      recordName: prevJob.recordName,
      recordId: prevJob.recordId,
      module: prevJob.module,
      processName: prevJob.processName,
      action: actionLabel,
      userId: userId || 'u1',
      timestamp: now,
      comment: comment || '',
    };
    const targetRecord = prevJob.collection && Array.isArray(dbRef.current[prevJob.collection])
      ? dbRef.current[prevJob.collection].find((r) => r.id === prevJob.recordId)
      : null;
    const resolvedAccountId = prevJob.collection === 'accounts'
      ? prevJob.recordId
      : (targetRecord?.accountId || '');
    const resolvedContactId = prevJob.collection === 'contacts'
      ? prevJob.recordId
      : (targetRecord?.contactId || '');

    const activityEntry = {
      id: `log-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
      module: 'My Jobs',
      eventType: 'my_job_action',
      recordId: prevJob.recordId,
      recordLabel: prevJob.recordName,
      accountId: resolvedAccountId,
      contactId: resolvedContactId,
      userId: userId || 'u1',
      title: `${prevJob.category}: ${actionLabel}`,
      message: `${prevJob.category}: "${prevJob.recordName}" — ${actionLabel}${comment ? ` (${comment})` : ''}.`,
      createdAt: now,
      source: 'user',
    };

    setDb((d) => {
      const next = {
        ...d,
        myJobs: (d.myJobs || []).map((j) => (j.id === jobId ? updatedJob : j)),
        myJobsLogs: [logEntry, ...(d.myJobsLogs || [])].slice(0, CAP),
        activity: [activityEntry, ...(d.activity || [])].slice(0, CAP),
      };
      if (recordPatch && Object.keys(recordPatch).length > 0 && prevJob.collection && Array.isArray(d[prevJob.collection])) {
        next[prevJob.collection] = d[prevJob.collection].map((r) =>
          r.id === prevJob.recordId ? { ...r, ...recordPatch, touched: true, updatedAt: now } : r
        );
      }
      return next;
    });
    return { job: updatedJob, log: logEntry };
  }, []);

  // ---- Saved Contact Views & Related Records ----
  const saveContactView = useCallback((viewData) => {
    const id = viewData.id || `cview-${Date.now().toString(36)}`;
    const record = { ...viewData, id, updatedAt: new Date().toISOString() };
    setDb((d) => {
      const existing = d.savedContactViews || [];
      const exists = existing.some((v) => v.id === id);
      return {
        ...d,
        savedContactViews: exists ? existing.map((v) => (v.id === id ? record : v)) : [...existing, record],
      };
    });
    return record;
  }, []);

  const renameContactView = useCallback((id, newName) => {
    setDb((d) => ({
      ...d,
      savedContactViews: (d.savedContactViews || []).map((v) => (v.id === id ? { ...v, name: newName } : v)),
    }));
  }, []);

  const deleteContactView = useCallback((id) => {
    setDb((d) => ({
      ...d,
      savedContactViews: (d.savedContactViews || []).filter((v) => v.id !== id),
    }));
  }, []);

  const addContactRelatedRecord = useCallback((moduleKey, item) => {
    const now = todayISO();
    const nowIso = new Date().toISOString();
    const parentContact = dbRef.current.contacts?.find((c) => c.id === item?.contactId);
    const record = {
      id: `${moduleKey}-${Date.now().toString(36)}`,
      createdDate: now,
      updatedDate: now,
      createdAt: nowIso,
      accountId: item?.accountId || parentContact?.accountId || '',
      ...item,
    };
    setDb((d) => {
      const rel = d.contactRelations || {};
      return {
        ...d,
        contacts: item?.contactId
          ? d.contacts.map((c) => (c.id === item.contactId ? { ...c, touched: true, lastActivityTime: now } : c))
          : d.contacts,
        contactRelations: {
          ...rel,
          [moduleKey]: [record, ...(rel[moduleKey] || [])],
        },
      };
    });
    return record;
  }, []);

  // ---- Saved Account Views, Account Related Records & Lead Conversion ----
  const saveAccountView = useCallback((viewData) => {
    const id = viewData.id || `aview-${Date.now().toString(36)}`;
    const record = { ...viewData, id, updatedAt: new Date().toISOString() };
    setDb((d) => {
      const existing = d.savedAccountViews || [];
      const exists = existing.some((v) => v.id === id);
      return {
        ...d,
        savedAccountViews: exists ? existing.map((v) => (v.id === id ? record : v)) : [...existing, record],
      };
    });
    return record;
  }, []);

  const renameAccountView = useCallback((id, newName) => {
    setDb((d) => ({
      ...d,
      savedAccountViews: (d.savedAccountViews || []).map((v) => (v.id === id ? { ...v, name: newName } : v)),
    }));
  }, []);

  const deleteAccountView = useCallback((id) => {
    setDb((d) => ({
      ...d,
      savedAccountViews: (d.savedAccountViews || []).filter((v) => v.id !== id),
    }));
  }, []);

  // ---- Saved Contact & Account Split Views ----
  const saveContactSplitView = useCallback((viewData) => {
    const id = viewData.id || `csplit-${Date.now().toString(36)}`;
    const record = { ...viewData, id, updatedAt: new Date().toISOString() };
    setDb((d) => {
      const existing = d.savedContactSplitViews || DEFAULT_CONTACT_SPLIT_VIEWS;
      const exists = existing.some((v) => v.id === id);
      const next = {
        ...d,
        savedContactSplitViews: exists
          ? existing.map((v) => (v.id === id ? record : v))
          : [...existing, record],
      };
      dbRef.current = next;
      return next;
    });
    return record;
  }, []);

  const deleteContactSplitView = useCallback((id) => {
    setDb((d) => {
      const next = {
        ...d,
        savedContactSplitViews: (d.savedContactSplitViews || DEFAULT_CONTACT_SPLIT_VIEWS).filter((v) => v.id !== id),
      };
      dbRef.current = next;
      return next;
    });
  }, []);

  const saveAccountSplitView = useCallback((viewData) => {
    const id = viewData.id || `asplit-${Date.now().toString(36)}`;
    const record = { ...viewData, id, updatedAt: new Date().toISOString() };
    setDb((d) => {
      const existing = d.savedAccountSplitViews || DEFAULT_ACCOUNT_SPLIT_VIEWS;
      const exists = existing.some((v) => v.id === id);
      const next = {
        ...d,
        savedAccountSplitViews: exists
          ? existing.map((v) => (v.id === id ? record : v))
          : [...existing, record],
      };
      dbRef.current = next;
      return next;
    });
    return record;
  }, []);

  const deleteAccountSplitView = useCallback((id) => {
    setDb((d) => {
      const next = {
        ...d,
        savedAccountSplitViews: (d.savedAccountSplitViews || DEFAULT_ACCOUNT_SPLIT_VIEWS).filter((v) => v.id !== id),
      };
      dbRef.current = next;
      return next;
    });
  }, []);

  const addAccountRelatedRecord = useCallback((moduleKey, item) => {
    const now = todayISO();
    const nowIso = new Date().toISOString();
    const record = {
      id: `a${moduleKey}-${Date.now().toString(36)}`,
      createdDate: now,
      updatedDate: now,
      createdAt: nowIso,
      ...item,
    };
    setDb((d) => {
      const rel = d.accountRelations || {};
      return {
        ...d,
        accounts: item?.accountId
          ? d.accounts.map((a) => (a.id === item.accountId ? { ...a, touched: true, lastActivityTime: now } : a))
          : d.accounts,
        accountRelations: {
          ...rel,
          [moduleKey]: [record, ...(rel[moduleKey] || [])],
        },
      };
    });
    return record;
  }, []);

  /**
   * Manually evaluate and run active workflows for a specific Account or Contact record
   */
  const runRecordWorkflowsNow = useCallback((col, id, eventType = 'updated') => {
    const record = dbRef.current[col]?.find((r) => r.id === id);
    if (!record) return null;
    const res = applyEvent(col, eventType, record, record);
    const next = { ...record, ...res.patch, touched: true, lastActivityTime: todayISO() };
    setDb((d) => ({
      ...d,
      [col]: d[col].map((r) => (r.id === id ? next : r)),
      ...mergeEffects(d, res, []),
    }));
    return res;
  }, [applyEvent]);

  /**
   * Convert a Lead into an Account (reusing existing Account if company/website matches to prevent duplicates),
   * a linked Contact, an optional Deal, and a Converted Lead record.
   */
  const convertLeadToAccount = useCallback(({ companyName, contactName, email, phone, leadSource = 'Website', industry = 'Information Technology', city = 'Chennai', annualRevenue = 2500000, ownerId = 'u1', dealName = '', dealAmount = 0 }) => {
    const now = todayISO();
    const nowIso = new Date().toISOString();
    const cleanCompany = String(companyName || '').trim();
    const existingAcc = dbRef.current.accounts.find(
      (a) => a.name.trim().toLowerCase() === cleanCompany.toLowerCase()
    );
    const account = existingAcc || {
      id: newId('accounts'),
      name: cleanCompany,
      accountNumber: `ACC-${1001 + dbRef.current.accounts.length}`,
      accountSite: `${city} Office`,
      type: 'Customer',
      industry,
      location: city,
      billingCity: city,
      billingState: 'Tamil Nadu',
      billingCountry: 'India',
      shippingCity: city,
      shippingCountry: 'India',
      annualRevenue: Number(annualRevenue) || 2500000,
      employees: 120,
      ownership: 'Private',
      rating: 'Hot',
      status: 'Active',
      ownerId,
      createdBy: ownerId,
      modifiedBy: ownerId,
      createdOn: now,
      createdTime: now,
      createdAt: nowIso,
      modifiedTime: now,
      lastActivityTime: now,
      website: `www.${cleanCompany.toLowerCase().replace(/[^a-z0-9]/g, '')}.in`,
      phone: phone || '+91 44 4200 1000',
      tags: ['Converted Lead'],
      touched: true,
      hasRecordAction: true,
      color: '#1F6FEB',
    };

    const parts = String(contactName || 'Primary Contact').trim().split(/\s+/);
    const contact = {
      id: newId('contacts'),
      name: contactName || 'Primary Contact',
      firstName: parts[0] || 'Primary',
      lastName: parts.slice(1).join(' ') || 'Contact',
      designation: 'Decision Maker',
      accountId: account.id,
      email: email || `contact@${cleanCompany.toLowerCase().replace(/[^a-z0-9]/g, '')}.in`,
      phone: phone || account.phone,
      lifecycle: 'Qualified',
      leadSource,
      ownerId,
      mailingCity: city,
      mailingCountry: 'India',
      createdOn: now,
      createdTime: now,
      createdAt: nowIso,
      lastContacted: now,
      touched: true,
    };

    const convertedLeadEntry = {
      id: `alead-${Date.now().toString(36)}`,
      accountId: account.id,
      contactId: contact.id,
      leadName: `${contact.name} (${account.name})`,
      leadSource,
      status: 'Converted',
      convertedDate: now,
      ownerId,
      createdDate: now,
      updatedDate: now,
      createdAt: nowIso,
    };

    let deal = null;
    if (dealName) {
      deal = {
        id: newId('deals'),
        name: dealName,
        accountId: account.id,
        contactId: contact.id,
        stage: 'Qualification',
        amount: Number(dealAmount) || 500000,
        closingDate: now,
        probability: 25,
        ownerId,
        createdOn: now,
        createdAt: nowIso,
        source: leadSource,
        department: 'Enterprise Sales',
        forecastCategory: 'Pipeline',
      };
    }

    setDb((d) => {
      const rel = d.accountRelations || {};
      return {
        ...d,
        accounts: existingAcc ? d.accounts : [account, ...d.accounts],
        contacts: [contact, ...d.contacts],
        deals: deal ? [deal, ...d.deals] : d.deals,
        accountRelations: {
          ...rel,
          convertedLeads: [convertedLeadEntry, ...(rel.convertedLeads || [])],
        },
      };
    });

    return { account, reusedExistingAccount: Boolean(existingAcc), contact, deal, convertedLeadEntry };
  }, []);

  const saveReport = useCallback((reportData) => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const todayFormatted = `${dd}/${mm}/${yyyy}`;

    const id = reportData.id || newId('reports');
    const record = {
      id,
      name: String(reportData.name || 'Untitled Report').trim(),
      description: String(reportData.description || '-').trim() || '-',
      folder: String(reportData.folder || 'Overall').trim() || 'Overall',
      lastAccessedDate: reportData.lastAccessedDate || todayFormatted,
      createdBy: reportData.createdBy || 'Arun Kumar',
      primaryModule: reportData.primaryModule || 'Deals',
      relatedModules: Array.isArray(reportData.relatedModules) ? reportData.relatedModules : [],
      reportType: reportData.reportType || 'tabular',
      columns: Array.isArray(reportData.columns) ? reportData.columns : [],
      groupBy: reportData.groupBy || '',
      secondaryGroupBy: reportData.secondaryGroupBy || '',
      groupSort: reportData.groupSort || 'asc',
      summaries: Array.isArray(reportData.summaries) ? reportData.summaries : [],
      filterJoin: reportData.filterJoin || 'AND',
      filters: Array.isArray(reportData.filters) ? reportData.filters : [],
      visibility: reportData.visibility || 'Everyone',
      sharedUserIds: Array.isArray(reportData.sharedUserIds) ? reportData.sharedUserIds : [],
      favorite: Boolean(reportData.favorite),
      createdAt: reportData.createdAt || now.toISOString(),
      updatedAt: now.toISOString(),
    };

    setDb((d) => {
      const existing = d.reports || [];
      const exists = existing.some((r) => r.id === id);
      const next = {
        ...d,
        reports: exists ? existing.map((r) => (r.id === id ? record : r)) : [record, ...existing],
      };
      dbRef.current = next;
      return next;
    });
    return record;
  }, []);

  const deleteReports = useCallback((ids) => {
    const idSet = new Set(Array.isArray(ids) ? ids : [ids]);
    setDb((d) => {
      const next = {
        ...d,
        reports: (d.reports || []).filter((r) => !idSet.has(r.id)),
      };
      dbRef.current = next;
      return next;
    });
  }, []);

  const duplicateReport = useCallback((id) => {
    const orig = (dbRef.current.reports || []).find((r) => r.id === id);
    if (!orig) return null;
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const copy = {
      ...orig,
      id: newId('reports'),
      name: `${orig.name} (Copy)`,
      lastAccessedDate: `${dd}/${mm}/${yyyy}`,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    setDb((d) => {
      const next = {
        ...d,
        reports: [copy, ...(d.reports || [])],
      };
      dbRef.current = next;
      return next;
    });
    return copy;
  }, []);

  const toggleFavoriteReport = useCallback((id) => {
    setDb((d) => {
      const next = {
        ...d,
        reports: (d.reports || []).map((r) => (r.id === id ? { ...r, favorite: !r.favorite } : r)),
      };
      dbRef.current = next;
      return next;
    });
  }, []);

  const markReportAccessed = useCallback((id) => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const todayFormatted = `${dd}/${mm}/${yyyy}`;
    setDb((d) => {
      const next = {
        ...d,
        reports: (d.reports || []).map((r) =>
          r.id === id ? { ...r, lastAccessedDate: todayFormatted } : r
        ),
      };
      dbRef.current = next;
      return next;
    });
  }, []);

  const saveReportFolder = useCallback((folderData) => {
    const cleanName = String(folderData.name || '').trim();
    if (!cleanName) return null;
    const id = folderData.id || `fld-${Date.now().toString(36)}`;
    const record = {
      id,
      name: cleanName,
      description: String(folderData.description || '').trim(),
      system: Boolean(folderData.system),
    };
    setDb((d) => {
      const existing = d.reportFolders || DEFAULT_REPORT_FOLDERS;
      const exists = existing.some((f) => f.id === id || f.name.toLowerCase() === cleanName.toLowerCase());
      const next = {
        ...d,
        reportFolders: exists
          ? existing.map((f) => (f.id === id || f.name.toLowerCase() === cleanName.toLowerCase() ? { ...f, ...record } : f))
          : [...existing, record],
      };
      dbRef.current = next;
      return next;
    });
    return record;
  }, []);

  const deleteReportFolder = useCallback((folderName) => {
    setDb((d) => {
      const next = {
        ...d,
        reportFolders: (d.reportFolders || DEFAULT_REPORT_FOLDERS).filter(
          (f) => f.name !== folderName || f.system
        ),
        reports: (d.reports || []).map((r) =>
          r.folder === folderName ? { ...r, folder: 'Overall' } : r
        ),
      };
      dbRef.current = next;
      return next;
    });
  }, []);

  const resetDemo = useCallback(() => {
    clearAll();
    setDb(freshSeed());
    toast.success('Demo data restored');
  }, [toast]);

  const reload = useCallback(() => setDb(loadAll()), []);

  const value = useMemo(() => ({
    ...db, db, users: USERS, ...lookups,
    userName: (id) => lookups.usersById[id]?.name || '—',
    accountName: (id) => lookups.accountsById[id]?.name || '—',
    contactName: (id) => lookups.contactsById[id]?.name || '—',
    createRecord, updateRecord, deleteRecord, deleteRecords,
    saveWorkflow, deleteWorkflow, toggleWorkflow, runRecordWorkflowsNow,
    markNotification, markAllRead, clearNotifications, updateTask, deleteTask,
    processMyJobAction,
    saveContactView, renameContactView, deleteContactView, addContactRelatedRecord,
    saveContactSplitView, deleteContactSplitView,
    saveAccountView, renameAccountView, deleteAccountView, addAccountRelatedRecord, convertLeadToAccount,
    saveAccountSplitView, deleteAccountSplitView,
    saveReport, deleteReports, duplicateReport, toggleFavoriteReport, markReportAccessed,
    saveReportFolder, deleteReportFolder,
    resetDemo, reload,
  }), [db, lookups, createRecord, updateRecord, deleteRecord, deleteRecords, saveWorkflow, deleteWorkflow, toggleWorkflow, runRecordWorkflowsNow, markNotification, markAllRead, clearNotifications, updateTask, deleteTask, processMyJobAction, saveContactView, renameContactView, deleteContactView, addContactRelatedRecord, saveContactSplitView, deleteContactSplitView, saveAccountView, renameAccountView, deleteAccountView, addAccountRelatedRecord, convertLeadToAccount, saveAccountSplitView, deleteAccountSplitView, saveReport, deleteReports, duplicateReport, toggleFavoriteReport, markReportAccessed, saveReportFolder, deleteReportFolder, resetDemo, reload]);

  return <CRMContext.Provider value={value}>{children}</CRMContext.Provider>;
}

export function useCRM() {
  const ctx = useContext(CRMContext);
  if (!ctx) throw new Error('useCRM must be used inside CRMProvider');
  return ctx;
}
