import React, { useMemo, useState } from 'react';
import {
  Calendar, Clock3, PhoneIncoming, PhoneOutgoing, Building2, User,
  ArrowDownUp
} from 'lucide-react';
import { UserAvatar } from '../../components/common/Avatar';
import StatusBadge, { badgeTone } from '../../components/common/StatusBadge';
import { fmtDate, fmtTime, fmtDuration } from '../../utils/calculations';

export default function CallsTimelineView({
  rows = [],
  accountName,
  contactName,
  userName,
  onView,
  onEdit,
  onDelete,
}) {
  const [sortOrder, setSortOrder] = useState('desc'); // default most recent first

  const sortedCalls = useMemo(() => {
    return [...rows].sort((a, b) => {
      const da = a.dateTime || '';
      const db = b.dateTime || '';
      return sortOrder === 'asc' ? da.localeCompare(db) : db.localeCompare(da);
    });
  }, [rows, sortOrder]);

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
    return rows.reduce((sum, c) => sum + (Number(c.duration) || 0), 0);
  }, [rows]);

  if (!rows.length) {
    return (
      <div className="p-12 text-center">
        <Clock3 size={36} className="mx-auto text-ink-300 mb-2" />
        <p className="text-[14px] text-ink-500 font-medium">No calls match the timeline filters.</p>
        <p className="text-[12.5px] text-ink-400 mt-1">Try adjusting your filters or search query.</p>
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
              Timeline · {rows.length} Calls
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

      {/* Timeline groups */}
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
                            className="text-[14px] font-semibold text-ink hover:text-primary transition-colors text-left truncate"
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
    </div>
  );
}

