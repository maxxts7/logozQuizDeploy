import { z } from "zod"

// Schema for a single answer in a submission
export const answerSchema = z.object({
  questionId: z.string(),
  selectedOptionId: z.string(),
})

// Schema for submitting a quiz
export const submissionSchema = z.object({
  participantData: z.record(z.string(), z.string()).default({}),
  timeSpentSeconds: z.number().int().positive().optional(),
  answers: z.array(answerSchema).min(1, "At least one answer is required"),
})

// Type exports
export type SubmissionAnswer = z.infer<typeof answerSchema>
export type SubmissionInput = z.infer<typeof submissionSchema>
