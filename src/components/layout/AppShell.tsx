import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import BottomNav from './BottomNav';

export default function AppShell() {
  return (
    <div className="min-h-screen bg-page flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 sticky top-0 h-screen">
        <Sidebar />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top bar (mobile + desktop) */}
        <TopBar />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto pb-24 lg:pb-6">
          <div className="max-w-5xl mx-auto px-4 py-4 lg:px-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
