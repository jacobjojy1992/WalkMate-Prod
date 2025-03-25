// src/components/Header.tsx
'use client';

import { useWalkContext } from '@/contexts/WalkContext';
import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';

export default function Header() {
  const { userProfile, addActivity } = useWalkContext();
  const [isWalking, setIsWalking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds
  const [headerDate, setHeaderDate] = useState(format(new Date(), 'EEEE, MMMM d, yyyy'));
  
  // Use refs to store time information to prevent issues with closure captures
  const startTimeRef = useRef<Date | null>(null);
  const pausedTimeRef = useRef<number>(0);
  const lastPauseRef = useRef<number | null>(null);
  
  // Timer reference
  const timerRef = useRef<number | null>(null);
  
  // Update the header date periodically to keep it current
  useEffect(() => {
    // Update date immediately
    updateHeaderDate();
    
    // Set up an interval to update the date every minute
    const dateInterval = window.setInterval(updateHeaderDate, 60000);
    
    return () => {
      window.clearInterval(dateInterval);
    };
  }, []);
  
  // Function to update the header date
  const updateHeaderDate = () => {
    setHeaderDate(format(new Date(), 'EEEE, MMMM d, yyyy'));
  };
  
  // Update timer when walking
  useEffect(() => {
    if (isWalking && !isPaused) {
      // Clear any existing interval first
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      timerRef.current = window.setInterval(() => {
        if (startTimeRef.current) {
          const now = Date.now();
          // Calculate elapsed time in seconds, accounting for paused time
          const startTimeMs = startTimeRef.current.getTime();
          const elapsed = Math.floor((now - startTimeMs - pausedTimeRef.current) / 1000);
          setElapsedTime(Math.max(0, elapsed)); // Ensure it's never negative
        }
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isWalking, isPaused]);
  
  // Format seconds to HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };
  
  // Handle start walking - with explicit date creation
  const handleStartWalking = () => {
    // CRITICAL: Force a completely new Date object to be created
    const currentStartTime = new Date();
    
    // Log the exact time for debugging
    console.log('Starting timer with date:', currentStartTime);
    console.log('Date string:', currentStartTime.toISOString());
    
    // Update header date to ensure it's current
    updateHeaderDate();
    
    // Reset everything to initial state
    startTimeRef.current = currentStartTime;
    pausedTimeRef.current = 0;
    lastPauseRef.current = null;
    setElapsedTime(0);
    setIsPaused(false);
    setIsWalking(true);
  };
  
  // Handle pause/resume walking
  const handlePauseResumeWalking = () => {
    if (isPaused) {
      // Resuming from pause
      if (lastPauseRef.current) {
        // Add the duration of this pause to total paused time
        pausedTimeRef.current += Date.now() - lastPauseRef.current;
        lastPauseRef.current = null;
      }
    } else {
      // Pausing
      lastPauseRef.current = Date.now();
    }
    
    setIsPaused(!isPaused);
  };
  
  // Handle stop walking - with explicit date creation
  const handleStopWalking = () => {
    if (!isWalking || !startTimeRef.current) return;
    
    // Stop the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Get the stored start time
    const startTime = startTimeRef.current;
    
    // Log the exact start time for debugging
    console.log('Activity started at:', startTime);
    console.log('Start date for activity:', format(startTime, 'yyyy-MM-dd'));
    
    // Calculate final duration in minutes (rounded)
    const durationMinutes = Math.max(1, Math.round(elapsedTime / 60));
    
    // Use the conversion formula: 100 steps = 1 minute = 75m
    const steps = durationMinutes * 100;
    const distance = durationMinutes * 75;
    
    // Use the start time for the activity date
    const activityDate = format(startTime, 'yyyy-MM-dd');
    
    // Add the activity to the log with the start time information
    addActivity({
      date: activityDate, // Use the start date
      steps,
      distance,
      duration: durationMinutes,
      timestamp: startTime.toISOString() // Use the start time as the timestamp
    });
    
    // Force a completely fresh date state by explicitly setting to null first
    startTimeRef.current = null;
    
    // Reset all other states
    setIsWalking(false);
    setIsPaused(false);
    setElapsedTime(0);
    pausedTimeRef.current = 0;
    lastPauseRef.current = null;
    
    // Update header date to ensure it's current
    updateHeaderDate();
  };
  
  return (
    <div className="mb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold">
            Hi {userProfile?.name || 'there'}
          </h1>
          <p className="text-gray-400">{headerDate}</p>
        </div>
        
        {!isWalking ? (
          <button
            onClick={handleStartWalking}
            className="mt-4 md:mt-0 flex items-center px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors"
          >
            <span className="mr-2">Start Walking</span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </button>
        ) : (
          <div className="mt-4 md:mt-0 flex flex-col md:flex-row items-center">
            <div className="text-2xl font-mono font-bold mb-3 md:mb-0 md:mr-4">
              {formatTime(elapsedTime)}
            </div>
            <div className="flex">
              <button
                onClick={handlePauseResumeWalking}
                className={`flex items-center px-4 py-2 rounded-full mr-2 text-white font-medium transition-colors ${
                  isPaused 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-yellow-600 hover:bg-yellow-700'
                }`}
              >
                <span className="mr-2">{isPaused ? 'Resume' : 'Pause'}</span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  {isPaused ? (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  ) : (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                  )}
                </svg>
              </button>
              <button
                onClick={handleStopWalking}
                className="flex items-center px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
              >
                <span className="mr-2">Stop</span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
      
      {isWalking && (
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <p className="text-center text-gray-400">
            {isPaused 
              ? 'Walking paused. Press Resume to continue tracking.' 
              : 'Walking in progress. WalkMate is tracking your activity.'}
          </p>
        </div>
      )}
    </div>
  );
}