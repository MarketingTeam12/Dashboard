import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Tag, Check, X, Search, SlidersHorizontal, GripVertical, Plus, Edit2, Trash2,
  ExternalLink, Settings2, HelpCircle
} from 'lucide-react';
import Modal from '../../components/common/Modal';
import { useToast } from '../../components/common/Toast';
import { DEFAULT_DEAL_TAGS, DEFAULT_ORGANIZE_SECTIONS } from './dealsConfig';

/**
 * Arrow-shaped Tag Ribbon Badge matching Zoho CRM reference screenshots
 * Uses clip-path polygon for pointed arrow shape on the right edge.
 */
export function ArrowTagBadge({ name, color, textColor, onRemove, onClick, selected, className = '' }) {
  const bg = color || '#3B82F6';
  const fg = textColor || (name?.toLowerCase() === 'followup' ? '#1F2937' : '#FFFFFF');

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 h-[26px] text-[12px] font-semibold select-none transition-all ${
        onClick ? 'cursor-pointer hover:opacity-90' : ''
      } ${className}`}
      style={{
        backgroundColor: bg,
        color: fg,
        paddingLeft: '10px',
        paddingRight: onRemove ? '8px' : '18px',
        clipPath: 'polygon(0% 0%, calc(100% - 10px) 0%, 100% 50%, calc(100% - 10px) 100%, 0% 100%)',
        borderRadius: '3px 0 0 3px',
      }}
      title={name}
    >
      <span className="truncate leading-none">{name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(name);
          }}
          className="hover:bg-black/25 rounded-full p-0.5 ml-0.5 cursor-pointer leading-none transition-colors"
          title={`Remove tag ${name}`}
        >
          <X size={10} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}

/**
 * Add Tags Dropdown matching Screenshots 3, 4, 5
 * Appears below the deal name tag trigger with search input, arrow tags list, multiple selection,
 * Cancel and Save buttons, and Manage Tags access.
 */
export function AddTagsDropdown({
  isOpen,
  onClose,
  anchorRef,
  dealTags = [],
  allTags = [],
  onSaveTags,
  onOpenManageTags
}) {
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState(dealTags);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const popupRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedTags(dealTags);
      setSearch('');
    }
  }, [isOpen, dealTags]);

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      if (!anchorRef?.current) return;
      const rect = anchorRef.current.getBoundingClientRect();
      const popupWidth = 330;
      const popupHeight = 350;

      let top = rect.bottom + 6;
      let left = rect.left;

      // Viewport collision detection - Horizontal
      if (left + popupWidth > window.innerWidth - 12) {
        left = Math.max(12, window.innerWidth - popupWidth - 12);
      }
      if (left < 12) left = 12;

      // Viewport collision detection - Vertical
      if (top + popupHeight > window.innerHeight - 12 && rect.top > popupHeight + 10) {
        top = rect.top - popupHeight - 6;
      }

      setCoords({ top, left });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, anchorRef]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (popupRef.current && popupRef.current.contains(e.target)) return;
      if (anchorRef?.current && anchorRef.current.contains(e.target)) return;
      onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, anchorRef]);

  const filteredTags = useMemo(() => {
    if (!search.trim()) return allTags;
    const q = search.toLowerCase().trim();
    return allTags.filter(t => t.name.toLowerCase().includes(q));
  }, [allTags, search]);

  const toggleTag = (tagName) => {
    setSelectedTags(prev =>
      prev.includes(tagName) ? prev.filter(t => t !== tagName) : [...prev, tagName]
    );
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={popupRef}
      style={{
        position: 'fixed',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        width: '330px',
        zIndex: 99999,
      }}
      className="bg-white border border-[#CBD5E1] rounded-lg shadow-2xl p-3 text-[13px] animate-in fade-in duration-150 select-none"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Search Input Row with Tag Icon, Cancel, and Save */}
      <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
        <Tag size={16} fill="#475569" className="text-[#475569] shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Enter Tags"
          className="flex-1 h-8 px-2.5 text-[12.5px] bg-white border border-[#6366F1] rounded outline-none focus:ring-1 focus:ring-[#6366F1] text-slate-800"
          autoFocus
        />
        <button
          type="button"
          onClick={onClose}
          className="px-2.5 py-1 text-[12px] font-medium text-slate-600 hover:bg-slate-100 border border-slate-300 rounded cursor-pointer transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            onSaveTags(selectedTags);
            onClose();
          }}
          className="px-3.5 py-1 text-[12px] font-semibold text-white bg-[#7C8BF5] hover:bg-[#6879EC] rounded shadow-2xs cursor-pointer transition-colors"
        >
          Save
        </button>
      </div>

      {/* Scrollable Arrow Tags List matching Screenshots 3, 4, 5 */}
      <div className="max-h-[220px] overflow-y-auto thin-scroll py-2 px-0.5 space-y-1.5">
        {filteredTags.length === 0 ? (
          <div className="py-4 text-center text-slate-400 text-[12px]">
            No tags found matching "{search}"
          </div>
        ) : (
          filteredTags.map((t) => {
            const isSelected = selectedTags.includes(t.name);
            return (
              <div
                key={t.id}
                onClick={() => toggleTag(t.name)}
                className={`flex items-center justify-between px-2 py-1 rounded transition-colors cursor-pointer ${
                  isSelected ? 'bg-[#EEF2FF]' : 'hover:bg-[#F8FAFC]'
                }`}
              >
                <ArrowTagBadge
                  name={t.name}
                  color={t.color}
                  textColor={t.textColor}
                />
                {isSelected && (
                  <Check size={14} strokeWidth={2.5} className="text-[#4361EE] font-bold shrink-0 ml-2" />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer with Manage Tags Trigger */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11.5px]">
        <span className="text-slate-400 font-medium">{selectedTags.length} tag(s) selected</span>
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenManageTags?.();
          }}
          className="text-[#2563EB] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
        >
          <Settings2 size={12} />
          <span>Manage Tags</span>
        </button>
      </div>
    </div>,
    document.body
  );
}

/**
 * Manage Tags Modal for creating, editing, recoloring, and deleting tags
 */
export function ManageTagsModal({
  isOpen,
  onClose,
  allTags = [],
  onUpdateAllTags
}) {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#2563EB');
  const [editingTag, setEditingTag] = useState(null);
  const [deleteConfirmTag, setDeleteConfirmTag] = useState(null);

  const TAG_PALETTE = [
    '#EA580C', '#DC2626', '#16A34A', '#881337', '#EAB308', '#DB2777',
    '#6366F1', '#EC4899', '#0D9488', '#2563EB', '#C2410C', '#65A30D',
    '#831843', '#0284C7', '#10B981', '#B91C1C', '#8B5CF6', '#14B8A6'
  ];

  const filteredTags = useMemo(() => {
    if (!search.trim()) return allTags;
    const q = search.toLowerCase().trim();
    return allTags.filter(t => t.name.toLowerCase().includes(q));
  }, [allTags, search]);

  const handleCreateTag = () => {
    const trimmed = newTagName.trim();
    if (!trimmed) {
      toast.error('Tag name is required.');
      return;
    }
    if (allTags.some(t => t.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error(`Tag "${trimmed}" already exists.`);
      return;
    }
    const newTag = {
      id: `tag-${Date.now()}`,
      name: trimmed,
      color: newTagColor,
      textColor: newTagColor === '#EAB308' ? '#1F2937' : '#FFFFFF'
    };
    const next = [...allTags, newTag];
    onUpdateAllTags(next);
    setNewTagName('');
    setIsCreating(false);
    toast.success(`Tag "${trimmed}" created successfully.`);
  };

  const handleSaveEditTag = () => {
    if (!editingTag || !editingTag.name.trim()) return;
    const next = allTags.map(t =>
      t.id === editingTag.id
        ? {
            ...t,
            name: editingTag.name.trim(),
            color: editingTag.color,
            textColor: editingTag.color === '#EAB308' ? '#1F2937' : '#FFFFFF'
          }
        : t
    );
    onUpdateAllTags(next);
    setEditingTag(null);
    toast.success('Tag updated successfully.');
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmTag) return;
    const next = allTags.filter(t => t.id !== deleteConfirmTag.id);
    onUpdateAllTags(next);
    toast.success(`Tag "${deleteConfirmTag.name}" deleted.`);
    setDeleteConfirmTag(null);
  };

  if (!isOpen) return null;

  return (
    <>
      <Modal
        open={isOpen}
        onClose={onClose}
        title="Manage Tags"
        size="md"
        footer={
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-[#2563EB] text-white text-[13px] font-medium hover:bg-[#1D4ED8] cursor-pointer"
          >
            Done
          </button>
        }
      >
        <div className="space-y-4 py-1 text-[13px]">
          {/* Top Actions: Search and Create Button */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search tags..."
                className="w-full h-8 pl-8 pr-2.5 text-[12.5px] border border-slate-300 rounded outline-none focus:border-[#4361EE]"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setIsCreating(true);
                setNewTagName('');
                setNewTagColor('#2563EB');
              }}
              className="btn-primary h-8 px-3 text-[12px] flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={13} />
              <span>Create New Tag</span>
            </button>
          </div>

          {/* New Tag Form */}
          {isCreating && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3 animate-in fade-in">
              <div className="font-semibold text-slate-700 text-[12.5px]">New Tag Details</div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newTagName}
                  onChange={e => setNewTagName(e.target.value)}
                  placeholder="Tag Name (e.g. VIP Customer)"
                  className="flex-1 h-8 px-2.5 text-[12.5px] bg-white border border-slate-300 rounded outline-none focus:border-[#4361EE]"
                  autoFocus
                />
                <ArrowTagBadge
                  name={newTagName || 'Preview'}
                  color={newTagColor}
                />
              </div>
              <div>
                <label className="block text-[11.5px] text-slate-500 font-medium mb-1">Select Tag Color</label>
                <div className="flex flex-wrap items-center gap-2">
                  {TAG_PALETTE.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewTagColor(c)}
                      className={`w-5 h-5 rounded-full border-2 transition-transform cursor-pointer ${
                        newTagColor === c ? 'border-black scale-110' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1 text-[12px] border border-slate-300 rounded hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateTag}
                  className="btn-primary h-7 px-3 text-[12px]"
                >
                  Save Tag
                </button>
              </div>
            </div>
          )}

          {/* Tags List Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden max-h-72 overflow-y-auto thin-scroll">
            <table className="w-full text-left text-[12.5px]">
              <thead className="bg-[#F8FAFC] text-slate-600 border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="p-2.5 font-semibold">Tag Badge</th>
                  <th className="p-2.5 font-semibold">Tag Name</th>
                  <th className="p-2.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTags.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-400">
                      No tags found
                    </td>
                  </tr>
                ) : (
                  filteredTags.map(t => {
                    const isEditingThis = editingTag?.id === t.id;
                    return (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-2.5">
                          <ArrowTagBadge
                            name={isEditingThis ? editingTag.name || t.name : t.name}
                            color={isEditingThis ? editingTag.color : t.color}
                            textColor={isEditingThis ? (editingTag.color === '#EAB308' ? '#1F2937' : '#FFFFFF') : t.textColor}
                          />
                        </td>
                        <td className="p-2.5">
                          {isEditingThis ? (
                            <div className="space-y-1.5">
                              <input
                                type="text"
                                value={editingTag.name}
                                onChange={e => setEditingTag({ ...editingTag, name: e.target.value })}
                                className="h-7 px-2 text-[12px] border border-slate-300 rounded outline-none focus:border-[#4361EE] w-full max-w-[200px]"
                              />
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {TAG_PALETTE.map(c => (
                                  <button
                                    key={c}
                                    type="button"
                                    onClick={() => setEditingTag({ ...editingTag, color: c })}
                                    className={`w-4 h-4 rounded-full border ${
                                      editingTag.color === c ? 'border-black scale-110' : 'border-transparent'
                                    }`}
                                    style={{ backgroundColor: c }}
                                  />
                                ))}
                              </div>
                            </div>
                          ) : (
                            <span className="font-medium text-slate-800">{t.name}</span>
                          )}
                        </td>
                        <td className="p-2.5 text-right">
                          {isEditingThis ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setEditingTag(null)}
                                className="px-2 py-0.5 text-[11.5px] border border-slate-300 rounded hover:bg-slate-100"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={handleSaveEditTag}
                                className="px-2.5 py-0.5 text-[11.5px] bg-[#4361EE] text-white rounded font-medium"
                              >
                                Save
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2 text-slate-400">
                              <button
                                type="button"
                                onClick={() => setEditingTag({ ...t })}
                                className="hover:text-primary p-1 rounded hover:bg-slate-100 cursor-pointer"
                                title="Edit tag"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmTag(t)}
                                className="hover:text-red-600 p-1 rounded hover:bg-red-50 cursor-pointer"
                                title="Delete tag"
                              >
                                <Trash2 size={13} />
                              </button>
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
      </Modal>

      {/* Delete Confirmation Modal */}
      {deleteConfirmTag && (
        <Modal
          open={!!deleteConfirmTag}
          onClose={() => setDeleteConfirmTag(null)}
          title="Delete Tag?"
          size="sm"
          footer={
            <>
              <button
                type="button"
                onClick={() => setDeleteConfirmTag(null)}
                className="btn-secondary px-3.5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white font-semibold text-[13px] cursor-pointer"
              >
                Delete Tag
              </button>
            </>
          }
        >
          <p className="text-[13px] text-slate-600 py-2">
            Are you sure you want to delete tag <strong>"{deleteConfirmTag.name}"</strong>? This will remove the tag globally from all deals.
          </p>
        </Modal>
      )}
    </>
  );
}

