import { Batch } from '@/types';
import { SearchableOption } from '@/components/timetable/SearchableSelect';

/**
 * Returns a human-friendly, concise degree program label.
 * e.g. "Bachelor of Science in Accounting & Finance" -> "BS Accounting & Finance"
 */
export function getCleanProgramName(program?: string, programCode?: string): string {
  const p = (program || '').trim();
  const code = (programCode || '').toUpperCase().trim();

  if (p.toLowerCase().includes('accounting') || p.toLowerCase().includes('finance') || code === 'BAC') {
    return 'BS Accounting & Finance';
  }
  if (p.toLowerCase().includes('analytic') || code === 'BAN') {
    return 'BS Business Analytics';
  }
  if (p.toLowerCase().includes('business admin') || code === 'BBA') {
    return 'BBA';
  }
  if (p.toLowerCase().includes('fintech') || code === 'FIN') {
    return 'BS Fintech';
  }
  if (p.toLowerCase().includes('supply chain') || code === 'SCM') {
    return 'BS Supply Chain';
  }

  if (p) {
    return p
      .replace(/^Bachelor of Science in\s*/i, 'BS ')
      .replace(/^Bachelor of Business Administration/i, 'BBA')
      .replace(/^Bachelor of\s*/i, '')
      .trim();
  }

  return code || 'Undergraduate Program';
}

/**
 * Extracts a clean batch / cohort number and section.
 * e.g. "Batch-1A-BAC" -> "Batch 1A"
 * e.g. "Batch-1B-BAN" -> "Batch 1B"
 * e.g. "BBA - 2" -> "Batch 2"
 * e.g. "BS(AF) - 4" -> "Batch 4"
 */
export function getCleanBatchNumber(name: string, section?: string): string {
  if (!name) return 'Batch';

  const trimmed = name.trim();

  // Pattern 1: Batch-1A-BAC or Batch-1A or Batch 1 A
  const matchBatch = trimmed.match(/^batch[-_\s]*(\d+)\s*([a-zA-Z]?)/i);
  if (matchBatch) {
    const num = matchBatch[1];
    const sec = matchBatch[2] ? matchBatch[2].toUpperCase() : (section ? section.toUpperCase() : '');
    return `Batch ${num}${sec}`;
  }

  // Pattern 2: BBA - 2 or BS(AF) - 4
  const matchProgramBatch = trimmed.match(/^(?:[a-zA-Z()]+)[-_\s]+(\d+)\s*([a-zA-Z]?)$/i);
  if (matchProgramBatch) {
    const num = matchProgramBatch[1];
    const sec = matchProgramBatch[2] ? matchProgramBatch[2].toUpperCase() : (section ? section.toUpperCase() : '');
    return `Batch ${num}${sec}`;
  }

  // Pattern 3: 1A or 1-A or 2B
  const matchDirect = trimmed.match(/^(\d+)[-_\s]*([a-zA-Z])$/);
  if (matchDirect) {
    return `Batch ${matchDirect[1]}${matchDirect[2].toUpperCase()}`;
  }

  // If already clean like "Batch 1A"
  if (/^batch\s+\d+[a-zA-Z]?$/i.test(trimmed)) {
    return trimmed.replace(/^batch\s+/i, 'Batch ');
  }

  // Fallback: replace hyphens/underscores with space
  return trimmed.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ');
}

/**
 * Returns clean semester label e.g. "Sem 1", "Sem 2"
 */
export function getCleanSemesterLabel(semester?: number, name?: string): string {
  if (semester && semester > 0) {
    return `Sem ${semester}`;
  }
  if (name) {
    const numMatch = name.match(/(\d+)/);
    if (numMatch) return `Sem ${numMatch[1]}`;
  }
  return 'Sem 1';
}

export interface CleanBatchDisplay {
  batchNumber: string;       // e.g. "Batch 1A"
  semesterLabel: string;     // e.g. "Sem 1"
  programLabel: string;      // e.g. "BS Accounting & Finance"
  programCode: string;       // e.g. "BAC"
  displayTitle: string;      // e.g. "Sem 1 • Batch 1A • BS Accounting & Finance"
  shortDisplay: string;      // e.g. "Batch 1A (Sem 1)"
  badgeText: string;         // e.g. "BAC" or "Irregular"
  badgeColor: 'emerald' | 'purple' | 'blue' | 'amber' | 'indigo';
}

export function formatCleanBatch(batch: Partial<Batch>): CleanBatchDisplay {
  const name = batch.name || '';
  const code = batch.program_code || (name.includes('BAN') ? 'BAN' : name.includes('BBA') ? 'BBA' : name.includes('BAC') ? 'BAC' : name.includes('FIN') ? 'FIN' : name.includes('SCM') ? 'SCM' : '');
  const cleanProgram = getCleanProgramName(batch.program, code);
  const cleanBatchNum = getCleanBatchNumber(name, batch.section);
  const cleanSem = getCleanSemesterLabel(batch.semester, name);

  let badgeColor: CleanBatchDisplay['badgeColor'] = 'indigo';
  if (batch.is_irregular) {
    badgeColor = 'amber';
  } else if (code === 'BAC') {
    badgeColor = 'emerald';
  } else if (code === 'BAN') {
    badgeColor = 'purple';
  } else if (code === 'BBA') {
    badgeColor = 'blue';
  } else if (code === 'FIN') {
    badgeColor = 'indigo';
  } else if (code === 'SCM') {
    badgeColor = 'amber';
  }

  // Display Title format: Semester / Batch Number & Program
  // e.g. "Sem 1 • Batch 1A • BS Accounting & Finance"
  const displayTitle = `${cleanSem} • ${cleanBatchNum} • ${cleanProgram}`;
  const shortDisplay = `${cleanBatchNum} (${cleanSem})`;

  return {
    batchNumber: cleanBatchNum,
    semesterLabel: cleanSem,
    programLabel: cleanProgram,
    programCode: code,
    displayTitle,
    shortDisplay,
    badgeText: batch.is_irregular ? 'Irregular' : (code || cleanSem),
    badgeColor,
  };
}

/**
 * Creates a clean SearchableOption for a Batch, cleanly showing
 * Semester / Batch number & Program without clutter or truncation.
 */
export function createBatchSearchableOption(batch: Batch): SearchableOption {
  const clean = formatCleanBatch(batch);
  const studentCount = batch.student_count || 0;
  const sectionText = batch.section ? `Section ${batch.section.toUpperCase()}` : '';
  const subtitleParts = [
    `${studentCount} student${studentCount === 1 ? '' : 's'}`,
    sectionText,
    batch.is_irregular ? 'Irregular Cohort' : ''
  ].filter(Boolean);

  return {
    id: batch.id,
    title: clean.displayTitle, // "Sem 1 • Batch 1A • BS Accounting & Finance"
    subtitle: subtitleParts.join(' • '), // "45 students • Section A"
    badge: clean.badgeText,
    badgeColor: clean.badgeColor,
    hideSubtitleInTrigger: true, // Don't cram subtitle into the closed select button
    selectedTitle: clean.displayTitle,
    searchTerms: `${batch.name} ${clean.batchNumber} ${clean.displayTitle} ${clean.programLabel} ${batch.program || ''} ${clean.programCode} ${clean.semesterLabel} sem-${batch.semester} ${batch.section || ''}`,
  };
}
