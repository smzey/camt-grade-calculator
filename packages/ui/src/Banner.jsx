// Banner — a full-width inline message strip. Generalized from the app's red
// error banner into three tones.
//
// Props:
//   tone     'error' | 'info' | 'success'
//   children ReactNode

const TONES = {
  error: 'bg-danger-bg border-danger-border text-danger-ink',
  info: 'bg-info-bg border-info-border text-info-ink',
  success: 'bg-ok-bg border-ok-border text-ok-ink',
};

export function Banner({ tone = 'error', className = '', children, ...rest }) {
  return (
    <div
      role="alert"
      className={`rounded-md border px-3 py-2 font-sans text-sm ${TONES[tone] ?? TONES.error} ${className}`.trim()}
      {...rest}
    >
      {children}
    </div>
  );
}
