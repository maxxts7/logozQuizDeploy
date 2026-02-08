"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { QUIZ_TIMING } from "@/constants/quizConfig"
import { formatTime, formatMinutes } from "@/lib/utils/timeFormatter"
import { Button, Input, Label, Card, Alert } from "@/components/ui"
import type { ParticipantField } from "./ParticipantFieldsBuilder"

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
  const [participantData, setParticipantData] = useState<Record<string, string>>({})
  const [started, setStarted] = useState(false)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
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
  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    quiz.timeLimitSeconds
  )
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [autoSubmitTriggered, setAutoSubmitTriggered] = useState(false)

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
    if (!started || !quiz.timeLimitSeconds || practiceMode) return

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval)
          setAutoSubmitTriggered(true)
          return 0
        }
        return prev - 1
      })
    }, QUIZ_TIMING.TIMER_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [started, quiz.timeLimitSeconds])

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

  const handleAnswerSelect = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }))
  }

  const handleSubmit = useCallback(async (isAutoSubmit = false) => {
    // Use ref to prevent race conditions from async state updates
    if (isSubmitting || submittingRef.current) return
    submittingRef.current = true

    if (!isAutoSubmit) {
      const unanswered = quiz.questions.filter((q) => !answers[q.id])
      if (unanswered.length > 0 && timeRemaining !== null && timeRemaining > 0) {
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
  }, [isSubmitting, quiz.questions, quiz.id, answers, timeRemaining, startTime, participantData, visitorIp])

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
    const getScoreGradient = () => {
      if (scorePercentage >= 60) return "from-emerald-500 to-emerald-600"
      return "from-blue-500 to-blue-600"
    }
    const getScoreBg = () => {
      if (scorePercentage >= 60) return "bg-emerald-50"
      return "bg-blue-50"
    }
    const getScoreText = () => {
      if (scorePercentage >= 60) return "text-emerald-600"
      return "text-blue-600"
    }

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Score Card */}
        <Card padding="none" className="overflow-hidden">
          {/* Header with gradient */}
          <div className={`bg-gradient-to-br ${getScoreGradient()} p-8 text-center text-white`}>
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-1">
              {scorePercentage >= 80 ? "Amazing!" : scorePercentage >= 60 ? "Good Job!" : "Quiz Completed!"}
            </h1>
            {scorePercentage >= 60 && (
              <p className="text-white/80">
                {scorePercentage >= 80
                  ? (displayName ? `Outstanding, ${displayName}!` : "Outstanding!")
                  : (displayName ? `Nice work, ${displayName}!` : "Nice work!")}
              </p>
            )}
          </div>

          {/* Quiz Info & Score */}
          <div className="p-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">{quiz.title}</h2>
              {quiz.description && (
                <p className="text-sm text-slate-500 mt-1">{quiz.description}</p>
              )}
            </div>

            {/* Stats Grid */}
            <div className={`grid gap-3 mb-6 ${result.skippedCount > 0 ? 'grid-cols-4' : 'grid-cols-3'}`}>
              <div className={`${getScoreBg()} rounded-xl p-4 text-center`}>
                <div className={`text-3xl font-bold ${getScoreText()}`}>
                  {result.score}%
                </div>
                <div className="text-xs text-slate-500 mt-1">Score</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-slate-900">
                  {result.earnedMarks}/{result.totalMarks}
                </div>
                <div className="text-xs text-slate-500 mt-1">Marks</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-slate-900">
                  {result.total}
                </div>
                <div className="text-xs text-slate-500 mt-1">Questions</div>
              </div>
              {result.skippedCount > 0 && (
                <div className="bg-amber-50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-amber-600">
                    {result.skippedCount}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Skipped</div>
                </div>
              )}
            </div>

            <p className="text-center text-slate-500 text-sm">
              {practiceMode
                ? "This was a practice attempt — no answers were recorded."
                : "Thank you for participating!"}
            </p>
          </div>
        </Card>

        {/* Review Section */}
        <Card padding="none" className="overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Review Your Answers</h2>
                <p className="text-sm text-slate-500">See how you performed on each question</p>
              </div>
            </div>
          </div>
          <div className="p-6">

          {result.answersHidden && result.showAnswersAfter && (
            <Alert variant="warning" className="mb-6">
              <strong>Note:</strong> Correct answers will be revealed after{" "}
              <strong>{new Date(result.showAnswersAfter).toLocaleString()}</strong>.
              For now, you can only see which questions you got right or wrong.
            </Alert>
          )}

          <div className="space-y-4 sm:space-y-5">
            {result.review.map((question, index) => {
              const letterLabels = ["A", "B", "C", "D", "E", "F", "G", "H"]
              return (
                <div key={question.questionId} className="bg-white rounded-xl overflow-hidden shadow-sm">
                  <div className="flex">
                    <div className={`w-1 flex-shrink-0 ${question.isCorrect ? "bg-emerald-500" : "bg-red-400"}`} />
                    <div className="flex-1 px-4 py-3 sm:px-5 sm:py-4">
                      {/* Question header */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-start gap-2.5">
                          <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                            question.isCorrect ? "bg-emerald-500" : "bg-red-400"
                          }`}>
                            {question.isCorrect ? "✓" : "✗"}
                          </span>
                          <h3 className="text-sm sm:text-base font-semibold text-slate-900 pt-0.5">
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
                      <div className="ml-8 sm:ml-8.5">
                        {question.options.map((option, oIndex) => {
                          const isSelected = option.id === question.selectedOptionId
                          const showCorrectHighlight = !result.answersHidden && option.isCorrect
                          const showWrongHighlight = isSelected && !question.isCorrect

                          return (
                            <div
                              key={option.id}
                              className={`flex items-center gap-3 px-3 py-2 -mx-1 rounded-lg ${
                                showCorrectHighlight
                                  ? "bg-emerald-50"
                                  : showWrongHighlight
                                    ? "bg-red-50"
                                    : ""
                              }`}
                            >
                              <div className={`flex-shrink-0 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center ${
                                showCorrectHighlight
                                  ? "border-emerald-500 bg-emerald-500"
                                  : showWrongHighlight
                                    ? "border-red-400 bg-red-400"
                                    : isSelected
                                      ? "border-slate-400 bg-slate-400"
                                      : "border-slate-200"
                              }`}>
                                {(showCorrectHighlight || showWrongHighlight || isSelected) && (
                                  <div className="w-2 h-2 rounded-full bg-white" />
                                )}
                              </div>
                              <span className={`flex-shrink-0 text-xs font-medium w-5 ${
                                showCorrectHighlight ? "text-emerald-600"
                                  : showWrongHighlight ? "text-red-500"
                                  : "text-slate-400"
                              }`}>
                                {letterLabels[oIndex]}
                              </span>
                              <span className={`text-sm sm:text-base flex-1 ${
                                showCorrectHighlight ? "text-emerald-800 font-medium"
                                  : showWrongHighlight ? "text-red-800"
                                  : "text-slate-600"
                              }`}>
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
          </div>
        </Card>

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
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Time limit: {formatMinutes(quiz.timeLimitSeconds)}
              </div>
            )}
          </div>
        </div>

        {/* Practice Mode Notice */}
        {practiceMode && (
          <div className="mb-6 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-800">Practice Mode</p>
              <p className="text-sm text-amber-700 mt-0.5">Your answers won't be recorded. Feel free to test your knowledge!</p>
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
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
        {/* Quiz Title Row */}
        <div className="max-w-3xl mx-auto px-4 py-3 border-b border-slate-100">
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
        <div className="max-w-3xl mx-auto px-4 py-2.5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Elapsed:
              </div>
              <span className="text-base font-bold text-emerald-600 tabular-nums">
                {formatTime(elapsedSeconds)}
              </span>
            </div>

            {/* Progress */}
            <div className="flex-1 max-w-xs hidden sm:block">
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

            {!practiceMode && quiz.timeLimitSeconds && timeRemaining !== null && (
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
      </div>

      {/* Spacer for fixed header */}
      <div className="h-28" />

      {/* Practice Mode Banner */}
      {practiceMode && (
        <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-amber-700">
            <span className="font-medium text-amber-800">Practice Mode</span> — Your answers won't be recorded.
          </p>
        </div>
      )}

      {/* Quiz Content */}
      <div className="space-y-5 sm:space-y-6">
          {quiz.questions.map((question, qIndex) => {
            const isAnswered = !!answers[question.id]
            const letterLabels = ["A", "B", "C", "D", "E", "F", "G", "H"]
            return (
              <div
                key={question.id}
                className="bg-white rounded-xl overflow-hidden shadow-sm"
              >
                {/* Left accent bar + question */}
                <div className="flex">
                  <div className={`w-1 flex-shrink-0 transition-colors duration-200 ${
                    isAnswered ? "bg-emerald-500" : "bg-blue-500"
                  }`} />
                  <div className="flex-1 px-4 py-3 sm:px-5 sm:py-4">
                    {/* Question header */}
                    <div className="flex items-start gap-2.5 mb-3">
                      <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        isAnswered ? "bg-emerald-500" : "bg-blue-500"
                      }`}>
                        {qIndex + 1}
                      </span>
                      <h3 className="text-sm sm:text-base font-semibold text-slate-900 pt-0.5">
                        {question.questionText}
                      </h3>
                    </div>

                    {/* Options */}
                    <div className="ml-8 sm:ml-8.5">
                      {question.options.map((option, oIndex) => {
                        const isSelected = answers[question.id] === option.id
                        return (
                          <label
                            key={option.id}
                            className={`flex items-center gap-3 px-3 py-2.5 -mx-1 rounded-lg cursor-pointer transition-colors duration-150 ${
                              isSelected
                                ? "bg-blue-50"
                                : "hover:bg-slate-50"
                            }`}
                          >
                            {/* Custom radio circle */}
                            <div className={`flex-shrink-0 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-colors ${
                              isSelected
                                ? "border-blue-500 bg-blue-500"
                                : "border-slate-300"
                            }`}>
                              {isSelected && (
                                <div className="w-2 h-2 rounded-full bg-white" />
                              )}
                            </div>
                            <input
                              type="radio"
                              name={`question-${question.id}`}
                              value={option.id}
                              checked={isSelected}
                              onChange={() => handleAnswerSelect(question.id, option.id)}
                              className="sr-only"
                            />
                            {/* Letter label */}
                            <span className={`flex-shrink-0 text-xs font-medium w-5 ${
                              isSelected ? "text-blue-500" : "text-slate-400"
                            }`}>
                              {letterLabels[oIndex]}
                            </span>
                            <span className={`text-sm sm:text-base ${isSelected ? "text-slate-900 font-medium" : "text-slate-600"}`}>
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
          })}

          {/* Submit / Check Button */}
          <div className="pt-2 pb-6">
            <Button
              onClick={practiceMode ? handleCheckAnswers : () => handleSubmit()}
              disabled={practiceMode ? Object.keys(answers).length === 0 : isSubmitting || Object.keys(answers).length === 0}
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
