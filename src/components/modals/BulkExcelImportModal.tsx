'use client';

import React, { useState, useRef } from 'react';
import { useTimetable } from '@/context/TimetableContext';
import * as XLSX from 'xlsx';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Table, 
  Trash2, 
  Layers, 
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';
import { generateUUID, isValidUUID } from '@/lib/uuid';

export type ImportEntityType = 'rooms' | 'faculty' | 'batches' | 'courses' | 'sessions' | 'students';

interface BulkExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BulkExcelImportModal: React.FC<BulkExcelImportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { bulkImportEntities, activeSemester, batches, courses, faculty, rooms } = useTimetable();

  const [importType, setImportType] = useState<ImportEntityType>('students');
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // --------------------------------------------------------------------------
  // TEMPLATES DEFINITIONS FOR EXCEL EXPORT
  // --------------------------------------------------------------------------
  const getTemplateDefinition = (type: ImportEntityType) => {
    switch (type) {
      case 'rooms':
        return {
          filename: 'SHU_Rooms_Venues_Template.xlsx',
          description: 'Classrooms, lecture halls, and laboratory venues with capability tags and capacities.',
          columns: ['name', 'building', 'floor', 'capacity', 'room_types'],
          sampleData: [
            {
              name: 'Hall 305',
              building: 'Academic Block B',
              floor: 3,
              capacity: 60,
              room_types: 'standard, multimedia',
            },
            {
              name: 'Lab 402',
              building: 'Computing Center',
              floor: 4,
              capacity: 45,
              room_types: 'computer_lab, multimedia',
            },
            {
              name: 'Horseshoe 201',
              building: 'Executive Wing',
              floor: 2,
              capacity: 75,
              room_types: 'horseshoe, multimedia, interactive_lcd',
            },
          ],
        };
      case 'faculty':
        return {
          filename: 'SHU_Faculty_Members_Template.xlsx',
          description: 'Faculty instructors with email, department, and maximum daily teaching load limit.',
          columns: ['name', 'email', 'department', 'max_load_per_day'],
          sampleData: [
            {
              name: 'Dr. Asif Shamim',
              email: 'asif.shamim@shu.edu.pk',
              department: 'Management Sciences',
              max_load_per_day: 4,
            },
            {
              name: 'Prof. Sarah Khan',
              email: 'sarah.khan@shu.edu.pk',
              department: 'Finance',
              max_load_per_day: 3,
            },
            {
              name: 'Engr. Bilal Ahmed',
              email: 'bilal.ahmed@shu.edu.pk',
              department: 'Computer Science',
              max_load_per_day: 4,
            },
          ],
        };
      case 'batches':
        return {
          filename: 'SHU_Student_Batches_Template.xlsx',
          description: 'Student batch cohorts and sections across degree programs.',
          columns: ['name', 'program', 'semester', 'student_count', 'is_irregular'],
          sampleData: [
            {
              name: 'BBA - 2',
              program: 'BBA',
              semester: 2,
              student_count: 45,
              is_irregular: false,
            },
            {
              name: 'BS(AF) - 4',
              program: 'BS Accounting & Finance',
              semester: 4,
              student_count: 38,
              is_irregular: false,
            },
            {
              name: 'BAN - 6',
              program: 'BS Business Analytics',
              semester: 6,
              student_count: 35,
              is_irregular: false,
            },
          ],
        };
      case 'courses':
        return {
          filename: 'SHU_Courses_Catalog_Template.xlsx',
          description: 'Academic course catalog with department, credit hours, and required classroom equipment.',
          columns: ['code', 'name', 'department', 'credit_hours', 'required_room_types'],
          sampleData: [
            {
              code: 'MKT-101',
              name: 'Principles of Marketing',
              department: 'Marketing',
              credit_hours: 3,
              required_room_types: 'standard, multimedia',
            },
            {
              code: 'FIN-302',
              name: 'Financial Modeling & Analysis',
              department: 'Finance',
              credit_hours: 3,
              required_room_types: 'computer_lab, multimedia',
            },
            {
              code: 'MGT-401',
              name: 'Strategic Management',
              department: 'Management Sciences',
              credit_hours: 3,
              required_room_types: 'horseshoe, multimedia',
            },
          ],
        };
      case 'students':
        return {
          filename: 'SHU_Student_Roster_List_Template.xlsx',
          description: 'Official student admission roster with Institution, Student ID, Name, Campus ID, Email, Phone, Status, and Program Descr.',
          columns: ['Institution', 'ID', 'Name', 'Campus ID', 'Email', 'Phone', 'Status', 'Descr', 'Batch Name'],
          sampleData: [
            {
              Institution: 'BHUNV',
              ID: 'F26BAC001',
              Name: 'Muhammad Saad',
              'Campus ID': '35374',
              Email: 'saadsajid1520@gmail.com',
              Phone: '923362336749',
              Status: 'Active in Program',
              Descr: 'Bachelor of Science in Accounting & Finance',
              'Batch Name': 'Batch-1A-BAC',
            },
            {
              Institution: 'BHUNV',
              ID: 'F26BAN001',
              Name: 'Ansharah Shazim',
              'Campus ID': '40728',
              Email: 'ansharahshazim@gmail.com',
              Phone: '923198494668',
              Status: 'Active in Program',
              Descr: 'BS Business Analytics',
              'Batch Name': 'Batch-1B-BAN',
            },
            {
              Institution: 'BHUNV',
              ID: 'F26BBA049',
              Name: 'Naima Yousuf',
              'Campus ID': '41336',
              Email: 'naimakhan2265@gmail.com',
              Phone: '923423040585',
              Status: 'Active in Program',
              Descr: 'Bachelor of Business Administration',
              'Batch Name': 'Batch-1B-BBA',
            },
          ],
        };
      case 'sessions':
        return {
          filename: 'SHU_Master_Timetable_Schedule_Template.xlsx',
          description: 'Bulk master timetable schedule assigning course, faculty, batch, room, day, and time slots.',
          columns: ['batch_name', 'course_code', 'faculty_name_or_email', 'room_name', 'day_of_week', 'start_time', 'end_time', 'status'],
          sampleData: [
            {
              batch_name: 'BBA - 2',
              course_code: 'MKT-101',
              faculty_name_or_email: 'asif.shamim@shu.edu.pk',
              room_name: 'Hall 305',
              day_of_week: 'Monday',
              start_time: '08:30',
              end_time: '11:30',
              status: 'published',
            },
            {
              batch_name: 'BS(AF) - 4',
              course_code: 'FIN-302',
              faculty_name_or_email: 'sarah.khan@shu.edu.pk',
              room_name: 'Lab 402',
              day_of_week: 'Tuesday',
              start_time: '12:00',
              end_time: '15:00',
              status: 'published',
            },
          ],
        };
    }
  };

  // --------------------------------------------------------------------------
  // DOWNLOAD EXCEL TEMPLATE (.XLSX)
  // --------------------------------------------------------------------------
  const handleDownloadTemplate = () => {
    try {
      const template = getTemplateDefinition(importType);
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(template.sampleData);

      // Auto calculate column widths
      const colWidths = template.columns.map((col) => ({
        wch: Math.max(col.length + 6, 20),
      }));
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, 'Template');
      XLSX.writeFile(wb, template.filename);
    } catch (err: any) {
      setErrorMsg(`Failed to generate template: ${err?.message}`);
    }
  };

  // --------------------------------------------------------------------------
  // PARSE EXCEL FILE (.XLSX / .XLS / .CSV)
  // --------------------------------------------------------------------------
  const processUploadedFile = async (uploadedFile: File) => {
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessCount(null);

    try {
      setFile(uploadedFile);
      setFileName(uploadedFile.name);

      const arrayBuffer = await uploadedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('The uploaded Excel file contains no worksheets.');
      }

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (!rawJson || rawJson.length === 0) {
        throw new Error('The worksheet is empty. Please fill data below the header row.');
      }

      // Extract headers from first object
      const sheetHeaders = Object.keys(rawJson[0]);
      setHeaders(sheetHeaders);

      // Normalize row values based on entity type
      const normalized = normalizeDataRows(importType, rawJson, sheetHeaders);
      setParsedRows(normalized);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to read Excel file. Please ensure it is a valid .xlsx or .xls file.');
      setParsedRows([]);
      setFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // DATA NORMALIZER
  // --------------------------------------------------------------------------
  const normalizeDataRows = (type: ImportEntityType, rawData: any[], fileHeaders: string[] = []): any[] => {
    return rawData.map((row, index) => {
      // Create clean lowercased lookup
      const keys = Object.keys(row);
      const getVal = (...fieldNames: string[]) => {
        for (const f of fieldNames) {
          const matchKey = keys.find((k) => k.toLowerCase().replace(/[\s_-]+/g, '') === f.toLowerCase().replace(/[\s_-]+/g, ''));
          if (matchKey && row[matchKey] !== undefined && row[matchKey] !== '') {
            return String(row[matchKey]).trim();
          }
        }
        return '';
      };

      const rawId = getVal('id');
      const id = isValidUUID(rawId) ? rawId : generateUUID();

      if (type === 'rooms') {
        const rawTypes = getVal('room_types', 'roomtypes', 'types', 'capabilities', 'tags');
        const room_types = rawTypes
          ? rawTypes.split(/[,;]+/).map((t) => t.trim().toLowerCase().replace(/\s+/g, '_')).filter(Boolean)
          : ['standard'];
        const roomName = getVal('name', 'roomname', 'room', 'room_name') || `Room ${index + 1}`;
        const existingRoom = rooms.find(
          (r) => r.name.trim().toLowerCase() === roomName.trim().toLowerCase() || (isValidUUID(rawId) && r.id === rawId)
        );
        const resolvedId = existingRoom ? existingRoom.id : id;

        return {
          id: resolvedId,
          name: roomName,
          building: getVal('building', 'block', 'wing') || 'Main Campus',
          floor: parseInt(getVal('floor'), 10) || 1,
          capacity: parseInt(getVal('capacity', 'seats'), 10) || 40,
          room_types: room_types.length > 0 ? room_types : ['standard'],
          is_active: true,
        };
      }

      if (type === 'faculty') {
        const facName = getVal('name', 'facultyname', 'faculty_name', 'instructor', 'teacher') || `Faculty ${index + 1}`;
        const facEmail = getVal('email', 'facultyemail', 'faculty_email') || `faculty.${index + 1}@univ.edu`;
        const existingFac = faculty.find(
          (f) => f.email.trim().toLowerCase() === facEmail.trim().toLowerCase() || (isValidUUID(rawId) && f.id === rawId)
        );
        const resolvedId = existingFac ? existingFac.id : id;

        return {
          id: resolvedId,
          name: facName,
          email: facEmail,
          department: getVal('department', 'dept', 'faculty_department') || 'Faculty of Management Sciences',
          max_load_per_day: parseInt(getVal('max_load_per_day', 'maxload', 'dailyhours'), 10) || 4,
          is_active: true,
        };
      }

      if (type === 'batches') {
        const rawIrreg = getVal('is_irregular', 'irregular', 'is_irreg').toLowerCase();
        const is_irregular = rawIrreg === 'true' || rawIrreg === 'yes' || rawIrreg === '1';
        const batchName = getVal('name', 'batchname', 'batch_name', 'batch', 'section') || `Batch-${index + 1}`;
        const rawProg = getVal('program', 'degree', 'department') || '';
        let program_code = getVal('program_code', 'code', 'tag').toUpperCase();
        let program = rawProg || 'Bachelor of Business Administration';

        if (!program_code) {
          const combined = `${batchName} ${rawProg}`.toLowerCase();
          if (combined.includes('ban') || combined.includes('analytic')) {
            program_code = 'BAN';
            if (!rawProg) program = 'BS Business Analytics';
          } else if (combined.includes('bac') || combined.includes('af') || combined.includes('acc')) {
            program_code = 'BAC';
            if (!rawProg) program = 'Bachelor of Science in Accounting & Finance';
          } else if (combined.includes('fin')) {
            program_code = 'FIN';
            if (!rawProg) program = 'BS Fintech';
          } else if (combined.includes('scm')) {
            program_code = 'SCM';
            if (!rawProg) program = 'BS Supply Chain Management';
          } else if (combined.includes('bba')) {
            program_code = 'BBA';
            if (!rawProg) program = 'Bachelor of Business Administration';
          }
        }

        const secMatch = batchName.match(/\b(?:sec|section|-)?\s*([A-Za-z])\b/i);
        const section = getVal('section') || (secMatch ? secMatch[1].toUpperCase() : undefined);
        const existingBatch = batches.find(
          (b) => b.name.trim().toLowerCase() === batchName.trim().toLowerCase() || (isValidUUID(rawId) && b.id === rawId)
        );
        const resolvedId = existingBatch ? existingBatch.id : id;

        return {
          id: resolvedId,
          name: batchName,
          program,
          program_code,
          section,
          semester: parseInt(getVal('semester', 'sem'), 10) || 1,
          student_count: parseInt(getVal('student_count', 'students', 'strength', 'capacity'), 10) || 40,
          is_irregular,
        };
      }

      if (type === 'courses') {
        const rawReqTypes = getVal('required_room_types', 'requiredroomtypes', 'roomtypes', 'room_type', 'capabilities');
        const required_room_types = rawReqTypes
          ? rawReqTypes.split(/[,;]+/).map((t) => t.trim().toLowerCase().replace(/\s+/g, '_')).filter(Boolean)
          : ['standard'];
        const courseCode = getVal('code', 'coursecode', 'course_code', 'course_id') || `CRS-${index + 101}`;
        const courseName = getVal('name', 'coursename', 'course_name', 'title') || `Course ${index + 1}`;
        const existingCourse = courses.find(
          (c) => c.code.trim().toLowerCase() === courseCode.trim().toLowerCase() || (isValidUUID(rawId) && c.id === rawId)
        );
        const resolvedId = existingCourse ? existingCourse.id : id;

        return {
          id: resolvedId,
          code: courseCode,
          name: courseName,
          department: getVal('department', 'dept') || 'Management Sciences',
          credit_hours: parseInt(getVal('credit_hours', 'credithours', 'credits', 'cr_hr'), 10) || 3,
          required_room_types: required_room_types.length > 0 ? required_room_types : ['standard'],
        };
      }

      if (type === 'students') {
        const roll_number = getVal('id', 'student_id', 'roll_number', 'roll_no', 'rollno') || getVal('campus_id') || `STD-${index + 1}`;
        const name = getVal('name', 'student_name', 'fullname') || 'Student';
        const campus_id = getVal('campus_id', 'campusid');
        const email = getVal('email', 'email_address') || `${roll_number.toLowerCase()}@shu.edu.pk`;
        const phone = getVal('phone', 'mobile', 'contact', 'phone_number') || '';
        const status = getVal('status', 'student_status') || 'Active in Program';
        const descr = getVal('descr', 'program', 'degree', 'department') || '';
        
        // Batch value is found strictly in the last column of the Excel sheet (or fallback to batch headers)
        const lastColKey = fileHeaders && fileHeaders.length > 0 ? fileHeaders[fileHeaders.length - 1] : undefined;
        const batchFromLastCol = lastColKey && row[lastColKey] !== undefined ? String(row[lastColKey]).trim() : '';
        const explicitBatch = batchFromLastCol || getVal('batch_name', 'batch', 'section', 'batch_id');

        // Check if explicitBatch already matches an existing batch
        let targetBatchId: string | null = null;
        if (explicitBatch) {
          const directMatch = batches.find(
            (b) => b.name.trim().toLowerCase() === explicitBatch.toLowerCase() || b.id === explicitBatch
          );
          if (directMatch) targetBatchId = directMatch.id;
        }

        return {
          id: generateUUID(),
          roll_number,
          name,
          campus_id,
          email,
          phone,
          status,
          program: descr,
          batch_name: explicitBatch || undefined,
          batch_id: targetBatchId,
          is_irregular: status.toLowerCase().includes('irreg'),
        };
      }

      if (type === 'sessions') {
        // Support all column naming conventions (IDs, Names, Codes, Emails, and with/without underscores or spaces)
        const rawBatchId = getVal('batch_id', 'batchid');
        const rawBatchName = getVal('batch_name', 'batch', 'batchname', 'section');

        const rawCourseId = getVal('course_id', 'courseid');
        const rawCourseCode = getVal('course_code', 'course', 'coursecode', 'code');
        const rawCourseName = getVal('course_name', 'coursename', 'course_title', 'title', 'name');

        const rawFacultyId = getVal('faculty_id', 'facultyid');
        const rawFacultyEmail = getVal('faculty_email', 'email');
        const rawFacultyName = getVal('faculty_name', 'faculty_name_or_email', 'faculty', 'teacher', 'instructor');

        const rawRoomId = getVal('room_id', 'roomid');
        const rawRoomName = getVal('room_name', 'room', 'roomname', 'venue');

        const dayVal = getVal('day_of_week', 'day', 'dayofweek', 'day_name');
        const rawStart = getVal('start_time', 'starttime', 'start') || '08:30';
        const rawEnd = getVal('end_time', 'endtime', 'end') || '11:30';
        const rawType = getVal('session_type', 'sessiontype', 'type');
        const rawStatus = getVal('status', 'state').toLowerCase() || 'published';

        // 1. Resolve Batch
        let resolvedBatchId = '';
        let resolvedBatchName = rawBatchName;
        if (rawBatchId && isValidUUID(rawBatchId)) {
          const directMatch = batches.find((b) => b.id.toLowerCase() === rawBatchId.toLowerCase());
          if (directMatch) {
            resolvedBatchId = directMatch.id;
            resolvedBatchName = directMatch.name;
          } else if (rawBatchName) {
            const nameMatch = batches.find((b) => b.name.trim().toLowerCase() === rawBatchName.trim().toLowerCase());
            if (nameMatch) {
              resolvedBatchId = nameMatch.id;
              resolvedBatchName = nameMatch.name;
            } else {
              resolvedBatchId = rawBatchId;
            }
          } else {
            resolvedBatchId = rawBatchId;
          }
        } else if (rawBatchName) {
          const nameMatch = batches.find(
            (b) => b.name.trim().toLowerCase() === rawBatchName.trim().toLowerCase() || b.id.toLowerCase() === rawBatchName.toLowerCase()
          );
          if (nameMatch) {
            resolvedBatchId = nameMatch.id;
            resolvedBatchName = nameMatch.name;
          } else {
            resolvedBatchId = generateUUID();
          }
        } else if (batches.length > 0) {
          resolvedBatchId = batches[0].id;
          resolvedBatchName = batches[0].name;
        } else {
          resolvedBatchId = generateUUID();
        }

        // 2. Resolve Course
        let resolvedCourseId = '';
        let resolvedCourseCode = rawCourseCode;
        let resolvedCourseName = rawCourseName;
        if (rawCourseId && isValidUUID(rawCourseId)) {
          const directMatch = courses.find((c) => c.id.toLowerCase() === rawCourseId.toLowerCase());
          if (directMatch) {
            resolvedCourseId = directMatch.id;
            resolvedCourseCode = directMatch.code;
            resolvedCourseName = directMatch.name;
          } else if (rawCourseCode) {
            const codeMatch = courses.find((c) => c.code.trim().toLowerCase() === rawCourseCode.trim().toLowerCase());
            if (codeMatch) {
              resolvedCourseId = codeMatch.id;
              resolvedCourseCode = codeMatch.code;
              resolvedCourseName = codeMatch.name;
            } else {
              resolvedCourseId = rawCourseId;
            }
          } else {
            resolvedCourseId = rawCourseId;
          }
        } else if (rawCourseCode || rawCourseName) {
          const target = (rawCourseCode || rawCourseName).trim().toLowerCase();
          const match = courses.find(
            (c) => c.code.trim().toLowerCase() === target || c.name.trim().toLowerCase() === target || c.id.toLowerCase() === target
          );
          if (match) {
            resolvedCourseId = match.id;
            resolvedCourseCode = match.code;
            resolvedCourseName = match.name;
          } else {
            resolvedCourseId = generateUUID();
          }
        } else if (courses.length > 0) {
          resolvedCourseId = courses[0].id;
          resolvedCourseCode = courses[0].code;
          resolvedCourseName = courses[0].name;
        } else {
          resolvedCourseId = generateUUID();
        }

        // 3. Resolve Faculty
        let resolvedFacultyId = '';
        let resolvedFacultyName = rawFacultyName;
        let resolvedFacultyEmail = rawFacultyEmail;
        if (rawFacultyId && isValidUUID(rawFacultyId)) {
          const directMatch = faculty.find((f) => f.id.toLowerCase() === rawFacultyId.toLowerCase());
          if (directMatch) {
            resolvedFacultyId = directMatch.id;
            resolvedFacultyName = directMatch.name;
            resolvedFacultyEmail = directMatch.email;
          } else if (rawFacultyEmail || rawFacultyName) {
            const target = (rawFacultyEmail || rawFacultyName).trim().toLowerCase();
            const match = faculty.find((f) => f.email.trim().toLowerCase() === target || f.name.trim().toLowerCase() === target);
            if (match) {
              resolvedFacultyId = match.id;
              resolvedFacultyName = match.name;
              resolvedFacultyEmail = match.email;
            } else {
              resolvedFacultyId = rawFacultyId;
            }
          } else {
            resolvedFacultyId = rawFacultyId;
          }
        } else if (rawFacultyEmail || rawFacultyName) {
          const target = (rawFacultyEmail || rawFacultyName).trim().toLowerCase();
          const match = faculty.find(
            (f) => f.email.trim().toLowerCase() === target || f.name.trim().toLowerCase() === target || f.id.toLowerCase() === target
          );
          if (match) {
            resolvedFacultyId = match.id;
            resolvedFacultyName = match.name;
            resolvedFacultyEmail = match.email;
          } else {
            resolvedFacultyId = generateUUID();
          }
        } else if (faculty.length > 0) {
          resolvedFacultyId = faculty[0].id;
          resolvedFacultyName = faculty[0].name;
          resolvedFacultyEmail = faculty[0].email;
        } else {
          resolvedFacultyId = generateUUID();
        }

        // 4. Resolve Room
        let resolvedRoomId: string | null = null;
        let resolvedRoomName = rawRoomName;
        if (rawRoomId && isValidUUID(rawRoomId)) {
          const directMatch = rooms.find((r) => r.id.toLowerCase() === rawRoomId.toLowerCase());
          if (directMatch) {
            resolvedRoomId = directMatch.id;
            resolvedRoomName = directMatch.name;
          } else if (rawRoomName) {
            const match = rooms.find((r) => r.name.trim().toLowerCase() === rawRoomName.trim().toLowerCase());
            if (match) {
              resolvedRoomId = match.id;
              resolvedRoomName = match.name;
            } else {
              resolvedRoomId = rawRoomId;
            }
          } else {
            resolvedRoomId = rawRoomId;
          }
        } else if (rawRoomName) {
          const match = rooms.find(
            (r) => r.name.trim().toLowerCase() === rawRoomName.trim().toLowerCase() || r.id.toLowerCase() === rawRoomName.toLowerCase()
          );
          if (match) {
            resolvedRoomId = match.id;
            resolvedRoomName = match.name;
          } else {
            resolvedRoomId = generateUUID();
          }
        }

        // 5. Convert Day name or number to 1..7 (1=Monday)
        let day_of_week = 1;
        if (/^\d+$/.test(dayVal)) {
          day_of_week = Math.min(Math.max(parseInt(dayVal, 10), 1), 7);
        } else {
          const dayLower = dayVal.toLowerCase();
          if (dayLower.startsWith('mon')) day_of_week = 1;
          else if (dayLower.startsWith('tue')) day_of_week = 2;
          else if (dayLower.startsWith('wed')) day_of_week = 3;
          else if (dayLower.startsWith('thu')) day_of_week = 4;
          else if (dayLower.startsWith('fri')) day_of_week = 5;
          else if (dayLower.startsWith('sat')) day_of_week = 6;
          else if (dayLower.startsWith('sun')) day_of_week = 7;
        }

        const cleanTime = (t: string, def: string) => {
          if (!t) return def;
          const parts = t.split(':');
          if (parts.length >= 2) {
            return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
          }
          return def;
        };

        const start_time = cleanTime(rawStart, '08:30');
        const end_time = cleanTime(rawEnd, '11:30');

        return {
          id,
          semester_id: activeSemester?.id || '11111111-1111-1111-1111-111111111111',
          batch_id: resolvedBatchId,
          course_id: resolvedCourseId,
          faculty_id: resolvedFacultyId,
          room_id: resolvedRoomId,
          day_of_week,
          start_time,
          end_time,
          session_type: rawType.toLowerCase().includes('makeup') ? ('makeup' as const) : ('regular' as const),
          status: rawStatus === 'draft' ? ('draft' as const) : ('published' as const),
          batch_name: resolvedBatchName || undefined,
          course_code: resolvedCourseCode || undefined,
          course_name: resolvedCourseName || undefined,
          faculty_name: resolvedFacultyName || undefined,
          faculty_email: resolvedFacultyEmail || undefined,
          room_name: resolvedRoomName || undefined,
        };
      }

      return row;
    });
  };

  // --------------------------------------------------------------------------
  // HANDLE IMPORT EXECUTION
  // --------------------------------------------------------------------------
  const handleExecuteImport = async () => {
    if (!parsedRows || parsedRows.length === 0) {
      setErrorMsg('No parsed data to import. Please attach a valid Excel file.');
      return;
    }

    setIsImporting(true);
    setErrorMsg(null);

    try {
      const res = await bulkImportEntities(importType, parsedRows);
      if (!res.success && res.error) {
        throw new Error(res.error);
      }

      setSuccessCount(parsedRows.length);
      if (res.warning) {
        setWarningMsg(res.warning);
      } else {
        setTimeout(() => {
          handleClose();
        }, 1800);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to complete import into database.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleResetFile = () => {
    setFile(null);
    setFileName('');
    setParsedRows([]);
    setHeaders([]);
    setErrorMsg(null);
    setWarningMsg(null);
    setSuccessCount(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    handleResetFile();
    onClose();
  };

  const currentTemplate = getTemplateDefinition(importType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-shu-50 text-shu-700 border border-shu-200">
              <FileSpreadsheet className="w-5 h-5 text-shu-700" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Excel Master Data & Schedule Importer
              </h3>
              <p className="text-xs text-slate-500">
                Download pre-formatted Excel templates, fill your records, and attach to import.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto flex-1 py-4 space-y-5 pr-1 text-xs">
          
          {successCount !== null ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-lg">
                  Import Successfully Completed!
                </h4>
                <p className="text-slate-600 text-xs max-w-sm mx-auto mt-1">
                  Successfully processed and imported <span className="font-bold text-slate-900">{successCount}</span> records into <span className="font-bold text-shu-700">{importType}</span>.
                </p>
              </div>

              {warningMsg && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-left text-xs space-y-1">
                  <p>{warningMsg}</p>
                </div>
              )}

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetFile}
                  className="px-4 py-2 bg-shu-700 hover:bg-shu-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Import Another File
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Done & Close
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Entity Type Selection */}
              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1.5">
                  1. Select Master Entity to Import
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { type: 'students', label: 'Student Lists / Roster', icon: '👥' },
                    { type: 'rooms', label: 'Rooms & Venues', icon: '🏢' },
                    { type: 'faculty', label: 'Faculty Members', icon: '👨‍🏫' },
                    { type: 'courses', label: 'Courses Catalog', icon: '📚' },
                    { type: 'sessions', label: 'Class Sessions', icon: '📅' },
                  ].map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => {
                        setImportType(item.type as ImportEntityType);
                        handleResetFile();
                      }}
                      className={`p-2.5 rounded-xl border text-left font-bold transition-all cursor-pointer flex items-center gap-2 ${
                        importType === item.type
                          ? 'border-shu-600 bg-shu-50 text-shu-900 shadow-2xs'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-base">{item.icon}</span>
                      <span className="text-xs">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Template Download Banner */}
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-slate-50 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-indigo-950 font-bold text-xs">
                    <Download className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Download Excel Template for {importType.toUpperCase()}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {currentTemplate.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3.5 py-2 text-xs font-bold bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-600 hover:text-white rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .xlsx</span>
                </button>
              </div>

              {/* File Attachment / Drag & Drop Zone */}
              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1.5">
                  2. Attach Filled Excel File (.xlsx, .xls, .csv)
                </label>

                {!file ? (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        processUploadedFile(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-shu-600 bg-shu-50/50 scale-[0.99]'
                        : 'border-slate-300 hover:border-shu-500 bg-slate-50/70 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          processUploadedFile(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                    <div className="w-10 h-10 rounded-full bg-shu-100 text-shu-700 flex items-center justify-center mx-auto mb-2">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="font-bold text-slate-800 text-xs">
                      Click to Browse or Drag & Drop your Excel file here
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv)
                    </p>
                  </div>
                ) : (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-bold text-slate-900 text-xs truncate">
                          {fileName}
                        </p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{(file.size / 1024).toFixed(1)} KB</span>
                          <span>•</span>
                          <span className="font-bold text-emerald-600">{parsedRows.length} records ready</span>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetFile}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Remove and choose another file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="font-medium">{errorMsg}</span>
                </div>
              )}

              {/* Live Preview Table */}
              {parsedRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <Table className="w-3.5 h-3.5 text-slate-500" />
                      <span>Data Preview ({parsedRows.length} Rows Parsed)</span>
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Showing preview of top entries
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-48 bg-white shadow-2xs">
                    {(() => {
                      const getDisplayRow = (r: any): Record<string, any> => {
                        if (importType === 'sessions') {
                          const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                          return {
                            Batch: r.batch_name || batches.find((b) => b.id === r.batch_id)?.name || r.batch_id,
                            Course: r.course_code || courses.find((c) => c.id === r.course_id)?.code || r.course_name || r.course_id,
                            Faculty: r.faculty_name || faculty.find((f) => f.id === r.faculty_id)?.name || r.faculty_email || r.faculty_id,
                            Room: r.room_name || rooms.find((rm) => rm.id === r.room_id)?.name || (r.room_id ? 'Assigned' : 'Pending Room'),
                            Day: dayNames[(r.day_of_week || 1) - 1] || String(r.day_of_week),
                            'Start Time': r.start_time,
                            'End Time': r.end_time,
                            Type: r.session_type,
                            Status: r.status,
                          };
                        }
                        return Object.fromEntries(
                          Object.entries(r).filter(([k]) => k !== 'id' && k !== 'semester_id' && k !== 'batch_id')
                        );
                      };

                      const sampleDisplay = getDisplayRow(parsedRows[0] || {});
                      const colHeaders = Object.keys(sampleDisplay);

                      return (
                        <table className="w-full text-left text-[11px] border-collapse">
                          <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200">
                            <tr>
                              {colHeaders.map((colKey) => (
                                <th key={colKey} className="py-2 px-3 whitespace-nowrap capitalize">
                                  {colKey.replace(/_/g, ' ')}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {parsedRows.slice(0, 8).map((row, idx) => {
                              const displayItem = getDisplayRow(row);
                              return (
                                <tr key={idx} className="hover:bg-slate-50">
                                  {colHeaders.map((colKey, colIdx) => {
                                    const val = (displayItem as Record<string, any>)[colKey];
                                    return (
                                      <td key={colIdx} className="py-1.5 px-3 whitespace-nowrap text-slate-800">
                                        {Array.isArray(val) ? val.join(', ') : String(val ?? '')}
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>
                  {parsedRows.length > 8 && (
                    <p className="text-[10px] text-slate-400 text-center">
                      + {parsedRows.length - 8} more rows will be imported
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 shrink-0 gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            {successCount !== null ? 'Close' : 'Cancel'}
          </button>

          {successCount === null && (
            <button
              type="button"
              disabled={parsedRows.length === 0 || isImporting || isLoading}
              onClick={handleExecuteImport}
              className={`flex items-center gap-1.5 px-5 py-2.5 text-xs font-extrabold rounded-xl shadow-sm transition-all cursor-pointer ${
                parsedRows.length > 0 && !isImporting
                  ? 'bg-shu-700 hover:bg-shu-800 text-white shadow-md hover:shadow-lg'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isImporting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Importing Records...</span>
                </>
              ) : (
                <>
                  <span>Import {parsedRows.length > 0 ? `${parsedRows.length} Records` : 'Now'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
