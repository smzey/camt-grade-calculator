# Handoff: CAMT Grade Calculator — Dashboard Redesign

## Overview
A redesign of the CAMT Grade Calculator's single dashboard screen. It replaces the
current flat, edge-to-edge list (sticky bar + plan/term pickers + two GPA tiles +
every one of the 19 categories and 142 subjects laid out at once) with a calmer,
progress-first layout:

1. **Three "graduation score" rings** across the top — one per top-level requirement
   pillar (General Education, Field of Specialization, Free Electives). Each ring is a
   radial gauge of earned-vs-required credits. Tapping a ring focuses that pillar.
2. **A GPA strip** (actual + projected) in the CAMT copper gradient.
3. **A two-pane category browser** below: a left quick-nav rail listing the selected
   pillar's sub-categories with % complete, and a right expandable subject tree with
   per-subject grade dropdowns and per-category progress bars.

Categories are **collapsed by default** and expand on click, which is the main fix for
the "142 rows on screen at once" problem in the current app.

## About the Design Files
The files in this bundle are **design references created in HTML** — a working prototype
showing the intended look and behavior, **not production code to copy directly.** The
task is to **recreate this design inside the existing `camt-grade-calculator` codebase**
(Vite + React SPA in `client/`, styled with the `@camt/ui` Tailwind-v4 design system in
`packages/ui`), using its established components and data wiring.

Most of the app-specific data logic already exists in the real codebase and should be
reused as-is — do **not** reimplement it from the prototype:
- `client/src/api.js` — the `/api` fetch wrappers (`session`, `groups`, `subjects`,
  `grades`, `progress`, `gpa`, `enrollments`, `saveEnrollment`, `deleteEnrollment`).
- Backend `GET /api/progress?plan=WIL|IS` already returns per-category
  `{ code, earned, required, met, remaining }`, and `GET /api/gpa` returns
  `{ gpa_actual, gpa_projected, credits_actual, credits_projected }`. Use those instead
  of recomputing credit rollups on the client — the prototype recomputes locally only
  because it has no backend.
- Grade edits should continue to go through `POST /api/enrollments` /
  `DELETE /api/enrollments/:subject_code` (cookie-scoped), then re-fetch progress + gpa —
  exactly as `App.jsx` does today. The prototype's `localStorage` persistence is a
  stand-in for that server round-trip; **keep the real API path.**

The bundled `data.js` is a static transcription of `sql/seed.sql` used only to give the
prototype real content offline. **Ignore it for implementation** — the real catalog comes
from the API.

## Fidelity
**High-fidelity.** Colors, typography, spacing, radii, and interactions are final. Recreate
the UI pixel-perfectly using `@camt/ui` where components exist, extending the design system
(new tokens / a couple of new components) where they don't — see "Where this extends
`@camt/ui`" below.

## Screen: Dashboard (single screen)

**Purpose:** A student records the grade they got (or expect) for each course and watches
their GPA and per-category credit requirements update, per degree plan (WIL vs IS).

**Overall layout**
- Page: warm background `#f2ece3`, content centered in a `max-width: 860px` column,
  `padding: 28px 20px 48px`.
- One white card: `background:#fff; border:1px solid #e8dfd3; border-radius:16px;
  box-shadow:0 10px 34px rgba(70,50,30,.09); overflow:hidden`.
- Inside the card, top → bottom: **header row → score rings → GPA strip → two-pane
  browser**. A small muted footer line sits below the card.

### 1. Header row
- `padding:22px 26px 10px`, flex, space-between, wraps.
- Left: CAMT logo (`assets/camt-logo.jpg`, `height:28px`, width auto) + wordmark
  "Grade Calculator" in **Sora 700, 17px**, color `#2b2420`.
- Right: **WIL / IS segmented toggle** — a pill track `background:#f1e7db;
  border-radius:999px; padding:3px`, two segments `padding:6px 16px; border-radius:999px;
  font:700 12px`. Active segment: `background:#2b2420; color:#fff`. Inactive:
  `background:transparent; color:#8a7d72`. Selecting a plan re-fetches
  `progress?plan=…` (WIL and IS have different `req_*` per category).

### 2. Score rings (the hero)
- `padding:18px 30px 8px`, a flex row of the three top-level groups. Between adjacent
  rings a **connector bar**: `flex:1; height:3px; background:#e9dcc9; border-radius:2px;
  margin:0 -2px 28px` (the bottom margin visually centers it on the rings, above the
  labels). The last ring is `flex:0 0 auto`; the others’ wrapper is `flex:1` so
  connectors stretch evenly.
