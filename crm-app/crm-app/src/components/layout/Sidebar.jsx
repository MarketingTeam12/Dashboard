import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { SIDEBAR_ITEMS, MODULES } from './navConfig';
import { useToast } from '../common/Toast';

export function Logo() {
  return (
    <svg width="34" height="34" viewBox="0 0 32 32" aria-hidden="true">
      <g fill="#2F7BF5" transform="rotate(45 16 16)">
        <rect x="11" y="0.5" width="10" height="14.5" rx="5" />
        <rect x="11" y="17" width="10" height="14.5" rx="5" />
        <rect x="0.5" y="11" width="14.5" height="10" rx="5" />
        <rect x="17" y="11" width="14.5" height="10" rx="5" />
      </g>
    </svg>
  );
}

const item = 'flex items-center gap-3 mx-2 px-3 h-[40px] rounded-lg text-[15px] transition-colors';
const idle = 'text-[#DCE6F5] hover:bg-white/[0.07] hover:text-white';

function Placeholder({ title, icon: Icon, onClick }) {
  return (
    <button type="button" onClick={onClick} className={`${item} ${idle} w-[calc(100%-1rem)] text-left`}>
      <Icon size={21} strokeWidth={1.7} className="shrink-0" /><span className="truncate">{title}</span>
    </button>
  );
}

function ModuleLink({ path, onNavigate, overrideTitle }) {
  const m = MODULES.find((x) => x.path === path);
  if (!m) return null;
  const displayTitle = overrideTitle || m.title;
  return (
    <NavLink to={m.path} onClick={onNavigate}
      className={({ isActive }) => `${item} ${isActive ? 'bg-primary text-white shadow-[0_4px_12px_rgba(18,98,224,0.35)]' : idle} ${displayTitle.length > 18 ? '!h-auto py-2.5 leading-snug' : ''}`}>
      <m.icon size={21} strokeWidth={1.7} className="shrink-0" /><span>{displayTitle}</span>
    </NavLink>
  );
}

export default function Sidebar({ open, onClose }) {
  const toast = useToast();
  const notInDemo = (t) => toast.info(`${t} is shown for navigation context only. The working modules are Contacts, Accounts, Deals, Calls, the two Stage Summary reports and Zoho Finance.`);

  return (
    <>
      {open && <div className="fixed inset-0 bg-[#071344]/50 z-40 lg:hidden" onClick={onClose} />}
      <aside className={`fixed top-0 left-0 z-50 h-screen w-[204px] bg-navy flex flex-col transition-transform duration-200 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-2.5 px-4 h-[60px] shrink-0">
          <Logo />
          <span className="text-white text-[25px] font-bold tracking-tight">CRM</span>
          <button className="ml-auto text-white/70 lg:hidden" onClick={onClose} aria-label="Close menu"><X size={20} /></button>
        </div>
        <nav className="flex-1 overflow-y-auto sidebar-scroll pb-24 relative z-10 pt-1">
          <div className="space-y-0.5">
            {SIDEBAR_ITEMS.map((s, idx) => {
              if (s.path) {
                return <ModuleLink key={s.path} path={s.path} overrideTitle={s.title} onNavigate={onClose} />;
              }
              return <Placeholder key={s.title || idx} {...s} onClick={() => notInDemo(s.title)} />;
            })}
          </div>
        </nav>
        <svg className="absolute bottom-0 left-0 w-full h-[110px] pointer-events-none" viewBox="0 0 204 110" preserveAspectRatio="none" aria-hidden="true">
          <polygon points="0,110 0,60 40,20 95,80 130,45 204,110" fill="#0B3A78" opacity="0.55" />
          <polygon points="20,110 70,50 120,110" fill="#14509F" opacity="0.35" />
          <polygon points="110,110 160,62 204,98 204,110" fill="#14509F" opacity="0.3" />
        </svg>
      </aside>
    </>
  );
}
