import { Handle, Position } from '@xyflow/react';
import { Zap } from 'lucide-react';
import WorkflowNode, { AddStepMenu, useWorkflowUI } from './WorkflowNode';
import { fieldDef } from './workflowEngine';

export default function TriggerNode({ id, data, selected }) {
  const ui = useWorkflowUI();
  const field = data.field ? fieldDef(ui.module, data.field)?.label || data.field : '';
  const summary = [`When a ${ui.module} record`, data.triggerType === 'Field Value Changed' ? `changes ${field || '(choose a field)'}` : data.triggerType.replace('Record ', '').toLowerCase().replace('changed', 'changes'),
    data.toValue ? `to "${data.toValue}"` : ''].filter(Boolean).join(' ');
  return (
    <>
      <WorkflowNode id={id} kind="trigger" icon={Zap} title={data.triggerType} summary={summary} selected={selected} deletable={false} />
      <Handle type="source" position={Position.Bottom} style={{ background: '#1262E0' }} />
      <div className="absolute left-1/2 -translate-x-1/2 -bottom-9"><AddStepMenu nodeId={id} /></div>
    </>
  );
}
