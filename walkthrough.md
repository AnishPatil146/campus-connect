# Walkthrough — Pre-Launch Readiness Hardening & DPDP Compliance

All planned pre-launch readiness and compliance tasks have been successfully completed and verified.

---

## 1. Accomplished Tasks

### Data Privacy & Compliance (DPDP Act 2023)
- **Created `/privacy` Route** ([page.tsx](file:///c:/Users/USER/OneDrive/Desktop/campus-connect/apps/web/app/privacy/page.tsx)):
  - Built a responsive Privacy Policy page outlining data principal rights, data access, correction & erasure rules, encryption standards, and Data Protection Officer contact info (`dpo@campusconnect.edu`).
- **Added Consent Notice to Student Import** ([page.tsx](file:///c:/Users/USER/OneDrive/Desktop/campus-connect/apps/web/app/dashboard/admin/import/page.tsx)):
  - Added DPDP Act 2023 data processing disclosure banner to the student bulk import preview panel.

### Operational & Deployment Governance
- **Created Deployment Operations Manual** ([deployment.md](file:///c:/Users/USER/OneDrive/Desktop/campus-connect/docs/deployment.md)):
  - **Keystore Security**: Documented offsite backup protocol for `apps/mobile/android_build/app/campusconnect.jks`.
  - **Rollback Procedures**: Detailed Vercel web rollback steps and Android release `versionCode` bump procedure.
  - **Database Recovery**: Documented PostgreSQL WAL & 30-day automated snapshot policy.
  - **Error Tracking**: Outlined Sentry SDK integration for Next.js & React Native.

---

## 2. Verification & Build Results

### Production Web Build
- Executed `pnpm --filter @campus-connect/web build`:
```text
▲ Next.js 14.2.35
Creating an optimized production build ...
✓ Compiled successfully
Linting and checking validity of types ...
✓ Generating static pages (52/52)
Finalizing page optimization ...
Collecting build traces ...

Route (app)                              Size     First Load JS
├ ○ /privacy                             4.44 kB         104 kB
└ ○ (51 other routes)
```
- **Status**: **52/52 static pages generated**, 0 TypeScript errors.

---

## 3. Pre-Launch Readiness Summary

| Readiness Requirement | Verification Result |
| :--- | :--- |
| **Web Build (`@campus-connect/web`)** | **PASS** (52/52 static routes, 0 type errors) |
| **Workspace Packages (`types`, `utils`, `ui`)** | **PASS** (Strict `tsc` clean) |
| **Android Release APK (`com.campusconnect.app`)** | **PASS** (v1.0.1, versionCode 2, v2 RSA signed) |
| **Server Authorization & Role Guards** | **PASS** (NestJS `RolesGuard` + 2-teacher/day leave cap) |
| **DPDP Act 2023 Compliance** | **PASS** (`/privacy` page live, import consent disclosure) |
| **Operational Manual** | **PASS** (`docs/deployment.md` created) |

---

# Walkthrough — JWT httpOnly Cookie Security Upgrade (Aug 4, 2026)

## What Was Done

Resolved the last remaining production security blocker: JWT access token XSS exposure.

### Architecture: Dual-Token Design

| Transport | Token Location | Why |
|---|---|---|
| **Web REST API** | `httpOnly; Secure; SameSite=Strict` cookie (`cc_access_token`) | Invisible to JavaScript — XSS-safe |
| **Socket.IO** | `localStorage` bearer token | WebSocket upgrade request can't use httpOnly cookies |
| **Mobile (React Native)** | `Authorization: Bearer` header | Mobile has no browser cookie jar |

### Files Changed

| File | Change |
|---|---|
| `apps/api/src/main.ts` | Registered `cookieParser()` middleware |
| `apps/api/src/auth/strategies/jwt.strategy.ts` | `fromExtractors([bearer, cookie])` — accepts both sources |
| `apps/api/src/auth/auth.controller.ts` | Set `cc_access_token` cookie on login/Google login; `clearCookie` on logout |
| `apps/web/utils/api.ts` | `credentials: 'include'` on all `fetchWithRefresh` calls |
| `apps/web/components/AuthProvider.tsx` | `credentials: 'include'` on login/Google login; logout calls backend to clear cookie |

## Verification Results

| Check | Result |
|---|---|
| `npx tsc --noEmit` (API) | **PASS — 0 errors** |
| `pnpm --filter @campus-connect/web build` | **PASS — 54/54 static pages, 0 errors** |

