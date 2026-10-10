import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Click-to-open popover rendered in a portal (never clipped by scroll containers).
 * children may be a function receiving `close`.
 */
export default function Dropdown({ trigger, children, align = 'left', width = 220, className = '', panelClassName = '', disabled }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const anchor = useRef(null);
  const panel = useRef(null);

  const place = () => {
    const r = anchor.current?.getBoundingClientRect();
    if (!r) return;
    const w = Math.min(width, window.innerWidth - 16);
    let left = align === 'right' ? r.right - w : r.left;
    left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
    let top = r.bottom + 6;
    const h = panel.current?.offsetHeight || 0;
    if (h && top + h > window.innerHeight - 8 && r.top - h - 6 > 8) top = r.top - h - 6;
    setPos({ top, left, width: w });
  };

  useLayoutEffect(() => { if (open) place(); }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (anchor.current?.contains(e.target) || panel.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    const onScroll = (e) => { if (!panel.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', place);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', place);
    };
  }, [open]);

  const close = () => setOpen(false);
  return (
    <>
      <span ref={anchor} className={`inline-flex ${className}`} onClick={() => !disabled && setOpen((o) => !o)}>
        {typeof trigger === 'function' ? trigger(open) : trigger}
      </span>
      {open && createPortal(
        <div ref={panel} style={{ top: pos.top, left: pos.left, width: pos.width }} className={`fixed z-[80] bg-white border border-line rounded-lg shadow-pop py-1.5 pop-in ${panelClassName}`}>
          {typeof children === 'function' ? children(close) : children}
        </div>,
        document.body,
      )}
    </>
  );
}

export function MenuItem({ icon: Icon, children, onClick, danger, active, close, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => { onClick?.(); close?.(); }}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-left hover:bg-page disabled:opacity-40 disabled:cursor-not-allowed ${danger ? 'text-danger-700' : 'text-ink'} ${active ? 'font-semibold text-primary' : ''}`}
    >
      {Icon && <Icon size={15} className={danger ? 'text-danger' : 'text-ink-400'} />}
      <span className="flex-1">{children}</span>
    </button>
  );
}

export const MenuDivider = () => <div className="my-1 border-t border-line-soft" />;
export const MenuLabel = ({ children }) => <div className="px-3 pt-1.5 pb-1 text-[11px] font-semibold text-ink-400">{children}</div>;
