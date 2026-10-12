import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpDown, BarChart3, Check, ChevronDown, Clock3, Columns3, FileSpreadsheet, Filter, LayoutGrid, List, MapPin, MoreHorizontal,
  PieChart, Pin, PinOff, RotateCw, Rows3, Table2, Workflow,
} from 'lucide-react';
import Dropdown, { MenuDivider, MenuItem, MenuLabel } from './Dropdown';

/**
 * Persistent hook to store and update the top view bar mode ('fixed' | 'normal')
 * separately for Contacts and Accounts in localStorage.
 */
export function useHeaderBarMode(moduleKey, defaultMode = 'fixed') {
  const normalizedKey = String(moduleKey || 'default').toLowerCase();
  const storageKey = `zcrm.v1.headerMode.${normalizedKey}`;

  const [mode, setMode] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === 'fixed' || saved === 'normal') return saved;
    } catch {
      // ignore storage errors
    }
    return defaultMode;
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, mode);
    } catch {
      // ignore storage errors
    }
  }, [storageKey, mode]);

  const setHeaderMode = (nextMode) => {
    const resolved = nextMode === 'normal' ? 'normal' : 'fixed';
    setMode(resolved);
    try {
      localStorage.setItem(storageKey, resolved);
    } catch {
      // ignore storage errors
    }
  };

  return [mode, setHeaderMode];
}

