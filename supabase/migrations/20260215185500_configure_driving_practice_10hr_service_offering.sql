-- Configure 10-hour driving practice offering for Connect-scoped embedded checkout.
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
    'driving-practice-10hr',
    'Driving Practice (10 Hours)',
    'Five 2-hour comprehensive driving lessons.',
    true,
    'price_1T18MQL8QyokIrIEWrJf2YlL',
    COALESCE(
        (SELECT connected_account_id FROM public.service_offerings WHERE slug = 'dip'),
        'acct_1M8w6AL8QyokIrIE'
    ),
    55000,
    'usd',
    '$550.00'
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
