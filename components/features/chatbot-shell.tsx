"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

const Chatbot = dynamic(
    () => import("@/components/features/chatbot").then((mod) => mod.Chatbot),
    { ssr: false }
)

export function ChatbotShell() {
    const [enabled, setEnabled] = useState(false)

    useEffect(() => {
        let timeoutId: number | undefined

        if (typeof window !== "undefined" && "requestIdleCallback" in window) {
            const idleId = (window as any).requestIdleCallback(() => setEnabled(true), { timeout: 1500 })
            return () => (window as any).cancelIdleCallback?.(idleId)
        }

        timeoutId = window.setTimeout(() => setEnabled(true), 1200)
        return () => {
            if (timeoutId) window.clearTimeout(timeoutId)
        }
    }, [])

    if (!enabled) return null
    return <Chatbot />
}

