# National FPO Digital Market Linkage Platform

A production-ready SaaS platform connecting Farmers, Farmer Producer Organizations (FPOs), Buyers, Logistics Providers, Financial Institutions, and Government Stakeholders.

## Tech Stack

- **Frontend:** Next.js 15, React, TypeScript, Tailwind CSS, Shadcn UI, Recharts
- **Backend:** Node.js, NestJS, REST API, JWT Authentication
- **Database:** PostgreSQL, Prisma ORM
- **Storage:** AWS S3 compatible storage
- **Authentication:** OTP Login, Email Login, Role-Based Access Control
- **Deployment:** Docker, Kubernetes Ready, Vercel (Frontend), AWS EC2 or DigitalOcean (Backend)

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL
- Docker & Docker Compose (for easy setup)

### Installation

1. Clone/download this repository to your machine
2. Navigate to project root:
   ```bash
   cd national-fpo-platform
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Setup environment:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and other configurations
   ```
5. Start development:
   ```bash
   npm run dev:all   # Starts both frontend and backend
   ```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/fpo_platform?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:3000"

# Backend Port
PORT=4000

# AWS S3 (for file uploads - configure as needed)
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_S3_BUCKET="your-bucket-name"
AWS_S3_REGION="your-region"

# Email/SMS/Notifications (configure as needed)
# Example for email (using SendGrid or similar)
EMAIL_SERVICE="sendgrid"
EMAIL_USER="your-email-service-user"
EMAIL_PASS="your-email-service-password"
```

### Available Scripts

In the root directory:

- `npm run dev:all` - Start both frontend and backend in development mode
- `npm run dev:api` - Start only the backend API
- `npm run dev:web` - Start only the frontend
- `npm run build:all` - Build both frontend and backend for production
- `npm run start:all` - Start both frontend and backend in production mode

### API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:4000/api-docs

### Frontend

Once the frontend is running, visit:
- http://localhost:3000

## Project Structure

```
national-fpo-platform/
├── apps/
│   ├── api/                  # NestJS Backend
│   └── web/                  # Next.js 15 Frontend
├── prisma/                   # Prisma schema and migrations
├── docker-compose.yml        # Docker compose for development
├── .env.example              # Environment variables example
├── README.md                 # This file
└── package.json              # Root workspace package
```

## Features Implemented (Foundation)

- ✅ Complete database schema with Prisma models for all entities
- ✅ Authentication system (JWT-based, role-based access control)
- ✅ Core modules: FPO, Farmers, Commodities, Buyers, Logistics, Transactions
- ✅ RESTful API structure with controllers and services
- ✅ Frontend structure with Next.js 15 and Tailwind CSS
- ✅ Docker setup for easy deployment
- ✅ API documentation with Swagger
- ✅ Security helpers (validation, rate limiting, helmet)
- ✅ Foundation for admin dashboard and analytics

## Next Steps for Development

1. Implement specific business logic in each service
2. Create frontend pages for each module
3. Add file upload handling (AWS S3 integration)
4. Implement notification system (email/SMS/WhatsApp)
5. Add advanced analytics and reporting
6. Implement OTP login functionality
7. Add role-based UI components in frontend
8. Set up CI/CD pipelines
9. Add comprehensive testing
10. Performance optimization and scaling

## License

This project is proprietary and confidential. All rights reserved.

---
*Built with ❤️ for digital agriculture transformation*