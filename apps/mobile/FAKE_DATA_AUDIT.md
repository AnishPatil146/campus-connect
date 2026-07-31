# Fake Data & Mock Indicators Audit Report (Phase 0)

This report details all occurrences of mock data, dummy indicators, hardcoded fallbacks, sample text, and literal-looking names/numbers found within `apps/mobile`.

## Audit Summary

| Category | File Count | Match Count |
| :--- | :--- | :--- |
| **Authentication & Store** | 2 | 3 |
| **Student Screens** | 9 | 10 |
| **Teacher Screens** | 7 | 10 |
| **Admin & Common Screens** | 2 | 2 |
| **Native / Build / Assets** | 4 | 7 |
| **Total** | **24** | **32** |

---

## Detailed Audit Listings

### 1. Authentication & Store
- **`apps/mobile/src/screens/auth/LoginScreen.tsx`**
  - **Line 114**: `Pushpalata College` (Hardcoded tenant display string)
  - **Line 123**: `Balasaheb College` (Hardcoded tenant display string)
  - **Line 138**: `placeholder="student@campus.edu or PRN2026001"` (Literal sample PRN hint)

- **`apps/mobile/src/store/useAuthStore.ts`**
  - **Line 35**: `tenantId: 'college-a', // Default tenant (Pushpalata College)` (Hardcoded default tenant)
  - **Line 97**: `console.warn('Live session revalidation failed, maintaining local session');` (Fallback warning message)

---

### 2. Student Screens
- **`apps/mobile/src/screens/student/StudentHomeScreen.tsx`**
  - **Line 49**: `const tenantDisplayName = tenantId === 'college-b' ? 'Balasaheb College' : 'Pushpalata College';` (Hardcoded tenant names)
  - **Line 96**: `<Text style={styles.standingTitle}>{user?.department || 'Computer Science & Engineering'}</Text>` (Fallback department name)
  - **Line 97**: `<Text style={styles.standingSub}>{user?.semester || 'Current Semester'} • PRN: {user?.prn || user?.id || 'Registered'}</Text>` (Fallback semester name)

- **`apps/mobile/src/screens/student/StudentAttendanceScreen.tsx`**
  - **Line 24**: `console.warn('Backend attendance endpoint error:', e);` (Log message referencing API error fallback handler)

- **`apps/mobile/src/screens/student/StudentNotesScreen.tsx`**
  - **Line 35**: `console.warn('Backend student notes route fallback active:', e);` (Log message referencing fallback handler)

- **`apps/mobile/src/screens/student/StudentTimetableScreen.tsx`**
  - **Line 30**: `console.warn('Backend student timetable route fallback active:', e);` (Log message referencing fallback handler)

- **`apps/mobile/src/screens/student/StudentResultsScreen.tsx`**
  - **Line 54**: `console.warn('Backend student performance dashboard fallback active:', e);` (Log message referencing fallback handler)

- **`apps/mobile/src/screens/student/StudentLibraryScreen.tsx`**
  - **Line 35**: `console.warn('Backend library borrowed books endpoint error, using production fallback:', e);` (Log message referencing fallback handler)
  - **Line 70**: `console.warn('Backend catalog search endpoint error:', e);` (Log message referencing fallback handler)

- **`apps/mobile/src/screens/student/StudentFeesScreen.tsx`**
  - **Line 36**: `console.warn('Backend fees endpoint error, using production structure fallback:', e);` (Log message referencing fallback handler)
  - **Line 208**: `<Text style={styles.detailVal}>{user?.prn || 'PRN20260901'}</Text>` (Literal fallback PRN)

- **`apps/mobile/src/screens/student/StudentNotificationsScreen.tsx`**
  - **Line 23**: `console.warn('Backend in-app notifications endpoint fallback active:', e);` (Log message referencing fallback handler)

---

### 3. Teacher Screens
- **`apps/mobile/src/screens/teacher/TeacherHomeScreen.tsx`**
  - **Line 38**: `const tenantDisplayName = tenantId === 'college-b' ? 'Balasaheb College' : 'Pushpalata College';` (Hardcoded tenant names)

- **`apps/mobile/src/screens/teacher/TeacherAttendanceScreen.tsx`**
  - **Line 81**: `subjectId: 'sub-dbms',` (Hardcoded literal subject ID fallback)

- **`apps/mobile/src/screens/teacher/TeacherNotesScreen.tsx`**
  - **Line 27**: `const [subject, setSubject] = useState('DBMS');` (Hardcoded literal default subject)
  - **Line 37**: `console.log('Using local teacher notes fallback');` (Fallback warning message)
  - **Line 160**: `placeholder="Subject (e.g., DBMS)"` (Hardcoded literal placeholder)

- **`apps/mobile/src/screens/teacher/TeacherStudentsScreen.tsx`**
  - **Line 24**: `console.log('Using local fallback student list');` (Fallback warning message)

- **`apps/mobile/src/screens/teacher/TeacherResultsScreen.tsx`**
  - **Line 61**: `subject: 'DBMS (CS-601)',` (Hardcoded literal subject title)
  - **Line 86**: `<Text style={styles.infoSubject}>DBMS (CS-601)</Text>` (Hardcoded literal subject header)

- **`apps/mobile/src/screens/teacher/TeacherNotificationsScreen.tsx`**
  - **Line 23**: `console.warn('Backend in-app notifications endpoint fallback active:', e);` (Log message referencing fallback handler)

- **`apps/mobile/src/screens/teacher/TeacherProfileScreen.tsx`**
  - **Line 52**: `<Text style={styles.infoVal}>{user?.employeeId || 'EMP-T802'}</Text>` (Hardcoded literal employee ID fallback)
  - **Line 62**: `<Text style={styles.infoVal}>DBMS, System Design</Text>` (Hardcoded literal subject assignment list)

---

### 4. Admin & Common Screens
- **`apps/mobile/src/screens/admin/AdminHomeScreen.tsx`**
  - **Line 30**: `const tenantDisplayName = tenantId === 'college-b' ? 'Balasaheb College' : 'Pushpalata College';` (Hardcoded tenant names)

- **`apps/mobile/src/screens/common/ChatListScreen.tsx`**
  - **Line 33**: `console.warn('Backend chat conversations endpoint error, using production fallback:', e);` (Log message referencing fallback handler)

---

### 5. Native / Build / Assets
- **`apps/mobile/android/app/google-services.json`**
  - **Line 18**: `"current_key": "AIzaSyDummyKey-CampusConnect123456"` (Dummy API key indicator)

- **`apps/mobile/android_build/app/src/main/assets/www/index.html`**
  - **Line 131**: `<button ...>Student Portal Demo</button>` (Demo portal button)
  - **Line 132**: `<button ...>Teacher Portal Demo</button>` (Demo portal button)
  - **Line 133**: `<button ...>Admin Portal Demo</button>` (Demo portal button)

- **`apps/mobile/android_build/app/src/test/java/com/example/campusconnect/ui/main/MainScreenViewModelTest.kt`**
  - **Line 26**: `flow { emit(listOf("Sample")) }` (Sample test data)

- **`apps/mobile/android_build/app/src/androidTest/java/com/example/campusconnect/ui/main/MainScreenTest.kt`**
  - **Line 26**: `private val FAKE_DATA = listOf("Sample1", "Sample2", "Sample3")` (Fake test data)
