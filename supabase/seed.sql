-- ============================================================================
-- Seed Data for University Timetable & Resource Scheduling System
-- Populated with Current Active Institutional Timetables:
-- Programs: BBA, BS (Accounting & Finance), BS (Business Analytics), BS (Actuarial Science)
-- ============================================================================

-- Clean previous seed tables
TRUNCATE TABLE class_sessions, advising_suggestions, makeup_requests, student_courses_completed, students, course_prerequisites, courses, batches, batch_merge_groups, faculty, rooms, semester_calendar, semesters, timetable_versions CASCADE;

-- 1. Semesters
INSERT INTO semesters (id, name, academic_year, start_date, end_date, is_active)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Current Academic Term', '2026-2027', '2026-09-01', '2027-01-30', true);

-- 2. Semester Calendar
INSERT INTO semester_calendar (id, semester_id, event_name, event_type, start_date, end_date, description)
VALUES
    ('ca100001-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Midterm Examination Week', 'midterm_week', '2026-10-26', '2026-10-31', 'Regular classes suspended for midterms');

-- 3. Rooms
INSERT INTO rooms (id, name, building, floor, capacity, room_types)
VALUES
    ('a0000000-0000-0000-0000-000000000000', '⚠️ Room Not Assigned (Pending)', 'TBD', 0, 60, ARRAY['standard']),
    ('a0000001-0000-0000-0000-000000000001', 'TF-306 (3rd Floor Lecture Hall)', 'Academic Tower 3', 3, 60, ARRAY['standard', 'multimedia']),
    ('a0000001-0000-0000-0000-000000000002', 'FRF-404 (4th Floor Lecture Hall)', 'Faculty Block 4', 4, 55, ARRAY['standard', 'multimedia']),
    ('a0000001-0000-0000-0000-000000000003', 'FRF-402 (4th Floor Horseshoe)', 'Faculty Block 4', 4, 75, ARRAY['horseshoe', 'multimedia', 'interactive_lcd']),
    ('a0000001-0000-0000-0000-000000000004', 'TF-301 (3rd Floor Horseshoe)', 'Academic Tower 3', 3, 75, ARRAY['horseshoe', 'multimedia', 'interactive_lcd']),
    ('a0000001-0000-0000-0000-000000000005', 'FRF-405 (4th Floor Lecture Hall)', 'Faculty Block 4', 4, 50, ARRAY['standard', 'multimedia']),
    ('a0000001-0000-0000-0000-000000000006', 'A-04 (Ground Floor Classroom)', 'Block A', 0, 45, ARRAY['standard']),
    ('a0000001-0000-0000-0000-000000000007', 'FRF-401 (4th Floor Horseshoe)', 'Faculty Block 4', 4, 75, ARRAY['horseshoe', 'multimedia']),
    ('a0000001-0000-0000-0000-000000000008', 'TF-308 (3rd Floor Language Lab)', 'Academic Tower 3', 3, 40, ARRAY['computer_lab', 'multimedia']),
    ('a0000001-0000-0000-0000-000000000009', 'TF-302 (3rd Floor Horseshoe)', 'Academic Tower 3', 3, 70, ARRAY['horseshoe', 'multimedia']),
    ('a0000001-0000-0000-0000-000000000010', 'SF-209 (2nd Floor Language Lab)', 'Science Wing 2', 2, 40, ARRAY['computer_lab', 'multimedia']),
    ('a0000001-0000-0000-0000-000000000011', 'SF-206 (2nd Floor Lecture Hall)', 'Science Wing 2', 2, 55, ARRAY['standard', 'multimedia']),
    ('a0000001-0000-0000-0000-000000000012', 'FF-103 (1st Floor Lecture Hall)', 'First Floor Wing', 1, 50, ARRAY['standard']),
    ('a0000001-0000-0000-0000-000000000013', 'TF-307 (3rd Floor Horseshoe)', 'Academic Tower 3', 3, 75, ARRAY['horseshoe', 'multimedia', 'interactive_lcd']),
    ('a0000001-0000-0000-0000-000000000014', 'TF-309 (3rd Floor IT Lab)', 'Academic Tower 3', 3, 45, ARRAY['computer_lab', 'multimedia']),
    ('a0000001-0000-0000-0000-000000000015', 'TF-310 (3rd Floor IT Lab)', 'Academic Tower 3', 3, 45, ARRAY['computer_lab', 'multimedia']),
    ('a0000001-0000-0000-0000-000000000016', 'TF-311 (3rd Floor Lecture Hall)', 'Academic Tower 3', 3, 55, ARRAY['standard', 'multimedia']),
    ('a0000001-0000-0000-0000-000000000017', 'FRF-406 (4th Floor Lecture Hall)', 'Faculty Block 4', 4, 50, ARRAY['standard', 'multimedia']),
    ('a0000001-0000-0000-0000-000000000018', 'SF-201 (2nd Floor Horseshoe)', 'Science Wing 2', 2, 75, ARRAY['horseshoe', 'multimedia']),
    ('a0000001-0000-0000-0000-000000000019', 'A-08 (Computer Lab 1 Ground Fl)', 'Block A', 0, 45, ARRAY['computer_lab', 'multimedia']);

