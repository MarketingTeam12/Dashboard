import { Handle, Position } from '@xyflow/react';
import { Activity } from 'lucide-react';
import WorkflowNode, { AddStepMenu } from './WorkflowNode';
import { ACTION_ICONS, useWorkflowUI } from './workflowUI';
import { describeAction } from './workflowEngine';

export default function ActionNode({ id, data, selected }) {
  const ui = useWorkflowUI();
  return (
    <>
      <Handle type="target" position={Position.Top} style={{ background: '#12B76A' }} />
      <WorkflowNode id={id} kind="action" icon={ACTION_ICONS[data.actionType] || Activity} title={data.actionType} summary={describeAction(data, ui.users)} selected={selected} />
      <Handle type="source" position={Position.Bottom} style={{ background: '#12B76A' }} />
      <div className="absolute left-1/2 -translate-x-1/2 -bottom-9"><AddStepMenu nodeId={id} label="Then" /></div>
    </>
  );
}
