"use client"

import { useState, useEffect } from "react"
import { Question } from "./QuestionBuilder"
import { toggleSetItem } from "@/lib/utils/collections"
import { Modal, ModalHeader, ModalTitle, ModalClose, ModalBody, ModalFooter } from "@/components/ui/Modal"
import { Button, Checkbox, Badge } from "@/components/ui"

interface QuizWithQuestions {
  id: string
  title: string
  questions: {
    questionText: string
    marks: number
    order: number
    options: {
      optionText: string
      isCorrect: boolean
      order: number
    }[]
  }[]
}

interface QuizImporterProps {
  currentQuizId?: string
  onQuestionsImported: (questions: Question[]) => void
  onClose: () => void
}

function getQuestionKey(quizId: string, questionIndex: number): string {
  return `${quizId}-${questionIndex}`
}

function getAllQuestionKeys(quizzes: QuizWithQuestions[], selectedQuizIds: Set<string>): Set<string> {
  const keys = new Set<string>()
  for (const quiz of quizzes) {
    if (!selectedQuizIds.has(quiz.id)) continue
    for (let i = 0; i < quiz.questions.length; i++) {
      keys.add(getQuestionKey(quiz.id, i))
    }
  }
  return keys
}

export default function QuizImporter({
  currentQuizId,
  onQuestionsImported,
  onClose,
}: QuizImporterProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [quizzes, setQuizzes] = useState<QuizWithQuestions[]>([])
  const [selectedQuizIds, setSelectedQuizIds] = useState<Set<string>>(new Set())
  const [selectedQuestionKeys, setSelectedQuestionKeys] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchQuizzes() {
      setIsLoading(true)
      setError(null)
      try {
        const url = currentQuizId
          ? `/api/quiz/questions?exclude=${currentQuizId}`
          : "/api/quiz/questions"
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error("Failed to fetch quizzes")
        }
        const data = await response.json()
        setQuizzes(data.quizzes)
      } catch {
        setError("Failed to load quizzes. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }
    fetchQuizzes()
  }, [currentQuizId])

  const handleQuizToggle = (quizId: string) => {
    setSelectedQuizIds(toggleSetItem(selectedQuizIds, quizId))
  }

  const handleNextStep = () => {
    setSelectedQuestionKeys(getAllQuestionKeys(quizzes, selectedQuizIds))
    setStep(2)
  }

  const handleQuestionToggle = (quizId: string, questionIndex: number) => {
    const key = getQuestionKey(quizId, questionIndex)
    setSelectedQuestionKeys(toggleSetItem(selectedQuestionKeys, key))
  }

  const handleSelectAll = () => {
    setSelectedQuestionKeys(getAllQuestionKeys(quizzes, selectedQuizIds))
  }

  const handleDeselectAll = () => {
    setSelectedQuestionKeys(new Set())
  }

  const handleImport = () => {
    const importedQuestions: Question[] = []

    for (const quiz of selectedQuizzes) {
      for (let qIndex = 0; qIndex < quiz.questions.length; qIndex++) {
        const key = getQuestionKey(quiz.id, qIndex)
        if (!selectedQuestionKeys.has(key)) continue

        const q = quiz.questions[qIndex]
        importedQuestions.push({
          questionText: q.questionText,
          order: importedQuestions.length,
          marks: q.marks,
          options: q.options.map((opt) => ({
            optionText: opt.optionText,
            isCorrect: opt.isCorrect,
            order: opt.order,
          })),
        })
      }
    }

    onQuestionsImported(importedQuestions)
    onClose()
  }

  const selectedQuizzes = quizzes.filter((quiz) => selectedQuizIds.has(quiz.id))
  const totalQuestionsAvailable = selectedQuizzes.reduce(
    (sum, quiz) => sum + quiz.questions.length,
    0
  )

  return (
    <Modal open={true} onClose={onClose} size="lg">
      <ModalHeader>
        <ModalTitle>
          {step === 1 ? "Select Quizzes" : "Select Questions"}
        </ModalTitle>
        <ModalClose onClose={onClose} />
      </ModalHeader>

      <ModalBody className="max-h-[60vh]">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-3 text-slate-500">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Loading quizzes...
            </div>
          </div>
        ) : error ? (
          <div className="text-red-600 text-center py-16">{error}</div>
        ) : quizzes.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-slate-500">
              No other quizzes found. Create more quizzes to import questions from them.
            </p>
          </div>
        ) : step === 1 ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-600 mb-4">
              Select one or more quizzes to import questions from:
            </p>
            {quizzes.map((quiz) => (
              <label
                key={quiz.id}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-150 ${
                  selectedQuizIds.has(quiz.id)
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <Checkbox
                  checked={selectedQuizIds.has(quiz.id)}
                  onChange={() => handleQuizToggle(quiz.id)}
                />
                <div className="flex-1">
                  <div className="font-medium text-slate-900">{quiz.title}</div>
                  <div className="text-sm text-slate-500">
                    {quiz.questions.length} question{quiz.questions.length !== 1 ? "s" : ""}
                  </div>
                </div>
              </label>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between sticky top-0 bg-white py-2 -mt-2 border-b border-slate-100">
              <p className="text-sm text-slate-600">
                {selectedQuestionKeys.size} of {totalQuestionsAvailable} questions selected
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDeselectAll}
                >
                  Deselect All
                </Button>
              </div>
            </div>

            {selectedQuizzes.map((quiz) => (
              <div key={quiz.id} className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                  <h3 className="font-medium text-slate-900">{quiz.title}</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {quiz.questions.map((question, qIndex) => {
                    const key = getQuestionKey(quiz.id, qIndex)
                    return (
                      <label
                        key={key}
                        className={`flex items-start gap-3 p-4 cursor-pointer transition-colors ${
                          selectedQuestionKeys.has(key) ? "bg-blue-50" : "hover:bg-slate-50"
                        }`}
                      >
                        <Checkbox
                          checked={selectedQuestionKeys.has(key)}
                          onChange={() => handleQuestionToggle(quiz.id, qIndex)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-slate-900 break-words">
                            {question.questionText}
                          </div>
                          <div className="mt-2 flex items-center gap-3 text-sm text-slate-500">
                            <span>{question.marks} mark{question.marks !== 1 ? "s" : ""}</span>
                            <span>{question.options.length} options</span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {question.options.map((opt, optIndex) => (
                              <Badge
                                key={optIndex}
                                variant={opt.isCorrect ? "success" : "default"}
                              >
                                {opt.optionText.length > 25
                                  ? opt.optionText.substring(0, 25) + "..."
                                  : opt.optionText}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </ModalBody>

      <ModalFooter className="justify-between">
        {step === 2 && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep(1)}
          >
            Back
          </Button>
        )}
        <div className="flex gap-3 ml-auto">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          {step === 1 ? (
            <Button
              type="button"
              onClick={handleNextStep}
              disabled={selectedQuizIds.size === 0}
            >
              Next
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleImport}
              disabled={selectedQuestionKeys.size === 0}
            >
              Import {selectedQuestionKeys.size} Question{selectedQuestionKeys.size !== 1 ? "s" : ""}
            </Button>
          )}
        </div>
      </ModalFooter>
    </Modal>
  )
}
