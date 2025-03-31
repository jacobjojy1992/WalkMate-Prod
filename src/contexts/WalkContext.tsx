'use client';

import { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { ApiUserProfile, WalkActivity, ApiUser, ApiWalk } from '@/types';
import { userApi, walkApi } from '@/services/api';

// Define context type
interface WalkContextType {
  activities: WalkActivity[];
  userProfile: ApiUserProfile | null;
  isLoading: boolean;
  error: string | null;
  addActivity: (activity: Omit<WalkActivity, 'id' | 'userId'>) => Promise<void>;
  setUserProfile: (profile: ApiUserProfile) => Promise<void>;
  fetchActivities: () => Promise<void>;
  debugDataAssociations?: () => Promise<void>; // Optional debug function
}

// Create context with default values
const WalkContext = createContext<WalkContextType>({
  activities: [],
  userProfile: null,
  isLoading: false,
  error: null,
  addActivity: async () => {},
  setUserProfile: async () => {},
  fetchActivities: async () => {},
});

// Helper functions to convert between frontend and backend data formats
const apiUserToUserProfile = (apiUser: ApiUser): ApiUserProfile => {
  return {
    id: apiUser.id.toString(), // Ensure string format
    name: apiUser.name,
    dailyGoal: {
      type: apiUser.goalType as 'steps' | 'distance',
      value: apiUser.goalValue
    }
  };
};

const userProfileToApiUser = (profile: ApiUserProfile): Partial<ApiUser> => {
  return {
    name: profile.name,
    goalType: profile.dailyGoal.type,
    goalValue: profile.dailyGoal.value
  };
};

// UPDATED: Improved date handling to fix midnight timer issues
const apiWalkToWalkActivity = (apiWalk: ApiWalk): WalkActivity => {
  // Parse the date string to a Date object for more accurate date extraction
  const walkDate = new Date(apiWalk.date);
  
  // Extract date components with proper timezone handling
  const year = walkDate.getFullYear();
  const month = String(walkDate.getMonth() + 1).padStart(2, '0');
  const day = String(walkDate.getDate()).padStart(2, '0');
  
  // Create proper date string in YYYY-MM-DD format
  const dateStr = `${year}-${month}-${day}`;
  
  console.log('Converting API walk date:', apiWalk.date);
  console.log('To activity date:', dateStr);
  
  return {
    id: apiWalk.id.toString(), // Ensure string format
    userId: apiWalk.userId.toString(), // Ensure string format
    steps: apiWalk.steps,
    distance: apiWalk.distance,
    duration: apiWalk.duration,
    date: dateStr, // Use the carefully constructed date string
    timestamp: apiWalk.date // Keep the full ISO string for timestamp
  };
};

// Define a more specific error type to avoid using 'any'
interface ErrorWithResponse {
  response?: {
    status?: number;
    data?: unknown;
  };
  message?: string;
  code?: string;
}

// Provider component
export function WalkProvider({ children }: { children: ReactNode }) {
  // State
  const [activities, setActivities] = useState<WalkActivity[]>([]);
  const [userProfile, setUserProfileState] = useState<ApiUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Ensures a user exists in the database and localStorage
   * This function will:
   * 1. Check if a user ID exists in localStorage
   * 2. If it exists, verify the user exists in the database
   * 3. If not found in the database, create a new user
   * 4. Save the user ID to localStorage for future use
   * @returns The user ID (string) or null if creation failed
   */
  const ensureUserExists = async (): Promise<string | null> => {
    console.group('ensureUserExists');
    try {
      // Check if we have a userId in localStorage
      const storedUserId = localStorage.getItem('currentUserId');
      
      console.log('Found stored user ID:', storedUserId);
      
      if (storedUserId) {
        try {
          // Verify user exists in database
          console.log('Verifying user exists in database...');
          const userResponse = await userApi.getById(storedUserId);
          
          console.log('User verification response:', userResponse);
          
          if (userResponse.success) {
            // CRITICAL: Ensure we have the complete user object with proper ID format
            if (userResponse.data && userResponse.data.id) {
              // Use ID directly from the database response
              const confirmedId = userResponse.data.id.toString();
              
              console.log('User exists in database with ID:', confirmedId);
              
              // Update localStorage to ensure exact format match
              if (confirmedId !== storedUserId) {
                console.log('Updating stored ID to match database format', confirmedId);
                localStorage.setItem('currentUserId', confirmedId);
              }
              
              return confirmedId;
            }
          }
          
          console.log('User not found in database despite having ID in localStorage');
        } catch (error) {
          console.error('Error verifying existing user:', error);
        }
      }
      
      console.log('Creating new user in database');
      try {
        const createResponse = await userApi.create({
          name: 'Device User',
          goalType: 'steps',
          goalValue: 10000
        });
        
        console.log('Create user response:', createResponse);
        
        // CRITICAL FIX: Carefully extract the ID from the response
        if (createResponse.success && createResponse.data) {
          // Some APIs nest data within another 'data' property
          const userData = createResponse.data;
          
          // Ensure we have an ID
          if (!userData.id) {
            console.error('API returned success but no user ID!', userData);
            return null;
          }
          
          const newUserId = userData.id.toString(); // Ensure string format
          console.log('Created new user with ID:', newUserId);
          
          // Save the ID immediately
          localStorage.setItem('currentUserId', newUserId);
          
          // Create and save the profile
          const newProfile = {
            id: newUserId,
            name: userData.name || 'Device User',
            dailyGoal: {
              type: userData.goalType || 'steps',
              value: userData.goalValue || 10000
            }
          };
          
          localStorage.setItem('walkmateUserProfile', JSON.stringify(newProfile));
          
          return newUserId;
        } else {
          console.error('Failed to create user:', createResponse.error);
        }
      } catch (createError) {
        console.error('Error creating new user:', createError);
      }
      
      return null;
    } catch (error) {
      console.error('Unexpected error in ensureUserExists:', error);
      return null;
    } finally {
      console.groupEnd();
    }
  };

  // Helper function to log error details without using 'any'
  const logErrorDetails = (err: unknown): void => {
    if (!err || typeof err !== 'object') return;
    
    const error = err as ErrorWithResponse;
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    if ('message' in error) {
      console.error('Error message:', error.message);
    }
    
    if ('code' in error) {
      console.error('Error code:', error.code);
    }
  };

  // Function to fetch activities for a specific user - wrapped in useCallback
  const fetchActivitiesForUser = useCallback(async (userId: string) => {
    console.group(`fetchActivitiesForUser(${userId})`);
    console.log('Fetching activities for user ID:', userId);
    
    try {
      // Ensure userId is in string format
      const formattedUserId = userId.toString();
      
      console.log('Making API request to get activities');
      // Direct fetch with userId as a query parameter instead of using walkApi service
      const response = await fetch(`/api/walks?userId=${formattedUserId}`);
      const responseData = await response.json();
      console.log('API response:', responseData);
      
      // Convert the direct fetch response to match your expected structure
      const apiResponse = {
        success: response.ok,
        data: responseData.data || responseData,
        error: responseData.error
      };
      
      if (apiResponse.success && Array.isArray(apiResponse.data)) {
        console.log(`Found ${apiResponse.data.length} activities in database`);
        
        if (apiResponse.data.length > 0) {
          const convertedActivities = apiResponse.data.map(apiWalkToWalkActivity);
          console.log('Converted activities:', convertedActivities);
          
          setActivities(convertedActivities);
          localStorage.setItem('walkActivities', JSON.stringify(convertedActivities));
          
          console.groupEnd();
          return;
        }
        
        console.log('No activities found in database');
      } else {
        console.warn('Unexpected API response structure:', apiResponse);
      }
      
      // Try localStorage fallback
      const savedActivities = localStorage.getItem('walkActivities');
      console.log('Checking localStorage for activities:', savedActivities ? 'Found' : 'Not found');
      
      if (savedActivities) {
        try {
          const parsed = JSON.parse(savedActivities);
          console.log('Parsed localStorage activities:', parsed);
          
          // Ensure we only use activities for this user
          const userActivities = Array.isArray(parsed) 
            ? parsed.filter(act => act.userId === formattedUserId)
            : [];
            
          console.log(`Found ${userActivities.length} activities for user in localStorage`);
          setActivities(userActivities);
        } catch (parseError) {
          console.error('Error parsing localStorage activities:', parseError);
        }
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
      logErrorDetails(err);
      setError('Failed to fetch activities');
      
      // Try localStorage fallback
      const savedActivities = localStorage.getItem('walkActivities');
      if (savedActivities) {
        try {
          const parsed = JSON.parse(savedActivities);
          const userActivities = Array.isArray(parsed)
            ? parsed.filter(act => act.userId === userId)
            : [];
          setActivities(userActivities);
        } catch (e) {
          console.error('Error parsing localStorage activities', e);
        }
      }
    } finally {
      console.groupEnd();
    }
  }, []);

  // Initialize data on component mount
  useEffect(() => {
    const initializeData = async () => {
      console.group('initializeData');
      setIsLoading(true);
      setError(null);
      
      try {
        // Ensure a user exists in the database
        const userId = await ensureUserExists();
        console.log('User exists with ID:', userId);
        
        if (userId) {
          // Try to fetch user from API
          try {
            const response = await userApi.getById(userId);
            
            if (response.success && response.data) {
              // Convert API user to our app's user profile format
              const profile = apiUserToUserProfile(response.data);
              setUserProfileState(profile);
              
              // Save to localStorage for persistent sessions
              localStorage.setItem('currentUserId', userId);
              localStorage.setItem('walkmateUserProfile', JSON.stringify(profile));
              
              // Now fetch user's activities
              await fetchActivitiesForUser(userId);
            } else {
              console.warn('No user data received from API or request unsuccessful', response);
              
              // If user not found on API but exists in localStorage, use localStorage data
              const savedProfile = localStorage.getItem('walkmateUserProfile');
              if (savedProfile) {
                try {
                  setUserProfileState(JSON.parse(savedProfile));
                } catch (e) {
                  console.error('Error parsing localStorage userProfile', e);
                }
              }
            }
          } catch (err) {
            console.error('Error fetching user:', err);
            logErrorDetails(err);
            
            // Fall back to localStorage data
            const savedProfile = localStorage.getItem('walkmateUserProfile');
            if (savedProfile) {
              try {
                setUserProfileState(JSON.parse(savedProfile));
              } catch (e) {
                console.error('Error parsing localStorage userProfile', e);
              }
            }
          }
        } else {
          // No user ID in localStorage, check if we have a profile
          const savedProfile = localStorage.getItem('walkmateUserProfile');
          if (savedProfile) {
            try {
              setUserProfileState(JSON.parse(savedProfile));
            } catch (e) {
              console.error('Error parsing localStorage userProfile', e);
            }
          }
        }
      } catch (err) {
        console.error('Error during initialization:', err);
        logErrorDetails(err);
        setError('Failed to initialize app data');
      } finally {
        setIsLoading(false);
        console.groupEnd();
      }
    };
    
    initializeData();
  }, [fetchActivitiesForUser]);

  // UPDATED: Enhanced activity creation with improved date handling and ID consistency
  const addActivity = useCallback(async (activity: Omit<WalkActivity, 'id' | 'userId'>) => {
    console.group('addActivity');
    console.log('Activity data:', activity);
    
    if (!userProfile?.id) {
      console.error('Cannot add activity: No user profile found');
      setError('Cannot add activity: No user profile found');
      console.groupEnd();
      return;
    }
    
    // CRITICAL: Ensure userId is in the exact same format
    const userId = userProfile.id.toString();
    
    setIsLoading(true);
    setError(null);
    
    try {
      // CRITICAL FIX: Manually extract the correct date from the timestamp
      // Parse the timestamp string to a Date object
      const activityStartTime = new Date(activity.timestamp);
      
      // Extract date components directly from this Date object
      const year = activityStartTime.getFullYear();
      const month = String(activityStartTime.getMonth() + 1).padStart(2, '0');
      const day = String(activityStartTime.getDate()).padStart(2, '0');
      
      // Create a properly formatted date string YYYY-MM-DD
      const activityDate = `${year}-${month}-${day}`;
      
      console.log('Activity timestamp:', activity.timestamp);
      console.log('Extracted date for activity:', activityDate);
      
      // Prepare activity data for API - keep using the timestamp for API
      const walkData = {
        userId: userId, // Explicitly use the string format
        steps: activity.steps,
        distance: activity.distance,
        duration: activity.duration,
        date: activity.timestamp // Keep using timestamp for the API
      };
      
      console.log('Sending to API:', walkData);
      
      // Add to localStorage immediately as a backup
      const tempId = `temp_${Date.now()}`;
      const tempActivity = {
        ...activity,
        id: tempId,
        userId: userId,
        date: activityDate
      } as WalkActivity;
      
      // Update state optimistically
      setActivities(prev => [...prev, tempActivity]);
      
      // Store in localStorage
      const updatedActivities = [...activities, tempActivity];
      localStorage.setItem('walkActivities', JSON.stringify(updatedActivities));
      
      // Now send to API
      const response = await walkApi.create(walkData);
      console.log('API create response:', response);
      
      if (response.success && response.data) {
        // Some APIs nest data within another 'data' property
        const responseData = response.data;
        
        // Replace the temp activity with the real one from server
        const serverActivity = {
          id: responseData.id.toString(),
          userId: responseData.userId.toString(),
          steps: responseData.steps,
          distance: responseData.distance,
          duration: responseData.duration,
          date: activityDate,
          timestamp: responseData.date
        } as WalkActivity;
        
        console.log('Replacing temp activity with server activity:', serverActivity);
        
        setActivities(prev => 
          prev.map(act => act.id === tempId ? serverActivity : act)
        );
        
        // Update localStorage
        const finalActivities = activities.map(act => 
          act.id === tempId ? serverActivity : act
        );
        localStorage.setItem('walkActivities', JSON.stringify(finalActivities));
      } else {
        console.warn('API error or unsuccessful response', response);
        setError(response.error || 'Failed to save activity to server');
        // Keep the temporary activity in place
      }
    } catch (err) {
      console.error('Error adding activity:', err);
      logErrorDetails(err);
      setError('Failed to add activity. Data saved locally only.');
      // The optimistic update remains in place
    } finally {
      setIsLoading(false);
      console.groupEnd();
    }
  }, [activities, userProfile]);

  // Function to create or update user profile - wrapped in useCallback
  const setUserProfile = useCallback(async (profile: ApiUserProfile) => {
    console.group('setUserProfile');
    setIsLoading(true);
    setError(null);
    
    try {
      let response;
      const userId = profile.id ? profile.id.toString() : null;
      
      if (userId) {
        // Update existing user
        console.log('Updating existing user:', userId);
        response = await userApi.update(userId, userProfileToApiUser(profile));
      } else {
        // Create new user
        console.log('Creating new user');
        response = await userApi.create({
          name: profile.name,
          goalType: profile.dailyGoal.type,
          goalValue: profile.dailyGoal.value
        });
      }
      
      console.log('User API response:', response);
      
      if (response.success && response.data) {
        // Convert API user to our format
        const updatedProfile = apiUserToUserProfile(response.data);
        setUserProfileState(updatedProfile);
        
        // Save user ID to localStorage for persistent sessions
        localStorage.setItem('currentUserId', response.data.id.toString());
        
        // Also save profile to localStorage as backup
        localStorage.setItem('walkmateUserProfile', JSON.stringify(updatedProfile));
        
        // If this is a new user, fetch their activities (which should be empty)
        if (!userId && response.data.id) {
          await fetchActivitiesForUser(response.data.id.toString());
        }
      } else {
        setError(response.error || 'Failed to update profile');
        console.warn('API error or unsuccessful response', response);
        
        // Fallback: Update in localStorage anyway
        const fallbackProfile = {
          ...profile,
          id: profile.id || Date.now().toString()
        };
        setUserProfileState(fallbackProfile);
        localStorage.setItem('walkmateUserProfile', JSON.stringify(fallbackProfile));
        
        // If this is a new user without an ID yet, generate one and save it
        if (!profile.id) {
          localStorage.setItem('currentUserId', fallbackProfile.id);
        }
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      logErrorDetails(err);
      setError('Failed to update profile. Please try again.');
      
      // Fallback: Update in localStorage anyway
      const fallbackProfile = {
        ...profile,
        id: profile.id || Date.now().toString()
      };
      setUserProfileState(fallbackProfile);
      localStorage.setItem('walkmateUserProfile', JSON.stringify(fallbackProfile));
      
      // If this is a new user without an ID yet, generate one and save it
      if (!profile.id) {
        localStorage.setItem('currentUserId', fallbackProfile.id);
      }
    } finally {
      setIsLoading(false);
      console.groupEnd();
    }
  }, [fetchActivitiesForUser]);

  // Function to fetch all activities - wrapped in useCallback
  const fetchActivities = useCallback(async () => {
    console.group('fetchActivities');
    
    if (!userProfile?.id) {
      // No user profile, can't fetch activities
      console.error('Cannot fetch activities: No user profile found');
      setError('Cannot fetch activities: No user profile found');
      console.groupEnd();
      return;
    }
    
    if (isLoading) {
      // Already loading, prevent duplicate requests
      console.log('Already loading, skipping duplicate request');
      console.groupEnd();
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await fetchActivitiesForUser(userProfile.id.toString());
    } catch (err) {
      console.error('Error fetching activities:', err);
      logErrorDetails(err);
      setError('Failed to fetch activities');
    } finally {
      setIsLoading(false);
      console.groupEnd();
    }
  }, [userProfile, isLoading, fetchActivitiesForUser]);
  
  // Debug function to help diagnose data associations
  const debugDataAssociations = async () => {
    console.group('DEBUG: Data Associations');
    const userId = localStorage.getItem('currentUserId');
    console.log('Current localStorage userId:', userId);
    
    if (userId) {
      try {
        // Get user from database
        const userResponse = await userApi.getById(userId);
        console.log('User in database:', userResponse);
        
        // Get activities with this userId
        const activitiesResponse = await walkApi.getAllForUser(userId);
        console.log('Activities for this user:', activitiesResponse);
        
        // CRITICAL: Check if any activities exist at all in the database
        try {
          // This depends on your API structure - you might need a different endpoint
          const response = await fetch('/api/walks');
          const allActivities = await response.json();
          console.log('All activities in database:', allActivities);
        } catch (e) {
          console.error('Error fetching all activities:', e);
        }
      } catch (e) {
        console.error('Error debugging data associations:', e);
      }
    }
    console.groupEnd();
  };

  // Provide the context value to children
  return (
    <WalkContext.Provider 
      value={{ 
        activities, 
        userProfile, 
        isLoading,
        error,
        addActivity, 
        setUserProfile,
        fetchActivities,
        debugDataAssociations
      }}
    >
      {children}
    </WalkContext.Provider>
  );
}

// Custom hook to use the context
export function useWalkContext() {
  return useContext(WalkContext);
}