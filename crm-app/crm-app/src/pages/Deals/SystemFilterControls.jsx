import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Calendar, Clock, AlertCircle } from 'lucide-react';

export const DATE_OPERATORS = [
  'age in',
  'Previous',
  'Next',
  'On',
  'before',
  'after',
  'between',
  'Today',
  'Yesterday',
  'This Week',
  'This Month',
  'This Year',
  'Previous Week',
  'Previous Month',
  'Until Now'
];

export const TIME_UNITS = ['days', 'weeks', 'months'];

export const ACTOR_OPTIONS = [
  'User & System',
  'User Or System',
  'User',
  'System',
  'Only by User',
  'Only by System'
];

export const EMAIL_SENTIMENTS = [
  'Positive',
  'Negative',
  'Positive and Negative',
  'Positive or Negative',
  'Positive Only',
  'Negative Only',
  'Neutral'
];

export const LATEST_EMAIL_STATUSES = [
  'sent',
  'not sent',
  'opened',
  'not opened',
  'clicked',
  'received',
  'not received',
  'replied',
  'bounced',
  'responded',
  'opened and not responded'
];

export const EMAIL_SENT_SUB_STATUSES = [
  'opened',
  'clicked',
  'not opened',
  'bounced',
  'responded',
  'opened and not responded',
  'Any of the above'
];

export const SCORING_RULES = [
  'None',
  'Overall Deal Score',
  'High Priority Lead Score',
  'Engagement Score',
  'Deal Value Score'
];

export const COMPARISON_OPERATORS = [
  '=',
  '!=',
  '<',
  '<=',
  '>',
  '>=',
  'between',
  'not between'
];

export const ACTIVITY_DUE_OPTIONS = [
  'Today',
  'Tomorrow',
  'Next 7 days',
  'Today + Overdue'
];

/**
 * Custom Zoho CRM-style dropdown with checkmark beside selected option,
 * hover highlight, scrollable container, and Escape/Click-outside dismissal.
 */
