import React from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

/**
 * Reusable Left-Side Panel / Sidebar Show/Hide Toggle Button
 * Conforms to Zoho CRM specification with:
 * - Uniform design across Contacts, Accounts, Deals, Zoho Finance, Calls
 * - "Hide Sidebar" and "Show Sidebar" tooltips
 * - Smooth state transitions
 * - Supports compact size for Subheaders (h-7 w-7) and toolbar size (h-10 w-10)
 */
export default function SidebarToggleButton({
  isOpen = true,
  onToggle,
  size = 'sm', // 'sm' (h-7 w-7 for details subheaders) | 'md' (h-10 w-10 for toolbars)
  className = '',
  title
}) {
  const tooltipText = title || (isOpen ? 'Hide Sidebar' : 'Show Sidebar');
  const sizeClasses = size === 'md'
    ? 'h-10 w-10 rounded-lg text-[14px]'
    : 'h-7 w-7 rounded-md text-[12px]';

  const iconSize = size === 'md' ? 17 : 14;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`${sizeClasses} border border-line bg-white hover:bg-slate-100 flex items-center justify-center text-ink-600 hover:text-ink transition-all shadow-2xs shrink-0 cursor-pointer ${
        !isOpen ? 'bg-primary-50 text-primary border-primary/40' : ''
      } ${className}`}
      title={tooltipText}
      aria-label={tooltipText}
      aria-expanded={isOpen}
    >
      {isOpen ? (
        <PanelLeftClose size={iconSize} className="transition-transform duration-200" />
      ) : (
        <PanelLeftOpen size={iconSize} className="transition-transform duration-200" />
      )}
    </button>
  );
}

