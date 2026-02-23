"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CheckCircle2, XCircle, AlertCircle, Trophy, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Question {
    id: number
    text: string
    options: string[]
    correctAnswer: number
}

const questions: Question[] = [
    {
        id: 1,
        text: "What is the primary purpose of the '3-second rule'?",
        options: [
            "To calculate fuel efficiency",
            "To maintain a safe following distance",
            "To measure reaction time at stop signs",
            "To warm up the engine"
        ],
        correctAnswer: 1
    },
    {
        id: 2,
        text: "When hydroplaning, what is the best immediate action?",
        options: [
            "Slam on the brakes",
            "Accelerate to gain traction",
            "Ease off the accelerator and steer straight",
            "Turn the wheel sharply towards the curb"
        ],
        correctAnswer: 2
    },
    {
        id: 3,
        text: "At a 4-way stop, who has the right of way?",
        options: [
            "The vehicle that is largest",
            "The vehicle that arrives first",
            "The vehicle to the left",
            "The vehicle signaling a turn"
        ],
        correctAnswer: 1
    },
    {
        id: 4,
        text: "What is the first step before changing lanes?",
        options: [
            "Check your mirrors",
            "Turn on your signal",
            "Speed up",
            "Check your blind spot"
        ],
        correctAnswer: 0
    },
    {
        id: 5,
        text: "How does doubling your speed affect your braking distance?",
        options: [
            "It doubles the distance",
            "It triples the distance",
            "It quadruples the distance",
            "It has no effect"
        ],
        correctAnswer: 2
    }
]

