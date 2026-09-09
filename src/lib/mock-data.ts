import { 
  Room, 
  Faculty, 
  Batch, 
  BatchMergeGroup, 
  Course, 
  ClassSession, 
  Semester, 
  SemesterCalendarEvent, 
  Student, 
  StudentCourseCompleted, 
  AdvisingSuggestion, 
  AuditLogEntry, 
  TimetableVersion,
  MakeupRequest
} from '@/types';

export const INITIAL_SEMESTERS: Semester[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Current Academic Term',
    academic_year: '2026-2027',
    start_date: '2026-09-01',
    end_date: '2027-01-30',
    is_active: true,
  },
];

export const INITIAL_CALENDAR: SemesterCalendarEvent[] = [
  {
    id: 'ca100001-1111-1111-1111-111111111111',
    semester_id: '11111111-1111-1111-1111-111111111111',
    event_name: 'Midterm Examination Week',
    event_type: 'midterm_week',
    start_date: '2026-10-26',
    end_date: '2026-10-31',
    description: 'Regular classes suspended for campus midterms',
  },
];

export const INITIAL_ROOMS: Room[] = [
  { id: 'room-a-04', name: 'A-04 (Ground Floor Classroom)', building: 'Block A', floor: 0, capacity: 45, room_types: ['standard'] },
  { id: 'room-a-08', name: 'A-08 (Computer Lab 1 Ground Fl)', building: 'Block A', floor: 0, capacity: 45, room_types: ['computer_lab', 'multimedia'] },
  { id: 'room-ff-103', name: 'FF-103 (1st Floor Lecture Hall)', building: 'First Floor Wing', floor: 1, capacity: 50, room_types: ['standard'] },
  { id: 'room-frf-401', name: 'FRF-401 (4th Floor Horseshoe)', building: 'Faculty Block 4', floor: 4, capacity: 75, room_types: ['horseshoe', 'multimedia'] },
  { id: 'room-frf-402', name: 'FRF-402 (4th Floor Horseshoe)', building: 'Faculty Block 4', floor: 4, capacity: 75, room_types: ['horseshoe', 'multimedia', 'interactive_lcd'] },
  { id: 'room-frf-404', name: 'FRF-404 (4th Floor Lecture Hall)', building: 'Faculty Block 4', floor: 4, capacity: 55, room_types: ['standard', 'multimedia'] },
  { id: 'room-frf-405', name: 'FRF-405 (4th Floor Lecture Hall)', building: 'Faculty Block 4', floor: 4, capacity: 50, room_types: ['standard', 'multimedia'] },
  { id: 'room-frf-406', name: 'FRF-406 (4th Floor Lecture Hall)', building: 'Faculty Block 4', floor: 4, capacity: 50, room_types: ['standard', 'multimedia'] },
  { id: 'room-sf-201', name: 'SF-201 (2nd Floor Horseshoe)', building: 'Science Wing 2', floor: 2, capacity: 75, room_types: ['horseshoe', 'multimedia'] },
  { id: 'room-sf-206', name: 'SF-206 (2nd Floor Lecture Hall)', building: 'Science Wing 2', floor: 2, capacity: 55, room_types: ['standard', 'multimedia'] },
  { id: 'room-sf-209', name: 'SF-209 (2nd Floor Language Lab)', building: 'Science Wing 2', floor: 2, capacity: 40, room_types: ['computer_lab', 'multimedia'] },
  { id: 'room-tf-301', name: 'TF-301 (3rd Floor Horseshoe)', building: 'Academic Tower 3', floor: 3, capacity: 75, room_types: ['horseshoe', 'multimedia', 'interactive_lcd'] },
  { id: 'room-tf-302', name: 'TF-302 (3rd Floor Horseshoe)', building: 'Academic Tower 3', floor: 3, capacity: 70, room_types: ['horseshoe', 'multimedia'] },
  { id: 'room-tf-306', name: 'TF-306 (3rd Floor Lecture Hall)', building: 'Academic Tower 3', floor: 3, capacity: 60, room_types: ['standard', 'multimedia'] },
  { id: 'room-tf-307', name: 'TF-307 (3rd Floor Horseshoe)', building: 'Academic Tower 3', floor: 3, capacity: 75, room_types: ['horseshoe', 'multimedia', 'interactive_lcd'] },
  { id: 'room-tf-308', name: 'TF-308 (3rd Floor Language Lab)', building: 'Academic Tower 3', floor: 3, capacity: 40, room_types: ['computer_lab', 'multimedia'] },
  { id: 'room-tf-309', name: 'TF-309 (3rd Floor IT Lab)', building: 'Academic Tower 3', floor: 3, capacity: 45, room_types: ['computer_lab', 'multimedia'] },
  { id: 'room-tf-310', name: 'TF-310 (3rd Floor IT Lab)', building: 'Academic Tower 3', floor: 3, capacity: 45, room_types: ['computer_lab', 'multimedia'] },
  { id: 'room-tf-311', name: 'TF-311 (3rd Floor Lecture Hall)', building: 'Academic Tower 3', floor: 3, capacity: 55, room_types: ['standard', 'multimedia'] },
];

