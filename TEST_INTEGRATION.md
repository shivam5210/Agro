# Integration Test Guide

This document explains how to test the integration between the three parts:
1. Frontend (Next.js)
2. Backend (NestJS) 
3. API Communication

## Prerequisites
- Docker and Docker Compose installed
- Node.js 20+ installed
- Git installed

## Step 1: Start the Full Stack
From the project root directory:
```bash
# Install dependencies
npm install

# Start all services
npm run dev:all
```

This will start:
- PostgreSQL database on port 5432
- Backend API (NestJS) on http://localhost:4000
- Frontend (Next.js) on http://localhost:3000

## Step 2: Verify Services are Running

### Check Backend API
Open: http://localhost:4000/api-docs
- You should see the Swagger UI with all API endpoints documented
- Try the `/auth/login` endpoint with test credentials

### Check Frontend
Open: http://localhost:3000
- You should see the login page
- The navigation bar should be visible at the top

## Step 3: Test Authentication Flow

### Option A: Using the UI (Recommended)
1. Go to http://localhost:3000/auth/login
2. Use test credentials (from .env.example):
   - Email: admin@fpomarketlink.gov.in
   - Password: Admin@123
3. Click "Sign in"
4. You should be redirected to http://localhost:3000/dashboard
5. The dashboard should load with stats (initially zeros)
6. Try navigating to other pages like FPO Directory, Analytics, etc.

### Option B: Using API Calls Directly
Test the backend API directly:
```bash
# Test registration
curl -X POST "http://localhost:4000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "phone": "+919876543210",
    "password": "TestPass123!",
    "role": "FARMER",
    "firstName": "Test",
    "lastName": "User"
  }'

# Test login
curl -X POST "http://localhost:4000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'

# You should get a JWT token in response
```

### Option C: Test Full Flow via Frontend
1. Register a new user via the UI at http://localhost:3000/auth/register
2. Login with those credentials
3. Try creating an FPO (if logged in as Super Admin or FPO Admin)
4. Check that the FPO appears in the FPO directory
5. Try creating a farmer linked to that FPO
6. Check that the farmer appears in the farmer list

## Step 4: Test Specific Module Integration

### Test FPO Module
1. Login as Super Admin
2. Go to FPO Directory (http://localhost:3000/fpo-directory)
3. Click "Create FPO" button
4. Fill in the form and submit
5. Verify the new FPO appears in the list
6. Click on the FPO to view details
7. Check that tabs for Farmers, Commodities, etc. work

### Test Farmer Module
1. Login as FPO Admin
2. Go to an FPO detail page
3. Go to the Farmers tab
4. Click "Add Farmer" or "Bulk Upload"
5. Add a farmer and save
6. Verify the farmer appears in the list
7. Click on the farmer to view profile
8. Check that transaction history and crop sections work

### Test Analytics Module
1. After creating some test data (FPOs, farmers, transactions)
2. Go to Analytics (http://localhost:3000/analytics)
3. Verify charts load with your test data
4. Try different date ranges and filters
5. Check that KPI cards update accordingly

## Step 5: Verify Database Persistence
1. Create some test data through the UI
2. Stop all services: `Ctrl + C` in the terminal
3. Start again: `npm run dev:all`
4. Login and verify your test data is still there
5. This confirms data is persisted in PostgreSQL

## Step 6: Test Environment Variables
Check that the frontend is correctly talking to the backend:
1. Open browser dev tools (F12)
2. Go to Network tab
3. Perform an action (like login)
4. Check that requests go to `http://localhost:4000/` 
5. Verify responses come back correctly

## Step 7: Test Hot Reloading
1. Make a change to any frontend file (e.g., apps/web/src/app/layout.tsx)
2. Save the file
3. Verify the browser automatically refreshes
4. Make a change to any backend file (e.g., apps/api/src/fpo/fpo.service.ts)
5. Save the file
6. Verify NestJS automatically restarts and applies changes

## Troubleshooting

### "Cannot connect to backend" errors
- Check that backend is running on port 4000
- Verify `.env` file has correct `NEXT_PUBLIC_API_URL`
- Check browser console for CORS errors
- Ensure Docker containers are healthy: `docker compose ps`

### Database connection errors
- Check that PostgreSQL container is running: `docker compose ps postgres`
- Verify `.env` file has correct `DATABASE_URL`
- Check PostgreSQL logs: `docker compose logs postgres`

### Authentication issues
- Clear localStorage and try logging in again
- Check that JWT token is being stored and sent
- Verify backend secret key matches in both places

### Empty data on dashboard
- Create some test data first using the UI
- Verify transactions have status: 'COMPLETED' to appear in stats
- Check that date filters aren't excluding all data

## Production Readiness Checks
Once you verify local integration works:

1. **Environment Configuration**
   - Copy `.env.example` to `.env` for production
   - Update all values for your production environment
   - Use strong, random JWT secret
   - Configure AWS S3 credentials if using file uploads

2. **Database Migrations**
   - Run `npm run prisma:migrate` in apps/api/ before deploying
   - Verify all tables are created correctly

3. **Build for Production**
   - Frontend: `npm run build` in apps/web/
   - Backend: `npm run build` in apps/api/
   - Start production: `npm run start:all`

4. **Deploy**
   - Frontend: Deploy to Vercel (recommended for Next.js)
   - Backend: Deploy to AWS EC2, DigitalOcean, or similar
   - Database: Use managed PostgreSQL (AWS RDS, DigitalOcean Managed DB)
   - Update API URLs in frontend to point to your deployed backend

## Next Steps After Integration Verification
Once you confirm all three parts work together:
1. Implement specific business logic in each service
2. Add file upload handling (AWS S3 integration)
3. Implement notification system (email/SMS/WhatsApp)
4. Add role-based UI components
5. Set up comprehensive testing
6. Add performance monitoring and logging
7. Prepare for production deployment

The foundation is now solid - you have a working full-stack application where:
- Frontend ✅ communicates with Backend ✅ via well-defined API contracts ✅
- Data persists in PostgreSQL ✅
- Authentication flows work ✅
- Role-based access control is enforced ✅
- Realistic UI components are in place ✅