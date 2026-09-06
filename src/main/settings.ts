import { app } from 'electron'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { SpeechSettings, SpeechSettingsUpdate } from '../shared/types'

interface AppSettings extends SpeechSettings {}

const DEFAULT_SETTINGS: AppSettings = {
  enabled: true,
  repeatEnabled: true,
  repeatInterval: 1,
  repeatUnit: 'minute'
}

function isValidInterval(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1
}

class SettingsStore {
  private filePath = ''
  private settings: AppSettings = { ...DEFAULT_SETTINGS }
  private initialized = false

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return

    const dir = app.getPath('userData')
    await fs.mkdir(dir, { recursive: true })
    this.filePath = path.join(dir, 'settings.json')

    try {
      const raw = JSON.parse(await fs.readFile(this.filePath, 'utf8')) as Partial<AppSettings> & {
        speechEnabled?: unknown
        repeatMinutes?: unknown
      }
      this.settings = {
        enabled:
          typeof raw.enabled === 'boolean'
            ? raw.enabled
            : typeof raw.speechEnabled === 'boolean'
              ? raw.speechEnabled
              : DEFAULT_SETTINGS.enabled,
        repeatEnabled:
          typeof raw.repeatEnabled === 'boolean'
            ? raw.repeatEnabled
            : DEFAULT_SETTINGS.repeatEnabled,
        repeatInterval:
          isValidInterval(raw.repeatInterval)
            ? raw.repeatInterval
            : isValidInterval(raw.repeatMinutes)
              ? raw.repeatMinutes
              : DEFAULT_SETTINGS.repeatInterval,
        repeatUnit:
          raw.repeatUnit === 'second' || raw.repeatUnit === 'minute'
            ? raw.repeatUnit
            : DEFAULT_SETTINGS.repeatUnit
      }
    } catch {
      this.settings = { ...DEFAULT_SETTINGS }
    }

    this.initialized = true
  }

  async getSpeechSettings(): Promise<SpeechSettings> {
    await this.ensureInitialized()
    return { ...this.settings }
  }

  async updateSpeechSettings(patch: SpeechSettingsUpdate): Promise<SpeechSettings> {
    await this.ensureInitialized()
    if (typeof patch.enabled === 'boolean') this.settings.enabled = patch.enabled
    if (typeof patch.repeatEnabled === 'boolean') {
      this.settings.repeatEnabled = patch.repeatEnabled
    }
    if (isValidInterval(patch.repeatInterval)) {
      this.settings.repeatInterval = patch.repeatInterval
    }
    if (patch.repeatUnit === 'second' || patch.repeatUnit === 'minute') {
      this.settings.repeatUnit = patch.repeatUnit
    }
    await fs.writeFile(this.filePath, JSON.stringify(this.settings, null, 2), 'utf8')
    return { ...this.settings }
  }
}

export const settingsStore = new SettingsStore()
