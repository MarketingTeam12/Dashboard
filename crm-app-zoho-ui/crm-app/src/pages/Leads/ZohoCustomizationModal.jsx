import { useEffect, useState } from 'react';
import {
  ArrowDown, ArrowUp, Check, Columns3, Layers, Palette, Pencil, Plus, RotateCcw,
  ShieldCheck, Sliders, Trash2, Workflow, X, AlertTriangle,
} from 'lucide-react';
import Modal from '../../components/common/Modal';
import {
  ALL_LEADS_COLUMNS,
  DEFAULT_CUSTOMIZATION,
  DEFAULT_LAYOUTS,
  getAllConfiguredColumns,
  useZohoCustomization,
} from './zohoCustomizationConfig';

export default function ZohoCustomizationModal({ open, onClose, initialTab = 'columns', onNotify }) {
  const { config, updateConfig, resetConfig } = useZohoCustomization();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  // 1. Columns tab state
  const [newColLabel, setNewColLabel] = useState('');
  const [newColWidth, setNewColWidth] = useState(150);

  // 2. Custom Fields tab state
  const [newField, setNewField] = useState({
    label: '',
    type: 'text',
    required: false,
    section: 'Lead Information',
    optionsText: '',
  });
  const [editingFieldId, setEditingFieldId] = useState(null);
  const [editFieldDraft, setEditFieldDraft] = useState({
    label: '',
    type: 'text',
    required: false,
    section: 'Lead Information',
    optionsText: '',
  });

  // 3. Dropdowns & Colors tab state
  const [newStatus, setNewStatus] = useState('');
  const [newStatusColor, setNewStatusColor] = useState('#2F55D4');
  const [editingStatus, setEditingStatus] = useState(null); // { original, value }

  const [newTag, setNewTag] = useState('');
  const [newTagColor, setNewTagColor] = useState('#F97316');
  const [editingTag, setEditingTag] = useState(null); // { original, value }

  const [newSource, setNewSource] = useState('');
  const [newSourceColor, setNewSourceColor] = useState('#2563EB');
  const [editingSource, setEditingSource] = useState(null); // { original, value }

  const [newCategory, setNewCategory] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#0D9488');
  const [editingCategory, setEditingCategory] = useState(null); // { original, value }

  // 4. Layouts tab state
  const [newLayoutForm, setNewLayoutForm] = useState({
    name: '',
    description: '',
    columns: 2,
  });
  const [editingLayoutId, setEditingLayoutId] = useState(null);
  const [editLayoutDraft, setEditLayoutDraft] = useState({
    name: '',
    description: '',
    columns: 2,
  });
  const [newBusinessCardField, setNewBusinessCardField] = useState('');

  // 5. Workflow Rules tab state
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    module: 'Leads',
    trigger: 'On Lead Creation',
    action: 'Assign Owner & Create Follow-up Task',
  });
  const [editingWorkflowId, setEditingWorkflowId] = useState(null);
  const [editWorkflowDraft, setEditWorkflowDraft] = useState({
    name: '',
    module: 'Leads',
    trigger: '',
    action: '',
  });

  // 6. Role-Based Permissions tab state
  const [newRoleName, setNewRoleName] = useState('');

  useEffect(() => {
    if (open && initialTab) setActiveTab(initialTab);
  }, [open, initialTab]);

  if (!open) return null;

  const notifyUser = (msg, type = 'success') => {
    if (onNotify) onNotify(msg, type);
  };

  // Build ordered columns list including custom columns
  const allCols = getAllConfiguredColumns(config);
  const orderedCols = (config.columnOrder || allCols.map((c) => c.key))
    .map((k) => allCols.find((c) => c.key === k))
    .filter(Boolean);

  allCols.forEach((c) => {
    if (!orderedCols.some((x) => x.key === c.key)) orderedCols.push(c);
  });

  // --- Column Handlers ---
  const toggleColumnVisibility = (key) => {
    const set = new Set(config.visibleColumnKeys || []);
    if (set.has(key)) {
      if (set.size <= 2) {
        notifyUser('At least 2 columns must remain visible', 'info');
        return;
      }
      set.delete(key);
    } else {
      set.add(key);
    }
    updateConfig({ visibleColumnKeys: [...set] });
  };

  const moveColumn = (idx, dir) => {
    const nextOrder = orderedCols.map((c) => c.key);
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= nextOrder.length) return;
    const [item] = nextOrder.splice(idx, 1);
    nextOrder.splice(targetIdx, 0, item);
    updateConfig({ columnOrder: nextOrder });
  };

  const handleAddColumn = (e) => {
    if (e) e.preventDefault();
    const trimmed = newColLabel.trim();
    if (!trimmed) return;
    const key = `col_${trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Date.now().toString(36).slice(-3)}`;
    const widthVal = Math.max(80, Math.min(420, Number(newColWidth) || 150));
    const newColObj = {
      key,
      label: trimmed,
      defaultVisible: true,
      width: widthVal,
      isCustom: true,
    };
    updateConfig((prev) => ({
      ...prev,
      customColumns: [...(prev.customColumns || []), newColObj],
      columnOrder: [...orderedCols.map((c) => c.key), key],
      visibleColumnKeys: [...new Set([...(prev.visibleColumnKeys || []), key])],
      columnWidths: { ...(prev.columnWidths || {}), [key]: widthVal },
      fieldLabels: { ...(prev.fieldLabels || {}), [key]: trimmed },
    }));
    setNewColLabel('');
    setNewColWidth(150);
    notifyUser(`Column "${trimmed}" added and enabled`);
  };

  const handleRemoveColumn = (col) => {
    if (col.key === 'leadName') {
      notifyUser('Primary column "Lead Name" cannot be removed', 'error');
      return;
    }
    updateConfig((prev) => ({
      ...prev,
      customColumns: (prev.customColumns || []).filter((c) => c.key !== col.key),
      removedColumnKeys: [...new Set([...(prev.removedColumnKeys || []), col.key])],
      visibleColumnKeys: (prev.visibleColumnKeys || []).filter((k) => k !== col.key),
      columnOrder: (prev.columnOrder || []).filter((k) => k !== col.key),
    }));
    notifyUser(`Column "${config.fieldLabels?.[col.key] || col.label}" removed`, 'info');
  };

  // --- Custom Field Handlers ---
  const handleAddCustomField = (e) => {
    if (e) e.preventDefault();
    if (!newField.label.trim()) return;
    const key = `cf_${newField.label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Date.now().toString(36).slice(-3)}`;
    const cf = {
      id: `cf-${Date.now()}`,
      key,
      label: newField.label.trim(),
      type: newField.type,
      required: newField.required,
      section: newField.section,
      options: newField.optionsText
        ? newField.optionsText.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
    };
    updateConfig((prev) => ({
      ...prev,
      customFields: [...(prev.customFields || []), cf],
    }));
    setNewField({ label: '', type: 'text', required: false, section: 'Lead Information', optionsText: '' });
    notifyUser(`Custom field "${cf.label}" created`);
  };

  const startEditCustomField = (cf) => {
    setEditingFieldId(cf.id);
    setEditFieldDraft({
      label: cf.label || '',
      type: cf.type || 'text',
      required: Boolean(cf.required),
      section: cf.section || 'Lead Information',
      optionsText: Array.isArray(cf.options) ? cf.options.join(', ') : '',
    });
  };

  const saveEditCustomField = (id) => {
    if (!editFieldDraft.label.trim()) return;
    updateConfig((prev) => ({
      ...prev,
      customFields: (prev.customFields || []).map((cf) =>
        cf.id === id
          ? {
              ...cf,
              label: editFieldDraft.label.trim(),
              type: editFieldDraft.type,
              required: Boolean(editFieldDraft.required),
              section: editFieldDraft.section,
              options: editFieldDraft.optionsText
                ? editFieldDraft.optionsText.split(',').map((s) => s.trim()).filter(Boolean)
                : [],
            }
          : cf
      ),
    }));
    setEditingFieldId(null);
    notifyUser(`Custom field "${editFieldDraft.label.trim()}" updated`);
  };

  const handleDeleteCustomField = (id) => {
    updateConfig((prev) => ({
      ...prev,
      customFields: (prev.customFields || []).filter((f) => f.id !== id),
    }));
    notifyUser('Custom field removed', 'info');
  };

  // --- Dropdowns & Colors Handlers ---
  const handleAddStatusOption = () => {
    const v = newStatus.trim();
    if (!v) return;
    updateConfig((prev) => ({
      ...prev,
      customStatuses: [...new Set([...(prev.customStatuses || LEAD_STATUSES), v])],
      statusColors: { ...(prev.statusColors || {}), [v]: newStatusColor || '#2F55D4' },
    }));
    setNewStatus('');
    notifyUser(`Lead Status "${v}" added`);
  };

  const handleRenameStatus = (oldVal, nextVal) => {
    const trimmed = (nextVal || '').trim();
    if (!trimmed || trimmed === oldVal) {
      setEditingStatus(null);
      return;
    }
    updateConfig((prev) => {
      const list = (prev.customStatuses || LEAD_STATUSES).map((s) => (s === oldVal ? trimmed : s));
      const nextColors = { ...(prev.statusColors || {}) };
      nextColors[trimmed] = nextColors[oldVal] || '#2F7BF5';
      return {
        ...prev,
        customStatuses: [...new Set(list)],
        statusColors: nextColors,
      };
    });
    setEditingStatus(null);
    notifyUser(`Status renamed to "${trimmed}"`);
  };

  const handleDeleteStatus = (st) => {
    updateConfig((prev) => ({
      ...prev,
      customStatuses: (prev.customStatuses || LEAD_STATUSES).filter((s) => s !== st),
    }));
    notifyUser(`Status "${st}" deleted`, 'info');
  };

  const handleAddTagOption = () => {
    const v = newTag.trim();
    if (!v) return;
    updateConfig((prev) => ({
      ...prev,
      customTags: [...new Set([...(prev.customTags || LEAD_TAGS), v])],
      tagColors: { ...(prev.tagColors || {}), [v]: newTagColor || '#2F55D4' },
    }));
    setNewTag('');
    notifyUser(`Tag "${v}" added`);
  };

  const handleRenameTag = (oldVal, nextVal) => {
    const trimmed = (nextVal || '').trim();
    if (!trimmed || trimmed === oldVal) {
      setEditingTag(null);
      return;
    }
    updateConfig((prev) => {
      const list = (prev.customTags || LEAD_TAGS).map((t) => (t === oldVal ? trimmed : t));
      const nextColors = { ...(prev.tagColors || {}) };
      nextColors[trimmed] = nextColors[oldVal] || '#64748B';
      return {
        ...prev,
        customTags: [...new Set(list)],
        tagColors: nextColors,
      };
    });
    setEditingTag(null);
    notifyUser(`Tag renamed to "${trimmed}"`);
  };

  const handleDeleteTag = (tg) => {
    updateConfig((prev) => ({
      ...prev,
      customTags: (prev.customTags || LEAD_TAGS).filter((t) => t !== tg),
    }));
    notifyUser(`Tag "${tg}" deleted`, 'info');
  };

  const handleAddSourceOption = () => {
    const v = newSource.trim();
    if (!v) return;
    updateConfig((prev) => ({
      ...prev,
      customSources: [...new Set([...(prev.customSources || LEAD_SOURCES), v])],
      sourceColors: { ...(prev.sourceColors || {}), [v]: newSourceColor || '#2563EB' },
    }));
    setNewSource('');
    notifyUser(`Lead Source "${v}" added`);
  };

  const handleRenameSource = (oldVal, nextVal) => {
    const trimmed = (nextVal || '').trim();
    if (!trimmed || trimmed === oldVal) {
      setEditingSource(null);
      return;
    }
    updateConfig((prev) => {
      const list = (prev.customSources || LEAD_SOURCES).map((s) => (s === oldVal ? trimmed : s));
      const nextColors = { ...(prev.sourceColors || {}) };
      nextColors[trimmed] = nextColors[oldVal] || '#2563EB';
      return {
        ...prev,
        customSources: [...new Set(list)],
        sourceColors: nextColors,
      };
    });
    setEditingSource(null);
    notifyUser(`Lead Source renamed to "${trimmed}"`);
  };

  const handleDeleteSource = (src) => {
    updateConfig((prev) => ({
      ...prev,
      customSources: (prev.customSources || LEAD_SOURCES).filter((s) => s !== src),
    }));
    notifyUser(`Lead Source "${src}" removed`, 'info');
  };

  const handleAddCategoryOption = () => {
    const v = newCategory.trim();
    if (!v) return;
    updateConfig((prev) => ({
      ...prev,
      customCategories: [...new Set([...(prev.customCategories || []), v])],
      categoryColors: { ...(prev.categoryColors || {}), [v]: newCategoryColor || '#0D9488' },
    }));
    setNewCategory('');
    notifyUser(`Category "${v}" added`);
  };

  const handleRenameCategory = (oldVal, nextVal) => {
    const trimmed = (nextVal || '').trim();
    if (!trimmed || trimmed === oldVal) {
      setEditingCategory(null);
      return;
    }
    updateConfig((prev) => {
      const list = (prev.customCategories || []).map((c) => (c === oldVal ? trimmed : c));
      const nextColors = { ...(prev.categoryColors || {}) };
      nextColors[trimmed] = nextColors[oldVal] || '#0D9488';
      return {
        ...prev,
        customCategories: [...new Set(list)],
        categoryColors: nextColors,
      };
    });
    setEditingCategory(null);
    notifyUser(`Category renamed to "${trimmed}"`);
  };

  const handleDeleteCategory = (cat) => {
    updateConfig((prev) => ({
      ...prev,
      customCategories: (prev.customCategories || []).filter((c) => c !== cat),
    }));
    notifyUser(`Category "${cat}" removed`, 'info');
  };

  // --- Layouts Handlers ---
  const layoutsList = Array.isArray(config.layouts) && config.layouts.length > 0 ? config.layouts : DEFAULT_LAYOUTS;

  const handleCreateLayout = (e) => {
    if (e) e.preventDefault();
    const name = newLayoutForm.name.trim();
    if (!name) return;
    const newLyt = {
      id: `layout-${Date.now()}`,
      name,
      description: newLayoutForm.description.trim() || 'Custom Zoho CRM layout configuration',
      columns: Number(newLayoutForm.columns) || 2,
      isDefault: false,
    };
    updateConfig((prev) => ({
      ...prev,
      layouts: [...(prev.layouts || DEFAULT_LAYOUTS), newLyt],
      formLayout: name,
    }));
    setNewLayoutForm({ name: '', description: '', columns: 2 });
    notifyUser(`Layout "${name}" created and set as active`);
  };

  const startEditLayout = (lyt) => {
    setEditingLayoutId(lyt.id);
    setEditLayoutDraft({
      name: lyt.name,
      description: lyt.description || '',
      columns: lyt.columns || 2,
    });
  };

  const saveEditLayout = (lyt) => {
    const trimmed = editLayoutDraft.name.trim();
    if (!trimmed) return;
    updateConfig((prev) => ({
      ...prev,
      layouts: (prev.layouts || DEFAULT_LAYOUTS).map((l) =>
        l.id === lyt.id
          ? {
              ...l,
              name: trimmed,
              description: editLayoutDraft.description.trim(),
              columns: Number(editLayoutDraft.columns) || 2,
            }
          : l
      ),
      formLayout: prev.formLayout === lyt.name ? trimmed : prev.formLayout,
    }));
    setEditingLayoutId(null);
    notifyUser(`Layout "${trimmed}" saved`);
  };

  const handleDeleteLayout = (lyt) => {
    const remaining = layoutsList.filter((l) => l.id !== lyt.id);
    if (remaining.length === 0) return;
    updateConfig((prev) => ({
      ...prev,
      layouts: remaining,
      formLayout: prev.formLayout === lyt.name ? remaining[0].name : prev.formLayout,
    }));
    notifyUser(`Layout "${lyt.name}" deleted`, 'info');
  };

  // --- Workflow Rules Handlers ---
  const handleAddWorkflowRule = () => {
    if (!newWorkflow.name.trim()) return;
    const rule = {
      id: `wf-${Date.now()}`,
      name: newWorkflow.name.trim(),
      module: newWorkflow.module || 'Leads',
      trigger: newWorkflow.trigger,
      action: newWorkflow.action || 'Assign Owner & Create Follow-up Task',
      active: true,
    };
    updateConfig((prev) => ({
      ...prev,
      workflowRules: [...(prev.workflowRules || []), rule],
    }));
    setNewWorkflow({
      name: '',
      module: 'Leads',
      trigger: 'On Lead Creation',
      action: 'Assign Owner & Create Follow-up Task',
    });
    notifyUser(`Workflow rule "${rule.name}" added`);
  };

  const startEditWorkflow = (wf) => {
    setEditingWorkflowId(wf.id);
    setEditWorkflowDraft({
      name: wf.name || '',
      module: wf.module || 'Leads',
      trigger: wf.trigger || 'On Lead Creation',
      action: wf.action || 'Assign Owner & Create Follow-up Task',
    });
  };

  const saveEditWorkflow = (id) => {
    if (!editWorkflowDraft.name.trim()) return;
    updateConfig((prev) => ({
      ...prev,
      workflowRules: (prev.workflowRules || []).map((r) =>
        r.id === id
          ? {
              ...r,
              name: editWorkflowDraft.name.trim(),
              module: editWorkflowDraft.module || 'Leads',
              trigger: editWorkflowDraft.trigger,
              action: editWorkflowDraft.action,
            }
          : r
      ),
    }));
    setEditingWorkflowId(null);
    notifyUser(`Workflow rule "${editWorkflowDraft.name.trim()}" updated`);
  };

  // --- Role-Based Permissions Handlers ---
  const handleAddRole = (e) => {
    if (e) e.preventDefault();
    const trimmed = newRoleName.trim();
    if (!trimmed) return;
    if (config.rolePermissions?.[trimmed]) {
      notifyUser(`Role "${trimmed}" already exists`, 'info');
      return;
    }
    updateConfig((prev) => ({
      ...prev,
      rolePermissions: {
        ...(prev.rolePermissions || {}),
        [trimmed]: {
          canCreate: true,
          canEdit: true,
          canImport: true,
          canBulkImport: false,
          canExport: true,
          canConvert: true,
          canApproveDeals: false,
          canDelete: false,
          canCustomize: false,
        },
      },
      activeRole: trimmed,
    }));
    setNewRoleName('');
    notifyUser(`Role "${trimmed}" created`);
  };

  const handleDeleteRole = (roleName) => {
    if (roleName === 'Administrator') {
      notifyUser('Administrator role cannot be deleted', 'error');
      return;
    }
    updateConfig((prev) => {
      const nextRoles = { ...(prev.rolePermissions || {}) };
      delete nextRoles[roleName];
      return {
        ...prev,
        rolePermissions: nextRoles,
        activeRole: prev.activeRole === roleName ? 'Administrator' : prev.activeRole,
      };
    });
    notifyUser(`Role "${roleName}" deleted`, 'info');
  };

  // --- Save & Close (commits any pending input fields + persists) ---
  const handleSaveAndClose = () => {
    updateConfig((prev) => {
      let next = { ...prev };
      if (newStatus.trim()) {
        const v = newStatus.trim();
        next.customStatuses = [...new Set([...(next.customStatuses || LEAD_STATUSES), v])];
        next.statusColors = { ...(next.statusColors || {}), [v]: newStatusColor || '#2F55D4' };
      }
      if (newTag.trim()) {
        const v = newTag.trim();
        next.customTags = [...new Set([...(next.customTags || LEAD_TAGS), v])];
        next.tagColors = { ...(next.tagColors || {}), [v]: newTagColor || '#F97316' };
      }
      if (newSource.trim()) {
        const v = newSource.trim();
        next.customSources = [...new Set([...(next.customSources || LEAD_SOURCES), v])];
        next.sourceColors = { ...(next.sourceColors || {}), [v]: newSourceColor || '#2563EB' };
      }
      if (newCategory.trim()) {
        const v = newCategory.trim();
        next.customCategories = [...new Set([...(next.customCategories || []), v])];
        next.categoryColors = { ...(next.categoryColors || {}), [v]: newCategoryColor || '#0D9488' };
      }
      if (newColLabel.trim()) {
        const trimmed = newColLabel.trim();
        const key = `col_${trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Date.now().toString(36).slice(-3)}`;
        const widthVal = Math.max(80, Math.min(420, Number(newColWidth) || 150));
        next.customColumns = [...(next.customColumns || []), { key, label: trimmed, defaultVisible: true, width: widthVal, isCustom: true }];
        next.columnOrder = [...(next.columnOrder || []), key];
        next.visibleColumnKeys = [...new Set([...(next.visibleColumnKeys || []), key])];
        next.columnWidths = { ...(next.columnWidths || {}), [key]: widthVal };
        next.fieldLabels = { ...(next.fieldLabels || {}), [key]: trimmed };
      }
      if (newField.label.trim()) {
        const key = `cf_${newField.label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Date.now().toString(36).slice(-3)}`;
        next.customFields = [
          ...(next.customFields || []),
          {
            id: `cf-${Date.now()}`,
            key,
            label: newField.label.trim(),
            type: newField.type,
            required: newField.required,
            section: newField.section,
            options: newField.optionsText ? newField.optionsText.split(',').map((s) => s.trim()).filter(Boolean) : [],
          },
        ];
      }
      if (newWorkflow.name.trim()) {
        next.workflowRules = [
          ...(next.workflowRules || []),
          {
            id: `wf-${Date.now()}`,
            name: newWorkflow.name.trim(),
            module: newWorkflow.module || 'Leads',
            trigger: newWorkflow.trigger,
            action: newWorkflow.action || 'Assign Owner & Create Follow-up Task',
            active: true,
          },
        ];
      }
      return next;
    });
    setNewStatus('');
    setNewTag('');
    setNewSource('');
    setNewCategory('');
    setNewColLabel('');
    setNewField({ label: '', type: 'text', required: false, section: 'Lead Information', optionsText: '' });
    setNewWorkflow({ name: '', module: 'Leads', trigger: 'On Lead Creation', action: 'Assign Owner & Create Follow-up Task' });
    notifyUser('Zoho CRM Setup settings saved', 'success');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Zoho CRM Setup — Module, Fields, Columns & Workflow Customization"
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          {confirmResetOpen ? (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg text-[12.5px]">
              <AlertTriangle size={14} className="text-rose-600 shrink-0" />
              <span className="text-rose-800 font-medium">Restore all settings to defaults?</span>
              <button
                type="button"
                onClick={() => {
                  resetConfig();
                  setConfirmResetOpen(false);
                  notifyUser('Customization restored to Zoho CRM defaults', 'info');
                }}
                className="px-2.5 py-1 rounded bg-rose-600 text-white text-[12px] font-semibold hover:bg-rose-700"
              >
                Confirm Reset
              </button>
              <button
                type="button"
                onClick={() => setConfirmResetOpen(false)}
                className="px-2 py-1 rounded border border-rose-200 bg-white text-slate-600 text-[12px] hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmResetOpen(true)}
              className="btn-secondary !h-9 text-[13px]"
            >
              <RotateCcw size={14} /> Reset Defaults
            </button>
          )}
          <div className="flex items-center gap-2">
            <button type="button" className="btn-secondary !h-9 text-[13px]" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn-primary !h-9 text-[13px]" onClick={handleSaveAndClose}>
              <Check size={14} /> Save & Close
            </button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col md:flex-row gap-4 min-h-[490px] text-[13px]">
        {/* Left Navigation Tabs */}
        <div className="w-full md:w-56 shrink-0 border-r border-[#E3E8F2] pr-3 space-y-1">
          {[
            { id: 'columns', label: 'Columns & Ordering', icon: Columns3 },
            { id: 'fields', label: 'Custom Fields & Labels', icon: Sliders },
            { id: 'dropdowns', label: 'Dropdowns & Colors', icon: Palette },
            { id: 'layouts', label: 'Layouts', icon: Layers },
            { id: 'workflows', label: 'Workflow Rules', icon: Workflow },
            { id: 'permissions', label: 'Role-Based Permissions', icon: ShieldCheck },
          ].map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left font-medium transition ${
                  active ? 'bg-[#EAF2FF] text-[#2F55D4] font-semibold' : 'text-[#2A3350] hover:bg-[#F3F6FB]'
                }`}
              >
                <Icon size={15} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Tab Content */}
        <div className="flex-1 min-w-0 max-h-[65vh] overflow-y-auto thin-scroll pr-1">
          {/* ================================================================
              TAB 1: COLUMNS & ORDERING
          ================================================================ */}
          {activeTab === 'columns' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="font-semibold text-[14px] text-[#1F2A44]">Customize Table Columns</h4>
                  <p className="text-[12.5px] text-[#6B7696]">
                    Add, remove, show/hide, rename column header labels, adjust column widths, and reorder their display sequence.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#EEF2FF] text-[#2F55D4] text-[12px] font-semibold">
                  {orderedCols.filter((c) => (config.visibleColumnKeys || []).includes(c.key)).length} of {orderedCols.length} Visible
                </span>
              </div>

              {/* Add New Column Bar */}
              <form onSubmit={handleAddColumn} className="p-3 rounded-lg bg-[#F8FAFD] border border-[#E3E8F2] flex flex-wrap items-center gap-2.5">
                <input
                  type="text"
                  value={newColLabel}
                  onChange={(e) => setNewColLabel(e.target.value)}
                  placeholder="New column name (e.g. Deal Region, SLA Tier)..."
                  className="input !h-8 text-[12.5px] flex-1 min-w-[200px]"
                />
                <div className="flex items-center gap-1.5 text-[12px] text-[#4B5578]">
                  <span>Width (px):</span>
                  <input
                    type="number"
                    min={80}
                    max={420}
                    value={newColWidth}
                    onChange={(e) => setNewColWidth(e.target.value)}
                    className="input !h-8 !w-20 text-[12.5px]"
                  />
                </div>
                <button type="submit" className="btn-primary !h-8 text-[12.5px]">
                  <Plus size={14} /> Add Column
                </button>
              </form>

              <div className="border border-[#E3E8F2] rounded-lg divide-y divide-[#EEF1F7]">
                {orderedCols.map((col, idx) => {
                  const checked = (config.visibleColumnKeys || []).includes(col.key);
                  const customLabel = config.fieldLabels?.[col.key] ?? col.label;
                  const colWidth = config.columnWidths?.[col.key] ?? col.width ?? 150;
                  return (
                    <div key={col.key} className="flex items-center justify-between px-3.5 py-2 hover:bg-[#F8FAFC] gap-2.5 flex-wrap sm:flex-nowrap">
                      <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-[150px]">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleColumnVisibility(col.key)}
                          className="accent-[#2F55D4] h-4 w-4"
                        />
                        <span className="font-medium text-[#1F2A44] truncate">{col.label}</span>
                        {col.isCustom && (
                          <span className="text-[10.5px] px-1.5 py-0.5 rounded bg-[#EAF2FF] text-[#2F55D4] font-semibold">
                            Custom
                          </span>
                        )}
                      </label>

                      <input
                        type="text"
                        value={customLabel}
                        onChange={(e) =>
                          updateConfig({
                            fieldLabels: { ...(config.fieldLabels || {}), [col.key]: e.target.value },
                          })
                        }
                        placeholder="Custom column label"
                        className="h-7 px-2.5 rounded border border-[#D5DBE8] text-[12.5px] w-44 focus:outline-none focus:border-[#2F55D4]"
                      />

                      <div className="flex items-center gap-1 text-[11.5px] text-[#6B7696]" title="Column Width (px)">
                        <input
                          type="number"
                          min={80}
                          max={450}
                          value={colWidth}
                          onChange={(e) =>
                            updateConfig({
                              columnWidths: {
                                ...(config.columnWidths || {}),
                                [col.key]: Math.max(80, Number(e.target.value) || 140),
                              },
                            })
                          }
                          className="h-7 w-16 px-2 rounded border border-[#D5DBE8] text-[12px] text-[#1F2A44]"
                        />
                        <span>px</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveColumn(idx, -1)}
                          className="p-1 rounded border border-[#D5DBE8] hover:bg-white disabled:opacity-30"
                          title="Move column up"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          disabled={idx === orderedCols.length - 1}
                          onClick={() => moveColumn(idx, 1)}
                          className="p-1 rounded border border-[#D5DBE8] hover:bg-white disabled:opacity-30"
                          title="Move column down"
                        >
                          <ArrowDown size={13} />
                        </button>
                        <button
                          type="button"
                          disabled={col.key === 'leadName'}
                          onClick={() => handleRemoveColumn(col)}
                          className="p-1 rounded border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-25"
                          title="Remove column"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================================================================
              TAB 2: CUSTOM FIELDS & LABELS
          ================================================================ */}
          {activeTab === 'fields' && (
            <div className="space-y-5">
              <div>
                <h4 className="font-semibold text-[14px] text-[#1F2A44]">Create New Custom Field</h4>
                <p className="text-[12.5px] text-[#6B7696] mb-3">
                  Custom fields immediately appear in the Create/Edit Lead form, Lead Details Overview, and Reports.
                </p>

                <form onSubmit={handleAddCustomField} className="p-3.5 rounded-lg bg-[#F8FAFD] border border-[#E3E8F2] space-y-3">
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[12px] font-medium text-[#4B5578] mb-1">Field Label *</label>
                      <input
                        required
                        className="input !h-8 text-[13px]"
                        placeholder="e.g. GST Number"
                        value={newField.label}
                        onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#4B5578] mb-1">Field Type</label>
                      <select
                        className="input !h-8 text-[13px]"
                        value={newField.type}
                        onChange={(e) => setNewField({ ...newField, type: e.target.value })}
                      >
                        <option value="text">Text (Single Line)</option>
                        <option value="number">Number / Currency</option>
                        <option value="date">Date / Time</option>
                        <option value="picklist">Picklist (Dropdown)</option>
                        <option value="checkbox">Checkbox (Boolean)</option>
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#4B5578] mb-1">Form Section</label>
                      <select
                        className="input !h-8 text-[13px]"
                        value={newField.section}
                        onChange={(e) => setNewField({ ...newField, section: e.target.value })}
                      >
                        <option value="Lead Information">Lead Information</option>
                        <option value="Address Information">Address Information</option>
                        <option value="Description Information">Description Information</option>
                      </select>
                    </div>
                  </div>

                  {newField.type === 'picklist' && (
                    <div>
                      <label className="block text-[12px] font-medium text-[#4B5578] mb-1">
                        Dropdown Options (comma-separated)
                      </label>
                      <input
                        className="input !h-8 text-[13px]"
                        placeholder="e.g. Tier 1, Tier 2, Enterprise, Government"
                        value={newField.optionsText}
                        onChange={(e) => setNewField({ ...newField, optionsText: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-[#1F2A44] font-medium">
                      <input
                        type="checkbox"
                        checked={newField.required}
                        onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                        className="accent-[#2F55D4] h-4 w-4"
                      />
                      <span>Mark as Required Field</span>
                    </label>
                    <button type="submit" className="btn-primary !h-8 text-[12.5px]">
                      <Plus size={14} /> Add Custom Field
                    </button>
                  </div>
                </form>
              </div>

              <div>
                <h4 className="font-semibold text-[14px] text-[#1F2A44] mb-2">Configured Custom Fields (Click Edit to Modify)</h4>
                <div className="border border-[#E3E8F2] rounded-lg divide-y divide-[#EEF1F7]">
                  {(config.customFields || []).length === 0 ? (
                    <div className="p-4 text-center text-[#8B95AE]">No custom fields added yet.</div>
                  ) : (
                    (config.customFields || []).map((cf) => {
                      const isEditing = editingFieldId === cf.id;
                      if (isEditing) {
                        return (
                          <div key={cf.id} className="p-3 bg-[#F8FAFD] space-y-2.5">
                            <div className="grid sm:grid-cols-3 gap-2.5">
                              <input
                                type="text"
                                value={editFieldDraft.label}
                                onChange={(e) => setEditFieldDraft({ ...editFieldDraft, label: e.target.value })}
                                className="input !h-8 text-[12.5px]"
                                placeholder="Field Label"
                              />
                              <select
                                value={editFieldDraft.type}
                                onChange={(e) => setEditFieldDraft({ ...editFieldDraft, type: e.target.value })}
                                className="input !h-8 text-[12.5px]"
                              >
                                <option value="text">Text (Single Line)</option>
                                <option value="number">Number / Currency</option>
                                <option value="date">Date / Time</option>
                                <option value="picklist">Picklist (Dropdown)</option>
                                <option value="checkbox">Checkbox (Boolean)</option>
                              </select>
                              <select
                                value={editFieldDraft.section}
                                onChange={(e) => setEditFieldDraft({ ...editFieldDraft, section: e.target.value })}
                                className="input !h-8 text-[12.5px]"
                              >
                                <option value="Lead Information">Lead Information</option>
                                <option value="Address Information">Address Information</option>
                                <option value="Description Information">Description Information</option>
                              </select>
                            </div>
                            {editFieldDraft.type === 'picklist' && (
                              <input
                                type="text"
                                value={editFieldDraft.optionsText}
                                onChange={(e) => setEditFieldDraft({ ...editFieldDraft, optionsText: e.target.value })}
                                placeholder="Comma-separated options"
                                className="input !h-8 text-[12.5px] w-full"
                              />
                            )}
                            <div className="flex items-center justify-between">
                              <label className="flex items-center gap-2 text-[12px] font-medium text-[#1F2A44] cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={editFieldDraft.required}
                                  onChange={(e) => setEditFieldDraft({ ...editFieldDraft, required: e.target.checked })}
                                  className="accent-[#2F55D4]"
                                />
                                <span>Required Field</span>
                              </label>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setEditingFieldId(null)}
                                  className="px-2.5 py-1 rounded border border-[#D5DBE8] bg-white text-[12px]"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => saveEditCustomField(cf.id)}
                                  className="px-3 py-1 rounded bg-[#2F55D4] text-white text-[12px] font-medium"
                                >
                                  Save Field
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div key={cf.id} className="flex items-center justify-between px-3.5 py-2.5">
                          <div>
                            <span className="font-semibold text-[#1F2A44]">{cf.label}</span>
                            <span className="ml-2 text-[11.5px] px-2 py-0.5 rounded bg-[#F1F5F9] text-[#475569]">
                              {cf.type.toUpperCase()} • {cf.section}
                            </span>
                            {cf.required && (
                              <span className="ml-1.5 text-[11px] px-2 py-0.5 rounded bg-rose-50 text-rose-600 font-semibold">
                                Required
                              </span>
                            )}
                            {Array.isArray(cf.options) && cf.options.length > 0 && (
                              <span className="ml-2 text-[11px] text-[#6B7696]">
                                Options: {cf.options.join(', ')}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => startEditCustomField(cf)}
                              className="text-[#2F55D4] hover:bg-[#EAF2FF] p-1.5 rounded"
                              title="Edit custom field"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomField(cf.id)}
                              className="text-rose-600 hover:bg-rose-50 p-1.5 rounded"
                              title="Delete custom field"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-[14px] text-[#1F2A44] mb-2">Standard Fields — Required & Label Customization</h4>
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {[
                    ['firstName', 'First Name'],
                    ['lastName', 'Last Name'],
                    ['company', 'Company'],
                    ['mobile', 'Mobile'],
                    ['email', 'Email'],
                    ['city', 'City'],
                    ['leadSource', 'Lead Source'],
                    ['category', 'Category'],
                    ['remarks', 'Remarks'],
                  ].map(([k, lbl]) => {
                    const isReq = (config.requiredFields || []).includes(k);
                    const customLbl = config.fieldLabels?.[k] ?? lbl;
                    return (
                      <div key={k} className="flex items-center justify-between gap-2 p-2 rounded border border-[#E3E8F2] bg-white">
                        <label className="flex items-center gap-2 cursor-pointer text-[12.5px] font-medium text-[#1F2A44]">
                          <input
                            type="checkbox"
                            checked={isReq}
                            onChange={() => {
                              const set = new Set(config.requiredFields || []);
                              if (set.has(k)) set.delete(k);
                              else set.add(k);
                              updateConfig({ requiredFields: [...set] });
                            }}
                            className="accent-[#2F55D4]"
                          />
                          <span>Required</span>
                        </label>
                        <input
                          type="text"
                          value={customLbl}
                          onChange={(e) =>
                            updateConfig({
                              fieldLabels: { ...(config.fieldLabels || {}), [k]: e.target.value },
                            })
                          }
                          className="h-7 px-2 rounded border border-[#D5DBE8] text-[12.5px] flex-1 max-w-[180px]"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              TAB 3: DROPDOWNS & COLORS
          ================================================================ */}
          {activeTab === 'dropdowns' && (
            <div className="space-y-6">
              {/* 1. Lead Statuses & Colors */}
              <div>
                <h4 className="font-semibold text-[14px] text-[#1F2A44] mb-2">Lead Status Values & Badge Colors</h4>
                <div className="flex gap-2 mb-2.5 items-center">
                  <input
                    className="input !h-8 text-[13px] flex-1"
                    placeholder="Add new Lead Status (e.g. Demo Scheduled)..."
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddStatusOption();
                      }
                    }}
                  />
                  <input
                    type="color"
                    value={newStatusColor}
                    onChange={(e) => setNewStatusColor(e.target.value)}
                    className="h-8 w-10 cursor-pointer rounded border border-[#D5DBE8] bg-white p-0.5"
                    title="Pick status color"
                  />
                  <button
                    type="button"
                    onClick={handleAddStatusOption}
                    className="btn-primary !h-8 text-[12.5px]"
                  >
                    <Plus size={14} /> Add Status
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {(config.customStatuses || LEAD_STATUSES).map((st) => {
                    const isEditing = editingStatus?.original === st;
                    const colorVal = config.statusColors?.[st] || '#2F7BF5';
                    return (
                      <div key={st} className="flex items-center justify-between px-3 py-1.5 rounded border border-[#E3E8F2] bg-white gap-2">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5 flex-1">
                            <input
                              type="text"
                              autoFocus
                              value={editingStatus.value}
                              onChange={(e) => setEditingStatus({ ...editingStatus, value: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameStatus(st, editingStatus.value);
                                if (e.key === 'Escape') setEditingStatus(null);
                              }}
                              className="h-7 px-2 rounded border border-[#2F55D4] text-[12px] flex-1"
                            />
                            <button
                              type="button"
                              onClick={() => handleRenameStatus(st, editingStatus.value)}
                              className="p-1 rounded bg-[#2F55D4] text-white"
                              title="Save"
                            >
                              <Check size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingStatus(null)}
                              className="p-1 rounded border border-[#D5DBE8] text-[#64748B]"
                              title="Cancel"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <span
                            className="px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold text-white truncate"
                            style={{ backgroundColor: colorVal }}
                          >
                            {st}
                          </span>
                        )}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <input
                            type="color"
                            value={colorVal}
                            onChange={(e) =>
                              updateConfig({
                                statusColors: { ...(config.statusColors || {}), [st]: e.target.value },
                              })
                            }
                            className="h-6 w-7 cursor-pointer border-0 bg-transparent"
                            title="Pick status badge color"
                          />
                          <button
                            type="button"
                            onClick={() => setEditingStatus({ original: st, value: st })}
                            className="p-1 rounded text-[#4B5578] hover:text-[#2F55D4] hover:bg-[#F1F5F9]"
                            title="Edit status label"
                          >
                            <Pencil size={12.5} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteStatus(st)}
                            className="p-1 rounded text-rose-500 hover:bg-rose-50"
                            title="Delete status"
                          >
                            <Trash2 size={12.5} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Tags & Colors */}
              <div>
                <h4 className="font-semibold text-[14px] text-[#1F2A44] mb-2">Tags & Tag Colors</h4>
                <div className="flex gap-2 mb-2.5 items-center">
                  <input
                    className="input !h-8 text-[13px] flex-1"
                    placeholder="Add new Tag (e.g. VIP Client)..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTagOption();
                      }
                    }}
                  />
                  <input
                    type="color"
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    className="h-8 w-10 cursor-pointer rounded border border-[#D5DBE8] bg-white p-0.5"
                    title="Pick tag color"
                  />
                  <button
                    type="button"
                    onClick={handleAddTagOption}
                    className="btn-primary !h-8 text-[12.5px]"
                  >
                    <Plus size={14} /> Add Tag
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {(config.customTags || LEAD_TAGS).map((tg) => {
                    const isEditing = editingTag?.original === tg;
                    const colorVal = config.tagColors?.[tg] || '#64748B';
                    return (
                      <div key={tg} className="flex items-center justify-between px-3 py-1.5 rounded border border-[#E3E8F2] bg-white gap-2">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5 flex-1">
                            <input
                              type="text"
                              autoFocus
                              value={editingTag.value}
                              onChange={(e) => setEditingTag({ ...editingTag, value: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameTag(tg, editingTag.value);
                                if (e.key === 'Escape') setEditingTag(null);
                              }}
                              className="h-7 px-2 rounded border border-[#2F55D4] text-[12px] flex-1"
                            />
                            <button
                              type="button"
                              onClick={() => handleRenameTag(tg, editingTag.value)}
                              className="p-1 rounded bg-[#2F55D4] text-white"
                            >
                              <Check size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingTag(null)}
                              className="p-1 rounded border border-[#D5DBE8] text-[#64748B]"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <span
                            className="px-2.5 py-0.5 rounded text-[11.5px] font-semibold text-white truncate"
                            style={{ backgroundColor: colorVal }}
                          >
                            {tg}
                          </span>
                        )}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <input
                            type="color"
                            value={colorVal}
                            onChange={(e) =>
                              updateConfig({
                                tagColors: { ...(config.tagColors || {}), [tg]: e.target.value },
                              })
                            }
                            className="h-6 w-7 cursor-pointer border-0 bg-transparent"
                            title="Pick tag color"
                          />
                          <button
                            type="button"
                            onClick={() => setEditingTag({ original: tg, value: tg })}
                            className="p-1 rounded text-[#4B5578] hover:text-[#2F55D4] hover:bg-[#F1F5F9]"
                            title="Edit tag label"
                          >
                            <Pencil size={12.5} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTag(tg)}
                            className="p-1 rounded text-rose-500 hover:bg-rose-50"
                            title="Delete tag"
                          >
                            <Trash2 size={12.5} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Lead Sources & Categories */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-[13.5px] text-[#1F2A44] mb-1.5">Lead Sources</h4>
                  <div className="flex gap-1.5 mb-2 items-center">
                    <input
                      className="input !h-8 text-[12.5px] flex-1"
                      placeholder="New source..."
                      value={newSource}
                      onChange={(e) => setNewSource(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSourceOption();
                        }
                      }}
                    />
                    <input
                      type="color"
                      value={newSourceColor}
                      onChange={(e) => setNewSourceColor(e.target.value)}
                      className="h-8 w-8 cursor-pointer rounded border border-[#D5DBE8] bg-white p-0.5 shrink-0"
                    />
                    <button
                      type="button"
                      onClick={handleAddSourceOption}
                      className="btn-primary !h-8 !px-3"
                    >
                      Add
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {(config.customSources || LEAD_SOURCES).map((s) => {
                      const isEditing = editingSource?.original === s;
                      const col = config.sourceColors?.[s] || '#2563EB';
                      return (
                        <div key={s} className="flex items-center justify-between px-2.5 py-1 rounded border border-[#E3E8F2] bg-white text-[12px]">
                          {isEditing ? (
                            <div className="flex items-center gap-1 flex-1">
                              <input
                                type="text"
                                autoFocus
                                value={editingSource.value}
                                onChange={(e) => setEditingSource({ ...editingSource, value: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleRenameSource(s, editingSource.value);
                                }}
                                className="h-6 px-1.5 border border-[#2F55D4] rounded text-[12px] flex-1"
                              />
                              <button type="button" onClick={() => handleRenameSource(s, editingSource.value)} className="text-[#2F55D4]"><Check size={13} /></button>
                              <button type="button" onClick={() => setEditingSource(null)} className="text-slate-400"><X size={13} /></button>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 font-medium text-[#1F2A44] truncate">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: col }} />
                              {s}
                            </span>
                          )}
                          <div className="flex items-center gap-1">
                            <input
                              type="color"
                              value={col}
                              onChange={(e) =>
                                updateConfig({
                                  sourceColors: { ...(config.sourceColors || {}), [s]: e.target.value },
                                })
                              }
                              className="h-5 w-6 cursor-pointer border-0 bg-transparent"
                            />
                            <button type="button" onClick={() => setEditingSource({ original: s, value: s })} className="p-0.5 text-[#4B5578] hover:text-[#2F55D4]"><Pencil size={12} /></button>
                            <button type="button" onClick={() => handleDeleteSource(s)} className="p-0.5 text-rose-500 hover:text-rose-700"><Trash2 size={12} /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-[13.5px] text-[#1F2A44] mb-1.5">Categories</h4>
                  <div className="flex gap-1.5 mb-2 items-center">
                    <input
                      className="input !h-8 text-[12.5px] flex-1"
                      placeholder="New category..."
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCategoryOption();
                        }
                      }}
                    />
                    <input
                      type="color"
                      value={newCategoryColor}
                      onChange={(e) => setNewCategoryColor(e.target.value)}
                      className="h-8 w-8 cursor-pointer rounded border border-[#D5DBE8] bg-white p-0.5 shrink-0"
                    />
                    <button
                      type="button"
                      onClick={handleAddCategoryOption}
                      className="btn-primary !h-8 !px-3"
                    >
                      Add
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {(config.customCategories || []).map((c) => {
                      const isEditing = editingCategory?.original === c;
                      const col = config.categoryColors?.[c] || '#0D9488';
                      return (
                        <div key={c} className="flex items-center justify-between px-2.5 py-1 rounded border border-[#E3E8F2] bg-white text-[12px]">
                          {isEditing ? (
                            <div className="flex items-center gap-1 flex-1">
                              <input
                                type="text"
                                autoFocus
                                value={editingCategory.value}
                                onChange={(e) => setEditingCategory({ ...editingCategory, value: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleRenameCategory(c, editingCategory.value);
                                }}
                                className="h-6 px-1.5 border border-[#2F55D4] rounded text-[12px] flex-1"
                              />
                              <button type="button" onClick={() => handleRenameCategory(c, editingCategory.value)} className="text-[#2F55D4]"><Check size={13} /></button>
                              <button type="button" onClick={() => setEditingCategory(null)} className="text-slate-400"><X size={13} /></button>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 font-medium text-[#1F2A44] truncate">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: col }} />
                              {c}
                            </span>
                          )}
                          <div className="flex items-center gap-1">
                            <input
                              type="color"
                              value={col}
                              onChange={(e) =>
                                updateConfig({
                                  categoryColors: { ...(config.categoryColors || {}), [c]: e.target.value },
                                })
                              }
                              className="h-5 w-6 cursor-pointer border-0 bg-transparent"
                            />
                            <button type="button" onClick={() => setEditingCategory({ original: c, value: c })} className="p-0.5 text-[#4B5578] hover:text-[#2F55D4]"><Pencil size={12} /></button>
                            <button type="button" onClick={() => handleDeleteCategory(c)} className="p-0.5 text-rose-500 hover:text-rose-700"><Trash2 size={12} /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              TAB 4: LAYOUTS
          ================================================================ */}
          {activeTab === 'layouts' && (
            <div className="space-y-5">
              <div>
                <h4 className="font-semibold text-[14px] text-[#1F2A44] mb-1">Create & Manage Page Layouts</h4>
                <p className="text-[12.5px] text-[#6B7696] mb-3">
                  Create custom layouts, edit existing layouts, and select the active layout for record forms and detail pages.
                </p>

                {/* Create Layout Form */}
                <form onSubmit={handleCreateLayout} className="p-3.5 rounded-lg bg-[#F8FAFD] border border-[#E3E8F2] space-y-2.5 mb-4">
                  <div className="grid sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11.5px] font-semibold text-[#4B5578] mb-1">Layout Name *</label>
                      <input
                        type="text"
                        required
                        value={newLayoutForm.name}
                        onChange={(e) => setNewLayoutForm({ ...newLayoutForm, name: e.target.value })}
                        placeholder="e.g. Inside Sales Call Layout"
                        className="input !h-8 text-[12.5px] w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-semibold text-[#4B5578] mb-1">Description</label>
                      <input
                        type="text"
                        value={newLayoutForm.description}
                        onChange={(e) => setNewLayoutForm({ ...newLayoutForm, description: e.target.value })}
                        placeholder="Layout purpose & sections..."
                        className="input !h-8 text-[12.5px] w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-semibold text-[#4B5578] mb-1">Column Structure</label>
                      <div className="flex items-center gap-2">
                        <select
                          value={newLayoutForm.columns}
                          onChange={(e) => setNewLayoutForm({ ...newLayoutForm, columns: Number(e.target.value) })}
                          className="input !h-8 text-[12.5px] flex-1"
                        >
                          <option value={2}>2-Column Zoho Grid</option>
                          <option value={1}>1-Column Compact Stack</option>
                        </select>
                        <button type="submit" className="btn-primary !h-8 text-[12.5px] shrink-0">
                          <Plus size={14} /> Add Layout
                        </button>
                      </div>
                    </div>
                  </div>
                </form>

                {/* Layouts Cards Grid */}
                <div className="grid sm:grid-cols-3 gap-3">
                  {layoutsList.map((lyt) => {
                    const isSelected = config.formLayout === lyt.name;
                    const isEditing = editingLayoutId === lyt.id;
                    if (isEditing) {
                      return (
                        <div key={lyt.id} className="p-3 rounded-lg border border-[#2F55D4] bg-[#F8FAFD] space-y-2">
                          <input
                            type="text"
                            value={editLayoutDraft.name}
                            onChange={(e) => setEditLayoutDraft({ ...editLayoutDraft, name: e.target.value })}
                            className="input !h-7 text-[12.5px] w-full"
                          />
                          <input
                            type="text"
                            value={editLayoutDraft.description}
                            onChange={(e) => setEditLayoutDraft({ ...editLayoutDraft, description: e.target.value })}
                            className="input !h-7 text-[12px] w-full"
                          />
                          <div className="flex justify-end gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingLayoutId(null)}
                              className="px-2 py-1 text-[11.5px] border border-[#D5DBE8] rounded bg-white"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => saveEditLayout(lyt)}
                              className="px-2.5 py-1 text-[11.5px] bg-[#2F55D4] text-white rounded font-medium"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={lyt.id}
                        onClick={() => {
                          updateConfig({ formLayout: lyt.name });
                          notifyUser(`Active layout switched to "${lyt.name}"`, 'info');
                        }}
                        className={`p-3.5 rounded-lg border text-left cursor-pointer transition relative group ${
                          isSelected
                            ? 'border-[#2F55D4] bg-[#EAF2FF]/60 font-semibold text-[#2F55D4]'
                            : 'border-[#E3E8F2] hover:bg-[#F8FAFC] text-[#1F2A44]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span>{lyt.name}</span>
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => startEditLayout(lyt)}
                              className="p-1 rounded hover:bg-white text-[#4B5578] hover:text-[#2F55D4]"
                              title="Edit layout"
                            >
                              <Pencil size={12.5} />
                            </button>
                            {layoutsList.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleDeleteLayout(lyt)}
                                className="p-1 rounded hover:bg-rose-50 text-rose-500"
                                title="Delete layout"
                              >
                                <Trash2 size={12.5} />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="text-[11.5px] text-[#6B7696] font-normal mt-1">
                          {lyt.description}
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px]">
                          <span className="px-2 py-0.5 rounded bg-white border border-[#D5DBE8] text-[#4B5578]">
                            {lyt.columns || 2} Columns
                          </span>
                          {isSelected && <span className="text-[#2F55D4] font-semibold">✓ Active</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <div>
                    <h4 className="font-semibold text-[14px] text-[#1F2A44]">Customize Business Card Fields (Record Detail Top Summary)</h4>
                    <p className="text-[12.5px] text-[#6B7696]">
                      Choose which fields are highlighted in the top Business Card box on the Record Details page.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={newBusinessCardField}
                      onChange={(e) => setNewBusinessCardField(e.target.value)}
                      placeholder="Add field to card..."
                      className="input !h-7 text-[12px] w-40"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const v = newBusinessCardField.trim();
                        if (!v) return;
                        updateConfig({
                          businessCardFields: [...new Set([...(config.businessCardFields || []), v])],
                        });
                        setNewBusinessCardField('');
                        notifyUser(`Added "${v}" to Business Card`);
                      }}
                      className="btn-primary !h-7 !px-2.5 text-[12px]"
                    >
                      <Plus size={12} /> Add
                    </button>
                  </div>
                </div>
                <div className="grid sm:grid-cols-3 gap-2">
                  {[
                    ...new Set([
                      'Mobile', 'Lead Status', 'City', 'Lead Aging', 'Category',
                      'Lead Owner', 'Lead Source', 'Email', 'Company', 'Product Name',
                      'Lead CEO Approval', 'Performance', 'Call Start Time',
                      ...(config.businessCardFields || []),
                    ]),
                  ].map((fld) => {
                    const active = (config.businessCardFields || []).includes(fld);
                    return (
                      <label key={fld} className="flex items-center gap-2 p-2 rounded border border-[#E3E8F2] cursor-pointer hover:bg-[#F8FAFC]">
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={() => {
                            const cur = config.businessCardFields || [];
                            const next = cur.includes(fld) ? cur.filter((x) => x !== fld) : [...cur, fld];
                            updateConfig({ businessCardFields: next });
                          }}
                          className="accent-[#2F55D4]"
                        />
                        <span className="truncate">{fld}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              TAB 5: WORKFLOW RULES
          ================================================================ */}
          {activeTab === 'workflows' && (
            <div className="space-y-5">
              <div>
                <h4 className="font-semibold text-[14px] text-[#1F2A44] mb-1">Automated Workflow Rules</h4>
                <p className="text-[12.5px] text-[#6B7696] mb-3">
                  Configure automated Zoho CRM rules for Lead assignment, tagging, follow-up task creation, and Deal approval routing.
                </p>

                <div className="p-3.5 rounded-lg bg-[#F8FAFD] border border-[#E3E8F2] space-y-3 mb-4">
                  <div className="grid sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-[11.5px] font-semibold text-[#4B5578] mb-1">Rule Name *</label>
                      <input
                        className="input !h-8 text-[12.5px] w-full"
                        placeholder="e.g. Auto-Assign Delhi Leads"
                        value={newWorkflow.name}
                        onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-semibold text-[#4B5578] mb-1">Module</label>
                      <select
                        className="input !h-8 text-[12.5px] w-full"
                        value={newWorkflow.module || 'Leads'}
                        onChange={(e) => setNewWorkflow({ ...newWorkflow, module: e.target.value })}
                      >
                        <option value="Leads">Leads</option>
                        <option value="Deals">Deals</option>
                        <option value="Calls">Calls</option>
                        <option value="Contacts">Contacts</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-semibold text-[#4B5578] mb-1">Trigger Condition</label>
                      <select
                        className="input !h-8 text-[12.5px] w-full"
                        value={newWorkflow.trigger}
                        onChange={(e) => setNewWorkflow({ ...newWorkflow, trigger: e.target.value })}
                      >
                        <option value="On Lead Creation">On Lead Creation</option>
                        <option value="On Lead Creation (City = Chennai)">On Lead Creation (City = Chennai)</option>
                        <option value="On Lead Creation (Source = Website)">On Lead Creation (Source = Website)</option>
                        <option value="When Visitor Score >= 80">When Visitor Score &gt;= 80</option>
                        <option value="On Lead Qualification / Conversion">On Lead Qualification / Conversion</option>
                        <option value="When Deal Amount > ₹ 5,00,000">When Deal Amount &gt; ₹ 5,00,000</option>
                        <option value="When Call Status = Missed">When Call Status = Missed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-semibold text-[#4B5578] mb-1">Instant Action</label>
                      <select
                        className="input !h-8 text-[12.5px] w-full"
                        value={newWorkflow.action || 'Assign Owner & Create Follow-up Task'}
                        onChange={(e) => setNewWorkflow({ ...newWorkflow, action: e.target.value })}
                      >
                        <option value="Assign Owner & Create Follow-up Task">Assign Owner & Create Follow-up Task</option>
                        <option value="Set Tag = followup">Set Tag = followup</option>
                        <option value="Queue Welcome Message & Call Follow-up">Queue Welcome Message & Call Follow-up</option>
                        <option value="Flag Deal Approval = Pending">Flag Deal Approval = Pending</option>
                        <option value="Schedule Callback Task in Workqueue">Schedule Callback Task in Workqueue</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddWorkflowRule}
                      className="btn-primary !h-8 text-[12.5px]"
                    >
                      <Plus size={14} /> Add Workflow Rule
                    </button>
                  </div>
                </div>

                <div className="border border-[#E3E8F2] rounded-lg divide-y divide-[#EEF1F7]">
                  {(config.workflowRules || []).map((wf) => {
                    const isEditing = editingWorkflowId === wf.id;
                    if (isEditing) {
                      return (
                        <div key={wf.id} className="p-3 bg-[#F8FAFD] space-y-2.5">
                          <div className="grid sm:grid-cols-3 gap-2">
                            <input
                              type="text"
                              value={editWorkflowDraft.name}
                              onChange={(e) => setEditWorkflowDraft({ ...editWorkflowDraft, name: e.target.value })}
                              className="input !h-8 text-[12.5px]"
                              placeholder="Rule Name"
                            />
                            <input
                              type="text"
                              value={editWorkflowDraft.trigger}
                              onChange={(e) => setEditWorkflowDraft({ ...editWorkflowDraft, trigger: e.target.value })}
                              className="input !h-8 text-[12.5px]"
                              placeholder="Trigger Condition"
                            />
                            <input
                              type="text"
                              value={editWorkflowDraft.action}
                              onChange={(e) => setEditWorkflowDraft({ ...editWorkflowDraft, action: e.target.value })}
                              className="input !h-8 text-[12.5px]"
                              placeholder="Action"
                            />
                          </div>
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingWorkflowId(null)}
                              className="px-2.5 py-1 rounded border border-[#D5DBE8] bg-white text-[12px]"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => saveEditWorkflow(wf.id)}
                              className="px-3 py-1 rounded bg-[#2F55D4] text-white text-[12px] font-medium"
                            >
                              Save Rule
                            </button>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={wf.id} className="flex items-center justify-between px-3.5 py-2.5 gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#1F2A44]">{wf.name}</span>
                            <span className="px-1.5 py-0.5 rounded bg-[#EEF2FF] text-[#2F55D4] text-[10.5px] font-semibold">
                              {wf.module || 'Leads'}
                            </span>
                          </div>
                          <div className="text-[12px] text-[#6B7696]">
                            Trigger: <span className="font-medium text-[#334155]">{wf.trigger}</span>
                            {wf.action ? (
                              <>
                                {' '}• Action: <span className="font-medium text-[#2F55D4]">{wf.action}</span>
                              </>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0">
                          <label className="inline-flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={wf.active}
                              onChange={() =>
                                updateConfig({
                                  workflowRules: (config.workflowRules || []).map((r) =>
                                    r.id === wf.id ? { ...r, active: !r.active } : r
                                  ),
                                })
                              }
                              className="accent-[#2F55D4] h-4 w-4"
                            />
                            <span className={`text-[12px] font-semibold ${wf.active ? 'text-emerald-600' : 'text-slate-400'}`}>
                              {wf.active ? 'Active' : 'Paused'}
                            </span>
                          </label>
                          <button
                            type="button"
                            onClick={() => startEditWorkflow(wf)}
                            className="p-1.5 rounded text-[#2F55D4] hover:bg-[#EAF2FF]"
                            title="Edit workflow rule"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              updateConfig({
                                workflowRules: (config.workflowRules || []).filter((r) => r.id !== wf.id),
                              });
                              notifyUser('Workflow rule deleted', 'info');
                            }}
                            className="p-1.5 rounded text-rose-500 hover:bg-rose-50"
                            title="Delete workflow rule"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              TAB 6: ROLE-BASED PERMISSIONS
          ================================================================ */}
          {activeTab === 'permissions' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-[14px] text-[#1F2A44]">Role-Based Access & Permissions</h4>
                  <p className="text-[12.5px] text-[#6B7696]">
                    Permissions are enforced both in UI controls and inside the CRM state/data layer.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[12.5px] bg-[#F8FAFD] px-3 py-1.5 rounded-lg border border-[#E3E8F2]">
                  <span className="text-[#4B5578] font-medium">Active Role:</span>
                  <select
                    value={config.activeRole || 'Administrator'}
                    onChange={(e) => {
                      updateConfig({ activeRole: e.target.value });
                      notifyUser(`Switched active CRM role to ${e.target.value}`, 'info');
                    }}
                    className="h-7 px-2 rounded border border-[#D5DBE8] bg-white font-semibold text-[#2F55D4]"
                  >
                    {Object.keys(config.rolePermissions || {}).map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Add Custom Role */}
              <form onSubmit={handleAddRole} className="p-3 rounded-lg bg-[#F8FAFD] border border-[#E3E8F2] flex items-center gap-2">
                <input
                  type="text"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="Add new CRM Role (e.g. Inside Sales, Regional Manager)..."
                  className="input !h-8 text-[12.5px] flex-1"
                />
                <button type="submit" className="btn-primary !h-8 text-[12.5px]">
                  <Plus size={14} /> Add Role
                </button>
              </form>

              <div className="overflow-x-auto border border-[#E3E8F2] rounded-lg">
                <table className="w-full text-[12.5px]">
                  <thead className="bg-[#F8FAFD] border-b border-[#E3E8F2]">
                    <tr>
                      <th className="p-2.5 text-left font-semibold text-[#1F2A44]">Role</th>
                      <th className="p-2.5 text-center font-semibold text-[#1F2A44]">Create</th>
                      <th className="p-2.5 text-center font-semibold text-[#1F2A44]">Edit</th>
                      <th className="p-2.5 text-center font-semibold text-[#1F2A44]">Import</th>
                      <th className="p-2.5 text-center font-semibold text-[#1F2A44]">Bulk Import</th>
                      <th className="p-2.5 text-center font-semibold text-[#1F2A44]">Export</th>
                      <th className="p-2.5 text-center font-semibold text-[#1F2A44]">Convert Lead</th>
                      <th className="p-2.5 text-center font-semibold text-[#1F2A44]">Approve Deals</th>
                      <th className="p-2.5 text-center font-semibold text-[#1F2A44]">Delete</th>
                      <th className="p-2.5 text-center font-semibold text-[#1F2A44]">Customize CRM</th>
                      <th className="p-2.5 text-center font-semibold text-[#1F2A44]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF1F7]">
                    {Object.entries(config.rolePermissions || {}).map(([roleName, perms]) => (
                      <tr key={roleName} className={config.activeRole === roleName ? 'bg-[#F5F9FF]' : ''}>
                        <td className="p-2.5 font-semibold text-[#1F2A44] whitespace-nowrap">
                          {roleName}
                          {config.activeRole === roleName && (
                            <span className="ml-2 px-1.5 py-0.5 rounded bg-[#EAF2FF] text-[#2F55D4] text-[10.5px]">
                              Current
                            </span>
                          )}
                        </td>
                        {[
                          'canCreate',
                          'canEdit',
                          'canImport',
                          'canBulkImport',
                          'canExport',
                          'canConvert',
                          'canApproveDeals',
                          'canDelete',
                          'canCustomize',
                        ].map((pKey) => (
                          <td key={pKey} className="p-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={perms[pKey] !== false}
                              onChange={(e) =>
                                updateConfig({
                                  rolePermissions: {
                                    ...config.rolePermissions,
                                    [roleName]: { ...perms, [pKey]: e.target.checked },
                                  },
                                })
                              }
                              className="accent-[#2F55D4] h-4 w-4 cursor-pointer"
                            />
                          </td>
                        ))}
                        <td className="p-2.5 text-center">
                          {roleName !== 'Administrator' ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteRole(roleName)}
                              className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                              title="Delete role"
                            >
                              <Trash2 size={13} />
                            </button>
                          ) : (
                            <span className="text-[11px] text-[#94A3B8]">System</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
