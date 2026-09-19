-- ============================================================================
-- Migration: Add Program Tags, Sub-Batches, and Strict Joint Clash Rules
-- ============================================================================

-- 1. Extend batches table
ALTER TABLE batches
  ADD COLUMN IF NOT EXISTS program_code TEXT,
  ADD COLUMN IF NOT EXISTS section TEXT,
  ADD COLUMN IF NOT EXISTS parent_batch_id UUID REFERENCES batches(id) ON DELETE SET NULL;

-- Create index for faster program tag & section queries
CREATE INDEX IF NOT EXISTS idx_batches_program_code ON batches(program_code);
CREATE INDEX IF NOT EXISTS idx_batches_section ON batches(section);
CREATE INDEX IF NOT EXISTS idx_batches_merge_group ON batches(merge_group_id);

-- 2. Enhanced Conflict Check Function
-- Enforces: If a student's sub-batch is enrolled in a joint session via merge_group_id,
-- or shares the same batch/merge group, they cannot be scheduled into another class simultaneously.
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
    v_batch_merge_group_id UUID;
    v_course_name TEXT;
    v_required_room_types TEXT[];
    v_room_types TEXT[];
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
    SELECT name, merge_group_id INTO v_batch_name, v_batch_merge_group_id FROM batches WHERE id = p_batch_id;
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

    -- Rule 6: Calendar Holiday / Exam override check for regular recurring sessions
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

    -- Search for existing overlapping sessions in the same semester
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
            b.merge_group_id AS existing_batch_merge_group_id,
            c.code AS course_code,
            c.name AS course_name
        FROM class_sessions cs
        LEFT JOIN rooms r ON cs.room_id = r.id
        JOIN faculty f ON cs.faculty_id = f.id
        JOIN batches b ON cs.batch_id = b.id
        JOIN courses c ON cs.course_id = c.id
        WHERE cs.semester_id = p_semester_id
          AND cs.status != 'cancelled'
          AND (p_id IS NULL OR cs.id != p_id)
          AND (
              (p_specific_date IS NOT NULL AND cs.specific_date = p_specific_date)
              OR
              (p_specific_date IS NULL AND cs.specific_date IS NULL AND cs.day_of_week = p_day_of_week)
          )
    LOOP
        -- Check Time Overlap: [start_A, end_A) overlaps [start_B, end_B)
        IF GREATEST(p_start_time, v_conflict_record.start_time) < LEAST(p_end_time, v_conflict_record.end_time) THEN
            
            -- Check if it's an approved batch-merge session (exact same course, faculty, start and end time)
            DECLARE
                v_is_approved_merge BOOLEAN := false;
                v_is_sub_batch_joint_conflict BOOLEAN := false;
            BEGIN
                IF p_batch_group_id IS NOT NULL 
                   AND v_conflict_record.batch_group_id = p_batch_group_id
                   AND v_conflict_record.faculty_id = p_faculty_id
                   AND v_conflict_record.start_time = p_start_time
                   AND v_conflict_record.end_time = p_end_time THEN
                    v_is_approved_merge := true;
                END IF;

                -- Rule 1: Room Double-Booking
                IF p_room_id IS NOT NULL 
                   AND v_conflict_record.room_id = p_room_id 
                   AND NOT v_is_approved_merge THEN
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
                IF v_conflict_record.faculty_id = p_faculty_id AND NOT v_is_approved_merge THEN
                    v_conflict_errors := array_append(
                        v_conflict_errors,
                        format('Faculty Double-Booking: Faculty "%s" is already assigned to "%s" in room "%s" from %s to %s.',
                            v_faculty_name,
                            v_conflict_record.course_name,
                            COALESCE(v_conflict_record.room_name, 'Unassigned Room'),
                            v_conflict_record.start_time,
                            v_conflict_record.end_time
                        )
                    );
                END IF;

                -- Rule 3: Batch Clash
                -- Triggered if:
                -- 1) Exact same batch
                -- 2) Or proposed batch is enrolled in the existing session's merge group
                -- 3) Or existing batch is enrolled in proposed session's merge group
                -- 4) Or both share the same batch_group_id and it is not an approved merge
                IF v_conflict_record.batch_id = p_batch_id THEN
                    v_is_sub_batch_joint_conflict := true;
                ELSIF p_batch_group_id IS NOT NULL AND v_conflict_record.batch_group_id = p_batch_group_id THEN
                    v_is_sub_batch_joint_conflict := true;
                ELSIF v_conflict_record.batch_group_id IS NOT NULL AND v_batch_merge_group_id IS NOT NULL AND v_conflict_record.batch_group_id = v_batch_merge_group_id THEN
                    v_is_sub_batch_joint_conflict := true;
                ELSIF p_batch_group_id IS NOT NULL AND v_conflict_record.existing_batch_merge_group_id IS NOT NULL AND p_batch_group_id = v_conflict_record.existing_batch_merge_group_id THEN
                    v_is_sub_batch_joint_conflict := true;
                END IF;

                IF v_is_sub_batch_joint_conflict AND NOT v_is_approved_merge THEN
                    v_conflict_errors := array_append(
                        v_conflict_errors,
                        format('Batch Double-Booking: Batch "%s" already has a class "%s" in room "%s" from %s to %s.',
                            v_batch_name,
                            v_conflict_record.course_name,
                            COALESCE(v_conflict_record.room_name, 'Unassigned Room'),
                            v_conflict_record.start_time,
                            v_conflict_record.end_time
                        )
                    );
                END IF;
            END;

        END IF;

    END LOOP;

    RETURN jsonb_build_object(
        'valid', (array_length(v_conflict_errors, 1) IS NULL),
        'errors', v_conflict_errors
    );
END;
$$ LANGUAGE plpgsql;
