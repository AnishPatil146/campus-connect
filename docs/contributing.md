# Campus Connect Quality Assurance & Testing Standards

**Version**: 1.0  
**Repository Contributing & Testing Guidelines**

---

## 1. Quality Assurance (QA) Architecture

### 1.1 Objective
Maintain software reliability, security, and performance standards across the Campus Connect monorepo (Backend, Frontend, Mobile, Database, and Infrastructure) before deployments to the production environments.

### 1.2 QA Lifecycle
The software validation process follows a structured sequence:

```
[Requirement Analysis] ➔ [Technical Spec Review] ➔ [Test Planning & Case Design]
                                                            │
                                                            ▼
[Integration & API Tests] 💳 [Unit Tests] 💳 [Code Review] 💳 [Feature Development]
            │
            ▼
[UI & Mobile Testing] ➔ [Security & Load Testing] ➔ [User Acceptance Testing (UAT)]
                                                            │
                                                            ▼
                                                [Production Rollout & Smoke Check]
```

### 1.3 QA Team Roles & Responsibilities

| Role | Operational Scope | Key Deliverables |
| :--- | :--- | :--- |
| **QA Lead** | Strategy & Governance | Prepare Test Strategy, approve releases, monitor quality KPI metrics. |
| **QA Engineer** | Functional Validation | Write test cases, execute manual test sweeps, report bugs, verify fixes. |
| **Automation Engineer** | Automated Test Suites | Code automated tests, maintain scripts, integrate tests into CI/CD. |
| **Developer** | Local Verification | Fix bugs, write unit/integration tests, support QA, run peer code reviews. |

---

### 1.4 Quality Gates
Every change must pass through the quality gates before merging:

```
[Requirements Approved] ➔ [Code Review Passed] ➔ [Unit Tests ≥ 80%] ➔ [Integration Tests Passed] ➔ [API/UI Tests Passed] ➔ [Security/Load Benchmarks Passed] ➔ [UAT Approval] ➔ [Release Ready]
```

*   **Code Review**: Dual approvals required on all Pull Requests.
*   **Unit Coverage**: Enforce `≥ 80%` code coverage (measured via Jest/Vitest).
*   **Automation Gates**: All automated unit, integration, and API tests must finish with exit code 0.

### 1.5 Testing Environments

1.  **Development**: Local developer systems. Utilizes local databases, mocks, and seeded database files.
2.  **QA**: Isolated cloud testing server. Used for functional verification. Populated with realistic, generated test datasets.
3.  **Staging**: Production-like replica environment. Used for pre-release validation and load testing.
4.  **Production**: Real customer instances. Only smoke testing, health endpoint queries, and active logs monitoring are allowed here.

### 1.6 Test Data Strategy
*   **Real Data Protection**: Under no circumstances should real student, teacher, parent, or financial data be loaded into non-production environments.
*   **Dummy Data Generation**: Seed scripts (`prisma/seed.ts`) must generate randomized names, IDs, attendance metrics, and assignments for testing purposes.

---

### 1.7 Testing Categories
*   **Functional**: Validate that features match business requirements.
*   **Integration**: Confirm endpoints and modules communicate successfully.
*   **Regression**: Ensure new updates do not break existing modules.
*   **Security**: Validate route authentication guards, CORS rules, and rate limiters.
*   **Performance**: Verify SLA latencies under concurrent request spikes.
*   **Usability & Accessibility**: Enforce WCAG compliance and navigation flows.
*   **Recovery**: Test failover behaviors when database or caching services go offline.

### 1.8 Release Blockers
Deployments are blocked if any of the following exist:
*   Critical or High severity functional bugs.
*   Security vulnerability failures (e.g. broken role guards).
*   Performance degradation (average response latency > 300ms).
*   Database index or database connection pool failures.
*   Authentication or session verification issues.

---

## 2. Unit Testing Specification

### 2.1 Objective
Validate every function, service, frontend component, hook, and utility independently of external database states.

### 2.2 Coverage Requirements
*   **Backend Services**: `≥ 80%` code coverage.
*   **Frontend Apps**: `≥ 80%` code coverage.
*   **Critical Core Modules** (Auth, Timetable Conflict, Attendance Calculations): `≥ 95%` code coverage.

