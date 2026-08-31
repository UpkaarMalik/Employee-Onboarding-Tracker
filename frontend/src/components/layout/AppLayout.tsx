import { Outlet } from 'react-router-dom';
import { Topbar } from './Topbar';
import { ReminderPopup } from '../onboarding/ReminderPopup';
import { GlobeBackground } from './GlobeBackground';

export function AppLayout() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-sand-50">
      <GlobeBackground />
      <div className="relative z-10">
        <Topbar />
        <main className="mx-auto max-w-5xl px-6 py-8">
          <Outlet />
        </main>
        <ReminderPopup />
      </div>
    </div>
  );
}
