import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileCheck, Clock, CheckCircle2, XCircle, Users, Search, ChevronDown,
  Eye, Check, X, Building, ArrowRight, MessageSquare, Send, Sparkles
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { fmtINR } from '../../utils/calculations';

function Sparkline({ color = '#2F7BF5', heights = [20, 35, 45, 30, 60, 80, 95] }) {
  return (
    <div className="flex items-end gap-1 h-8">
      {heights.map((h, i) => (
        <span
          key={i}
          className="w-1.5 rounded-t"
          style={{
            height: `${h}%`,
            backgroundColor: color,
            opacity: 0.25 + (i / heights.length) * 0.75
          }}
        />
      ))}
    </div>
  );
}

const SEED_APPROVALS = [
  {
    id: 'app-1',
    dealId: 'DL-024',
    dealName: 'Mobile App Build',
    account: 'Globex Pvt Ltd',
    requestedBy: 'Priya Sharma',
    requesterRole: 'Senior Executive',
    discount: '15%',
    amount: 875000,
    expectedRevenue: 743750,
    approver: 'Arun Kumar',
    requestedOn: '08 Oct 2026',
    status: 'Pending',
    comment: 'This discount is requested to close the deal as the client has a competing offer. Approval kindly requested.'
  },
  {
    id: 'app-2',
    dealId: 'DL-031',
    dealName: 'Cloud Migration',
    account: 'Tech Innovators',
    requestedBy: 'Ravi Kumar',
    requesterRole: 'Account Executive',
    discount: '10%',
    amount: 1500000,
    expectedRevenue: 1350000,
    approver: 'Sneha R',
    requestedOn: '07 Oct 2026',
    status: 'Pending',
    comment: 'Strategic enterprise client committing to 3-year contract.'
  },
  {
    id: 'app-3',
    dealId: 'DL-028',
    dealName: 'ERP Implementation',
    account: 'Zylker Inc',
    requestedBy: 'Anitha M',
    requesterRole: 'Consultant',
    discount: '20%',
    amount: 1200000,
    expectedRevenue: 960000,
    approver: 'Vikram P',
    requestedOn: '06 Oct 2026',
    status: 'Pending',
    comment: 'Volume discount requested for enterprise expansion.'
  },
  {
    id: 'app-4',
    dealId: 'DL-029',
    dealName: 'IT Infrastructure',
    account: 'Bright Solutions',
    requestedBy: 'Arun Kumar',
    requesterRole: 'Deal Strategist',
    discount: '12%',
    amount: 1100000,
    expectedRevenue: 968000,
    approver: 'Priya Sharma',
    requestedOn: '05 Oct 2026',
    status: 'Pending',
    comment: 'Custom pricing bundle for server infrastructure upgrade.'
  },
  {
    id: 'app-5',
    dealId: 'DL-033',
    dealName: 'Security Upgrade',
    account: 'Cloud Services',
    requestedBy: 'Divya R',
    requesterRole: 'Solutions Rep',
    discount: '18%',
    amount: 1050000,
    expectedRevenue: 861000,
    approver: 'Ravi Kumar',
    requestedOn: '04 Oct 2026',
    status: 'Pending',
    comment: 'Security compliance suite discounted for government contractor.'
  },
  {
    id: 'app-6',
    dealId: 'DL-035',
    dealName: 'Website Maintenance',
    account: 'Digital Hub',
    requestedBy: 'Karthik S',
    requesterRole: 'Sales Lead',
    discount: '15%',
    amount: 680000,
    expectedRevenue: 578000,
    approver: 'Anitha M',
    requestedOn: '03 Oct 2026',
    status: 'Pending',
    comment: 'Annual maintenance agreement early bird incentive.'
  },
  {
    id: 'app-7',
    dealId: 'DL-037',
    dealName: 'CRM Customization',
    account: 'NextGen Pvt Ltd',
    requestedBy: 'Sneha R',
    requesterRole: 'Customer Success',
    discount: '10%',
    amount: 525000,
    expectedRevenue: 472500,
    approver: 'Arun Kumar',
    requestedOn: '02 Oct 2026',
    status: 'Pending',
    comment: 'API integration customization package.'
  }
];

