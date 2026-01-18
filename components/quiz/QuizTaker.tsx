"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { QUIZ_TIMING } from "@/constants/quizConfig"
import { formatTime, formatMinutes } from "@/lib/utils/timeFormatter"

interface ParticipantField {
  label: string
  required: boolean
}

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
      options: {
        id: string
        optionText: string
        order: number
      }[]
    }[]
  }
  visitorIp?: string
}

export default function QuizTaker({ quiz, visitorIp }: QuizTakerProps) {
  const router = useRouter()
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

  // Elapsed time counter
  useEffect(() => {
    if (!started) return

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1)
    }, QUIZ_TIMING.TIMER_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [started])

  // Countdown timer for time limit
  useEffect(() => {
    if (!started || !timeRemaining) return

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          handleSubmit()
          return null
        }
        return prev - 1
      })
    }, QUIZ_TIMING.TIMER_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [started, timeRemaining])

  const handleFieldChange = (label: string, value: string) => {
    setParticipantData((prev) => ({
      ...prev,
      [label]: value,
    }))
    // Clear error when user starts typing
    if (fieldErrors[label]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[label]
        return newErrors
      })
    }
  }

  const handleStart = () => {
    // Validate required fields
    const errors: Record<string, string> = {}
    for (const field of quiz.participantFields) {
      if (field.required && !participantData[field.label]?.trim()) {
        errors[field.label] = `${field.label} is required`
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
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

  const handleSubmit = async () => {
    if (isSubmitting) return

    // Check if all questions are answered
    const unanswered = quiz.questions.filter((q) => !answers[q.id])
    if (unanswered.length > 0 && timeRemaining !== null && timeRemaining > 0) {
      if (!confirm(`You have ${unanswered.length} unanswered question(s). Submit anyway?`)) {
        return
      }
    }

    setIsSubmitting(true)

    // Calculate time spent in seconds
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
    } catch (error) {
      alert("An error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get display name from participant data (use first field or empty)
  const displayName = quiz.participantFields.length > 0
    ? participantData[quiz.participantFields[0].label] || ""
    : ""

  if (result) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Quiz Completed!</h1>
          <div className="mb-6">
            <div className="text-6xl font-bold text-blue-600 mb-2">
              {result.score}%
            </div>
            <p className="text-gray-600 text-lg">
              {result.earnedMarks} / {result.totalMarks} marks
            </p>
            <p className="text-gray-500 text-sm mt-1">
              ({result.total} questions)
            </p>
          </div>
          <p className="text-gray-500 mb-6">
            {displayName
              ? `Thank you for participating, ${displayName}!`
              : "Thank you for participating!"}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Review Your Answers</h2>

          {result.answersHidden && result.showAnswersAfter && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-800 text-sm">
                <strong>Note:</strong> Correct answers will be revealed after{" "}
                <strong>{new Date(result.showAnswersAfter).toLocaleString()}</strong>.
                For now, you can only see which questions you got right or wrong.
              </p>
            </div>
          )}

          <div className="space-y-6">
            {result.review.map((question, index) => (
              <div
                key={question.questionId}
                className={`p-4 rounded-lg border-2 ${
                  question.isCorrect
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                        question.isCorrect ? "bg-green-500" : "bg-red-500"
                      }`}
                    >
                      {question.isCorrect ? "✓" : "✗"}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {index + 1}. {question.questionText}
                    </h3>
                  </div>
                  <span className={`text-sm font-medium px-2 py-1 rounded ${
                    question.isCorrect
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}>
                    {question.isCorrect ? question.marks : 0} / {question.marks} marks
                  </span>
                </div>

                <div className="ml-9 space-y-2">
                  {question.options.map((option) => {
                    const isSelected = option.id === question.selectedOptionId
                    const isCorrect = option.isCorrect
                    const showCorrectHighlight = !result.answersHidden && isCorrect
                    const showWrongHighlight = isSelected && !question.isCorrect
                    const showSelectedCorrect = isSelected && question.isCorrect

                    const optionStyle = (showCorrectHighlight || showSelectedCorrect)
                      ? "border-green-500 bg-green-100"
                      : showWrongHighlight
                        ? "border-red-500 bg-red-100"
                        : "border-gray-200 bg-white"

                    return (
                      <div
                        key={option.id}
                        className={`p-3 rounded-lg border-2 ${optionStyle}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-gray-900">{option.optionText}</span>
                          <div className="flex items-center gap-2">
                            {isSelected && (
                              <span className="text-sm font-medium text-gray-600">
                                Your answer
                              </span>
                            )}
                            {showCorrectHighlight && (
                              <span className="text-sm font-medium text-green-600">
                                Correct answer
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
          >
            Done
          </button>
        </div>
      </div>
    )
  }

  if (!started) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{quiz.title}</h1>
        {quiz.description && (
          <p className="text-gray-600 mb-6">{quiz.description}</p>
        )}

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">Quiz Details:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• {quiz.questions.length} questions</li>
            {quiz.timeLimitSeconds && (
              <li>• Time limit: {formatMinutes(quiz.timeLimitSeconds)}</li>
            )}
          </ul>
        </div>

        {quiz.participantFields.length > 0 && (
          <div className="space-y-4 mb-6">
            {quiz.participantFields.map((field) => (
              <div key={field.label}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.label} {field.required && "*"}
                </label>
                <input
                  type="text"
                  value={participantData[field.label] || ""}
                  onChange={(e) => handleFieldChange(field.label, e.target.value)}
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    fieldErrors[field.label] ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                />
                {fieldErrors[field.label] && (
                  <p className="mt-1 text-sm text-red-500">{fieldErrors[field.label]}</p>
                )}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleStart}
          className="w-full py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
        >
          Start Quiz
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-4 sticky top-4 z-10">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium text-gray-700">Time Elapsed:</span>
            <span className="ml-3 text-2xl font-bold text-green-600">
              {formatTime(elapsedSeconds)}
            </span>
          </div>
          {quiz.timeLimitSeconds && timeRemaining !== null && (
            <div>
              <span className="font-medium text-gray-700">Time Remaining:</span>
              <span className={`ml-3 text-2xl font-bold ${timeRemaining < 60 ? "text-red-600" : "text-blue-600"}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{quiz.title}</h1>
        {displayName && (
          <p className="text-gray-600 mb-6">Participant: {displayName}</p>
        )}

        <div className="space-y-8">
          {quiz.questions.map((question, qIndex) => (
            <div key={question.id} className="border-b border-gray-200 pb-6 last:border-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {qIndex + 1}. {question.questionText}
              </h3>

              <div className="space-y-2">
                {question.options.map((option) => (
                  <label
                    key={option.id}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                      answers[question.id] === option.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={option.id}
                      checked={answers[question.id] === option.id}
                      onChange={() => handleAnswerSelect(question.id, option.id)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="ml-3 text-gray-900">{option.optionText}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting || Object.keys(answers).length === 0}
          className="w-full mt-8 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Submitting..." : "Submit Quiz"}
        </button>
      </div>
    </div>
  )
}
