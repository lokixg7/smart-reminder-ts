import { BrowserWindow, screen } from 'electron'
import path from 'node:path'
import type { Reminder } from '../shared/types'

const POPUP_WIDTH = 360
const POPUP_HEIGHT = 150
const MARGIN = 24

let popupWindow: BrowserWindow | null = null

export function showReminderPopup(reminder: Reminder): void {
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

  window.on('closed', () => {
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
