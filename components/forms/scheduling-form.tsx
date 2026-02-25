"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { format, addDays, isSameDay, parseISO, addMinutes, parse } from "date-fns"
import { ChevronLeft, ChevronRight, ChevronDown, CheckCircle2, Loader2, Calendar as CalendarIcon, Clock } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import { loadStripe } from "@stripe/stripe-js"
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js"

import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { DateTimePicker } from "@/components/ui/date-time-picker"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { supabase } from "@/lib/supabaseClient"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { Shield, Car, FileText, GraduationCap, Check, Info } from "lucide-react"

const formSchema = z.object({
    service: z.string({
        required_error: "Please select a service.",
    }),
    instructor: z.string().optional(),
    date: z.date({
        required_error: "Please select a date.",
    }),
    time: z.string({
        required_error: "Please select a time.",
    }),
    name: z.string().min(2, "Name must be at least 2 characters."),
    email: z.string().email("Please enter a valid email."),
    phone: z.string().min(10, "Please enter a valid phone number."),
})

const DIRECT_EMBEDDED_PAID_PLANS = [
    "driving-practice-1hr",
    "driving-practice-2hr",
    "road-test-escort",
    "road-test-1hr",
    "road-test-2hr",
] as const

type DirectPaidPlan = typeof DIRECT_EMBEDDED_PAID_PLANS[number]

const DIRECT_PLAN_DEFAULTS: Record<DirectPaidPlan, { name: string; duration_minutes: number }> = {
    "driving-practice-1hr": { name: "Driver's Practice (1 Hour)", duration_minutes: 60 },
    "driving-practice-2hr": { name: "Driver's Practice (2 Hour)", duration_minutes: 120 },
    "road-test-escort": { name: "Road Test Escort", duration_minutes: 120 },
    "road-test-1hr": { name: "Road Test Escort + 1 Hour", duration_minutes: 150 },
    "road-test-2hr": { name: "Road Test Escort + 2 Hour", duration_minutes: 210 },
}

const REALTIME_AVAILABILITY_PLANS = [
    'btw',
    'driving-practice-2hr',
    'driving-practice-1hr',
    'road-test-escort',
    'road-test-1hr',
    'road-test-2hr'
] as const

const AVAILABILITY_CACHE_TTL_MS = 30_000

