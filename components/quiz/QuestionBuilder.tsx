"use client"

import { useRef, useEffect, useCallback } from "react"
import { Card, Input, Label, Button } from "@/components/ui"

export interface QuestionOption {
  optionText: string
  isCorrect: boolean
  order: number
}

export interface Question {
  questionText: string
  order: number
  marks: number
  options: QuestionOption[]
}

interface QuestionBuilderProps {
  question: Question
  questionIndex: number
  onUpdate: (index: number, question: Question) => void
  onDelete: (index: number) => void
  onDuplicate: (index: number) => void
}

export default function QuestionBuilder({
  question,
  questionIndex,
  onUpdate,
  onDelete,
  onDuplicate,
}: QuestionBuilderProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const autoResize = useCallback(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = "auto"
      el.style.height = el.scrollHeight + "px"
    }
  }, [])

  useEffect(() => {
    autoResize()
  }, [question.questionText, autoResize])

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

  const handleMarksChange = (marks: number) => {
    onUpdate(questionIndex, { ...question, marks: Math.max(1, marks) })
  }

  return (
    <Card padding="none" className="overflow-hidden !border-0 !shadow-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 bg-slate-50/80 border-b border-slate-100">
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <span className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-600 text-white rounded-md flex items-center justify-center text-[10px] sm:text-xs font-bold">
            {questionIndex + 1}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">Marks</span>
            <Input
              type="number"
              value={question.marks}
              onChange={(e) => handleMarksChange(parseInt(e.target.value) || 1)}
              className="w-14 !py-1 !px-2 text-center !text-sm !border-slate-200"
              min="1"
            />
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => onDuplicate(questionIndex)}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-md transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onDelete(questionIndex)}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-5 py-4 space-y-4">
        {/* Question Text */}
        <textarea
          ref={textareaRef}
          value={question.questionText}
          onChange={(e) => handleQuestionTextChange(e.target.value)}
          onInput={autoResize}
          placeholder="Enter your question..."
          className="w-full text-base font-medium border-0 border-b border-slate-200 rounded-none px-0 py-2 focus:border-blue-500 focus:ring-0 bg-transparent placeholder:text-slate-300 resize-none overflow-hidden outline-none"
          rows={1}
          required
        />

        {/* Options */}
        <div className="space-y-1.5">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">Options</span>
          <div className="space-y-1">
            {question.options.map((option, optIndex) => (
              <label
                key={optIndex}
                className={`flex items-center gap-1.5 sm:gap-3 px-1 py-2.5 sm:-mx-1 sm:px-3 rounded-lg cursor-pointer transition-all duration-150 group ${
                  option.isCorrect
                    ? "bg-emerald-50"
                    : "hover:bg-slate-50"
                }`}
              >
                <div className={`flex-shrink-0 w-3 h-3 sm:w-[18px] sm:h-[18px] rounded-full border-[1.5px] sm:border-2 flex items-center justify-center transition-colors ${
                  option.isCorrect
                    ? "border-emerald-500 bg-emerald-500"
                    : "border-slate-300 group-hover:border-slate-400"
                }`}
                >
                  {option.isCorrect && (
                    <svg className="w-2 h-2 sm:w-3 sm:h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <input
                  type="radio"
                  name={`correct-answer-${questionIndex}`}
                  checked={option.isCorrect}
                  onChange={() => handleCorrectAnswerChange(optIndex)}
                  className="sr-only"
                  required
                />
                <span className={`hidden sm:inline flex-shrink-0 text-xs font-medium sm:w-5 text-center ${option.isCorrect ? "text-emerald-600" : "text-slate-400"}`}>
                  {String.fromCharCode(65 + optIndex)}
                </span>
                <input
                  type="text"
                  value={option.optionText}
                  onChange={(e) => handleOptionChange(optIndex, e.target.value)}
                  placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                  className="flex-1 bg-transparent border-0 outline-none text-base font-medium text-slate-700 placeholder:text-slate-300 py-0.5"
                  required
                />
                {option.isCorrect && (
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded uppercase tracking-wide flex-shrink-0">
                    Correct
                  </span>
                )}
              </label>
            ))}
          </div>
          {!question.options.some(opt => opt.isCorrect) && (
            <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Select a correct answer
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}
