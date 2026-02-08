import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import ShareLink from "@/components/quiz/ShareLink"
import DeleteQuizButton from "@/components/quiz/DeleteQuizButton"
import { getQuizShareUrl } from "@/constants/quizConfig"
import { Button } from "@/components/ui"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    return null
  }

  const quizzes = await prisma.quiz.findMany({
    where: {
      creatorId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: {
          questions: true,
          submissions: true,
        },
      },
    },
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Quizzes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create, manage, and analyze your quizzes
          </p>
        </div>
        <Link href="/dashboard/quiz/create">
          <Button>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Quiz
          </Button>
        </Link>
      </div>

      {/* Quiz Grid */}
      {quizzes.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">No quizzes yet</h3>
          <p className="text-sm text-slate-500 mb-6">
            Get started by creating your first quiz
          </p>
          <Link href="/dashboard/quiz/create">
            <Button>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create your first quiz
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="flex">
                <div className={`w-1 flex-shrink-0 ${quiz.isPublished ? "bg-emerald-500" : "bg-amber-400"}`} />
                <div className="flex-1 p-4 sm:p-5">
                  {/* Title + actions */}
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <Link href={`/dashboard/quiz/${quiz.id}/analytics`} className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-slate-900 hover:text-blue-600 transition-colors truncate">
                        {quiz.title}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      {quiz.isPublished && quiz.shareId && (
                        <ShareLink shareUrl={getQuizShareUrl(quiz.shareId)} compact />
                      )}
                      <DeleteQuizButton quizId={quiz.id} quizTitle={quiz.title} />
                    </div>
                  </div>

                  {/* Description */}
                  {quiz.description && (
                    <p className="text-sm text-slate-500 line-clamp-1 mb-3">
                      {quiz.description}
                    </p>
                  )}

                  {/* Status + Stats inline */}
                  <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1 mb-4 text-sm">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                      quiz.isPublished
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${quiz.isPublished ? "bg-emerald-500" : "bg-amber-500"}`} />
                      {quiz.isPublished ? "Published" : "Draft"}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-500">{quiz._count.questions} questions</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-500">{quiz._count.submissions} submissions</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link href={`/dashboard/quiz/${quiz.id}/edit`} className="flex-1">
                      <Button variant="secondary" size="sm" className="w-full">
                        Edit
                      </Button>
                    </Link>
                    <Link href={`/dashboard/quiz/${quiz.id}/analytics`} className="flex-1">
                      <Button size="sm" className="w-full">
                        Analytics
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
