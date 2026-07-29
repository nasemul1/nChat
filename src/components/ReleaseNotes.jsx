import { useState, useEffect } from 'react';
import useStore from '../store';

const RELEASE_NOTES = [
  {
    title: 'Image Generation',
    items: [
      'Generate images directly from chat using Cloudflare Workers AI',
      '11 text-to-image models: FLUX.1, FLUX.2, SDXL, Dreamshaper & more',
      'Speed badges to pick fast or high-quality models',
      'Download button on hover over generated images',
    ],
  },
  {
    title: 'Backup & Export',
    items: [
      'Export all conversations, projects and settings to a file',
      'Import from a backup file to restore your data',
    ],
  },
  {
    title: 'Improved Provider Support',
    items: [
      'Added AirForce provider with 100+ free and paid models',
      'Added Ollama Cloud — no API key required',
      'Fixed model loading for providers without API keys',
      'Better error messages showing the actual provider error',
    ],
  },
  {
    title: 'Other Improvements',
    items: [
      'Auto-retry on 429/502/503/504 errors',
      'Paste images directly from clipboard',
      'Version badge in sidebar',
      'Reduced context window for faster responses',
    ],
  },
];

export default function ReleaseNotes() {
  const { shouldShowReleaseNotes, markReleaseNotesSeen, dismissReleaseNotes } = useStore();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (shouldShowReleaseNotes()) {
      setOpen(true);
    }
  }, []);

  const handleDismiss = () => {
    dismissReleaseNotes();
    setOpen(false);
  };

  const handleClose = () => {
    markReleaseNotesSeen();
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="modal release-notes-modal">
        <div className="modal-header">
          <h3>
            <span className="release-notes-badge">v4</span>
            What's New
          </h3>
          <button className="modal-close" onClick={handleClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="modal-body release-notes-body">
          {RELEASE_NOTES.map((section) => (
            <div key={section.title} className="release-notes-section">
              <h4 className="release-notes-section-title">{section.title}</h4>
              <ul className="release-notes-list">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="release-notes-footer">
          <button className="release-notes-dont-show" onClick={handleDismiss}>
            Don't show again
          </button>
          <button className="release-notes-close" onClick={handleClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
