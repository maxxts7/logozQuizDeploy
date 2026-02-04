"use client"

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
    <Card>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center text-sm font-semibold">
            {questionIndex + 1}
          </span>
          <h3 className="text-base font-semibold text-slate-900">
            Question {questionIndex + 1}
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {/* Marks */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-600">Marks:</label>
            <Input
              type="number"
              value={question.marks}
              onChange={(e) => handleMarksChange(parseInt(e.target.value) || 1)}
              className="w-16 text-center py-1.5"
              min="1"
            />
          </div>
          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onDuplicate(questionIndex)}
              className="text-slate-500"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onDelete(questionIndex)}
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {/* Question Text */}
        <div>
          <Label>Question Text</Label>
          <Input
            type="text"
            value={question.questionText}
            onChange={(e) => handleQuestionTextChange(e.target.value)}
            placeholder="Enter your question"
            required
          />
        </div>

        {/* Options */}
        <div>
          <Label>Answer Options (select the correct one)</Label>
          <div className="space-y-2.5 mt-2">
            {question.options.map((option, optIndex) => (
              <label
                key={optIndex}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-150 ${
                  option.isCorrect
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name={`correct-answer-${questionIndex}`}
                  checked={option.isCorrect}
                  onChange={() => handleCorrectAnswerChange(optIndex)}
                  className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                  required
                />
                <div className="flex-1 relative">
                  <Input
                    type="text"
                    value={option.optionText}
                    onChange={(e) => handleOptionChange(optIndex, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                    className={`pr-20 ${
                      option.isCorrect
                        ? "border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/20"
                        : ""
                    }`}
                    required
                  />
                  {option.isCorrect && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">
                      Correct
                    </span>
                  )}
                </div>
              </label>
            ))}
          </div>
          {!question.options.some(opt => opt.isCorrect) && (
            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Please select a correct answer
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}
