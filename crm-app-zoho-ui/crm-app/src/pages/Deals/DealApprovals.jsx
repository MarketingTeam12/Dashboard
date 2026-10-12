import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FileCheck, Clock, CheckCircle2, XCircle, Users, Search,
  Eye, Check, X, Building, ExternalLink, ArrowLeft, ShieldAlert
} from 'lucide-react';
import { useCRM } from '../../context/crmContextInstance';
import { fmtINR } from '../../utils/calculations';
import { useUrlActions } from '../../components/common/hooks';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { loadCustomization } from '../Leads/zohoCustomizationConfig';
import { APPROVAL_STORAGE_KEY, buildApprovalsList } from './dealApprovalUtils';

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

const APPROVAL_UI_STATE_KEY = 'zcrm.dealApprovals.uiState.v2';

export default function DealApprovals() {
  const crm = useCRM();
  const { deals = [], users = [], accountName, userName, updateRecord, notify } = crm;
  const navigate = useNavigate();
  const location = useLocation();

  // Restore preserved UI state when navigating back from Deal Details
  const initialUi = useMemo(() => {
    try {
      const raw = sessionStorage.getItem(APPROVAL_UI_STATE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return {
      activeTab: 'All',
      search: '',
      ownerFilter: 'All Owners',
      approverFilter: 'All Approvers',
      selectedId: 'app-1',
    };
  }, []);

  const [activeTab, setActiveTab] = useState(initialUi.activeTab || 'All');
  const [search, setSearch] = useState(initialUi.search || '');
  const [ownerFilter, setOwnerFilter] = useState(initialUi.ownerFilter || 'All Owners');
  const [approverFilter, setApproverFilter] = useState(initialUi.approverFilter || 'All Approvers');
  const [selectedId, setSelectedId] = useState(initialUi.selectedId || 'app-1');
  const [commentText, setCommentText] = useState('');
  const [confirmAction, setConfirmAction] = useState(null); // { id, type: 'Approve' | 'Reject', item }
  const [delegateModal, setDelegateModal] = useState(null); // { item, targetApprover }

  // Build approvals linked to real existing Deal records in CRMContext (never creating duplicate deals)
  const [approvalsOverrides, setApprovalsOverrides] = useState(() => {
    try {
      const saved = localStorage.getItem(APPROVAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(APPROVAL_STORAGE_KEY, JSON.stringify(approvalsOverrides));
    } catch {
      // ignore
    }
  }, [approvalsOverrides]);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        APPROVAL_UI_STATE_KEY,
        JSON.stringify({ activeTab, search, ownerFilter, approverFilter, selectedId })
      );
    } catch {
      // ignore
    }
  }, [activeTab, search, ownerFilter, approverFilter, selectedId]);

  // Link each approval item to an actual existing Deal record in `deals`
  const approvalsList = useMemo(
    () => buildApprovalsList(deals, accountName, userName, approvalsOverrides),
    [deals, accountName, userName, approvalsOverrides]
  );

  const selectedApproval = useMemo(
    () => approvalsList.find((a) => a.id === selectedId) || approvalsList[0] || null,
    [approvalsList, selectedId]
  );

  useUrlActions({
    onOpen: (id) => {
      const found = approvalsList.find((a) => a.id === id || a.dealId === id || a.dealCode === id);
      if (found) setSelectedId(found.id);
    },
  });

  const pendingCount = approvalsList.filter((a) => a.status === 'Pending').length;
  const approvedCount = approvalsList.filter((a) => a.status === 'Approved').length;
  const rejectedCount = approvalsList.filter((a) => a.status === 'Rejected').length;
  const totalCount = approvalsList.length;

  const allRequesters = useMemo(
    () => Array.from(new Set(approvalsList.map((a) => a.requestedBy))),
    [approvalsList]
  );
  const allApprovers = useMemo(
    () => Array.from(new Set(approvalsList.map((a) => a.approver))),
    [approvalsList]
  );

  const filtered = useMemo(() => {
    return approvalsList.filter((item) => {
      if (activeTab !== 'All' && item.status !== activeTab) return false;
      if (ownerFilter !== 'All Owners' && item.requestedBy !== ownerFilter) return false;
      if (approverFilter !== 'All Approvers' && item.approver !== approverFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (
          !item.dealName.toLowerCase().includes(q) &&
          !item.account.toLowerCase().includes(q) &&
          !item.dealCode.toLowerCase().includes(q) &&
          !item.dealId.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [approvalsList, activeTab, ownerFilter, approverFilter, search]);

  // Navigate to the exact linked Deal Details page while preserving Deal Approvals state
  const openLinkedDealDetails = (item, e) => {
    if (e) e.stopPropagation();
    setSelectedId(item.id);
    try {
      sessionStorage.setItem(
        APPROVAL_UI_STATE_KEY,
        JSON.stringify({ activeTab, search, ownerFilter, approverFilter, selectedId: item.id })
      );
    } catch {
      // ignore
    }
    navigate(`/deals/${item.dealId}`, {
      state: {
        from: '/deal-approvals',
        fromLabel: 'Back to Deal Approvals',
        approvalId: item.id,
      },
    });
  };

  // Request confirmation before Approving or Rejecting
  const requestDecision = (item, decisionType) => {
    const cust = loadCustomization();
    const activeRole = cust.activeRole || 'Administrator';
    const perms = cust.rolePermissions?.[activeRole] || {};
    if (activeRole === 'Sales Executive' && perms.canApproveDeals === false) {
      notify(`Permission denied: Role "${activeRole}" is not authorized to approve or reject deals.`, 'error');
      return;
    }
    setConfirmAction({ id: item.id, type: decisionType, item });
  };

  const handleDelegateConfirm = (e) => {
    e.preventDefault();
    if (!delegateModal) return;
    const { item, targetApprover } = delegateModal;
    setApprovalsOverrides((prev) => ({
      ...prev,
      [item.id]: {
        ...(prev[item.id] || {}),
        approver: targetApprover,
      },
    }));
    updateRecord('deals', item.dealId, {
      approverName: targetApprover,
    });
    notify(`Approval for "${item.dealName}" delegated to ${targetApprover}`, 'info');
    setDelegateModal(null);
  };

  // Confirmed Approval / Rejection updates both Approval state AND the linked Deal record in CRMContext
  const executeConfirmedDecision = () => {
    if (!confirmAction) return;
    const { item, type } = confirmAction;
    const newStatus = type === 'Approve' ? 'Approved' : 'Rejected';
    const timestamp = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    // 1. Update local approval state
    setApprovalsOverrides((prev) => ({
      ...prev,
      [item.id]: {
        ...(prev[item.id] || {}),
        status: newStatus,
        decidedOn: timestamp,
      },
    }));

    // 2. Update the exact linked Deal record in CRMContext without creating duplicate deals
    updateRecord('deals', item.dealId, {
      approvalStatus: newStatus,
      approvalDiscount: item.discount,
      expectedRevenue: item.expectedRevenue,
      approverName: item.approver,
      approvalDecidedOn: timestamp,
    });

    notify(
      `Deal "${item.dealName}" (${item.dealCode}) marked as ${newStatus}. Deal record updated.`,
      newStatus === 'Approved' ? 'success' : 'info'
    );
    setConfirmAction(null);
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedApproval) return;
    const nextComment = {
      by: 'Sibi Chakaravarthi (Approver)',
      text: commentText.trim(),
      time: 'Just now',
    };
    setApprovalsOverrides((prev) => {
      const cur = prev[selectedApproval.id] || {};
      return {
        ...prev,
        [selectedApproval.id]: {
          ...cur,
          commentsList: [...(selectedApproval.commentsList || []), nextComment],
        },
      };
    });
    notify('Comment added to approval audit log', 'info');
    setCommentText('');
  };

  return (
    <div className="space-y-5">
      {location.state?.from && (
        <div>
          <button
            type="button"
            onClick={() => navigate(location.state.from)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-[#2563EB] font-semibold text-xs hover:bg-blue-100 transition"
          >
            <ArrowLeft size={14} /> {location.state.fromLabel || 'Back'}
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold">
            <FileCheck size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Deal Approvals</h1>
            <p className="text-xs text-slate-500">
              Click any Deal Name or Approved Request to open the linked Deal Details page.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/deals')}
          className="px-3.5 py-1.5 text-xs font-semibold text-[#2563EB] bg-blue-50 hover:bg-blue-100 rounded-lg transition"
        >
          View All Deals ({deals.length})
        </button>
      </div>

      {/* 4 Stat Cards (Clickable to filter tabs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('Pending')}
          className={`bg-white p-4 rounded-xl border shadow-xs flex items-center justify-between cursor-pointer transition ${
            activeTab === 'Pending' ? 'border-amber-400 ring-2 ring-amber-100' : 'border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="space-y-1">
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={18} />
            </div>
            <p className="text-xs font-medium text-slate-500 pt-1">Pending Approvals</p>
            <div className="text-2xl font-bold text-slate-900">{pendingCount}</div>
          </div>
          <Sparkline color="#F59E0B" heights={[25, 40, 50, 35, 70, 85, 95]} />
        </div>

        <div
          onClick={() => setActiveTab('Approved')}
          className={`bg-white p-4 rounded-xl border shadow-xs flex items-center justify-between cursor-pointer transition ${
            activeTab === 'Approved' ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="space-y-1">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
            <p className="text-xs font-medium text-slate-500 pt-1">Approved</p>
            <div className="text-2xl font-bold text-slate-900">{approvedCount}</div>
          </div>
          <Sparkline color="#10B981" heights={[30, 45, 40, 60, 50, 75, 90]} />
        </div>

        <div
          onClick={() => setActiveTab('Rejected')}
          className={`bg-white p-4 rounded-xl border shadow-xs flex items-center justify-between cursor-pointer transition ${
            activeTab === 'Rejected' ? 'border-rose-400 ring-2 ring-rose-100' : 'border-slate-200 hover:border-rose-300'
          }`}
        >
          <div className="space-y-1">
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle size={18} />
            </div>
            <p className="text-xs font-medium text-slate-500 pt-1">Rejected</p>
            <div className="text-2xl font-bold text-slate-900">{rejectedCount}</div>
          </div>
          <Sparkline color="#F43F5E" heights={[40, 60, 55, 75, 65, 80, 95]} />
        </div>

        <div
          onClick={() => setActiveTab('All')}
          className={`bg-white p-4 rounded-xl border shadow-xs flex items-center justify-between cursor-pointer transition ${
            activeTab === 'All' ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200 hover:border-blue-300'
          }`}
        >
          <div className="space-y-1">
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users size={18} />
            </div>
            <p className="text-xs font-medium text-slate-500 pt-1">Total Requests</p>
            <div className="text-2xl font-bold text-slate-900">{totalCount}</div>
          </div>
          <Sparkline color="#8B5CF6" heights={[30, 40, 50, 60, 75, 85, 100]} />
        </div>
      </div>

      {/* Main Approval Grid & Drawer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Table Section (8 cols) */}
        <div className="lg:col-span-8 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          {/* Tabs */}
          <div className="flex items-center gap-5 border-b border-slate-100 pb-2">
            {[
              { key: 'All', label: `All Requests (${totalCount})` },
              { key: 'Pending', label: `Pending (${pendingCount})` },
              { key: 'Approved', label: `Approved (${approvedCount})` },
              { key: 'Rejected', label: `Rejected (${rejectedCount})` },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`text-xs font-bold pb-2 transition ${
                  activeTab === tab.key
                    ? 'text-[#2563EB] border-b-2 border-[#2563EB]'
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
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={ownerFilter}
                onChange={(e) => setOwnerFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700"
              >
                <option value="All Owners">All Requesters</option>
                {allRequesters.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>

              <select
                value={approverFilter}
                onChange={(e) => setApproverFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700"
              >
                <option value="All Approvers">All Approvers</option>
                {allApprovers.map((ap) => (
                  <option key={ap} value={ap}>{ap}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold">
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
                      onClick={() => setSelectedId(item.id)}
                      className={`hover:bg-slate-50/80 transition cursor-pointer ${
                        isSelected ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <td className="py-3 px-2 text-slate-400 font-medium">{idx + 1}</td>
                      <td className="py-3 px-2 font-semibold text-slate-700">
                        <button
                          type="button"
                          onClick={(e) => openLinkedDealDetails(item, e)}
                          className="hover:text-[#2563EB] hover:underline"
                          title="Open Deal Details"
                        >
                          {item.dealCode}
                        </button>
                      </td>
                      <td className="py-3 px-2">
                        <button
                          type="button"
                          onClick={(e) => openLinkedDealDetails(item, e)}
                          className="font-bold text-[#2563EB] hover:underline flex items-center gap-1 text-left"
                          title="Click to open Deal Details page"
                        >
                          <span>{item.dealName}</span>
                          <ExternalLink size={11} className="shrink-0 opacity-75" />
                        </button>
                        <span className="text-[11px] text-slate-500 block">{item.account}</span>
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
                          className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${
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
                                onClick={() => requestDecision(item, 'Approve')}
                                className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDelegateModal({
                                    item,
                                    targetApprover: users.find((u) => u.name !== item.approver)?.name || 'Sibi Chakaravarthi',
                                  })
                                }
                                className="px-2.5 py-1 text-[11px] font-semibold bg-blue-50 hover:bg-blue-100 text-[#2563EB] border border-blue-200 rounded-md transition"
                              >
                                Delegate
                              </button>
                              <button
                                type="button"
                                onClick={() => requestDecision(item, 'Reject')}
                                className="px-2.5 py-1 text-[11px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md transition"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={(e) => openLinkedDealDetails(item, e)}
                            className="p-1 text-slate-500 hover:text-[#2563EB] rounded"
                            title="Open Linked Deal Details"
                          >
                            <ExternalLink size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-400">
                      No approval requests match the current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Workflow Drawer (4 cols) */}
        {selectedApproval && (
          <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Approval Request Details</h3>
              <span
                className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                  selectedApproval.status === 'Approved'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : selectedApproval.status === 'Rejected'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {selectedApproval.status}
              </span>
            </div>

            {/* Clickable Deal Title Card -> Opens Linked Deal Details */}
            <div
              onClick={(e) => openLinkedDealDetails(selectedApproval, e)}
              className="flex items-center justify-between gap-3 p-3 bg-blue-50/50 hover:bg-blue-50 rounded-xl border border-blue-200 cursor-pointer transition group"
              title="Click to open Deal Details"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#2563EB] flex items-center justify-center font-bold shrink-0">
                  <Building size={18} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-[#2563EB] group-hover:underline truncate">
                    {selectedApproval.dealName}
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate">
                    {selectedApproval.dealCode} • {selectedApproval.account}
                  </p>
                </div>
              </div>
              <ExternalLink size={15} className="text-[#2563EB] shrink-0" />
            </div>

            {/* Financial Overview */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Deal Amount</span>
                <span className="font-bold text-slate-900">{fmtINR(selectedApproval.amount)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Requested Discount</span>
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

            <button
              type="button"
              onClick={(e) => openLinkedDealDetails(selectedApproval, e)}
              className="w-full py-2 px-3 bg-[#EFF6FF] hover:bg-blue-100 text-[#2563EB] border border-blue-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
              <span>Open Full Deal Details ({selectedApproval.dealCode})</span>
              <ExternalLink size={13} />
            </button>

            {/* Approval Flow Visual Steps */}
            <div className="space-y-2.5 pt-2">
              <h4 className="text-xs font-bold text-slate-900">Approval Flow</h4>
              <div className="space-y-2.5 pl-1 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">
                    <Check size={11} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-800">1. Requester Submitted</span>
                      <span className="text-[10px] font-bold text-emerald-600">Submitted</span>
                    </div>
                    <span className="text-[11px] text-slate-500 block">{selectedApproval.requestedBy}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-5 h-5 rounded-full text-white flex items-center justify-center text-[10px] font-bold ${
                      selectedApproval.status === 'Approved'
                        ? 'bg-emerald-500'
                        : selectedApproval.status === 'Rejected'
                        ? 'bg-rose-500'
                        : 'bg-[#2563EB]'
                    }`}
                  >
                    2
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-800">2. Manager Approval</span>
                      <span
                        className={`text-[10px] font-bold ${
                          selectedApproval.status === 'Approved'
                            ? 'text-emerald-600'
                            : selectedApproval.status === 'Rejected'
                            ? 'text-rose-600'
                            : 'text-amber-600'
                        }`}
                      >
                        {selectedApproval.status}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 block">{selectedApproval.approver}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments Log */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-900">Audit Comments</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {(selectedApproval.commentsList || []).map((c, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{c.by}</span>
                      <span className="text-[10px] text-slate-400">{c.time}</span>
                    </div>
                    <p className="text-slate-600">{c.text}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddComment} className="space-y-2 pt-1">
                <textarea
                  rows={2}
                  placeholder="Enter your approval notes..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#2563EB]"
                />
                <button
                  type="submit"
                  className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                >
                  Post Comment
                </button>
              </form>
            </div>

            {/* Approve / Delegate / Reject Action Buttons */}
            {selectedApproval.status === 'Pending' && (
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => requestDecision(selectedApproval, 'Approve')}
                  className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1 shadow-2xs transition"
                >
                  <Check size={13} />
                  <span>Approve</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDelegateModal({
                      item: selectedApproval,
                      targetApprover:
                        users.find((u) => u.name !== selectedApproval.approver)?.name || 'Sibi Chakaravarthi',
                    })
                  }
                  className="py-2 bg-blue-50 hover:bg-blue-100 text-[#2563EB] border border-blue-200 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition"
                >
                  <span>Delegate</span>
                </button>
                <button
                  type="button"
                  onClick={() => requestDecision(selectedApproval, 'Reject')}
                  className="py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition"
                >
                  <X size={13} />
                  <span>Reject</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delegate Modal */}
      {delegateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Delegate Approval Request</h3>
            <p className="text-xs text-slate-500 mb-4">
              Select a user to delegate approval for <strong>{delegateModal.item.dealName}</strong> ({delegateModal.item.dealCode}).
            </p>
            <form onSubmit={handleDelegateConfirm} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Delegate To</label>
                <select
                  value={delegateModal.targetApprover}
                  onChange={(e) => setDelegateModal({ ...delegateModal, targetApprover: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#2563EB]"
                >
                  {['Sibi Chakaravarthi', ...users.map((u) => u.name)].map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDelegateModal(null)}
                  className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-[#2563EB] text-white hover:bg-blue-700 rounded-xl"
                >
                  Confirm Delegate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog before updating Deal Approval Status */}
      <ConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={executeConfirmedDecision}
        title={confirmAction ? `${confirmAction.type} Deal Request?` : 'Confirm'}
        confirmLabel={confirmAction ? `Confirm ${confirmAction.type}` : 'Confirm'}
        message={
          confirmAction
            ? `Are you sure you want to ${confirmAction.type.toLowerCase()} the ${confirmAction.item.discount} discount request for Deal "${confirmAction.item.dealName}" (${confirmAction.item.dealCode})? This will immediately update the linked Deal record.`
            : ''
        }
      />
    </div>
  );
}
