import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function MainLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="min-h-screen bg-page">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="lg:pl-[204px] min-w-0">
        <Topbar onMenu={() => setMenuOpen(true)} />
        <main className="px-3 sm:px-[18px] pt-2.5 pb-6 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
