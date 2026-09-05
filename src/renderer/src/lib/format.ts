import type { RepeatRule } from '../../../shared/types'

const repeatLabels: Record<RepeatRule, string> = {
  none: '单次',
  daily: '每天',
  weekly: '每周',
  monthly: '每月'
}

export function repeatLabel(repeat: RepeatRule): string {
  return repeatLabels[repeat]
}

export function formatDueAt(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso

  const now = new Date()
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()

  const time = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  if (isToday) return `今天 ${time}`

  const day = date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', weekday: 'short' })
  return `${day} ${time}`
}
