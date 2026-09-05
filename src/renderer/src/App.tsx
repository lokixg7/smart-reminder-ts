import { useCallback, useEffect, useState } from 'react'
import type { Reminder } from '../../shared/types'
import { Composer } from './components/Composer'
import { ReminderList } from './components/ReminderList'

export default function App(): JSX.Element {
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

  return (
    <main className="app">
      <header className="app-header">
        <h1>Smart Reminder</h1>
        <p>自然语言创建提醒，到点准时通知</p>
      </header>

      <Composer onCreated={() => void refresh()} />

      {loadError && <p className="error">加载失败：{loadError}</p>}
      {loading ? (
        <p className="hint">加载中…</p>
      ) : (
        <>
          <div className="section-title">
            <h2>提醒列表</h2>
            <span>{reminders.length} 条</span>
          </div>
          <ReminderList reminders={reminders} onChange={() => void refresh()} />
        </>
      )}
    </main>
  )
}
