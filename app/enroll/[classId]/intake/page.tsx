"use client"

export const runtime = 'edge'

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { IntakeForm } from "@/components/forms/intake-form"
import { supabase } from "@/lib/supabaseClient"
import { Loader2, ChevronLeft } from "lucide-react"

export default function IntakePage() {
    const params = useParams()
    const router = useRouter()
    const classId = params.classId as string

    const [classDetails, setClassDetails] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchClass = async () => {
            if (!classId) return

            const { data, error } = await supabase
                .from('classes')
                .select('*')
                .eq('id', classId)
                .single()

            if (error) {
                console.error("Error fetching class:", error)
                // Handle error (e.g. redirect or show message)
            } else {
                setClassDetails(data)
            }
            setLoading(false)
        }

        fetchClass()
    }, [classId])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader2 className="h-8 w-8 animate-spin text-gray-900" />
            </div>
        )
    }

    if (!classDetails) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white">
                <h1 className="text-2xl font-bold mb-4">Class Not Found</h1>
                <button onClick={() => router.back()} className="text-blue-600 hover:underline">Go Back</button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <button
                    onClick={() => router.back()}
                    className="flex items-center text-sm font-medium text-gray-600 hover:text-black mb-8 transition-colors"
                >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Back to Classes
                </button>

                <div className="mb-12">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Student Enrollment
                    </h1>
                    <p className="text-gray-500 text-lg">
                        Enrolling in: <span className="font-semibold text-gray-900">{classDetails.name}</span>
                    </p>
                    <p className="text-gray-500 mt-2">
                        Please provide your details below to proceed with enrollment.
                    </p>
                </div>

                <IntakeForm
                    classId={classId}
                    className={classDetails.name}
                    price={classDetails.price}
                />
            </div>
        </div>
    )
}
