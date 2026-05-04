# Changelog

## [1.6.0](https://github.com/dpaul20/gastos-en-pareja/compare/gastos-en-pareja-v1.5.5...gastos-en-pareja-v1.6.0) (2026-05-04)


### ✨ Features

* **#89:** fix sonar issues, add a11y and invitation e2e tests, sonarcloud ci ([72be51c](https://github.com/dpaul20/gastos-en-pareja/commit/72be51c0c20e90ad5844068566ae4519e740c372))
* **#89:** invitation flow gaps, balance model improvements, auto_renew fix ([55fb6ce](https://github.com/dpaul20/gastos-en-pareja/commit/55fb6ce3e2fb2e9b209e490dd2cd26172f02a0a6))
* **balance:** add savings capacity, is_shared split and auto_renew fix ([1eb6773](https://github.com/dpaul20/gastos-en-pareja/commit/1eb677343baeb9a0ec9b92328f781629a8403ebb)), closes [#89](https://github.com/dpaul20/gastos-en-pareja/issues/89)
* **db:** add is_shared to variable_expenses and seed vision categories ([b789e77](https://github.com/dpaul20/gastos-en-pareja/commit/b789e7760f2cb44b4380d137c71c69595dccd3b8)), closes [#89](https://github.com/dpaul20/gastos-en-pareja/issues/89)


### 🐛 Bug Fixes

* **couple:** harden invitation flow with email validation and pending discovery ([48332e4](https://github.com/dpaul20/gastos-en-pareja/commit/48332e44e660df1e4c9d1ef4db455c93b6394e16)), closes [#89](https://github.com/dpaul20/gastos-en-pareja/issues/89)
* **husky:** separate pre-push commands with newlines ([8f49d8a](https://github.com/dpaul20/gastos-en-pareja/commit/8f49d8a7210381cf0163d06453db2116f2f69782))

## [1.5.5](https://github.com/dpaul20/gastos-en-pareja/compare/gastos-en-pareja-v1.5.4...gastos-en-pareja-v1.5.5) (2026-05-03)


### 🐛 Bug Fixes

* **husky:** fix pre-push newline so tsc and coverage run as separate commands ([531160b](https://github.com/dpaul20/gastos-en-pareja/commit/531160b0c042b377c04dd471c2aac230cdd54639))

## [1.5.4](https://github.com/dpaul20/gastos-en-pareja/compare/gastos-en-pareja-v1.5.3...gastos-en-pareja-v1.5.4) (2026-05-03)


### 🐛 Bug Fixes

* **couple:** avoid maybeSingle failure with duplicate memberships ([0ea82fa](https://github.com/dpaul20/gastos-en-pareja/commit/0ea82faf4fd2695d898e491853b86e1ed3154121))
* **couple:** handle duplicate memberships when checking current couple ([cb26632](https://github.com/dpaul20/gastos-en-pareja/commit/cb266328adf86ccd0c4a14654049fdc8001528ac))

## [1.5.3](https://github.com/dpaul20/gastos-en-pareja/compare/gastos-en-pareja-v1.5.2...gastos-en-pareja-v1.5.3) (2026-05-03)


### 🐛 Bug Fixes

* **ci:** export SUPABASE_SERVICE_ROLE_KEY for Next.js WebServer in E2E job ([73e7f52](https://github.com/dpaul20/gastos-en-pareja/commit/73e7f52cd10eef3997dfa0881db42b1b3203a129))
* **ci:** export SUPABASE_SERVICE_ROLE_KEY for Next.js WebServer in E2E job ([d44886f](https://github.com/dpaul20/gastos-en-pareja/commit/d44886f295f92e87b0a4f7043ed4a225fb0dcb21))

## [1.5.2](https://github.com/dpaul20/gastos-en-pareja/compare/gastos-en-pareja-v1.5.1...gastos-en-pareja-v1.5.2) (2026-05-03)


### 🐛 Bug Fixes

* remove UTF-8 BOM from RLS migration file ([364e10e](https://github.com/dpaul20/gastos-en-pareja/commit/364e10e1cbbaac08f3c804dcfbf26ffd489f9c2c))
* **rls:** add SET row_security=off to SECURITY DEFINER functions ([dee7045](https://github.com/dpaul20/gastos-en-pareja/commit/dee704594809fd4a47745781939d94e9f4aacf49))
* **rls:** replace circular couple_members policy with direct user_id check ([cf7d7cb](https://github.com/dpaul20/gastos-en-pareja/commit/cf7d7cbf397ced0a8557649c8d749eb40a69e1e4))

## [1.5.1](https://github.com/dpaul20/gastos-en-pareja/compare/gastos-en-pareja-v1.5.0...gastos-en-pareja-v1.5.1) (2026-05-02)


### 🐛 Bug Fixes

* app-level bugs found during E2E test coverage ([e656426](https://github.com/dpaul20/gastos-en-pareja/commit/e656426bd77f398f87cbb6e5a2b63dcf6afb274c))
* app-level bugs found during E2E test coverage ([815144f](https://github.com/dpaul20/gastos-en-pareja/commit/815144fca41c2b47bf16b571000a324dbad4a981)), closes [#70](https://github.com/dpaul20/gastos-en-pareja/issues/70)

## [1.5.0](https://github.com/dpaul20/gastos-en-pareja/compare/gastos-en-pareja-v1.4.1...gastos-en-pareja-v1.5.0) (2026-05-02)


### ✨ Features

* **settings:** show invite sent confirmation and block resend until expiry ([a5fcc8f](https://github.com/dpaul20/gastos-en-pareja/commit/a5fcc8f10652df9b7833ee47c776118d4f38e7f6)), closes [#66](https://github.com/dpaul20/gastos-en-pareja/issues/66)


### 🐛 Bug Fixes

* **a11y:** replace div role=group with semantic fieldset in CategoryPicker ([6282541](https://github.com/dpaul20/gastos-en-pareja/commit/6282541cbf71ad1310cdd6523763af6a7d13e680)), closes [#63](https://github.com/dpaul20/gastos-en-pareja/issues/63)
* **auth:** pass next query param through OAuth for unauthenticated invite flow ([c67aca5](https://github.com/dpaul20/gastos-en-pareja/commit/c67aca50fc9c050b44934f42f42fd9b8b4d562bd)), closes [#65](https://github.com/dpaul20/gastos-en-pareja/issues/65)
* **auth:** wrap useSearchParams in Suspense boundary on login page ([78a67ec](https://github.com/dpaul20/gastos-en-pareja/commit/78a67ec5c1a40a0de4748b781e87bfd37d000dc7))
* **invitations:** deduplicate pending invitations and enforce unique constraint ([0c20e07](https://github.com/dpaul20/gastos-en-pareja/commit/0c20e0746eebbb53aa2a0ebefffcd9deb07e33bc)), closes [#61](https://github.com/dpaul20/gastos-en-pareja/issues/61)
* **proxy:** exclude /auth/callback and static assets from auth guard ([85650f4](https://github.com/dpaul20/gastos-en-pareja/commit/85650f44431812ac747281e14f36f636b1b8a639)), closes [#59](https://github.com/dpaul20/gastos-en-pareja/issues/59)
* **security:** harden SECURITY DEFINER functions and inline is_couple_member in RLS policies ([cce218d](https://github.com/dpaul20/gastos-en-pareja/commit/cce218d0dcd24b869787d2764487693e56faa931)), closes [#60](https://github.com/dpaul20/gastos-en-pareja/issues/60)
* **security:** move get_couple_member_profiles RPC to server-side API route ([174d835](https://github.com/dpaul20/gastos-en-pareja/commit/174d83579e8ada7e9d915f9c3cede8867e15dcc7)), closes [#62](https://github.com/dpaul20/gastos-en-pareja/issues/62)
* **supabase:** createServiceClient uses admin client without user session ([415acbd](https://github.com/dpaul20/gastos-en-pareja/commit/415acbd2c2a2e0182f58be653861a74458acbe48)), closes [#64](https://github.com/dpaul20/gastos-en-pareja/issues/64)

## [1.4.1](https://github.com/dpaul20/gastos-en-pareja/compare/gastos-en-pareja-v1.4.0...gastos-en-pareja-v1.4.1) (2026-05-02)


### 🐛 Bug Fixes

* invitation acceptance redirect swallowed by try/catch ([ef49601](https://github.com/dpaul20/gastos-en-pareja/commit/ef49601536e58c3f5faa48dee6163e0e53353d66))
* move redirect() outside try/catch in invite page ([99e4f90](https://github.com/dpaul20/gastos-en-pareja/commit/99e4f90d46e45df1d177ccb4a702938d1a50afca))

## [1.4.0](https://github.com/dpaul20/gastos-en-pareja/compare/gastos-en-pareja-v1.3.3...gastos-en-pareja-v1.4.0) (2026-05-02)


### ✨ Features

* **email:** migrate to Brevo with provider-agnostic abstraction ([27dac63](https://github.com/dpaul20/gastos-en-pareja/commit/27dac634dfc13e3d313fb24f54f5ed01ace2b63b))
* **email:** migrate to Brevo with provider-agnostic abstraction ([d043f15](https://github.com/dpaul20/gastos-en-pareja/commit/d043f1506897d842636a07d3ecc2481c3b5578f9)), closes [#50](https://github.com/dpaul20/gastos-en-pareja/issues/50)

## [1.3.3](https://github.com/dpaul20/gastos-en-pareja/compare/gastos-en-pareja-v1.3.2...gastos-en-pareja-v1.3.3) (2026-05-02)


### 🐛 Bug Fixes

* manejar errores de Server Components con digest ([808dc7f](https://github.com/dpaul20/gastos-en-pareja/commit/808dc7f8c9f4a956e2303b40d863e0937d6e1938))
* manejar errores de Server Components con digest ([df256eb](https://github.com/dpaul20/gastos-en-pareja/commit/df256eb8fa9a3595f7cf7ed6878a316343834b21)), closes [#45](https://github.com/dpaul20/gastos-en-pareja/issues/45)
* revert String.raw tagged template in proxy config matcher ([e434d6f](https://github.com/dpaul20/gastos-en-pareja/commit/e434d6f18ae89e13ecb70834d5175ddf9e0b55ff))
* use reset prop and static env vars in error boundary and client ([0675d8d](https://github.com/dpaul20/gastos-en-pareja/commit/0675d8d84218359c574807f09b050a88d50a4640))

## [1.3.2](https://github.com/dpaul20/gastos-en-pareja/compare/gastos-en-pareja-v1.3.1...gastos-en-pareja-v1.3.2) (2026-05-02)


### 🐛 Bug Fixes

* incluir codigo y cuerpo de error en fallo de Resend ([43b4191](https://github.com/dpaul20/gastos-en-pareja/commit/43b41912adffbd22211e99673b43b753c59abe9e)), closes [#42](https://github.com/dpaul20/gastos-en-pareja/issues/42)
* mejorar mensaje de error al enviar invitación por email ([c862bfa](https://github.com/dpaul20/gastos-en-pareja/commit/c862bfa2128dd63e142111c39610b2b3b49be07a))

## [1.3.1](https://github.com/dpaul20/gastos-en-pareja/compare/gastos-en-pareja-v1.3.0...gastos-en-pareja-v1.3.1) (2026-04-29)


### 🐛 Bug Fixes

* cambia from de Resend a onboarding@resend.dev ([0f3a67d](https://github.com/dpaul20/gastos-en-pareja/commit/0f3a67da6abe53570782faf9daac9363b07a0b36))
* cambia from de Resend a onboarding@resend.dev ([9f78c2e](https://github.com/dpaul20/gastos-en-pareja/commit/9f78c2e51adc6135f02f762381c5189ac9ad1f1c))

## [1.3.0](https://github.com/dpaul20/gastos-en-pareja/compare/gastos-en-pareja-v1.2.0...gastos-en-pareja-v1.3.0) (2026-04-29)


### ✨ Features

* gastos recurrentes automáticos ([5fc749b](https://github.com/dpaul20/gastos-en-pareja/commit/5fc749b69e2499a48c5158343b8540382eba7f5a))
* gastos recurrentes automáticos ([3b1cdd1](https://github.com/dpaul20/gastos-en-pareja/commit/3b1cdd177ca495f071ddcd170bd1423f30a2626d)), closes [#32](https://github.com/dpaul20/gastos-en-pareja/issues/32)

## [1.2.0](https://github.com/dpaul20/gastos-en-pareja/compare/gastos-en-pareja-v1.1.0...gastos-en-pareja-v1.2.0) (2026-04-29)


### ✨ Features

* categorías de gastos ([3f40acb](https://github.com/dpaul20/gastos-en-pareja/commit/3f40acbfb9629d290a3ec6809369df7984d6dcd0))
* categorías de gastos ([958b526](https://github.com/dpaul20/gastos-en-pareja/commit/958b526a66481cf80786d8e8da2e281d4cb8909d)), closes [#31](https://github.com/dpaul20/gastos-en-pareja/issues/31)


### 🐛 Bug Fixes

* avatares e iniciales dinámicas en Dashboard y Gastos ([27cf148](https://github.com/dpaul20/gastos-en-pareja/commit/27cf148eb6d6f322d908576ff93bd97b33fe35d0))
* avatares e iniciales dinámicas en Dashboard y Gastos ([77a6faf](https://github.com/dpaul20/gastos-en-pareja/commit/77a6faf85dbc83807e220be1cf248af7d3c52695)), closes [#27](https://github.com/dpaul20/gastos-en-pareja/issues/27)

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
