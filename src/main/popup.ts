import { BrowserWindow, screen } from 'electron'
import path from 'node:path'
import type { Reminder } from '../shared/types'
import { speakText } from './speech'

const POPUP_WIDTH = 360
const POPUP_HEIGHT = 150
const MARGIN = 24

let popupWindow: BrowserWindow | null = null

export interface PopupSpeechOptions {
  content: string
  /** 0 means speak once; a positive value repeats every N milliseconds. */
  repeatIntervalMs: number
}

export function showReminderPopup(
  reminder: Reminder,
  speechOptions?: PopupSpeechOptions
): void {
  if (popupWindow && !popupWindow.isDestroyed()) popupWindow.close()

  const { workArea } = screen.getPrimaryDisplay()
  const x = workArea.x + workArea.width - POPUP_WIDTH - MARGIN
  const y = workArea.y + workArea.height - POPUP_HEIGHT - MARGIN

  const window = new BrowserWindow({
    width: POPUP_WIDTH,
    height: POPUP_HEIGHT,
    x,
    y,
    show: false,
    frame: false,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    transparent: true,
    hasShadow: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })
  popupWindow = window

  let repeatTimer: ReturnType<typeof setInterval> | null = null

  if (speechOptions) {
    const speak = (): void => speakText(speechOptions.content)
    speak()
    if (speechOptions.repeatIntervalMs > 0) {
      repeatTimer = setInterval(speak, speechOptions.repeatIntervalMs)
    }
  }

  window.on('closed', () => {
    if (repeatTimer) {
      clearInterval(repeatTimer)
      repeatTimer = null
    }
    if (popupWindow === window) popupWindow = null
  })

  window.once('ready-to-show', () => {
    if (!window.isDestroyed()) window.showInactive()
  })

  const query = new URLSearchParams({
    title: reminder.title,
    note: reminder.note,
    due: new Date(reminder.dueAt).toLocaleString()
  })

  const devServerUrl = process.env['ELECTRON_RENDERER_URL']
  if (devServerUrl) {
    void window.loadURL(`${devServerUrl}/reminder-popup.html?${query.toString()}`)
  } else {
    void window.loadFile(path.join(__dirname, '../renderer/reminder-popup.html'), {
      query: Object.fromEntries(query)
    })
  }
}
