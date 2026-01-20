import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { formatTimeMinutesSeconds } from "@/lib/utils/timeFormatter"
import { formatParticipantDisplay } from "@/lib/utils/parsing"

function getOptionStyle(isSelected: boolean, isCorrect: boolean): string {
  if (isSelected && isCorrect) {
    return "border-green-500 bg-green-100"
  }
  if (isSelected && !isCorrect) {
    return "border-red-500 bg-red-100"
  }
  if (isCorrect) {
    return "border-green-500 bg-green-50"
  }
  return "border-gray-200 bg-white"
}

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
    <div className="px-4 py-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/dashboard/quiz/${quizId}/analytics`}
          className="text-sm text-blue-600 hover:text-blue-800 mb-2 inline-block"
        >
          ← Back to Analytics
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Submission Details</h1>
        <p className="mt-2 text-gray-600">
          Viewing answers for <span className="font-semibold">{participantName}</span>
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Score</h3>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              {Math.round(submission.percentage)}%
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Marks</h3>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              {submission.score} / {submission.totalMarks}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Time Taken</h3>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              {submission.timeSpentSeconds
                ? formatTimeMinutesSeconds(submission.timeSpentSeconds)
                : "N/A"}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Submitted</h3>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {new Date(submission.submittedAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Answers</h2>

        {submission.quiz.questions.map((question, index) => {
          const answer = submission.answers.find((a) => a.questionId === question.id)
          const isCorrect = answer?.isCorrect ?? false

          return (
            <div
              key={question.id}
              className={`bg-white rounded-lg shadow p-6 border-l-4 ${
                isCorrect ? "border-l-green-500" : "border-l-red-500"
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {index + 1}. {question.questionText}
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isCorrect
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {isCorrect ? "Correct" : "Incorrect"}
                </span>
              </div>

              <div className="space-y-2">
                {question.options.map((option) => {
                  const isSelected = answer?.selectedOptionId === option.id
                  const optionStyle = getOptionStyle(isSelected, option.isCorrect)

                  return (
                    <div
                      key={option.id}
                      className={`p-3 rounded-lg border-2 ${optionStyle}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-gray-900">{option.optionText}</span>
                        <div className="flex items-center gap-2">
                          {isSelected && (
                            <span className="text-sm font-medium text-gray-600">
                              Selected
                            </span>
                          )}
                          {option.isCorrect && (
                            <span className="text-sm font-medium text-green-600">
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
                <p className="mt-3 text-sm text-gray-500 italic">
                  No answer submitted for this question
                </p>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-8">
        <Link
          href={`/dashboard/quiz/${quizId}/analytics`}
          className="px-4 py-2 bg-gray-600 text-white rounded-md font-medium hover:bg-gray-700"
        >
          Back to Analytics
        </Link>
      </div>
    </div>
  )
}
