"use client"

import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { useState, useEffect, useRef } from "react"
import { Send, X, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

type Message = {
    id: string
    text: string
    sender: 'user' | 'ai'
    timestamp: Date
}

const INITIAL_MESSAGE: Message = {
    id: 'init-1',
    text: "Hi! I'm your Selam Driving School assistant. How can I help you today? 🚗",
    sender: 'ai',
    timestamp: new Date()
}

export function GreetingAnimation() {
    const [isVisible, setIsVisible] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
    const [inputValue, setInputValue] = useState("")
    const [isTyping, setIsTyping] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // Show greeting bubble after delay
        const timer = setTimeout(() => {
            setIsVisible(true)
        }, 2000)
        return () => clearTimeout(timer)
    }, [])

    useEffect(() => {
        // Scroll to bottom of chat
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages, isOpen])

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return

        const userMsg: Message = {
            id: Date.now().toString(),
            text: inputValue,
            sender: 'user',
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMsg])
        setInputValue("")
        setIsTyping(true)

        // Simulate AI processing
        setTimeout(() => {
            const responseText = generateResponse(userMsg.text)
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: responseText,
                sender: 'ai',
                timestamp: new Date()
            }
            setMessages(prev => [...prev, aiMsg])
            setIsTyping(false)
        }, 1000)
    }

    const generateResponse = (input: string): string => {
        const lowerInput = input.toLowerCase()

        if (lowerInput.includes("price") || lowerInput.includes("cost") || lowerInput.includes("much")) {
            return "Our packages start at $360 for the full Driver's Ed course. We also offer individual lessons starting at $60/hr. Check our Pricing page for more details!"
        }
        if (lowerInput.includes("location") || lowerInput.includes("where") || lowerInput.includes("address")) {
            return "We are located at 10111 Colesville Rd Suite 103, Silver Spring, MD 20901. Come visit us!"
        }
        if (lowerInput.includes("book") || lowerInput.includes("schedule") || lowerInput.includes("appointment")) {
            return "You can book a lesson directly through our website! Just click the 'Book Now' button in the menu or on any service page."
        }
        if (lowerInput.includes("contact") || lowerInput.includes("phone") || lowerInput.includes("call")) {
            return "You can reach us at 301-755-6986 or email selamdrivingschool@gmail.com."
        }

        return "I'm not sure about that, but our team would love to help! Please give us a call at 301-755-6986."
    }

    return (
        <>
            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="fixed bottom-24 right-6 z-50 w-[350px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[500px]"
                    >
                        {/* Header */}
                        <div className="bg-[#FDB813] p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="relative w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-white">
                                    <Image
                                        src="/professional-driving-instructor-teaching.jpg"
                                        alt="AI Assistant"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div>
                                    <h3 className="font-bold text-black text-sm">Selam Assistant</h3>
                                    <p className="text-xs text-black/80 flex items-center gap-1">
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                        Online
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-black hover:bg-black/10 rounded-full"
                                onClick={() => setIsOpen(false)}
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Messages */}
                        <ScrollArea className="flex-1 p-4 h-[300px] bg-gray-50">
                            <div className="flex flex-col gap-4">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender === 'user'
                                                ? 'bg-black text-white rounded-tr-none'
                                                : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none shadow-sm'
                                                }`}
                                        >
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                                {isTyping && (
                                    <div className="flex justify-start">
                                        <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-200 shadow-sm flex gap-1">
                                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                                        </div>
                                    </div>
                                )}
                                <div ref={scrollRef} />
                            </div>
                        </ScrollArea>

                        {/* Input */}
                        <div className="p-4 bg-white border-t border-gray-100">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault()
                                    handleSendMessage()
                                }}
                                className="flex gap-2"
                            >
                                <Input
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-gray-50 border-gray-200 focus-visible:ring-[#FDB813]"
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    className="bg-[#FDB813] hover:bg-[#e5a700] text-black"
                                    disabled={!inputValue.trim()}
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Trigger Button */}
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.8 }}
                animate={isVisible ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="fixed bottom-6 right-6 z-50 hidden md:flex flex-col items-end cursor-pointer group"
                onClick={() => setIsOpen(!isOpen)}
            >
                {/* Speech Bubble (Only show if chat is closed) */}
                <AnimatePresence>
                    {!isOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0, x: 20 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0, transition: { duration: 0.2 } }}
                            transition={{ delay: 0.5, type: "spring" }}
                            className="bg-white text-black px-5 py-3 rounded-2xl rounded-br-none shadow-xl mb-3 mr-2 relative border border-gray-100 group-hover:scale-105 transition-transform duration-300 origin-bottom-right"
                        >
                            <p className="font-bold text-sm">Hi! Ready to drive? 🚗</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Avatar Container */}
                <div className="relative">
                    {/* Avatar */}
                    <div className={`relative w-16 h-16 rounded-full border-[3px] border-[#FDB813] overflow-hidden shadow-2xl bg-white transition-all duration-300 ${isOpen ? 'scale-90 opacity-0' : 'group-hover:shadow-[0_0_20px_rgba(253,184,19,0.4)]'}`}>
                        <Image
                            src="/professional-driving-instructor-teaching.jpg"
                            alt="Instructor Greeting"
                            fill
                            className="object-cover"
                        />
                    </div>

                    {/* Close Icon (When Open) */}
                    <div className={`absolute inset-0 flex items-center justify-center bg-[#FDB813] rounded-full shadow-2xl transition-all duration-300 ${isOpen ? 'scale-100 opacity-100 rotate-0' : 'scale-50 opacity-0 -rotate-90'}`}>
                        <X className="w-8 h-8 text-black" />
                    </div>

                    {/* Online Status Dot (Only when closed) */}
                    {!isOpen && (
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full z-10">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping"></span>
                        </div>
                    )}
                </div>
            </motion.div>
        </>
    )
}
