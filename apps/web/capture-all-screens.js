const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/USER/.gemini/antigravity-ide/brain/74475476-cc9a-4d8e-8d53-07c20fe31ba1';
const DOCS_DIR = 'c:/Users/USER/OneDrive/Desktop/campus-connect/docs/screenshots';

const MOCK_USERS = {
  student: {
    id: "std_001",
    email: "student@collegea.edu",
    name: "Alex Rivera",
    role: "STUDENT",
    collegeId: "college-a",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    studentProfile: {
      rollNumber: "CS-2024-042",
      enrollmentNumber: "EN2024CS042",
      department: "Computer Science & Engineering",
      semester: 6,
      division: "A",
      batch: "2022-2026"
    }
  },
  teacher: {
    id: "tch_001",
    email: "teacher@collegea.edu",
    name: "Dr. Sarah Jenkins",
    role: "TEACHER",
    collegeId: "college-a",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    teacherProfile: {
      employeeId: "FAC-CSE-018",
      department: "Computer Science & Engineering",
      designation: "Associate Professor"
    }
  },
  admin: {
    id: "adm_001",
    email: "admin@collegea.edu",
    name: "Dr. Eleanor Vance (Dean)",
    role: "ADMIN",
    collegeId: "college-a",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z"
  }
};

const SCREENS = [
  // --- 01. PUBLIC & AUTH ---
  { category: '01_public', filename: '01_landing_page.png', path: '/', role: null },
  { category: '01_public', filename: '02_unified_login.png', path: '/login', role: null },
  { category: '01_public', filename: '03_signup_page.png', path: '/signup', role: null },
  { category: '01_public', filename: '04_student_login.png', path: '/student/login', role: null },
  { category: '01_public', filename: '05_teacher_login.png', path: '/teacher/login', role: null },
  { category: '01_public', filename: '06_admin_login.png', path: '/admin/login', role: null },
  { category: '01_public', filename: '07_app_download.png', path: '/download', role: null },
  { category: '01_public', filename: '08_public_timetable.png', path: '/timetable', role: null },
  { category: '01_public', filename: '09_privacy_policy.png', path: '/privacy', role: null },

  // --- 02. STUDENT PORTAL ---
  { category: '02_student', filename: '10_student_dashboard.png', path: '/dashboard/student', role: 'student' },
  { category: '02_student', filename: '11_student_attendance.png', path: '/dashboard/student/attendance', role: 'student' },
  { category: '02_student', filename: '12_student_timetable.png', path: '/dashboard/student/timetable', role: 'student' },
  { category: '02_student', filename: '13_student_notes.png', path: '/dashboard/student/notes', role: 'student' },
  { category: '02_student', filename: '14_student_performance.png', path: '/dashboard/student/performance', role: 'student' },
  { category: '02_student', filename: '15_student_events.png', path: '/dashboard/student/events', role: 'student' },
  { category: '02_student', filename: '16_student_announcements.png', path: '/dashboard/student/announcements', role: 'student' },
  { category: '02_student', filename: '17_student_notifications.png', path: '/dashboard/student/notifications', role: 'student' },
  { category: '02_student', filename: '18_student_activity.png', path: '/dashboard/student/activity', role: 'student' },
  { category: '02_student', filename: '19_student_profile.png', path: '/dashboard/student/profile', role: 'student' },
  { category: '02_student', filename: '20_student_settings.png', path: '/dashboard/student/settings', role: 'student' },

  // --- 03. TEACHER PORTAL ---
  { category: '03_teacher', filename: '21_teacher_dashboard.png', path: '/dashboard/teacher', role: 'teacher' },
  { category: '03_teacher', filename: '22_teacher_attendance.png', path: '/dashboard/teacher/attendance', role: 'teacher' },
  { category: '03_teacher', filename: '23_teacher_timetable.png', path: '/dashboard/teacher/timetable', role: 'teacher' },
  { category: '03_teacher', filename: '24_teacher_students.png', path: '/dashboard/teacher/students', role: 'teacher' },
  { category: '03_teacher', filename: '25_teacher_notes.png', path: '/dashboard/teacher/notes', role: 'teacher' },
  { category: '03_teacher', filename: '26_teacher_leave.png', path: '/dashboard/teacher/leave', role: 'teacher' },
  { category: '03_teacher', filename: '27_teacher_performance.png', path: '/dashboard/teacher/performance', role: 'teacher' },
  { category: '03_teacher', filename: '28_teacher_events.png', path: '/dashboard/teacher/events', role: 'teacher' },
  { category: '03_teacher', filename: '29_teacher_announcements.png', path: '/dashboard/teacher/announcements', role: 'teacher' },
  { category: '03_teacher', filename: '30_teacher_notifications.png', path: '/dashboard/teacher/notifications', role: 'teacher' },
  { category: '03_teacher', filename: '31_teacher_activity.png', path: '/dashboard/teacher/activity', role: 'teacher' },
  { category: '03_teacher', filename: '32_teacher_profile.png', path: '/dashboard/teacher/profile', role: 'teacher' },
  { category: '03_teacher', filename: '33_teacher_settings.png', path: '/dashboard/teacher/settings', role: 'teacher' },

  // --- 04. ADMIN PORTAL ---
  { category: '04_admin', filename: '34_admin_dashboard.png', path: '/dashboard/admin', role: 'admin' },
  { category: '04_admin', filename: '35_admin_students.png', path: '/dashboard/admin/students', role: 'admin' },
  { category: '04_admin', filename: '36_admin_teachers.png', path: '/dashboard/admin/teachers', role: 'admin' },
  { category: '04_admin', filename: '37_admin_academic.png', path: '/dashboard/admin/academic', role: 'admin' },
  { category: '04_admin', filename: '38_admin_timetable.png', path: '/dashboard/admin/timetable', role: 'admin' },
  { category: '04_admin', filename: '39_admin_attendance.png', path: '/dashboard/admin/attendance', role: 'admin' },
  { category: '04_admin', filename: '40_admin_leave.png', path: '/dashboard/admin/leave', role: 'admin' },
  { category: '04_admin', filename: '41_admin_learning_center.png', path: '/dashboard/admin/learning-center', role: 'admin' },
  { category: '04_admin', filename: '42_admin_events.png', path: '/dashboard/admin/events', role: 'admin' },
  { category: '04_admin', filename: '43_admin_announcements.png', path: '/dashboard/admin/announcements', role: 'admin' },
  { category: '04_admin', filename: '44_admin_notifications.png', path: '/dashboard/admin/notifications', role: 'admin' },
  { category: '04_admin', filename: '45_admin_reports.png', path: '/dashboard/admin/reports', role: 'admin' },
  { category: '04_admin', filename: '46_admin_audit_logs.png', path: '/dashboard/admin/audit-logs', role: 'admin' },
  { category: '04_admin', filename: '47_admin_import.png', path: '/dashboard/admin/import', role: 'admin' },
  { category: '04_admin', filename: '48_admin_tasks.png', path: '/dashboard/admin/tasks', role: 'admin' },
  { category: '04_admin', filename: '49_admin_profile.png', path: '/dashboard/admin/profile', role: 'admin' },
  { category: '04_admin', filename: '50_admin_settings.png', path: '/dashboard/admin/settings', role: 'admin' },
];

