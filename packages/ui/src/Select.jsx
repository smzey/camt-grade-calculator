// Select — a styled wrapper around the native <select>. Keeps native behavior
// (keyboard, optgroups, form semantics) and just applies the design system's
// look. Children are your <option>/<optgroup> elements; all other props
// (value, onChange, disabled, name, ...) forward to the underlying <select>.

export function Select({ children, className = '', ...rest }) {
  return (
    <select
      className={`rounded-sm border border-border-strong bg-surface px-1.5 py-1 font-sans text-sm text-ink disabled:cursor-not-allowed disabled:opacity-60 ${className}`.trim()}
      {...rest}
    >
      {children}
    </select>
  );
}
