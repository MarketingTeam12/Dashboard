import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useCRM } from '../../context/crmContextInstance';
import { useUrlActions } from '../../components/common/hooks';
import Modal from '../../components/common/Modal';
import { CURRENT_USER_ID } from '../Leads/leadFilters';

const STATUS_TONE = {
  Completed: 'bg-[#E3F8EF] text-[#058A5C]',
  'In Progress': 'bg-[#EAF2FF] text-[#1262E0]',
  Pending: 'bg-[#FFF5DF] text-[#B87500]',
  'Not Started': 'bg-[#EEF1F7] text-[#4B5578]',
  Scheduled: 'bg-[#F2EAFE] text-[#8B3DF0]',
  Overdue: 'bg-[#FFE8EA] text-[#D61F30]',
};

/** My Jobs = tasks assigned to the logged-in user (CURRENT_USER_ID) */
export default function MyJobs() {
  const { tasks = [], leads = [], deals = [], accounts = [], contacts = [], updateTask, userName } = useCRM();
  const navigate = useNavigate();
  const location = useLocation();
  const [scope, setScope] = useState('mine');
  const [selectedJob, setSelectedJob] = useState(null);

  useUrlActions({
    onOpen: (id) => {
      const found = tasks.find((t) => t.id === id) || tasks[0];
      if (found) setSelectedJob(found);
    },
  });

  const rows = tasks.filter((t) => scope === 'all' || t.ownerId === CURRENT_USER_ID || t.ownerId === 'u1');

  const openRelatedRecord = (t) => {
    const rel = String(t.relatedTo || '');
    if (t.relatedModule === 'leads' || /^lead\s*-/i.test(rel)) {
      const lead = leads.find((l) => l.id === t.relatedRecordId) || leads[0];
      if (lead) return navigate(`/leads/${lead.id}`, { state: { from: '/my-jobs' } });
    }
    if (t.relatedModule === 'deals' || /^deal\s*-/i.test(rel)) {
      const deal = deals.find((d) => d.id === t.relatedRecordId) || deals[0];
      return navigate(deal ? `/deals?open=${deal.id}` : '/deals', { state: { from: '/my-jobs' } });
    }
    if (t.relatedModule === 'accounts' || /^account\s*-/i.test(rel)) {
      const acc = accounts.find((a) => a.id === t.relatedRecordId) || accounts[0];
      return navigate(acc ? `/accounts?open=${acc.id}` : '/accounts', { state: { from: '/my-jobs' } });
    }
    if (t.relatedModule === 'contacts' || /^contact\s*-/i.test(rel)) {
      const con = contacts.find((c) => c.id === t.relatedRecordId) || contacts[0];
      return navigate(con ? `/contacts?open=${con.id}` : '/contacts', { state: { from: '/my-jobs' } });
    }
  };

  return (
    <div className="bg-white border border-[#E3E8F2] rounded">
      <div className="flex items-center justify-between px-4 h-12 border-b border-[#E3E8F2]">
        <div className="flex items-center gap-3">
          {location.state?.from && (
            <button
              type="button"
              onClick={() => navigate(location.state.from)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#EEF2FF] text-[#2F55D4] font-semibold text-[11.5px] hover:bg-[#E0E7FF]"
            >
              <ArrowLeft size={13} /> Back
            </button>
          )}
          <h1 className="text-[15px] font-semibold text-[#1F2A44]">My Jobs</h1>
        </div>
        <select value={scope} onChange={(e) => setScope(e.target.value)} className="h-7 border border-[#D5DBE8] rounded text-[12px] px-2 bg-white">
          <option value="mine">Assigned to me</option>
          <option value="all">All jobs</option>
        </select>
      </div>
      <table className="w-full text-[12.5px]">
        <thead>
          <tr className="text-left text-[#1F2A44]">
            {['Subject', 'Related To', 'Due Date', 'Priority', 'Owner', 'Status'].map((h) => (
              <th key={h} className="px-4 h-9 font-medium border-b border-[#E3E8F2]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id} className="border-b border-[#EEF1F7] hover:bg-[#F6F8FD] cursor-pointer" onClick={() => setSelectedJob(t)}>
              <td className="px-4 py-2 font-medium text-[#2F55D4] hover:underline">{t.subject}</td>
              <td className="px-4 py-2 text-[#4B5578]" onClick={(e) => { e.stopPropagation(); openRelatedRecord(t); }}>
                <span className="text-[#2F55D4] hover:underline inline-flex items-center gap-1">
                  {t.relatedTo} <ExternalLink size={11} />
                </span>
              </td>
              <td className="px-4 py-2 text-[#4B5578]">{t.dueDate}</td>
              <td className="px-4 py-2 text-[#4B5578]">{t.priority}</td>
              <td className="px-4 py-2 text-[#4B5578]">{userName(t.ownerId)}</td>
              <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                <select
                  value={t.status}
                  onChange={(e) => updateTask(t.id, { status: e.target.value })}
                  className={`h-6 rounded-full px-2 text-[11px] font-semibold border-0 ${STATUS_TONE[t.status] || ''}`}
                >
                  {Object.keys(STATUS_TONE).map((s) => <option key={s}>{s}</option>)}
                </select>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={6} className="text-center py-14 text-[#8B95AE]">No records found</td></tr>
          )}
        </tbody>
      </table>

      <Modal
        open={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        title={selectedJob?.subject || 'Job Details'}
        size="sm"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setSelectedJob(null)}>Close</button>
            {selectedJob && (
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  const j = selectedJob;
                  setSelectedJob(null);
                  openRelatedRecord(j);
                }}
              >
                Open Related Record
              </button>
            )}
          </>
        }
      >
        {selectedJob && (
          <div className="space-y-2 text-[12.5px]">
            <div><b>Job ID:</b> {selectedJob.id}</div>
            <div><b>Subject:</b> {selectedJob.subject}</div>
            <div><b>Related To:</b> {selectedJob.relatedTo}</div>
            <div><b>Contact:</b> {selectedJob.contactName || '—'}</div>
            <div><b>Due Date:</b> {selectedJob.dueDate}</div>
            <div><b>Priority:</b> {selectedJob.priority}</div>
            <div><b>Status:</b> {selectedJob.status}</div>
            {selectedJob.description && <div><b>Notes:</b> {selectedJob.description}</div>}
          </div>
        )}
      </Modal>
    </div>
  );
}
