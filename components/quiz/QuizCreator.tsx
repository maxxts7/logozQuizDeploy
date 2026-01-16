"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import QuestionBuilder, { Question } from "./QuestionBuilder"
import ParticipantFieldsBuilder, { ParticipantField } from "./ParticipantFieldsBuilder"
import ExcelUploader from "./ExcelUploader"
import { QUIZ_TIMING, QUESTION_CONFIG } from "@/constants/quizConfig"
import { secondsToMinutes, minutesToSeconds } from "@/lib/utils/timeFormatter"
import { componentStyles, cn } from "@/constants/theme"

interface QuizCreatorProps {
  initialData?: {
    id?: string
    title: string
    description?: string | null
    timeLimitSeconds?: number | null
    availableFrom?: string | null
    availableUntil?: string | null
    isPublished: boolean
    participantFields?: ParticipantField[]
    randomizeQuestions?: boolean
    randomizeOptions?: boolean
    maxAttemptsPerIp?: number | null
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
    initialData?.timeLimitSeconds ? secondsToMinutes(initialData.timeLimitSeconds) : QUIZ_TIMING.DEFAULT_TIME_LIMIT_MINUTES
  )
  const [hasTimeWindow, setHasTimeWindow] = useState(!!(initialData?.availableFrom || initialData?.availableUntil))
  const [availableFrom, setAvailableFrom] = useState(initialData?.availableFrom || "")
  const [availableUntil, setAvailableUntil] = useState(initialData?.availableUntil || "")
  const [isPublished, setIsPublished] = useState(initialData?.isPublished || false)
  const [randomizeQuestions, setRandomizeQuestions] = useState(initialData?.randomizeQuestions || false)
  const [randomizeOptions, setRandomizeOptions] = useState(initialData?.randomizeOptions || false)
  const [hasIpLimit, setHasIpLimit] = useState(!!initialData?.maxAttemptsPerIp)
  const [maxAttemptsPerIp, setMaxAttemptsPerIp] = useState(initialData?.maxAttemptsPerIp || 1)
  const [participantFields, setParticipantFields] = useState<ParticipantField[]>(initialData?.participantFields || [])
  const [questions, setQuestions] = useState<Question[]>(
    initialData?.questions && initialData.questions.length > 0
      ? initialData.questions
      : [createEmptyQuestion(0)]
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showUploader, setShowUploader] = useState(false)

  function createEmptyQuestion(order: number): Question {
    return {
      questionText: "",
      order,
      marks: 1,
      options: Array.from({ length: QUESTION_CONFIG.DEFAULT_OPTIONS_COUNT }, (_, i) => ({
        optionText: "",
        isCorrect: i === 0, // First option is correct by default
        order: i,
      })),
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

  const duplicateQuestion = (index: number) => {
    const questionToDuplicate = questions[index]
    const duplicatedQuestion: Question = {
      questionText: questionToDuplicate.questionText,
      order: index + 1,
      marks: questionToDuplicate.marks,
      options: questionToDuplicate.options.map((opt) => ({
        optionText: opt.optionText,
        isCorrect: opt.isCorrect,
        order: opt.order,
      })),
    }
    // Insert after the current question and update orders
    const newQuestions = [
      ...questions.slice(0, index + 1),
      duplicatedQuestion,
      ...questions.slice(index + 1),
    ].map((q, i) => ({ ...q, order: i }))
    setQuestions(newQuestions)
  }

  const handleQuestionsImported = (importedQuestions: Question[]) => {
    // Add imported questions to existing ones (or replace if current is just empty template)
    const isOnlyEmptyQuestion = questions.length === 1 &&
      !questions[0].questionText.trim() &&
      questions[0].options.every(opt => !opt.optionText.trim())

    if (isOnlyEmptyQuestion) {
      setQuestions(importedQuestions)
    } else {
      const updatedQuestions = [
        ...questions,
        ...importedQuestions.map((q, i) => ({
          ...q,
          order: questions.length + i,
        })),
      ]
      setQuestions(updatedQuestions)
    }
    setShowUploader(false)
    setError("")
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
        timeLimitSeconds: hasTimeLimit ? minutesToSeconds(timeLimitMinutes) : null,
        availableFrom: hasTimeWindow && availableFrom ? new Date(availableFrom).toISOString() : null,
        availableUntil: hasTimeWindow && availableUntil ? new Date(availableUntil).toISOString() : null,
        isPublished,
        participantFields: participantFields.filter(f => f.label.trim()),
        randomizeQuestions,
        randomizeOptions,
        maxAttemptsPerIp: hasIpLimit ? maxAttemptsPerIp : null,
        questions: questions.map((q, index) => ({
          questionText: q.questionText.trim(),
          order: index,
          marks: q.marks || 1,
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

          <div className="flex items-center">
            <input
              id="randomizeQuestions"
              type="checkbox"
              checked={randomizeQuestions}
              onChange={(e) => setRandomizeQuestions(e.target.checked)}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
            />
            <label htmlFor="randomizeQuestions" className="ml-2 text-sm font-medium text-gray-700">
              Randomize question order for each participant
            </label>
          </div>

          <div className="flex items-center">
            <input
              id="randomizeOptions"
              type="checkbox"
              checked={randomizeOptions}
              onChange={(e) => setRandomizeOptions(e.target.checked)}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
            />
            <label htmlFor="randomizeOptions" className="ml-2 text-sm font-medium text-gray-700">
              Randomize answer options for each question
            </label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <input
                id="hasIpLimit"
                type="checkbox"
                checked={hasIpLimit}
                onChange={(e) => setHasIpLimit(e.target.checked)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
              />
              <label htmlFor="hasIpLimit" className="ml-2 text-sm font-medium text-gray-700">
                Limit attempts per IP address
              </label>
            </div>

            {hasIpLimit && (
              <div className="ml-6 flex items-center gap-2">
                <label htmlFor="maxAttemptsPerIp" className="text-sm font-medium text-gray-700">
                  Maximum attempts:
                </label>
                <input
                  id="maxAttemptsPerIp"
                  type="number"
                  value={maxAttemptsPerIp}
                  onChange={(e) => setMaxAttemptsPerIp(parseInt(e.target.value) || 1)}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
                <span className="text-sm text-gray-500">per IP address</span>
              </div>
            )}
          </div>

          <ParticipantFieldsBuilder
            fields={participantFields}
            onChange={setParticipantFields}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">Questions</h3>
          <button
            type="button"
            onClick={() => setShowUploader(!showUploader)}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import from Excel
          </button>
        </div>

        {showUploader && (
          <ExcelUploader onQuestionsImported={handleQuestionsImported} />
        )}

        {questions.map((question, index) => (
          <QuestionBuilder
            key={index}
            question={question}
            questionIndex={index}
            onUpdate={updateQuestion}
            onDelete={deleteQuestion}
            onDuplicate={duplicateQuestion}
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
        <div className={componentStyles.alert.error}>
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className={cn("flex-1 px-6 py-3 rounded-md font-medium", componentStyles.button.secondary)}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className={cn("flex-1 px-6 py-3 rounded-md font-medium", componentStyles.button.primary, componentStyles.button.disabled)}
        >
          {isLoading ? "Saving..." : isEdit ? "Update Quiz" : "Create Quiz"}
        </button>
      </div>
    </form>
  )
}
