// src/components/OnboardingModal.tsx
'use client';

import { useState } from 'react';
import { useWalkContext } from '@/contexts/WalkContext';

interface OnboardingModalProps {
  onClose: () => void;
}

export default function OnboardingModal({ onClose }: OnboardingModalProps) {
  const { setUserProfile, isLoading, error } = useWalkContext();
  const [name, setName] = useState('');
  const [goalType, setGoalType] = useState<'steps' | 'distance'>('steps');
  const [goalValue, setGoalValue] = useState(10000); // Default: 10,000 steps
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!name.trim()) {
      setFormError('Please enter your name');
      return;
    }
    
    if (goalValue <= 0) {
      setFormError('Please enter a valid goal value');
      return;
    }
    
    setFormError(null);
    setFormSubmitting(true);
    
    try {
      // Create user profile
      await setUserProfile({
        name: name.trim(),
        dailyGoal: {
          type: goalType,
          value: goalValue
        }
      });
      
      // Close the modal
      onClose();
    } catch (err) {
      console.error('Failed to save profile:', err);
      setFormError('Failed to save your profile. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  };
  
  // Determine if form is in loading state
  const isFormLoading = formSubmitting || isLoading;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Welcome to WalkMate!</h2>
        <p className="mb-4">Get Set Go!</p>
        
        {/* Error messages */}
        {(error || formError) && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-800 rounded text-red-200 text-sm">
            {formError || error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 bg-gray-700 rounded text-white"
              disabled={isFormLoading}
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block mb-2">Set Your Daily Goal Type</label>
            <select
              value={goalType}
              onChange={(e) => setGoalType(e.target.value as 'steps' | 'distance')}
              className="w-full p-2 bg-gray-700 rounded text-white"
              disabled={isFormLoading}
            >
              <option value="steps">Steps</option>
              <option value="distance">Distance (meters)</option>
            </select>
          </div>
          
          <div className="mb-6">
            <label className="block mb-2">Daily Goal</label>
            <input
              type="number"
              value={goalValue === 0 ? '' : goalValue}
              onChange={(e) => {
                // If the input is empty, set to 0 or empty string based on preference
                const value = e.target.value === '' ? 0 : Number(e.target.value);
                setGoalValue(value);
              }}
              className="w-full p-2 bg-gray-700 rounded text-white"
              min="1"
              disabled={isFormLoading}
              required
            />
          </div>
          
          <button
            type="submit"
            className={`w-full ${isFormLoading 
              ? 'bg-indigo-800 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700'
            } text-white py-2 rounded flex justify-center items-center`}
            disabled={isFormLoading}
          >
            {isFormLoading ? (
              <>
                <span className="mr-2">Saving...</span>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </>
            ) : (
              'Get Started'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}