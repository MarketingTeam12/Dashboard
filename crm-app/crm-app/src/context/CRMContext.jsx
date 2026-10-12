import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { buildSeed, SEED_VERSION, USERS } from '../data/seedData';
import { clearAll, loadKey, saveKey } from '../utils/storage';
import { todayISO } from '../utils/calculations';
import { COLLECTION_MODULE, recordLabel, runWorkflows } from '../workflows/workflowEngine';
import { useToast } from '../components/common/Toast';

const KEYS = ['accounts', 'contacts', 'deals', 'calls', 'invoices', 'oldDeals', 'baselines', 'workflows', 'notifications', 'tasks', 'activity', 'workflowHistory'];
const PREFIX = { accounts: 'acc', contacts: 'con', deals: 'deal', calls: 'call', invoices: 'inv' };
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
  
  if (seed.deals) {
    seed.deals = seed.deals.map(d => 
      d.stage === 'Deal Job Seen' ? { ...d, stage: 'Deal Job Seeking & Agency' } : d
    );
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
    let next = { ...prev, ...patch, touched: true, updatedAt: new Date().toISOString() };
    const res = applyEvent(col, 'updated', next, prev);
    next = { ...next, ...res.patch };
    setDb((d) => ({ ...d, [col]: d[col].map((r) => (r.id === id ? next : r)), ...mergeEffects(d, res, [userLog(col, 'updated', next)]) }));
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
    markNotification, markAllRead, clearNotifications, updateTask, deleteTask, resetDemo, reload,
  }), [db, lookups, createRecord, updateRecord, deleteRecord, deleteRecords, saveWorkflow, deleteWorkflow, toggleWorkflow, markNotification, markAllRead, clearNotifications, updateTask, deleteTask, resetDemo, reload]);

  return <CRMContext.Provider value={value}>{children}</CRMContext.Provider>;
}

export function useCRM() {
  const ctx = useContext(CRMContext);
  if (!ctx) throw new Error('useCRM must be used inside CRMProvider');
  return ctx;
}
