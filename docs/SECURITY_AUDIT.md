# Security Audit - Campus Connect

This document outlines the security status, threat models, vulnerabilities, and remediation directives for the Authentication & Identity System in Campus Connect.

---

## 1. Key Vulnerabilities & Risks Identified

### 🚨 Critical Severity: Hardcoded Fallback JWT Secret
* **Location:** [auth.service.ts](file:///c:/Users/USER/OneDrive/Desktop/campus-connect/apps/api/src/auth/auth.service.ts#L20) and [jwt.strategy.ts](file:///c:/Users/USER/OneDrive/Desktop/campus-connect/apps/api/src/auth/strategies/jwt.strategy.ts#L13)
* **Risk:** The code contains a hardcoded fallback string: `'super-secret-jwt-key-for-campus-connect'`. If the `JWT_SECRET` environment variable is not defined, NestJS will fall back to this known string, allowing attackers to sign arbitrary JWT tokens and compromise any user account.
* **Remediation:** Remove the fallback string. Throw a startup error if `process.env.JWT_SECRET` is not set.

### ⚠️ Medium Severity: CORS Reflective Origin Fallback
* **Location:** [main.ts](file:///c:/Users/USER/OneDrive/Desktop/campus-connect/apps/api/src/main.ts#L27)
* **Risk:** If `process.env.ALLOWED_ORIGINS` is not defined, the CORS configuration defaults to `true`, which reflects the request's origin. With `credentials: true` enabled, this is highly vulnerable to CSRF and cross-origin data extraction.
* **Remediation:** In production mode, force an error if `ALLOWED_ORIGINS` is not defined, or set it to a strict list. Disable reflective CORS in production.

### ⚠️ Medium Severity: Delayed Redis Session Revocation on Password/Status Change
* **Location:** [auth.service.ts](file:///c:/Users/USER/OneDrive/Desktop/campus-connect/apps/api/src/auth/auth.service.ts#L842)
* **Risk:** When a user changes their password via `changePassword` or is suspended by an Admin, their active session cache in Redis is not immediately purged. The user can still call APIs using their existing Access Token until its 30-minute expiration occurs.
* **Remediation:** In validation guards/strategies or within services, trigger a cache deletion for the user's active session keys when passwords update or accounts are deactivated.

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
