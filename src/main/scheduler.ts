import type { Reminder } from '../shared/types'

const MAX_TIMEOUT_MS = 2_147_000_000
const ONE_SECOND_MS = 1_000

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/**
 * Computes the next occurrence strictly after `from` for a reminder.
 * `none` reminders are only considered when their dueAt is still in the future.
 */
export function nextOccurrence(reminder: Reminder, from: Date): Date | null {
  const firstDue = new Date(reminder.dueAt)

  if (reminder.repeat === 'none') {
    return firstDue.getTime() > from.getTime() ? firstDue : null
  }

  if (reminder.repeat === 'daily') {
    const candidate = new Date(from)
    candidate.setHours(firstDue.getHours(), firstDue.getMinutes(), firstDue.getSeconds(), 0)
    if (candidate.getTime() <= from.getTime()) candidate.setDate(candidate.getDate() + 1)
    return candidate
  }

  if (reminder.repeat === 'weekly') {
    const targetWeekday = firstDue.getDay()
    const daysAhead = (targetWeekday - from.getDay() + 7) % 7
    const candidate = new Date(startOfDay(from))
    candidate.setDate(candidate.getDate() + daysAhead)
    candidate.setHours(firstDue.getHours(), firstDue.getMinutes(), firstDue.getSeconds(), 0)
    if (candidate.getTime() <= from.getTime()) candidate.setDate(candidate.getDate() + 7)
    return candidate
  }

  // monthly
  const targetDay = firstDue.getDate()
  const targetTime: [number, number, number] = [
    firstDue.getHours(),
    firstDue.getMinutes(),
    firstDue.getSeconds()
  ]

  const daysInMonth = (year: number, month: number): number =>
    new Date(year, month + 1, 0).getDate()

  const candidate = new Date(from.getFullYear(), from.getMonth(), 1)
  candidate.setHours(...targetTime)
  candidate.setDate(Math.min(targetDay, daysInMonth(candidate.getFullYear(), candidate.getMonth())))

  if (candidate.getTime() <= from.getTime()) {
    const nextMonth = candidate.getMonth() + 1
    candidate.setDate(1)
    candidate.setMonth(nextMonth)
    candidate.setDate(Math.min(targetDay, daysInMonth(candidate.getFullYear(), candidate.getMonth())))
  }

  return candidate.getTime() > from.getTime() ? candidate : null
}

function scheduleAt(target: Date, task: () => void): NodeJS.Timeout {
  const delay = target.getTime() - Date.now()
  if (delay > MAX_TIMEOUT_MS) {
    return setTimeout(() => {
      scheduleAt(target, task)
    }, MAX_TIMEOUT_MS)
  }
  return setTimeout(task, Math.max(delay, 0))
}

type DueListener = (reminder: Reminder) => Promise<void> | void

class ReminderScheduler {
  private timers = new Map<string, NodeJS.Timeout>()
  private listener: DueListener = () => undefined

  onDue(listener: DueListener): void {
    this.listener = listener
  }

  start(reminders: Reminder[]): void {
    this.stop()
    for (const reminder of reminders) this.upsert(reminder)
  }

  upsert(reminder: Reminder): void {
    this.remove(reminder.id)
    if (!reminder.enabled || reminder.completedAt) return

    const next = nextOccurrence(reminder, new Date(Date.now() - ONE_SECOND_MS))
    if (!next) return

    const timer = scheduleAt(next, () => {
      this.fire(reminder, next)
    })
    this.timers.set(reminder.id, timer)
  }

  remove(id: string): void {
    const timer = this.timers.get(id)
    if (timer) clearTimeout(timer)
    this.timers.delete(id)
  }

  stop(): void {
    for (const timer of this.timers.values()) clearTimeout(timer)
    this.timers.clear()
  }

  private fire(reminder: Reminder, scheduledFor: Date): void {
    this.remove(reminder.id)

    const actual = new Date()
    const driftMs = Math.round(actual.getTime() - scheduledFor.getTime())
    console.log(
      `[scheduler] reminder due: title="${reminder.title}" ` +
        `planned=${scheduledFor.toISOString()} actual=${actual.toISOString()} driftMs=${driftMs}`
    )

    if (reminder.repeat !== 'none') {
      const next = nextOccurrence(reminder, new Date(Date.now() + ONE_SECOND_MS))
      if (next) {
        const timer = scheduleAt(next, () => this.fire(reminder, next))
        this.timers.set(reminder.id, timer)
      }
    }

    void this.listener(reminder)
  }
}

export const scheduler = new ReminderScheduler()
