export const PROVIDERS = {
  openrouter: {
    name: 'OpenRouter',
    description: 'GPT-4o, Claude, Gemini, Llama & more',
    needsKey: true,
    defaultEndpoint: 'https://openrouter.ai/api/v1/chat/completions',
    modelsEndpoint: 'https://openrouter.ai/api/v1/models',
    modelsHeader: (key) => ({ 'Authorization': `Bearer ${key}` }),
    parseModels: (data) => {
      const models = (data?.data || [])
        .filter((m) => {
          const outMods = m.architecture?.output_modalities || [];
          return outMods.includes('text');
        })
        .map((m) => ({
          id: m.id,
          name: m.name || m.id,
          context: m.context_length,
          pricing: m.pricing,
        }));
      if (!models.some((m) => m.id === 'openrouter/auto')) {
        models.unshift({ id: 'openrouter/auto', name: 'Auto (Router)', context: null, pricing: null });
      }
      return models;
    },
  },
  groq: {
    name: 'Groq',
    description: 'Fast inference, Llama, Mixtral, Gemma',
    needsKey: true,
    defaultEndpoint: 'https://api.groq.com/openai/v1/chat/completions',
    modelsEndpoint: 'https://api.groq.com/openai/v1/models',
    modelsHeader: (key) => ({ 'Authorization': `Bearer ${key}` }),
    parseModels: (data) => {
      return (data?.data || [])
        .filter((m) => m.id && !m.id.includes('whisper') && !m.id.includes('tts') && !m.id.includes('embedding'))
        .map((m) => ({
          id: m.id,
          name: m.id,
          context: m.context_window || null,
          pricing: null,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    },
  },
  openai_compat: {
    name: 'OpenAI Compat',
    description: 'Custom OpenAI-compatible endpoints',
    needsKey: true,
    defaultEndpoint: '',
    modelsEndpoint: '',
    modelsHeader: (key) => ({ 'Authorization': `Bearer ${key}` }),
    parseModels: (data) => {
      return (data?.data || [])
        .map((m) => ({
          id: m.id,
          name: m.id,
          context: null,
          pricing: null,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    },
  },
};
