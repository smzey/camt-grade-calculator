// client/src/App.jsx
// The dashboard, redesigned: a progress-first layout — three "graduation score"
// rings across the top (one per top-level requirement pillar), a GPA strip, and
// a two-pane category browser (left quick-nav rail + right collapsible subject
// tree). Presentational pieces come from the @camt/ui design system; this file
// holds the app-specific data wiring and the flattened-tree builder.
//
// All data comes from the real /api backend (see api.js). The per-category
// earned/required/met numbers come straight from GET /api/progress — we don't
// recompute credit rollups on the client.

import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CreditSpine,
  ProgressBar,
  Select,
  Badge,
  Banner,
} from '@camt/ui';
import { api } from './api';
import { FREE_ELECTIVE_GROUP } from './catalog';
import TranscriptImport from './TranscriptImport';
import SettingsMenu from './SettingsMenu';
import { useLang } from './LanguageContext';

// New enrollments default to this term (the redesign dropped the term picker;
// term still gets recorded, it just isn't chosen in the UI).
const DEFAULT_TERM = '1/1';

// The catalog's placeholder free-elective slots (FREE-01 … FREE-07), carried
// over from the spreadsheet as blank lines to write a course into by hand.
const isFreeSlot = (code) => /^FREE-\d+$/.test(code);

// Which grades are valid to record for a subject, mirroring the backend rule:
// a subject with grade_type NULL accepts anything; a grade whose own type is
// NULL (W/V/X) fits any subject; otherwise the types must match.
function validGrades(subject, grades) {
  return grades.filter(
    (g) => subject.grade_type == null || g.type == null || g.type === subject.grade_type
  );
}

// The grade dropdown: real grades and planning (what-if) grades in two optgroups,
// built on the design system's <Select>.
function GradeSelect({ subject, grades, value, disabled, onChange }) {
  const { t } = useLang();
  const valid = validGrades(subject, grades);
  const label = (g) => (g.point != null ? `${g.grade} (${g.point})` : g.grade);
  const real = valid.filter((g) => !g.is_planning);
  const planning = valid.filter((g) => g.is_planning);
  return (
    <Select
      className="grade-select"
      value={value || ''}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">—</option>
      <optgroup label={t('grade.group')}>
        {real.map((g) => (
          <option key={g.grade} value={g.grade}>
            {label(g)}
          </option>
        ))}
      </optgroup>
      {planning.length > 0 && (
        <optgroup label={t('grade.planned')}>
          {planning.map((g) => (
            <option key={g.grade} value={g.grade}>
              {label(g)}
            </option>
          ))}
        </optgroup>
      )}
    </Select>
  );
}