/**
 * Organize Potentials Details Panel matching Screenshot 1
 * Right-side slide-over panel with search, checkbox selection, drag-and-drop reordering, Save/Cancel.
 */
export function OrganizeSectionsPanel({
  isOpen,
  onClose,
  sections = DEFAULT_ORGANIZE_SECTIONS,
  onSave
}) {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [tempSections, setTempSections] = useState(sections);
  const [draggedIndex, setDraggedIndex] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setTempSections(sections);
      setSearch('');
    }
  }, [isOpen, sections]);

  if (!isOpen) return null;

  const filtered = tempSections.filter(s =>
    s.label.toLowerCase().includes(search.toLowerCase().trim())
  );

  const toggleVisibility = (id) => {
    setTempSections(prev =>
      prev.map(s => (s.id === id ? { ...s, visible: !s.visible } : s))
    );
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const reordered = [...tempSections];
    const item = reordered.splice(draggedIndex, 1)[0];
    reordered.splice(index, 0, item);
    setDraggedIndex(index);
    setTempSections(reordered);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSave = () => {
    onSave(tempSections);
    toast.success('Organize Potentials Details saved successfully.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out Panel matching Screenshot 1 */}
      <div className="relative w-full max-w-[360px] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
        {/* Panel Header */}
        <div className="p-5 pb-3">
          <h2 className="text-[17px] font-bold text-slate-900 tracking-tight">
            Organize Potentials Details
          </h2>
          <div className="mt-3 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search"
              className="w-full h-9 pl-9 pr-3 text-[13px] bg-white border border-[#6366F1] rounded-md outline-none focus:ring-1 focus:ring-[#6366F1] text-slate-800"
              autoFocus
            />
          </div>
        </div>

        {/* Scrollable Checkbox List with Drag & Drop */}
        <div className="flex-1 overflow-y-auto thin-scroll px-4 py-2 space-y-0.5">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-[13px]">
              No sections matching "{search}"
            </div>
          ) : (
            filtered.map((item, idx) => {
              const originalIndex = tempSections.findIndex(s => s.id === item.id);
              const isDragging = draggedIndex === originalIndex;

              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, originalIndex)}
                  onDragOver={(e) => handleDragOver(e, originalIndex)}
                  onDragEnd={handleDragEnd}
                  className={`group flex items-center gap-2.5 px-2 py-2 rounded-md transition-colors cursor-pointer select-none ${
                    isDragging ? 'bg-[#EEF2FF] opacity-60' : 'hover:bg-[#F8FAFC]'
                  }`}
                >
                  <GripVertical
                    size={14}
                    className="text-slate-400 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing shrink-0 transition-opacity"
                  />
                  <input
                    type="checkbox"
                    checked={item.visible}
                    onChange={() => toggleVisibility(item.id)}
                    className="rounded text-[#4361EE] focus:ring-[#4361EE]/20 w-4 h-4 cursor-pointer shrink-0"
                  />
                  <span className="text-[13.5px] text-slate-800 font-medium truncate">
                    {item.label}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Panel Footer with Cancel & Save */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2.5 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 text-[13px] font-medium transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-1.5 rounded-md bg-[#94A3F8] hover:bg-[#7E91F6] text-white text-[13px] font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Manage Link Modal matching Screenshot 2
 * Displays list of hyperlinks with Create New Link button, table, edit/delete actions, and form.
 */
export function ManageLinksModal({
  isOpen,
  onClose,
  links = [],
  onUpdateLinks
}) {
  const toast = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    url: '',
    profilesPermitted: 'All Profiles'
  });

  const handleOpenCreate = () => {
    setEditingLink(null);
    setFormData({
      name: '',
      description: '',
      url: '',
      profilesPermitted: 'All Profiles'
    });
    setFormOpen(true);
  };

  const handleOpenEdit = (lnk) => {
    setEditingLink(lnk);
    setFormData({
      name: lnk.name || lnk.title || '',
      description: lnk.description || '',
      url: lnk.url || '',
      profilesPermitted: lnk.profilesPermitted || 'All Profiles'
    });
    setFormOpen(true);
  };

  const handleSaveForm = () => {
    if (!formData.name.trim()) {
      toast.error('Link Name is required.');
      return;
    }
    if (!formData.url.trim()) {
      toast.error('URL is required.');
      return;
    }

    const cleanUrl = formData.url.trim().startsWith('http') ? formData.url.trim() : `https://${formData.url.trim()}`;
    const nowStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (editingLink) {
      const next = links.map(l =>
        l.id === editingLink.id
          ? {
              ...l,
              name: formData.name.trim(),
              title: formData.name.trim(),
              description: formData.description.trim(),
              url: cleanUrl,
              profilesPermitted: formData.profilesPermitted,
              lastModified: nowStr
            }
          : l
      );
      onUpdateLinks(next);
      toast.success('Link updated successfully.');
    } else {
      const newLnk = {
        id: `lnk-${Date.now()}`,
        name: formData.name.trim(),
        title: formData.name.trim(),
        description: formData.description.trim(),
        url: cleanUrl,
        profilesPermitted: formData.profilesPermitted,
        lastModified: nowStr
      };
      onUpdateLinks([...links, newLnk]);
      toast.success(`Link "${formData.name.trim()}" created successfully.`);
    }

    setFormOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;
    const next = links.filter(l => l.id !== deleteConfirm.id);
    onUpdateLinks(next);
    toast.success(`Link "${deleteConfirm.name || deleteConfirm.title}" deleted.`);
    setDeleteConfirm(null);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 flex items-center justify-center p-4">
        <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-slate-800">Manage Link</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Description & Action Bar matching Screenshot 2 */}
          <div className="p-5 pb-3 space-y-4">
            <p className="text-[13px] text-slate-600 leading-relaxed max-w-3xl">
              Links are hyperlinks that can include Zoho CRM fields as parameters in their URL. Use them to integrate your Zoho CRM's data with other Zoho Apps, your company's website or intranet, and third-party applications.
            </p>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleOpenCreate}
                className="px-4 py-2 rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13px] font-semibold transition-colors shadow-xs cursor-pointer"
              >
                Create New Link
              </button>
            </div>
          </div>

          {/* Table matching Screenshot 2 */}
          <div className="p-5 pt-0 overflow-x-auto flex-1 thin-scroll">
            <table className="w-full text-left text-[13px] border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-[#F8FAFC] text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="p-3 font-semibold">Link Name</th>
                  <th className="p-3 font-semibold">Description</th>
                  <th className="p-3 font-semibold">Profiles Permitted</th>
                  <th className="p-3 font-semibold">Last Modified</th>
                  <th className="p-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {links.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[13px] text-slate-400">
                      No Link found.
                    </td>
                  </tr>
                ) : (
                  links.map(lnk => (
                    <tr key={lnk.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-medium text-primary">
                        <a
                          href={lnk.url}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline flex items-center gap-1.5"
                        >
                          <span>{lnk.name || lnk.title}</span>
                          <ExternalLink size={12} className="opacity-60" />
                        </a>
                      </td>
                      <td className="p-3 text-slate-600">{lnk.description || '—'}</td>
                      <td className="p-3 text-slate-600">{lnk.profilesPermitted || 'All Profiles'}</td>
                      <td className="p-3 text-slate-500 font-mono text-[12px]">{lnk.lastModified || '—'}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2 text-slate-400">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(lnk)}
                            className="p-1 hover:text-primary rounded hover:bg-slate-100 cursor-pointer"
                            title="Edit link"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm(lnk)}
                            className="p-1 hover:text-red-600 rounded hover:bg-red-50 cursor-pointer"
                            title="Delete link"
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
      </div>

      {/* Create / Edit Link Form Modal */}
      {formOpen && (
        <Modal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          title={editingLink ? 'Edit Link' : 'Create New Link'}
          size="md"
          footer={
            <>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="btn-secondary px-4"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveForm}
                className="btn-primary px-5"
              >
                Save
              </button>
            </>
          }
        >
          <div className="space-y-3.5 py-1 text-[13px]">
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Link Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Client Documentation Portal"
                className="input-field w-full"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                placeholder="Brief description of the link"
                className="input-field w-full resize-y"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                URL <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.url}
                onChange={e => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://example.com/portal?deal=${deal.id}"
                className="input-field w-full font-mono text-[12.5px]"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Profiles Permitted
              </label>
              <select
                value={formData.profilesPermitted}
                onChange={e => setFormData({ ...formData, profilesPermitted: e.target.value })}
                className="input-field w-full"
              >
                <option value="All Profiles">All Profiles</option>
                <option value="Standard">Standard</option>
                <option value="Administrator">Administrator</option>
                <option value="Executive">Executive</option>
              </select>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <Modal
          open={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          title="Delete Link?"
          size="sm"
          footer={
            <>
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="btn-secondary px-3.5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white font-semibold text-[13px] cursor-pointer"
              >
                Delete Link
              </button>
            </>
          }
        >
          <p className="text-[13px] text-slate-600 py-2">
            Are you sure you want to delete link <strong>"{deleteConfirm.name || deleteConfirm.title}"</strong>?
          </p>
        </Modal>
      )}
    </>
  );
}

