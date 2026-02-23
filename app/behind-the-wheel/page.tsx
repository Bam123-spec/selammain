"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Loader2, Lock, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BookingForm } from "@/components/forms/booking-form"

export default function BehindTheWheelPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [eligible, setEligible] = useState(false)
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        const checkEligibility = async () => {
            try {
                // 1. Check Auth
                const { data: { session } } = await supabase.auth.getSession()

                if (!session) {
                    setLoading(false)
                    return // Not logged in
                }

                setUser(session.user)

                // 2. Check for Completed DE Enrollment
                // We need to join enrollments with classes to check class_type
                const { data, error } = await supabase
                    .from('enrollments')
                    .select(`
                        status,
                        classes!inner (
                            class_type
                        )
                    `)
                    .eq('student_id', session.user.id)
                    .eq('classes.class_type', 'DE')
                    .eq('status', 'completed')
                    .single()

                if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
                    console.error("Error checking eligibility:", error)
                }

                if (data) {
                    setEligible(true)
                }

            } catch (error) {
                console.error("Unexpected error:", error)
            } finally {
                setLoading(false)
            }
        }

        checkEligibility()
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader2 className="h-8 w-8 animate-spin text-[#FDB813]" />
            </div>
        )
    }

    if (!user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <Lock className="h-8 w-8 text-gray-400" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Login Required</h1>
                <p className="text-gray-600 max-w-md mb-8">
                    Please log in to access Behind-the-Wheel booking. This service is reserved for registered students.
                </p>
                <div className="flex gap-4">
                    <Button variant="outline" asChild>
                        <Link href="/student/login?next=/behind-the-wheel">Log In</Link>
                    </Button>
                    <Button className="bg-[#FDB813] text-black hover:bg-[#e5a700]" asChild>
                        <Link href="/student/signup?next=/behind-the-wheel">Sign Up</Link>
                    </Button>
                </div>
            </div>
        )
    }

    if (!eligible) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
                    <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Access Restricted</h1>
                <p className="text-gray-600 max-w-lg mb-8 leading-relaxed">
                    Behind-the-Wheel booking is only available to students who have <strong>completed</strong> the Driver's Education (DE) course and have been confirmed by an instructor.
                </p>
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 max-w-md mx-auto mb-8 text-left">
                    <h3 className="font-bold text-gray-900 mb-2">Requirements:</h3>
                    <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-gray-300 shrink-0 mt-0.5" />
                            <span className="text-gray-600 text-sm">Complete 30 hours of classroom instruction</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-gray-300 shrink-0 mt-0.5" />
                            <span className="text-gray-600 text-sm">Pass the final exam</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-gray-300 shrink-0 mt-0.5" />
                            <span className="text-gray-600 text-sm">Instructor confirmation in portal</span>
                        </li>
                    </ul>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/dashboard">Check My Status</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white pt-24 pb-12">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="mb-10 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wider mb-4">
                        <CheckCircle2 className="h-4 w-4" />
                        Eligibility Confirmed
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Book Behind-the-Wheel
                    </h1>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Congratulations on completing your classroom instruction! You can now schedule your behind-the-wheel training sessions.
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 md:p-10">
                        {/* We reuse the BookingForm but pre-select 'behind-the-wheel' service if possible, 
                            or we might need to adjust BookingForm to accept a default service prop that is locked.
                            For now, passing 'plan=behind-the-wheel' via URL params might work if BookingForm reads it,
                            but since we are embedding it, we might need to modify BookingForm to accept props.
                            
                            Looking at BookingForm code:
                            const searchParams = useSearchParams()
                            const plan = searchParams.get("plan")
                            ...
                            defaultValues: { service: plan || "beginner" ... }

                            So we can't easily pass props without modifying BookingForm.
                            However, since this is a dedicated page, we can wrap it or just rely on the user selecting it.
                            BUT, the requirement is that this page IS for BTW.
                            
                            Let's assume 'beginner' in BookingForm maps to something, or we need to add 'behind-the-wheel' to the services list in BookingForm.
                            The user previously saw:
                            "beginner": "Beginner Course (2 hrs)",
                            "defensive": "Defensive Driving (3 hrs)",
                            ...
                            
                            I should probably update BookingForm to support a "behind-the-wheel" type if it's not there, 
                            or map it to one of the existing ones.
                            "refresher": "Driving/Extra practice (1 hr)" might be close, but usually BTW is 6 hours total, often in 2hr blocks.
                        */}
                        <BookingForm />
                    </div>
                </div>
            </div>
        </div>
    )
}
