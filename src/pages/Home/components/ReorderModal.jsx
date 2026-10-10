import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, GripVertical } from 'lucide-react';
import Modal from '../../../components/common/Modal';
import { MODULE_DEFS } from '../homeConfig';

/** Rearrange components, show/hide them and set their width. */
export default function ReorderModal({ open, onClose, components, onSave, onRestoreDefault }) {
  const [list, setList] = useState([]);
  const [dragId, setDragId] = useState(null);
  const [confirmRestore, setConfirmRestore] = useState(false);

  useEffect(() => {
    if (open) { setList(components.map((c) => ({ ...c }))); setConfirmRestore(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const move = (i, d) => setList((l) => {
    const j = i + d;
    if (j < 0 || j >= l.length) return l;
    const n = [...l];
    [n[i], n[j]] = [n[j], n[i]];
    return n;
  });
  const dropOn = (targetId) => {
    if (!dragId || dragId === targetId) return;
    setList((l) => {
      const item = l.find((c) => c.id === dragId);
      const n = l.filter((c) => c.id !== dragId);
      n.splice(n.findIndex((c) => c.id === targetId), 0, item);
      return n;
    });
  };
  const patch = (id, p) => setList((l) => l.map((c) => (c.id === id ? { ...c, ...p } : c)));
  const describe = (c) => (c.kind === 'list' ? `${MODULE_DEFS[c.module]?.label} · ${MODULE_DEFS[c.module]?.criteria.find((x) => x.id === c.criteria)?.label}` : `Custom component · ${c.fields.length} field${c.fields.length === 1 ? '' : 's'}`);

  return (
    <Modal open={open} onClose={onClose} title="Reorder" subtitle="Drag components to rearrange them. Hidden components stay saved and can be shown again." size="md"
      footer={
        <>
          {confirmRestore
            ? <span className="mr-auto flex items-center gap-2 text-[13px] text-ink-600">Replace all components with the default layout?
                <button className="text-danger-700 font-medium hover:underline" onClick={() => { onRestoreDefault(); onClose(); }}>Yes, restore</button>
                <button className="text-ink-500 hover:underline" onClick={() => setConfirmRestore(false)}>No</button></span>
            : <button className="btn-secondary mr-auto" onClick={() => setConfirmRestore(true)}>Restore Default</button>}
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => onSave(list)}>Save</button>
        </>
      }>
      {!list.length && <p className="text-[13px] text-ink-500 text-center py-6">This Home page has no components. Use Add Component to add one.</p>}
      <ul className="space-y-2">
        {list.map((c, i) => (
          <li key={c.id} draggable onDragStart={() => setDragId(c.id)} onDragEnd={() => setDragId(null)}
            onDragOver={(e) => e.preventDefault()} onDrop={() => dropOn(c.id)}
            className={`flex items-center gap-2.5 border border-line rounded-lg px-3 py-2.5 bg-white ${dragId === c.id ? 'opacity-50' : ''} ${c.hidden ? 'bg-page' : ''}`}>
            <GripVertical size={16} className="text-ink-400 cursor-grab shrink-0" />
            <div className="flex-1 min-w-0">
              <p className={`text-[13.5px] font-medium truncate ${c.hidden ? 'text-ink-400 line-through' : 'text-ink'}`}>{c.title}</p>
              <p className="text-[11.5px] text-ink-400 truncate">{describe(c)}</p>
            </div>
            <select aria-label={`${c.title} width`} className="input h-8 w-[96px] text-[12.5px] px-2" value={c.size} onChange={(e) => patch(c.id, { size: e.target.value })}>
              <option value="half">Half</option>
              <option value="full">Full</option>
            </select>
            <button type="button" onClick={() => patch(c.id, { hidden: !c.hidden })} title={c.hidden ? 'Show' : 'Hide'} aria-label={`${c.hidden ? 'Show' : 'Hide'} ${c.title}`}
              className={`p-1.5 rounded hover:bg-page ${c.hidden ? 'text-ink-400' : 'text-primary'}`}>{c.hidden ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            <button type="button" className="p-1.5 rounded text-ink-400 hover:bg-page hover:text-ink disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${c.title} up`}><ArrowUp size={15} /></button>
            <button type="button" className="p-1.5 rounded text-ink-400 hover:bg-page hover:text-ink disabled:opacity-30" disabled={i === list.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${c.title} down`}><ArrowDown size={15} /></button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
