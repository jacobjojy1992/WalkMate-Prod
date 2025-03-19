// src/types/api.ts

// Backend API response types
export interface ApiResponse<T> {
    success: boolean;
    data: T | null;
    error?: string | null;
  }
  
  export interface ApiUser {
    id: string;
    name: string;
    goalType: string;
    goalValue: number;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface ApiWalk {
    id: string;
    steps: number;
    distance: number;
    duration: number;
    date: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
  }