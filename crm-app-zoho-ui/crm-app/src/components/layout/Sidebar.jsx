import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronDown, ChevronUp, PanelLeft, Search, X } from 'lucide-react';
import { TEAMSPACE_ITEMS, TOP_NAV_ITEMS } from './navConfig';

export function Logo() {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="15" fill="#2F55D4" />
      <path d="M8 18c3-7 13-7 16 0-3 5-13 5-16 0z" fill="none" stroke="#fff" strokeWidth="2.2" />
      <circle cx="16" cy="17" r="2.6" fill="#fff" />
    </svg>
  );
}

// Zoho colours (taken from the screenshots)
const BG = '#1D2B5A';
const ACTIVE = '#33477F';

const row = 'flex items-center gap-3 h-[34px] text-[14px] text-[#E4E9F5] hover:bg-white/[0.08] transition-colors';

function Item({ it, onNavigate }) {
  return (
    <NavLink
      to={it.path}
      onClick={onNavigate}
      className={({ isActive }) => `${row} ${isActive ? 'text-white font-semibold' : ''}`}
      style={({ isActive }) => ({ margin: '0 6px', padding: '0 8px', borderRadius: 6, ...(isActive ? { background: ACTIVE } : {}) })}
    >
      <it.icon size={16} strokeWidth={1.7} className="shrink-0 text-[#AEBBDD]" />
      <span className="truncate">{it.title}</span>
    </NavLink>
  );
}

export default function Sidebar({ open, onClose }) {
  const [teamspaceOpen, setTeamspaceOpen] = useState(true);
  const [teamFilter, setTeamFilter] = useState('');

  const filtered = TEAMSPACE_ITEMS.filter((t) => t.title.toLowerCase().includes(teamFilter.toLowerCase()));

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />}
      <aside
        style={{ background: BG }}
        className={`fixed top-0 left-0 z-50 h-screen w-[190px] flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header: logo + name + dropdown + panel icon */}
        <div className="flex items-center gap-2 px-3 h-[46px] shrink-0">
          <Logo />
          <span className="text-white text-[16px] font-semibold">CRM</span>
          <ChevronDown size={13} className="text-white/80 -ml-0.5" />
          <PanelLeft size={16} className="ml-auto text-[#AEBBDD] hidden lg:block" />
          <button className="ml-auto text-white/70 lg:hidden" onClick={onClose} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto sidebar-scroll pb-6">
          {/* Home / Workqueue / Reports / Dashboards */}
          <div className="space-y-[2px] pt-1">
            {TOP_NAV_ITEMS.map((t) => (
              <Item key={t.title} it={t} onNavigate={onClose} />
            ))}
          </div>

          {/* CRM Teamspace */}
          <div className="mt-3 border-t border-white/10 pt-3">
            <button
              type="button"
              onClick={() => setTeamspaceOpen((o) => !o)}
              className="w-full flex items-center justify-between px-3 h-[30px] text-white text-[14px] font-semibold"
            >
              <span className="flex items-center gap-2">
                <span className="h-[18px] px-1 rounded bg-[#F0507E] text-white text-[10px] font-bold flex items-center justify-center">CT</span>
                CRM Teamspace
              </span>
              {teamspaceOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {teamspaceOpen && (
              <div className="mt-1.5">
                <div className="relative px-[10px] mb-1.5">
                  <Search size={13} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/50" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={teamFilter}
                    onChange={(e) => setTeamFilter(e.target.value)}
                    className="w-full h-[30px] pl-7 pr-2 rounded border border-white/25 bg-transparent text-[14px] text-white placeholder:text-white/50 focus:outline-none focus:border-white/60"
                  />
                </div>
                <div className="space-y-[2px]">
                  {filtered.map((t) => (
                    <Item key={t.title} it={t} onNavigate={onClose} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </nav>
      </aside>
    </>
  );
}
