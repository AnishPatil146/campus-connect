# API Directory - Campus Connect

This document catalogs the REST API routes available in the Campus Connect ERP backend. All application routes (unless specified in the exclusions below) are prefixed with `/api/v1`.

---

## 1. Global Configuration

* **Base URL:** `http://<server-domain>/api/v1`
* **Exclusions (No global prefix):**
  * `GET /health` (System/App health)
  * `GET /health/database` (Prisma/DB connection status)
  * `GET /health/redis` (Redis/Cache connection status)
  * `GET /api/docs` (Swagger documentation interface)

---

## 2. Authentication Module

These routes handle credentials, Google Sign-In, OTP generation, password reset actions, session tokens, and active device sessions.

| Endpoint | HTTP Method | Guard / Role | Description |
| :--- | :--- | :--- | :--- |
| `/auth/health` | `GET` | Public | Verify auth subsystem status |
| `/auth/register` | `POST` | Public | Student self-registration (creates profile & default division mappings) |
| `/auth/login` | `POST` | Public / Rate-limited | Login with email and password; handles multi-role redirect temp-tokens |
| `/auth/google` | `POST` | Public / Rate-limited | Google OAuth login; auto-creates Student profile if user email doesn't exist |
| `/auth/select-role` | `POST` | Public (Requires `tempToken`) | Complete workspace/role selection for multi-role accounts |
| `/auth/refresh` | `POST` | Public | Rotates active session refresh token and outputs new token pair |
| `/auth/logout` | `POST` | `JwtAuthGuard` | Revokes the current session record and clears Redis cache entry |
| `/auth/logout-all` | `POST` | `JwtAuthGuard` | Revokes all database refresh tokens and active sessions for the user |
| `/auth/forgot-password` | `POST` | Public | Triggers 6-digit OTP code creation and displays mocked email delivery |
| `/auth/verify-otp` | `POST` | Public | Verifies OTP code and returns a 15-minute temporary reset token |
| `/auth/reset-password` | `POST` | Public | Submits new password using the verified reset token |
| `/auth/change-password` | `POST` | `JwtAuthGuard` | User password updates from user profile settings |
| `/auth/me` | `GET` | `JwtAuthGuard` | Returns user details, active role, and associated profile completion status |
| `/auth/sessions` | `GET` | `JwtAuthGuard` | List all active logged-in device sessions for the user |
| `/auth/sessions/:id` | `DELETE` | `JwtAuthGuard` | Revokes a specific device session by session ID |

---

## 3. Users Management

Handles system user accounts, roles, and fine-grained permissions.

| Endpoint | HTTP Method | Guard / Role | Description |
| :--- | :--- | :--- | :--- |
| `/users` | `POST` | `JwtAuthGuard`, `RolesGuard` (ADMIN), `PermissionsGuard` (`users.create`) | Register a new user |
| `/users` | `GET` | `JwtAuthGuard`, `RolesGuard` (ADMIN), `PermissionsGuard` (`users.read`) | Retrieve list of users (supports query filtering) |
| `/users/:id` | `GET` | `JwtAuthGuard`, `RolesGuard` (ADMIN), `PermissionsGuard` (`users.read`) | Find user by identifier |
| `/users/:id` | `PATCH` | `JwtAuthGuard`, `RolesGuard` (ADMIN), `PermissionsGuard` (`users.update`) | Update user data / lock status |
| `/users/:id` | `DELETE` | `JwtAuthGuard`, `RolesGuard` (ADMIN), `PermissionsGuard` (`users.delete`) | Delete user from system |

---

## 4. Student Management

Manages student enrollment files, academic division allocations, and profile items.

| Endpoint | HTTP Method | Guard / Role | Description |
| :--- | :--- | :--- | :--- |
| `/students` | `GET` | `JwtAuthGuard`, `RolesGuard` (ADMIN, TEACHER) | Query students directory (restricted to current college context) |
| `/students` | `POST` | `JwtAuthGuard`, `RolesGuard` (ADMIN) | Create a new student profile and allocate division parameters |
| `/students/:id` | `GET` | `JwtAuthGuard` | Get specific student profile details |
| `/students/:id` | `PUT` | `JwtAuthGuard`, `RolesGuard` (ADMIN) | Update student academic or profile records |
| `/students/:id` | `DELETE` | `JwtAuthGuard`, `RolesGuard` (ADMIN) | Remove student profile |

---

## 5. Teacher Management

Handles designations, qualifications, and department associations for lecturers.

| Endpoint | HTTP Method | Guard / Role | Description |
| :--- | :--- | :--- | :--- |
| `/teachers` | `POST` | `JwtAuthGuard`, `RolesGuard` (ADMIN), `PermissionsGuard` (`teachers.create`) | Admit/Create teacher profile |
| `/teachers` | `GET` | `JwtAuthGuard`, `RolesGuard` (ADMIN, TEACHER), `PermissionsGuard` (`teachers.read`) | Paginated retrieve of lecturers |
| `/teachers/:id` | `GET` | `JwtAuthGuard`, `RolesGuard` (ADMIN, TEACHER), `PermissionsGuard` (`teachers.read`) | Retrieve individual lecturer profile |
| `/teachers/:id` | `PATCH` | `JwtAuthGuard`, `RolesGuard` (ADMIN), `PermissionsGuard` (`teachers.update`) | Edit designation or qualifications |
| `/teachers/:id` | `DELETE` | `JwtAuthGuard`, `RolesGuard` (ADMIN), `PermissionsGuard` (`teachers.delete`) | Terminate/Archive teacher profile |
| `/teachers/:id/subjects` | `POST` | `JwtAuthGuard`, `RolesGuard` (ADMIN), `PermissionsGuard` (`teachers.update`) | Associate subject options to lecturer |

---

## 6. Core ERP Modules

These routes cover academic structures, schedules, and everyday student-teacher interactions.

### A. Colleges, Departments, and Courses
* `GET /colleges` / `POST /colleges` - College listing and settings (administered by Super Admin).
* `GET /departments` / `POST /departments` - Department listings nested under the college tenant.
* `GET /courses` / `POST /courses` - Academic course definitions nested under departments.
* `GET /academic-sessions` - Active education terms (e.g. 2026-27).

### B. Timetable Slots
* `GET /timetable` - Fetch published schedules for student divisions or teacher modules.
* `POST /timetable/publish` - Set active schedules (accessible to ADMIN).

### C. Attendance Tracking
* `GET /attendance` / `POST /attendance` - List and register daily student lecture attendance records (accessible to TEACHER).
* `GET /attendance/summary` - View attendance stats (accessible to STUDENT, TEACHER, ADMIN).

### D. Assignments & Notes
* `GET /assignments` / `POST /assignments` - Retrieve assignments and upload questions.
* `GET /notes` / `POST /notes` - View and upload learning materials/syllabus files.
