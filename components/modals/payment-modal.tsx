"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Elements } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { CheckoutForm } from "@/components/checkout/checkout-form"
import { Loader2 } from "lucide-react"

// Initialize Stripe outside of component to avoid recreating it
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentModalProps {
    isOpen: boolean
    onClose: () => void
    amount: number
    onSuccess: (paymentIntentId: string) => void
    metadata?: any
}

export function PaymentModal({ isOpen, onClose, amount, onSuccess, metadata }: PaymentModalProps) {
    const [clientSecret, setClientSecret] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (isOpen && amount > 0) {
            setLoading(true)
            // Create PaymentIntent as soon as the modal opens
            fetch("/api/create-payment-intent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount, metadata }),
            })
                .then((res) => res.json())
                .then((data) => {
                    setClientSecret(data.clientSecret)
                    setLoading(false)
                })
                .catch((err) => {
                    console.error("Error creating PaymentIntent:", err)
                    setLoading(false)
                })
        }
    }, [isOpen, amount, metadata])

    const appearance = {
        theme: 'stripe' as const,
        variables: {
            colorPrimary: '#27ae60',
        },
    }

    const options = {
        clientSecret,
        appearance,
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Secure Payment</DialogTitle>
                    <DialogDescription>
                        Complete your payment to finalize enrollment.
                    </DialogDescription>
                </DialogHeader>

                {loading || !clientSecret ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                ) : (
                    clientSecret && (
                        <Elements options={options as any} stripe={stripePromise}>
                            <CheckoutForm
                                amount={amount}
                                onSuccess={onSuccess}
                                onCancel={onClose}
                            />
                        </Elements>
                    )
                )}
            </DialogContent>
        </Dialog>
    )
}
