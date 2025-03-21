// src/services/api.ts
import axios from 'axios';
import { ApiResponse, ApiUser, ApiWalk } from '@/types';

// Base URL for our API
const API_URL = 'http://localhost:3001';

// Define the API response structure for TypeScript
interface BackendResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

interface WeeklyReport {
  startDate: string;
  endDate: string;
  dailyData: Array<{
    date: string;
    steps: number;
    distance: number;
    duration: number;
    goalMet: boolean;
  }>;
  weeklyTotals: {
    totalSteps: number;
    totalDistance: number;
    totalDuration: number;
    daysActive: number;
    daysGoalMet: number;
  };
}

interface WalkStats {
  totalWalks: number;
  totalSteps: number;
  totalDistance: number;
  totalDuration: number;
  averageStepsPerWalk: number;
  averageDistancePerWalk: number;
  averageDurationPerWalk: number;
  startDate: string;
  endDate: string;
}

// User API endpoints
export const userApi = {
  /**
   * Get all users
   * @returns A list of all users
   */
  getAll: async (): Promise<ApiResponse<ApiUser[]>> => {
    try {
      const response = await axios.get<BackendResponse<ApiUser[]>>(`${API_URL}/api/users`);
      return {
        success: true,
        data: response.data.data,
        error: null
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch users';
      return {
        success: false,
        data: null,
        error: errorMessage
      };
    }
  },
  
  /**
   * Get a specific user by ID
   * @param id The user ID
   * @returns Data for the specified user
   */
  getById: async (id: string): Promise<ApiResponse<ApiUser>> => {
    try {
      const response = await axios.get<BackendResponse<ApiUser>>(`${API_URL}/api/users/${id}`);
      return {
        success: true,
        data: response.data.data,
        error: null
      };
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      const errorMessage = error instanceof Error ? error.message : `Failed to fetch user ${id}`;
      return {
        success: false,
        data: null,
        error: errorMessage
      };
    }
  },
  
  /**
   * Create a new user
   * @param userData User data containing name, goalType, and goalValue
   * @returns The created user data with ID
   */
  create: async (userData: { 
    name: string; 
    goalType: string; 
    goalValue: number 
  }): Promise<ApiResponse<ApiUser>> => {
    try {
      const response = await axios.post<BackendResponse<ApiUser>>(`${API_URL}/api/users`, userData);
      return {
        success: true,
        data: response.data.data,
        error: null
      };
    } catch (error) {
      console.error('Error creating user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
      return {
        success: false,
        data: null,
        error: errorMessage
      };
    }
  },
  
  /**
   * Update an existing user
   * @param id The user ID to update
   * @param userData The user data to update
   * @returns The updated user data
   */
  update: async (id: string, userData: {
    name?: string;
    goalType?: string;
    goalValue?: number;
  }): Promise<ApiResponse<ApiUser>> => {
    try {
      const response = await axios.put<BackendResponse<ApiUser>>(`${API_URL}/api/users/${id}`, userData);
      return {
        success: true,
        data: response.data.data,
        error: null
      };
    } catch (error) {
      console.error(`Error updating user ${id}:`, error);
      const errorMessage = error instanceof Error ? error.message : `Failed to update user ${id}`;
      return {
        success: false,
        data: null,
        error: errorMessage
      };
    }
  },

  /**
   * Get user streak
   * @param id The user ID
   * @returns The user's current streak
   */
  getUserStreak: async (id: string): Promise<ApiResponse<{streak: number}>> => {
    try {
      const response = await axios.get<BackendResponse<{streak: number}>>(`${API_URL}/api/users/${id}/streak`);
      return {
        success: true,
        data: response.data.data,
        error: null
      };
    } catch (error) {
      console.error(`Error fetching streak for user ${id}:`, error);
      const errorMessage = error instanceof Error ? error.message : `Failed to fetch streak`;
      return {
        success: false,
        data: null,
        error: errorMessage
      };
    }
  },

  /**
   * Get user weekly report
   * @param id The user ID
   * @param date Optional date for specific week
   * @returns Weekly activity report
   */
  getWeeklyReport: async (id: string, date?: string): Promise<ApiResponse<WeeklyReport>> => {
    try {
      const url = date 
        ? `${API_URL}/api/users/${id}/weekly-report?date=${date}`
        : `${API_URL}/api/users/${id}/weekly-report`;
      
      const response = await axios.get<BackendResponse<WeeklyReport>>(url);
      return {
        success: true,
        data: response.data.data,
        error: null
      };
    } catch (error) {
      console.error(`Error fetching weekly report for user ${id}:`, error);
      const errorMessage = error instanceof Error ? error.message : `Failed to fetch weekly report`;
      return {
        success: false,
        data: null,
        error: errorMessage
      };
    }
  }
};

// Walk API endpoints
export const walkApi = {
  /**
   * Get all walks for a specific user
   * @param userId The user ID
   * @returns List of all walks for the user
   */
  getAllForUser: async (userId: string): Promise<ApiResponse<ApiWalk[]>> => {
    try {
      const response = await axios.get<BackendResponse<ApiWalk[]>>(`${API_URL}/api/walks/user/${userId}`);
      return {
        success: true,
        data: Array.isArray(response.data.data) ? response.data.data : [],
        error: null
      };
    } catch (error) {
      console.error(`Error fetching walks for user ${userId}:`, error);
      const errorMessage = error instanceof Error ? error.message : `Failed to fetch walks for user ${userId}`;
      return {
        success: false,
        data: [],
        error: errorMessage
      };
    }
  },
  
  /**
   * Get walks for a specific date
   * @param userId The user ID
   * @param date The date in YYYY-MM-DD format
   * @returns List of walks for the specified date
   */
  getWalksByDate: async (userId: string, date: string): Promise<ApiResponse<ApiWalk[]>> => {
    try {
      const response = await axios.get<BackendResponse<ApiWalk[]>>(`${API_URL}/api/walks/user/${userId}/date/${date}`);
      return {
        success: true,
        data: Array.isArray(response.data.data) ? response.data.data : [],
        error: null
      };
    } catch (error) {
      console.error(`Error fetching walks for date ${date}:`, error);
      const errorMessage = error instanceof Error ? error.message : `Failed to fetch walks for date`;
      return {
        success: false,
        data: [],
        error: errorMessage
      };
    }
  },
  
  /**
   * Create a new walk activity
   * @param walkData Walk data including userId, steps, distance, duration, and date
   * @returns The created walk data
   */
  create: async (walkData: {
    userId: string;
    steps: number;
    distance: number;
    duration: number;
    date: string;
  }): Promise<ApiResponse<ApiWalk>> => {
    try {
      const response = await axios.post<BackendResponse<ApiWalk>>(`${API_URL}/api/walks`, walkData);
      return {
        success: true,
        data: response.data.data,
        error: null
      };
    } catch (error) {
      console.error('Error creating walk:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create walk';
      return {
        success: false,
        data: null,
        error: errorMessage
      };
    }
  },

  /**
   * Delete a walk
   * @param id The walk ID to delete
   * @returns Success message
   */
  deleteWalk: async (id: string): Promise<ApiResponse<{message: string}>> => {
    try {
      const response = await axios.delete<BackendResponse<{message: string}>>(`${API_URL}/api/walks/${id}`);
      return {
        success: true,
        data: response.data.data,
        error: null
      };
    } catch (error) {
      console.error(`Error deleting walk ${id}:`, error);
      const errorMessage = error instanceof Error ? error.message : `Failed to delete walk`;
      return {
        success: false,
        data: null,
        error: errorMessage
      };
    }
  },

  /**
   * Get walk statistics
   * @param userId The user ID
   * @param period Optional period for stats (week, month)
   * @returns Walk statistics
   */
  getStats: async (userId: string, period?: string): Promise<ApiResponse<WalkStats>> => {
    try {
      const url = period 
        ? `${API_URL}/api/walks/user/${userId}/stats?period=${period}`
        : `${API_URL}/api/walks/user/${userId}/stats`;
      
      const response = await axios.get<BackendResponse<WalkStats>>(url);
      return {
        success: true,
        data: response.data.data,
        error: null
      };
    } catch (error) {
      console.error(`Error fetching walk statistics for user ${userId}:`, error);
      const errorMessage = error instanceof Error ? error.message : `Failed to fetch walk statistics`;
      return {
        success: false,
        data: null,
        error: errorMessage
      };
    }
  }
};

// Health check - useful for checking if the API is available
export const healthCheck = async (): Promise<ApiResponse<{status: string}>> => {
  try {
    const response = await axios.get<{status: string}>(`${API_URL}/api/health`);
    return {
      success: true,
      data: response.data,
      error: null
    };
  } catch (error) {
    console.error('API health check failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Health check failed';
    return {
      success: false,
      data: null,
      error: errorMessage
    };
  }
};