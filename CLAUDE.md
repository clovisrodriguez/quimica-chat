# Quimica Chat — Project Context

## Architecture
- **Frontend:** React 18 + Vite + Tailwind CSS (`client/`)
- **Backend:** Express + OpenAI GPT streaming via SSE (`server/`)
- **AI tools:** `draw_molecule` (builds molecules in constructor), `show_bohr_model` (shows atomic structure)
- **Class mode:** 10-lesson curriculum with localStorage progress tracking
- **Tests:** Vitest + React Testing Library

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
- Run `npx vite build` and `npx vitest run` from `client/` to verify changes
- Keep changes minimal — don't over-engineer

## Contributing
Self-host with your own OpenAI API key. See README.md for setup.
