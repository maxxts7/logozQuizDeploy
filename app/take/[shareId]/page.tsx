import { Metadata } from "next"
import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import QuizTaker from "@/components/quiz/QuizTaker"
import QuizAvailabilityMessage from "@/components/quiz/QuizAvailabilityMessage"
import { safeJsonParse } from "@/lib/utils/parsing"
import { getVisitorIp } from "@/lib/utils/request"

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

      const correctCount = lastSubmission
        ? lastSubmission.quiz.questions.filter((q) => {
            const answer = lastSubmission.answers.find((a) => a.questionId === q.id)
            return answer?.isCorrect
          }).length
        : 0
      const skippedCount = lastSubmission
        ? lastSubmission.quiz.questions.filter((q) => {
            const answer = lastSubmission.answers.find((a) => a.questionId === q.id)
            return !answer?.selectedOptionId
          }).length
        : 0
      const totalQuestions = lastSubmission?.totalQuestions ?? 0
      const scoreColorClass = scorePercentage >= 60 ? 'from-white via-emerald-50/30 to-emerald-50/70' : 'from-white via-blue-50/30 to-blue-50/70'
      const scoreBorderClass = scorePercentage >= 60 ? 'border-emerald-100/80' : 'border-blue-100/80'
      const scoreRingStroke = scorePercentage >= 60 ? 'stroke-emerald-100' : 'stroke-blue-100'
      const scoreRingFill = scorePercentage >= 60 ? 'stroke-emerald-500' : 'stroke-blue-500'
      const scoreBadgeBg = scorePercentage >= 60 ? 'bg-emerald-100/60 text-emerald-700 border border-emerald-200/80' : 'bg-blue-100/60 text-blue-700 border border-blue-200/80'

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
          <div className="max-w-3xl mx-auto">
            {/* Fixed Header */}
            <div className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200/80 shadow-sm overflow-hidden">
              <div className="absolute inset-0 bg-white sm:bg-white/95 sm:backdrop-blur-sm" />
              <div className={`absolute inset-0 bg-gradient-to-b ${scoreColorClass}`} />

              <div className="relative">
                {/* Quiz Title Row */}
                <div className={`max-w-3xl mx-auto px-3 sm:px-4 py-2.5 border-b ${scoreBorderClass}`}>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <h1 className="text-base font-extrabold text-slate-900 tracking-tight">{quiz.title}</h1>
                      {quiz.description && (
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{quiz.description}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Score Hero Row */}
                <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl sm:text-5xl font-black tabular-nums text-slate-900 tracking-tight leading-none">
                          {lastSubmission?.score ?? 0}
                        </span>
                        <span className="text-xl sm:text-2xl font-bold text-slate-300 leading-none">/{lastSubmission?.totalMarks ?? 0}</span>
                        <span className={`ml-2 text-xs sm:text-sm font-bold uppercase tracking-widest ${getScoreText()} leading-none`}>marks</span>
                      </div>
                      <p className={`text-sm sm:text-base font-bold mt-2 ${getScoreText()}`}>
                        {scorePercentage >= 80 ? "Amazing!" : scorePercentage >= 60 ? "Good Job!" : "Quiz Completed!"}
                      </p>
                    </div>

                    {/* Score ring */}
                    <div className="relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="2.5" className={scoreRingStroke} />
                        <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={`${scorePercentage * 0.975} 100`} className={scoreRingFill} />
                      </svg>
                      <span className={`absolute inset-0 flex items-center justify-center text-base sm:text-lg font-extrabold tabular-nums ${getScoreText()}`}>
                        {scorePercentage}%
                      </span>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-2.5 mt-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-2.5 py-1 rounded-lg ${scoreBadgeBg}`}>
                      {correctCount}/{totalQuestions} <span className="font-normal opacity-70">correct</span>
                    </span>
                    {skippedCount > 0 && (
                      <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-2.5 py-1 rounded-lg bg-amber-100/60 text-amber-700 border border-amber-200/80">
                        {skippedCount} <span className="font-normal opacity-70">skipped</span>
                      </span>
                    )}
                    <span className="text-xs sm:text-sm text-slate-400 ml-auto">
                      All {quiz.maxAttemptsPerIp} attempts used
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Spacer for fixed header */}
            <div className="h-[220px] sm:h-56" />

            <div className="px-2 sm:px-0">
              {/* Attempts used note */}
              <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl mb-5 sm:mb-6 bg-slate-50/80 border border-slate-200/60">
                <svg className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-slate-600">
                  You&apos;ve used all <span className="font-semibold">{quiz.maxAttemptsPerIp}</span> attempt{quiz.maxAttemptsPerIp === 1 ? "" : "s"} for this quiz.
                </p>
              </div>

              {/* Show when answers will be available */}
              {quiz.showAnswersAfter && (
                <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl mb-5 sm:mb-6 bg-amber-50/80 border border-amber-200/60">
                  <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-amber-700">
                    <span className="font-semibold">Correct answers will be available on:</span>{" "}
                    {new Date(quiz.showAnswersAfter).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            {/* Individual Review Question Cards */}
            {lastSubmission && (
              <div className="space-y-5 sm:space-y-6">
                {lastSubmission.quiz.questions.map((question, index) => {
                  const answer = lastSubmission.answers.find((a) => a.questionId === question.id)
                  const isCorrect = answer?.isCorrect ?? false
                  const wasSkipped = !answer?.selectedOptionId
                  const letterLabels = ["A", "B", "C", "D", "E", "F", "G", "H"]
                  const correctBg = wasSkipped ? "bg-slate-300" : isCorrect ? "bg-emerald-500" : "bg-red-400"

                  return (
                    <div key={question.id} className="bg-white rounded-xl overflow-hidden sm:shadow-sm">
                      <div className="flex">
                        <div className={`w-1 flex-shrink-0 hidden sm:block ${correctBg}`} />
                        <div className="flex-1 px-1 py-3 sm:px-5 sm:py-4">
                          {/* Question header */}
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex items-start gap-1.5 sm:gap-2.5 min-w-0">
                              <span className={`flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold text-white ${correctBg}`}>
                                {wasSkipped ? "–" : isCorrect ? "✓" : "✗"}
                              </span>
                              <h4 className="min-w-0 break-words text-sm sm:text-base font-semibold text-slate-900 pt-0.5">
                                {index + 1}. {question.questionText}
                              </h4>
                            </div>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-md whitespace-nowrap ${
                              wasSkipped
                                ? "bg-slate-100 text-slate-500"
                                : isCorrect
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-red-100 text-red-700"
                            }`}>
                              {wasSkipped ? "Skipped" : isCorrect ? `${question.marks}/${question.marks}` : `0/${question.marks}`}
                            </span>
                          </div>

                          {/* Options */}
                          <div className="ml-0 sm:ml-8">
                            {question.options.map((option, oIndex) => {
                              const isSelected = answer?.selectedOptionId === option.id
                              const showCorrect = !quiz.showAnswersAfter
                              const isCorrectOption = showCorrect && option.isCorrect
                              const isWrongSelection = isSelected && !isCorrect

                              return (
                                <div
                                  key={option.id}
                                  className={`flex items-center gap-1.5 sm:gap-3 px-1 py-2 sm:-mx-1 sm:px-3 rounded-lg ${
                                    isCorrectOption
                                      ? "bg-emerald-50"
                                      : isWrongSelection
                                        ? "bg-red-50"
                                        : ""
                                  }`}
                                >
                                  <div className={`flex-shrink-0 w-3 h-3 sm:w-[18px] sm:h-[18px] rounded-full border-[1.5px] sm:border-2 flex items-center justify-center ${
                                    isCorrectOption
                                      ? "border-emerald-500 bg-emerald-500"
                                      : isWrongSelection
                                        ? "border-red-400 bg-red-400"
                                        : isSelected
                                          ? "border-slate-400 bg-slate-400"
                                          : "border-slate-200"
                                  }`}>
                                    {(isCorrectOption || isWrongSelection || isSelected) && (
                                      <svg className="w-2 h-2 sm:w-3 sm:h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </div>
                                  <span className={`hidden sm:inline flex-shrink-0 text-xs font-medium sm:w-5 ${
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
            )}

            {/* Bottom padding */}
            <div className="pb-40" />
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
      <div className="max-w-4xl mx-auto px-2 sm:px-4">
        <QuizTaker quiz={quizWithParsedFields} visitorIp={visitorIp} practiceMode={practiceMode} />
      </div>
    </div>
  )
}
