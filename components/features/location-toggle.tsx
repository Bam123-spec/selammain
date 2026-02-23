
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
// import { MapPin } from "lucide-react" // Ensure lucide-react is available or use a simple SVG

interface LocationToggleProps {
    value: "silver-spring" | "bethesda"
    onChange: (value: "silver-spring" | "bethesda") => void
    className?: string
}

export function LocationToggle({ value, onChange, className }: LocationToggleProps) {
    return (
        <div className={cn("inline-flex items-center p-1 rounded-full bg-gray-100 border border-gray-200", className)}>
            <button
                onClick={() => onChange("silver-spring")}
                className={cn(
                    "px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 flex items-center gap-2",
                    value === "silver-spring"
                        ? "bg-white text-black shadow-sm"
                        : "text-gray-500 hover:text-black hover:bg-black/5"
                )}
            >
                {/* <MapPin className="w-3.5 h-3.5" /> */}
                <span>Silver Spring</span>
            </button>
            <button
                onClick={() => onChange("bethesda")}
                className={cn(
                    "px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 flex items-center gap-2",
                    value === "bethesda"
                        ? "bg-white text-black shadow-sm"
                        : "text-gray-500 hover:text-black hover:bg-black/5"
                )}
            >
                {/* <MapPin className="w-3.5 h-3.5" /> */}
                <span>Bethesda</span>
            </button>
        </div>
    )
}
