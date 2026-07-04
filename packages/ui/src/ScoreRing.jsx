// ScoreRing — a radial gauge: a 76px ring whose arc fills to `percent`, with an
// inner white disc showing the percent (or a ✓ when met) over a small sublabel.
// The arc is copper while in progress, olive-green once met. Generalized for any
// "X% complete" gauge; the label underneath it is the consumer's job.
//
// Props:
//   percent   number  — 0–100 fill
//   met       boolean — show ✓ and use the green arc instead of copper
//   sublabel  ReactNode — small line under the big number (e.g. "12/30 cr")
//   selected  boolean — draw the focus halo ring
//   className string  — extra classes on the outer ring
//   plus any other props (onClick, etc.) spread onto the outer element.

export function ScoreRing({
  percent = 0,
  met = false,
  sublabel,
  selected = false,
  className = '',
  ...rest
}) {
  const fill = met ? 'var(--color-success)' : 'var(--color-copper)';
  return (
    <div
      className={`flex h-[76px] w-[76px] items-center justify-center rounded-full transition-shadow duration-150 ${className}`.trim()}
      style={{
        // Dynamic values -> inline style (a class can't carry the live percent).
        background: `conic-gradient(${fill} ${percent * 3.6}deg, var(--color-ring-track) 0deg)`,
        // Selected pillar: a white gap then a copper ring, so it reads as a
        // distinct border even where it sits over the copper arc.
        boxShadow: selected ? '0 0 0 2px #fff, 0 0 0 4px var(--color-copper)' : 'none',
      }}
      {...rest}
    >
      <div className="flex h-[58px] w-[58px] flex-col items-center justify-center rounded-full bg-surface font-display text-[16px] font-extrabold text-ink">
        {met ? '✓' : `${Math.round(percent)}%`}
        {sublabel != null && (
          <span className="font-sans text-[9.5px] font-semibold text-muted">{sublabel}</span>
        )}
      </div>
    </div>
  );
}
