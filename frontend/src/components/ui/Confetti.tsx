import { useEffect, useMemo, useState } from 'react';

const COLORS = ['#8862d9', '#3f8bcf', '#4f8e78', '#e8be55', '#d97748', '#a284e6'];
const PIECE_COUNT = 90;

interface Piece {
  id: number;
  left: number;
  color: string;
  delay: number;
  duration: number;
  drift: number;
  size: number;
  shape: 'rect' | 'circle';
}

/** A one-shot confetti burst — mount with `fire` true, unmounts itself after the animation settles. */
export function Confetti({ fire, onDone }: { fire: boolean; onDone?: () => void }) {
  const [visible, setVisible] = useState(fire);

  const pieces = useMemo<Piece[]>(() => {
    if (!fire) return [];
    return Array.from({ length: PIECE_COUNT }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: COLORS[i % COLORS.length],
      delay: Math.random() * 0.4,
      duration: 2.2 + Math.random() * 1.2,
      drift: (Math.random() - 0.5) * 160,
      size: 6 + Math.random() * 6,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }));
  }, [fire]);

  useEffect(() => {
    if (!fire) return;
    setVisible(true);
    const timeout = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 3600);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fire]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-0"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.shape === 'rect' ? p.size * 2.4 : p.size,
            backgroundColor: p.color,
            borderRadius: p.shape === 'circle' ? '9999px' : '2px',
            animation: `confetti-fall ${p.duration}s cubic-bezier(0.35,0.4,0.6,1) ${p.delay}s forwards`,
            ['--drift' as string]: `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}
