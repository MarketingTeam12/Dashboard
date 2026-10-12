import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpDown, BarChart3, Check, ChevronDown, Clock3, Columns2, Columns3, Filter, LayoutDashboard, LayoutGrid, List, MapPin, MoreHorizontal,
  PieChart, RotateCw, Rows3, SlidersHorizontal, Table2, Workflow,
} from 'lucide-react';
import Dropdown, { MenuDivider, MenuItem, MenuLabel } from './Dropdown';
import SidebarToggleButton from './SidebarToggleButton';

export const LAYOUTS = {
  list: { icon: List, label: 'List View' },
  kanban: { icon: Columns3, label: 'Kanban View' },
  grid: { icon: LayoutGrid, label: 'Grid View' },
  chart: { icon: PieChart, label: 'Chart View' },
  timeline: { icon: Clock3, label: 'Timeline View' },
  split: { icon: Columns2, label: 'Split View' },
  custom_list: { icon: SlidersHorizontal, label: 'Custom List View' },
  tile: { icon: LayoutDashboard, label: 'Tile View' },
  table: { icon: Table2, label: 'Table View' },
  bars: { icon: BarChart3, label: 'Comparison view' },
  map: { icon: MapPin, label: 'Location view' },
};

const renderItems = (items, close) => items.filter(Boolean).map((it, i) => (
  it.divider ? <MenuDivider key={i} /> :
  it.heading ? <MenuLabel key={i}>{it.heading}</MenuLabel> :
  it.render ? <React.Fragment key={i}>{it.render(close)}</React.Fragment> :
  <MenuItem key={i} {...it} close={close}>{it.label}</MenuItem>
));

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
          {(close) => typeof tabMenu === 'function' ? tabMenu(close) : renderItems(tabMenu, close)}
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
  onRefresh, refreshing, dense, onDense, module, primary, customRight, moreItems,
  hideWorkflow, hideDense, customLayoutButtons, customViewsDropdown, onCustomListViews,
  sidebarToggle,
}) {
  const navigate = useNavigate();
  const isDeals = module === 'Deals';
  const showWorkflow = hideWorkflow !== undefined ? !hideWorkflow : !isDeals;
  const showDense = hideDense !== undefined ? !hideDense : !isDeals;
  const showLabel = labeled || isDeals;

  return (
    <div className="card px-2.5 py-2 flex flex-wrap items-center gap-2.5 mb-3">
      {sidebarToggle && (
        <SidebarToggleButton
          isOpen={sidebarToggle.isOpen}
          onToggle={sidebarToggle.onToggle}
          size="md"
        />
      )}
      <button type="button" onClick={onFilter} aria-pressed={filterActive}
        className={`h-10 ${showLabel ? 'px-3.5 gap-2' : 'w-[54px]'} rounded-lg border flex items-center justify-center text-[14.5px] font-medium ${filterActive ? 'border-primary bg-primary-50 text-primary' : 'border-line bg-white text-ink-600 hover:bg-page'}`}>
        <Filter size={18} />{showLabel && <span>Filter</span>}
      </button>
      <Dropdown width={230} trigger={
        <button type="button" className={`h-10 ${showLabel ? 'px-3.5 gap-2' : 'w-[54px]'} rounded-lg border flex items-center justify-center text-[14.5px] font-medium ${sort ? 'border-primary bg-primary-50 text-primary' : 'border-line bg-white text-ink-600 hover:bg-page'}`} aria-label="Sort">
          <ArrowUpDown size={18} />{showLabel && <span>Sort</span>}
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
          if (!L) return null;
          const active = layout === k;
          return (
            <button key={k} type="button" title={L.label} aria-label={L.label} aria-pressed={active} onClick={() => onLayout(k)}
              className={`${sq} w-[50px] sm:w-[56px] ${active ? '!bg-primary-50 text-primary ring-1 ring-inset ring-primary' : ''}`}>
              <L.icon size={19} />
            </button>
          );
        })}
        {customLayoutButtons}
        {showWorkflow && (
          <button type="button" title="Workflow rules" aria-label="Workflow rules" onClick={() => navigate(`/workflows${module ? `?module=${encodeURIComponent(module)}` : ''}`)} className={`${sq} w-[50px] sm:w-[56px] hidden md:flex`}><Workflow size={19} /></button>
        )}
        {showDense && (
          <button type="button" title={dense ? 'Comfortable rows' : 'Compact rows'} aria-label="Row density" aria-pressed={!!dense} onClick={onDense} className={`${sq} w-[50px] sm:w-[56px] hidden md:flex ${dense ? 'text-primary' : ''}`}><Rows3 size={19} /></button>
        )}
        <Dropdown width={220} align="right" trigger={<button type="button" aria-label="All views" className={`${sq} w-[46px]`}><ChevronDown size={17} /></button>}>
          {(close) => {
            if (customViewsDropdown) {
              return customViewsDropdown(close);
            }
            if (isDeals) {
              const dealsViews = ['list', 'kanban', 'tile', 'chart', 'timeline', 'split'];
              return (
                <>
                  <MenuLabel>Views</MenuLabel>
                  {dealsViews.map((k) => (
                    <MenuItem key={k} close={close} icon={LAYOUTS[k]?.icon} active={layout === k} onClick={() => onLayout(k)}>
                      {LAYOUTS[k]?.label}
                    </MenuItem>
                  ))}
                </>
              );
            }
            return (
              <>
                <MenuLabel>Views</MenuLabel>
                {layouts.map((k) => <MenuItem key={k} close={close} icon={LAYOUTS[k]?.icon} active={layout === k} onClick={() => onLayout(k)}>{LAYOUTS[k]?.label}</MenuItem>)}
                <MenuDivider />
                {showDense && <MenuItem close={close} icon={Rows3} onClick={onDense}>{dense ? 'Comfortable rows' : 'Compact rows'}</MenuItem>}
                {showWorkflow && <MenuItem close={close} icon={Workflow} onClick={() => navigate(`/workflows${module ? `?module=${encodeURIComponent(module)}` : ''}`)}>Workflow rules</MenuItem>}
              </>
            );
          }}
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
      {customRight}
      {moreItems && (
        <Dropdown width={230} align="right" trigger={<button type="button" aria-label="More options" className="h-10 w-10 rounded-lg border border-line bg-white flex items-center justify-center text-ink-600 hover:bg-page ml-2"><MoreHorizontal size={18} /></button>}>
          {(close) => renderItems(moreItems, close)}
        </Dropdown>
      )}
    </div>
  );
}

export default function PageHeader({ views, view, onViewChange, tabMenu, toolbar, customRight }) {
  return (
    <>
      <ViewTabs views={views} view={view} onViewChange={onViewChange} tabMenu={tabMenu} />
      <Toolbar {...toolbar} customRight={customRight} />
    </>
  );
}
