# Changelog

## [1.0.0](https://github.com/dpaul20/gastos-en-pareja/compare/gastos-en-pareja-v0.9.0...gastos-en-pareja-v1.0.0) (2026-04-27)


### ⚠ BREAKING CHANGES

* reescritura total del stack y arquitectura. Reemplaza Next.js 14 + Prisma + NextAuth con Next.js 16 + Supabase + TanStack Query. Datos de v1 no son compatibles.

### ✨ Features

* business logic — Server Actions, balance, TanStack Query e invitaciones ([c7ffda6](https://github.com/dpaul20/gastos-en-pareja/commit/c7ffda6ad7efcb1f10c49208d9bc584e666e954c))
* business logic — Server Actions, balance, TanStack Query y invitaciones ([c6ed1b6](https://github.com/dpaul20/gastos-en-pareja/commit/c6ed1b665d5068e0727f8a26578004120eca74c2)), closes [#4](https://github.com/dpaul20/gastos-en-pareja/issues/4)
* Gastos en Pareja v2.0 — Rewrite completo ([b0a96e0](https://github.com/dpaul20/gastos-en-pareja/commit/b0a96e03e18f4129a93ac1b28b6c21ce003ee84e))
* PWA — Serwist, manifest, meta tags e install prompt ([94614d2](https://github.com/dpaul20/gastos-en-pareja/commit/94614d20385fa85a2e5a04cbbab0e6943ce9fc06))
* PWA — Serwist, manifest, meta tags e install prompt ([6adea4f](https://github.com/dpaul20/gastos-en-pareja/commit/6adea4f333a4cdbf33bf131cde706fad38b7d613)), closes [#5](https://github.com/dpaul20/gastos-en-pareja/issues/5)
* seguridad — headers, CSP, rate limiting + elimina NEXT_PUBLIC_APP_URL ([f0d3d81](https://github.com/dpaul20/gastos-en-pareja/commit/f0d3d816e7b9920b563894910fce8eb0d7fc6c6a))
* seguridad — headers, CSP, rate limiting + elimina NEXT_PUBLIC_APP_URL ([3c7945a](https://github.com/dpaul20/gastos-en-pareja/commit/3c7945aaf5dd97c06566e5194b0d9febfd767577)), closes [#6](https://github.com/dpaul20/gastos-en-pareja/issues/6) [#13](https://github.com/dpaul20/gastos-en-pareja/issues/13)
* SEO — metadata, OG, Twitter Card, robots, sitemap y JSON-LD ([8ff9c02](https://github.com/dpaul20/gastos-en-pareja/commit/8ff9c020bbb8201ca4fb6d29f04683d2f7bf7f8f))
* SEO — metadata, OG, Twitter Card, robots, sitemap y JSON-LD ([19c909c](https://github.com/dpaul20/gastos-en-pareja/commit/19c909c0fad7d3c11a2d026a868006d72953ed7d)), closes [#7](https://github.com/dpaul20/gastos-en-pareja/issues/7)
* setup inicial v2 — Next.js 16, Tailwind v4, tooling completo ([1f52120](https://github.com/dpaul20/gastos-en-pareja/commit/1f52120b2fb69a7bb5b80829ee9d69a9a9079599))
* setup inicial v2 — Next.js 16, Tailwind v4, tooling completo ([9915aab](https://github.com/dpaul20/gastos-en-pareja/commit/9915aab2be1a7a18eef64f467056ad52b0f1244f)), closes [#1](https://github.com/dpaul20/gastos-en-pareja/issues/1)
* Supabase schema, RLS, auth Google SSO y clientes ([dd170d2](https://github.com/dpaul20/gastos-en-pareja/commit/dd170d2e2b8657aa4593e84ef978a322c498cdb5))
* Supabase schema, RLS, auth Google SSO y clientes ([6670309](https://github.com/dpaul20/gastos-en-pareja/commit/66703098df53da10865a5ad9185627ca9e5608bd)), closes [#2](https://github.com/dpaul20/gastos-en-pareja/issues/2)
* UI screens — implementación Claude Design handoff ([87a9b07](https://github.com/dpaul20/gastos-en-pareja/commit/87a9b07078d4e969b4caeb53a0ce03361cb198cc))
* UI screens — implementación Claude Design handoff ([9038676](https://github.com/dpaul20/gastos-en-pareja/commit/9038676ea63990fb9ad3a3b6f307fa8cc58c20db)), closes [#3](https://github.com/dpaul20/gastos-en-pareja/issues/3)
* v2.0 — rewrite completo sobre Next.js 16 + Supabase ([8e1cf9d](https://github.com/dpaul20/gastos-en-pareja/commit/8e1cf9deabde20026492f9f1f5c6c42556f4b4da))


### 🐛 Bug Fixes

* fuentes via next/font — elimina [@import](https://github.com/import) Google Fonts de globals.css ([02c46ef](https://github.com/dpaul20/gastos-en-pareja/commit/02c46ef41ff043825a8be6f979f1aa928bc99062))
* Serwist configurator mode (Turbopack) + proxy renaming (Next.js 16) ([340a0dd](https://github.com/dpaul20/gastos-en-pareja/commit/340a0ddcdd18c9c378a0a821fca383aa7a23c96b))
