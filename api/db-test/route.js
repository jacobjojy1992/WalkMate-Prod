// api/db-test/route.js
import { NextResponse } from 'next/server';

export async function GET() {
  // Import pg dynamically to avoid build issues
  const { Pool } = await import('pg');
  
  try {
    console.log('Testing direct database connection with pg...');
    
    // Get database URL and mask it for logging
    const dbUrl = process.env.DATABASE_URL || 'Not set';
    const maskedUrl = dbUrl.replace(/:[^:@]+@/, ':***@');
    console.log('Database URL (masked):', maskedUrl);
    
    // Create a connection pool
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    // Test with a simple query
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    
    console.log('Direct pg connection successful');
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connection successful using pg directly',
      time: result.rows[0].now,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Direct database connection error:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Database connection failed using pg directly',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}