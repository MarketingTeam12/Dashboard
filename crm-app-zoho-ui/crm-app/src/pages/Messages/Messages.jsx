import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpDown,
  Bell,
  Briefcase,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Filter,
  Image as ImageIcon,
  Info,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Phone,
  Plus,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Star,
  Tag,
  User,
  Users,
  Video,
  X,
} from 'lucide-react';
import { useCRM } from '../../context/crmContextInstance';
import Modal from '../../components/common/Modal';
import {
  MESSAGE_TIME_OPERATORS,
  NO_VALUE_DATE_OPERATORS,
  RELATIVE_UNIT_DATE_OPERATORS,
  RECORD_OWNER_OPERATORS,
  USER_ROLES,
  USER_GROUPS,
  evaluateDateOperator,
  getFiscalYearStartMonth,
  setFiscalYearStartMonth,
} from '../Leads/leadFilters';
import { fmtINR, todayISO, addDays } from '../../utils/calculations';
import { STAGES, STAGE_PROBABILITY } from '../../utils/calculations';

const MESSAGE_VIEWS = [
  'My Not Replied Messages',
  'Not Replied Messages',
  'My Replied Messages',
  'Replied Messages',
  'My Messages',
  'All Messages',
  'Unread Messages',
  'Starred Messages',
];

const LOGGED_IN_USER_ID = 'u1'; // Sibi Chakaravarthi

const FISCAL_MONTHS = [
  { value: 0, label: 'January' },
  { value: 3, label: 'April (India Standard)' },
  { value: 6, label: 'July' },
  { value: 9, label: 'October' },
];

function createDefaultDateFilterState(defaultOp = 'Today') {
  return {
    checked: false,
    operator: defaultOp,
    value: '',
    valueTo: '',
    unit: 'days',
  };
}

function createDefaultOwnerFilterState() {
  return {
    checked: false,
    operator: 'is',
    userIds: [],
    includeLoggedInUser: false,
    roles: [],
    groups: [],
  };
}

function createDefaultDraftState() {
  return {
    notReplied: createDefaultDateFilterState('Today'),
    replied: createDefaultDateFilterState('Today'),
    messageTime: createDefaultDateFilterState('Today'),
    notifications: {
      checked: false,
      operator: 'is',
      value: 'Selected',
    },
    recordOwner: createDefaultOwnerFilterState(),
    repliedBy: createDefaultOwnerFilterState(),
  };
}

