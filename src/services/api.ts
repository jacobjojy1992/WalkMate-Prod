// src/services/api.ts
import axios from 'axios';
import { ApiResponse, ApiUser, ApiWalk } from '@/types';


// Base URL for our API - will use environment variable in production
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// A robust path join function that handles slashes properly
const pathJoin = (...parts: string[]): string => {
  // Make sure the result starts with a slash and doesn't have double slashes
  return '/' + parts
    .map(part => part.replace(/(^\/+|\/+$)/g, ''))
    .filter(part => part.length)
    .join('/');
};

// Define the API response structure for TypeScript
interface BackendResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// Helper function to log detailed error information with proper typing
const logDetailedError = (error: unknown, context: string): void => {
  console.error(`API Error in ${context}:`, error);
  
  // Use a proper type guard for axios errors
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    // Define a proper type for Axios errors
    interface AxiosErrorType {
      message: string;
      isAxiosError: boolean;
      response?: {
        status?: number;
        statusText?: string;
        data?: unknown;
      };
      config?: {
        url?: string;
        method?: string;
        baseURL?: string;
      };
    }
    
    // Cast error to our defined type
    const axiosError = error as AxiosErrorType;
    
    console.error('Detailed error info:', {
      message: axiosError.message,
      status: axiosError.response?.status,
      statusText: axiosError.response?.statusText,
      data: axiosError.response?.data,
      url: axiosError.config?.url,
      method: axiosError.config?.method,
      baseURL: axiosError.config?.baseURL,
      fullUrl: axiosError.config?.baseURL && axiosError.config?.url 
        ? axiosError.config.baseURL + axiosError.config.url 
        : undefined
    });
  }
};

