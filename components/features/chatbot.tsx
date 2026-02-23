"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, X, Send, ChevronRight, HelpCircle, ChevronDown, Loader2, PhoneCall } from "lucide-react"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from "@/components/ui/button"
import { FAQ_DATA, GENERAL_GREETING, CATEGORY_FALLBACKS, type FAQItem, type FAQCategory } from "@/lib/faq-data"
import Fuse, { FuseResult } from "fuse.js"

type Confidence = "high" | "medium" | "low"

type Message = {
    id: string
    text: string
    sender: "user" | "bot"
    links?: { text: string; url: string }[]
    relatedQuestions?: { id: string; question: string }[]
    quickReplies?: string[]
    showMore?: { text: string; onClick: () => void }
    timestamp: Date
}

type CallbackFormValues = {
    name: string
    email: string
    phone: string
    message: string
}

export function Chatbot() {
    const callbackTriggerPattern = /(human|agent|representative|someone|contact|call me|speak to someone|support)/i
    const [isOpen, setIsOpen] = useState(false)
    const [showHelpPrompt, setShowHelpPrompt] = useState(true)
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            text: GENERAL_GREETING,
            sender: "bot",
            timestamp: new Date(),
        }
    ])
    const [inputValue, setInputValue] = useState("")
    const [isTyping, setIsTyping] = useState(false)
    const [unansweredCount, setUnansweredCount] = useState(0)
    const [showCallbackForm, setShowCallbackForm] = useState(false)
    const [callbackForm, setCallbackForm] = useState<CallbackFormValues>({
        name: "",
        email: "",
        phone: "",
        message: "",
    })
    const [callbackError, setCallbackError] = useState("")
    const [callbackSubmitting, setCallbackSubmitting] = useState(false)
    const [callbackSubmitted, setCallbackSubmitted] = useState(false)
    const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set())
    const messagesContainerRef = useRef<HTMLDivElement>(null)
    const scrollRef = useRef<HTMLDivElement>(null)

    // Initialize Fuse with optimized configuration
    const fuse = useMemo(() => new Fuse(FAQ_DATA, {
        keys: [
            { name: "keywords", weight: 0.4 },
            { name: "question", weight: 0.3 },
            { name: "synonyms", weight: 0.2 },
            { name: "answer_short", weight: 0.1 }
        ],
        threshold: 0.4,
        includeScore: true,
        minMatchCharLength: 2,
        ignoreLocation: true
    }), [])

    useEffect(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTo({
                top: messagesContainerRef.current.scrollHeight,
                behavior: "smooth",
            })
        }
    }, [messages, isOpen, isTyping, showCallbackForm, callbackSubmitted])

    const handleToggleChat = () => {
        const next = !isOpen
        setIsOpen(next)
        if (next) {
            setShowHelpPrompt(false)
        }
    }

    // Category detection from user input
    const detectCategory = (text: string): FAQCategory | "greeting" | null => {
        const lower = text.toLowerCase().trim()

        if (/^(hi|hey|hello|greetings|hola|yo)$/i.test(lower)) return "greeting"
        if (/(price|cost|how much|fee|payment|pay|expensive|cheap|\$)/i.test(lower)) return "pricing"
        if (/(book|schedule|appointment|reserve|enroll|sign up|register)/i.test(lower)) return "booking"
        if (/(road test|license test|mva test|driving test|exam)/i.test(lower)) return "road-test"
        if (/(class|schedule|when|course|session)/i.test(lower)) return "classes"
        if (/(cancel|reschedule|refund|policy|change|modify)/i.test(lower)) return "policy"
        if (/(permit|requirement|need|document|age|eligible)/i.test(lower)) return "requirements"

        return null
    }

    // Calculate confidence based on Fuse score and other factors
    const calculateConfidence = (results: FuseResult<FAQItem>[], userInput: string): Confidence => {
        if (results.length === 0) return "low"

        const bestScore = results[0].score || 1
        const hasExactMatch = results[0].item.keywords.some((k: string) =>
            userInput.toLowerCase().includes(k.toLowerCase())
        )

        if (bestScore < 0.15 || hasExactMatch) return "high"
        if (bestScore < 0.35) return "medium"
        return "low"
    }

    // Get category-specific fallback
    const getCategoryFallback = (category: FAQCategory): FAQItem | null => {
        const fallbackItems = FAQ_DATA.filter(item =>
            item.fallback_for?.includes(category) || item.category === category
        ).sort((a, b) => b.priority - a.priority)

        return fallbackItems[0] || null
    }

    const offerSameDayCallback = () => {
        setCallbackSubmitted(false)
        setCallbackError("")
        setShowCallbackForm(true)
        const prompt: Message = {
            id: `${Date.now()}-callback`,
            sender: "bot",
            text: "I can have our team call you **the same day**. Please share your details in the quick form below.",
            timestamp: new Date(),
        }
        setMessages(prev => [...prev, prompt])
    }

    // Handle sending message and generating intelligent response
    const handleSendMessage = (text: string = inputValue, skipUserMsg = false) => {
        const trimmed = text.trim()
        if (!trimmed) return

        const userMsg: Message = {
            id: Date.now().toString(),
            text: trimmed,
            sender: "user",
            timestamp: new Date()
        }

        if (!skipUserMsg) {
            setMessages(prev => [...prev, userMsg])
        }
        setInputValue("")
        setIsTyping(true)

        // Process response
        setTimeout(() => {
            const results = fuse.search(trimmed)
            const confidence = calculateConfidence(results, trimmed)
            const detectedCategory = detectCategory(trimmed)
            const askedForHuman = callbackTriggerPattern.test(trimmed.toLowerCase())

            let botMsg: Message
            let shouldOfferCallback = false

            if (detectedCategory === "greeting") {
                setUnansweredCount(0)
                // GREETING: Show general greeting + quick replies
                botMsg = {
                    id: Date.now() + 1 + "",
                    text: GENERAL_GREETING,
                    sender: "bot",
                    quickReplies: [
                        "Pricing & Packages",
                        "How to Book",
                        "Road Test Info",
                        "Class Schedules",
                        "Speak to someone"
                    ],
                    timestamp: new Date()
                }
            } else if (confidence === "high" && results.length > 0) {
                setUnansweredCount(0)
                // HIGH CONFIDENCE: Show best answer + related questions
                const best = results[0].item
                const related = results.slice(1, 3).map(r => ({
                    id: r.item.id,
                    question: r.item.question
                }))

                botMsg = {
                    id: Date.now() + 1 + "",
                    text: best.answer_short,
                    sender: "bot",
                    links: best.links,
                    relatedQuestions: related.length > 0 ? related : undefined,
                    showMore: best.answer_long ? {
                        text: best.answer_long,
                        onClick: () => toggleExpanded(Date.now() + 1 + "")
                    } : undefined,
                    timestamp: new Date()
                }
            } else if (confidence === "medium" && results.length > 0) {
                setUnansweredCount(0)
                // MEDIUM CONFIDENCE: Answer + clarifying question
                const best = results[0].item
                const clarifyOptions = results.slice(0, 3).map(r => r.item.question)

                botMsg = {
                    id: Date.now() + 1 + "",
                    text: `${best.answer_short}\n\nDid you mean one of these?`,
                    sender: "bot",
                    links: best.links,
                    quickReplies: clarifyOptions,
                    timestamp: new Date()
                }
            } else {
                const nextUnanswered = unansweredCount + 1
                setUnansweredCount(nextUnanswered)
                shouldOfferCallback = askedForHuman || nextUnanswered >= 2

                // LOW CONFIDENCE: Smart fallback based on category
                if (detectedCategory) {
                    const fallback = getCategoryFallback(detectedCategory)
                    const categoryPrompt = CATEGORY_FALLBACKS[detectedCategory]

                    if (fallback) {
                        botMsg = {
                            id: Date.now() + 1 + "",
                            text: `${categoryPrompt}\n\nHere's some helpful info:\n${fallback.answer_short}`,
                            sender: "bot",
                            links: fallback.links,
                            quickReplies: [
                                "Driver's Education",
                                "Driving Practice",
                                "Road Test",
                                shouldOfferCallback ? "Request same-day callback" : "Speak to someone"
                            ],
                            timestamp: new Date()
                        }
                    } else {
                        botMsg = createGeneralFallback()
                    }
                } else {
                    // Truly no match - offer help
                    botMsg = createGeneralFallback()
                }
            }

            setMessages(prev => [...prev, botMsg])
            setIsTyping(false)

            if (shouldOfferCallback && !showCallbackForm) {
                offerSameDayCallback()
            }
        }, 600)
    }

    // Create general fallback when no category detected
    const createGeneralFallback = (): Message => ({
        id: Date.now() + 1 + "",
        text: "I'm here to help! What would you like to know about?",
        sender: "bot",
        quickReplies: [
            "Pricing & Packages",
            "How to Book",
            "Road Test Info",
            "Class Schedules",
            "Speak to someone"
        ],
        timestamp: new Date()
    })

    // Handle clicking on a related question chip
    const handleRelatedClick = (questionId: string) => {
        const faqItem = FAQ_DATA.find(item => item.id === questionId)
        if (!faqItem) return

        const userMsg: Message = {
            id: Date.now().toString(),
            text: faqItem.question,
            sender: "user",
            timestamp: new Date()
        }

        const botMsg: Message = {
            id: Date.now() + 1 + "",
            text: faqItem.answer_short,
            sender: "bot",
            links: faqItem.links,
            showMore: faqItem.answer_long ? {
                text: faqItem.answer_long,
                onClick: () => toggleExpanded(Date.now() + 1 + "")
            } : undefined,
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMsg, botMsg])
    }

    // Handle quick reply button click
    const handleQuickReply = (reply: string) => {
        const lowerReply = reply.toLowerCase()
        if (
            lowerReply.includes("speak to someone") ||
            lowerReply.includes("contact") ||
            lowerReply.includes("callback")
        ) {
            setMessages(prev => [
                ...prev,
                {
                    id: Date.now().toString(),
                    text: reply,
                    sender: "user",
                    timestamp: new Date(),
                }
            ])
            if (!showCallbackForm) {
                offerSameDayCallback()
            }
        } else {
            handleSendMessage(reply, false)
        }
    }

    // Toggle expanded state for "show more"
    const toggleExpanded = (messageId: string) => {
        setExpandedMessages(prev => {
            const newSet = new Set(prev)
            if (newSet.has(messageId)) {
                newSet.delete(messageId)
            } else {
                newSet.add(messageId)
            }
            return newSet
        })
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    const handleCallbackInputChange = (field: keyof CallbackFormValues, value: string) => {
        setCallbackForm(prev => ({ ...prev, [field]: value }))
        if (callbackError) {
            setCallbackError("")
        }
    }

    const handleSubmitCallbackRequest = async (e: React.FormEvent) => {
        e.preventDefault()
        setCallbackError("")

        if (!callbackForm.name || !callbackForm.email || !callbackForm.phone || !callbackForm.message) {
            setCallbackError("Please fill out all fields so we can call you.")
            return
        }

        setCallbackSubmitting(true)
        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: callbackForm.name,
                    email: callbackForm.email,
                    phone: callbackForm.phone,
                    message: `Same-day callback request from chatbot:\n\n${callbackForm.message}`,
                    source: "chatbot",
                    requestType: "same_day_callback",
                }),
            })

            if (!response.ok) {
                throw new Error("Failed to submit callback request")
            }

            setCallbackSubmitted(true)
            setShowCallbackForm(false)
            setUnansweredCount(0)
            setCallbackForm({ name: "", email: "", phone: "", message: "" })
            setMessages(prev => [
                ...prev,
                {
                    id: `${Date.now()}-callback-confirmed`,
                    sender: "bot",
                    text: "Thanks! We received your request and will call you **today**.",
                    timestamp: new Date(),
                }
            ])
        } catch {
            setCallbackError("Could not submit right now. Please try again in a minute.")
        } finally {
            setCallbackSubmitting(false)
        }
    }

    const normalizeChatLinkUrl = (url: string) => {
        if (!url) return url

        // Handle app-internal relative links first.
        if (url.startsWith("/")) {
            const [pathAndQuery, hash = ""] = url.split("#")
            const [path, query = ""] = pathAndQuery.split("?")
            if (path === "/login") {
                return `/student/login${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`
            }
            return url
        }

        // Handle absolute links that still point to /login.
        try {
            const parsed = new URL(url)
            if (parsed.pathname === "/login") {
                parsed.pathname = "/student/login"
                return parsed.toString()
            }
        } catch {
            // Fall through to original URL.
        }

        return url
    }

    return (
        <>
            {/* Toggle Button */}
            <motion.div
                className={`fixed z-50 ${isOpen ? "hidden sm:block bottom-6 right-6" : "bottom-4 right-4 sm:bottom-6 sm:right-6"}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.9 }}
            >
                <Button
                    onClick={handleToggleChat}
                    className="relative h-14 w-14 rounded-full bg-[#FDB813] hover:bg-[#e5a700] text-black shadow-lg border border-[#e5a700] flex items-center justify-center p-0"
                >
                    {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
                </Button>
            </motion.div>

            <AnimatePresence>
                {!isOpen && showHelpPrompt && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="fixed bottom-20 right-3 z-50 w-[min(270px,calc(100vw-24px))] rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg sm:bottom-24 sm:right-6 sm:w-[270px]"
                    >
                        <div className="mb-2 flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">Selam Assistant</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowHelpPrompt(false)}
                            className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                            aria-label="Dismiss chat prompt"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={handleToggleChat}
                            className="pr-5 text-left text-sm font-medium text-gray-800 hover:text-black leading-snug"
                        >
                            Selam, how can we help you?
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="fixed bottom-20 right-2 z-50 w-[calc(100vw-16px)] sm:bottom-24 sm:right-6 sm:w-[360px] md:w-[420px] h-[68dvh] max-h-[520px] sm:h-[560px] sm:max-h-[560px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-3 py-2.5 sm:px-4 sm:py-3 bg-white text-gray-900 flex items-center justify-between border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#FDB813] flex items-center justify-center">
                                    <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm">Selam Assistant</h3>
                                    <p className="text-xs text-gray-500">{isTyping ? "Typing..." : "Online"}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                                aria-label="Close chat"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div
                            ref={messagesContainerRef}
                            className="flex-1 overflow-y-auto overscroll-contain bg-white p-3 sm:p-4 [scrollbar-width:thin]"
                        >
                            <div className="flex flex-col gap-3 sm:gap-4 pr-1">
                                <AnimatePresence initial={false}>
                                    {messages.map((msg) => (
                                        <motion.div
                                            key={msg.id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.18 }}
                                            className={`flex flex-col max-w-[85%] ${msg.sender === "user" ? "self-end items-end" : "self-start items-start"
                                                }`}
                                        >
                                            <div
                                                className={`p-2.5 sm:p-3 rounded-2xl text-[13px] sm:text-sm leading-relaxed ${msg.sender === "user"
                                                    ? "bg-gray-900 text-white rounded-tr-none shadow-sm whitespace-pre-wrap"
                                                    : "bg-gray-50 text-gray-800 border border-gray-200 rounded-tl-none"
                                                    }`}
                                            >
                                                {msg.sender === "bot" ? (
                                                    <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-strong:text-inherit prose-strong:font-bold prose-headings:text-inherit prose-headings:font-bold text-inherit">
                                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                            {msg.text}
                                                        </ReactMarkdown>
                                                    </div>
                                                ) : (
                                                    msg.text
                                                )}

                                                {msg.showMore && (
                                                    <button
                                                        onClick={() => toggleExpanded(msg.id)}
                                                        className="mt-2 text-xs font-medium text-[#b4830e] hover:text-[#8b6609] flex items-center gap-1"
                                                    >
                                                        {expandedMessages.has(msg.id) ? "Show less" : "Show more"}
                                                        <ChevronDown className={`w-3 h-3 transition-transform ${expandedMessages.has(msg.id) ? "rotate-180" : ""}`} />
                                                    </button>
                                                )}

                                                {msg.showMore && expandedMessages.has(msg.id) && (
                                                    <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-600">
                                                        {msg.showMore.text}
                                                    </div>
                                                )}
                                            </div>

                                            {msg.links && (
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {msg.links.map((link, idx) => (
                                                        <a
                                                            key={idx}
                                                            href={normalizeChatLinkUrl(link.url)}
                                                            className="inline-flex items-center gap-1 text-xs font-bold text-[#b4830e] bg-yellow-50 px-3 py-1.5 rounded-full hover:bg-yellow-100 transition-colors border border-yellow-200"
                                                        >
                                                            {link.text} <ChevronRight className="w-3 h-3" />
                                                        </a>
                                                    ))}
                                                </div>
                                            )}

                                            {msg.relatedQuestions && msg.relatedQuestions.length > 0 && (
                                                <div className="mt-2 w-full">
                                                    <p className="text-[10px] text-gray-500 mb-1 px-1">Related:</p>
                                                    <div className="flex flex-col gap-1">
                                                        {msg.relatedQuestions.map((rq) => (
                                                            <button
                                                                key={rq.id}
                                                                onClick={() => handleRelatedClick(rq.id)}
                                                                className="text-left text-xs text-gray-700 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg border border-gray-200 transition-colors"
                                                            >
                                                                {rq.question}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {msg.quickReplies && (
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {msg.quickReplies.map((reply, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => handleQuickReply(reply)}
                                                            className="text-xs font-medium bg-white hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full border border-gray-300 transition-colors"
                                                        >
                                                            {reply}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            <span className="text-[10px] text-gray-400 mt-1 px-1">
                                                {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </span>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {isTyping && (
                                    <div className="self-start bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-none px-3 py-2">
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            Selam Assistant is typing...
                                        </div>
                                    </div>
                                )}

                                {showCallbackForm && (
                                    <div className="self-start w-full max-w-[95%] rounded-2xl border border-blue-100 bg-white p-2.5 sm:p-3 shadow-sm">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                                            <PhoneCall className="h-4 w-4 text-blue-600" />
                                            Same-day callback request
                                        </div>
                                        <form onSubmit={handleSubmitCallbackRequest} className="space-y-2">
                                            <input
                                                type="text"
                                                value={callbackForm.name}
                                                onChange={(e) => handleCallbackInputChange("name", e.target.value)}
                                                placeholder="Name"
                                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                            <input
                                                type="email"
                                                value={callbackForm.email}
                                                onChange={(e) => handleCallbackInputChange("email", e.target.value)}
                                                placeholder="Email"
                                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                            <input
                                                type="tel"
                                                value={callbackForm.phone}
                                                onChange={(e) => handleCallbackInputChange("phone", e.target.value)}
                                                placeholder="Phone"
                                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                            <textarea
                                                value={callbackForm.message}
                                                onChange={(e) => handleCallbackInputChange("message", e.target.value)}
                                                placeholder="Message"
                                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm min-h-20 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                            {callbackError && (
                                                <p className="text-xs text-red-600">{callbackError}</p>
                                            )}
                                            <Button
                                                type="submit"
                                                disabled={callbackSubmitting}
                                                className="w-full h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                                            >
                                                {callbackSubmitting ? "Sending..." : "Request same-day call"}
                                            </Button>
                                        </form>
                                    </div>
                                )}

                                {callbackSubmitted && !showCallbackForm && (
                                    <div className="self-start text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-lg">
                                        Callback request sent successfully.
                                    </div>
                                )}

                                <div ref={scrollRef} />
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="p-2.5 sm:p-3 bg-white border-t border-gray-200">
                            <div className="relative flex items-center">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Type your question..."
                                    className="w-full bg-white border border-gray-300 text-sm text-gray-900 rounded-full pl-4 pr-11 sm:pr-12 py-2.5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-[#FDB813] placeholder:text-gray-400"
                                />
                                <Button
                                    onClick={() => handleSendMessage()}
                                    size="icon"
                                    disabled={!inputValue.trim() || callbackSubmitting}
                                    className="absolute right-1 top-1 h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-[#FDB813] hover:bg-[#e5a700] text-black"
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="flex gap-2 mt-2 overflow-x-auto pb-1 scrollbar-hide">
                                {["Prices", "How to book", "Road Test", "Locations"].map(topic => (
                                    <button
                                        key={topic}
                                        onClick={() => handleSendMessage(topic)}
                                        className="text-[10px] font-medium bg-gray-50 hover:bg-gray-100 px-3 py-1 rounded-full border border-gray-100 whitespace-nowrap transition-colors text-gray-600"
                                    >
                                        {topic}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
