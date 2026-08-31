/**
 * Ambient rotating-globe decoration — a "glass" circular panel with a
 * continuously scrolling landmass strip behind a static radial-shading
 * overlay. The scroll (rather than a true 3D transform) is what sells the
 * spin illusion without pulling in a WebGL/three.js dependency for one
 * decorative background element.
 */
export function GlobeBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed -top-24 -right-24 z-0 h-[420px] w-[420px] overflow-hidden rounded-full
                 border border-white/50 bg-gradient-to-br from-white/40 to-butter-300/20 shadow-[0_20px_80px_-20px_rgba(232,190,85,0.35)]
                 backdrop-blur-2xl opacity-70"
    >
      <div className="absolute inset-0 animate-[globe-spin_26s_linear_infinite]">
        <svg viewBox="0 0 840 420" width="840" height="420" className="h-full w-[200%]">
          <defs>
            <linearGradient id="ocean" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e2f0fb" />
              <stop offset="100%" stopColor="#c3e0f6" />
            </linearGradient>
          </defs>
          <rect width="840" height="420" fill="url(#ocean)" />
          {[0, 420].map((offset) => (
            <g key={offset} fill="#e8be55" opacity="0.9">
              <ellipse cx={offset + 70} cy={140} rx="46" ry="60" />
              <ellipse cx={offset + 150} cy={260} rx="60" ry="40" />
              <ellipse cx={offset + 250} cy={120} rx="38" ry="50" />
              <ellipse cx={offset + 320} cy={300} rx="50" ry="34" />
              <ellipse cx={offset + 380} cy={180} rx="34" ry="46" />
            </g>
          ))}
        </svg>
      </div>
      {/* Static sphere shading — sells the roundness, doesn't move */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 40%),' +
            'radial-gradient(circle at 65% 75%, rgba(157,105,45,0.25) 0%, rgba(157,105,45,0) 55%),' +
            'radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 60%, rgba(41,74,65,0.18) 100%)',
        }}
      />
    </div>
  );
}
