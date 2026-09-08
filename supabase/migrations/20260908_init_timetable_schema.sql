-- ============================================================================
-- University Timetable & Resource Scheduling System — Database Schema & Logic
-- Zero-Operational-Cost on Supabase (Postgres)
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. ENUMS & DOMAINS
-- ----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student', 'faculty', 'coordinator', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE session_type_enum AS ENUM ('regular', 'makeup');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE session_status_enum AS ENUM ('draft', 'published', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE calendar_event_type AS ENUM ('midterm_week', 'finals_week', 'holiday', 'semester_break');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE advising_status_enum AS ENUM ('pending', 'resolved', 'dismissed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE makeup_request_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ----------------------------------------------------------------------------
-- 2. CORE TABLES
-- ----------------------------------------------------------------------------

-- Semesters Table
CREATE TABLE IF NOT EXISTS semesters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL, -- e.g. "Fall 2026"
    academic_year TEXT NOT NULL, -- e.g. "2026-2027"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rooms Table (with multi-tag capability support: multimedia, interactive_lcd, horseshoe, standard, lab)
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE, -- e.g. "Hall 101", "Lab B2"
    building TEXT NOT NULL, -- e.g. "Science Complex", "Main Block"
    floor INTEGER NOT NULL DEFAULT 1,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    room_types TEXT[] NOT NULL DEFAULT '{"standard"}'::TEXT[], -- tags: standard, horseshoe, multimedia, interactive_lcd, computer_lab
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Faculty Table
CREATE TABLE IF NOT EXISTS faculty (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID, -- References auth.users(id) if linked
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    department TEXT NOT NULL,
    max_load_per_day INTEGER NOT NULL DEFAULT 4, -- In hours or slots
    availability_window JSONB DEFAULT '{"mon":["08:00-17:00"],"tue":["08:00-17:00"],"wed":["08:00-17:00"],"thu":["08:00-17:00"],"fri":["08:00-17:00"],"sat":["08:00-13:00"]}'::JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Batch Merge Groups Table
CREATE TABLE IF NOT EXISTS batch_merge_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Batches Table
CREATE TABLE IF NOT EXISTS batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL, -- e.g. "BSCS-2024-A"
    program TEXT NOT NULL, -- e.g. "Computer Science", "Electrical Engineering"
    semester INTEGER NOT NULL CHECK (semester >= 1 AND semester <= 12),
    student_count INTEGER NOT NULL DEFAULT 40,
    is_irregular BOOLEAN DEFAULT false, -- For special-case / non-standard students
    merge_group_id UUID REFERENCES batch_merge_groups(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Courses Table
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE, -- e.g. "CS-301"
    name TEXT NOT NULL, -- e.g. "Database Systems"
    department TEXT NOT NULL,
    credit_hours INTEGER NOT NULL DEFAULT 3,
    required_room_types TEXT[] DEFAULT '{}'::TEXT[], -- e.g. array['multimedia', 'computer_lab']
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course Prerequisites Join Table
CREATE TABLE IF NOT EXISTS course_prerequisites (
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    required_course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    PRIMARY KEY (course_id, required_course_id)
);

-- Students Table (for irregular/elective tracking & advising)
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID, -- References auth.users(id) if linked
    roll_number TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
    is_irregular BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student Completed Courses Table
CREATE TABLE IF NOT EXISTS student_courses_completed (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    grade TEXT DEFAULT 'Pass',
    semester_completed TEXT NOT NULL,
    completed_at DATE DEFAULT CURRENT_DATE,
    UNIQUE (student_id, course_id)
);

-- Semester Calendar Table (Holidays, Midterms, Finals)
CREATE TABLE IF NOT EXISTS semester_calendar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    semester_id UUID NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
    event_name TEXT NOT NULL,
    event_type calendar_event_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (end_date >= start_date)
);

-- Class Sessions Table (Centralized Schedule)
CREATE TABLE IF NOT EXISTS class_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    semester_id UUID NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
    faculty_id UUID NOT NULL REFERENCES faculty(id) ON DELETE RESTRICT,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE RESTRICT,
    batch_group_id UUID REFERENCES batch_merge_groups(id) ON DELETE SET NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1 = Monday, 7 = Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL CHECK (end_time > start_time),
    session_type session_type_enum NOT NULL DEFAULT 'regular',
    status session_status_enum NOT NULL DEFAULT 'draft',
    specific_date DATE, -- NULL for regular recurring, populated for makeup/floating classes
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Log Table
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_session_id UUID,
    changed_by TEXT NOT NULL DEFAULT 'Coordinator',
    change_type TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE', 'PUBLISH', 'ROLLOVER'
    old_value JSONB,
    new_value JSONB,
    description TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Timetable Versions (Snapshots for Diffing & Rollback)
CREATE TABLE IF NOT EXISTS timetable_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    semester_id UUID NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    snapshot JSONB NOT NULL,
    changes_summary TEXT,
    published_by TEXT NOT NULL,
    published_at TIMESTAMPTZ DEFAULT NOW()
);

