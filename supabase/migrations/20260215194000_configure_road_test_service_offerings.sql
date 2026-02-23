-- Configure road test offerings for Connect-scoped embedded checkout.
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
        'road-test-escort',
        'Road Test Escort',
        'Vehicle escort service for MVA road test.',
        true,
        'price_1T1AbwL8QyokIrIEPF7AyuXt',
        COALESCE((SELECT connected_account_id FROM public.service_offerings WHERE slug = 'dip'), 'acct_1M8w6AL8QyokIrIE'),
        12000,
        'usd',
        '$120.00'
    ),
    (
        'road-test-1hr',
        'Road Test Escort + 1 Hour',
        'Road test escort package with 1-hour preparation lesson.',
        true,
        'price_1T1Ad7L8QyokIrIEA21x2BSa',
        COALESCE((SELECT connected_account_id FROM public.service_offerings WHERE slug = 'dip'), 'acct_1M8w6AL8QyokIrIE'),
        20000,
        'usd',
        '$200.00'
    ),
    (
        'road-test-2hr',
        'Road Test Escort + 2 Hour',
        'Road test escort package with 2-hour preparation lesson.',
        true,
        'price_1T1AdiL8QyokIrIECLwTIFA1',
        COALESCE((SELECT connected_account_id FROM public.service_offerings WHERE slug = 'dip'), 'acct_1M8w6AL8QyokIrIE'),
        26500,
        'usd',
        '$265.00'
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
