# Changelog

## [1.1.0](https://github.com/dpaul20/gastos-en-pareja/compare/gastos-en-pareja-v1.0.1...gastos-en-pareja-v1.1.0) (2026-04-27)


### ✨ Features

* conecta Dashboard y Settings con datos reales ([a04cb84](https://github.com/dpaul20/gastos-en-pareja/commit/a04cb84049a3e4c2baa8c7d01751ba43346de746))
* conecta Dashboard y Settings con datos reales ([114d0a0](https://github.com/dpaul20/gastos-en-pareja/commit/114d0a090bde0bf16261a2002f42ab37914a6b72))
* conecta Gastos e Historial con datos reales ([63867b2](https://github.com/dpaul20/gastos-en-pareja/commit/63867b2e3f66ecf1b8c73cd0711572de9adbe1d8))
* nombres reales en Settings + oculta meses vacíos en Historial ([48fc4d8](https://github.com/dpaul20/gastos-en-pareja/commit/48fc4d843478ea7a79b5d70919f1efd38f7429c4))


### 🐛 Bug Fixes

* avatares de pareja no se superponen con el nombre ([930f865](https://github.com/dpaul20/gastos-en-pareja/commit/930f86583416e628ad039ed9355d82a0a9d40708))
* exclui e2e/ do Vitest para evitar conflito com Playwright ([d976bfb](https://github.com/dpaul20/gastos-en-pareja/commit/d976bfba9b6570c6a0b64c1c1f361f2f5d6b609a))
* get_couple_member_profiles acepta user_id explícito ([d7abc70](https://github.com/dpaul20/gastos-en-pareja/commit/d7abc70516c675b80a100c3b91b5d81f013d3982))
* mueve ensureFixedExpenseInstances a useEffect en Dashboard ([6e18834](https://github.com/dpaul20/gastos-en-pareja/commit/6e1883474954b03b99dd8dea53efcc503edf4870))

## [1.0.1](https://github.com/dpaul20/gastos-en-pareja/compare/gastos-en-pareja-v1.0.0...gastos-en-pareja-v1.0.1) (2026-04-27)


### 🐛 Bug Fixes

* agrega 127.0.0.1 a allowedDevOrigins para OAuth local ([5ec7391](https://github.com/dpaul20/gastos-en-pareja/commit/5ec7391b83f21f3b9f2ff6c38d901e073f826fee))
* CSP y OAuth redirect para desarrollo local con Supabase ([4a48154](https://github.com/dpaul20/gastos-en-pareja/commit/4a4815449648b239c153531db0fbb6d9f1b053e2))
* CSP y OAuth redirect para desarrollo local con Supabase ([f21f8a7](https://github.com/dpaul20/gastos-en-pareja/commit/f21f8a7ad12bc4a7fdc0a5e61faaf0998fb5b1d2)), closes [#20](https://github.com/dpaul20/gastos-en-pareja/issues/20)

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
