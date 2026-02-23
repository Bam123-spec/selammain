import { redirect } from "next/navigation"

export const runtime = "edge"

export default async function IntakePageRedirect({
    params,
    searchParams,
}: {
    params: Promise<{ classId: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const resolvedParams = await params
    const resolvedSearchParams = await searchParams
    const classId = resolvedParams.classId

    const qs = new URLSearchParams({ classId })
    const classification = typeof resolvedSearchParams.classification === "string"
        ? resolvedSearchParams.classification
        : ""
    const location = typeof resolvedSearchParams.location === "string"
        ? resolvedSearchParams.location
        : ""

    if (classification) qs.set("classification", classification)
    if (location) qs.set("location", location)

    redirect(`/services/drivers-education-packages/checkout?${qs.toString()}`)
}
