import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle, ArrowDown, ArrowUp, ArrowUpDown, Check, ChevronDown,
  Download, ExternalLink, Eye, FileSpreadsheet, Phone, Plus,
  RotateCcw, Sparkles, Trash2, Upload, X,
} from 'lucide-react';
import { RecordSelectionSummary } from './Pagination';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+\d][\d\s\-()+]{6,22}$/;
const WEBSITE_RE = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/i;

/**
 * Normalize a date string (YYYY-MM-DD or DD/MM/YYYY ...) into YYYY-MM-DD for <input type="date">
 */
export function toISODateInput(val) {
  if (!val) return '';
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.slice(0, 10);
  }
  const dmy = str.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (dmy) {
    return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  }
  return '';
}

/**
 * Format YYYY-MM-DD into DD/MM/YYYY 09:44 AM matching the screenshot's Created Time column
 */
export function formatScreenshotDateTime(val, fallbackTime = '09:44 AM') {
  if (!val) return '—';
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split('-');
    return `${d}/${m}/${y} ${fallbackTime}`;
  }
  if (/^\d{4}-\d{2}-\d{2}T/.test(str)) {
    const [datePart] = str.split('T');
    const [y, m, d] = datePart.split('-');
    return `${d}/${m}/${y} ${fallbackTime}`;
  }
  return str;
}

/**
 * Validate a single cell value according to column schema and record context.
 * Returns { valid: boolean, error?: string, normalizedValue?: any }
 */
export function validateSpreadsheetCell(col, rawValue, row) {
  const val = rawValue == null ? '' : String(rawValue).trim();

  if (col.required && !val) {
    return { valid: false, error: `${col.headerLabel || col.header} is required.` };
  }

  // Special Contact rule: at least First Name or Last Name must remain non-empty
  if (col.key === 'firstName') {
    const otherLast = String(row.lastName || '').trim();
    if (!val && !otherLast) {
      return { valid: false, error: 'Contact requires at least a First Name or Last Name.' };
    }
  }
  if (col.key === 'lastName') {
    const otherFirst = String(row.firstName || '').trim();
    if (!val && !otherFirst) {
      return { valid: false, error: 'Contact requires at least a First Name or Last Name.' };
    }
  }

  if (col.type === 'email' && val) {
    if (!EMAIL_RE.test(val)) {
      return { valid: false, error: 'Enter a valid email address (e.g. name@company.in).' };
    }
  }

  if (col.type === 'phone' && val) {
    if (!PHONE_RE.test(val)) {
      return { valid: false, error: 'Enter a valid phone/mobile number (7+ digits).' };
    }
  }

  if (col.type === 'website' && val) {
    if (!WEBSITE_RE.test(val)) {
      return { valid: false, error: 'Enter a valid website (e.g. www.company.in).' };
    }
  }

  if (col.type === 'number') {
    if (val === '') {
      return { valid: true, normalizedValue: 0 };
    }
    const cleaned = val.replace(/[₹$,\s]/g, '');
    const num = Number(cleaned);
    if (Number.isNaN(num) || num < 0) {
      return { valid: false, error: `${col.headerLabel || col.header} must be a valid non-negative number.` };
    }
    return { valid: true, normalizedValue: num };
  }

  if (col.type === 'date' && val) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      return { valid: false, error: 'Select a valid date (YYYY-MM-DD).' };
    }
  }

  if (col.type === 'select' && val && Array.isArray(col.options) && col.options.length > 0) {
    const allowedValues = col.options.map((o) => (typeof o === 'object' ? String(o.value) : String(o)));
    if (!allowedValues.includes(val) && !col.allowCustom) {
      return { valid: false, error: `Select a valid ${col.headerLabel || col.header} option.` };
    }
  }

  return { valid: true, normalizedValue: val };
}

/**
 * Convert index (0, 1, 2...) to Excel column letters (A, B, C... Z, AA, AB...)
 */
function toExcelColLetter(idx) {
  let n = idx + 1;
  let str = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    str = String.fromCharCode(65 + rem) + str;
    n = Math.floor((n - 1) / 26);
  }
  return str;
}

/**
 * Excel-style Editable Spreadsheet View for Contacts and Accounts
 */
