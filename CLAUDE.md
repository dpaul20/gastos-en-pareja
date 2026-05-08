# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

---

## Commands

```bash
npm run dev          # start dev server (localhost:3000)
npm run lint         # eslint
npm test             # vitest unit tests (one-shot)
npm run test:watch   # vitest in watch mode
npm run test:coverage # vitest with v8 coverage report
npm run test:e2e     # playwright e2e (requires dev server running or starts it)
npm run test:e2e:ui  # playwright with interactive UI
npm run test:a11y    # accessibility-only playwright suite

# Run a single vitest test file
npx vitest run src/lib/utils/__tests__/balance.test.ts

# Supabase local dev
npx supabase start
npx supabase db reset
npx supabase migration new <name>
npx supabase gen types typescript --local > src/types/database.ts
```

---

## Architecture

### What this app does

Proportional expense splitting for couples. Each month, each person enters their income; the app calculates how much each owes toward shared expenses (installments + fixed + shared variable) based on their income percentage. The core math lives in [src/lib/utils/balance.ts](src/lib/utils/balance.ts).

### Route groups

| Group    | Path prefix                                        | Purpose                                      |
| -------- | -------------------------------------------------- | -------------------------------------------- |
| `(app)`  | `/dashboard`, `/expenses`, `/history`, `/settings` | Authenticated shell with bottom nav          |
| `(auth)` | `/login`                                           | Unauthenticated login page                   |
| —        | `/invite/[token]`                                  | Server Component — accepts couple invitation |
| —        | `/auth/callback`                                   | OAuth callback route handler                 |

All pages under `(app)` are **Client Components** (`"use client"`) that pull data via TanStack Query hooks. The `(app)/layout.tsx` wraps them in a `maxWidth: 390` container with `<BottomNav>`.

### Auth flow

1. Google OAuth via `supabase.auth.signInWithOAuth` on the login page
2. Redirects to `/auth/callback` → exchanges code, sets session cookie, redirects to `/dashboard`
3. **Middleware** lives in [src/proxy.ts](src/proxy.ts) (exported as `proxy` — the actual `middleware.ts` imports it). It refreshes the Supabase session on every request and redirects unauthenticated users to `/login?next=<path>`. Public paths: `/login`, `/auth/callback`, `/invite/*`, `/api/*`, static files.

### Data model (key tables)

```text
couples (id, status: PENDING|ACTIVE)
  └── couple_members (couple_id, user_id, role: OWNER|MEMBER)
  └── invitations (couple_id, inviter_id, email, token, expires_at, accepted_at)
  └── incomes (couple_id, user_id, amount, month: date)
  └── installment_purchases (couple_id, description, total_amount, installments, paid_installments, auto_renew)
  └── fixed_expense_templates (couple_id, description, amount, due_day, active)
        └── fixed_expense_instances (template_id, couple_id, month: date, paid)
  └── variable_expenses (couple_id, user_id, description, amount, date, is_shared)
  └── expense_categories (id, name, icon, sort_order)
```

**Fixed expenses use a template + instance pattern**: templates are the recurring definition; instances are created per-month lazily (on dashboard load via `ensureFixedExpenseInstances`). This is why `createFixedExpenseTemplate` also inserts the first instance.

**`auto_renew` installment purchases** are treated as always-active regardless of `paid_installments` — they never leave the list.

### Data flow

```text
Server Actions (src/lib/actions/)  ←→  Supabase (RLS-enforced)
       ↑ mutate + revalidatePath
Client Components (pages)
       ↓ useQuery / useMutation
TanStack Query hooks (src/lib/queries/)  ←→  Supabase client
```

The central query is `useMonthlyData(coupleId, month)` in [src/lib/queries/use-monthly-data.ts](src/lib/queries/use-monthly-data.ts) — it fetches all four data types in parallel and is used by both `/dashboard` and `/expenses`.

### Testing strategy

| Layer                          | Tool           | What's covered                                         |
| ------------------------------ | -------------- | ------------------------------------------------------ |
| Pure utils in `src/lib/utils/` | Vitest         | balance.ts, categories.ts, utils.ts, couple-helpers.ts |
| UI, actions, queries           | Playwright e2e | Everything excluded from Vitest coverage               |

Vitest excludes `src/components/**`, `src/lib/queries/**`, `src/lib/actions/couple.ts`, `src/lib/supabase/**`, and `src/app/**`. Coverage thresholds: 80% lines/functions, 70% branches.

E2e tests run against Chromium mobile (Pixel 5) only and reuse the running dev server if one is already up.

### Design system

Tokens are defined in [src/app/globals.css](src/app/globals.css). Semantic tokens: `--bg-base`, `--bg-elevated`, `--bg-sunken`, `--fg-1/2/3`, `--accent`, `--border-subtle`. Color palettes: violet (accent/person A), teal (person B/success), coral (debt/danger). Dark mode is handled via `@media (prefers-color-scheme: dark)` overrides in the same file.

Components in `src/components/ui/` are shadcn/ui primitives; `src/components/shared/` has app-specific reusable components.
