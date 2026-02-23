import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabaseClient"
import { format, parseISO } from "date-fns"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

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

interface ClassEnrollmentModalProps {
    isOpen: boolean
    onClose: () => void
    classSession: ClassSession | null
}

export function ClassEnrollmentModal({ isOpen, onClose, classSession }: ClassEnrollmentModalProps) {
    const [loading, setLoading] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [checkingAuth, setCheckingAuth] = useState(true)
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        if (isOpen) {
            checkUser()
            setSuccess(false)
        }
    }, [isOpen])

    const checkUser = async () => {
        setCheckingAuth(true)
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        setCheckingAuth(false)
    }

    const handleProceedToPayment = async () => {
        if (!user || !classSession) return

        // 1. Check if already enrolled
        setLoading(true)
        const { data: existingEnrollment, error: checkError } = await supabase
            .from('enrollments')
            .select('id')
            .eq('class_id', classSession.id)
            .eq('student_id', user.id)
            .single()

        setLoading(false)

        if (existingEnrollment) {
            toast.info("You are already enrolled in this class.")
            setSuccess(true)
            return
        }

        // 2. Redirect to Checkout Page
        const params = new URLSearchParams({
            classId: classSession.id,
            amount: (classSession.price || 0).toString(),
            serviceName: classSession.name
        })

        // Close modal and redirect
        onClose()
        window.location.href = `/checkout?${params.toString()}`
    }

    if (!classSession) return null

    const formatTime = (timeStr: string) => {
        if (!timeStr) return ""
        const [hours, minutes] = timeStr.split(':')
        const date = new Date()
        date.setHours(parseInt(hours))
        date.setMinutes(parseInt(minutes))
        return format(date, 'h:mm a')
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Enroll in Class</DialogTitle>
                    <DialogDescription>
                        Review the details below to confirm your enrollment.
                    </DialogDescription>
                </DialogHeader>

                {success ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                        <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Enrollment Confirmed!</h3>
                        <p className="text-gray-500 mb-6">
                            You have successfully enrolled in <strong>{classSession.name}</strong>.
                        </p>
                        <Button onClick={onClose} className="w-full rounded-xl">
                            Close
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                            <div>
                                <h4 className="font-bold text-gray-900">{classSession.name}</h4>
                                <p className="text-sm text-gray-500">
                                    {format(parseISO(classSession.start_date), 'MMM d')} - {format(parseISO(classSession.end_date), 'MMM d, yyyy')}
                                </p>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Time:</span>
                                <span className="font-medium">
                                    {formatTime(classSession.daily_start_time)} - {formatTime(classSession.daily_end_time)}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Price:</span>
                                <span className="font-bold text-[#FDB813]">
                                    ${classSession.price?.toFixed(2) || "0.00"}
                                </span>
                            </div>
                        </div>

                        {checkingAuth ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                            </div>
                        ) : user ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-md text-sm">
                                    <AlertCircle className="h-5 w-5 shrink-0" />
                                    <p>
                                        You are logged in as <strong>{user.email}</strong>.
                                    </p>
                                </div>
                                <Button
                                    onClick={handleProceedToPayment}
                                    disabled={loading}
                                    className="w-full bg-[#FDB813] hover:bg-[#e5a700] text-black font-bold rounded-xl"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        `Proceed to Payment ($${classSession.price?.toFixed(2) || "0.00"})`
                                    )}
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4 text-center">
                                <p className="text-sm text-gray-600">
                                    You must be logged in to enroll in this class.
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button variant="outline" className="rounded-xl" asChild>
                                        <Link href="/student/login?next=/services/drivers-education-packages">Log In</Link>
                                    </Button>
                                    <Button className="bg-black text-white hover:bg-gray-800 rounded-xl" asChild>
                                        <Link href="/student/signup?next=/services/drivers-education-packages">Sign Up</Link>
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
