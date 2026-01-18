import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

// GET /api/quiz/questions - Returns all quizzes with their questions for the authenticated user
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get exclude parameter to filter out the current quiz being edited
    const { searchParams } = new URL(req.url)
    const excludeId = searchParams.get("exclude")

    const quizzes = await prisma.quiz.findMany({
      where: {
        creatorId: session.user.id,
        ...(excludeId && { id: { not: excludeId } }),
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        questions: {
          select: {
            questionText: true,
            marks: true,
            order: true,
            options: {
              select: {
                optionText: true,
                isCorrect: true,
                order: true,
              },
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

    return NextResponse.json({ quizzes })
  } catch (error) {
    console.error("Get quiz questions error:", error)
    return NextResponse.json(
      { error: "Failed to fetch quiz questions" },
      { status: 500 }
    )
  }
}