-- 4. Faculty
INSERT INTO faculty (id, name, email, department, max_load_per_day)
VALUES
    ('f0000001-0000-0000-0000-000000000001', 'Abid Khan', 'abid.khan@univ.edu', 'Accounting & Finance', 4),
    ('f0000001-0000-0000-0000-000000000002', 'Waleed Wasti', 'waleed.wasti@univ.edu', 'Economics', 4),
    ('f0000001-0000-0000-0000-000000000003', 'Hafiz Shayan', 'hafiz.shayan@univ.edu', 'Islamic Studies', 4),
    ('f0000001-0000-0000-0000-000000000004', 'Sumaira Ashraf', 'sumaira.ashraf@univ.edu', 'Humanities & Islamic', 3),
    ('f0000001-0000-0000-0000-000000000005', 'Shamaila Burney', 'shamaila.burney@univ.edu', 'Marketing', 3),
    ('f0000001-0000-0000-0000-000000000006', 'Musawwir Ali Soomro', 'musawwir@univ.edu', 'Mathematics & Statistics', 4),
    ('f0000001-0000-0000-0000-000000000007', 'Mr Muhammad Abdullah Idrees', 'abdullah.idrees@univ.edu', 'Finance', 4),
    ('f0000001-0000-0000-0000-000000000008', 'Sabeen Amjad', 'sabeen.amjad@univ.edu', 'Communication', 4),
    ('f0000001-0000-0000-0000-000000000009', 'Memoona Shahzad', 'memoona.shahzad@univ.edu', 'Social Sciences', 4),
    ('f0000001-0000-0000-0000-000000000010', 'Gul Munir Deedar Ali', 'gul.munir@univ.edu', 'Mathematics', 4),
    ('f0000001-0000-0000-0000-000000000011', 'Mohammad Omar', 'mohammad.omar@univ.edu', 'Business Analytics', 4),
    ('f0000001-0000-0000-0000-000000000012', 'Zubair Shah', 'zubair.shah@univ.edu', 'Pakistan Studies', 4),
    ('f0000001-0000-0000-0000-000000000013', 'Misbah Iqbal', 'misbah.iqbal@univ.edu', 'Finance', 4),
    ('f0000001-0000-0000-0000-000000000014', 'Muhammad Rizwan Akram', 'rizwan.akram@univ.edu', 'Humanities', 4),
    ('f0000001-0000-0000-0000-000000000015', 'Ateeque Rahman', 'ateeque.rahman@univ.edu', 'Computer Science', 4),
    ('f0000001-0000-0000-0000-000000000016', 'Mariyam Khan', 'mariyam.khan@univ.edu', 'Computer Science', 4),
    ('f0000001-0000-0000-0000-000000000017', 'Mehak Kanwal', 'mehak.kanwal@univ.edu', 'Pakistan Studies', 3),
    ('f0000001-0000-0000-0000-000000000018', 'Syed Sarmad Hassan', 'sarmad.hassan@univ.edu', 'Accounting & Risk', 5),
    ('f0000001-0000-0000-0000-000000000019', 'Muhammad Fakhir Musharraf', 'fakhir.musharraf@univ.edu', 'Actuarial Science & Risk', 5),
    ('f0000001-0000-0000-0000-000000000020', 'Syed Qaiser Hussain', 'qaiser.hussain@univ.edu', 'Business Communication', 4),
    ('f0000001-0000-0000-0000-000000000021', 'Nayeem Ul Hasan Ansari', 'nayeem.ansari@univ.edu', 'Finance & Markets', 4),
    ('f0000001-0000-0000-0000-000000000022', 'Pervaiz Mobin', 'pervaiz.mobin@univ.edu', 'Management & Projects', 5),
    ('f0000001-0000-0000-0000-000000000023', 'Kousar Zaheer', 'kousar.zaheer@univ.edu', 'Management & Marketing', 4),
    ('f0000001-0000-0000-0000-000000000024', 'Shah Muhammad Saleem', 'shah.saleem@univ.edu', 'Management & Marketing', 4),
    ('f0000001-0000-0000-0000-000000000025', 'Sana Javed', 'sana.javed@univ.edu', 'Communication', 4),
    ('f0000001-0000-0000-0000-000000000026', 'Khalida Khan', 'khalida.khan@univ.edu', 'Management', 4),
    ('f0000001-0000-0000-0000-000000000027', 'Kanwal Munir', 'kanwal.munir@univ.edu', 'Social Studies', 3),
    ('f0000001-0000-0000-0000-000000000028', 'Ghulam Mustafa', 'ghulam.mustafa@univ.edu', 'Accounting', 4),
    ('f0000001-0000-0000-0000-000000000029', 'Adnan Ali', 'adnan.ali@univ.edu', 'Accounting & Finance', 3),
    ('f0000001-0000-0000-0000-000000000030', 'Shaikh Bilal', 'shaikh.bilal@univ.edu', 'Audit & Accounting', 3),
    ('f0000001-0000-0000-0000-000000000031', 'Jibran Sartaj', 'jibran.sartaj@univ.edu', 'Business Law', 4),
    ('f0000001-0000-0000-0000-000000000032', 'Yasar Rizwan', 'yasar.rizwan@univ.edu', 'MIS & ERP', 4),
    ('f0000001-0000-0000-0000-000000000033', 'Muhammad Nadeem Hanif', 'nadeem.hanif@univ.edu', 'Finance & Regulations', 4),
    ('f0000001-0000-0000-0000-000000000034', 'Shariq Waqar', 'shariq.waqar@univ.edu', 'Taxation & Accounting', 4),
    ('f0000001-0000-0000-0000-000000000035', 'Rehan Muzamil Butt', 'rehan.butt@univ.edu', 'Entrepreneurship', 4),
    ('f0000001-0000-0000-0000-000000000036', 'Quaid Johar', 'quaid.johar@univ.edu', 'Audit & Assurance', 4),
    ('f0000001-0000-0000-0000-000000000037', 'Ekhlaque Ahmed', 'ekhlaque.ahmed@univ.edu', 'Marketing & Strategy', 5),
    ('f0000001-0000-0000-0000-000000000038', 'Zuhair Mohsin', 'zuhair.mohsin@univ.edu', 'Fintech', 3),
    ('f0000001-0000-0000-0000-000000000039', 'Khalid Petiwala', 'khalid.petiwala@univ.edu', 'Advanced Taxation', 3),
    ('f0000001-0000-0000-0000-000000000040', 'Saman', 'saman@univ.edu', 'Marketing', 3),
    ('f0000001-0000-0000-0000-000000000041', 'Priyanka Bajaj', 'priyanka.bajaj@univ.edu', 'HR & Management', 4),
    ('f0000001-0000-0000-0000-000000000042', 'Asif Shamim', 'asif.shamim@univ.edu', 'Economics', 3),
    ('f0000001-0000-0000-0000-000000000043', 'Hunain', 'hunain@univ.edu', 'Foreign Languages', 3),
    ('f0000001-0000-0000-0000-000000000044', 'Zeeshan Ahmed', 'zeeshan.ahmed@univ.edu', 'Project Management', 3),
    ('f0000001-0000-0000-0000-000000000045', 'Raheel', 'raheel@univ.edu', 'Supply Chain Management', 4),
    ('f0000001-0000-0000-0000-000000000046', 'Hassaan Ahmed', 'hassaan.ahmed@univ.edu', 'Business Simulations', 3),
    ('f0000001-0000-0000-0000-000000000047', 'Faisal Shaikh', 'faisal.shaikh@univ.edu', 'Marketing Research', 3),
    ('f0000001-0000-0000-0000-000000000048', 'Muhammad Fahad Anwar', 'fahad.anwar@univ.edu', 'SCM Sustainability', 3);