// User API endpoints
export const userApi = {
  /**
   * Get all users
   * @returns A list of all users
   */
  getAll: async (): Promise<ApiResponse<ApiUser[]>> => {
    try {
      const fullUrl = `${API_URL}${pathJoin('api', 'users')}`;
      console.log('Making API request to: GET', fullUrl);
      
      const response = await axios.get<BackendResponse<ApiUser[]>>(fullUrl);
      console.log('API response success:', response.status);
      return {
        success: true,
        data: response.data.data,
        error: null
      };
    } catch (error) {
      logDetailedError(error, 'getAll users');
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
      const fullUrl = `${API_URL}${pathJoin('api', 'users', id)}`;
      console.log('Making API request to: GET', fullUrl);
      
      const response = await axios.get<BackendResponse<ApiUser>>(fullUrl);
      console.log('API response success:', response.status);
      return {
        success: true,
        data: response.data.data,
        error: null
      };
    } catch (error) {
      logDetailedError(error, `getById user ${id}`);
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
      const fullUrl = `${API_URL}${pathJoin('api', 'users')}`;
      console.log('Making API request to: POST', fullUrl, userData);
      
      const response = await axios.post<BackendResponse<ApiUser>>(fullUrl, userData);
      console.log('API response success:', response.status);
      return {
        success: true,
        data: response.data.data,
        error: null
      };
    } catch (error) {
      logDetailedError(error, 'create user');
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
      const fullUrl = `${API_URL}${pathJoin('api', 'users', id)}`;
      console.log('Making API request to: PUT', fullUrl, userData);
      
      const response = await axios.put<BackendResponse<ApiUser>>(fullUrl, userData);
      console.log('API response success:', response.status);
      return {
        success: true,
        data: response.data.data,
        error: null
      };
    } catch (error) {
      logDetailedError(error, `update user ${id}`);
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
      const fullUrl = `${API_URL}${pathJoin('api', 'users', id, 'streak')}`;
      console.log('Making API request to: GET', fullUrl);
      
      const response = await axios.get<BackendResponse<{streak: number}>>(fullUrl);
      console.log('API response success:', response.status);
      return {
        success: true,
        data: response.data.data,
        error: null
      };
    } catch (error) {
      logDetailedError(error, `getUserStreak ${id}`);
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
  getWeeklyReport: async (id: string, date?: string): Promise<ApiResponse<Record<string, unknown>>> => {
    try {
      const baseUrl = `${API_URL}${pathJoin('api', 'users', id, 'weekly-report')}`;
      const fullUrl = date ? `${baseUrl}?date=${date}` : baseUrl;
      
      console.log('Making API request to: GET', fullUrl);
      const response = await axios.get<BackendResponse<Record<string, unknown>>>(fullUrl);
      console.log('API response success:', response.status);
      return {
        success: true,
        data: response.data.data,
        error: null
      };
    } catch (error) {
      logDetailedError(error, `getWeeklyReport ${id}`);
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
      // Define all possible URL patterns that might match your backend routes
      const urlPatterns = [
        `${API_URL}/api/walks/user/${userId}`,       // Pattern 1: Standard pattern from original code
        `${API_URL}/api/users/${userId}/walks`,      // Pattern 2: RESTful pattern alternative
        `${API_URL}/walks/user/${userId}`,           // Pattern 3: Without api prefix (pattern 1)
        `${API_URL}/users/${userId}/walks`,          // Pattern 4: Without api prefix (pattern 2)
        `${API_URL}/api/user/${userId}/walks`,       // Pattern 5: Singular "user" instead of "users"
        `${API_URL}/api/walks?userId=${userId}`,     // Pattern 6: Query parameter approach
        `${API_URL}/api/users/${userId}/activities`  // Pattern 7: Different endpoint name
      ];
      
      console.log(`Attempting to fetch walks for user ${userId} using multiple URL patterns`);
      console.log(`Current API_URL base: ${API_URL}`);
      
      // Try each URL pattern sequentially until one works
      for (let i = 0; i < urlPatterns.length; i++) {
        const url = urlPatterns[i];
        try {
          console.log(`Attempt ${i+1}/${urlPatterns.length}: Trying ${url}`);
          
          // Make the API request with the current URL pattern
          const response = await axios.get(url, {
            timeout: 5000, // Shorter timeout to fail faster between attempts
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
          
          // If we reach here, the request succeeded
          console.log(`SUCCESS with pattern ${i+1}: ${url}`);
          console.log(`Response status: ${response.status}`);
          
          // Handle the response data carefully with proper type checking
          if (response.data) {
            // Check if response follows our expected BackendResponse structure
            if (response.data && typeof response.data === 'object' && 'data' in response.data) {
              const responseData = response.data.data;
              console.log(`Found ${Array.isArray(responseData) ? responseData.length : 0} activities`);
              
              return {
                success: true,
                data: Array.isArray(responseData) ? responseData : [],
                error: null
              };
            } else {
              // Handle case where response might have direct data (not nested)
              console.log('Response has direct data (no nested .data property)');
              return {
                success: true,
                data: Array.isArray(response.data) ? response.data : [],
                error: null
              };
            }
          }
          
          // If we get here, response succeeded but had unexpected structure
          console.log('Response had unexpected structure:', response.data);
          return {
            success: false,
            data: [],
            error: 'Response had unexpected data structure'
          };
        } catch (error) {
          // Log the error for this specific attempt
          console.log(`FAILED with pattern ${i+1}: ${url}`);
          if (error instanceof Error) {
            console.log(`Error message: ${error.message}`);
          }
          
          // Continue to next pattern if this one failed
        }
      }
      
      // If we get here, all patterns were tried but either succeeded with empty data
// or failed to connect
console.log('All URL patterns tried for walks, checking results');

// As a last resort, try to use locally cached activities
const cachedActivities = localStorage.getItem('walkActivities');
if (cachedActivities) {
  try {
    const activities = JSON.parse(cachedActivities);
    console.log(`Falling back to ${activities.length} cached activities from localStorage`);
    
    // Filter for only this user's activities
    const userActivities = activities.filter(
      (activity: { userId: string }) => activity.userId === userId
    );
    
    if (userActivities.length > 0) {
      console.log(`Found ${userActivities.length} cached activities for this user`);
      return {
        success: true,
        data: userActivities,
        error: 'Using cached data - API connection was successful but returned no data'
      };
    }
  } catch (e) {
    console.error('Error parsing cached activities', e);
  }
}

// Empty array is a valid response for a new user with no walks
// Return it as a success case, not an error
return {
  success: true,
  data: [],
  error: null
};

      
    } catch (generalError) {
      // This catch block handles any unexpected errors in our pattern-trying logic itself
      console.error('Unexpected error in URL pattern testing logic:', generalError);
      
      const errorMessage = generalError instanceof Error ? 
        generalError.message : 
        `Failed to fetch walks for user ${userId}`;
      
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
      // Try both possible URL patterns
      const url1 = `${API_URL}${pathJoin('api', 'walks', 'user', userId, 'date', date)}`;
      const url2 = `${API_URL}${pathJoin('api', 'users', userId, 'walks', 'date', date)}`;
      
      console.log('Making API request to: GET', url1);
      try {
        const response = await axios.get<BackendResponse<ApiWalk[]>>(url1);
        console.log('API response success (option 1):', response.status);
        return {
          success: true,
          data: Array.isArray(response.data.data) ? response.data.data : [],
          error: null
        };
      } catch (error1) {
        console.log('First attempt failed, trying alternative URL:', url2);
        try {
          const response = await axios.get<BackendResponse<ApiWalk[]>>(url2);
          console.log('API response success (option 2):', response.status);
          return {
            success: true,
            data: Array.isArray(response.data.data) ? response.data.data : [],
            error: null
          };
        } catch (error2) {
          throw { primaryError: error1, secondaryError: error2 };
        }
      }
    } catch (error) {
      logDetailedError(error, `getWalksByDate ${userId} ${date}`);
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
      const fullUrl = `${API_URL}${pathJoin('api', 'walks')}`;
      console.log('Making API request to: POST', fullUrl, walkData);
      
      const response = await axios.post<BackendResponse<ApiWalk>>(fullUrl, walkData);
      console.log('API response success:', response.status);
      return {
        success: true,
        data: response.data.data,
        error: null
      };
    } catch (error) {
      logDetailedError(error, 'create walk');
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
      const fullUrl = `${API_URL}${pathJoin('api', 'walks', id)}`;
      console.log('Making API request to: DELETE', fullUrl);
      
      const response = await axios.delete<BackendResponse<{message: string}>>(fullUrl);
      console.log('API response success:', response.status);
      return {
        success: true,
        data: response.data.data,
        error: null
      };
    } catch (error) {
      logDetailedError(error, `deleteWalk ${id}`);
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
  getStats: async (userId: string, period?: string): Promise<ApiResponse<Record<string, unknown>>> => {
    try {
      const baseUrl = `${API_URL}${pathJoin('api', 'walks', 'user', userId, 'stats')}`;
      const fullUrl = period ? `${baseUrl}?period=${period}` : baseUrl;
      
      console.log('Making API request to: GET', fullUrl);
      const response = await axios.get<BackendResponse<Record<string, unknown>>>(fullUrl);
      console.log('API response success:', response.status);
      return {
        success: true,
        data: response.data.data,
        error: null
      };
    } catch (error) {
      logDetailedError(error, `getStats ${userId}`);
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
    const fullUrl = `${API_URL}${pathJoin('api', 'health')}`;
    console.log('Making API request to: GET', fullUrl);
    
    const response = await axios.get<{status: string}>(fullUrl);
    console.log('API response success:', response.status);
    return {
      success: true,
      data: response.data,
      error: null
    };
  } catch (error) {
    logDetailedError(error, 'healthCheck');
    const errorMessage = error instanceof Error ? error.message : 'Health check failed';
    return {
      success: false,
      data: null,
      error: errorMessage
    };
  }
};