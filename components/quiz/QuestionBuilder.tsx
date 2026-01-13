"use client"

import { useState } from "react"

export interface QuestionOption {
  optionText: string
  isCorrect: boolean
  order: number
}

export interface Question {
  questionText: string
  order: number
  options: QuestionOption[]
}

interface QuestionBuilderProps {
  question: Question
  questionIndex: number
  onUpdate: (index: number, question: Question) => void
  onDelete: (index: number) => void
}

export default function QuestionBuilder({
  question,
  questionIndex,
  onUpdate,
  onDelete,
}: QuestionBuilderProps) {
  const handleQuestionTextChange = (text: string) => {
    onUpdate(questionIndex, { ...question, questionText: text })
  }

  const handleOptionChange = (optionIndex: number, text: string) => {
    const newOptions = [...question.options]
    newOptions[optionIndex] = { ...newOptions[optionIndex], optionText: text }
    onUpdate(questionIndex, { ...question, options: newOptions })
  }

  const handleCorrectAnswerChange = (optionIndex: number) => {
    const newOptions = question.options.map((opt, idx) => ({
      ...opt,
      isCorrect: idx === optionIndex,
    }))
    onUpdate(questionIndex, { ...question, options: newOptions })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Question {questionIndex + 1}
        </h3>
        <button
          type="button"
          onClick={() => onDelete(questionIndex)}
          className="text-red-600 hover:text-red-700 text-sm font-medium"
        >
          Delete
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Question Text
          </label>
          <input
            type="text"
            value={question.questionText}
            onChange={(e) => handleQuestionTextChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your question"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Answer Options (select the correct one)
          </label>
          <div className="space-y-2">
            {question.options.map((option, optIndex) => (
              <div key={optIndex} className="flex items-center gap-3">
                <input
                  type="radio"
                  name={`correct-answer-${questionIndex}`}
                  checked={option.isCorrect}
                  onChange={() => handleCorrectAnswerChange(optIndex)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  required
                />
                <input
                  type="text"
                  value={option.optionText}
                  onChange={(e) => handleOptionChange(optIndex, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`Option ${optIndex + 1}`}
                  required
                />
              </div>
            ))}
          </div>
          {!question.options.some(opt => opt.isCorrect) && (
            <p className="mt-2 text-sm text-red-600">
              Please select a correct answer
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
