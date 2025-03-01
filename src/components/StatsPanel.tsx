// src/components/StatsPanel.tsx
'use client';

import { useWalkContext } from '@/contexts/WalkContext';
import { useMemo } from 'react';
import { format, isToday } from 'date-fns';

interface StatsPanelProps {
  selectedDate?: Date;
}

export default function StatsPanel({ selectedDate }: StatsPanelProps) {
  const { activities, userProfile } = useWalkContext();
  const today = new Date();
  
  // If no date is provided, use today
  const targetDate = selectedDate || today;
  
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
      // Filter activities for the selected date
      const dateString = format(targetDate, 'yyyy-MM-dd');
      const dayActivities = activities.filter(activity => 
        activity.date && activity.date.startsWith(dateString)
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
  
  // Calculate goal progress
  const goalProgress = useMemo(() => {
    if (!userProfile || !userProfile.dailyGoal) return 0;
    
    try {
      const { type, value } = userProfile.dailyGoal;
      
      if (!Number.isFinite(value) || value <= 0) return 0;
      
      let progress = 0;
      
      if (type === 'steps') {
        progress = (stats.steps / value) * 100;
      } else {
        progress = (stats.distance / value) * 100;
      }
      
      // Ensure progress is between 0 and 100
      return Math.min(100, Math.max(0, progress));
    } catch (error) {
      console.error('Error calculating goal progress:', error);
      return 0;
    }
  }, [stats, userProfile]);
  
  // Check if goal is met
  const isGoalMet = goalProgress >= 100;
  
  // Format the date heading
  const dateHeading = isToday(targetDate) 
    ? "Today's Stats" 
    : `Stats for ${format(targetDate, 'MMM d, yyyy')}`;
  
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{dateHeading}</h2>
        
        {userProfile && userProfile.dailyGoal && (
          <div className="flex items-center">
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
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Steps Panel */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-gray-400 font-medium">Total Steps</h3>
          <p className="text-4xl font-bold mt-2">{Math.round(stats.steps).toLocaleString()}</p>
          {userProfile?.dailyGoal?.type === 'steps' && (
            <p className="text-sm text-gray-400 mt-1">
              Goal: {userProfile.dailyGoal.value.toLocaleString()} steps
            </p>
          )}
        </div>
        
        {/* Distance Panel */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-gray-400 font-medium">Distance</h3>
          <p className="text-4xl font-bold mt-2">
            {(stats.distance / 1000).toFixed(1)}
            <span className="text-2xl">km</span>
          </p>
          {userProfile?.dailyGoal?.type === 'distance' && (
            <p className="text-sm text-gray-400 mt-1">
              Goal: {(userProfile.dailyGoal.value / 1000).toFixed(1)} km
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