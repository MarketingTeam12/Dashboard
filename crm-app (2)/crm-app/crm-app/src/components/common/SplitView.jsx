import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  List,
  Lock,
  MinusCircle,
  Pencil,
  PieChart,
  Plus,
  PlusCircle,
  SlidersHorizontal,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { GridStatusPill } from './Views';
import { UserAvatar } from './Avatar';
import { useToast } from './Toast';
import { fmtDate, fmtINR } from '../../utils/calculations';

export const SPLIT_OPERATORS = [
  { value: 'is', label: 'is' },
  { value: 'is not', label: 'is not' },
  { value: 'contains', label: 'contains' },
  { value: 'does not contain', label: 'does not contain' },
  { value: 'starts with', label: 'starts with' },
  { value: 'greater than', label: 'greater than' },
  { value: 'greater or equal', label: 'greater or equal' },
  { value: 'less than', label: 'less than' },
  { value: 'less or equal', label: 'less or equal' },
  { value: 'is empty', label: 'is empty' },
  { value: 'is not empty', label: 'is not empty' },
];

export const DEFAULT_CONTACT_SPLIT_VIEWS = [
  {
    id: 'csplit-source',
    name: 'Split by Source',
    mode: 'criteria',
    picklistField: 'leadSource',
    shareWith: 'everyone',
    sharedUsers: [],
    createdBy: 'u1',
    splits: [
      {
        id: 'cs-1',
        name: 'Cold Call',
        join: 'OR',
        criteria: [
          { id: 'c1', field: 'leadSource', operator: 'is', value: 'Cold Call, Advertisement' },
        ],
        columns: ['firstName', 'lastName', 'leadSource', 'phone', 'email'],
      },
      {
        id: 'cs-2',
        name: 'Website & Inbound',
        join: 'OR',
        criteria: [
          { id: 'c2', field: 'leadSource', operator: 'is', value: 'Website, Partner Referral, Organic Search' },
        ],
        columns: ['firstName', 'lastName', 'account', 'leadSource', 'phone', 'email'],
      },
      {
        id: 'cs-3',
        name: 'Events, Social & Webinars',
        join: 'OR',
        criteria: [
          { id: 'c3', field: 'leadSource', operator: 'is', value: 'Trade Show, Webinar, LinkedIn, Referral, Employee Referral' },
        ],
        columns: ['firstName', 'lastName', 'account', 'leadSource', 'lifecycle', 'email'],
      },
    ],
  },
  {
    id: 'csplit-lifecycle',
    name: 'By Lifecycle Stage',
    mode: 'picklist',
    picklistField: 'lifecycle',
    shareWith: 'everyone',
    sharedUsers: [],
    createdBy: 'u1',
    splits: [
      {
        id: 'cs-lc-1',
        name: 'Qualified & Customer',
        join: 'OR',
        criteria: [{ id: 'c1', field: 'lifecycle', operator: 'is', value: 'Qualified, Customer' }],
        columns: ['firstName', 'lastName', 'account', 'lifecycle', 'leadSource', 'email', 'owner'],
      },
      {
        id: 'cs-lc-2',
        name: 'Active Engagement (Contacted / Engaged)',
        join: 'OR',
        criteria: [{ id: 'c2', field: 'lifecycle', operator: 'is', value: 'Contacted, Engaged' }],
        columns: ['firstName', 'lastName', 'account', 'lifecycle', 'phone', 'email', 'owner'],
      },
      {
        id: 'cs-lc-3',
        name: 'New Contacts',
        join: 'OR',
        criteria: [{ id: 'c3', field: 'lifecycle', operator: 'is', value: 'New' }],
        columns: ['firstName', 'lastName', 'account', 'lifecycle', 'leadSource', 'email'],
      },
    ],
  },
  {
    id: 'csplit-owner',
    name: 'By Contact Owner',
    mode: 'picklist',
    picklistField: 'ownerId',
    shareWith: 'everyone',
    sharedUsers: [],
    createdBy: 'u1',
    splits: [
      {
        id: 'cs-ow-1',
        name: 'Aarav Patel & Priya Nair',
        join: 'OR',
        criteria: [{ id: 'c1', field: 'ownerId', operator: 'is', value: 'u1, u2' }],
        columns: ['firstName', 'lastName', 'account', 'lifecycle', 'email', 'owner'],
      },
      {
        id: 'cs-ow-2',
        name: 'Rohan Sharma & Ananya Iyer',
        join: 'OR',
        criteria: [{ id: 'c2', field: 'ownerId', operator: 'is', value: 'u3, u4' }],
        columns: ['firstName', 'lastName', 'account', 'lifecycle', 'email', 'owner'],
      },
      {
        id: 'cs-ow-3',
        name: 'Vikram Singh & Meera Krishnan',
        join: 'OR',
        criteria: [{ id: 'c3', field: 'ownerId', operator: 'is', value: 'u5, u6' }],
        columns: ['firstName', 'lastName', 'account', 'lifecycle', 'email', 'owner'],
      },
    ],
  },
];

export const DEFAULT_ACCOUNT_SPLIT_VIEWS = [
  {
    id: 'asplit-revenue',
    name: 'By Revenue',
    mode: 'criteria',
    picklistField: 'type',
    shareWith: 'everyone',
    sharedUsers: [],
    createdBy: 'u1',
    splits: [
      {
        id: 'as-rev-1',
        name: 'High Revenue',
        join: 'AND',
        criteria: [
          { id: 'ac1', field: 'annualRevenue', operator: 'greater or equal', value: '20000000' },
        ],
        columns: ['name', 'type', 'industry', 'annualRevenue', 'rating', 'owner'],
      },
      {
        id: 'as-rev-2',
        name: 'Mid-Market Revenue',
        join: 'AND',
        criteria: [
          { id: 'ac2', field: 'annualRevenue', operator: 'greater or equal', value: '5000000' },
          { id: 'ac3', field: 'annualRevenue', operator: 'less than', value: '20000000' },
        ],
        columns: ['name', 'type', 'industry', 'annualRevenue', 'rating', 'owner'],
      },
      {
        id: 'as-rev-3',
        name: 'Emerging & Growth Revenue',
        join: 'AND',
        criteria: [
          { id: 'ac4', field: 'annualRevenue', operator: 'less than', value: '5000000' },
        ],
        columns: ['name', 'type', 'industry', 'annualRevenue', 'mobile', 'owner'],
      },
    ],
  },
  {
    id: 'asplit-type',
    name: 'By Account Type',
    mode: 'picklist',
    picklistField: 'type',
    shareWith: 'everyone',
    sharedUsers: [],
    createdBy: 'u1',
    splits: [
      {
        id: 'as-ty-1',
        name: 'Customer Accounts',
        join: 'OR',
        criteria: [{ id: 'ac1', field: 'type', operator: 'is', value: 'Customer' }],
        columns: ['name', 'type', 'industry', 'annualRevenue', 'rating', 'owner'],
      },
      {
        id: 'as-ty-2',
        name: 'Prospect Accounts',
        join: 'OR',
        criteria: [{ id: 'ac2', field: 'type', operator: 'is', value: 'Prospect' }],
        columns: ['name', 'type', 'industry', 'annualRevenue', 'rating', 'owner'],
      },
      {
        id: 'as-ty-3',
        name: 'Partner, Vendor & Reseller',
        join: 'OR',
        criteria: [{ id: 'ac3', field: 'type', operator: 'is', value: 'Partner, Vendor, Reseller, Integrator, Competitor' }],
        columns: ['name', 'type', 'industry', 'annualRevenue', 'mobile', 'owner'],
      },
    ],
  },
  {
    id: 'asplit-status',
    name: 'By Account Status & Rating',
    mode: 'criteria',
    picklistField: 'rating',
    shareWith: 'everyone',
    sharedUsers: [],
    createdBy: 'u1',
    splits: [
      {
        id: 'as-st-1',
        name: 'Hot Enterprise Accounts',
        join: 'AND',
        criteria: [{ id: 'ac1', field: 'rating', operator: 'is', value: 'Hot' }],
        columns: ['name', 'rating', 'type', 'industry', 'annualRevenue', 'owner'],
      },
      {
        id: 'as-st-2',
        name: 'Warm & Active Accounts',
        join: 'OR',
        criteria: [{ id: 'ac2', field: 'rating', operator: 'is', value: 'Warm, Active, Acquired' }],
        columns: ['name', 'rating', 'type', 'industry', 'annualRevenue', 'owner'],
      },
      {
        id: 'as-st-3',
        name: 'Cold / Nurture Accounts',
        join: 'OR',
        criteria: [{ id: 'ac3', field: 'rating', operator: 'is', value: 'Cold' }],
        columns: ['name', 'rating', 'type', 'industry', 'annualRevenue', 'owner'],
      },
    ],
  },
];

