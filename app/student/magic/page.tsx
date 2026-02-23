"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { AlertTriangle, Loader2, MailCheck } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type MagicScreenState = "processing" | "expired" | "invalid";

export default function MagicLinkPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const next = searchParams.get("next") || "/student/dashboard"
    const [screenState, setScreenState] = useState<MagicScreenState>("processing")
    const [email, setEmail] = useState(searchParams.get("email") || "")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [requestResult, setRequestResult] = useState<"idle" | "sent" | "error">("idle")

    const expiredMessage = useMemo(
        () => "This sign-in link has expired. Request a new one below and we’ll email it right away.",
        []
    )

    useEffect(() => {
        const processMagicLink = async () => {
            const hashParams = new URLSearchParams(window.location.hash.substring(1))
            const accessToken = hashParams.get("access_token")
            const refreshToken = hashParams.get("refresh_token")
            const errorCode = hashParams.get("error_code") || searchParams.get("error_code")
            const errorDescription = hashParams.get("error_description") || searchParams.get("error_description") || ""
            const isExpired = errorCode === "otp_expired" || /expired/i.test(errorDescription)
            const hasAuthError = Boolean(hashParams.get("error") || searchParams.get("error") || errorCode)

            if (accessToken && refreshToken) {
                const { error } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken
                })

                if (error) {
                    console.error("Magic link session error:", error)
                    setScreenState("expired")
                    return
                }

                // Clear hash for security
                window.history.replaceState(null, "", window.location.pathname + window.location.search)
                router.replace(next)
                return
            }

            if (hasAuthError) {
                setScreenState(isExpired ? "expired" : "invalid")
                return
            }

            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                router.replace(next)
                return
            }

            setScreenState("expired")
        }

        processMagicLink()
    }, [next, router, searchParams])

    async function requestNewLink() {
        if (!email.trim()) {
            setRequestResult("error")
            return
        }

        setIsSubmitting(true)
        setRequestResult("idle")

        try {
            const response = await fetch("/api/auth/request-magic-link", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    next,
                }),
            })

            if (!response.ok) {
                setRequestResult("error")
                return
            }

            setRequestResult("sent")
        } catch (error) {
            console.error("Request new link failed:", error)
            setRequestResult("error")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (screenState === "processing") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="flex items-center gap-3 text-gray-600">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm font-medium">Signing you in...</span>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-white px-4">
            <div className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                    {screenState === "expired" ? (
                        <AlertTriangle className="h-6 w-6 text-amber-500" />
                    ) : (
                        <AlertTriangle className="h-6 w-6 text-rose-500" />
                    )}
                    <h1 className="text-xl font-bold text-gray-900">
                        {screenState === "expired" ? "Link expired" : "Link invalid"}
                    </h1>
                </div>

                <p className="text-sm text-gray-600 mb-5">
                    {screenState === "expired"
                        ? expiredMessage
                        : "This sign-in link is invalid. Request a fresh link below."}
                </p>

                <div className="space-y-3">
                    <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your-email@example.com"
                    />
                    <Button
                        type="button"
                        className="w-full"
                        onClick={requestNewLink}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            "Request new link"
                        )}
                    </Button>
                </div>

                {requestResult === "sent" && (
                    <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 flex items-start gap-2">
                        <MailCheck className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>If an account exists for that email, a new sign-in link has been sent.</span>
                    </div>
                )}

                {requestResult === "error" && (
                    <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                        Couldn&apos;t send a new link. Check the email and try again.
                    </div>
                )}

                <div className="mt-5 text-sm text-gray-500">
                    You can also <Link className="text-primary font-medium hover:underline" href="/student/login">go to login</Link>.
                </div>
            </div>
        </div>
    )
}
