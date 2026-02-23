"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon, CheckCircle2, Loader2, ChevronLeft, ChevronRight, Clock } from "lucide-react"
import { useSearchParams } from "next/navigation"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabaseClient"
import { toast } from "sonner"

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

export function BookingForm({ defaultPlan }: { defaultPlan?: string }) {
    const searchParams = useSearchParams()
    const plan = searchParams.get("plan") || defaultPlan

    // Steps: 1 = Date/Time, 2 = Details, 3 = Success
    const [step, setStep] = React.useState(1)
    const [isSuccess, setIsSuccess] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(false)
    const [userId, setUserId] = React.useState<string | null>(null)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            service: plan || "beginner", // Default to beginner if no plan
            instructor: "any",
            name: "",
            email: "",
            phone: "",
        },
    })

    // --- Real-time Availability Logic ---
    // --- Real-time Availability Logic ---
    const [bookedSlots, setBookedSlots] = React.useState<any[]>([])
    const [instructors, setInstructors] = React.useState<any[]>([])
    const [services, setServices] = React.useState<any[]>([])

    // Fetch instructors and services on mount
    React.useEffect(() => {
        const fetchData = async () => {
            const { data: instructorsData } = await supabase.from('instructors').select('id, full_name, profile_id')
            if (instructorsData) setInstructors(instructorsData)

            const { data: servicesData } = await supabase.from('services').select('*').eq('is_active', true)
            if (servicesData) setServices(servicesData)
        }
        fetchData()
    }, [])

    const selectedDate = form.watch("date")
    const selectedInstructor = form.watch("instructor")

    // Fetch bookings when date changes
    React.useEffect(() => {
        if (!selectedDate) return

        const fetchBookings = async () => {
            const dateStr = format(selectedDate, "yyyy-MM-dd")
            // We need to check for any sessions that overlap or start at this time
            // For simplicity, we'll just check start_time matching the date
            // In a real app, we'd check ranges.

            // Construct start and end of the day in UTC or appropriate timezone
            // But here we are storing timestamptz. 
            // Let's assume the simple case: fetch all sessions for the day

            const startOfDay = new Date(selectedDate)
            startOfDay.setHours(0, 0, 0, 0)
            const endOfDay = new Date(selectedDate)
            endOfDay.setHours(23, 59, 59, 999)

            const { data, error } = await supabase
                .from('driving_sessions')
                .select('start_time, instructor_id')
                .gte('start_time', startOfDay.toISOString())
                .lte('start_time', endOfDay.toISOString())
                .neq('status', 'cancelled')

            if (error) {
                console.error("Error fetching bookings:", error)
            } else {
                setBookedSlots(data || [])
            }
        }

        fetchBookings()

        // Real-time subscription
        const channel = supabase
            .channel('public:driving_sessions')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'driving_sessions' }, (payload) => {
                fetchBookings()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [selectedDate])

    const isTimeSlotBooked = (time: string) => {
        if (!bookedSlots) return false

        // Convert slot time to local date object to compare with session start_time
        // This is tricky with timezones. 
        // Ideally, we compare ISO strings or hours.
        // Let's assume the `start_time` from DB is ISO.

        // Filter bookings that start at this time (approximate match for now)
        const bookingsAtTime = bookedSlots.filter(b => {
            const sessionDate = new Date(b.start_time)
            const sessionTimeStr = format(sessionDate, "HH:mm")
            return sessionTimeStr === time
        })

        if (selectedInstructor && selectedInstructor !== 'any') {
            // Check if specific instructor is booked
            // selectedInstructor is the instructor ID (UUID)
            return bookingsAtTime.some(b => b.instructor_id === selectedInstructor)
        } else {
            // If "any", check if ALL instructors are booked
            // If we have no instructors in DB, we can't book?
            if (instructors.length === 0) return false
            return bookingsAtTime.length >= instructors.length
        }
    }
    // ------------------------------------

    // Update form service if plan changes
    React.useEffect(() => {
        if (plan) {
            form.setValue("service", plan)
        }
    }, [plan, form])

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

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        try {
            // Calculate start and end times
            const [hours, minutes] = values.time.split(':').map(Number)
            const startDate = new Date(values.date)
            startDate.setHours(hours, minutes, 0, 0)

            // Duration based on service
            const selectedService = services.find(s => s.slug === values.service)
            const durationHours = selectedService ? (selectedService.duration_minutes / 60) : 2

            const endDate = new Date(startDate)
            endDate.setHours(startDate.getHours() + durationHours)

            // Determine instructor
            let instructorId = values.instructor === "any" ? null : values.instructor

            // If "any", pick a random available instructor (simple logic)
            if (!instructorId && instructors.length > 0) {
                // Find an instructor who is NOT booked at this time
                const bookedInstructorIds = bookedSlots
                    .filter(b => {
                        const sessionDate = new Date(b.start_time)
                        return format(sessionDate, "HH:mm") === values.time
                    })
                    .map(b => b.instructor_id)

                const availableInstructors = instructors.filter(i => !bookedInstructorIds.includes(i.id))
                if (availableInstructors.length > 0) {
                    instructorId = availableInstructors[0].id
                }
            }

            const bookingData = {
                student_id: userId, // Must be logged in
                instructor_id: instructorId,
                start_time: startDate.toISOString(),
                end_time: endDate.toISOString(),
                status: 'scheduled',
                service_type: selectedService?.name || 'Driving Practice',
                service_slug: values.service
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

            // Send Confirmation Email
            try {
                const emailResponse = await fetch('/api/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: values.name,
                        email: values.email,
                        service: getServiceName(values.service),
                        date: format(values.date, "PPP"),
                        time: values.time,
                        instructor: values.instructor !== "any" ? values.instructor : undefined,
                        emailType: 'student'
                    })
                })

                if (!emailResponse.ok) {
                    const responseText = await emailResponse.text();
                    let errorMessage = "Unknown server error";

                    try {
                        const errorData = JSON.parse(responseText);
                        errorMessage = errorData.error || errorData.message || JSON.stringify(errorData);
                        console.error("Email API Error (JSON):", errorData);
                    } catch (parseError) {
                        console.error("Email API Error (Text):", responseText);
                        errorMessage = responseText || "Server returned an error without a message";
                    }

                    toast.warning("Booking confirmed, but email failed.", {
                        description: `Reason: ${errorMessage.substring(0, 100)}` // Truncate if too long
                    })
                } else {
                    toast.success("Booking confirmed & email sent!")
                }

                // Send notification to instructor
                const instructorEmailResponse = await fetch('/api/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: values.name,
                        email: values.email,
                        service: getServiceName(values.service),
                        date: format(values.date, "PPP"),
                        time: values.time,
                        instructor: values.instructor !== "any" ? values.instructor : undefined,
                        emailType: 'instructor'
                    })
                })

                if (!instructorEmailResponse.ok) {
                    console.error("Failed to send instructor notification email");
                }
            } catch (networkError) {
                console.error("Network/Fetch Error:", networkError)
                toast.warning("Booking confirmed, but email failed to send.", {
                    description: "Network error occurred."
                })
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
        let fieldsToValidate: any[] = []
        if (step === 1) fieldsToValidate = ["date", "time"]
        const isValid = await form.trigger(fieldsToValidate)
        if (isValid) setStep(step + 1)
    }

    const getServiceName = (value: string) => {
        const service = services.find(s => s.slug === value)
        return service ? `${service.name} ($${service.price})` : value
    }

    const timeSlots = ["08:30", "11:30", "14:30", "16:00"]

    const formatTimeDisplay = (time24: string) => {
        const [hours, minutes] = time24.split(':').map(Number)
        const period = hours >= 12 ? 'PM' : 'AM'
        const hours12 = hours % 12 || 12
        return `${hours12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`
    }

    if (isSuccess) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in duration-500">
                <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center mb-8">
                    <CheckCircle2 className="h-12 w-12 text-green-600" />
                </div>
                <h2 className="text-3xl font-black tracking-tight text-gray-900 mb-4">Booking Confirmed!</h2>
                <p className="text-lg text-gray-600 max-w-md mb-10 leading-relaxed">
                    Your lesson has been successfully booked. We've sent a confirmation email with all the details.
                </p>
                <Button onClick={() => {
                    setIsSuccess(false)
                    setStep(1)
                    form.reset()
                }} className="bg-black hover:bg-gray-800 text-white font-bold text-lg px-8 py-6 rounded-xl transition-all">
                    Book Another Lesson
                </Button>
            </div>
        )
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-8 max-w-[1280px] mx-auto">

                {/* Left Column: Main Content */}
                <div className="lg:col-span-2">
                    {step === 1 && (
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Unified Header */}
                            <div className="px-8 py-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">Select Date & Time</h2>
                                    <p className="text-gray-500 text-sm mt-1">Choose a convenient slot for your lesson</p>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100 self-start md:self-auto">
                                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">Eastern Time (EST)</span>
                                </div>
                            </div>

                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                                {/* Calendar */}
                                <div>
                                    <FormField
                                        control={form.control}
                                        name="date"
                                        render={({ field }) => (
                                            <FormItem>
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                                                    className="rounded-md border-none p-0 w-full"
                                                    classNames={{
                                                        month: "space-y-4",
                                                        caption: "flex justify-center pt-1 relative items-center mb-4",
                                                        caption_label: "text-sm font-bold text-gray-900 uppercase tracking-wide",
                                                        nav: "space-x-1 flex items-center",
                                                        nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-gray-100 rounded-full transition-all",
                                                        nav_button_previous: "absolute left-1",
                                                        nav_button_next: "absolute right-1",
                                                        table: "w-full border-collapse space-y-1",
                                                        head_row: "flex",
                                                        head_cell: "text-gray-400 rounded-md w-10 font-medium text-[0.7rem] uppercase tracking-wider",
                                                        row: "flex w-full mt-2",
                                                        cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-black/5 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                                        day: "h-10 w-10 p-0 font-medium aria-selected:opacity-100 hover:bg-gray-100 rounded-full transition-all text-gray-700 text-sm",
                                                        day_selected: "bg-black text-white hover:bg-gray-800 hover:text-white focus:bg-black focus:text-white font-bold shadow-md",
                                                        day_today: "bg-gray-50 text-gray-900 font-bold border border-gray-200",
                                                        day_outside: "text-gray-300 opacity-50",
                                                        day_disabled: "text-gray-300 opacity-50",
                                                        day_hidden: "invisible",
                                                    }}
                                                />
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Time Slots */}
                                <div className="flex flex-col h-full">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        Available Slots
                                    </h3>
                                    <FormField
                                        control={form.control}
                                        name="time"
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <div className="grid grid-cols-2 gap-3">
                                                    {timeSlots.map((time) => {
                                                        const isBooked = isTimeSlotBooked(time)
                                                        const isSelected = field.value === time
                                                        return (
                                                            <Button
                                                                key={time}
                                                                type="button"
                                                                disabled={isBooked}
                                                                variant="outline"
                                                                className={cn(
                                                                    "h-12 text-sm font-medium border transition-all relative overflow-hidden group rounded-xl",
                                                                    isSelected
                                                                        ? "bg-black text-white border-black shadow-md ring-1 ring-black"
                                                                        : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50",
                                                                    isBooked && "opacity-40 cursor-not-allowed bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-100 hover:bg-gray-50"
                                                                )}
                                                                onClick={() => field.onChange(time)}
                                                            >
                                                                <span className="relative z-10">{formatTimeDisplay(time)}</span>
                                                                {isBooked && <span className="ml-1.5 text-[10px] uppercase font-bold text-red-500">(Full)</span>}
                                                            </Button>
                                                        )
                                                    })}
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Compact Selected State */}
                                    <div className="mt-6 pt-6 border-t border-gray-100">
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
                                            <p className="text-gray-600">
                                                <span className="font-medium text-gray-900">Selected: </span>
                                                {form.watch("date") ? format(form.watch("date"), "MMM do") : "No date"}
                                                {form.watch("time") ? ` at ${formatTimeDisplay(form.watch("time"))}` : ""}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">Your Details</h2>
                                    <p className="text-gray-500 text-sm mt-1">Please provide your contact information</p>
                                </div>
                                <Button variant="ghost" onClick={() => setStep(1)} className="text-sm font-medium text-gray-500 hover:text-black hover:bg-gray-50 h-9 px-3 rounded-lg">
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    Back
                                </Button>
                            </div>

                            <div className="p-8 max-w-xl mx-auto">
                                <div className="space-y-5">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-gray-700 font-medium text-sm">Full Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="John Doe" {...field} className="h-12 rounded-lg border-gray-200 focus:border-black focus:ring-black transition-all bg-white" />
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
                                                <FormLabel className="text-gray-700 font-medium text-sm">Email Address</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="john@example.com" {...field} className="h-12 rounded-lg border-gray-200 focus:border-black focus:ring-black transition-all bg-white" />
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
                                                <FormLabel className="text-gray-700 font-medium text-sm">Phone Number</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="(555) 123-4567" {...field} className="h-12 rounded-lg border-gray-200 focus:border-black focus:ring-black transition-all bg-white" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="instructor"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-gray-700 font-medium text-sm">Preferred Instructor (Optional)</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-12 rounded-lg border-gray-200 focus:border-black focus:ring-black transition-all bg-white">
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
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Sidebar */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24">
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="bg-white border-b border-gray-100 px-6 py-5">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Summary</h3>
                            </div>

                            <div className="p-6">
                                <div className="mb-6">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Service</span>
                                    <h4 className="font-bold text-gray-900 text-lg mb-2 leading-snug">
                                        {getServiceName(form.watch("service"))}
                                    </h4>
                                    <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-4">
                                        <Clock className="h-3.5 w-3.5" />
                                        <p>{services.find(s => s.slug === form.watch("service"))?.duration_minutes ? `${services.find(s => s.slug === form.watch("service"))?.duration_minutes / 60} Hours` : "2 Hours"}</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {step === 1 ? (
                                        <Button
                                            type="button"
                                            onClick={nextStep}
                                            className="w-full bg-black hover:bg-gray-800 text-white font-bold h-12 rounded-xl text-sm transition-all shadow-sm hover:shadow-md"
                                        >
                                            Continue
                                        </Button>
                                    ) : (
                                        <Button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full bg-[#FDB813] hover:bg-[#e5a700] text-black font-bold h-12 rounded-xl text-sm transition-all shadow-sm hover:shadow-md"
                                        >
                                            {isLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                                            {isLoading ? "Processing..." : "Confirm Booking"}
                                        </Button>
                                    )}

                                    <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-400 mt-3">
                                        <span>Powered by</span>
                                        <span className="font-bold text-gray-500">Stripe</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </Form>
    )
}
