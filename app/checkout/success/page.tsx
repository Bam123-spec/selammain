"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

type SessionPayload = {
    session: {
        id: string;
        payment_status: string;
        status: string;
        amount_total: number | null;
        currency: string | null;
        customer_email: string | null;
        service_slug: string | null;
    };
};

function formatAmount(amount: number | null, currency: string | null) {
    if (typeof amount !== "number" || !currency) return null;
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency.toUpperCase(),
    }).format(amount / 100);
}

function formatPaymentStatus(status: string | null | undefined) {
    const normalized = (status || "").toLowerCase();
    if (!normalized) return "Confirmed";
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function getServiceLabel(slug: string) {
    if (slug === "driving-practice-1hr") return "Driving Practice (1 Hour)";
    if (slug === "driving-practice-2hr") return "Driving Practice (2 Hours)";
    if (slug === "driving-practice-10hr") return "10-Hour Driving Package";
    if (slug === "road-test-escort") return "Road Test Escort";
    if (slug === "road-test-1hr") return "Road Test Escort + 1 Hour";
    if (slug === "road-test-2hr") return "Road Test Escort + 2 Hour";
    if (slug === "dip") return "Driving Improvement Program";
    if (slug === "rsep") return "Roadway Safety Education Program";
    return "Your booking";
}

function getReturnPath(slug: string) {
    if (slug.startsWith("driving-practice")) return "/services/driving-practice-packages";
    if (slug.startsWith("road-test")) return "/services/road-test-packages";
    if (slug === "dip") return "/services/improvement-program-packages";
    if (slug === "rsep") return "/services/rsep-packages";
    return "/services";
}

export default function CheckoutSuccessPage() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("session_id") || "";
    const serviceSlug = (searchParams.get("service_slug") || "").trim().toLowerCase();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [session, setSession] = useState<SessionPayload["session"] | null>(null);

    useEffect(() => {
        let cancelled = false;

        const verifyAndSync = async () => {
            if (!sessionId) {
                setError("Missing session ID.");
                setLoading(false);
                return;
            }

            try {
                const params = new URLSearchParams({
                    session_id: sessionId,
                    reconcile: "1",
                });
                if (serviceSlug) {
                    params.set("service_slug", serviceSlug);
                }

                const response = await fetch(`/api/checkout/session?${params.toString()}`, {
                    cache: "no-store",
                });
                const payload = await response.json();

                if (!response.ok) {
                    const message = payload?.error?.message || "Unable to verify payment status.";
                    throw new Error(message);
                }

                if (!cancelled) {
                    setSession(payload.session);
                    setError(null);
                }
            } catch (err: any) {
                if (!cancelled) {
                    setError(err?.message || "Unable to verify payment status.");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        verifyAndSync();
        return () => {
            cancelled = true;
        };
    }, [sessionId, serviceSlug]);

    const displaySlug = useMemo(() => {
        return session?.service_slug || serviceSlug || "";
    }, [session?.service_slug, serviceSlug]);

    const serviceLabel = getServiceLabel(displaySlug);
    const amountDisplay = formatAmount(session?.amount_total ?? null, session?.currency ?? null);
    const showAmount = typeof session?.amount_total === "number" && session.amount_total > 0 && !!amountDisplay;
    const returnPath = getReturnPath(displaySlug);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                    <Loader2 className="h-12 w-12 text-[#FDB813] animate-spin mx-auto mb-4" />
                    <h1 className="text-2xl font-black text-gray-900 mb-2">Finalizing Payment</h1>
                    <p className="text-gray-600">Please wait while we confirm your booking.</p>
                </div>
            </div>
        );
    }

    if (error || !session) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                    <AlertCircle className="h-12 w-12 text-amber-600 mx-auto mb-4" />
                    <h1 className="text-2xl font-black text-gray-900 mb-2">Payment Verification Needed</h1>
                    <p className="text-gray-600 mb-6">{error || "Session could not be verified."}</p>
                    <div className="space-y-3">
                        <Link
                            href={returnPath}
                            className="inline-flex w-full h-11 items-center justify-center rounded-lg bg-[#FDB813] text-black font-bold hover:bg-[#e5a700]"
                        >
                            Back to Services
                        </Link>
                        <Link
                            href="/contact"
                            className="inline-flex w-full h-11 items-center justify-center rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
                        >
                            Contact Support
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                <div className="flex justify-center mb-5">
                    <CheckCircle2 className="h-14 w-14 text-emerald-600" />
                </div>
                <h1 className="text-2xl font-black text-gray-900 mb-2">Payment Confirmed</h1>
                <p className="text-gray-600 mb-6">
                    {serviceLabel} is booked successfully. A confirmation email has been sent.
                </p>

                <div className="rounded-xl border border-gray-100 bg-gray-50 p-5 text-left mb-6">
                    <p className="text-xs uppercase tracking-[0.08em] font-semibold text-gray-500 mb-3">Order Summary</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                            <p className="text-[11px] uppercase tracking-[0.06em] text-gray-500 font-semibold">Service</p>
                            <p className="font-semibold text-gray-900">{serviceLabel}</p>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                            <p className="text-[11px] uppercase tracking-[0.06em] text-gray-500 font-semibold">Payment</p>
                            <p className="font-semibold text-gray-900">{formatPaymentStatus(session.payment_status)}</p>
                        </div>
                        {showAmount && (
                            <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                                <p className="text-[11px] uppercase tracking-[0.06em] text-gray-500 font-semibold">Amount</p>
                                <p className="font-semibold text-gray-900">{amountDisplay}</p>
                            </div>
                        )}
                        {session.customer_email && (
                            <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 sm:col-span-2">
                                <p className="text-[11px] uppercase tracking-[0.06em] text-gray-500 font-semibold">Receipt Sent To</p>
                                <p className="font-semibold text-gray-900 break-all">{session.customer_email}</p>
                            </div>
                        )}
                    </div>
                    <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-emerald-800 text-sm">
                        Your booking is confirmed. You can manage or reschedule from your student dashboard.
                    </div>
                </div>

                <div className="space-y-3">
                    <Link
                        href="/student/login?next=/student/dashboard"
                        className="inline-flex w-full h-11 items-center justify-center rounded-lg bg-[#FDB813] text-black font-bold hover:bg-[#e5a700]"
                    >
                        Manage Booking
                    </Link>
                    <Link
                        href={returnPath}
                        className="inline-flex w-full h-11 items-center justify-center rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
                    >
                        Book Another Service
                    </Link>
                </div>
            </div>
        </div>
    );
}
