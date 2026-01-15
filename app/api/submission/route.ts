import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// POST /api/submission - Submit quiz answers
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { quizId, participantData, timeSpentSeconds, answers } = body

    if (!quizId || !answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: "Quiz ID and answers are required" },
        { status: 400 }
      )
    }

    // Fetch quiz with correct answers and marks
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

    // Fetch full question and option details for review
    const quizWithDetails = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: {
            options: true,
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    })

    // Calculate score based on marks
    let earnedMarks = 0
    let totalMarks = 0
    const totalQuestions = quiz.questions.length

    const answerRecords = answers.map((answer: { questionId: string; selectedOptionId: string }) => {
      const question = quizWithDetails?.questions.find((q) => q.id === answer.questionId)
      if (!question) return null

      const questionMarks = question.marks || 1
      totalMarks += questionMarks

      const selectedOption = question.options.find((opt) => opt.id === answer.selectedOptionId)
      const isCorrect = selectedOption?.isCorrect || false

      if (isCorrect) {
        earnedMarks += questionMarks
      }

      return {
        questionId: answer.questionId,
        selectedOptionId: answer.selectedOptionId,
        isCorrect,
      }
    }).filter((record) => record !== null)

    // Add marks for unanswered questions to total
    const answeredQuestionIds = answers.map((a: { questionId: string }) => a.questionId)
    quizWithDetails?.questions.forEach((q) => {
      if (!answeredQuestionIds.includes(q.id)) {
        totalMarks += q.marks || 1
      }
    })

    // Build detailed review data
    const reviewData = quizWithDetails?.questions.map((question) => {
      const participantAnswer = answers.find((a: { questionId: string }) => a.questionId === question.id)
      const correctOption = question.options.find((opt) => opt.isCorrect)

      return {
        questionId: question.id,
        questionText: question.questionText,
        marks: question.marks || 1,
        options: question.options.map((opt) => ({
          id: opt.id,
          optionText: opt.optionText,
          isCorrect: opt.isCorrect,
        })),
        selectedOptionId: participantAnswer?.selectedOptionId || null,
        correctOptionId: correctOption?.id || null,
        isCorrect: participantAnswer?.selectedOptionId === correctOption?.id,
      }
    }) || []

    const percentage = totalMarks > 0 ? (earnedMarks / totalMarks) * 100 : 0

    // Save submission
    const submission = await prisma.submission.create({
      data: {
        quizId,
        participantData: JSON.stringify(participantData || {}),
        score: earnedMarks,
        totalMarks,
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
        earnedMarks,
        totalMarks,
        review: reviewData,
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
