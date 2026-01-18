/**
 * Parsing utilities
 * Safe JSON parsing helpers for consistent error handling
 */

/**
 * Safely parses a JSON string, returning a default value on failure
 * @param jsonString - The JSON string to parse
 * @param defaultValue - The default value to return on parse failure
 * @returns The parsed value or the default value
 */
export function safeJsonParse<T>(jsonString: string | null | undefined, defaultValue: T): T {
  if (!jsonString) {
    return defaultValue
  }
  try {
    return JSON.parse(jsonString) as T
  } catch {
    return defaultValue
  }
}

/**
 * Safely parses participant data from a JSON string
 * @param participantData - The JSON string containing participant data
 * @returns An object with participant field values, or empty object on failure
 */
export function parseParticipantData(participantData: string | null | undefined): Record<string, string> {
  return safeJsonParse(participantData, {})
}

/**
 * Formats participant data values for display
 * @param participantData - The JSON string containing participant data
 * @returns A comma-separated string of values, or "Anonymous" if empty
 */
export function formatParticipantDisplay(participantData: string | null | undefined): string {
  const data = parseParticipantData(participantData)
  const values = Object.values(data).filter(Boolean)
  return values.length > 0 ? values.join(", ") : "Anonymous"
}
