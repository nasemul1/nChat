import { create } from 'zustand';

const STORAGE_KEY = 'nchat-state';

const loadState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch { return null; }
};

const saveState = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      conversations: state.conversations,
      activeConvo: state.activeConvo,
      provider: state.provider,
      model: state.model,
      apiKeys: state.apiKeys,
      customEndpoints: state.customEndpoints,
    }));
  } catch {}
};

const getInitial = () => {
  const saved = loadState();
  if (saved) return saved;
  return {
    conversations: [],
    activeConvo: null,
    provider: 'openrouter',
    model: 'openrouter/auto',
    apiKeys: {},
    customEndpoints: {},
  };
};

const initial = getInitial();

const useStore = create((set, get) => ({
  sidebarOpen: window.innerWidth > 768,
  toggleSidebar: (open) => set((s) => ({
    sidebarOpen: open !== undefined ? open : !s.sidebarOpen,
  })),

  conversations: initial.conversations || [],
  activeConvo: initial.activeConvo || null,

  setActiveConvo: (id) => {
    set({ activeConvo: id });
    setTimeout(() => saveState(get()), 0);
  },

  createConversation: () => {
    const id = String(Date.now());
    set((s) => {
      const newState = {
        conversations: [{ id, title: 'New conversation', messages: [] }, ...s.conversations],
        activeConvo: id,
      };
      setTimeout(() => saveState({ ...s, ...newState }), 0);
      return newState;
    });
    return id;
  },

  deleteConversation: (id) => {
    set((s) => {
      const conversations = s.conversations.filter((c) => c.id !== id);
      const activeConvo = s.activeConvo === id
        ? (conversations[0]?.id || null)
        : s.activeConvo;
      const newState = { conversations, activeConvo };
      setTimeout(() => saveState({ ...s, ...newState }), 0);
      return newState;
    });
  },

  addMessage: (convoId, role, content, files) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    set((s) => {
      const conversations = s.conversations.map((c) => {
        if (c.id !== convoId) return c;
        const msg = { role, content, time };
        if (files && files.length > 0) {
          msg.files = files.map((f) => ({ name: f.name, type: f.type, size: f.size, dataUrl: f.dataUrl }));
        }
        const messages = [...c.messages, msg];
        const title = c.messages.length === 0 && role === 'user'
          ? content.slice(0, 48) + (content.length > 48 ? '...' : '')
          : c.title;
        return { ...c, messages, title };
      });
      const newState = { conversations };
      setTimeout(() => saveState({ ...s, ...newState }), 0);
      return newState;
    });
  },

  provider: initial.provider || 'openrouter',
  model: initial.model || 'openrouter/auto',

  setProvider: (provider) => {
    set({ provider });
    setTimeout(() => saveState(get()), 0);
  },

  setModel: (model) => {
    set({ model });
    setTimeout(() => saveState(get()), 0);
  },

  apiKeys: initial.apiKeys || {},
  customEndpoints: initial.customEndpoints || {},

  setApiKey: (provider, key) => {
    set((s) => {
      const apiKeys = { ...s.apiKeys, [provider]: key };
      setTimeout(() => saveState({ ...s, apiKeys }), 0);
      return { apiKeys };
    });
  },

  setCustomEndpoint: (provider, endpoint) => {
    set((s) => {
      const customEndpoints = { ...s.customEndpoints, [provider]: endpoint };
      setTimeout(() => saveState({ ...s, customEndpoints }), 0);
      return { customEndpoints };
    });
  },

  settingsOpen: false,
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
}));

export default useStore;
