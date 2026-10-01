# Store Panel

A small web-based store management panel built with **Next.js 15 (App Router)**, **TypeScript**, **PostgreSQL (Prisma)**, and **Auth.js (NextAuth v5)**.

A store manager can log in, view products, create/edit/delete products, change product status, and see a dashboard overview of the store. Two roles are supported with different permissions: **Admin** and **Manager**.

---

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Seeding](#seeding)
- [Running the App](#running-the-app)
- [Test Accounts](#test-accounts)
- [Testing](#testing)
- [Building for Production](#building-for-production)
- [Deployment (Vercel)](#deployment-vercel)
- [Project Structure](#project-structure)
- [Technical Decisions](#technical-decisions)
- [Available Scripts](#available-scripts)
- [Troubleshooting](#troubleshooting)
- [Time Spent](#time-spent)
- [Notes & Limitations](#notes--limitations)

---

## Features

### Authentication & Authorization

- Email/password login using **Auth.js (NextAuth v5)** with JWT sessions
- Passwords hashed with **bcryptjs** — never stored in plain text
- Route protection via **middleware** for `/dashboard` and `/products/*`
- Two roles with **server-enforced** permissions:
  - **Admin** — full access, including **delete**
  - **Manager** — view, create, edit, change status (**cannot delete**)

### Dashboard

- Total products, active products, inactive products, total stock
- List of the 5 most recently created products
- Data served from PostgreSQL via Prisma (Server Component)

### Products

- List view with **image, name, category, price, stock, status, created date, actions**
- **Search** by name
- **Filters** by status (all/active/inactive) and category (Food/Drink/Dessert/Other)
- **Sorting** by name, price, stock, created date — ascending and descending
- **Pagination** (server-side, 8 items per page by default)
- All state (search, filters, sort, page) is stored in the **URL** so views are shareable and survive refresh — e.g. `/products?search=pizza&status=active&page=2`
- **Responsive layout** — table on desktop, card list on mobile

### Product CRUD

- **Create** product with full form validation (client + server via Zod)
- **View** product details (image, description, category, price, stock, status, created/updated dates)
- **Edit** product with prefilled form and same validation
- **Delete** product with **confirmation dialog** (Admin only)
- **Change status** (active/inactive) — persisted to the database

### UX & Quality

- Loading states via `useTransition`
- Empty states (no products, no search results)
- Error handling for invalid login, invalid form data, product not found, unauthorized, forbidden, DB failure
- Toast notifications for actions
- Accessible forms (labels, `aria-*`, focus states, keyboard-friendly)
- Fully responsive (mobile / tablet / desktop)

---

## Requirements

- **Node.js** v20 or newer
- **npm** v10 or newer (or pnpm/yarn — commands below use npm)
- **PostgreSQL** v14+ (local install or Docker)
- **Docker Desktop** (recommended, easiest way to run Postgres on Windows/macOS)

Check your versions:

```bash
node -v   # should print v20.x.x or higher
npm -v    # should print 10.x.x or higher
```

---

## Installation

Clone or download the project, then install dependencies:

```bash
npm install
```

This also runs `prisma generate` automatically via the `postinstall` script.

---

## Environment Variables

Copy the example file:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Then edit `.env` and set the values. Required variables:

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/store_panel?schema=public` |
| `AUTH_SECRET` | Secret used to sign JWT sessions (min 32 chars) | `openssl rand -base64 32` |
| `NEXTAUTH_SECRET` | Same as `AUTH_SECRET` (fallback for Auth.js v5) | *(same value)* |
| `AUTH_URL` | Public URL of the app | `http://localhost:3000` |
| `NEXTAUTH_URL` | Same as `AUTH_URL` | `http://localhost:3000` |

**Generate a strong `AUTH_SECRET`:**

```bash
# macOS / Linux
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**Example `.env`:**

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/store_panel?schema=public"
AUTH_SECRET="replace-with-a-real-32-char-secret-from-openssl"
NEXTAUTH_SECRET="replace-with-a-real-32-char-secret-from-openssl"
AUTH_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"
```

> **Never commit `.env`.** It is listed in `.gitignore`. Only `.env.example` should be committed.

---

## Database Setup

The app uses **PostgreSQL**. Choose one of the two options below.

### Option A — Docker (recommended)

Run a Postgres container with a persistent volume and auto-restart:

```bash
docker run --name store-panel-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=store_panel \
  -p 5432:5432 \
  -v store-panel-db-data:/var/lib/postgresql/data \
  --restart unless-stopped \
  -d postgres:16
```

On **Windows PowerShell** (single line, backticks don't work well in some shells):

```powershell
docker run --name store-panel-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=store_panel -p 5432:5432 -v store-panel-db-data:/var/lib/postgresql/data --restart unless-stopped -d postgres:16
```

Verify it's running:

```bash
docker ps
docker exec store-panel-db pg_isready -U postgres
```

**Subsequent starts** (after reboot):

```bash
docker start store-panel-db
```

### Option B — Docker Compose

Create `docker-compose.yml` in the project root:

```yaml
services:
  db:
    image: postgres:16
    container_name: store-panel-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: store_panel
    ports:
      - "5432:5432"
    volumes:
      - store-panel-db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  store-panel-db-data:
```

Then:

```bash
docker compose up -d      # start
docker compose ps         # check status
docker compose down       # stop (data preserved)
```

### Option C — Local Postgres Install

Create a database named `store_panel`:

```bash
createdb store_panel
```

Update `DATABASE_URL` in `.env` to match your local credentials.

### Apply the schema

Once Postgres is up:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

If you don't have migrations set up yet, or want a quick push without migration history:

```bash
npx prisma db push
```

The schema is defined in `prisma/schema.prisma` and includes **User**, **Category**, and **Product** models.

---

## Seeding

Load the sample data (2 users, 4 categories, 25 products):

```bash
npm run db:seed
```

Expected output:

```
🌱 Seeding database...
✅ Seeded 25 products and 2 users
```

Verify with Prisma Studio:

```bash
npx prisma studio
```

Opens at http://localhost:5555 — you should see all tables populated.

---

## Running the App

Start the development server:

```bash
npm run dev
```

You should see:

```
▲ Next.js 15.1.0
- Local:        http://localhost:3000
- Environments: .env
✔ Ready in X.Xs
```

Open **http://localhost:3000** in your browser. You'll be redirected to `/login`.

---

## Test Accounts

Two test accounts are created by the seed script:

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@example.com` | `Admin123!` |
| **Manager** | `manager@example.com` | `Manager123!` |

**Admin** can do everything including deleting products.
**Manager** can view, create, edit, and change product status — but **cannot delete** products (UI hides the action; server rejects the request).

---

## Testing

### Unit tests (Vitest)

Tests for validation schemas and permission logic:

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

### Integration tests (Vitest + Prisma)

Tests server-side operations (e.g. `listProducts` with search + filters + sorting + pagination) against the real database. **Requires `DATABASE_URL` to be set and migrations applied.**

```bash
npm test
```

### End-to-end tests (Playwright)

Installs browsers on first run:

```bash
npx playwright install --with-deps
```

Run:

```bash
npm run test:e2e
```

The E2E test covers the flow: **Login → Open Products → Create Product → Verify in list**.

Playwright starts the dev server automatically (`webServer` config in `playwright.config.ts`).

---

## Building for Production

```bash
npm run build
npm start
```

The `build` script runs `prisma generate` first, so the Prisma Client is always up to date.

---

## Deployment (Vercel)

Vercel is the natural home for a Next.js app. You need a **hosted Postgres** because Vercel doesn't host databases.

### 1. Get a hosted Postgres

Recommended free options:

- **Neon** — https://neon.tech (best for serverless, integrates natively with Vercel)
- **Supabase** — https://supabase.com
- **Vercel Postgres** — via Vercel dashboard → Storage
- **Railway** — https://railway.app

Copy the connection string (make sure it includes `?sslmode=require` where needed).

### 2. Apply schema to remote DB

**Locally**, temporarily set `DATABASE_URL` in `.env` to the remote string, then:

```bash
npx prisma generate
npx prisma migrate deploy
# or if you have no migration files:
npx prisma db push
npm run db:seed
```

This creates tables and seeds data in the **cloud database**.

### 3. Push to GitHub

```bash
git add .
git commit -m "chore: prepare for Vercel deploy"
git push
```

Make sure `.env` is **not** committed (`git status` should not list it).

### 4. Import to Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repo
3. Framework preset auto-detects **Next.js**
4. Add **Environment Variables**:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | Your hosted Postgres URL |
   | `AUTH_SECRET` | Same 32-char secret |
   | `NEXTAUTH_SECRET` | Same as above |
   | `AUTH_URL` | `https://your-project.vercel.app` (fill after first deploy) |
   | `NEXTAUTH_URL` | Same as above |

5. Click **Deploy**

### 5. Update `AUTH_URL` after first deploy

Once Vercel assigns your URL, go back to **Settings → Environment Variables** and update `AUTH_URL` and `NEXTAUTH_URL` to the real `https://…vercel.app` URL. Then **redeploy**.

### 6. Verify

Open your Vercel URL, log in with `admin@example.com` / `Admin123!`, and check the dashboard loads with real data.

**Common issues:**

| Error | Fix |
|---|---|
| `P1001: Can't reach database server` | Wrong `DATABASE_URL`, or missing `?sslmode=require` |
| `relation "products" does not exist` | Run `prisma db push` / `migrate deploy` against the remote DB |
| `MissingSecret` | Add `AUTH_SECRET` to Vercel env vars |
| Login redirect loop | `AUTH_URL` doesn't match the deployment URL |

---

## Project Structure

```
store-panel/
├── prisma/
│   ├── schema.prisma           # Database schema (User, Category, Product)
│   └── seed.ts                 # Seed script
├── src/
│   ├── app/
│   │   ├── (auth)/login/       # Login page
│   │   ├── (dashboard)/        # Authenticated area
│   │   │   ├── layout.tsx      # Sidebar + header
│   │   │   ├── dashboard/      # Dashboard overview
│   │   │   └── products/
│   │   │       ├── page.tsx    # Product list
│   │   │       ├── new/        # Create product
│   │   │       └── [id]/       # Details, edit, not-found
│   │   ├── actions/            # Server Actions
│   │   ├── api/auth/           # NextAuth route handler
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Root redirect
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                 # Radix + Tailwind primitives
│   │   ├── auth/               # Login form
│   │   ├── layout/             # Sidebar, header
│   │   └── products/           # Products view, form, actions
│   ├── lib/                    # auth, prisma, permissions, validation, utils
│   ├── server/                 # Data access layer (products.ts)
│   ├── types/                  # next-auth type augmentation
│   └── middleware.ts           # Route protection
├── tests/                      # Unit + integration tests (Vitest)
├── e2e/                        # End-to-end tests (Playwright)
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
├── vitest.config.ts
└── playwright.config.ts
```

---

## Technical Decisions

A short summary of the main architectural choices.

### Next.js App Router with mixed Server/Client Components

- **Server Components** for data-heavy pages (`/dashboard`, `/products`, `/products/[id]`) — they query Prisma directly, no client round-trip.
- **Client Components** for anything interactive — search input, filters, forms, dialogs, toasts.
- **Server Actions** for all mutations (create, update, delete, change status). This avoids hand-written API routes and gives type-safe server calls from the client.
- **URL state** for search, filters, sort, and pagination. The Products page reads `searchParams` on the server; updates push a new URL via `router.push`. This makes every view shareable and refresh-safe.

### Authentication

- **Auth.js v5 (NextAuth)** with a Credentials provider. JWT session strategy.
- Passwords hashed with **bcryptjs** (10 rounds).
- `middleware.ts` protects `/dashboard` and `/products/*`, redirecting unauthenticated users to `/login`.
- Session is re-checked inside every Server Action via a `requireUser()` helper — so even a direct API call can't bypass permissions.

### Authorization

Centralized in `src/lib/permissions.ts`:

```ts
export const PERMISSIONS = {
  ADMIN:   { canViewProducts: true, canCreateProduct: true, canEditProduct: true, canDeleteProduct: true,  canChangeStatus: true },
  MANAGER: { canViewProducts: true, canCreateProduct: true, canEditProduct: true, canDeleteProduct: false, canChangeStatus: true },
};
export function can(role, permission) { ... }
```

The **same** `can()` helper is used:
- In the UI to hide/disable actions the user cannot perform
- On the server to reject the request if called anyway

This satisfies the requirement that permissions are enforced **both** in the UI and on the server.

### Data layer

- **Prisma + PostgreSQL**. Product price uses `Decimal(10,2)` to avoid floating-point drift.
- Indexes on `name`, `status`, `categoryId` for list filtering/sorting performance.
- Server-side pagination and filtering — the database does the work, not the browser.

### Validation

- **Zod** schema shared between the client form (via `react-hook-form` + `@hookform/resolvers`) and the Server Action. One source of truth.
- Server-side validation is authoritative — the client-side check is just UX.

### Error handling

- Server Actions return a discriminated union: `{ ok: true } | { ok: false, error, fieldErrors? }`.
- The form maps `fieldErrors` back to the individual fields via `setError`.
- Custom `not-found.tsx` for missing products.
- Toast notifications for actions (success/failure).

### Styling

- **Tailwind CSS** + **Radix UI primitives** (shadcn-style components built in-house under `src/components/ui/`).
- Dark mode CSS variables are defined in `globals.css` but a toggle isn't wired up (optional feature).
- Fully responsive — sidebar collapses to a hamburger menu under `lg`, table becomes stacked cards under `md`.

---

## Available Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start Next.js dev server on http://localhost:3000 |
| `npm run build` | Generate Prisma client and build for production |
| `npm start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run db:migrate` | Create and apply a new Prisma migration |
| `npm run db:push` | Push schema directly (no migration files) |
| `npm run db:seed` | Run the seed script |
| `npm run db:studio` | Open Prisma Studio |
| `npm test` | Run unit + integration tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npx prisma generate` | Regenerate Prisma Client |

---

## Troubleshooting

### `Can't reach database server at localhost:5432`

The Postgres container isn't running.

```bash
docker ps                              # see if it's up
docker start store-panel-db            # start it
docker exec store-panel-db pg_isready -U postgres
```

If the container doesn't exist, recreate it (see [Database Setup](#database-setup)).

### `MissingSecret: Please define a secret`

`AUTH_SECRET` isn't set. Add it to `.env`, then **fully restart** the dev server with a cleared cache:

```bash
# Ctrl+C in dev terminal
rm -rf .next          # or: Remove-Item -Recurse -Force .next
npm run dev
```

### `Environment variable not found: DATABASE_URL`

`.env` is missing, misnamed, or in the wrong folder. It must sit **next to `package.json`** and be named exactly `.env`.

### `EPERM: operation not permitted, rename ... query_engine-windows.dll.node`

Windows file lock — usually because the dev server is running. Stop it (Ctrl+C), then:

```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Remove-Item -Recurse -Force .\node_modules\.prisma -ErrorAction SilentlyContinue
npx prisma generate
```

Also add `node_modules` and `.next` to Windows Defender exclusions.

### `useToast must be used inside <ToastProvider />`

`<ToastProvider>` isn't wrapping the app. It must be inside `src/components/providers.tsx`, wrapping `{children}`.

### `React.jsx: type is invalid`

A component import resolved to `undefined`. Check that the file has the correct `export` (named vs default). Verify with:

```powershell
Get-ChildItem src\components\ui\*.tsx | ForEach-Object {
  $c = (Select-String -Path $_.FullName -Pattern "^export" | Measure-Object).Count
  "$($_.Name): $c exports"
}
```

Any file with `0 exports` is broken — replace it with the correct version.

### `You cannot have two parallel pages that resolve to the same path`

Two `page.tsx` files map to the same URL. Delete one. E.g. don't have both `src/app/login/page.tsx` and `src/app/(auth)/login/page.tsx`.

### Login says "Invalid email or password"

Run the seed: `npm run db:seed`.

### `relation "products" does not exist`

Run migrations: `npx prisma migrate dev` (or `npx prisma db push`).

### Port 5432 already in use

Another Postgres is running. Either stop it, or map Docker to a different port (`-p 5433:5432`) and update `DATABASE_URL` to use `localhost:5433`.

---

## Time Spent

Approximately **10–12 hours**, including:

- Project setup, Prisma schema, and seed data
- Auth.js integration with credentials and JWT sessions
- Server-side permission enforcement
- Dashboard and full Products CRUD with search/filters/sort/pagination
- Responsive UI with Radix primitives and Tailwind
- Unit, integration, and E2E tests
- Documentation and troubleshooting

---

## Notes & Limitations

- **Image upload is not implemented** — products use image URLs instead.
- **Dark mode tokens are defined** in `globals.css` but there's no UI toggle.
- **Bulk actions** and **optimistic updates** are not implemented.
- **CSRF**: Auth.js handles CSRF for login; Server Actions in Next.js include built-in protection.
- The project does not use a **barrel file** for UI components to keep tree-shaking effective.

---

## License

This project was created as a technical exercise. No license is attached — use it however you like.

---

## Acknowledgements

Built with:

- [Next.js](https://nextjs.org)
- [Prisma](https://www.prisma.io)
- [Auth.js](https://authjs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Radix UI](https://www.radix-ui.com)
- [Zod](https://zod.dev)
- [React Hook Form](https://react-hook-form.com)
- [Vitest](https://vitest.dev)
- [Playwright](https://playwright.dev)