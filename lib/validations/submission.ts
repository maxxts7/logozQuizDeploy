import { z } from "zod"

// Schema for a single answer in a submission
export const answerSchema = z.object({
  questionId: z.string(),
  selectedOptionId: z.string(),
})

// Schema for submitting a quiz
export const submissionSchema = z.object({
  takerName: z.string().min(1, "Name is required").max(100),
  takerEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  timeSpentSeconds: z.number().int().positive().optional(),
  answers: z.array(answerSchema).min(1, "At least one answer is required"),
})

// Type exports
export type SubmissionAnswer = z.infer<typeof answerSchema>
export type SubmissionInput = z.infer<typeof submissionSchema>
