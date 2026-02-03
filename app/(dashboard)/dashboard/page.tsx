import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import ShareLink from "@/components/quiz/ShareLink"
import DeleteQuizButton from "@/components/quiz/DeleteQuizButton"
import { getQuizShareUrl } from "@/constants/quizConfig"
import { Button, Card, Badge } from "@/components/ui"

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
        <Card padding="lg" className="text-center py-16">
          <div className="max-w-sm mx-auto">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No quizzes yet</h3>
            <p className="text-slate-500 mb-6">
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
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {quizzes.map((quiz) => (
            <Card key={quiz.id} hover padding="none" className="overflow-hidden">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <Link href={`/dashboard/quiz/${quiz.id}/analytics`}>
                      <h3 className="text-lg font-semibold text-slate-900 hover:text-blue-600 transition-colors truncate">
                        {quiz.title}
                      </h3>
                    </Link>
                    {quiz.description && (
                      <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                        {quiz.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {quiz.isPublished ? (
                      <Badge variant="success">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Published
                      </Badge>
                    ) : (
                      <Badge variant="default">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                        </svg>
                        Draft
                      </Badge>
                    )}
                    <DeleteQuizButton quizId={quiz.id} quizTitle={quiz.title} />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-slate-900">
                      {quiz._count.questions}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Questions</div>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {quiz._count.submissions}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Submissions</div>
                  </div>
                </div>

                {/* Share Link */}
                {quiz.isPublished && quiz.shareId && (
                  <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <ShareLink shareUrl={getQuizShareUrl(quiz.shareId)} />
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Link href={`/dashboard/quiz/${quiz.id}/edit`} className="flex-1">
                    <Button variant="secondary" className="w-full">
                      Edit
                    </Button>
                  </Link>
                  <Link href={`/dashboard/quiz/${quiz.id}/analytics`} className="flex-1">
                    <Button className="w-full">
                      Analytics
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
