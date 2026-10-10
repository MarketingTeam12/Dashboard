import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, LayoutList, ListPlus, Plus, Trash2 } from 'lucide-react';
import Modal from '../../../components/common/Modal';
import { FIELD_TYPES, MODULE_DEFS, PAGE_SIZES, uid } from '../homeConfig';

const MODULE_KEYS = Object.keys(MODULE_DEFS);
const blankField = () => ({ id: uid('fld'), label: '', type: 'text', required: false, options: [] });

function initialFor(component) {
  if (component?.kind === 'list') {
    return { kind: 'list', title: component.title, module: component.module, criteria: component.criteria, columns: component.columns, pageSize: component.pageSize, size: component.size };
  }
  if (component?.kind === 'custom') {
    return { kind: 'custom', title: component.title, fields: component.fields.map((f) => ({ ...f, options: [...(f.options || [])] })), pageSize: component.pageSize, size: component.size };
  }
  return null;
}

/**
 * Add Component (component = null) or Edit Component (component = existing).
 * onSave(partialComponent) — the caller adds/updates it.
 */
export default function ComponentEditorModal({ open, onClose, component, onSave }) {
  const editing = !!component;
  const [kind, setKind] = useState(null);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    const init = initialFor(component);
    setKind(init?.kind || null);
    setForm(init);
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const choose = (k) => {
    setKind(k);
    setErrors({});
    if (k === 'list') {
      const def = MODULE_DEFS.tasks;
      setForm({ kind: 'list', title: '', module: 'tasks', criteria: def.criteria[0].id, columns: def.columns.slice(0, 5).map((c) => c.key), pageSize: 10, size: 'half' });
    } else {
      setForm({ kind: 'custom', title: '', fields: [{ ...blankField(), label: 'Name', required: true }], pageSize: 10, size: 'half' });
    }
  };

  const set = (patch) => { setForm((f) => ({ ...f, ...patch })); setErrors({}); };
  const setModule = (m) => {
    const def = MODULE_DEFS[m];
    set({ module: m, criteria: def.criteria[0].id, columns: def.columns.slice(0, Math.min(5, def.columns.length)).map((c) => c.key) });
  };
  const toggleCol = (k) => set({ columns: form.columns.includes(k) ? form.columns.filter((c) => c !== k) : [...form.columns, k] });

  const setField = (id, patch) => { setForm((f) => ({ ...f, fields: f.fields.map((x) => (x.id === id ? { ...x, ...patch } : x)) })); setErrors({}); };
  const moveField = (i, d) => setForm((f) => {
    const j = i + d;
    if (j < 0 || j >= f.fields.length) return f;
    const n = [...f.fields];
    [n[i], n[j]] = [n[j], n[i]];
    return { ...f, fields: n };
  });

  const validate = () => {
    const e = {};
    const title = (form.title || '').trim();
    if (!title) e.title = 'Component name is required.';
    else if (title.length > 50) e.title = 'Use 50 characters or fewer.';
    if (form.kind === 'list') {
      if (!form.columns.length) e.columns = 'Select at least one column.';
    } else {
      if (!form.fields.length) e.fields = 'Add at least one field.';
      const seen = new Set();
      form.fields.forEach((f) => {
        const label = f.label.trim();
        if (!label) e[`f_${f.id}`] = 'Field label is required.';
        else if (seen.has(label.toLowerCase())) e[`f_${f.id}`] = 'Field labels must be unique.';
        seen.add(label.toLowerCase());
        if (f.type === 'select') {
          const opts = f.options.map((o) => o.trim()).filter(Boolean);
          if (!opts.length) e[`o_${f.id}`] = 'Add at least one option.';
          else if (new Set(opts.map((o) => o.toLowerCase())).size !== opts.length) e[`o_${f.id}`] = 'Options must be unique.';
        }
      });
    }
    setErrors(e);
    return !Object.keys(e).length;
  };

  const save = () => {
    if (!form || !validate()) return;
    const title = form.title.trim();
    if (form.kind === 'list') {
      const def = MODULE_DEFS[form.module];
      const columns = def.columns.map((c) => c.key).filter((k) => form.columns.includes(k));
      // keep the user's existing order for columns that were already shown
      const ordered = editing ? [...component.columns.filter((k) => columns.includes(k)), ...columns.filter((k) => !component.columns.includes(k))] : columns;
      onSave({ kind: 'list', title, module: form.module, criteria: form.criteria, columns: ordered, pageSize: form.pageSize, size: form.size,
        ...(editing && component.module !== form.module ? { sort: null, widths: {} } : {}) });
    } else {
      const fields = form.fields.map((f) => ({
        id: f.id, label: f.label.trim(), type: f.type, required: !!f.required,
        options: f.type === 'select' ? f.options.map((o) => o.trim()).filter(Boolean) : [],
      }));
      const ids = fields.map((f) => f.id);
      const prevCols = editing ? component.columns.filter((k) => ids.includes(k)) : [];
      const columns = editing ? [...prevCols, ...ids.filter((k) => !component.fields.some((f) => f.id === k))] : ids;
      onSave({ kind: 'custom', title, fields, columns: columns.length ? columns : ids, pageSize: form.pageSize, size: form.size });
    }
  };

  const footer = kind
    ? <>
        {!editing && <button className="btn-secondary mr-auto" onClick={() => { setKind(null); setForm(null); }}>Back</button>}
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={save}>{editing ? 'Save' : 'Add'}</button>
      </>
    : <button className="btn-secondary" onClick={onClose}>Cancel</button>;

  return (
    <Modal open={open} onClose={onClose} size={kind === 'custom' ? 'lg' : 'md'}
      title={editing ? 'Edit Component' : 'Add Component'}
      subtitle={!kind ? 'Choose the type of component to add to this Home page.' : undefined}
      footer={footer}>
      {!kind && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TypeCard icon={LayoutList} title="Custom List View" onClick={() => choose('list')}
            text="Show records from a CRM module (Tasks, Leads, Deals, Calls, Contacts, Accounts) with your own criteria and columns." />
          <TypeCard icon={ListPlus} title="Custom Component" onClick={() => choose('custom')}
            text="Create your own list with custom fields — labels, field types, required settings and pick list options — and add records to it." />
        </div>
      )}

      {form && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
            <Labeled label="Component Name" required error={errors.title} className="sm:col-span-2">
              <input className={`input ${errors.title ? 'border-danger' : ''}`} value={form.title} maxLength={60} onChange={(e) => set({ title: e.target.value })}
                placeholder={form.kind === 'list' ? 'e.g. Overdue Tasks' : 'e.g. Marketing Campaign Tracker'} autoFocus />
            </Labeled>

            {form.kind === 'list' && (
              <>
                <Labeled label="Module" required>
                  <select className="input" value={form.module} onChange={(e) => setModule(e.target.value)}>
                    {MODULE_KEYS.map((m) => <option key={m} value={m}>{MODULE_DEFS[m].label}</option>)}
                  </select>
                </Labeled>
                <Labeled label="Criteria" required>
                  <select className="input" value={form.criteria} onChange={(e) => set({ criteria: e.target.value })}>
                    {MODULE_DEFS[form.module].criteria.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </Labeled>
              </>
            )}

            <Labeled label="Records per page">
              <select className="input" value={form.pageSize} onChange={(e) => set({ pageSize: Number(e.target.value) })}>
                {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </Labeled>
            <Labeled label="Width">
              <select className="input" value={form.size} onChange={(e) => set({ size: e.target.value })}>
                <option value="half">Half width</option>
                <option value="full">Full width</option>
              </select>
            </Labeled>
          </div>

          {form.kind === 'list' && (
            <div>
              <p className="text-[12.5px] font-medium text-ink-600 mb-1.5">Columns <span className="text-danger">*</span></p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-2 border border-line rounded-lg p-3">
                {MODULE_DEFS[form.module].columns.map((c) => (
                  <label key={c.key} className="flex items-center gap-2 text-[13px] text-ink cursor-pointer">
                    <input type="checkbox" className="cb" checked={form.columns.includes(c.key)} onChange={() => toggleCol(c.key)} />{c.label}
                  </label>
                ))}
              </div>
              {errors.columns && <p className="text-[12px] text-danger-700 mt-1">{errors.columns}</p>}
            </div>
          )}

          {form.kind === 'custom' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[12.5px] font-medium text-ink-600">Fields <span className="text-danger">*</span></p>
                <button type="button" className="inline-flex items-center gap-1 text-[13px] text-primary hover:underline"
                  onClick={() => setForm((f) => ({ ...f, fields: [...f.fields, blankField()] }))}><Plus size={14} /> Add Field</button>
              </div>
              <div className="space-y-2">
                {form.fields.map((f, i) => (
                  <div key={f.id} className="border border-line rounded-lg p-3 bg-[#FAFCFF]">
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_170px_auto] gap-2 items-start">
                      <div>
                        <input className={`input h-9 ${errors[`f_${f.id}`] ? 'border-danger' : ''}`} placeholder="Field label" value={f.label} maxLength={40}
                          aria-label={`Field ${i + 1} label`} onChange={(e) => setField(f.id, { label: e.target.value })} />
                        {errors[`f_${f.id}`] && <p className="text-[12px] text-danger-700 mt-1">{errors[`f_${f.id}`]}</p>}
                      </div>
                      <select className="input h-9" value={f.type} aria-label={`Field ${i + 1} type`} onChange={(e) => setField(f.id, { type: e.target.value, options: e.target.value === 'select' && !f.options.length ? ['Option 1'] : f.options })}>
                        {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                      <div className="flex items-center gap-1 h-9">
                        <label className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-600 mr-1 cursor-pointer whitespace-nowrap">
                          <input type="checkbox" className="cb" checked={f.required} onChange={(e) => setField(f.id, { required: e.target.checked })} disabled={f.type === 'checkbox'} />Required
                        </label>
                        <button type="button" className="p-1.5 rounded text-ink-400 hover:bg-white hover:text-ink disabled:opacity-30" disabled={i === 0} onClick={() => moveField(i, -1)} aria-label="Move field up"><ArrowUp size={14} /></button>
                        <button type="button" className="p-1.5 rounded text-ink-400 hover:bg-white hover:text-ink disabled:opacity-30" disabled={i === form.fields.length - 1} onClick={() => moveField(i, 1)} aria-label="Move field down"><ArrowDown size={14} /></button>
                        <button type="button" className="p-1.5 rounded text-ink-400 hover:bg-white hover:text-danger disabled:opacity-30" disabled={form.fields.length === 1}
                          onClick={() => setForm((x) => ({ ...x, fields: x.fields.filter((y) => y.id !== f.id) }))} aria-label="Delete field"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    {f.type === 'select' && (
                      <div className="mt-2">
                        <textarea className={`input h-auto py-2 min-h-[64px] ${errors[`o_${f.id}`] ? 'border-danger' : ''}`} placeholder="One option per line"
                          aria-label={`Field ${i + 1} options`} value={f.options.join('\n')} onChange={(e) => setField(f.id, { options: e.target.value.split('\n') })} />
                        {errors[`o_${f.id}`] ? <p className="text-[12px] text-danger-700 mt-1">{errors[`o_${f.id}`]}</p>
                          : <p className="text-[11.5px] text-ink-400 mt-1">Pick list options — one per line.</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {errors.fields && <p className="text-[12px] text-danger-700 mt-1">{errors.fields}</p>}
              <p className="text-[11.5px] text-ink-400 mt-2">The first field is the record's name and opens the record when clicked.</p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function TypeCard({ icon: Icon, title, text, onClick }) {
  return (
    <button type="button" onClick={onClick} className="text-left border border-line rounded-xl p-4 hover:border-primary hover:bg-primary-50/40 transition">
      <span className="h-9 w-9 rounded-lg bg-primary-50 text-primary flex items-center justify-center mb-2.5"><Icon size={18} /></span>
      <span className="block text-[14px] font-semibold text-ink">{title}</span>
      <span className="block text-[12.5px] text-ink-500 mt-1 leading-relaxed">{text}</span>
    </button>
  );
}

function Labeled({ label, required, error, children, className = '' }) {
  return (
    <div className={className}>
      <label className="block text-[12.5px] font-medium text-ink-600 mb-1">{label}{required && <span className="text-danger"> *</span>}</label>
      {children}
      {error && <p className="text-[12px] text-danger-700 mt-1">{error}</p>}
    </div>
  );
}
