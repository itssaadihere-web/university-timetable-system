import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ClassSession, Room, Faculty, Batch, Course } from '@/types';

import { TIMETABLE_DAYS, TIME_SLOTS_30MIN, formatTo12Hour } from '@/lib/conflict-engine';

const DAYS = TIMETABLE_DAYS.map((d) => d.name);

interface ExportDataParams {
  sessions: ClassSession[];
  rooms: Room[];
  faculty: Faculty[];
  batches: Batch[];
  courses: Course[];
  filterTitle: string;
}

/**
 * Generate Excel (.xlsx) workbook for the timetable and download directly in browser
 */
export function exportTimetableToExcel(params: ExportDataParams): void {
  const { sessions, rooms, faculty, batches, courses, filterTitle } = params;

  // 1. Detailed Session List Sheet
  const sessionRows = sessions.map((s) => {
    const course = courses.find((c) => c.id === s.course_id);
    const teacher = faculty.find((f) => f.id === s.faculty_id);
    const room = rooms.find((r) => r.id === s.room_id);
    const batch = batches.find((b) => b.id === s.batch_id);

    return {
      'Course Code': course?.code || 'N/A',
      'Course Title': course?.name || 'N/A',
      'Student Batch': batch?.name || 'N/A',
      'Faculty / Instructor': teacher?.name || 'N/A',
      'Room / Venue': room?.name || 'Unassigned',
      'Day': DAYS[s.day_of_week - 1] || `Day ${s.day_of_week}`,
      'Start Time': formatTo12Hour(s.start_time),
      'End Time': formatTo12Hour(s.end_time),
      'Session Type': s.session_type.toUpperCase(),
      'Status': s.status.toUpperCase(),
      'Specific Date': s.specific_date || 'Recurring',
    };
  });

  const wb = XLSX.utils.book_new();
  const wsDetailed = XLSX.utils.json_to_sheet(sessionRows);
  XLSX.utils.book_append_sheet(wb, wsDetailed, 'Class Sessions');

  // 2. Timetable Grid Sheet
  const gridData: Record<string, string>[] = TIME_SLOTS_30MIN.map((slot) => {
    const row: Record<string, string> = { 'Time Slot': slot.label };

    DAYS.forEach((dayName, idx) => {
      const dayNum = idx + 1;
      const matched = sessions.filter((s) => {
        return s.day_of_week === dayNum && s.start_time.startsWith(slot.start);
      });

      if (matched.length > 0) {
        row[dayName] = matched
          .map((s) => {
            const crs = courses.find((c) => c.id === s.course_id)?.code || 'Course';
            const rm = rooms.find((r) => r.id === s.room_id)?.name || 'Unassigned';
            const tch = faculty.find((f) => f.id === s.faculty_id)?.name || 'Faculty';
            const bth = batches.find((b) => b.id === s.batch_id)?.name || 'Batch';
            return `${crs} (${rm}) [${bth}] - ${tch}`;
          })
          .join(' | ');
      } else {
        row[dayName] = '-';
      }
    });

    return row;
  });

  const wsGrid = XLSX.utils.json_to_sheet(gridData);
  XLSX.utils.book_append_sheet(wb, wsGrid, 'Weekly Matrix');

  const filename = `Timetable_${filterTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Generate formatted PDF document and trigger browser download
 */
export function exportTimetableToPDF(params: ExportDataParams): void {
  const { sessions, rooms, faculty, batches, courses, filterTitle } = params;

  // Initialize PDF in landscape orientation for matrix readability
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Header Title
  doc.setFontSize(16);
  doc.setTextColor(200, 16, 46); // Salim Habib Crimson Red
  doc.text('FATIMA BUSINESS SCHOOL — SALIM HABIB UNIVERSITY', 14, 13);

  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('Faculty of Management Sciences • Faculty of Computer Science', 14, 19);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Schedule: ${filterTitle} | Generated on: ${new Date().toLocaleDateString()}`, 14, 25);

  // Prepare table columns and body
  const tableColumns = ['Time Slot', ...DAYS];

  const tableRows = TIME_SLOTS_30MIN.map((slot) => {
    const row = [slot.label];

    DAYS.forEach((_, idx) => {
      const dayNum = idx + 1;
      const matched = sessions.filter(
        (s) => s.day_of_week === dayNum && s.start_time.startsWith(slot.start)
      );

      if (matched.length > 0) {
        const text = matched
          .map((s) => {
            const crs = courses.find((c) => c.id === s.course_id)?.code || 'Course';
            const rm = rooms.find((r) => r.id === s.room_id)?.name || 'Unassigned';
            const bth = batches.find((b) => b.id === s.batch_id)?.name || '';
            return `${crs}\n${rm} | ${bth}`;
          })
          .join('\n---\n');
        row.push(text);
      } else {
        row.push('-');
      }
    });

    return row;
  });

  autoTable(doc, {
    head: [tableColumns],
    body: tableRows,
    startY: 29,
    theme: 'grid',
    headStyles: {
      fillColor: [200, 16, 46], // Salim Habib Crimson Red
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 1.5,
      valign: 'middle',
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 24 },
      1: { cellWidth: 34 },
      2: { cellWidth: 34 },
      3: { cellWidth: 34 },
      4: { cellWidth: 34 },
      5: { cellWidth: 34 },
      6: { cellWidth: 34 },
      7: { cellWidth: 34 },
    },
  });

  const filename = `Timetable_${filterTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
  doc.save(filename);
}
