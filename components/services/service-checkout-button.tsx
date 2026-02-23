"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type ServiceCheckoutButtonProps = {
    serviceSlug: string;
    disabled?: boolean;
    className?: string;
    children: React.ReactNode;
};

export function ServiceCheckoutButton({
    serviceSlug,
    disabled = false,
    className,
    children,
}: ServiceCheckoutButtonProps) {
    const [loading, setLoading] = useState(false);

    const onClick = async () => {
        if (disabled || loading) return;
        setLoading(true);

        try {
            const response = await fetch("/api/checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ service_slug: serviceSlug }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.error || "Failed to start checkout.");
            }
            if (!data?.url) {
                throw new Error("Checkout URL missing.");
            }

            window.location.href = data.url;
        } catch (error: any) {
            toast.error(error?.message || "Unable to start checkout.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            type="button"
            onClick={onClick}
            disabled={disabled || loading}
            className={className}
        >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : children}
        </Button>
    );
}
