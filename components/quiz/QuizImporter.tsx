"use client"

import { useState, useEffect } from "react"
import { Question } from "./QuestionBuilder"

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

function toggleSetItem<T>(set: Set<T>, item: T): Set<T> {
  const newSet = new Set(set)
  if (newSet.has(item)) {
    newSet.delete(item)
  } else {
    newSet.add(item)
  }
  return newSet
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
    fetchQuizzes()
  }, [currentQuizId])

  const fetchQuizzes = async () => {
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
    } catch (err) {
      setError("Failed to load quizzes. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {step === 1 ? "Select Quizzes" : "Select Questions"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading quizzes...</div>
            </div>
          ) : error ? (
            <div className="text-red-600 text-center py-12">{error}</div>
          ) : quizzes.length === 0 ? (
            <div className="text-gray-500 text-center py-12">
              No other quizzes found. Create more quizzes to import questions from them.
            </div>
          ) : step === 1 ? (
            /* Step 1: Quiz Selection */
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                Select one or more quizzes to import questions from:
              </p>
              {quizzes.map((quiz) => (
                <label
                  key={quiz.id}
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedQuizIds.has(quiz.id)}
                    onChange={() => handleQuizToggle(quiz.id)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{quiz.title}</div>
                    <div className="text-sm text-gray-500">
                      {quiz.questions.length} question{quiz.questions.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            /* Step 2: Question Selection */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {selectedQuestionKeys.size} of {totalQuestionsAvailable} questions selected
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Select All
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {selectedQuizzes.map((quiz) => (
                <div key={quiz.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <h3 className="font-medium text-gray-900">{quiz.title}</h3>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {quiz.questions.map((question, qIndex) => {
                      const key = getQuestionKey(quiz.id, qIndex)
                      return (
                        <label
                          key={key}
                          className="flex items-start gap-3 p-4 hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedQuestionKeys.has(key)}
                            onChange={() => handleQuestionToggle(quiz.id, qIndex)}
                            className="w-4 h-4 mt-1 text-blue-600 focus:ring-blue-500 rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-gray-900 break-words">
                              {question.questionText}
                            </div>
                            <div className="mt-2 text-sm text-gray-500">
                              <span className="mr-3">{question.marks} mark{question.marks !== 1 ? "s" : ""}</span>
                              <span>{question.options.length} options</span>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {question.options.map((opt, optIndex) => (
                                <span
                                  key={optIndex}
                                  className={`inline-flex items-center px-2 py-1 text-xs rounded ${
                                    opt.isCorrect
                                      ? "bg-green-100 text-green-800"
                                      : "bg-gray-100 text-gray-600"
                                  }`}
                                >
                                  {opt.optionText.length > 30
                                    ? opt.optionText.substring(0, 30) + "..."
                                    : opt.optionText}
                                </span>
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
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          {step === 2 && (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 text-gray-700 font-medium hover:text-gray-900"
            >
              Back
            </button>
          )}
          <div className="flex gap-3 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            {step === 1 ? (
              <button
                type="button"
                onClick={handleNextStep}
                disabled={selectedQuizIds.size === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleImport}
                disabled={selectedQuestionKeys.size === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Import {selectedQuestionKeys.size} Question{selectedQuestionKeys.size !== 1 ? "s" : ""}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
