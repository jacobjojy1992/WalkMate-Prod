import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

// GET handler with query parameter support for single user retrieval
export async function GET(request) {
  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    
    // If ID is provided, get a single user
    if (userId) {
      console.log(`Looking for user with ID: ${userId}`);
      
      // Standardize format - ensure string comparison
      const user = await prisma.user.findUnique({
        where: { id: userId.toString() }
      });
      
      if (!user) {
        console.log(`User ${userId} not found`);
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(user);
    }
    
    // If no ID is provided, get all users
    const users = await prisma.user.findMany();
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error getting user(s):', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}

// POST handler for creating new users
export async function POST(request) {
  try {
    const data = await request.json();
    console.log('Creating user with data:', data);
    
    // Validate required fields
    if (!data.name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }
    
    // Create user with default values if not provided
    const user = await prisma.user.create({
      data: {
        name: data.name,
        goalType: data.goalType || 'steps',
        goalValue: data.goalValue || 10000
      }
    });
    
    console.log('User created successfully:', user);
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}

// PUT handler for updating users with query parameter support
export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    console.log(`Updating user ${userId} with data:`, data);
    
    // Only update fields that are provided
    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.goalType !== undefined) updateData.goalType = data.goalType;
    if (data.goalValue !== undefined) updateData.goalValue = data.goalValue;
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });
    
    console.log('User updated successfully:', user);
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE handler with query parameter support
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    await prisma.user.delete({
      where: { id: userId }
    });
    
    console.log(`User ${userId} deleted successfully`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}