export const INITIAL_FACULTY: Faculty[] = [
  { id: 'fac-abid-khan', name: 'Abid Khan', email: 'abid.khan@shu.edu.pk', department: 'Accounting & Finance', max_load_per_day: 4 },
  { id: 'fac-waleed-wasti', name: 'Waleed Wasti', email: 'waleed.wasti@shu.edu.pk', department: 'Economics', max_load_per_day: 4 },
  { id: 'fac-hafiz-shayan', name: 'Hafiz Shayan', email: 'hafiz.shayan@shu.edu.pk', department: 'Islamic Studies', max_load_per_day: 4 },
  { id: 'fac-sumaira-ashraf', name: 'Sumaira Ashraf', email: 'sumaira.ashraf@shu.edu.pk', department: 'Humanities & Islamic', max_load_per_day: 3 },
  { id: 'fac-shamaila-burney', name: 'Shamaila Burney', email: 'shamaila.burney@shu.edu.pk', department: 'Marketing', max_load_per_day: 3 },
  { id: 'fac-musawwir', name: 'Musawwir Ali Soomro', email: 'musawwir.ali.soomro@shu.edu.pk', department: 'Mathematics & Statistics', max_load_per_day: 4 },
  { id: 'fac-abdullah-idrees', name: 'Mr Muhammad Abdullah Idrees', email: 'muhammad.abdullah.idrees@shu.edu.pk', department: 'Finance', max_load_per_day: 4 },
  { id: 'fac-sabeen-amjad', name: 'Sabeen Amjad', email: 'sabeen.amjad@shu.edu.pk', department: 'Communication', max_load_per_day: 4 },
  { id: 'fac-memoona-shahzad', name: 'Memoona Shahzad', email: 'memoona.shahzad@shu.edu.pk', department: 'Social Sciences', max_load_per_day: 4 },
  { id: 'fac-gul-munir', name: 'Gul Munir Deedar Ali', email: 'gul.munir.deedar.ali@shu.edu.pk', department: 'Mathematics', max_load_per_day: 4 },
  { id: 'fac-mohammad-omar', name: 'Mohammad Omar', email: 'mohammad.omar@shu.edu.pk', department: 'Business Analytics', max_load_per_day: 4 },
  { id: 'fac-zubair-shah', name: 'Zubair Shah', email: 'zubair.shah@shu.edu.pk', department: 'Pakistan Studies', max_load_per_day: 4 },
  { id: 'fac-misbah-iqbal', name: 'Misbah Iqbal', email: 'misbah.iqbal@shu.edu.pk', department: 'Finance', max_load_per_day: 4 },
  { id: 'fac-rizwan-akram', name: 'Muhammad Rizwan Akram', email: 'muhammad.rizwan.akram@shu.edu.pk', department: 'Humanities', max_load_per_day: 4 },
  { id: 'fac-ateeque-rahman', name: 'Ateeque Rahman', email: 'ateeque.rahman@shu.edu.pk', department: 'Computer Science', max_load_per_day: 4 },
  { id: 'fac-mariyam-khan', name: 'Mariyam Khan', email: 'mariyam.khan@shu.edu.pk', department: 'Computer Science', max_load_per_day: 4 },
  { id: 'fac-mehak-kanwal', name: 'Mehak Kanwal', email: 'mehak.kanwal@shu.edu.pk', department: 'Pakistan Studies', max_load_per_day: 3 },
  { id: 'fac-sarmad-hassan', name: 'Syed Sarmad Hassan', email: 'syed.sarmad.hassan@shu.edu.pk', department: 'Accounting & Risk', max_load_per_day: 5 },
  { id: 'fac-fakhir-musharraf', name: 'Muhammad Fakhir Musharraf', email: 'muhammad.fakhir.musharraf@shu.edu.pk', department: 'Actuarial Science & Risk', max_load_per_day: 5 },
  { id: 'fac-qaiser-hussain', name: 'Syed Qaiser Hussain', email: 'syed.qaiser.hussain@shu.edu.pk', department: 'Business Communication', max_load_per_day: 4 },
  { id: 'fac-nayeem-ansari', name: 'Nayeem Ul Hasan Ansari', email: 'nayeem.ul.hasan.ansari@shu.edu.pk', department: 'Finance & Markets', max_load_per_day: 4 },
  { id: 'fac-pervaiz-mobin', name: 'Pervaiz Mobin', email: 'pervaiz.mobin@shu.edu.pk', department: 'Management & Projects', max_load_per_day: 5 },
  { id: 'fac-kousar-zaheer', name: 'Kousar Zaheer', email: 'kousar.zaheer@shu.edu.pk', department: 'Management & Marketing', max_load_per_day: 4 },
  { id: 'fac-shah-saleem', name: 'Shah Muhammad Saleem', email: 'shah.muhammad.saleem@shu.edu.pk', department: 'Management & Marketing', max_load_per_day: 4 },
  { id: 'fac-sana-javed', name: 'Sana Javed', email: 'sana.javed@shu.edu.pk', department: 'Communication', max_load_per_day: 4 },
  { id: 'fac-khalida-khan', name: 'Khalida Khan', email: 'khalida.khan@shu.edu.pk', department: 'Management', max_load_per_day: 4 },
  { id: 'fac-kanwal-munir', name: 'Kanwal Munir', email: 'kanwal.munir@shu.edu.pk', department: 'Social Studies', max_load_per_day: 3 },
  { id: 'fac-ghulam-mustafa', name: 'Ghulam Mustafa', email: 'ghulam.mustafa@shu.edu.pk', department: 'Accounting', max_load_per_day: 4 },
  { id: 'fac-adnan-ali', name: 'Adnan Ali', email: 'adnan.ali@shu.edu.pk', department: 'Accounting & Finance', max_load_per_day: 3 },
  { id: 'fac-shaikh-bilal', name: 'Shaikh Bilal', email: 'shaikh.bilal@shu.edu.pk', department: 'Audit & Accounting', max_load_per_day: 3 },
  { id: 'fac-jibran-sartaj', name: 'Jibran Sartaj', email: 'jibran.sartaj@shu.edu.pk', department: 'Business Law', max_load_per_day: 4 },
  { id: 'fac-yasar-rizwan', name: 'Yasar Rizwan', email: 'yasar.rizwan@shu.edu.pk', department: 'MIS & ERP', max_load_per_day: 4 },
  { id: 'fac-nadeem-hanif', name: 'Muhammad Nadeem Hanif', email: 'muhammad.nadeem.hanif@shu.edu.pk', department: 'Finance & Regulations', max_load_per_day: 4 },
  { id: 'fac-shariq-waqar', name: 'Shariq Waqar', email: 'shariq.waqar@shu.edu.pk', department: 'Taxation & Accounting', max_load_per_day: 4 },
  { id: 'fac-rehan-butt', name: 'Rehan Muzamil Butt', email: 'rehan.muzamil.butt@shu.edu.pk', department: 'Entrepreneurship', max_load_per_day: 4 },
  { id: 'fac-quaid-johar', name: 'Quaid Johar', email: 'quaid.johar@shu.edu.pk', department: 'Audit & Assurance', max_load_per_day: 4 },
  { id: 'fac-ekhlaque-ahmed', name: 'Ekhlaque Ahmed', email: 'ekhlaque.ahmed@shu.edu.pk', department: 'Marketing & Strategy', max_load_per_day: 5 },
  { id: 'fac-zuhair-mohsin', name: 'Zuhair Mohsin', email: 'zuhair.mohsin@shu.edu.pk', department: 'Fintech', max_load_per_day: 3 },
  { id: 'fac-khalid-petiwala', name: 'Khalid Petiwala', email: 'khalid.petiwala@shu.edu.pk', department: 'Advanced Taxation', max_load_per_day: 3 },
  { id: 'fac-saman', name: 'Saman', email: 'saman@shu.edu.pk', department: 'Marketing', max_load_per_day: 3 },
  { id: 'fac-priyanka-bajaj', name: 'Priyanka Bajaj', email: 'priyanka.bajaj@shu.edu.pk', department: 'HR & Management', max_load_per_day: 4 },
  { id: 'fac-asif-shamim', name: 'Asif Shamim', email: 'asif.shamim@shu.edu.pk', department: 'Economics', max_load_per_day: 3 },
  { id: 'fac-hunain', name: 'Hunain', email: 'hunain@shu.edu.pk', department: 'Foreign Languages', max_load_per_day: 3 },
  { id: 'fac-zeeshan-ahmed', name: 'Zeeshan Ahmed', email: 'zeeshan.ahmed@shu.edu.pk', department: 'Project Management', max_load_per_day: 3 },
  { id: 'fac-raheel', name: 'Raheel', email: 'raheel@shu.edu.pk', department: 'Supply Chain Management', max_load_per_day: 4 },
  { id: 'fac-hassaan-ahmed', name: 'Hassaan Ahmed', email: 'hassaan.ahmed@shu.edu.pk', department: 'Business Simulations', max_load_per_day: 3 },
  { id: 'fac-faisal-shaikh', name: 'Faisal Shaikh', email: 'faisal.shaikh@shu.edu.pk', department: 'Marketing Research', max_load_per_day: 3 },
  { id: 'fac-fahad-anwar', name: 'Muhammad Fahad Anwar', email: 'muhammad.fahad.anwar@shu.edu.pk', department: 'SCM Sustainability', max_load_per_day: 3 },
];

export const INITIAL_MERGE_GROUPS: BatchMergeGroup[] = [];

