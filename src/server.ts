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
app.use(
  cors({
    origin: [
      CLIENT_ORIGIN,
      'http://localhost:3000',
      /\.vercel\.app$/, // Allows any preview/production Vercel frontend
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure DB is connected before processing requests on Vercel
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection error in request:', error);
    res.status(500).json({ success: false, message: 'Database connection failed' });
  }
});

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