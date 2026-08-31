import { Outlet } from 'react-router-dom';
import { Topbar } from './Topbar';
import { ReminderPopup } from '../onboarding/ReminderPopup';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-sand-50">
      <Topbar />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Outlet />
      </main>
      <ReminderPopup />
    </div>
  );
}
