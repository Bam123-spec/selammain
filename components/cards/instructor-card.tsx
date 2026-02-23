import { Star, MapPin } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import NextImage from "next/image"

interface InstructorCardProps {
    name: string
    image: string
    rating: number
    reviews: number
    specialties: string[]
    experience: string
}

export function InstructorCard({ name, image, rating, reviews, specialties, experience }: InstructorCardProps) {
    return (
        <Card className="overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 group">
            <div className="aspect-[4/5] relative overflow-hidden">
                <NextImage
                    src={image}
                    alt={name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-20">
                    <h3 className="text-white text-xl font-bold mb-1">{name}</h3>
                    <p className="text-white/80 text-sm">{experience} Experience</p>
                </div>
            </div>
            <CardContent className="pt-6">
                <div className="flex items-center gap-1 mb-4">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    <span className="font-bold text-foreground">{rating}</span>
                    <span className="text-muted-foreground text-sm">({reviews} reviews)</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                    {specialties.map((specialty) => (
                        <Badge key={specialty} variant="secondary" className="font-normal">
                            {specialty}
                        </Badge>
                    ))}
                </div>
            </CardContent>
            <CardFooter className="pb-6">
                <Button className="w-full font-bold" asChild>
                    <Link href="/booking">Book Lesson</Link>
                </Button>
            </CardFooter>
        </Card>
    )
}
