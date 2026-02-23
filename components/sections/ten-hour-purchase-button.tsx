"use client"

import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"
import Link from "next/link"

export function TenHourPurchaseButton() {
    return (
        <Button
            asChild
            className="w-full h-14 bg-[#FDB813] hover:bg-[#e6a600] text-black font-black uppercase tracking-widest rounded-xl text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
        >
            <Link href="/checkout/ten-hour">
                Buy Package Now
                <ChevronRight className="w-5 h-5 ml-2" />
            </Link>
        </Button>
    )
}
