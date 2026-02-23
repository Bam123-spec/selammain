import Link from "next/link"
import NextImage from "next/image"
import { Calendar, User, ArrowRight } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface BlogCardProps {
    title: string
    excerpt: string
    date: string
    author: string
    category: string
    image: string
    slug: string
}

export function BlogCard({ title, excerpt, date, author, category, image, slug }: BlogCardProps) {
    return (
        <Card className="overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 group h-full flex flex-col">
            <div className="aspect-video relative overflow-hidden">
                <NextImage
                    src={image}
                    alt={title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4">
                    <Badge className="bg-white/90 text-foreground hover:bg-white font-bold backdrop-blur-sm">
                        {category}
                    </Badge>
                </div>
            </div>
            <CardHeader className="pb-2 pt-6">
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{author}</span>
                    </div>
                </div>
                <Link href={`/blog/${slug}`} className="group-hover:text-primary transition-colors">
                    <h3 className="text-xl font-bold leading-tight line-clamp-2">{title}</h3>
                </Link>
            </CardHeader>
            <CardContent className="flex-1 pb-4">
                <p className="text-muted-foreground line-clamp-3">
                    {excerpt}
                </p>
            </CardContent>
            <CardFooter className="pt-0 pb-6">
                <Link
                    href={`/blog/${slug}`}
                    className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:gap-3 transition-all"
                >
                    Read More <ArrowRight className="h-4 w-4" />
                </Link>
            </CardFooter>
        </Card>
    )
}
