import { PROVIDERS } from "./providers";

const PROVIDER_PREFIX = {
  ollama_cloud: "ollama",
  cloudflare_ai: "cf",
  openai_compat: "openai_compat",
  airforce: "airforce",
  groq: "groq",
  mistral: "mistral",
};

function rewriteUrl(url, provider, apiKey) {
  if (!url.startsWith("/api/")) return url;
  const prefix = PROVIDER_PREFIX[provider] || provider;
  const path = url.replace(`/api/${prefix}/`, "");
  let proxy = `/api/proxy?provider=${prefix}&path=${encodeURIComponent(path)}`;
  if (apiKey) proxy += `&key=${encodeURIComponent(apiKey)}`;
  return proxy;
}

export async function fetchModels(providerKey, apiKey, customEndpoint, extra) {
  const provider = PROVIDERS[providerKey];
  if (!provider) return null;

  const needsKey = provider.needsKey && !apiKey;
  const needsAccountId = provider.needsAccountId && !extra?.accountId;
  if (needsKey || needsAccountId) return null;

  const hasDynamicEndpoint =
    providerKey === "cloudflare_ai" || providerKey === "openai_compat";
  if (!hasDynamicEndpoint && !provider.modelsEndpoint) return null;

  let url;
  if (typeof provider.modelsEndpoint === "function") {
    url = provider.modelsEndpoint(apiKey);
  } else if (providerKey === "cloudflare_ai") {
    const accountId = extra?.accountId;
    if (accountId) {
      url = `/api/cf/client/v4/accounts/${accountId}/ai/models/search`;
    } else {
      url = provider.modelsEndpoint;
    }
  } else if (providerKey === "openai_compat" && customEndpoint) {
    url =
      customEndpoint.replace(/\/chat\/completions\/?$/, "").replace(/\/$/, "") +
      "/models";
  } else {
    url = provider.modelsEndpoint;
  }

  if (!url) return null;

  url = rewriteUrl(url, providerKey, apiKey);

  try {
    const headers = provider.modelsHeader ? provider.modelsHeader(apiKey) : {};
    const res = await fetch(url, { headers });

    if (!res.ok) {
      let detail = "";
      try { detail = (await res.text()).slice(0, 200); } catch {}
      let msg = `Failed to fetch models (HTTP ${res.status})`;
      try {
        const parsed = JSON.parse(detail);
        const m = parsed.error?.message || parsed.message || parsed.detail;
        if (m) msg = `${m} (HTTP ${res.status})`;
      } catch {
        if (detail) msg += `: ${detail}`;
      }
      throw new Error(msg);
    }

    const data = await res.json();
    return provider.parseModels ? provider.parseModels(data) : null;
  } catch (err) {
    console.warn(`Error fetching models from ${provider.name}:`, err);
    throw err;
  }
}
