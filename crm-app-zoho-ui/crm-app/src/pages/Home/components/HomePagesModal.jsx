import { useEffect, useState } from 'react';
import { Check, Pencil, Trash2, X } from 'lucide-react';
import Modal from '../../../components/common/Modal';

function validate(name, welcome, views, selfId) {
  const e = {};
  const n = name.trim();
  if (!n) e.name = 'Home page name is required.';
  else if (n.length > 40) e.name = 'Use 40 characters or fewer.';
  else if (views.some((v) => v.id !== selfId && v.name.trim().toLowerCase() === n.toLowerCase())) e.name = 'A Home page with this name already exists.';
  if (welcome.trim().length > 60) e.welcome = 'Use 60 characters or fewer.';
  return e;
}

export function NewHomePageModal({ open, onClose, views, onCreate }) {
  const [name, setName] = useState('');
  const [welcome, setWelcome] = useState('');
  const [start, setStart] = useState('default');
  const [errors, setErrors] = useState({});
  useEffect(() => { if (open) { setName(''); setWelcome(''); setStart('default'); setErrors({}); } }, [open]);
  const save = () => {
    const e = validate(name, welcome, views);
    setErrors(e);
    if (Object.keys(e).length) return;
    onCreate({ name: name.trim(), welcome: welcome.trim() || name.trim(), start });
  };
  return (
    <Modal open={open} onClose={onClose} title="New Home Page" size="sm"
      footer={<><button className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={save}>Create</button></>}>
      <form className="space-y-3.5" onSubmit={(e) => { e.preventDefault(); save(); }} noValidate>
        <div>
          <label className="block text-[12.5px] font-medium text-ink-600 mb-1">Home Page Name <span className="text-danger">*</span></label>
          <input autoFocus className={`input ${errors.name ? 'border-danger' : ''}`} value={name} onChange={(e) => { setName(e.target.value); setErrors({}); }} placeholder="e.g. Sales Team" />
          {errors.name && <p className="text-[12px] text-danger-700 mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-[12.5px] font-medium text-ink-600 mb-1">Welcome Text</label>
          <div className="flex items-center gap-2">
            <span className="text-[13.5px] text-ink-500 shrink-0">Welcome</span>
            <input className={`input ${errors.welcome ? 'border-danger' : ''}`} value={welcome} onChange={(e) => { setWelcome(e.target.value); setErrors({}); }} placeholder="Defaults to the Home page name" />
          </div>
          {errors.welcome && <p className="text-[12px] text-danger-700 mt-1">{errors.welcome}</p>}
        </div>
        <fieldset>
          <legend className="block text-[12.5px] font-medium text-ink-600 mb-1.5">Start with</legend>
          {[['default', 'Default components'], ['copy', 'A copy of the current Home page'], ['blank', 'A blank Home page']].map(([v, l]) => (
            <label key={v} className="flex items-center gap-2 text-[13.5px] text-ink py-1 cursor-pointer">
              <input type="radio" name="start" checked={start === v} onChange={() => setStart(v)} className="accent-[#1262E0]" />{l}
            </label>
          ))}
        </fieldset>
        <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
      </form>
    </Modal>
  );
}

export function ManageHomePagesModal({ open, onClose, views, activeId, onUpdate, onDelete, onSwitch }) {
  const [editId, setEditId] = useState(null);
  const [draft, setDraft] = useState({ name: '', welcome: '' });
  const [errors, setErrors] = useState({});
  const [confirmId, setConfirmId] = useState(null);
  useEffect(() => { if (open) { setEditId(null); setConfirmId(null); } }, [open]);

  const startEdit = (v) => { setEditId(v.id); setDraft({ name: v.name, welcome: v.welcome }); setErrors({}); setConfirmId(null); };
  const save = () => {
    const e = validate(draft.name, draft.welcome, views, editId);
    setErrors(e);
    if (Object.keys(e).length) return;
    onUpdate(editId, { name: draft.name.trim(), welcome: draft.welcome.trim() });
    setEditId(null);
  };

  return (
    <Modal open={open} onClose={onClose} title="Manage Home Pages" size="md" footer={<button className="btn-secondary" onClick={onClose}>Close</button>}>
      <ul className="divide-y divide-line-soft border border-line rounded-lg">
        {views.map((v) => (
          <li key={v.id} className="px-3 py-2.5">
            {editId === v.id ? (
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <input className={`input h-9 ${errors.name ? 'border-danger' : ''}`} aria-label="Home page name" value={draft.name} onChange={(e) => { setDraft((d) => ({ ...d, name: e.target.value })); setErrors({}); }} />
                    {errors.name && <p className="text-[12px] text-danger-700 mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <input className={`input h-9 ${errors.welcome ? 'border-danger' : ''}`} aria-label="Welcome text" placeholder="Welcome text" value={draft.welcome} onChange={(e) => { setDraft((d) => ({ ...d, welcome: e.target.value })); setErrors({}); }} />
                    {errors.welcome && <p className="text-[12px] text-danger-700 mt-1">{errors.welcome}</p>}
                  </div>
                </div>
                <div className="flex justify-end gap-1.5">
                  <button className="h-8 px-3 rounded-lg border border-line text-[13px] inline-flex items-center gap-1 hover:bg-page" onClick={() => setEditId(null)}><X size={14} /> Cancel</button>
                  <button className="h-8 px-3 rounded-lg bg-primary text-white text-[13px] inline-flex items-center gap-1 hover:bg-primary-600" onClick={save}><Check size={14} /> Save</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-medium text-ink truncate">{v.name} {v.id === activeId && <span className="ml-1 text-[11px] font-semibold text-primary bg-primary-50 rounded px-1.5 py-0.5">Current</span>}</p>
                  <p className="text-[12px] text-ink-400 truncate">Welcome {v.welcome || '—'} · {v.components.length} component{v.components.length === 1 ? '' : 's'}</p>
                </div>
                {v.id !== activeId && <button className="h-8 px-2.5 rounded-lg border border-line text-[12.5px] hover:bg-page" onClick={() => onSwitch(v.id)}>Open</button>}
                <button className="p-1.5 rounded text-ink-400 hover:bg-page hover:text-ink" onClick={() => startEdit(v)} aria-label={`Edit ${v.name}`}><Pencil size={15} /></button>
                {confirmId === v.id ? (
                  <span className="flex items-center gap-1.5 text-[12.5px]">
                    <button className="text-danger-700 font-medium hover:underline" onClick={() => { onDelete(v.id); setConfirmId(null); }}>Delete</button>
                    <button className="text-ink-500 hover:underline" onClick={() => setConfirmId(null)}>Cancel</button>
                  </span>
                ) : (
                  <button className="p-1.5 rounded text-ink-400 hover:bg-page hover:text-danger disabled:opacity-30 disabled:hover:text-ink-400" disabled={views.length <= 1}
                    title={views.length <= 1 ? 'At least one Home page is required' : 'Delete'} onClick={() => setConfirmId(v.id)} aria-label={`Delete ${v.name}`}><Trash2 size={15} /></button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </Modal>
  );
}
