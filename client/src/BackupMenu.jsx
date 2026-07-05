// client/src/BackupMenu.jsx
// Because grades live only in this browser, give the student a way to back them
// up and move them: Export downloads a JSON file; Restore reads one back in.
// This is the whole "sync between devices" story for a server-less app — manual,
// but free and fully private.

import { useRef } from 'react';
import { api } from './api';

export default function BackupMenu({ onRestored, onError }) {
  const fileRef = useRef(null);

  // Serialize the local data and trigger a download via a temporary object URL.
  function exportBackup() {
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
    <>
      <button type="button" className="backup-btn" onClick={exportBackup} title="Download a backup of your grades">
        ⬇ Export
      </button>
      <button
        type="button"
        className="backup-btn"
        onClick={() => fileRef.current?.click()}
        title="Restore grades from a backup file"
      >
        ⤒ Restore
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        onChange={onFile}
        style={{ display: 'none' }}
      />
    </>
  );
}
