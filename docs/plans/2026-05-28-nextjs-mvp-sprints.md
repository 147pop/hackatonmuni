# SEM Digital Next.js MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a complete responsive web MVP for SEM Digital based on `SRS_SEM_Digital.md`, covering the normal conductor, public portal, permisionario, and admin flows.

**Architecture:** Use a Next.js App Router application with TypeScript. Keep the MVP self-contained with an in-browser mock backend backed by `localStorage`, typed domain services, seeded demo data, and clear boundaries so a real backend and MercadoPago integration can replace the mocks later.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Vitest, React Testing Library, Playwright, lucide-react.

---

## Scope Rules

- Build a responsive web application, not native mobile apps.
- Use simulated QR, OCR, MercadoPago, notifications, and geolocation where browser or external integrations would slow the hackathon MVP.
- Keep role access demo-friendly: no real authentication, only a role switcher and seeded users.
- Persist demo state in `localStorage` so normal flows remain visible across refreshes.
- Prioritize normal happy paths first, then validation and edge cases.
- Do not implement real payment processing, real Web Push, MFA, or production security.

## Sprint 0: Project Foundation

**Objective:** Create the Next.js project structure and shared foundation needed by every later sprint.

**Primary Outcomes:**
- A Next.js App Router app runs locally.
- TypeScript, Tailwind, linting, test tooling, and Playwright are configured.
- Global responsive shell, typography, route structure, and demo navigation exist.
- Initial CI-quality commands are documented in `package.json`.

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `postcss.config.mjs`
- Create: `tailwind.config.ts`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`
- Create: `src/components/app-shell.tsx`
- Create: `src/components/role-switcher.tsx`
- Create: `src/lib/routes.ts`
- Create: `tests/smoke/home.spec.ts`

**Implementation Tasks:**
1. Scaffold Next.js with TypeScript and App Router.
2. Configure Tailwind and global CSS tokens for a municipal operations UI.
3. Add role cards for Conductor, Portal Publico, Permisionario, and Admin on the first screen.
4. Add shared app shell with responsive navigation and route labels.
5. Add baseline smoke test for first render and navigation links.

**Tests:**
- Unit/static:
  - `npm run lint`
  - Expected: no lint errors.
- Build:
  - `npm run build`
  - Expected: Next.js production build completes.
- E2E:
  - `npm run test:e2e -- tests/smoke/home.spec.ts`
  - Expected: home page renders all four role entries and they are clickable.

**Acceptance Criteria:**
- App opens on mobile and desktop widths without horizontal scrolling.
- The first screen is operational, not a marketing landing page.
- Navigation exposes all MVP areas even if later pages are placeholders.

## Sprint 1: Domain Model And Mock Backend

**Objective:** Implement the SEM domain state and business helpers before building flows.

**Primary Outcomes:**
- Seeded data exists for permisionarios, cuadras, tarifas, estacionamientos, pagos, deudas, emergencias, and audit events.
- Domain actions are pure or service-based and testable.
- `localStorage` persistence supports reset-to-demo-data.

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/domain/seed.ts`
- Create: `src/domain/rules.ts`
- Create: `src/domain/calculations.ts`
- Create: `src/domain/validators.ts`
- Create: `src/lib/storage.ts`
- Create: `src/lib/sem-store.ts`
- Create: `src/lib/mock-mercadopago.ts`
- Create: `src/components/reset-demo-data-button.tsx`
- Create: `src/domain/__tests__/rules.test.ts`
- Create: `src/domain/__tests__/calculations.test.ts`
- Create: `src/domain/__tests__/validators.test.ts`
- Create: `src/lib/__tests__/sem-store.test.ts`

**Implementation Tasks:**
1. Define typed entities matching the SRS: `Permisionario`, `Vehiculo`, `Estacionamiento`, `Pago`, `Deuda`, `Emergencia`, `Tarifa`, `Zona`, `AuditEvent`.
2. Implement tariff calculation: base hour, 20% digital discount, configurable vehicle/motorcycle rates, and 15-minute fractioning after the second hour.
3. Implement horario validation for daytime and nighttime SEM windows.
4. Implement domain validation for Argentine plate formats used in the SRS.
5. Implement store actions: create payment, create cash ticket, register non-payment debt, pay debt, report emergency, update tariff.
6. Add mock MercadoPago service returning deterministic pending/success states for demo.

**Tests:**
- `npm run test -- src/domain/__tests__/calculations.test.ts`
  - Expected: correct amount for vehicle, motorcycle, digital discount, and fractioning.
- `npm run test -- src/domain/__tests__/rules.test.ts`
  - Expected: allowed and blocked parking windows match the SRS.
- `npm run test -- src/domain/__tests__/validators.test.ts`
  - Expected: accepts `AA123BB`, `ABC123`, and rejects invalid plates.
