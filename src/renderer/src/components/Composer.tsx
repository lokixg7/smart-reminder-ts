import { useState } from 'react'
import type { ReminderDraft } from '../../../shared/types'
import { formatDueAt, repeatLabel } from '../lib/format'
import { useI18n } from '../i18n'

type ComposerMode = 'ai' | 'manual'

interface ComposerProps {
  onCreated: () => void
}

export function Composer({ onCreated }: ComposerProps): JSX.Element {
  const { language, t } = useI18n()
  const [mode, setMode] = useState<ComposerMode>('ai')
  const [text, setText] = useState('')
  const [aiBusy, setAiBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<ReminderDraft | null>(null)
  const [error, setError] = useState('')

  const [manualTitle, setManualTitle] = useState('')
  const [manualDue, setManualDue] = useState('')

  async function handleAiParse(): Promise<void> {
    const trimmed = text.trim()
    if (!trimmed) return

    setError('')
    setAiBusy(true)
    const result = await window.api.parseReminder(trimmed)
    setAiBusy(false)

    if (result.ok) {
      setDraft(result.draft)
      setText('')
    } else {
      setError(result.error)
    }
  }

  async function create(draftToCreate: ReminderDraft): Promise<void> {
    setSaving(true)
    setError('')

    const result = await window.api.createReminder(draftToCreate)
    setSaving(false)

    if (result.ok) {
      setDraft(null)
      setManualTitle('')
      setManualDue('')
      onCreated()
    } else {
      setError(result.error)
    }
  }

  async function handleManualCreate(): Promise<void> {
    const title = manualTitle.trim()
    if (!title || !manualDue) {
      setError(t('errorFillTitleAndTime'))
      return
    }

    const due = new Date(manualDue)
    if (Number.isNaN(due.getTime())) {
      setError(t('errorInvalidTime'))
      return
    }

    await create({ title, dueAt: due.toISOString(), repeat: 'none' })
  }

  return (
    <section className="composer panel">
      <div className="tabs" role="tablist">
        <button
          className={mode === 'ai' ? 'tab active' : 'tab'}
          onClick={() => setMode('ai')}
          type="button"
        >
          {t('tabAi')}
        </button>
        <button
          className={mode === 'manual' ? 'tab active' : 'tab'}
          onClick={() => setMode('manual')}
          type="button"
        >
          {t('tabManual')}
        </button>
      </div>

      {mode === 'ai' ? (
        <div className="composer-body">
          {draft ? (
            <div className="draft">
              <p className="draft-title">{draft.title}</p>
              <p className="draft-meta">
                {formatDueAt(draft.dueAt, language)}
                {(draft.repeat ?? 'none') !== 'none' &&
                  ` · ${repeatLabel(draft.repeat ?? 'none', language)}`}
              </p>
              {draft.note && <p className="draft-note">{draft.note}</p>}
              <div className="row">
                <button
                  className="primary"
                  disabled={saving}
                  onClick={() => void create(draft)}
                  type="button"
                >
                  {saving ? t('adding') : t('confirmAdd')}
                </button>
                <button
                  className="ghost"
                  disabled={saving}
                  onClick={() => setDraft(null)}
                  type="button"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          ) : (
            <>
              <textarea
                rows={2}
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder={t('aiPlaceholder')}
              />
              <button
                className="primary"
                disabled={aiBusy || !text.trim()}
                onClick={() => void handleAiParse()}
                type="button"
              >
                {aiBusy ? t('aiParsing') : t('aiParse')}
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="composer-body">
          <input
            value={manualTitle}
            onChange={(event) => setManualTitle(event.target.value)}
            placeholder={t('manualTitlePlaceholder')}
          />
          <div className="row">
            <input
              type="datetime-local"
              value={manualDue}
              onChange={(event) => setManualDue(event.target.value)}
            />
            <button
              className="primary"
              disabled={saving}
              onClick={() => void handleManualCreate()}
              type="button"
            >
              {saving ? t('adding') : t('manualAdd')}
            </button>
          </div>
        </div>
      )}

      {error && <p className="error">{error}</p>}
    </section>
  )
}
