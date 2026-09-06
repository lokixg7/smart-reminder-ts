import { execFile, type ChildProcess } from 'node:child_process'

let activeSpeech: ChildProcess | null = null

/**
 * Speaks text aloud using the platform voice.
 * macOS uses the built-in `say` command; other platforms are logged for now.
 */
export function speakText(text: string): void {
  const content = text.replace(/\s+/g, ' ').trim()
  if (!content) return

  if (process.platform !== 'darwin') {
    console.warn(`[speech] text-to-speech is not implemented on ${process.platform}`)
    return
  }

  if (activeSpeech) activeSpeech.kill()

  console.log(`[speech] speaking: ${content}`)
  activeSpeech = execFile(
    '/usr/bin/say',
    ['-v', 'Meijia', content],
    { timeout: 60_000 },
    (error) => {
      if (error) console.error('[speech] failed:', error.message)
      activeSpeech = null
    }
  )
}
