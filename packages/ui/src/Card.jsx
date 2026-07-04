// Card — a surface/panel: white background, border, rounded corners, soft
// shadow. The building block the original app's sticky top bar was made of.
//
// Props:
//   as        string — the element/tag to render (default 'div'); pass 'header',
//                       'section', etc. to keep semantics while getting the look
//   children, className, and any other props pass straight through to the element.

export function Card({ as: Tag = 'div', children, className = '', ...rest }) {
  return (
    <Tag
      className={`bg-surface border border-border rounded-xl p-4 shadow-sm font-sans text-ink ${className}`.trim()}
      {...rest}
    >
      {children}
    </Tag>
  );
}
