// StatCard — a centered tile showing one big number with a caption and an
// optional sub-line. Generalized from the app's two GPA boxes: the plain one is
// tone="default", the highlighted one is tone="accent".
//
// Props:
//   value  ReactNode — the headline value (already formatted, e.g. "3.45" or "—")
//   label  string    — the uppercase caption under the value
//   sub    ReactNode — optional smaller line under the caption (e.g. "42 cr")
//   tone   'default' | 'accent'

export function StatCard({ value, label, sub, tone = 'default', className = '' }) {
  const toneClass = tone === 'accent' ? 'bg-surface-accent' : 'bg-surface-2';

  return (
    <div
      className={`flex-1 rounded-lg px-3.5 py-2.5 text-center font-sans ${toneClass} ${className}`.trim()}
    >
      <div className="text-[26px] font-bold text-ink">{value}</div>
      <div className="text-xs uppercase tracking-[0.04em] text-muted">{label}</div>
      {sub != null && <div className="text-xs text-subtle">{sub}</div>}
    </div>
  );
}
