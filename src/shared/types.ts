export const IPC_CHANNELS = {
  reminders: {
    list: 'reminders:list',
    create: 'reminders:create',
    update: 'reminders:update',
    remove: 'reminders:remove',
    changed: 'reminders:changed'
  },
  ai: {
    parse: 'ai:parse-reminder'
  },
  settings: {
    getSpeech: 'settings:get-speech',
    updateSpeech: 'settings:update-speech',
    getLaunchAtLogin: 'settings:get-launch-at-login',
    setLaunchAtLogin: 'settings:set-launch-at-login'
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

export type LaunchAtLoginState =
  | 'not-registered'
  | 'enabled'
  | 'requires-approval'
  | 'not-found'
  | 'unknown'

export interface LaunchAtLoginStatus {
  /** True when the OS has registered this app as a login item. */
  openAtLogin: boolean
  /** macOS login-item state; not meaningful on other platforms. */
  status: LaunchAtLoginState
  /** False in development, where OS login registration would target the Electron binary. */
  supported: boolean
}

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
  /** Set when a one-time reminder has fired. Completed reminders are kept for history. */
  completedAt?: string
  /** 1 = Monday … 7 = Sunday. Only used when repeat is 'weekly'. */
  repeatWeekday?: number
  /** How many minutes before dueAt the reminder should fire. Defaults to 0. */
  advanceMinutes?: number
}

export interface ReminderDraft {
  title: string
  note?: string
  dueAt: string
  repeat?: RepeatRule
  repeatWeekday?: number
  advanceMinutes?: number
}

export interface ReminderUpdate {
  title?: string
  note?: string
  dueAt?: string
  repeat?: RepeatRule
  enabled?: boolean
  lastTriggeredAt?: string
  completedAt?: string | null
  repeatWeekday?: number | null
  advanceMinutes?: number
}

export type ReminderResult =
  | { ok: true; reminder: Reminder }
  | { ok: false; error: string }

export type ParseReminderResult =
  | { ok: true; draft: ReminderDraft }
  | { ok: false; error: string }
