// src/services/api.ts
import axios from 'axios';
import { ApiResponse, ApiUser, ApiWalk } from '@/types';

// Base URL for our API
const API_URL = 'http://localhost:3001';

// User API endpoints
export const userApi = {
  /**
   * Get all users
   * @returns A list of all users
   */
  getAll: async (): Promise<ApiResponse<ApiUser[]>> => {
    try {
      const response = await axios.get(`${API_URL}/users`);
      return {
        success: true,
        data: response.data as ApiUser[],
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
      const response = await axios.get(`${API_URL}/users/${id}`);
      return {
        success: true,
        data: response.data as ApiUser,
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
      const response = await axios.post(`${API_URL}/users`, userData);
      return {
        success: true,
        data: response.data as ApiUser,
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
      const response = await axios.put(`${API_URL}/users/${id}`, userData);
      return {
        success: true,
        data: response.data as ApiUser,
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
      const response = await axios.get(`${API_URL}/users/${userId}/walks`);
      return {
        success: true,
        data: Array.isArray(response.data) ? response.data as ApiWalk[] : [],
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
      const response = await axios.post(`${API_URL}/walks`, walkData);
      return {
        success: true,
        data: response.data as ApiWalk,
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
  }
};

// Health check - useful for checking if the API is available
export const healthCheck = async (): Promise<ApiResponse<{status: string}>> => {
  try {
    const response = await axios.get(`${API_URL}/health`);
    return {
      success: true,
      data: response.data as {status: string},
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