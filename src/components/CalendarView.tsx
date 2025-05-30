// src/components/CalendarView.tsx
'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useWalkContext } from '@/contexts/WalkContext';
import { format, isAfter } from 'date-fns';
import { isGoalAchieved } from '@/utils/goalUtils';
import 'react-calendar/dist/Calendar.css';

// Import Calendar dynamically with SSR disabled
const Calendar = dynamic(
  () => import('react-calendar'),
  { ssr: false }
);
interface CalendarProps {
  onDateSelect: (date: Date) => void;
}

export default function CalendarView({ onDateSelect }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const { activities, userProfile } = useWalkContext();
  
  // Check if a date has activities
  const hasActivities = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return activities.some(activity => activity.date.startsWith(dateString));
  };
  
  // Check if goal was met on a specific date - with improved precision handling
  const wasGoalMet = (date: Date) => {
    if (!userProfile?.dailyGoal) return false;
    
    const dateString = format(date, 'yyyy-MM-dd');
    const dayActivities = activities.filter(activity => 
      activity.date.startsWith(dateString)
    );
    
    if (dayActivities.length === 0) return false;
    
    const { type, value } = userProfile.dailyGoal;
    
    let totalValue = 0;
    
    if (type === 'steps') {
      totalValue = dayActivities.reduce((sum, activity) => 
        sum + (Number.isFinite(activity.steps) ? activity.steps : 0), 0);
      return isGoalAchieved(totalValue, value);
    } else {
      totalValue = dayActivities.reduce((sum, activity) => 
        sum + (Number.isFinite(activity.distance) ? activity.distance : 0), 0);
      return isGoalAchieved(totalValue, value);
    }
    
    // Use a slightly more permissive threshold for calendar markers
    // This ensures visual consistency with the main display
 
  };
  
  // Custom tile content - add indicators for activity dates and goal completion
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null;
    
    // Don't show indicators for future dates
    if (isAfter(date, new Date())) return null;
    
    const hasActivity = hasActivities(date);
    const goalMet = wasGoalMet(date);
    
    if (hasActivity) {
      return (
        <div className="flex justify-center mt-1">
          <div 
            className={`h-2 w-2 rounded-full ${goalMet ? 'bg-green-500' : 'bg-indigo-500'}`}
            title={goalMet ? "Goal met" : "Activity logged"}
          />
        </div>
      );
    }
    
    return null;
  };
  
  // Disable future dates
  const tileDisabled = ({ date }: { date: Date }) => {
    return isAfter(date, new Date());
  };
  
  return (
    <div className="mb-8">
      <style jsx global>{`
        /* Override react-calendar styles to match our dark theme */
        .react-calendar {
          width: 100%;
          background-color: #1f2937; /* gray-800 */
          border: none;
          border-radius: 0.5rem;
          font-family: inherit;
          line-height: 1.5;
        }
        .react-calendar__navigation button {
          color: white;
          font-size: 1rem;
          margin-top: 0.5rem;
        }
        .react-calendar__navigation button:enabled:hover,
        .react-calendar__navigation button:enabled:focus {
          background-color: #374151; /* gray-700 */
        }
        /* Disabled navigation buttons */
        .react-calendar__navigation button:disabled {
          color: #4b5563; /* gray-600, darker than the current gray-500 */
          background-color: #1f2937; /* Match the calendar background */
          opacity: 0.5; /* Add some transparency */
        }

        /* Hovering over disabled navigation buttons shouldn't change their appearance */
        .react-calendar__navigation button:disabled:hover,
        .react-calendar__navigation button:disabled:focus {
          background-color: #1f2937; /* Keep the same background on hover */
        }  
          
        .react-calendar__month-view__weekdays {
          color: #9ca3af; /* gray-400 */
          font-weight: 500;
          text-transform: uppercase;
          font-size: 0.75rem;
          padding: 0.5rem 0;
        }
        .react-calendar__month-view__weekdays__weekday {
          padding: 0.5rem;
        }
        .react-calendar__month-view__weekdays__weekday abbr {
          text-decoration: none;
        }
        .react-calendar__tile {
          color: white;
          padding: 0.75rem 0.5rem;
        }
        .react-calendar__tile:enabled:hover,
        .react-calendar__tile:enabled:focus {
          background-color: #374151; /* gray-700 */
        }
        .react-calendar__tile--active {
          background-color: #4f46e5 !important; /* indigo-600 */
        }
        .react-calendar__tile--now {
          background-color: #374151; /* gray-700 */
        }
        /* Disabled (future) dates */
        .react-calendar__tile:disabled {
          color: #4b5563; /* gray-600, darker than the current gray-500 */
          background-color: #1f2937; /* Match the calendar background */
          cursor: not-allowed;
          opacity: 0.5; /* Add some transparency */
        }
      `}</style>
      
      <h2 className="text-xl font-semibold mb-4">Calendar- Stats View</h2>
      
      <Calendar
        onChange={(value) => {
          if (value instanceof Date) {
            setCurrentDate(value);
            onDateSelect(value);
          }
        }}
        value={currentDate}
        tileContent={tileContent}
        tileDisabled={tileDisabled}
        maxDate={new Date()}
      />
      
      {/* Calendar Legend */}
      <div className="mt-2 text-xs flex justify-end space-x-4">
        <div className="flex items-center">
          <div className="h-2 w-2 rounded-full bg-indigo-500 mr-1"></div>
          <span>Activity</span>
        </div>
        <div className="flex items-center">
          <div className="h-2 w-2 rounded-full bg-green-500 mr-1"></div>
          <span>Goal Met</span>
        </div>
      </div>
    </div>
  );
}