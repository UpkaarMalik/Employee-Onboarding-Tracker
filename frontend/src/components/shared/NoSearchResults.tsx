export function NoSearchResults({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sand-100 text-ink-400">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" strokeLinecap="round" />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-ink-900">No results for "{query}"</h3>
      <p className="text-sm text-ink-500">Try a different search term.</p>
    </div>
  );
}