- **Ring** = outer 76×76 circle whose background is a conic-gradient gauge:
  `conic-gradient(<fill> <pct*3.6>deg, #e9dcc9 0deg)` where `<fill>` is `#b3532f` (copper)
  while in progress, `#5f8a52` (green) once the pillar is met. Inner 58×58 white disc,
  centered column: big number in **Sora 800, 16px** (`#2b2420`) — the percent complete,
  or a `✓` when met — with a sub-line in **system-ui 600, 9.5px**, `#8a7d72` reading
  `"<earned>/<required> cr"`.
- Selected ring gets a focus halo: `box-shadow:0 0 0 3px #2b2420`.
- Under each ring: the group name in **700, 12px**, `#3a322c`, centered, `max-width:104px`.
- Clicking a ring sets it as the "focused pillar," driving the rail + tree below.

### 3. GPA strip
- `margin:12px 26px 4px; padding:12px 18px; border-radius:13px`, background
  `linear-gradient(135deg,#f3c9a4,#d98a5e)`, flex space-between.
- Left: two stat blocks `gap:30px`. Each = value in **Sora 800, 22px, #fff** over a
  caption in **10px, uppercase, letter-spacing .05em, #fff @ .9 opacity**:
  "GPA actual · `<credits_actual>` cr" and "GPA projected · `<credits_projected>` cr".
  Actual = recorded grades only; projected includes the `x`-prefixed planning grades.
- Right: 🎓 emoji, `font-size:30px`.

### 4. Two-pane category browser
- Wrapper: flex, `border-top:1px solid #f1e7db; margin-top:10px`.
- **Left rail:** `flex:0 0 210px; padding:16px 10px; border-right:1px solid #f1e7db`.
  - Eyebrow: the focused pillar's name, **700, 10.5px, uppercase, letter-spacing .06em,
    color #a89984**, `padding:4px 10px 8px`.
  - One row per **direct child category** of the focused pillar: `padding:9px 10px;
    border-radius:8px; cursor:pointer`. Name in **600, 12.5px, #3a322c** (flex:1) +
    a right-aligned percent in **700, 10.5px**, colored `#5f8a52` if met else `#b3532f`.
  - Clicking a rail row toggles that category's expansion in the tree.
- **Right tree:** `flex:1; padding:12px 22px 30px; min-width:0`. A flattened, indented
  render of the focused pillar's subtree. Indent = `depth*18 + 4px` for category rows,
  `depth*18 + 26px` for subject rows.
  - **Category row** (`cursor:pointer`, toggles expand): a chevron `▶` (`width:14px;
    font-size:11px; color:#b08a63; transform:rotate(0)→rotate(90deg)` when open,
    `transition:transform .12s`); name in **700, 13.5px, #2b2420** (`max-width:240px`);
    a **progress bar** (`flex:1; height:9px; border-radius:6px; background:#eadfd0;
    overflow:hidden`) whose fill is `width:<pct>%` with `transition:width .2s` and
    background `linear-gradient(90deg,#e8a97a,#b3532f)` in progress / solid `#5f8a52`
    when met; then `<earned>/<required>` in **11.5px, #8a7d72, tabular-nums, width:56px,
    right-aligned**. Row divider `border-bottom:1px solid #f3ece1`.
  - **Subject row** (only rendered when its parent category is expanded): course code in
    **11px, #a89984, tabular-nums, width:64px**; course name in **13px, #3a322c** (flex:1);
    a credit chip `"<credit> cr"` in **10.5px, #7a6a5c, background:#f1e7db, padding:2px 7px,
    border-radius:999px`**; then the **grade `<select>`** (`width:94px; font-size:12.5px;
    border:1px solid #ddcfba; border-radius:6px; padding:4px 6px; background:#fff;
    color:#2b2420`). Row divider `border-bottom:1px solid #f8f2ea`.
  - **Grade dropdown options:** an empty `—` option, then an optgroup **"Grade"** of the
    real grades, then (when the subject allows planning grades) an optgroup
    **"Planned (what-if)"** of the `x`-prefixed grades. Each option label is
    `"<grade> (<point>)"` when the grade has GPA points, else just `<grade>`. Only grades
    valid for the subject's `grade_type` are shown (a subject with `grade_type` NULL
    accepts anything; a grade with type NULL — W/V/X — fits any subject; otherwise types
    must match). This mirrors `validGrades()` in the current `App.jsx`.

### Footer
Below the card, centered, **11.5px, #a89984**:
"Grades save to this browser only · CAMT MMIT · College of Arts, Media and Technology,
Chiang Mai University".

## Interactions & Behavior
- **Select a pillar ring** → sets focused top-level group → rail + tree re-render for that
  pillar. Ring gets the `0 0 0 3px #2b2420` halo.
- **WIL/IS toggle** → re-fetch `progress?plan=…`; required credits (and therefore ring/bar
  fills and met-states) change. Persist the choice (current app uses `localStorage 'plan'`).
- **Expand/collapse a category** → via chevron row click or matching rail row click. Only
  leaf categories hold subjects; parent categories reveal child categories. Default state:
  collapsed except a sensible starting pillar (prototype opens General Education → GE
  Required).
