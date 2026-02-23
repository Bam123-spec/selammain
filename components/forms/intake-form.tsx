"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabaseClient"
import { toast } from "sonner"

const formSchema = z.object({
    firstName: z.string().min(2, "First name is required"),
    lastName: z.string().min(2, "Last name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Valid phone number is required"),
    address: z.string().min(5, "Address is required"),
    city: z.string().min(2, "City is required"),
    state: z.string().min(2, "State is required"),
    zipCode: z.string().min(5, "Zip code is required"),
    permitNumber: z.string().optional(),
    dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Valid date of birth is required",
    }),
    agreedToRights: z.boolean().refine((val) => val === true, {
        message: "You must agree to the rights and responsibilities",
    }),
    studentSignature: z.string().min(2, "Student signature is required"),
    studentSignatureDate: z.string(),
    parentSignature: z.string().optional(),
    parentSignatureDate: z.string().optional(),
})

interface IntakeFormProps {
    classId: string
    className?: string
    price?: number
}

export function IntakeForm({ classId, className, price }: IntakeFormProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = React.useState(false)
    const [isSuccess, setIsSuccess] = React.useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            address: "",
            city: "",
            state: "",
            zipCode: "",
            permitNumber: "",
            dateOfBirth: "",
            agreedToRights: false,
            studentSignature: "",
            studentSignatureDate: new Date().toISOString().split('T')[0],
            parentSignature: "",
            parentSignatureDate: new Date().toISOString().split('T')[0],
        },
    })

    // Pre-fill if user is logged in
    React.useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
                if (profile) {
                    form.setValue("firstName", profile.first_name || "")
                    form.setValue("lastName", profile.last_name || "")
                    form.setValue("email", user.email || "")
                    form.setValue("phone", profile.phone || "")
                }

                // Restore from localStorage if exists
                const savedData = localStorage.getItem(`intake_${classId}`)
                if (savedData) {
                    try {
                        const parsed = JSON.parse(savedData)
                        // Use reset to avoid partial updates if possible, or iterate through keys
                        Object.keys(parsed).forEach((key) => {
                            // @ts-ignore
                            form.setValue(key, parsed[key])
                        })
                        // Clear after restoring
                        localStorage.removeItem(`intake_${classId}`)
                        toast.success("Restored your previous information")
                    } catch (e) {
                        console.error("Failed to restore saved data:", e)
                    }
                }
            }
        }
        checkUser()
    }, [form, classId])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        try {
            // 1. Check if user exists
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                toast.error("Please log in or sign up to continue enrollment.")
                localStorage.setItem(`intake_${classId}`, JSON.stringify(values))
                router.push(`/student/login?next=/enroll/${classId}/intake`)
                return
            }

            // 2. Fetch Class Details to get course/type info
            const { data: classDetails } = await supabase
                .from('classes')
                .select('*')
                .eq('id', classId)
                .single()

            if (!classDetails) throw new Error("Class not found")

            // 3. Find matching course_id (Required for enrollment table)
            let courseIdToUse = null
            const { data: courses } = await supabase
                .from('courses')
                .select('id, title, type')
                .eq('type', classDetails.class_type === 'DE' ? 'drivers_ed' : 'behind_the_wheel')

            if (courses && courses.length > 0) {
                // For DE, prioritize the 'Basic Package' or 'drivers-ed' slug
                if (classDetails.class_type === 'DE') {
                    const basic = courses.find(c => c.title.toLowerCase().includes('basic'))
                    courseIdToUse = basic ? basic.id : courses[0].id
                } else {
                    courseIdToUse = courses[0].id
                }
            } else {
                // Emergency fallbacks
                if (classDetails.class_type === 'DE') courseIdToUse = '794fd69e-1b6e-4fab-914d-60ad93ebafe8'
            }

            if (!courseIdToUse) throw new Error("No matching course package found for this class type")

            // 4. Update/Create Profile
            const { error: profileError } = await supabase.from('profiles').upsert({
                id: user.id,
                email: user.email,
                first_name: values.firstName,
                last_name: values.lastName,
                full_name: `${values.firstName} ${values.lastName}`,
                phone: values.phone,
                address: values.address,
                city: values.city,
                state: values.state,
                zip_code: values.zipCode,
                role: 'student'
            })

            if (profileError) console.warn("Could not update profile:", profileError)

            // 5. Create/Update Enrollment
            const { data: existingEnrollment } = await supabase
                .from('enrollments')
                .select('id, status')
                .eq('class_id', classId)
                .eq('student_id', user.id)
                .single()

            let enrollmentId = existingEnrollment?.id
            const enrollmentData: any = {
                class_id: classId,
                course_id: courseIdToUse,
                student_id: user.id,
                user_id: user.id,
                status: 'pending_payment',
                first_name: values.firstName,
                last_name: values.lastName,
                email: values.email,
                phone: values.phone,
                permit_number: values.permitNumber,
                agreements_accepted: values.agreedToRights
            }

            if (existingEnrollment) {
                const { error: enrollError } = await supabase
                    .from('enrollments')
                    .update(enrollmentData)
                    .eq('id', existingEnrollment.id)

                if (enrollError) throw enrollError
            } else {
                const { data: newEnrollment, error: enrollError } = await supabase
                    .from('enrollments')
                    .insert([enrollmentData])
                    .select()
                    .single()

                if (enrollError) throw enrollError
                enrollmentId = newEnrollment.id
            }

            // 4. Send Confirmation Email (Optional at this stage, but good to keep)
            try {
                await fetch('/api/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: values.firstName,
                        email: values.email,
                        service: className || "Class Enrollment",
                        date: "Payment Pending",
                        time: "Check schedule in portal"
                    })
                })
            } catch (e) {
                console.warn("Email failed:", e)
            }

            // 5. Redirect to Checkout
            const params = new URLSearchParams({
                classId: classId,
                enrollmentId: enrollmentId || "",
                amount: price ? price.toString() : "0",
                serviceName: className || "Class Enrollment"
            })

            router.push(`/checkout?${params.toString()}`)

        } catch (error: any) {
            console.error("Intake error:", error)
            toast.error(`Registration failed: ${error.message || "Please try again."}`)
        } finally {
            setIsLoading(false)
        }
    }

    if (isSuccess) {
        return (
            <div className="text-center py-20 animate-in fade-in zoom-in duration-500">
                <div className="mb-8 flex justify-center">
                    <div className="bg-green-100 p-4 rounded-full">
                        <svg className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>
                <h2 className="text-4xl font-black tracking-tight text-gray-900 mb-4">Registration Successful!</h2>
                <p className="text-lg text-gray-500 max-w-md mx-auto mb-10 leading-relaxed">
                    Your enrollment for <span className="font-semibold text-gray-900">{className}</span> is confirmed!
                    We've sent a confirmation email to <span className="font-medium text-gray-900">{form.getValues("email")}</span> with all the details.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button
                        onClick={() => router.push('/student/dashboard')}
                        className="w-full sm:w-auto bg-gray-900 hover:bg-black text-white px-8 h-12 rounded-xl font-bold"
                    >
                        Go to Dashboard
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/')}
                        className="w-full sm:w-auto text-gray-600 hover:text-black font-medium"
                    >
                        Return Home
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Personal Information Section */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-900 border-b pb-2">Your Information</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>First Name <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input placeholder="Jane" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Last Name <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input placeholder="Doe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input placeholder="jane@example.com" {...field} />
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
                                    <FormLabel>Phone <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input placeholder="(555) 123-4567" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Street Address <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                    <Input placeholder="123 Main St" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                                <FormItem className="col-span-2 md:col-span-2">
                                    <FormLabel>City <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input placeholder="Silver Spring" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="state"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>State <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input placeholder="MD" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="zipCode"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Zip Code <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input placeholder="20910" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="dateOfBirth"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Date of Birth <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Rights and Responsibilities Section */}
                <div className="space-y-6 pt-6 border-t">
                    <h2 className="text-xl font-bold text-gray-900">Driving School and MVA New Drivers Guidelines</h2>

                    <div className="bg-gray-50 p-6 rounded-lg border text-sm text-gray-700 space-y-4 max-h-96 overflow-y-auto">
                        <p className="font-semibold">Unit 1: Getting Acquainted with your Driving School and MVA New Drivers Guidelines</p>
                        <p className="font-semibold">With Every Right Comes a Responsibility</p>
                        <p className="font-semibold">The Student and the Driving School</p>

                        <ol className="list-decimal pl-5 space-y-3">
                            <li>Each student has the right to a certified competent instructor, knowledgeable about the curriculum and traffic safety issues. With that right each student has the responsibility to arrive prepared and on time for every class without such distractions as talking or text messaging on cell phones, being disrespectful to the instructor, or talking with other student in class.</li>
                            <li>Each student has the right to be taught the entire 30 hours of classroom instruction in an informative, interesting and challenging manner. With that right each student has the responsibility to be attentive and actively participate in every class.</li>
                            <li>Each student has the right to experience the full 6 hours behind-the-wheel instruction as required in the curriculum. With that right each student will listen to the instructor and not drive in a negligent or dangerous manner.</li>
                            <li>Each student has the right to be treated in a courteous, civil and respectful manner. With that right students have the responsibility to always be polite and respectful to their instructors and be willing to accept positive criticism to help them achieve driving success.</li>
                            <li>Each student has the right to attend class in a clean, safe, secure, temperature-controlled and fully equipped classroom that meets the local fire and building codes and MVA requirements. With that right each student has the responsibility to respect the property of the driving school by not defacing or destroying equipment or vehicles.</li>
                            <li>Each student has the right and parent/driver coach has the right to visit the driving school, see the instructor’s license and certification, and the right to observe any class session including in-car sessions, in which their child is included. With that right each parent/driver coach has the responsibility to refrain from interfering with the instruction, classroom or driving, while the class is in session.</li>
                            <li>Each parent/driver coach and student have the right to have the driver education program, including both the 30 hours of classroom instruction and the 6 hours of required driving time, completed within 18 weeks of the first day of class. With that right each parent/driver coach has the responsibility to take an active role in his/her student’s driver education by monitoring all program, communicating with the driving school and/or instructor, and practicing with the student driver if he/she has a learner’s permit.</li>
                            <li>Each parent/driver coach and student have the right to place a complaint with the Motor Vehicle Administration regarding problems associated with the driving school or instructor (the number to call is 410-424-3751). With that right each parent/driver coach and student have the responsibility to attempt to promptly pay the driving school for the driver education class and to attempt to alert the owner or manager of the driving school about any problems or complaints before contacting an outside agency.</li>
                        </ol>

                        <p className="pt-2 font-medium italic">A copy of this form should be given to the student/parent/driver coach when signed.</p>
                        <p className="text-xs text-gray-500">http: www/adtsea.org Driver Education Classroom and In-car Curriculum 2.0</p>
                    </div>

                    <FormField
                        control={form.control}
                        name="agreedToRights"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                    <input
                                        type="checkbox"
                                        checked={field.value}
                                        onChange={field.onChange}
                                        className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black mt-1"
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>
                                        I understand the rights and responsibilities of Driving Schools, and Parent/Driver Coach <span className="text-red-500">*</span>
                                    </FormLabel>
                                </div>
                            </FormItem>
                        )}
                    />

                    {/* Signatures */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <FormField
                            control={form.control}
                            name="studentSignature"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Student Signature <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input placeholder="Type full name to sign" {...field} className="font-script text-lg" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="studentSignatureDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Date</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} disabled />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="parentSignature"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Parent/Driver Coach Signature</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Type full name to sign" {...field} className="font-script text-lg" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="parentSignatureDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Date</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} disabled />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Learner's Permit Section */}
                <div className="space-y-6 pt-6 border-t">
                    <h2 className="text-xl font-bold text-gray-900">Learner's Permit</h2>

                    <FormField
                        control={form.control}
                        name="permitNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Learner's Permit Number</FormLabel>
                                <FormControl>
                                    <Input placeholder="M-123-456-789-000" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="space-y-2">
                        <FormLabel>Please upload a picture of your learner's permit.</FormLabel>
                        <div className="flex items-center justify-center w-full">
                            <label htmlFor="permit-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                                    </svg>
                                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                    <p className="text-xs text-gray-500">SVG, PNG, JPG or PDF (MAX. 5MB)</p>
                                </div>
                                <input id="permit-upload" type="file" className="hidden" accept="image/*,.pdf" />
                            </label>
                        </div>
                    </div>
                </div>

                <Button type="submit" className="w-full bg-[#FDB813] hover:bg-[#e5a700] text-black font-bold h-14 text-lg rounded-xl transition-all shadow-lg" disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : null}
                    Continue to Payment
                </Button>
            </form>
        </Form>
    )
}