export function ZohoSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  className = '',
  disabled = false,
  size = 'md'
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const normOptions = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const selectedItem = normOptions.find((o) => o.value === value);
  const displayLabel = selectedItem ? selectedItem.label : value || placeholder;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-1.5 px-2.5 bg-white border rounded text-left transition-colors shadow-2xs ${
          size === 'sm' ? 'h-7 text-[12px]' : 'h-8 text-[13px]'
        } ${
          open
            ? 'border-primary ring-1 ring-primary/20 text-ink'
            : 'border-line hover:border-slate-400 text-ink-700'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-50' : 'cursor-pointer'}`}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-ink-400 transition-transform ${open ? 'rotate-180 text-primary' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-full min-w-[140px] max-h-56 bg-white border border-line rounded-md shadow-lg z-50 overflow-y-auto thin-scroll py-1 animate-in fade-in-50 zoom-in-95 duration-100">
          {normOptions.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center px-2.5 py-1.5 text-left text-[12.5px] transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-primary-50 text-primary font-medium'
                    : 'text-ink-700 hover:bg-slate-50 hover:text-ink'
                }`}
              >
                <div className="w-4 h-4 mr-1.5 shrink-0 flex items-center justify-center">
                  {isSelected && <Check size={13} className="text-primary stroke-[2.5]" />}
                </div>
                <span className="truncate flex-1">{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Reusable dynamic Date Operator and unit/date picker control block
 */
export function DateOperatorGroup({ conf = {}, onChange }) {
  const op = conf.dateOp || 'age in';
  const num = conf.num !== undefined ? conf.num : 2;
  const unit = conf.unit || 'days';
  const d1 = conf.d1 || '';
  const d2 = conf.d2 || '';

  const update = (patch) => onChange({ ...conf, ...patch });

  return (
    <div className="space-y-2 pt-1 border-t border-slate-100">
      {/* Date operator dropdown */}
      <ZohoSelect
        value={op}
        onChange={(v) => update({ dateOp: v })}
        options={DATE_OPERATORS}
      />

      {/* Dynamic input depending on operator */}
      {op === 'between' ? (
        <div className="space-y-1.5 pt-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[11.5px] text-ink-400 w-10 shrink-0">From</span>
            <input
              type="date"
              value={d1}
              onChange={(e) => update({ d1: e.target.value })}
              className="flex-1 h-7.5 px-2 text-[12.5px] bg-white border border-line rounded focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11.5px] text-ink-400 w-10 shrink-0">To</span>
            <input
              type="date"
              value={d2}
              onChange={(e) => update({ d2: e.target.value })}
              className="flex-1 h-7.5 px-2 text-[12.5px] bg-white border border-line rounded focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      ) : ['On', 'before', 'after'].includes(op) ? (
        <div className="pt-0.5">
          <input
            type="date"
            value={d1}
            onChange={(e) => update({ d1: e.target.value })}
            className="w-full h-7.5 px-2 text-[12.5px] bg-white border border-line rounded focus:outline-none focus:border-primary"
          />
        </div>
      ) : ['age in', 'Previous', 'Next'].includes(op) ? (
        <div className="flex items-center gap-2 pt-0.5">
          <input
            type="number"
            min="0"
            value={num}
            onChange={(e) => update({ num: Math.max(0, parseInt(e.target.value, 10) || 0) })}
            className="w-16 h-8 px-2 text-[13px] bg-white border border-line rounded text-center focus:outline-none focus:border-primary"
          />
          <div className="flex-1">
            <ZohoSelect
              value={unit}
              onChange={(v) => update({ unit: v })}
              options={TIME_UNITS}
            />
          </div>
        </div>
      ) : (
        <div className="text-[11.5px] text-ink-400 italic px-1 py-0.5">
          Period: {op}
        </div>
      )}
    </div>
  );
}

/**
 * 1. Activities Filter Control
 */
function ActivitiesControl({ conf = {}, onChange }) {
  const mode = conf.mode || 'due'; // 'without' | 'overdue' | 'due'
  const dueOption = conf.dueOption || 'Today + Overdue';

  const update = (patch) => onChange({ ...conf, ...patch });

  return (
    <div className="space-y-2.5 text-[13px]">
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-ink-700 cursor-pointer">
          <input
            type="radio"
            name="activities-filter-mode"
            checked={mode === 'without'}
            onChange={() => update({ mode: 'without' })}
            className="text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
          />
          <span>Without Open Activities</span>
        </label>

        <label className="flex items-center gap-2 text-ink-700 cursor-pointer">
          <input
            type="radio"
            name="activities-filter-mode"
            checked={mode === 'overdue'}
            onChange={() => update({ mode: 'overdue' })}
            className="text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
          />
          <span>Overdue</span>
        </label>

        <label className="flex items-center gap-2 text-ink-700 cursor-pointer">
          <input
            type="radio"
            name="activities-filter-mode"
            checked={mode === 'due'}
            onChange={() => update({ mode: 'due' })}
            className="text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
          />
          <span>Activity Due</span>
        </label>
      </div>

      {mode === 'due' && (
        <div className="pl-5 pt-1">
          <ZohoSelect
            value={dueOption}
            onChange={(v) => update({ dueOption: v })}
            options={ACTIVITY_DUE_OPTIONS}
          />
        </div>
      )}
    </div>
  );
}

/**
 * 2. Email Sentiment Filter Control
 */
function EmailSentimentControl({ conf = {}, onChange }) {
  const sentiment = conf.sentiment || 'Positive';
  const update = (patch) => onChange({ ...conf, ...patch });

  return (
    <div className="space-y-2.5 text-[13px]">
      <ZohoSelect
        value={sentiment}
        onChange={(v) => update({ sentiment: v })}
        options={EMAIL_SENTIMENTS}
      />
      <DateOperatorGroup conf={conf} onChange={onChange} />
    </div>
  );
}

/**
 * 3. Latest Email Status Filter Control
 */
function LatestEmailStatusControl({ conf = {}, onChange }) {
  const status = conf.status || 'sent';
  const subStatus = conf.subStatus || 'Any of the above';
  const update = (patch) => onChange({ ...conf, ...patch });

  return (
    <div className="space-y-2.5 text-[13px]">
      <ZohoSelect
        value={status}
        onChange={(v) => update({ status: v })}
        options={LATEST_EMAIL_STATUSES}
      />

      <DateOperatorGroup conf={conf} onChange={onChange} />

      {status === 'sent' && (
        <div className="pt-2 border-t border-slate-100 space-y-1.5">
          <div className="text-[12px] font-semibold text-ink-600">and status is:</div>
          <div className="space-y-1.5 pl-1 max-h-40 overflow-y-auto thin-scroll">
            {EMAIL_SENT_SUB_STATUSES.map((sub) => (
              <label key={sub} className="flex items-center gap-2 text-[12.5px] text-ink-700 cursor-pointer">
                <input
                  type="radio"
                  name="sent-sub-status"
                  checked={subStatus === sub}
                  onChange={() => update({ subStatus: sub })}
                  className="text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                />
                <span className="capitalize">{sub}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 4. Locked Filter Control
 */
function LockedControl({ conf = {}, onChange }) {
  const val = conf.value || 'True';
  const update = (patch) => onChange({ ...conf, ...patch });

  return (
    <div className="space-y-2 text-[13px]">
      <label className="flex items-center gap-2 text-ink-700 cursor-pointer">
        <input
          type="radio"
          name="locked-filter-val"
          checked={val === 'True'}
          onChange={() => update({ value: 'True' })}
          className="text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
        />
        <span>True</span>
      </label>
      <label className="flex items-center gap-2 text-ink-700 cursor-pointer">
        <input
          type="radio"
          name="locked-filter-val"
          checked={val === 'False'}
          onChange={() => update({ value: 'False' })}
          className="text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
        />
        <span>False</span>
      </label>
    </div>
  );
}

/**
 * 5. Record Action Filter Control
 */
function RecordActionControl({ conf = {}, onChange }) {
  const action = conf.action || 'Modified';
  const actor = conf.actor || 'User & System';
  const update = (patch) => onChange({ ...conf, ...patch });

  return (
    <div className="space-y-2.5 text-[13px]">
      <ZohoSelect
        value={action}
        onChange={(v) => update({ action: v })}
        options={['Modified', 'Not Modified']}
      />

      <div className="flex items-center gap-2">
        <span className="text-[12px] font-medium text-ink-500 w-6 shrink-0">By</span>
        <div className="flex-1">
          <ZohoSelect
            value={actor}
            onChange={(v) => update({ actor: v })}
            options={ACTOR_OPTIONS}
          />
        </div>
      </div>

      <DateOperatorGroup conf={conf} onChange={onChange} />
    </div>
  );
}

/**
 * 6. Related Records Action Filter Control
 */
function RelatedRecordsActionControl({ conf = {}, onChange }) {
  const action = conf.action || 'Done';
  const actor = conf.actor || 'User & System';
  const update = (patch) => onChange({ ...conf, ...patch });

  return (
    <div className="space-y-2.5 text-[13px]">
      <ZohoSelect
        value={action}
        onChange={(v) => update({ action: v })}
        options={['Done', 'Not Done']}
      />

      <div className="flex items-center gap-2">
        <span className="text-[12px] font-medium text-ink-500 w-6 shrink-0">By</span>
        <div className="flex-1">
          <ZohoSelect
            value={actor}
            onChange={(v) => update({ actor: v })}
            options={ACTOR_OPTIONS}
          />
        </div>
      </div>

      <DateOperatorGroup conf={conf} onChange={onChange} />
    </div>
  );
}

/**
 * 7. Scoring Rules Filter Control
 */
function ScoringRulesControl({ conf = {}, onChange }) {
  const rule = conf.rule || 'None';
  const scoreType = conf.scoreType || 'Positive Score';
  const op = conf.op || '>=';
  const num = conf.num !== undefined ? conf.num : 10;
  const num2 = conf.num2 !== undefined ? conf.num2 : 100;
  const update = (patch) => onChange({ ...conf, ...patch });

  return (
    <div className="space-y-2.5 text-[13px]">
      <ZohoSelect
        value={rule}
        onChange={(v) => update({ rule: v })}
        options={SCORING_RULES}
      />

      <div className="space-y-1.5 pt-0.5">
        <label className="flex items-center gap-2 text-ink-700 cursor-pointer">
          <input
            type="radio"
            name="scoring-rules-type"
            checked={scoreType === 'Positive Score'}
            onChange={() => update({ scoreType: 'Positive Score' })}
            className="text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
          />
          <span>Positive Score</span>
        </label>
        <label className="flex items-center gap-2 text-ink-700 cursor-pointer">
          <input
            type="radio"
            name="scoring-rules-type"
            checked={scoreType === 'Negative Score'}
            onChange={() => update({ scoreType: 'Negative Score' })}
            className="text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
          />
          <span>Negative Score</span>
        </label>
      </div>

      <div className="space-y-2 pt-1 border-t border-slate-100">
        <ZohoSelect
          value={op}
          onChange={(v) => update({ op: v })}
          options={COMPARISON_OPERATORS}
        />

        {['between', 'not between'].includes(op) ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={num}
              onChange={(e) => update({ num: Number(e.target.value) || 0 })}
              className="w-1/2 h-8 px-2 text-[13px] bg-white border border-line rounded text-center focus:outline-none focus:border-primary"
              placeholder="Min"
            />
            <span className="text-ink-400 text-xs">to</span>
            <input
              type="number"
              value={num2}
              onChange={(e) => update({ num2: Number(e.target.value) || 0 })}
              className="w-1/2 h-8 px-2 text-[13px] bg-white border border-line rounded text-center focus:outline-none focus:border-primary"
              placeholder="Max"
            />
          </div>
        ) : (
          <input
            type="number"
            value={num}
            onChange={(e) => update({ num: Number(e.target.value) || 0 })}
            className="w-full h-8 px-2 text-[13px] bg-white border border-line rounded text-center focus:outline-none focus:border-primary"
            placeholder="Score value"
          />
        )}
      </div>
    </div>
  );
}

/**
 * 8. Touched Records Filter Control
 */
function TouchedRecordsControl({ conf = {}, onChange }) {
  const actor = conf.actor || 'User & System';
  const update = (patch) => onChange({ ...conf, ...patch });

  return (
    <div className="space-y-2.5 text-[13px]">
      <div className="flex items-center gap-2">
        <span className="text-[12px] font-medium text-ink-500 w-6 shrink-0">By</span>
        <div className="flex-1">
          <ZohoSelect
            value={actor}
            onChange={(v) => update({ actor: v })}
            options={ACTOR_OPTIONS}
          />
        </div>
      </div>
      <DateOperatorGroup conf={conf} onChange={onChange} />
    </div>
  );
}

/**
 * 9. Untouched Records Filter Control
 */
function UntouchedRecordsControl({ conf = {}, onChange }) {
  const actor = conf.actor || 'User & System';
  const update = (patch) => onChange({ ...conf, ...patch });

  return (
    <div className="space-y-2.5 text-[13px]">
      <div className="flex items-center gap-2">
        <span className="text-[12px] font-medium text-ink-500 w-6 shrink-0">By</span>
        <div className="flex-1">
          <ZohoSelect
            value={actor}
            onChange={(v) => update({ actor: v })}
            options={ACTOR_OPTIONS}
          />
        </div>
      </div>
      <DateOperatorGroup conf={conf} onChange={onChange} />
    </div>
  );
}

/**
 * 10. Cadences Filter Control (Additional support for Cadences in SYSTEM_FILTERS)
 */
function CadencesControl({ conf = {}, onChange }) {
  const status = conf.status || 'Enrolled';
  const update = (patch) => onChange({ ...conf, ...patch });

  return (
    <div className="space-y-2 text-[13px]">
      <ZohoSelect
        value={status}
        onChange={(v) => update({ status: v })}
        options={['Enrolled', 'Not Enrolled', 'Active', 'Paused', 'Completed']}
      />
    </div>
  );
}

/**
 * Master dispatcher for system filter controls
 */
export default function SystemFilterControls({ field, conf, onChange }) {
  switch (field) {
    case 'Activities':
      return <ActivitiesControl conf={conf} onChange={onChange} />;
    case 'Email Sentiment':
      return <EmailSentimentControl conf={conf} onChange={onChange} />;
    case 'Latest Email Status':
      return <LatestEmailStatusControl conf={conf} onChange={onChange} />;
    case 'Locked':
      return <LockedControl conf={conf} onChange={onChange} />;
    case 'Record Action':
      return <RecordActionControl conf={conf} onChange={onChange} />;
    case 'Related Records Action':
      return <RelatedRecordsActionControl conf={conf} onChange={onChange} />;
    case 'Scoring Rules':
      return <ScoringRulesControl conf={conf} onChange={onChange} />;
    case 'Touched Records':
      return <TouchedRecordsControl conf={conf} onChange={onChange} />;
    case 'Untouched Records':
      return <UntouchedRecordsControl conf={conf} onChange={onChange} />;
    case 'Cadences':
      return <CadencesControl conf={conf} onChange={onChange} />;
    default:
      return null;
  }
}

/**
 * Get initial default configuration for each system filter
 */
export const getDefaultSystemFilterConfig = (field) => {
  switch (field) {
    case 'Activities':
      return {
        type: 'system',
        mode: 'due',
        dueOption: 'Today + Overdue',
      };
    case 'Email Sentiment':
      return {
        type: 'system',
        sentiment: 'Positive',
        dateOp: 'age in',
        num: 2,
        unit: 'days',
        d1: '',
        d2: '',
      };
    case 'Latest Email Status':
      return {
        type: 'system',
        status: 'sent',
        subStatus: 'Any of the above',
        dateOp: 'age in',
        num: 2,
        unit: 'days',
        d1: '',
        d2: '',
      };
    case 'Locked':
      return {
        type: 'system',
        value: 'True',
      };
    case 'Record Action':
      return {
        type: 'system',
        action: 'Modified',
        actor: 'User & System',
        dateOp: 'age in',
        num: 2,
        unit: 'days',
        d1: '',
        d2: '',
      };
    case 'Related Records Action':
      return {
        type: 'system',
        action: 'Done',
        actor: 'User & System',
        dateOp: 'age in',
        num: 2,
        unit: 'days',
        d1: '',
        d2: '',
      };
    case 'Scoring Rules':
      return {
        type: 'system',
        rule: 'None',
        scoreType: 'Positive Score',
        op: '>=',
        num: 10,
        num2: 100,
      };
    case 'Touched Records':
      return {
        type: 'system',
        actor: 'User & System',
        dateOp: 'age in',
        num: 2,
        unit: 'days',
        d1: '',
        d2: '',
      };
    case 'Untouched Records':
      return {
        type: 'system',
        actor: 'User & System',
        dateOp: 'age in',
        num: 2,
        unit: 'days',
        d1: '',
        d2: '',
      };
    case 'Cadences':
      return {
        type: 'system',
        status: 'Enrolled',
      };
    default:
      return { op: 'Equals', val: '' };
  }
};

/**
 * Robust date comparison matching all 15 Zoho CRM date operators
 */
export function matchesDateCondition(dateStr, op = 'age in', num = 2, unit = 'days', d1 = '', d2 = '') {
  if (!dateStr) return false;

  const target = new Date(dateStr.length >= 10 ? dateStr.slice(0, 10) + 'T00:00:00' : dateStr);
  if (isNaN(target.getTime())) return false;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const oneDayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((today.getTime() - target.getTime()) / oneDayMs);

  // Unit multiplier in days
  const unitMultiplier = unit === 'months' ? 30 : unit === 'weeks' ? 7 : 1;
  const maxDays = (Number(num) || 0) * unitMultiplier;

  switch (op) {
    case 'age in':
      // Record age is within or equal to the specified unit
      return diffDays >= 0 && diffDays <= maxDays;

    case 'Previous':
      // Previous N units in the past
      return diffDays > 0 && diffDays <= maxDays;

    case 'Next':
      // Next N units in the future
      return diffDays < 0 && Math.abs(diffDays) <= maxDays;

    case 'On':
      return d1 ? dateStr.slice(0, 10) === d1 : true;

    case 'before':
      return d1 ? dateStr.slice(0, 10) < d1 : true;

    case 'after':
      return d1 ? dateStr.slice(0, 10) > d1 : true;

    case 'between':
      if (d1 && d2) {
        const dt = dateStr.slice(0, 10);
        return dt >= d1 && dt <= d2;
      }
      return true;

    case 'Today':
      return diffDays === 0;

    case 'Yesterday':
      return diffDays === 1;

    case 'This Week': {
      const currentDay = today.getDay(); // 0 is Sunday
      const mondayOffset = (currentDay === 0 ? -6 : 1) - currentDay;
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() + mondayOffset);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return target >= startOfWeek && target <= endOfWeek;
    }

    case 'This Month':
      return target.getFullYear() === today.getFullYear() && target.getMonth() === today.getMonth();

    case 'This Year':
      return target.getFullYear() === today.getFullYear();

    case 'Previous Week': {
      const currentDay = today.getDay();
      const mondayOffset = (currentDay === 0 ? -6 : 1) - currentDay;
      const startOfLastWeek = new Date(today);
      startOfLastWeek.setDate(today.getDate() + mondayOffset - 7);
      const endOfLastWeek = new Date(startOfLastWeek);
      endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
      return target >= startOfLastWeek && target <= endOfLastWeek;
    }

    case 'Previous Month': {
      const prevMonth = today.getMonth() === 0 ? 11 : today.getMonth() - 1;
      const prevYear = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();
      return target.getFullYear() === prevYear && target.getMonth() === prevMonth;
    }

    case 'Until Now':
      return target <= now;

    default:
      return true;
  }
}

/**
 * Filter evaluator for the 9 Zoho CRM System Defined Filters
 */
export function evaluateSystemFilter(deal, field, conf, context = {}) {
  if (!deal || !conf) return true;

  const {
    calls = [],
    tasks = [],
    activity = [],
    contacts = []
  } = context;

  const todayIso = new Date().toISOString().slice(0, 10);

  // Helper: get tomorrow's ISO date
  const getTomorrowIso = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  };

  // Helper: get ISO date after N days
  const getAfterDaysIso = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };

  switch (field) {
    case 'Activities': {
      // Find related open activities for this deal
      const dealCalls = calls.filter(
        (c) =>
          c.dealId === deal.id ||
          (deal.contactId && c.contactId === deal.contactId) ||
          (deal.accountId && c.accountId === deal.accountId)
      );
      const openCalls = dealCalls.filter(
        (c) => c.status === 'Scheduled' || (c.status !== 'Completed' && c.status !== 'Missed')
      );

      const dealTasks = tasks.filter(
        (t) => t.recordId === deal.id || t.dealId === deal.id
      );
      const openTasks = dealTasks.filter((t) => t.status !== 'Completed');

      // Combine open activities with their due dates
      const openActivities = [
        ...openCalls.map((c) => ({
          type: 'Call',
          dueDate: c.dateTime ? c.dateTime.slice(0, 10) : c.date || todayIso
        })),
        ...openTasks.map((t) => ({
          type: 'Task',
          dueDate: t.dueDate || t.date || todayIso
        }))
      ];

      if (conf.mode === 'without') {
        return openActivities.length === 0;
      }

      if (conf.mode === 'overdue') {
        return openActivities.some((a) => a.dueDate < todayIso);
      }

      if (conf.mode === 'due') {
        const dueOpt = conf.dueOption || 'Today + Overdue';
        if (dueOpt === 'Today') {
          return openActivities.some((a) => a.dueDate === todayIso);
        }
        if (dueOpt === 'Tomorrow') {
          return openActivities.some((a) => a.dueDate === getTomorrowIso());
        }
        if (dueOpt === 'Next 7 days') {
          const next7 = getAfterDaysIso(7);
          return openActivities.some((a) => a.dueDate >= todayIso && a.dueDate <= next7);
        }
        if (dueOpt === 'Today + Overdue') {
          return openActivities.some((a) => a.dueDate <= todayIso);
        }
      }
      return true;
    }

    case 'Email Sentiment': {
      // Determine deal sentiment: deal.sentiment, remarks/notes, or contact status
      const contact = contacts.find((c) => c.id === deal.contactId);
      let dealSentiment = deal.sentiment;
      if (!dealSentiment) {
        const remarks = (deal.remarks || '').toLowerCase();
        if (remarks.includes('not interested') || remarks.includes('lost') || deal.stage === 'Closed Lost') {
          dealSentiment = 'Negative';
        } else if (remarks.includes('busy') || remarks.includes('rnr') || remarks.includes('switch off')) {
          dealSentiment = 'Neutral';
        } else if (deal.stage.includes('Won') || deal.stage.includes('Invoice') || remarks.includes('interested')) {
          dealSentiment = 'Positive';
        } else if (contact?.emailStatus === 'Opened' || contact?.emailStatus === 'Clicked') {
          dealSentiment = 'Positive';
        } else if (contact?.emailStatus === 'Bounced') {
          dealSentiment = 'Negative';
        } else {
          dealSentiment = 'Positive';
        }
      }

      // Check sentiment match
      const targetSentiment = conf.sentiment || 'Positive';
      let sentimentMatches = false;
      if (targetSentiment === 'Positive') sentimentMatches = dealSentiment === 'Positive';
      else if (targetSentiment === 'Negative') sentimentMatches = dealSentiment === 'Negative';
      else if (targetSentiment === 'Neutral') sentimentMatches = dealSentiment === 'Neutral';
      else if (targetSentiment === 'Positive and Negative') sentimentMatches = dealSentiment === 'Positive' || dealSentiment === 'Negative';
      else if (targetSentiment === 'Positive or Negative') sentimentMatches = dealSentiment === 'Positive' || dealSentiment === 'Negative';
      else if (targetSentiment === 'Positive Only') sentimentMatches = dealSentiment === 'Positive';
      else if (targetSentiment === 'Negative Only') sentimentMatches = dealSentiment === 'Negative';
      else sentimentMatches = true;

      if (!sentimentMatches) return false;

      // Check date condition against deal createdTime/modifiedTime/lastActivityTime
      const dateToCheck = deal.lastActivityTime || deal.modifiedTime || deal.createdTime || deal.createdOn;
      return matchesDateCondition(dateToCheck, conf.dateOp, conf.num, conf.unit, conf.d1, conf.d2);
    }

    case 'Latest Email Status': {
      const contact = contacts.find((c) => c.id === deal.contactId);
      const emailStatus = (deal.latestEmailStatus || contact?.emailStatus || 'sent').toLowerCase();

      const targetStatus = (conf.status || 'sent').toLowerCase();
      if (emailStatus !== targetStatus && targetStatus !== 'sent') {
        return false;
      }

      if (targetStatus === 'sent' && conf.subStatus && conf.subStatus !== 'Any of the above') {
        const targetSub = conf.subStatus.toLowerCase();
        if (emailStatus !== targetSub) return false;
      }

      const dateToCheck = deal.lastActivityTime || deal.modifiedTime || deal.createdTime || deal.createdOn;
      return matchesDateCondition(dateToCheck, conf.dateOp, conf.num, conf.unit, conf.d1, conf.d2);
    }

    case 'Locked': {
      const isLocked = Boolean(deal.locked || deal.isLocked);
      return conf.value === 'True' ? isLocked : !isLocked;
    }

    case 'Record Action': {
      // Check if record was modified
      const isModified = Boolean(deal.modifiedTime && deal.modifiedTime !== deal.createdTime);
      const wantsModified = (conf.action || 'Modified') === 'Modified';
      if (wantsModified !== isModified) return false;

      // Check Actor if modified
      if (wantsModified && conf.actor) {
        const actor = conf.actor;
        const modifiedBy = deal.modifiedBy || 'user';
        if (actor === 'User' || actor === 'Only by User') {
          if (modifiedBy.toLowerCase().includes('system') || modifiedBy.toLowerCase().includes('workflow')) return false;
        } else if (actor === 'System' || actor === 'Only by System') {
          if (!modifiedBy.toLowerCase().includes('system') && !modifiedBy.toLowerCase().includes('workflow')) return false;
        }
      }

      const dateToCheck = deal.modifiedTime || deal.createdTime || deal.createdOn;
      return matchesDateCondition(dateToCheck, conf.dateOp, conf.num, conf.unit, conf.d1, conf.d2);
    }

    case 'Related Records Action': {
      // Checks whether related records (calls, tasks, activities) have been done
      const relatedCalls = calls.filter((c) => c.dealId === deal.id || (deal.contactId && c.contactId === deal.contactId));
      const relatedTasks = tasks.filter((t) => t.recordId === deal.id || t.dealId === deal.id);
      const hasRelatedDone = relatedCalls.some((c) => c.status === 'Completed') || relatedTasks.some((t) => t.status === 'Completed');

      const wantsDone = (conf.action || 'Done') === 'Done';
      if (wantsDone !== hasRelatedDone) return false;

      const dateToCheck = deal.lastActivityTime || deal.modifiedTime || deal.createdTime || deal.createdOn;
      return matchesDateCondition(dateToCheck, conf.dateOp, conf.num, conf.unit, conf.d1, conf.d2);
    }

    case 'Scoring Rules': {
      const score = deal.score !== undefined ? Number(deal.score) : Number(deal.probability) || 0;
      const isPositive = score >= 0;
      if (conf.scoreType === 'Positive Score' && !isPositive) return false;
      if (conf.scoreType === 'Negative Score' && isPositive) return false;

      const op = conf.op || '>=';
      const targetNum = Number(conf.num) || 0;
      const targetNum2 = Number(conf.num2) || 0;

      switch (op) {
        case '=':
          return score === targetNum;
        case '!=':
          return score !== targetNum;
        case '<':
          return score < targetNum;
        case '<=':
          return score <= targetNum;
        case '>':
          return score > targetNum;
        case '>=':
          return score >= targetNum;
        case 'between':
          return score >= targetNum && score <= targetNum2;
        case 'not between':
          return score < targetNum || score > targetNum2;
        default:
          return true;
      }
    }

    case 'Touched Records': {
      // Touched record has had interaction/calls/activities within the date condition
      const relatedCalls = calls.filter((c) => c.dealId === deal.id || (deal.contactId && c.contactId === deal.contactId));
      const isTouched = deal.touched === true || relatedCalls.length > 0 || Boolean(deal.lastActivityTime);
      if (!isTouched) return false;

      const dateToCheck = deal.lastActivityTime || deal.modifiedTime || deal.createdTime || deal.createdOn;
      return matchesDateCondition(dateToCheck, conf.dateOp, conf.num, conf.unit, conf.d1, conf.d2);
    }

    case 'Untouched Records': {
      // Untouched record has NOT had recent interactions
      const relatedCalls = calls.filter((c) => c.dealId === deal.id || (deal.contactId && c.contactId === deal.contactId));
      const isTouched = deal.touched === true || relatedCalls.length > 0 || Boolean(deal.lastActivityTime);
      if (isTouched) return false;

      const dateToCheck = deal.createdTime || deal.createdOn;
      return matchesDateCondition(dateToCheck, conf.dateOp, conf.num, conf.unit, conf.d1, conf.d2);
    }

    case 'Cadences': {
      const status = conf.status || 'Enrolled';
      const cadenceStatus = deal.cadenceStatus || (deal.stage.includes('Won') ? 'Completed' : 'Enrolled');
      return cadenceStatus.toLowerCase() === status.toLowerCase();
    }

    default:
      return true;
  }
}

