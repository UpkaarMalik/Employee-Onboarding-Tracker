import { Button } from '../ui/Button';

export function NoInternetState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sand-200 text-ink-500">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 9l2 2c4.9-4.9 12.1-4.9 17 0l2-2C15.9 2.9 8.1 2.9 1 9z" />
          <path d="M5 13l2 2a7.1 7.1 0 0 1 10 0l2-2a10.1 10.1 0 0 0-14 0z" />
          <line x1="2" y1="2" x2="22" y2="22" strokeLinecap="round" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-ink-900">No internet connection</h2>
      <p className="max-w-sm text-sm text-ink-500">Check your connection and try again.</p>
      <Button variant="secondary" onClick={onRetry}>Retry</Button>
    </div>
  );
}