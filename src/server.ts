import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { toNodeHandler } from 'better-auth/node';
import { connectDB } from './config/db.js';
import { auth } from './config/auth.js';
import eventRoutes from './routes/event.routes.js';
import joinRoutes from './routes/join.routes.js';
import userRoutes from './routes/user.routes.js';
import { notFoundHandler, globalErrorHandler } from './middlewares/error.middleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
app.set('trust proxy', true);
// Global Middlewares
// 1. URL Sanitizer: automatically cleans accidental double slashes (//api -> /api)
app.use((req, res, next) => {
  if (req.url.startsWith('//')) {
    req.url = req.url.replace(/^\/+/, '/');
  }
  next();
});
// 2. Dynamic CORS: Automatically allows ANY Vercel frontend or localhost
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-side)
      if (!origin) return callback(null, true);
      
      // Allow any .vercel.app domain (including preview URLs) or localhost
      if (
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost') ||
        origin === CLIENT_ORIGIN
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  })
);
// Root Route (So visiting https://your-server.vercel.app/ doesn't say "Page Doesn't Exist")
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: '🚀 HopeHarbor Express Server is live and running on Vercel!',
    timestamp: new Date().toISOString(),
  });
});

// Health Check Route
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'HopeHarbor API',
  });
});

// Initialize Better Auth and Mount Routes
try {
  app.all(/^\/api\/auth(\/.*)?$/, toNodeHandler(auth));
} catch (e) {
  console.warn('Auth initialization deferred');
}

// Application Routes
app.use('/api/events', joinRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);

// 404 & Error Handlers
app.use(notFoundHandler);
app.use(globalErrorHandler as any);

// Only call app.listen in local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 HopeHarbor Server running locally on port ${PORT}`);
  });
}

export default app;