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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Show onboarding modal if no user profile exists
  useEffect(() => {
    if (!userProfile) {
      setShowOnboarding(true);
    }
  }, [userProfile]);
  
  // Handle date selection from calendar
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };
  
  return (
    <div>
      <Header />
      
      <StatsPanel selectedDate={selectedDate} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ActivityLogForm />
        <CalendarView onDateSelect={handleDateSelect} />
      </div>
      
      <RecentActivity />
      
      {showOnboarding && (
        <OnboardingModal onClose={() => setShowOnboarding(false)} />
      )}
    </div>
  );
}