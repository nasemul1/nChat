import { create } from 'zustand';

const STORAGE_KEY = 'nchat-state';

const loadState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch { return null; }
};

let saveTimer = null;
const saveState = (state) => {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      const conversations = state.conversations.map((c) => ({
        ...c,
        messages: c.messages.map((m) => {
          if (m.files && m.files.length > 0) {
            return { ...m, files: m.files.map((f) => ({ name: f.name, type: f.type, size: f.size })) };
          }
          return m;
        }),
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        projects: state.projects,
        activeProject: state.activeProject,
        conversations,
        activeConvo: state.activeConvo,
        provider: state.provider,
        model: state.model,
        apiKeys: state.apiKeys,
        customEndpoints: state.customEndpoints,
        accountIds: state.accountIds,
        modelSupportsFiles: state.modelSupportsFiles,
        imageModel: state.imageModel,
        theme: state.theme,
        recentModels: state.recentModels,
        lastSeenVersion: state.lastSeenVersion,
        dontShowReleaseNotes: state.dontShowReleaseNotes,
      }));
    } catch {}
  }, 300);
};

const APP_VERSION = '4.0';

const getInitial = () => {
  const saved = loadState();
  if (saved) return saved;
  return {
    projects: [],
    activeProject: null,
    conversations: [],
    activeConvo: null,
    provider: 'airforce',
    model: '',
    apiKeys: {},
    customEndpoints: {},
    accountIds: {},
    modelSupportsFiles: false,
    imageGenMode: false,
    imageModel: '@cf/black-forest-labs/flux-1-schnell',
    theme: 'dark',
    recentModels: [],
    lastSeenVersion: '',
    dontShowReleaseNotes: false,
  };
};

const initial = getInitial();

const useStore = create((set, get) => ({
  appVersion: APP_VERSION,
  lastSeenVersion: initial.lastSeenVersion || '',
  dontShowReleaseNotes: initial.dontShowReleaseNotes || false,

  shouldShowReleaseNotes: () => {
    const s = get();
    return !s.dontShowReleaseNotes && s.lastSeenVersion !== APP_VERSION;
  },

  markReleaseNotesSeen: () => {
    set({ lastSeenVersion: APP_VERSION });
    setTimeout(() => saveState(get()), 0);
  },

  dismissReleaseNotes: () => {
    set({ lastSeenVersion: APP_VERSION, dontShowReleaseNotes: true });
    setTimeout(() => saveState(get()), 0);
  },

  sidebarOpen: window.innerWidth > 768,
  toggleSidebar: (open) => set((s) => ({
    sidebarOpen: open !== undefined ? open : !s.sidebarOpen,
  })),

  projects: initial.projects || [],
  activeProject: initial.activeProject || null,

  setActiveProject: (id) => {
    set({ activeProject: id, activeConvo: null });
    setTimeout(() => saveState(get()), 0);
  },

  createProject: (name) => {
    const id = String(Date.now());
    const project = {
      id,
      name: name || 'New Project',
      createdAt: new Date().toISOString(),
    };
    set((s) => {
      const projects = [project, ...s.projects];
      const newState = { projects, activeProject: id, activeConvo: null };
      setTimeout(() => saveState({ ...s, ...newState }), 0);
      return newState;
    });
    return id;
  },

  renameProject: (id, name) => {
    set((s) => {
      const projects = s.projects.map((p) => p.id === id ? { ...p, name } : p);
      const newState = { projects };
      setTimeout(() => saveState({ ...s, ...newState }), 0);
      return newState;
    });
  },

  deleteProject: (id) => {
    set((s) => {
      const projects = s.projects.filter((p) => p.id !== id);
      const conversations = s.conversations.filter((c) => c.projectId !== id);
      const activeProject = s.activeProject === id ? null : s.activeProject;
      const activeConvo = s.activeConvo && !conversations.find((c) => c.id === s.activeConvo)
        ? null
        : s.activeConvo;
      const newState = { projects, conversations, activeProject, activeConvo };
      setTimeout(() => saveState({ ...s, ...newState }), 0);
      return newState;
    });
  },

  conversations: initial.conversations || [],
  activeConvo: initial.activeConvo || null,

  setActiveConvo: (id) => {
    set({ activeConvo: id });
    setTimeout(() => saveState(get()), 0);
  },

  createConversation: () => {
    const id = String(Date.now());
    const activeProject = get().activeProject;
    set((s) => {
      const conversation = { id, title: 'New conversation', messages: [] };
      if (activeProject) conversation.projectId = activeProject;
      const newState = {
        conversations: [conversation, ...s.conversations],
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

  addMessage: (convoId, role, content, files, imageData, imageModel) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    set((s) => {
      const conversations = s.conversations.map((c) => {
        if (c.id !== convoId) return c;
        const msg = { role, content, time };
        if (files && files.length > 0) {
          msg.files = files.map((f) => ({ name: f.name, type: f.type, size: f.size, dataUrl: f.dataUrl }));
        }
        if (imageData) {
          msg.imageData = imageData;
          msg.imageModel = imageModel || null;
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

  provider: initial.provider || 'groq',
  model: initial.model || '',

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
  accountIds: initial.accountIds || {},
  modelSupportsFiles: initial.modelSupportsFiles ?? true,

  setModelSupportsFiles: (val) => {
    set({ modelSupportsFiles: val });
    setTimeout(() => saveState(get()), 0);
  },

    imageGenMode: false,
    imageModel: initial.imageModel || '@cf/black-forest-labs/flux-1-schnell',
    imageGenPickerOpen: false,

  setImageGenMode: (val) => {
    set({ imageGenMode: val });
    setTimeout(() => saveState(get()), 0);
  },

  setImageModel: (model) => {
    set({ imageModel: model });
    setTimeout(() => saveState(get()), 0);
  },

  openImageGenPicker: () => set({ imageGenPickerOpen: true }),
  closeImageGenPicker: () => set({ imageGenPickerOpen: false }),

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

  setAccountId: (provider, id) => {
    set((s) => {
      const accountIds = { ...s.accountIds, [provider]: id };
      setTimeout(() => saveState({ ...s, accountIds }), 0);
      return { accountIds };
    });
  },

  settingsOpen: false,
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),

  theme: initial.theme || 'dark',
  setTheme: (theme) => {
    set({ theme });
    document.documentElement.setAttribute('data-theme', theme);
    setTimeout(() => saveState(get()), 0);
  },
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    set({ theme: next });
    document.documentElement.setAttribute('data-theme', next);
    setTimeout(() => saveState(get()), 0);
  },

  recentModels: initial.recentModels || [],
  addRecentModel: (entry) => {
    set((s) => {
      const filtered = s.recentModels.filter(
        (r) => !(r.provider === entry.provider && r.modelId === entry.modelId),
      );
      const recentModels = [entry, ...filtered].slice(0, 8);
      setTimeout(() => saveState({ ...s, recentModels }), 0);
      return { recentModels };
    });
  },

  importData: (data) => {
    set((s) => {
      const newState = {
        conversations: data.conversations || s.conversations,
        projects: data.projects || s.projects,
        apiKeys: data.apiKeys || s.apiKeys,
      };
      setTimeout(() => saveState({ ...s, ...newState }), 0);
      return newState;
    });
  },
}));

export default useStore;
