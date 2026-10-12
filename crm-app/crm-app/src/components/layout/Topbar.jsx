import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bell, Building2, CalendarDays, CheckCheck, ChevronDown, CircleDollarSign, Download, Grip, Menu, Phone, Plus, Receipt,
  RotateCcw, Search, Settings, Sparkles, Store, Trash2, Users, Workflow,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import Dropdown, { MenuDivider, MenuItem, MenuLabel } from '../common/Dropdown';
import { Drawer } from '../common/Modal';
import Modal from '../common/Modal';
import ConfirmDialog from '../common/ConfirmDialog';
import { UserAvatar } from '../common/Avatar';
import { MODULES, moduleByPath } from './navConfig';
import { balanceOf, fmtCompact, fmtDate, fmtTime, isOpen, isWon, isLost, pctLabel, sumBy, todayISO, addDays } from '../../utils/calculations';

const iconBtn = 'relative h-9 w-9 rounded-lg flex items-center justify-center text-ink-600 hover:bg-page';

function useSearchResults(q) {
  const { contacts, accounts, deals, calls, invoices, accountName } = useCRM();
  return useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return [];
    const has = (...v) => v.some((x) => String(x || '').toLowerCase().includes(s));
    const take = (arr) => arr.slice(0, 4);
    return [
      { group: 'Contacts', icon: Users, path: '/contacts', items: take(contacts.filter((c) => has(c.name, c.email, c.phone))).map((c) => ({ id: c.id, title: c.name, sub: `${c.designation} · ${accountName(c.accountId)}` })) },
      { group: 'Accounts', icon: Building2, path: '/accounts', items: take(accounts.filter((a) => has(a.name, a.industry, a.location))).map((a) => ({ id: a.id, title: a.name, sub: `${a.industry} · ${a.location}` })) },
      { group: 'Deals', icon: CircleDollarSign, path: '/deals', items: take(deals.filter((d) => has(d.name))).map((d) => ({ id: d.id, title: d.name, sub: `${d.stage} · ${accountName(d.accountId)}` })) },
      { group: 'Calls', icon: Phone, path: '/calls', items: take(calls.filter((c) => has(c.subject, c.notes))).map((c) => ({ id: c.id, title: c.subject, sub: `${fmtDate(c.dateTime)} · ${accountName(c.accountId)}` })) },
      { group: 'Invoices', icon: Receipt, path: '/zoho-finance', items: take(invoices.filter((i) => has(i.number, accountName(i.accountId)))).map((i) => ({ id: i.id, title: i.number, sub: `${i.status} · ${accountName(i.accountId)}` })) },
    ].filter((g) => g.items.length);
  }, [q, contacts, accounts, deals, calls, invoices, accountName]);
}

