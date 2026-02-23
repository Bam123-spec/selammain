"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useRouter, useSearchParams } from "next/navigation"
import { getClasses } from "@/app/actions/classes"
import { format, parseISO, differenceInWeeks } from "date-fns"
import { Loader2, ChevronRight, X } from "lucide-react"
import { loadStripe } from "@stripe/stripe-js"
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)



interface ClassSession {
    id: string
    name: string
    start_date: string
    end_date: string
    daily_start_time: string
    daily_end_time: string
    class_type: string
    status: string
    price?: number
}

export function DEScheduleContent({
    classification = 'Morning',
    classType = 'DE',
    location: initialLocation
}: {
    classification?: string,
    classType?: string,
    location?: string
}) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const location = initialLocation || searchParams.get('location')
    const isBethesda = location === 'bethesda'

    const [classes, setClasses] = useState<ClassSession[]>([])
    const [loading, setLoading] = useState(true)
    const [limit, setLimit] = useState(4)
    const [hasMore, setHasMore] = useState(false)

    const [error, setError] = useState<string | null>(null)
    const [isMounted, setIsMounted] = useState(false)

    // Enrollment & Embedded Checkout state
    const [showEnrollment, setShowEnrollment] = useState(false)
    const [enrollStep, setEnrollStep] = useState<'details' | 'payment'>('details')
    const [enrollData, setEnrollData] = useState({ name: '', email: '', phone: '' })

    const [clientSecret, setClientSecret] = useState<string | null>(null)
    const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null)
    const [checkoutLoading, setCheckoutLoading] = useState(false)


    useEffect(() => {
        setIsMounted(true)
        console.log("DEScheduleContent mounted, type:", classType, "classification:", classification)
    }, [])

    useEffect(() => {
        if (!isMounted) return

        const fetchClasses = async () => {
            console.log("DEScheduleContent: Starting fetch for:", classType, classification)
            setLoading(true)
            setError(null)
            try {
                // Use the enhanced server action
                const data = await getClasses(classType, classification, limit + 1)

                console.log("DEScheduleContent: Fetched data length:", data?.length || 0)

                if (data) {
                    if (data.length > limit) {
                        setHasMore(true)
                        setClasses(data.slice(0, limit))
                    } else {
                        setHasMore(false)
                        setClasses(data)
                    }
                } else {
                    setClasses([])
                    setHasMore(false)
                }
            } catch (err: any) {
                console.error('DEScheduleContent: Catch-all error:', err)
                setError(err.message || "An unexpected error occurred while loading classes")
            } finally {
                setLoading(false)
            }
        }

        fetchClasses()
    }, [limit, classification, classType, isMounted])

    const handleLoadMore = () => {
        setLimit(prev => prev + 4)
    }

    const formatTime = (timeStr: string) => {
        try {
            if (!timeStr || typeof timeStr !== 'string') return ""
            const parts = timeStr.split(':')
            if (parts.length < 2) return timeStr
            const [hours, minutes] = parts
            const date = new Date()
            date.setHours(parseInt(hours))
            date.setMinutes(parseInt(minutes))
            return format(date, 'h:mm a')
        } catch (e) {
            console.error("Error formatting time:", timeStr, e)
            return timeStr
        }
    }

    const getWeeksAway = (dateStr: string) => {
        try {
            if (!dateStr) return ""
            const weeks = differenceInWeeks(parseISO(dateStr), new Date())
            if (weeks <= 0) return "next week"
            if (weeks === 1) return "in 1 week"
            return `in ${weeks} weeks`
        } catch (e) {
            console.error("Error calculating weeks away:", dateStr, e)
            return ""
        }
    }



    const handleBook = async (session: ClassSession) => {
        // For Drivers Ed (DE), keep the old intake flow
        if (classType === 'DE') {
            router.push(`/enroll/${session.id}/intake`)
            return
        }

        // For RSEP and DIP, collect details then launch checkout
        setSelectedSession(session)
        setEnrollStep('details')
        setShowEnrollment(true)
    }

    const handleProceedToPayment = async () => {
        if (!enrollData.name || !enrollData.email || !enrollData.phone) {
            alert("Please fill in all fields")
            return
        }

        setCheckoutLoading(true)
        try {
            const response = await fetch('/api/stripe/create-checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: "RSEP_DIP_ENROLLMENT",
                    classId: selectedSession?.id,
                    className: selectedSession?.name,
                    classDate: selectedSession?.start_date ? format(parseISO(selectedSession.start_date), 'yyyy-MM-dd') : '',
                    classTime: selectedSession?.daily_start_time,
                    uiMode: 'embedded',
                    studentName: enrollData.name,
                    studentEmail: enrollData.email,
                    studentPhone: enrollData.phone,
                    metadata: {
                        location: location || "silver-spring",
                        class_type: classType,
                        class_end_date: selectedSession?.end_date || ""
                    }
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to initialize checkout')
            }

            if (data.clientSecret) {
                setClientSecret(data.clientSecret)
                setEnrollStep('payment')
            }
        } catch (error: any) {
            console.error('Checkout Error:', error)
            alert(error.message || 'Something went wrong. Please try again.')
        } finally {
            setCheckoutLoading(false)
        }
    }



    const getFormName = () => {
        if (classType === 'DE') return "Driver's Education"
        if (classType === 'DIP') return "Driver Improvement"
        if (classType === 'RSEP') return "RSEP"
        return "Class"
    }

    return (
        <div className="flex flex-col min-h-screen bg-white">
            {/* Header */}
            <section className="bg-white pt-10 pb-6 border-b">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col items-center text-center mb-8">
                        <h1 className="text-2xl font-bold mb-2 text-gray-900">Selam Driving School</h1>
                        <h2 className="text-xl text-gray-700">Select {isBethesda ? "Bethesda " : ""}{getFormName()} {classification} Class</h2>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center max-w-4xl mx-auto text-sm text-gray-600">
                        <div className="flex items-center gap-2 mb-4 md:mb-0">
                            <span>Quantity:</span>
                            <div className="border rounded px-3 py-1">1</div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="uppercase text-xs font-bold tracking-wider">
                                Time Zone: <span className="underline decoration-dotted">Eastern Time (GMT-05:00)</span>
                            </div>
                            {hasMore && (
                                <div
                                    className="flex items-center gap-1 font-bold cursor-pointer hover:text-[#FDB813]"
                                    onClick={handleLoadMore}
                                >
                                    MORE TIMES <ChevronRight className="h-4 w-4" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Class List */}
            <section className="py-8 bg-white flex-grow">
                <div className="container mx-auto px-4 max-w-4xl">
                    {!isMounted ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin text-[#FDB813]" />
                            <p className="text-gray-500 text-sm animate-pulse">Initializing schedule view...</p>
                        </div>
                    ) : loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-[#FDB813]" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-20 text-red-500 bg-red-50 rounded-lg border border-red-100 p-6">
                            <p className="font-bold mb-2">Error loading classes</p>
                            <p className="text-sm">{error}</p>
                            <Button
                                variant="outline"
                                className="mt-4 border-red-200 text-red-700 hover:bg-red-100"
                                onClick={() => window.location.reload()}
                            >
                                Try Again
                            </Button>
                        </div>
                    ) : classes.length === 0 ? (
                        <div className="text-center py-20 text-gray-500">
                            No upcoming {getFormName()} {classification} classes available at the moment. Please check back later.
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {classes.map((session) => (
                                <div key={session.id} className="border-b pb-8 last:border-0">
                                    <div className="bg-gray-100 p-3 flex justify-between items-center font-medium text-gray-700 mb-6">
                                        <span>{format(parseISO(session.start_date), 'EEEE, MMMM do, yyyy')}</span>
                                        <span className="uppercase text-xs tracking-wider font-bold text-gray-500">
                                            {getWeeksAway(session.start_date)}
                                        </span>
                                    </div>

                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="flex-grow">
                                            <div className="flex justify-between items-center mb-2">
                                                <h3 className="text-2xl font-semibold text-gray-900 font-[family-name:var(--font-pontano)] leading-none">
                                                    {formatTime(session.daily_start_time)}
                                                </h3>
                                                <Button
                                                    className="bg-[#27ae60] hover:bg-[#219150] text-white font-bold py-4 px-6 rounded-none uppercase tracking-wider"
                                                    onClick={() => handleBook(session)}
                                                >
                                                    Book
                                                </Button>
                                            </div>

                                            <h4 className="text-lg font-normal text-gray-900 mb-1">
                                                {isBethesda ? `Bethesda ${session.name}` : session.name}
                                            </h4>
                                            <div className="text-gray-500 font-light mb-4 text-sm">
                                                {classType === 'DIP' ? '4-hour session @ $120.00' : `Session @ $${session.price || "0"}.00`}
                                            </div>

                                            <p className="text-gray-600 text-sm leading-relaxed mb-4">
                                                {isBethesda
                                                    ? `Our premium ${getFormName()} program for Bethesda students is designed to provide the highest quality instruction.`
                                                    : `This session takes place from ${formatTime(session.daily_start_time)} to ${formatTime(session.daily_end_time)}. Our programs are designed to provide the highest quality instruction.`
                                                }
                                            </p>

                                            <button className="text-xs font-bold text-gray-500 uppercase tracking-wider hover:text-black">
                                                Show All
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {hasMore && (
                        <div className="flex justify-center mt-8">
                            <Button
                                variant="outline"
                                onClick={handleLoadMore}
                                className="border-gray-300 hover:bg-gray-50 text-gray-900 font-bold uppercase tracking-wider rounded-none"
                            >
                                More Times <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </section>

            {/* Enrollment Dialog */}
            <Dialog open={showEnrollment} onOpenChange={setShowEnrollment}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white rounded-3xl border-none shadow-2xl">
                    <div className="bg-black p-8 text-white relative">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black text-white uppercase tracking-tight">
                                {enrollStep === 'details' ? 'Enrollment Details' : 'Secure Payment'}
                            </DialogTitle>
                            <DialogDescription className="text-gray-400">
                                {enrollStep === 'details'
                                    ? `Fill in your information for ${selectedSession?.name}`
                                    : `Complete your payment for ${selectedSession?.name}`
                                }
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-8">
                        {enrollStep === 'details' ? (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Full Name</label>
                                    <input
                                        type="text"
                                        placeholder="John Doe"
                                        className="w-full h-14 px-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#FDB813] focus:border-transparent transition-all outline-none font-medium"
                                        value={enrollData.name}
                                        onChange={(e) => setEnrollData({ ...enrollData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Email Address</label>
                                    <input
                                        type="email"
                                        placeholder="john@example.com"
                                        className="w-full h-14 px-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#FDB813] focus:border-transparent transition-all outline-none font-medium"
                                        value={enrollData.email}
                                        onChange={(e) => setEnrollData({ ...enrollData, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Phone Number</label>
                                    <input
                                        type="tel"
                                        placeholder="(555) 000-0000"
                                        className="w-full h-14 px-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#FDB813] focus:border-transparent transition-all outline-none font-medium"
                                        value={enrollData.phone}
                                        onChange={(e) => setEnrollData({ ...enrollData, phone: e.target.value })}
                                    />
                                </div>

                                <Button
                                    onClick={handleProceedToPayment}
                                    disabled={checkoutLoading || !enrollData.name || !enrollData.email || !enrollData.phone}
                                    className="w-full bg-[#FDB813] hover:bg-[#e5a700] text-black font-black h-14 rounded-none text-lg uppercase tracking-wider transition-all shadow-lg"
                                >
                                    {checkoutLoading ? <Loader2 className="animate-spin h-6 w-6" /> : 'Continue to Payment'}
                                </Button>
                            </div>
                        ) : (
                            <div>
                                {clientSecret ? (
                                    <div className="min-h-[400px]">
                                        <EmbeddedCheckoutProvider
                                            stripe={stripePromise}
                                            options={{ clientSecret }}
                                        >
                                            <EmbeddedCheckout />
                                        </EmbeddedCheckoutProvider>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                        <Loader2 className="w-10 h-10 animate-spin text-[#FDB813]" />
                                        <p className="text-gray-400 font-medium animate-pulse">Initializing secure checkout...</p>
                                    </div>
                                )}

                                <button
                                    onClick={() => {
                                        setEnrollStep('details')
                                        setClientSecret(null)
                                    }}
                                    className="mt-6 w-full text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-black transition-colors"
                                >
                                    ← Back to Details
                                </button>
                            </div>
                        )}

                        <p className="mt-8 text-[10px] text-gray-400 text-center uppercase tracking-widest font-bold">
                            Secure Encrypted Checkout • SSL Verified
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
