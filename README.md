# Smart Reminder TS

An AI-powered desktop reminder agent. Type in plain language ("remind me to submit the weekly
report every Friday at 3pm") and the app schedules it for you with a native system notification.

## Stack

- Electron main process: local scheduling, system notifications, AI calls, JSON persistence
- Preload bridge: safe `contextBridge` API between the main process and the UI
- React + TypeScript renderer: modern UI built with Vite via [electron-vite](https://electron-vite.org)
- OpenAI-compatible API: natural-language parsing into structured reminders

## Project layout

```text
smart-reminder-ts/
├─ docs/
│  └─ architecture.md      # Architecture & data-flow description
├─ electron.vite.config.ts # Main / preload / renderer bundling
├─ src/
│  ├─ shared/
│  │  └─ types.ts          # Reminder model + IPC channel names shared by all layers
│  ├─ main/                # Electron main process (Node.js)
│  │  ├─ index.ts          # App lifecycle, window, IPC registration
│  │  ├─ store.ts          # Reminder persistence (JSON in userData)
│  │  ├─ scheduler.ts      # One-shot & repeating in-process timer engine
│  │  ├─ notifier.ts       # Native OS notifications
│  │  └─ ai.ts             # OpenAI-compatible natural language -> ReminderDraft
│  ├─ preload/
│  │  ├─ index.ts          # contextBridge API exposed as window.api
│  └─ renderer/            # React + TypeScript UI
│     ├─ index.html
│     └─ src/
│        ├─ App.tsx
│        ├─ components/    # Composer (AI/manual), ReminderList
│        ├─ api.d.ts       # Typed window.api surface for the renderer
│        └─ lib/format.ts
└─ package.json
```

## Getting started

Requirements: Node.js >= 18.19, npm.

```bash
npm install
cp .env.example .env   # then put your OPENAI_API_KEY into .env
npm run dev
```

No API key? Use the "手动添加" (manual) tab in the UI, or set one of these environment variables:

| Variable | Required | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | Yes (for AI mode) | Provider API key |
| `OPENAI_BASE_URL` | No | Switch to any OpenAI-compatible endpoint |
| `OPENAI_MODEL` | No | Defaults to `gpt-4o-mini` |

## Scripts

```bash
npm run dev          # Start the desktop app in development
npm run typecheck    # Type-check main/preload + renderer
npm run build        # Bundle main, preload and renderer into out/
npm run package      # Build distributable installers
```

## Security model

- Renderer has no Node.js access (`nodeIntegration: false`, `contextIsolation: true`, sandbox on)
- All privileged work (files, timers, network) lives in the main process behind typed IPC
- The API key is read only in the main process and never shipped to the renderer
- Reminder data is stored as JSON under Electron's `userData` directory

See [docs/architecture.md](docs/architecture.md) for the data flow and extension points.
