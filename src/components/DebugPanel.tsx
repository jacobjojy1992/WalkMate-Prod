'use client';

import React from 'react';
import { useWalkContext } from '@/contexts/WalkContext';

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
          onClick={() => console.log('User:', userProfile, 'Activities:', activities)}
          className="bg-purple-500 text-white px-2 py-1 rounded hover:bg-purple-600 text-xs"
        >
          Log State
        </button>
        
        <button 
          onClick={clearLocalStorage}
          className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-xs"
        >
          Clear Storage
        </button>
      </div>
    </div>
  );
}