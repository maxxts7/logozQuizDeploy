import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// POST /api/submission - Submit quiz answers
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { quizId, participantData, timeSpentSeconds, ipAddress, answers } = body

    if (!quizId || !answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: "Quiz ID and answers are required" },
        { status: 400 }
      )
    }

    // Fetch quiz with full question and option details
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId, isPublished: true },
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

    if (!quiz) {
      return NextResponse.json(
        { error: "Quiz not found" },
        { status: 404 }
      )
    }

    // Calculate score based on marks
    let earnedMarks = 0
    let totalMarks = 0
    const totalQuestions = quiz.questions.length

    const answerRecords = answers.map((answer: { questionId: string; selectedOptionId: string }) => {
      const question = quiz.questions.find((q) => q.id === answer.questionId)
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
    quiz.questions.forEach((q) => {
      if (!answeredQuestionIds.includes(q.id)) {
        totalMarks += q.marks || 1
      }
    })

    // Check if correct answers should be hidden
    const now = new Date()
    const showAnswersAfterDate = quiz.showAnswersAfter ? new Date(quiz.showAnswersAfter) : null
    const shouldHideCorrectAnswers = showAnswersAfterDate && showAnswersAfterDate > now

    // Build detailed review data
    const reviewData = quiz.questions.map((question) => {
      const participantAnswer = answers.find((a: { questionId: string }) => a.questionId === question.id)
      const correctOption = question.options.find((opt) => opt.isCorrect)
      const isCorrect = participantAnswer?.selectedOptionId === correctOption?.id

      return {
        questionId: question.id,
        questionText: question.questionText,
        marks: question.marks || 1,
        options: question.options.map((opt) => ({
          id: opt.id,
          optionText: opt.optionText,
          // Hide isCorrect if answers should be hidden
          isCorrect: shouldHideCorrectAnswers ? false : opt.isCorrect,
        })),
        selectedOptionId: participantAnswer?.selectedOptionId || null,
        // Hide correctOptionId if answers should be hidden
        correctOptionId: shouldHideCorrectAnswers ? null : correctOption?.id || null,
        isCorrect,
      }
    })

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
        ipAddress: ipAddress || null,
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
        answersHidden: shouldHideCorrectAnswers,
        showAnswersAfter: shouldHideCorrectAnswers && quiz.showAnswersAfter ? quiz.showAnswersAfter.toISOString() : null,
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
