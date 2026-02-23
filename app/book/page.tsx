"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

const SchedulingForm = dynamic(
    () => import("@/components/forms/scheduling-form").then((mod) => mod.SchedulingForm),
    { ssr: false }
)

export default function BookingPage() {
    return (
        <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Back Button */}
                <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-black mb-8 transition-colors">
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Back
                </Link>

                <div className="mb-12 text-center">
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
                        Book Your <span className="text-[#FDB813]">Lesson</span>
                    </h1>
                    <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                        Follow the simple steps below to schedule your professional driving instruction.
                    </p>
                </div>

                <Suspense fallback={
                    <div className="flex flex-col items-center justify-center p-20 space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FDB813]"></div>
                        <p className="text-gray-500 font-bold animate-pulse uppercase tracking-widest text-xs">Initializing Booking System...</p>
                    </div>
                }>
                    <SchedulingForm />
                </Suspense>
            </div>
        </div>
    )
}