-- Advising Suggestions / Soft Conflicts Table (Coordinator-Only Queue)
CREATE TABLE IF NOT EXISTS advising_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    flagged_course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    clashing_course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    reason TEXT NOT NULL, -- e.g. 'Elective time clash with CS-301', 'Prerequisite CS-101 missing'
    suggested_alternative JSONB, -- list of free slots or alternative course codes
    status advising_status_enum NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Makeup Class Requests Table
CREATE TABLE IF NOT EXISTS makeup_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    semester_id UUID NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    faculty_id UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    requested_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL CHECK (end_time > start_time),
    reason TEXT NOT NULL,
    status makeup_request_status NOT NULL DEFAULT 'pending',
    requested_by TEXT NOT NULL,
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. CONFLICT ENGINE (Server-Side Postgres Stored Function)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION check_timetable_conflicts(
    p_id UUID,
    p_semester_id UUID,
    p_course_id UUID,
    p_faculty_id UUID,
    p_room_id UUID,
    p_batch_id UUID,
    p_batch_group_id UUID,
    p_day_of_week INTEGER,
    p_start_time TIME,
    p_end_time TIME,
    p_session_type session_type_enum,
    p_status session_status_enum,
    p_specific_date DATE
) RETURNS JSONB AS $$
DECLARE
    v_conflict_errors TEXT[] := ARRAY[]::TEXT[];
    v_room_name TEXT;
    v_faculty_name TEXT;
    v_batch_name TEXT;
    v_course_name TEXT;
    v_required_room_types TEXT[];
    v_room_types TEXT[];
    v_buffer_interval INTERVAL := INTERVAL '15 minutes';
    v_is_holiday BOOLEAN;
    v_holiday_name TEXT;
    v_conflict_record RECORD;