export default function DealApprovals() {
  const crm = useCRM();
  const { notify } = crm;

  const [activeTab, setActiveTab] = useState('Pending');
  const [approvalsList, setApprovalsList] = useState(SEED_APPROVALS);
  const [selectedApproval, setSelectedApproval] = useState(SEED_APPROVALS[0]);
  const [search, setSearch] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('All Owners');
  const [approverFilter, setApproverFilter] = useState('All Approvers');
  const [commentText, setCommentText] = useState('');

  const pendingCount = approvalsList.filter((a) => a.status === 'Pending').length;
  const approvedCount = 18;
  const rejectedCount = 6;
  const totalCount = pendingCount + approvedCount + rejectedCount;

  const filtered = useMemo(() => {
    return approvalsList.filter((item) => {
      if (activeTab !== 'All' && item.status !== activeTab) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !item.dealName.toLowerCase().includes(q) &&
          !item.account.toLowerCase().includes(q) &&
          !item.dealId.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [approvalsList, activeTab, search]);

  const handleApprove = (id) => {
    setApprovalsList((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'Approved' } : a))
    );
    if (selectedApproval?.id === id) {
      setSelectedApproval({ ...selectedApproval, status: 'Approved' });
    }
    notify(`Deal approval request ${id} approved successfully!`, 'success');
  };

  const handleReject = (id) => {
    setApprovalsList((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'Rejected' } : a))
    );
    if (selectedApproval?.id === id) {
      setSelectedApproval({ ...selectedApproval, status: 'Rejected' });
    }
    notify(`Deal approval request ${id} rejected.`, 'info');
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    notify('Comment added to approval audit log', 'info');
    setCommentText('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shadow-inner">
          <FileCheck size={26} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Deal Approvals</h1>
          <p className="text-xs text-slate-500">
            Review and manage deal discount and contract approval requests.
          </p>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={20} />
            </div>
            <p className="text-xs font-medium text-slate-500 pt-1">Pending Approvals</p>
            <div className="text-2xl font-bold text-slate-900">{pendingCount}</div>
            <div className="text-xs font-semibold text-emerald-600">↑ 17%</div>
          </div>
          <Sparkline color="#F59E0B" heights={[25, 40, 50, 35, 70, 85, 95]} />
        </div>

        {/* Approved */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
            <p className="text-xs font-medium text-slate-500 pt-1">Approved</p>
            <div className="text-2xl font-bold text-slate-900">{approvedCount}</div>
            <div className="text-xs font-semibold text-emerald-600">↑ 28%</div>
          </div>
          <Sparkline color="#10B981" heights={[30, 45, 40, 60, 50, 75, 90]} />
        </div>

        {/* Rejected */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle size={20} />
            </div>
            <p className="text-xs font-medium text-slate-500 pt-1">Rejected</p>
            <div className="text-2xl font-bold text-slate-900">{rejectedCount}</div>
            <div className="text-xs font-semibold text-rose-600">↓ 14%</div>
          </div>
          <Sparkline color="#F43F5E" heights={[40, 60, 55, 75, 65, 80, 95]} />
        </div>

        {/* Total */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users size={20} />
            </div>
            <p className="text-xs font-medium text-slate-500 pt-1">Total Requests</p>
            <div className="text-2xl font-bold text-slate-900">{totalCount}</div>
            <div className="text-xs font-semibold text-emerald-600">↑ 12%</div>
          </div>
          <Sparkline color="#8B5CF6" heights={[30, 40, 50, 60, 75, 85, 100]} />
        </div>
      </div>

      {/* Main Approval Grid & Drawer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Table Section (8 cols) */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          {/* Tabs */}
          <div className="flex items-center gap-4 border-b border-slate-100 pb-2">
            {[
              { key: 'Pending', label: `Pending (${pendingCount})` },
              { key: 'Approved', label: `Approved (${approvedCount})` },
              { key: 'Rejected', label: `Rejected (${rejectedCount})` }
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`text-xs font-bold pb-2 transition ${
                  activeTab === tab.key
                    ? 'text-[#2F7BF5] border-b-2 border-[#2F7BF5]'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full sm:max-w-xs">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search deal name, account, or deal ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#2F7BF5]"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={ownerFilter}
                onChange={(e) => setOwnerFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
              >
                <option value="All Owners">All Owners</option>
                <option value="Priya Sharma">Priya Sharma</option>
                <option value="Arun Kumar">Arun Kumar</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-medium">
                  <th className="py-2.5 px-2">#</th>
                  <th className="py-2.5 px-2">Deal ID</th>
                  <th className="py-2.5 px-2">Deal Name</th>
                  <th className="py-2.5 px-2">Requested By</th>
                  <th className="py-2.5 px-2">Discount %</th>
                  <th className="py-2.5 px-2">Amount (₹)</th>
                  <th className="py-2.5 px-2">Approver</th>
                  <th className="py-2.5 px-2">Status</th>
                  <th className="py-2.5 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item, idx) => {
                  const isSelected = selectedApproval?.id === item.id;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedApproval(item)}
                      className={`hover:bg-slate-50/80 transition cursor-pointer ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <td className="py-3 px-2 text-slate-400 font-medium">{idx + 1}</td>
                      <td className="py-3 px-2 font-semibold text-slate-700">{item.dealId}</td>
                      <td className="py-3 px-2">
                        <span className="font-bold text-[#2F7BF5] block">{item.dealName}</span>
                        <span className="text-[11px] text-slate-500">{item.account}</span>
                      </td>
                      <td className="py-3 px-2 text-slate-700 whitespace-nowrap">{item.requestedBy}</td>
                      <td className="py-3 px-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          {item.discount}
                        </span>
                      </td>
                      <td className="py-3 px-2 font-semibold text-slate-900 whitespace-nowrap">
                        {fmtINR(item.amount)}
                      </td>
                      <td className="py-3 px-2 text-slate-700 whitespace-nowrap">{item.approver}</td>
                      <td className="py-3 px-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.status === 'Approved'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : item.status === 'Rejected'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5">
                          {item.status === 'Pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApprove(item.id)}
                                className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReject(item.id)}
                                className="px-2.5 py-1 text-[11px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedApproval(item)}
                            className="p-1 text-slate-400 hover:text-[#2F7BF5] rounded"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Workflow Drawer (4 cols) */}
        {selectedApproval && (
          <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Approval Request</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                {selectedApproval.status}
              </span>
            </div>

            {/* Deal Title Card */}
            <div className="flex items-center gap-3 p-3 bg-purple-50/50 rounded-xl border border-purple-100">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Building size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">{selectedApproval.dealName}</h4>
                <p className="text-[11px] text-slate-500">
                  {selectedApproval.dealId} • {selectedApproval.account}
                </p>
              </div>
            </div>

            {/* Financial Overview */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Amount</span>
                <span className="font-bold text-slate-900">{fmtINR(selectedApproval.amount)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Discount</span>
                <span className="font-bold text-amber-600">{selectedApproval.discount}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Expected Revenue</span>
                <span className="font-bold text-emerald-600">{fmtINR(selectedApproval.expectedRevenue)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Requested On</span>
                <span className="font-medium text-slate-800">{selectedApproval.requestedOn}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Requested By</span>
                <span className="font-medium text-slate-800">{selectedApproval.requestedBy}</span>
              </div>
            </div>

            {/* Approval Flow Visual Steps */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-900">Approval Flow</h4>
              <div className="space-y-3 pl-2 text-xs">
                {/* Step 1 */}
                <div className="flex items-start gap-3 relative">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold z-10">
                    <Check size={11} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-800">Requester</span>
                      <span className="text-[10px] font-bold text-emerald-600">Approved</span>
                    </div>
                    <span className="text-[11px] text-slate-500 block">{selectedApproval.requestedBy}</span>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3 relative">
                  <div className="w-5 h-5 rounded-full bg-[#2F7BF5] text-white flex items-center justify-center text-[10px] font-bold z-10">
                    2
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-800">Manager Approval</span>
                      <span className="text-[10px] font-bold text-amber-600">{selectedApproval.status}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 block">{selectedApproval.approver}</span>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3 relative">
                  <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold z-10">
                    3
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-800">Finance Approval</span>
                      <span className="text-[10px] text-slate-400">Pending</span>
                    </div>
                    <span className="text-[11px] text-slate-500 block">Finance Team</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments Log */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-900">Comments</h4>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
                <span className="font-semibold text-slate-900 block">{selectedApproval.requestedBy}</span>
                <p className="text-slate-600">{selectedApproval.comment}</p>
              </div>

              {/* Add Comment */}
              <form onSubmit={handleAddComment} className="space-y-2 pt-2">
                <textarea
                  rows={2}
                  placeholder="Enter your comments here..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#2F7BF5]"
                />
                <button
                  type="submit"
                  className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
                >
                  Post Comment
                </button>
              </form>
            </div>

            {/* Approve / Reject Bottom Action Buttons */}
            {selectedApproval.status === 'Pending' && (
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleApprove(selectedApproval.id)}
                  className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition"
                >
                  <Check size={14} />
                  <span>Approve</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleReject(selectedApproval.id)}
                  className="py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition"
                >
                  <X size={14} />
                  <span>Reject</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
