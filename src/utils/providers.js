export const PROVIDERS = {
  openrouter: {
    name: "OpenRouter",
    description: "GPT-4o, Claude, Gemini, Llama & more",
    needsKey: true,
    defaultEndpoint: "https://openrouter.ai/api/v1/chat/completions",
    modelsEndpoint: "/api/openrouter/api/v1/models",
    modelsHeader: (key) => ({ Authorization: `Bearer ${key}` }),
    parseModels: (data) => {
      const models = (data?.data || [])
        .filter((m) => {
          const outMods = m.architecture?.output_modalities || [];
          return outMods.includes("text");
        })
        .map((m) => {
          const inMods = m.architecture?.input_modalities || [];
          const hasImageInput = inMods.includes("image") || inMods.includes("image_url");
          return {
            id: m.id,
            name: m.name || m.id,
            context: m.context_length,
            pricing: m.pricing,
            supportsFiles: hasImageInput,
          };
        });
      if (!models.some((m) => m.id === "openrouter/auto")) {
        models.unshift({
          id: "openrouter/auto",
          name: "Auto (Router)",
          context: null,
          pricing: null,
          supportsFiles: false,
        });
      }
      return models;
    },
  },
  groq: {
    name: "Groq",
    description: "Fast inference, Llama, Mixtral, Gemma",
    needsKey: true,
    defaultEndpoint: "https://api.groq.com/openai/v1/chat/completions",
    modelsEndpoint: "/api/groq/openai/v1/models",
    modelsHeader: (key) => ({ Authorization: `Bearer ${key}` }),
    parseModels: (data) => {
      return (data?.data || [])
        .filter(
          (m) =>
            m.id &&
            !m.id.includes("whisper") &&
            !m.id.includes("tts") &&
            !m.id.includes("embedding"),
        )
        .map((m) => ({
          id: m.id,
          name: m.id,
          context: m.context_window || null,
          pricing: null,
          supportsFiles: false,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    },
  },
  mistral: {
    name: "Mistral",
    description: "Mistral Large, Medium, Codestral & more",
    needsKey: true,
    defaultEndpoint: "https://api.mistral.ai/v1/chat/completions",
    modelsEndpoint: "/api/mistral/v1/models",
    modelsHeader: (key) => ({ Authorization: `Bearer ${key}` }),
    parseModels: (data) => {
      return (data?.data || [])
        .filter((m) => m.id && !m.id.includes("embed") && !m.id.includes("tts"))
        .map((m) => ({
          id: m.id,
          name: m.name || m.id,
          context: m.context_window || null,
          pricing: null,
          supportsFiles: /mistral.*vision|pixtral|large.*vision/i.test(m.id),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    },
  },
  ollama_cloud: {
    name: "Ollama Cloud",
    description: "Cloud-hosted Llama, Qwen, Gemma & more",
    needsKey: true,
    defaultEndpoint: "/api/ollama/v1/chat/completions",
    modelsEndpoint: "/api/ollama/v1/models",
    modelsHeader: (key) => ({ Authorization: `Bearer ${key}` }),
    parseModels: (data) => {
      return (data?.data || [])
        .map((m) => ({
          id: m.id,
          name: m.id,
          context: null,
          pricing: null,
          supportsFiles: false,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    },
  },
  cloudflare_ai: {
    name: "Cloudflare AI",
    description: "Workers AI — Llama, Mistral, Qwen & more",
    needsKey: true,
    needsAccountId: true,
    defaultEndpoint: "",
    modelsEndpoint: "",
    modelsHeader: (key) => ({ Authorization: `Bearer ${key}` }),
    parseModels: (data) => {
      const list = data?.result || [];
      const textGenTasks = new Set([
        "c329a1f9-323d-4e91-b2aa-582dd4188d34",
        "882a91d1-c331-4eec-bdad-834c919942a8",
      ]);
      const filtered = list.filter((m) => {
        const taskId = m.task?.id;
        const taskName = (m.task?.name || "").toLowerCase();
        if (taskId && textGenTasks.has(taskId)) return true;
        if (taskName === "text generation" || taskName === "image-to-text")
          return true;
        return m.name && m.name.startsWith("@cf/");
      });
      const source = filtered.length > 0 ? filtered : list;
      return source
        .map((m) => {
          const hasVision = (m.properties || []).some(
            (p) => p.property_id === "vision" && p.value === "true",
          );
          return {
            id: m.name || m.id,
            name: m.name || m.id,
            context: null,
            pricing: null,
            task: m.task?.name || null,
            supportsFiles: hasVision,
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
    },
  },
  openai_compat: {
    name: "OpenAI Compat",
    description: "Custom OpenAI-compatible endpoints",
    needsKey: true,
    defaultEndpoint: "",
    modelsEndpoint: "",
    modelsHeader: (key) => ({ Authorization: `Bearer ${key}` }),
    parseModels: (data) => {
      return (data?.data || [])
        .map((m) => ({
          id: m.id,
          name: m.id,
          context: null,
          pricing: null,
          supportsFiles: false,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    },
  },
};
