"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export const runtime = "edge"

export default function RSEPSuccessPage() {
    const searchParams = useSearchParams()
    const sessionId = searchParams.get("session_id") || ""

    useEffect(() => {
        if (!sessionId) return

        fetch(`/api/checkout/session?session_id=${encodeURIComponent(sessionId)}&service_slug=rsep&reconcile=1`, {
            cache: "no-store",
        }).catch(() => {
            // Best-effort fallback if webhook delivery is delayed or missed.
        })
    }, [sessionId])

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            {/* Header Section */}
            <div className="bg-white border-b py-6">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-2xl font-bold text-gray-900">Selam Driving School</h1>
                </div>
            </div>

            <div className="flex-grow flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-lg shadow-sm border max-w-md w-full text-center">
                    <div className="flex justify-center mb-6">
                        <CheckCircle2 className="h-16 w-16 text-green-500" />
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
                    <p className="text-gray-600 mb-6">
                        Thank you for enrolling. A confirmation email has been sent to you with all the details.
                    </p>

                    <div className="bg-gray-50 p-4 rounded-md mb-6 text-sm text-left">
                        <p className="font-semibold text-gray-900 mb-1">Next Steps:</p>
                        <ul className="list-disc list-inside space-y-1 text-gray-600">
                            <li>Check your email for booking confirmation.</li>
                            <li>Arrive 15 minutes early for your session.</li>
                            <li>Bring your learner's permit or ID.</li>
                        </ul>
                    </div>

                    <div className="space-y-3">
                        <Link href="/">
                            <Button className="w-full bg-[#FDB813] text-black hover:bg-[#e5a712] font-semibold">
                                Return to Home
                            </Button>
                        </Link>
                        <Link href="/services/rsep-packages">
                            <Button variant="outline" className="w-full">
                                Book Another Class
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
