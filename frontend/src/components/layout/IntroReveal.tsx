import { useEffect, useState } from 'react';

const SESSION_KEY = 'introRevealShown';

/** A brief, once-per-session branded reveal before the dashboard content mounts. */
export function useIntroReveal(): boolean {
  const [showing, setShowing] = useState(() => !sessionStorage.getItem(SESSION_KEY));

  useEffect(() => {
    if (!showing) return;
    sessionStorage.setItem(SESSION_KEY, '1');
    const timeout = setTimeout(() => setShowing(false), 900);
    return () => clearTimeout(timeout);
  }, [showing]);

  return showing;
}

export function IntroReveal() {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gradient-to-br from-lavender-600 via-lavender-500 to-sky-500 animate-[fade-out_0.35s_ease-out_0.5s_forwards]">
      <div className="flex h-16 w-16 animate-reveal-scale items-center justify-center rounded-3xl bg-white/15 text-white ring-1 ring-white/30 backdrop-blur-sm">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2 3 7l9 5 9-5-9-5z" />
          <path d="M3 12l9 5 9-5M3 17l9 5 9-5" />
        </svg>
      </div>
    </div>
  );
}
