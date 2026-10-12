import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus, ChevronDown, ChevronRight, ChevronLeft, Search, Star,
  Filter, X, Download, RefreshCw, Trash2, Pencil, ArrowUp,
  ArrowDown, GripVertical, Check, Info, Users, Lock,
  MoreHorizontal, Maximize2, Minimize2, Copy, Play, Pause,
  SlidersHorizontal, LayoutGrid, ArrowLeft, ExternalLink,
  UserCheck, FolderKanban, AlertTriangle, Settings, RotateCcw,
} from 'lucide-react';
import { useCRM } from '../../context/crmContextInstance';
import ZohoCustomizationModal from '../Leads/ZohoCustomizationModal';
import { loadCustomization, useZohoCustomization } from '../Leads/zohoCustomizationConfig';
import { todayISO } from '../../utils/calculations';
import { exportCSV } from '../../utils/exportCSV';
import {
  CATEGORIES_LIST,
  DATE_FILTER_OPTIONS,
  DEFAULT_FILTER_STATE,
  REPORT_BY_ID,
  REPORT_BY_KEY,
  REPORT_CATALOG,
  SESSION_KEY_RETURN,
  buildUnifiedCallRecords,
  describeDateFilter,
  filterRecordsForReportKey,
  formatCurrencyINR,
  formatDateTimeDisplay,
  formatNumber,
  matchesDateFilter,
} from './dashboardReportUtils';

const DEFAULT_CALL_COMPONENTS = [
  {
    id: 'comp-overall-call-count',
    title: 'Overall Call Count',
    reportKey: 'overall_all',
    reportId: 'rep-overall-call-count',
    reportName: 'Overall Call Count',
    sourceLabel: 'Overall Call Count',
    sourceModule: 'Calls',
    fullWidth: true, // First component MUST span full available width
    compFilter: { ownerId: '', callType: '', callStatus: '', minDuration: '' },
  },
  {
    id: 'comp-overall-unattend-calls',
    title: 'Overall Un Attend Calls',
    reportKey: 'overall_unattended',
    reportId: 'rep-overall-unattend-calls',
    reportName: 'Overall Un Attend Calls',
    sourceLabel: 'Overall Un Attend Calls',
    sourceModule: 'Calls',
    fullWidth: false,
    compFilter: { ownerId: '', callType: '', callStatus: '', minDuration: '' },
  },
  {
    id: 'comp-overall-attend-calls',
    title: 'Overall Attend Calls',
    reportKey: 'overall_attended',
    reportId: 'rep-overall-attend-calls',
    reportName: 'Overall Attend Calls',
    sourceLabel: 'Overall Attend Calls',
    sourceModule: 'Calls',
    fullWidth: false,
    compFilter: { ownerId: '', callType: '', callStatus: '', minDuration: '' },
  },
  {
    id: 'comp-leads-call-count',
    title: 'Leads Call Count',
    reportKey: 'leads_calls',
    reportId: 'rep-lead-call-report',
    reportName: 'Lead Call Report',
    sourceLabel: 'Lead Call Report',
    sourceModule: 'Leads with Calls',
    fullWidth: false,
    compFilter: { ownerId: '', callType: '', callStatus: '', minDuration: '' },
  },
  {
    id: 'comp-deals-call-live',
    title: 'Deals Call Report Live Data',
    reportKey: 'deals_live_calls',
    reportId: 'rep-deal-call-live',
    reportName: 'Deal Call Report Live Data',
    sourceLabel: 'Deal Call Report Live Data',
    sourceModule: 'Deals with Calls',
    fullWidth: false,
    compFilter: { ownerId: '', callType: '', callStatus: '', minDuration: '' },
  },
  {
    id: 'comp-deals-call-old',
    title: 'Deals Old Data Call Report',
    reportKey: 'deals_old_calls',
    reportId: 'rep-deal-call-old',
    reportName: 'Deals Old Data Call Report',
    sourceLabel: 'Deals Old Data Call Report',
    sourceModule: 'Old Deals with Calls',
    fullWidth: false,
    compFilter: { ownerId: '', callType: '', callStatus: '', minDuration: '' },
  },
  {
    id: 'comp-deals-contact-call',
    title: 'Deals Contact Call Count',
    reportKey: 'deals_contact_calls',
    reportId: 'rep-deal-contact-call',
    reportName: 'Deals Contact Call Count',
    sourceLabel: 'Deals Contact Call Count',
    sourceModule: 'Contacts with Calls',
    fullWidth: false,
    compFilter: { ownerId: '', callType: '', callStatus: '', minDuration: '' },
  },
];

const enrichComponentMetadata = (c) => {
  const cat = REPORT_BY_KEY[c.reportKey] || REPORT_CATALOG[0];
  return {
    ...c,
    reportId: c.reportId || cat.reportId,
    reportName: c.reportName || cat.reportName,
    sourceLabel: c.sourceLabel || cat.sourceLabel,
    sourceModule: c.sourceModule || cat.sourceModule,
    compFilter: { ownerId: '', callType: '', callStatus: '', minDuration: '', ...(c.compFilter || {}) },
  };
};

const cloneDefaultComponents = (keys = null) => {
  const list = keys
    ? DEFAULT_CALL_COMPONENTS.filter((c) => keys.includes(c.reportKey))
    : DEFAULT_CALL_COMPONENTS;
  return list.map((c, idx) => enrichComponentMetadata({ ...c, fullWidth: idx === 0 ? true : c.fullWidth }));
};

const INITIAL_DASHBOARDS = [
  {
    id: 'dash-call-all-users',
    name: 'Call Dashboard For All Users',
    description: 'Organization-wide Call Analytics: Overall Call Count, Attended, Un-Attended, Leads, Live Deals, Old Deals & Contact Call Reports.',
    shareWith: 'All Users',
    customSharedUsers: [],
    favorite: true,
    createdBy: 'Sibi Chakaravarthi',
    modifiedBy: 'Sibi Chakaravarthi',
    updatedAt: '12 Oct 2026 09:30 AM',
    components: cloneDefaultComponents(),
    savedFilters: JSON.parse(JSON.stringify(DEFAULT_FILTER_STATE)),
    enabledFilters: { callOwner: true, callStartTime: true, createdTime: true },
  },
  {
    id: 'dash-call-main',
    name: 'Call Dashboard',
    description: 'User-wise Call Count and Sum of Call Duration (In Seconds) across Calls, Leads, Deals, and Contacts.',
    shareWith: 'All Users',
    customSharedUsers: [],
    favorite: true,
    createdBy: 'Sibi Chakaravarthi',
    modifiedBy: 'Sibi Chakaravarthi',
    updatedAt: '12 Oct 2026 09:15 AM',
    components: cloneDefaultComponents(),
    savedFilters: JSON.parse(JSON.stringify(DEFAULT_FILTER_STATE)),
    enabledFilters: { callOwner: true, callStartTime: true, createdTime: true },
  },
  {
    id: 'dash-sales-followup',
    name: 'Sales Followup Trend',
    description: 'Sales follow-up call activity and pipeline communication metrics.',
    shareWith: 'All Users',
    customSharedUsers: [],
    favorite: true,
    createdBy: 'Sibi Chakaravarthi',
    modifiedBy: 'Arun Kumar',
    updatedAt: '11 Oct 2026 04:20 PM',
    components: cloneDefaultComponents(['overall_all', 'overall_attended', 'overall_unattended', 'deals_live_calls', 'leads_calls']),
    savedFilters: JSON.parse(JSON.stringify(DEFAULT_FILTER_STATE)),
    enabledFilters: { callOwner: true, callStartTime: true, createdTime: true },
  },
  {
    id: 'dash-leads',
    name: 'Lead Dashboards',
    description: 'Lead call counts, follow-up durations, and owner-wise lead outreach.',
    shareWith: 'All Users',
    customSharedUsers: [],
    favorite: false,
    createdBy: 'Sibi Chakaravarthi',
    modifiedBy: 'Karthik S',
    updatedAt: '10 Oct 2026 11:00 AM',
    components: cloneDefaultComponents(['leads_calls', 'overall_all', 'overall_attended', 'overall_unattended']),
    savedFilters: JSON.parse(JSON.stringify(DEFAULT_FILTER_STATE)),
    enabledFilters: { callOwner: true, callStartTime: true, createdTime: true },
  },
  {
    id: 'dash-deals-live',
    name: 'Deal Dashboards_Live Data',
    description: 'Live Deal call reports, contact outreach, and talk time totals.',
    shareWith: 'All Users',
    customSharedUsers: [],
    favorite: false,
    createdBy: 'Sibi Chakaravarthi',
    modifiedBy: 'Priya Sharma',
    updatedAt: '09 Oct 2026 05:45 PM',
    components: cloneDefaultComponents(['deals_live_calls', 'deals_contact_calls', 'overall_all', 'overall_attended']),
    savedFilters: JSON.parse(JSON.stringify(DEFAULT_FILTER_STATE)),
    enabledFilters: { callOwner: true, callStartTime: true, createdTime: true },
  },
  {
    id: 'dash-deals-old',
    name: 'Deal Dashboards_Old Data',
    description: 'Historical Deal call reports and archival client communication logs.',
    shareWith: 'Only Me',
    customSharedUsers: [],
    favorite: false,
    createdBy: 'Sibi Chakaravarthi',
    modifiedBy: 'Sibi Chakaravarthi',
    updatedAt: '08 Oct 2026 02:10 PM',
    components: cloneDefaultComponents(['deals_old_calls', 'deals_contact_calls', 'overall_all']),
    savedFilters: JSON.parse(JSON.stringify(DEFAULT_FILTER_STATE)),
    enabledFilters: { callOwner: true, callStartTime: true, createdTime: true },
  },
];

const STORAGE_KEY_DASHBOARDS = 'zcrm.callDashboards.v5';
const STORAGE_KEY_DELETED_DASHBOARDS = 'zcrm.callDashboards.deleted.v5';
const STORAGE_KEY_ACTIVE_ID = 'zcrm.callDashboards.activeId.v5';

