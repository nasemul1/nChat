import { useState, useEffect, useCallback, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { PROVIDERS } from "../utils/providers";
import { fetchModels } from "../utils/fetchModels";
import { IMAGE_GEN_MODELS } from "../utils/imageGen";
import useStore from "../store";

export default function ModelPickerModal() {
  const {
    provider, model, apiKeys, customEndpoints, accountIds,
    setModel, setModelSupportsFiles,
    recentModels, addRecentModel,
    imageGenMode, setImageGenMode, imageModel, setImageModel,
    imageGenPickerOpen, closeImageGenPicker,
  } = useStore(useShallow((s) => ({
    provider: s.provider,
    model: s.model,
    apiKeys: s.apiKeys,
    customEndpoints: s.customEndpoints,
    accountIds: s.accountIds,
    setModel: s.setModel,
    setModelSupportsFiles: s.setModelSupportsFiles,
    recentModels: s.recentModels,
    addRecentModel: s.addRecentModel,
    imageGenMode: s.imageGenMode,
    setImageGenMode: s.setImageGenMode,
    imageModel: s.imageModel,
    setImageModel: s.setImageModel,
    imageGenPickerOpen: s.imageGenPickerOpen,
    closeImageGenPicker: s.closeImageGenPicker,
  })));

  const [chatOpen, setChatOpen] = useState(false);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const inputRef = useRef(null);

  const open = imageGenPickerOpen ? true : chatOpen;
  const mode = imageGenPickerOpen ? "image" : "chat";

  const apiKey = apiKeys[provider];
  const accountId = accountIds?.[provider];
  const providerConfig = PROVIDERS[provider];

  const loadModels = useCallback(async () => {
    if (providerConfig?.needsKey && !apiKey) { setModels([]); return; }
    if (providerConfig?.needsAccountId && !accountId) { setModels([]); return; }
    setLoading(true);
    setError(null);
    try {
      const extra = providerConfig?.needsAccountId ? { accountId } : undefined;
      const result = await fetchModels(provider, apiKey, customEndpoints[provider], extra);
      if (result && result.length > 0) {
        setModels(result);
      } else {
        setModels([]);
        setError("No models found. Check your API key or Account ID.");
      }
    } catch {
      setModels([]);
      setError("Failed to fetch models.");
    } finally {
      setLoading(false);
    }
  }, [provider, apiKey, customEndpoints, accountId, providerConfig]);

  useEffect(() => {
    if (open) {
      if (mode === "chat") loadModels();
      setSearch("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, mode, loadModels]);

  useEffect(() => {
    if (imageGenPickerOpen) {
      setChatOpen(false);
    }
  }, [imageGenPickerOpen]);

  const closeModal = () => {
    if (imageGenPickerOpen) closeImageGenPicker();
    else setChatOpen(false);
  };

  const filteredChat = models.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredImage = IMAGE_GEN_MODELS.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSelectChat = (id) => {
    setModel(id);
    const selected = models.find((m) => m.id === id);
    setModelSupportsFiles(selected?.supportsFiles ?? false);
    setImageGenMode(false);
    addRecentModel({ provider, modelId: id, modelName: selected?.name || id });
    closeModal();
  };

  const handleSelectImage = (id) => {
    setImageModel(id);
    setImageGenMode(true);
    const selected = IMAGE_GEN_MODELS.find((m) => m.id === id);
    addRecentModel({ provider, modelId: id, modelName: selected?.name || id });
    closeModal();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") closeModal();
  };

  const selectedChat = models.find((m) => m.id === model);
  const selectedImage = IMAGE_GEN_MODELS.find((m) => m.id === imageModel);

  return (
    <>
      {mode === "chat" && (
        <button
          className="model-picker-trigger"
          onClick={() => setChatOpen(true)}
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
            {selectedChat?.name || model || "Select model"}
          </span>
        </button>
      )}

      {open && (
        <div
          className="modal-overlay open"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
          onKeyDown={handleKeyDown}
        >
          <div className="modal model-picker-modal">
            <div className="modal-header">
              <h3>{mode === "image" ? "Select Image Model" : "Select Model"}</h3>
              <button className="modal-close" onClick={closeModal} aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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
                    placeholder={mode === "image" ? "Search image models..." : "Search models..."}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                {error && !loading && (
                  <div className="form-hint" style={{ color: "var(--danger)", marginTop: 8 }}>
                    {error}
                  </div>
                )}
                {mode === "chat" && providerConfig?.needsKey && !apiKey && (
                  <div className="form-hint" style={{ marginTop: 8 }}>
                    Set your API key in Settings first.
                  </div>
                )}
              </div>

              {mode === "image" && (
                <div className="model-picker-list">
                  {filteredImage.map((m) => (
                    <div
                      key={m.id}
                      className={`model-picker-item${m.id === imageModel && imageGenMode ? " selected" : ""}`}
                      onClick={() => handleSelectImage(m.id)}
                    >
                      <div className="model-picker-item-main">
                        <span className="model-picker-item-name">{m.name}</span>
                        {m.id === imageModel && imageGenMode && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        )}
                      </div>
                      <div className="model-picker-item-meta">
                        <span className="model-picker-item-id">{m.id.split('/').pop()}</span>
                        <span className={`speed-badge ${m.speed === 'Fast' || m.speed === 'Ultra-fast' ? 'speed-fast' : m.speed === 'Medium' ? 'speed-medium' : 'speed-slow'}`}>{m.speed}</span>
                        <span>{m.provider}</span>
                      </div>
                    </div>
                  ))}
                  {filteredImage.length === 0 && (
                    <div className="form-hint" style={{ textAlign: "center", padding: 16 }}>
                      No image models match your search.
                    </div>
                  )}
                </div>
              )}

              {mode === "chat" && !loading && filteredChat.length > 0 && (
                <div className="model-picker-list">
                  {filteredChat.map((m) => (
                    <div
                      key={m.id}
                      className={`model-picker-item${m.id === model && !imageGenMode ? " selected" : ""}`}
                      onClick={() => handleSelectChat(m.id)}
                    >
                      <div className="model-picker-item-main">
                        <span className="model-picker-item-name">{m.name}</span>
                        {m.id === model && !imageGenMode && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        )}
                      </div>
                      <div className="model-picker-item-meta">
                        <span className="model-picker-item-id">{m.id}</span>
                        {m.context && <span>{(m.context / 1000).toFixed(0)}K ctx</span>}
                        {m.pricing?.prompt && (
                          <span>${(parseFloat(m.pricing.prompt) * 1000000).toFixed(2)}/M in</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {mode === "chat" && !loading && !error && filteredChat.length === 0 && (
                <div className="form-hint" style={{ textAlign: "center", padding: 16 }}>
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
