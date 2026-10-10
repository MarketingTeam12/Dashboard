import { useCallback, useMemo } from 'react';
import { Background, Controls, MarkerType, MiniMap, ReactFlow, addEdge, applyEdgeChanges, applyNodeChanges } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import TriggerNode from './TriggerNode';
import ConditionNode from './ConditionNode';
import ActionNode from './ActionNode';

const nodeTypes = { trigger: TriggerNode, condition: ConditionNode, action: ActionNode };
export const edgeStyle = (e) => ({
  ...e,
  type: 'smoothstep',
  markerEnd: { type: MarkerType.ArrowClosed, color: '#9BB1D3' },
  label: e.sourceHandle === 'no' ? 'No' : e.sourceHandle === 'yes' ? 'Yes' : e.label,
  labelStyle: { fontSize: 11, fontWeight: 600, fill: e.sourceHandle === 'no' ? '#D61F30' : '#058A5C' },
  labelBgStyle: { fill: '#fff' },
  labelBgPadding: [4, 2],
});

export default function WorkflowCanvas({ nodes, edges, setNodes, setEdges, onSelect, onDirty }) {
  const onNodesChange = useCallback((changes) => {
    if (changes.some((c) => c.type === 'remove' || (c.type === 'position' && c.dragging === false))) onDirty?.();
    setNodes((nds) => applyNodeChanges(changes.filter((c) => !(c.type === 'remove' && nds.find((n) => n.id === c.id)?.type === 'trigger')), nds));
  }, [setNodes, onDirty]);
  const onEdgesChange = useCallback((changes) => {
    if (changes.some((c) => c.type === 'remove')) onDirty?.();
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, [setEdges, onDirty]);
  const onConnect = useCallback((conn) => {
    if (conn.source === conn.target) return;
    onDirty?.();
    setEdges((eds) => addEdge(edgeStyle({ ...conn, id: `e-${conn.source}-${conn.sourceHandle || 'out'}-${conn.target}` }), eds.filter((e) => !(e.source === conn.source && e.target === conn.target))));
  }, [setEdges, onDirty]);
  const styledEdges = useMemo(() => edges.map(edgeStyle), [edges]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={styledEdges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onSelectionChange={({ nodes: sel }) => onSelect(sel[0]?.id || null)}
      onPaneClick={() => onSelect(null)}
      fitView
      fitViewOptions={{ padding: 0.25, maxZoom: 1 }}
      minZoom={0.3}
      maxZoom={1.6}
      deleteKeyCode={['Delete', 'Backspace']}
      proOptions={{ hideAttribution: false }}
    >
      <Background color="#C9D6EA" gap={18} size={1.4} />
      <Controls position="bottom-left" showInteractive={false} />
      <MiniMap position="bottom-right" pannable zoomable nodeColor={(n) => (n.type === 'trigger' ? '#1262E0' : n.type === 'condition' ? '#F59E0B' : '#12B76A')} maskColor="rgba(243,246,251,0.7)" style={{ border: '1px solid #DFE8F5', borderRadius: 8 }} />
    </ReactFlow>
  );
}
