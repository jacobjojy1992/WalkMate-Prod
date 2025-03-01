// src/types/index.ts

// User profile information
export interface UserProfile {
    id?: string;
    name: string;
    dailyGoal: {
      type: 'steps' | 'distance';
      value: number;
    };
  }
  
  // A single walking activity
  export interface WalkActivity {
    id?: string;
    date: string;
    steps: number;
    distance: number; // in meters
    duration: number; // in minutes
    timestamp: string; // ISO string format
    userId?: string;
  }
  
  // API response format
  export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
  }