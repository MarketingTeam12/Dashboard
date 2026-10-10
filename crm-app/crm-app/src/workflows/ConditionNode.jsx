import { Handle, Position } from '@xyflow/react';
import { GitBranch } from 'lucide-react';
import WorkflowNode, { AddStepMenu, useWorkflowUI } from './WorkflowNode';
import { fieldDef } from './workflowEngine';

export default function ConditionNode({ id, data, selected }) {
  const ui = useWorkflowUI();
  const rules = (data.rules || []).filter((r) => r.field);
  const fmtVal = (r) => (fieldDef(ui.module, r.field)?.type === 'owner' ? ui.users.find((u) => u.id === r.value)?.name || r.value : r.value);
  return (
    <>
      <Handle type="target" position={Position.Top} style={{ background: '#F59E0B' }} />
      <WorkflowNode id={id} kind="condition" icon={GitBranch} title={rules.length ? `${rules.length} rule${rules.length > 1 ? 's' : ''} · ${data.logic}` : 'Set up condition'} selected={selected}>
        <ul className="mt-2 space-y-1">
          {rules.slice(0, 3).map((r, i) => (
            <li key={i} className="text-[11.5px] text-ink-600 bg-[#FFF8E6] rounded px-2 py-1 truncate">
              {i > 0 && <b className="text-warning-700 mr-1">{data.logic}</b>}{fieldDef(ui.module, r.field)?.label || r.field} <span className="text-ink-400">{r.operator.toLowerCase()}</span> <b>{fmtVal(r)}</b>
            </li>
          ))}
          {!rules.length && <li className="text-[11.5px] text-ink-400">No rules yet — select this step to add them.</li>}
        </ul>
      </WorkflowNode>
      <Handle id="yes" type="source" position={Position.Bottom} style={{ left: '28%', background: '#12B76A' }} />
      <Handle id="no" type="source" position={Position.Bottom} style={{ left: '72%', background: '#F04438' }} />
      <div className="absolute -bottom-9 left-[28%] -translate-x-1/2"><AddStepMenu nodeId={id} handle="yes" label="Yes" tone="yes" /></div>
      <div className="absolute -bottom-9 left-[72%] -translate-x-1/2"><AddStepMenu nodeId={id} handle="no" label="No" tone="no" /></div>
    </>
  );
}
