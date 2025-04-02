'use client';

import { useEffect, useState } from 'react';
import { useWalkContext } from '@/contexts/WalkContext';
import OnboardingModal from '@/components/OnboardingModal';
import Header from '@/components/Header';
import StatsPanel from '@/components/StatsPanel';
import ActivityLogForm from '@/components/ActivityLogForm';
import CalendarView from '@/components/CalendarView';
import RecentActivity from '@/components/RecentActivity';
import DebugPanel from '@/components/DebugPanel';

export default function Home() {
  const { userProfile, isLoading } = useWalkContext();
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    // Only determine onboarding status after context is loaded
    if (!isLoading) {
      const setupComplete = localStorage.getItem('walkmateSetupComplete') === 'true';
      const shouldShowOnboarding = !setupComplete || !userProfile;
      
      console.log('Page state check:', {
        setupComplete,
        hasUserProfile: !!userProfile,
        shouldShowOnboarding,
        isLoading
      });

      setShowOnboarding(shouldShowOnboarding);
    }
  }, [isLoading, userProfile, showOnboarding]); // Added showOnboarding to deps

  // Handle date selection from calendar
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  // Show loading spinner while determining state
  if (showOnboarding === null) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <main className="container mx-auto p-4 max-w-5xl">
      <Header />
      
      {showOnboarding ? (
        <OnboardingModal 
          onClose={() => {
            setShowOnboarding(false);
            localStorage.setItem('walkmateSetupComplete', 'true');
          }} 
        />
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
      
      {process.env.NODE_ENV === 'development' && <DebugPanel />}
    </main>
  );
}