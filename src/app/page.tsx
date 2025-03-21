// src/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useWalkContext } from '@/contexts/WalkContext';
import OnboardingModal from '@/components/OnboardingModal';
import Header from '@/components/Header';
import StatsPanel from '@/components/StatsPanel';
import ActivityLogForm from '@/components/ActivityLogForm';
import CalendarView from '@/components/CalendarView';
import RecentActivity from '@/components/RecentActivity';

export default function Home() {
  const { userProfile } = useWalkContext();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Check for user profile existence - both in context and localStorage
  useEffect(() => {
    // Function to check if we need to show onboarding
    const checkUserProfile = () => {
      console.log("Checking if we need to show onboarding, userProfile:", userProfile);
      
      // If we have a user profile in context, no need for onboarding
      if (userProfile) {
        console.log("User profile found in context, hiding onboarding");
        setShowOnboarding(false);
        setIsInitializing(false);
        return;
      }
      
      // Double-check localStorage as backup
      const savedUserIdInStorage = localStorage.getItem('currentUserId');
      const savedProfileInStorage = localStorage.getItem('userProfile');
      
      console.log("Checking localStorage:", { 
        savedUserIdInStorage, 
        savedProfileInStorage 
      });
      
      if (savedProfileInStorage && savedUserIdInStorage) {
        console.log("User data found in localStorage, hiding onboarding");
        setShowOnboarding(false);
      } else {
        console.log("No user data found, showing onboarding");
        setShowOnboarding(true);
      }
      
      setIsInitializing(false);
    };
    
    // Small delay to allow WalkContext to initialize from localStorage
    const timeoutId = setTimeout(checkUserProfile, 100);
    
    return () => clearTimeout(timeoutId);
  }, [userProfile]);

  // Handle date selection from calendar
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  // Wait until initialization is complete before rendering
  if (isInitializing) {
    return <div className="flex justify-center items-center h-screen">
      <div className="animate-spin h-8 w-8 border-4 border-indigo-500 rounded-full border-t-transparent"></div>
    </div>;
  }

  return (
    <main className="container mx-auto p-4 max-w-5xl">
      <Header />
      
      {showOnboarding ? (
        <OnboardingModal onClose={() => setShowOnboarding(false)} />
      ) : (
        <>
          <StatsPanel selectedDate={selectedDate} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ActivityLogForm />
            <CalendarView onDateSelect={handleDateSelect} />
          </div>
          <RecentActivity />
        </>
      )}
    </main>
  );
}