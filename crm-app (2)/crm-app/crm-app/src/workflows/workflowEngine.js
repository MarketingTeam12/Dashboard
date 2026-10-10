import {
  STAGES, STAGE_PROBABILITY, addDays, balanceOf, fmtINR, todayISO,
} from '../utils/calculations';
import {
  ACCOUNT_STATUSES, ACCOUNT_TYPES, CALL_STATUSES, CALL_TYPES, DEAL_SOURCES, DEPARTMENTS, INDUSTRIES,
  INVOICE_STATUSES, INVOICE_TYPES, LEAD_SOURCES, LIFECYCLES,
} from '../data/seedData';

export const WF_MODULES = ['Contacts', 'Accounts', 'Deals', 'Calls', 'Zoho Finance'];
export const MODULE_COLLECTION = { Contacts: 'contacts', Accounts: 'accounts', Deals: 'deals', Calls: 'calls', 'Zoho Finance': 'invoices', Forecasts: 'forecasts' };
export const COLLECTION_MODULE = Object.fromEntries(Object.entries(MODULE_COLLECTION).map(([k, v]) => [v, k]));

export const TRIGGERS = ['Record Created', 'Record Updated', 'Record Deleted', 'Field Value Changed', 'Deal Stage Changed', 'Invoice Status Changed', 'Call Status Changed'];
export const TRIGGER_MODULE = { 'Deal Stage Changed': 'Deals', 'Invoice Status Changed': 'Zoho Finance', 'Call Status Changed': 'Calls' };
export const TRIGGER_FIELD = { 'Deal Stage Changed': 'stage', 'Invoice Status Changed': 'status', 'Call Status Changed': 'status' };
export const OPERATORS = ['Equals', 'Not Equals', 'Contains', 'Greater Than', 'Less Than'];
export const ACTIONS = ['Update Field', 'Change Deal Stage', 'Assign Record Owner', 'Create Follow-up Task', 'Add Notification', 'Update Record Status', 'Create Activity Log'];
export const STATUS_FIELD = { Contacts: 'lifecycle', Accounts: 'status', Deals: 'stage', Calls: 'status', 'Zoho Finance': 'status' };

const sel = (key, label, options) => ({ key, label, type: 'select', options });
export const MODULE_FIELDS = {
  Contacts: [
    { key: 'name', label: 'Contact Name', type: 'text' }, { key: 'designation', label: 'Designation', type: 'text' },
    { key: 'email', label: 'Email', type: 'text' }, sel('lifecycle', 'Lifecycle Stage', LIFECYCLES),
    sel('leadSource', 'Lead Source', LEAD_SOURCES), { key: 'ownerId', label: 'Owner', type: 'owner' },
    { key: 'department', label: 'Department', type: 'text' },
  ],
  Accounts: [
    { key: 'name', label: 'Account Name', type: 'text' }, sel('type', 'Account Type', ACCOUNT_TYPES),
    sel('industry', 'Industry', INDUSTRIES), { key: 'location', label: 'Location', type: 'text' },
    { key: 'annualRevenue', label: 'Annual Revenue', type: 'number' }, sel('status', 'Account Status', ACCOUNT_STATUSES),
    { key: 'ownerId', label: 'Owner', type: 'owner' },
  ],
  Deals: [
    { key: 'name', label: 'Deal Name', type: 'text' }, { key: 'amount', label: 'Amount', type: 'number' },
    sel('stage', 'Stage', STAGES), { key: 'probability', label: 'Probability', type: 'number' },
    sel('source', 'Deal Source', DEAL_SOURCES), sel('department', 'Department', DEPARTMENTS),
    { key: 'ownerId', label: 'Owner', type: 'owner' }, { key: 'closingDate', label: 'Closing Date', type: 'date' },
  ],
  Calls: [
    { key: 'subject', label: 'Call Subject', type: 'text' }, sel('type', 'Call Type', CALL_TYPES),
    sel('status', 'Status', CALL_STATUSES), { key: 'duration', label: 'Duration (sec)', type: 'number' },
    { key: 'ownerId', label: 'Owner', type: 'owner' }, { key: 'notes', label: 'Notes', type: 'text' },
  ],
  'Zoho Finance': [
    { key: 'number', label: 'Invoice Number', type: 'text' }, sel('type', 'Invoice Type', INVOICE_TYPES),
    sel('status', 'Status', INVOICE_STATUSES), { key: 'amount', label: 'Amount', type: 'number' },
    { key: 'paidAmount', label: 'Paid Amount', type: 'number' }, { key: 'balance', label: 'Balance', type: 'number', computed: true },
    { key: 'dueDate', label: 'Due Date', type: 'date' },
  ],
};

export const fieldDef = (module, key) => (MODULE_FIELDS[module] || []).find((f) => f.key === key);
export const recordLabel = (r) => (r ? r.name || r.subject || r.number || r.id : '');

const uid = (p) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const str = (v) => (v == null ? '' : String(v));

