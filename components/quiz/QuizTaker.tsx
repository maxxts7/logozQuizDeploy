"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface QuizTakerProps {
  quiz: {
    id: string
    title: string
    description: string | null
    timeLimitSeconds: number | null
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
}

export default function QuizTaker({ quiz }: QuizTakerProps) {
  const router = useRouter()
  const [participantName, setParticipantName] = useState("")
  const [started, setStarted] = useState(false)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{ score: number; total: number } | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    quiz.timeLimitSeconds
  )

  // Elapsed time counter
  useEffect(() => {
    if (!started) return

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1)
    }, 1000)

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
    }, 1000)

    return () => clearInterval(interval)
  }, [started, timeRemaining])

  const handleStart = () => {
    if (!participantName.trim()) {
      alert("Please enter your name")
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
          participantName: participantName.trim(),
          timeSpentSeconds,
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (result) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Quiz Completed!</h1>
        <div className="mb-6">
          <div className="text-6xl font-bold text-blue-600 mb-2">
            {result.score}%
          </div>
          <p className="text-gray-600">
            You got {Math.round((result.score / 100) * result.total)} out of {result.total} questions correct
          </p>
        </div>
        <p className="text-gray-500 mb-6">Thank you for participating, {participantName}!</p>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
        >
          Done
        </button>
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
              <li>• Time limit: {Math.floor(quiz.timeLimitSeconds / 60)} minutes</li>
            )}
          </ul>
        </div>

        <div className="mb-6">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Your Name *
          </label>
          <input
            id="name"
            type="text"
            value={participantName}
            onChange={(e) => setParticipantName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your name"
            required
          />
        </div>

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
        <p className="text-gray-600 mb-6">Participant: {participantName}</p>

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