export const INITIAL_BATCHES: Batch[] = [
  // Business Analytics (BAN)
  { id: 'batch-ban-2', name: 'BAN - 2', program: 'BS (Business Analytics)', semester: 2, student_count: 45 },
  { id: 'batch-ban-3', name: 'BAN - 3', program: 'BS (Business Analytics)', semester: 3, student_count: 40 },
  { id: 'batch-ban-4', name: 'BAN - 4', program: 'BS (Business Analytics)', semester: 4, student_count: 38 },

  // Actuarial Science & Risk Management (ARM)
  { id: 'batch-arm-3', name: 'ARM - 3', program: 'BS (Actuarial Science)', semester: 3, student_count: 35 },
  { id: 'batch-arm-5', name: 'ARM - 5', program: 'BS (Actuarial Science)', semester: 5, student_count: 30 },
  { id: 'batch-arm-6', name: 'ARM - 6', program: 'BS (Actuarial Science)', semester: 6, student_count: 28 },

  // Accounting & Finance (BS AF)
  { id: 'batch-bsaf-2', name: 'BS(AF) - 2', program: 'BS (Accounting & Finance)', semester: 2, student_count: 50 },
  { id: 'batch-bsaf-3a', name: 'BS(AF) - 3A', program: 'BS (Accounting & Finance)', semester: 3, student_count: 45 },
  { id: 'batch-bsaf-3b', name: 'BS(AF) - 3B', program: 'BS (Accounting & Finance)', semester: 3, student_count: 45 },
  { id: 'batch-bsaf-3c', name: 'BS(AF) - 3C', program: 'BS (Accounting & Finance)', semester: 3, student_count: 45 },
  { id: 'batch-bsaf-4', name: 'BS(AF) - 4', program: 'BS (Accounting & Finance)', semester: 4, student_count: 48 },
  { id: 'batch-bsaf-5', name: 'BS(AF) - 5', program: 'BS (Accounting & Finance)', semester: 5, student_count: 42 },
  { id: 'batch-bsaf-6', name: 'BS(AF) - 6', program: 'BS (Accounting & Finance)', semester: 6, student_count: 40 },
  { id: 'batch-bsaf-7', name: 'BS(AF) - 7', program: 'BS (Accounting & Finance)', semester: 7, student_count: 38 },
  { id: 'batch-bsaf-8', name: 'BS(AF) - 8', program: 'BS (Accounting & Finance)', semester: 8, student_count: 35 },

  // BBA
  { id: 'batch-bba-2', name: 'BBA - 2', program: 'BBA', semester: 2, student_count: 55 },
  { id: 'batch-bba-3a', name: 'BBA - 3A', program: 'BBA', semester: 3, student_count: 45 },
  { id: 'batch-bba-3b', name: 'BBA - 3B', program: 'BBA', semester: 3, student_count: 45 },
  { id: 'batch-bba-3c', name: 'BBA - 3C', program: 'BBA', semester: 3, student_count: 45 },
  { id: 'batch-bba-4', name: 'BBA - 4', program: 'BBA', semester: 4, student_count: 50 },
  { id: 'batch-bba-5', name: 'BBA - 5', program: 'BBA', semester: 5, student_count: 48 },
  { id: 'batch-bba-6', name: 'BBA - 6', program: 'BBA', semester: 6, student_count: 45 },
  { id: 'batch-bba-7', name: 'BBA - 7', program: 'BBA', semester: 7, student_count: 42 },
  { id: 'batch-bba-8', name: 'BBA - 8', program: 'BBA', semester: 8, student_count: 40 },
];

