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
    select: { title: true, description: true, coverImage: true },
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
      images: quiz.coverImage ? [{ url: quiz.coverImage, width: 1200, height: 630 }] : [],
    },
    twitter: {
      card: quiz.coverImage ? "summary_large_image" : "summary",
      title: quiz.title,
      description,
      images: quiz.coverImage ? [quiz.coverImage] : [],
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

  // Check if answers are now available (showAnswersAfter has passed)
  const answersAvailable = quiz.showAnswersAfter && new Date(quiz.showAnswersAfter) <= new Date()

  // Check if IP limit is exceeded (but allow retakes if answers are available)
  if (quiz.maxAttemptsPerIp && quiz.maxAttemptsPerIp > 0 && !answersAvailable) {
    const existingSubmissions = await prisma.submission.count({
      where: {
        quizId: quiz.id,
        ipAddress: visitorIp,
      },
    })

    if (existingSubmissions >= quiz.maxAttemptsPerIp) {
      // Query last attempt with answers to display
      const lastSubmission = await prisma.submission.findFirst({
        where: { quizId: quiz.id, ipAddress: visitorIp },
        include: {
          answers: true,
          quiz: {
            include: {
              questions: {
                orderBy: { order: "asc" },
                include: {
                  options: {
                    orderBy: { order: "asc" },
                  },
                },
              },
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
      })

      const scorePercentage = lastSubmission ? Math.round(lastSubmission.percentage) : 0
      const getScoreGradient = () => {
        if (scorePercentage >= 60) return "from-emerald-500 to-emerald-600"
        return "from-blue-500 to-blue-600"
      }
      const getScoreBg = () => {
        if (scorePercentage >= 60) return "bg-emerald-50"
        return "bg-blue-50"
      }
      const getScoreText = () => {
        if (scorePercentage >= 60) return "text-emerald-600"
        return "text-blue-600"
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-12">
          <div className="max-w-4xl mx-auto px-4">
            <Card padding="none" className="overflow-hidden">
              {/* Header with score-based gradient */}
              <div className={`bg-gradient-to-br ${getScoreGradient()} p-8 text-center text-white`}>
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold mb-1">{quiz.title}</h1>
                <p className="text-white/80">You've completed all {quiz.maxAttemptsPerIp} attempts</p>
              </div>

              {/* Last Attempt Stats */}
              {lastSubmission && (
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-slate-900 text-center mb-4">Your Last Attempt</h2>

                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className={`${getScoreBg()} rounded-xl p-4 text-center`}>
                      <div className={`text-3xl font-bold ${getScoreText()}`}>
                        {scorePercentage}%
                      </div>
                      <div className="text-xs text-slate-500 mt-1">Score</div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-slate-900">
                        {lastSubmission.score}/{lastSubmission.totalMarks}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">Marks</div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-slate-900">
                        {lastSubmission.totalQuestions}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">Questions</div>
                    </div>
                  </div>

                  {/* Show when answers will be available */}
                  {quiz.showAnswersAfter && (
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
                      <p className="text-sm text-amber-800">
                        <span className="font-medium">Correct answers will be available on:</span>
                        <br />
                        {new Date(quiz.showAnswersAfter).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {/* Previous Answers */}
                  <div className="border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-slate-900">Your Answers</h3>
                    </div>
                    <div className="space-y-4 sm:space-y-5">
                      {lastSubmission.quiz.questions.map((question, index) => {
                        const answer = lastSubmission.answers.find((a) => a.questionId === question.id)
                        const isCorrect = answer?.isCorrect ?? false
                        const wasSkipped = !answer?.selectedOptionId
                        const letterLabels = ["A", "B", "C", "D", "E", "F", "G", "H"]

                        return (
                          <div key={question.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100">
                            <div className="flex">
                              <div className={`w-1 flex-shrink-0 ${
                                wasSkipped ? "bg-slate-300" : isCorrect ? "bg-emerald-500" : "bg-red-400"
                              }`} />
                              <div className="flex-1 px-4 py-3 sm:px-5 sm:py-4">
                                {/* Question header */}
                                <div className="flex items-start justify-between gap-2 mb-3">
                                  <div className="flex items-start gap-2.5">
                                    <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                                      wasSkipped ? "bg-slate-400" : isCorrect ? "bg-emerald-500" : "bg-red-400"
                                    }`}>
                                      {wasSkipped ? "–" : isCorrect ? "✓" : "✗"}
                                    </span>
                                    <h4 className="text-sm sm:text-base font-semibold text-slate-900 pt-0.5">
                                      {index + 1}. {question.questionText}
                                    </h4>
                                  </div>
                                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide whitespace-nowrap ${
                                    wasSkipped
                                      ? "bg-slate-100 text-slate-500"
                                      : isCorrect
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-red-100 text-red-700"
                                  }`}>
                                    {wasSkipped ? "Skipped" : isCorrect ? "Correct" : "Wrong"}
                                  </span>
                                </div>

                                {/* Options */}
                                <div className="ml-8 sm:ml-8.5">
                                  {question.options.map((option, oIndex) => {
                                    const isSelected = answer?.selectedOptionId === option.id
                                    const showCorrect = !quiz.showAnswersAfter
                                    const isCorrectOption = showCorrect && option.isCorrect
                                    const isWrongSelection = isSelected && !isCorrect

                                    return (
                                      <div
                                        key={option.id}
                                        className={`flex items-center gap-3 px-3 py-2 -mx-1 rounded-lg ${
                                          isCorrectOption
                                            ? "bg-emerald-50"
                                            : isWrongSelection
                                              ? "bg-red-50"
                                              : ""
                                        }`}
                                      >
                                        <div className={`flex-shrink-0 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center ${
                                          isCorrectOption
                                            ? "border-emerald-500 bg-emerald-500"
                                            : isWrongSelection
                                              ? "border-red-400 bg-red-400"
                                              : isSelected
                                                ? "border-slate-400 bg-slate-400"
                                                : "border-slate-200"
                                        }`}>
                                          {(isCorrectOption || isWrongSelection || isSelected) && (
                                            <div className="w-2 h-2 rounded-full bg-white" />
                                          )}
                                        </div>
                                        <span className={`flex-shrink-0 text-xs font-medium w-5 ${
                                          isCorrectOption ? "text-emerald-600"
                                            : isWrongSelection ? "text-red-500"
                                            : "text-slate-400"
                                        }`}>
                                          {letterLabels[oIndex]}
                                        </span>
                                        <span className={`text-sm sm:text-base flex-1 ${
                                          isCorrectOption ? "text-emerald-800 font-medium"
                                            : isWrongSelection ? "text-red-800"
                                            : "text-slate-600"
                                        }`}>
                                          {option.optionText}
                                        </span>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                          {isSelected && (
                                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wide">
                                              Yours
                                            </span>
                                          )}
                                          {isCorrectOption && (
                                            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded uppercase tracking-wide">
                                              Correct
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
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

  // Practice mode: when showAnswersAfter date has passed, allow practice without recording
  const practiceMode = !!(quiz.showAnswersAfter && new Date(quiz.showAnswersAfter) <= new Date())

  if (practiceMode) {
    const fullQuestions = await prisma.question.findMany({
      where: { quizId: quiz.id },
      select: {
        id: true,
        marks: true,
        options: {
          select: { id: true, isCorrect: true },
          orderBy: { order: "asc" },
        },
      },
    })

    const marksMap = new Map(fullQuestions.map(q => [q.id, q.marks]))
    const correctMap = new Map(
      fullQuestions.flatMap(q => q.options.map(o => [o.id, o.isCorrect]))
    )

    processedQuestions = processedQuestions.map(q => ({
      ...q,
      marks: marksMap.get(q.id) || 1,
      options: q.options.map(o => ({
        ...o,
        isCorrect: correctMap.get(o.id) || false,
      })),
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
        <QuizTaker quiz={quizWithParsedFields} visitorIp={visitorIp} practiceMode={practiceMode} />
      </div>
    </div>
  )
}
