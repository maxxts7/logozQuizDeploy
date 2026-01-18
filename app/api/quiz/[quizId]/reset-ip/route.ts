import { NextRequest, NextResponse } from "next/server"
import { verifyQuizOwnership } from "@/lib/utils/quiz"
import { prisma } from "@/lib/db"

// POST /api/quiz/[quizId]/reset-ip - Reset attempts for a specific IP
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params

    // Verify ownership
    const ownershipCheck = await verifyQuizOwnership(quizId)
    if (!ownershipCheck.success) {
      return ownershipCheck.response
    }

    const body = await req.json()
    const { ipAddress } = body

    if (!ipAddress || typeof ipAddress !== "string") {
      return NextResponse.json(
        { error: "IP address is required" },
        { status: 400 }
      )
    }

    // Delete all submissions from this IP for this quiz
    const result = await prisma.submission.deleteMany({
      where: {
        quizId,
        ipAddress,
      },
    })

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
    })
  } catch (error) {
    console.error("Error resetting IP attempts:", error)
    return NextResponse.json(
      { error: "Failed to reset IP attempts" },
      { status: 500 }
    )
  }
}
