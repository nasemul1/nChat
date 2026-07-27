const APP_VERSION = '3.0';

export function exportBackup(state) {
  const data = {
    app: 'nchat',
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    conversations: state.conversations || [],
    projects: state.projects || [],
    apiKeys: state.apiKeys || {},
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `nchat-backup-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function readBackupFile(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.name.endsWith('.json')) {
      return reject(new Error('Invalid file. Please select a .json backup file.'));
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || parsed.app !== 'nchat') {
          return reject(new Error('Not a valid nChat backup file.'));
        }
        resolve({
          conversations: parsed.conversations || [],
          projects: parsed.projects || [],
          apiKeys: parsed.apiKeys || {},
          version: parsed.version,
          exportedAt: parsed.exportedAt,
        });
      } catch {
        reject(new Error('Could not parse backup file.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsText(file);
  });
}
