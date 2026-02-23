import { Star, Quote } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import NextImage from "next/image"

interface TestimonialCardProps {
    name: string
    role: string
    content: string
    rating?: number
    image?: string
}

export function TestimonialCard({ name, role, content, rating = 5, image }: TestimonialCardProps) {
    return (
        <Card className="border-none shadow-xl bg-white h-full relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Quote className="h-24 w-24 text-[#FDB813] rotate-180" />
            </div>

            <CardContent className="p-8 flex flex-col h-full relative z-10">
                <div className="flex gap-1 mb-6">
                    {Array.from({ length: rating }).map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-[#FDB813] text-[#FDB813]" />
                    ))}
                </div>

                <div className="flex-1 mb-8">
                    <p className="text-lg text-gray-700 leading-relaxed font-medium">
                        "{content}"
                    </p>
                </div>

                <div className="flex items-center gap-4 pt-6 border-t border-gray-100">
                    <div className="h-14 w-14 rounded-full bg-gray-100 border-2 border-white shadow-md overflow-hidden shrink-0">
                        {image ? (
                            <NextImage src={image} alt={name} width={56} height={56} className="h-full w-full object-cover" />
                        ) : (
                            <div className="h-full w-full bg-[#FDB813]/10 flex items-center justify-center text-[#FDB813] font-bold text-xl">
                                {name.charAt(0)}
                            </div>
                        )}
                    </div>
                    <div>
                        <h4 className="font-bold text-black text-lg">{name}</h4>
                        <p className="text-sm text-[#FDB813] font-bold uppercase tracking-wider">{role}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
