import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { toNodeHandler } from 'better-auth/node';
import { connectDB } from './config/db.js';
import { initAuth } from './config/auth.js';

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

// Standard Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'HopeHarbor API',
  });
});

async function startServer() {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Initialize Better Auth
    const authInstance = initAuth();

    // 3. Mount Better Auth with Express 5 compatible Regex
    app.all(/^\/api\/auth(\/.*)?$/, toNodeHandler(authInstance));

    // 4. Verification Check Route
    app.get('/api/auth-check', (req: Request, res: Response) => {
      res.status(200).json({
        success: true,
        message: 'Better Auth is initialized and mounted successfully',
        googleAuthEnabled: Boolean(
          process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
        ),
      });
    });

    // 5. Start Listening
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