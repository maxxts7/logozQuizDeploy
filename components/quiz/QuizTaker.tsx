"use client"

import { useState, useEffect, useCallback, useRef, memo } from "react"
import { QUIZ_TIMING } from "@/constants/quizConfig"
import { formatTime, formatMinutes } from "@/lib/utils/timeFormatter"
import { Button, Input, Label, Card, Alert } from "@/components/ui"
import type { ParticipantField } from "./ParticipantFieldsBuilder"

const LETTER_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"]

function CheckmarkIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function ClockIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function InfoCircleIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function StatCard({ value, label, bgClass, textClass }: {
  value: React.ReactNode
  label: string
  bgClass: string
  textClass: string
}) {
  return (
    <div className={`${bgClass} rounded-xl p-4 text-center`}>
      <div className={`text-3xl font-bold ${textClass}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  )
}

function getScoreColors(scorePercentage: number): {
  gradient: string
  bg: string
  text: string
} {
  if (scorePercentage >= 60) {
    return {
      gradient: "from-emerald-500 to-emerald-600",
      bg: "bg-emerald-50",
      text: "text-emerald-600",
    }
  }
  return {
    gradient: "from-blue-500 to-blue-600",
    bg: "bg-blue-50",
    text: "text-blue-600",
  }
}

function getReviewOptionStyles(showCorrectHighlight: boolean, showWrongHighlight: boolean, isSelected: boolean): {
  rowBg: string
  circleBorder: string
  letterColor: string
  textColor: string
} {
  if (showCorrectHighlight) {
    return {
      rowBg: "bg-emerald-50",
      circleBorder: "border-emerald-500 bg-emerald-500",
      letterColor: "text-emerald-600",
      textColor: "text-emerald-800 font-medium",
    }
  }
  if (showWrongHighlight) {
    return {
      rowBg: "bg-red-50",
      circleBorder: "border-red-400 bg-red-400",
      letterColor: "text-red-500",
      textColor: "text-red-800",
    }
  }
  return {
    rowBg: "",
    circleBorder: isSelected ? "border-slate-400 bg-slate-400" : "border-slate-200",
    letterColor: "text-slate-400",
    textColor: "text-slate-600",
  }
}

function TimerDisplay({ started, timeLimitSeconds, practiceMode, onTimeUp }: {
  started: boolean
  timeLimitSeconds: number | null
  practiceMode?: boolean
  onTimeUp: () => void
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(timeLimitSeconds)

  // Elapsed time counter
  useEffect(() => {
    if (!started) return

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1)
    }, QUIZ_TIMING.TIMER_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [started])

  // Countdown timer for time limit (disabled in practice mode)
  useEffect(() => {
    if (!started || !timeLimitSeconds || practiceMode) return

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval)
          onTimeUp()
          return 0
        }
        return prev - 1
      })
    }, QUIZ_TIMING.TIMER_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [started, timeLimitSeconds, practiceMode, onTimeUp])

  return (
    <div className="max-w-3xl mx-auto px-2 sm:px-4 py-2.5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
            <ClockIcon className="w-4 h-4" />
            Elapsed:
          </div>
          <span className="text-base font-bold text-emerald-600 tabular-nums">
            {formatTime(elapsedSeconds)}
          </span>
        </div>

        {!practiceMode && timeLimitSeconds && timeRemaining !== null && (
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-sm text-slate-600">Remaining:</span>
            <span className={`text-base font-bold tabular-nums ${
              timeRemaining < 60 ? "text-red-600 animate-pulse" : "text-blue-600"
            }`}>
              {formatTime(timeRemaining)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

const QuestionCard = memo(function QuestionCard({
  question,
  qIndex,
  selectedOptionId,
  onSelect,
}: {
  question: {
    id: string
    questionText: string
    options: { id: string; optionText: string; order: number }[]
  }
  qIndex: number
  selectedOptionId: string | undefined
  onSelect: (questionId: string, optionId: string) => void
}) {
  const isAnswered = !!selectedOptionId
  const statusBg = isAnswered ? "bg-emerald-500" : "bg-blue-500"

  return (
    <div className="bg-white rounded-xl overflow-hidden sm:shadow-sm">
      <div className="flex">
        <div className={`w-1 flex-shrink-0 hidden sm:block ${statusBg}`} />
        <div className="flex-1 px-1 py-3 sm:px-5 sm:py-4">
          {/* Question header */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <h3 className="min-w-0 break-words text-base sm:text-lg font-bold text-black">
              {question.questionText}
            </h3>
            <span className={`flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold text-white ${statusBg}`}>
              {qIndex + 1}
            </span>
          </div>

          {/* Options */}
          <div className="ml-0 sm:ml-8">
            {question.options.map((option, oIndex) => {
              const isSelected = selectedOptionId === option.id
              return (
                <label
                  key={option.id}
                  className={`flex items-center gap-1.5 sm:gap-3 px-1 py-2.5 sm:-mx-1 sm:px-3 rounded-lg cursor-pointer transition-colors duration-150 ${
                    isSelected
                      ? "bg-blue-50"
                      : "hover:bg-slate-50"
                  }`}
                >
                  {/* Custom radio circle */}
                  <div className={`flex-shrink-0 w-3 h-3 sm:w-[18px] sm:h-[18px] rounded-full border-[1.5px] sm:border-2 flex items-center justify-center transition-colors ${
                    isSelected
                      ? "border-blue-500 bg-blue-500"
                      : "border-slate-300"
                  }`}>
                    {isSelected && (
                      <CheckmarkIcon className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                    )}
                  </div>
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={option.id}
                    checked={isSelected}
                    onChange={() => onSelect(question.id, option.id)}
                    className="sr-only"
                  />
                  <span className={`hidden sm:inline flex-shrink-0 text-xs font-medium sm:w-5 ${
                    isSelected ? "text-blue-500" : "text-slate-400"
                  }`}>
                    {LETTER_LABELS[oIndex]}
                  </span>
                  <span className="text-base sm:text-lg font-bold text-black">
                    {option.optionText}
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
})

interface QuizTakerProps {
  quiz: {
    id: string
    title: string
    description: string | null
    timeLimitSeconds: number | null
    participantFields: ParticipantField[]
    questions: {
      id: string
      questionText: string
      order: number
      marks?: number
      options: {
        id: string
        optionText: string
        order: number
        isCorrect?: boolean
      }[]
    }[]
  }
  visitorIp?: string
  practiceMode?: boolean
}

export default function QuizTaker({ quiz, visitorIp, practiceMode }: QuizTakerProps) {
  const submittingRef = useRef(false)
  const timeUpRef = useRef(false)
  const [participantData, setParticipantData] = useState<Record<string, string>>({})
  const [started, setStarted] = useState(false)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{
    score: number
    total: number
    earnedMarks: number
    totalMarks: number
    skippedCount: number
    review: {
      questionId: string
      questionText: string
      marks: number
      options: { id: string; optionText: string; isCorrect: boolean }[]
      selectedOptionId: string | null
      correctOptionId: string | null
      isCorrect: boolean
    }[]
    answersHidden?: boolean
    showAnswersAfter?: string | null
  } | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const handleFieldChange = (label: string, value: string) => {
    setParticipantData((prev) => ({
      ...prev,
      [label]: value,
    }))
    if (fieldErrors[label]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[label]
        return newErrors
      })
    }
  }

  const handleStart = () => {
    if (!practiceMode) {
      const errors: Record<string, string> = {}
      for (const field of quiz.participantFields) {
        if (!participantData[field.label]?.trim()) {
          errors[field.label] = `${field.label} is required`
        }
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors)
        return
      }
    }

    setStartTime(Date.now())
    setStarted(true)
  }

  const handleAnswerSelect = useCallback((questionId: string, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }))
  }, [])

  const handleTimeUp = useCallback(() => {
    timeUpRef.current = true
    // Trigger auto-submit via a state update so React batches it properly
    setAutoSubmitTriggered(true)
  }, [])

  const [autoSubmitTriggered, setAutoSubmitTriggered] = useState(false)

  const handleSubmit = useCallback(async (isAutoSubmit = false) => {
    // Use ref to prevent race conditions from async state updates
    if (isSubmitting || submittingRef.current) return
    submittingRef.current = true

    if (!isAutoSubmit) {
      const unanswered = quiz.questions.filter((q) => !answers[q.id])
      if (unanswered.length > 0 && !timeUpRef.current) {
        if (!confirm(`You have ${unanswered.length} unanswered question(s). Submit anyway?`)) {
          submittingRef.current = false
          return
        }
      }
    }

    setIsSubmitting(true)

    const timeSpentSeconds = startTime ? Math.floor((Date.now() - startTime) / 1000) : null

    try {
      const response = await fetch("/api/submission", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quizId: quiz.id,
          participantData,
          timeSpentSeconds,
          ipAddress: visitorIp,
          answers: Object.entries(answers).map(([questionId, optionId]) => ({
            questionId,
            selectedOptionId: optionId,
          })),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || "Failed to submit quiz")
        return
      }

      setResult(data)
    } catch {
      alert("An error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
      submittingRef.current = false
    }
  }, [isSubmitting, quiz.questions, quiz.id, answers, startTime, participantData, visitorIp])

  // Check answers locally (practice mode — no API call)
  const handleCheckAnswers = useCallback(() => {
    const review = quiz.questions.map(q => {
      const selectedOptionId = answers[q.id] || null
      const correctOption = q.options.find(o => o.isCorrect)
      const isCorrect = selectedOptionId != null && selectedOptionId === correctOption?.id

      return {
        questionId: q.id,
        questionText: q.questionText,
        marks: q.marks || 1,
        options: q.options.map(o => ({
          id: o.id,
          optionText: o.optionText,
          isCorrect: o.isCorrect || false,
        })),
        selectedOptionId,
        correctOptionId: correctOption?.id || null,
        isCorrect,
      }
    })

    const totalMarks = review.reduce((sum, q) => sum + q.marks, 0)
    const earnedMarks = review.filter(q => q.isCorrect).reduce((sum, q) => sum + q.marks, 0)
    const score = totalMarks > 0 ? Math.round((earnedMarks / totalMarks) * 100) : 0
    const skippedCount = review.filter(q => !q.selectedOptionId).length

    setResult({ score, total: quiz.questions.length, earnedMarks, totalMarks, skippedCount, review })
  }, [quiz.questions, answers])

  // Auto-submit when timer reaches zero (not in practice mode)
  useEffect(() => {
    if (practiceMode || !autoSubmitTriggered || isSubmitting) return
    setAutoSubmitTriggered(false)
    handleSubmit(true)
  }, [practiceMode, autoSubmitTriggered, isSubmitting, handleSubmit])

  const displayName = quiz.participantFields.length > 0
    ? participantData[quiz.participantFields[0].label] || ""
    : ""

  // Results Screen
  if (result) {
    const scorePercentage = result.score
    const scoreColors = getScoreColors(scorePercentage)
    const correctCount = result.review.filter(q => q.isCorrect).length

    const headingText = scorePercentage >= 80 ? "Amazing!"
      : scorePercentage >= 60 ? "Good Job!"
      : "Quiz Completed!"

    const subtitleText = scorePercentage >= 80
      ? (displayName ? `Outstanding, ${displayName}!` : "Outstanding!")
      : (displayName ? `Nice work, ${displayName}!` : "Nice work!")

    return (
      <div className="max-w-3xl mx-auto">
        {/* Fixed Header */}
        <div className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200/80 shadow-sm overflow-hidden">
          {/* Layered background */}
          <div className="absolute inset-0 bg-white sm:bg-white/95 sm:backdrop-blur-sm" />
          <div className={`absolute inset-0 bg-gradient-to-b ${scorePercentage >= 60 ? 'from-white via-emerald-50/30 to-emerald-50/70' : 'from-white via-blue-50/30 to-blue-50/70'}`} />

          <div className="relative">
            {/* Quiz Title Row */}
            <div className={`max-w-3xl mx-auto px-3 sm:px-4 py-2.5 border-b ${scorePercentage >= 60 ? 'border-emerald-100/80' : 'border-blue-100/80'}`}>
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <h1 className="text-base font-extrabold text-slate-900 tracking-tight">{quiz.title}</h1>
                  {quiz.description && (
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{quiz.description}</p>
                  )}
                </div>
                {displayName && (
                  <span className={`flex-shrink-0 ml-3 text-xs font-semibold px-2.5 py-1 rounded-full ${scorePercentage >= 60 ? 'bg-emerald-100/80 text-emerald-700' : 'bg-blue-100/80 text-blue-700'}`}>
                    {displayName}
                  </span>
                )}
              </div>
            </div>

            {/* Score Hero Row */}
            <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-5">
              <div className="flex items-center justify-between">
                {/* Marks — hero element */}
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl sm:text-5xl font-black tabular-nums text-slate-900 tracking-tight leading-none">
                      {result.earnedMarks}
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-slate-300 leading-none">/{result.totalMarks}</span>
                    <span className={`ml-2 text-xs sm:text-sm font-bold uppercase tracking-widest ${scoreColors.text} leading-none`}>marks</span>
                  </div>
                  <p className={`text-sm sm:text-base font-bold mt-2 ${scoreColors.text}`}>{headingText}</p>
                </div>

                {/* Score ring */}
                <div className="relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="2.5" className={scorePercentage >= 60 ? 'stroke-emerald-100' : 'stroke-blue-100'} />
                    <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={`${scorePercentage * 0.975} 100`} className={scorePercentage >= 60 ? 'stroke-emerald-500' : 'stroke-blue-500'} />
                  </svg>
                  <span className={`absolute inset-0 flex items-center justify-center text-base sm:text-lg font-extrabold tabular-nums ${scoreColors.text}`}>
                    {result.score}%
                  </span>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-2.5 mt-3">
                <span className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-2.5 py-1 rounded-lg ${scorePercentage >= 60 ? 'bg-emerald-100/60 text-emerald-700 border border-emerald-200/80' : 'bg-blue-100/60 text-blue-700 border border-blue-200/80'}`}>
                  {correctCount}/{result.total} <span className="font-normal opacity-70">correct</span>
                </span>
                {result.skippedCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-2.5 py-1 rounded-lg bg-amber-100/60 text-amber-700 border border-amber-200/80">
                    {result.skippedCount} <span className="font-normal opacity-70">skipped</span>
                  </span>
                )}
                <span className="text-xs sm:text-sm text-slate-400 ml-auto truncate">
                  {subtitleText}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Spacer for fixed header */}
        <div className="h-[175px] sm:h-48" />

        {/* Practice/Thank you note */}
        <div className={`flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl mb-5 sm:mb-6 ${
          practiceMode
            ? 'bg-amber-50/80 border border-amber-200/60'
            : 'bg-slate-50/80 border border-slate-200/60'
        }`}>
          {practiceMode ? (
            <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          <p className={`text-sm ${practiceMode ? 'text-amber-700' : 'text-slate-600'}`}>
            {practiceMode
              ? <>
                  <span className="font-semibold">Practice mode</span> — your answers were not recorded.
                </>
              : "Thank you for participating!"}
          </p>
        </div>

        {/* Answers Hidden Alert */}
        {result.answersHidden && result.showAnswersAfter && (
          <Alert variant="warning" className="mb-5 sm:mb-6">
            <strong>Note:</strong> Correct answers will be revealed after{" "}
            <strong>{new Date(result.showAnswersAfter).toLocaleString()}</strong>.
            For now, you can only see which questions you got right or wrong.
          </Alert>
        )}

        {/* Individual Review Question Cards */}
        <div className="space-y-5 sm:space-y-6">
          {result.review.map((question, index) => {
            const correctBg = question.isCorrect ? "bg-emerald-500" : "bg-red-400"
            return (
              <div key={question.questionId} className="bg-white rounded-xl overflow-hidden sm:shadow-sm">
                <div className="flex">
                  <div className={`w-1 flex-shrink-0 hidden sm:block ${correctBg}`} />
                  <div className="flex-1 px-1 py-3 sm:px-5 sm:py-4">
                    {/* Question header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-start gap-1.5 sm:gap-2.5 min-w-0">
                        <span className={`flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold text-white ${correctBg}`}>
                          {question.isCorrect ? "\u2713" : "\u2717"}
                        </span>
                        <h3 className="min-w-0 break-words text-base sm:text-lg font-bold text-black pt-0.5">
                          {index + 1}. {question.questionText}
                        </h3>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-md whitespace-nowrap ${
                        question.isCorrect
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {question.isCorrect ? question.marks : 0}/{question.marks}
                      </span>
                    </div>

                    {/* Options */}
                    <div className="ml-0 sm:ml-8">
                      {question.options.map((option, oIndex) => {
                        const isSelected = option.id === question.selectedOptionId
                        const showCorrectHighlight = !result.answersHidden && option.isCorrect
                        const showWrongHighlight = isSelected && !question.isCorrect
                        const styles = getReviewOptionStyles(showCorrectHighlight, showWrongHighlight, isSelected)

                        return (
                          <div
                            key={option.id}
                            className={`flex items-center gap-1.5 sm:gap-3 px-1 py-2 sm:-mx-1 sm:px-3 rounded-lg ${styles.rowBg}`}
                          >
                            <div className={`flex-shrink-0 w-3 h-3 sm:w-[18px] sm:h-[18px] rounded-full border-[1.5px] sm:border-2 flex items-center justify-center ${styles.circleBorder}`}>
                              {(showCorrectHighlight || showWrongHighlight || isSelected) && (
                                <CheckmarkIcon className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                              )}
                            </div>
                            <span className={`hidden sm:inline flex-shrink-0 text-xs font-medium sm:w-5 ${styles.letterColor}`}>
                              {LETTER_LABELS[oIndex]}
                            </span>
                            <span className={`text-base sm:text-lg font-bold text-black flex-1`}>
                              {option.optionText}
                            </span>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {isSelected && (
                                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wide">
                                  Yours
                                </span>
                              )}
                              {showCorrectHighlight && (
                                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded uppercase tracking-wide">
                                  Correct
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom padding */}
        <div className="pb-40" />
      </div>
    )
  }

  // Start Screen
  if (!started) {
    return (
      <Card padding="lg" className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{quiz.title}</h1>
          {quiz.description && (
            <p className="text-slate-600">{quiz.description}</p>
          )}
        </div>

        {/* Quiz Info */}
        <div className="bg-slate-50 rounded-xl p-5 mb-6">
          <h3 className="font-semibold text-slate-900 mb-3">Quiz Details</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {quiz.questions.length} questions
            </div>
            {quiz.timeLimitSeconds && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <ClockIcon className="w-5 h-5 text-slate-400" />
                Time limit: {formatMinutes(quiz.timeLimitSeconds)}
              </div>
            )}
          </div>
        </div>

        {/* Practice Mode Notice */}
        {practiceMode && (
          <div className="mb-6 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <InfoCircleIcon className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Practice Mode</p>
              <p className="text-sm text-amber-700 mt-0.5">Your answers won&apos;t be recorded. Feel free to test your knowledge!</p>
            </div>
          </div>
        )}

        {/* Participant Fields */}
        {!practiceMode && quiz.participantFields.length > 0 && (
          <div className="space-y-4 mb-6">
            {quiz.participantFields.map((field) => (
              <div key={field.label}>
                <Label htmlFor={field.label} required>
                  {field.label}
                </Label>
                <Input
                  id={field.label}
                  type="text"
                  value={participantData[field.label] || ""}
                  onChange={(e) => handleFieldChange(field.label, e.target.value)}
                  error={!!fieldErrors[field.label]}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                />
                {fieldErrors[field.label] && (
                  <p className="mt-1.5 text-sm text-red-600">{fieldErrors[field.label]}</p>
                )}
              </div>
            ))}
          </div>
        )}

        <Button onClick={handleStart} size="lg" className="w-full">
          {practiceMode ? "Start Practice" : "Start Quiz"}
        </Button>
      </Card>
    )
  }

  // Quiz Taking Screen
  const answeredCount = Object.keys(answers).length
  const progressPercent = (answeredCount / quiz.questions.length) * 100

  return (
    <div className="max-w-3xl mx-auto">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white sm:bg-white/95 sm:backdrop-blur-sm border-b border-slate-200 shadow-sm">
        {/* Quiz Title Row */}
        <div className="max-w-3xl mx-auto px-2 sm:px-4 py-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-slate-900">{quiz.title}</h1>
              {quiz.description && (
                <p className="text-sm text-slate-500 mt-0.5">{quiz.description}</p>
              )}
            </div>
            {displayName && (
              <span className="text-sm text-slate-500">
                {displayName}
              </span>
            )}
          </div>
        </div>

        {/* Timer Row */}
        <TimerDisplay
          started={started}
          timeLimitSeconds={quiz.timeLimitSeconds}
          practiceMode={practiceMode}
          onTimeUp={handleTimeUp}
        />

        {/* Progress (kept in parent since it depends on answers) */}
        <div className="max-w-3xl mx-auto px-2 sm:px-4 pb-2.5 -mt-1 hidden sm:block">
          <div className="flex-1 max-w-xs mx-auto">
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 text-center mt-0.5">
              {answeredCount} / {quiz.questions.length}
            </p>
          </div>
        </div>
      </div>

      {/* Spacer for fixed header */}
      <div className="h-28" />

      {/* Practice Mode Banner */}
      {practiceMode && (
        <div className="mb-4 px-2 sm:px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <InfoCircleIcon className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">
            <span className="font-medium text-amber-800">Practice Mode</span> — Your answers won&apos;t be recorded.
          </p>
        </div>
      )}

      {/* Quiz Content */}
      <div className="space-y-5 sm:space-y-6">
          {quiz.questions.map((question, qIndex) => (
            <QuestionCard
              key={question.id}
              question={question}
              qIndex={qIndex}
              selectedOptionId={answers[question.id]}
              onSelect={handleAnswerSelect}
            />
          ))}

          {/* Submit / Check Button */}
          <div className="pt-2 pb-40">
            <Button
              onClick={practiceMode ? handleCheckAnswers : () => handleSubmit()}
              disabled={answeredCount === 0 || (!practiceMode && isSubmitting)}
              size="lg"
              className="w-full"
              isLoading={!practiceMode && isSubmitting}
            >
              {practiceMode ? "Check Answers" : isSubmitting ? "Submitting..." : "Submit Quiz"}
            </Button>
          </div>
        </div>
      </div>
  )
}