- **Change a grade** → `POST /api/enrollments {subject_code, term, grade}` (upsert; term
  defaults to the existing row's term, or an active-term selector as today). Empty
  selection → `DELETE /api/enrollments/:subject_code`. Then re-fetch `progress` + `gpa` and
  re-render bars, rings, and GPA. Disable the row's select while its request is in flight
  (as `App.jsx` does with `saving`).
- **Transitions:** chevron rotate `.12s`; progress-bar width `.2s`; ring halo `.15s`.
- **Errors:** keep the existing `<Banner tone="error">` pattern for failed writes.

## State Management
Mirrors today's `App.jsx`, plus one new UI-only field:
- `plan` (`'WIL'|'IS'`, persisted), `activeTerm` (persisted) — unchanged.
- `groups`, `subjects`, `grades` — catalog, loaded once after `api.session()`.
- `progress` (array of `{code, earned, required, met, remaining}`), `gpa`
  (`{gpa_actual, gpa_projected, credits_actual, credits_projected}`),
  `enrollments` (`subject_code → {grade, term}`) — student data, re-fetched on plan change
  and after each grade write.
- **NEW:** `selectedTop` (the focused top-level group code, e.g. `1000` / `2000` / `9000`)
  and `expanded` (a `code → bool` map) — pure client UI state, no API.
- Derived: build the flattened tree rows from `groups` + `subjects` + `progress` +
  `expanded`, scoped to `selectedTop`. Rail items = direct children of `selectedTop` with
  their `progress` %.

## Design Tokens
Colors:
- Page bg `#f2ece3` · card bg `#ffffff` · card border `#e8dfd3`
- Ink `#2b2420` · ink-soft `#3a322c` · muted `#8a7d72` · subtle `#a89984`
- Copper (in-progress fill / accents) `#b3532f`; copper gradient
  `linear-gradient(90deg,#e8a97a,#b3532f)`; GPA strip gradient
  `linear-gradient(135deg,#f3c9a4,#d98a5e)`; chevron/accent tan `#b08a63`
- Success (met) `#5f8a52`
- Progress-track `#eadfd0` · ring-track `#e9dcc9` · chip bg `#f1e7db` · select border
  `#ddcfba` · dividers `#f3ece1` (categories) / `#f8f2ea` (subjects)

Typography:
- Headings/values: **Sora** (Google Fonts, weights 500–800). Body/labels: system-ui stack.
- Scale used: 22 (GPA), 17 (wordmark), 16 (ring number), 13.5 (category name), 13 (subject
  name), 12.5 (rail name / select), 12 (ring label / toggle), 11.5 (footer / earned-req),
  11 (code), 10.5 (chip / rail %), 10 (GPA caption), 9.5 (ring sub-line).

Radius: card 16 · GPA strip 13 · rail rows / bars-track 8 & 6 · chips/pills 999 · select 6.
Shadow: card `0 10px 34px rgba(70,50,30,.09)`; ring halo `0 0 0 3px #2b2420`.

### Where this extends `@camt/ui`
The current library (`Card`, `ProgressBar`, `StatCard`, `Select`, `Badge`, `Banner`) covers
most of this, but the redesign introduces a warmer palette and two new pieces. Recommended:
- **Add copper/charcoal tokens** to `packages/ui/src/theme.css` `@theme` (the values above)
  rather than hardcoding hex in the app. Today's `--color-surface-accent` etc. are cool
  indigo; this redesign is warm copper.
- **`ProgressBar`** — extend to accept a gradient fill and the copper/green states (today
  it's neutral gray → green). Reuse for the category bars.
- **New `ScoreRing`** component (conic-gradient gauge with inner label) — not in the library
  yet.
- **New `SegmentedToggle`** (the WIL/IS pill) — generalize from the two-option pill.
- `Select`, `Badge` (credit chip), `Banner` (errors) reuse directly.

## Assets
- `assets/camt-logo.jpg` — the official CAMT logo, already in the repo at
  `docs/camt-logo.jpg`. No other images; the only "icon" is the 🎓 emoji and the CSS
  chevron/check glyphs. No hand-drawn SVGs.

## Files in this bundle
- `CAMT Grade Calculator.dc.html` — **the final design** (the screen described above).
- `CAMT Redesign Options.dc.html` — the exploration: options 1a/1b/1c and the combined 2a
  that became the final. Useful for seeing rejected directions and rationale.
- `data.js` — static catalog transcription used only to run the prototypes offline. **Do
  not port**; use the live API.
- `assets/camt-logo.jpg` — logo asset.

> The `.dc.html` files are "Design Component" prototypes — open them in a browser to see the
> live behavior. They are single self-contained React-ish components; treat them as visual +
> interaction reference, and implement in `client/src` with `@camt/ui`.
