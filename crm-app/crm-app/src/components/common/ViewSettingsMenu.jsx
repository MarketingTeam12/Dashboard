import React, { useState, useRef, useEffect } from 'react';
import { Settings, Columns3, List, Eye, ChevronRight, Check, Settings2 } from 'lucide-react';

export default function ViewSettingsMenu({
  onManageColumns,
  onResetColumnSize,
  hasCustomColumnSize = false,
  pageSize = 100,
  onPageSizeChange,
  viewMode = 'wrap', // 'wrap' | 'clip'
  onViewModeChange,
}) {
  const [open, setOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState(null); // 'records' | 'viewMode' | null
  const menuRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        !triggerRef.current?.contains(e.target)
      ) {
        setOpen(false);
        setActiveSubmenu(null);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setActiveSubmenu(null);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const pageSizes = [10, 20, 30, 40, 50, 100];

  return (
    <div className="relative inline-block text-left">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
          setActiveSubmenu(null);
        }}
        className="h-7 w-7 inline-flex items-center justify-center rounded border border-line bg-white hover:bg-page transition-colors text-ink-600 mt-1 cursor-pointer"
        title="View Settings"
        aria-label="View Settings"
        aria-expanded={open}
      >
        <Settings2 size={15} />
      </button>

      {open && (
        <div
          ref={menuRef}
          className="absolute right-0 top-full mt-2 w-[220px] bg-white rounded-xl shadow-xl border border-line z-50 py-1.5 text-[13.5px] select-none
                     before:content-[''] before:absolute before:-top-1.5 before:right-2.5 before:w-3 before:h-3 before:bg-white before:border-t before:border-l before:border-line before:rotate-45 before:z-0"
        >
          {/* 1. Manage Columns */}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setActiveSubmenu(null);
              onManageColumns?.();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-ink-700 hover:bg-[#F2F5FA] hover:text-primary transition-colors text-left cursor-pointer"
          >
            <Settings size={15} className="text-ink-600 shrink-0" />
            <span className="font-medium">Manage Columns</span>
          </button>

          {/* 2. Reset Column Size */}
          <button
            type="button"
            disabled={!hasCustomColumnSize}
            onClick={() => {
              if (!hasCustomColumnSize) return;
              setOpen(false);
              setActiveSubmenu(null);
              onResetColumnSize?.();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
              hasCustomColumnSize
                ? 'text-ink-700 hover:bg-[#F2F5FA] hover:text-primary cursor-pointer'
                : 'text-ink-300 cursor-not-allowed'
            }`}
          >
            <Columns3 size={15} className={hasCustomColumnSize ? 'text-ink-500 shrink-0' : 'text-ink-300 shrink-0'} />
            <span className="font-medium">Reset Column Size</span>
          </button>

          <div className="h-px bg-line/80 my-1 mx-2" />

          {/* 3. Records Per Page with flyout submenu */}
          <div
            className="relative"
            onMouseEnter={() => setActiveSubmenu('records')}
          >
            <button
              type="button"
              onClick={() => setActiveSubmenu((curr) => (curr === 'records' ? null : 'records'))}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors cursor-pointer ${
                activeSubmenu === 'records' ? 'bg-[#F2F5FA] text-primary' : 'text-ink-700 hover:bg-[#F2F5FA]'
              }`}
            >
              <List size={15} className="text-ink-600 shrink-0" />
              <span className="font-medium">Records Per Page</span>
              <span className="ml-auto font-bold text-ink-800 text-[13px] mr-1">{pageSize}</span>
              <ChevronRight size={14} className="text-ink-400 shrink-0" />
            </button>

            {/* Submenu for Records Per Page */}
            {activeSubmenu === 'records' && (
              <div
                className="absolute right-full top-0 mr-1.5 w-[115px] bg-white rounded-xl shadow-xl border border-line py-1 z-50
                           after:content-[''] after:absolute after:top-3.5 after:-right-1.5 after:w-3 after:h-3 after:bg-white after:border-t after:border-r after:border-line after:rotate-45 after:z-0"
              >
                {pageSizes.map((sz) => {
                  const isSelected = pageSize === sz;
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => {
                        onPageSizeChange?.(sz);
                        setOpen(false);
                        setActiveSubmenu(null);
                      }}
                      className="w-full flex items-center px-3 py-1.5 text-[13px] text-ink-700 hover:bg-[#F2F5FA] hover:text-primary transition-colors text-left cursor-pointer"
                    >
                      <span className="w-4 flex items-center justify-center shrink-0 mr-1 text-ink-800">
                        {isSelected && <Check size={14} strokeWidth={2.5} />}
                      </span>
                      <span className={isSelected ? 'font-semibold text-ink-900' : 'font-normal'}>{sz}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. View Mode with flyout submenu */}
          <div
            className="relative"
            onMouseEnter={() => setActiveSubmenu('viewMode')}
          >
            <button
              type="button"
              onClick={() => setActiveSubmenu((curr) => (curr === 'viewMode' ? null : 'viewMode'))}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors cursor-pointer ${
                activeSubmenu === 'viewMode' ? 'bg-[#F2F5FA] text-primary' : 'text-ink-700 hover:bg-[#F2F5FA]'
              }`}
            >
              <Eye size={15} className="text-ink-600 shrink-0" />
              <span className="font-medium">View Mode</span>
              <span className="ml-auto font-bold text-ink-800 text-[13px] mr-1">
                {viewMode === 'wrap' ? 'Wrap Text' : 'Clip Text'}
              </span>
              <ChevronRight size={14} className="text-ink-400 shrink-0" />
            </button>

            {/* Submenu for View Mode */}
            {activeSubmenu === 'viewMode' && (
              <div
                className="absolute right-full top-0 mr-1.5 w-[140px] bg-white rounded-xl shadow-xl border border-line py-1 z-50
                           after:content-[''] after:absolute after:top-3.5 after:-right-1.5 after:w-3 after:h-3 after:bg-white after:border-t after:border-r after:border-line after:rotate-45 after:z-0"
              >
                {[
                  { key: 'wrap', label: 'Wrap Text' },
                  { key: 'clip', label: 'Clip Text' },
                ].map((mode) => {
                  const isSelected =
                    (viewMode === 'wrap' && mode.key === 'wrap') ||
                    (viewMode === 'clip' && mode.key === 'clip');
                  return (
                    <button
                      key={mode.key}
                      type="button"
                      onClick={() => {
                        onViewModeChange?.(mode.key);
                        setOpen(false);
                        setActiveSubmenu(null);
                      }}
                      className="w-full flex items-center px-3 py-1.5 text-[13px] text-ink-700 hover:bg-[#F2F5FA] hover:text-primary transition-colors text-left cursor-pointer"
                    >
                      <span className="w-4 flex items-center justify-center shrink-0 mr-1.5 text-ink-800">
                        {isSelected && <Check size={14} strokeWidth={2.5} />}
                      </span>
                      <span className={isSelected ? 'font-semibold text-ink-900' : 'font-normal'}>
                        {mode.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