- `npm run test -- src/lib/__tests__/sem-store.test.ts`
  - Expected: each store action mutates state and records audit events.

**Acceptance Criteria:**
- All later UI flows can call service actions instead of duplicating business logic.
- Resetting demo data restores a known dataset.
- Business rules are covered before UI implementation depends on them.

## Sprint 2: Conductor And Public Portal Flows

**Objective:** Build the normal conductor and no-account payment flows described in Appendix A.1, A.2, and A.4.

**Primary Outcomes:**
- Registered conductor can start a QR payment flow.
- Public user can pay without SEM account.
- Users can consult and pay debts by domain.
- Tickets and active parking time are visible after payment.

**Files:**
- Create: `src/app/conductor/page.tsx`
- Create: `src/app/conductor/pagar/page.tsx`
- Create: `src/app/conductor/ticket/[ticketId]/page.tsx`
- Create: `src/app/conductor/deudas/page.tsx`
- Create: `src/app/portal/page.tsx`
- Create: `src/app/portal/pagar/page.tsx`
- Create: `src/app/portal/deudas/page.tsx`
- Create: `src/components/plate-input.tsx`
- Create: `src/components/qr-demo-panel.tsx`
- Create: `src/components/payment-summary.tsx`
- Create: `src/components/ticket-card.tsx`
- Create: `src/components/debt-list.tsx`
- Create: `src/components/mercadopago-simulator.tsx`
- Create: `tests/e2e/conductor-payment.spec.ts`
- Create: `tests/e2e/public-portal.spec.ts`

**Implementation Tasks:**
1. Add QR demo selection for a seeded permisionario.
2. Show verified permisionario profile after QR selection.
3. Let user enter domain, vehicle type, and duration.
4. Calculate amount and discount through domain service.
5. Simulate MercadoPago confirmation and generate ticket.
6. Show active ticket with time remaining, amount, location, and payment ID.
7. Implement debt lookup and debt payment by domain for conductor and public portal.

**Tests:**
- `npm run test:e2e -- tests/e2e/conductor-payment.spec.ts`
  - Expected: conductor selects QR, enters plate, confirms payment, lands on ticket page.
- `npm run test:e2e -- tests/e2e/public-portal.spec.ts`
  - Expected: no-account user pays from portal and can consult ticket/debt by domain.
- `npm run test`
  - Expected: domain regression tests from Sprint 1 still pass.

**Acceptance Criteria:**
- A judge can complete a payment from a mobile viewport in three major steps: QR, time, payment.
- Payment output updates admin totals and permisionario activity through shared state.
- Public portal does not require account creation.

## Sprint 3: Permisionario Operations

**Objective:** Build the permisionario interface for daily operation: QR, cash registration, non-payment debt, activity, and incident reporting.

**Primary Outcomes:**
- Permisionario sees assigned cuadra, QR, daily summary, and activity list.
- Permisionario registers cash payments and creates digital ticket numbers.
- Permisionario registers incumplimiento when a vehicle refuses payment.
- Panic and dispute buttons create alerts visible to admin.

**Files:**
- Create: `src/app/permisionario/page.tsx`
- Create: `src/app/permisionario/registrar/page.tsx`
- Create: `src/app/permisionario/incumplimiento/page.tsx`
- Create: `src/app/permisionario/actividad/page.tsx`
- Create: `src/components/permisionario-card.tsx`
- Create: `src/components/fixed-qr-card.tsx`
- Create: `src/components/cash-payment-form.tsx`
- Create: `src/components/non-payment-form.tsx`
- Create: `src/components/emergency-actions.tsx`
- Create: `src/components/daily-summary.tsx`
- Create: `tests/e2e/permisionario.spec.ts`

**Implementation Tasks:**
1. Build dashboard optimized for older users: large text, large hit targets, clear hierarchy.
2. Show fixed QR in digital and print-friendly form.
3. Implement cash payment form using shared tariff and ticket logic.
4. Implement non-payment form that generates domain debt.
5. Implement emergency and dispute actions with silent/visible behavior labels.
6. Add daily summary: vehicles, digital vs cash totals, debts generated.

**Tests:**
- `npm run test:e2e -- tests/e2e/permisionario.spec.ts`
  - Expected: permisionario registers cash payment and sees it in activity.
- `npm run test:e2e -- tests/e2e/permisionario.spec.ts`
  - Expected: permisionario registers incumplimiento and portal debt lookup finds it.
- `npm run test:e2e -- tests/e2e/permisionario.spec.ts`
  - Expected: panic/dispute creates admin-visible alert.

**Acceptance Criteria:**
- Main permisionario actions are reachable from the first permisionario screen.
- Cash payment and debt generation use the same domain validations as conductor flows.
- Emergency actions are persistent in demo state and visible in admin.

