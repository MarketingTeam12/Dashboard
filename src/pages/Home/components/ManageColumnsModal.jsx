import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, GripVertical, Search } from 'lucide-react';
import Modal from '../../../components/common/Modal';

/** Choose which columns a component shows and their order. */
export default function ManageColumnsModal({ open, onClose, allColumns, selected, onSave }) {
  const [order, setOrder] = useState([]);
  const [checked, setChecked] = useState(new Set());
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [dragKey, setDragKey] = useState(null);

  useEffect(() => {
    if (!open) return;
    const rest = allColumns.map((c) => c.key).filter((k) => !selected.includes(k));
    setOrder([...selected, ...rest]);
    setChecked(new Set(selected));
    setQuery('');
    setError('');
    // reset only when the dialog opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const byKey = Object.fromEntries(allColumns.map((c) => [c.key, c]));
  const move = (key, delta) => setOrder((o) => {
    const i = o.indexOf(key);
    const j = i + delta;
    if (j < 0 || j >= o.length) return o;
    const n = [...o];
    [n[i], n[j]] = [n[j], n[i]];
    return n;
  });
  const dropOn = (target) => {
    if (!dragKey || dragKey === target) return;
    setOrder((o) => {
      const n = o.filter((k) => k !== dragKey);
      n.splice(n.indexOf(target), 0, dragKey);
      return n;
    });
  };
  const toggle = (k) => {
    setError('');
    setChecked((s) => {
      const n = new Set(s);
      if (n.has(k)) n.delete(k); else n.add(k);
      return n;
    });
  };
  const save = () => {
    const cols = order.filter((k) => checked.has(k));
    if (!cols.length) return setError('Select at least one column.');
    onSave(cols);
  };
  const visible = order.filter((k) => byKey[k] && byKey[k].label.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <Modal open={open} onClose={onClose} title="Manage Columns" subtitle="Choose the columns to show and drag to reorder them." size="sm"
      footer={<><button className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={save}>Save</button></>}>
      <div className="relative mb-3">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
        <input className="input pl-9 h-9" placeholder="Search columns" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <ul className="border border-line rounded-lg divide-y divide-line-soft max-h-[340px] overflow-y-auto">
        {visible.map((k) => (
          <li key={k} draggable onDragStart={() => setDragKey(k)} onDragEnd={() => setDragKey(null)}
            onDragOver={(e) => e.preventDefault()} onDrop={() => dropOn(k)}
            className={`flex items-center gap-2 px-2.5 py-2 bg-white ${dragKey === k ? 'opacity-50' : ''}`}>
            <GripVertical size={15} className="text-ink-400 cursor-grab shrink-0" />
            <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer text-[13.5px] text-ink">
              <input type="checkbox" className="cb" checked={checked.has(k)} onChange={() => toggle(k)} />
              <span className="truncate">{byKey[k].label}</span>
            </label>
            <button type="button" className="p-1 rounded text-ink-400 hover:bg-page hover:text-ink" onClick={() => move(k, -1)} aria-label={`Move ${byKey[k].label} up`}><ArrowUp size={14} /></button>
            <button type="button" className="p-1 rounded text-ink-400 hover:bg-page hover:text-ink" onClick={() => move(k, 1)} aria-label={`Move ${byKey[k].label} down`}><ArrowDown size={14} /></button>
          </li>
        ))}
        {!visible.length && <li className="px-3 py-4 text-center text-[13px] text-ink-400">No matching columns</li>}
      </ul>
      {error && <p className="text-[12px] text-danger-700 mt-2">{error}</p>}
    </Modal>
  );
}
