import React from 'react';
import { Phone, PhoneCall, PhoneIncoming, PhoneOutgoing, Clock, User, Building2, Calendar } from 'lucide-react';
import { UserAvatar, PersonAvatar } from '../../components/common/Avatar';
import StatusBadge, { badgeTone } from '../../components/common/StatusBadge';
import Dropdown, { MenuItem, MenuLabel } from '../../components/common/Dropdown';
import { fmtDate, fmtTime, fmtDuration } from '../../utils/calculations';

export default function CallsTileView({
  rows = [],
  accountName,
  contactName,
  userName,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  CALL_STATUSES = ['Scheduled', 'Completed', 'Missed', 'Busy'],
  STATUS_COLORS = {},
}) {
  if (!rows.length) {
    return (
      <div className="p-12 text-center">
        <p className="text-[14px] text-ink-500">No calls match the selected criteria.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      {rows.map((call) => {
        const isOutbound = call.type === 'Outbound';
        const TypeIcon = isOutbound ? PhoneOutgoing : PhoneIncoming;

        return (
          <div
            key={call.id}
            className="card p-4 hover:shadow-md transition-all hover:border-primary/40 flex flex-col justify-between group bg-white border border-line rounded-xl"
          >
            <div>
              {/* Top row: Subject & Status */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => onView(call.id)}
                  className="text-[14.5px] font-semibold text-ink group-hover:text-primary transition-colors text-left line-clamp-1 hover:underline"
                  title={call.subject}
                >
                  {call.subject}
                </button>
                <Dropdown
                  width={180}
                  align="right"
                  trigger={
                    <button
                      type="button"
                      title="Update status"
                      className={`shrink-0 inline-flex items-center justify-center px-2 py-0.5 rounded text-[11.5px] font-medium whitespace-nowrap ${badgeTone('callStatus', call.status)}`}
                    >
                      {call.status}
                    </button>
                  }
                >
                  {(close) => (
                    <>
                      <MenuLabel>Change status</MenuLabel>
                      {CALL_STATUSES.map((s) => (
                        <MenuItem
                          key={s}
                          close={close}
                          active={s === call.status}
                          onClick={() => s !== call.status && onStatusChange(call, s)}
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

              {/* Contact & Account */}
              <div className="text-[12.5px] text-ink-500 mb-3 space-y-1">
                <div className="flex items-center gap-1.5 truncate">
                  <User size={13} className="text-ink-400 shrink-0" />
                  <span className="font-medium text-ink-700 truncate">
                    {contactName(call.contactId) || 'No Contact'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <Building2 size={13} className="text-ink-400 shrink-0" />
                  <span className="truncate">{accountName(call.accountId) || 'No Account'}</span>
                </div>
              </div>

              {/* Call Type, Date & Duration */}
              <div className="p-2.5 bg-slate-50 rounded-lg text-[12px] space-y-1.5 border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 font-medium text-ink-700">
                    <TypeIcon size={14} className={isOutbound ? 'text-primary' : 'text-success'} />
                    {call.type} Call
                  </span>
                  <span className="text-ink-500 font-medium">
                    {call.duration ? fmtDuration(call.duration) : '0s'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-ink-500">
                  <span className="inline-flex items-center gap-1">
                    <Calendar size={12} className="text-ink-400" />
                    {fmtDate(call.dateTime)}
                  </span>
                  <span>{fmtTime(call.dateTime)}</span>
                </div>
              </div>

              {call.notes && (
                <p className="text-[12px] text-ink-500 mt-2.5 line-clamp-2 italic">
                  "{call.notes}"
                </p>
              )}
            </div>

            {/* Bottom row: Call Manager/Owner */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-line">
              <div className="flex items-center gap-1.5 truncate">
                <UserAvatar userId={call.ownerId} size={22} />
                <span className="text-[12px] text-ink-600 truncate">{userName(call.ownerId)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