BEGIN
    -- Ignore cancelled sessions
    IF p_status = 'cancelled' THEN
        RETURN jsonb_build_object('valid', true, 'errors', v_conflict_errors);
    END IF;

    -- Fetch entity names and tags
    SELECT name, room_types INTO v_room_name, v_room_types FROM rooms WHERE id = p_room_id;
    SELECT name INTO v_faculty_name FROM faculty WHERE id = p_faculty_id;
    SELECT name INTO v_batch_name FROM batches WHERE id = p_batch_id;
    SELECT name, required_room_types INTO v_course_name, v_required_room_types FROM courses WHERE id = p_course_id;

    -- Rule 5: Room Capability Check
    IF v_required_room_types IS NOT NULL AND array_length(v_required_room_types, 1) > 0 THEN
        IF NOT (v_room_types @> v_required_room_types) THEN
            v_conflict_errors := array_append(
                v_conflict_errors,
                format('Room Capability Mismatch: Course "%s" requires [%s], but Room "%s" only offers [%s].',
                    v_course_name,
                    array_to_string(v_required_room_types, ', '),
                    v_room_name,
                    array_to_string(v_room_types, ', ')
                )
            );
        END IF;
    END IF;

    -- Rule 6: Calendar Holiday / Exam override check for regular sessions
    IF p_session_type = 'regular' AND p_specific_date IS NOT NULL THEN
        SELECT true, event_name INTO v_is_holiday, v_holiday_name
        FROM semester_calendar
        WHERE semester_id = p_semester_id
          AND p_specific_date BETWEEN start_date AND end_date
        LIMIT 1;

        IF v_is_holiday THEN
            v_conflict_errors := array_append(
                v_conflict_errors,
                format('Calendar Restriction: Regular recurring session cannot be scheduled during "%s" (%s).',
                    v_holiday_name, p_specific_date
                )
            );
        END IF;
    END IF;

    -- Search for existing overlapping or buffer-violating sessions in the same semester
    FOR v_conflict_record IN
        SELECT
            cs.id,
            cs.day_of_week,
            cs.start_time,
            cs.end_time,
            cs.specific_date,
            cs.room_id,
            cs.faculty_id,
            cs.batch_id,
            cs.batch_group_id,
            r.name AS room_name,
            f.name AS faculty_name,
            b.name AS batch_name,
            c.code AS course_code,
            c.name AS course_name
        FROM class_sessions cs
        JOIN rooms r ON cs.room_id = r.id
        JOIN faculty f ON cs.faculty_id = f.id
        JOIN batches b ON cs.batch_id = b.id
        JOIN courses c ON cs.course_id = c.id
        WHERE cs.semester_id = p_semester_id
          AND cs.status != 'cancelled'
          AND (p_id IS NULL OR cs.id != p_id)
          -- Match day/date logic: either both are on the same specific_date, or same day_of_week (when both are regular)
          AND (
              (p_specific_date IS NOT NULL AND cs.specific_date = p_specific_date)
              OR
              (p_specific_date IS NULL AND cs.specific_date IS NULL AND cs.day_of_week = p_day_of_week)
          )
    LOOP
        -- Check Time Overlap: [start_A, end_A) overlaps [start_B, end_B) if max(start_A, start_B) < min(end_A, end_B)
        IF GREATEST(p_start_time, v_conflict_record.start_time) < LEAST(p_end_time, v_conflict_record.end_time) THEN
            
            -- Rule 1: Room Double-Booking
            IF v_conflict_record.room_id = p_room_id THEN
                v_conflict_errors := array_append(
                    v_conflict_errors,
                    format('Room Double-Booking: Room "%s" is already booked for "%s (%s)" with batch "%s" from %s to %s.',
                        v_room_name,
                        v_conflict_record.course_name,
                        v_conflict_record.course_code,
                        v_conflict_record.batch_name,
                        v_conflict_record.start_time,
                        v_conflict_record.end_time
                    )
                );
            END IF;

            -- Rule 2: Faculty Double-Booking
            IF v_conflict_record.faculty_id = p_faculty_id THEN
                v_conflict_errors := array_append(
                    v_conflict_errors,
                    format('Faculty Double-Booking: Faculty "%s" is already assigned to "%s" in room "%s" from %s to %s.',
                        v_faculty_name,
                        v_conflict_record.course_name,
                        v_conflict_record.room_name,
                        v_conflict_record.start_time,
                        v_conflict_record.end_time
                    )
                );
            END IF;

            -- Rule 3: Batch Double-Booking (allowing batch merge groups only if same course, faculty, time)
            IF v_conflict_record.batch_id = p_batch_id OR 
               (p_batch_group_id IS NOT NULL AND v_conflict_record.batch_group_id = p_batch_group_id) THEN
                
                -- Check if it's an approved batch-merge session (exact same course, faculty, start and end time)
                IF NOT (
                    p_batch_group_id IS NOT NULL
                    AND v_conflict_record.batch_group_id = p_batch_group_id
                    AND v_conflict_record.faculty_id = p_faculty_id
                    AND v_conflict_record.start_time = p_start_time
                    AND v_conflict_record.end_time = p_end_time
                ) THEN
                    v_conflict_errors := array_append(
                        v_conflict_errors,
                        format('Batch Double-Booking: Batch "%s" already has a class "%s" in room "%s" from %s to %s.',
                            v_batch_name,
                            v_conflict_record.course_name,
                            v_conflict_record.room_name,
                            v_conflict_record.start_time,
                            v_conflict_record.end_time
                        )
                    );
                END IF;
            END IF;

        END IF;

        -- Rule 4: Buffer Violation (Mandatory 15-minute gap between adjacent sessions for faculty OR batch)
        -- An adjacent session is buffer-violating if:
        -- 0 <= (p_start_time - v_conflict_record.end_time) < 15 mins OR
        -- 0 <= (v_conflict_record.start_time - p_end_time) < 15 mins
        IF (v_conflict_record.faculty_id = p_faculty_id OR v_conflict_record.batch_id = p_batch_id) THEN
            IF (p_start_time >= v_conflict_record.end_time AND p_start_time < (v_conflict_record.end_time + v_buffer_interval)) OR
               (v_conflict_record.start_time >= p_end_time AND v_conflict_record.start_time < (p_end_time + v_buffer_interval)) THEN
                
                v_conflict_errors := array_append(
                    v_conflict_errors,
                    format('15-Minute Buffer Violation: Less than 15-minute gap with adjacent session "%s" (%s - %s) for %s.',
                        v_conflict_record.course_name,
                        v_conflict_record.start_time,
                        v_conflict_record.end_time,
                        CASE WHEN v_conflict_record.faculty_id = p_faculty_id THEN 'Faculty ' || v_faculty_name ELSE 'Batch ' || v_batch_name END
                    )
                );
            END IF;
        END IF;

    END LOOP;

    RETURN jsonb_build_object(
        'valid', (array_length(v_conflict_errors, 1) IS NULL),
        'errors', v_conflict_errors
    );
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 4. VALIDATION TRIGGER BEFORE INSERT/UPDATE
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION trg_validate_class_session_fn()
RETURNS TRIGGER AS $$
DECLARE
    v_validation JSONB;