export const INITIAL_COURSES: Course[] = [
  { id: 'crs-acc106', code: 'ACC-106', name: 'Financial Accounting and Corporate Reporting', department: 'Accounting', credit_hours: 3, required_room_types: ['standard'] },
  { id: 'crs-eco102', code: 'ECO-102', name: 'Microeconomics', department: 'Economics', credit_hours: 3, required_room_types: ['standard'] },
  { id: 'crs-eco103', code: 'ECO-103', name: 'Globalization & Development', department: 'Economics', credit_hours: 3, required_room_types: ['standard'] },
  { id: 'crs-gen111', code: 'GEN-111', name: 'Fehm-ul-Quran - I', department: 'Islamic Studies', credit_hours: 2, required_room_types: ['standard'] },
  { id: 'crs-ist101', code: 'IST-101', name: 'Islamic Studies', department: 'Islamic Studies', credit_hours: 2, required_room_types: ['standard'] },
  { id: 'crs-mkt101', code: 'MKT-101', name: 'Principles of Marketing', department: 'Marketing', credit_hours: 3, required_room_types: ['horseshoe'] },
  { id: 'crs-mth108', code: 'MTH-108', name: 'Business Mathematics and Statistics', department: 'Mathematics', credit_hours: 3, required_room_types: ['standard'] },
  { id: 'crs-fin206', code: 'FIN-206', name: 'Introduction to Finance', department: 'Finance', credit_hours: 3, required_room_types: ['horseshoe'] },
  { id: 'crs-eng105', code: 'ENG-105', name: 'Presentation and Communication Skills', department: 'Communication', credit_hours: 3, required_room_types: ['standard'] },
  { id: 'crs-gen112', code: 'GEN-112', name: 'Fehm-ul-Quran - II', department: 'Islamic Studies', credit_hours: 2, required_room_types: ['standard'] },
  { id: 'crs-hus202', code: 'HUS-202', name: 'Service Learning & Civic Responsibility', department: 'Social Sciences', credit_hours: 2, required_room_types: ['standard'] },
  { id: 'crs-mth210', code: 'MTH-210', name: 'Calculus with Applications', department: 'Mathematics', credit_hours: 3, required_room_types: ['horseshoe'] },
  { id: 'crs-mth104', code: 'MTH-104', name: 'Introduction to Business Analytics', department: 'Business Analytics', credit_hours: 3, required_room_types: ['computer_lab'] },
  { id: 'crs-pst102', code: 'PST-102', name: 'Ideology and Constitution of Pakistan', department: 'Pakistan Studies', credit_hours: 2, required_room_types: ['standard'] },
  { id: 'crs-eco203', code: 'ECO-203', name: 'Macroeconomics', department: 'Economics', credit_hours: 3, required_room_types: ['computer_lab'] },
  { id: 'crs-fin204', code: 'FIN-204', name: 'Financial Management', department: 'Finance', credit_hours: 3, required_room_types: ['horseshoe'] },
  { id: 'crs-pdv203', code: 'PDV-203', name: 'Arts and Literature', department: 'Humanities', credit_hours: 2, required_room_types: ['standard'] },
  { id: 'crs-ban202', code: 'BAN-202', name: 'Computer Programming - II', department: 'Computer Science', credit_hours: 3, required_room_types: ['computer_lab'] },
  { id: 'crs-pst101', code: 'PST-101', name: 'Pakistan Studies', department: 'Pakistan Studies', credit_hours: 2, required_room_types: ['standard'] },
  { id: 'crs-mth304', code: 'MTH-304', name: 'Business Analytics (Modeling & Forecasting)', department: 'Business Analytics', credit_hours: 3, required_room_types: ['computer_lab'] },
  { id: 'crs-rm301', code: 'RM-301', name: 'Takaful and Islamic Risk Management', department: 'Actuarial Science', credit_hours: 3, required_room_types: ['standard'] },
  { id: 'crs-rm302', code: 'RM-302', name: 'Financial Risk Management - I', department: 'Actuarial Science', credit_hours: 3, required_room_types: ['standard'] },
  { id: 'crs-rm304', code: 'RM-304', name: 'Insurtech and Risktech', department: 'Actuarial Science', credit_hours: 3, required_room_types: ['standard'] },
  { id: 'crs-fin314', code: 'FIN-314', name: 'Regulation for Insurance and Actuarial Science', department: 'Actuarial Science', credit_hours: 3, required_room_types: ['standard'] },
  { id: 'crs-eng306', code: 'ENG-306', name: 'Applied Business Communication', department: 'Communication', credit_hours: 3, required_room_types: ['standard'] },
  { id: 'crs-fin302', code: 'FIN-302', name: 'Financial Institutions and Markets', department: 'Finance', credit_hours: 3, required_room_types: ['horseshoe'] },
  { id: 'crs-mgt407', code: 'MGT-407', name: 'Capstone Project I', department: 'Management', credit_hours: 3, required_room_types: ['horseshoe'] },
  { id: 'crs-fin315', code: 'FIN-315', name: 'Financial Econometrics', department: 'Finance', credit_hours: 3, required_room_types: ['standard'] },
  { id: 'crs-mgt201', code: 'MGT-201', name: 'Organizational Behavior and Leadership', department: 'Management', credit_hours: 3, required_room_types: ['horseshoe'] },
  { id: 'crs-acc201', code: 'ACC-201', name: 'Advanced Financial Accounting and Reporting', department: 'Accounting', credit_hours: 3, required_room_types: ['horseshoe'] },
  { id: 'crs-acc203', code: 'ACC-203', name: 'Cost Management', department: 'Accounting', credit_hours: 3, required_room_types: ['standard'] },
  { id: 'crs-fin207', code: 'FIN-207', name: 'Emerging Trends in Accounting & Finance', department: 'Finance', credit_hours: 3, required_room_types: ['horseshoe'] },
  { id: 'crs-acc210', code: 'ACC-210', name: 'Audit and Assurance', department: 'Accounting', credit_hours: 3, required_room_types: ['standard'] },
  { id: 'crs-acc303', code: 'ACC-303', name: 'Performance Management', department: 'Accounting', credit_hours: 3, required_room_types: ['standard'] },
  { id: 'crs-law202', code: 'LAW-202', name: 'Legal Environment for Business in Pakistan', department: 'Law', credit_hours: 3, required_room_types: ['horseshoe'] },
  { id: 'crs-acc304', code: 'ACC-304', name: 'Financial Statement Analysis', department: 'Accounting', credit_hours: 3, required_room_types: ['standard'] },
  { id: 'crs-acc302', code: 'ACC-302', name: 'Data Analytics for Accounting & Finance', department: 'Accounting', credit_hours: 3, required_room_types: ['computer_lab'] },
  { id: 'crs-csc307', code: 'CSC-307', name: 'Introduction to MIS and ERP', department: 'MIS', credit_hours: 3, required_room_types: ['computer_lab'] },
  { id: 'crs-fin304', code: 'FIN-304', name: 'Investment Analysis', department: 'Finance', credit_hours: 3, required_room_types: ['horseshoe'] },
  { id: 'crs-fin303', code: 'FIN-303', name: 'Regulations & Financial Markets', department: 'Finance', credit_hours: 3, required_room_types: ['horseshoe'] },
  { id: 'crs-mgt305', code: 'MGT-305', name: 'Business Research Methods', department: 'Management', credit_hours: 3, required_room_types: ['computer_lab'] },
  { id: 'crs-acc402', code: 'ACC-402', name: 'Principles of Taxation', department: 'Accounting', credit_hours: 3, required_room_types: ['computer_lab'] },
  { id: 'crs-fin409', code: 'FIN-409', name: 'Derivative & Risk Management', department: 'Finance', credit_hours: 3, required_room_types: ['standard'] },
  { id: 'crs-fin411', code: 'FIN-411', name: 'Islamic Finance', department: 'Finance', credit_hours: 3, required_room_types: ['horseshoe'] },
  { id: 'crs-mgt401', code: 'MGT-401', name: 'Entrepreneurship', department: 'Management', credit_hours: 3, required_room_types: ['horseshoe'] },
  { id: 'crs-acc404', code: 'ACC-404', name: 'Advanced Audit and Assurance', department: 'Accounting', credit_hours: 3, required_room_types: ['standard'] },
  { id: 'crs-fin417', code: 'FIN-417', name: 'Strategic Business Finance', department: 'Finance', credit_hours: 3, required_room_types: ['horseshoe'] },
  { id: 'crs-mgt406', code: 'MGT-406', name: 'Business Strategy', department: 'Management', credit_hours: 3, required_room_types: ['horseshoe'] },
  { id: 'crs-fin412', code: 'FIN-412', name: 'Fintech: Foundations & Applications', department: 'Finance', credit_hours: 3, required_room_types: ['computer_lab'] },
  { id: 'crs-mgt408', code: 'MGT-408', name: 'ELP - 2', department: 'Management', credit_hours: 3, required_room_types: ['horseshoe'] },
  { id: 'crs-tax401', code: 'TAX-401', name: 'Advanced Taxation', department: 'Accounting', credit_hours: 3, required_room_types: ['computer_lab'] },
  { id: 'crs-mgt205', code: 'MGT-205', name: 'Human Resource Management', department: 'Management', credit_hours: 3, required_room_types: ['standard'] },
  { id: 'crs-mkt201', code: 'MKT-201', name: 'Consumer Behaviour', department: 'Marketing', credit_hours: 3, required_room_types: ['standard'] },
  { id: 'crs-acc306', code: 'ACC-306', name: 'Accounting for Management Decisions', department: 'Accounting', credit_hours: 3, required_room_types: ['standard'] },
  { id: 'crs-fin306', code: 'FIN-306', name: 'Securities Trading & Applied Economics', department: 'Finance', credit_hours: 3, required_room_types: ['standard'] },
  { id: 'crs-eco401', code: 'ECO-401', name: 'Pakistan Economy', department: 'Economics', credit_hours: 3, required_room_types: ['computer_lab'] },
  { id: 'crs-hum205', code: 'HUM-205', name: 'Behavioral Science', department: 'Humanities', credit_hours: 3, required_room_types: ['horseshoe'] },
  { id: 'crs-lan304', code: 'LAN-304', name: 'Foreign Language', department: 'Humanities', credit_hours: 3, required_room_types: ['horseshoe'] },
  { id: 'crs-mgt301', code: 'MGT-301', name: 'Operations and Project Management', department: 'Management', credit_hours: 3, required_room_types: ['standard'] },
  { id: 'crs-mkt413', code: 'MKT-413', name: 'New Product Management', department: 'Marketing', credit_hours: 3, required_room_types: ['standard'] },
  { id: 'crs-scm418', code: 'SCM-418', name: 'Import and Export Management', department: 'Supply Chain', credit_hours: 3, required_room_types: ['standard'] },
  { id: 'crs-hrm412', code: 'HRM-412', name: 'Industrial Relations and Labour Laws', department: 'HR', credit_hours: 3, required_room_types: ['standard'] },
  { id: 'crs-mgt404', code: 'MGT-404', name: 'Business Simulations', department: 'Management', credit_hours: 3, required_room_types: ['computer_lab'] },
  { id: 'crs-mkt401', code: 'MKT-401', name: 'Marketing Research', department: 'Marketing', credit_hours: 3, required_room_types: ['computer_lab'] },
  { id: 'crs-mkt407', code: 'MKT-407', name: 'Advertising', department: 'Marketing', credit_hours: 3, required_room_types: ['standard'] },
  { id: 'crs-scm419', code: 'SCM-419', name: 'SCM Sustainability', department: 'Supply Chain', credit_hours: 3, required_room_types: ['standard'] },
  { id: 'crs-hrm411', code: 'HRM-411', name: 'Workforce Planning and Analytics', department: 'HR', credit_hours: 3, required_room_types: ['standard'] },
  { id: 'crs-hum401', code: 'HUM-401', name: 'Business Ethics', department: 'Humanities', credit_hours: 3, required_room_types: ['standard'] },
];

export const INITIAL_STUDENTS: Student[] = [
  { id: 'std-1', roll_number: 'BAN-2024-001', name: 'Muhammad Ali', email: 'ali.ban@student.univ.edu', batch_id: 'batch-ban-2', is_irregular: false },
  { id: 'std-2', roll_number: 'AF-2024-045', name: 'Fatima Zahra', email: 'fatima.af@student.univ.edu', batch_id: 'batch-bsaf-2', is_irregular: false },
  { id: 'std-3', roll_number: 'BBA-2024-012', name: 'Usman Ghani', email: 'usman.bba@student.univ.edu', batch_id: 'batch-bba-2', is_irregular: false },
];

export const INITIAL_COMPLETED_COURSES: StudentCourseCompleted[] = [
  { id: 'scc-1', student_id: 'std-1', course_id: 'crs-gen111', grade: 'A', semester_completed: 'Spring 2026' },
];

