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

  // Function to ensure a user exists in the database
  const ensureUserExists = async () => {
    // Check if we've completed first-time setup
    const setupComplete = localStorage.getItem('walkmateSetupComplete');
    
    if (!setupComplete) {
      try {
        // Create a new user
        const createResponse = await userApi.create({
          name: 'Device User',
          goalType: 'steps',
          goalValue: 10000
        });
        
        if (createResponse.success && createResponse.data) {
          // Save the user ID to localStorage
          const userId = createResponse.data.id;
          localStorage.setItem('currentUserId', userId);
          
          // Convert and save profile
          const profile = apiUserToUserProfile(createResponse.data);
          localStorage.setItem('walkmateUserProfile', JSON.stringify(profile));
          
          // Mark setup as complete
          localStorage.setItem('walkmateSetupComplete', 'true');
          
          console.log('First-time setup complete, created user:', userId);
          return userId;
        }
      } catch (error) {
        console.error('Error during first-time setup:', error);
      }
    }
    
    // Return existing user ID if setup already complete
    return localStorage.getItem('currentUserId');
  };

  // Function to fetch activities for a specific user - wrapped in useCallback
  const fetchActivitiesForUser = useCallback(async (userId: string) => {
    try {
      const response = await walkApi.getAllForUser(userId);
      
      if (response.success && response.data && response.data.length > 0) {
        // Convert API walks to our app's activity format
        const convertedActivities = response.data.map(apiWalkToWalkActivity);
        setActivities(convertedActivities);
        
        // Also update localStorage with the latest data
        localStorage.setItem('walkActivities', JSON.stringify(convertedActivities));
      } else {
        console.warn('No activities data received from API', response);
        
        // Try to use localStorage data
        const savedActivities = localStorage.getItem('walkActivities');
        if (savedActivities) {
          try {
            const localActivities = JSON.parse(savedActivities);
            // Filter for just this user's activities
            const userActivities = localActivities.filter((act: WalkActivity) => act.userId === userId);
            setActivities(userActivities);
          } catch (e) {
            console.error('Error parsing localStorage activities', e);
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
          const localActivities = JSON.parse(savedActivities);
          // Filter for just this user's activities
          const userActivities = localActivities.filter((act: WalkActivity) => act.userId === userId);
          setActivities(userActivities);
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
        // Ensure a user exists in the database
        const userId = await ensureUserExists();
        
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
      
      // Prepare activity data for API - keep using the timestamp for API
      const walkData = {
        userId: userProfile.id,
        steps: activity.steps,
        distance: activity.distance,
        duration: activity.duration,
        date: activity.timestamp // Keep using timestamp for the API
      };
      
      // Create a modified activity with the forced date
      const modifiedActivity = {
        ...activity,
        date: activityDate // Force the correct date string
      };
      
      // Send to API
      const response = await walkApi.create(walkData);
      console.log('API create response:', response); // Log the entire response
      console.log('Response success:', response.success);
      console.log('Response data exists:', !!response.data);
      
      if (response.success && response.data) {
        // Use our custom conversion with proper date handling instead of apiWalkToWalkActivity
        const newActivity = {
          id: response.data.id,
          userId: response.data.userId,
          steps: response.data.steps,
          distance: response.data.distance,
          duration: response.data.duration,
          date: activityDate, // Use our carefully extracted date
          timestamp: response.data.date // Keep the API's timestamp
        } as WalkActivity;
        
        console.log('Adding activity with date:', activityDate);
        
        setActivities(prev => [...prev, newActivity]);
        
        // Also update localStorage as a backup
        const updatedActivities = [...activities, newActivity];
        localStorage.setItem('walkActivities', JSON.stringify(updatedActivities));
      } else {
        setError(response.error || 'Failed to add activity');
        
        // Fallback: Add to localStorage anyway
        const newActivity = {
          ...modifiedActivity, // Use the modified activity with corrected date
          id: Date.now().toString(),
          userId: userProfile.id
        } as WalkActivity;
        
        setActivities(prev => [...prev, newActivity]);
        
        const updatedActivities = [...activities, newActivity];
        localStorage.setItem('walkActivities', JSON.stringify(updatedActivities));
      }
    } catch (err) {
      console.error('Error adding activity:', err);
      setError('Failed to add activity. Please try again.');
      
      // Extract date again for the fallback
      const fallbackDate = new Date(activity.timestamp);
      const fallbackYear = fallbackDate.getFullYear();
      const fallbackMonth = String(fallbackDate.getMonth() + 1).padStart(2, '0');
      const fallbackDay = String(fallbackDate.getDate()).padStart(2, '0');
      const fallbackDateStr = `${fallbackYear}-${fallbackMonth}-${fallbackDay}`;
      
      // Fallback: Add to localStorage anyway
      const newActivity = {
        ...activity,
        id: Date.now().toString(),
        userId: userProfile.id,
        date: fallbackDateStr // Ensure the date is correct even in fallback
      } as WalkActivity;
      
      setActivities(prev => [...prev, newActivity]);
      
      const updatedActivities = [...activities, newActivity];
      localStorage.setItem('walkActivities', JSON.stringify(updatedActivities));
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
        // Create new user
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
        
        // Save user ID to localStorage for persistent sessions
        localStorage.setItem('currentUserId', response.data.id);
        
        // Also save profile to localStorage as backup
        localStorage.setItem('walkmateUserProfile', JSON.stringify(updatedProfile));
        
        // If this is a new user, fetch their activities (which should be empty)
        if (!userId && response.data.id) {
          await fetchActivitiesForUser(response.data.id);
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