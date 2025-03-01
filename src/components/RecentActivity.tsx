// src/components/RecentActivity.tsx
'use client';

import { useWalkContext } from '@/contexts/WalkContext';
import { format, parseISO } from 'date-fns';

export default function RecentActivity() {
  const { activities } = useWalkContext();
  
  // Sort activities by timestamp (most recent first) and take the latest 5
  const recentActivities = [...activities]
    .sort((a, b) => {
      // First sort by date (newer dates first)
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      
      if (dateA !== dateB) {
        return dateB - dateA; // Descending date order
      }
      
      // If same date, sort by timestamp (newer timestamps first)
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA;
    })
    .slice(0, 10);
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray-800 rounded-lg">
          <thead>
            <tr>
              <th className="py-3 px-4 text-left text-gray-400 font-medium">Date</th>
              <th className="py-3 px-4 text-left text-gray-400 font-medium">Time</th>
              <th className="py-3 px-4 text-left text-gray-400 font-medium">Steps</th>
              <th className="py-3 px-4 text-left text-gray-400 font-medium">Distance (m)</th>
              <th className="py-3 px-4 text-left text-gray-400 font-medium">Duration (min)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <tr key={activity.id || index}>
                  <td className="py-3 px-4">{format(parseISO(activity.date), 'MMM d, yyyy')}</td>
                  <td className="py-3 px-4">{format(parseISO(activity.timestamp), 'h:mm a')}</td>
                  <td className="py-3 px-4">{Math.round(activity.steps).toLocaleString()}</td>
                  <td className="py-3 px-4">{Math.round(activity.distance).toLocaleString()}</td>
                  <td className="py-3 px-4">{Math.round(activity.duration)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-4 px-4 text-center text-gray-400">
                  No activities logged yet. Start walking and log your progress!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}