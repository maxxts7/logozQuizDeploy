"use client"

import { useRef, useState } from "react"
import * as XLSX from "xlsx"
import { Question } from "./QuestionBuilder"
import { Button, Card, Alert } from "@/components/ui"

interface ExcelUploaderProps {
  onQuestionsImported: (questions: Question[]) => void
}

const ANSWER_INDICATORS = ["1", "2", "3", "4", "A", "B", "C", "D"]

const ANSWER_INDEX_MAP: Record<string, number> = {
  "1": 0, "A": 0,
  "2": 1, "B": 1,
  "3": 2, "C": 2,
  "4": 3, "D": 3,
}

function isAnswerIndicator(value: string): boolean {
  return ANSWER_INDICATORS.includes(value.toUpperCase())
}

function getAnswerIndex(indicator: string): number {
  return ANSWER_INDEX_MAP[indicator.toUpperCase()] ?? 0
}

function buildOptions(
  row: (string | number)[],
  startCol: number,
  endCol: number,
  correctIndex: number
): { optionText: string; isCorrect: boolean; order: number }[] {
  const options: { optionText: string; isCorrect: boolean; order: number }[] = []
  for (let j = startCol; j < endCol; j++) {
    const optionText = String(row[j] || "").trim()
    if (optionText) {
      options.push({
        optionText,
        isCorrect: options.length === correctIndex,
        order: options.length,
      })
    }
  }
  return options
}

export default function ExcelUploader({ onQuestionsImported }: ExcelUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setIsProcessing(true)

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: "array" })

      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]

      const rows = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
      }) as unknown as (string | number)[][]

      let startRow = 0
      if (rows.length > 0) {
        const firstCell = String(rows[0][0]).toLowerCase()
        if (
          firstCell.includes("question") ||
          firstCell.includes("text") ||
          firstCell === "q" ||
          firstCell === "#"
        ) {
          startRow = 1
        }
      }

      const questions: Question[] = []

      for (let i = startRow; i < rows.length; i++) {
        const row = rows[i]
        if (!row || row.length < 3) continue

        const questionText = String(row[0] || "").trim()
        if (!questionText) continue

        const lastCol = String(row[row.length - 1]).trim()
        const secondLastCol = row.length > 1 ? String(row[row.length - 2]).trim().toUpperCase() : ""
        const lastColNum = parseInt(lastCol)
        const hasMarksColumn = !isNaN(lastColNum) && lastColNum > 0 && isAnswerIndicator(secondLastCol)
        const hasAnswerIndicator = isAnswerIndicator(lastCol.toUpperCase())

        let marks = 1
        let options: { optionText: string; isCorrect: boolean; order: number }[]

        if (hasMarksColumn) {
          marks = lastColNum
          const correctIndex = getAnswerIndex(secondLastCol)
          options = buildOptions(row, 1, row.length - 2, correctIndex)
        } else if (hasAnswerIndicator) {
          const correctIndex = getAnswerIndex(lastCol)
          options = buildOptions(row, 1, row.length - 1, correctIndex)
        } else {
          options = buildOptions(row, 1, row.length, 0)
        }

        if (options.length >= 2) {
          if (!options.some(opt => opt.isCorrect) && options.length > 0) {
            options[0].isCorrect = true
          }

          questions.push({
            questionText,
            order: questions.length,
            marks,
            options,
          })
        }
      }

      if (questions.length === 0) {
        setError("No valid questions found in the file. Please check the format.")
        return
      }

      onQuestionsImported(questions)

      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (err) {
      console.error("Error parsing Excel file:", err)
      setError("Failed to parse the Excel file. Please check the format.")
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadTemplate = () => {
    const templateData = [
      ["Question", "Option A", "Option B", "Option C", "Option D", "Correct Answer", "Marks"],
      ["What is the capital of France?", "London", "Paris", "Berlin", "Madrid", "B", 1],
      ["Which planet is closest to the Sun?", "Venus", "Mercury", "Mars", "Earth", "B", 2],
      ["What is 2 + 2?", "3", "4", "5", "6", "B", 1],
    ]

    const worksheet = XLSX.utils.aoa_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Questions")

    worksheet["!cols"] = [
      { wch: 40 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 15 },
      { wch: 10 },
    ]

    XLSX.writeFile(workbook, "quiz_template.xlsx")
  }

  return (
    <Card className="border-2 border-dashed border-slate-300 text-center">
      <div className="mb-4">
        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto">
          <svg
            className="w-6 h-6 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>
      </div>

      <p className="text-sm text-slate-600 mb-4">
        Upload an Excel file (.xlsx, .xls) with your questions
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
            disabled={isProcessing}
          />
          <Button
            type="button"
            isLoading={isProcessing}
            onClick={() => fileInputRef.current?.click()}
          >
            {isProcessing ? "Processing..." : "Choose File"}
          </Button>
        </label>

        <Button
          type="button"
          variant="secondary"
          onClick={downloadTemplate}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download Template
        </Button>
      </div>

      {error && (
        <div className="mt-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-slate-200">
        <p className="text-xs font-medium text-slate-500 mb-2">Expected format:</p>
        <div className="text-xs text-slate-400 space-y-0.5">
          <p>Column A: Question text</p>
          <p>Columns B-E: Answer options</p>
          <p>Next column: Correct answer (A, B, C, D or 1, 2, 3, 4)</p>
          <p>Last column (optional): Marks (default: 1)</p>
        </div>
      </div>
    </Card>
  )
}
