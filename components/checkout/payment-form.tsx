"use client"

import { useState } from "react"
import {
    PaymentElement,
    useStripe,
    useElements
} from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export function PaymentForm({
    onSuccess,
    amount
}: {
    onSuccess?: () => void,
    amount?: number
}) {
    const stripe = useStripe()
    const elements = useElements()
    const [message, setMessage] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!stripe || !elements) return

        setIsLoading(true)

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/services/rsep/success`,
            },
            redirect: 'if_required'
        })

        if (error) {
            if (error.type === "card_error" || error.type === "validation_error") {
                setMessage(error.message || "An error occurred")
            } else {
                setMessage("An unexpected error occurred.")
            }
            setIsLoading(false)
        } else {
            // Payment succeeded or handling redirect
            if (onSuccess) onSuccess()
        }
    }

    return (
        <form id="payment-form" onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement id="payment-element" />
            <Button
                disabled={isLoading || !stripe || !elements}
                id="submit"
                className="w-full bg-[#FDB813] hover:bg-[#e5a700] text-black font-black h-14 rounded-xl text-lg uppercase tracking-wider transition-all shadow-lg"
            >
                {isLoading ? (
                    <Loader2 className="animate-spin h-6 w-6 mr-2" />
                ) : (
                    `Pay $${amount}`
                )}
            </Button>
            {message && <div id="payment-message" className="text-red-500 text-sm font-medium text-center">{message}</div>}
        </form>
    )
}
