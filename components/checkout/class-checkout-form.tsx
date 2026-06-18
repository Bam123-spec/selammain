"use client"

import { useEffect, useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js"
import { Loader2, ArrowLeft, Shield, Lock, Calendar, Clock, MapPin, CreditCard, BadgeDollarSign } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { format, parseISO } from "date-fns"
import { Checkbox } from "@/components/ui/checkbox"

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
    requirePolicyAcceptance = false,
}: {
    classDetails: ClassDetails
    serviceSlug?: string
    requirePolicyAcceptance?: boolean
}) {
    const searchParams = useSearchParams()
    const location = searchParams.get("location")
    const studentName = (searchParams.get("name") || searchParams.get("student_name") || "").trim()
    const studentEmail = (searchParams.get("email") || searchParams.get("student_email") || "").trim()
    const studentPhone = (searchParams.get("phone") || searchParams.get("student_phone") || "").trim()
    const isBethesda = location === "bethesda"
    const isEveningDriversEd = serviceSlug === "drivers-ed-evening"
    const fullAmountCents = Math.max(0, Math.round(Number(classDetails.price || 0) * 100))
    const depositAmountCents = Math.min(20000, fullAmountCents)
    const selectedPaymentDefault = isEveningDriversEd ? "deposit" : "full"

    const [clientSecret, setClientSecret] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [policyAccepted, setPolicyAccepted] = useState(!requirePolicyAcceptance)
    const [paymentOption, setPaymentOption] = useState<"full" | "deposit">(selectedPaymentDefault)
    const formatLabel = classDetails.class_type === "DE"
        ? "Online via Zoom"
        : isBethesda
            ? "Bethesda Location"
            : "Online & In-Person"
    const selectedAmountCents = paymentOption === "deposit" ? depositAmountCents : fullAmountCents
    const remainingBalanceCents = Math.max(fullAmountCents - selectedAmountCents, 0)

    const formatCurrency = (valueCents: number) =>
        new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(valueCents / 100)

    useEffect(() => {
        if (!policyAccepted) {
            setClientSecret(null)
            setLoading(false)
            return
        }

        const fetchClientSecret = async () => {
            setLoading(true)
            setClientSecret(null)

            try {
                const usingServiceSlug = typeof serviceSlug === "string" && serviceSlug.length > 0
                const paymentOptionValue = usingServiceSlug && isEveningDriversEd ? paymentOption : "full"
                const endpoint = usingServiceSlug ? "/api/checkout/embedded" : "/api/stripe/create-checkout"
                const body = usingServiceSlug
                    ? {
                        service_slug: serviceSlug,
                        payment_option: paymentOptionValue,
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
                            payment_option: paymentOptionValue,
                            total_amount_cents: String(fullAmountCents),
                            due_today_cents: String(selectedAmountCents),
                            remaining_balance_cents: String(remainingBalanceCents),
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
    }, [
        classDetails,
        depositAmountCents,
        fullAmountCents,
        isBethesda,
        isEveningDriversEd,
        location,
        paymentOption,
        policyAccepted,
        remainingBalanceCents,
        selectedAmountCents,
        serviceSlug,
        studentName,
        studentPhone,
    ])

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

                            {isEveningDriversEd ? (
                                <div className="pt-6 border-t border-gray-200">
                                    <p className="font-black uppercase text-xs tracking-wider text-gray-500 mb-3">Payment Option</p>
                                    <div className="space-y-3">
                                        <button
                                            type="button"
                                            onClick={() => setPaymentOption("full")}
                                            className={`flex w-full items-start gap-4 border p-4 text-left transition-all ${
                                                paymentOption === "full"
                                                    ? "border-gray-900 bg-gray-50 shadow-sm"
                                                    : "border-gray-200 bg-white hover:border-gray-400"
                                            }`}
                                        >
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-gray-100">
                                                <CreditCard className="h-5 w-5 text-gray-700" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-3">
                                                    <p className="font-black uppercase text-sm tracking-wide text-gray-900">Pay Full</p>
                                                    <span className="font-black text-xl text-gray-900">{formatCurrency(fullAmountCents)}</span>
                                                </div>
                                                <p className="mt-1 text-sm text-gray-500">Pay the full class balance today.</p>
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setPaymentOption("deposit")}
                                            className={`flex w-full items-start gap-4 border p-4 text-left transition-all ${
                                                paymentOption === "deposit"
                                                    ? "border-[#FDB813] bg-[#fff8df] shadow-sm"
                                                    : "border-gray-200 bg-white hover:border-gray-400"
                                            }`}
                                        >
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#FDB813]/20">
                                                <BadgeDollarSign className="h-5 w-5 text-[#b4830e]" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-3">
                                                    <p className="font-black uppercase text-sm tracking-wide text-gray-900">Pay Deposit</p>
                                                    <span className="font-black text-xl text-gray-900">{formatCurrency(depositAmountCents)}</span>
                                                </div>
                                                <p className="mt-1 text-sm text-gray-500">Reserve your seat with the first payment today.</p>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            ) : null}

                            <div className="pt-6 border-t-2 border-gray-200">
                                <div className="flex justify-between items-end gap-4">
                                    <div>
                                        <span className="font-bold text-gray-600 uppercase text-xs tracking-wider">Due Today</span>
                                        <p className="mt-1 text-xs text-gray-500">
                                            {isEveningDriversEd && paymentOption === "deposit"
                                                ? `${formatCurrency(remainingBalanceCents)} remaining balance due later`
                                                : "One-time payment • No hidden fees"}
                                        </p>
                                    </div>
                                    <span className="font-black text-3xl text-black">
                                        {formatCurrency(selectedAmountCents)}
                                    </span>
                                </div>
                                {isEveningDriversEd && paymentOption === "deposit" ? (
                                    <p className="mt-2 text-right text-xs text-gray-500">
                                        {formatCurrency(remainingBalanceCents)} remaining balance due later
                                    </p>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    {/* Checkout Form */}
                    <div className="lg:col-span-3">
                        {requirePolicyAcceptance && !policyAccepted ? (
                            <div className="bg-white border border-amber-200 rounded-3xl shadow-sm p-8 md:p-10 mb-6">
                                <div className="mb-6">
                                    <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-600 mb-3">Before Payment</p>
                                    <h3 className="text-2xl font-black text-gray-900 mb-3">Driver&apos;s Ed Morning Cancellation Policy</h3>
                                    <p className="text-gray-600 leading-relaxed">
                                        Please review this policy before reserving your seat. Payment should only continue once the student agrees.
                                    </p>
                                </div>

                                <div className="rounded-2xl bg-amber-50 border border-amber-100 p-6 space-y-4 text-sm text-gray-700">
                                    <p>
                                        Reschedule or cancel <strong>24 hours in advance</strong> through your student portal to avoid fees.
                                    </p>
                                    <p>
                                        Refund requests are generally handled <strong>before the class start date</strong> and depend on timing and circumstances.
                                    </p>
                                    <p>
                                        If you miss part of class, you may need to complete missed classroom units in the next available session.
                                    </p>
                                </div>

                                <label className="mt-6 flex items-start gap-3 cursor-pointer">
                                    <Checkbox
                                        checked={policyAccepted}
                                        onCheckedChange={(checked) => setPolicyAccepted(checked === true)}
                                        className="mt-1 border-gray-300 data-[state=checked]:bg-[#FDB813] data-[state=checked]:border-[#FDB813] data-[state=checked]:text-black"
                                    />
                                    <span className="text-sm text-gray-700 leading-relaxed">
                                        I have read and agree to the cancellation and refund policy for this Driver&apos;s Ed Morning class.
                                    </span>
                                </label>

                                <p className="mt-4 text-xs text-gray-500">
                                    Questions about refunds or rescheduling? <Link href="/contact" className="font-bold text-gray-700 underline underline-offset-2">Contact Selam Driving School</Link>.
                                </p>
                            </div>
                        ) : null}

                        <div className="min-h-[400px]">
                            {clientSecret ? (
                                <EmbeddedCheckoutProvider
                                    stripe={stripePromise}
                                    options={{ clientSecret }}
                                >
                                    <EmbeddedCheckout />
                                </EmbeddedCheckoutProvider>
                            ) : requirePolicyAcceptance && !policyAccepted ? (
                                <div className="flex flex-col items-center justify-center py-24 space-y-3 text-center">
                                    <Shield className="w-10 h-10 text-[#FDB813]" />
                                    <p className="text-gray-700 font-semibold">Review and accept the policy to continue to payment.</p>
                                    <p className="text-sm text-gray-400">Stripe checkout will appear here after acknowledgment.</p>
                                </div>
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
