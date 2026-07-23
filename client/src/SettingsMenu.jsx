// client/src/SettingsMenu.jsx
// One gear in the header's far corner holding everything that isn't the main
// job: which degree plan you're on, which language the UI speaks, and the
// backup/restore pair. Import stays outside as the hero action — it's the thing
// students actually come here to do.
//
// Backup lives here because grades exist only in this browser: Export downloads
// a JSON file, Restore reads one back. That's the whole "move between devices"
// story for a server-less app — manual, but free and fully private.
//
// Note this is a settings PANEL, not a menu of commands: two of its rows are
// toggles you leave set. So no role="menu"/"menuitem" (those promise arrow-key
// item navigation this isn't) — just a labelled group with Escape and
// click-outside to dismiss.

import { useEffect, useRef, useState } from 'react';
import { SegmentedToggle } from '@camt/ui';
import { api } from './api';
import { useLang } from './LanguageContext';
import { LANGS } from './i18n';

const PLANS = [
  { value: 'WIL', label: 'WIL' },
  { value: 'IS', label: 'IS' },
];

// Export and restore are inverse operations, so they get one icon drawn twice
// with the arrow flipped: the same tray, receiving or releasing. Two unrelated
// glyphs (⬇ / ⤒) made them look like two unrelated features. Stroke weight and
// round caps match the burger so the panel reads as one set.
function TrayIcon({ up = false }) {
  return (
    <svg
      className="settings-icon"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
    >
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* The tray — identical in both, so the arrow is the only difference. */}
        <path d="M2.5 10.5v2.2a.8.8 0 0 0 .8.8h9.4a.8.8 0 0 0 .8-.8v-2.2" />
        {up ? (
          <>
            <path d="M8 10.2V2.4" />
            <path d="M5.2 5.2 8 2.4l2.8 2.8" />
          </>
        ) : (
          <>
            <path d="M8 2.4v7.8" />
            <path d="M5.2 7.4 8 10.2l2.8-2.8" />
          </>
        )}
      </g>
    </svg>
  );
}

export default function SettingsMenu({
  plan,
  onPlanChange,
  gpaHidden,
  onGpaHiddenChange,
  onRestored,
  onReset,
  onError,
}) {
  // Reset asks for confirmation inline rather than via window.confirm: the data
  // is only in this browser, so an accidental click is unrecoverable unless a
  // backup happens to exist.
  const [confirmingReset, setConfirmingReset] = useState(false);
  const { t, lang, setLang } = useLang();
  const fileRef = useRef(null);
  const rootRef = useRef(null);
  const btnRef = useRef(null);
  const [open, setOpen] = useState(false);

  // Close on an outside click or Escape. Escape also returns focus to the gear,
  // so keyboard users aren't dropped at the top of the document.
  useEffect(() => {
    if (!open) return;
    function onDown(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') {
        setOpen(false);
        btnRef.current?.focus();
      }
    }
    setConfirmingReset(false); // never reopen already armed
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Serialize the local data and trigger a download via a temporary object URL.
  function exportBackup() {
    setOpen(false);
    try {
      const blob = new Blob([JSON.stringify(api.exportData(), null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'camt-grades-backup.json';
      a.click();
      URL.revokeObjectURL(url); // free the blob once the download has started
    } catch (e) {
      onError?.(e.message);
    }
  }

  // Read the chosen file, parse it, hand it to the store. On success the caller
  // reloads so the whole dashboard re-reads the restored data (and plan).
  async function onFile(event) {
    const file = event.target.files?.[0];
    event.target.value = ''; // let the same file be picked again later
    if (!file) return;
    try {
      const count = api.importData(JSON.parse(await file.text()));
      onRestored?.(count);
    } catch (e) {
      onError?.(e.message);
    }
  }

  return (
    <div className="settings" ref={rootRef}>
      <button
        ref={btnRef}
        type="button"
        className="settings-btn"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={t('settings.open')}
        title={t('settings.open')}
        onClick={() => setOpen((v) => !v)}
      >
        {/* Drawn rather than the ☰ character, which shifts weight and baseline
            between platform fonts. currentColor so it inherits the button's
            hover/open state. */}
        <svg
          className="burger"
          width="16"
          height="12"
          viewBox="0 0 16 12"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M1 1.5h14M1 6h14M1 10.5h14"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {open && (
        <div className="settings-panel" aria-label={t('settings.open')}>
          {/* Settings you leave set. The plan changes what the whole page
              requires, so it's first. */}
          <div className="settings-row">
            <span className="settings-row-label">{t('plan.label')}</span>
            <SegmentedToggle value={plan} onChange={onPlanChange} options={PLANS} />
          </div>
          <div className="settings-row">
            <span className="settings-row-label">{t('gpa.label')}</span>
            {/* Phrased as Show/Hide rather than a "Hide GPA" on/off switch —
                "Hide: off" is a double negative to read past. */}
            <SegmentedToggle
              value={gpaHidden ? 'hide' : 'show'}
              onChange={(v) => onGpaHiddenChange(v === 'hide')}
              options={[
                { value: 'show', label: t('gpa.show') },
                { value: 'hide', label: t('gpa.hide') },
              ]}
            />
          </div>
          <div className="settings-row">
            <span className="settings-row-label">{t('lang.label')}</span>
            <SegmentedToggle value={lang} onChange={setLang} options={LANGS} />
          </div>

          <div className="settings-sep" />

          {/* One-shot actions. */}
          <button type="button" className="settings-item" onClick={exportBackup}>
            <TrayIcon />
            <span>
              {t('backup.export.label')}
              <span className="settings-item-sub">{t('backup.export.sub')}</span>
            </span>
          </button>
          <button
            type="button"
            className="settings-item"
            onClick={() => {
              setOpen(false);
              fileRef.current?.click();
            }}
          >
            <TrayIcon up />
            <span>
              {t('backup.restore.label')}
              <span className="settings-item-sub">{t('backup.restore.sub')}</span>
            </span>
          </button>

          <div className="settings-sep" />

          {confirmingReset ? (
            <div className="settings-confirm">
              <p className="settings-confirm-text">{t('reset.confirm')}</p>
              <div className="settings-confirm-actions">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setConfirmingReset(false)}
                >
                  {t('reset.cancel')}
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => {
                    setConfirmingReset(false);
                    setOpen(false);
                    onReset?.();
                  }}
                >
                  {t('reset.go')}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="settings-item settings-item-danger"
              onClick={() => setConfirmingReset(true)}
            >
              <svg
                className="settings-icon"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                aria-hidden="true"
                focusable="false"
              >
                <g
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                >
                  <path d="M2.6 4.3h10.8" />
                  <path d="M6.3 4.3V2.9a.9.9 0 0 1 .9-.9h1.6a.9.9 0 0 1 .9.9v1.4" />
                  <path d="M4.1 4.3l.6 8.5a1 1 0 0 0 1 .9h4.6a1 1 0 0 0 1-.9l.6-8.5" />
                </g>
              </svg>
              <span>
                {t('reset.label')}
                <span className="settings-item-sub">{t('reset.sub')}</span>
              </span>
            </button>
          )}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        onChange={onFile}
        style={{ display: 'none' }}
      />
    </div>
  );
}
