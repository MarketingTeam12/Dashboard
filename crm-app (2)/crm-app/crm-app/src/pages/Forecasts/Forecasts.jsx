import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CalendarPlus,
  Check,
  ChevronDown,
  Download,
  ExternalLink,
  HelpCircle,
  Layers,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldAlert,
  Trash2,
  TrendingUp,
  User,
  Users,
  X,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import StatusBadge from '../../components/common/StatusBadge';
import { useToast } from '../../components/common/Toast';
import { useUrlActions } from '../../components/common/hooks';
import { DEPARTMENTS } from '../../data/seedData';
import {
  STAGES,
  STAGE_PROBABILITY,
  fmtDate,
  isOpen,
  isWon,
  todayISO,
} from '../../utils/calculations';
import { exportCSV } from '../../utils/exportCSV';
import {
  FORECAST_DATE_FIELD,
  FORECAST_PERIOD_TYPES,
  FORECAST_REVENUE_TYPES,
  FORECAST_TIMEZONE,
  MONTH_PERIODS,
  QUARTERS,
  aggregateForecastMetrics,
  buildOrganizationHierarchy,
  calculateAnnualSubPeriods,
  calculateForecastMetrics,
  evaluateDealAnomalies,
  fmtForecastCurrency,
  fmtINR2,
  forecastMatchesScopeFilter,
  getCurrencySymbol,
  getDealForecastCategory,
  getNextPeriod,
  getPeriodBounds,
  resolveHierarchyTargets,
} from '../../utils/forecastCalculations';

const SAVED_VIEW_STORAGE_KEY = 'zcrm.v1.activeSavedForecastKey';

/**
 * Dropdown selector for Owner / Team / Role (e.g. "Forecast for CEO 🔍")
 */