---

### 2.3 Example Test Case Structure (`AUTH_UNIT_001`)

```
Test Case ID: AUTH_UNIT_001
Feature: User Login Verification
Preconditions: Target user account exists in PostgreSQL database.
Test Steps:
  1. Post login payload containing valid user email.
  2. Post login payload containing matching valid password.
  3. Submit login request to NestJS.
Expected Results:
  - Return HTTP status code 200/201.
  - Return signed JWT access token and refresh token.
  - Log access record inside `login_history` database table.
Priority: Critical
Automation: Yes
```

---

### 2.4 Domain-Specific Unit Testing Rules

#### 2.4.1 Student & Teacher Modules
*   **Student profile creation**: Validate UUID generation, class-validator schemas, and auto-generated registration details (admission and roll numbers).
*   **Teacher profile creation**: Verify department validation, profile updates, and leave request permissions.

#### 2.4.2 Attendance Module
*   **State validations**: Enforce correct parsing of attendance values (`PRESENT`, `ABSENT`, `LEAVE`, `MEDICAL`, `LATE`).
*   **Formula accuracy**: Verify the percentage calculator formula:
    $$\text{Attendance \%} = \left( \frac{\text{Lectures Present}}{\text{Total Lectures}} \right) \times 100$$
*   **Attendance Lock**: Ensure attendance sheets lock and block updates once marked as finalized.

#### 2.4.3 Timetable Module
*   **Availability checking**: Enforce logic to prevent scheduling conflicts:
    *   Validate that a teacher is not scheduled in two separate divisions at the same time.
    *   Validate that a room is not double-booked for the same period.
    *   Verify time overlap calculations.

#### 2.4.4 Assignments & Notes Modules
*   **Assignments**: Verify submission deadline evaluations, late submission flags, and grading boundaries.
*   **Notes**: Validate extension filtering and file metadata extraction.

---

### 2.5 Frontend Component & Hook Testing
*   **Reusable Components**: Render and test state variations of buttons, cards, forms, tables, and dialogs.
*   **Custom React Hooks**:
    *   *Authentication hook*: Verify state updates on token set, clear, and expire.
    *   *Socket hook*: Test socket listener events.
    *   *Pagination & search hooks*: Verify query updates on search input or page switch.
*   **Utility Functions**: Test date formatters, field validators, permission check filters, and array sorting scripts.

### 2.6 Mobile Widget Testing
*   **Widgets**: Validate mobile UI widgets, navigation buttons, and state changes.
*   **Offline Cache**: Verify that local SQLite/Hive database caches render offline payloads correctly.

### 2.7 Automation Frameworks
*   **Backend Unit Tests**: Written in **Jest** (`pnpm run test`).
*   **Frontend Unit Tests**: Written in **Vitest** (`pnpm run test:unit`).
*   **Mobile Unit Tests**: Written in Flutter's build-in `flutter_test` suite.

---

## 3. Integration Testing Specification

### 3.1 Objective
Verify communication paths, database operations, caching nodes, and external vendor APIs behave correctly under realistic workflows.

### 3.2 Core Integration Workflows

#### 3.2.1 Authentication Integration

```
[Frontend Client] ──(Post Credentials)──> [NestJS auth/login]
                                                 │
                                                 ▼
[Load Dashboard] <──(JWT Verification)── [PostgreSQL User Query & Redis Session Set]
```

#### 3.2.2 Student Registration Flow
1.  Admin triggers `POST /api/v1/students` with profile data.
2.  NestJS inserts account credentials to `users` and maps user to profile in `students`.
3.  Assigns role mapping to `user_roles`.
4.  Logs event in `audit_logs`.
5.  Emits a Socket.IO event to update the student registry list dashboard.
6.  Triggers mail event to send onboarding credentials to the student.

#### 3.2.3 Attendance Dashboard Synchronization
1.  Teacher posts attendance sheet via API.
2.  Database transaction writes to `attendance_records`.
3.  Triggers `@nestjs/event-emitter` event:
    *   Clears Redis attendance analytics cache.
    *   Updates student attendance percentage score metrics.
    *   Pushes real-time dashboard progress warnings via Socket.IO.

