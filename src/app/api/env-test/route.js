// src/app/api/env-test/route.js
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if DATABASE_URL is set
    const dbUrl = process.env.DATABASE_URL || 'Not set';
    // Mask the password for security
    const maskedUrl = dbUrl.replace(/:[^:@]+@/, ':***@');
    
    // Check if NEXT_PUBLIC_API_URL is set
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'Not set';
    
    return NextResponse.json({
      status: 'success',
      environment: process.env.NODE_ENV,
      databaseUrlSet: dbUrl !== 'Not set',
      databaseUrlMasked: maskedUrl,
      apiUrl: apiUrl,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Error checking environment variables',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}