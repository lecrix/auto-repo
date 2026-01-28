/**
 * Date Utilities - Local timezone handling to prevent UTC offset bugs
 * 
 * Problem: Using toISOString() for date display causes ±1 day offset
 * Solution: Format dates in local timezone for all UI displays
 */

/**
 * Format timestamp to local date string (YYYY-MM-DD)
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Local date string without time component
 */
export function formatLocalDate(timestamp: number): string {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Format timestamp to local datetime string (YYYY-MM-DD HH:mm)
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Local datetime string
 */
export function formatLocalDateTime(timestamp: number): string {
  const date = new Date(timestamp)
  const datePart = formatLocalDate(timestamp)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${datePart} ${hours}:${minutes}`
}

/**
 * Format timestamp to relative time (今天/昨天/N天前)
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Relative time string in Chinese
 */
export function formatRelativeTime(timestamp: number): string {
  const now = new Date()
  const target = new Date(timestamp)
  
  // Reset to midnight for accurate day comparison
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  
  const daysDiff = Math.floor((nowMidnight.getTime() - targetMidnight.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysDiff === 0) return '今天'
  if (daysDiff === 1) return '昨天'
  if (daysDiff < 7) return `${daysDiff}天前`
  if (daysDiff < 30) return `${Math.floor(daysDiff / 7)}周前`
  if (daysDiff < 365) return `${Math.floor(daysDiff / 30)}个月前`
  return `${Math.floor(daysDiff / 365)}年前`
}

/**
 * Convert local date string (YYYY-MM-DD) to timestamp at start of day
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Unix timestamp in milliseconds (local midnight)
 */
export function parseLocalDate(dateStr: string): number {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).getTime()
}

/**
 * Get current timestamp in milliseconds (for consistency with backend)
 * @returns Current Unix timestamp in milliseconds
 */
export function now(): number {
  return Date.now()
}

/**
 * Format month for display (YYYY-MM)
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Month string in YYYY-MM format
 */
export function formatMonth(timestamp: number): string {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}
