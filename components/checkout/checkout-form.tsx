"use client"

import { useState } from "react"
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface CheckoutFormProps {
    amount: number
    onSuccess: (paymentIntentId: string) => void
    onCancel?: () => void
    hideButtons?: boolean
}

export function CheckoutForm({ amount, onSuccess, onCancel, hideButtons = false }: CheckoutFormProps) {
    const stripe = useStripe()
    const elements = useElements()
    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!stripe || !elements) {
            return
        }

        setIsLoading(true)
        setErrorMessage(null)

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                // Return URL is required but we handle redirect manually or stay on page
                return_url: window.location.href,
            },
            redirect: "if_required",
        })

        if (error) {
            setErrorMessage(error.message || "An unexpected error occurred.")
            setIsLoading(false)
        } else if (paymentIntent && paymentIntent.status === "succeeded") {
            onSuccess(paymentIntent.id)
            // Don't stop loading here, let the parent handle the transition
        } else {
            setErrorMessage("Payment status: " + (paymentIntent?.status || "unknown"))
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {!hideButtons && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="flex justify-between items-center text-sm mb-2">
                        <span className="text-gray-600">Total to pay</span>
                        <span className="font-bold text-lg">${amount.toFixed(2)}</span>
                    </div>
                </div>
            )}

            <PaymentElement />

            {errorMessage && (
                <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md">
                    {errorMessage}
                </div>
            )}

            {/* Hidden submit button for external trigger */}
            <button type="submit" id="stripe-submit-button" className="hidden" disabled={!stripe || isLoading} />

            {!hideButtons && (
                <div className="flex gap-3 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isLoading}
                        className="flex-1 rounded-xl"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={!stripe || isLoading}
                        className="flex-1 bg-[#27ae60] hover:bg-[#219150] text-white font-bold rounded-xl"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            `Pay $${amount.toFixed(2)}`
                        )}
                    </Button>
                </div>
            )}
        </form>
    )
}
