// src/utils/goalUtils.ts - With stricter goal completion logic
export const isGoalAchieved = (
  currentValue: number, 
  goalValue: number
): boolean => {
  if (!Number.isFinite(goalValue) || goalValue <= 0) return false;
  
  // Only consider the goal achieved when the value actually meets or exceeds it
  return currentValue >= goalValue;
};

export const calculateGoalProgress = (
  currentValue: number, 
  goalValue: number
): number => {
  if (!Number.isFinite(goalValue) || goalValue <= 0) return 0;
  
  // Calculate raw percentage
  const percentage = (currentValue / goalValue) * 100;
  
  // Only show 100% when the goal is actually met or exceeded
  if (currentValue >= goalValue) {
    return 100;
  }
  
  // Otherwise, cap at 99% to make it clear the goal isn't quite reached
  return Math.min(99, Math.round(percentage));
};