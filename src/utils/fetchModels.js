import { PROVIDERS } from './providers';

export async function fetchModels(providerKey, apiKey, customEndpoint) {
  const provider = PROVIDERS[providerKey];
  if (!provider?.modelsEndpoint) return null;

  let url;
  if (typeof provider.modelsEndpoint === 'function') {
    url = provider.modelsEndpoint(apiKey);
  } else if (providerKey === 'openai_compat' && customEndpoint) {
    url = customEndpoint.replace(/\/chat\/completions\/?$/, '').replace(/\/$/, '') + '/models';
  } else {
    url = provider.modelsEndpoint;
  }

  if (!url) return null;

  try {
    const headers = provider.modelsHeader ? provider.modelsHeader(apiKey) : {};
    const res = await fetch(url, { headers });

    if (!res.ok) {
      console.warn(`Failed to fetch models from ${provider.name}: ${res.status}`);
      return null;
    }

    const data = await res.json();
    return provider.parseModels ? provider.parseModels(data) : null;
  } catch (err) {
    console.warn(`Error fetching models from ${provider.name}:`, err);
    return null;
  }
}
