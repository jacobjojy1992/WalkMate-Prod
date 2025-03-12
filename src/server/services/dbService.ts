// src/server/services/dbService.ts
import { PrismaClient, User, Walk } from '@prisma/client';
import { formatDateToYYYYMMDD, startOfWeek, endOfWeek } from '../utils/dateUtils';

// Initialize Prisma client
const prisma = new PrismaClient();

/**
 * Database service with data access methods and transaction support
 */
const dbService = {
  /**
   * Get user by ID
   */
  getUserById: async (id: string): Promise<User | null> => {
    return prisma.user.findUnique({
      where: { id }
    });
  },
  
  /**
   * Create a new user
   */
  createUser: async (data: {
    name: string;
    goalType?: string;
    goalValue?: number;
  }): Promise<User> => {
    return prisma.user.create({
      data: {
        name: data.name,
        goalType: data.goalType || 'steps',
        goalValue: data.goalValue || 10000
      }
    });
  },
  
  /**
   * Update a user
   */
  updateUser: async (id: string, data: {
    name?: string;
    goalType?: string;
    goalValue?: number;
  }): Promise<User> => {
    return prisma.user.update({
      where: { id },
      data
    });
  },
  
  /**
   * Get all walks for a user
   */
  getUserWalks: async (userId: string): Promise<Walk[]> => {
    return prisma.walk.findMany({
      where: { userId },
      orderBy: { date: 'desc' }
    });
  },
  
  /**
   * Get walks for a specific date range
   */
  getWalksByDateRange: async (userId: string, startDate: Date, endDate: Date): Promise<Walk[]> => {
    return prisma.walk.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lt: endDate
        }
      },
      orderBy: { date: 'desc' }
    });
  },
  
  /**
   * Create a new walk activity
   */
  createWalk: async (data: {
    steps: number;
    distance: number;
    duration: number;
    date: Date;
    userId: string;
  }): Promise<Walk> => {
    return prisma.walk.create({
      data
    });
  },
  
  /**
   * Delete a walk activity
   */
  deleteWalk: async (id: string): Promise<Walk> => {
    return prisma.walk.delete({
      where: { id }
    });
  },
  
  /**
   * Get a user's current streak (consecutive days with activity)
   */
  getUserStreak: async (userId: string): Promise<number> => {
    // Get all walks for this user, ordered by date
    const walks = await prisma.walk.findMany({
      where: { userId },
      orderBy: { date: 'desc' }
    });

    if (walks.length === 0) {
      return 0; // No walks, no streak
    }

    // Group walks by date (to handle multiple walks on the same day)
    const walkDates = new Set<string>();
    walks.forEach(walk => {
      const dateStr = formatDateToYYYYMMDD(walk.date);
      walkDates.add(dateStr);
    });

    // Sort dates in descending order
    const sortedDates = Array.from(walkDates).sort().reverse();
    
    // Check if the most recent walk was today or yesterday
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const mostRecentWalkDate = new Date(sortedDates[0]);
    mostRecentWalkDate.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // If the most recent walk was not today or yesterday, the streak is broken
    if (mostRecentWalkDate < yesterday) {
      return 0;
    }
    
    // Count consecutive days
    let streak = 1; // Start with 1 for the most recent day
    let currentDate = mostRecentWalkDate;
    
    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i]);
      prevDate.setHours(0, 0, 0, 0);
      
      // Check if the previous date is the day before the current date
      const expectedPrevDate = new Date(currentDate);
      expectedPrevDate.setDate(expectedPrevDate.getDate() - 1);
      
      if (prevDate.getTime() === expectedPrevDate.getTime()) {
        streak++;
        currentDate = prevDate;
      } else {
        break; // Streak is broken
      }
    }
    
    return streak;
  },
  
  /**
   * Get a user's weekly report
   */
  getUserWeeklyReport: async (userId: string, weekStartDate?: Date) => {
    // If no date provided, use the current date
    const startDate = weekStartDate ? startOfWeek(weekStartDate) : startOfWeek(new Date());
    const endDate = endOfWeek(startDate);
    
    // Get all walks for this user during the specified week
    const walks = await prisma.walk.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { date: 'asc' }
    });
    
    // Initialize daily totals
    const dailyData: {
      [key: string]: {
        date: string;
        steps: number;
        distance: number;
        duration: number;
        goalMet: boolean;
      }
    } = {};
    
    // Initialize the daily data for each day of the week
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateKey = formatDateToYYYYMMDD(currentDate);
      
      dailyData[dateKey] = {
        date: dateKey,
        steps: 0,
        distance: 0,
        duration: 0,
        goalMet: false
      };
    }
    
    // Get user goal
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Process walks to get daily totals
    walks.forEach(walk => {
      const dateKey = formatDateToYYYYMMDD(walk.date);
      
      if (dailyData[dateKey]) {
        dailyData[dateKey].steps += walk.steps;
        dailyData[dateKey].distance += Number(walk.distance);
        dailyData[dateKey].duration += walk.duration;
        
        // Check if goal is met
        if (user.goalType === 'steps' && dailyData[dateKey].steps >= user.goalValue) {
          dailyData[dateKey].goalMet = true;
        } else if (user.goalType === 'distance' && dailyData[dateKey].distance >= user.goalValue) {
          dailyData[dateKey].goalMet = true;
        }
      }
    });
    
    // Calculate weekly totals
    const weeklyTotals = {
      totalSteps: 0,
      totalDistance: 0,
      totalDuration: 0,
      daysActive: 0,
      daysGoalMet: 0
    };
    
    Object.values(dailyData).forEach(day => {
      weeklyTotals.totalSteps += day.steps;
      weeklyTotals.totalDistance += day.distance;
      weeklyTotals.totalDuration += day.duration;
      
      if (day.steps > 0 || day.distance > 0 || day.duration > 0) {
        weeklyTotals.daysActive++;
      }
      
      if (day.goalMet) {
        weeklyTotals.daysGoalMet++;
      }
    });
    
    return {
      startDate: formatDateToYYYYMMDD(startDate),
      endDate: formatDateToYYYYMMDD(endDate),
      dailyData: Object.values(dailyData),
      weeklyTotals
    };
  },
  
  /**
   * Execute a function within a transaction
   * This allows multiple database operations to be treated as a single unit
   */
  withTransaction: async <T>(fn: (prisma: PrismaClient) => Promise<T>): Promise<T> => {
    return prisma.$transaction(async (tx) => {
      return fn(tx as unknown as PrismaClient);
    });
  }
};

export default dbService;