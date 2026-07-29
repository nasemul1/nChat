export const IMAGE_GEN_MODELS = [
  { id: '@cf/black-forest-labs/flux-1-schnell', name: 'FLUX.1 schnell', speed: 'Fast', quality: 'Good', provider: 'Black Forest Labs' },
  { id: '@cf/black-forest-labs/flux-2-klein-4b', name: 'FLUX.2 klein 4B', speed: 'Ultra-fast', quality: 'Good', provider: 'Black Forest Labs' },
  { id: '@cf/black-forest-labs/flux-2-klein-9b', name: 'FLUX.2 klein 9B', speed: 'Ultra-fast', quality: 'Better', provider: 'Black Forest Labs' },
  { id: '@cf/black-forest-labs/flux-2-dev', name: 'FLUX.2 dev', speed: 'Slow', quality: 'Best', provider: 'Black Forest Labs' },
  { id: '@cf/leonardo/phoenix-1.0', name: 'Phoenix 1.0', speed: 'Medium', quality: 'Best (text)', provider: 'Leonardo' },
  { id: '@cf/leonardo/lucid-origin', name: 'Lucid Origin', speed: 'Medium', quality: 'Best (photo)', provider: 'Leonardo' },
  { id: '@cf/stabilityai/stable-diffusion-xl-base-1.0', name: 'SDXL Base', speed: 'Medium', quality: 'Good', provider: 'Stability AI' },
  { id: '@cf/bytedance/stable-diffusion-xl-lightning', name: 'SDXL Lightning', speed: 'Fast', quality: 'Good', provider: 'ByteDance' },
  { id: '@cf/lykon/dreamshaper-8-lcm', name: 'Dreamshaper 8', speed: 'Medium', quality: 'Good', provider: 'Lykon' },
  { id: '@cf/runwayml/stable-diffusion-v1-5-img2img', name: 'SD 1.5 Img2Img', speed: 'Medium', quality: 'Good', provider: 'RunwayML' },
  { id: '@cf/runwayml/stable-diffusion-v1-5-inpainting', name: 'SD 1.5 Inpainting', speed: 'Medium', quality: 'Good', provider: 'RunwayML' },
];

function rewriteUrl(path, apiKey) {
  let proxy = `/api/proxy?provider=cf&path=${encodeURIComponent(path)}`;
  if (apiKey) proxy += `&key=${encodeURIComponent(apiKey)}`;
  return proxy;
}

export async function generateImage({
  model,
  prompt,
  accountId,
  apiKey,
  width = 1024,
  height = 1024,
  steps,
  guidance,
  negativePrompt,
  seed,
  signal,
}) {
  if (!accountId) throw new Error('Cloudflare Account ID is required. Set it in Settings.');
  if (!prompt) throw new Error('Prompt is required.');

  const path = `client/v4/accounts/${accountId}/ai/run/${model}`;
  const url = rewriteUrl(path, apiKey);

  const body = { prompt, width, height };
  if (steps) body.num_steps = steps;
  if (guidance) body.guidance = guidance;
  if (negativePrompt) body.negative_prompt = negativePrompt;
  if (seed !== undefined) body.seed = seed;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    let msg = `Image generation failed (HTTP ${res.status})`;
    try {
      const text = await res.text();
      const parsed = JSON.parse(text);
      const detail = parsed.errors?.[0]?.message || parsed.detail || parsed.message || text.slice(0, 300);
      if (detail) msg = `${detail} (HTTP ${res.status})`;
    } catch {}
    throw new Error(msg);
  }

  const json = await res.json();
  let b64 = json.result;
  if (!b64) throw new Error('No image data in response');

  if (typeof b64 === 'object') b64 = b64.url || b64.image || b64.data || JSON.stringify(b64);
  b64 = b64.replace(/^data:image\/\w+;base64,/, '').replace(/\s/g, '');

  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: 'image/png' });
}

export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function downloadBlob(blob, filename = 'nchat-generated.png') {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