export function SchedulingForm({ defaultPlan }: { defaultPlan?: string }) {
    const searchParams = useSearchParams()
    const router = useRouter()
    const rawPlan = searchParams.get("plan") || defaultPlan

    // Normalize legacy slugs to match database
    const plan = React.useMemo(() => {
        if (rawPlan === 'practice-1hr') return 'refresher'
        if (rawPlan === 'practice-2hr') return 'driving-practice-2hr'
        if (rawPlan === 'practice-10hr') return 'driving-practice-10hr'
        if (rawPlan === 'road-test-car') return 'road-test-escort' // potential legacy
        return rawPlan
    }, [rawPlan])
    const isDirectPaidPlan = React.useMemo(
        () => !!plan && (DIRECT_EMBEDDED_PAID_PLANS as readonly string[]).includes(plan),
        [plan]
    )
    const directCheckoutPath = React.useMemo(() => {
        if (!plan) return null
        if (plan.startsWith("road-test")) return "/services/road-test-packages/checkout"
        if (plan.startsWith("driving-practice")) return "/services/driving-practice-packages/checkout"
        return null
    }, [plan])

    // Steps: 0 = Service Selection, 1 = Date/Time, 2 = Details, 3 = Success
    const [step, setStep] = React.useState(plan ? 1 : 0)
    const [isSuccess, setIsSuccess] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(false)
    const [clientSecret, setClientSecret] = React.useState<string | null>(null)

    const [userId, setUserId] = React.useState<string | null>(null)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            service: plan || "",
            instructor: "any",
            name: "",
            email: "",
            phone: "",
        },
    })

    // --- Real-time Availability Logic ---
    const [availableSlots, setAvailableSlots] = React.useState<string[]>([])
    const [isFetchingAvailability, setIsFetchingAvailability] = React.useState(false)
    const [packageDetails, setPackageDetails] = React.useState<any>(null)
    const [instructors, setInstructors] = React.useState<any[]>([])
    const [services, setServices] = React.useState<any[]>([])
    const [selectedServiceDetails, setSelectedServiceDetails] = React.useState<any>(null)

    const selectedDate = form.watch("date")
    const selectedInstructor = form.watch("instructor")
    const selectedTime = form.watch("time")
    const selectedService = form.watch("service")
    const availabilityCacheRef = React.useRef<Map<string, { slots: string[]; cachedAt: number }>>(new Map())
    const availabilityRequestIdRef = React.useRef(0)

    // Fetch instructors and services on mount
    React.useEffect(() => {
        if (isDirectPaidPlan && plan && (DIRECT_PLAN_DEFAULTS as Record<string, any>)[plan]) {
            const fallback = DIRECT_PLAN_DEFAULTS[plan as DirectPaidPlan]
            setSelectedServiceDetails((prev) => prev || {
                id: plan,
                slug: plan,
                name: fallback.name,
                duration_minutes: fallback.duration_minutes,
                description: "",
            })
            setPackageDetails((prev) => prev || {
                plan_key: plan,
                duration_minutes: fallback.duration_minutes,
                instructor_id: null,
            })
            setServices([])
            setInstructors([])
            return
        }

        const fetchInstructors = async () => {
            try {
                const { data, error } = await supabase.from('instructors').select('id, full_name, profile_id')
                if (error) {
                    console.warn("Unable to load instructors (non-blocking):", error.message)
                    return
                }
                if (data) setInstructors(data)
            } catch (err) {
                console.warn("Unable to load instructors (non-blocking):", err)
            }
        }
        const fetchServices = async () => {
            try {
                const { data, error } = await supabase.from('services').select('*').eq('is_active', true)
                if (error) {
                    console.warn("Unable to load services (non-blocking):", error.message)
                    return
                }
                if (data) {
                    setServices(data)
                    if (plan) {
                        const found = data.find(s => s.slug === plan)
                        if (found) setSelectedServiceDetails(found)
                    }
                }
            } catch (err) {
                console.warn("Unable to load services (non-blocking):", err)
            }
        }
        fetchInstructors()
        fetchServices()
    }, [isDirectPaidPlan, plan])

    // Fetch specific package details whenever selectedService changes
    React.useEffect(() => {
        if ([
            'btw',
            'driving-practice-2hr',
            'driving-practice-1hr',
            'road-test-escort',
            'road-test-1hr',
            'road-test-2hr'
        ].includes(selectedService)) {
            const fetchPkg = async () => {
                if ((DIRECT_PLAN_DEFAULTS as Record<string, any>)[selectedService]) {
                    const fallback = DIRECT_PLAN_DEFAULTS[selectedService as DirectPaidPlan]
                    setPackageDetails({
                        plan_key: selectedService,
                        duration_minutes: fallback.duration_minutes,
                        instructor_id: null,
                    })
                    return
                }

                try {
                    const { data, error } = await supabase
                        .from('service_packages')
                        .select('*')
                        .eq('plan_key', selectedService)
                        .single()
                    if (error) {
                        console.warn("Unable to load service package (non-blocking):", error.message)
                        return
                    }
                    if (data) setPackageDetails(data)
                } catch (err) {
                    console.warn("Unable to load service package (non-blocking):", err)
                }
            }
            fetchPkg()
        } else {
            setPackageDetails(null)
        }
    }, [selectedService])

    const fetchAvailabilityFor = React.useCallback(async (
        planKey: string,
        dateStr: string,
        options?: { silent?: boolean; requestId?: number }
    ) => {
        const cacheKey = `${planKey}:${dateStr}`
        try {
            const response = await fetch(`/api/availability?plan_key=${planKey}&date=${dateStr}`)
            const data = await response.json().catch(() => ({}))

            if (Array.isArray(data?.slots)) {
                availabilityCacheRef.current.set(cacheKey, {
                    slots: data.slots,
                    cachedAt: Date.now(),
                })

                const isLatestRequest =
                    options?.requestId == null || options.requestId === availabilityRequestIdRef.current
                if (isLatestRequest) {
                    setAvailableSlots(data.slots)
                }
                return data.slots as string[]
            }

            if (!options?.silent) {
                console.error("Availability error:", data?.error)
                toast.error("Failed to load available times.")
            }
            return null
        } catch (err) {
            if (!options?.silent) {
                console.error("Error fetching availability:", err)
                toast.error("Network error. Please try again.")
            }
            return null
        }
    }, [])

    // Fetch real-time availability when date or service changes
    React.useEffect(() => {
        if (!selectedDate || !REALTIME_AVAILABILITY_PLANS.includes(selectedService as any)) {
            if (!REALTIME_AVAILABILITY_PLANS.includes(selectedService as any)) {
                setAvailableSlots(["07:00", "09:00", "11:00", "13:00", "15:00", "17:00", "19:00"])
            }
            setIsFetchingAvailability(false)
            return
        }

        const dateStr = format(selectedDate, "yyyy-MM-dd")
        const cacheKey = `${selectedService}:${dateStr}`
        const cached = availabilityCacheRef.current.get(cacheKey)
        const isFresh = !!cached && (Date.now() - cached.cachedAt) < AVAILABILITY_CACHE_TTL_MS
        const requestId = ++availabilityRequestIdRef.current

        if (isFresh) {
            setAvailableSlots(cached!.slots)
            setIsFetchingAvailability(false)
        } else {
            // Keep previous slots visible while loading to avoid a blank UI flash.
            setIsFetchingAvailability(true)
        }

        let cancelled = false

        const load = async () => {
            const slots = await fetchAvailabilityFor(selectedService, dateStr, {
                silent: false,
                requestId,
            })

            if (!cancelled && requestId === availabilityRequestIdRef.current) {
                setIsFetchingAvailability(false)
            }

            // Warm nearby dates in the background to make next clicks feel faster.
            if (slots && !cancelled) {
                const nearbyDates = [addDays(selectedDate, 1), addDays(selectedDate, -1)]
                    .map((d) => format(d, "yyyy-MM-dd"))

                for (const nearbyDate of nearbyDates) {
                    const nearbyKey = `${selectedService}:${nearbyDate}`
                    const nearbyCached = availabilityCacheRef.current.get(nearbyKey)
                    const nearbyFresh = !!nearbyCached && (Date.now() - nearbyCached.cachedAt) < AVAILABILITY_CACHE_TTL_MS
                    if (!nearbyFresh) {
                        void fetchAvailabilityFor(selectedService, nearbyDate, { silent: true })
                    }
                }
            }
        }

        void load()

        return () => {
            cancelled = true
        }
    }, [selectedDate, selectedService, fetchAvailabilityFor])



    // Update form service if plan changes
    React.useEffect(() => {
        if (plan && services.length > 0) {
            form.setValue("service", plan)
            const found = services.find(s => s.slug === plan)
            if (found) setSelectedServiceDetails(found)
        }
    }, [plan, services, form])

    React.useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user) {
                setUserId(session.user.id)
                if (!form.getValues("name")) form.setValue("name", session.user.user_metadata?.full_name || "")
                if (!form.getValues("email")) form.setValue("email", session.user.email || "")
            }
        }
        checkUser()
    }, [form])

    React.useEffect(() => {
        if (directCheckoutPath) {
            router.prefetch(directCheckoutPath)
        }
    }, [directCheckoutPath, router])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        try {
            // For realtime plans, values.time is a full ISO string
            const isRealtime = plan && REALTIME_AVAILABILITY_PLANS.includes(plan as any)
            const startTimeStr = isRealtime ? values.time : (() => {
                const [hours, minutes] = values.time.split(':').map(Number)
                const d = new Date(values.date)
                d.setHours(hours, minutes, 0, 0)
                return d.toISOString()
            })()

            const startDate = parseISO(startTimeStr)

            // Get duration and instructor
            let durationMinutes = 120
            let instructorId = packageDetails?.instructor_id || (values.instructor === "any" ? null : values.instructor)

            if (isRealtime) {
                if (!packageDetails) {
                    throw new Error("Package configuration not found. Please refresh and try again.")
                }
                durationMinutes = packageDetails.duration_minutes
                // Double check instructor is still available (Conflict Handling)
                const dateStr = format(startDate, "yyyy-MM-dd")
                const availCheck = await fetch(`/api/availability?plan_key=${plan}&date=${dateStr}`).then(r => r.json())
                if (!availCheck.slots?.includes(startTimeStr)) {
                    throw new Error("That time was just booked. Please pick another time.")
                }
            } else {
                const currentService = services.find(s => s.slug === values.service)
                durationMinutes = currentService?.duration_minutes || 120
            }

            const endDate = addMinutes(startDate, durationMinutes)


            const bookingData = {
                student_id: userId,
                instructor_id: instructorId,
                start_time: startDate.toISOString(),
                end_time: endDate.toISOString(),
                status: 'scheduled',
                plan_key: isRealtime ? plan : null
            }

            const { error: bookingError } = await supabase.from('driving_sessions').insert([bookingData])
            if (bookingError) throw bookingError

            if (userId) {
                try {
                    const { data: courseData } = await supabase.from('courses').select('id').eq('slug', values.service).single()
                    if (courseData) {
                        await supabase.from('enrollments').insert([{ user_id: userId, course_id: courseData.id, status: 'active' }])
                    }
                } catch (courseError) {
                    console.warn("Course enrollment failed (non-critical):", courseError)
                }
            }

            try {
                await fetch('/api/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: values.name,
                        email: values.email,
                        service: selectedServiceDetails?.name || values.service,
                        date: format(values.date, "PPP"),
                        time: values.time,
                        instructor: values.instructor !== "any" ? values.instructor : undefined,
                        emailType: 'student'
                    })
                })

                // Send notification to instructor
                await fetch('/api/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: values.name,
                        email: values.email,
                        service: selectedServiceDetails?.name || values.service,
                        date: format(values.date, "PPP"),
                        time: values.time,
                        instructor: values.instructor !== "any" ? values.instructor : undefined,
                        emailType: 'instructor'
                    })
                })

                toast.success("Booking confirmed & email sent!")
            } catch (networkError) {
                console.error("Network/Fetch Error:", networkError)
                toast.warning("Booking confirmed, but email failed to send.")
            }

            setIsSuccess(true)
        } catch (error: any) {
            console.error("Booking error:", error)
            toast.error(`Booking failed: ${error.message || "Please try again."}`)
        } finally {
            setIsLoading(false)
        }
    }

    const nextStep = async () => {
        // QUICK CHECKOUT FOR STRIPE PLANS
        const PAID_PLANS = [
            'driving-practice-1hr',
            'driving-practice-2hr',
            'road-test-escort',
            'road-test-1hr',
            'road-test-2hr'
        ]
        if (step === 1 && plan && PAID_PLANS.includes(plan)) {
            // Validate date/time + customer details before redirecting to embedded checkout.
            const isValid = await form.trigger(["date", "time"])
            if (!isValid) return

            setIsLoading(true)
            try {
                // Determine instructor ID (default to whatever is set or null)
                // If it's step 1, instructor might not be set in the UI yet if it was in step 2.
                // However, we removed step 2. So we check if instructor is in Step 1 or unnecessary.
                // The current form only shows instructor in Step 2.
                // If the user wants to remove Step 2, we assume "Any Instructor" or it doesn't matter for scheduling initial slot.
                // But wait, the backend needs instructorId if possible.
                // If not set, we send null? Metadata handles it.

                const values = form.getValues()
                const dateVal = values.date
                const timeVal = values.time

                // Calculate ISO
                let startTimeStr = timeVal
                if (!timeVal.includes('T')) {
                    const [hours, minutes] = timeVal.split(':').map(Number)
                    const d = new Date(dateVal)
                    d.setHours(hours, minutes, 0, 0)
                    startTimeStr = d.toISOString()
                }
                const startDate = parseISO(startTimeStr)

                if (
                    plan === 'driving-practice-1hr' ||
                    plan === 'driving-practice-2hr' ||
                    plan === 'road-test-escort' ||
                    plan === 'road-test-1hr' ||
                    plan === 'road-test-2hr'
                ) {
                    const isRoadTestPlan = plan.startsWith('road-test')
                    const checkoutPath = isRoadTestPlan
                        ? "/services/road-test-packages/checkout"
                        : "/services/driving-practice-packages/checkout"

                    const defaultClassName = plan === 'driving-practice-2hr'
                        ? "Driver's Practice (2 Hour)"
                        : plan === 'road-test-escort'
                            ? "Road Test Escort"
                            : plan === 'road-test-1hr'
                                ? "Road Test Escort + 1 Hour"
                                : plan === 'road-test-2hr'
                                    ? "Road Test Escort + 2 Hour"
                                    : "Driver's Practice (1 Hour)"

                    const params = new URLSearchParams({
                        service_slug: plan,
                        class_name: selectedServiceDetails?.name || defaultClassName,
                        class_date: format(startDate, "yyyy-MM-dd"),
                        class_time: startDate.toISOString(),
                        name: form.getValues("name") || "",
                        email: form.getValues("email") || "",
                        phone: form.getValues("phone") || "",
                    })
                    router.push(`${checkoutPath}?${params.toString()}`)
                    return
                }

                // Instructor
                // If Step 2 is removed, we don't have instructor selection unless we move it to Step 1.
                // Assuming "Any" or null for now as per "Your details page should be deleted".
                const finalInstructorId = packageDetails?.instructor_id || null

                const res = await fetch("/api/stripe/create-checkout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        type: plan?.startsWith('road-test') ? "ROAD_TEST_PACKAGE" : "DRIVING_PRACTICE_PACKAGE",
                        plan_slug: plan,
                        uiMode: 'embedded',
                        userId: userId || undefined,
                        studentEmail: form.getValues("email") || undefined,
                        studentName: form.getValues("name") || undefined,
                        classDate: format(startDate, "yyyy-MM-dd"),
                        classTime: startDate.toISOString(),
                        instructorId: finalInstructorId
                    }),
                })

                const data = await res.json()
                if (data.clientSecret) {
                    setClientSecret(data.clientSecret)
                    setStep(3) // Go to checkout step
                    return
                } else if (data.url) {
                    window.location.href = data.url
                    return
                } else {
                    throw new Error(data.error || "Failed to initialize payment.")
                }

            } catch (err: any) {
                console.error("Quick checkout error:", err)
                toast.error(err.message || "Payment initialization failed")
                setIsLoading(false)
            }
            return
        }

        let fieldsToValidate: any[] = []
        if (step === 0) fieldsToValidate = ["service"]
        if (step === 1) fieldsToValidate = ["date", "time"]
        const isValid = await form.trigger(fieldsToValidate)
        if (isValid) setStep(step + 1)
    }

    const prevStep = () => {
        if (step > 0) setStep(step - 1)
    }

    const timeSlots = ["07:00", "09:00", "11:00", "13:00", "15:00", "17:00", "19:00"]

    const formatTimeDisplay = (timeStr: string) => {
        if (timeStr.includes('T')) {
            // It's an ISO string
            return format(parseISO(timeStr), 'h:mm a')
        }
        // It's a 24h string (old logic)
        const [hours, minutes] = timeStr.split(':').map(Number)
        const period = hours >= 12 ? 'pm' : 'am'
        const hours12 = hours % 12 || 12
        return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`
    }

    const getServiceIcon = (slug: string) => {
        if (slug.includes('practice')) return <Car className="w-6 h-6" />
        if (slug.includes('test')) return <Shield className="w-6 h-6" />
        if (slug.includes('dip') || slug.includes('improvement')) return <GraduationCap className="w-6 h-6" />
        return <FileText className="w-6 h-6" />
    }

    const steps = [
        { id: 0, name: "Service" },
        { id: 1, name: "Date & Time" },
        { id: 2, name: "Details" },
        { id: 3, name: "Payment" }
    ]

    if (isSuccess) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-[2rem] shadow-xl border border-gray-100 p-12 max-w-2xl mx-auto"
            >
                <div className="h-24 w-24 rounded-full bg-[#FDB813]/20 flex items-center justify-center mb-8">
                    <CheckCircle2 className="h-12 w-12 text-[#FDB813]" />
                </div>
                <h2 className="text-4xl font-black tracking-tight text-gray-900 mb-4">Booking Confirmed!</h2>
                <p className="text-lg text-gray-500 max-w-md mb-10 leading-relaxed">
                    Your lesson has been successfully booked. We've sent a confirmation email with all the details.
                </p>
                <Button onClick={() => {
                    setIsSuccess(false)
                    setStep(plan ? 1 : 0)
                    form.reset()
                }} className="bg-black hover:bg-gray-800 text-white font-bold text-lg px-8 py-6 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                    Book Another Lesson
                </Button>
            </motion.div>
        )
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-7xl mx-auto px-4">

                <AnimatePresence mode="wait">
                    {/* Step 0: Service Selection */}
                    {step === 0 && (
                        <motion.div
                            key="step0"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100"
                        >
                            <div className="mb-10 text-center">
                                <h3 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Select a Service</h3>
                                <p className="text-gray-500">Choose the package that works best for you</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {services.map((service) => (
                                    <div
                                        key={service.id}
                                        onClick={() => {
                                            form.setValue("service", service.slug)
                                            setSelectedServiceDetails(service)
                                            nextStep()
                                        }}
                                        className={cn(
                                            "group cursor-pointer p-6 rounded-2xl border transition-all duration-200 flex flex-col gap-4 text-left relative overflow-hidden",
                                            selectedService === service.slug
                                                ? "border-black bg-gray-50"
                                                : "border-gray-200 hover:border-gray-300 hover:shadow-md bg-white"
                                        )}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className={cn(
                                                "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                                                selectedService === service.slug ? "bg-black text-white" : "bg-gray-100 text-gray-600 group-hover:bg-gray-200"
                                            )}>
                                                {getServiceIcon(service.slug)}
                                            </div>
                                            {selectedService === service.slug && (
                                                <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center">
                                                    <Check className="w-4 h-4 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-lg mb-1">{service.name}</h4>
                                            <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed">{service.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Step 1: Date & Time Selection */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="w-full animate-in fade-in duration-500"
                        >
                            <div className="mb-12">
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    className="flex items-center text-sm font-medium text-gray-500 hover:text-black mb-6 transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4 mr-1" />
                                    Back
                                </button>
                                <h2 className="text-4xl font-bold text-gray-900 mb-2">Schedule your service</h2>
                                <p className="text-lg text-gray-600">Check out our availability and book the date and time that works for you</p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
                                {/* Left + Middle Columns: Calendar & Times handled by DateTimePicker */}
                                <div className="lg:col-span-8">
                                    <div className="flex items-end justify-between border-b pb-4 border-gray-200 mb-8">
                                        <h3 className="text-xl font-bold text-gray-900 border-b-2 border-[#FDB813] pb-4 -mb-4.5 inline-block pr-6">
                                            Select a Date and Time
                                        </h3>
                                        <span className="text-sm font-medium text-gray-400 p-1">
                                            Eastern Standard Time (EST)
                                        </span>
                                    </div>

                                    <DateTimePicker
                                        minDate={new Date()}
                                        isLoading={isFetchingAvailability}
                                        availableTimes={availableSlots.length > 0 ? availableSlots.map(s => formatTimeDisplay(s)) : []}
                                        onDateChange={(date) => form.setValue("date", date)}
                                        onSelect={(date, time) => {
                                            const originalSlot = availableSlots.find(s => formatTimeDisplay(s) === time) || time
                                            form.setValue("time", originalSlot)
                                        }}
                                        selectedTime={selectedTime ? formatTimeDisplay(selectedTime) : null}
                                        selectedDate={selectedDate}
                                    />
                                </div>

                                {/* Right Column: Service Details */}
                                <div className="lg:col-span-4">
                                    <div className="border-b border-gray-200 mb-8 pb-4">
                                        <h3 className="text-xl font-bold text-gray-900 border-b-2 border-[#FDB813] pb-4 -mb-4.5 inline-block pr-12">
                                            Service Details
                                        </h3>
                                    </div>

                                    <div className="bg-white rounded-none">
                                        {/* Clean layout, no card background needed unless specified. Image looks clean. */}
                                        <div className="mb-8">
                                            <h4 className="text-xl font-bold text-gray-900 mb-2">
                                                {selectedServiceDetails?.name || "Service Selection"}
                                            </h4>
                                            <div className="flex items-center text-sm font-medium text-gray-500 cursor-pointer hover:text-black transition-colors">
                                                More details
                                                <ChevronDown className="w-4 h-4 ml-1" />
                                            </div>
                                        </div>

                                        {selectedDate && selectedTime ? (
                                            <div className="space-y-4 mb-8">
                                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Date</div>
                                                    <div className="font-semibold text-gray-900">{format(selectedDate, "EEEE, MMMM do, yyyy")}</div>
                                                </div>
                                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Time</div>
                                                    <div className="font-semibold text-gray-900">
                                                        {(() => {
                                                            let start: Date
                                                            if (selectedTime.includes('T')) {
                                                                start = parseISO(selectedTime)
                                                            } else {
                                                                start = parse(selectedTime, "HH:mm", selectedDate || new Date())
                                                            }
                                                            const fallbackDuration = (selectedService && (DIRECT_PLAN_DEFAULTS as Record<string, any>)[selectedService]?.duration_minutes)
                                                                || (plan && (DIRECT_PLAN_DEFAULTS as Record<string, any>)[plan]?.duration_minutes)
                                                                || 120
                                                            const end = addMinutes(start, selectedServiceDetails?.duration_minutes || fallbackDuration)
                                                            return `${format(start, "h:mm a")} - ${format(end, "h:mm a")}`
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-6 bg-gray-50 rounded-xl border border-gray-100 text-center text-gray-400 text-sm mb-8">
                                                Please select a date and time to proceed.
                                            </div>
                                        )}

                                        <Button
                                            type="button"
                                            onClick={nextStep}
                                            disabled={!selectedDate || !selectedTime || isLoading}
                                            className="w-full bg-black hover:bg-gray-800 text-white font-bold h-14 rounded-xl text-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isLoading ? <Loader2 className="animate-spin h-6 w-6 mr-2" /> : null}
                                            {isLoading ? "Processing..." : (plan && ['driving-practice-1hr', 'driving-practice-2hr'].includes(plan)) ? "Continue to Payment" : "Next"}
                                        </Button>

                                        <div className="mt-6 flex justify-center text-center">
                                            <a href="/contact" className="text-sm text-gray-400 hover:text-black transition-colors group">
                                                Need help? <span className="underline decoration-2 decoration-[#FDB813] underline-offset-4 group-hover:decoration-black">Contact us</span> to register manually.
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 2: Personal Details */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 md:p-12 max-w-4xl mx-auto"
                        >
                            <div className="max-w-3xl mx-auto">
                                <div className="flex items-center mb-10">
                                    <Button variant="ghost" onClick={prevStep} className="p-0 hover:bg-transparent text-gray-500 hover:text-black mr-4">
                                        <ChevronLeft className="w-6 h-6" />
                                    </Button>
                                    <div className="flex-1">
                                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Your Details</h2>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem className="col-span-2">
                                                <FormLabel className="text-sm font-bold text-gray-900 uppercase tracking-wide">Full Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="John Doe" {...field} className="h-14 text-base rounded-xl border-gray-200 focus:border-black focus:ring-black transition-all bg-gray-50 focus:bg-white" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-bold text-gray-900 uppercase tracking-wide">Email Address</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="john@example.com" {...field} className="h-14 text-base rounded-xl border-gray-200 focus:border-black focus:ring-black transition-all bg-gray-50 focus:bg-white" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-bold text-gray-900 uppercase tracking-wide">Phone Number</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="(555) 123-4567" {...field} className="h-14 text-base rounded-xl border-gray-200 focus:border-black focus:ring-black transition-all bg-gray-50 focus:bg-white" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="instructor"
                                        render={({ field }) => (
                                            <FormItem className="col-span-2">
                                                <FormLabel className="text-sm font-bold text-gray-900 uppercase tracking-wide">Preferred Instructor (Optional)</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-14 text-base rounded-xl border-gray-200 focus:border-black focus:ring-black transition-all bg-gray-50 focus:bg-white">
                                                            <SelectValue placeholder="Any Instructor" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="any">Any Instructor</SelectItem>
                                                        {instructors.map((inst) => (
                                                            <SelectItem key={inst.id} value={inst.id}>
                                                                {inst.full_name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="bg-[#FDB813] hover:bg-[#e5a700] text-black font-black h-16 px-12 rounded-xl text-xl min-w-[240px] uppercase tracking-wider shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin h-6 w-6 mr-2" /> : null}
                                        {isLoading
                                            ? "Processing..."
                                            : (plan && ['driving-practice-1hr', 'driving-practice-2hr'].includes(plan))
                                                ? "Continue to Payment"
                                                : "Confirm Booking"
                                        }
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                    {/* Step 3: Embedded Checkout */}
                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full max-w-4xl mx-auto"
                        >
                            <div className="mb-8">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="flex items-center text-sm font-medium text-gray-500 hover:text-black mb-4 transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4 mr-1" />
                                    Change Time
                                </button>
                                <div className="flex items-center justify-between">
                                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">SECURE CHECKOUT</h2>
                                    <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                                        <Shield className="w-3 h-3" />
                                        <span className="text-[10px] font-black uppercase tracking-wider">Secure Connection</span>
                                    </div>
                                </div>
                            </div>

                            <div className="min-h-[500px]">
                                {clientSecret ? (
                                    <EmbeddedCheckoutProvider
                                        stripe={stripePromise}
                                        options={{ clientSecret }}
                                    >
                                        <EmbeddedCheckout />
                                    </EmbeddedCheckoutProvider>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                                        <Loader2 className="w-12 h-12 animate-spin text-[#FDB813]" />
                                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs animate-pulse">Initializing Secure Payment...</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </form>
        </Form>
    )
}
