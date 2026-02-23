type SafeStripeError = {
    status: number;
    code: string;
    message: string;
};

export function getSafeStripeError(error: unknown): SafeStripeError {
    const rawMessage =
        error instanceof Error
            ? error.message
            : typeof error === "string"
                ? error
                : "Unknown Stripe error";

    const statusMatch = rawMessage.match(/Stripe API Error:\s*(\d{3})/i);
    const status = statusMatch ? Number(statusMatch[1]) : 500;

    if (status === 400 || status === 404) {
        return {
            status: 400,
            code: "stripe_bad_request",
            message: "Invalid Stripe configuration for this request.",
        };
    }

    if (status === 401 || status === 403) {
        return {
            status: 502,
            code: "stripe_auth_error",
            message: "Payment provider authentication failed.",
        };
    }

    if (status === 402) {
        return {
            status: 402,
            code: "payment_failed",
            message: "Payment could not be processed.",
        };
    }

    if (status === 429) {
        return {
            status: 503,
            code: "stripe_rate_limited",
            message: "Payment provider is busy. Please try again shortly.",
        };
    }

    if (status >= 500) {
        return {
            status: 502,
            code: "stripe_unavailable",
            message: "Payment provider is temporarily unavailable.",
        };
    }

    return {
        status: 500,
        code: "stripe_error",
        message: "Unable to complete payment request.",
    };
}
