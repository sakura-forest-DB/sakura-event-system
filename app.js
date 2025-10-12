// app.js  (ESM / Node 20 / Express 4)
// Safe ASCII-only comments. No multi-line strings broken.

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Optional deps (helmet / rate-limit) are loaded dynamically
let helmet = null;
let rateLimit = null;
try {
  const mod = await import('helmet');
  helmet = mod.default || mod;
} catch (_) {
  console.warn('helmet not available; starting without it');
}
try {
  const mod = await import('express-rate-limit');
  rateLimit = mod.default || mod;
} catch (_) {
  console.warn('express-rate-limit not available; continuing without rate limiting');
}

// Env
const PORT = process.env.PORT || 10000;
const ADMIN_ENABLED = String(process.env.ADMIN_UI_ENABLED || '').toLowerCase() === 'true';
const ADMIN_USER = process.env.ADMIN_USER || '';
const ADMIN_PASS = process.env.ADMIN_PASS || '';

// ESM dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Express
const app = express();

// Views
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1h' }));

// Security headers
if (helmet) {
  app.use(
    helmet({
      // Disable CSP to avoid blocking inline/bootstrap during forms
      contentSecurityPolicy: false,
    })
  );
} else {
  // Minimal safety headers if helmet is missing
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Frame-Options', 'DENY');
    next();
  });
}

// Rate limiting (relaxed)
if (rateLimit) {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500,                  // relaxed for current phase
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    trustProxy: true,
  });
  app.use(limiter);
}

// Prisma attach for legacy routes that use req.prisma
import prisma from './lib/prisma.js';
app.use((req, _res, next) => {
  req.prisma = prisma;
  next();
});

// Admin gate: protect /admin and allow toggle by ADMIN_UI_ENABLED
app.use('/admin', (req, res, next) => {
  if (!ADMIN_ENABLED) return res.status(404).send('Not Found');

  const auth = req.headers.authorization || '';
  const token = auth.split(' ')[1] || '';
  const [u, p] = Buffer.from(token || '', 'base64').toString().split(':');

  if (u === ADMIN_USER && p === ADMIN_PASS && ADMIN_USER && ADMIN_PASS) {
    return next();
  }
  res.set('WWW-Authenticate', 'Basic realm="admin"');
  return res.status(401).send('Unauthorized');
});

// Routes
import homeRoutes from './routes/home.js';
import registerRoutes from './routes/register.js';
import adminRoutes from './routes/admin.js';
import applyBaseRoutes from './routes/apply.js';           // /apply (slug-less = 404)
import applyStallRoutes from './routes/apply-stall.js';    // /apply/:slug/stall
import applyPerformerRoutes from './routes/apply-performer.js'; // /apply/:slug/performer

app.use('/', homeRoutes);
app.use('/register', registerRoutes);
app.use('/admin', adminRoutes);
app.use('/apply', applyBaseRoutes);          // ← ランディングを返す apply.js
app.use('/apply', applyStallRoutes);         // /apply/:slug/stall
app.use('/apply', applyPerformerRoutes);     // /apply/:slug/performer

// Health check (Render)
app.get('/healthz', (_req, res) => res.status(200).send('ok'));

// 404
app.use((req, res) => {
  res.status(404).render('404', { title: 'ページが見つかりません' });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error('[server] error:', err);
  res.status(500).render('error', {
    title: 'エラー',
    message: 'サーバー側でエラーが発生しました。',
    error: { status: 500 },
  });
});

// Start
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
