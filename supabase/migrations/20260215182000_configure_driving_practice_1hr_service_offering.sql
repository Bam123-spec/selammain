-- Configure Driving Practice (1 Hour) offering for Connect-scoped embedded checkout.
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
    'driving-practice-1hr',
    'Driving Practice (1 Hour)',
    'Single 1-hour private driving lesson.',
    true,
    'price_1T18JbL8QyokIrIEbC1DSfad',
    COALESCE(
        (SELECT connected_account_id FROM public.service_offerings WHERE slug = 'dip'),
        'acct_1M8w6AL8QyokIrIE'
    ),
    6500,
    'usd',
    '$65.00'
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
