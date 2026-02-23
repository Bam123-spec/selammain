
/**
 * Lightweight Stripe Client for Edge Runtime
 * Replaces the heavy 'stripe' SDK to reduce bundle size for Cloudflare Workers.
 */

const STRIPE_API_URL = 'https://api.stripe.com/v1';

type StripeFetchOptions = {
    stripeAccount?: string;
}

// Helper to flatten object into Stripe-compatible form-urlencoded string
// e.g. { metadata: { key: 'val' } } -> metadata[key]=val
function objectToQueryString(obj: any, prefix?: string): string {
    const parts: string[] = [];

    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            const encodedKey = prefix ? `${prefix}[${key}]` : key;

            if (value !== null && typeof value === 'object') {
                parts.push(objectToQueryString(value, encodedKey));
            } else if (value !== undefined && value !== null) {
                parts.push(`${encodeURIComponent(encodedKey)}=${encodeURIComponent(value)}`);
            }
        }
    }

    return parts.join('&');
}

export async function stripeFetch(
    endpoint: string,
    method: string = 'GET',
    body?: any,
    options?: StripeFetchOptions
) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) throw new Error("Missing STRIPE_SECRET_KEY");

    const headers: Record<string, string> = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Stripe-Version': '2025-01-27.acacia' // Matching user's SDK version
    };
    if (options?.stripeAccount) {
        headers['Stripe-Account'] = options.stripeAccount;
    }

    const requestOptions: RequestInit = {
        method,
        headers,
    };

    if (body) {
        requestOptions.body = objectToQueryString(body);
    }

    const res = await fetch(`${STRIPE_API_URL}${endpoint}`, requestOptions);

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Stripe API Error: ${res.status} ${text}`);
    }

    return res.json();
}

// Webhook Signature Verification using Web Crypto API (Edge Compatible)
export async function verifyStripeWebhook(payload: string, signatureHeader: string, secret: string) {
    if (!payload || !signatureHeader || !secret) {
        throw new Error("Missing payload, signature header, or secret");
    }

    // Parse signature header: t=TIMESTAMP,v1=SIGNATURE
    const parts = signatureHeader.split(',').reduce((acc, part) => {
        const [key, value] = part.split('=');
        acc[key] = value;
        return acc;
    }, {} as Record<string, string>);

    const timestamp = parts['t'];
    const signature = parts['v1'];

    if (!timestamp || !signature) {
        throw new Error("Invalid signature header format");
    }

    // Check timestamp tolerance (default 5 minutes)
    // const now = Math.floor(Date.now() / 1000);
    // if (Math.abs(now - parseInt(timestamp)) > 300) {
    //     throw new Error("Webhook signature formatting error or timestamp too old");
    // }

    const signedPayload = `${timestamp}.${payload}`;
    const encoder = new TextEncoder();

    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
    );

    const signatureBytes = hexToBuf(signature);

    const isValid = await crypto.subtle.verify(
        'HMAC',
        key,
        signatureBytes,
        encoder.encode(signedPayload)
    );

    if (!isValid) {
        throw new Error("Webhook signature verification failed");
    }

    return JSON.parse(payload);
}

function hexToBuf(hex: string): ArrayBuffer {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes.buffer;
}
