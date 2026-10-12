import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import {
  Activity, AlertTriangle, ArrowLeft, CheckCircle2, ClipboardCheck, Copy, FlaskConical, GitBranch, History, ListChecks, Pencil, Play, Plus, Save, Trash2, Workflow, X, Zap,
} from 'lucide-react';
import { useCRM } from '../../context/crmContextInstance';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import FormModal from '../../components/common/RecordForm';
import ActionMenu from '../../components/common/ActionMenu';
import SearchInput from '../../components/common/SearchInput';
import { SelectField } from '../../components/common/FilterBar';
import { UserAvatar } from '../../components/common/Avatar';
import { useToast } from '../../components/common/toastContext';
import { useUrlActions } from '../../components/common/hooks';
import WorkflowCanvas from '../../workflows/WorkflowCanvas';
import { ACTION_ICONS, WorkflowUI } from '../../workflows/workflowUI';
import {
  ACTIONS, MODULE_COLLECTION, MODULE_FIELDS, OPERATORS, STATUS_FIELD, TRIGGERS, TRIGGER_FIELD, TRIGGER_MODULE, WF_MODULES,
  evaluateWorkflow, fieldDef, recordLabel, validateWorkflow,
} from '../../workflows/workflowEngine';
import { STAGES, fmtDate, fmtTime } from '../../utils/calculations';

const uid = (p) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

export function Toggle({ checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={`relative inline-flex h-[22px] w-[40px] shrink-0 rounded-full transition-colors ${checked ? 'bg-success' : 'bg-[#CBD6E6]'}`}>
      <span className={`absolute top-[3px] h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[21px]' : 'translate-x-[3px]'}`} />
    </button>
  );
}

const triggerOptions = (module) => TRIGGERS.filter((t) => !TRIGGER_MODULE[t] || TRIGGER_MODULE[t] === module);
const defaultActionData = (type, module) => {
  switch (type) {
    case 'Update Field': return { actionType: type, field: '', value: '' };
    case 'Change Deal Stage': return { actionType: type, stage: 'Negotiation' };
    case 'Assign Record Owner': return { actionType: type, owner: 'u1' };
    case 'Create Follow-up Task': return { actionType: type, title: `Follow up on {{${module === 'Zoho Finance' ? 'number' : module === 'Calls' ? 'subject' : 'name'}}}`, dueDays: 2 };
    case 'Send Follow-up Message': return { actionType: type, message: `Hi {{name}}, thanks for your interest in our CRM solution. An agent has been assigned to your request.` };
    case 'Add Notification': return { actionType: type, message: `{{${module === 'Zoho Finance' ? 'number' : module === 'Calls' ? 'subject' : 'name'}}} needs attention.` };
    case 'Update Record Status': return { actionType: type, status: '' };
    case 'Create Activity Log': return { actionType: type, message: 'Workflow ran for {{' + (module === 'Zoho Finance' ? 'number' : module === 'Calls' ? 'subject' : 'name') + '}}.' };
    default: return { actionType: type };
  }
};

