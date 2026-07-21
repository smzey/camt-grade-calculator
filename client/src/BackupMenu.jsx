// client/src/BackupMenu.jsx
// Because grades live only in this browser, give the student a way to back them
// up and move them: Export downloads a JSON file; Restore reads one back in.
// This is the whole "sync between devices" story for a server-less app — manual,
// but free and fully private.
//
// In the redesigned header these are the *quiet* actions, so they live behind an
// overflow (⋯) menu instead of competing with the primary "Import" button.

import { useEffect, useRef, useState } from 'react';
import { api } from './api';
import { useLang } from './LanguageContext';

export default function BackupMenu({ onRestored, onError }) {
  const { t } = useLang();
  const fileRef = useRef(null);
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);

  // Close the menu on an outside click or Escape — standard dropdown behaviour.
  useEffect(() => {
    if (!open) return;
    function onDown(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
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

  // Read the chosen file, parse it, and hand it to the store. On success reload so
  // the whole dashboard re-reads the restored data (and plan) from scratch.
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
    <div className="overflow" ref={rootRef}>
      <button
        type="button"
        className="overflow-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('backup.more')}
        title={t('backup.more')}
        onClick={() => setOpen((v) => !v)}
      >
        ⋯
      </button>

      {open && (
        <div className="overflow-menu" role="menu">
          <button type="button" className="overflow-item" role="menuitem" onClick={exportBackup}>
            <span>⬇</span>
            <span>
              {t('backup.export.label')}
              <span className="overflow-item-sub">{t('backup.export.sub')}</span>
            </span>
          </button>
          <button
            type="button"
            className="overflow-item"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              fileRef.current?.click();
            }}
          >
            <span>⤒</span>
            <span>
              {t('backup.restore.label')}
              <span className="overflow-item-sub">{t('backup.restore.sub')}</span>
            </span>
          </button>
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
