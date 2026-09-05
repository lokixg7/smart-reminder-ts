import type { RepeatRule } from '../../../shared/types'
import type { Language } from '../i18n'

const repeatLabels: Record<Language, Record<RepeatRule, string>> = {
  en: {
    none: 'Once',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly'
  },
  zh: {
    none: '单次',
    daily: '每天',
    weekly: '每周',
    monthly: '每月'
  }
}

export function repeatLabel(repeat: RepeatRule, language: Language): string {
  return repeatLabels[language][repeat]
}

export function formatDueAt(iso: string, language: Language): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso

  const locale = language === 'zh' ? 'zh-CN' : 'en-US'
  const now = new Date()
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()

  const time = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  if (isToday) return language === 'zh' ? `今天 ${time}` : `Today at ${time}`

  const day = date.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    weekday: 'short'
  })
  return `${day} ${time}`
}
