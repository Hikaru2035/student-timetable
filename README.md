# Student Timetable and Reminder App

A full-stack web application for managing student timetables with user authentication, built with React, Express, Prisma, and PostgreSQL.

## Features

- 🔐 JWT-based authentication (register/login)
- 📅 Weekly calendar view with specific dates
- ➕ Add, view, and delete time blocks (classes, activities, exams, etc.)
- 👤 Personal information management
- 🎨 Color-coded event types
- 📱 Responsive design
- 🗄️ PostgreSQL database with Prisma ORM

## Tech Stack

### Frontend
- React
- React Router
- Tailwind CSS
- Lucide React (icons)

### Backend
- Express.js
- Prisma ORM
- PostgreSQL database
- JWT Authentication
- Bcrypt (password hashing)
- Cookie-based token storage

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database
- npm or pnpm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:

Copy `.env.example` to `.env` and update with your configuration:

```bash
cp .env.example .env
```

Update the following in `.env`:
```env
# Database - Update with your PostgreSQL credentials
DATABASE_URL="postgresql://username:password@localhost:5432/student_timetable?schema=public"

# JWT Secret - Change to a secure random string
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long

# Other settings
PORT=3001
CLIENT_URL=http://localhost:5173
```

3. Set up PostgreSQL database:

Create a database in PostgreSQL:
```sql
CREATE DATABASE student_timetable;
```

4. Initialize the database with Prisma:
```bash
npm run prisma:init
```

This will:
- Generate Prisma Client
- Create database tables
- Run migrations

### Running the Application

#### Option 1: Run frontend and backend together (Recommended)
```bash
npm run dev:all
```

This will start:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

#### Option 2: Run separately

Terminal 1 (Frontend):
```bash
npm run dev
```

Terminal 2 (Backend):
```bash
npm run server
```

### Database Management

View and edit database with Prisma Studio:
```bash
npm run prisma:studio
```

This opens a visual database editor at http://localhost:5555

## Database Configuration

### PostgreSQL (Production & Development)

Update your `.env` file with PostgreSQL credentials:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

Examples:
- Local: `postgresql://postgres:password@localhost:5432/student_timetable`
- Heroku: `postgresql://user:pass@host.compute-1.amazonaws.com:5432/dbname`
- Railway: Provided automatically
- Supabase: Get from project settings

### SQLite (Development Only)

For quick local development without PostgreSQL:

1. Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

2. Update `.env`:
```env
DATABASE_URL="file:./dev.db"
```

3. Run migrations:
```bash
npm run prisma:init
```

## Environment Variables

### Backend (.env)
```env
PORT=3001                    # Server port
NODE_ENV=development         # Environment
CLIENT_URL=http://localhost:5173  # Frontend URL
JWT_SECRET=your-secret-key   # JWT signing key (min 32 chars)
JWT_EXPIRES_IN=7d           # Token expiration
DATABASE_URL=postgresql://...  # Database connection
CORS_ORIGIN=http://localhost:5173  # CORS allowed origin
```

### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:3001/api
```

## API Endpoints

### Authentication (JWT)
- `POST /api/auth/register` - Register new user (returns JWT)
- `POST /api/auth/login` - Login user (returns JWT)
- `POST /api/auth/logout` - Logout user (clears token)
- `GET /api/auth/me` - Get current user (requires JWT)

### Time Blocks (Protected)
- `GET /api/timeblocks` - Get all time blocks
- `GET /api/timeblocks/range?startDate=&endDate=` - Get time blocks by date range
- `POST /api/timeblocks` - Create time block
- `PUT /api/timeblocks/:id` - Update time block
- `DELETE /api/timeblocks/:id` - Delete time block

### Personal Info (Protected)
- `GET /api/personalinfo` - Get personal information
- `POST /api/personalinfo` - Create/update personal information

## Authentication Flow

1. User registers or logs in
2. Server generates JWT token and sends it in response
3. Frontend stores token in localStorage and includes in Authorization header
4. Token also stored in httpOnly cookie for additional security
5. Protected routes verify JWT before processing requests
6. Token expires after 7 days (configurable)# student-timetable
