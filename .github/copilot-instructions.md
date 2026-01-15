# Molla Enterprise - AI Coding Instructions

## Architecture Overview

**Monorepo Structure**: NestJS backend + Next.js 15 frontend (fully localized with i18n).

- **Backend** (`backend/`): REST API serving multi-tenant organization data
- **Frontend** (`frontend/`): Next.js with localization (English/Bengali), client-side forms, printing, PDF export
- **Database**: PostgreSQL with Prisma ORM, versioned migrations in `backend/prisma/migrations/`

## Core Data Model

All business entities are **scoped by `organizationId`**—this is the fundamental multi-tenancy pattern:

```prisma
Organization → Users, Products, Customers, Sells, Buys, Vendors, Transactions, DryingGains
├── User (email, role: "owner"|"member", organizationId)
├── Product (name, price, buyPrice, stock, unit, imageUrl)
├── Customer (name, phone, email, address, avatarUrl)
├── Sell (items: SellItem[], status, total, discount, paidAmount, transport costs)
├── Buy (items: BuyItem[], similar cost structure)
├── Vendor (name, phone, email, address, avatarUrl)
├── Transaction (description, type, amount, category)
└── DryingGain (productId, quantity, unitCost—for weight gain calculations)
```

**Key pattern**: Use `prisma.user.findUnique({ where: { email } })` then extract `user.organizationId` to ensure authorization. All service methods validate `orgId` with `ensureOrg()`.

## Authentication & Authorization

- **JWT** stored in Bearer token (issued at login/register)
- **Password reset tokens** expire in 5 minutes; stored in `PasswordResetToken` table
- **Login tracking**: `LoginActivity` records IP, user agent, device label per login
- **Soft delete**: `deletedAt` field prevents hard deletes; check in queries
- **Role-based**: `User.role` field ("owner" on registration); roles controlled at service layer

**Auth flow**:
1. `POST /api/auth/register` → creates user without org
2. `POST /api/auth/login` → validates bcrypt password, logs activity, returns JWT with `organizationId` if set
3. `POST /api/auth/forgot-password` → sends reset token via email (see MailService)
4. `POST /api/auth/reset-password` → validates token expiry and used flag, updates password

## NestJS Backend Patterns

### Service Layer (`src/*/service.ts`)
- Inject `PrismaService` and dependent services (e.g., `AlertsService`)
- Always call `ensureOrg(orgId?: string | null)` at method start—throws `ForbiddenException` if missing
- Use `prisma.$transaction([ ... ])` for multi-step operations (e.g., login with activity log)
- Leverage Prisma relations: `findMany({ where: { organizationId }, include: { items: true } })`

**Example from `ProductsService`**:
```typescript
async create(orgId: string | null | undefined, dto: CreateProductDto, imagePath?: string) {
  const organizationId = this.ensureOrg(orgId); // Validate org
  const created = await this.prisma.product.create({ data: { ...dto, organizationId } });
  return created;
}
```

### Controllers (`src/*/controller.ts`)
- Extract `organizationId` from `@User() user` decorator (set by JWT strategy)
- Pass to service methods; services enforce org scoping
- Use `@UseInterceptors(FileInterceptor(...))` for uploads
- Swagger decorators: `@ApiResponse`, `@ApiOperation`, `@ApiConsumes`

### DTOs with Validation
- Use `class-validator` decorators: `@IsString()`, `@IsNumber()`, `@IsOptional()`
- Used in `@Body()` and validated by global `ValidationPipe`

### File Uploads
- Uploads stored at `backend/uploads/{category}/{filename}` (categories: `customers`, `products`, `vendors`)
- Static served via `app.useStaticAssets(uploadsDir, { prefix: '/uploads/' })`
- For production (Vercel), consider cloud storage

## Alerts System

**Core job**: Monitor inventory, aging orders, receivables, payables, trigger email notifications.

- Service in `src/alerts/alerts.service.ts`; triggered on demand and via scheduled tasks
- **Settings** (`OrganizationSettings`): toggles + thresholds (e.g., `lowStockThreshold: 5`, `pendingOrderAgingHours: 24`)
- **Snooze mechanism** (`OrganizationAlertSnooze`): mute alerts by type + refId, support permanent snooze
- **Alert types**: `lowStock`, `pendingOrder`, `receivable`, `payable`
- **Mailer** (`MailService`): sends via Nodemailer; config in `.env`

## Frontend Patterns (Next.js 15 + next-intl)

### i18n Setup
- Routing config: `src/i18n/routing.ts` defines locales (en, bn) and default
- Request config: `src/i18n/request.ts` imports messages from `src/i18n/messages/{locale}.json`
- Middleware: `src/middleware.ts` intercepts requests, injects locale
- All app pages live under `[locale]/` folder; root `page.tsx` redirects to `/en`

