import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ClassSession, Room, Faculty, Batch, Course } from '@/types';
import { 
  TIMETABLE_DAYS, 
  TIME_SLOTS_30MIN, 
  formatTo12Hour, 
  formatTimeRange, 
  calculateSlotSpan, 
  timeToMinutes 
} from '@/lib/conflict-engine';
import { getCourseColor } from '@/lib/course-colors';

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
 * Convert HEX color string to RGB tuple [r, g, b]
 */
function hexToRgb(hex: string): [number, number, number] {
  if (!hex) return [248, 250, 252];
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  if (clean.length >= 6) {
    const num = parseInt(clean.substring(0, 6), 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }
  return [248, 250, 252];
}

/**
 * Generate Excel (.xlsx) workbook for the timetable and download directly in browser
 */
export function exportTimetableToExcel(params: ExportDataParams): void {
  const { sessions, rooms, faculty, batches, courses, filterTitle } = params;

  const activeSessions = sessions.filter((s) => s.status !== 'cancelled');

  // 1. Detailed Session List Sheet
  const sessionRows = activeSessions.map((s, idx) => {
    const course = courses.find((c) => c.id === s.course_id);
    const teacher = faculty.find((f) => f.id === s.faculty_id);
    const room = rooms.find((r) => r.id === s.room_id);
    const batch = batches.find((b) => b.id === s.batch_id);
    const durationMins = timeToMinutes(s.end_time) - timeToMinutes(s.start_time);
    const durationHours = (durationMins / 60).toFixed(1);

    return {
      'S.No': idx + 1,
      'Day': DAYS[s.day_of_week - 1] || `Day ${s.day_of_week}`,
      'Time Slot': `${formatTo12Hour(s.start_time)} – ${formatTo12Hour(s.end_time)}`,
      'Duration': `${durationHours} hrs (${durationMins} mins)`,
      'Course Code': course?.code || 'N/A',
      'Course Title': course?.name || 'N/A',
      'Student Batch': batch?.name || 'N/A',
      'Faculty / Instructor': teacher?.name || 'N/A',
      'Room / Venue': room?.name || 'Unassigned',
      'Session Type': s.session_type.toUpperCase(),
      'Status': s.status.toUpperCase(),
      'Specific Date': s.specific_date || 'Recurring (Weekly)',
    };
  });

  const wb = XLSX.utils.book_new();
  const wsDetailed = XLSX.utils.json_to_sheet(sessionRows);
  XLSX.utils.book_append_sheet(wb, wsDetailed, 'Class Sessions');

  // 2. Timetable Grid Sheet with full duration ranges
  const gridData: Record<string, string>[] = TIME_SLOTS_30MIN.map((slot) => {
    const row: Record<string, string> = { 'Time Slot': slot.label };

    DAYS.forEach((dayName, idx) => {
      const dayNum = idx + 1;
      const slotStart = timeToMinutes(slot.start);
      const slotEnd = timeToMinutes(slot.end);

      const matched = activeSessions.filter((s) => {
        if (s.day_of_week !== dayNum) return false;
        const sStart = timeToMinutes(s.start_time);
        const sEnd = timeToMinutes(s.end_time);
        return slotStart < sEnd && slotEnd > sStart;
      });

      if (matched.length > 0) {
        row[dayName] = matched
          .map((s) => {
            const crs = courses.find((c) => c.id === s.course_id)?.code || 'Course';
            const rm = rooms.find((r) => r.id === s.room_id)?.name || 'Unassigned';
            const tch = faculty.find((f) => f.id === s.faculty_id)?.name || 'Faculty';
            const bth = batches.find((b) => b.id === s.batch_id)?.name || 'Batch';
            return `${crs} [${formatTo12Hour(s.start_time)}-${formatTo12Hour(s.end_time)}] (${rm}) [${bth}] - ${tch}`;
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
 * Generate formatted PDF document with duration-equivalent row spanning and high-end institutional UI
 */
export function exportTimetableToPDF(params: ExportDataParams): void {
  const { sessions, rooms, faculty, batches, courses, filterTitle } = params;

  const activeSessions = sessions.filter((s) => s.status !== 'cancelled');

  // Calculate high-level metrics
  const totalMinutes = activeSessions.reduce((acc, s) => {
    return acc + (timeToMinutes(s.end_time) - timeToMinutes(s.start_time));
  }, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  // Initialize PDF in landscape A4 orientation (297mm x 210mm)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 210mm

  // ==========================================
  // PAGE 1: DURATION-EQUIVALENT WEEKLY MATRIX
  // ==========================================

  // Institutional Top Bar & Branding
  doc.setFillColor(200, 16, 46); // SHU Crimson Red
  doc.rect(14, 10, 4, 18, 'F');

  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text('FATIMA BUSINESS SCHOOL', 22, 16);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(200, 16, 46);
  doc.text('SALIM HABIB UNIVERSITY', 104, 16);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text('Faculty of Management Sciences • Official Timetable Portal', 22, 22);

  // Top Metadata Badges (Right side)
  doc.setFillColor(241, 245, 249); // Slate 100
  doc.roundedRect(pageWidth - 95, 10, 81, 16, 2, 2, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`Schedule: ${filterTitle}`, pageWidth - 92, 15);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Total: ${activeSessions.length} Sessions  |  ${totalHours} hrs/week`, pageWidth - 92, 20);
  doc.text(`Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, pageWidth - 92, 24);

  // Thin separator rule
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(14, 30, pageWidth - 14, 30);

  // Build the 2D Matrix with accurate rowSpan
  const tableColumns = ['Time Slot', ...DAYS];

  // Track active row spans for each day (1 to 7) to skip spanned cells in subsequent rows
  const coveredUntilSlot: Record<number, number> = {
    1: -1, 2: -1, 3: -1, 4: -1, 5: -1, 6: -1, 7: -1,
  };

  const matrixBody: any[] = [];

  for (let slotIdx = 0; slotIdx < TIME_SLOTS_30MIN.length; slotIdx++) {
    const slot = TIME_SLOTS_30MIN[slotIdx];
    const row: any[] = [];

    // Col 0: Time Slot Label
    row.push({
      content: `${slot.start12}\n${slot.end12}`,
      styles: {
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
        fontSize: 6.5,
        fillColor: [248, 250, 252],
        textColor: [51, 65, 85],
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
      },
    });

    // Days 1 through 7 (Mon to Sun)
    for (let dayNum = 1; dayNum <= 7; dayNum++) {
      // If this day is covered by an active rowSpan from an earlier slot, skip it
      if (slotIdx <= coveredUntilSlot[dayNum]) {
        continue;
      }

      // Find sessions starting at this exact time slot
      const startingSessions = activeSessions.filter((s) => {
        if (s.day_of_week !== dayNum) return false;
        const spanInfo = calculateSlotSpan(s.start_time, s.end_time);
        return spanInfo.slotIndex === slotIdx;
      });

      if (startingSessions.length > 0) {
        // Multi-hour session spanning across slots
        const primarySession = startingSessions[0];
        const spanInfo = calculateSlotSpan(primarySession.start_time, primarySession.end_time);
        const spanBoxes = Math.max(1, spanInfo.rowSpan || spanInfo.boxesCount);

        // Mark column covered until slotIdx + spanBoxes - 1
        coveredUntilSlot[dayNum] = slotIdx + spanBoxes - 1;

        // Build rich formatted text content for the session
        const cellBlocks = startingSessions.map((s) => {
          const crs = courses.find((c) => c.id === s.course_id);
          const rm = rooms.find((r) => r.id === s.room_id);
          const tch = faculty.find((f) => f.id === s.faculty_id);
          const bth = batches.find((b) => b.id === s.batch_id);

          const code = crs?.code || 'CRS';
          const name = crs?.name || 'Class Session';
          const durationMins = timeToMinutes(s.end_time) - timeToMinutes(s.start_time);
          const durationStr = durationMins % 60 === 0 ? `${durationMins / 60}h` : `${durationMins}m`;
          const timeRange = `${formatTo12Hour(s.start_time)} - ${formatTo12Hour(s.end_time)}`;
          const roomStr = rm?.name ? rm.name : 'Room Pending';
          const teacherStr = tch?.name ? tch.name : '';
          const batchStr = bth?.name ? bth.name : '';

          if (spanBoxes <= 2) {
            // Compact view for short classes (30m or 60m)
            return `[${code}] (${durationStr})\n${name}\n${roomStr}${teacherStr ? ` • ${teacherStr}` : ''}`;
          }

          // Full rich view for standard classes (1.5h - 3h)
          return `[${code}] (${durationStr})\n${name}\n${timeRange}\n${teacherStr ? `${teacherStr}\n` : ''}${roomStr}${batchStr ? ` | ${batchStr}` : ''}`;
        });

        const cellText = cellBlocks.join('\n------------------------\n');

        // Course pastel palette
        const palette = getCourseColor(
          courses.find((c) => c.id === primarySession.course_id)?.code,
          primarySession.course_id || primarySession.id
        );
        const bgRgb = hexToRgb(palette.bgHex);
        const borderRgb = hexToRgb(palette.leftBarHex || palette.borderHex);

        row.push({
          content: cellText,
          rowSpan: spanBoxes,
          styles: {
            fillColor: bgRgb,
            textColor: [15, 23, 42],
            fontStyle: 'bold',
            fontSize: spanBoxes >= 4 ? 7.2 : spanBoxes >= 2 ? 6.5 : 5.8,
            lineColor: borderRgb,
            lineWidth: 0.35,
            valign: 'middle',
            halign: 'center',
            cellPadding: spanBoxes >= 3 ? 2 : 1,
          },
        });
      } else {
        // Empty slot
        row.push({
          content: '',
          rowSpan: 1,
          styles: {
            fillColor: [255, 255, 255],
            textColor: [203, 213, 225],
            lineColor: [235, 240, 245],
            lineWidth: 0.15,
            valign: 'middle',
            halign: 'center',
          },
        });
      }
    }

    matrixBody.push(row);
  }

  // Draw Matrix Table
  autoTable(doc, {
    head: [tableColumns],
    body: matrixBody,
    startY: 33,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    headStyles: {
      fillColor: [200, 16, 46], // Salim Habib Crimson Red
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center',
      valign: 'middle',
      cellPadding: 2,
    },
    styles: {
      overflow: 'linebreak',
      cellPadding: 1.5,
      valign: 'middle',
    },
    columnStyles: {
      0: { cellWidth: 22, fontStyle: 'bold' },
      1: { cellWidth: 35.5 },
      2: { cellWidth: 35.5 },
      3: { cellWidth: 35.5 },
      4: { cellWidth: 35.5 },
      5: { cellWidth: 35.5 },
      6: { cellWidth: 35.5 },
      7: { cellWidth: 35.5 },
    },
    didDrawPage: (data) => {
      // Bottom Institutional Footer
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.text(
        'Salim Habib University • Fatima Business School — Centralized Academic Timetable Portal',
        14,
        pageHeight - 8
      );
      doc.text(
        `Page ${doc.getNumberOfPages()} • Official Schedule Matrix`,
        pageWidth - 55,
        pageHeight - 8
      );
    },
  });

  // ==========================================
  // PAGE 2: DETAILED SESSION ROSTER & DIRECTORY
  // ==========================================
  if (activeSessions.length > 0) {
    doc.addPage('a4', 'landscape');

    // Page 2 Header
    doc.setFillColor(200, 16, 46);
    doc.rect(14, 10, 4, 16, 'F');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('SCHEDULE ROSTER & COURSE DIRECTORY', 22, 16);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Complete class list and venue allocations for ${filterTitle}`, 22, 22);

    // Sort sessions chronologically (Day -> Start Time)
    const sortedSessions = [...activeSessions].sort((a, b) => {
      if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
      return timeToMinutes(a.start_time) - timeToMinutes(b.start_time);
    });

    const rosterColumns = [
      '#',
      'Day',
      'Time Slot',
      'Duration',
      'Code',
      'Course Title',
      'Faculty / Instructor',
      'Room / Venue',
      'Batch',
      'Type',
    ];

    const rosterRows = sortedSessions.map((s, idx) => {
      const crs = courses.find((c) => c.id === s.course_id);
      const rm = rooms.find((r) => r.id === s.room_id);
      const tch = faculty.find((f) => f.id === s.faculty_id);
      const bth = batches.find((b) => b.id === s.batch_id);
      const durationMins = timeToMinutes(s.end_time) - timeToMinutes(s.start_time);
      const durationHours = (durationMins / 60).toFixed(1);

      return [
        idx + 1,
        DAYS[s.day_of_week - 1] || `Day ${s.day_of_week}`,
        `${formatTo12Hour(s.start_time)} – ${formatTo12Hour(s.end_time)}`,
        `${durationHours}h (${durationMins}m)`,
        crs?.code || 'N/A',
        crs?.name || 'N/A',
        tch?.name || 'N/A',
        rm?.name || 'Unassigned',
        bth?.name || 'N/A',
        s.session_type.toUpperCase(),
      ];
    });

    autoTable(doc, {
      head: [rosterColumns],
      body: rosterRows,
      startY: 28,
      margin: { left: 14, right: 14 },
      theme: 'striped',
      headStyles: {
        fillColor: [15, 23, 42], // Deep Slate 900
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
        valign: 'middle',
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        valign: 'middle',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10, fontStyle: 'bold' },
        1: { halign: 'center', cellWidth: 22, fontStyle: 'bold' },
        2: { halign: 'center', cellWidth: 32 },
        3: { halign: 'center', cellWidth: 20 },
        4: { halign: 'center', cellWidth: 20, fontStyle: 'bold', textColor: [200, 16, 46] },
        5: { cellWidth: 55, fontStyle: 'bold' },
        6: { cellWidth: 40 },
        7: { cellWidth: 35 },
        8: { cellWidth: 22 },
        9: { halign: 'center', cellWidth: 14 },
      },
      didDrawPage: (data) => {
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text(
          'Salim Habib University • Fatima Business School — Centralized Academic Timetable Portal',
          14,
          pageHeight - 8
        );
        doc.text(
          `Page ${doc.getNumberOfPages()} • Official Class Directory`,
          pageWidth - 55,
          pageHeight - 8
        );
      },
    });
  }

  const filename = `Timetable_${filterTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
