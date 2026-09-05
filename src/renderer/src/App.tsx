import { useCallback, useEffect, useState } from 'react'
import type { Reminder } from '../../shared/types'
import { Composer } from './components/Composer'
import { ReminderList } from './components/ReminderList'
import { useI18n } from './i18n'

export default function App(): JSX.Element {
  const { language, setLanguage, t } = useI18n()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

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

  const countLabel =
    language === 'en'
      ? `${reminders.length} reminder${reminders.length === 1 ? '' : 's'}`
      : `${reminders.length} 条`

  return (
    <main className="app">
      <header className="app-header">
        <div className="header-row">
          <h1>Smart Reminder</h1>
          <button
            type="button"
            className="lang-toggle"
            onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
          >
            {language === 'en' ? '中文' : 'English'}
          </button>
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
