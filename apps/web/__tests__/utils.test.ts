/**
 * Utility Function Tests
 * Covers: attendance % calculator, date formatter, role permission checker
 */

// --- Attendance Percentage Calculator -----------------------------------------

function calculateAttendancePercentage(present: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((present / total) * 10000) / 100;
}

describe('calculateAttendancePercentage', () => {
  it('should return 100 when all lectures attended', () => {
    expect(calculateAttendancePercentage(30, 30)).toBe(100);
  });

  it('should return 0 when no lectures attended', () => {
    expect(calculateAttendancePercentage(0, 30)).toBe(0);
  });

  it('should return 0 when total is 0 (no division by zero)', () => {
    expect(calculateAttendancePercentage(0, 0)).toBe(0);
  });

  it('should correctly calculate 75%', () => {
    expect(calculateAttendancePercentage(75, 100)).toBe(75);
  });

  it('should correctly calculate non-whole percentage', () => {
    expect(calculateAttendancePercentage(22, 30)).toBeCloseTo(73.33, 1);
  });
});

// --- Date Formatter ----------------------------------------------------------

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

describe('formatDate', () => {
  it('should format a date string to readable format', () => {
    const result = formatDate('2024-01-15');
    expect(result).toContain('Jan');
    expect(result).toContain('2024');
  });

  it('should handle end-of-year dates', () => {
    const result = formatDate('2024-12-31');
    expect(result).toContain('Dec');
    expect(result).toContain('2024');
  });
});

// --- Role Permission Checker --------------------------------------------------

type Role = 'ADMIN' | 'TEACHER' | 'STUDENT';

function hasPermission(role: Role, action: string): boolean {
  const permissions: Record<Role, string[]> = {
    ADMIN: ['create:student', 'delete:student', 'view:reports', 'manage:college'],
    TEACHER: ['create:attendance', 'view:students', 'upload:notes', 'create:assignment'],
    STUDENT: ['view:timetable', 'view:notes', 'submit:assignment', 'view:attendance'],
  };
  return permissions[role]?.includes(action) ?? false;
}

describe('hasPermission', () => {
  it('ADMIN should be able to create:student', () => {
    expect(hasPermission('ADMIN', 'create:student')).toBe(true);
  });

  it('STUDENT should NOT be able to delete:student', () => {
    expect(hasPermission('STUDENT', 'delete:student')).toBe(false);
  });

  it('TEACHER should be able to create:attendance', () => {
    expect(hasPermission('TEACHER', 'create:attendance')).toBe(true);
  });

  it('TEACHER should NOT be able to manage:college', () => {
    expect(hasPermission('TEACHER', 'manage:college')).toBe(false);
  });

  it('STUDENT should be able to submit:assignment', () => {
    expect(hasPermission('STUDENT', 'submit:assignment')).toBe(true);
  });

  it('ADMIN should have access to view:reports', () => {
    expect(hasPermission('ADMIN', 'view:reports')).toBe(true);
  });
});
