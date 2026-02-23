"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Loader2 } from "lucide-react"

export default function StudentLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Middleware handles auth redirects
    return <>{children}</>
}
