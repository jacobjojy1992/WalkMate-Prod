'use client';

import { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { ApiUserProfile, WalkActivity, ApiUser, ApiWalk } from '@/types';

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
  debugDataAssociations?: () => Promise<void>;
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
  
  console.log('Converting API walk date:', apiWalk.date);
  console.log('To activity date:', dateStr);
  
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

// Define error type
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
  const [activities, setActivities] = useState<WalkActivity[]>([]);
  const [userProfile, setUserProfileState] = useState<ApiUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);

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

  const createAndStoreNewUser = useCallback(async (): Promise<string | null> => {
    console.group('createAndStoreNewUser');
    try {
      // Get existing profile from localStorage first
      const existingProfile = localStorage.getItem('walkmateUserProfile');
      const profileData = existingProfile ? JSON.parse(existingProfile) : {
        name: 'Device User',
        goalType: 'steps',
        goalValue: 10000
      };

      console.log('Creating new user with profile:', profileData);
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
      
      localStorage.setItem('currentUserId', userId);
      
      const newProfile = {
        id: userId,
        name: data.name || profileData.name,
        dailyGoal: {
          type: data.goalType || profileData.goalType,
          value: data.goalValue || profileData.goalValue
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

  const synchronizeUser = useCallback(async (): Promise<string | null> => {
    console.group('synchronizeUser');
    try {
      const storedUserId = localStorage.getItem('currentUserId');
      console.log('Stored user ID:', storedUserId);
      
      if (!storedUserId) {
        console.log('No user ID in localStorage, creating new user');
        const newUserId = await createAndStoreNewUser();
        console.groupEnd();
        return newUserId;
      }
      
      try {
        console.log(`Verifying user ${storedUserId} exists in database`);
        const response = await fetch(`/api/users?id=${storedUserId}`);
        
        if (response.ok) {
          const userData = await response.json();
          console.log('User exists in database:', userData);
          
          const profile = apiUserToUserProfile(userData);
          localStorage.setItem('walkmateUserProfile', JSON.stringify(profile));
          setUserProfileState(profile);
          
          console.groupEnd();
          return storedUserId;
        } else {
          console.log('User not found in database, creating new user');
          
          localStorage.removeItem('currentUserId');
          localStorage.removeItem('walkmateUserProfile');
          localStorage.removeItem('walkActivities');
          
          const newUserId = await createAndStoreNewUser();
          console.groupEnd();
          return newUserId;
        }
      } catch (error) {
        console.error('Error verifying user:', error);
        
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

  const fetchActivitiesForUser = useCallback(async (userId: string) => {
    console.group(`fetchActivitiesForUser(${userId})`);
    console.log('Fetching activities for user ID:', userId);
    
    if (!userId) {
      console.error('Cannot fetch activities: No userId provided');
      console.groupEnd();
      return;
    }
    
    try {
      const formattedUserId = userId.toString();
      
      console.log('Making API request to get activities');
      const response = await fetch(`/api/walks?userId=${formattedUserId}`);
      
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }
      
      const responseData = await response.json();
      console.log('API response:', responseData);
      
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
        
        setActivities([]);
      }
      
      const savedActivities = localStorage.getItem('walkActivities');
      console.log('Checking localStorage for activities:', savedActivities ? 'Found' : 'Not found');
      
      if (savedActivities) {
        try {
          const parsed = JSON.parse(savedActivities);
          console.log('Parsed localStorage activities:', parsed);
          
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

  const resetApplication = useCallback(() => {
    console.log('Resetting application state and localStorage');
    
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
      setError(null);
      
      console.log('WalkContext state update:', { 
        isLoading: true, 
        hasUserProfile: !!userProfile,
        currentError: error 
      });
      
      try {
        const setupComplete = localStorage.getItem('walkmateSetupComplete') === 'true';
        
        if (!setupComplete) {
          console.log('Onboarding not completed, waiting for user input');
          setUserProfileState(null);
          setIsLoading(false);
          console.log('WalkContext state update:', { 
            isLoading: false, 
            hasUserProfile: false,
            currentError: null 
          });
          console.groupEnd();
          return;
        }
        
        const userId = await synchronizeUser();
        console.log('Synchronized user with ID:', userId);
        
        if (userId) {
          await fetchActivitiesForUser(userId);
        } else {
          console.error('Failed to synchronize user');
          setError('Failed to initialize user data');
          setUserProfileState(null);
        }
      } catch (err) {
        console.error('Error during initialization:', err);
        logErrorDetails(err);
        setError('Failed to initialize app data');
        setUserProfileState(null);
      } finally {
        setIsLoading(false);
        console.log('WalkContext final state:', { 
          isLoading: false, 
          hasUserProfile: !!userProfile,
          currentError: error 
        });
        console.groupEnd();
      }
    };
    
    initializeData();
  }, [synchronizeUser, fetchActivitiesForUser, userProfile, error]); // Added userProfile to dependencies

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
      const userId = await synchronizeUser();
      
      if (!userId) {
        console.error('Failed to synchronize user before adding activity');
        setError('Failed to verify user account');
        console.groupEnd();
        return;
      }
      
      const activityStartTime = new Date(activity.timestamp);
      const year = activityStartTime.getFullYear();
      const month = String(activityStartTime.getMonth() + 1).padStart(2, '0');
      const day = String(activityStartTime.getDate()).padStart(2, '0');
      const activityDate = `${year}-${month}-${day}`;
      
      console.log('Activity timestamp:', activity.timestamp);
      console.log('Extracted date for activity:', activityDate);
      
      const tempId = `temp_${Date.now()}`;
      const tempActivity = {
        ...activity,
        id: tempId,
        userId: userId,
        date: activityDate
      } as WalkActivity;
      
      setActivities(prev => [...prev, tempActivity]);
      
      const updatedActivities = [...activities, tempActivity];
      localStorage.setItem('walkActivities', JSON.stringify(updatedActivities));
      
      const walkData = {
        userId: userId,
        steps: activity.steps,
        distance: activity.distance,
        duration: activity.duration,
        date: activity.timestamp
      };
      
      console.log('Sending to API:', walkData);
      
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
      
      const finalActivities = activities.map(act => 
        act.id === tempId ? serverActivity : act
      );
      localStorage.setItem('walkActivities', JSON.stringify(finalActivities));
    } catch (err) {
      console.error('Error adding activity:', err);
      logErrorDetails(err);
      setError('Failed to add activity. Data saved locally only.');
    } finally {
      setIsLoading(false);
      console.groupEnd();
    }
  }, [activities, userProfile, synchronizeUser]);

  const setUserProfile = useCallback(async (profile: ApiUserProfile) => {
    console.group('setUserProfile');
    setIsLoading(true);
    setError(null);
    
    try {
      let response;
      const userId = profile.id ? profile.id.toString() : null;
      
      if (userId) {
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
      
      const updatedProfile = {
        id: response.id.toString(),
        name: response.name,
        dailyGoal: {
          type: response.goalType as 'steps' | 'distance',
          value: response.goalValue
        }
      };
      
      setUserProfileState(updatedProfile);
      localStorage.setItem('currentUserId', response.id.toString());
      localStorage.setItem('walkmateUserProfile', JSON.stringify(updatedProfile));
      
      if (!userId && response.id) {
        await fetchActivitiesForUser(response.id.toString());
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      logErrorDetails(err);
      setError('Failed to update profile. Please try again.');
      
      const fallbackProfile = {
        ...profile,
        id: profile.id || Date.now().toString()
      };
      setUserProfileState(fallbackProfile);
      localStorage.setItem('walkmateUserProfile', JSON.stringify(fallbackProfile));
      
      if (!profile.id) {
        localStorage.setItem('currentUserId', fallbackProfile.id);
      }
    } finally {
      setIsLoading(false);
      console.groupEnd();
    }
  }, [fetchActivitiesForUser]);

  const fetchActivities = useCallback(async () => {
    console.group('fetchActivities');
    
    if (!userProfile?.id) {
      console.error('Cannot fetch activities: No user profile found');
      setError('Cannot fetch activities: No user profile found');
      console.groupEnd();
      return;
    }
    
    if (isLoading) {
      console.log('Already loading, skipping duplicate request');
      console.groupEnd();
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
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

  const debugDataAssociations = useCallback(async () => {
    console.group('DEBUG: Data Associations');
    const userId = localStorage.getItem('currentUserId');
    console.log('Current localStorage userId:', userId);
    
    if (userId) {
      try {
        const userResponse = await fetch(`/api/users?id=${userId}`);
        const userData = await userResponse.json();
        console.log('User in database:', userData);
        
        const activitiesResponse = await fetch(`/api/walks?userId=${userId}`);
        if (activitiesResponse.ok) {
          const activitiesData = await activitiesResponse.json();
          console.log('Activities for this user:', activitiesData);
        } else {
          console.error('Failed to fetch activities:', activitiesResponse.status);
        }
        
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

