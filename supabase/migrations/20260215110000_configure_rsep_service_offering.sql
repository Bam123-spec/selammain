-- Configure RSEP checkout offering to use Connect-scoped Stripe price.
INSERT INTO public.service_offerings (
    slug,
    display_name,
    description,
    active,
    stripe_price_id,
    connected_account_id,
    amount_cents,
    currency,
    price_display
)
VALUES (
    'rsep',
    '3-Hour Roadway Safety Education Program (RSEP)',
    'MVA-required alcohol and drug education course for international license conversion.',
    true,
    'price_1Sw4z1L8QyokIrIET1TJOpzY',
    COALESCE(
        (SELECT connected_account_id FROM public.service_offerings WHERE slug = 'dip'),
        'acct_1M8w6AL8QyokIrIE'
    ),
    10000,
    'usd',
    '$100.00'
)
ON CONFLICT (slug) DO UPDATE
SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    active = EXCLUDED.active,
    stripe_price_id = EXCLUDED.stripe_price_id,
    connected_account_id = EXCLUDED.connected_account_id,
    amount_cents = EXCLUDED.amount_cents,
    currency = EXCLUDED.currency,
    price_display = EXCLUDED.price_display;
