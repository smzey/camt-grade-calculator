// SegmentedToggle — a pill-shaped multi-option switch (the WIL/IS toggle). The
// active segment is charcoal-on-white; the rest are transparent. Generalized to
// any short list of options.
//
// Props:
//   options  Array<{ value: string, label: ReactNode }>
//   value    string   — the currently-selected option value
//   onChange (value) => void
//   className string  — extra classes on the pill track

export function SegmentedToggle({ options = [], value, onChange, className = '' }) {
  return (
    <div className={`inline-flex gap-0.5 rounded-full bg-surface-2 p-[3px] ${className}`.trim()}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange?.(o.value)}
            className={`cursor-pointer rounded-full px-4 py-1.5 font-sans text-[12px] font-bold transition-colors ${
              active ? 'bg-ink text-white' : 'bg-transparent text-muted'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
