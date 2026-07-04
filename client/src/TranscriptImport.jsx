// client/src/TranscriptImport.jsx
// "Import transcript" flow: a button that opens a modal where the student pastes
// their transcript text, previews the parsed+matched result (with a GPA
// cross-check against their transcript), and confirms the import.
//
// All the parsing/matching happens on the server (see src/routes/import.js);
// this component just drives preview -> confirm and refreshes the dashboard.

import { useState } from 'react';
import { Banner, Badge } from '@camt/ui';
import { api } from './api';

// Human-friendly label for each non-ok row status.
const STATUS_LABEL = {
  unmatched_subject: 'not in catalog',
  unknown_grade: 'unknown grade',
  grade_type_mismatch: 'grade not allowed',
  title_row: 'section header',
};

export default function TranscriptImport({ onImported }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [preview, setPreview] = useState(null); // null = still editing
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  function reset() {
    setText('');
    setPreview(null);
    setError(null);
    setBusy(false);
  }

  function close() {
    setOpen(false);
    reset();
  }

  async function runPreview() {
    setBusy(true);
    setError(null);
    try {
      setPreview(await api.previewTranscript(text));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function commit() {
    setBusy(true);
    setError(null);
    try {
      const rows = preview.rows
        .filter((r) => r.status === 'ok')
        .map((r) => ({ subject_code: r.subject_code, term: r.term, grade: r.grade }));
      const res = await api.commitImport(rows);
      close();
      onImported?.(res.imported); // refresh the dashboard
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" className="import-btn" onClick={() => setOpen(true)}>
        ⬆ Import transcript
      </button>

      {open && (
        <div className="modal-overlay" onClick={close}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Import transcript</h2>
              <button type="button" className="modal-x" onClick={close} aria-label="Close">
                ✕
              </button>
            </div>

            {error && <Banner tone="error">{error}</Banner>}

            {!preview ? (
              // --- Step 1: paste ---
              <>
                <p className="modal-hint">
                  Open your grade portal, select the semester tables (course numbers + grades),
                  copy, and paste here. Multiple semesters at once is fine — we figure out the
                  years automatically.
                </p>
                <textarea
                  className="paste-box"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="ภาคการศึกษา 1 / 2567&#10;No  Course no  Course Title  Credit  Grade&#10;1  001101  Fundamental English 1  3.00  A&#10;..."
                  rows={10}
                />
                <div className="modal-actions">
                  <button type="button" className="btn-ghost" onClick={close}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={busy || !text.trim()}
                    onClick={runPreview}
                  >
                    {busy ? 'Reading…' : 'Preview'}
                  </button>
                </div>
              </>
            ) : (
              // --- Step 2: review ---
              <>
                <div className="preview-summary">
                  <span>
                    <strong>{preview.summary.ok}</strong> of {preview.summary.total} courses ready
                    {preview.summary.skipped > 0 && (
                      <span className="muted"> · {preview.summary.skipped} skipped</span>
                    )}
                  </span>
                  {preview.computed.gpa != null && (
                    <span className="preview-gpa">
                      Calculated GPA <strong>{preview.computed.gpa.toFixed(2)}</strong>
                      <span className="muted"> — check it matches your transcript</span>
                    </span>
                  )}
                </div>

                <div className="preview-table">
                  {preview.rows.map((r, i) => (
                    <div
                      key={`${r.subject_code}-${i}`}
                      className={`preview-row${r.status !== 'ok' ? ' preview-row-skip' : ''}`}
                    >
                      <span className="pv-term">{r.term}</span>
                      <span className="pv-code">{r.subject_code}</span>
                      <span className="pv-name">{r.subject_name || '(not in catalog)'}</span>
                      <span className="pv-grade">{r.grade}</span>
                      {r.status === 'ok' ? (
                        <span className="pv-ok">✓</span>
                      ) : (
                        <Badge variant="pill" className="pv-skip" title={r.message}>
                          {STATUS_LABEL[r.status] || 'skipped'}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-ghost" onClick={() => setPreview(null)}>
                    ← Back
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={busy || preview.summary.ok === 0}
                    onClick={commit}
                  >
                    {busy ? 'Importing…' : `Import ${preview.summary.ok} courses`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
