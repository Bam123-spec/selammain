"use client"

import { useEffect, useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js"
import { Loader2, ArrowLeft, Shield, Lock } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function TenHourCheckoutPage() {
    const [clientSecret, setClientSecret] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchClientSecret = async () => {
            try {
                const res = await fetch("/api/checkout/embedded", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        service_slug: "driving-practice-10hr",
                        return_path: "/checkout/success?service_slug=driving-practice-10hr",
                        metadata: {
                            type: "TEN_HOUR_PACKAGE",
                            plan_slug: "driving-practice-10hr",
                        },
                    }),
                })
                const data = await res.json()
                if (data.clientSecret) {
                    setClientSecret(data.clientSecret)
                } else {
                    toast.error(data?.error?.message || "Failed to initialize checkout")
                }
            } catch (error) {
                console.error(error)
                toast.error("Error creating checkout session")
            } finally {
                setLoading(false)
            }
        }

        fetchClientSecret()
    }, [])

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Simple Header */}
            <header className="bg-white border-b border-gray-100 py-4 px-6 fixed top-0 w-full z-50">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link href="/services/driving-practice-packages/10-hour" className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-black transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Package Details
                    </Link>
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                        <Lock className="w-3 h-3" />
                        <span className="text-xs font-bold uppercase tracking-wider">Secure Checkout</span>
                    </div>
                </div>
            </header>

            <main className="flex-grow pt-24 pb-12 px-4">
                <div className="max-w-3xl mx-auto space-y-8">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-black text-black uppercase tracking-tight">Checkout</h1>
                        <p className="text-gray-500">Completing purchase for 10-Hour Mastery Package</p>
                    </div>

                    <div className="min-h-[400px]">
                        {clientSecret ? (
                            <EmbeddedCheckoutProvider
                                stripe={stripePromise}
                                options={{ clientSecret }}
                            >
                                <EmbeddedCheckout />
                            </EmbeddedCheckoutProvider>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-24 space-y-4">
                                <Loader2 className="w-10 h-10 animate-spin text-[#FDB813]" />
                                <p className="text-gray-400 font-medium animate-pulse">Initializing secure connection...</p>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-center gap-4 text-gray-400 text-xs font-medium">
                        <span className="flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            Encrypted Payment
                        </span>
                        <span>•</span>
                        <span>Powered by Stripe</span>
                    </div>
                </div>
            </main>
        </div>
    )
}
