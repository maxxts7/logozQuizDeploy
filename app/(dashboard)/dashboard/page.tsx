import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import ShareLink from "@/components/quiz/ShareLink"
import DeleteQuizButton from "@/components/quiz/DeleteQuizButton"
import { getQuizShareUrl } from "@/constants/quizConfig"
import { formatTimeLimitDisplay, secondsToMinutes } from "@/lib/utils/timeFormatter"

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
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">My Quizzes</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all your quizzes including their title, question count, and number of submissions.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href="/dashboard/quiz/create"
            className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:from-blue-600 hover:to-blue-700 active:from-blue-700 active:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Create Quiz
          </Link>
        </div>
      </div>

      <div className="mt-8">
        {quizzes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <h3 className="mt-2 text-sm font-medium text-gray-900">No quizzes yet</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new quiz.</p>
            <div className="mt-6">
              <Link
                href="/dashboard/quiz/create"
                className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:from-blue-700 active:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Create your first quiz
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden"
              >
                <div className="p-6">
                  {/* Header with title and status */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <Link href={`/dashboard/quiz/${quiz.id}/analytics`}>
                        <h3 className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors mb-1">
                          {quiz.title}
                        </h3>
                      </Link>
                      {quiz.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {quiz.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      {quiz.isPublished ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-green-800">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                          </svg>
                          Draft
                        </span>
                      )}
                      <DeleteQuizButton quizId={quiz.id} quizTitle={quiz.title} />
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center py-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{quiz._count.questions}</div>
                      <div className="text-xs text-gray-600 mt-1">Questions</div>
                    </div>
                    <div className="text-center py-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{quiz._count.submissions}</div>
                      <div className="text-xs text-gray-600 mt-1">Submissions</div>
                    </div>
                  </div>

                  {/* Share link */}
                  {quiz.isPublished && quiz.shareId && (
                    <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                      <ShareLink shareUrl={getQuizShareUrl(quiz.shareId)} />
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/quiz/${quiz.id}/edit`}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 active:from-gray-300 active:to-gray-400 transition-all duration-200"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/dashboard/quiz/${quiz.id}/analytics`}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:from-blue-700 active:to-blue-800 transition-all duration-200"
                    >
                      Analytics
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
