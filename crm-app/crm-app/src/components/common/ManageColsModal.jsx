import React, { useState, useEffect } from 'react';
import { Search, GripVertical, X } from 'lucide-react';

export default function ManageColsModal({
  open,
  onClose,
  allColumns = [],
  visibleCols = [],
  mandatoryCol = '',
  onSave,
}) {
  const [search, setSearch] = useState('');
  const [selectedList, setSelectedList] = useState([]);
  const [unselectedList, setUnselectedList] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);

  useEffect(() => {
    if (open) {
      const currentSelected = [...visibleCols];
      if (mandatoryCol && !currentSelected.includes(mandatoryCol)) {
        currentSelected.unshift(mandatoryCol);
      }
      const currentUnselected = allColumns.filter((c) => !currentSelected.includes(c));
      setSelectedList(currentSelected);
      setUnselectedList(currentUnselected);
      setSearch('');
      setDraggedIndex(null);
    }
  }, [open, visibleCols, allColumns, mandatoryCol]);

  if (!open) return null;

  const handleToggleColumn = (col, isCurrentlySelected) => {
    if (col === mandatoryCol) return;

    if (isCurrentlySelected) {
      // Move from selected group down to unselected group
      setSelectedList((prev) => prev.filter((c) => c !== col));
      setUnselectedList((prev) => (prev.includes(col) ? prev : [...prev, col]));
    } else {
      // Move from unselected group up to end of selected group
      setUnselectedList((prev) => prev.filter((c) => c !== col));
      setSelectedList((prev) => (prev.includes(col) ? prev : [...prev, col]));
    }
  };

  const handleDragStart = (e, idx) => {
    setDraggedIndex(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetIdx) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIdx) return;
    setSelectedList((prev) => {
      const next = [...prev];
      const [moved] = next.splice(draggedIndex, 1);
      next.splice(targetIdx, 0, moved);
      return next;
    });
    setDraggedIndex(null);
  };

  const sQuery = search.trim().toLowerCase();
  const filteredSelected = sQuery
    ? selectedList.filter((c) => c.toLowerCase().includes(sQuery))
    : selectedList;
  const filteredUnselected = sQuery
    ? unselectedList.filter((c) => c.toLowerCase().includes(sQuery))
    : unselectedList;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-[440px] max-w-full flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-[16px] font-semibold text-primary">Manage Columns</h2>
            <span className="text-[12px] text-ink-500 bg-page px-2 py-0.5 rounded border border-line">
              {selectedList.length} Selected
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-400 hover:text-ink-700 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 border-b border-line bg-page/40">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-ink-400" size={16} />
            <input
              type="text"
              placeholder="Search columns..."
              className="w-full h-9 pl-9 pr-3 text-[14px] border border-line rounded-md bg-white focus:border-primary outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 thin-scroll">
          {/* Selected Columns group at the TOP */}
          {filteredSelected.length > 0 && (
            <div>
              <div className="text-[12px] font-bold text-ink-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Selected Columns ({filteredSelected.length})</span>
                <span className="text-[11px] font-normal lowercase text-ink-400">
                  drag handle to reorder
                </span>
              </div>
              <div className="space-y-1.5">
                {filteredSelected.map((c) => {
                  const isMandatory = c === mandatoryCol;
                  const origIdx = selectedList.indexOf(c);
                  return (
                    <div
                      key={c}
                      draggable={!sQuery}
                      onDragStart={(e) => handleDragStart(e, origIdx)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, origIdx)}
                      className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md border border-line bg-white hover:bg-page transition-colors select-none ${
                        draggedIndex === origIdx ? 'opacity-50 border-dashed border-primary' : ''
                      }`}
                    >
                      <div
                        className="text-ink-400 cursor-grab active:cursor-grabbing hover:text-ink-700"
                        title="Drag to reorder"
                      >
                        <GripVertical size={14} />
                      </div>
                      <label className="flex items-center gap-2.5 flex-1 cursor-pointer">
                        <input
                          type="checkbox"
                          className="cb"
                          disabled={isMandatory}
                          checked={true}
                          onChange={() => handleToggleColumn(c, true)}
                        />
                        <span className="text-[13.5px] font-medium text-ink flex-1">
                          {c}
                          {isMandatory && <span className="text-red-500 ml-0.5">*</span>}
                        </span>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Divider between selected and unselected */}
          {filteredSelected.length > 0 && filteredUnselected.length > 0 && (
            <div className="border-t border-line my-3" />
          )}

          {/* Unselected Columns group BELOW selected columns */}
          {filteredUnselected.length > 0 && (
            <div>
              <div className="text-[12px] font-bold text-ink-500 uppercase tracking-wider mb-2">
                Available Columns ({filteredUnselected.length})
              </div>
              <div className="space-y-1.5">
                {filteredUnselected.map((c) => (
                  <div
                    key={c}
                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md border border-line/60 bg-page/30 hover:bg-page transition-colors select-none"
                  >
                    <div className="w-[14px]" />
                    <label className="flex items-center gap-2.5 flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        className="cb"
                        checked={false}
                        onChange={() => handleToggleColumn(c, false)}
                      />
                      <span className="text-[13.5px] text-ink-700 flex-1">{c}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredSelected.length === 0 && filteredUnselected.length === 0 && (
            <div className="text-center py-8 text-ink-400 text-[13px]">
              No columns match &quot;{search}&quot;
            </div>
          )}
        </div>

        <div className="p-4 border-t border-line flex items-center justify-end gap-3 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary h-8 px-4 rounded text-[13px] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(selectedList)}
            className="btn-primary h-8 px-5 rounded text-[13px] cursor-pointer"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

