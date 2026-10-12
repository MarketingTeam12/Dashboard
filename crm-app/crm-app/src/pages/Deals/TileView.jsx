import { Calendar, Trophy, XCircle, Building2, User, Tag, ArrowRight } from 'lucide-react';
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

export default function TileView({
  rows = [],
  accountName,
  contactName,
  userName,
  onView,
  onEdit,
  onChangeStage,
  onDelete,
}) {
  if (!rows.length) {
    return (
      <div className="p-12 text-center">
        <p className="text-[14px] text-ink-500">No deals match the selected criteria.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4 p-4">
      {rows.map((deal) => {
        const barColor = BAR[deal.stage] || '#3B82F6';
        return (
          <div
            key={deal.id}
            className="card p-4 hover:shadow-md transition-all hover:border-primary/40 flex flex-col justify-between group bg-white border border-line rounded-xl"
          >
            <div>
              {/* Top row: Deal Name & Stage Badge */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => onView(deal.id)}
                  className="text-[14.5px] font-semibold text-ink group-hover:text-primary transition-colors text-left line-clamp-1 hover:underline"
                  title={deal.name}
                >
                  {deal.name}
                </button>
                <Dropdown
                  width={200}
                  align="right"
                  trigger={
                    <button
                      type="button"
                      title="Change stage"
                      className={`shrink-0 inline-flex items-center justify-center px-2 py-0.5 rounded text-[11.5px] font-medium ${badgeTone('stage', deal.stage)}`}
                    >
                      {deal.stage}
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

              {/* Account and Contact */}
              <div className="text-[12.5px] text-ink-500 mb-3 space-y-1">
                <div className="flex items-center gap-1.5 truncate">
                  <Building2 size={13} className="text-ink-400 shrink-0" />
                  <span className="truncate">{accountName(deal.accountId) || 'No Account'}</span>
                </div>
                {deal.contactId && (
                  <div className="flex items-center gap-1.5 truncate">
                    <User size={13} className="text-ink-400 shrink-0" />
                    <span className="truncate">{contactName(deal.contactId)}</span>
                  </div>
                )}
              </div>

              {/* Amount */}
              <div className="mb-3">
                <span className="text-[11px] uppercase tracking-wider text-ink-400 font-semibold block">Deal Value</span>
                <span className="text-[18px] font-bold text-ink tracking-tight">{fmtINR(deal.amount)}</span>
              </div>

              {/* Probability Bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-[11.5px] mb-1">
                  <span className="text-ink-400 font-medium">Probability</span>
                  <span className="font-semibold" style={{ color: deal.probability === 100 ? '#10B981' : barColor }}>
                    {deal.probability}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#EEF2F8] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${deal.probability}%`, background: barColor }}
                  />
                </div>
              </div>

              {/* Closing Date & Source/Department */}
              <div className="flex items-center justify-between text-[12px] text-ink-500 pt-2 border-t border-line-soft">
                <div className="flex items-center gap-1">
                  <Calendar size={13} className="text-ink-400" />
                  <span>{fmtDate(deal.closingDate)}</span>
                </div>
                {deal.source && (
                  <span className="text-[11px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                    {deal.source}
                  </span>
                )}
              </div>
            </div>

            {/* Footer: Owner avatar */}
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-line">
              <div className="flex items-center gap-2">
                <UserAvatar userId={deal.ownerId} size={24} />
                <span className="text-[12px] text-ink-600 font-medium truncate max-w-[140px]">
                  {userName(deal.ownerId)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

