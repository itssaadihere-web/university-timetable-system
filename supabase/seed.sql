-- ============================================================================
-- Seed Data for University Timetable & Resource Scheduling System
-- Note: All UUIDs strictly use valid 32-hex digits (0-9, a-f) in 8-4-4-4-12 format
-- ============================================================================

-- 1. Semesters
INSERT INTO semesters (id, name, academic_year, start_date, end_date, is_active)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Fall 2026', '2026-2027', '2026-09-01', '2027-01-20', true),
    ('22222222-2222-2222-2222-222222222222', 'Spring 2027', '2026-2027', '2027-02-01', '2027-06-25', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Semester Calendar
INSERT INTO semester_calendar (id, semester_id, event_name, event_type, start_date, end_date, description)
VALUES
    ('ca100001-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Midterm Examination Week', 'midterm_week', '2026-10-26', '2026-10-31', 'Regular classes suspended for midterms'),
    ('ca100002-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Fall Break / National Holiday', 'holiday', '2026-11-20', '2026-11-22', 'Campus closed for public holidays'),
    ('ca100003-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Final Examination Period', 'finals_week', '2027-01-10', '2027-01-20', 'Final exam timetable applies')
ON CONFLICT (id) DO NOTHING;

-- 3. Rooms
INSERT INTO rooms (id, name, building, floor, capacity, room_types)
VALUES
    ('a0000001-0000-0000-0000-000000000001', 'Hall 101', 'Academic Block A', 1, 60, ARRAY['standard', 'multimedia']),
    ('a0000002-0000-0000-0000-000000000002', 'Hall 102', 'Academic Block A', 1, 55, ARRAY['standard']),
    ('a0000003-0000-0000-0000-000000000003', 'Horseshoe Amphitheater 201', 'Academic Block A', 2, 75, ARRAY['horseshoe', 'multimedia', 'interactive_lcd']),
    ('a0000004-0000-0000-0000-000000000004', 'Smart Classroom 202', 'Academic Block A', 2, 45, ARRAY['interactive_lcd', 'multimedia']),
    ('a0000005-0000-0000-0000-000000000005', 'CS Lab 301', 'Computing Center', 3, 40, ARRAY['computer_lab', 'multimedia']),
    ('a0000006-0000-0000-0000-000000000006', 'AI & Data Lab 302', 'Computing Center', 3, 40, ARRAY['computer_lab', 'multimedia', 'interactive_lcd']),
    ('a0000007-0000-0000-0000-000000000007', 'Seminar Hall 401', 'Executive Tower', 4, 120, ARRAY['horseshoe', 'multimedia', 'interactive_lcd']),
    ('a0000008-0000-0000-0000-000000000008', 'Room 105', 'Engineering Wing', 1, 50, ARRAY['standard', 'multimedia'])
ON CONFLICT (id) DO NOTHING;

-- 4. Faculty
INSERT INTO faculty (id, name, email, department, max_load_per_day, availability_window)
VALUES
    ('f0000001-0000-0000-0000-000000000001', 'Dr. Alan Turing', 'alan.turing@univ.edu', 'Computer Science', 3, '{"mon":["08:30-17:00"],"tue":["08:30-17:00"],"wed":["08:30-17:00"],"thu":["08:30-17:00"],"fri":["08:30-13:00"]}'::jsonb),
    ('f0000002-0000-0000-0000-000000000002', 'Prof. Ada Lovelace', 'ada.lovelace@univ.edu', 'Software Engineering', 4, '{"mon":["08:30-17:00"],"tue":["08:30-17:00"],"wed":["08:30-17:00"],"thu":["08:30-17:00"],"fri":["08:30-17:00"]}'::jsonb),
    ('f0000003-0000-0000-0000-000000000003', 'Dr. Claude Shannon', 'claude.shannon@univ.edu', 'Computer Science', 3, '{"mon":["10:00-17:00"],"wed":["10:00-17:00"],"fri":["10:00-17:00"]}'::jsonb),
    ('f0000004-0000-0000-0000-000000000004', 'Dr. Grace Hopper', 'grace.hopper@univ.edu', 'Computer Science', 4, '{"mon":["08:30-17:00"],"tue":["08:30-17:00"],"wed":["08:30-17:00"],"thu":["08:30-17:00"],"fri":["08:30-17:00"]}'::jsonb),
    ('f0000005-0000-0000-0000-000000000005', 'Prof. John von Neumann', 'john.neumann@univ.edu', 'Mathematics & AI', 3, '{"tue":["08:30-17:00"],"thu":["08:30-17:00"],"fri":["08:30-17:00"]}'::jsonb),
    ('f0000006-0000-0000-0000-000000000006', 'Dr. Margaret Hamilton', 'margaret.h@univ.edu', 'Software Engineering', 4, '{"mon":["08:30-17:00"],"tue":["08:30-17:00"],"wed":["08:30-17:00"],"thu":["08:30-17:00"],"fri":["08:30-17:00"]}'::jsonb),
    ('f0000007-0000-0000-0000-000000000007', 'Dr. Barbara Liskov', 'barbara.liskov@univ.edu', 'Information Systems', 3, '{"mon":["08:30-14:00"],"wed":["08:30-14:00"],"thu":["08:30-14:00"]}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 5. Batch Merge Groups
INSERT INTO batch_merge_groups (id, name)
VALUES 
    ('e0000001-0000-0000-0000-000000000001', 'Joint CS/SE Ethics & Professional Practices')
ON CONFLICT (id) DO NOTHING;

-- 6. Batches
INSERT INTO batches (id, name, program, semester, student_count, is_irregular, merge_group_id)
VALUES
    ('b0000001-0000-0000-0000-000000000001', 'BSCS-2024-A', 'Computer Science', 5, 45, false, 'e0000001-0000-0000-0000-000000000001'),
    ('b0000002-0000-0000-0000-000000000002', 'BSCS-2024-B', 'Computer Science', 5, 42, false, NULL),
    ('b0000003-0000-0000-0000-000000000003', 'BSSE-2024-A', 'Software Engineering', 5, 40, false, 'e0000001-0000-0000-0000-000000000001'),
    ('b0000004-0000-0000-0000-000000000004', 'BSAI-2025-A', 'Artificial Intelligence', 3, 38, false, NULL),
    ('b0000005-0000-0000-0000-000000000005', 'BSCS-2026-Freshmen', 'Computer Science', 1, 50, false, NULL),
    ('b0000006-0000-0000-0000-000000000006', 'IRREG-Fall26-Special', 'Computer Science (Irregular)', 5, 12, true, NULL)
ON CONFLICT (id) DO NOTHING;

-- 7. Courses
INSERT INTO courses (id, code, name, department, credit_hours, required_room_types)
VALUES
    ('c0000001-0000-0000-0000-000000000001', 'CS-101', 'Introduction to Computing', 'Computer Science', 3, ARRAY['standard']),
    ('c0000002-0000-0000-0000-000000000002', 'CS-201', 'Data Structures & Algorithms', 'Computer Science', 4, ARRAY['computer_lab', 'multimedia']),
    ('c0000003-0000-0000-0000-000000000003', 'CS-301', 'Database Systems', 'Computer Science', 3, ARRAY['multimedia']),
    ('c0000004-0000-0000-0000-000000000004', 'SE-302', 'Software Architecture & Design', 'Software Engineering', 3, ARRAY['multimedia', 'interactive_lcd']),
    ('c0000005-0000-0000-0000-000000000005', 'AI-401', 'Machine Learning & Deep Neural Nets', 'Artificial Intelligence', 4, ARRAY['computer_lab', 'multimedia']),
    ('c0000006-0000-0000-0000-000000000006', 'CS-305', 'Computer Networks & Security', 'Computer Science', 3, ARRAY['multimedia']),
    ('c0000007-0000-0000-0000-000000000007', 'HUM-201', 'Professional Ethics & Law', 'Humanities', 2, ARRAY['standard', 'horseshoe']),
    ('c0000008-0000-0000-0000-000000000008', 'CS-401', 'Cloud Computing & Distributed Systems', 'Computer Science', 3, ARRAY['multimedia'])
ON CONFLICT (id) DO NOTHING;

-- 8. Course Prerequisites
INSERT INTO course_prerequisites (course_id, required_course_id)
VALUES
    ('c0000002-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000001'), -- CS-201 requires CS-101
    ('c0000003-0000-0000-0000-000000000003', 'c0000002-0000-0000-0000-000000000002'), -- CS-301 requires CS-201
    ('c0000005-0000-0000-0000-000000000005', 'c0000002-0000-0000-0000-000000000002'), -- AI-401 requires CS-201
    ('c0000008-0000-0000-0000-000000000008', 'c0000006-0000-0000-0000-000000000006')  -- CS-401 requires CS-305
ON CONFLICT DO NOTHING;

-- 9. Students
INSERT INTO students (id, roll_number, name, email, batch_id, is_irregular)
VALUES
    ('d0000001-0000-0000-0000-000000000001', 'BCS-2024-001', 'Hamza Tariq', 'hamza.t@student.univ.edu', 'b0000001-0000-0000-0000-000000000001', false),
    ('d0000002-0000-0000-0000-000000000002', 'BCS-2024-045', 'Zainab Fatima', 'zainab.f@student.univ.edu', 'b0000001-0000-0000-0000-000000000001', false),
    ('d0000003-0000-0000-0000-000000000003', 'IRR-2023-019', 'Bilal Ahmed (Irregular/Transfer)', 'bilal.a@student.univ.edu', 'b0000006-0000-0000-0000-000000000006', true)
ON CONFLICT (id) DO NOTHING;

-- 10. Student Completed Courses
INSERT INTO student_courses_completed (student_id, course_id, grade, semester_completed)
VALUES
    ('d0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 'A', 'Spring 2025'),
    ('d0000001-0000-0000-0000-000000000001', 'c0000002-0000-0000-0000-000000000002', 'B+', 'Fall 2025'),
    ('d0000003-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000001', 'B', 'Fall 2024')
ON CONFLICT DO NOTHING;

-- 11. Initial Class Sessions (Respecting 15-min buffers and no clashes)
INSERT INTO class_sessions (id, semester_id, course_id, faculty_id, room_id, batch_id, batch_group_id, day_of_week, start_time, end_time, session_type, status)
VALUES
    -- Monday
    ('90000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'c0000003-0000-0000-0000-000000000003', 'f0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', NULL, 1, '08:30:00', '10:00:00', 'regular', 'published'),
    -- Buffer: 10:00 to 10:15 gap
    ('90000002-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'c0000002-0000-0000-0000-000000000002', 'f0000004-0000-0000-0000-000000000004', 'a0000005-0000-0000-0000-000000000005', 'b0000001-0000-0000-0000-000000000001', NULL, 1, '10:15:00', '11:45:00', 'regular', 'published'),
    
    -- Tuesday
    ('90000003-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'c0000004-0000-0000-0000-000000000004', 'f0000002-0000-0000-0000-000000000002', 'a0000004-0000-0000-0000-000000000004', 'b0000003-0000-0000-0000-000000000003', NULL, 2, '09:00:00', '10:30:00', 'regular', 'published'),
    ('90000004-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'c0000005-0000-0000-0000-000000000005', 'f0000005-0000-0000-0000-000000000005', 'a0000006-0000-0000-0000-000000000006', 'b0000004-0000-0000-0000-000000000004', NULL, 2, '11:00:00', '12:30:00', 'regular', 'published'),
    
    -- Wednesday (Merged Batch Session: Ethics in Horseshoe Hall)
    ('90000005-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'c0000007-0000-0000-0000-000000000007', 'f0000007-0000-0000-0000-000000000007', 'a0000003-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000001', 3, '13:00:00', '14:30:00', 'regular', 'published'),
    ('90000005-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'c0000007-0000-0000-0000-000000000007', 'f0000007-0000-0000-0000-000000000007', 'a0000003-0000-0000-0000-000000000003', 'b0000003-0000-0000-0000-000000000003', 'e0000001-0000-0000-0000-000000000001', 3, '13:00:00', '14:30:00', 'regular', 'published'),

    -- Thursday Draft Session (For testing Draft vs Published diffing)
    ('90000006-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'c0000008-0000-0000-0000-000000000008', 'f0000006-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', NULL, 4, '10:00:00', '11:30:00', 'regular', 'draft')
ON CONFLICT (id) DO NOTHING;

-- 12. Advising Suggestions (Soft-Conflicts queue for irregular student)
INSERT INTO advising_suggestions (id, student_id, flagged_course_id, clashing_course_id, reason, suggested_alternative, status, notes)
VALUES
    (
        'a0000001-1111-1111-1111-111111111111',
        'd0000003-0000-0000-0000-000000000003',
        'c0000003-0000-0000-0000-000000000003', -- CS-301
        NULL,
        'Prerequisite Unfulfilled: Student Bilal Ahmed has not completed CS-201 (Data Structures). Cannot enroll in CS-301.',
        '{"action":"enroll_prerequisite","recommended_course":"c0000002-0000-0000-0000-000000000002","alternative_slots":[{"day":1,"start":"10:15","end":"11:45"}]}'::jsonb,
        'pending',
        'Coordinator review required: Swap CS-301 for CS-201 repeat section'
    ),
    (
        'a0000002-2222-2222-2222-222222222222',
        'd0000003-0000-0000-0000-000000000003',
        'c0000006-0000-0000-0000-000000000006', -- CS-305
        'c0000004-0000-0000-0000-000000000004', -- SE-302
        'Elective Cross-Batch Clash: Student desired elective CS-305 overlaps with required department core SE-302 on Tuesday.',
        '{"action":"shift_slot","available_faculty_slots":[{"day":4,"start":"14:00","end":"15:30","faculty":"Dr. Claude Shannon"}]}'::jsonb,
        'pending',
        'Suggested shift: Move CS-305 to Thursday 14:00 where Dr. Shannon is free'
    )
ON CONFLICT (id) DO NOTHING;
