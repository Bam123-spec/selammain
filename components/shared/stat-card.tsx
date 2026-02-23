import { LucideIcon } from "lucide-react"

interface StatCardProps {
    icon: LucideIcon
    value: string
    label: string
}

export function StatCard({ icon: Icon, value, label }: StatCardProps) {
    return (
        <div className="flex items-center gap-4 p-6 bg-white rounded-2xl shadow-sm border border-border">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="h-7 w-7 text-primary" />
            </div>
            <div>
                <p className="text-3xl font-extrabold text-foreground">{value}</p>
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
            </div>
        </div>
    )
}
