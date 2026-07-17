# Security Audit - Campus Connect

This document outlines the security status, threat models, vulnerabilities, and remediation directives for the Authentication & Identity System in Campus Connect.

---

## 1. Key Vulnerabilities & Risks Identified (RESOLVED)

### 🚨 Critical Severity: Hardcoded Fallback JWT Secret — RESOLVED
* **Location:** [auth.service.ts](file:///c:/Users/USER/OneDrive/Desktop/campus-connect/apps/api/src/auth/auth.service.ts) and [jwt.strategy.ts](file:///c:/Users/USER/OneDrive/Desktop/campus-connect/apps/api/src/auth/strategies/jwt.strategy.ts)
* **Risk:** The code originally contained a hardcoded fallback string. If the `JWT_SECRET` environment variable was missing, the system would fallback to a known string, allowing arbitrary signature validation.
* **Resolution:** Removed the fallback string completely. Added strict checks at startup in both `AuthService` and `JwtStrategy` that throw a fatal error if `process.env.JWT_SECRET` is undefined, preventing application startup in an insecure state.

### ⚠️ Medium Severity: CORS Reflective Origin Fallback — RESOLVED
* **Location:** [main.ts](file:///c:/Users/USER/OneDrive/Desktop/campus-connect/apps/api/src/main.ts)
* **Risk:** Defaulted to `true` when `ALLOWED_ORIGINS` was not set, reflecting the request origin and allowing credential inclusion.
* **Resolution:** Implemented a strict whitelist check. If `ALLOWED_ORIGINS` is not defined in the environment, it falls back to a list of strict local and production Vercel domains (`localhost:3000`, `localhost:3001`, and production app domains). Reflective origin reflection is disabled.

### ⚠️ Medium Severity: Delayed Redis Session Revocation on Password/Status Change — RESOLVED
* **Location:** [auth.service.ts](file:///c:/Users/USER/OneDrive/Desktop/campus-connect/apps/api/src/auth/auth.service.ts) and [redis.service.ts](file:///c:/Users/USER/OneDrive/Desktop/campus-connect/apps/api/src/redis/redis.service.ts)
* **Risk:** Updating user passwords or logging out did not evict the user's active session keys from the Redis cache, letting stolen/compromised session tokens bypass database verification until expiration.
* **Resolution:** Created a wildcard session purger method `deleteUserSessions(userId)` using Redis client scanning. Integrated this purger inside the `resetPassword`, `changePassword`, and `logoutAll` flows of `AuthService` to immediately invalidate all cached session tokens.

---

## 2. Threat Modeling & Protections

### A. SQL Injection (SQLi)
* **Protection:** The backend uses **Prisma ORM** for database queries. Prisma utilizes parameterized queries out of the box, preventing SQL injection vectors in query strings, updates, and deletes.
* **Audit Result:** Safe. No raw SQL query calls (`$queryRaw`) are executed within the authentication module.

### B. Cross-Site Scripting (XSS)
* **Protection:**
  * **Helmet Middleware:** Registered in `main.ts` to enforce headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and strict `Content-Security-Policy`).
  * **Input Sanitation:** Global `ValidationPipe` with `{ whitelist: true }` strips unmapped parameters.
* **Audit Result:** Safe. However, input validation strings on profiles should undergo HTML escaping/stripping to prevent stored XSS.

### C. Brute Force & Credential Stuffing
* **Protection:**
  * **Rate Limiting:** A global request limit (100 requests/minute per IP) via NestJS Throttler.
  * **Login Rate Limiting:** Redis-backed `checkLoginRateLimit` limits logins to 5 attempts/minute per IP/email (3/minute for admins).
  * **Account Lockout:** User records maintain `failedLoginAttempts`. After 5 failures, the account locks for 15 minutes. After 10 failures, it locks for 1 hour. After 20 failures, it is marked `SUSPENDED`.
* **Audit Result:** Robust. Ensure lockout conditions are correctly tested on Day 6.

### D. Token Theft & Session Hijacking
* **Protection:** **Refresh Token Rotation (RTR)** is configured. When a user requests a new Access Token using their Refresh Token, the old token is deleted from the DB and a new pair is issued.
* **Breach Protection:** If a rotated refresh token is reused (indicating a duplicate token session or potential theft), the system detects the hash mismatch and automatically deletes **all** active sessions for that user.
* **Audit Result:** Excellent design. Recommend reducing Access Token lifespan if security needs to be further tightened.

### E. Multi-Tenant Cross-Contamination
* **Protection:** Multi-tenancy context is isolated per request using `AsyncLocalStorage` and evaluated inside the `PrismaService` connection layer and `JwtStrategy`.
* **Audit Result:** Robust. Tenant validation is successfully performed during token authentication and Google OAuth login endpoints.
