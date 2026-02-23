"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const runtime = "edge";

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

export default function DipSuccessPage() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("session_id") || "";
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [session, setSession] = useState<SessionPayload["session"] | null>(null);

    useEffect(() => {
        let cancelled = false;

        const loadSession = async () => {
            if (!sessionId) {
                setError("Missing session_id.");
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(
                    `/api/checkout/session?session_id=${encodeURIComponent(sessionId)}&service_slug=dip&reconcile=1`,
                    { cache: "no-store" }
                );
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

        loadSession();
        return () => {
            cancelled = true;
        };
    }, [sessionId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                    <Loader2 className="h-12 w-12 text-[#FDB813] animate-spin mx-auto mb-4" />
                    <h1 className="text-2xl font-black text-gray-900 mb-2">Verifying Payment</h1>
                    <p className="text-gray-600">Please wait while we confirm your checkout session.</p>
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
                        <Button asChild className="w-full bg-[#FDB813] text-black hover:bg-[#e5a700] font-bold">
                            <Link href="/services/dip">Back to DIP</Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/contact">Contact Support</Link>
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const amountDisplay = formatAmount(session.amount_total, session.currency);
    const showAmount = typeof session.amount_total === "number" && session.amount_total > 0 && !!amountDisplay;

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                <div className="flex justify-center mb-5">
                    <CheckCircle2 className="h-14 w-14 text-emerald-600" />
                </div>
                <h1 className="text-2xl font-black text-gray-900 mb-2">Payment Confirmed</h1>
                <p className="text-gray-600 mb-6">
                    Your Driving Improvement Program purchase was successful.
                </p>

                <div className="rounded-xl border border-gray-100 bg-gray-50 p-5 text-left mb-6">
                    <p className="text-xs uppercase tracking-[0.08em] font-semibold text-gray-500 mb-3">Order Summary</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                            <p className="text-[11px] uppercase tracking-[0.06em] text-gray-500 font-semibold">Service</p>
                            <p className="font-semibold text-gray-900">Driving Improvement Program</p>
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
                </div>

                <div className="space-y-3">
                    <Button asChild className="w-full bg-[#FDB813] text-black hover:bg-[#e5a700] font-bold">
                        <Link href="/services/dip">Back to DIP</Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/student/dashboard">Go to Dashboard</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
