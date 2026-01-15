import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import * as XLSX from "xlsx"

// GET /api/quiz/[quizId]/export - Export quiz submissions as Excel
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { quizId } = await params

    // Fetch quiz with submissions
    const quiz = await prisma.quiz.findUnique({
      where: {
        id: quizId,
        creatorId: session.user.id,
      },
      include: {
        submissions: {
          orderBy: {
            submittedAt: "desc",
          },
        },
      },
    })

    if (!quiz) {
      return NextResponse.json(
        { error: "Quiz not found" },
        { status: 404 }
      )
    }

    // Parse participant fields to get column headers
    let participantFieldLabels: string[] = []
    try {
      const fields = JSON.parse(quiz.participantFields || "[]")
      participantFieldLabels = fields.map((f: { label: string }) => f.label)
    } catch {
      participantFieldLabels = []
    }

    // Build Excel data
    const rows = quiz.submissions.map((submission, index) => {
      // Parse participant data
      let participantData: Record<string, string> = {}
      try {
        participantData = JSON.parse(submission.participantData || "{}")
      } catch {
        participantData = {}
      }

      // Build row with rank and participant fields first
      const row: Record<string, string | number> = {
        "Rank": index + 1,
      }

      // Add participant field columns
      participantFieldLabels.forEach((label) => {
        row[label] = participantData[label] || ""
      })

      // If no participant fields defined, add a generic "Participant" column
      if (participantFieldLabels.length === 0) {
        const values = Object.values(participantData).filter(Boolean)
        row["Participant"] = values.length > 0 ? values.join(", ") : "Anonymous"
      }

      // Add score and time columns
      row["Score (%)"] = Math.round(submission.percentage)
      row["Correct Answers"] = submission.score
      row["Total Questions"] = submission.totalQuestions
      row["Time Spent (seconds)"] = submission.timeSpentSeconds || "N/A"
      row["Submitted At"] = new Date(submission.submittedAt).toLocaleString()

      return row
    })

    // Create workbook
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(rows)

    // Auto-size columns
    const columnWidths = Object.keys(rows[0] || {}).map((key) => ({
      wch: Math.max(key.length, 15),
    }))
    worksheet["!cols"] = columnWidths

    XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions")

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

    // Create filename
    const safeTitle = quiz.title.replace(/[^a-z0-9]/gi, "_").substring(0, 50)
    const filename = `${safeTitle}_submissions_${new Date().toISOString().split("T")[0]}.xlsx`

    // Return file
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json(
      { error: "Failed to export submissions" },
      { status: 500 }
    )
  }
}
