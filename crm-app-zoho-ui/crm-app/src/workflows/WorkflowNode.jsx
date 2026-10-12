import { Plus, Trash2 } from 'lucide-react';
import Dropdown, { MenuItem, MenuLabel } from '../components/common/Dropdown';
import { ACTIONS } from './workflowEngine';
import { KIND_STYLE, useWorkflowUI } from './workflowUI';

export function AddStepMenu({ nodeId, handle, label = 'Add step', tone = 'primary' }) {
  const ui = useWorkflowUI();
  const cls = tone === 'yes' ? 'border-success text-success-700 bg-success-50' : tone === 'no' ? 'border-danger text-danger-700 bg-danger-50' : 'border-primary text-primary bg-white';
  return (
    <Dropdown width={210} trigger={
      <button type="button" className={`nodrag nopan h-6 px-2 rounded-full border text-[11px] font-semibold inline-flex items-center gap-1 shadow-sm hover:brightness-95 ${cls}`} aria-label={label}>
        <Plus size={12} strokeWidth={2.6} />{label}
      </button>
    }>
      {(close) => (
        <>
          <MenuLabel>Add a condition</MenuLabel>
          <MenuItem close={close} onClick={() => ui.addStep(nodeId, 'condition', null, handle)}>If / else condition</MenuItem>
          <MenuLabel>Add an action</MenuLabel>
          {ACTIONS.filter((a) => a !== 'Change Deal Stage' || ui.module === 'Deals').map((a) => (
            <MenuItem key={a} close={close} onClick={() => ui.addStep(nodeId, 'action', a, handle)}>{a}</MenuItem>
          ))}
        </>
      )}
    </Dropdown>
  );
}

/** Shared node shell */
export default function WorkflowNode({ id, kind, icon: Icon, title, summary, selected, children, footer, deletable = true }) {
  const ui = useWorkflowUI();
  const st = KIND_STYLE[kind];
  const result = ui.testResult?.[id];
  return (
    <div className={`w-[240px] bg-white rounded-xl border shadow-card transition-shadow ${selected ? 'border-primary ring-2 ring-primary/20' : 'border-line'} ${result === 'failed' ? 'opacity-70' : ''}`}>
      <div className="h-1.5 rounded-t-xl" style={{ background: st.bar }} />
      <div className="px-3 pt-2.5 pb-3">
        <div className="flex items-center gap-2">
          <span className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: st.soft, color: st.bar }}><Icon size={17} /></span>
          <div className="min-w-0 flex-1">
            <div className="text-[10.5px] font-semibold" style={{ color: st.bar }}>{st.label}</div>
            <div className="text-[13px] font-semibold text-ink truncate">{title}</div>
          </div>
          {deletable && (
            <button type="button" onClick={(e) => { e.stopPropagation(); ui.removeNode(id); }} className="nodrag p-1 rounded text-ink-400 hover:text-danger hover:bg-danger-50" aria-label="Remove step"><Trash2 size={14} /></button>
          )}
        </div>
        {summary && <p className="text-[12px] text-ink-500 mt-2 leading-snug line-clamp-3">{summary}</p>}
        {children}
        {result && (
          <div className={`mt-2 text-[11px] font-semibold inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${result === 'failed' ? 'bg-danger-50 text-danger-700' : 'bg-success-50 text-success-700'}`}>
            Test: {result}
          </div>
        )}
      </div>
      {footer}
    </div>
  );
}
