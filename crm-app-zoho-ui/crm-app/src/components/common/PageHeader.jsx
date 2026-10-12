import { useNavigate } from 'react-router-dom';
import {
  ArrowUpDown, BarChart3, Check, ChevronDown, Clock3, Columns3, Filter, LayoutGrid, List, MapPin, MoreHorizontal,
  PieChart, RotateCw, Rows3, Workflow,
} from 'lucide-react';
import Dropdown, { MenuDivider, MenuItem, MenuLabel } from './Dropdown';

const LAYOUTS = {
  list: { icon: List, label: 'List view' },
  kanban: { icon: Columns3, label: 'Kanban view' },
  grid: { icon: LayoutGrid, label: 'Grid view' },
  chart: { icon: PieChart, label: 'Chart view' },
  timeline: { icon: Clock3, label: 'Timeline view' },
  bars: { icon: BarChart3, label: 'Comparison view' },
  map: { icon: MapPin, label: 'Location view' },
};

const renderItems = (items, close) => items.filter(Boolean).map((it, i) => (it.divider ? <MenuDivider key={i} /> : it.heading ? <MenuLabel key={i}>{it.heading}</MenuLabel> : <MenuItem key={i} {...it} close={close}>{it.label}</MenuItem>));

/** "All Contacts ▾ ⋯" row */
export function ViewTabs({ views, view, onViewChange, tabMenu }) {
  const current = views.find((v) => v.key === view) || views[0];
  return (
    <div className="flex items-center gap-3 mb-2.5">
      <Dropdown width={240} trigger={
        <button type="button" className="h-10 px-4 rounded-lg bg-primary-50 border border-primary-100 text-primary text-[15px] font-medium flex items-center gap-2">
          {current.label}{views.length > 1 && <ChevronDown size={15} />}
        </button>
      }>
        {(close) => (
          <>
            <MenuLabel>Saved views</MenuLabel>
            {views.map((v) => (
              <MenuItem key={v.key} close={close} onClick={() => onViewChange(v.key)} icon={v.key === view ? Check : undefined} active={v.key === view}>
                {v.label}{v.count != null && <span className="ml-1 text-ink-400 font-normal">({v.count})</span>}
              </MenuItem>
            ))}
          </>
        )}
      </Dropdown>
      {tabMenu && (
        <Dropdown width={220} trigger={<button type="button" className="h-10 w-10 rounded-lg border border-line bg-white flex items-center justify-center text-ink-600 hover:bg-page" aria-label="View options"><MoreHorizontal size={18} /></button>}>
          {(close) => renderItems(tabMenu, close)}
        </Dropdown>
      )}
    </div>
  );
}

const sq = 'h-10 flex items-center justify-center text-ink-600 hover:bg-page';

/**
 * Toolbar row matching the screenshots.
 */
