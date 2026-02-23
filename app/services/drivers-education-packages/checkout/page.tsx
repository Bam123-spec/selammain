import { createClient } from "@/lib/supabase/server"
import { ClassCheckoutForm } from "@/components/checkout/class-checkout-form"
import { notFound } from "next/navigation"

export const runtime = "edge"
export const dynamic = "force-dynamic"

function resolveClassification(
    rawClassification: string,
    className: string,
    dailyStartTime?: string | null
) {
    if (rawClassification === "morning" || rawClassification === "evening" || rawClassification === "weekend") {
        return rawClassification
    }

    const name = (className || "").toLowerCase()
    const start = (dailyStartTime || "").toLowerCase()
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
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: (currency || "usd").toUpperCase(),
    }).format(amountCents / 100)
}

export default async function DriversEdCheckoutPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const supabase = await createClient()
    const resolvedParams = await searchParams
    const classId = typeof resolvedParams.classId === "string" ? resolvedParams.classId : ""
    const rawClassification = typeof resolvedParams.classification === "string"
        ? resolvedParams.classification.toLowerCase()
        : ""

    if (!classId) return notFound()

    const { data: classDetails, error } = await supabase
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

    const { data: serviceOffering } = await supabase
        .from("service_offerings")
        .select("amount_cents, currency, price_display")
        .eq("slug", serviceSlug)
        .eq("active", true)
        .maybeSingle()

    const fallbackAmount = Number(classDetails.price || 390) * 100
    const checkoutAmountCents =
        typeof serviceOffering?.amount_cents === "number"
            ? serviceOffering.amount_cents
            : fallbackAmount
    const checkoutCurrency = serviceOffering?.currency || "usd"
    const checkoutPriceDisplay =
        (serviceOffering?.price_display && serviceOffering.price_display.trim()) ||
        formatAmount(checkoutAmountCents, checkoutCurrency)

    const enrichedDetails = {
        ...classDetails,
        price: checkoutAmountCents / 100,
        price_display: checkoutPriceDisplay,
        type: displayType,
        class_type: "DE",
        time_slot: classDetails.time_slot || (
            (classDetails.daily_start_time && classDetails.daily_end_time)
                ? `${classDetails.daily_start_time.substring(0, 5)} - ${classDetails.daily_end_time.substring(0, 5)}`
                : "TBA"
        ),
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <ClassCheckoutForm classDetails={enrichedDetails} serviceSlug={serviceSlug} />
        </div>
    )
}
