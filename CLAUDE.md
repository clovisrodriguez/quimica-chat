# Quimica Chat — Project Context for Claude

## What is this?
Interactive organic chemistry tutor (Spanish) with AI + visual molecule builder. Targets students who struggle with the repetitive practice side of chemistry (nomenclature, formulas, exercises) — replacing the feedback loop that normally requires a tutor or waiting for office hours.

## Architecture
- **Frontend:** React 18 + Vite + Tailwind CSS (`client/`)
- **Backend:** Express + OpenAI GPT streaming via SSE (`server/`)
- **AI tools:** `draw_molecule` (builds molecules in constructor), `show_bohr_model` (shows atomic structure)
- **Class mode:** 10-lesson curriculum with localStorage progress tracking
- **Tests:** Vitest + React Testing Library (162 tests)

## Key files
- `server/index.js` — API endpoint, system prompts, tool definitions
- `client/src/App.jsx` — main layout, mode toggle (Chat IA / Modo Clase)
- `client/src/components/Chat.jsx` — free chat with SSE streaming
- `client/src/components/LessonChat.jsx` — lesson chat (hidden init message, separate API/visible message history)
- `client/src/components/MoleculeBuilder.jsx` — visual editor + focused Bohr overlay
- `client/src/data/curriculum.js` — 10 lessons with system prompts + TOOL_INSTRUCTIONS
- `client/src/data/progress.js` — localStorage helpers for lesson progress

## Conventions
- All UI text in Spanish
- No emojis in code unless user requests
- Keep changes minimal — don't over-engineer
- Run `npx vite build` and `npx vitest run` from `client/` to verify changes

## Session tracking
- See [JOURNAL.md](./JOURNAL.md) for session-by-session log
- See [TODO.md](./TODO.md) for upcoming work
