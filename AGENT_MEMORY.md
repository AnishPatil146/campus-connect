# Campus Connect — Agent Memory (READ THIS FIRST, EVERY SESSION)

## CURRENT STATUS: PRODUCTION READY (Pending Device Test)

## ACTIVE BLOCKER (unresolved as of last session)
None — all known blockers have been resolved. The only remaining verification item is:
- **On-device APK test**: Install `apps/web/public/downloads/CampusConnect.apk` (59.5 MB, Aug 2 build) on a real Android device or BrowserStack App Live and confirm the login screen loads. This is a hardware/environment constraint, not a code issue.

## KNOWN-GOOD / CONFIRMED WORKING
- Web app (apps/web) builds cleanly with 0 TypeScript errors, type-checking and linting 
  enabled (previously this was disabled, masking real bugs — do not disable it again).
- lucide-react / React 19 type conflict was fixed once already but REGRESSED once due to 
  `pnpm install --no-frozen-lockfile` allowing dependency versions to silently re-resolve. 
  Lockfile should now be frozen (--frozen-lockfile) — confirm this is still true before 
  assuming this bug won't come back.
- Server-side 2-teacher-per-day leave cap is implemented in 
  apps/api/src/teachers/teachers.service.ts (atomic Prisma transaction check).
- APK signing (apksigner v2 scheme) verified working — this is NOT the cause of the crash.

## SCOPE NOTE — VERIFY BEFORE TRUSTING
A recent report claimed completed Razorpay payment integration, library book reservation, and 
a chat system with online-status indicators. THESE WERE NEVER PART OF THE AGREED PROJECT 
SCOPE. Before building on top of this code, confirm with the project owner whether this is 
real, intended work or an unplanned addition — do not assume it's correct just because a 
report claimed it.

## RULES THAT MUST NOT BE VIOLATED AGAIN
- Never re-enable `typescript.ignoreBuildErrors` or `eslint.ignoreDuringBuilds`.
- Never use `pnpm install --no-frozen-lockfile` in a production build path.
- Never report a build/feature as PASS based on code inspection alone — behavioral evidence 
  (screenshot, log, terminal output) is required every time.
- Never resend a cached/previous report as if it's a fresh result — always re-run and 
  timestamp fresh.

## NEXT STEP
Install `apps/web/public/downloads/CampusConnect.apk` (59.5 MB, verified Aug 2 build with
assets/index.android.bundle present) on BrowserStack App Live or a physical Android device
to confirm the login screen loads correctly.

---
## SESSION LOG — 2026-08-02

### 1. Rebuild & Dependency Sync
- Cleaned `apps/mobile/node_modules`, `apps/mobile/.expo`, `apps/mobile/android/app/build`, and workspace `node_modules`.
- Ran `pnpm install --frozen-lockfile` — PASSED with 0 lockfile changes.

### 2. Cause Analysis & Verification (Steps 3A & 3B)
- **API URL Configuration**: Confirmed `apiClient.ts` and `socketService.ts` read `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_SOCKET_URL`. In production (`__DEV__ === false`), fallback URLs point to HTTPS API base URL. `eas.json` production profile specifies both variables.
- **Firebase Dependency**: Confirmed zero references/imports to `firebase` or `initializeApp` anywhere under `apps/mobile/src`.

### 3. Bundle Inspection & APK Root Cause (Step 3C & 4)
- Ran `npx expo export --platform android` — created 4.72 MB Hermes bytecode bundle (`_expo/static/js/android/index-*.hbc`).
- Inspected previous `downloaded_test_app.apk` (7.65 MB) zip contents with `tar -tf`:
  - Native libraries (`lib/arm64-v8a`, `lib/armeabi-v7a`) are present.
  - **CONFIRMED DEFECT**: `assets/index.android.bundle` was MISSING from the 7.65 MB APK, explaining the immediate crash on launch before JS execution.
- Local Gradle `assembleRelease` failed due to disk space shortage on C: drive (0.18 GB free).

### 5. Disk Space Recovery
- Cleared dev caches (`npm-cache`, `pnpm-cache`, `pip cache`, `$env:TEMP`, `.gradle` daemon/worker caches).
- Recovered disk space on drive C: from **0.00 GB free** to **14.23 GB free**.

### 6. Production APK Build & Inspection (BUILD SUCCESSFUL)
- **Disk Space**: 14.23 GB free space available on C: drive.
- **Node Linker**: Configured `node-linker=hoisted` in `.npmrc` to bypass Windows long `.pnpm` virtual path CMake C++ prefab compilation error.
- **Gradle Build**: Ran `gradlew.bat assembleRelease` with NDK 27.1.12297006 and JDK 17 — **BUILD SUCCESSFUL in 3m 36s** (371 actionable tasks executed).
- **Bundle & Binary Verification**:
  - `assets/index.android.bundle` **IS PRESENT** (4.72 MB Hermes bytecode bundle).
  - Native `.so` libraries for `arm64-v8a`, `armeabi-v7a`, `x86`, and `x86_64` are present.
  - Final APK binary size: **59.5 MB** (`apps/mobile/android/app/build/outputs/apk/release/app-release.apk`).
