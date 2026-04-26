# Skill Registry — gastos-en-pareja

Generated: 2026-04-25
Stack: Next.js 15, Supabase, TanStack Query, Zustand, shadcn/ui, Tailwind CSS, TypeScript

## Active Skills

| Skill                         | Trigger Context                                            |
| ----------------------------- | ---------------------------------------------------------- |
| `supabase`                    | Any Supabase task — Auth, DB, RLS, Edge Functions, client  |
| `vercel:nextjs`               | Next.js App Router, RSC, Server Actions, layouts, routing  |
| `vercel:react-best-practices` | React components, hooks, performance, TSX files            |
| `vercel:shadcn`               | shadcn/ui components, theming, Tailwind, custom registries |
| `vercel:auth`                 | Supabase Auth, SSO, Google OAuth, session management       |
| `vercel:vercel-functions`     | API routes, Server Actions, Fluid Compute                  |
| `vercel:vercel-storage`       | Supabase Postgres, Blob, Edge Config                       |
| `ui-ux-pro-max`               | UI/UX design, dashboard layout, responsive design          |
| `vercel-composition-patterns` | Component composition, compound components, reusable APIs  |
| `branch-pr`                   | Creating pull requests                                     |
| `issue-creation`              | Creating GitHub issues                                     |
| `judgment-day`                | Adversarial code review                                    |
| `sdd-explore`                 | Exploring features before implementation                   |
| `sdd-propose`                 | Creating change proposals                                  |
| `sdd-spec`                    | Writing specifications                                     |
| `sdd-design`                  | Technical design documents                                 |
| `sdd-tasks`                   | Task breakdown                                             |
| `sdd-apply`                   | Implementation                                             |
| `sdd-verify`                  | Validation                                                 |
| `sdd-archive`                 | Archiving completed changes                                |

## Compact Rules

### Next.js App Router

- Use Server Components by default; add `"use client"` only when needed (interactivity, hooks, browser APIs)
- Data fetching in Server Components, mutations via Server Actions
- Colocate loading.tsx / error.tsx with route segments

### Supabase

- Always use `@supabase/ssr` for Next.js integration (not `@supabase/supabase-js` directly in components)
- RLS policies are the auth boundary — never trust client-side user ID
- Use `createServerClient` in Server Components, `createBrowserClient` in Client Components

### React / TypeScript

- Prefer named exports over default exports for components
- Use `interface` over `type` for object shapes; `type` for unions/intersections
- No `any` — use `unknown` + type narrowing when type is genuinely unknown

### Tailwind / shadcn

- Use `cn()` utility for conditional class merging
- Extend shadcn components rather than modifying the source files in `components/ui/`
- Design tokens via CSS variables — don't hardcode colors

### Commits (Conventional Commits)

- `feat:` new feature
- `fix:` bug fix
- `refactor:` code change without behavior change
- `chore:` tooling, deps, config
- `docs:` documentation only
