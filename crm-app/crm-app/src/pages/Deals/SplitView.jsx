import React, { useState, useMemo, useEffect } from 'react';
import {
  Building2, Calendar, Coins, ChevronDown, ChevronRight,
  Layers, User, AlertCircle, ChevronsUpDown
} from 'lucide-react';
import { UserAvatar } from '../../components/common/Avatar';
import StatusBadge, { badgeTone } from '../../components/common/StatusBadge';
import { fmtINR, fmtDate } from '../../utils/calculations';

export const SPLIT_VIEW_STAGES = [
  'Need Deals Estimation _Pending Info',
  'Deal Estimation Ready',
  'Deal Estimation Sent to Client_Translations',
  'Deal Estimation Sent to Client_Other Services',
  'Estimation Accepted',
  'Invoice Need',
  'Invoice Ready',
  'Deal Closed Won',
  'Deal Closed Lost Pending Approval',
  'Deal Closed Lost Rejected',
  'Deal Job Seeking',
];

const KNOWN_STAGE_ALIASES = {
  'need deals estimation _pending info': 'Need Deals Estimation _Pending Info',
  'need deals estimation pending info': 'Need Deals Estimation _Pending Info',
  'need deal estimation': 'Need Deals Estimation _Pending Info',
  'deal estimation ready': 'Deal Estimation Ready',
  'deal estimation sent to client_translations': 'Deal Estimation Sent to Client_Translations',
  'deal estimation sent to client translations': 'Deal Estimation Sent to Client_Translations',
  'deal estimation sent to client': 'Deal Estimation Sent to Client_Translations',
  'deal estimation sent to client_other services': 'Deal Estimation Sent to Client_Other Services',
  'deal estimation sent to client other services': 'Deal Estimation Sent to Client_Other Services',
  'estimation accepted': 'Estimation Accepted',
  'deal estimation accepted- invoice need': 'Estimation Accepted',
  'deal estimation accepted - invoice need': 'Estimation Accepted',
  'deal estimation accepted invoice need': 'Estimation Accepted',
  'invoice need': 'Invoice Need',
  'invoice ready': 'Invoice Ready',
  'deal invoice ready': 'Invoice Ready',
  'deal closed won': 'Deal Closed Won',
  'deal closed (won)': 'Deal Closed Won',
  'closed won': 'Deal Closed Won',
  'deal closed lost pending approval': 'Deal Closed Lost Pending Approval',
  'pre-deal lost': 'Deal Closed Lost Pending Approval',
  'deal closed lost rejected': 'Deal Closed Lost Rejected',
  'deal closed (lost)': 'Deal Closed Lost Rejected',
  'closed lost': 'Deal Closed Lost Rejected',
  'deal job seeking': 'Deal Job Seeking',
  'deal job seeking & agency': 'Deal Job Seeking',
  'deal job seen': 'Deal Job Seeking',
  'job seeking': 'Deal Job Seeking',
};

/**
 * Normalizes backend stage strings (with spaces, underscores, symbols, capitalization)
 * to one of the exact 11 display stages.
 */
export function normalizeToDisplayStage(raw) {
  if (!raw) return '';
  const s = String(raw).trim();

  // 1. Direct match with display names
  const exact = SPLIT_VIEW_STAGES.find((st) => st.toLowerCase() === s.toLowerCase());
  if (exact) return exact;

  // 2. Direct alias lookup
  const sLower = s.toLowerCase();
  if (KNOWN_STAGE_ALIASES[sLower]) return KNOWN_STAGE_ALIASES[sLower];

  // 3. Normalized spaces/underscores comparison
  const clean = sLower.replace(/[\s_\-]+/g, ' ');
  if (KNOWN_STAGE_ALIASES[clean]) return KNOWN_STAGE_ALIASES[clean];

  for (const st of SPLIT_VIEW_STAGES) {
    if (st.toLowerCase().replace(/[\s_\-]+/g, ' ') === clean) {
      return st;
    }
  }

  return s;
}

