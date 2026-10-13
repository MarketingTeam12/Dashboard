import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export function SaveFilterModal({ open, onClose, onSave, currentConfig, count, maxCount = 10 }) {
  const [filterName, setFilterName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setFilterName('');
      setError('');
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = filterName.trim();
    if (!trimmed) {
      setError('Filter name is required');
      return;
    }
    if (count >= maxCount) {
      setError(`Maximum ${maxCount} saved filters allowed.`);
      return;
    }
    onSave(trimmed);
  };

  const activeEntries = Object.entries(currentConfig || {}).filter(
    ([, conf]) => conf && (conf.val || conf.op === 'Is Empty')
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl w-[400px] max-w-full flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-line flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-primary">Save Filter</h2>
          <button type="button" onClick={onClose} className="text-ink-400 hover:text-ink-700 cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-ink-700 mb-1">
              Filter Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              placeholder="e.g. High Priority Records"
              className="w-full h-9 px-3 text-[14px] border border-line rounded-md focus:border-primary outline-none"
              value={filterName}
              onChange={(e) => {
                setFilterName(e.target.value);
                if (error) setError('');
              }}
            />
            {error && <span className="text-[12px] text-red-500 mt-1 block">{error}</span>}
          </div>

          <div>
            <span className="text-[12px] font-semibold text-ink-500 uppercase tracking-wider block mb-1.5">
              Filter Conditions ({activeEntries.length})
            </span>
            <div className="bg-page/70 rounded-md p-2.5 max-h-[140px] overflow-y-auto space-y-1 thin-scroll border border-line text-[12.5px] text-ink-700">
              {activeEntries.length === 0 ? (
                <div className="text-ink-400">All current filter fields will be saved.</div>
              ) : (
                activeEntries.map(([field, conf]) => (
                  <div key={field} className="flex items-center justify-between">
                    <span className="font-medium text-ink">{field}:</span>
                    <span className="text-ink-500">{conf.op} {conf.val ? `"${conf.val}"` : ''}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="text-[12px] text-ink-400 flex justify-between items-center">
            <span>Saved Filters:</span>
            <span className="font-semibold text-ink-600">{count} / {maxCount}</span>
          </div>

          <div className="pt-2 border-t border-line flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary h-8 px-4 rounded text-[13px] cursor-pointer">
              Cancel
            </button>
            <button
              type="submit"
              disabled={count >= maxCount}
              className="btn-primary h-8 px-5 rounded text-[13px] disabled:opacity-50 cursor-pointer"
            >
              Save Filter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function RenameFilterModal({ open, onClose, filter, onRename }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && filter) {
      setName(filter.name || '');
      setError('');
    }
  }, [open, filter]);

  if (!open || !filter) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Filter name is required');
      return;
    }
    onRename(filter.id, trimmed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl w-[380px] max-w-full flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-line flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-primary">Rename Filter</h2>
          <button type="button" onClick={onClose} className="text-ink-400 hover:text-ink-700 cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-ink-700 mb-1">
              Filter Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              className="w-full h-9 px-3 text-[14px] border border-line rounded-md focus:border-primary outline-none"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
            />
            {error && <span className="text-[12px] text-red-500 mt-1 block">{error}</span>}
          </div>
          <div className="pt-2 border-t border-line flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary h-8 px-4 rounded text-[13px] cursor-pointer">
              Cancel
            </button>
            <button type="submit" className="btn-primary h-8 px-5 rounded text-[13px] cursor-pointer">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

