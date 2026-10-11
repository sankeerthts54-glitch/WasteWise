import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { logger } from './lib/logger';
import { errorHandler } from './middleware/errorHandler';
import healthRouter from './routes/health';
import domainsRouter from './routes/domains';
import profileRouter from './routes/profile';
import advisoriesRouter from './routes/advisories';

export function createApp() {
  const app = express();

  // 1. Security headers
  app.use(helmet());

  // 2. CORS (allow-list from env)
  const allowedOrigins = env.CLIENT_ORIGIN.split(',').map((o) => o.trim());
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) {
          cb(null, true);
        } else {
          cb(new Error(`CORS: origin ${origin} not allowed`));
        }
      },
      credentials: true,
    })
  );

  // 3. Request logging
  app.use(pinoHttp({ logger }));

  // 4. JSON body parser (100kb limit)
  app.use(express.json({ limit: '100kb' }));

  // 5. Global rate limiter
  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests.' } },
    })
  );

  // Routes
  app.use('/api/health', healthRouter);
  app.use('/api/domains', domainsRouter);
  app.use('/api/me', profileRouter);
  app.use('/api/auth/me', profileRouter);
  app.use('/api/advisories', advisoriesRouter);

  // 404
  app.use((_req, res) => {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found.' } });
  });

  // Central error handler (must be last)
  app.use(errorHandler);

  return app;
}
