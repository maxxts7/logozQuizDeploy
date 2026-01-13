import { z } from "zod"

// Schema for a single quiz option
export const quizOptionSchema = z.object({
  optionText: z.string().min(1, "Option text is required"),
  isCorrect: z.boolean(),
  order: z.number(),
})

// Schema for a single question
export const quizQuestionSchema = z.object({
  questionText: z.string().min(1, "Question text is required"),
  order: z.number(),
  options: z.array(quizOptionSchema)
    .min(2, "Each question must have at least 2 options")
    .max(4, "Each question can have at most 4 options")
    .refine(
      (options) => options.filter(opt => opt.isCorrect).length === 1,
      "Each question must have exactly one correct answer"
    ),
})

// Schema for creating/updating a quiz
export const createQuizSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(500, "Description too long").optional(),
  timeLimitSeconds: z.number().int().positive().optional().nullable(),
  availableFrom: z.string().datetime().optional().nullable(),
  availableUntil: z.string().datetime().optional().nullable(),
  isPublished: z.boolean().default(false),
  questions: z.array(quizQuestionSchema)
    .min(1, "Quiz must have at least one question"),
})

// Schema for updating a quiz
export const updateQuizSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long").optional(),
  description: z.string().max(500, "Description too long").optional().nullable(),
  timeLimitSeconds: z.number().int().positive().optional().nullable(),
  availableFrom: z.string().datetime().optional().nullable(),
  availableUntil: z.string().datetime().optional().nullable(),
  isPublished: z.boolean().optional(),
  questions: z.array(quizQuestionSchema).min(1).optional(),
})

// Type exports
export type QuizOption = z.infer<typeof quizOptionSchema>
export type QuizQuestion = z.infer<typeof quizQuestionSchema>
export type CreateQuizInput = z.infer<typeof createQuizSchema>
export type UpdateQuizInput = z.infer<typeof updateQuizSchema>
