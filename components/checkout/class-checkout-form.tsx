"use client"

import { useEffect, useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js"
import { Loader2, ArrowLeft, Shield, Lock, Calendar, Clock, MapPin } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { format, parseISO } from "date-fns"

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface ClassDetails {
    id: string
    name: string
    start_date: string
    end_date: string
    time_slot: string
    price: number
    price_display?: string
    type: string
    class_type?: string
}

function formatSingleTime(value: string) {
    const trimmed = value.trim()
    const match = trimmed.match(/^(\d{1,2}):(\d{2})$/)
    if (!match) return trimmed
    const hours24 = Number(match[1])
    const minutes = Number(match[2])
    if (Number.isNaN(hours24) || Number.isNaN(minutes) || hours24 > 23 || minutes > 59) return trimmed
    const period = hours24 >= 12 ? "PM" : "AM"
    const hours12 = hours24 % 12 || 12
    return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`
}

function formatTimeRange(value: string) {
    const trimmed = (value || "").trim()
    if (!trimmed) return "TBA"
    if (!trimmed.includes("-")) return formatSingleTime(trimmed)
    const [startRaw, endRaw] = trimmed.split("-")
    if (!startRaw || !endRaw) return trimmed
    const start = formatSingleTime(startRaw)
    const end = formatSingleTime(endRaw)
    return `${start} - ${end}`
}

export function ClassCheckoutForm({
    classDetails,
    serviceSlug,
}: {
    classDetails: ClassDetails
    serviceSlug?: string
}) {
    const searchParams = useSearchParams()
    const location = searchParams.get("location")
    const studentName = (searchParams.get("name") || searchParams.get("student_name") || "").trim()
    const studentEmail = (searchParams.get("email") || searchParams.get("student_email") || "").trim()
    const studentPhone = (searchParams.get("phone") || searchParams.get("student_phone") || "").trim()
    const isBethesda = location === "bethesda"

    const [clientSecret, setClientSecret] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const formatLabel = classDetails.class_type === "DE"
        ? "Online via Zoom"
        : isBethesda
            ? "Bethesda Location"
            : "Online & In-Person"

    useEffect(() => {
        const fetchClientSecret = async () => {
            try {
                const usingServiceSlug = typeof serviceSlug === "string" && serviceSlug.length > 0
                const endpoint = usingServiceSlug ? "/api/checkout/embedded" : "/api/stripe/create-checkout"
                const body = usingServiceSlug
                    ? {
                        service_slug: serviceSlug,
                        class_id: classDetails.id,
                        class_name: isBethesda ? `${classDetails.name} - Bethesda` : classDetails.name,
                        class_date: classDetails.start_date,
                        class_time: classDetails.time_slot,
                        location: location || "silver-spring",
                        customer_email: studentEmail || undefined,
                        student_name: studentName || undefined,
                        student_phone: studentPhone || undefined,
                        return_path: `/checkout/success?service_slug=${encodeURIComponent(serviceSlug)}`,
                        metadata: {
                            type: "CLASS_ENROLLMENT",
                            class_type: "DE",
                            class_end_date: classDetails.end_date || "",
                        },
                    }
                    : {
                        classId: classDetails.id,
                        className: isBethesda ? `${classDetails.name} - Bethesda` : classDetails.name,
                        classDate: classDetails.start_date,
                        classTime: classDetails.time_slot,
                        uiMode: 'embedded',
                        metadata: {
                            location: location || "silver-spring",
                            class_type: classDetails.class_type || "",
                            class_end_date: classDetails.end_date || ""
                        }
                    }

                const res = await fetch(endpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
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
    }, [classDetails, isBethesda, location, serviceSlug, studentEmail, studentName, studentPhone])

    return (
        <>
            {/* Simple Header */}
            <header className="bg-white border-b border-gray-100 py-4 px-6 fixed top-0 w-full z-50">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link href={`/services/drivers-education-schedule?classification=${classDetails.type}${location ? `&location=${location}` : ''}`} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-black transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Schedule
                    </Link>
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                        <Lock className="w-3 h-3" />
                        <span className="text-xs font-bold uppercase tracking-wider">Secure Checkout</span>
                    </div>
                </div>
            </header>

            <main className="flex-grow pt-24 pb-12 px-4">
                <div className="max-w-6xl mx-auto grid lg:grid-cols-5 gap-8">

                    {/* Order Summary */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-3xl border border-gray-200 shadow-lg space-y-6 sticky top-24">
                            <div>
                                <h3 className="font-black uppercase text-xs text-gray-400 tracking-wider mb-4">Order Summary</h3>
                                <h2 className="font-bold text-xl leading-tight mb-2">{isBethesda ? `Bethesda ${classDetails.name}` : classDetails.name}</h2>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                                    <span className="text-xs font-bold capitalize">{isBethesda ? "Bethesda Location" : classDetails.type}</span>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-gray-200">
                                <div className="flex items-start gap-3 group">
                                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 group-hover:bg-blue-200 transition-colors">
                                        <Calendar className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Session Dates</p>
                                        <p className="font-bold text-gray-900">
                                            {format(parseISO(classDetails.start_date), "MMM d")} - {format(parseISO(classDetails.end_date), "MMM d, yyyy")}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 group">
                                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0 group-hover:bg-purple-200 transition-colors">
                                        <Clock className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Class Time</p>
                                        <p className="font-bold text-gray-900">{formatTimeRange(classDetails.time_slot)}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 group">
                                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0 group-hover:bg-green-200 transition-colors">
                                        <MapPin className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Format</p>
                                        <p className="font-bold text-gray-900">{formatLabel}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t-2 border-gray-200">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-gray-600 uppercase text-xs tracking-wider">Total Due</span>
                                    <span className="font-black text-3xl text-black">
                                        {classDetails.price_display || `$${Number(classDetails.price || 0).toFixed(2)}`}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 text-right">One-time payment • No hidden fees</p>
                            </div>
                        </div>
                    </div>

                    {/* Checkout Form */}
                    <div className="lg:col-span-3">
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
                        <div className="flex items-center justify-center gap-4 text-gray-400 text-xs font-medium mt-6">
                            <span className="flex items-center gap-1">
                                <Shield className="w-3 h-3" />
                                Encrypted Payment
                            </span>
                            <span>•</span>
                            <span>Powered by Stripe</span>
                        </div>
                    </div>

                    {/* Promo Code Notice at the bottom */}
                    <div className="lg:col-span-5 mt-4">
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-5 shadow-sm">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-black text-green-900 uppercase text-xs tracking-wider mb-1.5">
                                        🎁 Free Bonus Included
                                    </h3>
                                    <p className="text-gray-700 text-sm font-medium leading-relaxed">
                                        You'll receive a <strong className="text-green-700">promo code at the end of this course</strong> for <strong className="text-green-700">3 FREE sessions</strong> of 2-hour Driving Practice!
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}