async function captureScreen(page, screen) {
  const docsOutPath = path.join(DOCS_DIR, screen.category, screen.filename);
  const artifactCatPath = path.join(ARTIFACT_DIR, 'screenshots', screen.category, screen.filename);
  const artifactFlatPath = path.join(ARTIFACT_DIR, 'screenshots', screen.filename);

  // First navigate to / to prepare localStorage
  await page.goto('http://localhost:3001', { waitUntil: 'domcontentloaded', timeout: 60000 });

  if (screen.role) {
    const userObj = MOCK_USERS[screen.role];
    await page.evaluate((u) => {
      localStorage.setItem('cc_user', JSON.stringify(u));
      localStorage.setItem('cc_token', 'mock_jwt_token_for_presentation_showcase');
      localStorage.setItem('theme', 'light');
    }, userObj);
  } else {
    await page.evaluate(() => {
      localStorage.removeItem('cc_user');
      localStorage.removeItem('cc_token');
      localStorage.setItem('theme', 'light');
    });
  }

  // Navigate to target route
  await page.goto(`http://localhost:3001${screen.path}`, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  // Wait 2.5s for React hydration, CSS transitions, and charts to finish rendering
  await page.waitForTimeout(2500);

  await page.screenshot({ path: docsOutPath, fullPage: false, timeout: 30000 });
  
  fs.copyFileSync(docsOutPath, artifactCatPath);
  fs.copyFileSync(docsOutPath, artifactFlatPath);
}

async function captureAllScreenshots() {
  console.log('🚀 Starting screenshot capture engine for all 50 screens...');

  // Ensure directories exist
  const categories = ['01_public', '02_student', '03_teacher', '04_admin'];
  for (const cat of categories) {
    fs.mkdirSync(path.join(DOCS_DIR, cat), { recursive: true });
    fs.mkdirSync(path.join(ARTIFACT_DIR, 'screenshots', cat), { recursive: true });
  }
  fs.mkdirSync(path.join(ARTIFACT_DIR, 'screenshots'), { recursive: true });

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
  });

  const page = await context.newPage();

  let failedScreens = [];
  let count = 0;

  for (const screen of SCREENS) {
    count++;
    console.log(`[${count}/${SCREENS.length}] Capturing ${screen.category} -> ${screen.filename} (${screen.path})...`);

    try {
      await captureScreen(page, screen);
      console.log(`   ✅ Saved: ${screen.filename}`);
    } catch (err) {
      console.warn(`   ⚠️ Initial attempt failed for ${screen.filename}: ${err.message}. Queuing for retry...`);
      failedScreens.push(screen);
    }
  }

  // Retry loop for any failed screens
  if (failedScreens.length > 0) {
    console.log(`\n🔄 Retrying ${failedScreens.length} failed screen(s)...`);
    const stillFailed = [];
    for (const screen of failedScreens) {
      try {
        console.log(`   Retrying ${screen.filename} (${screen.path})...`);
        await captureScreen(page, screen);
        console.log(`   ✅ Successfully captured on retry: ${screen.filename}`);
      } catch (retryErr) {
        console.error(`   ❌ Failed retry for ${screen.filename}:`, retryErr.message);
        stillFailed.push(screen.filename);
      }
    }
    if (stillFailed.length > 0) {
      console.error(`\n⚠️ The following screens could not be captured: ${stillFailed.join(', ')}`);
    } else {
      console.log('\n🎉 All retry items succeeded!');
    }
  }

  await browser.close();
  console.log(`\n✨ Screen capture process complete!`);
}

captureAllScreenshots().catch(console.error);
