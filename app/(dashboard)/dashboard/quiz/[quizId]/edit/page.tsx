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

  // Parse participantFields safely
  let parsedParticipantFields = []
  try {
    parsedParticipantFields = JSON.parse(quiz.participantFields || "[]")
  } catch {
    parsedParticipantFields = []
  }

  // Helper to format date for datetime-local input (uses local timezone)
  const formatDateTimeLocal = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  // Transform quiz data for the form
  const initialData = {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    timeLimitSeconds: quiz.timeLimitSeconds,
    availableFrom: quiz.availableFrom ? formatDateTimeLocal(new Date(quiz.availableFrom)) : null,
    availableUntil: quiz.availableUntil ? formatDateTimeLocal(new Date(quiz.availableUntil)) : null,
    isPublished: quiz.isPublished,
    participantFields: parsedParticipantFields,
    randomizeQuestions: quiz.randomizeQuestions,
    randomizeOptions: quiz.randomizeOptions,
    questions: quiz.questions.map((q) => ({
      questionText: q.questionText,
      order: q.order,
      marks: q.marks || 1,
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
