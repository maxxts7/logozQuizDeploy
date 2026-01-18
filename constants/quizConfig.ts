/**
 * Centralized quiz configuration
 * All quiz-related business rules and default values
 */

/**
 * Quiz timing configuration
 */
export const QUIZ_TIMING = {
  /** Default time limit for new quizzes (in minutes) */
  DEFAULT_TIME_LIMIT_MINUTES: 10,

  /** Timer update interval (in milliseconds) */
  TIMER_INTERVAL_MS: 1000,

  /** Seconds to minutes conversion factor */
  SECONDS_PER_MINUTE: 60,
} as const;

/**
 * Question configuration
 */
export const QUESTION_CONFIG = {
  /** Minimum number of options per question */
  MIN_OPTIONS_PER_QUESTION: 2,

  /** Maximum number of options per question */
  MAX_OPTIONS_PER_QUESTION: 4,

  /** Default number of options when creating a new question */
  DEFAULT_OPTIONS_COUNT: 4,

  /** Minimum number of questions per quiz */
  MIN_QUESTIONS_PER_QUIZ: 1,
} as const;

/**
 * Authentication configuration
 */
export const AUTH_CONFIG = {
  /** Minimum password length */
  MIN_PASSWORD_LENGTH: 6,

  /** bcrypt salt rounds for password hashing */
  BCRYPT_SALT_ROUNDS: 10,
} as const;

/**
 * Submission configuration
 */
export const SUBMISSION_CONFIG = {
  /** Minimum participant name length */
  MIN_PARTICIPANT_NAME_LENGTH: 1,

  /** Maximum participant name length */
  MAX_PARTICIPANT_NAME_LENGTH: 100,
} as const;

/**
 * UI configuration
 */
export const UI_CONFIG = {
  /** Duration to show "Copied!" message (in milliseconds) */
  COPY_SUCCESS_DURATION_MS: 2000,

  /** Number of top positions to highlight with medals in leaderboard */
  LEADERBOARD_MEDAL_COUNT: 3,

  /** Leaderboard ranking medals */
  RANKING_MEDALS: ['🥇', '🥈', '🥉'] as const,
} as const;

/**
 * URL configuration
 */
export const URL_CONFIG = {
  /** Base URL for the application (falls back to localhost if not set) */
  BASE_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
} as const;

/**
 * Quiz validation helpers
 */
export const VALIDATION_MESSAGES = {
  QUIZ_TITLE_REQUIRED: 'Quiz title is required',
  QUIZ_TITLE_MIN_LENGTH: 'Title must be at least 3 characters',
  QUIZ_DESCRIPTION_REQUIRED: 'Quiz description is required',
  QUESTION_TEXT_REQUIRED: 'Question text is required',
  OPTION_COUNT_MIN: `Each question must have at least ${QUESTION_CONFIG.MIN_OPTIONS_PER_QUESTION} options`,
  OPTION_COUNT_MAX: `Each question can have at most ${QUESTION_CONFIG.MAX_OPTIONS_PER_QUESTION} options`,
  CORRECT_ANSWER_REQUIRED: 'Each question must have exactly one correct answer',
  PARTICIPANT_NAME_REQUIRED: 'Please enter your name',
  PASSWORD_MIN_LENGTH: `Password must be at least ${AUTH_CONFIG.MIN_PASSWORD_LENGTH} characters`,
} as const;

/**
 * Helper function to get quiz share URL
 */
export function getQuizShareUrl(shareId: string): string {
  return `${URL_CONFIG.BASE_URL}/take/${shareId}`;
}
