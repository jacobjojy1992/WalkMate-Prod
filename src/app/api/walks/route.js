// src/app/api/walks/route.js
import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    const walks = await prisma.walk.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
    
    return NextResponse.json(walks);
  } catch (error) {
    console.error('Error fetching walks:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
// In your /api/walks/route.js
export async function POST(request) {
  try {
    const data = await request.json();
    console.log('Received walk data:', data);
    
    // Validate userId exists
    const user = await prisma.user.findUnique({
      where: { id: data.userId }
    });
    
    if (!user) {
      console.error(`User ID ${data.userId} not found in database`);
      return NextResponse.json(
        { error: `User ID ${data.userId} not found` },
        { status: 404 }
      );
    }
    
    // Continue with walk creation
    const walk = await prisma.walk.create({
      data: {
        steps: data.steps,
        distance: data.distance,
        duration: data.duration,
        date: data.date ? new Date(data.date) : new Date(),
        userId: data.userId,
      },
    });
    
    return NextResponse.json(walk, { status: 201 });
  } catch (error) {
    console.error('Error creating walk:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}