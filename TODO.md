# TODO

## Next up
- [ ] Access control: SQLite + BMC webhook for membership gatekeeping
  - Email allow-list in SQLite
  - BMC webhook endpoint to add/remove members
  - Simple login screen (email-based)
  - Middleware to gate /api/chat
- [ ] Deploy live (Vercel for frontend, Railway/Render for backend)

## Curriculum improvements
- [ ] Improve Bohr model interactivity (lesson 1-2 still need polish)
- [ ] Add nomenclature practice exercises (repetitive drills with AI feedback)
- [ ] Add formula writing exercises (structural formula ↔ molecular formula)
- [ ] Make exercises more interactive — AI checks student work in the constructor
- [ ] Lesson 8 (concentraciones) needs more practice problems

## Features
- [ ] Nomenclature drill mode: AI gives a structure, student names it (and vice versa)
- [ ] Formula practice: convert between IUPAC name ↔ structure ↔ molecular formula
- [ ] Export/share progress
- [ ] Mobile responsiveness polish

## Tech debt
- [ ] Extract shared SSE streaming logic from Chat.jsx and LessonChat.jsx into a hook
- [ ] Add tests for ClassMode, LessonList, LessonChat components
