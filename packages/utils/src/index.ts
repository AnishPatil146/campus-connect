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
      return "Pushpalata Women's College";
    case 'college-b':
      return 'Balasaheb Jr College';
    case 'college-c':
      return 'Balasaheb Sr College';
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
