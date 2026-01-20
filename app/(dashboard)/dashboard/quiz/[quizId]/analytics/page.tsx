import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import ShareLink from "@/components/quiz/ShareLink"
import ExportButton from "@/components/quiz/ExportButton"
import IpAttemptsManager from "@/components/quiz/IpAttemptsManager"
import { getQuizShareUrl } from "@/constants/quizConfig"
import { formatTimeMinutesSeconds } from "@/lib/utils/timeFormatter"
import { formatParticipantDisplay } from "@/lib/utils/parsing"

interface Submission {
  id: string
  percentage: number
  timeSpentSeconds: number | null
  ipAddress: string | null
  participantData: string | null
  submittedAt: Date
}

interface IpAttempt {
  ipAddress: string
  attemptCount: number
  participantNames: string[]
}

function sortSubmissionsByRank(submissions: Submission[]): Submission[] {
  return [...submissions].sort((a, b) => {
    if (b.percentage !== a.percentage) {
      return b.percentage - a.percentage
    }
    if (!a.timeSpentSeconds) return 1
    if (!b.timeSpentSeconds) return -1
    return a.timeSpentSeconds - b.timeSpentSeconds
  })
}

function calculateAverageScore(submissions: Submission[]): number {
  if (submissions.length === 0) return 0
  return submissions.reduce((sum, sub) => sum + sub.percentage, 0) / submissions.length
}

function calculateAverageTime(submissions: Submission[]): number {
  const withTime = submissions.filter((sub) => sub.timeSpentSeconds)
  if (withTime.length === 0) return 0
  return withTime.reduce((sum, sub) => sum + (sub.timeSpentSeconds ?? 0), 0) / withTime.length
}

function aggregateIpAttempts(submissions: Submission[]): IpAttempt[] {
  const ipMap = new Map<string, { count: number; names: Set<string> }>()

  for (const sub of submissions) {
    if (!sub.ipAddress) continue

    const existing = ipMap.get(sub.ipAddress) ?? { count: 0, names: new Set<string>() }
    existing.count += 1

    const displayName = formatParticipantDisplay(sub.participantData)
    if (displayName !== "Anonymous") {
      existing.names.add(displayName)
    }

    ipMap.set(sub.ipAddress, existing)
  }

  return Array.from(ipMap.entries())
    .map(([ipAddress, data]) => ({
      ipAddress,
      attemptCount: data.count,
      participantNames: Array.from(data.names),
    }))
    .sort((a, b) => b.attemptCount - a.attemptCount)
}

function getRankDisplay(index: number): string {
  if (index === 0) return "🥇"
  if (index === 1) return "🥈"
  if (index === 2) return "🥉"
  return `#${index + 1}`
}

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ quizId: string }>
}) {
  const session = await auth()
  const { quizId } = await params

  if (!session?.user?.id) {
    redirect("/login")
  }

  const quiz = await prisma.quiz.findUnique({
    where: {
      id: quizId,
      creatorId: session.user.id,
    },
    include: {
      _count: {
        select: {
          questions: true,
          submissions: true,
        },
      },
      submissions: {
        include: {
          answers: true,
        },
      },
    },
  })

  if (!quiz) {
    notFound()
  }

  const sortedSubmissions = sortSubmissionsByRank(quiz.submissions)
  const shareUrl = quiz.isPublished && quiz.shareId ? getQuizShareUrl(quiz.shareId) : null
  const totalSubmissions = quiz.submissions.length
  const avgScore = calculateAverageScore(quiz.submissions)
  const avgTime = calculateAverageTime(quiz.submissions)
  const ipAttempts = aggregateIpAttempts(quiz.submissions)

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="text-sm text-blue-600 hover:text-blue-800 mb-2 inline-block"
        >
          ← Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{quiz.title}</h1>
        {quiz.description && (
          <p className="mt-2 text-gray-600">{quiz.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Questions</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {quiz._count.questions}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Submissions</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {totalSubmissions}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Average Score</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {avgScore.toFixed(1)}%
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Avg Time Taken</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {avgTime > 0 ? formatTimeMinutesSeconds(avgTime) : "N/A"}
          </p>
        </div>
      </div>

      {shareUrl && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Shareable Link
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            Share this link with participants to let them take your quiz
          </p>
          <ShareLink shareUrl={shareUrl} />
        </div>
      )}

      {!quiz.isPublished && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Quiz Not Published
          </h2>
          <p className="text-sm text-gray-600">
            This quiz is currently a draft. Edit the quiz and check "Publish
            immediately" to make it accessible via a share link.
          </p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Recent Submissions
          </h2>
          {sortedSubmissions.length > 0 && (
            <ExportButton quizId={quiz.id} />
          )}
        </div>

        {sortedSubmissions.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500">No submissions yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time Taken
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedSubmissions.map((submission, index) => (
                  <tr key={submission.id} className={index < 3 ? "bg-yellow-50" : ""}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {getRankDisplay(index)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatParticipantDisplay(submission.participantData)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {Math.round(submission.percentage)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {submission.timeSpentSeconds
                        ? formatTimeMinutesSeconds(submission.timeSpentSeconds)
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(submission.submittedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/dashboard/quiz/${quiz.id}/submission/${submission.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View Answers
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {quiz.maxAttemptsPerIp && quiz.maxAttemptsPerIp > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden mt-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              IP Attempt Management
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              This quiz limits attempts to {quiz.maxAttemptsPerIp} per IP address. Reset attempts to allow users to retake the quiz.
            </p>
          </div>
          <IpAttemptsManager
            quizId={quiz.id}
            ipAttempts={ipAttempts}
            maxAttemptsPerIp={quiz.maxAttemptsPerIp}
          />
        </div>
      )}

      <div className="mt-6 flex gap-4">
        <Link
          href={`/dashboard/quiz/${quiz.id}/edit`}
          className="px-4 py-2 bg-gray-600 text-white rounded-md font-medium hover:bg-gray-700"
        >
          Edit Quiz
        </Link>
      </div>
    </div>
  )
}
