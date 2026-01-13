/**
 * Time formatting utilities
 * Centralized functions for consistent time display across the application
 */

import { QUIZ_TIMING } from '@/constants/quizConfig';

/**
 * Formats seconds into MM:SS format
 * @param seconds - The number of seconds to format
 * @returns Formatted time string (e.g., "5:30")
 *
 * @example
 * formatTime(330) // "5:30"
 * formatTime(65)  // "1:05"
 * formatTime(0)   // "0:00"
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / QUIZ_TIMING.SECONDS_PER_MINUTE);
  const secs = seconds % QUIZ_TIMING.SECONDS_PER_MINUTE;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formats seconds into "Xm Ys" format
 * @param seconds - The number of seconds to format
 * @returns Formatted time string (e.g., "5m 30s")
 *
 * @example
 * formatTimeMinutesSeconds(330) // "5m 30s"
 * formatTimeMinutesSeconds(65)  // "1m 5s"
 * formatTimeMinutesSeconds(45)  // "0m 45s"
 */
export function formatTimeMinutesSeconds(seconds: number): string {
  const mins = Math.floor(seconds / QUIZ_TIMING.SECONDS_PER_MINUTE);
  const secs = Math.floor(seconds % QUIZ_TIMING.SECONDS_PER_MINUTE);
  return `${mins}m ${secs}s`;
}

/**
 * Formats seconds into "X minutes" format
 * @param seconds - The number of seconds to format
 * @returns Formatted time string (e.g., "5 minutes")
 *
 * @example
 * formatMinutes(300)  // "5 minutes"
 * formatMinutes(60)   // "1 minute"
 * formatMinutes(120)  // "2 minutes"
 */
export function formatMinutes(seconds: number): string {
  const mins = Math.floor(seconds / QUIZ_TIMING.SECONDS_PER_MINUTE);
  return `${mins} ${mins === 1 ? 'minute' : 'minutes'}`;
}

/**
 * Formats seconds into "X min limit" format (for quiz time limits)
 * @param seconds - The number of seconds to format
 * @returns Formatted time string (e.g., "10 min limit")
 *
 * @example
 * formatTimeLimitDisplay(600)  // "10 min limit"
 * formatTimeLimitDisplay(300)  // "5 min limit"
 */
export function formatTimeLimitDisplay(seconds: number): string {
  const mins = Math.floor(seconds / QUIZ_TIMING.SECONDS_PER_MINUTE);
  return `${mins} min limit`;
}

/**
 * Converts minutes to seconds
 * @param minutes - The number of minutes
 * @returns Number of seconds
 *
 * @example
 * minutesToSeconds(5)   // 300
 * minutesToSeconds(10)  // 600
 */
export function minutesToSeconds(minutes: number): number {
  return minutes * QUIZ_TIMING.SECONDS_PER_MINUTE;
}

/**
 * Converts seconds to minutes (rounded down)
 * @param seconds - The number of seconds
 * @returns Number of minutes
 *
 * @example
 * secondsToMinutes(300)  // 5
 * secondsToMinutes(330)  // 5
 * secondsToMinutes(60)   // 1
 */
export function secondsToMinutes(seconds: number): number {
  return Math.floor(seconds / QUIZ_TIMING.SECONDS_PER_MINUTE);
}

/**
 * Formats a duration in a human-readable way
 * Automatically chooses the best format based on the duration
 * @param seconds - The number of seconds to format
 * @returns Formatted time string
 *
 * @example
 * formatDuration(30)    // "30s"
 * formatDuration(90)    // "1m 30s"
 * formatDuration(3600)  // "60m 0s"
 */
export function formatDuration(seconds: number): string {
  if (seconds < QUIZ_TIMING.SECONDS_PER_MINUTE) {
    return `${seconds}s`;
  }
  return formatTimeMinutesSeconds(seconds);
}
