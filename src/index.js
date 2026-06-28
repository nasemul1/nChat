export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    if (url.pathname.startsWith('/api/cf/')) {
      const subPath = url.pathname.replace('/api/cf', '');
      const targetUrl = `https://api.cloudflare.com${subPath}${url.search}`;

      const init = {
        method: request.method,
        headers: {},
      };
      const auth = request.headers.get('Authorization');
      if (auth) init.headers['Authorization'] = auth;
      const ct = request.headers.get('Content-Type');
      if (ct) init.headers['Content-Type'] = ct;
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        init.body = await request.text();
      }

      const res = await fetch(targetUrl, init);
      const resHeaders = new Headers(res.headers);
      for (const [k, v] of Object.entries(cors)) resHeaders.set(k, v);
      return new Response(res.body, { status: res.status, headers: resHeaders });
    }

    if (url.pathname.startsWith('/api/ollama/')) {
      const targetPath = url.pathname.replace('/api/ollama/', '/');
      const targetUrl = `https://ollama.com${targetPath}${url.search}`;

      const init = { method: request.method, headers: {} };
      const auth = request.headers.get('Authorization');
      if (auth) init.headers['Authorization'] = auth;
      const ct = request.headers.get('Content-Type');
      if (ct) init.headers['Content-Type'] = ct;
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        init.body = await request.text();
      }

      const res = await fetch(targetUrl, init);
      const resHeaders = new Headers(res.headers);
      for (const [k, v] of Object.entries(cors)) resHeaders.set(k, v);
      return new Response(res.body, { status: res.status, headers: resHeaders });
    }

    const providerProxies = [
      { prefix: '/api/openrouter/', target: 'https://openrouter.ai' },
      { prefix: '/api/groq/',       target: 'https://api.groq.com' },
      { prefix: '/api/mistral/',    target: 'https://api.mistral.ai' },
    ];
    for (const { prefix, target } of providerProxies) {
      if (url.pathname.startsWith(prefix)) {
        const subPath = url.pathname.replace(prefix, '/');
        const targetUrl = `${target}${subPath}${url.search}`;

        const init = { method: request.method, headers: {} };
        const auth = request.headers.get('Authorization');
        if (auth) init.headers['Authorization'] = auth;
        const ct = request.headers.get('Content-Type');
        if (ct) init.headers['Content-Type'] = ct;
        if (request.method !== 'GET' && request.method !== 'HEAD') {
          init.body = await request.text();
        }

        const res = await fetch(targetUrl, init);
        const resHeaders = new Headers(res.headers);
        for (const [k, v] of Object.entries(cors)) resHeaders.set(k, v);
        return new Response(res.body, { status: res.status, headers: resHeaders });
      }
    }

    if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not found', { status: 404 });
  },
};