export default function App() {
  const { t, tCat } = useLang();
  const [plan, setPlan] = useState(() => localStorage.getItem('plan') || 'WIL');
  // Privacy toggle: masks the GPA figures so the dashboard can be shown to
  // someone without revealing them. Persisted, so it survives a reload — a
  // privacy setting that silently resets isn't one.
  const [gpaHidden, setGpaHidden] = useState(() => localStorage.getItem('gpaHidden') === '1');

  function changeGpaHidden(hidden) {
    setGpaHidden(hidden);
    localStorage.setItem('gpaHidden', hidden ? '1' : '0');
  }

  const [groups, setGroups] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState([]);
  const [progress, setProgress] = useState([]); // [{code, earned, required, met, remaining}]
  const [gpa, setGpa] = useState({});
  const [enrollments, setEnrollments] = useState({}); // subject_code -> {grade, term}

  // Pure UI state (no API): which pillar is focused, and which categories are open.
  const [selectedTop, setSelectedTop] = useState(null);
  const [expanded, setExpanded] = useState({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null); // subject_code currently saving
  const [error, setError] = useState(null);

  // Re-fetch the student-specific data (progress depends on plan).
  async function refreshStudent(p) {
    const [prog, g, enr] = await Promise.all([api.progress(p), api.gpa(), api.enrollments()]);
    setProgress(prog.groups);
    setGpa(g);
    const map = {};
    for (const e of enr.enrollments) map[e.subject_code] = e;
    setEnrollments(map);
  }

  // One-time bootstrap: cookie -> catalog -> pick a starting pillar -> data.
  useEffect(() => {
    (async () => {
      try {
        await api.session();
        const [gr, su, gd] = await Promise.all([api.groups(), api.subjects(), api.grades()]);
        setGroups(gr);
        setSubjects(su);
        setGrades(gd);
        // Focus the first top-level pillar and open it + its first child.
        const tops = gr.filter((g) => g.parent_code == null);
        const first = tops[0];
        const firstChild = first ? gr.find((g) => g.parent_code === first.code) : null;
        if (first) {
          setSelectedTop(first.code);
          setExpanded({
            [first.code]: true,
            ...(firstChild ? { [firstChild.code]: true } : {}),
          });
        }
        await refreshStudent(plan);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Derived lookups ---
  const progressByCode = useMemo(() => new Map(progress.map((p) => [p.code, p])), [progress]);
  const topGroups = useMemo(() => groups.filter((g) => g.parent_code == null), [groups]);
  // Categories whose required credits actually differ between WIL and IS. We badge
  // these so it's obvious which numbers the plan toggle affects (derived from the
  // data, so it stays correct if the curriculum changes).
  const planVaries = useMemo(
    () => new Set(groups.filter((g) => g.req_wil !== g.req_is).map((g) => g.code)),
    [groups]
  );
  const childrenOf = useMemo(() => {
    const m = new Map();
    for (const g of groups) {
      if (g.parent_code == null) continue;
      if (!m.has(g.parent_code)) m.set(g.parent_code, []);
      m.get(g.parent_code).push(g);
    }
    return m;
  }, [groups]);
  const subjectsByGroup = useMemo(() => {
    const m = new Map();
    for (const s of subjects) {
      if (s.is_title) continue; // skip section-header pseudo-rows
      if (!m.has(s.group_code)) m.set(s.group_code, []);
      m.get(s.group_code).push(s);
    }
    return m;
  }, [subjects]);

  // Enrollments with no catalog entry, shaped like catalog subjects so the tree
  // can render them with the same row. grade_type null = any grade is valid,
  // which is right: we have no rule to apply to a course we don't know.
  const offCatalogSubjects = useMemo(() => {
    const known = new Set(subjects.map((s) => s.code));
    return Object.values(enrollments)
      .filter((e) => !known.has(e.subject_code))
      .map((e) => ({
        code: e.subject_code,
        name: e.subject_name || e.subject_code,
        credit: e.credit ?? 0,
        group_code: FREE_ELECTIVE_GROUP,
        grade_type: null,
        is_title: false,
        offCatalog: true,
      }))
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [enrollments, subjects]);

  const progOf = (code) =>
    progressByCode.get(code) || { earned: 0, required: 0, met: false, inProgress: 0 };

  // Degree-level totals for the hero figure. Credits earned BEYOND a pillar's
  // requirement don't shorten the degree (an extra free elective doesn't excuse
  // a major course), so each pillar's contribution is capped at its own
  // requirement — the same rule the spine draws.
  const totals = useMemo(() => {
    let required = 0;
    let remaining = 0;
    for (const g of topGroups) {
      const p = progOf(g.code);
      required += p.required || 0;
      remaining += Math.max(0, (p.required || 0) - (p.earned || 0));
    }
    return { required, remaining, earned: required - remaining };
  }, [topGroups, progressByCode]);

  function toggle(code) {
    setExpanded((e) => ({ ...e, [code]: !e[code] }));
  }

  async function changePlan(p) {
    setPlan(p);
    localStorage.setItem('plan', p);
    try {
      const prog = await api.progress(p); // only progress depends on plan
      setProgress(prog.groups);
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleImported() {
    setError(null);
    try {
      await refreshStudent(plan);
    } catch (e) {
      setError(e.message);
    }
  }

  async function onGradeChange(subject, newGrade) {
    setError(null);
    setSaving(subject.code);
    try {
      const existing = enrollments[subject.code];
      if (!newGrade) {
        if (existing) await api.deleteEnrollment(subject.code);
      } else {
        const term = existing ? existing.term : DEFAULT_TERM;
        // For an off-catalog course the credit and title exist only on the
        // stored row, so pass them back or the save would drop them.
        await api.saveEnrollment({
          subject_code: subject.code,
          term,
          grade: newGrade,
          ...(subject.offCatalog ? { credit: subject.credit, name: subject.name } : {}),
        });
      }
      await refreshStudent(plan);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(null);
    }
  }

  // Flatten the focused pillar's subtree into indented rows. A group with no
  // child groups is a leaf and shows its subjects (when expanded); a group with
  // child groups reveals those children (when expanded). Matches the prototype.
  const rows = useMemo(() => {
    if (selectedTop == null) return [];
    const out = [];

    // Lists one group's course rows. Shared by BOTH the nested walk below and
    // the leaf-pillar branch at the end — Free Electives is a top-level group
    // with no children, so it only ever goes through that second path.
    const pushSubjects = (groupCode, indent, visible) => {
      for (const s of subjectsByGroup.get(groupCode) || []) {
        // FREE-01..06 are blank slots from the original spreadsheet, there to
        // be written into by hand. Imports now file off-catalog courses here
        // automatically under their real names, so an empty slot is a row
        // asking for input nobody needs to give. Kept only if one already
        // holds a grade — hiding a filled slot would strand that data.
        if (isFreeSlot(s.code) && !enrollments[s.code]) continue;
        out.push({ kind: 'subject', visible, subject: s, indent });
      }
      // Courses the catalog doesn't know count toward Free Electives but have
      // no catalog row, so they'd be credits in the bar with nothing to show
      // for them. Build rows from what the import stored (real title + credit).
      if (groupCode === FREE_ELECTIVE_GROUP) {
        for (const s of offCatalogSubjects) {
          out.push({ kind: 'subject', visible, subject: s, indent });
        }
      }
    };

    const walk = (group, depth, parentVisible) => {
      const kids = childrenOf.get(group.code) || [];
      const isLeaf = kids.length === 0;
      const { earned, required, met, inProgress } = progOf(group.code);
      const isOpen = !!expanded[group.code];
      out.push({
        kind: 'group',
        visible: parentVisible,
        code: group.code,
        name: group.name,
        earned,
        required,
        met,
        inProgress,
        isOpen,
        indent: depth * 18 + 4,
      });
      if (isLeaf) {
        if (isOpen) pushSubjects(group.code, depth * 18 + 26, parentVisible && isOpen);
      } else {
        for (const child of kids) walk(child, depth + 1, parentVisible && isOpen);
      }
    };
    // The selected pillar is already named by the tab + ring above, so we DON'T
    // render it as its own tree row (that was the redundant "General Education >
    // General Education" nesting). Start at its children instead — or, for a leaf
    // pillar with no child groups (e.g. Free Electives), show its subjects directly.
    const top = groups.find((g) => g.code === selectedTop);
    if (top) {
      const kids = childrenOf.get(top.code) || [];
      if (kids.length === 0) {
        pushSubjects(top.code, 4, true);
      } else {
        for (const child of kids) walk(child, 0, true);
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedTop,
    groups,
    childrenOf,
    subjectsByGroup,
    progressByCode,
    expanded,
    offCatalogSubjects,
    enrollments,
  ]);

  if (loading) return <div className="page"><p className="muted">{t('loading')}</p></div>;

  const fmt = (v) => (v == null ? '—' : v.toFixed(2));
  const selectedTopName = groups.find((g) => g.code === selectedTop)?.name || '';
  const selectedProg = progOf(selectedTop);

  // GPA reads as "now → with your planned grades". The arrow only appears when
  // there's actually a projection to show, so a student who hasn't entered any
  // what-if grades just sees one number.
  const primaryGpa = gpa.gpa_actual ?? gpa.gpa_projected;
  const showProjection =
    gpa.gpa_actual != null &&
    gpa.gpa_projected != null &&
    Math.abs(gpa.gpa_projected - gpa.gpa_actual) >= 0.005;

  return (
    <div className="page">
      <div className="shell">
        <Card padded={false} className="app-card">
          {/* Header: brand, then Import as the one visible action. Plan,
              language and backup all sit behind the gear in the far corner —
              they're set once and then left alone, so they don't earn permanent
              space next to the thing students come here to do. */}
          <div className="header">
            <div className="brand">
              {/* BASE_URL is '/' in dev and '/<repo>/' when built for a GitHub
                  project page, so the logo resolves correctly under any base. */}
              <img src={`${import.meta.env.BASE_URL}camt-logo.jpg`} alt="CAMT" className="logo" />
              <span className="wordmark">{t('app.title')}</span>
            </div>
            <div className="header-actions">
              <TranscriptImport onImported={handleImported} />
              <SettingsMenu
                plan={plan}
                onPlanChange={changePlan}
                gpaHidden={gpaHidden}
                onGpaHiddenChange={changeGpaHidden}
                onRestored={() => window.location.reload()}
                onReset={() => {
                  api.resetData();
                  window.location.reload();
                }}
                onError={(msg) => setError(msg)}
              />
            </div>
          </div>

          {/* Summary: the one number the page leads with, the GPA beside it, and
              the credit spine — a single bar for the whole degree, split so each
              pillar's WIDTH is its share of the 126 credits. */}
          <div className="summary">
            <div className="figures">
              <div className="figure">
                <div className="eyebrow">{t('hero.remaining')}</div>
                <div className="hero-num">{totals.remaining}</div>
                <div className="figure-sub">
                  {totals.remaining === 0
                    ? t('hero.done')
                    : t('hero.sub', { total: totals.required, earned: totals.earned })}
                </div>
              </div>

              <div className="figure">
                <div className="eyebrow">{t('gpa.label')}</div>
                {/* Hidden GPA masks the numbers only — the credit counts, bars
                    and tree stay as they are, so the page still shows how far
                    along you are, just not how well. */}
                {gpaHidden ? (
                  <>
                    <div className="gpa-line">
                      <span className="gpa-num gpa-num-masked" aria-label={t('gpa.hidden')}>
                        ••••
                      </span>
                    </div>
                    <div className="figure-sub">{t('gpa.hidden')}</div>
                  </>
                ) : (
                  <>
                    <div className="gpa-line">
                      <span className="gpa-num">{fmt(primaryGpa)}</span>
                      {showProjection && (
                        <>
                          <span className="gpa-arrow" aria-hidden="true">
                            →
                          </span>
                          <span className="gpa-num gpa-num-proj">{fmt(gpa.gpa_projected)}</span>
                        </>
                      )}
                    </div>
                    <div className="figure-sub">
                      {showProjection
                        ? t('gpa.sub.planned')
                        : t('gpa.sub.actual', { n: gpa.credits_actual ?? 0 })}
                    </div>
                  </>
                )}
              </div>
            </div>

            <CreditSpine
              className="degree-spine"
              segments={topGroups.map((g) => {
                const { earned, required, met, inProgress } = progOf(g.code);
                return {
                  key: g.code,
                  label: tCat(g.code, g.name),
                  value: earned,
                  max: required,
                  met,
                  inProgress,
                };
              })}
              selected={selectedTop}
              onSelect={setSelectedTop}
              segmentLabel={(seg) =>
                `${seg.label}: ${seg.value}/${seg.max} ${t('unit.cr')}` +
                (seg.inProgress > 0
                  ? `, ${seg.inProgress} ${t('unit.cr')} ${t('gpa.inprogress')}`
                  : '') +
                (seg.met ? ' ✓' : '')
              }
            />

            {/* An empty dashboard should say what to do next, not just sit at
                zero. Names both ways in, in the order most students want them. */}
            {totals.earned === 0 && <p className="summary-empty">{t('empty.hint')}</p>}
          </div>

          {/* The subject browser for whichever pillar the spine has focused. */}
          <div className="browser">
            <div className="tree">
              <div className="tree-head">
                <span className="tree-head-name">{tCat(selectedTop, selectedTopName)}</span>
                <span className="tree-head-count">
                  {selectedProg.earned}/{selectedProg.required} {t('unit.cr')}
                  {selectedProg.met && <span className="met-check"> ✓</span>}
                </span>
              </div>
              {rows.map((row, idx) => {
                if (!row.visible) return null;
                if (row.kind === 'group') {
                  return (
                    <div className="cat-row" key={`g-${row.code}`} onClick={() => toggle(row.code)}>
                      {/* Depth indents the label only, so the bars and counts
                          stay in fixed columns and can be scanned down. */}
                      <span className="cat-label" style={{ paddingLeft: row.indent }}>
                        <span
                          className="chevron"
                          style={{ transform: row.isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
                        >
                          ▶
                        </span>
                        <span className="cat-name">{tCat(row.code, row.name)}</span>
                        {planVaries.has(row.code) && (
                          <Badge variant="pill" className="plan-badge" title={t('plan.varies')}>
                            {plan}
                          </Badge>
                        )}
                      </span>
                      {row.required > 0 ? (
                        // Fixed-requirement category: show the progress bar.
                        <ProgressBar
                          className="cat-bar"
                          size="sm"
                          tone="copper"
                          showLabel={false}
                          value={row.earned}
                          max={row.required}
                          met={row.met}
                          inProgress={row.inProgress}
                        />
                      ) : (
                        // "Pick any" category (no required count) — no bar, just
                        // keep the row spaced so the credit count stays right-aligned.
                        <span className="cat-bar-spacer" />
                      )}
                      <span className="cat-earned">
                        {row.required > 0
                          ? `${row.earned}/${row.required}`
                          : row.earned > 0
                            ? `${row.earned} ${t('unit.cr')}`
                            : '—'}
                        {/* Credits underway, stated rather than left to the bar
                            alone — this is the number a student checks when
                            asking "am I on track this term?". */}
                        {row.inProgress > 0 && (
                          <span
                            className="cat-underway"
                            title={`${row.inProgress} ${t('unit.cr')} ${t('gpa.inprogress')}`}
                          >
                            +{row.inProgress}
                          </span>
                        )}
                        {/* Copper and olive are near-identical under red-green
                            colour blindness, so "met" never rides on hue alone. */}
                        {row.met && row.required > 0 && (
                          <span className="met-check" title={t('status.met')}>
                            {' '}
                            ✓
                          </span>
                        )}
                      </span>
                    </div>
                  );
                }
                const s = row.subject;
                const enr = enrollments[s.code];
                return (
                  <div className="subj-row" key={`s-${s.code}-${idx}`} style={{ paddingLeft: row.indent }}>
                    <span className="subj-code">{s.code}</span>
                    <span className="subj-name">{s.name}</span>
                    <Badge variant="pill" className="subj-chip">
                      {s.credit} {t('unit.cr')}
                    </Badge>
                    <GradeSelect
                      subject={s}
                      grades={grades}
                      value={enr ? enr.grade : ''}
                      disabled={saving === s.code}
                      onChange={(g) => onGradeChange(s, g)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {error && (
          <Banner tone="error" className="app-banner">
            {error}
          </Banner>
        )}

        <div className="footer">{t('footer')}</div>
      </div>
    </div>
  );
}
