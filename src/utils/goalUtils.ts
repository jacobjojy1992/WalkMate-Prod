// src/utils/goalUtils.ts

/**
 * Determines if a goal has been achieved based on current value and goal value.
 * Uses integer conversion to avoid floating-point precision issues across browsers.
 * 
 * @param currentValue The current value achieved (steps, distance, etc.)
 * @param goalValue The target goal value
 * @returns boolean True if the goal is considered achieved
 */
export const isGoalAchieved = (
  currentValue: number, 
  goalValue: number
): boolean => {
  if (!Number.isFinite(goalValue) || goalValue <= 0) return false;
  
  // Convert to integers to avoid floating point precision issues
  // Multiply by 1000 to preserve 3 decimal places of precision
  const scaledCurrent = Math.floor(currentValue * 1000);
  const scaledGoal = Math.floor(goalValue * 1000);
  
  // Now compare the integer values
  return scaledCurrent >= scaledGoal;
};

/**
 * Calculates the percentage progress toward a goal, with special handling for
 * values very close to the goal to ensure they display correctly across browsers.
 * 
 * @param currentValue The current value achieved (steps, distance, etc.)
 * @param goalValue The target goal value
 * @returns number The percentage progress toward the goal (0-100)
 */
export const calculateGoalProgress = (
  currentValue: number, 
  goalValue: number
): number => {
  if (!Number.isFinite(goalValue) || goalValue <= 0) return 0;
  
  // Convert to integers with 3 decimal places precision
  const scaledCurrent = Math.floor(currentValue * 1000);
  const scaledGoal = Math.floor(goalValue * 1000);
  
  // Calculate percentage using integer values
  const percentage = (scaledCurrent / scaledGoal) * 100;
  
  // Only show 100% when truly achieved
  if (scaledCurrent >= scaledGoal) {
    return 100;
  }
  
  // Otherwise cap at 99%
  return Math.min(99, Math.round(percentage));
};