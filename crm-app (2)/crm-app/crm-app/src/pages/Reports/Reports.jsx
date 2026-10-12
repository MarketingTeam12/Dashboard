import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowUpDown,
  BarChart3,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Copy,
  Download,
  Edit3,
  Eye,
  FileSpreadsheet,
  Filter,
  Folder,
  FolderPlus,
  Globe,
  Layers,
  Lock,
  MoreHorizontal,
  Play,
  Plus,
  Printer,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Star,
  Table as TableIcon,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useToast } from '../../components/common/Toast';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination, { RecordSelectionSummary } from '../../components/common/Pagination';
import useTable from '../../components/common/useTable';
import {
  DEFAULT_REPORT_FOLDERS,
  FILTER_OPERATORS,
  REPORT_PRIMARY_MODULES,
  SUMMARY_FUNCTIONS,
  executeReport,
  exportReportResultsCSV,
  exportReportResultsExcel,
  formatReportCell,
  getAvailableFieldsForReport,
} from '../../utils/reportsEngine';

/**
 * Step 1 Modal: "Create New Report -> Select Primary Module"
 * Matches Zoho CRM Screenshot 2 (media_1791805305901_0d2ba60c.png).
 */
function CreateNewReportModal({ open, onClose, onContinue }) {
  const [selectedModule, setSelectedModule] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [moduleSearch, setModuleSearch] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setSelectedModule('');
      setDropdownOpen(true);
      setModuleSearch('');
    }
  }, [open]);

  useEffect(() => {
    if (dropdownOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 30);
    }
  }, [dropdownOpen]);

  useEffect(() => {
    if (!dropdownOpen) return undefined;
    const handleOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [dropdownOpen]);

  const filteredModules = useMemo(() => {
    const q = moduleSearch.trim().toLowerCase();
    if (!q) return REPORT_PRIMARY_MODULES;
    return REPORT_PRIMARY_MODULES.filter(
      (m) =>
        m.label.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q)
    );
  }, [moduleSearch]);

  if (!open) return null;

  const selectedLabel =
    REPORT_PRIMARY_MODULES.find((m) => m.key === selectedModule)?.label ||
    '--Select Primary Module--';

  return (
    <div
      data-testid="create-new-report-modal"
      className="fixed inset-0 z-[90] flex items-start justify-center bg-[#0F172A]/45 pt-12 sm:pt-20 px-4 overflow-y-auto"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-new-report-title"
        className="w-full max-w-[660px] bg-white rounded-xl shadow-2xl border border-[#DCE3EE] p-6 sm:p-7 relative"
      >
        <h2
          id="create-new-report-title"
          className="text-[19px] font-bold text-[#0F172A] tracking-tight"
        >
          Create New Report
        </h2>

        <div className="mt-5">
          <h3 className="text-[14px] font-bold text-[#0F172A]">
            Select Primary Module
          </h3>
          <p className="mt-1.5 text-[13px] text-[#334155] leading-relaxed">
            Select the module that you would like to create a report for. For example, if you want to
            see all Contacts and the Deals added to them in the last month, select Contacts as the
            primary module.
          </p>
        </div>

        {/* Bottom row: Searchable Primary Module Dropdown on left, Cancel + Continue on right */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div ref={dropdownRef} className="relative w-full sm:w-[290px]">
            <button
              type="button"
              data-testid="primary-module-select-trigger"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className={`w-full h-[38px] px-3.5 rounded-md border text-left text-[13.5px] flex items-center justify-between transition-all ${
                dropdownOpen
                  ? 'border-[#3B82F6] ring-2 ring-[#3B82F6]/20 bg-white'
                  : 'border-[#CBD5E1] bg-white hover:border-[#94A3B8]'
              } ${selectedModule ? 'text-[#0F172A] font-medium' : 'text-[#64748B]'}`}
            >
              <span className="truncate">{selectedLabel}</span>
              {dropdownOpen ? (
                <ChevronUp size={15} className="text-[#64748B] shrink-0" />
              ) : (
                <ChevronDown size={15} className="text-[#64748B] shrink-0" />
              )}
            </button>

            {dropdownOpen && (
              <div
                data-testid="primary-module-dropdown-list"
                className="mt-1 w-full bg-white rounded-md border border-[#CBD5E1] shadow-xl z-50 overflow-hidden"
              >
                <div className="p-2 border-b border-[#E2E8F0]">
                  <div className="relative">
                    <Search
                      size={14}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#64748B]"
                    />
                    <input
                      ref={searchInputRef}
                      type="text"
                      data-testid="primary-module-search-input"
                      value={moduleSearch}
                      onChange={(e) => setModuleSearch(e.target.value)}
                      placeholder="Search Primary Module"
                      className="w-full h-8 pl-8 pr-2.5 rounded border border-[#3B82F6] text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="max-h-[225px] overflow-y-auto py-1">
                  {filteredModules.length === 0 ? (
                    <div className="px-4 py-3 text-[12.5px] text-[#64748B] text-center">
                      No modules match &ldquo;{moduleSearch}&rdquo;
                    </div>
                  ) : (
                    filteredModules.map((mod) => {
                      const active = selectedModule === mod.key;
                      return (
                        <button
                          key={mod.key}
                          type="button"
                          data-testid={`primary-module-option-${mod.key}`}
                          onClick={() => {
                            setSelectedModule(mod.key);
                            setDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-[13.5px] flex items-center justify-between transition-colors ${
                            active
                              ? 'bg-[#EFF6FF] text-[#1262E0] font-semibold'
                              : 'text-[#1E293B] hover:bg-[#F1F5F9]'
                          }`}
                        >
                          <span>{mod.label}</span>
                          {active && <Check size={14} className="text-[#1262E0]" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 self-end sm:self-auto">
            <button
              type="button"
              data-testid="create-report-cancel-btn"
              onClick={onClose}
              className="h-9 px-4 rounded-md border border-[#CBD5E1] bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#1E293B] text-[13.5px] font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              data-testid="create-report-continue-btn"
              disabled={!selectedModule}
              onClick={() => selectedModule && onContinue(selectedModule)}
              className={`h-9 px-5 rounded-md text-white text-[13.5px] font-semibold transition-colors ${
                selectedModule
                  ? 'bg-[#1262E0] hover:bg-[#0B4BB8] shadow-xs cursor-pointer'
                  : 'bg-[#A5B4FC] cursor-not-allowed'
              }`}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Step 2: Guided Report Builder (with Related Modules, Columns, Groupings, Summaries, Filters, Live Preview, and Save Settings).
 */
function ReportBuilderView({
  initialDraft,
  folders,
  users,
  crm,
  onSave,
  onSaveAndRun,
  onCancel,
  onCreateFolder,
}) {
  const [draft, setDraft] = useState(() => {
    const primaryModule = initialDraft?.primaryModule || 'Deals';
    const relatedModules = initialDraft?.relatedModules || [];
    const avail = getAvailableFieldsForReport(primaryModule, relatedModules);
    const defaultCols = avail.filter((f) => f.defaultSelected).map((f) => f.key);
    return {
      id: initialDraft?.id || '',
      name: initialDraft?.name || `${primaryModule} Report`,
      description: initialDraft?.description === '-' ? '' : initialDraft?.description || '',
      folder: initialDraft?.folder || 'Overall',
      primaryModule,
      relatedModules,
      reportType: initialDraft?.reportType || 'tabular',
      columns:
        Array.isArray(initialDraft?.columns) && initialDraft.columns.length > 0
          ? initialDraft.columns
          : defaultCols,
      groupBy: initialDraft?.groupBy || '',
      secondaryGroupBy: initialDraft?.secondaryGroupBy || '',
      groupSort: initialDraft?.groupSort || 'asc',
      summaries: Array.isArray(initialDraft?.summaries) ? initialDraft.summaries : [],
      filterJoin: initialDraft?.filterJoin || 'AND',
      filters: Array.isArray(initialDraft?.filters) ? initialDraft.filters : [],
      visibility: initialDraft?.visibility || 'Everyone',
      sharedUserIds: Array.isArray(initialDraft?.sharedUserIds) ? initialDraft.sharedUserIds : [],
      createdBy: initialDraft?.createdBy || users?.[0]?.name || 'Arun Kumar',
      favorite: Boolean(initialDraft?.favorite),
    };
  });

  const [activeBuilderStep, setActiveBuilderStep] = useState('columns'); // 'modules' | 'columns' | 'groupings' | 'filters' | 'details'
  const [columnSearch, setColumnSearch] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [newFolderInput, setNewFolderInput] = useState('');
  const [addingFolderInline, setAddingFolderInline] = useState(false);

  const primaryModuleMeta = useMemo(
    () =>
      REPORT_PRIMARY_MODULES.find((m) => m.key === draft.primaryModule) ||
      REPORT_PRIMARY_MODULES[0],
    [draft.primaryModule]
  );

  const availableFields = useMemo(
    () => getAvailableFieldsForReport(draft.primaryModule, draft.relatedModules),
    [draft.primaryModule, draft.relatedModules]
  );

  const summarizableFields = useMemo(
    () => availableFields.filter((f) => f.summarizable),
    [availableFields]
  );

  // When primaryModule changes, reset columns to valid fields
  const handlePrimaryModuleChange = (newMod) => {
    const avail = getAvailableFieldsForReport(newMod, []);
    const defaultCols = avail.filter((f) => f.defaultSelected).map((f) => f.key);
    setDraft((prev) => ({
      ...prev,
      primaryModule: newMod,
      relatedModules: [],
      columns: defaultCols,
      groupBy: '',
      summaries: [],
      filters: [],
    }));
  };

  const handleToggleRelatedModule = (relMod) => {
    setDraft((prev) => {
      const has = prev.relatedModules.includes(relMod);
      const nextRel = has
        ? prev.relatedModules.filter((m) => m !== relMod)
        : [...prev.relatedModules, relMod];
      const nextAvail = getAvailableFieldsForReport(prev.primaryModule, nextRel);
      const validKeys = new Set(nextAvail.map((f) => f.key));

      // Automatically include newly unlocked related fields if the user just checked the related module
      const newlyUnlocked = !has
        ? nextAvail.filter((f) => f.module === relMod && f.relatedOnly).map((f) => f.key)
        : [];

      const nextCols = [
        ...prev.columns.filter((k) => validKeys.has(k)),
        ...newlyUnlocked.filter((k) => !prev.columns.includes(k)),
      ];

      return {
        ...prev,
        relatedModules: nextRel,
        columns: nextCols,
      };
    });
  };

  const handleToggleColumn = (fieldKey) => {
    setValidationError('');
    setDraft((prev) => {
      const exists = prev.columns.includes(fieldKey);
      return {
        ...prev,
        columns: exists
          ? prev.columns.filter((k) => k !== fieldKey)
          : [...prev.columns, fieldKey],
      };
    });
  };

  const handleMoveColumn = (index, direction) => {
    setDraft((prev) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.columns.length) return prev;
      const next = [...prev.columns];
      const [item] = next.splice(index, 1);
      next.splice(targetIndex, 0, item);
      return { ...prev, columns: next };
    });
  };

  const handleToggleSummary = (fieldKey, fn) => {
    setDraft((prev) => {
      const exists = prev.summaries.some((s) => s.field === fieldKey && s.fn === fn);
      return {
        ...prev,
        summaries: exists
          ? prev.summaries.filter((s) => !(s.field === fieldKey && s.fn === fn))
          : [...prev.summaries, { field: fieldKey, fn }],
      };
    });
  };

  const handleAddFilter = () => {
    const firstField = availableFields[0]?.key || 'name';
    setDraft((prev) => ({
      ...prev,
      filters: [
        ...prev.filters,
        {
          id: `flt-${Date.now().toString(36)}-${prev.filters.length}`,
          field: firstField,
          operator: 'contains',
          value: '',
        },
      ],
    }));
  };

  const handleUpdateFilter = (id, patch) => {
    setDraft((prev) => ({
      ...prev,
      filters: prev.filters.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    }));
  };

  const handleRemoveFilter = (id) => {
    setDraft((prev) => ({
      ...prev,
      filters: prev.filters.filter((f) => f.id !== id),
    }));
  };

  const handleRefreshPreview = () => {
    setPreviewLoading(true);
    setTimeout(() => setPreviewLoading(false), 180);
  };

  const previewResult = useMemo(() => executeReport(draft, crm), [draft, crm]);

  const validateAndSubmit = (runAfterSave = false) => {
    const cleanName = String(draft.name || '').trim();
    if (!cleanName) {
      setValidationError('Please enter a Report Name before saving.');
      setActiveBuilderStep('details');
      return;
    }
    if (!Array.isArray(draft.columns) || draft.columns.length === 0) {
      setValidationError('Please select at least one report column.');
      setActiveBuilderStep('columns');
      return;
    }
    setValidationError('');
    const payload = {
      ...draft,
      name: cleanName,
      description: String(draft.description || '').trim() || '-',
      reportType: draft.groupBy ? 'summary' : draft.reportType,
    };
    if (runAfterSave) {
      onSaveAndRun(payload);
    } else {
      onSave(payload);
    }
  };

  const filteredAvailableFields = useMemo(() => {
    const q = columnSearch.trim().toLowerCase();
    if (!q) return availableFields;
    return availableFields.filter(
      (f) =>
        f.label.toLowerCase().includes(q) ||
        f.module.toLowerCase().includes(q)
    );
  }, [availableFields, columnSearch]);

  const builderSteps = [
    { key: 'modules', label: '1. Modules & Type', badge: draft.primaryModule },
    { key: 'columns', label: '2. Columns', badge: `${draft.columns.length}` },
    {
      key: 'groupings',
      label: '3. Grouping & Summary',
      badge: `${(draft.groupBy ? 1 : 0) + draft.summaries.length}`,
    },
    { key: 'filters', label: '4. Filters', badge: `${draft.filters.length}` },
    { key: 'details', label: '5. Save & Sharing', badge: draft.folder },
  ];

  return (
    <div data-testid="report-builder-view" className="space-y-3">
      {/* Top Builder Action Bar */}
      <div className="bg-white rounded-xl border border-[#DCE3EE] px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={onCancel}
            className="h-8 w-8 rounded-lg border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] flex items-center justify-center text-[#334155] shrink-0"
            title="Back to Reports"
          >
            <ArrowLeft size={16} />
          </button>

          <div className="min-w-0 flex-1 max-w-md">
            <input
              type="text"
              data-testid="report-builder-name-input"
              value={draft.name}
              onChange={(e) => {
                setValidationError('');
                setDraft((p) => ({ ...p, name: e.target.value }));
              }}
              placeholder="Enter Report Name..."
              className="w-full h-8 px-2.5 rounded border border-[#CBD5E1] focus:border-[#1262E0] focus:outline-none text-[14px] font-bold text-[#0F172A]"
            />
          </div>

          <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EFF6FF] text-[#1262E0] border border-[#BFDBFE] text-[11.5px] font-semibold">
            <span>Primary: {draft.primaryModule}</span>
            {draft.relatedModules.length > 0 && (
              <span>+ {draft.relatedModules.join(', ')}</span>
            )}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="report-builder-run-preview-btn"
            onClick={handleRefreshPreview}
            className="h-8 px-3 rounded border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#1E293B] text-[12.5px] font-medium inline-flex items-center gap-1.5"
          >
            <RefreshCw size={13.5} className={previewLoading ? 'animate-spin text-[#1262E0]' : ''} />
            <span>Run Preview</span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="h-8 px-3 rounded border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#475569] text-[12.5px] font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            data-testid="report-builder-save-btn"
            onClick={() => validateAndSubmit(false)}
            className="h-8 px-3.5 rounded border border-[#1262E0] bg-white hover:bg-[#EFF6FF] text-[#1262E0] text-[12.5px] font-semibold"
          >
            Save
          </button>
          <button
            type="button"
            data-testid="report-builder-save-run-btn"
            onClick={() => validateAndSubmit(true)}
            className="h-8 px-4 rounded bg-[#1262E0] hover:bg-[#0B4BB8] text-white text-[12.5px] font-semibold inline-flex items-center gap-1.5 shadow-2xs"
          >
            <Play size={13} />
            <span>Save &amp; Run</span>
          </button>
        </div>
      </div>

      {validationError && (
        <div
          data-testid="report-builder-validation-error"
          className="rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-2.5 text-[#B91C1C] text-[12.5px] flex items-center gap-2"
        >
          <AlertCircle size={15} className="shrink-0" />
          <span className="font-medium">{validationError}</span>
        </div>
      )}

      {/* Main Split Builder Layout: Left Configuration Panel + Right Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* LEFT PANEL: Guided Configuration Steps (5 cols on lg) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-[#DCE3EE] shadow-2xs overflow-hidden">
          {/* Step Tabs */}
          <div className="flex overflow-x-auto border-b border-[#E2E8F0] bg-[#F8FAFC]">
            {builderSteps.map((step) => {
              const active = activeBuilderStep === step.key;
              return (
                <button
                  key={step.key}
                  type="button"
                  data-testid={`builder-step-${step.key}`}
                  onClick={() => setActiveBuilderStep(step.key)}
                  className={`px-3 py-2.5 text-[12px] font-semibold whitespace-nowrap border-b-2 flex items-center gap-1.5 transition-colors ${
                    active
                      ? 'border-[#1262E0] text-[#1262E0] bg-white'
                      : 'border-transparent text-[#475569] hover:text-[#0F172A]'
                  }`}
                >
                  <span>{step.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10.5px] ${
                      active
                        ? 'bg-[#EFF6FF] text-[#1262E0]'
                        : 'bg-[#E2E8F0] text-[#475569]'
                    }`}
                  >
                    {step.badge}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="p-4 space-y-4">
            {/* STEP 1: MODULES & REPORT TYPE */}
            {activeBuilderStep === 'modules' && (
              <div className="space-y-4 text-[12.5px]">
                <div>
                  <label className="block font-semibold text-[#0F172A] mb-1.5">
                    Report Format / Type
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setDraft((p) => ({ ...p, reportType: 'tabular', groupBy: '' }))}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        draft.reportType === 'tabular'
                          ? 'border-[#1262E0] bg-[#EFF6FF]/60 ring-1 ring-[#1262E0]'
                          : 'border-[#DCE3EE] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-semibold text-[#0F172A]">
                        <TableIcon size={15} className="text-[#1262E0]" />
                        <span>Tabular Report</span>
                      </div>
                      <p className="text-[11.5px] text-[#64748B] mt-1">
                        Simple flat listing of records with grand totals and filters.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setDraft((p) => ({
                          ...p,
                          reportType: 'summary',
                          groupBy: p.groupBy || availableFields[3]?.key || availableFields[0]?.key || '',
                        }))
                      }
                      className={`p-3 rounded-lg border text-left transition-all ${
                        draft.reportType === 'summary'
                          ? 'border-[#1262E0] bg-[#EFF6FF]/60 ring-1 ring-[#1262E0]'
                          : 'border-[#DCE3EE] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-semibold text-[#0F172A]">
                        <Layers size={15} className="text-[#1262E0]" />
                        <span>Summary Report</span>
                      </div>
                      <p className="text-[11.5px] text-[#64748B] mt-1">
                        Group records by field with subtotals, record counts, and averages.
                      </p>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#0F172A] mb-1">
                    Primary Module
                  </label>
                  <select
                    value={draft.primaryModule}
                    onChange={(e) => handlePrimaryModuleChange(e.target.value)}
                    className="input h-9 text-[12.5px]"
                  >
                    {REPORT_PRIMARY_MODULES.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11.5px] text-[#64748B] mt-1">
                    {primaryModuleMeta.description}
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-[#0F172A] mb-1.5">
                    Child / Related Modules (Optional)
                  </label>
                  <p className="text-[11.5px] text-[#64748B] mb-2">
                    Select related modules to include their linked fields and rollup metrics in this report:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {(primaryModuleMeta.relatedModules || []).map((relMod) => {
                      const checked = draft.relatedModules.includes(relMod);
                      return (
                        <label
                          key={relMod}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-[12.5px] transition-colors ${
                            checked
                              ? 'border-[#1262E0] bg-[#EFF6FF] text-[#1262E0] font-semibold'
                              : 'border-[#DCE3EE] bg-white text-[#334155] hover:bg-[#F8FAFC]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleRelatedModule(relMod)}
                            className="rounded border-[#CBD5E1] text-[#1262E0]"
                          />
                          <span>{relMod}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: COLUMNS */}
            {activeBuilderStep === 'columns' && (
              <div className="space-y-3.5 text-[12.5px]">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#0F172A]">
                    Select &amp; Order Report Columns ({draft.columns.length})
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((p) => ({
                        ...p,
                        columns: availableFields.map((f) => f.key),
                      }))
                    }
                    className="text-[11.5px] text-[#1262E0] hover:underline font-medium"
                  >
                    Select All
                  </button>
                </div>

                {/* Selected Columns Order List */}
                <div className="rounded-lg border border-[#DCE3EE] bg-[#F8FAFC] p-2.5 max-h-[190px] overflow-y-auto space-y-1">
                  {draft.columns.length === 0 ? (
                    <p className="text-[12px] text-[#64748B] text-center py-4">
                      No columns selected. Click fields below to add them.
                    </p>
                  ) : (
                    draft.columns.map((colKey, idx) => {
                      const fMeta = availableFields.find((f) => f.key === colKey);
                      if (!fMeta) return null;
                      return (
                        <div
                          key={colKey}
                          className="flex items-center justify-between px-2.5 py-1.5 rounded bg-white border border-[#E2E8F0] text-[12px]"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[11px] font-mono text-[#64748B]">
                              {idx + 1}.
                            </span>
                            <span className="font-medium text-[#0F172A] truncate">
                              {fMeta.label}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-[#F1F5F9] text-[#475569] text-[10px]">
                              {fMeta.module}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveColumn(idx, -1)}
                              className="p-0.5 rounded hover:bg-[#F1F5F9] disabled:opacity-30 text-[#475569]"
                              title="Move column up"
                            >
                              <ArrowUp size={12.5} />
                            </button>
                            <button
                              type="button"
                              disabled={idx === draft.columns.length - 1}
                              onClick={() => handleMoveColumn(idx, 1)}
                              className="p-0.5 rounded hover:bg-[#F1F5F9] disabled:opacity-30 text-[#475569]"
                              title="Move column down"
                            >
                              <ArrowDown size={12.5} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleColumn(colKey)}
                              className="p-0.5 rounded hover:bg-red-50 text-[#64748B] hover:text-red-600"
                              title="Remove column"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Available Fields Picker */}
                <div>
                  <div className="relative mb-2">
                    <Search
                      size={13.5}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#64748B]"
                    />
                    <input
                      type="text"
                      value={columnSearch}
                      onChange={(e) => setColumnSearch(e.target.value)}
                      placeholder="Search available fields..."
                      className="input h-8 pl-8 text-[12px]"
                    />
                  </div>
                  <div className="max-h-[210px] overflow-y-auto border border-[#DCE3EE] rounded-lg divide-y divide-[#F1F5F9]">
                    {filteredAvailableFields.map((field) => {
                      const selected = draft.columns.includes(field.key);
                      return (
                        <label
                          key={field.key}
                          className="flex items-center justify-between px-3 py-2 hover:bg-[#F8FAFC] cursor-pointer text-[12px]"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => handleToggleColumn(field.key)}
                              className="rounded border-[#CBD5E1] text-[#1262E0]"
                            />
                            <span className={selected ? 'font-semibold text-[#0F172A]' : 'text-[#334155]'}>
                              {field.label}
                            </span>
                          </div>
                          <span className="text-[10.5px] px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#64748B]">
                            {field.module}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: GROUPINGS & SUMMARY CALCULATIONS */}
            {activeBuilderStep === 'groupings' && (
              <div className="space-y-4 text-[12.5px]">
                <div>
                  <label className="block font-semibold text-[#0F172A] mb-1">
                    Group Rows By Field (Summary Grouping)
                  </label>
                  <select
                    data-testid="report-builder-groupby-select"
                    value={draft.groupBy}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDraft((p) => ({
                        ...p,
                        groupBy: val,
                        reportType: val ? 'summary' : 'tabular',
                      }));
                    }}
                    className="input h-9 text-[12.5px]"
                  >
                    <option value="">-- None (Tabular Report) --</option>
                    {availableFields.map((f) => (
                      <option key={f.key} value={f.key}>
                        {f.label} ({f.module})
                      </option>
                    ))}
                  </select>
                </div>

                {draft.groupBy && (
                  <div>
                    <label className="block font-semibold text-[#0F172A] mb-1">
                      Group Sort Order
                    </label>
                    <select
                      value={draft.groupSort || 'asc'}
                      onChange={(e) => setDraft((p) => ({ ...p, groupSort: e.target.value }))}
                      className="input h-8 text-[12px]"
                    >
                      <option value="asc">Ascending (A → Z)</option>
                      <option value="desc">Descending (Z → A)</option>
                      <option value="count_desc">Most Records First</option>
                    </select>
                  </div>
                )}

                <div className="pt-2 border-t border-[#E2E8F0]">
                  <label className="block font-semibold text-[#0F172A] mb-1">
                    Summary Calculations (Subtotals &amp; Grand Totals)
                  </label>
                  <p className="text-[11.5px] text-[#64748B] mb-2.5">
                    Select numeric or currency fields to calculate Sum, Average, Min, or Max:
                  </p>

                  {summarizableFields.length === 0 ? (
                    <p className="text-[12px] text-[#64748B] py-3">
                      Add a numeric/currency related module (e.g. Deals or Invoices) to enable numeric summaries, or use record counts.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                      {summarizableFields.map((field) => (
                        <div
                          key={field.key}
                          className="p-2.5 rounded-lg border border-[#DCE3EE] bg-[#F8FAFC]"
                        >
                          <div className="font-medium text-[#0F172A] text-[12px] mb-1.5 flex items-center justify-between">
                            <span>{field.label}</span>
                            <span className="text-[10.5px] text-[#64748B]">{field.module}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {SUMMARY_FUNCTIONS.map((fn) => {
                              const active = draft.summaries.some(
                                (s) => s.field === field.key && s.fn === fn.value
                              );
                              return (
                                <button
                                  key={fn.value}
                                  type="button"
                                  onClick={() => handleToggleSummary(field.key, fn.value)}
                                  className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition-colors ${
                                    active
                                      ? 'border-[#1262E0] bg-[#1262E0] text-white'
                                      : 'border-[#CBD5E1] bg-white text-[#475569] hover:bg-[#F1F5F9]'
                                  }`}
                                >
                                  {fn.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 4: FILTERS */}
            {activeBuilderStep === 'filters' && (
              <div className="space-y-3.5 text-[12.5px]">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-[#0F172A]">Criteria Filters</div>
                    <p className="text-[11.5px] text-[#64748B]">
                      Filter records included in this report
                    </p>
                  </div>
                  <div className="inline-flex items-center rounded-md border border-[#CBD5E1] overflow-hidden text-[11px]">
                    <button
                      type="button"
                      onClick={() => setDraft((p) => ({ ...p, filterJoin: 'AND' }))}
                      className={`px-2.5 py-1 font-semibold ${
                        draft.filterJoin === 'AND'
                          ? 'bg-[#1262E0] text-white'
                          : 'bg-white text-[#475569]'
                      }`}
                    >
                      AND
                    </button>
                    <button
                      type="button"
                      onClick={() => setDraft((p) => ({ ...p, filterJoin: 'OR' }))}
                      className={`px-2.5 py-1 font-semibold ${
                        draft.filterJoin === 'OR'
                          ? 'bg-[#1262E0] text-white'
                          : 'bg-white text-[#475569]'
                      }`}
                    >
                      OR
                    </button>
                  </div>
                </div>

                {draft.filters.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[#CBD5E1] p-5 text-center text-[#64748B] text-[12px]">
                    No filter rules applied — showing all {draft.primaryModule} records.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {draft.filters.map((rule, idx) => (
                      <div
                        key={rule.id}
                        className="p-2.5 rounded-lg border border-[#DCE3EE] bg-[#F8FAFC] space-y-2"
                      >
                        <div className="flex items-center justify-between text-[11px] text-[#64748B]">
                          <span className="font-semibold">
                            {idx === 0 ? 'Where' : draft.filterJoin}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFilter(rule.id)}
                            className="text-red-600 hover:underline inline-flex items-center gap-0.5"
                          >
                            <Trash2 size={11.5} /> Remove
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          <select
                            value={rule.field}
                            onChange={(e) => handleUpdateFilter(rule.id, { field: e.target.value })}
                            className="input h-8 text-[12px]"
                          >
                            {availableFields.map((f) => (
                              <option key={f.key} value={f.key}>
                                {f.label}
                              </option>
                            ))}
                          </select>
                          <select
                            value={rule.operator}
                            onChange={(e) =>
                              handleUpdateFilter(rule.id, { operator: e.target.value })
                            }
                            className="input h-8 text-[12px]"
                          >
                            {FILTER_OPERATORS.map((op) => (
                              <option key={op.value} value={op.value}>
                                {op.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        {rule.operator !== 'is_empty' && rule.operator !== 'is_not_empty' && (
                          <input
                            type="text"
                            value={rule.value}
                            onChange={(e) => handleUpdateFilter(rule.id, { value: e.target.value })}
                            placeholder="Enter filter value..."
                            className="input h-8 text-[12px]"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  data-testid="report-builder-add-filter-btn"
                  onClick={handleAddFilter}
                  className="w-full h-8 rounded-lg border border-dashed border-[#1262E0] text-[#1262E0] hover:bg-[#EFF6FF] text-[12px] font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus size={13.5} />
                  <span>Add Filter Criterion</span>
                </button>
              </div>
            )}

            {/* STEP 5: SAVE DETAILS & VISIBILITY */}
            {activeBuilderStep === 'details' && (
              <div className="space-y-3.5 text-[12.5px]">
                <div>
                  <label className="block font-semibold text-[#0F172A] mb-1">
                    Report Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={draft.name}
                    onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Q4 Enterprise Deals by Stage"
                    className="input h-9 text-[12.5px]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#0F172A] mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={draft.description}
                    onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Optional description of what this report tracks..."
                    className="input p-2 text-[12.5px]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-[#0F172A]">Report Folder</label>
                    <button
                      type="button"
                      onClick={() => setAddingFolderInline((p) => !p)}
                      className="text-[11.5px] text-[#1262E0] hover:underline inline-flex items-center gap-1"
                    >
                      <FolderPlus size={12} />
                      <span>{addingFolderInline ? 'Cancel' : '+ New Folder'}</span>
                    </button>
                  </div>

                  {addingFolderInline ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={newFolderInput}
                        onChange={(e) => setNewFolderInput(e.target.value)}
                        placeholder="New folder name..."
                        className="input h-8 text-[12px] flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const clean = newFolderInput.trim();
                          if (!clean) return;
                          onCreateFolder?.({ name: clean });
                          setDraft((p) => ({ ...p, folder: clean }));
                          setNewFolderInput('');
                          setAddingFolderInline(false);
                        }}
                        className="h-8 px-3 rounded bg-[#1262E0] text-white text-[12px] font-semibold"
                      >
                        Add
                      </button>
                    </div>
                  ) : (
                    <select
                      data-testid="report-builder-folder-select"
                      value={draft.folder}
                      onChange={(e) => setDraft((p) => ({ ...p, folder: e.target.value }))}
                      className="input h-9 text-[12.5px]"
                    >
                      {folders.map((f) => (
                        <option key={f.id || f.name} value={f.name}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-[#0F172A] mb-1.5">
                    Visibility &amp; Sharing
                  </label>
                  <div className="space-y-1.5">
                    {[
                      {
                        value: 'Everyone',
                        label: 'Share with Everyone',
                        desc: 'All CRM users can view and run this report',
                        icon: Globe,
                      },
                      {
                        value: 'Private',
                        label: 'Only Me (Private)',
                        desc: 'Visible only to you',
                        icon: Lock,
                      },
                      {
                        value: 'Selected Users',
                        label: 'Selected Users',
                        desc: 'Share with specific team members',
                        icon: Users,
                      },
                    ].map((opt) => {
                      const Icon = opt.icon;
                      const active = draft.visibility === opt.value;
                      return (
                        <label
                          key={opt.value}
                          className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                            active
                              ? 'border-[#1262E0] bg-[#EFF6FF]/60'
                              : 'border-[#DCE3EE] bg-white hover:bg-[#F8FAFC]'
                          }`}
                        >
                          <input
                            type="radio"
                            name="report-visibility"
                            checked={active}
                            onChange={() => setDraft((p) => ({ ...p, visibility: opt.value }))}
                            className="mt-0.5 text-[#1262E0]"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-[#0F172A] text-[12px] flex items-center gap-1.5">
                              <Icon size={13} className="text-[#1262E0]" />
                              <span>{opt.label}</span>
                            </div>
                            <div className="text-[11px] text-[#64748B]">{opt.desc}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  {draft.visibility === 'Selected Users' && (
                    <div className="mt-2 p-2.5 rounded-lg border border-[#DCE3EE] bg-[#F8FAFC] space-y-1.5">
                      <div className="text-[11px] font-semibold text-[#475569]">
                        Choose Users:
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {(users || []).map((u) => {
                          const checked = draft.sharedUserIds.includes(u.id);
                          return (
                            <label
                              key={u.id}
                              className="flex items-center gap-1.5 text-[11.5px] text-[#334155] cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  setDraft((p) => ({
                                    ...p,
                                    sharedUserIds: checked
                                      ? p.sharedUserIds.filter((id) => id !== u.id)
                                      : [...p.sharedUserIds, u.id],
                                  }))
                                }
                                className="rounded border-[#CBD5E1] text-[#1262E0]"
                              />
                              <span className="truncate">{u.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: LIVE INTERACTIVE PREVIEW (7 cols on lg) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-[#DCE3EE] shadow-2xs overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC] flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-[#0F172A]">
                  Live Report Preview
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D] text-[11px] font-semibold">
                  {previewResult.totalCount} {previewResult.totalCount === 1 ? 'record' : 'records'}
                </span>
                {draft.groupBy && (
                  <span className="px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#1262E0] text-[11px] font-semibold">
                    Grouped by {previewResult.fieldMetaMap[draft.groupBy]?.label || draft.groupBy}
                  </span>
                )}
              </div>
              <p className="text-[11.5px] text-[#64748B]">
                Real-time preview generated from your CRM {draft.primaryModule} records
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => exportReportResultsCSV(draft.name, previewResult)}
                disabled={previewResult.totalCount === 0}
                className="h-7 px-2.5 rounded border border-[#CBD5E1] bg-white hover:bg-[#F1F5F9] disabled:opacity-40 text-[#334155] text-[11.5px] font-medium inline-flex items-center gap-1"
              >
                <Download size={12} />
                <span>CSV</span>
              </button>
              <button
                type="button"
                onClick={() => exportReportResultsExcel(draft.name, previewResult)}
                disabled={previewResult.totalCount === 0}
                className="h-7 px-2.5 rounded border border-[#CBD5E1] bg-white hover:bg-[#F1F5F9] disabled:opacity-40 text-[#334155] text-[11.5px] font-medium inline-flex items-center gap-1"
              >
                <FileSpreadsheet size={12} className="text-[#16A34A]" />
                <span>Excel</span>
              </button>
            </div>
          </div>

          {/* Summary KPI Strip in Preview */}
          {previewResult.grandSummaries.length > 0 && (
            <div className="px-4 py-2.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-wrap items-center gap-3">
              {previewResult.grandSummaries.map((s) => (
                <div
                  key={s.key}
                  className="px-3 py-1.5 rounded-lg bg-white border border-[#DCE3EE] text-[11.5px]"
                >
                  <span className="text-[#64748B]">
                    {s.fnLabel} of {s.fieldLabel}:{' '}
                  </span>
                  <strong className="text-[#0F172A] font-semibold">{s.formatted}</strong>
                </div>
              ))}
            </div>
          )}

          {/* Preview Body */}
          {previewLoading ? (
            <div className="p-12 text-center text-[#64748B] text-[13px] flex flex-col items-center gap-2">
              <RefreshCw size={22} className="animate-spin text-[#1262E0]" />
              <span>Refreshing report preview...</span>
            </div>
          ) : previewResult.columnsMeta.length === 0 ? (
            <div className="p-12 text-center text-[#64748B] text-[13px]">
              Select at least one column in Step 2 to preview the report table.
            </div>
          ) : previewResult.totalCount === 0 ? (
            <div className="p-12 text-center space-y-2">
              <div className="text-[14px] font-semibold text-[#0F172A]">
                No records match the current report filters
              </div>
              <p className="text-[12.5px] text-[#64748B]">
                Try relaxing or removing a filter rule in Step 4 to see matching records.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
              <ReportDataTable executionResult={previewResult} maxPreviewRows={25} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Shared Report Data Table component used in both Live Preview and Full Report Viewer.
 * Renders either Tabular rows or Grouped Summary sections with subtotals & grand totals.
 */
function ReportDataTable({
  executionResult,
  sortField = '',
  sortDir = 'asc',
  onSort,
  maxPreviewRows = 0,
}) {
  const { columnsMeta, rows, groups, grandSummaries } = executionResult;
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const toggleGroup = (gVal) => {
    setCollapsedGroups((prev) => ({ ...prev, [gVal]: !prev[gVal] }));
  };

  const displayRows = maxPreviewRows > 0 ? rows.slice(0, maxPreviewRows) : rows;

  return (
    <table className="w-full border-collapse text-left text-[12.5px]">
      <thead className="sticky top-0 z-10 bg-[#F8FAFC] border-b border-[#DCE3EE] text-[#475569] font-semibold">
        <tr>
          {columnsMeta.map((col) => {
            const isNumeric =
              col.type === 'currency' || col.type === 'number' || col.type === 'percent';
            const isSorted = sortField === col.key;
            return (
              <th
                key={col.key}
                onClick={() => onSort?.(col.key)}
                className={`px-3.5 py-2.5 whitespace-nowrap select-none ${
                  onSort ? 'cursor-pointer hover:text-[#0F172A]' : ''
                } ${isNumeric ? 'text-right' : 'text-left'}`}
              >
                <span className="inline-flex items-center gap-1">
                  <span>{col.label}</span>
                  {onSort && (
                    <ArrowUpDown
                      size={12}
                      className={isSorted ? 'text-[#1262E0]' : 'text-[#94A3B8]'}
                    />
                  )}
                </span>
              </th>
            );
          })}
        </tr>
      </thead>

      <tbody className="divide-y divide-[#EEF2F7]">
        {groups.length > 0
          ? groups.map((group) => {
              const isCollapsed = Boolean(collapsedGroups[group.groupValue]);
              return (
                <GroupSectionRows
                  key={group.groupValue}
                  group={group}
                  columnsMeta={columnsMeta}
                  isCollapsed={isCollapsed}
                  onToggle={() => toggleGroup(group.groupValue)}
                />
              );
            })
          : displayRows.map((row) => (
              <tr key={row.id} className="hover:bg-[#F8FAFC] transition-colors">
                {columnsMeta.map((col, cIdx) => {
                  const isNumeric =
                    col.type === 'currency' || col.type === 'number' || col.type === 'percent';
                  const formatted = formatReportCell(row[col.key], col.type);
                  return (
                    <td
                      key={col.key}
                      className={`px-3.5 py-2 whitespace-nowrap ${
                        isNumeric ? 'text-right font-mono text-[#0F172A]' : 'text-[#1E293B]'
                      }`}
                    >
                      {cIdx === 0 && row._linkPath ? (
                        <Link
                          to={row._linkPath}
                          className="text-[#1262E0] hover:underline font-medium"
                        >
                          {formatted}
                        </Link>
                      ) : (
                        formatted
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
      </tbody>

      {grandSummaries.length > 0 && (
        <tfoot className="bg-[#F8FAFC] border-t-2 border-[#DCE3EE] font-semibold text-[#0F172A]">
          <tr>
            <td colSpan={columnsMeta.length} className="px-3.5 py-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[12px] uppercase tracking-wider text-[#475569]">
                  Grand Total ({executionResult.totalCount} records)
                </span>
                <div className="flex flex-wrap items-center gap-4">
                  {grandSummaries.map((s) => (
                    <span key={s.key} className="text-[12.5px]">
                      <span className="text-[#64748B] font-normal">
                        {s.fnLabel} ({s.fieldLabel}):{' '}
                      </span>
                      <span className="font-mono font-bold text-[#0F172A]">{s.formatted}</span>
                    </span>
                  ))}
                </div>
              </div>
            </td>
          </tr>
        </tfoot>
      )}
    </table>
  );
}

function GroupSectionRows({ group, columnsMeta, isCollapsed, onToggle }) {
  return (
    <>
      <tr
        onClick={onToggle}
        className="bg-[#F1F5F9]/80 hover:bg-[#E2E8F0]/60 cursor-pointer select-none"
      >
        <td colSpan={columnsMeta.length} className="px-3.5 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {isCollapsed ? (
                <ChevronRight size={14} className="text-[#475569]" />
              ) : (
                <ChevronDown size={14} className="text-[#475569]" />
              )}
              <span className="text-[12px] text-[#64748B]">{group.groupFieldLabel}:</span>
              <span className="font-bold text-[#0F172A] text-[12.5px]">
                {group.groupValue}
              </span>
              <span className="px-2 py-0.2 rounded-full bg-white border border-[#CBD5E1] text-[#334155] text-[11px] font-semibold">
                {group.count}
              </span>
            </div>

            {group.summaries.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 text-[11.5px]">
                {group.summaries.map((s) => (
                  <span key={s.key} className="text-[#334155]">
                    <span className="text-[#64748B]">{s.fnLabel} {s.fieldLabel}: </span>
                    <strong className="font-mono text-[#0F172A]">{s.formatted}</strong>
                  </span>
                ))}
              </div>
            )}
          </div>
        </td>
      </tr>

      {!isCollapsed &&
        group.rows.map((row) => (
          <tr key={row.id} className="hover:bg-[#F8FAFC] transition-colors">
            {columnsMeta.map((col, cIdx) => {
              const isNumeric =
                col.type === 'currency' || col.type === 'number' || col.type === 'percent';
              const formatted = formatReportCell(row[col.key], col.type);
              return (
                <td
                  key={col.key}
                  className={`px-3.5 py-2 whitespace-nowrap ${
                    isNumeric ? 'text-right font-mono text-[#0F172A]' : 'text-[#1E293B]'
                  }`}
                >
                  {cIdx === 0 && row._linkPath ? (
                    <Link
                      to={row._linkPath}
                      className="text-[#1262E0] hover:underline font-medium"
                    >
                      {formatted}
                    </Link>
                  ) : (
                    formatted
                  )}
                </td>
              );
            })}
          </tr>
        ))}
    </>
  );
}

/**
 * Full Report Detail Viewer when a saved report is opened.
 */
function ReportDetailView({
  report,
  crm,
  onBack,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleFavorite,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir] = useState('asc');
  const [showChart, setShowChart] = useState(Boolean(report.groupBy));

  const handleSort = (fieldKey) => {
    if (sortField === fieldKey) {
      setSortDir((p) => (p === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(fieldKey);
      setSortDir('asc');
    }
  };

  const executionResult = useMemo(
    () => executeReport(report, crm, { searchQuery, sortField, sortDir }),
    [report, crm, searchQuery, sortField, sortDir]
  );

  const maxGroupCount = useMemo(
    () => Math.max(1, ...executionResult.groups.map((g) => g.count)),
    [executionResult.groups]
  );

  return (
    <div data-testid="report-detail-view" className="space-y-3.5">
      {/* Top Report Header */}
      <div className="bg-white rounded-xl border border-[#DCE3EE] px-4 sm:px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <button
            type="button"
            data-testid="report-detail-back-btn"
            onClick={onBack}
            className="h-8 w-8 rounded-lg border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] flex items-center justify-center text-[#334155] shrink-0"
            title="Back to All Reports"
          >
            <ArrowLeft size={16} />
          </button>

          <button
            type="button"
            onClick={() => onToggleFavorite(report.id)}
            title={report.favorite ? 'Remove from Favorites' : 'Add to Favorites'}
            className="mt-1 sm:mt-0 text-[#94A3B8] hover:text-amber-400"
          >
            <Star
              size={17}
              className={report.favorite ? 'fill-amber-400 text-amber-400' : ''}
            />
          </button>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1
                data-testid="report-detail-title"
                className="text-[16px] sm:text-[18px] font-bold text-[#0F172A] truncate"
              >
                {report.name}
              </h1>
              <span className="px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1262E0] border border-[#BFDBFE] text-[11px] font-semibold">
                {report.primaryModule}
              </span>
              <span className="px-2 py-0.5 rounded bg-[#F1F5F9] text-[#475569] text-[11px] font-medium">
                Folder: {report.folder}
              </span>
              <span className="px-2 py-0.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] text-[11px]">
                {report.visibility || 'Everyone'}
              </span>
            </div>
            <p className="text-[12px] text-[#64748B] mt-0.5">
              {report.description && report.description !== '-'
                ? report.description
                : `${report.reportType === 'summary' ? 'Summary' : 'Tabular'} report · Created by ${report.createdBy} · Last accessed ${report.lastAccessedDate}`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 ml-auto">
          {executionResult.groups.length > 0 && (
            <button
              type="button"
              onClick={() => setShowChart((p) => !p)}
              className={`h-8 px-3 rounded border text-[12px] font-medium inline-flex items-center gap-1.5 ${
                showChart
                  ? 'border-[#1262E0] bg-[#EFF6FF] text-[#1262E0] font-semibold'
                  : 'border-[#CBD5E1] bg-white text-[#334155] hover:bg-[#F8FAFC]'
              }`}
            >
              <BarChart3 size={13.5} />
              <span>{showChart ? 'Hide Chart' : 'Show Chart'}</span>
            </button>
          )}

          <button
            type="button"
            data-testid="report-detail-edit-btn"
            onClick={() => onEdit(report)}
            className="h-8 px-3 rounded border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#1E293B] text-[12px] font-semibold inline-flex items-center gap-1.5"
          >
            <Edit3 size={13.5} />
            <span>Edit</span>
          </button>

          <button
            type="button"
            onClick={() => onDuplicate(report.id)}
            className="h-8 px-3 rounded border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#1E293B] text-[12px] font-medium inline-flex items-center gap-1.5"
          >
            <Copy size={13.5} />
            <span>Duplicate</span>
          </button>

          <button
            type="button"
            data-testid="report-detail-export-csv-btn"
            onClick={() => exportReportResultsCSV(report.name, executionResult)}
            className="h-8 px-3 rounded border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#1E293B] text-[12px] font-medium inline-flex items-center gap-1.5"
          >
            <Download size={13.5} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            data-testid="report-detail-export-excel-btn"
            onClick={() => exportReportResultsExcel(report.name, executionResult)}
            className="h-8 px-3 rounded border border-[#16A34A]/30 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#15803D] text-[12px] font-semibold inline-flex items-center gap-1.5"
          >
            <FileSpreadsheet size={13.5} />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="h-8 w-8 rounded border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#475569] inline-flex items-center justify-center"
            title="Print Report"
          >
            <Printer size={14} />
          </button>

          <button
            type="button"
            onClick={() => onDelete(report)}
            className="h-8 w-8 rounded border border-[#FECACA] bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] inline-flex items-center justify-center"
            title="Delete Report"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-[#DCE3EE] p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
            Total Records
          </div>
          <div className="text-[20px] font-bold text-[#0F172A] mt-1">
            {executionResult.totalCount}
          </div>
          <div className="text-[11px] text-[#64748B] mt-0.5">
            Primary Module: {report.primaryModule}
          </div>
        </div>

        {executionResult.grandSummaries.map((s) => (
          <div
            key={s.key}
            className="bg-white rounded-xl border border-[#DCE3EE] p-3.5 shadow-2xs"
          >
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              {s.fnLabel} of {s.fieldLabel}
            </div>
            <div className="text-[20px] font-bold text-[#1262E0] mt-1 font-mono">
              {s.formatted}
            </div>
            <div className="text-[11px] text-[#64748B] mt-0.5">
              Calculated across {executionResult.totalCount} records
            </div>
          </div>
        ))}
      </div>

      {/* Optional Visual Group Breakdown Chart */}
      {showChart && executionResult.groups.length > 0 && (
        <div className="bg-white rounded-xl border border-[#DCE3EE] p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-bold text-[#0F172A]">
              Distribution by {executionResult.groups[0]?.groupFieldLabel}
            </h3>
            <span className="text-[11.5px] text-[#64748B]">
              {executionResult.groups.length} groups
            </span>
          </div>
          <div className="space-y-2">
            {executionResult.groups.map((g) => {
              const pct = Math.round((g.count / maxGroupCount) * 100);
              return (
                <div key={g.groupValue} className="grid grid-cols-12 items-center gap-2 text-[12px]">
                  <div className="col-span-4 sm:col-span-3 font-medium text-[#1E293B] truncate">
                    {g.groupValue}
                  </div>
                  <div className="col-span-6 sm:col-span-7 bg-[#F1F5F9] h-5 rounded-md overflow-hidden">
                    <div
                      className="h-full bg-[#1262E0] rounded-md transition-all"
                      style={{ width: `${Math.max(pct, 6)}%` }}
                    />
                  </div>
                  <div className="col-span-2 text-right font-mono font-semibold text-[#0F172A]">
                    {g.count} ({Math.round((g.count / Math.max(1, executionResult.totalCount)) * 100)}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Report Results Table Card */}
      <div className="bg-white rounded-xl border border-[#DCE3EE] shadow-2xs overflow-hidden">
        <div className="px-4 py-2.5 border-b border-[#E2E8F0] bg-[#F8FAFC] flex flex-wrap items-center justify-between gap-2">
          <div className="relative w-full sm:w-72">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#64748B]"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search within ${report.name}...`}
              className="input h-8 pl-8 text-[12.5px]"
            />
          </div>

          <div className="text-[12px] text-[#64748B]">
            Showing <strong className="text-[#0F172A]">{executionResult.totalCount}</strong>{' '}
            {executionResult.totalCount === 1 ? 'row' : 'rows'}
          </div>
        </div>

        {executionResult.totalCount === 0 ? (
          <div className="p-12 text-center space-y-2">
            <div className="text-[14px] font-semibold text-[#0F172A]">
              No matching records found
            </div>
            <p className="text-[12.5px] text-[#64748B]">
              Try clearing the search query or click Edit to adjust the report filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <ReportDataTable
              executionResult={executionResult}
              sortField={sortField}
              sortDir={sortDir}
              onSort={handleSort}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Main Reports Page Component (All Reports List + Step 1 Modal + Builder + Report Viewer).
 * Matches Zoho CRM Screenshot 1 (media_1791805306043_fb6f1a98.png) & Screenshot 2 (media_1791805305901_0d2ba60c.png).
 */
export default function Reports() {
  const crm = useCRM();
  const {
    reports = [],
    reportFolders = DEFAULT_REPORT_FOLDERS,
    users = [],
    saveReport,
    deleteReports,
    duplicateReport,
    toggleFavoriteReport,
    markReportAccessed,
    saveReportFolder,
    deleteReportFolder,
  } = crm;

  const toast = useToast();
  const navigate = useNavigate();
  const { reportId: routeReportId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  // Folder & View filtering state
  const [selectedFolder, setSelectedFolder] = useState('All Reports');
  const [folderDropdownOpen, setFolderDropdownOpen] = useState(false);
  const [folderSidebarOpen, setFolderSidebarOpen] = useState(false);
  const [newFolderModalOpen, setNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');

  // Create New Report (Step 1 modal) & Guided Builder (Step 2) state
  const [step1ModalOpen, setStep1ModalOpen] = useState(false);
  const [builderDraft, setBuilderDraft] = useState(null); // non-null when creating/editing in step 2

  // Active row menu (`...` button next to report name)
  const [openRowMenuId, setOpenRowMenuId] = useState(null);

  // Delete confirmation dialog state
  const [confirmDelete, setConfirmDelete] = useState(null); // { ids: [], label: '' }

  // Move to folder modal for bulk or single report
  const [moveFolderTarget, setMoveFolderTarget] = useState(null); // { ids: [], folder: 'Overall' }

  const folderDropdownRef = useRef(null);

  // Open Step 1 modal automatically if ?create=1 is in URL
  useEffect(() => {
    if (searchParams.get('create') === '1') {
      setStep1ModalOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('create');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Close folder dropdown on outside click
  useEffect(() => {
    if (!folderDropdownOpen) return undefined;
    const onDoc = (e) => {
      if (folderDropdownRef.current && !folderDropdownRef.current.contains(e.target)) {
        setFolderDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [folderDropdownOpen]);

  // Search & Folder filtering state
  const [reportSearch, setReportSearch] = useState('');

  // Filter reports by selected folder / view and search query before passing to useTable
  const folderFilteredReports = useMemo(() => {
    let base = reports;
    if (selectedFolder === 'Favorites') {
      base = reports.filter((r) => r.favorite);
    } else if (selectedFolder === 'Created by Me') {
      const meName = users[0]?.name || 'Arun Kumar';
      base = reports.filter((r) => r.createdBy === meName || r.createdBy === 'Administration Team');
    } else if (selectedFolder !== 'All Reports') {
      base = reports.filter((r) => r.folder === selectedFolder);
    }

    const q = reportSearch.trim().toLowerCase();
    if (!q) return base;
    return base.filter((r) =>
      [r.name, r.description, r.folder, r.primaryModule, r.createdBy, r.lastAccessedDate].some((v) =>
        String(v || '').toLowerCase().includes(q)
      )
    );
  }, [reports, selectedFolder, users, reportSearch]);

  const table = useTable(folderFilteredReports, {
    defaultSort: null,
    pageSize: 15,
  });

  const openReportId = routeReportId || searchParams.get('open');
  const activeReport = useMemo(
    () => (openReportId ? reports.find((r) => r.id === openReportId) || null : null),
    [openReportId, reports]
  );

  const handleOpenReport = (rep) => {
    if (!rep) return;
    markReportAccessed?.(rep.id);
    navigate(`/reports/${rep.id}`);
  };

  const handleStartBuilderFromModule = (primaryModule) => {
    setStep1ModalOpen(false);
    const avail = getAvailableFieldsForReport(primaryModule, []);
    const defaultCols = avail.filter((f) => f.defaultSelected).map((f) => f.key);
    setBuilderDraft({
      id: '',
      name: `New ${primaryModule} Report`,
      description: '',
      folder:
        selectedFolder !== 'All Reports' &&
        selectedFolder !== 'Favorites' &&
        selectedFolder !== 'Created by Me'
          ? selectedFolder
          : 'Overall',
      primaryModule,
      relatedModules: [],
      reportType: 'tabular',
      columns: defaultCols,
      groupBy: '',
      summaries: [],
      filterJoin: 'AND',
      filters: [],
      visibility: 'Everyone',
      sharedUserIds: [],
      createdBy: users[0]?.name || 'Arun Kumar',
    });
  };

  const handleEditReport = (rep) => {
    setOpenRowMenuId(null);
    setBuilderDraft({ ...rep });
  };

  const handleDuplicateReport = (id) => {
    setOpenRowMenuId(null);
    const copy = duplicateReport(id);
    if (copy) {
      toast.success(`Duplicated report as "${copy.name}"`);
    }
  };

  const handleRequestDelete = (ids, label) => {
    setOpenRowMenuId(null);
    setConfirmDelete({ ids, label });
  };

  // 1. If Guided Report Builder is active, render ReportBuilderView
  if (builderDraft) {
    return (
      <ReportBuilderView
        initialDraft={builderDraft}
        folders={reportFolders}
        users={users}
        crm={crm}
        onCancel={() => setBuilderDraft(null)}
        onCreateFolder={(fData) => {
          saveReportFolder(fData);
          toast.success(`Created folder "${fData.name}"`);
        }}
        onSave={(payload) => {
          const saved = saveReport(payload);
          toast.success(`Saved report "${saved.name}"`);
          setBuilderDraft(null);
        }}
        onSaveAndRun={(payload) => {
          const saved = saveReport(payload);
          toast.success(`Saved and opened "${saved.name}"`);
          setBuilderDraft(null);
          navigate(`/reports/${saved.id}`);
        }}
      />
    );
  }

  // 2. If viewing a specific Report (/reports/:reportId), render ReportDetailView
  if (activeReport) {
    return (
      <>
        <ReportDetailView
          report={activeReport}
          crm={crm}
          onBack={() => navigate('/reports')}
          onEdit={(rep) => setBuilderDraft({ ...rep })}
          onDuplicate={(id) => {
            const copy = duplicateReport(id);
            if (copy) {
              toast.success(`Duplicated report as "${copy.name}"`);
              navigate(`/reports/${copy.id}`);
            }
          }}
          onDelete={(rep) => handleRequestDelete([rep.id], rep.name)}
          onToggleFavorite={(id) => toggleFavoriteReport(id)}
        />
        <ConfirmDialog
          open={Boolean(confirmDelete)}
          onClose={() => setConfirmDelete(null)}
          title="Delete report?"
          confirmLabel="Delete Report"
          message={
            confirmDelete
              ? `Are you sure you want to delete "${confirmDelete.label}"? This action cannot be undone.`
              : ''
          }
          onConfirm={() => {
            if (!confirmDelete) return;
            deleteReports(confirmDelete.ids);
            toast.success(`Deleted ${confirmDelete.label}`);
            setConfirmDelete(null);
            navigate('/reports');
          }}
        />
      </>
    );
  }

  // 3. Default: All Reports List View matching Screenshot 1 (media_1791805306043_fb6f1a98.png)
  return (
    <div
      data-testid="reports-page"
      className="mx-0 sm:-mx-[18px] -mt-2.5 -mb-6 bg-white min-h-[calc(100vh-60px)] flex flex-col"
    >
      {/* Top Toolbar Row matching Screenshot 1 */}
      <div className="px-4 sm:px-6 py-2.5 border-b border-[#E2E8F0] bg-white flex flex-wrap items-center justify-between gap-3">
        {/* Left: "All Reports ▾" Folder Selector Dropdown */}
        <div className="flex items-center gap-2">
          <div ref={folderDropdownRef} className="relative">
            <button
              type="button"
              data-testid="reports-folder-selector"
              onClick={() => setFolderDropdownOpen((p) => !p)}
              className="h-8 px-3 rounded border border-[#3B82F6] bg-white hover:bg-[#F8FAFC] text-[#0F172A] text-[12.5px] font-medium inline-flex items-center gap-2 shadow-2xs"
            >
              <span>{selectedFolder}</span>
              <ChevronDown size={13.5} className="text-[#475569]" />
            </button>

            {folderDropdownOpen && (
              <div className="absolute left-0 top-full mt-1 w-64 rounded-lg border border-[#DCE3EE] bg-white shadow-xl py-1.5 z-40 text-[12.5px]">
                {[
                  { key: 'All Reports', label: 'All Reports', count: reports.length },
                  {
                    key: 'Favorites',
                    label: 'Favorites',
                    count: reports.filter((r) => r.favorite).length,
                  },
                  {
                    key: 'Created by Me',
                    label: 'Created by Me',
                    count: reports.filter(
                      (r) =>
                        r.createdBy === (users[0]?.name || 'Arun Kumar') ||
                        r.createdBy === 'Administration Team'
                    ).length,
                  },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setSelectedFolder(item.key);
                      setFolderDropdownOpen(false);
                    }}
                    className={`w-full px-3.5 py-1.5 text-left flex items-center justify-between hover:bg-[#F8FAFC] ${
                      selectedFolder === item.key
                        ? 'bg-[#EFF6FF] text-[#1262E0] font-semibold'
                        : 'text-[#1E293B]'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="text-[11px] text-[#64748B]">{item.count}</span>
                  </button>
                ))}

                <div className="my-1 border-t border-[#E2E8F0]" />
                <div className="px-3.5 py-1 text-[10.5px] font-bold uppercase tracking-wider text-[#64748B]">
                  Folders
                </div>

                <div className="max-h-56 overflow-y-auto">
                  {reportFolders.map((fld) => {
                    const count = reports.filter((r) => r.folder === fld.name).length;
                    const active = selectedFolder === fld.name;
                    return (
                      <button
                        key={fld.id || fld.name}
                        type="button"
                        onClick={() => {
                          setSelectedFolder(fld.name);
                          setFolderDropdownOpen(false);
                        }}
                        className={`w-full px-3.5 py-1.5 text-left flex items-center justify-between hover:bg-[#F8FAFC] ${
                          active
                            ? 'bg-[#EFF6FF] text-[#1262E0] font-semibold'
                            : 'text-[#1E293B]'
                        }`}
                      >
                        <span className="inline-flex items-center gap-2 truncate">
                          <Folder size={13} className={active ? 'text-[#1262E0]' : 'text-[#64748B]'} />
                          <span className="truncate">{fld.name}</span>
                        </span>
                        <span className="text-[11px] text-[#64748B]">{count}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-1 pt-1 border-t border-[#E2E8F0] px-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFolderDropdownOpen(false);
                      setNewFolderModalOpen(true);
                    }}
                    className="w-full px-2 py-1.5 rounded text-left text-[#1262E0] hover:bg-[#EFF6FF] font-semibold inline-flex items-center gap-1.5 text-[12px]"
                  >
                    <FolderPlus size={13.5} />
                    <span>+ Create Folder</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {selectedFolder !== 'All Reports' && (
            <button
              type="button"
              onClick={() => setSelectedFolder('All Reports')}
              className="text-[11.5px] text-[#1262E0] hover:underline font-medium"
            >
              Clear folder filter
            </button>
          )}
        </div>

        {/* Right: Search All Reports + Create Report + Folder Panel button */}
        <div className="flex flex-wrap items-center gap-2.5 ml-auto">
          <div className="relative w-56 sm:w-64">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none"
            />
            <input
              type="text"
              data-testid="reports-search-input"
              value={reportSearch}
              onChange={(e) => {
                setReportSearch(e.target.value);
                table.resetPage();
              }}
              placeholder={`Search ${selectedFolder}`}
              className="w-full h-8 pl-8 pr-7 rounded border border-[#CBD5E1] bg-white text-[12.5px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1262E0]"
            />
            {reportSearch && (
              <button
                type="button"
                onClick={() => {
                  setReportSearch('');
                  table.resetPage();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569]"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <button
            type="button"
            data-testid="create-report-btn"
            onClick={() => setStep1ModalOpen(true)}
            className="h-8 px-4 rounded bg-[#1262E0] hover:bg-[#0B4BB8] text-white text-[12.5px] font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <span>Create Report</span>
          </button>

          <button
            type="button"
            onClick={() => setFolderSidebarOpen((p) => !p)}
            title="Toggle Report Folders Panel"
            className={`h-8 w-8 rounded border flex items-center justify-center transition-colors ${
              folderSidebarOpen
                ? 'border-[#1262E0] bg-[#EFF6FF] text-[#1262E0]'
                : 'border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#475569]'
            }`}
          >
            <Folder size={15} />
          </button>
        </div>
      </div>

      {/* Bulk Action Bar when rows are selected */}
      {table.selected.size > 0 && (
        <div className="px-4 sm:px-6 py-2 bg-[#EFF6FF] border-b border-[#BFDBFE] flex flex-wrap items-center justify-between gap-2 text-[12.5px]">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-[#1E3A8A]">
              {table.selected.size} {table.selected.size === 1 ? 'report' : 'reports'} selected
            </span>
            <button
              type="button"
              onClick={table.clearSelection}
              className="text-[#1262E0] hover:underline font-medium text-[12px]"
            >
              Deselect all
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setMoveFolderTarget({
                  ids: Array.from(table.selected),
                  folder: 'Overall',
                })
              }
              className="h-7 px-2.5 rounded border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#1E293B] text-[12px] font-medium inline-flex items-center gap-1"
            >
              <Folder size={12.5} />
              <span>Move to Folder</span>
            </button>
            <button
              type="button"
              onClick={() =>
                handleRequestDelete(
                  Array.from(table.selected),
                  `${table.selected.size} selected report(s)`
                )
              }
              className="h-7 px-2.5 rounded border border-[#FECACA] bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] text-[12px] font-semibold inline-flex items-center gap-1"
            >
              <Trash2 size={12.5} />
              <span>Delete Selected</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area: Optional Folder Sidebar + Reports Table */}
      <div className="flex-1 flex min-h-0">
        {folderSidebarOpen && (
          <aside className="w-60 border-r border-[#E2E8F0] bg-[#F8FAFC] p-3 flex flex-col justify-between shrink-0">
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                  Report Folders
                </span>
                <button
                  type="button"
                  onClick={() => setNewFolderModalOpen(true)}
                  className="text-[11.5px] text-[#1262E0] hover:underline font-semibold"
                >
                  + New
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedFolder('All Reports')}
                className={`w-full px-2.5 py-1.5 rounded text-left text-[12.5px] flex items-center justify-between ${
                  selectedFolder === 'All Reports'
                    ? 'bg-[#EFF6FF] text-[#1262E0] font-semibold'
                    : 'text-[#334155] hover:bg-white'
                }`}
              >
                <span>All Reports</span>
                <span className="text-[11px] text-[#64748B]">{reports.length}</span>
              </button>

              {reportFolders.map((fld) => {
                const count = reports.filter((r) => r.folder === fld.name).length;
                const active = selectedFolder === fld.name;
                return (
                  <div
                    key={fld.id || fld.name}
                    className={`group flex items-center justify-between px-2.5 py-1.5 rounded text-[12.5px] ${
                      active
                        ? 'bg-[#EFF6FF] text-[#1262E0] font-semibold'
                        : 'text-[#334155] hover:bg-white'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedFolder(fld.name)}
                      className="flex-1 text-left truncate flex items-center gap-2"
                    >
                      <Folder size={13} className={active ? 'text-[#1262E0]' : 'text-[#64748B]'} />
                      <span className="truncate">{fld.name}</span>
                    </button>
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-[#64748B]">{count}</span>
                      {!fld.system && (
                        <button
                          type="button"
                          onClick={() => {
                            deleteReportFolder(fld.name);
                            if (selectedFolder === fld.name) setSelectedFolder('All Reports');
                            toast.info(`Deleted folder "${fld.name}"`);
                          }}
                          title={`Delete folder ${fld.name}`}
                          className="opacity-0 group-hover:opacity-100 text-[#94A3B8] hover:text-red-600 p-0.5"
                        >
                          <Trash2 size={11.5} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        )}

        {/* Reports Table matching Screenshot 1 */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-x-auto">
            <table
              data-testid="reports-list-table"
              className="w-full border-collapse text-left text-[12.5px]"
            >
              <thead className="sticky top-0 z-10 bg-white border-b border-[#E2E8F0] text-[#1E293B] font-semibold">
                <tr className="h-[38px]">
                  <th className="w-[68px] pl-4 pr-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        aria-label="Select all reports on this page"
                        checked={table.allChecked}
                        ref={(el) => {
                          if (el) el.indeterminate = table.someChecked;
                        }}
                        onChange={() => table.toggleAll()}
                        className="h-3.5 w-3.5 rounded border-[#CBD5E1] text-[#1262E0] cursor-pointer"
                      />
                    </div>
                  </th>
                  {[
                    { key: 'name', label: 'Report Name', width: 'w-[34%]' },
                    { key: 'description', label: 'Description', width: 'w-[18%]' },
                    { key: 'folder', label: 'Folder', width: 'w-[18%]' },
                    { key: 'lastAccessedDate', label: 'Last Accessed Date', width: 'w-[15%]' },
                    { key: 'createdBy', label: 'Created By', width: 'w-[15%]' },
                  ].map((col) => {
                    const isSorted = table.sort?.key === col.key;
                    return (
                      <th
                        key={col.key}
                        onClick={() => table.onSort(col.key)}
                        className={`${col.width} px-3 py-2 cursor-pointer select-none hover:bg-[#F8FAFC] transition-colors whitespace-nowrap`}
                      >
                        <span className="inline-flex items-center gap-1">
                          <span>{col.label}</span>
                          {isSorted && (
                            <span className="text-[#1262E0] text-[10px]">
                              {table.sort?.dir === 'asc' ? '▲' : '▼'}
                            </span>
                          )}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="divide-y divide-[#F1F5F9]">
                {table.pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="max-w-sm mx-auto space-y-2">
                        <div className="text-[14px] font-semibold text-[#0F172A]">
                          No reports found
                        </div>
                        <p className="text-[12.5px] text-[#64748B]">
                          {reportSearch
                            ? `No reports match "${reportSearch}" in ${selectedFolder}.`
                            : `There are no reports in ${selectedFolder} yet.`}
                        </p>
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => setStep1ModalOpen(true)}
                            className="h-8 px-4 rounded bg-[#1262E0] text-white text-[12.5px] font-semibold"
                          >
                            Create Report
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  table.pageRows.map((rep) => {
                    const isSelected = table.selected.has(rep.id);
                    const menuOpen = openRowMenuId === rep.id;
                    return (
                      <tr
                        key={rep.id}
                        className={`group h-[40px] transition-colors ${
                          isSelected ? 'bg-[#EFF6FF]/70' : 'hover:bg-[#F8FAFC]'
                        }`}
                      >
                        {/* Checkbox + Star */}
                        <td className="pl-4 pr-2 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              aria-label={`Select ${rep.name}`}
                              checked={isSelected}
                              onChange={() => table.toggle(rep.id)}
                              className="h-3.5 w-3.5 rounded border-[#CBD5E1] text-[#1262E0] cursor-pointer"
                            />
                            <button
                              type="button"
                              onClick={() => toggleFavoriteReport(rep.id)}
                              aria-label={rep.favorite ? 'Unfavorite report' : 'Favorite report'}
                              className="text-[#CBD5E1] hover:text-amber-400 transition-colors"
                            >
                              <Star
                                size={13.5}
                                className={
                                  rep.favorite ? 'fill-amber-400 text-amber-400' : ''
                                }
                              />
                            </button>
                          </div>
                        </td>

                        {/* Report Name + Inline (...) Action Button matching Screenshot 1 */}
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center gap-2 relative">
                            <button
                              type="button"
                              onClick={() => handleOpenReport(rep)}
                              className="text-[#1262E0] hover:underline font-normal text-[12.5px] text-left truncate max-w-[380px]"
                            >
                              {rep.name}
                            </button>

                            <div className="relative">
                              <button
                                type="button"
                                data-testid={`report-row-actions-${rep.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenRowMenuId((prev) => (prev === rep.id ? null : rep.id));
                                }}
                                aria-label={`Actions for ${rep.name}`}
                                className={`h-6 w-6 rounded flex items-center justify-center text-[#475569] hover:bg-[#E2E8F0]/70 transition-opacity ${
                                  menuOpen ? 'opacity-100 bg-[#E2E8F0]/70' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'
                                }`}
                              >
                                <MoreHorizontal size={14} />
                              </button>

                              {menuOpen && (
                                <div
                                  onMouseLeave={() => setOpenRowMenuId(null)}
                                  className="absolute left-0 top-full mt-1 w-44 rounded-lg border border-[#DCE3EE] bg-white shadow-xl py-1 z-50 text-[12px]"
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleOpenReport(rep)}
                                    className="w-full px-3 py-1.5 text-left text-[#1E293B] hover:bg-[#F8FAFC] flex items-center gap-2"
                                  >
                                    <Eye size={13} className="text-[#64748B]" />
                                    <span>Open Report</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleEditReport(rep)}
                                    className="w-full px-3 py-1.5 text-left text-[#1E293B] hover:bg-[#F8FAFC] flex items-center gap-2"
                                  >
                                    <Edit3 size={13} className="text-[#64748B]" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDuplicateReport(rep.id)}
                                    className="w-full px-3 py-1.5 text-left text-[#1E293B] hover:bg-[#F8FAFC] flex items-center gap-2"
                                  >
                                    <Copy size={13} className="text-[#64748B]" />
                                    <span>Duplicate</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenRowMenuId(null);
                                      const res = executeReport(rep, crm);
                                      exportReportResultsCSV(rep.name, res);
                                      toast.success(`Exported "${rep.name}" to CSV`);
                                    }}
                                    className="w-full px-3 py-1.5 text-left text-[#1E293B] hover:bg-[#F8FAFC] flex items-center gap-2"
                                  >
                                    <Download size={13} className="text-[#64748B]" />
                                    <span>Export CSV</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenRowMenuId(null);
                                      setMoveFolderTarget({ ids: [rep.id], folder: rep.folder });
                                    }}
                                    className="w-full px-3 py-1.5 text-left text-[#1E293B] hover:bg-[#F8FAFC] flex items-center gap-2"
                                  >
                                    <Folder size={13} className="text-[#64748B]" />
                                    <span>Move to Folder</span>
                                  </button>
                                  <div className="my-1 border-t border-[#E2E8F0]" />
                                  <button
                                    type="button"
                                    onClick={() => handleRequestDelete([rep.id], rep.name)}
                                    className="w-full px-3 py-1.5 text-left text-[#DC2626] hover:bg-[#FEF2F2] flex items-center gap-2 font-medium"
                                  >
                                    <Trash2 size={13} />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Description */}
                        <td className="px-3 py-2 text-[#334155] truncate max-w-[240px]">
                          {rep.description || '-'}
                        </td>

                        {/* Folder */}
                        <td className="px-3 py-2 text-[#1E293B] whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedFolder(rep.folder)}
                            className="hover:text-[#1262E0] hover:underline"
                          >
                            {rep.folder}
                          </button>
                        </td>

                        {/* Last Accessed Date */}
                        <td className="px-3 py-2 text-[#334155] whitespace-nowrap">
                          {rep.lastAccessedDate || '—'}
                        </td>

                        {/* Created By */}
                        <td className="px-3 py-2 text-[#334155] whitespace-nowrap">
                          {rep.createdBy || 'Administration Team'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Record Count + Pagination Bar */}
          <div className="px-4 sm:px-6 py-1 border-t border-[#E2E8F0] bg-[#F8FAFC]">
            <Pagination
              table={table}
              noun="reports"
              options={[10, 15, 25, 50]}
              variant="records"
            />
          </div>
        </div>
      </div>

      {/* STEP 1 MODAL: Create New Report (Select Primary Module) matching Screenshot 2 */}
      <CreateNewReportModal
        open={step1ModalOpen}
        onClose={() => setStep1ModalOpen(false)}
        onContinue={handleStartBuilderFromModule}
      />

      {/* Create New Folder Modal */}
      <Modal
        open={newFolderModalOpen}
        onClose={() => setNewFolderModalOpen(false)}
        title="Create Report Folder"
        subtitle="Organize your CRM reports into custom folders"
        size="sm"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const clean = newFolderName.trim();
            if (!clean) return;
            saveReportFolder({ name: clean, description: newFolderDesc.trim() });
            toast.success(`Created folder "${clean}"`);
            setSelectedFolder(clean);
            setNewFolderName('');
            setNewFolderDesc('');
            setNewFolderModalOpen(false);
          }}
          className="space-y-3 text-[12.5px]"
        >
          <div>
            <label className="block font-semibold text-[#334155] mb-1">
              Folder Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g. Q4 Executive Reports"
              className="input h-9 text-[12.5px]"
            />
          </div>
          <div>
            <label className="block font-semibold text-[#334155] mb-1">
              Description
            </label>
            <input
              type="text"
              value={newFolderDesc}
              onChange={(e) => setNewFolderDesc(e.target.value)}
              placeholder="Optional description"
              className="input h-9 text-[12.5px]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setNewFolderModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create Folder
            </button>
          </div>
        </form>
      </Modal>

      {/* Move to Folder Modal */}
      <Modal
        open={Boolean(moveFolderTarget)}
        onClose={() => setMoveFolderTarget(null)}
        title="Move Report(s) to Folder"
        size="sm"
      >
        {moveFolderTarget && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              moveFolderTarget.ids.forEach((id) => {
                const existing = reports.find((r) => r.id === id);
                if (existing) {
                  saveReport({ ...existing, folder: moveFolderTarget.folder });
                }
              });
              toast.success(`Moved ${moveFolderTarget.ids.length} report(s) to "${moveFolderTarget.folder}"`);
              setMoveFolderTarget(null);
              table.clearSelection();
            }}
            className="space-y-3 text-[12.5px]"
          >
            <div>
              <label className="block font-semibold text-[#334155] mb-1">
                Destination Folder
              </label>
              <select
                value={moveFolderTarget.folder}
                onChange={(e) =>
                  setMoveFolderTarget((p) => ({ ...p, folder: e.target.value }))
                }
                className="input h-9 text-[12.5px]"
              >
                {reportFolders.map((fld) => (
                  <option key={fld.id || fld.name} value={fld.name}>
                    {fld.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMoveFolderTarget(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Move
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Delete report?"
        confirmLabel="Delete"
        message={
          confirmDelete
            ? `Are you sure you want to delete ${confirmDelete.label}? This action cannot be undone.`
            : ''
        }
        onConfirm={() => {
          if (!confirmDelete) return;
          deleteReports(confirmDelete.ids);
          table.clearSelection();
          toast.success(`Deleted ${confirmDelete.label}`);
          setConfirmDelete(null);
        }}
      />
    </div>
  );
}
