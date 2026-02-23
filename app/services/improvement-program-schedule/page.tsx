import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { DEScheduleContent } from "@/components/sections/de-schedule-content"

export const runtime = "edge"
export const dynamic = "force-dynamic"

export default async function DIPSchedulePage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center py-20 bg-white min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-[#FDB813]" />
            </div>
        }>
            <DEScheduleContent classification="" classType="DIP" />
        </Suspense>
    )
}
