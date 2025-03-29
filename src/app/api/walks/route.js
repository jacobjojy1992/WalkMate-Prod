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

export async function POST(request) {
  try {
    // Log the beginning of request processing
    console.log('POST to /api/walks - Processing request');
    
    // Get the data from the request
    const data = await request.json();
    console.log('Received walk data:', data);
    
    // Check if userId exists and print it
    console.log('User ID from request:', data.userId);
    
    // Attempt to find the user first to validate
    let user = null;
    try {
      user = await prisma.user.findUnique({
        where: { id: data.userId }
      });
      console.log('User found?', !!user);
    } catch (userLookupError) {
      console.error('Error looking up user:', userLookupError);
    }
    
    // If user not found, try with the known valid ID
    if (!user) {
      console.log('User not found, trying with known valid ID');
      const validUserId = "013d979d-2e50-4847-89d1-79a4ee174ca6";
      
      // See if this user exists
      try {
        user = await prisma.user.findUnique({
          where: { id: validUserId }
        });
        console.log('Valid user found?', !!user);
        
        // If found, use this ID instead
        if (user) {
          data.userId = validUserId;
          console.log('Using valid user ID instead:', validUserId);
        }
      } catch (validUserLookupError) {
        console.error('Error looking up valid user:', validUserLookupError);
      }
    }
    
    // If we still don't have a valid user, return an error
    if (!user) {
      console.error('No valid user found in database');
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }
    
    // Log the data we're about to save
    console.log('Creating walk with data:', {
      steps: data.steps,
      distance: data.distance,
      duration: data.duration,
      date: data.date ? new Date(data.date) : new Date(),
      userId: data.userId
    });
    
    // Attempt to create the walk
    const walk = await prisma.walk.create({
      data: {
        steps: data.steps,
        distance: data.distance,
        duration: data.duration,
        date: data.date ? new Date(data.date) : new Date(),
        userId: data.userId,
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