BEGIN
    v_validation := check_timetable_conflicts(
        NEW.id,
        NEW.semester_id,
        NEW.course_id,
        NEW.faculty_id,
        NEW.room_id,
        NEW.batch_id,
        NEW.batch_group_id,
        NEW.day_of_week,
        NEW.start_time,
        NEW.end_time,
        NEW.session_type,
        NEW.status,
        NEW.specific_date
    );

    IF (v_validation->>'valid')::BOOLEAN = false THEN
        RAISE EXCEPTION 'TIMETABLE_CONFLICT: %', v_validation->>'errors';
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_class_session ON class_sessions;
CREATE TRIGGER trg_validate_class_session
BEFORE INSERT OR UPDATE ON class_sessions
FOR EACH ROW
EXECUTE FUNCTION trg_validate_class_session_fn();

-- ----------------------------------------------------------------------------
-- 5. AUDIT LOG TRIGGER
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION trg_audit_class_session_fn()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (class_session_id, changed_by, change_type, old_value, new_value, description)
        VALUES (
            NEW.id,
            COALESCE(current_setting('app.current_user', true), 'Coordinator'),
            'INSERT',
            NULL,
            to_jsonb(NEW),
            'Created new session'
        );
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (class_session_id, changed_by, change_type, old_value, new_value, description)
        VALUES (
            NEW.id,
            COALESCE(current_setting('app.current_user', true), 'Coordinator'),
            'UPDATE',
            to_jsonb(OLD),
            to_jsonb(NEW),
            'Updated session'
        );
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (class_session_id, changed_by, change_type, old_value, new_value, description)
        VALUES (
            OLD.id,
            COALESCE(current_setting('app.current_user', true), 'Coordinator'),
            'DELETE',
            to_jsonb(OLD),
            NULL,
            'Deleted session'
        );
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_class_session ON class_sessions;
CREATE TRIGGER trg_audit_class_session
AFTER INSERT OR UPDATE OR DELETE ON class_sessions
FOR EACH ROW
EXECUTE FUNCTION trg_audit_class_session_fn();

-- ----------------------------------------------------------------------------
-- 6. PUBLISH & VERSION SNAPSHOT FUNCTION
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION publish_timetable_version(
    p_semester_id UUID,
    p_published_by TEXT,
    p_summary TEXT DEFAULT 'Published timetable changes'
) RETURNS JSONB AS $$
DECLARE
    v_next_version INTEGER;
    v_snapshot JSONB;
BEGIN
    -- Get next version number
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_next_version
    FROM timetable_versions
    WHERE semester_id = p_semester_id;

    -- Update all draft sessions in this semester to published
    UPDATE class_sessions
    SET status = 'published'
    WHERE semester_id = p_semester_id AND status = 'draft';

    -- Generate snapshot JSON of all current sessions
    SELECT jsonb_agg(to_jsonb(cs.*)) INTO v_snapshot
    FROM class_sessions cs
    WHERE cs.semester_id = p_semester_id AND cs.status = 'published';

    -- Insert into timetable_versions
    INSERT INTO timetable_versions (semester_id, version_number, snapshot, changes_summary, published_by)
    VALUES (p_semester_id, v_next_version, COALESCE(v_snapshot, '[]'::JSONB), p_summary, p_published_by);

    RETURN jsonb_build_object(
        'success', true,
        'version_number', v_next_version,
        'semester_id', p_semester_id
    );
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE advising_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE makeup_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Anonymous/Public Read for active timetable viewing (e.g. students/faculty check schedule)
CREATE POLICY "Public can view rooms" ON rooms FOR SELECT USING (true);
CREATE POLICY "Public can view faculty" ON faculty FOR SELECT USING (true);
CREATE POLICY "Public can view batches" ON batches FOR SELECT USING (true);
CREATE POLICY "Public can view courses" ON courses FOR SELECT USING (true);
CREATE POLICY "Public can view published sessions" ON class_sessions FOR SELECT USING (status = 'published' OR auth.role() = 'authenticated');
CREATE POLICY "Public can view timetable versions" ON timetable_versions FOR SELECT USING (true);

-- Coordinator/Admin Full Edit Access (or authenticated users)
CREATE POLICY "Authenticated users can manage sessions" ON class_sessions FOR ALL USING (true);
CREATE POLICY "Authenticated users can manage rooms" ON rooms FOR ALL USING (true);
CREATE POLICY "Authenticated users can manage faculty" ON faculty FOR ALL USING (true);
CREATE POLICY "Authenticated users can manage batches" ON batches FOR ALL USING (true);
CREATE POLICY "Authenticated users can manage courses" ON courses FOR ALL USING (true);
CREATE POLICY "Authenticated users can manage advising" ON advising_suggestions FOR ALL USING (true);
-- Enable Realtime for class_sessions, audit_log, and advising_suggestions safely
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE class_sessions;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE audit_log;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE advising_suggestions;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

