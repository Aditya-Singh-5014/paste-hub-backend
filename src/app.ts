import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import { createPasteSchema } from './validators/pasteValidators';
import { createPaste, fetchPaste } from './services/pasteService';
import { getNowMs } from './utils/now';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { ApiError } from './utils/errors';
import { getDb } from './db';

dotenv.config();

const app = express();

const webOrigin = process.env.WEB_ORIGIN;
const corsOrigin = webOrigin
  ? webOrigin.split(',').map((origin) => origin.trim()).filter(Boolean)
  : true;

// CORS configuration - must come before other middleware
app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(express.json());

app.get('/api/healthz', async (_req, res) => {
  try {
    const db = await getDb();
    await db.admin().ping();
    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false });
  }
});

app.post('/api/pastes', async (req, res, next) => {
  try {
    const parsed = createPasteSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, 'Invalid input', parsed.error.flatten());
    }

    const { content, ttl_seconds, max_views, language } = parsed.data;
    const result = await createPaste({
      content,
      ttlSeconds: ttl_seconds,
      maxViews: max_views,
      language
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

app.get('/api/pastes/:id', async (req, res, next) => {
  try {
    const nowMs = getNowMs(req);
    const result = await fetchPaste({ id: req.params.id, nowMs });

    if (!result) {
      throw new ApiError(404, 'Not found');
    }

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

app.use(notFound);
app.use(errorHandler);

export default app;
