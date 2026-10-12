import { createContext, useContext } from 'react';
import { Activity, ArrowRightLeft, Bell, ClipboardCheck, MessageSquare, PenLine, ToggleRight, UserCheck } from 'lucide-react';

export const WorkflowUI = createContext(null);
export const useWorkflowUI = () => useContext(WorkflowUI);

export const KIND_STYLE = {
  trigger: { bar: '#1262E0', soft: '#E8F1FF', label: 'Trigger' },
  condition: { bar: '#F59E0B', soft: '#FFF4D6', label: 'Condition' },
  action: { bar: '#12B76A', soft: '#DFF6EA', label: 'Action' },
};

export const ACTION_ICONS = {
  'Update Field': PenLine,
  'Change Deal Stage': ArrowRightLeft,
  'Assign Record Owner': UserCheck,
  'Create Follow-up Task': ClipboardCheck,
  'Send Follow-up Message': MessageSquare,
  'Add Notification': Bell,
  'Update Record Status': ToggleRight,
  'Create Activity Log': Activity,
};

