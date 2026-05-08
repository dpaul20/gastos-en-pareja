# Skill Registry — gastos-en-pareja

Generated: 2026-05-06
Stack: Next.js 16.2.4 (App Router), React 19, TypeScript 6, Supabase, TanStack Query v5, Zustand 5, shadcn/ui, Tailwind CSS v4, Vitest, Playwright

## Active Skills

| Skill                          | Trigger Context                                            |
| ------------------------------ | ---------------------------------------------------------- |
| `supabase`                     | Any Supabase task — Auth, DB, RLS, Edge Functions, client  |
| `vercel:nextjs`                | Next.js App Router, RSC, Server Actions, layouts, routing  |
| `vercel:react-best-practices`  | React components, hooks, performance, TSX files            |
| `vercel:shadcn`                | shadcn/ui components, theming, Tailwind, custom registries |
| `vercel:auth`                  | Supabase Auth, SSO, Google OAuth, session management       |
| `vercel:vercel-functions`      | API routes, Server Actions, Fluid Compute                  |
| `vercel:vercel-storage`        | Supabase Postgres, Blob, Edge Config                       |
| `vercel:next-cache-components` | Caching, PPR, use cache directive, ISR                     |
| `ui-ux-pro-max`                | UI/UX design, dashboard layout, responsive design          |
| `vercel-composition-patterns`  | Component composition, compound components, reusable APIs  |
| `branch-pr`                    | Creating pull requests                                     |
| `issue-creation`               | Creating GitHub issues                                     |
| `judgment-day`                 | Adversarial code review                                    |
| `sdd-explore`                  | Exploring features before implementation                   |
| `sdd-propose`                  | Creating change proposals                                  |
| `sdd-spec`                     | Writing specifications                                     |
| `sdd-design`                   | Technical design documents                                 |
| `sdd-tasks`                    | Task breakdown                                             |
| `sdd-apply`                    | Implementation                                             |
| `sdd-verify`                   | Validation                                                 |
| `sdd-archive`                  | Archiving completed changes                                |

## Compact Rules

### Next.js 16 App Router

- Server Components are the default — NO directive needed; add `"use client"` only for interactivity, hooks, browser APIs
- `params` and `searchParams` are now **async** Promises — always `await` them in Server Components
- Data fetching in Server Components; mutations via Server Actions (`"use server"` + `revalidatePath`)
- NEVER import `@/lib/supabase/server` in `"use client"` files; NEVER import `@/lib/supabase/client` in Server Actions
- Route Handlers (`route.ts`) and `page.tsx` CANNOT coexist in the same folder — API routes go under `src/app/api/`
- NEVER wrap `redirect()` or `notFound()` in try-catch — they throw special errors Next.js handles internally
- `useSearchParams()` and `usePathname()` require `<Suspense>` wrapper or page degrades to full CSR

### Supabase

- Always call `supabase.auth.getUser()` in Server Actions — never trust client-passed IDs
- RLS policies are the security boundary — never bypass with service role key in client-facing code
- Use `createServerClient` (`@supabase/ssr`) in Server Components/Actions; `createBrowserClient` in Client Components
- Supabase queries return `{ data, error }` — ALWAYS check error before using data

### React 19 / TypeScript

- Named exports for ALL components — no default exports
- All types derived from `Database` in `@/types/database.ts` — no manual interface duplication
- Use `type` imports: `import type { Database } from "@/types/database"`
- No `any` — use `unknown` + type narrowing
- Props interfaces co-located with their component (not separate types file)

### TanStack Query v5

- All client-side data fetching via `useQuery` / `useMutation`
- `queryKey` MUST include all variables: `["monthly-data", coupleId, month]`
- Use `enabled: !!dependency` to prevent queries firing with null values
- NEVER do bare `await supabase.from(...)` in a Client Component

### Tailwind CSS v4 / shadcn

- Use CSS custom properties (`var(--accent)`, `var(--bg-sunken)`, `var(--fg-2)`) — NEVER hardcode hex/rgb
- Use `cn()` from `@/lib/utils` for conditional class merging
- Extend shadcn components — do NOT modify `components/ui/` source files directly
- NEVER mix Tailwind classes and inline styles for the same CSS property on the same element

### Forms

- Forms MUST use `react-hook-form` + `@hookform/resolvers/zod`
- Zod schemas defined at module level (outside the component)
- NEVER use uncontrolled `useState` for form fields when react-hook-form is in scope

### Utilities

- `formatARS()` for currency formatting — NEVER inline `toLocaleString`
- `formatMonth()` for month formatting
- Pure functions (no Supabase, no React) in `src/lib/utils/`

### Components

- Sub-components scoped to a single page: defined in same file, above main component, separated by `// ── SUB-COMPONENTS ───`
- Shared/reusable components → `src/components/shared/`
- Component files kebab-case: `category-picker.tsx`, `month-header.tsx`

### Testing (Strict TDD — ENABLED)

- Unit tests (Vitest): pure utils in `src/lib/utils/` only
- E2E tests (Playwright): Chromium mobile (Pixel 5), covers UI + actions + queries
- Run unit: `npm test` | Watch: `npm run test:watch` | Coverage: `npm run test:coverage`
- Run e2e: `npm run test:e2e` | A11y: `npm run test:a11y`
- Coverage thresholds: 80% lines/functions, 70% branches

### Commits (Conventional Commits)

- `feat:` new feature
- `fix:` bug fix
- `refactor:` code change without behavior change
- `chore:` tooling, deps, config
- `docs:` documentation only
- No "Co-Authored-By" or AI attribution in commits
