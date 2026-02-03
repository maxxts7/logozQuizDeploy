/**
 * Leaderboard utilities
 * Helper functions for ranking and leaderboard display
 */

import { UI_CONFIG } from "@/constants/quizConfig"

/**
 * Gets the display string for a rank position
 * Returns medal emoji for top 3, otherwise returns "#N" format
 * @param index - Zero-based index in the sorted results
 * @returns Display string for the rank
 */
export function getRankDisplay(index: number): string {
  if (index < UI_CONFIG.LEADERBOARD_MEDAL_COUNT) {
    return UI_CONFIG.RANKING_MEDALS[index]
  }
  return `#${index + 1}`
}

/**
 * Calculates the average of a numeric array
 * @param values - Array of numbers
 * @returns Average value, or 0 if array is empty
 */
export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, val) => sum + val, 0) / values.length
}