### Component Structure
- **Layout components** (`src/components/layout/`): `header.tsx` (language switcher), `sidebar.tsx` (nav)
- **Feature components** by domain: `accounts/`, `buys/`, `customers/`, `sells/`, etc.
- **UI components** (`src/components/ui/`): Radix UI primitives + Tailwind
- **Stores** (`src/store/`): Zustand for client-side state (not persisted)

### Common Libraries & Patterns
- **Forms**: `react-hook-form` + validation
- **HTTP**: `axios` configured for JWT auth (stored in localStorage, added to headers)
- **Printing/PDF**: `react-to-print`, `jspdf`, `jspdf-autotable`
- **Charts**: Recharts for dashboard visualizations
- **Notifications**: `sonner` toast library
- **Date handling**: `date-fns` utilities

### Translation Usage
```typescript
const t = useTranslations(); // Hook provided by next-intl
<h1>{t('dashboard.title')}</h1>
```

## Critical Workflows

### Database Setup
```bash
cd backend
npm install
npm run prisma:generate      # Generate Prisma client
npm run prisma:migrate       # Create tables from schema.prisma
```

### Local Development
```bash
# Terminal 1: Backend (http://localhost:4000)
cd backend && npm run dev

# Terminal 2: Frontend (http://localhost:3000)
cd frontend && npm run dev
```

### Adding a New Feature (e.g., new CRUD entity)
1. Define model in `backend/prisma/schema.prisma`
2. Run `npm run prisma:migrate -- --name add_my_model`
3. Generate service: `nest g service my-feature` (creates module, controller, service)
4. Implement `ensureOrg()` pattern in service methods
5. Export service & controller in module
6. Add module to `app.module.ts` imports
7. Write DTOs with validation in `dto/` subfolder
8. Frontend: Add component in `src/components/my-feature/`, wire axios calls

### Production Deployment (Vercel)
- Backend: `vercel-build` script runs `prisma generate && prisma migrate deploy && nest build`
- Frontend: standard `next build`
- ENV: Set `DATABASE_URL` (pooled), `DIRECT_URL` (direct connection for migrations), `JWT_SECRET`, `FRONTEND_ORIGIN`
- Uploads: Use cloud storage (S3, Supabase) instead of local `uploads/` folder

## Key Files to Know

| File | Purpose |
|------|---------|
| `backend/src/app.module.ts` | Module imports; global providers |
| `backend/src/main.ts` | CORS, Swagger, static asset setup |
| `backend/prisma/schema.prisma` | Complete data model |
| `backend/src/auth/auth.service.ts` | JWT signing, bcrypt, password reset token flow |
| `backend/src/alerts/alerts.service.ts` | Alert logic, snoozes, email dispatch |
| `backend/src/prisma/prisma.service.ts` | Prisma client wrapper; `onModuleInit()` connects |
| `frontend/src/i18n/routing.ts` | Locale config; add/remove locales here |
| `frontend/src/middleware.ts` | i18n middleware; locale extraction |
| `frontend/src/app/[locale]/layout.tsx` | Root locale layout; i18n provider setup |

## Debugging Tips

- **Backend Swagger**: http://localhost:4000/api/docs—test endpoints interactively
- **Prisma Studio**: `npm run prisma:studio` (http://localhost:5555)—browse/edit DB directly
- **JWT decode**: Use jwt.io to inspect token claims offline
- **Logs**: NestJS logger outputs errors, warnings to console; check for validation errors
- **Frontend API errors**: Axios interceptor can log all requests/responses to console
- **Locale issues**: Check `src/i18n/messages/{locale}.json` exists and key path is correct

## Common Pitfalls

1. **Forget `ensureOrg()`**: Service methods without org validation leak data across orgs—always validate first
2. **Missing Prisma migration**: Schema change without `prisma:migrate` causes runtime type errors
3. **Stale Prisma client**: After schema changes, restart backend; `npm run prisma:generate` may be needed
4. **JWT expiry**: Token has no expiry set in code; implement refresh token pattern if long-lived session needed
5. **File uploads on Vercel**: Local `uploads/` folder won't persist; use cloud storage
6. **i18n key missing**: Missing translation key crashes page; ensure all keys exist in all locale JSON files
7. **organizationId null**: Endpoints called before org onboarding fail; frontend must create org first

## Environment Variables

**Backend** (`.env`):
```
DATABASE_URL=postgresql://user:pass@host:5432/db
DIRECT_URL=postgresql://... # For migrations (pooling-safe)
JWT_SECRET=your-secret-key
FRONTEND_ORIGIN=http://localhost:3000
MAIL_HOST=smtp.provider.com
MAIL_PORT=587
MAIL_USER=your-email
MAIL_PASS=your-password
MAIL_FROM=noreply@your-domain.com
```

**Frontend** (`.env.local` or built-in defaults):
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```
