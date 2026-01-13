import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { updateQuizSchema } from "@/lib/validations/quiz"

// GET /api/quiz/[quizId] - Get single quiz with questions
export async function GET(
  req: NextRequest,
  { params }: { params: { quizId: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const quiz = await prisma.quiz.findUnique({
      where: {
        id: params.quizId,
      },
      include: {
        questions: {
          include: {
            options: {
              orderBy: {
                order: "asc",
              },
            },
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

    // Check if user owns this quiz
    if (quiz.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    return NextResponse.json({ quiz })
  } catch (error) {
    console.error("Get quiz error:", error)
    return NextResponse.json(
      { error: "Failed to fetch quiz" },
      { status: 500 }
    )
  }
}

// PATCH /api/quiz/[quizId] - Update quiz
export async function PATCH(
  req: NextRequest,
  { params }: { params: { quizId: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check if quiz exists and user owns it
    const existingQuiz = await prisma.quiz.findUnique({
      where: { id: params.quizId },
    })

    if (!existingQuiz) {
      return NextResponse.json(
        { error: "Quiz not found" },
        { status: 404 }
      )
    }

    if (existingQuiz.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const validated = updateQuizSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.errors },
        { status: 400 }
      )
    }

    const { title, description, timeLimitSeconds, availableFrom, availableUntil, isPublished, questions } = validated.data

    // If questions are provided, delete old ones and create new ones
    if (questions) {
      await prisma.question.deleteMany({
        where: { quizId: params.quizId },
      })
    }

    const quiz = await prisma.quiz.update({
      where: { id: params.quizId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(timeLimitSeconds !== undefined && { timeLimitSeconds }),
        ...(availableFrom !== undefined && { availableFrom: availableFrom ? new Date(availableFrom) : null }),
        ...(availableUntil !== undefined && { availableUntil: availableUntil ? new Date(availableUntil) : null }),
        ...(isPublished !== undefined && { isPublished }),
        ...(questions && {
          questions: {
            create: questions.map((q, qIndex) => ({
              questionText: q.questionText,
              order: qIndex,
              options: {
                create: q.options.map((opt, optIndex) => ({
                  optionText: opt.optionText,
                  isCorrect: opt.isCorrect,
                  order: optIndex,
                })),
              },
            })),
          },
        }),
      },
      include: {
        questions: {
          include: {
            options: {
              orderBy: {
                order: "asc",
              },
            },
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    })

    return NextResponse.json({ message: "Quiz updated successfully", quiz })
  } catch (error) {
    console.error("Update quiz error:", error)
    return NextResponse.json(
      { error: "Failed to update quiz" },
      { status: 500 }
    )
  }
}

// DELETE /api/quiz/[quizId] - Delete quiz
export async function DELETE(
  req: NextRequest,
  { params }: { params: { quizId: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check if quiz exists and user owns it
    const existingQuiz = await prisma.quiz.findUnique({
      where: { id: params.quizId },
    })

    if (!existingQuiz) {
      return NextResponse.json(
        { error: "Quiz not found" },
        { status: 404 }
      )
    }

    if (existingQuiz.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    // Delete quiz (cascade will delete questions, options, submissions, answers)
    await prisma.quiz.delete({
      where: { id: params.quizId },
    })

    return NextResponse.json({ message: "Quiz deleted successfully" })
  } catch (error) {
    console.error("Delete quiz error:", error)
    return NextResponse.json(
      { error: "Failed to delete quiz" },
      { status: 500 }
    )
  }
}
