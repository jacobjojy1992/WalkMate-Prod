// src/server/controllers/userController.ts
import { Request, Response } from 'express';
import dbService from '../services/dbService';

/**
 * Controller for user-related operations
 */
const userController = {
  /**
   * Get all users
   */
  getAllUsers: async (req: Request, res: Response) => {
    try {
      const users = await dbService.withTransaction(async (prisma) => {
        return prisma.user.findMany();
      });
      
      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch users'
      });
    }
  },
  
  /**
   * Get user by ID
   */
  getUserById: async (req: Request, res: Response) => {
    try {
      const user = await dbService.getUserById(req.params.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user'
      });
    }
  },
  
  /**
   * Create a new user
   */
  createUser: async (req: Request, res: Response) => {
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
      console.error('Error creating user:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create user'
      });
    }
  },
  
  /**
   * Update a user
   */
  updateUser: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, goalType, goalValue } = req.body;
      
      // Check if user exists
      const existingUser = await dbService.getUserById(id);
      
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
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
      console.error('Error updating user:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update user'
      });
    }
  },
  
  /**
   * Get a user's current streak
   */
  getUserStreak: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if user exists
      const user = await dbService.getUserById(id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      // Get user's streak
      const streak = await dbService.getUserStreak(id);
      
      res.json({
        success: true,
        data: { streak }
      });
    } catch (error) {
      console.error('Error getting user streak:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user streak'
      });
    }
  },
  
  /**
   * Get a user's weekly report
   */
  getWeeklyReport: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { date } = req.query;
      
      // Check if user exists
      const user = await dbService.getUserById(id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
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
          // Properly handle the error by type-checking
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error('Error parsing date:', errorMessage);
          return res.status(400).json({
            success: false,
            error: `Invalid date format: ${errorMessage}`
          });
        }
      }
      
      // Get weekly report
      const report = await dbService.getUserWeeklyReport(id, weekStartDate);
      
      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      // Properly handle the general error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error getting weekly report:', errorMessage);
      res.status(500).json({
        success: false,
        error: `Failed to get weekly report: ${errorMessage}`
      });
    }
  }
};

export default userController;