/* ------------------------------ value input ------------------------------ */
function ValueInput({ module, field, value, onChange, users }) {
  const def = fieldDef(module, field);
  if (def?.type === 'select') return <select className="input h-9 text-[13px]" value={value} onChange={(e) => onChange(e.target.value)}><option value="">Select…</option>{def.options.map((o) => <option key={o}>{o}</option>)}</select>;
  if (def?.type === 'owner') return <select className="input h-9 text-[13px]" value={value} onChange={(e) => onChange(e.target.value)}><option value="">Select…</option>{users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select>;
  return <input className="input h-9 text-[13px]" type={def?.type === 'number' ? 'number' : def?.type === 'date' ? 'date' : 'text'} value={value} onChange={(e) => onChange(e.target.value)} placeholder="Value" />;
}

/* ------------------------------ settings panel ------------------------------ */
function SettingsPanel({ node, module, users, update, remove }) {
  if (!node) {
    return (
      <div className="text-[13px] text-ink-500 leading-relaxed">
        <h3 className="text-[14px] font-semibold text-ink mb-2">Step settings</h3>
        Select a step on the canvas to configure it. Use the <b>+</b> buttons under each step to add the next one, or drag from a handle to connect steps. Conditions route records down the <span className="text-success-700 font-semibold">Yes</span> or <span className="text-danger-700 font-semibold">No</span> branch.
        <div className="mt-4 p-3 rounded-lg bg-page text-[12px]">Messages and task titles can include record fields, for example <code className="text-primary">{'{{name}}'}</code>, <code className="text-primary">{'{{amount}}'}</code> or <code className="text-primary">{'{{number}}'}</code>.</div>
      </div>
    );
  }
  const d = node.data;
  const fields = MODULE_FIELDS[module];
  const label = 'block text-[12px] font-medium text-ink-600 mb-1';
  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-ink capitalize">{node.type} settings</h3>
        {node.type !== 'trigger' && <button onClick={() => remove(node.id)} className="text-[12px] text-danger-700 inline-flex items-center gap-1 hover:underline"><Trash2 size={13} />Remove step</button>}
      </div>

      {node.type === 'trigger' && (
        <>
          <label className={label}>Trigger
            <select className="input h-9 mt-1 text-[13px]" value={d.triggerType} onChange={(e) => update({ triggerType: e.target.value, field: TRIGGER_FIELD[e.target.value] || '', toValue: '' })}>
              {triggerOptions(module).map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
          {d.triggerType === 'Field Value Changed' && (
            <label className={label}>Field to watch
              <select className="input h-9 mt-1 text-[13px]" value={d.field} onChange={(e) => update({ field: e.target.value, toValue: '' })}>
                <option value="">Select a field…</option>{fields.filter((f) => !f.computed).map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
              </select>
            </label>
          )}
          {(TRIGGER_FIELD[d.triggerType] || (d.triggerType === 'Field Value Changed' && d.field)) && (
            <div>
              <span className={label}>Only when the new value is (optional)</span>
              <ValueInput module={module} field={TRIGGER_FIELD[d.triggerType] || d.field} value={d.toValue || ''} onChange={(v) => update({ toValue: v })} users={users} />
            </div>
          )}
          <p className="text-[12px] text-ink-500">Runs when a {module} record is created, edited or deleted in this CRM.</p>
        </>
      )}

      {node.type === 'condition' && (
        <>
          <div>
            <span className={label}>Match</span>
            <div className="inline-flex rounded-lg border border-line overflow-hidden">
              {['AND', 'OR'].map((l) => <button key={l} onClick={() => update({ logic: l })} className={`h-8 px-4 text-[12.5px] font-semibold ${d.logic === l ? 'bg-primary text-white' : 'bg-white text-ink-600'}`}>{l === 'AND' ? 'All rules (AND)' : 'Any rule (OR)'}</button>)}
            </div>
          </div>
          {(d.rules || []).map((r, i) => (
            <div key={i} className="border border-line rounded-lg p-2.5 space-y-2 bg-[#FAFCFF]">
              <div className="flex items-center justify-between"><span className="text-[11.5px] font-semibold text-ink-500">{i === 0 ? 'Rule 1' : `${d.logic} rule ${i + 1}`}</span>
                <button onClick={() => update({ rules: d.rules.filter((_, j) => j !== i) })} className="text-ink-400 hover:text-danger" aria-label="Remove rule"><X size={14} /></button></div>
              <select className="input h-9 text-[13px]" value={r.field} onChange={(e) => update({ rules: d.rules.map((x, j) => (j === i ? { ...x, field: e.target.value, value: '' } : x)) })}>
                <option value="">Field…</option>{fields.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
              </select>
              <select className="input h-9 text-[13px]" value={r.operator} onChange={(e) => update({ rules: d.rules.map((x, j) => (j === i ? { ...x, operator: e.target.value } : x)) })}>
                {OPERATORS.map((o) => <option key={o}>{o}</option>)}
              </select>
              <ValueInput module={module} field={r.field} value={r.value} users={users} onChange={(v) => update({ rules: d.rules.map((x, j) => (j === i ? { ...x, value: v } : x)) })} />
            </div>
          ))}
          <button onClick={() => update({ rules: [...(d.rules || []), { field: '', operator: 'Equals', value: '' }] })} className="btn-secondary h-9 w-full"><Plus size={15} />Add rule</button>
        </>
      )}

      {node.type === 'action' && (
        <>
          <label className={label}>Action
            <select className="input h-9 mt-1 text-[13px]" value={d.actionType} onChange={(e) => update(defaultActionData(e.target.value, module), true)}>
              {ACTIONS.filter((a) => a !== 'Change Deal Stage' || module === 'Deals').map((a) => <option key={a}>{a}</option>)}
            </select>
          </label>
          {d.actionType === 'Update Field' && (
            <>
              <label className={label}>Field<select className="input h-9 mt-1 text-[13px]" value={d.field} onChange={(e) => update({ field: e.target.value, value: '' })}><option value="">Select a field…</option>{fields.filter((f) => !f.computed).map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}</select></label>
              {d.field && <div><span className={label}>New value</span><ValueInput module={module} field={d.field} value={d.value} users={users} onChange={(v) => update({ value: v })} /></div>}
            </>
          )}
          {d.actionType === 'Change Deal Stage' && <label className={label}>Move deal to<select className="input h-9 mt-1 text-[13px]" value={d.stage} onChange={(e) => update({ stage: e.target.value })}>{STAGES.map((s) => <option key={s}>{s}</option>)}</select></label>}
          {d.actionType === 'Assign Record Owner' && <label className={label}>Assign to<select className="input h-9 mt-1 text-[13px]" value={d.owner} onChange={(e) => update({ owner: e.target.value })}>{users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></label>}
          {d.actionType === 'Update Record Status' && (
            <div><span className={label}>Set {fieldDef(module, STATUS_FIELD[module])?.label || 'status'} to</span><ValueInput module={module} field={STATUS_FIELD[module]} value={d.status} users={users} onChange={(v) => update({ status: v })} /></div>
          )}
          {d.actionType === 'Create Follow-up Task' && (
            <>
              <label className={label}>Task title<input className="input h-9 mt-1 text-[13px]" value={d.title} onChange={(e) => update({ title: e.target.value })} /></label>
              <label className={label}>Due in (days)<input type="number" min="0" className="input h-9 mt-1 text-[13px]" value={d.dueDays} onChange={(e) => update({ dueDays: e.target.value })} /></label>
              <p className="text-[12px] text-ink-500">The task is assigned to the record owner and appears under Tasks and in the calendar menu.</p>
            </>
          )}
          {(d.actionType === 'Add Notification' || d.actionType === 'Create Activity Log' || d.actionType === 'Send Follow-up Message') && (
            <label className={label}>{d.actionType === 'Add Notification' ? 'Notification message' : d.actionType === 'Send Follow-up Message' ? 'Follow-up message content' : 'Log entry'}<textarea className="input mt-1 min-h-[84px] py-2 text-[13px]" value={d.message} onChange={(e) => update({ message: e.target.value })} /></label>
          )}
          {d.actionType === 'Add Notification' && <p className="text-[12px] text-ink-500">Shows in the bell menu of this CRM. No email or SMS is sent.</p>}
          {d.actionType === 'Send Follow-up Message' && <p className="text-[12px] text-ink-500">Appears in the CRM Messages dashboard and is logged to the customer communication thread.</p>}
        </>
      )}
    </div>
  );
}

/* ------------------------------ editor ------------------------------ */
function Editor({ workflow }) {
  const crm = useCRM();
  const { users, saveWorkflow, deleteWorkflow } = crm;
  const toast = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState(workflow.name);
  const [description, setDescription] = useState(workflow.description || '');
  const [module, setModule] = useState(workflow.module);
  const [active, setActive] = useState(workflow.active);
  const [nodes, setNodes] = useState(workflow.nodes);
  const [edges, setEdges] = useState(workflow.edges);
  const [selected, setSelected] = useState(null);
  const [errors, setErrors] = useState([]);
  const [testOpen, setTestOpen] = useState(false);
  const [testRecord, setTestRecord] = useState('');
  const [testOut, setTestOut] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [dirty, setDirty] = useState(false);

  const markDirty = () => setDirty(true);
  const onDirty = useCallback(() => setDirty(true), []);

  const addStep = useCallback((parentId, kind, actionType, handle) => {
    setNodes((nds) => {
      const parent = nds.find((n) => n.id === parentId);
      const siblings = edges.filter((e) => e.source === parentId).length;
      const id = uid(kind[0]);
      const x = (parent?.position.x ?? 200) + (handle === 'no' ? 160 : handle === 'yes' ? -160 : 0) + siblings * 40;
      const node = {
        id, type: kind,
        position: { x, y: (parent?.position.y ?? 0) + 200 },
        data: kind === 'condition' ? { logic: 'AND', rules: [{ field: '', operator: 'Equals', value: '' }] } : defaultActionData(actionType, module),
      };
      setEdges((eds) => [...eds, { id: `e-${parentId}-${id}`, source: parentId, target: id, ...(handle ? { sourceHandle: handle } : {}) }]);
      setSelected(id);
      return [...nds.map((n) => ({ ...n, selected: false })), { ...node, selected: true }];
    });
    setDirty(true);
  }, [edges, module]);

  const removeNode = useCallback((id) => {
    setNodes((nds) => nds.filter((n) => n.id !== id || n.type === 'trigger'));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    setSelected((s) => (s === id ? null : s));
    setDirty(true);
  }, []);

  const updateNode = (patch, replace) => {
    setNodes((nds) => nds.map((n) => (n.id === selected ? { ...n, data: replace ? patch : { ...n.data, ...patch } } : n)));
    setTestOut(null);
    setDirty(true);
  };

  const changeModule = (m) => {
    setModule(m);
    setNodes((nds) => nds.map((n) => {
      if (n.type === 'trigger') return { ...n, data: { ...n.data, triggerType: TRIGGER_MODULE[n.data.triggerType] && TRIGGER_MODULE[n.data.triggerType] !== m ? 'Record Updated' : n.data.triggerType, field: '', toValue: '' } };
      if (n.type === 'condition') return { ...n, data: { ...n.data, rules: n.data.rules.map((r) => (fieldDef(m, r.field) ? r : { ...r, field: '', value: '' })) } };
      return n;
    }));
    setTestRecord('');
    setTestOut(null);
    setDirty(true);
  };

  const snapshot = () => ({
    ...workflow, name: name.trim(), description, module, active,
    nodes: nodes.map(({ id, type, position, data }) => ({ id, type, position, data })),
    edges: edges.map(({ id, source, target, sourceHandle }) => ({ id, source, target, ...(sourceHandle ? { sourceHandle } : {}) })),
  });

  const save = (activate) => {
    const wf = { ...snapshot(), ...(activate != null ? { active: activate } : {}) };
    const errs = validateWorkflow(wf);
    setErrors(errs);
    if (errs.length) { toast.error('Fix the highlighted issues before saving.'); return false; }
    saveWorkflow(wf);
    if (activate != null) setActive(activate);
    setDirty(false);
    toast.success(`Workflow "${wf.name}" saved${wf.active ? ' and active' : ''}`);
    return true;
  };

  const collection = MODULE_COLLECTION[module];
  const records = crm[collection] || [];
  const runTest = () => {
    const record = records.find((r) => r.id === testRecord);
    if (!record) return;
    const t = nodes.find((n) => n.type === 'trigger')?.data;
    let ev;
    if (t.triggerType === 'Record Created') ev = { type: 'created', record, prev: null };
    else if (t.triggerType === 'Record Deleted') ev = { type: 'deleted', record, prev: record };
    else {
      const f = TRIGGER_FIELD[t.triggerType] || t.field;
      const next = f && t.toValue ? { ...record, [f]: fieldDef(module, f)?.type === 'number' ? Number(t.toValue) : t.toValue } : record;
      ev = { type: 'updated', record: next, prev: f ? { ...record, [f]: '__previous__' } : record };
    }
    const out = evaluateWorkflow(snapshot(), { ...ev, module }, { users });
    setTestOut({ ...out, label: recordLabel(record) });
  };
  const testResult = testOut ? Object.fromEntries(testOut.steps.map((s) => [s.nodeId, s.result])) : null;
  const ui = useMemo(() => ({ addStep, removeNode, module, users, testResult }), [addStep, removeNode, module, users, testResult]);
  const selNode = nodes.find((n) => n.id === selected);

  return (
    <div className="flex flex-col h-[calc(100vh-86px)] min-h-[560px]">
      <div className="card px-3 py-2.5 mb-3 flex flex-wrap items-center gap-2.5">
        <button onClick={() => (dirty ? window.confirm('Leave without saving your changes?') && navigate('/workflows') : navigate('/workflows'))} className="icon-btn" aria-label="Back to workflows"><ArrowLeft size={18} /></button>
        <input value={name} onChange={(e) => { setName(e.target.value); markDirty(); }} placeholder="Workflow name" aria-label="Workflow name" className="h-10 px-3 rounded-lg border border-line text-[15px] font-semibold text-ink flex-1 min-w-[200px] max-w-[360px] focus:outline-none focus:border-primary" />
        <SelectField value={module} onChange={changeModule} options={WF_MODULES} className="w-[150px]" />
        <label className="flex items-center gap-2 text-[13px] text-ink-600 px-2"><Toggle checked={active} onChange={(v) => { setActive(v); markDirty(); }} label="Activate workflow" />{active ? 'Active' : 'Inactive'}</label>
        <div className="flex-1" />
        {dirty && <span className="text-[12px] text-warning-700">Unsaved changes</span>}
        <button className="btn-secondary" onClick={() => setTestOpen((o) => !o)}><FlaskConical size={16} />Test run</button>
        <button className="btn-primary" onClick={() => save()}><Save size={16} />Save Workflow</button>
        <ActionMenu items={[
          { label: active ? 'Save & deactivate' : 'Save & activate', icon: Play, onClick: () => save(!active) },
          { label: 'Delete workflow', icon: Trash2, danger: true, onClick: () => setConfirmDelete(true) },
        ]} />
      </div>

      {errors.length > 0 && (
        <div className="mb-3 rounded-lg border border-danger/30 bg-danger-50 px-4 py-2.5 text-[13px] text-danger-700 flex gap-2.5">
          <AlertTriangle size={17} className="shrink-0 mt-0.5" />
          <ul className="list-disc pl-4 space-y-0.5">{errors.map((e) => <li key={e}>{e}</li>)}</ul>
          <button className="ml-auto self-start" onClick={() => setErrors([])} aria-label="Dismiss"><X size={15} /></button>
        </div>
      )}

      <div className="flex-1 flex gap-3 min-h-0 flex-col lg:flex-row">
        <aside className="card p-3 lg:w-[200px] shrink-0 overflow-y-auto thin-scroll">
          <h3 className="text-[13px] font-semibold text-ink mb-2">Add step</h3>
          <p className="text-[11.5px] text-ink-500 mb-2.5">{selNode ? 'Adds below the selected step.' : 'Adds below the trigger. Select a step to add under it.'}</p>
          <button onClick={() => addStep(selNode && selNode.type !== 'condition' ? selNode.id : selNode?.id || nodes.find((n) => n.type === 'trigger').id, 'condition', null, selNode?.type === 'condition' ? 'yes' : undefined)}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg border border-line hover:border-warning hover:bg-warning-50 text-[12.5px] text-ink mb-2"><GitBranch size={15} className="text-warning" />Condition</button>
          <div className="space-y-1.5">
            {ACTIONS.filter((a) => a !== 'Change Deal Stage' || module === 'Deals').map((a) => {
              const Icon = ACTION_ICONS[a];
              return (
                <button key={a} onClick={() => addStep(selNode?.id || nodes.find((n) => n.type === 'trigger').id, 'action', a, selNode?.type === 'condition' ? 'yes' : undefined)}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg border border-line hover:border-success hover:bg-success-50 text-[12.5px] text-ink text-left"><Icon size={15} className="text-success shrink-0" />{a}</button>
              );
            })}
          </div>
          <label className="block mt-4 text-[12px] font-medium text-ink-600">Description
            <textarea value={description} onChange={(e) => { setDescription(e.target.value); markDirty(); }} className="input mt-1 min-h-[70px] py-2 text-[12.5px]" placeholder="What does this rule do?" />
          </label>
        </aside>

        <div className="card flex-1 min-h-[420px] overflow-hidden relative">
          <WorkflowUI.Provider value={ui}>
            <ReactFlowProvider>
              <WorkflowCanvas nodes={nodes} edges={edges} setNodes={setNodes} setEdges={setEdges} onSelect={setSelected} onDirty={onDirty} />
            </ReactFlowProvider>
          </WorkflowUI.Provider>
          {testOpen && (
            <div className="absolute top-3 left-3 w-[320px] max-w-[calc(100%-1.5rem)] bg-white border border-line rounded-xl shadow-pop p-3.5 z-10">
              <div className="flex items-center justify-between mb-2"><h3 className="text-[13.5px] font-semibold text-ink flex items-center gap-1.5"><FlaskConical size={15} className="text-primary" />Test with a record</h3><button onClick={() => { setTestOpen(false); setTestOut(null); }} aria-label="Close test"><X size={15} className="text-ink-400" /></button></div>
              <p className="text-[12px] text-ink-500 mb-2">Simulates the trigger on a real {module} record. Nothing is changed.</p>
              <select className="input h-9 text-[13px]" value={testRecord} onChange={(e) => { setTestRecord(e.target.value); setTestOut(null); }}>
                <option value="">Choose a record…</option>
                {records.slice(0, 300).map((r) => <option key={r.id} value={r.id}>{recordLabel(r)}</option>)}
              </select>
              <button className="btn-primary h-9 w-full mt-2" disabled={!testRecord} onClick={runTest}><Play size={15} />Run test</button>
              {testOut && (
                <div className="mt-3 text-[12.5px]">
                  {!testOut.matched && <p className="text-ink-500">The trigger doesn’t match this simulated event.</p>}
                  {testOut.matched && (
                    <>
                      <p className={`font-semibold ${testOut.executed ? 'text-success-700' : 'text-ink-600'}`}>{testOut.executed ? `Would run ${testOut.steps.filter((s) => s.kind === 'action').length} action(s) for ${testOut.label}` : `Conditions not met for ${testOut.label}`}</p>
                      <ul className="mt-1.5 space-y-1">
                        {testOut.steps.map((s) => (
                          <li key={s.nodeId} className="flex items-start gap-1.5">
                            {s.result === 'failed' ? <X size={14} className="text-danger mt-0.5 shrink-0" /> : <CheckCircle2 size={14} className="text-success mt-0.5 shrink-0" />}
                            <span><b className="text-ink">{s.label}</b> <span className="text-ink-500">— {s.result}{s.detail ? `: ${s.detail}` : ''}</span></span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="card p-4 lg:w-[300px] shrink-0 overflow-y-auto thin-scroll">
          <SettingsPanel node={selNode} module={module} users={users} update={updateNode} remove={removeNode} />
        </aside>
      </div>

      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete workflow?" message={`Delete "${workflow.name}"? Its execution history is kept.`}
        onConfirm={() => { deleteWorkflow(workflow.id); toast.success('Workflow deleted'); navigate('/workflows'); }} />
    </div>
  );
}

/* ------------------------------ list + tabs ------------------------------ */
export default function WorkflowBuilder() {
  const { id } = useParams();
  const crm = useCRM();
  const { workflows, workflowHistory, tasks, activity, saveWorkflow, deleteWorkflow, toggleWorkflow, updateTask, deleteTask } = crm;
  const navigate = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();
  const [tab, setTab] = useState(params.get('tab') || 'rules');
  const [moduleFilter, setModuleFilter] = useState(params.get('module') || '');
  const [q, setQ] = useState('');
  const [creating, setCreating] = useState(false);
  const [confirm, setConfirm] = useState(null);

  useEffect(() => { if (params.get('tab')) setTab(params.get('tab')); if (params.get('module')) setModuleFilter(params.get('module')); }, [params]);
  useUrlActions({ onCreate: () => setCreating(true) });

  if (id) {
    const wf = workflows.find((w) => w.id === id);
    if (!wf) {
      return (
        <div className="card p-10 text-center">
          <p className="text-[15px] font-semibold text-ink">This workflow no longer exists.</p>
          <Link to="/workflows" className="btn-primary mt-4">Back to workflows</Link>
        </div>
      );
    }
    return <Editor key={wf.id} workflow={wf} />;
  }

  const rules = workflows.filter((w) => (!moduleFilter || w.module === moduleFilter) && (!q || w.name.toLowerCase().includes(q.toLowerCase())));
  const openTasks = tasks.filter((t) => t.status === 'Open').length;
  const trig = (w) => w.nodes.find((n) => n.type === 'trigger')?.data;

  const create = (v) => {
    const wf = {
      id: uid('wf-'), name: v.name.trim(), module: v.module, active: false, description: v.description || '', runs: 0, lastRun: null, createdAt: new Date().toISOString(),
      nodes: [{ id: 't1', type: 'trigger', position: { x: 260, y: 40 }, data: { triggerType: v.trigger, field: TRIGGER_FIELD[v.trigger] || '', toValue: '' } }],
      edges: [],
    };
    saveWorkflow(wf);
    setCreating(false);
    navigate(`/workflows/${wf.id}`);
  };
  const duplicate = (w) => {
    const copy = { ...JSON.parse(JSON.stringify(w)), id: uid('wf-'), name: `${w.name} (copy)`, active: false, runs: 0, lastRun: null };
    saveWorkflow(copy);
    toast.success(`Duplicated as "${copy.name}" (inactive)`);
  };

  const TABS = [
    { key: 'rules', label: 'Workflow Rules', icon: Workflow, count: workflows.length },
    { key: 'history', label: 'Execution History', icon: History, count: workflowHistory.length },
    { key: 'tasks', label: 'Tasks', icon: ClipboardCheck, count: openTasks },
    { key: 'activity', label: 'Activity Log', icon: Activity, count: activity.length },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-3">
        <StatCard variant="inline" icon={Workflow} tone="blue" label="Workflow Rules" value={workflows.length} trendLabel="" />
        <StatCard variant="inline" icon={Zap} tone="green" label="Active Rules" value={workflows.filter((w) => w.active).length} trendLabel="" />
        <StatCard variant="inline" icon={ListChecks} tone="violet" label="Executions" value={workflowHistory.length} trendLabel="" />
        <StatCard variant="inline" icon={ClipboardCheck} tone="amber" label="Open Tasks" value={openTasks} trendLabel="" />
      </div>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 px-3 pt-3 border-b border-line">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`h-10 px-3 -mb-px border-b-2 text-[13.5px] font-medium inline-flex items-center gap-2 ${tab === t.key ? 'border-primary text-primary' : 'border-transparent text-ink-600 hover:text-ink'}`}>
              <t.icon size={16} />{t.label}<span className={`text-[11px] px-1.5 rounded-full ${tab === t.key ? 'bg-primary-50' : 'bg-page'}`}>{t.count}</span>
            </button>
          ))}
          <div className="flex-1" />
          <button className="btn-primary h-9 mb-2" onClick={() => setCreating(true)}><Plus size={16} />Create Rule</button>
        </div>

        {tab === 'rules' && (
          <>
            <div className="flex flex-wrap items-center gap-2.5 px-4 py-3">
              <SearchInput value={q} onChange={setQ} placeholder="Search workflow rules" size="sm" className="w-full sm:w-[260px]" />
              <SelectField value={moduleFilter} onChange={setModuleFilter} options={WF_MODULES} allLabel="All modules" size="sm" className="w-[170px]" />
            </div>
            <div className="overflow-x-auto thin-scroll">
              <table className="w-full min-w-[980px] text-[13px] border-separate border-spacing-0">
                <thead><tr className="bg-[#F5F8FD]">{['Rule', 'Module', 'Trigger', 'Steps', 'Status', 'Runs', 'Last run', ''].map((h) => <th key={h} className="th text-left">{h}</th>)}</tr></thead>
                <tbody>
                  {rules.map((w) => {
                    const t = trig(w);
                    return (
                      <tr key={w.id} className="hover:bg-[#F8FAFE]">
                        <td className="td py-3 pl-4"><Link to={`/workflows/${w.id}`} className="font-semibold text-primary hover:underline">{w.name}</Link><div className="text-[12px] text-ink-500 mt-0.5 max-w-[340px]">{w.description || 'No description'}</div></td>
                        <td className="td"><span className="inline-flex h-6 px-2 items-center rounded-md bg-primary-50 text-primary text-[12px] font-medium">{w.module}</span></td>
                        <td className="td">{t?.triggerType}{t?.toValue ? <span className="text-ink-400"> → {t.toValue}</span> : ''}</td>
                        <td className="td whitespace-nowrap">{w.nodes.filter((n) => n.type === 'condition').length} conditions · {w.nodes.filter((n) => n.type === 'action').length} actions</td>
                        <td className="td"><span className="inline-flex items-center gap-2"><Toggle checked={w.active} label={`Activate ${w.name}`} onChange={(v) => {
                          if (v && validateWorkflow(w).length) { toast.error('Open the rule and finish its setup before activating.'); return; }
                          toggleWorkflow(w.id, v); toast.success(`${w.name} ${v ? 'activated' : 'deactivated'}`);
                        }} /><StatusBadge kind="workflow" value={w.active ? 'Active' : 'Inactive'} size="sm" /></span></td>
                        <td className="td">{w.runs || 0}</td>
                        <td className="td whitespace-nowrap">{w.lastRun ? `${fmtDate(w.lastRun)} ${fmtTime(w.lastRun)}` : 'Never'}</td>
                        <td className="td text-right pr-4">
                          <div className="inline-flex items-center gap-2">
                            <button className="icon-btn-primary" onClick={() => navigate(`/workflows/${w.id}`)} aria-label={`Edit ${w.name}`}><Pencil size={16} /></button>
                            <ActionMenu items={[{ label: 'Duplicate', icon: Copy, onClick: () => duplicate(w) }, { divider: true }, { label: 'Delete rule', icon: Trash2, danger: true, onClick: () => setConfirm(w) }]} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {rules.length === 0 && <tr><td colSpan={8} className="py-12 text-center text-ink-500">No workflow rules{moduleFilter ? ` for ${moduleFilter}` : ''} yet. <button className="link" onClick={() => setCreating(true)}>Create one</button>.</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === 'history' && (
          <div className="overflow-x-auto thin-scroll">
            <table className="w-full min-w-[900px] text-[13px] border-separate border-spacing-0">
              <thead><tr className="bg-[#F5F8FD]">{['When', 'Workflow', 'Module', 'Record', 'Event', 'Outcome', 'Actions run'].map((h) => <th key={h} className="th text-left">{h}</th>)}</tr></thead>
              <tbody>
                {workflowHistory.slice(0, 200).map((h) => (
                  <tr key={h.id} className="h-11">
                    <td className="td pl-4 whitespace-nowrap">{fmtDate(h.at)} {fmtTime(h.at)}</td>
                    <td className="td"><Link className="link" to={`/workflows/${h.workflowId}`}>{h.workflowName}</Link></td>
                    <td className="td">{h.module}</td><td className="td">{h.recordLabel}</td><td className="td capitalize">{h.event}</td>
                    <td className="td"><StatusBadge kind="workflow" value={h.outcome} size="sm" /></td>
                    <td className="td">{h.actions.join(', ') || '—'}</td>
                  </tr>
                ))}
                {workflowHistory.length === 0 && <tr><td colSpan={7} className="py-12 text-center text-ink-500">No workflow has run yet. Try creating a deal over ₹10,00,000 or marking an invoice as overdue.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'tasks' && (
          <div className="overflow-x-auto thin-scroll">
            <table className="w-full min-w-[860px] text-[13px] border-separate border-spacing-0">
              <thead><tr className="bg-[#F5F8FD]">{['', 'Task', 'Related record', 'Due', 'Owner', 'Created by', ''].map((h, i) => <th key={i} className="th text-left">{h}</th>)}</tr></thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t.id} className="h-12">
                    <td className="td pl-4 w-10"><input type="checkbox" className="cb" checked={t.status === 'Done'} onChange={(e) => updateTask(t.id, { status: e.target.checked ? 'Done' : 'Open' })} aria-label="Mark task done" /></td>
                    <td className={`td ${t.status === 'Done' ? 'line-through text-ink-400' : 'text-ink'}`}>{t.title}</td>
                    <td className="td">{t.module} · {t.recordLabel}</td>
                    <td className="td whitespace-nowrap">{fmtDate(t.dueDate)}</td>
                    <td className="td"><UserAvatar userId={t.ownerId} size={26} withName /></td>
                    <td className="td">{t.workflowName}</td>
                    <td className="td text-right pr-4"><button onClick={() => deleteTask(t.id)} className="p-1.5 rounded text-ink-400 hover:text-danger hover:bg-danger-50" aria-label="Delete task"><Trash2 size={15} /></button></td>
                  </tr>
                ))}
                {tasks.length === 0 && <tr><td colSpan={7} className="py-12 text-center text-ink-500">Tasks created by “Create Follow-up Task” actions appear here.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'activity' && (
          <ul className="divide-y divide-line-soft max-h-[640px] overflow-y-auto">
            {activity.slice(0, 300).map((a) => (
              <li key={a.id} className="px-4 py-2.5 flex items-start gap-3 text-[13px]">
                <span className={`mt-1 h-2 w-2 rounded-full shrink-0 ${a.source === 'user' ? 'bg-ink-400' : 'bg-success'}`} />
                <div className="flex-1"><div className="text-ink">{a.message}</div><div className="text-[11.5px] text-ink-500">{a.source === 'user' ? 'Record change' : `Workflow · ${a.workflowName}`} · {a.module}</div></div>
                <span className="text-[12px] text-ink-400 whitespace-nowrap">{fmtDate(a.createdAt)} {fmtTime(a.createdAt)}</span>
              </li>
            ))}
            {activity.length === 0 && <li className="py-12 text-center text-ink-500">Record changes and workflow log entries appear here.</li>}
          </ul>
        )}
      </section>

      <FormModal open={creating} onClose={() => setCreating(false)} title="Create workflow rule" subtitle="Pick the module and what starts the rule. You’ll add conditions and actions on the canvas." size="md"
        initial={creating ? { name: '', module: moduleFilter || 'Deals', trigger: 'Record Created', description: '' } : null} submitLabel="Create & open builder"
        fields={[
          { name: 'name', label: 'Rule name', required: true, span: 2 },
          { name: 'module', label: 'Module', type: 'select', options: WF_MODULES, required: true, onChangeEffect: (v, vals) => (TRIGGER_MODULE[vals.trigger] && TRIGGER_MODULE[vals.trigger] !== v ? { trigger: 'Record Created' } : {}) },
          { name: 'trigger', label: 'Trigger', type: 'select', required: true, options: (vals) => triggerOptions(vals.module) },
          { name: 'description', label: 'Description', type: 'textarea', span: 2 },
        ]}
        onSubmit={create} />
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} title="Delete workflow rule?" message={confirm ? `Delete "${confirm.name}"? Records already changed by it stay as they are.` : ''}
        onConfirm={() => { deleteWorkflow(confirm.id); toast.success('Workflow deleted'); }} />
    </div>
  );
}
