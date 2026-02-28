"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import NextImage from "next/image"
import { usePathname } from "next/navigation"
import {
    MapPin,
    Mail,
    Clock,
    Menu,
    ChevronRight,
    User,
    Phone,
    LayoutDashboard,
    History,
    Settings,
    LogOut,
    ChevronDown,
    GraduationCap
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabaseClient"



export function Header() {
    const isScrolled = false
    const [user, setUser] = useState<any>(null)
    const [isServicesOpen, setIsServicesOpen] = useState(false)
    const [isDesktopServicesOpen, setIsDesktopServicesOpen] = useState(false)
    const [isDesktopServicesPinned, setIsDesktopServicesPinned] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const desktopServicesRef = useRef<HTMLDivElement | null>(null)
    const pathname = usePathname()
    const isHomePage = pathname === "/"

    useEffect(() => {
        // Check active session
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user) {
                setUser(session.user)
            } else {
                setUser(null)
            }
        }
        checkUser()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        setUser(null)
        window.location.href = "/" // Redirect to home after logout
    }

    useEffect(() => {
        if (!isDesktopServicesOpen && !isDesktopServicesPinned) return

        const handlePointerDown = (event: PointerEvent) => {
            if (!desktopServicesRef.current) return
            if (!desktopServicesRef.current.contains(event.target as Node)) {
                setIsDesktopServicesOpen(false)
                setIsDesktopServicesPinned(false)
            }
        }

        document.addEventListener("pointerdown", handlePointerDown)
        return () => document.removeEventListener("pointerdown", handlePointerDown)
    }, [isDesktopServicesOpen, isDesktopServicesPinned])

    useEffect(() => {
        setIsDesktopServicesOpen(false)
        setIsDesktopServicesPinned(false)
    }, [pathname])

    const navLinks = [
        { name: "Home", href: "/" },
        { name: "About Us", href: "/about" },
        { name: "Services", href: isHomePage ? "#services" : "/services" },
        { name: "Blog", href: "/blog" },
        { name: "Contact Us", href: "/contact" },
    ]

    return (
        <div
            className="w-full z-50"
        >
            {/* Top Info Bar */}
            <div className="hidden md:block bg-[#2C2C2C] border-b border-[#3C3C3C] text-white">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between py-3 text-sm gap-4 md:gap-0">
                        <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6 text-gray-300">
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-[#FDB813]" />
                                <a
                                    href="https://www.google.com/maps/search/?api=1&query=10111+Colesville+Rd+Suite+103,+Silver+Spring,+MD+20901"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-[#FDB813] transition-colors"
                                >
                                    10111 Colesville Rd Suite 103
                                </a>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-[#FDB813]" />
                                <span>selamdrivingschool@gmail.com</span>
                            </div>
                            <div className="hidden lg:flex items-center gap-2">
                                <Clock className="h-4 w-4 text-[#FDB813]" />
                                <span>Mon - Sat 9:00 am to 6:00 pm</span>
                            </div>
                        </div>

                        {/* Phone Number CTA */}
                        <div className="flex items-center gap-3">
                            <a
                                href="tel:301-755-6986"
                                className="flex items-center gap-2 text-[#FDB813] hover:text-white transition-colors group"
                            >
                                <div className="bg-[#FDB813] text-black p-1.5 rounded-full group-hover:bg-white group-hover:text-black transition-colors">
                                    <Phone className="h-3.5 w-3.5 fill-current" />
                                </div>
                                <span className="font-bold text-base tracking-wide">301-755-6986</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Navigation */}
            <header
                className={`w-full transition-all duration-500 ${isScrolled || !isHomePage ? "bg-white shadow-lg py-2 md:py-2" : "bg-transparent py-2 md:py-4 absolute top-0 md:top-[52px] left-0 right-0 z-50"
                    }`}
            >
                <div className="container mx-auto px-6">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="relative">
                                <div className={`absolute inset-0 bg-[#FDB813] rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300 ${isScrolled || !isHomePage ? "hidden" : "block"}`}></div>
                                <NextImage
                                    src="/selam-logo.png"
                                    alt="Selam Driving School"
                                    width={56}
                                    height={56}
                                    className="relative h-10 w-10 md:h-14 md:w-14 rounded-full shadow-xl object-cover"
                                />
                            </div>
                            <div>
                                <div className="flex flex-col leading-none">
                                    <span className={`text-xl md:text-2xl font-black tracking-tighter uppercase transition-colors duration-300 ${isScrolled || !isHomePage ? "text-gray-900" : "text-white"}`}>
                                        Selam
                                    </span>
                                    <span className="text-[0.55rem] md:text-[0.65rem] font-bold tracking-[0.3em] uppercase text-[#FDB813]">
                                        Driving School
                                    </span>
                                </div>
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center gap-1">
                            {navLinks.map((item, i) => {
                                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))

                                if (item.name === "Services") {
                                    const isServicesDropdownOpen = isDesktopServicesOpen || isDesktopServicesPinned
                                    return (
                                        <div
                                            key={i}
                                            className="relative"
                                            ref={desktopServicesRef}
                                            onMouseEnter={() => setIsDesktopServicesOpen(true)}
                                            onMouseLeave={() => {
                                                if (!isDesktopServicesPinned) {
                                                    setIsDesktopServicesOpen(false)
                                                }
                                            }}
                                        >
                                            <Link
                                                href={isHomePage ? "#services" : "/services"}
                                                className={`px-4 py-2 text-lg font-bold transition-all duration-300 relative flex items-center gap-1 ${isActive
                                                    ? "text-[#FDB813]"
                                                    : (isScrolled || !isHomePage ? "text-gray-700 hover:text-[#FDB813]" : "text-white hover:text-[#FDB813]")
                                                    }`}
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    const nextPinned = !isDesktopServicesPinned
                                                    setIsDesktopServicesPinned(nextPinned)
                                                    setIsDesktopServicesOpen(nextPinned)
                                                }}
                                            >
                                                {item.name}
                                                <ChevronRight className={`h-4 w-4 transition-transform duration-300 ${isServicesDropdownOpen ? "rotate-90" : ""}`} />
                                                <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-[#FDB813] transition-all duration-300 ${isActive ? "w-3/4" : "w-0 group-hover:w-3/4"}`}></span>
                                            </Link>

                                            {/* Dropdown Menu */}
                                            <div className={`absolute top-full left-0 w-64 pt-2 transition-all duration-300 ease-out ${isServicesDropdownOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-2 pointer-events-none"}`}>
                                                <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-2">
                                                    {[
                                                        { name: "Driver's Education", href: "/services/drivers-education" },
                                                        { name: "Driving Practice", href: "/services/driving-practice" },
                                                        { name: "Road Test Service", href: "/services/road-test" },
                                                        { name: "Driving Improvement Program", href: "/services/dip" },
                                                        { name: "3-Hour Roadway Safety (RSEP)", href: "/services/rsep" }
                                                    ].map((service) => (
                                                        <Link
                                                            key={service.name}
                                                            href={service.href}
                                                            className={`block px-4 py-3 text-base font-bold transition-colors ${pathname === service.href
                                                                ? "bg-gray-50 text-[#FDB813]"
                                                                : "text-gray-700 hover:bg-gray-50 hover:text-[#FDB813]"
                                                                }`}
                                                            onClick={() => {
                                                                setIsDesktopServicesOpen(false)
                                                                setIsDesktopServicesPinned(false)
                                                            }}
                                                        >
                                                            {service.name}
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                }
                                return (
                                    <Link
                                        key={i}
                                        href={item.href}
                                        className={`px-4 py-2 text-lg font-bold transition-all duration-300 relative group ${isActive
                                            ? "text-[#FDB813]"
                                            : (isScrolled || !isHomePage ? "text-gray-700 hover:text-[#FDB813]" : "text-white hover:text-[#FDB813]")
                                            }`}
                                    >
                                        {item.name}
                                        <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-[#FDB813] transition-all duration-300 ${isActive ? "w-3/4" : "w-0 group-hover:w-3/4"}`}></span>
                                    </Link>
                                )
                            })}
                        </nav>

                        {/* Student Portal Dropdown */}
                        <div className="hidden lg:flex items-center ml-2">
                            {user ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            className={`rounded-none h-10 px-4 gap-2 transition-all duration-300 border-none group ${isScrolled || !isHomePage
                                                ? "bg-[#FDB813] text-black hover:bg-[#e5a700]"
                                                : "bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
                                                }`}
                                        >
                                            <Avatar className="h-6 w-6 border border-white/20">
                                                <AvatarImage src={user.user_metadata?.avatar_url} alt="Student" />
                                                <AvatarFallback className="bg-black/10 text-[10px]">
                                                    {(user.user_metadata?.name || user.user_metadata?.full_name || "ST").substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="font-bold uppercase tracking-wider text-xs">
                                                {(user.user_metadata?.name || user.user_metadata?.full_name || "Student").split(' ')[0]}
                                            </span>
                                            <ChevronDown className="h-3 w-3 opacity-50 group-data-[state=open]:rotate-180 transition-transform duration-200" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 p-2 rounded-none border-gray-100 shadow-xl">
                                        <div className="px-2 py-2 mb-1 border-b border-gray-50">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Student Portal</p>
                                        </div>
                                        <DropdownMenuItem asChild className="rounded-lg cursor-pointer py-2.5 focus:bg-blue-50 focus:text-blue-600">
                                            <Link href="/student/dashboard" className="flex items-center gap-2 w-full">
                                                <LayoutDashboard className="h-4 w-4" />
                                                <span className="font-bold">Dashboard</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild className="rounded-lg cursor-pointer py-2.5 focus:bg-amber-50 focus:text-amber-600">
                                            <Link href="/student/courses" className="flex items-center gap-2 w-full">
                                                <GraduationCap className="h-4 w-4" />
                                                <span className="font-bold">My Courses</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild className="rounded-lg cursor-pointer py-2.5 focus:bg-blue-50 focus:text-blue-600">
                                            <Link href="/student/history" className="flex items-center gap-2 w-full">
                                                <History className="h-4 w-4" />
                                                <span className="font-bold">History & Attendance</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild className="rounded-lg cursor-pointer py-2.5 focus:bg-blue-50 focus:text-blue-600">
                                            <Link href="/student/settings" className="flex items-center gap-2 w-full">
                                                <Settings className="h-4 w-4" />
                                                <span className="font-bold">Settings</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="my-2 bg-gray-50" />
                                        <DropdownMenuItem
                                            onClick={handleLogout}
                                            className="rounded-lg cursor-pointer py-2.5 text-red-600 focus:bg-red-50 focus:text-red-700"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            <span className="font-bold">Log out</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <Link href="/student/login">
                                    <Button
                                        className={`rounded-none h-10 px-4 gap-2 transition-all duration-300 border-none ${isScrolled || !isHomePage
                                            ? "bg-[#FDB813] text-black hover:bg-[#e5a700]"
                                            : "bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
                                            }`}
                                    >
                                        <div className="h-6 w-6 rounded-full border border-white/20 flex items-center justify-center bg-black/10">
                                            <User className="h-3 w-3" />
                                        </div>
                                        <span className="font-bold uppercase tracking-wider text-xs">Student Portal</span>
                                    </Button>
                                </Link>
                            )}
                        </div>

                        {/* Mobile Menu */}
                        <div className="flex items-center gap-4">
                            <div className="lg:hidden">
                                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                                    <SheetTrigger asChild>
                                        <Button variant="ghost" size="icon" className={`h-14 w-14 ${isScrolled || !isHomePage ? "text-foreground" : "text-white"}`}>
                                            <Menu className="h-10 w-10" strokeWidth={3} />
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent side="right" className="w-[85%] sm:w-[380px] p-0 border-l border-gray-100 rounded-l-[2rem] shadow-2xl overflow-hidden">
                                        <div className="flex flex-col h-full bg-white">
                                            {/* Mobile Menu Header */}
                                            <div className="px-6 py-6 border-b border-gray-50 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative h-10 w-10 rounded-full overflow-hidden shadow-sm border border-gray-100">
                                                        <NextImage
                                                            src="/selam-logo.png"
                                                            alt="Selam Driving School"
                                                            width={40}
                                                            height={40}
                                                            className="object-cover w-full h-full"
                                                        />
                                                    </div>
                                                    <div className="flex flex-col leading-none">
                                                        <span className="text-lg font-black tracking-tighter uppercase text-gray-900">
                                                            Selam
                                                        </span>
                                                        <span className="text-[0.5rem] font-bold tracking-[0.2em] uppercase text-[#FDB813]">
                                                            Driving School
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Scrollable Content */}
                                            <div className="flex-1 overflow-y-auto py-8 px-6">
                                                <nav className="flex flex-col gap-4">
                                                    {navLinks.map((item) => {
                                                        if (item.name === "Services") {
                                                            return (
                                                                <div key={item.name} className="flex flex-col">
                                                                    <button
                                                                        onClick={() => setIsServicesOpen(!isServicesOpen)}
                                                                        className="text-xl font-bold text-gray-900 hover:text-[#FDB813] transition-colors flex items-center justify-between group py-2"
                                                                    >
                                                                        {item.name}
                                                                        <ChevronRight className={`h-5 w-5 text-gray-300 group-hover:text-[#FDB813] transition-transform duration-300 ${isServicesOpen ? "rotate-90" : ""}`} />
                                                                    </button>

                                                                    {/* Accordion Submenu */}
                                                                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isServicesOpen ? "max-h-64 opacity-100 mt-2" : "max-h-0 opacity-0"}`}>
                                                                        <div className="flex flex-col gap-3 pl-4 border-l-2 border-gray-100 ml-1">
                                                                            {[
                                                                                { name: "Driver's Education", href: "/services/drivers-education" },
                                                                                { name: "Driving Practice", href: "/services/driving-practice" },
                                                                                { name: "Road Test Service", href: "/services/road-test" },
                                                                                { name: "Driving Improvement Program", href: "/services/dip" },
                                                                                { name: "3-Hour Roadway Safety (RSEP)", href: "/services/rsep" }
                                                                            ].map((service) => (
                                                                                <Link
                                                                                    key={service.name}
                                                                                    href={service.href}
                                                                                    className="text-base font-bold text-gray-500 hover:text-[#FDB813] transition-colors py-2"
                                                                                    onClick={() => setIsMobileMenuOpen(false)}
                                                                                >
                                                                                    {service.name}
                                                                                </Link>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )
                                                        }
                                                        return (
                                                            <Link
                                                                key={item.name}
                                                                href={item.href}
                                                                className="text-xl font-bold text-gray-900 hover:text-[#FDB813] transition-colors flex items-center justify-between group py-2"
                                                                onClick={() => setIsMobileMenuOpen(false)}
                                                            >
                                                                {item.name}
                                                                {/* No arrow for non-service links */}
                                                            </Link>
                                                        )
                                                    })}
                                                </nav>

                                                <div className="mt-10 pt-8 border-t border-gray-50">
                                                    {user ? (
                                                        <div className="flex flex-col gap-4">
                                                            <Link href="/student/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-4 rounded-none bg-blue-50 text-blue-700 font-bold tracking-tight">
                                                                <LayoutDashboard className="h-5 w-5" />
                                                                Dashboard
                                                            </Link>
                                                            <Link href="/student/courses" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-4 rounded-none bg-amber-50 text-amber-700 font-bold tracking-tight">
                                                                <GraduationCap className="h-5 w-5" />
                                                                My Courses
                                                            </Link>
                                                            <Link href="/student/history" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-4 rounded-none bg-gray-50 text-gray-700 font-bold tracking-tight">
                                                                <History className="h-5 w-5" />
                                                                History & Attendance
                                                            </Link>
                                                            <Button
                                                                variant="ghost"
                                                                onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                                                                className="flex items-center justify-start gap-3 p-4 h-auto rounded-none text-red-600 hover:text-red-700 hover:bg-red-50 font-bold tracking-tight"
                                                            >
                                                                <LogOut className="h-5 w-5" />
                                                                Log Out
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <Link href="/student/login" className="block" onClick={() => setIsMobileMenuOpen(false)}>
                                                            <Button className="w-full bg-[#FDB813] hover:bg-[#e5a700] text-black font-bold h-12 text-base uppercase tracking-wider shadow-lg shadow-yellow-500/10 rounded-none">
                                                                Student Portal
                                                            </Button>
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </SheetContent>
                                </Sheet>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
        </div>
    )
}