export default function SpreadsheetView({
  moduleType = 'contacts', // 'contacts' | 'accounts'
  columns = [],
  rows = [],
  table,
  totalFilteredCount = 0,
  dense = false,
  onSaveCell,
  onAddRow,
  onDeleteRows,
  onOpenDetail,
  onOpenImportCSV,
  onExportCSV,
}) {
  const [selectedCell, setSelectedCell] = useState(null); // { rowId, colKey }
  const [editingCell, setEditingCell] = useState(null); // { rowId, colKey }
  const [draftValue, setDraftValue] = useState('');
  const [cellError, setCellError] = useState(null); // { rowId, colKey, message }
  const [recentlySavedCell, setRecentlySavedCell] = useState(null); // { rowId, colKey }
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddDraft, setQuickAddDraft] = useState({});
  const [quickAddError, setQuickAddError] = useState('');

  const editorInputRef = useRef(null);

  const editableColumns = useMemo(
    () => columns.filter((c) => c.editable !== false),
    [columns]
  );

  // Focus active editor input whenever editingCell changes
  useEffect(() => {
    if (editingCell && editorInputRef.current) {
      editorInputRef.current.focus();
      if (typeof editorInputRef.current.select === 'function' && editorInputRef.current.tagName === 'INPUT') {
        editorInputRef.current.select();
      }
    }
  }, [editingCell]);

  // Clear saved flash indicator after 1.1s
  useEffect(() => {
    if (!recentlySavedCell) return undefined;
    const timer = setTimeout(() => setRecentlySavedCell(null), 1100);
    return () => clearTimeout(timer);
  }, [recentlySavedCell]);

  const getCellRawValue = (row, col) => {
    if (typeof col.getValue === 'function') {
      return col.getValue(row);
    }
    const v = row[col.key];
    return v == null ? '' : v;
  };

  const startEditing = (row, col) => {
    if (col.editable === false) return;
    const raw = getCellRawValue(row, col);
    const initialVal = col.type === 'date' ? toISODateInput(raw) : String(raw ?? '');
    setSelectedCell({ rowId: row.id, colKey: col.key });
    setEditingCell({ rowId: row.id, colKey: col.key });
    setDraftValue(initialVal);
    setCellError(null);
  };

  const cancelEditing = () => {
    setEditingCell(null);
    setDraftValue('');
    setCellError(null);
  };

  /**
   * Commit current edit. Returns true if valid (saved or unchanged), false if validation failed.
   */
  const commitEdit = (row, col, overrideValue) => {
    if (!row || !col) return true;
    const valToValidate = overrideValue !== undefined ? overrideValue : draftValue;
    const originalRaw = getCellRawValue(row, col);
    const normalizedOriginal =
      col.type === 'date' ? toISODateInput(originalRaw) : String(originalRaw ?? '').trim();

    // If unchanged, close editor cleanly
    if (String(valToValidate).trim() === normalizedOriginal) {
      setEditingCell(null);
      setCellError(null);
      return true;
    }

    const validation = validateSpreadsheetCell(col, valToValidate, row);
    if (!validation.valid) {
      setCellError({
        rowId: row.id,
        colKey: col.key,
        message: validation.error,
      });
      return false;
    }

    const finalValue =
      validation.normalizedValue !== undefined ? validation.normalizedValue : String(valToValidate).trim();

    onSaveCell?.(row, col, finalValue);
    setEditingCell(null);
    setCellError(null);
    setRecentlySavedCell({ rowId: row.id, colKey: col.key });
    return true;
  };

  /**
   * Move selection/editor to an adjacent cell on Tab / Shift+Tab / Enter
   */
  const moveFocus = (currentRowId, currentColKey, direction = 'next') => {
    const rowIdx = rows.findIndex((r) => r.id === currentRowId);
    const colIdx = editableColumns.findIndex((c) => c.key === currentColKey);
    if (rowIdx === -1 || colIdx === -1) return;

    let nextRowIdx = rowIdx;
    let nextColIdx = colIdx;

    if (direction === 'next') {
      if (colIdx + 1 < editableColumns.length) {
        nextColIdx = colIdx + 1;
      } else if (rowIdx + 1 < rows.length) {
        nextRowIdx = rowIdx + 1;
        nextColIdx = 0;
      } else {
        setEditingCell(null);
        return;
      }
    } else if (direction === 'prev') {
      if (colIdx - 1 >= 0) {
        nextColIdx = colIdx - 1;
      } else if (rowIdx - 1 >= 0) {
        nextRowIdx = rowIdx - 1;
        nextColIdx = editableColumns.length - 1;
      } else {
        setEditingCell(null);
        return;
      }
    } else if (direction === 'down') {
      if (rowIdx + 1 < rows.length) {
        nextRowIdx = rowIdx + 1;
      } else {
        setEditingCell(null);
        return;
      }
    }

    const targetRow = rows[nextRowIdx];
    const targetCol = editableColumns[nextColIdx];
    if (targetRow && targetCol) {
      startEditing(targetRow, targetCol);
    }
  };

  const handleCellKeyDown = (e, row, col) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      cancelEditing();
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      const ok = commitEdit(row, col);
      if (ok) {
        moveFocus(row.id, col.key, 'down');
      }
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
      const ok = commitEdit(row, col);
      if (ok) {
        moveFocus(row.id, col.key, e.shiftKey ? 'prev' : 'next');
      }
    }
  };

  // Active cell info for the Excel formula bar
  const activeCellInfo = useMemo(() => {
    const target = editingCell || selectedCell;
    if (!target) return null;
    const rowIdx = rows.findIndex((r) => r.id === target.rowId);
    const colIdx = columns.findIndex((c) => c.key === target.colKey);
    if (rowIdx === -1 || colIdx === -1) return null;
    const row = rows[rowIdx];
    const col = columns[colIdx];
    const coord = `${toExcelColLetter(colIdx)}${(table.page - 1) * table.pageSize + rowIdx + 1}`;
    const rawVal = getCellRawValue(row, col);
    const displayVal =
      col.type === 'select' && Array.isArray(col.options)
        ? (col.options.find((o) => String(typeof o === 'object' ? o.value : o) === String(rawVal))?.label ?? rawVal)
        : rawVal;
    return {
      coord,
      row,
      col,
      displayVal: displayVal || '',
    };
  }, [editingCell, selectedCell, rows, columns, table.page, table.pageSize]);

  // Quick inline row creation handler
  const handleQuickAddSubmit = (e) => {
    e.preventDefault();
    setQuickAddError('');
    const result = onAddRow?.(quickAddDraft);
    if (result && result.error) {
      setQuickAddError(result.error);
      return;
    }
    setQuickAddDraft({});
    setQuickAddOpen(false);
  };

  const selectedIds = useMemo(() => [...(table?.selected || [])], [table?.selected]);

  return (
    <div className="flex flex-col bg-white" data-testid={`spreadsheet-view-${moduleType}`}>
      {/* ==================== EXCEL FORMULA / ACTION BAR ==================== */}
      <div className="px-3 py-2 bg-[#F8FAFD] border-b border-[#DCE3EE] flex flex-wrap items-center justify-between gap-2 text-[12px]">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#EFF6FF] text-[#1262E0] border border-[#BFDBFE] font-semibold text-[11.5px] shrink-0">
            <FileSpreadsheet size={13.5} />
            <span>Spreadsheet Mode</span>
          </span>

          {/* Active Cell Coordinate Box */}
          <div
            className="h-7 px-2.5 rounded border border-[#CBD5E1] bg-white font-mono text-[11.5px] font-semibold text-[#0F172A] flex items-center justify-center min-w-[48px] shrink-0"
            title="Selected cell coordinate"
            data-testid="spreadsheet-cell-coord"
          >
            {activeCellInfo ? activeCellInfo.coord : 'A1'}
          </div>

          {/* Formula / Cell Status Strip */}
          <div className="hidden md:flex items-center gap-2 px-2.5 h-7 rounded border border-[#E2E8F0] bg-white text-[#475569] min-w-[200px] max-w-[440px] truncate">
            <span className="text-[11px] font-mono text-[#94A3B8] shrink-0">fx</span>
            <span className="h-3.5 w-px bg-[#E2E8F0] shrink-0" />
            {activeCellInfo ? (
              <span className="truncate text-[12px] text-[#0F172A]">
                <strong className="font-medium text-[#475569]">{activeCellInfo.col.headerLabel || activeCellInfo.col.header}:</strong>{' '}
                <span>{String(editingCell ? draftValue : activeCellInfo.displayVal || '—')}</span>
              </span>
            ) : (
              <span className="text-[11.5px] text-[#64748B] truncate">
                Click any cell to edit · <kbd className="px-1 py-0.2 bg-[#F1F5F9] rounded border border-[#CBD5E1] text-[10.5px]">Enter</kbd> Save · <kbd className="px-1 py-0.2 bg-[#F1F5F9] rounded border border-[#CBD5E1] text-[10.5px]">Tab</kbd> Next · <kbd className="px-1 py-0.2 bg-[#F1F5F9] rounded border border-[#CBD5E1] text-[10.5px]">Esc</kbd> Cancel
              </span>
            )}
          </div>
        </div>

        {/* Spreadsheet Quick Actions */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <button
            type="button"
            data-testid="spreadsheet-add-row-btn"
            onClick={() => setQuickAddOpen((v) => !v)}
            className="h-7 px-2.5 rounded bg-[#1262E0] hover:bg-[#0E4FB5] text-white font-medium text-[12px] inline-flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
          >
            <Plus size={13.5} />
            <span>{quickAddOpen ? 'Close New Row' : `Add ${moduleType === 'contacts' ? 'Contact' : 'Account'} Row`}</span>
          </button>

          {selectedIds.length > 0 && (
            <button
              type="button"
              data-testid="spreadsheet-delete-selected-btn"
              onClick={() => onDeleteRows?.(selectedIds)}
              className="h-7 px-2.5 rounded border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-medium text-[12px] inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Delete ({selectedIds.length})</span>
            </button>
          )}

          {onOpenImportCSV && (
            <button
              type="button"
              data-testid="spreadsheet-import-csv-btn"
              onClick={onOpenImportCSV}
              className="h-7 px-2.5 rounded border border-[#CBD5E1] bg-white hover:bg-[#F1F5F9] text-[#334155] font-medium text-[12px] inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Upload size={13} />
              <span className="hidden sm:inline">Import CSV</span>
            </button>
          )}

          {onExportCSV && (
            <button
              type="button"
              data-testid="spreadsheet-export-csv-btn"
              onClick={onExportCSV}
              className="h-7 px-2.5 rounded border border-[#CBD5E1] bg-white hover:bg-[#F1F5F9] text-[#334155] font-medium text-[12px] inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* ==================== INLINE VALIDATION ERROR BANNER ==================== */}
      {cellError && (
        <div
          role="alert"
          data-testid="spreadsheet-error-banner"
          className="px-3.5 py-2 bg-red-50 border-b border-red-200 text-red-800 text-[12.5px] flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="text-red-600 shrink-0" />
            <span>
              <strong>Validation Error:</strong> {cellError.message}{' '}
              <span className="text-red-600 text-[11.5px]">(Press Esc to cancel or enter a valid value and press Enter)</span>
            </span>
          </div>
          <button
            type="button"
            onClick={cancelEditing}
            className="px-2 py-0.5 rounded bg-white border border-red-200 text-red-700 hover:bg-red-100 text-[11.5px] font-medium"
          >
            Revert (Esc)
          </button>
        </div>
      )}

      {/* ==================== QUICK ADD NEW RECORD ROW BAR ==================== */}
      {quickAddOpen && (
        <form
          onSubmit={handleQuickAddSubmit}
          data-testid="spreadsheet-quick-add-form"
          className="p-3 bg-[#EFF6FF]/70 border-b border-[#BFDBFE] space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[#1E3A8A] flex items-center gap-1.5">
              <Plus size={14} className="text-[#1262E0]" />
              <span>
                Quick Add {moduleType === 'contacts' ? 'Contact' : 'Account'} directly to Spreadsheet
              </span>
            </span>
            {quickAddError && (
              <span className="text-[12px] font-medium text-red-600 flex items-center gap-1">
                <AlertCircle size={13} /> {quickAddError}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {editableColumns.slice(0, 6).map((col) => {
              const val = quickAddDraft[col.key] ?? '';
              if (col.type === 'select') {
                return (
                  <div key={col.key}>
                    <label className="block text-[11px] font-medium text-[#475569] mb-0.5 truncate">
                      {col.headerLabel || col.header}
                    </label>
                    <select
                      value={val}
                      onChange={(e) => setQuickAddDraft((p) => ({ ...p, [col.key]: e.target.value }))}
                      data-testid={`quick-add-${col.key}`}
                      className="w-full h-8 px-2 rounded border border-[#CBD5E1] bg-white text-[12.5px] text-[#0F172A]"
                    >
                      <option value="">Select {col.headerLabel || col.header}</option>
                      {(col.options || []).map((opt) => {
                        const oVal = typeof opt === 'object' ? opt.value : opt;
                        const oLbl = typeof opt === 'object' ? opt.label : opt;
                        return (
                          <option key={oVal} value={oVal}>
                            {oLbl}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                );
              }
              return (
                <div key={col.key}>
                  <label className="block text-[11px] font-medium text-[#475569] mb-0.5 truncate">
                    {col.headerLabel || col.header}
                    {col.required ? ' *' : ''}
                  </label>
                  <input
                    type={col.type === 'date' ? 'date' : col.type === 'number' ? 'number' : 'text'}
                    value={val}
                    onChange={(e) => setQuickAddDraft((p) => ({ ...p, [col.key]: e.target.value }))}
                    placeholder={col.placeholder || (col.headerLabel || col.header)}
                    data-testid={`quick-add-${col.key}`}
                    className="w-full h-8 px-2 rounded border border-[#CBD5E1] bg-white text-[12.5px] text-[#0F172A]"
                  />
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setQuickAddOpen(false);
                setQuickAddError('');
              }}
              className="h-7 px-3 rounded border border-[#CBD5E1] bg-white text-[#475569] text-[12px] font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="spreadsheet-quick-add-submit"
              className="h-7 px-3.5 rounded bg-[#1262E0] hover:bg-[#0E4FB5] text-white text-[12px] font-semibold inline-flex items-center gap-1"
            >
              <Check size={13.5} />
              <span>Save Row</span>
            </button>
          </div>
        </form>
      )}

      {/* ==================== EXCEL-STYLE GRID TABLE ==================== */}
      <div className="overflow-x-auto thin-scroll w-full">
        <table
          className="w-full border-collapse text-left select-none"
          style={{ minWidth: 1080 }}
          data-testid={`spreadsheet-table-${moduleType}`}
        >
          <thead>
            <tr className="bg-[#F8FAFD] border-b border-[#DCE3EE] text-[12.5px] font-semibold text-[#1E293B]">
              {/* Checkbox + Row Number Header */}
              <th className="w-12 px-2.5 py-2.5 border-r border-[#E2E8F0] text-center sticky left-0 bg-[#F8FAFD] z-10">
                <input
                  type="checkbox"
                  className="cb"
                  checked={table.allChecked}
                  ref={(el) => {
                    if (el) el.indeterminate = table.someChecked;
                  }}
                  onChange={table.toggleAll}
                  aria-label="Select all rows"
                />
              </th>

              {columns.map((col, colIdx) => {
                const isSorted = table.sort?.key === col.key;
                const sortDir = isSorted ? table.sort.dir : null;
                const colLetter = toExcelColLetter(colIdx);

                return (
                  <th
                    key={col.key}
                    style={{ width: col.width, minWidth: col.minWidth || col.width || 135 }}
                    className="px-3 py-2.5 border-r border-[#E2E8F0] whitespace-nowrap group relative bg-[#F8FAFD] hover:bg-[#F1F5F9] transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (!col.sortable) return;
                          table.setSort(
                            isSorted
                              ? sortDir === 'asc'
                                ? { key: col.key, dir: 'desc' }
                                : null
                              : { key: col.key, dir: 'asc' }
                          );
                        }}
                        className={`inline-flex items-center gap-1.5 text-left font-semibold text-[#0F172A] ${
                          col.sortable ? 'cursor-pointer hover:text-[#1262E0]' : 'cursor-default'
                        }`}
                      >
                        <span>{col.header}</span>
                        {col.badge && (
                          <span className="text-[10px] font-normal text-ink-400 bg-page px-1 py-0.2 rounded border border-line-soft">
                            {col.badge}
                          </span>
                        )}
                      </button>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] font-mono text-[#94A3B8] opacity-75">{colLetter}</span>
                        {col.sortable && (
                          <span className="text-[#64748B]">
                            {isSorted ? (
                              sortDir === 'asc' ? (
                                <ArrowUp size={12.5} className="text-[#1262E0]" />
                              ) : (
                                <ArrowDown size={12.5} className="text-[#1262E0]" />
                              )
                            ) : (
                              <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-60" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </th>
                );
              })}

              {/* Row Actions Column */}
              <th className="w-20 px-2.5 py-2.5 text-center bg-[#F8FAFD] text-[11.5px] font-semibold text-[#64748B]">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#E2E8F0] text-[12.5px] text-[#0F172A]">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="py-12 text-center text-[#64748B]">
                  No records match the current filters. Click <strong>Add Row</strong> above to create a record.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const isRowSelected = table.selected.has(row.id);
                const cellPad = dense ? 'py-1.5 px-2.5' : 'py-2 px-3';

                return (
                  <tr
                    key={row.id}
                    data-testid={`spreadsheet-row-${row.id}`}
                    className={`transition-colors group/row ${
                      isRowSelected ? 'bg-[#EFF6FF]/60' : 'hover:bg-[#F8FAFC]'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="w-12 px-2.5 py-2 border-r border-[#E2E8F0] text-center sticky left-0 bg-inherit z-10">
                      <input
                        type="checkbox"
                        className="cb"
                        checked={isRowSelected}
                        onChange={() => table.toggle(row.id)}
                        aria-label={`Select row ${row.name}`}
                      />
                    </td>

                    {/* Editable Cells */}
                    {columns.map((col) => {
                      const isEditing =
                        editingCell?.rowId === row.id && editingCell?.colKey === col.key;
                      const isSelected =
                        selectedCell?.rowId === row.id && selectedCell?.colKey === col.key;
                      const hasError =
                        cellError?.rowId === row.id && cellError?.colKey === col.key;
                      const wasSaved =
                        recentlySavedCell?.rowId === row.id && recentlySavedCell?.colKey === col.key;

                      const rawVal = getCellRawValue(row, col);

                      return (
                        <td
                          key={col.key}
                          data-testid={`cell-${row.id}-${col.key}`}
                          onClick={() => {
                            if (!isEditing) {
                              startEditing(row, col);
                            }
                          }}
                          className={`border-r border-[#E2E8F0] relative align-middle transition-all ${
                            isEditing
                              ? 'p-0 bg-white ring-2 ring-inset ring-[#1262E0] z-10'
                              : hasError
                                ? `${cellPad} bg-red-50/70 ring-2 ring-inset ring-red-500`
                                : wasSaved
                                  ? `${cellPad} bg-emerald-50/70 ring-1 ring-inset ring-emerald-400`
                                  : isSelected
                                    ? `${cellPad} bg-[#EFF6FF]/40 ring-1 ring-inset ring-[#1262E0]`
                                    : `${cellPad} cursor-text hover:bg-[#F1F5F9]/70`
                          }`}
                        >
                          {isEditing ? (
                            <div className="flex items-center w-full h-full min-h-[34px]">
                              {col.type === 'select' ? (
                                <select
                                  ref={editorInputRef}
                                  value={draftValue}
                                  data-testid={`editor-${row.id}-${col.key}`}
                                  onChange={(e) => {
                                    const nextVal = e.target.value;
                                    setDraftValue(nextVal);
                                    commitEdit(row, col, nextVal);
                                  }}
                                  onKeyDown={(e) => handleCellKeyDown(e, row, col)}
                                  onBlur={() => commitEdit(row, col)}
                                  className="w-full h-[34px] px-2.5 bg-white text-[12.5px] text-[#0F172A] focus:outline-none"
                                >
                                  {col.allowEmpty && <option value="">— None —</option>}
                                  {(col.options || []).map((opt) => {
                                    const oVal = typeof opt === 'object' ? opt.value : opt;
                                    const oLbl = typeof opt === 'object' ? opt.label : opt;
                                    return (
                                      <option key={oVal} value={oVal}>
                                        {oLbl}
                                      </option>
                                    );
                                  })}
                                </select>
                              ) : (
                                <input
                                  ref={editorInputRef}
                                  type={
                                    col.type === 'date'
                                      ? 'date'
                                      : col.type === 'number'
                                        ? 'number'
                                        : col.type === 'email'
                                          ? 'email'
                                          : 'text'
                                  }
                                  value={draftValue}
                                  data-testid={`editor-${row.id}-${col.key}`}
                                  onChange={(e) => {
                                    setDraftValue(e.target.value);
                                    if (cellError) setCellError(null);
                                  }}
                                  onKeyDown={(e) => handleCellKeyDown(e, row, col)}
                                  onBlur={() => commitEdit(row, col)}
                                  className="w-full h-[34px] px-2.5 bg-white text-[12.5px] text-[#0F172A] focus:outline-none"
                                />
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-1.5 min-w-0">
                              <div className="min-w-0 flex-1 truncate">
                                {col.renderCell ? col.renderCell(row, rawVal) : (rawVal || '—')}
                              </div>

                              {/* Optional action icon inside cell (e.g. Open Detail, Call Phone, Open Account) */}
                              {col.renderAccessory && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="shrink-0 flex items-center"
                                >
                                  {col.renderAccessory(row, rawVal)}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}

                    {/* Row Quick Actions (Open Detail & Delete Row) */}
                    <td className="w-20 px-2 py-1.5 text-center whitespace-nowrap">
                      <div className="inline-flex items-center justify-center gap-1">
                        {onOpenDetail && (
                          <button
                            type="button"
                            onClick={() => onOpenDetail(row.id)}
                            title={`Open ${row.name} details`}
                            data-testid={`spreadsheet-open-${row.id}`}
                            className="w-6 h-6 rounded hover:bg-[#EFF6FF] text-[#64748B] hover:text-[#1262E0] inline-flex items-center justify-center transition-colors"
                          >
                            <Eye size={13.5} />
                          </button>
                        )}
                        {onDeleteRows && (
                          <button
                            type="button"
                            onClick={() => onDeleteRows([row.id], row.name)}
                            title={`Delete ${row.name}`}
                            data-testid={`spreadsheet-delete-${row.id}`}
                            className="w-6 h-6 rounded hover:bg-red-50 text-[#94A3B8] hover:text-red-600 inline-flex items-center justify-center transition-colors"
                          >
                            <Trash2 size={13.5} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ==================== SPREADSHEET FOOTER & PAGINATION ==================== */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-t border-[#DCE3EE] bg-[#FAFBFD] text-[12.5px] text-[#475569]">
        <div className="flex flex-wrap items-center gap-3">
          <RecordSelectionSummary
            total={totalFilteredCount}
            selectedCount={table?.selected ? table.selected.size : 0}
            onClearSelection={table?.clearSelection}
            totalTestId="spreadsheet-total-records"
            selectionTestId="spreadsheet-selected-count"
            deselectTestId="spreadsheet-deselect-all-btn"
          />
          <span className="text-[#CBD5E1]">|</span>
          <button
            type="button"
            onClick={() => setQuickAddOpen(true)}
            className="text-[#1262E0] hover:underline font-medium inline-flex items-center gap-1 text-[12px]"
          >
            <Plus size={13} />
            <span>Add New Row</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[12px] mr-2">
            <span className="text-[#64748B]">Rows per page:</span>
            <select
              value={table.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="h-7 px-2 rounded border border-[#CBD5E1] bg-white text-[12px] text-[#0F172A] cursor-pointer focus:outline-none focus:border-[#1262E0]"
              aria-label="Spreadsheet rows per page"
            >
              {[10, 15, 25, 30, 50, 100].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1 font-medium">
            <button
              type="button"
              disabled={table.page <= 1}
              onClick={() => table.setPage(table.page - 1)}
              className="w-7 h-7 rounded border border-[#CBD5E1] bg-white flex items-center justify-center text-[#0F172A] hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-[13px]"
              aria-label="Previous page"
            >
              ‹
            </button>
            <span className="px-2.5 py-0.5 text-[12px] font-medium text-[#334155]">
              {totalFilteredCount === 0
                ? '0 to 0'
                : `${(table.page - 1) * table.pageSize + 1} to ${Math.min(
                    totalFilteredCount,
                    table.page * table.pageSize
                  )}`}
            </span>
            <button
              type="button"
              disabled={table.page >= Math.max(1, Math.ceil(totalFilteredCount / table.pageSize))}
              onClick={() => table.setPage(table.page + 1)}
              className="w-7 h-7 rounded border border-[#CBD5E1] bg-white flex items-center justify-center text-[#0F172A] hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-[13px]"
              aria-label="Next page"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

