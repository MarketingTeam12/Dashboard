import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { buildSeed, SEED_VERSION, USERS } from '../data/seedData';
import { clearAll, loadKey, saveKey } from '../utils/storage';
import { todayISO } from '../utils/calculations';
import { COLLECTION_MODULE, recordLabel, runWorkflows } from '../workflows/workflowEngine';
import { useToast } from '../components/common/Toast';

const KEYS = [
  'accounts',
  'contacts',
  'deals',
  'calls',
  'invoices',
  'oldDeals',
  'baselines',
  'workflows',
  'notifications',
  'tasks',
  'activity',
  'workflowHistory',
  'leads',
  'agents',
  'reports',
  'messages',
  'forecasts',
  'myJobs',
  'myJobsLogs',
  'contactRelations',
  'savedContactViews',
  'accountRelations',
  'savedAccountViews',
];

const PREFIX = {
  accounts: 'acc',
  contacts: 'con',
  deals: 'deal',
  calls: 'call',
  invoices: 'inv',
  leads: 'lead',
  agents: 'ag',
  reports: 'rep',
  messages: 'msg',
  forecasts: 'fc',
  myJobs: 'job',
};

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
    KEYS.forEach((k) => {
      if (seed[k] === undefined) seed[k] = fresh[k];
    });
  }
  return seed;
}