export function QuizSection() {
    const [answers, setAnswers] = useState<Record<number, number>>({})
    const [submitted, setSubmitted] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [score, setScore] = useState(0)

    const handleOptionSelect = (questionId: number, optionIndex: number) => {
        if (submitted || isSubmitting) return
        setAnswers(prev => ({ ...prev, [questionId]: optionIndex }))
    }

    const handleSubmit = () => {
        setIsSubmitting(true)

        // Simulate API delay
        setTimeout(() => {
            let newScore = 0
            questions.forEach(q => {
                if (answers[q.id] === q.correctAnswer) {
                    newScore++
                }
            })
            setScore(newScore)
            setSubmitted(true)
            setIsSubmitting(false)
        }, 1500)
    }

    const allAnswered = questions.every(q => answers[q.id] !== undefined)

    return (
        <div className="w-full max-w-3xl mx-auto mt-12 relative">
            {isSubmitting && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <Loader2 className="h-16 w-16 text-[#FDB813] animate-spin mb-4" />
                    <p className="text-white text-xl font-bold tracking-wider animate-pulse">Calculating Score...</p>
                </div>
            )}
            <Card className="bg-[#111111] border-white/10 text-white overflow-hidden">
                <CardHeader className="border-b border-white/10 bg-white/5 pb-8">
                    <CardTitle className="flex items-center gap-3 text-2xl">
                        <AlertCircle className="h-6 w-6 text-[#FDB813]" />
                        Knowledge Check
                    </CardTitle>
                    <p className="text-gray-400 mt-2">
                        Test your understanding of the defensive driving concepts covered in this module.
                    </p>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                    {questions.map((q, index) => (
                        <div key={q.id} className="space-y-4">
                            <h3 className="font-semibold text-lg flex gap-2">
                                <span className="text-[#FDB813]">{index + 1}.</span>
                                {q.text}
                            </h3>
                            <div className="grid gap-3 pl-6">
                                {q.options.map((option, optIndex) => {
                                    const isSelected = answers[q.id] === optIndex
                                    const isCorrect = q.correctAnswer === optIndex
                                    const showResult = submitted

                                    let itemClass = "border-white/10 bg-white/5 hover:bg-white/10 text-gray-300"
                                    if (isSelected) itemClass = "border-[#FDB813] bg-[#FDB813]/10 text-white"

                                    if (showResult) {
                                        if (isCorrect) itemClass = "border-green-500 bg-green-500/10 text-green-400"
                                        else if (isSelected && !isCorrect) itemClass = "border-red-500 bg-red-500/10 text-red-400"
                                        else itemClass = "border-white/10 bg-white/5 opacity-50"
                                    }

                                    return (
                                        <div
                                            key={optIndex}
                                            onClick={() => handleOptionSelect(q.id, optIndex)}
                                            className={cn(
                                                "flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-all duration-200",
                                                itemClass,
                                                (submitted || isSubmitting) && "cursor-default"
                                            )}
                                        >
                                            <div className={cn(
                                                "h-4 w-4 rounded-full border flex items-center justify-center shrink-0",
                                                isSelected ? "border-[#FDB813]" : "border-gray-500",
                                                showResult && isCorrect && "border-green-500",
                                                showResult && isSelected && !isCorrect && "border-red-500"
                                            )}>
                                                {isSelected && <div className={cn("h-2 w-2 rounded-full", showResult && isCorrect ? "bg-green-500" : showResult && !isCorrect ? "bg-red-500" : "bg-[#FDB813]")} />}
                                            </div>
                                            <span className="flex-1">{option}</span>
                                            {showResult && isCorrect && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                                            {showResult && isSelected && !isCorrect && <XCircle className="h-5 w-5 text-red-500" />}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}

                    {!submitted ? (
                        <div className="pt-6 border-t border-white/10 flex justify-end">
                            <Button
                                onClick={handleSubmit}
                                disabled={!allAnswered || isSubmitting}
                                className="bg-[#FDB813] text-black hover:bg-[#e5a700] font-bold text-lg px-8 py-6 min-w-[160px]"
                            >
                                Submit Quiz
                            </Button>
                        </div>
                    ) : score === questions.length ? (
                        <div className="flex flex-col items-center justify-center py-12 animate-in zoom-in duration-500">
                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-green-500/20 blur-[50px] rounded-full animate-pulse"></div>
                                <div className="relative bg-green-500/10 p-8 rounded-full border-2 border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                                    <CheckCircle2 className="h-24 w-24 text-green-500 animate-[spin_3s_linear_infinite]" />
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <CheckCircle2 className="h-24 w-24 text-green-400 animate-ping opacity-20" />
                                </div>
                            </div>

                            <h2 className="text-4xl font-bold text-white mb-2 tracking-tight">Lesson Completed!</h2>
                            <p className="text-green-400 text-lg font-medium mb-8">Perfect Score! You've mastered this module.</p>

                            <div className="flex gap-4">
                                <Button
                                    className="bg-green-500 text-black hover:bg-green-400 font-bold text-lg px-8 py-6 shadow-lg shadow-green-500/20 transition-all hover:scale-105"
                                >
                                    Next Module
                                </Button>
                                <Button
                                    onClick={() => {
                                        setSubmitted(false)
                                        setAnswers({})
                                        setScore(0)
                                    }}
                                    variant="outline"
                                    className="border-white/20 text-white hover:bg-white/10 px-6"
                                >
                                    Review Quiz
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="pt-8 border-t border-white/10 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="inline-flex items-center justify-center p-4 bg-[#FDB813]/10 rounded-full mb-4">
                                <Trophy className="h-12 w-12 text-[#FDB813]" />
                            </div>
                            <h3 className="text-3xl font-bold mb-2">
                                You scored <span className="text-[#FDB813]">{score}</span> out of {questions.length}
                            </h3>
                            <p className="text-gray-400 mb-6">
                                {score >= 3
                                    ? "Great job! You have a good grasp of the concepts."
                                    : "You might want to review the video again to improve your score."}
                            </p>
                            <Button
                                onClick={() => {
                                    setSubmitted(false)
                                    setAnswers({})
                                    setScore(0)
                                }}
                                variant="default"
                                className="bg-black text-white hover:bg-gray-900 border border-white/20 font-bold px-8"
                            >
                                Retake Quiz
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Full Screen Success Overlay */}
            {submitted && score === questions.length && (
                <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center animate-in fade-in duration-700">
                    {/* Background Effects */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-[100px] animate-pulse"></div>
                        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#FDB813]/10 rounded-full blur-[100px] animate-pulse delay-700"></div>
                    </div>

                    <div className="relative z-10 flex flex-col items-center text-center p-8 max-w-2xl animate-in zoom-in-95 slide-in-from-bottom-8 duration-700 delay-150">
                        <div className="relative mb-12 group">
                            <div className="absolute inset-0 bg-green-500/30 blur-[60px] rounded-full animate-pulse group-hover:bg-green-500/40 transition-all duration-500"></div>
                            <div className="relative bg-black p-10 rounded-full border-4 border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.4)]">
                                <CheckCircle2 className="h-32 w-32 text-green-500 animate-pulse" />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <CheckCircle2 className="h-32 w-32 text-green-400 animate-ping opacity-30" />
                            </div>
                        </div>

                        <h1 className="text-6xl font-black text-white mb-6 tracking-tighter drop-shadow-2xl">
                            LESSON <span className="text-green-500">COMPLETED</span>
                        </h1>
                        <p className="text-gray-300 text-2xl font-medium mb-12 max-w-lg leading-relaxed">
                            Perfect Score! You've mastered the <span className="text-[#FDB813]">Defensive Driving</span> module with flying colors.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-md">
                            <Button
                                className="flex-1 bg-green-500 text-black hover:bg-green-400 font-bold text-xl py-8 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all hover:scale-105"
                            >
                                Next Module
                            </Button>
                            <Button
                                onClick={() => {
                                    setSubmitted(false)
                                    setAnswers({})
                                    setScore(0)
                                }}
                                className="flex-1 bg-[#222222] text-white hover:bg-[#333333] font-bold text-xl py-8 rounded-xl hover:scale-105 transition-all"
                            >
                                Review Quiz
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
