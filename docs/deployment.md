# Campus Connect Deployment & Operational Manual

This document outlines deployment architectures, security keystore management, database automated backups, rollbacks, and error tracking setups for Campus Connect.

---

## 1. Android Release Keystore & Security Protocols

### Keystore Location & Details
- **Local Keystore File**: `apps/mobile/android_build/app/campusconnect.jks`
- **Key Alias**: `campusconnect`
- **Algorithm**: 2048-bit RSA Key Pair
- **Application ID**: `com.campusconnect.app`
- **Version**: `v1.0.1` (`versionCode 2`)

> [!CAUTION]
> **CRITICAL SECURITY REQUIREMENT**:
> Losing `campusconnect.jks` or its password will make it impossible to publish updates to existing Android installations or Google Play Store.

### Offsite Backup Instructions
1. Upload `campusconnect.jks` to a secure team password vault (e.g., 1Password, Bitwarden Enterprise, or AWS Secrets Manager).
2. Store the key alias (`campusconnect`), keystore password, and key password in encrypted secrets store.
3. Do NOT commit unencrypted passwords to public git repositories.

---

## 2. Production Deployment & Rollback Strategy

### Web Application (`apps/web`) — Next.js 14
- **Hosting Platform**: Vercel / Docker Container
- **Production Build Command**:
  ```bash
  pnpm --filter @campus-connect/web build
  ```
- **Instant Rollback Procedure**:
  - **Vercel**: Open Vercel Dashboard $\rightarrow$ Deployments $\rightarrow$ Select previous green deployment $\rightarrow$ Click **Promote to Production**.
  - **Docker**: Re-tag and deploy previous image release `campus-connect-web:v1.0.0`.

### Mobile Application (`apps/mobile`) — Expo / React Native
- **Production Build Command**:
  ```bash
  cd apps/mobile
  eas build --platform android --profile production
  ```
- **Rollback Procedure**:
  - Android APKs cannot be downgraded directly over an existing installation without uninstalling.
  - To push a fix, increment `versionCode` in `app.json` and `build.gradle.kts` (e.g. `versionCode 3`, `v1.0.2`), assemble release, and re-distribute.

---

## 3. Database Automated Backup Schedule (PostgreSQL)

### Snapshot & Recovery Policy
- **Automated Daily Backups**: Scheduled daily at `02:00 UTC` via AWS RDS / Supabase / Neon automated snapshot runner.
- **Retention Period**: 30 days point-in-time recovery (PITR).
- **Manual Backup Command**:
  ```bash
  pg_dump -h <DB_HOST> -U <DB_USER> -d campus_connect_db -F c -b -v -f campus_connect_backup_$(date +%Y%m%m).dump
  ```
- **Restoration Test**:
  ```bash
  pg_restore -h <DB_HOST> -U <DB_USER> -d campus_connect_db_restore -v campus_connect_backup_target.dump
  ```

---

## 4. Production Error Monitoring (Sentry Setup)

### Web & Mobile Error Tracking
1. Install Sentry SDK:
   ```bash
   pnpm --filter @campus-connect/web add @sentry/nextjs
   pnpm --filter @campus-connect/mobile add @sentry/react-native
   ```
2. Set Environment Variables:
   - `NEXT_PUBLIC_SENTRY_DSN=https://<key>@sentry.io/<project>`
   - `EXPO_PUBLIC_SENTRY_DSN=https://<key>@sentry.io/<project>`
3. Instrument uncaught exceptions and API fetch error loggers in `apps/web/utils/api.ts` and `apps/mobile/src/services/api.ts`.
