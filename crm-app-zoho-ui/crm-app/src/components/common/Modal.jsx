import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const SIZES = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };

export default function Modal({ open, onClose, title, subtitle, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-start sm:items-center justify-center bg-[#071344]/40 p-2 sm:p-6 overflow-y-auto" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div role="dialog" aria-modal="true" className={`w-full ${SIZES[size]} bg-white rounded-xl shadow-pop pop-in my-auto flex flex-col max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-3rem)]`}>
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-line">
          <div>
            <h2 className="text-[17px] font-semibold text-ink">{title}</h2>
            {subtitle && <p className="text-[13px] text-ink-500 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-ink-400 hover:bg-page hover:text-ink" aria-label="Close"><X size={18} /></button>
        </div>
        <div className="px-5 py-4 overflow-y-auto flex-1">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-line flex justify-end gap-2 bg-[#FAFCFF] rounded-b-xl">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function Drawer({ open, onClose, title, subtitle, children, footer, width = 520, headerExtra }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[85] flex justify-end bg-[#071344]/30" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <aside style={{ width }} className="drawer-in h-full max-w-full bg-white shadow-pop flex flex-col">
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-line">
          <div className="min-w-0 flex-1">{typeof title === 'string' ? <h2 className="text-[17px] font-semibold text-ink truncate">{title}</h2> : title}
            {subtitle && <p className="text-[13px] text-ink-500 mt-0.5">{subtitle}</p>}
          </div>
          {headerExtra}
          <button onClick={onClose} className="p-1 rounded-md text-ink-400 hover:bg-page hover:text-ink" aria-label="Close"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-line flex justify-end gap-2">{footer}</div>}
      </aside>
    </div>,
    document.body,
  );
}

export function DetailGrid({ items }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-3.5">
      {items.filter(Boolean).map(([k, v]) => (
        <div key={k} className="min-w-0">
          <dt className="text-[12px] text-ink-400">{k}</dt>
          <dd className="text-[13.5px] text-ink mt-0.5 break-words">{v ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

export function SectionTitle({ children, extra }) {
  return (
    <div className="flex items-center justify-between mt-6 mb-2.5">
      <h3 className="text-[14px] font-semibold text-ink">{children}</h3>
      {extra}
    </div>
  );
}
