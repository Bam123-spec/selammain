"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { format, parseISO } from "date-fns"
import { Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabaseClient"
import { toast } from "sonner"

function CheckoutContent() {
    const searchParams = useSearchParams()
    const router = useRouter()

    const classId = searchParams.get("classId")
    const amountParam = searchParams.get("amount")
    const serviceName = searchParams.get("serviceName")
    const enrollmentId = searchParams.get("enrollmentId")

    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [couponCode, setCouponCode] = useState("")
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
    const [baseAmount, setBaseAmount] = useState<number>(0)
    const [finalAmount, setFinalAmount] = useState<number>(0)
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)
    const [currentServiceName, setCurrentServiceName] = useState(serviceName)
    const [classDetails, setClassDetails] = useState<any>(null)

    // New State for Redesign
    const [tipPercentage, setTipPercentage] = useState<number>(0)
    const [customTip, setCustomTip] = useState<string>("")
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [isCouponOpen, setIsCouponOpen] = useState(false)

    useEffect(() => {
        const init = async () => {
            // 1. Check Auth & Get User Details
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                toast.error("Please log in to continue.")
                router.push("/student/login?next=/checkout")
                return
            }
            setUser(user)

            // Get profile for names
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
            if (profile) {
                setFirstName(profile.first_name || "")
                setLastName(profile.last_name || "")
            }

            // 2. Resolve Amount & Details
            let amount = 0

            if (enrollmentId) {
                const { data: enrollment, error } = await supabase
                    .from('enrollments')
                    .select('*, class:classes(*)')
                    .eq('id', enrollmentId)
                    .single()

                if (error || !enrollment) {
                    toast.error("Invalid enrollment.")
                    router.back()
                    return
                }

                if (enrollment.status === 'enrolled') {
                    toast.success("You are already enrolled!")
                    router.push("/student/dashboard")
                    return
                }

                amount = enrollment.class.price || 0
                setCurrentServiceName(enrollment.class.name)
                setClassDetails(enrollment.class)

                // Pre-fill names from enrollment if available
                if (enrollment.first_name) setFirstName(enrollment.first_name)
                if (enrollment.last_name) setLastName(enrollment.last_name)

            } else if (amountParam) {
                amount = parseFloat(amountParam)
            } else {
                toast.error("Invalid checkout session.")
                router.back()
                return
            }

            setBaseAmount(amount)
            setFinalAmount(amount)
            setLoading(false)
        }

        init()
    }, [classId, enrollmentId, amountParam, serviceName, router])

    // Handle Tip & Total Calculation
    useEffect(() => {
        let tipAmount = 0
        if (tipPercentage > 0) {
            tipAmount = baseAmount * (tipPercentage / 100)
        } else if (customTip) {
            tipAmount = parseFloat(customTip) || 0
        }

        const total = baseAmount + tipAmount
        setFinalAmount(total)
    }, [tipPercentage, customTip, baseAmount])

    const handleApplyCoupon = async () => {
        if (!couponCode) return
        setIsApplyingCoupon(true)

        try {
            const res = await fetch("/api/validate-coupon", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: couponCode })
            })
            const data = await res.json()

            if (data.valid) {
                setAppliedCoupon(data)
                toast.success("Coupon applied!")

                // Calculate new base amount
                let newBase = baseAmount
                if (data.discountType === 'percent') {
                    newBase = baseAmount - (baseAmount * (data.discountValue / 100))
                } else {
                    newBase = Math.max(0, baseAmount - data.discountValue)
                }
                setBaseAmount(newBase)
            } else {
                toast.error(data.message || "Invalid coupon")
                setAppliedCoupon(null)
            }
        } catch (error) {
            toast.error("Failed to apply coupon")
        } finally {
            setIsApplyingCoupon(false)
        }
    }

    const handleConfirmEnrollment = async () => {
        setLoading(true)
        try {
            if (enrollmentId) {
                const { error } = await supabase
                    .from('enrollments')
                    .update({ status: 'enrolled' })
                    .eq('id', enrollmentId)
                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('enrollments')
                    .insert([{
                        class_id: classId,
                        student_id: user.id,
                        status: 'enrolled',
                    }])
                if (error) throw error
            }
            toast.success("Enrollment successful!")
            router.push("/student/dashboard")
        } catch (error: any) {
            console.error("Enrollment error:", error)
            toast.error("Enrollment failed. Please contact support.")
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader2 className="h-8 w-8 animate-spin text-[#27ae60]" />
            </div>
        )
    }

    const tipAmount = finalAmount - baseAmount

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 font-sans text-gray-900">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col items-center mb-10">
                    <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 border border-gray-100">
                        {/* Logo Placeholder */}
                        <span className="font-bold text-xs text-gray-400">LOGO</span>
                    </div>
                    <h1 className="text-xl font-bold">Selam Driving School</h1>
                </div>

                <div className="flex items-center justify-between max-w-4xl mx-auto mb-8 text-sm">
                    <button onClick={() => router.back()} className="flex items-center font-bold text-gray-500 hover:text-black uppercase tracking-wide">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </button>
                    <h2 className="text-xl font-bold">Confirm Enrollment</h2>
                    <div className="w-24"></div> {/* Spacer for centering */}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-6xl mx-auto">
                    {/* LEFT COLUMN: Student Info */}
                    <div className="lg:col-span-7 space-y-8">
                        <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-100">
                            <h3 className="font-medium text-gray-900 mb-6">Student Information</h3>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700">First name</label>
                                    <input
                                        type="text"
                                        value={firstName}
                                        readOnly
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-sm text-gray-600 text-sm focus:outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700">Last name</label>
                                    <input
                                        type="text"
                                        value={lastName}
                                        readOnly
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-sm text-gray-600 text-sm focus:outline-none"
                                    />
                                </div>
                            </div>
                            <p className="text-sm text-gray-500">
                                Payment will be collected at the school or via invoice later.
                            </p>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Order Summary */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-100">
                            <h3 className="font-medium text-gray-900 mb-6">Order summary</h3>

                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-bold text-gray-900">{currentServiceName || "Driving Class"}</p>
                                    {classDetails && (
                                        <p className="text-sm text-gray-500 mt-1">
                                            {format(parseISO(classDetails.start_date), 'MMMM do, yyyy')} at {classDetails.daily_start_time}
                                        </p>
                                    )}
                                </div>
                                <p className="font-medium">${baseAmount.toFixed(2)}</p>
                            </div>

                            <div className="border-t border-gray-100 my-4 pt-4">
                                <button
                                    onClick={() => setIsCouponOpen(!isCouponOpen)}
                                    className="flex items-center justify-between w-full text-sm text-gray-600 hover:text-black"
                                >
                                    <span>Package, gift, or coupon code</span>
                                    <span>{isCouponOpen ? '−' : '+'}</span>
                                </button>
                                {isCouponOpen && (
                                    <div className="mt-3 flex gap-2">
                                        <input
                                            type="text"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value)}
                                            placeholder="Code"
                                            className="flex-1 border border-gray-300 rounded-sm px-3 py-2 text-sm"
                                        />
                                        <Button onClick={handleApplyCoupon} disabled={isApplyingCoupon} size="sm" variant="outline">
                                            Apply
                                        </Button>
                                    </div>
                                )}
                                {appliedCoupon && (
                                    <div className="mt-2 text-xs text-green-600 flex justify-between">
                                        <span>Coupon {appliedCoupon.code} applied</span>
                                        <button onClick={() => { setAppliedCoupon(null); setBaseAmount(parseFloat(amountParam || "0")); }} className="text-red-500">Remove</button>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-gray-100 pt-4 mb-6">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-gray-900">Total</span>
                                    <span className="text-xl font-bold text-gray-900">${finalAmount.toFixed(2)}</span>
                                </div>
                            </div>

                            <Button
                                className="w-full bg-[#27ae60] hover:bg-[#219150] text-white font-bold py-6 text-lg rounded-none shadow-lg mt-4"
                                onClick={handleConfirmEnrollment}
                            >
                                Confirm Enrollment
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <CheckoutContent />
        </Suspense>
    )
}
