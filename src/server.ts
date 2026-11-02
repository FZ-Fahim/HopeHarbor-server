import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

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

// Health Check Route
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'HopeHarbor API',
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`HopeHarbor Server running on port ${PORT}`);
  console.log(`Accepting requests from: ${CLIENT_ORIGIN}`);
});

export default app;