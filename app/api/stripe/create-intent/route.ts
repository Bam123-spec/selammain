import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripeFetch } from "@/lib/stripe-lite";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSafeStripeError } from "@/lib/stripe-errors";

export const runtime = 'edge';

function errorResponse(status: number, code: string, message: string) {
    return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(req: Request) {
    try {
        const { classId, serviceSlug, metadata } = await req.json();

        const headersList = await headers();
        const host = headersList.get('host');
        const protocol = headersList.get('x-forwarded-proto') || 'https';
        const origin = `${protocol}://${host}`;

        let amount = 0;
        let description = "";

        if (classId) {
            const { data: classData, error: classError } = await supabaseAdmin
                .from('classes')
                .select('price, name')
                .eq('id', classId)
                .single();

            if (classError || !classData) {
                return NextResponse.json({ error: "Class not found" }, { status: 404 });
            }
            amount = classData.price * 100; // Stripe expects cents
            description = `Enrollment for ${classData.name}`;
        } else if (serviceSlug) {
            const { data: serviceData, error: serviceError } = await supabaseAdmin
                .from('services')
                .select('price, name')
                .eq('slug', serviceSlug)
                .single();

            if (serviceError || !serviceData) {
                return NextResponse.json({ error: "Service not found" }, { status: 404 });
            }
            amount = serviceData.price * 100;
            description = `Payment for ${serviceData.name}`;
        } else {
            return NextResponse.json({ error: "Missing classId or serviceSlug" }, { status: 400 });
        }

        if (amount <= 0) {
            return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
        }

        const paymentIntent = await stripeFetch('/payment_intents', 'POST', {
            amount,
            currency: "usd",
            description,
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                ...metadata,
                classId: classId || "",
                serviceSlug: serviceSlug || "",
                origin: origin
            },
        });

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            amount: amount / 100,
        });
    } catch (error: any) {
        const safe = getSafeStripeError(error);
        console.error("Stripe Intent Error:", safe.code);
        return errorResponse(safe.status, safe.code, safe.message);
    }
}
