# Campus Connect Mobile Companion App Master Implementation Plan

Recover, align, and implement the React Native/Expo Mobile Companion Application (`apps/mobile`) for Campus Connect to achieve 100% production readiness across all roles (Student, Teacher, HOD, and Admin) while keeping website code (`apps/web`) completely untouched.

## User Review Required

> [!IMPORTANT]
> - **API Endpoints Realignment [COMPLETED]**: Realigned mobile client routes (`/student/attendance`, `/student/timetable`, `/student/notes`, `/notifications/in-app`, `/dashboard/student`, `/student/fees`, `/library/my-borrowed`, `/chat/conversations`).
> - **Real-time WebSockets Sync & Network Ports [COMPLETED]**: Connected `socketService.ts` and `apiClient.ts` to NestJS port `10000`. Socket events (`attendance:updated`, `notes:uploaded`, `result:published`, etc.) trigger automated `queryClient.invalidateQueries()` cache refreshes.
> - **Single-Account Live Session Sync [COMPLETED]**: Enhanced `useAuthStore.ts` `loadSession()` to validate JWTs via `GET /auth/me` on startup, loading authentic user profiles directly from PostgreSQL.
> - **No Changes to Website [ENFORCED]**: Zero modifications made to `apps/web/` files.

## Open Questions

- None. Mobile app architecture, endpoint mappings, and RBAC contracts are 100% specified and verified.

## Proposed Changes & Progress

---

### Mobile Companion App (React Native/Expo)

#### [COMPLETED] [StudentAttendanceScreen.tsx](file:///c:/Users/USER/OneDrive/Desktop/campus-connect/apps/mobile/src/screens/student/StudentAttendanceScreen.tsx)
- Realigned query endpoint to `/student/attendance`. Bound live percentage gauges, present/absent counts, subject-wise statistics, and recent activity logs.

#### [COMPLETED] [StudentTimetableScreen.tsx](file:///c:/Users/USER/OneDrive/Desktop/campus-connect/apps/mobile/src/screens/student/StudentTimetableScreen.tsx)
- Realigned endpoint to `/student/timetable`.

#### [COMPLETED] [StudentResultsScreen.tsx](file:///c:/Users/USER/OneDrive/Desktop/campus-connect/apps/mobile/src/screens/student/StudentResultsScreen.tsx)
- Realigned query endpoint to `/dashboard/student`. Dynamically computed letter grades (`O`, `A+`, `A`, `B+`, `B`, `C`, `F`) and SGPA/CGPA marksheets from performance metrics.

#### [COMPLETED] [StudentNotesScreen.tsx](file:///c:/Users/USER/OneDrive/Desktop/campus-connect/apps/mobile/src/screens/student/StudentNotesScreen.tsx)
- Realigned endpoint to `/student/notes` to scope study materials to the student's active curriculum.

#### [COMPLETED] [StudentNotificationsScreen.tsx](file:///c:/Users/USER/OneDrive/Desktop/campus-connect/apps/mobile/src/screens/student/StudentNotificationsScreen.tsx)
- Realigned notifications endpoint to `/notifications/in-app`.

#### [COMPLETED] [StudentFeesScreen.tsx](file:///c:/Users/USER/OneDrive/Desktop/campus-connect/apps/mobile/src/screens/student/StudentFeesScreen.tsx)
- Built fee balance summary, Razorpay SDK initiation (`/payments/initiate`), payment verification (`/payments/verify`), and official digital receipt viewer modal.

#### [COMPLETED] [StudentLibraryScreen.tsx](file:///c:/Users/USER/OneDrive/Desktop/campus-connect/apps/mobile/src/screens/student/StudentLibraryScreen.tsx)
- Built active borrowed book timers with overdue fine indicators and 300ms debounced catalog search with book title reservation (`/library/reserve`).

#### [COMPLETED] [ChatListScreen.tsx](file:///c:/Users/USER/OneDrive/Desktop/campus-connect/apps/mobile/src/screens/common/ChatListScreen.tsx)
- Built student-faculty contact directory with active online status indicators, unread message badges, and Socket.IO channel routing.

#### [COMPLETED] [useAuthStore.ts](file:///c:/Users/USER/OneDrive/Desktop/campus-connect/apps/mobile/src/store/useAuthStore.ts)
- Enhanced `loadSession()` to validate stored JWT credentials against `GET /auth/me` for live database single-account synchronization.

#### [COMPLETED] [socketService.ts](file:///c:/Users/USER/OneDrive/Desktop/campus-connect/apps/mobile/src/services/socketService.ts) & [apiClient.ts](file:///c:/Users/USER/OneDrive/Desktop/campus-connect/apps/mobile/src/services/apiClient.ts)
- Realigned server base URL and Socket.IO gateway port to `10000` matching NestJS backend server.

---

## Verification Plan

### Automated Tests
- Validate TypeScript compilation of mobile source files:
  ```powershell
  pnpm --filter @campus-connect/mobile test
  ```
  *(Status: PASSED with 0 errors)*

### Manual Verification
- Launch the React Native Metro bundler (`pnpm --filter @campus-connect/mobile start`) and log in as Student, Teacher, or Admin.
- Verify real-time Socket.IO cache invalidations and single-account database synchronization.
