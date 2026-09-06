import 'dotenv/config'
import OpenAI from 'openai'
import type { ParseReminderResult, ReminderDraft, RepeatRule } from '../shared/types'

interface AiConfig {
  apiKey: string | undefined
  baseURL: string | undefined
  model: string
}

function readConfig(): AiConfig {
  return {
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini'
  }
}

function toDraft(value: unknown): ReminderDraft | null {
  if (typeof value !== 'object' || value === null) return null

  const record = value as Record<string, unknown>
  const title = typeof record.title === 'string' ? record.title.trim() : ''
  const dueAt = typeof record.dueAt === 'string' ? record.dueAt : ''
  const repeat = typeof record.repeat === 'string' ? record.repeat : 'none'
  const advanceMinutes =
    typeof record.advanceMinutes === 'number' &&
    Number.isInteger(record.advanceMinutes) &&
    record.advanceMinutes >= 0
      ? record.advanceMinutes
      : undefined

  if (!title || Number.isNaN(Date.parse(dueAt))) return null
  if (!['none', 'daily', 'weekly', 'monthly'].includes(repeat)) return null

  const draft: ReminderDraft = {
    title,
    note: typeof record.note === 'string' ? record.note.trim() : undefined,
    dueAt: new Date(dueAt).toISOString(),
    repeat: repeat as RepeatRule
  }
  if (advanceMinutes !== undefined) draft.advanceMinutes = advanceMinutes
  return draft
}

export async function parseReminderWithAI(text: string): Promise<ParseReminderResult> {
  const { apiKey, baseURL, model } = readConfig()
  if (!apiKey) {
    return {
      ok: false,
      error: 'OPENAI_API_KEY is not set. Copy .env.example to .env and add your key.'
    }
  }

  const client = new OpenAI({ apiKey, baseURL })
  const now = new Date().toString()
  const systemPrompt = [
    'You are the scheduling engine of a desktop reminder app.',
    'Convert the user message into ONE reminder and return ONLY valid JSON.',
    'Use this JSON schema:',
    '{"title": string, "dueAt": ISO-8601 string, "repeat": "none"|"daily"|"weekly"|"monthly", "note"?: string, "advanceMinutes"?: integer >= 0}',
    `Current local time: ${now}`,
    'Interpret dates and times using the user local timezone. Never invent a title.',
    'When the user says "every Friday at 3pm", repeat is "weekly" and dueAt is the next Friday 15:00.',
    'When the user asks to be reminded N minutes early, set advanceMinutes to N; otherwise omit it.'
  ].join('\n')

  try {
    const response = await client.chat.completions.create({
      model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ]
    })

    const content = response.choices[0]?.message.content
    if (!content) return { ok: false, error: 'The model returned an empty response.' }

    const draft = toDraft(JSON.parse(content) as unknown)
    if (!draft) return { ok: false, error: 'The model response could not be parsed into a valid reminder.' }

    return { ok: true, draft }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { ok: false, error: `AI request failed: ${message}` }
  }
}
