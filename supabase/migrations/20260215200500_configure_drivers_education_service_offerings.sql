-- Configure Driver's Education offerings for Connect-scoped embedded checkout.
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
VALUES
    (
        'drivers-ed-morning',
        'Driver''s Education (Morning Session)',
        '2-week Driver''s Education class (morning session).',
        true,
        'price_1T1AXmL8QyokIrIERZ0KyPIZ',
        COALESCE((SELECT connected_account_id FROM public.service_offerings WHERE slug = 'dip'), 'acct_1M8w6AL8QyokIrIE'),
        39000,
        'usd',
        '$390.00'
    ),
    (
        'drivers-ed-evening',
        'Driver''s Education (Evening Session)',
        '2-week Driver''s Education class (evening session).',
        true,
        'price_1T1AZIL8QyokIrIEimjIVguo',
        COALESCE((SELECT connected_account_id FROM public.service_offerings WHERE slug = 'dip'), 'acct_1M8w6AL8QyokIrIE'),
        39000,
        'usd',
        '$390.00'
    ),
    (
        'drivers-ed-weekend',
        'Driver''s Education (Weekend Session)',
        '5-week Driver''s Education weekend class.',
        true,
        'price_1T1AawL8QyokIrIExpDsAVIj',
        COALESCE((SELECT connected_account_id FROM public.service_offerings WHERE slug = 'dip'), 'acct_1M8w6AL8QyokIrIE'),
        45000,
        'usd',
        '$450.00'
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
