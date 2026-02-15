# Journal

## Session 1 — 2026-02-15

### What we built
- **Class Mode (Modo Clase):** Full 10-lesson structured curriculum
  - `curriculum.js` — 10 lessons with topic-specific system prompts
  - `progress.js` — localStorage progress tracking with linear unlocking
  - `ClassMode.jsx` — orchestrator (curriculum list ↔ lesson chat)
  - `LessonList.jsx` — card list with progress bar, lock/complete states
  - `LessonChat.jsx` — lesson chat with exercise banners, auto-greeting
- **Mode toggle** in header (Chat IA / Modo Clase)
- **Server:** accepts optional `systemPrompt` in request body
- **`show_bohr_model` tool:** AI can display interactive Bohr model in constructor
  - New tool definition on server
  - Full-screen Bohr overlay in MoleculeBuilder with labeled shells
  - Wired through Chat, LessonChat, ClassMode, App
- **GitHub repo:** published at github.com/clovisrodriguez/quimica-chat (MIT)
- **README.md** in Spanish

### Bugs fixed
- Auto-sent "Comencemos la leccion" was showing as visible user bubble → split visible messages from API history using `apiMessagesRef`
- Initial lesson greeting was off-topic (generic organic chem instead of Bohr model) → included lesson title in hidden init message
- Tests broke due to duplicate "Chat IA" text (header toggle + mobile tab) → updated selectors

### Decisions
- Monetization: BMC membership at ~$3/month, SQLite allow-list for access control
- Self-hosted (free/BYOK) vs hosted (paid, server key) — no BYOK on hosted version
- Value prop: replace the tutor feedback loop for repetitive practice (nomenclature, formulas)

### Next session
- Implement SQLite + BMC webhook gatekeeping
- Deploy live
- Start on nomenclature drill exercises
