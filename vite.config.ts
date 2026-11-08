import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import workerHandler from './worker/index';
import { createLocalD1Database } from './worker/local-d1';

const localDb = createLocalD1Database();

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    {
      name: 'cloudflare-worker-dev-server',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url && req.url.startsWith('/api/')) {
            const fullUrl = `http://${req.headers.host || 'localhost:3000'}${req.url}`;
            let body = '';
            req.on('data', chunk => {
              body += chunk;
            });
            req.on('end', async () => {
              try {
                const request = new Request(fullUrl, {
                  method: req.method,
                  headers: req.headers as any,
                  body: ['POST', 'PUT', 'PATCH'].includes(req.method || '') ? body : undefined
                });
                const response = await workerHandler.fetch(request, { DB: localDb });
                res.statusCode = response.status;
                response.headers.forEach((value, key) => {
                  res.setHeader(key, value);
                });
                const text = await response.text();
                res.end(text);
              } catch (err: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err.message }));
              }
            });
            return;
          }
          next();
        });
      }
    }
  ],
  server: {
    port: 3000,
    host: '0.0.0.0'
  }
});
