// client/src/TranscriptImport.jsx
// "Import transcript" flow, streamlined: one view where the student pastes their
// transcript and the parsed+matched preview (with a GPA cross-check) appears
// LIVE below as they paste — no "Preview" button. A little visual guide shows
// where to copy from until there's something to preview. All parsing/matching is
// local (see src/api.js -> engine.js); this component just drives paste -> import.

import { useEffect, useState } from 'react';
import { Banner, Badge } from '@camt/ui';
import { api } from './api';
import { IMPORTABLE } from './engine';
import { useLang } from './LanguageContext';

export default function TranscriptImport({ onImported }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [preview, setPreview] = useState(null); // live parse result (or null)
  const [reading, setReading] = useState(false); // debounce in flight
  const [busy, setBusy] = useState(false); // commit in flight
  const [error, setError] = useState(null);

  function close() {
    setOpen(false);
    setText('');
    setPreview(null);
    setReading(false);
    setError(null);
    setBusy(false);
  }

  // Live preview: whenever the pasted text changes, debounce briefly then parse.
  // Success -> show the review; nothing parseable (yet) -> keep the guide up. We
  // stay quiet on parse "errors" here because they're just mid-typing states.
  useEffect(() => {
    if (!open) return;
    const trimmed = text.trim();
    if (!trimmed) {
      setPreview(null);
      setReading(false);
      return;
    }
    setReading(true);
    const id = setTimeout(async () => {
      try {
        setPreview(await api.previewTranscript(text));
      } catch {
        setPreview(null);
      } finally {
        setReading(false);
      }
    }, 450);
    return () => clearTimeout(id);
  }, [text, open]);

  async function commit() {
    setBusy(true);
    setError(null);
    try {
      // 'ok' plus the two non-error states (free elective / currently studying).
      // credit rides along because an off-catalog subject has no credit to look up.
      const rows = preview.rows
        .filter((r) => IMPORTABLE.has(r.status))
        .map((r) => ({
          subject_code: r.subject_code,
          term: r.term,
          grade: r.grade,
          credit: r.credit,
          name: r.subject_name,
        }));
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
      {/* Icon-only, so the label moves to aria-label/title — without it the
          button is unnamed to a screen reader and unexplained on hover. */}
      <button
        type="button"
        className="import-btn"
        aria-label={t('action.import')}
        title={t('action.import')}
        onClick={() => setOpen(true)}
      >
        {/* A bare up arrow — the plain "bring data in" mark. No tray: that shape
            belongs to backup restore, where the source is a file. */}
        <svg
          className="import-icon"
          width="15"
          height="15"
          viewBox="0 0 16 16"
          aria-hidden="true"
          focusable="false"
        >
          <g stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <path d="M8 13.2V3.4" />
            <path d="M4.2 7.2 8 3.4l3.8 3.8" />
          </g>
        </svg>
      </button>

      {open && (
        <div className="modal-overlay" onClick={close}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>{t('import.title')}</h2>
              <button type="button" className="modal-x" onClick={close} aria-label="Close">
                ✕
              </button>
            </div>

            {/* One scroll region. The header and the action bar are pinned, so
                Import is reachable no matter how long the preview runs. */}
            <div className="modal-body">
            {error && <Banner tone="error">{error}</Banner>}

            <p className="modal-hint">{t('import.hint')}</p>

            <textarea
              // Once there's a preview the paste box has done its job, so it
              // gives its height to the thing you're actually reading. Focus
              // brings it back if you need to correct the paste.
              className={`paste-box${preview ? ' paste-box-compact' : ''}`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('import.placeholder')}
              rows={6}
              autoFocus
            />

            {/* Live status area: reading → guide → review */}
            {reading && <p className="reading-note">{t('import.reading')}</p>}

            {!preview && !reading && <CopyGuide t={t} />}

            {preview && (
              <>
                <div className="preview-summary">
                  <span>
                    {t('import.ready', { ok: preview.summary.ok, total: preview.summary.total })}
                    {preview.summary.skipped > 0 && (
                      <span className="muted">{t('import.skipped', { n: preview.summary.skipped })}</span>
                    )}
                  </span>
                  {preview.computed.gpa != null && (
                    <span className="preview-gpa">
                      {t('import.gpaLabel')} <strong>{preview.computed.gpa.toFixed(2)}</strong>
                      <span className="muted"> {t('import.gpaCheck')}</span>
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
                      <span className="pv-name">{r.subject_name || t('import.notInCatalog')}</span>
                      <span className="pv-grade">{r.grade}</span>
                      {r.status === 'ok' ? (
                        <span className="pv-ok">✓</span>
                      ) : (
                        <Badge variant="pill" className="pv-skip" title={r.message}>
                          {t(`status.${r.status}`)}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
            </div>

            <div className="modal-actions">
              {/* Restates what's about to happen at the point of decision, so
                  you don't have to scroll back up to the summary to check. */}
              {preview && preview.summary.ok > 0 && (
                <span className="modal-actions-note">
                  {t('import.ready', { ok: preview.summary.ok, total: preview.summary.total })}
                </span>
              )}
              <button type="button" className="btn-ghost" onClick={close}>
                {t('action.cancel')}
              </button>
              {preview && preview.summary.ok > 0 && (
                <button type="button" className="btn-primary" disabled={busy} onClick={commit}>
                  {busy ? t('import.importing') : t('import.commit', { n: preview.summary.ok })}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// The CMU registration site, redrawn small and animated: a cursor drags down
// the course rows, the selection paints in behind it, then ⌘C flashes. Showing
// the gesture beats describing it — the hard part isn't understanding "copy the
// rows", it's knowing WHERE on that dense page to start the drag.
//
// Pure CSS/SVG rather than a GIF: it stays crisp at any zoom, switches language
// and theme with the app, weighs nothing, and needs no asset pipeline. The
// animation is decorative — the numbered steps below carry the same
// instructions in text, so nothing is lost when it's stopped.
//
// The header keeps the registration site's blue instead of the app's copper on
// purpose: this is a picture OF another product, and the colour is how you
// recognise the page you're supposed to be on.
const GUIDE_ROWS = [
  ['208262', 'Elementary Statistics for Sci…', '3.00'],
  ['954310', 'Information Systems for Ent…', '3.00'],
  ['954348', 'Web Programming', '2.00'],
  ['954365', 'Knowledge Management Sys…', '3.00'],
];

// The two documents this modal accepts live on two different registration-office
// pages, so both are linked and labelled by what they hold — a student who wants
// to record this term's courses shouldn't have to work out that "exam calendar"
// is where the class schedule lives.
const REG_GRADES_URL =
  'https://www1.reg.cmu.ac.th/registrationoffice/student/main.php?mainfile=studentgrad';
const REG_SCHEDULE_URL =
  'https://www1.reg.cmu.ac.th/registrationoffice/student/calendar_exam/';

function CopyGuide({ t }) {
  return (
    <div className="guide">
      <div className="guide-title">{t('guide.title')}</div>

      <div className="guide-stage" aria-hidden="true">
        <div className="guide-head">
          <span>{t('guide.colCode')}</span>
          <span>{t('guide.colTitle')}</span>
          <span className="guide-num">{t('guide.colCredit')}</span>
        </div>

        <div className="guide-rows">
          {/* Grows downward in step with the cursor — the browser's own
              selection blue, so it reads instantly as "text selected". */}
          <span className="guide-band" />
          {GUIDE_ROWS.map((r) => (
            <div className="guide-row" key={r[0]}>
              <span className="guide-code">{r[0]}</span>
              <span className="guide-name">{r[1]}</span>
              <span className="guide-num">{r[2]}</span>
            </div>
          ))}
          <div className="guide-total">
            <span>{t('guide.total')}</span>
            <span className="guide-num">18.00</span>
          </div>
        </div>

        <svg className="guide-cursor" width="14" height="18" viewBox="0 0 14 18">
          <path
            d="M1 1l11 8.5-5 .8 2.6 5.4-2.3 1.1-2.6-5.4L1 14.6z"
            fill="#2b2420"
            stroke="#fff"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
        <span className="guide-key">{t('guide.copyKey')}</span>
      </div>

      {/* A real sequence, so it's numbered — the order is the instruction. */}
      <ol className="guide-steps">
        <li>
          {t('guide.step1')}
          <span className="guide-links">
            <a href={REG_GRADES_URL} target="_blank" rel="noopener noreferrer">
              {t('guide.linkGrades')}
            </a>
            <a href={REG_SCHEDULE_URL} target="_blank" rel="noopener noreferrer">
              {t('guide.linkSchedule')}
            </a>
          </span>
        </li>
        <li>{t('guide.step2')}</li>
        <li>{t('guide.step3')}</li>
      </ol>
    </div>
  );
}