/**
 * Evaluate whether a single record matches a criterion rule.
 */
export function evaluateSplitCriterion(record, criterion, context = {}) {
  const { field, operator = 'is', value = '' } = criterion || {};
  if (!field) return true;

  const { accountName, userName } = context;

  let rawVal = record[field];
  if (field === 'firstName' && !rawVal && record.name) {
    rawVal = String(record.name).trim().split(/\s+/)[0] || '';
  }
  if (field === 'lastName' && !rawVal && record.name) {
    const parts = String(record.name).trim().split(/\s+/);
    rawVal = parts.slice(1).join(' ') || parts[0] || '';
  }
  if (field === 'account') {
    rawVal = accountName ? accountName(record.accountId) : record.accountName || '';
  }
  if (field === 'owner' || field === 'ownerId') {
    const nameStr = userName ? userName(record.ownerId) : '';
    const idStr = record.ownerId || '';
    rawVal = `${idStr} ${nameStr}`.trim();
  }
  if (field === 'mailingCity' || field === 'city') {
    rawVal = record.mailingCity || record.city || '';
  }
  if (field === 'billingCity') {
    rawVal = record.billingCity || record.location || '';
  }
  if (field === 'gstState') {
    rawVal = record.gstState || record.billingState || '';
  }

  const strVal = rawVal == null ? '' : String(rawVal).trim();
  const strValLower = strVal.toLowerCase();
  const targetStr = String(value ?? '').trim();
  const targetLower = targetStr.toLowerCase();

  if (operator === 'is empty') return strVal === '';
  if (operator === 'is not empty') return strVal !== '';
  if (!targetStr) return true;

  // Numeric comparisons for revenue / employees
  if (['greater than', 'greater or equal', 'less than', 'less or equal'].includes(operator)) {
    const numRec = Number(String(rawVal ?? 0).replace(/[^0-9.-]/g, ''));
    const numTarget = Number(targetStr.replace(/[^0-9.-]/g, ''));
    if (isNaN(numRec) || isNaN(numTarget)) return false;
    if (operator === 'greater than') return numRec > numTarget;
    if (operator === 'greater or equal') return numRec >= numTarget;
    if (operator === 'less than') return numRec < numTarget;
    if (operator === 'less or equal') return numRec <= numTarget;
  }

  // Multi-value support (comma-separated values like "Cold Call, Website")
  const tokens = targetStr
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  if (operator === 'is') {
    if (field === 'owner' || field === 'ownerId') {
      const ownerIdLower = String(record.ownerId || '').toLowerCase();
      const ownerNameLower = String(userName ? userName(record.ownerId) : '').toLowerCase();
      return tokens.some((tok) => tok === ownerIdLower || tok === ownerNameLower || ownerNameLower.includes(tok));
    }
    return tokens.some((tok) => strValLower === tok);
  }
  if (operator === 'is not') {
    if (field === 'owner' || field === 'ownerId') {
      const ownerIdLower = String(record.ownerId || '').toLowerCase();
      const ownerNameLower = String(userName ? userName(record.ownerId) : '').toLowerCase();
      return tokens.every((tok) => tok !== ownerIdLower && tok !== ownerNameLower);
    }
    return tokens.every((tok) => strValLower !== tok);
  }
  if (operator === 'contains') {
    return tokens.some((tok) => strValLower.includes(tok));
  }
  if (operator === 'does not contain') {
    return tokens.every((tok) => !strValLower.includes(tok));
  }
  if (operator === 'starts with') {
    return tokens.some((tok) => strValLower.startsWith(tok));
  }

  return strValLower === targetLower;
}

/**
 * Evaluate whether a record belongs to a split definition.
 */
export function evaluateSplitMatch(record, split, context = {}) {
  const criteria = split?.criteria || [];
  if (!criteria.length) return true;
  const join = (split.join || 'AND').toUpperCase();
  if (join === 'OR') {
    return criteria.some((c) => evaluateSplitCriterion(record, c, context));
  }
  return criteria.every((c) => evaluateSplitCriterion(record, c, context));
}

