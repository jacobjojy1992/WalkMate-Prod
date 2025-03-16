// src/types/activity.ts
export interface WalkActivity {
    id?: string;
    userId?: string;
    steps: number;
    distance: number;
    duration: number;
    date: string;
    timestamp: string;
  }