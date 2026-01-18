/**
 * Request utilities
 * Helper functions for handling HTTP request data
 */

import { headers } from "next/headers"

/**
 * Extracts the visitor's IP address from request headers
 * Checks x-forwarded-for first (for proxied requests), then x-real-ip
 * @returns The visitor's IP address or "unknown" if not found
 */
export async function getVisitorIp(): Promise<string> {
  const headersList = await headers()
  const forwardedFor = headersList.get("x-forwarded-for")
  const realIp = headersList.get("x-real-ip")
  return forwardedFor?.split(",")[0]?.trim() || realIp || "unknown"
}
