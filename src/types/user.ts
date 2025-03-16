// src/types/user.ts
export interface UserProfile {
    id?: string;
    name: string;
    dailyGoal: {
      type: 'steps' | 'distance';
      value: number;
    };
  }