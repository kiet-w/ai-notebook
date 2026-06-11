# GEMINI Frontend Rules

## 1. Project Overview
This is the frontend component of the Secondary Brain application, built with Next.js App Router, Tailwind CSS, and TypeScript.

## 2. Frontend Architecture Rules (CRITICAL: MUST FOLLOW)
Whenever Gemini edits, refactors, or creates components in the frontend, you **MUST STRICTLY** adhere to the following **Atomic Design** and **App Router** guidelines:

### A. Atomic Design Methodology (`src/components/`)
Do not place components flatly inside `src/components/`. All components MUST be categorized into:
- **`atoms/`**: Basic, indivisible UI elements (e.g., `Button.tsx`, `Input.tsx`, `Badge.tsx`, `Icon.tsx`).
- **`molecules/`**: Simple combinations of atoms (e.g., `NoteInput.tsx`, `CategoryLink.tsx`).
- **`organisms/`**: Complex UI sections composing molecules and atoms (e.g., `Sidebar.tsx`, `NoteCard.tsx`, `NoteList.tsx`).
- **`templates/`**: Page layout wrappers that arrange organisms but do not fetch or inject data directly (e.g., `MainTemplate.tsx`).

### B. Next.js App Router (`src/app/`)
The `@app` directory must strictly handle routing and composition:
- **`layout.tsx`**: Used for global wrappers, providers, and injecting `templates/`.
- **`page.tsx`**: Acts as the data-fetching entry point and passes props down to organisms/templates.
- **Routing**: Use folder-based routing. Do not place raw UI logic directly in route files; import them from `src/components/`.

## 3. Styling and Types
- Always use **Tailwind CSS** for styling (no custom CSS files unless globally required like `globals.css`).
- Always use **TypeScript** and define explicit interfaces/types in `src/types/`.
