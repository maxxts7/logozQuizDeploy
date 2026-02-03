/**
 * Style utilities for quiz components
 */

/**
 * Gets the CSS classes for a quiz option based on its state
 * @param isSelected - Whether the option was selected by the participant
 * @param isCorrect - Whether the option is the correct answer
 * @returns CSS class string for border and background
 */
export function getOptionStyle(isSelected: boolean, isCorrect: boolean): string {
  if (isSelected && isCorrect) {
    return "border-green-500 bg-green-100"
  }
  if (isSelected && !isCorrect) {
    return "border-red-500 bg-red-100"
  }
  if (isCorrect) {
    return "border-green-500 bg-green-50"
  }
  return "border-gray-200 bg-white"
}

/**
 * Gets the CSS classes for a review option with separate correct/wrong highlighting
 * @param isCorrect - Whether to highlight as correct
 * @param isWrong - Whether to highlight as wrong
 * @returns CSS class string for border and background
 */
export function getReviewOptionStyle(isCorrect: boolean, isWrong: boolean): string {
  if (isCorrect) {
    return "border-green-500 bg-green-100"
  }
  if (isWrong) {
    return "border-red-500 bg-red-100"
  }
  return "border-gray-200 bg-white"
}
