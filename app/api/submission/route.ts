import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// POST /api/submission - Submit quiz answers
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { quizId, participantName, timeSpentSeconds, answers } = body

    if (!quizId || !answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: "Quiz ID and answers are required" },
        { status: 400 }
      )
    }

    // Fetch quiz with correct answers
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId, isPublished: true },
      include: {
        questions: {
          include: {
            options: {
              select: {
                id: true,
                isCorrect: true,
              },
            },
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

    // Calculate score
    let correctCount = 0
    const totalQuestions = quiz.questions.length

    const answerRecords = answers.map((answer: { questionId: string; selectedOptionId: string }) => {
      const question = quiz.questions.find((q) => q.id === answer.questionId)
      if (!question) return null

      const selectedOption = question.options.find((opt) => opt.id === answer.selectedOptionId)
      const isCorrect = selectedOption?.isCorrect || false

      if (isCorrect) {
        correctCount++
      }

      return {
        questionId: answer.questionId,
        selectedOptionId: answer.selectedOptionId,
        isCorrect,
      }
    }).filter((record) => record !== null)

    const percentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0

    // Save submission
    const submission = await prisma.submission.create({
      data: {
        quizId,
        takerName: participantName || "Anonymous",
        score: correctCount,
        totalQuestions,
        percentage,
        timeSpentSeconds: timeSpentSeconds || null,
        submittedAt: new Date(),
        answers: {
          create: answerRecords,
        },
      },
      include: {
        answers: true,
      },
    })

    return NextResponse.json(
      {
        submissionId: submission.id,
        score: Math.round(percentage),
        total: totalQuestions,
        correctCount,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error submitting quiz:", error)
    return NextResponse.json(
      { error: "Failed to submit quiz" },
      { status: 500 }
    )
  }
}
