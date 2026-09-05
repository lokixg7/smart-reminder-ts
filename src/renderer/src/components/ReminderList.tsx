import type { Reminder } from '../../../shared/types'
import { formatDueAt, repeatLabel } from '../lib/format'

interface ReminderListProps {
  reminders: Reminder[]
  onChange: () => void
}

export function ReminderList({ reminders, onChange }: ReminderListProps): JSX.Element {
  async function toggle(reminder: Reminder): Promise<void> {
    await window.api.updateReminder(reminder.id, { enabled: !reminder.enabled })
    onChange()
  }

  async function remove(reminder: Reminder): Promise<void> {
    if (!window.confirm(`删除提醒“${reminder.title}”？`)) return
    await window.api.removeReminder(reminder.id)
    onChange()
  }

  if (reminders.length === 0) {
    return (
      <div className="empty panel">
        <p>还没有提醒</p>
        <span>用 AI 自然语言创建第一个提醒吧</span>
      </div>
    )
  }

  return (
    <ul className="reminder-list">
      {reminders.map((reminder) => (
        <li key={reminder.id} className={`reminder panel ${reminder.enabled ? '' : 'disabled'}`}>
          <div className="reminder-main">
            <h3>{reminder.title}</h3>
            <p className="reminder-time">
              {formatDueAt(reminder.dueAt)}
              <span className="repeat-badge">{repeatLabel(reminder.repeat)}</span>
            </p>
            {reminder.note && <p className="reminder-note">{reminder.note}</p>}
          </div>
          <div className="reminder-actions">
            <label className="switch">
              <input
                type="checkbox"
                checked={reminder.enabled}
                onChange={() => void toggle(reminder)}
              />
              <span>{reminder.enabled ? '已开启' : '已暂停'}</span>
            </label>
            <button className="ghost danger" onClick={() => void remove(reminder)} type="button">
              删除
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