export default function SplitView({
  deals = [],
  accountName,
  contactName,
  userName,
  onOpenDeal,
  onEdit,
}) {
  // Initially show all 11 stages as collapsed rows.
  // Preserves previously expanded stages in localStorage when returning from Deal Details.
  const [expandedStages, setExpandedStages] = useState(() => {
    try {
      const saved = localStorage.getItem('split_view_expanded_stages');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return []; // All 11 collapsed initially
  });

  const toggleStage = (stageName) => {
    setExpandedStages((prev) => {
      const isExpanded = prev.includes(stageName);
      const next = isExpanded ? prev.filter((s) => s !== stageName) : [...prev, stageName];
      try {
        localStorage.setItem('split_view_expanded_stages', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const expandAll = () => {
    setExpandedStages([...SPLIT_VIEW_STAGES]);
    try {
      localStorage.setItem('split_view_expanded_stages', JSON.stringify(SPLIT_VIEW_STAGES));
    } catch (e) {}
  };

  const collapseAll = () => {
    setExpandedStages([]);
    try {
      localStorage.setItem('split_view_expanded_stages', JSON.stringify([]));
    } catch (e) {}
  };

  // Group deals dynamically into each of the 11 stages using normalized mapping
  const stageDealsMap = useMemo(() => {
    const map = {};
    SPLIT_VIEW_STAGES.forEach((st) => {
      map[st] = [];
    });

    deals.forEach((deal) => {
      const mappedStage = normalizeToDisplayStage(deal.stage);
      if (map[mappedStage]) {
        map[mappedStage].push(deal);
      }
    });

    return map;
  }, [deals]);

  // Dynamic counts for each stage
  const stageCounts = useMemo(() => {
    const counts = {};
    SPLIT_VIEW_STAGES.forEach((st) => {
      counts[st] = stageDealsMap[st]?.length || 0;
    });
    return counts;
  }, [stageDealsMap]);

  return (
    <div className="w-full bg-white border border-line rounded-xl overflow-hidden shadow-xs">
      {/* Top Split View Toolbar Bar */}
      <div className="px-4 py-3 bg-[#F8FAFC] border-b border-line flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Layers size={17} className="text-primary shrink-0" />
          <h2 className="text-[14px] font-bold text-ink">
            Split View <span className="text-ink-400 font-normal">· Stage-wise Deal Grouping</span>
          </h2>
          <span className="text-[11.5px] px-2.5 py-0.5 rounded-full bg-primary-50 text-primary font-bold border border-primary-100">
            {deals.length} Total Deals
          </span>
        </div>

        <div className="flex items-center gap-3 text-[12px] text-ink-500">
          <button
            type="button"
            onClick={expandAll}
            className="hover:text-primary font-semibold transition-colors flex items-center gap-1"
          >
            <span>Expand All</span>
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={collapseAll}
            className="hover:text-primary font-semibold transition-colors flex items-center gap-1"
          >
            <span>Collapse All</span>
          </button>
        </div>
      </div>

      {/* 11 Vertical Full-Width Expandable Stage Rows */}
      <div className="divide-y divide-line">
        {SPLIT_VIEW_STAGES.map((stageName, idx) => {
          const isExpanded = expandedStages.includes(stageName);
          const count = stageCounts[stageName] || 0;
          const stageDeals = stageDealsMap[stageName] || [];

          return (
            <div key={stageName} className="transition-colors">
              {/* Stage Row Header */}
              <div
                onClick={() => toggleStage(stageName)}
                className={`flex items-center justify-between px-4 sm:px-5 py-3 cursor-pointer select-none transition-colors group ${
                  isExpanded ? 'bg-primary-50/25' : 'bg-white hover:bg-slate-50/90'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 pr-3">
                  <span className="text-ink-400 group-hover:text-primary transition-colors shrink-0">
                    {isExpanded ? (
                      <ChevronDown size={17} className="text-primary font-bold transition-transform" />
                    ) : (
                      <ChevronRight size={17} className="text-ink-400 transition-transform" />
                    )}
                  </span>
                  <span className={`text-[13.5px] font-semibold truncate transition-colors ${
                    isExpanded ? 'text-primary font-bold' : 'text-ink group-hover:text-primary'
                  }`}>
                    {idx + 1}. {stageName}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[12px] font-bold px-2.5 py-0.5 rounded-full transition-colors ${
                      count > 0
                        ? 'bg-primary-50 text-primary border border-primary-200'
                        : 'bg-slate-100 text-ink-400'
                    }`}
                  >
                    ({count})
                  </span>
                </div>
              </div>

              {/* Expanded Stage Records */}
              {isExpanded && (
                <div className="bg-white border-t border-line-soft">
                  {stageDeals.length === 0 ? (
                    <div className="py-4 px-6 text-center text-[13px] text-ink-400 italic bg-slate-50/40">
                      No deals found in this stage
                    </div>
                  ) : (
                    <div className="overflow-x-auto thin-scroll">
                      {/* Compact Table Header */}
                      <div className="min-w-[840px] grid grid-cols-[minmax(220px,2fr)_minmax(150px,1.2fr)_minmax(140px,1fr)_minmax(110px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(130px,1fr)] px-5 py-2 bg-slate-50 border-b border-line-soft text-[11px] font-bold text-ink-400 uppercase tracking-wider">
                        <span>Deal Name</span>
                        <span>Account Name</span>
                        <span>Contact Name</span>
                        <span className="text-right pr-4">Amount</span>
                        <span>Stage</span>
                        <span>Closing Date</span>
                        <span>Deal Owner</span>
                      </div>

                      {/* Deal Rows */}
                      <div className="min-w-[840px] divide-y divide-line-soft">
                        {stageDeals.map((deal) => (
                          <div
                            key={deal.id}
                            onClick={() => onOpenDeal?.(deal.id)}
                            className="grid grid-cols-[minmax(220px,2fr)_minmax(150px,1.2fr)_minmax(140px,1fr)_minmax(110px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(130px,1fr)] px-5 py-2.5 items-center hover:bg-primary-50/30 transition-colors cursor-pointer text-[12.5px] group"
                          >
                            {/* Deal Name */}
                            <div className="flex items-center gap-2.5 min-w-0 pr-3">
                              <span
                                className="font-semibold text-ink group-hover:text-primary transition-colors truncate"
                                title={deal.name}
                              >
                                {deal.name}
                              </span>
                            </div>

                            {/* Account Name */}
                            <div className="text-ink-600 truncate pr-3 font-medium">
                              {accountName(deal.accountId) || '—'}
                            </div>

                            {/* Contact Name */}
                            <div className="text-ink-500 truncate pr-3">
                              {contactName(deal.contactId) || '—'}
                            </div>

                            {/* Deal Amount */}
                            <div className="font-extrabold text-ink text-right pr-4">
                              {fmtINR(deal.amount)}
                            </div>

                            {/* Stage */}
                            <div className="pr-2">
                              <StatusBadge status={deal.stage} tone={badgeTone(deal.stage)} />
                            </div>

                            {/* Closing Date */}
                            <div className="text-ink-500 flex items-center gap-1.5">
                              <Calendar size={12} className="text-ink-400 shrink-0" />
                              <span>{fmtDate(deal.closingDate)}</span>
                            </div>

                            {/* Deal Owner */}
                            <div className="flex items-center gap-2 min-w-0">
                              <UserAvatar userId={deal.ownerId} size={18} />
                              <span className="truncate text-ink-700 font-medium">
                                {userName(deal.ownerId)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
