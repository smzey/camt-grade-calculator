# @camt/ui — CAMT Design System

A small, standalone React component library built with **Tailwind CSS v4**. It's
the reusable, on-brand version of the presentational pieces that started life
inline in the grade-calculator client (`ProgressBar`, the GPA boxes, the styled
select, the error banner). Because it's a real package with its own library
build, any app can consume it — and a future `/design-sync` can import it into
claude.ai/design so the design agent builds with these exact components.

## What's in the box

| Component     | Generalized from        | Purpose                                         |
| ------------- | ----------------------- | ----------------------------------------------- |
| `Card`        | the sticky top bar      | A surface/panel: bordered, rounded, soft shadow |
| `ProgressBar` | category credit bars    | Track that fills to `value/max`; green when met |
| `StatCard`    | the two GPA boxes       | Big number + caption + optional sub-line        |
| `Select`      | the grade dropdown look | Styled wrapper around a native `<select>`       |
| `Badge`       | credit/caption text     | Small inline label or filled chip               |
| `Banner`      | the red error banner    | Full-width message strip in 3 tones             |

## Build

```bash
npm install
npm run build     # emits dist/camt-ui.js, dist/camt-ui.umd.cjs, dist/camt-ui.css
```

- `camt-ui.js` — ES module (import from a bundler)
- `camt-ui.umd.cjs` — UMD build; in a plain `<script>` the whole library is on
  `window.CamtUI`
- `camt-ui.css` — the compiled styles (Tailwind utilities we actually use + the
  token variables). **React is not bundled** — the consuming app provides it.

## Usage

```jsx
import { Card, ProgressBar, StatCard, Select, Badge, Banner } from '@camt/ui';
import '@camt/ui/styles.css'; // once, at your app root

function Example() {
  return (
    <Card>
      <StatCard value="3.45" label="GPA (actual)" sub="42 cr" tone="accent" />
      <ProgressBar value={9} max={12} />
      <Select value="A" onChange={() => {}}>
        <option value="A">A</option>
        <option value="B+">B+</option>
      </Select>
      <Badge variant="pill">3 cr</Badge>
      <Banner tone="error">Something went wrong.</Banner>
    </Card>
  );
}
```

## Styling model (Tailwind v4, token-first)

There is **no `tailwind.config.js`**. All design tokens live in one `@theme`
block in [`src/theme.css`](src/theme.css). Each token is *both* a CSS variable
and a generator for a Tailwind utility, so there's a single source of truth:

| Token variable           | Utility it generates        | Value     |
| ------------------------ | --------------------------- | --------- |
| `--color-ink`            | `text-ink`                  | `#1f2937` |
| `--color-ink-strong`     | `text-ink-strong`           | `#374151` |
| `--color-muted`          | `text-muted`                | `#6b7280` |
| `--color-subtle`         | `text-subtle`               | `#9ca3af` |
| `--color-surface`        | `bg-surface`                | `#ffffff` |
| `--color-surface-2`      | `bg-surface-2`              | `#f1f5f9` |
| `--color-surface-accent` | `bg-surface-accent`         | `#eef2ff` |
| `--color-border`         | `border-border`             | `#e5e7eb` |
| `--color-border-strong`  | `border-border-strong`      | `#d1d5db` |
| `--color-fill`           | `bg-fill`                   | `#94a3b8` |
| `--color-success`        | `bg-success`                | `#22c55e` |
| `--radius-sm … xl`       | `rounded-sm … rounded-xl`   | `6–12px`  |
| `--shadow-sm`            | `shadow-sm`                 | soft      |

Status tones (`danger`, `info`, `ok`) each define `-bg` / `-border` / `-ink`
variables — see `theme.css` for the full list.

**To re-theme**, override any of these variables in your own CSS — every
component follows automatically because they're all built on these utilities.

## Component APIs

### `Card`

`children`, `className`, plus any `<div>` props (spread through).

### `ProgressBar`

| Prop        | Type      | Default        | Notes                                      |
| ----------- | --------- | -------------- | ------------------------------------------ |
| `value`     | number    | `0`            | Current amount                             |
| `max`       | number    | `0`            | Target amount                              |
| `met`       | boolean   | `value >= max` | Overrides the derived "met" (green) state  |
| `label`     | string    | `"value/max"`  | Overrides the inline label text            |
| `showLabel` | boolean   | `true`         | Hide the inline label when `false`         |

### `StatCard`

| Prop    | Type                    | Default     |
| ------- | ----------------------- | ----------- |
| `value` | ReactNode               | —           |
| `label` | string                  | —           |
| `sub`   | ReactNode               | — (omitted) |
| `tone`  | `'default'` \| `'accent'` | `'default'` |

### `Select`

`children` (your `<option>`/`<optgroup>`), `className`, plus any native
`<select>` props (`value`, `onChange`, `disabled`, `name`, …).

### `Badge`

| Prop      | Type                               | Default     |
| --------- | ---------------------------------- | ----------- |
| `variant` | `'default'` \| `'muted'` \| `'pill'` | `'default'` |
| `children`| ReactNode                          | —           |

### `Banner`

| Prop      | Type                                 | Default   |
| --------- | ------------------------------------ | --------- |
| `tone`    | `'error'` \| `'info'` \| `'success'` | `'error'` |
| `children`| ReactNode                            | —         |
