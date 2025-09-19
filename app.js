import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import rateLimit from 'express-rate-limit';

// --- optional helmet ---
let helmet;
try {
  const mod = await import('helmet');  // type:module なのでOK
  helmet = mod.default || mod;
} catch (e) {
  console.warn('helmet not available; starting without it');
}
// --- end optional helmet ---

// Import routes
import homeRoutes from './routes/home.js';
import registerRoutes from './routes/register.js';
import applyRoutes from './routes/apply.js';
import applyStallRoutes from './routes/apply-stall.js';
import applyPerformerRoutes from './routes/apply-performer.js';
import statusRoutes from './routes/status.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Trust proxy設定（Render環境用）
app.set('trust proxy', 1);

// Security middleware
if (helmet) {
  app.use(helmet({
    contentSecurityPolicy: false // CSPを無効化（フォーム動作のため）
  }));
} else {
  // 簡易的なセキュリティヘッダを付与（暫定）
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Frame-Options', 'DENY');
    next();
  });
}

// Rate limiting (研修期間中は大幅緩和)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 500, // 研修中は500回まで大幅緩和
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true // Render環境用の設定
});
app.use(limiter);

// Form submission rate limiting (研修期間中は緩和)
const formLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5分
  max: process.env.NODE_ENV === 'production' ? 20 : 100, // 研修中は20回まで
  message: 'Too many form submissions, please try again later.',
  trustProxy: true // Render環境用の設定
});

// Make prisma available in req
app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // HTTPS必須（本番環境）
    httpOnly: true, // XSS対策
    maxAge: 24 * 60 * 60 * 1000 // 24時間
  }
}));

// Routes
app.use('/', homeRoutes);
app.use('/register', formLimiter, registerRoutes); // フォーム送信制限
app.use('/apply', formLimiter, applyRoutes); // フォーム送信制限
app.use('/apply/stall', formLimiter, applyStallRoutes); // フォーム送信制限
app.use('/apply/performer', formLimiter, applyPerformerRoutes); // フォーム送信制限
app.use('/status', statusRoutes);
app.use('/admin', adminRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    title: 'エラー',
    message: 'サーバーエラーが発生しました',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 handling
app.use((req, res) => {
  res.status(404).render('404', { title: 'ページが見つかりません' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit();
});

app.listen(PORT, () => {
  console.log(`サーバーがポート${PORT}で起動しました`);
  console.log(`http://localhost:${PORT}`);
});

export default app;