// src/contexts/WalkContext.tsx
'use client';

import { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { UserProfile, WalkActivity, ApiUser, ApiWalk, ApiResponse } from '@/types';
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
      const response = await walkApi.getAllForUser(userId) as ApiResponse<ApiWalk[]>;
      
      if (response.success && response.data) {
        // Make sure response.data is always an array
        const walkData = Array.isArray(response.data) ? response.data : [];
        // Convert API walks to our app's activity format
        const convertedActivities = walkData.map(apiWalkToWalkActivity);
        setActivities(convertedActivities);
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Failed to fetch activities');
      
      // Fall back to localStorage data
      const savedActivities = localStorage.getItem('walkActivities');
      if (savedActivities) {
        setActivities(JSON.parse(savedActivities));
      }
    }
  }, []);

  // Initialize data on component mount
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      
      try {
        // Try to get user ID from localStorage
        const userId = localStorage.getItem('currentUserId');
        
        if (userId) {
          // Try to fetch user from API
          try {
            const response = await userApi.getById(userId) as ApiResponse<ApiUser>;
            
            if (response.success && response.data) {
              // Convert API user to our app's user profile format
              const profile = apiUserToUserProfile(response.data);
              setUserProfileState(profile);
              
              // Now fetch user's activities
              await fetchActivitiesForUser(userId);
            } else {
              // If user not found on API but exists in localStorage, use localStorage data
              const savedProfile = localStorage.getItem('userProfile');
              if (savedProfile) {
                setUserProfileState(JSON.parse(savedProfile));
              }
            }
          } catch (err) {
            console.error('Error fetching user:', err);
            // Fall back to localStorage data
            const savedProfile = localStorage.getItem('userProfile');
            if (savedProfile) {
              setUserProfileState(JSON.parse(savedProfile));
            }
          }
        } else {
          // No user ID in localStorage, check if we have a profile
          const savedProfile = localStorage.getItem('userProfile');
          if (savedProfile) {
            setUserProfileState(JSON.parse(savedProfile));
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
    
    try {
      // Prepare activity data for API
      const walkData = {
        userId: userProfile.id,
        steps: activity.steps,
        distance: activity.distance,
        duration: activity.duration,
        date: activity.timestamp // Use timestamp as the full date with time
      };
      
      // Send to API
      const response = await walkApi.create(walkData) as ApiResponse<ApiWalk>;
      
      if (response.success && response.data) {
        // Convert API response to our format and add to state
        const newActivity = apiWalkToWalkActivity(response.data);
        setActivities(prev => [...prev, newActivity]);
        
        // Also update localStorage as a backup
        localStorage.setItem('walkActivities', JSON.stringify([...activities, newActivity]));
      } else {
        setError('Failed to add activity');
      }
    } catch (err) {
      console.error('Error adding activity:', err);
      setError('Failed to add activity. Please try again.');
      
      // Fallback: Add to localStorage anyway
      const newActivity = {
        ...activity,
        id: Date.now().toString(),
        userId: userProfile.id
      } as WalkActivity; // Add type assertion here
      
      setActivities(prev => [...prev, newActivity]);
      localStorage.setItem('walkActivities', JSON.stringify([...activities, newActivity]));
    } finally {
      setIsLoading(false);
    }
  }, [activities, userProfile]);

  // Function to create or update user profile - wrapped in useCallback
  const setUserProfile = useCallback(async (profile: UserProfile) => {
    setIsLoading(true);
    
    try {
      let response;
      const userId = profile.id;
      
      if (userId) {
        // Update existing user
        response = await userApi.update(userId, userProfileToApiUser(profile)) as ApiResponse<ApiUser>;
      } else {
        // Create new user
        response = await userApi.create({
          name: profile.name,
          goalType: profile.dailyGoal.type,
          goalValue: profile.dailyGoal.value
        }) as ApiResponse<ApiUser>;
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
        setError('Failed to update profile');
        
        // Fallback: Update in localStorage anyway
        setUserProfileState(profile);
        localStorage.setItem('userProfile', JSON.stringify(profile));
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
      
      // Fallback: Update in localStorage anyway
      setUserProfileState(profile);
      localStorage.setItem('userProfile', JSON.stringify(profile));
    } finally {
      setIsLoading(false);
    }
  }, [fetchActivitiesForUser]);

  // Function to fetch all activities - wrapped in useCallback
  const fetchActivities = useCallback(async () => {
    if (!userProfile?.id || isLoading) {
      // No user profile or already loading, can't fetch activities
      return;
    }
    
    setIsLoading(true);
    
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