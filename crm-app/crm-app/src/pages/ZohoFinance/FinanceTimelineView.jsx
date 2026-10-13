import React, { useMemo, useState } from 'react';
import {
  Calendar, Clock3, Building2, ArrowDownUp,
  Wallet, AlertCircle, Filter, ChevronUp, ChevronDown, Zap, RefreshCw
} from 'lucide-react';
import StatusBadge, { badgeTone } from '../../components/common/StatusBadge';
import { fmtINR, fmtDate, pct, balanceOf, todayISO } from '../../utils/calculations';
import { useCRM } from '../../context/CRMContext';
import { TimelineHistoryFilterBar } from '../../components/common/TimelineHistoryView';

export default function FinanceTimelineView({
  rows = [],
  accountName,
  onView,
  onEdit,
  onDelete,
  onRecordPayment,
}) {
  const { users } = useCRM();
  const [dateField, setDateField] = useState('dueDate'); // 'dueDate' | 'invoiceDate'
  const [sortOrder, setSortOrder] = useState('asc'); // chronological

  // Timeline History 4-Dropdown Filter States
  const [filterModule, setFilterModule] = useState('All Modules');
  const [filterUser, setFilterUser] = useState('All Users');
  const [filterTime, setFilterTime] = useState('Any Time');
  const [filterSource, setFilterSource] = useState('All Sources');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const [appliedFilters, setAppliedFilters] = useState({
    module: 'All Modules',
    user: 'All Users',
    time: 'Any Time',
    source: 'All Sources',
    startDate: '',
    endDate: ''
  });

  const [filterBarOpen, setFilterBarOpen] = useState(true);
  const [upcomingActionsOpen, setUpcomingActionsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleApplyFilter = () => {
    setIsLoading(true);
    setTimeout(() => {
      setAppliedFilters({
        module: filterModule,
        user: filterUser,
        time: filterTime,
        source: filterSource,
        startDate: customStartDate,
        endDate: customEndDate
      });
      setIsLoading(false);
    }, 200);
  };

  const handleClearFilters = () => {
    setFilterModule('All Modules');
    setFilterUser('All Users');
    setFilterTime('Any Time');
    setFilterSource('All Sources');
    setCustomStartDate('');
    setCustomEndDate('');
    setAppliedFilters({
      module: 'All Modules',
      user: 'All Users',
      time: 'Any Time',
      source: 'All Sources',
      startDate: '',
      endDate: ''
    });
  };

  const isFilterActive =
    appliedFilters.module !== 'All Modules' ||
    appliedFilters.user !== 'All Users' ||
    appliedFilters.time !== 'Any Time' ||
    appliedFilters.source !== 'All Sources' ||
    Boolean(appliedFilters.startDate || appliedFilters.endDate);

  // Apply filters to invoices rows
  const filteredInvoices = useMemo(() => {
    return rows.filter((inv) => {
      // 1. Module filter
      if (
        appliedFilters.module !== 'All Modules' &&
        appliedFilters.module !== 'Zoho Finance' &&
        appliedFilters.module !== 'Invoices'
      ) {
        return false;
      }
      // 2. User filter
      if (appliedFilters.user !== 'All Users') {
        const owner = inv.owner || inv.createdBy || 'Accounts Team';
        if (!owner.toLowerCase().includes(appliedFilters.user.toLowerCase())) {
          return false;
        }
      }
      // 3. Source filter
      if (appliedFilters.source !== 'All Sources') {
        if (appliedFilters.source === 'Workflow Rule' && inv.source !== 'Workflow Rule') return false;
      }
      // 4. Time filter
      if (appliedFilters.time !== 'Any Time') {
        const dtStr = inv[dateField] || inv.invoiceDate || '';
        const evTime = dtStr ? new Date(dtStr).getTime() : 0;
        const now = new Date('2026-10-12T23:59:59').getTime();
        const oneDay = 24 * 60 * 60 * 1000;

        if (appliedFilters.time === 'Today') {
          if (now - evTime > oneDay) return false;
        } else if (appliedFilters.time === 'Yesterday') {
          if (now - evTime < oneDay || now - evTime > 2 * oneDay) return false;
        } else if (appliedFilters.time === 'Last 7 Days') {
          if (now - evTime > 7 * oneDay) return false;
        } else if (appliedFilters.time === 'Last 30 Days') {
          if (now - evTime > 30 * oneDay) return false;
        } else if (appliedFilters.time === 'This Month') {
          if (now - evTime > 31 * oneDay) return false;
        } else if (appliedFilters.time === 'Custom Date Range...') {
          if (appliedFilters.startDate) {
            const start = new Date(appliedFilters.startDate).getTime();
            if (evTime < start) return false;
          }
          if (appliedFilters.endDate) {
            const end = new Date(appliedFilters.endDate + 'T23:59:59').getTime();
            if (evTime > end) return false;
          }
        }
      }
      return true;
    });
  }, [rows, appliedFilters, dateField]);

  const sortedInvoices = useMemo(() => {
    return [...filteredInvoices].sort((a, b) => {
      const da = a[dateField] || '';
      const db = b[dateField] || '';
      return sortOrder === 'asc' ? da.localeCompare(db) : db.localeCompare(da);
    });
  }, [filteredInvoices, dateField, sortOrder]);

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
    return filteredInvoices.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  }, [filteredInvoices]);

  const totalBalance = useMemo(() => {
    return filteredInvoices.reduce((sum, i) => sum + balanceOf(i), 0);
  }, [filteredInvoices]);

  // Upcoming scheduled finance actions
  const upcomingFinanceActions = [
    {
      id: 'ufa-1',
      title: 'Workflow: Send Payment Reminder for Overdue Invoices',
      triggerTime: '15/10/2026 09:00 AM',
      rule: 'Invoice_Aging_Auto_Reminder',
      type: 'Email Alert',
      recipient: 'Billing Department'
    }
  ];

  return (
    <div className="p-4 sm:p-6 bg-slate-50/50 min-h-[500px]">
      {/* 1. History Tab Header matching Screenshot */}
      <div className="border-b border-line mb-5">
        <button
          type="button"
          className="pb-2.5 px-1 text-[14px] font-bold text-primary border-b-2 border-primary transition-all flex items-center gap-1.5"
        >
          <span>History</span>
        </button>
      </div>

      {/* 2. Timeline History Title & Funnel Filter Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-[16px] font-bold text-ink">Timeline History</h2>
          <button
            type="button"
            onClick={() => setFilterBarOpen(prev => !prev)}
            className={`p-1.5 rounded-md border transition-all cursor-pointer ${
              filterBarOpen || isFilterActive
                ? 'border-primary/40 bg-primary/10 text-primary shadow-2xs'
                : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-600'
            }`}
            title="Toggle Timeline Filter"
          >
            <Filter size={15} />
          </button>
        </div>

        {/* Show Upcoming Automated Actions Toggle */}
        <button
          type="button"
          onClick={() => setUpcomingActionsOpen(prev => !prev)}
          className="text-[13px] text-primary hover:text-primary-dark font-medium flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>Show Upcoming Automated Actions</span>
          {upcomingActionsOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {/* Upcoming Automated Actions Drawer */}
      {upcomingActionsOpen && (
        <div className="mb-6 p-4 bg-white border border-slate-200 rounded-xl shadow-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={15} className="text-amber-500" />
            <h3 className="text-[13.5px] font-bold text-ink">Scheduled & Upcoming Automated Actions</h3>
          </div>
          <div className="space-y-2">
            {upcomingFinanceActions.map(ua => (
              <div key={ua.id} className="p-3 bg-slate-50 border border-line rounded-lg flex items-center justify-between text-[12.5px]">
                <div>
                  <div className="font-semibold text-ink">{ua.title}</div>
                  <div className="text-slate-500 text-[11.5px] mt-0.5">
                    Rule: <span className="text-primary font-medium">{ua.rule}</span> · Type: {ua.type} · Assignee: {ua.recipient}
                  </div>
                </div>
                <div className="text-right text-[11.5px] font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded border border-amber-200 shrink-0">
                  {ua.triggerTime}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Filter Card matching Screenshot (Modules, Users, Time, Sources + Apply Filter) */}
      {filterBarOpen && (
        <TimelineHistoryFilterBar
          users={users}
          filterModule={filterModule}
          setFilterModule={setFilterModule}
          filterUser={filterUser}
          setFilterUser={setFilterUser}
          filterTime={filterTime}
          setFilterTime={setFilterTime}
          filterSource={filterSource}
          setFilterSource={setFilterSource}
          customStartDate={customStartDate}
          setCustomStartDate={setCustomStartDate}
          customEndDate={customEndDate}
          setCustomEndDate={setCustomEndDate}
          onApply={handleApplyFilter}
          onClear={handleClearFilters}
          isFilterActive={isFilterActive}
        />
      )}

      {/* Controls & Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-3.5 bg-white border border-line rounded-xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary-50 text-primary flex items-center justify-center">
            <Clock3 size={19} />
          </div>
          <div>
            <div className="text-[14px] font-semibold text-ink">
              Timeline · {filteredInvoices.length} Invoices
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
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                dateField === 'dueDate' ? 'bg-white text-primary shadow-xs font-semibold' : 'text-ink-600 hover:text-ink'
              }`}
            >
              Due Date
            </button>
            <button
              type="button"
              onClick={() => setDateField('invoiceDate')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                dateField === 'invoiceDate' ? 'bg-white text-primary shadow-xs font-semibold' : 'text-ink-600 hover:text-ink'
              }`}
            >
              Invoice Date
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            className="h-8 px-2.5 rounded-lg border border-line bg-white hover:bg-page text-[12.5px] font-medium text-ink-600 flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Toggle sort order"
          >
            <ArrowDownUp size={13} />
            <span>{sortOrder === 'asc' ? 'Earliest First' : 'Latest First'}</span>
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400 flex items-center justify-center gap-2 text-[13px]">
          <RefreshCw size={16} className="animate-spin text-primary" />
          <span>Filtering invoice timeline records...</span>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="p-12 text-center bg-white border border-dashed border-slate-200 rounded-xl">
          <Clock3 size={36} className="mx-auto text-ink-300 mb-2" />
          <p className="text-[14px] text-ink-500 font-medium">No invoices match the timeline history filters.</p>
          <p className="text-[12.5px] text-ink-400 mt-1">Try adjusting your filters or resetting to default.</p>
          {isFilterActive && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="mt-3 btn-secondary h-8 px-3 text-[12px] font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        /* Timeline groups */
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
                    const paid = inv.paidAmount || 0;
                    const paidPct = inv.amount > 0 ? pct(paid, inv.amount) : 0;

                    return (
                      <div key={inv.id} className="relative group">
                        <div className="absolute -left-[31px] sm:-left-[39px] top-4 w-3.5 h-3.5 rounded-full border-2 border-white bg-primary shadow-xs ring-2 ring-primary/20" />

                        <div className="card p-3.5 bg-white border border-line rounded-xl hover:shadow-sm hover:border-primary/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => onView(inv.id)}
                                className="text-[14px] font-semibold text-ink hover:text-primary transition-colors text-left truncate cursor-pointer font-mono"
                              >
                                {inv.number}
                              </button>
                              <StatusBadge kind="invoiceStatus" value={inv.status} size="sm" />
                              <span className="text-[11.5px] px-2 py-0.5 rounded bg-slate-100 text-ink-600 font-medium">
                                {inv.type || 'Sales Invoice'}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-ink-500">
                              <div className="flex items-center gap-1 font-medium text-ink-700">
                                <Building2 size={13} className="text-ink-400" />
                                <span>{accountName(inv.accountId) || 'Unknown Account'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock3 size={13} className="text-ink-400" />
                                <span>
                                  {dateField === 'dueDate' ? 'Due: ' : 'Issued: '}
                                  {fmtDate(inv[dateField])}
                                </span>
                              </div>
                              <div className="font-semibold text-ink">
                                Total: {fmtINR(inv.amount)}
                              </div>
                              {bal > 0 && (
                                <div className="text-amber-700 font-medium">
                                  Balance: {fmtINR(bal)}
                                </div>
                              )}
                            </div>

                            {/* Paid progress bar */}
                            <div className="w-full max-w-xs flex items-center gap-2 pt-0.5">
                              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    paidPct >= 100
                                      ? 'bg-success'
                                      : paidPct > 0
                                      ? 'bg-primary'
                                      : 'bg-slate-200'
                                  }`}
                                  style={{ width: `${Math.min(100, paidPct)}%` }}
                                />
                              </div>
                              <span className="text-[10.5px] text-ink-400 font-medium shrink-0">
                                {paidPct}% paid
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-line justify-between sm:justify-end">
                            <div className="text-right">
                              <div className="text-[14px] font-bold text-ink">{fmtINR(inv.amount)}</div>
                              <div className="text-[11.5px] text-ink-400">
                                {bal === 0 ? 'Fully Paid' : `Bal: ${fmtINR(bal)}`}
                              </div>
                            </div>
                            {bal > 0 && onRecordPayment && (
                              <button
                                type="button"
                                onClick={() => onRecordPayment(inv)}
                                className="btn-secondary h-7 px-2 text-[11.5px] font-medium text-primary hover:bg-primary-50 ml-2 cursor-pointer"
                              >
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
      )}
    </div>
  );
}
