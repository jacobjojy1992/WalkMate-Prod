// api/walks/route.js
import { NextResponse } from 'next/server';
import prisma from '../../lib/prisma';

export async function GET(request) {
  try {
    console.log('GET /api/walks: Processing request');
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    console.log(`GET /api/walks: Searching for walks with userId: ${userId}`);
    
    if (!userId) {
      console.log('GET /api/walks: No userId provided');
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    const walks = await prisma.walk.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
    
    console.log(`GET /api/walks: Found ${walks.length} walks for user ${userId}`);
    return NextResponse.json(walks);
  } catch (error) {
    console.error('Error in GET /api/walks:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    console.log('POST /api/walks: Creating new walk');
    const data = await request.json();
    console.log('POST /api/walks: Request data:', data);
    
    const walk = await prisma.walk.create({
      data: {
        steps: data.steps,
        distance: data.distance,
        duration: data.duration,
        date: data.date ? new Date(data.date) : new Date(),
        userId: data.userId,
      },
    });
    
    console.log('POST /api/walks: Walk created:', walk.id);
    return NextResponse.json(walk, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/walks:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}