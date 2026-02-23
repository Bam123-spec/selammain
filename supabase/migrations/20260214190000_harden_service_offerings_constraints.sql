-- Defensive constraints for service_offerings in case older environments drift.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'service_offerings_slug_unique'
          AND conrelid = 'public.service_offerings'::regclass
    ) THEN
        ALTER TABLE public.service_offerings
            ADD CONSTRAINT service_offerings_slug_unique UNIQUE (slug);
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'service_offerings_account_prefix_check'
          AND conrelid = 'public.service_offerings'::regclass
    ) THEN
        ALTER TABLE public.service_offerings
            ADD CONSTRAINT service_offerings_account_prefix_check
            CHECK (connected_account_id IS NULL OR connected_account_id LIKE 'acct_%');
    END IF;
END
$$;