// ============================================================================
// DATE FILTER POPOVER COMPONENT
// ============================================================================
export function DateFilterDropdown({ label, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const currentMode = value?.mode || 'Any Time';
  const isFiltered = currentMode !== 'Any Time';
  const summaryText = describeDateFilter(value);

  const selectMode = (mode) => {
    const today = todayISO();
    const patch = {
      ...value,
      mode,
      lastCount: value?.lastCount || 7,
      lastUnit: value?.lastUnit || 'Days',
      date: value?.date || today,
      from: value?.from || '2026-10-01',
      to: value?.to || today,
    };
    onChange(patch);
    if (!['Last', 'Before', 'After', 'Specific Date', 'Custom'].includes(mode)) {
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-2 h-[34px] px-3.5 rounded-[5px] border text-[14px] transition ${
          isFiltered
            ? 'bg-[#EEF4FF] border-[#93C5FD] text-[#1D4ED8] font-medium'
            : 'bg-white border-[#CBD5E1] text-[#334155] hover:border-[#94A3B8]'
        }`}
      >
        <span className="text-[#64748B] font-normal">{label} :</span>
        <span className="font-medium truncate max-w-[180px]">{summaryText}</span>
        <ChevronDown size={14} className="text-[#64748B] shrink-0" />
      </button>

      {open && (
        <div className="absolute left-0 top-[38px] z-50 w-[290px] bg-white border border-[#CBD5E1] rounded-[6px] shadow-[0_8px_24px_rgba(15,23,42,0.14)] py-1.5">
          <div className="px-3.5 py-1.5 border-b border-[#F1F5F9] text-[12px] font-semibold text-[#64748B] uppercase tracking-wider">
            {label}
          </div>
          <div className="max-h-[290px] overflow-y-auto py-1">
            {DATE_FILTER_OPTIONS.map((opt) => {
              const active = currentMode === opt;
              return (
                <div key={opt}>
                  <button
                    type="button"
                    onClick={() => selectMode(opt)}
                    className={`w-full flex items-center justify-between px-3.5 py-2 text-left text-[14px] transition ${
                      active
                        ? 'bg-[#EFF6FF] text-[#1D4ED8] font-medium'
                        : 'text-[#1E293B] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <span>{opt}</span>
                    {active && <Check size={14} className="text-[#1D4ED8]" />}
                  </button>

                  {active && opt === 'Last' && (
                    <div className="px-3.5 py-2 bg-[#F8FAFC] border-y border-[#E2E8F0] flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={365}
                        value={value.lastCount || 7}
                        onChange={(e) =>
                          onChange({ ...value, lastCount: Math.max(1, Number(e.target.value) || 1) })
                        }
                        className="w-[68px] h-[32px] px-2 border border-[#CBD5E1] rounded text-[13.5px] text-[#0F172A] bg-white focus:outline-none focus:border-[#2563EB]"
                      />
                      <select
                        value={value.lastUnit || 'Days'}
                        onChange={(e) => onChange({ ...value, lastUnit: e.target.value })}
                        className="flex-1 h-[32px] px-2 border border-[#CBD5E1] rounded text-[13.5px] text-[#0F172A] bg-white focus:outline-none focus:border-[#2563EB]"
                      >
                        <option value="Days">Days</option>
                        <option value="Weeks">Weeks</option>
                        <option value="Months">Months</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="px-3 py-1 bg-[#2563EB] text-white text-[13px] font-medium rounded hover:bg-[#1D4ED8]"
                      >
                        Done
                      </button>
                    </div>
                  )}

                  {active && (opt === 'Before' || opt === 'After' || opt === 'Specific Date') && (
                    <div className="px-3.5 py-2 bg-[#F8FAFC] border-y border-[#E2E8F0] space-y-1.5">
                      <label className="block text-[12.5px] font-medium text-[#475569]">
                        Select Date
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="date"
                          value={value.date || todayISO()}
                          onChange={(e) => onChange({ ...value, date: e.target.value })}
                          className="flex-1 h-[32px] px-2 border border-[#CBD5E1] rounded text-[13.5px] text-[#0F172A] bg-white focus:outline-none focus:border-[#2563EB]"
                        />
                        <button
                          type="button"
                          onClick={() => setOpen(false)}
                          className="px-3 h-[32px] bg-[#2563EB] text-white text-[13px] font-medium rounded hover:bg-[#1D4ED8]"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}

                  {active && opt === 'Custom' && (
                    <div className="px-3.5 py-2 bg-[#F8FAFC] border-y border-[#E2E8F0] space-y-2">
                      <div>
                        <label className="block text-[12.5px] font-medium text-[#475569] mb-0.5">
                          From
                        </label>
                        <input
                          type="date"
                          value={value.from || ''}
                          onChange={(e) => onChange({ ...value, from: e.target.value })}
                          className="w-full h-[32px] px-2 border border-[#CBD5E1] rounded text-[13.5px] text-[#0F172A] bg-white focus:outline-none focus:border-[#2563EB]"
                        />
                      </div>
                      <div>
                        <label className="block text-[12.5px] font-medium text-[#475569] mb-0.5">
                          To
                        </label>
                        <input
                          type="date"
                          value={value.to || ''}
                          onChange={(e) => onChange({ ...value, to: e.target.value })}
                          className="w-full h-[32px] px-2 border border-[#CBD5E1] rounded text-[13.5px] text-[#0F172A] bg-white focus:outline-none focus:border-[#2563EB]"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setOpen(false)}
                          className="px-3 py-1 bg-[#2563EB] text-white text-[13px] font-medium rounded hover:bg-[#1D4ED8]"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CALL OWNER FILTER DROPDOWN
// ============================================================================
export function CallOwnerFilterDropdown({ users, selectedIds, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  const loggedInUser = users[0] || {
    id: 'u1',
    name: 'Sibi Chakaravarthi',
    email: 'sibi.chakaravarthi@crm.in',
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.role || '').toLowerCase().includes(q)
    );
  }, [users, search]);

  const toggleUser = (id) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const isLoggedInSelected = selectedIds.includes(loggedInUser.id);

  const labelSummary = useMemo(() => {
    if (!selectedIds || selectedIds.length === 0) return 'All';
    const first = users.find((u) => u.id === selectedIds[0])?.name || '1 User';
    if (selectedIds.length === 1) return first;
    return `${first} +${selectedIds.length - 1}`;
  }, [selectedIds, users]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-2 h-[34px] px-3.5 rounded-[5px] border text-[14px] transition ${
          selectedIds.length > 0
            ? 'bg-[#EEF4FF] border-[#93C5FD] text-[#1D4ED8] font-medium'
            : 'bg-white border-[#CBD5E1] text-[#334155] hover:border-[#94A3B8]'
        }`}
      >
        <span className="text-[#64748B] font-normal">Call Owner (Calls) :</span>
        <span className="font-medium truncate max-w-[175px]">{labelSummary}</span>
        <ChevronDown size={14} className="text-[#64748B] shrink-0" />
      </button>

      {open && (
        <div className="absolute left-0 top-[38px] z-50 w-[345px] bg-white border border-[#CBD5E1] rounded-[6px] shadow-[0_8px_24px_rgba(15,23,42,0.16)] overflow-hidden">
          <div className="p-2.5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users by name or email..."
                autoFocus
                className="w-full h-[34px] pl-9 pr-7 bg-white border border-[#CBD5E1] rounded-[4px] text-[14px] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569]"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between px-3.5 py-2 bg-[#F8FAFC] border-b border-[#E2E8F0] text-[13px]">
            <span className="font-semibold text-[#475569]">
              Active Users ({filteredUsers.length})
            </span>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => onChange(users.map((u) => u.id))}
                className="text-[#2563EB] hover:underline font-medium"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-[#64748B] hover:text-[#0F172A]"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="max-h-[290px] overflow-y-auto divide-y divide-[#F1F5F9]">
            {!search.trim() && (
              <div className="bg-[#F8FAFC]/70">
                <div className="px-3 pt-1.5 pb-0.5 text-[10.5px] font-semibold text-[#64748B] uppercase tracking-wider">
                  Logged-in User
                </div>
                <button
                  type="button"
                  onClick={() => toggleUser(loggedInUser.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[#EFF6FF] transition"
                >
                  <span
                    className={`w-4 h-4 rounded-[3px] flex items-center justify-center border shrink-0 ${
                      isLoggedInSelected
                        ? 'bg-[#2563EB] border-[#2563EB] text-white'
                        : 'border-[#CBD5E1] bg-white'
                    }`}
                  >
                    {isLoggedInSelected && <Check size={11} strokeWidth={3} />}
                  </span>
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-semibold shrink-0"
                    style={{ backgroundColor: loggedInUser.color || '#1262E0' }}
                  >
                    {loggedInUser.name
                      .split(' ')
                      .map((p) => p[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12.5px] font-medium text-[#0F172A] truncate">
                        {loggedInUser.name}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-blue-50 text-[#1D4ED8] border border-blue-200 text-[10px] font-medium">
                        Logged-in User
                      </span>
                    </div>
                    <div className="text-[11.5px] text-[#64748B] truncate">
                      {loggedInUser.email}
                    </div>
                  </div>
                </button>
              </div>
            )}

            <div>
              <div className="px-3 pt-1.5 pb-0.5 text-[10.5px] font-semibold text-[#64748B] uppercase tracking-wider">
                Active Users
              </div>
              {filteredUsers.length === 0 ? (
                <div className="px-3 py-6 text-center text-[12.5px] text-[#64748B]">
                  No active users matching &ldquo;{search}&rdquo;
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const checked = selectedIds.includes(user.id);
                  const initials = user.name
                    .split(' ')
                    .map((p) => p[0])
                    .join('')
                    .slice(0, 2);
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => toggleUser(user.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition ${
                        checked ? 'bg-[#EFF6FF]/70' : 'hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-[3px] flex items-center justify-center border shrink-0 ${
                          checked
                            ? 'bg-[#2563EB] border-[#2563EB] text-white'
                            : 'border-[#CBD5E1] bg-white'
                        }`}
                      >
                        {checked && <Check size={11} strokeWidth={3} />}
                      </span>
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-semibold shrink-0"
                        style={{ backgroundColor: user.color || '#1F6FEB' }}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[12.5px] font-medium text-[#0F172A] truncate">
                          {user.name}
                        </div>
                        <div className="text-[11.5px] text-[#64748B] truncate">
                          {user.email}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="px-3 py-2 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between">
            <span className="text-[11.5px] text-[#64748B]">
              {selectedIds.length === 0
                ? 'All users included'
                : `${selectedIds.length} user${selectedIds.length > 1 ? 's' : ''} selected`}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-1 bg-[#2563EB] text-white text-[12px] font-medium rounded hover:bg-[#1D4ED8]"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN ZOHO CRM DASHBOARD COMPONENT
// ============================================================================
export default function Dashboard() {
  const crm = useCRM();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    calls = [],
    leads = [],
    deals = [],
    oldDeals = [],
    contacts = [],
    users = [],
    userName,
    contactName,
    notify,
  } = crm;

  useZohoCustomization();

  const containerRef = useRef(null);

  // --------------------------------------------------------------------------
  // 1. PERSISTED DASHBOARDS & DELETED DASHBOARDS STATE
  // --------------------------------------------------------------------------
  const [dashboards, setDashboards] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_DASHBOARDS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((d) => ({
            ...d,
            modifiedBy: d.modifiedBy || d.createdBy || 'Sibi Chakaravarthi',
            components: (d.components || []).map(enrichComponentMetadata),
          }));
        }
      }
    } catch {
      // fallback to default
    }
    return INITIAL_DASHBOARDS;
  });

  const [deletedDashboards, setDeletedDashboards] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_DELETED_DASHBOARDS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [
      {
        id: 'dash-deleted-sample',
        name: 'Q3 Regional Call Summary',
        description: 'Archived Q3 South India call summary dashboard.',
        shareWith: 'All Users',
        customSharedUsers: [],
        favorite: false,
        createdBy: 'Arun Kumar',
        modifiedBy: 'Sibi Chakaravarthi',
        deletedBy: 'Sibi Chakaravarthi',
        deletedAt: '05 Oct 2026 06:15 PM',
        updatedAt: '05 Oct 2026 06:15 PM',
        components: cloneDefaultComponents(['overall_all', 'leads_calls']),
        savedFilters: JSON.parse(JSON.stringify(DEFAULT_FILTER_STATE)),
        enabledFilters: { callOwner: true, callStartTime: true, createdTime: true },
      },
    ];
  });

  const [activeDashboardId, setActiveDashboardId] = useState(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
      if (savedId) return savedId;
    } catch {
      // ignore
    }
    return INITIAL_DASHBOARDS[0].id;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DASHBOARDS, JSON.stringify(dashboards));
    } catch {
      // ignore
    }
  }, [dashboards]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DELETED_DASHBOARDS, JSON.stringify(deletedDashboards));
    } catch {
      // ignore
    }
  }, [deletedDashboards]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_ID, activeDashboardId);
    } catch {
      // ignore
    }
  }, [activeDashboardId]);

  const activeDashboard = useMemo(
    () => dashboards.find((d) => d.id === activeDashboardId) || dashboards[0],
    [dashboards, activeDashboardId]
  );

  // --------------------------------------------------------------------------
  // 2. TOOLBAR, MANAGE DASHBOARDS PAGE & FILTER BAR STATE
  // --------------------------------------------------------------------------
  const isManageRoute =
    location.pathname.endsWith('/manage') || searchParams.get('view') === 'manage';
  const [manageDashboardsOpen, setManageDashboardsOpen] = useState(isManageRoute);
  const [manageTab, setManageTab] = useState('All Dashboards'); // 'All Dashboards' | 'Favorites' | 'Created by Me' | 'Shared with Me' | 'Public Dashboards' | 'Recently Deleted'
  const [manageSearch, setManageSearch] = useState('');

  useEffect(() => {
    if (location.pathname.endsWith('/manage') || searchParams.get('view') === 'manage') {
      setManageDashboardsOpen(true);
    }
  }, [location.pathname, searchParams]);

  const openManageDashboardsPage = () => {
    setSelectorOpen(false);
    setManageDashboardsOpen(true);
    setSearchParams({ view: 'manage' }, { replace: false });
  };

  const closeManageDashboardsPage = () => {
    setManageDashboardsOpen(false);
    if (location.pathname.endsWith('/manage')) {
      navigate('/dashboard');
    } else if (searchParams.get('view') === 'manage') {
      setSearchParams({}, { replace: true });
    }
  };

  const [categoryFilter, setCategoryFilter] = useState('All');
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectorSearch, setSelectorSearch] = useState('');
  const [infoOpen, setInfoOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [filterBarVisible, setFilterBarVisible] = useState(true);

  // Setup Modal state (Screenshot 1)
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [setupModalTab, setSetupModalTab] = useState('dropdowns');

  // Pending filters vs Applied filters
  const [pendingFilters, setPendingFilters] = useState(() =>
    activeDashboard?.savedFilters
      ? JSON.parse(JSON.stringify(activeDashboard.savedFilters))
      : JSON.parse(JSON.stringify(DEFAULT_FILTER_STATE))
  );
  const [appliedFilters, setAppliedFilters] = useState(() =>
    activeDashboard?.savedFilters
      ? JSON.parse(JSON.stringify(activeDashboard.savedFilters))
      : JSON.parse(JSON.stringify(DEFAULT_FILTER_STATE))
  );

  // Sync filters when switching dashboards
  const handleSelectDashboard = useCallback(
    (dashId) => {
      const target = dashboards.find((d) => d.id === dashId);
      if (!target) return;
      setActiveDashboardId(dashId);
      try {
        localStorage.setItem(STORAGE_KEY_ACTIVE_ID, dashId);
      } catch {
        // ignore
      }
      const nextFilters = target.savedFilters
        ? JSON.parse(JSON.stringify(target.savedFilters))
        : JSON.parse(JSON.stringify(DEFAULT_FILTER_STATE));
      setPendingFilters(nextFilters);
      setAppliedFilters(nextFilters);
      setDrillDown(null);
      setSelectorOpen(false);
      setSelectorSearch('');
    },
    [dashboards]
  );

  // Refresh & Full Screen states
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);
  const [refreshingCompIds, setRefreshingCompIds] = useState({});
  const [refreshTick, setRefreshTick] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Modals & Interactive Modes
  const [dashboardModal, setDashboardModal] = useState(null); // { mode: 'create' | 'edit' | 'clone', data: {...} }
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type: 'dashboard' | 'permanent-dashboard' | 'component', id, name }
  const [addComponentModal, setAddComponentModal] = useState(false);
  const [editComponentModal, setEditComponentModal] = useState(null);
  const [reorderMode, setReorderMode] = useState(false);
  const [editFiltersModal, setEditFiltersModal] = useState(false);
  const [presentationMode, setPresentationMode] = useState(null);

  // Component-level menus & filter popovers
  const [openCompMenuId, setOpenCompMenuId] = useState(null);
  const [openCompFilterId, setOpenCompFilterId] = useState(null);
  const [compSortMap, setCompSortMap] = useState({});

  // Drill-down state
  const [drillDown, setDrillDown] = useState(null);
  const [drillPage, setDrillPage] = useState(1);
  const [drillSearch, setDrillSearch] = useState('');
  const [drillSort, setDrillSort] = useState({ key: 'callStartTime', dir: 'desc' });

  // Outside click refs for toolbar dropdowns
  const categoryRef = useRef(null);
  const selectorRef = useRef(null);
  const infoRef = useRef(null);
  const moreRef = useRef(null);

  useEffect(() => {
    const onDocMouseDown = (e) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target)) setCategoryMenuOpen(false);
      if (selectorRef.current && !selectorRef.current.contains(e.target)) setSelectorOpen(false);
      if (infoRef.current && !infoRef.current.contains(e.target)) setInfoOpen(false);
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreMenuOpen(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  // --------------------------------------------------------------------------
  // 3. RESTORE SCROLL POSITION & DRILL-DOWN STATE ON BACK NAVIGATION
  // --------------------------------------------------------------------------
  useEffect(() => {
    try {
      if (location.state?.restoreDashboardId) {
        handleSelectDashboard(location.state.restoreDashboardId);
      }
      const savedRaw = sessionStorage.getItem(SESSION_KEY_RETURN);
      if (savedRaw) {
        const saved = JSON.parse(savedRaw);
        if (saved.activeDashboardId) setActiveDashboardId(saved.activeDashboardId);
        if (saved.appliedFilters) {
          setPendingFilters(saved.appliedFilters);
          setAppliedFilters(saved.appliedFilters);
        }
        if (saved.drillDown) {
          setDrillDown(saved.drillDown);
          setDrillPage(saved.drillPage || 1);
        }
        setTimeout(() => {
          if (typeof saved.windowScrollY === 'number') {
            window.scrollTo({ top: saved.windowScrollY, behavior: 'instant' });
          }
          if (containerRef.current && typeof saved.containerScrollTop === 'number') {
            containerRef.current.scrollTop = saved.containerScrollTop;
          }
        }, 40);
        sessionStorage.removeItem(SESSION_KEY_RETURN);
      }
    } catch {
      // ignore
    }
  }, [location.key, location.state, handleSelectDashboard]);

  const saveReturnStateBeforeNavigate = () => {
    try {
      sessionStorage.setItem(
        SESSION_KEY_RETURN,
        JSON.stringify({
          activeDashboardId,
          appliedFilters,
          drillDown,
          drillPage,
          windowScrollY: window.scrollY || 0,
          containerScrollTop: containerRef.current?.scrollTop || 0,
        })
      );
    } catch {
      // ignore
    }
  };

  // --------------------------------------------------------------------------
  // 4. BUILD DYNAMIC UNIFIED CALL RECORDS FROM ACTUAL BACKEND/CRM DATA
  // --------------------------------------------------------------------------
  const unifiedCallRecords = useMemo(() => {
    void refreshTick;
    return buildUnifiedCallRecords({
      calls,
      leads,
      deals,
      oldDeals,
      contacts,
      userName,
      contactName,
    });
  }, [calls, leads, deals, oldDeals, contacts, userName, contactName, refreshTick]);

  // --------------------------------------------------------------------------
  // 5. APPLY DASHBOARD-LEVEL FILTERS (Call Owner, Call Start Time, Created Time)
  // --------------------------------------------------------------------------
  const dashboardFilteredRecords = useMemo(() => {
    const today = todayISO();
    const ownerIds = appliedFilters?.callOwnerIds || [];
    const startFilter = appliedFilters?.callStartTime;
    const createdFilter = appliedFilters?.createdTime;

    return unifiedCallRecords.filter((rec) => {
      if (ownerIds.length > 0 && !ownerIds.includes(rec.ownerId)) {
        return false;
      }
      if (!matchesDateFilter(rec.callStartTime, startFilter, today)) {
        return false;
      }
      if (!matchesDateFilter(rec.createdTime, createdFilter, today)) {
        return false;
      }
      return true;
    });
  }, [unifiedCallRecords, appliedFilters]);

  // --------------------------------------------------------------------------
  // 6. COMPUTE REPORT COMPONENT DATASET & OWNER GROUPING
  // --------------------------------------------------------------------------
  const getRecordsForComponent = useCallback(
    (comp) => {
      const cf = comp.compFilter || {};
      const byReport = filterRecordsForReportKey(dashboardFilteredRecords, comp.reportKey);
      return byReport.filter((r) => {
        if (cf.ownerId && r.ownerId !== cf.ownerId) return false;
        if (cf.callType && r.callType !== cf.callType) return false;
        if (cf.callStatus && r.callStatus !== cf.callStatus) return false;
        if (cf.minDuration && r.durationSeconds < Number(cf.minDuration)) return false;
        return true;
      });
    },
    [dashboardFilteredRecords]
  );

  const buildComponentSummary = useCallback(
    (comp) => {
      const matchingRecords = getRecordsForComponent(comp);
      const byOwner = new Map();

      // Seed active users so all Call Owners in the filter scope are visible for scrolling & comparison
      const selectedOwners = appliedFilters?.callOwnerIds || [];
      users.forEach((u) => {
        if (selectedOwners.length > 0 && !selectedOwners.includes(u.id)) return;
        if (comp.compFilter?.ownerId && comp.compFilter.ownerId !== u.id) return;
        byOwner.set(u.id, {
          ownerId: u.id,
          callOwner: u.name,
          recordCount: 0,
          sumDurationSeconds: 0,
          records: [],
        });
      });

      matchingRecords.forEach((rec) => {
        const key = rec.ownerId;
        if (!byOwner.has(key)) {
          byOwner.set(key, {
            ownerId: rec.ownerId,
            callOwner: rec.callOwner,
            recordCount: 0,
            sumDurationSeconds: 0,
            records: [],
          });
        }
        const entry = byOwner.get(key);
        entry.recordCount += 1;
        entry.sumDurationSeconds += rec.durationSeconds;
        entry.records.push(rec);
      });

      // Keep owners with records, or all active users if records exist so table has scrollable rows
      let rows = Array.from(byOwner.values()).filter(
        (r) => r.recordCount > 0 || matchingRecords.length > 0
      );
      const sortCfg = compSortMap[comp.id] || { key: 'owner', dir: 'asc' };

      rows.sort((a, b) => {
        let cmp = 0;
        if (sortCfg.key === 'count') cmp = a.recordCount - b.recordCount;
        else if (sortCfg.key === 'duration') cmp = a.sumDurationSeconds - b.sumDurationSeconds;
        else cmp = a.callOwner.localeCompare(b.callOwner);
        return sortCfg.dir === 'asc' ? cmp : -cmp;
      });

      const totalCount = matchingRecords.length;
      const totalDurationSeconds = matchingRecords.reduce(
        (acc, r) => acc + (Number(r.durationSeconds) || 0),
        0
      );

      return {
        rows,
        totalCount,
        totalDurationSeconds,
        allRecords: matchingRecords,
      };
    },
    [getRecordsForComponent, compSortMap, users, appliedFilters]
  );

  // --------------------------------------------------------------------------
  // 7. FILTER ACTIONS: APPLY, APPLY AND SAVE, CLEAR
  // --------------------------------------------------------------------------
  const handleApplyFilters = () => {
    const next = JSON.parse(JSON.stringify(pendingFilters));
    setAppliedFilters(next);
    notify('Dashboard filters applied');
  };

  const handleApplyAndSaveFilters = () => {
    const next = JSON.parse(JSON.stringify(pendingFilters));
    setAppliedFilters(next);
    setDashboards((prev) =>
      prev.map((d) =>
        d.id === activeDashboard.id
          ? {
              ...d,
              savedFilters: next,
              modifiedBy: 'Sibi Chakaravarthi',
              updatedAt: 'Just now',
            }
          : d
      )
    );
    notify(`Filters applied and saved for "${activeDashboard.name}"`);
  };

  const handleResetFilters = () => {
    const fresh = JSON.parse(JSON.stringify(DEFAULT_FILTER_STATE));
    setPendingFilters(fresh);
    setAppliedFilters(fresh);
    setDashboards((prev) =>
      prev.map((d) =>
        d.id === activeDashboard.id ? { ...d, savedFilters: fresh } : d
      )
    );
    notify('Dashboard filters cleared', 'info');
  };

  const hasActiveDashboardFilters =
    (appliedFilters.callOwnerIds && appliedFilters.callOwnerIds.length > 0) ||
    (appliedFilters.callStartTime && appliedFilters.callStartTime.mode !== 'Any Time') ||
    (appliedFilters.createdTime && appliedFilters.createdTime.mode !== 'Any Time');

  // --------------------------------------------------------------------------
  // 8. DASHBOARD CRUD, FAVORITES, CLONE, DELETE & RESTORE, REORDER, REFRESH
  // --------------------------------------------------------------------------
  const checkRolePermission = (permKey, actionDesc) => {
    try {
      const custom = loadCustomization();
      const activeRole = custom?.activeRole || 'Administrator';
      const perms = custom?.rolePermissions?.[activeRole] || {};
      if (perms[permKey] === false) {
        notify(`Permission Denied: "${activeRole}" cannot ${actionDesc}.`, 'error');
        return false;
      }
    } catch {
      // default allow
    }
    return true;
  };

  const handleToggleFavorite = (dashId, e) => {
    if (e) e.stopPropagation();
    setDashboards((prev) =>
      prev.map((d) => (d.id === dashId ? { ...d, favorite: !d.favorite } : d))
    );
  };

  const handleRefreshAll = () => {
    setIsRefreshingAll(true);
    setRefreshTick((t) => t + 1);
    setTimeout(() => {
      setIsRefreshingAll(false);
      notify(`Refreshed "${activeDashboard.name}"`);
    }, 350);
  };

  const handleRefreshSingleComponent = (compId, compTitle) => {
    setRefreshingCompIds((prev) => ({ ...prev, [compId]: true }));
    setRefreshTick((t) => t + 1);
    setTimeout(() => {
      setRefreshingCompIds((prev) => ({ ...prev, [compId]: false }));
      notify(`Refreshed component "${compTitle}"`);
    }, 300);
  };

  const openCreateDashboardModal = () => {
    if (!checkRolePermission('canCreate', 'create dashboards')) return;
    setDashboardModal({
      mode: 'create',
      data: {
        name: '',
        description: '',
        shareWith: 'All Users',
        customSharedUsers: ['u1'],
      },
    });
  };

  const openEditDashboardModal = (dash = activeDashboard) => {
    if (!checkRolePermission('canEdit', 'edit dashboard details')) return;
    setDashboardModal({
      mode: 'edit',
      targetId: dash.id,
      data: {
        name: dash.name,
        description: dash.description || '',
        shareWith: dash.shareWith || 'All Users',
        customSharedUsers: dash.customSharedUsers || ['u1'],
      },
    });
  };

  const openCloneDashboardModal = (dash = activeDashboard) => {
    if (!checkRolePermission('canCreate', 'clone dashboards')) return;
    setDashboardModal({
      mode: 'clone',
      sourceDashboard: dash,
      data: {
        name: `Copy of ${dash.name}`,
        description: dash.description || '',
        shareWith: dash.shareWith || 'All Users',
        customSharedUsers: dash.customSharedUsers || ['u1'],
      },
    });
  };

  const handleSaveDashboardModal = (e) => {
    e.preventDefault();
    if (!dashboardModal) return;
    const { mode, data, targetId, sourceDashboard } = dashboardModal;
    const trimmedName = (data.name || '').trim();
    if (!trimmedName) {
      notify('Dashboard Name is required', 'error');
      return;
    }

    if (mode === 'create') {
      const newDash = {
        id: `dash-${Date.now().toString(36)}`,
        name: trimmedName,
        description: data.description.trim(),
        shareWith: data.shareWith,
        customSharedUsers: data.customSharedUsers || [],
        favorite: false,
        createdBy: 'Sibi Chakaravarthi',
        modifiedBy: 'Sibi Chakaravarthi',
        updatedAt: 'Just now',
        components: cloneDefaultComponents(),
        savedFilters: JSON.parse(JSON.stringify(DEFAULT_FILTER_STATE)),
        enabledFilters: { callOwner: true, callStartTime: true, createdTime: true },
      };
      setDashboards((prev) => [newDash, ...prev]);
      setActiveDashboardId(newDash.id);
      setPendingFilters(JSON.parse(JSON.stringify(DEFAULT_FILTER_STATE)));
      setAppliedFilters(JSON.parse(JSON.stringify(DEFAULT_FILTER_STATE)));
      notify(`Dashboard "${newDash.name}" created`);
    } else if (mode === 'clone' && sourceDashboard) {
      const clonedDash = {
        ...JSON.parse(JSON.stringify(sourceDashboard)),
        id: `dash-${Date.now().toString(36)}`,
        name: trimmedName,
        description: data.description.trim(),
        shareWith: data.shareWith,
        customSharedUsers: data.customSharedUsers || [],
        createdBy: 'Sibi Chakaravarthi',
        modifiedBy: 'Sibi Chakaravarthi',
        updatedAt: 'Just now',
      };
      setDashboards((prev) => [clonedDash, ...prev]);
      setActiveDashboardId(clonedDash.id);
      notify(`Dashboard cloned as "${clonedDash.name}"`);
    } else if (mode === 'edit') {
      setDashboards((prev) =>
        prev.map((d) =>
          d.id === targetId
            ? {
                ...d,
                name: trimmedName,
                description: data.description.trim(),
                shareWith: data.shareWith,
                customSharedUsers: data.customSharedUsers || [],
                modifiedBy: 'Sibi Chakaravarthi',
                updatedAt: 'Just now',
              }
            : d
        )
      );
      notify(`Dashboard "${trimmedName}" updated`);
    }

    setDashboardModal(null);
  };

  const requestDeleteDashboard = (dash = activeDashboard) => {
    if (!checkRolePermission('canDelete', 'delete dashboards')) return;
    if (dashboards.length <= 1) {
      notify('Cannot delete the only remaining dashboard.', 'error');
      return;
    }
    setDeleteConfirm({
      type: 'dashboard',
      id: dash.id,
      name: dash.name,
    });
  };

  const handleRestoreDashboard = (deletedDash) => {
    const restored = {
      ...deletedDash,
      updatedAt: 'Restored just now',
      modifiedBy: 'Sibi Chakaravarthi',
    };
    delete restored.deletedAt;
    delete restored.deletedBy;
    setDeletedDashboards((prev) => prev.filter((d) => d.id !== deletedDash.id));
    setDashboards((prev) => [restored, ...prev]);
    notify(`Dashboard "${deletedDash.name}" restored`, 'success');
  };

  const confirmDeleteAction = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'dashboard') {
      const target = dashboards.find((d) => d.id === deleteConfirm.id);
      const remaining = dashboards.filter((d) => d.id !== deleteConfirm.id);
      setDashboards(remaining);
      if (target) {
        setDeletedDashboards((prev) => [
          {
            ...target,
            deletedAt: '12 Oct 2026, Just now',
            deletedBy: 'Sibi Chakaravarthi',
          },
          ...prev,
        ]);
      }
      if (activeDashboardId === deleteConfirm.id && remaining[0]) {
        handleSelectDashboard(remaining[0].id);
      }
      notify(`Dashboard "${deleteConfirm.name}" moved to Recently Deleted`, 'info');
    } else if (deleteConfirm.type === 'permanent-dashboard') {
      setDeletedDashboards((prev) => prev.filter((d) => d.id !== deleteConfirm.id));
      notify(`Dashboard "${deleteConfirm.name}" permanently deleted`, 'info');
    } else if (deleteConfirm.type === 'component') {
      setDashboards((prev) =>
        prev.map((d) =>
          d.id === activeDashboard.id
            ? {
                ...d,
                components: d.components.filter((c) => c.id !== deleteConfirm.id),
                modifiedBy: 'Sibi Chakaravarthi',
                updatedAt: 'Just now',
              }
            : d
        )
      );
      notify(`Component "${deleteConfirm.name}" removed from dashboard`, 'info');
    }
    setDeleteConfirm(null);
  };

  // --------------------------------------------------------------------------
  // 9. COMPONENT MANAGEMENT: ADD, EDIT, REORDER, FILTER, DELETE
  // --------------------------------------------------------------------------
  const [newCompForm, setNewCompForm] = useState({
    reportKey: 'overall_all',
    title: 'Overall Call Count',
    fullWidth: false,
    ownerId: '',
  });

  const handleAddComponent = (e) => {
    e.preventDefault();
    const template =
      REPORT_CATALOG.find((r) => r.reportKey === newCompForm.reportKey) ||
      REPORT_CATALOG[0];
    const comp = {
      id: `comp-${Date.now().toString(36)}`,
      title: (newCompForm.title || template.title).trim(),
      reportKey: template.reportKey,
      reportId: template.reportId,
      reportName: template.reportName,
      sourceLabel: template.sourceLabel,
      sourceModule: template.sourceModule,
      fullWidth: Boolean(newCompForm.fullWidth),
      compFilter: {
        ownerId: newCompForm.ownerId || '',
        callType: '',
        callStatus: '',
        minDuration: '',
      },
    };
    setDashboards((prev) =>
      prev.map((d) =>
        d.id === activeDashboard.id
          ? {
              ...d,
              components: [...(d.components || []), comp],
              modifiedBy: 'Sibi Chakaravarthi',
              updatedAt: 'Just now',
            }
          : d
      )
    );
    setAddComponentModal(false);
    notify(`Component "${comp.title}" added to "${activeDashboard.name}"`);
  };

  const handleSaveEditComponent = (e) => {
    e.preventDefault();
    if (!editComponentModal) return;
    const template =
      REPORT_CATALOG.find((r) => r.reportKey === editComponentModal.reportKey) ||
      REPORT_CATALOG[0];
    setDashboards((prev) =>
      prev.map((d) =>
        d.id === activeDashboard.id
          ? {
              ...d,
              components: d.components.map((c) =>
                c.id === editComponentModal.id
                  ? {
                      ...c,
                      title: editComponentModal.title.trim() || template.title,
                      reportKey: editComponentModal.reportKey,
                      reportId: template.reportId,
                      reportName: template.reportName,
                      sourceLabel: template.sourceLabel,
                      sourceModule: template.sourceModule,
                      fullWidth: Boolean(editComponentModal.fullWidth),
                    }
                  : c
              ),
              modifiedBy: 'Sibi Chakaravarthi',
              updatedAt: 'Just now',
            }
          : d
      )
    );
    notify(`Component "${editComponentModal.title}" updated`);
    setEditComponentModal(null);
  };

  const handleMoveComponent = (compId, direction) => {
    setDashboards((prev) =>
      prev.map((d) => {
        if (d.id !== activeDashboard.id) return d;
        const list = [...(d.components || [])];
        const idx = list.findIndex((c) => c.id === compId);
        if (idx === -1) return d;
        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= list.length) return d;
        const [item] = list.splice(idx, 1);
        list.splice(targetIdx, 0, item);
        return { ...d, components: list, modifiedBy: 'Sibi Chakaravarthi', updatedAt: 'Just now' };
      })
    );
  };

  const handleToggleComponentWidth = (compId) => {
    setDashboards((prev) =>
      prev.map((d) =>
        d.id === activeDashboard.id
          ? {
              ...d,
              components: d.components.map((c) =>
                c.id === compId ? { ...c, fullWidth: !c.fullWidth } : c
              ),
            }
          : d
      )
    );
  };

  const handleUpdateCompFilter = (compId, filterPatch) => {
    setDashboards((prev) =>
      prev.map((d) =>
        d.id === activeDashboard.id
          ? {
              ...d,
              components: d.components.map((c) =>
                c.id === compId
                  ? { ...c, compFilter: { ...(c.compFilter || {}), ...filterPatch } }
                  : c
              ),
            }
          : d
      )
    );
  };

  const toggleCompSort = (compId, key) => {
    setCompSortMap((prev) => {
      const cur = prev[compId] || { key: 'owner', dir: 'asc' };
      const nextDir = cur.key === key && cur.dir === 'asc' ? 'desc' : 'asc';
      return { ...prev, [compId]: { key, dir: nextDir } };
    });
  };

  // --------------------------------------------------------------------------
  // 10. REPORT NAVIGATION ("Created from report - <Report Name>" -> Screenshot 5 & 6)
  // --------------------------------------------------------------------------
  const handleNavigateToReport = (comp, e) => {
    if (e) e.stopPropagation();
    const cat = REPORT_BY_KEY[comp.reportKey] || REPORT_CATALOG[0];
    const reportId = comp.reportId || cat.reportId;
    saveReturnStateBeforeNavigate();
    navigate(`/reports/${encodeURIComponent(reportId)}`, {
      state: {
        from: '/dashboard',
        dashboardId: activeDashboard.id,
        dashboardName: activeDashboard.name,
        appliedFilters,
        reportKey: comp.reportKey,
        componentTitle: comp.title,
      },
    });
  };

  // --------------------------------------------------------------------------
  // 11. DRILL-DOWN HANDLERS
  // --------------------------------------------------------------------------
  const openDrillDownForComponent = (comp, ownerRow = null) => {
    const cat = REPORT_BY_KEY[comp.reportKey] || REPORT_CATALOG[0];
    setDrillDown({
      compId: comp.id,
      compTitle: comp.title,
      reportKey: comp.reportKey,
      reportId: comp.reportId || cat.reportId,
      reportName: comp.reportName || cat.reportName,
      sourceModule: comp.sourceModule || cat.sourceModule,
      ownerId: ownerRow ? ownerRow.ownerId : null,
      ownerName: ownerRow ? ownerRow.callOwner : 'All Selected Owners',
    });
    setDrillPage(1);
    setDrillSearch('');
  };

  const drillDownRecords = useMemo(() => {
    if (!drillDown) return [];
    const targetComp =
      (activeDashboard.components || []).find((c) => c.id === drillDown.compId) || {
        id: drillDown.compId,
        title: drillDown.compTitle,
        reportKey: drillDown.reportKey,
        compFilter: {},
      };
    let recs = getRecordsForComponent(targetComp);
    if (drillDown.ownerId) {
      recs = recs.filter((r) => r.ownerId === drillDown.ownerId);
    }
    const q = drillSearch.trim().toLowerCase();
    if (q) {
      recs = recs.filter((r) =>
        [
          r.dealName,
          r.subject,
          r.categories,
          r.remarks,
          r.fullName,
          r.callOwner,
        ].some((val) => String(val || '').toLowerCase().includes(q))
      );
    }

    const sorted = [...recs].sort((a, b) => {
      const k = drillSort.key;
      let cmp = 0;
      if (k === 'amount' || k === 'durationSeconds') {
        cmp = (Number(a[k]) || 0) - (Number(b[k]) || 0);
      } else {
        cmp = String(a[k] || '').localeCompare(String(b[k] || ''));
      }
      return drillSort.dir === 'asc' ? cmp : -cmp;
    });

    return sorted;
  }, [drillDown, activeDashboard, getRecordsForComponent, drillSearch, drillSort]);

  const DRILL_PAGE_SIZE = 100;
  const drillTotalPages = Math.max(1, Math.ceil(drillDownRecords.length / DRILL_PAGE_SIZE));
  const safeDrillPage = Math.min(drillPage, drillTotalPages);
  const drillPageStart = (safeDrillPage - 1) * DRILL_PAGE_SIZE;
  const paginatedDrillRecords = drillDownRecords.slice(
    drillPageStart,
    drillPageStart + DRILL_PAGE_SIZE
  );

  const handleNavigateToDeal = (dealId) => {
    saveReturnStateBeforeNavigate();
    navigate(`/deals/${encodeURIComponent(dealId)}`, {
      state: { from: '/dashboard' },
    });
  };

  const handleNavigateToCall = (callId) => {
    saveReturnStateBeforeNavigate();
    navigate(`/calls/${encodeURIComponent(callId)}`, {
      state: { from: '/dashboard' },
    });
  };

  // --------------------------------------------------------------------------
  // 12. PRESENTATION AUTO-PLAY EFFECT
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!presentationMode?.playing) return undefined;
    const comps = activeDashboard.components || [];
    if (comps.length <= 1) return undefined;
    const timer = setInterval(() => {
      setPresentationMode((prev) =>
        prev ? { ...prev, index: (prev.index + 1) % comps.length } : null
      );
    }, 4500);
    return () => clearInterval(timer);
  }, [presentationMode?.playing, activeDashboard.components]);

  // --------------------------------------------------------------------------
  // 13. FILTERED DASHBOARDS FOR SELECTOR DROPDOWN (Screenshot 4)
  // --------------------------------------------------------------------------
  const selectorDashboards = useMemo(() => {
    const q = selectorSearch.trim().toLowerCase();
    return dashboards.filter((d) => {
      if (categoryFilter === 'Favorites' && !d.favorite) return false;
      if (categoryFilter === 'Created by Me' && d.createdBy !== 'Sibi Chakaravarthi') return false;
      if (categoryFilter === 'Shared with Me' && d.shareWith === 'Only Me') return false;
      if (categoryFilter === 'Public Dashboards' && d.shareWith !== 'All Users') return false;
      if (q && !d.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [dashboards, categoryFilter, selectorSearch]);

  // Filtered dashboards for Manage Dashboards Page (Screenshot 2)
  const manageFilteredDashboards = useMemo(() => {
    const q = manageSearch.trim().toLowerCase();
    const source = manageTab === 'Recently Deleted' ? deletedDashboards : dashboards;
    return source.filter((d) => {
      if (manageTab === 'Favorites' && !d.favorite) return false;
      if (manageTab === 'Created by Me' && d.createdBy !== 'Sibi Chakaravarthi') return false;
      if (manageTab === 'Shared with Me' && d.shareWith === 'Only Me') return false;
      if (manageTab === 'Public Dashboards' && d.shareWith !== 'All Users') return false;
      if (q) {
        const hay = `${d.name} ${d.description || ''} ${d.createdBy || ''} ${d.shareWith || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [dashboards, deletedDashboards, manageTab, manageSearch]);

  const enabledFilters = activeDashboard.enabledFilters || {
    callOwner: true,
    callStartTime: true,
    createdTime: true,
  };

  // ==========================================================================
  // RENDER: MANAGE DASHBOARDS FULL PAGE (Screenshot 2)
  // ==========================================================================
  if (manageDashboardsOpen) {
    return (
      <div className="-m-6 min-h-[calc(100vh-56px)] bg-[#F3F4F6] flex flex-col text-[#1E293B]">
        {/* Top Header Bar */}
        <div className="bg-white border-b border-[#DCE1E7] px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={closeManageDashboardsPage}
              title={`Back to ${activeDashboard.name}`}
              className="inline-flex items-center gap-1.5 h-[34px] px-3.5 rounded-[5px] border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[14px] font-medium text-[#1E293B] transition"
            >
              <ArrowLeft size={15} />
              <span>Back</span>
            </button>
            <div>
              <h1 className="text-[22px] font-bold text-[#0F172A] leading-tight">Manage Dashboards</h1>
              <p className="text-[13px] text-[#64748B]">
                Previous Dashboard: <span className="font-medium text-[#2563EB]">{activeDashboard.name}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search Dashboards */}
            <div className="relative w-[270px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
              <input
                type="text"
                value={manageSearch}
                onChange={(e) => setManageSearch(e.target.value)}
                placeholder="Search Dashboards..."
                className="w-full h-[34px] pl-9 pr-7 bg-white border border-[#CBD5E1] rounded-[5px] text-[14px] text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
              />
              {manageSearch && (
                <button
                  type="button"
                  onClick={() => setManageSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569]"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Recently Deleted Toggle Button */}
            <button
              type="button"
              onClick={() =>
                setManageTab((cur) =>
                  cur === 'Recently Deleted' ? 'All Dashboards' : 'Recently Deleted'
                )
              }
              className={`inline-flex items-center gap-1.5 h-[34px] px-3.5 rounded-[5px] border text-[14px] font-medium transition ${
                manageTab === 'Recently Deleted'
                  ? 'bg-[#FEF2F2] border-[#FCA5A5] text-[#DC2626]'
                  : 'bg-white border-[#CBD5E1] text-[#334155] hover:bg-[#F8FAFC]'
              }`}
            >
              <Trash2 size={14} />
              <span>Recently Deleted ({deletedDashboards.length})</span>
            </button>

            {/* Create Dashboard Button */}
            <button
              type="button"
              onClick={openCreateDashboardModal}
              className="inline-flex items-center gap-1.5 h-[34px] px-4 rounded-[5px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[14px] font-medium transition shadow-xs"
            >
              <Plus size={15} />
              <span>Create Dashboard</span>
            </button>
          </div>
        </div>

        {/* Category Filter Tabs Bar */}
        <div className="bg-[#F8FAFC] border-b border-[#DCE1E7] px-6 py-2.5 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {[
              'All Dashboards',
              'Favorites',
              'Public Dashboards',
              'Created by Me',
              'Shared with Me',
              'Recently Deleted',
            ].map((tabName) => {
              const active = manageTab === tabName;
              return (
                <button
                  key={tabName}
                  type="button"
                  onClick={() => setManageTab(tabName)}
                  className={`px-3.5 py-1.5 rounded-[5px] text-[14px] font-medium transition ${
                    active
                      ? 'bg-[#2563EB] text-white shadow-xs'
                      : 'bg-white border border-[#CBD5E1] text-[#475569] hover:bg-[#F1F5F9]'
                  }`}
                >
                  {tabName}
                </button>
              );
            })}
          </div>
          <div className="text-[14px] text-[#64748B]">
            Total: <span className="font-semibold text-[#0F172A]">{manageFilteredDashboards.length}</span> dashboard(s)
          </div>
        </div>

        {/* Manage Dashboards Table (Exact Screenshot 2 Columns) */}
        <div className="p-6 flex-1">
          <div className="bg-white border border-[#DCE1E7] rounded-[6px] shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#DCE1E7] text-[13.5px] font-semibold text-[#475569]">
                    <th className="py-3 px-4 border-r border-[#EEF2F6] w-[48px] text-center">★</th>
                    <th className="py-3 px-4 border-r border-[#EEF2F6]">Dashboard Name</th>
                    <th className="py-3 px-4 border-r border-[#EEF2F6]">Description</th>
                    <th className="py-3 px-4 border-r border-[#EEF2F6]">Created By</th>
                    <th className="py-3 px-4 border-r border-[#EEF2F6]">
                      {manageTab === 'Recently Deleted' ? 'Deleted Time' : 'Last Modified Time'}
                    </th>
                    <th className="py-3 px-4 border-r border-[#EEF2F6]">Shared With</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF2F6] text-[14px] text-[#1E293B]">
                  {manageFilteredDashboards.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#64748B]">
                        {manageTab === 'Recently Deleted'
                          ? 'No recently deleted dashboards.'
                          : 'No dashboards match your current filter criteria.'}
                      </td>
                    </tr>
                  ) : (
                    manageFilteredDashboards.map((d) => {
                      const isCurrent = d.id === activeDashboard.id;
                      return (
                        <tr key={d.id} className="hover:bg-[#F5F8FF] transition-colors">
                          <td className="py-3 px-4 border-r border-[#EEF2F6] text-center">
                            {manageTab !== 'Recently Deleted' ? (
                              <button
                                type="button"
                                onClick={(e) => handleToggleFavorite(d.id, e)}
                                title={d.favorite ? 'Remove from Favorites' : 'Add to Favorites'}
                              >
                                <Star
                                  size={16}
                                  className={
                                    d.favorite
                                      ? 'fill-[#F59E0B] text-[#F59E0B]'
                                      : 'text-[#94A3B8] hover:text-[#F59E0B]'
                                  }
                                />
                              </button>
                            ) : (
                              <Trash2 size={15} className="text-[#94A3B8] mx-auto" />
                            )}
                          </td>
                          <td className="py-3 px-4 border-r border-[#EEF2F6] font-semibold">
                            {manageTab === 'Recently Deleted' ? (
                              <span className="text-[#475569]">{d.name}</span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleSelectDashboard(d.id);
                                    closeManageDashboardsPage();
                                  }}
                                  className="text-[#1F6FEB] hover:underline text-left font-semibold"
                                >
                                  {d.name}
                                </button>
                                {isCurrent && (
                                  <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
                                    Active
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 border-r border-[#EEF2F6] text-[#475569] max-w-[340px] truncate">
                            {d.description || '—'}
                          </td>
                          <td className="py-3 px-4 border-r border-[#EEF2F6] text-[#334155] whitespace-nowrap">
                            {d.createdBy || 'Sibi Chakaravarthi'}
                          </td>
                          <td className="py-3 px-4 border-r border-[#EEF2F6] text-[#64748B] text-[13.5px] whitespace-nowrap">
                            {manageTab === 'Recently Deleted'
                              ? d.deletedAt || 'Recently'
                              : d.updatedAt || '12 Oct 2026'}
                          </td>
                          <td className="py-3 px-4 border-r border-[#EEF2F6] whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[13px] font-medium text-[#334155]">
                              {d.shareWith === 'Only Me' ? (
                                <Lock size={12.5} className="text-[#64748B]" />
                              ) : (
                                <Users size={12.5} className="text-[#2563EB]" />
                              )}
                              {d.shareWith || 'All Users'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {manageTab === 'Recently Deleted' ? (
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleRestoreDashboard(d)}
                                  className="px-3 py-1 rounded border border-[#93C5FD] bg-[#EFF6FF] text-[#1D4ED8] text-[13.5px] font-medium hover:bg-[#DBEAFE] inline-flex items-center gap-1"
                                >
                                  <RotateCcw size={13} /> Restore
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDeleteConfirm({
                                      type: 'permanent-dashboard',
                                      id: d.id,
                                      name: d.name,
                                    })
                                  }
                                  className="px-3 py-1 rounded border border-[#FCA5A5] text-[#DC2626] text-[13.5px] font-medium hover:bg-[#FEF2F2]"
                                >
                                  Delete Permanently
                                </button>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleSelectDashboard(d.id);
                                    closeManageDashboardsPage();
                                  }}
                                  className="px-3 py-1 text-[13.5px] border border-[#93C5FD] bg-[#EFF6FF] text-[#1D4ED8] rounded hover:bg-[#DBEAFE] font-medium"
                                >
                                  Open
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openEditDashboardModal(d)}
                                  className="px-3 py-1 text-[13.5px] border border-[#CBD5E1] rounded hover:bg-[#F8FAFC] text-[#334155]"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openCloneDashboardModal(d)}
                                  className="px-3 py-1 text-[13.5px] border border-[#CBD5E1] rounded hover:bg-[#F8FAFC] text-[#334155]"
                                >
                                  Clone
                                </button>
                                {dashboards.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => requestDeleteDashboard(d)}
                                    className="px-3 py-1 text-[13.5px] border border-[#FCA5A5] rounded hover:bg-[#FEF2F2] text-[#DC2626]"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modals rendered while on Manage Dashboards page */}
        {dashboardModal && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white border border-[#CBD5E1] rounded-[6px] shadow-[0_16px_40px_rgba(15,23,42,0.22)] w-full max-w-[500px] overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[#E2E8F0] flex items-center justify-between">
                <h3 className="text-[16px] font-semibold text-[#0F172A]">Dashboard Details</h3>
                <button
                  type="button"
                  onClick={() => setDashboardModal(null)}
                  className="text-[#64748B] hover:text-[#0F172A]"
                >
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleSaveDashboardModal} className="p-5 space-y-4 text-[14px]">
                <div>
                  <label className="block text-[14px] font-medium text-[#334155] mb-1">
                    Dashboard Name <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={dashboardModal.data.name}
                    onChange={(e) =>
                      setDashboardModal((prev) => ({
                        ...prev,
                        data: { ...prev.data, name: e.target.value },
                      }))
                    }
                    placeholder="Enter Dashboard Name"
                    className="w-full h-[36px] px-3 border border-l-[3px] border-[#CBD5E1] border-l-[#DC2626] rounded-[4px] text-[14px] text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-[14px] font-medium text-[#334155] mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={dashboardModal.data.description}
                    onChange={(e) =>
                      setDashboardModal((prev) => ({
                        ...prev,
                        data: { ...prev.data, description: e.target.value },
                      }))
                    }
                    placeholder="Add description for this dashboard"
                    className="w-full p-2.5 border border-[#CBD5E1] rounded-[4px] text-[14px] text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-[14px] font-medium text-[#334155] mb-2">
                    Share with
                  </label>
                  <div className="space-y-2">
                    {['Only Me', 'All Users', 'Custom'].map((opt) => (
                      <label
                        key={opt}
                        className="flex items-center gap-2.5 cursor-pointer text-[14px] text-[#1E293B]"
                      >
                        <input
                          type="radio"
                          name="shareWith"
                          checked={dashboardModal.data.shareWith === opt}
                          onChange={() =>
                            setDashboardModal((prev) => ({
                              ...prev,
                              data: { ...prev.data, shareWith: opt },
                            }))
                          }
                          className="accent-[#2563EB]"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setDashboardModal(null)}
                    className="h-[36px] px-4 rounded-[4px] border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[14px] font-medium text-[#334155]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-[36px] px-5 rounded-[4px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[14px] font-medium"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {deleteConfirm && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white border border-[#CBD5E1] rounded-[6px] shadow-[0_16px_40px_rgba(15,23,42,0.22)] w-full max-w-[420px] p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center shrink-0">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-[#0F172A]">
                    Delete Dashboard
                  </h3>
                  <p className="mt-1 text-[14px] text-[#475569] leading-relaxed">
                    Are you sure you want to delete{' '}
                    <span className="font-semibold text-[#0F172A]">
                      &ldquo;{deleteConfirm.name}&rdquo;
                    </span>
                    ?
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(null)}
                  className="h-[36px] px-4 rounded-[4px] border border-[#CBD5E1] bg-white text-[14px] font-medium text-[#334155]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteAction}
                  className="h-[36px] px-4 rounded-[4px] bg-[#DC2626] hover:bg-[#B91C1C] text-white text-[14px] font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================================================
  // RENDER: DRILL-DOWN SCREEN
  // ==========================================================================
  if (drillDown) {
    const ownerFilterSummary =
      drillDown.ownerName && drillDown.ownerName !== 'All Selected Owners'
        ? drillDown.ownerName
        : appliedFilters.callOwnerIds.length > 0
        ? appliedFilters.callOwnerIds.map((id) => userName(id)).join(', ')
        : 'All Users';

    const toggleDrillColumnSort = (key) => {
      setDrillSort((prev) => ({
        key,
        dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc',
      }));
    };

    return (
      <div className=" -m-6 min-h-[calc(100vh-56px)] bg-[#F3F4F6] flex flex-col text-[#1E293B]">
        {/* Drill-Down Top Bar */}
        <div className="bg-white border-b border-[#DCE1E7] px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDrillDown(null)}
              className="inline-flex items-center gap-1.5 h-[34px] px-3.5 rounded-[5px] border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[14px] font-medium text-[#1E293B] transition"
            >
              <ArrowLeft size={15} />
              Back
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[22px] font-bold text-[#0F172A] leading-tight">
                  {drillDown.compTitle}
                </h1>
                <span className="px-2.5 py-0.5 text-[12px] font-medium bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] rounded">
                  {drillDown.sourceModule || 'Calls'}
                </span>
              </div>
              <div className="text-[13px] text-[#64748B] flex items-center gap-3 mt-0.5">
                <span>
                  Dashboard: <span className="font-medium text-[#334155]">{activeDashboard.name}</span>
                </span>
                <span>•</span>
                <button
                  type="button"
                  onClick={(e) => handleNavigateToReport(drillDown, e)}
                  className="text-[#2563EB] hover:underline font-medium"
                >
                  Created from report - {drillDown.reportName || drillDown.compTitle}
                </button>
              </div>
            </div>
          </div>

          {/* Right side: Total Records, Pagination (100 per page), Export, Close */}
          <div className="flex items-center gap-3">
            <div className="text-[14px] font-medium text-[#334155] bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-1.5 rounded-[5px]">
              Total Records : <span className="font-semibold text-[#0F172A]">{formatNumber(drillDownRecords.length)}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-white border border-[#CBD5E1] rounded-[5px] px-3 h-[34px] text-[14px]">
              <span className="text-[#475569] font-medium">
                {drillDownRecords.length === 0
                  ? '0 - 0'
                  : `${drillPageStart + 1} - ${Math.min(
                      drillPageStart + DRILL_PAGE_SIZE,
                      drillDownRecords.length
                    )}`}
              </span>
              <span className="text-[#94A3B8]">of</span>
              <span className="font-semibold text-[#0F172A]">
                {drillDownRecords.length}
              </span>
              <div className="h-3.5 w-[1px] bg-[#E2E8F0] mx-1" />
              <button
                type="button"
                disabled={safeDrillPage <= 1}
                onClick={() => setDrillPage((p) => Math.max(1, p - 1))}
                title="Previous 100 records"
                className="p-1 rounded hover:bg-[#F1F5F9] disabled:opacity-35 disabled:pointer-events-none text-[#334155]"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                disabled={safeDrillPage >= drillTotalPages}
                onClick={() => setDrillPage((p) => Math.min(drillTotalPages, p + 1))}
                title="Next 100 records"
                className="p-1 rounded hover:bg-[#F1F5F9] disabled:opacity-35 disabled:pointer-events-none text-[#334155]"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <button
              type="button"
              onClick={() =>
                exportCSV(`${drillDown.compTitle.replace(/\s+/g, '_')}_DrillDown`, drillDownRecords, [
                  { label: 'Deal Name', value: (r) => r.dealName },
                  { label: 'Amount', value: (r) => r.amount },
                  { label: 'Subject', value: (r) => r.subject },
                  { label: 'Categories', value: (r) => r.categories },
                  { label: 'Remarks', value: (r) => r.remarks },
                  { label: 'Call Duration (In Seconds)', value: (r) => r.durationSeconds },
                  { label: 'Full Name', value: (r) => r.fullName },
                  { label: 'Call Owner', value: (r) => r.callOwner },
                  { label: 'Call Start Time', value: (r) => r.callStartTime },
                ])
              }
              className="inline-flex items-center gap-1.5 h-[34px] px-3.5 rounded-[5px] border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[14px] font-medium text-[#334155]"
            >
              <Download size={14} />
              Export
            </button>

            <button
              type="button"
              onClick={() => setDrillDown(null)}
              title="Close Drill-Down"
              className="inline-flex items-center justify-center w-[34px] h-[34px] rounded-[5px] border border-[#CBD5E1] bg-white hover:bg-[#FEE2E2] hover:border-[#FCA5A5] hover:text-[#DC2626] text-[#475569] transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Drilled-Down Filter Conditions Bar */}
        <div className="bg-[#F8FAFC] border-b border-[#DCE1E7] px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 text-[13.5px]">
            <span className="font-semibold text-[#475569] uppercase tracking-wider text-[12px]">
              Drilled-Down Filter Conditions :
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-white border border-[#CBD5E1] text-[#1E293B]">
              <span className="text-[#64748B]">Call Owner (Calls) :</span>
              <span className="font-semibold text-[#1D4ED8]">{ownerFilterSummary}</span>
              {drillDown.ownerId && (
                <button
                  type="button"
                  onClick={() =>
                    setDrillDown((prev) => ({
                      ...prev,
                      ownerId: null,
                      ownerName: 'All Selected Owners',
                    }))
                  }
                  title="Show all owners in this report"
                  className="ml-1 text-[#94A3B8] hover:text-[#DC2626]"
                >
                  <X size={13} />
                </button>
              )}
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-white border border-[#CBD5E1] text-[#1E293B]">
              <span className="text-[#64748B]">Call Start Time (Calls) :</span>
              <span className="font-medium">
                {describeDateFilter(appliedFilters.callStartTime)}
              </span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-white border border-[#CBD5E1] text-[#1E293B]">
              <span className="text-[#64748B]">Created Time (Calls) :</span>
              <span className="font-medium">
                {describeDateFilter(appliedFilters.createdTime)}
              </span>
            </span>
          </div>

          <div className="relative w-[270px]">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]"
            />
            <input
              type="text"
              value={drillSearch}
              onChange={(e) => {
                setDrillSearch(e.target.value);
                setDrillPage(1);
              }}
              placeholder="Search Deal, Subject, Full Name..."
              className="w-full h-[34px] pl-9 pr-7 bg-white border border-[#CBD5E1] rounded-[5px] text-[14px] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB]"
            />
            {drillSearch && (
              <button
                type="button"
                onClick={() => setDrillSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569]"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Drill-Down Records Table with Fixed Header and Fixed Total Row */}
        <div className="p-6 flex-1">
          <div className="bg-white border border-[#DCE1E7] rounded-[6px] shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="overflow-x-auto max-h-[calc(100vh-240px)] overflow-y-auto">
              <table className="w-full border-separate border-spacing-0 text-left">
                <thead className="sticky top-0 z-20 bg-[#F8FAFC]">
                  <tr className="bg-[#F8FAFC] text-[13.5px] font-semibold text-[#475569]">
                    <th className="py-3 px-3.5 bg-[#F8FAFC] border-b border-r border-[#DCE1E7] w-[52px] text-center">#</th>
                    <th
                      onClick={() => toggleDrillColumnSort('dealName')}
                      className="py-3 px-4 bg-[#F8FAFC] border-b border-r border-[#DCE1E7] cursor-pointer hover:bg-[#F1F5F9] whitespace-nowrap"
                    >
                      Deal Name
                    </th>
                    <th
                      onClick={() => toggleDrillColumnSort('amount')}
                      className="py-3 px-4 bg-[#F8FAFC] border-b border-r border-[#DCE1E7] text-right cursor-pointer hover:bg-[#F1F5F9] whitespace-nowrap"
                    >
                      Amount
                    </th>
                    <th
                      onClick={() => toggleDrillColumnSort('subject')}
                      className="py-3 px-4 bg-[#F8FAFC] border-b border-r border-[#DCE1E7] cursor-pointer hover:bg-[#F1F5F9] whitespace-nowrap"
                    >
                      Subject
                    </th>
                    <th
                      onClick={() => toggleDrillColumnSort('categories')}
                      className="py-3 px-4 bg-[#F8FAFC] border-b border-r border-[#DCE1E7] cursor-pointer hover:bg-[#F1F5F9] whitespace-nowrap"
                    >
                      Categories
                    </th>
                    <th className="py-3 px-4 bg-[#F8FAFC] border-b border-r border-[#DCE1E7] whitespace-nowrap">
                      Remarks
                    </th>
                    <th
                      onClick={() => toggleDrillColumnSort('durationSeconds')}
                      className="py-3 px-4 bg-[#F8FAFC] border-b border-r border-[#DCE1E7] text-right cursor-pointer hover:bg-[#F1F5F9] whitespace-nowrap"
                    >
                      Call Duration
                    </th>
                    <th
                      onClick={() => toggleDrillColumnSort('fullName')}
                      className="py-3 px-4 bg-[#F8FAFC] border-b border-r border-[#DCE1E7] cursor-pointer hover:bg-[#F1F5F9] whitespace-nowrap"
                    >
                      Full Name
                    </th>
                    <th
                      onClick={() => toggleDrillColumnSort('callOwner')}
                      className="py-3 px-4 bg-[#F8FAFC] border-b border-r border-[#DCE1E7] cursor-pointer hover:bg-[#F1F5F9] whitespace-nowrap"
                    >
                      Call Owner
                    </th>
                    <th
                      onClick={() => toggleDrillColumnSort('callStartTime')}
                      className="py-3 px-4 bg-[#F8FAFC] border-b border-[#DCE1E7] cursor-pointer hover:bg-[#F1F5F9] whitespace-nowrap"
                    >
                      Call Start Time
                    </th>
                  </tr>
                </thead>
                <tbody className="text-[14px] text-[#1E293B]">
                  {paginatedDrillRecords.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-[#64748B]">
                        No records match the current drill-down filter criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedDrillRecords.map((rec, i) => (
                      <tr
                        key={rec.id}
                        className="hover:bg-[#F5F8FF] transition-colors"
                      >
                        <td className="py-2.5 px-3.5 border-b border-r border-[#EEF2F6] text-center text-[#64748B] text-[13px]">
                          {drillPageStart + i + 1}
                        </td>
                        <td className="py-2.5 px-4 border-b border-r border-[#EEF2F6] whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleNavigateToDeal(rec.dealId)}
                            className="text-[#1F6FEB] hover:underline font-medium text-left"
                          >
                            {rec.dealName}
                          </button>
                        </td>
                        <td className="py-2.5 px-4 border-b border-r border-[#EEF2F6] text-right whitespace-nowrap font-medium text-[#0F172A]">
                          {formatCurrencyINR(rec.amount)}
                        </td>
                        <td className="py-2.5 px-4 border-b border-r border-[#EEF2F6] whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleNavigateToCall(rec.callId)}
                            className="text-[#1F6FEB] hover:underline font-medium text-left"
                          >
                            {rec.subject}
                          </button>
                        </td>
                        <td className="py-2.5 px-4 border-b border-r border-[#EEF2F6] whitespace-nowrap text-[#334155]">
                          {rec.categories}
                        </td>
                        <td
                          className="py-2.5 px-4 border-b border-r border-[#EEF2F6] max-w-[260px] truncate text-[#475569]"
                          title={rec.remarks}
                        >
                          {rec.remarks}
                        </td>
                        <td className="py-2.5 px-4 border-b border-r border-[#EEF2F6] text-right whitespace-nowrap font-mono text-[13.5px] text-[#0F172A]">
                          {formatNumber(rec.durationSeconds)}
                        </td>
                        <td className="py-2.5 px-4 border-b border-r border-[#EEF2F6] whitespace-nowrap text-[#1E293B]">
                          {rec.fullName}
                        </td>
                        <td className="py-2.5 px-4 border-b border-r border-[#EEF2F6] whitespace-nowrap text-[#334155]">
                          {rec.callOwner}
                        </td>
                        <td className="py-2.5 px-4 border-b border-[#EEF2F6] whitespace-nowrap text-[#475569] text-[13.5px]">
                          {formatDateTimeDisplay(rec.callStartTime)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {drillDownRecords.length > 0 && (
                  <tfoot className="sticky bottom-0 z-20 bg-[#F8FAFC] shadow-[0_-2px_6px_rgba(15,23,42,0.06)]">
                    <tr className="bg-[#F8FAFC] font-semibold text-[14px] text-[#0F172A]">
                      <td colSpan={2} className="py-3 px-4 bg-[#F8FAFC] border-t-2 border-[#CBD5E1] border-r border-[#EEF2F6]">
                        Total ({formatNumber(drillDownRecords.length)} Records)
                      </td>
                      <td className="py-3 px-4 bg-[#F8FAFC] border-t-2 border-[#CBD5E1] border-r border-[#EEF2F6] text-right">
                        {formatCurrencyINR(
                          drillDownRecords.reduce((s, r) => s + (Number(r.amount) || 0), 0)
                        )}
                      </td>
                      <td colSpan={3} className="py-3 px-4 bg-[#F8FAFC] border-t-2 border-[#CBD5E1] border-r border-[#EEF2F6]" />
                      <td className="py-3 px-4 bg-[#F8FAFC] border-t-2 border-[#CBD5E1] border-r border-[#EEF2F6] text-right font-mono">
                        {formatNumber(
                          drillDownRecords.reduce((s, r) => s + (Number(r.durationSeconds) || 0), 0)
                        )}
                      </td>
                      <td colSpan={3} className="py-3 px-4 bg-[#F8FAFC] border-t-2 border-[#CBD5E1]" />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // RENDER: MAIN ZOHO CRM DASHBOARD VIEW
  // ==========================================================================
  return (
    <div
      ref={containerRef}
      className={`${
        isFullScreen
          ? 'fixed inset-0 z-50 bg-[#F3F4F6] overflow-y-auto'
          : '-m-6 min-h-[calc(100vh-56px)] bg-[#F3F4F6]'
      } flex flex-col text-[#1E293B] select-none`}
    >
      {/* ====================================================================
          ROW 1: TOP TOOLBAR
      ==================================================================== */}
      <div className="bg-white border-b border-[#DCE1E7] px-6 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30">
        {/* Left Toolbar Group */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* 1. Dashboard Category Dropdown (All) */}
          <div className="relative" ref={categoryRef}>
            <button
              type="button"
              onClick={() => setCategoryMenuOpen((o) => !o)}
              className="inline-flex items-center gap-2 h-[36px] px-3.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#CBD5E1] rounded-[5px] text-[14px] font-medium text-[#334155] transition"
            >
              <span>{categoryFilter}</span>
              <ChevronDown size={14} className="text-[#64748B]" />
            </button>

            {categoryMenuOpen && (
              <div className="absolute left-0 top-[40px] z-50 w-[200px] bg-white border border-[#CBD5E1] rounded-[6px] shadow-[0_8px_24px_rgba(15,23,42,0.14)] py-1">
                {['All', 'Favorites', 'Public Dashboards', 'Created by Me', 'Shared with Me'].map(
                  (cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setCategoryFilter(cat);
                        setCategoryMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2 text-left text-[14px] ${
                        categoryFilter === cat
                          ? 'bg-[#EFF6FF] text-[#1D4ED8] font-medium'
                          : 'text-[#1E293B] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <span>{cat}</span>
                      {categoryFilter === cat && <Check size={14} className="text-[#1D4ED8]" />}
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          {/* 2. Searchable Dashboard Selector (Screenshot 4) */}
          <div className="relative" ref={selectorRef}>
            <button
              type="button"
              onClick={() => setSelectorOpen((o) => !o)}
              className="inline-flex items-center gap-2 h-[36px] px-3.5 bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] rounded-[5px] text-[15px] font-bold text-[#0F172A] transition"
            >
              <span className="truncate max-w-[260px]">{activeDashboard.name}</span>
              <ChevronDown size={15} className="text-[#64748B]" />
            </button>

            {selectorOpen && (
              <div className="absolute left-0 top-[40px] z-50 w-[330px] bg-white border border-[#CBD5E1] rounded-[6px] shadow-[0_8px_28px_rgba(15,23,42,0.16)] overflow-hidden">
                {/* Search Input */}
                <div className="p-2.5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  <div className="relative">
                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]"
                    />
                    <input
                      type="text"
                      value={selectorSearch}
                      onChange={(e) => setSelectorSearch(e.target.value)}
                      placeholder="Search Dashboard..."
                      autoFocus
                      className="w-full h-[34px] pl-9 pr-7 bg-white border border-[#CBD5E1] rounded-[4px] text-[14px] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB]"
                    />
                    {selectorSearch && (
                      <button
                        type="button"
                        onClick={() => setSelectorSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569]"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Dashboards List */}
                <div className="max-h-[260px] overflow-y-auto py-1 divide-y divide-[#F8FAFC]">
                  {selectorDashboards.length === 0 ? (
                    <div className="px-3.5 py-6 text-center text-[14px] text-[#64748B]">
                      No dashboards found
                    </div>
                  ) : (
                    selectorDashboards.map((d) => {
                      const isSelected = d.id === activeDashboard.id;
                      return (
                        <div
                          key={d.id}
                          onClick={() => handleSelectDashboard(d.id)}
                          className={`flex items-center justify-between px-3.5 py-2.5 cursor-pointer text-[14px] transition ${
                            isSelected
                              ? 'bg-[#EFF6FF] text-[#1D4ED8] font-semibold'
                              : 'text-[#1E293B] hover:bg-[#F8FAFC]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={(e) => handleToggleFavorite(d.id, e)}
                              title={d.favorite ? 'Remove from Favorites' : 'Add to Favorites'}
                              className="text-[#94A3B8] hover:text-[#F59E0B] shrink-0"
                            >
                              <Star
                                size={15}
                                className={
                                  d.favorite ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-[#94A3B8]'
                                }
                              />
                            </button>
                            <span className="truncate">{d.name}</span>
                          </div>
                          {isSelected && <Check size={15} className="text-[#1D4ED8] shrink-0" />}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer: Manage Dashboards (Navigates to full Manage Dashboards page - Screenshot 2 & 4) */}
                <div className="border-t border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={openManageDashboardsPage}
                    className="text-[14px] font-medium text-[#2563EB] hover:underline flex items-center gap-1.5"
                  >
                    <FolderKanban size={14} />
                    Manage Dashboards
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectorOpen(false);
                      openCreateDashboardModal();
                    }}
                    className="text-[13.5px] font-medium text-[#475569] hover:text-[#0F172A] flex items-center gap-1"
                  >
                    <Plus size={14} />
                    New
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. Favorite Star */}
          <button
            type="button"
            onClick={(e) => handleToggleFavorite(activeDashboard.id, e)}
            title={activeDashboard.favorite ? 'Favorited Dashboard' : 'Mark as Favorite'}
            className="inline-flex items-center justify-center w-[34px] h-[34px] rounded-[5px] hover:bg-[#F1F5F9] transition"
          >
            <Star
              size={16}
              className={
                activeDashboard.favorite
                  ? 'fill-[#F59E0B] text-[#F59E0B]'
                  : 'text-[#64748B] hover:text-[#F59E0B]'
              }
            />
          </button>

          {/* 4. Dashboard Information Icon */}
          <div className="relative" ref={infoRef}>
            <button
              type="button"
              onClick={() => setInfoOpen((o) => !o)}
              title="Dashboard Information"
              className="inline-flex items-center justify-center w-[34px] h-[34px] rounded-[5px] text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9] transition"
            >
              <Info size={16} />
            </button>

            {infoOpen && (
              <div className="absolute left-0 top-[38px] z-50 w-[310px] bg-white border border-[#CBD5E1] rounded-[6px] shadow-[0_8px_24px_rgba(15,23,42,0.14)] p-3.5 text-[13.5px] space-y-1.5">
                <div className="font-semibold text-[#0F172A] text-[15px]">
                  {activeDashboard.name}
                </div>
                <p className="text-[#475569] leading-relaxed">
                  {activeDashboard.description || 'Zoho CRM Call Analytics Dashboard.'}
                </p>
                <div className="pt-1.5 border-t border-[#F1F5F9] text-[12.5px] text-[#64748B] space-y-0.5">
                  <div>
                    Created by: <span className="text-[#1E293B] font-medium">{activeDashboard.createdBy || 'Sibi Chakaravarthi'}</span>
                  </div>
                  <div>
                    Shared with: <span className="text-[#1E293B] font-medium">{activeDashboard.shareWith || 'All Users'}</span>
                  </div>
                  <div>
                    Updated: <span className="text-[#1E293B]">{activeDashboard.updatedAt || 'Today'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="h-5 w-[1px] bg-[#E2E8F0] mx-0.5" />

          {/* 5. Sharing Indicator (All Users / Only Me / Custom) */}
          <button
            type="button"
            onClick={() => openEditDashboardModal(activeDashboard)}
            title="Dashboard Sharing Settings"
            className="inline-flex items-center gap-1.5 px-3 h-[34px] rounded-[5px] bg-[#F8FAFC] hover:bg-[#EFF6FF] border border-[#E2E8F0] text-[13.5px] font-medium text-[#475569] hover:text-[#1D4ED8] transition"
          >
            {activeDashboard.shareWith === 'Only Me' ? (
              <Lock size={13.5} className="text-[#64748B]" />
            ) : activeDashboard.shareWith === 'Custom' ? (
              <UserCheck size={13.5} className="text-[#2563EB]" />
            ) : (
              <Users size={13.5} className="text-[#64748B]" />
            )}
            <span>{activeDashboard.shareWith || 'All Users'}</span>
          </button>
        </div>

        {/* Right Toolbar Group */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* 6. Refresh Button */}
          <button
            type="button"
            onClick={handleRefreshAll}
            title="Refresh Dashboard"
            className="inline-flex items-center justify-center w-[36px] h-[36px] rounded-[5px] border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#475569] hover:text-[#0F172A] transition"
          >
            <RefreshCw size={15} className={isRefreshingAll ? 'animate-spin text-[#2563EB]' : ''} />
          </button>

          {/* 7. Dashboard Filter Button */}
          <button
            type="button"
            onClick={() => setFilterBarVisible((v) => !v)}
            title="Toggle Dashboard Filter Bar"
            className={`relative inline-flex items-center justify-center w-[36px] h-[36px] rounded-[5px] border transition ${
              filterBarVisible || hasActiveDashboardFilters
                ? 'border-[#93C5FD] bg-[#EFF6FF] text-[#1D4ED8]'
                : 'border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#475569]'
            }`}
          >
            <Filter size={15} />
            {hasActiveDashboardFilters && (
              <span className="w-2 h-2 rounded-full bg-[#2563EB] absolute top-1 right-1" />
            )}
          </button>

          {/* Setup / Customization Button (Screenshot 1) */}
          <button
            type="button"
            onClick={() => {
              setSetupModalTab('dropdowns');
              setSetupModalOpen(true);
            }}
            title="Zoho CRM Setup & Customization"
            className="inline-flex items-center gap-1.5 h-[36px] px-3.5 rounded-[5px] border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[14px] font-medium text-[#1E293B] transition"
          >
            <Settings size={14} className="text-[#475569]" />
            <span>Setup</span>
          </button>

          {/* 8. Add Component */}
          <button
            type="button"
            onClick={() => {
              setNewCompForm({
                reportKey: 'overall_all',
                title: 'Overall Call Count',
                fullWidth: false,
                ownerId: '',
              });
              setAddComponentModal(true);
            }}
            className="inline-flex items-center gap-1.5 h-[36px] px-3.5 rounded-[5px] border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[14px] font-medium text-[#1E293B] transition"
          >
            <Plus size={15} className="text-[#475569]" />
            <span>Add Component</span>
          </button>

          {/* 9. Create Dashboard */}
          <button
            type="button"
            onClick={openCreateDashboardModal}
            className="inline-flex items-center gap-1.5 h-[36px] px-4 rounded-[5px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[14px] font-medium transition shadow-xs"
          >
            <Plus size={15} />
            <span>Create Dashboard</span>
          </button>

          {isFullScreen && (
            <button
              type="button"
              onClick={() => setIsFullScreen(false)}
              className="inline-flex items-center gap-1.5 h-[36px] px-3 rounded-[5px] border border-[#CBD5E1] bg-white text-[14px] font-medium text-[#334155]"
            >
              <Minimize2 size={14} />
              Exit Full Screen
            </button>
          )}

          {/* 10. Three-Dot More Menu */}
          <div className="relative" ref={moreRef}>
            <button
              type="button"
              onClick={() => setMoreMenuOpen((o) => !o)}
              title="More Actions"
              className="inline-flex items-center justify-center w-[36px] h-[36px] rounded-[5px] border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#475569] hover:text-[#0F172A] transition"
            >
              <MoreHorizontal size={16} />
            </button>

            {moreMenuOpen && (
              <div className="absolute right-0 top-[40px] z-50 w-[240px] bg-white border border-[#CBD5E1] rounded-[6px] shadow-[0_8px_24px_rgba(15,23,42,0.15)] py-1 text-[14px]">
                <button
                  type="button"
                  onClick={() => {
                    setMoreMenuOpen(false);
                    openEditDashboardModal(activeDashboard);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-[#1E293B] hover:bg-[#F8FAFC]"
                >
                  <Pencil size={14} className="text-[#64748B]" />
                  <span>Edit Dashboard</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMoreMenuOpen(false);
                    setEditFiltersModal(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-[#1E293B] hover:bg-[#F8FAFC]"
                >
                  <SlidersHorizontal size={14} className="text-[#64748B]" />
                  <span>Edit Dashboard Filters</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMoreMenuOpen(false);
                    openManageDashboardsPage();
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-[#1E293B] hover:bg-[#F8FAFC]"
                >
                  <FolderKanban size={14} className="text-[#64748B]" />
                  <span>Manage Dashboards</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMoreMenuOpen(false);
                    openCloneDashboardModal(activeDashboard);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-[#1E293B] hover:bg-[#F8FAFC]"
                >
                  <Copy size={14} className="text-[#64748B]" />
                  <span>Clone</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMoreMenuOpen(false);
                    setReorderMode((r) => !r);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-[#1E293B] hover:bg-[#F8FAFC]"
                >
                  <LayoutGrid size={14} className="text-[#64748B]" />
                  <span>Reorder</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMoreMenuOpen(false);
                    setIsFullScreen((f) => !f);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-[#1E293B] hover:bg-[#F8FAFC]"
                >
                  <Maximize2 size={14} className="text-[#64748B]" />
                  <span>View in Full Screen</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMoreMenuOpen(false);
                    setSetupModalTab('columns');
                    setSetupModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-[#1E293B] hover:bg-[#F8FAFC]"
                >
                  <Settings size={14} className="text-[#64748B]" />
                  <span>CRM Setup & Customization</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMoreMenuOpen(false);
                    requestDeleteDashboard(activeDashboard);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-[#DC2626] hover:bg-[#FEF2F2]"
                >
                  <Trash2 size={14} className="text-[#DC2626]" />
                  <span>Delete</span>
                </button>
                <div className="my-1 border-t border-[#F1F5F9]" />
                <button
                  type="button"
                  onClick={() => {
                    setMoreMenuOpen(false);
                    setPresentationMode({ index: 0, playing: false });
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-[#1E293B] hover:bg-[#F8FAFC]"
                >
                  <Play size={14} className="text-[#64748B]" />
                  <span>Create as Presentation</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ====================================================================
          ROW 2: FILTERS BAR
      ==================================================================== */}
      {filterBarVisible && (
        <div className="bg-white border-b border-[#DCE1E7] px-6 py-3 flex flex-wrap items-center gap-3 z-20">
          {enabledFilters.callOwner !== false && (
            <CallOwnerFilterDropdown
              users={users}
              selectedIds={pendingFilters.callOwnerIds || []}
              onChange={(ids) =>
                setPendingFilters((prev) => ({ ...prev, callOwnerIds: ids }))
              }
            />
          )}

          {enabledFilters.callStartTime !== false && (
            <DateFilterDropdown
              label="Call Start Time (Calls)"
              value={pendingFilters.callStartTime}
              onChange={(val) =>
                setPendingFilters((prev) => ({ ...prev, callStartTime: val }))
              }
            />
          )}

          {enabledFilters.createdTime !== false && (
            <DateFilterDropdown
              label="Created Time (Calls)"
              value={pendingFilters.createdTime}
              onChange={(val) =>
                setPendingFilters((prev) => ({ ...prev, createdTime: val }))
              }
            />
          )}

          <div className="flex items-center gap-2.5 ml-1">
            <button
              type="button"
              onClick={handleApplyFilters}
              className="h-[34px] px-4 rounded-[5px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[14px] font-medium transition"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={handleApplyAndSaveFilters}
              className="h-[34px] px-4 rounded-[5px] border border-[#2563EB] bg-white hover:bg-[#EFF6FF] text-[#2563EB] text-[14px] font-medium transition"
            >
              Apply and Save
            </button>
            {hasActiveDashboardFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="h-[34px] px-3 text-[13.5px] font-medium text-[#64748B] hover:text-[#DC2626] transition"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>
      )}

      {/* Reorder Mode Banner */}
      {reorderMode && (
        <div className="bg-[#EFF6FF] border-b border-[#93C5FD] px-6 py-2.5 flex items-center justify-between text-[14px]">
          <div className="flex items-center gap-2 text-[#1E3A8A] font-medium">
            <GripVertical size={16} className="text-[#2563EB]" />
            <span>
              Reorder Mode Active — Use Move Up / Move Down or Width Toggle on any component to customize the layout.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setReorderMode(false);
              notify('Dashboard layout saved');
            }}
            className="px-3.5 py-1.5 rounded bg-[#2563EB] text-white text-[13.5px] font-medium hover:bg-[#1D4ED8]"
          >
            Save Layout
          </button>
        </div>
      )}

      {/* ====================================================================
          REPORT COMPONENTS TWO-COLUMN GRID
          - First component (Overall Call Count) spans full width (lg:col-span-2)
          - Fixed Header + Scrollable Data Rows + Fixed Total Row at Bottom (Screenshot 3)
          - Clickable "Created from report - <Report Name>" links (Screenshot 5 & 6)
      ==================================================================== */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 content-start">
        {(activeDashboard.components || []).map((comp, index) => {
          const summary = buildComponentSummary(comp);
          const sortCfg = compSortMap[comp.id] || { key: 'owner', dir: 'asc' };
          const isCompRefreshing = Boolean(refreshingCompIds[comp.id]);
          const hasCompFilter = Boolean(
            comp.compFilter?.ownerId ||
              comp.compFilter?.callType ||
              comp.compFilter?.callStatus ||
              comp.compFilter?.minDuration
          );

          const cat = REPORT_BY_KEY[comp.reportKey] || REPORT_CATALOG[0];
          const linkedReportName = comp.reportName || cat.reportName || comp.title;

          const spanFull = index === 0 || Boolean(comp.fullWidth);

          return (
            <div
              key={comp.id}
              className={`${
                spanFull ? 'lg:col-span-2' : 'lg:col-span-1'
              } bg-white border border-[#DCE1E7] rounded-[6px] shadow-[0_1px_3px_rgba(15,23,42,0.04)] flex flex-col`}
            >
              {/* Component Header */}
              <div className="px-5 py-3.5 border-b border-[#E2E8F0] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <h2
                    onClick={() => openDrillDownForComponent(comp, null)}
                    className="text-[16px] font-semibold text-[#0F172A] hover:text-[#1F6FEB] cursor-pointer truncate"
                    title="Click to open report drill-down"
                  >
                    {comp.title}
                  </h2>
                  {hasCompFilter && (
                    <span className="px-2 py-0.5 text-[11.5px] font-medium bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] rounded">
                      Filtered
                    </span>
                  )}
                </div>

                {/* Component Header Actions */}
                <div className="flex items-center gap-1.5 relative">
                  {reorderMode && (
                    <div className="flex items-center gap-1 mr-1 bg-[#F8FAFC] border border-[#CBD5E1] rounded px-1.5 py-0.5">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveComponent(comp.id, 'up')}
                        title="Move Up"
                        className="p-1 text-[#475569] hover:text-[#0F172A] disabled:opacity-30"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={index === activeDashboard.components.length - 1}
                        onClick={() => handleMoveComponent(comp.id, 'down')}
                        title="Move Down"
                        className="p-1 text-[#475569] hover:text-[#0F172A] disabled:opacity-30"
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleComponentWidth(comp.id)}
                        title="Toggle Full / Half Width"
                        className="px-2 text-[12px] font-medium text-[#2563EB] hover:underline"
                      >
                        {spanFull ? 'Half Width' : 'Full Width'}
                      </button>
                    </div>
                  )}

                  {/* Component Filter Icon */}
                  <button
                    type="button"
                    onClick={() =>
                      setOpenCompFilterId((cur) => (cur === comp.id ? null : comp.id))
                    }
                    title="Component Filter"
                    className={`w-[30px] h-[30px] rounded flex items-center justify-center transition ${
                      hasCompFilter || openCompFilterId === comp.id
                        ? 'bg-[#EFF6FF] text-[#2563EB]'
                        : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
                    }`}
                  >
                    <Filter size={14} />
                  </button>

                  {/* Component Refresh Icon */}
                  <button
                    type="button"
                    onClick={() => handleRefreshSingleComponent(comp.id, comp.title)}
                    title="Refresh Component"
                    className="w-[30px] h-[30px] rounded flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition"
                  >
                    <RefreshCw
                      size={14}
                      className={isCompRefreshing ? 'animate-spin text-[#2563EB]' : ''}
                    />
                  </button>

                  {/* Component More Actions */}
                  <button
                    type="button"
                    onClick={() =>
                      setOpenCompMenuId((cur) => (cur === comp.id ? null : comp.id))
                    }
                    title="More Actions"
                    className="w-[30px] h-[30px] rounded flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition"
                  >
                    <MoreHorizontal size={15} />
                  </button>

                  {/* Component-level Filter Popover */}
                  {openCompFilterId === comp.id && (
                    <div className="absolute right-0 top-[34px] z-40 w-[265px] bg-white border border-[#CBD5E1] rounded-[6px] shadow-[0_8px_24px_rgba(15,23,42,0.14)] p-3.5 text-[13.5px] space-y-3">
                      <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-1.5">
                        <span className="font-semibold text-[#0F172A]">Component Filter</span>
                        <button
                          type="button"
                          onClick={() => setOpenCompFilterId(null)}
                          className="text-[#94A3B8] hover:text-[#475569]"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <div>
                        <label className="block text-[12.5px] font-medium text-[#475569] mb-1">
                          Call Owner
                        </label>
                        <select
                          value={comp.compFilter?.ownerId || ''}
                          onChange={(e) =>
                            handleUpdateCompFilter(comp.id, { ownerId: e.target.value })
                          }
                          className="w-full h-[32px] px-2.5 border border-[#CBD5E1] rounded text-[13.5px] bg-white"
                        >
                          <option value="">All Owners</option>
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[12.5px] font-medium text-[#475569] mb-1">
                          Call Type
                        </label>
                        <select
                          value={comp.compFilter?.callType || ''}
                          onChange={(e) =>
                            handleUpdateCompFilter(comp.id, { callType: e.target.value })
                          }
                          className="w-full h-[32px] px-2.5 border border-[#CBD5E1] rounded text-[13.5px] bg-white"
                        >
                          <option value="">All Types</option>
                          <option value="Outbound">Outbound</option>
                          <option value="Inbound">Inbound</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[12.5px] font-medium text-[#475569] mb-1">
                          Min Call Duration (Seconds)
                        </label>
                        <input
                          type="number"
                          min={0}
                          placeholder="0"
                          value={comp.compFilter?.minDuration || ''}
                          onChange={(e) =>
                            handleUpdateCompFilter(comp.id, { minDuration: e.target.value })
                          }
                          className="w-full h-[32px] px-2.5 border border-[#CBD5E1] rounded text-[13.5px] bg-white"
                        />
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateCompFilter(comp.id, {
                              ownerId: '',
                              callType: '',
                              callStatus: '',
                              minDuration: '',
                            })
                          }
                          className="text-[13px] text-[#64748B] hover:text-[#DC2626]"
                        >
                          Reset
                        </button>
                        <button
                          type="button"
                          onClick={() => setOpenCompFilterId(null)}
                          className="px-3 py-1 bg-[#2563EB] text-white text-[13px] font-medium rounded hover:bg-[#1D4ED8]"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Component More Menu Dropdown (Includes "Created from report - <Report Name>" link as in Screenshot 6) */}
                  {openCompMenuId === comp.id && (
                    <div className="absolute right-0 top-[34px] z-40 w-[280px] bg-white border border-[#CBD5E1] rounded-[6px] shadow-[0_8px_24px_rgba(15,23,42,0.16)] py-1 text-[13.5px]">
                      <div className="px-3.5 py-2 bg-[#F8FAFC] border-b border-[#E2E8F0] text-[12.5px]">
                        <span className="text-[#64748B]">Created from report - </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            setOpenCompMenuId(null);
                            handleNavigateToReport(comp, e);
                          }}
                          className="text-[#2563EB] hover:underline font-semibold inline-flex items-center gap-1"
                        >
                          <span>{linkedReportName}</span>
                          <ExternalLink size={12} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          setOpenCompMenuId(null);
                          handleNavigateToReport(comp, e);
                        }}
                        className="w-full flex items-center gap-2 px-3.5 py-2 text-left text-[#1E293B] hover:bg-[#F8FAFC]"
                      >
                        <ExternalLink size={14} className="text-[#2563EB]" />
                        <span>View Report ({linkedReportName})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenCompMenuId(null);
                          openDrillDownForComponent(comp, null);
                        }}
                        className="w-full flex items-center gap-2 px-3.5 py-2 text-left text-[#1E293B] hover:bg-[#F8FAFC]"
                      >
                        <FolderKanban size={14} className="text-[#64748B]" />
                        <span>Drill Down Records</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenCompMenuId(null);
                          setEditComponentModal({ ...comp });
                        }}
                        className="w-full flex items-center gap-2 px-3.5 py-2 text-left text-[#1E293B] hover:bg-[#F8FAFC]"
                      >
                        <Pencil size={14} className="text-[#64748B]" />
                        <span>Edit Component</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenCompMenuId(null);
                          handleToggleComponentWidth(comp.id);
                        }}
                        className="w-full flex items-center gap-2 px-3.5 py-2 text-left text-[#1E293B] hover:bg-[#F8FAFC]"
                      >
                        <LayoutGrid size={14} className="text-[#64748B]" />
                        <span>{spanFull ? 'Make Half Width' : 'Span Full Width'}</span>
                      </button>
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => {
                          setOpenCompMenuId(null);
                          handleMoveComponent(comp.id, 'up');
                        }}
                        className="w-full flex items-center gap-2 px-3.5 py-2 text-left text-[#1E293B] hover:bg-[#F8FAFC] disabled:opacity-40"
                      >
                        <ArrowUp size={14} className="text-[#64748B]" />
                        <span>Move Up</span>
                      </button>
                      <button
                        type="button"
                        disabled={index === activeDashboard.components.length - 1}
                        onClick={() => {
                          setOpenCompMenuId(null);
                          handleMoveComponent(comp.id, 'down');
                        }}
                        className="w-full flex items-center gap-2 px-3.5 py-2 text-left text-[#1E293B] hover:bg-[#F8FAFC] disabled:opacity-40"
                      >
                        <ArrowDown size={14} className="text-[#64748B]" />
                        <span>Move Down</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenCompMenuId(null);
                          exportCSV(comp.title.replace(/\s+/g, '_'), summary.rows, [
                            { label: 'Call Owner', value: (r) => r.callOwner },
                            { label: 'Record Count', value: (r) => r.recordCount },
                            {
                              label: 'Sum of Call Duration (In Seconds)',
                              value: (r) => r.sumDurationSeconds,
                            },
                          ]);
                        }}
                        className="w-full flex items-center gap-2 px-3.5 py-2 text-left text-[#1E293B] hover:bg-[#F8FAFC]"
                      >
                        <Download size={14} className="text-[#64748B]" />
                        <span>Export CSV</span>
                      </button>
                      <div className="my-1 border-t border-[#F1F5F9]" />
                      <button
                        type="button"
                        onClick={() => {
                          setOpenCompMenuId(null);
                          setDeleteConfirm({
                            type: 'component',
                            id: comp.id,
                            name: comp.title,
                          });
                        }}
                        className="w-full flex items-center gap-2 px-3.5 py-2 text-left text-[#DC2626] hover:bg-[#FEF2F2]"
                      >
                        <Trash2 size={14} className="text-[#DC2626]" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* ============================================================
                  COMPONENT TABLE WITH FIXED HEADER & FIXED TOTAL ROW (Screenshot 3)
                  - Only data rows scroll vertically inside `max-h-[250px] overflow-y-auto`
                  - `thead` stays sticky at top-0
                  - `tfoot` stays sticky at bottom-0 so Total row NEVER scrolls away
                  - Synchronized horizontal scrolling & column alignment
              ============================================================ */}
              <div className="overflow-x-auto max-h-[250px] overflow-y-auto flex-1 relative">
                <table className="w-full border-separate border-spacing-0 text-left">
                  <colgroup>
                    <col className="w-[42%]" />
                    <col className="w-[26%]" />
                    <col className="w-[32%]" />
                  </colgroup>
                  <thead className="sticky top-0 z-20 bg-[#F8FAFC]">
                    <tr className="bg-[#F8FAFC] text-[13.5px] font-semibold text-[#475569]">
                      <th
                        onClick={() => toggleCompSort(comp.id, 'owner')}
                        className="py-2.5 px-5 bg-[#F8FAFC] border-b border-r border-[#DCE1E7] cursor-pointer hover:bg-[#F1F5F9] select-none"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Call Owner</span>
                          {sortCfg.key === 'owner' && (
                            <span className="text-[11px] text-[#2563EB]">
                              {sortCfg.dir === 'asc' ? '▲' : '▼'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => toggleCompSort(comp.id, 'count')}
                        className="py-2.5 px-5 bg-[#F8FAFC] border-b border-r border-[#DCE1E7] text-right cursor-pointer hover:bg-[#F1F5F9] select-none whitespace-nowrap"
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <span>Record Count</span>
                          {sortCfg.key === 'count' && (
                            <span className="text-[11px] text-[#2563EB]">
                              {sortCfg.dir === 'asc' ? '▲' : '▼'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => toggleCompSort(comp.id, 'duration')}
                        className="py-2.5 px-5 bg-[#F8FAFC] border-b border-[#DCE1E7] text-right cursor-pointer hover:bg-[#F1F5F9] select-none whitespace-nowrap"
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <span>Sum of Call Duration (In Seconds)</span>
                          {sortCfg.key === 'duration' && (
                            <span className="text-[11px] text-[#2563EB]">
                              {sortCfg.dir === 'asc' ? '▲' : '▼'}
                            </span>
                          )}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-[14px] text-[#1E293B]">
                    {summary.rows.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-[#64748B]">
                          No data available for the selected filter criteria.
                        </td>
                      </tr>
                    ) : (
                      summary.rows.map((row) => (
                        <tr
                          key={row.ownerId}
                          onClick={() => openDrillDownForComponent(comp, row)}
                          className="hover:bg-[#F5F8FF] cursor-pointer transition-colors"
                        >
                          <td className="py-2.5 px-5 border-b border-r border-[#EEF2F6] font-normal text-[#1E293B]">
                            {row.callOwner}
                          </td>
                          <td className="py-2.5 px-5 border-b border-r border-[#EEF2F6] text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDrillDownForComponent(comp, row);
                              }}
                              className="text-[#1F6FEB] hover:underline font-medium"
                            >
                              {formatNumber(row.recordCount)}
                            </button>
                          </td>
                          <td className="py-2.5 px-5 border-b border-[#EEF2F6] text-right font-mono text-[14px] text-[#1E293B]">
                            {formatNumber(row.sumDurationSeconds)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="sticky bottom-0 z-20 bg-[#F8FAFC] shadow-[0_-2px_6px_rgba(15,23,42,0.06)]">
                    <tr
                      onClick={() => openDrillDownForComponent(comp, null)}
                      className="bg-[#F8FAFC] font-semibold text-[14px] text-[#0F172A] cursor-pointer hover:bg-[#EFF6FF]"
                    >
                      <td className="py-2.5 px-5 bg-[#F8FAFC] border-t-2 border-[#CBD5E1] border-r border-[#EEF2F6]">
                        Total
                      </td>
                      <td className="py-2.5 px-5 bg-[#F8FAFC] border-t-2 border-[#CBD5E1] border-r border-[#EEF2F6] text-right text-[#1F6FEB] hover:underline">
                        {formatNumber(summary.totalCount)}
                      </td>
                      <td className="py-2.5 px-5 bg-[#F8FAFC] border-t-2 border-[#CBD5E1] text-right font-mono text-[14px]">
                        {formatNumber(summary.totalDurationSeconds)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Component Footer: Clickable "Created from report - <Report Name>" Link (Screenshots 5 & 6) */}
              <div className="px-5 py-2.5 bg-[#FAFBFC] border-t border-[#EEF2F6] flex items-center justify-between text-[13px] text-[#64748B]">
                <div className="flex items-center gap-1 min-w-0 truncate">
                  <span className="text-[#64748B]">Created from report -</span>
                  <button
                    type="button"
                    onClick={(e) => handleNavigateToReport(comp, e)}
                    className="text-[#2563EB] hover:underline font-medium truncate inline-flex items-center gap-1"
                    title={`Open ${linkedReportName} in Reports module`}
                  >
                    <span>{linkedReportName}</span>
                  </button>
                </div>
                <span className="shrink-0 ml-2 font-medium">{formatNumber(summary.totalCount)} records</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ====================================================================
          ZOHO CRM SETUP & CUSTOMIZATION MODAL (Screenshot 1)
      ==================================================================== */}
      <ZohoCustomizationModal
        open={setupModalOpen}
        onClose={() => setSetupModalOpen(false)}
        initialTab={setupModalTab}
        onNotify={(msg, type) => notify(msg, type)}
      />

      {/* ====================================================================
          MODAL 1: CREATE / EDIT / CLONE DASHBOARD ("Dashboard Details")
      ==================================================================== */}
      {dashboardModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-[#CBD5E1] rounded-[6px] shadow-[0_16px_40px_rgba(15,23,42,0.22)] w-full max-w-[500px] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#E2E8F0] flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-[#0F172A]">
                Dashboard Details
              </h3>
              <button
                type="button"
                onClick={() => setDashboardModal(null)}
                className="text-[#64748B] hover:text-[#0F172A]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveDashboardModal} className="p-5 space-y-4 text-[13px]">
              <div>
                <label className="block text-[12.5px] font-medium text-[#334155] mb-1">
                  Dashboard Name <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={dashboardModal.data.name}
                  onChange={(e) =>
                    setDashboardModal((prev) => ({
                      ...prev,
                      data: { ...prev.data, name: e.target.value },
                    }))
                  }
                  placeholder="Enter Dashboard Name"
                  className="w-full h-[34px] px-3 border border-l-[3px] border-[#CBD5E1] border-l-[#DC2626] rounded-[4px] text-[13px] text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-medium text-[#334155] mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={dashboardModal.data.description}
                  onChange={(e) =>
                    setDashboardModal((prev) => ({
                      ...prev,
                      data: { ...prev.data, description: e.target.value },
                    }))
                  }
                  placeholder="Add description for this dashboard"
                  className="w-full p-2.5 border border-[#CBD5E1] rounded-[4px] text-[13px] text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-medium text-[#334155] mb-2">
                  Share with
                </label>
                <div className="space-y-2">
                  {['Only Me', 'All Users', 'Custom'].map((opt) => (
                    <label
                      key={opt}
                      className="flex items-center gap-2.5 cursor-pointer text-[13px] text-[#1E293B]"
                    >
                      <input
                        type="radio"
                        name="shareWith"
                        checked={dashboardModal.data.shareWith === opt}
                        onChange={() =>
                          setDashboardModal((prev) => ({
                            ...prev,
                            data: { ...prev.data, shareWith: opt },
                          }))
                        }
                        className="accent-[#2563EB]"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>

                {dashboardModal.data.shareWith === 'Custom' && (
                  <div className="mt-3 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[4px] max-h-[150px] overflow-y-auto space-y-1.5">
                    <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">
                      Select Users to Share With
                    </div>
                    {users.map((u) => {
                      const selected = (dashboardModal.data.customSharedUsers || []).includes(
                        u.id
                      );
                      return (
                        <label
                          key={u.id}
                          className="flex items-center gap-2 text-[12.5px] text-[#1E293B] cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => {
                              const cur = dashboardModal.data.customSharedUsers || [];
                              const next = selected
                                ? cur.filter((id) => id !== u.id)
                                : [...cur, u.id];
                              setDashboardModal((prev) => ({
                                ...prev,
                                data: { ...prev.data, customSharedUsers: next },
                              }));
                            }}
                            className="accent-[#2563EB]"
                          />
                          <span>{u.name}</span>
                          <span className="text-[11px] text-[#64748B]">({u.email})</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDashboardModal(null)}
                  className="h-[34px] px-4 rounded-[4px] border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[13px] font-medium text-[#334155]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-[34px] px-5 rounded-[4px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13px] font-medium"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 2: ADD COMPONENT MODAL
      ==================================================================== */}
      {addComponentModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-[#CBD5E1] rounded-[6px] shadow-[0_16px_40px_rgba(15,23,42,0.22)] w-full max-w-[520px] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#E2E8F0] flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-[#0F172A]">
                Add Component
              </h3>
              <button
                type="button"
                onClick={() => setAddComponentModal(false)}
                className="text-[#64748B] hover:text-[#0F172A]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddComponent} className="p-5 space-y-4 text-[13px]">
              <div>
                <label className="block text-[12.5px] font-medium text-[#334155] mb-1">
                  Select Report
                </label>
                <select
                  value={newCompForm.reportKey}
                  onChange={(e) => {
                    const tpl = REPORT_CATALOG.find((r) => r.reportKey === e.target.value);
                    setNewCompForm((prev) => ({
                      ...prev,
                      reportKey: e.target.value,
                      title: tpl ? tpl.title : prev.title,
                    }));
                  }}
                  className="w-full h-[34px] px-3 border border-[#CBD5E1] rounded-[4px] text-[13px] text-[#0F172A] bg-white"
                >
                  {REPORT_CATALOG.map((rep) => (
                    <option key={rep.reportKey} value={rep.reportKey}>
                      {rep.reportName} ({rep.sourceModule})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11.5px] text-[#64748B]">
                  {
                    REPORT_CATALOG.find((r) => r.reportKey === newCompForm.reportKey)
                      ?.description
                  }
                </p>
              </div>

              <div>
                <label className="block text-[12.5px] font-medium text-[#334155] mb-1">
                  Component Title <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newCompForm.title}
                  onChange={(e) =>
                    setNewCompForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full h-[34px] px-3 border border-[#CBD5E1] rounded-[4px] text-[13px] text-[#0F172A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12.5px] font-medium text-[#334155] mb-1">
                    Default Call Owner Filter
                  </label>
                  <select
                    value={newCompForm.ownerId}
                    onChange={(e) =>
                      setNewCompForm((prev) => ({ ...prev, ownerId: e.target.value }))
                    }
                    className="w-full h-[34px] px-2.5 border border-[#CBD5E1] rounded-[4px] text-[12.5px] bg-white"
                  >
                    <option value="">All Users</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[12.5px] font-medium text-[#334155] mb-1">
                    Component Width
                  </label>
                  <select
                    value={newCompForm.fullWidth ? 'full' : 'half'}
                    onChange={(e) =>
                      setNewCompForm((prev) => ({
                        ...prev,
                        fullWidth: e.target.value === 'full',
                      }))
                    }
                    className="w-full h-[34px] px-2.5 border border-[#CBD5E1] rounded-[4px] text-[12.5px] bg-white"
                  >
                    <option value="half">Standard (1 Column in Grid)</option>
                    <option value="full">Full Width (Span 2 Columns)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setAddComponentModal(false)}
                  className="h-[34px] px-4 rounded-[4px] border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[13px] font-medium text-[#334155]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-[34px] px-5 rounded-[4px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13px] font-medium"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 3: EDIT COMPONENT MODAL
      ==================================================================== */}
      {editComponentModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-[#CBD5E1] rounded-[6px] shadow-[0_16px_40px_rgba(15,23,42,0.22)] w-full max-w-[480px] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#E2E8F0] flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-[#0F172A]">
                Edit Component
              </h3>
              <button
                type="button"
                onClick={() => setEditComponentModal(null)}
                className="text-[#64748B] hover:text-[#0F172A]"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveEditComponent} className="p-5 space-y-4 text-[13px]">
              <div>
                <label className="block text-[12.5px] font-medium text-[#334155] mb-1">
                  Component Title <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editComponentModal.title}
                  onChange={(e) =>
                    setEditComponentModal((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full h-[34px] px-3 border border-[#CBD5E1] rounded-[4px] text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[12.5px] font-medium text-[#334155] mb-1">
                  Source Report Dataset
                </label>
                <select
                  value={editComponentModal.reportKey}
                  onChange={(e) =>
                    setEditComponentModal((prev) => ({ ...prev, reportKey: e.target.value }))
                  }
                  className="w-full h-[34px] px-3 border border-[#CBD5E1] rounded-[4px] text-[13px] bg-white"
                >
                  {REPORT_CATALOG.map((rep) => (
                    <option key={rep.reportKey} value={rep.reportKey}>
                      {rep.reportName}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-[13px] text-[#1E293B] cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(editComponentModal.fullWidth)}
                  onChange={(e) =>
                    setEditComponentModal((prev) => ({
                      ...prev,
                      fullWidth: e.target.checked,
                    }))
                  }
                  className="accent-[#2563EB]"
                />
                <span>Span Full Width (2 Columns)</span>
              </label>

              <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditComponentModal(null)}
                  className="h-[34px] px-4 rounded-[4px] border border-[#CBD5E1] bg-white text-[13px] font-medium text-[#334155]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-[34px] px-5 rounded-[4px] bg-[#2563EB] text-white text-[13px] font-medium"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 4: EDIT DASHBOARD FILTERS MODAL
      ==================================================================== */}
      {editFiltersModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-[#CBD5E1] rounded-[6px] shadow-[0_16px_40px_rgba(15,23,42,0.22)] w-full max-w-[440px] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#E2E8F0] flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-[#0F172A]">
                Edit Dashboard Filters
              </h3>
              <button
                type="button"
                onClick={() => setEditFiltersModal(false)}
                className="text-[#64748B] hover:text-[#0F172A]"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-3 text-[13px]">
              <p className="text-[12px] text-[#64748B]">
                Configure which filter criteria are displayed on the filter bar for{' '}
                <span className="font-semibold text-[#0F172A]">{activeDashboard.name}</span>.
              </p>
              {[
                { key: 'callOwner', label: 'Call Owner (Calls)' },
                { key: 'callStartTime', label: 'Call Start Time (Calls)' },
                { key: 'createdTime', label: 'Created Time (Calls)' },
              ].map((item) => {
                const checked = enabledFilters[item.key] !== false;
                return (
                  <label
                    key={item.key}
                    className="flex items-center justify-between p-2.5 border border-[#E2E8F0] rounded-[4px] cursor-pointer hover:bg-[#F8FAFC]"
                  >
                    <span className="font-medium text-[#1E293B]">{item.label}</span>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setDashboards((prev) =>
                          prev.map((d) =>
                            d.id === activeDashboard.id
                              ? {
                                  ...d,
                                  enabledFilters: {
                                    ...(d.enabledFilters || {
                                      callOwner: true,
                                      callStartTime: true,
                                      createdTime: true,
                                    }),
                                    [item.key]: val,
                                  },
                                }
                              : d
                          )
                        );
                      }}
                      className="accent-[#2563EB] w-4 h-4"
                    />
                  </label>
                );
              })}

              <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditFiltersModal(false);
                    notify('Dashboard filter configuration saved');
                  }}
                  className="h-[34px] px-5 rounded-[4px] bg-[#2563EB] text-white text-[13px] font-medium hover:bg-[#1D4ED8]"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 5: DELETE CONFIRMATION DIALOG
      ==================================================================== */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-[#CBD5E1] rounded-[6px] shadow-[0_16px_40px_rgba(15,23,42,0.22)] w-full max-w-[420px] p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center shrink-0">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-[#0F172A]">
                  Delete {deleteConfirm.type === 'dashboard' ? 'Dashboard' : 'Component'}
                </h3>
                <p className="mt-1 text-[12.5px] text-[#475569] leading-relaxed">
                  Are you sure you want to delete{' '}
                  <span className="font-semibold text-[#0F172A]">
                    &ldquo;{deleteConfirm.name}&rdquo;
                  </span>
                  ?{' '}
                  {deleteConfirm.type === 'dashboard'
                    ? 'You can restore it later from Manage Dashboards → Recently Deleted.'
                    : 'This action will remove the component from this dashboard.'}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="h-[34px] px-4 rounded-[4px] border border-[#CBD5E1] bg-white text-[13px] font-medium text-[#334155]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteAction}
                className="h-[34px] px-4 rounded-[4px] bg-[#DC2626] hover:bg-[#B91C1C] text-white text-[13px] font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 6: CREATE AS PRESENTATION PLAYER
      ==================================================================== */}
      {presentationMode && (
        <div className="fixed inset-0 z-50 bg-[#0F172A] text-white flex flex-col">
          {(() => {
            const comps = activeDashboard.components || [];
            const activeComp = comps[presentationMode.index] || comps[0];
            const summary = activeComp ? buildComponentSummary(activeComp) : null;

            return (
              <>
                <div className="px-6 py-3.5 bg-[#1E293B] border-b border-[#334155] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-0.5 rounded bg-[#2563EB] text-[11px] font-semibold uppercase tracking-wider">
                      Presentation
                    </span>
                    <span className="text-[15px] font-semibold">{activeDashboard.name}</span>
                    <span className="text-[12.5px] text-[#94A3B8]">
                      Slide {presentationMode.index + 1} of {comps.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        setPresentationMode((p) => ({
                          ...p,
                          index: (p.index - 1 + comps.length) % comps.length,
                        }))
                      }
                      className="h-[32px] px-3 rounded bg-[#334155] hover:bg-[#475569] text-[12.5px] flex items-center gap-1"
                    >
                      <ChevronLeft size={14} /> Previous
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPresentationMode((p) => ({ ...p, playing: !p.playing }))
                      }
                      className="h-[32px] px-3 rounded bg-[#2563EB] hover:bg-[#1D4ED8] text-[12.5px] font-medium flex items-center gap-1.5"
                    >
                      {presentationMode.playing ? <Pause size={13} /> : <Play size={13} />}
                      {presentationMode.playing ? 'Pause' : 'Auto-Play'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPresentationMode((p) => ({
                          ...p,
                          index: (p.index + 1) % comps.length,
                        }))
                      }
                      className="h-[32px] px-3 rounded bg-[#334155] hover:bg-[#475569] text-[12.5px] flex items-center gap-1"
                    >
                      Next <ChevronRight size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresentationMode(null)}
                      className="h-[32px] px-3 rounded bg-[#DC2626] hover:bg-[#B91C1C] text-[12.5px] font-medium flex items-center gap-1"
                    >
                      <X size={14} /> Exit
                    </button>
                  </div>
                </div>

                <div className="flex-1 p-8 overflow-y-auto flex items-start justify-center">
                  {activeComp && summary && (
                    <div className="w-full max-w-[960px] bg-white text-[#1E293B] rounded-[6px] shadow-2xl overflow-hidden border border-[#CBD5E1]">
                      <div className="px-5 py-3.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
                        <h2 className="text-[16px] font-semibold text-[#0F172A]">
                          {activeComp.title}
                        </h2>
                        <span className="text-[12.5px] text-[#64748B]">
                          Created from report - {activeComp.reportName || activeComp.title}
                        </span>
                      </div>
                      <div className="max-h-[420px] overflow-y-auto">
                        <table className="w-full border-separate border-spacing-0 text-left">
                          <thead className="sticky top-0 z-20 bg-[#F8FAFC]">
                            <tr className="bg-[#F8FAFC] text-[12.5px] font-semibold text-[#475569]">
                              <th className="py-2.5 px-5 bg-[#F8FAFC] border-b border-r border-[#DCE1E7]">Call Owner</th>
                              <th className="py-2.5 px-5 bg-[#F8FAFC] border-b border-r border-[#DCE1E7] text-right">
                                Record Count
                              </th>
                              <th className="py-2.5 px-5 bg-[#F8FAFC] border-b border-[#DCE1E7] text-right">
                                Sum of Call Duration (In Seconds)
                              </th>
                            </tr>
                          </thead>
                          <tbody className="text-[13px]">
                            {summary.rows.map((r) => (
                              <tr key={r.ownerId} className="hover:bg-[#F5F8FF]">
                                <td className="py-2.5 px-5 border-b border-r border-[#EEF2F6]">
                                  {r.callOwner}
                                </td>
                                <td className="py-2.5 px-5 border-b border-r border-[#EEF2F6] text-right font-medium text-[#1F6FEB]">
                                  {formatNumber(r.recordCount)}
                                </td>
                                <td className="py-2.5 px-5 border-b border-[#EEF2F6] text-right font-mono">
                                  {formatNumber(r.sumDurationSeconds)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="sticky bottom-0 z-20 bg-[#F8FAFC]">
                            <tr className="bg-[#F8FAFC] font-semibold text-[13px]">
                              <td className="py-2.5 px-5 bg-[#F8FAFC] border-t-2 border-[#CBD5E1] border-r border-[#EEF2F6]">
                                Total
                              </td>
                              <td className="py-2.5 px-5 bg-[#F8FAFC] border-t-2 border-[#CBD5E1] border-r border-[#EEF2F6] text-right text-[#1F6FEB]">
                                {formatNumber(summary.totalCount)}
                              </td>
                              <td className="py-2.5 px-5 bg-[#F8FAFC] border-t-2 border-[#CBD5E1] text-right font-mono">
                                {formatNumber(summary.totalDurationSeconds)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
