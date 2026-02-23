-- Service offerings for connected-account Stripe checkout (DIP first use case).
CREATE TABLE IF NOT EXISTS public.service_offerings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text NOT NULL UNIQUE,
    display_name text NOT NULL,
    description text,
    active boolean NOT NULL DEFAULT false,
    stripe_product_id text,
    stripe_price_id text,
    connected_account_id text,
    currency text NOT NULL DEFAULT 'usd',
    amount_cents integer,
    price_display text,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT service_offerings_account_format CHECK (connected_account_id IS NULL OR connected_account_id LIKE 'acct_%'),
    CONSTRAINT service_offerings_price_format CHECK (stripe_price_id IS NULL OR stripe_price_id LIKE 'price_%'),
    CONSTRAINT service_offerings_active_requires_checkout_fields CHECK (
        active = false OR (stripe_price_id IS NOT NULL AND connected_account_id IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_service_offerings_active ON public.service_offerings(active);
CREATE INDEX IF NOT EXISTS idx_service_offerings_slug ON public.service_offerings(slug);

CREATE OR REPLACE FUNCTION public.set_service_offerings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_service_offerings_updated_at ON public.service_offerings;
CREATE TRIGGER trg_service_offerings_updated_at
BEFORE UPDATE ON public.service_offerings
FOR EACH ROW
EXECUTE FUNCTION public.set_service_offerings_updated_at();

ALTER TABLE public.service_offerings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active service_offerings" ON public.service_offerings;
CREATE POLICY "Public can view active service_offerings"
ON public.service_offerings
FOR SELECT
TO public
USING (active = true);

DROP POLICY IF EXISTS "Service role can manage service_offerings" ON public.service_offerings;
CREATE POLICY "Service role can manage service_offerings"
ON public.service_offerings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage service_offerings" ON public.service_offerings;
CREATE POLICY "Admins can manage service_offerings"
ON public.service_offerings
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'admin'
    )
);

GRANT SELECT ON public.service_offerings TO anon, authenticated;
GRANT ALL ON public.service_offerings TO service_role;

INSERT INTO public.service_offerings (
    slug,
    display_name,
    description,
    active,
    price_display,
    currency
)
VALUES (
    'dip',
    'Driving Improvement Program (DIP)',
    'MVA-approved Driving Improvement Program for point reduction and court requirements.',
    false,
    '$100.00',
    'usd'
)
ON CONFLICT (slug) DO NOTHING;
