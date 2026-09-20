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

  // If code is a system placeholder (like "CRS-5100" or empty) and name contains the actual code in parentheses/brackets:
  const parenMatch = name.match(/^[(\[]\s*([A-Za-z0-9\s-]+?)\s*[)\]]\s*[:|-]?\s*(.+)$/);
  if (parenMatch) {
    // If current code is an automated placeholder or blank, adopt the user's explicit code from the title
    if (!code || /^CRS-\d+$/i.test(code)) {
      code = parenMatch[1].trim().toUpperCase();
    }
    // Clean name so it doesn't duplicate the code in parentheses
    name = parenMatch[2].trim();
  } else {
    const dashMatch = name.match(/^([A-Za-z0-9\s-]+?)[:|-]\s*(.+)$/);
    if (dashMatch && dashMatch[1].length <= 8) {
      if (!code || /^CRS-\d+$/i.test(code)) {
        code = dashMatch[1].trim().toUpperCase();
      }
      name = dashMatch[2].trim();
    }
  }

  return {
    code: code || 'CRS-101',
    name: name || 'Course',
  };
}
