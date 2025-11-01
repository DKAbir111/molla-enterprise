Backend API (NestJS + Prisma + PostgreSQL)

Overview
- Framework: NestJS (REST), Prisma ORM, PostgreSQL
- Auth: JWT (HTTP Bearer), bcrypt hashed passwords
- Docs: Swagger at `/api/docs`
- Validation: DTOs with class-validator/class-transformer
- Multitenancy: All business data is scoped by `organizationId`
- Uploads: Organization logo via multipart upload (field: `logo`)

How the frontend maps to the API
- Auth pages (login, register, forgot, reset) → `/api/auth/*`
- Organization onboarding (create + logo) → `POST /api/organizations`
- App data under organization → `/api/products`, `/api/customers`, `/api/orders`, `/api/transactions`

Quick start
1) Create database and set env
   - Copy `.env.example` to `.env`
   - Set `DATABASE_URL` to your Postgres connection string
   - Optionally set `JWT_SECRET`

2) Install deps and generate Prisma client
   - `cd backend`
   - `npm install`
   - `npm run prisma:generate`
   - `npm run prisma:migrate` (creates tables)

3) Run
   - `npm run start:dev`
   - Swagger: http://localhost:4000/api/docs

Auth flow (minimal)
- POST `/api/auth/register` { name, email, password }
  - Creates user and issues JWT. User has no organization yet.
- POST `/api/auth/login` { email, password }
  - Issues JWT. If the user already has an organization, the token includes `organizationId`.
- POST `/api/auth/forgot-password` { email }
  - Issues a reset token (stored). In real apps, email this link.
- POST `/api/auth/reset-password` { token, newPassword }
  - Resets the password.

Organization onboarding
- POST `/api/organizations` (auth required; user may not yet have an org)
  - Multipart: fields: name, email, phone, address, logo (file optional)
  - Creates organization and sets `user.organizationId`.
- GET `/api/organizations/me` (auth required)
  - Returns current user organization, if any.
- PATCH `/api/organizations/:id` (auth required; must be your org)
  - Update fields and/or upload new `logo`.

Core CRUD (scoped by organization)
- Products
  - GET `/api/products`
  - POST `/api/products` { name, type, grade?, price, unit, stock, description? }
  - PATCH `/api/products/:id`
  - DELETE `/api/products/:id`

- Customers
  - GET `/api/customers`
  - POST `/api/customers` { name, phone, email?, address }
  - PATCH `/api/customers/:id`
  - DELETE `/api/customers/:id`

- Orders
  - GET `/api/orders`
  - POST `/api/orders` {
      customerId,
      deliveryAddress?,
      items: [{ productId, quantity }]
    }
    - Price and productName are captured at creation time; total is computed.
  - PATCH `/api/orders/:id` { status?, deliveryAddress? }
  - DELETE `/api/orders/:id`

- Transactions
  - GET `/api/transactions`
  - POST `/api/transactions` { description, type: 'income'|'expense', amount, category, date? }
  - DELETE `/api/transactions/:id`

Security notes
- Bearer JWT required on all routes except `/api/auth/*`.
- Resource access always filtered by `organizationId` from the JWT (except creating the first organization).

Implementation details
- Global prefix: `/api`
- Swagger path: `/api/docs`
- Uploaded files saved to `backend/uploads/`; stored path returned in JSON (e.g., `logoUrl`). In production, use a CDN/S3.
- Minimal error handling is included; expand as needed.

Environment
- `.env`
  - `DATABASE_URL=postgresql://user:pass@localhost:5432/dbname?schema=public`
  - `PORT=4000`
  - `JWT_SECRET=change-me`

Prisma schema (entities)
- User (email unique, password hashed, organizationId nullable)
- Organization (ownerId, name, email, phone, address, logoUrl)
- Product (name, type, grade?, price, unit, stock, description?)
- Customer (name, phone, email?, address)
- Order (status, deliveryAddress, customerId)
- OrderItem (orderId, productId, productName, quantity, price, total)
- Transaction (description, type, amount, category, date)
- PasswordResetToken (token, userId, expiresAt, used)

Frontend integration tips
- After register/login, store the JWT. If there is no organization, call `POST /api/organizations` with form-data and `logo` file.
- For all subsequent requests, send `Authorization: Bearer <token>`.
- All list endpoints return data scoped to the current user's organization.

