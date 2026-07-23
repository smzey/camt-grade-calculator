// CreditSpine — a proportional segmented meter: one bar standing for a whole
// (a degree's total credits), split into segments whose WIDTH is each segment's
// share of that whole, and whose FILL is how much of it you've earned.
//
// Why width-proportional rather than N equal gauges: the segments are usually
// nothing like equal (this curriculum is 90 / 30 / 6 credits), and equal-size
// gauges assert a symmetry the data doesn't have. Here the biggest requirement
// simply looks biggest.
//
// Color encodes STATE, not identity — every segment uses the same copper fill
// while in progress and the same olive once met. Which segment is which comes
// from position and the label underneath, so the free hue channel isn't spent
// re-stating something the layout already says.
//
// Copper and olive are ~indistinguishable under deuteranopia (OKLab ΔE ≈ 4.4),
// so "met" ALSO carries a ✓ glyph. Never rely on the color alone.
//
// Props:
//   segments  Array<{ key, label, value, max, met, inProgress }>
//             inProgress = credits currently being studied. Drawn as a lighter
//             band continuing past the earned fill, so "underway" is visibly
//             distinct from "done" and never counts toward met.
//   selected  string   — key of the focused segment
//   onSelect  (key) => void — omit to render a non-interactive meter
//   animate   boolean  — grow the fills on mount (default true)
//   className string   — extra classes on the wrapper
//   segmentLabel (seg) => string — accessible description of one segment

import { useEffect, useState } from 'react';

// Same gradient the ProgressBar uses, so bars and spine read as one system.
const COPPER_FILL = 'bg-[linear-gradient(90deg,var(--color-copper-soft),var(--color-copper))]';

// Smallest a segment may render. A strictly proportional 6-of-126 segment is
// ~38px on a desktop card — below the 44px minimum touch target, and far too
// narrow to sit a label under. Tiny segments round up to this, which slightly
// overstates the smallest requirement; the printed credit count beside the
// label is always exact. Labels may also spill past their column (see
// theme.css) so this floor can stay small enough to keep the distortion minor.
const MIN_SEGMENT_PX = 76;

export function CreditSpine({
  segments = [],
  selected,
  onSelect,
  animate = true,
  className = '',
  segmentLabel,
}) {
  // Fills start empty and grow once mounted, so the meter draws itself in.
  // Users with reduced-motion get the final state immediately (see theme.css:
  // the transition itself is disabled there, so this just sets the width).
  const [grown, setGrown] = useState(!animate);
  useEffect(() => {
    if (animate) {
      const id = requestAnimationFrame(() => setGrown(true));
      return () => cancelAnimationFrame(id);
    }
  }, [animate]);

  const interactive = typeof onSelect === 'function';

  return (
    <div className={`camt-spine ${className}`.trim()}>
      <div className="flex items-stretch gap-0.5">
        {segments.map((seg, i) => {
          const pct = seg.max > 0 ? Math.min(100, (seg.value / seg.max) * 100) : 0;
          // The in-progress band starts where the earned fill stops and is
          // clipped at 100%, so over-enrolling can't overflow the track.
          const ipPct =
            seg.max > 0
              ? Math.max(0, Math.min(100 - pct, ((seg.inProgress || 0) / seg.max) * 100))
              : 0;
          const isSel = seg.key === selected;
          const Tag = interactive ? 'button' : 'div';
          return (
            <Tag
              key={seg.key}
              {...(interactive
                ? { type: 'button', onClick: () => onSelect(seg.key), 'aria-pressed': isSel }
                : {})}
              aria-label={segmentLabel ? segmentLabel(seg) : undefined}
              className={`camt-spine-seg${isSel ? ' is-selected' : ''}`}
              // flexGrow carries the proportion; basis 0 so grow alone decides.
              style={{ flexGrow: seg.max || 1, flexBasis: 0, minWidth: MIN_SEGMENT_PX }}
            >
              <span className="camt-spine-track">
                <span
                  className={`camt-spine-fill ${seg.met ? 'bg-success' : COPPER_FILL}`}
                  style={{
                    // width drives the horizontal spine; --fill-pct drives the
                    // vertical (mobile) one, where the fill grows in height.
                    width: grown ? `${pct}%` : '0%',
                    '--fill-pct': grown ? `${pct}%` : '0%',
                    // Stagger left-to-right so the bar reads as one gesture.
                    transitionDelay: `${i * 90}ms`,
                  }}
                />
                {/* Credits underway: begins exactly where the earned fill ends,
                    in the lighter copper wash with a rule on its leading edge
                    (see theme.css). */}
                {ipPct > 0 && (
                  <span
                    className="camt-underway"
                    style={{
                      insetInlineStart: grown ? `${pct}%` : '0%',
                      width: grown ? `${ipPct}%` : '0%',
                      '--fill-pct': grown ? `${ipPct}%` : '0%',
                      '--fill-start': grown ? `${pct}%` : '0%',
                      // With nothing earned the band sits at the track's edge,
                      // where the rule would land on the rounded corner and
                      // read as a nick. Nothing to divide, so no divider.
                      '--underway-edge': pct > 0 ? '2px' : '0',
                      transitionDelay: `${i * 90}ms`,
                    }}
                  />
                )}
                {/* Non-color signal for "met" — required, not decorative. */}
                {seg.met && (
                  <span className="camt-spine-check" aria-hidden="true">
                    ✓
                  </span>
                )}
              </span>
            </Tag>
          );
        })}
      </div>

      {/* Direct labels, aligned to their segments (only 3 — a legend would be
          an extra lookup for nothing). */}
      <div className="flex items-start gap-0.5">
        {segments.map((seg) => (
          <div
            key={seg.key}
            className={`camt-spine-label${seg.key === selected ? ' is-selected' : ''}`}
            style={{ flexGrow: seg.max || 1, flexBasis: 0, minWidth: MIN_SEGMENT_PX }}
          >
            <span className="camt-spine-label-name" title={seg.label}>
              {seg.label}
            </span>
            <span className="camt-spine-label-num">{seg.max}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
