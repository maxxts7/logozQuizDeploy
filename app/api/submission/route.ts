import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

interface SubmittedAnswer {
  questionId: string
  selectedOptionId: string
}

interface QuestionWithOptions {
  id: string
  questionText: string
  marks: number
  options: { id: string; optionText: string; isCorrect: boolean }[]
}

interface ScoreResult {
  earnedMarks: number
  totalMarks: number
  answerRecords: { questionId: string; selectedOptionId: string; isCorrect: boolean }[]
}

function calculateScore(questions: QuestionWithOptions[], answers: SubmittedAnswer[]): ScoreResult {
  const answeredIds = new Set(answers.map((a) => a.questionId))
  let earnedMarks = 0
  let totalMarks = 0
  const answerRecords: ScoreResult["answerRecords"] = []

  for (const question of questions) {
    const questionMarks = question.marks || 1
    totalMarks += questionMarks

    const answer = answers.find((a) => a.questionId === question.id)
    if (!answer) continue

    const selectedOption = question.options.find((opt) => opt.id === answer.selectedOptionId)
    const isCorrect = selectedOption?.isCorrect ?? false

    if (isCorrect) {
      earnedMarks += questionMarks
    }

    answerRecords.push({
      questionId: answer.questionId,
      selectedOptionId: answer.selectedOptionId,
      isCorrect,
    })
  }

  return { earnedMarks, totalMarks, answerRecords }
}

function buildReviewData(
  questions: QuestionWithOptions[],
  answers: SubmittedAnswer[],
  hideCorrectAnswers: boolean
) {
  return questions.map((question) => {
    const participantAnswer = answers.find((a) => a.questionId === question.id)
    const correctOption = question.options.find((opt) => opt.isCorrect)
    const isCorrect = participantAnswer?.selectedOptionId === correctOption?.id

    return {
      questionId: question.id,
      questionText: question.questionText,
      marks: question.marks || 1,
      options: question.options.map((opt) => ({
        id: opt.id,
        optionText: opt.optionText,
        isCorrect: hideCorrectAnswers ? false : opt.isCorrect,
      })),
      selectedOptionId: participantAnswer?.selectedOptionId ?? null,
      correctOptionId: hideCorrectAnswers ? null : (correctOption?.id ?? null),
      isCorrect,
    }
  })
}

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

    const totalQuestions = quiz.questions.length
    const { earnedMarks, totalMarks, answerRecords } = calculateScore(quiz.questions, answers)

    const now = new Date()
    const shouldHideCorrectAnswers = quiz.showAnswersAfter
      ? new Date(quiz.showAnswersAfter) > now
      : false

    const reviewData = buildReviewData(quiz.questions, answers, shouldHideCorrectAnswers)
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