-- 5. Batches
INSERT INTO batches (id, name, program, semester, student_count)
VALUES
    ('b0000001-0000-0000-0000-000000000001', 'BAN - 2', 'BS (Business Analytics)', 2, 45),
    ('b0000001-0000-0000-0000-000000000002', 'BAN - 3', 'BS (Business Analytics)', 3, 40),
    ('b0000001-0000-0000-0000-000000000003', 'BAN - 4', 'BS (Business Analytics)', 4, 38),
    ('b0000001-0000-0000-0000-000000000004', 'ARM - 3', 'BS (Actuarial Science)', 3, 35),
    ('b0000001-0000-0000-0000-000000000005', 'ARM - 5', 'BS (Actuarial Science)', 5, 30),
    ('b0000001-0000-0000-0000-000000000006', 'ARM - 6', 'BS (Actuarial Science)', 6, 28),
    ('b0000001-0000-0000-0000-000000000007', 'BS(AF) - 2', 'BS (Accounting & Finance)', 2, 50),
    ('b0000001-0000-0000-0000-000000000008', 'BS(AF) - 3A', 'BS (Accounting & Finance)', 3, 45),
    ('b0000001-0000-0000-0000-000000000009', 'BS(AF) - 3B', 'BS (Accounting & Finance)', 3, 45),
    ('b0000001-0000-0000-0000-000000000010', 'BS(AF) - 3C', 'BS (Accounting & Finance)', 3, 45),
    ('b0000001-0000-0000-0000-000000000011', 'BS(AF) - 4', 'BS (Accounting & Finance)', 4, 48),
    ('b0000001-0000-0000-0000-000000000012', 'BS(AF) - 5', 'BS (Accounting & Finance)', 5, 42),
    ('b0000001-0000-0000-0000-000000000013', 'BS(AF) - 6', 'BS (Accounting & Finance)', 6, 40),
    ('b0000001-0000-0000-0000-000000000014', 'BS(AF) - 7', 'BS (Accounting & Finance)', 7, 38),
    ('b0000001-0000-0000-0000-000000000015', 'BS(AF) - 8', 'BS (Accounting & Finance)', 8, 35),
    ('b0000001-0000-0000-0000-000000000016', 'BBA - 2', 'BBA', 2, 55),
    ('b0000001-0000-0000-0000-000000000017', 'BBA - 3A', 'BBA', 3, 45),
    ('b0000001-0000-0000-0000-000000000018', 'BBA - 3B', 'BBA', 3, 45),
    ('b0000001-0000-0000-0000-000000000019', 'BBA - 3C', 'BBA', 3, 45),
    ('b0000001-0000-0000-0000-000000000020', 'BBA - 4', 'BBA', 4, 50),
    ('b0000001-0000-0000-0000-000000000021', 'BBA - 5', 'BBA', 5, 48),
    ('b0000001-0000-0000-0000-000000000022', 'BBA - 6', 'BBA', 6, 45),
    ('b0000001-0000-0000-0000-000000000023', 'BBA - 7', 'BBA', 7, 42),
    ('b0000001-0000-0000-0000-000000000024', 'BBA - 8', 'BBA', 8, 40);

