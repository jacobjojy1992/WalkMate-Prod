// src/components/ActivityLogForm.tsx
'use client';

import { useState } from 'react';
import { useWalkContext } from '@/contexts/WalkContext';

type LogType = 'steps' | 'duration' | 'distance';

export default function ActivityLogForm() {
  const { addActivity, isLoading, error } = useWalkContext();
  
  // Form states
  const [activeTab, setActiveTab] = useState<LogType>('steps');
  const [steps, setSteps] = useState(0);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Today's date in YYYY-MM-DD format
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Conversion formula functions based on: 100 steps = 1 minute = 75m
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
    const steps = Math.round(meters * (100 / 75)); // Round to whole number
    const duration = Math.round(meters / 75); // Round to whole minutes
    return { steps, distance: meters, duration };
  };
  
  // Handle form submission based on active tab
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset any previous form errors
    setFormError(null);
    setFormSubmitting(true);
    
    let activityData: { steps: number; distance: number; duration: number };
    
    // Calculate values based on input type
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
        return; // Should never happen
    }
    
    try {
      // Create timestamp for the selected date (at noon)
      // This ensures the activity is logged for the correct date
      const [year, month, day] = date.split('-').map(Number);
      const timestamp = new Date(year, month - 1, day, 12, 0, 0).toISOString();
      
      // Add the activity with the correct date
      await addActivity({
        date,
        ...activityData,
        timestamp // Use the timestamp generated from the selected date
      });
      
      // Reset form fields on success
      setSteps(0);
      setDistance(0);
      setDuration(0);
    } catch (err) {
      console.error("Error adding activity:", err);
      setFormError("Failed to log activity. Please try again.");
    } finally {
      setFormSubmitting(false);
    }
  };
  
  // Determine if the form is in a loading state
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
      
      {/* Tabs */}
      <div className="flex border-b border-gray-700 mb-6">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'steps' 
              ? 'border-b-2 border-indigo-500 text-white' 
              : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => setActiveTab('steps')}
          disabled={isFormLoading}
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
          disabled={isFormLoading}
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
          disabled={isFormLoading}
        >
          Distance
        </button>
      </div>
      
      <div className="text-xs text-gray-400 mb-4 pb-2 ">
      <p>Conversion Estimates: 100 steps ≈ 1 minute ≈ 75 meters</p>
      </div>

      {/* Common form elements for all tabs */}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-400 mb-2">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-2 bg-gray-700 rounded text-white"
            max={new Date().toISOString().split('T')[0]} // Disable future dates
            disabled={isFormLoading}
            required
          />
        </div>
        
        {/* Steps Form Fields */}
        {activeTab === 'steps' && (
          <div className="mb-4">
            <label className="block text-gray-400 mb-2">Steps</label>
            <input
              type="number"
              value={steps || ''}
              onChange={(e) => setSteps(Number(e.target.value))}
              className="w-full p-2 bg-gray-700 rounded text-white"
              min="1"
              disabled={isFormLoading}
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
              disabled={isFormLoading}
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
              disabled={isFormLoading}
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              Estimated: {Math.round(distance * (100/75))} steps | {Math.round(distance / 75)} min
            </p>
          </div>
        )}
        
        <button
          type="submit"
          className={`w-full ${isFormLoading 
            ? 'bg-indigo-800 cursor-not-allowed' 
            : 'bg-indigo-600 hover:bg-indigo-700'
          } text-white py-2 rounded font-medium flex justify-center items-center`}
          disabled={isFormLoading}
        >
          {isFormLoading ? (
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