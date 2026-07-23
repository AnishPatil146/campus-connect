# Campus Connect Mobile App V1 Architecture Documentation

## Overview
Campus Connect Mobile App V1 is a native-like mobile companion built for higher education institutions using Expo, React Native, TypeScript, React Query, Zustand, Socket.IO Client, and React Navigation.

It connects to the unified NestJS backend, Socket.IO event gateway, and multi-tenant PostgreSQL databases while offering a mobile-first design language distinct from the web administration dashboard.

---

## Tech Stack Summary
- **Framework**: React Native with Expo (`~51.0.28`)
- **Language**: TypeScript (`^5.4.5`)
- **Server State & Caching**: TanStack React Query (`^5.51.11`)
- **Global Auth & Client State**: Zustand (`^4.5.4`)
- **Real-Time Gateway**: Socket.IO Client (`^4.7.5`) listening on `/events`
- **Navigation**: React Navigation (`@react-navigation/bottom-tabs`, `@react-navigation/native-stack`)
- **Offline Persistence**: `@react-native-async-storage/async-storage`

---

## Multi-Tenant Contract
- **Tenant Header**: `x-college-id` sent on every HTTP request via Axios interceptors.
- **Tenants Supported**:
  1. `Pushpalata College` (`college-a`)
  2. `Balasaheb College` (`college-b`)
- **Data Isolation**: Database models and real-time Socket room joins are scoped strictly to the selected tenant.

---

## Real-Time Socket Events (<1s Latency Target)
The mobile app subscribes to the NestJS `/events` WebSocket namespace and reacts to:
- `attendance:updated` -> Invalidates attendance & dashboard queries instantly.
- `notes:uploaded` -> Refreshes notes list.
- `result:published` -> Refreshes student marksheets & SGPA/CGPA cards.
- `timetable:published` -> Updates timetable timeline.
- `notification:new` -> In-app alert feed.
- `announcement:new` -> Broadcast banners.

---

## Screen Architecture

### Student Application ("My College In My Pocket")
1. **Home Screen**: Welcome banner, today's schedule timeline, overall attendance gauge (87%), new notes counter, latest SGPA/CGPA result preview, upcoming events.
2. **Attendance Screen**: Overall attendance ring, subject percentage breakdown, progress bars, recent activity log, live socket synchronization.
3. **Timetable Screen**: Today's classes, weekly day selector (Mon-Sat), room number, teacher names, next class hero widget.
4. **Notes Screen**: Search bar, filter pills (ALL, PDF, PPT, DOCX), download file action, offline storage support.
5. **Results Screen**: SGPA & CGPA overview card, subject marksheet table with grade points, pass/fail indicators.
6. **Notifications Screen**: In-app push feed with type badges.
7. **Profile Screen**: PRN, department, semester, tenant switcher, logout.

### Teacher Application ("My Classroom In My Pocket")
1. **Home Screen**: Today's lectures, pending attendance counter, quick action shortcuts.
2. **Attendance Screen**: **30-Second Express Roll Call** with student list tap toggle (Present/Absent), "Mark All Present" shortcut, and real-time Socket broadcast trigger.
3. **Students Screen**: Searchable class roster, student attendance & SGPA tracking.
4. **Notes Screen**: Upload note modal (title, subject, file format picker), notes management, delete action.
5. **Results Screen**: Mark entry per student, single-tap publish results with real-time student notification.
6. **Notifications Screen**: Faculty alerts & timetable change notifications.
7. **Profile Screen**: Employee ID, designation, tenant switcher, logout.
