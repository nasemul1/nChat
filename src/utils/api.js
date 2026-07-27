import { PROVIDERS } from "./providers";

function isVercel() {
  return typeof window !== "undefined" && window.location.hostname !== "localhost";
}

const PROVIDER_PREFIX = {
  ollama_cloud: "ollama",
  cloudflare_ai: "cf",
  openai_compat: "openai_compat",
  airforce: "airforce",
  groq: "groq",
  mistral: "mistral",
};

function rewriteUrl(url, provider) {
  if (!isVercel() || !url.startsWith("/api/")) return url;
  const prefix = PROVIDER_PREFIX[provider] || provider;
  const path = url.replace(`/api/${prefix}/`, "");
  return `/api/proxy?provider=${prefix}&path=${encodeURIComponent(path)}`;
}

function toOpenAIContent(content, files) {
  if (!files || files.length === 0) return content;
  const parts = [{ type: "text", text: content }];
  for (const f of files) {
    if (f.type.startsWith("image/")) {
      parts.push({ type: "image_url", image_url: { url: f.dataUrl } });
    } else {
      parts.push({ type: "text", text: `[File: ${f.name}]\n${f.dataUrl}` });
    }
  }
  return parts;
}

export async function sendMessage({
  provider,
  model,
  apiKey,
  accountId,
  messages,
  endpoint,
  signal,
}) {
  const config = PROVIDERS[provider];
  if (!config) throw new Error(`Unknown provider: ${provider}`);
  return sendOpenAICompatible({
    provider,
    model,
    apiKey,
    accountId,
    messages,
    endpoint,
    signal,
  });
}

async function withRetry(fn, signal) {
  let res = await fn();
  if (res.status === 429 || res.status === 502 || res.status === 503 || res.status === 504) {
    const waitMs = res.status === 429
      ? parseInt(res.headers.get("retry-after") || "5", 10) * 1000
      : 3000;
    await new Promise((r) => setTimeout(r, waitMs));
    res = await fn();
  }
  return res;
}

async function sendOpenAICompatible({
  provider,
  model,
  apiKey,
  accountId,
  messages,
  endpoint,
  signal,
}) {
  const config = PROVIDERS[provider];
  let url = endpoint || config.defaultEndpoint;

  if (provider === "cloudflare_ai" && !endpoint) {
    if (accountId) {
      url = `/api/cf/client/v4/accounts/${accountId}/ai/v1/chat/completions`;
    } else {
      throw new Error(
        "Cloudflare Account ID is required. Set it in Settings.",
      );
    }
  }

  if (!url)
    throw new Error(
      "No endpoint configured. Set a custom endpoint in Settings.",
    );

  url = rewriteUrl(url, provider);

  const formatted = messages.map(({ role, content, files }) => ({
    role,
    content: toOpenAIContent(content, files),
  }));

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  const body = JSON.stringify({ model, messages: formatted, stream: true });

  const res = await withRetry(
    () => fetch(url, { method: "POST", headers, body, signal }),
    signal,
  );

  if (res.status === 429) {
    const wait = res.headers.get("retry-after") || "a few";
    throw new Error(`Rate limit exceeded. Please wait ${wait}s and try again.`);
  }

  if (res.status === 502 || res.status === 503 || res.status === 504) {
    throw new Error(`Model temporarily unavailable (${res.status}). Try again in a few seconds or switch to a different model.`);
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    let errMsg = `API error ${res.status}`;
    try {
      const err = JSON.parse(errText);
      const providerMsg = err.error?.message || err.detail || errMsg;
      errMsg = providerMsg;
      if (providerMsg.includes('image') || providerMsg.includes('vision') || providerMsg.includes('modality')) {
        errMsg = `This model doesn't support image input: ${providerMsg}`;
      } else if (providerMsg.includes('rate limit') || providerMsg.includes('quota')) {
        errMsg = `Rate limit exceeded. Wait a moment and try again.`;
      } else if (providerMsg.includes('invalid') && providerMsg.includes('model')) {
        errMsg = `Invalid or unavailable model: ${providerMsg}`;
      } else if (providerMsg.includes('auth') || providerMsg.includes('unauthorized')) {
        errMsg = `Authentication failed. Check your API key.`;
      }
    } catch {
      if (errText) errMsg += `: ${errText}`;
    }
    throw new Error(errMsg);
  }

  return handleStream(res);
}

function handleStream(res) {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  const transform = new TransformStream({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") continue;
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            let msg =
              parsed.error.message ||
              parsed.error.detail ||
              `Provider error ${parsed.error.code || "unknown"}`;
            if (msg.includes('image') || msg.includes('vision') || msg.includes('modality')) {
              msg = `This model doesn't support image input: ${msg}`;
            } else if (msg.includes('rate limit') || msg.includes('quota')) {
              msg = `Rate limit exceeded: ${msg}`;
            } else if (msg.includes('invalid') && msg.includes('model')) {
              msg = `Invalid or unavailable model: ${msg}`;
            } else if (msg.includes('auth') || msg.includes('unauthorized')) {
              msg = `Authentication failed. Check your API key: ${msg}`;
            }
            controller.error(new Error(msg));
            return;
          }
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            controller.enqueue(encoder.encode(delta));
          }
        } catch (e) {
          if (e.message && !e.message.includes("JSON")) {
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
  if (!stream) throw new Error("No stream provided");

  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      result += decoder.decode(value, { stream: true });
    }
  } catch (e) {
    if (result) return result;
    throw new Error(e.message || "Stream read failed");
  } finally {
    reader.releaseLock();
  }

  return result;
}