function formatMessageDisplayDate(isoDate, timeStr) {
  if (!isoDate) return timeStr || '';
  const today = todayISO();
  if (isoDate === today) {
    return timeStr ? `Today, ${timeStr}` : 'Today';
  }
  const d = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return `${isoDate} ${timeStr || ''}`.trim();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()}${timeStr ? ` • ${timeStr}` : ''}`;
}

function getInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'C';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

const AVATAR_PALETTE = [
  'bg-[#E0E7FF] text-[#3730A3]',
  'bg-[#DBEAFE] text-[#1E40AF]',
  'bg-[#FCE7F3] text-[#9D174D]',
  'bg-[#D1FAE5] text-[#065F46]',
  'bg-[#FEF3C7] text-[#92400E]',
  'bg-[#EDE9FE] text-[#5B21B6]',
  'bg-[#CCFBF1] text-[#115E59]',
];

function getAvatarTone(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

function triggerFileDownload(attachment) {
  if (!attachment) return;
  const filename = attachment.name || 'attachment.txt';
  if (attachment.previewUrl && attachment.type === 'image') {
    const a = document.createElement('a');
    a.href = attachment.previewUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }
  const content =
    attachment.content ||
    `Zoho CRM Attachment Export\nFile Name: ${filename}\nSize: ${attachment.size || '240 KB'}\nExported At: ${new Date().toLocaleString()}\n`;
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Reusable Zoho CRM 29-option Date Filter Input Block
 * Used for:
 *  - System Defined Filter: Not Replied Messages
 *  - System Defined Filter: Replied Messages
 *  - Filter By Fields: Message Time
 */
function DateOperatorFilterBlock({ state, onChange, fiscalMonth, onFiscalMonthChange }) {
  const op = state.operator || 'Today';
  const isRelativeUnit = RELATIVE_UNIT_DATE_OPERATORS.has(op); // age in, due in, Previous, Next
  const isSingleDate = op === 'On' || op === 'before' || op === 'after';
  const isBetween = op === 'between' || op === 'not between';
  const isFiscalOp = op.includes('FY') || op.includes('FQ');
  const isNoValue = NO_VALUE_DATE_OPERATORS.has(op);

  return (
    <div className="mt-2 pl-5 space-y-2">
      <select
        value={op}
        onChange={(e) =>
          onChange({
            ...state,
            operator: e.target.value,
            value: '',
            valueTo: '',
            unit: state.unit || 'days',
          })
        }
        className="w-full h-8 px-2.5 text-[13.5px] bg-white border border-[#CBD5E1] rounded text-[#1E293B] focus:outline-none focus:border-[#2563EB]"
      >
        {MESSAGE_TIME_OPERATORS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      {!isNoValue && isRelativeUnit && (
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min="0"
            placeholder="Value"
            value={state.value}
            onChange={(e) => onChange({ ...state, value: e.target.value })}
            className="w-[84px] h-8 px-2.5 text-[13.5px] bg-white border border-[#CBD5E1] rounded text-[#1E293B] focus:outline-none focus:border-[#2563EB]"
          />
          <select
            value={state.unit || 'days'}
            onChange={(e) => onChange({ ...state, unit: e.target.value })}
            className="flex-1 h-8 px-2 text-[13.5px] bg-white border border-[#CBD5E1] rounded text-[#1E293B] focus:outline-none focus:border-[#2563EB]"
          >
            <option value="days">days</option>
            <option value="weeks">weeks</option>
            <option value="months">months</option>
            <option value="years">years</option>
          </select>
        </div>
      )}

      {!isNoValue && isSingleDate && (
        <input
          type="date"
          value={state.value}
          onChange={(e) => onChange({ ...state, value: e.target.value })}
          className="w-full h-8 px-2.5 text-[13.5px] bg-white border border-[#CBD5E1] rounded text-[#1E293B] focus:outline-none focus:border-[#2563EB]"
        />
      )}

      {!isNoValue && isBetween && (
        <div className="space-y-1.5">
          <div>
            <span className="text-[12px] text-[#64748B] block mb-0.5">From</span>
            <input
              type="date"
              value={state.value}
              onChange={(e) => onChange({ ...state, value: e.target.value })}
              className="w-full h-8 px-2.5 text-[13.5px] bg-white border border-[#CBD5E1] rounded text-[#1E293B] focus:outline-none focus:border-[#2563EB]"
            />
          </div>
          <div>
            <span className="text-[12px] text-[#64748B] block mb-0.5">To</span>
            <input
              type="date"
              value={state.valueTo || ''}
              onChange={(e) => onChange({ ...state, valueTo: e.target.value })}
              className="w-full h-8 px-2.5 text-[13.5px] bg-white border border-[#CBD5E1] rounded text-[#1E293B] focus:outline-none focus:border-[#2563EB]"
            />
          </div>
        </div>
      )}

      {isFiscalOp && onFiscalMonthChange && (
        <div className="pt-1 border-t border-[#E2E8F0]">
          <label className="text-[11.5px] text-[#64748B] block mb-1">Fiscal Year Starts In</label>
          <select
            value={fiscalMonth}
            onChange={(e) => onFiscalMonthChange(Number(e.target.value))}
            className="w-full h-7 px-2 text-[12.5px] bg-[#F8FAFC] border border-[#CBD5E1] rounded text-[#334155]"
          >
            {FISCAL_MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

/**
 * Reusable Zoho CRM Record Owner / Replied By Filter Block (Screenshots 5 & 6)
 */
function UserLookupFilterBlock({ label, state, onChange, users }) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [userTypeFilter, setUserTypeFilter] = useState('Active users');
  const [userSearch, setUserSearch] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setPopoverOpen(false);
      }
    };
    if (popoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [popoverOpen]);

  const op = state.operator || 'is';
  const isUserSelectOp = op === 'is' || op === 'is not';
  const isRoleOp = op === 'belongs to Role' || op === 'does not belong to Role';
  const isGroupOp = op === 'belongs to Group';

  const loggedInUser = useMemo(
    () => users.find((u) => u.id === LOGGED_IN_USER_ID) || users[0] || { id: 'u1', name: 'Sibi Chakaravarthi', email: 'sibi@crm.in', status: 'Active' },
    [users]
  );

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return users.filter((u) => {
      if (userTypeFilter === 'Active users' && u.status === 'Inactive') return false;
      if (userTypeFilter === 'Inactive users' && u.status !== 'Inactive') return false;
      if (!q) return true;
      return (
        String(u.name || '').toLowerCase().includes(q) ||
        String(u.email || '').toLowerCase().includes(q) ||
        String(u.role || '').toLowerCase().includes(q)
      );
    });
  }, [users, userTypeFilter, userSearch]);

  const toggleUserId = (id) => {
    const exists = state.userIds.includes(id);
    const nextIds = exists ? state.userIds.filter((x) => x !== id) : [...state.userIds, id];
    onChange({ ...state, userIds: nextIds });
  };

  const toggleRole = (role) => {
    const exists = state.roles.includes(role);
    const nextRoles = exists ? state.roles.filter((r) => r !== role) : [...state.roles, role];
    onChange({ ...state, roles: nextRoles });
  };

  const toggleGroup = (grp) => {
    const exists = state.groups.includes(grp);
    const nextGroups = exists ? state.groups.filter((g) => g !== grp) : [...state.groups, grp];
    onChange({ ...state, groups: nextGroups });
  };

  const selectedChips = [];
  if (state.includeLoggedInUser) {
    selectedChips.push({ key: '__logged_in__', label: 'Logged in User', onRemove: () => onChange({ ...state, includeLoggedInUser: false }) });
  }
  state.userIds.forEach((uid) => {
    const u = users.find((x) => x.id === uid);
    if (u) {
      selectedChips.push({
        key: uid,
        label: u.name,
        onRemove: () => toggleUserId(uid),
      });
    }
  });

  return (
    <div className="mt-2 pl-5 space-y-2 relative" ref={containerRef}>
      {/* Operator Dropdown */}
      <select
        value={op}
        onChange={(e) =>
          onChange({
            ...state,
            operator: e.target.value,
          })
        }
        className="w-full h-8 px-2.5 text-[13.5px] bg-white border border-[#CBD5E1] rounded text-[#1E293B] focus:outline-none focus:border-[#2563EB]"
      >
        {RECORD_OWNER_OPERATORS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      {/* User Selector Input & Popover */}
      {isUserSelectOp && (
        <div>
          <div
            onClick={() => setPopoverOpen(true)}
            className="min-h-[34px] px-2 py-1 bg-white border border-[#CBD5E1] hover:border-[#2563EB] rounded cursor-pointer flex flex-wrap items-center gap-1"
          >
            {selectedChips.length === 0 ? (
              <span className="text-[13px] text-[#94A3B8] select-none">Select {label}...</span>
            ) : (
              selectedChips.map((chip) => (
                <span
                  key={chip.key}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] text-[12px] font-medium"
                >
                  <span className="truncate max-w-[130px]">{chip.label}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      chip.onRemove();
                    }}
                    className="hover:text-[#1E3A8A]"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))
            )}
          </div>

          {popoverOpen && (
            <div className="mt-1 w-full bg-white border border-[#CBD5E1] rounded-lg shadow-xl z-40 overflow-hidden">
              {/* Top Active Users Dropdown & Search Users */}
              <div className="p-2 bg-[#F8FAFC] border-b border-[#E2E8F0] space-y-1.5">
                <select
                  value={userTypeFilter}
                  onChange={(e) => setUserTypeFilter(e.target.value)}
                  className="w-full h-7 px-2 text-[12.5px] font-medium bg-white border border-[#CBD5E1] rounded text-[#1E293B] focus:outline-none focus:border-[#2563EB]"
                >
                  <option value="Active users">Active users</option>
                  <option value="All users">All users</option>
                  <option value="Inactive users">Inactive users</option>
                </select>
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-2 text-[#94A3B8]" />
                  <input
                    type="text"
                    placeholder="Search Users"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full h-7 pl-7 pr-6 text-[12.5px] bg-white border border-[#CBD5E1] rounded text-[#1E293B] focus:outline-none focus:border-[#2563EB]"
                  />
                  {userSearch && (
                    <button
                      type="button"
                      onClick={() => setUserSearch('')}
                      className="absolute right-2 top-2 text-[#94A3B8] hover:text-[#475569]"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable User List */}
              <div className="max-h-[210px] overflow-y-auto divide-y divide-[#F1F5F9]">
                {/* Logged in User row (Screenshot 6) */}
                {(!userSearch.trim() || 'logged in user'.includes(userSearch.trim().toLowerCase()) || loggedInUser.name.toLowerCase().includes(userSearch.trim().toLowerCase())) && (
                  <label className="flex items-center gap-2.5 px-2.5 py-2 hover:bg-[#F1F5F9] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={state.includeLoggedInUser}
                      onChange={(e) => onChange({ ...state, includeLoggedInUser: e.target.checked })}
                      className="w-3.5 h-3.5 rounded text-[#2563EB] focus:ring-[#2563EB]"
                    />
                    <div className="w-7 h-7 rounded-full bg-[#DBEAFE] text-[#1D4ED8] flex items-center justify-center text-[11px] font-bold shrink-0">
                      {getInitials(loggedInUser.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-[#1E293B] truncate">Logged in User</div>
                      <div className="text-[11.5px] text-[#64748B] truncate">{loggedInUser.name} • {loggedInUser.email}</div>
                    </div>
                  </label>
                )}

                {filteredUsers.map((u) => {
                  const checked = state.userIds.includes(u.id);
                  return (
                    <label
                      key={u.id}
                      className="flex items-center gap-2.5 px-2.5 py-2 hover:bg-[#F1F5F9] cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleUserId(u.id)}
                        className="w-3.5 h-3.5 rounded text-[#2563EB] focus:ring-[#2563EB]"
                      />
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${getAvatarTone(u.name)}`}>
                        {getInitials(u.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-medium text-[#1E293B] truncate">{u.name}</div>
                        <div className="text-[11.5px] text-[#64748B] truncate">{u.email}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Role Selector */}
      {isRoleOp && (
        <div className="bg-white border border-[#CBD5E1] rounded p-2 space-y-1 max-h-[160px] overflow-y-auto">
          {USER_ROLES.map((role) => (
            <label key={role} className="flex items-center gap-2 text-[13px] text-[#1E293B] py-1 px-1 hover:bg-[#F8FAFC] rounded cursor-pointer">
              <input
                type="checkbox"
                checked={state.roles.includes(role)}
                onChange={() => toggleRole(role)}
                className="w-3.5 h-3.5 rounded text-[#2563EB]"
              />
              <span>{role}</span>
            </label>
          ))}
        </div>
      )}

      {/* Group Selector */}
      {isGroupOp && (
        <div className="bg-white border border-[#CBD5E1] rounded p-2 space-y-1 max-h-[160px] overflow-y-auto">
          {USER_GROUPS.map((grp) => (
            <label key={grp} className="flex items-center gap-2 text-[13px] text-[#1E293B] py-1 px-1 hover:bg-[#F8FAFC] rounded cursor-pointer">
              <input
                type="checkbox"
                checked={state.groups.includes(grp)}
                onChange={() => toggleGroup(grp)}
                className="w-3.5 h-3.5 rounded text-[#2563EB]"
              />
              <span>{grp}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function evaluateUserLookupCriterion(recordUserId, recordUserName, cfg, users) {
  if (!cfg?.checked) return true;
  const op = cfg.operator || 'is';
  if (op === 'is empty') return !recordUserId && !recordUserName;
  if (op === 'is not empty') return Boolean(recordUserId || recordUserName);

  const userObj =
    users.find((u) => u.id === recordUserId) ||
    users.find((u) => String(u.name || '').toLowerCase() === String(recordUserName || '').toLowerCase()) ||
    null;

  if (op === 'belongs to Role' || op === 'does not belong to Role') {
    if (!cfg.roles || cfg.roles.length === 0) return true;
    const roleMatch = userObj && cfg.roles.some((r) => String(userObj.role || '').toLowerCase() === r.toLowerCase());
    return op === 'belongs to Role' ? Boolean(roleMatch) : !roleMatch;
  }

  if (op === 'belongs to Group') {
    if (!cfg.groups || cfg.groups.length === 0) return true;
    return Boolean(userObj && cfg.groups.some((g) => String(userObj.group || '').toLowerCase() === g.toLowerCase()));
  }

  // 'is' or 'is not'
  const targetIds = new Set(cfg.userIds || []);
  if (cfg.includeLoggedInUser) targetIds.add(LOGGED_IN_USER_ID);
  if (targetIds.size === 0) return true;

  const matched =
    (recordUserId && targetIds.has(recordUserId)) ||
    (userObj && targetIds.has(userObj.id));
  return op === 'is' ? Boolean(matched) : !matched;
}

export default function Messages() {
  const crm = useCRM();
  const navigate = useNavigate();
  const {
    messages = [],
    leads = [],
    contacts = [],
    deals = [],
    accounts = [],
    tasks = [],
    calls = [],
    users = [],
    sendMessage,
    replyMessage,
    markMessageRead,
    createRecord,
    updateRecord,
    createTask,
    notify,
  } = crm;

  // Main View & Sort state (Default view: My Not Replied Messages per Screenshot 1)
  const [selectedView, setSelectedView] = useState('My Not Replied Messages');
  const [sortBy, setSortBy] = useState('Message Time');
  const [sortOrder, setSortOrder] = useState('Desc'); // 'Asc' | 'Desc'
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter Panel state
  const [filterSearch, setFilterSearch] = useState('');
  const [sysSectionOpen, setSysSectionOpen] = useState(true);
  const [fieldsSectionOpen, setFieldsSectionOpen] = useState(true);
  const [fiscalMonth, setFiscalMonthState] = useState(getFiscalYearStartMonth);

  const handleFiscalMonthChange = (m) => {
    setFiscalYearStartMonth(m);
    setFiscalMonthState(m);
  };

  // Draft & Applied Filters
  const [draftFilters, setDraftFilters] = useState(createDefaultDraftState);
  const [appliedFilters, setAppliedFilters] = useState(createDefaultDraftState);

  // 3-Column Detail View state + scroll preservation
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const listScrollContainerRef = useRef(null);
  const savedScrollTopRef = useRef(0);

  // Detail View Center & Right Panel states
  const [centerTab, setCenterTab] = useState('Messages'); // 'Messages' | 'Attachments' | 'Notifications'
  const [rightTab, setRightTab] = useState('Info'); // 'Info' | 'Timeline' | 'Conversations'
  const [expandedBubbleIds, setExpandedBubbleIds] = useState({});
  const [moreInfoOpen, setMoreInfoOpen] = useState(false);
  const [sendEmailMenuOpen, setSendEmailMenuOpen] = useState(false);
  const [openActivitiesExpanded, setOpenActivitiesExpanded] = useState({
    Tasks: true,
    Meetings: true,
    Calls: true,
  });

  // Reply Composer state
  const [replyText, setReplyText] = useState('');
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const fileInputRef = useRef(null);

  // Right Panel Modals / Inline Forms
  const [noteText, setNoteText] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isNewDealModalOpen, setIsNewDealModalOpen] = useState(false);
  const [newDealForm, setNewDealForm] = useState({
    name: '',
    amount: '',
    stage: 'Qualification',
    closingDate: addDays(todayISO(), 14),
  });
  const [isAddActivityModalOpen, setIsAddActivityModalOpen] = useState(null); // 'Task' | 'Meeting' | 'Call' | null
  const [activityForm, setActivityForm] = useState({
    subject: '',
    dueDate: todayISO(),
    priority: 'High',
  });
  const [previewImageModal, setPreviewImageModal] = useState(null);

  // Enrich customer messages with linked Contact / Lead record
  const enrichedMessages = useMemo(() => {
    return (messages || [])
      .filter(
        (m) =>
          m.type !== 'Internal Messages' &&
          m.badge !== 'Internal' &&
          m.tag !== 'Internal' &&
          !m.isInternal
      )
      .map((m, idx) => {
        const badgeType = m.badge === 'Contact' || m.tag === 'Contact' || m.relatedModule === 'Contacts' ? 'Contact' : 'Lead';
        const isReplied = Boolean(m.replied === true || (Array.isArray(m.replies) && m.replies.length > 0));
        const isRead = m.read !== undefined ? Boolean(m.read) : m.status !== 'Unread';
        const isStarred = m.starred !== undefined ? Boolean(m.starred) : m.status === 'Starred';
        const senderLower = String(m.sender || '').toLowerCase();

        let linkedContact = null;
        let linkedLead = null;

        if (badgeType === 'Contact') {
          linkedContact =
            contacts.find((c) => c.id === m.relatedRecordId) ||
            contacts.find((c) => String(c.name || '').toLowerCase() === senderLower) ||
            contacts[idx % Math.max(1, contacts.length)] ||
            null;
        } else {
          linkedLead =
            leads.find((l) => l.id === m.relatedRecordId || l.id === m.leadId) ||
            leads.find((l) => String(l.name || '').toLowerCase() === senderLower) ||
            leads[idx % Math.max(1, leads.length)] ||
            null;
        }

        const personRecord = linkedContact || linkedLead;
        const phone =
          personRecord?.phone ||
          personRecord?.mobile ||
          m.whatsappInfo?.receiverNumber ||
          '+91 98401 22334';
        const email =
          personRecord?.email ||
          `${String(m.sender || 'contact').toLowerCase().replace(/[^a-z0-9]/g, '.')}@enterprise.in`;
        const company =
          linkedLead?.company ||
          (linkedContact ? accounts.find((a) => a.id === linkedContact.accountId)?.name : '') ||
          m.subject ||
          'Enterprise Client';

        const thread = Array.isArray(m.thread) && m.thread.length > 0
          ? m.thread
          : [
              {
                id: `${m.id}-init`,
                direction: 'inbound',
                sender: m.sender,
                time: `${m.date || todayISO()}, ${m.time || '10:00 AM'}`,
                text: m.body || m.snippet || '',
              },
            ];

        // Collect all attachments across the conversation thread
        const threadAttachments = [];
        thread.forEach((bubble) => {
          if (bubble.attachment) {
            threadAttachments.push({
              ...bubble.attachment,
              sender: bubble.sender,
              time: bubble.time,
              bubbleId: bubble.id,
            });
          }
        });
        if (m.hasAttachment && m.attachmentFileName && threadAttachments.length === 0) {
          threadAttachments.push({
            name: m.attachmentFileName,
            type: m.attachmentFileName.match(/\.(png|jpg|jpeg|webp)$/i) ? 'image' : 'file',
            size: '320 KB',
            sender: m.sender,
            time: `${m.date || todayISO()}, ${m.time || '10:00 AM'}`,
            bubbleId: `${m.id}-att`,
          });
        }

        const latestBubble = thread[thread.length - 1] || {};
        const latestPreview = m.snippet || latestBubble.text || m.body || '';
        const attachmentName =
          m.attachmentFileName ||
          (threadAttachments.length > 0 ? threadAttachments[threadAttachments.length - 1].name : '');

        return {
          ...m,
          badgeType, // 'Contact' | 'Lead'
          isReplied,
          isRead,
          isStarred,
          linkedContact,
          linkedLead,
          personRecord,
          phone,
          email,
          company,
          thread,
          threadAttachments,
          latestPreview,
          attachmentName,
          ownerId: m.ownerId || personRecord?.ownerId || 'u1',
          repliedById: m.repliedById || (isReplied ? m.ownerId || 'u1' : ''),
          repliedBy: m.repliedBy || (isReplied ? users.find((u) => u.id === (m.repliedById || m.ownerId || 'u1'))?.name || 'Sibi Chakaravarthi' : ''),
          notificationsSelected: m.notificationsSelected !== undefined ? Boolean(m.notificationsSelected) : true,
          whatsappInfo: m.whatsappInfo || {
            businessAccount: 'Zoho CRM WhatsApp Business',
            senderNumber: '+91 44 4813 9900',
            receiverNumber: phone,
            windowOpen: true,
            sessionExpiresIn: '18 hrs 30 mins',
          },
        };
      });
  }, [messages, leads, contacts, accounts, users]);

  // Filter & Sort Messages
  const filteredMessages = useMemo(() => {
    const list = enrichedMessages.filter((m) => {
      // 1. Top View Dropdown Filter
      if (selectedView === 'My Not Replied Messages') {
        if (m.ownerId !== LOGGED_IN_USER_ID || m.isReplied) return false;
      } else if (selectedView === 'Not Replied Messages') {
        if (m.isReplied) return false;
      } else if (selectedView === 'My Replied Messages') {
        if (m.ownerId !== LOGGED_IN_USER_ID || !m.isReplied) return false;
      } else if (selectedView === 'Replied Messages') {
        if (!m.isReplied) return false;
      } else if (selectedView === 'My Messages') {
        if (m.ownerId !== LOGGED_IN_USER_ID) return false;
      } else if (selectedView === 'Unread Messages') {
        if (m.isRead) return false;
      } else if (selectedView === 'Starred Messages') {
        if (!m.isStarred) return false;
      }

      // 2. System Defined Filter: Not Replied Messages
      if (appliedFilters.notReplied.checked) {
        if (m.isReplied) return false;
        const okDate = evaluateDateOperator(
          m.date,
          appliedFilters.notReplied.operator,
          appliedFilters.notReplied.value,
          {
            valueTo: appliedFilters.notReplied.valueTo,
            unit: appliedFilters.notReplied.unit || 'days',
            dueDate: m.dueDate,
            fiscalStartMonth: fiscalMonth,
          }
        );
        if (!okDate) return false;
      }

      // 3. System Defined Filter: Replied Messages
      if (appliedFilters.replied.checked) {
        if (!m.isReplied) return false;
        const targetDate = m.repliedDate || m.date;
        const okDate = evaluateDateOperator(
          targetDate,
          appliedFilters.replied.operator,
          appliedFilters.replied.value,
          {
            valueTo: appliedFilters.replied.valueTo,
            unit: appliedFilters.replied.unit || 'days',
            dueDate: m.dueDate,
            fiscalStartMonth: fiscalMonth,
          }
        );
        if (!okDate) return false;
      }

      // 4. Filter By Fields: Message Time
      if (appliedFilters.messageTime.checked) {
        const okDate = evaluateDateOperator(
          m.date,
          appliedFilters.messageTime.operator,
          appliedFilters.messageTime.value,
          {
            valueTo: appliedFilters.messageTime.valueTo,
            unit: appliedFilters.messageTime.unit || 'days',
            dueDate: m.dueDate,
            fiscalStartMonth: fiscalMonth,
          }
        );
        if (!okDate) return false;
      }

      // 5. Filter By Fields: Notifications (is / is not + Selected / Not Selected)
      if (appliedFilters.notifications.checked) {
        const isSelected = Boolean(m.notificationsSelected);
        const targetSelected = appliedFilters.notifications.value === 'Selected';
        const match =
          appliedFilters.notifications.operator === 'is'
            ? isSelected === targetSelected
            : isSelected !== targetSelected;
        if (!match) return false;
      }

      // 6. Filter By Fields: Record Owner
      if (appliedFilters.recordOwner.checked) {
        const ownerName = users.find((u) => u.id === m.ownerId)?.name || '';
        if (!evaluateUserLookupCriterion(m.ownerId, ownerName, appliedFilters.recordOwner, users)) {
          return false;
        }
      }

      // 7. Filter By Fields: Replied By
      if (appliedFilters.repliedBy.checked) {
        if (!evaluateUserLookupCriterion(m.repliedById, m.repliedBy, appliedFilters.repliedBy, users)) {
          return false;
        }
      }

      return true;
    });

    // Sort by Message Time (Ascending / Descending)
    return [...list].sort((a, b) => {
      const dateCmp = String(a.date || '').localeCompare(String(b.date || ''));
      if (dateCmp !== 0) {
        return sortOrder === 'Desc' ? -dateCmp : dateCmp;
      }
      return String(a.id || '').localeCompare(String(b.id || ''));
    });
  }, [enrichedMessages, selectedView, appliedFilters, fiscalMonth, users, sortOrder]);

  // Pagination
  const totalCount = filteredMessages.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIdx = totalCount === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endIdx = Math.min(totalCount, safePage * pageSize);

  const paginatedMessages = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredMessages.slice(start, start + pageSize);
  }, [filteredMessages, safePage, pageSize]);

  // Currently selected message in 3-Column Detail View
  const activeMessage = useMemo(() => {
    if (!selectedMessageId) return null;
    return enrichedMessages.find((m) => m.id === selectedMessageId) || null;
  }, [enrichedMessages, selectedMessageId]);

  const activeIndexInFiltered = useMemo(() => {
    if (!selectedMessageId) return -1;
    return filteredMessages.findIndex((m) => m.id === selectedMessageId);
  }, [filteredMessages, selectedMessageId]);

  const prevConversation = activeIndexInFiltered > 0 ? filteredMessages[activeIndexInFiltered - 1] : null;
  const nextConversation =
    activeIndexInFiltered >= 0 && activeIndexInFiltered < filteredMessages.length - 1
      ? filteredMessages[activeIndexInFiltered + 1]
      : null;

  // Open a message conversation and preserve list scroll position
  const handleSelectMessage = (msg) => {
    if (listScrollContainerRef.current) {
      savedScrollTopRef.current = listScrollContainerRef.current.scrollTop;
    }
    setSelectedMessageId(msg.id);
    if (!msg.isRead) {
      markMessageRead(msg.id);
    }
  };

  // Back arrow from 3-Column Detail View to Messages List Page
  const handleBackToList = () => {
    setSelectedMessageId(null);
    requestAnimationFrame(() => {
      if (listScrollContainerRef.current) {
        listScrollContainerRef.current.scrollTop = savedScrollTopRef.current;
      }
    });
  };

  // Apply & Clear Filters
  const handleApplyFilters = () => {
    setAppliedFilters(JSON.parse(JSON.stringify(draftFilters)));
    // If user explicitly checked Replied Messages while on My Not Replied Messages view, switch view to All Messages so results show cleanly
    if (draftFilters.replied.checked && !draftFilters.notReplied.checked && selectedView.includes('Not Replied')) {
      setSelectedView('All Messages');
    } else if (draftFilters.notReplied.checked && !draftFilters.replied.checked && selectedView === 'Replied Messages') {
      setSelectedView('Not Replied Messages');
    }
    setPage(1);
  };

  const handleClearFilters = () => {
    const fresh = createDefaultDraftState();
    setDraftFilters(fresh);
    setAppliedFilters(fresh);
    setFilterSearch('');
    setPage(1);
  };

  const hasAnyActiveFilter = useMemo(() => {
    return (
      draftFilters.notReplied.checked ||
      draftFilters.replied.checked ||
      draftFilters.messageTime.checked ||
      draftFilters.notifications.checked ||
      draftFilters.recordOwner.checked ||
      draftFilters.repliedBy.checked ||
      appliedFilters.notReplied.checked ||
      appliedFilters.replied.checked ||
      appliedFilters.messageTime.checked ||
      appliedFilters.notifications.checked ||
      appliedFilters.recordOwner.checked ||
      appliedFilters.repliedBy.checked
    );
  }, [draftFilters, appliedFilters]);

  // Filter search visibility
  const qFilter = filterSearch.trim().toLowerCase();
  const showNotRepliedFilter = !qFilter || 'not replied messages'.includes(qFilter);
  const showRepliedFilter = !qFilter || 'replied messages'.includes(qFilter);
  const showMessageTimeFilter = !qFilter || 'message time'.includes(qFilter);
  const showNotificationsFilter = !qFilter || 'notifications'.includes(qFilter);
  const showRecordOwnerFilter = !qFilter || 'record owner'.includes(qFilter);
  const showRepliedByFilter = !qFilter || 'replied by'.includes(qFilter);

  // Linked CRM Data for Right Panel (Deals, Notes, Open Activities, Timeline, Conversations)
  const linkedDeals = useMemo(() => {
    if (!activeMessage) return [];
    const senderLower = String(activeMessage.sender || '').toLowerCase();
    const companyLower = String(activeMessage.company || '').toLowerCase();
    return deals.filter((d) => {
      if (activeMessage.linkedContact && d.contactId === activeMessage.linkedContact.id) return true;
      if (activeMessage.linkedLead && d.id === activeMessage.linkedLead.convertedDealId) return true;
      if (companyLower && String(d.name || '').toLowerCase().includes(companyLower)) return true;
      if (senderLower && String(d.name || '').toLowerCase().includes(senderLower)) return true;
      return false;
    });
  }, [activeMessage, deals]);

  const linkedNotes = useMemo(() => {
    if (!activeMessage) return [];
    const recNotes = activeMessage.personRecord?.notes || [];
    const msgNotes = activeMessage.notes || [];
    return [...msgNotes, ...recNotes];
  }, [activeMessage]);

  const linkedTasks = useMemo(() => {
    if (!activeMessage) return [];
    const senderLower = String(activeMessage.sender || '').toLowerCase();
    return tasks.filter(
      (t) =>
        (activeMessage.linkedLead && t.leadId === activeMessage.linkedLead.id) ||
        String(t.contactName || '').toLowerCase() === senderLower ||
        String(t.relatedTo || '').toLowerCase() === senderLower
    );
  }, [activeMessage, tasks]);

  const linkedCalls = useMemo(() => {
    if (!activeMessage) return [];
    const senderLower = String(activeMessage.sender || '').toLowerCase();
    return calls.filter(
      (c) =>
        (activeMessage.linkedContact && c.contactId === activeMessage.linkedContact.id) ||
        String(c.contactName || '').toLowerCase() === senderLower
    );
  }, [activeMessage, calls]);

  const linkedConversations = useMemo(() => {
    if (!activeMessage) return [];
    const senderLower = String(activeMessage.sender || '').toLowerCase();
    return enrichedMessages.filter(
      (m) =>
        m.id === activeMessage.id ||
        String(m.sender || '').toLowerCase() === senderLower ||
        (activeMessage.personRecord &&
          m.personRecord &&
          m.personRecord.id === activeMessage.personRecord.id)
    );
  }, [activeMessage, enrichedMessages]);

  const timelineItems = useMemo(() => {
    if (!activeMessage) return [];
    const items = [];
    const recActs = activeMessage.personRecord?.activities || [];
    recActs.forEach((act) => {
      items.push({
        id: act.id || `act-${Math.random()}`,
        type: act.type || 'CRM Activity',
        desc: act.desc || '',
        by: act.by || 'Sibi Chakaravarthi',
        time: act.date || '',
      });
    });
    activeMessage.thread.forEach((b) => {
      items.push({
        id: `tl-${b.id}`,
        type: b.direction === 'outbound' ? 'Outgoing Message Sent' : 'Incoming Message Received',
        desc: b.text || (b.attachment ? `Attachment: ${b.attachment.name}` : ''),
        by: b.sender,
        time: b.time,
      });
    });
    return items;
  }, [activeMessage]);

  // Handle Reply Submission in Center Panel
  const handleSendReply = (e) => {
    e.preventDefault();
    if (!activeMessage) return;
    if (!replyText.trim() && !pendingAttachment) return;

    replyMessage(activeMessage.id, replyText.trim(), {
      repliedById: LOGGED_IN_USER_ID,
      repliedBy: users.find((u) => u.id === LOGGED_IN_USER_ID)?.name || 'Sibi Chakaravarthi',
      channel: activeMessage.channel || 'WhatsApp',
      attachment: pendingAttachment || undefined,
    });
    setReplyText('');
    setPendingAttachment(null);
    notify(`Reply sent to ${activeMessage.sender}`, 'success');
  };

  // Handle File Attachment Selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImg = file.type.startsWith('image/');
    if (isImg) {
      const reader = new FileReader();
      reader.onload = () => {
        setPendingAttachment({
          name: file.name,
          type: 'image',
          size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
          previewUrl: reader.result,
        });
      };
      reader.readAsDataURL(file);
    } else {
      setPendingAttachment({
        name: file.name,
        type: 'file',
        size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
      });
    }
    e.target.value = '';
  };

  // Handle Save Note in Right Panel
  const handleSaveNote = () => {
    if (!noteText.trim() || !activeMessage) return;
    const newNote = {
      id: `note-${Date.now()}`,
      text: noteText.trim(),
      by: 'Sibi Chakaravarthi',
      date: formatMessageDisplayDate(todayISO(), new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
    };

    if (activeMessage.linkedLead) {
      const prevNotes = activeMessage.linkedLead.notes || [];
      updateRecord('leads', activeMessage.linkedLead.id, {
        notes: [newNote, ...prevNotes],
      });
    } else if (activeMessage.linkedContact) {
      const prevNotes = activeMessage.linkedContact.notes || [];
      updateRecord('contacts', activeMessage.linkedContact.id, {
        notes: [newNote, ...prevNotes],
      });
    }
    setNoteText('');
    setIsAddingNote(false);
    notify('Note saved to record', 'success');
  };

  // Handle Create Linked Deal in Right Panel
  const handleCreateDeal = (e) => {
    e.preventDefault();
    if (!newDealForm.name.trim() || !activeMessage) return;
    const amt = Number(newDealForm.amount) || 45000;
    createRecord('deals', {
      name: newDealForm.name.trim(),
      amount: amt,
      stage: newDealForm.stage || 'Qualification',
      probability: STAGE_PROBABILITY[newDealForm.stage] || 20,
      closingDate: newDealForm.closingDate || addDays(todayISO(), 14),
      accountId: activeMessage.linkedContact?.accountId || accounts[0]?.id || '',
      contactId: activeMessage.linkedContact?.id || '',
      ownerId: LOGGED_IN_USER_ID,
      source: 'WhatsApp Inbound',
      department: 'Enterprise Sales',
      createdOn: todayISO(),
    });
    setIsNewDealModalOpen(false);
    setNewDealForm({ name: '', amount: '', stage: 'Qualification', closingDate: addDays(todayISO(), 14) });
    notify('New Deal linked to conversation', 'success');
  };

  // Handle Add Open Activity (Task / Meeting / Call)
  const handleCreateActivity = (e) => {
    e.preventDefault();
    if (!activityForm.subject.trim() || !activeMessage) return;
    createTask({
      subject: `[${isAddActivityModalOpen}] ${activityForm.subject.trim()}`,
      dueDate: activityForm.dueDate || todayISO(),
      priority: activityForm.priority || 'High',
      status: 'Not Started',
      contactName: activeMessage.sender,
      relatedTo: activeMessage.company || activeMessage.sender,
      leadId: activeMessage.linkedLead?.id || '',
      ownerId: LOGGED_IN_USER_ID,
    });
    setIsAddActivityModalOpen(null);
    setActivityForm({ subject: '', dueDate: todayISO(), priority: 'High' });
  };

  // ============================================================================
  // RENDER 3-COLUMN CONVERSATION DETAIL VIEW (SCREENSHOTS 7 & 8)
  // ============================================================================
  if (activeMessage) {
    const ownerUser = users.find((u) => u.id === activeMessage.ownerId) || users[0];

    return (
      <div className="flex flex-col h-[calc(100vh-64px)] bg-[#F5F7FA] -mx-3 sm:-mx-[18px] -mt-2.5 -mb-6 overflow-hidden">
        <div className="flex-1 flex min-h-0 bg-white border-t border-[#E2E8F0]">
          {/* ================================================================
              COLUMN 1: LEFT CONVERSATION LIST PANEL
             ================================================================ */}
          <aside className="w-[310px] shrink-0 border-r border-[#E2E8F0] flex flex-col bg-white">
            {/* Top Bar with Back Arrow + Current View Heading */}
            <div className="h-[54px] px-3.5 border-b border-[#E2E8F0] flex items-center justify-between gap-2 bg-[#F8FAFC]">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={handleBackToList}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#334155] hover:bg-[#E2E8F0]/70 transition"
                  title="Back to Messages List"
                >
                  <ArrowLeft size={17} />
                </button>
                <h2 className="text-[14.5px] font-semibold text-[#1E293B] truncate" title={selectedView}>
                  {selectedView}
                </h2>
              </div>
              <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                {filteredMessages.length}
              </span>
            </div>

            {/* Scrollable Conversation List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#F1F5F9]">
              {filteredMessages.map((msg) => {
                const isSelected = msg.id === activeMessage.id;
                return (
                  <div
                    key={msg.id}
                    onClick={() => handleSelectMessage(msg)}
                    className={`px-3.5 py-3 cursor-pointer transition flex items-start gap-3 ${
                      isSelected
                        ? 'bg-[#EFF6FF] border-l-[3px] border-l-[#2563EB]'
                        : 'hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-[12.5px] font-bold shrink-0 mt-0.5 ${getAvatarTone(
                        msg.sender
                      )}`}
                    >
                      {getInitials(msg.sender)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-[13.5px] font-semibold text-[#1E293B] truncate">
                            {msg.sender}
                          </span>
                          <span
                            className={`text-[11px] font-semibold px-1.5 py-0.2 rounded border shrink-0 ${
                              msg.badgeType === 'Contact'
                                ? 'bg-[#F3E8FF] text-[#6B21A8] border-[#D8B4FE]'
                                : 'bg-[#DBEAFE] text-[#1E40AF] border-[#BFDBFE]'
                            }`}
                          >
                            {msg.badgeType}
                          </span>
                        </div>
                        <span className="text-[11.5px] text-[#64748B] shrink-0">
                          {msg.date === todayISO() ? msg.time : msg.date?.slice(5)}
                        </span>
                      </div>
                      <p className="text-[12.5px] text-[#475569] truncate mt-1">
                        {msg.latestPreview}
                      </p>
                      {msg.attachmentName && (
                        <div className="inline-flex items-center gap-1 mt-1 text-[11.5px] text-[#2563EB] bg-white px-1.5 py-0.5 rounded border border-[#CBD5E1] max-w-full">
                          <Paperclip size={11} className="shrink-0" />
                          <span className="truncate">{msg.attachmentName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          {/* ================================================================
              COLUMN 2: CENTER CONVERSATION PANEL
             ================================================================ */}
          <main className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] border-r border-[#E2E8F0]">
            {/* Center Header: Contact Name, WhatsApp Info, Prev/Next Navigation */}
            <div className="bg-white px-5 py-3 border-b border-[#E2E8F0] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-bold shrink-0 ${getAvatarTone(
                    activeMessage.sender
                  )}`}
                >
                  {getInitials(activeMessage.sender)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-[16px] font-bold text-[#1E293B] truncate">
                      {activeMessage.sender}
                    </h1>
                    <span
                      className={`text-[11.5px] font-semibold px-2 py-0.5 rounded border ${
                        activeMessage.badgeType === 'Contact'
                          ? 'bg-[#F3E8FF] text-[#6B21A8] border-[#D8B4FE]'
                          : 'bg-[#DBEAFE] text-[#1E40AF] border-[#BFDBFE]'
                      }`}
                    >
                      {activeMessage.badgeType}
                    </span>
                    <span className="text-[11.5px] font-medium px-2 py-0.5 rounded bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
                      {activeMessage.channel || 'WhatsApp'}
                    </span>
                  </div>
                  <div className="text-[12px] text-[#64748B] flex items-center gap-3 mt-0.5 flex-wrap">
                    <span>
                      Sender: <strong className="text-[#334155]">{activeMessage.whatsappInfo?.senderNumber}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Receiver: <strong className="text-[#334155]">{activeMessage.whatsappInfo?.receiverNumber}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Previous / Next Conversation Navigation */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[12.5px] text-[#64748B] mr-1">
                  {activeIndexInFiltered + 1} of {filteredMessages.length}
                </span>
                <button
                  type="button"
                  disabled={!prevConversation}
                  onClick={() => prevConversation && handleSelectMessage(prevConversation)}
                  className="w-8 h-8 rounded border border-[#CBD5E1] bg-white flex items-center justify-center text-[#334155] hover:bg-[#F1F5F9] disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Previous Conversation"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  disabled={!nextConversation}
                  onClick={() => nextConversation && handleSelectMessage(nextConversation)}
                  className="w-8 h-8 rounded border border-[#CBD5E1] bg-white flex items-center justify-center text-[#334155] hover:bg-[#F1F5F9] disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Next Conversation"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Center Panel Tabs: Messages | Attachments | Notifications */}
            <div className="bg-white px-5 border-b border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-6">
                {['Messages', 'Attachments', 'Notifications'].map((t) => {
                  const active = centerTab === t;
                  const countBadge =
                    t === 'Attachments'
                      ? activeMessage.threadAttachments.length
                      : t === 'Notifications'
                      ? (activeMessage.notificationLogs || []).length
                      : activeMessage.thread.length;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setCenterTab(t)}
                      className={`py-2.5 text-[13.5px] font-semibold border-b-2 transition flex items-center gap-1.5 ${
                        active
                          ? 'border-[#2563EB] text-[#2563EB]'
                          : 'border-transparent text-[#64748B] hover:text-[#1E293B]'
                      }`}
                    >
                      <span>{t}</span>
                      <span
                        className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                          active ? 'bg-[#EFF6FF] text-[#2563EB]' : 'bg-[#F1F5F9] text-[#64748B]'
                        }`}
                      >
                        {countBadge}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="text-[12px] text-[#64748B] flex items-center gap-1.5">
                <Clock size={13} className="text-[#059669]" />
                <span>{activeMessage.whatsappInfo?.sessionExpiresIn || 'Active Session'}</span>
              </div>
            </div>

            {/* TAB 1: MESSAGES THREAD */}
            {centerTab === 'Messages' && (
              <>
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {/* Date Banner */}
                  <div className="flex justify-center">
                    <span className="px-3 py-1 rounded-full bg-white border border-[#E2E8F0] text-[12px] font-medium text-[#64748B] shadow-2xs">
                      Conversation started on {formatMessageDisplayDate(activeMessage.date)}
                    </span>
                  </div>

                  {activeMessage.thread.map((bubble) => {
                    const isOutbound = bubble.direction === 'outbound';
                    const text = String(bubble.text || '');
                    const isLong = text.length > 210;
                    const isExpanded = Boolean(expandedBubbleIds[bubble.id]);
                    const displayedText = isLong && !isExpanded ? `${text.slice(0, 210)}...` : text;

                    return (
                      <div
                        key={bubble.id}
                        className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-2 mb-1 px-1">
                          <span className="text-[12px] font-semibold text-[#334155]">
                            {bubble.sender}
                          </span>
                          <span className="text-[11.5px] text-[#94A3B8]">{bubble.time}</span>
                        </div>

                        <div
                          className={`max-w-[78%] rounded-2xl px-4 py-3 shadow-2xs border ${
                            isOutbound
                              ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1E293B] rounded-tr-xs'
                              : 'bg-white border-[#E2E8F0] text-[#1E293B] rounded-tl-xs'
                          }`}
                        >
                          {displayedText && (
                            <p className="text-[14px] leading-relaxed whitespace-pre-wrap">
                              {displayedText}
                            </p>
                          )}

                          {isLong && (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedBubbleIds((prev) => ({
                                  ...prev,
                                  [bubble.id]: !prev[bubble.id],
                                }))
                              }
                              className="mt-1.5 text-[12.5px] font-semibold text-[#2563EB] hover:underline"
                            >
                              {isExpanded ? 'Show Less' : 'Read More'}
                            </button>
                          )}

                          {/* Attachment inside bubble (Image preview or File card with Download) */}
                          {bubble.attachment && (
                            <div className="mt-2.5 pt-2.5 border-t border-[#E2E8F0]/80">
                              {bubble.attachment.type === 'image' && bubble.attachment.previewUrl ? (
                                <div className="space-y-2">
                                  <img
                                    src={bubble.attachment.previewUrl}
                                    alt={bubble.attachment.name}
                                    onClick={() => setPreviewImageModal(bubble.attachment)}
                                    className="max-h-[200px] rounded-lg border border-[#CBD5E1] cursor-pointer hover:opacity-95 transition"
                                  />
                                  <div className="flex items-center justify-between gap-2 bg-white/90 px-2.5 py-1.5 rounded border border-[#CBD5E1]">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <ImageIcon size={14} className="text-[#2563EB] shrink-0" />
                                      <span className="text-[12.5px] font-medium text-[#1E293B] truncate">
                                        {bubble.attachment.name}
                                      </span>
                                      <span className="text-[11px] text-[#64748B] shrink-0">
                                        ({bubble.attachment.size || '380 KB'})
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => triggerFileDownload(bubble.attachment)}
                                      className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#2563EB] hover:underline shrink-0"
                                    >
                                      <Download size={13} />
                                      Download
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between gap-3 bg-white px-3 py-2 rounded-lg border border-[#CBD5E1]">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-8 h-8 rounded bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
                                      <FileText size={16} />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-[13px] font-semibold text-[#1E293B] truncate">
                                        {bubble.attachment.name}
                                      </div>
                                      <div className="text-[11.5px] text-[#64748B]">
                                        {bubble.attachment.size || '240 KB'}
                                      </div>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => triggerFileDownload(bubble.attachment)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] text-[12px] font-semibold transition shrink-0"
                                  >
                                    <Download size={13} />
                                    Download
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Reply Composer */}
                <form onSubmit={handleSendReply} className="bg-white p-3.5 border-t border-[#E2E8F0]">
                  {!activeMessage.whatsappInfo?.windowOpen && (
                    <div className="mb-2 px-3 py-1.5 rounded bg-[#FFFBEB] border border-[#FDE68A] text-[12px] text-[#92400E] flex items-center justify-between">
                      <span>
                        24-hour WhatsApp session window has expired. Replies will be sent using an approved CRM WhatsApp Template or fallback channel.
                      </span>
                    </div>
                  )}

                  {pendingAttachment && (
                    <div className="mb-2 px-3 py-1.5 rounded bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[12.5px] text-[#1E40AF] font-medium">
                        <Paperclip size={13} />
                        <span>{pendingAttachment.name}</span>
                        <span className="text-[11.5px] text-[#64748B]">({pendingAttachment.size})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPendingAttachment(null)}
                        className="text-[#64748B] hover:text-[#DC2626]"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  <div className="flex items-end gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-9 w-9 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] hover:bg-[#F1F5F9] flex items-center justify-center text-[#475569] shrink-0"
                      title="Attach File or Image"
                    >
                      <Paperclip size={16} />
                    </button>
                    <textarea
                      rows={2}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Reply to ${activeMessage.sender}...`}
                      className="flex-1 px-3 py-2 text-[14px] bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg focus:outline-none focus:bg-white focus:border-[#2563EB] resize-none"
                    />
                    <button
                      type="submit"
                      disabled={!replyText.trim() && !pendingAttachment}
                      className="h-9 px-4 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-40 text-white text-[13.5px] font-semibold inline-flex items-center gap-1.5 transition shrink-0"
                    >
                      <Send size={14} />
                      Send
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* TAB 2: ATTACHMENTS */}
            {centerTab === 'Attachments' && (
              <div className="flex-1 overflow-y-auto p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[15px] font-bold text-[#1E293B]">
                    Shared Attachments ({activeMessage.threadAttachments.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setCenterTab('Messages');
                      setTimeout(() => fileInputRef.current?.click(), 50);
                    }}
                    className="h-8 px-3 rounded bg-[#2563EB] text-white text-[12.5px] font-semibold inline-flex items-center gap-1.5"
                  >
                    <Plus size={13} />
                    Share Attachment
                  </button>
                </div>

                {activeMessage.threadAttachments.length === 0 ? (
                  <div className="bg-white rounded-xl border border-[#E2E8F0] p-8 text-center text-[#64748B] text-[14px]">
                    No attachments in this conversation yet.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {activeMessage.threadAttachments.map((att, idx) => (
                      <div
                        key={`${att.name}-${idx}`}
                        className="bg-white rounded-xl border border-[#E2E8F0] p-3.5 flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
                            {att.type === 'image' ? <ImageIcon size={18} /> : <FileText size={18} />}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[14px] font-semibold text-[#1E293B] truncate">
                              {att.name}
                            </div>
                            <div className="text-[12px] text-[#64748B]">
                              Shared by {att.sender} • {att.time} • {att.size || '280 KB'}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => triggerFileDownload(att)}
                          className="h-8 px-3 rounded bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] text-[12.5px] font-semibold inline-flex items-center gap-1.5 shrink-0"
                        >
                          <Download size={14} />
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: NOTIFICATIONS */}
            {centerTab === 'Notifications' && (
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 flex items-center justify-between">
                  <div>
                    <div className="text-[14px] font-bold text-[#1E293B]">
                      Message Notification Alerts
                    </div>
                    <div className="text-[12.5px] text-[#64748B]">
                      Status: <strong className="text-[#2563EB]">{activeMessage.notificationsSelected ? 'Selected' : 'Not Selected'}</strong>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[12px] font-semibold border ${
                      activeMessage.notificationsSelected
                        ? 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
                        : 'bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]'
                    }`}
                  >
                    {activeMessage.notificationsSelected ? 'Notifications Enabled' : 'Notifications Muted'}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {(activeMessage.notificationLogs || []).length === 0 ? (
                    <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 text-center text-[#64748B] text-[13.5px]">
                      No notification alerts logged for this thread.
                    </div>
                  ) : (
                    (activeMessage.notificationLogs || []).map((log) => (
                      <div
                        key={log.id}
                        className="bg-white rounded-xl border border-[#E2E8F0] p-3.5 flex items-start gap-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0 mt-0.5">
                          <Bell size={15} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[13.5px] font-semibold text-[#1E293B]">
                              {log.title}
                            </span>
                            <span className="text-[11.5px] text-[#64748B]">{log.time}</span>
                          </div>
                          <div className="text-[12px] text-[#059669] font-medium mt-0.5">
                            Status: {log.status}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </main>

          {/* ================================================================
              COLUMN 3: RIGHT CONTACT INFORMATION PANEL (SCREENSHOT 8)
             ================================================================ */}
          <aside className="w-[350px] shrink-0 bg-white flex flex-col overflow-hidden">
            {/* Right Panel Tabs: Info | Timeline | Conversations */}
            <div className="px-4 border-b border-[#E2E8F0] flex items-center gap-5 bg-[#F8FAFC]">
              {['Info', 'Timeline', 'Conversations'].map((t) => {
                const active = rightTab === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setRightTab(t)}
                    className={`py-3 text-[13.5px] font-semibold border-b-2 transition ${
                      active
                        ? 'border-[#2563EB] text-[#2563EB]'
                        : 'border-transparent text-[#64748B] hover:text-[#1E293B]'
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>

            {/* RIGHT TAB 1: INFO */}
            {rightTab === 'Info' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-5 divide-y divide-[#F1F5F9]">
                {/* Contact Profile Header */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-[15px] font-bold shrink-0 ${getAvatarTone(
                        activeMessage.sender
                      )}`}
                    >
                      {getInitials(activeMessage.sender)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (activeMessage.linkedContact) {
                            navigate(`/contacts?open=${activeMessage.linkedContact.id}`);
                          } else if (activeMessage.linkedLead) {
                            navigate(`/leads/${activeMessage.linkedLead.id}`);
                          }
                        }}
                        className="text-[15.5px] font-bold text-[#2563EB] hover:underline text-left flex items-center gap-1"
                      >
                        <span className="truncate">{activeMessage.sender}</span>
                        <ExternalLink size={13} className="shrink-0" />
                      </button>
                      <div className="text-[12.5px] text-[#64748B] truncate">
                        {activeMessage.company} • {activeMessage.badgeType}
                      </div>

                      {/* Send Email Dropdown */}
                      <div className="relative mt-2 inline-block">
                        <button
                          type="button"
                          onClick={() => setSendEmailMenuOpen((o) => !o)}
                          className="h-7 px-2.5 rounded bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] border border-[#BFDBFE] text-[12px] font-semibold inline-flex items-center gap-1"
                        >
                          <Mail size={12} />
                          <span>Send Email</span>
                          <ChevronDown size={12} />
                        </button>
                        {sendEmailMenuOpen && (
                          <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-[#CBD5E1] rounded-md shadow-lg z-30 py-1">
                            {[
                              'Send Immediate Email',
                              'Send Quotation Template',
                              'Schedule Follow-up Email',
                            ].map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => {
                                  setSendEmailMenuOpen(false);
                                  notify(`${opt} queued for ${activeMessage.email}`, 'success');
                                }}
                                className="w-full text-left px-3 py-1.5 text-[12.5px] text-[#1E293B] hover:bg-[#F1F5F9]"
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact Fields: Phone, Email, Followers, More Info */}
                  <div className="space-y-2 text-[13px] pt-1">
                    <div className="flex items-center justify-between py-1">
                      <span className="text-[#64748B] flex items-center gap-1.5">
                        <Phone size={13} /> Phone
                      </span>
                      <span className="font-medium text-[#1E293B]">{activeMessage.phone}</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-[#64748B] flex items-center gap-1.5">
                        <Mail size={13} /> Email
                      </span>
                      <span className="font-medium text-[#2563EB] truncate max-w-[190px]">
                        {activeMessage.email}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-[#64748B] flex items-center gap-1.5">
                        <Users size={13} /> Followers
                      </span>
                      <span className="font-medium text-[#1E293B]">{ownerUser?.name || 'Sibi Chakaravarthi'}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setMoreInfoOpen((o) => !o)}
                      className="text-[12.5px] font-semibold text-[#2563EB] hover:underline flex items-center gap-1 pt-1"
                    >
                      <span>{moreInfoOpen ? 'Hide More Info' : 'More Info'}</span>
                      <ChevronDown size={13} className={moreInfoOpen ? 'rotate-180 transition' : 'transition'} />
                    </button>

                    {moreInfoOpen && (
                      <div className="bg-[#F8FAFC] rounded-lg p-2.5 space-y-1.5 border border-[#E2E8F0] text-[12.5px]">
                        <div className="flex justify-between">
                          <span className="text-[#64748B]">Record Owner</span>
                          <span className="font-medium text-[#1E293B]">{ownerUser?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748B]">Company</span>
                          <span className="font-medium text-[#1E293B]">{activeMessage.company}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748B]">City</span>
                          <span className="font-medium text-[#1E293B]">
                            {activeMessage.personRecord?.city || 'Chennai'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748B]">Replied By</span>
                          <span className="font-medium text-[#1E293B]">
                            {activeMessage.repliedBy || 'Not Replied Yet'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Deal Summary Section */}
                <div className="pt-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[14px] font-bold text-[#1E293B]">Deal Summary</h3>
                    <button
                      type="button"
                      onClick={() => {
                        setNewDealForm({
                          name: `${activeMessage.company || activeMessage.sender} - Deal`,
                          amount: '45000',
                          stage: 'Qualification',
                          closingDate: addDays(todayISO(), 14),
                        });
                        setIsNewDealModalOpen(true);
                      }}
                      className="text-[12.5px] font-semibold text-[#2563EB] hover:underline inline-flex items-center gap-0.5"
                    >
                      <Plus size={13} /> New Deal
                    </button>
                  </div>

                  {linkedDeals.length === 0 ? (
                    <div className="text-[12.5px] text-[#64748B] bg-[#F8FAFC] rounded-lg p-3 border border-[#E2E8F0]">
                      No deals linked yet. Click <strong>+ New Deal</strong> to associate a deal.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {linkedDeals.map((d) => (
                        <div
                          key={d.id}
                          onClick={() => navigate(`/deals/${d.id}`)}
                          className="p-2.5 rounded-lg border border-[#E2E8F0] hover:border-[#2563EB] bg-[#F8FAFC] cursor-pointer transition"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[13px] font-semibold text-[#2563EB] truncate">
                              {d.name}
                            </span>
                            <span className="text-[13px] font-bold text-[#1E293B] shrink-0">
                              {fmtINR(d.amount)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11.5px] text-[#64748B] mt-1">
                            <span className="px-1.5 py-0.2 rounded bg-white border border-[#CBD5E1] text-[#334155] font-medium">
                              {d.stage}
                            </span>
                            <span>Closing: {d.closingDate}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notes Section */}
                <div className="pt-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[14px] font-bold text-[#1E293B]">
                      Notes ({linkedNotes.length})
                    </h3>
                    {!isAddingNote && (
                      <button
                        type="button"
                        onClick={() => setIsAddingNote(true)}
                        className="text-[12.5px] font-semibold text-[#2563EB] hover:underline inline-flex items-center gap-0.5"
                      >
                        <Plus size={13} /> Add Note
                      </button>
                    )}
                  </div>

                  {isAddingNote && (
                    <div className="space-y-2 bg-[#F8FAFC] p-2.5 rounded-lg border border-[#CBD5E1]">
                      <textarea
                        rows={2}
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Write a note..."
                        className="w-full px-2.5 py-1.5 text-[13px] bg-white border border-[#CBD5E1] rounded focus:outline-none focus:border-[#2563EB]"
                      />
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingNote(false);
                            setNoteText('');
                          }}
                          className="h-7 px-2.5 rounded text-[12px] text-[#475569] hover:bg-[#E2E8F0]"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveNote}
                          className="h-7 px-3 rounded bg-[#2563EB] text-white text-[12px] font-semibold hover:bg-[#1D4ED8]"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}

                  {linkedNotes.length === 0 ? (
                    <div className="text-[12.5px] text-[#64748B]">No notes recorded yet.</div>
                  ) : (
                    <div className="space-y-2">
                      {linkedNotes.map((n, idx) => (
                        <div
                          key={n.id || idx}
                          className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[12.5px]"
                        >
                          <p className="text-[#1E293B]">{n.text || n.content}</p>
                          <div className="text-[11px] text-[#64748B] mt-1">
                            {n.by || 'Sibi Chakaravarthi'} • {n.date || 'Recent'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Open Activities Section (Tasks, Meetings, Calls) */}
                <div className="pt-4 space-y-2.5">
                  <h3 className="text-[14px] font-bold text-[#1E293B]">Open Activities</h3>

                  {/* Tasks */}
                  <div className="border border-[#E2E8F0] rounded-lg overflow-hidden">
                    <div className="px-3 py-2 bg-[#F8FAFC] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenActivitiesExpanded((p) => ({ ...p, Tasks: !p.Tasks }))
                        }
                        className="flex items-center gap-1.5 text-[13px] font-semibold text-[#1E293B]"
                      >
                        {openActivitiesExpanded.Tasks ? (
                          <ChevronDown size={14} />
                        ) : (
                          <ChevronRight size={14} />
                        )}
                        <span>Tasks ({linkedTasks.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddActivityModalOpen('Task')}
                        className="text-[12px] font-semibold text-[#2563EB] hover:underline"
                      >
                        + Add
                      </button>
                    </div>
                    {openActivitiesExpanded.Tasks && (
                      <div className="p-2.5 space-y-1.5 text-[12.5px]">
                        {linkedTasks.length === 0 ? (
                          <div className="text-[#64748B]">No open tasks.</div>
                        ) : (
                          linkedTasks.map((t) => (
                            <div
                              key={t.id}
                              className="p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0]"
                            >
                              <div className="font-medium text-[#1E293B]">
                                {t.subject || t.title}
                              </div>
                              <div className="text-[11px] text-[#64748B] mt-0.5">
                                Due: {t.dueDate} • {t.status}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Meetings */}
                  <div className="border border-[#E2E8F0] rounded-lg overflow-hidden">
                    <div className="px-3 py-2 bg-[#F8FAFC] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenActivitiesExpanded((p) => ({ ...p, Meetings: !p.Meetings }))
                        }
                        className="flex items-center gap-1.5 text-[13px] font-semibold text-[#1E293B]"
                      >
                        {openActivitiesExpanded.Meetings ? (
                          <ChevronDown size={14} />
                        ) : (
                          <ChevronRight size={14} />
                        )}
                        <span>
                          Meetings (
                          {linkedTasks.filter((t) => String(t.subject || '').includes('[Meeting]')).length}
                          )
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddActivityModalOpen('Meeting')}
                        className="text-[12px] font-semibold text-[#2563EB] hover:underline"
                      >
                        + Add
                      </button>
                    </div>
                    {openActivitiesExpanded.Meetings && (
                      <div className="p-2.5 text-[12.5px] text-[#64748B]">
                        {linkedTasks.filter((t) => String(t.subject || '').includes('[Meeting]')).length === 0
                          ? 'No scheduled meetings.'
                          : linkedTasks
                              .filter((t) => String(t.subject || '').includes('[Meeting]'))
                              .map((m) => (
                                <div key={m.id} className="p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[#1E293B]">
                                  {m.subject} ({m.dueDate})
                                </div>
                              ))}
                      </div>
                    )}
                  </div>

                  {/* Calls */}
                  <div className="border border-[#E2E8F0] rounded-lg overflow-hidden">
                    <div className="px-3 py-2 bg-[#F8FAFC] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenActivitiesExpanded((p) => ({ ...p, Calls: !p.Calls }))
                        }
                        className="flex items-center gap-1.5 text-[13px] font-semibold text-[#1E293B]"
                      >
                        {openActivitiesExpanded.Calls ? (
                          <ChevronDown size={14} />
                        ) : (
                          <ChevronRight size={14} />
                        )}
                        <span>Calls ({linkedCalls.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddActivityModalOpen('Call')}
                        className="text-[12px] font-semibold text-[#2563EB] hover:underline"
                      >
                        + Add
                      </button>
                    </div>
                    {openActivitiesExpanded.Calls && (
                      <div className="p-2.5 space-y-1.5 text-[12.5px]">
                        {linkedCalls.length === 0 ? (
                          <div className="text-[#64748B]">No logged calls.</div>
                        ) : (
                          linkedCalls.map((c) => (
                            <div
                              key={c.id}
                              className="p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0]"
                            >
                              <div className="font-medium text-[#1E293B]">
                                {c.type || 'Outbound'} Call • {c.status || 'Completed'}
                              </div>
                              <div className="text-[11px] text-[#64748B] mt-0.5">
                                {c.date} • Duration: {c.duration || 180}s
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* RIGHT TAB 2: TIMELINE */}
            {rightTab === 'Timeline' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <h3 className="text-[14px] font-bold text-[#1E293B]">
                  Activity Timeline ({timelineItems.length})
                </h3>
                <div className="relative pl-4 border-l-2 border-[#CBD5E1] space-y-4">
                  {timelineItems.map((item) => (
                    <div key={item.id} className="relative">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#2563EB] absolute -left-[21px] top-1.5 ring-4 ring-white" />
                      <div className="text-[13px] font-semibold text-[#1E293B]">{item.type}</div>
                      <div className="text-[12.5px] text-[#475569] mt-0.5">{item.desc}</div>
                      <div className="text-[11px] text-[#94A3B8] mt-0.5">
                        {item.by} • {item.time}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* RIGHT TAB 3: CONVERSATIONS */}
            {rightTab === 'Conversations' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <h3 className="text-[14px] font-bold text-[#1E293B]">
                  Conversation History ({linkedConversations.length})
                </h3>
                <div className="space-y-2">
                  {linkedConversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => handleSelectMessage(conv)}
                      className={`p-3 rounded-lg border cursor-pointer transition ${
                        conv.id === activeMessage.id
                          ? 'bg-[#EFF6FF] border-[#2563EB]'
                          : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#CBD5E1]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-semibold text-[#1E293B]">
                          {conv.channel || 'WhatsApp'} Thread
                        </span>
                        <span className="text-[11.5px] text-[#64748B]">{conv.date}</span>
                      </div>
                      <p className="text-[12.5px] text-[#475569] truncate mt-1">
                        {conv.latestPreview}
                      </p>
                      <div className="text-[11px] text-[#2563EB] font-medium mt-1">
                        {conv.thread.length} messages • {conv.isReplied ? 'Replied' : 'Awaiting Reply'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>

        {/* Modal: Create New Linked Deal */}
        <Modal
          open={isNewDealModalOpen}
          onClose={() => setIsNewDealModalOpen(false)}
          title={`New Deal for ${activeMessage.sender}`}
        >
          <form onSubmit={handleCreateDeal} className="space-y-3">
            <div>
              <label className="text-[13px] font-semibold text-[#334155] block mb-1">Deal Name *</label>
              <input
                type="text"
                required
                value={newDealForm.name}
                onChange={(e) => setNewDealForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full h-9 px-3 text-[13.5px] border border-[#CBD5E1] rounded"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[13px] font-semibold text-[#334155] block mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={newDealForm.amount}
                  onChange={(e) => setNewDealForm((p) => ({ ...p, amount: e.target.value }))}
                  className="w-full h-9 px-3 text-[13.5px] border border-[#CBD5E1] rounded"
                />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-[#334155] block mb-1">Stage</label>
                <select
                  value={newDealForm.stage}
                  onChange={(e) => setNewDealForm((p) => ({ ...p, stage: e.target.value }))}
                  className="w-full h-9 px-2.5 text-[13.5px] border border-[#CBD5E1] rounded bg-white"
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[13px] font-semibold text-[#334155] block mb-1">Closing Date</label>
              <input
                type="date"
                value={newDealForm.closingDate}
                onChange={(e) => setNewDealForm((p) => ({ ...p, closingDate: e.target.value }))}
                className="w-full h-9 px-3 text-[13.5px] border border-[#CBD5E1] rounded"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsNewDealModalOpen(false)}
                className="h-8 px-3.5 rounded border border-[#CBD5E1] text-[13px] font-medium text-[#334155]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-8 px-4 rounded bg-[#2563EB] text-white text-[13px] font-semibold"
              >
                Create Deal
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal: Add Open Activity */}
        <Modal
          open={Boolean(isAddActivityModalOpen)}
          onClose={() => setIsAddActivityModalOpen(null)}
          title={`Add ${isAddActivityModalOpen || 'Activity'} — ${activeMessage.sender}`}
        >
          <form onSubmit={handleCreateActivity} className="space-y-3">
            <div>
              <label className="text-[13px] font-semibold text-[#334155] block mb-1">Subject *</label>
              <input
                type="text"
                required
                placeholder={`Follow up with ${activeMessage.sender}`}
                value={activityForm.subject}
                onChange={(e) => setActivityForm((p) => ({ ...p, subject: e.target.value }))}
                className="w-full h-9 px-3 text-[13.5px] border border-[#CBD5E1] rounded"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[13px] font-semibold text-[#334155] block mb-1">Due Date</label>
                <input
                  type="date"
                  value={activityForm.dueDate}
                  onChange={(e) => setActivityForm((p) => ({ ...p, dueDate: e.target.value }))}
                  className="w-full h-9 px-3 text-[13.5px] border border-[#CBD5E1] rounded"
                />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-[#334155] block mb-1">Priority</label>
                <select
                  value={activityForm.priority}
                  onChange={(e) => setActivityForm((p) => ({ ...p, priority: e.target.value }))}
                  className="w-full h-9 px-2.5 text-[13.5px] border border-[#CBD5E1] rounded bg-white"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddActivityModalOpen(null)}
                className="h-8 px-3.5 rounded border border-[#CBD5E1] text-[13px] font-medium text-[#334155]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-8 px-4 rounded bg-[#2563EB] text-white text-[13px] font-semibold"
              >
                Save {isAddActivityModalOpen}
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal: Image Lightbox Preview */}
        <Modal
          open={Boolean(previewImageModal)}
          onClose={() => setPreviewImageModal(null)}
          title={previewImageModal?.name || 'Image Attachment'}
        >
          {previewImageModal && (
            <div className="space-y-3">
              <img
                src={previewImageModal.previewUrl}
                alt={previewImageModal.name}
                className="w-full rounded-lg border border-[#CBD5E1]"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => triggerFileDownload(previewImageModal)}
                  className="h-8 px-4 rounded bg-[#2563EB] text-white text-[13px] font-semibold inline-flex items-center gap-1.5"
                >
                  <Download size={14} />
                  Download Image
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    );
  }

  // ============================================================================
  // RENDER MESSAGES LIST PAGE (SCREENSHOTS 1, 2, 3, 4, 5, 6)
  // ============================================================================
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[#F5F7FA] -mx-3 sm:-mx-[18px] -mt-2.5 -mb-6 overflow-hidden">
      {/* Top Bar: Messages Heading, View Dropdown, Sort By: Message Time, Asc/Desc */}
      <div className="h-[56px] bg-white px-5 border-b border-[#E2E8F0] flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-[20px] font-bold text-[#1E293B] tracking-tight">Messages</h1>

          {/* Message View Dropdown (Default: My Not Replied Messages) */}
          <div className="relative">
            <select
              value={selectedView}
              onChange={(e) => {
                setSelectedView(e.target.value);
                setPage(1);
              }}
              className="h-9 pl-3 pr-8 text-[14px] font-semibold text-[#1E293B] bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#CBD5E1] rounded-md focus:outline-none focus:border-[#2563EB] cursor-pointer"
            >
              {MESSAGE_VIEWS.map((view) => (
                <option key={view} value={view}>
                  {view}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Controls: Sort By: Message Time + Asc / Desc */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[13.5px] font-medium text-[#64748B]">Sort By</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-8 px-2.5 text-[13.5px] font-medium text-[#1E293B] bg-white border border-[#CBD5E1] rounded focus:outline-none focus:border-[#2563EB]"
            >
              <option value="Message Time">Message Time</option>
            </select>
          </div>

          <div className="inline-flex rounded border border-[#CBD5E1] overflow-hidden bg-white">
            <button
              type="button"
              onClick={() => setSortOrder('Asc')}
              className={`h-8 px-2.5 text-[12.5px] font-semibold transition ${
                sortOrder === 'Asc'
                  ? 'bg-[#2563EB] text-white'
                  : 'text-[#475569] hover:bg-[#F8FAFC]'
              }`}
              title="Sort Ascending"
            >
              Asc
            </button>
            <button
              type="button"
              onClick={() => setSortOrder('Desc')}
              className={`h-8 px-2.5 text-[12.5px] font-semibold border-l border-[#CBD5E1] transition ${
                sortOrder === 'Desc'
                  ? 'bg-[#2563EB] text-white'
                  : 'text-[#475569] hover:bg-[#F8FAFC]'
              }`}
              title="Sort Descending"
            >
              Desc
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area: Left Filter Panel + Right Messages List */}
      <div className="flex-1 flex min-h-0">
        {/* ================================================================
            LEFT FILTER PANEL ("Filter Messages by" — Screenshots 1-6)
           ================================================================ */}
        <aside className="w-[290px] shrink-0 bg-white border-r border-[#E2E8F0] flex flex-col h-full">
          {/* Header + Search Filters */}
          <div className="p-3.5 border-b border-[#E2E8F0] space-y-2.5 shrink-0">
            <h2 className="text-[15px] font-bold text-[#1E293B]">Filter Messages by</h2>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Search filters..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-7 text-[13.5px] bg-[#F8FAFC] border border-[#CBD5E1] rounded focus:outline-none focus:bg-white focus:border-[#2563EB]"
              />
              {filterSearch && (
                <button
                  type="button"
                  onClick={() => setFilterSearch('')}
                  className="absolute right-2 top-2 text-[#94A3B8] hover:text-[#475569]"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Scrollable Filter Sections */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
            {/* Section 1: System Defined Filters */}
            {(showNotRepliedFilter || showRepliedFilter) && (
              <div>
                <button
                  type="button"
                  onClick={() => setSysSectionOpen((o) => !o)}
                  className="w-full flex items-center gap-1.5 text-[13px] font-bold text-[#334155] py-1 hover:text-[#0F172A]"
                >
                  {sysSectionOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span>System Defined Filters</span>
                </button>

                {sysSectionOpen && (
                  <div className="mt-1.5 space-y-2">
                    {/* Not Replied Messages */}
                    {showNotRepliedFilter && (
                      <div
                        className={`rounded-md transition ${
                          draftFilters.notReplied.checked
                            ? 'bg-[#F8FAFC] border border-[#CBD5E1] p-2.5'
                            : 'py-1 px-1.5 hover:bg-[#F8FAFC]'
                        }`}
                      >
                        <label className="flex items-center gap-2.5 cursor-pointer text-[13.5px] text-[#1E293B]">
                          <input
                            type="checkbox"
                            checked={draftFilters.notReplied.checked}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setDraftFilters((prev) => ({
                                ...prev,
                                notReplied: { ...prev.notReplied, checked },
                                replied: checked ? { ...prev.replied, checked: false } : prev.replied,
                              }));
                            }}
                            className="w-3.5 h-3.5 rounded text-[#2563EB] focus:ring-[#2563EB]"
                          />
                          <span className={draftFilters.notReplied.checked ? 'font-semibold text-[#2563EB]' : 'font-medium'}>
                            Not Replied Messages
                          </span>
                        </label>
                        {draftFilters.notReplied.checked && (
                          <DateOperatorFilterBlock
                            state={draftFilters.notReplied}
                            onChange={(next) =>
                              setDraftFilters((prev) => ({ ...prev, notReplied: next }))
                            }
                            fiscalMonth={fiscalMonth}
                            onFiscalMonthChange={handleFiscalMonthChange}
                          />
                        )}
                      </div>
                    )}

                    {/* Replied Messages */}
                    {showRepliedFilter && (
                      <div
                        className={`rounded-md transition ${
                          draftFilters.replied.checked
                            ? 'bg-[#F8FAFC] border border-[#CBD5E1] p-2.5'
                            : 'py-1 px-1.5 hover:bg-[#F8FAFC]'
                        }`}
                      >
                        <label className="flex items-center gap-2.5 cursor-pointer text-[13.5px] text-[#1E293B]">
                          <input
                            type="checkbox"
                            checked={draftFilters.replied.checked}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setDraftFilters((prev) => ({
                                ...prev,
                                replied: { ...prev.replied, checked },
                                notReplied: checked ? { ...prev.notReplied, checked: false } : prev.notReplied,
                              }));
                            }}
                            className="w-3.5 h-3.5 rounded text-[#2563EB] focus:ring-[#2563EB]"
                          />
                          <span className={draftFilters.replied.checked ? 'font-semibold text-[#2563EB]' : 'font-medium'}>
                            Replied Messages
                          </span>
                        </label>
                        {draftFilters.replied.checked && (
                          <DateOperatorFilterBlock
                            state={draftFilters.replied}
                            onChange={(next) =>
                              setDraftFilters((prev) => ({ ...prev, replied: next }))
                            }
                            fiscalMonth={fiscalMonth}
                            onFiscalMonthChange={handleFiscalMonthChange}
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Section 2: Filter By Fields */}
            {(showMessageTimeFilter ||
              showNotificationsFilter ||
              showRecordOwnerFilter ||
              showRepliedByFilter) && (
              <div className="pt-2 border-t border-[#F1F5F9]">
                <button
                  type="button"
                  onClick={() => setFieldsSectionOpen((o) => !o)}
                  className="w-full flex items-center gap-1.5 text-[13px] font-bold text-[#334155] py-1 hover:text-[#0F172A]"
                >
                  {fieldsSectionOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span>Filter By Fields</span>
                </button>

                {fieldsSectionOpen && (
                  <div className="mt-1.5 space-y-2">
                    {/* 1. Message Time */}
                    {showMessageTimeFilter && (
                      <div
                        className={`rounded-md transition ${
                          draftFilters.messageTime.checked
                            ? 'bg-[#F8FAFC] border border-[#CBD5E1] p-2.5'
                            : 'py-1 px-1.5 hover:bg-[#F8FAFC]'
                        }`}
                      >
                        <label className="flex items-center gap-2.5 cursor-pointer text-[13.5px] text-[#1E293B]">
                          <input
                            type="checkbox"
                            checked={draftFilters.messageTime.checked}
                            onChange={(e) =>
                              setDraftFilters((prev) => ({
                                ...prev,
                                messageTime: { ...prev.messageTime, checked: e.target.checked },
                              }))
                            }
                            className="w-3.5 h-3.5 rounded text-[#2563EB] focus:ring-[#2563EB]"
                          />
                          <span className={draftFilters.messageTime.checked ? 'font-semibold text-[#2563EB]' : 'font-medium'}>
                            Message Time
                          </span>
                        </label>
                        {draftFilters.messageTime.checked && (
                          <DateOperatorFilterBlock
                            state={draftFilters.messageTime}
                            onChange={(next) =>
                              setDraftFilters((prev) => ({ ...prev, messageTime: next }))
                            }
                            fiscalMonth={fiscalMonth}
                            onFiscalMonthChange={handleFiscalMonthChange}
                          />
                        )}
                      </div>
                    )}

                    {/* 2. Notifications */}
                    {showNotificationsFilter && (
                      <div
                        className={`rounded-md transition ${
                          draftFilters.notifications.checked
                            ? 'bg-[#F8FAFC] border border-[#CBD5E1] p-2.5'
                            : 'py-1 px-1.5 hover:bg-[#F8FAFC]'
                        }`}
                      >
                        <label className="flex items-center gap-2.5 cursor-pointer text-[13.5px] text-[#1E293B]">
                          <input
                            type="checkbox"
                            checked={draftFilters.notifications.checked}
                            onChange={(e) =>
                              setDraftFilters((prev) => ({
                                ...prev,
                                notifications: { ...prev.notifications, checked: e.target.checked },
                              }))
                            }
                            className="w-3.5 h-3.5 rounded text-[#2563EB] focus:ring-[#2563EB]"
                          />
                          <span className={draftFilters.notifications.checked ? 'font-semibold text-[#2563EB]' : 'font-medium'}>
                            Notifications
                          </span>
                        </label>
                        {draftFilters.notifications.checked && (
                          <div className="mt-2 pl-5 space-y-2">
                            <select
                              value={draftFilters.notifications.operator}
                              onChange={(e) =>
                                setDraftFilters((prev) => ({
                                  ...prev,
                                  notifications: { ...prev.notifications, operator: e.target.value },
                                }))
                              }
                              className="w-full h-8 px-2.5 text-[13.5px] bg-white border border-[#CBD5E1] rounded text-[#1E293B] focus:outline-none focus:border-[#2563EB]"
                            >
                              <option value="is">is</option>
                              <option value="is not">is not</option>
                            </select>
                            <select
                              value={draftFilters.notifications.value}
                              onChange={(e) =>
                                setDraftFilters((prev) => ({
                                  ...prev,
                                  notifications: { ...prev.notifications, value: e.target.value },
                                }))
                              }
                              className="w-full h-8 px-2.5 text-[13.5px] bg-white border border-[#CBD5E1] rounded text-[#1E293B] focus:outline-none focus:border-[#2563EB]"
                            >
                              <option value="Selected">Selected</option>
                              <option value="Not Selected">Not Selected</option>
                            </select>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 3. Record Owner */}
                    {showRecordOwnerFilter && (
                      <div
                        className={`rounded-md transition ${
                          draftFilters.recordOwner.checked
                            ? 'bg-[#F8FAFC] border border-[#CBD5E1] p-2.5'
                            : 'py-1 px-1.5 hover:bg-[#F8FAFC]'
                        }`}
                      >
                        <label className="flex items-center gap-2.5 cursor-pointer text-[13.5px] text-[#1E293B]">
                          <input
                            type="checkbox"
                            checked={draftFilters.recordOwner.checked}
                            onChange={(e) =>
                              setDraftFilters((prev) => ({
                                ...prev,
                                recordOwner: { ...prev.recordOwner, checked: e.target.checked },
                              }))
                            }
                            className="w-3.5 h-3.5 rounded text-[#2563EB] focus:ring-[#2563EB]"
                          />
                          <span className={draftFilters.recordOwner.checked ? 'font-semibold text-[#2563EB]' : 'font-medium'}>
                            Record Owner
                          </span>
                        </label>
                        {draftFilters.recordOwner.checked && (
                          <UserLookupFilterBlock
                            label="Users"
                            state={draftFilters.recordOwner}
                            onChange={(next) =>
                              setDraftFilters((prev) => ({ ...prev, recordOwner: next }))
                            }
                            users={users}
                          />
                        )}
                      </div>
                    )}

                    {/* 4. Replied By */}
                    {showRepliedByFilter && (
                      <div
                        className={`rounded-md transition ${
                          draftFilters.repliedBy.checked
                            ? 'bg-[#F8FAFC] border border-[#CBD5E1] p-2.5'
                            : 'py-1 px-1.5 hover:bg-[#F8FAFC]'
                        }`}
                      >
                        <label className="flex items-center gap-2.5 cursor-pointer text-[13.5px] text-[#1E293B]">
                          <input
                            type="checkbox"
                            checked={draftFilters.repliedBy.checked}
                            onChange={(e) =>
                              setDraftFilters((prev) => ({
                                ...prev,
                                repliedBy: { ...prev.repliedBy, checked: e.target.checked },
                              }))
                            }
                            className="w-3.5 h-3.5 rounded text-[#2563EB] focus:ring-[#2563EB]"
                          />
                          <span className={draftFilters.repliedBy.checked ? 'font-semibold text-[#2563EB]' : 'font-medium'}>
                            Replied By
                          </span>
                        </label>
                        {draftFilters.repliedBy.checked && (
                          <UserLookupFilterBlock
                            label="Users"
                            state={draftFilters.repliedBy}
                            onChange={(next) =>
                              setDraftFilters((prev) => ({ ...prev, repliedBy: next }))
                            }
                            users={users}
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sticky Bottom Apply Filter & Clear Buttons */}
          <div className="p-3 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleApplyFilters}
              className="flex-1 h-8 rounded bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13.5px] font-semibold transition shadow-2xs"
            >
              Apply Filter
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              disabled={!hasAnyActiveFilter && !filterSearch}
              className="h-8 px-3.5 rounded border border-[#CBD5E1] bg-white hover:bg-[#F1F5F9] text-[#334155] text-[13.5px] font-medium disabled:opacity-40 transition"
            >
              Clear
            </button>
          </div>
        </aside>

        {/* ================================================================
            RIGHT MESSAGES LIST AREA
           ================================================================ */}
        <section className="flex-1 flex flex-col min-w-0 bg-white">
          {/* Scrollable Message Rows */}
          <div ref={listScrollContainerRef} className="flex-1 overflow-y-auto divide-y divide-[#E2E8F0]">
            {paginatedMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                <div className="w-12 h-12 rounded-full bg-[#F1F5F9] text-[#64748B] flex items-center justify-center mb-3">
                  <MessageSquare size={22} />
                </div>
                <div className="text-[15px] font-semibold text-[#1E293B]">
                  No messages match the current view or filter criteria
                </div>
                <p className="text-[13.5px] text-[#64748B] mt-1 max-w-md">
                  Try switching the view dropdown at the top or click Clear in the filter panel to see all customer conversations.
                </p>
              </div>
            ) : (
              paginatedMessages.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => handleSelectMessage(msg)}
                  className="px-5 py-3.5 hover:bg-[#F8FAFC] cursor-pointer transition flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {/* Contact Avatar */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-[13.5px] font-bold shrink-0 mt-0.5 ${getAvatarTone(
                        msg.sender
                      )}`}
                    >
                      {getInitials(msg.sender)}
                    </div>

                    {/* Contact / Lead Name, Badge, Latest Message Preview, Attachment Filename */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[14.5px] text-[#1E293B] group-hover:text-[#2563EB] transition ${
                            !msg.isRead ? 'font-bold' : 'font-semibold'
                          }`}
                        >
                          {msg.sender}
                        </span>

                        {/* Contact or Lead Badge */}
                        <span
                          className={`text-[11.5px] font-semibold px-2 py-0.5 rounded border ${
                            msg.badgeType === 'Contact'
                              ? 'bg-[#F3E8FF] text-[#6B21A8] border-[#D8B4FE]'
                              : 'bg-[#DBEAFE] text-[#1E40AF] border-[#BFDBFE]'
                          }`}
                        >
                          {msg.badgeType}
                        </span>

                        {!msg.isReplied && (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                            Not Replied
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2.5 mt-1 min-w-0">
                        <p className="text-[13.5px] text-[#475569] truncate">
                          {msg.latestPreview}
                        </p>

                        {/* Attachment Filename Pill when applicable */}
                        {msg.attachmentName && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F1F5F9] text-[#334155] border border-[#CBD5E1] text-[12px] font-medium shrink-0">
                            <Paperclip size={12} className="text-[#2563EB]" />
                            <span>{msg.attachmentName}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Message Date */}
                  <div className="text-right shrink-0">
                    <div className="text-[13px] font-medium text-[#475569]">
                      {formatMessageDisplayDate(msg.date, msg.time)}
                    </div>
                    <div className="text-[11.5px] text-[#94A3B8] mt-0.5">
                      Owner: {users.find((u) => u.id === msg.ownerId)?.name || 'Sibi Chakaravarthi'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bottom Bar: Total Count, Page-Size Dropdown, Previous / Next Pagination */}
          <div className="h-[48px] px-5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between text-[13.5px] text-[#475569] shrink-0">
            <div className="font-medium">
              Total Count: <strong className="text-[#1E293B]">{totalCount}</strong>
            </div>

            <div className="flex items-center gap-4">
              {/* Page-size dropdown */}
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="h-8 px-2.5 text-[13px] bg-white border border-[#CBD5E1] rounded text-[#1E293B] focus:outline-none focus:border-[#2563EB]"
              >
                <option value={10}>10 Records Per Page</option>
                <option value={20}>20 Records Per Page</option>
                <option value={50}>50 Records Per Page</option>
                <option value={100}>100 Records Per Page</option>
              </select>

              <span className="text-[13px] font-medium text-[#1E293B]">
                {startIdx} - {endIdx}
              </span>

              {/* Previous / Next Pagination */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="w-8 h-8 rounded border border-[#CBD5E1] bg-white flex items-center justify-center text-[#334155] hover:bg-[#F1F5F9] disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Previous Page"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="w-8 h-8 rounded border border-[#CBD5E1] bg-white flex items-center justify-center text-[#334155] hover:bg-[#F1F5F9] disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Next Page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
