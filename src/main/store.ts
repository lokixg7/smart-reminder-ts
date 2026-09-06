import { app } from 'electron'
import { randomUUID } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { Reminder, ReminderDraft, ReminderUpdate } from '../shared/types'

class ReminderStore {
  private filePath = ''
  private reminders: Reminder[] = []
  private initialized = false

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return

    const dir = app.getPath('userData')
    await fs.mkdir(dir, { recursive: true })
    this.filePath = path.join(dir, 'reminders.json')

    try {
      const raw = await fs.readFile(this.filePath, 'utf8')
      const parsed = JSON.parse(raw) as unknown
      this.reminders = Array.isArray(parsed) ? (parsed as Reminder[]) : []
    } catch {
      this.reminders = []
    }

    this.initialized = true
  }

  private async persist(): Promise<void> {
    await fs.writeFile(this.filePath, JSON.stringify(this.reminders, null, 2), 'utf8')
  }

  async list(): Promise<Reminder[]> {
    await this.ensureInitialized()
    return [...this.reminders].sort((a, b) => a.dueAt.localeCompare(b.dueAt))
  }

  async create(draft: ReminderDraft): Promise<Reminder> {
    await this.ensureInitialized()

    const reminder: Reminder = {
      id: randomUUID(),
      title: draft.title.trim(),
      note: draft.note?.trim() ?? '',
      dueAt: new Date(draft.dueAt).toISOString(),
      repeat: draft.repeat ?? 'none',
      enabled: true,
      createdAt: new Date().toISOString()
    }

    this.reminders.push(reminder)
    await this.persist()
    return reminder
  }

  async update(id: string, patch: ReminderUpdate): Promise<Reminder | null> {
    await this.ensureInitialized()

    const index = this.reminders.findIndex((item) => item.id === id)
    if (index === -1) return null

    const current = this.reminders[index]
    const { completedAt, ...restPatch } = patch
    const next: Reminder = {
      ...current,
      ...restPatch,
      completedAt:
        completedAt === null
          ? undefined
          : completedAt !== undefined
            ? completedAt
            : current.completedAt,
      id: current.id,
      createdAt: current.createdAt
    }

    this.reminders[index] = next
    await this.persist()
    return next
  }

  async remove(id: string): Promise<boolean> {
    await this.ensureInitialized()

    const before = this.reminders.length
    this.reminders = this.reminders.filter((item) => item.id !== id)

    if (this.reminders.length === before) return false
    await this.persist()
    return true
  }
}

export const reminderStore = new ReminderStore()
