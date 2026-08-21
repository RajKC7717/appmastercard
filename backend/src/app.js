import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import apiRouter from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

// ── Security & Parsing ──────────────────────────────────────────────────────
app.use(helmet());
// `credentials: true` is required so browsers send/receive the auth cookie.
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Routes ───────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api', apiRouter);

// ── Error Handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
