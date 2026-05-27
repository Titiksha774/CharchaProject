import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from './lib/prisma.js';
import authRoutes from './routes/auth.js';
import postsRoutes from './routes/posts.js';
import usersRoutes from './routes/users.js';
import friendsRoutes from './routes/friends.js';
import messagesRoutes from './routes/messages.js';
import uploadsRoutes from './routes/uploads.js';
import {
  allowedOrigins,
  assertProductionSecrets,
  rateLimit,
  securityHeaders,
} from './middleware/security.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

assertProductionSecrets();

app.disable('x-powered-by');
app.use(securityHeaders);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins().includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '35mb' }));
app.use('/api', rateLimit({ windowMs: 60_000, max: 180 }));
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads'), {
  immutable: true,
  maxAge: '30d',
  setHeaders(res) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
  },
}));

// Check if database is connected (no auth required)
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, database: 'connected' });
  } catch (err) {
    console.error('Database health check failed:', err);
    res.status(503).json({ ok: false, database: 'disconnected', error: err.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/uploads', uploadsRoutes);

// Serve static frontend in production (SPA fallback; API routes already mounted above)
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  const message = status >= 500 && process.env.NODE_ENV === 'production'
    ? 'Server error'
    : err.message || 'Server error';
  res.status(status).json({ error: message });
});

app.listen(PORT, () => {
  console.log(`Charcha server running on port ${PORT}`);
});
