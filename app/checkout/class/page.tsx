import { createClient } from "@/lib/supabase/server"
import { ClassCheckoutForm } from "@/components/checkout/class-checkout-form"
import { notFound } from "next/navigation"

export const runtime = "edge"

export default async function ClassCheckoutPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const supabase = await createClient()
    const { classId } = await searchParams

    if (!classId || typeof classId !== 'string') {
        return notFound()
    }

    // Fetch class details
    const { data: classDetails, error } = await supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .single()

    if (error || !classDetails) {
        console.error("Error fetching class:", error)
        return notFound()
    }

    // Enrich data if DB columns are missing
    const enrichedDetails = {
        ...classDetails,
        price: classDetails.price || 390,
        type: classDetails.type || (
            (classDetails.daily_start_time || "").startsWith('09') ? 'Morning' :
                (classDetails.daily_start_time || "").startsWith('18') || (classDetails.daily_start_time || "").startsWith('17') ? 'Evening' :
                    'Theory Class'
        ),
        time_slot: classDetails.time_slot || (
            (classDetails.daily_start_time && classDetails.daily_end_time)
                ? `${classDetails.daily_start_time.substring(0, 5)} - ${classDetails.daily_end_time.substring(0, 5)}`
                : "TBA"
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <ClassCheckoutForm classDetails={enrichedDetails} />
        </div>
    )
}
