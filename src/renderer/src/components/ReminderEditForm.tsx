import { useState } from 'react'
import type {
  Reminder,
  ReminderUpdate,
  RepeatRule
} from '../../../shared/types'
import { useI18n } from '../i18n'

interface ReminderEditFormProps {
  reminder: Reminder
  onCancel: () => void
  onSaved: () => void
}

function toDatetimeLocal(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

export function ReminderEditForm({
  reminder,
  onCancel,
  onSaved
}: ReminderEditFormProps): JSX.Element {
  const { t } = useI18n()
  const [title, setTitle] = useState(reminder.title)
  const [note, setNote] = useState(reminder.note)
  const [due, setDue] = useState(toDatetimeLocal(reminder.dueAt))
  const [repeat, setRepeat] = useState<RepeatRule>(reminder.repeat)
  const [repeatWeekday, setRepeatWeekday] = useState<number | undefined>(
    reminder.repeatWeekday
  )
  const [advanceMinutes, setAdvanceMinutes] = useState(
    String(reminder.advanceMinutes ?? 0)
  )
  const [enabled, setEnabled] = useState(reminder.enabled)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave(): Promise<void> {
    if (!title.trim() || !due) {
      setError(t('errorFillTitleAndTime'))
      return
    }

    const dueDate = new Date(due)
    if (Number.isNaN(dueDate.getTime())) {
      setError(t('errorInvalidTime'))
      return
    }

    const advance = Number(advanceMinutes)
    const patch: ReminderUpdate = {
      title: title.trim(),
      note: note.trim(),
      dueAt: dueDate.toISOString(),
      repeat,
      advanceMinutes: Number.isInteger(advance) && advance >= 0 ? advance : 0,
      enabled
    }

    if (repeat === 'weekly' && repeatWeekday !== undefined) {
      patch.repeatWeekday = repeatWeekday
    } else {
      patch.repeatWeekday = null
    }

    setSaving(true)
    setError('')
    const result = await window.api.updateReminder(reminder.id, patch)
    setSaving(false)

    if (result.ok) {
      onSaved()
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="reminder-edit-form">
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder={t('manualTitlePlaceholder')}
      />
      <textarea
        rows={2}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder={t('notePlaceholder')}
      />
      <div className="edit-form-row">
        <input
          type="datetime-local"
          value={due}
          onChange={(event) => setDue(event.target.value)}
        />
      </div>
      <div className="edit-form-row">
        <select
          value={repeat}
          onChange={(event) => {
            const nextRepeat = event.target.value as RepeatRule
            setRepeat(nextRepeat)
            if (nextRepeat !== 'weekly') setRepeatWeekday(undefined)
          }}
        >
          <option value="none">{t('repeatNone')}</option>
          <option value="daily">{t('repeatDaily')}</option>
          <option value="weekly">{t('repeatWeekly')}</option>
          <option value="monthly">{t('repeatMonthly')}</option>
        </select>
        {repeat === 'weekly' && (
          <select
            value={repeatWeekday ?? ''}
            onChange={(event) => {
              const value = event.target.value
              setRepeatWeekday(value === '' ? undefined : Number(value))
            }}
          >
            <option value="">{t('weekdaySame')}</option>
            <option value={1}>{t('weekdayMonday')}</option>
            <option value={2}>{t('weekdayTuesday')}</option>
            <option value={3}>{t('weekdayWednesday')}</option>
            <option value={4}>{t('weekdayThursday')}</option>
            <option value={5}>{t('weekdayFriday')}</option>
            <option value={6}>{t('weekdaySaturday')}</option>
            <option value={7}>{t('weekdaySunday')}</option>
          </select>
        )}
        <label className="advance-field">
          <span>{t('advanceLabel')}</span>
          <input
            type="number"
            min={0}
            step={1}
            value={advanceMinutes}
            onChange={(event) => setAdvanceMinutes(event.target.value)}
          />
          <span>{t('minutesUnit')}</span>
        </label>
      </div>
      <label className="switch edit-enabled">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
        />
        <span>{enabled ? t('enabled') : t('paused')}</span>
      </label>
      <div className="edit-form-row">
        <button
          type="button"
          className="primary"
          disabled={saving}
          onClick={() => void handleSave()}
        >
          {saving ? t('saving') : t('saveAction')}
        </button>
        <button
          type="button"
          className="ghost"
          disabled={saving}
          onClick={onCancel}
        >
          {t('cancel')}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </div>
  )
}
