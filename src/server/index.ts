// src/server/index.ts
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

// Initialize Express app
const app = express();
const port = process.env.PORT || 3001;

// Initialize Prisma client
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Basic test route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// We'll add more routes in Phase 3

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Export for testing
export { app, prisma };