import { cn } from "@/lib/utils"

interface SectionHeaderProps {
    title: string
    subtitle?: string
    align?: "left" | "center" | "right"
    className?: string
}

export function SectionHeader({ title, subtitle, align = "center", className }: SectionHeaderProps) {
    return (
        <div className={cn("mb-12", {
            "text-center": align === "center",
            "text-left": align === "left",
            "text-right": align === "right",
        }, className)}>
            {subtitle && (
                <span className="text-primary font-bold tracking-wider uppercase text-sm mb-2 block">
                    {subtitle}
                </span>
            )}
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                {title}
            </h2>
        </div>
    )
}