-- 6. Courses
INSERT INTO courses (id, code, name, department, credit_hours, required_room_types)
VALUES
    ('c0000001-0000-0000-0000-000000000001', 'ACC-106', 'Financial Accounting and Corporate Reporting', 'Accounting', 3, ARRAY['standard']),
    ('c0000001-0000-0000-0000-000000000002', 'ECO-102', 'Microeconomics', 'Economics', 3, ARRAY['standard']),
    ('c0000001-0000-0000-0000-000000000003', 'ECO-103', 'Globalization & Development', 'Economics', 3, ARRAY['standard']),
    ('c0000001-0000-0000-0000-000000000004', 'GEN-111', 'Fehm-ul-Quran - I', 'Islamic Studies', 2, ARRAY['standard']),
    ('c0000001-0000-0000-0000-000000000005', 'IST-101', 'Islamic Studies', 'Islamic Studies', 2, ARRAY['standard']),
    ('c0000001-0000-0000-0000-000000000006', 'MKT-101', 'Principles of Marketing', 'Marketing', 3, ARRAY['horseshoe']),
    ('c0000001-0000-0000-0000-000000000007', 'MTH-108', 'Business Mathematics and Statistics', 'Mathematics', 3, ARRAY['standard']),
    ('c0000001-0000-0000-0000-000000000008', 'FIN-206', 'Introduction to Finance', 'Finance', 3, ARRAY['horseshoe']),
    ('c0000001-0000-0000-0000-000000000009', 'ENG-105', 'Presentation and Communication Skills', 'Communication', 3, ARRAY['standard']),
    ('c0000001-0000-0000-0000-000000000010', 'GEN-112', 'Fehm-ul-Quran - II', 'Islamic Studies', 2, ARRAY['standard']),
    ('c0000001-0000-0000-0000-000000000011', 'HUS-202', 'Service Learning & Civic Responsibility', 'Social Sciences', 2, ARRAY['standard']),
    ('c0000001-0000-0000-0000-000000000012', 'MTH-210', 'Calculus with Applications', 'Mathematics', 3, ARRAY['horseshoe']),
    ('c0000001-0000-0000-0000-000000000013', 'MTH-104', 'Introduction to Business Analytics', 'Business Analytics', 3, ARRAY['computer_lab']),
    ('c0000001-0000-0000-0000-000000000014', 'PST-102', 'Ideology and Constitution of Pakistan', 'Pakistan Studies', 2, ARRAY['standard']),
    ('c0000001-0000-0000-0000-000000000015', 'ECO-203', 'Macroeconomics', 'Economics', 3, ARRAY['computer_lab']),
    ('c0000001-0000-0000-0000-000000000016', 'FIN-204', 'Financial Management', 'Finance', 3, ARRAY['horseshoe']),
    ('c0000001-0000-0000-0000-000000000017', 'PDV-203', 'Arts and Literature', 'Humanities', 2, ARRAY['standard']),
    ('c0000001-0000-0000-0000-000000000018', 'BAN-202', 'Computer Programming - II', 'Computer Science', 3, ARRAY['computer_lab']),
    ('c0000001-0000-0000-0000-000000000019', 'PST-101', 'Pakistan Studies', 'Pakistan Studies', 2, ARRAY['standard']),
    ('c0000001-0000-0000-0000-000000000020', 'MTH-304', 'Business Analytics (Modeling & Forecasting)', 'Business Analytics', 3, ARRAY['computer_lab']),
    ('c0000001-0000-0000-0000-000000000021', 'RM-301', 'Takaful and Islamic Risk Management', 'Actuarial Science', 3, ARRAY['standard']),
    ('c0000001-0000-0000-0000-000000000022', 'RM-302', 'Financial Risk Management - I', 'Actuarial Science', 3, ARRAY['standard']),
    ('c0000001-0000-0000-0000-000000000023', 'RM-304', 'Insurtech and Risktech', 'Actuarial Science', 3, ARRAY['standard']),
    ('c0000001-0000-0000-0000-000000000024', 'FIN-314', 'Regulation for Insurance and Actuarial Science', 'Actuarial Science', 3, ARRAY['standard']),
    ('c0000001-0000-0000-0000-000000000025', 'ENG-306', 'Applied Business Communication', 'Communication', 3, ARRAY['standard']),
    ('c0000001-0000-0000-0000-000000000026', 'FIN-302', 'Financial Institutions and Markets', 'Finance', 3, ARRAY['horseshoe']),
    ('c0000001-0000-0000-0000-000000000027', 'MGT-407', 'Capstone Project I', 'Management', 3, ARRAY['horseshoe']),
    ('c0000001-0000-0000-0000-000000000028', 'FIN-315', 'Financial Econometrics', 'Finance', 3, ARRAY['standard']),
    ('c0000001-0000-0000-0000-000000000029', 'MGT-201', 'Organizational Behavior and Leadership', 'Management', 3, ARRAY['horseshoe']),
    ('c0000001-0000-0000-0000-000000000030', 'ACC-201', 'Advanced Financial Accounting and Reporting', 'Accounting', 3, ARRAY['horseshoe']),
    ('c0000001-0000-0000-0000-000000000031', 'ACC-203', 'Cost Management', 'Accounting', 3, ARRAY['standard']),
    ('c0000001-0000-0000-0000-000000000032', 'FIN-207', 'Emerging Trends in Accounting & Finance', 'Finance', 3, ARRAY['horseshoe']),
    ('c0000001-0000-0000-0000-000000000033', 'ACC-210', 'Audit and Assurance', 'Accounting', 3, ARRAY['standard']),
    ('c0000001-0000-0000-0000-000000000034', 'ACC-303', 'Performance Management', 'Accounting', 3, ARRAY['standard']),
    ('c0000001-0000-0000-0000-000000000035', 'LAW-202', 'Legal Environment for Business in Pakistan', 'Law', 3, ARRAY['horseshoe']),
    ('c0000001-0000-0000-0000-000000000036', 'ACC-304', 'Financial Statement Analysis', 'Accounting', 3, ARRAY['standard']),
    ('c0000001-0000-0000-0000-000000000037', 'ACC-302', 'Data Analytics for Accounting & Finance', 'Accounting', 3, ARRAY['computer_lab']),
    ('c0000001-0000-0000-0000-000000000038', 'CSC-307', 'Introduction to MIS and ERP', 'MIS', 3, ARRAY['computer_lab']),
    ('c0000001-0000-0000-0000-000000000039', 'FIN-304', 'Investment Analysis', 'Finance', 3, ARRAY['horseshoe']),
    ('c0000001-0000-0000-0000-000000000040', 'FIN-303', 'Regulations & Financial Markets', 'Finance', 3, ARRAY['horseshoe']),
    ('c0000001-0000-0000-0000-000000000041', 'MGT-305', 'Business Research Methods', 'Management', 3, ARRAY['computer_lab']),
    ('c0000001-0000-0000-0000-000000000042', 'ACC-402', 'Principles of Taxation', 'Accounting', 3, ARRAY['computer_lab']),
    ('c0000001-0000-0000-0000-000000000043', 'FIN-409', 'Derivative & Risk Management', 'Finance', 3, ARRAY['standard']),
    ('c0000001-0000-0000-0000-000000000044', 'FIN-411', 'Islamic Finance', 'Finance', 3, ARRAY['horseshoe']),
    ('c0000001-0000-0000-0000-000000000045', 'MGT-401', 'Entrepreneurship', 'Management', 3, ARRAY['horseshoe']),
    ('c0000001-0000-0000-0000-000000000046', 'ACC-404', 'Advanced Audit and Assurance', 'Accounting', 3, ARRAY['standard']),
    ('c0000001-0000-0000-0000-000000000047', 'FIN-417', 'Strategic Business Finance', 'Finance', 3, ARRAY['horseshoe']),
    ('c0000001-0000-0000-0000-000000000048', 'MGT-406', 'Business Strategy', 'Management', 3, ARRAY['horseshoe']),
    ('c0000001-0000-0000-0000-000000000049', 'FIN-412', 'Fintech: Foundations & Applications', 'Finance', 3, ARRAY['computer_lab']),
    ('c0000001-0000-0000-0000-000000000050', 'MGT-408', 'ELP - 2', 'Management', 3, ARRAY['horseshoe']),
    ('c0000001-0000-0000-0000-000000000051', 'TAX-401', 'Advanced Taxation', 'Accounting', 3, ARRAY['computer_lab']),
    ('c0000001-0000-0000-0000-000000000052', 'MGT-205', 'Human Resource Management', 'Management', 3, ARRAY['standard']),
    ('c0000001-0000-0000-0000-000000000053', 'MKT-201', 'Consumer Behaviour', 'Marketing', 3, ARRAY['standard']),
    ('c0000001-0000-0000-0000-000000000054', 'ACC-306', 'Accounting for Management Decisions', 'Accounting', 3, ARRAY['standard']),
    ('c0000001-0000-0000-0000-000000000055', 'FIN-306', 'Securities Trading & Applied Economics', 'Finance', 3, ARRAY['standard']),
    ('c0000001-0000-0000-0000-000000000056', 'ECO-401', 'Pakistan Economy', 'Economics', 3, ARRAY['computer_lab']),
    ('c0000001-0000-0000-0000-000000000057', 'HUM-205', 'Behavioral Science', 'Humanities', 3, ARRAY['horseshoe']),
    ('c0000001-0000-0000-0000-000000000058', 'LAN-304', 'Foreign Language', 'Humanities', 3, ARRAY['horseshoe']),
    ('c0000001-0000-0000-0000-000000000059', 'MGT-301', 'Operations and Project Management', 'Management', 3, ARRAY['standard']),
    ('c0000001-0000-0000-0000-000000000060', 'MKT-413', 'New Product Management', 'Marketing', 3, ARRAY['standard']),
    ('c0000001-0000-0000-0000-000000000061', 'SCM-418', 'Import and Export Management', 'Supply Chain', 3, ARRAY['standard']),
    ('c0000001-0000-0000-0000-000000000062', 'HRM-412', 'Industrial Relations and Labour Laws', 'HR', 3, ARRAY['standard']),
    ('c0000001-0000-0000-0000-000000000063', 'MGT-404', 'Business Simulations', 'Management', 3, ARRAY['computer_lab']),
    ('c0000001-0000-0000-0000-000000000064', 'MKT-401', 'Marketing Research', 'Marketing', 3, ARRAY['computer_lab']),
    ('c0000001-0000-0000-0000-000000000065', 'MKT-407', 'Advertising', 'Marketing', 3, ARRAY['standard']),
    ('c0000001-0000-0000-0000-000000000066', 'SCM-419', 'SCM Sustainability', 'Supply Chain', 3, ARRAY['standard']),
    ('c0000001-0000-0000-0000-000000000067', 'HRM-411', 'Workforce Planning and Analytics', 'HR', 3, ARRAY['standard']),
    ('c0000001-0000-0000-0000-000000000068', 'HUM-401', 'Business Ethics', 'Humanities', 3, ARRAY['standard']);

