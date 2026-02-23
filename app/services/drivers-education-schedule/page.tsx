import { createClient } from "@/lib/supabase/server"
import { ClassBookingList } from "@/components/sections/class-booking-list"
import { getServiceBySlug } from "@/app/actions/services"

export const runtime = "edge"
export const dynamic = "force-dynamic"

export default async function DriversEducationSchedulePage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const supabase = await createClient()
    const resolvedParams = await searchParams
    const classification = typeof resolvedParams.classification === 'string'
        ? resolvedParams.classification.toLowerCase()
        : 'morning'

    // Fetch classes from Supabase
    // We fetch all active/upcoming classes and filter by time dynamically
    // since 'type' column might not exist.
    const { data: allClasses, error } = await supabase
        .from('classes')
        .select('*')
        .gte('end_date', new Date().toISOString()) // Only future classes
        .order('start_date', { ascending: true })

    if (error) {
        console.error("Error fetching classes:", error)
    }

    // Fetch the "Service" price (to override class price if needed for instant updates)
    // This allows Admin to change "Driver's Ed (Morning)" price in Services
    // and have it update here immediately, without editing every single class row.
    let serviceSlug = 'drivers-ed-morning'
    if (classification === 'evening') serviceSlug = 'drivers-ed-evening'
    if (classification === 'weekend') serviceSlug = 'drivers-ed-weekend'

    const serviceData = await getServiceBySlug(serviceSlug)
    const basePrice = serviceData?.price || 390

    // Get location from search params
    const location = typeof resolvedParams.location === 'string'
        ? resolvedParams.location.toLowerCase()
        : null

    // Filter and Enrich Data
    const classes = (allClasses || []).filter(c => {
        const startTime = c.daily_start_time || ""
        const name = (c.name || "").toLowerCase()

        if (classification === 'morning') {
            return startTime.startsWith('09') || name.includes('morning')
        }
        if (classification === 'evening') {
            return startTime.startsWith('17') || startTime.startsWith('18') || name.includes('evening')
        }
        if (classification === 'weekend') {
            return name.includes('weekend') || startTime.startsWith('10') // Assuming weekend is different
        }
        return false
    }).map(c => ({
        ...c,
        name: location === 'bethesda' ? `Bethesda ${c.name}` : c.name,
        price: basePrice, // Use the Service price! (Was: c.price || 390)
        // Ensure strictly required fields exist
        time_slot: c.time_slot || "",
        daily_start_time: c.daily_start_time,
        daily_end_time: c.daily_end_time
    }))

    // Fine-tune title
    const locationPrefix = location === 'bethesda' ? "Bethesda " : ""
    const displayTitle = classification === 'morning' ? `${locationPrefix}Driver's Ed (Morning)` :
        classification === 'evening' ? `${locationPrefix}Driver's Ed (Evening)` :
            classification === 'weekend' ? `${locationPrefix}Driver's Ed (Weekend)` : `${locationPrefix}Driver's Ed`

    return (
        <ClassBookingList classes={classes} title={displayTitle} location={location} classification={classification} />
    )
}
