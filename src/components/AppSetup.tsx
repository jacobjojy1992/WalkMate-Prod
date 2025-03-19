// src/components/AppSetup.tsx
'use client';

import { useEffect, useState } from 'react';
import { useWalkContext } from '@/contexts/WalkContext';
import OnboardingModal from './OnboardingModal';

export default function AppSetup({ children }: { children: React.ReactNode }) {
  const { userProfile, isLoading, error } = useWalkContext();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Handle app initialization
  useEffect(() => {
    if (!isLoading && !initialized) {
      setInitialized(true);
      
      // If no user profile is loaded after initialization, show onboarding
      if (!userProfile) {
        // Add a small delay to ensure context has fully loaded
        const timer = setTimeout(() => {
          setShowOnboarding(true);
        }, 500);
        
        return () => clearTimeout(timer);
      }
    }
  }, [isLoading, userProfile, initialized]);

  // During initial loading, show a loading spinner
  if (isLoading && !initialized) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-12 w-12 text-indigo-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-white">Loading your WalkMate data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      
      {showOnboarding && (
        <OnboardingModal onClose={() => setShowOnboarding(false)} />
      )}
      
      {/* Display global error if any */}
      {error && !showOnboarding && (
        <div className="fixed bottom-4 right-4 bg-red-900/90 text-white p-4 rounded-lg shadow-lg max-w-xs">
          <h3 className="font-bold mb-1">Error</h3>
          <p className="text-sm">{error}</p>
          <button 
            className="absolute top-2 right-2 text-white hover:text-red-200"
            onClick={() => {/* handle error dismissal */}}
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}