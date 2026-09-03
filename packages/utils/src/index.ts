import { CollegeId } from '@campus-connect/types';

export type ClassValue = string | number | boolean | undefined | null | { [key: string]: any } | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];
  
  for (const input of inputs) {
    if (!input) continue;
    
    if (typeof input === 'string' || typeof input === 'number') {
      classes.push(input.toString());
    } else if (Array.isArray(input)) {
      const resolved = cn(...input);
      if (resolved) classes.push(resolved);
    } else if (typeof input === 'object') {
      for (const [key, value] of Object.entries(input)) {
        if (value) classes.push(key);
      }
    }
  }
  
  return classes.join(' ');
}


export function getCollegeName(id: CollegeId): string {
  switch (id) {
    case 'college-a':
      return "Pushpalata Mhatre Women's College of Arts, Commerce & Science";
    case 'college-b':
      return 'Balasaheb Mhatre College of Science (Junior)';
    case 'college-c':
      return 'Balasaheb Mhatre College of Science (Senior)';
    default:
      return 'Unknown College';
  }
}

export function getCollegeColor(id: CollegeId): string {
  switch (id) {
    case 'college-a':
      return 'blue';
    case 'college-b':
      return 'purple';
    case 'college-c':
      return 'emerald';
    default:
      return 'gray';
  }
}

export function getCollegeLogo(id: CollegeId): string {
  switch (id) {
    case 'college-a':
      return '/logos/pmwc-logo.jpg';
    case 'college-b':
      return '/logos/bmjc-logo.jpg';
    case 'college-c':
      return '/logos/bmcs-logo.jpg';
    default:
      return '/logos/pmwc-logo.jpg';
  }
}

/**
 * Canonical Neon database UUIDs mapped to UI slugs and vice versa.
 */
export const COLLEGE_SLUG_TO_UUID: Record<string, string> = {
  'college-a': '6a304465-3698-4ce8-9574-1b3a8d92619b',
  'college-b': 'fcbc1af8-199f-43be-ac08-23ac0690d0a1',
  'college-c': '43d1299d-b1d5-4fa2-86f6-31a13e115df2',
};

export const COLLEGE_UUID_TO_SLUG: Record<string, CollegeId> = {
  '6a304465-3698-4ce8-9574-1b3a8d92619b': 'college-a',
  'fcbc1af8-199f-43be-ac08-23ac0690d0a1': 'college-b',
  '43d1299d-b1d5-4fa2-86f6-31a13e115df2': 'college-c',
};

export function getCollegeUuid(slugOrId?: string): string {
  if (!slugOrId) return COLLEGE_SLUG_TO_UUID['college-c'];
  const lower = slugOrId.toLowerCase().trim();
  return COLLEGE_SLUG_TO_UUID[lower] || slugOrId;
}

export function getCollegeSlug(uuidOrSlug?: string): CollegeId {
  if (!uuidOrSlug) return 'college-c';
  const lower = uuidOrSlug.toLowerCase().trim();
  if (lower === 'college-a' || lower === 'college-b' || lower === 'college-c') {
    return lower as CollegeId;
  }
  return COLLEGE_UUID_TO_SLUG[lower] || 'college-c';
}


export function formatDate(dateString: string): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

export function formatTime(timeString: string): string {
  // simple time parser e.g. "14:30" -> "2:30 PM"
  try {
    const [hours, minutes] = timeString.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH}:${minutes} ${ampm}`;
  } catch (e) {
    return timeString;
  }
}

export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}
