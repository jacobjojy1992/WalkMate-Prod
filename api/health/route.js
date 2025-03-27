// api/health/route.js
import { NextResponse } from 'next/server';
import prisma from '../../lib/prisma';

export async function GET() {
  try {
    // Simple query to test database connection
    const count = await prisma.user.count();
    return NextResponse.json({
      status: 'ok',
      dbConnection: 'successful',
      userCount: count,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json({
      status: 'error',
      dbConnection: 'failed',
      error: error.message,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}