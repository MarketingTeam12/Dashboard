import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { buildSeed, SEED_VERSION, USERS } from '../data/seedData';
import { clearAll, loadKey, saveKey } from '../utils/storage';
import { todayISO } from '../utils/calculations';
import { COLLECTION_MODULE, recordLabel, runWorkflows } from '../workflows/workflowEngine';
import { useToast } from '../components/common/Toast';

const KEYS = ['accounts', 'contacts', 'deals', 'calls', 'invoices', 'forecasts', 'myJobs', 'myJobsLogs', 'contactRelations', 'savedContactViews', 'accountRelations', 'savedAccountViews', 'oldDeals', 'baselines', 'workflows', 'notifications', 'tasks', 'activity', 'workflowHistory'];
const PREFIX = { accounts: 'acc', contacts: 'con', deals: 'deal', calls: 'call', invoices: 'inv', forecasts: 'fc', myJobs: 'job' };
const CAP = 500;

function freshSeed() {
  const seed = buildSeed();
  const today = todayISO();
  seed.contacts = seed.contacts.map((c) => (c.followUp === '__today__' ? { ...c, followUp: today } : c));
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

  const userLog = (col, verb, record) => ({
    id: `log-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, module: COLLECTION_MODULE[col],
    recordId: record.id, recordLabel: recordLabel(record), message: `${COLLECTION_MODULE[col]} record "${recordLabel(record)}" ${verb}.`,
    createdAt: new Date().toISOString(), source: 'user',
  });

  const createRecord = useCallback((col, data) => {
    let record = { ...data, id: newId(col), createdOn: data.createdOn || todayISO() };
    const res = applyEvent(col, 'created', record, null);
    record = { ...record, ...res.patch };
    setDb((d) => ({ ...d, [col]: [record, ...d[col]], ...mergeEffects(d, res, [userLog(col, 'created', record)]) }));
    return record;
  }, [applyEvent]);

  const updateRecord = useCallback((col, id, patch) => {
    const prev = dbRef.current[col].find((r) => r.id === id);
    if (!prev) return null;
    let next = { ...prev, ...patch, touched: true, modifiedTime: todayISO(), updatedAt: new Date().toISOString() };
    const res = applyEvent(col, 'updated', next, prev);
    next = { ...next, ...res.patch };
    setDb((d) => {
      const nextState = { ...d, [col]: d[col].map((r) => (r.id === id ? next : r)), ...mergeEffects(d, res, [userLog(col, 'updated', next)]) };
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
          };
          nextState.accountRelations = { ...rel, projects: [newProj, ...projects] };
        }
      }
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
  const updateTask = useCallback((id, patch) => setDb((d) => ({ ...d, tasks: d.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })), []);
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
    const activityEntry = {
      id: `log-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
      module: 'My Jobs',
      recordId: prevJob.recordId,
      recordLabel: prevJob.recordName,
      message: `${prevJob.category}: "${prevJob.recordName}" — ${actionLabel}.`,
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
    const record = {
      id: `${moduleKey}-${Date.now().toString(36)}`,
      createdDate: now,
      updatedDate: now,
      ...item,
    };
    setDb((d) => {
      const rel = d.contactRelations || {};
      return {
        ...d,
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

  const addAccountRelatedRecord = useCallback((moduleKey, item) => {
    const now = todayISO();
    const record = {
      id: `a${moduleKey}-${Date.now().toString(36)}`,
      createdDate: now,
      updatedDate: now,
      ...item,
    };
    setDb((d) => {
      const rel = d.accountRelations || {};
      return {
        ...d,
        accountRelations: {
          ...rel,
          [moduleKey]: [record, ...(rel[moduleKey] || [])],
        },
      };
    });
    return record;
  }, []);

  /**
   * Convert a Lead into an Account (reusing existing Account if company/website matches to prevent duplicates),
   * a linked Contact, an optional Deal, and a Converted Lead record.
   */
  const convertLeadToAccount = useCallback(({ companyName, contactName, email, phone, leadSource = 'Website', industry = 'Information Technology', city = 'Chennai', annualRevenue = 2500000, ownerId = 'u1', dealName = '', dealAmount = 0 }) => {
    const now = todayISO();
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
    saveWorkflow, deleteWorkflow, toggleWorkflow,
    markNotification, markAllRead, clearNotifications, updateTask, deleteTask,
    processMyJobAction,
    saveContactView, renameContactView, deleteContactView, addContactRelatedRecord,
    saveAccountView, renameAccountView, deleteAccountView, addAccountRelatedRecord, convertLeadToAccount,
    resetDemo, reload,
  }), [db, lookups, createRecord, updateRecord, deleteRecord, deleteRecords, saveWorkflow, deleteWorkflow, toggleWorkflow, markNotification, markAllRead, clearNotifications, updateTask, deleteTask, processMyJobAction, saveContactView, renameContactView, deleteContactView, addContactRelatedRecord, saveAccountView, renameAccountView, deleteAccountView, addAccountRelatedRecord, convertLeadToAccount, resetDemo, reload]);

  return <CRMContext.Provider value={value}>{children}</CRMContext.Provider>;
}

export function useCRM() {
  const ctx = useContext(CRMContext);
  if (!ctx) throw new Error('useCRM must be used inside CRMProvider');
  return ctx;
}
