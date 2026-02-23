# DIP Connect Setup

## Required env vars

- `STRIPE_SECRET_KEY`: Platform Stripe secret key (server-only).
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase URL.
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (server-only).

Notes:
- Do not use client connected-account keys.
- Do not use Stripe publishable key for this DIP checkout flow.

## Configure service offerings

The checkout route reads `public.service_offerings` by `slug`.

### Option A: Set directly in Supabase SQL

```sql
update public.service_offerings
set
  display_name = 'Driving Improvement Program (DIP)',
  description = 'MVA-approved Driving Improvement Program for point reduction and court requirements.',
  stripe_price_id = 'price_...',
  connected_account_id = 'acct_...',
  stripe_product_id = 'prod_...',
  amount_cents = 10000,
  currency = 'usd',
  price_display = '$100.00',
  active = true
where slug = 'dip';
```

RSEP example:

```sql
update public.service_offerings
set
  display_name = '3-Hour Roadway Safety Education Program (RSEP)',
  stripe_price_id = 'price_1Sw4z1L8QyokIrIET1TJOpzY',
  connected_account_id = 'acct_...',
  amount_cents = 10000,
  currency = 'usd',
  price_display = '$100.00',
  active = true
where slug = 'rsep';
```

### Option B: Protected API endpoint

- `POST /api/admin/service-offerings`
- Requires admin bearer token in `Authorization` header.

Example payload:

```json
{
  "slug": "dip",
  "display_name": "Driving Improvement Program (DIP)",
  "description": "MVA-approved Driving Improvement Program for point reduction and court requirements.",
  "stripe_price_id": "price_...",
  "connected_account_id": "acct_...",
  "stripe_product_id": "prod_...",
  "amount_cents": 10000,
  "currency": "usd",
  "price_display": "$100.00",
  "active": true
}
```

## Find connected-account price IDs

- `GET /api/stripe/prices`
- Requires admin bearer token.
- Uses DIP's configured `connected_account_id` from `service_offerings` (no account query param accepted).
- Returns active prices with expanded product details.

## Runtime flow

1. User opens `/services/dip`.
2. User clicks **Book DIP**.
3. Frontend calls `POST /api/checkout` with `{ "service_slug": "dip" }`.
4. Backend reads Supabase config, creates Checkout Session using platform key + `Stripe-Account: acct_...`.
5. Backend returns `{ "url": "https://checkout.stripe.com/..." }`.
6. Frontend redirects to `session.url`.
