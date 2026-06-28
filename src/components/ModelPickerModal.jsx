import { useState, useEffect, useCallback, useRef } from "react";
import { PROVIDERS } from "../utils/providers";
import { fetchModels } from "../utils/fetchModels";
import useStore from "../store";

export default function ModelPickerModal() {
  const { provider, model, apiKeys, customEndpoints, accountIds, setModel, setModelSupportsFiles, recentModels, addRecentModel } = useStore();
  const [open, setOpen] = useState(false);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const inputRef = useRef(null);

  const apiKey = apiKeys[provider];
  const accountId = accountIds?.[provider];

  const loadModels = useCallback(async () => {
    if (!apiKey) { setModels([]); return; }
    if (PROVIDERS[provider]?.needsAccountId && !accountId) {
      setModels([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const extra = PROVIDERS[provider]?.needsAccountId ? { accountId } : undefined;
      const result = await fetchModels(provider, apiKey, customEndpoints[provider], extra);
      if (result && result.length > 0) {
        setModels(result);
      } else {
        const defaults = PROVIDERS[provider]?.defaultModels || [];
        if (defaults.length > 0) {
          setModels(defaults);
        } else {
          setModels([]);
          setError('No models found. Check your API key or Account ID.');
        }
      }
    } catch {
      setModels([]);
      setError("Failed to fetch models.");
    } finally {
      setLoading(false);
    }
  }, [provider, apiKey, customEndpoints, accountId]);

  useEffect(() => {
    if (open) {
      loadModels();
      setSearch("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, loadModels]);

  const filtered = models.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase()),
  );

  const selected = models.find((m) => m.id === model);

  const handleSelect = (id) => {
    setModel(id);
    const selected = models.find((m) => m.id === id);
    setModelSupportsFiles(selected?.supportsFiles ?? true);
    addRecentModel({
      provider,
      modelId: id,
      modelName: selected?.name || id,
    });
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") setOpen(false);
  };

  return (
    <>
      <button
        className="model-picker-trigger"
        onClick={() => setOpen(true)}
        title="Change model"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
        <span className="model-picker-label">
          {selected?.name || model || "Select model"}
        </span>
      </button>

      {open && (
        <div
          className="modal-overlay open"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          onKeyDown={handleKeyDown}
        >
          <div className="modal model-picker-modal">
            <div className="modal-header">
              <h3>Select Model</h3>
              <button
                className="modal-close"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <div className="model-picker-search-row">
                  <input
                    ref={inputRef}
                    type="text"
                    className="form-input"
                    placeholder={
                      loading ? "Loading models..." : "Search models..."
                    }
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    disabled={loading}
                  />
                  {loading && (
                    <div className="model-picker-loading">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  )}
                </div>
                {error && !loading && (
                  <div
                    className="form-hint"
                    style={{ color: "var(--danger)", marginTop: 8 }}
                  >
                    {error}
                  </div>
                )}
                {!apiKey && (
                  <div className="form-hint" style={{ marginTop: 8 }}>
                    Set your API key in Settings first.
                  </div>
                )}
              </div>

              {!loading && !search && recentModels.length > 0 && (
                <>
                  <div className="model-picker-section-label">Recent</div>
                  <div className="model-picker-list">
                    {recentModels.map((r) => (
                      <div
                        key={`${r.provider}-${r.modelId}`}
                        className={`model-picker-item${r.modelId === model && r.provider === provider ? " selected" : ""}`}
                        onClick={() => {
                          if (r.provider === provider) {
                            handleSelect(r.modelId);
                          } else {
                            useStore.getState().setProvider(r.provider);
                            useStore.getState().setModel(r.modelId);
                            setOpen(false);
                          }
                        }}
                      >
                        <div className="model-picker-item-main">
                          <span className="model-picker-item-name">{r.modelName}</span>
                          {r.modelId === model && r.provider === provider && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          )}
                        </div>
                        <div className="model-picker-item-meta">
                          <span className="model-picker-item-id">{r.modelId}</span>
                          {r.provider !== provider && (
                            <span className="model-picker-item-provider">{PROVIDERS[r.provider]?.name || r.provider}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {!loading && filtered.length > 0 && (
                <>
                  {!search && recentModels.length > 0 && (
                    <div className="model-picker-section-label">All Models</div>
                  )}
                  <div className="model-picker-list">
                    {filtered.map((m) => (
                      <div
                        key={m.id}
                        className={`model-picker-item${m.id === model ? " selected" : ""}`}
                        onClick={() => handleSelect(m.id)}
                      >
                        <div className="model-picker-item-main">
                          <span className="model-picker-item-name">{m.name}</span>
                          {m.id === model && (
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="var(--accent)"
                              strokeWidth="2"
                            >
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          )}
                        </div>
                        <div className="model-picker-item-meta">
                          <span className="model-picker-item-id">{m.id}</span>
                          {m.context && (
                            <span>{(m.context / 1000).toFixed(0)}K ctx</span>
                          )}
                          {m.pricing?.prompt && (
                            <span>
                              $
                              {(parseFloat(m.pricing.prompt) * 1000000).toFixed(
                                2,
                              )}
                              /M in
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {!loading && !error && filtered.length === 0 && apiKey && (
                <div
                  className="form-hint"
                  style={{ textAlign: "center", padding: 16 }}
                >
                  No models match your search.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
