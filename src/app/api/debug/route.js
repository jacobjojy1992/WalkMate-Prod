import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function GET(request) {
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
    
    // NEW: Fetch all users and walks data
    console.log('Fetching users and walks data...');
    
    // Get all users
    const users = await prisma.user.findMany();
    console.log('Found users:', users.length);
    
    // Get all walks
    const walks = await prisma.walk.findMany();
    console.log('Found walks:', walks.length);
    
    // NEW: Identify orphaned walks (walks with user IDs that don't match any user)
    const orphanedWalks = [];
    
    for (const walk of walks) {
      // Check if this walk's userId matches any user's id
      const matchingUser = users.find(user => 
        user.id.toString() === walk.userId.toString()
      );
      
      if (!matchingUser) {
        orphanedWalks.push(walk);
      }
    }
    
    console.log('Found orphaned walks:', orphanedWalks.length);
    
    // NEW: Fix orphaned walks if requested
    const url = new URL(request.url);
    const fixRequested = url.searchParams.get('fix') === 'true';
    const fixResults = [];
    
    if (fixRequested && orphanedWalks.length > 0 && users.length > 0) {
      console.log('Attempting to fix orphaned walks...');
      
      // Use the first user as the default owner
      const defaultUser = users[0];
      
      // Fix each orphaned walk
      for (const walk of orphanedWalks) {
        try {
          // Store the updated walk to use in the response
          const updatedWalkResult = await prisma.walk.update({
            where: { id: walk.id },
            data: { userId: defaultUser.id }
          });
          
          fixResults.push({
            message: 'Fixed orphaned walk',
            walkId: walk.id,
            oldUserId: walk.userId,
            newUserId: defaultUser.id,
            success: true,
            updatedWalk: updatedWalkResult
          });
          
          console.log(`Fixed walk ${walk.id}: Changed userId from ${walk.userId} to ${defaultUser.id}`);
        } catch (updateError) {
          fixResults.push({
            message: 'Failed to fix orphaned walk',
            walkId: walk.id,
            error: updateError.message,
            success: false
          });
          
          console.error(`Failed to fix walk ${walk.id}:`, updateError);
        }
      }
    }
    
    // Format users and walks for response
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      goalType: user.goalType,
      goalValue: user.goalValue
    }));
    
    const formattedWalks = walks.map(walk => {
      const matchingUser = users.find(user => user.id.toString() === walk.userId.toString());
      
      return {
        id: walk.id,
        userId: walk.userId,
        steps: walk.steps,
        distance: walk.distance,
        duration: walk.duration,
        date: walk.date,
        hasValidUser: !!matchingUser,
        userName: matchingUser ? matchingUser.name : null
      };
    });
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connection successful',
      environment: process.env.NODE_ENV,
      databaseUrl: maskedUrl,
      userCount,
      timestamp: new Date().toISOString(),
      // NEW: Debug data
      summary: {
        userCount: users.length,
        walkCount: walks.length,
        orphanedWalkCount: orphanedWalks.length,
        fixedWalkCount: fixResults.length
      },
      users: formattedUsers,
      walks: formattedWalks,
      orphanedWalks: orphanedWalks.map(w => w.id),
      fixes: fixResults,
      // Include instructions on how to fix
      fixInstructions: fixRequested 
        ? 'Fixes have been applied as requested.' 
        : 'To fix orphaned walks, add ?fix=true to the URL.'
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