## Sprint 4: Municipal Admin Panel

**Objective:** Build the operational dashboard for management, reporting, audit, and basic configuration.

**Primary Outcomes:**
- Admin sees live dashboard metrics.
- Admin can inspect payments, active parking, debts, permisionarios, and alerts.
- Admin can edit demo tariffs and see calculations update.
- Audit log records meaningful state-changing actions.

**Files:**
- Create: `src/app/admin/page.tsx`
- Create: `src/app/admin/pagos/page.tsx`
- Create: `src/app/admin/deudas/page.tsx`
- Create: `src/app/admin/permisionarios/page.tsx`
- Create: `src/app/admin/alertas/page.tsx`
- Create: `src/app/admin/configuracion/page.tsx`
- Create: `src/components/admin/metric-grid.tsx`
- Create: `src/components/admin/payments-table.tsx`
- Create: `src/components/admin/debts-table.tsx`
- Create: `src/components/admin/alerts-panel.tsx`
- Create: `src/components/admin/tariff-form.tsx`
- Create: `src/components/admin/audit-log.tsx`
- Create: `tests/e2e/admin.spec.ts`

**Implementation Tasks:**
1. Calculate dashboard metrics from shared store: revenue, active parking, occupancy, debt count, alerts.
2. Build tables with search/filter for payments and debts.
3. Build permisionario list with assigned cuadra and daily totals.
4. Build alert panel for emergency/dispute events.
5. Build tariff configuration form and audit event on update.
6. Add empty states and reset demo data control.

**Tests:**
- `npm run test:e2e -- tests/e2e/admin.spec.ts`
  - Expected: admin sees payment created in Sprint 2 flow.
- `npm run test:e2e -- tests/e2e/admin.spec.ts`
  - Expected: admin sees debt created in Sprint 3 flow.
- `npm run test:e2e -- tests/e2e/admin.spec.ts`
  - Expected: tariff edit changes the next payment quote.
- `npm run test -- src/lib/__tests__/sem-store.test.ts`
  - Expected: audit events exist for payments, debts, emergencies, and tariff changes.

**Acceptance Criteria:**
- Admin panel gives a credible real-time demo of the SEM operation.
- Every visible metric is derived from the same seeded/mutated store, not hardcoded per page.
- Configuration changes affect subsequent flows.

## Sprint 5: Responsive UX, Accessibility, And Demo Hardening

**Objective:** Polish the MVP for hackathon presentation and verify normal flows end to end.

**Primary Outcomes:**
- Mobile and desktop layouts are stable.
- Text fits inside buttons, cards, tables, and form controls.
- Core flows have explicit loading, success, validation, and empty states.
- Demo script is documented for presenters.

**Files:**
- Create: `docs/demo-script.md`
- Create: `tests/e2e/full-demo.spec.ts`
- Modify: `src/app/globals.css`
- Modify: all route pages created in earlier sprints as needed.
- Modify: all shared components created in earlier sprints as needed.

**Implementation Tasks:**
1. Run responsive checks at 390px, 768px, 1280px, and 1440px widths.
2. Add accessible labels, focus states, and keyboard navigation for key forms.
3. Add validation messages for invalid domain, invalid duration, blocked schedule, and failed simulated payment.
4. Add clear demo reset and seeded scenario notes.
5. Write `docs/demo-script.md` with a 5-minute judge walkthrough.
6. Run full test suite and production build.

**Tests:**
- `npm run test`
  - Expected: all unit/domain tests pass.
- `npm run test:e2e`
  - Expected: all Playwright flows pass.
- `npm run build`
  - Expected: production build completes.
- `npm run lint`
  - Expected: no lint errors.
- Manual viewport review:
  - Expected: no overlapping text, no horizontal scrolling, primary actions visible above the fold on mobile.

**Acceptance Criteria:**
- A judge can run the demo from a clean checkout with `npm install` and `npm run dev`.
- The demo script exercises all normal SRS flows without needing hidden setup.
- MVP clearly communicates that integrations are simulated and replaceable.

## Final Definition Of Done

- `npm run lint` passes.
- `npm run test` passes.
- `npm run test:e2e` passes.
- `npm run build` passes.
- The app is usable on mobile and desktop viewports.
- `docs/demo-script.md` explains the normal demonstration path.
- No native mobile app dependencies or iOS/Android-specific requirements are introduced.
- The MVP remains scoped to hackathon needs and does not overbuild production concerns.

## Recommended Commit Cadence

1. `chore: scaffold nextjs mvp`
2. `feat: add sem domain store`
3. `feat: add conductor and portal flows`
4. `feat: add permisionario operations`
5. `feat: add municipal admin panel`
6. `test: add end to end demo coverage`
7. `docs: add demo script`