export function Toolbar({
  labeled, filterActive, onFilter, sortOptions = [], sort, onSort, layouts = ['list'], layout, onLayout,
  onRefresh, refreshing, dense, onDense, module, primary, moreItems,
}) {
  const navigate = useNavigate();
  return (
    <div className="card px-2.5 py-2 flex flex-wrap items-center gap-2.5 mb-3">
      <button type="button" onClick={onFilter} aria-pressed={filterActive}
        className={`h-10 ${labeled ? 'px-4 gap-2' : 'w-[54px]'} rounded-lg border flex items-center justify-center text-[15px] ${filterActive ? 'border-primary bg-primary-50 text-primary' : 'border-line bg-white text-ink-600 hover:bg-page'}`}>
        <Filter size={18} />{labeled && 'Filter'}
      </button>
      <Dropdown width={230} trigger={
        <button type="button" className={`h-10 ${labeled ? 'px-4 gap-2' : 'w-[54px]'} rounded-lg border flex items-center justify-center text-[15px] ${sort ? 'border-primary bg-primary-50 text-primary' : 'border-line bg-white text-ink-600 hover:bg-page'}`} aria-label="Sort">
          <ArrowUpDown size={18} />{labeled && 'Sort'}
        </button>
      }>
        {(close) => (
          <>
            <MenuLabel>Sort by</MenuLabel>
            {sortOptions.map((o) => {
              const active = sort?.key === o.key;
              return (
                <MenuItem key={o.key} close={close} active={active} icon={active ? Check : undefined}
                  onClick={() => onSort(active ? (sort.dir === 'asc' ? { key: o.key, dir: 'desc' } : null) : { key: o.key, dir: 'asc' })}>
                  {o.label}{active && <span className="text-ink-400 font-normal"> · {sort.dir === 'asc' ? 'ascending' : 'descending'}</span>}
                </MenuItem>
              );
            })}
            <MenuDivider />
            <MenuItem close={close} disabled={!sort} onClick={() => onSort(null)}>Clear sort</MenuItem>
          </>
        )}
      </Dropdown>
      <span className="hidden sm:block w-px h-7 bg-line mx-1.5" />
      <div className="flex rounded-lg border border-line bg-white overflow-hidden divide-x divide-line">
        {layouts.map((k) => {
          const L = LAYOUTS[k];
          const active = layout === k;
          return (
            <button key={k} type="button" title={L.label} aria-label={L.label} aria-pressed={active} onClick={() => onLayout(k)}
              className={`${sq} w-[50px] sm:w-[56px] ${active ? '!bg-primary-50 text-primary ring-1 ring-inset ring-primary' : ''}`}>
              <L.icon size={19} />
            </button>
          );
        })}
        <button type="button" title="Workflow rules" aria-label="Workflow rules" onClick={() => navigate(`/workflows${module ? `?module=${encodeURIComponent(module)}` : ''}`)} className={`${sq} w-[50px] sm:w-[56px] hidden md:flex`}><Workflow size={19} /></button>
        <button type="button" title={dense ? 'Comfortable rows' : 'Compact rows'} aria-label="Row density" aria-pressed={!!dense} onClick={onDense} className={`${sq} w-[50px] sm:w-[56px] hidden md:flex ${dense ? 'text-primary' : ''}`}><Rows3 size={19} /></button>
        <Dropdown width={210} align="right" trigger={<button type="button" aria-label="All views" className={`${sq} w-[46px]`}><ChevronDown size={17} /></button>}>
          {(close) => (
            <>
              <MenuLabel>Views</MenuLabel>
              {layouts.map((k) => <MenuItem key={k} close={close} icon={LAYOUTS[k].icon} active={layout === k} onClick={() => onLayout(k)}>{LAYOUTS[k].label}</MenuItem>)}
              <MenuDivider />
              <MenuItem close={close} icon={Rows3} onClick={onDense}>{dense ? 'Comfortable rows' : 'Compact rows'}</MenuItem>
              <MenuItem close={close} icon={Workflow} onClick={() => navigate(`/workflows${module ? `?module=${encodeURIComponent(module)}` : ''}`)}>Workflow rules</MenuItem>
            </>
          )}
        </Dropdown>
      </div>
      <button type="button" onClick={onRefresh} title="Refresh" aria-label="Refresh" className="h-10 w-[50px] rounded-lg border border-line bg-white flex items-center justify-center text-ink-600 hover:bg-page">
        <RotateCw size={18} className={refreshing ? 'animate-spin' : ''} />
      </button>
      <div className="flex-1" />
      {primary && (
        <div className="flex rounded-lg overflow-hidden shadow-sm">
          <button type="button" onClick={primary.onClick} className="h-10 px-4 sm:px-5 bg-primary hover:bg-primary-600 text-white text-[14.5px] font-medium flex items-center gap-2">
            {primary.icon && <primary.icon size={17} />}{primary.label}
          </button>
          {primary.menu && (
            <Dropdown width={220} align="right" trigger={<button type="button" aria-label="More create options" className="h-10 w-10 bg-primary hover:bg-primary-600 text-white border-l border-white/30 flex items-center justify-center"><ChevronDown size={17} /></button>}>
              {(close) => renderItems(primary.menu, close)}
            </Dropdown>
          )}
        </div>
      )}
      {moreItems && (
        <Dropdown width={230} align="right" trigger={<button type="button" aria-label="More options" className="h-10 w-10 rounded-lg border border-line bg-white flex items-center justify-center text-ink-600 hover:bg-page"><MoreHorizontal size={18} /></button>}>
          {(close) => renderItems(moreItems, close)}
        </Dropdown>
      )}
    </div>
  );
}

export default function PageHeader({ views, view, onViewChange, tabMenu, toolbar }) {
  return (
    <>
      <ViewTabs views={views} view={view} onViewChange={onViewChange} tabMenu={tabMenu} />
      <Toolbar {...toolbar} />
    </>
  );
}
