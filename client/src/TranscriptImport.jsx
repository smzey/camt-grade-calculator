// client/src/TranscriptImport.jsx
// "Import transcript" flow, streamlined: one view where the student pastes their
// transcript and the parsed+matched preview (with a GPA cross-check) appears
// LIVE below as they paste — no "Preview" button. A little visual guide shows
// where to copy from until there's something to preview. All parsing/matching is
// local (see src/api.js -> engine.js); this component just drives paste -> import.

import { useEffect, useState } from 'react';
import { Banner, Badge } from '@camt/ui';
import { api } from './api';
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
        {t('action.import')}
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

            {error && <Banner tone="error">{error}</Banner>}

            <p className="modal-hint">{t('import.hint')}</p>

            <textarea
              className="paste-box"
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

            <div className="modal-actions">
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

// A tiny mock of a grade-portal table showing which rows to select and copy.
// Pure CSS/markup (no image) so it stays crisp and theme-aware.
function CopyGuide({ t }) {
  const rows = [
    ['1', '001101', 'Fundamental English 1', 'A'],
    ['2', '954140', 'Information Technology Literacy', 'A'],
    ['3', '208262', 'Elementary Statistics', 'B+'],
  ];
  return (
    <div className="copy-guide">
      <div className="copy-guide-title">📋 {t('guide.title')}</div>
      <div className="mini-table">
        <div className="mini-row mini-head">
          <span>{t('guide.colNo')}</span>
          <span>{t('guide.colCode')}</span>
          <span>{t('guide.colTitle')}</span>
          <span>{t('guide.colGrade')}</span>
        </div>
        <div className="mini-select-band">
          {rows.map((r) => (
            <div className="mini-row" key={r[1]}>
              <span>{r[0]}</span>
              <span>{r[1]}</span>
              <span className="mini-title">{r[2]}</span>
              <span>{r[3]}</span>
            </div>
          ))}
          <span className="mini-select-tag">{t('guide.selectHint')}</span>
        </div>
      </div>
      <p className="copy-guide-step">{t('guide.step')}</p>
    </div>
  );
}
