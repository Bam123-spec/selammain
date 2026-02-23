import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"
import Link from "next/link"

interface PricingFeature {
    label: string
    value: string
    included: boolean
}

interface PricingPlan {
    name: string
    price: string
    subtitle: string
    features: PricingFeature[]
    isPopular?: boolean
    buttonText?: string
}

const plans: PricingPlan[] = [
    {
        name: "Basic Package",
        price: "350",
        subtitle: "Perfect for beginners starting their journey",
        features: [
            { label: "Theory", value: "Online Course", included: true },
            { label: "Practical", value: "5 Hours", included: true },
            { label: "Duration", value: "Flexible", included: true },
            { label: "Car Type", value: "Basic Model", included: true },
            { label: "Road Test", value: "Not Included", included: false },
        ],
        isPopular: false,
    },
    {
        name: "Standard Package",
        price: "550",
        subtitle: "Our most popular package for comprehensive learning",
        features: [
            { label: "Theory", value: "Online Course", included: true },
            { label: "Practical", value: "10 Hours", included: true },
            { label: "Duration", value: "2 Weeks", included: true },
            { label: "Car Type", value: "Sedan", included: true },
            { label: "Road Test", value: "Car Rental", included: true },
        ],
        isPopular: true,
    },
    {
        name: "Premium Package",
        price: "850",
        subtitle: "The ultimate package for guaranteed success",
        features: [
            { label: "Theory", value: "Defensive Course", included: true },
            { label: "Practical", value: "15 Hours", included: true },
            { label: "Duration", value: "Unlimited", included: true },
            { label: "Car Type", value: "Premium SUV", included: true },
            { label: "Road Test", value: "2 Mock Tests", included: true },
        ],
        isPopular: false,
    },
]

export function ValuablePackages() {
    return (
        <section className="py-24 bg-gradient-to-b from-white to-gray-50">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-black tracking-tight mb-4">
                        Valuable Packages & Offers
                    </h2>
                    <div className="h-1.5 w-24 bg-[#FDB813] mx-auto rounded-full shadow-sm"></div>
                    <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
                        Choose the perfect package for your driving journey. All plans include our certified curriculum and expert instruction.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto items-stretch">
                    {plans.map((plan, index) => (
                        <div
                            key={index}
                            className={`relative flex flex-col rounded-3xl overflow-hidden transition-all duration-500 group ${plan.isPopular
                                ? "bg-[#111111] text-white shadow-2xl scale-105 z-10 border border-[#FDB813]/20 ring-1 ring-[#FDB813]/20"
                                : "bg-white text-black shadow-xl border border-gray-100 hover:shadow-2xl hover:-translate-y-2"
                                }`}
                        >
                            {plan.isPopular && (
                                <div className="absolute top-0 right-0">
                                    <div className="bg-[#FDB813] text-black text-xs font-black px-6 py-2 shadow-lg uppercase tracking-widest rounded-bl-2xl">
                                        Most Popular
                                    </div>
                                </div>
                            )}

                            <div className="p-10 text-center border-b border-gray-200/10 relative">
                                {plan.isPopular && (
                                    <div className="absolute inset-0 bg-gradient-to-b from-[#FDB813]/10 to-transparent pointer-events-none"></div>
                                )}
                                <h3 className={`text-xl font-bold mb-2 uppercase tracking-wider ${plan.isPopular ? "text-[#FDB813]" : "text-gray-500"}`}>
                                    {plan.name}
                                </h3>
                                <div className="flex justify-center items-start gap-1 mb-4 mt-6">
                                    <span className="text-2xl font-bold mt-2 opacity-60">$</span>
                                    <span className={`text-7xl font-black tracking-tighter ${plan.isPopular ? "text-white" : "text-black"}`}>
                                        {plan.price}
                                    </span>
                                </div>
                                <p className={`text-sm font-medium ${plan.isPopular ? "text-gray-400" : "text-gray-500"}`}>
                                    {plan.subtitle}
                                </p>
                            </div>

                            <div className="p-10 flex-grow bg-opacity-50">
                                <ul className="space-y-6">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex justify-between items-center text-sm group/item">
                                            <span className={`font-semibold transition-colors ${plan.isPopular ? "text-gray-300 group-hover/item:text-white" : "text-gray-600 group-hover/item:text-black"}`}>
                                                {feature.label}
                                            </span>
                                            <span className={`font-bold ${plan.isPopular ? "text-white" : "text-black"}`}>
                                                {feature.value}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="p-10 pt-0">
                                <Button
                                    className={`w-full h-14 text-sm font-bold tracking-widest uppercase transition-all duration-300 rounded-xl shadow-lg ${plan.isPopular
                                        ? "bg-[#FDB813] text-black hover:bg-white hover:text-black hover:scale-[1.02]"
                                        : "bg-black text-white hover:bg-[#FDB813] hover:text-black hover:scale-[1.02]"
                                        }`}
                                    asChild
                                >
                                    <Link href="/booking">Book Now</Link>
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