#### 3.2.4 Real-Time Notifications
1.  System generates notification payload (e.g. assignment published).
2.  Writes entry to `notifications` database table.
3.  Emits live event payload to user's WebSocket channel via Socket.IO.
4.  Verify client UI displays the new notification count instantly without page reload.

---

### 3.3 Integration Failure Recovery Testing
The system must handle service outages gracefully without data corruption:

*   **PostgreSQL Offline**: API controllers must log database errors, return code `503 Service Unavailable`, and prevent half-committed transaction states.
*   **Redis Offline**: Cache manager must catch cache exceptions, failover to query database directly (cache bypass), and continue system operations.
*   **Cloud Storage Offline**: File uploads must log failures, queue file buffers locally for retry, and prompt users with clean UI validation messages.
*   **SMTP Offline**: Notification microservices must catch email delivery failures, store pending logs in PostgreSQL, and queue them for resending when SMTP recovers.

---

### 3.4 Automation Frameworks & Execution
*   **API Integration Tests**: Managed using **Jest + Supertest** inside backend packages.
*   **UI Integration Tests**: Managed using **Playwright** (runs end-to-end user actions on Chromium/Firefox).
*   **Mobile Integration Tests**: Managed using Flutter's native `integration_test` package.
*   **Pipeline Triggers**:
    *   *Every PR*: Runs fast lint check, backend unit tests, and frontend Vitest checks.
    *   *Nightly Build*: Runs full integration suite, Playwright UI testing, and recovery check scripts.
    *   *Release Gate*: Full QA regression check run must pass prior to staging validation.

---

## 4. API Testing Specification

### 4.1 Objective
Verify every REST API endpoint behaves correctly under all expected and unexpected conditions. API testing validates Authentication, Authorization, DTO Validation, Business Logic, Database interactions, Performance, Security, and Error Handling.

### 4.2 API Testing Workflow
Each request is traced through the full pipeline:
```
Request -> Headers Validation -> Authentication -> Authorization -> DTO Validation
                                                                        |
                                                                        v
                                     Response <- Audit Log <- Business Logic <- Database
                                         |
                                         v
                                 Performance Validation
```

### 4.3 API Categories

| Category | Notes |
| :--- | :--- |
| Authentication APIs | Login, Refresh, Logout, OTP flows |
| Student APIs | CRUD, suspend, roll/admission number generation |
| Teacher APIs | CRUD, department assignment, leave |
| Attendance APIs | Session management, formulas, locks |
| Timetable APIs | Conflict detection, publish/unpublish |
| Notes APIs | Upload, download, versioning |
| Assignment APIs | Create, submit, review, marks |
| Events APIs | Register, attendance, certificates |
| Announcement APIs | Create, target audiences, read receipts |
| Analytics APIs | Aggregation correctness, cache invalidation |
| Report APIs | Generation, export (PDF/CSV) |
| Notification APIs | Delivery, read status, history |
| File APIs | Upload, download, presigned URLs |

### 4.4 Authentication API Tests

**Happy Path - Login:**
```
POST /auth/login { valid email + password }
   -> 200 OK
   -> accessToken (JWT) present
   -> refreshToken present
   -> session created in DB
   -> Redis session key set
   -> loginHistory record created
```

**Negative Cases:**

| Case | Expected Status | Error Code |
| :--- | :--- | :--- |
| Wrong password | 401 | AUTH_001 |
| Email not found | 401 | AUTH_001 |
| Account locked | 401 | AUTH_002 |
| Suspended user | 401 | AUTH_003 |
| Unverified email | 401 | AUTH_004 |
| Missing email field | 400 | Validation error |
| Invalid email format | 400 | Validation error |

### 4.5 CRUD API Tests

**Every Create (POST) must verify:**
- DTO field validation (required, type, format)
- Database record inserted with correct data
- Audit log entry created
- Socket event emitted (where applicable)
- Response code 201 Created
- Response body matches success schema

**Every Update (PATCH/PUT) must verify:**
- Previous state preserved (soft update / history)
- Database record updated with new values
- Change history or version recorded
- Audit log entry created
- Relevant notification dispatched

