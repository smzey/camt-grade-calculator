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
  ScoreRing,
  SegmentedToggle,
  ProgressBar,
  Select,
  Badge,
  Banner,
} from '@camt/ui';
import { api } from './api';
import TranscriptImport from './TranscriptImport';
import BackupMenu from './BackupMenu';

// New enrollments default to this term (the redesign dropped the term picker;
// term still gets recorded, it just isn't chosen in the UI).
const DEFAULT_TERM = '1/1';

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
      <optgroup label="Grade">
        {real.map((g) => (
          <option key={g.grade} value={g.grade}>
            {label(g)}
          </option>
        ))}
      </optgroup>
      {planning.length > 0 && (
        <optgroup label="Planned (what-if)">
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
  const [plan, setPlan] = useState(() => localStorage.getItem('plan') || 'WIL');

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

  const progOf = (code) => progressByCode.get(code) || { earned: 0, required: 0, met: false };
  const pctOf = (earned, required) =>
    required > 0 ? Math.min(100, (earned / required) * 100) : earned > 0 ? 100 : 0;

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
        await api.saveEnrollment({ subject_code: subject.code, term, grade: newGrade });
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
    const walk = (group, depth, parentVisible) => {
      const kids = childrenOf.get(group.code) || [];
      const isLeaf = kids.length === 0;
      const { earned, required, met } = progOf(group.code);
      const isOpen = !!expanded[group.code];
      out.push({
        kind: 'group',
        visible: parentVisible,
        code: group.code,
        name: group.name,
        earned,
        required,
        met,
        isOpen,
        indent: depth * 18 + 4,
      });
      if (isLeaf) {
        if (isOpen) {
          for (const s of subjectsByGroup.get(group.code) || []) {
            out.push({
              kind: 'subject',
              visible: parentVisible && isOpen,
              subject: s,
              indent: depth * 18 + 26,
            });
          }
        }
      } else {
        for (const child of kids) walk(child, depth + 1, parentVisible && isOpen);
      }
    };
    const top = groups.find((g) => g.code === selectedTop);
    if (top) walk(top, 0, true);
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTop, groups, childrenOf, subjectsByGroup, progressByCode, expanded]);

  if (loading) return <div className="page"><p className="muted">Loading…</p></div>;

  const fmt = (v) => (v == null ? '—' : v.toFixed(2));
  const selectedTopName = groups.find((g) => g.code === selectedTop)?.name || '';
  const railItems = childrenOf.get(selectedTop) || [];

  return (
    <div className="page">
      <div className="shell">
        <Card padded={false} className="app-card">
          {/* Header: logo + wordmark + WIL/IS toggle */}
          <div className="header">
            <div className="brand">
              {/* BASE_URL is '/' in dev and '/<repo>/' when built for a GitHub
                  project page, so the logo resolves correctly under any base. */}
              <img src={`${import.meta.env.BASE_URL}camt-logo.jpg`} alt="CAMT" className="logo" />
              <span className="wordmark">Grade Calculator</span>
            </div>
            <div className="header-actions">
              <BackupMenu
                onRestored={() => window.location.reload()}
                onError={(msg) => setError(msg)}
              />
              <TranscriptImport onImported={handleImported} />
              <SegmentedToggle
                value={plan}
                onChange={changePlan}
                options={[
                  { value: 'WIL', label: 'WIL' },
                  { value: 'IS', label: 'IS' },
                ]}
              />
            </div>
          </div>

          {/* Score rings — one per top-level pillar, joined by connectors */}
          <div className="rings">
            {topGroups.map((g, i) => {
              const { earned, required, met } = progOf(g.code);
              const isLast = i === topGroups.length - 1;
              return (
                <div className="ring-cell" style={{ flex: isLast ? '0 0 auto' : 1 }} key={g.code}>
                  <div className="ring-col" onClick={() => setSelectedTop(g.code)}>
                    <ScoreRing
                      percent={pctOf(earned, required)}
                      met={met}
                      selected={g.code === selectedTop}
                      sublabel={`${earned}/${required} cr`}
                    />
                    <div className="ring-name">{g.name}</div>
                  </div>
                  {!isLast && <div className="connector" />}
                </div>
              );
            })}
          </div>

          {/* GPA strip */}
          <div className="gpa-strip">
            <div className="gpa-stats">
              <div>
                <div className="gpa-value">{fmt(gpa.gpa_actual)}</div>
                <div className="gpa-cap">GPA actual · {gpa.credits_actual} cr</div>
              </div>
              <div>
                <div className="gpa-value">{fmt(gpa.gpa_projected)}</div>
                <div className="gpa-cap">GPA projected · {gpa.credits_projected} cr</div>
              </div>
            </div>
          </div>

          {/* Pillar tabs — switch which top-level requirement is focused below.
              (Clicking a ring above does the same thing.) */}
          <div className="pillar-tabs">
            {topGroups.map((g) => (
              <button
                key={g.code}
                type="button"
                className={`pillar-tab${g.code === selectedTop ? ' pillar-tab-active' : ''}`}
                onClick={() => setSelectedTop(g.code)}
              >
                {g.name}
              </button>
            ))}
          </div>

          {/* Two-pane category browser */}
          <div className="browser">
            <div className="rail">
              <div className="rail-eyebrow">{selectedTopName}</div>
              {railItems.map((g) => {
                const { earned, required, met } = progOf(g.code);
                return (
                  <div className="rail-row" key={g.code} onClick={() => toggle(g.code)}>
                    <span className="rail-name">{g.name}</span>
                    <span
                      className="rail-pct"
                      style={{ color: met ? 'var(--color-success)' : 'var(--color-copper)' }}
                    >
                      {required > 0 ? `${Math.round(pctOf(earned, required))}%` : '—'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="tree">
              {rows.map((row, idx) => {
                if (!row.visible) return null;
                if (row.kind === 'group') {
                  return (
                    <div
                      className="cat-row"
                      key={`g-${row.code}`}
                      onClick={() => toggle(row.code)}
                      style={{ paddingLeft: row.indent }}
                    >
                      <span
                        className="chevron"
                        style={{ transform: row.isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
                      >
                        ▶
                      </span>
                      <span className="cat-name">{row.name}</span>
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
                            ? `${row.earned} cr`
                            : '—'}
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
                      {s.credit} cr
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

        <div className="footer">
          Grades save to this browser only · CAMT MMIT · College of Arts, Media and Technology,
          Chiang Mai University
        </div>
      </div>
    </div>
  );
}
