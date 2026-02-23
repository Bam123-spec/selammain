-- Configure Driving Practice (2 Hour) offering for Connect-scoped embedded checkout.
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
    'driving-practice-2hr',
    'Driving Practice (2 Hour)',
    'Comprehensive 2-hour private driving lesson.',
    true,
    'price_1T18KAL8QyokIrIEEbn4BECG',
    COALESCE(
        (SELECT connected_account_id FROM public.service_offerings WHERE slug = 'dip'),
        'acct_1M8w6AL8QyokIrIE'
    ),
    12000,
    'usd',
    '$120.00'
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
