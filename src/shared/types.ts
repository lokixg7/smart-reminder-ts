export const IPC_CHANNELS = {
  reminders: {
    list: 'reminders:list',
    create: 'reminders:create',
    update: 'reminders:update',
    remove: 'reminders:remove'
  },
  ai: {
    parse: 'ai:parse-reminder'
  },
  settings: {
    getSpeech: 'settings:get-speech',
    updateSpeech: 'settings:update-speech'
  }
} as const

export type SpeechRepeatUnit = 'second' | 'minute'

export interface SpeechSettings {
  enabled: boolean
  repeatEnabled: boolean
  repeatInterval: number
  repeatUnit: SpeechRepeatUnit
}

export type SpeechSettingsUpdate = Partial<SpeechSettings>

export type RepeatRule = 'none' | 'daily' | 'weekly' | 'monthly'

export interface Reminder {
  id: string
  title: string
  note: string
  /** ISO 8601 timestamp of the first scheduled occurrence. */
  dueAt: string
  repeat: RepeatRule
  enabled: boolean
  createdAt: string
  lastTriggeredAt?: string
}

export interface ReminderDraft {
  title: string
  note?: string
  dueAt: string
  repeat?: RepeatRule
}

export interface ReminderUpdate {
  title?: string
  note?: string
  dueAt?: string
  repeat?: RepeatRule
  enabled?: boolean
  lastTriggeredAt?: string
}

export type ReminderResult =
  | { ok: true; reminder: Reminder }
  | { ok: false; error: string }

export type ParseReminderResult =
  | { ok: true; draft: ReminderDraft }
  | { ok: false; error: string }
