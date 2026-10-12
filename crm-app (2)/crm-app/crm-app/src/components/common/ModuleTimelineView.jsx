import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Columns3,
  GripVertical,
  Inbox,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
  Settings,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { AccountLogo, PersonAvatar, UserAvatar } from './Avatar';
import { GridStatusPill } from './Views';
import { useColumnLayout } from './DataTable';
import { fmtCompact, fmtDate, fmtINR, todayISO } from '../../utils/calculations';

/**
 * Zoho CRM pastel bar color palette matching the reference screenshot:
 * Soft Green (#D9F2C4), Soft Blue (#C6DDFB), Soft Gold (#F2E2A7),
 * Soft Purple (#E5D4FF), Soft Mint (#C6F4EA), Soft Coral (#FAD2CF)
 */
export const TIMELINE_PASTEL_PALETTE = [
  {
    key: 'green',
    bg: '#D9F2C4',
    hoverBg: '#CBEBAF',
    border: '#C1E5A4',
    text: '#1E293B',
    dot: '#65A30D',
    label: 'Green',
  },
  {
    key: 'blue',
    bg: '#C6DDFB',
    hoverBg: '#B3D2FA',
    border: '#ACC9F4',
    text: '#1E293B',
    dot: '#2563EB',
    label: 'Blue',
  },
  {
    key: 'gold',
    bg: '#F2E2A7',
    hoverBg: '#EBD68C',
    border: '#E4CE82',
    text: '#1E293B',
    dot: '#D97706',
    label: 'Amber',
  },
  {
    key: 'purple',
    bg: '#E5D4FF',
    hoverBg: '#D8C0FF',
    border: '#D0B9F5',
    text: '#1E293B',
    dot: '#7C3AED',
    label: 'Purple',
  },
  {
    key: 'teal',
    bg: '#C6F4EA',
    hoverBg: '#B0EDE0',
    border: '#A7E6D8',
    text: '#1E293B',
    dot: '#0D9488',
    label: 'Teal',
  },
  {
    key: 'coral',
    bg: '#FAD2CF',
    hoverBg: '#F6B8B4',
    border: '#F1B7B3',
    text: '#1E293B',
    dot: '#DC2626',
    label: 'Coral',
  },
];

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Parse YYYY-MM-DD or ISO string into local midnight Date */
function parseDateLocal(val) {
  if (!val) return null;
  const s = String(val).trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const parsed = new Date(val);
    if (isNaN(parsed.getTime())) return null;
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toISODate(date) {
  if (!date || isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDaysDate(date, days) {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + days);
  return next;
}

function diffDays(startDate, endDate) {
  const msPerDay = 24 * 60 * 60 * 1000;
  const utc1 = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const utc2 = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  return Math.round((utc2 - utc1) / msPerDay);
}

/** Compute ISO week number (1..53) and year */
function getISOWeekInfo(date) {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((tmp - yearStart) / 86400000 + 1) / 7);
  return { week: weekNo, year: tmp.getUTCFullYear(), month: date.getMonth(), fullYear: date.getFullYear() };
}

/** Deterministic hash for fallback span duration (5 to 10 days) when start === end */
function deterministicSpanDays(idStr = '') {
  let h = 0;
  for (let i = 0; i < idStr.length; i++) {
    h = (h * 31 + idStr.charCodeAt(i)) % 1000;
  }
  return 5 + (h % 6);
}

function loadTimelineSettings(moduleType, defaults) {
  try {
    const raw = localStorage.getItem(`zcrm.v1.timelineSettings.${moduleType}`);
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return defaults;
  }
}

function saveTimelineSettings(moduleType, settings) {
  try {
    localStorage.setItem(`zcrm.v1.timelineSettings.${moduleType}`, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

/**
 * Zoho CRM-style Gantt/Calendar Timeline View for Contacts and Accounts,
 * optimized for large datasets with:
 * - Horizontal scrolling across dates & vertical scrolling through all records
 * - Sticky top date header AND sticky left record-name & metadata columns
 * - Drag-and-drop column header reordering (mouse, touch, and keyboard)
 * - Resizable column widths with persistent per-module storage in localStorage
 */
export default function ModuleTimelineView({
  moduleType = 'contacts', // 'contacts' | 'accounts'
  rows = [],
  totalCount,
  users = [],
  userName,
  accountName,
  deals = [],
  contacts = [],
  calls = [],
  tasks = [],
  sort,
  onSortChange,
  onOpenDetail,
  emptyResetAction,
}) {
  const todayStr = todayISO(); // e.g., '2026-10-12'
  const todayDate = useMemo(() => parseDateLocal(todayStr) || new Date(2026, 9, 12), [todayStr]);

  const defaultSettings = useMemo(
    () =>
      moduleType === 'contacts'
        ? {
            datePreset: 'engagementWindow',
            startDateField: 'lastContacted',
            endDateField: 'followUp',
            colorBy: 'lifecycle',
            showAvatar: true,
            showDateRangeOnBar: false,
            showCategoryOnBar: false,
            showOwnerNameOnBar: false,
          }
        : {
            datePreset: 'engagementWindow',
            startDateField: 'createdOn',
            endDateField: 'lastActivityTime',
            colorBy: 'type',
            showAvatar: true,
            showDateRangeOnBar: false,
            showCategoryOnBar: false,
            showOwnerNameOnBar: false,
          },
    [moduleType]
  );

  const [settings, setSettings] = useState(() => loadTimelineSettings(moduleType, defaultSettings));
  useEffect(() => {
    saveTimelineSettings(moduleType, settings);
  }, [moduleType, settings]);

  // Controls State
  const [scale, setScale] = useState('weeks'); // 'days' | 'weeks' | 'months'
  const [groupBy, setGroupBy] = useState('none'); // 'none' | field key
  const [colorFilter, setColorFilter] = useState('all'); // 'all' | category value
  const [localSortKey, setLocalSortKey] = useState(() => sort?.key || 'none');
  const [localSortDir, setLocalSortDir] = useState(() => sort?.dir || 'asc');
  const [leftColumnsCompact, setLeftColumnsCompact] = useState(false);

  // Anchor date is the start of the visible calendar window
  const [windowStart, setWindowStart] = useState(() => addDaysDate(todayDate, -11));

  // Dropdown / Popover open states
  const [groupMenuOpen, setGroupMenuOpen] = useState(false);
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const [scaleMenuOpen, setScaleMenuOpen] = useState(false);
  const [colMenuOpen, setColMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState(() => new Set());
  const [hoveredBar, setHoveredBar] = useState(null); // { item, rect }

  // Drag & Resize State for Sticky Left Record Columns
  const [dragColKey, setDragColKey] = useState(null);
  const [overColKey, setOverColKey] = useState(null);
  const [resizingColKey, setResizingColKey] = useState(null);
  const resizeRef = useRef(null);
  const touchDragRef = useRef(null);

  const scrollContainerRef = useRef(null);
  const headerControlsRef = useRef(null);

  // Define the reorderable/resizable columns available on the left side of the Timeline
  const timelineColumnsCatalog = useMemo(
    () =>
      moduleType === 'contacts'
        ? [
            {
              key: 'name',
              label: 'Contact Name',
              required: true,
              defaultWidth: 195,
              sortable: true,
              render: (item) => (
                <button
                  type="button"
                  onClick={() => onOpenDetail && onOpenDetail(item.id)}
                  data-testid={`timeline-record-link-${item.id}`}
                  className="inline-flex items-center gap-2 text-left font-semibold text-[#1E293B] hover:text-[#2563EB] hover:underline truncate max-w-full cursor-pointer"
                >
                  <PersonAvatar name={item.name} size={22} />
                  <span className="truncate">{item.name}</span>
                </button>
              ),
            },
            {
              key: 'owner',
              label: 'Contact Owner',
              defaultWidth: 140,
              sortable: true,
              render: (item) => (
                <div className="inline-flex items-center gap-1.5 truncate max-w-full">
                  <UserAvatar userId={item.ownerId} size={18} />
                  <span className="truncate text-[#334155] text-[12px]">{item.ownerName}</span>
                </div>
              ),
            },
            {
              key: 'lifecycle',
              label: 'Lifecycle Stage',
              defaultWidth: 125,
              sortable: true,
              render: (item) => <GridStatusPill value={item.rec.lifecycle || 'New'} />,
            },
            {
              key: 'account',
              label: 'Account Name',
              defaultWidth: 155,
              sortable: true,
              render: (item) => (
                <span className="truncate block text-[#334155] text-[12px]">
                  {accountName ? accountName(item.rec.accountId) : '—'}
                </span>
              ),
            },
            {
              key: 'leadSource',
              label: 'Lead Source',
              defaultWidth: 125,
              sortable: true,
              render: (item) => (
                <span className="truncate block text-[#475569] text-[12px]">
                  {item.rec.leadSource || '—'}
                </span>
              ),
            },
            {
              key: 'dateSpan',
              label: 'Timeline Dates',
              defaultWidth: 155,
              sortable: true,
              render: (item) => (
                <span className="font-mono text-[11.5px] text-[#475569] whitespace-nowrap">
                  {fmtDate(item.startISO)} – {fmtDate(item.endISO)}
                </span>
              ),
            },
            {
              key: 'mobile',
              label: 'Mobile',
              defaultWidth: 135,
              sortable: false,
              render: (item) => (
                <span className="font-mono text-[11.5px] text-[#475569] whitespace-nowrap">
                  {item.rec.mobile || item.rec.phone || '—'}
                </span>
              ),
            },
            {
              key: 'city',
              label: 'City',
              defaultWidth: 115,
              sortable: false,
              render: (item) => (
                <span className="truncate block text-[#475569] text-[12px]">
                  {item.rec.city || item.rec.mailingCity || '—'}
                </span>
              ),
            },
          ]
        : [
            {
              key: 'name',
              label: 'Account Name',
              required: true,
              defaultWidth: 205,
              sortable: true,
              render: (item) => (
                <button
                  type="button"
                  onClick={() => onOpenDetail && onOpenDetail(item.id)}
                  data-testid={`timeline-record-link-${item.id}`}
                  className="inline-flex items-center gap-2 text-left font-semibold text-[#1E293B] hover:text-[#2563EB] hover:underline truncate max-w-full cursor-pointer"
                >
                  <AccountLogo account={item.rec} size={22} />
                  <span className="truncate">{item.name}</span>
                </button>
              ),
            },
            {
              key: 'owner',
              label: 'Account Owner',
              defaultWidth: 140,
              sortable: true,
              render: (item) => (
                <div className="inline-flex items-center gap-1.5 truncate max-w-full">
                  <UserAvatar userId={item.ownerId} size={18} />
                  <span className="truncate text-[#334155] text-[12px]">{item.ownerName}</span>
                </div>
              ),
            },
            {
              key: 'type',
              label: 'Account Type',
              defaultWidth: 125,
              sortable: true,
              render: (item) => <GridStatusPill value={item.rec.type || 'Customer'} />,
            },
            {
              key: 'industry',
              label: 'Industry',
              defaultWidth: 150,
              sortable: true,
              render: (item) => (
                <span className="truncate block text-[#334155] text-[12px]">
                  {item.rec.industry || '—'}
                </span>
              ),
            },
            {
              key: 'annualRevenue',
              label: 'Annual Revenue',
              defaultWidth: 130,
              sortable: true,
              render: (item) => (
                <span className="font-mono text-[12px] font-medium text-[#0F172A] whitespace-nowrap">
                  {fmtCompact(item.rec.annualRevenue || 0)}
                </span>
              ),
            },
            {
              key: 'dateSpan',
              label: 'Timeline Dates',
              defaultWidth: 155,
              sortable: true,
              render: (item) => (
                <span className="font-mono text-[11.5px] text-[#475569] whitespace-nowrap">
                  {fmtDate(item.startISO)} – {fmtDate(item.endISO)}
                </span>
              ),
            },
            {
              key: 'rating',
              label: 'Rating',
              defaultWidth: 110,
              sortable: true,
              render: (item) => <GridStatusPill value={item.rec.rating || 'Hot'} />,
            },
            {
              key: 'billingCity',
              label: 'City',
              defaultWidth: 115,
              sortable: false,
              render: (item) => (
                <span className="truncate block text-[#475569] text-[12px]">
                  {item.rec.billingCity || item.rec.location || '—'}
                </span>
              ),
            },
          ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [moduleType, accountName]
  );

  const defaultColKeys = useMemo(() => timelineColumnsCatalog.map((c) => c.key), [timelineColumnsCatalog]);
  const defaultHiddenColKeys = useMemo(
    () =>
      moduleType === 'contacts'
        ? ['account', 'leadSource', 'dateSpan', 'mobile', 'city']
        : ['industry', 'annualRevenue', 'dateSpan', 'rating', 'billingCity'],
    [moduleType]
  );
  const defaultColWidths = useMemo(
    () => Object.fromEntries(timelineColumnsCatalog.map((c) => [c.key, c.defaultWidth || 140])),
    [timelineColumnsCatalog]
  );

  const {
    columnOrder,
    hiddenColumns,
    columnWidths,
    reorderColumns,
    moveColumnByOffset,
    toggleColumnVisibility,
    setColumnWidth,
    resetColumns,
  } = useColumnLayout(`timeline-${moduleType}`, defaultColKeys, defaultHiddenColKeys, defaultColWidths);

  // Ordered visible columns for the sticky left panel
  const orderedAllColumns = useMemo(() => {
    const map = new Map(timelineColumnsCatalog.map((c) => [c.key, c]));
    const list = [];
    columnOrder.forEach((k) => {
      if (map.has(k)) {
        list.push(map.get(k));
        map.delete(k);
      }
    });
    map.forEach((c) => list.push(c));
    return list;
  }, [timelineColumnsCatalog, columnOrder]);

  const visibleLeftColumns = useMemo(() => {
    if (leftColumnsCompact) {
      // In compact mobile mode, show only the primary record name column
      const primary = orderedAllColumns.find((c) => c.required) || orderedAllColumns[0];
      return primary ? [primary] : [];
    }
    return orderedAllColumns.filter((c) => c.required || !hiddenColumns.has(c.key));
  }, [orderedAllColumns, hiddenColumns, leftColumnsCompact]);

  // Compute cumulative sticky `left` offsets for each visible left column so they stay pinned together while scrolling horizontally
  const stickyLeftOffsets = useMemo(() => {
    const offsets = {};
    let acc = 0;
    visibleLeftColumns.forEach((col) => {
      offsets[col.key] = acc;
      const w = leftColumnsCompact && col.required ? 155 : columnWidths[col.key] || col.defaultWidth || 150;
      acc += w;
    });
    return { offsets, totalLeftWidth: acc };
  }, [visibleLeftColumns, columnWidths, leftColumnsCompact]);

  // Close popovers on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (headerControlsRef.current && !headerControlsRef.current.contains(e.target)) {
        setGroupMenuOpen(false);
        setColorMenuOpen(false);
        setScaleMenuOpen(false);
        setColMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Column Resize Mouse & Touch Handlers
  const startColumnResize = (e, colKey, currentWidth) => {
    e.stopPropagation();
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    resizeRef.current = { colKey, startX: clientX, startWidth: currentWidth || 150 };
    setResizingColKey(colKey);

    const onMove = (moveEvent) => {
      if (!resizeRef.current) return;
      const moveX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const delta = moveX - resizeRef.current.startX;
      setColumnWidth(resizeRef.current.colKey, resizeRef.current.startWidth + delta);
    };

    const onEnd = () => {
      resizeRef.current = null;
      setResizingColKey(null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
  };

  // Touch drag-to-reorder on mobile/tablet column headers
  const handleTouchStartCol = (e, colKey) => {
    const touch = e.touches[0];
    if (!touch) return;
    touchDragRef.current = { colKey, startX: touch.clientX };
    setDragColKey(colKey);
  };

  const handleTouchMoveCol = (e) => {
    if (!touchDragRef.current) return;
    const touch = e.touches[0];
    if (!touch) return;
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const headerCell = el?.closest?.('[data-timeline-col-key]');
    const targetKey = headerCell?.getAttribute('data-timeline-col-key');
    if (targetKey) {
      setOverColKey(targetKey);
    }
  };

  const handleTouchEndCol = () => {
    if (touchDragRef.current && overColKey && touchDragRef.current.colKey !== overColKey) {
      reorderColumns(touchDragRef.current.colKey, overColKey);
    }
    touchDragRef.current = null;
    setDragColKey(null);
    setOverColKey(null);
  };

  // Precompute related dates per record
  const relatedDatesMap = useMemo(() => {
    const map = {};
    if (moduleType === 'contacts') {
      calls.forEach((cl) => {
        if (!cl.contactId || !cl.callDate) return;
        if (!map[cl.contactId]) map[cl.contactId] = [];
        map[cl.contactId].push(cl.callDate);
      });
      tasks.forEach((tk) => {
        if (!tk.contactId || !tk.dueDate) return;
        if (!map[tk.contactId]) map[tk.contactId] = [];
        map[tk.contactId].push(tk.dueDate);
      });
      deals.forEach((dl) => {
        if (!dl.contactId) return;
        if (!map[dl.contactId]) map[dl.contactId] = [];
        if (dl.createdOn) map[dl.contactId].push(dl.createdOn);
        if (dl.closingDate) map[dl.contactId].push(dl.closingDate);
      });
    } else {
      contacts.forEach((c) => {
        if (!c.accountId) return;
        if (!map[c.accountId]) map[c.accountId] = { contactDates: [], dealStartDates: [], dealEndDates: [] };
        if (c.lastContacted) map[c.accountId].contactDates.push(c.lastContacted);
        if (c.followUp && c.followUp !== '__today__') map[c.accountId].contactDates.push(c.followUp);
      });
      deals.forEach((dl) => {
        if (!dl.accountId) return;
        if (!map[dl.accountId]) map[dl.accountId] = { contactDates: [], dealStartDates: [], dealEndDates: [] };
        if (dl.createdOn) map[dl.accountId].dealStartDates.push(dl.createdOn);
        if (dl.closingDate) map[dl.accountId].dealEndDates.push(dl.closingDate);
      });
    }
    return map;
  }, [moduleType, calls, tasks, deals, contacts]);

  // Group By options per module
  const groupOptions = useMemo(
    () =>
      moduleType === 'contacts'
        ? [
            { key: 'none', label: 'None' },
            { key: 'lifecycle', label: 'Lifecycle Stage' },
            { key: 'leadSource', label: 'Lead Source' },
            { key: 'owner', label: 'Contact Owner' },
            { key: 'department', label: 'Department' },
          ]
        : [
            { key: 'none', label: 'None' },
            { key: 'type', label: 'Account Type' },
            { key: 'rating', label: 'Rating' },
            { key: 'status', label: 'Account Status' },
            { key: 'industry', label: 'Industry' },
            { key: 'owner', label: 'Account Owner' },
          ],
    [moduleType]
  );

  // Color By options per module
  const colorByOptions = useMemo(
    () =>
      moduleType === 'contacts'
        ? [
            { key: 'lifecycle', label: 'Lifecycle Stage' },
            { key: 'leadSource', label: 'Lead Source' },
            { key: 'owner', label: 'Contact Owner' },
            { key: 'department', label: 'Department' },
          ]
        : [
            { key: 'type', label: 'Account Type' },
            { key: 'rating', label: 'Rating' },
            { key: 'status', label: 'Account Status' },
            { key: 'industry', label: 'Industry' },
            { key: 'owner', label: 'Account Owner' },
          ],
    [moduleType]
  );

  // Date field options per module
  const dateFieldOptions = useMemo(
    () =>
      moduleType === 'contacts'
        ? [
            { key: 'lastContacted', label: 'Last Contacted' },
            { key: 'followUp', label: 'Follow-Up Date' },
            { key: 'createdOn', label: 'Created Time' },
            { key: 'modifiedTime', label: 'Modified Time' },
          ]
        : [
            { key: 'createdOn', label: 'Created Time' },
            { key: 'lastActivityTime', label: 'Last Activity Time' },
            { key: 'modifiedTime', label: 'Modified Time' },
            { key: 'dealStart', label: 'Earliest Deal Created' },
            { key: 'dealEnd', label: 'Latest Deal Closing' },
          ],
    [moduleType]
  );

  const getCategoryValue = (rec, fieldKey) => {
    if (!rec) return 'Other';
    if (fieldKey === 'owner') return userName ? userName(rec.ownerId) : rec.ownerId || 'Unassigned';
    if (fieldKey === 'lifecycle') return rec.lifecycle || 'New';
    if (fieldKey === 'leadSource') return rec.leadSource || 'Website';
    if (fieldKey === 'department') return rec.department || 'General';
    if (fieldKey === 'type') return rec.type || 'Customer';
    if (fieldKey === 'rating') return rec.rating || 'Hot';
    if (fieldKey === 'status') return rec.status || 'Active';
    if (fieldKey === 'industry') return rec.industry || 'Technology';
    return rec[fieldKey] || 'Other';
  };

  // Resolve start & end Date objects and field labels for a record based on settings
  const resolveRecordDates = (rec) => {
    const spanLen = deterministicSpanDays(rec.id);

    if (moduleType === 'contacts') {
      const created = parseDateLocal(rec.createdTime || rec.createdOn);
      const lastContacted = parseDateLocal(rec.lastContacted);
      const followUp = parseDateLocal(rec.followUp === '__today__' ? todayStr : rec.followUp);
      const modified = parseDateLocal(rec.modifiedTime || rec.updatedAt);
      const relDates = (relatedDatesMap[rec.id] || []).map(parseDateLocal).filter(Boolean);

      if (settings.datePreset === 'createdToLastContacted') {
        const s = created || lastContacted || todayDate;
        const e = lastContacted && lastContacted >= s ? lastContacted : addDaysDate(s, spanLen);
        return {
          startDate: s,
          endDate: e,
          startLabel: 'Created Time',
          endLabel: lastContacted ? 'Last Contacted' : 'Activity Span',
        };
      }

      if (settings.datePreset === 'lastContactedToFollowUp') {
        const s = lastContacted || created || todayDate;
        const e = followUp && followUp > s ? followUp : addDaysDate(s, spanLen);
        return {
          startDate: s,
          endDate: e,
          startLabel: 'Last Contacted',
          endLabel: followUp ? 'Follow-Up Date' : 'Planned Touchpoint',
        };
      }

      if (settings.datePreset === 'custom') {
        const pickField = (fKey) => {
          if (fKey === 'createdOn') return created;
          if (fKey === 'lastContacted') return lastContacted;
          if (fKey === 'followUp') return followUp;
          if (fKey === 'modifiedTime') return modified || lastContacted;
          return lastContacted || created;
        };
        const rawS = pickField(settings.startDateField) || lastContacted || created || todayDate;
        const rawE = pickField(settings.endDateField);
        const s = rawE && rawE < rawS ? rawE : rawS;
        const e = rawE && rawE > s ? rawE : addDaysDate(s, spanLen);
        const sLabel = dateFieldOptions.find((d) => d.key === settings.startDateField)?.label || 'Start Date';
        const eLabel = dateFieldOptions.find((d) => d.key === settings.endDateField)?.label || 'End Date';
        return { startDate: s, endDate: e, startLabel: sLabel, endLabel: eLabel };
      }

      if (lastContacted && followUp && followUp.getTime() !== lastContacted.getTime()) {
        const s = lastContacted < followUp ? lastContacted : followUp;
        const e = lastContacted < followUp ? followUp : addDaysDate(lastContacted, spanLen);
        return {
          startDate: s,
          endDate: diffDays(s, e) < 3 ? addDaysDate(s, spanLen) : e,
          startLabel: lastContacted < followUp ? 'Last Contacted' : 'Follow-Up Date',
          endLabel: lastContacted < followUp ? 'Follow-Up Date' : 'Last Contacted',
        };
      }
      if (lastContacted) {
        const nearbyRel = relDates.find(
          (d) => Math.abs(diffDays(lastContacted, d)) >= 2 && Math.abs(diffDays(lastContacted, d)) <= 20
        );
        if (nearbyRel) {
          const s = nearbyRel < lastContacted ? nearbyRel : lastContacted;
          const e = nearbyRel > lastContacted ? nearbyRel : addDaysDate(s, spanLen);
          return {
            startDate: s,
            endDate: diffDays(s, e) < 4 ? addDaysDate(s, spanLen) : e,
            startLabel: 'Activity Start',
            endLabel: 'Last Contacted',
          };
        }
        const s = addDaysDate(lastContacted, -Math.floor(spanLen / 2));
        const e = addDaysDate(s, spanLen);
        return {
          startDate: s,
          endDate: e,
          startLabel: 'Engagement Start',
          endLabel: 'Last Contacted',
        };
      }
      const fallbackStart = created || todayDate;
      return {
        startDate: fallbackStart,
        endDate: addDaysDate(fallbackStart, spanLen),
        startLabel: 'Created Time',
        endLabel: 'Modified Time',
      };
    }

    // Accounts module date resolution
    const created = parseDateLocal(rec.createdTime || rec.createdOn);
    const lastAct = parseDateLocal(rec.lastActivityTime || rec.updatedTime);
    const modified = parseDateLocal(rec.modifiedTime || rec.updatedAt);
    const rel = relatedDatesMap[rec.id] || { contactDates: [], dealStartDates: [], dealEndDates: [] };
    const contactDates = rel.contactDates.map(parseDateLocal).filter(Boolean).sort((a, b) => a - b);
    const dealStarts = rel.dealStartDates.map(parseDateLocal).filter(Boolean).sort((a, b) => a - b);
    const dealEnds = rel.dealEndDates.map(parseDateLocal).filter(Boolean).sort((a, b) => a - b);

    const earliestDeal = dealStarts[0] || null;
    const latestDeal = dealEnds[dealEnds.length - 1] || null;
    const latestContactTouch = contactDates[contactDates.length - 1] || null;
    const earliestContactTouch = contactDates[0] || null;

    if (settings.datePreset === 'createdToLastActivity') {
      const s = created || earliestContactTouch || todayDate;
      const candEnd = lastAct || latestContactTouch || latestDeal;
      const e = candEnd && candEnd > s ? candEnd : addDaysDate(s, spanLen + 2);
      return {
        startDate: s,
        endDate: e,
        startLabel: 'Created Time',
        endLabel: 'Last Activity Time',
      };
    }

    if (settings.datePreset === 'dealWindow') {
      const s = earliestDeal || created || todayDate;
      const e = latestDeal && latestDeal > s ? latestDeal : addDaysDate(s, spanLen + 3);
      return {
        startDate: s,
        endDate: e,
        startLabel: earliestDeal ? 'Deal Start Date' : 'Created Time',
        endLabel: latestDeal ? 'Deal Closing Date' : 'Last Activity Time',
      };
    }

    if (settings.datePreset === 'custom') {
      const pickAccDate = (fKey) => {
        if (fKey === 'createdOn') return created;
        if (fKey === 'lastActivityTime') return lastAct || latestContactTouch;
        if (fKey === 'modifiedTime') return modified || lastAct || latestContactTouch;
        if (fKey === 'dealStart') return earliestDeal || created;
        if (fKey === 'dealEnd') return latestDeal || lastAct;
        return created;
      };
      const rawS = pickAccDate(settings.startDateField) || created || todayDate;
      const rawE = pickAccDate(settings.endDateField);
      const s = rawE && rawE < rawS ? rawE : rawS;
      const e = rawE && rawE > s ? rawE : addDaysDate(s, spanLen + 2);
      const sLabel = dateFieldOptions.find((d) => d.key === settings.startDateField)?.label || 'Start Date';
      const eLabel = dateFieldOptions.find((d) => d.key === settings.endDateField)?.label || 'End Date';
      return { startDate: s, endDate: e, startLabel: sLabel, endLabel: eLabel };
    }

    const activeTouch = latestContactTouch || lastAct || modified;
    if (activeTouch) {
      const startCand =
        earliestContactTouch &&
        diffDays(earliestContactTouch, activeTouch) >= 3 &&
        diffDays(earliestContactTouch, activeTouch) <= 18
          ? earliestContactTouch
          : addDaysDate(activeTouch, -Math.floor(spanLen / 2));
      const endCand =
        latestDeal && diffDays(startCand, latestDeal) >= 4 && diffDays(startCand, latestDeal) <= 20
          ? latestDeal
          : addDaysDate(startCand, spanLen + 2);
      return {
        startDate: startCand,
        endDate: endCand,
        startLabel: 'Activity Start',
        endLabel: latestDeal === endCand ? 'Deal Closing Date' : 'Last Activity Time',
      };
    }

    const baseDate = created || todayDate;
    return {
      startDate: baseDate,
      endDate: addDaysDate(baseDate, spanLen + 2),
      startLabel: 'Created Time',
      endLabel: 'Last Activity Time',
    };
  };

  // Map distinct values of `settings.colorBy` to the Zoho pastel palette
  const colorCategories = useMemo(() => {
    const counts = new Map();
    rows.forEach((r) => {
      const cat = getCategoryValue(r, settings.colorBy);
      counts.set(cat, (counts.get(cat) || 0) + 1);
    });
    return Array.from(counts.entries()).map(([cat, count], idx) => ({
      value: cat,
      count,
      palette: TIMELINE_PASTEL_PALETTE[idx % TIMELINE_PASTEL_PALETTE.length],
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, settings.colorBy, users]);

  const paletteByCategory = useMemo(() => {
    const map = {};
    colorCategories.forEach((c) => {
      map[c.value] = c.palette;
    });
    return map;
  }, [colorCategories]);

  useEffect(() => {
    if (colorFilter !== 'all' && !paletteByCategory[colorFilter]) {
      setColorFilter('all');
    }
  }, [colorFilter, paletteByCategory]);

  // Build enriched timeline items, apply Color Filter and Sort By
  const timelineItems = useMemo(() => {
    let enriched = rows.map((rec, idx) => {
      const { startDate, endDate, startLabel, endLabel } = resolveRecordDates(rec);
      const category = getCategoryValue(rec, settings.colorBy);
      const palette = paletteByCategory[category] || TIMELINE_PASTEL_PALETTE[idx % TIMELINE_PASTEL_PALETTE.length];
      const groupName = groupBy === 'none' ? 'All Records' : getCategoryValue(rec, groupBy);
      return {
        rec,
        id: rec.id,
        name: rec.name || `${rec.firstName || ''} ${rec.lastName || ''}`.trim() || 'Untitled Record',
        ownerId: rec.ownerId,
        ownerName: userName ? userName(rec.ownerId) : rec.ownerId || '—',
        startDate,
        endDate,
        startISO: toISODate(startDate),
        endISO: toISODate(endDate),
        startLabel,
        endLabel,
        durationDays: Math.max(1, diffDays(startDate, endDate) + 1),
        category,
        palette,
        groupName,
      };
    });

    if (colorFilter !== 'all') {
      enriched = enriched.filter((item) => item.category === colorFilter);
    }

    const activeSortKey = localSortKey;
    const dirMul = localSortDir === 'desc' ? -1 : 1;

    if (activeSortKey && activeSortKey !== 'none') {
      enriched = [...enriched].sort((a, b) => {
        if (activeSortKey === 'name') return a.name.localeCompare(b.name) * dirMul;
        if (activeSortKey === 'startDate' || activeSortKey === 'dateSpan') return (a.startDate - b.startDate) * dirMul;
        if (activeSortKey === 'endDate') return (a.endDate - b.endDate) * dirMul;
        if (activeSortKey === 'owner') return a.ownerName.localeCompare(b.ownerName) * dirMul;
        if (activeSortKey === 'category' || activeSortKey === 'lifecycle' || activeSortKey === 'type') {
          return a.category.localeCompare(b.category) * dirMul;
        }
        if (activeSortKey === 'annualRevenue') {
          return ((Number(a.rec.annualRevenue) || 0) - (Number(b.rec.annualRevenue) || 0)) * dirMul;
        }
        return (a.startDate - b.startDate) * dirMul;
      });
    } else {
      enriched = [...enriched].sort((a, b) => a.startDate - b.startDate || a.endDate - b.endDate);
    }

    return enriched;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, settings, paletteByCategory, groupBy, colorFilter, localSortKey, localSortDir, relatedDatesMap]);

  // Extended scrollable calendar grid configuration based on `scale` ('days' | 'weeks' | 'months')
  const gridSpec = useMemo(() => {
    if (scale === 'days') {
      const totalDays = 35; // 5 weeks of daily columns for smooth horizontal scrolling
      const colWidth = 52;
      const days = Array.from({ length: totalDays }, (_, i) => addDaysDate(windowStart, i));
      const topGroups = [];
      days.forEach((d) => {
        const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
        const last = topGroups[topGroups.length - 1];
        if (last && last.label === label) {
          last.span += 1;
        } else {
          topGroups.push({ key: `${label}-${topGroups.length}`, label, span: 1 });
        }
      });
      const startD = days[0];
      const endD = days[days.length - 1];
      const rangeTitle = `${MONTH_SHORT[startD.getMonth()]} ${startD.getDate()}, ${startD.getFullYear()} - ${MONTH_SHORT[endD.getMonth()]} ${endD.getDate()}, ${endD.getFullYear()}`;
      return {
        scale: 'days',
        totalDays,
        colWidth,
        days,
        topGroups,
        rangeTitle,
        stepDays: 7,
      };
    }

    if (scale === 'months') {
      const totalDays = 120; // ~4 months of scrollable columns
      const colWidth = 20;
      const days = Array.from({ length: totalDays }, (_, i) => addDaysDate(windowStart, i));
      const topGroups = [];
      days.forEach((d) => {
        const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
        const last = topGroups[topGroups.length - 1];
        if (last && last.label === label) {
          last.span += 1;
        } else {
          topGroups.push({ key: `${label}-${topGroups.length}`, label, span: 1 });
        }
      });
      const startD = days[0];
      const endD = days[days.length - 1];
      const rangeTitle = `${MONTH_NAMES[startD.getMonth()]} ${startD.getFullYear()} - ${MONTH_NAMES[endD.getMonth()]} ${endD.getFullYear()}`;
      return {
        scale: 'months',
        totalDays,
        colWidth,
        days,
        topGroups,
        rangeTitle,
        stepDays: 30,
      };
    }

    // Default: 'weeks' — 42 days (6 full weeks) for wide horizontal scrolling while matching the Zoho CRM screenshot
    const totalDays = 42;
    const colWidth = 44;
    const days = Array.from({ length: totalDays }, (_, i) => addDaysDate(windowStart, i));
    const topGroups = [];
    days.forEach((d) => {
      const wk = getISOWeekInfo(d);
      const label = `W${wk.week}`;
      const last = topGroups[topGroups.length - 1];
      if (last && last.label === label) {
        last.span += 1;
      } else {
        topGroups.push({ key: `${label}-${wk.year}-${topGroups.length}`, label, span: 1, week: wk.week, date: d });
      }
    });
    const firstInfo = getISOWeekInfo(days[0]);
    const lastInfo = getISOWeekInfo(days[days.length - 1]);
    const rangeTitle = `W${firstInfo.week}, ${MONTH_NAMES[days[0].getMonth()]} ${days[0].getFullYear()} - W${lastInfo.week}, ${MONTH_NAMES[days[days.length - 1].getMonth()]} ${days[days.length - 1].getFullYear()}`;

    return {
      scale: 'weeks',
      totalDays,
      colWidth,
      days,
      topGroups,
      rangeTitle,
      stepDays: 7,
    };
  }, [scale, windowStart]);

  const windowEnd = useMemo(() => gridSpec.days[gridSpec.days.length - 1], [gridSpec.days]);

  const todayColIndex = useMemo(() => diffDays(windowStart, todayDate), [windowStart, todayDate]);
  const isTodayInView = todayColIndex >= 0 && todayColIndex < gridSpec.totalDays;

  // Group items when Group By is active
  const groupedSections = useMemo(() => {
    if (groupBy === 'none') {
      return [{ key: '__all__', label: 'All Records', items: timelineItems }];
    }
    const map = new Map();
    timelineItems.forEach((it) => {
      if (!map.has(it.groupName)) map.set(it.groupName, []);
      map.get(it.groupName).push(it);
    });
    return Array.from(map.entries()).map(([key, items]) => ({
      key,
      label: key,
      items,
    }));
  }, [groupBy, timelineItems]);

  const overlappingItemsCount = useMemo(() => {
    return timelineItems.filter((it) => it.endDate >= windowStart && it.startDate <= windowEnd).length;
  }, [timelineItems, windowStart, windowEnd]);

  const handleNavigate = (dir) => {
    setWindowStart((prev) => addDaysDate(prev, dir * gridSpec.stepDays));
  };

  const handleJumpToday = () => {
    const offset = scale === 'months' ? -30 : scale === 'days' ? -7 : -11;
    setWindowStart(addDaysDate(todayDate, offset));
  };

  const handleFitToRecords = () => {
    if (timelineItems.length === 0) return;
    const firstItem = timelineItems[0];
    if (firstItem?.startDate) {
      setWindowStart(addDaysDate(firstItem.startDate, -2));
    }
  };

  const toggleGroupCollapse = (groupKey) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) next.delete(groupKey);
      else next.add(groupKey);
      return next;
    });
  };

  const totalCalendarWidth = gridSpec.totalDays * gridSpec.colWidth;
  const totalCombinedWidth = stickyLeftOffsets.totalLeftWidth + totalCalendarWidth;

  return (
    <div
      className="bg-[#F3F5F9] p-3 sm:p-4 rounded-b-lg select-none"
      data-testid={`${moduleType}-timeline-view`}
    >
      {/* 1. Top Subheader Row: "Total Records 23" on left, "Sort By [None ▾] [Asc ▾]" on right */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 px-1 text-[13px] text-[#334155]">
        <div className="flex items-center gap-3 flex-wrap">
          <div data-testid="timeline-total-records" className="text-[13.5px] text-[#334155]">
            Total Records{' '}
            <strong className="font-bold text-[#0F172A] tabular-nums">
              {colorFilter === 'all' ? (totalCount ?? timelineItems.length) : timelineItems.length}
            </strong>
          </div>
          {colorFilter !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11.5px] font-medium bg-white border border-[#CBD5E1] text-[#1E293B]">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: paletteByCategory[colorFilter]?.dot || '#2563EB' }}
              />
              <span>{colorFilter}</span>
              <button
                type="button"
                onClick={() => setColorFilter('all')}
                aria-label="Clear color filter"
                className="text-[#64748B] hover:text-[#0F172A]"
              >
                <X size={12} />
              </button>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[13px] text-[#475569] font-medium">Sort By</span>
          <select
            aria-label="Timeline Sort By"
            data-testid="timeline-sort-by-select"
            value={localSortKey}
            onChange={(e) => {
              const nextKey = e.target.value;
              setLocalSortKey(nextKey);
              if (onSortChange) {
                onSortChange(nextKey === 'none' ? null : { key: nextKey, dir: localSortDir });
              }
            }}
            className="h-8 px-2.5 rounded-md border border-[#CBD5E1] bg-white text-[13px] font-medium text-[#1E293B] focus:outline-none focus:border-[#2563EB] cursor-pointer"
          >
            <option value="none">None</option>
            <option value="startDate">Start Date</option>
            <option value="endDate">End Date</option>
            <option value="name">{moduleType === 'contacts' ? 'Contact Name' : 'Account Name'}</option>
            <option value="owner">{moduleType === 'contacts' ? 'Contact Owner' : 'Account Owner'}</option>
            <option value="category">{colorByOptions.find((c) => c.key === settings.colorBy)?.label || 'Status'}</option>
            {moduleType === 'accounts' && <option value="annualRevenue">Annual Revenue</option>}
          </select>

          <select
            aria-label="Timeline Sort Direction"
            data-testid="timeline-sort-dir-select"
            value={localSortDir}
            disabled={localSortKey === 'none'}
            onChange={(e) => {
              const nextDir = e.target.value;
              setLocalSortDir(nextDir);
              if (onSortChange && localSortKey !== 'none') {
                onSortChange({ key: localSortKey, dir: nextDir });
              }
            }}
            className="h-8 px-2.5 rounded-md border border-[#CBD5E1] bg-white text-[13px] font-medium text-[#1E293B] disabled:opacity-50 disabled:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] cursor-pointer"
          >
            <option value="asc">Asc</option>
            <option value="desc">Desc</option>
          </select>
        </div>
      </div>

      {/* 2. Main Zoho CRM White Timeline Card */}
      <div className="bg-white rounded-xl border border-[#DCE3EE] shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden">
        {/* Card Top Control Bar */}
        <div
          ref={headerControlsRef}
          className="px-4 py-3 border-b border-[#E6ECF5] flex flex-wrap items-center justify-between gap-3"
        >
          {/* Left: Range Label + Compact Columns Toggle for Mobile */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setLeftColumnsCompact((c) => !c)}
              data-testid="timeline-compact-columns-btn"
              title={leftColumnsCompact ? 'Expand record columns' : 'Compact record columns'}
              aria-label="Toggle compact record columns"
              className="h-8 w-8 rounded-md border border-[#CBD5E1] bg-[#F8FAFC] hover:bg-[#F1F5F9] flex items-center justify-center text-[#475569] cursor-pointer"
            >
              {leftColumnsCompact ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
            </button>
            <h3
              data-testid="timeline-range-heading"
              className="text-[15px] sm:text-[16px] font-bold text-[#1E293B] tracking-tight"
            >
              {gridSpec.rangeTitle}
            </h3>
          </div>

          {/* Right: Interactive Timeline Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Group By Dropdown */}
            <div className="relative">
              <button
                type="button"
                data-testid="timeline-group-by-btn"
                onClick={() => {
                  setGroupMenuOpen((o) => !o);
                  setColorMenuOpen(false);
                  setScaleMenuOpen(false);
                  setColMenuOpen(false);
                }}
                className={`h-8 px-3 rounded-md border text-[13px] font-medium inline-flex items-center gap-2 transition-colors cursor-pointer ${
                  groupBy !== 'none'
                    ? 'border-[#2563EB] bg-[#EFF6FF] text-[#1D4ED8]'
                    : 'border-[#CBD5E1] bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#334155]'
                }`}
              >
                <span>
                  {groupBy === 'none'
                    ? 'Group By'
                    : `Group: ${groupOptions.find((g) => g.key === groupBy)?.label}`}
                </span>
                <ChevronDown size={14} className="text-[#64748B]" />
              </button>

              {groupMenuOpen && (
                <div
                  data-testid="timeline-group-by-menu"
                  className="absolute left-0 top-full mt-1 w-48 bg-white border border-[#DCE3EE] rounded-lg shadow-xl py-1 z-50"
                >
                  <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#64748B] border-b border-[#F1F5F9]">
                    Group Records By
                  </div>
                  {groupOptions.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      data-testid={`timeline-group-option-${opt.key}`}
                      onClick={() => {
                        setGroupBy(opt.key);
                        setCollapsedGroups(new Set());
                        setGroupMenuOpen(false);
                      }}
                      className={`w-full px-3 py-1.5 text-left text-[12.5px] flex items-center justify-between hover:bg-[#F8FAFC] ${
                        groupBy === opt.key ? 'font-semibold text-[#2563EB] bg-[#EFF6FF]/60' : 'text-[#1E293B]'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {groupBy === opt.key && <Check size={13} className="text-[#2563EB]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Filter By Color Dropdown */}
            <div className="relative">
              <button
                type="button"
                data-testid="timeline-filter-color-btn"
                onClick={() => {
                  setColorMenuOpen((o) => !o);
                  setGroupMenuOpen(false);
                  setScaleMenuOpen(false);
                  setColMenuOpen(false);
                }}
                className={`h-8 px-3 rounded-md border text-[13px] font-medium inline-flex items-center gap-2 transition-colors cursor-pointer ${
                  colorFilter !== 'all'
                    ? 'border-[#2563EB] bg-[#EFF6FF] text-[#1D4ED8]'
                    : 'border-[#CBD5E1] bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#334155]'
                }`}
              >
                {colorFilter !== 'all' && (
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: paletteByCategory[colorFilter]?.dot || '#2563EB' }}
                  />
                )}
                <span>{colorFilter === 'all' ? 'Filter By Color' : colorFilter}</span>
                <ChevronDown size={14} className="text-[#64748B]" />
              </button>

              {colorMenuOpen && (
                <div
                  data-testid="timeline-filter-color-menu"
                  className="absolute left-0 top-full mt-1 w-56 bg-white border border-[#DCE3EE] rounded-lg shadow-xl py-1.5 z-50"
                >
                  <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#64748B] border-b border-[#F1F5F9]">
                    Color By: {colorByOptions.find((c) => c.key === settings.colorBy)?.label}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setColorFilter('all');
                      setColorMenuOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left text-[12.5px] flex items-center justify-between hover:bg-[#F8FAFC] ${
                      colorFilter === 'all' ? 'font-semibold text-[#2563EB] bg-[#EFF6FF]/60' : 'text-[#1E293B]'
                    }`}
                  >
                    <span>All Colors ({rows.length})</span>
                    {colorFilter === 'all' && <Check size={13} className="text-[#2563EB]" />}
                  </button>
                  {colorCategories.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      data-testid={`timeline-color-option-${c.value}`}
                      onClick={() => {
                        setColorFilter(c.value);
                        setColorMenuOpen(false);
                      }}
                      className={`w-full px-3 py-1.5 text-left text-[12.5px] flex items-center justify-between hover:bg-[#F8FAFC] ${
                        colorFilter === c.value ? 'font-semibold text-[#2563EB] bg-[#EFF6FF]/60' : 'text-[#1E293B]'
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span
                          className="w-4 h-3 rounded-sm border shrink-0"
                          style={{ backgroundColor: c.palette.bg, borderColor: c.palette.border }}
                        />
                        <span className="truncate">{c.value}</span>
                      </span>
                      <span className="text-[11.5px] text-[#64748B] ml-2">({c.count})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Scale Selector ("Days" / "Weeks" / "Months") */}
            <div className="relative">
              <button
                type="button"
                data-testid="timeline-scale-btn"
                onClick={() => {
                  setScaleMenuOpen((o) => !o);
                  setGroupMenuOpen(false);
                  setColorMenuOpen(false);
                  setColMenuOpen(false);
                }}
                className="h-8 px-3 rounded-md border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[13px] font-medium text-[#334155] inline-flex items-center gap-3 cursor-pointer"
              >
                <span className="capitalize">{scale}</span>
                <ChevronDown size={14} className="text-[#64748B]" />
              </button>

              {scaleMenuOpen && (
                <div
                  data-testid="timeline-scale-menu"
                  className="absolute right-0 top-full mt-1 w-36 bg-white border border-[#DCE3EE] rounded-lg shadow-xl py-1 z-50"
                >
                  {[
                    { key: 'days', label: 'Days' },
                    { key: 'weeks', label: 'Weeks' },
                    { key: 'months', label: 'Months' },
                  ].map((sc) => (
                    <button
                      key={sc.key}
                      type="button"
                      data-testid={`timeline-scale-${sc.key}`}
                      onClick={() => {
                        setScale(sc.key);
                        setScaleMenuOpen(false);
                      }}
                      className={`w-full px-3 py-1.5 text-left text-[12.5px] flex items-center justify-between hover:bg-[#F8FAFC] ${
                        scale === sc.key ? 'font-semibold text-[#2563EB] bg-[#EFF6FF]/60' : 'text-[#1E293B]'
                      }`}
                    >
                      <span>{sc.label}</span>
                      {scale === sc.key && <Check size={13} className="text-[#2563EB]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span className="text-[#CBD5E1] font-bold px-0.5 hidden sm:inline">•</span>

            {/* Navigation Buttons: < Today > */}
            <div className="inline-flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleNavigate(-1)}
                data-testid="timeline-prev-btn"
                title="Previous period"
                aria-label="Previous period"
                className="h-8 w-8 rounded-md border border-[#CBD5E1] bg-[#F8FAFC] hover:bg-[#E2E8F0]/60 flex items-center justify-center text-[#334155] transition-colors cursor-pointer"
              >
                <ChevronLeft size={15} />
              </button>

              <button
                type="button"
                onClick={handleJumpToday}
                data-testid="timeline-today-btn"
                className="h-8 px-3.5 rounded-md border border-[#CBD5E1] bg-[#F8FAFC] hover:bg-[#E2E8F0]/60 text-[13px] font-medium text-[#1E293B] transition-colors cursor-pointer"
              >
                Today
              </button>

              <button
                type="button"
                onClick={() => handleNavigate(1)}
                data-testid="timeline-next-btn"
                title="Next period"
                aria-label="Next period"
                className="h-8 w-8 rounded-md border border-[#CBD5E1] bg-[#F8FAFC] hover:bg-[#E2E8F0]/60 flex items-center justify-center text-[#334155] transition-colors cursor-pointer"
              >
                <ChevronRight size={15} />
              </button>
            </div>

            <span className="text-[#CBD5E1] font-bold px-0.5 hidden sm:inline">•</span>

            {/* Visible Columns & Header Order Dropdown Button (matching screenshot 2) */}
            <div className="relative">
              <button
                type="button"
                data-testid="timeline-columns-btn"
                onClick={() => {
                  setColMenuOpen((o) => !o);
                  setGroupMenuOpen(false);
                  setColorMenuOpen(false);
                  setScaleMenuOpen(false);
                }}
                title="Visible columns & column order"
                aria-label="Visible columns"
                className={`h-8 px-2.5 rounded-md border inline-flex items-center gap-1.5 text-[12.5px] font-medium transition-colors cursor-pointer ${
                  colMenuOpen
                    ? 'border-[#2563EB] bg-[#EFF6FF] text-[#1D4ED8]'
                    : 'border-[#CBD5E1] bg-[#F8FAFC] hover:bg-[#E2E8F0]/60 text-[#334155]'
                }`}
              >
                <SlidersHorizontal size={14} />
                <span className="hidden md:inline">Columns</span>
              </button>

              {colMenuOpen && (
                <div
                  data-testid="timeline-columns-menu"
                  className="absolute right-0 top-full mt-1 w-64 bg-white border border-[#DCE3EE] rounded-lg shadow-2xl py-1.5 z-50"
                >
                  <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#64748B] border-b border-[#F1F5F9]">
                    Visible columns (Drag to reorder)
                  </div>
                  <div className="max-h-64 overflow-y-auto thin-scroll py-1">
                    {orderedAllColumns.map((col, idx) => {
                      const isChecked = col.required || !hiddenColumns.has(col.key);
                      const isDragging = dragColKey === col.key;
                      const isOver = overColKey === col.key && dragColKey && dragColKey !== col.key;
                      return (
                        <div
                          key={col.key}
                          draggable
                          data-testid={`timeline-col-menu-item-${col.key}`}
                          onDragStart={(e) => {
                            setDragColKey(col.key);
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData('text/plain', col.key);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            if (overColKey !== col.key) setOverColKey(col.key);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            const from = e.dataTransfer.getData('text/plain') || dragColKey;
                            if (from && from !== col.key) {
                              reorderColumns(from, col.key);
                            }
                            setDragColKey(null);
                            setOverColKey(null);
                          }}
                          onDragEnd={() => {
                            setDragColKey(null);
                            setOverColKey(null);
                          }}
                          className={`group flex items-center justify-between gap-2 px-2.5 py-1.5 text-[12.5px] text-[#1E293B] ${
                            isDragging
                              ? 'opacity-50 bg-[#EFF6FF]'
                              : isOver
                              ? 'bg-[#DBEAFE]/60 border-t-2 border-[#2563EB]'
                              : 'hover:bg-[#F8FAFC]'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span
                              className="cursor-grab active:cursor-grabbing text-[#94A3B8] hover:text-[#1E293B]"
                              title="Drag to reorder"
                            >
                              <GripVertical size={13.5} />
                            </span>
                            <label className="flex items-center gap-2 cursor-pointer truncate flex-1">
                              <input
                                type="checkbox"
                                className="cb"
                                checked={isChecked}
                                disabled={col.required}
                                onChange={() => !col.required && toggleColumnVisibility(col.key)}
                              />
                              <span className="truncate">{col.label}</span>
                            </label>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => moveColumnByOffset(col.key, -1)}
                              aria-label={`Move ${col.label} up`}
                              className="w-5 h-5 rounded hover:bg-[#E2E8F0] flex items-center justify-center text-[#64748B] disabled:opacity-25 cursor-pointer"
                            >
                              <ArrowUp size={11} />
                            </button>
                            <button
                              type="button"
                              disabled={idx === orderedAllColumns.length - 1}
                              onClick={() => moveColumnByOffset(col.key, 1)}
                              aria-label={`Move ${col.label} down`}
                              className="w-5 h-5 rounded hover:bg-[#E2E8F0] flex items-center justify-center text-[#64748B] disabled:opacity-25 cursor-pointer"
                            >
                              <ArrowDown size={11} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="px-2.5 pt-1.5 border-t border-[#F1F5F9]">
                    <button
                      type="button"
                      onClick={resetColumns}
                      data-testid="timeline-reset-columns-btn"
                      className="w-full py-1 px-2 rounded text-[12px] font-medium text-[#64748B] hover:text-[#2563EB] hover:bg-[#F8FAFC] flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw size={12} />
                      <span>Reset order &amp; widths</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Settings Gear Button */}
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              data-testid="timeline-settings-btn"
              title="Timeline Settings"
              aria-label="Timeline Settings"
              className="h-8 w-9 rounded-md border border-[#CBD5E1] bg-[#F8FAFC] hover:bg-[#E2E8F0]/60 flex items-center justify-center text-[#334155] transition-colors cursor-pointer"
            >
              <Settings size={15} />
            </button>
          </div>
        </div>

        {/* 3. Unified Horizontal + Vertical Scroll Container with Sticky Left Columns & Sticky Top Date Header */}
        <div
          ref={scrollContainerRef}
          className="relative overflow-x-auto overflow-y-auto thin-scroll max-h-[calc(100vh-240px)] min-h-[440px]"
          data-testid="timeline-calendar-scroll"
        >
          <div className="relative" style={{ width: totalCombinedWidth, minWidth: '100%' }}>
            {/* ==================== STICKY TOP HEADER (Left Column Headers + Right Calendar Period/Day Headers) ==================== */}
            <div className="sticky top-0 z-30 flex bg-white border-b border-[#DCE3EE]">
              {/* Top-Left Sticky Corner: Reorderable & Resizable Record Column Headers */}
              <div
                className="sticky left-0 z-40 flex bg-[#F7F9FC] border-r-2 border-[#CBD5E1] shrink-0 shadow-[2px_0_5px_rgba(15,23,42,0.04)]"
                style={{ width: stickyLeftOffsets.totalLeftWidth }}
              >
                {visibleLeftColumns.map((col, colIdx) => {
                  const w =
                    leftColumnsCompact && col.required
                      ? 155
                      : columnWidths[col.key] || col.defaultWidth || 150;
                  const isSorted = localSortKey === col.key;
                  const SortIcon = isSorted
                    ? localSortDir === 'asc'
                      ? ArrowUp
                      : ArrowDown
                    : ArrowUpDown;
                  const isDragging = dragColKey === col.key;
                  const isDropTarget = overColKey === col.key && dragColKey && dragColKey !== col.key;

                  return (
                    <div
                      key={col.key}
                      data-timeline-col-key={col.key}
                      data-testid={`timeline-header-col-${col.key}`}
                      draggable={!resizingColKey}
                      onDragStart={(e) => {
                        if (resizingColKey) {
                          e.preventDefault();
                          return;
                        }
                        setDragColKey(col.key);
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', col.key);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        if (overColKey !== col.key) setOverColKey(col.key);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const fromKey = e.dataTransfer.getData('text/plain') || dragColKey;
                        if (fromKey && fromKey !== col.key) {
                          reorderColumns(fromKey, col.key);
                        }
                        setDragColKey(null);
                        setOverColKey(null);
                      }}
                      onDragEnd={() => {
                        setDragColKey(null);
                        setOverColKey(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.altKey || e.shiftKey) {
                          if (e.key === 'ArrowLeft') {
                            e.preventDefault();
                            moveColumnByOffset(col.key, -1);
                          } else if (e.key === 'ArrowRight') {
                            e.preventDefault();
                            moveColumnByOffset(col.key, 1);
                          }
                        }
                      }}
                      tabIndex={0}
                      style={{ width: w, minWidth: w, maxWidth: w }}
                      className={`group/tcol relative h-[68px] px-2.5 flex flex-col justify-center border-r border-[#E2E8F0] select-none transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#2563EB] ${
                        isDragging
                          ? 'opacity-55 bg-[#EFF6FF] ring-2 ring-inset ring-[#2563EB]'
                          : isDropTarget
                          ? 'bg-[#DBEAFE]/75 border-l-2 border-l-[#2563EB]'
                          : 'bg-[#F7F9FC] hover:bg-[#F1F5F9]'
                      }`}
                    >
                      <div className="flex items-center gap-1 min-w-0">
                        {/* Clear Drag Handle (Mouse & Touch) */}
                        <span
                          data-testid={`timeline-col-drag-handle-${col.key}`}
                          onTouchStart={(e) => handleTouchStartCol(e, col.key)}
                          onTouchMove={handleTouchMoveCol}
                          onTouchEnd={handleTouchEndCol}
                          title="Drag to reorder column (or Alt+Left/Right)"
                          className="cursor-grab active:cursor-grabbing text-[#94A3B8] hover:text-[#1E293B] p-0.5 -ml-1 rounded shrink-0"
                        >
                          <GripVertical size={13.5} />
                        </span>

                        {col.sortable ? (
                          <button
                            type="button"
                            onClick={() => {
                              const nextDir =
                                localSortKey === col.key && localSortDir === 'asc' ? 'desc' : 'asc';
                              setLocalSortKey(col.key);
                              setLocalSortDir(nextDir);
                              if (onSortChange) {
                                onSortChange({ key: col.key, dir: nextDir });
                              }
                            }}
                            className="inline-flex items-center gap-1 font-semibold text-[12.5px] text-[#1E293B] hover:text-[#2563EB] truncate cursor-pointer"
                          >
                            <span className="truncate">{col.label}</span>
                            <SortIcon
                              size={11.5}
                              className={`shrink-0 ${
                                isSorted ? 'text-[#2563EB]' : 'text-[#94A3B8] opacity-60'
                              }`}
                            />
                          </button>
                        ) : (
                          <span className="font-semibold text-[12.5px] text-[#1E293B] truncate">
                            {col.label}
                          </span>
                        )}
                      </div>

                      {/* Subtle helper & keyboard/touch move arrows */}
                      <div className="flex items-center justify-between mt-1 text-[10.5px] text-[#64748B]">
                        <span className="truncate">Drag or resize</span>
                        {visibleLeftColumns.length > 1 && (
                          <span className="inline-flex items-center gap-0.5 opacity-75 group-hover/tcol:opacity-100">
                            <button
                              type="button"
                              disabled={colIdx === 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                moveColumnByOffset(col.key, -1);
                              }}
                              aria-label={`Move ${col.label} left`}
                              title="Move column left"
                              className="w-4 h-4 rounded hover:bg-[#DBEAFE] text-[#475569] hover:text-[#1D4ED8] disabled:opacity-25 flex items-center justify-center cursor-pointer"
                            >
                              <ArrowLeft size={10} />
                            </button>
                            <button
                              type="button"
                              disabled={colIdx === visibleLeftColumns.length - 1}
                              onClick={(e) => {
                                e.stopPropagation();
                                moveColumnByOffset(col.key, 1);
                              }}
                              aria-label={`Move ${col.label} right`}
                              title="Move column right"
                              className="w-4 h-4 rounded hover:bg-[#DBEAFE] text-[#475569] hover:text-[#1D4ED8] disabled:opacity-25 flex items-center justify-center cursor-pointer"
                            >
                              <ArrowRight size={10} />
                            </button>
                          </span>
                        )}
                      </div>

                      {/* Column Width Resize Handle */}
                      <div
                        role="separator"
                        aria-orientation="vertical"
                        aria-label={`Resize ${col.label} column`}
                        data-testid={`timeline-col-resize-${col.key}`}
                        onMouseDown={(e) => startColumnResize(e, col.key, w)}
                        onTouchStart={(e) => startColumnResize(e, col.key, w)}
                        onClick={(e) => e.stopPropagation()}
                        title="Drag to resize column width"
                        className={`absolute right-0 top-0 bottom-0 w-[6px] cursor-col-resize z-30 transition-colors ${
                          resizingColKey === col.key
                            ? 'bg-[#2563EB]'
                            : 'hover:bg-[#3B82F6]/70 group-hover/tcol:bg-[#CBD5E1]/70'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Top-Right Calendar Two-Row Header (Period Row + Day Number Row) */}
              <div className="flex flex-col shrink-0 bg-white" style={{ width: totalCalendarWidth }}>
                {/* Top Period Header Row (W40, W41, W42... or Month Names) */}
                <div className="flex h-[34px] items-center border-b border-[#F1F5F9] relative">
                  {gridSpec.topGroups.map((grp) => (
                    <div
                      key={grp.key}
                      style={{ width: grp.span * gridSpec.colWidth }}
                      className="h-full flex items-center justify-center text-[12px] font-medium text-[#475569] border-r border-[#F1F5F9] shrink-0"
                    >
                      {grp.label}
                    </div>
                  ))}

                  {/* Today Pill Badge at Top of Current Date Column */}
                  {isTodayInView && (
                    <div
                      data-testid="timeline-today-badge"
                      style={{
                        left: todayColIndex * gridSpec.colWidth + gridSpec.colWidth / 2,
                      }}
                      className="absolute top-[5px] -translate-x-1/2 z-40 flex flex-col items-center pointer-events-none"
                    >
                      <div className="px-2.5 py-0.5 rounded-[5px] bg-[#2D3748] text-white text-[11.5px] font-semibold leading-tight shadow-xs whitespace-nowrap">
                        Today
                      </div>
                      <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-[#2D3748]" />
                    </div>
                  )}
                </div>

                {/* Bottom Day/Date Header Row (27 28 29 30 31 1 2 3 ...) */}
                <div className="flex h-[34px] items-center relative">
                  {gridSpec.days.map((d, idx) => {
                    const isToday = idx === todayColIndex;
                    const isMonthStart = d.getDate() === 1;
                    const showLabel =
                      scale === 'months'
                        ? d.getDate() === 1 || d.getDate() === 8 || d.getDate() === 15 || d.getDate() === 22
                        : true;
                    return (
                      <div
                        key={idx}
                        style={{ width: gridSpec.colWidth }}
                        className={`h-full flex flex-col items-center justify-center text-[12.5px] shrink-0 border-r border-[#F1F5F9] relative ${
                          isToday
                            ? 'font-bold text-[#0F172A]'
                            : isMonthStart
                            ? 'font-semibold text-[#1E293B]'
                            : 'font-medium text-[#475569]'
                        }`}
                      >
                        {showLabel && (
                          <span>
                            {scale === 'days'
                              ? `${DAY_SHORT[d.getDay()]} ${d.getDate()}`
                              : d.getDate()}
                          </span>
                        )}
                        {idx < 5 && (
                          <span className="absolute bottom-0 inset-x-0 h-[2px] bg-[#A3E635]" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ==================== TIMELINE BODY (Sticky Left Record Cells + Right Calendar Bar Canvas) ==================== */}
            <div className="relative min-h-[380px]">
              {/* Background Vertical Day Columns in the Calendar Section */}
              <div
                className="absolute top-0 bottom-0 flex pointer-events-none z-0"
                style={{ left: stickyLeftOffsets.totalLeftWidth, width: totalCalendarWidth }}
              >
                {gridSpec.days.map((d, idx) => {
                  const wk = getISOWeekInfo(d).week;
                  const isEvenWeek = wk % 2 === 0;
                  return (
                    <div
                      key={idx}
                      style={{ width: gridSpec.colWidth }}
                      className={`h-full shrink-0 border-r border-[#F1F5F9] ${
                        isEvenWeek ? 'bg-[#FAFDF7]/70' : 'bg-white'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Vertical Red "Today" Marker Line */}
              {isTodayInView && (
                <div
                  data-testid="timeline-today-line"
                  style={{
                    left:
                      stickyLeftOffsets.totalLeftWidth +
                      todayColIndex * gridSpec.colWidth +
                      gridSpec.colWidth / 2,
                  }}
                  className="absolute top-0 bottom-0 w-[1.5px] bg-[#EF4444] z-20 pointer-events-none"
                />
              )}

              {/* Empty State if no records match */}
              {timelineItems.length === 0 && (
                <div className="relative z-10 py-16 text-center">
                  <div className="inline-flex flex-col items-center gap-2 text-[#64748B]">
                    <span className="h-11 w-11 rounded-full bg-[#F1F5F9] flex items-center justify-center">
                      <Inbox size={20} className="text-[#94A3B8]" />
                    </span>
                    <span className="text-[14px] font-semibold text-[#0F172A]">
                      No records match the current filters
                    </span>
                    <span className="text-[12.5px]">
                      Try clearing your search, sidebar filters, or color filter.
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      {colorFilter !== 'all' && (
                        <button
                          type="button"
                          onClick={() => setColorFilter('all')}
                          className="btn-secondary h-8 text-[12px]"
                        >
                          Clear Color Filter
                        </button>
                      )}
                      {emptyResetAction && (
                        <button
                          type="button"
                          onClick={emptyResetAction}
                          className="btn-primary h-8 text-[12px]"
                        >
                          Reset All Filters
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Notice banner if records exist but none fall in the currently scrolled date window */}
              {timelineItems.length > 0 && overlappingItemsCount === 0 && (
                <div className="sticky left-4 z-20 mx-4 my-2 px-4 py-2 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] inline-flex items-center gap-3 text-[12.5px] text-[#1E3A8A]">
                  <span>
                    Showing <strong>{gridSpec.rangeTitle}</strong>. Your {timelineItems.length} filtered{' '}
                    {moduleType} fall in other date ranges.
                  </span>
                  <button
                    type="button"
                    onClick={handleFitToRecords}
                    data-testid="timeline-jump-to-records-btn"
                    className="px-3 py-1 rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-[12px] shrink-0 cursor-pointer"
                  >
                    Jump to Records
                  </button>
                </div>
              )}

              {/* Grouped or Ungrouped Record Rows */}
              <div className="relative z-10 divide-y divide-[#F1F5F9]">
                {groupedSections.map((group) => {
                  const isCollapsed = collapsedGroups.has(group.key);
                  const groupPalette = paletteByCategory[group.label] || TIMELINE_PASTEL_PALETTE[0];

                  return (
                    <div key={group.key}>
                      {/* Group Header Row when Group By is active */}
                      {groupBy !== 'none' && (
                        <div className="flex items-center h-[36px] bg-[#F8FAFC] border-y border-[#E2E8F0]">
                          <div
                            className="sticky left-0 z-20 px-3 h-full flex items-center bg-[#F8FAFC] border-r-2 border-[#CBD5E1]"
                            style={{ width: stickyLeftOffsets.totalLeftWidth }}
                          >
                            <button
                              type="button"
                              onClick={() => toggleGroupCollapse(group.key)}
                              data-testid={`timeline-group-header-${group.key}`}
                              className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#0F172A] hover:text-[#2563EB] cursor-pointer truncate"
                            >
                              <ChevronDown
                                size={15}
                                className={`text-[#64748B] shrink-0 transition-transform ${
                                  isCollapsed ? '-rotate-90' : ''
                                }`}
                              />
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: groupPalette.dot }}
                              />
                              <span className="truncate">{group.label}</span>
                              <span className="text-[12px] font-normal text-[#64748B] shrink-0">
                                ({group.items.length})
                              </span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Record Rows inside Group */}
                      {!isCollapsed &&
                        group.items.map((item) => {
                          const startOffsetDays = diffDays(windowStart, item.startDate);
                          const endOffsetDays = diffDays(windowStart, item.endDate);

                          const isCompletelyBefore = endOffsetDays < 0;
                          const isCompletelyAfter = startOffsetDays >= gridSpec.totalDays;

                          let visibleStartCol = Math.max(0, startOffsetDays);
                          let visibleEndCol = Math.min(gridSpec.totalDays - 1, endOffsetDays);

                          if (isCompletelyBefore) {
                            visibleStartCol = 0;
                            visibleEndCol = Math.min(3, gridSpec.totalDays - 1);
                          } else if (isCompletelyAfter) {
                            visibleStartCol = Math.max(0, gridSpec.totalDays - 5);
                            visibleEndCol = gridSpec.totalDays - 1;
                          }

                          const spanCols = Math.max(1, visibleEndCol - visibleStartCol + 1);
                          const barLeft = visibleStartCol * gridSpec.colWidth + 6;
                          const rawWidth = spanCols * gridSpec.colWidth - 12;
                          const minBarWidth = Math.min(250, totalCalendarWidth - barLeft - 8);
                          const barWidth = Math.max(minBarWidth, rawWidth);

                          return (
                            <div
                              key={item.id}
                              data-testid={`timeline-row-${item.id}`}
                              className="group/row flex items-center h-[44px] hover:bg-[#F8FAFC]/80 transition-colors"
                            >
                              {/* Sticky Left Record Metadata Cells */}
                              <div
                                className="sticky left-0 z-20 h-full flex items-center bg-white group-hover/row:bg-[#F8FAFF] border-r-2 border-[#CBD5E1] shrink-0 shadow-[2px_0_5px_rgba(15,23,42,0.03)]"
                                style={{ width: stickyLeftOffsets.totalLeftWidth }}
                              >
                                {visibleLeftColumns.map((col) => {
                                  const w =
                                    leftColumnsCompact && col.required
                                      ? 155
                                      : columnWidths[col.key] || col.defaultWidth || 150;
                                  return (
                                    <div
                                      key={col.key}
                                      style={{ width: w, minWidth: w, maxWidth: w }}
                                      className="h-full px-2.5 flex items-center border-r border-[#EEF2F7] text-[12.5px] truncate"
                                    >
                                      {col.render ? col.render(item) : item.rec[col.key] || '—'}
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Right Horizontal Calendar Lane with Positioned Record Bar */}
                              <div
                                className="relative h-full flex items-center shrink-0"
                                style={{ width: totalCalendarWidth }}
                              >
                                <button
                                  type="button"
                                  data-testid={`timeline-bar-${item.id}`}
                                  onClick={() => onOpenDetail && onOpenDetail(item.id)}
                                  onMouseEnter={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setHoveredBar({ item, rect });
                                  }}
                                  onMouseLeave={() => setHoveredBar(null)}
                                  style={{
                                    left: `${barLeft}px`,
                                    width: `${barWidth}px`,
                                    backgroundColor: item.palette.bg,
                                    borderColor: item.palette.border,
                                    color: item.palette.text,
                                  }}
                                  className={`absolute h-[34px] px-4 rounded-full border flex items-center gap-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)] hover:brightness-97 hover:shadow-md transition-all cursor-pointer overflow-hidden ${
                                    isCompletelyBefore || isCompletelyAfter
                                      ? 'opacity-75 border-dashed'
                                      : ''
                                  }`}
                                >
                                  {startOffsetDays < 0 && (
                                    <span className="text-[11px] font-bold text-[#475569] shrink-0">
                                      ←
                                    </span>
                                  )}

                                  <span className="text-[13px] font-medium text-[#1E293B] truncate">
                                    {item.name}
                                  </span>

                                  {settings.showCategoryOnBar && (
                                    <span className="px-2 py-0.2 rounded-full bg-white/75 text-[11px] font-medium text-[#334155] shrink-0">
                                      {item.category}
                                    </span>
                                  )}

                                  {settings.showDateRangeOnBar && (
                                    <span className="text-[11px] text-[#475569] font-normal whitespace-nowrap shrink-0">
                                      ({fmtDate(item.startISO)} – {fmtDate(item.endISO)})
                                    </span>
                                  )}

                                  {settings.showAvatar && (
                                    <span className="shrink-0 inline-flex items-center gap-1">
                                      <UserAvatar userId={item.ownerId} size={23} />
                                      {settings.showOwnerNameOnBar && (
                                        <span className="text-[11.5px] text-[#334155] font-normal">
                                          {item.ownerName}
                                        </span>
                                      )}
                                    </span>
                                  )}

                                  {endOffsetDays >= gridSpec.totalDays && (
                                    <span className="text-[11px] font-bold text-[#475569] ml-auto shrink-0">
                                      →
                                    </span>
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Bottom Color Legend & Instructions Bar */}
        <div className="px-4 py-2.5 border-t border-[#E6ECF5] bg-[#FAFBFD] flex flex-wrap items-center justify-between gap-3 text-[12px] text-[#475569]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-[#334155]">
              Color Legend ({colorByOptions.find((c) => c.key === settings.colorBy)?.label}):
            </span>
            {colorCategories.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColorFilter((prev) => (prev === c.value ? 'all' : c.value))}
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                  colorFilter === c.value
                    ? 'border-[#2563EB] bg-[#EFF6FF] font-semibold text-[#1D4ED8]'
                    : 'border-transparent hover:bg-[#F1F5F9] text-[#334155]'
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full border"
                  style={{ backgroundColor: c.palette.bg, borderColor: c.palette.dot }}
                />
                <span>{c.value}</span>
                <span className="text-[#94A3B8]">({c.count})</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-[11.5px] text-[#64748B]">
            <span>
              Drag column headers to reorder · Drag edges to resize · Click any bar to view details
            </span>
          </div>
        </div>
      </div>

      {/* 5. Floating Hover Tooltip for Record Bar */}
      {hoveredBar && (
        <div
          data-testid="timeline-bar-tooltip"
          style={{
            position: 'fixed',
            left: Math.min(window.innerWidth - 310, Math.max(16, hoveredBar.rect.left + 12)),
            top: Math.max(16, hoveredBar.rect.top - 148),
          }}
          className="z-50 w-[295px] bg-[#0F172A] text-white rounded-xl p-3.5 shadow-2xl border border-[#334155] pointer-events-none text-[12px] space-y-2"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="font-bold text-[13.5px] text-white leading-snug truncate">
              {hoveredBar.item.name}
            </div>
            <span
              className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold shrink-0"
              style={{
                backgroundColor: hoveredBar.item.palette.bg,
                color: '#0F172A',
              }}
            >
              {hoveredBar.item.category}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-white/10 text-[11.5px]">
            <div>
              <div className="text-[#94A3B8] text-[10.5px]">{hoveredBar.item.startLabel}</div>
              <div className="font-semibold text-white">{fmtDate(hoveredBar.item.startISO)}</div>
            </div>
            <div>
              <div className="text-[#94A3B8] text-[10.5px]">{hoveredBar.item.endLabel}</div>
              <div className="font-semibold text-white">{fmtDate(hoveredBar.item.endISO)}</div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[11.5px]">
            <span className="text-[#CBD5E1]">
              Owner: <strong className="text-white">{hoveredBar.item.ownerName}</strong>
            </span>
            <span className="text-[#93C5FD] font-medium">
              {hoveredBar.item.durationDays} day{hoveredBar.item.durationDays > 1 ? 's' : ''}
            </span>
          </div>

          {moduleType === 'contacts' ? (
            <div className="text-[11px] text-[#94A3B8] truncate">
              {accountName ? accountName(hoveredBar.item.rec.accountId) : ''} ·{' '}
              {hoveredBar.item.rec.email || hoveredBar.item.rec.phone || ''}
            </div>
          ) : (
            <div className="text-[11px] text-[#94A3B8] truncate">
              {hoveredBar.item.rec.industry || 'Enterprise'} ·{' '}
              {fmtINR(hoveredBar.item.rec.annualRevenue || 0)}
            </div>
          )}
        </div>
      )}

      {/* 6. Timeline Settings Modal (Date Fields, Visible Bar Fields, Color Grouping) */}
      {settingsOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-4"
          onClick={() => setSettingsOpen(false)}
        >
          <div
            data-testid="timeline-settings-modal"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-xl border border-[#DCE3EE] shadow-2xl overflow-hidden"
          >
            <div className="px-5 py-3.5 border-b border-[#E6ECF5] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings size={17} className="text-[#2563EB]" />
                <h3 className="text-[15px] font-bold text-[#0F172A]">Timeline View Settings</h3>
              </div>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                aria-label="Close timeline settings"
                className="p-1 rounded-md text-[#64748B] hover:bg-[#F1F5F9]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-[13px] text-[#334155]">
              {/* Date Range Mapping Preset */}
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#64748B] mb-1.5">
                  Date Range Mapping
                </label>
                <select
                  data-testid="timeline-settings-date-preset"
                  value={settings.datePreset}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, datePreset: e.target.value }))
                  }
                  className="w-full h-9 px-3 rounded-lg border border-[#CBD5E1] bg-white text-[13px] font-medium text-[#0F172A]"
                >
                  {moduleType === 'contacts' ? (
                    <>
                      <option value="engagementWindow">
                        Activity &amp; Touchpoint Window (Last Contacted ↔ Follow-Up)
                      </option>
                      <option value="lastContactedToFollowUp">
                        Last Contacted → Follow-Up Date
                      </option>
                      <option value="createdToLastContacted">
                        Created Time → Last Contacted
                      </option>
                      <option value="custom">Custom Start &amp; End Date Fields</option>
                    </>
                  ) : (
                    <>
                      <option value="engagementWindow">
                        Account Activity &amp; Deal Window (Active Touchpoints)
                      </option>
                      <option value="createdToLastActivity">
                        Created Time → Last Activity Time
                      </option>
                      <option value="dealWindow">
                        Earliest Deal Created → Latest Deal Closing Date
                      </option>
                      <option value="custom">Custom Start &amp; End Date Fields</option>
                    </>
                  )}
                </select>
              </div>

              {/* Custom Start & End Date Field Selectors */}
              {settings.datePreset === 'custom' && (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                  <div>
                    <label className="block text-[11.5px] font-semibold text-[#475569] mb-1">
                      Start Date Field
                    </label>
                    <select
                      data-testid="timeline-settings-start-field"
                      value={settings.startDateField}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, startDateField: e.target.value }))
                      }
                      className="w-full h-8 px-2 rounded border border-[#CBD5E1] bg-white text-[12.5px]"
                    >
                      {dateFieldOptions.map((d) => (
                        <option key={d.key} value={d.key}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-semibold text-[#475569] mb-1">
                      End Date Field
                    </label>
                    <select
                      data-testid="timeline-settings-end-field"
                      value={settings.endDateField}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, endDateField: e.target.value }))
                      }
                      className="w-full h-8 px-2 rounded border border-[#CBD5E1] bg-white text-[12.5px]"
                    >
                      {dateFieldOptions.map((d) => (
                        <option key={d.key} value={d.key}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Color Grouping Field */}
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#64748B] mb-1.5">
                  Color Record Bars By
                </label>
                <select
                  data-testid="timeline-settings-color-by"
                  value={settings.colorBy}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, colorBy: e.target.value }))
                  }
                  className="w-full h-9 px-3 rounded-lg border border-[#CBD5E1] bg-white text-[13px] font-medium text-[#0F172A]"
                >
                  {colorByOptions.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Visible Bar Fields */}
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#64748B] mb-2">
                  Visible Fields on Record Bars
                </label>
                <div className="space-y-2 bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                  <label className="flex items-center gap-2.5 cursor-pointer text-[13px]">
                    <input
                      type="checkbox"
                      className="cb"
                      checked={settings.showAvatar}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, showAvatar: e.target.checked }))
                      }
                    />
                    <span>Show Owner Avatar Badge</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer text-[13px]">
                    <input
                      type="checkbox"
                      className="cb"
                      checked={settings.showOwnerNameOnBar}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, showOwnerNameOnBar: e.target.checked }))
                      }
                    />
                    <span>Show Owner Name Text</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer text-[13px]">
                    <input
                      type="checkbox"
                      className="cb"
                      checked={settings.showCategoryOnBar}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, showCategoryOnBar: e.target.checked }))
                      }
                    />
                    <span>Show Status / Category Pill</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer text-[13px]">
                    <input
                      type="checkbox"
                      className="cb"
                      checked={settings.showDateRangeOnBar}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, showDateRangeOnBar: e.target.checked }))
                      }
                    />
                    <span>Show Start – End Date Range Label</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-[#E6ECF5] bg-[#FAFBFD] flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setSettings(defaultSettings);
                  resetColumns();
                }}
                className="text-[12.5px] font-medium text-[#64748B] hover:text-[#0F172A] inline-flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Reset Defaults</span>
              </button>
              <button
                type="button"
                data-testid="timeline-settings-done-btn"
                onClick={() => setSettingsOpen(false)}
                className="h-8 px-4 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13px] font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
