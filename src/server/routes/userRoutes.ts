// src/server/routes/userRoutes.ts
import express from 'express';

const router = express.Router();

// Placeholder route
router.get('/', (req, res) => {
  res.json({ message: 'User routes working' });
});

export default router;