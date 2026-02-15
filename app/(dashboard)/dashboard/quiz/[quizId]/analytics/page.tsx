import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import ShareLink from "@/components/quiz/ShareLink"
import ExportButton from "@/components/quiz/ExportButton"
import IpAttemptsManager from "@/components/quiz/IpAttemptsManager"
import { getQuizShareUrl } from "@/constants/quizConfig"
import { formatTimeMinutesSeconds, formatDateTime } from "@/lib/utils/timeFormatter"
import { formatParticipantDisplay } from "@/lib/utils/parsing"
import { getRankDisplay, calculateAverage } from "@/lib/utils/leaderboard"
import { Button, Card, Badge, Alert } from "@/components/ui"

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
  const avgScore = calculateAverage(quiz.submissions.map((s) => s.percentage))
  const timesWithValues = quiz.submissions
    .filter((s) => s.timeSpentSeconds !== null)
    .map((s) => s.timeSpentSeconds as number)
  const avgTime = calculateAverage(timesWithValues)
  const ipAttempts = aggregateIpAttempts(quiz.submissions)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{quiz.title}</h1>
            {quiz.description && (
              <p className="mt-1 text-slate-500">{quiz.description}</p>
            )}
          </div>
          <Link href={`/dashboard/quiz/${quiz.id}/edit`}>
            <Button variant="secondary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Quiz
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-slate-500">Questions</p>
              <p className="text-2xl font-bold text-slate-900">{quiz._count.questions}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-slate-500">Submissions</p>
              <p className="text-2xl font-bold text-slate-900">{totalSubmissions}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-slate-500">Avg Score</p>
              <p className="text-2xl font-bold text-slate-900">{avgScore.toFixed(1)}%</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-slate-500">Avg Time</p>
              <p className="text-2xl font-bold text-slate-900">
                {avgTime > 0 ? formatTimeMinutesSeconds(avgTime) : "N/A"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Share Link */}
      {shareUrl && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">
            Shareable Link
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            Share this link with participants to let them take your quiz
          </p>
          <ShareLink shareUrl={shareUrl} />
        </Card>
      )}

      {/* Not Published Warning */}
      {!quiz.isPublished && (
        <Alert variant="warning">
          <div>
            <strong>Quiz Not Published</strong>
            <p className="mt-1">
              This quiz is currently a draft. Edit the quiz and check &quot;Publish
              immediately&quot; to make it accessible via a share link.
            </p>
          </div>
        </Alert>
      )}

      {/* Submissions Table */}
      <Card padding="none">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Submissions
          </h2>
          {sortedSubmissions.length > 0 && (
            <ExportButton quizId={quiz.id} />
          )}
        </div>

        {sortedSubmissions.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-slate-500">No submissions yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Participant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedSubmissions.map((submission, index) => (
                  <tr
                    key={submission.id}
                    className={index < 3 ? "bg-amber-50/50" : "hover:bg-slate-50"}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-slate-900">
                        {getRankDisplay(index)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {formatParticipantDisplay(submission.participantData)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={
                          submission.percentage >= 80
                            ? "success"
                            : submission.percentage >= 50
                            ? "primary"
                            : "error"
                        }
                      >
                        {Math.round(submission.percentage)}%
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {submission.timeSpentSeconds
                        ? formatTimeMinutesSeconds(submission.timeSpentSeconds)
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {formatDateTime(submission.submittedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/dashboard/quiz/${quiz.id}/submission/${submission.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
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
      </Card>

      {/* IP Management */}
      {quiz.maxAttemptsPerIp && quiz.maxAttemptsPerIp > 0 && (
        <Card padding="none">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">
              IP Attempt Management
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              This quiz limits attempts to {quiz.maxAttemptsPerIp} per IP address. Reset attempts to allow users to retake the quiz.
            </p>
          </div>
          <IpAttemptsManager
            quizId={quiz.id}
            ipAttempts={ipAttempts}
            maxAttemptsPerIp={quiz.maxAttemptsPerIp}
          />
        </Card>
      )}
    </div>
  )
}
