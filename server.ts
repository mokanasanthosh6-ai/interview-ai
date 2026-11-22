import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  handleEvaluateRequest,
  handleQuestionsRequest,
  handleReportRequest,
} from './server/interviewHandlers.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isDevelopment = process.env.NODE_ENV === 'development';

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/interview/questions', async (req, res) => {
    const result = await handleQuestionsRequest((req.body ?? {}) as Record<string, unknown>);
    res.status(result.status).json(result.payload);
  });

  app.post('/api/interview/evaluate', async (req, res) => {
    const result = await handleEvaluateRequest((req.body ?? {}) as Record<string, unknown>);
    res.status(result.status).json(result.payload);
  });

  app.post('/api/interview/report', async (req, res) => {
    const result = await handleReportRequest((req.body ?? {}) as Record<string, unknown>);
    res.status(result.status).json(result.payload);
  });

  if (isDevelopment) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('/{*splat}', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`InterviewMate AI server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
