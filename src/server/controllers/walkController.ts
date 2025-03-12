// src/server/controllers/walkController.ts
import { Request, Response } from 'express';
import dbService from '../services/dbService';
import { startOfDay, endOfDay } from '../utils/dateUtils';

/**
 * Controller for walk activity operations
 */
const walkController = {
  /**
   * Get all walks for a user
   */
  getUserWalks: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      // Check if user exists
      const user = await dbService.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      // Get walks for this user
      const walks = await dbService.getUserWalks(userId);
      
      res.json({
        success: true,
        data: walks
      });
    } catch (error) {
      console.error('Error fetching walks:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch walks'
      });
    }
  },
  
  /**
   * Get walks for a specific date
   */
  getWalksByDate: async (req: Request, res: Response) => {
    try {
      const { userId, date } = req.params;
      
      // Check if user exists
      const user = await dbService.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      try {
        // Parse the date string to a Date object
        const targetDate = new Date(date);
        
        // Validate date
        if (isNaN(targetDate.getTime())) {
          return res.status(400).json({
            success: false,
            error: 'Invalid date format'
          });
        }
        
        // Get start and end of the target date
        const dayStart = startOfDay(targetDate);
        const dayEnd = endOfDay(targetDate);
        
        // Get walks for this user on the specified date
        const walks = await dbService.getWalksByDateRange(
          userId,
          dayStart,
          dayEnd
        );
        
        res.json({
          success: true,
          data: walks
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return res.status(400).json({
          success: false,
          error: `Invalid date format: ${errorMessage}`
        });
      }
    } catch (error) {
      console.error('Error fetching walks for date:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch walks for date'
      });
    }
  },
  
  /**
   * Create a new walk
   */
  createWalk: async (req: Request, res: Response) => {
    try {
      const { userId, steps, distance, duration, date } = req.body;
      
      // Check if user exists
      const user = await dbService.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      // Parse numeric values
      const parsedSteps = Number(steps);
      const parsedDistance = Number(distance);
      const parsedDuration = Number(duration);
      
      // Create walk record
      const walk = await dbService.createWalk({
        steps: parsedSteps,
        distance: parsedDistance,
        duration: parsedDuration,
        date: new Date(date),
        userId
      });
      
      res.status(201).json({
        success: true,
        data: walk
      });
    } catch (error) {
      console.error('Error creating walk:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create walk'
      });
    }
  },
  
  /**
   * Delete a walk
   */
  deleteWalk: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Check if walk exists
      const walk = await dbService.withTransaction(async (prisma) => {
        return prisma.walk.findUnique({
          where: { id }
        });
      });
      
      if (!walk) {
        return res.status(404).json({
          success: false,
          error: 'Walk not found'
        });
      }
      
      // Delete walk
      await dbService.deleteWalk(id);
      
      res.json({
        success: true,
        message: 'Walk deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting walk:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete walk'
      });
    }
  }
};

export default walkController;