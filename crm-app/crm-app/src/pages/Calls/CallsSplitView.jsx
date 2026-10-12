import React, { useState } from 'react';
import {
  ChevronDown, ChevronRight, PhoneIncoming, PhoneOutgoing,
  Building2, User, Clock3
} from 'lucide-react';
import { UserAvatar } from '../../components/common/Avatar';
import StatusBadge, { badgeTone } from '../../components/common/StatusBadge';
import { fmtDate, fmtTime, fmtDuration } from '../../utils/calculations';

export default function CallsSplitView({
  calls = [],
  accountName,
  contactName,
  userName,
  onView,
  onEdit,
  onDelete,
  CALL_STATUSES = ['Scheduled', 'Completed', 'Missed', 'Busy'],
  STATUS_COLORS = {},
}) {
  const [expandedStatuses, setExpandedStatuses] = useState(() => {
    try {
      const saved = localStorage.getItem('calls_split_expanded_statuses');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return ['Scheduled', 'Completed', 'Missed', 'Busy'];
  });

  const toggleStatus = (status) => {
    setExpandedStatuses((prev) => {
      const next = prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status];
      try {
        localStorage.setItem('calls_split_expanded_statuses', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const expandAll = () => {
    setExpandedStatuses([...CALL_STATUSES]);
    try {
      localStorage.setItem('calls_split_expanded_statuses', JSON.stringify(CALL_STATUSES));
    } catch (e) {}
  };

  const collapseAll = () => {
    setExpandedStatuses([]);
    try {
      localStorage.setItem('calls_split_expanded_statuses', JSON.stringify([]));
    } catch (e) {}
  };

  return (
    <div className="p-4 space-y-3 bg-slate-50/40 min-h-[500px]">
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-[13px] text-ink-500 font-medium">
          Split View by Status · {calls.length} Total Calls
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

      {CALL_STATUSES.map((status) => {
        const groupCalls = calls.filter((c) => c.status === status);
        const isExpanded = expandedStatuses.includes(status);
        const totalDuration = groupCalls.reduce((s, c) => s + (Number(c.duration) || 0), 0);
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
                  {groupCalls.length}
                </span>
              </div>

              <div className="text-[12px] text-ink-500 font-medium">
                Total duration: <span className="font-semibold text-ink-700">{fmtDuration(totalDuration)}</span>
              </div>
            </div>

            {/* Expanded items */}
            {isExpanded && (
              <div className="divide-y divide-line/60">
                {groupCalls.length === 0 ? (
                  <div className="px-6 py-4 text-[13px] text-ink-400 italic bg-slate-50/30">
                    No calls currently in {status}.
                  </div>
                ) : (
                  groupCalls.map((call) => {
                    const isOutbound = call.type === 'Outbound';
                    const TypeIcon = isOutbound ? PhoneOutgoing : PhoneIncoming;

                    return (
                      <div
                        key={call.id}
                        className="px-4 py-3 hover:bg-primary-50/20 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => onView(call.id)}
                              className="text-[13.5px] font-semibold text-ink hover:text-primary transition-colors text-left truncate"
                            >
                              {call.subject}
                            </button>
                            <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-ink-600 font-medium">
                              <TypeIcon size={12} className={isOutbound ? 'text-primary' : 'text-success'} />
                              {call.type}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[12px] text-ink-500">
                            <span className="flex items-center gap-1 text-ink-700 font-medium">
                              <User size={12} className="text-ink-400" />
                              {contactName(call.contactId) || 'No Contact'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Building2 size={12} className="text-ink-400" />
                              {accountName(call.accountId) || 'No Account'}
                            </span>
                            <span className="flex items-center gap-1 text-ink-600">
                              <Clock3 size={12} className="text-ink-400" />
                              {fmtDate(call.dateTime)} {fmtTime(call.dateTime)}
                            </span>
                            <span className="text-ink-700 font-semibold">
                              {call.duration ? fmtDuration(call.duration) : '0s'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 justify-between sm:justify-end pt-1 sm:pt-0">
                          <div className="flex items-center gap-1.5">
                            <UserAvatar userId={call.ownerId} size={22} />
                            <span className="text-[12px] text-ink-600 hidden md:inline">
                              {userName(call.ownerId)}
                            </span>
                          </div>
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

