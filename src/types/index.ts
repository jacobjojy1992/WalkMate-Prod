// src/types/index.ts

// Re-export existing types (replace these with your actual type file exports)
export * from './user';
export * from './activity';

// Export API types
export * from './api';

// Type conversion utilities
import { ApiUser } from './api';
import { UserProfile } from './user';
import { WalkActivity } from './activity';
import { ApiWalk } from './api';

export const convertApiUserToUserProfile = (apiUser: ApiUser): UserProfile => {
  return {
    id: apiUser.id,
    name: apiUser.name,
    dailyGoal: {
      type: apiUser.goalType as 'steps' | 'distance',
      value: apiUser.goalValue
    }
  };
};

export const convertApiWalkToWalkActivity = (apiWalk: ApiWalk): WalkActivity => {
  return {
    id: apiWalk.id,
    userId: apiWalk.userId,
    steps: apiWalk.steps,
    distance: apiWalk.distance,
    duration: apiWalk.duration,
    date: apiWalk.date.split('T')[0], // Get just the date part
    timestamp: apiWalk.date  // Use the full ISO string for timestamp
  };
};