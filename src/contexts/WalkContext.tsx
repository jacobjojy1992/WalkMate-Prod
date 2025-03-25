// src/contexts/WalkContext.tsx
'use client';

import { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { UserProfile, WalkActivity, ApiUser, ApiWalk } from '@/types';
import { userApi, walkApi } from '@/services/api';

// Define context type
interface WalkContextType {
  activities: WalkActivity[];
  userProfile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  addActivity: (activity: Omit<WalkActivity, 'id' | 'userId'>) => Promise<void>;
  setUserProfile: (profile: UserProfile) => Promise<void>;
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
const apiUserToUserProfile = (apiUser: ApiUser): UserProfile => {
  return {
    id: apiUser.id,
    name: apiUser.name,
    dailyGoal: {
      type: apiUser.goalType as 'steps' | 'distance',
      value: apiUser.goalValue
    }
  };
};

const userProfileToApiUser = (profile: UserProfile): Partial<ApiUser> => {
  return {
    name: profile.name,
    goalType: profile.dailyGoal.type,
    goalValue: profile.dailyGoal.value
  };
};

const apiWalkToWalkActivity = (apiWalk: ApiWalk): WalkActivity => {
  return {
    id: apiWalk.id,
    userId: apiWalk.userId,
    steps: apiWalk.steps,
    distance: apiWalk.distance,
    duration: apiWalk.duration,
    date: apiWalk.date.split('T')[0], // Get just the date part
    timestamp: apiWalk.date  // Use the full ISO string for timestamp
  };
};

// Provider component
export function WalkProvider({ children }: { children: ReactNode }) {
  // State
  const [activities, setActivities] = useState<WalkActivity[]>([]);
  const [userProfile, setUserProfileState] = useState<UserProfile | null>(null);
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
        // Try to get user ID from localStorage
        const userId = localStorage.getItem('currentUserId');
        
        if (userId) {
          // Try to fetch user from API
          try {
            const response = await userApi.getById(userId);
            
            if (response.success && response.data) {
              // Convert API user to our app's user profile format
              const profile = apiUserToUserProfile(response.data);
              setUserProfileState(profile);
              
              // Now fetch user's activities
              await fetchActivitiesForUser(userId);
            } else {
              console.warn('No user data received from API or request unsuccessful', response);
              // If user not found on API but exists in localStorage, use localStorage data
              const savedProfile = localStorage.getItem('userProfile');
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
            const savedProfile = localStorage.getItem('userProfile');
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
          const savedProfile = localStorage.getItem('userProfile');
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

// Function to add a new activity - wrapped in useCallback
const addActivity = useCallback(async (activity: Omit<WalkActivity, 'id' | 'userId'>) => {
  if (!userProfile?.id) {
    setError('Cannot add activity: No user profile found');
    return;
  }
  
  setIsLoading(true);
  setError(null);
  
  try {
    // Parse the timestamp to ensure we're using the correct date
    const activityDateTime = new Date(activity.timestamp);
    console.log('Activity timestamp:', activity.timestamp);
    console.log('Parsed activity date:', activityDateTime.toISOString());
    
    // Prepare activity data for API - use the full ISO string from the timestamp
    const walkData = {
      userId: userProfile.id,
      steps: activity.steps,
      distance: activity.distance,
      duration: activity.duration,
      date: activityDateTime.toISOString() // Ensure proper ISO format
    };
    
    // Send to API
    const response = await walkApi.create(walkData);
    
    if (response.success && response.data) {
      // Convert API response to our format and add to state
      const newActivity = apiWalkToWalkActivity(response.data);
      
      // Log for debugging
      console.log('API returned activity with date:', response.data.date);
      console.log('Converted to frontend activity with date:', newActivity.date);
      
      setActivities(prev => [...prev, newActivity]);
      
      // Also update localStorage as a backup
      localStorage.setItem('walkActivities', JSON.stringify([...activities, newActivity]));
    } else {
      setError(response.error || 'Failed to add activity');
      
      // Fallback: Add to localStorage anyway
      const newActivity = {
        ...activity,
        id: Date.now().toString(),
        userId: userProfile.id
      } as WalkActivity;
      
      setActivities(prev => [...prev, newActivity]);
      localStorage.setItem('walkActivities', JSON.stringify([...activities, newActivity]));
    }
  } catch (err) {
    console.error('Error adding activity:', err);
    setError('Failed to add activity. Please try again.');
    
    // Fallback: Add to localStorage anyway
    const newActivity = {
      ...activity,
      id: Date.now().toString(),
      userId: userProfile.id
    } as WalkActivity;
    
    setActivities(prev => [...prev, newActivity]);
    localStorage.setItem('walkActivities', JSON.stringify([...activities, newActivity]));
  } finally {
    setIsLoading(false);
  }
}, [activities, userProfile]);

  // Function to create or update user profile - wrapped in useCallback
  const setUserProfile = useCallback(async (profile: UserProfile) => {
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
        localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
        
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
        localStorage.setItem('userProfile', JSON.stringify(fallbackProfile));
        
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
      localStorage.setItem('userProfile', JSON.stringify(fallbackProfile));
      
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