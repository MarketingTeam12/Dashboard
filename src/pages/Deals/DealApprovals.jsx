import { useMemo, useState } from 'react';
import {
  FileCheck, Clock, CheckCircle2, XCircle, Users, Search,
  ChevronDown, Eye, Check, X, IndianRupee, Folder
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { fmtINR } from '../../utils/calculations';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import useTable from '../../components/common/useTable';
import StatusBadge from '../../components/common/StatusBadge';
import { Drawer, DetailGrid, SectionTitle } from '../../components/common/Modal';

const SEED_APPROVALS = [
  {
    id: 'app-1',
    dealId: 'DL-024',
    dealName: 'Mobile App Build',
    account: 'Globex Pvt Ltd',
    requestedBy: 'Priya Sharma',
    discount: '15%',
    amount: 875000,
    expectedRevenue: 743750,
    approver: 'Arun Kumar',
    requestedOn: '08 Oct 2026',
    status: 'Pending',
    comment: 'This discount is requested to close the deal as the client has a competing offer.',
  },
  {
    id: 'app-2',
    dealId: 'DL-031',
    dealName: 'Cloud Migration',
    account: 'Tech Innovators',
    requestedBy: 'Ravi Kumar',
    discount: '10%',
    amount: 1500000,
    expectedRevenue: 1350000,
    approver: 'Sneha R',
    requestedOn: '07 Oct 2026',
    status: 'Pending',
    comment: 'Strategic enterprise client committing to 3-year contract.',
  },
  {
    id: 'app-3',
    dealId: 'DL-028',
    dealName: 'ERP Implementation',
    account: 'Zylker Inc',
    requestedBy: 'Anitha M',
    discount: '20%',
    amount: 1200000,
    expectedRevenue: 960000,
    approver: 'Vikram P',
    requestedOn: '06 Oct 2026',
    status: 'Pending',
    comment: 'Volume discount requested for enterprise expansion.',
  },
  {
    id: 'app-4',
    dealId: 'DL-029',
    dealName: 'IT Infrastructure',
    account: 'Bright Solutions',
    requestedBy: 'Arun Kumar',
    discount: '12%',
    amount: 1100000,
    expectedRevenue: 968000,
    approver: 'Priya Sharma',
    requestedOn: '05 Oct 2026',
    status: 'Approved',
    comment: 'Custom pricing bundle for server infrastructure upgrade.',
  },
  {
    id: 'app-5',
    dealId: 'DL-033',
    dealName: 'Security Upgrade',
    account: 'Cloud Services',
    requestedBy: 'Divya R',
    discount: '18%',
    amount: 1050000,
    expectedRevenue: 861000,
    approver: 'Ravi Kumar',
    requestedOn: '04 Oct 2026',
    status: 'Pending',
    comment: 'Security compliance suite discounted for government contractor.',
  },
  {
    id: 'app-6',
    dealId: 'DL-035',
    dealName: 'Website Maintenance',
    account: 'Digital Hub',
    requestedBy: 'Karthik S',
    discount: '15%',
    amount: 680000,
    expectedRevenue: 578000,
    approver: 'Anitha M',
    requestedOn: '03 Oct 2026',
    status: 'Approved',
    comment: 'Annual maintenance agreement early bird incentive.',
  },
  {
    id: 'app-7',
    dealId: 'DL-037',
    dealName: 'CRM Customization',
    account: 'NextGen Pvt Ltd',
    requestedBy: 'Sneha R',
    discount: '10%',
    amount: 525000,
    expectedRevenue: 472500,
    approver: 'Arun Kumar',
    requestedOn: '02 Oct 2026',
    status: 'Rejected',
    comment: 'API integration customization package.',
  },
];

export default function DealApprovals() {
  const { notify } = useCRM();
  const [approvalsList, setApprovalsList] = useState(SEED_APPROVALS);
  const [statusFilter, setStatusFilter] = useState('All');
  const [approverFilter, setApproverFilter] = useState('All');
  const [filterSearch, setFilterSearch] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [viewingApproval, setViewingApproval] = useState(null);

  const counts = useMemo(() => {
    const pending = approvalsList.filter((a) => a.status === 'Pending').length;
    const approved = approvalsList.filter((a) => a.status === 'Approved').length;
    const rejected = approvalsList.filter((a) => a.status === 'Rejected').length;
    const totalValue = approvalsList.reduce((s, a) => s + (Number(a.amount) || 0), 0);
    return { total: approvalsList.length, pending, approved, rejected, totalValue };
  }, [approvalsList]);

  const filtered = useMemo(() => {
    return approvalsList.filter((item) => {
      if (statusFilter !== 'All' && item.status !== statusFilter) return false;
      if (approverFilter !== 'All' && item.approver !== approverFilter) return false;
      return true;
    });
  }, [approvalsList, statusFilter, approverFilter]);

  const table = useTable(filtered, {
    searchKeys: ['dealName', 'account', 'dealId', 'requestedBy', 'approver'],
    initialSort: { key: 'dealName', dir: 'asc' },
    pageSize: 10,
  });

  const handleDecision = (id, status) => {
    setApprovalsList((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    if (viewingApproval?.id === id) setViewingApproval((prev) => ({ ...prev, status }));
    notify(`Deal approval request marked as ${status}`, status === 'Approved' ? 'success' : 'info');
  };

  const columns = [
    {
      key: 'dealName',
      label: 'Deal / Account',
      render: (r) => (
        <div>
          <div className="font-semibold text-primary hover:underline text-[14px]">{r.dealName}</div>
          <div className="text-[12px] text-ink-400">
            {r.dealId} • {r.account}
          </div>
        </div>
      ),
    },
    {
      key: 'requestedBy',
      label: 'Requested By',
      render: (r) => <span className="text-[13.5px] font-medium text-ink">{r.requestedBy}</span>,
    },
    {
      key: 'discount',
      label: 'Discount %',
      render: (r) => (
        <span className="px-2.5 py-0.5 rounded-md text-[12.5px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          {r.discount}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'Deal Amount',
      align: 'right',
      render: (r) => <span className="text-[13.5px] font-semibold text-ink tabular-nums">{fmtINR(r.amount)}</span>,
    },
    {
      key: 'approver',
      label: 'Approver',
      render: (r) => <span className="text-[13.5px] text-ink-600">{r.approver}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {r.status === 'Pending' && (
            <>
              <button
                type="button"
                onClick={() => handleDecision(r.id, 'Approved')}
                className="px-2.5 py-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 text-[12px] font-semibold"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => handleDecision(r.id, 'Rejected')}
                className="px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-[12px] font-semibold"
              >
                Reject
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setViewingApproval(r)}
            className="p-1.5 rounded hover:bg-page text-ink-400 hover:text-primary"
          >
            <Eye size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        icon={FileCheck}
        title="Deal Approvals"
        subtitle="Review and approve deal discount and contract exception requests"
        search={table.search}
        onSearch={table.setSearch}
        searchPlaceholder="Search deal approvals by deal name, account, or requester…"
        onFilterToggle={() => setShowFilters((s) => !s)}
        filterActive={showFilters || statusFilter !== 'All' || approverFilter !== 'All'}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Total Requests" value={counts.total} delta={12.0} icon={Users} tone="blue" spark={[4, 5, 6, 6, 7, 7, counts.total]} />
        <StatCard label="Pending Approvals" value={counts.pending} delta={-5.2} icon={Clock} tone="orange" spark={[6, 5, 5, 4, 4, 4, counts.pending]} />
        <StatCard label="Approved Deals" value={counts.approved} delta={18.4} icon={CheckCircle2} tone="green" spark={[1, 2, 2, 3, 3, 4, counts.approved]} />
        <StatCard label="Rejected" value={counts.rejected} delta={-10.0} icon={XCircle} tone="red" spark={[2, 2, 1, 1, 1, 1, counts.rejected]} />
        <StatCard label="Approval Pipeline" value={fmtINR(counts.totalValue)} delta={14.6} icon={IndianRupee} tone="purple" spark={[30, 42, 48, 55, 62, 68, 72]} />
      </div>

      <div className="flex gap-4 items-start">
        {showFilters && (
          <aside className="w-[260px] shrink-0 bg-white border border-line rounded-xl p-4 shadow-card select-none">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-bold text-ink">Filter Approvals by</h3>
              {(statusFilter !== 'All' || approverFilter !== 'All') && (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('All');
                    setApproverFilter('All');
                  }}
                  className="text-[12px] text-primary font-semibold hover:underline"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="relative mb-4">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type="text"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                placeholder="Search filters"
                className="w-full h-9 pl-8 pr-3 bg-white border border-line rounded-lg text-[13px] placeholder:text-ink-400 focus:outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-1.5 text-[13px] font-bold text-ink mb-2">
                  <Folder size={14} className="text-ink-400" />
                  <span>Approval Status</span>
                </div>
                <div className="space-y-1.5 pl-1">
                  {['All', 'Pending', 'Approved', 'Rejected'].map((st) => (
                    <label
                      key={st}
                      className="flex items-center gap-2.5 py-1 px-1.5 rounded-md hover:bg-page cursor-pointer text-[13.5px] text-ink-600"
                    >
                      <input
                        type="checkbox"
                        checked={statusFilter === st}
                        onChange={() => setStatusFilter(st)}
                        className="rounded border-ink-300 text-primary focus:ring-primary"
                      />
                      <span className={statusFilter === st ? 'font-semibold text-primary' : ''}>{st}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        )}

        <div className="flex-1 min-w-0 card overflow-hidden">
          <DataTable
            columns={columns}
            rows={table.rows}
            sort={table.sort}
            onSort={table.toggleSort}
            selected={table.selected}
            onSelectAll={table.toggleAll}
            onSelectRow={table.toggleSelect}
            onRowClick={(r) => setViewingApproval(r)}
          />
          <Pagination
            page={table.page}
            totalPages={table.totalPages}
            total={table.total}
            pageSize={table.pageSize}
            onPageChange={table.setPage}
          />
        </div>
      </div>

      <Drawer
        open={!!viewingApproval}
        onClose={() => setViewingApproval(null)}
        title={viewingApproval?.dealName}
        subtitle={`${viewingApproval?.dealId} • ${viewingApproval?.account}`}
      >
        {viewingApproval && (
          <div className="space-y-5">
            <DetailGrid
              items={[
                { label: 'Deal Name', value: viewingApproval.dealName },
                { label: 'Account', value: viewingApproval.account },
                { label: 'Amount', value: fmtINR(viewingApproval.amount) },
                { label: 'Discount Requested', value: viewingApproval.discount },
                { label: 'Expected Revenue', value: fmtINR(viewingApproval.expectedRevenue) },
                { label: 'Requested By', value: viewingApproval.requestedBy },
                { label: 'Approver', value: viewingApproval.approver },
                { label: 'Status', value: <StatusBadge status={viewingApproval.status} /> },
              ]}
            />
            <div>
              <SectionTitle>Justification Note</SectionTitle>
              <p className="text-[13.5px] text-ink-600 bg-page p-3.5 rounded-lg border border-line">
                {viewingApproval.comment}
              </p>
            </div>
            {viewingApproval.status === 'Pending' && (
              <div className="flex items-center gap-2 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => handleDecision(viewingApproval.id, 'Approved')}
                  className="btn-primary"
                >
                  <Check size={14} /> Approve Request
                </button>
                <button
                  type="button"
                  onClick={() => handleDecision(viewingApproval.id, 'Rejected')}
                  className="btn-secondary text-rose-600"
                >
                  <X size={14} /> Reject
                </button>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