function getValue(record, key) {
  if (key === 'balance') return balanceOf(record);
  return record?.[key];
}

function formatValue(record, key, users) {
  const v = getValue(record, key);
  if (['amount', 'balance', 'paidAmount', 'annualRevenue'].includes(key)) return fmtINR(v);
  if (key === 'ownerId') return users.find((u) => u.id === v)?.name || v;
  return str(v);
}

export function interpolate(template, record, users = []) {
  return str(template).replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => formatValue(record, k, users));
}

function triggerMatches(t, ev) {
  const { type, record, prev } = ev;
  const changed = (f) => type === 'updated' && prev && str(getValue(prev, f)) !== str(getValue(record, f));
  const toOk = (f) => !t.toValue || str(getValue(record, f)).toLowerCase() === str(t.toValue).toLowerCase();
  switch (t.triggerType) {
    case 'Record Created': return type === 'created';
    case 'Record Updated': return type === 'updated';
    case 'Record Deleted': return type === 'deleted';
    case 'Field Value Changed': return !!t.field && changed(t.field) && toOk(t.field);
    case 'Deal Stage Changed':
    case 'Invoice Status Changed':
    case 'Call Status Changed': {
      const f = TRIGGER_FIELD[t.triggerType];
      return ev.module === TRIGGER_MODULE[t.triggerType] && changed(f) && toOk(f);
    }
    default: return false;
  }
}

export function evalRule(rule, record) {
  const actual = getValue(record, rule.field);
  const expected = rule.value;
  const na = Number(actual);
  const ne = Number(expected);
  const numeric = str(actual) !== '' && str(expected) !== '' && !isNaN(na) && !isNaN(ne);
  const eq = numeric ? na === ne : str(actual).toLowerCase() === str(expected).toLowerCase();
  switch (rule.operator) {
    case 'Equals': return eq;
    case 'Not Equals': return !eq;
    case 'Contains': return str(actual).toLowerCase().includes(str(expected).toLowerCase());
    case 'Greater Than': return numeric ? na > ne : str(actual) > str(expected);
    case 'Less Than': return numeric ? na < ne : str(actual) < str(expected);
    default: return false;
  }
}

export function evalCondition(data, record) {
  const rules = (data.rules || []).filter((r) => r.field);
  if (!rules.length) return true;
  return data.logic === 'OR' ? rules.some((r) => evalRule(r, record)) : rules.every((r) => evalRule(r, record));
}

export function describeAction(d, users = []) {
  switch (d.actionType) {
    case 'Update Field': return d.field ? `Set ${d.field} = ${d.value ?? ''}` : 'Choose a field';
    case 'Change Deal Stage': return d.stage ? `Move to ${d.stage}` : 'Choose a stage';
    case 'Assign Record Owner': return users.find((u) => u.id === d.owner)?.name ? `Assign to ${users.find((u) => u.id === d.owner).name}` : 'Choose an owner';
    case 'Create Follow-up Task': return d.title ? `${d.title} (due in ${d.dueDays || 0}d)` : 'Describe the task';
    case 'Add Notification': return d.message || 'Write a message';
    case 'Update Record Status': return d.status ? `Set status to ${d.status}` : 'Choose a status';
    case 'Create Activity Log': return d.message || 'Write a log entry';
    default: return '';
  }
}

export function validateWorkflow(wf) {
  const errors = [];
  if (!wf.name?.trim()) errors.push('Give the workflow a name.');
  const triggers = wf.nodes.filter((n) => n.type === 'trigger');
  if (triggers.length !== 1) errors.push('A workflow needs exactly one trigger.');
  const t = triggers[0]?.data;
  if (t && TRIGGER_MODULE[t.triggerType] && TRIGGER_MODULE[t.triggerType] !== wf.module) errors.push(`"${t.triggerType}" only works with the ${TRIGGER_MODULE[t.triggerType]} module.`);
  if (t?.triggerType === 'Field Value Changed' && !t.field) errors.push('Pick the field the trigger watches.');
  if (!wf.nodes.some((n) => n.type === 'action')) errors.push('Add at least one action.');
  wf.nodes.filter((n) => n.type === 'action').forEach((n) => {
    const d = n.data;
    const missing =
      (d.actionType === 'Update Field' && !d.field) || (d.actionType === 'Change Deal Stage' && !d.stage) ||
      (d.actionType === 'Assign Record Owner' && !d.owner) || (d.actionType === 'Create Follow-up Task' && !d.title) ||
      (['Add Notification', 'Create Activity Log'].includes(d.actionType) && !d.message) ||
      (d.actionType === 'Update Record Status' && !d.status);
    if (missing) errors.push(`Finish setting up the "${d.actionType}" action.`);
    if (d.actionType === 'Change Deal Stage' && wf.module !== 'Deals') errors.push('"Change Deal Stage" only works with Deals.');
  });
  wf.nodes.filter((n) => n.type !== 'trigger').forEach((n) => {
    if (!wf.edges.some((e) => e.target === n.id)) errors.push(`Connect the ${n.type} step "${n.type === 'action' ? n.data.actionType : 'Condition'}" to the flow.`);
  });
  return [...new Set(errors)];
}

