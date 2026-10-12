import { MoreHorizontal, MoreVertical } from 'lucide-react';
import Dropdown, { MenuDivider, MenuItem } from './Dropdown';

/** items: [{ label, icon, onClick, danger, divider }] */
export default function ActionMenu({ items, vertical, boxed = true, label = 'More actions', width = 200 }) {
  const Icon = vertical ? MoreVertical : MoreHorizontal;
  return (
    <Dropdown
      align="right"
      width={width}
      trigger={
        <button type="button" aria-label={label} className={boxed ? 'icon-btn' : 'p-1.5 rounded-md text-ink-500 hover:bg-page'}>
          <Icon size={17} />
        </button>
      }
    >
      {(close) => items.filter(Boolean).map((it, i) => (it.divider ? <MenuDivider key={i} /> : <MenuItem key={i} {...it} close={close}>{it.label}</MenuItem>))}
    </Dropdown>
  );
}
