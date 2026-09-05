# Architecture

## Runtime layers

```text
┌────────────────────────────┐
│ React renderer (TS)        │  src/renderer
│ - natural-language input   │
│ - reminder list / toggles  │
└────────────┬───────────────┘
             │ contextBridge  window.api (typed IPC)
┌────────────▼───────────────┐
│ Preload (TS)               │  src/preload
│ thin invoke-only facade    │
└────────────┬───────────────┘
             │ ipcMain.handle
┌────────────▼───────────────┐
│ Electron main process      │  src/main
│ store → scheduler → notify │
│ store + AI parsing         │
└────────────────────────────┘
```

## Core flows

### Create with AI

1. User types "每周五下午 3 点提醒我交周报" in the composer.
2. Renderer calls `window.api.parseReminder(text)`.
3. Main calls the OpenAI-compatible API with a strict JSON schema prompt.
4. The validated `ReminderDraft` is shown for confirmation.
5. On confirm, `reminders:create` persists it and registers it with the scheduler.

### Fire a reminder

1. The in-process scheduler timer reaches the next occurrence.
2. Main shows a native notification; clicking it focuses the app window.
3. One-shot reminders are removed after firing; repeating reminders keep their timer and record
   `lastTriggeredAt`.

### Scheduler model

`nextOccurrence(reminder, from)` derives the next firing instant from `dueAt` + `repeat`:

- `none`: fire once if `dueAt` is still in the future
- `daily` / `weekly` / `monthly`: compute the next matching instant after now

Long delays are chunked to stay below Node's 24.8-day `setTimeout` ceiling, so far-future reminders
survive while the app process is running.

## Persistence

Reminders live in a plain JSON file at `app.getPath('userData')/reminders.json`. The store is the
single source of truth; the scheduler is rebuilt from it at every app start. Swap this module for
SQLite later without touching the renderer.

## Extension points

| Want to add | Where to change |
| --- | --- |
| Snooze / reschedule from notification | `src/main/scheduler.ts`, `src/main/notifier.ts` |
| SQLite / server sync | Replace `src/main/store.ts`, keep the same API |
| Categories / tags / mark complete | Extend the model in `src/shared/types.ts` + renderer |
| Tray + close-to-tray so reminders fire with no window | `src/main/index.ts` window lifecycle |
| Recurrence rules beyond daily/weekly/monthly | `nextOccurrence()` in `src/main/scheduler.ts` |
| Run at login | Electron `app.setLoginItemSettings()` in `src/main/index.ts` |
