// src/components/StatsPanel.tsx
'use client';

import { useWalkContext } from '@/contexts/WalkContext';
import { useMemo, useEffect, useRef, useState } from 'react';
import { format, isToday } from 'date-fns';
import { isGoalAchieved, calculateGoalProgress } from '@/utils/goalUtils';

interface StatsPanelProps {
  selectedDate?: Date;
}

export default function StatsPanel({ selectedDate }: StatsPanelProps) {
  const { activities, userProfile, isLoading, error, fetchActivities } = useWalkContext();
  const today = new Date();
  const initialFetchDone = useRef(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  // If no date is provided, use today
  const targetDate = selectedDate || today;
  
  // Fetch activities on component mount - with safety check to prevent loops
  useEffect(() => {
    if (!initialFetchDone.current && userProfile?.id && !isLoading) {
      fetchActivities().catch(err => {
        if (err?.response?.status === 404) {
          setConnectionError("API endpoint not found. Please check server configuration.");
        } else if (err?.message?.includes('Network Error')) {
          setConnectionError("Cannot connect to server. Please check your connection.");
        }
      });
      initialFetchDone.current = true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile?.id]); // Only re-run if user profile ID changes
  
  // Calculate stats for the selected date
  const stats = useMemo(() => {
    // Default stats (all zeros)
    const defaultStats = {
      steps: 0,
      distance: 0,
      duration: 0
    };
    
    // If no activities, return default stats
    if (!activities || activities.length === 0) {
      return defaultStats;
    }
    
    try {
      // Filter activities for the selected date - more precise comparison
      const dateString = format(targetDate, 'yyyy-MM-dd');
      const dayActivities = activities.filter(activity => 
        activity.date === dateString
      );
      
      // If no activities for this date, return default stats
      if (dayActivities.length === 0) {
        return defaultStats;
      }
      
      // Sum up the metrics, ensuring they are valid numbers
      const totalSteps = dayActivities.reduce((sum, activity) => 
        sum + (Number.isFinite(activity.steps) ? activity.steps : 0), 0);
      
      const totalDistance = dayActivities.reduce((sum, activity) => 
        sum + (Number.isFinite(activity.distance) ? activity.distance : 0), 0);
      
      const totalDuration = dayActivities.reduce((sum, activity) => 
        sum + (Number.isFinite(activity.duration) ? activity.duration : 0), 0);
      
      return {
        steps: Math.max(0, totalSteps),
        distance: Math.max(0, totalDistance),
        duration: Math.max(0, totalDuration)
      };
    } catch (error) {
      console.error('Error calculating stats:', error);
      return defaultStats;
    }
  }, [activities, targetDate]);
  
  // Calculate goal progress with improved precision
  const goalProgress = useMemo(() => {
    if (!userProfile?.dailyGoal) return 0;
    
    try {
      const { type, value } = userProfile.dailyGoal;
      
      if (type === 'steps') {
        return calculateGoalProgress(stats.steps, value);
      } else if (type === 'distance') {
        return calculateGoalProgress(stats.distance, value);
      }
      
      return 0;
    } catch (error) {
      console.error('Error calculating goal progress:', error);
      return 0;
    }
  }, [stats, userProfile]);
  
  // Check if goal is met with consistent logic
  const isGoalMet = useMemo(() => {
    if (!userProfile?.dailyGoal) return false;
    
    const { type, value } = userProfile.dailyGoal;
    if (type === 'steps') {
      return isGoalAchieved(stats.steps, value);
    } else if (type === 'distance') {
      return isGoalAchieved(stats.distance, value);
    }
    return false;
  }, [stats, userProfile]);
  
  // Format the date heading
  const dateHeading = isToday(targetDate) 
    ? "Today's Stats" 
    : `Stats for ${format(targetDate, 'MMM d, yyyy')}`;
  
  // Loading state
  if (isLoading && activities.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">{dateHeading}</h2>
        <div className="flex justify-center items-center p-12">
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-10 w-10 text-indigo-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-400">Loading activity data...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{dateHeading}</h2>
        
        <div className="flex items-center">
          {userProfile && userProfile.dailyGoal && (
            <div className="hidden md:flex items-center mr-4">
              <p className="text-sm mr-2">
                {isGoalMet 
                  ? '🎉 Daily goal achieved!' 
                  : `Goal: ${Math.round(goalProgress)}% complete`}
              </p>
              <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${isGoalMet ? 'bg-green-500' : 'bg-indigo-500'}`}
                  style={{ width: `${goalProgress}%` }}
                />
              </div>
            </div>
          )}
          
          {/* Mobile-only goal display */}
          {userProfile && userProfile.dailyGoal && (
            <div className="flex md:hidden items-center mr-2">
              <p className="text-xs whitespace-nowrap">
                {isGoalMet ? '🎉 Goal met!' : `${Math.round(goalProgress)}%`}
              </p>
            </div>
          )}
          
          {/* Refresh button with loading indicator - mobile optimized */}
          <button 
            onClick={() => {
              initialFetchDone.current = false;
              fetchActivities();
            }}
            disabled={isLoading}
            className={`text-sm text-gray-400 hover:text-white flex items-center ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label="Refresh data"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="hidden md:inline">Refreshing...</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4 md:mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="hidden md:inline">Refresh</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Error messages */}
      {(error || connectionError) && (
        <div className="mb-4 p-2 md:p-3 bg-red-900/50 border border-red-800 rounded text-red-200 text-xs md:text-sm">
          {connectionError || error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Steps Panel */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-gray-400 font-medium">Total Steps</h3>
          <p className="text-4xl font-bold mt-2">{Math.round(stats.steps).toLocaleString()}</p>
          {userProfile?.dailyGoal?.type === 'steps' && (
            <p className={`text-sm ${isGoalMet ? 'text-green-500 font-medium' : 'text-green-400'} mt-1`}>
              Goal: {userProfile.dailyGoal.value.toLocaleString()} steps
            </p>
          )}
        </div>
        
        {/* Distance Panel */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-gray-400 font-medium">Distance</h3>
          <p className="text-4xl font-bold mt-2">
            {(stats.distance / 1000).toFixed(2)}
            <span className="text-2xl">km</span>
          </p>
          {userProfile?.dailyGoal?.type === 'distance' && (
            <p className={`text-sm ${isGoalMet ? 'text-green-500 font-medium' : 'text-green-400'} mt-1`}>
              Goal: {(userProfile.dailyGoal.value / 1000).toFixed(2)} km
            </p>
          )}
        </div>
        
        {/* Active Time Panel */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-gray-400 font-medium">Active Time</h3>
          <p className="text-4xl font-bold mt-2">
            {Math.round(stats.duration)}
            <span className="text-2xl">min</span>
          </p>
        </div>
      </div>
    </div>
  );
}