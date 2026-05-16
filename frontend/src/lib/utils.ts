import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(date: string | null | undefined): string {
  if (!date) return '—'
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  } catch {
    return '—'
  }
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  try {
    return format(new Date(date), 'MMM d, yyyy HH:mm')
  } catch {
    return '—'
  }
}

export function confidenceColor(score: number): string {
  if (score >= 0.8) return 'text-accent-green'
  if (score >= 0.6) return 'text-accent-yellow'
  if (score >= 0.4) return 'text-accent-orange'
  return 'text-accent-red'
}

export function confidenceBg(score: number): string {
  if (score >= 0.8) return 'bg-accent-green'
  if (score >= 0.6) return 'bg-accent-yellow'
  if (score >= 0.4) return 'bg-accent-orange'
  return 'bg-accent-red'
}

export function statusColor(status: string): string {
  switch (status) {
    case 'COMPLETED': return 'text-accent-green'
    case 'RUNNING': return 'text-accent-blue'
    case 'QUEUED': return 'text-accent-yellow'
    case 'FAILED': return 'text-accent-red'
    default: return 'text-text-secondary'
  }
}

export function languageColor(lang: string): string {
  return lang === 'PYTHON' ? 'text-accent-blue' : 'text-accent-orange'
}

export function truncate(str: string, max = 80): string {
  return str.length > max ? str.slice(0, max) + '…' : str
}