// All running timetable sessions extracted from the 4 department schedules
export const INITIAL_SESSIONS: ClassSession[] = [
  // ==========================================
  // BS (BUSINESS ANALYTICS) - BAN
  // ==========================================
  // BAN-2
  { id: 'sess-ban2-1', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-acc106', faculty_id: 'fac-abid-khan', room_id: 'room-tf-306', batch_id: 'batch-ban-2', day_of_week: 3, start_time: '08:30', end_time: '10:30', session_type: 'regular', status: 'published' },
  { id: 'sess-ban2-2', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-acc106', faculty_id: 'fac-abid-khan', room_id: 'room-tf-306', batch_id: 'batch-ban-2', day_of_week: 4, start_time: '13:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-ban2-3', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-eco102', faculty_id: 'fac-waleed-wasti', room_id: 'room-tf-306', batch_id: 'batch-ban-2', day_of_week: 4, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },
  { id: 'sess-ban2-4', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-gen111', faculty_id: 'fac-hafiz-shayan', room_id: 'room-frf-404', batch_id: 'batch-ban-2', day_of_week: 3, start_time: '13:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-ban2-5', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-ist101', faculty_id: 'fac-sumaira-ashraf', room_id: 'room-tf-306', batch_id: 'batch-ban-2', day_of_week: 1, start_time: '13:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-ban2-6', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-mkt101', faculty_id: 'fac-shamaila-burney', room_id: 'room-frf-402', batch_id: 'batch-ban-2', day_of_week: 1, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },
  { id: 'sess-ban2-7', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-mth108', faculty_id: 'fac-musawwir', room_id: 'room-tf-306', batch_id: 'batch-ban-2', day_of_week: 2, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },

  // BAN-3
  { id: 'sess-ban3-1', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-fin206', faculty_id: 'fac-abdullah-idrees', room_id: 'room-tf-301', batch_id: 'batch-ban-3', day_of_week: 3, start_time: '12:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-ban3-2', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-eng105', faculty_id: 'fac-sabeen-amjad', room_id: 'room-frf-404', batch_id: 'batch-ban-3', day_of_week: 2, start_time: '12:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-ban3-3', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-gen112', faculty_id: 'fac-hafiz-shayan', room_id: 'room-frf-405', batch_id: 'batch-ban-3', day_of_week: 4, start_time: '13:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-ban3-4', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-hus202', faculty_id: 'fac-memoona-shahzad', room_id: 'room-a-04', batch_id: 'batch-ban-3', day_of_week: 2, start_time: '08:30', end_time: '10:30', session_type: 'regular', status: 'published' },
  { id: 'sess-ban3-5', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-mth210', faculty_id: 'fac-gul-munir', room_id: 'room-frf-401', batch_id: 'batch-ban-3', day_of_week: 1, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },
  { id: 'sess-ban3-6', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-mth104', faculty_id: 'fac-mohammad-omar', room_id: 'room-tf-308', batch_id: 'batch-ban-3', day_of_week: 1, start_time: '12:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-ban3-7', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-pst102', faculty_id: 'fac-zubair-shah', room_id: 'room-frf-404', batch_id: 'batch-ban-3', day_of_week: 3, start_time: '08:30', end_time: '10:30', session_type: 'regular', status: 'published' },

  // BAN-4
  { id: 'sess-ban4-1', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-eco203', faculty_id: 'fac-waleed-wasti', room_id: 'room-tf-308', batch_id: 'batch-ban-4', day_of_week: 2, start_time: '12:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-ban4-2', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-fin204', faculty_id: 'fac-misbah-iqbal', room_id: 'room-tf-302', batch_id: 'batch-ban-4', day_of_week: 3, start_time: '12:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-ban4-3', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-pdv203', faculty_id: 'fac-rizwan-akram', room_id: 'room-frf-405', batch_id: 'batch-ban-4', day_of_week: 1, start_time: '13:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  // BAN-202 (Friday 8:30-11:30 has NO ROOM PROVIDED -> Alert!)
  { id: 'sess-ban4-4a', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-ban202', faculty_id: 'fac-ateeque-rahman', room_id: 'room-sf-206', batch_id: 'batch-ban-4', day_of_week: 2, start_time: '08:30', end_time: '10:30', session_type: 'regular', status: 'published' },
  { id: 'sess-ban4-4b', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-ban202', faculty_id: 'fac-mariyam-khan', room_id: null, batch_id: 'batch-ban-4', day_of_week: 5, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },
  { id: 'sess-ban4-4c', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-ban202', faculty_id: 'fac-mariyam-khan', room_id: 'room-ff-103', batch_id: 'batch-ban-4', day_of_week: 5, start_time: '11:30', end_time: '12:30', session_type: 'regular', status: 'published' },
  // PST-101 (Mehak Kanwal Mon 11:00-13:00 has NO ROOM PROVIDED -> Alert!)
  { id: 'sess-ban4-5', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-pst101', faculty_id: 'fac-mehak-kanwal', room_id: null, batch_id: 'batch-ban-4', day_of_week: 1, start_time: '11:00', end_time: '13:00', session_type: 'regular', status: 'published' },
  { id: 'sess-ban4-6', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-mth304', faculty_id: 'fac-mohammad-omar', room_id: 'room-sf-209', batch_id: 'batch-ban-4', day_of_week: 3, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },

  // ==========================================
  // BS (ACTUARIAL SCIENCE) - ARM
  // ==========================================
  // ARM-3
  { id: 'sess-arm3-1', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-fin206', faculty_id: 'fac-abdullah-idrees', room_id: 'room-tf-301', batch_id: 'batch-arm-3', day_of_week: 3, start_time: '12:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-arm3-2', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-eng105', faculty_id: 'fac-sabeen-amjad', room_id: 'room-frf-404', batch_id: 'batch-arm-3', day_of_week: 2, start_time: '12:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-arm3-3', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-gen112', faculty_id: 'fac-hafiz-shayan', room_id: 'room-frf-405', batch_id: 'batch-arm-3', day_of_week: 4, start_time: '13:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-arm3-4', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-hus202', faculty_id: 'fac-memoona-shahzad', room_id: 'room-a-04', batch_id: 'batch-arm-3', day_of_week: 2, start_time: '08:30', end_time: '10:30', session_type: 'regular', status: 'published' },
  { id: 'sess-arm3-5', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-mth210', faculty_id: 'fac-gul-munir', room_id: 'room-frf-401', batch_id: 'batch-arm-3', day_of_week: 1, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },
  { id: 'sess-arm3-6', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-mth104', faculty_id: 'fac-mohammad-omar', room_id: 'room-tf-308', batch_id: 'batch-arm-3', day_of_week: 1, start_time: '12:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-arm3-7', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-pst102', faculty_id: 'fac-zubair-shah', room_id: 'room-frf-404', batch_id: 'batch-arm-3', day_of_week: 3, start_time: '08:30', end_time: '10:30', session_type: 'regular', status: 'published' },

  // ARM-5 (All RM courses have NO ROOM PROVIDED -> Alert!)
  { id: 'sess-arm5-1', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-rm301', faculty_id: 'fac-sarmad-hassan', room_id: null, batch_id: 'batch-arm-5', day_of_week: 1, start_time: '09:00', end_time: '10:30', session_type: 'regular', status: 'published' },
  { id: 'sess-arm5-2', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-rm302', faculty_id: 'fac-fakhir-musharraf', room_id: null, batch_id: 'batch-arm-5', day_of_week: 1, start_time: '12:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-arm5-3', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-rm304', faculty_id: 'fac-sarmad-hassan', room_id: null, batch_id: 'batch-arm-5', day_of_week: 3, start_time: '09:00', end_time: '10:30', session_type: 'regular', status: 'published' },
  { id: 'sess-arm5-4', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-fin314', faculty_id: 'fac-fakhir-musharraf', room_id: null, batch_id: 'batch-arm-5', day_of_week: 3, start_time: '12:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-arm5-5', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-eng306', faculty_id: 'fac-qaiser-hussain', room_id: 'room-frf-404', batch_id: 'batch-arm-5', day_of_week: 4, start_time: '12:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-arm5-6', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-fin302', faculty_id: 'fac-nayeem-ansari', room_id: 'room-frf-401', batch_id: 'batch-arm-5', day_of_week: 4, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },

  // ARM-6
  { id: 'sess-arm6-1', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-rm301', faculty_id: 'fac-sarmad-hassan', room_id: null, batch_id: 'batch-arm-6', day_of_week: 1, start_time: '09:00', end_time: '10:30', session_type: 'regular', status: 'published' },
  { id: 'sess-arm6-2', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-rm302', faculty_id: 'fac-fakhir-musharraf', room_id: null, batch_id: 'batch-arm-6', day_of_week: 1, start_time: '12:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-arm6-3', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-rm304', faculty_id: 'fac-sarmad-hassan', room_id: null, batch_id: 'batch-arm-6', day_of_week: 3, start_time: '09:00', end_time: '10:30', session_type: 'regular', status: 'published' },
  { id: 'sess-arm6-4', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-fin314', faculty_id: 'fac-fakhir-musharraf', room_id: null, batch_id: 'batch-arm-6', day_of_week: 3, start_time: '12:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-arm6-5', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-mgt407', faculty_id: 'fac-pervaiz-mobin', room_id: 'room-frf-402', batch_id: 'batch-arm-6', day_of_week: 4, start_time: '12:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-arm6-6', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-fin315', faculty_id: 'fac-waleed-wasti', room_id: null, batch_id: 'batch-arm-6', day_of_week: 2, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },

  // ==========================================
  // BS (ACCOUNTING & FINANCE) - BS(AF)
  // ==========================================
  // BS(AF) - 2
  { id: 'sess-af2-1', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-acc106', faculty_id: 'fac-abid-khan', room_id: 'room-tf-306', batch_id: 'batch-bsaf-2', day_of_week: 3, start_time: '08:30', end_time: '10:30', session_type: 'regular', status: 'published' },
  { id: 'sess-af2-2', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-eco102', faculty_id: 'fac-waleed-wasti', room_id: 'room-tf-306', batch_id: 'batch-bsaf-2', day_of_week: 4, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },
  { id: 'sess-af2-3', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-gen111', faculty_id: 'fac-hafiz-shayan', room_id: 'room-frf-404', batch_id: 'batch-bsaf-2', day_of_week: 3, start_time: '13:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-af2-4', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-ist101', faculty_id: 'fac-sumaira-ashraf', room_id: 'room-tf-306', batch_id: 'batch-bsaf-2', day_of_week: 1, start_time: '13:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-af2-5', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-mkt101', faculty_id: 'fac-shamaila-burney', room_id: 'room-frf-402', batch_id: 'batch-bsaf-2', day_of_week: 1, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },
  { id: 'sess-af2-6', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-mth108', faculty_id: 'fac-musawwir', room_id: 'room-tf-306', batch_id: 'batch-bsaf-2', day_of_week: 2, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },

  // BS(AF) - 3A (HUS-202 has NO ROOM PROVIDED -> Alert!)
  { id: 'sess-af3a-1', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-eng105', faculty_id: 'fac-sabeen-amjad', room_id: 'room-frf-404', batch_id: 'batch-bsaf-3a', day_of_week: 2, start_time: '12:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-af3a-2', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-fin206', faculty_id: 'fac-abdullah-idrees', room_id: 'room-tf-301', batch_id: 'batch-bsaf-3a', day_of_week: 3, start_time: '12:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-af3a-3', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-gen112', faculty_id: 'fac-hafiz-shayan', room_id: 'room-frf-405', batch_id: 'batch-bsaf-3a', day_of_week: 4, start_time: '13:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-af3a-4', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-hus202', faculty_id: 'fac-memoona-shahzad', room_id: null, batch_id: 'batch-bsaf-3a', day_of_week: 2, start_time: '08:30', end_time: '10:30', session_type: 'regular', status: 'published' },
  { id: 'sess-af3a-5', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-mgt201', faculty_id: 'fac-kousar-zaheer', room_id: 'room-tf-301', batch_id: 'batch-bsaf-3a', day_of_week: 4, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },
  { id: 'sess-af3a-6', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-mth104', faculty_id: 'fac-mohammad-omar', room_id: 'room-tf-309', batch_id: 'batch-bsaf-3a', day_of_week: 1, start_time: '12:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-af3a-7', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-pst102', faculty_id: 'fac-zubair-shah', room_id: 'room-frf-404', batch_id: 'batch-bsaf-3a', day_of_week: 3, start_time: '08:30', end_time: '10:30', session_type: 'regular', status: 'published' },

  // BS(AF) - 3B (HUS-202 has NO ROOM PROVIDED -> Alert!)
  { id: 'sess-af3b-1', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-eng105', faculty_id: 'fac-sabeen-amjad', room_id: 'room-frf-405', batch_id: 'batch-bsaf-3b', day_of_week: 2, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },
  { id: 'sess-af3b-2', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-fin206', faculty_id: 'fac-abdullah-idrees', room_id: 'room-frf-402', batch_id: 'batch-bsaf-3b', day_of_week: 3, start_time: '09:00', end_time: '12:00', session_type: 'regular', status: 'published' },
  { id: 'sess-af3b-3', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-gen112', faculty_id: 'fac-hafiz-shayan', room_id: 'room-frf-405', batch_id: 'batch-bsaf-3b', day_of_week: 4, start_time: '13:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-af3b-4', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-hus202', faculty_id: 'fac-memoona-shahzad', room_id: null, batch_id: 'batch-bsaf-3b', day_of_week: 2, start_time: '13:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-af3b-5', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-mgt201', faculty_id: 'fac-shah-saleem', room_id: 'room-frf-405', batch_id: 'batch-bsaf-3b', day_of_week: 3, start_time: '12:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-af3b-6', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-mth104', faculty_id: 'fac-mohammad-omar', room_id: 'room-tf-309', batch_id: 'batch-bsaf-3b', day_of_week: 1, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },
  { id: 'sess-af3b-7', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-pst102', faculty_id: 'fac-zubair-shah', room_id: 'room-frf-406', batch_id: 'batch-bsaf-3b', day_of_week: 3, start_time: '08:30', end_time: '10:30', session_type: 'regular', status: 'published' },

  // BS(AF) - 3C (HUS-202 and MGT-201 have NO ROOM PROVIDED -> Alert!)
  { id: 'sess-af3c-1', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-eng105', faculty_id: 'fac-sana-javed', room_id: 'room-frf-406', batch_id: 'batch-bsaf-3c', day_of_week: 3, start_time: '12:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-af3c-2', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-fin206', faculty_id: 'fac-nayeem-ansari', room_id: 'room-tf-302', batch_id: 'batch-bsaf-3c', day_of_week: 5, start_time: '09:00', end_time: '12:00', session_type: 'regular', status: 'published' },
  { id: 'sess-af3c-3', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-gen112', faculty_id: 'fac-hafiz-shayan', room_id: 'room-frf-406', batch_id: 'batch-bsaf-3c', day_of_week: 2, start_time: '08:30', end_time: '10:30', session_type: 'regular', status: 'published' },
  { id: 'sess-af3c-4', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-hus202', faculty_id: 'fac-memoona-shahzad', room_id: null, batch_id: 'batch-bsaf-3c', day_of_week: 1, start_time: '13:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-af3c-5', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-mgt201', faculty_id: 'fac-khalida-khan', room_id: null, batch_id: 'batch-bsaf-3c', day_of_week: 3, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },
  { id: 'sess-af3c-6', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-mth104', faculty_id: 'fac-mohammad-omar', room_id: 'room-tf-309', batch_id: 'batch-bsaf-3c', day_of_week: 2, start_time: '12:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-af3c-7', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-pst102', faculty_id: 'fac-kanwal-munir', room_id: 'room-frf-406', batch_id: 'batch-bsaf-3c', day_of_week: 1, start_time: '08:30', end_time: '10:30', session_type: 'regular', status: 'published' },

  // BS(AF) - 4 (ACC-203 Cost Management has NO ROOM PROVIDED -> Alert!)
  { id: 'sess-af4-1', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-acc201', faculty_id: 'fac-ghulam-mustafa', room_id: 'room-tf-307', batch_id: 'batch-bsaf-4', day_of_week: 2, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },
  { id: 'sess-af4-2', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-acc203', faculty_id: 'fac-sarmad-hassan', room_id: null, batch_id: 'batch-bsaf-4', day_of_week: 1, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },
  { id: 'sess-af4-3', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-eco203', faculty_id: 'fac-waleed-wasti', room_id: 'room-tf-308', batch_id: 'batch-bsaf-4', day_of_week: 2, start_time: '12:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-af4-4', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-fin204', faculty_id: 'fac-misbah-iqbal', room_id: 'room-tf-302', batch_id: 'batch-bsaf-4', day_of_week: 3, start_time: '12:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-af4-5', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-fin207', faculty_id: 'fac-adnan-ali', room_id: 'room-tf-307', batch_id: 'batch-bsaf-4', day_of_week: 3, start_time: '08:30', end_time: '10:30', session_type: 'regular', status: 'published' },
  { id: 'sess-af4-6', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-pdv203', faculty_id: 'fac-rizwan-akram', room_id: 'room-frf-405', batch_id: 'batch-bsaf-4', day_of_week: 1, start_time: '12:00', end_time: '14:00', session_type: 'regular', status: 'published' },

  // BS(AF) - 5 (ACC-210 has NO ROOM PROVIDED -> Alert!)
  { id: 'sess-af5-1', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-acc210', faculty_id: 'fac-shaikh-bilal', room_id: null, batch_id: 'batch-bsaf-5', day_of_week: 3, start_time: '12:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-af5-2', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-acc303', faculty_id: 'fac-abid-khan', room_id: 'room-tf-306', batch_id: 'batch-bsaf-5', day_of_week: 2, start_time: '12:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-af5-3', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-eng306', faculty_id: 'fac-qaiser-hussain', room_id: 'room-frf-404', batch_id: 'batch-bsaf-5', day_of_week: 4, start_time: '12:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-af5-4', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-fin302', faculty_id: 'fac-nayeem-ansari', room_id: 'room-frf-401', batch_id: 'batch-bsaf-5', day_of_week: 4, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },
  { id: 'sess-af5-5', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-law202', faculty_id: 'fac-jibran-sartaj', room_id: 'room-sf-201', batch_id: 'batch-bsaf-5', day_of_week: 2, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },
  { id: 'sess-af5-6', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-mth304', faculty_id: 'fac-mohammad-omar', room_id: 'room-tf-310', batch_id: 'batch-bsaf-5', day_of_week: 3, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },

  // BS(AF) - 6
  { id: 'sess-af6-1', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-acc304', faculty_id: 'fac-sarmad-hassan', room_id: 'room-tf-306', batch_id: 'batch-bsaf-6', day_of_week: 3, start_time: '12:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-af6-2', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-acc302', faculty_id: 'fac-musawwir', room_id: 'room-tf-310', batch_id: 'batch-bsaf-6', day_of_week: 4, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },
  { id: 'sess-af6-3', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-csc307', faculty_id: 'fac-yasar-rizwan', room_id: 'room-tf-310', batch_id: 'batch-bsaf-6', day_of_week: 4, start_time: '12:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-af6-4', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-fin304', faculty_id: 'fac-sarmad-hassan', room_id: 'room-frf-401', batch_id: 'batch-bsaf-6', day_of_week: 3, start_time: '12:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-af6-5', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-fin303', faculty_id: 'fac-nadeem-hanif', room_id: 'room-sf-201', batch_id: 'batch-bsaf-6', day_of_week: 3, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },
  { id: 'sess-af6-6', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-mgt305', faculty_id: 'fac-khalida-khan', room_id: 'room-tf-310', batch_id: 'batch-bsaf-6', day_of_week: 1, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },

  // BS(AF) - 7 (FIN-409 has NO ROOM PROVIDED -> Alert!)
  { id: 'sess-af7-1', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-acc402', faculty_id: 'fac-shariq-waqar', room_id: 'room-tf-310', batch_id: 'batch-bsaf-7', day_of_week: 2, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },
  { id: 'sess-af7-2', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-fin409', faculty_id: 'fac-nayeem-ansari', room_id: null, batch_id: 'batch-bsaf-7', day_of_week: 2, start_time: '12:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-af7-3', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-fin411', faculty_id: 'fac-misbah-iqbal', room_id: 'room-tf-307', batch_id: 'batch-bsaf-7', day_of_week: 4, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },
  { id: 'sess-af7-4', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-mgt401', faculty_id: 'fac-rehan-butt', room_id: 'room-tf-307', batch_id: 'batch-bsaf-7', day_of_week: 1, start_time: '12:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-af7-5', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-mgt407', faculty_id: 'fac-pervaiz-mobin', room_id: 'room-frf-402', batch_id: 'batch-bsaf-7', day_of_week: 4, start_time: '12:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-af7-6', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-acc404', faculty_id: 'fac-quaid-johar', room_id: 'room-tf-306', batch_id: 'batch-bsaf-7', day_of_week: 5, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },
  { id: 'sess-af7-7', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-fin417', faculty_id: 'fac-misbah-iqbal', room_id: 'room-tf-307', batch_id: 'batch-bsaf-7', day_of_week: 1, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },
  { id: 'sess-af7-8', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-mgt406', faculty_id: 'fac-ekhlaque-ahmed', room_id: 'room-sf-201', batch_id: 'batch-bsaf-7', day_of_week: 4, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },
  { id: 'sess-af7-9', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-fin412', faculty_id: 'fac-zuhair-mohsin', room_id: 'room-tf-309', batch_id: 'batch-bsaf-7', day_of_week: 2, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },
  { id: 'sess-af7-10', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-mgt408', faculty_id: 'fac-pervaiz-mobin', room_id: 'room-tf-307', batch_id: 'batch-bsaf-7', day_of_week: 4, start_time: '12:00', end_time: '15:00', session_type: 'regular', status: 'published' },

  // BS(AF) - 8
  { id: 'sess-af8-1', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-acc404', faculty_id: 'fac-quaid-johar', room_id: 'room-tf-306', batch_id: 'batch-bsaf-8', day_of_week: 5, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },
  { id: 'sess-af8-2', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-fin417', faculty_id: 'fac-misbah-iqbal', room_id: 'room-tf-307', batch_id: 'batch-bsaf-8', day_of_week: 1, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },
  { id: 'sess-af8-3', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-tax401', faculty_id: 'fac-khalid-petiwala', room_id: 'room-tf-308', batch_id: 'batch-bsaf-8', day_of_week: 3, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },

  // ==========================================
  // BBA
  // ==========================================
  // BBA - 2
  { id: 'sess-bba2-1', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-acc106', faculty_id: 'fac-abid-khan', room_id: 'room-tf-301', batch_id: 'batch-bba-2', day_of_week: 1, start_time: '13:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-bba2-2', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-eco102', faculty_id: 'fac-waleed-wasti', room_id: 'room-tf-301', batch_id: 'batch-bba-2', day_of_week: 3, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },
  { id: 'sess-bba2-3', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-eco103', faculty_id: 'fac-waleed-wasti', room_id: 'room-tf-301', batch_id: 'batch-bba-2', day_of_week: 4, start_time: '13:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-bba2-4', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-gen111', faculty_id: 'fac-hafiz-shayan', room_id: 'room-frf-404', batch_id: 'batch-bba-2', day_of_week: 4, start_time: '08:30', end_time: '10:30', session_type: 'regular', status: 'published' },
  { id: 'sess-bba2-5', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-ist101', faculty_id: 'fac-hafiz-shayan', room_id: 'room-frf-406', batch_id: 'batch-bba-2', day_of_week: 2, start_time: '13:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-bba2-6', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-mkt101', faculty_id: 'fac-saman', room_id: 'room-tf-301', batch_id: 'batch-bba-2', day_of_week: 2, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },
  { id: 'sess-bba2-7', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-mth108', faculty_id: 'fac-musawwir', room_id: 'room-tf-301', batch_id: 'batch-bba-2', day_of_week: 1, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },

  // BBA - 4
  { id: 'sess-bba4-1', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-eco203', faculty_id: 'fac-waleed-wasti', room_id: 'room-tf-308', batch_id: 'batch-bba-4', day_of_week: 2, start_time: '12:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-bba4-2', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-fin204', faculty_id: 'fac-misbah-iqbal', room_id: 'room-tf-302', batch_id: 'batch-bba-4', day_of_week: 3, start_time: '12:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-bba4-3', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-mgt205', faculty_id: 'fac-priyanka-bajaj', room_id: 'room-tf-311', batch_id: 'batch-bba-4', day_of_week: 3, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },
  { id: 'sess-bba4-4', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-mkt201', faculty_id: 'fac-shah-saleem', room_id: 'room-tf-311', batch_id: 'batch-bba-4', day_of_week: 2, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },
  { id: 'sess-bba4-5', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-mth210', faculty_id: 'fac-gul-munir', room_id: 'room-frf-401', batch_id: 'batch-bba-4', day_of_week: 1, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },
  { id: 'sess-bba4-6', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-pdv203', faculty_id: 'fac-rizwan-akram', room_id: 'room-frf-405', batch_id: 'batch-bba-4', day_of_week: 1, start_time: '12:00', end_time: '14:00', session_type: 'regular', status: 'published' },

  // BBA - 5 (ACC-306, FIN-306, MTH-304 have NO ROOM PROVIDED -> Alert!)
  { id: 'sess-bba5-1', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-acc306', faculty_id: 'fac-sarmad-hassan', room_id: null, batch_id: 'batch-bba-5', day_of_week: 1, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },
  { id: 'sess-bba5-2', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-eng306', faculty_id: 'fac-qaiser-hussain', room_id: 'room-frf-404', batch_id: 'batch-bba-5', day_of_week: 4, start_time: '12:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-bba5-3', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-fin306', faculty_id: 'fac-abid-khan', room_id: null, batch_id: 'batch-bba-5', day_of_week: 2, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },
  { id: 'sess-bba5-4', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-fin302', faculty_id: 'fac-nayeem-ansari', room_id: 'room-frf-401', batch_id: 'batch-bba-5', day_of_week: 4, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },
  { id: 'sess-bba5-5', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-law202', faculty_id: 'fac-jibran-sartaj', room_id: 'room-sf-201', batch_id: 'batch-bba-5', day_of_week: 2, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },
  { id: 'sess-bba5-6', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-mth304', faculty_id: 'fac-mohammad-omar', room_id: null, batch_id: 'batch-bba-5', day_of_week: 3, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },

  // BBA - 6 (MGT-301, MKT-413, SCM-418, HRM-412 have NO ROOM PROVIDED -> Alert!)
  { id: 'sess-bba6-1', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-eco401', faculty_id: 'fac-asif-shamim', room_id: 'room-sf-209', batch_id: 'batch-bba-6', day_of_week: 2, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },
  { id: 'sess-bba6-2', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-hum205', faculty_id: 'fac-rizwan-akram', room_id: 'room-tf-302', batch_id: 'batch-bba-6', day_of_week: 2, start_time: '12:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-bba6-3', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-lan304', faculty_id: 'fac-hunain', room_id: 'room-tf-301', batch_id: 'batch-bba-6', day_of_week: 5, start_time: '09:00', end_time: '12:00', session_type: 'regular', status: 'published' },
  { id: 'sess-bba6-4', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-mgt301', faculty_id: 'fac-zeeshan-ahmed', room_id: null, batch_id: 'batch-bba-6', day_of_week: 4, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },
  { id: 'sess-bba6-5', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-mgt305', faculty_id: 'fac-khalida-khan', room_id: 'room-tf-310', batch_id: 'batch-bba-6', day_of_week: 1, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },
  { id: 'sess-bba6-6', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-mkt413', faculty_id: 'fac-ekhlaque-ahmed', room_id: null, batch_id: 'batch-bba-6', day_of_week: 3, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },
  { id: 'sess-bba6-7', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-scm418', faculty_id: 'fac-raheel', room_id: null, batch_id: 'batch-bba-6', day_of_week: 3, start_time: '12:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-bba6-8', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-hrm412', faculty_id: 'fac-pervaiz-mobin', room_id: null, batch_id: 'batch-bba-6', day_of_week: 3, start_time: '12:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-bba6-9', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-acc304', faculty_id: 'fac-sarmad-hassan', room_id: 'room-tf-306', batch_id: 'batch-bba-6', day_of_week: 3, start_time: '12:00', end_time: '15:00', session_type: 'regular', status: 'published' },

  // BBA - 7
  { id: 'sess-bba7-1', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-mgt401', faculty_id: 'fac-rehan-butt', room_id: 'room-tf-301', batch_id: 'batch-bba-7', day_of_week: 1, start_time: '12:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-bba7-2', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-mgt404', faculty_id: 'fac-hassaan-ahmed', room_id: 'room-tf-310', batch_id: 'batch-bba-7', day_of_week: 2, start_time: '12:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-bba7-3', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-mgt407', faculty_id: 'fac-pervaiz-mobin', room_id: 'room-frf-402', batch_id: 'batch-bba-7', day_of_week: 4, start_time: '12:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-bba7-4', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-mkt401', faculty_id: 'fac-faisal-shaikh', room_id: 'room-a-08', batch_id: 'batch-bba-7', day_of_week: 1, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },
  { id: 'sess-bba7-5', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-mkt407', faculty_id: 'fac-kousar-zaheer', room_id: null, batch_id: 'batch-bba-7', day_of_week: 2, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },
  { id: 'sess-bba7-6', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-scm419', faculty_id: 'fac-fahad-anwar', room_id: null, batch_id: 'batch-bba-7', day_of_week: 2, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },
  { id: 'sess-bba7-7', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-hrm411', faculty_id: 'fac-priyanka-bajaj', room_id: null, batch_id: 'batch-bba-7', day_of_week: 5, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },

  // BBA - 8 (HUM-401 has NO ROOM PROVIDED -> Alert!)
  { id: 'sess-bba8-1', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-hum401', faculty_id: 'fac-shah-saleem', room_id: null, batch_id: 'batch-bba-8', day_of_week: 2, start_time: '12:00', end_time: '15:00', session_type: 'regular', status: 'published' },
  { id: 'sess-bba8-2', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-mgt406', faculty_id: 'fac-ekhlaque-ahmed', room_id: 'room-sf-201', batch_id: 'batch-bba-8', day_of_week: 4, start_time: '08:30', end_time: '11:30', session_type: 'regular', status: 'published' },
  { id: 'sess-bba8-3', semester_id: '11111111-1111-1111-1111-111111111111', course_id: 'crs-mgt408', faculty_id: 'fac-pervaiz-mobin', room_id: 'room-tf-307', batch_id: 'batch-bba-8', day_of_week: 4, start_time: '12:00', end_time: '15:00', session_type: 'regular', status: 'published' },
];

export const INITIAL_ADVISING_SUGGESTIONS: AdvisingSuggestion[] = [];

export const INITIAL_AUDIT_LOG: AuditLogEntry[] = [
  {
    id: 'log-1',
    changed_by: 'Administrator',
    change_type: 'ROLLOVER',
    description: 'Imported current institutional timetable for BBA, BS(AF), BAN, and ARM degree programs.',
    timestamp: new Date().toISOString(),
  },
];

export const INITIAL_MAKEUP_REQUESTS: MakeupRequest[] = [];
