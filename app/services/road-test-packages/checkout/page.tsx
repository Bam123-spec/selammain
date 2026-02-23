"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { ArrowLeft, Loader2, Shield } from "lucide-react";
import { format, parseISO } from "date-fns";

export const runtime = "edge";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type IntentResponse = {
    clientSecret?: string;
    error?: {
        message?: string;
    };
};

function getRoadTestLabel(serviceSlug: string) {
    if (serviceSlug === "road-test-1hr") return "Road Test Escort + 1 Hour";
    if (serviceSlug === "road-test-2hr") return "Road Test Escort + 2 Hour";
    return "Road Test Escort";
}

function formatSingleTime(value: string) {
    const trimmed = value.trim();
    const hhmmMatch = trimmed.match(/^(\d{1,2}):(\d{2})$/);
    if (hhmmMatch) {
        const hours24 = Number(hhmmMatch[1]);
        const minutes = Number(hhmmMatch[2]);
        if (!Number.isNaN(hours24) && !Number.isNaN(minutes) && hours24 <= 23 && minutes <= 59) {
            const period = hours24 >= 12 ? "PM" : "AM";
            const hours12 = hours24 % 12 || 12;
            return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
        }
    }

    if (trimmed.includes("T")) {
        try {
            const parsed = parseISO(trimmed);
            if (!Number.isNaN(parsed.getTime())) return format(parsed, "h:mm a");
        } catch {
            return trimmed;
        }
    }

    return trimmed;
}

function formatDisplayTime(value: string) {
    const trimmed = (value || "").trim();
    if (!trimmed) return "TBD";

    if (trimmed.includes("T")) {
        return formatSingleTime(trimmed);
    }

    const parts = trimmed.split(/\s*-\s*/);
    if (parts.length === 2) {
        return `${formatSingleTime(parts[0])} - ${formatSingleTime(parts[1])}`;
    }

    return formatSingleTime(trimmed);
}

export default function RoadTestEmbeddedCheckoutPage() {
    const searchParams = useSearchParams();
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const serviceSlug = (searchParams.get("service_slug") || "road-test-escort").trim().toLowerCase();
    const classId = searchParams.get("class_id") || "";
    const email = searchParams.get("email") || searchParams.get("student_email") || "";
    const studentName = searchParams.get("name") || searchParams.get("student_name") || "";
    const studentPhone = searchParams.get("phone") || searchParams.get("student_phone") || "";
    const className = searchParams.get("class_name") || getRoadTestLabel(serviceSlug);
    const classDate = searchParams.get("class_date") || "";
    const classTime = searchParams.get("class_time") || "";
    const displayTime = formatDisplayTime(classTime);
    const returnPath = `/checkout/success?service_slug=${encodeURIComponent(serviceSlug)}`;
    const backHref = `/booking?plan=${encodeURIComponent(serviceSlug)}`;

    useEffect(() => {
        const controller = new AbortController();

        const createEmbeddedSession = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch("/api/checkout/embedded", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        service_slug: serviceSlug,
                        customer_email: email,
                        class_id: classId,
                        class_name: className,
                        class_date: classDate,
                        class_time: classTime,
                        student_name: studentName,
                        student_phone: studentPhone,
                        return_path: returnPath,
                        metadata: {
                            type: "ROAD_TEST_PACKAGE",
                            plan_slug: serviceSlug,
                            class_type: "ROAD_TEST",
                        },
                    }),
                    cache: "no-store",
                    signal: controller.signal,
                });

                const payload = (await response.json()) as IntentResponse;

                if (!response.ok || !payload.clientSecret) {
                    throw new Error(payload?.error?.message || "Unable to initialize checkout.");
                }

                setClientSecret(payload.clientSecret);
            } catch (err: any) {
                if (err?.name === "AbortError") return;
                setError(err?.message || "Unable to initialize checkout.");
            } finally {
                setLoading(false);
            }
        };

        createEmbeddedSession();

        return () => {
            controller.abort();
        };
    }, [classDate, classId, className, classTime, email, serviceSlug, studentName, studentPhone]);

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-6 px-4 sm:px-6 lg:px-8">
            <section className="h-full min-h-[calc(100vh-8rem)] grid grid-cols-1 lg:grid-cols-12 gap-6">
                <aside className="lg:col-span-4 rounded-3xl border border-gray-200 bg-white p-4 shadow-sm lg:sticky lg:top-24 h-fit lg:self-start">
                    <div className="space-y-4">
                        <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-black">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Road Test
                        </Link>

                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Product</p>
                            <h1 className="text-xl font-black text-gray-900 leading-tight">{className}</h1>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3 space-y-1.5">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Date</p>
                            <p className="text-sm font-semibold text-gray-900">{classDate || "TBD"}</p>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 pt-1">Time</p>
                            <p className="text-sm font-semibold text-gray-900">{displayTime}</p>
                        </div>

                        <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-700">
                            <div className="flex items-center gap-2 font-semibold">
                                <Shield className="h-4 w-4" />
                                Secure payment powered by Stripe
                            </div>
                        </div>
                    </div>
                </aside>

                <section className="lg:col-span-8 rounded-3xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm min-h-[480px]">
                    {loading && (
                        <div className="h-full min-h-[420px] flex items-center justify-center">
                            <div className="text-center">
                                <Loader2 className="h-8 w-8 animate-spin text-[#FDB813] mx-auto mb-3" />
                                <p className="text-sm text-gray-500">Initializing secure checkout...</p>
                            </div>
                        </div>
                    )}

                    {!loading && error && (
                        <div className="h-full min-h-[420px] flex items-center justify-center">
                            <div className="max-w-md text-center space-y-4">
                                <p className="text-red-600 font-semibold">{error}</p>
                                <Link
                                    href={backHref}
                                    className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-300 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                >
                                    Return to schedule
                                </Link>
                            </div>
                        </div>
                    )}

                    {!loading && !error && clientSecret && (
                        <EmbeddedCheckoutProvider
                            stripe={stripePromise}
                            options={{ clientSecret }}
                        >
                            <EmbeddedCheckout />
                        </EmbeddedCheckoutProvider>
                    )}
                </section>
            </section>
        </div>
    );
}
