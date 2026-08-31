import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { GlobeBackground } from './GlobeBackground';
import { ReminderPopup } from '../onboarding/ReminderPopup';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden bg-sand-50">
      <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden opacity-55">
        <GlobeBackground className="w-[220px] sm:w-[280px] lg:w-[460px]" />
      </div>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="relative z-10 lg:pl-64">
        <Topbar onMenuClick={() => setSidebarOpen((o) => !o)} />
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <Outlet />
        </main>
        <ReminderPopup />
      </div>
    </div>
  );
}
