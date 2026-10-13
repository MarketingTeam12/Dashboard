import React, { useState, useEffect } from 'react';
import {
  Check, Plus, Trash2, Pencil, Search, X, SlidersHorizontal, Eye,
  ArrowRight, Shield, Layers, HelpCircle
} from 'lucide-react';
import { STAGES } from '../../utils/calculations';
import { DEAL_SOURCES, DEPARTMENTS } from '../../data/seedData';

const DEFAULT_COLUMNS = [
  'Deal Name', 'Account Name', 'Contact Name', 'Stage', 'Amount',
  'Closing Date', 'Probability (%)', 'Deal Owner', 'Created Time'
];

const FILTERABLE_FIELDS = [
  'Stage', 'Amount', 'Deal Owner', 'Account Name', 'Closing Date',
  'Deal Source', 'Department', 'Probability (%)', 'Deal Name'
];

const OPERATORS_BY_FIELD = {
  'Stage': ['Is', 'Is Not'],
  'Deal Owner': ['Is', 'Is Not'],
  'Account Name': ['Is', 'Is Not'],
  'Deal Source': ['Is', 'Is Not'],
  'Department': ['Is', 'Is Not'],
  'Amount': ['Equals', 'Greater Than', 'Less Than'],
  'Probability (%)': ['Equals', 'Greater Than', 'Less Than'],
  'Closing Date': ['Equals', 'Before', 'After'],
  'Deal Name': ['Contains', 'Equals', 'Starts With'],
};

