# AI Notebook - Changelog

## 🚀 Recent Updates

### Backend: Flexible AI & OpenRouter Integration
- **Flexible Note Structure:** Refactored `AiService` to generate structure based on Category (e.g., `TECH` uses 5W1H, `COOKING` uses Ingredients & Steps).
- **Detail Level (Short/Medium/Long):** Added dynamic content length adjustments during note creation.
- **Parallel Processing (`analyzeFast`):** Reduced response time by fetching structured metadata and generating long-form markdown concurrently when the category is known.
- **OpenRouter Support:** Fully integrated `nemotron-3-ultra-550b-a55b:free` (using `sk-or-v1-` API keys).
- **APIs Updated:** Added `detailLevel` parameter to `CreateNoteDto` and `/notes/upload` endpoints.

### Frontend: UI/UX & Reliability Improvements
- **Grid Layout Updates:** Hover popup in `NoteCard` updated to a dynamic 2x2 layout.
- **Next.js Image Proxy Fix:** Removed `next/image` proxy (which caused `received null` errors for uploaded assets on dev server) and replaced it with standard native `<img>` tags (`loading="lazy"`).
- **Memory Leak Fix:** Resolved `URL.createObjectURL` object retention leak in `NoteInput.tsx` using `useEffect` for lifecycle cleanup.
- **Buffered Image Input:** Upload previews are now retained until the user explicitly hits enter/submit.
- **New Features (Staged):** Scaffolding for WebSockets authentication and frame components.
