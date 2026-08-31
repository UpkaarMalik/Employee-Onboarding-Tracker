export function PermissionDenied({
  message = "You don't have permission to view this page.",
}: {
  message?: string;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-clay-100 text-clay-600">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-ink-900">Access restricted</h2>
      <p className="max-w-sm text-sm text-ink-500">{message}</p>
    </div>
  );
}