import { Hero } from "@/components/sections/hero"
import { ServicesIntro } from "@/components/sections/services-intro"
import { FeaturesDark } from "@/components/sections/features-dark"
import { CtaBanner } from "@/components/sections/cta-banner"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import NextImage from "next/image"


export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A]">
      <Hero />
      <ServicesIntro />
      <FeaturesDark />


      <CtaBanner />
    </div>
  )
}
