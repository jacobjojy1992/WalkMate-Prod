'use client';

import { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { ApiUserProfile, WalkActivity, ApiUser, ApiWalk } from '@/types';
import { userApi, walkApi } from '@/services/api';
import { getOrCreateDeviceId, getUserProfileFromLocalStorage, saveUserProfileToLocalStorage } from '@/utils/deviceStorage';

// Define context type
interface WalkContextType {
  activities: WalkActivity[];
  userProfile: ApiUserProfile | null;
  isLoading: boolean;
  error: string | null;
  addActivity: (activity: Omit<WalkActivity, 'id' | 'userId'>) => Promise<void>;
  setUserProfile: (profile: ApiUserProfile) => Promise<void>;
  fetchActivities: () => Promise<void>;
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
    id: apiUser.id,
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
    id: apiWalk.id,
    userId: apiWalk.userId,
    steps: apiWalk.steps,
    distance: apiWalk.distance,
    duration: apiWalk.duration,
    date: dateStr, // Use the carefully constructed date string
    timestamp: apiWalk.date // Keep the full ISO string for timestamp
  };
};

// Provider component
export function WalkProvider({ children }: { children: ReactNode }) {
  // State
  const [activities, setActivities] = useState<WalkActivity[]>([]);
  const [userProfile, setUserProfileState] = useState<ApiUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch activities for a specific user - wrapped in useCallback
  const fetchActivitiesForUser = useCallback(async (userId: string) => {
    try {
      const response = await walkApi.getAllForUser(userId);
      
      if (response.success && response.data) {
        // Convert API walks to our app's activity format
        const convertedActivities = response.data.map(apiWalkToWalkActivity);
        setActivities(convertedActivities);
      } else {
        console.warn('No activities data received from API', response);
        // If API response indicates failure but doesn't throw, handle it here
        if (!response.success) {
          setError(response.error || 'Failed to fetch activities');
          
          // Fall back to localStorage data
          const savedActivities = localStorage.getItem('walkActivities');
          if (savedActivities) {
            try {
              setActivities(JSON.parse(savedActivities));
            } catch (e) {
              console.error('Error parsing localStorage activities', e);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Failed to fetch activities');
      
      // Fall back to localStorage data
      const savedActivities = localStorage.getItem('walkActivities');
      if (savedActivities) {
        try {
          setActivities(JSON.parse(savedActivities));
        } catch (e) {
          console.error('Error parsing localStorage activities', e);
        }
      }
    }
  }, []);

  // Initialize data on component mount
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get device ID first
        const deviceId = getOrCreateDeviceId();
        
        try {
          // Try to fetch user with this device ID
          const response = await userApi.getById(deviceId);
          
          if (response.success && response.data) {
            // User exists in database - use it
            const profile = apiUserToUserProfile(response.data);
            setUserProfileState(profile);
            saveUserProfileToLocalStorage(profile);
            
            // Now fetch user's activities
            await fetchActivitiesForUser(deviceId);
          } else {
            console.warn('No user data received from API or request unsuccessful', response);
            
            // User not found in API, check if we have a profile in localStorage
            const savedProfile = getUserProfileFromLocalStorage();
            
            if (savedProfile) {
              // Try to create a new user (without specifying ID - let server generate it)
              try {
                const createResponse = await userApi.create({
                  name: savedProfile.name || 'Device User',
                  goalType: savedProfile.dailyGoal.type,
                  goalValue: savedProfile.dailyGoal.value
                });
                
                if (createResponse.success && createResponse.data) {
                  // User created successfully - use server-generated ID
                  const newProfile = apiUserToUserProfile(createResponse.data);
                  
                  // Update our device ID to match the new server-generated ID
                  // Make sure we have an ID before using it
                  if (newProfile.id) {
                    localStorage.setItem('currentUserId', newProfile.id);
                  }
                  
                  setUserProfileState(newProfile);
                  saveUserProfileToLocalStorage(newProfile);
                  
                  // Fetch activities for the new user (should be empty)
                  // Make sure we have an ID before attempting to fetch
                  if (newProfile.id) {
                    await fetchActivitiesForUser(newProfile.id);
                  }
                } else {
                  // Fallback to using local profile if API fails
                  setUserProfileState(savedProfile);
                }
              } catch (createError) {
                console.error('Error creating user:', createError);
                setUserProfileState(savedProfile);
              }
            } else {
              // No saved profile, we'll show onboarding later
              console.log('No user profile found, will show onboarding');
            }
          }
        } catch (err) {
          console.error('Error fetching user:', err);
          
          // Fall back to localStorage data
          const savedProfile = getUserProfileFromLocalStorage();
          if (savedProfile) {
            setUserProfileState(savedProfile);
            
            // Try to load cached activities
            const savedActivities = localStorage.getItem('walkActivities');
            if (savedActivities) {
              try {
                setActivities(JSON.parse(savedActivities));
              } catch (e) {
                console.error('Error parsing localStorage activities', e);
              }
            }
          }
        }
      } catch (err) {
        console.error('Error during initialization:', err);
        setError('Failed to initialize app data');
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeData();
  }, [fetchActivitiesForUser]);

  // UPDATED: Enhanced activity creation with improved date handling
  const addActivity = useCallback(async (activity: Omit<WalkActivity, 'id' | 'userId'>) => {
    if (!userProfile?.id) {
      setError('Cannot add activity: No user profile found');
      return;
    }
    
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
      
      // Create a local version of the activity first
      const localActivity: WalkActivity = {
        id: 'local_' + Date.now(),
        userId: userProfile.id,
        steps: activity.steps,
        distance: activity.distance,
        duration: activity.duration,
        date: activityDate,
        timestamp: activity.timestamp
      };
      
      // Add to local state immediately
      const updatedActivities = [...activities, localActivity];
      setActivities(updatedActivities);
      
      // Save to localStorage
      localStorage.setItem('walkActivities', JSON.stringify(updatedActivities));
      
      // Prepare activity data for API - keep using the timestamp for API
      const walkData = {
        userId: userProfile.id,
        steps: activity.steps,
        distance: activity.distance,
        duration: activity.duration,
        date: activity.timestamp // Keep using timestamp for the API
      };
      
      // Send to API
      const response = await walkApi.create(walkData);
      console.log('API create response:', response); // Log the entire response
      console.log('Response success:', response.success);
      console.log('Response data exists:', !!response.data);
      
      if (response.success && response.data) {
        // Use our custom conversion with proper date handling instead of apiWalkToWalkActivity
        const serverActivity = {
          id: response.data.id,
          userId: response.data.userId,
          steps: response.data.steps,
          distance: response.data.distance,
          duration: response.data.duration,
          date: activityDate, // Use our carefully extracted date
          timestamp: response.data.date // Keep the API's timestamp
        } as WalkActivity;
        
        console.log('Adding activity with date:', activityDate);
        
        // Replace the temporary activity with the server version
        const finalActivities = activities.map(act => 
          act.id === localActivity.id ? serverActivity : act
        );
        
        setActivities(finalActivities);
        localStorage.setItem('walkActivities', JSON.stringify(finalActivities));
      } else {
        setError(response.error || 'Failed to add activity');
        // Activity is already saved locally, so no need for additional fallback
      }
    } catch (err) {
      console.error('Error adding activity:', err);
      setError('Failed to add activity. Please try again.');
      // Activity is already saved locally, so no need for additional fallback
    } finally {
      setIsLoading(false);
    }
  }, [activities, userProfile]);

  // Function to create or update user profile - wrapped in useCallback
  const setUserProfile = useCallback(async (profile: ApiUserProfile) => {
    setIsLoading(true);
    setError(null);
    
    try {
      let response;
      const userId = profile.id;
      
      if (userId) {
        // Update existing user
        response = await userApi.update(userId, userProfileToApiUser(profile));
      } else {
        // Create new user (without specifying ID - let server generate it)
        response = await userApi.create({
          name: profile.name,
          goalType: profile.dailyGoal.type,
          goalValue: profile.dailyGoal.value
        });
      }
      
      if (response.success && response.data) {
        // Convert API user to our format
        const updatedProfile = apiUserToUserProfile(response.data);
        setUserProfileState(updatedProfile);
        
        // Save user profile to localStorage
        saveUserProfileToLocalStorage(updatedProfile);
        
        // If this is a new user, fetch their activities (which should be empty)
        if (!userId && updatedProfile.id) {
          await fetchActivitiesForUser(updatedProfile.id);
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
        saveUserProfileToLocalStorage(fallbackProfile);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
      
      // Fallback: Update in localStorage anyway
      const fallbackProfile = {
        ...profile,
        id: profile.id || Date.now().toString()
      };
      setUserProfileState(fallbackProfile);
      saveUserProfileToLocalStorage(fallbackProfile);
    } finally {
      setIsLoading(false);
    }
  }, [fetchActivitiesForUser]);

  // Function to fetch all activities - wrapped in useCallback
  const fetchActivities = useCallback(async () => {
    if (!userProfile?.id) {
      // No user profile, can't fetch activities
      setError('Cannot fetch activities: No user profile found');
      return;
    }
    
    if (isLoading) {
      // Already loading, prevent duplicate requests
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await fetchActivitiesForUser(userProfile.id);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Failed to fetch activities');
    } finally {
      setIsLoading(false);
    }
  }, [userProfile, isLoading, fetchActivitiesForUser]);

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
        fetchActivities
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