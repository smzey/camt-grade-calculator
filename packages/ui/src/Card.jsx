// Card — a surface/panel: white background, border, rounded corners, soft
// shadow. The building block the original app's sticky top bar was made of.
//
// Props:
//   as        string  — element/tag to render (default 'div'); pass 'header',
//                        'section', etc. to keep semantics while getting the look
//   padded    boolean — include the default inner padding (default true). Pass
//                        false when the card's sections manage their own padding.
//   children, className, and any other props pass straight through to the element.

export function Card({ as: Tag = 'div', padded = true, children, className = '', ...rest }) {
  const pad = padded ? 'p-4' : '';
  return (
    <Tag
      className={`bg-surface border border-border rounded-xl ${pad} shadow-sm font-sans text-ink ${className}`.trim()}
      {...rest}
    >
      {children}
    </Tag>
  );
}
