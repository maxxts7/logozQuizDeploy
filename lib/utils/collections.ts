/**
 * Collection utilities
 * Helper functions for working with Sets, Maps, and Arrays
 */

/**
 * Toggles an item in a Set, returning a new Set
 * If the item exists, it's removed; if not, it's added
 * @param set - The original Set
 * @param item - The item to toggle
 * @returns A new Set with the item toggled
 */
export function toggleSetItem<T>(set: Set<T>, item: T): Set<T> {
  const newSet = new Set(set)
  if (newSet.has(item)) {
    newSet.delete(item)
  } else {
    newSet.add(item)
  }
  return newSet
}
