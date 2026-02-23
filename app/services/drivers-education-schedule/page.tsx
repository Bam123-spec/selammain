import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import DriversEducationScheduleContent from "./content"

export const runtime = "edge"
export const dynamic = "force-dynamic"

export default function DriversEducationSchedulePage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center py-20 bg-white min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-[#FDB813]" />
            </div>
        }>
            <DriversEducationScheduleContent />
        </Suspense>
    )
}
