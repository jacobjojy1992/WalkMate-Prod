import { ApiUserProfile } from '@/types';

/**
 * Get or create a device-specific user ID
 */
export const getOrCreateDeviceId = (): string => {
  // Check if we already have a device ID
  const storedId = localStorage.getItem('currentUserId');
  
  // If no ID exists or it's empty, create a new one
  if (!storedId) {
    // Create a new device ID
    const newId = 'device_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('currentUserId', newId);
    return newId;
  }
  
  return storedId;
};

/**
 * Get the user profile from localStorage
 */
export const getUserProfileFromLocalStorage = (): ApiUserProfile | null => {
  const profileJson = localStorage.getItem('walkmateUserProfile');
  if (!profileJson) return null;
  
  try {
    return JSON.parse(profileJson);
  } catch (e) {
    console.error('Error parsing user profile from localStorage:', e);
    return null;
  }
};

/**
 * Save or update the user profile in localStorage
 */
export const saveUserProfileToLocalStorage = (profile: ApiUserProfile): void => {
  localStorage.setItem('walkmateUserProfile', JSON.stringify(profile));
  // Only save the ID if it exists
  if (profile.id) {
    localStorage.setItem('currentUserId', profile.id);
  }
};

/**
 * Clear all WalkMate data from localStorage and return to onboarding
 */
export const clearWalkmateData = (): void => {
  const keys = [
    'walkmateUserProfile',
    'currentUserId',
    'walkActivities'
  ];
  
  keys.forEach(key => localStorage.removeItem(key));
};