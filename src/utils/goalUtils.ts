// src/utils/goalUtils.ts
/**
 * Determines if a goal has been achieved based on current value and goal value.
 * Uses a small tolerance (0.9995) to account for floating-point imprecision.
 * 
 * @param currentValue The current value achieved (steps, distance, etc.)
 * @param goalValue The target goal value
 * @param tolerance Tolerance factor to handle near-exact matches (default: 0.9995 or 99.95%)
 * @returns boolean True if the goal is considered achieved
 */
export const isGoalAchieved = (
    currentValue: number, 
    goalValue: number, 
    tolerance = 0.9995
  ): boolean => {
    if (!Number.isFinite(goalValue) || goalValue <= 0) return false;
    return currentValue >= goalValue * tolerance;
  };
  
  /**
   * Calculates the percentage progress toward a goal, with special handling for
   * values very close to the goal to ensure they display as 100% complete.
   * 
   * @param currentValue The current value achieved (steps, distance, etc.)
   * @param goalValue The target goal value
   * @param tolerance Tolerance factor to handle near-exact matches (default: 0.9995 or 99.95%)
   * @returns number The percentage progress toward the goal (0-100)
   */
  export const calculateGoalProgress = (
    currentValue: number, 
    goalValue: number,
    tolerance = 0.9995
  ): number => {
    if (!Number.isFinite(goalValue) || goalValue <= 0) return 0;
    
    const ratio = currentValue / goalValue;
    // If within tolerance of the goal, consider it 100%
    return ratio >= tolerance ? 100 : Math.min(100, ratio * 100);
  };