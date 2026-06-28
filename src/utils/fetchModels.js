import { PROVIDERS } from "./providers";

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

  try {
    const headers = provider.modelsHeader ? provider.modelsHeader(apiKey) : {};
    const res = await fetch(url, { headers });

    if (!res.ok) {
      console.warn(
        `Failed to fetch models from ${provider.name}: ${res.status}`,
      );
      return null;
    }

    const data = await res.json();
    return provider.parseModels ? provider.parseModels(data) : null;
  } catch (err) {
    console.warn(`Error fetching models from ${provider.name}:`, err);
    return null;
  }
}
