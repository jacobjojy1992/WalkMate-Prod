// src/server/controllers/userController.ts
import { Request, Response } from 'express';
import dbService from '../services/dbService';
import { formatError } from '../utils/errorHandler';

/**
 * Controller for user-related operations
 */
const userController = {
  /**
   * Get all users
   */
  getAllUsers: async (req: Request, res: Response): Promise<void> => {
    try {
      const users = await dbService.withTransaction(async (prisma) => {
        return prisma.user.findMany();
      });
      
      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      const errorMessage = formatError(error);
      console.error('Error fetching users:', errorMessage);
      res.status(500).json({
        success: false,
        error: `Failed to fetch users: ${errorMessage}`
      });
    }
  },
  
  /**
   * Get user by ID
   */
  getUserById: async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await dbService.getUserById(req.params.id);
      
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }
      
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      const errorMessage = formatError(error);
      console.error('Error fetching user:', errorMessage);
      res.status(500).json({
        success: false,
        error: `Failed to fetch user: ${errorMessage}`
      });
    }
  },
  
  /**
   * Create a new user
   */
  createUser: async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, goalType, goalValue } = req.body;
      
      // Create user
      const user = await dbService.createUser({
        name,
        goalType,
        goalValue
      });
      
      res.status(201).json({
        success: true,
        data: user
      });
    } catch (error) {
      const errorMessage = formatError(error);
      console.error('Error creating user:', errorMessage);
      res.status(500).json({
        success: false,
        error: `Failed to create user: ${errorMessage}`
      });
    }
  },
  
  /**
   * Update a user
   */
  updateUser: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, goalType, goalValue } = req.body;
      
      // Check if user exists
      const existingUser = await dbService.getUserById(id);
      
      if (!existingUser) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }
      
      // Update user
      const updatedUser = await dbService.updateUser(id, {
        name,
        goalType,
        goalValue
      });
      
      res.json({
        success: true,
        data: updatedUser
      });
    } catch (error) {
      const errorMessage = formatError(error);
      console.error('Error updating user:', errorMessage);
      res.status(500).json({
        success: false,
        error: `Failed to update user: ${errorMessage}`
      });
    }
  },
  
  /**
   * Get a user's current streak
   */
  getUserStreak: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      // Check if user exists
      const user = await dbService.getUserById(id);
      
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }
      
      // Get user's streak
      const streak = await dbService.getUserStreak(id);
      
      res.json({
        success: true,
        data: { streak }
      });
    } catch (error) {
      const errorMessage = formatError(error);
      console.error('Error getting user streak:', errorMessage);
      res.status(500).json({
        success: false,
        error: `Failed to get user streak: ${errorMessage}`
      });
    }
  },
  
  /**
   * Get a user's weekly report
   */
  getWeeklyReport: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { date } = req.query;
      
      // Check if user exists
      const user = await dbService.getUserById(id);
      
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }
      
      // Parse date if provided
      let weekStartDate: Date | undefined;
      if (date && typeof date === 'string') {
        try {
          const parsedDate = new Date(date);
          if (!isNaN(parsedDate.getTime())) {
            weekStartDate = parsedDate;
          }
        } catch (error) {
          const errorMessage = formatError(error);
          console.error('Error parsing date:', errorMessage);
          res.status(400).json({
            success: false,
            error: `Invalid date format: ${errorMessage}`
          });
          return;
        }
      }
      
      // Get weekly report
      const report = await dbService.getUserWeeklyReport(id, weekStartDate);
      
      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      const errorMessage = formatError(error);
      console.error('Error getting weekly report:', errorMessage);
      res.status(500).json({
        success: false,
        error: `Failed to get weekly report: ${errorMessage}`
      });
    }
  }
};

export default userController;