import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../shared/types'
import type {
  ParseReminderResult,
  Reminder,
  ReminderDraft,
  ReminderResult,
  ReminderUpdate
} from '../shared/types'

const api = {
  listReminders: (): Promise<Reminder[]> => ipcRenderer.invoke(IPC_CHANNELS.reminders.list),
  createReminder: (draft: ReminderDraft): Promise<ReminderResult> =>
    ipcRenderer.invoke(IPC_CHANNELS.reminders.create, draft),
  updateReminder: (id: string, patch: ReminderUpdate): Promise<ReminderResult> =>
    ipcRenderer.invoke(IPC_CHANNELS.reminders.update, id, patch),
  removeReminder: (id: string): Promise<{ ok: boolean; error?: string }> =>
    ipcRenderer.invoke(IPC_CHANNELS.reminders.remove, id),
  parseReminder: (text: string): Promise<ParseReminderResult> =>
    ipcRenderer.invoke(IPC_CHANNELS.ai.parse, text)
}

contextBridge.exposeInMainWorld('api', api)

export type RendererApi = typeof api
