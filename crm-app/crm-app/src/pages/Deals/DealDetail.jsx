import React, { useMemo, useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft, Tag, MoreHorizontal, ChevronLeft, ChevronRight, Check, X,
  Info, Edit2, Check as CheckIcon, X as XIcon, Phone, PhoneCall, Calendar,
  Clock3, FileText, Upload, Download, Trash2, Plus, ExternalLink, Mail,
  MessageSquare, User, Building2, Package, ShieldCheck, AlertCircle,
  HelpCircle, ChevronDown, ChevronUp, Copy, Printer, Share2, Sparkles,
  Paperclip, FileCheck, Layers, ArrowUpRight, ThumbsUp, ThumbsDown,
  CheckSquare, Settings2, SlidersHorizontal, Briefcase, Award, TrendingUp,
  FolderGit2, DollarSign, Send, CheckCircle2, ListFilter, RotateCw, Search
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import SidebarToggleButton from '../../components/common/SidebarToggleButton';
import Modal from '../../components/common/Modal';
import { useCRM } from '../../context/CRMContext';
import { useToast } from '../../components/common/Toast';
import TimelineHistoryView from '../../components/common/TimelineHistoryView';
import {
  fmtINR, fmtDate, fmtTime, fmtDuration, STAGES, STAGE_COLORS,
  STAGE_PROBABILITY, todayISO
} from '../../utils/calculations';
import { UserAvatar, PersonAvatar } from '../../components/common/Avatar';
import StatusBadge, { badgeTone } from '../../components/common/StatusBadge';
import {
  LANGUAGES, CATEGORIES_OPTIONS, JOB_TYPE_OPTIONS, JOB_TYPE_COLORS, PURPOSE_TRANSLATION_OPTIONS,
  DELIVERY_TYPE_OPTIONS, DELIVERY_TYPE_COLORS, SUBMISSION_STATUS_OPTIONS, SUBMISSION_STATUS_COLORS,
  FORECAST_CATEGORY_OPTIONS, FORECAST_CATEGORY_COLORS, CATEGORY_OPTIONS, TYPE_OPTIONS, APPROVAL_STATUS_OPTIONS,
  EST_READY_OPTIONS, PREVIOUS_PENDING_ESTIMATIONS_OPTIONS, LEAD_SOURCE_OPTIONS,
  LEAD_SOURCE_COLORS, STAGE_TEXT_COLORS, TERRITORY_OPTIONS,
  DEFAULT_DEAL_TAGS, DEFAULT_ORGANIZE_SECTIONS
} from './dealsConfig';
import {
  ArrowTagBadge, AddTagsDropdown, ManageTagsModal, OrganizeSectionsPanel, ManageLinksModal
} from './DealCustomizations';

// Product Catalog Reference for Deal Products
export const PRODUCT_CATALOG = [
  { id: 'prod-001', name: 'Document Translation Standard', code: 'TR-DOC-01', unitPrice: 25000, category: 'Translation' },
  { id: 'prod-002', name: 'Software Localization Suite', code: 'LOC-SW-02', unitPrice: 75000, category: 'Localization' },
  { id: 'prod-003', name: 'Multilingual DTP Package', code: 'DTP-PUB-03', unitPrice: 35000, category: 'DTP Services' },
  { id: 'prod-004', name: 'Consecutive Interpretation (Daily)', code: 'INT-CON-04', unitPrice: 20000, category: 'Interpretation' },
  { id: 'prod-005', name: 'Audio/Video Transcription Pro', code: 'TR-AV-05', unitPrice: 18000, category: 'Transcription' },
  { id: 'prod-006', name: 'Enterprise Cloud Backup & Archival', code: 'IT-CLD-06', unitPrice: 120000, category: 'Enterprise' },
  { id: 'prod-007', name: 'Custom CRM API Integration', code: 'CRM-API-07', unitPrice: 90000, category: 'Engineering' },
];

// Date formatter to DD/MM/YYYY matching Zoho CRM screenshots
export const fmtDMY = (dateStr) => {
  if (!dateStr) return '—';
  const clean = String(dateStr).split('T')[0].split(' ')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

/**
 * Zoho CRM Style Inline Dropdown Field
 * Matches Image 1 (Lead Source with Search & color dots)
 * and Image 2 (Submission Status with checkmarks & color dots).
 */
function ZohoDropdownField({
  label,
  value,
  options = [],
  colorMap = {},
  hasSearch = false,
  onSave,
  readOnly = false,
  placeholder = '-None-',
  displayAsBadge = false
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [tempValue, setTempValue] = useState(value || '');
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    setTempValue(value || '');
  }, [value]);

  // When editing starts, open popover immediately
  useEffect(() => {
    if (isEditing) {
      setIsOpen(true);
      setSearchQuery('');
    }
  }, [isEditing]);

  // Auto focus search input when opened
  useEffect(() => {
    if (isOpen && hasSearch && searchInputRef.current) {
      const timer = setTimeout(() => searchInputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, hasSearch]);

  // Click outside listener reverts unsaved selection and exits editing mode safely
  useEffect(() => {
    if (!isEditing) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setTempValue(value || '');
        setIsEditing(false);
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEditing, value]);

  const handleConfirmSave = (e) => {
    e?.stopPropagation();
    if (tempValue !== value) {
      onSave?.(tempValue);
    }
    setIsEditing(false);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleCancel = (e) => {
    e?.stopPropagation();
    setTempValue(value || '');
    setIsEditing(false);
    setIsOpen(false);
    setSearchQuery('');
  };

  const filteredOptions = useMemo(() => {
    if (!hasSearch || !searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase().trim();
    return options.filter(opt => opt.toLowerCase().includes(q));
  }, [options, searchQuery, hasSearch]);

  const currentColor = tempValue && tempValue !== '-None-' ? colorMap[tempValue] : undefined;
  const displayColor = value && value !== '-None-' ? colorMap[value] : undefined;

  if (!isEditing) {
    const hasValue = value && value !== '-None-';
    return (
      <div className="flex items-center gap-2 group/zoho min-h-[32px]">
        {hasValue ? (
          displayAsBadge ? (
            <span
              onClick={() => !readOnly && setIsEditing(true)}
              className="inline-flex px-3 py-0.5 rounded-full text-[11.5px] font-semibold text-white shadow-2xs transition-opacity hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: displayColor || '#DC2626' }}
              title={!readOnly ? `Click to edit ${label}` : undefined}
            >
              {value}
            </span>
          ) : (
            <div
              onClick={() => !readOnly && setIsEditing(true)}
              className="inline-flex items-center gap-2 cursor-pointer py-1 group/field select-none"
              title={!readOnly ? `Click to edit ${label}` : undefined}
            >
              {displayColor && (
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10"
                  style={{ backgroundColor: displayColor }}
                />
              )}
              <span className="text-[13px] text-slate-800 font-medium group-hover/field:text-[#4361EE] transition-colors">
                {value}
              </span>
            </div>
          )
        ) : (
          <span
            onClick={() => !readOnly && setIsEditing(true)}
            className="text-ink-400 font-medium text-[13px] cursor-pointer hover:text-ink select-none"
            title={!readOnly ? `Click to edit ${label}` : undefined}
          >
            —
          </span>
        )}
        {!readOnly && onSave && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-ink-300 hover:text-primary opacity-0 group-hover/zoho:opacity-100 transition-opacity p-0.5 rounded cursor-pointer"
            title={`Edit ${label}`}
          >
            <Edit2 size={12} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative inline-flex items-center gap-2 select-none z-50">
      {/* Active Trigger Select Input Box (Matches Reference Screenshots) */}
      <div
        onClick={() => setIsOpen(prev => !prev)}
        className="w-[260px] h-[34px] px-3 bg-white border-2 border-[#5468FF] rounded-md flex items-center justify-between cursor-pointer shadow-xs transition-all"
      >
        <div className="flex items-center gap-2 truncate flex-1">
          {currentColor && (
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10"
              style={{ backgroundColor: currentColor }}
            />
          )}
          <span className="text-[13px] text-slate-800 truncate font-normal">
            {tempValue || placeholder}
          </span>
        </div>
        <div className="shrink-0 text-slate-500 pl-1 text-[9px]">
          {isOpen ? '▲' : '▼'}
        </div>
      </div>

      {/* Action Buttons right next to trigger box (Blue Check Circle & Cancel Circle) */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={handleConfirmSave}
          className="w-6 h-6 rounded-full bg-[#4361EE] hover:bg-[#324DD8] text-white flex items-center justify-center transition-colors shadow-xs cursor-pointer"
          title="Save"
        >
          <Check size={13} strokeWidth={2.8} />
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="w-6 h-6 rounded-full border border-slate-400/80 bg-white hover:border-slate-600 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          title="Cancel"
        >
          <X size={12} strokeWidth={2.2} />
        </button>
      </div>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+3px)] w-[260px] bg-white border border-slate-200 rounded-md shadow-xl z-50 overflow-hidden text-left animate-in fade-in zoom-in-95 duration-100">
          {/* Search Header for Searchable Dropdown */}
          {hasSearch && (
            <div className="p-2 border-b border-slate-100 bg-white">
              <div className="relative flex items-center">
                <Search size={13} className="absolute left-2.5 text-slate-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder=""
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full h-7 pl-7 pr-2.5 text-[12px] bg-white border border-slate-200 rounded outline-none focus:border-[#4361EE] text-slate-800"
                />
              </div>
            </div>
          )}

          {/* Option Items List with scrolling */}
          <div className="max-h-[240px] overflow-y-auto thin-scroll py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-center text-[12px] text-slate-400">
                No matching options
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt === tempValue;
                const optColor = colorMap[opt];

                return (
                  <div
                    key={opt}
                    onClick={() => {
                      setTempValue(opt);
                    }}
                    className={`px-3 py-1.5 text-[13px] flex items-center gap-2 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#EEF2FF] text-slate-900 font-bold'
                        : 'text-slate-700 hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <span className="w-3.5 flex items-center justify-center shrink-0">
                      {isSelected && <Check size={13} className="text-slate-900" strokeWidth={2.8} />}
                    </span>
                    {optColor && opt !== '-None-' ? (
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10"
                        style={{ backgroundColor: optColor }}
                      />
                    ) : (
                      <span className="w-2.5 h-2.5 shrink-0" />
                    )}
                    <span className="truncate">{opt}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export const ALL_STAGE_HISTORY_FIELDS = [
  { id: 'Stage', label: 'Stage', mandatory: true },
  { id: 'Amount', label: 'Amount', mandatory: false },
  { id: 'Stage Duration (Calendar Days)', label: 'Stage Duration (Calendar Days)', mandatory: true },
  { id: 'Modified Time', label: 'Modified Time', mandatory: false },
  { id: 'Modified By', label: 'Modified By', mandatory: false },
  { id: 'Probability (%)', label: 'Probability (%)', mandatory: false },
  { id: 'Expected Revenue', label: 'Expected Revenue', mandatory: false },
  { id: 'Closing Date', label: 'Closing Date', mandatory: false },
  { id: 'Moved To', label: 'Moved To', mandatory: false },
];

/**
 * Deal Owner Hover Details Card & Click Trigger
 * Matches Screenshot 6 & Screenshot 7
 */
function DealOwnerDisplay({ deal, users = [], userName, onOpenChangeOwner }) {
  const [hovered, setHovered] = useState(false);
  const hoverTimeoutRef = useRef(null);

  const ownerName = userName ? userName(deal?.ownerId) : (deal?.ownerId || 'Marketing Department');
  const ownerUser = users.find(u => u.id === deal?.ownerId || u.name === deal?.ownerId || u.name === ownerName) || {
    id: deal?.ownerId || 'u-mkt',
    name: ownerName || 'Marketing Department',
    role: 'Lead Generation & Inbound',
    email: 'marketing@crm.in',
    mobile: '+91 98400 11223',
    phone: '044-24567800',
    color: '#0284C7'
  };

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHovered(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHovered(false);
    }, 250);
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span
        onClick={onOpenChangeOwner}
        className="text-ink font-medium hover:text-[#4361EE] cursor-pointer hover:underline transition-colors select-none"
        title="Click to Change Deal Owner"
      >
        {ownerName}
      </span>

      {/* User Information Popup (Matches Screenshot 7) */}
      {hovered && (
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="absolute left-0 top-[calc(100%+8px)] w-[280px] bg-white border border-slate-200 rounded-xl shadow-2xl p-4 z-50 text-left animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-[14px] shrink-0 shadow-xs"
              style={{ backgroundColor: ownerUser.color || '#4361EE' }}
            >
              {ownerUser.name ? ownerUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-[14px] font-bold text-slate-900 truncate leading-tight">
                {ownerUser.name}
              </h4>
              {ownerUser.role && (
                <p className="text-[11.5px] text-slate-500 font-medium truncate mt-0.5">
                  {ownerUser.role}
                </p>
              )}
            </div>
          </div>

          <div className="pt-3 space-y-2 text-[12.5px]">
            {ownerUser.email && (
              <div className="flex items-center gap-2.5 text-slate-700">
                <Mail size={13} className="text-slate-400 shrink-0" />
                <span className="truncate">{ownerUser.email}</span>
              </div>
            )}
            {ownerUser.mobile && (
              <div className="flex items-center gap-2.5 text-slate-700">
                <Phone size={13} className="text-slate-400 shrink-0" />
                <span className="truncate">{ownerUser.mobile}</span>
              </div>
            )}
            {ownerUser.phone && (
              <div className="flex items-center gap-2.5 text-slate-700">
                <PhoneCall size={13} className="text-slate-400 shrink-0" />
                <span className="truncate">{ownerUser.phone}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Change Owner Modal
 * Matches Screenshot 6
 */
function ChangeOwnerModal({ open, deal, users = [], onClose, onSave }) {
  const [selectedUserId, setSelectedUserId] = useState(deal?.ownerId || '');
  const [isOpenSelect, setIsOpenSelect] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    setSelectedUserId(deal?.ownerId || '');
    setIsOpenSelect(false);
    setSearchQuery('');
  }, [open, deal?.ownerId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpenSelect(false);
      }
    };
    if (isOpenSelect) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpenSelect]);

  if (!open) return null;

  const selectedUser = users.find(u => u.id === selectedUserId || u.name === selectedUserId);
  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.role && u.role.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const isValidSelection = !!selectedUserId && selectedUserId !== deal?.ownerId;

  const handleConfirm = () => {
    if (!selectedUserId) return;
    onSave(selectedUserId);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 animate-in fade-in duration-150">
      <div className="w-[490px] max-w-[95vw] bg-white rounded-xl shadow-2xl p-6 text-left relative animate-in zoom-in-95 duration-150">
        <h3 className="text-[18px] font-bold text-slate-800 mb-6">Change Owner</h3>

        <div className="flex items-center gap-3 mb-8">
          <label className="text-[13px] text-slate-600 font-medium w-[90px] text-right shrink-0">
            Deal Owner
          </label>
          <div ref={dropdownRef} className="relative flex-1">
            <div
              onClick={() => setIsOpenSelect(prev => !prev)}
              className="w-full h-[36px] bg-white border border-[#5468FF] rounded-md px-3 flex items-center justify-between text-[13px] cursor-pointer shadow-xs"
            >
              <span className={`truncate ${selectedUser ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
                {selectedUser ? selectedUser.name : 'Select User'}
              </span>
              <div className="flex items-center gap-1.5 text-slate-500 shrink-0">
                <span className="text-[9px]">{isOpenSelect ? '▲' : '▼'}</span>
                <User size={14} className="text-slate-700 ml-1" />
              </div>
            </div>

            {isOpenSelect && (
              <div className="absolute left-0 top-[calc(100%+4px)] w-full bg-white border border-slate-200 rounded-md shadow-xl z-50 overflow-hidden text-left animate-in fade-in zoom-in-95 duration-100">
                <div className="p-2 border-b border-slate-100 bg-white">
                  <div className="relative flex items-center">
                    <Search size={13} className="absolute left-2.5 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search user..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full h-7 pl-7 pr-2.5 text-[12px] bg-white border border-slate-200 rounded outline-none focus:border-[#4361EE] text-slate-800"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="max-h-[200px] overflow-y-auto thin-scroll py-1">
                  {filteredUsers.length === 0 ? (
                    <div className="px-3 py-2 text-center text-[12px] text-slate-400">
                      No matching users
                    </div>
                  ) : (
                    filteredUsers.map(u => {
                      const isSelected = u.id === selectedUserId;
                      return (
                        <div
                          key={u.id}
                          onClick={() => {
                            setSelectedUserId(u.id);
                            setIsOpenSelect(false);
                          }}
                          className={`px-3 py-1.5 text-[13px] flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected ? 'bg-[#EEF2FF] text-[#1D4ED8] font-bold' : 'text-slate-700 hover:bg-[#F8FAFC]'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10.5px] font-bold shrink-0"
                              style={{ backgroundColor: u.color || '#4361EE' }}
                            >
                              {u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </span>
                            <span className="truncate">{u.name}</span>
                          </div>
                          {u.role && (
                            <span className="text-[11px] text-slate-400 shrink-0 ml-2">
                              {u.role}
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-[13px] font-medium text-slate-700 bg-[#F1F5F9] hover:bg-slate-200 border border-slate-300 rounded transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isValidSelection}
            className={`px-4 py-1.5 text-[13px] font-medium rounded transition-colors shadow-xs ${
              isValidSelection
                ? 'bg-[#7B8BFA] hover:bg-[#5468FF] text-white cursor-pointer'
                : 'bg-[#94A3B8]/60 text-white cursor-not-allowed'
            }`}
          >
            Change Owner
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function EditableField({
  label, value, type = 'text', options = [], onSave, badgeClass, readOnly, linkTo, prefix, info, customRender
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(value || '');

  useEffect(() => {
    setVal(value || '');
  }, [value]);

  const handleSave = () => {
    if (val !== (value || '')) {
      onSave?.(val);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setVal(value || '');
    setIsEditing(false);
  };

  return (
    <div className="grid grid-cols-[160px_1fr] items-start gap-4 text-[13px] group py-1.5 min-h-[32px]">
      <span className="text-ink-500 text-right mt-[2px] select-none flex items-center justify-end gap-1">
        <span>{label}</span>
        {info && (
          <span title={info} className="text-ink-400 hover:text-ink cursor-help shrink-0">
            <Info size={13} />
          </span>
        )}
      </span>
      <div className="min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-1">
            {type === 'select' ? (
              <select className="input-field py-1 px-2 text-[13px] w-full max-w-[220px]" value={val} onChange={e => setVal(e.target.value)}>
                <option value="">-None-</option>
                {options.map(o => (
                  <option key={o.value || o} value={o.value || o}>{o.label || o}</option>
                ))}
              </select>
            ) : type === 'textarea' ? (
              <textarea className="input-field py-1 px-2 text-[13px] w-full" rows={3} value={val} onChange={e => setVal(e.target.value)} />
            ) : type === 'number' ? (
              <input type="number" className="input-field py-1 px-2 text-[13px] w-full max-w-[200px]" value={val} onChange={e => setVal(e.target.value)} />
            ) : type === 'date' ? (
              <input type="date" className="input-field py-1 px-2 text-[13px] w-full max-w-[200px]" value={val} onChange={e => setVal(e.target.value)} />
            ) : (
              <input type="text" className="input-field py-1 px-2 text-[13px] w-full max-w-[220px]" value={val} onChange={e => setVal(e.target.value)} />
            )}
            <button type="button" onClick={handleSave} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Save"><CheckIcon size={14} /></button>
            <button type="button" onClick={handleCancel} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Cancel"><XIcon size={14} /></button>
          </div>
        ) : customRender ? (
          customRender
        ) : (
          <div className="flex items-center gap-2">
            <span className={`text-ink ${!value ? 'text-ink-300' : 'font-medium'} ${badgeClass && value ? badgeClass : ''}`}>
              {linkTo && value ? (
                <Link to={linkTo} className="text-primary hover:underline font-semibold flex items-center gap-1">
                  <span>{prefix ? `${prefix} ` : ''}{value}</span>
                  <ExternalLink size={12} className="opacity-60" />
                </Link>
              ) : (
                value ? `${prefix ? `${prefix} ` : ''}${type === 'number' && prefix === '₹' ? fmtINR(value).replace('₹', '') : value}` : '—'
              )}
            </span>
            {!readOnly && onSave && (
              <button type="button" onClick={() => setIsEditing(true)} className="text-ink-300 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded cursor-pointer" title="Edit field">
                <Edit2 size={12} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Stage Chevron segment in the horizontal Progress Bar
 * Uses ThumbsUp for Closed Won and Job Seeking, ThumbsDown for Closed Lost and Pre-Deal Lost per requirements.
 * Shows dropdown arrow on active stage.
 */
function StageChevron({ stage, current, onClick }) {
  const isCurrent = stage === current;
  const hasThumbsUp = stage === 'Deal Closed (Won)' || stage === 'Closed Won' || stage === 'Deal Job Seeking& Agency' || stage === 'Deal Job Seeking & Agency';
  const hasThumbsDown = stage === 'Deal Closed (Lost)' || stage === 'Pre- Deal Lost' || stage === 'Pre-Deal Lost' || stage === 'Closed Lost';

  // Only the active/selected stage receives its configured background and text color.
  // Inactive stages remain neutral white.
  const activeBg = STAGE_COLORS[stage] || '#FDE68A';
  const activeText = STAGE_TEXT_COLORS[stage] || '#1F2937';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center justify-center h-8 text-[12px] min-w-max px-3.5 group transition-all select-none cursor-pointer ${
        isCurrent
          ? 'font-bold ring-2 ring-primary ring-offset-1 z-30 scale-[1.02] shadow-sm border-y border-l border-transparent'
          : 'bg-white text-ink-600 font-medium hover:bg-slate-50 hover:text-ink border-y border-l border-slate-200 z-10'
      }`}
      style={isCurrent ? { backgroundColor: activeBg, color: activeText } : undefined}
      title={`Stage: ${stage}${isCurrent ? ' (Active Stage)' : ''}`}
    >
      <div className="relative z-10 flex items-center gap-1.5 truncate">
        {hasThumbsUp && (
          <ThumbsUp
            size={12}
            className="shrink-0"
            style={isCurrent ? { color: activeText } : { color: '#64748B' }}
          />
        )}
        {hasThumbsDown && (
          <ThumbsDown
            size={12}
            className="shrink-0"
            style={isCurrent ? { color: activeText } : { color: '#64748B' }}
          />
        )}
        <span className="truncate">{stage}</span>
        {isCurrent && (
          <ChevronDown size={12} className="shrink-0 ml-0.5 opacity-90" />
        )}
      </div>
      <div className="absolute right-[-10px] top-0 bottom-0 w-[20px] overflow-hidden z-20 pointer-events-none">
        <div
          className={`h-full w-full origin-left transform scale-[0.707] rotate-45 translate-x-[-50%] ${
            isCurrent ? 'border-r border-t border-transparent' : 'border-r border-t border-slate-200 group-hover:bg-slate-50'
          }`}
          style={{ backgroundColor: isCurrent ? activeBg : '#FFFFFF' }}
        />
      </div>
    </button>
  );
}

/**
 * Stage Transition Modal (Zoho CRM Review/Verify Details Popup)
 * Exactly matches the 4 user reference screenshots:
 * 1. Deal Closed (Lost) -> "Review Details" with "Reason for Closed lost" textarea
 * 2. Pre- Deal Lost -> "Verify Details" with "Since Stage IS Closed Lost (Record Category)...", Amount and Closing Date
 * 3. Deal Job Seeking& Agency -> "Review Details" with "Sales_No" text input
 * 4. Deal Closed (Won) -> "Review Details" with "Sales_No" text input
 */
function StageTransitionModal({ open, targetStage, deal, onClose, onSave }) {
  const [formData, setFormData] = useState({});
  const [error, setError] = useState('');

  const isPreLost = targetStage === 'Pre- Deal Lost' || targetStage === 'Pre-Deal Lost';
  const isJobAgency = targetStage === 'Deal Job Seeking& Agency' || targetStage === 'Deal Job Seeking & Agency';
  const isWon = targetStage === 'Deal Closed (Won)' || targetStage === 'Closed Won';
  const isLost = targetStage === 'Deal Closed (Lost)' || targetStage === 'Closed Lost';

  useEffect(() => {
    if (open && deal) {
      setFormData({
        salesNo: deal.salesNo || 'SL-' + Math.floor(10000 + Math.random() * 90000),
        amount: deal.amount !== undefined ? deal.amount : '',
        closingDate: deal.closingDate || todayISO(),
        reasonForLost: deal.reasonForLost || ''
      });
      setError('');
    }
  }, [open, deal]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSave = () => {
    if (isWon || isJobAgency) {
      if (!formData.salesNo?.toString().trim()) {
        setError('Sales_No is required');
        return;
      }
      onSave({ salesNo: formData.salesNo.toString().trim() });
    } else if (isPreLost) {
      if (!formData.closingDate) {
        setError('Closing Date is required');
        return;
      }
      onSave({
        amount: formData.amount !== '' ? Number(formData.amount) : deal.amount,
        closingDate: formData.closingDate
      });
    } else if (isLost) {
      if (!formData.reasonForLost?.trim()) {
        setError('Reason for Closed lost is required');
        return;
      }
      onSave({ reasonForLost: formData.reasonForLost.trim() });
    } else {
      onSave({});
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 select-none"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[540px] p-6 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <h2 className="text-[18px] font-bold text-[#1E293B]">
          {isPreLost ? 'Verify Details' : 'Review Details'}
        </h2>

        {/* Subtitle for Verify Details (Pre- Deal Lost) */}
        {isPreLost && (
          <p className="text-[13.5px] text-[#475569] mt-3 mb-5 leading-normal">
            Since <strong className="text-[#1E293B] font-bold">Stage IS Closed Lost</strong>{' '}
            <span className="text-[#64748B] font-medium">(Record Category)</span> , verify the following details
          </p>
        )}

        {/* Error notification */}
        {error && (
          <div className="my-3 text-[12.5px] text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-md font-medium">
            {error}
          </div>
        )}

        {/* Horizontal Two-Column Field Layout matching screenshots */}
        <div className={`space-y-4 ${isPreLost ? '' : 'mt-5'}`}>
          {/* Sales_No for Deal Closed (Won) and Deal Job Seeking& Agency */}
          {(isWon || isJobAgency) && (
            <div className="grid grid-cols-[160px_1fr] items-center gap-4">
              <label className="text-[13.5px] font-medium text-[#475569] text-right">
                Sales_No
              </label>
              <div>
                <input
                  type="text"
                  value={formData.salesNo || ''}
                  onChange={(e) => {
                    setFormData({ ...formData, salesNo: e.target.value });
                    if (error) setError('');
                  }}
                  className="w-full h-[36px] px-3 text-[13.5px] text-[#1E293B] bg-white rounded-md border border-[#818CF8] border-l-[3.5px] border-l-[#EF4444] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Amount & Closing Date for Pre- Deal Lost */}
          {isPreLost && (
            <>
              <div className="grid grid-cols-[160px_1fr] items-center gap-4">
                <label className="text-[13.5px] font-medium text-[#475569] text-right">
                  Amount
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => {
                      setFormData({ ...formData, amount: e.target.value });
                      if (error) setError('');
                    }}
                    className="w-full h-[36px] pl-3 pr-8 text-[13.5px] text-[#1E293B] bg-white rounded-md border border-[#818CF8] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
                    placeholder="0"
                    autoFocus
                  />
                  <div className="absolute right-2.5 text-[#64748B] pointer-events-none" title="Deal amount">
                    <Info size={15} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-[160px_1fr] items-center gap-4">
                <label className="text-[13.5px] font-medium text-[#475569] text-right">
                  Closing Date
                </label>
                <div>
                  <input
                    type="date"
                    value={formData.closingDate || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, closingDate: e.target.value });
                      if (error) setError('');
                    }}
                    className="w-full h-[36px] px-3 text-[13.5px] text-[#1E293B] bg-white rounded-md border border-[#CBD5E1] border-l-[3.5px] border-l-[#EF4444] focus:border-[#818CF8] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
                  />
                </div>
              </div>
            </>
          )}

          {/* Reason for Closed lost for Deal Closed (Lost) */}
          {isLost && (
            <div className="grid grid-cols-[160px_1fr] items-start gap-4">
              <label className="text-[13.5px] font-medium text-[#475569] text-right pt-2">
                Reason for Closed lost
              </label>
              <div>
                <textarea
                  value={formData.reasonForLost || ''}
                  onChange={(e) => {
                    setFormData({ ...formData, reasonForLost: e.target.value });
                    if (error) setError('');
                  }}
                  rows={2}
                  className="w-full p-2.5 text-[13.5px] text-[#1E293B] bg-white rounded-md border border-[#818CF8] border-l-[3.5px] border-l-[#EF4444] resize-y focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
                  placeholder=""
                  autoFocus
                />
              </div>
            </div>
          )}
        </div>

        {/* Buttons (Bottom Right) */}
        <div className="flex items-center justify-end gap-2.5 mt-6 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="h-[34px] px-4 rounded-md border border-[#E2E8F0] bg-white text-[#334155] text-[13px] font-medium hover:bg-[#F8FAFC] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="h-[34px] px-5 rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13px] font-semibold transition-colors shadow-xs cursor-pointer"
          >
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}


export default function DealDetail({ id, onClose, onEdit }) {
  const {
    deals, calls, contacts, accounts, users, invoices, tasks,
    userName, accountName, contactName, updateRecord, deleteRecord, createRecord
  } = useCRM();
  const toast = useToast();
  const navigate = useNavigate();

  const deal = deals.find(d => d.id === id);
  const scrollRef = useRef(null);
  const stageBarRef = useRef(null);
  const currentStageRef = useRef(null);

  const [activeTab, setActiveTab] = useState('Overview');
  const [activeSection, setActiveSection] = useState('section-deal-info');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [transitionTarget, setTransitionTarget] = useState(null);
  const [previewStage, setPreviewStage] = useState(null);

  const currentActiveStage = previewStage || deal?.stage;

  // Closed Activities View mode & subtab
  const [closedActivitiesOpen, setClosedActivitiesOpen] = useState(true);
  const [closedActivityTab, setClosedActivityTab] = useState(() => {
    return sessionStorage.getItem('deal_detail_closed_tab') || 'calls';
  });
  const [closedViewMode, setClosedViewMode] = useState('Tab View'); // 'Tab View' | 'Column View' | 'Chronological View'

  // Open Activities subtab & add new menu
  const [openActivitiesOpen, setOpenActivitiesOpen] = useState(true);
  const [openActivityTab, setOpenActivityTab] = useState('all');
  const [openActivityMenuOpen, setOpenActivityMenuOpen] = useState(false);

  // Stage History Customize List Popup (Matches Screenshot 2)
  const [customizePopupOpen, setCustomizePopupOpen] = useState(false);
  const [customizeSearch, setCustomizeSearch] = useState('');
  const [stageHistoryCols, setStageHistoryCols] = useState(() => {
    try {
      const saved = localStorage.getItem('deal_stage_history_cols');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return ['Stage', 'Amount', 'Stage Duration (Calendar Days)', 'Modified Time', 'Modified By'];
  });
  const [tempStageCols, setTempStageCols] = useState(() => {
    try {
      const saved = localStorage.getItem('deal_stage_history_cols');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return ['Stage', 'Amount', 'Stage Duration (Calendar Days)', 'Modified Time', 'Modified By'];
  });
  const customizePopupRef = useRef(null);

  // Change Deal Owner Modal (Matches Screenshot 6)
  const [changeOwnerModalOpen, setChangeOwnerModalOpen] = useState(false);

  // Organize Potentials Details Panel (Matches Screenshot 1)
  const [organizeSections, setOrganizeSections] = useState(() => {
    try {
      const saved = localStorage.getItem('deal_related_sections_order');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_ORGANIZE_SECTIONS;
  });
  const [organizePanelOpen, setOrganizePanelOpen] = useState(false);

  // Manage Tags and Add Tags Dropdown (Matches Screenshots 3, 4, 5)
  const [allTags, setAllTags] = useState(() => {
    try {
      const saved = localStorage.getItem('crm_all_tags');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_DEAL_TAGS;
  });
  const [addTagsDropdownOpen, setAddTagsDropdownOpen] = useState(false);
  const addTagsBtnRef = useRef(null);
  const [manageTagsModalOpen, setManageTagsModalOpen] = useState(false);

  const tagColorMap = useMemo(() => {
    const map = {};
    allTags.forEach(t => { map[t.name] = t.color; });
    return map;
  }, [allTags]);

  // Manage Links Modal (Matches Screenshot 2)
  const [manageLinksModalOpen, setManageLinksModalOpen] = useState(false);

  // Modals state
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailData, setEmailData] = useState({ to: '', subject: '', body: '' });
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityForm, setActivityForm] = useState({ type: 'Task', title: '', dueDate: todayISO(), ownerId: 'u1', priority: 'High', status: 'Open' });
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [selectedCatalogProduct, setSelectedCatalogProduct] = useState('');
  const [productQuantity, setProductQuantity] = useState(1);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);

  // Overview & Sections state
  const [detailsHidden, setDetailsHidden] = useState(false);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [attachLinkModalOpen, setAttachLinkModalOpen] = useState(false);
  const [attachLinkTitle, setAttachLinkTitle] = useState('');
  const [attachLinkUrl, setAttachLinkUrl] = useState('');
  const [emailSubTab, setEmailSubTab] = useState('Mails'); // 'Mails' | 'Drafts' | 'Scheduled'
  
  // Zoho Projects Dropdown (Matches Screenshot 1)
  const [projectsFilter, setProjectsFilter] = useState('Active Projects');
  const [projectsDropdownOpen, setProjectsDropdownOpen] = useState(false);
  const projectsFilterRef = useRef(null);

  // Notes Dropdown (Matches Screenshot 3)
  const [notesFilter, setNotesFilter] = useState('Recent Last');
  const [notesDropdownOpen, setNotesDropdownOpen] = useState(false);
  const notesFilterRef = useRef(null);

  const [scoringViewMode, setScoringViewMode] = useState('list'); // 'list' | 'chart'

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (customizePopupRef.current && !customizePopupRef.current.contains(e.target)) {
        setCustomizePopupOpen(false);
        setTempStageCols(stageHistoryCols);
      }
      if (projectsFilterRef.current && !projectsFilterRef.current.contains(e.target)) {
        setProjectsDropdownOpen(false);
      }
      if (notesFilterRef.current && !notesFilterRef.current.contains(e.target)) {
        setNotesDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [stageHistoryCols]);

  // Contact Roles state
  const [contactRolesList, setContactRolesList] = useState(() => {
    try {
      const saved = localStorage.getItem(`deal_contact_roles_${deal?.id}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    if (deal?.contactId) {
      return [
        {
          id: `cr-${deal.contactId}`,
          contactId: deal.contactId,
          name: contactName(deal.contactId),
          phone: '+91 98401 23456',
          email: 'contact@client.in',
          role: 'Decision Maker'
        }
      ];
    }
    return [];
  });
  const [contactRolesModalOpen, setContactRolesModalOpen] = useState(false);
  const [newContactRole, setNewContactRole] = useState({ contactId: '', role: 'Decision Maker' });

  // Record Detail Page Views
  const [recordViewMode, setRecordViewMode] = useState('Standard View');
  const [recordViewDropdownOpen, setRecordViewDropdownOpen] = useState(false);

  // Notes state
  const [noteInput, setNoteInput] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteText, setEditingNoteText] = useState('');

  // Attachments input ref
  const fileInputRef = useRef(null);

  const contact = contacts.find(c => c.id === deal?.contactId);
  const account = accounts.find(a => a.id === deal?.accountId);

  // Auto-scroll the active stage segment into view
  useEffect(() => {
    if (currentStageRef.current) {
      currentStageRef.current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [currentActiveStage]);

  // Stage Progress Bar smooth scrolling with arrows
  const scrollStageBar = (direction) => {
    if (stageBarRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      stageBarRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Synchronize related calls to deal
  useEffect(() => {
    if (!deal || !calls.length) return;
    const directMatches = calls.filter(c => c.dealId === deal.id || (deal.contactId && c.contactId === deal.contactId));
    if (directMatches.length === 0) {
      const comp = calls.find(c => c.status === 'Completed' && !c.dealId);
      if (comp) {
        updateRecord('calls', comp.id, {
          dealId: deal.id,
          contactId: deal.contactId || comp.contactId,
          accountId: deal.accountId || comp.accountId
        });
      }
      const sched = calls.find(c => c.status === 'Scheduled' && !c.dealId);
      if (sched) {
        updateRecord('calls', sched.id, {
          dealId: deal.id,
          contactId: deal.contactId || sched.contactId,
          accountId: deal.accountId || sched.accountId
        });
      }
    }
  }, [deal?.id, calls.length]);

  // Related Calls
  const dealCalls = useMemo(() => {
    if (!deal) return [];
    return calls.filter(c =>
      c.dealId === deal.id ||
      (deal.contactId && c.contactId === deal.contactId) ||
      (deal.accountId && c.accountId === deal.accountId)
    );
  }, [calls, deal]);

  const closedCalls = useMemo(() => dealCalls.filter(c => c.status === 'Completed'), [dealCalls]);
  const openCalls = useMemo(() => dealCalls.filter(c => c.status === 'Scheduled'), [dealCalls]);

  // Related Tasks
  const dealTasks = useMemo(() => {
    if (!deal) return [];
    return (tasks || []).filter(t => t.recordId === deal.id || t.dealId === deal.id);
  }, [tasks, deal]);

  const openTasks = useMemo(() => dealTasks.filter(t => t.status !== 'Completed'), [dealTasks]);
  const closedTasks = useMemo(() => dealTasks.filter(t => t.status === 'Completed'), [dealTasks]);

  // Meetings
  const [meetings, setMeetings] = useState(() => {
    try {
      const saved = localStorage.getItem(`deal_meetings_${deal?.id}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      { id: `meet-01`, title: 'Initial Project Scope Meeting', date: '2026-10-06 14:00', duration: '45 mins', host: deal?.ownerId || 'u1', status: 'Completed', notes: 'Defined scope, translation languages and target delivery timeline.' }
    ];
  });

  const openMeetings = useMemo(() => meetings.filter(m => m.status === 'Scheduled'), [meetings]);
  const closedMeetings = useMemo(() => meetings.filter(m => m.status === 'Completed'), [meetings]);

  // Combined Activities counts
  const totalOpenActivities = openCalls.length + openTasks.length + openMeetings.length;
  const totalClosedActivities = closedCalls.length + closedTasks.length + closedMeetings.length;

  // Notes list from deal record or localStorage
  const notesList = useMemo(() => {
    if (deal?.notesList && Array.isArray(deal.notesList)) return deal.notesList;
    try {
      const saved = localStorage.getItem(`deal_notes_${deal?.id}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      { id: 'note-01', text: 'Client requested rush delivery for German and Japanese language versions.', author: 'Arun Kumar', createdAt: '2026-10-09T14:30:00Z' }
    ];
  }, [deal?.notesList, deal?.id]);

  // Attachments list
  const attachmentsList = useMemo(() => {
    if (deal?.attachmentsList && Array.isArray(deal.attachmentsList)) return deal.attachmentsList;
    try {
      const saved = localStorage.getItem(`deal_attachments_${deal?.id}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      { id: 'att-01', name: 'Scope_of_Work_V2.pdf', size: '340 KB', type: 'application/pdf', uploadedBy: 'Divya R', uploadedAt: '2026-10-08T10:15:00Z' }
    ];
  }, [deal?.attachmentsList, deal?.id]);

  // Products list
  const productsList = useMemo(() => {
    if (deal?.productsList && Array.isArray(deal.productsList)) return deal.productsList;
    try {
      const saved = localStorage.getItem(`deal_products_${deal?.id}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      { id: 'prod-001', name: 'Document Translation Standard', code: 'TR-DOC-01', unitPrice: 25000, quantity: 2, total: 50000 },
      { id: 'prod-003', name: 'Multilingual DTP Package', code: 'DTP-PUB-03', unitPrice: 35000, quantity: 1, total: 35000 },
    ];
  }, [deal?.productsList, deal?.id]);

  // Stage History list (strictly preserved, newest first, real dates)
  const stageHistoryList = useMemo(() => {
    if (deal?.stageHistory && Array.isArray(deal.stageHistory) && deal.stageHistory.length > 0) {
      return deal.stageHistory;
    }
    return [
      {
        id: `sh-init-${deal?.id || '01'}`,
        stage: deal?.stage || 'Need Deal Estimation',
        amount: deal?.amount || 0,
        probability: deal?.probability || 10,
        modifiedBy: deal?.ownerId || 'u1',
        modifiedTime: deal?.createdOn ? `${deal.createdOn} 10:00` : '2026-10-01 10:00'
      }
    ];
  }, [deal?.stageHistory, deal?.stage, deal?.amount, deal?.probability, deal?.ownerId, deal?.createdOn, deal?.id]);

  // Calculate Stage Duration in Calendar Days
  const calculateStageDuration = (historyList, index) => {
    if (!historyList || !historyList[index]) return '—';
    const currentEntry = historyList[index];
    const currentTime = new Date(currentEntry.modifiedTime.replace(' ', 'T')).getTime();

    if (index === 0) {
      const now = Date.now();
      const diffDays = Math.max(0, Math.round((now - currentTime) / (1000 * 60 * 60 * 24)));
      return diffDays === 0 ? 'Today' : `${diffDays} Days`;
    }

    const newerEntry = historyList[index - 1];
    const newerTime = new Date(newerEntry.modifiedTime.replace(' ', 'T')).getTime();
    const diffDays = Math.max(0, Math.round((newerTime - currentTime) / (1000 * 60 * 60 * 24)));
    return diffDays === 0 ? 'Same Day' : `${diffDays} Days`;
  };

  // Emails list
  const emailsList = useMemo(() => {
    return [
      { id: 'em-01', to: contact?.email || 'client@company.in', subject: `Scope of Translation Deal - ${deal?.name}`, date: '2026-10-10 16:30', status: 'Delivered', sender: 'Arun Kumar' },
      { id: 'em-02', to: contact?.email || 'client@company.in', subject: 'Estimation & Milestone Acceptance', date: '2026-10-08 11:20', status: 'Opened', sender: 'Divya R' }
    ];
  }, [contact?.email, deal?.name]);

  // Zoho Projects
  const projectsList = useMemo(() => {
    return [
      { id: 'prj-01', name: `${deal?.name} Execution`, status: 'In Progress', progress: 65, milestones: 4, owner: userName(deal?.ownerId) }
    ];
  }, [deal?.name, deal?.ownerId, userName]);

  // Related Invoices (filtered by dealId or accountId)
  const dealInvoices = useMemo(() => {
    if (!deal) return [];
    return invoices.filter(i => (i.dealId && i.dealId === deal.id) || (deal.accountId && i.accountId === deal.accountId));
  }, [invoices, deal]);

  // Related Estimates (with localStorage persistence fallback)
  const [dealEstimates, setDealEstimates] = useState(() => {
    try {
      const saved = localStorage.getItem(`deal_estimates_${deal?.id}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return deal?.estimates && Array.isArray(deal.estimates) ? deal.estimates : [];
  });

  // Related Sales Orders (with localStorage persistence fallback)
  const [dealSalesOrders, setDealSalesOrders] = useState(() => {
    try {
      const saved = localStorage.getItem(`deal_sales_orders_${deal?.id}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return deal?.salesOrders && Array.isArray(deal.salesOrders) ? deal.salesOrders : [];
  });

  // Total Zoho Finance Records count
  const totalFinanceRecords = dealEstimates.length + dealSalesOrders.length + dealInvoices.length;

  const [isRefreshingFinance, setIsRefreshingFinance] = useState(false);
  const handleRefreshFinance = () => {
    setIsRefreshingFinance(true);
    setTimeout(() => {
      setIsRefreshingFinance(false);
      toast.success('Zoho Finance records refreshed.');
    }, 450);
  };

  // Finance creation modals & handlers
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    number: '',
    amount: deal?.amount || 0,
    dueDate: todayISO(),
    status: 'Pending',
  });

  const handleNewFinance = (type) => {
    if (type === 'Estimate') {
      toast.info('New Estimate: Form is not yet configured in this version.');
    } else if (type === 'Sales Order') {
      toast.info('New Sales Order: Form is not yet configured in this version.');
    } else if (type === 'Invoice') {
      setInvoiceForm({
        number: `INV-${Math.floor(10000 + Math.random() * 90000)}`,
        amount: deal?.amount || 0,
        dueDate: todayISO(),
        status: 'Pending',
      });
      setInvoiceModalOpen(true);
    }
  };

  const handleSaveInvoice = () => {
    if (!invoiceForm.number.trim()) {
      toast.error('Invoice Number is required.');
      return;
    }
    const created = createRecord('invoices', {
      number: invoiceForm.number.trim(),
      amount: Number(invoiceForm.amount) || 0,
      paidAmount: 0,
      invoiceDate: todayISO(),
      dueDate: invoiceForm.dueDate || todayISO(),
      status: invoiceForm.status || 'Pending',
      type: 'Sales Invoice',
      dealId: deal.id,
      accountId: deal.accountId || '',
      contactId: deal.contactId || ''
    });
    setInvoiceModalOpen(false);
    toast.success(`Invoice ${created.number} created successfully.`);
  };

  // Links state (managed via Screenshot 2 Manage Links)
  const [dealLinks, setDealLinks] = useState(() => {
    try {
      const saved = localStorage.getItem('deal_managed_links');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    try {
      const savedDeal = localStorage.getItem(`deal_links_${deal?.id}`);
      if (savedDeal) return JSON.parse(savedDeal);
    } catch (e) {}
    return deal?.links && Array.isArray(deal.links) && deal.links.length > 0
      ? deal.links
      : [
          {
            id: 'lnk-01',
            name: 'Client Portal',
            title: 'Client Portal',
            url: 'https://client-portal.lingo.in',
            description: 'Access client translation project specifications and assets',
            profilesPermitted: 'All Profiles',
            lastModified: '12/10/2026 01:21 PM'
          }
        ];
  });

  const handleUpdateLinks = (next) => {
    setDealLinks(next);
    try {
      localStorage.setItem('deal_managed_links', JSON.stringify(next));
      localStorage.setItem(`deal_links_${deal.id}`, JSON.stringify(next));
    } catch (e) {}
  };

  // Add Related List Modal
  const [addRelatedListOpen, setAddRelatedListOpen] = useState(false);
  const [availableRelatedLists, setAvailableRelatedLists] = useState([
    { id: 'competitors', label: 'Competitors', active: false },
    { id: 'cases', label: 'Cases', active: false },
    { id: 'solutions', label: 'Solutions', active: false },
    { id: 'anomaly', label: 'Anomaly Deals', active: false },
    { id: 'zoho-sign', label: 'Zoho Sign Documents', active: false },
  ]);

  // Chronological unified completed activities
  const chronologicalClosedActivities = useMemo(() => {
    const list = [
      ...closedCalls.map(c => ({
        id: c.id,
        type: 'Call',
        title: c.subject,
        time: c.dateTime,
        duration: fmtDuration(c.duration),
        owner: userName(c.ownerId),
        status: c.status,
        rawCall: c
      })),
      ...closedTasks.map(t => ({
        id: t.id,
        type: 'Task',
        title: t.title,
        time: t.dueDate,
        duration: '—',
        owner: userName(t.ownerId),
        status: t.status,
        rawTask: t
      })),
      ...closedMeetings.map(m => ({
        id: m.id,
        type: 'Meeting',
        title: m.title,
        time: m.date,
        duration: m.duration,
        owner: userName(m.host),
        status: m.status,
        rawMeeting: m
      }))
    ];
    return list.sort((a, b) => String(b.time).localeCompare(String(a.time)));
  }, [closedCalls, closedTasks, closedMeetings, userName]);

  // Intersection observer for section tracking
  useEffect(() => {
    if (activeTab !== 'Overview') return;
    const observer = new IntersectionObserver((entries) => {
      const intersecting = entries.filter(e => e.isIntersecting);
      if (intersecting.length > 0) {
        intersecting.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        setActiveSection(intersecting[0].target.id);
      }
    }, {
      root: scrollRef.current,
      rootMargin: '-20px 0px -75% 0px',
      threshold: 0
    });

    const sections = [
      'section-deal-info', 'section-other-details', 'section-description',
      'section-approval-process', 'section-scoring-rules', 'section-notes',
      'section-contact-roles', 'section-attachments', 'section-emails',
      'section-stage-history', 'section-zoho-projects', 'section-open-activities',
      'section-closed-activities', 'section-zoho-finance'
    ];

    sections.forEach(secId => {
      const el = document.getElementById(secId);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [id, activeTab]);

  if (!deal) return null;

  const scrollToSection = (sectionId) => {
    if (!scrollRef.current) return;
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(sectionId);
    }
  };

  const handleUpdate = (field, value) => {
    updateRecord('deals', deal.id, { [field]: value });
    toast.success(`Updated ${field}`);
  };

  const initiateStageTransition = (targetStage) => {
    const specialStages = [
      'Deal Closed (Won)',
      'Closed Won',
      'Deal Job Seeking& Agency',
      'Deal Job Seeking & Agency',
      'Pre- Deal Lost',
      'Pre-Deal Lost',
      'Deal Closed (Lost)',
      'Closed Lost'
    ];
    if (specialStages.includes(targetStage)) {
      // 1. Immediately highlight the clicked stage with its assigned color
      // 2. Remove the previous stage's active highlight
      setPreviewStage(targetStage);
      // 3. Open the corresponding validation popup
      setTransitionTarget(targetStage);
    } else {
      // Direct stage change for other 5 stages
      setPreviewStage(null);
      updateStageRecord(targetStage);
    }
  };

  const handleCancelTransition = () => {
    // 5. Restore previously saved stage and its original color on Cancel / Close
    setTransitionTarget(null);
    setPreviewStage(null);
  };

  const updateStageRecord = (targetStage, extra = {}) => {
    const prob = STAGE_PROBABILITY[targetStage] !== undefined ? STAGE_PROBABILITY[targetStage] : deal.probability;
    const nowTime = new Date().toISOString().replace('T', ' ').slice(0, 16);

    let newHistory = stageHistoryList;
    if (deal.stage !== targetStage) {
      const newEntry = {
        id: `sh-${Date.now()}`,
        stage: targetStage,
        amount: extra.amount !== undefined ? Number(extra.amount) : Number(deal.amount || 0),
        probability: prob,
        modifiedBy: deal.ownerId || 'u1',
        modifiedTime: nowTime
      };
      newHistory = [newEntry, ...stageHistoryList];
    }

    updateRecord('deals', deal.id, {
      stage: targetStage,
      probability: prob,
      expectedRevenue: Math.round(((extra.amount !== undefined ? Number(extra.amount) : Number(deal.amount || 0)) * prob) / 100),
      stageHistory: newHistory,
      ...extra
    });
    toast.success(`Deal stage changed to ${targetStage}`);
  };

  const confirmStageTransition = (updates) => {
    // 4. Commit the new stage, update deal record, and append to Stage History
    const stageToCommit = transitionTarget || previewStage;
    updateStageRecord(stageToCommit, updates);
    setTransitionTarget(null);
    setPreviewStage(null);
  };

  // Navigating to Calls module when a Call Subject is clicked with state restoration
  const handleOpenCall = (callId) => {
    sessionStorage.setItem('deal_detail_closed_tab', 'calls');
    sessionStorage.setItem('call_return_deal', deal.id);
    navigate(`/calls?open=${callId}&fromDeal=${deal.id}`, { state: { fromDeal: deal.id } });
  };

  // Notes Operations
  const handleAddNote = () => {
    if (!noteInput.trim()) return;
    const newNote = {
      id: `note-${Date.now()}`,
      text: noteInput.trim(),
      author: userName('u1') || 'Arun Kumar',
      createdAt: new Date().toISOString()
    };
    const next = [newNote, ...notesList];
    updateRecord('deals', deal.id, { notesList: next });
    try { localStorage.setItem(`deal_notes_${deal.id}`, JSON.stringify(next)); } catch (e) {}
    setNoteInput('');
    toast.success('Note added');
  };

  const handleSaveEditNote = (noteId) => {
    if (!editingNoteText.trim()) return;
    const next = notesList.map(n => n.id === noteId ? { ...n, text: editingNoteText.trim(), editedAt: new Date().toISOString() } : n);
    updateRecord('deals', deal.id, { notesList: next });
    try { localStorage.setItem(`deal_notes_${deal.id}`, JSON.stringify(next)); } catch (e) {}
    setEditingNoteId(null);
    setEditingNoteText('');
    toast.success('Note updated');
  };

  const handleDeleteNote = (noteId) => {
    const next = notesList.filter(n => n.id !== noteId);
    updateRecord('deals', deal.id, { notesList: next });
    try { localStorage.setItem(`deal_notes_${deal.id}`, JSON.stringify(next)); } catch (e) {}
    toast.success('Note deleted');
  };

  // Attachment Operations
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const newAtt = {
      id: `att-${Date.now()}`,
      name: file.name,
      size: `${Math.round(file.size / 1024)} KB`,
      type: file.type || 'file',
      uploadedBy: userName('u1') || 'Arun Kumar',
      uploadedAt: new Date().toISOString()
    };
    const next = [newAtt, ...attachmentsList];
    updateRecord('deals', deal.id, { attachmentsList: next });
    try { localStorage.setItem(`deal_attachments_${deal.id}`, JSON.stringify(next)); } catch (e) {}
    toast.success(`Attached "${file.name}"`);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteAttachment = (attId) => {
    const next = attachmentsList.filter(a => a.id !== attId);
    updateRecord('deals', deal.id, { attachmentsList: next });
    try { localStorage.setItem(`deal_attachments_${deal.id}`, JSON.stringify(next)); } catch (e) {}
    toast.success('Attachment removed');
  };

  const handleSaveAttachLink = () => {
    if (!attachLinkTitle.trim() || !attachLinkUrl.trim()) {
      toast.error('Both Title and URL are required.');
      return;
    }
    const newAtt = {
      id: `att-${Date.now()}`,
      name: attachLinkTitle.trim(),
      url: attachLinkUrl.trim().startsWith('http') ? attachLinkUrl.trim() : `https://${attachLinkUrl.trim()}`,
      size: 'URL Link',
      type: 'link',
      uploadedBy: userName('u1') || 'Arun Kumar',
      uploadedAt: new Date().toISOString()
    };
    const next = [newAtt, ...attachmentsList];
    updateRecord('deals', deal.id, { attachmentsList: next });
    try { localStorage.setItem(`deal_attachments_${deal.id}`, JSON.stringify(next)); } catch (e) {}
    toast.success(`Attached link "${attachLinkTitle.trim()}"`);
    setAttachLinkTitle('');
    setAttachLinkUrl('');
    setAttachLinkModalOpen(false);
  };

  // Contact Roles Operations
  const handleAddContactRole = () => {
    if (!newContactRole.contactId) {
      toast.error('Please select a contact');
      return;
    }
    const selContact = contacts.find(c => c.id === newContactRole.contactId);
    const newRole = {
      id: `cr-${Date.now()}`,
      contactId: newContactRole.contactId,
      name: selContact?.name || contactName(newContactRole.contactId),
      phone: selContact?.phone || '—',
      email: selContact?.email || '—',
      role: newContactRole.role || 'Decision Maker'
    };
    const next = [...contactRolesList, newRole];
    setContactRolesList(next);
    try { localStorage.setItem(`deal_contact_roles_${deal.id}`, JSON.stringify(next)); } catch (e) {}
    setContactRolesModalOpen(false);
    setNewContactRole({ contactId: '', role: 'Decision Maker' });
    toast.success('Contact Role added');
  };

  const handleRemoveContactRole = (crId) => {
    const next = contactRolesList.filter(cr => cr.id !== crId);
    setContactRolesList(next);
    try { localStorage.setItem(`deal_contact_roles_${deal.id}`, JSON.stringify(next)); } catch (e) {}
    toast.success('Contact Role removed');
  };

  // Product Operations
  const handleAddProduct = () => {
    const catalogItem = PRODUCT_CATALOG.find(p => p.id === selectedCatalogProduct);
    if (!catalogItem) return;
    const newProd = {
      id: catalogItem.id,
      name: catalogItem.name,
      code: catalogItem.code,
      unitPrice: catalogItem.unitPrice,
      quantity: Number(productQuantity) || 1,
      total: catalogItem.unitPrice * (Number(productQuantity) || 1)
    };
    const next = [...productsList, newProd];
    updateRecord('deals', deal.id, { productsList: next });
    try { localStorage.setItem(`deal_products_${deal.id}`, JSON.stringify(next)); } catch (e) {}
    setProductModalOpen(false);
    setSelectedCatalogProduct('');
    setProductQuantity(1);
    toast.success(`Added product "${catalogItem.name}"`);
  };

  const handleRemoveProduct = (prodId) => {
    const next = productsList.filter(p => p.id !== prodId);
    updateRecord('deals', deal.id, { productsList: next });
    try { localStorage.setItem(`deal_products_${deal.id}`, JSON.stringify(next)); } catch (e) {}
    toast.success('Product removed');
  };

  const handleSyncProductTotalToDeal = () => {
    const sum = productsList.reduce((acc, p) => acc + (p.total || 0), 0);
    if (sum > 0) {
      updateRecord('deals', deal.id, { amount: sum });
      toast.success(`Synced deal amount to ${fmtINR(sum)}`);
    }
  };

  // Activity Operations
  const handleCreateActivity = () => {
    if (!activityForm.title.trim()) return;
    if (activityForm.type === 'Call') {
      createRecord('calls', {
        subject: activityForm.title,
        dealId: deal.id,
        contactId: deal.contactId,
        accountId: deal.accountId,
        type: 'Outbound',
        status: 'Scheduled',
        dateTime: `${activityForm.dueDate}T10:00`,
        duration: 0,
        ownerId: activityForm.ownerId,
        notes: 'Scheduled from Deal Details'
      });
      toast.success('Call scheduled');
    } else if (activityForm.type === 'Task') {
      const newTask = {
        id: `task-${Date.now()}`,
        title: activityForm.title,
        recordId: deal.id,
        dealId: deal.id,
        module: 'Deals',
        dueDate: activityForm.dueDate,
        ownerId: activityForm.ownerId,
        priority: activityForm.priority,
        status: 'Open'
      };
      updateRecord('deals', deal.id, { tasks: [...(deal.tasks || []), newTask] });
      toast.success('Task created');
    } else {
      const newMeeting = {
        id: `meet-${Date.now()}`,
        title: activityForm.title,
        date: `${activityForm.dueDate} 11:00`,
        duration: '30 mins',
        host: activityForm.ownerId,
        status: 'Scheduled',
        notes: ''
      };
      const nextMeetings = [...meetings, newMeeting];
      setMeetings(nextMeetings);
      try { localStorage.setItem(`deal_meetings_${deal.id}`, JSON.stringify(nextMeetings)); } catch (e) {}
      toast.success('Meeting scheduled');
    }
    setActivityModalOpen(false);
    setActivityForm({ type: 'Task', title: '', dueDate: todayISO(), ownerId: 'u1', priority: 'High', status: 'Open' });
  };

  const handleCompleteCall = (call) => {
    updateRecord('calls', call.id, { status: 'Completed', duration: 900 });
    toast.success(`Call marked as Completed`);
  };

  const handleCompleteTask = (task) => {
    const nextTasks = (deal.tasks || []).map(t => t.id === task.id ? { ...t, status: 'Completed' } : t);
    updateRecord('deals', deal.id, { tasks: nextTasks });
    toast.success(`Task marked as Completed`);
  };

  const handleCompleteMeeting = (meeting) => {
    const next = meetings.map(m => m.id === meeting.id ? { ...m, status: 'Completed' } : m);
    setMeetings(next);
    try { localStorage.setItem(`deal_meetings_${deal.id}`, JSON.stringify(next)); } catch (e) {}
    toast.success('Meeting marked as Completed');
  };

  // Tags Operations (Matches Screenshots 3, 4, 5)
  const tagsList = useMemo(() => {
    if (deal?.tagsList && Array.isArray(deal.tagsList)) return deal.tagsList;
    return ['Waiting for Estimation', 'followup'];
  }, [deal?.tagsList]);

  const handleSaveDealTags = (newTags) => {
    updateRecord('deals', deal.id, { tagsList: newTags });
    toast.success('Tags updated successfully');
  };

  const handleRemoveTag = (tagToRemove) => {
    const next = tagsList.filter(t => t !== tagToRemove);
    updateRecord('deals', deal.id, { tagsList: next });
    toast.success(`Tag "${tagToRemove}" removed`);
  };

  // Email Action
  const handleSendEmail = () => {
    if (!emailData.to || !emailData.subject) {
      toast.error('Recipient and Subject are required');
      return;
    }
    toast.success(`Email sent to ${emailData.to}`);
    setEmailModalOpen(false);
    setEmailData({ to: '', subject: '', body: '' });
  };

  // Adjacent Deal Navigation
  const dealIdx = deals.findIndex(d => d.id === deal.id);
  const prevDeal = dealIdx > 0 ? deals[dealIdx - 1] : null;
  const nextDeal = dealIdx !== -1 && dealIdx < deals.length - 1 ? deals[dealIdx + 1] : null;

  const currentIndex = STAGES.indexOf(deal.stage);

  // Section visibility & dynamic ordering helpers based on Organize Potentials Details
  const isSectionVisible = (sectionId) => {
    const sec = organizeSections.find(s => s.id === sectionId);
    return sec ? Boolean(sec.visible) : true;
  };

  const getSectionOrder = (sectionId) => {
    const idx = organizeSections.findIndex(s => s.id === sectionId);
    return idx !== -1 ? idx : 50;
  };

  const renderGenericSection = (sec) => {
    const standardIds = [
      'section-notes', 'section-contact-roles', 'section-attachments', 'section-emails',
      'section-stage-history', 'section-zoho-projects', 'section-open-activities',
      'section-closed-activities', 'section-zoho-finance'
    ];
    if (standardIds.includes(sec.id) || !sec.visible) return null;

    if (sec.id === 'section-products') {
      return (
        <div
          key={sec.id}
          id="section-products"
          style={{ order: getSectionOrder('section-products') }}
          className="bg-white border border-line rounded-xl shadow-xs overflow-hidden"
        >
          <div className="p-4 border-b border-line bg-[#FAFAFA] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package size={16} className="text-primary" />
              <h3 className="text-[14.5px] font-bold text-ink uppercase tracking-wide">Products</h3>
              <span className="rounded-full px-2 py-0.5 text-[11px] font-bold bg-slate-200 text-ink-700">
                {productsList.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {productsList.length > 0 && (
                <button
                  type="button"
                  onClick={handleSyncProductTotalToDeal}
                  className="btn-secondary h-7 px-2.5 text-[12px] font-medium cursor-pointer"
                  title="Sync Total to Deal Amount"
                >
                  Sync Amount
                </button>
              )}
              <button
                type="button"
                onClick={() => setProductModalOpen(true)}
                className="btn-primary h-7 px-3 text-[12px] font-medium flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} />
                <span>Add Product</span>
              </button>
            </div>
          </div>
          <div className="p-4 overflow-x-auto">
            {productsList.length === 0 ? (
              <div className="py-6 text-center text-[13px] text-ink-400">No products added.</div>
            ) : (
              <table className="w-full text-left text-[13px]">
                <thead className="bg-[#F8FAFC] text-ink-600 border-b border-line">
                  <tr>
                    <th className="p-2.5 font-semibold">Product Name</th>
                    <th className="p-2.5 font-semibold">Product Code</th>
                    <th className="p-2.5 font-semibold text-right">Unit Price</th>
                    <th className="p-2.5 font-semibold text-right">Qty</th>
                    <th className="p-2.5 font-semibold text-right">Total</th>
                    <th className="p-2.5 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {productsList.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-2.5 font-semibold text-ink">{p.name}</td>
                      <td className="p-2.5 text-ink-500 font-mono">{p.code}</td>
                      <td className="p-2.5 text-right font-medium">{fmtINR(p.unitPrice)}</td>
                      <td className="p-2.5 text-right font-medium">{p.quantity}</td>
                      <td className="p-2.5 text-right font-bold text-ink">{fmtINR(p.total)}</td>
                      <td className="p-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(p.id)}
                          className="p-1 text-ink-400 hover:text-red-600 transition-colors rounded cursor-pointer"
                          title="Remove product"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      );
    }

    return (
      <div
        key={sec.id}
        id={sec.id}
        style={{ order: getSectionOrder(sec.id) }}
        className="bg-white border border-line rounded-xl shadow-xs overflow-hidden"
      >
        <div className="p-4 border-b border-line bg-[#FAFAFA] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-primary" />
            <h3 className="text-[14.5px] font-bold text-ink uppercase tracking-wide">{sec.label}</h3>
            <span className="rounded-full px-2 py-0.5 text-[11px] font-bold bg-slate-200 text-ink-700">0</span>
          </div>
          <button
            type="button"
            onClick={() => toast.info(`Add new entry to ${sec.label}`)}
            className="btn-secondary h-7 px-3 text-[12px] font-medium flex items-center gap-1 cursor-pointer text-primary border-primary/30 hover:bg-primary/5"
          >
            <Plus size={12} />
            <span>Add {sec.label}</span>
          </button>
        </div>
        <div className="p-6 text-center text-[13px] text-ink-400 bg-white">
          No records found
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[#F5F7FA] -mx-3 sm:-mx-[18px] -mt-2.5 -mb-6">
      {/* 1. Top Header */}
      <div className="bg-white px-4 py-3 border-b border-line flex flex-wrap items-center justify-between gap-3 shadow-xs z-10 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-page rounded-full text-ink-600 hover:text-ink transition-colors"
            title="Back to Deals list"
          >
            <ArrowLeft size={18} />
          </button>
          
          {deal.dealImage ? (
            <img src={deal.dealImage} alt={deal.name} className="h-9 w-9 rounded-lg object-cover border border-line shadow-2xs" />
          ) : (
            <div className="h-9 w-9 rounded-lg flex items-center justify-center text-[15px] font-bold bg-[#E5E7EB] text-ink-700 shadow-2xs">
              {deal.name?.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <h1 className="text-[17px] font-bold text-ink leading-tight flex items-center gap-2 truncate">
              <span className="truncate">{deal.name}</span>
              <span className="text-ink-400 font-normal">·</span>
              <span className="text-primary font-semibold">{fmtINR(deal.amount)}</span>
            </h1>
            
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5 relative">
              {tagsList.map(t => (
                <ArrowTagBadge
                  key={t}
                  name={t}
                  color={tagColorMap[t] || '#64748B'}
                  onRemove={() => handleRemoveTag(t)}
                />
              ))}
              <div className="relative">
                <button
                  ref={addTagsBtnRef}
                  type="button"
                  onClick={() => setAddTagsDropdownOpen(prev => !prev)}
                  className="flex items-center gap-1 text-[11.5px] text-ink-500 hover:text-primary transition-colors cursor-pointer ml-1 py-0.5 px-1.5 rounded hover:bg-slate-100"
                  title="Add Tags"
                >
                  <Tag size={12} fill="#64748B" className="text-slate-500" />
                  <span className="font-medium">+ Add Tags</span>
                </button>

                {/* Add Tags Dropdown matching Screenshots 3, 4, 5 */}
                <AddTagsDropdown
                  isOpen={addTagsDropdownOpen}
                  onClose={() => setAddTagsDropdownOpen(false)}
                  anchorRef={addTagsBtnRef}
                  dealTags={tagsList}
                  allTags={allTags}
                  onSaveTags={handleSaveDealTags}
                  onOpenManageTags={() => setManageTagsModalOpen(true)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 relative">
          <button
            type="button"
            onClick={() => {
              setEmailData({ to: contact?.email || '', subject: `Re: ${deal.name}`, body: `Dear ${contact?.name || 'Client'},\n\n` });
              setEmailModalOpen(true);
            }}
            className="btn-primary px-3.5 h-8 text-[12.5px] flex items-center gap-1.5"
          >
            <Mail size={13} />
            <span>Send Email</span>
          </button>

          <button
            type="button"
            onClick={() => onEdit?.(deal)}
            className="btn-secondary h-8 px-3 text-[12.5px] flex items-center gap-1.5 font-medium"
          >
            <Edit2 size={13} />
            <span>Edit</span>
          </button>

          <a
            href={`https://wa.me/${(contact?.phone || '').replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(contact?.name || '')},%20regarding%20deal%20${encodeURIComponent(deal.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary h-8 px-3 text-[12.5px] flex items-center gap-1.5 text-emerald-700 hover:bg-emerald-50"
          >
            <MessageSquare size={13} />
            <span className="hidden sm:inline">WhatsApp Chat</span>
            <ChevronDown size={11} className="opacity-70" />
          </a>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMoreMenuOpen(prev => !prev)}
              className="btn-secondary h-8 px-2 text-ink-600 hover:text-ink"
              title="More actions"
            >
              <MoreHorizontal size={16} />
            </button>
            {moreMenuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setMoreMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-line rounded-lg shadow-lg z-40 py-1 text-[13px]">
                  <button
                    type="button"
                    onClick={() => {
                      const cloned = createRecord('deals', { ...deal, name: `${deal.name} - Copy`, createdOn: todayISO() });
                      setMoreMenuOpen(false);
                      toast.success('Deal cloned successfully');
                      if (cloned?.id) navigate(`/deals?open=${cloned.id}`);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-page flex items-center gap-2 text-ink"
                  >
                    <Copy size={13} /> <span>Clone Deal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { window.print(); setMoreMenuOpen(false); }}
                    className="w-full text-left px-3.5 py-2 hover:bg-page flex items-center gap-2 text-ink"
                  >
                    <Printer size={13} /> <span>Print Preview</span>
                  </button>
                  <div className="h-px bg-line my-1" />
                  <button
                    type="button"
                    onClick={() => { setMoreMenuOpen(false); setDeleteConfirmOpen(true); }}
                    className="w-full text-left px-3.5 py-2 hover:bg-red-50 flex items-center gap-2 text-red-600"
                  >
                    <Trash2 size={13} /> <span>Delete Deal</span>
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-1 ml-1 pl-1 border-l border-line">
            <button
              type="button"
              disabled={!prevDeal}
              onClick={() => prevDeal && navigate(`/deals?open=${prevDeal.id}`)}
              className="btn-secondary h-8 px-2 disabled:opacity-40"
              title={prevDeal ? `Previous: ${prevDeal.name}` : 'No previous deal'}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              disabled={!nextDeal}
              onClick={() => nextDeal && navigate(`/deals?open=${nextDeal.id}`)}
              className="btn-secondary h-8 px-2 disabled:opacity-40"
              title={nextDeal ? `Next: ${nextDeal.name}` : 'No next deal'}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Subheader */}
      <div className="bg-[#F5F7FA] px-4 py-2 flex items-center justify-between border-b border-line shrink-0">
        <div className="flex items-center gap-2.5">
          <SidebarToggleButton
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(prev => !prev)}
            size="sm"
          />
          <div className="flex items-center bg-slate-200/60 p-0.5 rounded-lg text-[13px] font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('Overview')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                activeTab === 'Overview'
                  ? 'bg-white text-ink shadow-2xs font-bold'
                  : 'text-ink-600 hover:text-ink'
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('Timeline')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                activeTab === 'Timeline'
                  ? 'bg-white text-ink shadow-2xs font-bold'
                  : 'text-ink-600 hover:text-ink'
              }`}
            >
              Timeline
            </button>
          </div>
        </div>
        <div className="text-[12px] text-ink-500 flex items-center gap-1.5">
          <Clock3 size={13} className="text-ink-400" />
          <span>Last Update : 01:21 PM</span>
        </div>
      </div>

      {/* 3. Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {activeTab === 'Overview' && (
          <>
            {/* Left Sidebar / Related List Navigation */}
            <div
              className={`bg-white border-r border-line flex flex-col overflow-y-auto thin-scroll shrink-0 pb-6 select-none transition-all duration-300 ease-in-out ${
                sidebarOpen ? 'w-[230px] opacity-100' : 'w-0 opacity-0 overflow-hidden border-r-0'
              }`}
            >
              <div className="pt-4">
                <div className="px-4 mb-2 text-[12px] font-bold text-ink-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Related List</span>
                  <button
                    type="button"
                    onClick={() => setOrganizePanelOpen(true)}
                    className="p-1 text-ink-400 hover:text-primary rounded hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Organize Potentials Details"
                  >
                    <SlidersHorizontal size={13} />
                  </button>
                </div>
                <ul className="text-[13px] text-ink-700">
                  {organizeSections.filter(s => s.visible).map(sec => {
                    const item = {
                      id: sec.id,
                      label: sec.label,
                      count: sec.id === 'section-notes' ? notesList.length :
                             sec.id === 'section-contact-roles' ? contactRolesList.length :
                             sec.id === 'section-attachments' ? attachmentsList.length :
                             sec.id === 'section-emails' ? emailsList.length :
                             sec.id === 'section-stage-history' ? stageHistoryList.length :
                             sec.id === 'section-zoho-projects' ? projectsList.length :
                             sec.id === 'section-open-activities' ? totalOpenActivities :
                             sec.id === 'section-closed-activities' ? totalClosedActivities :
                             sec.id === 'section-zoho-finance' ? totalFinanceRecords :
                             sec.id === 'section-products' ? productsList.length :
                             0,
                      canAdd: ['section-notes', 'section-contact-roles', 'section-attachments', 'section-emails', 'section-zoho-projects', 'section-open-activities', 'section-zoho-finance', 'section-products'].includes(sec.id),
                      onAdd: () => {
                        if (sec.id === 'section-notes') setNoteInput('');
                        else if (sec.id === 'section-contact-roles') setContactRolesModalOpen(true);
                        else if (sec.id === 'section-attachments') setAttachMenuOpen(true);
                        else if (sec.id === 'section-emails') setEmailModalOpen(true);
                        else if (sec.id === 'section-zoho-projects') setProjectModalOpen(true);
                        else if (sec.id === 'section-open-activities') {
                          setActivityForm({ type: 'Task', title: '', dueDate: todayISO(), ownerId: deal.ownerId || 'u1', priority: 'High', status: 'Open' });
                          setActivityModalOpen(true);
                        }
                        else if (sec.id === 'section-zoho-finance') handleNewFinance('Invoice');
                        else if (sec.id === 'section-products') setProductModalOpen(true);
                      }
                    };

                    return (
                      <li
                        key={item.id}
                        className={`group px-4 py-2 cursor-pointer flex items-center justify-between border-l-2 transition-colors ${
                          activeSection === item.id
                            ? 'bg-[#EEF2F8] border-primary text-primary font-semibold'
                            : 'border-transparent hover:bg-[#F3F4F6] text-ink-600'
                        }`}
                        onClick={() => scrollToSection(item.id)}
                      >
                        <span className="truncate">{item.label}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          {item.canAdd && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                item.onAdd?.();
                              }}
                              className="opacity-0 group-hover:opacity-100 hover:bg-slate-200 text-ink-400 hover:text-primary rounded p-0.5 transition-all"
                              title={`Add ${item.label}`}
                            >
                              <Plus size={13} />
                            </button>
                          )}
                          {item.count !== undefined && item.count > 0 && (
                            <span className={`rounded-full px-1.5 py-0.5 text-[10.5px] font-bold leading-none ${
                              activeSection === item.id ? 'bg-primary text-white' : 'bg-slate-200 text-ink-700'
                            }`}>
                              {item.count}
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                  <li
                    className="px-4 py-2 cursor-pointer flex items-center justify-between text-primary hover:bg-[#EEF2F8] transition-colors font-medium border-l-2 border-transparent"
                    onClick={() => setOrganizePanelOpen(true)}
                  >
                    <div className="flex items-center gap-1.5 text-[13px]">
                      <Plus size={14} />
                      <span>Add Related List</span>
                    </div>
                  </li>
                </ul>

                {/* SALES SUMMARY in Sidebar */}
                <div className="mt-5 pt-3 border-t border-line/60">
                  <div
                    className="px-4 mb-2 text-[12px] font-bold text-ink-500 uppercase tracking-wider flex items-center justify-between cursor-pointer hover:text-primary"
                    onClick={() => scrollToSection('section-sales-summary')}
                  >
                    <span>Sales Summary</span>
                  </div>
                  <ul className="text-[12.5px] text-ink-600 space-y-1.5 px-4">
                    <li className="flex items-center justify-between py-0.5">
                      <span className="text-ink-500">Lead Conversion Time</span>
                      <span className="font-semibold text-ink">0 Days</span>
                    </li>
                    <li className="flex items-center justify-between py-0.5">
                      <span className="text-ink-500">Sales Cycle Duration</span>
                      <span className="font-semibold text-ink">30 Days</span>
                    </li>
                    <li className="flex items-center justify-between py-0.5">
                      <span className="text-ink-500">Overall Sales Duration</span>
                      <span className="font-semibold text-ink">45 Days</span>
                    </li>
                  </ul>
                </div>

                {/* Links in Sidebar */}
                <div className="mt-5 pt-3 border-t border-line/60">
                  <div className="px-4 mb-2 text-[12px] font-bold text-ink-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Links</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setManageLinksModalOpen(true)}
                        className="text-ink-400 hover:text-primary p-0.5 rounded hover:bg-slate-100 cursor-pointer"
                        title="Manage Link"
                      >
                        <Settings2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setManageLinksModalOpen(true)}
                        className="text-primary hover:text-primary-dark p-0.5 rounded hover:bg-slate-100 cursor-pointer"
                        title="Add Link"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                  <ul className="text-[12.5px] text-ink-600 space-y-1 px-4">
                    {dealLinks.length === 0 ? (
                      <li className="text-[11.5px] text-ink-400 py-0.5 italic">No links added</li>
                    ) : (
                      dealLinks.map((lnk, idx) => (
                        <li key={lnk.id || idx} className="flex items-center justify-between py-0.5">
                          <a
                            href={lnk.url.startsWith('http') ? lnk.url : `https://${lnk.url}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline truncate flex items-center gap-1"
                          >
                            <span className="truncate">{lnk.name || lnk.title}</span>
                            <ExternalLink size={10} className="shrink-0 opacity-70" />
                          </a>
                        </li>
                      ))
                    )}
                    <li className="pt-1">
                      <button
                        type="button"
                        onClick={() => setManageLinksModalOpen(true)}
                        className="text-[12px] text-primary hover:underline flex items-center gap-1 font-medium cursor-pointer"
                      >
                        <Plus size={12} />
                        <span>Manage Link</span>
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Right Details Panel */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto thin-scroll p-4 sm:p-6 bg-[#F5F7FA]">
              <div className="max-w-[1080px] mx-auto flex flex-col gap-5">

                {/* A. Stage Chevron Progress Bar (Horizontal Scroll with Left & Right Arrows) */}
                <div style={{ order: -100 }} className="bg-white border border-line rounded-xl p-3 shadow-xs">
                  {/* Top Start & Closing Dates (matching Screenshot 1) */}
                  <div className="flex items-center justify-between px-1 mb-2">
                    <div>
                      <div className="text-[10px] font-bold text-ink-400 tracking-wider">START</div>
                      <div className="text-[12px] font-medium text-ink-700">{fmtDMY(deal.createdOn) || '10/10/2026'}</div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end text-rose-500">
                        <Clock3 size={12} />
                        <span className="text-[10px] font-bold tracking-wider uppercase">CLOSING</span>
                      </div>
                      <div className="text-[12px] font-medium text-ink-700">{fmtDMY(deal.closingDate) || '11/10/2026'}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Left Scroll Button */}
                    <button
                      type="button"
                      onClick={() => scrollStageBar('left')}
                      className="h-8 w-8 rounded-md border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-ink-600 hover:text-ink shrink-0 transition-colors cursor-pointer"
                      title="Scroll stages left"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    {/* Stage Chevrons Container */}
                    <div
                      ref={stageBarRef}
                      className="flex-1 flex items-center gap-1 overflow-x-auto thin-scroll py-1.5 scroll-smooth no-scrollbar"
                      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                      {STAGES.map((s) => {
                        const isCurrent = s === currentActiveStage;
                        return (
                          <div
                            key={s}
                            ref={isCurrent ? currentStageRef : null}
                            className="shrink-0 flex items-center"
                          >
                            <StageChevron
                              stage={s}
                              current={currentActiveStage}
                              onClick={() => { if (s !== currentActiveStage) initiateStageTransition(s); }}
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* Right Scroll Button */}
                    <button
                      type="button"
                      onClick={() => scrollStageBar('right')}
                      className="h-8 w-8 rounded-md border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-ink-600 hover:text-ink shrink-0 transition-colors cursor-pointer"
                      title="Scroll stages right"
                    >
                      <ChevronRight size={16} />
                    </button>

                    {/* Quick Won / Lost Buttons (ThumbsUp & ThumbsDown icons - No tick/checkmark) */}
                    <div className="flex items-center gap-1.5 ml-2 shrink-0 border-l border-line pl-2">
                      <button
                        type="button"
                        onClick={() => { if (currentActiveStage !== 'Deal Closed (Won)') initiateStageTransition('Deal Closed (Won)'); }}
                        className={`h-8 px-2.5 flex items-center gap-1.5 rounded-md border transition-colors text-[12px] font-semibold cursor-pointer ${
                          currentActiveStage === 'Deal Closed (Won)'
                            ? 'bg-[#BBF7D0] text-[#14532D] border-[#86EFAC] ring-2 ring-emerald-600 ring-offset-1 shadow-sm'
                            : 'bg-white text-ink-600 border-slate-200 hover:bg-[#BBF7D0] hover:text-[#14532D]'
                        }`}
                        title="Mark Closed Won"
                      >
                        <ThumbsUp size={13} className={currentActiveStage === 'Deal Closed (Won)' ? 'text-[#14532D]' : 'text-emerald-600'} />
                        <span>Won</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { if (currentActiveStage !== 'Deal Closed (Lost)') initiateStageTransition('Deal Closed (Lost)'); }}
                        className={`h-8 px-2.5 flex items-center gap-1.5 rounded-md border transition-colors text-[12px] font-semibold cursor-pointer ${
                          currentActiveStage === 'Deal Closed (Lost)'
                            ? 'bg-[#FECACA] text-[#7F1D1D] border-[#FCA5A5] ring-2 ring-red-600 ring-offset-1 shadow-sm'
                            : 'bg-white text-ink-600 border-slate-200 hover:bg-[#FECACA] hover:text-[#7F1D1D]'
                        }`}
                        title="Mark Closed Lost"
                      >
                        <ThumbsDown size={13} className={currentActiveStage === 'Deal Closed (Lost)' ? 'text-[#7F1D1D]' : 'text-red-600'} />
                        <span>Lost</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between mt-2 px-1 text-[12px] text-ink-500 border-t border-line/60 pt-2">
                    <div>Current Stage: <strong className="text-ink">{deal.stage}</strong> ({deal.probability}% Probability)</div>
                    <div>Target Closing Date: <strong className="text-ink">{fmtDMY(deal.closingDate) || '—'}</strong></div>
                  </div>
                </div>

                {/* Top Two-Column Overview & Zia Score Card (Matching Screenshot 1) */}
                <div style={{ order: -90 }} className="bg-white border border-line rounded-xl p-5 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  {/* LEFT: Key Deal Properties */}
                  <div className="space-y-3 text-[13px]">
                    <div className="grid grid-cols-[160px_1fr] items-center gap-4">
                      <span className="text-ink-500 text-right">Deal Approval Status</span>
                      <span className="text-ink-400 font-medium">{deal.approvalStatus || '—'}</span>
                    </div>
                    <div className="grid grid-cols-[160px_1fr] items-center gap-4">
                      <span className="text-ink-500 text-right">Deal Owner</span>
                      <div>
                        <DealOwnerDisplay
                          deal={deal}
                          users={users}
                          userName={userName}
                          onOpenChangeOwner={() => setChangeOwnerModalOpen(true)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-[160px_1fr] items-center gap-4">
                      <span className="text-ink-500 text-right">Lead Source</span>
                      <div>
                        <ZohoDropdownField
                          label="Lead Source"
                          value={deal.source || 'Website'}
                          options={LEAD_SOURCE_OPTIONS}
                          colorMap={LEAD_SOURCE_COLORS}
                          hasSearch={true}
                          displayAsBadge={true}
                          onSave={(val) => handleUpdate('source', val)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-[160px_1fr] items-start gap-4 py-0.5">
                      <span className="text-ink-500 text-right flex items-center justify-end gap-1 mt-1">
                        <span>Categories</span>
                        <span title="Deal Categories" className="text-ink-400 cursor-help"><Info size={13} /></span>
                      </span>
                      <div>
                        <ZohoDropdownField
                          label="Categories"
                          value={deal.categories || 'translations'}
                          options={CATEGORIES_OPTIONS}
                          hasSearch={true}
                          onSave={(val) => handleUpdate('categories', val)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-[160px_1fr] items-center gap-4">
                      <span className="text-ink-500 text-right">Submission Status</span>
                      <div>
                        <ZohoDropdownField
                          label="Submission Status"
                          value={deal.submissionStatus || 'Pendings Info'}
                          options={SUBMISSION_STATUS_OPTIONS}
                          colorMap={SUBMISSION_STATUS_COLORS}
                          hasSearch={false}
                          displayAsBadge={true}
                          onSave={(val) => handleUpdate('submissionStatus', val)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-[160px_1fr] items-start gap-4 py-0.5">
                      <span className="text-ink-500 text-right mt-1">Territory</span>
                      <div>
                        <ZohoDropdownField
                          label="Territory"
                          value={deal.territory || ''}
                          placeholder="-None-"
                          options={TERRITORY_OPTIONS}
                          hasSearch={true}
                          onSave={(val) => handleUpdate('territory', val)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: Zia Score Card (Matching Screenshot 1) */}
                  <div className="border border-line rounded-xl p-4 bg-white shadow-2xs">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[14px] font-bold text-ink">Zia Score</h4>
                      <div className="flex items-center gap-1 text-ink-400">
                        <button type="button" className="p-0.5 hover:text-ink"><ChevronLeft size={15} /></button>
                        <button type="button" className="p-0.5 hover:text-ink"><ChevronRight size={15} /></button>
                      </div>
                    </div>
                    <p className="text-[12px] text-ink-500 mt-1">
                      Zia predicts that this Deal's health level is {deal.probability < 40 ? 'low' : deal.probability < 75 ? 'moderate' : 'high'}
                    </p>

                    <div className="flex items-center gap-4 my-3.5">
                      {/* Circular Donut Gauge */}
                      <div className="relative h-16 w-16 shrink-0 flex items-center justify-center">
                        <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="14" fill="none" className="stroke-slate-100" strokeWidth="3.5" />
                          <circle
                            cx="18"
                            cy="18"
                            r="14"
                            fill="none"
                            className="stroke-emerald-500 transition-all duration-700"
                            strokeWidth="3.5"
                            strokeDasharray="88"
                            strokeDashoffset={88 - (88 * (deal.probability || 25)) / 100}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute text-[12px] font-bold text-ink">
                          {deal.probability || 25}%
                        </div>
                      </div>
                      <div>
                        <div className="text-[12px] text-ink-500 font-medium">Health score</div>
                        <div className="text-[13.5px] font-bold text-ink">
                          {deal.probability < 40 ? 'Need improvement' : deal.probability < 75 ? 'Good standing' : 'Excellent'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end mb-2">
                      <button
                        type="button"
                        onClick={() => toast.info('Zia Scorecard: Health calculation based on stage duration, touchpoints, and activity aging.')}
                        className="text-[12px] text-primary hover:underline font-semibold cursor-pointer"
                      >
                        View Scorecard
                      </button>
                    </div>

                    <div className="pt-2 border-t border-line/60 flex items-center justify-between text-[11px] text-ink-400">
                      <span>Last updated on {fmtDMY(deal.createdOn)} 07:14 AM</span>
                      <div className="flex items-center gap-1.5">
                        <button type="button" onClick={() => toast.success('Feedback recorded: Helpful')} className="hover:text-emerald-600 p-0.5 cursor-pointer"><ThumbsUp size={12} /></button>
                        <button type="button" onClick={() => toast.success('Feedback recorded: Needs adjustment')} className="hover:text-rose-600 p-0.5 cursor-pointer"><ThumbsDown size={12} /></button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Collapsible Hide Details / Show Details Toggle Button */}
                <div style={{ order: -85 }} className="pt-1">
                  <button
                    type="button"
                    onClick={() => setDetailsHidden(prev => !prev)}
                    className="flex items-center gap-1.5 text-[14px] font-bold text-ink hover:text-primary transition-colors cursor-pointer select-none"
                  >
                    {detailsHidden ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                    <span>{detailsHidden ? 'Show Details' : 'Hide Details'}</span>
                  </button>
                </div>

                {/* Detailed Field Sections (Collapsible) */}
                {!detailsHidden && (
                  <div style={{ order: -80 }} className="flex flex-col gap-5">
                    {/* B. Deal Information Section (Matching Screenshots 2 & 3) */}
                    <div id="section-deal-info" className="bg-white border border-line rounded-xl shadow-xs overflow-visible">
                      <div className="p-4 border-b border-line bg-[#FAFAFA] flex items-center justify-between rounded-t-xl">
                        <h3 className="text-[14.5px] font-bold text-ink uppercase tracking-wide">Deal Information</h3>
                      </div>

                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1">
                        {/* LEFT COLUMN */}
                        <div>
                          <div className="grid grid-cols-[160px_1fr] items-center gap-4 text-[13px] group py-1.5 min-h-[32px]">
                            <span className="text-ink-500 text-right mt-[2px] select-none">Deal Owner</span>
                            <div>
                              <DealOwnerDisplay
                                deal={deal}
                                users={users}
                                userName={userName}
                                onOpenChangeOwner={() => setChangeOwnerModalOpen(true)}
                              />
                            </div>
                          </div>
                          <EditableField label="Incentive Amount" value={deal.incentiveAmount} info="Incentive Amount" onSave={val => handleUpdate('incentiveAmount', val)} />
                          <EditableField label="Deal Aging" value={Math.max(1, Math.round((Date.now() - new Date(deal.createdOn || Date.now())) / 86400000)) + ' days ago'} readOnly />
                          <EditableField label="Deal Name" value={deal.name} onSave={val => handleUpdate('name', val)} />
                          <EditableField label="City" value={deal.city || 'Chennai'} onSave={val => handleUpdate('city', val)} />
                          <EditableField label="Contact Name" value={contactName(deal.contactId)} linkTo={deal.contactId ? `/contacts?open=${deal.contactId}` : null} readOnly={!deal.contactId} />
                          <div className="grid grid-cols-[160px_1fr] items-start gap-4 text-[13px] group py-1.5 min-h-[32px]">
                            <span className="text-ink-500 text-right mt-[2px] select-none">Stage</span>
                            <div>
                              <ZohoDropdownField
                                label="Stage"
                                value={currentActiveStage}
                                options={STAGES}
                                colorMap={STAGE_COLORS}
                                hasSearch={false}
                                onSave={(val) => {
                                  if (val && val !== deal.stage) {
                                    initiateStageTransition(val);
                                  }
                                }}
                              />
                            </div>
                          </div>
                          <EditableField label="Closing Date" value={fmtDMY(deal.closingDate)} type="date" onSave={val => handleUpdate('closingDate', val)} />
                          <EditableField label="Lead Manager 1" value={deal.leadManager1 ? userName(deal.leadManager1) : ''} type="select" options={users.map(u => ({ value: u.name, label: u.name }))} onSave={val => { const u = users.find(x => x.name === val); if (u) handleUpdate('leadManager1', u.id); }} />
                          <EditableField label="Sales_No" value={deal.salesNo} onSave={val => handleUpdate('salesNo', val)} />
                          <EditableField label="Deal Activity aging" value="1 days ago" readOnly />
                          <EditableField label="Categories" value={deal.categories || 'translations'} info="Categories" type="select" options={CATEGORIES_OPTIONS} onSave={val => handleUpdate('categories', val)} />
                          <EditableField label="Deal Approval Status" value={deal.approvalStatus} readOnly />
                          <EditableField label="Remarks" value={deal.remarks} onSave={val => handleUpdate('remarks', val)} />
                          <div className="grid grid-cols-[160px_1fr] items-start gap-4 text-[13px] group py-1.5 min-h-[32px]">
                            <span className="text-ink-500 text-right mt-[2px] select-none">Submission Status</span>
                            <div>
                              <ZohoDropdownField
                                label="Submission Status"
                                value={deal.submissionStatus || 'Pendings Info'}
                                options={SUBMISSION_STATUS_OPTIONS}
                                colorMap={SUBMISSION_STATUS_COLORS}
                                hasSearch={false}
                                displayAsBadge={true}
                                onSave={(val) => handleUpdate('submissionStatus', val)}
                              />
                            </div>
                          </div>
                          <EditableField label="Wizard" value={deal.wizard} onSave={val => handleUpdate('wizard', val)} />
                          <EditableField label="Language Class Info" value={deal.languageClassInfo} type="textarea" onSave={val => handleUpdate('languageClassInfo', val)} />
                        </div>

                        {/* RIGHT COLUMN */}
                        <div>
                          <div className="grid grid-cols-[160px_1fr] items-start gap-4 text-[13px] group py-1.5 min-h-[32px]">
                            <span className="text-ink-500 text-right mt-[2px] select-none">Lead Source</span>
                            <div>
                              <ZohoDropdownField
                                label="Lead Source"
                                value={deal.source || 'Website'}
                                options={LEAD_SOURCE_OPTIONS}
                                colorMap={LEAD_SOURCE_COLORS}
                                hasSearch={true}
                                displayAsBadge={true}
                                onSave={(val) => handleUpdate('source', val)}
                              />
                            </div>
                          </div>
                          <EditableField label="Deal suggestions" value={deal.dealSuggestions} type="textarea" onSave={val => handleUpdate('dealSuggestions', val)} />
                          <EditableField label="Source Language List" value={deal.sourceLanguage || 'Tamil'} type="select" options={LANGUAGES} onSave={val => handleUpdate('sourceLanguage', val)} />
                          <EditableField label="Target Language List" value={deal.targetLanguage || 'Bengali'} type="select" options={LANGUAGES} onSave={val => handleUpdate('targetLanguage', val)} />
                          <div className="grid grid-cols-[160px_1fr] items-start gap-4 text-[13px] group py-1.5 min-h-[32px]">
                            <span className="text-ink-500 text-right mt-[2px] select-none flex items-center justify-end gap-1">
                              <span>Job type</span>
                              <span title="Job type" className="text-ink-400 hover:text-ink cursor-help shrink-0">
                                <Info size={13} />
                              </span>
                            </span>
                            <div>
                              <ZohoDropdownField
                                label="Job type"
                                value={deal.jobType || 'ONE TIME'}
                                options={JOB_TYPE_OPTIONS}
                                colorMap={JOB_TYPE_COLORS}
                                hasSearch={false}
                                onSave={(val) => handleUpdate('jobType', val)}
                              />
                            </div>
                          </div>
                          <EditableField label="Purpose Of translation" value={deal.purposeOfTranslation || 'Others'} type="select" options={PURPOSE_TRANSLATION_OPTIONS} onSave={val => handleUpdate('purposeOfTranslation', val)} />
                          <EditableField label="Others(Specify)" value={deal.othersSpecify} onSave={val => handleUpdate('othersSpecify', val)} />
                          <EditableField label="Client Budget" value={deal.clientBudget || 'no idea'} info="Client Budget" onSave={val => handleUpdate('clientBudget', val)} />
                          <div className="grid grid-cols-[160px_1fr] items-start gap-4 text-[13px] group py-1.5 min-h-[32px]">
                            <span className="text-ink-500 text-right mt-[2px] select-none">Delivery type</span>
                            <div>
                              <ZohoDropdownField
                                label="Delivery type"
                                value={deal.deliveryType || 'Normal'}
                                options={DELIVERY_TYPE_OPTIONS}
                                colorMap={DELIVERY_TYPE_COLORS}
                                hasSearch={false}
                                onSave={(val) => handleUpdate('deliveryType', val)}
                              />
                            </div>
                          </div>
                          <EditableField label="Account Name" value={accountName(deal.accountId)} linkTo={deal.accountId ? `/accounts?open=${deal.accountId}` : null} readOnly={!deal.accountId} />
                          <EditableField label="Without GST" value={deal.withoutGst ? fmtINR(deal.withoutGst) : ''} onSave={val => handleUpdate('withoutGst', Number(val) || 0)} />
                          <EditableField label="Amount" value={deal.amount ? fmtINR(deal.amount) : ''} onSave={val => handleUpdate('amount', Number(val) || 0)} />
                          <EditableField label="GST Amount" value={deal.gstAmount ? fmtINR(deal.gstAmount) : ''} onSave={val => handleUpdate('gstAmount', Number(val) || 0)} />
                          <EditableField label="Overseas Educations Info" value={deal.overseasEducationInfo} type="textarea" onSave={val => handleUpdate('overseasEducationInfo', val)} />
                          <EditableField label="Total Call Count" value={dealCalls.length > 0 ? String(dealCalls.length) : ''} readOnly />
                          <EditableField label="Total Call Duration" value={dealCalls.length > 0 ? fmtDuration(dealCalls.reduce((acc, c) => acc + (c.duration || 0), 0)) : ''} readOnly />
                        </div>
                      </div>
                    </div>

                    {/* C. Deal Other Details Section (Matching Screenshots 2 & 5) */}
                    <div id="section-other-details" className="bg-white border border-line rounded-xl shadow-xs overflow-visible">
                      <div className="p-4 border-b border-line bg-[#FAFAFA] flex items-center justify-between rounded-t-xl">
                        <h3 className="text-[14.5px] font-bold text-ink uppercase tracking-wide">Deal other Details</h3>
                      </div>

                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1">
                        {/* LEFT COLUMN */}
                        <div>
                          <EditableField label="Previous Pending Estimations" value={deal.previousPendingEstimations} type="select" options={PREVIOUS_PENDING_ESTIMATIONS_OPTIONS} onSave={val => handleUpdate('previousPendingEstimations', val)} />
                          <EditableField label="Previous Stage" value={deal.previousStage} type="select" options={['-None-', ...STAGES]} onSave={val => handleUpdate('previousStage', val)} />
                          <EditableField label="Client Name" value={deal.clientName || accountName(deal.accountId)} onSave={val => handleUpdate('clientName', val)} />
                          <EditableField label="Approval sent time" value={deal.approvalSentTime} onSave={val => handleUpdate('approvalSentTime', val)} />
                          <EditableField label="Mobile" value={deal.mobile} onSave={val => handleUpdate('mobile', val)} />
                          <EditableField label="Mobile No" value={deal.mobileNo} onSave={val => handleUpdate('mobileNo', val)} />
                          <EditableField label="Est_NO" value={deal.estNo} onSave={val => handleUpdate('estNo', val)} />
                          <EditableField label="Closed Won date" value={deal.closedWonDate ? fmtDMY(deal.closedWonDate) : ''} onSave={val => handleUpdate('closedWonDate', val)} />
                          <EditableField label="Probability (%)" value={deal.probability || 65} type="number" onSave={val => handleUpdate('probability', Number(val) || 0)} />
                          <EditableField label="Revenue projections Prediction" value={deal.revenueProjections} onSave={val => handleUpdate('revenueProjections', val)} />
                          <EditableField label="Expected Revenue" value={deal.expectedRevenue ? fmtINR(deal.expectedRevenue) : ''} readOnly />
                          <div className="grid grid-cols-[160px_1fr] items-start gap-4 text-[13px] group py-1.5 min-h-[32px]">
                            <span className="text-ink-500 text-right mt-[2px] select-none">Forecast Category</span>
                            <div>
                              <ZohoDropdownField
                                label="Forecast Category"
                                value={deal.forecastCategory || 'Committed'}
                                options={FORECAST_CATEGORY_OPTIONS}
                                colorMap={FORECAST_CATEGORY_COLORS}
                                hasSearch={false}
                                onSave={(val) => handleUpdate('forecastCategory', val)}
                              />
                            </div>
                          </div>
                        </div>

                        {/* RIGHT COLUMN */}
                        <div>
                          <EditableField label="Estimation created by" value={deal.estimationCreatedBy ? userName(deal.estimationCreatedBy) : ''} type="select" options={users.map(u => ({ value: u.name, label: u.name }))} onSave={val => { const u = users.find(x => x.name === val); if (u) handleUpdate('estimationCreatedBy', u.id); }} />
                          <EditableField label="Campaign Source" value={deal.campaignSource} onSave={val => handleUpdate('campaignSource', val)} />
                          <EditableField
                            label="Modified By"
                            value="Administration Team"
                            customRender={
                              <div className="text-[13px] leading-tight">
                                <div className="font-semibold text-ink">Administration Team</div>
                                <div className="text-[11.5px] text-ink-400 mt-0.5">Mon, 12 Oct 2026 01:21 PM</div>
                              </div>
                            }
                            readOnly
                          />
                          <EditableField label="Category" value={deal.category} type="select" options={CATEGORY_OPTIONS} onSave={val => handleUpdate('category', val)} />
                          <EditableField label="Comments" value={deal.comments} onSave={val => handleUpdate('comments', val)} />
                          <EditableField label="Invoice No" value={deal.invoiceNo} onSave={val => handleUpdate('invoiceNo', val)} />
                          <EditableField label="Type" value={deal.type} type="select" options={TYPE_OPTIONS} onSave={val => handleUpdate('type', val)} />
                          <EditableField
                            label="Created By"
                            value="Marketing Department"
                            customRender={
                              <div className="text-[13px] leading-tight">
                                <div className="font-semibold text-ink">{userName(deal.ownerId) || 'Marketing Department'}</div>
                                <div className="text-[11.5px] text-ink-400 mt-0.5">{fmtDMY(deal.createdOn)} 12:44 PM</div>
                              </div>
                            }
                            readOnly
                          />
                        </div>
                      </div>
                    </div>

                    {/* D. Description Information Section (Matching Screenshot 5) */}
                    <div id="section-description" className="bg-white border border-line rounded-xl shadow-xs overflow-hidden">
                      <div className="p-4 border-b border-line bg-[#FAFAFA] flex items-center justify-between">
                        <h3 className="text-[14.5px] font-bold text-ink uppercase tracking-wide">Description Information</h3>
                      </div>
                      <div className="p-6">
                        <EditableField
                          label="Description"
                          value={deal.description}
                          type="textarea"
                          onSave={val => handleUpdate('description', val)}
                        />
                      </div>
                    </div>

                    {/* E. Approval Process Section (Matching Screenshots 4 & 5) */}
                    <div id="section-approval-process" className="bg-white border border-line rounded-xl shadow-xs overflow-hidden">
                      <div className="p-4 border-b border-line bg-[#FAFAFA] flex items-center justify-between">
                        <h3 className="text-[14.5px] font-bold text-ink uppercase tracking-wide">Approval Process</h3>
                      </div>
                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1">
                        <div>
                          <EditableField label="EST Ready" value={deal.estReady} type="select" options={EST_READY_OPTIONS} onSave={val => handleUpdate('estReady', val)} />
                          <EditableField label="Closed Lost Approval" value={deal.closedLostApproval} type="select" options={APPROVAL_STATUS_OPTIONS} onSave={val => handleUpdate('closedLostApproval', val)} />
                        </div>
                        <div>
                          <EditableField label="Closed Won Approval" value={deal.closedWonApproval} type="select" options={APPROVAL_STATUS_OPTIONS} onSave={val => handleUpdate('closedWonApproval', val)} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* F. Scoring Rules Section (Matching Screenshot 4) */}
                <div id="section-scoring-rules" style={{ order: -70 }} className="bg-white border border-line rounded-xl shadow-xs overflow-hidden">
                  <div className="p-4 border-b border-line bg-[#FAFAFA] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award size={16} className="text-primary" />
                      <h3 className="text-[14.5px] font-bold text-ink uppercase tracking-wide">Scoring Rules</h3>
                    </div>
                    <div className="flex items-center gap-1.5 text-ink-500">
                      <button
                        type="button"
                        onClick={() => setScoringViewMode('list')}
                        className={`p-1.5 rounded transition-colors cursor-pointer ${
                          scoringViewMode === 'list' ? 'bg-slate-200 text-ink' : 'hover:bg-slate-100 text-ink-400'
                        }`}
                        title="Table View"
                      >
                        <FileText size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setScoringViewMode('chart')}
                        className={`p-1.5 rounded transition-colors cursor-pointer ${
                          scoringViewMode === 'chart' ? 'bg-slate-200 text-ink' : 'hover:bg-slate-100 text-ink-400'
                        }`}
                        title="Chart View"
                      >
                        <TrendingUp size={15} />
                      </button>
                    </div>
                  </div>

                  {scoringViewMode === 'list' ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[13px]">
                        <thead className="bg-[#F8FAFC] text-ink-600 border-b border-line">
                          <tr>
                            <th className="p-3 font-semibold">Rule Name</th>
                            <th className="p-3 font-semibold text-center">Positive</th>
                            <th className="p-3 font-semibold text-center">Negative</th>
                            <th className="p-3 font-semibold text-right">Score</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                          <tr className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 font-medium text-ink">Scoring test</td>
                            <td className="p-3 text-center text-ink-600 font-mono">0</td>
                            <td className="p-3 text-center text-ink-600 font-mono">0</td>
                            <td className="p-3 text-right font-bold text-ink font-mono">{deal.probability || 25}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                      <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                        <p className="text-[11.5px] text-emerald-700 font-semibold uppercase">Positive Score</p>
                        <p className="text-[20px] font-bold text-emerald-800 mt-1">+{deal.probability || 25}</p>
                      </div>
                      <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-100">
                        <p className="text-[11.5px] text-rose-700 font-semibold uppercase">Negative Score</p>
                        <p className="text-[20px] font-bold text-rose-800 mt-1">0</p>
                      </div>
                      <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                        <p className="text-[11.5px] text-blue-700 font-semibold uppercase">Touchpoint Score</p>
                        <p className="text-[20px] font-bold text-blue-800 mt-1">+{deal.probability ? Math.round(deal.probability / 5) : 5}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-[11.5px] text-ink-600 font-semibold uppercase">Total Score</p>
                        <p className="text-[20px] font-bold text-primary mt-1">{deal.probability || 25}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* G. Notes Section (Matching Screenshot 3) */}
                {isSectionVisible('section-notes') && (
                  <div id="section-notes" style={{ order: getSectionOrder('section-notes') }} className="bg-white border border-line rounded-xl shadow-xs overflow-visible">
                  <div className="p-4 border-b border-line bg-[#FAFAFA] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14.5px] font-bold text-ink uppercase tracking-wide">Notes</h3>
                      <span className="rounded-full px-2 py-0.5 text-[11px] font-bold bg-slate-200 text-ink-700">
                        {notesList.length}
                      </span>
                    </div>
                    <div className="relative" ref={notesFilterRef}>
                      <button
                        type="button"
                        onClick={() => setNotesDropdownOpen(prev => !prev)}
                        className="h-7 px-2.5 text-[12px] font-medium bg-white border border-line rounded-md text-ink-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <span>{notesFilter}</span>
                        <ChevronDown size={13} className="text-ink-400" />
                      </button>
                      {notesDropdownOpen && (
                        <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-line rounded-md shadow-lg z-50 py-1 text-[12.5px]">
                          {['Recent Last', 'Recent First'].map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => {
                                setNotesFilter(opt);
                                setNotesDropdownOpen(false);
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-ink-800 flex items-center justify-between cursor-pointer"
                            >
                              <span>{opt}</span>
                              {notesFilter === opt && <Check size={13} className="text-primary font-bold" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="flex gap-2">
                      <textarea
                        className="input-field flex-1 text-[13px] p-2.5 resize-y"
                        rows="2"
                        placeholder="Add a note"
                        value={noteInput}
                        onChange={e => setNoteInput(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={handleAddNote}
                        disabled={!noteInput.trim()}
                        className="btn-primary h-auto px-4 self-end text-[13px] font-medium disabled:opacity-40 cursor-pointer"
                      >
                        Save Note
                      </button>
                    </div>

                    {notesList.length === 0 ? (
                      <div className="py-6 text-center text-[13px] text-ink-400 border border-dashed border-line rounded-lg">
                        No records found
                      </div>
                    ) : (
                      <div className="space-y-3 pt-2">
                        {(notesFilter === 'Recent First'
                          ? [...notesList].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
                          : [...notesList].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))
                        ).map(n => (
                          <div key={n.id} className="p-3.5 bg-[#F9FAFB] border border-line rounded-xl space-y-1.5 text-[13px]">
                            <div className="flex items-center justify-between text-ink-400 text-[11.5px]">
                              <span className="font-semibold text-ink-600">{n.author || 'User'} · {fmtDate(n.createdAt?.slice(0, 10))}</span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => { setEditingNoteId(n.id); setEditingNoteText(n.text); }}
                                  className="hover:text-primary transition-colors cursor-pointer"
                                  title="Edit note"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteNote(n.id)}
                                  className="hover:text-red-600 transition-colors cursor-pointer"
                                  title="Delete note"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>

                            {editingNoteId === n.id ? (
                              <div className="pt-1 space-y-2">
                                <textarea
                                  className="input-field w-full text-[13px] p-2"
                                  rows="2"
                                  value={editingNoteText}
                                  onChange={e => setEditingNoteText(e.target.value)}
                                />
                                <div className="flex justify-end gap-2">
                                  <button type="button" onClick={() => setEditingNoteId(null)} className="btn-secondary h-7 px-2.5 text-[12px]">Cancel</button>
                                  <button type="button" onClick={() => handleSaveEditNote(n.id)} className="btn-primary h-7 px-3 text-[12px]">Update</button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-ink-700 whitespace-pre-wrap leading-relaxed">{n.text}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

                {/* H. Contact Roles Section (Matching Screenshot 4) */}
                {isSectionVisible('section-contact-roles') && (
                  <div id="section-contact-roles" style={{ order: getSectionOrder('section-contact-roles') }} className="bg-white border border-line rounded-xl shadow-xs overflow-hidden">
                  <div className="p-4 border-b border-line bg-[#FAFAFA] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14.5px] font-bold text-ink uppercase tracking-wide">Contact Roles</h3>
                      <span className="rounded-full px-2 py-0.5 text-[11px] font-bold bg-slate-200 text-ink-700">
                        {contactRolesList.length}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setContactRolesModalOpen(true)}
                      className="btn-secondary h-8 px-3 text-[12.5px] font-medium flex items-center gap-1.5 cursor-pointer text-primary border-primary/30 hover:bg-primary/5"
                    >
                      <Plus size={13} />
                      <span>Add Contact Roles</span>
                    </button>
                  </div>

                  <div className="p-4 overflow-x-auto">
                    <table className="w-full text-left text-[13px]">
                      <thead className="bg-[#F8FAFC] text-ink-600 border-b border-line">
                        <tr>
                          <th className="p-2.5 font-semibold">Contact Name</th>
                          <th className="p-2.5 font-semibold">Phone</th>
                          <th className="p-2.5 font-semibold">Email</th>
                          <th className="p-2.5 font-semibold">Role Name</th>
                          <th className="p-2.5 font-semibold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {contactRolesList.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-[13px] text-ink-400">
                              No records found
                            </td>
                          </tr>
                        ) : (
                          contactRolesList.map(cr => (
                            <tr key={cr.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-2.5 font-semibold text-ink">
                                <Link to={`/contacts?open=${cr.contactId}`} className="text-primary hover:underline flex items-center gap-1.5">
                                  <User size={13} className="text-emerald-600" />
                                  <span>{cr.name}</span>
                                </Link>
                              </td>
                              <td className="p-2.5 text-ink-600">{cr.phone || '—'}</td>
                              <td className="p-2.5 text-ink-600">{cr.email || '—'}</td>
                              <td className="p-2.5">
                                <span className="badge-blue text-[11px] px-2 py-0.5 rounded font-medium">{cr.role}</span>
                              </td>
                              <td className="p-2.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveContactRole(cr.id)}
                                  className="p-1 text-ink-400 hover:text-red-600 transition-colors rounded cursor-pointer"
                                  title="Remove contact role"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

                {/* I. Attachments Section (Matching Screenshot 4) */}
                {isSectionVisible('section-attachments') && (
                  <div id="section-attachments" style={{ order: getSectionOrder('section-attachments') }} className="bg-white border border-line rounded-xl shadow-xs overflow-hidden">
                  <div className="p-4 border-b border-line bg-[#FAFAFA] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14.5px] font-bold text-ink uppercase tracking-wide">Attachments</h3>
                      <span className="rounded-full px-2 py-0.5 text-[11px] font-bold bg-slate-200 text-ink-700">
                        {attachmentsList.length}
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                      <button
                        type="button"
                        onClick={() => setAttachMenuOpen(prev => !prev)}
                        className="btn-secondary h-8 px-3 text-[12.5px] font-medium flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Attach</span>
                        <ChevronDown size={13} />
                      </button>
                      {attachMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-30" onClick={() => setAttachMenuOpen(false)} />
                          <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-line rounded-lg shadow-lg z-40 py-1 text-[13px]">
                            <button
                              type="button"
                              onClick={() => {
                                setAttachMenuOpen(false);
                                fileInputRef.current?.click();
                              }}
                              className="w-full text-left px-3.5 py-2 hover:bg-page flex items-center gap-2 text-ink cursor-pointer"
                            >
                              <Upload size={13} className="text-primary" />
                              <span>Upload File</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAttachMenuOpen(false);
                                setAttachLinkModalOpen(true);
                              }}
                              className="w-full text-left px-3.5 py-2 hover:bg-page flex items-center gap-2 text-ink cursor-pointer"
                            >
                              <ExternalLink size={13} className="text-primary" />
                              <span>Attach Link (URL)</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="p-4 overflow-x-auto">
                    <table className="w-full text-left text-[13px]">
                      <thead className="bg-[#F8FAFC] text-ink-600 border-b border-line">
                        <tr>
                          <th className="p-2.5 font-semibold">File Name</th>
                          <th className="p-2.5 font-semibold">Attached By</th>
                          <th className="p-2.5 font-semibold">Date Added</th>
                          <th className="p-2.5 font-semibold text-right">Size</th>
                          <th className="p-2.5 font-semibold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {attachmentsList.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-[13px] text-ink-400">
                              No records found
                            </td>
                          </tr>
                        ) : (
                          attachmentsList.map(a => (
                            <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-2.5 font-medium text-ink flex items-center gap-2">
                                <Paperclip size={13} className="text-blue-600 shrink-0" />
                                {a.url ? (
                                  <a href={a.url} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1 font-semibold truncate max-w-xs">
                                    <span>{a.name}</span>
                                    <ExternalLink size={11} className="shrink-0 opacity-60" />
                                  </a>
                                ) : (
                                  <span className="truncate max-w-xs">{a.name}</span>
                                )}
                              </td>
                              <td className="p-2.5 text-ink-600">{a.uploadedBy}</td>
                              <td className="p-2.5 text-ink-500 font-mono text-[12px]">{fmtDMY(a.uploadedAt?.slice(0, 10))}</td>
                              <td className="p-2.5 text-right font-mono text-[12px] text-ink-600">{a.size}</td>
                              <td className="p-2.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {!a.url && (
                                    <a
                                      href={`data:text/plain;charset=utf-8,${encodeURIComponent(`Attachment file: ${a.name}`)}`}
                                      download={a.name}
                                      className="p-1 text-ink-400 hover:text-primary rounded transition-colors"
                                      title="Download"
                                    >
                                      <Download size={13} />
                                    </a>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteAttachment(a.id)}
                                    className="p-1 text-ink-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                                    title="Delete"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

                {/* J. Emails Section (Matching Screenshot 7) */}
                {isSectionVisible('section-emails') && (
                  <div id="section-emails" style={{ order: getSectionOrder('section-emails') }} className="bg-white border border-line rounded-xl shadow-xs overflow-hidden">
                  <div className="p-4 border-b border-line bg-[#FAFAFA] flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-primary" />
                        <h3 className="text-[14.5px] font-bold text-ink uppercase tracking-wide">Emails</h3>
                        <span className="rounded-full px-2 py-0.5 text-[11px] font-bold bg-slate-200 text-ink-700">
                          {emailSubTab === 'Mails' ? emailsList.length : 0}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 border border-line bg-white rounded-md p-0.5 text-[12px]">
                        {['Mails', 'Drafts', 'Scheduled'].map(tab => (
                          <button
                            key={tab}
                            type="button"
                            onClick={() => setEmailSubTab(tab)}
                            className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                              emailSubTab === tab ? 'bg-primary text-white font-semibold' : 'text-ink-600 hover:text-ink hover:bg-slate-50'
                            }`}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEmailData({ to: contact?.email || '', subject: `Re: ${deal.name}`, body: '' });
                        setEmailModalOpen(true);
                      }}
                      className="btn-primary h-8 px-3 text-[12px] font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={13} /> Compose Email
                    </button>
                  </div>

                  <div className="p-4 overflow-x-auto">
                    {emailSubTab === 'Mails' ? (
                      <table className="w-full text-left text-[13px]">
                        <thead className="bg-[#F8FAFC] text-ink-600 border-b border-line">
                          <tr>
                            <th className="p-2.5 font-semibold">Subject</th>
                            <th className="p-2.5 font-semibold">Recipient</th>
                            <th className="p-2.5 font-semibold">Date & Time</th>
                            <th className="p-2.5 font-semibold">Sender</th>
                            <th className="p-2.5 font-semibold text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                          {emailsList.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-6 text-center text-[13px] text-ink-400">
                                No records found
                              </td>
                            </tr>
                          ) : (
                            emailsList.map(em => (
                              <tr key={em.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-2.5 font-medium text-ink flex items-center gap-1.5">
                                  <Mail size={13} className="text-blue-500 shrink-0" />
                                  <span>{em.subject}</span>
                                </td>
                                <td className="p-2.5 text-ink-600">{em.to}</td>
                                <td className="p-2.5 text-ink-500 font-mono text-[12px]">{em.date}</td>
                                <td className="p-2.5 text-ink-600">{em.sender}</td>
                                <td className="p-2.5 text-right">
                                  <span className="badge-green text-[11px] px-2 py-0.5 rounded">{em.status}</span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    ) : (
                      <table className="w-full text-left text-[13px]">
                        <thead className="bg-[#F8FAFC] text-ink-600 border-b border-line">
                          <tr>
                            <th className="p-2.5 font-semibold">Subject</th>
                            <th className="p-2.5 font-semibold">Recipient</th>
                            <th className="p-2.5 font-semibold">Date</th>
                            <th className="p-2.5 font-semibold text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td colSpan={4} className="py-6 text-center text-[13px] text-ink-400">
                              No records found
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

                {/* K. Stage History Section (Matching Screenshot 2) */}
                {isSectionVisible('section-stage-history') && (
                  <div id="section-stage-history" style={{ order: getSectionOrder('section-stage-history') }} className="bg-white border border-line rounded-xl shadow-xs overflow-visible">
                  <div className="p-4 border-b border-line bg-[#FAFAFA] flex items-center justify-between relative">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14.5px] font-bold text-ink uppercase tracking-wide">Stage History</h3>
                      <span className="rounded-full px-2 py-0.5 text-[11px] font-bold bg-slate-200 text-ink-700">
                        {stageHistoryList.length}
                      </span>
                    </div>

                    <div className="relative" ref={customizePopupRef}>
                      <button
                        type="button"
                        onClick={() => {
                          setTempStageCols(stageHistoryCols);
                          setCustomizeSearch('');
                          setCustomizePopupOpen(prev => !prev);
                        }}
                        className="p-1.5 text-ink-500 hover:text-primary rounded hover:bg-slate-200 transition-colors cursor-pointer"
                        title="Show Customize List Popup"
                      >
                        <SlidersHorizontal size={15} />
                      </button>

                      {/* Customize List Popup - Matching Screenshot 2 */}
                      {customizePopupOpen && (
                        <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-[#CBD5E1] rounded-lg shadow-xl z-50 overflow-hidden text-[13px]">
                          {/* Search Bar */}
                          <div className="p-2.5 border-b border-slate-100">
                            <div className="relative">
                              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input
                                type="text"
                                value={customizeSearch}
                                onChange={(e) => setCustomizeSearch(e.target.value)}
                                placeholder="Search"
                                className="w-full h-8 pl-8 pr-2.5 text-[12.5px] bg-white border border-[#CBD5E1] rounded outline-none focus:border-[#4361EE] text-slate-800"
                                autoFocus
                              />
                            </div>
                          </div>

                          {/* Scrollable Checkbox List */}
                          <div className="max-h-60 overflow-y-auto thin-scroll p-2 space-y-1">
                            {ALL_STAGE_HISTORY_FIELDS
                              .filter(f => f.label.toLowerCase().includes(customizeSearch.toLowerCase()))
                              .map(field => {
                                const isMandatory = field.mandatory;
                                const isChecked = isMandatory || tempStageCols.includes(field.id);
                                return (
                                  <label
                                    key={field.id}
                                    className={`flex items-center gap-2.5 px-2 py-1.5 rounded transition-colors ${
                                      isMandatory ? 'cursor-not-allowed opacity-80' : 'cursor-pointer hover:bg-slate-50'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      disabled={isMandatory}
                                      onChange={() => {
                                        if (isMandatory) return;
                                        if (isChecked) {
                                          setTempStageCols(tempStageCols.filter(x => x !== field.id));
                                        } else {
                                          setTempStageCols([...tempStageCols, field.id]);
                                        }
                                      }}
                                      className="rounded text-[#4361EE] focus:ring-[#4361EE]/20 w-3.5 h-3.5 cursor-pointer disabled:cursor-not-allowed"
                                    />
                                    <span className="text-[13px] text-slate-700">
                                      {field.label}
                                      {isMandatory && <span className="text-red-500 ml-0.5">*</span>}
                                    </span>
                                  </label>
                                );
                              })}
                          </div>

                          {/* Footer Buttons */}
                          <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setTempStageCols(stageHistoryCols);
                                setCustomizePopupOpen(false);
                              }}
                              className="px-3 py-1 text-[12.5px] font-medium text-slate-600 hover:bg-slate-200 border border-slate-300 rounded transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setStageHistoryCols(tempStageCols);
                                try {
                                  localStorage.setItem('deal_stage_history_cols', JSON.stringify(tempStageCols));
                                } catch (e) {}
                                setCustomizePopupOpen(false);
                                toast.success('Stage History columns saved');
                              }}
                              className="px-4 py-1 text-[12.5px] font-semibold text-white bg-[#4361EE] hover:bg-[#3451D1] rounded shadow-xs transition-colors cursor-pointer"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 overflow-x-auto">
                    <table className="w-full text-left text-[13px]">
                      <thead className="bg-[#F8FAFC] text-ink-600 border-b border-line">
                        <tr>
                          {stageHistoryCols.includes('Stage') && <th className="p-2.5 font-semibold">Stage</th>}
                          {stageHistoryCols.includes('Amount') && <th className="p-2.5 font-semibold text-right">Amount</th>}
                          {(stageHistoryCols.includes('Probability (%)') || stageHistoryCols.includes('Probability')) && (
                            <th className="p-2.5 font-semibold text-center">Probability (%)</th>
                          )}
                          {stageHistoryCols.includes('Stage Duration (Calendar Days)') && (
                            <th className="p-2.5 font-semibold text-center">Stage Duration (Calendar Days)</th>
                          )}
                          {stageHistoryCols.includes('Modified Time') && <th className="p-2.5 font-semibold text-right">Modified Time</th>}
                          {stageHistoryCols.includes('Modified By') && <th className="p-2.5 font-semibold">Modified By</th>}
                          {stageHistoryCols.includes('Expected Revenue') && <th className="p-2.5 font-semibold text-right">Expected Revenue</th>}
                          {stageHistoryCols.includes('Closing Date') && <th className="p-2.5 font-semibold text-center">Closing Date</th>}
                          {stageHistoryCols.includes('Moved To') && <th className="p-2.5 font-semibold">Moved To</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {stageHistoryList.map((h, idx) => (
                          <tr key={h.id || idx} className="hover:bg-slate-50 transition-colors">
                            {stageHistoryCols.includes('Stage') && (
                              <td className="p-2.5 font-semibold text-ink">
                                <span
                                  className="inline-flex items-center px-2.5 py-0.5 rounded text-[12px] font-semibold shadow-2xs"
                                  style={{
                                    backgroundColor: STAGE_COLORS[h.stage] || '#E2E8F0',
                                    color: STAGE_TEXT_COLORS[h.stage] || '#1E293B'
                                  }}
                                >
                                  {h.stage}
                                </span>
                              </td>
                            )}
                            {stageHistoryCols.includes('Amount') && (
                              <td className="p-2.5 text-right font-semibold">{fmtINR(h.amount ?? deal?.amount ?? 0)}</td>
                            )}
                            {(stageHistoryCols.includes('Probability (%)') || stageHistoryCols.includes('Probability')) && (
                              <td className="p-2.5 text-center font-bold text-ink-700">{h.probability ?? deal?.probability ?? 0}%</td>
                            )}
                            {stageHistoryCols.includes('Stage Duration (Calendar Days)') && (
                              <td className="p-2.5 text-center font-medium text-ink-600">
                                <span className="inline-flex px-2 py-0.5 rounded bg-slate-100 font-mono text-[11.5px]">
                                  {calculateStageDuration(stageHistoryList, idx)}
                                </span>
                              </td>
                            )}
                            {stageHistoryCols.includes('Modified Time') && (
                              <td className="p-2.5 text-right text-ink-500 font-mono text-[12px]">{h.modifiedTime || fmtDate(deal?.modifiedAt || deal?.createdAt)}</td>
                            )}
                            {stageHistoryCols.includes('Modified By') && (
                              <td className="p-2.5 text-ink-600">{userName(h.modifiedBy || deal?.ownerId)}</td>
                            )}
                            {stageHistoryCols.includes('Expected Revenue') && (
                              <td className="p-2.5 text-right font-medium text-ink-700">
                                {fmtINR(h.expectedRevenue ?? Math.round(((h.amount ?? deal?.amount ?? 0) * (h.probability ?? deal?.probability ?? 0)) / 100))}
                              </td>
                            )}
                            {stageHistoryCols.includes('Closing Date') && (
                              <td className="p-2.5 text-center text-ink-600 font-mono text-[12px]">{h.closingDate || deal?.closingDate || '—'}</td>
                            )}
                            {stageHistoryCols.includes('Moved To') && (
                              <td className="p-2.5 text-ink-600 font-medium">
                                {h.movedTo || (idx < stageHistoryList.length - 1 ? stageHistoryList[idx + 1]?.stage : 'Current Stage')}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

                {/* L. Zoho Projects Section (Matching Screenshot 1) */}
                {isSectionVisible('section-zoho-projects') && (
                  <div id="section-zoho-projects" style={{ order: getSectionOrder('section-zoho-projects') }} className="bg-white border border-line rounded-xl shadow-xs overflow-visible">
                  <div className="p-4 border-b border-line bg-[#FAFAFA] flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <FolderGit2 size={16} className="text-primary" />
                        <h3 className="text-[14.5px] font-bold text-ink uppercase tracking-wide">Zoho Projects</h3>
                        <span className="rounded-full px-2 py-0.5 text-[11px] font-bold bg-slate-200 text-ink-700">
                          {projectsList.filter(p => projectsFilter === 'Archived Projects' ? (p.status === 'Archived' || p.status === 'Completed') : p.status !== 'Archived').length}
                        </span>
                      </div>
                      <div className="relative" ref={projectsFilterRef}>
                        <button
                          type="button"
                          onClick={() => setProjectsDropdownOpen(prev => !prev)}
                          className="h-7 px-2.5 text-[12px] font-medium bg-white border border-line rounded-md text-ink-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <span>{projectsFilter}</span>
                          <ChevronDown size={13} className="text-ink-400" />
                        </button>
                        {projectsDropdownOpen && (
                          <div className="absolute left-0 top-full mt-1 w-44 bg-white border border-line rounded-md shadow-lg z-50 py-1 text-[12.5px]">
                            {['Active Projects', 'Archived Projects'].map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => {
                                  setProjectsFilter(opt);
                                  setProjectsDropdownOpen(false);
                                }}
                                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-ink-800 flex items-center justify-between cursor-pointer"
                              >
                                <span>{opt}</span>
                                {projectsFilter === opt && <Check size={13} className="text-primary font-bold" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toast.info('New Project creation is configured via Zoho Projects.')}
                        className="btn-secondary h-8 px-3 text-[12px] font-medium cursor-pointer"
                      >
                        New Project
                      </button>
                      <button
                        type="button"
                        onClick={() => setProjectModalOpen(true)}
                        className="btn-primary h-8 px-3 text-[12px] font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={13} /> Associate Project
                      </button>
                    </div>
                  </div>

                  {(() => {
                    const filteredPrjs = projectsList.filter(p =>
                      projectsFilter === 'Archived Projects'
                        ? (p.status === 'Archived' || p.status === 'Completed')
                        : p.status !== 'Archived'
                    );

                    if (filteredPrjs.length === 0) {
                      return (
                        <div className="py-8 px-4 text-center text-[13.5px] text-ink-400 bg-white">
                          No records found
                        </div>
                      );
                    }

                    return (
                      <div className="p-4 overflow-x-auto">
                        <table className="w-full text-left text-[13px]">
                          <thead className="bg-[#F8FAFC] text-ink-600 border-b border-line">
                            <tr>
                              <th className="p-2.5 font-semibold">Project Name</th>
                              <th className="p-2.5 font-semibold">Status</th>
                              <th className="p-2.5 font-semibold">Progress</th>
                              <th className="p-2.5 font-semibold">Milestones</th>
                              <th className="p-2.5 font-semibold">Owner</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-line">
                            {filteredPrjs.map(prj => (
                              <tr key={prj.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-2.5 font-bold text-ink">{prj.name}</td>
                                <td className="p-2.5"><span className="badge-blue text-[11px] px-2 py-0.5 rounded">{prj.status}</span></td>
                                <td className="p-2.5">
                                  <div className="flex items-center gap-2">
                                    <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                                      <div className="bg-primary h-2 rounded-full" style={{ width: `${prj.progress}%` }} />
                                    </div>
                                    <span className="text-[11.5px] font-bold text-ink">{prj.progress}%</span>
                                  </div>
                                </td>
                                <td className="p-2.5 text-ink-600">{prj.milestones} Active</td>
                                <td className="p-2.5 text-ink-600">{prj.owner}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              )}

                {/* H. Open Activities Section */}
                {isSectionVisible('section-open-activities') && (
                  <div id="section-open-activities" style={{ order: getSectionOrder('section-open-activities') }} className="bg-white border border-line rounded-xl shadow-xs overflow-hidden">
                  <div
                    className="p-4 bg-[#FAFAFA] border-b border-line flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none group"
                    onClick={() => setOpenActivitiesOpen(prev => !prev)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-ink-400 group-hover:text-primary transition-colors">
                        {openActivitiesOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </span>
                      <h3 className="text-[14.5px] font-bold text-ink group-hover:text-primary transition-colors">
                        Open Activities
                      </h3>
                      <span className="rounded-full px-2 py-0.5 text-[11px] font-bold bg-blue-100 text-blue-800">
                        {totalOpenActivities}
                      </span>
                    </div>

                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      {/* Add New Dropdown */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setOpenActivityMenuOpen(prev => !prev)}
                          className="btn-primary h-8 px-3 text-[12.5px] font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <Plus size={13} />
                          <span>Add New</span>
                          <ChevronDown size={13} />
                        </button>
                        {openActivityMenuOpen && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setOpenActivityMenuOpen(false)} />
                            <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-line rounded-lg shadow-lg z-40 py-1 text-[13px]">
                              <button
                                type="button"
                                onClick={() => {
                                  setActivityForm({ type: 'Task', title: '', dueDate: todayISO(), ownerId: deal.ownerId || 'u1', priority: 'High', status: 'Open' });
                                  setActivityModalOpen(true);
                                  setOpenActivityMenuOpen(false);
                                }}
                                className="w-full text-left px-3.5 py-2 hover:bg-page flex items-center gap-2 text-ink"
                              >
                                <CheckSquare size={13} className="text-amber-500" /> <span>Add Task</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActivityForm({ type: 'Call', title: '', dueDate: todayISO(), ownerId: deal.ownerId || 'u1', priority: 'Normal', status: 'Scheduled' });
                                  setActivityModalOpen(true);
                                  setOpenActivityMenuOpen(false);
                                }}
                                className="w-full text-left px-3.5 py-2 hover:bg-page flex items-center gap-2 text-ink"
                              >
                                <Phone size={13} className="text-blue-500" /> <span>Log / Schedule Call</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActivityForm({ type: 'Meeting', title: '', dueDate: todayISO(), ownerId: deal.ownerId || 'u1', priority: 'Normal', status: 'Scheduled' });
                                  setActivityModalOpen(true);
                                  setOpenActivityMenuOpen(false);
                                }}
                                className="w-full text-left px-3.5 py-2 hover:bg-page flex items-center gap-2 text-ink"
                              >
                                <Calendar size={13} className="text-purple-500" /> <span>Schedule Meeting</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {openActivitiesOpen && (
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-3 text-[12.5px] border-b border-line pb-2">
                        {[
                          { key: 'all', label: `All (${totalOpenActivities})` },
                          { key: 'calls', label: `Calls (${openCalls.length})` },
                          { key: 'tasks', label: `Tasks (${openTasks.length})` },
                          { key: 'meetings', label: `Meetings (${openMeetings.length})` }
                        ].map(tb => (
                          <button
                            key={tb.key}
                            type="button"
                            onClick={() => setOpenActivityTab(tb.key)}
                            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                              openActivityTab === tb.key ? 'bg-primary text-white' : 'text-ink-600 hover:bg-slate-100'
                            }`}
                          >
                            {tb.label}
                          </button>
                        ))}
                      </div>

                      {totalOpenActivities === 0 ? (
                        <p className="text-[13px] text-ink-400 py-3 text-center">No open activities pending.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-[13px]">
                            <thead className="bg-[#F8FAFC] text-ink-600 border-b border-line">
                              <tr>
                                <th className="p-2.5 font-semibold">Subject / Title</th>
                                <th className="p-2.5 font-semibold">Activity Type</th>
                                <th className="p-2.5 font-semibold">Due Date / Time</th>
                                <th className="p-2.5 font-semibold">Owner</th>
                                <th className="p-2.5 font-semibold">Status</th>
                                <th className="p-2.5 font-semibold text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                              {/* Open Calls */}
                              {(openActivityTab === 'all' || openActivityTab === 'calls') && openCalls.map(c => (
                                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="p-2.5 font-medium text-ink">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenCall(c.id)}
                                      className="text-primary hover:underline font-semibold flex items-center gap-1.5"
                                    >
                                      <Phone size={13} className="text-blue-500" />
                                      <span>{c.subject}</span>
                                    </button>
                                  </td>
                                  <td className="p-2.5">Scheduled Call</td>
                                  <td className="p-2.5 text-ink-600">{fmtDate(c.dateTime)} {fmtTime(c.dateTime)}</td>
                                  <td className="p-2.5 text-ink-600">{userName(c.ownerId)}</td>
                                  <td className="p-2.5"><span className="badge-blue text-[11px] px-2 py-0.5 rounded">Scheduled</span></td>
                                  <td className="p-2.5 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleCompleteCall(c)}
                                      className="btn-secondary h-6 px-2 text-[11.5px] text-green-700 hover:bg-green-50 border-green-300"
                                      title="Mark Call as Completed"
                                    >
                                      <Check size={12} className="inline mr-1" /> Complete
                                    </button>
                                  </td>
                                </tr>
                              ))}

                              {/* Open Tasks */}
                              {(openActivityTab === 'all' || openActivityTab === 'tasks') && openTasks.map(t => (
                                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="p-2.5 font-medium text-ink">{t.title}</td>
                                  <td className="p-2.5">Task</td>
                                  <td className="p-2.5 text-ink-600">{fmtDate(t.dueDate)}</td>
                                  <td className="p-2.5 text-ink-600">{userName(t.ownerId)}</td>
                                  <td className="p-2.5"><span className="badge-amber text-[11px] px-2 py-0.5 rounded">Open</span></td>
                                  <td className="p-2.5 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleCompleteTask(t)}
                                      className="btn-secondary h-6 px-2 text-[11.5px] text-green-700 hover:bg-green-50 border-green-300"
                                      title="Mark Task as Completed"
                                    >
                                      <Check size={12} className="inline mr-1" /> Complete
                                    </button>
                                  </td>
                                </tr>
                              ))}

                              {/* Open Meetings */}
                              {(openActivityTab === 'all' || openActivityTab === 'meetings') && openMeetings.map(m => (
                                <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="p-2.5 font-medium text-ink">{m.title}</td>
                                  <td className="p-2.5">Meeting</td>
                                  <td className="p-2.5 text-ink-600">{m.date}</td>
                                  <td className="p-2.5 text-ink-600">{userName(m.host)}</td>
                                  <td className="p-2.5"><span className="badge-purple text-[11px] px-2 py-0.5 rounded">Scheduled</span></td>
                                  <td className="p-2.5 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleCompleteMeeting(m)}
                                      className="btn-secondary h-6 px-2 text-[11.5px] text-green-700 hover:bg-green-50 border-green-300"
                                    >
                                      <Check size={12} className="inline mr-1" /> Complete
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

                {/* I. Closed Activities Section (Calls Integration & Views: Tab, Column, Chronological) */}
                {isSectionVisible('section-closed-activities') && (
                  <div id="section-closed-activities" style={{ order: getSectionOrder('section-closed-activities') }} className="bg-white border border-line rounded-xl shadow-xs overflow-hidden">
                  <div
                    className="p-4 bg-[#FAFAFA] border-b border-line flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none group"
                    onClick={() => setClosedActivitiesOpen(prev => !prev)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-ink-400 group-hover:text-primary transition-colors">
                        {closedActivitiesOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </span>
                      <h3 className="text-[14.5px] font-bold text-ink group-hover:text-primary transition-colors">
                        Closed Activities
                      </h3>
                      <span className="rounded-full px-2 py-0.5 text-[11px] font-bold bg-green-100 text-green-800">
                        {totalClosedActivities}
                      </span>
                    </div>

                    <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                      {/* View Mode Selector Dropdown */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12px] text-ink-500 font-medium">View:</span>
                        <select
                          value={closedViewMode}
                          onChange={(e) => setClosedViewMode(e.target.value)}
                          className="h-7 px-2 text-[12px] border border-line rounded bg-white text-ink font-medium outline-none cursor-pointer hover:border-slate-400"
                        >
                          <option value="Tab View">Tab View</option>
                          <option value="Column View">Column View</option>
                          <option value="Chronological View">Chronological View</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {closedActivitiesOpen && (
                    <div className="p-4">
                      {/* 1. TAB VIEW */}
                      {closedViewMode === 'Tab View' && (
                        <div>
                          {/* Subtabs with dynamic counts */}
                          <div className="flex items-center gap-2 mb-3 text-[12.5px] border-b border-line pb-2">
                            {[
                              { key: 'calls', label: `Calls (${closedCalls.length})` },
                              { key: 'tasks', label: `Tasks (${closedTasks.length})` },
                              { key: 'meetings', label: `Meetings (${closedMeetings.length})` },
                              { key: 'all', label: `All (${totalClosedActivities})` }
                            ].map(tb => (
                              <button
                                key={tb.key}
                                type="button"
                                onClick={() => setClosedActivityTab(tb.key)}
                                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                                  closedActivityTab === tb.key
                                    ? 'bg-primary text-white'
                                    : 'text-ink-600 hover:bg-slate-100'
                                }`}
                              >
                                {tb.label}
                              </button>
                            ))}
                          </div>

                          {/* When Calls Tab is selected: EXACT 6 COLUMNS: Subject, Call Start Time, Call Owner, Call Result, Description, Call Duration */}
                          {closedActivityTab === 'calls' && (
                            closedCalls.length === 0 ? (
                              <p className="text-[13px] text-ink-400 py-4 text-center">No closed calls recorded for this deal.</p>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-[13px]">
                                  <thead className="bg-[#F8FAFC] text-ink-600 border-b border-line">
                                    <tr>
                                      <th className="p-2.5 font-semibold">Subject</th>
                                      <th className="p-2.5 font-semibold">Call Start Time</th>
                                      <th className="p-2.5 font-semibold">Call Owner</th>
                                      <th className="p-2.5 font-semibold">Call Result</th>
                                      <th className="p-2.5 font-semibold">Description</th>
                                      <th className="p-2.5 font-semibold text-right">Call Duration</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-line">
                                    {closedCalls.map(c => (
                                      <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="p-2.5 font-medium text-ink">
                                          <button
                                            type="button"
                                            onClick={() => handleOpenCall(c.id)}
                                            className="text-primary hover:underline font-bold flex items-center gap-1.5 text-left"
                                            title="Open this Call in Calls module"
                                          >
                                            <Phone size={13} className={c.type === 'Inbound' ? 'text-teal-600' : 'text-blue-600'} />
                                            <span>{c.subject}</span>
                                            <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
                                          </button>
                                        </td>
                                        <td className="p-2.5 text-ink-600 whitespace-nowrap">
                                          {fmtDate(c.dateTime)} {fmtTime(c.dateTime)}
                                        </td>
                                        <td className="p-2.5 text-ink-600">
                                          {userName(c.ownerId)}
                                        </td>
                                        <td className="p-2.5">
                                          <span className="badge-green text-[11px] px-2 py-0.5 rounded font-medium">
                                            {c.status || 'Completed'}
                                          </span>
                                        </td>
                                        <td className="p-2.5 text-ink-600 max-w-[240px] truncate" title={c.notes}>
                                          {c.notes || '—'}
                                        </td>
                                        <td className="p-2.5 text-right font-mono text-[12px] text-ink-700 whitespace-nowrap">
                                          {fmtDuration(c.duration)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )
                          )}

                          {/* When Tasks Tab is selected */}
                          {closedActivityTab === 'tasks' && (
                            closedTasks.length === 0 ? (
                              <p className="text-[13px] text-ink-400 py-4 text-center">No closed tasks recorded for this deal.</p>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-[13px]">
                                  <thead className="bg-[#F8FAFC] text-ink-600 border-b border-line">
                                    <tr>
                                      <th className="p-2.5 font-semibold">Task Title</th>
                                      <th className="p-2.5 font-semibold">Completed Date</th>
                                      <th className="p-2.5 font-semibold">Owner</th>
                                      <th className="p-2.5 font-semibold">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-line">
                                    {closedTasks.map(t => (
                                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-2.5 font-medium text-ink">{t.title}</td>
                                        <td className="p-2.5 text-ink-600">{fmtDate(t.dueDate)}</td>
                                        <td className="p-2.5 text-ink-600">{userName(t.ownerId)}</td>
                                        <td className="p-2.5"><span className="badge-green text-[11px] px-2 py-0.5 rounded">Completed</span></td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )
                          )}

                          {/* When Meetings Tab is selected */}
                          {closedActivityTab === 'meetings' && (
                            closedMeetings.length === 0 ? (
                              <p className="text-[13px] text-ink-400 py-4 text-center">No closed meetings recorded for this deal.</p>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-[13px]">
                                  <thead className="bg-[#F8FAFC] text-ink-600 border-b border-line">
                                    <tr>
                                      <th className="p-2.5 font-semibold">Meeting Title</th>
                                      <th className="p-2.5 font-semibold">Date & Time</th>
                                      <th className="p-2.5 font-semibold">Duration</th>
                                      <th className="p-2.5 font-semibold">Host</th>
                                      <th className="p-2.5 font-semibold">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-line">
                                    {closedMeetings.map(m => (
                                      <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-2.5 font-medium text-ink">{m.title}</td>
                                        <td className="p-2.5 text-ink-600">{m.date}</td>
                                        <td className="p-2.5 text-ink-600">{m.duration}</td>
                                        <td className="p-2.5 text-ink-600">{userName(m.host)}</td>
                                        <td className="p-2.5"><span className="badge-green text-[11px] px-2 py-0.5 rounded">Completed</span></td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )
                          )}

                          {/* When All Tab is selected */}
                          {closedActivityTab === 'all' && (
                            totalClosedActivities === 0 ? (
                              <p className="text-[13px] text-ink-400 py-4 text-center">No closed activities recorded yet.</p>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-[13px]">
                                  <thead className="bg-[#F8FAFC] text-ink-600 border-b border-line">
                                    <tr>
                                      <th className="p-2.5 font-semibold">Subject / Title</th>
                                      <th className="p-2.5 font-semibold">Type</th>
                                      <th className="p-2.5 font-semibold">Owner</th>
                                      <th className="p-2.5 font-semibold">Date & Time</th>
                                      <th className="p-2.5 font-semibold text-right">Duration</th>
                                      <th className="p-2.5 font-semibold text-right">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-line">
                                    {closedCalls.map(c => (
                                      <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="p-2.5 font-medium text-ink">
                                          <button
                                            type="button"
                                            onClick={() => handleOpenCall(c.id)}
                                            className="text-primary hover:underline font-bold flex items-center gap-1.5 text-left"
                                          >
                                            <Phone size={13} className="text-blue-600" />
                                            <span>{c.subject}</span>
                                          </button>
                                        </td>
                                        <td className="p-2.5">Call</td>
                                        <td className="p-2.5 text-ink-600">{userName(c.ownerId)}</td>
                                        <td className="p-2.5 text-ink-600">{fmtDate(c.dateTime)} {fmtTime(c.dateTime)}</td>
                                        <td className="p-2.5 text-right font-mono">{fmtDuration(c.duration)}</td>
                                        <td className="p-2.5 text-right"><span className="badge-green text-[11px] px-2 py-0.5 rounded">Completed</span></td>
                                      </tr>
                                    ))}
                                    {closedTasks.map(t => (
                                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-2.5 font-medium text-ink">{t.title}</td>
                                        <td className="p-2.5">Task</td>
                                        <td className="p-2.5 text-ink-600">{userName(t.ownerId)}</td>
                                        <td className="p-2.5 text-ink-600">{fmtDate(t.dueDate)}</td>
                                        <td className="p-2.5 text-right">—</td>
                                        <td className="p-2.5 text-right"><span className="badge-green text-[11px] px-2 py-0.5 rounded">Completed</span></td>
                                      </tr>
                                    ))}
                                    {closedMeetings.map(m => (
                                      <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-2.5 font-medium text-ink">{m.title}</td>
                                        <td className="p-2.5">Meeting</td>
                                        <td className="p-2.5 text-ink-600">{userName(m.host)}</td>
                                        <td className="p-2.5 text-ink-600">{m.date}</td>
                                        <td className="p-2.5 text-right font-mono">{m.duration}</td>
                                        <td className="p-2.5 text-right"><span className="badge-green text-[11px] px-2 py-0.5 rounded">Completed</span></td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )
                          )}
                        </div>
                      )}

                      {/* 2. COLUMN VIEW */}
                      {closedViewMode === 'Column View' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                          {/* Column 1: Tasks */}
                          <div className="border border-line rounded-lg p-3 bg-[#F9FAFB]">
                            <div className="flex items-center justify-between pb-2 mb-2 border-b border-line">
                              <span className="font-bold text-[13px] text-ink">Completed Tasks</span>
                              <span className="badge-slate text-[11px] px-1.5 py-0.5 rounded font-bold">{closedTasks.length}</span>
                            </div>
                            <div className="space-y-2">
                              {closedTasks.length === 0 ? (
                                <p className="text-[12px] text-ink-400 py-2">No closed tasks</p>
                              ) : (
                                closedTasks.map(t => (
                                  <div key={t.id} className="p-2.5 bg-white border border-line rounded shadow-2xs text-[12.5px]">
                                    <p className="font-semibold text-ink">{t.title}</p>
                                    <p className="text-[11px] text-ink-400 mt-0.5">{fmtDate(t.dueDate)} · {userName(t.ownerId)}</p>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          {/* Column 2: Meetings */}
                          <div className="border border-line rounded-lg p-3 bg-[#F9FAFB]">
                            <div className="flex items-center justify-between pb-2 mb-2 border-b border-line">
                              <span className="font-bold text-[13px] text-ink">Completed Meetings</span>
                              <span className="badge-slate text-[11px] px-1.5 py-0.5 rounded font-bold">{closedMeetings.length}</span>
                            </div>
                            <div className="space-y-2">
                              {closedMeetings.length === 0 ? (
                                <p className="text-[12px] text-ink-400 py-2">No closed meetings</p>
                              ) : (
                                closedMeetings.map(m => (
                                  <div key={m.id} className="p-2.5 bg-white border border-line rounded shadow-2xs text-[12.5px]">
                                    <p className="font-semibold text-ink">{m.title}</p>
                                    <p className="text-[11px] text-ink-400 mt-0.5">{m.date} · {m.duration}</p>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          {/* Column 3: Calls */}
                          <div className="border border-line rounded-lg p-3 bg-[#F9FAFB]">
                            <div className="flex items-center justify-between pb-2 mb-2 border-b border-line">
                              <span className="font-bold text-[13px] text-ink">Completed Calls</span>
                              <span className="badge-green text-[11px] px-1.5 py-0.5 rounded font-bold">{closedCalls.length}</span>
                            </div>
                            <div className="space-y-2">
                              {closedCalls.length === 0 ? (
                                <p className="text-[12px] text-ink-400 py-2">No closed calls</p>
                              ) : (
                                closedCalls.map(c => (
                                  <div key={c.id} className="p-2.5 bg-white border border-line rounded shadow-2xs text-[12.5px]">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenCall(c.id)}
                                      className="font-bold text-primary hover:underline text-left block"
                                    >
                                      {c.subject}
                                    </button>
                                    <p className="text-[11px] text-ink-400 mt-0.5">
                                      {fmtDate(c.dateTime)} {fmtTime(c.dateTime)} · {fmtDuration(c.duration)}
                                    </p>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 3. CHRONOLOGICAL VIEW */}
                      {closedViewMode === 'Chronological View' && (
                        <div>
                          {chronologicalClosedActivities.length === 0 ? (
                            <p className="text-[13px] text-ink-400 py-4 text-center">No completed activities recorded.</p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-[13px]">
                                <thead className="bg-[#F8FAFC] text-ink-600 border-b border-line">
                                  <tr>
                                    <th className="p-2.5 font-semibold">Date & Time</th>
                                    <th className="p-2.5 font-semibold">Activity Type</th>
                                    <th className="p-2.5 font-semibold">Subject / Title</th>
                                    <th className="p-2.5 font-semibold">Owner</th>
                                    <th className="p-2.5 font-semibold">Duration / Details</th>
                                    <th className="p-2.5 font-semibold text-right">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-line">
                                  {chronologicalClosedActivities.map(item => (
                                    <tr key={`${item.type}-${item.id}`} className="hover:bg-slate-50 transition-colors">
                                      <td className="p-2.5 text-ink-600 whitespace-nowrap">
                                        {fmtDate(item.time)} {fmtTime(item.time)}
                                      </td>
                                      <td className="p-2.5 font-medium">
                                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                          item.type === 'Call' ? 'bg-blue-100 text-blue-800' :
                                          item.type === 'Task' ? 'bg-amber-100 text-amber-800' :
                                          'bg-purple-100 text-purple-800'
                                        }`}>
                                          {item.type}
                                        </span>
                                      </td>
                                      <td className="p-2.5 font-medium text-ink">
                                        {item.type === 'Call' ? (
                                          <button
                                            type="button"
                                            onClick={() => handleOpenCall(item.id)}
                                            className="text-primary hover:underline font-bold text-left"
                                          >
                                            {item.title}
                                          </button>
                                        ) : (
                                          item.title
                                        )}
                                      </td>
                                      <td className="p-2.5 text-ink-600">{item.owner}</td>
                                      <td className="p-2.5 text-ink-600 font-mono text-[12px]">{item.duration}</td>
                                      <td className="p-2.5 text-right">
                                        <span className="badge-green text-[11px] px-2 py-0.5 rounded">Completed</span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

                {/* Zoho Finance Section */}
                {isSectionVisible('section-zoho-finance') && (
                  <div id="section-zoho-finance" style={{ order: getSectionOrder('section-zoho-finance') }} className="bg-white border border-line rounded-xl shadow-xs overflow-hidden mb-12">
                  <div className="p-4 border-b border-line bg-[#FAFAFA] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign size={16} className="text-primary" />
                      <h3 className="text-[14.5px] font-bold text-ink uppercase tracking-wide">Zoho Finance</h3>
                      <button
                        type="button"
                        onClick={handleRefreshFinance}
                        className={`p-1 text-ink-500 hover:text-primary rounded hover:bg-slate-200 transition-all cursor-pointer ${
                          isRefreshingFinance ? 'animate-spin text-primary' : ''
                        }`}
                        title="Refresh Zoho Finance records"
                      >
                        <RotateCw size={13} />
                      </button>
                      <span className="rounded-full px-2 py-0.5 text-[11px] font-bold bg-slate-200 text-ink-700">
                        {totalFinanceRecords}
                      </span>
                    </div>
                    <Link to="/zoho-finance" className="text-primary hover:underline text-[12.5px] font-semibold flex items-center gap-1">
                      <span>View in Zoho Finance</span>
                      <ArrowUpRight size={13} />
                    </Link>
                  </div>

                  <div className="divide-y divide-line">
                    {/* 1. Estimates Subsection */}
                    <div className="p-4 sm:p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <FileText size={15} className="text-ink-600" />
                          <h4 className="text-[13.5px] font-bold text-ink">Estimates</h4>
                          <span className="text-[11.5px] text-ink-400 font-medium">({dealEstimates.length})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleNewFinance('Estimate')}
                          className="btn-secondary h-7 px-2.5 text-[12px] font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <Plus size={12} />
                          <span>New Estimate</span>
                        </button>
                      </div>

                      {dealEstimates.length === 0 ? (
                        <div className="py-4 text-center text-[13px] text-ink-400 bg-[#F9FAFB] rounded-lg border border-dashed border-line">
                          No records found
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-[13px]">
                            <thead className="bg-[#F8FAFC] text-ink-600 border-b border-line">
                              <tr>
                                <th className="p-2 font-semibold">Estimate #</th>
                                <th className="p-2 font-semibold">Date</th>
                                <th className="p-2 font-semibold text-right">Amount</th>
                                <th className="p-2 font-semibold text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                              {dealEstimates.map(est => (
                                <tr key={est.id || est.number} className="hover:bg-slate-50">
                                  <td className="p-2 font-bold text-primary font-mono">{est.number || est.id}</td>
                                  <td className="p-2 text-ink-600">{fmtDate(est.date || est.createdDate)}</td>
                                  <td className="p-2 text-right font-semibold">{fmtINR(est.amount || 0)}</td>
                                  <td className="p-2 text-right"><span className="badge-blue text-[11px] px-2 py-0.5 rounded">{est.status || 'Draft'}</span></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* 2. Sales Orders Subsection */}
                    <div className="p-4 sm:p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Package size={15} className="text-ink-600" />
                          <h4 className="text-[13.5px] font-bold text-ink">Sales Orders</h4>
                          <span className="text-[11.5px] text-ink-400 font-medium">({dealSalesOrders.length})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleNewFinance('Sales Order')}
                          className="btn-secondary h-7 px-2.5 text-[12px] font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <Plus size={12} />
                          <span>New Sales Order</span>
                        </button>
                      </div>

                      {dealSalesOrders.length === 0 ? (
                        <div className="py-4 text-center text-[13px] text-ink-400 bg-[#F9FAFB] rounded-lg border border-dashed border-line">
                          No records found
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-[13px]">
                            <thead className="bg-[#F8FAFC] text-ink-600 border-b border-line">
                              <tr>
                                <th className="p-2 font-semibold">Order #</th>
                                <th className="p-2 font-semibold">Date</th>
                                <th className="p-2 font-semibold text-right">Amount</th>
                                <th className="p-2 font-semibold text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                              {dealSalesOrders.map(so => (
                                <tr key={so.id || so.number} className="hover:bg-slate-50">
                                  <td className="p-2 font-bold text-primary font-mono">{so.number || so.id}</td>
                                  <td className="p-2 text-ink-600">{fmtDate(so.date || so.orderDate)}</td>
                                  <td className="p-2 text-right font-semibold">{fmtINR(so.amount || 0)}</td>
                                  <td className="p-2 text-right"><span className="badge-green text-[11px] px-2 py-0.5 rounded">{so.status || 'Confirmed'}</span></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* 3. Invoices Subsection */}
                    <div className="p-4 sm:p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <FileCheck size={15} className="text-ink-600" />
                          <h4 className="text-[13.5px] font-bold text-ink">Invoices</h4>
                          <span className="text-[11.5px] text-ink-400 font-medium">({dealInvoices.length})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleNewFinance('Invoice')}
                          className="btn-primary h-7 px-2.5 text-[12px] font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <Plus size={12} />
                          <span>New Invoice</span>
                        </button>
                      </div>

                      {dealInvoices.length === 0 ? (
                        <div className="py-4 text-center text-[13px] text-ink-400 bg-[#F9FAFB] rounded-lg border border-dashed border-line">
                          No records found
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-[13px]">
                            <thead className="bg-[#F8FAFC] text-ink-600 border-b border-line">
                              <tr>
                                <th className="p-2.5 font-semibold">Invoice Number</th>
                                <th className="p-2.5 font-semibold">Date</th>
                                <th className="p-2.5 font-semibold">Due Date</th>
                                <th className="p-2.5 font-semibold text-right">Amount</th>
                                <th className="p-2.5 font-semibold text-right">Balance</th>
                                <th className="p-2.5 font-semibold text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                              {dealInvoices.map(inv => (
                                <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="p-2.5 font-bold text-primary font-mono">{inv.number}</td>
                                  <td className="p-2.5 text-ink-600">{fmtDate(inv.invoiceDate)}</td>
                                  <td className="p-2.5 text-ink-600">{fmtDate(inv.dueDate)}</td>
                                  <td className="p-2.5 text-right font-semibold">{fmtINR(inv.amount)}</td>
                                  <td className="p-2.5 text-right font-medium text-ink-700">{fmtINR(inv.amount - (inv.paidAmount || 0))}</td>
                                  <td className="p-2.5 text-right">
                                    <StatusBadge status={inv.status} tone={badgeTone('invoice', inv.status)} />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

                {/* Other Dynamically Configured Related Sections (Products, Competitors, Desk, etc.) */}
                {organizeSections.map(sec => renderGenericSection(sec))}

                {/* Bottom Controls Bar (Matching Screenshot 6) */}
                <div style={{ order: 1000 }} className="bg-white border border-line rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4 mb-8">
                  <button
                    type="button"
                    onClick={() => setOrganizePanelOpen(true)}
                    className="btn-secondary h-8 px-3 text-[12.5px] font-medium flex items-center gap-1.5 cursor-pointer text-primary border-primary/30 hover:bg-primary/5"
                  >
                    <Plus size={14} />
                    <span>Add Related List</span>
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-[12.5px] text-ink-600">
                      <span>Record detail page views :</span>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setRecordViewDropdownOpen(prev => !prev)}
                          className="h-8 px-2.5 rounded-md border border-line bg-white hover:bg-slate-50 flex items-center gap-1.5 text-[12.5px] font-medium text-ink cursor-pointer"
                        >
                          <span>{recordViewMode}</span>
                          <ChevronDown size={13} className="text-ink-400" />
                        </button>
                        {recordViewDropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setRecordViewDropdownOpen(false)} />
                            <div className="absolute right-0 bottom-full mb-1.5 w-40 bg-white border border-line rounded-lg shadow-lg z-40 py-1 text-[12.5px]">
                              {['Standard View', 'Compact View', 'Full View'].map(mode => (
                                <button
                                  key={mode}
                                  type="button"
                                  onClick={() => {
                                    setRecordViewMode(mode);
                                    setRecordViewDropdownOpen(false);
                                    toast.success(`Switched to ${mode}`);
                                  }}
                                  className={`w-full text-left px-3 py-1.5 hover:bg-page cursor-pointer ${
                                    recordViewMode === mode ? 'font-bold text-primary' : 'text-ink'
                                  }`}
                                >
                                  {mode}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toast.info('Custom record page designer is available in Settings > Modules & Customization.')}
                      className="btn-secondary h-8 px-3 text-[12.5px] font-medium text-ink cursor-pointer"
                    >
                      Create a custom record page
                    </button>
                  </div>
                </div>

              </div>

              {/* Floating Scroll To Top Button (Matching Screenshots 2, 4, 6) */}
              <button
                type="button"
                onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                className="fixed bottom-6 right-6 h-10 w-10 rounded-full bg-white border border-line shadow-md text-ink-600 hover:text-primary hover:border-primary/50 flex items-center justify-center transition-all z-20 cursor-pointer group"
                title="Scroll to Top"
              >
                <ChevronUp size={18} className="group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
          </>
        )}

        {/* Timeline Tab Content (Matching Reference Screenshot) */}
        {activeTab === 'Timeline' && (
          <TimelineHistoryView module="Deals" record={deal} />
        )}
      </div>

      {/* Stage Transition Modal */}
      <StageTransitionModal
        open={!!transitionTarget}
        targetStage={transitionTarget}
        deal={deal}
        onClose={handleCancelTransition}
        onSave={confirmStageTransition}
      />

      {/* Change Deal Owner Modal (Matching Screenshot 6) */}
      <ChangeOwnerModal
        open={changeOwnerModalOpen}
        deal={deal}
        users={users}
        onClose={() => setChangeOwnerModalOpen(false)}
        onSave={(newOwnerId) => {
          updateRecord('deals', deal.id, { ownerId: newOwnerId });
          setChangeOwnerModalOpen(false);
          toast.success('Deal Owner updated successfully');
        }}
      />

      {/* Send Email Modal */}
      {emailModalOpen && (
        <Modal
          open={emailModalOpen}
          onClose={() => setEmailModalOpen(false)}
          title={`Compose Email · ${deal.name}`}
          size="md"
          footer={
            <>
              <button type="button" onClick={() => setEmailModalOpen(false)} className="btn-secondary px-4">Cancel</button>
              <button type="button" onClick={handleSendEmail} className="btn-primary px-5">Send Email</button>
            </>
          }
        >
          <div className="space-y-4 py-1 text-[13px]">
            <div>
              <label className="block text-ink-600 font-medium mb-1">To (Email)</label>
              <input
                type="email"
                className="input-field w-full"
                value={emailData.to}
                onChange={e => setEmailData({ ...emailData, to: e.target.value })}
                placeholder="client@company.in"
              />
            </div>
            <div>
              <label className="block text-ink-600 font-medium mb-1">Subject</label>
              <input
                type="text"
                className="input-field w-full"
                value={emailData.subject}
                onChange={e => setEmailData({ ...emailData, subject: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-ink-600 font-medium mb-1">Message</label>
              <textarea
                className="input-field w-full"
                rows="6"
                value={emailData.body}
                onChange={e => setEmailData({ ...emailData, body: e.target.value })}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Add Activity Modal */}
      {activityModalOpen && (
        <Modal
          open={activityModalOpen}
          onClose={() => setActivityModalOpen(false)}
          title={`Add ${activityForm.type} · ${deal.name}`}
          size="md"
          footer={
            <>
              <button type="button" onClick={() => setActivityModalOpen(false)} className="btn-secondary px-4">Cancel</button>
              <button type="button" onClick={handleCreateActivity} className="btn-primary px-5">Save Activity</button>
            </>
          }
        >
          <div className="space-y-4 py-1 text-[13px]">
            <div>
              <label className="block text-ink-600 font-medium mb-1">Activity Type</label>
              <select
                className="input-field w-full"
                value={activityForm.type}
                onChange={e => setActivityForm({ ...activityForm, type: e.target.value })}
              >
                <option value="Task">Task</option>
                <option value="Call">Call</option>
                <option value="Meeting">Meeting</option>
              </select>
            </div>
            <div>
              <label className="block text-ink-600 font-medium mb-1">Subject / Title <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="input-field w-full"
                value={activityForm.title}
                onChange={e => setActivityForm({ ...activityForm, title: e.target.value })}
                placeholder="e.g. Follow-up on pricing quote"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-ink-600 font-medium mb-1">Due Date</label>
                <input
                  type="date"
                  className="input-field w-full"
                  value={activityForm.dueDate}
                  onChange={e => setActivityForm({ ...activityForm, dueDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-ink-600 font-medium mb-1">Owner</label>
                <select
                  className="input-field w-full"
                  value={activityForm.ownerId}
                  onChange={e => setActivityForm({ ...activityForm, ownerId: e.target.value })}
                >
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Product Modal */}
      {productModalOpen && (
        <Modal
          open={productModalOpen}
          onClose={() => setProductModalOpen(false)}
          title="Add Product from Catalog"
          size="md"
          footer={
            <>
              <button type="button" onClick={() => setProductModalOpen(false)} className="btn-secondary px-4">Cancel</button>
              <button type="button" onClick={handleAddProduct} disabled={!selectedCatalogProduct} className="btn-primary px-5 disabled:opacity-50">Add to Deal</button>
            </>
          }
        >
          <div className="space-y-4 py-1 text-[13px]">
            <div>
              <label className="block text-ink-600 font-medium mb-1">Select Product</label>
              <select
                className="input-field w-full"
                value={selectedCatalogProduct}
                onChange={e => setSelectedCatalogProduct(e.target.value)}
              >
                <option value="">-- Choose a Product --</option>
                {PRODUCT_CATALOG.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({fmtINR(p.unitPrice)}) - {p.category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-ink-600 font-medium mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                className="input-field w-full"
                value={productQuantity}
                onChange={e => setProductQuantity(Math.max(1, Number(e.target.value) || 1))}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Associate Project Modal */}
      {projectModalOpen && (
        <Modal
          open={projectModalOpen}
          onClose={() => setProjectModalOpen(false)}
          title="Associate Zoho Project"
          size="sm"
          footer={
            <>
              <button type="button" onClick={() => setProjectModalOpen(false)} className="btn-secondary px-3">Cancel</button>
              <button
                type="button"
                onClick={() => {
                  setProjectModalOpen(false);
                  toast.success('Project associated with Deal');
                }}
                className="btn-primary px-4"
              >
                Associate
              </button>
            </>
          }
        >
          <div className="space-y-3 py-1 text-[13px]">
            <p className="text-ink-600">Select an existing Zoho Project to link with this deal:</p>
            <select className="input-field w-full">
              <option value="1">Enterprise Localization Execution</option>
              <option value="2">Cloud Infrastructure Migration</option>
              <option value="3">API Integration & Testing</option>
            </select>
          </div>
        </Modal>
      )}

      {/* Add Tag Modal */}
      {tagModalOpen && (
        <Modal
          open={tagModalOpen}
          onClose={() => setTagModalOpen(false)}
          title="Add Tag to Deal"
          size="sm"
          footer={
            <>
              <button type="button" onClick={() => setTagModalOpen(false)} className="btn-secondary px-3">Cancel</button>
              <button type="button" onClick={handleAddTag} className="btn-primary px-4">Add Tag</button>
            </>
          }
        >
          <div className="space-y-3 py-1 text-[13px]">
            <div>
              <label className="block text-ink-600 font-medium mb-1">Tag Name</label>
              <input
                type="text"
                className="input-field w-full"
                placeholder="e.g. VIP Client, Urgent"
                value={newTagInput}
                onChange={e => setNewTagInput(e.target.value)}
                autoFocus
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Deal Confirmation Modal */}
      {deleteConfirmOpen && (
        <Modal
          open={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          title="Delete Deal?"
          size="sm"
          footer={
            <>
              <button type="button" onClick={() => setDeleteConfirmOpen(false)} className="btn-secondary px-4">Cancel</button>
              <button
                type="button"
                onClick={() => {
                  deleteRecord('deals', deal.id);
                  toast.success(`Deleted deal "${deal.name}"`);
                  setDeleteConfirmOpen(false);
                  onClose();
                }}
                className="btn-primary px-4 bg-red-600 hover:bg-red-700 text-white"
              >
                Delete Deal
              </button>
            </>
          }
        >
          <p className="text-[13.5px] text-ink-600 py-2">
            Are you sure you want to delete deal <strong>"{deal.name}"</strong>? This will permanently remove the deal from the CRM.
          </p>
        </Modal>
      )}

      {/* Organize Potentials Details Panel (Screenshot 1) */}
      <OrganizeSectionsPanel
        isOpen={organizePanelOpen}
        onClose={() => setOrganizePanelOpen(false)}
        sections={organizeSections}
        onSave={(next) => {
          setOrganizeSections(next);
          try {
            localStorage.setItem('deal_related_sections_order', JSON.stringify(next));
          } catch (e) {}
        }}
      />

      {/* Manage Links Modal (Screenshot 2) */}
      <ManageLinksModal
        isOpen={manageLinksModalOpen}
        onClose={() => setManageLinksModalOpen(false)}
        links={dealLinks}
        onUpdateLinks={handleUpdateLinks}
      />

      {/* Manage Tags Modal (Screenshots 3, 4, 5) */}
      <ManageTagsModal
        isOpen={manageTagsModalOpen}
        onClose={() => setManageTagsModalOpen(false)}
        allTags={allTags}
        onUpdateAllTags={(next) => {
          setAllTags(next);
          try {
            localStorage.setItem('crm_all_tags', JSON.stringify(next));
          } catch (e) {}
        }}
      />

      {/* New Invoice Modal */}
      {invoiceModalOpen && (
        <Modal
          open={invoiceModalOpen}
          onClose={() => setInvoiceModalOpen(false)}
          title="Create New Invoice"
          size="md"
          footer={
            <>
              <button type="button" onClick={() => setInvoiceModalOpen(false)} className="btn-secondary px-4">Cancel</button>
              <button type="button" onClick={handleSaveInvoice} className="btn-primary px-5">Save Invoice</button>
            </>
          }
        >
          <div className="space-y-3.5 py-1 text-[13px]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-ink-600 font-medium mb-1">Invoice Number *</label>
                <input
                  type="text"
                  className="input-field w-full font-mono"
                  value={invoiceForm.number}
                  onChange={e => setInvoiceForm({ ...invoiceForm, number: e.target.value })}
                  placeholder="INV-10001"
                  required
                />
              </div>
              <div>
                <label className="block text-ink-600 font-medium mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  className="input-field w-full"
                  value={invoiceForm.amount}
                  onChange={e => setInvoiceForm({ ...invoiceForm, amount: Number(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-ink-600 font-medium mb-1">Due Date</label>
                <input
                  type="date"
                  className="input-field w-full"
                  value={invoiceForm.dueDate}
                  onChange={e => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-ink-600 font-medium mb-1">Status</label>
                <select
                  className="input-field w-full"
                  value={invoiceForm.status}
                  onChange={e => setInvoiceForm({ ...invoiceForm, status: e.target.value })}
                >
                  <option value="Draft">Draft</option>
                  <option value="Pending">Pending</option>
                  <option value="Sent">Sent</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
            </div>
            <div className="p-2.5 bg-slate-50 border border-line rounded text-[12px] text-ink-500">
              This invoice will be automatically associated with Deal <strong>"{deal.name}"</strong>.
            </div>
          </div>
        </Modal>
      )}

      {/* Add Contact Role Modal */}
      {contactRolesModalOpen && (
        <Modal
          open={contactRolesModalOpen}
          onClose={() => setContactRolesModalOpen(false)}
          title="Add Contact Role"
          size="sm"
          footer={
            <>
              <button type="button" onClick={() => setContactRolesModalOpen(false)} className="btn-secondary px-3.5">Cancel</button>
              <button type="button" onClick={handleAddContactRole} className="btn-primary px-4">Save</button>
            </>
          }
        >
          <div className="space-y-3.5 py-1 text-[13px]">
            <div>
              <label className="block text-ink-600 font-medium mb-1">Select Contact <span className="text-red-500">*</span></label>
              <select
                className="input-field w-full"
                value={newContactRole.contactId}
                onChange={e => setNewContactRole({ ...newContactRole, contactId: e.target.value })}
              >
                <option value="">-- Choose Contact --</option>
                {contacts.map(c => (
                  <option key={c.id} value={c.id}>{c.name} {c.email ? `(${c.email})` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-ink-600 font-medium mb-1">Role Name</label>
              <select
                className="input-field w-full"
                value={newContactRole.role}
                onChange={e => setNewContactRole({ ...newContactRole, role: e.target.value })}
              >
                <option value="Decision Maker">Decision Maker</option>
                <option value="Evaluator">Evaluator</option>
                <option value="Executive Sponsor">Executive Sponsor</option>
                <option value="Influencer">Influencer</option>
                <option value="Purchaser">Purchaser</option>
                <option value="Technical Buyer">Technical Buyer</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </Modal>
      )}

      {/* Attach URL Link Modal */}
      {attachLinkModalOpen && (
        <Modal
          open={attachLinkModalOpen}
          onClose={() => setAttachLinkModalOpen(false)}
          title="Attach Link (URL)"
          size="sm"
          footer={
            <>
              <button type="button" onClick={() => setAttachLinkModalOpen(false)} className="btn-secondary px-3.5">Cancel</button>
              <button type="button" onClick={handleSaveAttachLink} className="btn-primary px-4">Attach Link</button>
            </>
          }
        >
          <div className="space-y-3.5 py-1 text-[13px]">
            <div>
              <label className="block text-ink-600 font-medium mb-1">Document / Link Title <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="input-field w-full"
                placeholder="e.g. Translation Specs Google Doc"
                value={attachLinkTitle}
                onChange={e => setAttachLinkTitle(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-ink-600 font-medium mb-1">Target URL <span className="text-red-500">*</span></label>
              <input
                type="url"
                className="input-field w-full"
                placeholder="https://docs.google.com/..."
                value={attachLinkUrl}
                onChange={e => setAttachLinkUrl(e.target.value)}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
