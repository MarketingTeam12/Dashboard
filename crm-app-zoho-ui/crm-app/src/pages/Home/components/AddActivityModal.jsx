import { useMemo } from 'react';
import FormModal from '../../../components/common/RecordForm';
import { CALL_TYPES, TASK_PRIORITIES, TASK_STATUSES } from '../../../data/seedData';
import { todayISO } from '../../../utils/calculations';

const nowLocal = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

/** "Add Activity" for a lead row: creates a Task or a Call linked to the lead. */
export default function AddActivityModal({ lead, users, onClose, onCreateTask, onCreateCall }) {
  const initial = useMemo(() => (lead ? {
    activityType: 'Task', subject: `Follow up with ${lead.name}`, dueDate: todayISO(), priority: 'High', status: 'Not Started',
    dateTime: nowLocal(), callType: 'Outbound', callStatus: 'Scheduled', ownerId: lead.ownerId || 'u1', description: '',
  } : null), [lead]);

  const isTask = (v) => v.activityType === 'Task';
  const fields = [
    { name: 'activityType', label: 'Activity Type', type: 'select', options: ['Task', 'Call'], required: true, span: 2 },
    { name: 'subject', label: 'Subject', required: true, span: 2, validate: (v) => (String(v).trim().length > 120 ? 'Use 120 characters or fewer.' : '') },
    { name: 'dueDate', label: 'Due Date', type: 'date', required: true, hidden: (v) => !isTask(v) },
    { name: 'priority', label: 'Priority', type: 'select', options: TASK_PRIORITIES, required: true, hidden: (v) => !isTask(v) },
    { name: 'status', label: 'Status', type: 'select', options: TASK_STATUSES.filter((s) => s !== 'Completed'), required: true, hidden: (v) => !isTask(v) },
    { name: 'dateTime', label: 'Call Start Time', type: 'datetime-local', required: true, hidden: isTask },
    { name: 'callType', label: 'Call Type', type: 'select', options: CALL_TYPES, required: true, hidden: isTask },
    { name: 'callStatus', label: 'Call Status', type: 'select', options: ['Scheduled', 'Completed'], required: true, hidden: isTask },
    { name: 'ownerId', label: 'Owner', type: 'select', options: users.map((u) => ({ value: u.id, label: u.name })), required: true },
    { name: 'description', label: 'Description', type: 'textarea', span: 2 },
  ];

  const submit = (v) => {
    if (v.activityType === 'Task') {
      onCreateTask({
        subject: v.subject.trim(), title: v.subject.trim(), dueDate: v.dueDate, priority: v.priority, status: v.status,
        relatedTo: `Lead - ${lead.name}`, contactName: lead.name, ownerId: v.ownerId, description: v.description, leadId: lead.id,
      });
    } else {
      onCreateCall({
        subject: v.subject.trim(), contactId: '', accountId: '', type: v.callType, dateTime: v.dateTime, duration: 0,
        status: v.callStatus, ownerId: v.ownerId, notes: [`Lead: ${lead.name}`, v.description].filter(Boolean).join(' — '), leadId: lead.id,
      });
    }
  };

  return (
    <FormModal open={!!lead} onClose={onClose} title="Add Activity" subtitle={lead ? `For lead ${lead.name}` : ''}
      fields={fields} initial={initial} onSubmit={submit} submitLabel="Save" size="md" />
  );
}
