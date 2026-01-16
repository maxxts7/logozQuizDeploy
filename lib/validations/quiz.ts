import { z } from "zod"
import { QUESTION_CONFIG, VALIDATION_MESSAGES } from "@/constants/quizConfig"

// Schema for a single quiz option
export const quizOptionSchema = z.object({
  optionText: z.string().min(1, "Option text is required"),
  isCorrect: z.boolean(),
  order: z.number(),
})

// Schema for a single question
export const quizQuestionSchema = z.object({
  questionText: z.string().min(1, VALIDATION_MESSAGES.QUESTION_TEXT_REQUIRED),
  order: z.number(),
  marks: z.number().int().min(1, "Marks must be at least 1").default(1),
  options: z.array(quizOptionSchema)
    .min(QUESTION_CONFIG.MIN_OPTIONS_PER_QUESTION, VALIDATION_MESSAGES.OPTION_COUNT_MIN)
    .max(QUESTION_CONFIG.MAX_OPTIONS_PER_QUESTION, VALIDATION_MESSAGES.OPTION_COUNT_MAX)
    .refine(
      (options) => options.filter(opt => opt.isCorrect).length === 1,
      VALIDATION_MESSAGES.CORRECT_ANSWER_REQUIRED
    ),
})

// Schema for participant field definition
export const participantFieldSchema = z.object({
  label: z.string().min(1, "Field label is required").max(100, "Label too long"),
  required: z.boolean().default(false),
})

// Schema for creating/updating a quiz
export const createQuizSchema = z.object({
  title: z.string().min(1, VALIDATION_MESSAGES.QUIZ_TITLE_REQUIRED).max(200, "Title too long"),
  description: z.string().max(500, "Description too long").optional(),
  timeLimitSeconds: z.number().int().positive().optional().nullable(),
  availableFrom: z.string().datetime().optional().nullable(),
  availableUntil: z.string().datetime().optional().nullable(),
  isPublished: z.boolean().default(false),
  participantFields: z.array(participantFieldSchema).default([]),
  randomizeQuestions: z.boolean().default(false),
  randomizeOptions: z.boolean().default(false),
  maxAttemptsPerIp: z.number().int().positive().optional().nullable(),
  showAnswersAfter: z.string().datetime().optional().nullable(),
  questions: z.array(quizQuestionSchema)
    .min(1, "Quiz must have at least one question"),
})

// Schema for updating a quiz
export const updateQuizSchema = z.object({
  title: z.string().min(1, VALIDATION_MESSAGES.QUIZ_TITLE_REQUIRED).max(200, "Title too long").optional(),
  description: z.string().max(500, "Description too long").optional().nullable(),
  timeLimitSeconds: z.number().int().positive().optional().nullable(),
  availableFrom: z.string().datetime().optional().nullable(),
  availableUntil: z.string().datetime().optional().nullable(),
  isPublished: z.boolean().optional(),
  participantFields: z.array(participantFieldSchema).optional(),
  randomizeQuestions: z.boolean().optional(),
  randomizeOptions: z.boolean().optional(),
  maxAttemptsPerIp: z.number().int().positive().optional().nullable(),
  showAnswersAfter: z.string().datetime().optional().nullable(),
  questions: z.array(quizQuestionSchema).min(1).optional(),
})

// Type exports
export type QuizOption = z.infer<typeof quizOptionSchema>
export type QuizQuestion = z.infer<typeof quizQuestionSchema>
export type ParticipantField = z.infer<typeof participantFieldSchema>
export type CreateQuizInput = z.infer<typeof createQuizSchema>
export type UpdateQuizInput = z.infer<typeof updateQuizSchema>
