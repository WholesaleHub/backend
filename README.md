# WholesaleHub Backend

Backend API for the WholesaleHub B2B wholesale platform.

## Tech Stack

- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Passport
- bcrypt

## Getting Started

### Install dependencies

```bash
npm install
Configure environment variables

Create a .env file:

DATABASE_URL=
JWT_SECRET=
Generate Prisma Client
npx prisma generate
Run migrations
npx prisma migrate dev
Start the development server
npm run start:dev
Authentication

Implemented features:

User Registration
User Login
JWT Authentication
Protected Routes
Role-Based Access Control (RBAC)
Project Structure
src/
├── auth/
├── prisma/
├── users/
Contributors
Brian Sechelo
Bikokwa Khaemba