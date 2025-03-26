# WalkMate Deployment Guide

## Prerequisites
- GitHub repository with WalkMate code
- Supabase PostgreSQL database
- Vercel account

## Environment Variables
The application requires the following environment variables:
- `DATABASE_URL`: Supabase Transaction Pooler connection string
- `NEXT_PUBLIC_API_URL`: The URL where the API will be hosted

## Deployment Steps
1. Create `.env.production` with the required environment variables
2. Update Next.js and Prisma configuration for production
3. Deploy to Vercel by connecting the GitHub repository
4. Add environment variables to Vercel project
5. Test the deployed application