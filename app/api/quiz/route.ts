import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { createQuizSchema } from "@/lib/validations/quiz"

// GET /api/quiz - List all quizzes for authenticated user
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const quizzes = await prisma.quiz.findMany({
      where: {
        creatorId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: {
            questions: true,
            submissions: true,
          },
        },
      },
    })

    return NextResponse.json({ quizzes })
  } catch (error) {
    console.error("Get quizzes error:", error)
    return NextResponse.json(
      { error: "Failed to fetch quizzes" },
      { status: 500 }
    )
  }
}

// POST /api/quiz - Create new quiz
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const validated = createQuizSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.issues },
        { status: 400 }
      )
    }

    const { title, description, timeLimitSeconds, availableFrom, availableUntil, isPublished, participantFields, randomizeQuestions, randomizeOptions, questions } = validated.data

    // Create quiz with questions and options
    const quiz = await prisma.quiz.create({
      data: {
        title,
        description: description || null,
        timeLimitSeconds: timeLimitSeconds || null,
        availableFrom: availableFrom ? new Date(availableFrom) : null,
        availableUntil: availableUntil ? new Date(availableUntil) : null,
        isPublished,
        participantFields: JSON.stringify(participantFields || []),
        randomizeQuestions: randomizeQuestions || false,
        randomizeOptions: randomizeOptions || false,
        creatorId: session.user.id,
        questions: {
          create: questions.map((q, qIndex) => ({
            questionText: q.questionText,
            order: qIndex,
            marks: q.marks || 1,
            options: {
              create: q.options.map((opt, optIndex) => ({
                optionText: opt.optionText,
                isCorrect: opt.isCorrect,
                order: optIndex,
              })),
            },
          })),
        },
      },
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

    return NextResponse.json(
      { message: "Quiz created successfully", quiz },
      { status: 201 }
    )
  } catch (error) {
    console.error("Create quiz error:", error)
    return NextResponse.json(
      { error: "Failed to create quiz" },
      { status: 500 }
    )
  }
}
