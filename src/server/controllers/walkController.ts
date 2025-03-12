// src/server/controllers/walkController.ts
import { Request, Response } from 'express';
import dbService from '../services/dbService';
import { startOfDay, endOfDay, formatDateToYYYYMMDD, startOfWeek, endOfWeek } from '../utils/dateUtils';
import { formatError } from '../utils/errorHandler';

/**
 * Controller for walk activity operations
 */
const walkController = {
  /**
   * Get all walks for a user
   */
  getUserWalks: async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      
      // Check if user exists
      const user = await dbService.getUserById(userId);
      
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }
      
      // Get walks for this user
      const walks = await dbService.getUserWalks(userId);
      
      res.json({
        success: true,
        data: walks
      });
    } catch (error) {
      const errorMessage = formatError(error);
      console.error('Error fetching walks:', errorMessage);
      res.status(500).json({
        success: false,
        error: `Failed to fetch walks: ${errorMessage}`
      });
    }
  },
  
  /**
   * Get walks for a specific date
   */
  getWalksByDate: async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, date } = req.params;
      
      // Check if user exists
      const user = await dbService.getUserById(userId);
      
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }
      
      try {
        // Parse the date string to a Date object
        const targetDate = new Date(date);
        
        // Validate date
        if (isNaN(targetDate.getTime())) {
          res.status(400).json({
            success: false,
            error: 'Invalid date format'
          });
          return;
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
        const errorMessage = formatError(error);
        res.status(400).json({
          success: false,
          error: `Invalid date format: ${errorMessage}`
        });
        return;
      }
    } catch (error) {
      const errorMessage = formatError(error);
      console.error('Error fetching walks for date:', errorMessage);
      res.status(500).json({
        success: false,
        error: `Failed to fetch walks for date: ${errorMessage}`
      });
    }
  },
  
  /**
   * Create a new walk
   */
  createWalk: async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, steps, distance, duration, date } = req.body;
      
      // Check if user exists
      const user = await dbService.getUserById(userId);
      
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
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
      const errorMessage = formatError(error);
      console.error('Error creating walk:', errorMessage);
      res.status(500).json({
        success: false,
        error: `Failed to create walk: ${errorMessage}`
      });
    }
  },
  
  /**
   * Delete a walk
   */
  deleteWalk: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      // Check if walk exists
      const walk = await dbService.withTransaction(async (prisma) => {
        return prisma.walk.findUnique({
          where: { id }
        });
      });
      
      if (!walk) {
        res.status(404).json({
          success: false,
          error: 'Walk not found'
        });
        return;
      }
      
      // Delete walk
      await dbService.deleteWalk(id);
      
      res.json({
        success: true,
        message: 'Walk deleted successfully'
      });
    } catch (error) {
      const errorMessage = formatError(error);
      console.error('Error deleting walk:', errorMessage);
      res.status(500).json({
        success: false,
        error: `Failed to delete walk: ${errorMessage}`
      });
    }
  },
  
  /**
   * Update an existing walk
   */
  updateWalk: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { steps, distance, duration, date } = req.body;
      
      // Check if walk exists
      const walk = await dbService.withTransaction(async (prisma) => {
        return prisma.walk.findUnique({
          where: { id }
        });
      });
      
      if (!walk) {
        res.status(404).json({
          success: false,
          error: 'Walk not found'
        });
        return;
      }
      
      // Parse numeric values
      interface WalkUpdateData {
        steps?: number;
        distance?: number;
        duration?: number;
        date?: Date;
      }
      
      const updateData: WalkUpdateData = {};
      
      if (steps !== undefined) updateData.steps = Number(steps);
      if (distance !== undefined) updateData.distance = Number(distance);
      if (duration !== undefined) updateData.duration = Number(duration);
      if (date !== undefined) updateData.date = new Date(date);
      
      // Update walk
      const updatedWalk = await dbService.withTransaction(async (prisma) => {
        return prisma.walk.update({
          where: { id },
          data: updateData
        });
      });
      
      res.json({
        success: true,
        data: updatedWalk
      });
    } catch (error) {
      const errorMessage = formatError(error);
      console.error('Error updating walk:', errorMessage);
      res.status(500).json({
        success: false,
        error: `Failed to update walk: ${errorMessage}`
      });
    }
  },
  
  /**
   * Get walking summary statistics for a time period
   */
  getWalkStats: async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const { period, startDate, endDate } = req.query;
      
      // Check if user exists
      const user = await dbService.getUserById(userId);
      
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }
      
      let start: Date;
      let end: Date;
      
      // Determine date range based on period
      if (period === 'week') {
        start = startOfWeek(new Date());
        end = endOfWeek(start);
      } else if (period === 'month') {
        // Get first day of current month
        const now = new Date();
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        // Get first day of next month
        end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      } else if (startDate && endDate) {
        // Custom date range
        start = new Date(startDate as string);
        end = new Date(endDate as string);
        
        // Validate dates
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          res.status(400).json({
            success: false,
            error: 'Invalid date format'
          });
          return;
        }
      } else {
        // Default to last 7 days
        end = new Date();
        start = new Date();
        start.setDate(end.getDate() - 7);
      }
      
      // Get walks for this time period
      const walks = await dbService.getWalksByDateRange(userId, start, end);
      
      // Calculate statistics
      const stats = {
        totalWalks: walks.length,
        totalSteps: 0,
        totalDistance: 0,
        totalDuration: 0,
        averageStepsPerWalk: 0,
        averageDistancePerWalk: 0,
        averageDurationPerWalk: 0,
        startDate: formatDateToYYYYMMDD(start),
        endDate: formatDateToYYYYMMDD(end)
      };
      
      if (walks.length > 0) {
        walks.forEach(walk => {
          stats.totalSteps += walk.steps;
          stats.totalDistance += Number(walk.distance);
          stats.totalDuration += walk.duration;
        });
        
        stats.averageStepsPerWalk = Math.round(stats.totalSteps / walks.length);
        stats.averageDistancePerWalk = Number((stats.totalDistance / walks.length).toFixed(2));
        stats.averageDurationPerWalk = Math.round(stats.totalDuration / walks.length);
      }
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      const errorMessage = formatError(error);
      console.error('Error getting walk statistics:', errorMessage);
      res.status(500).json({
        success: false,
        error: `Failed to get walk statistics: ${errorMessage}`
      });
    }
  }
};

export default walkController;