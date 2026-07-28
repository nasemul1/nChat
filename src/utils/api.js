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

async function extractError(res) {
  const status = res.status;
  let body;
  try { body = await res.text(); } catch { body = ""; }

  let providerMsg = "";
  if (body) {
    try {
      const parsed = JSON.parse(body);
      providerMsg =
        parsed.error?.message ||
        parsed.error?.detail ||
        parsed.message ||
        parsed.detail ||
        "";
    } catch {
      providerMsg = body.slice(0, 300);
    }
  }

  if (providerMsg) return `${providerMsg} (HTTP ${status})`;
  return `HTTP ${status}`;
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

  url = rewriteUrl(url, provider, apiKey);

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

  if (!res.ok) {
    throw new Error(await extractError(res));
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
            const msg =
              parsed.error.message ||
              parsed.error.detail ||
              `Provider error ${parsed.error.code || "unknown"}`;
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