**Every Delete (DELETE) must verify:**
- Soft-delete applied (deletedAt set), not hard-delete
- Dependent relationships preserved or cascaded
- Audit log entry created
- Requester has correct DELETE permission

### 4.6 Response Validation

| Field | Rule |
| :--- | :--- |
| HTTP Status | Correct code (200/201/204/400/401/403/404/409/422/500) |
| success flag | true on success, false on error |
| message | Human-readable string, never empty |
| data | Correct schema; never exposes passwordHash or internal IDs |
| meta | Pagination info present on list endpoints (page, limit, total) |

### 4.7 Error Validation

| Code | Scenario |
| :--- | :--- |
| 400 Bad Request | Malformed JSON body |
| 401 Unauthorized | Missing / expired JWT |
| 403 Forbidden | Correct JWT but insufficient role |
| 404 Not Found | Resource ID does not exist |
| 409 Conflict | Duplicate entry (unique constraint) |
| 422 Unprocessable Entity | Validation failure (e.g., invalid date format) |
| 500 Internal Server Error | Simulated DB failure; must not leak stack trace |

### 4.8 Performance Targets

| Endpoint Group | Max Response Time |
| :--- | :--- |
| Login | < 1,000 ms |
| CRUD operations | < 500 ms |
| Search / Filter | < 300 ms |
| Dashboard data | < 2,000 ms |

### 4.9 Automation Frameworks

| Tool | Role |
| :--- | :--- |
| Jest + Supertest | Primary API test runner |
| Postman Collection | Manual exploratory and regression testing |
| Newman | CI/CD headless Postman runner |

### 4.10 Exit Criteria
- 100% endpoint coverage across all API categories
- Zero critical failures (5xx errors in happy paths)
- Zero authentication failures in valid-credential flows
- All performance targets met within defined limits

---

## 5. Frontend Testing Specification

### 5.1 Objective
Validate every user interaction on the Next.js web application across all pages, components, and user roles.

### 5.2 Pages Covered

