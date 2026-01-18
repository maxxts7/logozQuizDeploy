/**
 * Quiz utilities
 * Helper functions for quiz operations
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

/**
 * Result of quiz ownership verification
 */
export type QuizOwnershipResult =
  | { success: true; quiz: { id: string; creatorId: string }; userId: string }
  | { success: false; response: NextResponse }

/**
 * Verifies that the current user is authenticated and owns the specified quiz
 * Returns either the quiz and userId, or an error response
 * @param quizId - The quiz ID to check ownership for
 * @returns QuizOwnershipResult with either quiz data or error response
 */
export async function verifyQuizOwnership(quizId: string): Promise<QuizOwnershipResult> {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    }
  }

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { id: true, creatorId: true },
  })

  if (!quiz) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Quiz not found" },
        { status: 404 }
      ),
    }
  }

  if (quiz.creatorId !== session.user.id) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      ),
    }
  }

  return {
    success: true,
    quiz,
    userId: session.user.id,
  }
}
