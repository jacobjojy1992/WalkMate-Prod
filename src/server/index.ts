// src/server/index.ts
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import userRoutes from './routes/userRoutes';
import walkRoutes from './routes/walkRoutes';

// Initialize Express app
const app = express();
const port = process.env.PORT || 3001;

// Initialize Prisma client
export const prisma = new PrismaClient();

// Middleware
app.use(cors()); // Allows cross-origin requests (from frontend to backend)
app.use(express.json()); // Parses incoming JSON requests

// Routes
app.use('/api/users', userRoutes);
app.use('/api/walks', walkRoutes);

// Health check endpoint - useful for verifying the server is running
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware - catches any errors thrown in route handlers
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Something went wrong on the server'
  });
  next(err);
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

// Export for testing
export default app;