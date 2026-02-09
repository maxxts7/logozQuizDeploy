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
    coverImage?: string | null
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
  const [coverImage, setCoverImage] = useState(initialData?.coverImage || "")
  const [participantFields, setParticipantFields] = useState<ParticipantField[]>(initialData?.participantFields ?? [{ label: "Name", required: true }])
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
        coverImage: coverImage.trim() || null,
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

          <div>
            <Label htmlFor="coverImage">Cover Image URL (optional)</Label>
            <Input
              id="coverImage"
              type="url"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
            <p className="text-xs text-slate-500 mt-1">
              Image shown when sharing on WhatsApp, Facebook, etc. Use a public URL (e.g., Dropbox, Imgur).
            </p>
          </div>

          {/* Participant Fields */}
          <ParticipantFieldsBuilder
            fields={participantFields}
            onChange={setParticipantFields}
          />

          {/* Quiz Options */}
          <div className="pt-1">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Quiz Options</h3>
            <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">

              {/* Time Limit */}
              <div>
                <label htmlFor="hasTimeLimit" className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors duration-150 ${hasTimeLimit ? "bg-blue-50/50" : "hover:bg-slate-50"}`}>
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 transition-colors duration-150 ${hasTimeLimit ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-slate-700">Time Limit</span>
                    <span className="hidden sm:inline text-xs text-slate-400 ml-2">Countdown timer for the quiz</span>
                  </div>
                  <input type="checkbox" id="hasTimeLimit" checked={hasTimeLimit} onChange={(e) => setHasTimeLimit(e.target.checked)} className="sr-only" />
                  <div className={`w-9 h-5 rounded-full transition-colors duration-200 relative flex-shrink-0 ${hasTimeLimit ? "bg-blue-500" : "bg-slate-300"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${hasTimeLimit ? "translate-x-4" : "translate-x-0.5"}`} />
                  </div>
                </label>
                <div className="grid transition-[grid-template-rows] duration-200 ease-out" style={{ gridTemplateRows: hasTimeLimit ? '1fr' : '0fr' }}>
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-50/70 border-t border-blue-100">
                      <div className="w-7 flex-shrink-0" />
                      <span className="text-sm text-slate-600">Duration:</span>
                      <Input type="number" value={timeLimitMinutes} onChange={(e) => setTimeLimitMinutes(parseInt(e.target.value) || 0)} className="w-20 !py-1.5 !text-sm" min="1" required={hasTimeLimit} />
                      <span className="text-sm text-slate-500">minutes</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Availability Window */}
              <div>
                <label htmlFor="hasTimeWindow" className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors duration-150 ${hasTimeWindow ? "bg-violet-50/50" : "hover:bg-slate-50"}`}>
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 transition-colors duration-150 ${hasTimeWindow ? "bg-violet-100 text-violet-600" : "bg-slate-100 text-slate-400"}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-slate-700">Availability Window</span>
                    <span className="hidden sm:inline text-xs text-slate-400 ml-2">Schedule open and close times</span>
                  </div>
                  <input type="checkbox" id="hasTimeWindow" checked={hasTimeWindow} onChange={(e) => setHasTimeWindow(e.target.checked)} className="sr-only" />
                  <div className={`w-9 h-5 rounded-full transition-colors duration-200 relative flex-shrink-0 ${hasTimeWindow ? "bg-violet-500" : "bg-slate-300"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${hasTimeWindow ? "translate-x-4" : "translate-x-0.5"}`} />
                  </div>
                </label>
                <div className="grid transition-[grid-template-rows] duration-200 ease-out" style={{ gridTemplateRows: hasTimeWindow ? '1fr' : '0fr' }}>
                  <div className="overflow-hidden">
                    <div className="px-4 py-3 bg-violet-50/70 border-t border-violet-100">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-10">
                        <div>
                          <Label htmlFor="availableFrom" className="!text-xs !text-slate-500 !mb-1">Opens at</Label>
                          <Input id="availableFrom" type="datetime-local" value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)} className="!text-sm !py-1.5" />
                        </div>
                        <div>
                          <Label htmlFor="availableUntil" className="!text-xs !text-slate-500 !mb-1">Closes at</Label>
                          <Input id="availableUntil" type="datetime-local" value={availableUntil} onChange={(e) => setAvailableUntil(e.target.value)} className="!text-sm !py-1.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Publish */}
              <label htmlFor="isPublished" className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors duration-150 ${isPublished ? "bg-emerald-50/50" : "hover:bg-slate-50"}`}>
                <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 transition-colors duration-150 ${isPublished ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-slate-700">Publish</span>
                  <span className="hidden sm:inline text-xs text-slate-400 ml-2">Make live and shareable via link</span>
                </div>
                <input type="checkbox" id="isPublished" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="sr-only" />
                <div className={`w-9 h-5 rounded-full transition-colors duration-200 relative flex-shrink-0 ${isPublished ? "bg-emerald-500" : "bg-slate-300"}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${isPublished ? "translate-x-4" : "translate-x-0.5"}`} />
                </div>
              </label>

              {/* Shuffle Questions */}
              <label htmlFor="randomizeQuestions" className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors duration-150 ${randomizeQuestions ? "bg-amber-50/50" : "hover:bg-slate-50"}`}>
                <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 transition-colors duration-150 ${randomizeQuestions ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400"}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 18h2.586a2 2 0 001.414-.586l9.172-9.172A2 2 0 0117.586 8H21m0 0l-3-3m3 3l-3 3M3 6h2.586a2 2 0 011.414.586l9.172 9.172a2 2 0 001.414.586H21m0 0l-3-3m3 3l-3 3" /></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-slate-700">Shuffle Questions</span>
                  <span className="hidden sm:inline text-xs text-slate-400 ml-2">Randomize order per participant</span>
                </div>
                <input type="checkbox" id="randomizeQuestions" checked={randomizeQuestions} onChange={(e) => setRandomizeQuestions(e.target.checked)} className="sr-only" />
                <div className={`w-9 h-5 rounded-full transition-colors duration-200 relative flex-shrink-0 ${randomizeQuestions ? "bg-amber-500" : "bg-slate-300"}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${randomizeQuestions ? "translate-x-4" : "translate-x-0.5"}`} />
                </div>
              </label>

              {/* Shuffle Options */}
              <label htmlFor="randomizeOptions" className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors duration-150 ${randomizeOptions ? "bg-amber-50/50" : "hover:bg-slate-50"}`}>
                <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 transition-colors duration-150 ${randomizeOptions ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400"}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 18h2.586a2 2 0 001.414-.586l9.172-9.172A2 2 0 0117.586 8H21m0 0l-3-3m3 3l-3 3M3 6h2.586a2 2 0 011.414.586l9.172 9.172a2 2 0 001.414.586H21m0 0l-3-3m3 3l-3 3" /></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-slate-700">Shuffle Options</span>
                  <span className="hidden sm:inline text-xs text-slate-400 ml-2">Randomize answer choices</span>
                </div>
                <input type="checkbox" id="randomizeOptions" checked={randomizeOptions} onChange={(e) => setRandomizeOptions(e.target.checked)} className="sr-only" />
                <div className={`w-9 h-5 rounded-full transition-colors duration-200 relative flex-shrink-0 ${randomizeOptions ? "bg-amber-500" : "bg-slate-300"}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${randomizeOptions ? "translate-x-4" : "translate-x-0.5"}`} />
                </div>
              </label>

              {/* Attempt Limit */}
              <div>
                <label htmlFor="hasIpLimit" className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors duration-150 ${hasIpLimit ? "bg-rose-50/50" : "hover:bg-slate-50"}`}>
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 transition-colors duration-150 ${hasIpLimit ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-400"}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-slate-700">Attempt Limit</span>
                    <span className="hidden sm:inline text-xs text-slate-400 ml-2">Restrict retakes per person</span>
                  </div>
                  <input type="checkbox" id="hasIpLimit" checked={hasIpLimit} onChange={(e) => setHasIpLimit(e.target.checked)} className="sr-only" />
                  <div className={`w-9 h-5 rounded-full transition-colors duration-200 relative flex-shrink-0 ${hasIpLimit ? "bg-rose-500" : "bg-slate-300"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${hasIpLimit ? "translate-x-4" : "translate-x-0.5"}`} />
                  </div>
                </label>
                <div className="grid transition-[grid-template-rows] duration-200 ease-out" style={{ gridTemplateRows: hasIpLimit ? '1fr' : '0fr' }}>
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-rose-50/70 border-t border-rose-100">
                      <div className="w-7 flex-shrink-0" />
                      <span className="text-sm text-slate-600">Max attempts:</span>
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
                        className="w-20 !py-1.5 !text-sm"
                        min="1"
                      />
                      <span className="text-sm text-slate-500">per person</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delayed Answers */}
              <div>
                <label htmlFor="hasAnswerRevealWindow" className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors duration-150 ${hasAnswerRevealWindow ? "bg-teal-50/50" : "hover:bg-slate-50"}`}>
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 transition-colors duration-150 ${hasAnswerRevealWindow ? "bg-teal-100 text-teal-600" : "bg-slate-100 text-slate-400"}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-slate-700">Delayed Answers</span>
                    <span className="hidden sm:inline text-xs text-slate-400 ml-2">Reveal correct answers on a schedule</span>
                  </div>
                  <input type="checkbox" id="hasAnswerRevealWindow" checked={hasAnswerRevealWindow} onChange={(e) => setHasAnswerRevealWindow(e.target.checked)} className="sr-only" />
                  <div className={`w-9 h-5 rounded-full transition-colors duration-200 relative flex-shrink-0 ${hasAnswerRevealWindow ? "bg-teal-500" : "bg-slate-300"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${hasAnswerRevealWindow ? "translate-x-4" : "translate-x-0.5"}`} />
                  </div>
                </label>
                <div className="grid transition-[grid-template-rows] duration-200 ease-out" style={{ gridTemplateRows: hasAnswerRevealWindow ? '1fr' : '0fr' }}>
                  <div className="overflow-hidden">
                    <div className="px-4 py-3 bg-teal-50/70 border-t border-teal-100">
                      <div className="pl-10 space-y-2">
                        <p className="text-xs text-slate-500">Until this time, participants only see which questions they got wrong.</p>
                        <div>
                          <Label htmlFor="showAnswersAfter" className="!text-xs !text-slate-500 !mb-1">Reveal after</Label>
                          <Input id="showAnswersAfter" type="datetime-local" value={showAnswersAfter} onChange={(e) => setShowAnswersAfter(e.target.value)} className="!text-sm !py-1.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
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

      {/* Bottom spacer for mobile reachability */}
      <div className="pb-24 sm:pb-0" />

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
