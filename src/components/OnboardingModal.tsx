// src/components/OnboardingModal.tsx
'use client';

import { useState } from 'react';
import { useWalkContext } from '@/contexts/WalkContext';

interface OnboardingModalProps {
  onClose: () => void;
}

export default function OnboardingModal({ onClose }: OnboardingModalProps) {
  const { setUserProfile } = useWalkContext();
  const [name, setName] = useState('');
  const [goalType, setGoalType] = useState<'steps' | 'distance'>('steps');
  const [goalValue, setGoalValue] = useState(10000); // Default: 10,000 steps
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create user profile
    setUserProfile({
      name,
      dailyGoal: {
        type: goalType,
        value: goalValue
      }
    });
    
    // Close the modal
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Welcome to WalkMate!</h2>
        <p className="mb-4">Please tell us a bit about yourself to get started.</p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 bg-gray-700 rounded text-white"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block mb-2">Daily Goal Type</label>
            <select
              value={goalType}
              onChange={(e) => setGoalType(e.target.value as 'steps' | 'distance')}
              className="w-full p-2 bg-gray-700 rounded text-white"
            >
              <option value="steps">Steps</option>
              <option value="distance">Distance (meters)</option>
            </select>
          </div>
          
          <div className="mb-6">
            <label className="block mb-2">Goal Value</label>
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
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded"
          >
            Get Started
          </button>
        </form>
      </div>
    </div>
  );
}