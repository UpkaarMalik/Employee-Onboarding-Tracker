export function LoadingState({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div className="relative h-10 w-10">
        <div className="absolute inset-0 rounded-full border-4 border-sand-200" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-sage-500 animate-spin" />
      </div>
      <p className="text-sm text-ink-500">{message}</p>
    </div>
  );
}