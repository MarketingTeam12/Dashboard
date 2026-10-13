import React, { useMemo, useState } from 'react';
import {
  Calendar, Clock3, Building2, User, ArrowDownUp,
  ChevronDown, CheckCircle2, AlertCircle, Sparkles, Filter
} from 'lucide-react';
import { UserAvatar } from '../../components/common/Avatar';
import StatusBadge, { badgeTone } from '../../components/common/StatusBadge';
import Dropdown, { MenuItem, MenuLabel } from '../../components/common/Dropdown';
import { fmtINR, fmtDate, STAGES, STAGE_COLORS } from '../../utils/calculations';

const BAR = {
  'Need Deal Estimation': '#A970F5',
  'Deal Estimation Ready': '#FF7B3A',
  'Deal Estimation sent to Client': '#2F7BF5',
  'Deal Estimation accepted- Invoice Need': '#8E3CF2',
  'Deal Invoice Ready': '#FFBB28',
  'Deal Closed (Won)': '#10B981',
  'Deal Job Seeking & Agency': '#F59E0B',
  'Pre-Deal Lost': '#7F1D1D',
  'Deal Closed (Lost)': '#EF4444',
};

export default function TimelineView({
  rows = [],
  accountName,
  contactName,
  userName,
  onView,
  onEdit,
  onChangeStage,
}) {
  const [dateField, setDateField] = useState('closingDate'); // 'closingDate' | 'createdOn'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' (chronological) | 'desc'

  // Chronologically sort deals
  const sortedDeals = useMemo(() => {
    return [...rows].sort((a, b) => {
      const da = a[dateField] || '';
      const db = b[dateField] || '';
      if (!da) return 1;
      if (!db) return -1;
      return sortOrder === 'asc' ? da.localeCompare(db) : db.localeCompare(da);
    });
  }, [rows, dateField, sortOrder]);

  // Group by month/year
  const timelineGroups = useMemo(() => {
    const groups = {};
    sortedDeals.forEach((d) => {
      const dt = d[dateField] || 'Unscheduled';
      let monthYear = 'Unscheduled';
      if (dt !== 'Unscheduled' && dt.length >= 7) {
        const parts = dt.split('-');
        if (parts.length >= 2) {
          const year = parts[0];
          const monthIndex = parseInt(parts[1], 10) - 1;
          const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ];
          monthYear = `${months[monthIndex] || parts[1]} ${year}`;
        }
      }
      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      groups[monthYear].push(d);
    });
    return groups;
  }, [sortedDeals, dateField]);

  const totalValue = useMemo(() => {
    return rows.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  }, [rows]);

  if (!rows.length) {
    return (
      <div className="p-12 text-center">
        <Clock3 size={36} className="mx-auto text-ink-300 mb-2" />
        <p className="text-[14px] text-ink-500 font-medium">No deals match the timeline filters.</p>
        <p className="text-[12.5px] text-ink-400 mt-1">Try adjusting your filters or date range.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-slate-50/50 min-h-[500px]">
      {/* Timeline Controls & Summary Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-3.5 bg-white border border-line rounded-xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary-50 text-primary flex items-center justify-center">
            <Clock3 size={19} />
          </div>
          <div>
            <div className="text-[14px] font-semibold text-ink">
              Timeline · {rows.length} Deals
            </div>
            <div className="text-[12px] text-ink-500">
              Total Pipeline Value: <span className="font-semibold text-ink">{fmtINR(totalValue)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Date basis switch */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[12px] font-medium">
            <button
              type="button"
              onClick={() => setDateField('closingDate')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                dateField === 'closingDate' ? 'bg-white text-primary shadow-xs font-semibold' : 'text-ink-600 hover:text-ink'
              }`}
            >
              Closing Date
            </button>
            <button
              type="button"
              onClick={() => setDateField('createdOn')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                dateField === 'createdOn' ? 'bg-white text-primary shadow-xs font-semibold' : 'text-ink-600 hover:text-ink'
              }`}
            >
              Created Date
            </button>
          </div>

          {/* Sort direction toggle */}
          <button
            type="button"
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-line bg-white hover:bg-page text-[12px] font-medium text-ink-600"
            title="Toggle chronological order"
          >
            <ArrowDownUp size={13} />
            <span>{sortOrder === 'asc' ? 'Earliest First' : 'Latest First'}</span>
          </button>
        </div>
      </div>

      {/* Vertical Timeline Track */}
      <div className="relative pl-4 sm:pl-8 space-y-8">
        {/* Continuous vertical timeline guide line */}
        <div className="absolute left-[23px] sm:left-[39px] top-4 bottom-4 w-0.5 bg-slate-200" />

        {Object.entries(timelineGroups).map(([monthYear, dealsInMonth]) => {
          const monthTotal = dealsInMonth.reduce((s, d) => s + (Number(d.amount) || 0), 0);
          return (
            <div key={monthYear} className="relative">
              {/* Month Header Milestone */}
              <div className="flex items-center gap-3 mb-4">
                <div className="relative z-10 flex items-center justify-center h-8 px-3 rounded-full bg-slate-900 text-white font-semibold text-[12px] shadow-xs">
                  <Calendar size={13} className="mr-1.5" />
                  {monthYear}
                </div>
                <span className="text-[12px] text-ink-500 font-medium bg-white px-2.5 py-0.5 rounded-full border border-line">
                  {dealsInMonth.length} deals · {fmtINR(monthTotal)}
                </span>
              </div>

              {/* Deals under this month */}
              <div className="space-y-4 pl-4 sm:pl-6">
                {dealsInMonth.map((deal) => {
                  const stageColor = STAGE_COLORS[deal.stage] || '#3B82F6';
                  const dateVal = deal[dateField] || '';
                  const expectedRevenue = Math.round(((Number(deal.amount) || 0) * (deal.probability || 0)) / 100);

                  return (
                    <div key={deal.id} className="relative flex items-start gap-3 sm:gap-4 group">
                      {/* Node on vertical timeline track */}
                      <div
                        className="relative z-10 mt-3.5 -ml-[25px] sm:-ml-[33px] h-4 w-4 rounded-full border-2 border-white shadow-xs transition-transform group-hover:scale-125"
                        style={{ backgroundColor: stageColor }}
                        title={`Stage: ${deal.stage}`}
                      />

                      {/* Timeline Card */}
                      <div className="flex-1 card p-4 bg-white border border-line rounded-xl hover:shadow-md transition-all hover:border-primary/40">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-line-soft">
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-semibold text-primary bg-primary-50 px-2 py-0.5 rounded border border-primary-100 flex items-center gap-1">
                              <Calendar size={12} />
                              {fmtDate(dateVal)}
                            </span>
                            <button
                              type="button"
                              onClick={() => onView(deal.id)}
                              className="text-[15px] font-semibold text-ink hover:text-primary transition-colors text-left"
                            >
                              {deal.name}
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <Dropdown
                              width={200}
                              align="right"
                              trigger={
                                <button
                                  type="button"
                                  title="Change stage"
                                  className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-[12px] font-medium ${badgeTone('stage', deal.stage)}`}
                                >
                                  {deal.stage}
                                  <ChevronDown size={12} className="ml-1 opacity-70" />
                                </button>
                              }
                            >
                              {(close) => (
                                <>
                                  <MenuLabel>Change stage</MenuLabel>
                                  {STAGES.map((s) => (
                                    <MenuItem
                                      key={s}
                                      close={close}
                                      active={s === deal.stage}
                                      onClick={() => s !== deal.stage && onChangeStage(deal, s)}
                                    >
                                      <span className="inline-flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full" style={{ background: STAGE_COLORS[s] }} />
                                        {s}
                                      </span>
                                    </MenuItem>
                                  ))}
                                </>
                              )}
                            </Dropdown>
                          </div>
                        </div>

                        {/* Card Body Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 py-3 text-[12.5px]">
                          <div>
                            <span className="text-ink-400 block text-[11px] uppercase tracking-wider font-semibold">
                              Deal Amount
                            </span>
                            <span className="font-bold text-[16px] text-ink mt-0.5 block">
                              {fmtINR(deal.amount)}
                            </span>
                          </div>

                          <div>
                            <span className="text-ink-400 block text-[11px] uppercase tracking-wider font-semibold">
                              Expected Revenue
                            </span>
                            <span className="font-semibold text-ink-700 mt-0.5 block">
                              {fmtINR(expectedRevenue)}
                            </span>
                          </div>

                          <div>
                            <span className="text-ink-400 block text-[11px] uppercase tracking-wider font-semibold">
                              Account & Contact
                            </span>
                            <div className="truncate font-medium text-ink mt-0.5">
                              {accountName(deal.accountId) || '—'}
                            </div>
                            {deal.contactId && (
                              <div className="text-[11.5px] text-ink-500 truncate">
                                {contactName(deal.contactId)}
                              </div>
                            )}
                          </div>

                          <div>
                            <span className="text-ink-400 block text-[11px] uppercase tracking-wider font-semibold">
                              Deal Owner
                            </span>
                            <div className="flex items-center gap-1.5 mt-1">
                              <UserAvatar userId={deal.ownerId} size={22} />
                              <span className="font-medium text-ink truncate">
                                {userName(deal.ownerId)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Probability Progress Bar & Tags */}
                        <div className="pt-2.5 border-t border-line-soft flex flex-wrap items-center justify-between gap-2 text-[12px]">
                          <div className="flex items-center gap-3">
                            <span className="text-ink-500 font-medium">Probability:</span>
                            <div className="w-24 h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${deal.probability}%`, backgroundColor: stageColor }}
                              />
                            </div>
                            <span className="font-semibold text-ink">{deal.probability}%</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {deal.source && (
                              <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                                Source: {deal.source}
                              </span>
                            )}
                            {deal.department && (
                              <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                                {deal.department}
                              </span>
                            )}
                          </div>
                        </div>

                        {deal.description && (
                          <div className="mt-2 pt-2 border-t border-line-soft text-[12px] text-ink-600 italic line-clamp-2">
                            "{deal.description}"
                          </div>
                        )}
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

