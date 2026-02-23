-- Ensure BTW credit grant works whether enrollment stores user_id or student_id.
CREATE OR REPLACE FUNCTION public.grant_btw_credits_on_completion()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    btw_package_id uuid;
    numeric_grade numeric;
    v_is_already_granted boolean := false;
    target_student_id uuid;
BEGIN
    target_student_id := COALESCE(NEW.user_id, NEW.student_id);

    -- Prefer grade, fallback to final_grade.
    IF NEW.grade IS NOT NULL AND NEW.grade ~ '^[0-9.]+$' THEN
        numeric_grade := NEW.grade::numeric;
    ELSIF NEW.final_grade IS NOT NULL AND NEW.final_grade::text ~ '^[0-9.]+$' THEN
        numeric_grade := NEW.final_grade::numeric;
    ELSE
        numeric_grade := NULL;
    END IF;

    IF numeric_grade IS NOT NULL AND numeric_grade >= 80 THEN
        NEW.status := 'completed';
        NEW.btw_credits_granted := true;
        NEW.certification_status := 'Approved';

        IF TG_OP = 'UPDATE' THEN
            v_is_already_granted := COALESCE(OLD.btw_credits_granted, false);
        END IF;

        IF v_is_already_granted = false AND target_student_id IS NOT NULL THEN
            UPDATE profiles
            SET
                btw_access_enabled = true,
                driving_balance_sessions = GREATEST(COALESCE(driving_balance_sessions, 0), 3),
                driving_balance_hours = GREATEST(COALESCE(driving_balance_hours, 0), 6)
            WHERE id = target_student_id;

            SELECT id INTO btw_package_id
            FROM behind_the_wheel_packages
            WHERE included_sessions = 3
            LIMIT 1;

            IF btw_package_id IS NULL THEN
                INSERT INTO behind_the_wheel_packages (name, included_sessions, session_duration_minutes)
                VALUES ('Standard 3-Session Package', 3, 120)
                RETURNING id INTO btw_package_id;
            END IF;

            IF NOT EXISTS (
                SELECT 1
                FROM student_btw_allocations
                WHERE student_id = target_student_id
                  AND package_id = btw_package_id
            ) THEN
                INSERT INTO student_btw_allocations (student_id, package_id, total_included_sessions, sessions_used)
                VALUES (target_student_id, btw_package_id, 3, 0);
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;
