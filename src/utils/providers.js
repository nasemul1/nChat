export const PROVIDERS = {
  airforce: {
    name: "AirForce",
    description: "100+ models — Claude, GPT, Gemini, Llama & more",
    needsKey: true,
    defaultEndpoint: "/api/airforce/v1/chat/completions",
    modelsEndpoint: "/api/airforce/v1/models",
    modelsHeader: (key) => ({ Authorization: `Bearer ${key}` }),
    parseModels: (data) => {
      return (data?.data || [])
        .filter((m) => m.supports_chat && !m.moderated)
        .map((m) => ({
          id: m.id,
          name: `${m.id} (${m.owned_by})`,
          context: m.context_length || null,
          pricing: m.pricepermilliontokens
            ? {
                prompt: String(m.pricepermilliontokens / 1000000),
                completion: String((m.output_pricepermilliontokens || m.pricepermilliontokens) / 1000000),
              }
            : null,
          supportsFiles: m.supports_images || m.supports_vision || false,
          tier: m.tier || "paid",
          status: m.status || "unknown",
        }))
        .sort((a, b) => {
          if (a.tier === "free" && b.tier !== "free") return -1;
          if (a.tier !== "free" && b.tier === "free") return 1;
          return a.id.localeCompare(b.id);
        });
    },
  },
  groq: {
    name: "Groq",
    description: "Fast inference, Llama, Mixtral, Gemma",
    needsKey: true,
    defaultEndpoint: "/api/groq/openai/v1/chat/completions",
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
    defaultEndpoint: "/api/mistral/v1/chat/completions",
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
