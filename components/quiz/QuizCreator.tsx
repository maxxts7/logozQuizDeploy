"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import QuestionBuilder, { Question } from "./QuestionBuilder"

interface QuizCreatorProps {
  initialData?: {
    id?: string
    title: string
    description?: string | null
    timeLimitSeconds?: number | null
    availableFrom?: string | null
    availableUntil?: string | null
    isPublished: boolean
    questions: Question[]
  }
  isEdit?: boolean
}

export default function QuizCreator({ initialData, isEdit = false }: QuizCreatorProps) {
  const router = useRouter()
  const [title, setTitle] = useState(initialData?.title || "")
  const [description, setDescription] = useState(initialData?.description || "")
  const [hasTimeLimit, setHasTimeLimit] = useState(!!initialData?.timeLimitSeconds)
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(
    initialData?.timeLimitSeconds ? Math.floor(initialData.timeLimitSeconds / 60) : 10
  )
  const [hasTimeWindow, setHasTimeWindow] = useState(!!(initialData?.availableFrom || initialData?.availableUntil))
  const [availableFrom, setAvailableFrom] = useState(initialData?.availableFrom || "")
  const [availableUntil, setAvailableUntil] = useState(initialData?.availableUntil || "")
  const [isPublished, setIsPublished] = useState(initialData?.isPublished || false)
  const [questions, setQuestions] = useState<Question[]>(
    initialData?.questions && initialData.questions.length > 0
      ? initialData.questions
      : [createEmptyQuestion(0)]
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  function createEmptyQuestion(order: number): Question {
    return {
      questionText: "",
      order,
      options: [
        { optionText: "", isCorrect: true, order: 0 },
        { optionText: "", isCorrect: false, order: 1 },
        { optionText: "", isCorrect: false, order: 2 },
        { optionText: "", isCorrect: false, order: 3 },
      ],
    }
  }

  const addQuestion = () => {
    setQuestions([...questions, createEmptyQuestion(questions.length)])
  }

  const updateQuestion = (index: number, question: Question) => {
    const newQuestions = [...questions]
    newQuestions[index] = question
    setQuestions(newQuestions)
  }

  const deleteQuestion = (index: number) => {
    if (questions.length === 1) {
      setError("Quiz must have at least one question")
      return
    }
    const newQuestions = questions.filter((_, i) => i !== index)
    // Update order
    setQuestions(newQuestions.map((q, i) => ({ ...q, order: i })))
  }

  const validateQuiz = () => {
    if (!title.trim()) {
      setError("Title is required")
      return false
    }

    if (questions.length === 0) {
      setError("Quiz must have at least one question")
      return false
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]

      if (!q.questionText.trim()) {
        setError(`Question ${i + 1} text is required`)
        return false
      }

      const correctAnswers = q.options.filter(opt => opt.isCorrect).length
      if (correctAnswers !== 1) {
        setError(`Question ${i + 1} must have exactly one correct answer`)
        return false
      }

      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].optionText.trim()) {
          setError(`Question ${i + 1}, Option ${j + 1} text is required`)
          return false
        }
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!validateQuiz()) {
      return
    }

    setIsLoading(true)

    try {
      const quizData = {
        title: title.trim(),
        description: description.trim() || null,
        timeLimitSeconds: hasTimeLimit ? timeLimitMinutes * 60 : null,
        availableFrom: hasTimeWindow && availableFrom ? new Date(availableFrom).toISOString() : null,
        availableUntil: hasTimeWindow && availableUntil ? new Date(availableUntil).toISOString() : null,
        isPublished,
        questions: questions.map((q, index) => ({
          questionText: q.questionText.trim(),
          order: index,
          options: q.options.map((opt, optIndex) => ({
            optionText: opt.optionText.trim(),
            isCorrect: opt.isCorrect,
            order: optIndex,
          })),
        })),
      }

      const url = isEdit ? `/api/quiz/${initialData?.id}` : "/api/quiz"
      const method = isEdit ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(quizData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to save quiz")
        return
      }

      router.push("/dashboard")
      router.refresh()
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {isEdit ? "Edit Quiz" : "Create New Quiz"}
        </h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Quiz Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., General Knowledge Quiz"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of your quiz"
              rows={3}
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <input
                id="hasTimeLimit"
                type="checkbox"
                checked={hasTimeLimit}
                onChange={(e) => setHasTimeLimit(e.target.checked)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
              />
              <label htmlFor="hasTimeLimit" className="ml-2 text-sm font-medium text-gray-700">
                Set time limit
              </label>
            </div>

            {hasTimeLimit && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={timeLimitMinutes}
                  onChange={(e) => setTimeLimitMinutes(parseInt(e.target.value) || 0)}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  required={hasTimeLimit}
                />
                <span className="text-sm text-gray-700">minutes</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <input
                id="hasTimeWindow"
                type="checkbox"
                checked={hasTimeWindow}
                onChange={(e) => setHasTimeWindow(e.target.checked)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
              />
              <label htmlFor="hasTimeWindow" className="ml-2 text-sm font-medium text-gray-700">
                Set availability window
              </label>
            </div>

            {hasTimeWindow && (
              <div className="ml-6 space-y-3">
                <div>
                  <label htmlFor="availableFrom" className="block text-sm font-medium text-gray-700 mb-1">
                    Available from
                  </label>
                  <input
                    id="availableFrom"
                    type="datetime-local"
                    value={availableFrom}
                    onChange={(e) => setAvailableFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="availableUntil" className="block text-sm font-medium text-gray-700 mb-1">
                    Available until
                  </label>
                  <input
                    id="availableUntil"
                    type="datetime-local"
                    value={availableUntil}
                    onChange={(e) => setAvailableUntil(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center">
            <input
              id="isPublished"
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
            />
            <label htmlFor="isPublished" className="ml-2 text-sm font-medium text-gray-700">
              Publish immediately (quiz will be accessible via share link)
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900">Questions</h3>

        {questions.map((question, index) => (
          <QuestionBuilder
            key={index}
            question={question}
            questionIndex={index}
            onUpdate={updateQuestion}
            onDelete={deleteQuestion}
          />
        ))}

        <button
          type="button"
          onClick={addQuestion}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 font-medium"
        >
          + Add Question
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 px-6 py-3 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Saving..." : isEdit ? "Update Quiz" : "Create Quiz"}
        </button>
      </div>
    </form>
  )
}
