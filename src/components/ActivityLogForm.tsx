'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWalkContext } from '@/contexts/WalkContext';
import { healthCheck } from '@/services/api';

type LogType = 'steps' | 'duration' | 'distance';

export default function ActivityLogForm() {
  const { addActivity, isLoading, error, userProfile } = useWalkContext();
  
  // Form states
  const [activeTab, setActiveTab] = useState<LogType>('steps');
  const [steps, setSteps] = useState(0);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [date, setDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  
  // Loading and error states
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  
  // Network and server states
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isServerAvailable, setIsServerAvailable] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  // Check for user profile on mount and changes
  useEffect(() => {
    const checkProfile = () => {
      if (userProfile) {
        setIsProfileLoading(false);
        setProfileError(null);
      } else {
        // Check localStorage as fallback
        const storedProfile = localStorage.getItem('walkmateUserProfile');
        if (!storedProfile) {
          setProfileError('User profile not found');
        }
        setIsProfileLoading(false);
      }
    };

    // Add a small delay to ensure context is properly initialized
    const timeoutId = setTimeout(checkProfile, 100);
    return () => clearTimeout(timeoutId);
  }, [userProfile]);
  
  // Function to check if server is available
  const checkServerAvailability = useCallback(async () => {
    try {
      const response = await healthCheck();
      setIsServerAvailable(response.success);
      setLastChecked(new Date());
    } catch (error) {
      console.error('Server health check failed:', error);
      setIsServerAvailable(false);
      setLastChecked(new Date());
    }
  }, []);
  
  // Effect for tracking online/offline status and server availability
  useEffect(() => {
    const handleOnlineStatusChange = () => {
      const isOnline = navigator.onLine;
      setIsOffline(!isOnline);
      
      if (isOnline) {
        checkServerAvailability();
      } else {
        setIsServerAvailable(false);
      }
    };
    
    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);
    
    checkServerAvailability();
    const intervalId = setInterval(checkServerAvailability, 15000);
    
    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
      clearInterval(intervalId);
    };
  }, [checkServerAvailability]);
  
  const isNetworkUnavailable = isOffline || !isServerAvailable;
  
  // Show loading state
  if (isProfileLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  // Show profile error state
  if (profileError) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <div className="text-red-400 text-center">
          <p>{profileError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-indigo-600 rounded hover:bg-indigo-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
  
  // Conversion formula functions
  const calculateFromSteps = (stepCount: number) => {
    const distance = stepCount * 0.75; // steps to meters
    const duration = stepCount / 100; // steps to minutes
    return { steps: stepCount, distance, duration };
  };
  
  const calculateFromDuration = (mins: number) => {
    const steps = mins * 100; // minutes to steps
    const distance = mins * 75; // minutes to meters
    return { steps, distance, duration: mins };
  };
  
  const calculateFromDistance = (meters: number) => {
    const steps = Math.round(meters * (100 / 75));
    const duration = Math.round(meters / 75);
    return { steps, distance: meters, duration };
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userProfile) {
      setFormError('Please wait for profile to load or try refreshing the page');
      return;
    }
    
    if (isNetworkUnavailable) {
      setFormError(isOffline 
        ? "Cannot log activities while offline" 
        : "Cannot log activities while server is unavailable");
      return;
    }
    
    setFormError(null);
    setFormSubmitting(true);
    
    let activityData: { steps: number; distance: number; duration: number };
    
    switch (activeTab) {
      case 'steps':
        if (steps <= 0) {
          setFormError("Please enter a valid number of steps");
          setFormSubmitting(false);
          return;
        }
        activityData = calculateFromSteps(steps);
        break;
      case 'duration':
        if (duration <= 0) {
          setFormError("Please enter a valid duration");
          setFormSubmitting(false);
          return;
        }
        activityData = calculateFromDuration(duration);
        break;
      case 'distance':
        if (distance <= 0) {
          setFormError("Please enter a valid distance");
          setFormSubmitting(false);
          return;
        }
        activityData = calculateFromDistance(distance);
        break;
      default:
        setFormSubmitting(false);
        return;
    }
    
    try {
      const [year, month, day] = date.split('-').map(Number);
      const localDate = new Date(year, month - 1, day, 12, 0, 0);
      const timestamp = localDate.toISOString();
      
      await addActivity({
        date,
        ...activityData,
        timestamp
      });
      
      // Reset form fields on success
      setSteps(0);
      setDistance(0);
      setDuration(0);
    } catch (err) {
      console.error("Error adding activity:", err);
      
      if (err && typeof err === 'object' && 'message' in err) {
        const errorMessage = String(err.message || '');
        
        if (
          errorMessage.includes('Network Error') || 
          errorMessage.includes('Failed to fetch') ||
          errorMessage.includes('ECONNREFUSED')
        ) {
          setIsServerAvailable(false);
          setFormError("Server is unavailable. Your activity was not saved.");
        } else {
          setFormError("Failed to log activity. Please try again.");
        }
      } else {
        setFormError("Failed to log activity. Please try again.");
      }
    } finally {
      setFormSubmitting(false);
    }
  };
  
  const handleRetryConnection = () => {
    checkServerAvailability();
  };
  
  const isFormLoading = formSubmitting || isLoading;
  
  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4">Log Activity</h2>
      
      {/* Error messages */}
      {(error || formError) && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-800 rounded text-red-200 text-sm">
          {formError || error}
        </div>
      )}
      
      {/* Network/Server availability warning */}
      {isNetworkUnavailable && (
        <div className="mb-4 p-3 bg-yellow-900/50 border border-yellow-800 rounded text-yellow-200 text-sm">
          {isOffline 
            ? "You are currently offline. Activity logging is disabled until your connection is restored." 
            : (
              <div className="flex justify-between items-center">
                <div>
                  Server is currently unavailable. Activity logging is disabled until the server is back online.
                  {lastChecked && (
                    <div className="text-xs mt-1">Last checked: {lastChecked.toLocaleTimeString()}</div>
                  )}
                </div>
                <button 
                  onClick={handleRetryConnection}
                  className="ml-2 px-2 py-1 bg-yellow-700 hover:bg-yellow-600 rounded text-xs"
                >
                  Retry
                </button>
              </div>
            )}
        </div>
      )}
      
      {/* Tabs */}
      <div className="flex border-b border-gray-700 mb-6">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'steps' 
              ? 'border-b-2 border-indigo-500 text-white' 
              : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => setActiveTab('steps')}
          disabled={isFormLoading || isNetworkUnavailable}
        >
          Steps
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'duration' 
              ? 'border-b-2 border-indigo-500 text-white' 
              : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => setActiveTab('duration')}
          disabled={isFormLoading || isNetworkUnavailable}
        >
          Duration
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'distance' 
              ? 'border-b-2 border-indigo-500 text-white' 
              : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => setActiveTab('distance')}
          disabled={isFormLoading || isNetworkUnavailable}
        >
          Distance
        </button>
      </div>
      
      {/* Formula explanation */}
      <div className="text-xs text-gray-400 mb-4 pb-2 border-b border-gray-700">
        <p>Conversions used: 100 steps ≈ 1 minute ≈ 75 meters</p>
      </div>
      
      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-400 mb-2">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-2 bg-gray-700 rounded text-white"
            max={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`}
            disabled={isFormLoading || isNetworkUnavailable}
            required
          />
        </div>
        
        {/* Dynamic input field based on active tab */}
        {activeTab === 'steps' && (
          <div className="mb-4">
            <label className="block text-gray-400 mb-2">Steps</label>
            <input
              type="number"
              value={steps || ''}
              onChange={(e) => setSteps(Number(e.target.value))}
              className="w-full p-2 bg-gray-700 rounded text-white"
              min="1"
              disabled={isFormLoading || isNetworkUnavailable}
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              Estimated: {(steps * 0.75 / 1000).toFixed(2)} km | {Math.round(steps / 100)} min
            </p>
          </div>
        )}
        
        {/* Duration Form Fields */}
        {activeTab === 'duration' && (
          <div className="mb-4">
            <label className="block text-gray-400 mb-2">Duration (minutes)</label>
            <input
              type="number"
              value={duration || ''}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full p-2 bg-gray-700 rounded text-white"
              min="1"
              disabled={isFormLoading || isNetworkUnavailable}
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              Estimated: {duration * 100} steps | {(duration * 75 / 1000).toFixed(2)} km
            </p>
          </div>
        )}
        
        {/* Distance Form Fields */}
        {activeTab === 'distance' && (
          <div className="mb-4">
            <label className="block text-gray-400 mb-2">Distance (meters)</label>
            <input
              type="number"
              value={distance || ''}
              onChange={(e) => setDistance(Number(e.target.value))}
              className="w-full p-2 bg-gray-700 rounded text-white"
              min="1"
              disabled={isFormLoading || isNetworkUnavailable}
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              Estimated: {Math.round(distance * (100/75))} steps | {Math.round(distance / 75)} min
            </p>
          </div>
        )}
        
        <button
          type="submit"
          className={`w-full ${
            isFormLoading || isNetworkUnavailable
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700'
          } text-white py-2 rounded font-medium flex justify-center items-center`}
          disabled={isFormLoading || isNetworkUnavailable}
        >
          {isNetworkUnavailable ? (
            <span>{isOffline ? "Offline" : "Server Unavailable"} - Cannot Log Activities</span>
          ) : isFormLoading ? (
            <>
              <span className="mr-2">Saving...</span>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </>
          ) : (
            'Log Activity'
          )}
        </button>
      </form>
    </div>
  );
}