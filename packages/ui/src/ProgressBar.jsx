// ProgressBar — a horizontal track that fills to value/max. Turns green once
// the requirement is met. Generalized from the app's credit bars, so it takes
// plain numbers instead of any grade-calculator shape.
//
// Props:
//   value    number  — current amount (e.g. earned credits)
//   max      number  — target amount (e.g. required credits)
//   met      boolean — optional; when omitted, derived as value >= max (max > 0)
//   label    string  — optional; overrides the default "value/max" text
//   showLabel boolean — set false to hide the inline label (default true)

export function ProgressBar({ value = 0, max = 0, met, label, showLabel = true, className = '' }) {
  // Percentage filled, clamped to 0–100. With no max but some value, show full.
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : value > 0 ? 100 : 0;
  // If `met` isn't passed explicitly, derive it from the numbers.
  const isMet = met ?? (max > 0 && value >= max);
  const text = label ?? `${value}/${max || 0}${isMet && max > 0 ? ' ✓' : ''}`;

  return (
    <div
      className={`relative h-[18px] min-w-[120px] overflow-hidden rounded-md bg-border ${className}`.trim()}
      title={`${value} of ${max}`}
    >
      <div
        className={`h-full transition-[width] duration-200 ease-out ${
          isMet ? 'bg-success' : 'bg-fill'
        }`}
        // Width is data-driven, so it's an inline style, not a class.
        style={{ width: `${pct}%` }}
      />
      {showLabel && (
        <span className="absolute right-2 top-0 font-sans text-[11px] leading-[18px] text-ink-strong">
          {text}
        </span>
      )}
    </div>
  );
}
