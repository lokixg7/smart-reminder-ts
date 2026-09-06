import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import { IPC_CHANNELS } from '../shared/types'
import type {
  LaunchAtLoginState,
  LaunchAtLoginStatus,
  ParseReminderResult,
  Reminder,
  ReminderDraft,
  ReminderResult,
  ReminderUpdate,
  SpeechSettingsUpdate
} from '../shared/types'
import { parseReminderWithAI } from './ai'
import { setNotificationActivationHandler } from './notifier'
import { showReminderPopup } from './popup'
import { scheduler } from './scheduler'
import { settingsStore } from './settings'
import { reminderStore } from './store'

let mainWindow: BrowserWindow | null = null

const DEV_SERVER_URL = process.env.ELECTRON_RENDERER_URL

function showMainWindow(): void {
  if (!mainWindow) {
    createMainWindow()
    return
  }

  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.show()
  mainWindow.focus()
}

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1080,
    height: 760,
    minWidth: 760,
    minHeight: 560,
    show: false,
    title: 'Smart Reminder',
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  if (DEV_SERVER_URL) {
    void mainWindow.loadURL(DEV_SERVER_URL)
  } else {
    void mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

function registerIpcHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.reminders.list, () => reminderStore.list())

  ipcMain.handle(
    IPC_CHANNELS.reminders.create,
    async (_event, draft: ReminderDraft): Promise<ReminderResult> => {
      try {
        const reminder = await reminderStore.create(draft)
        scheduler.upsert(reminder)
        return { ok: true, reminder }
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : String(error) }
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.reminders.update,
    async (_event, id: string, patch: ReminderUpdate): Promise<ReminderResult> => {
      try {
        const reminder = await reminderStore.update(id, patch)
        if (!reminder) return { ok: false, error: 'Reminder not found.' }
        scheduler.upsert(reminder)
        return { ok: true, reminder }
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : String(error) }
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.reminders.remove,
    async (_event, id: string): Promise<{ ok: boolean; error?: string }> => {
      const removed = await reminderStore.remove(id)
      scheduler.remove(id)
      return removed ? { ok: true } : { ok: false, error: 'Reminder not found.' }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.ai.parse,
    async (_event, text: string): Promise<ParseReminderResult> => parseReminderWithAI(text)
  )

  ipcMain.handle(IPC_CHANNELS.settings.getSpeech, () => settingsStore.getSpeechSettings())

  ipcMain.handle(
    IPC_CHANNELS.settings.updateSpeech,
    async (_event, patch: SpeechSettingsUpdate) => settingsStore.updateSpeechSettings(patch)
  )

  ipcMain.handle(IPC_CHANNELS.settings.getLaunchAtLogin, () => readLaunchAtLoginStatus())

  ipcMain.handle(
    IPC_CHANNELS.settings.setLaunchAtLogin,
    (_event, enabled: boolean): LaunchAtLoginStatus => {
      if (!app.isPackaged) return readLaunchAtLoginStatus()
      app.setLoginItemSettings({ openAtLogin: enabled })
      return readLaunchAtLoginStatus()
    }
  )
}

function readLaunchAtLoginStatus(): LaunchAtLoginStatus {
  if (!app.isPackaged) {
    return { openAtLogin: false, status: 'unknown', supported: false }
  }

  try {
    const settings = app.getLoginItemSettings()
    const rawStatus = settings.status ?? 'unknown'
    const validStates: LaunchAtLoginState[] = [
      'not-registered',
      'enabled',
      'requires-approval',
      'not-found',
      'unknown'
    ]
    const status: LaunchAtLoginState = validStates.includes(rawStatus as LaunchAtLoginState)
      ? (rawStatus as LaunchAtLoginState)
      : 'unknown'
    return { openAtLogin: settings.openAtLogin, status, supported: true }
  } catch {
    return { openAtLogin: false, status: 'unknown', supported: false }
  }
}

function broadcastRemindersChanged(): void {
  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) {
      window.webContents.send(IPC_CHANNELS.reminders.changed)
    }
  }
}

async function onReminderDue(reminder: Reminder): Promise<void> {
  console.log(`[reminder] fired: ${reminder.title} (${reminder.id})`)
  console.log('[reminder] showing desktop popup')
  const speechContent = reminder.note ? `${reminder.title}. ${reminder.note}` : reminder.title
  const speechSettings = await settingsStore.getSpeechSettings()
  const intervalMs =
    speechSettings.repeatInterval *
    (speechSettings.repeatUnit === 'second' ? 1_000 : 60_000)
  showReminderPopup(
    reminder,
    speechSettings.enabled
      ? {
          content: speechContent,
          repeatIntervalMs: speechSettings.repeatEnabled ? intervalMs : 0
        }
      : undefined
  )

  const now = new Date().toISOString()
  if (reminder.repeat === 'none') {
    await reminderStore.update(reminder.id, { completedAt: now })
  } else {
    await reminderStore.update(reminder.id, { lastTriggeredAt: now })
  }
  broadcastRemindersChanged()
}

const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => showMainWindow())

  void app.whenReady().then(async () => {
    const reminders = await reminderStore.list()
    await settingsStore.getSpeechSettings()
    const openedAtLogin = process.platform === 'darwin' && app.getLoginItemSettings().wasOpenedAtLogin

    setNotificationActivationHandler(() => showMainWindow())
    scheduler.onDue(onReminderDue)
    scheduler.start(reminders)

    registerIpcHandlers()
    // Standard desktop-app pattern: when the OS launches us at login, stay in the
    // background and only create the window when the user activates the app.
    if (!openedAtLogin) createMainWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })

  app.on('before-quit', () => scheduler.stop())
}
