import { Metadata } from "next"
import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import QuizTaker from "@/components/quiz/QuizTaker"
import QuizAvailabilityMessage from "@/components/quiz/QuizAvailabilityMessage"
import { safeJsonParse } from "@/lib/utils/parsing"
import { getVisitorIp } from "@/lib/utils/request"
import { Card } from "@/components/ui"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ shareId: string }>
}): Promise<Metadata> {
  const { shareId } = await params

  const quiz = await prisma.quiz.findUnique({
    where: { shareId, isPublished: true },
    select: { title: true, description: true },
  })

  if (!quiz) {
    return { title: "Quiz Not Found" }
  }

  const description = quiz.description || `Take the "${quiz.title}" quiz now!`
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  return {
    title: quiz.title,
    description,
    openGraph: {
      title: quiz.title,
      description,
      type: "website",
      url: `${baseUrl}/take/${shareId}`,
      siteName: "QuizDesk",
    },
    twitter: {
      card: "summary",
      title: quiz.title,
      description,
    },
  }
}

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

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

  // Get visitor's IP address for attempt limiting
  const visitorIp = await getVisitorIp()

  // Check if IP limit is exceeded
  if (quiz.maxAttemptsPerIp && quiz.maxAttemptsPerIp > 0) {
    const existingSubmissions = await prisma.submission.count({
      where: {
        quizId: quiz.id,
        ipAddress: visitorIp,
      },
    })

    if (existingSubmissions >= quiz.maxAttemptsPerIp) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-12 flex items-center justify-center">
          <div className="max-w-md mx-auto px-4">
            <Card padding="lg" className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-slate-900 mb-2">Attempt Limit Reached</h1>
              <p className="text-slate-600">
                You have already submitted this quiz {existingSubmissions} time{existingSubmissions !== 1 ? "s" : ""}.
                The maximum allowed attempts from your location is {quiz.maxAttemptsPerIp}.
              </p>
            </Card>
          </div>
        </div>
      )
    }
  }

  // Check if quiz is within availability window
  const now = new Date()
  const availableFromDate = quiz.availableFrom ? new Date(quiz.availableFrom) : null
  const availableUntilDate = quiz.availableUntil ? new Date(quiz.availableUntil) : null

  const isBeforeStart = availableFromDate && availableFromDate > now
  const isAfterEnd = availableUntilDate && availableUntilDate < now
  const isAvailable = !isBeforeStart && !isAfterEnd

  if (!isAvailable) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-12 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          {isBeforeStart && quiz.availableFrom && (
            <QuizAvailabilityMessage
              type="notStarted"
              dateISO={quiz.availableFrom.toISOString()}
            />
          )}
          {isAfterEnd && quiz.availableUntil && (
            <QuizAvailabilityMessage
              type="closed"
              dateISO={quiz.availableUntil.toISOString()}
            />
          )}
        </div>
      </div>
    )
  }

  // Parse participantFields from JSON string
  const parsedFields = safeJsonParse(quiz.participantFields, [])

  // Apply randomization if enabled
  let processedQuestions = quiz.questions

  // Shuffle questions if enabled
  if (quiz.randomizeQuestions) {
    processedQuestions = shuffleArray(processedQuestions)
  }

  // Shuffle options for each question if enabled
  if (quiz.randomizeOptions) {
    processedQuestions = processedQuestions.map((q) => ({
      ...q,
      options: shuffleArray(q.options),
    }))
  }

  const quizWithParsedFields = {
    ...quiz,
    participantFields: parsedFields,
    questions: processedQuestions,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <QuizTaker quiz={quizWithParsedFields} visitorIp={visitorIp} />
      </div>
    </div>
  )
}
