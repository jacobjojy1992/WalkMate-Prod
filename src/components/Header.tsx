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
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [pausedTime, setPausedTime] = useState(0); // accumulated paused time in milliseconds
  
  // Use a ref to store the interval ID to clear it later
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pauseTimeRef = useRef<number | null>(null);
  
  // Format today's date as "Wednesday, February 26, 2025"
  const formattedDate = format(new Date(), 'EEEE, MMMM d, yyyy');
  
  // Update timer when walking
  useEffect(() => {
    if (isWalking && !isPaused) {
      timerRef.current = setInterval(() => {
        if (startTime) {
          const now = new Date();
          // Calculate elapsed time excluding paused time
          const elapsed = Math.floor((now.getTime() - startTime.getTime() - pausedTime) / 1000);
          setElapsedTime(elapsed);
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
  }, [isWalking, isPaused, startTime, pausedTime]);
  
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
  
  // Handle start walking
  const handleStartWalking = () => {
    setStartTime(new Date());
    setIsWalking(true);
    setIsPaused(false);
    setElapsedTime(0);
    setPausedTime(0);
  };
  
  // Handle pause/resume walking
  const handlePauseResumeWalking = () => {
    if (isPaused) {
      // Resume walking
      if (pauseTimeRef.current) {
        // Add the paused duration to the total paused time
        const now = new Date().getTime();
        setPausedTime(prev => prev + (now - pauseTimeRef.current!));
        pauseTimeRef.current = null;
      }
    } else {
      // Pause walking
      pauseTimeRef.current = new Date().getTime();
    }
    
    setIsPaused(!isPaused);
  };
  
  // Handle stop walking
  const handleStopWalking = () => {
    if (!isWalking || !startTime) return;
    
    // Calculate duration in minutes (rounded)
    const durationMinutes = Math.round(elapsedTime / 60);
    
    // Use the conversion formula: 100 steps = 1 minute = 75m
    const steps = durationMinutes * 100;
    const distance = durationMinutes * 75;
    
    // Add the activity
    addActivity({
      date: format(new Date(), 'yyyy-MM-dd'),
      steps,
      distance,
      duration: durationMinutes,
      timestamp: new Date().toISOString()
    });
    
    // Reset states
    setIsWalking(false);
    setIsPaused(false);
    setStartTime(null);
    setElapsedTime(0);
    setPausedTime(0);
    
    // Clean up timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (pauseTimeRef.current) {
      pauseTimeRef.current = null;
    }
  };
  
  return (
    <div className="mb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold">
            Hi {userProfile?.name || 'there'}
          </h1>
          <p className="text-gray-400">{formattedDate}</p>
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