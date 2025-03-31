'use client';

import React from 'react';
import { useWalkContext } from '@/contexts/WalkContext';

// Define types for activities


export default function DebugPanel() {
  const {
    userProfile,
    activities,
    error,
    fetchActivities,
    debugDataAssociations
  } = useWalkContext();
  
  // Function to clear all localStorage data for testing
  const clearLocalStorage = () => {
    localStorage.removeItem('currentUserId');
    localStorage.removeItem('walkmateUserProfile');
    localStorage.removeItem('walkActivities');
    localStorage.removeItem('walkmateSetupComplete');
    localStorage.removeItem('userProfile'); // Also clear the one referenced in page.tsx
    
    console.log('Cleared all localStorage data');
    // Reload the page to reset the app state
    window.location.reload();
  };
  
  // Function to check all walks in the database
  const debugData = async () => {
    const userId = localStorage.getItem('currentUserId');
    console.group('DEBUG DATA');
    console.log('Current localStorage userId:', userId);
    
    try {
      // Check the database directly via API endpoints
      console.log('Checking all walks in database...');
      const allWalksResponse = await fetch('/api/walks');
      const allWalks = await allWalksResponse.json();
      console.log('All walks in database:', allWalks);
      
      // Check activities specific to this user
      if (userId) {
        console.log(`Checking activities for user ${userId}...`);
        const userActivitiesResponse = await fetch(`/api/walks?userId=${userId}`);
        const userActivities = await userActivitiesResponse.json();
        console.log('User activities response:', userActivities);
      }
    } catch (error) {
      console.error('Error fetching debug data:', error);
    }
    console.groupEnd();
  };
  
  // Function to manually fix userId format issues
  const fixUserIdFormat = async () => {
    const userId = localStorage.getItem('currentUserId');
    console.group('FIX USER ID FORMAT');
    
    if (!userId) {
      console.log('No userId found in localStorage');
      console.groupEnd();
      return;
    }
    
    console.log('Current userId in localStorage:', userId);
    
    try {
      // Try to get all activities
      const response = await fetch('/api/walks');
      const allWalks = await response.json();
      
      console.log('All activities in database:', allWalks);
      
      if (allWalks.data && Array.isArray(allWalks.data)) {
        const activitiesData = allWalks.data;
        
        // Look for activities that might belong to this user but with different ID format
        const orphanedActivities = activitiesData.filter((act: { userId: string; id: string }) => 
          // Look for similar IDs (ignoring format differences)
          act.userId !== userId && 
          (act.userId.toString() === userId.toString() ||
           act.userId.toString().includes(userId) || 
           userId.includes(act.userId.toString()))
        );
        
        console.log('Potentially orphaned activities:', orphanedActivities);
        
        if (orphanedActivities.length > 0) {
          console.log('Attempting to fix orphaned activities...');
          
          // Create fix requests for each orphaned activity
          const fixPromises = orphanedActivities.map((activity: { id: string }) => 
            fetch(`/api/walks/${activity.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: userId })
            }).then(res => res.json())
          );
          
          const results = await Promise.all(fixPromises);
          console.log('Fix results:', results);
          
          alert(`Fixed ${results.length} orphaned activities. Refresh to see changes.`);
        } else {
          console.log('No orphaned activities found');
        }
      }
    } catch (error) {
      console.error('Error fixing userId format:', error);
    }
    
    console.groupEnd();
  };
  
  // Function to create debug endpoint
  const createDebugEndpoint = () => {
    // Create debug content
    const debug = {
      localStorage: {
        currentUserId: localStorage.getItem('currentUserId'),
        walkmateUserProfile: localStorage.getItem('walkmateUserProfile'),
        walkActivities: localStorage.getItem('walkActivities')
      },
      context: {
        userProfile,
        activitiesCount: activities.length
      }
    };
    
    // Log to console
    console.group('DEBUG INFO');
    console.log('Debug Info:', debug);
    console.groupEnd();
    
    // Create debugging blob
    const blob = new Blob([JSON.stringify(debug, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Open in new tab
    window.open(url, '_blank');
  };
  
  return (
    <div className="debug-panel fixed bottom-2 right-2 bg-gray-100 p-3 rounded-lg shadow-lg max-w-md max-h-80 overflow-auto z-50 text-xs">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-sm m-0">Debug Panel</h3>
        <button
          onClick={() => {
            const debugPanel = document.querySelector('.debug-panel');
            if (debugPanel) {
              debugPanel.classList.toggle('max-h-80');
              debugPanel.classList.toggle('h-8');
            }
          }}
          className="text-xs bg-gray-300 px-2 py-1 rounded hover:bg-gray-400"
        >
          Toggle
        </button>
      </div>
      
      <div className="space-y-1">
        <div>
          <strong>User ID:</strong> {userProfile?.id || 'Not set'}
        </div>
        <div>
          <strong>User Name:</strong> {userProfile?.name || 'Not set'}
        </div>
        <div>
          <strong>Activities Count:</strong> {activities.length}
        </div>
        {error && (
          <div className="text-red-500">
            <strong>Error:</strong> {error}
          </div>
        )}
        <div>
          <strong>LocalStorage:</strong><br/>
          <div className="bg-gray-200 p-1 rounded text-[10px] break-all">
            userId: {localStorage.getItem('currentUserId') || 'Not set'}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mt-3">
        <button 
          onClick={() => fetchActivities()} 
          className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 text-xs"
        >
          Refresh Activities
        </button>
        
        {debugDataAssociations && (
          <button 
            onClick={() => debugDataAssociations()} 
            className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 text-xs"
          >
            Debug Data
          </button>
        )}
        
        <button 
          onClick={debugData}
          className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 text-xs"
        >
          Check Database
        </button>
        
        <button 
          onClick={fixUserIdFormat}
          className="bg-orange-500 text-white px-2 py-1 rounded hover:bg-orange-600 text-xs"
        >
          Fix Activities
        </button>
        
        <button 
          onClick={() => console.log('User:', userProfile, 'Activities:', activities)}
          className="bg-purple-500 text-white px-2 py-1 rounded hover:bg-purple-600 text-xs"
        >
          Log State
        </button>
        
        <button 
          onClick={createDebugEndpoint}
          className="bg-indigo-500 text-white px-2 py-1 rounded hover:bg-indigo-600 text-xs"
        >
          Export Debug
        </button>
        
        <button 
          onClick={clearLocalStorage}
          className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-xs col-span-2"
        >
          Clear Storage
        </button>
      </div>
    </div>
  );
}