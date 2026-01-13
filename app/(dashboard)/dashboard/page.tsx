import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import ShareLink from "@/components/quiz/ShareLink"

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
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Create your first quiz
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {quizzes.map((quiz) => (
                <li key={quiz.id}>
                  <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <Link href={`/dashboard/quiz/${quiz.id}/analytics`}>
                          <h3 className="text-lg font-medium text-gray-900 truncate hover:text-blue-600">
                            {quiz.title}
                          </h3>
                        </Link>
                        {quiz.description && (
                          <p className="mt-1 text-sm text-gray-500 truncate">
                            {quiz.description}
                          </p>
                        )}
                        {quiz.isPublished && quiz.shareId && (
                          <ShareLink
                            shareUrl={`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/take/${quiz.shareId}`}
                          />
                        )}
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <span>{quiz._count.questions} questions</span>
                          <span className="mx-2">•</span>
                          <span>{quiz._count.submissions} submissions</span>
                          {quiz.timeLimitSeconds && (
                            <>
                              <span className="mx-2">•</span>
                              <span>{Math.floor(quiz.timeLimitSeconds / 60)} min limit</span>
                            </>
                          )}
                          {quiz.isPublished ? (
                            <>
                              <span className="mx-2">•</span>
                              <span className="text-green-600">Published</span>
                            </>
                          ) : (
                            <>
                              <span className="mx-2">•</span>
                              <span className="text-gray-400">Draft</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Link
                          href={`/dashboard/quiz/${quiz.id}/edit`}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/dashboard/quiz/${quiz.id}/analytics`}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Analytics
                        </Link>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
