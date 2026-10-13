import React, { useMemo, useState } from 'react';
import {
  Calendar, Clock3, PhoneIncoming, PhoneOutgoing, Building2, User,
  ArrowDownUp, Filter, ChevronUp, ChevronDown, Zap, RefreshCw
} from 'lucide-react';
import { UserAvatar } from '../../components/common/Avatar';
import StatusBadge from '../../components/common/StatusBadge';
import { fmtDate, fmtTime, fmtDuration } from '../../utils/calculations';
import { useCRM } from '../../context/CRMContext';
import { TimelineHistoryFilterBar } from '../../components/common/TimelineHistoryView';

export default function CallsTimelineView({
  rows = [],
  accountName,
  contactName,
  userName,
  onView,
  onEdit,
  onDelete,
}) {
  const { users } = useCRM();
  const [sortOrder, setSortOrder] = useState('desc'); // default most recent first

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

  // Apply filters to calls rows
  const filteredCalls = useMemo(() => {
    return rows.filter((c) => {
      // 1. Module filter
      if (appliedFilters.module !== 'All Modules' && appliedFilters.module !== 'Calls') {
        return false;
      }
      // 2. User filter
      if (appliedFilters.user !== 'All Users') {
        const owner = userName ? userName(c.ownerId) : '';
        if (!owner.toLowerCase().includes(appliedFilters.user.toLowerCase())) {
          return false;
        }
      }
      // 3. Source filter
      if (appliedFilters.source !== 'All Sources') {
        if (appliedFilters.source === 'Workflow Rule' && c.source !== 'Workflow Rule') return false;
        if (appliedFilters.source === 'Manual Entry' && c.source === 'Workflow Rule') return false;
      }
      // 4. Time filter
      if (appliedFilters.time !== 'Any Time') {
        const dtStr = c.dateTime || '';
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
  }, [rows, appliedFilters, userName]);

  const sortedCalls = useMemo(() => {
    return [...filteredCalls].sort((a, b) => {
      const da = a.dateTime || '';
      const db = b.dateTime || '';
      return sortOrder === 'asc' ? da.localeCompare(db) : db.localeCompare(da);
    });
  }, [filteredCalls, sortOrder]);

  const timelineGroups = useMemo(() => {
    const groups = {};
    sortedCalls.forEach((c) => {
      const dt = c.dateTime || 'Unscheduled';
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
      groups[groupKey].push(c);
    });
    return groups;
  }, [sortedCalls]);

  const totalDuration = useMemo(() => {
    return filteredCalls.reduce((sum, c) => sum + (Number(c.duration) || 0), 0);
  }, [filteredCalls]);

  // Upcoming scheduled actions
  const upcomingCallActions = [
    {
      id: 'uca-1',
      title: 'Scheduled Call: Follow-up Discussion',
      triggerTime: '14/10/2026 11:30 AM',
      rule: 'Call_Auto_Schedule_Rule',
      type: 'Calendar Reminder',
      recipient: 'Arun Kumar'
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
            {upcomingCallActions.map(ua => (
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
              Timeline · {filteredCalls.length} Calls
            </div>
            <div className="text-[12px] text-ink-500">
              Total Duration: <span className="font-semibold text-ink">{fmtDuration(totalDuration)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            className="h-8 px-2.5 rounded-lg border border-line bg-white hover:bg-page text-[12.5px] font-medium text-ink-600 flex items-center gap-1.5 shadow-xs"
            title="Toggle sort order"
          >
            <ArrowDownUp size={13} />
            <span>{sortOrder === 'asc' ? 'Oldest First' : 'Newest First'}</span>
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400 flex items-center justify-center gap-2 text-[13px]">
          <RefreshCw size={16} className="animate-spin text-primary" />
          <span>Filtering call timeline records...</span>
        </div>
      ) : filteredCalls.length === 0 ? (
        <div className="p-12 text-center bg-white border border-dashed border-slate-200 rounded-xl">
          <Clock3 size={36} className="mx-auto text-ink-300 mb-2" />
          <p className="text-[14px] text-ink-500 font-medium">No calls match the timeline history filters.</p>
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
          {Object.entries(timelineGroups).map(([monthYear, groupCalls]) => (
            <div key={monthYear} className="relative">
              <div className="sticky top-2 z-10 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-white text-[12px] font-semibold shadow mb-4">
                <Calendar size={13} />
                <span>{monthYear}</span>
                <span className="text-slate-300 font-normal">({groupCalls.length} calls)</span>
              </div>

              <div className="relative pl-6 sm:pl-8 border-l-2 border-line/80 space-y-3.5 ml-3">
                {groupCalls.map((call) => {
                  const isOutbound = call.type === 'Outbound';
                  const TypeIcon = isOutbound ? PhoneOutgoing : PhoneIncoming;

                  return (
                    <div key={call.id} className="relative group">
                      <div className="absolute -left-[31px] sm:-left-[39px] top-4 w-3.5 h-3.5 rounded-full border-2 border-white bg-primary shadow-xs ring-2 ring-primary/20" />

                      <div className="card p-3.5 bg-white border border-line rounded-xl hover:shadow-sm hover:border-primary/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onView(call.id)}
                              className="text-[14px] font-semibold text-ink hover:text-primary transition-colors text-left truncate cursor-pointer"
                            >
                              {call.subject}
                            </button>
                            <StatusBadge kind="callStatus" value={call.status} size="sm" />
                            <span className="inline-flex items-center gap-1 text-[11.5px] px-2 py-0.5 rounded bg-slate-100 text-ink-600 font-medium">
                              <TypeIcon size={12} className={isOutbound ? 'text-primary' : 'text-success'} />
                              {call.type}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-ink-500">
                            <div className="flex items-center gap-1">
                              <User size={13} className="text-ink-400" />
                              <span className="font-medium text-ink-700">{contactName(call.contactId) || 'No Contact'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Building2 size={13} className="text-ink-400" />
                              <span>{accountName(call.accountId) || 'No Account'}</span>
                            </div>
                            <div className="flex items-center gap-1 text-ink-600">
                              <Clock3 size={13} className="text-ink-400" />
                              <span>{fmtDate(call.dateTime)} at {fmtTime(call.dateTime)}</span>
                            </div>
                            <div className="font-semibold text-ink-700">
                              Duration: {call.duration ? fmtDuration(call.duration) : '0s'}
                            </div>
                          </div>

                          {call.notes && (
                            <p className="text-[12px] text-ink-500 italic line-clamp-1">
                              "{call.notes}"
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-line justify-between sm:justify-end">
                          <div className="flex items-center gap-1.5">
                            <UserAvatar userId={call.ownerId} size={22} />
                            <span className="text-[12px] text-ink-600 hidden md:inline">{userName(call.ownerId)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
