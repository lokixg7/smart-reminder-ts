import type {
  ParseReminderResult,
  Reminder,
  ReminderDraft,
  ReminderResult,
  ReminderUpdate
} from '../../shared/types'

export interface RendererApi {
  listReminders: () => Promise<Reminder[]>
  createReminder: (draft: ReminderDraft) => Promise<ReminderResult>
  updateReminder: (id: string, patch: ReminderUpdate) => Promise<ReminderResult>
  removeReminder: (id: string) => Promise<{ ok: boolean; error?: string }>
  parseReminder: (text: string) => Promise<ParseReminderResult>
}

declare global {
  interface Window {
    api: RendererApi
  }
}

export {}
