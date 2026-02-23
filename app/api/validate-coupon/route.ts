import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export const runtime = 'edge'

export async function POST(request: Request) {
    try {
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY")
        }
        const { code } = await request.json()

        if (!code) {
            return NextResponse.json({ valid: false, message: "Code is required" }, { status: 400 })
        }

        const { data: coupon, error } = await supabaseAdmin
            .from('coupons')
            .select('*')
            .eq('code', code.toUpperCase())
            .single()

        if (error || !coupon) {
            return NextResponse.json({ valid: false, message: "Invalid coupon code" })
        }

        if (!coupon.is_active) {
            return NextResponse.json({ valid: false, message: "This coupon is no longer active" })
        }

        if (coupon.expiration_date && new Date(coupon.expiration_date) < new Date()) {
            return NextResponse.json({ valid: false, message: "This coupon has expired" })
        }

        if (coupon.usage_limit && coupon.times_used >= coupon.usage_limit) {
            return NextResponse.json({ valid: false, message: "This coupon usage limit has been reached" })
        }

        return NextResponse.json({
            valid: true,
            discountType: coupon.discount_type,
            discountValue: coupon.discount_value,
            code: coupon.code
        })

    } catch (error: any) {
        console.error("Coupon validation error:", error)
        return NextResponse.json(
            { error: `Internal Server Error: ${error.message}` },
            { status: 500 }
        )
    }
}