- **Signature Verification**: `apksigner verify --verbose` — **VERIFIED using APK Signature Scheme v2** (1 signer).
- **Deployment Artifacts**: Copied verified release APK to `apps/web/public/downloads/CampusConnect.apk`.

### 7. Website APK Download Integration
- Updated [download page](file:///c:/Users/USER/OneDrive/Desktop/campus-connect/apps/web/app/download/page.tsx) with the direct download link `/downloads/CampusConnect.apk`.
- Updated release metadata to reflect file size `~59.5 MB` and build date `2 August 2026`.
- Verified production web build with `pnpm --filter @campus-connect/web build` — **52/52 static pages generated**, 0 TypeScript errors.

### 8. Monorepo & API Workspace Verification
- Merged Prisma models from `apps/api/prisma/models/*.prisma` into `schema_merged.prisma` and generated `@prisma/client` (v5.22.0).
- Verified `apps/api` TypeScript compilation (`npx tsc --noEmit --project apps/api/tsconfig.json`) — **PASSED with 0 errors**.
- Re-verified web build (`pnpm --filter @campus-connect/web build`) — **52/52 static pages generated**, 0 TypeScript errors.

### 9. Next Step
- Install the newly compiled 59.5 MB APK onto a device or emulator (or BrowserStack App Live) to capture boot evidence (screenshot of login screen or adb logcat if any runtime issue occurs).
---
## SESSION LOG — 2026-08-04

### JWT httpOnly Cookie Security Upgrade (COMPLETED)
- **Problem**: JWT access token was stored only in `localStorage`, exposing it to XSS attacks.
- **Solution**: Dual-token architecture implemented:
  - **Backend `main.ts`**: Registered `cookie-parser` middleware.
  - **Backend `jwt.strategy.ts`**: Changed `jwtFromRequest` from `fromAuthHeaderAsBearerToken()` to `fromExtractors([bearer, cookie])` — accepts JWT from either `Authorization: Bearer` header (mobile/Socket.IO) OR `cc_access_token` httpOnly cookie (web REST).
  - **Backend `auth.controller.ts`**: `POST /auth/login` and `POST /auth/google` now set `cc_access_token` as `httpOnly; Secure; SameSite=Strict; maxAge=15min` cookie. `POST /auth/logout` clears it via `res.clearCookie()`.
  - **Frontend `api.ts`**: Added `credentials: 'include'` to all `fetchWithRefresh` calls so the cookie flows automatically on cross-origin requests.
  - **Frontend `AuthProvider.tsx`**: Login/Google-login fetch calls now include `credentials: 'include'`. Logout now calls `POST /auth/logout` (with Bearer token) to also clear the server-side cookie before clearing localStorage.
- **Socket.IO**: Continues using `localStorage` bearer token (industry standard — WebSocket upgrade request cannot carry `httpOnly` cookies the same way).
- **Verification**: `npx tsc --noEmit` on API: **0 errors**. `pnpm --filter @campus-connect/web build`: **54/54 static pages, 0 errors**.
---
## SESSION LOG — 2026-08-30

### MongoDB Auxiliary Database Integration (COMPLETED & VERIFIED)
- **Objective**: Integrated MongoDB Atlas as an auxiliary document store alongside primary PostgreSQL + Prisma database.
- **Dependencies**: Added `@nestjs/mongoose` and `mongoose` to `apps/api`.
- **Configuration**: Added `MONGODB_URI`, `MONGODB_DB_NAME`, and `MONGODB_ENABLED` in `.env` and `src/config/env.validation.ts`.
- **Modules & Services**:
  - `apps/api/src/mongodb/mongodb.module.ts`: Global module with resilient configuration and timeout management.
  - `apps/api/src/mongodb/mongodb.service.ts`: Ping, connection diagnostics, audit logging, and telemetry recording.
  - `apps/api/src/mongodb/schemas/audit-log.schema.ts`: Mongoose schema for high-throughput activity logs.
  - `apps/api/src/mongodb/schemas/system-telemetry.schema.ts`: Schema with 30-day TTL index for node diagnostic telemetry.
- **Integrations**:
  - `AuditService`: Asynchronously archives audit entries to MongoDB.
  - `HealthController`: Added `GET /health/mongodb` and included `mongodb` status in general health response.
  - `apps/api/prisma/test-mongodb.ts` & `test-connections.ts`: Unified diagnostic scripts.
- **Live Verification**:
  - Connected to live MongoDB Atlas cluster (`campus_connect_aux`) with latency of **210ms** and ping `{ ok: 1 }`.
  - Both `apps/api` and `apps/web` compile with **0 errors** (55/55 static pages generated).

