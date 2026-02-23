import Link from "next/link"
import NextImage from "next/image"
import { Facebook, Instagram, Twitter, MapPin, Phone, Mail } from "lucide-react"

export function Footer() {
    return (
        <footer className="bg-secondary pt-16 pb-8 border-t">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                    {/* Brand Info */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <NextImage
                                src="/selam-logo.png"
                                alt="Selam Driving School"
                                width={40}
                                height={40}
                                className="h-10 w-10 rounded-full object-cover shadow-sm"
                            />
                            <span className="text-lg font-bold tracking-tight">Selam Driving School</span>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Empowering students with safe driving skills for life. Our certified instructors provide comprehensive training for all experience levels.
                        </p>
                        <div className="flex gap-4">
                            <Link href="#" className="text-muted-foreground hover:text-[#FDB813] transition-colors">
                                <Facebook className="h-4 w-4" />
                            </Link>
                            <Link href="#" className="text-muted-foreground hover:text-[#FDB813] transition-colors">
                                <Instagram className="h-4 w-4" />
                            </Link>
                            <Link href="#" className="text-muted-foreground hover:text-[#FDB813] transition-colors">
                                <Twitter className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="font-bold text-foreground mb-4">Quick Links</h3>
                        <ul className="space-y-2">
                            {["About Us", "Services", "Blog", "Contact"].map((item) => (
                                <li key={item}>
                                    <Link
                                        href={`/${item.toLowerCase().replace(" ", "-") === "about-us" ? "about" : item.toLowerCase().replace(" ", "-")}`}
                                        className="text-muted-foreground hover:text-primary text-sm transition-colors"
                                    >
                                        {item === "Contact" ? "Contact Us" : item === "Services" ? "Our Services" : item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Services */}
                    <div>
                        <h3 className="font-bold text-foreground mb-4">Our Services</h3>
                        <ul className="space-y-2">
                            {["Driver's Education", "Road Test Preparation", "Driving/Extra practice", "3-Hour Roadway Safety (RSEP)", "Driving Improvement Program (DIP)"].map((item) => (
                                <li key={item}>
                                    <Link href="/services" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="font-bold text-foreground mb-4">Contact Us</h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3 text-sm text-muted-foreground">
                                <MapPin className="h-5 w-5 text-primary shrink-0" />
                                <a
                                    href="https://www.google.com/maps/search/?api=1&query=10111+Colesville+Rd+Suite+103,+Silver+Spring,+MD+20901"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-primary transition-colors"
                                >
                                    10111 Colesville Rd Suite 103<br />Silver Spring, MD 20901
                                </a>
                            </li>
                            <li className="flex items-center gap-3 text-sm text-muted-foreground">
                                <Phone className="h-5 w-5 text-primary shrink-0" />
                                <span>301-755-6986</span>
                            </li>
                            <li className="flex items-center gap-3 text-sm text-muted-foreground">
                                <Mail className="h-5 w-5 text-primary shrink-0" />
                                <span>beamlaky9@gmail.com</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-muted-foreground text-center md:text-left">
                        © {new Date().getFullYear()} Selam Driving School. All rights reserved.
                    </p>
                    <div className="flex gap-6 text-sm text-muted-foreground">
                        <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
                        <Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
