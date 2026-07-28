import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { cloudflare } from "@cloudflare/vite-plugin";

const PROVIDER_MAP = {
  ollama: 'https://ollama.com',
  cf: 'https://api.cloudflare.com',
  groq: 'https://api.groq.com',
  mistral: 'https://api.mistral.ai',
  airforce: 'https://api.airforce',
};

function apiProxyPlugin() {
  return {
    name: 'api-proxy',
    configureServer(server) {
      server.middlewares.use('/api/proxy', async (req, res) => {
        const url = new URL(req.url, 'http://localhost');
        const provider = url.searchParams.get('provider');
        const path = decodeURIComponent(url.searchParams.get('path') || '');
        const key = url.searchParams.get('key') || '';
        const target = PROVIDER_MAP[provider];

        if (!target) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: `Unknown provider: ${provider}` }));
          return;
        }

        const upstreamUrl = `${target}/${path}`;
        console.log(`[proxy] ${req.method} ${upstreamUrl}`);
        console.log(`[proxy] key present: ${!!key}, key length: ${key.length}`);

        const headers = {};
        if (key) {
          headers['Authorization'] = `Bearer ${key}`;
        }

        try {
          let body = null;
          if (req.method !== 'GET' && req.method !== 'HEAD') {
            const chunks = [];
            for await (const chunk of req) chunks.push(chunk);
            body = Buffer.concat(chunks);
            headers['Content-Type'] = 'application/json';
          }

          const upstream = await fetch(upstreamUrl, {
            method: req.method,
            headers,
            body,
          });

          console.log(`[proxy] upstream status: ${upstream.status}`);
          const respText = await upstream.clone().text();
          console.log(`[proxy] upstream response: ${respText.slice(0, 300)}`);

          const contentType = upstream.headers.get('content-type') || '';

          if (contentType.includes('text/event-stream')) {
            res.writeHead(200, {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
            });
            const reader = upstream.body.getReader();
            const decoder = new TextDecoder();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              res.write(decoder.decode(value, { stream: true }));
            }
            res.end();
          } else {
            const text = await upstream.text();
            res.writeHead(upstream.status, {
              'Content-Type': contentType || 'application/json',
            });
            res.end(text);
          }
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), cloudflare(), apiProxyPlugin()],
})
