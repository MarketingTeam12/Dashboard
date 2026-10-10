import { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import { CURRENT_USER_ID } from '../Leads/leadFilters';

const STATUS_TONE = {
  Completed: 'bg-[#E3F8EF] text-[#058A5C]', 'In Progress': 'bg-[#EAF2FF] text-[#1262E0]', Pending: 'bg-[#FFF5DF] text-[#B87500]',
  'Not Started': 'bg-[#EEF1F7] text-[#4B5578]', Scheduled: 'bg-[#F2EAFE] text-[#8B3DF0]', Overdue: 'bg-[#FFE8EA] text-[#D61F30]',
};

/** My Jobs = tasks assigned to the logged-in user (CURRENT_USER_ID) */
export default function MyJobs() {
  const { tasks = [], updateTask, userName } = useCRM();
  const [scope, setScope] = useState('mine');
  const rows = tasks.filter((t) => scope === 'all' || t.ownerId === CURRENT_USER_ID);

  return (
    <div className="bg-white border border-[#E3E8F2] rounded">
      <div className="flex items-center justify-between px-4 h-12 border-b border-[#E3E8F2]">
        <h1 className="text-[15px] font-semibold text-[#1F2A44]">My Jobs</h1>
        <select value={scope} onChange={(e) => setScope(e.target.value)} className="h-7 border border-[#D5DBE8] rounded text-[12px] px-2 bg-white">
          <option value="mine">Assigned to me</option>
          <option value="all">All jobs</option>
        </select>
      </div>
      <table className="w-full text-[12.5px]">
        <thead><tr className="text-left text-[#1F2A44]">
          {['Subject', 'Related To', 'Due Date', 'Priority', 'Owner', 'Status'].map((h) => <th key={h} className="px-4 h-9 font-medium border-b border-[#E3E8F2]">{h}</th>)}
        </tr></thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id} className="border-b border-[#EEF1F7] hover:bg-[#F6F8FD]">
              <td className="px-4 py-2 font-medium text-[#1F2A44]">{t.subject}</td>
              <td className="px-4 py-2 text-[#4B5578]">{t.relatedTo}</td>
              <td className="px-4 py-2 text-[#4B5578]">{t.dueDate}</td>
              <td className="px-4 py-2 text-[#4B5578]">{t.priority}</td>
              <td className="px-4 py-2 text-[#4B5578]">{userName(t.ownerId)}</td>
              <td className="px-4 py-2">
                <select value={t.status} onChange={(e) => updateTask(t.id, { status: e.target.value })} className={`h-6 rounded-full px-2 text-[11px] font-semibold border-0 ${STATUS_TONE[t.status] || ''}`}>
                  {Object.keys(STATUS_TONE).map((s) => <option key={s}>{s}</option>)}
                </select>
              </td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={6} className="text-center py-14 text-[#8B95AE]">No records found</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