export default function CustomViewsModal({
  open,
  onClose,
  allColumns = [],
  customViews = [],
  activeViewId,
  onSaveView,
  onDeleteView,
  onSelectView,
  ownerOptions = [],
  dealAccounts = [],
}) {
  const [tab, setTab] = useState('list'); // 'list' | 'editor'
  const [editingViewId, setEditingViewId] = useState(null);

  // Form state for creating/editing a custom view
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCols, setSelectedCols] = useState(new Set(DEFAULT_COLUMNS));
  const [colSearch, setColSearch] = useState('');
  const [rules, setRules] = useState([
    { field: 'Stage', op: 'Is', val: '' }
  ]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setTab('list');
      setError('');
    }
  }, [open]);

  if (!open) return null;

  const startCreate = () => {
    setEditingViewId(null);
    setName('');
    setDescription('');
    setSelectedCols(new Set(DEFAULT_COLUMNS));
    setRules([{ field: 'Stage', op: 'Is', val: '' }]);
    setColSearch('');
    setError('');
    setTab('editor');
  };

  const startEdit = (cv) => {
    setEditingViewId(cv.id);
    setName(cv.name || '');
    setDescription(cv.description || '');
    setSelectedCols(new Set(cv.columns || DEFAULT_COLUMNS));
    setRules(cv.rules?.length ? [...cv.rules] : [{ field: 'Stage', op: 'Is', val: '' }]);
    setColSearch('');
    setError('');
    setTab('editor');
  };

  const handleSave = (applyImmediately = false) => {
    if (!name.trim()) {
      setError('Please provide a name for this custom view.');
      return;
    }
    if (selectedCols.size === 0) {
      setError('Please select at least one column.');
      return;
    }

    const viewData = {
      id: editingViewId || `cv_${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      columns: Array.from(selectedCols),
      rules: rules.filter(r => r.field && (r.val !== '' || r.op === 'Is Empty')),
      updatedAt: new Date().toISOString(),
    };

    onSaveView(viewData);

    if (applyImmediately) {
      onSelectView(viewData);
      onClose();
    } else {
      setTab('list');
    }
  };

  const addRule = () => {
    setRules(prev => [...prev, { field: 'Stage', op: 'Is', val: '' }]);
  };

  const updateRule = (idx, key, val) => {
    setRules(prev => {
      const next = [...prev];
      const updated = { ...next[idx], [key]: val };
      if (key === 'field') {
        const ops = OPERATORS_BY_FIELD[val] || ['Equals'];
        updated.op = ops[0];
        updated.val = '';
      }
      next[idx] = updated;
      return next;
    });
  };

  const removeRule = (idx) => {
    setRules(prev => prev.filter((_, i) => i !== idx));
  };

  const filteredCols = allColumns.filter(c => c.toLowerCase().includes(colSearch.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-[720px] max-w-full max-h-[90vh] flex flex-col overflow-hidden border border-line"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary-50 text-primary flex items-center justify-center">
              <SlidersHorizontal size={17} />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-ink">Custom List Views</h2>
              <p className="text-[12px] text-ink-500">
                {tab === 'list' ? 'Manage, select, and create personalized deal views' : editingViewId ? 'Edit Custom View' : 'Create New Custom View'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-ink-400 hover:text-ink hover:bg-slate-200/60 rounded-md">
            <X size={18} />
          </button>
        </div>

        {/* Tab 1: List of Saved Custom Views */}
        {tab === 'list' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-line flex items-center justify-between bg-white">
              <span className="text-[13px] font-medium text-ink-600">
                {customViews.length} Saved Custom {customViews.length === 1 ? 'View' : 'Views'}
              </span>
              <button
                type="button"
                onClick={startCreate}
                className="btn-primary h-8 px-3 rounded-md text-[12.5px] flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>Create New Custom View</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 thin-scroll bg-slate-50/40">
              {customViews.length === 0 ? (
                <div className="p-10 text-center">
                  <SlidersHorizontal size={36} className="mx-auto text-ink-300 mb-2" />
                  <p className="text-[14px] font-semibold text-ink-700">No custom views created yet</p>
                  <p className="text-[12.5px] text-ink-400 mt-1 max-w-sm mx-auto">
                    Create custom views with tailored filters and column layouts for your daily workflow.
                  </p>
                  <button
                    type="button"
                    onClick={startCreate}
                    className="btn-primary h-8 px-4 rounded-md text-[13px] mt-4 inline-flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    <span>Create Your First View</span>
                  </button>
                </div>
              ) : (
                customViews.map((cv) => {
                  const isActive = activeViewId === cv.id;
                  return (
                    <div
                      key={cv.id}
                      className={`card p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isActive ? 'bg-primary-50/40 border-primary ring-1 ring-primary' : 'bg-white border-line hover:border-line-hover'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[14.5px] font-bold text-ink">{cv.name}</span>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-primary text-white">
                              Active
                            </span>
                          )}
                        </div>
                        {cv.description && (
                          <p className="text-[12px] text-ink-500 mt-0.5">{cv.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-[12px] text-ink-500">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                            {cv.columns?.length || 0} Columns
                          </span>
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                            {cv.rules?.length || 0} Filter Rules
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectView(cv);
                            onClose();
                          }}
                          className={`h-8 px-3 rounded-md text-[12.5px] font-medium flex items-center gap-1 transition-colors ${
                            isActive
                              ? 'bg-primary text-white hover:bg-primary-600'
                              : 'bg-primary-50 text-primary hover:bg-primary-100'
                          }`}
                        >
                          <Check size={13} />
                          <span>{isActive ? 'Current View' : 'Apply View'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(cv)}
                          className="h-8 w-8 rounded-md border border-line bg-white hover:bg-slate-50 text-ink-600 flex items-center justify-center"
                          title="Edit view"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteView(cv.id)}
                          className="h-8 w-8 rounded-md border border-line bg-white hover:bg-red-50 text-red-500 flex items-center justify-center"
                          title="Delete view"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t border-line flex justify-end bg-white">
              <button onClick={onClose} className="btn-secondary h-8 px-4 rounded-md text-[13px]">
                Close
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Create & Edit Form */}
        {tab === 'editor' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-5 thin-scroll">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-lg">
                  {error}
                </div>
              )}

              {/* View Name & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-ink mb-1">
                    View Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. High Value Enterprise Deals"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full h-9 px-3 text-[13.5px] border border-line rounded-md focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-ink mb-1">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Brief description of this view's purpose"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full h-9 px-3 text-[13.5px] border border-line rounded-md focus:border-primary outline-none"
                  />
                </div>
              </div>

              {/* Filter Rules Section */}
              <div className="card p-4 border border-line rounded-xl bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[13.5px] font-bold text-ink">Filter Criteria</h3>
                    <p className="text-[11.5px] text-ink-500">Deals must match all specified criteria</p>
                  </div>
                  <button
                    type="button"
                    onClick={addRule}
                    className="text-[12.5px] text-primary hover:underline font-semibold flex items-center gap-1"
                  >
                    <Plus size={13} />
                    <span>Add Filter Rule</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {rules.map((rule, idx) => {
                    const ops = OPERATORS_BY_FIELD[rule.field] || ['Equals'];
                    return (
                      <div key={idx} className="flex flex-wrap items-center gap-2 bg-white p-2.5 rounded-lg border border-line">
                        {/* Field Selector */}
                        <select
                          className="h-8 px-2 text-[12.5px] border border-line rounded bg-white font-medium"
                          value={rule.field}
                          onChange={e => updateRule(idx, 'field', e.target.value)}
                        >
                          {FILTERABLE_FIELDS.map(f => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>

                        {/* Operator Selector */}
                        <select
                          className="h-8 px-2 text-[12.5px] border border-line rounded bg-white"
                          value={rule.op}
                          onChange={e => updateRule(idx, 'op', e.target.value)}
                        >
                          {ops.map(o => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </select>

                        {/* Value Input */}
                        {rule.field === 'Stage' ? (
                          <select
                            className="h-8 px-2 text-[12.5px] border border-line rounded bg-white flex-1 min-w-[140px]"
                            value={rule.val}
                            onChange={e => updateRule(idx, 'val', e.target.value)}
                          >
                            <option value="">Select Stage...</option>
                            {STAGES.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        ) : rule.field === 'Deal Owner' ? (
                          <select
                            className="h-8 px-2 text-[12.5px] border border-line rounded bg-white flex-1 min-w-[140px]"
                            value={rule.val}
                            onChange={e => updateRule(idx, 'val', e.target.value)}
                          >
                            <option value="">Select Owner...</option>
                            {ownerOptions.map(o => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        ) : rule.field === 'Account Name' ? (
                          <select
                            className="h-8 px-2 text-[12.5px] border border-line rounded bg-white flex-1 min-w-[140px]"
                            value={rule.val}
                            onChange={e => updateRule(idx, 'val', e.target.value)}
                          >
                            <option value="">Select Account...</option>
                            {dealAccounts.map(a => (
                              <option key={a.value} value={a.value}>{a.label}</option>
                            ))}
                          </select>
                        ) : rule.field === 'Deal Source' ? (
                          <select
                            className="h-8 px-2 text-[12.5px] border border-line rounded bg-white flex-1 min-w-[140px]"
                            value={rule.val}
                            onChange={e => updateRule(idx, 'val', e.target.value)}
                          >
                            <option value="">Select Source...</option>
                            {DEAL_SOURCES.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        ) : rule.field === 'Department' ? (
                          <select
                            className="h-8 px-2 text-[12.5px] border border-line rounded bg-white flex-1 min-w-[140px]"
                            value={rule.val}
                            onChange={e => updateRule(idx, 'val', e.target.value)}
                          >
                            <option value="">Select Department...</option>
                            {DEPARTMENTS.map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        ) : rule.field === 'Closing Date' ? (
                          <input
                            type="date"
                            className="h-8 px-2 text-[12.5px] border border-line rounded flex-1 min-w-[140px]"
                            value={rule.val}
                            onChange={e => updateRule(idx, 'val', e.target.value)}
                          />
                        ) : (
                          <input
                            type={rule.field === 'Amount' || rule.field === 'Probability (%)' ? 'number' : 'text'}
                            placeholder="Value"
                            className="h-8 px-2 text-[12.5px] border border-line rounded flex-1 min-w-[140px]"
                            value={rule.val}
                            onChange={e => updateRule(idx, 'val', e.target.value)}
                          />
                        )}

                        <button
                          type="button"
                          onClick={() => removeRule(idx)}
                          className="h-8 w-8 text-ink-400 hover:text-red-500 rounded flex items-center justify-center"
                          title="Remove rule"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })}
                  {rules.length === 0 && (
                    <p className="text-[12.5px] text-ink-400 italic py-2">No filter rules. All deals will be included.</p>
                  )}
                </div>
              </div>

              {/* Column Selection Section */}
              <div className="card p-4 border border-line rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-[13.5px] font-bold text-ink">
                      Select Columns ({selectedCols.size} selected)
                    </h3>
                    <p className="text-[11.5px] text-ink-500">Pick which columns to show in Table View</p>
                  </div>
                  <div className="flex items-center gap-2 text-[12px]">
                    <button
                      type="button"
                      onClick={() => setSelectedCols(new Set(DEFAULT_COLUMNS))}
                      className="text-primary hover:underline font-medium"
                    >
                      Default
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setSelectedCols(new Set(allColumns))}
                      className="text-primary hover:underline font-medium"
                    >
                      All
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setSelectedCols(new Set(['Deal Name']))}
                      className="text-ink-500 hover:underline"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 text-ink-400" size={14} />
                  <input
                    type="text"
                    placeholder="Search columns..."
                    value={colSearch}
                    onChange={e => setColSearch(e.target.value)}
                    className="w-full h-8 pl-8 pr-3 text-[12.5px] border border-line rounded-md focus:border-primary outline-none"
                  />
                </div>

                <div className="max-h-[180px] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-1 thin-scroll border border-line-soft rounded-lg">
                  {filteredCols.map(col => {
                    const isChecked = selectedCols.has(col);
                    const isMandatory = col === 'Deal Name';
                    return (
                      <label
                        key={col}
                        className={`flex items-center gap-2 p-1.5 rounded cursor-pointer text-[12.5px] hover:bg-slate-50 ${
                          isChecked ? 'font-semibold text-primary' : 'text-ink-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="cb"
                          disabled={isMandatory}
                          checked={isChecked || isMandatory}
                          onChange={e => {
                            if (isMandatory) return;
                            const next = new Set(selectedCols);
                            if (e.target.checked) next.add(col);
                            else next.delete(col);
                            setSelectedCols(next);
                          }}
                        />
                        <span className="truncate">{col}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-line flex items-center justify-between bg-slate-50/70">
              <button
                type="button"
                onClick={() => setTab('list')}
                className="btn-secondary h-8 px-4 rounded-md text-[13px]"
              >
                Cancel
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSave(false)}
                  className="btn-secondary h-8 px-4 rounded-md text-[13px] font-semibold"
                >
                  Save View
                </button>
                <button
                  type="button"
                  onClick={() => handleSave(true)}
                  className="btn-primary h-8 px-4 rounded-md text-[13px] font-semibold flex items-center gap-1.5"
                >
                  <span>Save & Apply</span>
                  <Check size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

