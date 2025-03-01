// src/components/ActivityLogForm.tsx
'use client';

import { useState } from 'react';
import { useWalkContext } from '@/contexts/WalkContext';

type LogType = 'steps' | 'duration' | 'distance';

export default function ActivityLogForm() {
  const { addActivity } = useWalkContext();
  const [activeTab, setActiveTab] = useState<LogType>('steps');
  
  // Form states
  const [steps, setSteps] = useState(0);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Today's date in YYYY-MM-DD format
  
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
    const steps = meters * (100 / 75); // meters to steps (using the ratio)
    const duration = meters / 75; // meters to minutes
    return { steps, distance: meters, duration };
  };
  
  // Handle form submission based on active tab
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let activityData: { steps: number; distance: number; duration: number };
    
    // Calculate values based on input type
    switch (activeTab) {
      case 'steps':
        activityData = calculateFromSteps(steps);
        break;
      case 'duration':
        activityData = calculateFromDuration(duration);
        break;
      case 'distance':
        activityData = calculateFromDistance(distance);
        break;
      default:
        return; // Should never happen
    }
    
    // Add the activity
    addActivity({
      date,
      ...activityData,
      timestamp: new Date().toISOString()
    });
    
    // Reset form fields
    setSteps(0);
    setDistance(0);
    setDuration(0);
  };
  
  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4">Log Activity</h2>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-700 mb-6">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'steps' 
              ? 'border-b-2 border-indigo-500 text-white' 
              : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => setActiveTab('steps')}
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
        >
          Distance
        </button>
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
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              Estimated: {Math.round(distance * (100/75))} steps | {Math.round(distance / 75)} min
            </p>
          </div>
        )}
        
        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded font-medium"
        >
          Log Activity
        </button>
      </form>
    </div>
  );
}