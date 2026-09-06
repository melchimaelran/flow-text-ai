# Flow Text AI

Universal AI writing overlay for Linux.

Press a global hotkey from **any** application, capture the current text, transform
it with an LLM, and inject the result straight back where you were typing — no
copy‑pasting between windows.

## Features

- **Global hotkey overlay** — `Ctrl+Shift+Space` opens a floating command bar over
  the focused app. It grabs the selected text (via `xdotool` + clipboard), runs
  the transform, and pastes the output back into the original window.
- **Slash commands** — `/fix`, `/rewrite`, `/shorten`, `/expand`, `/continue`,
  `/add emoji`, `/tone pro`, `/tone casual`, `/tone formal`. Any trailing text
  after a command is appended as an extra instruction.
- **Custom commands** — define your own `/slash` shortcuts with a saved prompt.
- **Speech‑to‑text** — dictate instead of typing; audio is transcribed with
  Whisper.
- **Context menu + tray** — quick access without the keyboard.
- **Local, encrypted key storage** — the API key is stored with Electron
  `safeStorage` (`electron-store`), never in plain text.

## Stack

Electron 36 · React 19 · TypeScript · Vite (via `electron-vite`) · Tailwind v4 ·
Zustand · [Groq](https://groq.com) API through the `openai` SDK
(`openai/gpt-oss-120b` for text, `whisper-large-v3` for transcription).

## Requirements

- **Ubuntu 24 / X11** — text capture and injection use `xdotool`, which does not
  work under Wayland.
- **Node 24** (see `.nvmrc`) and **pnpm**.
- `xdotool`:

  ```bash
  sudo apt install xdotool
  ```

  The app shows a warning on startup if it is missing.

## Getting started

```bash
pnpm install

cp .env.example .env
# set GROQ_API_KEY in .env for development
# get a free key at https://console.groq.com

pnpm -w run dev
```

The `-w` flag is required on every script because the repo declares a
`pnpm-workspace.yaml`.

### API key

- **Development** — read from `.env` (`GROQ_API_KEY`).
- **Production** — entered by the user in the in‑app Settings screen and stored
  encrypted on disk.

## Build

```bash
pnpm -w run build:linux
```

Produces an AppImage and a `.deb` in `dist/`.

Other scripts:

| Script | Purpose |
|---|---|
| `pnpm -w run typecheck` | Type‑check main / node / web configs |
| `pnpm -w run lint` | ESLint over `src` |
| `pnpm -w run build` | Compile without packaging |

## Architecture

Three isolated processes plus a shared types module:

| Path | Role |
|---|---|
| `src/main/` | Node.js — global hotkey, `xdotool`, clipboard, AI calls, IPC handlers |
| `src/preload/` | `contextBridge` — exposes a typed `window.api` to the renderer |
| `src/renderer/` | React UI only, no direct system access |
| `src/shared/` | Types and the IPC contract shared across processes |

The renderer talks to the main process over a small set of IPC channels
(`ai:transform`, `clipboard:capture`, `injection:inject`, `config:*`, …) defined
in `src/shared/ipc-contracts.ts`.

## Known limitations

- **X11 only.** Wayland support is not implemented.
- **`electron-store` is pinned to v8.x** — v10+ is ESM‑only and incompatible with
  the CommonJS main process.

## License

MIT — see [LICENSE](LICENSE).
