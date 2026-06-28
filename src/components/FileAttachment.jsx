import { useRef } from 'react';

const ACCEPTED = 'image/*,.pdf,.txt,.md,.json,.csv,.xml,.yaml,.yml,.js,.jsx,.ts,.tsx,.py,.rb,.go,.rs,.java,.c,.cpp,.h,.css,.html,.sql,.sh,.log';

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, type: file.type, size: file.size, dataUrl: reader.result });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function isImage(type) {
  return type.startsWith('image/');
}

export function AttachButton({ onClick, disabled }) {
  return (
    <button
      className={`attach-btn${disabled ? " disabled" : ""}`}
      onClick={onClick}
      title={disabled ? "This model does not support file input" : "Attach files"}
      type="button"
      disabled={disabled}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
      </svg>
    </button>
  );
}

export function AttachmentPreview({ files, setFiles }) {
  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  if (files.length === 0) return null;

  return (
    <div className="attachment-preview">
      {files.map((f, i) => (
        <div key={i} className="attachment-chip">
          {isImage(f.type) ? (
            <img src={f.dataUrl} alt={f.name} className="attachment-thumb" />
          ) : (
            <div className="attachment-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
              </svg>
            </div>
          )}
          <div className="attachment-info">
            <span className="attachment-name">{f.name}</span>
            <span className="attachment-size">{formatSize(f.size)}</span>
          </div>
          <button className="attachment-remove" onClick={() => removeFile(i)} aria-label="Remove file">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

export default function FileAttachment({ files, setFiles, supportsFiles }) {
  const inputRef = useRef(null);

  const handleFiles = async (e) => {
    const selected = Array.from(e.target.files || []);
    const newFiles = await Promise.all(selected.map(fileToDataUrl));
    setFiles((prev) => [...prev, ...newFiles]);
    e.target.value = '';
  };

  return (
    <>
      <AttachButton onClick={() => inputRef.current?.click()} disabled={!supportsFiles} />
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED}
        onChange={handleFiles}
        style={{ display: 'none' }}
        disabled={!supportsFiles}
      />
    </>
  );
}