function GlobalSearch({ autoFocus, onDone }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const input = useRef(null);
  const navigate = useNavigate();
  const results = useSearchResults(q);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); input.current?.focus(); setOpen(true); }
    };
    const onDoc = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDoc);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onDoc); };
  }, []);

  const go = (path, id) => { navigate(`${path}?open=${id}`); setQ(''); setOpen(false); onDone?.(); };
  return (
    <div ref={ref} className="relative w-full">
      <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500 pointer-events-none" />
      <input ref={input} autoFocus={autoFocus} value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
        placeholder="Search records" aria-label="Search records"
        className="w-full h-[38px] pl-10 pr-16 rounded-lg border border-line bg-[#F8FAFD] text-[14px] text-ink placeholder:text-ink-500 focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/15" />
      <kbd className="font-sans hidden xl:flex absolute right-2 top-1/2 -translate-y-1/2 h-6 px-1.5 items-center rounded border border-line bg-white text-[11px] text-ink-500">Ctrl + K</kbd>
      {open && q.trim().length >= 2 && (
        <div className="absolute top-[44px] left-0 right-0 bg-white border border-line rounded-lg shadow-pop py-1.5 max-h-[420px] overflow-y-auto z-50 min-w-[300px]">
          {results.length === 0 && <p className="px-4 py-6 text-center text-[13px] text-ink-500">No records match “{q}”.</p>}
          {results.map((g) => (
            <div key={g.group}>
              <MenuLabel>{g.group}</MenuLabel>
              {g.items.map((it) => (
                <button key={it.id} type="button" onClick={() => go(g.path, it.id)} className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-page">
                  <g.icon size={15} className="text-ink-400 shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-[13px] text-ink truncate">{it.title}</span>
                    <span className="block text-[11.5px] text-ink-500 truncate">{it.sub}</span>
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Insights({ open, onClose }) {
  const { deals, invoices, calls, contacts, tasks } = useCRM();
  const navigate = useNavigate();
  const today = todayISO();
  const openDeals = deals.filter(isOpen);
  const closingSoon = [...openDeals].filter((d) => d.closingDate >= today && d.closingDate <= addDays(today, 30)).sort((a, b) => a.closingDate.localeCompare(b.closingDate));
  const overdue = invoices.filter((i) => i.status === 'Overdue');
  const missed = calls.filter((c) => c.status === 'Missed');
  const followUps = contacts.filter((c) => c.followUp && c.followUp <= today);
  const closed = deals.filter((d) => isWon(d) || isLost(d));
  const go = (p) => { navigate(p); onClose(); };
  const cards = [
    { title: 'Win rate', value: pctLabel(deals.filter(isWon).length, closed.length), body: `${deals.filter(isWon).length} won of ${closed.length} closed deals.`, link: '/stage-summary-percentage', cta: 'Open stage summary' },
    { title: 'Deals closing in the next 30 days', value: closingSoon.length, body: closingSoon.slice(0, 3).map((d) => `${d.name} (${fmtCompact(d.amount)}, ${fmtDate(d.closingDate)})`).join('; ') || 'Nothing due in this window.', link: '/deals', cta: 'Review deals' },
    { title: 'Overdue invoices', value: overdue.length, body: `${fmtCompact(sumBy(overdue, balanceOf))} is waiting to be collected.`, link: '/zoho-finance?status=Overdue', cta: 'View overdue invoices' },
    { title: 'Missed calls to return', value: missed.length, body: 'Calls marked missed with no completed follow-up yet.', link: '/calls?status=Missed', cta: 'View missed calls' },
    { title: 'Follow-ups due', value: followUps.length, body: 'Contacts whose follow-up date is today or earlier.', link: '/contacts', cta: 'Open contacts' },
    { title: 'Open workflow tasks', value: tasks.filter((t) => t.status === 'Open').length, body: 'Tasks created by your workflow rules.', link: '/workflows?tab=tasks', cta: 'View tasks' },
  ];
  return (
    <Drawer open={open} onClose={onClose} width={440} title={<span className="flex items-center gap-2 text-[17px] font-semibold text-ink"><Sparkles size={18} className="text-primary" />CRM insights</span>}
      subtitle="Calculated from the records stored in this browser. No data is sent to an external AI service.">
      <div className="space-y-3">
        {cards.map((c) => (
          <div key={c.title} className="border border-line rounded-xl p-4">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-[13.5px] font-semibold text-ink">{c.title}</h3>
              <span className="text-[20px] font-bold text-ink">{c.value}</span>
            </div>
            <p className="text-[13px] text-ink-500 mt-1 leading-relaxed">{c.body}</p>
            <button className="text-[13px] text-primary font-medium mt-2 hover:underline" onClick={() => go(c.link)}>{c.cta}</button>
          </div>
        ))}
      </div>
    </Drawer>
  );
}

export default function Topbar({ onMenu }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const mod = moduleByPath(pathname);
  const crm = useCRM();
  const { notifications, calls, tasks, deals, users, markAllRead, markNotification, clearNotifications, resetDemo, db, contactName } = crm;
  const [aiOpen, setAiOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;
  const me = users[0];
  const today = todayISO();

  const upcoming = useMemo(() => [
    ...calls.filter((c) => c.status === 'Scheduled' && c.dateTime.slice(0, 10) >= today).map((c) => ({ id: c.id, date: c.dateTime, title: c.subject, sub: `Call with ${contactName(c.contactId)}`, path: `/calls?open=${c.id}`, icon: Phone })),
    ...tasks.filter((t) => t.status === 'Open').map((t) => ({ id: t.id, date: t.dueDate, title: t.title, sub: 'Workflow task', path: '/workflows?tab=tasks', icon: CheckCheck })),
    ...deals.filter((d) => isOpen(d) && d.closingDate >= today).map((d) => ({ id: d.id, date: d.closingDate, title: d.name, sub: `Deal closes · ${fmtCompact(d.amount)}`, path: `/deals?open=${d.id}`, icon: CircleDollarSign })),
  ].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8), [calls, tasks, deals, today, contactName]);

  const exportAll = () => {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `crm-data-${today}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const createItems = [
    { label: 'Contact', icon: Users, path: '/contacts?create=1' }, { label: 'Account', icon: Building2, path: '/accounts?create=1' },
    { label: 'Deal', icon: CircleDollarSign, path: '/deals?create=1' }, { label: 'Call log', icon: Phone, path: '/calls?create=1' },
    { label: 'Invoice', icon: Receipt, path: '/zoho-finance?create=1' }, { label: 'Workflow rule', icon: Workflow, path: '/workflows?create=1' },
  ];

  return (
    <header className="sticky top-0 z-30 h-[60px] bg-white border-b border-line flex items-center gap-1.5 sm:gap-2 px-3 sm:px-[18px]">
      <button className={`${iconBtn} lg:hidden -ml-1`} onClick={onMenu} aria-label="Open menu"><Menu size={21} /></button>
      <div className="flex items-center flex-1 xl:flex-none xl:w-[340px] 2xl:w-[400px]">
        <h1 className="text-[20px] sm:text-[26px] font-bold text-ink tracking-tight truncate min-w-0 mr-2">{mod?.title || 'CRM'}</h1>
        
        {mod?.title === 'Deals' && (
          <Dropdown width={200} trigger={
            <button className="flex items-center gap-1 text-[14px] font-semibold text-ink hover:bg-page px-2 py-1 rounded-md border border-transparent hover:border-line">
              All Territories <ChevronDown size={14} className="text-ink-500" />
            </button>
          }>
            {(close) => (
              <div className="py-1">
                <MenuItem close={close} active={true} icon={CheckCheck}>All Territories</MenuItem>
                <MenuItem close={close}>Without Territories</MenuItem>
                <MenuItem close={close}>
                  <div className="flex items-center justify-between w-full">CEO <ChevronDown size={14} className="-rotate-90 text-ink-400" /></div>
                </MenuItem>
                <MenuItem close={close}>
                  <div className="flex items-center justify-between w-full">Manager <ChevronDown size={14} className="-rotate-90 text-ink-400" /></div>
                </MenuItem>
                <MenuItem close={close}>
                  <div className="flex items-center justify-between w-full">Team leader <ChevronDown size={14} className="-rotate-90 text-ink-400" /></div>
                </MenuItem>
                <MenuItem close={close}>officer sales</MenuItem>
                <MenuItem close={close}>
                  <div className="flex items-center justify-between w-full">Team Leader 2 <ChevronDown size={14} className="-rotate-90 text-ink-400" /></div>
                </MenuItem>
                <MenuItem close={close}>Officer Sales 2</MenuItem>
                <MenuItem close={close}>
                  <div className="flex items-center justify-between w-full">Team Leader 3 <ChevronDown size={14} className="-rotate-90 text-ink-400" /></div>
                </MenuItem>
                <MenuItem close={close}>Officer sales 3</MenuItem>
                <MenuItem close={close}>
                  <div className="flex items-center justify-between w-full">Team Leader 4 <ChevronDown size={14} className="-rotate-90 text-ink-400" /></div>
                </MenuItem>
                <MenuItem close={close}>Officer sales 4</MenuItem>
                <MenuItem close={close}>Quotation Maker</MenuItem>
              </div>
            )}
          </Dropdown>
        )}
      </div>
      <div className="hidden md:block w-[230px] lg:w-[280px] xl:w-[282px] 2xl:w-[300px] ml-auto xl:ml-0"><GlobalSearch /></div>
      <div className="hidden xl:block flex-1" />
      <button className={`${iconBtn} md:hidden`} onClick={() => setSearchOpen(true)} aria-label="Search"><Search size={19} /></button>

      <Dropdown width={210} align="right" trigger={<button className="h-[38px] w-[38px] rounded-lg bg-primary hover:bg-primary-600 text-white flex items-center justify-center ml-1" aria-label="Create"><Plus size={21} /></button>}>
        {(close) => (<><MenuLabel>Create</MenuLabel>{createItems.map((c) => <MenuItem key={c.label} icon={c.icon} close={close} onClick={() => navigate(c.path)}>{c.label}</MenuItem>)}</>)}
      </Dropdown>
      <button onClick={() => setAiOpen(true)} className="h-[38px] px-2.5 rounded-lg border border-line bg-white text-primary font-semibold text-[14px] flex items-center gap-1.5 hover:bg-primary-50" aria-label="CRM insights">
        <Sparkles size={18} /><span className="hidden sm:inline">AI</span>
      </button>

      <Dropdown width={340} align="right" trigger={
        <button className={iconBtn} aria-label={`Notifications, ${unread} unread`}>
          <Bell size={20} />
          {unread > 0 && <span className="absolute top-0.5 right-0.5 h-[17px] min-w-[17px] px-1 rounded-full bg-danger text-white text-[10px] font-semibold flex items-center justify-center ring-2 ring-white">{unread > 9 ? '9+' : unread}</span>}
        </button>
      }>
        {(close) => (
          <div>
            <div className="flex items-center justify-between px-3 pb-1.5">
              <span className="text-[14px] font-semibold text-ink">Notifications</span>
              <div className="flex gap-1">
                <button className="text-[12px] text-primary px-1.5 py-0.5 rounded hover:bg-primary-50 disabled:opacity-40" disabled={!unread} onClick={markAllRead}>Mark all read</button>
                <button className="text-[12px] text-ink-500 px-1.5 py-0.5 rounded hover:bg-page disabled:opacity-40" disabled={!notifications.length} onClick={clearNotifications}>Clear</button>
              </div>
            </div>
            <div className="max-h-[340px] overflow-y-auto border-t border-line-soft">
              {notifications.length === 0 && <p className="text-center text-[13px] text-ink-500 py-8">You're all caught up.</p>}
              {notifications.slice(0, 30).map((n) => (
                <button key={n.id} onClick={() => markNotification(n.id)} className={`w-full text-left px-3 py-2.5 border-b border-line-soft hover:bg-page flex gap-2.5 ${n.read ? '' : 'bg-primary-50/50'}`}>
                  <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${n.read ? 'bg-transparent' : 'bg-primary'}`} />
                  <span className="min-w-0">
                    <span className="block text-[13px] text-ink leading-snug">{n.message}</span>
                    <span className="block text-[11.5px] text-ink-400 mt-0.5">{n.module}{n.workflowName ? ` · ${n.workflowName}` : ''} · {fmtDate(n.createdAt)} {fmtTime(n.createdAt)}</span>
                  </span>
                </button>
              ))}
            </div>
            <button className="w-full text-[13px] text-primary py-2 hover:bg-page" onClick={() => { navigate('/workflows?tab=history'); close(); }}>View workflow history</button>
          </div>
        )}
      </Dropdown>

      <Dropdown width={320} align="right" className="hidden sm:inline-flex" trigger={<button className={iconBtn} aria-label="Upcoming"><CalendarDays size={20} /></button>}>
        {(close) => (
          <div>
            <div className="px-3 pb-1.5 text-[14px] font-semibold text-ink">Upcoming</div>
            {upcoming.length === 0 && <p className="text-center text-[13px] text-ink-500 py-6">Nothing scheduled from today onward.</p>}
            {upcoming.map((u) => (
              <button key={u.id} onClick={() => { navigate(u.path); close(); }} className="w-full flex gap-3 px-3 py-2 text-left hover:bg-page">
                <span className="w-11 shrink-0 text-center rounded-md bg-primary-50 text-primary py-1">
                  <span className="block text-[15px] font-bold leading-none">{fmtDate(u.date).slice(0, 2)}</span>
                  <span className="block text-[10.5px] mt-0.5">{fmtDate(u.date).slice(3, 6)}</span>
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] text-ink truncate">{u.title}</span>
                  <span className="block text-[11.5px] text-ink-500 truncate">{u.sub}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </Dropdown>

      <Dropdown width={260} align="right" className="hidden sm:inline-flex" trigger={<button className={iconBtn} aria-label="Installed apps"><Store size={20} /></button>}>
        {(close) => (
          <>
            <MenuLabel>Installed modules</MenuLabel>
            {MODULES.map((m) => <MenuItem key={m.path} icon={m.icon} close={close} onClick={() => navigate(m.path)}>{m.title}</MenuItem>)}
          </>
        )}
      </Dropdown>

      <Dropdown width={240} align="right" className="hidden sm:inline-flex" trigger={<button className={iconBtn} aria-label="Settings"><Settings size={20} /></button>}>
        {(close) => (
          <>
            <MenuLabel>Settings</MenuLabel>
            <MenuItem icon={Workflow} close={close} onClick={() => navigate('/workflows')}>Workflow automation</MenuItem>
            <MenuItem icon={Download} close={close} onClick={exportAll}>Export all data (JSON)</MenuItem>
            <MenuDivider />
            <MenuItem icon={RotateCcw} danger close={close} onClick={() => setConfirmReset(true)}>Reset demo data</MenuItem>
          </>
        )}
      </Dropdown>

      <Dropdown width={250} align="right" trigger={
        <button className="flex items-center gap-2 pl-1 pr-1.5 h-10 rounded-lg hover:bg-page" aria-label="Account menu">
          <UserAvatar userId={me.id} size={36} />
          <span className="hidden lg:block text-[14px] font-semibold text-ink whitespace-nowrap">{me.name}</span>
          <ChevronDown size={16} className="hidden lg:block text-ink-600" />
        </button>
      }>
        {(close) => (
          <>
            <div className="px-3 py-2 flex items-center gap-3">
              <UserAvatar userId={me.id} size={40} />
              <div><div className="text-[14px] font-semibold text-ink">{me.name}</div><div className="text-[12px] text-ink-500">{me.role} · {me.email}</div></div>
            </div>
            <MenuDivider />
            <MenuItem icon={Sparkles} close={close} onClick={() => setAiOpen(true)}>CRM insights</MenuItem>
            <MenuItem icon={Trash2} danger close={close} onClick={() => setConfirmReset(true)}>Reset demo data</MenuItem>
          </>
        )}
      </Dropdown>

      <Dropdown width={300} align="right" className="hidden sm:inline-flex" trigger={<button className={iconBtn} aria-label="App launcher"><Grip size={21} /></button>}>
        {(close) => (
          <div className="grid grid-cols-3 gap-1 p-2">
            {MODULES.map((m) => (
              <button key={m.path} onClick={() => { navigate(m.path); close(); }} className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg hover:bg-page text-center">
                <span className="h-9 w-9 rounded-lg bg-primary-50 text-primary flex items-center justify-center"><m.icon size={18} /></span>
                <span className="text-[11.5px] text-ink leading-tight">{m.title}</span>
              </button>
            ))}
          </div>
        )}
      </Dropdown>

      <Insights open={aiOpen} onClose={() => setAiOpen(false)} />
      <Modal open={searchOpen} onClose={() => setSearchOpen(false)} title="Search records" size="md">
        <div className="min-h-[300px]"><GlobalSearch autoFocus onDone={() => setSearchOpen(false)} /></div>
      </Modal>
      <ConfirmDialog open={confirmReset} onClose={() => setConfirmReset(false)} title="Reset demo data?" confirmLabel="Reset data"
        message="This replaces every record, workflow and notification stored in this browser with the original sample data." onConfirm={resetDemo} />
    </header>
  );
}