export default function SplitView({
  moduleType = 'contacts', // 'contacts' | 'accounts'
  rows = [], // filtered & sorted records from parent page
  table,
  users = [],
  activeUser,
  splitViews = [],
  onSaveSplitView,
  onDeleteSplitView,
  onOpenDetail,
  accountName,
  userName,
  fieldCatalog = [],
  columnCatalog = [],
  defaultColumns = [],
}) {
  const toast = useToast();

  // Filter views visible to active user based on Share with setting
  const visibleSplitViews = useMemo(() => {
    const list = splitViews?.length
      ? splitViews
      : moduleType === 'contacts'
      ? DEFAULT_CONTACT_SPLIT_VIEWS
      : DEFAULT_ACCOUNT_SPLIT_VIEWS;
    return list.filter((v) => {
      if (!v.shareWith || v.shareWith === 'everyone') return true;
      if (v.shareWith === 'only_me') return !activeUser || !v.createdBy || v.createdBy === activeUser.id;
      if (v.shareWith === 'selected_users') {
        if (!activeUser) return true;
        return v.createdBy === activeUser.id || (v.sharedUsers || []).includes(activeUser.id);
      }
      return true;
    });
  }, [splitViews, moduleType, activeUser]);

  const [activeViewId, setActiveViewId] = useState(() => visibleSplitViews[0]?.id || '');
  const [recordsPerSplit, setRecordsPerSplit] = useState(20);
  const [selectorOpen, setSelectorOpen] = useState(false);

  // Per-split collapsed state, pagination page, sub-mode ('table' | 'chart'), and custom hidden columns
  const [collapsedSplits, setCollapsedSplits] = useState({});
  const [splitPages, setSplitPages] = useState({});
  const [splitSubMode, setSplitSubMode] = useState({}); // { [splitId]: 'table' | 'chart' }
  const [splitColOpen, setSplitColOpen] = useState(null); // splitId for inline column toggle menu

  // Create / Edit Split View Modal state
  const [modalState, setModalState] = useState(null); // null | { mode: 'create' | 'edit', viewData }

  // Keep activeViewId valid when views list changes
  useEffect(() => {
    if (!visibleSplitViews.some((v) => v.id === activeViewId)) {
      setActiveViewId(visibleSplitViews[0]?.id || '');
    }
  }, [visibleSplitViews, activeViewId]);

  const activeSplitView = useMemo(
    () => visibleSplitViews.find((v) => v.id === activeViewId) || visibleSplitViews[0] || null,
    [visibleSplitViews, activeViewId]
  );

  const evalContext = useMemo(() => ({ accountName, userName }), [accountName, userName]);

  // Open Create Split View modal matching Screenshot 2
  const openCreateModal = () => {
    const firstField = fieldCatalog[0] || { key: 'leadSource', label: 'Lead Source', options: ['Cold Call', 'Website'] };
    const defaultVal = firstField.options?.[0] || '';
    const initialCols = defaultColumns.length ? defaultColumns : columnCatalog.slice(0, 5).map((c) => c.key);
    setModalState({
      mode: 'create',
      view: {
        id: '',
        name: '',
        mode: 'criteria', // 'picklist' | 'criteria'
        picklistField: firstField.key,
        shareWith: 'only_me', // 'only_me' | 'everyone' | 'selected_users'
        sharedUsers: [activeUser?.id || 'u1'],
        createdBy: activeUser?.id || 'u1',
        splits: [],
      },
      draftSplit: {
        id: `sp-${Date.now().toString(36)}`,
        name: defaultVal || 'New Split',
        join: 'AND',
        criteria: [
          {
            id: `cr-${Date.now().toString(36)}-1`,
            field: firstField.key,
            operator: 'is',
            value: defaultVal,
          },
        ],
        columns: [...initialCols],
      },
      editingSplitIndex: null, // null means creating a new split in the Create Split box
      showDraftBox: true,
    });
    setSelectorOpen(false);
  };

  // Open Edit Split View modal for current activeSplitView
  const openEditModal = (viewToEdit = activeSplitView) => {
    if (!viewToEdit) return;
    const clonedSplits = (viewToEdit.splits || []).map((s) => ({
      ...s,
      criteria: (s.criteria || []).map((c) => ({ ...c })),
      columns: [...(s.columns || defaultColumns)],
    }));
    const firstSplit = clonedSplits[0];
    setModalState({
      mode: 'edit',
      view: {
        ...viewToEdit,
        shareWith: viewToEdit.shareWith || 'only_me',
        sharedUsers: [...(viewToEdit.sharedUsers || [])],
        splits: clonedSplits,
      },
      draftSplit: firstSplit
        ? {
            ...firstSplit,
            criteria: firstSplit.criteria.map((c) => ({ ...c })),
            columns: [...firstSplit.columns],
          }
        : {
            id: `sp-${Date.now().toString(36)}`,
            name: '',
            join: 'AND',
            criteria: [
              {
                id: `cr-${Date.now().toString(36)}-1`,
                field: fieldCatalog[0]?.key || 'name',
                operator: 'is',
                value: '',
              },
            ],
            columns: [...defaultColumns],
          },
      editingSplitIndex: firstSplit ? 0 : null,
      showDraftBox: true,
    });
    setSelectorOpen(false);
  };

  const handleDeleteCurrentView = () => {
    if (!activeSplitView) return;
    if (visibleSplitViews.length <= 1) {
      toast.error('At least one Split View must remain.');
      return;
    }
    const deletedName = activeSplitView.name;
    onDeleteSplitView?.(activeSplitView.id);
    toast.info(`Deleted Split View "${deletedName}"`);
  };

  const toggleSplitCollapsed = (splitId) => {
    setCollapsedSplits((prev) => ({ ...prev, [splitId]: !prev[splitId] }));
  };

  const getSplitPage = (splitId) => splitPages[splitId] || 1;
  const setSplitPage = (splitId, nextPage) => {
    setSplitPages((prev) => ({ ...prev, [splitId]: nextPage }));
  };

  const columnByKey = useMemo(
    () => Object.fromEntries(columnCatalog.map((c) => [c.key, c])),
    [columnCatalog]
  );

  const toggleColumnOnActiveViewSplit = (splitId, colKey) => {
    if (!activeSplitView || !onSaveSplitView) return;
    const updatedSplits = (activeSplitView.splits || []).map((sp) => {
      if (sp.id !== splitId) return sp;
      const curr = sp.columns || defaultColumns;
      const exists = curr.includes(colKey);
      if (exists && curr.length <= 2) return sp;
      const nextCols = exists ? curr.filter((k) => k !== colKey) : [...curr, colKey];
      return { ...sp, columns: nextCols };
    });
    onSaveSplitView({ ...activeSplitView, splits: updatedSplits });
  };

  return (
    <div className="bg-[#F3F6FB] p-2.5 sm:p-3.5 space-y-3" data-testid={`${moduleType}-split-view`}>
      {/* ================= TOP SPLIT VIEW BAR (Screenshot 1) ================= */}
      <div className="bg-white border border-[#DCE3EE] rounded-lg px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        {/* Left: Split View Selector Dropdown + Edit Pencil + Create / Delete */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <button
              type="button"
              data-testid="split-view-selector"
              onClick={() => setSelectorOpen((o) => !o)}
              className="h-8 px-3 rounded-md border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[13px] font-medium text-[#0F172A] inline-flex items-center gap-2 shadow-2xs transition-colors"
            >
              <span>{activeSplitView?.name || 'Select Split View'}</span>
              <ChevronDown size={14} className="text-[#64748B]" />
            </button>

            {selectorOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-64 bg-white border border-[#DCE3EE] rounded-lg shadow-xl py-1.5 z-40">
                <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#64748B] border-b border-[#F1F5F9]">
                  Saved Split Views
                </div>
                <div className="max-h-60 overflow-y-auto thin-scroll py-1">
                  {visibleSplitViews.map((sv) => {
                    const isCurrent = sv.id === activeSplitView?.id;
                    return (
                      <button
                        key={sv.id}
                        type="button"
                        data-testid={`split-view-option-${sv.id}`}
                        onClick={() => {
                          setActiveViewId(sv.id);
                          setSelectorOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-[12.5px] flex items-center justify-between hover:bg-[#F8FAFC] ${
                          isCurrent ? 'text-[#2563EB] font-semibold bg-[#EFF6FF]/60' : 'text-[#1E293B]'
                        }`}
                      >
                        <span className="truncate flex items-center gap-1.5">
                          {isCurrent && <Check size={13} className="text-[#2563EB] shrink-0" />}
                          <span className="truncate">{sv.name}</span>
                        </span>
                        <span className="text-[10.5px] text-[#64748B] ml-2 shrink-0">
                          {sv.shareWith === 'only_me'
                            ? 'Private'
                            : sv.shareWith === 'selected_users'
                            ? 'Shared'
                            : 'Public'}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="border-t border-[#F1F5F9] pt-1 mt-0.5 px-2">
                  <button
                    type="button"
                    data-testid="create-split-view-menu-btn"
                    onClick={openCreateModal}
                    className="w-full px-2.5 py-1.5 rounded text-[12.5px] font-semibold text-[#2563EB] hover:bg-[#EFF6FF] flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    <span>Create Split View</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Pencil Edit Button next to Split View Selector matching Screenshot 1 */}
          <button
            type="button"
            onClick={() => openEditModal(activeSplitView)}
            data-testid="edit-split-view-btn"
            title="Edit current Split View"
            aria-label="Edit Split View"
            className="w-8 h-8 rounded-md hover:bg-[#F1F5F9] text-[#475569] hover:text-[#0F172A] flex items-center justify-center transition-colors"
          >
            <Pencil size={14.5} />
          </button>

          {/* Delete Split View Button */}
          {visibleSplitViews.length > 1 && (
            <button
              type="button"
              onClick={handleDeleteCurrentView}
              data-testid="delete-split-view-btn"
              title="Delete current Split View"
              aria-label="Delete Split View"
              className="w-8 h-8 rounded-md hover:bg-[#FEE2E2] text-[#64748B] hover:text-[#DC2626] flex items-center justify-center transition-colors"
            >
              <Trash2 size={14.5} />
            </button>
          )}

          {/* Direct "+ Create Split View" Button */}
          <button
            type="button"
            onClick={openCreateModal}
            data-testid="create-split-view-btn"
            className="h-8 px-2.5 rounded-md border border-[#CBD5E1] bg-[#F8FAFC] hover:bg-[#EFF6FF] hover:border-[#93C5FD] text-[12px] font-medium text-[#2563EB] inline-flex items-center gap-1 transition-colors"
          >
            <Plus size={13.5} />
            <span>Create Split View</span>
          </button>

          {activeSplitView && (
            <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
              {activeSplitView.shareWith === 'only_me' ? (
                <>
                  <Lock size={10.5} /> Only me
                </>
              ) : activeSplitView.shareWith === 'selected_users' ? (
                <>
                  <Users size={10.5} /> Shared ({activeSplitView.sharedUsers?.length || 1} users)
                </>
              ) : (
                'Shared with Everyone'
              )}
            </span>
          )}
        </div>

        {/* Right: "Records Per Split [20 ▾]" matching Screenshot 1 */}
        <div className="flex items-center gap-2 text-[12.5px] text-[#334155]">
          <span className="font-medium">Records Per Split</span>
          <select
            value={recordsPerSplit}
            data-testid="records-per-split-select"
            onChange={(e) => {
              setRecordsPerSplit(Number(e.target.value));
              setSplitPages({});
            }}
            aria-label="Records Per Split"
            className="h-8 px-2.5 rounded-md border border-[#CBD5E1] bg-white text-[12.5px] font-medium text-[#0F172A] focus:outline-none focus:border-[#2563EB] cursor-pointer"
          >
            {[5, 10, 20, 30, 50].map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ================= COLLAPSIBLE SPLIT SECTIONS (Screenshot 1) ================= */}
      <div className="space-y-3.5">
        {(activeSplitView?.splits || []).map((split) => {
          const matchingRows = rows.filter((r) => evaluateSplitMatch(r, split, evalContext));
          const isCollapsed = Boolean(collapsedSplits[split.id]);
          const subMode = splitSubMode[split.id] || 'table';
          const currentPage = getSplitPage(split.id);
          const maxPage = Math.max(1, Math.ceil(matchingRows.length / recordsPerSplit));
          const safePage = Math.min(currentPage, maxPage);
          const startIdx = matchingRows.length === 0 ? 0 : (safePage - 1) * recordsPerSplit + 1;
          const endIdx = Math.min(matchingRows.length, safePage * recordsPerSplit);
          const pageRows = matchingRows.slice((safePage - 1) * recordsPerSplit, safePage * recordsPerSplit);

          const splitColKeys = (split.columns?.length ? split.columns : defaultColumns).filter(
            (k) => columnByKey[k]
          );
          const activeCols = splitColKeys.length
            ? splitColKeys.map((k) => columnByKey[k])
            : columnCatalog.slice(0, 5);

          const allPageSelected =
            pageRows.length > 0 && table && pageRows.every((r) => table.selected.has(r.id));
          const somePageSelected =
            pageRows.length > 0 && table && pageRows.some((r) => table.selected.has(r.id));

          const toggleSelectAllInSplit = () => {
            if (!table) return;
            pageRows.forEach((r) => {
              const has = table.selected.has(r.id);
              if (allPageSelected && has) table.toggle(r.id);
              else if (!allPageSelected && !has) table.toggle(r.id);
            });
          };

          return (
            <section
              key={split.id}
              data-testid={`split-section-${split.id}`}
              className="bg-white border border-[#DCE3EE] rounded-lg shadow-2xs overflow-hidden"
            >
              {/* Split Section Header Bar */}
              <div className="px-4 py-2.5 bg-white border-b border-[#E6ECF5] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => toggleSplitCollapsed(split.id)}
                  data-testid={`split-toggle-${split.id}`}
                  className="inline-flex items-center gap-2 text-left group focus:outline-none"
                >
                  {isCollapsed ? (
                    <ChevronRight size={16} className="text-[#475569] group-hover:text-[#0F172A]" />
                  ) : (
                    <ChevronDown size={16} className="text-[#475569] group-hover:text-[#0F172A]" />
                  )}
                  <span className="text-[14.5px] font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                    {split.name}
                  </span>
                  <span
                    data-testid={`split-count-${split.id}`}
                    className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11.5px] font-semibold bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0]"
                  >
                    {matchingRows.length}
                  </span>
                </button>

                {/* Top-right Table / Chart icons matching Screenshot 1 */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSplitSubMode((p) => ({ ...p, [split.id]: 'table' }))}
                    title="Table view"
                    aria-label="Split table view"
                    className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
                      subMode === 'table'
                        ? 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]'
                        : 'text-[#64748B] hover:bg-[#F1F5F9]'
                    }`}
                  >
                    <List size={14.5} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitSubMode((p) => ({ ...p, [split.id]: 'chart' }))}
                    title="Split breakdown chart"
                    aria-label="Split chart view"
                    className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
                      subMode === 'chart'
                        ? 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]'
                        : 'text-[#64748B] hover:bg-[#F1F5F9]'
                    }`}
                  >
                    <PieChart size={14.5} />
                  </button>
                </div>
              </div>

              {/* Collapsible Split Body */}
              {!isCollapsed && (
                <>
                  {subMode === 'chart' ? (
                    <div className="p-4 bg-[#FAFBFD] border-b border-[#E6ECF5]">
                      <div className="text-[12.5px] font-semibold text-[#334155] mb-2.5">
                        {split.name} — Distribution by Owner ({matchingRows.length} records)
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {users.map((u) => {
                          const cnt = matchingRows.filter((r) => r.ownerId === u.id).length;
                          const pct = matchingRows.length
                            ? Math.round((cnt / matchingRows.length) * 100)
                            : 0;
                          return (
                            <div
                              key={u.id}
                              className="bg-white border border-[#E2E8F0] rounded-lg p-2.5 flex items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <UserAvatar userId={u.id} size={22} />
                                <span className="text-[12px] font-medium text-[#1E293B] truncate">
                                  {u.name}
                                </span>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-[12.5px] font-bold text-[#0F172A]">{cnt}</span>
                                <span className="text-[11px] text-[#64748B] ml-1">({pct}%)</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto overflow-y-auto thin-scroll max-h-[380px]">
                      <table
                        className="w-full border-separate border-spacing-0 text-[12.5px] text-[#1E293B]"
                        style={{ minWidth: Math.max(760, activeCols.length * 150) }}
                      >
                        <thead className="sticky top-0 z-10 bg-[#FAFBFD]">
                          <tr className="h-[36px]">
                            <th className="w-[42px] min-w-[42px] px-2.5 text-center border-b border-r border-[#E6ECF5] bg-[#FAFBFD]">
                              <input
                                type="checkbox"
                                className="cb"
                                checked={allPageSelected}
                                ref={(el) => {
                                  if (el) el.indeterminate = !allPageSelected && somePageSelected;
                                }}
                                onChange={toggleSelectAllInSplit}
                                aria-label={`Select all in ${split.name}`}
                              />
                            </th>

                            {activeCols.map((col, colIdx) => {
                              const isSorted = table?.sort?.key === col.key;
                              const SortIcon = isSorted
                                ? table.sort.dir === 'asc'
                                  ? ArrowUp
                                  : ArrowDown
                                : ArrowUpDown;
                              const isRight = col.align === 'right';
                              return (
                                <th
                                  key={col.key}
                                  className={`px-3 py-1.5 font-semibold text-[#1E293B] border-b border-r border-[#E6ECF5] bg-[#FAFBFD] whitespace-nowrap select-none ${
                                    isRight ? 'text-right' : 'text-left'
                                  }`}
                                >
                                  <div
                                    className={`flex items-center gap-1.5 ${
                                      isRight ? 'justify-end' : 'justify-start'
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => table?.onSort(col.key)}
                                      className="group inline-flex items-center gap-1 font-semibold text-[#1E293B] hover:text-[#2563EB]"
                                    >
                                      <span>{col.label}</span>
                                      <SortIcon
                                        size={11.5}
                                        className={
                                          isSorted
                                            ? 'text-[#2563EB]'
                                            : 'text-[#94A3B8] opacity-0 group-hover:opacity-100 transition-opacity'
                                        }
                                      />
                                    </button>
                                    {(col.key === 'lastName' || (colIdx === 0 && col.key === 'name')) && (
                                      <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-[#475569] ml-1">
                                        All <ChevronDown size={10} />
                                      </span>
                                    )}
                                  </div>
                                </th>
                              );
                            })}

                            {/* Far-right Column Customizer cell matching Screenshot 1 */}
                            <th className="w-[38px] min-w-[38px] px-1 text-center border-b border-[#E6ECF5] bg-[#FAFBFD] relative">
                              <button
                                type="button"
                                onClick={() =>
                                  setSplitColOpen((prev) => (prev === split.id ? null : split.id))
                                }
                                title="Customize columns for this split"
                                aria-label="Customize split columns"
                                className="w-6 h-6 rounded hover:bg-[#E2E8F0]/70 inline-flex items-center justify-center text-[#475569]"
                              >
                                <SlidersHorizontal size={13} />
                              </button>
                              {splitColOpen === split.id && (
                                <div className="absolute right-1 top-full mt-1 w-52 bg-white border border-[#DCE3EE] rounded-lg shadow-xl py-1.5 z-30 text-left font-normal">
                                  <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#64748B] border-b border-[#F1F5F9]">
                                    Split Columns
                                  </div>
                                  <div className="max-h-52 overflow-y-auto thin-scroll py-1">
                                    {columnCatalog.map((c) => {
                                      const checked = splitColKeys.includes(c.key);
                                      return (
                                        <label
                                          key={c.key}
                                          className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-[#1E293B] hover:bg-[#F8FAFC] cursor-pointer"
                                        >
                                          <input
                                            type="checkbox"
                                            className="cb"
                                            checked={checked}
                                            onChange={() =>
                                              toggleColumnOnActiveViewSplit(split.id, c.key)
                                            }
                                          />
                                          <span className="truncate">{c.label}</span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {pageRows.map((row) => {
                            const isSelected = table ? table.selected.has(row.id) : false;
                            return (
                              <tr
                                key={row.id}
                                data-testid={`split-row-${split.id}-${row.id}`}
                                className={`h-[36px] transition-colors ${
                                  isSelected ? 'bg-[#EFF6FF]' : 'bg-white hover:bg-[#F5F8FF]'
                                }`}
                              >
                                <td className="w-[42px] px-2.5 text-center border-b border-r border-[#EEF2F8]">
                                  <input
                                    type="checkbox"
                                    className="cb"
                                    checked={isSelected}
                                    onChange={() => table?.toggle(row.id)}
                                    aria-label={`Select ${row.name || 'record'}`}
                                  />
                                </td>

                                {activeCols.map((col) => {
                                  const isRight = col.align === 'right';
                                  return (
                                    <td
                                      key={col.key}
                                      className={`px-3 py-1 border-b border-r border-[#EEF2F8] whitespace-nowrap max-w-[260px] truncate ${
                                        isRight ? 'text-right font-mono tabular-nums' : 'text-left'
                                      }`}
                                    >
                                      {col.render
                                        ? col.render(row, { onOpenDetail, accountName, userName })
                                        : row[col.key] || '—'}
                                    </td>
                                  );
                                })}

                                <td className="w-[38px] px-1 border-b border-[#EEF2F8]" />
                              </tr>
                            );
                          })}

                          {pageRows.length === 0 && (
                            <tr>
                              <td
                                colSpan={activeCols.length + 2}
                                className="py-8 text-center text-[12.5px] text-[#64748B] border-b border-[#EEF2F8]"
                              >
                                No records in this split match the current criteria or filters.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Split Section Footer matching Screenshot 1 ("Total Records 100" left, "< 1 to 20 >" right) */}
                  <div className="px-4 py-2 bg-white flex flex-wrap items-center justify-between gap-2 text-[12px] text-[#475569]">
                    <div>
                      Total Records{' '}
                      <strong className="font-bold text-[#0F172A] tabular-nums">
                        {matchingRows.length}
                      </strong>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={safePage <= 1}
                        onClick={() => setSplitPage(split.id, safePage - 1)}
                        aria-label={`Previous page in ${split.name}`}
                        className="w-6 h-6 rounded flex items-center justify-center text-[#334155] hover:bg-[#F1F5F9] disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <span className="tabular-nums text-[#0F172A]">
                        <strong className="font-semibold">{startIdx}</strong> to{' '}
                        <strong className="font-semibold">{endIdx}</strong>
                      </span>
                      <button
                        type="button"
                        disabled={safePage >= maxPage}
                        onClick={() => setSplitPage(split.id, safePage + 1)}
                        aria-label={`Next page in ${split.name}`}
                        className="w-6 h-6 rounded flex items-center justify-center text-[#334155] hover:bg-[#F1F5F9] disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </section>
          );
        })}
      </div>

      {/* ================= CREATE / EDIT SPLIT VIEW MODAL (Screenshot 2) ================= */}
      {modalState && (
        <SplitViewEditorModal
          modalState={modalState}
          setModalState={setModalState}
          fieldCatalog={fieldCatalog}
          columnCatalog={columnCatalog}
          defaultColumns={defaultColumns}
          users={users}
          onClose={() => setModalState(null)}
          onSave={(savedView) => {
            const res = onSaveSplitView?.(savedView);
            const finalId = res?.id || savedView.id;
            if (finalId) setActiveViewId(finalId);
            setModalState(null);
            toast.success(
              modalState.mode === 'edit'
                ? `Split View "${savedView.name}" updated`
                : `Split View "${savedView.name}" created`
            );
          }}
        />
      )}
    </div>
  );
}

/**
 * Full Zoho CRM "Create Split View" / "Edit Split View" Modal matching Screenshot 2.
 */
function SplitViewEditorModal({
  modalState,
  setModalState,
  fieldCatalog,
  columnCatalog,
  defaultColumns,
  users,
  onClose,
  onSave,
}) {
  const toast = useToast();
  const { view, draftSplit, editingSplitIndex, showDraftBox } = modalState;
  const [colPickerOpen, setColPickerOpen] = useState(false);
  const [openValueDropIdx, setOpenValueDropIdx] = useState(null);

  const columnByKey = useMemo(
    () => Object.fromEntries(columnCatalog.map((c) => [c.key, c])),
    [columnCatalog]
  );

  const fieldByKey = useMemo(
    () => Object.fromEntries(fieldCatalog.map((f) => [f.key, f])),
    [fieldCatalog]
  );

  const updateViewField = (key, val) => {
    setModalState((prev) => ({
      ...prev,
      view: { ...prev.view, [key]: val },
    }));
  };

  // Switch between 'Picklist/User' and 'Criteria'
  const handleModeChange = (nextMode) => {
    if (nextMode === 'picklist') {
      const pField = fieldCatalog.find((f) => f.options?.length > 0) || fieldCatalog[0];
      const generatedSplits = (pField?.options || []).slice(0, 5).map((opt, idx) => ({
        id: `sp-pk-${idx}-${Date.now().toString(36)}`,
        name: opt.label || opt,
        join: 'AND',
        criteria: [
          {
            id: `cr-pk-${idx}`,
            field: pField.key,
            operator: 'is',
            value: opt.value || opt,
          },
        ],
        columns: [...defaultColumns],
      }));
      const first = generatedSplits[0] || draftSplit;
      setModalState((prev) => ({
        ...prev,
        view: {
          ...prev.view,
          mode: 'picklist',
          picklistField: pField?.key || '',
          splits: generatedSplits,
        },
        draftSplit: first ? { ...first } : prev.draftSplit,
        editingSplitIndex: generatedSplits.length ? 0 : null,
        showDraftBox: true,
      }));
    } else {
      setModalState((prev) => ({
        ...prev,
        view: { ...prev.view, mode: 'criteria' },
        showDraftBox: true,
      }));
    }
  };

  const handlePicklistFieldChange = (fieldKey) => {
    const pField = fieldByKey[fieldKey] || fieldCatalog[0];
    const generatedSplits = (pField?.options || []).slice(0, 6).map((opt, idx) => ({
      id: `sp-pk-${idx}-${Date.now().toString(36)}`,
      name: typeof opt === 'object' ? opt.label : opt,
      join: 'AND',
      criteria: [
        {
          id: `cr-pk-${idx}`,
          field: pField.key,
          operator: 'is',
          value: typeof opt === 'object' ? opt.value : opt,
        },
      ],
      columns: [...defaultColumns],
    }));
    setModalState((prev) => ({
      ...prev,
      view: {
        ...prev.view,
        picklistField: fieldKey,
        splits: generatedSplits,
      },
      draftSplit: generatedSplits[0] ? { ...generatedSplits[0] } : prev.draftSplit,
      editingSplitIndex: generatedSplits.length ? 0 : null,
      showDraftBox: true,
    }));
  };

  const updateDraftSplit = (patch) => {
    setModalState((prev) => ({
      ...prev,
      draftSplit: { ...prev.draftSplit, ...patch },
    }));
  };

  const updateDraftCriterion = (idx, patch) => {
    setModalState((prev) => {
      const nextCriteria = (prev.draftSplit.criteria || []).map((c, i) => {
        if (i !== idx) return c;
        const updated = { ...c, ...patch };
        if (patch.field && patch.field !== c.field) {
          const fMeta = fieldByKey[patch.field];
          const firstOpt = fMeta?.options?.[0];
          updated.value = firstOpt ? (typeof firstOpt === 'object' ? firstOpt.value : firstOpt) : '';
        }
        return updated;
      });
      return {
        ...prev,
        draftSplit: { ...prev.draftSplit, criteria: nextCriteria },
      };
    });
  };

  const addDraftCriterion = () => {
    const f0 = fieldCatalog[0];
    setModalState((prev) => ({
      ...prev,
      draftSplit: {
        ...prev.draftSplit,
        criteria: [
          ...(prev.draftSplit.criteria || []),
          {
            id: `cr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
            field: f0?.key || 'name',
            operator: 'is',
            value: '',
          },
        ],
      },
    }));
  };

  const removeDraftCriterion = (idx) => {
    setModalState((prev) => {
      const curr = prev.draftSplit.criteria || [];
      if (curr.length <= 1) return prev;
      return {
        ...prev,
        draftSplit: {
          ...prev.draftSplit,
          criteria: curr.filter((_, i) => i !== idx),
        },
      };
    });
  };

  const toggleDraftColumn = (colKey) => {
    setModalState((prev) => {
      const curr = prev.draftSplit.columns || [];
      const exists = curr.includes(colKey);
      if (exists && curr.length <= 1) return prev;
      const nextCols = exists ? curr.filter((k) => k !== colKey) : [...curr, colKey];
      return {
        ...prev,
        draftSplit: { ...prev.draftSplit, columns: nextCols },
      };
    });
  };

  // Start a fresh split when clicking "New Split"
  const handleStartNewSplit = () => {
    const firstField = fieldCatalog[0] || { key: 'name', options: [] };
    const firstOpt = firstField.options?.[0];
    const defaultVal = firstOpt ? (typeof firstOpt === 'object' ? firstOpt.value : firstOpt) : '';

    setModalState((prev) => {
      // If there is a valid unsaved draftSplit currently open, commit it first so work isn't lost
      let nextSplits = [...(prev.view.splits || [])];
      if (prev.showDraftBox && prev.draftSplit?.name?.trim()) {
        const cleaned = {
          ...prev.draftSplit,
          name: prev.draftSplit.name.trim(),
        };
        if (prev.editingSplitIndex != null && nextSplits[prev.editingSplitIndex]) {
          nextSplits[prev.editingSplitIndex] = cleaned;
        } else if (!nextSplits.some((s) => s.id === cleaned.id)) {
          nextSplits.push(cleaned);
        }
      }
      return {
        ...prev,
        view: { ...prev.view, splits: nextSplits },
        draftSplit: {
          id: `sp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 4)}`,
          name: '',
          join: 'AND',
          criteria: [
            {
              id: `cr-${Date.now().toString(36)}-1`,
              field: firstField.key,
              operator: 'is',
              value: defaultVal,
            },
          ],
          columns: [...defaultColumns],
        },
        editingSplitIndex: null,
        showDraftBox: true,
      };
    });
    setColPickerOpen(false);
  };

  // Click "Done" inside the Create Split card
  const handleDoneSplit = () => {
    const splitName = String(draftSplit?.name || '').trim();
    if (!splitName) {
      toast.error('Please enter a Split Name before clicking Done.');
      return;
    }
    const committed = {
      ...draftSplit,
      id: draftSplit.id || `sp-${Date.now().toString(36)}`,
      name: splitName,
      columns: draftSplit.columns?.length ? draftSplit.columns : [...defaultColumns],
    };

    setModalState((prev) => {
      const nextSplits = [...(prev.view.splits || [])];
      if (prev.editingSplitIndex != null && nextSplits[prev.editingSplitIndex]) {
        nextSplits[prev.editingSplitIndex] = committed;
      } else {
        const existingIdx = nextSplits.findIndex((s) => s.id === committed.id);
        if (existingIdx >= 0) nextSplits[existingIdx] = committed;
        else nextSplits.push(committed);
      }
      return {
        ...prev,
        view: { ...prev.view, splits: nextSplits },
        editingSplitIndex: null,
        showDraftBox: false,
      };
    });
    setColPickerOpen(false);
  };

  // Click "Save" at top-right of Create Split View modal
  const handleSaveView = () => {
    const viewName = String(view.name || '').trim();
    if (!viewName) {
      toast.error('Please enter a Split View Name.');
      return;
    }

    let finalSplits = [...(view.splits || [])];
    // If the draft split box is open and has a name, include/update it automatically
    if (showDraftBox && draftSplit?.name?.trim()) {
      const committed = {
        ...draftSplit,
        id: draftSplit.id || `sp-${Date.now().toString(36)}`,
        name: draftSplit.name.trim(),
        columns: draftSplit.columns?.length ? draftSplit.columns : [...defaultColumns],
      };
      if (editingSplitIndex != null && finalSplits[editingSplitIndex]) {
        finalSplits[editingSplitIndex] = committed;
      } else {
        const existingIdx = finalSplits.findIndex((s) => s.id === committed.id);
        if (existingIdx >= 0) finalSplits[existingIdx] = committed;
        else finalSplits.push(committed);
      }
    }

    if (finalSplits.length === 0) {
      toast.error('Please add at least one split to save the Split View.');
      return;
    }

    onSave({
      ...view,
      id: view.id || `sv-${Date.now().toString(36)}`,
      name: viewName,
      splits: finalSplits,
    });
  };

  const selectedColumnLabels = (draftSplit?.columns || defaultColumns)
    .map((k) => columnByKey[k]?.label)
    .filter(Boolean)
    .join(', ');

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-[1px] flex items-start justify-center overflow-y-auto p-2 sm:p-5"
      data-testid="split-view-modal"
    >
      <div className="w-full max-w-[960px] bg-white rounded-xl border border-[#DCE3EE] shadow-2xl overflow-hidden my-auto">
        {/* ================= MODAL HEADER (Screenshot 2) ================= */}
        <div className="px-6 py-3.5 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
          <h2 className="text-[18px] font-bold text-[#0F172A] tracking-tight">
            {modalState.mode === 'edit' ? 'Edit Split View' : 'Create Split View'}
          </h2>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              data-testid="split-modal-cancel-btn"
              className="h-8 px-4 rounded-md border border-[#CBD5E1] bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[13px] font-medium text-[#1E293B] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveView}
              data-testid="split-modal-save-btn"
              className="h-8 px-5 rounded-md bg-[#3B82F6] hover:bg-[#2563EB] text-white text-[13px] font-semibold shadow-xs transition-colors"
            >
              Save
            </button>
            <span
              title="Split View groups records into collapsible sections based on Picklist/User or custom Criteria."
              className="text-[#64748B] hover:text-[#0F172A] cursor-help ml-1"
            >
              <CircleHelp size={16} />
            </span>
          </div>
        </div>

        {/* ================= MODAL BODY (Screenshot 2) ================= */}
        <div className="p-6 space-y-6 max-h-[calc(100vh-120px)] overflow-y-auto thin-scroll">
          {/* Name & View based on */}
          <div className="space-y-4 max-w-[540px]">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4">
              <label
                htmlFor="split-view-name"
                className="sm:w-[115px] text-[13px] text-[#475569] sm:text-right shrink-0"
              >
                Name
              </label>
              <input
                id="split-view-name"
                type="text"
                value={view.name}
                onChange={(e) => updateViewField('name', e.target.value)}
                placeholder="e.g. Split by Source"
                data-testid="split-view-name-input"
                className="flex-1 h-9 px-3 rounded-md border border-[#CBD5E1] bg-white text-[13.5px] text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4">
              <span className="sm:w-[115px] text-[13px] text-[#475569] sm:text-right shrink-0">
                View based on
              </span>
              <div className="flex items-center gap-6 text-[13.5px] text-[#0F172A]">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="splitViewMode"
                    checked={view.mode === 'picklist'}
                    onChange={() => handleModeChange('picklist')}
                    data-testid="split-mode-picklist"
                    className="h-4 w-4 text-[#2563EB] focus:ring-[#2563EB]"
                  />
                  <span>Picklist/User</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="splitViewMode"
                    checked={view.mode === 'criteria'}
                    onChange={() => handleModeChange('criteria')}
                    data-testid="split-mode-criteria"
                    className="h-4 w-4 text-[#2563EB] focus:ring-[#2563EB]"
                  />
                  <span>Criteria</span>
                </label>
              </div>
            </div>

            {view.mode === 'picklist' && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4">
                <label
                  htmlFor="split-picklist-field"
                  className="sm:w-[115px] text-[13px] text-[#475569] sm:text-right shrink-0"
                >
                  Picklist / User
                </label>
                <select
                  id="split-picklist-field"
                  value={view.picklistField || ''}
                  onChange={(e) => handlePicklistFieldChange(e.target.value)}
                  data-testid="split-picklist-field-select"
                  className="flex-1 h-9 px-3 rounded-md border border-[#CBD5E1] bg-white text-[13px] text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                >
                  {fieldCatalog
                    .filter((f) => f.options?.length > 0)
                    .map((f) => (
                      <option key={f.key} value={f.key}>
                        {f.label}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>

          {/* ================= SPLITS SECTION (Screenshot 2) ================= */}
          <div className="space-y-3">
            <div className="flex items-center justify-between max-w-[820px]">
              <h3 className="text-[14px] font-bold text-[#0F172A]">Splits</h3>
              <button
                type="button"
                onClick={handleStartNewSplit}
                data-testid="new-split-btn"
                className="h-8 px-3.5 rounded-md border border-[#93C5FD] bg-white hover:bg-[#EFF6FF] text-[#2563EB] text-[12.5px] font-medium transition-colors"
              >
                New Split
              </button>
            </div>

            {/* Saved/Committed Splits Summary List */}
            {view.splits?.length > 0 && (
              <div className="space-y-2 max-w-[820px]" data-testid="committed-splits-list">
                {view.splits.map((sp, idx) => {
                  const isBeingEdited = showDraftBox && editingSplitIndex === idx;
                  const critSummary = (sp.criteria || [])
                    .map((c) => `${fieldByKey[c.field]?.label || c.field} ${c.operator} "${c.value}"`)
                    .join(` ${sp.join || 'AND'} `);
                  return (
                    <div
                      key={sp.id || idx}
                      data-testid={`committed-split-item-${idx}`}
                      className={`px-4 py-2.5 rounded-lg border flex flex-wrap items-center justify-between gap-2 text-[12.5px] ${
                        isBeingEdited
                          ? 'border-[#2563EB] bg-[#EFF6FF]/40'
                          : 'border-[#E2E8F0] bg-[#F8FAFC]'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-[#0F172A] flex items-center gap-2">
                          <span>
                            {idx + 1}. {sp.name}
                          </span>
                          <span className="text-[11px] font-normal text-[#64748B] truncate">
                            ({critSummary})
                          </span>
                        </div>
                        <div className="text-[11.5px] text-[#64748B] truncate mt-0.5">
                          Columns:{' '}
                          {(sp.columns || defaultColumns)
                            .map((k) => columnByKey[k]?.label || k)
                            .join(', ')}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          data-testid={`edit-committed-split-${idx}`}
                          onClick={() => {
                            setModalState((prev) => ({
                              ...prev,
                              draftSplit: {
                                ...sp,
                                criteria: (sp.criteria || []).map((c) => ({ ...c })),
                                columns: [...(sp.columns || defaultColumns)],
                              },
                              editingSplitIndex: idx,
                              showDraftBox: true,
                            }));
                          }}
                          className="px-2.5 py-1 rounded border border-[#CBD5E1] bg-white hover:bg-[#F1F5F9] text-[#334155] text-[11.5px] font-medium inline-flex items-center gap-1"
                        >
                          <Pencil size={11.5} /> Edit
                        </button>
                        {view.splits.length > 1 && (
                          <button
                            type="button"
                            data-testid={`delete-committed-split-${idx}`}
                            onClick={() => {
                              setModalState((prev) => {
                                const nextSplits = prev.view.splits.filter((_, i) => i !== idx);
                                return {
                                  ...prev,
                                  view: { ...prev.view, splits: nextSplits },
                                  editingSplitIndex:
                                    prev.editingSplitIndex === idx ? null : prev.editingSplitIndex,
                                };
                              });
                            }}
                            className="p-1.5 rounded border border-transparent hover:bg-[#FEE2E2] text-[#64748B] hover:text-[#DC2626]"
                            title="Remove split"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Active "Create Split" Card Box matching Screenshot 2 */}
            {showDraftBox && draftSplit && (
              <div
                data-testid="split-editor-card"
                className="max-w-[820px] rounded-xl border border-[#DCE3EE] bg-white p-5 sm:p-6 space-y-5 shadow-2xs"
              >
                <div className="text-[13.5px] font-bold text-[#0F172A]">
                  {editingSplitIndex != null ? 'Edit Split' : 'Create Split'}
                </div>

                {/* Split Name */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4">
                  <label
                    htmlFor="split-item-name"
                    className="sm:w-[110px] text-[13px] text-[#475569] sm:text-right shrink-0"
                  >
                    Name
                  </label>
                  <input
                    id="split-item-name"
                    type="text"
                    value={draftSplit.name}
                    onChange={(e) => updateDraftSplit({ name: e.target.value })}
                    placeholder="e.g. Cold Call"
                    data-testid="split-item-name-input"
                    className="w-full sm:w-[330px] h-9 px-3 rounded-md border border-[#CBD5E1] bg-white text-[13px] text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                {/* Criteria Rows */}
                <div className="flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-4">
                  <span className="sm:w-[110px] text-[13px] text-[#475569] sm:text-right shrink-0 pt-2">
                    Criteria
                  </span>

                  <div className="flex-1 space-y-2.5">
                    {(draftSplit.criteria || []).map((crit, cIdx) => {
                      const fMeta = fieldByKey[crit.field] || fieldCatalog[0];
                      const hasOptions = Array.isArray(fMeta?.options) && fMeta.options.length > 0;
                      const isUnary = ['is empty', 'is not empty'].includes(crit.operator);
                      const selectedTokens = String(crit.value || '')
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean);

                      const toggleTokenValue = (valStr) => {
                        const exists = selectedTokens.includes(valStr);
                        const nextTokens = exists
                          ? selectedTokens.filter((t) => t !== valStr)
                          : [...selectedTokens, valStr];
                        updateDraftCriterion(cIdx, { value: nextTokens.join(', ') });
                      };

                      return (
                        <div
                          key={crit.id || cIdx}
                          className="flex flex-wrap items-center gap-2"
                        >
                          {/* Numbered Circle Badge (1) */}
                          <span className="w-6 h-6 rounded-full border border-[#CBD5E1] text-[11.5px] font-medium text-[#334155] flex items-center justify-center shrink-0">
                            {cIdx + 1}
                          </span>

                          {/* Field Dropdown */}
                          <select
                            value={crit.field}
                            onChange={(e) => updateDraftCriterion(cIdx, { field: e.target.value })}
                            data-testid={`split-criteria-field-${cIdx}`}
                            aria-label={`Criterion ${cIdx + 1} field`}
                            className="h-9 w-[175px] px-2.5 rounded-md border border-[#CBD5E1] bg-white text-[13px] text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                          >
                            {fieldCatalog.map((f) => (
                              <option key={f.key} value={f.key}>
                                {f.label}
                              </option>
                            ))}
                          </select>

                          {/* Operator Dropdown */}
                          <select
                            value={crit.operator}
                            onChange={(e) => updateDraftCriterion(cIdx, { operator: e.target.value })}
                            data-testid={`split-criteria-operator-${cIdx}`}
                            aria-label={`Criterion ${cIdx + 1} operator`}
                            className="h-9 w-[135px] px-2.5 rounded-md border border-[#CBD5E1] bg-white text-[13px] text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                          >
                            {SPLIT_OPERATORS.map((op) => (
                              <option key={op.value} value={op.value}>
                                {op.label}
                              </option>
                            ))}
                          </select>

                          {/* Value Input / Chip Picker matching Screenshot 2 */}
                          {!isUnary && (
                            <div className="relative flex-1 min-w-[210px] max-w-[290px]">
                              {hasOptions ? (
                                <div className="min-h-[36px] px-2 py-1 rounded-md border border-[#CBD5E1] bg-white flex flex-wrap items-center gap-1.5 pr-7">
                                  {selectedTokens.map((tok) => {
                                    const optObj = fMeta.options.find(
                                      (o) => (typeof o === 'object' ? o.value : o) === tok
                                    );
                                    const label = optObj
                                      ? typeof optObj === 'object'
                                        ? optObj.label
                                        : optObj
                                      : tok;
                                    return (
                                      <span
                                        key={tok}
                                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E8F0FE] text-[#1E293B] text-[12px] font-medium"
                                      >
                                        <span>{label}</span>
                                        <button
                                          type="button"
                                          onClick={() => toggleTokenValue(tok)}
                                          className="text-[#64748B] hover:text-[#0F172A]"
                                          aria-label={`Remove ${label}`}
                                        >
                                          <X size={11} />
                                        </button>
                                      </span>
                                    );
                                  })}
                                  <input
                                    type="text"
                                    value={selectedTokens.length === 0 ? crit.value : ''}
                                    onChange={(e) =>
                                      updateDraftCriterion(cIdx, { value: e.target.value })
                                    }
                                    onFocus={() => setOpenValueDropIdx(cIdx)}
                                    placeholder={selectedTokens.length === 0 ? 'Select or type...' : ''}
                                    data-testid={`split-criteria-value-${cIdx}`}
                                    aria-label={`Criterion ${cIdx + 1} value`}
                                    className="flex-1 min-w-[60px] text-[12.5px] text-[#0F172A] focus:outline-none bg-transparent"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setOpenValueDropIdx((prev) => (prev === cIdx ? null : cIdx))
                                    }
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A]"
                                    aria-label="Toggle value options"
                                  >
                                    <ChevronDown size={14} />
                                  </button>

                                  {openValueDropIdx === cIdx && (
                                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#DCE3EE] rounded-lg shadow-xl py-1 max-h-48 overflow-y-auto z-40">
                                      {fMeta.options.map((opt) => {
                                        const valStr = typeof opt === 'object' ? opt.value : opt;
                                        const labelStr = typeof opt === 'object' ? opt.label : opt;
                                        const active = selectedTokens.includes(valStr);
                                        return (
                                          <button
                                            key={valStr}
                                            type="button"
                                            onClick={() => {
                                              toggleTokenValue(valStr);
                                              setOpenValueDropIdx(null);
                                            }}
                                            className={`w-full text-left px-3 py-1.5 text-[12.5px] flex items-center justify-between hover:bg-[#F8FAFC] ${
                                              active
                                                ? 'bg-[#EFF6FF] text-[#2563EB] font-semibold'
                                                : 'text-[#1E293B]'
                                            }`}
                                          >
                                            <span>{labelStr}</span>
                                            {active && <Check size={13} />}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <input
                                  type="text"
                                  value={crit.value}
                                  onChange={(e) =>
                                    updateDraftCriterion(cIdx, { value: e.target.value })
                                  }
                                  placeholder="Enter value..."
                                  data-testid={`split-criteria-value-${cIdx}`}
                                  aria-label={`Criterion ${cIdx + 1} value`}
                                  className="w-full h-9 px-3 rounded-md border border-[#CBD5E1] bg-white text-[13px] text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                                />
                              )}
                            </div>
                          )}

                          {/* Green (+) button matching Screenshot 2 */}
                          <button
                            type="button"
                            onClick={addDraftCriterion}
                            data-testid="split-add-criterion-btn"
                            title="Add criterion row"
                            aria-label="Add criterion row"
                            className="text-[#16A34A] hover:text-[#15803D] p-1 transition-colors"
                          >
                            <PlusCircle size={18} />
                          </button>

                          {draftSplit.criteria.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeDraftCriterion(cIdx)}
                              title="Remove criterion row"
                              aria-label="Remove criterion row"
                              className="text-[#EF4444] hover:text-[#DC2626] p-1 transition-colors"
                            >
                              <MinusCircle size={18} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Select Columns Box with Pencil Icon matching Screenshot 2 */}
                <div className="flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-4">
                  <span className="sm:w-[110px] text-[13px] text-[#475569] sm:text-right shrink-0 pt-2">
                    Select Columns
                  </span>

                  <div className="flex-1 max-w-[460px] relative">
                    <button
                      type="button"
                      onClick={() => setColPickerOpen((o) => !o)}
                      data-testid="split-select-columns-trigger"
                      className="w-full min-h-[38px] px-3 py-1.5 rounded-md border border-[#CBD5E1] bg-white hover:border-[#94A3B8] text-left flex items-center justify-between gap-2 text-[13px] text-[#0F172A]"
                    >
                      <span className="truncate">{selectedColumnLabels || 'Select columns...'}</span>
                      <Pencil size={13.5} className="text-[#475569] shrink-0" />
                    </button>

                    {colPickerOpen && (
                      <div
                        data-testid="split-columns-picker"
                        className="mt-1.5 p-3 rounded-lg border border-[#DCE3EE] bg-[#F8FAFC] shadow-md grid grid-cols-2 sm:grid-cols-3 gap-2"
                      >
                        {columnCatalog.map((col) => {
                          const checked = (draftSplit.columns || defaultColumns).includes(col.key);
                          return (
                            <label
                              key={col.key}
                              className="flex items-center gap-2 text-[12.5px] text-[#1E293B] cursor-pointer hover:text-[#2563EB]"
                            >
                              <input
                                type="checkbox"
                                className="cb"
                                checked={checked}
                                onChange={() => toggleDraftColumn(col.key)}
                                data-testid={`split-col-checkbox-${col.key}`}
                              />
                              <span className="truncate">{col.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Done Button matching Screenshot 2 */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleDoneSplit}
                    data-testid="split-item-done-btn"
                    className="h-8 px-5 rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13px] font-semibold shadow-xs transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ================= SHARE WITH SECTION (Screenshot 2) ================= */}
          <div className="pt-2 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-5">
              <span className="text-[13px] text-[#475569] sm:w-[95px]">Share with</span>
              <div className="flex flex-wrap items-center gap-6 text-[13.5px] text-[#0F172A]">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="splitShareWith"
                    checked={view.shareWith === 'only_me'}
                    onChange={() => updateViewField('shareWith', 'only_me')}
                    data-testid="split-share-only-me"
                    className="h-4 w-4 text-[#2563EB] focus:ring-[#2563EB]"
                  />
                  <span>Only me</span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="splitShareWith"
                    checked={view.shareWith === 'everyone'}
                    onChange={() => updateViewField('shareWith', 'everyone')}
                    data-testid="split-share-everyone"
                    className="h-4 w-4 text-[#2563EB] focus:ring-[#2563EB]"
                  />
                  <span>Everyone</span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="splitShareWith"
                    checked={view.shareWith === 'selected_users'}
                    onChange={() => updateViewField('shareWith', 'selected_users')}
                    data-testid="split-share-selected-users"
                    className="h-4 w-4 text-[#2563EB] focus:ring-[#2563EB]"
                  />
                  <span>Selected users</span>
                </label>
              </div>
            </div>

            {view.shareWith === 'selected_users' && (
              <div
                data-testid="split-selected-users-picker"
                className="sm:ml-[115px] max-w-[560px] p-3 rounded-lg border border-[#DCE3EE] bg-[#F8FAFC] flex flex-wrap gap-2.5"
              >
                {users.map((u) => {
                  const isChecked = (view.sharedUsers || []).includes(u.id);
                  return (
                    <label
                      key={u.id}
                      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md border text-[12px] cursor-pointer transition-colors ${
                        isChecked
                          ? 'border-[#2563EB] bg-[#EFF6FF] text-[#1E293B] font-medium'
                          : 'border-[#CBD5E1] bg-white text-[#475569]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="cb"
                        checked={isChecked}
                        onChange={() => {
                          const curr = view.sharedUsers || [];
                          const next = isChecked
                            ? curr.filter((id) => id !== u.id)
                            : [...curr, u.id];
                          updateViewField('sharedUsers', next);
                        }}
                      />
                      <span>{u.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