| Route | Role |
| :--- | :--- |
| /login | All |
| /dashboard | All roles |
| /dashboard/student/* | Student |
| /dashboard/teacher/* | Teacher |
| /dashboard/admin/* | Admin |
| /attendance | Teacher, Admin |
| /timetable | All |
| /notes | All |
| /assignments | All |
| /events | All |
| /announcements | All |
| /settings | All |

### 5.3 Navigation Tests
- **Sidebar Navigation**: All links route to correct pages without full reload.
- **Navbar**: Role name, avatar, logout button, and notification badge render correctly.
- **Breadcrumbs**: Correct hierarchy shown on nested routes.
- **Back Button**: Browser back preserves table state (search term, page, sort).
- **Deep Links**: Unauthenticated direct URL access redirects to login.

### 5.4 Form Validation Tests

| Validation Rule | Example |
| :--- | :--- |
| Required fields | Submitting empty form shows inline error |
| Email format | notanemail shows validation error |
| Phone format | Rejects non-numeric / wrong length |
| Password rules | Rejects < 8 chars, missing uppercase, etc. |
| Date validation | End date cannot precede start date |
| File upload | Rejects disallowed MIME types; enforces max size |
| Duplicate detection | Warns before submitting duplicate roll numbers |

### 5.5 Table Testing
- **Search**: Debounced input triggers correct API call and updates rows.
- **Sort**: Column headers re-query with correct sortBy/order params.
- **Pagination**: Page buttons and size selector update results correctly.
- **Filters**: Active filters reflected in URL query params.
- **Export**: CSV/PDF download contains correct data matching current filters.
- **Import**: Bulk CSV import shows per-row validation feedback.

### 5.6 Dashboard Testing

**Student Dashboard** must render: Attendance %, performance chart, leaderboard rank, upcoming assignments, upcoming events, latest announcements.

**Teacher Dashboard** must render: Today's schedule, attendance submission buttons, notes upload shortcut, pending review count, student list.

**Admin Dashboard** must render: System-wide statistics, trend charts, recent activity log, report generation shortcuts.

### 5.7 Responsive Testing

| Device | Viewport |
| :--- | :--- |
| Desktop | >= 1280px |
| Laptop | 1024-1279px |
| Tablet | 768-1023px |
| Mobile | < 768px |

Browsers: Chrome, Firefox, Edge, Safari.

### 5.8 Accessibility Testing
- **Keyboard Navigation**: All interactive elements reachable via Tab / Enter / Space.
- **Screen Reader**: ARIA labels present and meaningful on all controls.
- **Focus Indicators**: Visible focus ring on all focusable elements.
- **Color Contrast**: WCAG AA � 4.5:1 normal text, 3:1 large text.

### 5.9 UI Consistency Checks
Before every release: verify design system font stack, 4px/8px spacing grid, brand color tokens, consistent component variants, and 60 FPS animations.

### 5.10 Automation Frameworks

| Tool | Role |
| :--- | :--- |
| Playwright | End-to-end browser automation |
| React Testing Library | Component-level rendering and interaction tests |
| Vitest | Unit tests for utility functions, hooks, and state logic |

---

## 6. Mobile Application Testing Specification

### 6.1 Objective
Ensure the Flutter application functions reliably across supported Android devices, network conditions, and orientations.

### 6.2 Device Coverage

| Platform | Versions | Form Factors |
| :--- | :--- | :--- |
| Android | 11 and above | Phones, Tablets |
| iOS | Latest two major versions | Future phase |

### 6.3 Functional Testing

| Flow | Validation |
| :--- | :--- |
| Login | JWT received, role-based routing to correct dashboard |
| Dashboard | All widgets render with real data |
| Attendance | Teacher can mark; student can view status |
| Notes | List loads, PDF preview opens, download completes |
| Assignments | Student can view and submit; teacher can review |
| Events | List, registration, and confirmation flow |
| Profile | Data displays correctly, avatar upload works |
| Notifications | Badge count updates, notification tray opens |

### 6.4 Offline Testing

**Disconnect internet, then verify:**
- Timetable loads from local cache (Hive / Isar).
- Previously downloaded notes are accessible.
- Last-fetched announcements are readable.
- Profile screen renders from cached data.

**Reconnect, then verify:**
- Background sync triggers within 10 seconds.
- Cache refreshed with new server data.
- Offline-queued actions are flushed.

### 6.5 Push Notification Testing

| Trigger | Notification Type |
| :--- | :--- |
| Teacher marks attendance | Attendance alert to student |
| Assignment deadline approaching | Assignment reminder |
| Event registration opens | Event reminder |
| Admin posts announcement | Announcement notification |
| Exam result published | Result notification |

### 6.6 File Testing

| Operation | Validation |
| :--- | :--- |
| Download | File saves to device storage; progress bar shown |
| Upload | File picked from gallery/storage; upload completes; URL stored |
| Preview | PDF and image files open inline |
| Offline Access | Downloaded files accessible without internet |
| Delete | File removed from local cache and server |

### 6.7 Device Rotation Tests
- **Portrait to Landscape**: All screens maintain layout integrity; no overflow or clipping.
- **Landscape to Portrait**: State (scroll position, form data) preserved on orientation change.
- **Tablet**: Two-panel layouts display correctly in both orientations.

### 6.8 Performance Targets

| Metric | Target |
| :--- | :--- |
| App cold launch | < 2 seconds |
| Screen load | < 1 second |
| API response handling | < 500 ms |
| Animation frame rate | 60 FPS consistently |

### 6.9 Mobile Security

| Check | Requirement |
| :--- | :--- |
| Secure Storage | JWT stored in flutter_secure_storage (Keychain / Keystore) |
| JWT Protection | Token never stored in plain SharedPreferences |
| Session Timeout | App locks after configurable idle period |
| Screenshot Restrictions | Sensitive screens (login, OTP) block screenshot capture |
| Biometric Auth | Architecture stub in place; full implementation in future phase |

### 6.10 Automation Frameworks

| Tool | Role |
| :--- | :--- |
| flutter_test | Widget and unit tests |
| flutter integration_test | Full app automation on real devices / emulators |
| Patrol (optional) | Native OS interaction testing (notifications, permissions) |
