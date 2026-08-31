import { Button } from '../ui/Button';

export function SessionExpired({ onLoginAgain }: { onLoginAgain: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-butter-300/40 text-clay-600">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-ink-900">Your session has expired</h2>
      <p className="max-w-sm text-sm text-ink-500">
        For your security, you've been signed out. Please log in again to continue.
      </p>
      <Button onClick={onLoginAgain}>Log in again</Button>
    </div>
  );
}