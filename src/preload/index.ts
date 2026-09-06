import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { IPC_CHANNELS } from '../shared/types'
import type {
  ParseReminderResult,
  Reminder,
  ReminderDraft,
  ReminderResult,
  ReminderUpdate,
  SpeechSettings,
  SpeechSettingsUpdate
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
    ipcRenderer.invoke(IPC_CHANNELS.ai.parse, text),
  onRemindersChanged: (callback: () => void): (() => void) => {
    const listener = (_event: IpcRendererEvent): void => callback()
    ipcRenderer.on(IPC_CHANNELS.reminders.changed, listener)
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.reminders.changed, listener)
    }
  },
  getSpeechSettings: (): Promise<SpeechSettings> =>
    ipcRenderer.invoke(IPC_CHANNELS.settings.getSpeech),
  updateSpeechSettings: (patch: SpeechSettingsUpdate): Promise<SpeechSettings> =>
    ipcRenderer.invoke(IPC_CHANNELS.settings.updateSpeech, patch)
}

contextBridge.exposeInMainWorld('api', api)

export type RendererApi = typeof api
