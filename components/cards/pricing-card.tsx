import { Check } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface PricingCardProps {
    title: string
    price: string
    description: string
    features: string[]
    isPopular?: boolean
    buttonText?: string
}

export function PricingCard({ title, price, description, features, isPopular, buttonText = "Choose Plan" }: PricingCardProps) {
    return (
        <Card className={cn(
            "relative flex flex-col border-none shadow-lg transition-all duration-300 hover:-translate-y-1",
            isPopular ? "ring-2 ring-primary shadow-xl scale-105 z-10" : "hover:shadow-xl"
        )}>
            {isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground hover:bg-primary px-4 py-1 text-sm font-bold uppercase tracking-wide">
                        Most Popular
                    </Badge>
                </div>
            )}
            <CardHeader className="pt-8 pb-4 text-center">
                <CardTitle className="text-xl font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    {title}
                </CardTitle>
                <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-extrabold text-foreground">${price}</span>
                    <span className="text-muted-foreground">/package</span>
                </div>
                <p className="text-sm text-muted-foreground mt-4 px-4">
                    {description}
                </p>
            </CardHeader>
            <CardContent className="flex-1">
                <ul className="space-y-3 mt-4">
                    {features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                            <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                                <Check className="h-3 w-3 text-green-600" />
                            </div>
                            <span className="text-foreground/80">{feature}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
            <CardFooter className="pb-8 pt-4">
                <Button
                    className={cn("w-full font-bold h-12 text-base rounded-xl", isPopular ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-secondary text-secondary-foreground hover:bg-secondary/80")}
                    asChild
                >
                    <Link href="/booking">{buttonText}</Link>
                </Button>
            </CardFooter>
        </Card>
    )
}
