import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);
const ICONS = { success: CheckCircle2, info: Info, error: AlertTriangle };
const TONES = { success: 'text-success', info: 'text-primary', error: 'text-danger' };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback((type, message) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t.slice(-3), { id, type, message }]);
    setTimeout(() => dismiss(id), 3800);
  }, [dismiss]);
  const api = useMemo(() => ({
    success: (m) => push('success', m), info: (m) => push('info', m), error: (m) => push('error', m),
  }), [push]);
  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[340px] max-w-[calc(100vw-2rem)]" aria-live="polite">
        {toasts.map((t) => {
          const Icon = ICONS[t.type];
          return (
            <div key={t.id} className="toast-in flex items-start gap-3 bg-white border border-line rounded-lg shadow-pop px-4 py-3 text-sm text-ink">
              <Icon size={18} className={`${TONES[t.type]} mt-0.5 shrink-0`} />
              <span className="flex-1">{t.message}</span>
              <button onClick={() => dismiss(t.id)} className="text-ink-400 hover:text-ink" aria-label="Dismiss"><X size={16} /></button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
