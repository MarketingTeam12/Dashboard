import React from 'react';
import {
  FileText, Building2, Calendar, IndianRupee, Wallet, BadgeCheck
} from 'lucide-react';
import StatusBadge, { badgeTone } from '../../components/common/StatusBadge';
import Dropdown, { MenuItem, MenuLabel } from '../../components/common/Dropdown';
import { fmtINR, fmtDate, pct, balanceOf, todayISO } from '../../utils/calculations';

export default function FinanceTileView({
  rows = [],
  accountName,
  onView,
  onEdit,
  onDelete,
  onRecordPayment,
  onStatusChange,
  INVOICE_STATUSES = ['Paid', 'Pending', 'Overdue', 'Partially Paid'],
  STATUS_COLORS = {},
}) {
  if (!rows.length) {
    return (
      <div className="p-12 text-center">
        <p className="text-[14px] text-ink-500">No invoices match the selected criteria.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      {rows.map((inv) => {
        const bal = balanceOf(inv);
        const isOverdue = bal > 0 && inv.dueDate < todayISO();
        const paidPercent = pct(inv.paidAmount, inv.amount);

        return (
          <div
            key={inv.id}
            className="card p-4 hover:shadow-md transition-all hover:border-primary/40 flex flex-col justify-between group bg-white border border-line rounded-xl"
          >
            <div>
              {/* Top row: Invoice Number & Status */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => onView(inv.id)}
                  className="text-[14.5px] font-semibold text-primary group-hover:underline text-left line-clamp-1"
                  title={inv.number}
                >
                  {inv.number}
                </button>
                <Dropdown
                  width={180}
                  align="right"
                  trigger={
                    <button
                      type="button"
                      title="Update status"
                      className={`shrink-0 inline-flex items-center justify-center px-2 py-0.5 rounded text-[11.5px] font-medium whitespace-nowrap ${badgeTone('invoiceStatus', inv.status)}`}
                    >
                      {inv.status}
                    </button>
                  }
                >
                  {(close) => (
                    <>
                      <MenuLabel>Update payment status</MenuLabel>
                      {INVOICE_STATUSES.map((s) => (
                        <MenuItem
                          key={s}
                          close={close}
                          active={s === inv.status}
                          onClick={() => s !== inv.status && onStatusChange(inv, s)}
                        >
                          <span className="inline-flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ background: STATUS_COLORS[s] || '#94A3B8' }}
                            />
                            {s}
                          </span>
                        </MenuItem>
                      ))}
                    </>
                  )}
                </Dropdown>
              </div>

              {/* Account and Type */}
              <div className="text-[12.5px] text-ink-500 mb-3 space-y-1">
                <div className="flex items-center gap-1.5 truncate">
                  <Building2 size={13} className="text-ink-400 shrink-0" />
                  <span className="font-medium text-ink-700 truncate">
                    {accountName(inv.accountId) || 'No Account'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <StatusBadge kind="invoiceType" value={inv.type} size="sm" />
                </div>
              </div>

              {/* Amount and Paid Progress */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-[18px] font-bold text-ink">
                    {fmtINR(inv.amount)}
                  </span>
                  <span className="text-[12px] font-semibold text-ink-500">
                    {paidPercent}% paid
                  </span>
                </div>

                <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${paidPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11.5px] text-ink-500 pt-0.5">
                  <span>Paid: <strong className="text-emerald-700">{fmtINR(inv.paidAmount)}</strong></span>
                  <span>Bal: <strong className={bal > 0 ? 'text-amber-700' : 'text-ink-600'}>{fmtINR(bal)}</strong></span>
                </div>
              </div>

              {/* Due Date info */}
              <div className="flex items-center justify-between text-[12px] text-ink-500 mt-2.5">
                <span className="inline-flex items-center gap-1">
                  <Calendar size={13} className="text-ink-400" />
                  Due {fmtDate(inv.dueDate)}
                </span>
                {isOverdue && (
                  <span className="text-[11px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                    Overdue
                  </span>
                )}
              </div>
            </div>

            {/* Bottom actions */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-line">
              {bal > 0 ? (
                <button
                  type="button"
                  onClick={() => onRecordPayment(inv.id)}
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary hover:underline"
                >
                  <Wallet size={13} />
                  Record Payment
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 text-[12px] font-medium text-emerald-600">
                  <BadgeCheck size={14} />
                  Fully Paid
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

