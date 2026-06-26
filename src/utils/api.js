import { PROVIDERS } from './providers';

function toOpenAIContent(content, files) {
  if (!files || files.length === 0) return content;
  const parts = [{ type: 'text', text: content }];
  for (const f of files) {
    if (f.type.startsWith('image/')) {
      parts.push({ type: 'image_url', image_url: { url: f.dataUrl } });
    } else {
      parts.push({ type: 'text', text: `[File: ${f.name}]\n${f.dataUrl}` });
    }
  }
  return parts;
}

export async function sendMessage({ provider, model, apiKey, messages, endpoint, signal }) {
  const config = PROVIDERS[provider];
  if (!config) throw new Error(`Unknown provider: ${provider}`);
  return sendOpenAICompatible({ provider, model, apiKey, messages, endpoint, signal });
}

async function sendOpenAICompatible({ provider, model, apiKey, messages, endpoint, signal }) {
  const config = PROVIDERS[provider];
  const url = endpoint || config.defaultEndpoint;

  if (!url) throw new Error('No endpoint configured. Set a custom endpoint in Settings.');

  const formatted = messages.map(({ role, content, files }) => ({
    role,
    content: toOpenAIContent(content, files),
  }));

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      ...(provider === 'openrouter' ? { 'HTTP-Referer': window.location.origin } : {}),
    },
    body: JSON.stringify({ model, messages: formatted, stream: true }),
    signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error ${res.status}`);
  }

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';

  const transform = new TransformStream({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            const msg = parsed.error.message || parsed.error.detail || `Provider error ${parsed.error.code || 'unknown'}`;
            controller.error(new Error(msg));
            return;
          }
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            controller.enqueue(encoder.encode(delta));
          }
        } catch (e) {
          if (e.message && !e.message.includes('JSON')) {
            controller.error(e);
            return;
          }
        }
      }
    },
  });

  return res.body.pipeThrough(transform);
}

export async function streamToString(stream) {
  if (!stream) throw new Error('No stream provided');

  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      result += decoder.decode(value, { stream: true });
    }
  } catch (e) {
    if (result) return result;
    throw new Error(e.message || 'Stream read failed');
  } finally {
    reader.releaseLock();
  }

  return result;
}
