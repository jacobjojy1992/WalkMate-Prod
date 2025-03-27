// src/app/api/debug/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function GET() {
  try {
    // Log environment details
    console.log('Node environment:', process.env.NODE_ENV);
    
    // Log database URL (with masked password for security)
    const dbUrl = process.env.DATABASE_URL || 'Not set';
    const maskedUrl = dbUrl.replace(/:[^:@]+@/, ':***@');
    console.log('Database URL (masked):', maskedUrl);
    
    // Create a new Prisma client for testing
    const prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
    
    // Test connection with a simple query
    console.log('Attempting database connection...');
    const userCount = await prisma.user.count();
    console.log('Connection successful, user count:', userCount);
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connection successful',
      environment: process.env.NODE_ENV,
      databaseUrl: maskedUrl,
      userCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database connection error:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message,
      errorCode: error.code,
      errorType: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}