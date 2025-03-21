// src/server/routes/userRoutes.ts
import express from 'express';
import userController from '../controllers/userController';
import walkController from '../controllers/walkController';
import { validateRequest } from '../middleware/validation';

const router = express.Router();

// Get all users
router.get('/', userController.getAllUsers);

// Get user by ID
router.get('/:id', userController.getUserById);

// Create a new user
router.post('/', 
  validateRequest({
    name: { required: true, type: 'string' },
    goalType: { type: 'string' },
    goalValue: { type: 'number', min: 1 }
  }),
  userController.createUser
);

// Update a user
router.put('/:id', 
  validateRequest({
    name: { type: 'string' },
    goalType: { type: 'string' },
    goalValue: { type: 'number', min: 1 }
  }),
  userController.updateUser
);

// Get user streak
router.get('/:id/streak', userController.getUserStreak);

// Get user weekly report
router.get('/:id/weekly-report', userController.getWeeklyReport);

// Get all walks for a user - adding this route to match frontend expectations
router.get('/:userId/walks', walkController.getUserWalks);

export default router;