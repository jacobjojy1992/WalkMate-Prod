// src/server/tests/apiTest.ts
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

// Type definitions for API responses
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

interface User {
  id: string;
  name: string;
  goalType: string;
  goalValue: number;
  createdAt: string;
  updatedAt: string;
}

interface Walk {
  id: string;
  steps: number;
  distance: number;
  duration: number;
  date: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface WeeklyReport {
  startDate: string;
  endDate: string;
  dailyData: Array<{
    date: string;
    steps: number;
    distance: number;
    duration: number;
    goalMet: boolean;
  }>;
  weeklyTotals: {
    totalSteps: number;
    totalDistance: number;
    totalDuration: number;
    daysActive: number;
    daysGoalMet: number;
  };
}

interface WalkStats {
  totalWalks: number;
  totalSteps: number;
  totalDistance: number;
  totalDuration: number;
  averageStepsPerWalk: number;
  averageDistancePerWalk: number;
  averageDurationPerWalk: number;
  startDate: string;
  endDate: string;
}

async function testUserEndpoints(): Promise<string> {
  try {
    console.log('Testing user endpoints...');
    
    // Test GET all users
    console.log('1. Testing GET all users');
    const getAllUsersResponse = await axios.get<ApiResponse<User[]>>(`${API_URL}/users`);
    console.log('Response:', getAllUsersResponse.data);
    
    // Create a user
    console.log('2. Testing POST create user');
    const createUserResponse = await axios.post<ApiResponse<User>>(`${API_URL}/users`, {
      name: 'Test User',
      goalType: 'steps',
      goalValue: 10000
    });
    console.log('Response:', createUserResponse.data);
    
    const userId = createUserResponse.data.data.id;
    
    // Get user by ID
    console.log('3. Testing GET user by ID');
    const getUserResponse = await axios.get<ApiResponse<User>>(`${API_URL}/users/${userId}`);
    console.log('Response:', getUserResponse.data);
    
    // Update user
    console.log('4. Testing PUT update user');
    const updateUserResponse = await axios.put<ApiResponse<User>>(`${API_URL}/users/${userId}`, {
      name: 'Updated Test User',
      goalValue: 12000
    });
    console.log('Response:', updateUserResponse.data);
    
    // Get user streak
    console.log('5. Testing GET user streak');
    const getStreakResponse = await axios.get<ApiResponse<{streak: number}>>(`${API_URL}/users/${userId}/streak`);
    console.log('Response:', getStreakResponse.data);
    
    // Get weekly report
    console.log('6. Testing GET weekly report');
    const getReportResponse = await axios.get<ApiResponse<WeeklyReport>>(`${API_URL}/users/${userId}/weekly-report`);
    console.log('Response:', getReportResponse.data);
    
    return userId;
  } catch (error) {
    console.error('Error testing user endpoints:', error);
    throw error;
  }
}

async function testWalkEndpoints(userId: string): Promise<string> {
  try {
    console.log('\nTesting walk endpoints...');
    
    // Create a walk
    console.log('1. Testing POST create walk');
    const createWalkResponse = await axios.post<ApiResponse<Walk>>(`${API_URL}/walks`, {
      userId,
      steps: 5000,
      distance: 3.5,
      duration: 45,
      date: new Date().toISOString()
    });
    console.log('Response:', createWalkResponse.data);
    
    const walkId = createWalkResponse.data.data.id;
    
    // Get user walks
    console.log('2. Testing GET user walks');
    const getUserWalksResponse = await axios.get<ApiResponse<Walk[]>>(`${API_URL}/walks/user/${userId}`);
    console.log('Response:', getUserWalksResponse.data);
    
    // Get walks by date
    const today = new Date().toISOString().split('T')[0];
    console.log(`3. Testing GET walks by date (${today})`);
    const getWalksByDateResponse = await axios.get<ApiResponse<Walk[]>>(`${API_URL}/walks/user/${userId}/date/${today}`);
    console.log('Response:', getWalksByDateResponse.data);
    
    // Update walk
    console.log('4. Testing PUT update walk');
    const updateWalkResponse = await axios.put<ApiResponse<Walk>>(`${API_URL}/walks/${walkId}`, {
      steps: 6000,
      distance: 4.2
    });
    console.log('Response:', updateWalkResponse.data);
    
    // Get walk stats
    console.log('5. Testing GET walk stats');
    const getWalkStatsResponse = await axios.get<ApiResponse<WalkStats>>(`${API_URL}/walks/user/${userId}/stats`);
    console.log('Response:', getWalkStatsResponse.data);
    
    // Delete walk
    console.log('6. Testing DELETE walk');
    const deleteWalkResponse = await axios.delete<ApiResponse<{message: string}>>(`${API_URL}/walks/${walkId}`);
    console.log('Response:', deleteWalkResponse.data);
    
    return walkId;
  } catch (error) {
    console.error('Error testing walk endpoints:', error);
    throw error;
  }
}

// Run the tests
async function runTests(): Promise<void> {
  try {
    // Check if server is running
    console.log('Checking if API server is running...');
    try {
      await axios.get(`${API_URL}/health`);
      console.log('API server is running!');
    } catch (serverError) {
      console.error('API server is not running at', API_URL);
      console.error('Please start your server before running tests.')
      if (serverError instanceof Error) {
        console.error('Error details:', serverError.message);
      } else {
        console.error('Unknown error occurred');
      }
      return;
    }
    
    const userId = await testUserEndpoints();
    await testWalkEndpoints(userId);
    console.log('\nAll tests completed successfully!');
  } catch (testError) {
    console.error('\nTests failed:', testError);
  }
}

// Only run tests if this file is executed directly
if (require.main === module) {
  runTests();
}