import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { formatTimeMinutesSeconds, formatDateTime } from "@/lib/utils/timeFormatter"
import { formatParticipantDisplay } from "@/lib/utils/parsing"
import { getOptionStyle } from "@/lib/utils/styles"
import { Button, Card, Badge } from "@/components/ui"

export default async function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ quizId: string; submissionId: string }>
}) {
  const session = await auth()
  const { quizId, submissionId } = await params

  if (!session?.user?.id) {
    redirect("/login")
  }

  const submission = await prisma.submission.findUnique({
    where: {
      id: submissionId,
    },
    include: {
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
      answers: true,
    },
  })

  if (!submission || submission.quiz.creatorId !== session.user.id || submission.quizId !== quizId) {
    notFound()
  }

  const participantName = formatParticipantDisplay(submission.participantData)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/dashboard/quiz/${quizId}/analytics`}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Analytics
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Submission Details</h1>
        <p className="mt-1 text-slate-500">
          Viewing answers for <span className="font-semibold text-slate-700">{participantName}</span>
        </p>
      </div>

      {/* Stats Card */}
      <Card>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-slate-500 mb-1">Score</p>
            <p className="text-2xl font-bold text-slate-900">
              {Math.round(submission.percentage)}%
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">Marks</p>
            <p className="text-2xl font-bold text-slate-900">
              {submission.score} / {submission.totalMarks}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">Time Taken</p>
            <p className="text-2xl font-bold text-slate-900">
              {submission.timeSpentSeconds
                ? formatTimeMinutesSeconds(submission.timeSpentSeconds)
                : "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">Submitted</p>
            <p className="text-lg font-semibold text-slate-900">
              {formatDateTime(submission.submittedAt)}
            </p>
          </div>
        </div>
      </Card>

      {/* Answers */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Answers</h2>

        {submission.quiz.questions.map((question, index) => {
          const answer = submission.answers.find((a) => a.questionId === question.id)
          const isCorrect = answer?.isCorrect ?? false

          return (
            <Card
              key={question.id}
              className={`border-l-4 sm:ring-0 ${
                isCorrect ? "border-l-emerald-500" : "border-l-red-500"
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <h3 className="min-w-0 break-words text-base font-semibold text-slate-900">
                  <span className="text-slate-400 mr-2">{index + 1}.</span>
                  {question.questionText}
                </h3>
                <span className="flex-shrink-0">
                  <Badge variant={isCorrect ? "success" : "error"}>
                    {isCorrect ? "Correct" : "Incorrect"}
                  </Badge>
                </span>
              </div>

              <div className="space-y-2">
                {question.options.map((option) => {
                  const isSelected = answer?.selectedOptionId === option.id
                  const optionStyle = getOptionStyle(isSelected, option.isCorrect)

                  return (
                    <div
                      key={option.id}
                      className={`p-3 rounded-lg border ${optionStyle}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-slate-900">{option.optionText}</span>
                        <div className="flex items-center gap-2">
                          {isSelected && (
                            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              Selected
                            </span>
                          )}
                          {option.isCorrect && (
                            <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">
                              Correct Answer
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {!answer && (
                <p className="mt-4 text-sm text-slate-500 italic">
                  No answer submitted for this question
                </p>
              )}
            </Card>
          )
        })}
      </div>

      {/* Back Button */}
      <div>
        <Link href={`/dashboard/quiz/${quizId}/analytics`}>
          <Button variant="secondary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Analytics
          </Button>
        </Link>
      </div>
    </div>
  )
}
