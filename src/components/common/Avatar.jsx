import { initials } from '../../utils/calculations';
import { USERS } from '../../data/seedData';

const SOFT = ['#E8F1FF', '#F1E9FF', '#FFEDE0', '#DFF6EA', '#FFE5EC', '#DCF5F1', '#FFF3D3', '#EAE8FF'];
const INK = ['#1262E0', '#7C3AED', '#EE6A1F', '#0E9F5E', '#E0245E', '#0F8F80', '#C98500', '#4F46E5'];
const hash = (s = '') => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

const SIZE_MAP = { xs: 24, sm: 28, md: 32, lg: 38 };

export function UserAvatar({ userId, size = 32, withName, showName, className = '' }) {
  const u = USERS.find((x) => x.id === userId);
  const name = u?.name || 'Unassigned';
  const numSize = typeof size === 'number' ? size : SIZE_MAP[size] || 30;
  const displayWithName = withName || showName;
  return (
    <span className={`inline-flex items-center gap-2.5 min-w-0 ${className}`} title={name}>
      <span
        className="rounded-full inline-flex items-center justify-center text-white font-semibold shrink-0 ring-2 ring-white shadow-[0_0_0_1px_#DFE8F5]"
        style={{ width: numSize, height: numSize, fontSize: numSize * 0.36, background: `linear-gradient(145deg, ${u?.color || '#7A839F'}, ${u?.color || '#7A839F'}CC)` }}
      >
        {initials(name)}
      </span>
      {displayWithName && <span className="truncate text-ink">{name}</span>}
    </span>
  );
}

export function AccountLogo({ account, size = 30 }) {
  const name = account?.name || '?';
  const numSize = typeof size === 'number' ? size : SIZE_MAP[size] || 30;
  const label = initials(name).length > 1 && name.split(' ')[0].length <= 3 ? name.split(' ')[0].slice(0, 3).toUpperCase() : initials(name);
  return (
    <span className="rounded-full inline-flex items-center justify-center text-white font-semibold shrink-0" style={{ width: numSize, height: numSize, fontSize: label.length > 2 ? numSize * 0.32 : numSize * 0.38, background: account?.color || '#1262E0' }}>
      {label}
    </span>
  );
}

const SOLID = ['#5B6B9A', '#A855F7', '#E0245E', '#7C3AED', '#14B8A6', '#334A80', '#6D7FA8', '#9333EA', '#C026D3', '#3B82F6'];

export function PersonAvatar({ name = '', size = 36, solid }) {
  const numSize = typeof size === 'number' ? size : SIZE_MAP[size] || 36;
  const h = hash(name) % SOFT.length;
  const style = solid
    ? { width: numSize, height: numSize, fontSize: numSize * 0.34, background: SOLID[hash(name) % SOLID.length], color: '#fff' }
    : { width: numSize, height: numSize, fontSize: numSize * 0.36, background: SOFT[h], color: INK[h] };
  return (
    <span className="rounded-full inline-flex items-center justify-center font-semibold shrink-0" style={style}>
      {initials(name)}
    </span>
  );
}
