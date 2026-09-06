import type { Reminder } from '../../../shared/types'
import { formatDueAt, repeatLabel } from '../lib/format'
import { useI18n } from '../i18n'

interface ReminderListProps {
  reminders: Reminder[]
  onChange: () => void
  completed?: boolean
}

export function ReminderList({
  reminders,
  onChange,
  completed = false
}: ReminderListProps): JSX.Element {
  const { language, t } = useI18n()

  async function toggle(reminder: Reminder): Promise<void> {
    await window.api.updateReminder(reminder.id, { enabled: !reminder.enabled })
    onChange()
  }

  async function remove(reminder: Reminder): Promise<void> {
    if (!window.confirm(t('deleteConfirm', { title: reminder.title }))) return
    await window.api.removeReminder(reminder.id)
    onChange()
  }

  async function restore(reminder: Reminder): Promise<void> {
    await window.api.updateReminder(reminder.id, { completedAt: null })
    onChange()
  }

  if (reminders.length === 0) {
    return (
      <div className="empty panel">
        {completed ? (
          <>
            <p>{t('noCompletedTitle')}</p>
            <span>{t('noCompletedHint')}</span>
          </>
        ) : (
          <>
            <p>{t('emptyTitle')}</p>
            <span>{t('emptyHint')}</span>
          </>
        )}
      </div>
    )
  }

  return (
    <ul className="reminder-list">
      {reminders.map((reminder) => (
        <li
          key={reminder.id}
          className={`reminder panel ${completed ? 'completed' : ''} ${
            reminder.enabled ? '' : 'disabled'
          }`}
        >
          <div className="reminder-main">
            <h3>{reminder.title}</h3>
            <p className="reminder-time">
              {formatDueAt(reminder.dueAt, language)}
              <span className="repeat-badge">{repeatLabel(reminder.repeat, language)}</span>
            </p>
            {reminder.note && <p className="reminder-note">{reminder.note}</p>}
            {completed && reminder.completedAt && (
              <p className="reminder-note">
                {t('completedLabel')}:{' '}
                {new Date(reminder.completedAt).toLocaleString(
                  language === 'zh' ? 'zh-CN' : 'en-US'
                )}
              </p>
            )}
          </div>
          <div className="reminder-actions">
            {completed ? (
              <button className="ghost" onClick={() => void restore(reminder)} type="button">
                {t('restoreAction')}
              </button>
            ) : (
              <label className="switch">
                <input
                  type="checkbox"
                  checked={reminder.enabled}
                  onChange={() => void toggle(reminder)}
                />
                <span>{reminder.enabled ? t('enabled') : t('paused')}</span>
              </label>
            )}
            <button className="ghost danger" onClick={() => void remove(reminder)} type="button">
              {t('deleteAction')}
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
