import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/index.js';
import { pool } from './config/db.js';
import { HttpError, errorHandler, notFound } from './utils/errors.js';
import { stripeWebhook } from './controllers/subscription.controller.js';
import routes from './routes/index.js';

const app = express();
app.set('trust proxy', 1); 
app.use(helmet());
app.use(cors({
  origin(origin, cb) {
    if (!origin || config.clientUrls.includes(origin)) return cb(null, true);
    cb(new HttpError(403, 'Origin not allowed.'));
  },
}));

app.post('/webhooks/stripe', ...stripeWebhook);

app.use(express.json({ limit: '3mb' }));

app.get('/health', async (req, res) => {
  try { await pool.query('select 1'); res.json({ ok: true }); } catch { res.status(503).json({ ok: false }); }
});

app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

export default app;
