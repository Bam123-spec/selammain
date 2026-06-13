"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Loader2, CreditCard, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEFAULT_PRODUCT_ID = "prod_TrBVxi2G66x0fq";

export function TestCheckoutForm() {
    const defaultDate = useMemo(() => new Date().toISOString().slice(0, 10), []);
    const [productId, setProductId] = useState(DEFAULT_PRODUCT_ID);
    const [name, setName] = useState("Test Student");
    const [email, setEmail] = useState("");
    const [service, setService] = useState("Evening Driver's Education");
    const [date, setDate] = useState(defaultDate);
    const [time, setTime] = useState("6:00 PM");
    const [instructor, setInstructor] = useState("Test Instructor");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string | null>(null);

    async function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!productId.trim()) {
            toast.error("Stripe product ID is required.");
            return;
        }
        if (!email.trim()) {
            toast.error("Customer email is required.");
            return;
        }

        setLoading(true);
        setStatus(null);
        const toastId = toast.loading("Starting test checkout...");

        try {
            const response = await fetch("/api/test1/checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    product_id: productId.trim(),
                    name: name.trim(),
                    email: email.trim(),
                    service: service.trim(),
                    date,
                    time: time.trim(),
                    instructor: instructor.trim(),
                }),
            });

            const payload = await response.json().catch(() => null);
            if (!response.ok) {
                throw new Error(payload?.error?.message || payload?.message || "Unable to start checkout.");
            }
            if (!payload?.url) {
                throw new Error("Checkout URL missing.");
            }

            toast.success("Redirecting to Stripe Checkout.", { id: toastId });
            window.location.href = payload.url;
        } catch (error: any) {
            const message = error?.message || "Unable to start checkout.";
            setStatus(message);
            toast.error("Test checkout failed.", {
                id: toastId,
                description: message,
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={onSubmit} className="space-y-5">
            <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-900 text-white">
                    <CreditCard className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-gray-400">
                        Test Checkout
                    </p>
                    <p className="text-sm text-gray-500">
                        Starts a Stripe Checkout session from the test product.
                    </p>
                </div>
            </div>

            <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="productId">Stripe Product ID</Label>
                    <Input
                        id="productId"
                        value={productId}
                        onChange={(event) => setProductId(event.target.value)}
                        placeholder="prod_..."
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="email">Customer Email</Label>
                    <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="student@example.com"
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Test Student"
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="service">Service Label</Label>
                    <Input
                        id="service"
                        value={service}
                        onChange={(event) => setService(event.target.value)}
                        placeholder="Evening Driver's Education"
                    />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor="date">Date</Label>
                        <Input
                            id="date"
                            type="date"
                            value={date}
                            onChange={(event) => setDate(event.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="time">Time</Label>
                        <Input
                            id="time"
                            value={time}
                            onChange={(event) => setTime(event.target.value)}
                            placeholder="6:00 PM"
                        />
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="instructor">Instructor</Label>
                    <Input
                        id="instructor"
                        value={instructor}
                        onChange={(event) => setInstructor(event.target.value)}
                        placeholder="Test Instructor"
                    />
                </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Starting Checkout
                    </>
                ) : (
                    <>
                        <Send className="h-4 w-4" />
                        Go to Stripe Checkout
                    </>
                )}
            </Button>

            {status ? (
                <p className="text-sm text-gray-600" aria-live="polite">
                    {status}
                </p>
            ) : null}
        </form>
    );
}
