import { supabaseAdmin } from "@/lib/supabase/admin"
import { ClassCheckoutForm } from "@/components/checkout/class-checkout-form"
import { notFound } from "next/navigation"

export const runtime = "edge"
export const dynamic = "force-dynamic"

function resolveClassification(
    rawClassification: string,
    className: unknown,
    dailyStartTime?: unknown
) {
    if (rawClassification === "morning" || rawClassification === "evening" || rawClassification === "weekend") {
        return rawClassification
    }

    const name = typeof className === "string" ? className.toLowerCase() : ""
    const start = typeof dailyStartTime === "string" ? dailyStartTime.toLowerCase() : ""
    if (name.includes("morning") || start.startsWith("09")) return "morning"
    if (name.includes("evening") || start.startsWith("17") || start.startsWith("18")) return "evening"
    return "weekend"
}

function mapClassificationToServiceSlug(classification: string) {
    if (classification === "evening") return "drivers-ed-evening"
    if (classification === "weekend") return "drivers-ed-weekend"
    return "drivers-ed-morning"
}

function formatAmount(amountCents: number, currency: string) {
    const safeCurrency = /^[a-z]{3}$/i.test(currency || "") ? currency : "usd"
    const safeAmount = Number.isFinite(amountCents) ? amountCents : 39000
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: safeCurrency.toUpperCase(),
    }).format(safeAmount / 100)
}

function formatTimeSlotFromDailyTimes(startValue: unknown, endValue: unknown) {
    const start = typeof startValue === "string" ? startValue : ""
    const end = typeof endValue === "string" ? endValue : ""
    if (!start || !end) return "TBA"
    return `${start.slice(0, 5)} - ${end.slice(0, 5)}`
}

export default async function DriversEdCheckoutPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const resolvedParams = await searchParams
    const classId = typeof resolvedParams.classId === "string" ? resolvedParams.classId : ""
    const rawClassification = typeof resolvedParams.classification === "string"
        ? resolvedParams.classification.toLowerCase()
        : ""

    if (!classId) return notFound()

    try {
        const { data: classDetails, error } = await supabaseAdmin
            .from("classes")
            .select("*")
            .eq("id", classId)
            .single()

        if (error || !classDetails) {
            console.error("Error fetching class:", error)
            return notFound()
        }

        const classification = resolveClassification(rawClassification, classDetails.name, classDetails.daily_start_time)
        const serviceSlug = mapClassificationToServiceSlug(classification)
        const displayType = classification.charAt(0).toUpperCase() + classification.slice(1)

        const { data: serviceOffering, error: serviceOfferingError } = await supabaseAdmin
            .from("service_offerings")
            .select("amount_cents, currency, price_display")
            .eq("slug", serviceSlug)
            .eq("active", true)
            .maybeSingle()

        if (serviceOfferingError) {
            console.error("Error fetching DE service offering:", serviceOfferingError)
        }

        const parsedClassPrice = Number((classDetails as any)?.price)
        const fallbackAmount = (Number.isFinite(parsedClassPrice) && parsedClassPrice > 0 ? parsedClassPrice : 390) * 100

        const amountCentsRaw = (serviceOffering as any)?.amount_cents
        const parsedAmountCents = Number(amountCentsRaw)
        const checkoutAmountCents =
            Number.isFinite(parsedAmountCents) && parsedAmountCents > 0
                ? parsedAmountCents
                : fallbackAmount

        const checkoutCurrency =
            typeof (serviceOffering as any)?.currency === "string"
                ? (serviceOffering as any).currency
                : "usd"
        const checkoutPriceDisplay =
            typeof (serviceOffering as any)?.price_display === "string" && (serviceOffering as any).price_display.trim()
                ? (serviceOffering as any).price_display.trim()
                : formatAmount(checkoutAmountCents, checkoutCurrency)

        const rawTimeSlot = typeof (classDetails as any)?.time_slot === "string" ? (classDetails as any).time_slot : ""
        const enrichedDetails = {
            ...classDetails,
            name: typeof (classDetails as any)?.name === "string" ? (classDetails as any).name : "Driver's Education",
            start_date: typeof (classDetails as any)?.start_date === "string" ? (classDetails as any).start_date : "",
            end_date: typeof (classDetails as any)?.end_date === "string" ? (classDetails as any).end_date : "",
            price: checkoutAmountCents / 100,
            price_display: checkoutPriceDisplay,
            type: displayType,
            class_type: "DE",
            time_slot: rawTimeSlot || formatTimeSlotFromDailyTimes((classDetails as any)?.daily_start_time, (classDetails as any)?.daily_end_time),
            daily_start_time: typeof (classDetails as any)?.daily_start_time === "string" ? (classDetails as any).daily_start_time : null,
            daily_end_time: typeof (classDetails as any)?.daily_end_time === "string" ? (classDetails as any).daily_end_time : null,
        }

        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <ClassCheckoutForm classDetails={enrichedDetails} serviceSlug={serviceSlug} />
            </div>
        )
    } catch (error) {
        console.error("Drivers Ed checkout page render error:", error)
        return notFound()
    }
}
