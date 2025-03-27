import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import userRoutes from './routes/userRoutes';
import walkRoutes from './routes/walkRoutes';

// Initialize Express app
const app = express();

// Initialize Prisma client
let prisma: PrismaClient;

// Type declaration for global variable to avoid TypeScript errors
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Production environment (Vercel serverless)
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });
} else {
  // For development, avoid creating a new connection for every file change
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
  }
  prisma = global.prisma;
}

// Export the prisma client for use in other files
export { prisma };

// Middleware
app.use(cors()); // Allows cross-origin requests
app.use(express.json()); // Parses incoming JSON requests

// Root route
app.get('/', (req, res) => {
  res.send('WalkMate API Server is running! Try accessing /api/health');
});

// Routes - Note the routes should be without the /api prefix since vercel.json adds it
app.use('/users', userRoutes);
app.use('/walks', walkRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Simple database connection check
    await prisma.$queryRaw`SELECT 1 as health_check`;
    res.json({ 
      status: 'ok', 
      message: 'Server is running and connected to database' 
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Server is running but database connection failed' 
    });
  }
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Something went wrong on the server'
  });
  next(err);
});

// Important: For serverless deployment, we don't call app.listen()
// Instead, we export the Express app directly
export default app;