-- 7. Class Sessions (Published Active Timetable)
-- Note: Sessions without specified rooms use room ID 'a0000000-0000-0000-0000-000000000000' (Unassigned Room)
INSERT INTO class_sessions (id, semester_id, course_id, faculty_id, room_id, batch_id, day_of_week, start_time, end_time, session_type, status)
VALUES
    -- BAN - 2
    ('90000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000001', 'f0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 3, '08:30:00', '10:30:00', 'regular', 'published'),
    ('90000001-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000001', 'f0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 4, '13:00:00', '15:00:00', 'regular', 'published'),
    ('90000001-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000002', 'f0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 4, '08:30:00', '11:30:00', 'regular', 'published'),
    ('90000001-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000004', 'f0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000001', 3, '13:00:00', '15:00:00', 'regular', 'published'),
    ('90000001-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000005', 'f0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 1, '13:00:00', '15:00:00', 'regular', 'published'),
    ('90000001-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000006', 'f0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000001', 1, '08:30:00', '11:30:00', 'regular', 'published'),
    ('90000001-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000007', 'f0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 2, '08:30:00', '11:30:00', 'regular', 'published'),

    -- BAN - 3
    ('90000001-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000008', 'f0000001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000002', 3, '12:00:00', '15:00:00', 'regular', 'published'),
    ('90000001-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000009', 'f0000001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000002', 2, '12:00:00', '15:00:00', 'regular', 'published'),
    ('90000001-0000-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000010', 'f0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000005', 'b0000001-0000-0000-0000-000000000002', 4, '13:00:00', '15:00:00', 'regular', 'published'),
    ('90000001-0000-0000-0000-000000000011', '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000011', 'f0000001-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000006', 'b0000001-0000-0000-0000-000000000002', 2, '08:30:00', '10:30:00', 'regular', 'published'),
    ('90000001-0000-0000-0000-000000000012', '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000012', 'f0000001-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000007', 'b0000001-0000-0000-0000-000000000002', 1, '08:30:00', '11:30:00', 'regular', 'published'),
    ('90000001-0000-0000-0000-000000000013', '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000013', 'f0000001-0000-0000-0000-000000000011', 'a0000001-0000-0000-0000-000000000008', 'b0000001-0000-0000-0000-000000000002', 1, '12:00:00', '15:00:00', 'regular', 'published'),
    ('90000001-0000-0000-0000-000000000014', '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000014', 'f0000001-0000-0000-0000-000000000012', 'a0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000002', 3, '08:30:00', '10:30:00', 'regular', 'published'),

    -- BAN - 4
    ('90000001-0000-0000-0000-000000000015', '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000015', 'f0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000008', 'b0000001-0000-0000-0000-000000000003', 2, '12:00:00', '15:00:00', 'regular', 'published'),
    ('90000001-0000-0000-0000-000000000016', '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000016', 'f0000001-0000-0000-0000-000000000013', 'a0000001-0000-0000-0000-000000000009', 'b0000001-0000-0000-0000-000000000003', 3, '12:00:00', '15:00:00', 'regular', 'published'),
    ('90000001-0000-0000-0000-000000000017', '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000017', 'f0000001-0000-0000-0000-000000000014', 'a0000001-0000-0000-0000-000000000005', 'b0000001-0000-0000-0000-000000000003', 1, '13:00:00', '15:00:00', 'regular', 'published'),
    -- BAN-202 Unassigned room on Friday 8:30-11:30
    ('90000001-0000-0000-0000-000000000018', '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000018', 'f0000001-0000-0000-0000-000000000015', 'a0000001-0000-0000-0000-000000000011', 'b0000001-0000-0000-0000-000000000003', 2, '08:30:00', '10:30:00', 'regular', 'published'),
    ('90000001-0000-0000-0000-000000000019', '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000018', 'f0000001-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000000', 'b0000001-0000-0000-0000-000000000003', 5, '08:30:00', '11:30:00', 'regular', 'published'),
    ('90000001-0000-0000-0000-000000000020', '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000018', 'f0000001-0000-0000-0000-000000000016', 'a0000001-0000-0000-0000-000000000012', 'b0000001-0000-0000-0000-000000000003', 5, '11:30:00', '12:30:00', 'regular', 'published'),
    -- PST-101 Unassigned room
    ('90000001-0000-0000-0000-000000000021', '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000019', 'f0000001-0000-0000-0000-000000000017', 'a0000000-0000-0000-0000-000000000000', 'b0000001-0000-0000-0000-000000000003', 1, '11:00:00', '13:00:00', 'regular', 'published'),
    ('90000001-0000-0000-0000-000000000022', '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000020', 'f0000001-0000-0000-0000-000000000011', 'a0000001-0000-0000-0000-000000000010', 'b0000001-0000-0000-0000-000000000003', 3, '08:30:00', '11:30:00', 'regular', 'published'),

    -- ARM-5 Unassigned rooms
    ('90000001-0000-0000-0000-000000000023', '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000021', 'f0000001-0000-0000-0000-000000000018', 'a0000000-0000-0000-0000-000000000000', 'b0000001-0000-0000-0000-000000000005', 1, '09:00:00', '10:30:00', 'regular', 'published'),
    ('90000001-0000-0000-0000-000000000024', '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000022', 'f0000001-0000-0000-0000-000000000019', 'a0000000-0000-0000-0000-000000000000', 'b0000001-0000-0000-0000-000000000005', 1, '12:00:00', '15:00:00', 'regular', 'published'),
    ('90000001-0000-0000-0000-000000000025', '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000023', 'f0000001-0000-0000-0000-000000000018', 'a0000000-0000-0000-0000-000000000000', 'b0000001-0000-0000-0000-000000000005', 3, '09:00:00', '10:30:00', 'regular', 'published'),
    ('90000001-0000-0000-0000-000000000026', '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000024', 'f0000001-0000-0000-0000-000000000019', 'a0000000-0000-0000-0000-000000000000', 'b0000001-0000-0000-0000-000000000005', 3, '12:00:00', '15:00:00', 'regular', 'published'),
    ('90000001-0000-0000-0000-000000000027', '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000025', 'f0000001-0000-0000-0000-000000000020', 'a0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000005', 4, '12:00:00', '15:00:00', 'regular', 'published'),
    ('90000001-0000-0000-0000-000000000028', '11111111-1111-1111-1111-111111111111', 'c0000001-0000-0000-0000-000000000026', 'f0000001-0000-0000-0000-000000000021', 'a0000001-0000-0000-0000-000000000007', 'b0000001-0000-0000-0000-000000000005', 4, '08:30:00', '11:30:00', 'regular', 'published');

ON CONFLICT DO NOTHING;