function ScopeSelectorModal({ open, onClose, value, onChange, options }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.sub && o.sub.toLowerCase().includes(q)) ||
        o.group.toLowerCase().includes(q)
    );
  }, [options, query]);

  const groups = useMemo(() => {
    const map = new Map();
    filtered.forEach((o) => {
      if (!map.has(o.group)) map.set(o.group, []);
      map.get(o.group).push(o);
    });
    return Array.from(map.entries());
  }, [filtered]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scope-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl border border-line w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3.5 border-b border-line flex items-center justify-between bg-[#F8FAFD]">
          <h2 id="scope-modal-title" className="text-[14px] font-bold text-ink">
            Select User, Role, or Team for Forecast
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-ink-400 hover:text-ink p-1 rounded-md hover:bg-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-3 border-b border-line bg-white">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search user, role, or team..."
              aria-label="Search user or team"
              className="w-full h-8 pl-8 pr-2.5 rounded-md border border-line bg-[#F8FAFD] focus:bg-white text-[13px] text-ink placeholder:text-ink-400 focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="max-h-[320px] overflow-y-auto thin-scroll p-1.5 space-y-2">
          {groups.length === 0 && (
            <p className="px-3 py-6 text-center text-[12.5px] text-ink-500">
              No matching user or team for “{query}”.
            </p>
          )}
          {groups.map(([groupName, items]) => (
            <div key={groupName}>
              <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
                {groupName}
              </div>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const active = item.value === value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => {
                        onChange(item.value);
                        onClose();
                      }}
                      className={`w-full px-3 py-2 text-left rounded-lg flex items-center justify-between text-[13px] transition-colors ${
                        active
                          ? 'bg-[#EFF6FF] text-[#1967D2] font-semibold'
                          : 'text-ink hover:bg-page'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="truncate">{item.label}</div>
                        {item.sub && (
                          <div className="text-[11.5px] text-ink-400 truncate">{item.sub}</div>
                        )}
                      </div>
                      {active && <Check size={16} className="text-[#1967D2] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="p-2.5 bg-[#F8FAFD] border-t border-line text-right">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary h-7 px-3 text-[12px]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Gap cell displaying shortfall in red (▼ X.X%) or exceeded in green (▲ X.X%) or dash (—)
 */
function GapCell({ gap, shortfallPct, hasValidTarget }) {
  if (!hasValidTarget || shortfallPct == null) {
    return <span className="text-[#9CA3AF] font-normal" title="No target set for this period">—</span>;
  }

  if (gap > 0) {
    return (
      <span
        className="inline-flex items-center gap-1 text-[13px] font-medium text-[#D92D20] whitespace-nowrap"
        title={`Shortfall: ${fmtINR2(gap)} (${shortfallPct.toFixed(1)}%)`}
        aria-label={`Shortfall ${shortfallPct.toFixed(1)}%`}
      >
        <span aria-hidden="true" className="text-[11px] font-bold">▼</span>
        <span>{shortfallPct.toFixed(1)}%</span>
      </span>
    );
  }

  if (gap < 0) {
    const surplusPct = Math.abs(shortfallPct);
    return (
      <span
        className="inline-flex items-center gap-1 text-[13px] font-medium text-[#0E9F5E] whitespace-nowrap"
        title={`Target Exceeded: +${fmtINR2(Math.abs(gap))} (+${surplusPct.toFixed(1)}%)`}
        aria-label={`Target Exceeded +${surplusPct.toFixed(1)}%`}
      >
        <span aria-hidden="true" className="text-[11px] font-bold">▲</span>
        <span>{surplusPct.toFixed(1)}%</span>
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 text-[13px] font-medium text-[#0E9F5E] whitespace-nowrap"
      title="Target exactly met"
      aria-label="Target met 0.0%"
    >
      <span>0.0%</span>
    </span>
  );
}

/**
 * Category badge for deals
 */
function CategoryBadge({ category }) {
  const tones = {
    Commit: 'bg-[#ECFDF3] text-[#067647] border-[#ABEFC6]',
    'Best Case': 'bg-[#EFF8FF] text-[#175CD3] border-[#B2DDFF]',
    Pipeline: 'bg-[#F8FAFC] text-[#475569] border-[#CBD5E1]',
    'Closed Won': 'bg-[#ECFDF3] text-[#067647] border-[#6CE9A6]',
    Omitted: 'bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]',
  };
  const cls = tones[category] || tones.Pipeline;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium border ${cls}`}>
      {category}
    </span>
  );
}

/**
 * Helper to generate default prefilled forecast name from type and period
 */
function buildDefaultForecastName(periodType, year, periodKey, forecastType = 'Deal Revenue') {
  const typePrefix = forecastType && forecastType !== 'Deal Revenue' ? `${forecastType} ` : '';
  if (periodType === 'Annual') {
    return `${typePrefix}Annual Target ${year}`;
  }
  if (periodType === 'Quarterly') {
    return `${typePrefix}Quarter Target ${year}`;
  }
  const mObj = MONTH_PERIODS.find((x) => x.key === periodKey);
  if (periodKey === 'M01' && !typePrefix) {
    return `Jan ${year}`;
  }
  return `${typePrefix}${mObj?.label || 'Monthly'} ${year}`;
}

export default function Forecasts() {
  const {
    forecasts = [],
    deals = [],
    users = [],
    userName,
    accountName,
    createRecord,
    updateRecord,
    deleteRecords,
  } = useCRM();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Dashboard & Detail View Filters
  const [scopeFilter, setScopeFilter] = useState('ORG');
  const [typeFilter, setTypeFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('2026');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Saved Forecast Detail View state (Screenshot 1)
  // Persisted in URL searchParams (?series=...) or localStorage so reload keeps the saved view open
  const [selectedCardKey, setSelectedCardKey] = useState(() => {
    const fromUrl = searchParams.get('series');
    if (fromUrl) return fromUrl;
    try {
      return localStorage.getItem(SAVED_VIEW_STORAGE_KEY) || null;
    } catch {
      return null;
    }
  });

  // Period range selectors in Saved Forecast Detail View (e.g. Q1 2026 To Q3 2026)
  const [periodRangeFrom, setPeriodRangeFrom] = useState('');
  const [periodRangeTo, setPeriodRangeTo] = useState('');
  const [annualBreakdownMode, setAnnualBreakdownMode] = useState('Quarterly'); // 'Quarterly' | 'Monthly'
  const [rowMenuOpenId, setRowMenuOpenId] = useState(null);

  // Expanded rows set for period rows and annual sub-period rows
  const [expandedRows, setExpandedRows] = useState(() => new Set());

  // Scope selector modal state
  const [scopeModalOpen, setScopeModalOpen] = useState(false);

  // Settings dropdown state (for gear icon in top right)
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef(null);

  // Multi-step Create Forecast flow:
  // createModal.step === 1 -> Centered Create Forecast Modal (Screenshot 2)
  // createModal.step === 2 -> Dedicated full-page Set Target Hierarchy View (Screenshot 3)
  const [createModal, setCreateModal] = useState(null);

  // Expanded team nodes in the Set Target Hierarchy Tree (Screenshot 3)
  const [expandedHierarchyTeams, setExpandedHierarchyTeams] = useState(() => new Set(['ROLE:Sales Manager', 'ROLE:Account Executive', 'ROLE:Sales Executive', 'ROLE:Inside Sales']));

  // Inline edit, delete, and inspect modals
  const [editModal, setEditModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [anomalyModal, setAnomalyModal] = useState(null);
  const [dealEditModal, setDealEditModal] = useState(null);
  const [helpModal, setHelpModal] = useState(false);

  const today = todayISO();

  // Sync selectedCardKey with localStorage & URL searchParams so reload preserves the Saved Forecast View
  const selectSavedForecastCard = (cardKey) => {
    setSelectedCardKey(cardKey);
    setPeriodRangeFrom('');
    setPeriodRangeTo('');
    try {
      if (cardKey) {
        localStorage.setItem(SAVED_VIEW_STORAGE_KEY, cardKey);
      } else {
        localStorage.removeItem(SAVED_VIEW_STORAGE_KEY);
      }
    } catch {
      /* ignore */
    }
    const next = new URLSearchParams(searchParams);
    if (cardKey) {
      next.set('series', cardKey);
    } else {
      next.delete('series');
    }
    setSearchParams(next, { replace: true });
  };

  // Close gear settings menu on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (!settingsRef.current?.contains(e.target)) setSettingsOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Build scope options for selector & modals (Organization, Role Teams, Sales Departments, Users)
  const orgHierarchy = useMemo(() => buildOrganizationHierarchy(users), [users]);

  const scopeOptions = useMemo(() => {
    return [
      { value: 'ORG', label: 'CEO (Company-wide)', sub: 'Organization targets', group: 'Executive / Organization' },
      { value: 'ALL', label: 'All Users & Teams', sub: 'Every forecast scope', group: 'Executive / Organization' },
      ...orgHierarchy.teams.map((t) => ({
        value: t.id,
        label: `${t.label}`,
        sub: `${t.members.length} member(s)`,
        group: 'Role / Reporting Teams',
      })),
      ...DEPARTMENTS.map((d) => ({
        value: `DEPT:${d}`,
        label: `${d} Team`,
        sub: 'Sales Department',
        group: 'Sales Teams',
      })),
      ...users.map((u) => ({
        value: `USER:${u.id}`,
        label: u.name,
        sub: u.role,
        group: 'Sales Representatives',
      })),
    ];
  }, [users, orgHierarchy]);

  // Clean label for current scope display
  const currentScopeDisplay = useMemo(() => {
    if (scopeFilter === 'ORG') return 'CEO';
    if (scopeFilter === 'ALL') return 'All Users & Teams';
    if (scopeFilter.startsWith('ROLE:')) return scopeFilter.slice(5);
    if (scopeFilter.startsWith('DEPT:')) return `${scopeFilter.slice(5)} Team`;
    if (scopeFilter.startsWith('USER:')) return userName(scopeFilter.slice(5));
    return scopeFilter;
  }, [scopeFilter, userName]);

  const currentScopeSubtitle = useMemo(() => {
    if (scopeFilter === 'ORG') return 'CEO';
    if (scopeFilter === 'ALL') return 'Organization-wide';
    if (scopeFilter.startsWith('ROLE:')) return `${scopeFilter.slice(5)} Hierarchy`;
    if (scopeFilter.startsWith('DEPT:')) return 'Sales Department';
    if (scopeFilter.startsWith('USER:')) {
      const u = users.find((x) => x.id === scopeFilter.slice(5));
      return u?.role || 'Sales Representative';
    }
    return 'CEO';
  }, [scopeFilter, users]);

  const scopeLabel = (scopeVal) => {
    if (!scopeVal || scopeVal === 'ORG') return 'CEO';
    if (scopeVal === 'ALL') return 'All Users & Teams';
    if (scopeVal.startsWith('ROLE:')) return scopeVal.slice(5);
    if (scopeVal.startsWith('DEPT:')) return `${scopeVal.slice(5)} Team`;
    if (scopeVal.startsWith('USER:')) return userName(scopeVal.slice(5));
    return scopeVal;
  };

  // Available years from existing forecasts
  const availableYears = useMemo(() => {
    const set = new Set([2025, 2026, 2027]);
    forecasts.forEach((f) => {
      if (f.year) set.add(Number(f.year));
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [forecasts]);

  // Filter and calculate forecast rows
  const filteredComputedRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return forecasts
      .filter((fc) => {
        if (!forecastMatchesScopeFilter(fc, scopeFilter, users)) return false;
        if (typeFilter !== 'All') {
          if (FORECAST_PERIOD_TYPES.includes(typeFilter)) {
            if (fc.periodType !== typeFilter) return false;
          } else {
            if ((fc.revenueType || 'Deal Revenue') !== typeFilter) return false;
          }
        }
        if (yearFilter !== 'All' && String(fc.year) !== String(yearFilter)) return false;
        if (q) {
          const sLabel = scopeLabel(fc.scope).toLowerCase();
          const bounds = getPeriodBounds(fc.periodType, fc.year, fc.periodKey);
          const match =
            (fc.name || '').toLowerCase().includes(q) ||
            sLabel.includes(q) ||
            bounds.label.toLowerCase().includes(q);
          if (!match) return false;
        }
        return true;
      })
      .map((fc) => calculateForecastMetrics(fc, deals, users, today, scopeFilter));
  }, [forecasts, deals, users, scopeFilter, typeFilter, yearFilter, searchQuery, today]);

  // Group all forecasts into cards by (name, periodType, scope)
  const allForecastCards = useMemo(() => {
    const map = new Map();
    forecasts.forEach((fc) => {
      const row = calculateForecastMetrics(fc, deals, users, today, scopeFilter);
      const key = `${fc.name}__${fc.periodType}__${fc.scope}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          title: fc.name,
          periodType: fc.periodType,
          year: fc.year,
          scope: fc.scope,
          scopeDisplay: scopeLabel(fc.scope),
          revenueType: fc.revenueType || 'Deal Revenue',
          currency: fc.currency || 'INR',
          rows: [],
        });
      }
      map.get(key).rows.push(row);
    });

    const cards = Array.from(map.values());
    cards.forEach((c) => {
      c.rows.sort((a, b) => a.bounds.sortKey.localeCompare(b.bounds.sortKey));
      c.totals = aggregateForecastMetrics(c.rows);
    });
    return cards;
  }, [forecasts, deals, users, today, scopeFilter]);

  // Group filtered rows into vertically stacked cards for Dashboard view
  const forecastCards = useMemo(() => {
    const map = new Map();
    filteredComputedRows.forEach((row) => {
      const { forecast } = row;
      const key = `${forecast.name}__${forecast.periodType}__${forecast.scope}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          title: forecast.name,
          periodType: forecast.periodType,
          year: forecast.year,
          scope: forecast.scope,
          scopeDisplay: scopeLabel(forecast.scope),
          revenueType: forecast.revenueType || 'Deal Revenue',
          currency: forecast.currency || 'INR',
          rows: [],
        });
      }
      map.get(key).rows.push(row);
    });

    const cards = Array.from(map.values());
    cards.forEach((c) => {
      c.rows.sort((a, b) => a.bounds.sortKey.localeCompare(b.bounds.sortKey));
      c.totals = aggregateForecastMetrics(c.rows);
    });

    const preferredOrder = ['Quarter Target 2026', 'Jan 2026', 'February 2026', 'Monthly Target 2026'];
    cards.sort((a, b) => {
      const idxA = preferredOrder.indexOf(a.title);
      const idxB = preferredOrder.indexOf(b.title);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.title.localeCompare(b.title);
    });

    return cards;
  }, [filteredComputedRows]);

  // Active card for Saved Forecast Detail View (Screenshot 1)
  const activeSavedCard = useMemo(() => {
    if (!selectedCardKey) return null;
    return (
      allForecastCards.find((c) => c.key === selectedCardKey) ||
      allForecastCards.find((c) => c.title === selectedCardKey) ||
      null
    );
  }, [selectedCardKey, allForecastCards]);

  // Filter rows inside the Saved Forecast Detail View by the From / To period range selectors
  const activeSavedCardFilteredRows = useMemo(() => {
    if (!activeSavedCard) return [];
    const rows = activeSavedCard.rows;
    if (rows.length === 0) return [];
    const fromKey = periodRangeFrom || rows[0]?.bounds.sortKey || '';
    const toKey = periodRangeTo || rows[rows.length - 1]?.bounds.sortKey || '';
    const [minSort, maxSort] = fromKey <= toKey ? [fromKey, toKey] : [toKey, fromKey];
    return rows.filter((r) => r.bounds.sortKey >= minSort && r.bounds.sortKey <= maxSort);
  }, [activeSavedCard, periodRangeFrom, periodRangeTo]);

  const activeSavedCardTotals = useMemo(
    () => aggregateForecastMetrics(activeSavedCardFilteredRows),
    [activeSavedCardFilteredRows]
  );

  const toggleExpand = (id) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleHierarchyTeam = (teamId) => {
    setExpandedHierarchyTeams((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) next.delete(teamId);
      else next.add(teamId);
      return next;
    });
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.info('Forecast figures recalculated from live CRM deals.');
    }, 180);
  };

  // Helper to initialize hierarchy raw inputs from an existing forecast or blank
  const buildInitialHierarchyInputs = (sourceForecast = null, fallbackTarget = '') => {
    if (sourceForecast?.hierarchyRawInputs) {
      return { ...sourceForecast.hierarchyRawInputs };
    }
    if (sourceForecast?.hierarchyTargets) {
      const out = {};
      Object.entries(sourceForecast.hierarchyTargets).forEach(([k, v]) => {
        if (v !== undefined && v !== null) out[k] = String(v);
      });
      return out;
    }
    if (fallbackTarget !== '' && fallbackTarget !== undefined && fallbackTarget !== null) {
      return { ORG: String(fallbackTarget) };
    }
    return {};
  };

  // Helper to open Create Forecast Modal matching Screenshot 2
  const openCreateModal = (initialOverrides = {}) => {
    const defaultScope = scopeFilter === 'ALL' ? 'ORG' : scopeFilter;
    const defaultType = FORECAST_PERIOD_TYPES.includes(typeFilter) ? typeFilter : 'Quarterly';
    const defaultYear = yearFilter === 'All' ? 2026 : Number(yearFilter);
    const defaultPeriodKey =
      defaultType === 'Annual' ? 'FY' : defaultType === 'Quarterly' ? 'Q1' : 'M01';
    const fType = initialOverrides.forecastType || 'Deal Revenue';
    const pType = initialOverrides.periodType || defaultType;
    const pKey = initialOverrides.periodKey || defaultPeriodKey;
    const yr = initialOverrides.year || defaultYear;

    const prefilledName =
      initialOverrides.name || buildDefaultForecastName(pType, yr, pKey, fType);

    const initialHierarchyInputs =
      initialOverrides.hierarchyInputs ||
      buildInitialHierarchyInputs(
        initialOverrides.sourceForecast || null,
        initialOverrides.target !== undefined ? initialOverrides.target : ''
      );

    setCreateModal({
      step: initialOverrides.step || 1,
      editingForecastId: initialOverrides.editingForecastId || null,
      createOption: initialOverrides.createOption || 'new',
      sourceForecastId: initialOverrides.sourceForecastId || '',
      forecastType: fType,
      periodType: pType,
      periodKey: pKey,
      year: yr,
      name: prefilledName,
      nameManuallyEdited: Boolean(initialOverrides.name),
      forecastOn: initialOverrides.forecastOn || 'All Deals',
      selectedDealIds: initialOverrides.selectedDealIds || [],
      dealSearchQuery: '',
      target: initialOverrides.target !== undefined ? initialOverrides.target : '',
      hierarchyInputs: initialHierarchyInputs,
      scope: initialOverrides.scope || defaultScope,
      currency: initialOverrides.currency || 'INR',
      errors: {},
      isSubmitting: false,
      rolloverNote: initialOverrides.rolloverNote || null,
    });
  };

  // Open the dedicated Set Target page (Screenshot 3) to edit an existing forecast's hierarchy targets
  const openSetTargetForExistingForecast = (fc) => {
    if (!fc) return;
    openCreateModal({
      step: 2,
      editingForecastId: fc.id,
      forecastType: fc.revenueType || 'Deal Revenue',
      periodType: fc.periodType,
      periodKey: fc.periodKey,
      year: fc.year,
      name: fc.name,
      forecastOn: fc.forecastOn || 'All Deals',
      selectedDealIds: fc.selectedDealIds || [],
      target: fc.target ?? 0,
      sourceForecast: fc,
      scope: fc.scope || 'ORG',
      currency: fc.currency || 'INR',
    });
  };

  useUrlActions({
    onCreate: () => openCreateModal(),
    onOpen: (id) => {
      const found = forecasts.find((f) => f.id === id);
      if (found) {
        setScopeFilter(found.scope || 'ORG');
        setYearFilter(String(found.year));
        setExpandedRows((prev) => new Set(prev).add(found.id));
        selectSavedForecastCard(`${found.name}__${found.periodType}__${found.scope}`);
      }
    },
  });

  // Action: "Create for Next period"
  // Handles advancement and December / Q4 / Annual year rollover
  const handleCreateNextPeriod = (card) => {
    const cardForecasts = forecasts.filter(
      (f) => f.name === card.title && f.periodType === card.periodType && f.scope === card.scope
    );
    const sorted = [...cardForecasts].sort((a, b) => {
      const bA = getPeriodBounds(a.periodType, a.year, a.periodKey);
      const bB = getPeriodBounds(b.periodType, b.year, b.periodKey);
      return bB.sortKey.localeCompare(bA.sortKey);
    });

    const latest = sorted[0] || card.rows[card.rows.length - 1]?.forecast;
    if (!latest) return;
    const next = getNextPeriod(latest.periodType, latest.year, latest.periodKey);
    const nextBounds = getPeriodBounds(next.periodType, next.year, next.periodKey);

    let nextName = card.title;
    if (next.year !== Number(latest.year)) {
      nextName = nextName.replace(String(latest.year), String(next.year));
      if (nextName === card.title) {
        nextName = `${card.title} ${next.year}`;
      }
    }
    if (
      next.periodType === 'Monthly' &&
      card.rows.length === 1 &&
      MONTH_PERIODS.some((m) => card.title.toLowerCase().startsWith(m.short.toLowerCase()))
    ) {
      nextName = `${MONTH_PERIODS.find((m) => m.key === next.periodKey)?.label || 'Month'} ${next.year}`;
    }

    openCreateModal({
      createOption: 'existing',
      sourceForecastId: latest.id,
      sourceForecast: latest,
      forecastType: latest.revenueType || 'Deal Revenue',
      periodType: next.periodType,
      year: next.year,
      periodKey: next.periodKey,
      name: nextName,
      target: latest.target ?? 0,
      scope: latest.scope || 'ORG',
      forecastOn: latest.forecastOn || 'All Deals',
      selectedDealIds: latest.selectedDealIds ? [...latest.selectedDealIds] : [],
      rolloverNote: `Carrying forward configuration from ${latest.name} (${
        getPeriodBounds(latest.periodType, latest.year, latest.periodKey).shortLabel
      }) into ${nextBounds.label}.`,
    });
  };

  // Step 1 Validation -> Proceed to dedicated Set Target page (Step 2 / Screenshot 3)
  const handleStep1Next = (e) => {
    e.preventDefault();
    if (!createModal) return;

    const errors = {};
    const nameTrim = String(createModal.name || '').trim();
    if (!nameTrim) {
      errors.name = 'Forecast Name is required.';
    }

    if (!createModal.forecastType) {
      errors.forecastType = 'Please select a Forecast Type.';
    }

    if (!createModal.periodKey) {
      errors.periodKey = 'Please select a forecast period.';
    }

    if (createModal.createOption === 'existing' && !createModal.sourceForecastId) {
      errors.sourceForecastId = 'Please select an existing forecast to continue from.';
    }

    // Check duplicate forecast for same (scope, forecastType, periodType, year, periodKey)
    const duplicate = forecasts.find(
      (f) =>
        f.id !== createModal.editingForecastId &&
        f.scope === createModal.scope &&
        (f.revenueType || 'Deal Revenue') === createModal.forecastType &&
        f.periodType === createModal.periodType &&
        Number(f.year) === Number(createModal.year) &&
        f.periodKey === createModal.periodKey
    );

    if (duplicate) {
      const b = getPeriodBounds(createModal.periodType, createModal.year, createModal.periodKey);
      errors.periodKey = `A ${createModal.periodType.toLowerCase()} forecast already exists for ${b.shortLabel} ("${duplicate.name}"). Select another period or edit the existing forecast.`;
    }

    if (createModal.forecastOn === 'Selected Deals' && createModal.selectedDealIds.length === 0) {
      errors.selectedDeals = 'Please select at least one eligible deal before proceeding.';
    }

    if (Object.keys(errors).length > 0) {
      setCreateModal((m) => ({ ...m, errors }));
      return;
    }

    setCreateModal((m) => ({ ...m, step: 2, errors: {} }));
  };

  // Live hierarchy resolution for Step 2 (Set Target page — Screenshot 3)
  const resolvedHierarchy = useMemo(() => {
    if (!createModal) return null;
    return resolveHierarchyTargets(createModal.hierarchyInputs || {}, users);
  }, [createModal, users]);

  // Step 2 Submission -> Save all hierarchy targets together & open Saved Forecast Detail View (Screenshot 1)
  const handleSaveForecast = (e) => {
    if (e) e.preventDefault();
    if (!createModal || createModal.isSubmitting) return;

    const hierarchyRes = resolveHierarchyTargets(createModal.hierarchyInputs || {}, users);
    if (!hierarchyRes.isValid) {
      setCreateModal((m) => ({
        ...m,
        errors: {
          ...m.errors,
          hierarchy: 'Please enter valid non-negative target amounts across all fields.',
          fieldErrors: hierarchyRes.errors,
        },
      }));
      toast.error('Please fix invalid target amounts before saving.');
      return;
    }

    // Determine effective target: if user entered hierarchy inputs, use companyEffectiveTarget;
    // otherwise fall back to createModal.target if set.
    const hasAnyHierarchyInput = Object.values(createModal.hierarchyInputs || {}).some(
      (v) => v !== undefined && v !== null && String(v).trim() !== ''
    );
    const effectiveCompanyTarget = hasAnyHierarchyInput
      ? hierarchyRes.companyEffectiveTarget
      : Math.max(0, Number(createModal.target) || 0);

    const finalEffectiveMap = {
      ...hierarchyRes.effectiveMap,
      ORG: effectiveCompanyTarget,
    };

    setCreateModal((m) => ({ ...m, isSubmitting: true, errors: {} }));

    const cleanName = String(createModal.name || '').trim();
    const payload = {
      name: cleanName,
      periodType: createModal.periodType,
      year: Number(createModal.year),
      periodKey: createModal.periodKey,
      scope: createModal.scope || 'ORG',
      target: effectiveCompanyTarget,
      hierarchyTargets: finalEffectiveMap,
      hierarchyRawInputs: { ...(createModal.hierarchyInputs || {}), ORG: String(effectiveCompanyTarget) },
      parentTargetMode: hierarchyRes.companyMode,
      currency: createModal.currency || 'INR',
      revenueType: createModal.forecastType,
      forecastOn: createModal.forecastOn,
      selectedDealIds: createModal.forecastOn === 'Selected Deals' ? [...createModal.selectedDealIds] : [],
    };

    setTimeout(() => {
      let savedRecord = null;
      if (createModal.editingForecastId) {
        savedRecord = updateRecord('forecasts', createModal.editingForecastId, payload);
      } else {
        savedRecord = createRecord('forecasts', payload);
      }

      // Ensure filters include the saved forecast
      if (yearFilter !== 'All' && String(yearFilter) !== String(payload.year)) {
        setYearFilter(String(payload.year));
      }
      if (typeFilter !== 'All') {
        setTypeFilter('All');
      }
      if (scopeFilter !== 'ALL' && scopeFilter !== payload.scope) {
        setScopeFilter(payload.scope);
      }
      if (savedRecord?.id) {
        setExpandedRows((prev) => new Set(prev).add(savedRecord.id));
      }

      const cardKey = `${payload.name}__${payload.periodType}__${payload.scope}`;
      selectSavedForecastCard(cardKey);

      toast.success(
        `Saved forecast "${payload.name}" (${getPeriodBounds(payload.periodType, payload.year, payload.periodKey).shortLabel}) with targets.`
      );
      setCreateModal(null);
    }, 100);
  };

  // Eligible deals for the chosen period in Create Forecast Dialog
  const eligibleDealsForPeriod = useMemo(() => {
    if (!createModal) return [];
    const bounds = getPeriodBounds(createModal.periodType, createModal.year, createModal.periodKey);
    return deals.filter((d) => {
      if (!isWon(d) && !isOpen(d)) return false;
      const cDate = (d.closingDate || '').slice(0, 10);
      if (!cDate) {
        const crDate = (d.createdOn || '').slice(0, 10);
        return crDate >= bounds.from && crDate <= bounds.to;
      }
      return cDate >= bounds.from && cDate <= bounds.to;
    });
  }, [createModal, deals]);

  // Filtered deals inside the searchable Selected Deals picker
  const searchedDealsForPicker = useMemo(() => {
    if (!createModal) return [];
    const q = String(createModal.dealSearchQuery || '').trim().toLowerCase();
    if (!q) return eligibleDealsForPeriod;
    return eligibleDealsForPeriod.filter(
      (d) =>
        (d.name || '').toLowerCase().includes(q) ||
        (d.stage || '').toLowerCase().includes(q) ||
        accountName(d.accountId).toLowerCase().includes(q) ||
        userName(d.ownerId).toLowerCase().includes(q)
    );
  }, [createModal, eligibleDealsForPeriod, accountName, userName]);

  // Export filtered rows to CSV
  const handleExportCSV = () => {
    const rowsToExport = activeSavedCard ? activeSavedCardFilteredRows : filteredComputedRows;
    if (rowsToExport.length === 0) {
      toast.error('No forecast rows match the current filters to export.');
      return;
    }
    exportCSV(`forecasts-${yearFilter}-${today}`, rowsToExport, [
      { label: 'Forecast Name', value: (r) => r.forecast.name },
      { label: 'Scope', value: (r) => scopeLabel(r.effectiveScope || r.forecast.scope) },
      { label: 'Revenue Type', value: (r) => r.forecast.revenueType || 'Deal Revenue' },
      { label: 'Period Type', value: (r) => r.forecast.periodType },
      { label: 'Period', value: (r) => r.bounds.shortLabel },
      { label: 'Target (INR)', value: (r) => (r.hasValidTarget ? fmtINR2(r.target) : '—') },
      { label: 'Achievement (INR)', value: (r) => fmtINR2(r.achievement) },
      { label: 'Achievement (%)', value: (r) => (r.hasValidTarget ? `${r.achievementPct.toFixed(1)}%` : '—') },
      {
        label: 'Gap Status',
        value: (r) =>
          !r.hasValidTarget
            ? '—'
            : r.gap > 0
            ? `Shortfall (${r.shortfallPct.toFixed(1)}%)`
            : r.gap < 0
            ? `Exceeded (+${Math.abs(r.shortfallPct).toFixed(1)}%)`
            : 'Target Met (0.0%)',
      },
      { label: 'Predicted Achievement (INR)', value: (r) => fmtINR2(r.predictedAchievement) },
      { label: 'Pipeline (INR)', value: (r) => fmtINR2(r.pipeline) },
      { label: 'Committed (INR)', value: (r) => fmtINR2(r.committed) },
      { label: 'Best Case (INR)', value: (r) => fmtINR2(r.bestCase) },
    ]);
    toast.success(`Exported ${rowsToExport.length} forecast row(s) to CSV.`);
  };

  // Quick edit of a deal to verify live forecast updates
  const handleDealEditSave = (e) => {
    e.preventDefault();
    if (!dealEditModal) return;
    const amt = Number(dealEditModal.amount);
    const prob = Number(dealEditModal.probability);
    if (!dealEditModal.name?.trim() || !Number.isFinite(amt) || amt < 0 || !Number.isFinite(prob) || prob < 0 || prob > 100) {
      toast.error('Please enter a valid deal name, non-negative amount, and probability (0–100%).');
      return;
    }
    updateRecord('deals', dealEditModal.id, {
      name: dealEditModal.name.trim(),
      amount: amt,
      stage: dealEditModal.stage,
      probability: prob,
      forecastCategory: dealEditModal.forecastCategory,
      closingDate: dealEditModal.closingDate,
      ownerId: dealEditModal.ownerId,
      department: dealEditModal.department,
    });
    toast.success(`Updated deal "${dealEditModal.name}". Forecast metrics recalculated.`);
    setDealEditModal(null);
  };

  // Shared Renderer for Expanded Period Row Details (Teams, Owners, Deals, and Annual Breakdown)
  const renderExpandedPeriodDetails = (row) => {
    const { forecast, bounds } = row;
    const isAnnual = forecast.periodType === 'Annual';
    const annualSubRows = isAnnual
      ? calculateAnnualSubPeriods(forecast, annualBreakdownMode, deals, users, today, scopeFilter)
      : [];

    return (
      <div className="space-y-4">
        {/* If Annual Forecast: Expandable Breakdown by Quarter or Month */}
        {isAnnual && (
          <div className="bg-white border border-[#DCE3EE] rounded-lg p-3.5 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <h4 className="text-[13px] font-bold text-[#0F172A]">
                  Annual Breakdown by {annualBreakdownMode === 'Monthly' ? 'Month (Jan – Dec)' : 'Quarter (Q1 – Q4)'}
                </h4>
                <span className="text-[11.5px] text-[#64748B]">
                  ({bounds.shortLabel})
                </span>
              </div>
              <div className="inline-flex items-center rounded-md border border-[#CBD5E1] bg-[#F8FAFC] p-0.5 text-[11.5px]">
                <button
                  type="button"
                  onClick={() => setAnnualBreakdownMode('Quarterly')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    annualBreakdownMode === 'Quarterly'
                      ? 'bg-[#1967D2] text-white'
                      : 'text-[#475569] hover:text-[#0F172A]'
                  }`}
                >
                  By Quarter
                </button>
                <button
                  type="button"
                  onClick={() => setAnnualBreakdownMode('Monthly')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    annualBreakdownMode === 'Monthly'
                      ? 'bg-[#1967D2] text-white'
                      : 'text-[#475569] hover:text-[#0F172A]'
                  }`}
                >
                  By Month
                </button>
              </div>
            </div>

            <div className="overflow-x-auto thin-scroll border border-[#E5E7EB] rounded-md">
              <table className="w-full text-left border-collapse text-[12px] min-w-[860px]">
                <thead>
                  <tr className="bg-[#F8FAFD] border-b border-[#E5E7EB] text-[#4B5563] font-semibold">
                    <th className="py-2 px-3">Sub-Period</th>
                    <th className="py-2 px-3">Allocated Target</th>
                    <th className="py-2 px-3">Achievement</th>
                    <th className="py-2 px-3">Gap</th>
                    <th className="py-2 px-3">Predicted Achievement</th>
                    <th className="py-2 px-3">Pipeline</th>
                    <th className="py-2 px-3">Committed</th>
                    <th className="py-2 px-3">Best Case</th>
                    <th className="py-2 px-3">Deals</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F3F5]">
                  {annualSubRows.map((sub) => (
                    <tr key={sub.forecast.id} className="hover:bg-[#F9FAFB]">
                      <td className="py-2 px-3 font-medium text-[#0F172A]">{sub.bounds.shortLabel}</td>
                      <td className="py-2 px-3">{sub.hasValidTarget ? fmtINR2(sub.target) : '—'}</td>
                      <td className="py-2 px-3">
                        <span>{fmtINR2(sub.achievement)}</span>{' '}
                        <span className="text-[#64748B]">
                          ({sub.hasValidTarget && sub.achievementPct != null ? `${sub.achievementPct.toFixed(1)}%` : '—'})
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <GapCell gap={sub.gap} shortfallPct={sub.shortfallPct} hasValidTarget={sub.hasValidTarget} />
                      </td>
                      <td className="py-2 px-3">
                        {sub.predictedAchievement > 0 ? fmtINR2(sub.predictedAchievement) : '—'}
                      </td>
                      <td className="py-2 px-3">{fmtINR2(sub.pipeline)}</td>
                      <td className="py-2 px-3">{fmtINR2(sub.committed)}</td>
                      <td className="py-2 px-3">{fmtINR2(sub.bestCase)}</td>
                      <td className="py-2 px-3 font-medium text-[#1967D2]">{sub.contributingDeals.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 1. Contributing Teams / Hierarchy Roles Breakdown */}
        {row.contributingTeams && row.contributingTeams.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[13px] font-bold text-ink flex items-center gap-1.5">
                <Building2 size={14} className="text-primary" />
                Contributing Teams / Reporting Hierarchy — {bounds.shortLabel}
              </h4>
              <button
                type="button"
                onClick={() => openSetTargetForExistingForecast(forecast)}
                className="text-[12px] font-medium text-[#1967D2] hover:underline inline-flex items-center gap-1"
              >
                <Pencil size={11} />
                Edit Hierarchy Targets
              </button>
            </div>
            <div className="overflow-x-auto bg-white border border-[#E5E7EB] rounded-lg">
              <table className="w-full text-left border-collapse text-[12px]">
                <thead>
                  <tr className="bg-[#F8FAFD] border-b border-[#E5E7EB] text-ink-600 font-semibold">
                    <th className="py-2 px-3">Team / Role</th>
                    <th className="py-2 px-3">Members</th>
                    <th className="py-2 px-3">Target</th>
                    <th className="py-2 px-3">Closed Won</th>
                    <th className="py-2 px-3">Gap</th>
                    <th className="py-2 px-3">Open Pipeline</th>
                    <th className="py-2 px-3">Committed</th>
                    <th className="py-2 px-3">Best Case</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {row.contributingTeams.map((t) => {
                    const tGap = t.target - t.wonAmount;
                    const tHasTarget = t.target > 0;
                    const tShortfallPct = tHasTarget ? (tGap / t.target) * 100 : null;
                    return (
                      <tr key={t.teamId} className="hover:bg-page/40">
                        <td className="py-1.5 px-3 font-semibold text-ink">{t.teamName}</td>
                        <td className="py-1.5 px-3 text-ink-500">{t.memberCount}</td>
                        <td className="py-1.5 px-3 font-medium text-ink">
                          {tHasTarget ? fmtINR2(t.target) : '—'}
                        </td>
                        <td className="py-1.5 px-3 font-medium text-[#0E9F5E]">
                          {fmtINR2(t.wonAmount)}
                        </td>
                        <td className="py-1.5 px-3">
                          <GapCell gap={tGap} shortfallPct={tShortfallPct} hasValidTarget={tHasTarget} />
                        </td>
                        <td className="py-1.5 px-3 font-medium text-ink">{fmtINR2(t.pipelineAmount)}</td>
                        <td className="py-1.5 px-3 text-ink-600">{fmtINR2(t.committedAmount)}</td>
                        <td className="py-1.5 px-3 text-ink-600">{fmtINR2(t.bestCaseAmount)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. Contributing Owners / Sales Reps Breakdown */}
        {row.contributingUsers.length > 0 && (
          <div>
            <h4 className="text-[13px] font-bold text-ink flex items-center gap-1.5 mb-2">
              <Users size={14} className="text-primary" />
              Contributing Team Members / Owners Breakdown
            </h4>
            <div className="overflow-x-auto bg-white border border-[#E5E7EB] rounded-lg">
              <table className="w-full text-left border-collapse text-[12px]">
                <thead>
                  <tr className="bg-[#F8FAFD] border-b border-[#E5E7EB] text-ink-600 font-semibold">
                    <th className="py-2 px-3">User / Rep</th>
                    <th className="py-2 px-3">Role</th>
                    <th className="py-2 px-3">Target</th>
                    <th className="py-2 px-3">Deals</th>
                    <th className="py-2 px-3">Closed Won</th>
                    <th className="py-2 px-3">Open Pipeline</th>
                    <th className="py-2 px-3">Committed</th>
                    <th className="py-2 px-3">Best Case</th>
                    <th className="py-2 px-3">Predicted Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {row.contributingUsers.map((u) => (
                    <tr key={u.userId} className="hover:bg-page/40">
                      <td className="py-1.5 px-3 font-semibold text-ink">{u.userName}</td>
                      <td className="py-1.5 px-3 text-ink-500">{u.userRole}</td>
                      <td className="py-1.5 px-3 text-ink">
                        {u.target > 0 ? fmtINR2(u.target) : '—'}
                      </td>
                      <td className="py-1.5 px-3">{u.dealsCount}</td>
                      <td className="py-1.5 px-3 font-medium text-[#0E9F5E]">
                        {fmtINR2(u.wonAmount)}
                      </td>
                      <td className="py-1.5 px-3 font-medium text-ink">
                        {fmtINR2(u.pipelineAmount)}
                      </td>
                      <td className="py-1.5 px-3 text-ink-600">
                        {fmtINR2(u.committedAmount)}
                      </td>
                      <td className="py-1.5 px-3 text-ink-600">
                        {fmtINR2(u.bestCaseAmount)}
                      </td>
                      <td className="py-1.5 px-3 font-semibold text-ink">
                        {fmtINR2(u.wonAmount + u.weightedOpen)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. Contributing Deals Breakdown */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[13px] font-bold text-ink flex items-center gap-1.5">
              <Layers size={14} className="text-primary" />
              Contributing Deals — {bounds.shortLabel} ({row.contributingDeals.length})
            </h4>
            <span className="text-[11.5px] text-ink-500">
              Commit &amp; Best Case are subsets of Open Pipeline (Closed Lost excluded)
            </span>
          </div>

          {row.contributingDeals.length === 0 ? (
            <p className="text-[12.5px] text-ink-500 bg-white border border-line rounded-lg p-3">
              No eligible deals closing between {bounds.from} and {bounds.to} for this scope.
            </p>
          ) : (
            <div className="overflow-x-auto bg-white border border-[#E5E7EB] rounded-lg">
              <table className="w-full text-left border-collapse text-[12px]">
                <thead>
                  <tr className="bg-[#F8FAFD] border-b border-[#E5E7EB] text-ink-600 font-semibold">
                    <th className="py-2 px-3">Deal Name</th>
                    <th className="py-2 px-3">Account</th>
                    <th className="py-2 px-3">Owner</th>
                    <th className="py-2 px-3">Amount</th>
                    <th className="py-2 px-3">Stage</th>
                    <th className="py-2 px-3">Probability</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3">Closing Date</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {row.contributingDeals.map((d) => {
                    const cat = getDealForecastCategory(d);
                    const isOverdue = isOpen(d) && d.closingDate && d.closingDate < today;

                    return (
                      <tr key={d.id} className="hover:bg-page/40">
                        <td className="py-2 px-3 font-semibold">
                          <div className="flex items-center gap-1.5">
                            <Link
                              to={`/deals?open=${d.id}`}
                              className="text-primary hover:underline inline-flex items-center gap-1"
                            >
                              <span>{d.name}</span>
                              <ExternalLink size={11} className="shrink-0" />
                            </Link>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-ink-600">{accountName(d.accountId)}</td>
                        <td className="py-2 px-3 text-ink">{userName(d.ownerId)}</td>
                        <td className="py-2 px-3 font-semibold text-ink">{fmtINR2(d.amount)}</td>
                        <td className="py-2 px-3">
                          <StatusBadge kind="stage" value={d.stage} size="sm" />
                        </td>
                        <td className="py-2 px-3 font-medium text-ink">{d.probability}%</td>
                        <td className="py-2 px-3">
                          <CategoryBadge category={cat} />
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span className={isOverdue ? 'text-[#D92D20] font-semibold' : 'text-ink-600'}>
                            {fmtDate(d.closingDate)}
                          </span>
                          {isOverdue && (
                            <span className="ml-1.5 text-[10px] font-semibold text-[#B42318] bg-[#FEF3F2] px-1 py-0.5 rounded">
                              Overdue
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setDealEditModal({
                                ...d,
                                forecastCategory: cat,
                              })
                            }
                            className="text-[11.5px] font-medium text-primary hover:underline inline-flex items-center gap-1"
                          >
                            <Pencil size={11} />
                            Edit Deal
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ===========================================================================
  // DEDICATED SET TARGET PAGE (Matches Screenshot 3 — createModal.step === 2)
  // ===========================================================================
  if (createModal && createModal.step === 2 && resolvedHierarchy) {
    const currencySymbol = getCurrencySymbol(createModal.currency || 'INR');
    const periodBounds = getPeriodBounds(createModal.periodType, createModal.year, createModal.periodKey);

    const handleHierarchyInputChange = (nodeId, val) => {
      setCreateModal((m) => {
        const nextInputs = { ...(m.hierarchyInputs || {}), [nodeId]: val };
        return {
          ...m,
          hierarchyInputs: nextInputs,
          target: nodeId === 'ORG' ? val : m.target,
          errors: { ...m.errors, hierarchy: undefined },
        };
      });
    };

    const handleResetParentToCalculated = (nodeId) => {
      setCreateModal((m) => {
        const nextInputs = { ...(m.hierarchyInputs || {}) };
        delete nextInputs[nodeId];
        return {
          ...m,
          hierarchyInputs: nextInputs,
        };
      });
    };

    return (
      <div
        data-testid="set-target-page"
        className="mx-0 sm:-mx-[18px] -mt-2.5 -mb-6 bg-white min-h-[calc(100vh-60px)] flex flex-col overflow-x-hidden"
      >
        {/* Top Sub-Header Bar matching Screenshot 3 */}
        <div className="sticky top-[60px] z-20 bg-white border-b border-[#E2E8F0] px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 min-w-0">
            <h1
              data-testid="set-target-forecast-name"
              className="text-[16px] sm:text-[17px] font-bold text-[#0F172A] tracking-tight truncate"
            >
              {createModal.name}
            </h1>
            <span
              data-testid="set-target-revenue-badge"
              className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#EEF4FF] text-[#1967D2] border border-[#CFE0FC]"
            >
              {createModal.forecastType}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0]">
              {periodBounds.shortLabel}
            </span>
          </div>

          {/* Cancel and Save buttons in upper-right matching Screenshot 3 */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              data-testid="set-target-cancel-btn"
              onClick={() => setCreateModal(null)}
              className="h-8 px-4 rounded border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#334155] text-[13px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#1967D2]"
            >
              Cancel
            </button>
            <button
              type="button"
              data-testid="set-target-save-btn"
              disabled={createModal.isSubmitting}
              onClick={handleSaveForecast}
              className="h-8 px-5 rounded bg-[#1967D2] hover:bg-[#1557B0] disabled:opacity-50 text-white text-[13px] font-semibold shadow-2xs transition-colors focus:outline-none focus:ring-2 focus:ring-[#1967D2]"
            >
              {createModal.isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Main Set Target Tree Content */}
        <form onSubmit={handleSaveForecast} className="flex-1 p-5 sm:p-8 max-w-4xl">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-[14.5px] font-bold text-[#0F172A]">Set Target</h2>
              <p className="text-[12px] text-[#64748B] mt-0.5">
                Enter targets at the Company, Role/Team, or Individual level for{' '}
                <strong>{periodBounds.label}</strong>. Parent targets automatically calculate from child targets unless manually overridden, preventing double counting.
              </p>
            </div>
            <label htmlFor="create-fc-target" className="sr-only">
              Target Amount (INR ₹)
            </label>
          </div>

          {createModal.errors?.hierarchy && (
            <div
              role="alert"
              className="mb-4 p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[12.5px] text-[#B91C1C] flex items-center gap-2"
            >
              <AlertTriangle size={15} className="shrink-0" />
              <span>{createModal.errors.hierarchy}</span>
            </div>
          )}

          {/* ORGANIZATION & REPORTING HIERARCHY TREE (Matches Screenshot 3) */}
          <div data-testid="set-target-hierarchy-tree" className="overflow-x-auto pb-6">
            <div className="min-w-[320px] max-w-[460px]">
              {/* 1. Root Box: Company Target */}
              <div
                data-testid="company-target-card"
                className="bg-[#EEF2F8] border border-[#DCE3EE] rounded-md px-4 py-3 shadow-2xs"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[12px] font-medium text-[#475569]">Company Target</div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[12.5px] font-bold text-[#0F172A] truncate">
                      <Building2 size={14} className="text-[#475569] shrink-0" />
                      <span className="truncate">{resolvedHierarchy.companyName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[13px] font-semibold text-[#334155]">{currencySymbol}</span>
                    <input
                      id="create-fc-target"
                      data-testid="target-input-ORG"
                      type="number"
                      min="0"
                      step="any"
                      aria-label="Target Amount (INR ₹)"
                      placeholder={
                        resolvedHierarchy.companyMode === 'calculated'
                          ? String(resolvedHierarchy.companyChildrenSum)
                          : '0'
                      }
                      value={
                        resolvedHierarchy.companyManualValue !== null
                          ? resolvedHierarchy.companyRawInput
                          : resolvedHierarchy.companyChildrenSum > 0
                          ? String(resolvedHierarchy.companyChildrenSum)
                          : ''
                      }
                      onChange={(e) => handleHierarchyInputChange('ORG', e.target.value)}
                      className="w-36 sm:w-40 h-8 px-2.5 rounded border border-[#CBD5E1] bg-white text-[13px] font-medium text-[#0F172A] focus:outline-none focus:border-[#1967D2] focus:ring-1 focus:ring-[#1967D2]"
                    />
                  </div>
                </div>

                {/* Parent Target Status Indicator (Manual vs Calculated from Children) */}
                <div className="mt-2 pt-1.5 border-t border-[#DCE3EE]/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span
                    data-testid="company-target-mode-badge"
                    className={`font-medium ${
                      resolvedHierarchy.companyMode === 'calculated'
                        ? 'text-[#047857]'
                        : resolvedHierarchy.companyMode === 'manual_override'
                        ? 'text-[#B45309]'
                        : 'text-[#475569]'
                    }`}
                  >
                    {resolvedHierarchy.companyMode === 'calculated'
                      ? `Calculated from child targets (${fmtForecastCurrency(
                          resolvedHierarchy.companyChildrenSum,
                          createModal.currency
                        )})`
                      : resolvedHierarchy.companyMode === 'manual_override'
                      ? `Manually entered (Children sum: ${fmtForecastCurrency(
                          resolvedHierarchy.companyChildrenSum,
                          createModal.currency
                        )} — not added again)`
                      : resolvedHierarchy.companyMode === 'manual'
                      ? `Manually entered (${fmtForecastCurrency(
                          resolvedHierarchy.companyEffectiveTarget,
                          createModal.currency
                        )})`
                      : 'Enter company target or child targets below'}
                  </span>

                  {resolvedHierarchy.companyManualValue !== null &&
                    resolvedHierarchy.companyChildrenSum > 0 &&
                    resolvedHierarchy.companyMode === 'manual_override' && (
                      <button
                        type="button"
                        onClick={() => handleResetParentToCalculated('ORG')}
                        className="text-[#1967D2] hover:underline font-semibold"
                      >
                        Use children sum
                      </button>
                    )}
                </div>
              </div>

              {/* 2. Tree Trunk & Role / Manager / Team Branches */}
              <div className="ml-5 pl-6 border-l border-[#94A3B8] space-y-3.5 pt-3.5">
                {resolvedHierarchy.teams.map((team) => {
                  const isTeamExpanded = expandedHierarchyTeams.has(team.id);
                  return (
                    <div key={team.id} className="relative">
                      {/* Horizontal Connector Line + Expand/Collapse Square Toggle */}
                      <div className="absolute -left-6 top-4 w-6 border-t border-[#94A3B8]" />
                      <button
                        type="button"
                        data-testid={`toggle-team-${team.id}`}
                        onClick={() => toggleHierarchyTeam(team.id)}
                        aria-expanded={isTeamExpanded}
                        aria-label={`${isTeamExpanded ? 'Collapse' : 'Expand'} ${team.label}`}
                        className="absolute -left-[31px] top-2.5 w-3.5 h-3.5 rounded-[2px] border border-[#64748B] bg-white flex items-center justify-center text-[10px] font-mono leading-none text-[#334155] hover:border-[#1967D2] z-10 focus:outline-none focus:ring-1 focus:ring-[#1967D2]"
                      >
                        {isTeamExpanded ? '−' : '+'}
                      </button>

                      {/* Team / Manager Row Box */}
                      <div
                        className={`bg-[#EEF2F8] border border-[#DCE3EE] px-3.5 py-2.5 ${
                          isTeamExpanded ? 'rounded-t-md' : 'rounded-md'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[12.5px] font-bold text-[#0F172A] truncate">
                              {team.label}
                            </span>
                            {/* Member Count Pill matching Screenshot 3 */}
                            <span
                              title={`${team.memberCount} member(s)`}
                              className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-white border border-[#CBD5E1] text-[10.5px] font-semibold text-[#475569] shrink-0"
                            >
                              <User size={10} className="text-[#64748B]" />
                              <span>{team.memberCount}</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[12.5px] font-semibold text-[#334155]">
                              {currencySymbol}
                            </span>
                            <input
                              data-testid={`target-input-${team.id}`}
                              type="number"
                              min="0"
                              step="any"
                              aria-label={`Target for ${team.label}`}
                              placeholder={
                                team.mode === 'calculated' ? String(team.childrenSum) : '0'
                              }
                              value={
                                team.manualValue !== null
                                  ? team.rawInput
                                  : team.childrenSum > 0
                                  ? String(team.childrenSum)
                                  : ''
                              }
                              onChange={(e) => handleHierarchyInputChange(team.id, e.target.value)}
                              className="w-32 sm:w-36 h-7 px-2 rounded border border-[#CBD5E1] bg-white text-[12.5px] font-medium text-[#0F172A] focus:outline-none focus:border-[#1967D2]"
                            />
                          </div>
                        </div>

                        {/* Team Parent/Child Calculation Status */}
                        {(team.childrenSum > 0 || team.manualValue !== null) && (
                          <div className="mt-1.5 flex items-center justify-between text-[10.5px]">
                            <span
                              className={
                                team.mode === 'calculated'
                                  ? 'text-[#047857] font-medium'
                                  : team.mode === 'manual_override'
                                  ? 'text-[#B45309] font-medium'
                                  : 'text-[#64748B]'
                              }
                            >
                              {team.mode === 'calculated'
                                ? `Calculated from members (${fmtForecastCurrency(
                                    team.childrenSum,
                                    createModal.currency
                                  )})`
                                : team.mode === 'manual_override'
                                ? `Manual team target (Members sum: ${fmtForecastCurrency(
                                    team.childrenSum,
                                    createModal.currency
                                  )})`
                                : 'Manual team target'}
                            </span>
                            {team.mode === 'manual_override' && (
                              <button
                                type="button"
                                onClick={() => handleResetParentToCalculated(team.id)}
                                className="text-[#1967D2] hover:underline font-semibold"
                              >
                                Use members sum
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Expanded Individual Member Rows */}
                      {isTeamExpanded && (
                        <div className="bg-[#F4F7FB] border-x border-b border-[#DCE3EE] rounded-b-md divide-y divide-[#E2E8F0]">
                          {team.members.map((member) => {
                            const initials = member.name
                              .split(' ')
                              .map((p) => p[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase();
                            return (
                              <div
                                key={member.id}
                                className="px-3.5 py-2 flex items-center justify-between gap-2"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span
                                    style={{ backgroundColor: member.color || '#1967D2' }}
                                    className="w-5 h-5 rounded-full text-white text-[9.5px] font-bold inline-flex items-center justify-center shrink-0"
                                  >
                                    {initials}
                                  </span>
                                  <span className="text-[12px] text-[#334155] truncate">
                                    {member.name}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-[12px] font-semibold text-[#475569]">
                                    {currencySymbol}
                                  </span>
                                  <input
                                    data-testid={`target-input-${member.id}`}
                                    type="number"
                                    min="0"
                                    step="any"
                                    aria-label={`Target for ${member.name}`}
                                    placeholder="0"
                                    value={member.rawInput}
                                    onChange={(e) =>
                                      handleHierarchyInputChange(member.id, e.target.value)
                                    }
                                    className="w-32 sm:w-36 h-7 px-2 rounded border border-[#CBD5E1] bg-white text-[12px] text-[#0F172A] focus:outline-none focus:border-[#1967D2]"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-3.5 min-w-0 max-w-full">
      {/* ========================================================================= */}
      {/* VIEW A: SAVED FORECAST DETAIL VIEW (Exact Match to Screenshot 1)          */}
      {/* ========================================================================= */}
      {activeSavedCard ? (
        <div data-testid="saved-forecast-detail-view" className="space-y-4">
          {/* 1. Saved Forecast Top Sub-Header Bar (Back arrow, Forecast Name, Deal Revenue badge, Range Selectors, Create for Next period) */}
          <div className="bg-white border border-[#E5E7EB] rounded-lg px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                data-testid="saved-forecast-back-btn"
                onClick={() => selectSavedForecastCard(null)}
                aria-label="Back to all forecasts"
                title="Back to all forecasts"
                className="h-8 w-8 rounded-md hover:bg-[#F3F4F6] text-[#374151] inline-flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-[#1967D2]"
              >
                <ArrowLeft size={17} />
              </button>
              <h1
                data-testid="saved-forecast-title"
                className="text-[16px] font-bold text-[#111827] tracking-tight truncate"
              >
                {activeSavedCard.title}
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#EEF4FF] text-[#1967D2] border border-[#CFE0FC]">
                {activeSavedCard.revenueType}
              </span>
            </div>

            {/* Right Controls: Period Range Selectors ("Q1 2026 ▾ To Q3 2026 ▾") + Create for Next period */}
            <div className="flex flex-wrap items-center gap-2 ml-auto">
              {activeSavedCard.rows.length > 1 && (
                <div className="flex items-center gap-1.5 text-[12.5px]">
                  <select
                    data-testid="saved-period-from"
                    aria-label="Start period"
                    value={periodRangeFrom || activeSavedCard.rows[0]?.bounds.sortKey || ''}
                    onChange={(e) => setPeriodRangeFrom(e.target.value)}
                    className="h-8 px-2.5 rounded border border-[#D1D5DB] bg-white text-[#1F2937] font-medium focus:outline-none focus:border-[#1967D2]"
                  >
                    {activeSavedCard.rows.map((r) => (
                      <option key={r.forecast.id} value={r.bounds.sortKey}>
                        {r.bounds.shortLabel}
                      </option>
                    ))}
                  </select>
                  <span className="text-[#6B7280] text-[12px]">To</span>
                  <select
                    data-testid="saved-period-to"
                    aria-label="End period"
                    value={
                      periodRangeTo ||
                      activeSavedCard.rows[activeSavedCard.rows.length - 1]?.bounds.sortKey ||
                      ''
                    }
                    onChange={(e) => setPeriodRangeTo(e.target.value)}
                    className="h-8 px-2.5 rounded border border-[#D1D5DB] bg-white text-[#1F2937] font-medium focus:outline-none focus:border-[#1967D2]"
                  >
                    {activeSavedCard.rows.map((r) => (
                      <option key={r.forecast.id} value={r.bounds.sortKey}>
                        {r.bounds.shortLabel}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {activeSavedCard.periodType === 'Annual' && (
                <select
                  data-testid="annual-breakdown-select"
                  aria-label="Annual breakdown mode"
                  value={annualBreakdownMode}
                  onChange={(e) => setAnnualBreakdownMode(e.target.value)}
                  className="h-8 px-2.5 rounded border border-[#D1D5DB] bg-white text-[12.5px] text-[#1F2937] font-medium focus:outline-none focus:border-[#1967D2]"
                >
                  <option value="Quarterly">Breakdown: Quarterly (Q1–Q4)</option>
                  <option value="Monthly">Breakdown: Monthly (Jan–Dec)</option>
                </select>
              )}

              <button
                type="button"
                data-testid="saved-forecast-edit-targets-btn"
                onClick={() =>
                  openSetTargetForExistingForecast(
                    activeSavedCardFilteredRows[0]?.forecast || activeSavedCard.rows[0]?.forecast
                  )
                }
                className="h-8 px-3 rounded border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#334155] text-[12.5px] font-medium inline-flex items-center gap-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-[#1967D2]"
              >
                <Pencil size={12.5} />
                <span>Set Target</span>
              </button>

              <button
                type="button"
                data-testid="saved-forecast-next-period-btn"
                onClick={() => handleCreateNextPeriod(activeSavedCard)}
                className="h-8 px-3.5 rounded border border-[#60A5FA] bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#1D4ED8] text-[12.5px] font-semibold inline-flex items-center gap-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-[#1967D2]"
              >
                <span>Create for Next period</span>
              </button>
            </div>
          </div>

          {/* 2. Main Card Surface with "Forecast for CEO 🔍", 3 KPI Cards, and Expandable Table (Screenshot 1) */}
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 sm:p-5 shadow-2xs space-y-5">
            {/* "Forecast for [owner/team] 🔍" + Role subtitle */}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[15px] font-semibold text-[#111827]">Forecast for</span>
                <button
                  type="button"
                  data-testid="saved-forecast-scope-btn"
                  onClick={() => setScopeModalOpen(true)}
                  className="text-[15px] font-bold text-[#111827] hover:text-[#1967D2] inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#1967D2] rounded px-1"
                >
                  <span>{currentScopeDisplay}</span>
                  <Search size={14} className="text-[#4B5563]" />
                </button>
              </div>
              <div className="text-[11.5px] text-[#6B7280] mt-0.5">{currentScopeSubtitle}</div>
            </div>

            {/* 3 KPI Summary Cards (Total Target, Total Achievement, Overall Gap — Exact Screenshot 1 style) */}
            <div
              data-testid="saved-forecast-kpi-grid"
              className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-3xl"
            >
              {/* KPI 1: Total Target */}
              <div
                data-testid="kpi-total-target"
                className="rounded-md bg-[#EEF4FF] border border-[#BFDBFE] px-4 py-3.5"
              >
                <div className="text-[12px] font-medium text-[#334155]">Total Target</div>
                <div className="text-[18px] font-bold text-[#0F172A] mt-1">
                  {activeSavedCardTotals.hasValidTarget
                    ? fmtINR2(activeSavedCardTotals.target)
                    : '—'}
                </div>
              </div>

              {/* KPI 2: Total Achievement */}
              <div
                data-testid="kpi-total-achievement"
                className="rounded-md bg-[#ECFDF5] border border-[#A7F3D0] px-4 py-3.5"
              >
                <div className="text-[12px] font-medium text-[#065F46]">Total Achievement</div>
                <div className="mt-1 flex flex-wrap items-baseline gap-1.5">
                  <span className="text-[18px] font-bold text-[#0F172A]">
                    {fmtINR2(activeSavedCardTotals.achievement)}
                  </span>
                  <span className="text-[12px] font-semibold text-[#047857]">
                    (
                    {activeSavedCardTotals.hasValidTarget &&
                    activeSavedCardTotals.achievementPct != null
                      ? `${activeSavedCardTotals.achievementPct.toFixed(1)} %`
                      : '—'}
                    )
                  </span>
                </div>
              </div>

              {/* KPI 3: Overall Gap */}
              <div
                data-testid="kpi-overall-gap"
                className={`rounded-md px-4 py-3.5 border ${
                  !activeSavedCardTotals.hasValidTarget
                    ? 'bg-[#F8FAFC] border-[#E2E8F0]'
                    : activeSavedCardTotals.gap > 0
                    ? 'bg-[#FEF2F2] border-[#FECACA]'
                    : 'bg-[#ECFDF5] border-[#A7F3D0]'
                }`}
              >
                <div
                  className={`text-[12px] font-medium ${
                    !activeSavedCardTotals.hasValidTarget
                      ? 'text-[#475569]'
                      : activeSavedCardTotals.gap > 0
                      ? 'text-[#991B1B]'
                      : 'text-[#065F46]'
                  }`}
                >
                  Overall Gap
                </div>
                <div className="mt-1 flex flex-wrap items-baseline gap-1.5">
                  {activeSavedCardTotals.hasValidTarget ? (
                    <>
                      <span className="text-[18px] font-bold text-[#0F172A]">
                        {fmtINR2(Math.abs(activeSavedCardTotals.gap))}
                      </span>
                      <span
                        className={`text-[12px] font-semibold inline-flex items-center gap-0.5 ${
                          activeSavedCardTotals.gap > 0 ? 'text-[#DC2626]' : 'text-[#059669]'
                        }`}
                      >
                        <span aria-hidden="true">
                          {activeSavedCardTotals.gap > 0 ? '▼' : '▲'}
                        </span>
                        <span>
                          ({Math.abs(activeSavedCardTotals.shortfallPct || 0).toFixed(1)} %)
                        </span>
                      </span>
                    </>
                  ) : (
                    <span className="text-[18px] font-bold text-[#64748B]">—</span>
                  )}
                </div>
              </div>
            </div>

            {/* Saved Forecast Period Table */}
            <div className="overflow-x-auto thin-scroll border border-[#E5E7EB] rounded-lg">
              <table
                data-testid="saved-forecast-table"
                className="w-full table-fixed text-left border-collapse text-[13px] min-w-[920px]"
              >
                <colgroup>
                  <col className="w-[15%]" />
                  <col className="w-[12%]" />
                  <col className="w-[17%]" />
                  <col className="w-[8.5%]" />
                  <col className="w-[14.5%]" />
                  <col className="w-[11%]" />
                  <col className="w-[10.5%]" />
                  <col className="w-[11.5%]" />
                </colgroup>
                <thead>
                  <tr className="bg-[#F8FAFD] border-b border-[#E5E7EB] text-[12px] font-semibold text-[#4B5563]">
                    <th className="py-2.5 px-3.5">Period</th>
                    <th className="py-2.5 px-3">Target</th>
                    <th className="py-2.5 px-3">Achievement</th>
                    <th className="py-2.5 px-3">Gap</th>
                    <th className="py-2.5 px-3">Predicted Achievement</th>
                    <th className="py-2.5 px-3">Pipeline</th>
                    <th className="py-2.5 px-3">Committed</th>
                    <th className="py-2.5 px-3">Best Case</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F3F5] text-[13px] tabular-nums">
                  {activeSavedCardFilteredRows.map((row) => {
                    const { forecast, bounds } = row;
                    const isExpanded =
                      expandedRows.has(forecast.id) || forecast.periodType === 'Annual';

                    return (
                      <Fragment key={forecast.id}>
                        <tr
                          className={`transition-colors ${
                            isExpanded ? 'bg-[#F9FBFF]' : 'hover:bg-[#F9FAFB]'
                          }`}
                        >
                          {/* 1. Period with Expand Button & Row Actions ("..." -> View full hierarchy) */}
                          <td className="py-2.5 px-3.5 align-middle whitespace-nowrap">
                            <div className="flex items-center gap-2 group relative">
                              <button
                                type="button"
                                data-testid={`expand-period-${forecast.id}`}
                                onClick={() => toggleExpand(forecast.id)}
                                aria-expanded={isExpanded}
                                aria-label={`${isExpanded ? 'Collapse' : 'Expand'} details for ${bounds.shortLabel}`}
                                className="w-4 h-4 rounded border border-[#CBD5E1] bg-white flex items-center justify-center text-[10px] text-[#64748B] font-mono hover:border-[#94A3B8] transition-colors focus:outline-none shrink-0"
                              >
                                {isExpanded ? '−' : '+'}
                              </button>
                              <span className="font-medium text-[#1F2937]">{bounds.shortLabel}</span>

                              {/* "..." button */}
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setRowMenuOpenId((prev) =>
                                      prev === forecast.id ? null : forecast.id
                                    )
                                  }
                                  aria-label={`Actions for ${bounds.shortLabel}`}
                                  className="w-5 h-5 rounded-full border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#64748B] inline-flex items-center justify-center"
                                >
                                  <MoreHorizontal size={12} />
                                </button>
                                {rowMenuOpenId === forecast.id && (
                                  <div
                                    onMouseLeave={() => setRowMenuOpenId(null)}
                                    className="absolute left-0 top-full mt-1 w-44 rounded-md border border-[#E2E8F0] bg-white shadow-lg py-1 z-30 text-[12px]"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setRowMenuOpenId(null);
                                        openSetTargetForExistingForecast(forecast);
                                      }}
                                      className="w-full px-3 py-1.5 text-left text-[#2563EB] font-medium hover:bg-[#EFF6FF]"
                                    >
                                      View full hierarchy
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setRowMenuOpenId(null);
                                        setEditModal(forecast);
                                      }}
                                      className="w-full px-3 py-1.5 text-left text-[#334155] hover:bg-[#F8FAFC]"
                                    >
                                      Edit Period Target
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setRowMenuOpenId(null);
                                        setDeleteTarget(forecast);
                                      }}
                                      className="w-full px-3 py-1.5 text-left text-[#DC2626] hover:bg-[#FEF2F2]"
                                    >
                                      Delete Period
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* 2. Target */}
                          <td className="py-2.5 px-3 align-middle whitespace-nowrap text-[#1F2937]">
                            {row.hasValidTarget ? (
                              fmtINR2(row.target)
                            ) : (
                              <span className="text-[#9CA3AF]">—</span>
                            )}
                          </td>

                          {/* 3. Achievement */}
                          <td className="py-2.5 px-3 align-middle whitespace-nowrap">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-[#1F2937]">{fmtINR2(row.achievement)}</span>
                              {row.hasValidTarget && row.achievementPct != null ? (
                                <span className="text-[12px] text-[#4B5563]">
                                  ({row.achievementPct.toFixed(1)}%)
                                </span>
                              ) : (
                                <span className="text-[12px] text-[#9CA3AF]">(—)</span>
                              )}
                            </div>
                          </td>

                          {/* 4. Gap */}
                          <td className="py-2.5 px-3 align-middle whitespace-nowrap">
                            <GapCell
                              gap={row.gap}
                              shortfallPct={row.shortfallPct}
                              hasValidTarget={row.hasValidTarget}
                            />
                          </td>

                          {/* 5. Predicted Achievement */}
                          <td className="py-2.5 px-3 align-middle whitespace-nowrap text-[#1F2937]">
                            {row.predictedAchievement > 0 && row.pipeline > 0 ? (
                              fmtINR2(row.predictedAchievement)
                            ) : (
                              <span className="text-[#9CA3AF]">-</span>
                            )}
                          </td>

                          {/* 6. Pipeline */}
                          <td className="py-2.5 px-3 align-middle whitespace-nowrap text-[#1F2937]">
                            {fmtINR2(row.pipeline)}
                          </td>

                          {/* 7. Committed */}
                          <td className="py-2.5 px-3 align-middle whitespace-nowrap text-[#1F2937]">
                            {fmtINR2(row.committed)}
                          </td>

                          {/* 8. Best Case + View full hierarchy link */}
                          <td className="py-2.5 px-3 align-middle whitespace-nowrap text-[#1F2937]">
                            <div className="flex items-center justify-between gap-2">
                              <span>{fmtINR2(row.bestCase)}</span>
                              <button
                                type="button"
                                onClick={() => openSetTargetForExistingForecast(forecast)}
                                className="text-[11.5px] font-medium text-[#2563EB] hover:underline shrink-0"
                              >
                                View full hierarchy
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Period Breakdown (Teams, Owners, Deals, Annual Sub-periods) */}
                        {isExpanded && (
                          <tr className="bg-[#F8FAFC]">
                            <td colSpan={8} className="p-4 border-b border-[#E5E7EB]">
                              {renderExpandedPeriodDetails(row)}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* VIEW B: ALL FORECASTS DASHBOARD (Matches Screenshot 2 Background)          */}
          {/* ========================================================================= */}
          <section
            aria-label="Forecast dashboard controls"
            className="flex flex-wrap items-center justify-between gap-3 pt-1 pb-2"
          >
            {/* Left: "Forecast for CEO 🔍" */}
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[17px] font-semibold text-[#1F2937] tracking-tight">
                Forecast for
              </span>
              <button
                type="button"
                onClick={() => setScopeModalOpen(true)}
                aria-label={`Select user or team for forecast. Currently: ${currentScopeDisplay}`}
                className="text-[17px] font-bold text-[#111827] hover:text-[#1967D2] transition-colors inline-flex items-center gap-1.5 px-1 py-0.5 rounded hover:bg-white"
              >
                <span>{currentScopeDisplay}</span>
                <Search size={15} className="text-[#4B5563] shrink-0" aria-hidden="true" />
              </button>
            </div>

            {/* Right side controls: All Types ▾, 2026 ▾, Create Forecast, Settings gear */}
            <div className="flex items-center gap-2 ml-auto">
              {/* Forecast Type Filter */}
              <div className="relative">
                <select
                  id="forecast-type-filter"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  aria-label="Filter forecast type"
                  className="h-8 pl-3 pr-7 rounded-md border border-[#D1D5DB] bg-white text-[13px] font-normal text-[#374151] hover:border-[#9CA3AF] focus:outline-none focus:border-[#1967D2] cursor-pointer appearance-none shadow-sm"
                >
                  <option value="All">All Types</option>
                  <option value="Deal Revenue">Deal Revenue</option>
                  <option value="Pipeline">Pipeline</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Annual">Annual</option>
                </select>
                <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
              </div>

              {/* Year Filter */}
              <div className="relative">
                <select
                  id="forecast-year-filter"
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  aria-label="Filter forecast year"
                  className="h-8 pl-3 pr-7 rounded-md border border-[#D1D5DB] bg-white text-[13px] font-normal text-[#374151] hover:border-[#9CA3AF] focus:outline-none focus:border-[#1967D2] cursor-pointer appearance-none shadow-sm"
                >
                  <option value="All">All Years</option>
                  {availableYears.map((yr) => (
                    <option key={yr} value={String(yr)}>
                      {yr}
                    </option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
              </div>

              {/* Create Forecast Button */}
              <button
                type="button"
                data-testid="create-forecast-btn"
                onClick={() => openCreateModal()}
                className="h-8 px-3.5 rounded-md bg-[#1967D2] hover:bg-[#1557B0] text-white text-[13px] font-medium inline-flex items-center gap-1.5 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/25"
              >
                <span>Create Forecast</span>
              </button>

              {/* Settings / Gear Icon with Dropdown */}
              <div ref={settingsRef} className="relative">
                <button
                  type="button"
                  onClick={() => setSettingsOpen((o) => !o)}
                  aria-label="Forecast options"
                  aria-expanded={settingsOpen}
                  className="h-8 w-8 rounded-md border border-[#D1D5DB] bg-white hover:bg-page text-[#4B5563] inline-flex items-center justify-center shadow-sm focus:outline-none focus:border-[#1967D2]"
                >
                  <Settings size={15} />
                </button>

                {settingsOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-1 w-56 bg-white border border-line rounded-lg shadow-pop z-40 py-1 pop-in"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        handleExportCSV();
                        setSettingsOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-[12.5px] text-ink hover:bg-page flex items-center gap-2"
                    >
                      <Download size={14} className="text-ink-400" />
                      <span>Export to CSV</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleRefresh();
                        setSettingsOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-[12.5px] text-ink hover:bg-page flex items-center gap-2"
                    >
                      <RefreshCw size={14} className={loading ? 'animate-spin text-primary' : 'text-ink-400'} />
                      <span>Recalculate from Live Deals</span>
                    </button>
                    <div className="h-[1px] bg-line my-1" />
                    <button
                      type="button"
                      onClick={() => {
                        setHelpModal(true);
                        setSettingsOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-[12.5px] text-ink hover:bg-page flex items-center gap-2"
                    >
                      <HelpCircle size={14} className="text-ink-400" />
                      <span>Forecast Methodology &amp; Rules</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Loading Indicator */}
          {loading && (
            <div className="bg-white border border-line rounded-lg p-6 text-center text-[13px] text-ink-500 flex items-center justify-center gap-2 shadow-sm">
              <RefreshCw size={16} className="animate-spin text-primary" />
              <span>Recalculating forecast figures from CRM deals...</span>
            </div>
          )}

          {/* Empty State */}
          {!loading && forecastCards.length === 0 && (
            <section className="bg-white border border-line rounded-xl px-6 py-14 text-center shadow-card">
              <div className="w-12 h-12 rounded-full bg-primary-50 text-primary flex items-center justify-center mx-auto mb-3">
                <TrendingUp size={24} />
              </div>
              <h2 className="text-[16px] font-bold text-ink">No forecasts match the selected filters</h2>
              <p className="text-[13px] text-ink-500 max-w-md mx-auto mt-1">
                Try switching the year or forecast type, or create a new forecast for {currentScopeDisplay}.
              </p>
              <div className="mt-5 flex items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setScopeFilter('ORG');
                    setTypeFilter('All');
                    setYearFilter('2026');
                    setSearchQuery('');
                  }}
                  className="btn-secondary h-8 text-[12.5px]"
                >
                  Reset Filters
                </button>
                <button
                  type="button"
                  onClick={() => openCreateModal()}
                  className="btn-primary h-8 text-[12.5px] bg-[#1967D2] hover:bg-[#1557B0]"
                >
                  <Plus size={15} />
                  Create Forecast
                </button>
              </div>
            </section>
          )}

          {/* Vertically Stacked Forecast Cards */}
          {!loading && (
            <div className="space-y-4">
              {forecastCards.map((card) => (
                <section
                  key={card.key}
                  aria-label={card.title}
                  className="bg-white border border-[#E5E7EB] rounded-lg shadow-sm overflow-hidden"
                >
                  {/* Card Header: Clickable Title -> Opens Saved Forecast Detail View (Screenshot 1) */}
                  <div className="px-4 py-2.5 bg-white border-b border-[#F3F4F6] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        type="button"
                        data-testid={`open-forecast-card-${card.title}`}
                        onClick={() => selectSavedForecastCard(card.key)}
                        className="text-[15px] font-semibold text-[#1967D2] hover:underline tracking-tight truncate text-left focus:outline-none focus:ring-2 focus:ring-[#1967D2] rounded px-0.5"
                      >
                        {card.title}
                      </button>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#EEF4FF] text-[#1967D2] border border-[#CFE0FC]">
                        {card.revenueType}
                      </span>
                      {card.scope !== 'ORG' && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-page text-ink-500 border border-line">
                          <Users size={11} className="text-ink-400" />
                          <span>{card.scopeDisplay}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        type="button"
                        onClick={() => openSetTargetForExistingForecast(card.rows[0]?.forecast)}
                        className="h-7 px-2.5 rounded border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#334155] text-[12px] font-medium inline-flex items-center gap-1 transition-colors"
                      >
                        <Pencil size={11} />
                        <span>Set Target</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCreateNextPeriod(card)}
                        className="h-7 px-3 rounded border border-[#2563EB]/40 bg-white hover:bg-[#EFF6FF] text-[#2563EB] text-[12px] font-medium inline-flex items-center gap-1 transition-colors focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                      >
                        <span>Create for Next period</span>
                      </button>
                    </div>
                  </div>

                  {/* Table Container with Contained Scroll */}
                  <div className="overflow-x-auto thin-scroll">
                    <table
                      data-testid={`forecast-card-table-${card.title}`}
                      className="w-full table-fixed text-left border-collapse text-[13px] min-w-[920px]"
                    >
                      <colgroup>
                        <col className="w-[15%]" />
                        <col className="w-[12.5%]" />
                        <col className="w-[17.5%]" />
                        <col className="w-[8.5%]" />
                        <col className="w-[14.5%]" />
                        <col className="w-[11%]" />
                        <col className="w-[10.5%]" />
                        <col className="w-[10.5%]" />
                      </colgroup>
                      <thead>
                        <tr className="bg-[#F8FAFD] border-b border-[#E5E7EB] text-[12px] font-semibold text-[#4B5563]">
                          <th className="py-2.5 px-3.5">Period</th>
                          <th className="py-2.5 px-3">Target</th>
                          <th className="py-2.5 px-3">Achievement</th>
                          <th className="py-2.5 px-3">Gap</th>
                          <th className="py-2.5 px-3">Predicted Achievement</th>
                          <th className="py-2.5 px-3">Pipeline</th>
                          <th className="py-2.5 px-3">Committed</th>
                          <th className="py-2.5 px-3">Best Case</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F1F3F5] text-[13px] tabular-nums">
                        {card.rows.map((row) => {
                          const { forecast, bounds } = row;
                          const isExpanded = expandedRows.has(forecast.id);

                          return (
                            <Fragment key={forecast.id}>
                              <tr className={`transition-colors ${isExpanded ? 'bg-[#F9FBFF]' : 'hover:bg-[#F9FAFB]'}`}>
                                {/* 1. Period with Expand Button */}
                                <td className="py-2.5 px-3.5 align-middle whitespace-nowrap">
                                  <div className="flex items-center gap-2 group">
                                    <button
                                      type="button"
                                      onClick={() => toggleExpand(forecast.id)}
                                      aria-expanded={isExpanded}
                                      aria-label={`${isExpanded ? 'Collapse' : 'Expand'} details for ${bounds.shortLabel}`}
                                      className="w-4 h-4 rounded border border-[#CBD5E1] bg-white flex items-center justify-center text-[10px] text-[#64748B] font-mono hover:border-[#94A3B8] transition-colors focus:outline-none shrink-0"
                                    >
                                      {isExpanded ? '−' : '+'}
                                    </button>
                                    <span className="font-normal text-[#1F2937]">
                                      {bounds.shortLabel}
                                    </span>

                                    {/* Subtle Row Actions (Edit / Delete) */}
                                    <div className="hidden group-hover:flex items-center gap-0.5 ml-auto">
                                      <button
                                        type="button"
                                        onClick={() => openSetTargetForExistingForecast(forecast)}
                                        title="Set hierarchy targets"
                                        aria-label={`Set targets for ${bounds.shortLabel}`}
                                        className="p-1 rounded text-ink-400 hover:text-primary hover:bg-white"
                                      >
                                        <Pencil size={12} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setDeleteTarget(forecast)}
                                        title="Delete forecast"
                                        aria-label={`Delete forecast for ${bounds.shortLabel}`}
                                        className="p-1 rounded text-ink-400 hover:text-danger hover:bg-white"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  </div>
                                </td>

                                {/* 2. Target */}
                                <td className="py-2.5 px-3 align-middle whitespace-nowrap text-[#1F2937]">
                                  {row.hasValidTarget ? fmtINR2(row.target) : <span className="text-[#9CA3AF]">-</span>}
                                </td>

                                {/* 3. Achievement with % beside revenue */}
                                <td className="py-2.5 px-3 align-middle whitespace-nowrap">
                                  <div className="flex items-baseline gap-1.5">
                                    <span className="text-[#1F2937]">{fmtINR2(row.achievement)}</span>
                                    {row.hasValidTarget && row.achievementPct != null ? (
                                      <span className="text-[12px] text-[#4B5563]">
                                        ({row.achievementPct.toFixed(1)}%)
                                      </span>
                                    ) : (
                                      <span className="text-[12px] text-[#9CA3AF]">(—)</span>
                                    )}
                                  </div>
                                </td>

                                {/* 4. Gap */}
                                <td className="py-2.5 px-3 align-middle whitespace-nowrap">
                                  <GapCell
                                    gap={row.gap}
                                    shortfallPct={row.shortfallPct}
                                    hasValidTarget={row.hasValidTarget}
                                  />
                                </td>

                                {/* 5. Predicted Achievement */}
                                <td className="py-2.5 px-3 align-middle whitespace-nowrap text-[#1F2937]">
                                  {row.predictedAchievement > 0 && row.pipeline > 0 ? (
                                    fmtINR2(row.predictedAchievement)
                                  ) : (
                                    <span className="text-[#9CA3AF]">-</span>
                                  )}
                                </td>

                                {/* 6. Pipeline */}
                                <td className="py-2.5 px-3 align-middle whitespace-nowrap text-[#1F2937]">
                                  {fmtINR2(row.pipeline)}
                                </td>

                                {/* 7. Committed */}
                                <td className="py-2.5 px-3 align-middle whitespace-nowrap text-[#1F2937]">
                                  {fmtINR2(row.committed)}
                                </td>

                                {/* 8. Best Case */}
                                <td className="py-2.5 px-3 align-middle whitespace-nowrap text-[#1F2937]">
                                  {fmtINR2(row.bestCase)}
                                </td>
                              </tr>

                              {/* Expanded Contributing Teams, Members & Deals View */}
                              {isExpanded && (
                                <tr className="bg-[#F8FAFC]">
                                  <td colSpan={8} className="p-4 border-b border-[#E5E7EB]">
                                    {renderExpandedPeriodDetails(row)}
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* CREATE FORECAST MODAL — STEP 1 (Exact Match to Screenshot 2)              */}
      {/* ========================================================================= */}
      {createModal && createModal.step === 1 && (
        <div
          data-testid="create-forecast-modal"
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-forecast-title"
          onClick={() => setCreateModal(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl border border-line w-full max-w-lg md:max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-3.5 border-b border-line flex items-center justify-between bg-white">
              <h2 id="create-forecast-title" className="text-[16px] font-bold text-ink">
                Create Forecast
              </h2>
              <button
                type="button"
                onClick={() => setCreateModal(null)}
                aria-label="Close dialog"
                className="text-ink-400 hover:text-ink p-1 rounded-md hover:bg-page transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleStep1Next} className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-[13px]">
              {createModal.rolloverNote && (
                <div className="p-2.5 rounded-lg bg-[#EFF8FF] border border-[#B2DDFF] text-[12px] text-[#175CD3] flex items-start gap-2">
                  <CalendarPlus size={15} className="shrink-0 mt-0.5" />
                  <span>{createModal.rolloverNote}</span>
                </div>
              )}

              {/* 1. Create options */}
              <div className="space-y-1.5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <label className="w-36 text-ink-700 font-medium shrink-0">
                    Create options
                  </label>
                  <div className="flex flex-wrap items-center gap-5 text-ink">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="createOption"
                        value="new"
                        checked={createModal.createOption === 'new'}
                        onChange={() =>
                          setCreateModal((m) => ({
                            ...m,
                            createOption: 'new',
                            errors: { ...m.errors, sourceForecastId: undefined },
                          }))
                        }
                        className="h-4 w-4 text-[#1967D2] focus:ring-[#1967D2]"
                      />
                      <span>Create new forecast</span>
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="createOption"
                        value="existing"
                        checked={createModal.createOption === 'existing'}
                        onChange={() => setCreateModal((m) => ({ ...m, createOption: 'existing' }))}
                        className="h-4 w-4 text-[#1967D2] focus:ring-[#1967D2]"
                      />
                      <span>Continue from existing forecast</span>
                    </label>
                  </div>
                </div>

                {/* Pick Existing Forecast if "Continue from existing forecast" is active */}
                {createModal.createOption === 'existing' && (
                  <div className="sm:pl-36 pt-1">
                    <label htmlFor="source-forecast-select" className="block text-[11.5px] text-ink-500 mb-1">
                      Select Prior Forecast to copy configuration from:
                    </label>
                    <select
                      id="source-forecast-select"
                      data-testid="source-forecast-select"
                      value={createModal.sourceForecastId || ''}
                      onChange={(e) => {
                        const srcId = e.target.value;
                        const src = forecasts.find((f) => f.id === srcId);
                        if (src) {
                          const next = getNextPeriod(src.periodType, src.year, src.periodKey);
                          const copiedHierarchy = buildInitialHierarchyInputs(src, src.target);
                          setCreateModal((m) => ({
                            ...m,
                            sourceForecastId: srcId,
                            forecastType: src.revenueType || 'Deal Revenue',
                            periodType: next.periodType,
                            year: next.year,
                            periodKey: next.periodKey,
                            name: src.name.replace(String(src.year), String(next.year)),
                            target: src.target ?? 0,
                            hierarchyInputs: copiedHierarchy,
                            scope: src.scope || 'ORG',
                            forecastOn: src.forecastOn || 'All Deals',
                            selectedDealIds: src.selectedDealIds ? [...src.selectedDealIds] : [],
                            errors: { ...m.errors, sourceForecastId: undefined, periodKey: undefined },
                          }));
                        } else {
                          setCreateModal((m) => ({ ...m, sourceForecastId: '' }));
                        }
                      }}
                      className={`w-full h-8 px-2.5 rounded-md border bg-white text-[12.5px] text-ink focus:outline-none focus:border-[#1967D2] ${
                        createModal.errors.sourceForecastId ? 'border-danger' : 'border-line'
                      }`}
                    >
                      <option value="">Select a prior forecast...</option>
                      {forecasts.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} — {getPeriodBounds(f.periodType, f.year, f.periodKey).shortLabel} ({f.revenueType || 'Deal Revenue'})
                        </option>
                      ))}
                    </select>
                    {createModal.errors.sourceForecastId && (
                      <p className="text-[12px] text-danger mt-1">{createModal.errors.sourceForecastId}</p>
                    )}
                  </div>
                )}
              </div>

              {/* 2. Forecast Type */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label htmlFor="fc-type-select" className="w-36 text-ink-700 font-medium shrink-0">
                  Forecast Type
                </label>
                <div className="flex-1">
                  <select
                    id="fc-type-select"
                    data-testid="create-fc-type-select"
                    value={createModal.forecastType}
                    onChange={(e) => {
                      const fType = e.target.value;
                      setCreateModal((m) => ({
                        ...m,
                        forecastType: fType,
                        name: m.nameManuallyEdited
                          ? m.name
                          : buildDefaultForecastName(m.periodType, m.year, m.periodKey, fType),
                        errors: { ...m.errors, forecastType: undefined, periodKey: undefined },
                      }));
                    }}
                    className="w-full h-8 px-2.5 rounded-md border border-line bg-white text-[13px] text-ink focus:outline-none focus:border-[#1967D2]"
                  >
                    {FORECAST_REVENUE_TYPES.map((rt) => (
                      <option key={rt} value={rt}>
                        {rt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3. Forecast Period (Quarterly, Monthly, and Annual) */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <label className="w-36 text-ink-700 font-medium shrink-0">
                    Forecast Period
                  </label>
                  <div className="flex flex-wrap items-center gap-5 text-ink">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="periodType"
                        value="Quarterly"
                        checked={createModal.periodType === 'Quarterly'}
                        onChange={() => {
                          setCreateModal((m) => ({
                            ...m,
                            periodType: 'Quarterly',
                            periodKey: 'Q1',
                            name: m.nameManuallyEdited
                              ? m.name
                              : buildDefaultForecastName('Quarterly', m.year, 'Q1', m.forecastType),
                            errors: { ...m.errors, periodKey: undefined },
                          }));
                        }}
                        className="h-4 w-4 text-[#1967D2] focus:ring-[#1967D2]"
                      />
                      <span>Quarterly</span>
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="periodType"
                        value="Monthly"
                        checked={createModal.periodType === 'Monthly'}
                        onChange={() => {
                          setCreateModal((m) => ({
                            ...m,
                            periodType: 'Monthly',
                            periodKey: 'M01',
                            name: m.nameManuallyEdited
                              ? m.name
                              : buildDefaultForecastName('Monthly', m.year, 'M01', m.forecastType),
                            errors: { ...m.errors, periodKey: undefined },
                          }));
                        }}
                        className="h-4 w-4 text-[#1967D2] focus:ring-[#1967D2]"
                      />
                      <span>Monthly</span>
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="periodType"
                        value="Annual"
                        checked={createModal.periodType === 'Annual'}
                        onChange={() => {
                          setCreateModal((m) => ({
                            ...m,
                            periodType: 'Annual',
                            periodKey: 'FY',
                            name: m.nameManuallyEdited
                              ? m.name
                              : buildDefaultForecastName('Annual', m.year, 'FY', m.forecastType),
                            errors: { ...m.errors, periodKey: undefined },
                          }));
                        }}
                        className="h-4 w-4 text-[#1967D2] focus:ring-[#1967D2]"
                      />
                      <span>Annual</span>
                    </label>
                  </div>
                </div>

                {/* Period Selector appropriate to Quarterly (Quarter + Year), Monthly (Month + Year), or Annual (Year) */}
                <div className="sm:pl-36 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {createModal.periodType !== 'Annual' && (
                    <div>
                      <select
                        id="create-period-key-select"
                        data-testid="create-period-key-select"
                        value={createModal.periodKey}
                        onChange={(e) => {
                          const pKey = e.target.value;
                          setCreateModal((m) => ({
                            ...m,
                            periodKey: pKey,
                            name: m.nameManuallyEdited
                              ? m.name
                              : buildDefaultForecastName(m.periodType, m.year, pKey, m.forecastType),
                            errors: { ...m.errors, periodKey: undefined },
                          }));
                        }}
                        aria-label="Select forecast period"
                        className={`w-full h-8 px-2.5 rounded-md border bg-white text-[13px] text-ink focus:outline-none focus:border-[#1967D2] ${
                          createModal.errors.periodKey ? 'border-danger' : 'border-line'
                        }`}
                      >
                        {createModal.periodType === 'Quarterly'
                          ? QUARTERS.map((q) => (
                              <option key={q.key} value={q.key}>
                                {q.label}
                              </option>
                            ))
                          : MONTH_PERIODS.map((m) => (
                              <option key={m.key} value={m.key}>
                                {m.label} ({m.fullLabel})
                              </option>
                            ))}
                      </select>
                    </div>
                  )}

                  <div className={createModal.periodType === 'Annual' ? 'sm:col-span-2' : ''}>
                    <select
                      id="create-year-select"
                      data-testid="create-year-select"
                      value={createModal.year}
                      onChange={(e) => {
                        const yr = Number(e.target.value);
                        setCreateModal((m) => ({
                          ...m,
                          year: yr,
                          name: m.nameManuallyEdited
                            ? m.name
                            : buildDefaultForecastName(m.periodType, yr, m.periodKey, m.forecastType),
                          errors: { ...m.errors, periodKey: undefined },
                        }));
                      }}
                      aria-label="Select forecast year"
                      className="w-full h-8 px-2.5 rounded-md border border-line bg-white text-[13px] text-ink focus:outline-none focus:border-[#1967D2]"
                    >
                      {[2024, 2025, 2026, 2027, 2028].map((yr) => (
                        <option key={yr} value={yr}>
                          FY {yr}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {createModal.errors.periodKey && (
                  <p className="sm:pl-36 text-[12px] text-danger mt-1">
                    {createModal.errors.periodKey}
                  </p>
                )}
              </div>

              {/* 4. Forecast Name */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label htmlFor="create-fc-name" className="w-36 text-ink-700 font-medium shrink-0">
                  Forecast Name
                </label>
                <div className="flex-1">
                  <input
                    id="create-fc-name"
                    data-testid="create-fc-name"
                    type="text"
                    value={createModal.name}
                    onChange={(e) =>
                      setCreateModal((m) => ({
                        ...m,
                        name: e.target.value,
                        nameManuallyEdited: true,
                        errors: { ...m.errors, name: undefined },
                      }))
                    }
                    placeholder="Forecast Name"
                    className={`w-full h-8 px-2.5 rounded-md border bg-white text-[13px] text-ink placeholder:text-ink-400 focus:outline-none focus:border-[#1967D2] ${
                      createModal.errors.name ? 'border-danger' : 'border-line'
                    }`}
                  />
                  {createModal.errors.name && (
                    <p className="text-[12px] text-danger mt-1">{createModal.errors.name}</p>
                  )}
                </div>
              </div>

              {/* 5. Forecast on */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <label className="w-36 text-ink-700 font-medium shrink-0">
                    Forecast on
                  </label>
                  <div className="flex items-center gap-6 text-ink">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="forecastOn"
                        value="All Deals"
                        checked={createModal.forecastOn === 'All Deals'}
                        onChange={() => setCreateModal((m) => ({ ...m, forecastOn: 'All Deals' }))}
                        className="h-4 w-4 text-[#1967D2] focus:ring-[#1967D2]"
                      />
                      <span>All Deals</span>
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="forecastOn"
                        value="Selected Deals"
                        checked={createModal.forecastOn === 'Selected Deals'}
                        onChange={() => {
                          setCreateModal((m) => ({
                            ...m,
                            forecastOn: 'Selected Deals',
                            selectedDealIds:
                              m.selectedDealIds.length > 0
                                ? m.selectedDealIds
                                : eligibleDealsForPeriod.slice(0, 5).map((d) => d.id),
                          }));
                        }}
                        className="h-4 w-4 text-[#1967D2] focus:ring-[#1967D2]"
                      />
                      <span>Selected Deals</span>
                    </label>
                  </div>
                </div>

                {/* Searchable Deal Picker when "Selected Deals" is chosen */}
                {createModal.forecastOn === 'Selected Deals' && (
                  <div className="sm:pl-36 space-y-2">
                    <div className="p-3 bg-[#F8FAFD] border border-line rounded-lg space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[12px] font-semibold text-ink">
                          Select Deals for Forecast Period ({createModal.selectedDealIds.length} of {eligibleDealsForPeriod.length} selected)
                        </span>
                        <div className="flex items-center gap-2 text-[11.5px]">
                          <button
                            type="button"
                            onClick={() =>
                              setCreateModal((m) => ({
                                ...m,
                                selectedDealIds: eligibleDealsForPeriod.map((d) => d.id),
                                errors: { ...m.errors, selectedDeals: undefined },
                              }))
                            }
                            className="text-primary hover:underline"
                          >
                            Select All
                          </button>
                          <span>·</span>
                          <button
                            type="button"
                            onClick={() =>
                              setCreateModal((m) => ({
                                ...m,
                                selectedDealIds: [],
                              }))
                            }
                            className="text-ink-500 hover:underline"
                          >
                            Deselect All
                          </button>
                        </div>
                      </div>

                      {/* Search Deals Input */}
                      <div className="relative">
                        <Search
                          size={13}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"
                        />
                        <input
                          type="text"
                          data-testid="selected-deals-search-input"
                          value={createModal.dealSearchQuery || ''}
                          onChange={(e) =>
                            setCreateModal((m) => ({ ...m, dealSearchQuery: e.target.value }))
                          }
                          placeholder="Search deals by name, account, owner, or stage..."
                          aria-label="Search deals for forecast"
                          className="w-full h-7 pl-7 pr-2.5 rounded border border-line bg-white text-[12px] text-ink focus:outline-none focus:border-[#1967D2]"
                        />
                      </div>

                      <div className="max-h-[160px] overflow-y-auto thin-scroll divide-y divide-line-soft bg-white border border-line rounded">
                        {searchedDealsForPicker.length === 0 ? (
                          <p className="p-3 text-center text-[12px] text-ink-500">
                            No matching deals found in this period.
                          </p>
                        ) : (
                          searchedDealsForPicker.map((deal) => {
                            const checked = createModal.selectedDealIds.includes(deal.id);
                            return (
                              <label
                                key={deal.id}
                                className="px-2.5 py-1.5 flex items-center justify-between text-[12px] hover:bg-page cursor-pointer"
                              >
                                <div className="flex items-center gap-2 min-w-0 pr-2">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => {
                                      const c = e.target.checked;
                                      setCreateModal((m) => {
                                        const next = c
                                          ? [...m.selectedDealIds, deal.id]
                                          : m.selectedDealIds.filter((id) => id !== deal.id);
                                        return {
                                          ...m,
                                          selectedDealIds: next,
                                          errors: { ...m.errors, selectedDeals: undefined },
                                        };
                                      });
                                    }}
                                    className="rounded border-line text-[#1967D2] focus:ring-[#1967D2]"
                                  />
                                  <span className="truncate font-medium text-ink">{deal.name}</span>
                                  <span className="text-[11px] text-ink-400 truncate">({deal.stage})</span>
                                </div>
                                <span className="text-ink font-semibold shrink-0">
                                  {fmtINR2(deal.amount)}
                                </span>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                    {createModal.errors.selectedDeals && (
                      <p className="text-[12px] text-danger">{createModal.errors.selectedDeals}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Footer Buttons */}
              <div className="pt-4 border-t border-line flex items-center justify-end gap-3">
                <button
                  type="button"
                  data-testid="create-forecast-cancel-btn"
                  onClick={() => setCreateModal(null)}
                  className="btn-secondary h-8 px-4 text-[13px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="create-forecast-next-btn"
                  className="h-8 px-5 rounded-md bg-[#1967D2] hover:bg-[#1557B0] text-white text-[13px] font-medium shadow-sm transition-colors focus:outline-none"
                >
                  Next
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scope Selector Popover / Modal */}
      <ScopeSelectorModal
        open={scopeModalOpen}
        onClose={() => setScopeModalOpen(false)}
        value={scopeFilter}
        onChange={setScopeFilter}
        options={scopeOptions}
      />

      {/* Edit Forecast Target Modal */}
      {editModal && (
        <Modal
          open={!!editModal}
          onClose={() => setEditModal(null)}
          title={`Edit Forecast Target — ${editModal.name}`}
          size="md"
          footer={
            <>
              <button type="button" onClick={() => setEditModal(null)} className="btn-secondary">
                Cancel
              </button>
              <button
                type="submit"
                form="edit-forecast-target-form"
                className="btn-primary bg-[#1967D2] hover:bg-[#1557B0]"
              >
                Save Target
              </button>
            </>
          }
        >
          <form
            id="edit-forecast-target-form"
            onSubmit={(e) => {
              e.preventDefault();
              const amt = Number(editModal.target);
              if (!Number.isFinite(amt) || amt < 0) {
                toast.error('Target must be a non-negative amount.');
                return;
              }
              updateRecord('forecasts', editModal.id, {
                target: Math.max(0, amt || 0),
                name: editModal.name,
                hierarchyTargets: {
                  ...(editModal.hierarchyTargets || {}),
                  ORG: Math.max(0, amt || 0),
                },
              });
              toast.success(`Updated target for "${editModal.name}".`);
              setEditModal(null);
            }}
            className="space-y-4 text-[13px]"
          >
            <div>
              <label className="block text-[12.5px] font-medium text-ink-600 mb-1">
                Forecast Name
              </label>
              <input
                type="text"
                value={editModal.name}
                onChange={(e) => setEditModal((m) => ({ ...m, name: e.target.value }))}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-[12.5px] font-medium text-ink-600 mb-1">
                Target Amount (INR ₹)
              </label>
              <input
                type="number"
                min="0"
                step="50000"
                value={editModal.target ?? 0}
                onChange={(e) => setEditModal((m) => ({ ...m, target: e.target.value }))}
                className="input"
              />
              <p className="text-[11.5px] text-ink-500 mt-1">
                Preview: {fmtINR2(Number(editModal.target) || 0)} (Enter 0 to test zero-target handling)
              </p>
            </div>
          </form>
        </Modal>
      )}

      {/* Inline Quick Deal Edit Modal (to test live recalculations) */}
      <Modal
        open={!!dealEditModal}
        onClose={() => setDealEditModal(null)}
        title={`Edit Deal — ${dealEditModal?.name || ''}`}
        subtitle="Changes to amount, stage, probability, or closing date immediately recalculate forecast totals."
        size="md"
        footer={
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setDealEditModal(null)}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="quick-deal-edit-form"
              className="btn-primary bg-[#1967D2] hover:bg-[#1557B0]"
            >
              Save Deal &amp; Recalculate
            </button>
          </>
        }
      >
        {dealEditModal && (
          <form id="quick-deal-edit-form" onSubmit={handleDealEditSave} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-[13px]">
            <div className="sm:col-span-2">
              <label className="block text-[12.5px] font-medium text-ink-600 mb-1">Deal Name</label>
              <input
                type="text"
                value={dealEditModal.name || ''}
                onChange={(e) => setDealEditModal((d) => ({ ...d, name: e.target.value }))}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-[12.5px] font-medium text-ink-600 mb-1">Stage</label>
              <select
                value={dealEditModal.stage}
                onChange={(e) => {
                  const st = e.target.value;
                  const defaultProb = STAGE_PROBABILITY[st] ?? dealEditModal.probability;
                  const defaultCat =
                    st === 'Closed Won'
                      ? 'Closed Won'
                      : st === 'Closed Lost'
                      ? 'Omitted'
                      : st === 'Negotiation'
                      ? 'Commit'
                      : st === 'Proposal'
                      ? 'Best Case'
                      : 'Pipeline';
                  setDealEditModal((d) => ({
                    ...d,
                    stage: st,
                    probability: defaultProb,
                    forecastCategory: defaultCat,
                  }));
                }}
                className="input"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[12.5px] font-medium text-ink-600 mb-1">Forecast Category</label>
              <select
                value={dealEditModal.forecastCategory || 'Pipeline'}
                onChange={(e) => setDealEditModal((d) => ({ ...d, forecastCategory: e.target.value }))}
                className="input"
              >
                <option value="Pipeline">Pipeline</option>
                <option value="Best Case">Best Case (Subset of Pipeline)</option>
                <option value="Commit">Commit (Subset of Pipeline)</option>
                <option value="Closed Won">Closed Won</option>
                <option value="Omitted">Omitted</option>
              </select>
            </div>

            <div>
              <label className="block text-[12.5px] font-medium text-ink-600 mb-1">Amount (INR ₹)</label>
              <input
                type="number"
                min="0"
                step="10000"
                value={dealEditModal.amount ?? 0}
                onChange={(e) => setDealEditModal((d) => ({ ...d, amount: e.target.value }))}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-[12.5px] font-medium text-ink-600 mb-1">Probability (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={dealEditModal.probability ?? 0}
                onChange={(e) => setDealEditModal((d) => ({ ...d, probability: e.target.value }))}
                className="input"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[12.5px] font-medium text-ink-600 mb-1">Closing Date</label>
              <input
                type="date"
                value={(dealEditModal.closingDate || '').slice(0, 10)}
                onChange={(e) => setDealEditModal((d) => ({ ...d, closingDate: e.target.value }))}
                className="input"
                required
              />
            </div>
          </form>
        )}
      </Modal>

      {/* Help & Methodology Modal */}
      <Modal
        open={helpModal}
        onClose={() => setHelpModal(false)}
        title="Forecast Methodology & Calculation Rules"
        size="lg"
        footer={
          <button type="button" className="btn-primary" onClick={() => setHelpModal(false)}>
            Got it
          </button>
        }
      >
        <div className="space-y-3 text-[13px] text-ink-600 leading-relaxed">
          <p>
            All forecast figures calculate dynamically from live CRM deal records using{' '}
            <code className="bg-page px-1.5 py-0.5 rounded text-ink font-medium">Deal.{FORECAST_DATE_FIELD}</code> in{' '}
            <strong>{FORECAST_TIMEZONE}</strong>:
          </p>
          <ul className="space-y-2 list-disc pl-5">
            <li>
              <strong>Achievement:</strong> Sum of <em>Closed Won</em> deal revenue closing within the period.
            </li>
            <li>
              <strong>Achievement %:</strong> <code>(Achievement ÷ Target) × 100</code>. Displays <code>(—)</code> when Target is ₹0.00.
            </li>
            <li>
              <strong>Gap &amp; Shortfall:</strong> <code>Target − Achievement</code>. Shortfalls are shown in red with a down triangle (<code>▼ X.X%</code>); exceeded targets are shown in green with an up triangle (<code>▲ X.X%</code>).
            </li>
            <li>
              <strong>Pipeline:</strong> Total eligible open-deal revenue in the period (excludes <em>Closed Won</em>, <em>Closed Lost</em>, and <em>Omitted</em>).
            </li>
            <li>
              <strong>Committed &amp; Best Case:</strong> Open deals classified as <em>Commit</em> or <em>Best Case</em>. These are strict subsets of <strong>Pipeline</strong> and are never double-counted.
            </li>
            <li>
              <strong>Predicted Achievement:</strong> <code>Achievement + ∑(Open Deal Amount × Probability %)</code>.
            </li>
            <li>
              <strong>Hierarchy Target Rules:</strong> Parent targets (Company and Role/Team) automatically sum their children&apos;s targets unless manually overridden, preventing accidental double counting.
            </li>
          </ul>
        </div>
      </Modal>

      {/* Confirm Delete Forecast Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteRecords('forecasts', [deleteTarget.id]);
            toast.info(`Deleted forecast "${deleteTarget.name}" (${getPeriodBounds(deleteTarget.periodType, deleteTarget.year, deleteTarget.periodKey).shortLabel}).`);
            setDeleteTarget(null);
          }
        }}
        title="Delete Forecast Period?"
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}" for ${
                getPeriodBounds(deleteTarget.periodType, deleteTarget.year, deleteTarget.periodKey).label
              }?`
            : ''
        }
        confirmLabel="Delete Forecast"
      />
    </div>
  );
}
