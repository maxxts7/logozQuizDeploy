"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import QuestionBuilder, { Question } from "./QuestionBuilder"
import ParticipantFieldsBuilder, { ParticipantField } from "./ParticipantFieldsBuilder"
import ExcelUploader from "./ExcelUploader"
import QuizImporter from "./QuizImporter"
import { QUIZ_TIMING, QUESTION_CONFIG } from "@/constants/quizConfig"
import { secondsToMinutes, minutesToSeconds } from "@/lib/utils/timeFormatter"
import { Button, Input, Textarea, Label, Alert, Card, Checkbox } from "@/components/ui"

function isoToDateTimeLocal(isoString: string | null | undefined): string {
  if (!isoString) return ""
  const date = new Date(isoString)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function isEmptyQuestion(question: Question): boolean {
  return !question.questionText.trim() && question.options.every(opt => !opt.optionText.trim())
}

function validateQuestion(question: Question, index: number): string | null {
  if (!question.questionText.trim()) {
    return `Question ${index + 1} text is required`
  }

  const correctCount = question.options.filter(opt => opt.isCorrect).length
  if (correctCount !== 1) {
    return `Question ${index + 1} must have exactly one correct answer`
  }

  for (let j = 0; j < question.options.length; j++) {
    if (!question.options[j].optionText.trim()) {
      return `Question ${index + 1}, Option ${j + 1} text is required`
    }
  }

  return null
}

interface QuizCreatorProps {
  initialData?: {
    id?: string
    title: string
    description?: string | null
    timeLimitSeconds?: number | null
    availableFromISO?: string | null
    availableUntilISO?: string | null
    isPublished: boolean
    participantFields?: ParticipantField[]
    randomizeQuestions?: boolean
    randomizeOptions?: boolean
    maxAttemptsPerIp?: number | null
    showAnswersAfterISO?: string | null
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
  const [hasTimeWindow, setHasTimeWindow] = useState(!!(initialData?.availableFromISO || initialData?.availableUntilISO))
  const [availableFrom, setAvailableFrom] = useState(isoToDateTimeLocal(initialData?.availableFromISO))
  const [availableUntil, setAvailableUntil] = useState(isoToDateTimeLocal(initialData?.availableUntilISO))
  const [isPublished, setIsPublished] = useState(initialData?.isPublished || false)
  const [randomizeQuestions, setRandomizeQuestions] = useState(initialData?.randomizeQuestions || false)
  const [randomizeOptions, setRandomizeOptions] = useState(initialData?.randomizeOptions || false)
  const [hasIpLimit, setHasIpLimit] = useState(!!initialData?.maxAttemptsPerIp)
  const [maxAttemptsPerIp, setMaxAttemptsPerIp] = useState(initialData?.maxAttemptsPerIp || 1)
  const [hasAnswerRevealWindow, setHasAnswerRevealWindow] = useState(!!initialData?.showAnswersAfterISO)
  const [showAnswersAfter, setShowAnswersAfter] = useState(isoToDateTimeLocal(initialData?.showAnswersAfterISO))
  const [participantFields, setParticipantFields] = useState<ParticipantField[]>(initialData?.participantFields || [])
  const [questions, setQuestions] = useState<Question[]>(
    initialData?.questions && initialData.questions.length > 0
      ? initialData.questions
      : [createEmptyQuestion(0)]
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showUploader, setShowUploader] = useState(false)
  const [showQuizImporter, setShowQuizImporter] = useState(false)

  function createEmptyQuestion(order: number): Question {
    return {
      questionText: "",
      order,
      marks: 1,
      options: Array.from({ length: QUESTION_CONFIG.DEFAULT_OPTIONS_COUNT }, (_, i) => ({
        optionText: "",
        isCorrect: i === 0,
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
    const newQuestions = [
      ...questions.slice(0, index + 1),
      duplicatedQuestion,
      ...questions.slice(index + 1),
    ].map((q, i) => ({ ...q, order: i }))
    setQuestions(newQuestions)
  }

  const handleQuestionsImported = (importedQuestions: Question[]) => {
    const shouldReplace = questions.length === 1 && isEmptyQuestion(questions[0])

    if (shouldReplace) {
      setQuestions(importedQuestions)
    } else {
      const updatedQuestions = [
        ...questions,
        ...importedQuestions.map((q, i) => ({ ...q, order: questions.length + i })),
      ]
      setQuestions(updatedQuestions)
    }

    setShowUploader(false)
    setShowQuizImporter(false)
    setError("")
  }

  const validateQuiz = (): boolean => {
    if (!title.trim()) {
      setError("Title is required")
      return false
    }

    if (questions.length === 0) {
      setError("Quiz must have at least one question")
      return false
    }

    for (let i = 0; i < questions.length; i++) {
      const errorMsg = validateQuestion(questions[i], i)
      if (errorMsg) {
        setError(errorMsg)
        return false
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
        showAnswersAfter: hasAnswerRevealWindow && showAnswersAfter ? new Date(showAnswersAfter).toISOString() : null,
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
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
      {/* Quiz Settings Card */}
      <Card>
        <h2 className="text-xl font-semibold text-slate-900 mb-6">
          {isEdit ? "Edit Quiz" : "Create New Quiz"}
        </h2>

        <div className="space-y-5">
          <div>
            <Label htmlFor="title" required>Quiz Title</Label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., General Knowledge Quiz"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of your quiz"
              rows={3}
            />
          </div>

          {/* Participant Fields */}
          <ParticipantFieldsBuilder
            fields={participantFields}
            onChange={setParticipantFields}
          />

          {/* Test Duration */}
          <div className="flex items-start gap-4">
            <Checkbox
              id="hasTimeLimit"
              checked={hasTimeLimit}
              onChange={(e) => setHasTimeLimit(e.target.checked)}
              label="Set test duration"
            />
            {hasTimeLimit && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={timeLimitMinutes}
                  onChange={(e) => setTimeLimitMinutes(parseInt(e.target.value) || 0)}
                  className="w-20"
                  min="1"
                  required={hasTimeLimit}
                />
                <span className="text-sm text-slate-600">minutes</span>
              </div>
            )}
          </div>

          {/* Opening and Closing Time */}
          <div className="space-y-3">
            <Checkbox
              id="hasTimeWindow"
              checked={hasTimeWindow}
              onChange={(e) => setHasTimeWindow(e.target.checked)}
              label="Set opening and closing time"
            />
            {hasTimeWindow && (
              <div className="ml-6 space-y-3 p-4 bg-slate-50 rounded-lg">
                <div>
                  <Label htmlFor="availableFrom">Opens at</Label>
                  <Input
                    id="availableFrom"
                    type="datetime-local"
                    value={availableFrom}
                    onChange={(e) => setAvailableFrom(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="availableUntil">Closes at</Label>
                  <Input
                    id="availableUntil"
                    type="datetime-local"
                    value={availableUntil}
                    onChange={(e) => setAvailableUntil(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Publish */}
          <Checkbox
            id="isPublished"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            label="Publish immediately (quiz will be accessible via share link)"
          />

          {/* Shuffle Options */}
          <Checkbox
            id="randomizeQuestions"
            checked={randomizeQuestions}
            onChange={(e) => setRandomizeQuestions(e.target.checked)}
            label="Shuffle question order for each participant"
          />

          <Checkbox
            id="randomizeOptions"
            checked={randomizeOptions}
            onChange={(e) => setRandomizeOptions(e.target.checked)}
            label="Shuffle answer options for each question"
          />

          {/* Attempt Limit */}
          <div className="space-y-3">
            <Checkbox
              id="hasIpLimit"
              checked={hasIpLimit}
              onChange={(e) => setHasIpLimit(e.target.checked)}
              label="Limit number of attempts"
            />
            {hasIpLimit && (
              <div className="ml-6 flex items-center gap-2">
                <Label htmlFor="maxAttemptsPerIp" className="mb-0">Maximum attempts:</Label>
                <Input
                  id="maxAttemptsPerIp"
                  type="number"
                  value={maxAttemptsPerIp || ""}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === "") {
                      setMaxAttemptsPerIp(0)
                    } else {
                      const num = parseInt(val)
                      if (!isNaN(num) && num >= 0) {
                        setMaxAttemptsPerIp(num)
                      }
                    }
                  }}
                  onBlur={() => {
                    if (!maxAttemptsPerIp || maxAttemptsPerIp < 1) {
                      setMaxAttemptsPerIp(1)
                    }
                  }}
                  className="w-20"
                  min="1"
                />
              </div>
            )}
          </div>

          {/* Show Answers After Quiz Ends */}
          <div className="space-y-3">
            <Checkbox
              id="hasAnswerRevealWindow"
              checked={hasAnswerRevealWindow}
              onChange={(e) => setHasAnswerRevealWindow(e.target.checked)}
              label="Show answers after quiz ends"
            />
            {hasAnswerRevealWindow && (
              <div className="ml-6 space-y-3 p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">
                  Until this time, participants will only see which questions they got wrong, not the correct answers.
                </p>
                <div>
                  <Label htmlFor="showAnswersAfter">Show after</Label>
                  <Input
                    id="showAnswersAfter"
                    type="datetime-local"
                    value={showAnswersAfter}
                    onChange={(e) => setShowAnswersAfter(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Questions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-slate-900">Questions</h3>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowQuizImporter(true)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Import from Quiz
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowUploader(!showUploader)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import from Excel
            </Button>
          </div>
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
          className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 font-medium transition-all duration-150"
        >
          + Add Question
        </button>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="error">{error}</Alert>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="flex-1"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="lg"
          className="flex-1"
          isLoading={isLoading}
        >
          {isLoading ? "Saving..." : isEdit ? "Update Quiz" : "Create Quiz"}
        </Button>
      </div>

      {/* Quiz Importer Modal */}
      {showQuizImporter && (
        <QuizImporter
          currentQuizId={initialData?.id}
          onQuestionsImported={handleQuestionsImported}
          onClose={() => setShowQuizImporter(false)}
        />
      )}
    </form>
  )
}
