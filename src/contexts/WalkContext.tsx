'use client';

import { createContext, useState, useContext, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { ApiUserProfile, WalkActivity, ApiUser, ApiWalk } from '@/types';
import { debounce } from 'lodash';

interface WalkContextType {
  activities: WalkActivity[];
  userProfile: ApiUserProfile | null;
  isLoading: boolean;
  error: string | null;
  addActivity: (activity: Omit<WalkActivity, 'id' | 'userId'>) => Promise<void>;
  setUserProfile: (profile: ApiUserProfile) => Promise<void>;
  fetchActivities: () => Promise<void>;
  resetApplication: () => void;
}

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

const apiUserToUserProfile = (apiUser: ApiUser): ApiUserProfile => {
  return {
    id: apiUser.id.toString(),
    name: apiUser.name,
    dailyGoal: {
      type: apiUser.goalType as 'steps' | 'distance',
      value: apiUser.goalValue
    }
  };
};

const apiWalkToWalkActivity = (apiWalk: ApiWalk): WalkActivity => {
  const walkDate = new Date(apiWalk.date);
  
  const year = walkDate.getFullYear();
  const month = String(walkDate.getMonth() + 1).padStart(2, '0');
  const day = String(walkDate.getDate()).padStart(2, '0');
  
  const dateStr = `${year}-${month}-${day}`;
  
  return {
    id: apiWalk.id.toString(),
    userId: apiWalk.userId.toString(),
    steps: apiWalk.steps,
    distance: apiWalk.distance,
    duration: apiWalk.duration,
    date: dateStr,
    timestamp: apiWalk.date
  };
};

interface ErrorWithResponse {
  response?: {
    status?: number;
    data?: unknown;
  };
  message?: string;
  code?: string;
}

export function WalkProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<WalkActivity[]>([]);
  const [userProfile, setUserProfileState] = useState<ApiUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const logError = (err: unknown): void => {
    if (!err || typeof err !== 'object') return;
    
    const error = err as ErrorWithResponse;
    console.group('Error Details');
    
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
    
    console.groupEnd();
  };


  const createAndStoreNewUser = useCallback(async (): Promise<string | null> => {
    console.group('createAndStoreNewUser');
    try {
      const existingProfile = localStorage.getItem('walkmateUserProfile');
      const profileData = existingProfile ? JSON.parse(existingProfile) : {
        name: 'Device User',
        goalType: 'steps',
        goalValue: 10000
      };

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileData.name,
          goalType: profileData.goalType,
          goalValue: profileData.goalValue
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create user: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data?.id) {
        throw new Error('API returned success but no user ID');
      }
      
      const userId = data.id.toString();
      
      const newProfile = {
        id: userId,
        name: data.name || profileData.name,
        dailyGoal: {
          type: data.goalType || profileData.goalType,
          value: data.goalValue || profileData.goalValue
        }
      };
      
      localStorage.setItem('currentUserId', userId);
      localStorage.setItem('walkmateUserProfile', JSON.stringify(newProfile));
      setUserProfileState(newProfile);
      
      return userId;
    } catch (error) {
      logError(error);
      console.error('Error creating new user:', error);
      return null;
    } finally {
      console.groupEnd();
    }
  }, []);

  const synchronizeUser = useCallback(async (): Promise<string | null> => {
    console.group('synchronizeUser');
    try {
      const storedUserId = localStorage.getItem('currentUserId');
      if (!storedUserId) {
        return await createAndStoreNewUser();
      }
      
      const response = await fetch(`/api/users?id=${storedUserId}`);
      if (response.ok) {
        const userData = await response.json();
        const profile = apiUserToUserProfile(userData);
        localStorage.setItem('walkmateUserProfile', JSON.stringify(profile));
        setUserProfileState(profile);
        return storedUserId;
      } 
      
      localStorage.removeItem('currentUserId');
      localStorage.removeItem('walkmateUserProfile');
      localStorage.removeItem('walkActivities');
      return await createAndStoreNewUser();
      
    } catch (error) {
      console.error('Error in synchronizeUser:', error);
      return await createAndStoreNewUser();
    } finally {
      console.groupEnd();
    }
  }, [createAndStoreNewUser]);

  const fetchActivitiesForUser = useCallback(async (userId: string) => {
    if (!userId) return;
    
    console.group(`fetchActivitiesForUser(${userId})`);
    try {
      const response = await fetch(`/api/walks?userId=${userId}`);
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }
      
      const responseData = await response.json();
      if (Array.isArray(responseData) && responseData.length > 0) {
        const convertedActivities = responseData.map(apiWalkToWalkActivity);
        setActivities(convertedActivities);
        localStorage.setItem('walkActivities', JSON.stringify(convertedActivities));
      } else {
        setActivities([]);
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
      
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

  const debouncedFetchActivities = useMemo(
    () => debounce((userId: string) => {
      console.log('Debounced fetch triggered for user:', userId);
      fetchActivitiesForUser(userId);
    }, 1000),
    [fetchActivitiesForUser]
  );

  useEffect(() => {
    return () => {
      debouncedFetchActivities.cancel();
    };
  }, [debouncedFetchActivities]);

  const addActivity = useCallback(async (activity: Omit<WalkActivity, 'id' | 'userId'>) => {
    console.group('addActivity');
    
    if (!userProfile?.id) {
      setError('Cannot add activity: No user profile found');
      console.groupEnd();
      return;
    }
    
    try {
      const tempId = `temp_${Date.now()}`;
      const tempActivity = {
        ...activity,
        id: tempId,
        userId: userProfile.id,
        date: activity.date
      } as WalkActivity;
      
      setActivities(prev => [...prev, tempActivity]);
      
      const response = await fetch('/api/walks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userProfile.id,
          steps: activity.steps,
          distance: activity.distance,
          duration: activity.duration,
          date: activity.timestamp
        })
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }
      
      const responseData = await response.json();
      const serverActivity = {
        id: responseData.id.toString(),
        userId: responseData.userId.toString(),
        steps: responseData.steps,
        distance: responseData.distance,
        duration: responseData.duration,
        date: activity.date,
        timestamp: responseData.date
      } as WalkActivity;
      
      setActivities(prev => 
        prev.map(act => act.id === tempId ? serverActivity : act)
      );
      
      debouncedFetchActivities(userProfile.id);
      
    } catch (err) {
      console.error('Error adding activity:', err);
      setError('Failed to add activity. Please try again.');
    } finally {
      console.groupEnd();
    }
  }, [userProfile, debouncedFetchActivities]);

  const setUserProfile = useCallback(async (profile: ApiUserProfile) => {
    console.group('setUserProfile');
    setIsLoading(true);
    
    try {
      const userId = profile.id?.toString();
      const method = userId ? 'PUT' : 'POST';
      const url = userId ? `/api/users?id=${userId}` : '/api/users';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          goalType: profile.dailyGoal.type,
          goalValue: profile.dailyGoal.value
        })
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }
      
      const userData = await response.json();
      const updatedProfile = {
        id: userData.id.toString(),
        name: userData.name,
        dailyGoal: {
          type: userData.goalType as 'steps' | 'distance',
          value: userData.goalValue
        }
      };
      
      setUserProfileState(updatedProfile);
      localStorage.setItem('currentUserId', userData.id.toString());
      localStorage.setItem('walkmateUserProfile', JSON.stringify(updatedProfile));
      
      if (!userId) {
        await fetchActivitiesForUser(userData.id.toString());
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
      console.groupEnd();
    }
  }, [fetchActivitiesForUser]);

  const fetchActivities = useCallback(async () => {
    if (!userProfile?.id || isLoading) return;
    
    console.group('fetchActivities');
    try {
      await fetchActivitiesForUser(userProfile.id);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Failed to fetch activities');
    } finally {
      console.groupEnd();
    }
  }, [userProfile, isLoading, fetchActivitiesForUser]);

  const resetApplication = useCallback(() => {
    localStorage.removeItem('currentUserId');
    localStorage.removeItem('walkmateUserProfile');
    localStorage.removeItem('walkActivities');
    localStorage.removeItem('walkmateSetupComplete');
    setUserProfileState(null);
    setActivities([]);
    setError(null);
    window.location.reload();
  }, []);

  useEffect(() => {
    const initializeData = async () => {
      console.group('initializeData');
      setIsLoading(true);
      
      try {
        const setupComplete = localStorage.getItem('walkmateSetupComplete') === 'true';
        if (!setupComplete) {
          setUserProfileState(null);
          setIsLoading(false);
          return;
        }
        
        const userId = await synchronizeUser();
        if (userId) {
          await fetchActivitiesForUser(userId);
        }
      } catch (err) {
        console.error('Error during initialization:', err);
        setError('Failed to initialize app data');
        setUserProfileState(null);
      } finally {
        setIsLoading(false);
        console.groupEnd();
      }
    };
    
    initializeData();
  }, [synchronizeUser, fetchActivitiesForUser]);

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
        resetApplication
      }}
    >
      {children}
    </WalkContext.Provider>
  );
}

export function useWalkContext() {
  return useContext(WalkContext);
}