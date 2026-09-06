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
    void window.api.getSpeechSettings().then(setSpeechSettings)
  }, [])

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

  const countLabel =
    language === 'en'
      ? `${reminders.length} reminder${reminders.length === 1 ? '' : 's'}`
      : `${reminders.length} 条`

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
              <span>{t('readAloud')}</span>
            </label>
            <label className="switch speech-toggle">
              <input
                type="checkbox"
                disabled={!speechSettings.enabled}
                checked={speechSettings.repeatEnabled}
                onChange={() =>
                  void updateSpeech({ repeatEnabled: !speechSettings.repeatEnabled })
                }
              />
              <span>{t('repeatVoice')}</span>
            </label>
            {speechSettings.enabled && speechSettings.repeatEnabled && (
              <label className="interval-field">
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={speechSettings.repeatInterval}
                  onChange={(event) => {
                    const minutes = Number(event.target.value)
                    if (Number.isInteger(minutes) && minutes >= 1) {
                      void updateSpeech({ repeatInterval: minutes })
                    }
                  }}
                />
                <select
                  value={speechSettings.repeatUnit}
                  onChange={(event) =>
                    void updateSpeech({ repeatUnit: event.target.value as SpeechRepeatUnit })
                  }
                >
                  <option value="second">{t('secondsUnit')}</option>
                  <option value="minute">{t('minutesUnit')}</option>
                </select>
              </label>
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
          <div className="section-title">
            <h2>{t('remindersTitle')}</h2>
            <span>{countLabel}</span>
          </div>
          <ReminderList reminders={reminders} onChange={() => void refresh()} />
        </>
      )}
    </main>
  )
}
