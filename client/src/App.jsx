// client/src/App.jsx
// The whole dashboard: category tree with progress bars, per-subject grade
// dropdowns, and a live GPA panel. The presentational pieces now come from the
// @camt/ui design system; this file keeps only the app-specific data wiring and
// the two thin domain wrappers (GpaPanel, GradeSelect) that adapt library
// components to grade-calculator data.

import { useEffect, useMemo, useState } from 'react';
import { Card, ProgressBar, StatCard, Select, Badge, Banner } from '@camt/ui';
import { api } from './api';

// Terms offered for NEW entries (the program runs ~4 years x 3 terms).
const TERMS = [];
for (let y = 1; y <= 4; y++) for (let s = 1; s <= 3; s++) TERMS.push(`${y}/${s}`);

// Which grades are valid to record for a subject, mirroring the backend rule:
// a subject with grade_type NULL accepts anything; a grade whose own type is
// NULL (W/V/X) fits any subject; otherwise the types must match.
function validGrades(subject, grades) {
  return grades.filter(
    (g) => subject.grade_type == null || g.type == null || g.type === subject.grade_type
  );
}

// Depth of a group in the tree, for indentation.
function depthOf(group, byCode) {
  let d = 0;
  let p = group.parent_code;
  while (p != null) {
    d += 1;
    const parent = byCode.get(p);
    p = parent ? parent.parent_code : null;
  }
  return d;
}

// --- Domain wrappers around design-system components ---

// The GPA summary: two StatCards, the projected one visually accented.
function GpaPanel({ gpa }) {
  const fmt = (v) => (v == null ? '—' : v.toFixed(2));
  return (
    <div className="gpa-panel">
      <StatCard value={fmt(gpa.gpa_actual)} label="GPA (actual)" sub={`${gpa.credits_actual} cr`} />
      <StatCard
        value={fmt(gpa.gpa_projected)}
        label="GPA (projected)"
        sub={`${gpa.credits_projected} cr`}
        tone="accent"
      />
    </div>
  );
}

// A grade dropdown built on the design system's <Select>, with the domain logic
// for splitting real grades from planning (what-if) grades into optgroups.
function GradeSelect({ subject, grades, value, disabled, onChange }) {
  const valid = validGrades(subject, grades);
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
            {g.grade}
            {g.point != null ? ` (${g.point})` : ''}
          </option>
        ))}
      </optgroup>
      {planning.length > 0 && (
        <optgroup label="Planned (what-if)">
          {planning.map((g) => (
            <option key={g.grade} value={g.grade}>
              {g.grade}
              {g.point != null ? ` (${g.point})` : ''}
            </option>
          ))}
        </optgroup>
      )}
    </Select>
  );
}

// --- Main component ---

export default function App() {
  const [plan, setPlan] = useState(() => localStorage.getItem('plan') || 'WIL');
  const [activeTerm, setActiveTerm] = useState(() => localStorage.getItem('activeTerm') || '1/1');

  const [groups, setGroups] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState([]);
  const [progress, setProgress] = useState([]); // array of {code, earned, required, met, ...}
  const [gpa, setGpa] = useState({});
  const [enrollments, setEnrollments] = useState({}); // subject_code -> enrollment

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null); // subject_code currently saving
  const [error, setError] = useState(null);

  // Re-fetch the student-specific data (depends on plan for progress).
  async function refreshStudent(p) {
    const [prog, g, enr] = await Promise.all([api.progress(p), api.gpa(), api.enrollments()]);
    setProgress(prog.groups);
    setGpa(g);
    // Turn the enrollments array into a { subject_code: enrollment } lookup.
    const map = {};
    for (const e of enr.enrollments) map[e.subject_code] = e;
    setEnrollments(map);
  }

  // One-time bootstrap: establish the cookie, load the catalog, then the data.
  useEffect(() => {
    (async () => {
      try {
        await api.session(); // sets the student_id cookie exactly once
        const [gr, su, gd] = await Promise.all([api.groups(), api.subjects(), api.grades()]);
        setGroups(gr);
        setSubjects(su);
        setGrades(gd);
        await refreshStudent(plan);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lookups derived from the loaded data.
  const byCode = useMemo(() => new Map(groups.map((g) => [g.code, g])), [groups]);
  const progressByCode = useMemo(
    () => new Map(progress.map((p) => [p.code, p])),
    [progress]
  );
  const subjectsByGroup = useMemo(() => {
    const m = new Map();
    for (const s of subjects) {
      if (s.is_title) continue; // skip section-header pseudo-rows
      if (!m.has(s.group_code)) m.set(s.group_code, []);
      m.get(s.group_code).push(s);
    }
    return m;
  }, [subjects]);

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

  function changeTerm(t) {
    setActiveTerm(t);
    localStorage.setItem('activeTerm', t);
  }

  async function onGradeChange(subject, newGrade) {
    setError(null);
    setSaving(subject.code);
    try {
      const existing = enrollments[subject.code];
      if (!newGrade) {
        if (existing) await api.deleteEnrollment(subject.code);
      } else {
        // Keep the existing term when editing a grade; use the active term for
        // a brand-new entry.
        const term = existing ? existing.term : activeTerm;
        await api.saveEnrollment({ subject_code: subject.code, term, grade: newGrade });
      }
      await refreshStudent(plan);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(null);
    }
  }

  if (loading) return <div className="app"><p className="muted">Loading…</p></div>;

  return (
    <div className="app">
      <Card as="header" className="topbar">
        <h1>CAMT Grade Calculator</h1>
        <div className="controls">
          <label>
            Plan{' '}
            <Select value={plan} onChange={(e) => changePlan(e.target.value)}>
              <option value="WIL">WIL (Work-Integrated Learning)</option>
              <option value="IS">IS (Independent Study)</option>
            </Select>
          </label>
          <label>
            New-entry term{' '}
            <Select value={activeTerm} onChange={(e) => changeTerm(e.target.value)}>
              {TERMS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </label>
        </div>
        <GpaPanel gpa={gpa} />
      </Card>

      {error && (
        <Banner tone="error" className="app-banner">
          {error}
        </Banner>
      )}

      <main>
        {groups.map((group) => {
          const depth = depthOf(group, byCode);
          const prog = progressByCode.get(group.code) || { earned: 0, required: 0, met: false };
          const groupSubjects = subjectsByGroup.get(group.code) || [];
          return (
            <section key={group.code} className="group" style={{ marginLeft: depth * 16 }}>
              <div className="group-head">
                <span className="group-name">{group.name}</span>
                <ProgressBar
                  className="bar-cell"
                  value={prog.earned}
                  max={prog.required}
                  met={prog.met}
                />
              </div>

              {groupSubjects.map((subject) => {
                const enr = enrollments[subject.code];
                return (
                  <div key={subject.code} className="subject-row">
                    <span className="subj-code">{subject.code}</span>
                    <span className="subj-name">{subject.name}</span>
                    <Badge className="subj-credit">{subject.credit} cr</Badge>
                    <GradeSelect
                      subject={subject}
                      grades={grades}
                      value={enr ? enr.grade : ''}
                      disabled={saving === subject.code}
                      onChange={(g) => onGradeChange(subject, g)}
                    />
                    <span className="subj-term">{enr ? enr.term : ''}</span>
                  </div>
                );
              })}
            </section>
          );
        })}
      </main>
    </div>
  );
}
