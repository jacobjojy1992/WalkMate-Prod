import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    console.log('GET /api/walks - userId parameter:', userId);
    
    if (!userId) {
      console.log('GET /api/walks - Missing userId parameter');
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`Fetching walks for userId: ${userId}`);
    const walks = await prisma.walk.findMany({
      where: { userId: userId.toString() },
      orderBy: { date: 'desc' },
    });
    
    console.log(`Found ${walks.length} walks for user ${userId}`);
    return NextResponse.json(walks);
  } catch (error) {
    console.error('Error fetching walks:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    console.log('POST to /api/walks - Processing request');
    
    const data = await request.json();
    console.log('Received walk data:', data);
    
    // Check if userId exists
    if (!data.userId) {
      console.log('POST /api/walks - Missing userId in request body');
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Format userId as string to ensure consistency
    const userIdString = data.userId.toString();
    
    // Validate the user exists before creating a walk
    try {
      const userExists = await prisma.user.findUnique({
        where: { id: userIdString }
      });
      
      if (!userExists) {
        console.log(`User with ID ${userIdString} not found in database`);
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      
      console.log(`Verified user ${userIdString} exists`);
    } catch (userCheckError) {
      console.error('Error checking user existence:', userCheckError);
      // Continue with walk creation even if user check fails
    }
    
    // Create the walk with the provided userId (no fallback)
    console.log('Creating walk with data:', {
      steps: data.steps,
      distance: data.distance,
      duration: data.duration,
      date: data.date ? new Date(data.date) : new Date(),
      userId: userIdString
    });
    
    const walk = await prisma.walk.create({
      data: {
        steps: data.steps,
        distance: data.distance,
        duration: data.duration,
        date: data.date ? new Date(data.date) : new Date(),
        userId: userIdString,
      },
    });
    
    console.log('Walk created successfully:', walk);
    return NextResponse.json(walk, { status: 201 });
  } catch (error) {
    console.error('Error creating walk:', error);
    
    // Provide more detailed error information
    const errorDetails = {
      message: error.message,
      code: error.code,
      meta: error.meta,
    };
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        details: error.message,
        errorInfo: errorDetails 
      },
      { status: 500 }
    );
  }
}

// Add PATCH handler for updating walks
export async function PATCH(request) {
  try {
    const { searchParams } = new URL(request.url);
    const walkId = searchParams.get('id');
    
    if (!walkId) {
      return NextResponse.json(
        { error: 'Walk ID is required' },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    
    // Only update fields that are provided
    const updateData = {};
    if (data.steps !== undefined) updateData.steps = data.steps;
    if (data.distance !== undefined) updateData.distance = data.distance;
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.date !== undefined) updateData.date = new Date(data.date);
    if (data.userId !== undefined) updateData.userId = data.userId.toString();
    
    const walk = await prisma.walk.update({
      where: { id: walkId },
      data: updateData,
    });
    
    console.log(`Walk ${walkId} updated successfully`);
    return NextResponse.json(walk);
  } catch (error) {
    console.error('Error updating walk:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}

// Add DELETE handler for removing walks
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const walkId = searchParams.get('id');
    
    if (!walkId) {
      return NextResponse.json(
        { error: 'Walk ID is required' },
        { status: 400 }
      );
    }
    
    await prisma.walk.delete({
      where: { id: walkId },
    });
    
    console.log(`Walk ${walkId} deleted successfully`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting walk:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}