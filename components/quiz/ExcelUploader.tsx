"use client"

import { useRef, useState } from "react"
import * as XLSX from "xlsx"
import { Question } from "./QuestionBuilder"

interface ExcelUploaderProps {
  onQuestionsImported: (questions: Question[]) => void
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

      // Get the first sheet
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]

      // Convert to JSON (header: 1 returns array of arrays)
      const rows = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
      }) as unknown as (string | number)[][]

      // Skip header row if it looks like headers
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
        if (!row || row.length < 3) continue // Need at least question + 2 options

        const questionText = String(row[0] || "").trim()
        if (!questionText) continue

        // Get options (columns B, C, D, E, etc.)
        const options: { optionText: string; isCorrect: boolean; order: number }[] = []
        let correctAnswerIndex = -1

        // Check if last column is the correct answer indicator
        const lastCol = row[row.length - 1]
        const lastColStr = String(lastCol).trim().toUpperCase()

        // Check for marks column (last column if it's a number > 0)
        let marks = 1
        let endCol = row.length

        // Check if last column is marks (a positive number)
        const lastColNum = parseInt(String(lastCol))
        const secondLastCol = row.length > 1 ? String(row[row.length - 2]).trim().toUpperCase() : ""

        if (!isNaN(lastColNum) && lastColNum > 0 && ["A", "B", "C", "D", "1", "2", "3", "4"].includes(secondLastCol)) {
          // Last column is marks, second-to-last is correct answer
          marks = lastColNum
          endCol = row.length - 1
          const answerMap: Record<string, number> = {
            "1": 0, "A": 0,
            "2": 1, "B": 1,
            "3": 2, "C": 2,
            "4": 3, "D": 3,
          }
          correctAnswerIndex = answerMap[secondLastCol] ?? 0

          // Options are columns 1 to third-to-last
          for (let j = 1; j < endCol - 1; j++) {
            const optionText = String(row[j] || "").trim()
            if (optionText) {
              options.push({
                optionText,
                isCorrect: options.length === correctAnswerIndex,
                order: options.length,
              })
            }
          }
        } else if (["1", "2", "3", "4", "A", "B", "C", "D"].includes(lastColStr)) {
          // Last column is the answer indicator (no marks column)
          const answerMap: Record<string, number> = {
            "1": 0, "A": 0,
            "2": 1, "B": 1,
            "3": 2, "C": 2,
            "4": 3, "D": 3,
          }
          correctAnswerIndex = answerMap[lastColStr] ?? 0

          // Options are columns 1 to second-to-last
          for (let j = 1; j < row.length - 1; j++) {
            const optionText = String(row[j] || "").trim()
            if (optionText) {
              options.push({
                optionText,
                isCorrect: options.length === correctAnswerIndex,
                order: options.length,
              })
            }
          }
        } else {
          // No answer indicator - assume first option is correct
          for (let j = 1; j < row.length; j++) {
            const optionText = String(row[j] || "").trim()
            if (optionText) {
              options.push({
                optionText,
                isCorrect: options.length === 0, // First option is correct
                order: options.length,
              })
            }
          }
        }

        if (options.length >= 2) {
          // Ensure at least one correct answer
          const hasCorrect = options.some(opt => opt.isCorrect)
          if (!hasCorrect && options.length > 0) {
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

      // Reset file input
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

    // Set column widths
    worksheet["!cols"] = [
      { wch: 40 }, // Question
      { wch: 20 }, // Option A
      { wch: 20 }, // Option B
      { wch: 20 }, // Option C
      { wch: 20 }, // Option D
      { wch: 15 }, // Correct Answer
      { wch: 10 }, // Marks
    ]

    XLSX.writeFile(workbook, "quiz_template.xlsx")
  }

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
      <div className="mb-4">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
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

      <p className="text-sm text-gray-600 mb-4">
        Upload an Excel file (.xlsx, .xls) with your questions
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <label className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 inline-flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
            disabled={isProcessing}
          />
          {isProcessing ? "Processing..." : "Choose File"}
        </label>

        <button
          type="button"
          onClick={downloadTemplate}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 inline-flex items-center gap-2"
        >
          Download Template
        </button>
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-600">{error}</p>
      )}

      <div className="mt-4 text-xs text-gray-500">
        <p className="font-medium mb-1">Expected format:</p>
        <p>Column A: Question text</p>
        <p>Columns B-E: Answer options</p>
        <p>Next column: Correct answer (A, B, C, D or 1, 2, 3, 4)</p>
        <p>Last column (optional): Marks (default: 1)</p>
      </div>
    </div>
  )
}
