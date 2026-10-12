import { GripVertical } from 'lucide-react';

/**
 * Vertical drag handle divider between a sidebar/panel and main content.
 */
export function ResizeDivider({ onMouseDown, onDoubleClick, isDragging, title = 'Drag to resize panel (double-click to reset)' }) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      title={title}
      onMouseDown={onMouseDown}
      onTouchStart={onMouseDown}
      onDoubleClick={onDoubleClick}
      className={`group relative w-[8px] shrink-0 cursor-col-resize select-none flex items-center justify-center transition-colors ${
        isDragging ? 'bg-[#2F55D4]/15' : 'hover:bg-[#2F55D4]/10'
      }`}
    >
      <div
        className={`w-[2px] h-full transition-colors ${
          isDragging ? 'bg-[#2F55D4]' : 'bg-transparent group-hover:bg-[#2F55D4]/60'
        }`}
      />
      <div
        className={`absolute top-1/2 -translate-y-1/2 h-7 w-3.5 rounded bg-white border shadow-xs flex items-center justify-center transition-opacity ${
          isDragging
            ? 'opacity-100 border-[#2F55D4] text-[#2F55D4]'
            : 'opacity-70 group-hover:opacity-100 border-[#CBD5E1] text-[#64748B] group-hover:border-[#2F55D4] group-hover:text-[#2F55D4]'
        }`}
      >
        <GripVertical size={11} />
      </div>
    </div>
  );
}

