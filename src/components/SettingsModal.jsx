import { useState, useEffect, useCallback } from "react";
import { PROVIDERS } from "../utils/providers";
import { fetchModels } from "../utils/fetchModels";
import useStore from "../store";

export default function SettingsModal() {
  const {
    settingsOpen,
    closeSettings,
    provider,
    model,
    apiKeys,
    customEndpoints,
    accountIds,
    setApiKey,
    setProvider,
    setModel,
    setCustomEndpoint,
    setAccountId,
    setModelSupportsFiles,
    addRecentModel,
  } = useStore();

  const [localKey, setLocalKey] = useState("");
  const [localEndpoint, setLocalEndpoint] = useState("");
  const [localAccountId, setLocalAccountId] = useState("");
  const [localProvider, setLocalProvider] = useState(provider);
  const [localModel, setLocalModel] = useState(model);
  const [showKey, setShowKey] = useState(false);
  const [models, setModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState(null);
  const [modelSearch, setModelSearch] = useState("");

  useEffect(() => {
    if (settingsOpen) {
      setLocalProvider(provider);
      setLocalModel(model);
      setLocalKey(apiKeys[provider] || "");
      setLocalEndpoint(customEndpoints[provider] || "");
      setLocalAccountId(accountIds[provider] || "");
      setShowKey(false);
      setModelSearch("");
    }
  }, [settingsOpen, provider, model, apiKeys, customEndpoints, accountIds]);

  const loadModels = useCallback(async () => {
    const cfg = PROVIDERS[localProvider];
    const needsKey = cfg?.needsKey && !localKey;
    const needsAccountId = cfg?.needsAccountId && !localAccountId;
    if (needsKey || needsAccountId) {
      setModels([]);
      return;
    }
    setModelsLoading(true);
    setModelsError(null);
    try {
      const extra = cfg?.needsAccountId
        ? { accountId: localAccountId }
        : undefined;
      const result = await fetchModels(
        localProvider,
        localKey,
        localEndpoint,
        extra,
      );
      if (result && result.length > 0) {
        setModels(result);
      } else {
        const defaults = PROVIDERS[localProvider]?.defaultModels || [];
        if (defaults.length > 0) {
          setModels(defaults);
        } else {
          setModels([]);
          setModelsError("No models found. Check your credentials.");
        }
      }
    } catch {
      setModels([]);
      setModelsError("Failed to fetch models.");
    } finally {
      setModelsLoading(false);
    }
  }, [localProvider, localKey, localEndpoint, localAccountId]);

  useEffect(() => {
    if (settingsOpen) {
      loadModels();
    }
  }, [settingsOpen, loadModels]);

  const handleProviderChange = (p) => {
    const config = PROVIDERS[p];
    if (config?.disabled) return;
    setLocalProvider(p);
    setLocalModel("");
    setLocalKey(apiKeys[p] || "");
    setLocalEndpoint(customEndpoints[p] || "");
    setLocalAccountId(accountIds[p] || "");
    setModels([]);
    setModelSearch("");
  };

  const handleSave = () => {
    setProvider(localProvider);
    setApiKey(localProvider, localKey);
    setModel(localModel);
    setCustomEndpoint(localProvider, localEndpoint);
    setAccountId(localProvider, localAccountId);
    const selected = models.find((m) => m.id === localModel);
    setModelSupportsFiles(selected?.supportsFiles ?? true);
    addRecentModel({
      provider: localProvider,
      modelId: localModel,
      modelName: selected?.name || localModel,
    });
    closeSettings();
  };

  const filteredModels = models.filter(
    (m) =>
      m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
      m.id.toLowerCase().includes(modelSearch.toLowerCase()),
  );

  const selectedModel = models.find((m) => m.id === localModel);
  const config = PROVIDERS[localProvider];

  return (
    <div
      className={`modal-overlay${settingsOpen ? " open" : ""}`}
      onClick={(e) => e.target === e.currentTarget && closeSettings()}
    >
      <div className="modal">
        <div className="modal-header">
          <h3>API Configuration</h3>
          <button
            className="modal-close"
            onClick={closeSettings}
            aria-label="Close modal"
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
          <div className="form-hint" style={{ marginBottom: 12 }}>
            ApiKey/data will not be collected by nChat. It just saves data in your local machine.
          </div>
          <div className="form-group">
            <label className="form-label">Provider</label>
            <div className="provider-grid">
              {Object.entries(PROVIDERS).map(([key, p]) => (
                <div
                  key={key}
                  className={`provider-card${localProvider === key ? " selected" : ""}${p.disabled ? " disabled" : ""}`}
                  onClick={() => handleProviderChange(key)}
                  title={p.disabled ? p.disabledReason : ""}
                >
                  <div className="provider-card-name">{p.name}</div>
                  <div className="provider-card-desc">{p.description}</div>
                  {p.disabled && (
                    <div className="provider-card-badge">
                      {p.disabledReason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">API Key</label>
            <div className="api-key-row">
              <input
                type={showKey ? "text" : "password"}
                className="form-input"
                value={localKey}
                onChange={(e) => setLocalKey(e.target.value)}
                placeholder={
                  localProvider === "groq"
                    ? "gsk_..."
                    : localProvider === "cloudflare_ai"
                      ? "cfut_..."
                      : "sk-..."
                }
                autoComplete="off"
              />
              <button
                className="api-key-toggle"
                onClick={() => setShowKey(!showKey)}
                aria-label="Toggle key visibility"
              >
                {showKey ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            <div className="form-hint">
              Your key stays local — never sent to any server except the
              provider API.
            </div>
          </div>

          {localProvider === "cloudflare_ai" && (
            <div className="form-group">
              <label className="form-label">Account ID</label>
              <input
                type="text"
                className="form-input"
                value={localAccountId}
                onChange={(e) => setLocalAccountId(e.target.value)}
                placeholder="fe27f40f123542c95f623461d1a49a06"
                autoComplete="off"
              />
              <div className="form-hint">
                Found in the Cloudflare dashboard URL or
                <code> /accounts/&lt;id&gt;/...</code>. Required to list and run
                models.
              </div>
            </div>
          )}

          {localProvider === "openai_compat" && (
            <div className="form-group">
              <label className="form-label">Endpoint</label>
              <input
                type="text"
                className="form-input"
                value={localEndpoint}
                onChange={(e) => setLocalEndpoint(e.target.value)}
                placeholder="https://api.example.com/v1/chat/completions"
              />
              <div className="form-hint">
                Enter your OpenAI-compatible endpoint. Models will be fetched
                from it.
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Model</label>
            <div className="model-selector">
              <input
                type="text"
                className="form-input model-search"
                placeholder={
                  modelsLoading ? "Loading models..." : "Search models..."
                }
                value={modelSearch}
                onChange={(e) => setModelSearch(e.target.value)}
                disabled={modelsLoading}
              />
              {modelsLoading && (
                <div className="model-loading">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
              {modelsError && !modelsLoading && (
                <div className="form-hint" style={{ color: "var(--danger)" }}>
                  {modelsError}
                </div>
              )}
              {!modelsLoading &&
                !modelsError &&
                filteredModels.length === 0 &&
                localKey && (
                  <div className="form-hint">
                    No models found. Try a different search.
                  </div>
                )}
              {!modelsLoading && filteredModels.length > 0 && (
                <div className="model-list">
                  {filteredModels.map((m) => (
                    <div
                      key={m.id}
                      className={`model-option${localModel === m.id ? " selected" : ""}`}
                      onClick={() => {
                        setLocalModel(m.id);
                        setModelSearch("");
                      }}
                    >
                      <div className="model-option-name">{m.name}</div>
                      <div className="model-option-meta">
                        {m.context && (
                          <span>{(m.context / 1000).toFixed(0)}K ctx</span>
                        )}
                        {m.pricing && (
                          <span>
                            $
                            {(
                              (parseFloat(m.pricing.prompt) || 0) * 1000000
                            ).toFixed(2)}
                            /M in
                            {" · "}$
                            {(
                              (parseFloat(m.pricing.completion) || 0) * 1000000
                            ).toFixed(2)}
                            /M out
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {selectedModel && (
                <div className="model-selected-badge">
                  Selected: {selectedModel.name}
                  <button
                    className="model-clear-btn"
                    onClick={() => setLocalModel("")}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={closeSettings}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!localModel}
          >
            Save Config
          </button>
        </div>
      </div>
    </div>
  );
}
