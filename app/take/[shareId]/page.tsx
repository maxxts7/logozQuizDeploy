import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import QuizTaker from "@/components/quiz/QuizTaker"

export default async function TakeQuizPage({
  params,
}: {
  params: Promise<{ shareId: string }>
}) {
  const { shareId } = await params

  const quiz = await prisma.quiz.findUnique({
    where: {
      shareId,
      isPublished: true,
    },
    include: {
      questions: {
        orderBy: {
          order: "asc",
        },
        include: {
          options: {
            orderBy: {
              order: "asc",
            },
            select: {
              id: true,
              optionText: true,
              order: true,
            },
          },
        },
      },
    },
  })

  if (!quiz) {
    notFound()
  }

  // Check if quiz is within availability window
  const now = new Date()
  const isAvailable =
    (!quiz.availableFrom || new Date(quiz.availableFrom) <= now) &&
    (!quiz.availableUntil || new Date(quiz.availableUntil) >= now)

  if (!isAvailable) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Quiz Not Available</h1>
            {quiz.availableFrom && new Date(quiz.availableFrom) > now && (
              <p className="text-gray-600">
                This quiz will be available from{" "}
                <strong>{new Date(quiz.availableFrom).toLocaleString()}</strong>
              </p>
            )}
            {quiz.availableUntil && new Date(quiz.availableUntil) < now && (
              <p className="text-gray-600">
                This quiz closed on{" "}
                <strong>{new Date(quiz.availableUntil).toLocaleString()}</strong>
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <QuizTaker quiz={quiz} />
      </div>
    </div>
  )
}
