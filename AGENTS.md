<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

---

# Coding Standards — gastos-en-pareja

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Supabase · TanStack Query v5 · Zustand · Zod · react-hook-form · Tailwind CSS v4 · Serwist (PWA)

---

## 1. Server vs Client boundary

- Server Components (`page.tsx`, `layout.tsx`, etc.) are server-side **by default** — NO directive needed. They fetch data directly from Supabase using `@/lib/supabase/server`.
- Server Actions MUST start with `"use server"` — these live in `src/lib/actions/` and handle mutations called from the client.
- Files that use hooks, state, or browser APIs MUST start with `"use client"`.
- NEVER import `@/lib/supabase/server` inside a `"use client"` file.
- NEVER import `@/lib/supabase/client` inside a Server Action or Server Component.
- Client queries (TanStack Query hooks) live in `src/lib/queries/`.

## 2. Server Actions

- Every Server Action MUST call `supabase.auth.getUser()` to verify the user — never trust client-passed IDs.
- After mutations, call `revalidatePath()` for every route that displays the changed data.
- NEVER return raw Supabase errors to the client — throw typed `Error` instances with user-safe messages.
- Use the shared `getCouple()` helper pattern (already in `expenses.ts`) instead of duplicating couple resolution logic.
- NEVER wrap `redirect()` or `notFound()` in a `try-catch` — they throw special internal errors that Next.js handles. Catch only your own errors, then call redirect/notFound outside the catch block.

## 3. Data fetching — TanStack Query

- All client-side data fetching MUST go through `useQuery` / `useMutation` from `@tanstack/react-query`.
- `queryKey` MUST include all variables the query depends on: `["monthly-data", coupleId, month]`.
- Use `enabled: !!dependency` to prevent queries from firing with null values.
- NEVER do bare `await supabase.from(...)` inside a Client Component — use a query hook.

## 4. TypeScript

- All types MUST be derived from `Database` in `@/types/database.ts` — no manual interface duplication.
- Use `type` imports: `import type { Database } from "@/types/database"`.
- NEVER use `any`. Use `unknown` and narrow it.
- Props interfaces MUST be co-located with their component, not in a separate types file.

## 5. Styling

- Use CSS custom properties (`var(--accent)`, `var(--bg-sunken)`, `var(--fg-2)`) for colors — never hardcode hex/rgb values.
- Use `cn()` from `@/lib/utils` for conditional class merging (clsx + tailwind-merge).
- Inline styles are acceptable for layout-only rules (display, flex, gap) in leaf components.
- NEVER mix Tailwind classes and inline styles for the same CSS property on the same element.

## 6. Components

- Use **named exports** for all components — no default exports.
- Sub-components scoped to a single page MUST be defined in the same file, above the main component, with the `// ── SUB-COMPONENTS ───` comment separator.
- Component files MUST be kebab-case: `category-picker.tsx`, `month-header.tsx`.
- Shared/reusable components go in `src/components/shared/`. Page-specific ones stay in the page file.

## 7. Utilities

- Pure functions that compute data (no Supabase, no React) MUST live in `src/lib/utils/`.
- Currency formatting MUST use `formatARS()` from `@/lib/utils` — never inline `toLocaleString`.
- Month formatting MUST use `formatMonth()` from `@/lib/utils`.
- NEVER add side effects to utility functions.

## 8. Forms

- Forms MUST use `react-hook-form` + `@hookform/resolvers/zod`.
- Zod schemas MUST be defined outside the component, at module level.
- NEVER use uncontrolled `useState` for form fields when `react-hook-form` is already in scope.

## 9. Error handling

- Supabase queries that return `{ data, error }` MUST check `error` before using `data`.
- In Server Actions, throw — don't return error objects.
- In Client Components, handle query errors via the `error` property from `useQuery`.
- Route-level errors are caught by `error.tsx` (must be `'use client'`). It receives `{ error, reset }` props.
- Root layout errors are caught by `global-error.tsx` — must include `<html>` and `<body>` tags.

## 10. What NOT to do

- NEVER use `getServerSideProps` or `getStaticProps` — this is App Router.
- NEVER use `useRouter().push()` for post-mutation navigation — use `redirect()` from `next/navigation` inside a Server Action for redirects, and `revalidatePath()` to invalidate cache. These are separate concerns: `redirect()` navigates, `revalidatePath()` busts cache. You often need both.
- NEVER make a Client Component `async` — only Server Components can be async. If you need data in a client component, receive it as props from a Server Component parent.
- NEVER pass non-serializable values (functions, `Date` objects, class instances, `Map`, `Set`) as props from Server → Client components. Serialize to plain objects/strings first.
- NEVER commit `console.log` statements.
- NEVER add `// eslint-disable` comments without a written justification in the same line.
- NEVER bypass RLS by using the service role key in client-facing code.
- NEVER create a `route.ts` in the same folder as a `page.tsx` — they conflict. API routes go under `src/app/api/`.

## 11. Database migrations

- `.github/workflows/release-please.yml` runs `supabase db push` against **production** automatically whenever a release is created. A migration merged to `master` reaches prod unattended — there is no window to intervene and nobody is prompted.
- Therefore a header comment like "take a snapshot before applying this" is **not** a safeguard. It is documentation, and it cannot stop the pipeline. Never rely on one.
- Any migration that DELETEs or DROPs data MUST be recoverable **by construction**: copy every affected row into a backup table inside the same transaction, and document the restore statement in the migration header.
- Backup tables go in a `backup` schema. `supabase/config.toml` exposes only `public` and `graphql_public`, so a `backup` schema stays off the PostgREST API; also `revoke all ... from anon, authenticated` as defense-in-depth.
- Write restore statements with **explicit column names on both sides** of the INSERT. Physical column order is not the logical order — `fixed_expense_instances` is `id, template_id, couple_id, month, paid, created_at, amount_override, status, paid_by_user_id, due_day` — so a positional INSERT fails or, worse, silently writes to the wrong columns. (`create table backup.x (like public.y)` does preserve source order, so `insert into backup.x select y.*, now()` is safe.)
- Verify a destructive migration against a local database **before** merging: seed rows that MUST be deleted alongside rows that MUST survive, run the migration SQL, assert both sets, exercise the restore round-trip, then `ROLLBACK`.
- NEVER edit a migration that has already been applied — Supabase records it by version and will not re-run it, so the file silently diverges from the real schema history. Fix it forward with a new migration.
- Use `supabase migration up` to apply locally — NEVER `supabase db reset` (destroys local data).

## 12. Next.js framework rules

Before writing any Next.js code, load the `next-best-practices` skill. It covers:

- **Async APIs** — `params`, `searchParams`, `cookies()`, `headers()` are Promises in Next.js 15+
- **Suspense boundaries** — `useSearchParams()` / `usePathname()` require `<Suspense>` or the page degrades to CSR
- **RSC boundaries** — async Client Components, non-serializable props detection
- **Route Handlers vs Server Actions** — decision tree for when to use each
- **Directives** — `'use client'`, `'use server'`, `'use cache'`
- **Error boundaries** — `error.tsx`, `global-error.tsx`, `not-found.tsx`