const CRMContext = createContext(null);
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

  const lookups = useMemo(
    () => ({
      accountsById: Object.fromEntries((db.accounts || []).map((a) => [a.id, a])),
      contactsById: Object.fromEntries((db.contacts || []).map((c) => [c.id, c])),
      leadsById: Object.fromEntries((db.leads || []).map((l) => [l.id, l])),
      agentsById: Object.fromEntries((db.agents || []).map((ag) => [ag.id, ag])),
      usersById: Object.fromEntries(USERS.map((u) => [u.id, u])),
    }),
    [db.accounts, db.contacts, db.leads, db.agents]
  );

  /** Run workflows + merge side effects into state */
  const applyEvent = useCallback(
    (col, type, record, prev) => {
      const module = COLLECTION_MODULE[col];
      if (!module) return { patch: {}, notifications: [], tasks: [], activity: [], history: [], fired: [], messages: [] };
      const res = runWorkflows(dbRef.current.workflows, { module, type, record, prev }, { users: USERS });
      if (res.fired.length) {
        const executed = res.fired.filter((f) => f.executed);
        if (executed.length) toast.info(`Workflow ran: ${executed.map((f) => f.name).join(', ')}`);
      }
      return res;
    },
    [toast]
  );

  const mergeEffects = (d, res, extraActivity = []) => {
    const now = new Date().toISOString();
    const firedIds = new Set(res.fired.map((f) => f.id));
    return {
      notifications: [...(res.notifications || []), ...(d.notifications || [])].slice(0, CAP),
      tasks: [...(res.tasks || []), ...(d.tasks || [])].slice(0, CAP),
      messages: res.messages?.length ? [...res.messages, ...(d.messages || [])].slice(0, CAP) : d.messages || [],
      activity: [...(res.activity || []), ...extraActivity, ...(d.activity || [])].slice(0, CAP),
      workflowHistory: [...(res.history || []), ...(d.workflowHistory || [])].slice(0, CAP),
      workflows: firedIds.size
        ? (d.workflows || []).map((w) => (firedIds.has(w.id) ? { ...w, runs: (w.runs || 0) + 1, lastRun: now } : w))
        : d.workflows || [],
    };
  };

  const userLog = (col, verb, record) => ({
    id: `log-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    module: COLLECTION_MODULE[col],
    recordId: record.id,
    recordLabel: recordLabel(record),
    message: `${COLLECTION_MODULE[col]} record "${recordLabel(record)}" ${verb}.`,
    createdAt: new Date().toISOString(),
    source: 'user',
  });

  const createRecord = useCallback(
    (col, data) => {
      let record = { ...data, id: newId(col), createdOn: data.createdOn || todayISO() };
      const res = applyEvent(col, 'created', record, null);
      record = { ...record, ...res.patch };
      setDb((d) => ({
        ...d,
        [col]: [record, ...(d[col] || [])],
        ...mergeEffects(d, res, [userLog(col, 'created', record)]),
      }));
      return record;
    },
    [applyEvent]
  );

  const updateRecord = useCallback(
    (col, id, patch) => {
      const prev = (dbRef.current[col] || []).find((r) => r.id === id);
      if (!prev) return null;
      let next = { ...prev, ...patch, touched: true, modifiedTime: todayISO(), updatedAt: new Date().toISOString() };
      const res = applyEvent(col, 'updated', next, prev);
      next = { ...next, ...res.patch };
      setDb((d) => {
        const nextState = {
          ...d,
          [col]: (d[col] || []).map((r) => (r.id === id ? next : r)),
          ...mergeEffects(d, res, [userLog(col, 'updated', next)]),
        };
        if (col === 'deals' && (next.stage === 'Closed Won' || next.stage === 'Deal Closed (Won)') && next.accountId) {
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
    },
    [applyEvent]
  );

  const deleteRecords = useCallback(
    (col, ids) => {
      const set = new Set(ids);
      const removed = (dbRef.current[col] || []).filter((r) => set.has(r.id));
      const combined = { patch: {}, notifications: [], tasks: [], activity: [], history: [], fired: [] };
      removed.forEach((r) => {
        const res = applyEvent(col, 'deleted', r, r);
        ['notifications', 'tasks', 'activity', 'history', 'fired'].forEach((k) => combined[k].push(...(res[k] || [])));
      });
      setDb((d) => {
        const next = { ...d, [col]: (d[col] || []).filter((r) => !set.has(r.id)) };
        if (col === 'accounts') {
          next.accounts = (next.accounts || []).map((a) => (set.has(a.parentAccountId) ? { ...a, parentAccountId: '' } : a));
          ['contacts', 'deals', 'calls', 'invoices'].forEach((c) => {
            next[c] = (d[c] || []).map((r) => (set.has(r.accountId) ? { ...r, accountId: '' } : r));
          });
        }
        if (col === 'contacts') {
          ['deals', 'calls'].forEach((c) => {
            next[c] = (d[c] || []).map((r) => (set.has(r.contactId) ? { ...r, contactId: '' } : r));
          });
        }
        return { ...next, ...mergeEffects(d, combined, removed.map((r) => userLog(col, 'deleted', r))) };
      });
      return removed.length;
    },
    [applyEvent]
  );

  const deleteRecord = useCallback((col, id) => deleteRecords(col, [id]), [deleteRecords]);

  // ---- workflows ----
  const saveWorkflow = useCallback((wf) => {
    const exists = (dbRef.current.workflows || []).some((w) => w.id === wf.id);
    const record = exists
      ? wf
      : { ...wf, id: wf.id || `wf-${Date.now().toString(36)}`, createdAt: new Date().toISOString(), runs: 0, lastRun: null };
    setDb((d) => ({
      ...d,
      workflows: exists ? (d.workflows || []).map((w) => (w.id === wf.id ? { ...w, ...record } : w)) : [record, ...(d.workflows || [])],
    }));
    return record;
  }, []);
  const deleteWorkflow = useCallback((id) => setDb((d) => ({ ...d, workflows: (d.workflows || []).filter((w) => w.id !== id) })), []);
  const toggleWorkflow = useCallback(
    (id, active) => setDb((d) => ({ ...d, workflows: (d.workflows || []).map((w) => (w.id === id ? { ...w, active } : w)) })),
    []
  );

  // ---- notifications / tasks ----
  const markNotification = useCallback(
    (id) => setDb((d) => ({ ...d, notifications: (d.notifications || []).map((n) => (n.id === id ? { ...n, read: true } : n)) })),
    []
  );
  const markAllRead = useCallback(
    () => setDb((d) => ({ ...d, notifications: (d.notifications || []).map((n) => ({ ...n, read: true })) })),
    []
  );
  const clearNotifications = useCallback(() => setDb((d) => ({ ...d, notifications: [] })), []);
  const updateTask = useCallback(
    (id, patch) => setDb((d) => ({ ...d, tasks: (d.tasks || []).map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
    []
  );
  const deleteTask = useCallback((id) => setDb((d) => ({ ...d, tasks: (d.tasks || []).filter((t) => t.id !== id) })), []);

  // ---- My Jobs atomic action (from Branch 3) ----
  const processMyJobAction = useCallback(
    (jobId, { status, decision, actionLabel, comment, userId, recordPatch, nextState, transitionValues }) => {
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
    },
    []
  );

  // ---- Saved Contact Views & Related Records (from Branch 3) ----
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

  // ---- Saved Account Views, Account Related Records & Lead Conversion (from Branch 3) ----
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

  const convertLeadToAccount = useCallback(
    ({
      companyName,
      contactName,
      email,
      phone,
      leadSource = 'Website',
      industry = 'Information Technology',
      city = 'Chennai',
      annualRevenue = 2500000,
      ownerId = 'u1',
      dealName = '',
      dealAmount = 0,
    }) => {
      const now = todayISO();
      const cleanCompany = String(companyName || '').trim();
      const existingAcc = (dbRef.current.accounts || []).find(
        (a) => a.name.trim().toLowerCase() === cleanCompany.toLowerCase()
      );
      const account = existingAcc || {
        id: newId('accounts'),
        name: cleanCompany,
        accountNumber: `ACC-${1001 + (dbRef.current.accounts || []).length}`,
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

      const parts = String(contactName || 'Primary Contact')
        .trim()
        .split(/\s+/);
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
          accounts: existingAcc ? d.accounts : [account, ...(d.accounts || [])],
          contacts: [contact, ...(d.contacts || [])],
          deals: deal ? [deal, ...(d.deals || [])] : d.deals,
          accountRelations: {
            ...rel,
            convertedLeads: [convertedLeadEntry, ...(rel.convertedLeads || [])],
          },
        };
      });

      return { account, reusedExistingAccount: Boolean(existingAcc), contact, deal, convertedLeadEntry };
    },
    []
  );

  // ---- leads specialized (from Branch 1) ----
  const convertLead = useCallback(
    (leadId, { dealName, amount = 450000, stage = 'Proposal' } = {}) => {
      const lead = (dbRef.current.leads || []).find((l) => l.id === leadId);
      if (!lead) return null;
      const now = todayISO();

      const updatedLead = { ...lead, status: 'Converted', convertedAt: now };

      let account = (dbRef.current.accounts || []).find(
        (a) => (a.name || '').toLowerCase() === (lead.company || '').toLowerCase()
      );
      if (!account && lead.company) {
        account = {
          id: newId('accounts'),
          name: lead.company,
          type: 'Customer',
          industry: lead.industry || 'Services',
          location: lead.city || 'Chennai',
          annualRevenue: 5000000,
          status: 'Active',
          ownerId: lead.ownerId || 'u1',
          createdOn: now,
        };
      }

      const contact = {
        id: newId('contacts'),
        name: lead.name,
        accountId: account?.id || '',
        designation: lead.designation || 'Key Contact',
        email: lead.email || '',
        phone: lead.phone || lead.mobile || '',
        lifecycle: 'Customer',
        leadSource: lead.source || 'Website',
        ownerId: lead.ownerId || 'u1',
        createdOn: now,
      };

      const deal = {
        id: newId('deals'),
        name: dealName || `${lead.company || lead.name} - Deal`,
        accountId: account?.id || '',
        contactId: contact.id,
        amount: Number(amount) || 450000,
        stage: stage || 'Proposal',
        probability: 60,
        source: lead.source || 'Website',
        department: 'Enterprise Sales',
        ownerId: lead.ownerId || 'u1',
        closingDate: now,
        createdOn: now,
      };

      const notification = {
        id: `n-${Date.now().toString(36)}`,
        message: `Lead "${lead.name}" converted to Deal "${deal.name}".`,
        module: 'Leads',
        createdAt: new Date().toISOString(),
        read: false,
      };

      setDb((d) => ({
        ...d,
        leads: (d.leads || []).map((l) => (l.id === leadId ? updatedLead : l)),
        accounts: account && !(d.accounts || []).some((a) => a.id === account.id) ? [account, ...(d.accounts || [])] : d.accounts,
        contacts: [contact, ...(d.contacts || [])],
        deals: [deal, ...(d.deals || [])],
        notifications: [notification, ...(d.notifications || [])].slice(0, CAP),
        activity: [
          {
            id: `log-${Date.now().toString(36)}`,
            module: 'Leads',
            recordId: lead.id,
            recordLabel: lead.name,
            message: `Lead converted to Deal (${deal.name}) & Contact`,
            createdAt: new Date().toISOString(),
          },
          ...(d.activity || []),
        ].slice(0, CAP),
      }));
      toast.success(`Lead "${lead.name}" converted to Deal & Contact!`);
      return { lead: updatedLead, contact, deal, account };
    },
    [toast]
  );

  // ---- agents ----
  const toggleAgent = useCallback((id, active) => {
    setDb((d) => ({
      ...d,
      agents: (d.agents || []).map((ag) => (ag.id === id ? { ...ag, status: active ? 'Active' : 'Inactive' } : ag)),
    }));
  }, []);

  const runAgent = useCallback(
    (id) => {
      const ag = (dbRef.current.agents || []).find((a) => a.id === id);
      if (!ag) return;
      const now = new Date();
      const formatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      setDb((d) => ({
        ...d,
        agents: (d.agents || []).map((a) => (a.id === id ? { ...a, tasksExecuted: (a.tasksExecuted || 0) + 1, lastRun: formatted } : a)),
        notifications: [
          {
            id: `n-${Date.now().toString(36)}`,
            message: `Agent "${ag.name}" executed scheduled tasks.`,
            module: 'Agents',
            createdAt: now.toISOString(),
            read: false,
          },
          ...(d.notifications || []),
        ].slice(0, CAP),
        activity: [
          {
            id: `log-${Date.now().toString(36)}`,
            module: 'Agents',
            recordId: ag.id,
            recordLabel: ag.name,
            message: `AI Agent "${ag.name}" executed tasks.`,
            createdAt: now.toISOString(),
          },
          ...(d.activity || []),
        ].slice(0, CAP),
      }));
      toast.success(`Agent "${ag.name}" executed successfully (+1 task).`);
    },
    [toast]
  );

  // ---- workqueue tasks ----
  const createTask = useCallback(
    (taskData) => {
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
      setDb((d) => ({ ...d, tasks: [task, ...(d.tasks || [])] }));
      toast.success(`Task "${task.subject}" created`);
      return task;
    },
    [toast]
  );

  // ---- messages ----
  const sendMessage = useCallback(
    (msgData) => {
      const attachments = msgData.attachments || [];
      const tag = msgData.tag || msgData.badge || 'Lead';
      const msg = {
        id: `msg-${Date.now().toString(36)}`,
        sender: msgData.sender || msgData.recipient || 'Sibi Chakaravarthi',
        recipient: msgData.recipient || msgData.sender || 'Client',
        badge: tag,
        tag,
        subject: msgData.subject || msgData.snippet || 'Follow-up message',
        snippet: msgData.snippet || msgData.subject || msgData.body || '',
        body: msgData.body || msgData.snippet || '',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: todayISO(),
        status: 'Read',
        read: true,
        starred: false,
        archived: false,
        type: msgData.type || `${tag} Messages`,
        hasAttachment: attachments.length > 0 || !!msgData.hasAttachment,
        attachments,
        replies: [],
        ...msgData,
      };
      setDb((d) => ({ ...d, messages: [msg, ...(d.messages || [])] }));
      toast.success(attachments.length ? `Message sent with ${attachments.length} attachment(s)` : 'Message sent');
      return msg;
    },
    [toast]
  );

  const replyMessage = useCallback(
    (msgId, text, attachments = []) => {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setDb((d) => ({
        ...d,
        messages: (d.messages || []).map((m) => {
          if (m.id !== msgId) return m;
          const newReply = {
            id: `rep-${Date.now()}`,
            author: 'Sibi Chakaravarthi',
            sender: 'Sibi Chakaravarthi',
            text,
            time: now,
            attachments,
          };
          const nextAttachments = [...(m.attachments || []), ...attachments];
          return {
            ...m,
            replies: [...(m.replies || []), newReply],
            attachments: nextAttachments,
            hasAttachment: m.hasAttachment || nextAttachments.length > 0,
            status: 'Read',
            read: true,
          };
        }),
      }));
      toast.success(attachments.length ? 'Reply sent with attachment(s)' : 'Reply sent');
    },
    [toast]
  );

  const addMessageAttachment = useCallback(
    (msgId, newAttachments) => {
      setDb((d) => ({
        ...d,
        messages: (d.messages || []).map((m) => {
          if (m.id !== msgId) return m;
          const next = [...(m.attachments || []), ...newAttachments];
          return { ...m, attachments: next, hasAttachment: next.length > 0 };
        }),
      }));
      toast.success(`${newAttachments.length} file(s) attached`);
    },
    [toast]
  );

  const removeMessageAttachment = useCallback(
    (msgId, attId) => {
      setDb((d) => ({
        ...d,
        messages: (d.messages || []).map((m) => {
          if (m.id !== msgId) return m;
          const next = (m.attachments || []).filter((a) => a.id !== attId);
          return { ...m, attachments: next, hasAttachment: next.length > 0 };
        }),
      }));
      toast.info('Attachment removed');
    },
    [toast]
  );

  const toggleStarMessage = useCallback((msgId) => {
    setDb((d) => ({
      ...d,
      messages: (d.messages || []).map((m) => {
        if (m.id !== msgId) return m;
        const nextStar = !(m.starred || m.status === 'Starred');
        return { ...m, starred: nextStar, status: nextStar ? 'Starred' : 'Read' };
      }),
    }));
  }, []);

  const archiveMessage = useCallback(
    (msgId) => {
      setDb((d) => ({
        ...d,
        messages: (d.messages || []).map((m) =>
          m.id === msgId ? { ...m, archived: !m.archived, status: !m.archived ? 'Archived' : 'Read' } : m
        ),
      }));
      toast.info('Message archive updated');
    },
    [toast]
  );

  const markMessageRead = useCallback((msgId) => {
    setDb((d) => ({
      ...d,
      messages: (d.messages || []).map((m) =>
        m.id === msgId ? { ...m, read: true, status: m.status === 'Not Read' ? 'Read' : m.status } : m
      ),
    }));
  }, []);

  // ---- reports ----
  const toggleFavoriteReport = useCallback((repId) => {
    setDb((d) => ({
      ...d,
      reports: (d.reports || []).map((r) => (r.id === repId ? { ...r, favorite: !r.favorite, starred: !r.starred } : r)),
    }));
  }, []);

  const createReport = useCallback(
    (repData) => {
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
    },
    [toast]
  );

  const resetDemo = useCallback(() => {
    clearAll();
    setDb(freshSeed());
    toast.success('Demo data restored');
  }, [toast]);

  const reload = useCallback(() => setDb(loadAll()), []);

  const notify = useCallback(
    (msg, type = 'info') => {
      if (type === 'error') toast.error(msg);
      else if (type === 'success') toast.success(msg);
      else toast.info(msg);
    },
    [toast]
  );

  const value = useMemo(
    () => ({
      ...db,
      db,
      users: USERS,
      ...lookups,
      userName: (id) => lookups.usersById[id]?.name || '—',
      accountName: (id) => lookups.accountsById[id]?.name || '—',
      contactName: (id) => lookups.contactsById[id]?.name || '—',
      leadName: (id) => lookups.leadsById[id]?.name || '—',
      agentName: (id) => lookups.agentsById[id]?.name || '—',
      createRecord,
      updateRecord,
      deleteRecord,
      deleteRecords,
      saveWorkflow,
      deleteWorkflow,
      toggleWorkflow,
      markNotification,
      markAllRead,
      clearNotifications,
      updateTask,
      deleteTask,
      createTask,
      processMyJobAction,
      saveContactView,
      renameContactView,
      deleteContactView,
      addContactRelatedRecord,
      saveAccountView,
      renameAccountView,
      deleteAccountView,
      addAccountRelatedRecord,
      convertLeadToAccount,
      convertLead,
      toggleAgent,
      runAgent,
      sendMessage,
      replyMessage,
      addMessageAttachment,
      removeMessageAttachment,
      toggleStarMessage,
      archiveMessage,
      markMessageRead,
      toggleFavoriteReport,
      createReport,
      resetDemo,
      reload,
      notify,
    }),
    [
      db,
      lookups,
      createRecord,
      updateRecord,
      deleteRecord,
      deleteRecords,
      saveWorkflow,
      deleteWorkflow,
      toggleWorkflow,
      markNotification,
      markAllRead,
      clearNotifications,
      updateTask,
      deleteTask,
      createTask,
      processMyJobAction,
      saveContactView,
      renameContactView,
      deleteContactView,
      addContactRelatedRecord,
      saveAccountView,
      renameAccountView,
      deleteAccountView,
      addAccountRelatedRecord,
      convertLeadToAccount,
      convertLead,
      toggleAgent,
      runAgent,
      sendMessage,
      replyMessage,
      addMessageAttachment,
      removeMessageAttachment,
      toggleStarMessage,
      archiveMessage,
      markMessageRead,
      toggleFavoriteReport,
      createReport,
      resetDemo,
      reload,
      notify,
    ]
  );

  return <CRMContext.Provider value={value}>{children}</CRMContext.Provider>;
}

export function useCRM() {
  const ctx = useContext(CRMContext);
  if (!ctx) throw new Error('useCRM must be used inside CRMProvider');
  return ctx;
}
