// src/contexts/WalkContext.tsx
'use client';

import { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { UserProfile, WalkActivity } from '@/types';

// Define what our context will contain
interface WalkContextType {
  activities: WalkActivity[];
  userProfile: UserProfile | null;
  isLoading: boolean;
  addActivity: (activity: WalkActivity) => void;
  setUserProfile: (profile: UserProfile) => void;
  fetchActivities: () => Promise<void>;
}

// Create the context with default values
const WalkContext = createContext<WalkContextType>({
  activities: [],
  userProfile: null,
  isLoading: false,
  addActivity: () => {},
  setUserProfile: () => {},
  fetchActivities: async () => {},
});

// Create a provider component
export function WalkProvider({ children }: { children: ReactNode }) {
  // State for activities and user profile
  const [activities, setActivities] = useState<WalkActivity[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // For development/testing, we'll load from localStorage initially
  // Later in Phase 3, we'll replace this with actual API calls
  useEffect(() => {
    const savedActivities = localStorage.getItem('walkActivities');
    const savedProfile = localStorage.getItem('userProfile');
    
    if (savedActivities) {
      setActivities(JSON.parse(savedActivities));
    }
    
    if (savedProfile) {
      setUserProfile(JSON.parse(savedProfile));
    }
  }, []);

  // Save data to localStorage whenever it changes
  // This is temporary until we implement the backend
  useEffect(() => {
    if (activities.length > 0) {
      localStorage.setItem('walkActivities', JSON.stringify(activities));
    }
  }, [activities]);

  useEffect(() => {
    if (userProfile) {
      localStorage.setItem('userProfile', JSON.stringify(userProfile));
    }
  }, [userProfile]);

  // Function to add a new activity
  const addActivity = (activity: WalkActivity) => {
    const newActivity = {
      ...activity,
      id: activity.id || Date.now().toString(), // Generate an ID if none exists
    };
    setActivities(prev => [...prev, newActivity]);
  };

  // Function to fetch activities from API (will implement in Phase 3)
  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      // This will be replaced with actual API call later
      const savedActivities = localStorage.getItem('walkActivities');
      if (savedActivities) {
        setActivities(JSON.parse(savedActivities));
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Provide the context value to children
  return (
    <WalkContext.Provider 
      value={{ 
        activities, 
        userProfile, 
        isLoading,
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