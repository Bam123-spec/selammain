import type { Metadata } from "next"
import { Geist, Funnel_Display } from "next/font/google"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Toaster } from "@/components/ui/sonner"
import { Chatbot } from "@/components/features/chatbot"
import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" })
const funnelDisplay = Funnel_Display({ subsets: ["latin"], variable: "--font-funnel-display" })

export const metadata: Metadata = {
  title: "Selam Driving School - Best Driving School",
  description: "Learn safe and get your license with the best driving school",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/favicon.ico",
        sizes: "any",
      },
      {
        url: "/icon.png",
        type: "image/png",
        sizes: "32x32",
      },
    ],
    apple: {
      url: "/apple-icon.png",
      sizes: "180x180",
      type: "image/png",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://selamdrivingschool.com",
    title: "Selam Driving School - Best Driving School",
    description: "Learn safe and get your license with the best driving school",
    siteName: "Selam Driving School",
    images: [
      {
        url: "https://selamdrivingschool.com/images/about-hero.png",
        width: 1200,
        height: 630,
        alt: "Selam Driving School - Excellence in Driver Education",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Selam Driving School - Best Driving School",
    description: "Learn safe and get your license with the best driving school",
    images: ["https://selamdrivingschool.com/images/about-hero.png"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`antialiased min-h-screen flex flex-col bg-background text-foreground ${geist.variable} font-sans ${funnelDisplay.variable}`}>
        <Header />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <Chatbot />
        <Footer />
        <Toaster />
      </body>
    </html>
  )
}
