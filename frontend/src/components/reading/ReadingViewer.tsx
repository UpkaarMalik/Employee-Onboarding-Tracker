import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../../lib/api';
import { GlassCard } from '../ui/GlassCard';

interface Progress {
  totalActiveSeconds: number;
  remainingSeconds: number;
  thresholdSeconds: number;
  taskStatus: string;
}

function buildReadingPreviewHtml(title: string, content: string) {
  const titleEscaped = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const contentEscaped = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <style>
          :root {
            color-scheme: light;
            --bg: #f6f1ea;
            --panel: #ffffff;
            --text: #1f2430;
            --muted: #667085;
            --line: #e8e0d5;
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            background: var(--bg);
            color: var(--text);
            font-family: Inter, Segoe UI, sans-serif;
            padding: 56px 72px;
          }
          .page {
            max-width: 980px;
            margin: 0 auto;
            background: var(--panel);
            border: 2px solid var(--line);
            border-radius: 18px;
            box-shadow: 0 10px 30px rgba(17, 24, 39, 0.06);
            padding: 64px 72px 80px;
          }
          .label {
            margin: 0 0 12px;
            color: var(--muted);
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.18em;
            text-transform: uppercase;
          }
          h1 {
            margin: 0 0 20px;
            font-size: clamp(2.5rem, 4vw, 5rem);
            line-height: 1.04;
            letter-spacing: -0.05em;
            font-weight: 800;
          }
          .content {
            margin: 0;
            color: var(--text);
            font-size: 1.05rem;
            line-height: 1.8;
            white-space: pre-wrap;
            word-wrap: break-word;
          }
        </style>
      </head>
      <body>
        <div class="page">
          <p class="label">Learning material</p>
          <h1>${titleEscaped}</h1>
          <div class="content">${contentEscaped}</div>
        </div>
      </body>
    </html>
  `;
}

export function ReadingViewer({ taskId, title, content }: { taskId: string; title: string; content: string }) {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [showPreview, setShowPreview] = useState(true);
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
    <>
      <GlassCard className="p-8">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-ink-900">{title}</h2>
            <p className="mt-1 text-xs text-ink-500">Open the reading preview to begin tracking your reading time.</p>
          </div>

          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-sage-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-sage-700 focus:outline-none focus:ring-2 focus:ring-sage-300"
          >
            Open reading preview
          </button>

          {progress && progress.taskStatus !== 'COMPLETED' && (
            <div className="pt-4">
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
        </div>
      </GlassCard>

      {showPreview && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-navy-950/55 p-3 sm:p-5 lg:pl-[19rem] lg:pr-8"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="w-full max-w-6xl overflow-hidden rounded-3xl border border-sand-200 bg-white shadow-[0_28px_80px_-18px_rgba(15,23,42,0.45)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-sand-200 px-4 py-3 sm:px-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">Reading view</p>
                <h3 className="text-base font-semibold text-ink-900">{title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-ink-500 transition-colors hover:bg-sand-100 hover:text-ink-700"
                aria-label="Close preview"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-sand-50 p-3 sm:p-4 lg:p-5">
              <div className="h-[72vh] overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-inner">
                <iframe
                  title={title}
                  srcDoc={buildReadingPreviewHtml(title, content)}
                  className="h-full w-full border-0 bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-sand-200 px-4 py-3 text-xs text-ink-500 sm:px-6">
              {progress && progress.taskStatus !== 'COMPLETED' && (
                <div className="flex-1">
                  <div className="mb-1.5 flex justify-between text-xs text-ink-500">
                    <span>Reading progress</span>
                    <span>{Math.max(progress.remainingSeconds, 0)}s remaining</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-sand-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sage-400 to-sage-600 transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              )}
              {progress?.taskStatus === 'COMPLETED' && (
                <span className="text-sage-700 font-medium">✓ Reading completed</span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}