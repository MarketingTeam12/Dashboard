import React, { useMemo, useState } from 'react';
import {
  Calendar, Clock3, Building2, ArrowDownUp,
  Wallet, AlertCircle
} from 'lucide-react';
import StatusBadge, { badgeTone } from '../../components/common/StatusBadge';
import { fmtINR, fmtDate, pct, balanceOf, todayISO } from '../../utils/calculations';

export default function FinanceTimelineView({
  rows = [],
  accountName,
  onView,
  onEdit,
  onDelete,
  onRecordPayment,
}) {
  const [dateField, setDateField] = useState('dueDate'); // 'dueDate' | 'invoiceDate'
  const [sortOrder, setSortOrder] = useState('asc'); // chronological

  const sortedInvoices = useMemo(() => {
    return [...rows].sort((a, b) => {
      const da = a[dateField] || '';
      const db = b[dateField] || '';
      return sortOrder === 'asc' ? da.localeCompare(db) : db.localeCompare(da);
    });
  }, [rows, dateField, sortOrder]);

  const timelineGroups = useMemo(() => {
    const groups = {};
    sortedInvoices.forEach((inv) => {
      const dt = inv[dateField] || 'Unscheduled';
      let groupKey = 'Unscheduled';
      if (dt !== 'Unscheduled' && dt.length >= 7) {
        const parts = dt.split('-');
        if (parts.length >= 2) {
          const year = parts[0];
          const monthIndex = parseInt(parts[1], 10) - 1;
          const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ];
          groupKey = `${months[monthIndex] || parts[1]} ${year}`;
        }
      }
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(inv);
    });
    return groups;
  }, [sortedInvoices, dateField]);

  const totalValue = useMemo(() => {
    return rows.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  }, [rows]);

  const totalBalance = useMemo(() => {
    return rows.reduce((sum, i) => sum + balanceOf(i), 0);
  }, [rows]);

  if (!rows.length) {
    return (
      <div className="p-12 text-center">
        <Clock3 size={36} className="mx-auto text-ink-300 mb-2" />
        <p className="text-[14px] text-ink-500 font-medium">No invoices match the timeline criteria.</p>
        <p className="text-[12.5px] text-ink-400 mt-1">Try adjusting your filters or date range.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-slate-50/50 min-h-[500px]">
      {/* Controls & Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-3.5 bg-white border border-line rounded-xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary-50 text-primary flex items-center justify-center">
            <Clock3 size={19} />
          </div>
          <div>
            <div className="text-[14px] font-semibold text-ink">
              Timeline · {rows.length} Invoices
            </div>
            <div className="text-[12px] text-ink-500">
              Total: <span className="font-semibold text-ink">{fmtINR(totalValue)}</span>
              {' · '}
              Outstanding: <span className="font-semibold text-amber-700">{fmtINR(totalBalance)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-line bg-page p-0.5 text-[12px] font-medium">
            <button
              type="button"
              onClick={() => setDateField('dueDate')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                dateField === 'dueDate' ? 'bg-white text-primary shadow-xs font-semibold' : 'text-ink-600 hover:text-ink'
              }`}
            >
              Due Date
            </button>
            <button
              type="button"
              onClick={() => setDateField('invoiceDate')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                dateField === 'invoiceDate' ? 'bg-white text-primary shadow-xs font-semibold' : 'text-ink-600 hover:text-ink'
              }`}
            >
              Invoice Date
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            className="h-8 px-2.5 rounded-lg border border-line bg-white hover:bg-page text-[12.5px] font-medium text-ink-600 flex items-center gap-1.5 shadow-xs"
            title="Toggle sort order"
          >
            <ArrowDownUp size={13} />
            <span>{sortOrder === 'asc' ? 'Earliest First' : 'Latest First'}</span>
          </button>
        </div>
      </div>

      {/* Timeline groups */}
      <div className="space-y-8">
        {Object.entries(timelineGroups).map(([monthYear, groupInvoices]) => {
          const groupTotal = groupInvoices.reduce((s, i) => s + (Number(i.amount) || 0), 0);

          return (
            <div key={monthYear} className="relative">
              <div className="sticky top-2 z-10 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-white text-[12px] font-semibold shadow mb-4">
                <Calendar size={13} />
                <span>{monthYear}</span>
                <span className="text-slate-300 font-normal">
                  ({groupInvoices.length} invoices · {fmtINR(groupTotal)})
                </span>
              </div>

              <div className="relative pl-6 sm:pl-8 border-l-2 border-line/80 space-y-3.5 ml-3">
                {groupInvoices.map((inv) => {
                  const bal = balanceOf(inv);
                  const isOverdue = bal > 0 && inv.dueDate < todayISO();

                  return (
                    <div key={inv.id} className="relative group">
                      <div className="absolute -left-[31px] sm:-left-[39px] top-4 w-3.5 h-3.5 rounded-full border-2 border-white bg-primary shadow-xs ring-2 ring-primary/20" />

                      <div className="card p-3.5 bg-white border border-line rounded-xl hover:shadow-sm hover:border-primary/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onView(inv.id)}
                              className="text-[14px] font-semibold text-primary hover:underline text-left truncate"
                            >
                              {inv.number}
                            </button>
                            <StatusBadge kind="invoiceStatus" value={inv.status} size="sm" />
                            <StatusBadge kind="invoiceType" value={inv.type} size="sm" />
                            {isOverdue && (
                              <span className="text-[11px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                                Overdue
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-ink-500">
                            <div className="flex items-center gap-1 font-medium text-ink-700">
                              <Building2 size={13} className="text-ink-400" />
                              <span>{accountName(inv.accountId) || 'No Account'}</span>
                            </div>
                            <div>
                              <span>Inv Date: <strong>{fmtDate(inv.invoiceDate)}</strong></span>
                              {' · '}
                              <span>Due Date: <strong>{fmtDate(inv.dueDate)}</strong></span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-[12px] pt-1">
                            <span className="font-bold text-ink text-[13.5px]">{fmtINR(inv.amount)}</span>
                            <span className="text-emerald-700">Paid: {fmtINR(inv.paidAmount)}</span>
                            <span className={bal > 0 ? 'text-amber-700 font-semibold' : 'text-ink-500'}>
                              Balance: {fmtINR(bal)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-line justify-between sm:justify-end">
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
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

