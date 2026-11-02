import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { toNodeHandler } from 'better-auth/node';
import { connectDB } from './config/db.js';
import { initAuth } from './config/auth.js';
import eventRoutes from './routes/event.routes.js';
import joinRoutes from './routes/join.routes.js';
import userRoutes from './routes/user.routes.js';
import { notFoundHandler, globalErrorHandler } from './middlewares/error.middleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';

// Global Middlewares
app.use(
  cors({
    origin: [CLIENT_ORIGIN, 'http://localhost:3000'],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'HopeHarbor API',
  });
});

async function startServer() {
  try {
    // 1. Connect MongoDB
    await connectDB();

    // 2. Initialize Better Auth
    const authInstance = initAuth();

    // 3. Mount Better Auth Endpoint
    app.all(/^\/api\/auth(\/.*)?$/, toNodeHandler(authInstance));

    // 4. Mount Application Routes
    app.use('/api/events', joinRoutes);
    app.use('/api/events', eventRoutes);
    app.use('/api/users', userRoutes);

    // 5. 404 & Global Error Middlewares
    app.use(notFoundHandler);
    app.use(globalErrorHandler as any);

    // 6. Start Listening
    app.listen(PORT, () => {
      console.log(`🚀 HopeHarbor Server running on port ${PORT}`);
      console.log(`🌐 Accepting requests from: ${CLIENT_ORIGIN}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;