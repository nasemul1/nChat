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

  const { provider, path } = req.query;
  const target = PROVIDER_MAP[provider];

  if (!target) {
    return res.status(404).json({ error: 'Unknown provider' });
  }

  const pathStr = Array.isArray(path) ? path.join('/') : path;
  const url = `${target}/${pathStr}`;

  const headers = {};
  for (const key of ['authorization', 'content-type']) {
    if (req.headers[key]) headers[key] = req.headers[key];
  }

  try {
    const init = {
      method: req.method,
      headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const rawBody = Buffer.concat(chunks).toString();
      init.body = rawBody;
    }

    const upstream = await fetch(url, init);

    res.setHeader('Access-Control-Allow-Origin', '*');

    const contentType = upstream.headers.get('content-type') || '';

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
      const body = await upstream.text();
      if (contentType) res.setHeader('Content-Type', contentType);
      res.status(upstream.status).send(body);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
