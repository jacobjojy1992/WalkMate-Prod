'use client';

import { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { ApiUserProfile, WalkActivity, ApiUser, ApiWalk } from '@/types';
// Remove userApi import if not using it
// import { userApi } from '@/services/api';

// Define context type
interface WalkContextType {
  activities: WalkActivity[];
  userProfile: ApiUserProfile | null;
  isLoading: boolean;
  error: string | null;
  addActivity: (activity: Omit<WalkActivity, 'id' | 'userId'>) => Promise<void>;
  setUserProfile: (profile: ApiUserProfile) => Promise<void>;
  fetchActivities: () => Promise<void>;
  resetApplication: () => void;
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
  resetApplication: () => {},
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  /**
   * Create and store a new user
   * This function creates a new user in the database and stores it in localStorage
   * @returns The user ID (string) or null if creation failed
   */
  const createAndStoreNewUser = useCallback(async (): Promise<string | null> => {
    console.group('createAndStoreNewUser');
    try {
      console.log('Creating new user in database');
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Device User',
          goalType: 'steps',
          goalValue: 10000
        })
      });
      
      if (!response.ok) {
        console.error('Failed to create user:', response.status);
        return null;
      }
      
      const data = await response.json();
      console.log('User creation response:', data);
      
      if (!data || !data.id) {
        console.error('API returned success but no user ID!', data);
        return null;
      }
      
      const userId = data.id.toString();
      console.log('Created new user with ID:', userId);
      
      // Save to localStorage
      localStorage.setItem('currentUserId', userId);
      
      // Save the profile
      const newProfile = {
        id: userId,
        name: data.name || 'Device User',
        dailyGoal: {
          type: data.goalType || 'steps',
          value: data.goalValue || 10000
        }
      };
      
      localStorage.setItem('walkmateUserProfile', JSON.stringify(newProfile));
      setUserProfileState(newProfile);
      
      return userId;
    } catch (error) {
      console.error('Error creating new user:', error);
      return null;
    } finally {
      console.groupEnd();
    }
  }, []);

  /**
   * Synchronize user between localStorage and database
   * This function ensures that the user in localStorage exists in the database
   * If not, it creates a new user
   * @returns The user ID (string) or null if synchronization failed
   */
  const synchronizeUser = useCallback(async (): Promise<string | null> => {
    console.group('synchronizeUser');
    try {
      // Check if we have a userId in localStorage
      const storedUserId = localStorage.getItem('currentUserId');
      console.log('Stored user ID:', storedUserId);
      
      // If no stored ID, create a fresh user
      if (!storedUserId) {
        console.log('No user ID in localStorage, creating new user');
        const newUserId = await createAndStoreNewUser();
        console.groupEnd();
        return newUserId;
      }
      
      // Try to verify user exists in database
      try {
        console.log(`Verifying user ${storedUserId} exists in database`);
        const response = await fetch(`/api/users?id=${storedUserId}`);
        
        // If user exists, return ID
        if (response.ok) {
          const userData = await response.json();
          console.log('User exists in database:', userData);
          
          // Update localStorage with the latest user data
          const profile = apiUserToUserProfile(userData);
          localStorage.setItem('walkmateUserProfile', JSON.stringify(profile));
          setUserProfileState(profile);
          
          console.groupEnd();
          return storedUserId;
        } else {
          console.log('User not found in database, creating new user');
          
          // Clear localStorage before creating new user
          localStorage.removeItem('currentUserId');
          localStorage.removeItem('walkmateUserProfile');
          localStorage.removeItem('walkActivities');
          
          const newUserId = await createAndStoreNewUser();
          console.groupEnd();
          return newUserId;
        }
      } catch (error) {
        console.error('Error verifying user:', error);
        
        // If verification fails, create a new user
        localStorage.removeItem('currentUserId');
        localStorage.removeItem('walkmateUserProfile');
        
        const newUserId = await createAndStoreNewUser();
        console.groupEnd();
        return newUserId;
      }
    } catch (error) {
      console.error('Unexpected error in synchronizeUser:', error);
      console.groupEnd();
      return null;
    }
  }, [createAndStoreNewUser]);

  // Function to fetch activities for a specific user - wrapped in useCallback
  const fetchActivitiesForUser = useCallback(async (userId: string) => {
    console.group(`fetchActivitiesForUser(${userId})`);
    console.log('Fetching activities for user ID:', userId);
    
    if (!userId) {
      console.error('Cannot fetch activities: No userId provided');
      console.groupEnd();
      return;
    }
    
    try {
      // Ensure userId is in string format
      const formattedUserId = userId.toString();
      
      console.log('Making API request to get activities with URL parameter');
      // Direct fetch with userId as a query parameter
      const response = await fetch(`/api/walks?userId=${formattedUserId}`);
      
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }
      
      const responseData = await response.json();
      console.log('API response:', responseData);
      
      // Check if we got a valid array of activities
      if (Array.isArray(responseData)) {
        console.log(`Found ${responseData.length} activities in database`);
        
        if (responseData.length > 0) {
          const convertedActivities = responseData.map(apiWalkToWalkActivity);
          console.log('Converted activities:', convertedActivities);
          
          setActivities(convertedActivities);
          localStorage.setItem('walkActivities', JSON.stringify(convertedActivities));
          
          console.groupEnd();
          return;
        }
        
        console.log('No activities found in database');
        setActivities([]);
      } else {
        console.warn('Unexpected API response structure:', responseData);
        // If response is not an array, check if it's nested
        if (responseData.data && Array.isArray(responseData.data)) {
          const data = responseData.data;
          console.log(`Found ${data.length} activities in nested data`);
          
          if (data.length > 0) {
            const convertedActivities = data.map(apiWalkToWalkActivity);
            setActivities(convertedActivities);
            localStorage.setItem('walkActivities', JSON.stringify(convertedActivities));
            
            console.groupEnd();
            return;
          }
        }
        
        // If we get here, we didn't find any activities
        setActivities([]);
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
          setActivities([]);
        }
      } else {
        setActivities([]);
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
      logErrorDetails(err);
      setError('Failed to fetch activities');
      setActivities([]);
      
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
          setActivities([]);
        }
      }
    } finally {
      console.groupEnd();
    }
  }, []);

  // Reset application state and localStorage
  const resetApplication = useCallback(() => {
    console.log('Resetting application state and localStorage');
    
    // Clear localStorage
    localStorage.removeItem('currentUserId');
    localStorage.removeItem('walkmateUserProfile');
    localStorage.removeItem('walkActivities');
    
    // Reset state
    setUserProfileState(null);
    setActivities([]);
    setError(null);
    
    // Force page reload to restart application
    window.location.reload();
  }, []);

  useEffect(() => {
    const initializeData = async () => {
      console.group('initializeData');
      setIsLoading(true);
      setError(null);
      
      try {
        // Check if we've completed onboarding before
        const setupComplete = localStorage.getItem('walkmateSetupComplete') === 'true';
        
        if (!setupComplete) {
          // If onboarding not complete, don't auto-create user
          console.log('Onboarding not completed, waiting for user input');
          setIsLoading(false);
          console.groupEnd();
          return;
        }
        
        // Onboarding is complete, proceed with normal initialization
        const userId = await synchronizeUser();
        console.log('Synchronized user with ID:', userId);
        
        if (userId) {
          // Now fetch user's activities
          await fetchActivitiesForUser(userId);
        } else {
          console.error('Failed to synchronize user');
          setError('Failed to initialize user data');
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
  }, [synchronizeUser, fetchActivitiesForUser]); // Add synchronizeUser as dependency

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
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Ensure user exists and is synchronized
      const userId = await synchronizeUser();
      
      if (!userId) {
        console.error('Failed to synchronize user before adding activity');
        setError('Failed to verify user account');
        console.groupEnd();
        return;
      }
      
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
      
      // Prepare activity data for API - keep using the timestamp for API
      const walkData = {
        userId: userId, // Use the synchronized userId
        steps: activity.steps,
        distance: activity.distance,
        duration: activity.duration,
        date: activity.timestamp // Keep using timestamp for the API
      };
      
      console.log('Sending to API:', walkData);
      
      // Now send to API
      const response = await fetch('/api/walks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(walkData)
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }
      
      const responseData = await response.json();
      console.log('API create response:', responseData);
      
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
    } catch (err) {
      console.error('Error adding activity:', err);
      logErrorDetails(err);
      setError('Failed to add activity. Data saved locally only.');
      // The optimistic update remains in place
    } finally {
      setIsLoading(false);
      console.groupEnd();
    }
  }, [activities, userProfile, synchronizeUser]);

  // Function to set user profile
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
        const updateResponse = await fetch(`/api/users?id=${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: profile.name,
            goalType: profile.dailyGoal.type,
            goalValue: profile.dailyGoal.value
          })
        });
        
        if (!updateResponse.ok) {
          throw new Error(`API responded with status ${updateResponse.status}`);
        }
        
        response = await updateResponse.json();
      } else {
        // Create new user
        console.log('Creating new user');
        const createResponse = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: profile.name,
            goalType: profile.dailyGoal.type,
            goalValue: profile.dailyGoal.value
          })
        });
        
        if (!createResponse.ok) {
          throw new Error(`API responded with status ${createResponse.status}`);
        }
        
        response = await createResponse.json();
      }
      
      console.log('User API response:', response);
      
      // Convert API user to our format
      const updatedProfile = {
        id: response.id.toString(),
        name: response.name,
        dailyGoal: {
          type: response.goalType as 'steps' | 'distance',
          value: response.goalValue
        }
      };
      
      setUserProfileState(updatedProfile);
      
      // Save user ID to localStorage for persistent sessions
      localStorage.setItem('currentUserId', response.id.toString());
      
      // Also save profile to localStorage as backup
      localStorage.setItem('walkmateUserProfile', JSON.stringify(updatedProfile));
      
      // If this is a new user, fetch their activities (which should be empty)
      if (!userId && response.id) {
        await fetchActivitiesForUser(response.id.toString());
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

  // Function to fetch all activities
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
    
    // Ensure user is synchronized before fetching
    const userId = await synchronizeUser();
    
    if (!userId) {
      console.error('Failed to synchronize user before fetching activities');
      setError('Failed to verify user account');
      setIsLoading(false);
      console.groupEnd();
      return;
    }
    
    try {
      await fetchActivitiesForUser(userId);
    } catch (err) {
      console.error('Error fetching activities:', err);
      logErrorDetails(err);
      setError('Failed to fetch activities');
    } finally {
      setIsLoading(false);
      console.groupEnd();
    }
  }, [userProfile, isLoading, fetchActivitiesForUser, synchronizeUser]);
  
  // Debug function to help diagnose data associations
  const debugDataAssociations = useCallback(async () => {
    console.group('DEBUG: Data Associations');
    const userId = localStorage.getItem('currentUserId');
    console.log('Current localStorage userId:', userId);
    
    if (userId) {
      try {
        // Get user from database
        const userResponse = await fetch(`/api/users?id=${userId}`);
        const userData = await userResponse.json();
        console.log('User in database:', userData);
        
        // Get activities with this userId
        const activitiesResponse = await fetch(`/api/walks?userId=${userId}`);
        if (activitiesResponse.ok) {
          const activitiesData = await activitiesResponse.json();
          console.log('Activities for this user:', activitiesData);
        } else {
          console.error('Failed to fetch activities:', activitiesResponse.status);
        }
        
        // Get all activities in database
        const allActivitiesResponse = await fetch('/api/walks');
        if (allActivitiesResponse.ok) {
          const allActivities = await allActivitiesResponse.json();
          console.log('All activities in database:', allActivities);
        } else {
          console.error('Failed to fetch all activities:', allActivitiesResponse.status);
        }
      } catch (e) {
        console.error('Error debugging data associations:', e);
      }
    }
    console.groupEnd();
  }, []);

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
        resetApplication,
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