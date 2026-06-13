"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type SessionPayload = {
    session: {
        id: string;
        payment_status: string;
        customer_email: string | null;
        customer_name: string | null;
        service: string | null;
        date: string | null;
        time: string | null;
        instructor: string | null;
        email_type: string | null;
    };
};

export default function Test1SuccessPage() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("session_id") || "";
    const [loading, setLoading] = useState(true);
    const [emailStatus, setEmailStatus] = useState<string | null>(null);
    const [session, setSession] = useState<SessionPayload["session"] | null>(null);

    const sentKey = useMemo(() => (sessionId ? `test1-email-sent:${sessionId}` : ""), [sessionId]);

    useEffect(() => {
        let cancelled = false;

        const verifyAndSend = async () => {
            if (!sessionId) {
                setEmailStatus("Missing session ID.");
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`/api/test1/session?session_id=${encodeURIComponent(sessionId)}`, {
                    cache: "no-store",
                });
                const payload = await response.json();

                if (!response.ok) {
                    const errorPayload = payload as { error?: { message?: string } };
                    throw new Error(errorPayload?.error?.message || "Unable to verify payment.");
                }

                const verified = payload as SessionPayload;
                if (!cancelled) {
                    setSession(verified.session);
                }

                if (typeof window !== "undefined" && sentKey && !window.localStorage.getItem(sentKey)) {
                    const emailResponse = await fetch("/api/send-email", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            name: verified.session.customer_name || "Test Student",
                            email: verified.session.customer_email || "",
                            service: verified.session.service || "Test Checkout",
                            date: verified.session.date || new Date().toLocaleDateString("en-US"),
                            time: verified.session.time || "6:00 PM",
                            instructor: verified.session.instructor || undefined,
                            emailType: verified.session.email_type === "instructor" ? "instructor" : "student",
                        }),
                    });

                    if (!emailResponse.ok) {
                        const errorPayload = await emailResponse.json().catch(() => null);
                        throw new Error(errorPayload?.message || errorPayload?.error || "Email send failed.");
                    }

                    window.localStorage.setItem(sentKey, "1");
                    if (!cancelled) {
                        setEmailStatus(`Email sent to ${verified.session.customer_email}.`);
                    }
                    toast.success("Email sent.");
                } else if (typeof window !== "undefined" && sentKey && window.localStorage.getItem(sentKey)) {
                    if (!cancelled) {
                        setEmailStatus("Email already sent for this test session.");
                    }
                }
            } catch (error: any) {
                if (!cancelled) {
                    setEmailStatus(error?.message || "Unable to verify payment.");
                }
                toast.error(error?.message || "Unable to verify payment.");
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        verifyAndSend();
        return () => {
            cancelled = true;
        };
    }, [sessionId, sentKey]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                <Link href="/test1" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Test Checkout
                </Link>

                <div className="mt-8 flex justify-center">
                    <CheckCircle2 className="h-14 w-14 text-emerald-600" />
                </div>

                <h1 className="mt-4 text-center text-2xl font-black text-gray-900">
                    Test Checkout Complete
                </h1>

                <p className="mt-2 text-center text-gray-600">
                    This page verifies the payment and sends the test email.
                </p>

                <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
                    {loading ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Verifying checkout...
                        </div>
                    ) : session ? (
                        <div className="space-y-2">
                            <p><span className="font-semibold">Email:</span> {session.customer_email || "Not found"}</p>
                            <p><span className="font-semibold">Service:</span> {session.service || "Test Checkout"}</p>
                            <p><span className="font-semibold">Payment:</span> {session.payment_status}</p>
                        </div>
                    ) : null}
                    {emailStatus ? (
                        <p className="mt-3 flex items-center gap-2 text-gray-600">
                            <Mail className="h-4 w-4" />
                            {emailStatus}
                        </p>
                    ) : null}
                </div>

                <div className="mt-6">
                    <Link href="/test1">
                        <Button className="w-full">Run Another Test</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
