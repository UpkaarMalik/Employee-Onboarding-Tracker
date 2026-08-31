import { useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api';
import { GlassCard } from '../ui/GlassCard';

interface Progress {
  totalActiveSeconds: number;
  remainingSeconds: number;
  thresholdSeconds: number;
  taskStatus: string;
}

export function ReadingViewer({ taskId, title, content }: { taskId: string; title: string; content: string }) {
  const [progress, setProgress] = useState<Progress | null>(null);
  const lastHeartbeatRef = useRef<number>(Date.now());
  const isFocusedRef = useRef<boolean>(true);
  const completedRef = useRef<boolean>(false);

  useEffect(() => {
    api.get(`/reading/${taskId}/progress`).then((res) => setProgress(res.data));

    function handleVisibility() {
      isFocusedRef.current = document.visibilityState === 'visible';
    }
    document.addEventListener('visibilitychange', handleVisibility);

    const interval = setInterval(async () => {
      if (completedRef.current || !isFocusedRef.current) return;

      const now = Date.now();
      const elapsedSeconds = Math.round((now - lastHeartbeatRef.current) / 1000);
      lastHeartbeatRef.current = now;

      if (elapsedSeconds <= 0) return;

      try {
        const { data } = await api.post(`/reading/${taskId}/heartbeat`, {
          activeSeconds: elapsedSeconds,
        });
        setProgress(data);
        if (data.taskStatus === 'COMPLETED') {
          completedRef.current = true;
        }
      } catch {
        // Silently ignore a dropped heartbeat — next interval will retry
      }
    }, 15000); // ping every 15 seconds while in focus

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [taskId]);

  const percent = progress
    ? Math.min((progress.totalActiveSeconds / progress.thresholdSeconds) * 100, 100)
    : 0;

  return (
    <GlassCard className="p-8">
      <h2 className="mb-4 text-lg font-bold text-ink-900">{title}</h2>

      <div
        className="mb-6 max-h-[60vh] overflow-y-auto rounded-2xl bg-sand-50 p-6 text-sm leading-relaxed text-ink-700 select-none"
        onCopy={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
      >
        {content}
      </div>

      {progress && progress.taskStatus !== 'COMPLETED' && (
        <div>
          <div className="mb-1.5 flex justify-between text-xs text-ink-500">
            <span>Reading progress</span>
            <span>{Math.max(progress.remainingSeconds, 0)}s remaining</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-sand-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sage-400 to-sage-600 transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      )}

      {progress?.taskStatus === 'COMPLETED' && (
        <div className="rounded-xl bg-sage-50 px-4 py-3 text-sm font-medium text-sage-700">
          ✓ Marked as read
        </div>
      )}
    </GlassCard>
  );
}