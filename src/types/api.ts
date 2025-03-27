// src/types/api.ts

/**
 * Generic API response wrapper
 * Provides a consistent structure for all API responses
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error?: string | null;
}

/**
 * User model from the API
 */
export interface ApiUser {
  id: string;
  name: string;
  goalType: string;
  goalValue: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Walking activity model from the API
 */
export interface ApiWalk {
  id: string;
  steps: number;
  distance: number; // in meters
  duration: number; // in minutes
  date: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * User profile with daily goal
 * Used in the application's context
 */
export interface ApiUserProfile {
  id?: string;
  name: string;
  dailyGoal: {
    type: 'steps' | 'distance';
    value: number;
  };
}

/**
 * Walking activity
 * Used in the application's context
 */
export interface Activity {
  id?: string;
  date: string;
  timestamp: string;
  steps: number;
  distance: number;
  duration: number;
  userId?: string;
}