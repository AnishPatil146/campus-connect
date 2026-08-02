# Campus Connect — Agent Memory (READ THIS FIRST, EVERY SESSION)

## CURRENT STATUS: NOT PRODUCTION READY

## ACTIVE BLOCKER (unresolved as of last session)
The Android APK installs successfully but CRASHES IMMEDIATELY ON OPEN before reaching the 
login screen. Root cause NOT yet confirmed with an actual crash log.

## SUSPECTED CAUSES — CHECK THESE FIRST, IN ORDER
1. apps/mobile/src/services/apiClient.ts and socketService.ts may be pointed at a raw 
   port (10000) or localhost instead of the real production HTTPS URL 
   (should be pulled from EXPO_PUBLIC_API_URL, set to https://api.campusconnect.com/api/v1 
   in eas.json's production profile). A production build hitting a local port would fail to 
   connect on any real device and could crash on init. NOT YET CONFIRMED OR RULED OUT.
2. Firebase (firebase@12.15.0) was added as a dependency around when crashes started. If it's 
   imported/initialized anywhere without a valid google-services.json properly wired into the 
   Android build, this crashes the app on launch. NOT YET CONFIRMED OR RULED OUT.
3. APK file size has been dropping across recent builds (~12MB → ~7.5MB), suggesting the JS 
   bundle (assets/index.android.bundle) or native libs may be missing/incomplete in the built 
   APK. NOT YET CONFIRMED — check with `unzip -l` before next build is shipped anywhere.

## WHAT WOULD RESOLVE THIS
An actual adb logcat or BrowserStack Device Logs "FATAL EXCEPTION" trace, captured at the 
moment of crash, has NEVER been successfully obtained yet despite multiple attempts. This 
environment has no local Android emulator/device attached 
(adb.exe exists at C:\Users\USER\AppData\Local\Android\Sdk\platform-tools\adb.exe but 
emulator.exe/avdmanager.exe/sdkmanager.exe are missing). BrowserStack App Live has been used 
successfully once to install the app, but the crash log from that session was never captured. 
GETTING THIS LOG IS THE #1 PRIORITY — do not attempt further speculative fixes without it.

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
Get the real crash log (BrowserStack Device Logs panel or local adb logcat) or build a complete APK with assets/index.android.bundle (~12MB) bundled before any further release.

---
## SESSION LOG — 2026-08-02

### 1. Rebuild & Dependency Sync
- Cleaned `apps/mobile/node_modules`, `apps/mobile/.expo`, `apps/mobile/android/app/build`, and workspace `node_modules`.
- Ran `pnpm install --frozen-lockfile` — PASSED with 0 lockfile changes.

### 2. Cause Analysis & Verification (Steps 3A & 3B)
- **API URL Configuration**: Confirmed `apiClient.ts` and `socketService.ts` read `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_SOCKET_URL`. In production (`__DEV__ === false`), fallback URLs point to HTTPS `https://api.campusconnect.com/api/v1` and `https://api.campusconnect.com/events`. `eas.json` production profile specifies both variables.
- **Firebase Dependency**: Confirmed zero references/imports to `firebase` or `initializeApp` anywhere under `apps/mobile/src`.

### 3. Bundle Inspection & APK Root Cause (Step 3C & 4)
- Ran `npx expo export --platform android` — created 4.72 MB Hermes bytecode bundle (`_expo/static/js/android/index-*.hbc`).
- Inspected previous `downloaded_test_app.apk` (7.65 MB) zip contents with `tar -tf`:
  - Native libraries (`lib/arm64-v8a`, `lib/armeabi-v7a`) are present.
  - **CONFIRMED DEFECT**: `assets/index.android.bundle` was MISSING from the 7.65 MB APK, explaining the immediate crash on launch before JS execution.
- Local Gradle `assembleRelease` failed due to disk space shortage on C: drive (0.18 GB free).

### 4. Next Step
- Free disk space on C: drive and package `assets/index.android.bundle` into `apps/mobile/android/app/src/main/assets/` during `gradlew assembleRelease` to produce a full ~12 MB APK, then capture device logs/screenshots on boot.

