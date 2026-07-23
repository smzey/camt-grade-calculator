// ProgressBar — a horizontal track that fills to value/max. Generalized from the
// app's credit bars, so it takes plain numbers instead of any grade-calculator
// shape.
//
// Props:
//   value    number  — current amount (e.g. earned credits)
//   max      number  — target amount (e.g. required credits)
//   met      boolean — optional; when omitted, derived as value >= max (max > 0)
//   inProgress number — optional; amount underway (enrolled but not yet earned),
//            drawn as a lighter band continuing past the fill. Never counts
//            toward `met` — that stays value-only.
//   label    string  — optional; overrides the default "value/max" text
//   showLabel boolean — set false to hide the inline label (default true)
//   tone     'neutral' | 'copper' — fill style while in progress (default 'neutral').
//            Both turn solid green once met.
//   size     'md' | 'sm' — 'md' is the tall labeled bar; 'sm' is the thin 9px
//            category bar (usually paired with showLabel={false}).
//   className string — extra classes on the track (e.g. flex-1)

const COPPER_FILL = 'bg-[linear-gradient(90deg,var(--color-copper-soft),var(--color-copper))]';

export function ProgressBar({
  value = 0,
  max = 0,
  met,
  inProgress = 0,
  label,
  showLabel = true,
  tone = 'neutral',
  size = 'md',
  className = '',
}) {
  // Percentage filled, clamped to 0–100. With no max but some value, show full.
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : value > 0 ? 100 : 0;
  // Underway band: starts where the fill stops, clipped so it can't overflow.
  const ipPct = max > 0 ? Math.max(0, Math.min(100 - pct, (inProgress / max) * 100)) : 0;
  // If `met` isn't passed explicitly, derive it from the numbers.
  const isMet = met ?? (max > 0 && value >= max);
  const text = label ?? `${value}/${max || 0}${isMet && max > 0 ? ' ✓' : ''}`;

  const trackSize = size === 'sm' ? 'h-[9px] rounded-[6px] bg-track' : 'h-[18px] rounded-md bg-border';
  // Fill color: met always wins (green); otherwise the tone decides.
  const fillColor = isMet ? 'bg-success' : tone === 'copper' ? COPPER_FILL : 'bg-fill';

  return (
    <div
      className={`relative min-w-[120px] overflow-hidden ${trackSize} ${className}`.trim()}
      title={`${value} of ${max}${inProgress > 0 ? ` (+${inProgress} underway)` : ''}`}
    >
      {/* No radius on the fill: the track is rounded and clips it already, and
          a rounded trailing edge pinches where the underway band meets it. */}
      <div
        className={`h-full transition-[width] duration-200 ease-out ${fillColor}`}
        // Width is data-driven, so it's an inline style, not a class.
        style={{ width: `${pct}%` }}
      />
      {ipPct > 0 && (
        <span
          className="camt-underway"
          // A 2px rule would swamp a 9px bar, so the thin size gets a hairline.
          style={{
            insetInlineStart: `${pct}%`,
            width: `${ipPct}%`,
            // No fill before it => nothing to divide, so no divider.
            '--underway-edge': pct === 0 ? '0' : size === 'sm' ? '1px' : '2px',
          }}
        />
      )}
      {showLabel && (
        <span className="absolute right-2 top-0 font-sans text-[11px] leading-[18px] text-ink-strong">
          {text}
        </span>
      )}
    </div>
  );
}
