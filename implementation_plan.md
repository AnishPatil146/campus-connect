# Production Recovery Plan for Admin Portal (P0 Incident)

Recover the Admin Command Center of Campus Connect to achieve 100% production readiness by connecting real-time APIs, establishing secure WebSocket connections, broadcasting audit logs/notifications, and validating operations via Playwright E2E tests.

## User Review Required

> [!IMPORTANT]
> - **JWT Authentication Middleware for Socket.IO**: Anonymous WebSocket connections will be blocked. The frontend will pass the standard `cc_token` in the socket auth payload.
> - **Real-Time System Health**: We will establish a 5-second backend background check that broadcasts status info via the `system:health` WebSocket event.
> - **Timetable Alignment**: We will fix a bug in the admin dashboard where the Javascript `dayOfWeek` (string format) failed to match the Prisma `dayOfWeek` (integer format).

## Open Questions

- None at this moment. The incident instructions are highly specific.

## Proposed Changes

---

### Backend API Services

#### [MODIFY] [dashboard.service.ts](file:///c:/Users/USER/OneDrive/Desktop/campus-connect/apps/api/src/dashboard/dashboard.service.ts)
- Update `getAdminDashboard` to query the database for:
  - `totalDepartments`
  - `pendingTasks`
  - `activeSessions` (where `isActive: true` in the `Session` model)
  - `systemHealth` (include DB cluster status, Redis, storage, active session counts, and uptime)

#### [MODIFY] [events.gateway.ts](file:///c:/Users/USER/OneDrive/Desktop/campus-connect/apps/api/src/events/events.gateway.ts)
- Implement `afterInit` to bind JWT Authentication Middleware (`server.use(...)`).
- Verify tokens using `jwt.verify(token, process.env.JWT_SECRET)`.
- Restrict WebSocket CORS to allowed origins only (ensure no wildcard CORS).
- Set up an `@Interval(5000)` scheduler to fetch system nodes health (API, DB, Redis, Socket, Storage) and broadcast them via the `system:health` event.

#### [MODIFY] [audit.service.ts](file:///c:/Users/USER/OneDrive/Desktop/campus-connect/apps/api/src/audit/audit.service.ts)
- Inject `EventsGateway` and emit an `audit:log` event on successful creation of any activity log.

#### [MODIFY] [notifications.service.ts](file:///c:/Users/USER/OneDrive/Desktop/campus-connect/apps/api/src/notifications/notifications.service.ts)
- Emit `notification:new` socket event on every direct user notification or broadcast notification creation.

#### [MODIFY] [timetable.service.ts](file:///c:/Users/USER/OneDrive/Desktop/campus-connect/apps/api/src/timetable/timetable.service.ts)
- Update `getClassTimetable` to support optional/empty `divisionId` so that it returns all active slots.
- Ensure the `teacher` relation includes the `user` relation so that the teacher's name is not empty.

#### [MODIFY] [assignments.service.ts](file:///c:/Users/USER/OneDrive/Desktop/campus-connect/apps/api/src/assignments/assignments.service.ts)
- Add `result:published` socket broadcasts when recording grades or updating submission marks.

#### [MODIFY] [announcements.service.ts](file:///c:/Users/USER/OneDrive/Desktop/campus-connect/apps/api/src/announcements/announcements.service.ts)
- Add `announcement:new` socket broadcasts on new announcements.

---

### Frontend Web UI

#### [MODIFY] [SocketProvider.tsx](file:///c:/Users/USER/OneDrive/Desktop/campus-connect/apps/web/components/SocketProvider.tsx)
- Retrieve `cc_token` from localStorage and pass it in the `auth.token` parameter of the `io(...)` connection call.

#### [MODIFY] [page.tsx](file:///c:/Users/USER/OneDrive/Desktop/campus-connect/apps/web/app/dashboard/admin/page.tsx)
- Modify KPI array to display the requested 6 stats: Total Students, Total Teachers, Total Departments, Pending Tasks, Active Sessions, and System Health.
- Replace static visual markers on "System Nodes Status" card with live indicators bound to real-time `system:health` socket event.
- Bind dashboard elements to real-time events (`audit:log`, `notification:new`, `system:health`, `announcement:new`, etc.) and ensure appropriate Loading, Empty, and Error states.
- Correct the Javascript-to-Prisma `dayOfWeek` comparison filter so classes are correctly listed.

#### [MODIFY] [page.tsx](file:///c:/Users/USER/OneDrive/Desktop/campus-connect/apps/web/app/dashboard/admin/timetable/page.tsx)
- Remove localStorage fallback implementation and connect directly to backend endpoints (`api.getAdminTimetable()`, `api.createTimetable()`, `api.deleteTimetable()`, `api.publishTimetable()`).

---

### E2E Testing

#### [NEW] [admin_recovery.spec.ts](file:///c:/Users/USER/OneDrive/Desktop/campus-connect/apps/web/e2e/admin_recovery.spec.ts)
- Implement comprehensive Playwright E2E tests validating:
  1. **Admin Login**: Log in with `anish@college.edu` / `password123`.
  2. **Student CRUD & Search/Filter**: Add, edit, query, and delete students.
  3. **Teacher CRUD**: Add, edit, list, and delete faculty members.
  4. **Timetable Publish**: Create and publish timetable slots.
  5. **Real-time Notifications**: Trigger notifications and verify bell counts.
  6. **Real-time Audit Logs**: Verify audit logs are populated.
  7. **System Health**: Check system nodes operational status.
  8. **Reports & Exports**: Verify student and teacher report listing.

## Verification Plan

### Automated Tests
- Build all projects using `pnpm build` to verify compilation.
- Run the Playwright test suite:
  ```powershell
  pnpm --filter @campus-connect/web exec playwright test e2e/admin_recovery.spec.ts
  ```

### Manual Verification
- Log in to the Admin Dashboard and inspect KPIs and real-time status feeds.
- Simulate marking student attendance as a teacher and verify the Admin Dashboard reloads instantly.
