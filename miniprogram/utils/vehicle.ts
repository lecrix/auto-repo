export function calculateDaysLeft(expiryTimestamp: number): number | null {
  if (!expiryTimestamp) return null
  const now = Date.now()
  return Math.ceil((expiryTimestamp - now) / (24 * 60 * 60 * 1000))
}

export function formatDaysLeft(days: number | null): string {
  if (days === null) return '--'
  if (days < 0) return `已过期${Math.abs(days)}天`
  if (days === 0) return '今天到期'
  return `${days}天`
}

export function calculateVehicleAge(registerTimestamp: number): string {
  if (!registerTimestamp) return '--'
  
  const now = new Date()
  const regDate = new Date(registerTimestamp)
  
  let years = now.getFullYear() - regDate.getFullYear()
  let months = now.getMonth() - regDate.getMonth()
  
  if (months < 0) {
    years--
    months += 12
  }
  
  if (years > 0) {
    return months > 0 ? `${years}年${months}个月` : `${years}年`
  }
  return `${months}个月`
}

export function isDueWarning(daysLeft: number | null, threshold: number = 30): boolean {
  return daysLeft !== null && daysLeft < threshold
}
