// src/services/api.ts
import axios from 'axios';

// Base URL for our API - we can change this for production later
const API_URL = 'http://localhost:3001/api';

/**
 * This file contains services that connect to our backend API.
 * Each function makes a specific API request and handles the response.
 */

// User API endpoints
export const userApi = {
  /**
   * Get all users
   * @returns A list of all users
   */
  getAll: async () => {
    try {
      const response = await axios.get(`${API_URL}/users`);
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },
  
  /**
   * Get a specific user by ID
   * @param id The user ID
   * @returns Data for the specified user
   */
  getById: async (id: string) => {
    try {
      const response = await axios.get(`${API_URL}/users/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      throw error;
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
  }) => {
    try {
      const response = await axios.post(`${API_URL}/users`, userData);
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
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
  }) => {
    try {
      const response = await axios.put(`${API_URL}/users/${id}`, userData);
      return response.data;
    } catch (error) {
      console.error(`Error updating user ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Get a user's current streak
   * @param id The user ID
   * @returns The user's streak information
   */
  getStreak: async (id: string) => {
    try {
      const response = await axios.get(`${API_URL}/users/${id}/streak`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching streak for user ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Get a user's weekly activity report
   * @param id The user ID
   * @param date Optional date to get report for a specific week
   * @returns Weekly activity report
   */
  getWeeklyReport: async (id: string, date?: string) => {
    try {
      const url = date 
        ? `${API_URL}/users/${id}/weekly-report?date=${date}` 
        : `${API_URL}/users/${id}/weekly-report`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error(`Error fetching weekly report for user ${id}:`, error);
      throw error;
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
  getAllForUser: async (userId: string) => {
    try {
      const response = await axios.get(`${API_URL}/walks/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching walks for user ${userId}:`, error);
      throw error;
    }
  },
  
  /**
   * Get walks for a specific date
   * @param userId The user ID
   * @param date The date in YYYY-MM-DD format
   * @returns List of walks for the specified date
   */
  getByDate: async (userId: string, date: string) => {
    try {
      const response = await axios.get(`${API_URL}/walks/user/${userId}/date/${date}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching walks for user ${userId} on date ${date}:`, error);
      throw error;
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
  }) => {
    try {
      const response = await axios.post(`${API_URL}/walks`, walkData);
      return response.data;
    } catch (error) {
      console.error('Error creating walk:', error);
      throw error;
    }
  },
  
  /**
   * Update an existing walk
   * @param id The walk ID to update
   * @param walkData The data to update
   * @returns The updated walk data
   */
  update: async (id: string, walkData: {
    steps?: number;
    distance?: number;
    duration?: number;
    date?: string;
  }) => {
    try {
      const response = await axios.put(`${API_URL}/walks/${id}`, walkData);
      return response.data;
    } catch (error) {
      console.error(`Error updating walk ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Delete a walk activity
   * @param id The walk ID to delete
   * @returns Success message
   */
  delete: async (id: string) => {
    try {
      const response = await axios.delete(`${API_URL}/walks/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting walk ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Get walking statistics for a user
   * @param userId The user ID
   * @param period Optional period (week/month)
   * @param startDate Optional start date for custom range
   * @param endDate Optional end date for custom range
   * @returns Walking statistics
   */
  getStats: async (userId: string, period?: string, startDate?: string, endDate?: string) => {
    try {
      let url = `${API_URL}/walks/user/${userId}/stats`;
      const params = [];
      
      if (period) params.push(`period=${period}`);
      if (startDate) params.push(`startDate=${startDate}`);
      if (endDate) params.push(`endDate=${endDate}`);
      
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error(`Error fetching stats for user ${userId}:`, error);
      throw error;
    }
  }
};

// Health check - useful for checking if the API is available
export const healthCheck = async () => {
  try {
    const response = await axios.get(`${API_URL}/health`);
    return response.data;
  } catch (error) {
    console.error('API health check failed:', error);
    throw error;
  }
};

// Create the API service object first
const apiService = {
    user: userApi,
    walk: walkApi,
    healthCheck
  };

export default apiService;