/**
 * Walks one workflow graph for an event. Pure: returns what would happen.
 */
export function evaluateWorkflow(wf, ev, ctx = {}) {
  const users = ctx.users || [];
  const today = ctx.today || todayISO();
  const out = { matched: false, executed: false, steps: [], patch: {}, notifications: [], tasks: [], activity: [] };
  const trigger = wf.nodes.find((n) => n.type === 'trigger');
  if (!trigger || !triggerMatches(trigger.data, ev)) return out;
  out.matched = true;
  out.steps.push({ nodeId: trigger.id, kind: 'trigger', label: trigger.data.triggerType, result: 'matched' });

  const working = { ...ev.record };
  const byId = Object.fromEntries(wf.nodes.map((n) => [n.id, n]));
  const outgoing = (id) => wf.edges.filter((e) => e.source === id);
  const queue = outgoing(trigger.id).map((e) => e.target);
  const visited = new Set([trigger.id]);
  const now = new Date().toISOString();
  const base = { module: wf.module, recordId: ev.record.id, recordLabel: recordLabel(ev.record), workflowId: wf.id, workflowName: wf.name, createdAt: now };

  while (queue.length) {
    const id = queue.shift();
    if (visited.has(id) || !byId[id]) continue;
    visited.add(id);
    const node = byId[id];
    if (node.type === 'condition') {
      const pass = evalCondition(node.data, working);
      out.steps.push({ nodeId: id, kind: 'condition', label: 'Condition', result: pass ? 'passed' : 'failed' });
      outgoing(id).filter((e) => (e.sourceHandle || 'yes') === (pass ? 'yes' : 'no')).forEach((e) => queue.push(e.target));
      continue;
    }
    if (node.type === 'action') {
      const d = node.data;
      const setField = (k, v) => {
        if (ev.type === 'deleted') return;
        out.patch[k] = v;
        working[k] = v;
      };
      switch (d.actionType) {
        case 'Update Field': {
          const def = fieldDef(wf.module, d.field);
          if (def && !def.computed) setField(d.field, def.type === 'number' ? Number(d.value) || 0 : d.value);
          break;
        }
        case 'Change Deal Stage':
          if (wf.module === 'Deals' && d.stage) {
            setField('stage', d.stage);
            setField('probability', STAGE_PROBABILITY[d.stage]);
          }
          break;
        case 'Assign Record Owner': if (d.owner) setField('ownerId', d.owner); break;
        case 'Update Record Status': if (d.status) setField(STATUS_FIELD[wf.module], d.status); break;
        case 'Create Follow-up Task':
          out.tasks.push({ ...base, id: uid('task'), title: interpolate(d.title, working, users), dueDate: addDays(today, Number(d.dueDays) || 0), ownerId: working.ownerId || 'u1', status: 'Open' });
          break;
        case 'Add Notification':
          out.notifications.push({ ...base, id: uid('n'), message: interpolate(d.message, working, users), read: false });
          break;
        case 'Create Activity Log':
          out.activity.push({ ...base, id: uid('log'), message: interpolate(d.message, working, users) });
          break;
        default: break;
      }
      out.executed = true;
      out.steps.push({ nodeId: id, kind: 'action', label: d.actionType, result: 'executed', detail: describeAction(d, users) });
      outgoing(id).forEach((e) => queue.push(e.target));
    }
  }
  return out;
}

/**
 * Runs every active workflow of the event's module. Patches are merged in order.
 * Patches produced here are applied without re-triggering workflows (prevents loops).
 */
export function runWorkflows(workflows, ev, ctx = {}) {
  const result = { patch: {}, notifications: [], tasks: [], activity: [], history: [], fired: [] };
  let record = ev.record;
  workflows
    .filter((wf) => wf.active && wf.module === ev.module)
    .forEach((wf) => {
      const r = evaluateWorkflow(wf, { ...ev, record }, ctx);
      if (!r.matched) return;
      record = { ...record, ...r.patch };
      Object.assign(result.patch, r.patch);
      result.notifications.push(...r.notifications);
      result.tasks.push(...r.tasks);
      result.activity.push(...r.activity);
      result.fired.push({ id: wf.id, name: wf.name, executed: r.executed });
      result.history.push({
        id: uid('run'), workflowId: wf.id, workflowName: wf.name, module: wf.module, event: ev.type,
        recordId: ev.record.id, recordLabel: recordLabel(ev.record), at: new Date().toISOString(),
        outcome: r.executed ? 'Executed' : 'Conditions not met',
        actions: r.steps.filter((s) => s.kind === 'action').map((s) => s.label),
      });
    });
  return result;
}
