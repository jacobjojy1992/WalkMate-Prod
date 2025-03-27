// api/users/route.js
import { NextResponse } from 'next/server';
import prisma from '../../lib/prisma';

export async function GET() {
  try {
    console.log('GET /api/users: Fetching all users');
    const users = await prisma.user.findMany();
    console.log(`GET /api/users: Found ${users.length} users`);
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error in GET /api/users:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    console.log('POST /api/users: Creating new user');
    const data = await request.json();
    console.log('POST /api/users: Request data:', data);
    
    const user = await prisma.user.create({
      data: {
        name: data.name,
        goalType: data.goalType || 'steps',
        goalValue: data.goalValue || 10000,
      },
    });
    
    console.log('POST /api/users: User created:', user.id);
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/users:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}