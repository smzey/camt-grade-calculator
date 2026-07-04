// Badge — a small inline label for units, hints, or chips. Generalized from the
// app's credit/caption text.
//
// Props:
//   variant  'default' | 'muted' | 'pill'
//     default — subtle gray inline text (units like "3 cr")
//     muted   — slightly stronger gray
//     pill    — filled rounded chip
//   children ReactNode

const VARIANTS = {
  default: 'text-subtle',
  muted: 'text-muted',
  pill: 'px-2 py-0.5 rounded-full bg-surface-2 text-ink-strong',
};

export function Badge({ variant = 'default', className = '', children, ...rest }) {
  return (
    <span
      className={`inline-block font-sans text-xs ${VARIANTS[variant] ?? VARIANTS.default} ${className}`.trim()}
      {...rest}
    >
      {children}
    </span>
  );
}
