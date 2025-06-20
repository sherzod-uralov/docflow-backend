# DocFlow Backend

A secure NestJS backend application with user authentication, role-based access control, and comprehensive error handling.

## Features

- User authentication with JWT
- User profiles
- Role-based access control
- Permission-based access control
- Rate limiting
- Swagger API documentation
- Comprehensive error handling

## Prerequisites

- Node.js (v18 or later)
- PostgreSQL (v14 or later)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/docflow-backend.git
cd docflow-backend
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

Create a `.env` file in the root directory with the following variables:

```
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/docflow?schema=public"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="1d"

# Server
PORT=3000
NODE_ENV="development"
```

4. Generate Prisma client:

```bash
npx prisma generate
```

5. Run database migrations:

```bash
npx prisma migrate dev --name init
```

## Running the Application

### Development

```bash
npm run start:dev
```

### Production

```bash
npm run build
npm run start:prod
```

## API Documentation

Once the application is running, you can access the Swagger API documentation at:

```
http://localhost:3000/api
```

## Authentication

### Register a New User

```
POST /auth/register
```

Request body:
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

### Login

```
POST /auth/login
```

Request body:
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

### Get User Profile

```
GET /auth/profile
```

Headers:
```
Authorization: Bearer <your-jwt-token>
```

## Roles and Permissions

The application comes with two default roles:

1. **admin** - Has all permissions
2. **user** - Has read-only permissions

### Default Permissions

- create:user
- read:user
- update:user
- delete:user
- create:role
- read:role
- update:role
- delete:role
- assign:role
- remove:role

## License

This project is licensed under the MIT License - see the LICENSE file for details.