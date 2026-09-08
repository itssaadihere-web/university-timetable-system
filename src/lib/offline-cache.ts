import { ClassSession, Room, Faculty, Batch, Course } from '@/types';

const CACHE_KEYS = {
  SESSIONS: 'utt_cached_sessions',
  ROOMS: 'utt_cached_rooms',
  FACULTY: 'utt_cached_faculty',
  BATCHES: 'utt_cached_batches',
  COURSES: 'utt_cached_courses',
  LAST_SYNC: 'utt_last_sync_time',
};

export interface CachedTimetableData {
  sessions: ClassSession[];
  rooms: Room[];
  faculty: Faculty[];
  batches: Batch[];
  courses: Course[];
  lastSync: string;
}

export function saveTimetableToCache(data: {
  sessions: ClassSession[];
  rooms: Room[];
  faculty: Faculty[];
  batches: Batch[];
  courses: Course[];
}): void {
  if (typeof window === 'undefined') return;
  try {
    // Only cache published sessions for viewers
    const publishedSessions = data.sessions.filter((s) => s.status === 'published');
    localStorage.setItem(CACHE_KEYS.SESSIONS, JSON.stringify(publishedSessions));
    localStorage.setItem(CACHE_KEYS.ROOMS, JSON.stringify(data.rooms));
    localStorage.setItem(CACHE_KEYS.FACULTY, JSON.stringify(data.faculty));
    localStorage.setItem(CACHE_KEYS.BATCHES, JSON.stringify(data.batches));
    localStorage.setItem(CACHE_KEYS.COURSES, JSON.stringify(data.courses));
    localStorage.setItem(CACHE_KEYS.LAST_SYNC, new Date().toISOString());
  } catch (err) {
    console.warn('Failed to cache timetable to localStorage:', err);
  }
}

export function loadTimetableFromCache(): CachedTimetableData | null {
  if (typeof window === 'undefined') return null;
  try {
    const rawSessions = localStorage.getItem(CACHE_KEYS.SESSIONS);
    if (!rawSessions) return null;

    return {
      sessions: JSON.parse(rawSessions),
      rooms: JSON.parse(localStorage.getItem(CACHE_KEYS.ROOMS) || '[]'),
      faculty: JSON.parse(localStorage.getItem(CACHE_KEYS.FACULTY) || '[]'),
      batches: JSON.parse(localStorage.getItem(CACHE_KEYS.BATCHES) || '[]'),
      courses: JSON.parse(localStorage.getItem(CACHE_KEYS.COURSES) || '[]'),
      lastSync: localStorage.getItem(CACHE_KEYS.LAST_SYNC) || '',
    };
  } catch (err) {
    console.warn('Failed to read timetable from localStorage:', err);
    return null;
  }
}
