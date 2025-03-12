// src/server/routes/walkRoutes.ts
import express from 'express';
import walkController from '../controllers/walkController';
import { validateRequest } from '../middleware/validation';

const router = express.Router();

// Get all walks for a user
router.get('/user/:userId', walkController.getUserWalks);

// Get walks for a specific date
router.get('/user/:userId/date/:date', walkController.getWalksByDate);

// Create a new walk
router.post('/', 
  validateRequest({
    userId: { required: true, type: 'string' },
    steps: { required: true, type: 'number', min: 0 },
    distance: { required: true, type: 'number', min: 0 },
    duration: { required: true, type: 'number', min: 0 },
    date: { required: true, type: 'date' }
  }),
  walkController.createWalk
);

// Update a walk
router.put('/:id', 
  validateRequest({
    steps: { type: 'number', min: 0 },
    distance: { type: 'number', min: 0 },
    duration: { type: 'number', min: 0 },
    date: { type: 'date' }
  }),
  walkController.updateWalk
);

// Delete a walk
router.delete('/:id', walkController.deleteWalk);

// Get walk statistics
router.get('/user/:userId/stats', walkController.getWalkStats);

export default router;