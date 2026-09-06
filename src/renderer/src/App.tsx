import { useCallback, useEffect, useState } from 'react'
import type {
  Reminder,
  SpeechRepeatUnit,
  SpeechSettings,
  SpeechSettingsUpdate
} from '../../shared/types'
import { Composer } from './components/Composer'
import { ReminderList } from './components/ReminderList'
import { useI18n } from './i18n'

export default function App(): JSX.Element {
  const { language, setLanguage, t } = useI18n()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [speechSettings, setSpeechSettings] = useState<SpeechSettings>({
    enabled: true,
    repeatEnabled: true,
    repeatInterval: 1,
    repeatUnit: 'minute'
  })
  const [repeatInput, setRepeatInput] = useState('1')
  const [view, setView] = useState<'upcoming' | 'completed'>('upcoming')

  const refresh = useCallback(async () => {
    try {
      setReminders(await window.api.listReminders())
      setLoadError('')
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : String(error))
    }
  }, [])

  useEffect(() => {
    void refresh().finally(() => setLoading(false))
  }, [refresh])

  useEffect(() => {
    const unsubscribe = window.api.onRemindersChanged(() => {
      void refresh()
    })
    return unsubscribe
  }, [refresh])

  useEffect(() => {
    void window.api.getSpeechSettings().then(setSpeechSettings)
  }, [])

  useEffect(() => {
    setRepeatInput(String(speechSettings.repeatInterval))
  }, [speechSettings.repeatInterval])

  async function updateSpeech(patch: SpeechSettingsUpdate): Promise<void> {
    const previous = speechSettings
    setSpeechSettings({ ...speechSettings, ...patch })
    try {
      const saved = await window.api.updateSpeechSettings(patch)
      setSpeechSettings(saved)
    } catch (error) {
      console.error('Failed to save speech settings:', error)
      setSpeechSettings(previous)
    }
  }

  function handleRepeatInput(value: string): void {
    setRepeatInput(value)
    const parsed = Number(value)
    if (/^[1-9]\d*$/.test(value) && Number.isInteger(parsed) && parsed >= 1) {
      void updateSpeech({ repeatInterval: parsed })
    }
  }

  function handleRepeatBlur(): void {
    const parsed = Number(repeatInput)
    if (!/^[1-9]\d*$/.test(repeatInput) || !Number.isInteger(parsed) || parsed < 1) {
      setRepeatInput(String(speechSettings.repeatInterval))
    }
  }

  const upcomingReminders = reminders.filter((reminder) => !reminder.completedAt)
  const completedReminders = reminders.filter((reminder) => reminder.completedAt)

  return (
    <main className="app">
      <header className="app-header">
        <div className="header-row">
          <h1>Smart Reminder</h1>
          <div className="header-controls">
            <label className="switch speech-toggle">
              <input
                type="checkbox"
                checked={speechSettings.enabled}
                onChange={() => void updateSpeech({ enabled: !speechSettings.enabled })}
              />
              <span>{t('voiceBroadcast')}</span>
            </label>
            {speechSettings.enabled && (
              <div className="voice-options">
                <label className="voice-radio">
                  <input
                    type="radio"
                    checked={!speechSettings.repeatEnabled}
                    onChange={() => void updateSpeech({ repeatEnabled: false })}
                  />
                  <span>{t('speakOnce')}</span>
                </label>
                <label className="voice-radio">
                  <input
                    type="radio"
                    checked={speechSettings.repeatEnabled}
                    onChange={() => void updateSpeech({ repeatEnabled: true })}
                  />
                  <span>{t('repeatEvery')}</span>
                </label>
                {speechSettings.repeatEnabled && (
                  <label className="interval-field">
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={repeatInput}
                      onChange={(event) => handleRepeatInput(event.target.value)}
                      onBlur={handleRepeatBlur}
                    />
                    <select
                      value={speechSettings.repeatUnit}
                      onChange={(event) =>
                        void updateSpeech({
                          repeatUnit: event.target.value as SpeechRepeatUnit
                        })
                      }
                    >
                      <option value="second">{t('secondsUnit')}</option>
                      <option value="minute">{t('minutesUnit')}</option>
                    </select>
                  </label>
                )}
              </div>
            )}
            <button
              type="button"
              className="lang-toggle"
              onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
            >
              {language === 'en' ? '中文' : 'English'}
            </button>
          </div>
        </div>
        <p>{t('headerSubtitle')}</p>
      </header>

      <Composer onCreated={() => void refresh()} />

      {loadError && (
        <p className="error">
          {t('loadFailedPrefix')}
          {loadError}
        </p>
      )}
      {loading ? (
        <p className="hint">{t('loading')}</p>
      ) : (
        <>
          <div className="status-tabs" role="tablist">
            <button
              type="button"
              className={view === 'upcoming' ? 'status-tab active' : 'status-tab'}
              onClick={() => setView('upcoming')}
            >
              {t('tabUpcoming')}
            </button>
            <button
              type="button"
              className={view === 'completed' ? 'status-tab active' : 'status-tab'}
              onClick={() => setView('completed')}
            >
              {t('tabCompleted')}
              <span className="tab-count">{completedReminders.length}</span>
            </button>
          </div>
          {view === 'upcoming' ? (
            <ReminderList reminders={upcomingReminders} onChange={() => void refresh()} />
          ) : (
            <ReminderList
              completed
              reminders={completedReminders}
              onChange={() => void refresh()}
            />
          )}
        </>
      )}
    </main>
  )
}
