const PROVIDER_MAP = {
  ollama: 'https://ollama.com',
  cf: 'https://api.cloudflare.com',
  groq: 'https://api.groq.com',
  mistral: 'https://api.mistral.ai',
  airforce: 'https://api.airforce',
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    return res.status(200).end();
  }

  const urlObj = new URL(req.url, 'http://localhost');
  const provider = urlObj.searchParams.get('provider');
  const path = decodeURIComponent(urlObj.searchParams.get('path') || '');
  const queryKey = urlObj.searchParams.get('key') || '';
  const target = PROVIDER_MAP[provider];

  if (!target) {
    return res.status(404).json({ error: `Unknown provider: ${provider}` });
  }

  const upstreamUrl = `${target}/${path}`;

  const auth = queryKey
    ? `Bearer ${queryKey}`
    : (req.headers['authorization'] || '');

  const headers = { 'Authorization': auth };

  try {
    const init = { method: req.method, headers };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const originalContentType = req.headers['content-type'] || 'application/json';
      init.headers['Content-Type'] = originalContentType;
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      init.body = Buffer.concat(chunks);
    }

    const upstream = await fetch(upstreamUrl, init);
    const contentType = upstream.headers.get('content-type') || '';

    res.setHeader('Access-Control-Allow-Origin', '*');

    if (contentType.includes('text/event-stream')) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      const reader = upstream.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(decoder.decode(value, { stream: true }));
      }
      res.end();
    } else {
      const buf = Buffer.from(await upstream.arrayBuffer());
      const headers = {
        'Access-Control-Allow-Origin': '*',
      };
      if (contentType) headers['Content-Type'] = contentType;
      const len = upstream.headers.get('content-length');
      if (len) headers['Content-Length'] = len;
      const encoding = upstream.headers.get('content-encoding');
      if (encoding) headers['Content-Encoding'] = encoding;
      res.writeHead(upstream.status, headers);
      res.end(buf);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export const config = {
  api: { bodyParser: false },
};
