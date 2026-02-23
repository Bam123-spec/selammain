"use client"

import dynamic from "next/dynamic"

const SchedulingForm = dynamic(
    () => import("./scheduling-form").then((mod) => mod.SchedulingForm),
    { ssr: false }
)

export function ClientSchedulingForm() {
    return <SchedulingForm />
}
