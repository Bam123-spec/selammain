-- Fix enrollment trigger to safely handle INSERT operations
-- The original trigger was crashing on INSERT because it tried to access OLD records.

CREATE OR REPLACE FUNCTION public.grant_btw_credits_on_completion()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    btw_package_id uuid;
    numeric_grade numeric;
    v_is_already_granted boolean := false;
BEGIN
    -- Try to convert grade to numeric if it exists
    IF NEW.grade IS NOT NULL AND NEW.grade ~ '^[0-9.]+$' THEN
        numeric_grade := NEW.grade::numeric;
    ELSE
        numeric_grade := NULL;
    END IF;

    -- Check if grade is recorded and >= 80
    IF (numeric_grade IS NOT NULL AND (numeric_grade >= 80)) THEN
        
        -- A) Automatically set statuses
        NEW.status := 'completed';
        NEW.btw_credits_granted := true;
        NEW.certification_status := 'Approved'; 

        -- For UPDATE, check old value. For INSERT, it's always false/null
        IF (TG_OP = 'UPDATE') THEN
            v_is_already_granted := COALESCE(OLD.btw_credits_granted, false);
        END IF;

        -- B) Enable BTW Access and Set Initial Balances in profiles if not already done
        IF (v_is_already_granted = false) THEN
            UPDATE profiles 
            SET 
                btw_access_enabled = true,
                driving_balance_sessions = 3,
                driving_balance_hours = 6
            WHERE id = NEW.user_id;

            -- Find or Create the "Standard 3-Session Package"
            SELECT id INTO btw_package_id FROM behind_the_wheel_packages 
            WHERE included_sessions = 3 LIMIT 1;
            
            IF btw_package_id IS NULL THEN
                INSERT INTO behind_the_wheel_packages (name, included_sessions, session_duration_minutes)
                VALUES ('Standard 3-Session Package', 3, 120)
                RETURNING id INTO btw_package_id;
            END IF;

            -- Initialize Allocation if not exists
            IF NOT EXISTS (
                SELECT 1 FROM student_btw_allocations 
                WHERE student_id = NEW.user_id AND package_id = btw_package_id
            ) THEN
                INSERT INTO student_btw_allocations (student_id, package_id, total_included_sessions, sessions_used)
                VALUES (NEW.user_id, btw_package_id, 3, 0);
            END IF;
        END IF;

    END IF;
    RETURN NEW;
END;
$function$;
