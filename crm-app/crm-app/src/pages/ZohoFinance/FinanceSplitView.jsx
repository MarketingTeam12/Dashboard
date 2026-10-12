import React, { useState } from 'react';
import {
  ChevronDown, ChevronRight, Building2, Calendar,
  Wallet
} from 'lucide-react';
import StatusBadge, { badgeTone } from '../../components/common/StatusBadge';
import { fmtINR, fmtDate, balanceOf, todayISO } from '../../utils/calculations';

export default function FinanceSplitView({
  invoices = [],
  accountName,
  onView,
  onEdit,
  onDelete,
  onRecordPayment,
  INVOICE_STATUSES = ['Paid', 'Pending', 'Overdue', 'Partially Paid'],
  STATUS_COLORS = {},
}) {
  const [expandedStatuses, setExpandedStatuses] = useState(() => {
    try {
      const saved = localStorage.getItem('zoho_finance_split_expanded_statuses');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return ['Pending', 'Overdue', 'Partially Paid', 'Paid'];
  });

  const toggleStatus = (status) => {
    setExpandedStatuses((prev) => {
      const next = prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status];
      try {
        localStorage.setItem('zoho_finance_split_expanded_statuses', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const expandAll = () => {
    setExpandedStatuses([...INVOICE_STATUSES]);
    try {
      localStorage.setItem('zoho_finance_split_expanded_statuses', JSON.stringify(INVOICE_STATUSES));
    } catch (e) {}
  };

  const collapseAll = () => {
    setExpandedStatuses([]);
    try {
      localStorage.setItem('zoho_finance_split_expanded_statuses', JSON.stringify([]));
    } catch (e) {}
  };

  return (
    <div className="p-4 space-y-3 bg-slate-50/40 min-h-[500px]">
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-[13px] text-ink-500 font-medium">
          Split View by Status · {invoices.length} Total Invoices
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={expandAll}
            className="text-[12px] text-primary hover:underline font-medium"
          >
            Expand All
          </button>
          <span className="text-ink-300">·</span>
          <button
            type="button"
            onClick={collapseAll}
            className="text-[12px] text-ink-500 hover:text-ink-700 font-medium"
          >
            Collapse All
          </button>
        </div>
      </div>

      {INVOICE_STATUSES.map((status) => {
        const groupInvoices = invoices.filter((i) => i.status === status);
        const isExpanded = expandedStatuses.includes(status);
        const totalAmount = groupInvoices.reduce((s, i) => s + (Number(i.amount) || 0), 0);
        const totalBalance = groupInvoices.reduce((s, i) => s + balanceOf(i), 0);
        const statusColor = STATUS_COLORS[status] || '#94A3B8';

        return (
          <div
            key={status}
            className="border border-line rounded-xl bg-white overflow-hidden shadow-xs transition-shadow"
          >
            {/* Header row */}
            <div
              onClick={() => toggleStatus(status)}
              className="px-4 py-3 bg-white hover:bg-slate-50 cursor-pointer flex items-center justify-between border-b border-line/60 select-none"
            >
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  className="text-ink-400 hover:text-ink-700 transition-colors"
                >
                  {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: statusColor }}
                />
                <span className="text-[14px] font-semibold text-ink">{status}</span>
                <span className="text-[12px] px-2 py-0.5 rounded-full bg-slate-100 text-ink-600 font-medium">
                  {groupInvoices.length}
                </span>
              </div>

              <div className="flex items-center gap-4 text-[12px] text-ink-500 font-medium">
                <span>Total: <strong className="text-ink-700">{fmtINR(totalAmount)}</strong></span>
                {totalBalance > 0 && (
                  <span>Balance: <strong className="text-amber-700">{fmtINR(totalBalance)}</strong></span>
                )}
              </div>
            </div>

            {/* Expanded items */}
            {isExpanded && (
              <div className="divide-y divide-line/60">
                {groupInvoices.length === 0 ? (
                  <div className="px-6 py-4 text-[13px] text-ink-400 italic bg-slate-50/30">
                    No invoices currently in {status}.
                  </div>
                ) : (
                  groupInvoices.map((inv) => {
                    const bal = balanceOf(inv);
                    const isOverdue = bal > 0 && inv.dueDate < todayISO();

                    return (
                      <div
                        key={inv.id}
                        className="px-4 py-3 hover:bg-primary-50/20 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => onView(inv.id)}
                              className="text-[13.5px] font-semibold text-primary hover:underline text-left truncate"
                            >
                              {inv.number}
                            </button>
                            <StatusBadge kind="invoiceType" value={inv.type} size="sm" />
                            {isOverdue && (
                              <span className="text-[11px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                                Overdue
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[12px] text-ink-500">
                            <span className="flex items-center gap-1 text-ink-700 font-medium">
                              <Building2 size={12} className="text-ink-400" />
                              {accountName(inv.accountId) || 'No Account'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar size={12} className="text-ink-400" />
                              Due {fmtDate(inv.dueDate)}
                            </span>
                            <span className="font-semibold text-ink-800">
                              {fmtINR(inv.amount)}
                            </span>
                            <span className="text-emerald-700">
                              Paid: {fmtINR(inv.paidAmount)}
                            </span>
                            <span className={bal > 0 ? 'text-amber-700 font-semibold' : 'text-ink-500'}>
                              Bal: {fmtINR(bal)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 justify-between sm:justify-end pt-1 sm:pt-0">
                          {bal > 0 && (
                            <button
                              type="button"
                              onClick={() => onRecordPayment(inv.id)}
                              className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary hover:underline"
                            >
                              <Wallet size={13} />
                              Record Payment
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

