// src/server/routes/walkRoutes.ts
import express from 'express';

const router = express.Router();

// Placeholder route
router.get('/', (req, res) => {
  res.json({ message: 'Walk routes working' });
});

export default router;