# Changelog

## [1.16.0](https://github.com/dpaul20/gastos-en-pareja/compare/gastos-en-pareja-v1.15.3...gastos-en-pareja-v1.16.0) (2026-06-20)


### ✨ Features

* **ui:** add Toast and ConfirmDialog primitives with AppShell provider ([d6e304a](https://github.com/dpaul20/gastos-en-pareja/commit/d6e304affb7225400aace872a64acb789295a546))
* **ui:** Toast + ConfirmDialog primitives with AppShell provider ([3e2abaa](https://github.com/dpaul20/gastos-en-pareja/commit/3e2abaab321e5c526187b6324cbc8a00aa591be0))


### 🐛 Bug Fixes

* **a11y:** add role=region to Toaster container to allow aria-label on div ([c2b5781](https://github.com/dpaul20/gastos-en-pareja/commit/c2b578140f5042853826ac388e923068011a67cc))
* **a11y:** resolve SonarCloud quality gate failures on Toast and ConfirmDialog ([5c3ab92](https://github.com/dpaul20/gastos-en-pareja/commit/5c3ab92c3717e78ed926492fd5beec96ab888abe))
* **security:** replace Math.random() with crypto.randomUUID() for toast IDs ([a3c7daa](https://github.com/dpaul20/gastos-en-pareja/commit/a3c7daa427ee959f90b09b656da354da7eb5161e))

## [1.15.3](https://github.com/dpaul20/gastos-en-pareja/compare/gastos-en-pareja-v1.15.2...gastos-en-pareja-v1.15.3) (2026-06-17)


### 🐛 Bug Fixes

* **husky:** normalize Windows drive letter in pre-push ([c566f0f](https://github.com/dpaul20/gastos-en-pareja/commit/c566f0f5e7cff32b366ebaa4ebb466c62da12fa7))
* **husky:** replace coverage+a11y with npm test in pre-push ([b131541](https://github.com/dpaul20/gastos-en-pareja/commit/b1315418e4f96cb7ff6695011e1769f1b2d7c609))
* **husky:** use bash shebang in pre-push for V8 coverage on Windows ([0ce50b6](https://github.com/dpaul20/gastos-en-pareja/commit/0ce50b69c5aff5485322671b8bbdfc9c686632a1))

## [1.15.2](https://github.com/dpaul20/gastos-en-pareja/compare/gastos-en-pareja-v1.15.1...gastos-en-pareja-v1.15.2) (2026-06-13)


### 🐛 Bug Fixes

* **ci:** use supabase link before db push in release workflow ([d1be226](https://github.com/dpaul20/gastos-en-pareja/commit/d1be2262cd35311189013f6fae58b66bc189da99))
* **ci:** use supabase link before db push in release workflow ([1364c86](https://github.com/dpaul20/gastos-en-pareja/commit/1364c869c9237f885ab3611706dc7fa4dbdd394b)), closes [#48](https://github.com/dpaul20/gastos-en-pareja/issues/48)

## [1.15.1](https://github.com/dpaul20/gastos-en-pareja/compare/gastos-en-pareja-v1.15.0...gastos-en-pareja-v1.15.1) (2026-06-10)


### 🐛 Bug Fixes

* **fijo:** enforce amount_override &gt; 0 via DB CHECK constraint ([c16e030](https://github.com/dpaul20/gastos-en-pareja/commit/c16e03026a57e9c38b18a29a496438d60f27a561))
* **fijo:** enforce amount_override &gt; 0 via DB CHECK constraint ([ba82eca](https://github.com/dpaul20/gastos-en-pareja/commit/ba82eca457bbc34cc39b99173f46091014611a7e))

## [1.15.0](https://github.com/dpaul20/gastos-en-pareja/compare/gastos-en-pareja-v1.14.1...gastos-en-pareja-v1.15.0) (2026-06-10)


### ✨ Features

* **nav:** replace mobile hamburger with bottom tab bar ([90d287d](https://github.com/dpaul20/gastos-en-pareja/commit/90d287d478569d7aa3c04b343e49eaaaa4307c5c))
* **nav:** replace mobile hamburger with bottom tab bar ([3810d4a](https://github.com/dpaul20/gastos-en-pareja/commit/3810d4a1e0973e18013e61f02247ef4a2738c99c))


### 🐛 Bug Fixes

* **forms:** improve touch targets and accessibility in expense forms ([3aa5af2](https://github.com/dpaul20/gastos-en-pareja/commit/3aa5af255e99fe018a554f27262c7c23aff8928d))
* **forms:** improve touch targets and accessibility in expense forms ([175906c](https://github.com/dpaul20/gastos-en-pareja/commit/175906c7640f68bd9677431c1d087395bf9bef22))
* **nav:** expose accessible name 'Configuración' on bottom nav settings link ([cb6eeee](https://github.com/dpaul20/gastos-en-pareja/commit/cb6eeee3a1e0799ff0d8cd2715a9c41cb67bda8b))

## [1.14.1](https://github.com/dpaul20/gastos-en-pareja/compare/gastos-en-pareja-v1.14.0...gastos-en-pareja-v1.14.1) (2026-06-09)


### 🐛 Bug Fixes

* **dashboard:** look up balance by userId instead of array index ([f7437f4](https://github.com/dpaul20/gastos-en-pareja/commit/f7437f49b04c4c1bf39ce5e3cd63bb7b1f2c8201))
* **dashboard:** look up balance by userId instead of array index ([bb644f7](https://github.com/dpaul20/gastos-en-pareja/commit/bb644f739d55b66ad516b3b1b4135a2787eeea65))

## [1.14.0](https://github.com/dpaul20/gastos-en-pareja/compare/gastos-en-pareja-v1.13.0...gastos-en-pareja-v1.14.0) (2026-06-09)


### ✨ Features

* **settings:** add shareable link invitation as alternative to email ([6cb3bd2](https://github.com/dpaul20/gastos-en-pareja/commit/6cb3bd2eacf80c2a2bd2b54c3f9f3d4314c43c7d))
* **settings:** shareable link invitation ([52f429b](https://github.com/dpaul20/gastos-en-pareja/commit/52f429be25945d32f5b0325d405a02312eb88a33))


### 🐛 Bug Fixes

* **login:** two-column desktop layout — remove maxWidth 390 hardcode ([cf76252](https://github.com/dpaul20/gastos-en-pareja/commit/cf762522887d6245848dfebfd7c2de15e4cbc000))

## [1.13.0](https://github.com/dpaul20/gastos-en-pareja/compare/gastos-en-pareja-v1.12.1...gastos-en-pareja-v1.13.0) (2026-06-08)


### ✨ Features

* **ui:** responsive modal — Dialog on desktop, Sheet on mobile for expense flows ([2bffdf8](https://github.com/dpaul20/gastos-en-pareja/commit/2bffdf8d083bdb0c6a5485090e11dc826836ba00))


### 🐛 Bug Fixes

* **layout:** constrain content width on desktop for expenses, history, settings ([a10263b](https://github.com/dpaul20/gastos-en-pareja/commit/a10263b1ebd7130ec789fce58a0dd69863600bef))
* **layout:** constrain content width on desktop for expenses, history, settings ([836f908](https://github.com/dpaul20/gastos-en-pareja/commit/836f90866c1aaf29bee3d419342af56063999ac9))

## [1.12.1](https://github.com/dpaul20/gastos-en-pareja/compare/gastos-en-pareja-v1.12.0...gastos-en-pareja-v1.12.1) (2026-06-08)


### 🐛 Bug Fixes

* **actions:** log actual Supabase errors in createCouple before throwing ([ad51d08](https://github.com/dpaul20/gastos-en-pareja/commit/ad51d083d34dfc75e33194310560e7c8d9042f6b))
* **actions:** log Supabase errors in createCouple + fix Husky hooks ([6507e61](https://github.com/dpaul20/gastos-en-pareja/commit/6507e61e51a52a6a76a4ac2ef3c67eafa19e177f))
* **e2e:** workers=1 en CI + set -e en pre-push hook ([297a5e5](https://github.com/dpaul20/gastos-en-pareja/commit/297a5e5c374ba7a98fc96affc811339dea4a82d5))
* **e2e:** workers=1 en CI para evitar race conditions entre test files ([fbe724b](https://github.com/dpaul20/gastos-en-pareja/commit/fbe724b5ccaa7a4a3c6a1e474aff2965eac605a4))
* **husky:** shebang y LF en hooks de Husky, gitattributes para Windows ([4765b51](https://github.com/dpaul20/gastos-en-pareja/commit/4765b519be0e6eec3e694c13fe86b5943e337610))

## [1.12.0](https://github.com/dpaul20/gastos-en-pareja/compare/gastos-en-pareja-v1.11.0...gastos-en-pareja-v1.12.0) (2026-06-08)


### ✨ Features

* **amount:** parseAmount canónico con soporte para formato argentino y reemplaza normalizeAmount ([b70d42d](https://github.com/dpaul20/gastos-en-pareja/commit/b70d42df604cc8b9afc4f49d2694322af2d1dc43))


### 🐛 Bug Fixes

* **a11y:** add sr-only h1 to dashboard — landmark spec requires h1 on every authenticated route ([b766a2d](https://github.com/dpaul20/gastos-en-pareja/commit/b766a2dbbb9d72dad5a52ccac22fc6b3d9aaa435))
* **a11y:** eliminar main duplicados, agregar nav landmark y assertions de estructura ([916e173](https://github.com/dpaul20/gastos-en-pareja/commit/916e173e6c222a47762870465650688f60485ab6))
* **a11y:** h2 en secciones de settings, label al input de ingreso, inputMode en Cuotas ([769f884](https://github.com/dpaul20/gastos-en-pareja/commit/769f884f5a24d28f66ce973aaec8a25e642e1411))
* **amount:** EditServiceSheet + MoneyField usan parseAmount y inputMode=decimal ([ae6a4bb](https://github.com/dpaul20/gastos-en-pareja/commit/ae6a4bbd10c79203f778cf3b80639da8bc896b01))
* **content:** corregir mojibake en history y label de fecha en add-sheet ([3ad0b7e](https://github.com/dpaul20/gastos-en-pareja/commit/3ad0b7ee6057731f8fa344a85a4c6c95bab5990c))
* **darkmode:** reemplazar colores hardcoded por tokens semánticos en badges y chart ([df6fe56](https://github.com/dpaul20/gastos-en-pareja/commit/df6fe56ee87813bc0e6bafbcd768c074125c224f))
* frontend quality remediation — a11y, dark mode, amount parsing, responsive ([30c1d93](https://github.com/dpaul20/gastos-en-pareja/commit/30c1d93821ac40e7bf0c860f52a01c13ebd58c81))
* **husky:** shebang + LF line endings, gitattributes para hooks en Windows ([5d3ffe2](https://github.com/dpaul20/gastos-en-pareja/commit/5d3ffe27e3763b48e2db3097e9b98594206dea1d))
* **responsive:** expandir contenido a md+ y truncar texto largo en FijoItem ([9fd7bc3](https://github.com/dpaul20/gastos-en-pareja/commit/9fd7bc320b7c82e7d4743839101b3d3300cf5535))
* **ts:** add missing fields to test fixtures to pass tsc check ([f06a0b4](https://github.com/dpaul20/gastos-en-pareja/commit/f06a0b405d7053ac89ce912316a7209194c8a053))


### ⚡ Performance

* **e2e:** fixtures adminClient y coupleId worker-scoped, agregar testUserId fixture ([fa71288](https://github.com/dpaul20/gastos-en-pareja/commit/fa712886e2202815d8d6598a8b217fd8cd299db0))

## [1.11.0](https://github.com/dpaul20/gastos-en-pareja/compare/gastos-en-pareja-v1.10.0...gastos-en-pareja-v1.11.0) (2026-06-07)


### ✨ Features

* **a11y:** progressbar role, icon-button labels, semantic lists, emoji aria-hidden, error regions (PR3) ([76c3d00](https://github.com/dpaul20/gastos-en-pareja/commit/76c3d0030fdb6c15a628688cec11daa443f599f6))
* **layout:** responsive expenses page, remove maxWidth:390, inline px to Tailwind (PR2a) ([75983d8](https://github.com/dpaul20/gastos-en-pareja/commit/75983d84d8f2e593fe05c00f6d904e9cafca6b63))
* **layout:** responsive settings page, remove hardcoded px (PR2b) ([a1efc19](https://github.com/dpaul20/gastos-en-pareja/commit/a1efc199b27295b0fc3a77d1af113ecb298fa2e4))
* **ui:** install shadcn Switch, replace custom toggles and bare inputs/buttons (PR1) ([2d1cc40](https://github.com/dpaul20/gastos-en-pareja/commit/2d1cc4006c56596e65f532fe878dc6e359c425e4))
* **ui:** responsive redesign, shadcn primitives, WCAG 2.1 AA hardening ([f4a8396](https://github.com/dpaul20/gastos-en-pareja/commit/f4a839620f98e15b95ab7fd46ebf7d12485d465c))


### 🐛 Bug Fixes

* **a11y:** resolve verify warnings — Switch for EditServiceSheet, remaining px to Tailwind ([289d265](https://github.com/dpaul20/gastos-en-pareja/commit/289d2655997fb6b2b18554d372c025e1161fbd6c))
* **e2e:** SCEN-08 strict mode — getByLabel Monto matched Button aria-label ([f3b3f44](https://github.com/dpaul20/gastos-en-pareja/commit/f3b3f44079cb45089ae5798d61fef0e27af53590))

## [1.10.0](https://github.com/dpaul20/gastos-en-pareja/compare/gastos-en-pareja-v1.9.0...gastos-en-pareja-v1.10.0) (2026-06-07)


### ✨ Features

* **expenses:** payer attribution for cuotas and fixed expenses ([2ca9733](https://github.com/dpaul20/gastos-en-pareja/commit/2ca9733fb7f5bc237fba1a925870b6d5132e504c))


### 🐛 Bug Fixes

* **a11y:** suppress SheetContent aria-describedby warning ([b9028b5](https://github.com/dpaul20/gastos-en-pareja/commit/b9028b5e1f6db97d12682f1dd9af83bc0fc5782d))
* **e2e:** fix SCEN-01 timing and SCEN-06 wrong testid in payer-attribution tests ([76c5281](https://github.com/dpaul20/gastos-en-pareja/commit/76c528106d3c920511efad332156a15a7c877f16))

## [1.9.0](https://github.com/dpaul20/gastos-en-pareja/compare/gastos-en-pareja-v1.8.0...gastos-en-pareja-v1.9.0) (2026-06-07)


### ✨ Features

* **dashboard:** add UpcomingDuesWidget for service due dates ([e7c5029](https://github.com/dpaul20/gastos-en-pareja/commit/e7c5029dbfd3ce263bd9019167270d1c6137a078))
* **db:** add requires_monthly_review and status to fixed expense schema ([106fcad](https://github.com/dpaul20/gastos-en-pareja/commit/106fcadc95c504bf0919fd57136eee7efa1c40df))
* **expenses:** add TypeSelectorSheet, credit_card on cuotas, and income carry-over ([be4add3](https://github.com/dpaul20/gastos-en-pareja/commit/be4add328beab5c366259914a97244fc8a410a23))
* **expenses:** rename Fijos→Servicios and Variables→Compras ([81c5ef9](https://github.com/dpaul20/gastos-en-pareja/commit/81c5ef9282abd99833f0ab7779a7e3b387aeafc3))
* **layout:** add responsive desktop layout with shadcn Sidebar and 2-column dashboard ([1a4a78f](https://github.com/dpaul20/gastos-en-pareja/commit/1a4a78fd7673a4f309cf0ca7d1e96f306865fa7a))
* monthly review confirmation for recurring fixed expenses ([444b085](https://github.com/dpaul20/gastos-en-pareja/commit/444b085ccbcb927725c4ccb3863c4496171acd33))
* **nav:** replace bottom nav with shadcn Sidebar (mobile drawer + desktop fixed) ([210600e](https://github.com/dpaul20/gastos-en-pareja/commit/210600ed0c817fa3c579e27ca157f0293375e8bd))
* **ui:** add pending review badge, confirm flow and dashboard banner ([1e645a1](https://github.com/dpaul20/gastos-en-pareja/commit/1e645a14258d01aa0d7c984012bf65e38c281236))
* **ux:** UX redesign — Servicios/Cuotas/Compras, dashboard dues, and amount override ([45215ca](https://github.com/dpaul20/gastos-en-pareja/commit/45215ca81397ca2e09eb82a123286ba367593da4))


### 🐛 Bug Fixes

* **ci:** exclude all src/lib/actions from coverage — server actions use Supabase, covered by e2e ([911a080](https://github.com/dpaul20/gastos-en-pareja/commit/911a080ede5773abac3ff02210849a155d7ac6b7))
* **ci:** exclude src/lib/hooks from coverage — hooks need DOM/React context, covered by e2e ([c1dc1ab](https://github.com/dpaul20/gastos-en-pareja/commit/c1dc1abbcbca4800737487266e6dc4cc0a446ba8))
* **e2e:** fix strict mode violation in SCEN-05 and footer total locator ([234e89d](https://github.com/dpaul20/gastos-en-pareja/commit/234e89dc32ed20b3c3fac5f16603a5696a92a76c))
* **e2e:** isolate balance test from parallel fixed-expense template creation ([03b9b7d](https://github.com/dpaul20/gastos-en-pareja/commit/03b9b7d1a5ce2259744262d133e8bbb80f32594a))
* **e2e:** remove unused item variable in fixed-review spec ([95e61c9](https://github.com/dpaul20/gastos-en-pareja/commit/95e61c9166b5f38e7a16cd02286e5406737adbd1))
* **e2e:** restore auth after sign-out and fix race condition in income test ([605eac3](https://github.com/dpaul20/gastos-en-pareja/commit/605eac343f87c9b644bb8e4058bd50f6a68409f8))
* **e2e:** use data-testid on TypeSelectorSheet options to avoid text ambiguity ([3511e1e](https://github.com/dpaul20/gastos-en-pareja/commit/3511e1ebd1f303179a96bbf9b3e3e4a9f10d0375))
* **e2e:** use delta for footer total, testid for banner link, increase sidebar timeout ([67511e8](https://github.com/dpaul20/gastos-en-pareja/commit/67511e8aa7a8cffce1e0b31b9c59d8cfa4bafa49))
* **expenses:** hide FAB when sheet is open and fix safe-area padding on TypeSelectorSheet ([f2ca242](https://github.com/dpaul20/gastos-en-pareja/commit/f2ca242eda15cf1beaa084b8dca58cfd36816a22))
* **fijo:** add per-month amount_override with effectiveFixedAmount helper ([4559bcf](https://github.com/dpaul20/gastos-en-pareja/commit/4559bcfac189e0469833433aebe7f50db6b552a1))
* **forms:** enforce numeric validation and surface server action errors in UI ([b8d5d6b](https://github.com/dpaul20/gastos-en-pareja/commit/b8d5d6b96ca974beb5d9c2bc91f6f2d26076b089))
* **history:** add data-testid to month-card; add aria-label to back button ([add669d](https://github.com/dpaul20/gastos-en-pareja/commit/add669d95f8e81eb0454c1c0614e0ea1bd7f0bee))
* **test:** replace read-only process.env.NODE_ENV assignment with vi.stubEnv ([cdc1f7b](https://github.com/dpaul20/gastos-en-pareja/commit/cdc1f7b93db69f1653ca8b402975a336ba32bbc2))
* **ui:** replace hardcoded hex colors with semantic DS tokens ([d5a996d](https://github.com/dpaul20/gastos-en-pareja/commit/d5a996ddf59464e4695ed847b2adc2533deba09b))
* **ui:** restore DS visual quality — Tabs accent, Card padding, Badge a11y contrast ([91e8970](https://github.com/dpaul20/gastos-en-pareja/commit/91e8970f3cfe236cbffd876c9536115b98876cfa))

## [1.8.0](https://github.com/dpaul20/gastos-en-pareja/compare/gastos-en-pareja-v1.7.0...gastos-en-pareja-v1.8.0) (2026-05-06)


### ✨ Features

* **expenses:** extract expense components and rewrite add-sheet form ([f5916a3](https://github.com/dpaul20/gastos-en-pareja/commit/f5916a3042ff6015780f684ac0154f1b7f7d946d))
* extract sub-components, add shadcn UI primitives, and rewrite add-sheet form ([b488674](https://github.com/dpaul20/gastos-en-pareja/commit/b4886749c34e2b98fca7704467d21bff9a9f0b50))
* **ui:** extract sub-components, add shadcn UI, and set up DS tokens ([86c8816](https://github.com/dpaul20/gastos-en-pareja/commit/86c88160520a65a5d641606e4089ace4fe09bbd5))


### 🐛 Bug Fixes

* **e2e:** correct form field labels to match test selectors ([95e4c93](https://github.com/dpaul20/gastos-en-pareja/commit/95e4c9361d3daf7cb0010026869f02ffd4793db1))
* **e2e:** update add-sheet dialog selector to use data-testid ([8fe1016](https://github.com/dpaul20/gastos-en-pareja/commit/8fe1016be71868b497969396ddf9366f3413eaf7))

## [1.7.0](https://github.com/dpaul20/gastos-en-pareja/compare/gastos-en-pareja-v1.6.0...gastos-en-pareja-v1.7.0) (2026-05-04)


### ✨ Features

* **categorias:** complete category filter and recharts breakdown ([935651b](https://github.com/dpaul20/gastos-en-pareja/commit/935651b1b43bfba10098cbef605b0969be7b58d1))
* complete categorias-gastos and gastos-recurrentes SDD gaps ([f0287aa](https://github.com/dpaul20/gastos-en-pareja/commit/f0287aaace05f7efc911533ec5eb86b50bdfd5ae))

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
