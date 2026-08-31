const NODES = [
  [190, 30], [110, 55], [270, 55], [55, 110], [325, 110], [25, 190], [355, 190],
  [55, 270], [325, 270], [110, 325], [270, 325], [190, 350],
  [140, 88], [240, 88], [88, 160], [292, 160], [140, 292], [240, 292],
  [190, 190], [126, 224], [254, 224], [158, 128], [222, 128],
];

const LINKS: [number, number][] = [
  [0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 6], [5, 7], [6, 8], [7, 9], [8, 10],
  [9, 11], [10, 11], [1, 12], [2, 13], [12, 13], [3, 14], [4, 15], [14, 18], [15, 18],
  [7, 19], [8, 20], [19, 18], [20, 18], [12, 21], [13, 22], [21, 18], [22, 18], [9, 19], [10, 20],
];

export function GlobeBackground({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none relative aspect-square overflow-hidden rounded-full
                  shadow-[0_0_100px_-10px_rgba(238,143,46,0.5)] ${className}`}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            'radial-gradient(circle at 50% 20%, #fff2e0 0%, #ffc179 20%, #ff9d4d 42%, #f5751e 70%, #8a3d0a 100%)',
        }}
      />

      <svg viewBox="0 0 380 380" width="100%" height="100%" className="absolute inset-0">
        <g stroke="rgba(255,255,255,0.45)" strokeWidth="0.75" fill="none">
          <circle cx="190" cy="190" r="188" stroke="rgba(122,61,14,0.55)" strokeWidth="1.5" />
          <line x1="2" y1="190" x2="378" y2="190" stroke="rgba(255,255,255,0.55)" />
          <ellipse cx="190" cy="190" rx="188" ry="62" />
          <ellipse cx="190" cy="190" rx="188" ry="118" />
          <ellipse cx="190" cy="190" rx="188" ry="162" />
          <ellipse cx="190" cy="190" rx="62" ry="188" />
          <ellipse cx="190" cy="190" rx="118" ry="188" />
          <ellipse cx="190" cy="190" rx="162" ry="188" />
        </g>
      </svg>

      <svg
        viewBox="0 0 380 380"
        width="100%"
        height="100%"
        className="absolute inset-0 animate-[spin_40s_linear_infinite]"
        style={{ transformOrigin: '50% 50%' }}
      >
        <g stroke="rgba(255,255,255,0.65)" strokeWidth="0.6">
          {LINKS.map(([a, b], i) => (
            <line key={i} x1={NODES[a][0]} y1={NODES[a][1]} x2={NODES[b][0]} y2={NODES[b][1]} />
          ))}
        </g>
        <g fill="#fff6e6">
          {NODES.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 2.8 : 1.8} opacity={0.95} />
          ))}
        </g>
      </svg>

      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            'radial-gradient(circle at 36% 24%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 30%),' +
            'radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 58%, rgba(74,39,8,0.5) 100%)',
        }}
      />
    </div>
  );
}
