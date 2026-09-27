import { Course } from '@/types';

/**
 * Intelligently parses user course input to extract customizable course code and title.
 * Examples:
 *   "(ACC-101) Introduction to Accounting" -> { code: "ACC-101", name: "Introduction to Accounting" }
 *   "[CS-102] Data Structures"              -> { code: "CS-102",  name: "Data Structures" }
 *   "MKT-201: Principles of Marketing"     -> { code: "MKT-201", name: "Principles of Marketing" }
 *   "FIN-301 - Financial Analysis"          -> { code: "FIN-301", name: "Financial Analysis" }
 *   "ACC-101 Introduction to Accounting"   -> { code: "ACC-101", name: "Introduction to Accounting" }
 *   "Strategic Management"                  -> { code: "SM-101",  name: "Strategic Management" }
 */
export function parseCourseString(input: string): { code: string; name: string } {
  const raw = (input || '').trim();
  if (!raw) {
    return { code: 'CRS-101', name: 'New Course' };
  }

  // Pattern 1: (ACC-101) Introduction to Accounting or [ACC-101] Introduction to Accounting
  const parenMatch = raw.match(/^[(\[]\s*([A-Za-z0-9\s-]+?)\s*[)\]]\s*[:|-]?\s*(.+)$/);
  if (parenMatch) {
    return {
      code: parenMatch[1].trim().toUpperCase(),
      name: parenMatch[2].trim(),
    };
  }

  // Pattern 2: ACC-101: Introduction to Accounting or ACC-101 - Introduction to Accounting
  const splitMatch = raw.match(/^([A-Za-z0-9\s-]+?)[:|-]\s*(.+)$/);
  if (splitMatch) {
    return {
      code: splitMatch[1].trim().toUpperCase(),
      name: splitMatch[2].trim(),
    };
  }

  // Pattern 3: Prefix code followed by space and name, e.g. "ACC-101 Introduction to Accounting"
  const prefixMatch = raw.match(/^([A-Za-z]{2,5}\s*[-_]?\s*\d{2,4}[A-Za-z]?)\s+(.+)$/);
  if (prefixMatch) {
    return {
      code: prefixMatch[1].trim().replace(/\s+/g, '-').toUpperCase(),
      name: prefixMatch[2].trim(),
    };
  }

  // Pattern 4: Short standalone course code e.g. "ACC-101"
  if (raw.length <= 8 && !raw.includes(' ')) {
    return {
      code: raw.toUpperCase(),
      name: raw.toUpperCase(),
    };
  }

  // Pattern 5: Plain title without explicit code -> derive meaningful mnemonic code
  const words = raw
    .split(/[\s_-]+/)
    .filter((w) => !['and', '&', 'to', 'of', 'in', 'for', 'the', 'a', 'an'].includes(w.toLowerCase()));

  let prefix = 'CRS';
  if (words.length >= 2) {
    prefix = words.map((w) => w[0]).join('').slice(0, 4).toUpperCase();
  } else if (words.length === 1 && words[0].length >= 3) {
    prefix = words[0].slice(0, 3).toUpperCase();
  }

  return {
    code: `${prefix}-101`,
    name: raw,
  };
}

/**
 * Returns cleaned-up course code and course title for display on cards.
 * If title has "(CODE) Name", extracts the code and cleans the name to prevent duplicate display.
 */
export function getCleanCourseDisplay(course?: Partial<Course>): { code: string; name: string } {
  if (!course) {
    return { code: 'CRS-000', name: 'Class Session' };
  }

  let code = (course.code || '').trim();
  let name = (course.name || '').trim();

  // Only attempt to parse/extract code+name from the name string when no real code exists yet.
  // If a valid code is already stored (not blank and not a CRS-placeholder), trust it and
  // display the name exactly as stored — avoids mangling names that contain dashes or colons.
  const isMissingCode = !code || /^CRS-\d+$/i.test(code);

  if (isMissingCode) {
    // Try to extract code from name if it's in a pattern like "(ACC-101) Title" or "ACC-101: Title"
    const parenMatch = name.match(/^[(\[]\s*([A-Za-z0-9\s-]+?)\s*[)\]]\s*[:|-]?\s*(.+)$/);
    if (parenMatch) {
      code = parenMatch[1].trim().toUpperCase();
      name = parenMatch[2].trim();
    } else {
      const dashMatch = name.match(/^([A-Za-z0-9\s-]+?)[:|-]\s*(.+)$/);
      if (dashMatch && dashMatch[1].length <= 8) {
        code = dashMatch[1].trim().toUpperCase();
        name = dashMatch[2].trim();
      }
    }
  }

  return {
    code: code || 'CRS-101',
    name: name || code || 'Course',
  };
}


/**
 * Normalization helpers to reliably match user Excel inputs to database entities
 */
export function normalizeCode(str: string): string {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function normalizeName(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/^(dr|prof|engr|mr|ms|mrs)\.?\s+/i, '')
    .replace(/[^a-z0-9]/g, '');
}

export function normalizeEmail(str: string): string {
  return (str || '').toLowerCase().replace(/[^a-z0-9@]/g, '');
}

export function normalizeBatch(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/^(batch|sec|section)[\s_-]*/i, '')
    .replace(/[^a-z0-9]/g, '');
}

export function normalizeRoom(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/^(room|hall|lab|classroom)\s+/i, '')
    .replace(/[^a-z0-9]/g, '');
}
