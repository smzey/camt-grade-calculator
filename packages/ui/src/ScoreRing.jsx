// ScoreRing — a radial gauge: a 76px ring whose arc fills to `percent`, with the
// percent (or a ✓ when met) over a small sublabel in the middle. The arc is
// copper while in progress, olive-green once met. Generalized for any
// "X% complete" gauge; the label underneath it is the consumer's job.
//
// The arc is an SVG circle rather than a conic-gradient so it can have a rounded
// cap and animate: stroke-dashoffset is a transitionable property, a
// conic-gradient's angle is not. The circle is drawn from 12 o'clock by rotating
// the whole <svg> -90°, and the arc length is set by holding stroke-dasharray at
// the full circumference and pulling stroke-dashoffset back toward 0.
//
// Props:
//   percent   number  — 0–100 fill
//   met       boolean — show ✓ and use the green arc instead of copper
//   sublabel  ReactNode — small line under the big number (e.g. "12/30 cr")
//   selected  boolean — draw the focus halo ring
//   className string  — extra classes on the outer ring
//   plus any other props (onClick, etc.) spread onto the outer element.

const R = 31.5; // arc radius; 76px box - 7px stroke leaves a hair of padding
const C = 2 * Math.PI * R; // circumference — the dasharray/dashoffset basis

export function ScoreRing({
  percent = 0,
  met = false,
  sublabel,
  selected = false,
  className = '',
  ...rest
}) {
  const fill = met ? 'var(--color-success)' : 'var(--color-copper)';
  const pct = Math.max(0, Math.min(100, percent));
  return (
    <div
      className={`relative h-[76px] w-[76px] rounded-full transition-shadow duration-150 ${className}`.trim()}
      style={{
        // Selected pillar: a white gap then a copper ring, so it reads as a
        // distinct border even where it sits over the copper arc.
        boxShadow: selected ? '0 0 0 2px #fff, 0 0 0 4px var(--color-copper)' : 'none',
      }}
      {...rest}
    >
      <svg width="76" height="76" viewBox="0 0 76 76" className="block -rotate-90">
        <circle cx="38" cy="38" r={R} fill="none" stroke="var(--color-ring-track)" strokeWidth="7" />
        <circle
          cx="38"
          cy="38"
          r={R}
          fill="none"
          stroke={fill}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={C.toFixed(2)}
          // Full offset = empty ring, 0 = complete ring.
          strokeDashoffset={(C * (1 - pct / 100)).toFixed(2)}
          style={{ transition: 'stroke-dashoffset .45s cubic-bezier(.4,0,.2,1)' }}
        />
      </svg>
      {/* pointer-events-none so the whole gauge stays one click target. */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-px">
        <span
          className="font-display text-[16px] font-extrabold leading-none"
          style={{ color: met ? 'var(--color-success)' : 'var(--color-ink)' }}
        >
          {met ? '✓' : `${Math.round(pct)}%`}
        </span>
        {sublabel != null && (
          <span className="font-sans text-[9.5px] font-semibold leading-none text-muted">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