function SplitViewIcon({ size = 19, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect x="2.5" y="3.5" width="15" height="5" rx="1.3" stroke="currentColor" strokeWidth="1.6" />
      <rect x="2.5" y="11.5" width="15" height="5" rx="1.3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function TimelineViewIcon({ size = 19, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path d="M3.5 3V17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="6" y="4" width="9" height="3.2" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="8.5" y="9.2" width="8.5" height="3.2" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 15.2H12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export const LAYOUTS = {
  list: { icon: List, label: 'List view' },
  spreadsheet: { icon: FileSpreadsheet, label: 'Spreadsheet view' },
  kanban: { icon: Columns3, label: 'Kanban view' },
  grid: { icon: Table2, label: 'Grid view' },
  split: { icon: SplitViewIcon, label: 'Split view' },
  timeline: { icon: TimelineViewIcon, label: 'Timeline view' },
  chart: { icon: PieChart, label: 'Chart view' },
  bars: { icon: BarChart3, label: 'Comparison view' },
  map: { icon: MapPin, label: 'Location view' },
};

const renderItems = (items, close) => items.filter(Boolean).map((it, i) => (it.divider ? <MenuDivider key={i} /> : it.heading ? <MenuLabel key={i}>{it.heading}</MenuLabel> : <MenuItem key={i} {...it} close={close}>{it.label}</MenuItem>));

/** "All Contacts ▾ ⋯" row */
export function ViewTabs({ views, view, onViewChange, tabMenu, headerMode, onHeaderModeChange }) {
  const current = views.find((v) => v.key === view) || views[0];
  const isFixed = headerMode === 'fixed';

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 mb-2.5">
      <div className="flex flex-wrap items-center gap-2.5">
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
        {(tabMenu || onHeaderModeChange) && (
          <Dropdown width={240} trigger={<button type="button" data-testid="view-options-menu-btn" className="h-10 w-10 rounded-lg border border-line bg-white flex items-center justify-center text-ink-600 hover:bg-page" aria-label="View options"><MoreHorizontal size={18} /></button>}>
            {(close) => (
              <>
                {tabMenu && renderItems(tabMenu, close)}
                {onHeaderModeChange && (
                  <>
                    {tabMenu && <MenuDivider />}
                    <MenuLabel>Top View Bar</MenuLabel>
                    <MenuItem
                      testId="menu-view-bar-fixed"
                      close={close}
                      icon={isFixed ? Check : Pin}
                      active={isFixed}
                      onClick={() => onHeaderModeChange('fixed')}
                    >
                      Fixed (Sticky at top)
                    </MenuItem>
                    <MenuItem
                      testId="menu-view-bar-normal"
                      close={close}
                      icon={!isFixed ? Check : PinOff}
                      active={!isFixed}
                      onClick={() => onHeaderModeChange('normal')}
                    >
                      Normal (Scroll with page)
                    </MenuItem>
                  </>
                )}
              </>
            )}
          </Dropdown>
        )}

        {/* Easy-to-find Fixed / Normal View Bar Mode Segmented Toggle */}
        {onHeaderModeChange && (
          <div
            data-testid="view-bar-mode-toggle"
            role="group"
            aria-label="Top view bar position mode"
            className="inline-flex items-center h-10 rounded-lg border border-line bg-white p-0.5 shadow-2xs"
          >
            <span className="hidden sm:inline-flex items-center gap-1 pl-2.5 pr-1.5 text-[12px] font-medium text-ink-500 select-none">
              {isFixed ? <Pin size={13} className="text-primary" /> : <PinOff size={13} className="text-ink-400" />}
              <span>View Bar:</span>
            </span>
            <button
              type="button"
              data-testid="view-bar-mode-fixed"
              aria-pressed={isFixed}
              onClick={() => onHeaderModeChange('fixed')}
              title="Fixed: Keep top view bar sticky at the top while records scroll"
              className={`h-8 px-2.5 rounded-md text-[12.5px] font-medium flex items-center gap-1 transition-colors ${
                isFixed
                  ? 'bg-primary-50 text-primary border border-primary/30 font-semibold shadow-2xs'
                  : 'text-ink-600 hover:bg-page hover:text-ink'
              }`}
            >
              <Pin size={12.5} className="sm:hidden" />
              <span>Fixed</span>
            </button>
            <button
              type="button"
              data-testid="view-bar-mode-normal"
              aria-pressed={!isFixed}
              onClick={() => onHeaderModeChange('normal')}
              title="Normal: Let top view bar scroll away with the page"
              className={`h-8 px-2.5 rounded-md text-[12.5px] font-medium flex items-center gap-1 transition-colors ${
                !isFixed
                  ? 'bg-primary-50 text-primary border border-primary/30 font-semibold shadow-2xs'
                  : 'text-ink-600 hover:bg-page hover:text-ink'
              }`}
            >
              <PinOff size={12.5} className="sm:hidden" />
              <span>Normal</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const sq = 'h-10 flex items-center justify-center text-ink-600 hover:bg-page';

/**
 * Toolbar row matching the screenshots.
 */
export function Toolbar({
  labeled, filterActive, onFilter, sortOptions = [], sort, onSort, layouts = ['list'], layout, onLayout,
  onRefresh, refreshing, dense, onDense, module, primary, secondary, moreItems, onWorkflowTimeline,
  headerMode, onHeaderModeChange,
}) {
  const navigate = useNavigate();
  const hasInlineTimeline = Boolean(onWorkflowTimeline) || module === 'Accounts' || module === 'Contacts';
  const isTimelineActive = layout === 'timeline';
  const isFixed = headerMode === 'fixed';
  const handleWorkflowButtonClick = () => {
    if (onWorkflowTimeline) {
      onWorkflowTimeline();
    } else if (hasInlineTimeline && onLayout) {
      onLayout('timeline');
    } else {
      navigate(`/workflows${module ? `?module=${encodeURIComponent(module)}` : ''}`);
    }
  };
  return (
    <div className="card px-2.5 py-2 flex flex-wrap items-center gap-2 sm:gap-2.5 mb-2.5">
      <button type="button" onClick={onFilter} aria-pressed={filterActive}
        className={`h-10 ${labeled ? 'px-3.5 sm:px-4 gap-2' : 'w-[54px]'} rounded-lg border flex items-center justify-center text-[14.5px] sm:text-[15px] ${filterActive ? 'border-primary bg-primary-50 text-primary' : 'border-line bg-white text-ink-600 hover:bg-page'}`}>
        <Filter size={18} />{labeled && 'Filter'}
      </button>
      <Dropdown width={230} trigger={
        <button type="button" className={`h-10 ${labeled ? 'px-3.5 sm:px-4 gap-2' : 'w-[54px]'} rounded-lg border flex items-center justify-center text-[14.5px] sm:text-[15px] ${sort ? 'border-primary bg-primary-50 text-primary' : 'border-line bg-white text-ink-600 hover:bg-page'}`} aria-label="Sort">
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
      <span className="hidden sm:block w-px h-7 bg-line mx-1" />
      <div className="flex flex-wrap rounded-lg border border-line bg-white overflow-hidden divide-x divide-line max-w-full">
        {layouts.map((k) => {
          const L = LAYOUTS[k];
          if (!L) return null;
          const active = layout === k;
          const isSheet = k === 'spreadsheet';
          return (
            <button
              key={k}
              type="button"
              data-testid={`layout-${k}-btn`}
              title={L.label}
              aria-label={L.label}
              aria-pressed={active}
              onClick={() => onLayout(k)}
              className={`${sq} ${
                isSheet ? 'px-2.5 sm:px-3 gap-1.5' : 'w-[42px] sm:w-[52px]'
              } ${active ? '!bg-primary-50 text-primary ring-1 ring-inset ring-primary font-semibold' : ''}`}
            >
              <L.icon size={19} />
              {isSheet && <span className="hidden xl:inline text-[13px]">Spreadsheet</span>}
            </button>
          );
        })}
        <button
          type="button"
          data-testid="toolbar-workflow-timeline-btn"
          title={hasInlineTimeline ? 'Timeline view (Workflow & Activity)' : 'Workflow rules'}
          aria-label={hasInlineTimeline ? 'Timeline view' : 'Workflow rules'}
          aria-pressed={hasInlineTimeline ? isTimelineActive : undefined}
          onClick={handleWorkflowButtonClick}
          className={`${sq} w-[46px] sm:w-[52px] hidden md:flex ${hasInlineTimeline && isTimelineActive ? '!bg-primary-50 text-primary ring-1 ring-inset ring-primary' : ''}`}
        >
          <Workflow size={19} />
        </button>
        <button type="button" title={dense ? 'Comfortable rows' : 'Compact rows'} aria-label="Row density" aria-pressed={!!dense} onClick={onDense} className={`${sq} w-[46px] sm:w-[52px] hidden md:flex ${dense ? 'text-primary' : ''}`}><Rows3 size={19} /></button>
        <Dropdown width={220} align="right" trigger={<button type="button" data-testid="toolbar-all-views-dropdown-btn" aria-label="All views" className={`${sq} w-[42px] sm:w-[46px]`}><ChevronDown size={17} /></button>}>
          {(close) => (
            <>
              <MenuLabel>Views</MenuLabel>
              {layouts.map((k) => LAYOUTS[k] && <MenuItem key={k} testId={`menu-layout-${k}`} close={close} icon={LAYOUTS[k].icon} active={layout === k} onClick={() => onLayout(k)}>{LAYOUTS[k].label}</MenuItem>)}
              {hasInlineTimeline && !layouts.includes('timeline') && (
                <MenuItem close={close} icon={Workflow} active={isTimelineActive} onClick={handleWorkflowButtonClick}>
                  Timeline view
                </MenuItem>
              )}
              <MenuDivider />
              <MenuItem close={close} icon={Rows3} onClick={onDense}>{dense ? 'Comfortable rows' : 'Compact rows'}</MenuItem>
              {!hasInlineTimeline && (
                <MenuItem close={close} icon={Workflow} onClick={handleWorkflowButtonClick}>Workflow rules</MenuItem>
              )}
              {onHeaderModeChange && (
                <>
                  <MenuDivider />
                  <MenuLabel>Top View Bar</MenuLabel>
                  <MenuItem
                    testId="toolbar-menu-bar-fixed"
                    close={close}
                    icon={isFixed ? Check : Pin}
                    active={isFixed}
                    onClick={() => onHeaderModeChange('fixed')}
                  >
                    Fixed (Sticky at top)
                  </MenuItem>
                  <MenuItem
                    testId="toolbar-menu-bar-normal"
                    close={close}
                    icon={!isFixed ? Check : PinOff}
                    active={!isFixed}
                    onClick={() => onHeaderModeChange('normal')}
                  >
                    Normal (Scroll with page)
                  </MenuItem>
                </>
              )}
            </>
          )}
        </Dropdown>
      </div>
      <button type="button" onClick={onRefresh} title="Refresh" aria-label="Refresh" className="h-10 w-[46px] sm:w-[50px] rounded-lg border border-line bg-white flex items-center justify-center text-ink-600 hover:bg-page">
        <RotateCw size={18} className={refreshing ? 'animate-spin' : ''} />
      </button>
      <div className="flex-1" />
      {primary && (
        <div className="flex rounded-lg overflow-hidden shadow-sm">
          <button
            type="button"
            data-testid={primary['data-testid'] || primary.testId || (primary.label === 'Create Account' ? 'create-account-btn' : undefined)}
            onClick={primary.onClick}
            className="h-10 px-4 sm:px-5 bg-primary hover:bg-primary-600 text-white text-[14.5px] font-medium flex items-center gap-2"
          >
            {primary.icon && <primary.icon size={17} />}{primary.label}
          </button>
          {primary.menu && (
            <Dropdown width={240} align="right" trigger={<button type="button" data-testid="primary-create-menu-btn" aria-label="More create options" className="h-10 w-10 bg-primary hover:bg-primary-600 text-white border-l border-white/30 flex items-center justify-center"><ChevronDown size={17} /></button>}>
              {(close) => renderItems(primary.menu, close)}
            </Dropdown>
          )}
        </div>
      )}
      {secondary && (
        <button
          type="button"
          data-testid={secondary['data-testid'] || secondary.testId || (secondary.label === 'Map View' ? 'accounts-map-view-button' : undefined)}
          onClick={secondary.onClick}
          className="h-10 px-3.5 rounded-lg border border-line bg-white hover:bg-page text-ink-600 text-[14px] font-medium flex items-center gap-1.5"
        >
          {secondary.icon && <secondary.icon size={16} />}
          <span>{secondary.label}</span>
        </button>
      )}
      {moreItems && (
        <Dropdown width={230} align="right" trigger={<button type="button" aria-label="More account actions" className="h-10 w-10 rounded-lg border border-line bg-white flex items-center justify-center text-ink-600 hover:bg-page"><MoreHorizontal size={18} /></button>}>
          {(close) => renderItems(moreItems, close)}
        </Dropdown>
      )}
    </div>
  );
}

export default function PageHeader({
  views,
  view,
  onViewChange,
  tabMenu,
  toolbar,
  headerMode: propHeaderMode,
  onHeaderModeChange: propOnHeaderModeChange,
}) {
  const moduleName = toolbar?.module || '';
  const isConfigurableModule =
    Boolean(propOnHeaderModeChange) ||
    moduleName === 'Contacts' ||
    moduleName === 'Accounts';
  const [internalMode, setInternalMode] = useHeaderBarMode(moduleName || 'default', 'fixed');

  const effectiveMode = propHeaderMode || (isConfigurableModule ? internalMode : 'normal');
  const handleModeChange = propOnHeaderModeChange || (isConfigurableModule ? setInternalMode : undefined);

  if (!isConfigurableModule && !propHeaderMode) {
    return (
      <>
        <ViewTabs views={views} view={view} onViewChange={onViewChange} tabMenu={tabMenu} />
        <Toolbar {...toolbar} />
      </>
    );
  }

  const isFixed = effectiveMode === 'fixed';

  return (
    <div
      data-testid="top-view-bar"
      data-header-mode={effectiveMode}
      className={
        isFixed
          ? 'sticky top-[60px] z-30 bg-page/95 backdrop-blur-xs pt-2 pb-0.5 -mt-2 mb-2.5 border-b border-line/60 shadow-[0_4px_12px_-4px_rgba(15,23,42,0.06)] transition-shadow'
          : 'relative z-20 mb-2.5 transition-shadow'
      }
    >
      <ViewTabs
        views={views}
        view={view}
        onViewChange={onViewChange}
        tabMenu={tabMenu}
        headerMode={effectiveMode}
        onHeaderModeChange={handleModeChange}
      />
      <Toolbar
        {...toolbar}
        headerMode={effectiveMode}
        onHeaderModeChange={handleModeChange}
      />
    </div>
  );
}
