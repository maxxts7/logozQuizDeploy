import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import QuizCreator from "@/components/quiz/QuizCreator"

export default async function EditQuizPage({
  params,
}: {
  params: Promise<{ quizId: string }>
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const { quizId } = await params

  const quiz = await prisma.quiz.findUnique({
    where: {
      id: quizId,
    },
    include: {
      questions: {
        include: {
          options: {
            orderBy: {
              order: "asc",
            },
          },
        },
        orderBy: {
          order: "asc",
        },
      },
    },
  })

  if (!quiz) {
    redirect("/dashboard")
  }

  if (quiz.creatorId !== session.user.id) {
    redirect("/dashboard")
  }

  // Transform quiz data for the form
  const initialData = {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    timeLimitSeconds: quiz.timeLimitSeconds,
    availableFrom: quiz.availableFrom ? new Date(quiz.availableFrom).toISOString().slice(0, 16) : null,
    availableUntil: quiz.availableUntil ? new Date(quiz.availableUntil).toISOString().slice(0, 16) : null,
    isPublished: quiz.isPublished,
    questions: quiz.questions.map((q) => ({
      questionText: q.questionText,
      order: q.order,
      options: q.options.map((opt) => ({
        optionText: opt.optionText,
        isCorrect: opt.isCorrect,
        order: opt.order,
      })),
    })),
  }

  return (
    <div className="px-4 py-6">
      <QuizCreator initialData={initialData} isEdit={true} />
    </div>
  )
}
