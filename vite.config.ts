import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { pathToFileURL } from 'url';
import {defineConfig} from 'vite';
import dotenv from 'dotenv';

dotenv.config();

function vercelApiDevPlugin() {
  const handleApi = async (req: any, res: any, next: any) => {
    if (!req.url?.startsWith('/api/')) {
      return next();
    }

    try {
      const url = new URL(req.url, 'http://localhost');
      const pathname = url.pathname.replace(/^\/api\//, '').replace(/\/$/, '');
      const endpoint = pathname.split('/')[0];

      let handlerModule: any;
      try {
        const filePath = path.resolve(process.cwd(), 'api', `${endpoint}.js`);
        const fileUrl = pathToFileURL(filePath).href + `?t=${Date.now()}`;
        handlerModule = await import(fileUrl);
      } catch (err) {
        console.error('Failed to import API handler:', err);
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: `API route /api/${endpoint} not found` }));
        return;
      }

      const handler = handlerModule.default || handlerModule;
      if (typeof handler !== 'function') {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: `Handler for /api/${endpoint} is not a function` }));
        return;
      }

      req.query = Object.fromEntries(url.searchParams.entries());
      res.status = function (statusCode: number) {
        this.statusCode = statusCode;
        return this;
      };
      res.json = function (body: any) {
        this.setHeader('Content-Type', 'application/json');
        this.end(JSON.stringify(body));
        return this;
      };

      await handler(req, res);
    } catch (apiErr: any) {
      console.error('API execution error:', apiErr);
      if (!res.writableEnded) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Internal Server Error', message: apiErr.message }));
      }
    }
  };

  return {
    name: 'vercel-api-dev-plugin',
    configureServer(server: any) {
      server.middlewares.use(handleApi);
    },
    configurePreviewServer(server: any) {
      server.middlewares.use(handleApi);
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), vercelApiDevPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
